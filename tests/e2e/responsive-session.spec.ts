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
import type { Browser, Locator, Page, TestInfo } from '@playwright/test';

import type {
  FileMetadataResponse,
  SessionFile,
  SessionResponse,
} from '../../src/contracts/api.js';
import { createGitFixture } from '../helpers/git-fixture.js';
import type { GitFixture } from '../helpers/git-fixture.js';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const packedRoot = mkdtempSync(join(tmpdir(), 'diff-review-responsive-pack-'));
const extractedPackageRoot = join(packedRoot, 'package');
const fakeBinRoot = join(packedRoot, 'fake-bin');
const executablePath = join(extractedPackageRoot, 'dist/bin/diff-review.mjs');

interface PackResult {
  readonly filename: string;
}

interface RunningCli {
  readonly child: ChildProcess;
  readonly outputDescriptor: number;
  readonly outputPath: string;
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
      `[prerequisite] ${command} ${arguments_.join(' ')} failed before responsive package assertions: ${detail}`,
    );
  }
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
      reject(
        new Error(`[behavioral] timed out waiting for generated CLI:\n${content}`),
      );
    }
  }, 25);
  return await promise;
}

async function waitForExit(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  const { promise, resolve: resolveExit, reject } =
    Promise.withResolvers<void>();
  child.once('error', reject);
  child.once('exit', () => resolveExit());
  await promise;
}

function startGeneratedCli(repository: GitFixture): RunningCli {
  const outputPath = join(packedRoot, `terminal-${crypto.randomUUID()}.log`);
  const outputDescriptor = openSync(outputPath, 'w');
  const child = spawn(process.execPath, [executablePath], {
    cwd: repository.nestedCwd,
    env: {
      ...process.env,
      PATH: `${fakeBinRoot}:${process.env.PATH ?? ''}`,
      DIFF_REVIEW_LAUNCH_OPTIONS: JSON.stringify({
        cwd: repository.nestedCwd,
        base: { label: 'Base responsive fixture', revision: repository.baseRef },
        head: { label: 'Head responsive fixture', revision: repository.headRef },
      }),
      DIFF_REVIEW_OPENER_LOG: join(
        packedRoot,
        `opener-${crypto.randomUUID()}.log`,
      ),
      DIFF_REVIEW_TERMINAL_CAPTURE: outputPath,
    },
    stdio: ['ignore', outputDescriptor, outputDescriptor],
  });
  return { child, outputDescriptor, outputPath };
}

async function stopGeneratedCli(running: RunningCli): Promise<void> {
  if (running.child.exitCode === null && running.child.signalCode === null) {
    running.child.kill('SIGINT');
  }
  await waitForExit(running.child);
  closeSync(running.outputDescriptor);
}

async function waitForLoopbackUrl(running: RunningCli): Promise<string> {
  const output = await waitForText(running.outputPath, (content) =>
    /http:\/\/127\.0\.0\.1:\d+\/#token=[A-Za-z0-9_-]{43,}/.test(content),
  );
  const match = output.match(
    /http:\/\/127\.0\.0\.1:\d+\/#token=[A-Za-z0-9_-]{43,}/,
  );
  expect(match, `[behavioral] generated CLI did not print its URL:\n${output}`).toBeDefined();
  return match![0];
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

function opaqueFileId(index: number): string {
  return `file_${String(index).padStart(43, '0')}`;
}

function exactPath(utf8: string): {
  readonly bytesBase64url: string;
  readonly display: string;
  readonly utf8: string;
} {
  return {
    bytesBase64url: Buffer.from(utf8).toString('base64url'),
    display: utf8,
    utf8,
  };
}

function createFiles(): readonly SessionFile[] {
  return [
    {
      fileId: opaqueFileId(1),
      status: { kind: 'modified' },
      newPath: exactPath('00-src/components/alpha.ts'),
      additions: 12,
      deletions: 4,
      availability: { kind: 'text' },
    },
    {
      fileId: opaqueFileId(2),
      status: { kind: 'modified' },
      newPath: exactPath('00-src/components/beta.ts'),
      additions: 8,
      deletions: 3,
      availability: { kind: 'text' },
    },
    ...Array.from({ length: 16 }, (_, offset): SessionFile => {
      const index = offset + 3;
      return {
        fileId: opaqueFileId(index),
        status: { kind: offset % 2 === 0 ? 'added' : 'modified' },
        newPath: exactPath(
          `packages/feature-${String(offset).padStart(2, '0')}/deeply/nested/file-${offset}.ts`,
        ),
        additions: offset + 1,
        deletions: offset % 3,
        availability: { kind: 'text' },
      };
    }),
  ];
}

async function readStyles(locator: Locator): Promise<Record<string, string>> {
  return await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      boxShadow: style.boxShadow,
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      opacity: style.opacity,
      outlineColor: style.outlineColor,
      outlineOffset: style.outlineOffset,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      transitionDuration: style.transitionDuration,
    };
  });
}

