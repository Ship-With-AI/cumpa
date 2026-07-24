---
phase: 01-pinned-local-comparison
plan: 04
subsystem: source-selection
status: complete
tags: [native-git, inquirer, worktrees, source-identity, tdd]

requires:
  - phase: 01-pinned-local-comparison
    plan: 02
    provides: Strict frozen comparison descriptor backed by native Git object identities
  - phase: 01-pinned-local-comparison
    plan: 03
    provides: Loopback-only Fastify launch lifecycle for one already-pinned comparison
provides:
  - Byte-safe native-Git discovery for local branches and every registered worktree
  - Stable source identities kept separate from shared commit object identities
  - Truthful clean, dirty, detached, and unavailable worktree presentation
  - One grouped searchable picker reused for explicit base then suggested head selection
  - Ordered confirmation with full object IDs, applicable paths, dirty warning, and pin statement
  - Interactive CLI composition from candidate discovery through frozen comparison launch
affects: [01-05-comparison-errors, 01-06-changed-file-inventory, 01-07-diff-contract, 01-08-loopback-security]

tech-stack:
  added: []
  patterns:
    - Parse native Git machine protocols as NUL-delimited bytes rather than human-oriented lines
    - Preserve source identity independently from commit identity so same-OID rows remain selectable
    - Disable unresolved worktrees with an explicit reason instead of omitting or mislabeling them
    - Convert branch selections to ref authority and worktree selections to discovered committed-HEAD authority before pinning

key-files:
  created:
    - src/domain/source.ts
    - tests/git/candidates.test.ts
    - tests/cli/selection.test.ts
  modified:
    - src/git/candidates.ts
    - src/cli/picker.ts
    - src/cli/confirm.ts
    - src/cli/run.ts
    - src/contracts/comparison.ts
    - src/git/comparison.ts
    - vitest.config.ts

key-decisions:
  - "Candidate IDs encode source identity (branch ref or registered worktree path) and never reuse commit OIDs, so multiple truthful rows may point at the same commit."
  - "A branch enters comparison creation through its full refs/heads name, while a selected worktree enters through the full committed HEAD discovered by Git; dirty filesystem bytes never become comparison authority."
  - "Unavailable and prunable registrations remain visible but disabled with the exact repair-oriented reason required by the UI contract."
  - "Confirmation Back preserves the explicit base and returns to head selection; the picker-level Back clears head progress and returns to base selection."

patterns-established:
  - "Candidate discovery: enumerate refs and worktrees with NUL protocols, probe usable worktrees through the bounded runner, then expose immutable source records."
  - "Selector authority: display strings are control-safe presentation only; immutable candidate IDs recover the selected source record."
  - "Pin-before-launch: selected source records become comparison selections, createPinnedComparison freezes full identities, confirmation displays those frozen facts, and only Launch binds the loopback session."

requirements-completed: [SEL-03, SEL-04, SEL-07]

duration: 31min
completed: 2026-07-20
---

# Phase 01 Plan 04: Truthful Ordered Source Selection Summary

**Diff Review now discovers local branches and registered worktrees through byte-safe native Git, lets the developer explicitly choose ordered base and head identities in one grouped searchable picker, confirms the frozen comparison facts, and launches without reading dirty worktree content or following moving refs afterward.**

## Performance

- **Duration:** 31 min
- **Started:** 2026-07-20T11:08:23Z
- **Completed:** 2026-07-20T11:39:46Z
- **Tasks:** 2
- **Files created or modified:** 10

## Accomplishments

- Added an immutable source-candidate domain model with distinct branch/worktree variants, stable source IDs, Git-derived full and 12-character commit identities, detached/current-checkout facts, and clean/dirty/unavailable worktree states.
- Implemented branch enumeration with explicit `for-each-ref` NUL fields and registered worktree enumeration with `git worktree list --porcelain -z`, routed exclusively through the existing bounded argument-array Git runner.
- Probed every usable worktree's committed `HEAD` and collapsed status through exact `git status --porcelain=v1 -z --untracked-files=normal`; retained missing/prunable registrations as disabled unavailable rows instead of dropping or calling them clean.
- Implemented one `@inquirer/search` candidate source reused for base and head, with permanent Local branches and Worktrees grouping, searchable identifying/state text, explicit base-first order, current-checkout suggestion only for head, no-match recovery copy, and Back transitions.
- Added identity-rich confirmation showing ordered labels, full base/head/merge-base IDs, selected worktree paths, the exact dirty-bytes warning, the exact pin statement, and explicit Launch/Back choices.
- Replaced the deferred interactive CLI seam with discovery → ordered selection → frozen comparison creation → confirmation → loopback launch, while preserving the prior injected packaged-launch path and shutdown behavior.

## RED / GREEN Evidence

