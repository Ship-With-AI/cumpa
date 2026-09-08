import { spawn } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { describe, expect, test } from 'vitest';

import { readPackageVersionFromManifest } from '../../src/cli/run.js';

const projectRoot = resolve(import.meta.dirname, '../..');
const packageManifestPath = join(projectRoot, 'package.json');
const packagedCli = join(projectRoot, 'dist', 'bin', 'cumpa.mjs');

async function readManifest(): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(packageManifestPath, 'utf8')) as Record<string, unknown>;
}

async function writeSentinelCommand(
  directory: string,
  command: string,
  sentinel: string,
): Promise<void> {
  const executable = join(directory, process.platform === 'win32' ? `${command}.cmd` : command);
  const body = process.platform === 'win32'
    ? `@echo off\r\ntype nul > "${sentinel}"\r\n`
    : `#!/bin/sh\n: > "${sentinel}"\n`;
  await writeFile(executable, body, 'utf8');
  if (process.platform !== 'win32') await chmod(executable, 0o755);
}

async function runVersion(
  cwd: string,
  environment: NodeJS.ProcessEnv,
): Promise<{ readonly code: number | null; readonly stderr: string; readonly stdout: string }> {
  const { promise, reject, resolve: resolveResult } = Promise.withResolvers<{
    readonly code: number | null;
    readonly stderr: string;
    readonly stdout: string;
  }>();
  const child = spawn(process.execPath, [packagedCli, '--version'], {
    cwd,
    env: environment,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  // The open pipe has no completion event; this timeout proves --version never waits for stdin.
  const timer = setTimeout(() => {
    child.kill();
    reject(new Error('cumpa --version waited for ordinary action input'));
  }, 1_000);
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk: string) => {
    stdout += chunk;
  });
  child.stderr.on('data', (chunk: string) => {
    stderr += chunk;
  });
  child.on('error', (error) => {
    clearTimeout(timer);
    reject(error);
  });
  child.on('close', (code: number | null) => {
    clearTimeout(timer);
    resolveResult({ code, stderr, stdout });
  });
  return await promise;
}

describe('runtime package contract', () => {
  test('version reads the installed manifest and exits before ordinary action side effects', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'cumpa-version-'));
    const commands = join(directory, 'commands');
    const gitSentinel = join(directory, 'git-used');
    const browserSentinel = join(directory, 'browser-used');
    const serverSentinel = join(directory, 'server-used');
    const serverHook = join(directory, 'server-hook.cjs');
    try {
      await mkdir(commands);
      await writeFile(join(directory, '.gitignore'), '', 'utf8');
      await writeFile(join(directory, 'commands-placeholder'), '', 'utf8');
      await writeFile(
        serverHook,
        `const fs = require('node:fs');\nconst net = require('node:net');\nconst listen = net.Server.prototype.listen;\nnet.Server.prototype.listen = function (...arguments_) {\n  fs.writeFileSync(process.env.CUMPA_SERVER_SENTINEL, 'used');\n  return Reflect.apply(listen, this, arguments_);\n};\n`,
        'utf8',
      );
      await writeSentinelCommand(commands, 'git', gitSentinel);
      await writeSentinelCommand(commands, 'open', browserSentinel);
      await writeSentinelCommand(commands, 'xdg-open', browserSentinel);
      const result = await runVersion(directory, {
        ...process.env,
        BROWSER: 'open',
        CUMPA_SERVER_SENTINEL: serverSentinel,
        NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --require=${serverHook}`,
        PATH: `${commands}${delimiter}${process.env.PATH ?? ''}`,
      });

      expect(result).toEqual({ code: 0, stderr: '', stdout: '1.5.0\n' });
      await expect(readFile(gitSentinel)).rejects.toMatchObject({ code: 'ENOENT' });
      await expect(readFile(browserSentinel)).rejects.toMatchObject({ code: 'ENOENT' });
      await expect(readFile(serverSentinel)).rejects.toMatchObject({ code: 'ENOENT' });
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  test('publishes only the scoped runtime and legal manifest contract', async () => {
    const manifest = await readManifest();

    expect(manifest).toMatchObject({
      bin: { cumpa: 'dist/bin/cumpa.mjs' },
      engines: { node: '>=24' },
      name: '@shipwithai/cumpa',
      version: '1.5.0',
    });
    expect(manifest).not.toHaveProperty('private');
    expect(manifest.files).toEqual([
      'dist/',
      'README.md',
      'LICENSE',
      'THIRD_PARTY_NOTICES.md',
    ]);
  });

  test('accepts a controlled valid manifest version and rejects malformed metadata', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'cumpa-manifest-'));
    const manifestPath = join(directory, 'package.json');

    try {
      await writeFile(
        manifestPath,
        JSON.stringify({ name: '@shipwithai/cumpa', version: '1.5.1-beta.1' }),
        'utf8',
      );
      await expect(readPackageVersionFromManifest(pathToFileURL(manifestPath))).resolves.toBe('1.5.1-beta.1');
      await writeFile(manifestPath, JSON.stringify({ name: 'cumpa', version: '1.5.1' }), 'utf8');
      await expect(readPackageVersionFromManifest(pathToFileURL(manifestPath))).rejects.toThrow('Package manifest name');
      await writeFile(manifestPath, JSON.stringify({ name: '@shipwithai/cumpa', version: '' }), 'utf8');
      await expect(readPackageVersionFromManifest(pathToFileURL(manifestPath))).rejects.toThrow('Package manifest version');
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

});
