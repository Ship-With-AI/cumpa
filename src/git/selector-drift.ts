import {
  GitObjectIdSchema,
  type PinnedComparison,
} from '../contracts/comparison.js';
import {
  SelectorDriftResponseSchema,
  type SelectorDriftResponse,
  type SelectorDriftStatus,
} from '../contracts/api.js';
import { createGitRunner, type GitRunner } from './runner.js';

export type SelectorDriftObserver = Readonly<{
  observe: () => Promise<SelectorDriftResponse>;
}>;

export type SelectorDriftObserverOptions = Readonly<{
  readonly runner?: GitRunner;
}>;

type SelectorRole = 'base' | 'head';
type SelectorType = 'branch' | 'worktree';

type BranchDescriptor = Readonly<{
  readonly kind: 'branch';
  readonly role: SelectorRole;
  readonly label: string;
  readonly selectorType: SelectorType;
  readonly oldOid: string;
  readonly refName: string;
}>;

type WorktreeDescriptor = Readonly<{
  readonly kind: 'worktree';
  readonly role: SelectorRole;
  readonly label: string;
  readonly selectorType: SelectorType;
  readonly oldOid: string;
  readonly path: string;
}>;

type RetainedSelectorDescriptor = BranchDescriptor | WorktreeDescriptor;

type WorktreeRecord = Readonly<{
  readonly path?: string;
  readonly headOid?: string;
  readonly prunable: boolean;
  readonly bare: boolean;
}>;

const UNAVAILABLE_REASON = 'source-unavailable' as const;

function splitNul(buffer: Buffer): readonly Buffer[] {
  const fields: Buffer[] = [];
  let start = 0;
  for (let index = 0; index < buffer.length; index += 1) {
    if (buffer[index] === 0) {
      fields.push(buffer.subarray(start, index));
      start = index + 1;
    }
  }
  if (start < buffer.length) {
    fields.push(buffer.subarray(start));
  }
  return fields;
}

function parseWorktreeRecords(buffer: Buffer): readonly WorktreeRecord[] {
  const records: WorktreeRecord[] = [];
  let current: { path?: string; headOid?: string; prunable: boolean; bare: boolean } = {
    prunable: false,
    bare: false,
  };

  for (const field of splitNul(buffer)) {
    if (field.length === 0) {
      if (current.path !== undefined) {
        records.push(Object.freeze(current));
      }
      current = { prunable: false, bare: false };
      continue;
    }

    const separator = field.indexOf(0x20);
    const key = (separator === -1 ? field : field.subarray(0, separator)).toString('ascii');
    const value = separator === -1 ? undefined : field.subarray(separator + 1).toString('utf8');
    if (key === 'worktree') {
      if (current.path !== undefined) {
        records.push(Object.freeze(current));
      }
      current = { path: value, prunable: false, bare: false };
    } else if (key === 'HEAD') {
      current.headOid = value;
    } else if (key === 'prunable') {
      current.prunable = true;
    } else if (key === 'bare') {
      current.bare = true;
    }
  }

  if (current.path !== undefined) {
    records.push(Object.freeze(current));
  }
  return Object.freeze(records);
}
function retainDescriptor(
  role: SelectorRole,
  endpoint: PinnedComparison['base'],
): RetainedSelectorDescriptor | undefined {
  if (endpoint.source?.kind === 'branch') {
    return Object.freeze({
      kind: 'branch',
      role,
      label: endpoint.label,
      selectorType: 'branch',
      oldOid: endpoint.oid,
      refName: endpoint.source.refName,
    });
  }
  if (endpoint.source?.kind === 'worktree') {
    return Object.freeze({
      kind: 'worktree',
      role,
      label: endpoint.label,
      selectorType: 'worktree',
      oldOid: endpoint.oid,
      path: endpoint.source.path,
    });
  }
  return undefined;
}

function unchanged(role: SelectorRole): SelectorDriftStatus {
  return { kind: 'unchanged', role };
}

