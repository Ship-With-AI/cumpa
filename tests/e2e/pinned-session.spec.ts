import { execFileSync, spawn } from 'node:child_process';
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

import {
  createGitFixture,
  type GitFixture,
} from '../helpers/git-fixture.js';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const packedRoot = mkdtempSync(join(tmpdir(), 'diff-review-session-pack-'));
const extractedPackageRoot = join(packedRoot, 'package');
const fakeBinRoot = join(packedRoot, 'fake-bin');
const executablePath = join(
  extractedPackageRoot,
  'dist/bin/diff-review.mjs',
);

interface PackResult {
  filename: string;
}

interface RunningCli {
  readonly child: ChildProcess;
  readonly outputPath: string;
  readonly openerLogPath: string;
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
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `[prerequisite] ${command} ${arguments_.join(' ')} failed before the packaged lifecycle assertion: ${detail}`,
    );
  }
}

function independentlyResolve(
  repository: GitFixture,
  arguments_: readonly string[],
): string {
  return repository.git(arguments_).toString('ascii').trim();
}

async function waitForText(
  path: string,
  predicate: (content: string) => boolean,
): Promise<string> {
  const { promise, resolve: resolveWait, reject } =
    Promise.withResolvers<string>();
  const deadline = Date.now() + 10_000;
  const interval = setInterval(() => {
    const content = existsSync(path) ? readFileSync(path, 'utf8') : '';
    if (predicate(content)) {
      clearInterval(interval);
      resolveWait(content);
      return;
    }
    if (Date.now() >= deadline) {
      clearInterval(interval);
      reject(new Error(`[behavioral] timed out waiting for CLI output:\n${content}`));
    }
  }, 25);
  return await promise;
}

async function waitForExit(child: ChildProcess): Promise<{
  code: number | null;
  signal: NodeJS.Signals | null;
}> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return { code: child.exitCode, signal: child.signalCode };
  }
  const { promise, resolve: resolveExit, reject } = Promise.withResolvers<{
    code: number | null;
    signal: NodeJS.Signals | null;
  }>();
  child.once('error', reject);
  child.once('exit', (code, signal) => resolveExit({ code, signal }));
  return await promise;
}

function assertChromiumPrerequisite(browser: Browser, testInfo: TestInfo): void {
  if (
    testInfo.project.name !== 'chromium' ||
    browser.browserType().name() !== 'chromium'
  ) {
    throw new Error(
      `[prerequisite] exact Chromium project required, received ${testInfo.project.name}/${browser.browserType().name()}`,
    );
  }
}

function startGeneratedCli(repository: GitFixture): RunningCli {
  const outputPath = join(packedRoot, `terminal-${crypto.randomUUID()}.log`);
  const openerLogPath = join(packedRoot, `opener-${crypto.randomUUID()}.log`);
  const outputDescriptor = openSync(outputPath, 'w');
  const child = spawn(process.execPath, [executablePath], {
    cwd: repository.nestedCwd,
    env: {
      ...process.env,
      PATH: `${fakeBinRoot}:${process.env.PATH ?? ''}`,
      DIFF_REVIEW_LAUNCH_OPTIONS: JSON.stringify({
        cwd: repository.nestedCwd,
        base: { label: 'Base fixture', revision: repository.baseRef },
        head: { label: 'Head fixture', revision: repository.headRef },
      }),
      DIFF_REVIEW_OPENER_LOG: openerLogPath,
      DIFF_REVIEW_TERMINAL_CAPTURE: outputPath,
    },
    stdio: ['ignore', outputDescriptor, outputDescriptor],
  });
  return { child, outputPath, openerLogPath, outputDescriptor };
}

async function stopGeneratedCli(running: RunningCli): Promise<{
  code: number | null;
  signal: NodeJS.Signals | null;
}> {
  if (running.child.exitCode === null && running.child.signalCode === null) {
    running.child.kill('SIGINT');
  }
  const result = await waitForExit(running.child);
  closeSync(running.outputDescriptor);
  return result;
}

async function waitForLoopbackUrl(running: RunningCli): Promise<string> {
  const output = await waitForText(
    running.outputPath,
    (content) =>
      /http:\/\/127\.0\.0\.1:\d+\/#token=[A-Za-z0-9_-]{43,}/.test(content) ||
      running.child.exitCode !== null ||
      running.child.signalCode !== null,
  );
  const match = output.match(
    /http:\/\/127\.0\.0\.1:\d+\/#token=[A-Za-z0-9_-]{43,}/,
  );
  expect(
    match?.[0],
    `[behavioral] generated CLI exited before publishing an ephemeral loopback URL. Output:\n${output}`,
  ).toBeDefined();
  return match![0];
}

async function proveLoadingTransition(page: Page, url: string): Promise<void> {
  const gate = Promise.withResolvers<void>();
  await page.route('**/api/session', async (route) => {
    await gate.promise;
    await route.continue();
  });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('status')).toHaveText('Loading pinned comparison…');
  gate.resolve();
}

