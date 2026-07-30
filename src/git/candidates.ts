import { isUtf8 } from 'node:buffer';
import { isAbsolute } from 'node:path';

import { GitObjectIdSchema } from '../contracts/comparison.js';
import {
  UNAVAILABLE_WORKTREE_REASON,
  type BranchCandidate,
  type SourceCandidate,
  type WorktreeCandidate,
} from '../domain/source.js';
import { discoverGitRepository } from './repository.js';
import {
  createGitRunner,
  GitRunnerError,
  type GitRunResult,
  type GitRunner,
} from './runner.js';

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

export interface SourceDiscovery {
  readonly initialCandidates: readonly SourceCandidate[];
  readonly searchBranches: (
    term: string,
    signal?: AbortSignal,
  ) => Promise<readonly BranchCandidate[]>;
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

function stripGitLineTerminator(buffer: Buffer): Buffer {
  if (buffer.at(-1) !== 0x0a) {
    throw new Error('Git line output ended without a line terminator');
  }
  return buffer.subarray(0, -1);
}

function splitNul(buffer: Buffer): Buffer[] {
  if (buffer.length !== 0 && buffer.at(-1) !== 0) {
    throw new Error('Git NUL output ended without a record terminator');
  }

  const fields: Buffer[] = [];
  let start = 0;
  for (let index = 0; index < buffer.length; index += 1) {
    if (buffer[index] === 0) {
      fields.push(buffer.subarray(start, index));
      start = index + 1;
    }
  }
  return fields;
}

function splitNulLineTerminated(buffer: Buffer): Buffer[] {
  return buffer.length === 0 ? [] : splitNul(stripGitLineTerminator(buffer));
}

function parseLocalBranchRef(field: Buffer, source: string): string {
  if (!isUtf8(field)) {
    throw new Error(`${source} contained invalid UTF-8 branch identity`);
  }
  const refName = field.toString('utf8');
  if (
    refName.length === 0 ||
    !refName.startsWith('refs/heads/') ||
    refName.length === 'refs/heads/'.length
  ) {
    throw new Error(`${source} contained an invalid local branch identity`);
  }
  return refName;
}

function parseBranchRecords(buffer: Buffer): BranchRecord[] {
  const fields = splitNulLineTerminated(buffer);
  if (fields.length % 3 !== 0) {
    throw new Error('Git branch output ended with an incomplete record');
  }
  const records: BranchRecord[] = [];
  const seenRefNames = new Set<string>();
  for (let index = 0; index < fields.length; index += 3) {
    let refField = fields[index]!;
    if (index > 0) {
      if (refField[0] !== 0x0a) {
        throw new Error('Git branch output omitted a record separator');
      }
      refField = refField.subarray(1);
    }
    const labelField = fields[index + 1]!;
    if (!isUtf8(labelField)) {
      throw new Error('Git branch output contained invalid UTF-8');
    }
    const refName = parseLocalBranchRef(refField, 'Git branch output');
    if (seenRefNames.has(refName)) {
      throw new Error('Git branch output contained duplicate local branch identity');
    }
    seenRefNames.add(refName);
    const label = labelField.toString('utf8');
    const commitOid = GitObjectIdSchema.parse(
      fields[index + 2]!.toString('latin1'),
    );
    if (label.length === 0) {
      throw new Error('Git branch output contained an invalid local branch record');
    }
    records.push({ refName, label, commitOid });
  }
  return records;
}

function escapeBranchPattern(term: string): string {
  return `*${term.replace(/[\\*?\[\]]/g, '\\$&')}*`;
}

function parseAbbreviationRecords(buffer: Buffer): Map<string, string> {
  const fields = splitNulLineTerminated(buffer);
  if (fields.length % 2 !== 0) {
    throw new Error('Git abbreviation output ended with an incomplete record');
  }

  const shortByFull = new Map<string, string>();
  for (let index = 0; index < fields.length; index += 2) {
    let fullField = fields[index]!;
    if (index > 0) {
      if (fullField[0] !== 0x0a) {
        throw new Error('Git abbreviation output omitted a record separator');
      }
      fullField = fullField.subarray(1);
    }
    const fullOid = GitObjectIdSchema.parse(fullField.toString('latin1'));
    const shortOid = fields[index + 1]!.toString('latin1');
    if (
      !/^[0-9a-f]{12,}$/.test(shortOid) ||
      shortOid.length > fullOid.length ||
      !fullOid.startsWith(shortOid) ||
      shortByFull.has(fullOid)
    ) {
      throw new Error('Git abbreviation output contained an invalid record');
    }
    shortByFull.set(fullOid, shortOid);
  }
  return shortByFull;
}

function parseWorktreeRecords(buffer: Buffer): WorktreeRecord[] {
  const records: WorktreeRecord[] = [];
  let current: WorktreeRecord = {
    detached: false,
    prunable: false,
    bare: false,
  };
  let open = false;
  const seen = new Set<string>();

  for (const field of splitNul(buffer)) {
    if (field.length === 0) {
      if (!open || current.path === undefined) {
        throw new Error('Git worktree output contained an incomplete record');
      }
      records.push(current);
      current = { detached: false, prunable: false, bare: false };
      open = false;
      seen.clear();
      continue;
    }
    open = true;

    const separator = field.indexOf(0x20);
    const key =
      separator === -1
        ? field.toString('ascii')
        : field.subarray(0, separator).toString('ascii');
    const value = separator === -1 ? undefined : field.subarray(separator + 1);
    if (seen.size === 0 && key !== 'worktree') {
      throw new Error('Git worktree output omitted leading worktree field');
    }
    if (seen.has(key)) {
      throw new Error('Git worktree output contained a duplicate field');
    }
    seen.add(key);

    switch (key) {
      case 'worktree': {
        if (value === undefined || value.length === 0 || !isUtf8(value)) {
          throw new Error('Git worktree output contained an invalid worktree path');
        }
        const path = value.toString('utf8');
        if (!isAbsolute(path)) {
          throw new Error('Git worktree output contained a non-absolute worktree path');
        }
        current.path = path;
        break;
      }
      case 'HEAD':
        if (value === undefined || value.length === 0) {
          throw new Error('Git worktree output omitted a HEAD value');
        }
        current.headOid = GitObjectIdSchema.parse(value.toString('latin1'));
        break;
      case 'branch':
        if (value === undefined) {
          throw new Error('Git worktree output omitted a branch identity');
        }
        current.branchRef = parseLocalBranchRef(
          value,
          'Git worktree output',
        );
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
      case 'locked':
        break;
      default:
        throw new Error('Git worktree output contained an unknown field');
    }
  }

  if (open) {
    throw new Error('Git worktree output ended before a record separator');
  }
  return records;
}

export async function discoverSourceCandidates(
  options: CandidateDiscoveryOptions,
  dependencies: CandidateDiscoveryDependencies = {},
): Promise<SourceDiscovery> {
  const runner = dependencies.runner ?? createGitRunner();
  const repository = await discoverGitRepository(
    options.cwd,
    runner,
    options.signal,
  );
  options.signal?.throwIfAborted();
  const worktreeResult = await runner.run(
    ['worktree', 'list', '--porcelain', '-z'],
    { cwd: repository.root, signal: options.signal },
  );
  options.signal?.throwIfAborted();
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
    options.signal?.throwIfAborted();
    const shortOid = stripGitLineTerminator(result.stdout).toString('latin1');
    if (
      !/^[0-9a-f]{12,}$/.test(shortOid) ||
      shortOid.length > oid.length ||
      !oid.startsWith(shortOid)
    ) {
      throw new Error('Git worktree abbreviation output contained an invalid OID');
    }
    shortOidByFullOid.set(oid, shortOid);
    return shortOid;
  };

