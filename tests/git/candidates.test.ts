import { rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { discoverSourceCandidates } from '../../src/git/candidates.js';
import { createGitRunner } from '../../src/git/runner.js';
import type { GitRunner } from '../../src/git/runner.js';
import {
  createGitFixture,
  type GitFixture,
} from '../helpers/git-fixture.js';

const fixtures: GitFixture[] = [];

async function fixture() {
  const created = await createGitFixture();
  fixtures.push(created);
  return created;
}

function output(repository: GitFixture, arguments_: readonly string[]) {
  return repository.git(arguments_).toString('ascii').trim();
}

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((item) => item.cleanup()));
});

describe('truthful native-Git source candidate discovery', () => {
  it('retains branch, linked, detached, duplicate-OID, dirty, and unavailable source identities', async () => {
    const repository = await fixture();
    const fixtureRoot = dirname(repository.root);
    const linkedPath = join(fixtureRoot, 'linked-worktree');
    const detachedPath = join(fixtureRoot, 'detached-worktree');
    const unavailablePath = join(fixtureRoot, 'unavailable-worktree');

    repository.git(['branch', 'linked', repository.baseRef]);
    repository.git(['worktree', 'add', linkedPath, 'linked']);
    repository.git(['worktree', 'add', '--detach', detachedPath, repository.headRef]);
    repository.git(['branch', 'unavailable', repository.futureHeadOid]);
    repository.git(['worktree', 'add', unavailablePath, 'unavailable']);
    await rm(unavailablePath, { recursive: true, force: true });

    await repository.write('tracked.txt', 'unstaged dirty bytes\n');
    await repository.write('staged.txt', 'staged dirty bytes\n');
    repository.git(['add', '--', 'staged.txt']);
    await repository.write('untracked.txt', 'untracked dirty bytes\n');

    const discovery = await discoverSourceCandidates({
      cwd: repository.nestedCwd,
    });
    const branches = discovery.initialCandidates.filter(
      (candidate) => candidate.kind === 'branch',
    );
    const worktrees = discovery.initialCandidates.filter(
      (candidate) => candidate.kind === 'worktree',
    );

    expect(Object.isFrozen(discovery)).toBe(true);
    expect(Object.isFrozen(discovery.initialCandidates)).toBe(true);
    expect(branches).toMatchObject([
      {
        id: `branch:${repository.headRef}`,
        label: 'feature',
        refName: repository.headRef,
      },
    ]);
    expect(worktrees).toHaveLength(4);
    expect(worktrees.map((candidate) => candidate.path)).toEqual(
      repository
        .git(['worktree', 'list', '--porcelain', '-z'])
        .toString('utf8')
        .split('\0')
        .filter((field) => field.startsWith('worktree '))
        .map((field) => field.slice('worktree '.length)),
    );

    const current = worktrees.find((candidate) => candidate.path === repository.root);
    expect(current).toMatchObject({
      availability: 'dirty',
      detached: false,
      isCurrentCheckout: true,
      label: 'feature',
    });

    const detached = worktrees.find((candidate) => candidate.path === detachedPath);
    expect(detached).toMatchObject({
      availability: 'clean',
      detached: true,
      isCurrentCheckout: false,
      label: 'Detached HEAD',
    });

    const unavailable = worktrees.find(
      (candidate) => candidate.path === unavailablePath,
    );
    expect(unavailable).toMatchObject({
      availability: 'unavailable',
      detached: false,
      unavailableReason:
        'Unavailable — this registered worktree cannot be resolved. Choose another entry or repair it with Git.',
    });

    const expectedFeatureOid = output(repository, [
      'rev-parse',
      '--verify',
      `${repository.headRef}^{commit}`,
    ]);
    const expectedShortOid = output(repository, [
      'rev-parse',
      '--short=12',
      expectedFeatureOid,
    ]);
    const duplicateOidRows = discovery.initialCandidates.filter(
      (candidate) => candidate.commitOid === expectedFeatureOid,
    );

    expect(duplicateOidRows).toHaveLength(3);
    expect(duplicateOidRows.map((candidate) => candidate.id)).toHaveLength(
      new Set(duplicateOidRows.map((candidate) => candidate.id)).size,
    );
    expect(duplicateOidRows.every((candidate) => candidate.shortOid === expectedShortOid)).toBe(
      true,
    );
    expect(duplicateOidRows.every((candidate) => candidate.id !== candidate.commitOid)).toBe(
      true,
    );
  });

  it('does not fabricate an attached branch for a detached current checkout', async () => {
    const repository = await fixture();
    repository.git(['switch', '--detach', repository.headRef]);

    const discovery = await discoverSourceCandidates({
      cwd: repository.nestedCwd,
    });

    expect(
      discovery.initialCandidates.filter((candidate) => candidate.kind === 'branch'),
    ).toEqual([]);
    expect(discovery.initialCandidates).toContainEqual(
      expect.objectContaining({
        id: `worktree:${repository.root}`,
        detached: true,
        isCurrentCheckout: true,
      }),
    );
  });

  it('searches local branch names literally on demand with one keyed abbreviation batch', async () => {
    const repository = await fixture();
    repository.git(['branch', 'AlphaTarget', repository.baseRef]);
    repository.git(['branch', 'alpha-target', repository.baseRef]);
    repository.git(['branch', 'target-zulu', repository.baseRef]);
    const sharedOid = output(repository, [
      'rev-parse',
      '--verify',
      `${repository.baseRef}^{commit}`,
    ]);
    repository.git([
      'update-ref',
      'refs/remotes/origin/target-remote',
      output(repository, ['rev-parse', '--verify', `${repository.headRef}^{commit}`]),
    ]);
    const calls: Array<{
      readonly arguments_: readonly string[];
      readonly cwd: string;
      readonly signal?: AbortSignal;
    }> = [];
    const nativeRunner = createGitRunner();
    const recordingRunner: GitRunner = {
      async run(arguments_, options) {
        calls.push({ arguments_, cwd: options.cwd, signal: options.signal });
        return await nativeRunner.run(arguments_, options);
      },
    };
    const discovery = await discoverSourceCandidates(
      { cwd: repository.nestedCwd },
      { runner: recordingRunner },
    );
    const eagerCallCount = calls.length;

    const empty = await discovery.searchBranches('');
    expect(empty).toEqual([]);
    expect(Object.isFrozen(empty)).toBe(true);
    expect(calls).toHaveLength(eagerCallCount);

    const searchController = new AbortController();
    const matches = await discovery.searchBranches('TaRgEt', searchController.signal);
    expect(matches.map((candidate) => candidate.label)).toEqual(
      expect.arrayContaining(['AlphaTarget', 'alpha-target', 'target-zulu']),
    );
    expect(matches.map((candidate) => candidate.refName)).toEqual(
      [...matches]
        .map((candidate) => candidate.refName)
        .sort((left, right) =>
          Buffer.compare(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8')),
        ),
    );
    expect(matches.every((candidate) => candidate.id !== candidate.commitOid)).toBe(
      true,
    );
    expect(matches.filter((candidate) => candidate.commitOid === sharedOid)).toHaveLength(3);
    expect(Object.isFrozen(matches)).toBe(true);

    const branchCalls = calls.filter(({ arguments_ }) => arguments_[0] === 'branch');
    expect(branchCalls).toHaveLength(1);
    expect(branchCalls[0]?.arguments_).toEqual([
      'branch',
      '--list',
      '--ignore-case',
      '--no-color',
      '--sort=refname',
      expect.stringContaining('--format='),
      '--',
      '*TaRgEt*',
    ]);
    const logCalls = calls.filter(({ arguments_ }) => arguments_[0] === 'log');
    expect(logCalls).toHaveLength(1);
    expect(branchCalls[0]?.signal).toBe(searchController.signal);
    expect(logCalls[0]?.arguments_).toEqual([
      'log',
      '--no-walk=unsorted',
      '--abbrev=12',
      '--format=%H%x00%h%x00',
      '--stdin',
    ]);

    expect(logCalls[0]?.signal).toBe(searchController.signal);
    for (const [term, escapedPattern] of [
      ['*', '*\\**'],
      ['?', '*\\?*'],
      ['[', '*\\[*'],
      [']', '*\\]*'],
      ['\\', '*\\\\*'],
      ['--target', '*--target*'],
    ] as const) {
      const before = calls.length;
      const literal = await discovery.searchBranches(term);
      expect(literal).toEqual([]);
      const searchCalls = calls.slice(before).filter(({ arguments_ }) => arguments_[0] === 'branch');
      expect(searchCalls).toHaveLength(1);
      expect(searchCalls[0]?.arguments_.at(-2)).toBe('--');
      expect(searchCalls[0]?.arguments_.at(-1)).toBe(escapedPattern);
      expect(calls.slice(before).some(({ arguments_ }) => arguments_[0] === 'log')).toBe(false);
    }

    const metadata = await discovery.searchBranches(sharedOid);
    expect(metadata).toEqual([]);
    expect(Object.isFrozen(metadata)).toBe(true);
  });

  it('rejects malformed complete branch and abbreviation protocols before publishing candidates', async () => {
    const repository = await fixture();
    const firstOid = 'a'.repeat(40);
    const secondOid = 'b'.repeat(40);
    const validBranch = Buffer.from(
      `refs/heads/target-one\0target-one\0${firstOid}\0\n`,
      'utf8',
    );
    const validPair = Buffer.from(
      `refs/heads/target-one\0target-one\0${firstOid}\0\nrefs/heads/target-two\0target-two\0${secondOid}\0\n`,
      'utf8',
    );
    const validAbbreviation = Buffer.from(
      `${firstOid}\0${firstOid.slice(0, 12)}\0\n`,
      'ascii',
    );
    const highBitBranchOid = Buffer.from(validBranch);
    highBitBranchOid[highBitBranchOid.length - 2] = 0xe1;
    const highBitAbbreviationFullOid = Buffer.from(validAbbreviation);
    highBitAbbreviationFullOid[0] = 0xe1;
    const highBitAbbreviationShortOid = Buffer.from(validAbbreviation);
    highBitAbbreviationShortOid[firstOid.length + 1] = 0xe1;
    const failures: Array<{
      readonly name: string;
      readonly branch: Buffer;
      readonly abbreviation?: Buffer;
    }> = [
      { name: 'truncated after ref', branch: Buffer.from('refs/heads/target\0') },
      { name: 'truncated after label', branch: Buffer.from('refs/heads/target\0target\0') },
      { name: 'missing final branch newline', branch: validBranch.subarray(0, -1) },
      { name: 'unterminated final branch field', branch: validBranch.subarray(0, -2) },
      { name: 'extra branch field', branch: Buffer.from(`refs/heads/target\0target\0${firstOid}\0extra`) },
      { name: 'empty ref', branch: Buffer.from(`\0target\0${firstOid}\0`) },
      { name: 'empty label', branch: Buffer.from(`refs/heads/target\0\0${firstOid}\0`) },
      { name: 'empty OID', branch: Buffer.from('refs/heads/target\0target\0\0') },
      { name: 'invalid OID', branch: Buffer.from('refs/heads/target\0target\0not-an-oid\0') },
      { name: 'high-bit branch OID', branch: highBitBranchOid },
      { name: 'remote ref', branch: Buffer.from(`refs/remotes/origin/target\0target\0${firstOid}\0`) },
      { name: 'non-hex short OID', branch: validBranch, abbreviation: Buffer.from(`${firstOid}\0zzzzzzzzzzzz\0`) },
      { name: 'uppercase short OID', branch: validBranch, abbreviation: Buffer.from(`${firstOid}\0${'A'.repeat(12)}\0`) },
      { name: 'non-prefix short OID', branch: validBranch, abbreviation: Buffer.from(`${firstOid}\0${'b'.repeat(12)}\0`) },
      { name: 'short short OID', branch: validBranch, abbreviation: Buffer.from(`${firstOid}\0${firstOid.slice(0, 11)}\0`) },
      { name: 'high-bit abbreviation full OID', branch: validBranch, abbreviation: highBitAbbreviationFullOid },
      { name: 'high-bit abbreviation short OID', branch: validBranch, abbreviation: highBitAbbreviationShortOid },
      { name: 'identical duplicate OID', branch: validBranch, abbreviation: Buffer.from(`${firstOid}\0${firstOid.slice(0, 12)}\0\n${firstOid}\0${firstOid.slice(0, 12)}\0`) },
      { name: 'conflicting duplicate OID', branch: validBranch, abbreviation: Buffer.from(`${firstOid}\0${firstOid.slice(0, 12)}\0\n${firstOid}\0${firstOid.slice(0, 13)}\0`) },
      { name: 'unrequested OID', branch: validBranch, abbreviation: Buffer.from(`${firstOid}\0${firstOid.slice(0, 12)}\0\n${secondOid}\0${secondOid.slice(0, 12)}\0`) },
      { name: 'missing only OID', branch: validBranch, abbreviation: Buffer.alloc(0) },
      { name: 'missing one multi-OID key', branch: validPair, abbreviation: validAbbreviation },
      { name: 'missing final abbreviation newline', branch: validBranch, abbreviation: validAbbreviation.subarray(0, -1) },
      { name: 'unterminated final abbreviation field', branch: validBranch, abbreviation: validAbbreviation.subarray(0, -2) },
    ];

    for (const failure of failures) {
      const nativeRunner = createGitRunner();
      const controlledRunner: GitRunner = {
        async run(arguments_, options) {
          if (arguments_[0] === 'branch') {
            return { stdout: failure.branch, stderr: Buffer.alloc(0) };
          }
          if (arguments_[0] === 'log') {
            return {
              stdout: failure.abbreviation ?? validAbbreviation,
              stderr: Buffer.alloc(0),
            };
          }
          return await nativeRunner.run(arguments_, options);
        },
      };
      const discovery = await discoverSourceCandidates(
        { cwd: repository.nestedCwd },
        { runner: controlledRunner },
      );

      await expect(discovery.searchBranches('target'), failure.name).rejects.toThrow();
    }
  });

  it('rejects duplicate deferred branch identities before abbreviation', async () => {
    const repository = await fixture();
    const firstOid = 'a'.repeat(40);
    const secondOid = 'b'.repeat(40);

    for (const [name, duplicateOid] of [
      ['identical OID', firstOid],
      ['conflicting OID', secondOid],
    ] as const) {
      let logCalls = 0;
      const nativeRunner = createGitRunner();
      const controlledRunner: GitRunner = {
        async run(arguments_, options) {
          if (arguments_[0] === 'branch') {
            return {
              stdout: Buffer.from(
                `refs/heads/target\0target\0${firstOid}\0\nrefs/heads/target\0target\0${duplicateOid}\0\n`,
                'ascii',
              ),
              stderr: Buffer.alloc(0),
            };
          }
          if (arguments_[0] === 'log') {
            logCalls += 1;
          }
          return await nativeRunner.run(arguments_, options);
        },
      };
      const discovery = await discoverSourceCandidates(
        { cwd: repository.nestedCwd },
        { runner: controlledRunner },
      );

      await expect(discovery.searchBranches('target'), name).rejects.toThrow(
        'Git branch output contained duplicate local branch identity',
      );
      expect(logCalls, name).toBe(0);
    }
  });

  it('rejects invalid UTF-8 branch identities before abbreviation or publication', async () => {
    const repository = await fixture();
    const oid = 'a'.repeat(40);
    const failures = [
      {
        name: 'invalid ref suffix',
        branch: Buffer.concat([
          Buffer.from('refs/heads/target', 'utf8'),
          Buffer.of(0x80),
          Buffer.from(`\0target\0${oid}\0\n`, 'ascii'),
        ]),
      },
      {
        name: 'invalid label',
        branch: Buffer.concat([
          Buffer.from('refs/heads/target\0', 'utf8'),
          Buffer.of(0x80),
          Buffer.from(`\0${oid}\0\n`, 'ascii'),
        ]),
      },
    ];

    for (const failure of failures) {
      let abbreviationCalls = 0;
      const nativeRunner = createGitRunner();
      const controlledRunner: GitRunner = {
        async run(arguments_, options) {
          if (arguments_[0] === 'branch') {
            return { stdout: failure.branch, stderr: Buffer.alloc(0) };
          }
          if (arguments_[0] === 'log') {
            abbreviationCalls += 1;
            return {
              stdout: Buffer.from(`${oid}\0${oid.slice(0, 12)}\0`, 'ascii'),
              stderr: Buffer.alloc(0),
            };
          }
          return await nativeRunner.run(arguments_, options);
        },
      };
      const discovery = await discoverSourceCandidates(
        { cwd: repository.nestedCwd },
        { runner: controlledRunner },
      );

      await expect(discovery.searchBranches('target'), failure.name).rejects.toThrow();
      expect(abbreviationCalls, failure.name).toBe(0);
    }
  });

  it('rejects invalid UTF-8 current-worktree branch identities before publication', async () => {
    const repository = await fixture();
    const nativeRunner = createGitRunner();
    let worktreeListingCalls = 0;
    let ranAfterInvalidWorktreeListing = false;
    const controlledRunner: GitRunner = {
      async run(arguments_, options) {
        if (
          JSON.stringify(arguments_) ===
          JSON.stringify(['worktree', 'list', '--porcelain', '-z'])
        ) {
          worktreeListingCalls += 1;
          if (worktreeListingCalls === 2) {
            return {
              stdout: Buffer.concat([
                Buffer.from(
                  `worktree ${repository.root}\0HEAD ${'a'.repeat(40)}\0branch refs/heads/`,
                  'utf8',
                ),
                Buffer.of(0x80),
                Buffer.from('\0\0', 'ascii'),
              ]),
              stderr: Buffer.alloc(0),
            };
          }
        }
        if (worktreeListingCalls === 2) {
          ranAfterInvalidWorktreeListing = true;
        }
        return await nativeRunner.run(arguments_, options);
      },
    };

    await expect(
      discoverSourceCandidates(
        { cwd: repository.nestedCwd },
        { runner: controlledRunner },
      ),
    ).rejects.toThrow(
      'Git worktree output contained invalid UTF-8 branch identity',
    );
    expect(worktreeListingCalls).toBe(2);
    expect(ranAfterInvalidWorktreeListing).toBe(false);
  });
  it('rejects incomplete or malformed worktree porcelain before publication', async () => {
    const repository = await fixture();
    const oid = 'a'.repeat(40);
    const failures = [
      {
        name: 'open record at EOF',
        stdout: Buffer.from(`worktree ${repository.root}\0`, 'utf8'),
      },
      {
        name: 'missing worktree value',
        stdout: Buffer.from('worktree\0\0', 'ascii'),
      },
      {
        name: 'empty worktree path',
        stdout: Buffer.from('worktree \0\0', 'ascii'),
      },
      {
        name: 'duplicate worktree path',
        stdout: Buffer.from(
          `worktree ${repository.root}\0worktree ${repository.root}\0\0`,
          'utf8',
        ),
      },
      {
        name: 'duplicate locked field',
        stdout: Buffer.from(
          `worktree ${repository.root}\0locked\0locked reason\0\0`,
          'utf8',
        ),
      },
      {
        name: 'missing HEAD value',
        stdout: Buffer.from(`worktree ${repository.root}\0HEAD\0\0`, 'utf8'),
      },
      {
        name: 'duplicate HEAD value',
        stdout: Buffer.from(
          `worktree ${repository.root}\0HEAD ${oid}\0HEAD ${oid}\0\0`,
          'utf8',
        ),
      },
      {
        name: 'malformed HEAD OID',
        stdout: Buffer.from(
          `worktree ${repository.root}\0HEAD not-an-oid\0\0`,
          'utf8',
        ),
      },
      {
        name: 'HEAD before worktree',
        stdout: Buffer.from(
          `HEAD ${oid}\0worktree ${repository.root}\0\0`,
          'utf8',
        ),
      },
      {
        name: 'relative worktree path',
        stdout: Buffer.from(`worktree relative-repo\0HEAD ${oid}\0\0`, 'utf8'),
      },
      {
        name: 'missing branch value',
        stdout: Buffer.from(`worktree ${repository.root}\0branch\0\0`, 'utf8'),
      },
      {
        name: 'empty branch identity',
        stdout: Buffer.from(`worktree ${repository.root}\0branch \0\0`, 'utf8'),
      },
      {
        name: 'remote branch identity',
        stdout: Buffer.from(
          `worktree ${repository.root}\0branch refs/remotes/origin/topic\0\0`,
          'utf8',
        ),
      },
    ];
    failures.push({
      name: 'invalid UTF-8 worktree path',
      stdout: Buffer.concat([
        Buffer.from('worktree ', 'ascii'),
        Buffer.of(0x80),
        Buffer.from('\0\0', 'ascii'),
      ]),
    });

    for (const failure of failures) {
      const nativeRunner = createGitRunner();
      let worktreeListingCalls = 0;
      let ranAfterMalformedListing = false;
      const controlledRunner: GitRunner = {
        async run(arguments_, options) {
          if (
            JSON.stringify(arguments_) ===
            JSON.stringify(['worktree', 'list', '--porcelain', '-z'])
          ) {
            worktreeListingCalls += 1;
            if (worktreeListingCalls === 2) {
              return { stdout: failure.stdout, stderr: Buffer.alloc(0) };
            }
          }
          if (worktreeListingCalls === 2) {
            ranAfterMalformedListing = true;
          }
          return await nativeRunner.run(arguments_, options);
        },
      };

      await expect(
        discoverSourceCandidates(
          { cwd: repository.nestedCwd },
          { runner: controlledRunner },
        ),
        failure.name,
      ).rejects.toThrow();
      expect(worktreeListingCalls, failure.name).toBe(2);
      expect(ranAfterMalformedListing, failure.name).toBe(false);
    }
  });

  it('accepts locked worktree porcelain attributes', async () => {
    const repository = await fixture();

    for (const lockedField of ['locked', 'locked maintenance'] as const) {
      const nativeRunner = createGitRunner();
      let worktreeListingCalls = 0;
      const controlledRunner: GitRunner = {
        async run(arguments_, options) {
          if (
            JSON.stringify(arguments_) ===
            JSON.stringify(['worktree', 'list', '--porcelain', '-z'])
          ) {
            worktreeListingCalls += 1;
            if (worktreeListingCalls === 2) {
              return {
                stdout: Buffer.from(
                  `worktree ${repository.root}\0branch ${repository.headRef}\0${lockedField}\0\0`,
                  'utf8',
                ),
                stderr: Buffer.alloc(0),
              };
            }
          }
          return await nativeRunner.run(arguments_, options);
        },
      };

      const discovery = await discoverSourceCandidates(
        { cwd: repository.nestedCwd },
        { runner: controlledRunner },
      );

      expect(worktreeListingCalls, lockedField).toBe(2);
      expect(discovery.initialCandidates).toContainEqual(
        expect.objectContaining({
          id: `worktree:${repository.root}`,
          branchRef: repository.headRef,
        }),
      );
    }
  });
  it('accepts an unborn worktree record without a porcelain HEAD field', async () => {
    const repository = await fixture();
    const nativeRunner = createGitRunner();
    let worktreeListingCalls = 0;
    const controlledRunner: GitRunner = {
      async run(arguments_, options) {
        if (
          JSON.stringify(arguments_) ===
          JSON.stringify(['worktree', 'list', '--porcelain', '-z'])
        ) {
          worktreeListingCalls += 1;
          if (worktreeListingCalls === 2) {
            return {
              stdout: Buffer.from(
                `worktree ${repository.root}\0branch ${repository.headRef}\0\0`,
                'utf8',
              ),
              stderr: Buffer.alloc(0),
            };
          }
        }
        return await nativeRunner.run(arguments_, options);
      },
    };

    const discovery = await discoverSourceCandidates(
      { cwd: repository.nestedCwd },
      { runner: controlledRunner },
    );

    expect(worktreeListingCalls).toBe(2);
    expect(discovery.initialCandidates).toContainEqual(
      expect.objectContaining({
        id: `worktree:${repository.root}`,
        branchRef: repository.headRef,
      }),
    );
  });

  it('rejects malformed current-worktree OID output before publication', async () => {
    const repository = await fixture();
    const oid = 'a'.repeat(40);
    const shortOid = oid.slice(0, 12);
    const fullOid = Buffer.from(`${oid}\n`, 'ascii');
    const abbreviatedOid = Buffer.from(`${shortOid}\n`, 'ascii');
    const highBitFullOid = Buffer.from(fullOid);
    highBitFullOid[0] = 0xe1;
    const highBitShortOid = Buffer.from(abbreviatedOid);
    highBitShortOid[0] = 0xe1;
    const failures = [
      {
        name: 'high-bit full OID',
        head: highBitFullOid,
        short: abbreviatedOid,
      },
      {
        name: 'high-bit short OID',
        head: fullOid,
        short: highBitShortOid,
      },
      {
        name: 'non-prefix short OID',
        head: fullOid,
        short: Buffer.from(`${'b'.repeat(12)}\n`, 'ascii'),
      },
      {
        name: 'short short OID',
        head: fullOid,
        short: Buffer.from(`${shortOid.slice(0, 11)}\n`, 'ascii'),
      },
    ];

    for (const failure of failures) {
      const nativeRunner = createGitRunner();
      const controlledRunner: GitRunner = {
        async run(arguments_, options) {
          if (
            JSON.stringify(arguments_) ===
            JSON.stringify([
              'rev-parse',
              '--verify',
              '--end-of-options',
              'HEAD^{commit}',
            ])
          ) {
            return { stdout: failure.head, stderr: Buffer.alloc(0) };
          }
          if (
            arguments_[0] === 'rev-parse' &&
            arguments_[1] === '--short=12'
          ) {
            return { stdout: failure.short, stderr: Buffer.alloc(0) };
          }
          return await nativeRunner.run(arguments_, options);
        },
      };

      await expect(
        discoverSourceCandidates(
          { cwd: repository.nestedCwd },
          { runner: controlledRunner },
        ),
        failure.name,
      ).rejects.toThrow();
    }
  });
  it('does not publish eager candidates after cancellation following valid Git output', async () => {
    const repository = await fixture();
    const controller = new AbortController();
    const nativeRunner = createGitRunner();
    let abbreviationCalls = 0;
    const controlledRunner: GitRunner = {
      async run(arguments_, options) {
        if (
          arguments_[0] === 'rev-parse' &&
          arguments_[1] === '--short=12'
        ) {
          abbreviationCalls += 1;
          expect(options.signal).toBe(controller.signal);
          const result = await nativeRunner.run(arguments_, options);
          controller.abort(new Error('eager abbreviation completed after abort'));
          return result;
        }
        return await nativeRunner.run(arguments_, options);
      },
    };

    await expect(
      discoverSourceCandidates(
        { cwd: repository.nestedCwd, signal: controller.signal },
        { runner: controlledRunner },
      ),
    ).rejects.toThrow();
    expect(abbreviationCalls).toBe(1);
  });
  it('propagates caller cancellation through both branch-search Git stages', async () => {
    const repository = await fixture();
    const oid = 'a'.repeat(40);
    const branch = Buffer.from(
      `refs/heads/target\0target\0${oid}\0\n`,
      'ascii',
    );
    const abbreviation = Buffer.from(
      `${oid}\0${oid.slice(0, 12)}\0\n`,
      'ascii',
    );

    for (const abortedStage of ['branch', 'log'] as const) {
      const controller = new AbortController();
      let branchCalls = 0;
      let abbreviationCalls = 0;
      const nativeRunner = createGitRunner();
      const controlledRunner: GitRunner = {
        async run(arguments_, options) {
          if (arguments_[0] === 'branch') {
            branchCalls += 1;
            expect(options.signal).toBe(controller.signal);
            if (abortedStage === 'branch') {
              controller.abort(new Error('branch listing aborted'));
            }
            return { stdout: branch, stderr: Buffer.alloc(0) };
          }
          if (arguments_[0] === 'log') {
            abbreviationCalls += 1;
            expect(options.signal).toBe(controller.signal);
            if (abortedStage === 'log') {
              controller.abort(new Error('abbreviation batching aborted'));
            }
            return { stdout: abbreviation, stderr: Buffer.alloc(0) };
          }
          return await nativeRunner.run(arguments_, options);
        },
      };
      const discovery = await discoverSourceCandidates(
        { cwd: repository.nestedCwd },
        { runner: controlledRunner },
      );

      await expect(
        discovery.searchBranches('target', controller.signal),
        abortedStage,
      ).rejects.toThrow();
      expect(branchCalls, abortedStage).toBe(1);
      expect(abbreviationCalls, abortedStage).toBe(
        abortedStage === 'branch' ? 0 : 1,
      );
    }
  });



  it('uses only byte-safe native-Git candidate protocols through the bounded runner', async () => {
    const repository = await fixture();
    const calls: Array<{ readonly arguments_: readonly string[]; readonly cwd: string }> = [];
    const nativeRunner = createGitRunner();
    const recordingRunner: GitRunner = {
      async run(arguments_, options) {
        calls.push({ arguments_, cwd: options.cwd });
        return await nativeRunner.run(arguments_, options);
      },
    };

    await discoverSourceCandidates(
      { cwd: repository.nestedCwd },
      { runner: recordingRunner },
    );

    expect(calls.some(({ arguments_ }) =>
      JSON.stringify(arguments_) ===
      JSON.stringify(['worktree', 'list', '--porcelain', '-z']),
    )).toBe(true);
    expect(calls.some(({ arguments_ }) =>
      arguments_[0] === 'for-each-ref' &&
      arguments_.includes('refs/heads') &&
      arguments_.some((argument) => argument.includes('%00')),
    )).toBe(true);
    expect(calls.some(({ arguments_ }) =>
      JSON.stringify(arguments_) ===
      JSON.stringify([
        'status',
        '--porcelain=v1',
        '-z',
        '--untracked-files=normal',
      ]),
    )).toBe(true);
    expect(calls.every(({ arguments_ }) =>
      arguments_[0] !== 'status' || !arguments_.includes('--porcelain'),
    )).toBe(true);
    expect(calls.every(({ arguments_ }) =>
      arguments_[0] !== 'status' || !arguments_.includes('--short'),
    )).toBe(true);
  });
});

