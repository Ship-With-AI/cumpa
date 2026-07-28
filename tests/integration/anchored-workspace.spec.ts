import { resolve } from 'node:path';
import type { ServerResponse } from 'node:http';

import { expect, test, type Page } from '@playwright/test';
import {
  DraftLoadResponseSchema,
  DraftMutationRequestSchema,
  DraftMutationResultSchema,
} from '../../src/contracts/api.js';
import { createServer, type ViteDevServer } from 'vite';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const firstFileId = `file_${'a'.repeat(43)}`;
const secondFileId = `file_${'b'.repeat(43)}`;
const token = 't'.repeat(43);
let server: ViteDevServer | undefined;
let origin = '';
let canonicalComments: unknown[] = [];
let contentRequests: string[] = [];
type DelayedMutationOutcome = 'accepted' | 'persistenceFailure' | 'revisionConflict';

type DelayedMutation = Readonly<{
  outcome: DelayedMutationOutcome;
  received: Promise<void>;
  release: () => void;
  notifyReceived: () => void;
  waitForRelease: () => Promise<void>;
}>;

let delayedMutation: DelayedMutation | undefined;

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
const secondText = firstText.replace('export const changed = 2;', 'export const secondChanged = 2;');
const changedSecondText = secondText.replace('export const secondChanged = 2;', 'export const secondChanged = 3;');

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
  const [baseText, headText] = fileId === firstFileId
    ? [firstText, changedFirstText]
    : [secondText, changedSecondText];
  return {
    fileId,
    base: { exists: true, path: path(display), language: 'typescript', blobOid: 'd'.repeat(40), text: baseText },
    head: { exists: true, path: path(display), language: 'typescript', blobOid: 'e'.repeat(40), text: headText },
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
      verification: 'verification' in comment
        ? comment.verification
        : { state: 'verified', reason: 'exact-match' },
    })),
  };
}

function draftLoad(comments: readonly object[]) {
  return DraftLoadResponseSchema.parse({
    kind: 'current',
    path: '.diff-review/drafts/anchored-workspace.json',
    draft: draftView(comments),
  });
}

function delayNextMutation(outcome: DelayedMutationOutcome): DelayedMutation {
  const received = Promise.withResolvers<void>();
  const released = Promise.withResolvers<void>();
  const delayed: DelayedMutation = {
    outcome,
    received: received.promise,
    release: released.resolve,
    notifyReceived: received.resolve,
    waitForRelease: () => released.promise,
  };
  delayedMutation = delayed;
  return delayed;
}

