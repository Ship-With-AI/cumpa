import { resolve } from 'node:path';
import type { ServerResponse } from 'node:http';

import { expect, test, type Page } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';

import { DraftLoadResponseSchema, SessionResponseSchema } from '../../src/contracts/api.js';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const token = 't'.repeat(43);
let server: ViteDevServer | undefined;
let origin = '';
let support = 'unverified';
let refreshes = 0;

function json(response: ServerResponse, body: unknown): void {
  response.setHeader('content-type', 'application/json');
  response.end(JSON.stringify(body));
}

async function startServer(): Promise<string> {
  server = await createServer({
    configFile: resolve(repositoryRoot, 'vite.config.ts'),
    plugins: [{
      name: 'support-dialog-api',
      configureServer(vite) {
        vite.middlewares.use('/api/session', (_request, response) => json(response, SessionResponseSchema.parse({
          base: { label: 'base', oid: 'a'.repeat(40) }, head: { label: 'head', oid: 'b'.repeat(40) }, mergeBaseOid: 'c'.repeat(40), files: [],
        })));
        vite.middlewares.use('/api/draft', (_request, response) => json(response, DraftLoadResponseSchema.parse({ kind: 'missing', path: '.cumpa/drafts/review.json' })));
        vite.middlewares.use('/api/selector-drift', (_request, response) => json(response, { base: { kind: 'unchanged', role: 'base' }, head: { kind: 'unchanged', role: 'head' } }));
        vite.middlewares.use('/api/support/status', (_request, response) => json(response, { status: support }));
        vite.middlewares.use('/api/support/refresh', (_request, response) => { refreshes += 1; json(response, { status: support }); });
        vite.middlewares.use('/api/support/checkout', (_request, response) => json(response, { kind: 'ready', url: 'https://checkout.example.test/' }));
        vite.middlewares.use('/api/support/recovery', (_request, response) => json(response, { kind: 'accepted' }));
      },
    }],
    server: { host: '127.0.0.1', port: 0 },
  });
  await server.listen();
  return server.resolvedUrls?.local[0] ?? '';
}

async function openReview(page: Page): Promise<void> {
  await page.goto(`${origin}#token=${token}`);
  await expect(page.getByRole('heading', { name: 'Support Cumpa' })).toBeVisible();
}

test.beforeAll(async () => { origin = await startServer(); });
test.afterAll(async () => { await server?.close(); });
test.beforeEach(() => { support = 'unverified'; refreshes = 0; });

test('invites after workspace readiness, dismisses for this session, and does not gate review', async ({ page }) => {
  await openReview(page);
  await expect(page.getByRole('button', { name: 'Support Cumpa — $49.99' })).toBeVisible();
  await expect(page.getByText('No PR-style changes in this pinned comparison')).toBeVisible();
  await page.getByRole('button', { name: 'Not now' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('No PR-style changes in this pinned comparison')).toBeVisible();
  await page.getByRole('button', { name: 'Support Cumpa' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('waits for verified API confirmation, preserves focus semantics, and recovers generically', async ({ page }) => {
  await openReview(page);
  await expect(page.locator('.review-shell')).toHaveAttribute('inert', '');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Support Cumpa' })).toBeFocused();
  await page.getByRole('button', { name: 'Support Cumpa' }).click();
  await page.getByRole('button', { name: 'Restore support' }).click();
  await page.getByLabel('Email').fill('person@example.test');
  await page.getByRole('button', { name: 'Send recovery email' }).click();
  await expect(page.getByText(/does not confirm whether support exists/)).toBeVisible();
  support = 'verified';
  await page.getByRole('button', { name: 'Keep reviewing' }).click();
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.getByRole('button', { name: 'Support Cumpa' }).click();
  await expect(page.getByText('Support is verified on this machine.')).toBeVisible();
  expect(refreshes).toBeGreaterThan(0);
});
