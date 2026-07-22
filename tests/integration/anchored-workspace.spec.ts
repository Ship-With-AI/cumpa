import { resolve } from 'node:path';
import type { ServerResponse } from 'node:http';

import { expect, test, type Page } from '@playwright/test';
import { DraftMutationRequestSchema, DraftMutationResultSchema } from '../../src/contracts/api.js';
import { createServer, type ViteDevServer } from 'vite';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const firstFileId = `file_${'a'.repeat(43)}`;
const secondFileId = `file_${'b'.repeat(43)}`;
const token = 't'.repeat(43);
let server: ViteDevServer | undefined;
let origin = '';
let canonicalComments: unknown[] = [];
let contentRequests: string[] = [];

const collisionPath = (terminalByte: number) => ({
  bytesBase64url: Buffer.from([0x73, 0x72, 0x63, 0x2f, terminalByte, 0x2e, 0x74, 0x73]).toString('base64url'),
  display: 'src/�.ts',
});


const path = (display: string) => ({
  bytesBase64url: Buffer.from(display).toString('base64url'),
  display,
  utf8: display,
});

const firstText = Array.from({ length: 20 }, (_, index) =>
  index === 9 ? 'export const changed = 2;' : `const context${index + 1} = ${index + 1};`,
).join('\n');
const changedFirstText = firstText.replace('export const changed = 2;', 'export const changed = 3;');

let session = {
  base: { label: 'base', oid: 'a'.repeat(40) },
  head: { label: 'head', oid: 'b'.repeat(40) },
  mergeBaseOid: 'c'.repeat(40),
  files: [
    {
      fileId: firstFileId,
      status: { kind: 'modified' },
      newPath: path('src/first.ts'),
      additions: 1,
      deletions: 1,
      availability: { kind: 'text' },
    },
    {
      fileId: secondFileId,
      status: { kind: 'modified' },
      newPath: path('src/second.ts'),
      additions: 1,
      deletions: 1,
      availability: { kind: 'text' },
    },
  ],
};

function content(fileId: string) {
  const display = fileId === firstFileId ? 'src/first.ts' : 'src/second.ts';
  return {
    fileId,
    base: { exists: true, path: path(display), language: 'typescript', blobOid: 'd'.repeat(40), text: firstText },
    head: { exists: true, path: path(display), language: 'typescript', blobOid: 'e'.repeat(40), text: changedFirstText },
  };
}

function json(response: ServerResponse, body: unknown, statusCode = 200): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json');
  response.end(JSON.stringify(body));
}

function draftSnapshot(comments: readonly unknown[]) {
  return {
    schemaVersion: 1,
    comparison: {
      baseCommitOid: 'a'.repeat(40),
      headCommitOid: 'b'.repeat(40),
      mergeBaseOid: 'c'.repeat(40),
    },
    revision: comments.length,
    summary: '',
    comments,
  };
}

function draftView(comments: readonly object[]) {
  const draft = draftSnapshot(comments);
  return {
    ...draft,
    comments: draft.comments.map((comment) => ({
      ...comment,
      verification: { state: 'verified', reason: 'exact-match' },
    })),
  };
}