test.beforeAll(() => {
  runPrerequisite(npmCommand, ['run', 'build']);
  const packOutput = runPrerequisite(npmCommand, [
    'pack',
    '--json',
    '--ignore-scripts',
    '--pack-destination',
    packedRoot,
  ]);
  const [packResult] = JSON.parse(packOutput) as PackResult[];
  runPrerequisite('tar', [
    '-xzf',
    join(packedRoot, packResult.filename),
    '-C',
    packedRoot,
  ]);
  symlinkSync(
    join(repositoryRoot, 'node_modules'),
    join(extractedPackageRoot, 'node_modules'),
    'dir',
  );

  writeFileSync(
    join(packedRoot, 'fake-open.mjs'),
    `#!/usr/bin/env node
import { appendFileSync, readFileSync } from 'node:fs';
const terminal = readFileSync(process.env.DIFF_REVIEW_TERMINAL_CAPTURE, 'utf8');
appendFileSync(process.env.DIFF_REVIEW_OPENER_LOG, JSON.stringify({ arguments: process.argv.slice(2), terminal }) + '\\n');
process.exitCode = 1;
`,
    'utf8',
  );
  mkdirSync(fakeBinRoot, { recursive: true });
  copyFileSync(join(packedRoot, 'fake-open.mjs'), join(fakeBinRoot, 'open'));
  chmodSync(join(fakeBinRoot, 'open'), 0o755);
});

test.afterAll(() => {
  rmSync(packedRoot, { force: true, recursive: true });
});

test('generated CLI opens immutable pinned session', async ({ browser, page }, testInfo) => {
  assertChromiumPrerequisite(browser, testInfo);
  const repository = await createGitFixture();
  const running = startGeneratedCli(repository);
  try {
    const expectedBase = independentlyResolve(repository, [
      'rev-parse',
      '--verify',
      repository.baseRef,
    ]);
    const expectedHead = independentlyResolve(repository, [
      'rev-parse',
      '--verify',
      repository.headRef,
    ]);
    const expectedMergeBase = independentlyResolve(repository, [
      'merge-base',
      '--all',
      expectedBase,
      expectedHead,
    ]);
    const url = await waitForLoopbackUrl(running);
    const parsedUrl = new URL(url);

    expect(parsedUrl.hostname).toBe('127.0.0.1');
    expect(Number(parsedUrl.port)).toBeGreaterThan(0);
    expect(parsedUrl.hash).toMatch(/^#token=[A-Za-z0-9_-]{43,}$/);

    const openerEvidence = await waitForText(
      running.openerLogPath,
      (content) => content.length > 0,
    );
    const [openerInvocation] = openerEvidence
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as { arguments: string[]; terminal: string });
    expect(openerInvocation.arguments).toContain(url);
    expect(openerInvocation.terminal).toContain(`${url}\n`);
    expect(openerInvocation.terminal).toContain(
      'Open the URL above if the browser did not open. Press Ctrl+C to stop.',
    );

    await proveLoadingTransition(page, url);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      `Diff Review: Base fixture · ${expectedBase.slice(0, 7)} → Head fixture · ${expectedHead.slice(0, 7)}`,
    );
    await expect(page.getByText('Pinned to displayed commits')).toBeVisible();
    await expect(page.getByText(expectedBase, { exact: true })).toBeVisible();
    await expect(page.getByText(expectedHead, { exact: true })).toBeVisible();
    await expect(page.getByText(expectedMergeBase, { exact: true })).toBeVisible();
  } finally {
    await stopGeneratedCli(running);
    await repository.cleanup();
  }
});

test('interrupt closes loopback session once', async ({ browser }, testInfo) => {
  assertChromiumPrerequisite(browser, testInfo);

  // Dynamic loading is intentional only for RED: both named tests must run before this planned module exists.
  const { createShutdownController } = await import(
    '../../src/server/lifecycle.js'
  );
  const signals = new EventEmitter();
  let abortCount = 0;
  let closeCount = 0;
  const exitStatuses: number[] = [];
  const controller = createShutdownController({
    signalSource: signals,
    abortActiveWork: () => {
      abortCount += 1;
    },
    closeListener: async () => {
      closeCount += 1;
    },
    setExitStatus: (status) => {
      exitStatuses.push(status);
    },
  });

  signals.emit('SIGINT');
  signals.emit('SIGTERM');
  await controller.shutdown(1);

  expect(abortCount).toBe(1);
  expect(closeCount).toBe(1);
  expect(exitStatuses).toEqual([130]);
  expect(signals.listenerCount('SIGINT')).toBe(0);
  expect(signals.listenerCount('SIGTERM')).toBe(0);

  const repository = await createGitFixture();
  const running = startGeneratedCli(repository);
  try {
    await waitForLoopbackUrl(running);
    running.child.kill('SIGINT');
    const exit = await waitForExit(running.child);
    closeSync(running.outputDescriptor);
    expect(exit).toEqual({ code: 130, signal: null });
  } finally {
    if (running.child.exitCode === null && running.child.signalCode === null) {
      await stopGeneratedCli(running);
    }
    await repository.cleanup();
  }
});
