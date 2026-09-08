import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import {
  chmodSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';
import type { Browser, Page, TestInfo } from '@playwright/test';

import { ReviewExportV1Schema, ReviewExportV3Schema } from '../../src/contracts/draft.js';
import { createGroundedExactPatch } from '../../src/git/exact-patch.js';
import { parseCanonicalReviewExport } from '../../src/export/review-export.js';
import { renderReviewMarkdown } from '../../src/export/render-review-markdown.js';
import { ExportReviewResultSchema } from '../../src/contracts/api.js';
import { createDirtyGitFixture, type DirtyGitFixture } from '../helpers/git-fixture.js';
import { assertSourceControlUnchanged, captureSourceControlSnapshot } from '../helpers/source-control-snapshot.js';
import { hasObservedNativeReExport } from '../helpers/agent-ready-export-target.js';
import {
  installRuntimeArtifact,
  readRuntimeArtifact,
  rehashRuntimeArtifact,
  writeRuntimeScenario,
  type InstalledRuntimeArtifact,
  type RuntimeArtifact,
} from '../helpers/runtime-artifact.js';

let runtimeArtifact: RuntimeArtifact;
let installed: InstalledRuntimeArtifact;
let fakeBinRoot: string;

test.setTimeout(120_000);

const observedNativeReExport = hasObservedNativeReExport(process.platform, process.arch);

type StablePairSha256 = Readonly<{ readonly json: string; readonly markdown: string }>;
const completedScenarios = new Set<string>();
const requiredScenarios = [
  'relaunch',
  'unsaved-composer',
  'range-finish',
  'equivalent-ranges',
  'exact-patch',
  'support',
] as const;


interface RunningCli {
  readonly child: ChildProcess;
  readonly markerPath: string;
  readonly outputPath: string;
  readonly outputDescriptor: number;
}

interface RunningAttachedCli {
  readonly child: ChildProcess;
  readonly markerPath: string;
  readonly stderrPath: string;
  readonly stdoutPath: string;
  readonly stderrDescriptor: number;
  readonly stdoutDescriptor: number;
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


function startGeneratedCli(
  fixture: DirtyGitFixture,
  selections: Readonly<{ readonly base: string; readonly head: string }>,
): RunningCli {
  const outputPath = join(installed.root, `terminal-${crypto.randomUUID()}.log`);
  const markerPath = join(installed.root, `browser-open-${crypto.randomUUID()}.log`);
  const outputDescriptor = openSync(outputPath, 'w');
  const child = spawn(process.execPath, ['--import', installed.fetchGuardPath, installed.nodeEntrypointPath], {
    cwd: fixture.nestedCwd,
    env: {
      ...installed.env,
      PATH: `${fakeBinRoot}:${installed.env.PATH ?? ''}`,
      CUMPA_BROWSER_OPEN_MARKER: markerPath,
      BROWSER: join(fakeBinRoot, 'open'),
      CUMPA_LAUNCH_OPTIONS: JSON.stringify({
        cwd: fixture.nestedCwd,
        base: { label: selections.base.slice('refs/heads/'.length), revision: selections.base },
        head: { label: selections.head.slice('refs/heads/'.length), revision: selections.head },
      }),
    },
    stdio: ['ignore', outputDescriptor, outputDescriptor],
  });
  return { child, markerPath, outputPath, outputDescriptor };
}

function startAttachedCli(
  fixture: DirtyGitFixture,
  selections: Readonly<{ readonly base: string; readonly head: string }>,
  request: unknown = {
    kind: 'cumpa.review-request',
    schemaVersion: 1,
    mode: 'revisions',
    revisions: { base: selections.base, head: selections.head },
  },
): RunningAttachedCli {
  const markerPath = join(installed.root, `attached-browser-open-${crypto.randomUUID()}.log`);
  const stderrPath = join(installed.root, `attached-stderr-${crypto.randomUUID()}.log`);
  const stdoutPath = join(installed.root, `attached-stdout-${crypto.randomUUID()}.json`);
  const stderrDescriptor = openSync(stderrPath, 'w');
  const stdoutDescriptor = openSync(stdoutPath, 'w');
  // Test-only transport denial loads before the npm-generated bin without NODE_OPTIONS.
  const child = spawn(process.execPath, ['--import', installed.fetchGuardPath, installed.nodeEntrypointPath], {
    cwd: fixture.nestedCwd,
    env: {
      ...installed.env,
      PATH: `${fakeBinRoot}:${installed.env.PATH ?? ''}`,
      CUMPA_BROWSER_OPEN_MARKER: markerPath,
      BROWSER: join(fakeBinRoot, 'open'),
    },
    stdio: ['pipe', stdoutDescriptor, stderrDescriptor],
  });
  child.stdin!.end(JSON.stringify(request));
  return {
    child,
    markerPath,
    stderrPath,
    stdoutPath,
    stderrDescriptor,
    stdoutDescriptor,
  };
}

async function waitForAttachedLoopbackUrl(running: RunningAttachedCli): Promise<string> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const stderr = existsSync(running.stderrPath) ? readFileSync(running.stderrPath, 'utf8') : '';
    const match = stderr.match(/http:\/\/127\.0\.0\.1:\d+\/#token=[A-Za-z0-9_-]{43,}/);
    if (match !== null && existsSync(running.markerPath)) return match[0];
    if (running.child.exitCode !== null || running.child.signalCode !== null) {
      throw new Error(`[behavioral] attached CLI exited before publishing a loopback URL:\n${stderr}`);
    }
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, 25);
    await promise;
  }
  throw new Error('[behavioral] timed out waiting for attached CLI loopback URL');
}

