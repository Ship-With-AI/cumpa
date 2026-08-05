import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ReviewExportV1Schema } from '../../src/contracts/draft.js';
import { canonicalizeReviewExport } from '../../src/export/review-export.js';
import { renderReviewMarkdown } from '../../src/export/render-review-markdown.js';
import { runGeneratedExport, runGeneratedRecovery, sampleGeneratedStablePair } from '../helpers/export-fault-runner.js';
import { createDirtyGitFixture } from '../helpers/git-fixture.js';
import { assertSourceControlUnchanged, captureSourceControlSnapshot } from '../helpers/source-control-snapshot.js';
import { createServer, type ViteDevServer } from 'vite';

let lifecycleServer: ViteDevServer;
let lifecycleUrl: string;

const lifecycleHarness = `
import { createApp, h, ref } from 'vue';
import ReviewPanel from '/components/ReviewPanel.vue';
import '/styles.css';

export function mountLifecycleHarness() {
  const lifecycle = ref('waiting');
  const result = ref(undefined);
  const finished = ref(0);
  const exportState = {
    pending: false, progress: null, phase: 'ready', failure: null, conflict: null,
    receipt: null, previousConfirmedReceipt: null, driftObservation: null,
    ignoreStatus: null, driftStale: false,
  };
  createApp({
    render: () => h('main', [
      h(ReviewPanel, {
        comments: [], inventory: [], summary: '', revision: 7, summaryBuffer: '',
        commentBuffers: new Map(), pending: null, conflict: null, failure: null,
        retainedSummary: null, exportState, appendIgnoreRule: async () => ({ kind: 'alreadyIgnored' }),
        refreshIgnoreStatus: async () => {}, revealExportDirectory: async () => ({ kind: 'revealed' }),
        attachedLifecycle: lifecycle.value, attachedReady: lifecycle.value === 'waiting',
        mutationLocked: lifecycle.value === 'finishing' || lifecycle.value === 'completed',
        attachedFailure: result.value,
        onFinishReview: () => { finished.value += 1; },
      }),
      h('output', { id: 'finish-count' }, String(finished.value)),
    ]),
  }).mount('#lifecycle-harness');
  globalThis.__setAttachedLifecycle = (next, nextResult) => {
    lifecycle.value = next;
    result.value = nextResult;
  };
}
`;

test.beforeAll(async () => {
  lifecycleServer = await createServer({
    configFile: 'vite.config.ts',
    plugins: [{
      name: 'attached-lifecycle-harness',
      resolveId: (id) => id === 'virtual:attached-lifecycle-harness' ? '\\0attached-lifecycle-harness' : undefined,
      load: (id) => id === '\\0attached-lifecycle-harness' ? lifecycleHarness : undefined,
    }],
    server: { host: '127.0.0.1' },
  });
  await lifecycleServer.listen();
  lifecycleUrl = lifecycleServer.resolvedUrls?.local[0] ?? '';
  expect(lifecycleUrl).not.toBe('');
});

test.afterAll(async () => {
  await lifecycleServer.close();
});

function pair(summary: string): Readonly<{ readonly json: Buffer; readonly markdown: Buffer }> {
  const json = Buffer.from(canonicalizeReviewExport(ReviewExportV1Schema.parse({
    schemaVersion: 1,
    kind: 'compare/export',
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

test('forced unavailable capability refuses re-export before touching the complete old stable pair', async () => {
  const fixture = await createDirtyGitFixture();
  try {
    const before = await captureSourceControlSnapshot(fixture.root);
    const stable = join(fixture.root, '.compare', 'exports', `${'1'.repeat(40)}..${'2'.repeat(40)}`);
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

test('attached lifecycle renders waiting, progress, completion, and safe recovery actions', async ({ page }) => {
  await page.goto(lifecycleUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    document.body.innerHTML = '<div id="lifecycle-harness"></div>';
    // Virtual Vite modules exist only after the test server starts.
    const { mountLifecycleHarness } = await import(`/@id/${'virtual:attached-lifecycle-harness'}`);
    mountLifecycleHarness();
  });

  const completion = page.getByRole('region', { name: 'Finish attached review' });
  await expect(completion).toContainText('The requesting agent is waiting. Only Finish review returns the accepted summary and comments. Exporting, closing, reloading, or disconnecting leaves this review unfinished.');
  await expect(completion.getByText('No feedback added')).toBeVisible();
  await completion.getByRole('button', { name: 'Finish review' }).click();
  await expect(page.locator('#finish-count')).toHaveText('1');

  await page.evaluate(() => globalThis.__setAttachedLifecycle('finishing'));
  await expect(completion.getByRole('button', { name: 'Finishing review…' })).toBeDisabled();
  await expect(completion.getByText('Validating accepted revision 7 and its recorded anchors…')).toHaveAttribute('role', 'status');

  await page.evaluate(() => globalThis.__setAttachedLifecycle('completed'));
  await expect(completion.getByText('Review finished')).toBeFocused();
  await expect(completion).toContainText('The accepted review was returned to the requesting agent from revision 7. You can close this tab.');

  await page.evaluate(() => globalThis.__setAttachedLifecycle('retryableFailure', {
    kind: 'staleAnchors', affectedCommentIds: [], affectedCount: 1,
  }));
  await expect(completion.getByRole('alert')).toContainText('Review can’t be finished');
  await expect(completion.getByRole('button', { name: 'Review stale feedback' })).toBeVisible();

  await page.evaluate(() => globalThis.__setAttachedLifecycle('retryableFailure', {
    kind: 'revisionConflict', expectedRevision: 7, actualRevision: 8,
  }));
  await expect(completion.getByRole('alert')).toContainText('Review changed before finishing');
  await expect(completion.getByRole('button', { name: 'Reload latest' })).toBeVisible();

  await page.evaluate(() => globalThis.__setAttachedLifecycle('retryableFailure', { kind: 'scopeInvalid' }));
  await expect(completion.getByRole('alert')).toContainText('Review scope is no longer valid');
  await expect(completion.getByRole('button', { name: 'View requested scope' })).toBeVisible();

  await page.evaluate(() => globalThis.__setAttachedLifecycle('retryableFailure', { kind: 'draftReadOnly' }));
  await expect(completion.getByRole('alert')).toContainText('Review draft needs recovery');
  await expect(completion.getByRole('button', { name: 'Reload review' })).toBeVisible();

  await page.evaluate(() => globalThis.__setAttachedLifecycle('terminalFailure'));
  await expect(completion.getByRole('alert')).toContainText('Finish status is ambiguous');
  await expect(completion.getByText('Do not retry Finish review from this tab.')).toBeVisible();

  await page.evaluate(() => globalThis.__setAttachedLifecycle('waitingDisconnected'));
  await expect(completion.getByRole('alert')).toContainText('Waiting for agent connection');

  await page.setViewportSize({ width: 320, height: 720 });
  await page.evaluate(() => globalThis.__setAttachedLifecycle('waiting'));
  const finish = completion.getByRole('button', { name: 'Finish review' });
  await expect(finish).toBeVisible();
  expect((await finish.boundingBox())?.height).toBeGreaterThanOrEqual(44);

  await page.setViewportSize({ width: 767, height: 720 });
  expect((await finish.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(finish).toBeVisible();
});
