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
import ReviewPanel from '/components/ReviewPanel.vue';
import ReviewToolbar from '/components/ReviewToolbar.vue';

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
        pending: null,
        conflict: null,
        failure: null,
        retainedSummary: false,
        exportState: {
          pending: false,
          progress: null,
          phase: 'ready',
          failure: null,
          conflict: null,
          receipt: null,
          previousConfirmedReceipt: null,
          driftAcknowledgementToken: null,
          driftObservation: null,
          ignoreStatus: null,
          driftStale: false,
        },
        'onUpdate:summaryBuffer': (value) => { summaryBuffer.value = value; },
        onCancelSummary: () => { summaryBuffer.value = ''; },
        'onUpdate:commentBuffer': (_commentId, value) => { commentBuffer.value = value; },
        onSaveComment: (savedId) => {
          saved.value = [...saved.value, savedId];
          comments.value = comments.value.map((comment) => comment.id === savedId ? { ...comment, body: commentBuffer.value } : comment);
        },
        onDelete: (deletedId) => {
          deleted.value = [...deleted.value, deletedId];
          comments.value = comments.value.filter((comment) => comment.id !== deletedId);
        },
        onCancelExport: () => {},
        onExport: () => {},
        onReloadLatest: () => {},
        onReviewUnsavedText: () => {},
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
  await expect(reviewTrigger).toHaveAttribute('aria-expanded', 'false');

  await expect(page.getByRole('heading', { name: 'No open comments' })).toBeVisible();
  const summaryDisclosure = page.getByRole('button', { name: /Summary Saved/ });
  await expect(summaryDisclosure).toHaveAttribute('aria-expanded', 'true');
  await expect(summaryDisclosure).toHaveAttribute('aria-controls', 'review-summary-content');

  const previewTab = page.getByRole('tab', { name: 'Preview' });
  const editTab = page.getByRole('tab', { name: 'Edit' });
  await expect(previewTab).toHaveAttribute('id', 'summary-tab-preview');
  await expect(previewTab).toHaveAttribute('aria-controls', 'summary-panel-preview');
  await previewTab.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(editTab).toHaveAttribute('aria-selected', 'true');
  await expect(editTab).toBeFocused();

  const summaryEditor = page.getByRole('textbox', { name: 'Review summary (Markdown)' });
  await summaryEditor.fill('Unsaved summary');
  await page.getByRole('button', { name: 'Cancel changes' }).click();
  const keepSummary = page.getByRole('button', { name: 'Keep editing' });
  await expect(keepSummary).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(summaryEditor).toBeFocused();
  await expect(summaryEditor).toHaveValue('Unsaved summary');
  await page.getByRole('button', { name: 'Cancel changes' }).click();
  await page.getByRole('button', { name: 'Discard changes' }).click();
  await expect(summaryDisclosure).toBeFocused();

  await page.getByRole('button', { name: /Resolved comments \(1\)/ }).click();
  const record = page.locator(`[data-comment-id="${commentId}"]`);
  await expect(record).toHaveCount(1);

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
