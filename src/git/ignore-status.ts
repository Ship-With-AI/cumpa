import { createGitRunner, GitRunnerError } from './runner.js';
import type { GitRunner } from './runner.js';

const cumpaIgnoreProbe = '.cumpa/.cumpa-ignore-probe';
const cumpaIgnoreArguments = [
  'check-ignore',
  '--no-index',
  '--quiet',
  '--',
  cumpaIgnoreProbe,
] as const;

export type CumpaIgnoreStatus =
  | Readonly<{ kind: 'ignored' }>
  | Readonly<{ kind: 'not-ignored' }>
  | Readonly<{ kind: 'unavailable' }>;

export interface InspectCumpaIgnoreOptions {
  readonly repositoryRoot: string;
}

export interface IgnoreStatusDependencies {
  readonly runner?: GitRunner;
}

export async function inspectCumpaIgnore(
  options: InspectCumpaIgnoreOptions,
  dependencies: IgnoreStatusDependencies = {},
): Promise<CumpaIgnoreStatus> {
  const runner = dependencies.runner ?? createGitRunner();
  try {
    await runner.run(cumpaIgnoreArguments, { cwd: options.repositoryRoot });
    return Object.freeze({ kind: 'ignored' });
  } catch (error) {
    if (error instanceof GitRunnerError && error.kind === 'exit' && error.exitCode === 1) {
      return Object.freeze({ kind: 'not-ignored' });
    }
    return Object.freeze({ kind: 'unavailable' });
  }
}
