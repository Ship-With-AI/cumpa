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
import { createShutdownController } from '../../src/server/lifecycle.js';
import type { ComparisonSelection } from '../../src/contracts/comparison.js';
import type {
  FileMetadataResponse,
  SessionFile,
  SessionResponse,
} from '../../src/contracts/api.js';


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

interface GeneratedCliSelections {
  readonly base: ComparisonSelection;
  readonly head: ComparisonSelection;
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

function startGeneratedCli(
  repository: GitFixture,
  selections: GeneratedCliSelections = {
    base: { label: 'Base fixture', revision: repository.baseRef },
    head: { label: 'Head fixture', revision: repository.headRef },
  },
): RunningCli {
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
        ...selections,
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
    await page
      .getByRole('button', { name: 'Comparison identities' })
      .click();
    await expect(
      page.locator('.identity-row').nth(0).getByText(expectedBase, { exact: true }),
    ).toBeVisible();
    await expect(
      page.locator('.identity-row').nth(1).getByText(expectedHead, { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .locator('.identity-row')
        .nth(2)
        .getByText(expectedMergeBase, { exact: true }),
    ).toBeVisible();
  } finally {
    await stopGeneratedCli(running);
    await repository.cleanup();
  }
});

test('identity session and empty states', async ({ browser, context, page }, testInfo) => {
  assertChromiumPrerequisite(browser, testInfo);
  const repository = await createGitFixture();
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
  const running = startGeneratedCli(repository);

  try {
    const url = await waitForLoopbackUrl(running);
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: new URL(url).origin,
    });
    await proveLoadingTransition(page, url);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      `Diff Review: Base fixture · ${expectedBase.slice(0, 7)} → Head fixture · ${expectedHead.slice(0, 7)}`,
    );
    await expect(page.getByText('Pinned to displayed commits')).toBeVisible();

    const disclosure = page.getByRole('button', {
      name: 'Comparison identities',
    });
    await expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    await disclosure.click();
    await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    const panel = page.getByRole('region', { name: 'Comparison identities' });
    await expect(panel).toBeVisible();

    const identityRows = panel.locator('.identity-row');
    await expect(identityRows).toHaveCount(3);
    await expect(identityRows.nth(0).locator('dt')).toHaveText('Base');
    await expect(identityRows.nth(1).locator('dt')).toHaveText('Head');
    await expect(identityRows.nth(2).locator('dt')).toHaveText('Merge base');
    await expect(identityRows.nth(0).getByText('Base fixture', { exact: true })).toBeVisible();
    await expect(identityRows.nth(1).getByText('Head fixture', { exact: true })).toBeVisible();
    await expect(identityRows.nth(0).getByText(expectedBase, { exact: true })).toBeVisible();
    await expect(identityRows.nth(1).getByText(expectedHead, { exact: true })).toBeVisible();
    await expect(identityRows.nth(2).getByText(expectedMergeBase, { exact: true })).toBeVisible();
    await expect(
      panel.getByText(
        'This session is pinned to these commits and does not follow moving refs.',
        { exact: true },
      ),
    ).toBeVisible();

    const copyCases = [
      ['Copy full base commit', expectedBase],
      ['Copy full head commit', expectedHead],
      ['Copy full merge-base commit', expectedMergeBase],
    ] as const;
    for (const [name, expectedValue] of copyCases) {
      const button = panel.getByRole('button', { name });
      await button.click();
      await expect(button.locator('..').getByRole('status')).toHaveText('Copied');
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(
        expectedValue,
      );
    }

    const baseCopy = panel.getByRole('button', {
      name: 'Copy full base commit',
    });
    await baseCopy.click();
    await expect(baseCopy.locator('..').getByRole('status')).toHaveText('Copied');
    await page.waitForTimeout(2_100);
    await expect(baseCopy.locator('..').getByRole('status')).toBeEmpty();

