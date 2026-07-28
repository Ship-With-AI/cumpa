import { expect, test } from '@playwright/test';
import type { ViteDevServer } from 'vite';
import { createServer } from 'vite';

let server: ViteDevServer;
let serverUrl: string;

const commentId = 'comment_00000000-0000-4000-8000-000000000001';
const originalBody = 'Resolved comment body.';
const savedBody = 'Resolved comment body, edited.';

const harnessModule = `
import { createApp, h, ref } from 'vue';
import InlineNotice from '/components/InlineNotice.vue';
import ReviewPanel from '/components/ReviewPanel.vue';
import ReviewToolbar from '/components/ReviewToolbar.vue';
import SelectorDriftNotice from '/components/SelectorDriftNotice.vue';

export function mountReviewPanelHarness(id, body) {
  const comments = ref([{
    id,
    fileId: 'file-1',
    exactFile: { kind: 'available', fileId: 'file-1' },
    side: 'head',
    line: 4,
    body,
    state: 'resolved',
    createdAt: '2026-07-23T00:00:00.000Z',
    status: 'verified',
    recordedAnchor: {
      version: 'durable-anchor-v1',
      path: { bytesBase64url: 'c3JjL2ZpbGUudHM', display: 'src/file.ts' },
      safeDisplayPath: 'src/file.ts',
      side: 'head',
      line: 4,
      blobOid: '0000000000000000000000000000000000000000',
      selectedText: 'const value = 1;',
      context: { before: [], target: { line: 4, text: 'const value = 1;' }, after: [] },
      contextHash: { algorithm: 'sha256-v1', value: '0000000000000000000000000000000000000000000000000000000000000000' },
      uniqueKey: '0000000000000000000000000000000000000000000000000000000000000000',
    },
  }]);
  const commentBuffer = ref(body);
  const summaryBuffer = ref('');
  const pending = ref(null);
  const selectedCommentId = ref(null);
  const conflict = ref(null);
  const failure = ref(null);
  const retainedSummary = ref(false);
  globalThis.__setReviewPanelState = (nextState) => {
    if ('pending' in nextState) pending.value = nextState.pending;
    if ('selectedCommentId' in nextState) selectedCommentId.value = nextState.selectedCommentId;
    if ('conflict' in nextState) conflict.value = nextState.conflict;
    if ('failure' in nextState) failure.value = nextState.failure;
    if ('retainedSummary' in nextState) retainedSummary.value = nextState.retainedSummary;
  };
  const reviewExpanded = ref(true);
  const saved = ref([]);
  const deleted = ref([]);

  document.body.innerHTML = '<div id="review-panel-harness"></div>';
  createApp({
    setup: () => () => h('main', [
      h(ReviewToolbar, {
        atFirstFile: true,
        atLastFile: true,
        hasActiveFile: true,
        openCommentCount: comments.value.filter((comment) => comment.state === 'open').length,
        resolvedCommentCount: comments.value.filter((comment) => comment.state === 'resolved').length,
        reviewExpanded: reviewExpanded.value,
        onComments: () => { reviewExpanded.value = !reviewExpanded.value; },
      }),
      h(ReviewPanel, {
        comments: comments.value,
        inventory: [{ identity: 'c3JjL2ZpbGUudHM', display: 'src/file.ts' }],
        summary: '',
        revision: 7,
        pinnedBase: { label: 'main', oid: '1'.repeat(40) },
        pinnedHead: { label: 'feature/export', oid: '2'.repeat(40) },
        summaryBuffer: summaryBuffer.value,
        commentBuffers: new Map([[id, commentBuffer.value]]),
        pending: pending.value,
        selectedCommentId: selectedCommentId.value,
        conflict: conflict.value,
        failure: failure.value,
        retainedSummary: retainedSummary.value,
        exportState: {
          pending: false,
          progress: null,
          phase: 'ready',
          failure: null,
          conflict: null,
          receipt: null,
          previousConfirmedReceipt: null,
          driftObservation: null,
          ignoreStatus: null,
          driftStale: false,
        },
        appendIgnoreRule: async () => ({ kind: 'alreadyIgnored' }),
        refreshIgnoreStatus: async () => {},
        revealExportDirectory: async () => ({ kind: 'revealed' }),
        'onUpdate:summaryBuffer': (value) => { summaryBuffer.value = value; },
        onCancelSummary: () => { summaryBuffer.value = ''; },
        onSaveSummary: () => { pending.value = 'summary'; },
        'onUpdate:commentBuffer': (_commentId, value) => { commentBuffer.value = value; },
        onSaveComment: (savedId) => {
          saved.value = [...saved.value, savedId];
          comments.value = comments.value.map((comment) => comment.id === savedId ? { ...comment, body: commentBuffer.value } : comment);
        },
        onDelete: (deletedId) => {
          deleted.value = [...deleted.value, deletedId];
          comments.value = comments.value.filter((comment) => comment.id !== deletedId);
        },
        onReopen: () => { pending.value = 'reopen'; },
        onCancelExport: () => {},
        onExport: () => {},
        onReloadLatest: () => {},
        onReviewUnsavedText: () => {},
      }),
      h(InlineNotice, { tone: 'warning', role: 'alert' }, {
        default: () => [
          h('h2', { id: 'notice-warning-heading', tabindex: -1 }, 'Warning notice'),
          h('p', 'Review this warning before continuing.'),
        ],
      }),
      h(InlineNotice, { tone: 'information', role: 'status' }, {
        default: () => [
          h('h2', { id: 'notice-information-heading' }, 'Information notice'),
          h('p', 'Informational status remains available.'),
        ],
      }),
      h(InlineNotice, { tone: 'success', role: 'note' }, {
        default: () => [
          h('h2', { id: 'notice-success-heading' }, 'Success notice'),
          h('p', 'The completed state remains explicit.'),
        ],
      }),
      h(SelectorDriftNotice, {
        drift: {
          base: {
            kind: 'moved',
            role: 'base',
            label: 'main',
            selectorType: 'branch',
            oldOid: '1'.repeat(40),
            newOid: '2'.repeat(40),
          },
          head: { kind: 'unchanged', role: 'head' },
        },
      }),
      h('output', { id: 'saved-comment-ids' }, saved.value.join(',')),
      h('output', { id: 'deleted-comment-ids' }, deleted.value.join(',')),
    ]),
  }).mount('#review-panel-harness');
}

`;

