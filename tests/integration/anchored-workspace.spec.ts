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
            if (!mutation.success || mutation.data.type !== 'addComment') {
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
type MonacoGeometry = Readonly<{
  action: GeometryRect | null;
  codeOrigin: Readonly<{ tokenX: number; viewLineX: number; lineHeight: number }> | null;
  document: Readonly<{ clientWidth: number; scrollWidth: number }>;
  gutters: readonly number[];
  panes: readonly GeometryRect[];
  reviewMain: Readonly<{ clientHeight: number; clientWidth: number; scrollHeight: number; scrollWidth: number }> | null;
  sashes: readonly GeometryRect[];
  scrollOwners: readonly Readonly<{ clientHeight: number; clientWidth: number; scrollHeight: number; scrollWidth: number }>[];
  zones: readonly GeometryRect[];
}>;

async function readMonacoGeometry(page: Page, targetText: string): Promise<MonacoGeometry> {
  return page.evaluate((text) => {
    const rect = (element: Element | null): GeometryRect | null => {
      if (element === null) return null;
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    const scrollDimensions = (element: HTMLElement) => ({
      clientHeight: element.clientHeight,
      clientWidth: element.clientWidth,
      scrollHeight: element.scrollHeight,
      scrollWidth: element.scrollWidth,
    });
    const action = document.querySelector('.diff-workspace__gutter-action');
    const actionRect = rect(action);
    const line = [...document.querySelectorAll('.monaco-diff-editor .modified .view-line')]
      .filter((element) => element.getBoundingClientRect().height > 0)
      .find((element) => {
        const bounds = element.getBoundingClientRect();
        return actionRect !== null
          && actionRect.y + actionRect.height / 2 >= bounds.y
          && actionRect.y + actionRect.height / 2 <= bounds.y + bounds.height;
      }) ?? [...document.querySelectorAll('.monaco-diff-editor .modified .view-line')]
      .find((element) => (element.textContent?.includes(text) || (element as HTMLElement).innerText.includes(text))
        && element.getBoundingClientRect().height > 0);
    const lineRect = rect(line ?? null);
    const tokenRect = rect(line?.querySelector('span') ?? null);
    const reviewMain = document.querySelector<HTMLElement>('.review-main');
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
      reviewMain: reviewMain === null ? null : scrollDimensions(reviewMain),
      sashes: [...document.querySelectorAll('.monaco-diff-editor .monaco-sash')]
        .map((element) => rect(element)).filter((value): value is GeometryRect => value !== null),
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
  await page.getByRole('button', { name: 'Close keyboard help' }).click();

  await page.setViewportSize({ width: 640, height: 700 });
  await expect.poll(() => page.locator('.review-main').evaluate((element) => element.getBoundingClientRect().width)).toBeGreaterThanOrEqual(640);
  await expect(page.getByRole('button', { name: 'Files', exact: true })).toBeVisible();
  await ensureReviewOpen(page);
  await expect(page.getByRole('heading', { level: 2, name: 'Review', exact: true })).toBeVisible();

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
  await ensureReviewOpen(page);
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
    await expect(page.locator('[data-comment-id="comment_123e4567-e89b-12d3-a456-426614174000"]')).toContainText(body);
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
    await expect(retryComposer).toContainText('src/first.ts · Head · line 10');
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

  for (const width of [1440, 1280, 1100, 768, 640]) {
    resetAsyncSettlementFixture();
    await page.setViewportSize({ width, height: 760 });
    await openReview(page);
    await expect(page.getByText('BASE', { exact: true })).toBeVisible();
    await expect(page.getByText('HEAD', { exact: true })).toBeVisible();
    await expect(page.locator('.monaco-diff-pane--base')).toHaveCount(1);
    await expect(page.locator('.monaco-diff-pane--head')).toHaveCount(1);

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
