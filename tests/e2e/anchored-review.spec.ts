import { spawn, execFileSync } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import {
  closeSync,
  copyFileSync,
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';
import type { Browser, Page, TestInfo } from '@playwright/test';

import { createGitFixture, type GitFixture } from '../helpers/git-fixture.js';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const packedRoot = mkdtempSync(join(tmpdir(), 'diff-review-anchored-pack-'));
const extractedPackageRoot = join(packedRoot, 'package');
const executablePath = join(extractedPackageRoot, 'dist/bin/diff-review.mjs');
const fakeBinRoot = join(packedRoot, 'fake-bin');
test.setTimeout(90_000);

interface PackResult {
  readonly filename: string;
}

interface RunningCli {
  readonly child: ChildProcess;
  readonly browserMarkerPath: string;
  readonly outputPath: string;
  readonly outputDescriptor: number;
}

function runPrerequisite(command: string, arguments_: readonly string[]): string {
  try {
    return execFileSync(command, [...arguments_], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    throw new Error(
      `[prerequisite] ${command} ${arguments_.join(' ')} failed before anchored review behavior: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function fakeOpenerInterceptedUrl(running: RunningCli, url: string): boolean {
  if (!existsSync(running.browserMarkerPath)) return false;
  return readFileSync(running.browserMarkerPath, 'utf8')
    .split('\n')
    .filter((line) => line !== '')
    .some((line) => {
      const arguments_ = JSON.parse(line) as unknown;
      return (
        Array.isArray(arguments_) &&
        arguments_.length === 1 &&
        arguments_[0] === url
      );
    });
}

async function waitForLoopbackUrl(running: RunningCli): Promise<string> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const output = existsSync(running.outputPath)
      ? readFileSync(running.outputPath, 'utf8')
      : '';
    const match = output.match(/http:\/\/127\.0\.0\.1:\d+\/#token=[A-Za-z0-9_-]{43,}/);
    if (match !== null && fakeOpenerInterceptedUrl(running, match[0])) {
      return match[0];
    }
    if (running.child.exitCode !== null || running.child.signalCode !== null) {
      throw new Error(`[behavioral] generated CLI exited before publishing a loopback URL:\n${output}`);
    }
    const { promise, resolve: resolveWait } = Promise.withResolvers<void>();
    setTimeout(resolveWait, 25);
    await promise;
  }
  throw new Error(
    '[behavioral] timed out waiting for generated CLI loopback URL and fake opener interception',
  );
}

function startGeneratedCli(repository: GitFixture, head = repository.headRef): RunningCli {
  const outputPath = join(packedRoot, `terminal-${crypto.randomUUID()}.log`);
  const browserMarkerPath = join(
    packedRoot,
    `browser-open-${crypto.randomUUID()}.log`,
  );
  const outputDescriptor = openSync(outputPath, 'w');
  const environment = { ...process.env };
  delete environment.CMUX_WORKSPACE_ID;
  const child = spawn(process.execPath, [executablePath], {
    cwd: repository.nestedCwd,
    env: {
      ...environment,
      PATH: `${fakeBinRoot}:${process.env.PATH ?? ''}`,
      DIFF_REVIEW_BROWSER_OPEN_MARKER: browserMarkerPath,
      DIFF_REVIEW_LAUNCH_OPTIONS: JSON.stringify({
        cwd: repository.nestedCwd,
        base: { label: 'main', revision: repository.baseRef },
        head: { label: head.slice('refs/heads/'.length), revision: head },
      }),
    },
    stdio: ['ignore', outputDescriptor, outputDescriptor],
  });
  return { child, browserMarkerPath, outputPath, outputDescriptor };
}

async function stopGeneratedCli(running: RunningCli): Promise<void> {
  if (running.child.exitCode === null && running.child.signalCode === null) {
    running.child.kill('SIGINT');
  }
  const events = running.child as unknown as EventEmitter;
  const { promise, resolve, reject } = Promise.withResolvers<void>();
  events.once('error', reject);
  events.once('exit', resolve);
  await promise;
  closeSync(running.outputDescriptor);
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

async function openGeneratedReview(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.monaco-diff-editor')).toBeVisible();
  await expect(page.getByText('BASE', { exact: true })).toBeVisible();
  await expect(page.getByText('HEAD', { exact: true })).toBeVisible();
}

function assertChromium(browser: Browser, testInfo: TestInfo): void {
  expect(testInfo.project.name).toBe('chromium');
  expect(browser.browserType().name()).toBe('chromium');
}

async function activateMonacoLine(
  page: Page,
  side: 'base' | 'head',
  text: string,
  lineNumber: number,
): Promise<void> {
  const diffEditor = page.locator('.monaco-diff-editor');
  const editor = diffEditor.locator(`.${side === 'base' ? 'editor.original' : 'editor.modified'}`);
  const matchingLine = editor.locator('.view-line').filter({ hasText: text }).first();
  const line = editor.locator('.view-line:visible').filter({ hasText: text }).first();
  await expect(matchingLine).toBeAttached();
  await matchingLine.scrollIntoViewIfNeeded();
  for (let expansion = 0; expansion < 32 && (await line.count()) === 0; expansion += 1) {
    const control = page.getByRole('button', { name: 'Show Unchanged Region', exact: true }).first();
    await expect(control).toBeVisible();
    await control.click();
  }
  await expect(line).toBeVisible();
  await line.hover();
  await line.click();
  const affordance = page.getByRole('button', {
    name: `Add comment to ${side} line ${lineNumber}`,
  });
  await expect(affordance).toBeVisible();
  await affordance.click();
}

test.beforeAll(() => {
  runPrerequisite(npmCommand, ['run', 'build']);
  runPrerequisite(npmCommand, ['run', 'verify:production-artifacts']);
  const packOutput = runPrerequisite(npmCommand, [
    'pack',
    '--json',
    '--ignore-scripts',
    '--pack-destination',
    packedRoot,
  ]);
  const [packResult] = JSON.parse(packOutput) as readonly PackResult[];
  execFileSync('tar', ['-xzf', join(packedRoot, packResult.filename), '-C', packedRoot]);
  symlinkSync(join(repositoryRoot, 'node_modules'), join(extractedPackageRoot, 'node_modules'), 'dir');
  mkdirSync(fakeBinRoot, { recursive: true });
  const fakeOpen = join(packedRoot, 'open');
  writeFileSync(
    fakeOpen,
    [
      '#!/usr/bin/env node',
      "const { appendFileSync } = require('node:fs');",
      "const markerPath = process.env.DIFF_REVIEW_BROWSER_OPEN_MARKER;",
      "if (markerPath !== undefined) appendFileSync(markerPath, `${JSON.stringify(process.argv.slice(2))}\\n`);",
      'process.exitCode = 1;',
      '',
    ].join('\n'),
  );
  const fakeOpenTarget = join(fakeBinRoot, 'open');
  copyFileSync(fakeOpen, fakeOpenTarget);
  chmodSync(fakeOpenTarget, 0o755);
});

test.afterAll(() => {
  rmSync(packedRoot, { force: true, recursive: true });
});

test('packaged anchored gap closure recovers a non-line-1 exact anchor', async ({ browser, page }, testInfo) => {
  assertChromium(browser, testInfo);
  const fixture = await createGitFixture({ anchoredReview: true });
  const baseOid = fixture.git(['rev-parse', fixture.baseRef]).toString('ascii').trim();
  const headOid = fixture.git(['rev-parse', fixture.headRef]).toString('ascii').trim();
  const mergeBaseOid = fixture.git(['merge-base', fixture.baseRef, fixture.headRef]).toString('ascii').trim();
  const draftsPath = join(fixture.root, '.diff-review', 'drafts');
  const commentBody = 'Packaged comment on unchanged head line ten.';
  const initial = startGeneratedCli(fixture);

  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openGeneratedReview(page, await waitForLoopbackUrl(initial));
    await page.getByRole('treeitem', { name: /changed\.ts/ }).click();
    await expect(page.getByText(/Unchanged regions begin collapsed/)).toBeVisible();

    await activateMonacoLine(page, 'base', 'export const stableContext10 = 10;', 10);
    const composer = page.locator('.monaco-anchor-zone--composer textarea');
    await expect(composer).toHaveCount(1);
    await expect(page.locator('.inline-comment-composer__header')).toContainText(
      'src/changed.ts · Base · line 10',
    );
    await composer.fill('Keep this draft while moving.');

    await activateMonacoLine(page, 'head', 'export const stableContext10 = 10;', 10);
    await expect(page.locator('.inline-comment-composer__confirm')).toBeVisible();
    await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Keep writing' }).click();
    await expect(composer).toHaveValue('Keep this draft while moving.');
    await page.getByRole('button', { name: 'Add comment to head line 10' }).click();
    await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Discard draft' }).click();
    await expect(composer).toHaveCount(1);
    await expect(composer).toBeFocused();
    await expect(page.locator('.inline-comment-composer__header')).toContainText(
      'src/changed.ts · Head · line 10',
    );
    await page.setViewportSize({ width: 1200, height: 900 });
    await expect(composer).toHaveCount(1);
    await page.setViewportSize({ width: 900, height: 900 });
    await expect(composer).toHaveCount(1);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('button', { name: 'Next file' }).click();
    await page.getByRole('button', { name: 'Previous file' }).click();
    await expect(composer).toHaveCount(1);
    await composer.fill(commentBody);
    const addResponse = page.waitForResponse((response) => response.url().includes('/api/draft/mutations'));
    await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Add comment' }).click();
    expect((await addResponse).status()).toBe(201);
    await ensureReviewOpen(page);
    await expect(page.locator('.comments-rail__comment', { hasText: commentBody })).toHaveCount(1);
  } finally {
    await stopGeneratedCli(initial);
  }

  const [draftFile] = readdirSync(draftsPath).filter((file) => file.endsWith('.json'));
  expect(draftFile).toBeDefined();
  const draft = JSON.parse(readFileSync(join(draftsPath, draftFile!), 'utf8')) as {
    comparison: { baseCommitOid: string; headCommitOid: string; mergeBaseOid: string };
    comments: Array<{ anchor: { line: number; selectedText: string; side: string }; body: string }>;
  };
  expect(draft.comparison).toEqual({ baseCommitOid: baseOid, headCommitOid: headOid, mergeBaseOid });
  expect(draft.comments).toEqual([
    expect.objectContaining({
      body: commentBody,
      anchor: expect.objectContaining({
        line: 10,
        selectedText: 'export const stableContext10 = 10;',
        side: 'head',
      }),
    }),
  ]);

  const resumed = startGeneratedCli(fixture);
  try {
    await openGeneratedReview(page, await waitForLoopbackUrl(resumed));
    await ensureReviewOpen(page);
    const recoveredComment = page.locator('.comments-rail__comment', { hasText: commentBody });
    await expect(recoveredComment).toHaveCount(1);
    await expect(recoveredComment.getByText('Head line 10')).toBeVisible();
    await recoveredComment.getByRole('button', { name: 'Show comment' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'src/changed.ts' })).toBeVisible();
    await expect(recoveredComment.getByRole('button', { name: 'Show comment' })).toBeFocused();
  } finally {
    await stopGeneratedCli(resumed);
    await fixture.cleanup();
  }
});

test('packaged anchored gap closure keeps stale and orphaned records rail-only', async ({ browser, page }, testInfo) => {
  assertChromium(browser, testInfo);
  const fixture = await createGitFixture({ anchoredReview: true });
  const draftsPath = join(fixture.root, '.diff-review', 'drafts');
  const initial = startGeneratedCli(fixture);

  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openGeneratedReview(page, await waitForLoopbackUrl(initial));
    await page.getByRole('treeitem', { name: /changed\.ts/ }).click();
    await expect(page.getByText(/Unchanged regions begin collapsed/)).toBeVisible();
    await ensureReviewOpen(page);
    await page.getByRole('button', { name: 'Close review' }).click();
    await activateMonacoLine(page, 'head', 'export const stableContext10 = 10;', 10);
    const composer = page.locator('.monaco-anchor-zone--composer textarea');
    await composer.fill('Canonical source for degraded records.');
    await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Add comment' }).click();
    await ensureReviewOpen(page);
    await expect(page.locator('.comments-rail__comment', { hasText: 'Canonical source for degraded records.' })).toHaveCount(1);
  } finally {
    await stopGeneratedCli(initial);
  }

  const [draftFile] = readdirSync(draftsPath).filter((file) => file.endsWith('.json'));
  expect(draftFile).toBeDefined();
  const draftPath = join(draftsPath, draftFile!);
  const draft = JSON.parse(readFileSync(draftPath, 'utf8')) as {
    revision: number;
    comments: Array<{ id: string; anchor: { line: number; selectedText: string; safeDisplayPath: string; uniqueKey: string; path: { bytesBase64url: string; display: string; utf8?: string }; context: { target: { text: string } } } }>;
  };
  const stale = JSON.parse(JSON.stringify(draft.comments[0])) as (typeof draft.comments)[number];
  stale.id = `comment_${crypto.randomUUID()}`;
  stale.anchor.selectedText = 'deliberately stale';
  stale.anchor.context.target.text = 'deliberately stale';
  stale.anchor.uniqueKey = 'a'.repeat(64);
  const orphan = JSON.parse(JSON.stringify(draft.comments[0])) as (typeof draft.comments)[number];
  orphan.id = `comment_${crypto.randomUUID()}`;
  orphan.anchor.line = 999;
  orphan.anchor.path = {
    bytesBase64url: 'c3JjL2RlbGV0ZWQudHM',
    display: 'src/deleted.ts',
    utf8: 'src/deleted.ts',
  };
  orphan.anchor.safeDisplayPath = 'src/deleted.ts';
  orphan.anchor.uniqueKey = 'b'.repeat(64);
  draft.comments.push(stale, orphan);
  draft.revision += 2;
  writeFileSync(draftPath, `${JSON.stringify(draft)}\n`);

  const resumed = startGeneratedCli(fixture);
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openGeneratedReview(page, await waitForLoopbackUrl(resumed));
    const staleComment = page.locator(`[data-comment-id="${stale.id}"]`);
    const orphanComment = page.locator(`[data-comment-id="${orphan.id}"]`);
    await expect(staleComment.getByText('Stale anchor')).toBeVisible();
    await expect(staleComment.getByText('Exact path bytes')).toBeVisible();
    await expect(orphanComment.getByText('Anchor unavailable')).toBeVisible();
    await expect(orphanComment.getByRole('button', { name: 'Inspect recorded file' })).toHaveCount(0);
    await orphanComment.getByRole('button', { name: 'Copy anchor details' }).click();
    await expect(page.getByText(/Recorded anchor details copied|Couldn’t copy anchor details/)).toBeVisible();
    await expect(page.locator('.monaco-anchor-zone--composer textarea')).toHaveCount(0);

    const commentsToggle = page.getByRole('button', { name: 'Review', exact: true });
    await ensureReviewOpen(page);
    await page.getByRole('button', { name: 'Close review' }).click();
    await expect(commentsToggle).toHaveAttribute('aria-expanded', 'false');
    await ensureReviewOpen(page);
    await page.getByRole('button', { name: 'Close review' }).click();
    await expect(commentsToggle).toBeFocused();
    await expect(page.locator('.comments-rail')).toHaveAttribute('inert', '');

    await page.setViewportSize({ width: 900, height: 900 });
    const filesToggle = page.getByRole('button', { name: 'Files', exact: true });
    await filesToggle.click();
    await page.getByRole('button', { name: 'Close files' }).click();
    await expect(filesToggle).toBeFocused();
    await expect(page.locator('.review-files')).toHaveAttribute('inert', '');

    await page.setViewportSize({ width: 1440, height: 900 });
    await ensureReviewOpen(page);
    const inspectRecordedFile = staleComment.getByRole('button', { name: 'Inspect recorded file' });
    await inspectRecordedFile.click();
    await expect(page.getByRole('heading', { level: 1, name: 'src/changed.ts' })).toBeVisible();
    await expect(inspectRecordedFile).toBeFocused();
  } finally {
    await stopGeneratedCli(resumed);
    await fixture.cleanup();
  }
});
