import { spawn, execFileSync } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import {
  closeSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
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
        base: { label: 'main', revision: repository.baseRef },
        head: { label: head.slice('refs/heads/'.length), revision: head },
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
