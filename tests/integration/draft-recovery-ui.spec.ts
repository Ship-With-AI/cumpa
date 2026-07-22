import { resolve } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { expect, test, type Page } from '@playwright/test';
import {
  DraftLoadResponseSchema,
  DraftRecoveryResultSchema,
  DraftRevealResultSchema,
  type DraftLoadResponse,
  type DraftRecoveryResult,
} from '../../src/contracts/api.js';
import { createServer, type ViteDevServer } from 'vite';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const token = 't'.repeat(43);
const safeDraftPath = '.diff-review/drafts/active-review.json';
const safeBackupPath = '.diff-review/drafts/active-review.corrupt-backup.json';
const fingerprint = 'a'.repeat(64);
const absolutePath = '/private/repositories/review/.diff-review/drafts/active-review.json';

let server: ViteDevServer | undefined;
let origin = '';
let draftLoad: DraftLoadResponse;
let recoveryResult: DraftRecoveryResult;
let releaseRecovery: (() => void) | undefined;
const recoveryBodies: string[] = [];
const revealBodies: string[] = [];

const session = {
  base: { label: 'base', oid: 'a'.repeat(40) },
  head: { label: 'head', oid: 'b'.repeat(40) },
  mergeBaseOid: 'c'.repeat(40),
  files: [],
};

function json(response: ServerResponse, body: unknown, statusCode = 200): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json');
  response.end(JSON.stringify(body));
}

function readBody(request: IncomingMessage): Promise<string> {
  const { promise, resolve: resolveBody } = Promise.withResolvers<string>();
  let body = '';
  request.on('data', (chunk) => { body += String(chunk); });
  request.on('end', () => resolveBody(body));
  return promise;
}

function malformedLoad() {
  return DraftLoadResponseSchema.parse({
    kind: 'malformed',
    path: safeDraftPath,
    fingerprint,
    detail: { message: 'Unexpected token at byte 1.' },
  });
}

function newerLoad() {
  return DraftLoadResponseSchema.parse({
    kind: 'newerUnsupported',
    path: safeDraftPath,
    foundVersion: 2,
    supportedVersion: 1,
  });
}

function recoveredResult() {
  return DraftRecoveryResultSchema.parse({
    kind: 'recovered',
    backupPath: safeBackupPath,
    draft: {
      schemaVersion: 1,
      comparison: {
        baseCommitOid: 'a'.repeat(40),
        headCommitOid: 'b'.repeat(40),
        mergeBaseOid: 'c'.repeat(40),
      },
      revision: 0,
      summary: '',
      comments: [],
    },
  });
}

async function startAppServer(): Promise<string> {
  server = await createServer({
    configFile: resolve(repositoryRoot, 'vite.config.ts'),
    plugins: [{
      name: 'draft-recovery-ui-api',
      configureServer(viteServer) {
        viteServer.middlewares.use('/api/session', (_request, response) => json(response, session));
        viteServer.middlewares.use('/api/draft', (_request, response) => json(response, draftLoad));
        viteServer.middlewares.use('/api/draft/reveal', async (request, response) => {
          revealBodies.push(await readBody(request));
          json(response, DraftRevealResultSchema.parse({ kind: 'revealed' }));
        });
        viteServer.middlewares.use('/api/draft/recovery', async (request, response) => {
          recoveryBodies.push(await readBody(request));
          if (releaseRecovery === undefined) {
            releaseRecovery = () => json(response, recoveryResult, recoveryResult.kind === 'recovered' ? 201 : 500);
            return;
          }
          json(response, recoveryResult, recoveryResult.kind === 'recovered' ? 201 : 500);
        });
      },
    }],
    server: { host: '127.0.0.1', port: 0 },
  });
  await server.listen();
  return server.resolvedUrls?.local[0] ?? '';
}

async function openDraft(page: Page): Promise<void> {
  await page.goto(`${origin}#token=${token}`);
  await expect(page.getByRole('heading', { level: 1, name: /Diff Review/ })).toBeVisible();
}

test.beforeAll(async () => {
  origin = await startAppServer();
});

test.afterAll(async () => {
  await server?.close();
});

test.beforeEach(async ({ context }) => {
  draftLoad = malformedLoad();
  recoveryResult = DraftRecoveryResultSchema.parse({ kind: 'persistenceFailure' });
  releaseRecovery = undefined;
  recoveryBodies.length = 0;
  revealBodies.length = 0;
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
});

