import { execFileSync, spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
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
import type { Browser, Page, Request, TestInfo } from '@playwright/test';

import {
  createGitFixture,
  type GitFixture,
} from '../helpers/git-fixture.js';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const packedRoot = mkdtempSync(join(tmpdir(), 'cumpa-tree-pack-'));
const extractedPackageRoot = join(packedRoot, 'package');
const fakeBinRoot = join(packedRoot, 'fake-bin');
const executablePath = join(
  extractedPackageRoot,
  'dist/bin/cumpa.mjs',
);
const safeGitArguments = [
  '--no-optional-locks',
  '-c',
  'core.hooksPath=',
  '-c',
  'core.fsmonitor=false',
  '-c',
  'diff.external=',
  '-c',
  'protocol.file.allow=never',
] as const;

interface PackResult {
  filename: string;
}

interface RunningCli {
  readonly child: ChildProcess;
  readonly outputPath: string;
  readonly outputDescriptor: number;
}

interface FileRequestEvidence {
  readonly method: string;
  readonly pathname: string;
  readonly search: string;
  readonly postData: string | null;
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
      `[prerequisite] ${command} ${arguments_.join(' ')} failed before the packaged tree assertion: ${detail}`,
    );
  }
}

function runGitWithInput(
  repository: GitFixture,
  arguments_: readonly string[],
  input: Uint8Array,
): Buffer {
  return execFileSync('git', [...safeGitArguments, ...arguments_], {
    cwd: repository.root,
    encoding: 'buffer',
    env: {
      ...process.env,
      GIT_CONFIG_NOSYSTEM: '1',
      GIT_EXTERNAL_DIFF: '',
      GIT_OPTIONAL_LOCKS: '0',
      GIT_TERMINAL_PROMPT: '0',
    },
    input,
    maxBuffer: 4 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function addInvalidUtf8Path(
  repository: GitFixture,
  pathBytes: Buffer,
  content: string,
): void {
  const objectId = runGitWithInput(
    repository,
    ['hash-object', '-w', '--stdin'],
    Buffer.from(content),
  )
    .toString('ascii')
    .trim();
  const indexRecord = Buffer.concat([
    Buffer.from(`100644 ${objectId}\t`, 'ascii'),
    pathBytes,
    Buffer.from([0]),
  ]);
  runGitWithInput(repository, ['update-index', '-z', '--index-info'], indexRecord);
}

async function createFileTreeFixture(): Promise<GitFixture> {
  const repository = await createGitFixture();
  repository.git(['switch', 'main']);
  await repository.write('src/deep/only/rename-source.ts', 'export const renamed = 1;\n');
  await repository.write('copy-source.ts', 'export const copied = true;\n');
  await repository.write('deleted.txt', 'remove me\n');
  repository.git(['add', '--all']);
  repository.git(['commit', '-m', 'tree fixture base']);
  repository.git(['branch', '--force', 'feature', 'main']);
  repository.git(['switch', 'feature']);

  repository.git([
    'mv',
    '--',
    'src/deep/only/rename-source.ts',
    'src/deep/only/renamed.ts',
  ]);
  await repository.write('copy-target.ts', 'export const copied = true;\n');
  await repository.write('tracked.txt', 'head\nwith another line\n');
  await repository.write('control/line\nbreak.ts', 'export const control = true;\n');
  await repository.write('binary.dat', 'binary\0payload');
  repository.git(['rm', '--', 'deleted.txt']);
  repository.git(['add', '--all']);
  addInvalidUtf8Path(
    repository,
    Buffer.concat([Buffer.from('collision/'), Buffer.from([0x80]), Buffer.from('.ts')]),
    'first collision\n',
  );
  addInvalidUtf8Path(
    repository,
    Buffer.concat([Buffer.from('collision/'), Buffer.from([0x81]), Buffer.from('.ts')]),
    'second collision\n',
  );
  repository.git(['commit', '-m', 'tree fixture head']);
  return repository;
}

function startGeneratedCli(repository: GitFixture): RunningCli {
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
      CUMPA_LAUNCH_OPTIONS: JSON.stringify({
        cwd: repository.nestedCwd,
        base: { label: 'Base tree fixture', revision: repository.baseRef },
        head: { label: 'Head tree fixture', revision: repository.headRef },
      }),
      CUMPA_OPENER_LOG: openerLogPath,
      CUMPA_TERMINAL_CAPTURE: outputPath,
    },
    stdio: ['ignore', outputDescriptor, outputDescriptor],
  });
  return { child, outputPath, outputDescriptor };
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
    `[behavioral] generated CLI exited before publishing a loopback URL. Output:\n${output}`,
  ).toBeDefined();
  return match![0];
}

async function stopGeneratedCli(running: RunningCli): Promise<void> {
  if (running.child.exitCode === null && running.child.signalCode === null) {
    running.child.kill('SIGINT');
  }
  if (running.child.exitCode === null && running.child.signalCode === null) {
    await new Promise<void>((resolveExit, reject) => {
      running.child.once('error', reject);
      running.child.once('exit', () => resolveExit());
    });
  }
  closeSync(running.outputDescriptor);
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

function captureFileRequest(request: Request): FileRequestEvidence | undefined {
  const url = new URL(request.url());
  if (!/^\/api\/files\/file_[A-Za-z0-9_-]{43}\/content$/.test(url.pathname)) {
    return undefined;
  }
  return {
    method: request.method(),
    pathname: url.pathname,
    search: url.search,
    postData: request.postData(),
  };
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
    '#!/usr/bin/env node\nprocess.exitCode = 1;\n',
    'utf8',
  );
  mkdirSync(fakeBinRoot, { recursive: true });
  copyFileSync(join(packedRoot, 'fake-open.mjs'), join(fakeBinRoot, 'open'));
  chmodSync(join(fakeBinRoot, 'open'), 0o755);
});

