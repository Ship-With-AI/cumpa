import { resolve } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { expect, test, type Page } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const token = 't'.repeat(43);
const baseOid = 'a'.repeat(40);
const headOid = 'b'.repeat(40);
const exportDirectory = `.diff-review/exports/${baseOid}..${headOid}`;

let server: ViteDevServer | undefined;
let origin = '';
let exportAttempt = 0;
const revealBodies: string[] = [];

const session = {
  base: { label: 'base', oid: baseOid },
  head: { label: 'head', oid: headOid },
  mergeBaseOid: 'c'.repeat(40),
  files: [],
};

function json(response: ServerResponse, body: unknown, statusCode = 200): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json');
  response.end(JSON.stringify(body));
}

async function readBody(request: IncomingMessage): Promise<string> {
  let body = '';
  for await (const chunk of request) body += String(chunk);
  return body;
}

async function startAppServer(): Promise<string> {
  server = await createServer({
    configFile: resolve(repositoryRoot, 'vite.config.ts'),
    plugins: [{
      name: 'export-receipt-api',
      configureServer(viteServer) {
        viteServer.middlewares.use('/api/session', (_request, response) => json(response, session));
        viteServer.middlewares.use('/api/draft', (_request, response) => json(response, {
          kind: 'current',
          path: '.diff-review/drafts/export-receipt.json',
          draft: {
            schemaVersion: 1,
            comparison: { baseCommitOid: baseOid, headCommitOid: headOid, mergeBaseOid: 'c'.repeat(40) },
            revision: 3,
            summary: '',
            comments: [],
          },
        }));
        viteServer.middlewares.use('/api/export/gitignore', (_request, response) => json(response, { kind: 'ignored' }));
        viteServer.middlewares.use('/api/export/reveal', async (request, response) => {
          revealBodies.push(await readBody(request));
          json(response, { kind: 'revealFailed' }, 500);
        });
        viteServer.middlewares.use('/api/export', (_request, response) => {
          exportAttempt += 1;
          if (exportAttempt === 1) {
            json(response, {
              kind: 'exported',
              draftRevision: 3,
              exportedAt: '2026-07-23T12:34:56.000Z',
              driftAcknowledged: true,
              files: [
                { path: `${exportDirectory}/review.json`, algorithm: 'sha256', sha256: '1'.repeat(64), bytes: 128 },
                { path: `${exportDirectory}/review.md`, algorithm: 'sha256', sha256: '2'.repeat(64), bytes: 256 },
              ],
            });
            return;
          }
          json(response, { kind: 'publicationFailed' }, 500);
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
  await page.getByRole('button', { name: 'Review' }).click();
  await expect(page.getByRole('button', { name: 'Export review' })).toBeVisible();
}

test.beforeAll(async () => {
  origin = await startAppServer();
});

test.afterAll(async () => {
  await server?.close();
});

test.beforeEach(async ({ context }) => {
  exportAttempt = 0;
  revealBodies.length = 0;
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
});

test('renders only the confirmed receipt, copies it, and retains it after reveal and re-export failures', async ({ page }) => {
  await openReview(page);
  await page.getByRole('button', { name: 'Export review' }).click();

  const receipt = page.getByRole('region', { name: 'Review export complete' });
  await expect(receipt).toBeVisible();
  await expect(receipt).toContainText('Accepted revision 3');
  await expect(receipt).toContainText('2026-07-23T12:34:56.000Z');
  await expect(receipt).toContainText(`${exportDirectory}/review.json`);
  await expect(receipt).toContainText(`${exportDirectory}/review.md`);
  await expect(receipt).toContainText('sha256:1111111111111111111111111111111111111111111111111111111111111111');
  await expect(receipt).toContainText('128');

  await receipt.getByRole('button', { name: 'Copy receipt details' }).click();
  await expect(receipt.getByText('Receipt details copied')).toBeVisible();
  await expect(page.evaluate(() => navigator.clipboard.readText())).resolves.toContain(`${exportDirectory}/review.json`);

  await receipt.getByRole('button', { name: 'Reveal export directory' }).click();
  await expect(receipt.getByRole('alert')).toContainText('Could not reveal the export directory');
  expect(revealBodies).toEqual(['']);

  await page.getByRole('button', { name: 'Export review again' }).click();
  await expect(page.getByRole('heading', { name: 'Export was not published' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Previous confirmed export' })).toContainText(`${exportDirectory}/review.md`);
});
