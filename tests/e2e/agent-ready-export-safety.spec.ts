import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ReviewExportV1Schema } from '../../src/contracts/draft.js';
import { canonicalizeReviewExport } from '../../src/export/review-export.js';
import { renderReviewMarkdown } from '../../src/export/render-review-markdown.js';
import { runGeneratedExport, runGeneratedRecovery, sampleGeneratedStablePair } from '../helpers/export-fault-runner.js';
import { createDirtyGitFixture } from '../helpers/git-fixture.js';
import { assertSourceControlUnchanged, captureSourceControlSnapshot } from '../helpers/source-control-snapshot.js';

function pair(summary: string): Readonly<{ readonly json: Buffer; readonly markdown: Buffer }> {
  const json = Buffer.from(canonicalizeReviewExport(ReviewExportV1Schema.parse({
    schemaVersion: 1,
    kind: 'diff-review/export',
    exportedAt: '2026-07-23T00:00:00.000Z',
    acceptedDraftRevision: 1,
    comparison: {
      selectedBase: { label: 'main', launchOid: '1'.repeat(40) },
      selectedHead: { label: 'feature', launchOid: '2'.repeat(40) },
      mergeBaseOid: '1'.repeat(40),
      comparisonKey: '4'.repeat(64),
    },
    drift: {
      observedAt: '2026-07-23T00:00:00.000Z',
      acknowledged: false,
      base: { launchOid: '1'.repeat(40), currentOid: '1'.repeat(40), status: 'unchanged' },
      head: { launchOid: '2'.repeat(40), currentOid: '2'.repeat(40), status: 'unchanged' },
    },
    summary: { markdown: summary },
    files: [],
    counts: { all: 0, openActionable: 0, openNeedsAttention: 0, resolved: 0 },
  })));
  return Object.freeze({ json, markdown: Buffer.from(renderReviewMarkdown(json), 'utf8') });
}

test('generated-process restart keeps the complete old stable pair when this packaged target refuses native re-export', async () => {
  const fixture = await createDirtyGitFixture();
  try {
    const before = await captureSourceControlSnapshot(fixture.root);
    const stable = join(fixture.root, '.diff-review', 'exports', `${'1'.repeat(40)}..${'2'.repeat(40)}`);
    const oldPair = pair('old generation');

    await expect(runGeneratedExport(fixture.root, oldPair, 'unsupported')).resolves.toMatchObject({ kind: 'exported' });
    const expected = Object.freeze({
      json: await readFile(join(stable, 'review.json')),
      markdown: await readFile(join(stable, 'review.md')),
    });
    await expect(runGeneratedExport(fixture.root, pair('new generation'), 'unsupported')).resolves.toEqual({ kind: 'reExportUnsupported' });
    await expect(sampleGeneratedStablePair(stable, 24)).resolves.toEqual(Array.from({ length: 24 }, () => expected));
    await expect(runGeneratedRecovery(fixture.root)).resolves.toEqual(expected);
    await expect(assertSourceControlUnchanged(before, await captureSourceControlSnapshot(fixture.root))).resolves.toBeUndefined();
  } finally {
    await fixture.cleanup();
  }
});