async function startAppServer(): Promise<string> {
  server = await createServer({
    configFile: resolve(repositoryRoot, 'vite.config.ts'),
    plugins: [{
      name: 'anchored-workspace-api',
      configureServer(viteServer) {
        viteServer.middlewares.use('/api/session', (_request, response) => json(response, session));
        viteServer.middlewares.use('/api/draft/mutations', (request, response) => {
          let rawBody = '';
          request.on('data', (chunk) => { rawBody += String(chunk); });
          request.on('end', () => {
            let input: unknown;
            try {
              input = JSON.parse(rawBody);
            } catch {
              response.statusCode = 400;
              response.end();
              return;
            }
            const mutation = DraftMutationRequestSchema.safeParse(input);
            if (!mutation.success || mutation.data.type !== 'addComment') {
              response.statusCode = 400;
              response.end();
              return;
            }

            const latest = draftSnapshot(canonicalComments);
            if (mutation.data.expectedRevision !== latest.revision) {
              json(response, DraftMutationResultSchema.parse({
                kind: 'revisionConflict',
                expectedRevision: mutation.data.expectedRevision,
                actualRevision: latest.revision,
                latest,
              }), 409);
              return;
            }

            const accepted = {
              id: 'comment_123e4567-e89b-12d3-a456-426614174000',
              state: 'open' as const,
              body: mutation.data.body,
              anchor: {
                version: 'durable-anchor-v1' as const,
                path: path(mutation.data.fileId === firstFileId ? 'src/first.ts' : 'src/second.ts'),
                safeDisplayPath: mutation.data.fileId === firstFileId ? 'src/first.ts' : 'src/second.ts',
                side: mutation.data.side,
                line: mutation.data.line,
                blobOid: 'd'.repeat(40),
                selectedText: 'const context1 = 1;',
                context: { before: [], target: { line: mutation.data.line, text: 'const context1 = 1;' }, after: [] },
                contextHash: { algorithm: 'sha256-v1' as const, value: 'f'.repeat(64) },
                uniqueKey: 'e'.repeat(64),
              },
              createdAt: '2026-07-21T00:00:00.000Z',
              updatedAt: '2026-07-21T00:00:00.000Z',
            };
            canonicalComments = [...canonicalComments, accepted];
            json(response, DraftMutationResultSchema.parse({
              kind: 'accepted',
              draft: draftSnapshot(canonicalComments),
            }), 201);
          });
        });
        viteServer.middlewares.use('/api/draft', (_request, response) => json(response, draftView(canonicalComments)));
        viteServer.middlewares.use('/api/files', (request, response) => {
          const fileId = request.url?.match(/^\/(file_[A-Za-z0-9_-]{43})\/content$/)?.[1];
          if (fileId !== firstFileId && fileId !== secondFileId) {
            response.statusCode = 404;
            response.end();
            return;
          }
          contentRequests.push(fileId);
          json(response, content(fileId));
        });
      },
    }],
    server: { host: '127.0.0.1', port: 0 },
  });
  await server.listen();
  return server.resolvedUrls?.local[0] ?? '';
}

async function openReview(page: Page, expectedPath = 'src/first.ts', resumeAttempt?: number): Promise<void> {
  const resumeQuery = resumeAttempt === undefined ? '' : `?resume=${resumeAttempt}`;
  await page.goto(`${origin}${resumeQuery}#token=${token}`);
  await expect(page.getByRole('heading', { level: 1, name: expectedPath })).toBeVisible();
  await expect(page.locator('.monaco-diff-editor')).toBeVisible();
}

async function hoverMonacoLine(page: Page, side: 'base' | 'head', text: string): Promise<void> {
  const editor = side === 'base' ? 'original' : 'modified';
  const line = page.locator(`.monaco-diff-editor .${editor} .view-line`).filter({ hasText: text });
  let bounds: { height: number; width: number; x: number; y: number } | undefined;
  await expect.poll(async () => {
    bounds = await line.evaluateAll((elements) => elements
      .map((element) => {
        const { height, width, x, y } = element.getBoundingClientRect();
        return { height, width, x, y };
      })
      .find(({ height, width }) => height > 0 && width > 0));
    return bounds !== undefined;
  }).toBe(true);
  await page.mouse.move(bounds!.x + 20, bounds!.y + 9);
}

test.beforeAll(async () => {
  origin = await startAppServer();
});

test.afterAll(async () => {
  await server?.close();
});