    await page.evaluate(() => {
      Object.defineProperty(navigator.clipboard, 'writeText', {
        configurable: true,
        value: async () => {
          throw new DOMException('Clipboard denied', 'NotAllowedError');
        },
      });
    });
    const failedCopy = panel.getByRole('button', {
      name: 'Copy full head commit',
    });
    await failedCopy.click();
    await expect(failedCopy.locator('..').getByRole('alert')).toHaveText(
      'Copy failed. The full value remains available to select.',
    );
    await expect(identityRows.nth(1).getByText(expectedHead, { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(disclosure).toBeFocused();

    const securityPage = await context.newPage();
    await securityPage.route('**/api/session', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'request-unavailable',
          message: `denied ${repository.root} ${new URL(url).hash}`,
        }),
      });
    });
    await securityPage.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(securityPage.getByRole('heading', { level: 1 })).toHaveText(
      'Diff Review: pinned session unavailable',
    );
    await expect(securityPage.getByRole('heading', { level: 2 })).toHaveText(
      'Pinned session unavailable',
    );
    await expect(securityPage.getByRole('alert')).toHaveText(
      'This request is not available in the current session. Relaunch Diff Review from the terminal.',
    );
    await expect(securityPage.locator('body')).not.toContainText(repository.root);
    await expect(securityPage.locator('body')).not.toContainText(new URL(url).hash);
    await expect(securityPage.getByRole('button', { name: /retry/i })).toHaveCount(0);
    await expect(securityPage.getByRole('navigation', { name: 'Changed files' })).toHaveCount(0);

    const errorPage = await context.newPage();
    await errorPage.route('**/api/session', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'session-unavailable',
          message: `diagnostic ${repository.root}`,
        }),
      });
    });
    await errorPage.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(errorPage.getByRole('heading', { level: 1 })).toHaveText(
      'Diff Review: pinned session unavailable',
    );
    await expect(errorPage.getByRole('alert')).toHaveText(
      'This pinned session is unavailable. Return to the terminal and launch Diff Review again. Diagnostic details are shown in the terminal.',
    );
    await expect(errorPage.locator('body')).not.toContainText(repository.root);
    await expect(errorPage.getByRole('button', { name: /retry/i })).toHaveCount(0);
    await expect(errorPage.getByRole('navigation', { name: 'Changed files' })).toHaveCount(0);

    const stoppedPage = await context.newPage();
    await stoppedPage.route('**/api/session', async (route) => {
      await route.abort('connectionrefused');
    });
    await stoppedPage.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(stoppedPage.getByRole('heading', { level: 1 })).toHaveText(
      'Diff Review: pinned session unavailable',
    );
    await expect(stoppedPage.getByRole('alert')).toHaveText(
      'This pinned session has stopped. Relaunch Diff Review from the terminal to continue.',
    );
    await expect(stoppedPage.getByRole('button', { name: /retry/i })).toHaveCount(0);
    await expect(stoppedPage.getByRole('navigation', { name: 'Changed files' })).toHaveCount(0);
  } finally {
    await stopGeneratedCli(running);
    await repository.cleanup();
  }

  const dirtyRepository = await createGitFixture();
  await dirtyRepository.write('dirty-untracked.txt', 'ignored worktree bytes\n');
  const dirtyRunning = startGeneratedCli(dirtyRepository, {
    base: {
      label: 'Base fixture',
      revision: dirtyRepository.baseRef,
      source: {
        kind: 'branch',
        id: 'branch:base-fixture',
        refName: dirtyRepository.baseRef,
      },
    },
    head: {
      label: 'Head\nworktree',
      revision: dirtyRepository.headRef,
      source: {
        kind: 'worktree',
        id: 'worktree:head-fixture',
        path: dirtyRepository.root,
        detached: false,
        dirty: true,
      },
    },
  });
  const dirtyPage = await context.newPage();
  try {
    const dirtyUrl = await waitForLoopbackUrl(dirtyRunning);
    await dirtyPage.goto(dirtyUrl, { waitUntil: 'domcontentloaded' });
    await expect(dirtyPage.getByRole('heading', { level: 1 })).toContainText(
      'Head\\nworktree',
    );
    const dirtyBadge = dirtyPage.getByText('Dirty bytes ignored', {
      exact: true,
    });
    await expect(dirtyBadge).toBeVisible();
    await expect(
      dirtyBadge.locator('..').getByText(
        'Committed HEAD reviewed; staged, unstaged, and untracked bytes ignored.',
        { exact: true },
      ),
    ).toBeAttached();
    await dirtyPage
      .getByRole('button', { name: 'Comparison identities' })
      .click();
    const dirtyPanel = dirtyPage.getByRole('region', {
      name: 'Comparison identities',
    });
    const dirtyHead = dirtyPanel.locator('.identity-row').nth(1);
    await expect(
      dirtyHead.getByText(dirtyRepository.root, { exact: true }),
    ).toBeVisible();
    await expect(
      dirtyHead.getByText(
        "The worktree's committed HEAD will be reviewed. Staged, unstaged, and untracked bytes are ignored.",
        { exact: true },
      ),
    ).toBeVisible();
  } finally {
    await stopGeneratedCli(dirtyRunning);
    await dirtyRepository.cleanup();
  }

  const emptyRepository = await createGitFixture({ committedHeadChange: false });
  const emptyRunning = startGeneratedCli(emptyRepository);
  const emptyPage = await context.newPage();
  try {
    const emptyUrl = await waitForLoopbackUrl(emptyRunning);
    await emptyPage.goto(emptyUrl, { waitUntil: 'domcontentloaded' });
    await expect(emptyPage.getByRole('heading', { level: 1 })).toHaveText(
      /Diff Review: Base fixture · [0-9a-f]{7} → Head fixture · [0-9a-f]{7}/,
    );
    await expect(emptyPage.getByRole('heading', { level: 2 })).toHaveText(
      'No changes in this pinned comparison',
    );
    await expect(emptyPage.getByText('0 changed files', { exact: true })).toBeVisible();
    await expect(
      emptyPage.getByText(
        'The merge base and head resolve to identical trees. Open Comparison identities to review the pinned commits, then press Ctrl+C in the terminal when you are finished.',
        { exact: true },
      ),
    ).toBeVisible();
    await expect(emptyPage.getByRole('alert')).toHaveCount(0);
    await expect(emptyPage.getByText('Loading pinned comparison…')).toHaveCount(0);
    await expect(
      emptyPage.getByRole('button', { name: 'Comparison identities' }),
    ).toBeVisible();
  } finally {
    await stopGeneratedCli(emptyRunning);
    await emptyRepository.cleanup();
  }
});