test.beforeAll(async () => {
  server = await createServer({
    configFile: 'vite.config.ts',
    plugins: [{
      name: 'review-panel-resolved-harness',
      resolveId: (id) => id === 'virtual:review-panel-resolved-harness' ? '\0review-panel-resolved-harness' : undefined,
      load: (id) => id === '\0review-panel-resolved-harness' ? harnessModule : undefined,
    }],
    server: { host: '127.0.0.1' },
  });
  await server.listen();
  serverUrl = server.resolvedUrls?.local[0] ?? '';
  expect(serverUrl).not.toBe('');
});

test.afterAll(async () => {
  await server.close();
});

test('review hierarchy, keyboard, discard, resolved lifecycle, and focus follow the UI contract', async ({ page }) => {
  await page.goto(serverUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async ({ commentId: id, body }) => {
    const { mountReviewPanelHarness } = await import(`/@id/${'virtual:review-panel-resolved-harness'}`);
    mountReviewPanelHarness(id, body);
  }, { commentId, body: originalBody });

  const reviewTrigger = page.getByRole('button', { name: 'Review', exact: true });
  await expect(reviewTrigger).toHaveAttribute('aria-expanded', 'true');
  await expect(reviewTrigger).toHaveAttribute('aria-controls', 'review-panel');
  await reviewTrigger.click();
  await expect(page.getByRole('button', { name: 'Review', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.review-panel__section')).toHaveCount(4);
  await expect(page.locator('.review-panel__heading-counts .review-state-badge')).toHaveText(['Open 0', 'Resolved 1']);

  await expect(page.getByRole('heading', { name: 'No open comments' })).toBeVisible();
  const summary = page.locator('.review-summary');
  const summaryDisclosure = page.getByRole('button', { name: 'Summary', exact: true });
  await expect(summary.locator('.review-summary__badges .review-state-badge')).toHaveText('Saved');
  await expect(summaryDisclosure).toHaveAttribute('aria-expanded', 'true');
  await expect(summaryDisclosure).toHaveAttribute('aria-controls', 'review-summary-content');
  await expect(page.locator('.review-panel__section').first()).toContainText('Summary');
  await expect(summary).toHaveCSS('box-shadow', 'none');

  const previewTab = page.getByRole('tab', { name: 'Preview' });
  const editTab = page.getByRole('tab', { name: 'Edit' });
  await expect(previewTab).toHaveAttribute('id', 'summary-tab-preview');
  await expect(previewTab).toHaveAttribute('aria-controls', 'summary-panel-preview');
  await expect(previewTab).toHaveClass(/ui-button--selected/);
  await previewTab.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(editTab).toHaveAttribute('aria-selected', 'true');
  await expect(editTab).toHaveClass(/ui-button--selected/);
  await expect(editTab).toBeFocused();

  const summaryEditor = page.getByRole('textbox', { name: 'Review summary (Markdown)' });
  await summaryEditor.fill('Unsaved summary');
  await expect(summaryEditor).toHaveAttribute('aria-describedby', 'review-summary-support');
  await expect(summary.locator('.review-summary__badges .review-state-badge')).toHaveText('Unsaved');
  await expect(page.locator('#review-summary-support')).toHaveText('Markdown is supported. Your summary changes only after you save.');

  const saveSummary = page.getByRole('button', { name: 'Save summary' });
  await saveSummary.click();
  const savingSummary = page.getByRole('button', { name: 'Saving summary…' });
  await expect(savingSummary).toHaveAttribute('aria-busy', 'true');
  await expect(savingSummary.locator('.ui-spinner')).toBeVisible();
  await expect(savingSummary).toHaveCSS('min-width', '144px');
  const cancelChanges = page.getByRole('button', { name: 'Cancel changes' });
  await expect(cancelChanges).toBeDisabled();
  await expect(cancelChanges).not.toHaveAttribute('aria-busy', 'true');

  await page.evaluate(() => globalThis.__setReviewPanelState({ pending: null, retainedSummary: true }));
  const retained = page.getByRole('status', { name: /Summary retained after reload/ });
  await expect(retained).toContainText('Latest draft loaded. Your unsaved text is still here.');
  await expect(summaryEditor).toHaveAttribute('aria-describedby', 'review-summary-support review-summary-feedback');

  await page.evaluate(() => globalThis.__setReviewPanelState({
    failure: { operation: 'summary' },
    retainedSummary: false,
  }));
  const summaryFailure = page.getByRole('alert', { name: 'Summary wasn’t saved' });
  await expect(summaryFailure).toBeFocused();
  await expect(summaryFailure.locator('svg[aria-hidden="true"]')).toHaveCount(1);
  await expect(summaryFailure).toHaveCSS('border-left-width', '3px');
  await expect(summaryEditor).toHaveAttribute('aria-invalid', 'true');
  await page.evaluate(() => globalThis.__setReviewPanelState({ failure: null }));

  await cancelChanges.click();
  const keepSummary = page.getByRole('button', { name: 'Keep editing' });
  await expect(keepSummary).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(summaryEditor).toBeFocused();
  await expect(summaryEditor).toHaveValue('Unsaved summary');
  await cancelChanges.click();
  await page.getByRole('button', { name: 'Discard changes' }).click();
  await expect(summaryDisclosure).toBeFocused();

  await page.getByRole('button', { name: /Resolved comments \(1\)/ }).click();
  const record = page.locator(`article[data-comment-id="${commentId}"]`);
  await expect(record).toHaveCount(1);
  await expect(record).toHaveCSS('border-radius', '0px');
  await expect(record).toHaveCSS('box-shadow', 'none');
  await expect(record.getByRole('heading', { name: 'src/file.ts · Head line 4' })).toBeVisible();
  await expect(record.getByText('Resolved', { exact: true })).toBeVisible();
  await expect(record.getByText('Verified', { exact: true })).toBeVisible();
  await expect(record.locator('.review-panel__group').or(page.locator('.review-panel__group'))).toHaveCount(1);

  await page.evaluate((id) => globalThis.__setReviewPanelState({ pending: null, selectedCommentId: id }), commentId);
  await expect(record).toHaveClass(/review-panel__comment--selected/);
  await expect(record.getByText('Selected', { exact: true })).toBeVisible();
  await record.getByRole('button', { name: 'Reopen' }).click();
  await expect(record.getByRole('button', { name: 'Reopening…' })).toHaveAttribute('aria-busy', 'true');
  await expect(record.getByRole('button', { name: 'Reopening…' }).locator('.ui-spinner')).toBeVisible();
  await page.evaluate((id) => globalThis.__setReviewPanelState({ pending: null, selectedCommentId: id }), commentId);

  await record.getByRole('button', { name: 'Edit' }).click();
  const editor = record.getByRole('textbox');
  await editor.fill('Discarded resolved edit.');
  await record.getByRole('button', { name: 'Cancel edit' }).click();
  const keepEditing = record.getByRole('button', { name: 'Keep editing' });
  await expect(keepEditing).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue('Discarded resolved edit.');
  await record.getByRole('button', { name: 'Cancel edit' }).click();
  await record.getByRole('button', { name: 'Discard edits' }).click();
  await expect(record.getByRole('button', { name: 'Edit' })).toBeFocused();
  await expect(record).toContainText(originalBody);

  await record.getByRole('button', { name: 'Edit' }).click();
  await editor.fill(savedBody);
  await record.getByRole('button', { name: 'Save comment' }).click();
  await expect(page.locator('#saved-comment-ids')).toHaveText(commentId);
  await expect(editor).toHaveCount(0);
  await expect(record).toContainText(savedBody);

  const deleteTrigger = record.getByRole('button', { name: 'Delete' });
  await deleteTrigger.click();
  await expect(record.getByRole('button', { name: 'Keep comment' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(deleteTrigger).toBeFocused();
  await deleteTrigger.click();
  await record.getByRole('button', { name: 'Delete comment' }).click();
  await expect(page.locator('#deleted-comment-ids')).toHaveText(commentId);
  await expect(record).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'No resolved comments' })).toBeVisible();
});

test('Phase 07 notice status language', async ({ page }) => {
  await page.goto(serverUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async ({ commentId: id, body }) => {
    const { mountReviewPanelHarness } = await import(`/@id/${'virtual:review-panel-resolved-harness'}`);
    mountReviewPanelHarness(id, body);
  }, { commentId, body: originalBody });

  await page.evaluate((id) => globalThis.__setReviewPanelState({
    failure: { operation: 'comment', commentId: id },
  }), commentId);
  const failure = page.getByRole('alert', { name: 'Review change failed' });
  await expect(failure).toBeFocused();
  await expect(failure.locator('svg[aria-hidden="true"]')).toHaveCount(1);
  await expect(failure.getByRole('heading', { name: 'Review change failed' })).toBeVisible();
  await expect(failure).toHaveCSS('border-left-width', '3px');


  const warning = page.locator('.inline-notice--warning').filter({ hasText: 'Warning notice' });
  const information = page.locator('.inline-notice--information');
  const success = page.locator('.inline-notice--success');
  const drift = page.locator('.selector-drift-notice');

  await expect(warning).toHaveAttribute('role', 'alert');
  await expect(information).toHaveAttribute('role', 'status');
  await expect(success).toHaveAttribute('role', 'note');
  await expect(drift).toHaveAttribute('role', 'status');

  for (const notice of [warning, information, success, drift]) {
    await expect(notice.locator('svg[aria-hidden="true"]')).toHaveCount(1);
    await expect(notice).toHaveCSS('border-left-width', '3px');
  }

  await expect(warning.getByRole('heading', { name: 'Warning notice' })).toBeVisible();
  await expect(information.getByRole('heading', { name: 'Information notice' })).toBeVisible();
  await expect(success.getByRole('heading', { name: 'Success notice' })).toBeVisible();
  await expect(drift.getByRole('heading', { name: 'Selected source changed — open review remains pinned' })).toBeVisible();
  await expect(drift).toHaveClass(/inline-notice--warning/);

  await warning.getByRole('heading', { name: 'Warning notice' }).focus();
  await expect(warning.getByRole('heading', { name: 'Warning notice' })).toBeFocused();
});
