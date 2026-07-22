import { createHash } from 'node:crypto';

import { describe, expect, test } from 'vitest';

import { createDraftStore, type DraftFileHandle, type DraftFileSystem } from '../../src/server/draft-store.js';
import { createDraftLoader } from '../../src/server/draft-loader.js';

const comparison = {
  baseCommitOid: '1'.repeat(40),
  headCommitOid: '2'.repeat(40),
  mergeBaseOid: '3'.repeat(40),
};

type Fault =
  | 'backupOpen'
  | 'backupWrite'
  | 'backupSync'
  | 'backupClose'
  | 'backupDirectorySync'
  | 'backupVerificationRead'
  | 'temporaryOpen'
  | 'temporaryWrite'
  | 'temporarySync'
  | 'temporaryClose'
  | 'rename'
  | 'canonicalDirectorySync';

type MemoryFileSystem = Readonly<{
  readonly fileSystem: DraftFileSystem;
  readonly files: Map<string, Buffer>;
  readonly openPaths: readonly string[];
  readonly backupOpened: Promise<void>;
  releaseBackupOpen(): void;
}>;

function failure(code?: string): Error & Readonly<{ code?: string }> {
  return Object.assign(new Error('injected persistence fault'), code === undefined ? {} : { code });
}

function createMemoryFileSystem(options: Readonly<{ fault?: Fault; holdBackupOpen?: boolean }> = {}): MemoryFileSystem {
  const files = new Map<string, Buffer>();
  const openPaths: string[] = [];
  let syncCount = 0;
  let signalBackupOpened!: () => void;
  let releaseBackupOpen: () => void = () => {};
  const backupOpened = new Promise<void>((resolve) => {
    signalBackupOpened = resolve;
  });
  const backupOpenGate = new Promise<void>((resolve) => {
    releaseBackupOpen = resolve;
  });

  const fileSystem: DraftFileSystem = {
    async readFile(path) {
      if (options.fault === 'backupVerificationRead' && path.endsWith('.bak')) {
        throw failure();
      }
      const bytes = files.get(path);
      if (bytes === undefined) {
        throw failure('ENOENT');
      }
      return Buffer.from(bytes);
    },
    async mkdir() {},
    async open(path, flags) {
      openPaths.push(path);
      const isBackup = path.endsWith('.bak');
      const isTemporary = path.endsWith('.tmp');
      if (isBackup) {
        signalBackupOpened();
        if (options.holdBackupOpen) {
          await backupOpenGate;
        }
        if (options.fault === 'backupOpen') {
          throw failure();
        }
      }
      if (isTemporary && options.fault === 'temporaryOpen') {
        throw failure();
      }
      if (flags === 'wx' && files.has(path)) {
        throw failure('EEXIST');
      }
      let bytes = Buffer.alloc(0);
      let closed = false;
      const handle: DraftFileHandle = {
        async writeFile(next) {
          if ((isBackup && options.fault === 'backupWrite') || (isTemporary && options.fault === 'temporaryWrite')) {
            throw failure();
          }
          bytes = Buffer.from(next);
        },
        async sync() {
          if ((isBackup && options.fault === 'backupSync') || (isTemporary && options.fault === 'temporarySync')) {
            throw failure();
          }
        },
        async close() {
          if ((isBackup && options.fault === 'backupClose') || (isTemporary && options.fault === 'temporaryClose')) {
            throw failure();
          }
          if (!closed) {
            files.set(path, bytes);
            closed = true;
          }
        },
      };
      return handle;
    },
    async rename(from, to) {
      if (options.fault === 'rename') {
        throw failure();
      }
      const bytes = files.get(from);
      if (bytes === undefined) {
        throw failure('ENOENT');
      }
      files.set(to, bytes);
      files.delete(from);
    },
    async unlink(path) {
      files.delete(path);
    },
    async syncDirectory() {
      syncCount += 1;
      if ((options.fault === 'backupDirectorySync' && syncCount === 1) || (
        options.fault === 'canonicalDirectorySync' && syncCount === 2
      )) {
        throw failure();
      }
    },
  };

  return Object.freeze({ fileSystem, files, openPaths, backupOpened, releaseBackupOpen });
}

function createCorruptStore(memory: MemoryFileSystem, raw: Buffer) {
  const store = createDraftStore({
    repositoryRoot: '/fixture/repository',
    comparison,
    fileSystem: memory.fileSystem,
  });
  memory.files.set(store.canonicalPath, Buffer.from(raw));
  return store;
}

function fingerprint(raw: Buffer): string {
  return createHash('sha256').update(raw).digest('hex');
}

const preRenameFaults: readonly Fault[] = [
  'backupOpen',
  'backupWrite',
  'backupSync',
  'backupClose',
  'backupDirectorySync',
  'backupVerificationRead',
  'temporaryOpen',
  'temporaryWrite',
  'temporarySync',
  'temporaryClose',
  'rename',
];

