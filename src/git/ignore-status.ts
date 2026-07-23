import { createGitRunner, GitRunnerError } from './runner.js';
import type { GitRunner } from './runner.js';

const diffReviewIgnoreProbe = '.diff-review/.diff-review-ignore-probe';
const diffReviewIgnoreArguments = [
  'check-ignore',
  '--no-index',
  '--quiet',
  '--',
  diffReviewIgnoreProbe,
] as const;

export type DiffReviewIgnoreStatus =
  | Readonly<{ kind: 'ignored' }>
  | Readonly<{ kind: 'not-ignored' }>
  | Readonly<{ kind: 'unavailable' }>;

export interface InspectDiffReviewIgnoreOptions {
  readonly repositoryRoot: string;
}

export interface IgnoreStatusDependencies {
  readonly runner?: GitRunner;
}

export async function inspectDiffReviewIgnore(
  options: InspectDiffReviewIgnoreOptions,
  dependencies: IgnoreStatusDependencies = {},
): Promise<DiffReviewIgnoreStatus> {
  const runner = dependencies.runner ?? createGitRunner();
  try {
    await runner.run(diffReviewIgnoreArguments, { cwd: options.repositoryRoot });
    return Object.freeze({ kind: 'ignored' });
  } catch (error) {
    if (error instanceof GitRunnerError && error.kind === 'exit' && error.exitCode === 1) {
      return Object.freeze({ kind: 'not-ignored' });
    }
    return Object.freeze({ kind: 'unavailable' });
  }
}