async function waitForAttachedExit(running: RunningAttachedCli): Promise<number | null> {
  const events = running.child as unknown as EventEmitter;
  if (running.child.exitCode !== null || running.child.signalCode !== null) return running.child.exitCode;
  const { promise, reject, resolve } = Promise.withResolvers<number | null>();
  events.once('error', reject);
  events.once('exit', resolve);
  return await promise;
}

function closeAttachedCliFiles(running: RunningAttachedCli): void {
  closeSync(running.stderrDescriptor);
  closeSync(running.stdoutDescriptor);
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
  if (running.child.exitCode === null && running.child.signalCode === null) {
    const { promise, resolve: resolveExit, reject } = Promise.withResolvers<void>();
    running.child.once('error', reject);
    running.child.once('exit', resolveExit);
    running.child.kill('SIGINT');
    await promise;
  }
  closeSync(running.outputDescriptor);
}

async function openSession(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.monaco-diff-editor')).toBeVisible();
  const notNow = page.getByRole('button', { name: 'Not now', exact: true });
  if (await notNow.isVisible()) await notNow.click();
}

async function ensureReviewOpen(page: Page): Promise<void> {
  const review = page.getByRole('button', { name: 'Review', exact: true });
  if (await review.getAttribute('aria-expanded') === 'false') await review.click();
  await expect(review).toHaveAttribute('aria-expanded', 'true');
}

async function addHeadComment(page: Page, body: string, lineNumber = 10, selectedText = 'export const stableContext10 = 10;'): Promise<void> {
  const review = page.getByRole('button', { name: 'Review', exact: true });
  if (await review.getAttribute('aria-expanded') === 'true') await review.click();
  await expect(review).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('treeitem', { name: /changed\.ts/ }).click({ timeout: 10_000 });
  const surface = page.locator('.monaco-diff-editor .editor.modified .monaco-scrollable-element.editor-scrollable').first();
  await surface.click({ position: { x: 16, y: 16 } });
  await page.keyboard.press('Meta+g');
  await page.keyboard.insertText(String(lineNumber));
  await page.keyboard.press('Enter');
  const line = page.locator('.monaco-diff-editor .editor.modified .view-line').filter({ hasText: selectedText });
  await expect(line).toBeVisible();
  await line.click();
  await page.getByRole('button', { name: new RegExp(`^Add comment to (?:head|postimage) line ${lineNumber}$`, 'u') }).click({ timeout: 10_000 });
  await page.locator('.monaco-anchor-zone--composer textarea').fill(body);
  const accepted = page.waitForResponse((response) => response.url().includes('/api/draft/mutations'));
  await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Add comment' }).click();
  expect((await accepted).status()).toBe(201);
  if (await review.getAttribute('aria-expanded') === 'false') await review.click();
  await expect(review).toHaveAttribute('aria-expanded', 'true');
}

