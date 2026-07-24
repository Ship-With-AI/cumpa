---
phase: 01-pinned-local-comparison
plan: 02
subsystem: git
status: complete
tags: [native-git, node-spawn, zod, vitest, immutable-comparison, tdd]

requires:
  - phase: 01-pinned-local-comparison
    plan: 01
    provides: Node 24 ESM package, compiled CLI boundary, exact dependency lockfile, and focused test scripts
provides:
  - Bounded shell-free native Git subprocess boundary with cancellation and timeout support
  - Canonical non-bare repository discovery from nested working directories
  - Ordered base/head resolution to immutable full object IDs and exactly one merge base
  - Strict frozen Zod comparison DTO with a committed-object-only initial change fact
  - Deterministic real-Git fixture coverage for moving refs and dirty-byte exclusion
affects: [01-03-loopback-session, 01-04-source-selection, 01-05-comparison-errors, 01-06-changed-file-inventory]

tech-stack:
  added: []
  patterns:
    - Native Git is invoked only with argument arrays through one bounded runner
    - Selected refs are resolved once and replaced by full immutable object IDs
    - Comparison DTOs are strict-schema validated and recursively frozen at owned nested objects
    - Real-Git fixtures disable hooks, prompts, external diffs, fsmonitor, system config, and file transport

key-files:
  created:
    - vitest.config.ts
    - tests/helpers/git-fixture.ts
    - tests/git/pinned-comparison.test.ts
    - src/git/runner.ts
    - src/git/repository.ts
    - src/git/comparison.ts
    - src/contracts/comparison.ts
  modified:
    - src/cli/run.ts

key-decisions:
  - "Represent the Plan 01-02 committed fact as hasCommittedChanges, derived from a NUL-delimited name-only diff between pinned merge-base and head OIDs; detailed file inventory remains Plan 01-06 scope."
  - "Resolve base then head exactly once, run all later graph and diff queries with full OIDs, and freeze the validated DTO so moving refs cannot alter an open descriptor."
  - "Suppress repository execution surfaces at the shared runner with empty hooks, fsmonitor, and external-diff configuration plus no prompts, no optional locks, and file transport disabled."

patterns-established:
  - "Git runner: spawn('git', args) with shell false, Buffer streams, byte ceilings, AbortSignal cancellation, and a finite timeout."
  - "Pinned comparison: discover root -> resolve ordered commits once -> require one merge-base --all result -> verify commit objects -> derive committed fact from OIDs -> validate and freeze."
  - "Git fixtures: temporary repositories use local identity, disabled hooks/system config/network transport, explicit DAGs, and deterministic cleanup."

requirements-completed: [SEL-01, SEL-05, CMP-01, CMP-02, CMP-06]

duration: 23min
completed: 2026-07-20
---

# Phase 01 Plan 02: Native-Git Pinned Comparison Summary

**A bounded native-Git core now resolves nested worktrees into strict frozen base/head/merge-base identities whose committed-change fact ignores dirty bytes and never follows moving refs.**

## Performance

- **Duration:** 23 min
- **Started:** 2026-07-20T09:31:40Z
- **Completed:** 2026-07-20T09:54:12Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added `createGitRunner`, a single shell-free `spawn('git', args)` boundary with bounded Buffer stdout/stderr, caller cancellation, timeout cancellation, typed failures, and repository-code suppression.
- Added canonical non-bare root discovery and `createPinnedComparison`, which preserves explicit base-then-head labels while resolving each revision once to a full commit OID.
- Required exactly one `git merge-base --all` result, verified all three required commit objects, derived `hasCommittedChanges` only from pinned merge-base/head identities, validated the DTO through strict Zod schemas, and froze it before returning to the CLI launch seam.
- Added disposable real-Git fixtures and three focused behavioral tests proving nested discovery, independent identity agreement, moving-ref stability, and exclusion of staged, unstaged, and untracked-only bytes.

## RED / GREEN Evidence

### RED — `2f7b5c3`

`npm run verify:prerequisites` exited 0 before the behavioral run: Node v24.15.0, Git, all fourteen approved exact releases, generated bin, and TypeScript package boundary were available.

`npm run test:git -- tests/git/pinned-comparison.test.ts` then executed all three named real-Git tests and exited 1. The failures reached the domain assertions because the existing `run()` returned no comparison descriptor:

- nested repository assertion failed reading `comparison.repositoryRoot` from `undefined`;
- independent identity assertion expected the full base, head, merge-base, and committed fact but received `undefined`;
- dirty-byte/moving-ref assertion failed reading `comparison.hasCommittedChanges` from `undefined`.

This was a genuine behavioral RED rather than a dependency, fixture, transform, or test-discovery failure.

### GREEN — `410352c`

The same command, `npm run test:git -- tests/git/pinned-comparison.test.ts`, exited 0 with **1 test file and 3 tests passed**. Final focused prerequisite verification also exited 0 and compiled the complete Node boundary with `tsc --project tsconfig.json`.

No separate refactor commit was necessary.

## Native Git Command Boundary

Every production invocation is passed as a string array to `spawn('git', args)` with `shell: false`; no command string is interpolated. The runner prefixes these safety settings:

