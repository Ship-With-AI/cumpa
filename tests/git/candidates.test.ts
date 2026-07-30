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
    const calls: Array<{ readonly arguments_: readonly string[]; readonly cwd: string }> = [];
    const nativeRunner = createGitRunner();
    const recordingRunner: GitRunner = {
      async run(arguments_, options) {
        calls.push({ arguments_, cwd: options.cwd });
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

    const matches = await discovery.searchBranches('TaRgEt');
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
    expect(logCalls[0]?.arguments_).toEqual([
      'log',
      '--no-walk=unsorted',
      '--abbrev=12',
      '--format=%H%x00%h%x00',
      '--stdin',
    ]);

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
      `refs/heads/target-one\0target-one\0${firstOid}\0`,
      'utf8',
    );
    const validPair = Buffer.from(
      `refs/heads/target-one\0target-one\0${firstOid}\0\nrefs/heads/target-two\0target-two\0${secondOid}\0`,
      'utf8',
    );
    const validAbbreviation = Buffer.from(`${firstOid}\0${firstOid.slice(0, 12)}\0`, 'ascii');
    const failures: Array<{
      readonly name: string;
      readonly branch: Buffer;
      readonly abbreviation?: Buffer;
    }> = [
      { name: 'truncated after ref', branch: Buffer.from('refs/heads/target\0') },
      { name: 'truncated after label', branch: Buffer.from('refs/heads/target\0target\0') },
      { name: 'extra branch field', branch: Buffer.from(`refs/heads/target\0target\0${firstOid}\0extra`) },
      { name: 'empty ref', branch: Buffer.from(`\0target\0${firstOid}\0`) },
      { name: 'empty label', branch: Buffer.from(`refs/heads/target\0\0${firstOid}\0`) },
      { name: 'empty OID', branch: Buffer.from('refs/heads/target\0target\0\0') },
      { name: 'invalid OID', branch: Buffer.from('refs/heads/target\0target\0not-an-oid\0') },
      { name: 'remote ref', branch: Buffer.from(`refs/remotes/origin/target\0target\0${firstOid}\0`) },
      { name: 'non-hex short OID', branch: validBranch, abbreviation: Buffer.from(`${firstOid}\0zzzzzzzzzzzz\0`) },
      { name: 'uppercase short OID', branch: validBranch, abbreviation: Buffer.from(`${firstOid}\0${'A'.repeat(12)}\0`) },
      { name: 'non-prefix short OID', branch: validBranch, abbreviation: Buffer.from(`${firstOid}\0${'b'.repeat(12)}\0`) },
      { name: 'short short OID', branch: validBranch, abbreviation: Buffer.from(`${firstOid}\0${firstOid.slice(0, 11)}\0`) },
      { name: 'identical duplicate OID', branch: validBranch, abbreviation: Buffer.from(`${firstOid}\0${firstOid.slice(0, 12)}\0\n${firstOid}\0${firstOid.slice(0, 12)}\0`) },
      { name: 'conflicting duplicate OID', branch: validBranch, abbreviation: Buffer.from(`${firstOid}\0${firstOid.slice(0, 12)}\0\n${firstOid}\0${firstOid.slice(0, 13)}\0`) },
      { name: 'unrequested OID', branch: validBranch, abbreviation: Buffer.from(`${firstOid}\0${firstOid.slice(0, 12)}\0\n${secondOid}\0${secondOid.slice(0, 12)}\0`) },
      { name: 'missing only OID', branch: validBranch, abbreviation: Buffer.alloc(0) },
      { name: 'missing one multi-OID key', branch: validPair, abbreviation: validAbbreviation },
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