async function expectMinimumTarget(locator: Locator): Promise<void> {
  const box = await locator.boundingBox();
  expect(box, `[accessibility] missing target box for ${await locator.getAttribute('aria-label')}`).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(40);
  expect(box!.height).toBeGreaterThanOrEqual(40);
}

function srgbChannel(value: number): number {
  const channel = value / 255;
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function contrastRatio(foreground: string, background: string): number {
  const parse = (hex: string): readonly [number, number, number] => [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
  const luminance = (hex: string): number => {
    const [red, green, blue] = parse(hex).map(srgbChannel);
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

async function assertNoPageOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
}

async function installPackagedSessionRoutes(
  page: Page,
  session: SessionResponse,
): Promise<{
  failNextDetail: (fileId: string) => void;
  releaseRetry: () => void;
}> {
  let failedFileId = '';
  let retryGate: PromiseWithResolvers<void> | undefined;

  await page.route('**/api/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(session),
    });
  });
  await page.route('**/api/files/*', async (route) => {
    const fileId = new URL(route.request().url()).pathname.split('/').at(-1) ?? '';
    const file = session.files.find((candidate) => candidate.fileId === fileId);
    expect(file, `[behavioral] unexpected file capability ${fileId}`).toBeDefined();
    if (fileId === failedFileId) {
      failedFileId = '';
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'file-unavailable', message: 'denied' }),
      });
      return;
    }
    if (retryGate !== undefined) {
      const gate = retryGate;
      await gate.promise;
      retryGate = undefined;
    }
    const response: FileMetadataResponse = {
      ...file!,
      oldMode: '100644',
      newMode: '100644',
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });

  return {
    failNextDetail(fileId: string): void {
      failedFileId = fileId;
      retryGate = Promise.withResolvers<void>();
    },
    releaseRetry(): void {
      retryGate?.resolve();
    },
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
    `#!/usr/bin/env node\nprocess.exitCode = 1;\n`,
    'utf8',
  );
  mkdirSync(fakeBinRoot, { recursive: true });
  copyFileSync(join(packedRoot, 'fake-open.mjs'), join(fakeBinRoot, 'open'));
  chmodSync(join(fakeBinRoot, 'open'), 0o755);
});

test.afterAll(() => {
  rmSync(packedRoot, { force: true, recursive: true });
});

