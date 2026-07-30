---
phase: 10-on-demand-branch-search
plan: 01
subsystem: git-discovery
tags: [native-git, literal-search, branch-picker, cancellation, tdd]
requires:
  - phase: 09-immediate-source-picker
    provides: Deferred SourceDiscovery search seam and prompt-lifetime exact-ID selection registry
provides:
  - Case-insensitive literal local-branch search that runs only for non-empty terms
  - Complete strict branch and abbreviation protocol validation before selectable candidates exist
  - Fresh-result-only branch rows with preserved worktree ordering in the staged picker
affects: [11-production-performance-gate]
tech-stack:
  added: []
  patterns:
    - Native Git branch filtering with an argv-only escaped literal pattern and label post-filter
    - One stdin abbreviation batch whose returned full-OID keys must exactly match requested OIDs
key-files:
  created: []
  modified:
    - src/git/candidates.ts
    - src/cli/picker.ts
    - tests/git/candidates.test.ts
    - tests/cli/selection.test.ts
key-decisions:
  - "Keep Git as abbreviation authority while batching unique matched OIDs through git log stdin."
  - "Treat the completed current search result as the only branch authority; preserve eager worktree rows unchanged."
patterns-established:
  - "Branch and abbreviation NUL protocols are validated completely before candidate or picker-registry publication."
requirements-completed: [SRCH-01]
duration: 12min
completed: 2026-07-30
status: complete
---

# Phase 10 Plan 01: On-Demand Literal Branch Search Summary

**Non-empty picker terms now perform a literal, case-insensitive local-branch Git query, validate complete Git protocols, and publish only fresh exact-ID branch rows alongside truthful worktrees.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-30T13:31:02Z
- **Completed:** 2026-07-30T13:42:48Z
- **Tasks:** 2/2
- **Files modified:** 4

## Accomplishments

- Replaced deferred full `for-each-ref` inventory and serial `rev-parse` abbreviation calls with `git branch --list --ignore-case --no-color --sort=refname --format=<NUL format> -- <escaped substring>` and at most one `git log --no-walk=unsorted --abbrev=12 --format=%H%x00%h%x00 --stdin` batch.
- Escaped Git wildcard syntax, passed the pattern after `--`, retained a literal lowercased label guard, restored raw UTF-8 full-ref ordering, and returned frozen branch arrays.
- Hardened complete branch and abbreviation protocol parsing: malformed, empty, non-local, duplicate, invalid, unrequested, or missing records reject before candidates or picker registry entries can be published.
- Removed the eager attached-branch reinsertion fallback for non-empty searches; fresh exact IDs remain selectable for Base and Head while worktrees retain porcelain order.

## RED / GREEN Evidence

### RED — `219041a`

```text
npm exec -- vitest run tests/git/candidates.test.ts tests/cli/selection.test.ts
# Test Files 2 failed; Tests 3 failed, 13 passed
```

The failures reached the intended missing behavior: no `git branch` native query, permissive malformed protocol handling that resolved `[]`, and eager attached-branch reinsertion. The focused contract did not fail for fixture setup, syntax, or timing.

### GREEN — `e96754c`

```text
npm exec -- vitest run tests/git/candidates.test.ts tests/cli/selection.test.ts
# Test Files 2 passed; Tests 16 passed

npm exec -- vitest run tests/git/candidates.test.ts tests/git/comparison.test.ts tests/cli/selection.test.ts tests/cli/errors.test.ts
# Test Files 4 passed; Tests 45 passed
```

The recording and controlled-runner contracts prove empty terms run no search, no matches skip `git log`, matching searches use one filtered local listing plus one unique-OID stdin batch, malformed output rejects whole queries, and only current fresh rows install selectable exact IDs. No Phase 11 timing budget was asserted.

## Task Commits

1. **Task 1: RED — specify literal native search and current-term picker behavior** — `219041a` (`test`)
2. **Task 2: GREEN — implement filtered native Git search and fresh-only merge** — `e96754c` (`feat`)

## Files Created/Modified

- `src/git/candidates.ts` — strict branch/abbreviation protocols, literal local search, raw-ref ordering, cancellation checks, and keyed batched abbreviations.
- `src/cli/picker.ts` — exact-ID deduplication of only fresh branch rows before existing worktree rows.
- `tests/git/candidates.test.ts` — native command, literal, local-only, ordering, batching, cancellation, and malformed-protocol contracts.
- `tests/cli/selection.test.ts` — fresh-only rendering, stale request rejection, and Base/Head exact-ID selection contracts.

## Decisions Made

- Use fixed native Git argument arrays and stdin OIDs; no shell command, dependency, cache, index, provider, or background enumeration was added.
- Accept abbreviation output only when its full-OID map exactly equals the requested unique OID set; duplicate keys reject even if their values agree.
- Preserve Phase 09 exact-ID registry, cancellation gates, Base/Head flow, recovery, terminal escaping, and worktree order; only the eager-branch reinsertion clause is superseded.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test contract] Use the fixture's actual full OID for metadata exclusion**
- **Found during:** Task 1 RED verification
- **Issue:** The new metadata-search assertion referenced a non-existent fixture `baseOid` property, so it passed `undefined` instead of proving full OIDs are not search keys.
- **Fix:** Derived the full OID through the existing fixture Git command and amended the RED test commit before beginning GREEN.
- **Files modified:** `tests/git/candidates.test.ts`
- **Verification:** The corrected focused RED command still failed only on missing Phase 10 behavior; GREEN and the four-file Phase 09 regression matrix passed.
- **Committed in:** `219041a`

---

**Total deviations:** 1 auto-fixed (1 Rule 1 test-contract correction).
**Impact on plan:** No production scope changed; the RED contract now checks the specified metadata exclusion.

## Issues Encountered

- Pre-existing unrelated planning-file changes were present in the working tree. They were preserved and not staged by task commits.

## Known Stubs

None. The only `placeholder` match is an existing test description asserting that an empty result has no selectable placeholder; no production stub was introduced.

## User Setup Required

None - this plan reuses the installed Git CLI, existing GitRunner, Inquirer, and Vitest dependencies.

## Next Phase Readiness

- Phase 11 can benchmark the same two-process-at-most production search seam without changing branch search authority or adding eager enumeration.
- Formal 400 ms picker-readiness and 500 ms packed-ref latency budgets remain exclusively Phase 11 work.

## TDD Gate Compliance

1. `219041a test(10-01): specify literal branch search`
2. `e96754c feat(10-01): implement literal branch search`

## Self-Check: PASSED

- All four plan-owned source and test artifacts exist.
- RED commit `219041a` precedes GREEN commit `e96754c` in Git history.
- The focused feature command passed 2 files and 16 tests; the focused Phase 09 regression matrix passed 4 files and 45 tests.
- `src/git/candidates.ts` contains no eager full `for-each-ref` branch enumeration; non-empty search uses filtered `git branch` plus an optional single abbreviation batch.

---
*Phase: 10-on-demand-branch-search*
*Completed: 2026-07-30*