function unavailable(descriptor: RetainedSelectorDescriptor): SelectorDriftStatus {
  return {
    kind: 'unavailable',
    role: descriptor.role,
    label: descriptor.label,
    selectorType: descriptor.selectorType,
    oldOid: descriptor.oldOid,
    reason: UNAVAILABLE_REASON,
  };
}

function statusForCurrentOid(
  descriptor: RetainedSelectorDescriptor,
  currentOid: string,
): SelectorDriftStatus {
  return currentOid === descriptor.oldOid
    ? unchanged(descriptor.role)
    : {
        kind: 'moved',
        role: descriptor.role,
        label: descriptor.label,
        selectorType: descriptor.selectorType,
        oldOid: descriptor.oldOid,
        newOid: currentOid,
      };
}

function parseCommitOid(output: Buffer): string | undefined {
  const lines = output
    .toString('ascii')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length !== 1) {
    return undefined;
  }
  const parsed = GitObjectIdSchema.safeParse(lines[0]);
  return parsed.success ? parsed.data : undefined;
}

export function createSelectorDriftObserver(
  comparison: PinnedComparison,
  options: SelectorDriftObserverOptions = {},
): SelectorDriftObserver {
  const runner = options.runner ?? createGitRunner();
  const repositoryRoot = comparison.repositoryRoot;
  const descriptors = Object.freeze({
    base: retainDescriptor('base', comparison.base),
    head: retainDescriptor('head', comparison.head),
  });
  const listWorktrees = async (): Promise<readonly WorktreeRecord[]> => {
    try {
      const result = await runner.run(
        ['worktree', 'list', '--porcelain', '-z'],
        { cwd: repositoryRoot },
      );
      return parseWorktreeRecords(result.stdout);
    } catch {
      return [];
    }
  };

  const observeBranch = async (descriptor: BranchDescriptor): Promise<SelectorDriftStatus> => {
    try {
      const result = await runner.run(
        ['rev-parse', '--verify', '--end-of-options', `${descriptor.refName}^{commit}`],
        { cwd: repositoryRoot },
      );
      const currentOid = parseCommitOid(result.stdout);
      return currentOid === undefined ? unavailable(descriptor) : statusForCurrentOid(descriptor, currentOid);
    } catch {
      return unavailable(descriptor);
    }
  };

  const observeWorktree = async (
    descriptor: WorktreeDescriptor,
    records: readonly WorktreeRecord[],
  ): Promise<SelectorDriftStatus> => {
    const record = records.find(
      (candidate) =>
        candidate.path === descriptor.path && !candidate.prunable && !candidate.bare,
    );
    if (record === undefined || record.headOid === undefined) {
      return unavailable(descriptor);
    }
    const currentOid = GitObjectIdSchema.safeParse(record.headOid);
    return currentOid.success ? statusForCurrentOid(descriptor, currentOid.data) : unavailable(descriptor);
  };

  const observe = async (
    descriptor: RetainedSelectorDescriptor | undefined,
    role: SelectorRole,
    worktreeRecords: readonly WorktreeRecord[] | undefined,
  ): Promise<SelectorDriftStatus> => {
    if (descriptor === undefined) {
      return unchanged(role);
    }
    return descriptor.kind === 'branch'
      ? await observeBranch(descriptor)
      : await observeWorktree(descriptor, worktreeRecords ?? []);
  };

  return Object.freeze({
    async observe(): Promise<SelectorDriftResponse> {
      const hasWorktreeDescriptor =
        descriptors.base?.kind === 'worktree' || descriptors.head?.kind === 'worktree';
      const worktreeRecords = hasWorktreeDescriptor ? await listWorktrees() : undefined;
      return SelectorDriftResponseSchema.parse({
        base: await observe(descriptors.base, 'base', worktreeRecords),
        head: await observe(descriptors.head, 'head', worktreeRecords),
      });
    },
  });
}
