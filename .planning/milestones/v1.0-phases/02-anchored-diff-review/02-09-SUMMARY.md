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
  - "The composer view zone permits mouse events, while Vue restores focus only after its target textarea is mounted."
  - "Stale and orphaned comments expose immutable recorded-anchor metadata; inspect is available only for exact-file capabilities."

patterns-established:
  - "Monaco controls: derive one affordance from the focused model line rather than rendering independent per-line controls."
  - "Drawer accessibility: closed non-modal panels are inert and closing restores focus to their opener."

requirements-completed: [DIFF-07, CMT-01, CMT-08, DRFT-02]
duration: current execution session
completed: 2026-07-21
status: complete
---

# Phase 02 Plan 09: Anchored Composer Summary

**One Monaco-anchored composer now preserves non-empty drafts through explicit move-or-discard confirmation, accepts confirmation clicks inside its view zone, and restores focus to the recreated target textarea.**

## Performance

- **Duration:** Current execution session
- **Started:** Not recorded
- **Completed:** 2026-07-21
- **Tasks:** 3 plan tasks plus two production-regression repairs
- **Files modified:** 9 plan files; 4 repair files

## Accomplishments

- Added loss-safe composer movement state, including pending move targets, explicit confirmation, keep-writing, and discard transitions.
- Mounted one Vue composer inside a paired Monaco view zone at the actual model line, with responsive drawers and recorded-anchor detail actions.
- Repaired the packaged non-line-1 move flow: the composer zone no longer suppresses its confirmation clicks, the pending target remains actionable after Keep writing, and focus is restored after the target composer mounts.
- Repaired exact-byte draft-resume navigation at the standard desktop viewport by keeping the comments rail accessible at 1280px while retaining the tested drawer behavior at 1200px.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add loss-safe composer movement state** - `242659c` (RED test), `6a73a1e` (feature)
2. **Task 2: Anchor the single composer to Monaco model lines** - `dccfa5e` (feature)
3. **Task 3: Lock the end-to-end anchored interaction** - `c48e094` (test and stabilization)
4. **Production repair: Restore anchored composer confirmation** - `826c109` (fix)
5. **Production repair: Keep resumed comments accessible** - `e8f5eea` (fix)

**Plan metadata:** `e4bd9f8` (docs: complete anchored composer gap closure plan)

## Files Created/Modified

- `src/web/model/workspace-state.ts` - Retains the pending move target after Keep writing so the intended target action remains available.
- `src/web/components/DiffWorkspace.vue` - Synchronizes the model anchor, view-zone composer, targeted affordance, and post-mount textarea focus.
- `src/web/monaco/diff-adapter.ts` - Forces side-by-side interaction, exposes a model-line affordance lookup, and permits mouse interaction in the composer zone.
- `src/web/components/CommentsRail.vue` - Presents recorded stale/orphan anchor details and capability-gated inspection.
- `src/web/App.vue` - Routes composer and rail events, keeps resumed comment actions accessible at 1280px, and retains drawer behavior below 1280px.
- `src/web/styles.css` - Positions Monaco-line actions without line-one assumptions.
- `tests/unit/workspace-state.test.ts` - Covers movement confirmation state transitions.
- `tests/integration/anchored-workspace.spec.ts` - Exercises the live Monaco composer, drawer behavior, and record actions.

## Decisions Made

- Preserve a draft at its existing anchor while presenting a move confirmation; only explicit discard recreates the composer at the requested target.
- Keep one model-derived gutter action rather than adding static duplicated controls.
- Keep a composer view zone interactive (`suppressMouseDown: false`); view-zone event suppression prevented the confirmation event from reaching Vue.
- Restore focus from the mounted Vue annotation, rather than with timeout or animation-frame retries.
- Keep the comments rail visible at the standard 1280px desktop viewport; reserve its drawer mode for widths at or below 1279px.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Repaired composer confirmation clicks swallowed by Monaco view-zone mouse suppression**
- **Found during:** packaged Plan 02-10 regression reproduction
- **Issue:** The composer remained in `confirm-move` after Discard draft because its Monaco view zone suppressed the mouse interaction. The recreated target textarea therefore could not receive focus.
- **Fix:** Restored interactive view-zone mouse handling, preserved the pending target across Keep writing, derived its exact model-line affordance, and focused the mounted target textarea without timing retries.
- **Files modified:** `src/web/model/workspace-state.ts`, `src/web/components/DiffWorkspace.vue`, `src/web/monaco/diff-adapter.ts`
- **Verification:** The original package repro advanced through the former line-202 focus assertion and persisted the head-line-10 comment; focused unit and browser checks passed.
- **Committed in:** `826c109` (production repair)

### Auto-fixed Issues

**2. [Rule 1 - Bug] Restored accessible Show comment controls after exact-byte draft resume**
- **Found during:** Plan 02-10 Task 2 combined browser verification
- **Issue:** The 1439px comments-drawer breakpoint made the resumed rail inert at Playwright's standard 1280px viewport, so its verified `Show comment` action was not in the accessibility tree.
- **Fix:** Moved the comments-drawer breakpoint to 1279px. The rail remains directly accessible at 1280px; the existing responsive drawer behavior remains active at 1200px.
- **Files modified:** `src/web/App.vue`
- **Verification:** Both exact-byte draft-resume and anchored-gap browser scenarios pass together.
- **Committed in:** `e8f5eea` (production repair)

---


**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both repairs restore required interaction and accessibility contracts without scope expansion.

## Issues Encountered

None. The package exact-anchor scenario now passes after Plan 02-10 updated its own persisted-comparison expectation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Anchored composer movement, confirmation, focus restoration, exact-byte resume navigation, and model-line interaction are verified by focused unit, browser, and packaged checks.
- Plan 02-10 can resume from a verified Plan 02-09 production baseline.

---
*Phase: 02-anchored-diff-review*
*Completed: 2026-07-21*
