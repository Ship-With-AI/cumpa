import { realpath } from 'node:fs/promises';

import {
  FATAL_LAUNCH_MESSAGES,
  LaunchError,
} from '../domain/errors.js';
import { GitRunnerError, type GitRunner } from './runner.js';

const MINIMUM_GIT_VERSION = Object.freeze({
  major: 2,
  minor: 43,
  patch: 0,
});

export interface GitRepository {
  readonly root: string;
  readonly headOid: string;
}

function singleLine(buffer: Buffer, fact: string): string {
  const value = buffer.toString('utf8').trim();
  if (value.length === 0 || value.includes('\n') || value.includes('\0')) {
    throw new Error(`Git returned an invalid ${fact}`);
  }
  return value;
}

function versionIsSupported(versionOutput: Buffer): boolean {
  const match = /^git version (\d+)\.(\d+)\.(\d+)(?:\s|$)/u.exec(
    singleLine(versionOutput, 'version'),
  );
  if (match === null) {
    return false;
  }
  const [major, minor, patch] = match.slice(1).map(Number) as [
    number,
    number,
    number,
  ];
  return (
    major > MINIMUM_GIT_VERSION.major ||
    (major === MINIMUM_GIT_VERSION.major &&
      (minor > MINIMUM_GIT_VERSION.minor ||
        (minor === MINIMUM_GIT_VERSION.minor &&
          patch >= MINIMUM_GIT_VERSION.patch)))
  );
}

async function requireSupportedGit(
  cwd: string,
  runner: GitRunner,
  signal?: AbortSignal,
): Promise<void> {
  try {
    const version = await runner.run(['--version'], { cwd, signal });
    if (!versionIsSupported(version.stdout)) {
      throw new LaunchError(
        'git-unsupported',
        FATAL_LAUNCH_MESSAGES.gitUnsupported,
        { recovery: { kind: 'exit' } },
      );
    }
  } catch (error) {
    if (error instanceof LaunchError) {
      throw error;
    }
    if (error instanceof GitRunnerError && error.kind === 'spawn') {
      throw new LaunchError('git-missing', FATAL_LAUNCH_MESSAGES.gitMissing, {
        cause: error,
        recovery: { kind: 'exit' },
      });
    }
    if (signal?.aborted) {
      throw error;
    }
    throw new LaunchError(
      'git-unsupported',
      FATAL_LAUNCH_MESSAGES.gitUnsupported,
      { cause: error, recovery: { kind: 'exit' } },
    );
  }
}

async function probeMachineProtocols(
  repositoryRoot: string,
  headOid: string,
  runner: GitRunner,
  signal?: AbortSignal,
): Promise<void> {
  const commands = [
    ['worktree', 'list', '--porcelain', '-z'],
    ['for-each-ref', '--format=%(refname)%00', 'refs/heads'],
    ['merge-base', '--all', headOid, headOid],
    [
      'diff',
      '--raw',
      '-z',
      '--no-abbrev',
      '--no-ext-diff',
      '--no-textconv',
      headOid,
      headOid,
      '--',
    ],
    [
      'diff',
      '--numstat',
      '-z',
      '--no-ext-diff',
      '--no-textconv',
      headOid,
      headOid,
      '--',
    ],
    ['cat-file', '--batch-command', '-Z'],
  ] as const;

  try {
    for (const arguments_ of commands) {
      await runner.run(arguments_, { cwd: repositoryRoot, signal });
    }
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }
    throw new LaunchError(
      'git-unsupported',
      FATAL_LAUNCH_MESSAGES.gitUnsupported,
      { cause: error, recovery: { kind: 'exit' } },
    );
  }
}

export async function discoverGitRepository(
  cwd: string,
  runner: GitRunner,
  signal?: AbortSignal,
): Promise<GitRepository> {
  await requireSupportedGit(cwd, runner, signal);

  let topLevelResult;
  try {
    topLevelResult = await runner.run(
      ['rev-parse', '--path-format=absolute', '--show-toplevel'],
      { cwd, signal },
    );
  } catch (topLevelError) {
    try {
      const bare = await runner.run(['rev-parse', '--is-bare-repository'], {
        cwd,
        signal,
      });
      if (singleLine(bare.stdout, 'bare-repository state') === 'true') {
        throw new LaunchError(
          'bare-repository',
          FATAL_LAUNCH_MESSAGES.bareRepository,
          { cause: topLevelError, recovery: { kind: 'exit' } },
        );
      }
    } catch (bareError) {
      if (bareError instanceof LaunchError) {
        throw bareError;
      }
    }
    throw new LaunchError(
      'not-worktree',
      FATAL_LAUNCH_MESSAGES.notWorktree,
      { cause: topLevelError, recovery: { kind: 'exit' } },
    );
  }

  let root: string;
  try {
    root = await realpath(singleLine(topLevelResult.stdout, 'worktree root'));
  } catch (error) {
    throw new LaunchError(
      'not-worktree',
      FATAL_LAUNCH_MESSAGES.notWorktree,
      { cause: error, recovery: { kind: 'exit' } },
    );
  }

  const bareResult = await runner.run(['rev-parse', '--is-bare-repository'], {
    cwd: root,
    signal,
  });
  if (singleLine(bareResult.stdout, 'bare-repository state') !== 'false') {
    throw new LaunchError(
      'bare-repository',
      FATAL_LAUNCH_MESSAGES.bareRepository,
      { recovery: { kind: 'exit' } },
    );
  }

  let headOid: string;
  try {
    const head = await runner.run(
      ['rev-parse', '--verify', '--end-of-options', 'HEAD^{commit}'],
      { cwd: root, signal },
    );
    headOid = singleLine(head.stdout, 'HEAD commit');
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }
    throw new LaunchError(
      'empty-repository',
      FATAL_LAUNCH_MESSAGES.emptyRepository,
      { cause: error, recovery: { kind: 'exit' } },
    );
  }

  await probeMachineProtocols(root, headOid, runner, signal);
  return Object.freeze({ root, headOid });
}
