---
phase: 12-request-protocol-range-grounding
plan: 02
subsystem: native-git-range-grounding
tags: [git, pathspec, sha256, zod, vitest, tdd]
requires:
  - phase: 12-request-protocol-range-grounding
    plan: 01
    provides: Strict bounded agent request validation for revision and pathspec inputs
provides:
  - Explicit ancestor ranges pinned to full Git commit OIDs with equality accepted
  - Native ordered pathspec inventory with controlled Git pathspec environment
  - Immutable range provenance and domain-separated scoped review identity
affects: [12-03, 12-04, 12-05, 12-06, range-session, draft-export-provenance]
tech-stack:
  added: []
  patterns:
    - Resolve submitted revisions once, then consume pinned OIDs only
    - Delegate every submitted pathspec unchanged to Git after an explicit terminator
    - Length-frame domain-separated review identity inputs
key-files:
  created: []
  modified:
    - src/contracts/comparison.ts
    - src/domain/comparison-key.ts
    - src/domain/errors.ts
    - src/git/comparison.ts
    - src/git/inventory.ts
    - src/git/runner.ts
    - tests/git/comparison.test.ts
    - tests/git/inventory.test.ts
    - tests/unit/comparison-key.test.ts
key-decisions:
  - "Explicit range graph policy accepts equality and requires baseOid ancestry; interactive merge-base policy remains unchanged."
  - "Git alone interprets ordered pathspecs after --; the runner removes inherited global pathspec-mode variables."
  - "Range review keys use a distinct SHA-256 domain and frame every ordered pathspec separately."
patterns-established:
  - "Pinned range provenance is optional on the existing PinnedComparison model and deeply frozen at its mutable boundaries."
requirements-completed: [RANGE-01, RANGE-02, RANGE-03]
duration: 6min
completed: 2026-08-04
status: complete
---

# Phase 12 Plan 02: Pinned Native Range Scope Summary

**Explicit ancestor ranges now resolve once to immutable Git OIDs, retain Git-native ordered pathspec scope, and receive an order-sensitive review identity without changing interactive comparisons.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-08-04T18:58:27Z
- **Completed:** 2026-08-04T19:04:21Z
- **Tasks:** 3/3
- **Files modified:** 9

## Accomplishments

- Added `createPinnedRangeComparison`, which resolves submitted revisions only in two commit-peel calls, accepts equal commits, requires `baseOid` ancestry, and inventories from the supplied pinned base OID.
- Added immutable optional `range` provenance to the single comparison model, including inert requested labels, full OIDs, exact ordered pathspecs, and `rangeReviewKey`.
- Sent one frozen `['--', ...pathspecs]` tail to both native diff protocols and cleared inherited global pathspec-mode variables before Git spawn.
- Translated invalid scoped native Git diff failures into a bounded typed `invalid-pathspec` launch error without exposing stderr or submitted values.

## Task Commits

| Task | Evidence | Commit |
| --- | --- | --- |
| 1. RED — specify explicit ancestry, native pathspec, and scoped identity contracts | Focused Vitest command exited 1: missing range builder/key plus native pathspec-tail/environment behavior. Existing interactive cases remained in the same run. | `82cb969` |
| 2. GREEN — build the pinned ancestor range and exact native scope | The same focused command passed: 3 files, 34 tests. | `0dfc69e` |
| 3. REFACTOR — share pinned construction without weakening interactive semantics | Extracted one shared object-format validation probe; focused matrix remained 3 files, 34 tests passing. | `35b35d8` |

## Native Git Command Trace Contract

Submitted endpoint labels occur only in:

```text
git rev-parse --verify --end-of-options <baseRevision>^{commit}
git rev-parse --verify --end-of-options <headRevision>^{commit}
```

All later graph, verification, and inventory commands use full OIDs:

```text
git merge-base --is-ancestor <baseOid> <headOid>
git cat-file -e <baseOid>^{commit}
git cat-file -e <headOid>^{commit}
git diff --raw -z --no-abbrev ... <baseOid> <headOid> -- <exact ordered pathspecs>
git diff --numstat -z ... <baseOid> <headOid> -- <exact ordered pathspecs>
```