async function saveSummary(page: Page, summary: string): Promise<void> {
  await page.getByRole('button', { name: 'Write summary' }).click();
  await page.getByLabel('Review summary (Markdown)').fill(summary);
  const accepted = page.waitForResponse((response) => response.url().includes('/api/draft/mutations'));
  await page.getByRole('button', { name: 'Save summary' }).click();
  expect((await accepted).status()).toBe(200);
}


function readOnlyDraft(fixture: DirtyGitFixture): Readonly<{ readonly bytes: Buffer; readonly draft: PersistedDraft }> {
  const drafts = readdirSync(join(fixture.root, '.cumpa', 'drafts')).filter((entry) => entry.endsWith('.json'));
  expect(drafts).toHaveLength(1);
  const bytes = readFileSync(join(fixture.root, '.cumpa', 'drafts', drafts[0]!));
  const raw = JSON.parse(bytes.toString('utf8')) as { revision: number; summary: string; comments: PersistedDraft['comments'] };
  return Object.freeze({ bytes, draft: Object.freeze(raw) });
}


function assertChromium(browser: Browser, testInfo: TestInfo): void {
  expect(testInfo.project.name).toBe('chromium');
  expect(browser.browserType().name()).toBe('chromium');
}

test.beforeAll(() => {
  runtimeArtifact = readRuntimeArtifact();
  installed = installRuntimeArtifact(runtimeArtifact);
  fakeBinRoot = join(installed.root, 'fake-bin');
  mkdirSync(fakeBinRoot, { recursive: true });
  const opener = join(fakeBinRoot, 'open');
  writeFileSync(opener, [
    '#!/usr/bin/env node',
    "const { appendFileSync } = require('node:fs');",
    "if (process.env.CUMPA_BROWSER_OPEN_MARKER) appendFileSync(process.env.CUMPA_BROWSER_OPEN_MARKER, `${JSON.stringify(process.argv.slice(2))}\\n`);",
    'process.exitCode = 0;',
    '',
  ].join('\n'));
  chmodSync(opener, 0o755);
});

test.afterAll(() => {
  if (installed === undefined) return;
  let cleaned = false;
  try {
    if (process.env.CUMPA_AGENT_READY_EVIDENCE_REPORT !== undefined) {
      expect([...completedScenarios].sort()).toEqual([...requiredScenarios].sort());
    }
    rehashRuntimeArtifact(runtimeArtifact);
    installed.cleanup();
    cleaned = true;
    const archive = rehashRuntimeArtifact(runtimeArtifact);
    writeRuntimeScenario('review', {
      archive,
      package: runtimeArtifact.package,
      install: installed.proof,
      target: { platform: process.platform, arch: process.arch },
      cleanup: { complete: true },
      review: {
        relaunch: true,
        canonicalV2: true,
        isolatedDrafts: true,
        reExport: observedNativeReExport ? 'exported' : 'reExportUnsupported',
      },
      support: { unavailable: true, dismissed: true, unrestricted: true },
      exactPatch: { canonicalV3: true, grounded: true },
      native: { observedReExport: observedNativeReExport, fallback: 'reExportUnsupported' },
      sourceControl: { unchanged: true },
      checks: { finish: true },
    });
  } finally {
    if (!cleaned) installed.cleanup();
  }
});

