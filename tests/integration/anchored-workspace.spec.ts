import { resolve } from 'node:path';
import type { ServerResponse } from 'node:http';

import { expect, test, type Page } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const firstFileId = `file_${'a'.repeat(43)}`;
const secondFileId = `file_${'b'.repeat(43)}`;
const token = 't'.repeat(43);
let server: ViteDevServer | undefined;
let origin = '';

const path = (display: string) => ({
  bytesBase64url: Buffer.from(display).toString('base64url'),
  display,
  utf8: display,
});

const firstText = Array.from({ length: 20 }, (_, index) =>
  index === 9 ? 'export const changed = 2;' : `const context${index + 1} = ${index + 1};`,
).join('\n');
const changedFirstText = firstText.replace('export const changed = 2;', 'export const changed = 3;');

const session = {
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

function draftView(comments: readonly unknown[]) {
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

async function startAppServer(): Promise<string> {
  let comments: unknown[] = [];
  server = await createServer({
    configFile: resolve(repositoryRoot, 'vite.config.ts'),
    plugins: [{
      name: 'anchored-workspace-api',
      configureServer(viteServer) {
        viteServer.middlewares.use('/api/session', (_request, response) => json(response, session));
        viteServer.middlewares.use('/api/draft/comments', (request, response) => {
          let rawBody = '';
          request.on('data', (chunk) => { rawBody += String(chunk); });
          request.on('end', () => {
            const add = JSON.parse(rawBody) as { fileId: string; side: 'base' | 'head'; line: number; body: string };
            const accepted = {
              id: 'comment_123e4567-e89b-12d3-a456-426614174000',
              state: 'open',
              body: add.body.trim(),
              anchor: {
                version: 'durable-anchor-v1',
                path: path(add.fileId === firstFileId ? 'src/first.ts' : 'src/second.ts'),
                safeDisplayPath: add.fileId === firstFileId ? 'src/first.ts' : 'src/second.ts',
                side: add.side,
                line: add.line,
                blobOid: 'd'.repeat(40),
                selectedText: 'const context1 = 1;',
                context: { before: [], target: { line: add.line, text: 'const context1 = 1;' }, after: [] },
                contextHash: { algorithm: 'sha256-v1', value: 'f'.repeat(64) },
                uniqueKey: 'e'.repeat(64),
              },
              createdAt: '2026-07-21T00:00:00.000Z',
              updatedAt: '2026-07-21T00:00:00.000Z',
            };
            comments = [accepted];
            json(response, accepted, 201);
          });
        });
        viteServer.middlewares.use('/api/draft', (_request, response) => json(response, draftView(comments)));
        viteServer.middlewares.use('/api/files', (request, response) => {
          const fileId = request.url?.match(/^\/(file_[A-Za-z0-9_-]{43})\/content$/)?.[1];
          if (fileId !== firstFileId && fileId !== secondFileId) {
            response.statusCode = 404;
            response.end();
            return;
          }
          json(response, content(fileId));
        });
      },
    }],
    server: { host: '127.0.0.1', port: 0 },
  });
  await server.listen();
  return server.resolvedUrls?.local[0] ?? '';
}

async function openReview(page: Page): Promise<void> {
  await page.goto(`${origin}#token=${token}`);
  await expect(page.getByRole('heading', { level: 1, name: 'src/first.ts' })).toBeVisible();
  await expect(page.locator('.monaco-diff-editor')).toBeVisible();
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
  await page.getByRole('button', { name: 'Add comment to head line 1' }).click();
  const textarea = page.locator('.diff-workspace > section.inline-comment-composer textarea');
  await expect(textarea).toBeVisible();
  await textarea.fill('Please explain this context.');
  await textarea.blur();
  await expect(textarea).toHaveValue('Please explain this context.');
  await page.getByRole('button', { name: 'Add comment', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Show comment' })).toBeVisible();
});

test('draft resume and anchor states', async ({ page }) => {
  const pageErrors: Error[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await openReview(page);
  await expect(page.getByText('New local draft for this pinned comparison.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Start with a line' })).toBeVisible();
  expect(pageErrors).toEqual([]);
  expect(consoleErrors.filter((message) => !message.includes('Download the Vue Devtools extension'))).toEqual([]);
});