test('metadata and availability states', async ({ browser, context, page }, testInfo) => {
  assertChromiumPrerequisite(browser, testInfo);
  const repository = await createGitFixture();
  const running = startGeneratedCli(repository);
  const opaqueFileId = (index: number): string =>
    `file_${String(index).padStart(43, '0')}`;
  const exactPath = (utf8: string, display = utf8) => ({
    bytesBase64url: Buffer.from(utf8).toString('base64url'),
    display,
    utf8,
  });
  const ids = {
    supported: opaqueFileId(1),
    binary: opaqueFileId(2),
    nonUtf8: opaqueFileId(3),
    oversized: opaqueFileId(4),
    submodule: opaqueFileId(5),
    symlink: opaqueFileId(6),
    modeOrType: opaqueFileId(7),
    missingObject: opaqueFileId(8),
  } as const;
  const oldPath = exactPath('src/old\tname.ts', 'src/old\\tname.ts');
  const newPath = exactPath('src/new\nname.ts', 'src/new\\nname.ts');
  const nonUtf8Path = {
    bytesBase64url: 'Zml4dHVyZXMv_w',
    display: 'fixtures/\\xFF',
  };
  const files = [
    {
      fileId: ids.supported,
      status: { kind: 'renamed', similarity: 91 },
      oldPath,
      newPath,
      additions: 12,
      deletions: 4,
      availability: { kind: 'text' },
    },
    {
      fileId: ids.binary,
      status: { kind: 'modified' },
      newPath: exactPath('assets/image.dat'),
      additions: null,
      deletions: null,
      availability: { kind: 'unsupported', reason: 'binary' },
    },
    {
      fileId: ids.nonUtf8,
      status: { kind: 'modified' },
      newPath: nonUtf8Path,
      additions: null,
      deletions: null,
      availability: { kind: 'unsupported', reason: 'non-utf8' },
    },
    {
      fileId: ids.oversized,
      status: { kind: 'added' },
      newPath: exactPath('generated/oversized.txt'),
      additions: null,
      deletions: null,
      availability: { kind: 'unsupported', reason: 'oversized' },
    },
    {
      fileId: ids.submodule,
      status: { kind: 'modified' },
      newPath: exactPath('vendor/module'),
      additions: null,
      deletions: null,
      availability: { kind: 'unsupported', reason: 'submodule' },
    },
    {
      fileId: ids.symlink,
      status: { kind: 'type-changed' },
      newPath: exactPath('links/current'),
      additions: null,
      deletions: null,
      availability: { kind: 'unsupported', reason: 'symlink' },
    },
    {
      fileId: ids.modeOrType,
      status: { kind: 'type-changed' },
      newPath: exactPath('special/device'),
      additions: null,
      deletions: null,
      availability: { kind: 'unsupported', reason: 'mode-or-type' },
    },
    {
      fileId: ids.missingObject,
      status: { kind: 'deleted' },
      oldPath: exactPath('removed/missing.txt'),
      additions: null,
      deletions: null,
      availability: { kind: 'unavailable', reason: 'missing-object' },
    },
  ] as const satisfies readonly SessionFile[];
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
  const session = {
    base: { label: 'Base fixture', oid: expectedBase },
    head: { label: 'Head fixture', oid: expectedHead },
    mergeBaseOid: expectedMergeBase,
    files,
  } as const satisfies SessionResponse;
  const modes: Record<keyof typeof ids, readonly [string, string]> = {
    supported: ['100644', '100755'],
    binary: ['100644', '100644'],
    nonUtf8: ['100644', '100644'],
    oversized: ['000000', '100644'],
    submodule: ['160000', '160000'],
    symlink: ['100644', '120000'],
    modeOrType: ['100644', '100755'],
    missingObject: ['100644', '000000'],
  };
  const metadata = Object.fromEntries(
    (Object.keys(ids) as (keyof typeof ids)[]).map((key, index) => [
      ids[key],
      {
        ...files[index],
        oldMode: modes[key][0],
        newMode: modes[key][1],
      } satisfies FileMetadataResponse,
    ]),
  ) as Record<string, FileMetadataResponse>;
  const requestEvidence: Array<{
    method: string;
    postData: string | null;
    url: string;
  }> = [];
  const requestCounts = new Map<string, number>();
  const staleGate = Promise.withResolvers<void>();
  const sessionGate = Promise.withResolvers<void>();

  await page.route('**/api/session', async (route) => {
    await sessionGate.promise;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(session),
    });
  });
  await page.route('**/api/files/**', async (route) => {
    const request = route.request();
    const requestUrl = new URL(request.url());
    const fileId = decodeURIComponent(requestUrl.pathname.split('/').at(-1) ?? '');
    requestEvidence.push({
      method: request.method(),
      postData: request.postData(),
      url: request.url(),
    });
    const count = (requestCounts.get(fileId) ?? 0) + 1;
    requestCounts.set(fileId, count);

    if (fileId === ids.oversized && count === 1) {
      await staleGate.promise;
    }
    if (
      (fileId === ids.missingObject && count === 1) ||
      (fileId === ids.modeOrType && count <= 2)
    ) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'session-unavailable',
          message: `must not leak ${repository.root} refs/heads/main`,
        }),
      });
      return;
    }

    const response = metadata[fileId];
    expect(response, `[behavioral] unexpected file capability ${fileId}`).toBeDefined();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });

  try {
    const url = await waitForLoopbackUrl(running);
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: new URL(url).origin,
    });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('status')).toHaveText('Loading pinned comparison…');
    sessionGate.resolve();

    const details = page.getByRole('main', { name: 'File details' });
    await expect(details.getByRole('heading', { level: 2 })).toHaveText(
      'File details — src/new\\nname.ts',
    );
    await expect(details.getByText('Renamed (91% similarity)', { exact: true })).toBeVisible();
    await expect(details.getByText('Text', { exact: true })).toBeVisible();
    await expect(
      details.getByText(
        'Text file — content preview is not available in this version.',
        { exact: true },
      ),
    ).toBeVisible();
    await expect(details.getByRole('heading', { name: 'Paths' })).toBeVisible();
    await expect(details.getByText('src/old\\tname.ts', { exact: true })).toBeVisible();
    await expect(details.getByText('src/new\\nname.ts', { exact: true })).toBeVisible();
    await expect(details.getByText('12', { exact: true })).toBeVisible();
    await expect(details.getByText('4', { exact: true })).toBeVisible();
    await expect(details.getByText('100644', { exact: true })).toBeVisible();
    await expect(details.getByText('100755', { exact: true })).toBeVisible();

    const oldCopy = details.getByRole('button', { name: 'Copy exact old path' });
    await oldCopy.focus();
    await expect(oldCopy).toBeFocused();
    await oldCopy.click();
    await expect(oldCopy).toBeFocused();
    await expect(oldCopy.locator('..').getByRole('status')).toHaveText('Copied');
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe('src/old\tname.ts');
    const newCopy = details.getByRole('button', { name: 'Copy exact new path' });
    await newCopy.click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe('src/new\nname.ts');

    const selectFile = async (fileId: string): Promise<void> => {
      const row = page.locator(`[role="treeitem"][data-file-id="${fileId}"]`);
      await row.click();
      await expect(row).toHaveAttribute('aria-selected', 'true');
    };

    await selectFile(ids.oversized);
    await expect(details.getByRole('heading', { level: 2 })).toHaveText(
      'File details — generated/oversized.txt',
    );
    await selectFile(ids.binary);
    await expect(details.getByText('unsupported: binary', { exact: true })).toBeVisible();
    staleGate.resolve();
    await expect(details.getByRole('heading', { level: 2 })).toHaveText(
      'File details — assets/image.dat',
    );
    await expect(details.getByText('unsupported: binary', { exact: true })).toBeVisible();

    const reasonMatrix = [
      {
        fileId: ids.binary,
        reason: 'unsupported: binary',
        explanation:
          'Git classifies this file as binary. Its metadata remains inspectable, but inline content is unavailable. No in-browser recovery is available in this version.',
      },
      {
        fileId: ids.nonUtf8,
        reason: 'unsupported: non-utf8',
        explanation:
          'This file is not valid UTF-8 text. Its metadata remains inspectable, but inline content is unavailable. No in-browser recovery is available in this version.',
      },
      {
        fileId: ids.oversized,
        reason: 'unsupported: oversized',
        explanation:
          'This file exceeds the inline-content size limit. Its metadata remains inspectable, but inline content is unavailable. No in-browser recovery is available in this version.',
      },
      {
        fileId: ids.submodule,
        reason: 'unsupported: submodule',
        explanation:
          'This entry records a submodule commit, not a regular text file. Its metadata remains inspectable, but inline content is unavailable. Open the submodule with Git outside this session if you need to inspect it.',
      },
      {
        fileId: ids.symlink,
        reason: 'unsupported: symlink',
        explanation:
          'This entry records a symbolic link, not a regular text file. Its metadata remains inspectable, but inline content is unavailable. Inspect the committed link target with Git outside this session if needed.',
      },
    ] as const;

    for (const expected of reasonMatrix) {
      await selectFile(expected.fileId);
      await expect(
        details.getByRole('heading', { name: 'File cannot be shown inline' }),
      ).toBeVisible();
      await expect(details.getByText(expected.reason, { exact: true })).toBeVisible();
      await expect(
        details.getByText(expected.explanation, { exact: true }),
      ).toBeVisible();
    }

    await selectFile(ids.nonUtf8);
    await expect(
      details.getByText('Exact path bytes (base64url)', { exact: true }),
    ).toBeVisible();
    await expect(details.getByText('Zml4dHVyZXMv_w', { exact: true })).toBeVisible();
    const bytesCopy = details.getByRole('button', {
      name: 'Copy exact path bytes',
    });
    await bytesCopy.click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe('Zml4dHVyZXMv_w');

    await selectFile(ids.missingObject);
    await expect(details.getByRole('heading', { level: 2 })).toHaveText(
      'File details — removed/missing.txt',
    );
    await expect(details.getByRole('alert')).toHaveText(
      'File details could not be loaded. Retry this file. If the problem continues, check the terminal diagnostic.',
    );
    await expect(details.getByText('Deleted', { exact: true })).toBeVisible();
    await expect(details.getByText('Unavailable', { exact: true })).toBeVisible();
    await expect(details.getByText('removed/missing.txt', { exact: true })).toBeVisible();
    await details.getByRole('button', { name: 'Retry file details' }).click();
    await expect(details.getByText('unavailable: missing-object', { exact: true })).toBeVisible();
    await expect(
      details.getByText(
        "The required object for this pinned file is missing or unreadable. Metadata already loaded remains inspectable, but inline content is unavailable. Diff Review will not fall back to a moving ref or worktree file. Repair the repository's object data with Git, then relaunch this comparison.",
        { exact: true },
      ),
    ).toBeVisible();

    await selectFile(ids.modeOrType);
    await expect(details.getByRole('alert')).toBeVisible();
    const retry = details.getByRole('button', { name: 'Retry file details' });
    await retry.click();
    await expect(details.getByRole('alert')).toBeVisible();
    await expect(retry).toBeVisible();
    await expect(details.getByRole('status', { name: /loading/i })).toHaveCount(0);
    await retry.click();
    await expect(details.getByText('unsupported: mode-or-type', { exact: true })).toBeVisible();
    await expect(
      details.getByText(
        "This entry's Git mode or object type is not supported as a regular text file. Its metadata remains inspectable, but inline content is unavailable. No in-browser recovery is available in this version.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(details.getByText('100644', { exact: true })).toBeVisible();
    await expect(details.getByText('100755', { exact: true })).toBeVisible();
    await expect(details.getByText('Line counts unavailable', { exact: true })).toBeVisible();

    await selectFile(ids.binary);
    const ordinaryCopy = details.getByRole('button', { name: 'Copy exact path' });
    await page.evaluate(() => {
      Object.defineProperty(navigator.clipboard, 'writeText', {
        configurable: true,
        value: async () => {
          throw new DOMException('Clipboard denied', 'NotAllowedError');
        },
      });
    });
    await ordinaryCopy.click();
    await expect(ordinaryCopy.locator('..').getByRole('alert')).toHaveText(
      'Could not copy. Select the value and copy it manually.',
    );
    await expect(details.getByText('assets/image.dat', { exact: true })).toBeVisible();

    await expect(page.locator('.monaco-editor, iframe, [aria-label*="editor" i]')).toHaveCount(0);
    await expect(page.locator('input, textarea, select')).toHaveCount(0);
    await expect(page.getByText(repository.root, { exact: false })).toHaveCount(0);
    for (const evidence of requestEvidence) {
      const requestUrl = new URL(evidence.url);
      expect(evidence.method).toBe('GET');
      expect(evidence.postData).toBeNull();
      expect(requestUrl.search).toBe('');
      expect(requestUrl.pathname).toMatch(
        /^\/api\/files\/file_[A-Za-z0-9_-]{43}$/,
      );
      expect(Object.values(ids)).toContain(
        decodeURIComponent(requestUrl.pathname.split('/').at(-1) ?? ''),
      );
    }
  } finally {
    sessionGate.resolve();
    staleGate.resolve();
    await stopGeneratedCli(running);
    await repository.cleanup();
  }
});

