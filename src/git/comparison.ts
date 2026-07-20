import {
  ComparisonSelectionSchema,
  GitObjectIdSchema,
  PinnedComparisonSchema,
  type ComparisonSelection,
  type PinnedComparison,
} from '../contracts/comparison.js';
import {
  BASE_RECOVERY,
  FATAL_LAUNCH_MESSAGES,
  HEAD_RECOVERY,
  LaunchError,
  type PickerRecovery,
  type SelectionRole,
} from '../domain/errors.js';
import { discoverGitRepository } from './repository.js';
import {
  createGitRunner,
  GitRunnerError,
  type GitRunner,
} from './runner.js';
import { createChangedFileInventory } from './inventory.js';

export interface CreatePinnedComparisonOptions {
  readonly cwd: string;
  readonly base: ComparisonSelection;
  readonly head: ComparisonSelection;
  readonly signal?: AbortSignal;
}

export interface PinnedComparisonDependencies {
  readonly runner?: GitRunner;
}

function parseSingleLine(buffer: Buffer, fact: string): string {
  const lines = buffer
    .toString('ascii')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length !== 1) {
    throw new Error(
      `Expected exactly one ${fact}; Git returned ${lines.length}`,
    );
  }
  return lines[0]!;
}

function recoveryFor(role: SelectionRole): PickerRecovery {
  return role === 'base' ? BASE_RECOVERY : HEAD_RECOVERY;
}

function endpointMessage(
  selection: ComparisonSelection,
  role: SelectionRole,
): string {
  return selection.source?.kind === 'worktree'
    ? `The selected ${role} worktree cannot resolve a committed HEAD. Choose another ${role} or repair the worktree with Git.`
    : `The selected ${role} “${selection.label}” no longer resolves to a commit. Choose another ${role} or repair the ref with Git.`;
}

async function resolveCommit(
  selection: ComparisonSelection,
  role: SelectionRole,
  repositoryRoot: string,
  runner: GitRunner,
  signal?: AbortSignal,
): Promise<string> {
  try {
    const result = await runner.run(
      [
        'rev-parse',
        '--verify',
        '--end-of-options',
        `${selection.revision}^{commit}`,
      ],
      { cwd: repositoryRoot, signal },
    );
    return GitObjectIdSchema.parse(
      parseSingleLine(result.stdout, `${role} commit object`),
    );
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }
    throw new LaunchError(
      'endpoint-unavailable',
      endpointMessage(selection, role),
      { cause: error, recovery: recoveryFor(role) },
    );
  }
}

async function verifyCommit(
  oid: string,
  role: SelectionRole | 'merge-base',
  repositoryRoot: string,
  runner: GitRunner,
  signal?: AbortSignal,
): Promise<void> {
  try {
    await runner.run(['cat-file', '-e', `${oid}^{commit}`], {
      cwd: repositoryRoot,
      signal,
    });
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }
    throw new LaunchError(
      'object-unavailable',
      `Required Git object ${oid.slice(0, 12)} is missing or unreadable. Repair the repository's object data with Git, then retry.`,
      {
        cause: error,
        recovery: role === 'base' ? BASE_RECOVERY : HEAD_RECOVERY,
      },
    );
  }
}

function parseMergeBases(
  buffer: Buffer,
  objectFormat: 'sha1' | 'sha256',
): readonly string[] {
  const expectedLength = objectFormat === 'sha1' ? 40 : 64;
  const lines =
    buffer.length === 0
      ? []
      : buffer
          .toString('ascii')
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
  for (const line of lines) {
    if (
      line.length !== expectedLength ||
      !/^[0-9a-f]+$/u.test(line) ||
      !GitObjectIdSchema.safeParse(line).success
    ) {
      throw new LaunchError(
        'git-unsupported',
        FATAL_LAUNCH_MESSAGES.gitUnsupported,
        { recovery: { kind: 'exit' } },
      );
    }
  }
  return lines;
}

export async function createPinnedComparison(
  options: CreatePinnedComparisonOptions,
  dependencies: PinnedComparisonDependencies = {},
): Promise<PinnedComparison> {
  if (options.cwd.length === 0) {
    throw new LaunchError(
      'not-worktree',
      FATAL_LAUNCH_MESSAGES.notWorktree,
      { recovery: { kind: 'exit' } },
    );
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
    throw new LaunchError(
      'git-unsupported',
      FATAL_LAUNCH_MESSAGES.gitUnsupported,
      { recovery: { kind: 'exit' } },
    );
  }

  const baseOid = await resolveCommit(
    baseSelection,
    'base',
    repository.root,
    runner,
    options.signal,
  );
  const headOid = await resolveCommit(
    headSelection,
    'head',
    repository.root,
    runner,
    options.signal,
  );

  if (baseOid === headOid) {
    throw new LaunchError(
      'equal-commits',
      'Base and head resolve to the same commit. Choose a different head.',
      { recovery: HEAD_RECOVERY },
    );
  }

  await verifyCommit(
    baseOid,
    'base',
    repository.root,
    runner,
    options.signal,
  );
  await verifyCommit(
    headOid,
    'head',
    repository.root,
    runner,
    options.signal,
  );

  let mergeBaseOutput = Buffer.alloc(0);
  try {
    const mergeBaseResult = await runner.run(
      ['merge-base', '--all', baseOid, headOid],
      { cwd: repository.root, signal: options.signal },
    );
    mergeBaseOutput = mergeBaseResult.stdout;
  } catch (error) {
    if (
      !(
        error instanceof GitRunnerError &&
        error.kind === 'exit' &&
        error.exitCode === 1 &&
        error.stderr.length === 0
      )
    ) {
      throw error;
    }
  }

  const mergeBases = parseMergeBases(mergeBaseOutput, objectFormat);
  if (mergeBases.length === 0) {
    throw new LaunchError(
      'unrelated-histories',
      'Base and head have unrelated histories; Git could not find a merge base. Choose a different head or go back to change base.',
      { recovery: HEAD_RECOVERY },
    );
  }
  if (mergeBases.length > 1) {
    throw new LaunchError(
      'multiple-merge-bases',
      'Base and head have multiple merge bases, so this comparison cannot be pinned unambiguously. Choose a different head or go back to change base.',
      { recovery: HEAD_RECOVERY },
    );
  }
  const mergeBaseOid = mergeBases[0]!;

  await verifyCommit(
    baseOid,
    'base',
    repository.root,
    runner,
    options.signal,
  );
  await verifyCommit(
    headOid,
    'head',
    repository.root,
    runner,
    options.signal,
  );
  await verifyCommit(
    mergeBaseOid,
    'merge-base',
    repository.root,
    runner,
    options.signal,
  );

  const changedFiles = await createChangedFileInventory(
    {
      repositoryRoot: repository.root,
      mergeBaseOid,
      headOid,
      objectFormat,
      signal: options.signal,
    },
    { runner },
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
    changedFiles,
    hasCommittedChanges: changedFiles.length > 0,
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
