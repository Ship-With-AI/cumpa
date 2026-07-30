# Phase 09: Immediate Source Picker - Pattern Map

**Mapped:** 2026-07-30
**Files analyzed:** 8 likely modified files (4 production, 4 tests)
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/git/candidates.ts` | Git adapter / discovery service | request-response plus staged lazy lookup; Git/file I/O | existing `discoverSourceCandidates()` in same file | exact seam refactor |
| `src/git/repository.ts` | repository prerequisite adapter | request-response / bounded Git probes | `discoverGitRepository()` in same file | exact |
| `src/cli/picker.ts` | interactive picker / state machine | request-response, async streaming search terms | existing `pickOrderedSources()` and `sourceForPrompt()` in same file | exact |
| `src/cli/run.ts` | CLI orchestration / recovery controller | request-response state machine | existing `runCli()` in same file | exact |
| `tests/git/candidates.test.ts` | integration/contract test | Git fixture I/O and request-response | existing candidate identity/protocol tests | exact |
| `tests/git/comparison.test.ts` | integration/contract test | Git fixture I/O and protocol assertions | machine-protocol probe test | exact |
| `tests/cli/selection.test.ts` | picker/state test | deterministic request-response interaction | existing prompt fake and ordered-selection tests | exact |
| `tests/cli/errors.test.ts` | orchestration/recovery test | failure/retry state transitions | existing `runCli()` recovery matrix | exact |

No new production file or directory is warranted: candidate parsing/construction already belongs in `src/git/candidates.ts`; preserve the existing domain contracts in `src/domain/source.ts`.

## Pattern Assignments

### `src/git/candidates.ts` (Git adapter, staged request-response + Git I/O)

**Analog:** existing `discoverSourceCandidates()` (`src/git/candidates.ts:131-255`). Keep byte-safe parsers, native `GitRunner`, immutable candidates, and all current worktree truth semantics. Refactor the public seam into one discovery session with eager candidates and a lazy branch operation; do not create a second discovery service.

**Imports and dependency injection** (`src/git/candidates.ts:1-12`):
```typescript
import { GitObjectIdSchema } from '../contracts/comparison.js';
import {
  UNAVAILABLE_WORKTREE_REASON,
  type BranchCandidate,
  type SourceCandidate,
  type WorktreeCandidate,
} from '../domain/source.js';
import { discoverGitRepository } from './repository.js';
import { createGitRunner, type GitRunner } from './runner.js';

