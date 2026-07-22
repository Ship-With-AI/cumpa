import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import { dirname, join } from 'node:path';

import {
  DraftMutationSchema,
  ReviewDraftV1Schema,
  RevisionSchema,
  type DraftMutation,
  type ReviewDraftV1,
} from '../contracts/draft.js';
import { applyDraftMutation } from '../draft/mutate-draft.js';
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

type AddDraftMutation = Omit<Extract<DraftMutation, { readonly type: 'addComment' }>, 'commentId'>;
export type DraftStoreMutation = AddDraftMutation | Exclude<DraftMutation, { readonly type: 'addComment' }>;

export type DraftMutationResult =
  | Readonly<{ readonly kind: 'accepted'; readonly draft: ReviewDraftV1 }>
  | Readonly<{
      readonly kind: 'revisionConflict';
      readonly expectedRevision: number;
      readonly actualRevision: number;
      readonly latest: ReviewDraftV1;
    }>
  | Readonly<{ readonly kind: 'invalidTarget' }>
  | Readonly<{ readonly kind: 'illegalTransition' }>
  | Readonly<{ readonly kind: 'persistenceFailure' }>;

export type DraftStore = Readonly<{
  load(): Promise<ReviewDraftV1>;
  mutate(input: Readonly<{ readonly expectedRevision: number; readonly mutation: DraftStoreMutation }>): Promise<DraftMutationResult>;
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
    } catch {
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
    async mutate(input) {
      return runSerialized(queueKey, async () => {
        const expectedRevision = RevisionSchema.parse(input.expectedRevision);
        const current = await load();
        if (expectedRevision !== current.revision) {
          return Object.freeze({
            kind: 'revisionConflict' as const,
            expectedRevision,
            actualRevision: current.revision,
            latest: current,
          });
        }
        const mutation = DraftMutationSchema.parse(
          input.mutation.type === 'addComment'
            ? { ...input.mutation, commentId: `comment_${randomUUID()}` }
            : input.mutation,
        );
        const applied = applyDraftMutation(current, mutation, new Date().toISOString());
        if (applied.kind !== 'applied') {
          return applied;
        }
        const next = ReviewDraftV1Schema.parse({ ...applied.draft, revision: current.revision + 1 });
        try {
          await commit(next);
        } catch {
          return Object.freeze({ kind: 'persistenceFailure' as const });
        }
        return Object.freeze({ kind: 'accepted' as const, draft: next });
      });
    },
  });
}
