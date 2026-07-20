import { execFileSync } from 'node:child_process';
import {
  chmod,
  copyFile,
  mkdtemp,
  rename,
  rm,
  symlink,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { PinnedComparisonSchema } from '../../src/contracts/comparison.js';
import { createPinnedComparison } from '../../src/git/comparison.js';
import {
  createChangedFileInventory,
  type ChangedFile,
} from '../../src/git/inventory.js';
import { createGitRunner, type GitRunner } from '../../src/git/runner.js';

const safeGitArguments = [
  '--no-optional-locks',
  '-c',
  'core.hooksPath=',
  '-c',
  'core.fsmonitor=false',
  '-c',
  'diff.external=',
  '-c',
  'protocol.file.allow=never',
] as const;

const gitEnvironment = {
  ...process.env,
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_EXTERNAL_DIFF: '',
  GIT_OPTIONAL_LOCKS: '0',
  GIT_TERMINAL_PROMPT: '0',
};

interface InventoryFixture {
  readonly root: string;
  readonly baseOid: string;
  readonly headOid: string;
  readonly invalidPathBytesSupported: boolean;
  git(arguments_: readonly string[]): Buffer;
  cleanup(): Promise<void>;
}

const fixtures: InventoryFixture[] = [];

async function createInventoryFixture(): Promise<InventoryFixture> {
  const root = await mkdtemp(join(tmpdir(), 'diff-review-inventory-'));
  const git = (arguments_: readonly string[]): Buffer =>
    execFileSync('git', [...safeGitArguments, ...arguments_], {
      cwd: root,
      encoding: 'buffer',
      env: gitEnvironment,
      maxBuffer: 8 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

  git(['init', '--initial-branch=main']);
  git(['config', '--local', 'user.name', 'Diff Review Inventory Fixture']);
  git(['config', '--local', 'user.email', 'inventory@diff-review.invalid']);
  git(['config', '--local', 'commit.gpgSign', 'false']);

  await Promise.all([
    writeFile(join(root, 'modified.txt'), 'before\n'),
    writeFile(join(root, 'deleted.txt'), 'deleted\n'),
    writeFile(join(root, 'rename-old.txt'), 'rename payload\nsecond line\n'),
    writeFile(join(root, 'copy-source.txt'), 'copy payload\nsecond line\nthird line\n'),
    writeFile(join(root, 'mode-only.txt'), 'mode payload\n'),
    writeFile(join(root, 'type-change.txt'), 'regular payload\n'),
  ]);
  git(['add', '-A']);
  git(['commit', '-m', 'inventory base']);
  const baseOid = git(['rev-parse', 'HEAD']).toString('ascii').trim();
  git(['switch', '-c', 'feature']);

  await writeFile(join(root, 'modified.txt'), 'after\n');
  await rm(join(root, 'deleted.txt'));
  await rename(join(root, 'rename-old.txt'), join(root, 'rename-new.txt'));
  await copyFile(join(root, 'copy-source.txt'), join(root, 'copy-target.txt'));
  await chmod(join(root, 'mode-only.txt'), 0o755);
  await unlink(join(root, 'type-change.txt'));
  await symlink('symlink-target', join(root, 'type-change.txt'));
  await Promise.all([
    writeFile(join(root, 'binary.dat'), Buffer.from([0, 1, 2, 3])),
    writeFile(join(root, 'space name.txt'), 'space\n'),
    writeFile(join(root, 'caf\u00e9.txt'), 'composed\n'),
    writeFile(join(root, 'cafe\u0301.txt'), 'decomposed\n'),
    writeFile(join(root, 'tab\tname.txt'), 'tab\n'),
    writeFile(join(root, 'line\nname.txt'), 'newline\n'),
    writeFile(join(root, '-leading.txt'), 'leading\n'),
  ]);
  let invalidPathBytesSupported = true;
  try {
    await writeFile(
      Buffer.concat([Buffer.from(`${root}/invalid-`), Buffer.from([0x80])]),
      'invalid one\n',
    );
    await writeFile(
      Buffer.concat([Buffer.from(`${root}/invalid-`), Buffer.from([0x81])]),
      'invalid two\n',
    );
  } catch (error) {
    if (
      typeof error !== 'object' ||
      error === null ||
      !('code' in error) ||
      error.code !== 'EILSEQ'
    ) {
      throw error;
    }
    invalidPathBytesSupported = false;
  }
  git(['add', '-A']);
  git(['commit', '-m', 'inventory head']);
  const headOid = git(['rev-parse', 'HEAD']).toString('ascii').trim();

  const fixture = {
    root,
    baseOid,
    headOid,
    invalidPathBytesSupported,
    git,
    async cleanup() {
      await rm(root, { recursive: true, force: true });
    },
  };
  fixtures.push(fixture);
  return fixture;
}

function pathText(file: ChangedFile): string | undefined {
  return file.newPath?.utf8 ?? file.oldPath?.utf8;
}

function fileByPath(files: readonly ChangedFile[], path: string): ChangedFile {
  const file = files.find((candidate) => pathText(candidate) === path);
  expect(file, `missing inventory entry for ${JSON.stringify(path)}`).toBeDefined();
  return file!;
}

function recordingRunner(commands: string[][]): GitRunner {
  const nativeRunner = createGitRunner({ maxStdoutBytes: 8 * 1024 * 1024 });
  return {
    async run(arguments_, options) {
      commands.push([...arguments_]);
      return await nativeRunner.run(arguments_, options);
    },
  };
}

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((fixture) => fixture.cleanup()));
});

