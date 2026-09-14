---
phase: 11-workspace-shell-review-surfaces
plan: 07
subsystem: ui
tags: [vue, css, playwright, monaco, review-cards]

requires:
  - phase: 11-workspace-shell-review-surfaces
    provides: workspace-shell styling foundations, inline comment view zones, and comments-only review rail from plans 11-01 through 11-04
provides:
  - Inline composer and accepted-comment cards use the rail visual hierarchy without changing review behavior or copy
  - Dead CommentsRail and EmptyState component wrappers are removed without touching shared live-surface styles
affects: [11-06, review-surfaces, playwright]

tech-stack:
  added: []
  patterns: [use canonical canvas bodies with panel bands and border-gap separators for inline review cards]

key-files:
  created:
    - .planning/phases/11-workspace-shell-review-surfaces/11-07-SUMMARY.md
  modified:
    - src/web/styles.css
    - tests/e2e/anchored-review.spec.ts
  deleted:
    - src/web/components/CommentsRail.vue
    - src/web/components/EmptyState.vue

key-decisions:
  - "Keep existing conversation-card geometry and view-zone containment intact; alter only its canonical token-based visual hierarchy."
  - "Retain shared empty-state and comments-rail selectors because live App, ReviewPanel, and prototype surfaces still consume them."

patterns-established:
  - "Inline card visual coverage: package-level browser assertions inspect canonical card surface and separator bytes."

requirements-completed: [REV-01]

duration: 16min
completed: 2026-09-13
status: complete
---

# Phase 11: Workspace Shell & Review Surfaces Summary

**Inline Base/Head review cards now use canvas bodies, quiet rail-family header/footer bands, and canonical hairline separators while preserving their Monaco view-zone mechanics and reviewer-facing copy.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-09-13T23:01:23Z
- **Completed:** 2026-09-13T23:17:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added packaged-browser coverage that first proved the inline composer card lacked its intended canvas body and header separator, then passed after the restyle.
- Restyled shared inline composer and accepted-comment cards with existing `--surface-canvas`, `--surface-panel`, and `--border-gap` tokens while retaining the load-bearing card position, z-index, and margins.
- Deleted the unreferenced `CommentsRail.vue` and `EmptyState.vue` wrappers, removing only their exclusive `changed-file-count` mono selector and retaining shared live styles.

## Task Commits

Each task was committed atomically:

1. **Task 1: Restyle inline comment cards** - `e3afe81` (RED test), `e17f94c` (feature)
2. **Task 2: Remove dead review components** - `6d7085f` (refactor)

_Note: Task 1 used TDD; the new browser assertion failed against the old panel background before the CSS change._

## Files Created/Modified

- `src/web/styles.css` - Canvas card bodies, panel header/footer bands, and canonical `border-gap` separators; removes the exclusive dead-component selector.
- `tests/e2e/anchored-review.spec.ts` - Packaged-browser visual contract for the inline composer card.
- `src/web/components/CommentsRail.vue` - Deleted stale forwarding wrapper with no importers.
- `src/web/components/EmptyState.vue` - Deleted stale wrapper with no importers.
- `.planning/phases/11-workspace-shell-review-surfaces/11-07-SUMMARY.md` - Execution record and validation evidence.

## Decisions Made

- Kept all component templates and interaction mechanics unchanged: styling the shared card primitives updates both composer and accepted cards without risking paired Monaco zone geometry.
- Used existing canonical semantic tokens exclusively; no token, literal color, shadow, or live-region behavior was added.
- Kept shared `.empty-state` and `.comments-rail*` selectors because they are still used by `App.vue`, `ReviewPanel.vue`, and the Phase 6 prototype.

## Deviations from Plan

None - plan executed exactly as written. `CommentComposer.vue` required no template change because its existing shared `conversation-card` structure already applies the restyle without altering copy or behavior.

## Issues Encountered

- The expected RED browser proof failed with `rgb(22, 27, 34)` where the new contract expected the canonical canvas `rgb(13, 17, 23)`; the feature commit made the assertion pass.
- `npm run typecheck:web`, `npm run verify:semantic-css`, production web builds, Task 1's 30 Playwright tests, Task 2's 12 Playwright tests, and final combined Playwright verification (42 tests) all passed.
- `npx vitest run tests/unit tests/api tests/git` twice timed out only `tests/git/candidates.test.ts`'s malformed-protocol case after 10 seconds (56 files passed). The unchanged case passes alone (17 tests), and `npx vitest run tests/api tests/git` passes (28 files, 211 tests). No test or source outside this plan was changed.
- The five Plan 11-06-owned legacy selector-drift heading failures remain untouched, as directed. `package.json` and `package-lock.json` have no diff.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Inline review cards and the comments rail now share one visual hierarchy without adding a second interaction path.
- The cross-suite Vitest timeout above remains for its owning test-suite work; direct Git candidate and API/Git suite coverage is green.

---
*Phase: 11-workspace-shell-review-surfaces*
*Completed: 2026-09-13*
