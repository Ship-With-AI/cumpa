import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const gitEnvironment = {
  ...process.env,
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_EXTERNAL_DIFF: '',
  GIT_OPTIONAL_LOCKS: '0',
  GIT_TERMINAL_PROMPT: '0',
};

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

export interface GitFixture {
  readonly root: string;
  readonly nestedCwd: string;
  readonly baseRef: 'refs/heads/main';
  readonly headRef: 'refs/heads/feature';
  readonly futureHeadOid: string;
  git(arguments_: readonly string[]): Buffer;
  write(relativePath: string, content: string): Promise<void>;
  cleanup(): Promise<void>;
}

export interface GitFixtureOptions {
  readonly committedHeadChange?: boolean;
}

export async function createGitFixture(
  options: GitFixtureOptions = {},
): Promise<GitFixture> {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'diff-review-git-'));
  const repositoryRoot = join(temporaryRoot, 'repository');

  const invokeGit = (arguments_: readonly string[]): Buffer =>
    execFileSync('git', [...safeGitArguments, ...arguments_], {
      cwd: repositoryRoot,
      encoding: 'buffer',
      env: gitEnvironment,
      maxBuffer: 4 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

  execFileSync(
    'git',
    [...safeGitArguments, 'init', '--initial-branch=main', repositoryRoot],
    {
      encoding: 'buffer',
      env: gitEnvironment,
      maxBuffer: 4 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  );
  invokeGit(['config', '--local', 'user.name', 'Diff Review Fixture']);
  invokeGit(['config', '--local', 'user.email', 'fixture@diff-review.invalid']);
  invokeGit(['config', '--local', 'commit.gpgSign', 'false']);

  await writeFile(join(repositoryRoot, 'tracked.txt'), 'base\n');
  invokeGit(['add', '--', 'tracked.txt']);
  invokeGit(['commit', '-m', 'base']);
  invokeGit(['switch', '-c', 'feature']);

  if (options.committedHeadChange === false) {
    invokeGit(['commit', '--allow-empty', '-m', 'empty feature head']);
  } else {
    await writeFile(join(repositoryRoot, 'committed.txt'), 'committed\n');
    invokeGit(['add', '--', 'committed.txt']);
    invokeGit(['commit', '-m', 'feature change']);
  }

  const pinnedHeadOid = invokeGit(['rev-parse', 'HEAD']).toString('ascii').trim();
  invokeGit(['commit', '--allow-empty', '-m', 'future feature head']);
  const futureHeadOid = invokeGit(['rev-parse', 'HEAD']).toString('ascii').trim();
  invokeGit(['update-ref', 'refs/heads/feature', pinnedHeadOid]);

  const nestedCwd = join(repositoryRoot, 'nested', 'deep');
  await mkdir(nestedCwd, { recursive: true });

  return {
    root: await realpath(repositoryRoot),
    nestedCwd,
    baseRef: 'refs/heads/main',
    headRef: 'refs/heads/feature',
    futureHeadOid,
    git: invokeGit,
    async write(relativePath, content) {
      const absolutePath = join(repositoryRoot, relativePath);
      await mkdir(dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, content);
    },
    async cleanup() {
      await rm(temporaryRoot, { recursive: true, force: true });
    },
  };
}
