---
phase: 09-immediate-source-picker
plan: 02
subsystem: cli-source-selection
tags: [inquirer, staged-discovery, source-identity, cancellation, recovery, tdd]

requires:
  - phase: 09-immediate-source-picker
    plan: 01
    provides: Immutable eager candidates and abortable deferred branch discovery
provides:
  - Immediate Base and Head selection from current-branch and worktree seed candidates
  - Prompt-lifetime exact-ID authority for completed lazy branch results
  - Fresh exact-ID branch recovery after descriptor-time drift
affects: [10-on-demand-branch-search, 11-production-performance-gate]

tech-stack:
  added: []
  patterns:
    - Keep eager picker seeds immutable while a picker-local registry owns completed lazy candidates
    - Preserve native Git sorted branch order when merging the eager attached branch and porcelain worktrees

key-files:
  created: []
  modified:
    - src/cli/picker.ts
    - src/cli/run.ts
    - tests/cli/selection.test.ts
    - tests/cli/errors.test.ts

key-decisions:
  - "The picker owns a single exact-ID registry across Base and Head; labels and OIDs never resolve a selection."
  - "Only completed, non-aborted deferred lookups can install branch candidates; recovery recreates discovery authority before restoring focus."

patterns-established:
  - "Non-empty picker input delegates to the staged discovery session with Inquirer's exact AbortSignal."

requirements-completed: [PICK-01, PICK-02]
duration: 20min
completed: 2026-07-30
status: complete
---

# Phase 09 Plan 02: Immediate Ordered Source Picker Summary

**The terminal picker now opens from the eager current branch and registered worktrees, then installs abort-safe lazy branch results by exact ID across Base/Head selection and drift recovery.**

## Performance

- **Duration:** 20 min
- **Tasks:** 2/2
- **Files modified:** 4

## Accomplishments

- `runCli()` now passes `SourceDiscovery.initialCandidates` to the picker before any branch search, retaining only an available current worktree as the Head suggestion.
- `pickOrderedSources()` forwards the exact prompt signal, keeps a picker-lifetime exact-ID registry, rejects aborted lookup completion, and preserves lazy Git ref order with worktrees after branches.
- Recoverable descriptor failures recreate staged discovery, seed only a freshly exact-ID-resolved searched branch, preserve the opposite endpoint, and leave focus unset when the identity disappears.

## RED / GREEN Evidence

### RED — `919b724`

```text
npm exec -- vitest run tests/cli/selection.test.ts tests/cli/errors.test.ts
# Test Files 2 failed; staged-picker contracts failed because picker had no async branch source/registry and runCli treated SourceDiscovery as an array.
```

The focused contracts reached the missing behavior: lazy rows were absent, stale-session objects caused `candidates.find is not a function`, and the picker could not select deferred exact IDs.

### GREEN — `5482bdc`

```text
npm exec -- vitest run tests/cli/selection.test.ts tests/cli/errors.test.ts
# Test Files 2 passed; Tests 27 passed

npm run build
# exited 0
```

The focused suite proves eager interaction, both-role lazy exact-ID selection, prompt-signal forwarding, stale-abort isolation, ordered branch/worktree rendering, Base-to-Head Back behavior, and fresh searched-branch recovery. The build proves every TypeScript caller migrated from the complete-array discovery seam.

## Task Commits

1. **Task 1: RED — specify immediate interaction, registry, and recovery** — `919b724` (`test`)
2. **Task 2: GREEN — wire staged discovery through the existing ordered picker** — `5482bdc` (`feat`)

## Files Created/Modified

- `src/cli/picker.ts` — async staged search source, shared exact-ID registry, cancellation checks, and deterministic branch/worktree merge.
- `src/cli/run.ts` — `SourceDiscovery` handoff, eager Head suggestion, and fresh searched-branch recovery.
- `tests/cli/selection.test.ts` — eager timing, lazy selection, signal, ordering, duplicate, stale-abort, and orchestration contracts.
- `tests/cli/errors.test.ts` — fresh exact-ID recovery and disappeared searched-branch fallback contracts.

## Decisions Made

- Preserve `searchBranches` return order instead of relying on registry insertion order; insert the eager attached branch only at its sorted refname position when it is absent from a completed result.
- Never seed recovery with the stale failed object: use an eager replacement or freshly search for the exact branch ID.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - this plan uses the locked `@inquirer/search`, Vitest, and native Git dependencies.

## Next Phase Readiness

- Phase 10 can optimize only `SourceDiscovery.searchBranches()` without changing picker authority, ordering, or recovery.
- Phase 11 can measure the production picker path after Phase 10 establishes literal bounded search.

## TDD Gate Compliance

1. `919b724 test(09-02): specify staged picker contracts`
2. `5482bdc feat(09-02): integrate staged source picker`

## Self-Check: PASSED

- All four plan-owned source/test artifacts and this summary exist.
- RED commit `919b724` precedes GREEN commit `5482bdc` in Git history.
- The final focused Vitest command passed 27 tests in 2 files.
- `npm run build` exited 0 after the SourceDiscovery caller migration.

---
*Phase: 09-immediate-source-picker*
*Completed: 2026-07-30*
