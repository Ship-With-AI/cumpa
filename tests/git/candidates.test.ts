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
    expect(worktrees.map((candidate) => candidate.path)).toEqual([
      repository.root,
      linkedPath,
      detachedPath,
      unavailablePath,
    ]);

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

  it('defers complete branch discovery to uncached non-empty searches', async () => {
    const repository = await fixture();
    const calls: Array<{
      readonly arguments_: readonly string[];
      readonly cwd: string;
    }> = [];
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
    expect(
      calls
        .filter(
          ({ arguments_ }) =>
            arguments_[0] === 'for-each-ref' &&
            arguments_.includes('refs/heads'),
        )
        .every(({ arguments_ }) => arguments_.includes('--count=1')),
    ).toBe(true);

    const eagerCallCount = calls.length;
    await expect(discovery.searchBranches('')).resolves.toEqual([]);
    expect(calls).toHaveLength(eagerCallCount);

    await expect(discovery.searchBranches('FEATURE')).resolves.toMatchObject([
      {
        id: `branch:${repository.headRef}`,
        label: 'feature',
        refName: repository.headRef,
      },
    ]);
    expect(
      calls.filter(
        ({ arguments_ }) =>
          arguments_[0] === 'for-each-ref' &&
          arguments_.includes('--sort=refname'),
      ),
    ).toHaveLength(1);

    await expect(discovery.searchBranches('local branch')).resolves.toHaveLength(2);
    expect(
      calls.filter(
        ({ arguments_ }) =>
          arguments_[0] === 'for-each-ref' &&
          arguments_.includes('--sort=refname'),
      ),
    ).toHaveLength(2);

    const controller = new AbortController();
    controller.abort();
    await expect(
      discovery.searchBranches('feature', controller.signal),
    ).rejects.toMatchObject({ kind: 'aborted' });
    expect(
      calls.filter(
        ({ arguments_ }) =>
          arguments_[0] === 'for-each-ref' &&
          arguments_.includes('--sort=refname'),
      ),
    ).toHaveLength(2);
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