test('installed resume after relaunch preserves accepted review state, completes target-aware second export, and recovers exact bytes', async ({ browser, page }, testInfo) => {
  assertChromium(browser, testInfo);
  const fixture = await createDirtyGitFixture('branch-to-worktree', 8);
  try {
    const before = await captureSourceControlSnapshot(fixture.root);
    const original = Object.freeze({ base: fixture.baseRef, head: fixture.headRef });
    const different = Object.freeze({ base: fixture.baseRef, head: fixture.alternateHeadRef! });
    const summary = 'Accepted summary survives a fully new installed process.';
    const body = 'Verified anchor survives a fully new installed process.';
    let running = startGeneratedCli(fixture, original);
    let firstStablePairSha256: StablePairSha256 | undefined;
    let reExportStablePairSha256: StablePairSha256 | undefined;
    let reExportKind: 'exported' | 'reExportUnsupported' | undefined;
  try {
    await openSession(page, await waitForLoopbackUrl(running));
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
    await openSession(resumedPage, await waitForLoopbackUrl(running));
    await ensureReviewOpen(resumedPage);
    await expect(resumedPage.locator('.review-summary__preview')).toContainText(summary);
    await expect(resumedPage.locator('.comments-rail__comment')).toContainText(body);
    expect(readOnlyDraft(fixture).bytes).toEqual(accepted.bytes);
    const exported = resumedPage.waitForResponse((response) => response.url().includes('/api/export'));
    await resumedPage.getByRole('button', { name: 'Export review', exact: true }).click();

    const firstExportResponse = await exported;
    expect(firstExportResponse.status()).toBe(201);
    const firstExportResult = ExportReviewResultSchema.parse(await firstExportResponse.json());
    if (firstExportResult.kind !== 'exported') {
      throw new Error(`Expected first export receipt, received ${firstExportResult.kind}.`);
    }
    await expect(resumedPage.getByRole('heading', { name: 'Review export complete' })).toBeVisible();

    const stablePairDirectory = join(
      fixture.root,
      '.cumpa',
      'exports',
      `${fixture.git(['rev-parse', fixture.baseRef]).toString('ascii').trim()}..${fixture.git(['rev-parse', fixture.headRef]).toString('ascii').trim()}`,
    );
    const [firstJson, firstMarkdown] = [
      readFileSync(join(stablePairDirectory, 'review.json')),
      readFileSync(join(stablePairDirectory, 'review.md')),
    ];
    firstStablePairSha256 = Object.freeze({
      json: createHash('sha256').update(firstJson).digest('hex'),
      markdown: createHash('sha256').update(firstMarkdown).digest('hex'),
    });
    expect(readdirSync(stablePairDirectory).sort()).toEqual(['review.json', 'review.md']);

    const reExported = resumedPage.waitForResponse((response) => response.url().includes('/api/export'));
    await resumedPage.getByRole('button', { name: 'Export review again', exact: true }).click();
    const reExportResponse = await reExported;
    const reExportResult = ExportReviewResultSchema.parse(await reExportResponse.json());
    if (observedNativeReExport) {
      expect(reExportResponse.status()).toBe(201);
      if (reExportResult.kind !== 'exported') {
        throw new Error(`Expected native re-export receipt on darwin-arm64, received ${reExportResult.kind}.`);
      }
      reExportKind = reExportResult.kind;
    } else {
      expect(reExportResponse.status()).toBe(409);
      expect(reExportResult).toEqual({ kind: 'reExportUnsupported' });
      reExportKind = 'reExportUnsupported';
    }

    const [secondJson, secondMarkdown] = [
      readFileSync(join(stablePairDirectory, 'review.json')),
      readFileSync(join(stablePairDirectory, 'review.md')),
    ];
    reExportStablePairSha256 = Object.freeze({
      json: createHash('sha256').update(secondJson).digest('hex'),
      markdown: createHash('sha256').update(secondMarkdown).digest('hex'),
    });
    if (reExportKind === 'reExportUnsupported') {
      expect(secondJson).toEqual(firstJson);
      expect(secondMarkdown).toEqual(firstMarkdown);
      expect(reExportStablePairSha256).toEqual(firstStablePairSha256);
    }
    expect(readdirSync(stablePairDirectory).sort()).toEqual(['review.json', 'review.md']);
    expect(ReviewExportV1Schema.parse(parseCanonicalReviewExport(secondJson))).toMatchObject({
      acceptedDraftRevision: accepted.draft.revision,
      summary: { markdown: summary },
    });
    expect(Buffer.from(renderReviewMarkdown(secondJson), 'utf8')).toEqual(secondMarkdown);
  } finally {
    await resumedPage.close();
    await stopGeneratedCli(running);
  }

  const differentPage = await browser.newPage();
  running = startGeneratedCli(fixture, different);
  try {
    await openSession(differentPage, await waitForLoopbackUrl(running));
    await ensureReviewOpen(differentPage);
    await expect(differentPage.getByText(summary, { exact: true })).toHaveCount(0);
    await expect(differentPage.locator('.comments-rail__comment', { hasText: body })).toHaveCount(0);
  } finally {
    await differentPage.close();
    await stopGeneratedCli(running);
  }

  const baseOid = fixture.git(['rev-parse', fixture.baseRef]).toString('ascii').trim();
  const headOid = fixture.git(['rev-parse', fixture.headRef]).toString('ascii').trim();
  const alternateHeadOid = fixture.git(['rev-parse', fixture.alternateHeadRef!]).toString('ascii').trim();
  const pairDirectory = join(fixture.root, '.cumpa', 'exports', `${baseOid}..${headOid}`);
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
  const jsonSha256 = createHash('sha256').update(json).digest('hex');
  const markdownSha256 = createHash('sha256').update(markdown).digest('hex');
  expect(jsonSha256).toMatch(/^[a-f0-9]{64}$/);
  expect(markdownSha256).toMatch(/^[a-f0-9]{64}$/);
  await expect(assertSourceControlUnchanged(before, await captureSourceControlSnapshot(fixture.root))).resolves.toBeUndefined();

  if (firstStablePairSha256 === undefined || reExportStablePairSha256 === undefined || reExportKind === undefined) {
    throw new Error('[behavioral] installed re-export outcome was not observed.');
  }
  completedScenarios.add('relaunch');
  } finally {
    await fixture.cleanup();
  }
});