test('fragment token protects loopback API', async ({ browser, page, request }, testInfo) => {
  assertChromiumPrerequisite(browser, testInfo);
  const repository = await createGitFixture();
  const running = startGeneratedCli(repository);
  const browserMessages: string[] = [];
  page.on('console', (message) => browserMessages.push(message.text()));
  try {
    const launchUrl = await waitForLoopbackUrl(running);
    const parsedLaunchUrl = new URL(launchUrl);
    const token = parsedLaunchUrl.hash.slice('#token='.length);
    const origin = parsedLaunchUrl.origin;
    const apiRequestPromise = page.waitForRequest('**/api/session');
    const apiResponsePromise = page.waitForResponse('**/api/session');

    await page.goto(launchUrl, { waitUntil: 'domcontentloaded' });
    const apiRequest = await apiRequestPromise;
    const apiResponse = await apiResponsePromise;

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Diff Review: Base fixture',
    );
    expect(new URL(page.url()).hash).toBe('');
    expect(apiRequest.url()).not.toContain(token);
    expect(apiRequest.headers().authorization).toBe(`Bearer ${token}`);
    expect(apiResponse.status()).toBe(200);
    expect(apiResponse.headers()['cache-control']).toBe('no-store');
    expect(apiResponse.headers()['referrer-policy']).toBe('no-referrer');
    expect(apiResponse.headers()['x-content-type-options']).toBe('nosniff');
    expect(apiResponse.headers()['content-security-policy']).toContain(
      "frame-ancestors 'none'",
    );
    expect(apiResponse.headers()['access-control-allow-origin']).toBeUndefined();

    const missingToken = await request.get(`${origin}/api/session`);
    const wrongToken = await request.get(`${origin}/api/session`, {
      headers: { authorization: `Bearer ${'x'.repeat(token.length)}` },
    });
    const hostileOrigin = await request.get(`${origin}/api/session`, {
      headers: {
        authorization: `Bearer ${token}`,
        origin: 'https://attacker.example',
      },
    });
    const staticResponse = await request.get(`${origin}/`);

    expect(missingToken.status()).toBe(401);
    expect(wrongToken.status()).toBe(401);
    expect(hostileOrigin.status()).toBe(403);
    expect(staticResponse.status()).toBe(200);
    for (const response of [missingToken, wrongToken, hostileOrigin]) {
      const body = await response.text();
      expect(body).toContain(
        'This request is not available in the current session. Relaunch Diff Review from the terminal.',
      );
      expect(body).not.toContain(token);
      expect(body).not.toContain(repository.root);
    }
    expect(browserMessages.join('\n')).not.toContain(token);
  } finally {
    await stopGeneratedCli(running);
    await repository.cleanup();
  }
});

test('interrupt closes loopback session once', async ({ browser }, testInfo) => {
  assertChromiumPrerequisite(browser, testInfo);

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