  const worktreeCandidates: WorktreeCandidate[] = [];
  let currentBranch: BranchCandidate | undefined;
  for (const record of worktreeRecords) {
    if (record.path === undefined) {
      continue;
    }

    // A missing porcelain HEAD is Git's valid unborn-worktree representation.
    let commitOid = record.headOid;
    let availability: WorktreeCandidate['availability'] =
      record.prunable || record.bare ? 'unavailable' : 'clean';

    if (availability !== 'unavailable') {
      let headResult: GitRunResult | undefined;
      try {
        headResult = await runner.run(
          ['rev-parse', '--verify', '--end-of-options', 'HEAD^{commit}'],
          { cwd: record.path, signal: options.signal },
        );
        options.signal?.throwIfAborted();
      } catch (error) {
        if (options.signal?.aborted) {
          throw error;
        }
        availability = 'unavailable';
      }
      if (headResult !== undefined) {
        commitOid = GitObjectIdSchema.parse(
          stripGitLineTerminator(headResult.stdout).toString('latin1'),
        );
        try {
          const statusResult = await runner.run(
            [
              'status',
              '--porcelain=v1',
              '-z',
              '--untracked-files=normal',
            ],
            { cwd: record.path, signal: options.signal },
          );
          options.signal?.throwIfAborted();
          availability = statusResult.stdout.length === 0 ? 'clean' : 'dirty';
        } catch (error) {
          if (options.signal?.aborted) {
            throw error;
          }
          availability = 'unavailable';
        }
      }
    }

    const branchRef = record.branchRef;
    const shortOid =
      commitOid === undefined ? undefined : await abbreviate(commitOid);
    options.signal?.throwIfAborted();
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
      ...(commitOid === undefined || shortOid === undefined
        ? {}
        : { commitOid, shortOid }),
      availability,
      ...(availability === 'unavailable'
        ? { unavailableReason: UNAVAILABLE_WORKTREE_REASON }
        : {}),
      isCurrentCheckout: record.path === repository.root,
    };
    worktreeCandidates.push(Object.freeze(candidate));

