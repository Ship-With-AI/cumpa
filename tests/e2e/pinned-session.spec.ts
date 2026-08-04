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
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';

import {
  createGitFixture,
  type GitFixture,
} from '../helpers/git-fixture.js';
import { createShutdownController } from '../../src/server/lifecycle.js';
import type { ComparisonSelection } from '../../src/contracts/comparison.js';
import type {
  FileContentResponse,
  SessionFile,
  SessionResponse,
} from '../../src/contracts/api.js';


const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const packedRoot = mkdtempSync(join(tmpdir(), 'compare-session-pack-'));
const extractedPackageRoot = join(packedRoot, 'package');
const fakeBinRoot = join(packedRoot, 'fake-bin');
const executablePath = join(
  extractedPackageRoot,
  'dist/bin/cumpa.mjs',
);

const metadataHarnessModule = `
import { createApp, h } from 'vue';
import FileMetadataPane from '/components/FileMetadataPane.vue';

const path = (display) => ({
  bytesBase64url: btoa(display),
  display,
  utf8: display,
});

const file = (availability, name) => ({
  fileId: name,
  status: { kind: 'modified' },
  oldPath: path(name),
  newPath: path(name),
  additions: 1,
  deletions: 1,
  availability,
});

export function mountMetadataHarness() {
  createApp({
    setup: () => () => h('main', { id: 'metadata-harness' }, [
      h('section', { id: 'metadata-text' }, [
        h(FileMetadataPane, {
          file: file({ kind: 'text' }, 'src/safe text.ts'),
          loading: false,
          errorMessage: '',
        }),
      ]),
      h('section', { id: 'metadata-unsupported' }, [
        h(FileMetadataPane, {
          file: file({ kind: 'unsupported', reason: 'binary' }, 'assets/image.dat'),
          loading: false,
          errorMessage: '',
        }),
      ]),
      h('section', { id: 'metadata-unavailable' }, [
        h(FileMetadataPane, {
          file: file({ kind: 'unavailable', reason: 'missing-object' }, 'removed/missing.txt'),
          loading: false,
          errorMessage: '',
        }),
      ]),
      h('section', { id: 'metadata-retry-error' }, [
        h(FileMetadataPane, {
          file: file({ kind: 'text' }, 'src/retry.ts'),
          loading: true,
          errorMessage: 'Metadata request failed without exposing a path.',
          onRetry: () => {},
        }),
      ]),
    ]),
  }).mount('#metadata-harness');
}
`;

async function startMetadataHarness(): Promise<Readonly<{ server: ViteDevServer; url: string }>> {
  const server = await createServer({
    configFile: 'vite.config.ts',
    plugins: [{
      name: 'metadata-pane-harness',
      resolveId: (id) => id === 'virtual:metadata-pane-harness' ? '\0metadata-pane-harness' : undefined,
      load: (id) => id === '\0metadata-pane-harness' ? metadataHarnessModule : undefined,
    }],
    server: { host: '127.0.0.1' },
  });
  await server.listen();
  const url = server.resolvedUrls?.local[0];
  if (url === undefined) {
    await server.close();
    throw new Error('metadata harness did not expose a loopback URL');
  }
  return { server, url };
}

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

interface GeneratedRangeRequest {
  readonly kind: 'compare.review-request';
  readonly schemaVersion: 1;
  readonly mode: 'revisions';
  readonly revisions: Readonly<{
    readonly base: string;
    readonly head: string;
    readonly pathspecs?: readonly string[];
  }>;
}

