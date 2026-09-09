import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';

import { expect, test } from '@playwright/test';

import { createDirtyGitFixture } from '../helpers/git-fixture.js';
import {
  installRuntimeArtifact,
  readRuntimeArtifact,
  runRuntimeCommand,
  rehashRuntimeArtifact,
  writeRuntimeScenario,
  type InstalledRuntimeArtifact,
} from '../helpers/runtime-artifact.js';

const artifact = readRuntimeArtifact();
let installed: InstalledRuntimeArtifact | undefined;
let temporaryRoot: string | undefined;
let assetChecksPassed = false;
let cleaned = false;

function commandOutput(executablePath: string, args: readonly string[], environment: NodeJS.ProcessEnv): string {
  return runRuntimeCommand(executablePath, args, { cwd: tmpdir(), env: environment });
}

async function loopbackUrl(outputPath: string, markerPath: string, child: ChildProcess): Promise<string> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const output = existsSync(outputPath) ? readFileSync(outputPath, 'utf8') : '';
    const match = output.match(/http:\/\/127\.0\.0\.1:\d+\/#token=[A-Za-z0-9_-]{43,}/u);
    if (match !== null && existsSync(markerPath)) return match[0];
    if (child.exitCode !== null || child.signalCode !== null) throw new Error('[runtime-artifact] installed CLI exited before opening its loopback URL');
    await new Promise<void>((resolveWait) => setTimeout(resolveWait, 25));
  }
  throw new Error('[runtime-artifact] timed out waiting for installed CLI loopback URL');
}

function installedAssets(runtime: InstalledRuntimeArtifact): readonly string[] {
  const root = join(runtime.packageRoot, 'dist', 'web', 'assets');
  const assets: string[] = [];
  const visit = (directory: string, publicPath: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = `${publicPath}/${entry.name}`;
      if (entry.isDirectory()) visit(join(directory, entry.name), path);
      else if (entry.isFile()) assets.push(path);
    }
  };
  visit(root, '/assets');
  return assets.sort((left, right) => left.localeCompare(right));
}

test.beforeAll(() => {
  installed = installRuntimeArtifact(artifact);
  temporaryRoot = mkdtempSync(join(tmpdir(), 'cumpa-runtime-assets-'));
});

test.afterAll(() => {
  if (installed !== undefined) installed.cleanup();
  if (temporaryRoot !== undefined) rmSync(temporaryRoot, { recursive: true, force: true });
  cleaned = true;
  rehashRuntimeArtifact(artifact);
  if (assetChecksPassed && installed !== undefined) {
    writeRuntimeScenario('package-assets', {
      archive: artifact.archive,
      package: artifact.package,
      install: installed.proof,
      target: { platform: process.platform, arch: process.arch },
      cleanup: { complete: cleaned },
      browser: { assets: true, workers: true, codicon: true },
      checks: { version: true, help: true, isolatedInstall: true, dependencyTree: true },
    });
  }
});

test('supplied archive installs globally and serves its complete browser asset graph', async ({ page }) => {
  if (installed === undefined || temporaryRoot === undefined) throw new Error('[runtime-artifact] isolated installation was not initialized');
  expect(commandOutput(installed.executablePath, ['--version'], installed.env)).toBe(`${artifact.package.version}\n`);
  expect(commandOutput(installed.executablePath, ['--help'], installed.env)).toMatch(/--version\b/u);

  const packageManifest = JSON.parse(readFileSync(join(installed.packageRoot, 'package.json'), 'utf8')) as {
    readonly name: string;
    readonly version: string;
    readonly engines: { readonly node: string };
    readonly bin: { readonly cumpa: string };
  };
  expect(packageManifest).toEqual(expect.objectContaining({
    name: '@shipwithai/cumpa',
    version: artifact.package.version,
    engines: { node: '>=24' },
    bin: { cumpa: 'dist/bin/cumpa.mjs' },
  }));
  for (const legalFile of ['LICENSE', 'THIRD_PARTY_NOTICES.md'] as const) {
    expect(createHash('sha256').update(readFileSync(join(installed.packageRoot, legalFile))).digest('hex')).toBe(artifact.evidence.legal[legalFile]);
  }
  for (const forbidden of ['src', 'tests', '.planning', '.cumpa', '.github', '.git', '.kimi-code']) {
    expect(existsSync(join(installed.packageRoot, forbidden))).toBe(false);
  }

  const fixture = await createDirtyGitFixture('branch-to-worktree', 8);
  const fakeBin = join(temporaryRoot, 'bin');
  mkdirSync(fakeBin, { recursive: true, mode: 0o700 });
  const outputPath = join(temporaryRoot, 'cli.log');
  const browserMarker = join(temporaryRoot, 'browser-open.log');
  const opener = join(fakeBin, 'open');
  writeFileSync(opener, [
    '#!/usr/bin/env node',
    "const { appendFileSync } = require('node:fs');",
    "appendFileSync(process.env.CUMPA_BROWSER_OPEN_MARKER, process.argv.slice(2).join(' '));",
    '',
  ].join('\n'), { mode: 0o700 });
  chmodSync(opener, 0o700);

  const child = spawn(process.execPath, ['--import', installed.fetchGuardPath, installed.nodeEntrypointPath], {
    cwd: fixture.nestedCwd,
    env: {
      ...installed.env,
      PATH: `${fakeBin}:${installed.env.PATH}`,
      BROWSER: opener,
      CUMPA_BROWSER_OPEN_MARKER: browserMarker,
      CUMPA_LAUNCH_OPTIONS: JSON.stringify({
        cwd: fixture.nestedCwd,
        base: { label: fixture.baseRef.slice('refs/heads/'.length), revision: fixture.baseRef },
        head: { label: fixture.headRef.slice('refs/heads/'.length), revision: fixture.headRef },
      }),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const output = createWriteStream(outputPath, { flags: 'wx' });
  child.stdout?.pipe(output, { end: false });
  child.stderr?.pipe(output, { end: false });

  try {
    await page.route('**/*', (route) => {
      const host = new URL(route.request().url()).hostname;
      return ['127.0.0.1', '[::1]', 'localhost'].includes(host) ? route.continue() : route.abort();
    });
    const url = await loopbackUrl(outputPath, browserMarker, child);
    const responseFailures: string[] = [];
    page.on('requestfailed', (request) => responseFailures.push(request.url()));
    await page.goto(url);
    await expect(page.locator('.monaco-diff-editor')).toBeVisible();
    const notNow = page.getByRole('button', { name: 'Not now', exact: true });
    if (await notNow.isVisible()) await notNow.click();
    await page.getByRole('treeitem', { name: /changed\.ts/ }).click();
    const assets = installedAssets(installed);
    const responses = await page.evaluate(async (paths) => await Promise.all(paths.map(async (path) => {
      const response = await fetch(path);
      return { path, ok: response.ok };
    })), assets);
    expect(responses).toEqual(expect.arrayContaining(assets.map((path) => ({ path, ok: true }))));
    expect(responseFailures).toEqual([]);
    for (const worker of ['editor', 'css', 'html', 'json', 'ts']) {
      expect(assets.some((path) => path.includes(`${worker}.worker-`))).toBe(true);
    }
    expect(assets.some((path) => /codicon.*\.(?:ttf|woff2?)/u.test(path))).toBe(true);
  } finally {
    await page.close();
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill('SIGTERM');
      await exited;
    }
    await new Promise<void>((done) => output.end(done));
    await fixture.cleanup();
  }

  assetChecksPassed = true;
});