### RED — `548bbf8`

Both required focused commands reached behavioral assertions and exited nonzero before implementation:

```text
npm run test:git -- tests/git/candidates.test.ts
npm run test:unit -- tests/cli/selection.test.ts
```

The Git suite reached `discoverSourceCandidates` and failed with its explicit not-implemented error. The CLI command initially revealed that Vitest's existing unit include did not discover `tests/cli`; adding the planned CLI test include corrected that test-harness blocker, after which all five selection/confirmation assertions reached the production seams and failed for missing behavior. The RED commit contains only the behavioral contracts, temporary throwing seams required for static module resolution, and the focused Vitest include.

### GREEN — `e56d12b`

The identical required commands exited 0 after implementation:

```text
npm run test:git -- tests/git/candidates.test.ts
# 2 files passed, 5 tests passed

npm run test:unit -- tests/cli/selection.test.ts
# 1 file passed, 5 tests passed
```

The Git script intentionally includes the existing `tests/git` category in addition to the named candidate file; all five Git-category tests passed. The CLI command executed only the named selection file and all five picker/confirmation/integration tests passed. Per plan, no formatter, linter, project-wide suite, or unrelated test category was run.

## Real-Git Fixture Matrix

| Fixture fact | Observed contract |
|---|---|
| Local `feature`, `linked`, `main`, and `unavailable` branches | Every local branch is retained as its own branch candidate |
| Current attached worktree with staged, unstaged, and untracked changes | One current-checkout row marked `dirty`; only committed `HEAD` is authoritative |
| Clean linked worktree | Separate attached worktree candidate with its exact path and committed `HEAD` |
| Clean detached worktree | Separate row labeled `Detached HEAD`, with detached state and exact path |
| Removed registered worktree directory | Registration retained as disabled `unavailable` with exact repair guidance |
| Branches/worktrees sharing the feature commit | At least three rows retain unique source IDs while sharing the same Git-derived full and short OIDs |
| Recording Git runner | Exact worktree/status argument arrays and explicit `%00` ref fields observed; no shell or human status format used |

## Search and Prompt Contract

The source list always retains the two section headings:

```text
Local branches
Worktrees
```

Search includes source type, label, ref/path, full and short commit identity, detached state, and clean/dirty/unavailable status. A zero-match query has no selectable fake row and renders:

```text
No branches or worktrees match this search.
```

The picker order and copy are:

```text
Choose base — changes will be compared from its merge base with head
Choose head — this committed state will be reviewed
```

Base has no guessed default. Only the available current checkout may be marked `Suggested: current checkout` for head. Head exposes Back to reselect base; confirmation Back reopens head while preserving the explicit base.

Unavailable rows are disabled with:

```text
Unavailable — this registered worktree cannot be resolved. Choose another entry or repair it with Git.
```

Dirty rows state:

```text
Dirty — committed HEAD only
The worktree's committed HEAD will be reviewed. Staged, unstaged, and untracked bytes are ignored.
```

Confirmation ends with the frozen-authority statement and choices:

```text
This session is pinned to the commits shown below and does not follow moving refs.
Launch pinned comparison
Back
```

## Authority Boundary Proof

```text
native Git branch/worktree records
  -> immutable SourceCandidate with source ID distinct from commit OID
  -> picker returns candidate records by immutable ID
  -> branch selection uses full refName
     worktree selection uses discovered full committed HEAD OID
  -> createPinnedComparison resolves/verifies and freezes ordered endpoints
  -> confirmation renders only frozen identities and recorded source paths/states
  -> Launch serves that already-pinned comparison on loopback
```

Candidate labels and paths are escaped for terminal presentation and never parsed back into authority. Dirty detection exposes only a collapsed state; neither discovery nor selection reads staged, unstaged, or untracked file bytes. The frozen comparison schema records selected source identity alongside endpoint OIDs, and `createPinnedComparison` freezes those nested source facts before launch. Same-commit launch policy remains owned by the existing comparison layer rather than being hidden by candidate deduplication.

## Task Commits

Each task was committed atomically in required TDD order:

1. **Task 1: RED — specify truthful searchable source selection** — `548bbf8` (`test`)
2. **Task 2: GREEN/REFACTOR — discover and confirm ordered source identities** — `e56d12b` (`feat`)

Plan metadata is recorded separately in the `docs(01-04)` completion commit.

## TDD Gate Compliance

Required gate ordering is present in Git history:

1. `548bbf8 test(01-04): specify truthful searchable source selection`
2. `e56d12b feat(01-04): implement truthful ordered source selection`

RED failed on absent candidate discovery, picker, confirmation, and CLI wiring after the assertions were demonstrably reached. GREEN passed the same two plan-scoped commands. No optional refactor commit was necessary.

