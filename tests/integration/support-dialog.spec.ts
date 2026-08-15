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
let startAvailable = true;
let refreshes = 0;

function json(response: ServerResponse, body: unknown, statusCode = 200): void {
  response.statusCode = statusCode;
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
        vite.middlewares.use('/api/support/start', (_request, response) => {
          if (!startAvailable) {
            json(response, { message: 'Support is temporarily unavailable.' }, 503);
            return;
          }
          json(response, { url: 'https://flow.example.test/' });
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
  await page.getByRole('button', { name: 'Support Cumpa' }).click();
  await expect(page.getByRole('heading', { name: 'Support Cumpa' })).toBeVisible();
}

async function startHostedAction(page: Page, name: 'Support Cumpa — $49.99' | 'Restore support'): Promise<void> {
  const started = page.waitForRequest((request) => request.url().endsWith('/api/support/start'));
  const popup = page.waitForEvent('popup');
  await page.getByRole('button', { name }).click();
  expect(JSON.parse((await started).postData() ?? '')).toEqual({
    action: name === 'Restore support' ? 'restore' : 'support',
  });
  await expect(await popup).toHaveURL('https://flow.example.test/');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('Waiting for confirmation… You can close this and keep reviewing.')).toBeVisible();
}

test.beforeAll(async () => { origin = await startServer(); });
test.afterAll(async () => { await server?.close(); });
test.beforeEach(() => {
  support = 'unverified';
  startAvailable = true;
  refreshes = 0;
});

test('offers optional support without gating the review, preserving dialog accessibility and dismissal', async ({ page }) => {
  await openReview(page);
  await expect(page.locator('.review-shell')).toHaveAttribute('inert', '');
  await expect(page.getByRole('button', { name: 'Support Cumpa — $49.99' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restore support' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Not now' })).toBeVisible();
  await expect(page.getByText('No PR-style changes in this pinned comparison')).toBeVisible();
  await expect(page.getByLabel('Email')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /recovery email/i })).toHaveCount(0);
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Not now' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close support dialog' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Support Cumpa' })).toBeFocused();
  await page.getByRole('button', { name: 'Support Cumpa' }).click();
  await page.getByRole('button', { name: 'Not now' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('No PR-style changes in this pinned comparison')).toBeVisible();
});

test('hands Support and Restore to hosted tabs, allows cancellation, and keeps unavailable actions local', async ({ page }) => {
  await openReview(page);
  await startHostedAction(page, 'Support Cumpa — $49.99');
  await page.getByRole('button', { name: 'Keep reviewing' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('No PR-style changes in this pinned comparison')).toBeVisible();
  await page.getByRole('button', { name: 'Support Cumpa' }).click();
  await startHostedAction(page, 'Restore support');
  await page.getByRole('button', { name: 'Keep reviewing' }).click();
  await page.getByRole('button', { name: 'Support Cumpa' }).click();
  startAvailable = false;
  await page.getByRole('button', { name: 'Restore support' }).click();
  await expect(page.getByRole('button', { name: 'Restore support' })).toBeVisible();
  await expect(page.getByText('No PR-style changes in this pinned comparison')).toBeVisible();
});

test('only polling promotion thanks, closes, and suppresses future launches', async ({ page }) => {
  await openReview(page);
  await startHostedAction(page, 'Support Cumpa — $49.99');
  await expect(page.getByText('Waiting for confirmation… You can close this and keep reviewing.')).toBeVisible();
  support = 'verified';
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(page.getByText('Thank you for supporting Cumpa.')).toBeVisible();
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 3_000 });
  expect(refreshes).toBeGreaterThan(0);
  await page.reload();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('No PR-style changes in this pinned comparison')).toBeVisible();
});
