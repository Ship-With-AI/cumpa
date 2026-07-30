---
phase: 09-immediate-source-picker
plan: 01
subsystem: git-discovery
tags: [native-git, worktrees, branch-discovery, cancellation, tdd]

requires:
  - phase: 01-pinned-local-comparison
    plan: 04
    provides: Immutable source identities and truthful worktree records
  - phase: 01-pinned-local-comparison
    plan: 05
    provides: Native-Git repository capability probes and fatal startup errors
provides:
  - Immutable eager source snapshot containing the current attached branch and registered worktrees
  - Deferred, uncached, abortable local-branch lookup for non-empty terms only
  - Bounded native-Git ref-format capability probe
affects: [09-02-picker-integration, 10-on-demand-branch-search, 11-production-performance-gate]

tech-stack:
  added: []
  patterns:
    - Derive the current branch from the current worktree porcelain record rather than enumerating refs
    - Keep startup Git capability validation bounded while deferring full branch inventory to explicit lookup

key-files:
  created: []
  modified:
    - src/git/candidates.ts
    - src/git/repository.ts
    - tests/git/candidates.test.ts
    - tests/git/comparison.test.ts

key-decisions:
  - "The eager snapshot contains only the attached branch derived from the current registered worktree plus every registered worktree; other branches remain deferred."
  - "A complete local-branch inventory remains uncached and starts only when searchBranches receives a non-empty term."
  - "The startup ref protocol probe retains positive validation with --count=1 instead of scanning refs/heads."

patterns-established:
  - "SourceDiscovery is a frozen two-capability session: immutable initialCandidates and abortable searchBranches."

requirements-completed: [PICK-01, PICK-02]
duration: 6min
completed: 2026-07-30
status: complete
---

# Phase 09 Plan 01: Staged Native-Git Source Discovery Summary

**A frozen eager snapshot now exposes the attached current branch and truthful registered worktrees without complete local-branch enumeration; non-empty searches perform the uncached native-Git branch lookup.**

## Performance

- **Duration:** 6 min
- **Completed:** 2026-07-30T10:49:03Z
- **Tasks:** 2/2
- **Files modified:** 4

## Accomplishments

- Added `SourceDiscovery`, exposing only immutable `initialCandidates` and abortable `searchBranches(term, signal?)`.
- Derived the attached branch from the enriched current-worktree record while retaining its independent `worktree:<path>` identity and every existing worktree state.
- Deferred the existing sorted full local-branch inventory to non-empty searches, preserving case-insensitive branch identifying-field matching and fresh lookup semantics.
- Bounded the repository ref-format protocol probe with `--count=1` while preserving the existing startup checks and fatal mappings.

## RED / GREEN Evidence

### RED — `7d4c3f5`

The required focused command exited nonzero against the pre-phase implementation:

```text
npm exec -- vitest run tests/git/candidates.test.ts tests/git/comparison.test.ts
# Test Files 2 failed; Tests 4 failed, 11 passed
```

The new candidate contracts reached the public seam and failed because the old complete array had no `initialCandidates` session property. The comparison protocol contract also failed because the hidden `for-each-ref refs/heads` probe lacked `--count=1`.

### GREEN — `4e80c6f`

The identical focused command passed after the minimal implementation:

```text
npm exec -- vitest run tests/git/candidates.test.ts tests/git/comparison.test.ts
# Test Files 2 passed; Tests 15 passed
```

The recording-runner contract proves every eager `for-each-ref refs/heads` command is bounded, while complete sorted inventory occurs only after a non-empty `searchBranches` call. Empty lookup starts no Git work; repeated lookup is uncached; aborted lookup rejects rather than returning a partial result.

## Task Commits

1. **Task 1: RED — specify eager snapshot and deferred branch contracts** — `7d4c3f5` (`test`)
2. **Task 2: GREEN — implement the minimal SourceDiscovery session** — `4e80c6f` (`feat`)

## Files Created/Modified

- `src/git/candidates.ts` — frozen staged discovery session, eager worktree/current-branch snapshot, and deferred branch lookup.
- `src/git/repository.ts` — bounded ref-format protocol capability probe.
- `tests/git/candidates.test.ts` — real-Git eager identity/worktree-state, lazy, uncached, and cancellation contracts.
- `tests/git/comparison.test.ts` — explicit bounded-probe regression assertion.

## Decisions Made

- Preserve the source identity boundary: branch IDs derive from full refs and worktree IDs from registered paths, even when they share an OID.
- Preserve Git porcelain worktree record order; fixture setup order is not a Git ordering contract.
- Leave picker and CLI handoff integration to Plan 09-02, as required by this plan boundary.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test contract] Assert native worktree record order instead of fixture creation order**
- **Found during:** Task 2 GREEN verification
- **Issue:** The RED assertion assumed `git worktree add` order. Native Git returned a different valid porcelain record order while the implementation correctly preserved it.
- **Fix:** Derived the expected path sequence directly from `git worktree list --porcelain -z` in the existing real-Git fixture.
- **Files modified:** `tests/git/candidates.test.ts`
- **Verification:** The required focused GREEN command passed all 15 tests.
- **Committed in:** `4e80c6f`

---

**Total deviations:** 1 auto-fixed (1 Rule 1 test-contract correction).
**Impact on plan:** No production scope changed; the test now verifies the planned Git-order truth rather than fixture setup order.

## Issues Encountered

- `.planning/STATE.md` was already modified before execution. Its user-owned change is preserved and is not staged by this plan.

## Known Stubs

None. The modified source and test files contain no `TODO`, `FIXME`, placeholder, coming-soon, or not-available marker.

## User Setup Required

None - this plan reuses the installed Git CLI and existing bounded runner.

## Next Phase Readiness

- Plan 09-02 can hand this `SourceDiscovery` session to the picker without reintroducing eager enumeration.
- Phase 10 can replace only the deferred lookup internals with optimized filtered native-Git search.

## TDD Gate Compliance

1. `7d4c3f5 test(09-01): specify staged source discovery`
2. `4e80c6f feat(09-01): implement staged source discovery`

## Self-Check: PASSED

- All four plan-owned source and test artifacts exist.
- RED commit `7d4c3f5` and later GREEN commit `4e80c6f` exist in Git history.
- The final required focused Vitest command exited 0 with 2 files and 15 tests passed.
- No unbounded eager `for-each-ref refs/heads` source path remains: the repository probe has `--count=1`, and the sole full inventory is inside `searchBranches`.

---
*Phase: 09-immediate-source-picker*
*Completed: 2026-07-30*