test('attached review blocks Finish while an inline composer has unsaved text', async ({ browser, page }, testInfo) => {
  assertChromium(browser, testInfo);
  const fixture = await createDirtyGitFixture('branch-to-worktree', 8);
  const running = startAttachedCli(fixture, { base: fixture.baseRef, head: fixture.headRef });

  try {
    await openSession(page, await waitForAttachedLoopbackUrl(running));
    const review = page.getByRole('button', { name: 'Review', exact: true });
    if (await review.getAttribute('aria-expanded') === 'true') await review.click();
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
    const composer = page.locator('.monaco-anchor-zone--composer textarea');
    await composer.fill('Unsaved inline feedback');
    await page.getByRole('treeitem', { name: /added\.ts/ }).click();

    await ensureReviewOpen(page);
    const completion = page.getByRole('region', { name: 'Finish attached review' });
    const finish = completion.getByRole('button', { name: 'Finish review', exact: true });
    await expect(finish).toBeDisabled();
  await finish.evaluate((button) => {
    if (!(button instanceof HTMLButtonElement)) throw new Error('Expected the Finish button');
    button.click();
  });
    expect(readFileSync(running.stdoutPath)).toEqual(Buffer.alloc(0));

    const reviewDraft = completion.getByRole('button', { name: /Review draft in .*changed\.ts/ });
    await expect(completion).toContainText('Inline comment draft must be reviewed');
    await expect(completion).toContainText('has unsaved text. Save or discard it before finishing.');
    await expect(reviewDraft).toBeVisible();
    await reviewDraft.click();
    await expect(page.locator('#review-panel')).toHaveAttribute('aria-hidden', 'true');
    const restoredComposer = page.locator('.monaco-anchor-zone--composer textarea');
    await expect(restoredComposer).toBeVisible();
    await expect(restoredComposer).toHaveValue('Unsaved inline feedback');
    await expect(page.locator('.inline-comment-composer__header')).toContainText('src/changed.ts');
    await restoredComposer.fill('');
    await ensureReviewOpen(page);
    await expect(finish).toBeEnabled();
    completedScenarios.add('unsaved-composer');
  } finally {
    if (running.child.exitCode === null && running.child.signalCode === null) running.child.kill('SIGINT');
    await waitForAttachedExit(running);
    closeAttachedCliFiles(running);
    await fixture.cleanup();
  }
});

