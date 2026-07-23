import { constants } from 'node:fs';
import { lstat, open, type FileHandle } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import { inspectDiffReviewIgnore } from '../git/ignore-status.js';

const diffReviewIgnoreRule = Buffer.from('/.diff-review/\n', 'ascii');
const appendQueues = new Map<string, Promise<void>>();

export type AppendDiffReviewIgnoreResult =
  | Readonly<{ kind: 'appended' }>
  | Readonly<{ kind: 'alreadyIgnored' }>
  | Readonly<{ kind: 'unconfirmed' }>;

export interface AppendDiffReviewIgnoreOptions {
  readonly repositoryRoot: string;
}

export interface AppendDiffReviewIgnoreDependencies {
  readonly beforeAppend?: () => Promise<void>;
}

function isMissingPath(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

function unconfirmed(): AppendDiffReviewIgnoreResult {
  return Object.freeze({ kind: 'unconfirmed' });
}

async function closeAsUnconfirmed(handle: FileHandle): Promise<AppendDiffReviewIgnoreResult> {
  try {
    await handle.close();
  } catch {
    // A failed close cannot make this append safe to claim.
  }
  return unconfirmed();
}

export async function appendDiffReviewIgnoreRule(
  options: AppendDiffReviewIgnoreOptions,
  dependencies: AppendDiffReviewIgnoreDependencies = {},
): Promise<AppendDiffReviewIgnoreResult> {
  const repositoryRoot = resolve(options.repositoryRoot);
  const previous = appendQueues.get(repositoryRoot) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolveCurrent) => {
    release = resolveCurrent;
  });
  const queued = previous.then(() => current);
  appendQueues.set(repositoryRoot, queued);
  await previous;

  try {
    const status = await inspectDiffReviewIgnore({ repositoryRoot });
    if (status.kind === 'ignored') {
      return Object.freeze({ kind: 'alreadyIgnored' });
    }
    if (status.kind === 'unavailable') {
      return unconfirmed();
    }

    const ignorePath = join(repositoryRoot, '.gitignore');
    if (dirname(ignorePath) !== repositoryRoot) {
      return unconfirmed();
    }

    let handle: FileHandle | undefined;
    let original: Buffer;
    let device: number;
    let inode: number;
    let size: number;

    try {
      let initial;
      try {
        initial = await lstat(ignorePath);
      } catch (error) {
        if (!isMissingPath(error)) {
          return unconfirmed();
        }
      }

      if (initial !== undefined) {
        if (!initial.isFile() || initial.isSymbolicLink()) {
          return unconfirmed();
        }
        handle = await open(
          ignorePath,
          constants.O_RDWR | constants.O_APPEND | constants.O_NOFOLLOW,
        );
        const opened = await handle.stat();
        if (
          !opened.isFile() ||
          opened.dev !== initial.dev ||
          opened.ino !== initial.ino ||
          opened.size !== initial.size
        ) {
          return closeAsUnconfirmed(handle);
        }
        original = await handle.readFile();
        if (original.byteLength !== opened.size) {
          return closeAsUnconfirmed(handle);
        }
        device = opened.dev;
        inode = opened.ino;
        size = opened.size;
      } else {
        handle = await open(
          ignorePath,
          constants.O_CREAT |
            constants.O_EXCL |
            constants.O_RDWR |
            constants.O_APPEND |
            constants.O_NOFOLLOW,
          0o600,
        );
        const created = await handle.stat();
        if (!created.isFile() || created.size !== 0) {
          return closeAsUnconfirmed(handle);
        }
        original = Buffer.alloc(0);
        device = created.dev;
        inode = created.ino;
        size = created.size;
      }
    } catch {
      return handle === undefined ? unconfirmed() : closeAsUnconfirmed(handle);
    }

    if (handle === undefined) {
      return unconfirmed();
    }

    const addition = original.byteLength === 0 || original.at(-1) === 0x0a
      ? diffReviewIgnoreRule
      : Buffer.concat([Buffer.from('\n', 'ascii'), diffReviewIgnoreRule]);

    try {
      await dependencies.beforeAppend?.();
      const beforeWrite = await handle.stat();
      if (
        !beforeWrite.isFile() ||
        beforeWrite.dev !== device ||
        beforeWrite.ino !== inode ||
        beforeWrite.size !== size
      ) {
        return unconfirmed();
      }
      await handle.writeFile(addition);
      await handle.sync();
    } catch {
      return unconfirmed();
    } finally {
      await handle.close();
    }

    try {
      const confirmation = await open(ignorePath, constants.O_RDONLY | constants.O_NOFOLLOW);
      try {
        const confirmed = await confirmation.stat();
        const bytes = await confirmation.readFile();
        const expected = Buffer.concat([original, addition]);
        if (
          !confirmed.isFile() ||
          confirmed.dev !== device ||
          confirmed.ino !== inode ||
          confirmed.size !== expected.byteLength ||
          !bytes.equals(expected)
        ) {
          return unconfirmed();
        }
      } finally {
        await confirmation.close();
      }
    } catch {
      return unconfirmed();
    }

    return (await inspectDiffReviewIgnore({ repositoryRoot })).kind === 'ignored'
      ? Object.freeze({ kind: 'appended' })
      : unconfirmed();
  } catch {
    return unconfirmed();
  } finally {
    release();
    if (appendQueues.get(repositoryRoot) === queued) {
      appendQueues.delete(repositoryRoot);
    }
  }
}