describe('backup-first recovery fault boundaries', () => {
  test.each(preRenameFaults)('keeps corrupt canonical bytes when %s fails', async (fault) => {
    const raw = Buffer.from('{"schemaVersion":1,"invalid":true}', 'utf8');
    const memory = createMemoryFileSystem({ fault });
    const store = createCorruptStore(memory, raw);

    await expect(store.recover({ expectedFingerprint: fingerprint(raw) })).resolves.toEqual({ kind: 'persistenceFailure' });
    expect(memory.files.get(store.canonicalPath)).toEqual(raw);
  });

  test('does not falsely report persistence failure after rename when canonical directory sync faults', async () => {
    const raw = Buffer.from('{"schemaVersion":1,"invalid":true}', 'utf8');
    const memory = createMemoryFileSystem({ fault: 'canonicalDirectorySync' });
    const store = createCorruptStore(memory, raw);

    await expect(store.recover({ expectedFingerprint: fingerprint(raw) })).resolves.toMatchObject({ kind: 'recovered' });
    expect(memory.files.get(store.canonicalPath)).not.toEqual(raw);
  });

  test('serializes a queued mutation behind recovery instead of interleaving its writes', async () => {
    const raw = Buffer.from('{"schemaVersion":1,"invalid":true}', 'utf8');
    const memory = createMemoryFileSystem({ holdBackupOpen: true });
    const store = createCorruptStore(memory, raw);
    const recovery = store.recover({ expectedFingerprint: fingerprint(raw) });
    await memory.backupOpened;
    let mutationSettled = false;
    const mutation = store.mutate({
      expectedRevision: 0,
      mutation: { type: 'setSummary', markdown: 'queued after recovery' },
    }).then((result) => {
      mutationSettled = true;
      return result;
    });

    await Promise.resolve();
    expect(mutationSettled).toBe(false);
    memory.releaseBackupOpen();
    await expect(recovery).resolves.toMatchObject({ kind: 'recovered' });
    await expect(mutation).resolves.toMatchObject({ kind: 'accepted', draft: { revision: 1, summary: 'queued after recovery' } });
  });

  test('rejects a changed raw draft fingerprint before creating a backup or replacement', async () => {
    const raw = Buffer.from('{"schemaVersion":1,"invalid":true}', 'utf8');
    const changed = Buffer.from('{"schemaVersion":1,"changed":true}', 'utf8');
    const memory = createMemoryFileSystem();
    const store = createCorruptStore(memory, raw);
    const loader = createDraftLoader({ repositoryRoot: '/fixture/repository', comparison, fileSystem: memory.fileSystem });
    await expect(loader.load()).resolves.toMatchObject({ fingerprint: fingerprint(raw) });
    memory.files.set(store.canonicalPath, changed);

    await expect(store.recover({ expectedFingerprint: fingerprint(raw) })).resolves.toEqual({ kind: 'fingerprintChanged' });
    expect(memory.files.get(store.canonicalPath)).toEqual(changed);
    expect(memory.openPaths).toEqual([]);
  });

  test('serializes concurrent recovery requests to one replacement and verified backup', async () => {
    const raw = Buffer.from('{"schemaVersion":1,"invalid":true}', 'utf8');
    const memory = createMemoryFileSystem();
    const store = createCorruptStore(memory, raw);
    const expectedFingerprint = fingerprint(raw);

    const first = store.recover({ expectedFingerprint });
    const second = store.recover({ expectedFingerprint });

    await expect(first).resolves.toMatchObject({ kind: 'recovered' });
    await expect(second).resolves.toMatchObject({ kind: 'recoveryUnavailable', load: { kind: 'current' } });
    const backups = [...memory.files.entries()].filter(([path]) => path.endsWith('.bak'));
    expect(backups).toHaveLength(1);
    expect(backups[0]?.[1]).toEqual(raw);
    expect(JSON.parse(memory.files.get(store.canonicalPath)?.toString('utf8') ?? '')).toMatchObject({ revision: 0 });
  });

  test('reuses only a byte-identical existing backup and allocates a suffix for mismatched bytes', async () => {
    const raw = Buffer.from('{"schemaVersion":1,"invalid":true}', 'utf8');
    const memory = createMemoryFileSystem();
    const store = createCorruptStore(memory, raw);
    const path = store.canonicalPath.slice(0, -'.json'.length);
    const backup = `${path}.corrupt.${fingerprint(raw)}.bak`;
    memory.files.set(backup, Buffer.from('different', 'utf8'));

    await expect(store.recover({ expectedFingerprint: fingerprint(raw) })).resolves.toMatchObject({
      kind: 'recovered',
      backupPath: expect.stringMatching(/\.1\.bak$/),
    });
    expect(memory.files.get(backup)).toEqual(Buffer.from('different', 'utf8'));
    expect(memory.files.get(`${path}.corrupt.${fingerprint(raw)}.1.bak`)).toEqual(raw);
  });
});
