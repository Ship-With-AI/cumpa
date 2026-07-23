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
  readonly registeredWorktreePath?: string;
  readonly alternateHeadRef?: 'refs/heads/alternate';
  git(arguments_: readonly string[]): Buffer;
  write(relativePath: string, content: string): Promise<void>;
  cleanup(): Promise<void>;
}

export interface GitFixtureOptions {
  readonly committedHeadChange?: boolean;
  readonly anchoredReview?: boolean;
  readonly registeredWorktree?: boolean;
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
  if (options.anchoredReview === true) {
    await mkdir(join(repositoryRoot, 'src'), { recursive: true });
    await writeFile(
      join(repositoryRoot, 'src', 'old-name.ts'),
      [
        'export const renamed = "base";',
        'export const baseOnly = "base path";',
        '',
      ].join('\n'),
    );
    await writeFile(
      join(repositoryRoot, 'src', 'changed.ts'),
      [
        ...Array.from(
          { length: 8 },
          (_, index) => `export const stableContext${index + 1} = ${index + 1};`,
        ),
        'export const changed = "base value";',
        ...Array.from(
          { length: 8 },
          (_, index) => `export const stableContext${index + 10} = ${index + 10};`,
        ),
        '',
      ].join('\n'),
    );
    await writeFile(
      join(repositoryRoot, 'src', 'context.ts'),
      Array.from({ length: 16 }, (_, index) => `export const line${index + 1} = ${index + 1};`).join('\n') +
        '\n',
    );
    await writeFile(join(repositoryRoot, 'src', 'deleted.ts'), 'export const deleted = true;\n');
  }
  invokeGit(['add', '-A']);
  invokeGit(['commit', '-m', 'base']);
  invokeGit(['switch', '-c', 'feature']);