test('attached range review stays silent until Finish then emits one canonical V2 document', async ({ browser, page }, testInfo) => {
  assertChromium(browser, testInfo);
  const fixture = await createDirtyGitFixture('branch-to-worktree', 8);
  const selections = { base: fixture.baseRef, head: fixture.headRef };
  const running = startAttachedCli(fixture, selections);
  let closed = false;

  try {
    const url = await waitForAttachedLoopbackUrl(running);
    expect(readFileSync(running.stdoutPath)).toEqual(Buffer.alloc(0));
    await openSession(page, url);
    await ensureReviewOpen(page);
    await expect(page.getByRole('button', { name: 'Finish review', exact: true })).toBeVisible();

    const finished = page.waitForResponse((response) => response.url().includes('/api/review-completion/finish'));
    await page.getByRole('button', { name: 'Finish review', exact: true }).click();
    expect((await finished).status()).toBe(201);
    expect(await waitForAttachedExit(running)).toBe(0);

    const stdout = readFileSync(running.stdoutPath);
    expect(stdout).not.toHaveLength(0);
    expect(stdout.at(-1)).not.toBe(0x0a);
    expect(parseCanonicalReviewExport(stdout)).toMatchObject({
      schemaVersion: 2,
      acceptedDraftRevision: 0,
      range: {
        kind: 'revisions',
        requestedBase: selections.base,
        requestedHead: selections.head,
      },
    });
    expect(readFileSync(running.stderrPath, 'utf8')).toContain(url);
    expect(existsSync(join(fixture.root, '.cumpa', 'drafts'))).toBe(false);
    completedScenarios.add('range-finish');
    closeAttachedCliFiles(running);
    closed = true;
  } finally {
    if (running.child.exitCode === null && running.child.signalCode === null) {
      running.child.kill('SIGINT');
      await waitForAttachedExit(running);
    }
    if (!closed) closeAttachedCliFiles(running);
    await fixture.cleanup();
  }
});

test('equivalent installed attached ranges retain canonical provenance while owning isolated drafts and delivery', async ({ browser, page }, testInfo) => {
  assertChromium(browser, testInfo);
  const fixture = await createDirtyGitFixture('branch-to-worktree', 8);
  const selections = { base: fixture.baseRef, head: fixture.headRef };
  const first = startAttachedCli(fixture, selections);
  const second = startAttachedCli(fixture, selections);
  const secondPage = await browser.newPage();

  try {
    await Promise.all([
      openSession(page, await waitForAttachedLoopbackUrl(first)),
      openSession(secondPage, await waitForAttachedLoopbackUrl(second)),
    ]);
    await Promise.all([ensureReviewOpen(page), ensureReviewOpen(secondPage)]);
    await saveSummary(page, 'First equivalent attached review.');
    await saveSummary(secondPage, 'Second equivalent attached review.');
    const drafts = readdirSync(join(fixture.root, '.cumpa', 'drafts')).sort();
    expect(drafts).toEqual([
      expect.stringMatching(/^agent-[0-9a-f]{32}\.json$/u),
      expect.stringMatching(/^agent-[0-9a-f]{32}\.json$/u),
    ]);
    expect(drafts[0]).not.toBe(drafts[1]);

    await ensureReviewOpen(page);
    const firstFinished = page.waitForResponse((response) => response.url().includes('/api/review-completion/finish'));
    await page.getByRole('button', { name: 'Finish review', exact: true }).click();
    expect((await firstFinished).status()).toBe(201);
    expect(await waitForAttachedExit(first)).toBe(0);
    expect(readFileSync(second.stdoutPath)).toEqual(Buffer.alloc(0));

    await ensureReviewOpen(secondPage);
    const secondFinished = secondPage.waitForResponse((response) => response.url().includes('/api/review-completion/finish'));
    await secondPage.getByRole('button', { name: 'Finish review', exact: true }).click();
    expect((await secondFinished).status()).toBe(201);
    expect(await waitForAttachedExit(second)).toBe(0);

    const firstBytes = readFileSync(first.stdoutPath);
    const secondBytes = readFileSync(second.stdoutPath);
    expect(firstBytes.at(-1)).not.toBe(0x0a);
    expect(secondBytes.at(-1)).not.toBe(0x0a);
    const firstExport = parseCanonicalReviewExport(firstBytes);
    const secondExport = parseCanonicalReviewExport(secondBytes);
    expect(firstExport).toMatchObject({ schemaVersion: 2, summary: { markdown: 'First equivalent attached review.' } });
    expect(secondExport).toMatchObject({ schemaVersion: 2, summary: { markdown: 'Second equivalent attached review.' } });
    if (firstExport.schemaVersion !== 2 || secondExport.schemaVersion !== 2) throw new Error('Attached ranges must emit canonical V2');
    expect(firstExport.range?.reviewKey).toBe(secondExport.range?.reviewKey);
    completedScenarios.add('equivalent-ranges');
  } finally {
    for (const running of [first, second]) {
      if (running.child.exitCode === null && running.child.signalCode === null) {
        running.child.kill('SIGINT');
        await waitForAttachedExit(running);
      }
      closeAttachedCliFiles(running);
    }
    await secondPage.close();
    await fixture.cleanup();
  }
});