    if (
      record.path === repository.root &&
      branchRef !== undefined &&
      commitOid !== undefined &&
      shortOid !== undefined
    ) {
      currentBranch = Object.freeze({
        kind: 'branch',
        id: `branch:${branchRef}`,
        label: branchRef.replace(/^refs\/heads\//, ''),
        refName: branchRef,
        commitOid,
        shortOid,
      });
    }
  }

  options.signal?.throwIfAborted();
  return Object.freeze({
    initialCandidates: Object.freeze([
      ...(currentBranch === undefined ? [] : [currentBranch]),
      ...worktreeCandidates,
    ]),
    async searchBranches(
      term: string,
      signal?: AbortSignal,
    ): Promise<readonly BranchCandidate[]> {
      if (signal?.aborted) {
        throw new GitRunnerError('aborted', 'Git command was cancelled', {
          cause: signal.reason,
        });
      }
      if (term.length === 0) {
        return Object.freeze([]);
      }

      const branchResult = await runner.run(
        [
          'branch',
          '--list',
          '--ignore-case',
          '--no-color',
          '--sort=refname',
          `--format=${BRANCH_FORMAT}`,
          '--',
          escapeBranchPattern(term),
        ],
        { cwd: repository.root, signal },
      );
      signal?.throwIfAborted();
      const query = term.toLowerCase();
      const records = parseBranchRecords(branchResult.stdout)
        .filter((record) => record.label.toLowerCase().includes(query))
        .sort((left, right) =>
          Buffer.compare(
            Buffer.from(left.refName, 'utf8'),
            Buffer.from(right.refName, 'utf8'),
          ),
        );
      signal?.throwIfAborted();
      if (records.length === 0) {
        return Object.freeze([]);
      }

      const requestedOids = [...new Set(records.map((record) => record.commitOid))];
      const abbreviationResult = await runner.run(
        [
          'log',
          '--no-walk=unsorted',
          '--abbrev=12',
          '--format=%H%x00%h%x00',
          '--stdin',
        ],
        {
          cwd: repository.root,
          input: Buffer.from(`${requestedOids.join('\n')}\n`, 'ascii'),
          signal,
        },
      );
      signal?.throwIfAborted();
      const shortByFull = parseAbbreviationRecords(abbreviationResult.stdout);
      if (
        shortByFull.size !== requestedOids.length ||
        requestedOids.some((oid) => !shortByFull.has(oid))
      ) {
        throw new Error('Git abbreviation output did not match requested objects');
      }
      signal?.throwIfAborted();
      return Object.freeze(
        records.map((record) =>
          Object.freeze({
            kind: 'branch' as const,
            id: `branch:${record.refName}`,
            label: record.label,
            refName: record.refName,
            commitOid: record.commitOid,
            shortOid: shortByFull.get(record.commitOid)!,
          }),
        ),
      );
    },
  });
}