interface CandidateDiscoveryOptions { readonly cwd: string; readonly signal?: AbortSignal; }
interface CandidateDiscoveryDependencies { readonly runner?: GitRunner; }
```

**Eager/lazy boundary:** current code awaits an unbounded sorted `for-each-ref` before returning (`src/git/candidates.ts:141-157`), then serially abbreviates branch heads (`:158-184`). Move that branch inventory/abbreviation operation behind a non-empty-term `searchBranches(term, signal)` operation. The eager stage should run repository prerequisites and `worktree list --porcelain -z`, enrich registered worktrees, and derive the attached branch from the current worktree record. Initial path must contain no unbounded `refs/heads` enumeration.

**Identity and immutable candidate construction** (`src/git/candidates.ts:158-184`, `:229-252`):
```typescript
const candidate: BranchCandidate = {
  kind: 'branch',
  id: `branch:${record.refName}`,
  label: record.label,
  refName: record.refName,
  commitOid: record.commitOid,
  shortOid: await abbreviate(record.commitOid),
};
candidates.push(Object.freeze(candidate));
```
For the eagerly derived attached branch use the current registered worktree (`record.path === repository.root`, `record.branchRef !== undefined`): `id = branch:${record.branchRef}`, full `refName`, and label stripped of `refs/heads/`; retain the separate `worktree:${record.path}` row even when OIDs match. Never key by OID.

**Worktree truth/error invariants** (`src/git/candidates.ts:187-252`):
```typescript
const headResult = await runner.run(
  ['rev-parse', '--verify', '--end-of-options', 'HEAD^{commit}'],
  { cwd: record.path, signal: options.signal },
);
commitOid = GitObjectIdSchema.parse(headResult.stdout.toString('ascii').trim());
const statusResult = await runner.run(
  ['status', '--porcelain=v1', '-z', '--untracked-files=normal'],
  { cwd: record.path, signal: options.signal },
);
availability = statusResult.stdout.length === 0 ? 'clean' : 'dirty';
```
`prunable`/`bare`, malformed or failed worktree inspection become `unavailable`; aborts are rethrown, not mislabeled. Preserve `Detached HEAD`, `branchRef`, `isCurrentCheckout`, dirty warning, unavailable reason, record order, and `Object.freeze`.

**Lazy result behavior:** search results must use exact stable branch IDs and return the existing `BranchCandidate` shape. Merge duplicate branch IDs with eager rows only; distinct worktree/branch identities and duplicate OIDs remain distinct. Pass caller `AbortSignal` to `GitRunner`, call `signal.throwIfAborted()` before/after the operation, and never mutate displayed results from an obsolete aborted request.

### `src/git/repository.ts` (repository adapter, bounded request-response probes)

**Analog:** `discoverGitRepository()` and `probeMachineProtocols()` (`src/git/repository.ts:53-215`). Reuse `requireSupportedGit()` error ownership and `singleLine()` validation. The current protocol list includes an unbounded `['for-each-ref', '--format=%(refname)%00', 'refs/heads']` (`:84-121`); remove it from eager prerequisites or replace it with a bounded capability probe such as `--count=1`. Do not change version/root/HEAD fatal mappings, cancellation propagation, bare/empty repository handling, or native runner use.

**Error pattern** (`src/git/repository.ts:53-82`):
```typescript
} catch (error) {
  if (error instanceof LaunchError) throw error;
  if (error instanceof GitRunnerError && error.kind === 'spawn') {
    throw new LaunchError('git-missing', FATAL_LAUNCH_MESSAGES.gitMissing, {
      cause: error, recovery: { kind: 'exit' },
    });
  }
  if (signal?.aborted) throw error;
  throw new LaunchError('git-unsupported', FATAL_LAUNCH_MESSAGES.gitUnsupported, {
    cause: error, recovery: { kind: 'exit' },
  });
}
```

### `src/cli/picker.ts` (picker, async request-response/state machine)

**Analog:** `sourceForPrompt()` and `pickOrderedSources()` (`src/cli/picker.ts:177-321`). Keep `@inquirer/search`, `SourceSearchPromptConfig.source(term, {signal})`, branch-first/worktree-second grouping, separators, disabled unavailable rows, Base-before-Head order, current-worktree-only Head suggestion, Back action, retained selections, and exact-ID resolution.

**Existing row builder** (`src/cli/picker.ts:177-212`):
```typescript
const query = (term ?? '').toLowerCase();
const branchItems = candidates
  .filter((candidate) => candidate.kind === 'branch' && candidateMatches(candidate, query))
  .map((candidate) => candidateItem(candidate, options));
const worktreeItems = candidates
  .filter((candidate) => candidate.kind === 'worktree' && candidateMatches(candidate, query))
  .map((candidate) => candidateItem(candidate, options));
