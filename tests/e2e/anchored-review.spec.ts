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
  chmodSync(join(fakeBinRoot, 'open'), 0o755);
});

test.afterAll(() => {
  rmSync(packedRoot, { force: true, recursive: true });
});

test('packaged anchored review persists exact real-Git comments across relaunch', async ({ browser, page }, testInfo) => {
  assertChromium(browser, testInfo);
  const fixture = await createGitFixture({ anchoredReview: true });
  const featureOid = fixture.git(['rev-parse', fixture.headRef]).toString('ascii').trim();
  const baseOid = fixture.git(['rev-parse', fixture.baseRef]).toString('ascii').trim();
  const baseRenamedText = fixture.git(['show', `${baseOid}:src/old-name.ts`]).toString('utf8');
  const headRenamedText = fixture.git(['show', `${featureOid}:src/new-name.ts`]).toString('utf8');
  expect(baseRenamedText).toContain('base path');
  expect(headRenamedText).toContain('new path');
  expect(featureOid).not.toBe(baseOid);

  const draftsPath = join(fixture.root, '.diff-review', 'drafts');
  mkdirSync(draftsPath, { recursive: true });
  chmodSync(draftsPath, 0o555);
  const initial = startGeneratedCli(fixture);
  try {
    await openGeneratedReview(page, await waitForLoopbackUrl(initial));
    await page.getByRole('treeitem', { name: /new-name\.ts/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: /new-name\.ts/ })).toBeVisible();
    await page.getByRole('button', { name: 'Add comment to head line 1' }).click();
    const textarea = page.locator('.diff-workspace > section.inline-comment-composer textarea');
    await textarea.fill('Packaged comment on renamed head line.');
    await page.getByRole('button', { name: 'Add comment', exact: true }).click();
    await expect(
      page.locator('.inline-comment-composer [role="alert"]').first(),
    ).toContainText('Comment wasn’t added. Your text is still here.');
    await expect(textarea).toHaveValue('Packaged comment on renamed head line.');

    chmodSync(draftsPath, 0o755);
    const addResponse = page.waitForResponse((response) =>
      response.url().includes('/api/draft/comments'),
    );
    await page.getByRole('button', { name: 'Add comment', exact: true }).click();
    expect((await addResponse).status()).toBe(201);
    await expect(page.getByText('Packaged comment on renamed head line.')).toHaveCount(2);

    await page.getByRole('treeitem', { name: /changed\.ts/ }).click();
    await page.getByRole('button', { name: 'Add comment to base line 1' }).click();
    const baseTextarea = page.locator('.diff-workspace > section.inline-comment-composer textarea');
    await baseTextarea.fill('Packaged comment on unchanged base line.');
    await page.getByRole('button', { name: 'Add comment', exact: true }).click();
    await expect(page.getByText('Packaged comment on unchanged base line.')).toHaveCount(2);
    await page.setViewportSize({ width: 640, height: 700 });
    await page.getByRole('button', { name: 'Next change' }).click();
    await expect(page.getByText('Unchanged regions begin collapsed.')).toBeVisible();
  } finally {
    await stopGeneratedCli(initial);
  }

  const [draftFile] = readdirSync(draftsPath).filter((file) => file.endsWith('.json'));
  expect(draftFile).toBeDefined();
  const draftPath = join(draftsPath, draftFile!);
  const draft = JSON.parse(readFileSync(draftPath, 'utf8')) as {
    revision: number;
    comments: Array<{ id: string; anchor: { line: number; selectedText: string; context: { target: { text: string } } } }>;
  };
  expect(draft.comments).toHaveLength(2);
  const stale = JSON.parse(JSON.stringify(draft.comments[0])) as (typeof draft.comments)[number];
  stale.id = `comment_${crypto.randomUUID()}`;
  stale.anchor.selectedText = 'deliberately stale';
  stale.anchor.context.target.text = 'deliberately stale';
  const orphan = JSON.parse(JSON.stringify(draft.comments[1])) as (typeof draft.comments)[number];
  orphan.id = `comment_${crypto.randomUUID()}`;
  orphan.anchor.line = 999;
  draft.comments.push(stale, orphan);
  draft.revision = 4;
  writeFileSync(draftPath, `${JSON.stringify(draft)}\n`);

  const resumed = startGeneratedCli(fixture);
  try {
    await openGeneratedReview(page, await waitForLoopbackUrl(resumed));
    await expect(page.getByText('Packaged comment on renamed head line.')).toHaveCount(2);
    await expect(page.getByText('Packaged comment on unchanged base line.')).toHaveCount(2);
    await expect(page.getByText('Stale anchor')).toBeVisible();
    await expect(page.getByText('Anchor unavailable')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add comment to head line 1' })).toBeVisible();
  } finally {
    await stopGeneratedCli(resumed);
  }

  const alternateHead = fixture.alternateHeadRef;
  expect(alternateHead).toBeDefined();
  const alternate = startGeneratedCli(fixture, alternateHead!);
  try {
    await openGeneratedReview(page, await waitForLoopbackUrl(alternate));
    await expect(page.getByText('Packaged comment on renamed head line.')).not.toBeVisible();
  } finally {
    await stopGeneratedCli(alternate);
    chmodSync(draftsPath, 0o755);
    await fixture.cleanup();
  }
});
