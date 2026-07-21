import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import { dirname, join } from 'node:path';

import {
  ReviewDraftV1Schema,
  type ReviewDraftCommentV1,
  type ReviewDraftV1,
} from '../contracts/draft.js';
import type { DurableAnchorV1 } from '../domain/anchor.js';
import { comparisonKey } from '../domain/comparison-key.js';

export type DraftComparison = Readonly<{
  readonly baseCommitOid: string;
  readonly headCommitOid: string;
  readonly mergeBaseOid: string;
}>;

export type DraftFileHandle = Readonly<{
  writeFile(bytes: Uint8Array): Promise<void>;
  sync(): Promise<void>;
  close(): Promise<void>;
}>;

export type DraftFileSystem = Readonly<{
  readFile(path: string): Promise<Buffer>;
  mkdir(path: string): Promise<void>;
  open(path: string, flags: 'wx', mode: number): Promise<DraftFileHandle>;
  rename(from: string, to: string): Promise<void>;
  unlink(path: string): Promise<void>;
  syncDirectory(path: string): Promise<void>;
}>;

export class DraftStoreError extends Error {}
export class DraftConflictError extends DraftStoreError {}

const queues = new Map<string, Promise<unknown>>();
const draftsDirectory = '.diff-review/drafts';

const nodeFileSystem: DraftFileSystem = {
  readFile: async (path) => fs.readFile(path),
  mkdir: async (path) => {
    await fs.mkdir(path, { recursive: true });
  },
  open: async (path, flags, mode) => {
    const handle = await fs.open(path, flags, mode);
    return {
      writeFile: async (bytes) => handle.writeFile(bytes),
      sync: async () => handle.sync(),
      close: async () => handle.close(),
    };
  },
  rename: async (from, to) => fs.rename(from, to),
  unlink: async (path) => fs.unlink(path),
  syncDirectory: async (path) => {
    const handle = await fs.open(path, 'r');
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
  },
};

function isMissing(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

function isUnsupportedDirectorySync(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error.code === 'EINVAL' || error.code === 'ENOTSUP' || error.code === 'EISDIR')
  );
}

function sameComparison(left: DraftComparison, right: DraftComparison): boolean {
  return (
    left.baseCommitOid === right.baseCommitOid &&
    left.headCommitOid === right.headCommitOid &&
    left.mergeBaseOid === right.mergeBaseOid
  );
}

function initialDraft(comparison: DraftComparison): ReviewDraftV1 {
  return ReviewDraftV1Schema.parse({
    schemaVersion: 1,
    comparison,
    revision: 0,
    summary: '',
    comments: [],
  });
}

function validateDraft(bytes: Buffer, comparison: DraftComparison): ReviewDraftV1 {
  let value: unknown;
  try {
    value = JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new DraftStoreError('Existing draft is invalid.');
  }
  const parsed = ReviewDraftV1Schema.safeParse(value);
  if (!parsed.success || !sameComparison(parsed.data.comparison, comparison)) {
    throw new DraftStoreError('Existing draft cannot be used for this comparison.');
  }
  return parsed.data;
}

async function runSerialized<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const prior = queues.get(key) ?? Promise.resolve();
  const current = prior.catch(() => undefined).then(operation);
  queues.set(key, current);
  try {
    return await current;
  } finally {
    if (queues.get(key) === current) {
      queues.delete(key);
    }
  }
}

export type DraftStore = Readonly<{
  load(): Promise<ReviewDraftV1>;
  add(input: Readonly<{ readonly body: string; readonly anchor: DurableAnchorV1 }>): Promise<
    Readonly<{ readonly comment: ReviewDraftCommentV1; readonly revision: number }>
  >;
}>;

export function createDraftStore(options: Readonly<{
  readonly repositoryRoot: string;
  readonly comparison: DraftComparison;
  readonly fileSystem?: DraftFileSystem;
}>): DraftStore {
  const fileSystem = options.fileSystem ?? nodeFileSystem;
  const key = comparisonKey(options.comparison.baseCommitOid, options.comparison.headCommitOid);
  const directory = join(options.repositoryRoot, draftsDirectory);
  const canonicalPath = join(directory, `${key}.json`);
  const queueKey = `${options.repositoryRoot}\u0000${key}`;

  const load = async (): Promise<ReviewDraftV1> => {
    try {
      return validateDraft(await fileSystem.readFile(canonicalPath), options.comparison);
    } catch (error) {
      if (isMissing(error)) {
        return initialDraft(options.comparison);
      }
      throw error;
    }
  };

  const commit = async (draft: ReviewDraftV1): Promise<void> => {
    const bytes = Buffer.from(`${JSON.stringify(draft)}\n`, 'utf8');
    const temporaryPath = join(directory, `.${key}.${randomUUID()}.tmp`);
    let handle: DraftFileHandle | undefined;
    let renamed = false;
    try {
      await fileSystem.mkdir(directory);
      handle = await fileSystem.open(temporaryPath, 'wx', 0o600);
      await handle.writeFile(bytes);
      await handle.sync();
      await handle.close();
      handle = undefined;
      await fileSystem.rename(temporaryPath, canonicalPath);
      renamed = true;
      try {
        await fileSystem.syncDirectory(dirname(canonicalPath));
      } catch (error) {
        if (!isUnsupportedDirectorySync(error)) {
          throw error;
        }
      }
    } catch (error) {
      if (handle !== undefined) {
        try {
          await handle.close();
        } catch {
          // The only cleanup candidate is the temp sibling; the canonical file remains untouched.
        }
      }
      if (!renamed) {
        try {
          await fileSystem.unlink(temporaryPath);
        } catch {
          // Cleanup failure cannot justify touching the canonical file.
        }
      }
      throw new DraftStoreError('Draft persistence failed.');
    }
  };

  return Object.freeze({
    load,
    async add(input) {
      return runSerialized(queueKey, async () => {
        const current = await load();
        if (current.comments.some((comment) => comment.anchor.uniqueKey === input.anchor.uniqueKey)) {
          throw new DraftConflictError('A comment already exists for this anchor.');
        }
        const timestamp = new Date().toISOString();
        const comment = {
          id: `comment_${randomUUID()}`,
          state: 'open' as const,
          body: input.body,
          anchor: input.anchor,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        const next = ReviewDraftV1Schema.parse({
          ...current,
          revision: current.revision + 1,
          comments: [...current.comments, comment],
        });
        await commit(next);
        return Object.freeze({ comment, revision: next.revision });
      });
    },
  });
}