The focused recording tests prove the two submitted revision occurrences and byte-for-byte equivalent ordered tails for empty, include, exclude, exclude-only, magic, leading-dash, and whitespace scopes. Real-Git tests compare the scoped inventory to direct native output and prove `GIT_LITERAL_PATHSPECS=1` cannot reinterpret submitted scope.

## Scoped Key Vectors

- Identical SHA-1 or SHA-256 endpoint strings plus identical ordered pathspec strings yield the same lowercase 64-character key.
- Swapping endpoints, reordering scope, inserting/removing scope entries, or changing framing boundaries yields a different key.
- `rangeReviewKey` has a separate domain from the unchanged interactive `comparisonKey`.

## Files Created/Modified

- `src/contracts/comparison.ts` — strict optional readonly range provenance schema on `PinnedComparison`.
- `src/domain/comparison-key.ts` — separate length-framed range review key.
- `src/domain/errors.ts` — typed range-specific non-ancestor and invalid-pathspec launch categories.
- `src/git/comparison.ts` — explicit pinned range construction, ancestry policy, scoped failure translation, and shared object-format validation.
- `src/git/inventory.ts` — one frozen exact native pathspec tail used by raw and numstat inventory calls.
- `src/git/runner.ts` — controlled child environment clears global Git pathspec modes.
- `tests/git/comparison.test.ts` — resolve-once, equality, reverse-range, unavailable-revision, and moving-ref contracts.
- `tests/git/inventory.test.ts` — ordered native scope, environment, attribute-magic, and invalid-magic contracts.
- `tests/unit/comparison-key.test.ts` — scoped identity stability, isolation, and framing vectors.

## Decisions Made

- Kept the existing interactive merge-base and equality behavior intact; explicit request ranges have their own contiguous-ancestor policy.
- Kept pathspec syntax opaque to TypeScript, including attribute magic; only installed Git decides validity and selection.
- Kept range scope on the existing frozen comparison rather than creating a second comparison or inventory model.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test correctness] Corrected the parameter-table shape for the empty pathspec case.**
- **Found during:** Task 2 (GREEN)
- **Issue:** Vitest treats an empty row as zero callback arguments, so the intended empty-scope assertion received `undefined` rather than `[]`.
- **Fix:** Wrapped each table value in one callback-argument row, preserving the requested pathspec matrix.
- **Files modified:** `tests/git/inventory.test.ts`
- **Verification:** The focused 34-test matrix passes, including the empty scope.
- **Committed in:** `0dfc69e`

**2. [Rule 2 - Missing critical functionality] Added range error discriminants to the existing launch-error union.**
- **Found during:** Task 2 (GREEN)
- **Issue:** The declared typed non-ancestor and invalid-pathspec failures could not be represented by the existing public error union.
- **Fix:** Added `non-ancestor-range` and `invalid-pathspec` while retaining the existing exit recovery shape.
- **Files modified:** `src/domain/errors.ts`
- **Verification:** Focused range failure tests pass with bounded typed errors.
- **Committed in:** `0dfc69e`

---

**Total deviations:** 2 auto-fixed (1 test correctness, 1 missing typed error contract).
**Impact on plan:** Both fixes were required for the plan's explicit observable contract; no new dependency, pathspec parser, persistence model, or browser surface was added.

## Issues Encountered

None remaining.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 12-03 can thread the frozen range provenance and review key through draft, session, export, and result ownership.
- No blocker remains for the next dependency-ordered plan.

---
*Phase: 12-request-protocol-range-grounding*
*Completed: 2026-08-04*

## Self-Check: PASSED

- Summary exists at `.planning/phases/12-request-protocol-range-grounding/12-02-SUMMARY.md`.
- RED `82cb969`, GREEN `0dfc69e`, and REFACTOR `35b35d8` exist in Git history in that order.
- The final required focused command passed: `npm exec -- vitest run tests/git/comparison.test.ts tests/git/inventory.test.ts tests/unit/comparison-key.test.ts` (3 files, 34 tests).
- No stub markers or unplanned network, authentication, filesystem, or schema trust boundary was introduced.