  if (options.anchoredReview === true) {
    invokeGit(['mv', 'src/old-name.ts', 'src/new-name.ts']);
    await writeFile(
      join(repositoryRoot, 'src', 'new-name.ts'),
      [
        'export const renamed = "head";',
        'export const headOnly = "new path";',
        '',
      ].join('\n'),
    );
    await writeFile(
      join(repositoryRoot, 'src', 'changed.ts'),
      [
        ...Array.from(
          { length: 8 },
          (_, index) => `export const stableContext${index + 1} = ${index + 1};`,
        ),
        'export const changed = "head value";',
        ...Array.from(
          { length: 8 },
          (_, index) => `export const stableContext${index + 10} = ${index + 10};`,
        ),
        '',
      ].join('\n'),
    );
    await writeFile(join(repositoryRoot, 'src', 'added.ts'), 'export const added = true;\n');
    invokeGit(['rm', '--', 'src/deleted.ts']);
    invokeGit(['add', '-A']);
    invokeGit(['commit', '-m', 'anchored review changes']);
  } else if (options.committedHeadChange === false) {
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

  const alternateHeadRef =
    options.anchoredReview === true ? 'refs/heads/alternate' : undefined;
  if (alternateHeadRef !== undefined) {
    invokeGit(['switch', 'main']);
    invokeGit(['switch', '-c', 'alternate']);
    await writeFile(
      join(repositoryRoot, 'src', 'alternate.ts'),
      'export const alternate = true;\n',
    );
    invokeGit(['add', '-A']);
    invokeGit(['commit', '-m', 'alternate comparison']);
    invokeGit(['switch', 'feature']);
  }

  const registeredWorktreePath = options.registeredWorktree === true
    ? join(temporaryRoot, 'registered-feature-worktree')
    : undefined;
  if (registeredWorktreePath !== undefined) {
    invokeGit(['worktree', 'add', '--detach', registeredWorktreePath, pinnedHeadOid]);
  }

  const nestedCwd = join(repositoryRoot, 'nested', 'deep');
  await mkdir(nestedCwd, { recursive: true });

  return {
    root: await realpath(repositoryRoot),
    nestedCwd,
    baseRef: 'refs/heads/main',
    headRef: 'refs/heads/feature',
    ...(registeredWorktreePath === undefined
      ? {}
      : { registeredWorktreePath: await realpath(registeredWorktreePath) }),
    alternateHeadRef,
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

export type ValidationFixtureKind =
  | 'bare'
  | 'criss-cross'
  | 'equal'
  | 'independent'
  | 'non-repository'
  | 'removed-object'
  | 'unborn';

export interface ValidationGitFixture {
  readonly root: string;
  readonly nestedCwd: string;
  readonly baseRef: string;
  readonly headRef: string;
  readonly baseOid?: string;
  readonly headOid?: string;
  git(arguments_: readonly string[]): Buffer;
  removeObject(oid: string): Promise<void>;
  cleanup(): Promise<void>;
}

export async function createValidationGitFixture(
  kind: ValidationFixtureKind,
): Promise<ValidationGitFixture> {
  const temporaryRoot = await mkdtemp(
    join(tmpdir(), 'diff-review-validation-git-'),
  );
  const repositoryRoot = join(temporaryRoot, 'repository');
  const invokeGit = (arguments_: readonly string[]): Buffer =>
    execFileSync('git', [...safeGitArguments, ...arguments_], {
      cwd: repositoryRoot,
      encoding: 'buffer',
      env: gitEnvironment,
      maxBuffer: 4 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

  if (kind === 'non-repository') {
    await mkdir(repositoryRoot, { recursive: true });
  } else {
    execFileSync(
      'git',
      [
        ...safeGitArguments,
        'init',
        ...(kind === 'bare' ? ['--bare'] : ['--initial-branch=main']),
        repositoryRoot,
      ],
      {
        encoding: 'buffer',
        env: gitEnvironment,
        maxBuffer: 4 * 1024 * 1024,
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );
  }

  const nestedCwd = join(repositoryRoot, 'nested', 'deep');
  let baseRef = 'refs/heads/main';
  let headRef = 'refs/heads/feature';
  let baseOid: string | undefined;
  let headOid: string | undefined;

  if (kind !== 'bare' && kind !== 'non-repository') {
    invokeGit(['config', '--local', 'user.name', 'Diff Review Fixture']);
    invokeGit(['config', '--local', 'user.email', 'fixture@diff-review.invalid']);
    invokeGit(['config', '--local', 'commit.gpgSign', 'false']);
  }

  if (
    kind !== 'bare' &&
    kind !== 'non-repository' &&
    kind !== 'unborn'
  ) {
    await writeFile(join(repositoryRoot, 'root.txt'), 'root\n');
    invokeGit(['add', '--', 'root.txt']);
    invokeGit(['commit', '-m', 'root']);
    baseOid = invokeGit(['rev-parse', 'HEAD']).toString('ascii').trim();

    if (kind === 'equal') {
      invokeGit(['branch', 'feature', baseOid]);
      headOid = baseOid;
    } else if (kind === 'independent') {
      invokeGit(['switch', '--orphan', 'feature']);
      await rm(join(repositoryRoot, 'root.txt'), { force: true });
      await writeFile(join(repositoryRoot, 'independent.txt'), 'independent\n');
      invokeGit(['add', '--all']);
      invokeGit(['commit', '-m', 'independent root']);
      headOid = invokeGit(['rev-parse', 'HEAD']).toString('ascii').trim();
    } else if (kind === 'criss-cross') {
      invokeGit(['switch', '-c', 'left']);
      await writeFile(join(repositoryRoot, 'left.txt'), 'left\n');
      invokeGit(['add', '--', 'left.txt']);
      invokeGit(['commit', '-m', 'left parent']);
      const leftParent = invokeGit(['rev-parse', 'HEAD'])
        .toString('ascii')
        .trim();

      invokeGit(['switch', '-c', 'right', 'main']);
      await writeFile(join(repositoryRoot, 'right.txt'), 'right\n');
      invokeGit(['add', '--', 'right.txt']);
      invokeGit(['commit', '-m', 'right parent']);
      const rightParent = invokeGit(['rev-parse', 'HEAD'])
        .toString('ascii')
        .trim();

      invokeGit(['switch', 'left']);
      invokeGit(['merge', '--no-ff', '--no-edit', rightParent]);
      baseOid = invokeGit(['rev-parse', 'HEAD']).toString('ascii').trim();

      invokeGit(['switch', 'right']);
      invokeGit(['merge', '--no-ff', '--no-edit', leftParent]);
      headOid = invokeGit(['rev-parse', 'HEAD']).toString('ascii').trim();
      baseRef = 'refs/heads/left';
      headRef = 'refs/heads/right';
    } else {
      invokeGit(['switch', '-c', 'feature']);
      await writeFile(join(repositoryRoot, 'feature.txt'), 'feature\n');
      invokeGit(['add', '--', 'feature.txt']);
      invokeGit(['commit', '-m', 'feature']);
      headOid = invokeGit(['rev-parse', 'HEAD']).toString('ascii').trim();
    }
  }

  if (kind !== 'bare') {
    await mkdir(nestedCwd, { recursive: true });
  }

  return {
    root: await realpath(repositoryRoot),
    nestedCwd: kind === 'bare' ? repositoryRoot : nestedCwd,
    baseRef,
    headRef,
    ...(baseOid === undefined ? {} : { baseOid }),
    ...(headOid === undefined ? {} : { headOid }),
    git: invokeGit,
    async removeObject(oid) {
      const objectDirectory =
        kind === 'bare'
          ? join(repositoryRoot, 'objects')
          : join(repositoryRoot, '.git', 'objects');
      await rm(join(objectDirectory, oid.slice(0, 2), oid.slice(2)));
    },
    async cleanup() {
      await rm(temporaryRoot, { recursive: true, force: true });
    },
  };
}
