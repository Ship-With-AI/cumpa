import { realpath } from 'node:fs/promises';

import type { GitRunner } from './runner.js';

export interface GitRepository {
  readonly root: string;
}

export class RepositoryDiscoveryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'RepositoryDiscoveryError';
  }
}

function singleLine(buffer: Buffer, fact: string): string {
  const value = buffer.toString('utf8').trim();
  if (value.length === 0 || value.includes('\n') || value.includes('\0')) {
    throw new RepositoryDiscoveryError(`Git returned an invalid ${fact}`);
  }
  return value;
}

export async function discoverGitRepository(
  cwd: string,
  runner: GitRunner,
  signal?: AbortSignal,
): Promise<GitRepository> {
  const topLevelResult = await runner.run(
    ['rev-parse', '--path-format=absolute', '--show-toplevel'],
    { cwd, signal },
  );
  const reportedRoot = singleLine(topLevelResult.stdout, 'worktree root');
  const root = await realpath(reportedRoot);

  const bareResult = await runner.run(['rev-parse', '--is-bare-repository'], {
    cwd: root,
    signal,
  });
  if (singleLine(bareResult.stdout, 'bare-repository state') !== 'false') {
    throw new RepositoryDiscoveryError(
      'Diff Review requires a non-bare Git worktree',
    );
  }

  return Object.freeze({ root });
}
