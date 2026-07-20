import {
  ComparisonSelectionSchema,
  GitObjectIdSchema,
  PinnedComparisonSchema,
  type ComparisonSelection,
  type PinnedComparison,
} from '../contracts/comparison.js';
import { discoverGitRepository } from './repository.js';
import { createGitRunner, type GitRunner } from './runner.js';

export interface CreatePinnedComparisonOptions {
  readonly cwd: string;
  readonly base: ComparisonSelection;
  readonly head: ComparisonSelection;
  readonly signal?: AbortSignal;
}

export interface PinnedComparisonDependencies {
  readonly runner?: GitRunner;
}

export class PinnedComparisonError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'PinnedComparisonError';
  }
}

function parseSingleLine(buffer: Buffer, fact: string): string {
  const lines = buffer
    .toString('ascii')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length !== 1) {
    throw new PinnedComparisonError(
      `Expected exactly one ${fact}; Git returned ${lines.length}`,
    );
  }
  return lines[0]!;
}

async function resolveCommit(
  revision: string,
  repositoryRoot: string,
  runner: GitRunner,
  signal?: AbortSignal,
): Promise<string> {
  const result = await runner.run(
    ['rev-parse', '--verify', '--end-of-options', `${revision}^{commit}`],
    { cwd: repositoryRoot, signal },
  );
  return GitObjectIdSchema.parse(parseSingleLine(result.stdout, 'commit object'));
}

async function verifyCommit(
  oid: string,
  repositoryRoot: string,
  runner: GitRunner,
  signal?: AbortSignal,
): Promise<void> {
  await runner.run(['cat-file', '-e', `${oid}^{commit}`], {
    cwd: repositoryRoot,
    signal,
  });
}

export async function createPinnedComparison(
  options: CreatePinnedComparisonOptions,
  dependencies: PinnedComparisonDependencies = {},
): Promise<PinnedComparison> {
  if (options.cwd.length === 0) {
    throw new PinnedComparisonError('Comparison cwd must not be empty');
  }

  const baseSelection = ComparisonSelectionSchema.parse(options.base);
  const headSelection = ComparisonSelectionSchema.parse(options.head);
  const runner = dependencies.runner ?? createGitRunner();
  const repository = await discoverGitRepository(
    options.cwd,
    runner,
    options.signal,
  );

  const objectFormatResult = await runner.run(
    ['rev-parse', '--show-object-format=storage'],
    { cwd: repository.root, signal: options.signal },
  );
  const objectFormat = parseSingleLine(
    objectFormatResult.stdout,
    'object format',
  );
  if (objectFormat !== 'sha1' && objectFormat !== 'sha256') {
    throw new PinnedComparisonError(
      `Unsupported Git object format: ${objectFormat}`,
    );
  }

  const baseOid = await resolveCommit(
    baseSelection.revision,
    repository.root,
    runner,
    options.signal,
  );
  const headOid = await resolveCommit(
    headSelection.revision,
    repository.root,
    runner,
    options.signal,
  );

  const mergeBaseResult = await runner.run(
    ['merge-base', '--all', baseOid, headOid],
    { cwd: repository.root, signal: options.signal },
  );
  const mergeBaseOid = GitObjectIdSchema.parse(
    parseSingleLine(mergeBaseResult.stdout, 'merge base'),
  );

  await verifyCommit(baseOid, repository.root, runner, options.signal);
  await verifyCommit(headOid, repository.root, runner, options.signal);
  await verifyCommit(mergeBaseOid, repository.root, runner, options.signal);

  const committedChangeResult = await runner.run(
    [
      'diff',
      '--name-only',
      '-z',
      '--no-ext-diff',
      '--no-textconv',
      mergeBaseOid,
      headOid,
      '--',
    ],
    { cwd: repository.root, signal: options.signal },
  );

  const comparison = PinnedComparisonSchema.parse({
    repositoryRoot: repository.root,
    objectFormat,
    base: {
      label: baseSelection.label,
      oid: baseOid,
      ...(baseSelection.source === undefined
        ? {}
        : { source: baseSelection.source }),
    },
    head: {
      label: headSelection.label,
      oid: headOid,
      ...(headSelection.source === undefined
        ? {}
        : { source: headSelection.source }),
    },
    mergeBaseOid,
    hasCommittedChanges: committedChangeResult.stdout.length > 0,
  });

  if (comparison.base.source !== undefined) {
    Object.freeze(comparison.base.source);
  }
  if (comparison.head.source !== undefined) {
    Object.freeze(comparison.head.source);
  }
  Object.freeze(comparison.base);
  Object.freeze(comparison.head);
  return Object.freeze(comparison);
}
