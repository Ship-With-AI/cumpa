import { spawn, execFileSync } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import {
  chmodSync,
  closeSync,
  copyFileSync,
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
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';
import type { Browser, Page, TestInfo } from '@playwright/test';

import { ReviewExportV1Schema } from '../../src/contracts/draft.js';
import { parseCanonicalReviewExport } from '../../src/export/review-export.js';
import { renderReviewMarkdown } from '../../src/export/render-review-markdown.js';
import { createDirtyGitFixture, type DirtyGitFixture } from '../helpers/git-fixture.js';
import { assertSourceControlUnchanged, captureSourceControlSnapshot } from '../helpers/source-control-snapshot.js';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const packedRoot = mkdtempSync(join(tmpdir(), 'diff-review-agent-ready-pack-'));
const extractedPackageRoot = join(packedRoot, 'package');
const executablePath = join(extractedPackageRoot, 'dist/bin/diff-review.mjs');
const fakeBinRoot = join(packedRoot, 'fake-bin');

test.setTimeout(120_000);

interface PackResult {
  readonly filename: string;
}

interface RunningCli {
  readonly child: ChildProcess;
  readonly markerPath: string;
  readonly outputPath: string;
  readonly outputDescriptor: number;
}

interface PersistedDraft {
  readonly revision: number;
  readonly summary: string;
  readonly comments: readonly {
    readonly id: string;
    readonly body: string;
    readonly state: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly anchor: {
      readonly side: string;
      readonly line: number;
      readonly blobOid: string;
      readonly selectedText: string;
      readonly contextHash: string;
    };
  }[];
}

function runPrerequisite(command: string, arguments_: readonly string[]): string {
  try {
    return execFileSync(command, [...arguments_], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    throw new Error(`[prerequisite] ${command} ${arguments_.join(' ')} failed: ${String(error)}`);
  }
}

function startGeneratedCli(
  fixture: DirtyGitFixture,
  selections: Readonly<{ readonly base: string; readonly head: string }>,
): RunningCli {
  const outputPath = join(packedRoot, `terminal-${crypto.randomUUID()}.log`);
  const markerPath = join(packedRoot, `browser-open-${crypto.randomUUID()}.log`);
  const outputDescriptor = openSync(outputPath, 'w');
  const environment = { ...process.env };
  delete environment.CMUX_WORKSPACE_ID;
  const child = spawn(process.execPath, [executablePath], {
    cwd: fixture.nestedCwd,
    env: {
      ...environment,
      PATH: `${fakeBinRoot}:${environment.PATH ?? ''}`,
      DIFF_REVIEW_BROWSER_OPEN_MARKER: markerPath,
      DIFF_REVIEW_LAUNCH_OPTIONS: JSON.stringify({
        cwd: fixture.nestedCwd,
        base: { label: selections.base.slice('refs/heads/'.length), revision: selections.base },
        head: { label: selections.head.slice('refs/heads/'.length), revision: selections.head },
      }),
    },
    stdio: ['ignore', outputDescriptor, outputDescriptor],
  });
  return { child, markerPath, outputPath, outputDescriptor };
}

async function waitForLoopbackUrl(running: RunningCli): Promise<string> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const output = existsSync(running.outputPath) ? readFileSync(running.outputPath, 'utf8') : '';
    const match = output.match(/http:\/\/127\.0\.0\.1:\d+\/#token=[A-Za-z0-9_-]{43,}/);
    if (match !== null && existsSync(running.markerPath) && readFileSync(running.markerPath, 'utf8').includes(match[0])) {
      return match[0];
    }
    if (running.child.exitCode !== null || running.child.signalCode !== null) {
      throw new Error(`[behavioral] packaged CLI exited before publishing a loopback URL:\n${output}`);
    }
    await new Promise<void>((resolveWait) => setTimeout(resolveWait, 25));
  }
  throw new Error('[behavioral] timed out waiting for packaged CLI loopback URL');
}

async function stopGeneratedCli(running: RunningCli): Promise<void> {
  if (running.child.exitCode === null && running.child.signalCode === null) running.child.kill('SIGINT');
  const events = running.child as unknown as EventEmitter;
  const { promise, resolve: resolveExit, reject } = Promise.withResolvers<void>();
  events.once('error', reject);
  events.once('exit', resolveExit);
  await promise;
  closeSync(running.outputDescriptor);
}

async function openReview(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.monaco-diff-editor')).toBeVisible();
  const review = page.getByRole('button', { name: 'Review', exact: true });
  if (await review.getAttribute('aria-expanded') === 'false') await review.click();
  await expect(review).toHaveAttribute('aria-expanded', 'true');
}

async function addHeadComment(page: Page, body: string): Promise<void> {
  await page.getByRole('treeitem', { name: /changed\.ts/ }).click();
  const surface = page.locator('.monaco-diff-editor .editor.modified .monaco-scrollable-element.editor-scrollable').first();
  await surface.click({ position: { x: 16, y: 16 } });
  await page.keyboard.press('Meta+g');
  await page.keyboard.insertText('10');
  await page.keyboard.press('Enter');
  const line = page.locator('.monaco-diff-editor .editor.modified .view-line').filter({ hasText: 'export const stableContext10 = 10;' });
  await expect(line).toBeVisible();
  await line.click();
  await page.getByRole('button', { name: 'Add comment to head line 10' }).click();
  await page.locator('.monaco-anchor-zone--composer textarea').fill(body);
  const accepted = page.waitForResponse((response) => response.url().includes('/api/draft/mutations'));
  await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Add comment' }).click();
  expect((await accepted).status()).toBe(201);
}

async function saveSummary(page: Page, summary: string): Promise<void> {
  await page.getByRole('button', { name: 'Write summary' }).click();
  await page.getByLabel('Review summary (Markdown)').fill(summary);
  const accepted = page.waitForResponse((response) => response.url().includes('/api/draft/mutations'));
  await page.getByRole('button', { name: 'Save summary' }).click();
  expect((await accepted).status()).toBe(200);
}

function readOnlyDraft(fixture: DirtyGitFixture): Readonly<{ readonly bytes: Buffer; readonly draft: PersistedDraft }> {
  const drafts = readdirSync(join(fixture.root, '.diff-review', 'drafts')).filter((entry) => entry.endsWith('.json'));
  expect(drafts).toHaveLength(1);
  const bytes = readFileSync(join(fixture.root, '.diff-review', 'drafts', drafts[0]!));
  const raw = JSON.parse(bytes.toString('utf8')) as { revision: number; summary: string; comments: PersistedDraft['comments'] };
  return Object.freeze({ bytes, draft: Object.freeze(raw) });
}

function hash(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function assertChromium(browser: Browser, testInfo: TestInfo): void {
  expect(testInfo.project.name).toBe('chromium');
  expect(browser.browserType().name()).toBe('chromium');
}

test.beforeAll(() => {
  runPrerequisite(npmCommand, ['run', 'build']);
  runPrerequisite(npmCommand, ['run', 'verify:production-artifacts']);
  const [packed] = JSON.parse(runPrerequisite(npmCommand, ['pack', '--json', '--ignore-scripts', '--pack-destination', packedRoot])) as readonly PackResult[];
  execFileSync('tar', ['-xzf', join(packedRoot, packed!.filename), '-C', packedRoot]);
  symlinkSync(join(repositoryRoot, 'node_modules'), join(extractedPackageRoot, 'node_modules'), 'dir');
  mkdirSync(fakeBinRoot, { recursive: true });
  const opener = join(fakeBinRoot, 'open');
  writeFileSync(opener, [
    '#!/usr/bin/env node',
    "const { appendFileSync } = require('node:fs');",
    "if (process.env.DIFF_REVIEW_BROWSER_OPEN_MARKER) appendFileSync(process.env.DIFF_REVIEW_BROWSER_OPEN_MARKER, `${JSON.stringify(process.argv.slice(2))}\\n`);",
    'process.exitCode = 1;',
    '',
  ].join('\n'));
  copyFileSync(opener, join(packedRoot, 'open'));
  chmodSync(opener, 0o755);
});

test.afterAll(() => rmSync(packedRoot, { recursive: true, force: true }));

test('packaged-resume-after-relaunch preserves accepted review state, separates ordered pairs, and exports exact recovered bytes', async ({ browser, page }, testInfo) => {
  assertChromium(browser, testInfo);
  const fixture = await createDirtyGitFixture('branch-to-worktree', 8);
  const before = await captureSourceControlSnapshot(fixture.root);
  const original = Object.freeze({ base: fixture.baseRef, head: fixture.headRef });
  const reversed = Object.freeze({ base: fixture.headRef, head: fixture.baseRef });
  const summary = 'Accepted summary survives a fully new packaged process.';
  const body = 'Verified anchor survives a fully new packaged process.';
  let running = startGeneratedCli(fixture, original);

  try {
    await openReview(page, await waitForLoopbackUrl(running));
    await addHeadComment(page, body);
    await saveSummary(page, summary);
  } finally {
    await page.close();
    await stopGeneratedCli(running);
  }

  const accepted = readOnlyDraft(fixture);
  expect(accepted.draft.summary).toBe(summary);
  expect(accepted.draft.comments).toHaveLength(1);
  expect(accepted.draft.comments[0]).toMatchObject({ body, state: 'open', anchor: { side: 'head', line: 10, selectedText: 'export const stableContext10 = 10;' } });

  const resumedPage = await browser.newPage();
  running = startGeneratedCli(fixture, original);
  try {
    await openReview(resumedPage, await waitForLoopbackUrl(running));
    await expect(resumedPage.locator('.review-summary__preview')).toContainText(summary);
    await expect(resumedPage.locator('.comments-rail__comment')).toContainText(body);
    expect(readOnlyDraft(fixture).bytes).toEqual(accepted.bytes);

    const exported = resumedPage.waitForResponse((response) => response.url().includes('/api/export'));
    await resumedPage.getByRole('button', { name: 'Export review', exact: true }).click();
    expect((await exported).status()).toBe(201);
    await expect(resumedPage.getByRole('heading', { name: 'Review export complete' })).toBeVisible();
  } finally {
    await resumedPage.close();
    await stopGeneratedCli(running);
  }

  const differentPage = await browser.newPage();
  running = startGeneratedCli(fixture, reversed);
  try {
    await openReview(differentPage, await waitForLoopbackUrl(running));
    await expect(differentPage.getByText(summary, { exact: true })).toHaveCount(0);
    await expect(differentPage.locator('.comments-rail__comment', { hasText: body })).toHaveCount(0);
  } finally {
    await differentPage.close();
    await stopGeneratedCli(running);
  }

  const pairDirectory = join(fixture.root, '.diff-review', 'exports', `${fixture.git(['rev-parse', fixture.baseRef]).toString('ascii').trim()}..${fixture.git(['rev-parse', fixture.headRef]).toString('ascii').trim()}`);
  const [json, markdown, names] = await Promise.all([
    import('node:fs/promises').then(({ readFile }) => readFile(join(pairDirectory, 'review.json'))),
    import('node:fs/promises').then(({ readFile }) => readFile(join(pairDirectory, 'review.md'))),
    import('node:fs/promises').then(({ readdir }) => readdir(pairDirectory)),
  ]);
  expect(names.sort()).toEqual(['review.json', 'review.md']);
  const document = ReviewExportV1Schema.parse(parseCanonicalReviewExport(json));
  expect(Buffer.from(renderReviewMarkdown(json), 'utf8')).toEqual(markdown);
  expect(document.acceptedDraftRevision).toBe(accepted.draft.revision);
  expect(document.summary.markdown).toBe(summary);
  expect(document.files.flatMap((file) => file.comments).map((comment) => comment.body)).toContain(body);
  expect(hash(json)).toMatch(/^[a-f0-9]{64}$/);
  expect(hash(markdown)).toMatch(/^[a-f0-9]{64}$/);
  await expect(assertSourceControlUnchanged(before, await captureSourceControlSnapshot(fixture.root))).resolves.toBeUndefined();
  await fixture.cleanup();
});