return [
  { kind: 'separator', label: 'Local branches' }, ...branchItems,
  { kind: 'separator', label: 'Worktrees' }, ...worktreeItems,
];
```

**Async picker invariants:** replace fixed `options.candidates` closure with a prompt-lifetime registry seeded by eager candidates. For empty/undefined term return eager rows immediately. For a non-empty term await the discovery session's lazy search, abort-check, install completed candidates by exact ID, then build rows. An old/aborted promise must not mutate registry/display; aborts must not become “no matches.” Enter resolves through the registry, preserving the current errors `Base selection did not identify an available source` / `Head selection did not identify an available source` (`:272-321`).

**Prompt cancellation/initial term** (`src/cli/picker.ts:214-239`):
```typescript
return (term, { signal }) => {
  signal.throwIfAborted();
  const effectiveTerm = firstRequest && term === undefined ? initialSearchTerm : term;
  firstRequest = false;
  return buildSourceSearchItems(candidates, effectiveTerm, options).map(...);
};
```
Preserve this recovery-focused initial term behavior while making the source callback async.

**Ordered state machine** (`src/cli/picker.ts:240-321`):
```typescript
const candidateById = new Map(
  options.candidates.map((candidate) => [candidate.id, candidate] as const),
);
let base = options.initialBase;
const retainedHead = options.initialHead;
// base prompt first; head prompt only after base; Head Back clears base
```
Keep this state machine rather than rebuilding prompts or inventing a provider framework. Seed retained/recovered candidates in the same registry so default/focus Enter resolves the exact object shown.

### `src/cli/run.ts` (CLI orchestration, request-response recovery state machine)

**Analog:** `runCli()` (`src/cli/run.ts:328-435`) and selection conversion (`:278-317`). Change only discovery handoff: obtain one discovery session, pass its eager snapshot/session to picker, and preserve recovery ownership in `runCli()`.

**Selection conversion:**
```typescript
if (candidate.kind === 'branch') {
  return {
    label: candidate.label,
    revision: candidate.refName,
    source: { kind: 'branch', id: candidate.id, refName: candidate.refName },
  };
}
return selectionForWorktree(candidate);
```
Keep worktree revision pinned to commit OID and reject unavailable/no-commit worktrees.

**Recovery pattern** (`src/cli/run.ts:386-435`): after descriptor failure, print the error; exit on fatal recovery; otherwise rediscover authoritative state, preserve opposite endpoint, focus failed role, retry picker. With staged discovery, a searched non-current branch may not be in eager snapshot: re-resolve that branch through the new lazy operation/exact ref ID before setting `focusedCandidateId`; leave focus undefined if it disappeared. Do not retain stale pre-failure candidates.

### `tests/git/candidates.test.ts` (Git integration/contract, fixture I/O)

**Analog:** `tests/git/candidates.test.ts:1-140`. Use `createGitFixture()`, keep a `fixtures` array and `afterEach` cleanup, use actual native Git to create linked/detached/unavailable/dirty states, and assert domain identity rather than implementation details. Existing contract asserts duplicate OIDs still produce distinct IDs and all rows share the same short OID. Extend with a recording `GitRunner` to prove eager construction does not invoke unbounded branch enumeration and lazy search does.

**Existing fixture/cleanup pattern:**
```typescript
const fixtures: GitFixture[] = [];
async function fixture() {
  const created = await createGitFixture();
  fixtures.push(created);
  return created;
}
afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((item) => item.cleanup()));
});
```

### `tests/git/comparison.test.ts` (Git integration/contract, protocol request-response)

**Analog:** `tests/git/comparison.test.ts:47-75`. Keep `createValidationGitFixture`, delegate to `createGitRunner`, record argument arrays, and assert required commands with `expect.arrayContaining`. If the repository probe changes, update only the expectation that currently requires an unbounded `for-each-ref`; retain assertions for version, worktree, merge-base, raw/numstat diff, and cat-file protocols.

```typescript
expect(commands).toEqual(
  expect.arrayContaining([
    ['--version'],
    ['worktree', 'list', '--porcelain', '-z'],
    expect.arrayContaining(['for-each-ref']),
    expect.arrayContaining(['merge-base', '--all']),
  ]),
);
```

### `tests/cli/selection.test.ts` (deterministic picker/state test, request-response)

**Analog:** `tests/cli/selection.test.ts:1-183`. Use literal frozen candidate fixtures with branch/worktree IDs, duplicate OIDs, dirty/current, detached, and unavailable rows. Inject `SourceSearchPrompt` instead of terminal UI, record `SourceSearchPromptConfig[]`, return answer IDs, and assert exact messages/defaults/order. Add a prompt fake whose async source is called with undefined/empty before a non-empty term to prove eager choices are available before lazy discovery resolves, and assert lazy IDs resolve successfully.

```typescript
const seen: SourceSearchPromptConfig[] = [];
const answers = ['branch:refs/heads/main', 'back', 'branch:refs/heads/feature', 'worktree:/repo'];
const prompt: SourceSearchPrompt = async (config) => {
  seen.push(config);
  const answer = answers.shift();
  if (answer === 'back') return config.backValue;
  if (answer === undefined) throw new Error('Test prompt exhausted its answers');
  return answer;
};
```

Preserve assertions for Local branches before Worktrees, no selectable placeholder, Base first, suggested current checkout only on Head, Back returning to Base, and retained selection.

### `tests/cli/errors.test.ts` (CLI recovery contract, state transitions)

**Analog:** `tests/cli/errors.test.ts:79-243`. Use `plannedFailure()`, `RunCliDependencies`, fake discovery/picker/descriptor, `vi.fn()` output/status, and assert fatal failures never invoke picker/descriptor/launch. For recoverable descriptor failures assert exact error copy, opposite endpoint preservation, failed role clearing, focused ID/search term, rediscovery/session recreation, and eventual launch. Add the searched-branch case: recovery must seed a freshly re-resolved candidate, not stale data absent from the eager snapshot.

```typescript
expect(pickCalls[1]).toMatchObject({
  initialBase: baseCandidate,
  recovery: { role: 'head', focusedCandidateId: headCandidate.id, searchTerm: '' },
});
expect(launchComparison).toHaveBeenCalledExactlyOnceWith(comparison);
```

## Shared Patterns

### Native Git and cancellation
**Sources:** `src/git/candidates.ts:131-252`, `src/git/runner.ts:49-74,112-180`.
Use argument arrays through the injected `GitRunner`; pass `cwd` and `AbortSignal`; retain output limits/timeouts/safe environment and no shell. Git remains authoritative at selection and descriptor time.

### Stable identity and ordering
**Sources:** `src/domain/source.ts:7-37`, `src/cli/picker.ts:177-212`, `src/git/candidates.ts:141-157,229-252`.
Branch IDs are `branch:${full refs/heads ref}`; worktree IDs are `worktree:${absolute path}`. Keep distinct rows for same OID, sort/list branches as Git returns sorted `refname`, preserve porcelain worktree order, and render Local branches before Worktrees.

### Worktree availability
**Source:** `src/git/candidates.ts:192-252`.
Only `clean`, `dirty`, or `unavailable`; unavailable rows remain visible and disabled with `UNAVAILABLE_WORKTREE_REASON`. Dirty means committed HEAD only; current checkout is the sole suggested Head.

### Error ownership
**Sources:** `src/git/repository.ts:53-82`, `src/cli/run.ts:386-435`, `tests/cli/errors.test.ts:79-243`.
Adapters map prerequisite failures to `LaunchError`; `runCli()` owns user output, fatal exit status, rediscovery, role preservation, and retry. Picker owns only ordered interaction and exact registry resolution.

### Immutable snapshots
**Sources:** `src/git/candidates.ts:184,249-252`, `src/domain/source.ts:7-37`.
Freeze candidate objects and returned arrays. A discovery session's eager snapshot is immutable; lazy additions are installed atomically into picker-local state, not by mutating the snapshot or a background producer.

## No Analog Found

None. Every anticipated production and test file has a direct same-role analog. The new `SourceDiscovery` session type is a seam within `src/git/candidates.ts`, not a new module; planner should apply the existing patterns above.

## Metadata

**Analog search scope:** `src/git`, `src/cli`, `src/domain`, `tests/git`, `tests/cli`
**Files scanned:** 8 primary analog files plus `src/domain/source.ts` and `src/git/runner.ts`
**Pattern extraction date:** 2026-07-30

## PATTERN MAPPING COMPLETE
