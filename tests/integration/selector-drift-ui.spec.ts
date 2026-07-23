import { resolve } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { expect, test, type Page } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';

import {
  SelectorDriftResponseSchema,
  type SelectorDriftResponse,
} from '../../src/contracts/api.js';
import { createSelectorDriftState } from '../../src/web/model/selector-drift-state.js';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const token = 't'.repeat(43);
const baseOid = 'a'.repeat(40);
const headOid = 'b'.repeat(40);
const movedBaseOid = 'd'.repeat(40);

let server: ViteDevServer | undefined;
let origin = '';
let driftResponse: SelectorDriftResponse;
const driftRequests: { body: string; method: string; url: string }[] = [];

const session = {
  base: { label: 'base', oid: baseOid },
  head: { label: 'head', oid: headOid },
  mergeBaseOid: 'c'.repeat(40),
  files: [],
};

function unchanged(): SelectorDriftResponse {
  return SelectorDriftResponseSchema.parse({
    base: { kind: 'unchanged', role: 'base' },
    head: { kind: 'unchanged', role: 'head' },
  });
}

function movedBase(): SelectorDriftResponse {
  return SelectorDriftResponseSchema.parse({
    base: {
      kind: 'moved',
      role: 'base',
      label: 'base',
      selectorType: 'branch',
      oldOid: baseOid,
      newOid: movedBaseOid,
    },
    head: { kind: 'unchanged', role: 'head' },
  });
}

function unavailableHead(): SelectorDriftResponse {
  return SelectorDriftResponseSchema.parse({
    base: { kind: 'unchanged', role: 'base' },
    head: {
      kind: 'unavailable',
      role: 'head',
      label: 'head worktree',
      selectorType: 'worktree',
      oldOid: headOid,
      reason: 'source-unavailable',
    },
  });
}

function json(response: ServerResponse, body: unknown): void {
  response.statusCode = 200;
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
function flush(): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, 0);
  return promise;
}


async function startAppServer(): Promise<string> {
  server = await createServer({
    configFile: resolve(repositoryRoot, 'vite.config.ts'),
    plugins: [{
      name: 'selector-drift-ui-api',
      configureServer(viteServer) {
        viteServer.middlewares.use('/api/session', (_request, response) => json(response, session));
        viteServer.middlewares.use('/api/draft', (_request, response) => json(response, { kind: 'missing', path: '.diff-review/drafts/active-review.json' }));
        viteServer.middlewares.use('/api/selector-drift', async (request, response) => {
          driftRequests.push({ body: await readBody(request), method: request.method ?? '', url: request.url ?? '' });
          json(response, driftResponse);
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
  await expect(page.getByRole('heading', { name: /Diff Review:/ })).toBeVisible();
}

test.beforeAll(async () => {
  origin = await startAppServer();
});

test.afterAll(async () => {
  await server?.close();
});

test.beforeEach(() => {
  driftResponse = unchanged();
  driftRequests.length = 0;
});

test('visible-only polling coalesces overlap and announces each selector transition once', async () => {
  const listeners = new Map<string, () => void>();
  let visibilityState: DocumentVisibilityState = 'visible';
  let interval: (() => void) | undefined;
  let intervalCleared = false;
  const first = Promise.withResolvers<SelectorDriftResponse>();
  let requestCount = 0;
  const announcements: string[] = [];
  const drift = createSelectorDriftState(
    {
      getSelectorDrift: async () => {
        requestCount += 1;
        return requestCount === 1 ? first.promise : movedBase();
      },
    },
    (message) => announcements.push(message),
    {
      document: {
        get visibilityState() { return visibilityState; },
        addEventListener(type, listener) { listeners.set(type, listener as () => void); },
        removeEventListener(type) { listeners.delete(type); },
      },
      setInterval(callback) {
        interval = callback as () => void;
        return 1;
      },
      clearInterval() { intervalCleared = true; },
    },
  );

  drift.start();
  drift.refresh();
  drift.refresh();
  expect(requestCount).toBe(1);

  first.resolve(movedBase());
  await first.promise;
  await flush();
  expect(requestCount).toBe(2);
  expect(announcements).toEqual(['Selected source changed. The open review remains pinned.']);

  interval?.();
  await flush();
  expect(announcements).toHaveLength(1);

  visibilityState = 'hidden';
  listeners.get('visibilitychange')?.();
  interval?.();
  await flush();
  expect(requestCount).toBe(3);

  visibilityState = 'visible';
  listeners.get('visibilitychange')?.();
  await flush();
  expect(requestCount).toBe(4);

  drift.stop();
  expect(intervalCleared).toBe(true);
});

test('selector drift uses the fixed endpoint and leaves the pinned review and focused draft buffer intact', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
  const browserRequests: { body: string | null; method: string; url: string }[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/selector-drift')) {
      browserRequests.push({ body: request.postData(), method: request.method(), url: request.url() });
    }
  });
  await openReview(page);
  expect(driftRequests).toHaveLength(1);

  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(50);
  expect(driftRequests).toHaveLength(1);

  driftResponse = movedBase();
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  const notice = page.getByRole('status', { name: 'Selected source changed — open review remains pinned' });
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('Base source moved');
  await expect(notice).toContainText(baseOid);
  await expect(notice).toContainText(movedBaseOid);

  const reviewDisclosure = page.getByRole('button', { name: 'Review', exact: true });
  if (await reviewDisclosure.getAttribute('aria-expanded') === 'false') {
    await reviewDisclosure.click();
  }
  await expect(reviewDisclosure).toHaveAttribute('aria-expanded', 'true');

  const summaryDisclosure = page.getByRole('button', { name: /^Summary\b/ });
  await expect(summaryDisclosure).toHaveAttribute('aria-expanded', 'true');
  const editSummary = page.getByRole('tab', { name: 'Edit', exact: true });
  await editSummary.click();
  await expect(editSummary).toHaveAttribute('aria-selected', 'true');

  const summary = page.getByLabel('Review summary (Markdown)');
  await summary.fill('Unsaved review buffer');
  await summary.focus();
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect.poll(() => driftRequests.length).toBe(3);
  await expect(summary).toHaveValue('Unsaved review buffer');
  await expect(summary).toBeFocused();
  await expect(page.getByRole('heading', { name: /aaaaaaa.*bbbbbbb/ })).toBeVisible();

  await page.getByRole('button', { name: `Copy pinned Base commit ${baseOid}` }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(baseOid);

  driftResponse = unavailableHead();
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(notice).toContainText('Head source unavailable');
  await expect(notice).toContainText(headOid);
  await expect(notice).toContainText('This source is no longer available.');
  await page.getByRole('button', { name: 'Launch new comparison' }).click();
  await expect(notice).toContainText('Return to the terminal and launch Diff Review again, then choose the current sources. This open review will remain pinned.');

  for (const request of browserRequests) {
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${origin}api/selector-drift`);
    expect(request.body).toBeNull();
  }
  for (const request of driftRequests) {
    expect(request.body).toBe('');
  }
});
