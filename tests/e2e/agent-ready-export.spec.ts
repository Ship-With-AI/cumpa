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
import { ExportReviewResultSchema } from '../../src/contracts/api.js';
import { createDirtyGitFixture, type DirtyGitFixture } from '../helpers/git-fixture.js';
import { assertSourceControlUnchanged, captureSourceControlSnapshot } from '../helpers/source-control-snapshot.js';
import { hasObservedNativeReExport } from '../helpers/agent-ready-export-target.js';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const packedRoot = mkdtempSync(join(tmpdir(), 'compare-agent-ready-pack-'));
const extractedPackageRoot = join(packedRoot, 'package');
const executablePath = join(extractedPackageRoot, 'dist/bin/cumpa.mjs');
const fakeBinRoot = join(packedRoot, 'fake-bin');
const scenarioEvidencePath = process.env.COMPARE_AGENT_READY_EVIDENCE_REPORT;
const scenarioEvidenceRunId = process.env.COMPARE_AGENT_READY_EVIDENCE_RUN_ID;

test.setTimeout(120_000);

const observedNativeReExport = hasObservedNativeReExport(process.platform, process.arch);

type StablePairSha256 = Readonly<{ readonly json: string; readonly markdown: string }>;

interface PackResult {
  readonly filename: string;
}

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
      COMPARE_BROWSER_OPEN_MARKER: markerPath,
      COMPARE_LAUNCH_OPTIONS: JSON.stringify({
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
): RunningAttachedCli {
  const markerPath = join(packedRoot, `attached-browser-open-${crypto.randomUUID()}.log`);
  const stderrPath = join(packedRoot, `attached-stderr-${crypto.randomUUID()}.log`);
  const stdoutPath = join(packedRoot, `attached-stdout-${crypto.randomUUID()}.json`);
  const stderrDescriptor = openSync(stderrPath, 'w');
  const stdoutDescriptor = openSync(stdoutPath, 'w');
  const environment = { ...process.env };
  delete environment.CMUX_WORKSPACE_ID;
  delete environment.COMPARE_LAUNCH_OPTIONS;
  const child = spawn(process.execPath, [executablePath], {
    cwd: fixture.nestedCwd,
    env: {
      ...environment,
      PATH: `${fakeBinRoot}:${environment.PATH ?? ''}`,
      COMPARE_BROWSER_OPEN_MARKER: markerPath,
    },
    stdio: ['pipe', stdoutDescriptor, stderrDescriptor],
  });
  child.stdin.end(JSON.stringify({
    kind: 'compare.review-request',
    schemaVersion: 1,
    mode: 'revisions',
    revisions: { base: selections.base, head: selections.head },
  }));
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
  if (running.child.exitCode !== null) return running.child.exitCode;
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
  if (running.child.exitCode === null && running.child.signalCode === null) running.child.kill('SIGINT');
  const events = running.child as unknown as EventEmitter;
  const { promise, resolve: resolveExit, reject } = Promise.withResolvers<void>();
  events.once('error', reject);
  events.once('exit', resolveExit);
  await promise;
  closeSync(running.outputDescriptor);
}

async function openSession(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.monaco-diff-editor')).toBeVisible();
}

async function ensureReviewOpen(page: Page): Promise<void> {
  const review = page.getByRole('button', { name: 'Review', exact: true });
  if (await review.getAttribute('aria-expanded') === 'false') await review.click();
  await expect(review).toHaveAttribute('aria-expanded', 'true');
}

async function addHeadComment(page: Page, body: string): Promise<void> {
  const review = page.getByRole('button', { name: 'Review', exact: true });
  if (await review.getAttribute('aria-expanded') === 'true') await review.click();
  await expect(review).toHaveAttribute('aria-expanded', 'false');
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
  const drafts = readdirSync(join(fixture.root, '.compare', 'drafts')).filter((entry) => entry.endsWith('.json'));
  expect(drafts).toHaveLength(1);
  const bytes = readFileSync(join(fixture.root, '.compare', 'drafts', drafts[0]!));
  const raw = JSON.parse(bytes.toString('utf8')) as { revision: number; summary: string; comments: PersistedDraft['comments'] };
  return Object.freeze({ bytes, draft: Object.freeze(raw) });
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
    "if (process.env.COMPARE_BROWSER_OPEN_MARKER) appendFileSync(process.env.COMPARE_BROWSER_OPEN_MARKER, `${JSON.stringify(process.argv.slice(2))}\\n`);",
    'process.exitCode = 0;',
    '',
  ].join('\n'));
  copyFileSync(opener, join(packedRoot, 'open'));
  chmodSync(opener, 0o755);
});

test.afterAll(() => rmSync(packedRoot, { recursive: true, force: true }));