function rangeRequest(
  repository: GitFixture,
  pathspecs: readonly string[] = [],
  base = repository.baseRef,
  head = repository.headRef,
): GeneratedRangeRequest {
  return {
    kind: 'compare.review-request',
    schemaVersion: 1,
    mode: 'revisions',
    revisions: { base, head, ...(pathspecs.length === 0 ? {} : { pathspecs }) },
  };
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
  request?: GeneratedRangeRequest,
): RunningCli {
  const outputPath = join(packedRoot, `terminal-${crypto.randomUUID()}.log`);
  const openerLogPath = join(packedRoot, `opener-${crypto.randomUUID()}.log`);
  const outputDescriptor = openSync(outputPath, 'w');
  const environment = { ...process.env };
  delete environment.CMUX_WORKSPACE_ID;
  const child = spawn(process.execPath, [executablePath], {
    cwd: repository.nestedCwd,
    env: {
      ...environment,
      PATH: `${fakeBinRoot}:${process.env.PATH ?? ''}`,
      ...(request === undefined
        ? {
            COMPARE_LAUNCH_OPTIONS: JSON.stringify({
              cwd: repository.nestedCwd,
              ...selections,
            }),
          }
        : {}),
      COMPARE_OPENER_LOG: openerLogPath,
      COMPARE_TERMINAL_CAPTURE: outputPath,
    },
    stdio: [request === undefined ? 'ignore' : 'pipe', outputDescriptor, outputDescriptor],
  });
  child.stdin?.end(request === undefined ? undefined : JSON.stringify(request));
  return { child, outputPath, openerLogPath, outputDescriptor };
}

