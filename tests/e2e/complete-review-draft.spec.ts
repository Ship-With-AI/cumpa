import { spawn, execFileSync } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import {
  closeSync,
  copyFileSync,
  existsSync,
  readdirSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  statSync,
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
const packedRoot = mkdtempSync(join(tmpdir(), 'diff-review-complete-draft-pack-'));
const extractedPackageRoot = join(packedRoot, 'package');
const executablePath = join(extractedPackageRoot, 'dist/bin/diff-review.mjs');
const fakeBinRoot = join(packedRoot, 'fake-bin');
test.setTimeout(90_000);

interface PackResult {
  readonly filename: string;
}

interface RunningCli {
  readonly child: ChildProcess;
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
      `[prerequisite] ${command} ${arguments_.join(' ')} failed before packaged review behavior: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function waitForLoopbackUrl(running: RunningCli): Promise<string> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const output = existsSync(running.outputPath)
      ? readFileSync(running.outputPath, 'utf8')
      : '';
    const match = output.match(/http:\/\/127\.0\.0\.1:\d+\/#token=[A-Za-z0-9_-]{43,}/);
    if (match !== null) return match[0];
    if (running.child.exitCode !== null || running.child.signalCode !== null) {
      throw new Error(`[behavioral] generated CLI exited before publishing a loopback URL:\n${output}`);
    }
    const { promise, resolve: resolveWait } = Promise.withResolvers<void>();
    setTimeout(resolveWait, 25);
    await promise;
  }
  throw new Error('[behavioral] timed out waiting for generated CLI loopback URL');
}

function startGeneratedCli(repository: GitFixture, head = repository.headRef): RunningCli {
  const outputPath = join(packedRoot, `terminal-${crypto.randomUUID()}.log`);
  const outputDescriptor = openSync(outputPath, 'w');
  const child = spawn(process.execPath, [executablePath], {
    cwd: repository.nestedCwd,
    env: {
      ...process.env,
      PATH: `${fakeBinRoot}:${process.env.PATH ?? ''}`,
      DIFF_REVIEW_LAUNCH_OPTIONS: JSON.stringify({
        cwd: repository.nestedCwd,
        base: {
          label: 'main',
          revision: repository.baseRef,
          source: { kind: 'branch', id: 'fixture-base', refName: repository.baseRef },
        },
        head: {
          label: head.slice('refs/heads/'.length),
          revision: head,
          source: { kind: 'branch', id: 'fixture-head', refName: head },
        },
      }),
    },
    stdio: ['ignore', outputDescriptor, outputDescriptor],
  });
  return { child, outputPath, outputDescriptor };
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
  const editor = side === 'base' ? 'editor original' : 'editor modified';
  const editorSurface = page.locator(`.monaco-diff-editor .${editor.split(' ').join('.')} .monaco-scrollable-element.editor-scrollable`).first();
  await editorSurface.click({ position: { x: 16, y: 16 } });
  await page.keyboard.press('Meta+g');
  await page.keyboard.insertText(String(lineNumber));
  await page.keyboard.press('Enter');
  const line = page
    .locator(`.monaco-diff-editor .${editor.split(' ').join('.')}`)
    .locator('.view-line')
    .filter({ hasText: text });
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
  writeFileSync(fakeOpen, '#!/usr/bin/env node\nprocess.exitCode = 1;\n');
  copyFileSync(fakeOpen, join(fakeBinRoot, 'open'));
});

test.afterAll(() => {
  rmSync(packedRoot, { force: true, recursive: true });
});

test('complete draft lifecycle edits, resolves, reopens, deletes, and groups comments through the packaged Review', async ({ browser, page }, testInfo) => {
  assertChromium(browser, testInfo);
  const fixture = await createGitFixture({ anchoredReview: true });
  const commentBody = 'Packaged lifecycle comment.';
  const editedBody = 'Packaged lifecycle comment, edited.';
  const summary = '## Review outcome\n\nKeep **this** review.';
  let running = startGeneratedCli(fixture);

  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openGeneratedReview(page, await waitForLoopbackUrl(running));
    await page.getByRole('treeitem', { name: /changed\.ts/ }).click();
    await activateMonacoLine(page, 'head', 'export const stableContext10 = 10;', 10);
    const composer = page.locator('.monaco-anchor-zone--composer textarea');
    await composer.fill(commentBody);
    const added = page.waitForResponse((response) => response.url().includes('/api/draft/mutations'));
    await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Add comment' }).click();
    expect((await added).status()).toBe(201);

    await page.getByRole('button', { name: /^Review/ }).click();
    await expect(page.locator('#comments-heading')).toHaveText('Review');
    await expect(page.locator('#review-summary-heading')).toBeVisible();
    await expect(page.getByText('No summary yet', { exact: true })).toBeVisible();


    const initialRecord = page.locator('.comments-rail__comment', { hasText: commentBody });
    await expect(initialRecord).toHaveCount(1);
    const commentId = await initialRecord.getAttribute('data-comment-id');
    expect(commentId).not.toBeNull();
    const record = page.locator(`.comments-rail__comment[data-comment-id="${commentId}"]`);
    await expect(page.getByRole('heading', { name: 'Open comments (1)' })).toBeVisible();
    await record.getByRole('button', { name: 'Show comment' }).click();
    const inlineHeading = page.locator('.inline-accepted-comment h3');
    await expect(inlineHeading).toBeVisible();
    await expect(inlineHeading).toBeFocused();
    await record.getByRole('button', { name: 'Edit' }).click();
    const editor = record.getByRole('textbox');
    await editor.fill('discarded local edit');
    await record.getByRole('button', { name: 'Cancel edit' }).click();
    await expect(record).toContainText(commentBody);
    await record.getByRole('button', { name: 'Edit' }).click();
    await editor.fill(editedBody);
    await record.getByRole('button', { name: 'Save comment' }).click();
    await expect(record).toContainText(editedBody);
    await record.getByRole('button', { name: 'Resolve' }).click();
    await expect(page.getByRole('heading', { name: 'Open comments (0)' })).toBeVisible();
    await page.getByRole('button', { name: /Resolved comments/ }).click();
    const resolvedRecord = page.locator('.comments-rail__comment', { hasText: editedBody });
    await resolvedRecord.getByRole('button', { name: 'Reopen' }).click();
    await expect(page.getByRole('heading', { name: 'Open comments (1)' })).toBeVisible();

  } finally {
    await stopGeneratedCli(running);
  }

  running = startGeneratedCli(fixture);
  try {
    await openGeneratedReview(page, await waitForLoopbackUrl(running));
    const record = page.locator('.comments-rail__comment', { hasText: editedBody });
    await record.getByRole('button', { name: 'Delete' }).click();
    await expect(record.getByText('Delete comment?')).toBeVisible();
    await record.getByRole('button', { name: 'Delete comment' }).click();
    await expect(page.getByRole('heading', { name: 'Open comments (0)' })).toBeVisible();
  } finally {
    await stopGeneratedCli(running);
    await fixture.cleanup();
  }
});

test('complete draft lifecycle saves a safe summary and relaunches it through the packaged Review', async ({ browser, page }, testInfo) => {
  assertChromium(browser, testInfo);
  const fixture = await createGitFixture({ anchoredReview: true });
  const summary = '## Review outcome\n\nKeep **this** review.';
  let running = startGeneratedCli(fixture);

  try {
    await openGeneratedReview(page, await waitForLoopbackUrl(running));
    await page.getByRole('button', { name: /^Review/ }).click();
    await page.getByRole('button', { name: 'Write summary' }).click();
    const summaryEditor = page.getByLabel('Review summary (Markdown)');
    await summaryEditor.fill('<script>window.bad = true</script>\n\n' + summary);
    await page.getByRole('tab', { name: 'Preview' }).click();
    await expect(page.locator('.review-summary__preview script')).toHaveCount(0);
    await expect(page.locator('.review-summary__preview')).toContainText('Review outcome');
    await page.getByRole('tab', { name: 'Edit' }).click();
    await summaryEditor.fill(summary);
    await expect(page.getByRole('button', { name: 'Save summary' })).toBeEnabled();
    const savedResponse = page.waitForResponse((response) => response.url().includes('/api/draft/mutations'));
    await page.getByRole('button', { name: 'Save summary' }).click();
    expect((await savedResponse).status()).toBe(200);
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  } finally {
    await stopGeneratedCli(running);
  }

  running = startGeneratedCli(fixture);
  try {
    await openGeneratedReview(page, await waitForLoopbackUrl(running));
    await expect(page.locator('.review-summary__preview')).toContainText('Review outcome');
  } finally {
    await stopGeneratedCli(running);
    await fixture.cleanup();
  }
});

test('two-tab conflict retains every local buffer and requires fresh explicit CAS after reload', async ({ browser, page }, testInfo) => {
  assertChromium(browser, testInfo);
  const fixture = await createGitFixture({ anchoredReview: true });
  const otherTab = await browser.newPage();
  const seedBody = 'Shared comment before two tabs.';
  const firstCanonicalSummary = 'Summary accepted by tab A.';
  const attemptedSummary = 'Summary attempted by tab B.';
  const attemptedEdit = 'Edit attempted by tab B.';
  const attemptedAdd = 'Add attempted by tab B.';
  let running: RunningCli | undefined;

  try {
    running = startGeneratedCli(fixture);
    const url = await waitForLoopbackUrl(running);
    const accessToken = new URL(url).hash.replace(/^#token=/, '');
    expect(accessToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openGeneratedReview(page, url);
    await page.getByRole('treeitem', { name: /changed\.ts/ }).click();
    await activateMonacoLine(page, 'head', 'export const stableContext10 = 10;', 10);
    await page.locator('.monaco-anchor-zone--composer textarea').fill(seedBody);
    const seeded = page.waitForResponse((response) => response.url().includes('/api/draft/mutations'));
    await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Add comment' }).click();
    expect((await seeded).status()).toBe(201);

    await page.getByRole('button', { name: /^Review/ }).click();
    const seedRecord = page.locator('.comments-rail__comment', { hasText: seedBody });
    await expect(seedRecord).toHaveCount(1);
    const seedId = await seedRecord.getAttribute('data-comment-id');
    expect(seedId).not.toBeNull();

    await otherTab.setViewportSize({ width: 1440, height: 900 });
    await openGeneratedReview(otherTab, url);
    await otherTab.getByRole('button', { name: /^Review/ }).click();
    const otherSeedRecord = otherTab.locator(`[data-comment-id="${seedId}"]`);
    await otherSeedRecord.getByRole('button', { name: 'Edit' }).click();
    const otherEdit = otherSeedRecord.getByLabel('Comment');
    await otherEdit.fill(attemptedEdit);
    await otherTab.getByRole('button', { name: 'Write summary' }).click();
    const otherSummary = otherTab.getByLabel('Review summary (Markdown)');
    await otherSummary.fill(attemptedSummary);

    await page.getByRole('button', { name: 'Write summary' }).click();
    const canonicalSummary = page.getByLabel('Review summary (Markdown)');
    await canonicalSummary.fill(firstCanonicalSummary);
    const accepted = page.waitForResponse((response) => response.url().includes('/api/draft/mutations'));
    await page.getByRole('button', { name: 'Save summary' }).click();
    expect((await accepted).status()).toBe(200);

    const draftsDirectory = join(fixture.root, '.diff-review', 'drafts');
    const draftFilename = readdirSync(draftsDirectory).find((candidate) => candidate.endsWith('.json'));
    expect(draftFilename).toBeDefined();
    const draftPath = join(draftsDirectory, draftFilename!);
    const acceptedBytes = readFileSync(draftPath);
    const acceptedHash = createHash('sha256').update(acceptedBytes).digest('hex');
    const acceptedRevision = JSON.parse(acceptedBytes.toString('utf8')).revision;
    const acceptedStat = statSync(draftPath);
    const acceptedEntries = readdirSync(draftsDirectory).sort();

    const conflict = otherTab.waitForResponse((response) => response.url().includes('/api/draft/mutations'));
    await otherTab.getByRole('button', { name: 'Save summary' }).click();
    const conflictResponse = await conflict;
    expect(conflictResponse.status()).toBe(409);
    await expect(otherTab.getByText('Conflict — unsaved text retained', { exact: true })).toBeVisible();
    expect(await conflictResponse.json()).toMatchObject({
      kind: 'revisionConflict',
      expectedRevision: acceptedRevision - 1,
      actualRevision: acceptedRevision,
      latest: { revision: acceptedRevision, summary: firstCanonicalSummary },
    });
    expect(readFileSync(draftPath)).toEqual(acceptedBytes);
    expect(createHash('sha256').update(readFileSync(draftPath)).digest('hex')).toBe(acceptedHash);
    expect(statSync(draftPath).mtimeMs).toBe(acceptedStat.mtimeMs);
    expect(readdirSync(draftsDirectory).sort()).toEqual(acceptedEntries);
    await expect(otherSummary).toHaveValue(attemptedSummary);
    await expect(otherEdit).toHaveValue(attemptedEdit);

    await otherTab.getByRole('button', { name: 'Reload latest' }).click();
    await expect(otherTab.getByText('Conflict — unsaved text retained', { exact: true })).toHaveCount(0);
    await expect(otherSummary).toHaveValue(attemptedSummary);
    await expect(otherEdit).toHaveValue(attemptedEdit);

    await seedRecord.getByRole('button', { name: 'Delete' }).click();
    await expect(seedRecord.getByText('Delete comment?')).toBeVisible();
    const deleted = page.waitForResponse((response) => response.url().includes('/api/draft/mutations'));
    await seedRecord.getByRole('button', { name: 'Delete comment' }).click();
    expect((await deleted).status()).toBe(200);
    const afterDeleteBytes = readFileSync(draftPath);
    const afterDeleteHash = createHash('sha256').update(afterDeleteBytes).digest('hex');
    const afterDeleteRevision = JSON.parse(afterDeleteBytes.toString('utf8')).revision;
    const deletedTargetConflict = otherTab.waitForResponse((response) => response.url().includes('/api/draft/mutations'));
    await otherSeedRecord.getByRole('button', { name: 'Save comment' }).click();
    expect((await deletedTargetConflict).status()).toBe(409);
    expect(readFileSync(draftPath)).toEqual(afterDeleteBytes);
    expect(createHash('sha256').update(readFileSync(draftPath)).digest('hex')).toBe(afterDeleteHash);
    await otherTab.getByRole('button', { name: 'Reload latest' }).click();
    await expect(otherTab.locator(`[data-comment-id="${seedId}"]`)).toHaveCount(0);

    const occupiedResult = await page.evaluate(async ({ token, expectedRevision }) => {
      const headers = { authorization: `Bearer ${token}` };
      const sessionResponse = await fetch('/api/session', { headers });
      const session = await sessionResponse.json() as { readonly files: readonly { readonly fileId: string; readonly newPath?: { readonly display: string } }[] };
      const file = session.files.find((candidate) => candidate.newPath?.display === 'src/changed.ts');
      if (file === undefined) throw new Error('changed fixture file is unavailable');
      const response = await fetch('/api/draft/mutations', {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'addComment',
          expectedRevision,
          fileId: file.fileId,
          side: 'head',
          line: 9,
          body: 'Tab A owns this anchor.',
        }),
      });
      return { status: response.status, body: await response.json() };
    }, { token: accessToken, expectedRevision: afterDeleteRevision });
    expect(occupiedResult).toMatchObject({
      status: 201,
      body: { kind: 'accepted', draft: { revision: afterDeleteRevision + 1 } },
    });
    const occupiedBytes = readFileSync(draftPath);
    const occupiedHash = createHash('sha256').update(occupiedBytes).digest('hex');
    const occupiedStat = statSync(draftPath);
    const occupiedEntries = readdirSync(draftsDirectory).sort();

    const staleAddResult = await otherTab.evaluate(async ({ token, expectedRevision }) => {
      const headers = { authorization: `Bearer ${token}` };
      const sessionResponse = await fetch('/api/session', { headers });
      const session = await sessionResponse.json() as { readonly files: readonly { readonly fileId: string; readonly newPath?: { readonly display: string } }[] };
      const file = session.files.find((candidate) => candidate.newPath?.display === 'src/changed.ts');
      if (file === undefined) throw new Error('changed fixture file is unavailable');
      const response = await fetch('/api/draft/mutations', {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'addComment',
          expectedRevision,
          fileId: file.fileId,
          side: 'head',
          line: 9,
          body: 'Add attempted by tab B.',
        }),
      });
      return { status: response.status, body: await response.json() };
    }, { token: accessToken, expectedRevision: afterDeleteRevision });
    expect(staleAddResult).toMatchObject({
      status: 409,
      body: {
        kind: 'revisionConflict',
        expectedRevision: afterDeleteRevision,
        actualRevision: afterDeleteRevision + 1,
      },
    });
    expect(readFileSync(draftPath)).toEqual(occupiedBytes);
    expect(createHash('sha256').update(readFileSync(draftPath)).digest('hex')).toBe(occupiedHash);
    expect(statSync(draftPath).mtimeMs).toBe(occupiedStat.mtimeMs);
    expect(readdirSync(draftsDirectory).sort()).toEqual(occupiedEntries);

    const freshAddResult = await otherTab.evaluate(async ({ token, expectedRevision }) => {
      const headers = { authorization: `Bearer ${token}` };
      const sessionResponse = await fetch('/api/session', { headers });
      const session = await sessionResponse.json() as { readonly files: readonly { readonly fileId: string; readonly newPath?: { readonly display: string } }[] };
      const file = session.files.find((candidate) => candidate.newPath?.display === 'src/changed.ts');
      if (file === undefined) throw new Error('changed fixture file is unavailable');
      const response = await fetch('/api/draft/mutations', {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'addComment',
          expectedRevision,
          fileId: file.fileId,
          side: 'head',
          line: 9,
          body: 'Add attempted by tab B.',
        }),
      });
      return { status: response.status, body: await response.json() };
    }, { token: accessToken, expectedRevision: afterDeleteRevision + 1 });
    expect(freshAddResult).toMatchObject({
      status: 404,
      body: { kind: 'invalidTarget' },
    });
    expect(readFileSync(draftPath)).toEqual(occupiedBytes);
    expect(JSON.parse(readFileSync(draftPath, 'utf8'))).toMatchObject({
      revision: afterDeleteRevision + 1,
      summary: firstCanonicalSummary,
      comments: [expect.objectContaining({ body: 'Tab A owns this anchor.' })],
    });
  } finally {
    if (running !== undefined) await stopGeneratedCli(running);
    await otherTab.close();
    await fixture.cleanup();
  }
});

async function createPersistedDraft(page: Page, fixture: GitFixture): Promise<string> {
  const running = startGeneratedCli(fixture);
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openGeneratedReview(page, await waitForLoopbackUrl(running));
    await page.getByRole('treeitem', { name: /changed\.ts/ }).click();
    await activateMonacoLine(page, 'head', 'export const changed = "head value";', 9);
    await page.locator('.monaco-anchor-zone--composer textarea').fill('Recovery seed comment.');
    const response = page.waitForResponse((candidate) => candidate.url().includes('/api/draft/mutations'));
    await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Add comment' }).click();
    expect((await response).status()).toBe(201);
  } finally {
    await stopGeneratedCli(running);
  }

  const directory = join(fixture.root, '.diff-review', 'drafts');
  const filename = readdirSync(directory).find((candidate) => candidate.endsWith('.json') && !candidate.includes('.bak'));
  expect(filename).toBeDefined();
  return join(directory, filename!);
}

test('corrupt draft recovery backs up exact bytes before starting a fresh packaged review', async ({ browser, page }, testInfo) => {
  assertChromium(browser, testInfo);
  const fixture = await createGitFixture({ anchoredReview: true });
  let running: RunningCli | undefined;

  try {
    const draftPath = await createPersistedDraft(page, fixture);
    const corrupted = Buffer.from('{ not a valid review draft', 'utf8');
    writeFileSync(draftPath, corrupted);

    running = startGeneratedCli(fixture);
    await page.goto(await waitForLoopbackUrl(running), { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Local review draft needs recovery' })).toBeVisible();
    await expect(page.getByText('Read only', { exact: true })).toBeVisible();
    await expect(page.locator('body')).not.toContainText(fixture.root);
    await page.getByRole('button', { name: 'Back up and start new' }).click();
    await page.getByRole('button', { name: 'Back up and start new' }).last().click();
    await expect(page.getByRole('heading', { name: 'New draft started' })).toBeVisible();

    const backup = readdirSync(join(fixture.root, '.diff-review', 'drafts'))
      .find((candidate) => candidate.endsWith('.bak'));
    expect(backup).toBeDefined();
    expect(readFileSync(join(fixture.root, '.diff-review', 'drafts', backup!))).toEqual(corrupted);
    expect(readFileSync(draftPath)).not.toEqual(corrupted);
  } finally {
    if (running !== undefined) await stopGeneratedCli(running);
    await fixture.cleanup();
  }
});

test('newer draft remains immutable while reveal keeps browser authority fixed and denies unauthenticated access', async ({ browser, page }, testInfo) => {
  assertChromium(browser, testInfo);
  const fixture = await createGitFixture({ anchoredReview: true });
  let running: RunningCli | undefined;

  try {
    const draftPath = await createPersistedDraft(page, fixture);
    const newer = {
      ...JSON.parse(readFileSync(draftPath, 'utf8')) as Record<string, unknown>,
      schemaVersion: 2,
    };
    writeFileSync(draftPath, JSON.stringify(newer));
    const original = readFileSync(draftPath);

    running = startGeneratedCli(fixture);
    const url = await waitForLoopbackUrl(running);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'This draft needs a newer Diff Review' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back up and start new' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /reset|downgrade|migrat/i })).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText(fixture.root);

    expect(await page.evaluate(async () => (await fetch('/api/draft/reveal')).status)).toBe(401);
    await page.getByRole('button', { name: 'Reveal draft file' }).click();
    await expect(page.locator('body')).not.toContainText(fixture.root);
    expect(readFileSync(draftPath)).toEqual(original);
  } finally {
    if (running !== undefined) await stopGeneratedCli(running);
    await fixture.cleanup();
  }
});

test('selector drift reports complete OIDs while the packaged comparison stays pinned', async ({ browser, page }, testInfo) => {
  assertChromium(browser, testInfo);
  const fixture = await createGitFixture({ anchoredReview: true });
  const pinnedHead = fixture.git(['rev-parse', fixture.headRef]).toString('utf8').trim();
  const running = startGeneratedCli(fixture);

  try {
    await openGeneratedReview(page, await waitForLoopbackUrl(running));
    await page.getByRole('treeitem', { name: /changed\.ts/ }).click();
    await expect(page.getByText('head value', { exact: false })).toBeVisible();
    fixture.git(['update-ref', fixture.headRef, fixture.futureHeadOid]);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(50);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    const notice = page.getByRole('heading', { name: 'Selected source changed — open review remains pinned' });
    await expect(notice).toBeVisible({ timeout: 10_000 });
    const drift = page.locator('.selector-drift-notice');
    await expect(drift).toContainText(pinnedHead);
    await expect(drift).toContainText(fixture.futureHeadOid);
    await expect(page.getByText('head value', { exact: false })).toBeVisible();
  } finally {
    await stopGeneratedCli(running);
    await fixture.cleanup();
  }
});