test('responsive keyboard and accessibility contract', async ({
  browser,
  context,
  page,
}, testInfo) => {
  assertChromiumPrerequisite(browser, testInfo);
  const repository = await createGitFixture();
  const running = startGeneratedCli(repository);
  const files = createFiles();
  const expectedBase = repository
    .git(['rev-parse', '--verify', repository.baseRef])
    .toString('ascii')
    .trim();
  const expectedHead = repository
    .git(['rev-parse', '--verify', repository.headRef])
    .toString('ascii')
    .trim();
  const expectedMergeBase = repository
    .git(['merge-base', '--all', expectedBase, expectedHead])
    .toString('ascii')
    .trim();
  const session = {
    base: { label: 'Base responsive fixture', oid: expectedBase },
    head: { label: 'Head responsive fixture', oid: expectedHead },
    mergeBaseOid: expectedMergeBase,
    files,
  } as const satisfies SessionResponse;

  try {
    const url = await waitForLoopbackUrl(running);
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: new URL(url).origin,
    });
    const routeControls = await installPackagedSessionRoutes(page, session);

    await page.setViewportSize({ width: 1280, height: 560 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Diff Review: Base responsive fixture',
    );

    await test.step('exact palette, spacing, typography, contrast, and motion tokens', async () => {
      const tokens = await page.locator(':root').evaluate((element) => {
        const style = getComputedStyle(element);
        const names = [
          '--color-dominant',
          '--color-secondary',
          '--color-accent',
          '--color-destructive',
          '--color-text-primary',
          '--color-text-secondary',
          '--color-border',
          '--color-hover',
          '--color-added',
          '--color-modified',
          '--color-renamed',
          '--color-focus',
          '--space-xs',
          '--space-sm',
          '--space-md',
          '--space-lg',
          '--space-xl',
          '--space-2xl',
          '--space-3xl',
        ];
        return Object.fromEntries(
          names.map((name) => [name, style.getPropertyValue(name).trim()]),
        );
      });
      expect(tokens).toEqual({
        '--color-dominant': '#0d1117',
        '--color-secondary': '#161b22',
        '--color-accent': '#2f81f7',
        '--color-destructive': '#f85149',
        '--color-text-primary': '#f0f6fc',
        '--color-text-secondary': '#8b949e',
        '--color-border': '#30363d',
        '--color-hover': '#21262d',
        '--color-added': '#3fb950',
        '--color-modified': '#d29922',
        '--color-renamed': '#a371f7',
        '--color-focus': '#58a6ff',
        '--space-xs': '4px',
        '--space-sm': '8px',
        '--space-md': '16px',
        '--space-lg': '24px',
        '--space-xl': '32px',
        '--space-2xl': '48px',
        '--space-3xl': '64px',
      });
      expect(contrastRatio('#F0F6FC', '#0D1117')).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio('#8B949E', '#0D1117')).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio('#F0F6FC', '#161B22')).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio('#8B949E', '#161B22')).toBeGreaterThanOrEqual(4.5);

      const typography = await page.evaluate(() => {
        const selectors = [
          'h1',
          '.file-metadata-pane h2',
          '.metadata-section h3',
          '.file-row',
          '.status-badge',
        ];
        return selectors.map((selector) => {
          const style = getComputedStyle(document.querySelector(selector)!);
          return {
            selector,
            family: style.fontFamily,
            size: style.fontSize,
            weight: style.fontWeight,
            lineHeight: style.lineHeight,
          };
        });
      });
      expect(typography).toEqual([
        {
          selector: 'h1',
          family: '-apple-system, "system-ui", "Segoe UI", sans-serif',
          size: '20px',
          weight: '600',
          lineHeight: '28px',
        },
        {
          selector: '.file-metadata-pane h2',
          family: '-apple-system, "system-ui", "Segoe UI", sans-serif',
          size: '20px',
          weight: '600',
          lineHeight: '28px',
        },
        {
          selector: '.metadata-section h3',
          family: '-apple-system, "system-ui", "Segoe UI", sans-serif',
          size: '16px',
          weight: '600',
          lineHeight: '24px',
        },
        {
          selector: '.file-row',
          family: '-apple-system, "system-ui", "Segoe UI", sans-serif',
          size: '14px',
          weight: '600',
          lineHeight: '20.02px',
        },
        {
          selector: '.status-badge',
          family: '-apple-system, "system-ui", "Segoe UI", sans-serif',
          size: '12px',
          weight: '600',
          lineHeight: '15.96px',
        },
      ]);
      const monospace = await page.locator('.path-display').first().evaluate(
        (element) => getComputedStyle(element).fontFamily,
      );
      expect(monospace).toContain('monospace');
      const motionDurations = await page.locator('button').evaluateAll((buttons) =>
        buttons.map((button) => getComputedStyle(button).transitionDuration),
      );
      for (const duration of motionDurations) {
        expect(duration === '0s' || Number.parseFloat(duration) <= 0.15).toBe(true);
      }
    });

    await test.step('wide and medium panes scroll independently and preserve state', async () => {
      const treePane = page.getByRole('navigation', { name: 'Changed files' });
      const detailsPane = page.getByRole('main', { name: 'File details' });
      await expect(treePane).toHaveCSS('overflow-y', 'auto');
      await expect(detailsPane).toHaveCSS('overflow-y', 'auto');
      await treePane.evaluate((element) => {
        element.scrollTop = 120;
      });
      await detailsPane.evaluate((element) => {
        element.scrollTop = 80;
      });
      const wideScroll = await page.evaluate(() => ({
        details: document.querySelector('.file-metadata-pane')!.scrollTop,
        tree: document.querySelector('.file-tree-pane')!.scrollTop,
      }));
      expect(wideScroll.tree).toBeGreaterThan(0);
      expect(wideScroll.details).toBeGreaterThan(0);

      await page.setViewportSize({ width: 900, height: 560 });
      await expect(treePane).toHaveCSS('width', '280px');
      await expect(detailsPane).toBeVisible();
      await expect(page.getByText('Pinned to displayed commits')).toBeVisible();
      await assertNoPageOverflow(page);
    });

    await test.step('narrow tabs preserve selection, expansion, scroll, and focus', async () => {
      await page.setViewportSize({ width: 767, height: 700 });
      const tablist = page.getByRole('tablist', { name: 'Comparison view' });
      const filesTab = page.getByRole('tab', { name: 'Files', exact: true });
      const detailsTab = page.getByRole('tab', { name: 'Details', exact: true });
      await expect(tablist).toBeVisible();
      await expect(filesTab).toHaveAttribute('aria-selected', 'true');
      await expect(filesTab).toHaveAttribute('tabindex', '0');
      await expect(detailsTab).toHaveAttribute('aria-selected', 'false');
      await expect(detailsTab).toHaveAttribute('tabindex', '-1');

      await detailsTab.focus();
      await page.keyboard.press('ArrowLeft');
      await expect(filesTab).toBeFocused();
      await expect(filesTab).toHaveAttribute('aria-selected', 'true');
      await page.keyboard.press('End');
      await expect(detailsTab).toBeFocused();
      await expect(detailsTab).toHaveAttribute('aria-selected', 'true');
      await page.keyboard.press('Home');
      await expect(filesTab).toBeFocused();

      const betaRow = page.locator(`[data-file-id="${opaqueFileId(2)}"]`);
      routeControls.failNextDetail(opaqueFileId(2));
      await betaRow.click();
      const detailsHeading = page.getByRole('heading', {
        level: 2,
        name: 'File details — 00-src/components/beta.ts',
      });
      await expect(detailsTab).toHaveAttribute('aria-selected', 'true');
      await expect(detailsHeading).toBeFocused();
      await expect(betaRow).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByRole('navigation', { name: 'Changed files' })).toBeHidden();

      const retry = page.getByRole('button', { name: 'Retry file details' });
      await expect(retry).toBeVisible();
      const releaseRetry = routeControls.releaseRetry;
      await retry.click();
      await expect(retry).toBeDisabled();
      const disabledStyles = await readStyles(retry);
      expect(disabledStyles.opacity).toBe('0.5');
      const disabledBackground = disabledStyles.backgroundColor;
      await retry.hover({ force: true });
      expect((await readStyles(retry)).backgroundColor).toBe(disabledBackground);
      releaseRetry();
      await expect(retry).toHaveCount(0);

      const back = page.getByRole('button', { name: 'Back to files' });
      await expectMinimumTarget(back);
      await back.click();
      await expect(filesTab).toHaveAttribute('aria-selected', 'true');
      await expect(betaRow).toBeFocused();
      await expect(betaRow).toHaveAttribute('aria-selected', 'true');

      const treePane = page.locator('.file-tree-pane');
      await treePane.evaluate((element) => {
        element.scrollTop = 120;
      });
      await detailsTab.click();
      const detailsPane = page.locator('.file-metadata-pane');
      await detailsPane.evaluate((element) => {
        element.scrollTop = 96;
      });
      await filesTab.click();
      expect(await treePane.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
      await detailsTab.click();
      expect(
        await detailsPane.evaluate((element) => element.scrollTop),
      ).toBeGreaterThan(0);
      await filesTab.click();

      const directory = page.getByRole('treeitem', {
        name: '00-src/components',
        exact: true,
      });
      await directory.click();
      await expect(directory).toHaveAttribute('aria-expanded', 'false');
      await detailsTab.click();
      await filesTab.click();
      await expect(directory).toHaveAttribute('aria-expanded', 'false');
      await directory.click();
      await expect(directory).toHaveAttribute('aria-expanded', 'true');
    });

    await test.step('narrow identity sheet traps focus and restores disclosure', async () => {
      const disclosure = page.getByRole('button', {
        name: 'Comparison identities',
        exact: true,
      });
      await expectMinimumTarget(disclosure);
      await disclosure.click();
      const dialog = page.getByRole('dialog', { name: 'Comparison identities' });
      const close = dialog.getByRole('button', {
        name: 'Close comparison identities',
      });
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      await expect(close).toBeFocused();
      await expectMinimumTarget(close);
      await expect(page.locator('.workspace-shell')).toHaveAttribute('inert', '');
      const copyButtons = dialog.getByRole('button', { name: /^Copy full/ });
      await copyButtons.last().focus();
      await page.keyboard.press('Tab');
      await expect(close).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(copyButtons.last()).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(disclosure).toBeFocused();

      await disclosure.click();
      await close.click();
      await expect(disclosure).toBeFocused();

      await disclosure.click();
      await expect(dialog).toBeVisible();
      await disclosure.click();
      await expect(dialog).toHaveCount(0);
      await expect(disclosure).toBeFocused();
      await page.setViewportSize({ width: 1280, height: 560 });
      await disclosure.click();
      await expect(
        page.getByRole('region', { name: 'Comparison identities' }),
      ).toBeVisible();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await page.keyboard.press('Escape');
      await expect(disclosure).toBeFocused();
    });

    await test.step('controls expose exact enabled, hover, pressed, focus, selected, and announcement states', async () => {
      await page.setViewportSize({ width: 767, height: 700 });
      const filesTab = page.getByRole('tab', { name: 'Files', exact: true });
      const detailsTab = page.getByRole('tab', { name: 'Details', exact: true });
      await expectMinimumTarget(filesTab);
      await expectMinimumTarget(detailsTab);
      const disclosure = page.getByRole('button', {
        name: 'Comparison identities',
        exact: true,
      });
      const initial = await readStyles(disclosure);
      expect(initial.backgroundColor).toBe('rgb(22, 27, 34)');
      expect(initial.borderColor).toBe('rgb(48, 54, 61)');
      await disclosure.hover();
      expect((await readStyles(disclosure)).backgroundColor).toBe(
        'rgb(33, 38, 45)',
      );
      const box = await disclosure.boundingBox();
      expect(box).not.toBeNull();
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
      await page.mouse.down();
      const pressed = await readStyles(disclosure);
      expect(pressed.backgroundColor).toBe('rgb(48, 54, 61)');
      expect(pressed.boxShadow).toContain('inset');
      await page.mouse.move(0, 0);
      await page.mouse.up();
      await disclosure.focus();
      const focused = await readStyles(disclosure);
      expect(focused.outlineWidth).toBe('2px');
      expect(focused.outlineOffset).toBe('2px');
      expect(focused.outlineColor).toBe('rgb(88, 166, 255)');
      expect(focused.outlineStyle).not.toBe('none');

      await detailsTab.click();
      expect((await readStyles(detailsTab)).backgroundColor).toBe(
        'rgb(47, 129, 247)',
      );
      const copy = page.getByRole('button', { name: 'Copy exact path' });
      await expectMinimumTarget(copy);
      await copy.click();
      await expect(page.getByRole('status').filter({ hasText: 'Copied' })).toHaveText(
        'Copied',
      );
      await expect(copy).toBeFocused();
    });

    await test.step('320px reflow, 200% zoom, text spacing, and orientation changes do not overflow or lose state', async () => {
      await page.setViewportSize({ width: 320, height: 640 });
      await assertNoPageOverflow(page);
      for (const control of await page.locator('button:visible').all()) {
        await expectMinimumTarget(control);
      }

      await page.setViewportSize({ width: 640, height: 700 });
      await page.locator('body').evaluate((body) => {
        body.style.zoom = '2';
      });
      await assertNoPageOverflow(page);
      await page.locator('body').evaluate((body) => {
        body.style.zoom = '';
      });

      await page.evaluate(() => {
        for (const element of document.querySelectorAll<HTMLElement>('*')) {
          element.style.letterSpacing = '0.12em';
          element.style.lineHeight = '1.5';
          element.style.wordSpacing = '0.16em';
        }
      });
      await page.setViewportSize({ width: 320, height: 640 });
      await assertNoPageOverflow(page);
      await page.getByRole('button', {
        name: 'Comparison identities',
        exact: true,
      }).click();
      const fullId = page.getByText(expectedHead, { exact: true });
      await expect(fullId).toBeVisible();
      const idDimensions = await fullId.evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
      expect(idDimensions.scrollWidth).toBeLessThanOrEqual(idDimensions.clientWidth);
      await page.keyboard.press('Escape');

      await page.setViewportSize({ width: 700, height: 360 });
      await expect(
        page.locator(`[data-file-id="${opaqueFileId(2)}"]`),
      ).toHaveAttribute('aria-selected', 'true');
      await page.setViewportSize({ width: 360, height: 700 });
      await expect(page.getByRole('tablist', { name: 'Comparison view' })).toBeVisible();
      await expect(
        page.locator(`[data-file-id="${opaqueFileId(2)}"]`),
      ).toHaveAttribute('aria-selected', 'true');
    });
  } finally {
    await stopGeneratedCli(running);
    await repository.cleanup();
  }
});
