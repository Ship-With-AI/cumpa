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

interface PackFile {
  path: string;
}

interface PackResult {
  filename: string;
  files: PackFile[];
}

function runPrerequisite(command: string, args: string[], cwd = repositoryRoot): string {
  try {
    return execFileSync(command, args, {
      cwd,
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

test('packed artifact contains runtime and production Vue assets', () => {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'diff-review-pack-'));

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

    expect(inventory).toContain('dist/bin/diff-review.mjs');
    expect(inventory).toContain('dist/cli/run.js');
    expect(inventory).not.toContainEqual(expect.stringMatching(/^src\//));
    expect(inventory).not.toContainEqual(expect.stringMatching(/\.(?:ts|vue)$/));

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
    expect(packagedJavaScript).toContain('Diff Review: loading pinned comparison');
    expect(packagedJavaScript).toContain('Opening local draft…');
  } finally {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  }
});