test('packaged-resume-after-relaunch preserves accepted review state, completes target-aware second export, and recovers exact bytes', async ({ browser, page }, testInfo) => {
  assertChromium(browser, testInfo);
  const fixture = await createDirtyGitFixture('branch-to-worktree', 8);
  const before = await captureSourceControlSnapshot(fixture.root);
  const original = Object.freeze({ base: fixture.baseRef, head: fixture.headRef });
  const different = Object.freeze({ base: fixture.baseRef, head: fixture.alternateHeadRef! });
  const summary = 'Accepted summary survives a fully new packaged process.';
  const body = 'Verified anchor survives a fully new packaged process.';
  let launchedGeneratedProcesses = 1;
  let terminatedGeneratedProcesses = 0;
  let closedBrowserPages = 0;
  let running = startGeneratedCli(fixture, original);
  let firstExportReceiptPaths: readonly string[] = [];
  let reExportReceiptPaths: readonly string[] = [];
  let firstStablePairSha256: StablePairSha256 | undefined;
  let reExportStablePairSha256: StablePairSha256 | undefined;
  let reExportKind: 'exported' | 'reExportUnsupported' | undefined;

  try {
    await openSession(page, await waitForLoopbackUrl(running));
    await addHeadComment(page, body);
    await saveSummary(page, summary);
  } finally {
    await page.close();
    closedBrowserPages += 1;
    await stopGeneratedCli(running);
    terminatedGeneratedProcesses += 1;
  }

  const accepted = readOnlyDraft(fixture);
  expect(accepted.draft.summary).toBe(summary);
  expect(accepted.draft.comments).toHaveLength(1);
  expect(accepted.draft.comments[0]).toMatchObject({ body, state: 'open', anchor: { side: 'head', line: 10, selectedText: 'export const stableContext10 = 10;' } });

  const resumedPage = await browser.newPage();
  running = startGeneratedCli(fixture, original);
  launchedGeneratedProcesses += 1;
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
    firstExportReceiptPaths = firstExportResult.files.map((file) => file.path);
    await expect(resumedPage.getByRole('heading', { name: 'Review export complete' })).toBeVisible();

    const stablePairDirectory = join(
      fixture.root,
      '.compare',
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
      reExportReceiptPaths = reExportResult.files.map((file) => file.path);
    } else {
      expect(reExportResponse.status()).toBe(409);
      expect(reExportResult).toEqual({ kind: 'reExportUnsupported' });
      reExportKind = reExportResult.kind;
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
    closedBrowserPages += 1;
    await stopGeneratedCli(running);
    terminatedGeneratedProcesses += 1;
  }

  const differentPage = await browser.newPage();
  running = startGeneratedCli(fixture, different);
  launchedGeneratedProcesses += 1;
  try {
    await openSession(differentPage, await waitForLoopbackUrl(running));
    await ensureReviewOpen(differentPage);
    await expect(differentPage.getByText(summary, { exact: true })).toHaveCount(0);
    await expect(differentPage.locator('.comments-rail__comment', { hasText: body })).toHaveCount(0);
  } finally {
    await differentPage.close();
    closedBrowserPages += 1;
    await stopGeneratedCli(running);
    terminatedGeneratedProcesses += 1;
  }

  const baseOid = fixture.git(['rev-parse', fixture.baseRef]).toString('ascii').trim();
  const headOid = fixture.git(['rev-parse', fixture.headRef]).toString('ascii').trim();
  const alternateHeadOid = fixture.git(['rev-parse', fixture.alternateHeadRef!]).toString('ascii').trim();
  const pairDirectory = join(fixture.root, '.compare', 'exports', `${baseOid}..${headOid}`);
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
    throw new Error('[behavioral] packaged re-export outcome was not observed.');
  }
  const reExportEvidence = reExportKind === 'exported'
    ? {
        kind: reExportKind,
        receiptPaths: reExportReceiptPaths,
        stablePairSha256: reExportStablePairSha256,
      }
    : {
        kind: reExportKind,
        stablePairSha256: reExportStablePairSha256,
      };

  if (scenarioEvidencePath !== undefined) {
    if (scenarioEvidenceRunId === undefined) throw new Error('[behavioral] generated-package evidence report requires a run ID');
    writeFileSync(scenarioEvidencePath, `${JSON.stringify({
      schemaVersion: 1,
      runId: scenarioEvidenceRunId,
      scenario: {
        id: 'packaged-resume-after-relaunch',
        title: testInfo.title,
        testFile: 'tests/e2e/agent-ready-export.spec.ts',
      },
      packageArtifact: {
        path: 'dist/bin/cumpa.mjs',
        sourceSha256: createHash('sha256').update(readFileSync(join(repositoryRoot, 'dist', 'bin', 'cumpa.mjs'))).digest('hex'),
        packedSha256: createHash('sha256').update(readFileSync(executablePath)).digest('hex'),
      },
      execution: {
        target: {
          platform: process.platform,
          arch: process.arch,
          observedNativeReExport,
        },
        selectorKind: fixture.selectorKind,
        originalOrderedFullOidPair: { baseOid, headOid },
        acceptedState: {
          revision: accepted.draft.revision,
          summarySha256: createHash('sha256').update(summary).digest('hex'),
          draftSha256: createHash('sha256').update(accepted.bytes).digest('hex'),
          comment: accepted.draft.comments[0],
        },
        closedBrowserPages,
        launchedGeneratedProcesses,
        terminatedGeneratedProcesses,
        differentOrderedPair: { baseOid, headOid: alternateHeadOid },
        export: {
          receiptPaths: ['review.json', 'review.md'],
          firstReceiptPaths: firstExportReceiptPaths,
          firstStablePairSha256,
          reExport: reExportEvidence,
          acceptedDraftRevision: document.acceptedDraftRevision,
          jsonSha256,
          markdownSha256,
        },
      },
    })}\n`, 'utf8');
  }

  await fixture.cleanup();
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
    expect(existsSync(join(fixture.root, '.compare', 'drafts'))).toBe(false);
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