async function runGeneratedRequest(
  repository: GitFixture,
  request: GeneratedRangeRequest,
): Promise<Readonly<{ code: number | null; stdout: string; stderr: string; openerLogPath: string }>> {
  const stdoutPath = join(packedRoot, `stdout-${crypto.randomUUID()}.log`);
  const stderrPath = join(packedRoot, `stderr-${crypto.randomUUID()}.log`);
  const openerLogPath = join(packedRoot, `opener-${crypto.randomUUID()}.log`);
  const stdoutDescriptor = openSync(stdoutPath, 'w');
  const stderrDescriptor = openSync(stderrPath, 'w');
  const environment = { ...process.env };
  delete environment.CMUX_WORKSPACE_ID;
  const child = spawn(process.execPath, [executablePath], {
    cwd: repository.nestedCwd,
    env: {
      ...environment,
      PATH: `${fakeBinRoot}:${process.env.PATH ?? ''}`,
      COMPARE_OPENER_LOG: openerLogPath,
      COMPARE_TERMINAL_CAPTURE: stdoutPath,
    },
    stdio: ['pipe', stdoutDescriptor, stderrDescriptor],
  });
  child.stdin?.end(JSON.stringify(request));
  const { code } = await waitForExit(child);
  closeSync(stdoutDescriptor);
  closeSync(stderrDescriptor);
  return {
    code,
    stdout: readFileSync(stdoutPath, 'utf8'),
    stderr: readFileSync(stderrPath, 'utf8'),
    openerLogPath,
  };
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
  await expect(page.getByRole('status')).toHaveText('Opening local draft…');
  await expect(page.locator(':root')).toHaveCSS('color-scheme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(13, 17, 23)');
  await expect(page.locator('.loading-shell')).toHaveCSS('background-color', 'rgb(13, 17, 23)');
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
const terminal = readFileSync(process.env.COMPARE_TERMINAL_CAPTURE, 'utf8');
appendFileSync(process.env.COMPARE_OPENER_LOG, JSON.stringify({ arguments: process.argv.slice(2), terminal }) + '\\n');
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
  await expect(page.locator('.session-header').getByRole('heading', { level: 1 })).toHaveText(
    `Compare: Base fixture · ${expectedBase.slice(0, 7)} → Head fixture · ${expectedHead.slice(0, 7)}`,
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

test('generated range request preserves the server-scoped pinned review', async ({ browser }, testInfo) => {
  assertChromiumPrerequisite(browser, testInfo);
  const repository = await createGitFixture();
  const context = await browser.newContext();
  const page = await context.newPage();
  const request = rangeRequest(repository, [':(literal)committed.txt']);
  const running = startGeneratedCli(repository, undefined, request);
  try {
    const expectedBase = independentlyResolve(repository, ['rev-parse', '--verify', repository.baseRef]);
    const expectedHead = independentlyResolve(repository, ['rev-parse', '--verify', repository.headRef]);
    const url = await waitForLoopbackUrl(running);
    const terminal = readFileSync(running.outputPath, 'utf8');
    const openerEvidence = await waitForText(running.openerLogPath, (content) => content.length > 0);
    const parsedUrl = new URL(url);
    const token = parsedUrl.hash.slice('#token='.length);
    const sessionResponse = await context.request.get(`${parsedUrl.origin}/api/session`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const session = (await sessionResponse.json()) as SessionResponse;

    expect(terminal).not.toContain('Base source');
    expect(openerEvidence.trim().split('\n')).toHaveLength(1);
    expect(session.range).toEqual({
      kind: 'revisions',
      baseOid: expectedBase,
      headOid: expectedHead,
      pathspecs: [':(literal)committed.txt'],
    });
    expect(session.files).toHaveLength(1);
    expect(session.files[0]?.newPath?.display ?? session.files[0]?.oldPath?.display).toBe('committed.txt');

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('tree', { name: 'Changed files' })).toContainText('committed.txt');
    await expect(page.getByRole('tree')).not.toContainText('at-limit.txt');
    await expect(page.getByRole('tree')).not.toContainText('over-limit.txt');

    const disclosure = page.getByRole('button', { name: 'View review scope' });
    await disclosure.click();
    const scope = page.getByRole('region', { name: 'Review scope' });
    await expect(scope.getByRole('heading', { name: 'Review scope' })).toBeVisible();
    await expect(scope.getByText('Base commit', { exact: true })).toBeVisible();
    await expect(scope.getByText('Head commit', { exact: true })).toBeVisible();
    await expect(scope.getByText(expectedBase, { exact: true })).toBeVisible();
    await expect(scope.getByText(expectedHead, { exact: true })).toBeVisible();
    await expect(scope.getByText('Ordered Git pathspecs', { exact: true })).toBeVisible();
    await expect(scope.locator('ol')).toHaveText(':(literal)committed.txt');
    await expect(scope.getByRole('button', { name: 'Copy full base commit' })).toBeVisible();
    await expect(scope.getByRole('button', { name: 'Copy full head commit' })).toBeVisible();
    await expect(scope.getByText('Merge base', { exact: true })).toHaveCount(0);

    repository.git(['update-ref', repository.headRef, repository.futureHeadOid, expectedHead]);
    const afterMovement = await context.request.get(`${parsedUrl.origin}/api/session`, {
      headers: { authorization: `Bearer ${token}` },
    });
    await expect(afterMovement).toBeOK();
    expect((await afterMovement.json()) as SessionResponse).toEqual(session);
  } finally {
    await stopGeneratedCli(running);
    await context.close();
    await repository.cleanup();
  }
});

test('generated range invalid native pathspec fails before listener or opener', async () => {
  const repository = await createGitFixture();
  try {
    const result = await runGeneratedRequest(repository, rangeRequest(repository, [':(not-a-magic)secret']));

    expect(result.code).not.toBe(0);
    expect(result.stdout).toBe('');
    expect(result.stderr).toMatch(/Git rejected .*pathspec scope/);
    expect(result.stderr.length).toBeLessThan(256);
    expect(result.stderr).not.toContain('not-a-magic');
    expect(result.stderr).not.toContain('fatal:');
    expect(result.stderr).not.toMatch(/127\.0\.0\.1|https?:\/\//);
    expect(existsSync(result.openerLogPath)).toBe(false);
  } finally {
    await repository.cleanup();
  }
});

test('range empty state exposes all changed paths without changing interactive copy', async ({ browser }, testInfo) => {
  assertChromiumPrerequisite(browser, testInfo);
  const repository = await createGitFixture();
  const context = await browser.newContext();
  const page = await context.newPage();
  const running = startGeneratedCli(repository, undefined, rangeRequest(repository, [], repository.baseRef, repository.baseRef));
  try {
    const url = await waitForLoopbackUrl(running);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'No changes match this review scope' })).toBeVisible();
    await expect(page.getByText('The pinned commits contain no changed files. View review scope to inspect the commits.')).toBeVisible();
    await page.getByRole('button', { name: 'View review scope' }).click();
    const scope = page.getByRole('region', { name: 'Review scope' });
    await expect(scope.getByText('All changed paths', { exact: true })).toBeVisible();
  } finally {
    await stopGeneratedCli(running);
    await context.close();
    await repository.cleanup();
  }
});

