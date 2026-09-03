import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const artifactScript = fileURLToPath(new URL('../../scripts/verify-production-artifacts.mjs', import.meta.url));
const buildBinScript = fileURLToPath(new URL('../../scripts/build-bin.mjs', import.meta.url));
const workflowPath = join(repositoryRoot, '.github/workflows/deploy-supabase-production.yml');
const workflowVerifier = fileURLToPath(new URL('../../scripts/verify-supabase-support.mjs', import.meta.url));

interface PackFile {
  path: string;
}

interface PackResult {
  filename: string;
  files: PackFile[];
}

function runPrerequisite(
  command: string,
  args: string[],
  cwd = repositoryRoot,
  env?: NodeJS.ProcessEnv,
): string {
  try {
    return execFileSync(command, args, {
      cwd,
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `[prerequisite] ${command} ${args.join(' ')} failed before the packaged behavior assertion: ${detail}`,
    );
  }
}

function buildLauncher(releaseSupportOrigin?: string): string {
  const env = { ...process.env };
  if (releaseSupportOrigin === undefined) {
    delete env.CUMPA_RELEASE_SUPPORT_SERVICE_URL;
  } else {
    env.CUMPA_RELEASE_SUPPORT_SERVICE_URL = releaseSupportOrigin;
  }
  runPrerequisite(process.execPath, [buildBinScript], repositoryRoot, env);
  return readFileSync(join(repositoryRoot, 'dist/bin/cumpa.mjs'), 'utf8');
}

test('packed artifact contains runtime and production Vue assets', () => {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'cumpa-pack-'));

  try {
    const hasProductionBootstrap = existsSync(
      join(repositoryRoot, 'src/web/index.html'),
    );
    runPrerequisite(npmCommand, [
      'run',
      hasProductionBootstrap ? 'build' : 'build:runtime',
    ]);

    const packOutput = runPrerequisite(npmCommand, [
      'pack',
      '--json',
      '--ignore-scripts',
      '--pack-destination',
      temporaryDirectory,
    ]);
    const [packResult] = JSON.parse(packOutput) as PackResult[];
    const inventory = packResult.files.map((file) => file.path);

    expect(inventory).toContain('dist/bin/cumpa.mjs');
    expect(inventory).toContain('dist/cli/run.js');
    expect(inventory).not.toContainEqual(expect.stringMatching(/^src\//));
    expect(inventory).not.toContainEqual(expect.stringMatching(/\.(?:ts|vue)$/));
    expect(inventory).not.toContainEqual(expect.stringMatching(/^services\/support\//));
    expect(inventory).not.toContainEqual(expect.stringMatching(/(?:\.env|STRIPE_WEBHOOK_SECRET|DATABASE_URL|RESEND_API_KEY)/));

    const archivePath = join(temporaryDirectory, packResult.filename);
    runPrerequisite('tar', [
      '-xzf',
      archivePath,
      '-C',
      temporaryDirectory,
    ]);


    expect(inventory).toContain('dist/web/index.html');
    const assetPaths = inventory.filter(
      (path) => path.startsWith('dist/web/assets/') && path.endsWith('.js'),
    );
    expect(assetPaths).not.toHaveLength(0);

    const packagedJavaScript = assetPaths
      .map((path) =>
        readFileSync(join(temporaryDirectory, 'package', path), 'utf8'),
      )
      .join('\n');
    expect(packagedJavaScript).toContain('Cumpa: loading pinned comparison');
    expect(packagedJavaScript).toContain('Opening local draft…');
  } finally {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  }
});

test('published package passes the configured-absent production scanner', () => {
  const hasProductionBootstrap = existsSync(join(repositoryRoot, 'src/web/index.html'));
  runPrerequisite(npmCommand, ['run', hasProductionBootstrap ? 'build' : 'build:runtime']);
  runPrerequisite(process.execPath, [artifactScript]);
});

test('clean install launches the packed artifact', () => {
  const directory = mkdtempSync(join(tmpdir(), 'cumpa-installed-'));

  try {
    runPrerequisite(npmCommand, ['run', 'build']);
    const [packed] = JSON.parse(runPrerequisite(npmCommand, [
      'pack',
      '--json',
      '--ignore-scripts',
      '--pack-destination',
      directory,
    ])) as PackResult[];
    runPrerequisite(npmCommand, [
      'install',
      '--ignore-scripts',
      '--prefix',
      join(directory, 'installed'),
      join(directory, packed.filename),
    ]);
    const output = runPrerequisite(process.execPath, [
      join(directory, 'installed/node_modules/cumpa/dist/bin/cumpa.mjs'),
      '--help',
    ]);
    expect(output).toContain('Local-first review of pinned Git comparisons');
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
});

test('local launcher remains support-disabled without a release origin', () => {
  expect(buildLauncher()).not.toContain('CUMPA_SUPPORT_SERVICE_URL');
});

test('release launcher defaults only the canonical support origin', () => {
  const origin = 'https://abcdefghijklmnopqrst.supabase.co';

  expect(buildLauncher(origin)).toContain(
    `if (process.env.CUMPA_SUPPORT_SERVICE_URL === undefined) process.env.CUMPA_SUPPORT_SERVICE_URL = '${origin}';`,
  );
});

test('release build rejects invalid support origins', () => {
  for (const origin of [
    'http://abcdefghijklmnopqrst.supabase.co',
    'https://abcdefghijklmnopqrst.supabase.co/path',
    'https://ABCdefghijklmnopqrst.supabase.co',
    'https://abcdefghijklmnopqrst.supabase.co:443',
    'https://abcdefghijklmnopqrst.supabase.co?query=value',
    'https://abcdefghijklmnopqrst.supabase.co#fragment',
    'https://user:password@abcdefghijklmnopqrst.supabase.co',
  ]) {
    expect(() => buildLauncher(origin)).toThrow();
  }
});

test('configured package contains exactly the canonical support origin', () => {
  const origin = 'https://abcdefghijklmnopqrst.supabase.co';
  buildLauncher(origin);

  runPrerequisite(process.execPath, [
    artifactScript,
    '--expected-support-origin',
    origin,
    '--require-configured-launcher',
    'dist/bin/cumpa.mjs',
  ]);
});

test('release workflow derives and verifies its configured package', () => {
  const workflow = readFileSync(workflowPath, 'utf8');

  expect(workflow).toContain('CUMPA_RELEASE_SUPPORT_SERVICE_URL="$origin" npm run build');
  expect(workflow).toContain('--expected-support-origin "$origin" --require-configured-launcher dist/bin/cumpa.mjs');
  runPrerequisite(process.execPath, [
    workflowVerifier,
    '--verify-workflow',
    workflowPath,
    '--require-release-artifact',
  ]);
});