test('installed exact-patch review grounds the submitted patch and emits canonical V3 only after Finish', async ({ browser, page }, testInfo) => {
  assertChromium(browser, testInfo);
  const fixture = await createDirtyGitFixture('branch-to-worktree', 8);
  try {
  const before = await captureSourceControlSnapshot(fixture.root);
  const patch = fixture.git(['diff', '--no-ext-diff', '--no-textconv', '--binary', '--full-index', fixture.baseRef, fixture.headRef]).toString('utf8');
  const grounded = await createGroundedExactPatch({
    cwd: fixture.nestedCwd,
    patchContent: patch,
    target: { kind: 'repository' },
  });
  const request = {
    kind: 'cumpa.review-request',
    schemaVersion: 1,
    mode: 'patch',
    patch: { content: patch, target: { kind: 'repository' } },
  };
  const running = startAttachedCli(fixture, { base: fixture.baseRef, head: fixture.headRef }, request);
  let closed = false;

  try {
    const url = await waitForAttachedLoopbackUrl(running);
    expect(readFileSync(running.stdoutPath)).toEqual(Buffer.alloc(0));
    await openSession(page, url);
    await addHeadComment(page, 'Grounded exact-patch feedback.', 9, 'export const changed = "head value";');
    const finished = page.waitForResponse((response) => response.url().includes('/api/review-completion/finish'));
    await page.getByRole('button', { name: 'Finish review', exact: true }).click();
    const finishResponse = await finished;
    expect(finishResponse.status(), await finishResponse.text()).toBe(201);
    expect(await waitForAttachedExit(running)).toBe(0);

    const bytes = readFileSync(running.stdoutPath);
    expect(bytes).not.toHaveLength(0);
    expect(bytes.at(-1)).not.toBe(0x0a);
    const exported = ReviewExportV3Schema.parse(parseCanonicalReviewExport(bytes));
    const changed = grounded.changedFiles.find((file) => file.newPath?.display === 'src/changed.ts');
    if (changed === undefined) throw new Error('[behavioral] grounded fixture changed file was not found.');
    const preimage = grounded.contents.get(changed.id)?.preimage;
    if (preimage === undefined) throw new Error('[behavioral] grounded fixture preimage was not found.');
    const baseOid = fixture.git(['rev-parse', fixture.baseRef]).toString('ascii').trim();
    const headOid = fixture.git(['rev-parse', fixture.headRef]).toString('ascii').trim();
    const expectedOldBlobOid = fixture.git(['rev-parse', `${baseOid}:src/changed.ts`]).toString('ascii').trim();
    const expectedNewBlobOid = fixture.git(['rev-parse', `${headOid}:src/changed.ts`]).toString('ascii').trim();

    expect(preimage).toEqual(fixture.git(['show', `${baseOid}:src/changed.ts`]));
    expect(changed.oldBlobOid).toBe(expectedOldBlobOid);
    expect(changed.newBlobOid).toBe(expectedNewBlobOid);
    expect(Buffer.from(request.patch.content, 'utf8')).toEqual(
      fixture.git(['diff', '--no-ext-diff', '--no-textconv', '--binary', '--full-index', fixture.baseRef, fixture.headRef]),
    );
    expect(exported.patch).toMatchObject({
      digest: grounded.scope.digest,
      validationTarget: grounded.scope.validationTarget,
      snapshot: { status: 'unchanged', files: grounded.changedFiles },
    });
    const reviewKey = createHash('sha256').update('cumpa-exact-patch-review-key-v1');
    for (const value of [grounded.scope.digest, grounded.scope.validationTarget.kind, grounded.repositoryRoot]) {
      const bytes = Buffer.from(value, 'utf8');
      const length = Buffer.allocUnsafe(8);
      length.writeBigUInt64BE(BigInt(bytes.byteLength));
      reviewKey.update(length).update(bytes);
    }
    expect(exported.patch.reviewKey).toBe(reviewKey.digest('hex'));
    const exportedComment = exported.files
      .flatMap((file) => file.comments)
      .find((comment) => comment.body === 'Grounded exact-patch feedback.');
    expect(exportedComment).toMatchObject({
      anchor: {
        side: 'head',
        line: 9,
        blobOid: expectedNewBlobOid,
        selectedText: 'export const changed = "head value";',
      },
    });
    expect(readFileSync(running.stderrPath, 'utf8')).toContain(url);
    await expect(assertSourceControlUnchanged(before, await captureSourceControlSnapshot(fixture.root))).resolves.toBeUndefined();
    completedScenarios.add('exact-patch');
    closeAttachedCliFiles(running);
    closed = true;
  } finally {
    if (running.child.exitCode === null && running.child.signalCode === null) {
      running.child.kill('SIGINT');
      await waitForAttachedExit(running);
    }
    if (!closed) closeAttachedCliFiles(running);
  }
  } finally {
    await fixture.cleanup();
  }
});

