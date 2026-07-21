---
phase: 02-anchored-diff-review
plan: 09
subsystem: ui
tags: [vue, monaco-editor, playwright, vitest, review-comments]

requires:
  - phase: 02-anchored-diff-review
    provides: recorded durable anchors and exact-file capabilities from Plan 02-08
provides:
  - One Monaco-model-anchored composer with loss-safe draft movement confirmation
  - Responsive non-modal file and comments drawers with focus restoration
  - Recorded-anchor detail actions for stale and orphaned comments
affects: [anchored-diff-review, review-comments, browser-testing]

tech-stack:
  added: []
  patterns: [Monaco view zones host Vue annotation content, explicit exact-file capability actions]

key-files:
  created: []
  modified:
    - src/web/model/workspace-state.ts
    - src/web/components/DiffWorkspace.vue
    - src/web/monaco/diff-adapter.ts
    - src/web/components/CommentsRail.vue
    - src/web/App.vue
    - tests/integration/anchored-workspace.spec.ts

key-decisions:
  - "Draft movement records a pending target and requires explicit discard before replacing the anchor."
  - "The Monaco view-zone composer is sized from rendered content and focus is deferred until its textarea exists."
  - "Stale and orphaned comments expose immutable recorded-anchor metadata; inspect is available only for exact-file capabilities."

patterns-established:
  - "Monaco controls: derive one affordance from the focused model line rather than rendering independent per-line controls."
  - "Drawer accessibility: closed non-modal panels are inert and closing restores focus to their opener."

requirements-completed: [DIFF-07, CMT-01, CMT-08, DRFT-02]

duration: current execution session
completed: 2026-07-21
status: complete
---

# Phase 02: Anchored Diff Review Summary

**One Monaco-anchored review composer now preserves non-empty drafts through explicit move-or-discard confirmation, while stale records retain exact inspection metadata.**

## Performance

- **Duration:** Current execution session
- **Started:** Not recorded
- **Completed:** 2026-07-21T18:39:27Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Added loss-safe composer movement state, including pending move targets, explicit confirmation, keep-writing, and discard transitions.
- Replaced line-one-only and duplicate composer rendering with one Vue composer mounted inside a paired Monaco view zone at the actual model line.
- Added responsive file/comments drawers and recorded-anchor copy/inspect actions with focused browser coverage for movement, drawers, and stale/orphaned records.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add loss-safe composer movement state** - `242659c` (RED test), `6a73a1e` (feature)
2. **Task 2: Anchor the single composer to Monaco model lines** - `dccfa5e` (feature)
3. **Task 3: Lock the end-to-end anchored interaction** - `c48e094` (test and stabilization)

## Files Created/Modified

- `src/web/model/workspace-state.ts` - Models pending draft movement and confirmation transitions.
- `src/web/components/CommentComposer.vue` - Emits move confirmation through existing destructive controls.
- `src/web/components/DiffWorkspace.vue` - Mounts the single composer in Monaco zones and synchronizes focus/geometry.
- `src/web/monaco/diff-adapter.ts` - Supplies focused-line affordances and paired zone sizing.
- `src/web/components/CommentsRail.vue` - Presents recorded stale/orphan anchor details and capability-gated inspection.
- `src/web/App.vue` - Routes composer and rail events and manages responsive drawers.
- `src/web/styles.css` - Positions Monaco-line actions without line-one assumptions.
- `tests/unit/workspace-state.test.ts` - Covers movement confirmation state transitions.
- `tests/integration/anchored-workspace.spec.ts` - Exercises the live Monaco composer, drawer behavior, and record actions.

## Decisions Made

- Preserve a draft at its existing anchor while presenting a move confirmation; only explicit discard recreates the composer at the requested target.
- Keep one model-derived gutter action rather than adding static duplicated controls.
- Treat `exactFile` as the only authority for inspection availability; recorded anchor text remains available even when navigation is not.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Sized and focused Monaco-hosted composer content after the real zone is mounted**
- **Found during:** Task 3 browser verification
- **Issue:** Monaco's initial view-zone height clipped composer actions and focus could occur before the mounted textarea existed.
- **Fix:** Used a paired 280px baseline zone, measured rendered content, and deferred focus until the current Monaco-zone textarea exists.
- **Files modified:** `src/web/components/DiffWorkspace.vue`, `src/web/monaco/diff-adapter.ts`
- **Verification:** Anchored Playwright scenario passes including focus, confirmation, and move.
- **Committed in:** `c48e094`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Required for the planned model-line composer to be operable; no scope expansion.

## Issues Encountered

- Monaco view-zone descendants are not discoverable by page-level accessibility role queries in the browser fixture, so the browser test targets their DOM controls directly while retaining actual focus and visible-control assertions.
- A programmatic adapter reset could re-emit an activation and overwrite a pending move; synchronization now records the observed anchor before resetting the adapter.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Anchored composer behavior is covered by focused unit and browser tests.
- Exact record capabilities are exposed without restoring unsafe path or file fallbacks.

---
*Phase: 02-anchored-diff-review*
*Completed: 2026-07-21*
