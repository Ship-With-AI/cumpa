# Phase 10: On-Demand Branch Search — Pattern Map

**Mapped:** 2026-07-30  
**Files analyzed:** 7 likely source/test files plus Phase 09 artifacts  
**Analogs found:** 7 / 7

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/git/candidates.ts` (`SourceDiscovery.searchBranches`) | Git adapter/service | request-response + native Git parsing | existing closure in `discoverSourceCandidates()` | exact |
| `src/cli/picker.ts` (`sourceForPrompt`, `mergedCandidates`) | picker/controller | cancellable request-response | staged picker implementation | exact |
| `tests/git/candidates.test.ts` | integration test | native Git protocol/cancellation | staged-discovery tests | exact |
| `tests/cli/selection.test.ts` | interaction test | cancellable request-response | staged picker tests | exact |
| `src/cli/run.ts` (`runCli`) | CLI orchestration | request-response/recovery | existing discovery loop | exact, regression-only |
| `src/git/runner.ts` | subprocess utility | streaming + cancellation | bounded Git runner | exact, unchanged |
| `src/git/repository.ts`, `src/git/selector-drift.ts` | native Git/identity utilities | parsing/verification | existing machine-protocol and full-OID checks | exact, unchanged |

## Pattern Assignments

### `src/git/candidates.ts` — `searchBranches`

**Analog:** `discoverSourceCandidates()` and its closure, `src/git/candidates.ts:214-332`.

Reuse `BRANCH_FORMAT` (`15-20`), `splitNul()` and `parseBranchRecords()` (`54-90`), `GitObjectIdSchema`, `GitRunner`, and frozen return values. Keep `SourceDiscovery` and eager worktree/current-branch construction unchanged.

**Phase 10 target implementation:** Replace only the interim unfiltered `for-each-ref` plus one `rev-parse` per unique OID (`264-330`) with one filtered native-Git listing and one optional abbreviation batch:

```ts
const pattern = `*${term.replace(/[\\*?\[\]]/gu, '\\$&')}*`;
const listed = await runner.run(
  ['branch', '--list', '--ignore-case', '--no-color', '--sort=refname',
   `--format=${BRANCH_FORMAT}`, '--', pattern],
  { cwd: repository.root, signal },
);
// parse records, literal lower-case label.includes(term) guard, then byte-sort refName
const abbreviated = await runner.run(
  ['log', '--no-walk=unsorted', '--abbrev=12',
   '--format=%H%x00%h%x00', '--stdin'],
  { cwd: repository.root, signal,
    input: Buffer.from(`${uniqueOids.join('\n')}\n`, 'ascii') },
);
```

Escape Git wildcard metacharacters `\\`, `*`, `?`, `[`, `]`; this is Git wildcard syntax, not regex syntax. Pass the pattern as one argv value: `shell: false` means quote characters would be data. Use `--list` without `-r`/`-a` so only local branches match. `--ignore-case` is needed for matching, but can alter sort behavior: after parsing and literal post-filtering, canonical-sort full refs with raw UTF-8/`orderByteSequences`, not `orderText`, completion order, or popularity. No-match returns frozen `[]` and skips abbreviation.

Deduplicate only full OIDs sent to the batch; map each abbreviation back to every matching ref. Validate every batch record and require a complete OID-to-short-OID map before creating selectable candidates; malformed/incomplete output rejects the whole search. Check `signal` before work, after each Git stage, and after parsing. Propagate non-abort runner failures; never convert them to `[]`.

### `src/cli/picker.ts` — `sourceForPrompt` and `mergedCandidates`

**Analog:** `sourceForPrompt()` (`282-305`), `mergedCandidates()` (`239-280`), `pickOrderedSources()` (`307-399`).

Preserve this cancellation/registry ordering:

```ts
signal.throwIfAborted();
const branches = await searchBranches(effectiveTerm!, signal);
signal.throwIfAborted();
for (const candidate of branches) candidateById.set(candidate.id, candidate);
return promptItems(buildSourceSearchItems(
  mergedCandidates(candidates, branches, effectiveTerm!), undefined, options));