test('range content error does not fall back to current refs', async ({ browser }, testInfo) => {
  assertChromiumPrerequisite(browser, testInfo);
  const repository = await createGitFixture();
  const context = await browser.newContext();
  const page = await context.newPage();
  const running = startGeneratedCli(repository, undefined, rangeRequest(repository, ['committed.txt']));
  try {
    const url = await waitForLoopbackUrl(running);
    await page.route('**/api/files/**', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'file-unavailable', message: 'Pinned file unavailable.' }),
      }),
    );
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Pinned range unavailable' })).toBeVisible();
    await expect(
      page.getByText(
        'Compare could not load the pinned commits or scoped file inventory. Relaunch the same request; this review will not substitute current refs.',
      ),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try loading pinned diff again' })).toBeVisible();
  } finally {
    await stopGeneratedCli(running);
    await context.close();
    await repository.cleanup();
  }
});

test('narrow range scope is a focused modal sheet', async ({ browser }, testInfo) => {
  assertChromiumPrerequisite(browser, testInfo);
  const repository = await createGitFixture();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const running = startGeneratedCli(repository, undefined, rangeRequest(repository, ['committed.txt']));
  try {
    const url = await waitForLoopbackUrl(running);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const disclosure = page.getByRole('button', { name: 'View review scope' });
    await disclosure.click();
    const scope = page.getByRole('dialog', { name: 'Review scope' });
    const close = scope.getByRole('button', { name: 'Close review scope' });
    await expect(close).toBeFocused();
    const box = await close.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await page.keyboard.press('Shift+Tab');
    await expect(scope.getByRole('button', { name: 'Copy full head commit' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(scope).toHaveCount(0);
    await expect(disclosure).toBeFocused();
  } finally {
    await stopGeneratedCli(running);
    await context.close();
    await repository.cleanup();
  }
});

test('complete packaged Phase 1 ordering matrix', async ({ browser }, testInfo) => {
  assertChromiumPrerequisite(browser, testInfo);
  const repository = await createGitFixture();
  const baseWorktreePath = join(dirname(repository.root), 'base-worktree');
  repository.git([
    'worktree',
    'add',
    '--detach',
    baseWorktreePath,
    repository.baseRef,
  ]);
  await repository.write('at-limit.txt', 'a'.repeat(1_048_576));
  await repository.write('over-limit.txt', 'b'.repeat(1_048_577));
  repository.git(['add', '--', 'at-limit.txt', 'over-limit.txt']);
  repository.git(['commit', '-m', 'add size boundary fixtures']);
  await repository.write('dirty-head.txt', 'untracked head bytes must be ignored\n');
  writeFileSync(
    join(baseWorktreePath, 'dirty-base.txt'),
    'untracked base bytes must be ignored\n',
    'utf8',
  );

  const cases = [
    {
      name: 'branch-to-branch',
      selections: {
        base: {
          label: 'Branch base',
          revision: repository.baseRef,
          source: {
            kind: 'branch',
            id: 'branch:matrix-base',
            refName: repository.baseRef,
          },
        },
        head: {
          label: 'Branch head',
          revision: repository.headRef,
          source: {
            kind: 'branch',
            id: 'branch:matrix-head',
            refName: repository.headRef,
          },
        },
      },
    },
    {
      name: 'branch-to-worktree',
      selections: {
        base: {
          label: 'Branch base',
          revision: repository.baseRef,
          source: {
            kind: 'branch',
            id: 'branch:matrix-base',
            refName: repository.baseRef,
          },
        },
        head: {
          label: 'Worktree head',
          revision: repository.headRef,
          source: {
            kind: 'worktree',
            id: 'worktree:matrix-head',
            path: repository.root,
            detached: false,
            dirty: true,
          },
        },
      },
    },
    {
      name: 'worktree-to-branch',
      selections: {
        base: {
          label: 'Worktree base',
          revision: repository.baseRef,
          source: {
            kind: 'worktree',
            id: 'worktree:matrix-base',
            path: baseWorktreePath,
            detached: true,
            dirty: true,
          },
        },
        head: {
          label: 'Branch head',
          revision: repository.headRef,
          source: {
            kind: 'branch',
            id: 'branch:matrix-head',
            refName: repository.headRef,
          },
        },
      },
    },
    {
      name: 'worktree-to-worktree',
      selections: {
        base: {
          label: 'Worktree base',
          revision: repository.baseRef,
          source: {
            kind: 'worktree',
            id: 'worktree:matrix-base',
            path: baseWorktreePath,
            detached: true,
            dirty: true,
          },
        },
        head: {
          label: 'Worktree head',
          revision: repository.headRef,
          source: {
            kind: 'worktree',
            id: 'worktree:matrix-head',
            path: repository.root,
            detached: false,
            dirty: true,
          },
        },
      },
    },
  ] as const satisfies readonly {
    readonly name: string;
    readonly selections: GeneratedCliSelections;
  }[];

  try {
    for (const matrixCase of cases) {
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
      const expectedPaths = repository
        .git([
          'diff',
          '--name-only',
          '-z',
          expectedMergeBase,
          expectedHead,
        ])
        .toString('utf8')
        .split('\0')
        .filter((path) => path.length > 0)
        .sort();
      expect(expectedPaths, `[behavioral] ${matrixCase.name} Git facts`).toEqual([
        'at-limit.txt',
        'committed.txt',
        'over-limit.txt',
      ]);

      const running = startGeneratedCli(repository, matrixCase.selections);
      const context = await browser.newContext();
      const page = await context.newPage();
      let headMoved = false;
      try {
        const launchUrl = await waitForLoopbackUrl(running);
        const parsedLaunchUrl = new URL(launchUrl);
        const token = parsedLaunchUrl.hash.slice('#token='.length);
        repository.git([
          'update-ref',
          repository.headRef,
          repository.futureHeadOid,
          expectedHead,
        ]);
        headMoved = true;

        const sessionResponse = await context.request.get(
          `${parsedLaunchUrl.origin}/api/session`,
          {
            headers: { authorization: `Bearer ${token}` },
          },
        );
        expect(
          sessionResponse.status(),
          `[behavioral] ${matrixCase.name} session API`,
        ).toBe(200);
        const session = (await sessionResponse.json()) as SessionResponse;
        expect(session.base).toMatchObject({
          label: matrixCase.selections.base.label,
          oid: expectedBase,
        });
        expect(session.head).toMatchObject({
          label: matrixCase.selections.head.label,
          oid: expectedHead,
        });
        expect(session.mergeBaseOid).toBe(expectedMergeBase);
        expect(
          session.files
            .map((file) => file.newPath?.utf8 ?? file.oldPath?.utf8)
            .sort(),
        ).toEqual(expectedPaths);

        const atLimit = session.files.find(
          (file) => file.newPath?.utf8 === 'at-limit.txt',
        );
        const overLimit = session.files.find(
          (file) => file.newPath?.utf8 === 'over-limit.txt',
        );
        expect(atLimit).toMatchObject({
          status: { kind: 'added' },
          additions: 1,
          deletions: 0,
          availability: { kind: 'text' },
        });
        expect(overLimit).toMatchObject({
          status: { kind: 'added' },
          additions: 1,
          deletions: 0,
          availability: { kind: 'unsupported', reason: 'oversized' },
        });

        const atLimitMetadata = await context.request.get(
          `${parsedLaunchUrl.origin}/api/files/${atLimit!.fileId}`,
          {
            headers: { authorization: `Bearer ${token}` },
          },
        );
        const overLimitMetadata = await context.request.get(
          `${parsedLaunchUrl.origin}/api/files/${overLimit!.fileId}`,
          {
            headers: { authorization: `Bearer ${token}` },
          },
        );
        expect(atLimitMetadata.status()).toBe(200);
        expect(await atLimitMetadata.json()).toMatchObject({
          fileId: atLimit!.fileId,
          availability: { kind: 'text' },
        });
        expect(overLimitMetadata.status()).toBe(200);
        expect(await overLimitMetadata.json()).toMatchObject({
          fileId: overLimit!.fileId,
          availability: { kind: 'unsupported', reason: 'oversized' },
        });

        await page.goto(launchUrl, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('.session-header').getByRole('heading', { level: 1 })).toHaveText(
          `Compare: ${matrixCase.selections.base.label} · ${expectedBase.slice(0, 7)} → ${matrixCase.selections.head.label} · ${expectedHead.slice(0, 7)}`,
        );
        await expect(
          page.getByRole('heading', { name: 'Changed files (3)' }),
        ).toBeVisible();
        await expect(
          page.getByRole('tree', { name: 'Changed files' }),
        ).toBeVisible();

        const firstFile = session.files[0]!;
        const laterFile = session.files.at(-1)!;
        const firstRow = page.locator(
          `[role="treeitem"][data-file-id="${firstFile.fileId}"]`,
        );
        const laterRow = page.locator(
          `[role="treeitem"][data-file-id="${laterFile.fileId}"]`,
        );
        await expect(firstRow).toHaveAttribute('aria-selected', 'true');
        await laterRow.click();
        await expect(laterRow).toHaveAttribute('aria-selected', 'true');
        await expect(
          page.getByRole('main', {
            name: laterFile.newPath?.display ?? laterFile.oldPath?.display ?? '',
          }),
        ).toContainText(laterFile.newPath?.display ?? laterFile.oldPath?.display ?? '');

        await page
          .getByRole('button', { name: 'Comparison identities' })
          .click();
        const identities = page.getByRole('region', {
          name: 'Comparison identities',
        });
        const identityRows = identities.locator('.identity-row');
        await expect(
          identityRows.nth(0).getByText(expectedBase, { exact: true }),
        ).toBeVisible();
        await expect(
          identityRows.nth(1).getByText(expectedHead, { exact: true }),
        ).toBeVisible();
        await expect(
          identityRows.nth(2).getByText(expectedMergeBase, { exact: true }),
        ).toBeVisible();

        const dirtyWorktreeCount =
          Number(
            matrixCase.selections.base.source?.kind === 'worktree' &&
              matrixCase.selections.base.source.dirty,
          ) +
          Number(
            matrixCase.selections.head.source?.kind === 'worktree' &&
              matrixCase.selections.head.source.dirty,
          );
        await expect(
          page.getByText('Dirty bytes ignored', { exact: true }),
        ).toHaveCount(dirtyWorktreeCount);
      } finally {
        if (headMoved) {
          repository.git([
            'update-ref',
            repository.headRef,
            expectedHead,
            repository.futureHeadOid,
          ]);
        }
        await stopGeneratedCli(running);
        await context.close();
      }
    }
  } finally {
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
    await expect(page.locator('.session-header').getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('.session-header').getByRole('heading', { level: 1 })).toHaveText(
      `Compare: Base fixture · ${expectedBase.slice(0, 7)} → Head fixture · ${expectedHead.slice(0, 7)}`,
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
      'Review unavailable',
    );
    await expect(securityPage.getByRole('heading', { level: 2 })).toHaveText(
      'Pinned session unavailable',
    );
    await expect(securityPage.getByRole('alert')).toHaveText(
      'This request is not available in the current session. Relaunch Compare from the terminal.',
    );
    await expect(securityPage.locator('body')).not.toContainText(repository.root);
    await expect(securityPage.locator('.unavailable-shell')).toHaveCSS('background-color', 'rgb(13, 17, 23)');
    await expect(securityPage.locator('.state-card')).toHaveCSS('background-color', 'rgb(22, 27, 34)');
    await expect(securityPage.locator('.state-card')).toHaveCSS('box-shadow', 'none');
    await expect(securityPage.locator('.state-card')).toHaveCSS('border-color', 'rgb(48, 54, 61)');
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
      'Review unavailable',
    );
    await expect(errorPage.getByRole('alert')).toHaveText(
      'This pinned session is unavailable. Return to the terminal and launch Compare again. Diagnostic details are shown in the terminal.',
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
      'Review unavailable',
    );
    await expect(stoppedPage.getByRole('alert')).toHaveText(
      'This pinned session has stopped. Relaunch Compare from the terminal to continue.',
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
    await expect(dirtyPage.locator('.session-header').getByRole('heading', { level: 1 })).toContainText(
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
    await expect(emptyPage.locator('.session-header').getByRole('heading', { level: 1 })).toHaveText(
      /Compare: Base fixture · [0-9a-f]{7} → Head fixture · [0-9a-f]{7}/,
    );
    await expect(
      emptyPage.getByRole('heading', { level: 2, name: 'No PR-style changes in this pinned comparison' }),
    ).toBeVisible();
    await expect(emptyPage.getByText('0 changed files', { exact: true })).toBeVisible();
    await expect(
      emptyPage.getByText('The selected head has no changes from the displayed merge base.', { exact: true }),
    ).toBeVisible();
    await expect(emptyPage.getByRole('alert')).toHaveCount(0);
    await expect(emptyPage.getByText('Opening pinned comparison…')).toHaveCount(0);
    await expect(emptyPage.locator('.review-main > .empty-state')).toHaveCSS('background-color', 'rgb(22, 27, 34)');
    await expect(emptyPage.locator('.review-main > .empty-state')).toHaveCSS('box-shadow', 'none');
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
  const oldPath = exactPath('00-src/old\tname.ts', '00-src/old\\tname.ts');
  const newPath = exactPath('00-src/new\nname.ts', '00-src/new\\nname.ts');
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
  const content: Record<string, FileContentResponse> = {
    [ids.supported]: {
      fileId: ids.supported,
      base: {
        exists: true,
        path: oldPath,
        language: 'typescript',
        blobOid: '4'.repeat(40),
        text: 'export const before = true;\n',
      },
      head: {
        exists: true,
        path: newPath,
        language: 'typescript',
        blobOid: '5'.repeat(40),
        text: 'export const after = true;\n',
      },
    },
  };
  const requestEvidence: Array<{
    method: string;
    postData: string | null;
    url: string;
  }> = [];
  const sessionGate = Promise.withResolvers<void>();

  await page.route('**/api/session', async (route) => {
    await sessionGate.promise;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(session),
    });
  });
  await page.route('**/api/files/**/content', async (route) => {
    const request = route.request();
    const requestUrl = new URL(request.url());
    const fileId = decodeURIComponent(requestUrl.pathname.split('/').at(-2) ?? '');
    requestEvidence.push({
      method: request.method(),
      postData: request.postData(),
      url: request.url(),
    });
    const response = content[fileId];
    expect(response, `[behavioral] unexpected file content capability ${fileId}`).toBeDefined();
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
    await expect(page.getByRole('status')).toHaveText('Opening local draft…');
    sessionGate.resolve();

    const workspace = page.getByRole('main', { name: '00-src/new\\nname.ts' });
    await expect(workspace.getByRole('heading', { level: 1 })).toHaveText('00-src/old\\tname.ts→00-src/new\\nname.ts');
    await expect(workspace.locator('.monaco-diff-editor')).toBeVisible();
    const contextHeader = workspace.locator('.review-context-header');
    await expect(contextHeader.getByText('Base', { exact: true })).toBeVisible();
    await expect(contextHeader.getByText('Head', { exact: true })).toBeVisible();

    const selectFile = async (fileId: string): Promise<void> => {
      const row = page.locator(`[role="treeitem"][data-file-id="${fileId}"]`);
      await row.click();
      await expect(row).toHaveAttribute('aria-selected', 'true');
    };
    const unavailableFiles = [
      [ids.binary, 'assets/image.dat', 'unsupported: binary'],
      [ids.nonUtf8, 'fixtures/\\xFF', 'unsupported: non-utf8'],
      [ids.oversized, 'generated/oversized.txt', 'unsupported: oversized'],
      [ids.submodule, 'vendor/module', 'unsupported: submodule'],
      [ids.symlink, 'links/current', 'unsupported: symlink'],
      [ids.modeOrType, 'special/device', 'unsupported: mode-or-type'],
      [ids.missingObject, 'removed/missing.txt', 'unavailable: missing-object'],
    ] as const;
    for (const [fileId, path, reason] of unavailableFiles) {
      await selectFile(fileId);
      const unavailable = page.getByRole('main', { name: path });
      await expect(unavailable.getByRole('heading', { level: 2 })).toHaveText(
        'Diff unavailable for this file',
      );
      await expect(unavailable.getByText(reason, { exact: false })).toBeVisible();
    }

    await expect(page.locator('.monaco-editor, iframe, [aria-label*="editor" i]')).toHaveCount(0);
    await expect(page.locator('input, textarea, select')).toHaveCount(0);
    await expect(page.getByText(repository.root, { exact: false })).toHaveCount(0);
    expect(requestEvidence).toHaveLength(1);
    expect(requestEvidence[0]).toMatchObject({ method: 'GET', postData: null });
    const requestUrl = new URL(requestEvidence[0]!.url);
    expect(requestUrl.search).toBe('');
    expect(requestUrl.pathname).toBe(`/api/files/${ids.supported}/content`);

    const metadataHarness = await startMetadataHarness();
    try {
      await page.goto(metadataHarness.url, { waitUntil: 'domcontentloaded' });
      await page.evaluate(async () => {
        const { mountMetadataHarness } = await import(`/@id/${'virtual:metadata-pane-harness'}`);
        document.body.innerHTML = '<div id="metadata-harness"></div>';
        mountMetadataHarness();
      });

      const textNotice = page.locator('#metadata-text .inline-notice');
      const unsupportedNotice = page.locator('#metadata-unsupported .inline-notice');
      const unavailableNotice = page.locator('#metadata-unavailable .inline-notice');
      const retryErrorNotice = page.locator('#metadata-retry-error .inline-notice--error');

      for (const notice of [textNotice, unsupportedNotice, unavailableNotice, retryErrorNotice]) {
        await expect(notice.locator('svg[aria-hidden="true"]')).toHaveCount(1);
        await expect(notice).toHaveCSS('border-left-width', '3px');
      }

      await expect(textNotice.getByRole('heading', { name: 'Text file availability' })).toBeVisible();
      await expect(unsupportedNotice.getByRole('heading', { name: 'File cannot be shown inline' })).toBeVisible();
      await expect(unavailableNotice.getByRole('heading', { name: 'File content is unavailable' })).toBeVisible();
      await expect(retryErrorNotice.getByRole('heading', { name: 'File details could not be loaded' })).toBeVisible();
      await expect(retryErrorNotice.getByRole('alert')).toHaveText('Metadata request failed without exposing a path.');
      await expect(page.locator('#metadata-text .metadata-value')).toContainText('src/safe text.ts');
      await expect(page.getByRole('button', { name: 'Retry file details' })).toBeDisabled();
    } finally {
      await metadataHarness.server.close();
    }
  } finally {
    sessionGate.resolve();
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

    await expect(page.locator('.session-header').getByRole('heading', { level: 1 })).toContainText(
      'Compare: Base fixture',
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
    const hostileHost = await request.get(`${origin}/api/session`, {
      headers: {
        authorization: `Bearer ${token}`,
        host: 'attacker.example',
      },
    });
    const arbitraryCapability = await request.get(
      `${origin}/api/files/file_${'A'.repeat(43)}`,
      {
        headers: { authorization: `Bearer ${token}` },
      },
    );
    const arbitraryFields = await request.get(
      `${origin}/api/session?repository=${encodeURIComponent('/etc')}&ref=${encodeURIComponent('refs/heads/hostile')}`,
      {
        headers: { authorization: `Bearer ${token}` },
      },
    );
    const staticResponse = await request.get(`${origin}/`);

    expect(missingToken.status()).toBe(401);
    expect(wrongToken.status()).toBe(401);
    expect(hostileOrigin.status()).toBe(403);
    expect(hostileHost.status()).toBe(403);
    expect(arbitraryCapability.status()).toBe(404);
    expect(arbitraryFields.status()).toBe(400);
    const arbitraryFieldsBody = await arbitraryFields.text();
    expect(arbitraryFieldsBody).not.toContain('/etc');
    expect(arbitraryFieldsBody).not.toContain('refs/heads/hostile');
    expect(staticResponse.status()).toBe(200);
    for (const response of [
      missingToken,
      wrongToken,
      hostileOrigin,
      hostileHost,
      arbitraryCapability,
      arbitraryFields,
    ]) {
      const body = await response.text();
      expect(body).toContain(
        'This request is not available in the current session. Relaunch Compare from the terminal.',
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