```text
--no-optional-locks
-c core.hooksPath=
-c core.fsmonitor=false
-c diff.external=
-c protocol.file.allow=never
```

It also disables terminal prompting, system Git configuration, external-diff environment behavior, and optional locks. Stdout and stderr remain Buffers and are independently bounded; a caller `AbortSignal` and a finite timeout both terminate the child through an internal abort controller.

The pinned comparison issues only these semantic command arrays after root discovery:

```text
rev-parse --path-format=absolute --show-toplevel
rev-parse --is-bare-repository
rev-parse --show-object-format=storage
rev-parse --verify --end-of-options <base-revision>^{commit}
rev-parse --verify --end-of-options <head-revision>^{commit}
merge-base --all <base-oid> <head-oid>
cat-file -e <base-oid>^{commit}
cat-file -e <head-oid>^{commit}
cat-file -e <merge-base-oid>^{commit}
diff --name-only -z --no-ext-diff --no-textconv <merge-base-oid> <head-oid> --
```

The last command derives only the initial boolean committed-change fact. It does not read worktree files, staged contents, filters, textconv output, external diff output, or moving refs.

## Pinned Identity Contract

The strict `PinnedComparisonSchema` returns:

- canonical `repositoryRoot`;
- repository `objectFormat` (`sha1` or `sha256`);
- ordered `base` and `head` labels with full OIDs;
- one full `mergeBaseOid`;
- `hasCommittedChanges`, derived from the pinned merge-base/head diff.

The endpoint records and outer DTO are frozen. Tests independently query Git for base, head, and merge-base identities and compare them to the descriptor. A dirty-only fixture has an empty committed diff despite simultaneous staged, unstaged, and untracked paths; moving the selected head ref afterward leaves the serialized descriptor byte-for-byte unchanged.

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — specify native-Git pinned comparison authority** — `2f7b5c3` (`test`)
2. **Task 2: GREEN — resolve and freeze committed comparison identities** — `410352c` (`feat`)

Plan metadata is recorded separately by the `docs(01-02)` completion commit.

## TDD Gate Compliance

Required gate ordering is present in Git history:

1. `2f7b5c3 test(01-02): specify native Git pinned comparison authority`
2. `410352c feat(01-02): freeze native Git comparison identities`

RED failed behaviorally before GREEN; GREEN passed the same focused real-Git command. No optional refactor commit was needed.

## Files Created/Modified

- `vitest.config.ts` — focused Node Vitest discovery for unit, Git, and API categories already exposed by Plan 01 package scripts.
- `tests/helpers/git-fixture.ts` — disposable repository factory with local identity, explicit branches/DAG, future ref, safe Git configuration, dirty-file helpers, and deterministic cleanup.
- `tests/git/pinned-comparison.test.ts` — three real-Git authority tests for canonical ordered discovery, independently verified OIDs, immutable moving-ref behavior, and dirty-byte exclusion.
- `src/git/runner.ts` — bounded, cancellable, timeout-aware, shell-free Buffer Git subprocess boundary.
- `src/git/repository.ts` — canonical non-bare worktree discovery from arbitrary nested cwd.
- `src/git/comparison.ts` — ordered one-time commit resolution, one-merge-base enforcement, object verification, committed fact derivation, and DTO freezing.
- `src/contracts/comparison.ts` — strict Zod schemas and inferred comparison types.
- `src/cli/run.ts` — launch descriptor seam that creates the pinned comparison before later server startup while retaining the no-argument packaged entry behavior from Plan 01-01.

## Decisions Made

- Used a boolean `hasCommittedChanges` as the smallest useful committed fact for this plan. Full byte-exact file inventory, statuses, modes, blob IDs, paths, and counts remain dependency-ordered work for Plan 01-06 rather than being partially implemented here.
- Kept source labels distinct from object identities. Ordered labels remain visible even when the underlying Git authority is replaced by full immutable OIDs.
- Verified objects only by full OID and derived the fact only between full merge-base/head OIDs; no moving-ref or filesystem fallback exists.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The planned RED failures occurred at the comparison-domain assertions and the same focused suite passed after implementation.

## Known Stubs

- `src/cli/run.ts` retains the Plan 01-01 no-argument message that local session launch is not wired yet. This is the deliberate package boundary for Plan 01-03, which owns loopback server/browser lifecycle composition. It does not block Plan 01-02: the new option-bearing launch seam resolves and freezes the complete comparison descriptor before that future startup boundary.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 01-03 can consume the frozen launch descriptor before binding a loopback session without re-resolving refs.
- Plans 01-04 through 01-06 can reuse the runner, repository root, full object identities, strict contract pattern, and real-Git fixture.
- No blocker remains for the next dependency-ordered plan.

## Self-Check: PASSED

- All eight created or modified implementation/test artifacts and this summary exist on disk.
- RED commit `2f7b5c3` and later GREEN commit `410352c` exist in Git history in required order.
- Final focused prerequisite/build verification exited 0.
- Final focused real-Git suite exited 0 with one file and three tests passed.

---
*Phase: 01-pinned-local-comparison*
*Completed: 2026-07-20*
