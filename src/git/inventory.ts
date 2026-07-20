import { createHash, randomBytes } from 'node:crypto';

import { ChangedFileSchema } from '../contracts/comparison.js';
import type {
  ChangedFile,
  ChangedFileStatusKind,
} from '../contracts/comparison.js';
import type { ExactPath } from '../domain/path-bytes.js';
import { joinDiffStats, parseNumstat } from './numstat.js';
import { parseRawDiff } from './raw-diff.js';
import type { RawDiffRecord } from './raw-diff.js';
import { createGitRunner } from './runner.js';
import type { GitRunner } from './runner.js';

export type {
  ChangedFile,
  ChangedFileStatus,
  ChangedFileStatusKind,
} from '../contracts/comparison.js';

export interface CreateChangedFileInventoryOptions {
  readonly repositoryRoot: string;
  readonly mergeBaseOid: string;
  readonly headOid: string;
  readonly objectFormat: 'sha1' | 'sha256';
  readonly signal?: AbortSignal;
  readonly fileIdNamespace?: Uint8Array;
}

export interface ChangedFileInventoryDependencies {
  readonly runner?: GitRunner;
}

const processFileIdNamespace = randomBytes(32);
const knownModes: Readonly<Record<string, true>> = Object.freeze({
  '000000': true,
  '040000': true,
  '100644': true,
  '100755': true,
  '120000': true,
  '160000': true,
});
const statusKindByCode: Readonly<
  Partial<Record<string, ChangedFileStatusKind>>
> = Object.freeze({
  A: 'added',
  C: 'copied',
  D: 'deleted',
  M: 'modified',
  R: 'renamed',
  T: 'type-changed',
});

const sharedDiffOptions = [
  '-z',
  '--find-renames=50%',
  '--find-copies=50%',
  '--find-copies-harder',
  '--no-ext-diff',
  '--no-textconv',
] as const;

function recordIdentity(record: RawDiffRecord): string {
  return JSON.stringify([
    record.status,
    record.similarity,
    record.oldMode,
    record.newMode,
    record.oldBlobOid,
    record.newBlobOid,
    ...record.paths.map((path) => path.bytesBase64url),
  ]);
}

function opaqueFileId(namespace: Uint8Array, record: RawDiffRecord): string {
  const digest = createHash('sha256')
    .update(namespace)
    .update(Buffer.from([0]))
    .update(recordIdentity(record), 'ascii')
    .digest('base64url');
  return `file_${digest}`;
}

function validateObjectFormat(
  record: RawDiffRecord,
  objectFormat: 'sha1' | 'sha256',
): void {
  const expectedLength = objectFormat === 'sha1' ? 40 : 64;
  if (
    record.oldBlobOid.length !== expectedLength ||
    record.newBlobOid.length !== expectedLength
  ) {
    throw new Error(
      `Raw diff object ID length does not match repository ${objectFormat} format`,
    );
  }
}

function unsupportedReason(record: RawDiffRecord): string | undefined {
  const reasons: string[] = [];
  if (statusKindByCode[record.status] === undefined) {
    reasons.push(`status ${record.status}`);
  }
  if (knownModes[record.oldMode] !== true) {
    reasons.push(`mode ${record.oldMode}`);
  }
  if (knownModes[record.newMode] !== true) {
    reasons.push(`mode ${record.newMode}`);
  }
  return reasons.length === 0
    ? undefined
    : `Unsupported Git ${reasons.join(' and ')}`;
}

function inventoryPaths(record: RawDiffRecord): {
  readonly oldPath?: ExactPath;
  readonly newPath?: ExactPath;
} {
  if (record.paths.length === 2) {
    return { oldPath: record.paths[0], newPath: record.paths[1] };
  }
  const path = record.paths[0];
  return {
    ...(record.oldMode === '000000' ? {} : { oldPath: path }),
    ...(record.newMode === '000000' ? {} : { newPath: path }),
  };
}

export async function createChangedFileInventory(
  options: CreateChangedFileInventoryOptions,
  dependencies: ChangedFileInventoryDependencies = {},
): Promise<readonly ChangedFile[]> {
  const runner = dependencies.runner ?? createGitRunner();
  const [rawResult, numstatResult] = await Promise.all([
    runner.run(
      [
        'diff',
        '--raw',
        sharedDiffOptions[0],
        '--no-abbrev',
        ...sharedDiffOptions.slice(1),
        options.mergeBaseOid,
        options.headOid,
        '--',
      ],
      { cwd: options.repositoryRoot, signal: options.signal },
    ),
    runner.run(
      [
        'diff',
        '--numstat',
        ...sharedDiffOptions,
        options.mergeBaseOid,
        options.headOid,
        '--',
      ],
      { cwd: options.repositoryRoot, signal: options.signal },
    ),
  ]);

  const joined = joinDiffStats(
    parseRawDiff(rawResult.stdout),
    parseNumstat(numstatResult.stdout),
  );
  const namespace = options.fileIdNamespace ?? processFileIdNamespace;
  if (namespace.byteLength === 0) {
    throw new RangeError('File ID namespace must not be empty');
  }

  const files = joined.map(({ diff, stats }) => {
    validateObjectFormat(diff, options.objectFormat);
    const reason = unsupportedReason(diff);
    return ChangedFileSchema.parse({
      id: opaqueFileId(namespace, diff),
      status: {
        code: diff.status,
        kind: reason === undefined
          ? statusKindByCode[diff.status]
          : 'unsupported',
        similarity: diff.similarity,
      },
      oldMode: diff.oldMode,
      newMode: diff.newMode,
      oldBlobOid: diff.oldBlobOid,
      newBlobOid: diff.newBlobOid,
      ...inventoryPaths(diff),
      additions: stats.additions,
      deletions: stats.deletions,
      ...(reason === undefined ? {} : { unsupportedReason: reason }),
    });
  });
  return Object.freeze(files);
}
