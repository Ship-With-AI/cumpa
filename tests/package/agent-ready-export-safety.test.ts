import { chmod, readFile, writeFile } from 'node:fs/promises';

import { afterEach, describe, expect, test } from 'vitest';

import {
  createDirtyGitFixtureMatrix,
  type DirtyGitFixture,
} from '../helpers/git-fixture.js';
import {
  approvedGitignoreAppend,
  assertNoForbiddenProductCommands,
  assertSourceControlUnchanged,
  captureSourceControlSnapshot,
} from '../helpers/source-control-snapshot.js';

const fixtures: DirtyGitFixture[] = [];

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((fixture) => fixture.cleanup()));
});

describe('agent-ready export source-control safety evidence', () => {
  test('records four dirty real-Git selector fixtures and permits only the exact export and consent outputs', async () => {
    const matrix = await createDirtyGitFixtureMatrix();
    fixtures.push(...matrix);

    expect(matrix.map((fixture) => fixture.selectorKind)).toEqual([
      'branch-to-branch',
      'branch-to-worktree',
      'worktree-to-branch',
      'worktree-to-worktree',
    ]);

    for (const fixture of matrix) {
      const before = await captureSourceControlSnapshot(fixture.root);
      await fixture.write('.diff-review/exports/evidence.txt', 'generated export evidence\n');
      await expect(
        assertSourceControlUnchanged(before, await captureSourceControlSnapshot(fixture.root)),
      ).resolves.toBeUndefined();

      const originalGitignore = await readFile(fixture.gitignorePath);
      await writeFile(
        fixture.gitignorePath,
        Buffer.concat([originalGitignore, approvedGitignoreAppend]),
      );
      await expect(
        assertSourceControlUnchanged(before, await captureSourceControlSnapshot(fixture.root)),
      ).resolves.toBeUndefined();
    }
  });

  test('detects each forbidden source-control mutation class independently', async () => {
    const [fixture] = await createDirtyGitFixtureMatrix();
    fixtures.push(fixture);

    const controls: readonly [string, () => Promise<void>][] = [
      ['HEAD/ref', async () => { fixture.git(['update-ref', 'refs/heads/safety-control', 'HEAD']); }],
      ['remote', async () => { fixture.git(['remote', 'add', 'safety-control', 'https://example.invalid/control.git']); }],
      ['index', async () => { await fixture.write('index-control.txt', 'index mutation\n'); fixture.git(['add', '--', 'index-control.txt']); }],
      ['tracked source', async () => { await fixture.write('tracked.txt', 'forbidden mutation\n'); }],
      ['tracked mode', async () => { await chmod(fixture.path('tracked.txt'), 0o644); }],
      ['untracked bytes', async () => { await fixture.write('unexpected-control.bin', 'forbidden\0bytes'); }],
    ];

    for (const [label, mutate] of controls) {
      const before = await captureSourceControlSnapshot(fixture.root);
      await mutate();
      await expect(
        assertSourceControlUnchanged(before, await captureSourceControlSnapshot(fixture.root)),
        label,
      ).rejects.toThrow(label);
    }
  });

  test('rejects mutating Git, network, shell, repository executable, and package-script product commands', () => {
    for (const command of [
      ['git', 'add', '--', 'tracked.txt'],
      ['git', 'push', 'origin', 'feature'],
      ['git', 'fetch', 'https://example.invalid/repository.git'],
      ['sh', '-c', 'echo unsafe'],
      ['npm', 'run', 'unsafe'],
      ['.git/hooks/pre-commit'],
    ]) {
      expect(() => assertNoForbiddenProductCommands([command])).toThrow();
    }
  });
});
