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
      context: {
        before: [],
        target: { line: 4, text: 'const value = 1;' },
        after: [],
      },
      contextHash: {
        algorithm: 'sha256-v1',
        value: '0000000000000000000000000000000000000000000000000000000000000000',
      },
      uniqueKey: '0000000000000000000000000000000000000000000000000000000000000000',
    },
  }]);
  const commentBuffer = ref(body);
  const saved = ref([]);
  const deleted = ref([]);

  document.body.innerHTML = '<div id="review-panel-harness"></div>';
  createApp({
    setup: () => () => h('main', [
      h(ReviewPanel, {
        comments: comments.value,
        inventory: [{ identity: 'c3JjL2ZpbGUudHM', display: 'src/file.ts' }],
        summary: '',
        summaryBuffer: '',
        commentBuffers: new Map([[id, commentBuffer.value]]),
        pending: false,
        conflict: false,
        'onUpdate:commentBuffer': (_commentId, value) => {
          commentBuffer.value = value;
        },
        onSaveComment: (commentId) => {
          saved.value = [...saved.value, commentId];
          comments.value = comments.value.map((comment) => comment.id === commentId
            ? { ...comment, body: commentBuffer.value }
            : comment,
          );
        },
        onDelete: (commentId) => {
          deleted.value = [...deleted.value, commentId];
          comments.value = comments.value.filter((comment) => comment.id !== commentId);
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

test('resolved verified comments support edit, cancel, save, and confirmed deletion', async ({ page }) => {
  await page.goto(serverUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async ({ commentId: id, body }) => {
    // Browser-only Vite endpoint must load the harness after the dev server starts.
    const { mountReviewPanelHarness } = await import(`/@id/${'virtual:review-panel-resolved-harness'}`);
    mountReviewPanelHarness(id, body);
  }, { commentId, body: originalBody });

  await page.getByRole('button', { name: /Resolved comments \(1\)/ }).click();
  const record = page.locator(`[data-comment-id="${commentId}"]`);
  await expect(record).toHaveCount(1);

  await record.getByRole('button', { name: 'Edit' }).click();
  const editor = record.getByRole('textbox');
  await expect(editor).toHaveValue(originalBody);
  await editor.fill('Discarded resolved edit.');
  await record.getByRole('button', { name: 'Cancel edit' }).click();
  await expect(editor).toHaveCount(0);
  await expect(record).toContainText(originalBody);

  await record.getByRole('button', { name: 'Edit' }).click();
  await editor.fill(savedBody);
  await record.getByRole('button', { name: 'Save comment' }).click();
  await expect(page.locator('#saved-comment-ids')).toHaveText(commentId);
  await expect(editor).toHaveCount(0);
  await expect(record).toContainText(savedBody);

  await record.getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('#deleted-comment-ids')).toBeEmpty();
  await expect(record.getByRole('heading', { name: 'Delete comment?' })).toBeVisible();
  await record.getByRole('button', { name: 'Delete comment' }).click();
  await expect(page.locator('#deleted-comment-ids')).toHaveText(commentId);
  await expect(record).toHaveCount(0);
});