```

`candidateById` is seeded once from eager rows and resolves both Base and Head by exact `id`, never label/OID/index. Keep exact prompt signal forwarding, Base-then-Head flow, Head suggestion, Back-to-Base behavior, separators, and disabled unavailable worktrees.

**Required Phase 10 merge change:** For a non-empty search, trust only fresh returned branch rows. Remove the current fallback in `mergedCandidates()` that re-inserts eager branch candidates merely because they match the term; this would show stale/mismatched eager names after the filtered lookup. Exact-ID de-duplicate fresh branch rows, retain their canonical ref order, then append existing worktrees in porcelain order. Empty/undefined terms still render eager candidates through `buildSourceSearchItems()` without invoking Git.

### `src/cli/run.ts` — `runCli`

**Analog:** `runCli()` (`349-440`). Regression-only unless callback types change. It passes only `initialCandidates` plus `searchBranches` to the picker. Recovery re-discovers, checks eager exact ID first, then searches a missing branch label and accepts only `candidate.id === failedCandidate.id`; it preserves the opposite endpoint. Do not add eager refresh or move recovery authority into Git search.

### `src/git/runner.ts` — cancellation and bounds

**Analog:** `createGitRunner().run()` (`81-223`). Reuse argument arrays, `shell:false`, safe Git config, byte/time limits, and `GitRunnerError`. Already-aborted signals reject before spawn; caller abort terminates the child and reports `kind: 'aborted'`. Do not add a generation counter/debounce, catch abort as no-match, bypass limits, or create another cancellation error.

### Native parsing and identity analogs

`src/git/repository.ts:89-119` keeps startup `for-each-ref --count=1` bounded; do not change it. `src/git/selector-drift.ts:198-205` verifies refs with `rev-parse --verify --end-of-options` and cumpas full OIDs. Its NUL parser (`41-82`) reinforces the established parser style, but use the existing `candidates.ts` helpers instead of duplicating a service.

## Shared Patterns

### Exact source identity
**Sources:** `src/domain/source.ts:8-45`, `src/contracts/comparison.ts:7-24`, `src/cli/picker.ts:325-341`.

Branch IDs are `branch:<full refs/heads ref>`; worktree IDs are `worktree:<path>`. Full OIDs pin comparisons, while refs move. Duplicate OIDs are valid distinct sources; never key by OID, label, or short OID.

### Cancellation and stale results
**Sources:** `src/git/candidates.ts:264-322`, `src/cli/picker.ts:282-305`, `src/git/runner.ts:93-116`.

Check before Git work, forward the exact signal, check after every await/stage, and mutate `candidateById` only after the final check. Aborted/stale requests reject and cannot publish rows or IDs.

### Deterministic ordering
**Sources:** `src/cli/picker.ts:239-280`, Phase 09 verification `09-VERIFICATION.md`.

Git lists refs with explicit sorting, but `--ignore-case` may alter ordering; restore raw full-ref canonical order after parsing. Fresh branches remain before worktrees; worktrees retain porcelain record order. Do not globally sort or use `orderText`.

### Truthful, immutable candidates
**Sources:** `src/git/candidates.ts:151-261`, `src/cli/picker.ts:177-212`.

Use Zod object-ID validation, freeze returned records/arrays, and keep registered unavailable worktrees visible but disabled. No fallback stale branch rows or partial malformed batch results.

## Tests to Copy/Extend

- `tests/git/candidates.test.ts:153-215,224-264`: recording runner proves empty search does zero Git work, non-empty search is deferred, native protocols are byte-safe, and abort does not enumerate. Extend with literal wildcard escaping, name-only matching, no-match batch skip, one stdin abbreviation batch, canonical mixed-case ordering, malformed batch rejection, and non-abort failure propagation.
- `tests/cli/selection.test.ts:252-415`: direct source callback tests prove eager rows avoid deferred search, exact IDs work for either role, order/deduplication is stable, and aborted stale results cannot install IDs. Update/extend the merge test so a stale eager branch absent from fresh results is not reinserted.
- `tests/git/comparison.test.ts`: retain bounded startup probe assertions as regression coverage; no source change expected.
- `tests/cli/errors.test.ts:429-535`: recovery exact-ID behavior is regression-only; no ownership move to search implementation.

## Anti-Patterns to Avoid

- Restoring eager all-branch enumeration or a persistent branch index/cache/background watcher.
- Using `for-each-ref` for every branch then spawning one abbreviation process per matched OID.
- Treating the search term as regex; failing to escape Git wildcard syntax; quoting the argv pattern.
- Trusting Git's `--ignore-case` output order without raw full-ref re-sort.
- Using human Git branch output, color/decorations, shell interpolation, or a second Git library.
- Filtering by OID/short OID/kind aliases when SRCH-01 is literal local branch-name matching.
- Re-inserting eager branch rows that are absent from a completed fresh non-empty lookup.
- Mutating `candidateById` before post-await abort checks, publishing partial batch data, or swallowing abort/runner errors as empty results.
- Sorting worktrees, de-duplicating by OID, changing ordered Base/Head semantics, or changing recovery's exact-ID matching.

## Likely Files/Symbols Modified

| File | Symbols | Expected action |
|---|---|---|
| `src/git/candidates.ts` | `BRANCH_FORMAT`, `parseBranchRecords`, private query/escape/batch parser, `SourceDiscovery.searchBranches` | Filter local branch names literally; batch abbreviations; validate, sort, freeze, cancel. |
| `src/cli/picker.ts` | `mergedCandidates`, `sourceForPrompt` | Keep signal/registry/order; remove stale eager-branch reinsertion fallback. |
| `tests/git/candidates.test.ts` | staged discovery/search tests | Add native command, literal, batch, ordering, error, cancellation contracts. |
| `tests/cli/selection.test.ts` | staged source discovery tests | Add fresh-result-only merge regression; retain race/exact-ID matrix. |
| `src/cli/run.ts`, `tests/cli/errors.test.ts` | `runCli` recovery | Regression-only unless public callback contract changes. |

## No Analog Found

None. Phase 09 supplies the exact lifecycle seam; native Git runner/parser, identity, cancellation, and deterministic ordering all have established analogs.

## Metadata

**Analog search scope:** `src/git/candidates.ts`, `src/cli/picker.ts`, `src/cli/run.ts`, `src/git/runner.ts`, `src/git/repository.ts`, `src/git/selector-drift.ts`, `src/domain/source.ts`, `src/contracts/comparison.ts`, `tests/git/candidates.test.ts`, `tests/git/comparison.test.ts`, `tests/cli/selection.test.ts`, `tests/cli/errors.test.ts`, Phase 09 review/verification artifacts, and `10-RESEARCH.md`.  
**Pattern extraction date:** 2026-07-30