function resetAsyncSettlementFixture(): void {
  session = {
    ...session,
    files: session.files.map((file) => ({
      ...file,
      newPath: path(file.fileId === firstFileId ? 'src/first.ts' : 'src/second.ts'),
    })),
  };
  canonicalComments = [];
  contentRequests = [];
  delayedMutation = undefined;
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
          request.on('end', async () => {
            let input: unknown;
            try {
              input = JSON.parse(rawBody);
            } catch {
              response.statusCode = 400;
              response.end();
              return;
            }
            const mutation = DraftMutationRequestSchema.safeParse(input);
            if (!mutation.success) {
              response.statusCode = 400;
              response.end();
              return;
            }

            const delayed = delayedMutation;
            if (delayed !== undefined) {
              delayedMutation = undefined;
              delayed.notifyReceived();
              await delayed.waitForRelease();
            }

            const latest = draftSnapshot(canonicalComments);
            if (delayed?.outcome === 'revisionConflict') {
              const conflictLatest = latest;
              json(response, DraftMutationResultSchema.parse({
                kind: 'revisionConflict',
                expectedRevision: mutation.data.expectedRevision,
                actualRevision: conflictLatest.revision,
                latest: conflictLatest,
              }), 409);
              return;
            }
            if (delayed?.outcome === 'persistenceFailure') {
              json(response, DraftMutationResultSchema.parse({ kind: 'persistenceFailure' }), 500);
              return;
            }

            if (mutation.data.expectedRevision !== latest.revision) {
              json(response, DraftMutationResultSchema.parse({
                kind: 'revisionConflict',
                expectedRevision: mutation.data.expectedRevision,
                actualRevision: latest.revision,
                latest,
              }), 409);
              return;
            }

            if (mutation.data.type === 'deleteComment') {
              canonicalComments = canonicalComments.filter(
                (comment) => typeof comment !== 'object' || comment === null || !('id' in comment) || comment.id !== mutation.data.commentId,
              );
              json(response, DraftMutationResultSchema.parse({
                kind: 'accepted',
                draft: draftSnapshot(canonicalComments),
              }), 201);
              return;
            }

            if (mutation.data.type !== 'addComment') {
              response.statusCode = 400;
              response.end();
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
        viteServer.middlewares.use('/api/draft', (_request, response) => json(response, draftLoad(canonicalComments)));
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

type GeometryRect = Readonly<{ x: number; y: number; width: number; height: number }>;
type ScrollGeometry = Readonly<{
  clientHeight: number;
  clientWidth: number;
  rect: GeometryRect;
  scrollHeight: number;
  scrollWidth: number;
}>;

type MonacoGeometry = Readonly<{
  action: GeometryRect | null;
  codeOrigin: Readonly<{ tokenX: number; viewLineX: number; lineHeight: number }> | null;
  diffCanvas: ScrollGeometry | null;
  diffViewport: ScrollGeometry | null;
  document: Readonly<{ clientWidth: number; scrollWidth: number }>;
  gutters: readonly number[];
  panes: readonly GeometryRect[];
  reviewMain: ScrollGeometry | null;
  reviewShell: ScrollGeometry | null;
  sashes: readonly GeometryRect[];
  scrollOwners: readonly Readonly<{ clientHeight: number; clientWidth: number; scrollHeight: number; scrollWidth: number }>[];
  zones: readonly GeometryRect[];
}>;

async function readMonacoGeometry(page: Page, targetText: string): Promise<MonacoGeometry> {
  return page.evaluate((text) => {
    const canvasBounds = document.querySelector('.diff-workspace__canvas')?.getBoundingClientRect();
    const rawRect = (element: Element | null): GeometryRect | null => {
      if (element === null) return null;
      const { x, y, width, height } = element.getBoundingClientRect();
      return { height, width, x, y };
    };
    const rect = (element: Element | null): GeometryRect | null => {
      const bounds = rawRect(element);
      if (bounds === null) return null;
      return {
        height: bounds.height,
        width: bounds.width,
        x: bounds.x - (canvasBounds?.x ?? 0),
        y: bounds.y - (canvasBounds?.y ?? 0),
      };
    };
    const scrollDimensions = (element: HTMLElement) => ({
      clientHeight: element.clientHeight,
      clientWidth: element.clientWidth,
      scrollHeight: element.scrollHeight,
      scrollWidth: element.scrollWidth,
    });
    const scrollGeometry = (element: HTMLElement | null): ScrollGeometry | null => {
      if (element === null) return null;
      const bounds = rawRect(element);
      if (bounds === null) return null;
      return { ...scrollDimensions(element), rect: bounds };
    };
    const action = document.querySelector('.diff-workspace__gutter-action');
    const actionBounds = action?.getBoundingClientRect();
    const actionRect = rect(action);
    const line = [...document.querySelectorAll('.monaco-diff-editor .modified .view-line')]
      .filter((element) => element.getBoundingClientRect().height > 0)
      .find((element) => {
        const bounds = element.getBoundingClientRect();
        return actionBounds !== undefined
          && actionBounds.y + actionBounds.height / 2 >= bounds.y
          && actionBounds.y + actionBounds.height / 2 <= bounds.y + bounds.height;
      }) ?? [...document.querySelectorAll('.monaco-diff-editor .modified .view-line')]
      .find((element) => (element.textContent?.includes(text) || (element as HTMLElement).innerText.includes(text))
        && element.getBoundingClientRect().height > 0);
    const lineRect = rect(line ?? null);
    const tokenRect = rect(line?.querySelector('span') ?? null);
    const reviewMain = document.querySelector<HTMLElement>('.review-main');
    const reviewShell = document.querySelector<HTMLElement>('.review-shell');
    const diffViewport = document.querySelector<HTMLElement>('.diff-workspace__viewport');
    const diffCanvas = document.querySelector<HTMLElement>('.diff-workspace__canvas');
    return {
      action: actionRect,
      codeOrigin: lineRect === null || tokenRect === null
        ? null
        : { tokenX: tokenRect.x, viewLineX: lineRect.x, lineHeight: lineRect.height },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      },
      gutters: [...document.querySelectorAll('.monaco-diff-editor .margin')]
        .map((element) => element.getBoundingClientRect().width),
      panes: [...document.querySelectorAll('.monaco-diff-pane--base, .monaco-diff-pane--head')]
        .map((element) => rect(element)).filter((value): value is GeometryRect => value !== null),
      diffCanvas: scrollGeometry(diffCanvas),
      diffViewport: scrollGeometry(diffViewport),
      reviewMain: scrollGeometry(reviewMain),
      reviewShell: scrollGeometry(reviewShell),
      sashes: [...document.querySelectorAll('.monaco-diff-editor .monaco-sash')]
        .map((element) => rect(element)).filter((value): value is GeometryRect => value !== null
          && value.width > 0 && value.height > 0),
      scrollOwners: [...document.querySelectorAll<HTMLElement>('.monaco-diff-editor .monaco-scrollable-element')]
        .map(scrollDimensions),
      zones: [...document.querySelectorAll('.monaco-anchor-zone')]
        .map((element) => rect(element)).filter((value): value is GeometryRect => value !== null),
    };
  }, targetText);
}

function expectAnchoringNotToReflow(before: MonacoGeometry, anchored: MonacoGeometry): void {
  expect(anchored.codeOrigin).toEqual(before.codeOrigin);
  expect(anchored.gutters).toEqual(before.gutters);
  expect(anchored.panes).toEqual(before.panes);
  expect(anchored.sashes).toEqual(before.sashes);
  expect(anchored.action).toEqual(before.action);
  expect(anchored.document).toEqual(before.document);
  expect(anchored.reviewMain).toMatchObject(before.reviewMain ?? {});
  expect(anchored.scrollOwners.map(({ clientHeight, clientWidth, scrollWidth }) => ({ clientHeight, clientWidth, scrollWidth })))
    .toEqual(before.scrollOwners.map(({ clientHeight, clientWidth, scrollWidth }) => ({ clientHeight, clientWidth, scrollWidth })));
  expect(anchored.document.scrollWidth).toBeLessThanOrEqual(anchored.document.clientWidth);
}

function expectConversationCardNotToReflow(before: MonacoGeometry, anchored: MonacoGeometry): void {
  expect(anchored.codeOrigin).toEqual(before.codeOrigin);
  expect(anchored.gutters).toEqual(before.gutters);
  expect(anchored.panes).toEqual(before.panes);
  expect(anchored.sashes).toEqual(before.sashes);
  expect(anchored.document).toEqual(before.document);
  expect(anchored.reviewMain).toMatchObject(before.reviewMain ?? {});
  expect(anchored.scrollOwners.map(({ clientHeight, clientWidth, scrollWidth }) => ({ clientHeight, clientWidth, scrollWidth })))
    .toEqual(before.scrollOwners.map(({ clientHeight, clientWidth, scrollWidth }) => ({ clientHeight, clientWidth, scrollWidth })));
  expect(anchored.document.scrollWidth).toBeLessThanOrEqual(anchored.document.clientWidth);
}

async function ensureReviewOpen(page: Page): Promise<void> {
  const reviewButton = page.getByRole('button', { name: 'Review', exact: true });
  await expect(reviewButton).toBeVisible();
  const expanded = await reviewButton.getAttribute('aria-expanded');
  expect(expanded).toMatch(/^(?:true|false)$/u);
  if (expanded === 'false') {
    await reviewButton.click();
  }
  await expect(reviewButton).toHaveAttribute('aria-expanded', 'true');
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
  const contextBaseLabel = page.locator('.review-context-header__endpoint--base .review-context-header__endpoint-label');
  const contextHeadLabel = page.locator('.review-context-header__endpoint--head .review-context-header__endpoint-label');
  await expect(contextBaseLabel).toHaveText('Base');
  await expect(contextHeadLabel).toHaveText('Head');
  await expect(contextBaseLabel).toHaveCSS('text-transform', 'uppercase');
  await expect(contextHeadLabel).toHaveCSS('text-transform', 'uppercase');
  await expect(page.getByText(/Unchanged regions begin collapsed/)).toBeVisible();


  await page.getByRole('button', { name: 'Next file' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'src/second.ts' })).toBeVisible();
  await page.keyboard.press('Alt+Shift+[');
  await expect(page.getByRole('heading', { level: 1, name: 'src/first.ts' })).toBeVisible();

  await page.getByRole('button', { name: 'Keyboard help' }).click();
  await expect(page.getByRole('heading', { name: 'Keyboard actions' })).toBeVisible();
  await expect(page.getByText('Shortcuts never replace the visible controls.')).toBeVisible();
  await page.getByRole('button', { name: 'Close keyboard help' }).click();

  await page.setViewportSize({ width: 640, height: 700 });
  const narrowGeometry = await readMonacoGeometry(page, 'export const changed = 3;');
  expect(narrowGeometry.document.scrollWidth).toBeLessThanOrEqual(narrowGeometry.document.clientWidth);
  expect(narrowGeometry.reviewShell).not.toBeNull();
  expect(narrowGeometry.reviewMain).not.toBeNull();
  if (narrowGeometry.reviewShell === null || narrowGeometry.reviewMain === null) {
    throw new Error('Expected rendered review shell and main geometry.');
  }
  expect(narrowGeometry.reviewMain.rect.width).toBeLessThanOrEqual(narrowGeometry.reviewShell.rect.width + 1);
  await ensureReviewOpen(page);
  await expect(page.getByRole('heading', { level: 2, name: 'Review', exact: true })).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors.filter((message) => !message.includes('Download the Vue Devtools extension'))).toEqual([]);
});

