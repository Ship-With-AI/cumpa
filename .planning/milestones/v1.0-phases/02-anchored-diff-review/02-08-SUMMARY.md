---
phase: 02-anchored-diff-review
plan: 08
subsystem: web workspace draft recovery
tags: [vue, typescript, vitest, playwright, durable-anchors, exact-path]
requires:
  - phase: 02-07
    provides: persisted draft responses and anchored workspace state
provides:
  - Exact-byte, side-specific reconciliation from validated durable anchors to opaque comparison files
  - Recorded-anchor evidence and explicit unavailable file capabilities for workspace comments
  - Same-display non-UTF-8 browser recovery regression in both duplicate file orders
affects: [02-09-comments-rail, draft-resume, comment-navigation]
tech-stack:
  added: []
  patterns:
    - Durable anchors select only the matching base or head ExactPath bytesBase64url value
    - Display strings remain presentation data and never grant a workspace file capability
key-files:
  created:
    - src/web/model/draft-reconciliation.ts
    - tests/unit/draft-reconciliation.test.ts
  modified:
    - src/web/model/workspace-state.ts
    - src/web/App.vue
    - tests/integration/anchored-workspace.spec.ts
key-decisions:
  - "Index active comparison paths by side and exact bytesBase64url before reconciling comments."
  - "Retain validated durable-anchor evidence even when the active comparison lacks an exact file capability."
patterns-established:
  - "Draft hydration delegates all persisted-comment matching through reconcileDraftComments."
requirements-completed: [CMT-08, DRFT-02]
duration: 20min
completed: 2026-07-21
status: complete
---

# Phase 02 Plan 08: Exact-byte Draft Reconciliation Summary

**Persisted draft comments now recover only to the opaque file whose anchor-selected path bytes match, while stale, orphaned, and unavailable records keep their immutable recorded evidence.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-07-21T17:14:37Z
- **Completed:** 2026-07-21T17:34:34Z
- **Tasks:** 3/3
- **Files modified:** 5

## Accomplishments

- Added a pure reconciler that uses `bytesBase64url` on the anchor's base or head side and never consults safe display text.
- Extended workspace comments with validated recorded-anchor details plus an explicit exact-file capability, preserving stale/orphaned state independently.
- Added unit and browser regressions for colliding non-UTF-8 displays; the browser opens the expected opaque file after both duplicate orderings.

## Task Commits

1. **Task 1: RED — specify exact-byte, side-specific draft reconciliation** — `81df5bb` (`test`)
2. **Task 2: GREEN — reconcile durable anchors into exact workspace records** — `19da770` (`feat`)
3. **Task 3: REFACTOR — centralize invariants and prove deterministic hydration** — `0514921` (`refactor`)

**TDD Gate Compliance:** PASSED — the RED test commit precedes the GREEN feature commit, followed by the refactor commit.

## Files Created/Modified

- `src/web/model/draft-reconciliation.ts` — exact-byte, anchor-side reconciliation and linear side-path indexing.
- `src/web/model/workspace-state.ts` — recorded-anchor evidence and unavailable/available exact-file capability model.
- `src/web/App.vue` — delegates durable draft hydration to `reconcileDraftComments` and preserves canonical accepted anchors.
- `tests/unit/draft-reconciliation.test.ts` — collision, side-selection, unavailable, stale, and orphaned contracts.
- `tests/integration/anchored-workspace.spec.ts` — browser recovery proof across reversed same-display path ordering.

## Decisions Made

- Exact path identity is the selected side's `bytesBase64url` value; `safeDisplayPath` and `path.display` are presentation-only.
- A verified server status does not manufacture an inline navigation capability when the active comparison has no exact matching file.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Preserved existing workspace-controller callers while enforcing unavailable navigation denial**
- **Found during:** Task 2
- **Issue:** Existing workspace-state test fixtures predate the exact-file capability and caused the controller to dereference a missing capability.
- **Fix:** The controller explicitly denies any recorded `unavailable` capability, while retaining compatibility for pre-existing in-memory callers that do not represent persisted drafts.
- **Files modified:** `src/web/model/workspace-state.ts`
- **Verification:** `npm run test:unit -- tests/unit/draft-reconciliation.test.ts` — 59 tests passed.
- **Committed in:** `19da770` (Task 2)

---

**Total deviations:** 1 auto-fixed (1 blocking issue).
**Impact on plan:** The adjustment keeps unavailable durable records from issuing navigation commands without changing the persisted-draft reconciliation boundary.

## Issues Encountered

- The browser collision fixture needed distinct navigation URLs for its two relaunches; the regression now forces a fresh application bootstrap for each duplicate ordering.

## Verification

- `npm run test:unit -- tests/unit/draft-reconciliation.test.ts` — passed: 8 files, 59 tests.
- `npm run test:browser -- tests/integration/anchored-workspace.spec.ts --grep "exact-byte draft resume"` — passed: 1 browser test, including both duplicate orderings.
- Confirmed no package installation, schema, or ORM changes were introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02-09 can consume `recordedAnchor` for rail inspection and `exactFile` to gate verified inline navigation.
- No blockers.

## Self-Check: PASSED

- Required reconciliation module and unit contract exist.
- RED (`81df5bb`), GREEN (`19da770`), and REFACTOR (`0514921`) commits exist in that order.
- Focused unit and browser verification commands pass.

---
*Phase: 02-anchored-diff-review*
*Completed: 2026-07-21*
