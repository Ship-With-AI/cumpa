---
phase: 07-github-familiar-review-surfaces
plan: "03"
subsystem: ui
tags: [vue, css, playwright, review-rail, selection, lifecycle-feedback]

requires:
  - phase: 07-github-familiar-review-surfaces
    provides: ReviewStateBadge and PathText presentation primitives with real-browser inline-comment coverage
provides:
  - transient, command-derived selected rail-comment presentation
  - framed review sections and shared file groups with flat divider-separated comment rows
  - per-comment lifecycle progress labels, spinners, and busy semantics
  - mounted and production browser evidence for rail hierarchy and selection behavior
affects: [07-04, 07-05, 07-06, 08-accessibility-responsive-continuity]

tech-stack:
  added: []
  patterns: [focus-command-derived transient selection, framed section and file-group hierarchy, pendingFocus-correlated row feedback]

key-files:
  created: []
  modified:
    - src/web/App.vue
    - src/web/components/ReviewPanel.vue
    - src/web/styles.css
    - tests/e2e/review-panel-resolved.spec.ts
    - tests/integration/anchored-workspace.spec.ts

key-decisions:
  - "Keep selectedCommentId in App presentation state, populate it only from focus-comment, and clear it only when the current comment projection no longer contains that ID."
  - "Use existing projectCommentGroups as the sole file-group and order authority while moving visual frames to major sections and groups."
  - "Correlate progressive lifecycle labels, spinner, aria-busy, and row busy styling with both pending operation and pendingFocus.commentId."

patterns-established:
  - "Rail selection remains a visible presentation cue rather than a tab stop, click target, ARIA selection state, persisted field, or lifecycle state."
  - "Comment rows stay flat inside a single framed group; lifecycle and anchor meanings remain separate icon-label badges."

requirements-completed: [REVW-03]
duration: 23min
completed: 2026-07-28
status: complete
---

# Phase 07 Plan 03: GitHub-Familiar Review Rail Summary

**The review rail now preserves the established review workflow while exposing durable command-derived selection, framed major hierarchy, grouped divider rows, and truthful per-comment lifecycle progress.**

## Performance

- **Duration:** 23 min
- **Started:** 2026-07-28T07:21:03Z
- **Completed:** 2026-07-28T07:43:30Z
- **Tasks:** 2/2
- **Files modified:** 5

## Accomplishments

- Mirrored the existing `focus-comment` command into App-local, non-persistent selection that survives focus movement, transfers to another command target, and clears when the record is removed.
- Reframed Summary, Open, Resolved, and Export; grouped comments by one path-level frame with safe directory/filename typography, separate lifecycle/anchor badges, and divider-only row interiors.
- Localized Save, Resolve, Reopen, and Delete feedback with the shared spinner, exact progressive verbs, and row/control `aria-busy` only for the action identified by `pendingFocus`.
- Added mounted hierarchy/busy assertions and production command-to-selection/delete assertions, including headed Chromium checks.

## Task Commits

Each task was committed atomically:

1. **Task 1: Mirror focus-comment into transient persistent rail selection** — `2256805` (feat)
2. **Task 2: Frame rail hierarchy, group divider rows, and localize lifecycle busy feedback** — `36d9678` (feat)

## Files Created/Modified

- `src/web/App.vue` — owns transient selected-comment ID, command mirroring, removal clearing, and direct ReviewPanel composition.
- `src/web/components/ReviewPanel.vue` — renders labeled counts, section/group/row hierarchy, independent badges, selection cue, and localized lifecycle busy controls.
- `src/web/styles.css` — defines restrained frames, shared group containers, divider rows, selection rail, wrapping, and state-overlap presentation.
- `tests/integration/anchored-workspace.spec.ts` — proves production Show comment command selection, focus independence, transfer, removal, and non-persistence.
- `tests/e2e/review-panel-resolved.spec.ts` — proves mounted hierarchy, visual framing, badge, selection, and localized Reopen busy behavior.

## Decisions Made

- Selection is sourced only from the pre-existing workspace command and remains App-local; the workspace model, events, persistence, API, and export payloads stay unchanged.
- `PathText` presents existing safe display strings in group and row headings; it does not reconstruct paths or affect grouping/order semantics.
- Busy feedback remains visually and semantically local even though the existing mutation disable boundary is operation-wide.

## Verification

- `npm run test:browser -- tests/e2e/review-panel-resolved.spec.ts` — passed (1 test).
- `npm run test:browser -- tests/integration/anchored-workspace.spec.ts --grep "Phase 07 rail selection follows focus-comment"` — passed (1 test).
- Both focused commands with `--headed` — passed (1 test each).
- `git diff --name-only 2256805^..HEAD` — exactly the five plan-declared Vue/CSS/Playwright files; no model, API, schema, persistence, export, Monaco-adapter, package, lockfile, or CommentsRail path changed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Extended the existing production fixture to accept delete mutations.**
- **Found during:** Task 1 browser proof.
- **Issue:** The Vite fixture accepted only `addComment`, so the required selected-record deletion proof could not complete through the production mutation path.
- **Fix:** Preserved the fixture's request validation and revision checks while adding its existing-schema `deleteComment` accepted-draft response.
- **Files modified:** `tests/integration/anchored-workspace.spec.ts`
- **Verification:** The focused production selection test deletes the selected record and confirms the rail cue clears.
- **Committed in:** `2256805`

---

**Total deviations:** 1 auto-fixed (1 Rule 3 blocking test-fixture correction).
**Impact on plan:** Required focused evidence for the required removal behavior; no production behavior, persistence contract, or scope changed.

## Issues Encountered

None after the fixture correction.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Subsequent review-surface plans can reuse `selectedCommentId` as strictly transient command-derived presentation and the group/row styling hooks without altering review mechanics.
- Phase 08 still owns milestone-wide narrow-layout, forced-colors, grayscale, and 400%-zoom proof.

## Self-Check: PASSED

---
*Phase: 07-github-familiar-review-surfaces*
*Completed: 2026-07-28*