test.afterAll(() => {
  rmSync(packedRoot, { force: true, recursive: true });
});

test('packaged file tree preserves opaque selection and keyboard semantics', async ({
  browser,
  page,
}, testInfo) => {
  assertChromiumPrerequisite(browser, testInfo);
  const repository = await createFileTreeFixture();
  const running = startGeneratedCli(repository);
  const fileRequests: FileRequestEvidence[] = [];
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('request', (request) => {
    const evidence = captureFileRequest(request);
    if (evidence !== undefined) {
      fileRequests.push(evidence);
    }
  });

  try {
    await page.goto(await waitForLoopbackUrl(running));
    await expect.poll(() => browserErrors).toEqual([]);

    const navigation = page.getByRole('navigation', { name: 'Changed files' });
    const tree = navigation.getByRole('tree', { name: 'Changed files' });
    await expect(navigation.getByRole('heading', { name: /^Changed files \(\d+\)$/ })).toBeVisible();
    await expect(tree).toBeVisible();

    const selectedLeaf = tree.locator('[role="treeitem"][aria-selected="true"]');
    await expect(selectedLeaf).toHaveCount(1);
    await expect(selectedLeaf).toHaveAttribute('aria-level', /\d+/);
    await expect(selectedLeaf).toHaveAttribute('tabindex', '0');
    await expect.poll(() => fileRequests.length).toBeGreaterThan(0);

    const modifiedRow = tree.getByRole('treeitem', {
      name: /Modified.*tracked\.txt.*\d+ additions?.*1 deletion.*Text/i,
    });
    await expect(modifiedRow).toBeVisible();
    const rowBox = await modifiedRow.boundingBox();
    expect(rowBox?.height).toBeGreaterThanOrEqual(40);

    const unsupportedRow = tree.getByRole('treeitem', {
      name: /Added.*binary\.dat.*Line counts unavailable.*Unsupported/i,
    });
    await expect(unsupportedRow).toBeVisible();
    await expect(unsupportedRow.getByText('Unsupported', { exact: true })).toBeVisible();

    const renamedRow = tree.getByRole('treeitem', {
      name: /Renamed.*renamed from src\/deep\/only\/rename-source\.ts to src\/deep\/only\/renamed\.ts.*Text/i,
    });
    const copiedRow = tree.getByRole('treeitem', {
      name: /Copied.*copied from copy-source\.ts to copy-target\.ts.*Text/i,
    });
    await expect(renamedRow).toContainText(
      'src/deep/only/rename-source.ts→src/deep/only/renamed.ts',
    );
    await expect(copiedRow).toContainText('copy-source.ts→copy-target.ts');

    const escapedControlRow = tree.getByRole('treeitem', {
      name: /control\/line\\nbreak\.ts/,
    });
    await expect(escapedControlRow).toContainText('control/line\\nbreak.ts');

    const displayCollisions = tree.getByText('collision/�.ts', { exact: true });
    await expect(displayCollisions).toHaveCount(2);
    await displayCollisions.nth(0).click();
    await expect.poll(() => fileRequests.length).toBeGreaterThan(1);
    const firstCollisionRequest = fileRequests.at(-1)!;
    await displayCollisions.nth(1).click();
    await expect
      .poll(() => fileRequests.at(-1)?.pathname)
      .not.toBe(firstCollisionRequest.pathname);

    await copiedRow.click();
    await expect(copiedRow).toHaveAttribute('aria-selected', 'true');
    await expect.poll(() => fileRequests.at(-1)?.pathname).toMatch(
      /^\/api\/files\/file_[A-Za-z0-9_-]{43}\/content$/,
    );
    for (const request of fileRequests) {
      expect(request).toMatchObject({ method: 'GET', search: '', postData: null });
      expect(request.pathname).toMatch(/^\/api\/files\/file_[A-Za-z0-9_-]{43}\/content$/);
      expect(request.pathname).not.toContain('copy-source');
      expect(request.pathname).not.toContain('copy-target');
    }

    await renamedRow.click();
    await renamedRow.focus();
    await expect(renamedRow).toBeFocused();
    const selectedBeforeDirectoryFocus =
      await selectedLeaf.getAttribute('data-file-id');
    await page.keyboard.press('ArrowLeft');
    const focusedDirectory = tree.locator(
      '[role="treeitem"][aria-expanded]:focus',
    );
    await expect(focusedDirectory).toBeFocused();
    await expect(selectedLeaf).toHaveAttribute('data-file-id', selectedBeforeDirectoryFocus!);

    await page.keyboard.press('Enter');
    await expect(focusedDirectory).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('ArrowRight');
    await expect(focusedDirectory).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(tree.locator('[role="treeitem"]:focus')).not.toHaveAttribute(
      'aria-expanded',
      /.+/,
    );

    await page.keyboard.press('Home');
    await expect(tree.getByRole('treeitem').first()).toBeFocused();
    await page.keyboard.press('End');
    await expect(tree.getByRole('treeitem').last()).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(tree.getByRole('treeitem').last()).not.toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(tree.getByRole('treeitem').last()).toBeFocused();
    await page.keyboard.press('Space');
    await expect.poll(() => fileRequests.at(-1)?.pathname).toMatch(
      /^\/api\/files\/file_[A-Za-z0-9_-]{43}\/content$/,
    );

    const focusedOutline = await tree
      .locator('[role="treeitem"]:focus')
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
      });
    expect(focusedOutline).toEqual({ outlineStyle: 'solid', outlineWidth: '2px' });
  } finally {
    await stopGeneratedCli(running);
    await repository.cleanup();
  }
});
