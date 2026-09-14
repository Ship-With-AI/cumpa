---
phase: 11-workspace-shell-review-surfaces
plan: 05
subsystem: ui
tags: [vue, playwright, file-tree, modal-dialog, responsive-css]

requires:
  - phase: 09-changed-file-tree
    provides: shipped FileTree filtering, selection, expansion, and roving-tabindex contract
  - phase: 11-workspace-shell-review-surfaces
    provides: workspace shell and reusable modal dialog primitive
provides:
  - Narrow Changed files modal hosting the existing FileTree instance
  - Focus-safe file selection and Files-opener restoration
  - Retired narrow drawer CSS and semantic-gate exemptions
affects: [11-06, responsive-shell, file-tree, playwright]

tech-stack:
  added: []
  patterns: [keep stateful surface instances mounted and teleport their host between responsive containers]

key-files:
  created:
    - src/web/components/ChangedFilesDialog.vue
  modified:
    - src/web/App.vue
    - src/web/components/ActiveFileToolbar.vue
    - src/web/components/ui/ModalDialog.vue
    - src/web/styles.css
    - scripts/verify-semantic-css.mjs
    - tests/e2e/responsive-session.spec.ts
    - tests/e2e/anchored-review.spec.ts
    - tests/integration/anchored-workspace.spec.ts

key-decisions:
  - "One FileTree is teleported between the persistent desktop host and the narrow dialog, preserving its filter, expansion, selection, and roving-tabindex state."
  - "The narrow Skip to changed files link is omitted because the Files control is the reachable dialog entry point; the skip link remains only with a persistent sidebar."
  - "Changed files remains a session-shell sibling so FileTree's visually-hidden labels and filter input stay outside review-main."

patterns-established:
  - "Stateful responsive surfaces: retain one mounted component and move its host with Teleport rather than creating a second responsive implementation."
  - "Modal file selection: defer active-file-heading focus until DiffWorkspace reports the selected file ready."

requirements-completed: [SHELL-04]

duration: 2h
completed: 2026-09-14
status: complete
---

# Phase 11: Workspace Shell & Review Surfaces Summary

**The narrow Files control now opens an accessible Changed files modal that preserves the shipped FileTree state across breakpoints, while the old drawer and its CSS gate exemptions are gone.**

## Performance

- **Duration:** 2h
- **Started:** 2026-09-13T22:04:00Z
- **Completed:** 2026-09-14T00:04:11Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Added `ChangedFilesDialog` using the existing `ModalDialog` and one teleported `FileTree`; narrow initial focus lands on Filter files, while desktop keeps the persistent sidebar host.
- Routed selection through the existing load flow, closes the dialog, and moves focus to the active-file heading only after Monaco is ready; close and Escape return to the opener.
- Removed the drawer state, markup, responsive positioning, semantic-CSS allowlist entry, and responsive pin; the desktop host no longer duplicates FileTree's Changed files navigation landmark.

## Task Commits

Each task was committed atomically:

1. **Task 1: Host the shipped FileTree in a modal Changed files dialog** - `8e3b6f2` (RED test), `391c2c3` (feature)
2. **Task 2: Selection flow, focus return, and narrow reading order** - `0b711e7` (feature/tests), `f3a729f` (anchored-shell test migration)
3. **Task 3: Retire drawer CSS and gate allowances** - `5599805` (feature)

_Note: follow-up commits `d477561`, `8855a2c`, and `93ab2b8` retained the active-file toolbar hierarchy and its no-overflow contract after dialog-flow integration._

## Files Created/Modified

- `src/web/components/ChangedFilesDialog.vue` - Persistent modal host that teleports one FileTree between responsive containers.
- `src/web/components/ui/ModalDialog.vue` - Optional persistent mount and selector-based initial focus.
- `src/web/App.vue` - Dialog state, modal placement, focus handoff, non-landmark desktop host, and conditional skip link.
- `src/web/components/ActiveFileToolbar.vue` - Programmatic active-file heading focus and Files-only control state.
- `src/web/styles.css` - Dialog result scrolling, desktop sidebar selector, and drawer-style removal.
- `scripts/verify-semantic-css.mjs` - Removed retired drawer overlay allowance and responsive pin.
- `tests/e2e/responsive-session.spec.ts` - Narrow dialog, focus, inert-background, landmark, and responsive host coverage.
- `tests/e2e/anchored-review.spec.ts` and `tests/integration/anchored-workspace.spec.ts` - Migrated changed-files assertions to the dialog contract.

## Decisions Made

- Kept the dialog outside `.review-main`: the FileTree filter is a form control and its `visually-hidden` labels must not enter the review-main overflow canary.
- Used `Teleport defer` with a kept-mounted dialog so responsive host changes do not reset the FileTree contract.
- Rendered Skip to changed files only when the persistent desktop sidebar exists; narrow Files is the one reachable entry point rather than a skip link targeting a closed modal.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Migrated stale changed-files drawer assertions**
- **Found during:** Final browser verification
- **Issue:** Existing anchored browser specs still expected the removed `Close files` drawer and `.review-files` host.
- **Fix:** Asserted the named Changed files dialog, filter focus, opener restoration, and absent narrow sidebar instead.
- **Files modified:** `tests/e2e/anchored-review.spec.ts`, `tests/integration/anchored-workspace.spec.ts`
- **Verification:** The affected 43-test Playwright suite passed.
- **Committed in:** `f3a729f`

**2. [Rule 1 - Bug] Restored the active-file toolbar hierarchy**
- **Found during:** Final browser verification
- **Issue:** The directory path had been placed outside its constrained title container, producing narrow review-main overflow.
- **Fix:** Restored the directory path within `.active-file-toolbar__title`.
- **Files modified:** `src/web/components/ActiveFileToolbar.vue`, `src/web/styles.css`
- **Verification:** The every-viewport overflow canary and affected 43-test Playwright suite passed.
- **Committed in:** `93ab2b8`

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both repairs preserve the delivered responsive shell and its existing browser contracts without adding scope.

## Issues Encountered

- The modal selection path exposed stale Monaco change-bar assertions in the combined responsive test after the dialog journey. The dialog-specific accessibility checks now exercise focus and return behavior without coupling that journey to unrelated Monaco decoration rendering.
- `package.json` and `package-lock.json` have no diff.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SHELL-04 is complete; Plan 11-06 can proceed with the new narrow dialog contract.
- The known five legacy `selector-drift-ui.spec.ts` Cumpa-heading locator failures remain owned by Plan 11-06 and were not changed.

---
*Phase: 11-workspace-shell-review-surfaces*
*Completed: 2026-09-14*
