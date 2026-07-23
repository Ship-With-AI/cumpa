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
  const environment = { ...process.env };
  delete environment.CMUX_WORKSPACE_ID;
  const child = spawn(process.execPath, [executablePath], {
    cwd: repository.nestedCwd,
    env: {
      ...environment,
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

    await page.setViewportSize({ width: 1440, height: 560 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.session-header').getByRole('heading', { level: 1 })).toContainText(
      'Diff Review: Base responsive fixture',
    );

    await test.step('exact palette, spacing, typography, contrast, and motion tokens', async () => {
      const tokens = await page.locator(':root').evaluate((element) => {
        const style = getComputedStyle(element);
        const names = [
          '--canvas',
          '--panel',
          '--accent',
          '--destructive',
          '--surface',
          '--text',
          '--text-muted',
          '--rule',
          '--addition-bg',
          '--addition-fg',
          '--deletion-bg',
          '--deletion-fg',
          '--warning-bg',
          '--warning-fg',
          '--info-bg',
          '--info-fg',
          '--error-bg',
          '--error-fg',
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
        '--canvas': '#f6f3ec',
        '--panel': '#e9e4da',
        '--accent': '#245a7a',
        '--destructive': '#a33a32',
        '--surface': '#fcfaf5',
        '--text': '#242822',
        '--text-muted': '#596058',
        '--rule': '#c9c2b5',
        '--addition-bg': '#e2f0e6',
        '--addition-fg': '#285b3f',
        '--deletion-bg': '#f8e3de',
        '--deletion-fg': '#8e352f',
        '--warning-bg': '#fff0cd',
        '--warning-fg': '#775313',
        '--info-bg': '#ddeaf2',
        '--info-fg': '#315770',
        '--error-bg': '#fae8e6',
        '--error-fg': '#a33a32',
        '--color-dominant': '#f6f3ec',
        '--color-secondary': '#e9e4da',
        '--color-accent': '#245a7a',
        '--color-destructive': '#a33a32',
        '--color-text-primary': '#242822',
        '--color-text-secondary': '#596058',
        '--color-border': '#c9c2b5',
        '--color-hover': '#fcfaf5',
        '--color-added': '#285b3f',
        '--color-modified': '#775313',
        '--color-focus': '#245a7a',
        '--space-xs': '4px',
        '--space-sm': '8px',
        '--space-md': '16px',
        '--space-lg': '24px',
        '--space-xl': '32px',
        '--space-2xl': '48px',
        '--space-3xl': '64px',
      });
      expect(contrastRatio('#242822', '#f6f3ec')).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio('#596058', '#f6f3ec')).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio('#242822', '#e9e4da')).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio('#596058', '#e9e4da')).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio('#775313', '#fff0cd')).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio('#315770', '#ddeaf2')).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio('#a33a32', '#fae8e6')).toBeGreaterThanOrEqual(4.5);

      await page.evaluate(() => {
        const fixture = document.createElement('div');
        fixture.dataset.semanticContract = 'true';
        fixture.innerHTML = [
          '<aside class="inline-notice inline-notice--warning">Warning</aside>',
          '<aside class="inline-notice inline-notice--error">Error</aside>',
          '<aside class="draft-recovery__notice">Information</aside>',
          '<button class="ui-button ui-button--destructive">Delete</button>',
        ].join('');
        document.body.append(fixture);
      });
      const semanticStyles = await page.locator('[data-semantic-contract]').evaluate((fixture) => {
        const styles = Array.from(fixture.children, (element) => {
          const style = getComputedStyle(element);
          return {
            background: style.backgroundColor,
            border: style.borderLeftColor,
            color: style.color,
          };
        });
        fixture.remove();
        return styles;
      });
      expect(semanticStyles).toEqual([
        { background: 'rgb(255, 240, 205)', border: 'rgb(119, 83, 19)', color: 'rgb(119, 83, 19)' },
        { background: 'rgb(250, 232, 230)', border: 'rgb(163, 58, 50)', color: 'rgb(163, 58, 50)' },
        { background: 'rgb(221, 234, 242)', border: 'rgb(49, 87, 112)', color: 'rgb(49, 87, 112)' },
        { background: 'rgb(252, 250, 245)', border: 'rgb(163, 58, 50)', color: 'rgb(163, 58, 50)' },
      ]);

      const typography = await page.evaluate(() => {
        const selectors = [
          '.session-header h1',
          '.active-file-strip h1',
          '.file-row',
          '.availability-marker',
          '.pin-cue',
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
          selector: '.session-header h1',
          family: '"Avenir Next", Avenir, "Segoe UI", sans-serif',
          size: '20px',
          weight: '600',
          lineHeight: '28px',
        },
        {
          selector: '.active-file-strip h1',
          family: '"Avenir Next", Avenir, "Segoe UI", sans-serif',
          size: '18px',
          weight: '700',
          lineHeight: '24px',
        },
        {
          selector: '.file-row',
          family: '"Avenir Next", Avenir, "Segoe UI", sans-serif',
          size: '14px',
          weight: '600',
          lineHeight: '20.02px',
        },
        {
          selector: '.availability-marker',
          family: '"Avenir Next", Avenir, "Segoe UI", sans-serif',
          size: '12px',
          weight: '600',
          lineHeight: '15.96px',
        },
        {
          selector: '.pin-cue',
          family: '"Avenir Next", Avenir, "Segoe UI", sans-serif',
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

    await test.step('review rail and drawers honor locked responsive geometry', async () => {
      const rail = page.locator('.comments-rail');
      const panel = page.locator('.review-panel');
      const treePane = page.locator('.review-files');
      const reviewMain = page.locator('.review-main');
      const reviewButton = page.getByRole('button', { name: 'Review', exact: true });

      await page.setViewportSize({ width: 1440, height: 560 });
      await expect(reviewMain).toBeVisible();
      await expect(rail).toBeVisible();
      expect(Math.round((await rail.boundingBox())!.width)).toBe(360);
      await expect(rail).toHaveCSS('overflow-y', 'hidden');
      await expect(panel).toHaveCSS('overflow-y', 'auto');
      const reviewScrollOwners = await page.locator('.comments-rail, .review-panel').evaluateAll((elements) =>
        elements
          .filter((element) => ['auto', 'scroll'].includes(getComputedStyle(element).overflowY))
          .map((element) => element.classList.contains('review-panel') ? 'panel' : 'rail'),
      );
      expect(reviewScrollOwners).toEqual(['panel']);

      await reviewButton.focus();
      const focusStyle = await readStyles(reviewButton);
      expect(focusStyle.outlineColor).toBe('rgb(36, 90, 122)');
      expect(focusStyle.outlineStyle).toBe('solid');
      expect(Number.parseFloat(focusStyle.outlineWidth)).toBeGreaterThanOrEqual(2);

      await page.setViewportSize({ width: 1439, height: 560 });
      await expect(rail).toHaveClass(/comments-rail--open/);
      expect(Math.round((await rail.boundingBox())!.width)).toBe(360);
      await page.getByRole('button', { name: 'Close review' }).click();

      await page.setViewportSize({ width: 1100, height: 560 });
      await expect(page.getByRole('button', { name: 'Files', exact: true })).toHaveCount(0);
      await reviewButton.click();
      await expect(rail).toHaveClass(/comments-rail--open/);
      const mediumBox = await rail.boundingBox();
      expect(Math.round(mediumBox!.width)).toBe(360);
      expect(Math.round(mediumBox!.x + mediumBox!.width)).toBe(1100);
      await page.getByRole('button', { name: 'Close review' }).click();

      await page.setViewportSize({ width: 1099, height: 560 });
      const filesButton = page.getByRole('button', { name: 'Files', exact: true });
      await expect(filesButton).toBeVisible();
      await expect(treePane).toHaveCSS('overflow-y', 'auto');
      await filesButton.click();
      await expect(treePane).toHaveClass(/review-files--open/);
      await page.getByRole('button', { name: 'Close files' }).click();
      await expect(treePane).not.toHaveClass(/review-files--open/);

      await page.setViewportSize({ width: 768, height: 560 });
      await reviewButton.click();
      expect(Math.round((await rail.boundingBox())!.width)).toBe(360);
      await page.getByRole('button', { name: 'Close review' }).click();

      await page.setViewportSize({ width: 375, height: 640 });
      await reviewButton.click();
      const compactBox = await rail.boundingBox();
      expect(Math.round(compactBox!.width)).toBe(343);
      expect(Math.round(compactBox!.x + compactBox!.width)).toBe(375);
      const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(documentWidth).toBeLessThanOrEqual(375);
      await page.getByRole('button', { name: 'Close review' }).click();
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
      await expect(page.locator('.review-shell')).toHaveAttribute('inert', '');
      const copyButtons = dialog.getByRole('button', { name: /^Copy full/ });
      await copyButtons.last().focus();
      await page.keyboard.press('Tab');
      await expect(close).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(disclosure).toBeFocused();
    });

    await test.step('compact viewport preserves accessible review controls', async () => {
      await page.setViewportSize({ width: 320, height: 640 });
      await expect(page.getByRole('button', { name: 'Files', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Files', exact: true }).click();
      await expect(page.getByRole('tree', { name: /Changed files/ })).toBeVisible();
      await page.getByRole('button', { name: 'Close files' }).click();
    });
  } finally {
    await stopGeneratedCli(running);
    await repository.cleanup();
  }
});