test('Phase 07 header and control states', async ({ page }) => {
  resetAsyncSettlementFixture();
  session = {
    ...session,
    files: session.files.map((file) => file.fileId === firstFileId
      ? {
        ...file,
        status: { kind: 'renamed' },
        oldPath: path('src/old/first.ts'),
        newPath: path('src/new/first.ts'),
      }
      : file),
  };

  try {
    await page.goto(`${origin}#token=${token}`);
    await expect(page.locator('.monaco-diff-editor')).toBeVisible();

    const header = page.locator('.review-context-header');
    await expect(header).toHaveCount(1);
    await expect(header.locator('.review-context-header__context')).toHaveCount(1);
    await expect(header.locator('.review-context-header__toolbar')).toHaveCount(1);
    const baseLabel = header.locator('.review-context-header__endpoint--base .review-context-header__endpoint-label');
    const headLabel = header.locator('.review-context-header__endpoint--head .review-context-header__endpoint-label');
    await expect(baseLabel).toHaveText('Base');
    await expect(headLabel).toHaveText('Head');
    await expect(baseLabel).toHaveCSS('text-transform', 'uppercase');
    await expect(headLabel).toHaveCSS('text-transform', 'uppercase');
    await expect(header.locator('.review-context-header__endpoint-oid').nth(0)).toHaveText('aaaaaaa');
    await expect(header.locator('.review-context-header__endpoint-oid').nth(1)).toHaveText('bbbbbbb');
    await expect(page.getByRole('heading', {
      level: 1,
      name: 'renamed from src/old/first.ts to src/new/first.ts',
    })).toBeVisible();
    await expect(header.locator('.path-display__old .path-text__directory')).toHaveText('src/old/');
    await expect(header.locator('.path-display__old .path-text__filename')).toHaveText('first.ts');
    await expect(header.locator('.path-display__new .path-text__directory')).toHaveText('src/new/');
    await expect(header.locator('.path-display__new .path-text__filename')).toHaveText('first.ts');

    const previousFile = page.getByRole('button', { name: 'Previous file', exact: true });
    const nextFile = page.getByRole('button', { name: 'Next file', exact: true });
    const previousChange = page.getByRole('button', { name: 'Previous change', exact: true });
    const nextChange = page.getByRole('button', { name: 'Next change', exact: true });
    const review = page.getByRole('button', { name: 'Review', exact: true });
    const keyboardHelp = page.getByRole('button', { name: 'Keyboard help', exact: true });

    await expect(previousFile).toBeDisabled();
    await expect(nextFile).toBeEnabled();
    await expect(previousChange).toBeEnabled();
    await expect(nextChange).toBeEnabled();
    await expect(review).toBeVisible();
    await expect(keyboardHelp).toBeVisible();

    for (const control of [previousFile, nextFile, previousChange, nextChange]) {
      await expect(control).toHaveClass(/ui-button--icon/);
      await expect(control).toHaveJSProperty('offsetWidth', 32);
      await expect(control).toHaveJSProperty('offsetHeight', 32);
    }

    await nextFile.hover();
    await expect(page.getByRole('tooltip')).toHaveText('Next file · Alt+Shift+]');
    const restBounds = await nextFile.boundingBox();
    const disabledBackground = await previousFile.evaluate((element) => getComputedStyle(element).backgroundColor);
    await previousFile.hover({ force: true });
    expect(await previousFile.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(disabledBackground);
    expect(await nextFile.boundingBox()).toEqual(restBounds);

    await review.click();
    await expect(review).toHaveAttribute('aria-expanded', 'true');
    await expect(review).toHaveClass(/ui-button--selected/);

    const selectedBounds = await review.boundingBox();
    await review.evaluate((element) => {
      element.classList.add('ui-button--busy');
      element.setAttribute('aria-busy', 'true');
      element.setAttribute('disabled', '');
      const spinner = document.createElement('span');
      spinner.className = 'ui-spinner';
      spinner.setAttribute('aria-hidden', 'true');
      element.append(spinner);
    });
    expect(await review.boundingBox()).toEqual(selectedBounds);
    await expect(review.locator('.ui-spinner')).toHaveCSS('animation-name', 'ui-spinner-rotate');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(review.locator('.ui-spinner')).toHaveCSS('animation-duration', '0s');
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    for (const width of [1440, 1280, 1100, 768, 640]) {
      await page.setViewportSize({ width, height: 700 });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
        .toBe(true);
    }
    await expect(page.getByRole('button', { name: 'Files', exact: true })).toBeVisible();
  } finally {
    resetAsyncSettlementFixture();
  }
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
  await ensureReviewOpen(page);
  await expect(page.locator('.comments-rail__comment[data-comment-id="comment_123e4567-e89b-12d3-a456-426614174000"]')).toBeVisible();
});

test('Phase 07 inline conversation states', async ({ page }) => {
  resetAsyncSettlementFixture();
  const targetText = 'export const changed = 3;';
  const retainedText = `Keep this long accepted comment ${'without-losing-words while proving the paired Monaco zone contains every rendered line. '.repeat(120)}after the failed save.`;
  const resolvedText = 'A separately saved resolved comment.';
  canonicalComments = [{
    id: 'comment_223e4567-e89b-12d3-a456-426614174000',
    state: 'resolved',
    body: resolvedText,
    anchor: {
      version: 'durable-anchor-v1',
      path: path('src/first.ts'),
      safeDisplayPath: 'src/first.ts',
      side: 'head',
      line: 11,
      blobOid: 'd'.repeat(40),
      selectedText: 'const context11 = 11;',
      context: { before: [], target: { line: 11, text: 'const context11 = 11;' }, after: [] },
      contextHash: { algorithm: 'sha256-v1', value: 'f'.repeat(64) },
      uniqueKey: '1'.repeat(64),
    },
    createdAt: '2026-07-21T00:00:00.000Z',
    updatedAt: '2026-07-21T00:00:00.000Z',
    resolvedAt: '2026-07-21T00:00:00.000Z',
  }];

  await page.setViewportSize({ width: 1280, height: 760 });
  await openReview(page);
  await hoverMonacoLine(page, 'head', targetText);
  const before = await readMonacoGeometry(page, targetText);
  await page.getByRole('button', { name: 'Add comment to head line 10' }).click({ force: true });

  const composer = page.locator('.monaco-anchor-zone--composer .inline-comment-composer');
  const textarea = composer.locator('textarea');
  await expect(composer).toHaveClass(/conversation-card/);
  await expect(composer.getByText('Fixed anchor', { exact: true })).toBeVisible();
  await expect(composer).toContainText('src/first.ts · Head line 10');
  await expect(textarea).toHaveAttribute('aria-label', 'Comment');
  await expect(textarea).toHaveAttribute('aria-describedby', /comment-support-head-10/);
  await expect(composer.locator('.conversation-card__header')).toBeVisible();
  await expect(composer.locator('.conversation-card__body')).toBeVisible();
  await expect(composer.locator('.conversation-card__support')).toBeVisible();
  await expect(composer.locator('.conversation-card__footer')).toBeVisible();

  const ready = await readMonacoGeometry(page, targetText);
  expectConversationCardNotToReflow(before, ready);
  expect(ready.zones).toHaveLength(2);
  expect(Math.abs(ready.zones[0]!.y - ready.zones[1]!.y)).toBeLessThanOrEqual(1);
  expect(ready.zones[0]!.height).toBe(ready.zones[1]!.height);

  await composer.locator('button').filter({ hasText: 'Add comment' }).click();
  await expect(composer.locator('[role="alert"]')).toHaveText('Write a comment before adding it.');
  await expect(textarea).toHaveAttribute('aria-describedby', /comment-feedback-head-10/);

  const delayedFailure = delayNextMutation('persistenceFailure');
  const failureResponse = page.waitForResponse((candidate) =>
    candidate.url().includes('/api/draft/mutations')
      && candidate.request().postData()?.includes(retainedText) === true);
  await textarea.fill(retainedText);
  await composer.locator('button').filter({ hasText: 'Add comment' }).click();
  await delayedFailure.received;
  await expect(composer).toHaveAttribute('aria-busy', 'true');
  const pendingButton = composer.locator('button').filter({ hasText: 'Adding comment…' });
  await expect(pendingButton).toBeDisabled();
  await expect(pendingButton).toHaveAttribute('aria-busy', 'true');
  await expect(composer.locator('.ui-spinner[aria-hidden="true"]')).toHaveCount(1);
  const pending = await readMonacoGeometry(page, targetText);
  expectConversationCardNotToReflow(before, pending);
  expect(Math.abs(pending.zones[0]!.y - pending.zones[1]!.y)).toBeLessThanOrEqual(1);
  expect(pending.zones[0]!.height).toBe(pending.zones[1]!.height);
  delayedFailure.release();
  expect((await failureResponse).status()).toBe(500);
  await expect(composer.locator('[role="alert"]')).toHaveText(
    'Comment wasn’t added. Your text is still here. Check that Diff Review is running, then try again.',
  );
  await expect(textarea).toHaveValue(retainedText);
  await expect(composer).not.toHaveAttribute('aria-busy', 'true');

  await composer.locator('.conversation-card__footer > .conversation-card__actions > .ui-button--destructive').click();
  await textarea.focus();
  await page.keyboard.press('Escape');
  await expect(textarea).toHaveValue(retainedText);
  await expect(textarea).toBeFocused();

  const acceptedResponse = page.waitForResponse((candidate) =>
    candidate.url().includes('/api/draft/mutations')
      && candidate.request().postData()?.includes(retainedText) === true);
  await composer.locator('button').filter({ hasText: 'Add comment' }).click();
  expect((await acceptedResponse).status()).toBe(201);
  const inlineAccepted = page.locator('.monaco-anchor-zone--composer .inline-accepted-comment');
  const acceptedHeading = inlineAccepted.locator('h3.conversation-card__identity');
  await expect(inlineAccepted).toHaveCount(1);
  await expect(acceptedHeading).toHaveText('src/first.ts · Head · line 10');
  await expect(acceptedHeading).toBeFocused();
  await expect(inlineAccepted.getByText('Open', { exact: true })).toBeVisible();
  await expect(inlineAccepted.getByText('Verified', { exact: true })).toBeVisible();
  await expect(inlineAccepted.getByText('Saved locally', { exact: true })).toBeVisible();
  await expect(inlineAccepted.locator('.review-state-badge svg[aria-hidden="true"]')).toHaveCount(2);
  await expect(page.locator('.monaco-anchor-zone--composer')).toHaveCount(1);
  await expect(page.locator('.monaco-anchor-zone--spacer')).toHaveCount(1);
  const acceptedGeometry = await page.evaluate(() => {
    const rect = (element: Element): DOMRect => element.getBoundingClientRect();
    const card = document.querySelector('.monaco-anchor-zone--composer .inline-accepted-comment');
    const composerZone = document.querySelector('.monaco-anchor-zone--composer');
    const spacerZone = document.querySelector('.monaco-anchor-zone--spacer');
    if (card === null || composerZone === null || spacerZone === null) {
      return null;
    }
    const cardRect = rect(card);
    const composerRect = rect(composerZone);
    const spacerRect = rect(spacerZone);
    const nextCode = [...document.querySelectorAll('.monaco-diff-editor .modified .view-line')]
      .map(rect)
      .filter((line) => line.height > 0 && line.top >= composerRect.bottom - 1)
      .sort((left, right) => left.top - right.top)[0] ?? null;
    return {
      cardHeight: (card as HTMLElement).scrollHeight,
      cardBottom: cardRect.bottom,
      composerBottom: composerRect.bottom,
      composerHeight: composerRect.height,
      spacerHeight: spacerRect.height,
      zoneTopDelta: Math.abs(composerRect.top - spacerRect.top),
      nextCodeTop: nextCode?.top ?? null,
    };
  });
  expect(acceptedGeometry).not.toBeNull();
  expect(acceptedGeometry!.cardHeight).toBeGreaterThan(280);
  expect(acceptedGeometry!.zoneTopDelta).toBeLessThanOrEqual(1);
  expect(acceptedGeometry!.composerHeight).toBe(acceptedGeometry!.spacerHeight);
  expect(acceptedGeometry!.cardBottom).toBeLessThanOrEqual(acceptedGeometry!.composerBottom + 1);
  expect(acceptedGeometry!.nextCodeTop).not.toBeNull();
  expect(acceptedGeometry!.nextCodeTop!).toBeGreaterThanOrEqual(acceptedGeometry!.composerBottom - 1);
  expect(acceptedGeometry!.nextCodeTop!).toBeGreaterThanOrEqual(acceptedGeometry!.cardBottom - 1);

  await ensureReviewOpen(page);
  await page.getByRole('button', { name: /^Resolved comments/ }).click();
  const resolvedRow = page.locator('.comments-rail__comment').filter({ hasText: resolvedText });
  await resolvedRow.getByRole('button', { name: 'Show comment' }).click();
  await expect(inlineAccepted).toHaveCount(1);
  await expect(inlineAccepted.getByText('Resolved', { exact: true })).toBeVisible();
  await expect(inlineAccepted.getByText('Verified', { exact: true })).toBeVisible();

  const restored = await readMonacoGeometry(page, targetText);
  expectConversationCardNotToReflow(before, restored);
  expect(Math.abs(restored.zones[0]!.y - restored.zones[1]!.y)).toBeLessThanOrEqual(1);
  expect(restored.zones[0]!.height).toBe(restored.zones[1]!.height);
});

test('Phase 07 rail selection follows focus-comment', async ({ page }) => {
  resetAsyncSettlementFixture();
  const resolvedCommentId = 'comment_323e4567-e89b-12d3-a456-426614174000';
  canonicalComments = [{
    id: resolvedCommentId,
    state: 'resolved',
    body: 'Selected resolved comment.',
    anchor: {
      version: 'durable-anchor-v1',
      path: path('src/first.ts'),
      safeDisplayPath: 'src/first.ts',
      side: 'head',
      line: 11,
      blobOid: 'd'.repeat(40),
      selectedText: 'const context11 = 11;',
      context: { before: [], target: { line: 11, text: 'const context11 = 11;' }, after: [] },
      contextHash: { algorithm: 'sha256-v1', value: 'f'.repeat(64) },
      uniqueKey: '3'.repeat(64),
    },
    createdAt: '2026-07-21T00:00:00.000Z',
    updatedAt: '2026-07-21T00:00:00.000Z',
    resolvedAt: '2026-07-21T00:00:00.000Z',
  }];

  await openReview(page);
  await ensureReviewOpen(page);
  await page.getByRole('button', { name: /^Resolved comments/ }).click();

  const resolvedRow = page.locator(`article[data-comment-id="${resolvedCommentId}"]`);
  await resolvedRow.getByRole('button', { name: 'Show comment' }).click();
  await expect(resolvedRow).toHaveClass(/review-panel__comment--selected/);
  await expect(resolvedRow).toHaveCSS('border-left-width', '3px');
  await expect(resolvedRow.getByText('Selected', { exact: true })).toBeVisible();
  await expect(resolvedRow).not.toHaveAttribute('aria-selected');
  await expect(resolvedRow.locator('[tabindex="0"]')).toHaveCount(0);

  await page.getByRole('button', { name: 'Close review' }).focus();
  await expect(resolvedRow).toHaveClass(/review-panel__comment--selected/);

  await page.getByRole('button', { name: 'Close review' }).click();
  await hoverMonacoLine(page, 'head', 'export const changed = 3;');
  await page.getByRole('button', { name: 'Add comment to head line 10' }).click();
  const composer = page.locator('.monaco-anchor-zone--composer textarea');
  await composer.fill('Selected open comment.');
  await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Add comment' }).click();

  await ensureReviewOpen(page);
  const openRow = page.locator('article[data-comment-id="comment_123e4567-e89b-12d3-a456-426614174000"]');
  await openRow.getByRole('button', { name: 'Show comment' }).click();
  await expect(resolvedRow).not.toHaveClass(/review-panel__comment--selected/);
  await expect(openRow).toHaveClass(/review-panel__comment--selected/);

  const persistedDraft = await page.evaluate(async () => (await fetch('/api/draft')).json());
  expect(JSON.stringify(persistedDraft)).not.toContain('selectedCommentId');

  await openRow.getByRole('button', { name: 'Delete' }).click();
  await openRow.getByRole('button', { name: 'Delete comment' }).click();
  await expect(openRow).toHaveCount(0);
  await expect(page.locator('.review-panel__comment--selected')).toHaveCount(0);
});

test('draft resume and anchor states', async ({ page }) => {
  canonicalComments = [{
    id: 'comment_123e4567-e89b-12d3-a456-426614174000',
    state: 'open',
    body: 'Please explain this context.',
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
      uniqueKey: '0'.repeat(64),
    },
    createdAt: '2026-07-21T00:00:00.000Z',
    updatedAt: '2026-07-21T00:00:00.000Z',
  }];

  const pageErrors: Error[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.goto(`${origin}#token=${token}`);
  await expect(page.locator('.session-shell > .visually-hidden[aria-live="polite"]')).toHaveText(
    'Local draft resumed. Accepted comments for this pinned comparison are ready.',
  );
  await ensureReviewOpen(page);
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
    canonicalComments = [{
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
    await ensureReviewOpen(page);
    const restoredComment = page.locator('.comments-rail__comment').filter({
      hasText: 'Restore the second exact-byte path.',
    });
    await expect(restoredComment).toHaveCount(1);
    await expect(restoredComment).toBeVisible();
    contentRequests = [];
    await restoredComment.getByRole('button', { name: 'Show comment' }).click();
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
  canonicalComments = [
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
  const reviewToggle = page.getByRole('button', { name: 'Review', exact: true });
  await ensureReviewOpen(page);
  await expect(page.getByRole('button', { name: 'Close review' })).toBeVisible();
  await page.getByRole('button', { name: 'Close review' }).click();
  await expect(reviewToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.comments-rail')).toHaveAttribute('inert', '');
  await ensureReviewOpen(page);
  await page.getByRole('button', { name: 'Close review' }).click();
  await expect(reviewToggle).toBeFocused();

  await page.setViewportSize({ width: 900, height: 900 });
  const filesToggle = page.getByRole('button', { name: 'Files', exact: true });
  await filesToggle.click();
  await expect(page.getByRole('button', { name: 'Close files' })).toBeVisible();
  await page.getByRole('button', { name: 'Close files' }).click();
  await expect(filesToggle).toBeFocused();
  await expect(page.locator('.review-files')).toHaveAttribute('inert', '');
  await page.setViewportSize({ width: 1440, height: 900 });
  await ensureReviewOpen(page);

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

test.describe('async comment settlement', () => {
  test.beforeEach(() => {
    resetAsyncSettlementFixture();
  });

  test.afterEach(() => {
    resetAsyncSettlementFixture();
  });

  test('async comment settlement keeps B active when accepted A completion returns', async ({ page }) => {
    const delayed = delayNextMutation('accepted');
    const body = 'Keep acceptance on its originating file.';

    await openReview(page);
    await hoverMonacoLine(page, 'head', 'export const changed = 3;');
    await page.getByRole('button', { name: 'Add comment to head line 10' }).click();
    const composer = page.locator('.monaco-anchor-zone--composer textarea');
    await composer.fill(body);
    const response = page.waitForResponse((candidate) =>
      candidate.url().includes('/api/draft/mutations'));
    let settled = false;
    void response.then(() => { settled = true; });
    await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Add comment' }).click();
    await delayed.received;
    expect(settled).toBe(false);

    await page.getByRole('treeitem', { name: /src\/second\.ts/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'src/second.ts' })).toBeVisible();
    await hoverMonacoLine(page, 'head', 'export const secondChanged = 3;');
    expect(settled).toBe(false);
    delayed.release();
    expect((await response).status()).toBe(201);
    await expect(page.locator('.session-shell > .visually-hidden[aria-live="polite"]')).toHaveText(
      'Comment on src/first.ts at head line 10 was added and saved locally.',
      { timeout: 15_000 },
    );

    await expect(page.getByRole('heading', { level: 1, name: 'src/second.ts' })).toBeVisible();
    await expect(page.locator('.monaco-anchor-zone--composer')).toHaveCount(0);
    await page.getByRole('treeitem', { name: /src\/first\.ts/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'src/first.ts' })).toBeVisible();
    await ensureReviewOpen(page);
    await expect(page.locator('.comments-rail__comment[data-comment-id="comment_123e4567-e89b-12d3-a456-426614174000"]')).toContainText(body);
    await expect(page.locator('.monaco-anchor-zone--composer')).toHaveCount(0);
  });

  test('async comment settlement restores A retry state when its delayed failure returns', async ({ page }) => {
    const delayed = delayNextMutation('persistenceFailure');
    const body = 'Keep retry text and anchor on file A.';
    const message = 'Comment wasn’t added. Your text is still here. Check that Diff Review is running, then try again.';

    await openReview(page);
    await hoverMonacoLine(page, 'head', 'export const changed = 3;');
    await page.getByRole('button', { name: 'Add comment to head line 10' }).click();
    const response = page.waitForResponse((candidate) =>
      candidate.url().includes('/api/draft/mutations'));
    await page.locator('.monaco-anchor-zone--composer textarea').fill(body);
    await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Add comment' }).click();
    await delayed.received;

    await page.getByRole('treeitem', { name: /src\/second\.ts/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'src/second.ts' })).toBeVisible();
    await hoverMonacoLine(page, 'head', 'export const secondChanged = 3;');
    delayed.release();
    expect((await response).status()).toBe(500);
    await expect(page.locator('.session-shell > .visually-hidden[aria-live="polite"]')).toHaveText(
      'Comment on src/first.ts at head line 10 wasn’t added. Your text is still here. Check that Diff Review is running, then try again.',
    );
    await expect(page.getByRole('heading', { level: 1, name: 'src/second.ts' })).toBeVisible();
    await expect(page.locator('.monaco-anchor-zone--composer')).toHaveCount(0);

    await page.getByRole('treeitem', { name: /src\/first\.ts/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'src/first.ts' })).toBeVisible();
    await hoverMonacoLine(page, 'head', 'export const changed = 3;');
    const retryComposer = page.locator('.monaco-anchor-zone--composer');
    await expect(retryComposer.locator('textarea')).toHaveValue(body);
    await expect(retryComposer).toContainText('src/first.ts · Head line 10');
    await expect(retryComposer.locator('[role="alert"]')).toHaveText(message);
    await expect(retryComposer.locator('button').filter({ hasText: 'Add comment' })).toBeEnabled();
  });

  test('async comment settlement announces A revision conflict while keeping B active', async ({ page }) => {
    const delayed = delayNextMutation('revisionConflict');
    const body = 'Keep conflict text and anchor on file A.';
    const message = 'Comment wasn’t added. Your text is still here. Reload the latest draft before trying again.';

    await openReview(page);
    await hoverMonacoLine(page, 'head', 'export const changed = 3;');
    await page.getByRole('button', { name: 'Add comment to head line 10' }).click();
    const response = page.waitForResponse((candidate) =>
      candidate.url().includes('/api/draft/mutations')
      && candidate.request().postData()?.includes(body) === true);
    await page.locator('.monaco-anchor-zone--composer textarea').fill(body);
    await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Add comment' }).click();
    await delayed.received;

    await page.getByRole('treeitem', { name: /src\/second\.ts/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'src/second.ts' })).toBeVisible();
    await hoverMonacoLine(page, 'head', 'export const secondChanged = 3;');
    await page.getByRole('button', { name: 'Add comment to head line 10' }).click();
    await page.locator('.monaco-anchor-zone--composer textarea').fill('Advance the canonical draft on file B.');
    await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Add comment' }).click();
    await expect(page.locator('.session-shell > .visually-hidden[aria-live="polite"]')).toHaveText(
      'Comment on src/second.ts at head line 10 was added and saved locally.',
    );
    delayed.release();
    expect((await response).status()).toBe(409);
    await expect(page.locator('.session-shell > .visually-hidden[aria-live="polite"]')).toHaveText(
      'Comment on src/first.ts at head line 10 wasn’t added. Your text is still here. Reload the latest draft before trying again.',
    );
    await expect(page.getByRole('heading', { level: 1, name: 'src/second.ts' })).toBeVisible();

    await page.getByRole('treeitem', { name: /src\/first\.ts/ }).click();
    await ensureReviewOpen(page);
    const conflict = page.getByRole('alert').filter({ hasText: 'Review changed in another tab' });
    await expect(conflict).toContainText('Your revision0');
    await expect(conflict).toContainText('Latest revision1');
    await expect(page.getByRole('heading', { level: 1, name: 'src/first.ts' })).toBeVisible();
    await hoverMonacoLine(page, 'head', 'export const changed = 3;');
    const retryComposer = page.locator('.monaco-anchor-zone--composer');
    await expect(retryComposer.locator('textarea')).toHaveValue(body);
    await expect(retryComposer.locator('[role="alert"]')).toHaveText(message);
  });

  test('repeated identical settlement messages create distinct live-region updates', async ({ page }) => {
    const body = 'Retry the same failed comment.';
    const announcement = 'Comment on src/first.ts at head line 10 wasn’t added. Your text is still here. Check that Diff Review is running, then try again.';
    const liveRegion = page.locator('.session-shell > .visually-hidden[aria-live="polite"]');

    const firstDelayed = delayNextMutation('persistenceFailure');
    await openReview(page);
    await hoverMonacoLine(page, 'head', 'export const changed = 3;');
    await page.getByRole('button', { name: 'Add comment to head line 10' }).click();
    await page.locator('.monaco-anchor-zone--composer textarea').fill(body);
    const firstResponse = page.waitForResponse((candidate) =>
      candidate.url().includes('/api/draft/mutations'));
    await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Add comment' }).click();
    await firstDelayed.received;
    firstDelayed.release();
    expect((await firstResponse).status()).toBe(500);
    await expect(liveRegion).toHaveText(announcement);
    const firstVersion = await liveRegion.locator('span').getAttribute('data-announcement-version');

    const secondDelayed = delayNextMutation('persistenceFailure');
    const secondResponse = page.waitForResponse((candidate) =>
      candidate.url().includes('/api/draft/mutations'));
    await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Add comment' }).click();
    await secondDelayed.received;
    secondDelayed.release();
    expect((await secondResponse).status()).toBe(500);
    await expect.poll(async () =>
      liveRegion.locator('span').getAttribute('data-announcement-version')).not.toBe(firstVersion);
    await expect(liveRegion).toHaveText(announcement);
  });
});

test('preserves production Base Head labels and no-reflow Monaco semantic channels at every phase viewport', async ({ page }) => {
  test.setTimeout(120_000);
  const targetText = 'export const changed = 3;';

  for (const width of [1440, 1280, 1100, 1099, 768, 767, 640, 320]) {
    resetAsyncSettlementFixture();
    await page.setViewportSize({ width, height: 760 });
    await openReview(page);
    const baseEndpointLabel = page.locator('.review-context-header__endpoint--base .review-context-header__endpoint-label');
    const headEndpointLabel = page.locator('.review-context-header__endpoint--head .review-context-header__endpoint-label');
    await expect(baseEndpointLabel).toHaveText('Base');
    await expect(headEndpointLabel).toHaveText('Head');
    await expect(baseEndpointLabel).toHaveCSS('text-transform', 'uppercase');
    await expect(headEndpointLabel).toHaveCSS('text-transform', 'uppercase');
    await expect(page.locator('.monaco-diff-pane--base')).toHaveCount(1);
    await expect(page.locator('.monaco-diff-pane--head')).toHaveCount(1);

    const initial = await readMonacoGeometry(page, targetText);
    expect(initial.document.scrollWidth).toBeLessThanOrEqual(initial.document.clientWidth);
    if (initial.reviewShell === null || initial.reviewMain === null
      || initial.diffViewport === null || initial.diffCanvas === null) {
      throw new Error('Expected rendered review shell, main, diff viewport, and diff canvas geometry.');
    }
    expect(initial.reviewMain.rect.width).toBeLessThanOrEqual(initial.reviewShell.rect.width + 1);
    expect(initial.diffViewport.rect.width).toBeLessThanOrEqual(initial.reviewMain.rect.width + 1);
    const outerOverflowOwners = await page.locator('.review-main').evaluate((root) => [...root.querySelectorAll<HTMLElement>('*')]
      .filter((element) => !element.closest('.diff-workspace__viewport')
        && !element.classList.contains('sr-only')
        && element.scrollWidth > element.clientWidth)
      .map((element) => element.className));
    expect(outerOverflowOwners).toEqual([]);
    expect(initial.reviewMain.scrollWidth).toBeLessThanOrEqual(initial.reviewMain.clientWidth);
    expect(initial.reviewShell.scrollWidth).toBeLessThanOrEqual(initial.reviewShell.clientWidth);
    expect(initial.diffCanvas.rect.width).toBeGreaterThanOrEqual(640);

    if (width === 320) {
      const reachability = await page.locator('.diff-workspace__viewport').evaluate((viewport) => {
        const intersectsViewport = (element: Element | null) => {
          if (element === null) return false;
          const bounds = element.getBoundingClientRect();
          const viewportBounds = viewport.getBoundingClientRect();
          return bounds.left < viewportBounds.right && bounds.right > viewportBounds.left;
        };
        viewport.scrollLeft = 0;
        const baseReachableAtStart = intersectsViewport(document.querySelector('.monaco-diff-pane--base'));
        const baseLabelReachableAtStart = intersectsViewport(document.querySelector('.diff-workspace__side-labels span:first-child'));
        viewport.scrollLeft = viewport.scrollWidth;
        const headLabelReachableAtEnd = intersectsViewport(document.querySelector('.diff-workspace__side-labels span:last-child'));
        const headReachableAtEnd = intersectsViewport(document.querySelector('.monaco-diff-pane--head'));
        const actionReachableAtEnd = intersectsViewport(document.querySelector('.diff-workspace__gutter-action'));
        const canvasWidth = document.querySelector<HTMLElement>('.diff-workspace__canvas')?.getBoundingClientRect().width;
        const viewportClientWidth = viewport.clientWidth;
        const viewportScrollWidth = viewport.scrollWidth;
        viewport.scrollLeft = 0;
        return {
          actionReachableAtEnd,
          baseLabelReachableAtStart,
          baseReachableAtStart,
          canvasWidth,
          documentScrollLeft: document.documentElement.scrollLeft,
          headLabelReachableAtEnd,
          headReachableAtEnd,
          viewportClientWidth,
          viewportScrollWidth,
        };
      });
      expect(reachability.viewportScrollWidth).toBeGreaterThan(reachability.viewportClientWidth);
      expect(reachability.canvasWidth).toBeGreaterThanOrEqual(640);
      expect(reachability.baseReachableAtStart).toBe(true);
      expect(reachability.baseLabelReachableAtStart).toBe(true);
      expect(reachability.headReachableAtEnd).toBe(true);
      expect(reachability.headLabelReachableAtEnd).toBe(true);
      expect(reachability.actionReachableAtEnd).toBe(true);
      expect(reachability.documentScrollLeft).toBe(0);
    }

    await hoverMonacoLine(page, 'head', targetText);
    const action = page.getByRole('button', { name: 'Add comment to head line 10' });
    await expect(action).toHaveCSS('width', '32px');
    await expect(action).toHaveCSS('height', '32px');
    const before = await readMonacoGeometry(page, targetText);
    expect(before.codeOrigin).not.toBeNull();
    expect(before.action).not.toBeNull();

    await action.click({ force: true });
    const anchorLine = page.locator('.monaco-anchor-line').first();
    await expect(anchorLine).toHaveCSS('border-left-width', '0px');
    await expect(anchorLine).toHaveCSS('box-shadow', 'rgb(47, 129, 247) 3px 0px 0px 0px inset');
    const anchored = await readMonacoGeometry(page, targetText);
    expectAnchoringNotToReflow(before, anchored);
    expect(anchored.zones).toHaveLength(2);
    expect(Math.abs(anchored.zones[0].y - anchored.zones[1].y)).toBeLessThanOrEqual(1);
    expect(anchored.zones[0].height).toBe(anchored.zones[1].height);

    const targetLine = page.locator('.monaco-diff-editor .modified .view-line').filter({ hasText: targetText }).first();
    await targetLine.click({ force: true, position: { x: 20, y: 9 } });
    await page.keyboard.down('Shift');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.up('Shift');
    await hoverMonacoLine(page, 'head', targetText);
    const semanticStates = await readMonacoGeometry(page, targetText);
    expect(semanticStates).toEqual(anchored);
    expect(semanticStates.document.scrollWidth).toBeLessThanOrEqual(semanticStates.document.clientWidth);
  }
});
