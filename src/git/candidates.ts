import { GitObjectIdSchema } from '../contracts/comparison.js';
import {
  UNAVAILABLE_WORKTREE_REASON,
  type BranchCandidate,
  type SourceCandidate,
  type WorktreeCandidate,
} from '../domain/source.js';
import { discoverGitRepository } from './repository.js';
import { createGitRunner, type GitRunner } from './runner.js';

const BRANCH_FORMAT = [
  '%(refname)',
  '%(refname:short)',
  '%(objectname)',
  '',
].join('%00');

interface CandidateDiscoveryOptions {
  readonly cwd: string;
  readonly signal?: AbortSignal;
}

interface CandidateDiscoveryDependencies {
  readonly runner?: GitRunner;
}

interface BranchRecord {
  readonly refName: string;
  readonly label: string;
  readonly commitOid: string;
}

interface WorktreeRecord {
  path?: string;
  headOid?: string;
  branchRef?: string;
  detached: boolean;
  prunable: boolean;
  bare: boolean;
}

function splitNul(buffer: Buffer): Buffer[] {
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

function parseBranchRecords(buffer: Buffer): BranchRecord[] {
  const fields = splitNul(buffer);
  const records: BranchRecord[] = [];
  for (let index = 0; index + 2 < fields.length; index += 3) {
    let refField = fields[index]!;
    if (refField[0] === 0x0a) {
      refField = refField.subarray(1);
    }
    if (refField.length === 0) {
      continue;
    }
    const refName = refField.toString('utf8');
    const label = fields[index + 1]!.toString('utf8');
    const commitOid = GitObjectIdSchema.parse(
      fields[index + 2]!.toString('ascii'),
    );
    records.push({ refName, label, commitOid });
  }
  return records;
}

function parseWorktreeRecords(buffer: Buffer): WorktreeRecord[] {
  const records: WorktreeRecord[] = [];
  let current: WorktreeRecord = {
    detached: false,
    prunable: false,
    bare: false,
  };

  for (const field of splitNul(buffer)) {
    if (field.length === 0) {
      if (current.path !== undefined) {
        records.push(current);
      }
      current = { detached: false, prunable: false, bare: false };
      continue;
    }

    const separator = field.indexOf(0x20);
    const key =
      separator === -1
        ? field.toString('ascii')
        : field.subarray(0, separator).toString('ascii');
    const value =
      separator === -1 ? undefined : field.subarray(separator + 1).toString('utf8');

    switch (key) {
      case 'worktree':
        current.path = value;
        break;
      case 'HEAD':
        current.headOid = value;
        break;
      case 'branch':
        current.branchRef = value;
        break;
      case 'detached':
        current.detached = true;
        break;
      case 'prunable':
        current.prunable = true;
        break;
      case 'bare':
        current.bare = true;
        break;
    }
  }

  if (current.path !== undefined) {
    records.push(current);
  }
  return records;
}

export async function discoverSourceCandidates(
  options: CandidateDiscoveryOptions,
  dependencies: CandidateDiscoveryDependencies = {},
): Promise<readonly SourceCandidate[]> {
  const runner = dependencies.runner ?? createGitRunner();
  const repository = await discoverGitRepository(
    options.cwd,
    runner,
    options.signal,
  );
  const [branchResult, worktreeResult] = await Promise.all([
    runner.run(
      [
        'for-each-ref',
        '--sort=refname',
        `--format=${BRANCH_FORMAT}`,
        'refs/heads',
      ],
      { cwd: repository.root, signal: options.signal },
    ),
    runner.run(['worktree', 'list', '--porcelain', '-z'], {
      cwd: repository.root,
      signal: options.signal,
    }),
  ]);
  const branchRecords = parseBranchRecords(branchResult.stdout);
  const worktreeRecords = parseWorktreeRecords(worktreeResult.stdout);
  const shortOidByFullOid = new Map<string, string>();

  const abbreviate = async (oid: string): Promise<string> => {
    const known = shortOidByFullOid.get(oid);
    if (known !== undefined) {
      return known;
    }
    const result = await runner.run(['rev-parse', '--short=12', oid], {
      cwd: repository.root,
      signal: options.signal,
    });
    const shortOid = result.stdout.toString('ascii').trim();
    shortOidByFullOid.set(oid, shortOid);
    return shortOid;
  };

  const candidates: SourceCandidate[] = [];
  for (const record of branchRecords) {
    const candidate: BranchCandidate = {
      kind: 'branch',
      id: `branch:${record.refName}`,
      label: record.label,
      refName: record.refName,
      commitOid: record.commitOid,
      shortOid: await abbreviate(record.commitOid),
    };
    candidates.push(Object.freeze(candidate));
  }

  for (const record of worktreeRecords) {
    if (record.path === undefined) {
      continue;
    }

    let commitOid: string | undefined;
    if (record.headOid !== undefined) {
      const parsed = GitObjectIdSchema.safeParse(record.headOid);
      if (parsed.success) {
        commitOid = parsed.data;
      }
    }
    let availability: WorktreeCandidate['availability'] =
      record.prunable || record.bare ? 'unavailable' : 'clean';

    if (availability !== 'unavailable') {
      try {
        const headResult = await runner.run(
          ['rev-parse', '--verify', '--end-of-options', 'HEAD^{commit}'],
          { cwd: record.path, signal: options.signal },
        );
        commitOid = GitObjectIdSchema.parse(
          headResult.stdout.toString('ascii').trim(),
        );
        const statusResult = await runner.run(
          [
            'status',
            '--porcelain=v1',
            '-z',
            '--untracked-files=normal',
          ],
          { cwd: record.path, signal: options.signal },
        );
        availability = statusResult.stdout.length === 0 ? 'clean' : 'dirty';
      } catch (error) {
        if (options.signal?.aborted) {
          throw error;
        }
        availability = 'unavailable';
      }
    }

    const branchRef = record.branchRef;
    const candidate: WorktreeCandidate = {
      kind: 'worktree',
      id: `worktree:${record.path}`,
      label:
        branchRef === undefined
          ? 'Detached HEAD'
          : branchRef.replace(/^refs\/heads\//, ''),
      path: record.path,
      ...(branchRef === undefined ? {} : { branchRef }),
      detached: record.detached || branchRef === undefined,
      ...(commitOid === undefined
        ? {}
        : {
            commitOid,
            shortOid: await abbreviate(commitOid),
          }),
      availability,
      ...(availability === 'unavailable'
        ? { unavailableReason: UNAVAILABLE_WORKTREE_REASON }
        : {}),
      isCurrentCheckout: record.path === repository.root,
    };
    candidates.push(Object.freeze(candidate));
  }

  return Object.freeze(candidates);
}