test('corrupt drafts remain read only until the fingerprint-bound recovery response succeeds', async ({ page }) => {
  const requests: { url: string; method: string; postData: string | null }[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/draft/reveal') || request.url().includes('/api/draft/recovery')) {
      requests.push({ url: request.url(), method: request.method(), postData: request.postData() });
    }
  });

  await openDraft(page);
  await expect(page.getByRole('heading', { name: 'Local review draft needs recovery' })).toBeVisible();
  await expect(page.getByText('Read only', { exact: true })).toBeVisible();
  await expect(page.getByText(safeDraftPath, { exact: true })).toBeVisible();
  await expect(page.getByText('Unexpected token at byte 1.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reveal draft file' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy draft path' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back up and start new' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Comments' })).toHaveCount(0);
  await expect(page.getByText(absolutePath)).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(absolutePath);

  await page.getByRole('button', { name: 'Reveal draft file' }).click();
  await expect(page.getByText('Draft file revealed in the system file browser.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Copy draft path' }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(safeDraftPath);
  expect(revealBodies).toEqual(['']);
  expect(requests[0]).toEqual({ url: `${origin}api/draft/reveal`, method: 'POST', postData: null });

  const startNew = page.getByRole('button', { name: 'Back up and start new' });
  await startNew.click();
  const keepExisting = page.getByRole('button', { name: 'Keep existing draft' });
  await expect(keepExisting).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Start a new draft?' })).toHaveCount(0);
  await expect(startNew).toBeFocused();
  expect(recoveryBodies).toEqual([]);

  await startNew.click();
  await keepExisting.click();
  await expect(page.getByRole('heading', { name: 'Start a new draft?' })).toHaveCount(0);
  expect(recoveryBodies).toEqual([]);

  await startNew.click();
  await page.getByRole('button', { name: 'Back up and start new' }).last().click();
  await expect(page.getByText('Backing up existing draft…', { exact: true })).toBeVisible();
  releaseRecovery?.();
  await expect(page.getByRole('heading', { name: 'Recovery did not complete' })).toBeVisible();
  await expect(page.getByText('The existing draft is still read only and has not been replaced. Check the terminal details, then try again.', { exact: true })).toBeVisible();
  await expect(page.getByText(safeDraftPath, { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Comments' })).toHaveCount(0);
  expect(recoveryBodies).toEqual([JSON.stringify({ expectedFingerprint: fingerprint })]);
  expect(requests[1]).toEqual({
    url: `${origin}api/draft/recovery`,
    method: 'POST',
    postData: JSON.stringify({ expectedFingerprint: fingerprint }),
  });

  recoveryResult = recoveredResult();
  releaseRecovery = undefined;
  await startNew.click();
  await page.getByRole('button', { name: 'Back up and start new' }).last().click();
  await expect(page.getByRole('heading', { name: 'New draft started' })).toBeVisible();
  await expect(page.getByText(safeBackupPath, { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Comments' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Open new draft' }).click();
  await expect(page.getByRole('heading', { name: 'No PR-style changes in this pinned comparison' })).toBeVisible();
});

test('newer drafts are upgrade-only and expose only fixed reveal and safe copy actions', async ({ page }) => {
  draftLoad = newerLoad();
  const revealRequests: { url: string; postData: string | null }[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/draft/reveal')) {
      revealRequests.push({ url: request.url(), postData: request.postData() });
    }
  });

  await openDraft(page);
  await expect(page.getByRole('heading', { name: 'This draft needs a newer Diff Review' })).toBeVisible();
  await expect(page.getByText('Draft schema version 2 is newer than supported version 1. Upgrade Diff Review to open it. The file has not been changed.', { exact: true })).toBeVisible();
  await expect(page.getByText('Read only', { exact: true })).toBeVisible();
  await expect(page.getByText(safeDraftPath, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reveal draft file' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy draft path' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back up and start new' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /reset|downgrade|migrat|preview/i })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Comments' })).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(absolutePath);

  await page.getByRole('button', { name: 'Reveal draft file' }).click();
  await page.getByRole('button', { name: 'Copy draft path' }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(safeDraftPath);
  expect(revealBodies).toEqual(['']);
  expect(revealRequests).toEqual([{ url: `${origin}api/draft/reveal`, postData: null }]);
});