## Files Created/Modified

- `src/domain/source.ts` — source-candidate variants, ordered selection type, exact dirty explanation, and unavailable reason.
- `src/git/candidates.ts` — byte-safe native-Git branch/worktree enumeration, committed-HEAD/status probes, Git-derived abbreviation, and unavailable retention.
- `src/cli/picker.ts` — control-safe grouped search rows, identifying-field filtering, role-specific copy/defaults, and ordered Back state machine.
- `src/cli/confirm.ts` — frozen identity/path/warning rendering and explicit Launch/Back confirmation.
- `src/cli/run.ts` — interactive discovery-to-launch composition plus direct launch of an already-pinned comparison while preserving the existing packaged lifecycle.
- `src/contracts/comparison.ts` — strict branch/worktree source-identity schemas attached optionally to selections and pinned endpoints for backward compatibility.
- `src/git/comparison.ts` — propagation and recursive freezing of selected source identities in the pinned descriptor.
- `tests/git/candidates.test.ts` — disposable real-Git matrix and exact runner-protocol assertions.
- `tests/cli/selection.test.ts` — grouping/search/order/suggestion/unavailable/dirty/confirmation/CLI authority behavior.
- `vitest.config.ts` — focused discovery of the planned `tests/cli/**/*.test.ts` category.

## Decisions Made

- Stable source identity is independent from commit identity. Branch refs and worktree registrations remain distinct rows even when their committed states are byte-for-byte identical.
- Worktree dirt never changes comparison revision authority. A selectable worktree contributes its Git-discovered committed `HEAD`; its dirty flag exists only for truthful warning and display.
- Unavailable worktrees remain observable but nonselectable. This preserves Git's registered topology without permitting an unresolvable source into comparison creation.
- The current checkout is a suggestion only for the head role. Base always requires explicit developer selection, preserving ordered comparison intent.
- Confirmation consumes the frozen descriptor rather than the earlier moving candidates, so the identities displayed immediately before launch are exactly the identities served.

## Deviations from Plan

### Auto-fixed blocking test discovery

- **Issue:** `npm run test:unit -- tests/cli/selection.test.ts` initially reported no matching tests because the existing Vitest unit include covered `tests/unit` but not the plan-owned `tests/cli` directory.
- **Fix:** Added `tests/cli/**/*.test.ts` to `vitest.config.ts` during RED, then reran the same command until it reached and failed the intended behavioral assertions.
- **Why required:** The plan explicitly requires that exact CLI file and command to provide RED/GREEN evidence.

### Auto-fixed source propagation dependency

- **Issue:** Adding source identity to the shared contract without carrying it through `createPinnedComparison` would make confirmation lose the selected worktree path and dirty fact at the frozen boundary.
- **Fix:** Updated `src/git/comparison.ts` to preserve and freeze optional source identities on pinned endpoints.
- **Why required:** The plan requires confirmation to display frozen ordered source identities and applicable paths, not pre-pin mutable picker data.

No scope crossed into changed-file inventory, diff rendering, review persistence/export, or loopback authorization.

## Issues Encountered

- The focused CLI command exposed its missing Vitest include before reaching RED. The include was corrected as test infrastructure, and the rerun then failed for the named missing behavior as required.
- The first GREEN CLI run found that available worktree search rows omitted the explicit `disabled: undefined` field asserted by the behavioral contract. The row shape was corrected; the same focused command then passed all five cases.

## Known Stubs

None in the Plan 01-04 source-selection path. A cleanup scan across every delivered implementation file found no `TODO`, `FIXME`, placeholder, deferred-selection, or not-implemented marker.

## User Setup Required

None - discovery uses the already-required installed Git executable and the already-approved locked `@inquirer/search` dependency.

## Next Phase Readiness

- Plan 01-05 can surface explicit repository/ref/merge-base failures through the now-complete interactive flow without changing selector authority.
- Plan 01-06 can derive changed-file inventory from the frozen base/head/merge-base identities produced after selection.
- Later browser/API work receives one immutable descriptor; source selection remains terminal-owned and dirty filesystem bytes remain outside the review authority boundary.
- No blocker remains for the next dependency-ordered plan.

## Self-Check: PASSED

- All ten implementation/test/config artifacts and this summary exist on disk.
- RED commit `548bbf8` and later GREEN commit `e56d12b` exist in Git history in required order, with no deleted files in the GREEN commit.
- Final focused native-Git verification exited 0 with two files and five tests passed.
- Final focused CLI verification exited 0 with one file and five tests passed.
- Stub scan returned no matches across the delivered implementation files.
- Unrelated `.planning/config.json` and `.planning/forensics/` changes were neither edited nor committed by this plan.

---
*Phase: 01-pinned-local-comparison*
*Completed: 2026-07-20*
