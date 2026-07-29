import { createGitRunner, GitRunnerError } from './runner.js';
import type { GitRunner } from './runner.js';

const compareIgnoreProbe = '.compare/.compare-ignore-probe';
const compareIgnoreArguments = [
  'check-ignore',
  '--no-index',
  '--quiet',
  '--',
  compareIgnoreProbe,
] as const;

export type CompareIgnoreStatus =
  | Readonly<{ kind: 'ignored' }>
  | Readonly<{ kind: 'not-ignored' }>
  | Readonly<{ kind: 'unavailable' }>;

export interface InspectCompareIgnoreOptions {
  readonly repositoryRoot: string;
}

export interface IgnoreStatusDependencies {
  readonly runner?: GitRunner;
}

export async function inspectCompareIgnore(
  options: InspectCompareIgnoreOptions,
  dependencies: IgnoreStatusDependencies = {},
): Promise<CompareIgnoreStatus> {
  const runner = dependencies.runner ?? createGitRunner();
  try {
    await runner.run(compareIgnoreArguments, { cwd: options.repositoryRoot });
    return Object.freeze({ kind: 'ignored' });
  } catch (error) {
    if (error instanceof GitRunnerError && error.kind === 'exit' && error.exitCode === 1) {
      return Object.freeze({ kind: 'not-ignored' });
    }
    return Object.freeze({ kind: 'unavailable' });
  }
}