describe('native-Git changed-file inventory', () => {
  it('retains the complete status, mode, blob, count, rename, and copy matrix', async () => {
    const repository = await createInventoryFixture();
    const commands: string[][] = [];
    const files = await createChangedFileInventory(
      {
        repositoryRoot: repository.root,
        mergeBaseOid: repository.baseOid,
        headOid: repository.headOid,
        objectFormat: 'sha1',
        fileIdNamespace: Buffer.from('deterministic inventory test namespace'),
      },
      { runner: recordingRunner(commands) },
    );

    const modified = fileByPath(files, 'modified.txt');
    const deleted = fileByPath(files, 'deleted.txt');
    const renamed = fileByPath(files, 'rename-new.txt');
    const copied = fileByPath(files, 'copy-target.txt');
    const modeOnly = fileByPath(files, 'mode-only.txt');
    const typeChanged = fileByPath(files, 'type-change.txt');
    const binary = fileByPath(files, 'binary.dat');

    expect(modified).toMatchObject({
      status: { code: 'M', kind: 'modified', similarity: null },
      oldMode: '100644',
      newMode: '100644',
      additions: 1,
      deletions: 1,
    });
    expect(modified.oldBlobOid).not.toBe(modified.newBlobOid);

    expect(deleted).toMatchObject({
      status: { code: 'D', kind: 'deleted', similarity: null },
      oldMode: '100644',
      newMode: '000000',
      additions: 0,
      deletions: 1,
    });
    expect(deleted.oldPath?.utf8).toBe('deleted.txt');
    expect(deleted.newPath).toBeUndefined();
    expect(deleted.newBlobOid).toBe('0'.repeat(40));

    expect(renamed).toMatchObject({
      status: { code: 'R', kind: 'renamed', similarity: 100 },
      additions: 0,
      deletions: 0,
    });
    expect(renamed.oldPath?.utf8).toBe('rename-old.txt');
    expect(renamed.newPath?.utf8).toBe('rename-new.txt');
    expect(renamed.oldBlobOid).toBe(renamed.newBlobOid);
    expect(renamed.newPath?.display).not.toContain('=>');

    expect(copied).toMatchObject({
      status: { code: 'C', kind: 'copied', similarity: 100 },
      additions: 0,
      deletions: 0,
    });
    expect(copied.oldPath?.utf8).toBe('copy-source.txt');
    expect(copied.newPath?.utf8).toBe('copy-target.txt');
    expect(copied.oldBlobOid).toBe(copied.newBlobOid);

    expect(modeOnly).toMatchObject({
      status: { code: 'M', kind: 'modified', similarity: null },
      oldMode: '100644',
      newMode: '100755',
      additions: 0,
      deletions: 0,
    });
    expect(modeOnly.oldBlobOid).toBe(modeOnly.newBlobOid);

    expect(typeChanged).toMatchObject({
      status: { code: 'T', kind: 'type-changed', similarity: null },
      oldMode: '100644',
      newMode: '120000',
    });
    expect(typeChanged.oldBlobOid).not.toBe(typeChanged.newBlobOid);

    expect(binary).toMatchObject({
      status: { code: 'A', kind: 'added', similarity: null },
      additions: null,
      deletions: null,
    });

    expect(new Set(files.map((file) => file.status.code))).toEqual(
      new Set(['A', 'C', 'D', 'M', 'R', 'T']),
    );
    expect(new Set(files.map((file) => file.id)).size).toBe(files.length);
    expect(files.every((file) => /^file_[A-Za-z0-9_-]{43}$/.test(file.id))).toBe(true);
    expect(files.every(Object.isFrozen)).toBe(true);

    expect(commands).toContainEqual([
      'diff',
      '--raw',
      '-z',
      '--no-abbrev',
      '--find-renames=50%',
      '--find-copies=50%',
      '--find-copies-harder',
      '--no-ext-diff',
      '--no-textconv',
      repository.baseOid,
      repository.headOid,
      '--',
    ]);
    expect(commands).toContainEqual([
      'diff',
      '--numstat',
      '-z',
      '--find-renames=50%',
      '--find-copies=50%',
      '--find-copies-harder',
      '--no-ext-diff',
      '--no-textconv',
      repository.baseOid,
      repository.headOid,
      '--',
    ]);
  });

  it('preserves difficult path bytes, safe display, and distinct opaque selection identities', async () => {
    const repository = await createInventoryFixture();
    const files = await createChangedFileInventory({
      repositoryRoot: repository.root,
      mergeBaseOid: repository.baseOid,
      headOid: repository.headOid,
      objectFormat: 'sha1',
      fileIdNamespace: Buffer.from('difficult path namespace'),
    });

    for (const path of [
      'space name.txt',
      'caf\u00e9.txt',
      'cafe\u0301.txt',
      'tab\tname.txt',
      'line\nname.txt',
      '-leading.txt',
    ]) {
      const file = fileByPath(files, path);
      expect(file.newPath?.bytesBase64url).toBe(Buffer.from(path).toString('base64url'));
    }

    expect(fileByPath(files, 'tab\tname.txt').newPath?.display).toBe('tab\\tname.txt');
    expect(fileByPath(files, 'line\nname.txt').newPath?.display).toBe('line\\nname.txt');
    expect(fileByPath(files, '-leading.txt').newPath?.display).toBe('-leading.txt');
    expect(fileByPath(files, 'caf\u00e9.txt').newPath?.bytesBase64url).not.toBe(
      fileByPath(files, 'cafe\u0301.txt').newPath?.bytesBase64url,
    );

    const invalidPaths = files.filter(
      (file) => file.newPath !== undefined && file.newPath.utf8 === undefined,
    );
    expect(invalidPaths).toHaveLength(repository.invalidPathBytesSupported ? 2 : 0);
    if (repository.invalidPathBytesSupported) {
      expect(invalidPaths[0]!.newPath?.display).toBe(invalidPaths[1]!.newPath?.display);
      expect(invalidPaths[0]!.newPath?.bytesBase64url).not.toBe(
        invalidPaths[1]!.newPath?.bytesBase64url,
      );
      expect(invalidPaths[0]!.id).not.toBe(invalidPaths[1]!.id);
    }
  });

  it('wires the inventory into one frozen comparison and ignores moving refs and dirty files', async () => {
    const repository = await createInventoryFixture();
    const commands: string[][] = [];
    const runner = recordingRunner(commands);
    const comparison = await createPinnedComparison(
      {
        cwd: repository.root,
        base: { label: 'main', revision: 'refs/heads/main' },
        head: { label: 'feature', revision: 'refs/heads/feature' },
      },
      { runner },
    );
    const comparisonSnapshot = JSON.stringify(comparison);

    expect(comparison.changedFiles).toHaveLength(
      repository.invalidPathBytesSupported ? 15 : 13,
    );
    expect(comparison.hasCommittedChanges).toBe(true);
    expect(Object.isFrozen(comparison.changedFiles)).toBe(true);
    expect(commands.filter((command) => command[0] === 'diff')).toHaveLength(2);

    const fixedOptions = {
      repositoryRoot: repository.root,
      mergeBaseOid: repository.baseOid,
      headOid: repository.headOid,
      objectFormat: 'sha1' as const,
      fileIdNamespace: Buffer.from('immutability namespace'),
    };
    const beforeMutation = await createChangedFileInventory(fixedOptions);

    repository.git(['update-ref', 'refs/heads/feature', repository.baseOid]);
    await writeFile(join(repository.root, 'modified.txt'), 'dirty replacement\n');
    await writeFile(join(repository.root, 'dirty-untracked.txt'), 'dirty only\n');

    const afterMutation = await createChangedFileInventory(fixedOptions);
    expect(afterMutation).toEqual(beforeMutation);
    expect(JSON.stringify(comparison)).toBe(comparisonSnapshot);
    expect(JSON.stringify(afterMutation)).not.toContain('dirty replacement');
    expect(JSON.stringify(afterMutation)).not.toContain('dirty-untracked');
  });

  it('retains unknown valid raw facts as a strict unsupported record', async () => {
    const oldOid = '1'.repeat(40);
    const newOid = '2'.repeat(40);
    const raw = Buffer.from(
      `:100600 100700 ${oldOid} ${newOid} X\0mystery\0`,
      'ascii',
    );
    const numstat = Buffer.from('0\t0\tmystery\0', 'ascii');
    const runner: GitRunner = {
      async run(arguments_) {
        return {
          stdout: arguments_.includes('--raw') ? raw : numstat,
          stderr: Buffer.alloc(0),
        };
      },
    };

    const [file] = await createChangedFileInventory(
      {
        repositoryRoot: '/not-read-from-filesystem',
        mergeBaseOid: '3'.repeat(40),
        headOid: '4'.repeat(40),
        objectFormat: 'sha1',
        fileIdNamespace: Buffer.from('unsupported namespace'),
      },
      { runner },
    );

    expect(file).toMatchObject({
      status: { code: 'X', kind: 'unsupported', similarity: null },
      oldMode: '100600',
      newMode: '100700',
      oldBlobOid: oldOid,
      newBlobOid: newOid,
      additions: 0,
      deletions: 0,
    });
    expect(file?.unsupportedReason).toContain('status X');
    expect(file?.unsupportedReason).toContain('mode 100600');
    expect(file?.unsupportedReason).toContain('mode 100700');
  });

  it('serializes exact paths through strict contracts without accepting path or object authority', async () => {
    const repository = await createInventoryFixture();
    const comparison = await createPinnedComparison({
      cwd: repository.root,
      base: { label: 'main', revision: 'refs/heads/main' },
      head: { label: 'feature', revision: 'refs/heads/feature' },
    });
    const wireComparison = JSON.parse(JSON.stringify(comparison));
    const firstFile = wireComparison.changedFiles[0];
    const pathField = firstFile.newPath === undefined ? 'oldPath' : 'newPath';

    expect(PinnedComparisonSchema.safeParse(wireComparison).success).toBe(true);
    expect(
      PinnedComparisonSchema.safeParse({
        ...wireComparison,
        changedFiles: [{ ...firstFile, repositoryRoot: '/other/repository' }],
      }).success,
    ).toBe(false);
    expect(
      PinnedComparisonSchema.safeParse({
        ...wireComparison,
        changedFiles: [
          {
            ...firstFile,
            [pathField]: {
              ...firstFile[pathField],
              bytes: [47, 101, 116, 99],
            },
          },
        ],
      }).success,
    ).toBe(false);
  });
});
