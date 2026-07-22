import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, test, vi } from 'vitest';

import type { PinnedComparison } from '../../src/contracts/comparison.js';
import { createSelectorDriftObserver } from '../../src/git/selector-drift.js';
import type { GitRunner } from '../../src/git/runner.js';
import { createGitFixture, type GitFixture } from '../helpers/git-fixture.js';

const fixtures: GitFixture[] = [];
const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map(async (fixture) => fixture.cleanup()));
  await Promise.all(
    temporaryRoots.splice(0).map(async (root) => rm(root, { recursive: true, force: true })),
  );
});

function branch(refName: string): NonNullable<PinnedComparison['base']['source']> {
  return { kind: 'branch', id: `branch:${refName}`, refName };
}

function worktree(
  path: string,
  detached = true,
): NonNullable<PinnedComparison['base']['source']> {
  return { kind: 'worktree', id: `worktree:${path}`, path, detached, dirty: false };
}

function comparison(
  repositoryRoot: string,
  base: Readonly<{
    oid: string;
    source: NonNullable<PinnedComparison['base']['source']>;
  }>,
  head: Readonly<{
    oid: string;
    source: NonNullable<PinnedComparison['head']['source']>;
  }>,
): PinnedComparison {
  return {
    repositoryRoot,
    objectFormat: 'sha1',
    base: { label: 'base selection', oid: base.oid, source: base.source },
    head: { label: 'head selection', oid: head.oid, source: head.source },
    mergeBaseOid: base.oid,
    changedFiles: [],
    hasCommittedChanges: true,
  };
}

async function fixture(): Promise<GitFixture> {
  const created = await createGitFixture();
  fixtures.push(created);
  return created;
}

function oid(git: GitFixture, revision: string): string {
  return git.git(['rev-parse', '--verify', '--end-of-options', `${revision}^{commit}`]).toString('ascii').trim();
}

async function detachedWorktree(git: GitFixture, revision: string): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), 'diff-review-selector-worktree-'));
  temporaryRoots.push(path);
  git.git(['worktree', 'add', '--detach', path, revision]);
  return path;
}

describe('server-retained selector drift observation', () => {
  test('observes branch/worktree role combinations, detached heads, deleted registrations, and dirty bytes using full OIDs', async () => {
    const git = await fixture();
    const baseOid = oid(git, 'refs/heads/main');
    const headOid = oid(git, 'refs/heads/feature');
    const firstWorktree = await detachedWorktree(git, headOid);
    const secondWorktree = await detachedWorktree(git, baseOid);

    const cases = [
      {
        name: 'branch/branch',
        input: comparison(git.root, { oid: baseOid, source: branch('refs/heads/main') }, { oid: headOid, source: branch('refs/heads/feature') }),
      },
      {
        name: 'branch/worktree',
        input: comparison(git.root, { oid: baseOid, source: branch('refs/heads/main') }, { oid: headOid, source: worktree(firstWorktree) }),
      },
      {
        name: 'worktree/branch',
        input: comparison(git.root, { oid: baseOid, source: worktree(secondWorktree) }, { oid: headOid, source: branch('refs/heads/feature') }),
      },
      {
        name: 'worktree/worktree detached',
        input: comparison(git.root, { oid: baseOid, source: worktree(secondWorktree) }, { oid: headOid, source: worktree(firstWorktree) }),
      },
    ];

    for (const testCase of cases) {
      const result = await createSelectorDriftObserver(testCase.input).observe();
      expect(result, testCase.name).toEqual({
        base: { kind: 'unchanged', role: 'base' },
        head: { kind: 'unchanged', role: 'head' },
      });
    }

    git.git(['update-ref', 'refs/heads/feature', git.futureHeadOid]);
    git.git(['-C', firstWorktree, 'checkout', '--detach', git.futureHeadOid]);
    await writeFile(join(secondWorktree, 'dirty-only.txt'), 'uncommitted bytes stay local\n');

    const observed = await createSelectorDriftObserver(
      comparison(git.root, { oid: baseOid, source: worktree(secondWorktree) }, { oid: headOid, source: branch('refs/heads/feature') }),
    ).observe();
    expect(observed.base).toEqual({ kind: 'unchanged', role: 'base' });
    expect(observed.head).toEqual({
      kind: 'moved',
      role: 'head',
      label: 'head selection',
      selectorType: 'branch',
      oldOid: headOid,
      newOid: git.futureHeadOid,
    });

    const detachedMoved = await createSelectorDriftObserver(
      comparison(git.root, { oid: baseOid, source: branch('refs/heads/main') }, { oid: headOid, source: worktree(firstWorktree) }),
    ).observe();
    expect(detachedMoved.head).toEqual({
      kind: 'moved',
      role: 'head',
      label: 'head selection',
      selectorType: 'worktree',
      oldOid: headOid,
      newOid: git.futureHeadOid,
    });

    await rm(firstWorktree, { recursive: true, force: true });
    git.git(['worktree', 'prune']);
    const unavailable = await createSelectorDriftObserver(
      comparison(git.root, { oid: baseOid, source: branch('refs/heads/main') }, { oid: headOid, source: worktree(firstWorktree) }),
    ).observe();
    expect(unavailable.head).toEqual({
      kind: 'unavailable',
      role: 'head',
      label: 'head selection',
      selectorType: 'worktree',
      oldOid: headOid,
      reason: 'source-unavailable',
    });
    expect(JSON.stringify(unavailable)).not.toContain(firstWorktree);
  });

  test('uses option-terminated native argument arrays and leaves pinned comparison, draft, blobs, inventory, and anchors unchanged', async () => {
    const git = await fixture();
    const baseOid = oid(git, 'refs/heads/main');
    const headOid = oid(git, 'refs/heads/feature');
    const run = vi.fn<GitRunner['run']>(async (arguments_) => {
      expect(arguments_.slice(0, 3)).toEqual([
        'rev-parse',
        '--verify',
        '--end-of-options',
      ]);
      const revision = arguments_[3];
      expect(revision).toMatch(/^refs\/heads\/(?:main|feature)\^\{commit\}$/u);
      const currentOid = revision === 'refs/heads/main^{commit}' ? baseOid : headOid;
      return { stdout: Buffer.from(`${currentOid}\n`, 'ascii'), stderr: Buffer.alloc(0) };
    });
    const pinned = comparison(git.root, { oid: baseOid, source: branch('refs/heads/main') }, { oid: headOid, source: branch('refs/heads/feature') });
    const immutableSnapshot = structuredClone({
      pinned,
      comparisonKey: `${baseOid}:${headOid}`,
      draft: { revision: 7, raw: Buffer.from('{"summary":"local"}', 'utf8') },
      inventory: [{ id: 'file_a', blob: Buffer.from('immutable blob', 'utf8') }],
      anchors: [{ line: 4, blobOid: headOid }],
    });

    const observer = createSelectorDriftObserver(pinned, { runner: { run } });
    const result = await observer.observe();

    expect(result.head).toEqual({ kind: 'unchanged', role: 'head' });
    expect(run).toHaveBeenCalledTimes(2);
    expect(immutableSnapshot).toEqual({
      pinned,
      comparisonKey: `${baseOid}:${headOid}`,
      draft: { revision: 7, raw: Buffer.from('{"summary":"local"}', 'utf8') },
      inventory: [{ id: 'file_a', blob: Buffer.from('immutable blob', 'utf8') }],
      anchors: [{ line: 4, blobOid: headOid }],
    });
  });
});
