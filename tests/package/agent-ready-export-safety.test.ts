import { chmod, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { lstat, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { ReviewExportV1Schema } from '../../src/contracts/draft.js';
import { canonicalizeReviewExport, parseCanonicalReviewExport } from '../../src/export/review-export.js';
import { renderReviewMarkdown } from '../../src/export/render-review-markdown.js';
import { runGeneratedExport, runGeneratedRecovery, sampleGeneratedStablePair } from '../helpers/export-fault-runner.js';

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

function candidatePair(marker: string): Readonly<{ readonly json: Buffer; readonly markdown: Buffer }> {
  const json = Buffer.from(canonicalizeReviewExport(ReviewExportV1Schema.parse({
    schemaVersion: 1,
    kind: 'diff-review/export',
    exportedAt: '2026-07-23T00:00:00.000Z',
    acceptedDraftRevision: 1,
    comparison: {
      selectedBase: { label: 'main', launchOid: '1'.repeat(40) },
      selectedHead: { label: 'feature', launchOid: '2'.repeat(40) },
      mergeBaseOid: '1'.repeat(40),
      comparisonKey: `${'1'.repeat(40)}..${'2'.repeat(40)}`,
    },
    drift: {
      status: 'unchanged',
      observedAt: '2026-07-23T00:00:00.000Z',
      acknowledged: false,
      base: { launchOid: '1'.repeat(40), currentOid: '1'.repeat(40), status: 'unchanged' },
      head: { launchOid: '2'.repeat(40), currentOid: '2'.repeat(40), status: 'unchanged' },
    },
    summary: { markdown: marker },
    files: [],
    counts: { all: 0, openActionable: 0, openNeedsAttention: 0, resolved: 0 },
  })));
  return Object.freeze({ json, markdown: Buffer.from(renderReviewMarkdown(json), 'utf8') });
}

describe('generated publication and recovery safety evidence', () => {
  test('keeps one complete stable pair through refusal and failure then independently validates final generated bytes', async () => {
    const [fixture] = await createDirtyGitFixtureMatrix();
    fixtures.push(fixture);
    const beforeSource = await captureSourceControlSnapshot(fixture.root);
    const oldPair = candidatePair('old stable generation');
    const newPair = candidatePair('new rejected generation');

    await expect(runGeneratedExport(fixture.root, oldPair, 'unsupported')).resolves.toMatchObject({ kind: 'exported' });
    const stable = join(fixture.root, '.diff-review', 'exports', `${'1'.repeat(40)}..${'2'.repeat(40)}`);
    const [oldJson, oldMarkdown] = await Promise.all([readFile(join(stable, 'review.json')), readFile(join(stable, 'review.md'))]);
    const stableStat = await lstat(stable);

    await expect(runGeneratedExport(fixture.root, newPair, 'unsupported')).resolves.toEqual({ kind: 'reExportUnsupported' });
    await expect(runGeneratedExport(fixture.root, newPair, 'failed')).resolves.toEqual({ kind: 'publicationFailed' });
    await expect(sampleGeneratedStablePair(stable, 32)).resolves.toEqual(
      Array.from({ length: 32 }, () => Object.freeze({ json: oldJson, markdown: oldMarkdown })),
    );

    expect((await lstat(stable)).ino).toBe(stableStat.ino);
    await expect(Promise.all([readFile(join(stable, 'review.json')), readFile(join(stable, 'review.md'))])).resolves.toEqual([oldJson, oldMarkdown]);
    const recovered = await runGeneratedRecovery(fixture.root);
    expect(recovered).toEqual({ json: oldJson, markdown: oldMarkdown });

    const names = await readdir(stable);
    expect(names.sort()).toEqual(['review.json', 'review.md']);
    expect(parseCanonicalReviewExport(oldJson)).toMatchObject({ summary: { markdown: 'old stable generation' } });
    expect(Buffer.from(renderReviewMarkdown(oldJson), 'utf8')).toEqual(oldMarkdown);
    expect(createHash('sha256').update(oldJson).digest('hex')).toMatch(/^[a-f0-9]{64}$/);
    expect(createHash('sha256').update(oldMarkdown).digest('hex')).toMatch(/^[a-f0-9]{64}$/);
    await expect(assertSourceControlUnchanged(beforeSource, await captureSourceControlSnapshot(fixture.root))).resolves.toBeUndefined();
  });
});