test('diff navigation and session state', async ({ page }) => {
  const pageErrors: Error[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await openReview(page);
  await expect(page.getByRole('button', { name: 'Previous file' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Next file' })).toBeEnabled();
  await expect(page.getByText('BASE', { exact: true })).toBeVisible();
  await expect(page.getByText('HEAD', { exact: true })).toBeVisible();
  await expect(page.getByText(/Unchanged regions begin collapsed/)).toBeVisible();


  await page.getByRole('button', { name: 'Next file' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'src/second.ts' })).toBeVisible();
  await page.keyboard.press('Alt+Shift+[');
  await expect(page.getByRole('heading', { level: 1, name: 'src/first.ts' })).toBeVisible();

  await page.getByRole('button', { name: 'Keyboard help' }).click();
  await expect(page.getByRole('heading', { name: 'Keyboard actions' })).toBeVisible();
  await expect(page.getByText('Shortcuts never replace the visible controls.')).toBeVisible();

  await page.setViewportSize({ width: 640, height: 700 });
  await expect.poll(() => page.locator('.review-main').evaluate((element) => element.getBoundingClientRect().width)).toBeGreaterThanOrEqual(640);
  await expect(page.getByRole('button', { name: 'Files', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Comments', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Comments' })).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors.filter((message) => !message.includes('Download the Vue Devtools extension'))).toEqual([]);
});

test('inline comment persistence', async ({ page }) => {
  await openReview(page);
  await hoverMonacoLine(page, 'head', 'export const changed = 3;');
  await page.getByRole('button', { name: 'Add comment to head line 10' }).click();
  const textarea = page.locator('.monaco-anchor-zone--composer textarea');
  await expect(textarea).toBeVisible();
  await textarea.fill('Please explain this context.');
  await textarea.blur();
  await expect(textarea).toHaveValue('Please explain this context.');
  await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Add comment' }).click();
  await expect(page.locator('.comments-rail__comment[data-comment-id="comment_123e4567-e89b-12d3-a456-426614174000"]')).toBeVisible();
});

test('draft resume and anchor states', async ({ page }) => {
  const pageErrors: Error[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await openReview(page);
  await expect(page.getByText('Local draft resumed. Accepted comments for this pinned comparison are ready.')).toBeVisible();
  await expect(page.getByText('Please explain this context.')).toBeVisible();
  expect(pageErrors).toEqual([]);
  expect(consoleErrors.filter((message) => !message.includes('Download the Vue Devtools extension'))).toEqual([]);
});

test('exact-byte draft resume', async ({ page }) => {
  const firstPath = collisionPath(0xff);
  const secondPath = collisionPath(0xfe);

  let resumeAttempt = 0;
  for (const { paths, anchorPath } of [
    { paths: [firstPath, secondPath], anchorPath: secondPath },
    { paths: [secondPath, firstPath], anchorPath: firstPath },
  ] as const) {
    session = {
      ...session,
      files: session.files.map((file, index) => ({ ...file, newPath: paths[index]! })),
    };
    comments = [{
      id: 'comment_123e4567-e89b-12d3-a456-426614174000',
      state: 'open',
      body: 'Restore the second exact-byte path.',
      anchor: {
        version: 'durable-anchor-v1',
        path: anchorPath,
        safeDisplayPath: anchorPath.display,
        side: 'head',
        line: 1,
        blobOid: 'd'.repeat(40),
        selectedText: 'const context1 = 1;',
        context: { before: [], target: { line: 1, text: 'const context1 = 1;' }, after: [] },
        contextHash: { algorithm: 'sha256-v1', value: 'f'.repeat(64) },
        uniqueKey: 'e'.repeat(64),
      },
      createdAt: '2026-07-21T00:00:00.000Z',
      updatedAt: '2026-07-21T00:00:00.000Z',
      verification: { state: 'verified', reason: 'exact-match' },
    }];
    await openReview(page, 'src/�.ts', resumeAttempt++);
    await expect(page.getByText('Restore the second exact-byte path.')).toBeVisible();
    contentRequests = [];
    await page.getByRole('button', { name: 'Show comment' }).click();
    await expect.poll(() => contentRequests).toEqual([secondFileId]);
  }
});

test('anchored gap closure', async ({ page }) => {
  session = {
    ...session,
    files: session.files.map((file) => ({
      ...file,
      newPath: path(file.fileId === firstFileId ? 'src/first.ts' : 'src/second.ts'),
    })),
  };
  comments = [
    {
      id: 'comment_11111111-1111-4111-8111-111111111111',
      state: 'open',
      body: 'Stale comment stays attached to its recorded anchor.',
      anchor: {
        version: 'durable-anchor-v1',
        path: path('src/first.ts'),
        safeDisplayPath: 'src/first.ts',
        side: 'head',
        line: 10,
        blobOid: 'd'.repeat(40),
        selectedText: 'export const changed = 2;',
        context: { before: [], target: { line: 10, text: 'export const changed = 2;' }, after: [] },
        contextHash: { algorithm: 'sha256-v1', value: 'f'.repeat(64) },
        uniqueKey: 'e'.repeat(64),
      },
      createdAt: '2026-07-21T00:00:00.000Z',
      updatedAt: '2026-07-21T00:00:00.000Z',
      verification: { state: 'stale', reason: 'anchor-mismatch' },
    },
    {
      id: 'comment_22222222-2222-4222-8222-222222222222',
      state: 'open',
      body: 'Orphan comment preserves its exact bytes.',
      anchor: {
        version: 'durable-anchor-v1',
        path: path('src/deleted.ts'),
        safeDisplayPath: 'src/deleted.ts',
        side: 'head',
        line: 8,
        blobOid: '0'.repeat(40),
        selectedText: 'const context8 = 8;',
        context: { before: [], target: { line: 8, text: 'const context8 = 8;' }, after: [] },
        contextHash: { algorithm: 'sha256-v1', value: 'a'.repeat(64) },
        uniqueKey: 'b'.repeat(64),
      },
      createdAt: '2026-07-21T00:00:00.000Z',
      updatedAt: '2026-07-21T00:00:00.000Z',
      verification: { state: 'orphaned', reason: 'anchor-unavailable' },
    },
  ];

  await page.setViewportSize({ width: 1440, height: 900 });
  await openReview(page);

  await hoverMonacoLine(page, 'head', 'export const changed = 3;');
  await page.getByRole('button', { name: 'Add comment to head line 10' }).click();
  const composer = page.locator('.monaco-anchor-zone--composer textarea');
  await expect(composer).toBeFocused();
  await composer.fill('Keep this draft while moving.');
  await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Discard draft' }).click();
  await expect(page.locator('.inline-comment-composer__confirm')).toBeVisible();
  await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Keep writing' }).click();
  await expect(composer).toHaveValue('Keep this draft while moving.');
  await hoverMonacoLine(page, 'head', 'const context11 = 11;');
  await page.getByRole('button', { name: 'Add comment to head line 11' }).click();
  await expect(page.locator('.inline-comment-composer__confirm')).toBeVisible();
  await expect(composer).toHaveValue('Keep this draft while moving.');
  await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Keep writing' }).click();
  await expect(composer).toHaveValue('Keep this draft while moving.');

  await hoverMonacoLine(page, 'head', 'const context11 = 11;');
  await page.getByRole('button', { name: 'Add comment to head line 11' }).click();
  await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Discard draft' }).click();
  const movedComposer = page.locator('.modified .monaco-anchor-zone--composer textarea');
  await expect(movedComposer).toBeFocused();
  await expect(movedComposer).toHaveValue('');

  await page.setViewportSize({ width: 1200, height: 900 });
  const commentsToggle = page.getByRole('button', { name: 'Comments', exact: true });
  await commentsToggle.click();
  await expect(page.getByRole('button', { name: 'Close comments' })).toBeVisible();
  await page.getByRole('button', { name: 'Close comments' }).click();
  await expect(commentsToggle).toBeFocused();
  await expect(page.locator('.comments-rail')).toHaveAttribute('inert', '');

  await page.setViewportSize({ width: 900, height: 900 });
  const filesToggle = page.getByRole('button', { name: 'Files', exact: true });
  await filesToggle.click();
  await expect(page.getByRole('button', { name: 'Close files' })).toBeVisible();
  await page.getByRole('button', { name: 'Close files' }).click();
  await expect(filesToggle).toBeFocused();
  await expect(page.locator('.review-files')).toHaveAttribute('inert', '');
  await page.setViewportSize({ width: 1440, height: 900 });

  const staleComment = page.locator('[data-comment-id="comment_11111111-1111-4111-8111-111111111111"]');
  const orphanComment = page.locator('[data-comment-id="comment_22222222-2222-4222-8222-222222222222"]');
  await expect(staleComment.getByText('Stale anchor')).toBeVisible();
  await expect(staleComment.getByText('Exact path bytes')).toBeVisible();
  await expect(staleComment.getByText('Blob OID')).toBeVisible();
  await expect(staleComment.getByText('Selected text')).toBeVisible();
  await expect(staleComment.getByText('Verification')).toBeVisible();
  await expect(orphanComment.getByText('Anchor unavailable')).toBeVisible();
  await expect(orphanComment.getByRole('button', { name: 'Inspect recorded file' })).toHaveCount(0);
  await orphanComment.getByRole('button', { name: 'Copy anchor details' }).click();
  await expect(page.getByText(/(Recorded anchor details copied|Couldn’t copy anchor details)/)).toBeVisible();

  await page.getByRole('button', { name: 'Next file' }).click();
  const inspectRecordedFile = staleComment.getByRole('button', { name: 'Inspect recorded file' });
  await inspectRecordedFile.click();
  await expect(page.getByRole('heading', { level: 1, name: 'src/first.ts' })).toBeVisible();
  await expect(inspectRecordedFile).toBeFocused();
});
