import { afterEach, describe, expect, it } from 'vitest';

import { run } from '../../src/cli/run.js';
import {
  createGitFixture,
  type GitFixture,
} from '../helpers/git-fixture.js';

const fixtures: GitFixture[] = [];

async function fixture(options?: Parameters<typeof createGitFixture>[0]) {
  const created = await createGitFixture(options);
  fixtures.push(created);
  return created;
}

function output(fixtureRepository: GitFixture, arguments_: readonly string[]) {
  return fixtureRepository.git(arguments_).toString('ascii').trim();
}

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((item) => item.cleanup()));
});

describe('native-Git pinned comparison authority', () => {
  it('resolves a nested cwd to the canonical non-bare root while preserving ordered base then head labels', async () => {
    const repository = await fixture();

    const comparison = await run({
      cwd: repository.nestedCwd,
      base: { label: 'Base: main', revision: repository.baseRef },
      head: { label: 'Head: feature', revision: repository.headRef },
    });

    expect(comparison.repositoryRoot).toBe(repository.root);
    expect(comparison.base.label).toBe('Base: main');
    expect(comparison.head.label).toBe('Head: feature');
    expect(comparison.base.label).not.toBe(comparison.head.label);
  });

  it('pins full base, head, and sole merge-base OIDs equal to independent Git queries', async () => {
    const repository = await fixture();

    const comparison = await run({
      cwd: repository.nestedCwd,
      base: { label: 'main', revision: repository.baseRef },
      head: { label: 'feature', revision: repository.headRef },
    });

    const expectedBase = output(repository, [
      'rev-parse',
      '--verify',
      `${repository.baseRef}^{commit}`,
    ]);
    const expectedHead = output(repository, [
      'rev-parse',
      '--verify',
      `${repository.headRef}^{commit}`,
    ]);
    const expectedMergeBase = output(repository, [
      'merge-base',
      '--all',
      expectedBase,
      expectedHead,
    ]);

    expect(comparison).toMatchObject({
      objectFormat: 'sha1',
      base: { oid: expectedBase },
      head: { oid: expectedHead },
      mergeBaseOid: expectedMergeBase,
      hasCommittedChanges: true,
    });
    expect(comparison.base.oid).toMatch(/^[0-9a-f]{40}$/);
    expect(comparison.head.oid).toMatch(/^[0-9a-f]{40}$/);
    expect(comparison.mergeBaseOid).toMatch(/^[0-9a-f]{40}$/);
    expect(Object.isFrozen(comparison)).toBe(true);
    expect(Object.isFrozen(comparison.base)).toBe(true);
    expect(Object.isFrozen(comparison.head)).toBe(true);
  });

  it('keeps the committed fact stable after refs move and excludes staged, unstaged, and untracked-only bytes', async () => {
    const repository = await fixture({ committedHeadChange: false });
    await repository.write('tracked.txt', 'unstaged worktree bytes\n');
    await repository.write('staged-only.txt', 'staged worktree bytes\n');
    repository.git(['add', '--', 'staged-only.txt']);
    await repository.write('untracked-only.txt', 'untracked worktree bytes\n');

    const comparison = await run({
      cwd: repository.nestedCwd,
      base: { label: 'main', revision: repository.baseRef },
      head: { label: 'feature', revision: repository.headRef },
    });
    const snapshot = JSON.stringify(comparison);

    expect(comparison.hasCommittedChanges).toBe(false);
    expect(output(repository, ['status', '--porcelain'])).toContain(
      'staged-only.txt',
    );
    expect(output(repository, ['status', '--porcelain'])).toContain(
      'untracked-only.txt',
    );
    expect(output(repository, ['status', '--porcelain'])).toContain('tracked.txt');

    repository.git([
      'update-ref',
      repository.headRef,
      repository.futureHeadOid,
    ]);

    expect(output(repository, ['rev-parse', repository.headRef])).not.toBe(
      comparison.head.oid,
    );
    expect(JSON.stringify(comparison)).toBe(snapshot);
    expect(comparison.hasCommittedChanges).toBe(false);
  });

});