test('installed configured support remains unavailable without outbound access and does not restrict Finish', async ({ browser, page }, testInfo) => {
  assertChromium(browser, testInfo);
  const fixture = await createDirtyGitFixture('branch-to-worktree', 8);
  const before = await captureSourceControlSnapshot(fixture.root);
  const running = startAttachedCli(fixture, { base: fixture.baseRef, head: fixture.headRef });
  let closed = false;

  await page.context().route('**/*', async (route) => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.hostname === '127.0.0.1' || requestUrl.hostname === 'localhost') {
      await route.continue();
      return;
    }
    await route.abort('blockedbyclient');
  });

  try {
    await openSession(page, await waitForAttachedLoopbackUrl(running));
    const support = page.getByRole('button', { name: 'Support Cumpa', exact: true });
    await expect(support).toBeVisible();
    await support.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Support Cumpa' })).toBeVisible();
    const blockedBeforeSupport = existsSync(installed.blockedFetchesPath)
      ? readFileSync(installed.blockedFetchesPath, 'utf8').split('\n').filter((line) => line === 'blocked').length
      : 0;
    await dialog.getByRole('button', { name: 'Support Cumpa — $49.99' }).click();
    await expect.poll(() => existsSync(installed.blockedFetchesPath)
      ? readFileSync(installed.blockedFetchesPath, 'utf8').split('\n').filter((line) => line === 'blocked').length
      : 0).toBeGreaterThan(blockedBeforeSupport);
    await expect(dialog).not.toContainText('Waiting for confirmation… You can close this and keep reviewing.');
    await expect(dialog.getByRole('button', { name: 'Support Cumpa — $49.99' })).toBeEnabled();
    await dialog.getByRole('button', { name: 'Not now' }).click();
    await expect(dialog).toBeHidden();

    await ensureReviewOpen(page);
    const finished = page.waitForResponse((response) => response.url().includes('/api/review-completion/finish'));
    await page.getByRole('button', { name: 'Finish review', exact: true }).click();
    expect((await finished).status()).toBe(201);
    expect(await waitForAttachedExit(running)).toBe(0);
    expect(parseCanonicalReviewExport(readFileSync(running.stdoutPath))).toMatchObject({ schemaVersion: 2 });
    await expect(assertSourceControlUnchanged(before, await captureSourceControlSnapshot(fixture.root))).resolves.toBeUndefined();
    completedScenarios.add('support');
    closeAttachedCliFiles(running);
    closed = true;
  } finally {
    await page.context().unroute('**/*');
    
    if (running.child.exitCode === null && running.child.signalCode === null) {
      running.child.kill('SIGINT');
      await waitForAttachedExit(running);
    }
    if (!closed) closeAttachedCliFiles(running);
    await fixture.cleanup();
  }
});
