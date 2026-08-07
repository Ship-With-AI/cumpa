import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  inspectCumpaIgnore,
  type CumpaIgnoreStatus,
} from '../../src/git/ignore-status.js';
import { GitRunnerError, type GitRunner } from '../../src/git/runner.js';

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

const gitEnvironment = {
  ...process.env,
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_EXTERNAL_DIFF: '',
  GIT_OPTIONAL_LOCKS: '0',
  GIT_TERMINAL_PROMPT: '0',
};

const fixtures: string[] = [];

async function createRepository(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'cumpa-ignore-status-'));
  fixtures.push(root);
  execFileSync('git', [...safeGitArguments, 'init', '--initial-branch=main'], {
    cwd: root,
    env: gitEnvironment,
    stdio: 'ignore',
  });
  return root;
}

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('effective Cumpa ignore inspection', () => {
  it('uses Git effective-ignore semantics for root, nested, info, global, and negated rules', async () => {
    const rootRule = await createRepository();
    await writeFile(join(rootRule, '.gitignore'), '/.cumpa/\n');
    expect((await inspectCumpaIgnore({ repositoryRoot: rootRule })).kind).toBe('ignored');

    const nestedRule = await createRepository();
    await mkdir(join(nestedRule, '.cumpa'));
    await writeFile(
      join(nestedRule, '.cumpa', '.gitignore'),
      '/.cumpa-ignore-probe\n',
    );
    expect((await inspectCumpaIgnore({ repositoryRoot: nestedRule })).kind).toBe('ignored');

    const infoRule = await createRepository();
    await writeFile(join(infoRule, '.git', 'info', 'exclude'), '/.cumpa/\n');
    expect((await inspectCumpaIgnore({ repositoryRoot: infoRule })).kind).toBe('ignored');

    const globalRule = await createRepository();
    const globalExclude = join(globalRule, 'global-excludes');
    await writeFile(globalExclude, '/.cumpa/\n');
    execFileSync('git', ['config', '--local', 'core.excludesFile', globalExclude], {
      cwd: globalRule,
      env: gitEnvironment,
      stdio: 'ignore',
    });
    expect((await inspectCumpaIgnore({ repositoryRoot: globalRule })).kind).toBe('ignored');

    const negatedRule = await createRepository();
    await writeFile(
      join(negatedRule, '.gitignore'),
      '/.cumpa/*\n!/.cumpa/.cumpa-ignore-probe\n',
    );
    expect((await inspectCumpaIgnore({ repositoryRoot: negatedRule })).kind).toBe('not-ignored');
  });

  it('exposes only fixed probe outcomes and fixed runner authority', async () => {
    const calls: Array<{ arguments_: readonly string[]; cwd: string }> = [];
    const runner: GitRunner = {
      async run(arguments_, options) {
        calls.push({ arguments_, cwd: options.cwd });
        throw new GitRunnerError('exit', 'not ignored', { exitCode: 1 });
      },
    };

    const status: CumpaIgnoreStatus = await inspectCumpaIgnore(
      { repositoryRoot: '/fixed-repository-root' },
      { runner },
    );

    expect(status).toEqual({ kind: 'not-ignored' });
    expect(calls).toEqual([
      {
        arguments_: [
          'check-ignore',
          '--no-index',
          '--quiet',
          '--',
          '.cumpa/.cumpa-ignore-probe',
        ],
        cwd: '/fixed-repository-root',
      },
    ]);
  });

  it('contains probe failures in a bounded unavailable status', async () => {
    const runner: GitRunner = {
      async run() {
        throw new GitRunnerError('spawn', 'git unavailable');
      },
    };

    await expect(
      inspectCumpaIgnore({ repositoryRoot: '/fixed-repository-root' }, { runner }),
    ).resolves.toEqual({ kind: 'unavailable' });
  });
});
