---
phase: 11-workspace-shell-review-surfaces
plan: 04
subsystem: ui
tags: [vue, playwright, review-rail, modal-dialog, css]

requires:
  - phase: 11-workspace-shell-review-surfaces
    provides: workspace shell, modal primitives, and review-surface styling foundations from plans 11-01 through 11-03
provides:
  - Review notes modal for summary, export, receipt, and attached-session controls
  - comments-only review rail with stale-feedback focus routing
  - sticky opaque review rail heading with persistent state counts
affects: [11-05, 11-06, review-surfaces, playwright]

tech-stack:
  added: []
  patterns: [mount non-diff form dialogs as session-shell siblings, route cross-surface focus through App.vue]

key-files:
  created:
    - src/web/components/ReviewNotesDialog.vue
  modified:
    - src/web/App.vue
    - src/web/components/ReviewPanel.vue
    - src/web/styles.css
    - tests/e2e/complete-review-draft.spec.ts
    - tests/e2e/review-panel-resolved.spec.ts

key-decisions:
  - "Review notes owns summary, export, receipt, attached completion, and modal-scoped failures; the rail retains comment history and its local mutation conflict feedback."
  - "App.vue coordinates stale-feedback focus by closing Review notes, opening the rail, and invoking its exposed comment focus method."
  - "The review rail heading is sticky and opaque inside its existing scroll container."

patterns-established:
  - "Modal-owned review controls: explicitly open Review notes before exercising summary/export behavior in browser specs."
  - "Rail tests: ensureReviewOpen remains the rail toggle; close the rail before interacting with occluded diff controls."

requirements-completed: [REV-02, REV-04]

duration: 1h 32m
completed: 2026-09-13
status: complete
---

# Phase 11: Workspace Shell & Review Surfaces Summary

**Review notes now overlays the full-width diff as a modal while the compact comments rail keeps review history, focus restoration, and a pinned heading visible during scrolling.**

## Performance

- **Duration:** 1h 32m
- **Started:** 2026-09-13T21:22:00Z
- **Completed:** 2026-09-13T22:54:32Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Split summary, export, receipt, drift acknowledgement, attached completion, and review-note failures out of `ReviewPanel` into `ReviewNotesDialog`, mounted as a `.session-shell` sibling of `.review-shell`.
- Routed stale-feedback review actions through `App.vue`, which closes the modal and opens/focuses the selected rail comment; review-note specs now explicitly enter the modal.
- Made the rail heading sticky and opaque with persistent state badges, protected by a browser scroll test.

## Task Commits

Each task was committed atomically:

1. **Task 1: Split review notes from comments rail** - `aa1d6c8` (RED test), `49c5dde` (feature), `7bea1f0` (surface-local failure correction), `d443d07` (template cleanup)
2. **Task 2: Re-point review note surface specs** - `22ecd2b` (tests), `f33db50` (anchored review shell assertions)
3. **Task 3: Pin review rail heading** - `469449c` (RED test), `7f516c1` (feature)

## Files Created/Modified

- `src/web/components/ReviewNotesDialog.vue` - Modal review-notes surface for summary, export, attached lifecycle, and errors.
- `src/web/components/ReviewPanel.vue` - Comments-only rail with exposed focus methods and rail-local conflict feedback.
- `src/web/App.vue` - Owns modal visibility and cross-surface stale-feedback routing.
- `src/web/styles.css` - Sticky opaque rail heading styling.
- `tests/e2e/review-notes-dialog.spec.ts` - Modal behavior, summary access, and Escape coverage.
- `tests/e2e/complete-review-draft.spec.ts` - Opens Review notes for summary behavior and explicitly manages rail visibility.
- `tests/e2e/review-panel-resolved.spec.ts` - Modal harness and sticky-rail browser coverage.
- `tests/e2e/anchored-review.spec.ts` - Current shell endpoint, rail, and responsive drawer assertions.
- `tests/e2e/agent-ready-export-safety.spec.ts` - Uses the Review notes component in its virtual lifecycle harness.
- `tests/integration/selector-drift-ui.spec.ts` - Opens Review notes for the summary buffer flow.
- `tests/integration/export-receipt-ui.spec.ts` - Scopes export controls to Review notes.

## Decisions Made

- Kept the dialog outside `.review-main` and `.review-shell`: the diff remains full width and the dialog textarea is never placed inside the overflow canary.
- Retained operation failures in the modal and revision conflicts in the rail when their comment mutation originated there, preserving each interaction surface's accessible feedback.
- Used existing `ModalDialog.vue` rather than introducing a second dialog primitive.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Repaired stale shell locators in anchored review coverage**
- **Found during:** Final verification
- **Issue:** Endpoint and responsive file-drawer assertions no longer matched the current accessible shell controls; the rail also must be explicitly opened before reading its cards.
- **Fix:** Scoped endpoint labels to the banner, used the current responsive breakpoint/control name, and opened the rail before rail-only assertions.
- **Files modified:** `tests/e2e/anchored-review.spec.ts`
- **Verification:** `npx playwright test tests/e2e/anchored-review.spec.ts` passed (2 tests).
- **Committed in:** `f33db50`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary test alignment with the delivered shell; no product scope added.

## Issues Encountered

- The planned combined Playwright verification passed 38 of 43 tests. The five failures are the pre-existing Plan 11-06-owned legacy `getByRole('heading', { name: /Cumpa:/ })` failure in `tests/integration/selector-drift-ui.spec.ts`; it was intentionally left unchanged.
- `npx vitest run tests/integration/complete-review-panel.spec.ts` reports no test files because the repository's Vitest include configuration excludes `tests/integration/**`; the file was not modified, as directed.
- `npm run typecheck:web`, `npm run verify:semantic-css`, the production web build, the task-3 Playwright run, and the anchored-review run all passed. `package.json` and `package-lock.json` have no diff.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Review notes and the comments rail are separated and ready for downstream workspace-surface work.
- Plan 11-06 should repair the documented selector-drift legacy Cumpa-heading locators.

---
*Phase: 11-workspace-shell-review-surfaces*
*Completed: 2026-09-13*
