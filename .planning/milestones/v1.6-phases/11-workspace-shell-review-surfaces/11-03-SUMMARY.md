---
phase: 11-workspace-shell-review-surfaces
plan: "03"
subsystem: ui
tags: [vue, accessibility, modal-dialog, file-metadata, playwright]

requires:
  - phase: 11-workspace-shell-review-surfaces
    provides: "ModalDialog primitives and the workspace review shell restyle from plans 11-01 and 11-02"
provides:
  - "Unified Details modal containing comparison provenance, selected-file metadata, and keyboard help"
  - "Live selected-file metadata loading with stale-response protection and retry"
  - "Content-only identity and keyboard-help sections outside the review main landmark"
affects: [workspace-shell, review-surfaces, accessibility]

tech-stack:
  added: []
  patterns: ["Dialog composition through ModalDialog", "Selected-resource request versioning"]

key-files:
  created:
    - src/web/components/DetailsDialog.vue
  modified:
    - src/web/App.vue
    - src/web/components/FileMetadataPane.vue
    - src/web/components/IdentityPanel.vue
    - src/web/components/KeyboardHelp.vue
    - tests/e2e/pinned-session.spec.ts

key-decisions:
  - "Details owns the single modal state; header, toolbar, and ? shortcut all route through it."
  - "Metadata loads when selection changes, using an independent request counter to reject stale responses."
  - "Details mounts as a session-shell sibling of review-shell, keeping review-main as the sole main landmark."

patterns-established:
  - "Modal content sections are semantic content only; ModalDialog owns dialog semantics, focus trapping, Escape, and focus restoration."
  - "Live per-file requests use their own monotonic version counter rather than sharing diff-content request state."

requirements-completed: [REV-03]

duration: 36min
completed: 2026-09-14
status: complete
---

# Phase 11: Workspace Shell Review Surfaces Summary

**A single accessible Details modal now presents comparison provenance, current file metadata, and keyboard help without nesting dialogs or landmarks inside the review workspace.**

## Performance

- **Duration:** 36 min
- **Started:** 2026-09-13T23:30:37+02:00
- **Completed:** 2026-09-14T00:07:27+02:00
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Wired `FileMetadataPane` to live, selected-file metadata requests with independent stale-response protection, errors, and retry.
- Added `DetailsDialog` as the sole modal composition for identities, exact-patch provenance, metadata, and keyboard actions.
- Moved keyboard-help access from the review main region into Details while retaining the toolbar and `?` entry points.
- Removed duplicate main-landmark behavior and obsolete modal behavior from content-only panel components.

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire live selected-file metadata** - `ed5f4fd` (test RED), `5e8f5a7` (feat GREEN)
2. **Task 2: Compose Details content and retire nested panels** - `1dbb5cd` (test RED), `3adb068` (feat GREEN)
3. **Task 3: Mount Details and migrate triggers, styling, and fixtures** - `2e7f631` (feat)

**Plan metadata:** pending this summary commit

_Note: TDD tasks have separate RED and GREEN commits._

## Files Created/Modified

- `src/web/components/DetailsDialog.vue` - Composes identity, metadata, and keyboard-help sections in `ModalDialog`.
- `src/web/App.vue` - Loads selected metadata and owns Details routing, lifecycle, and inert state.
- `src/web/components/FileMetadataPane.vue` - Uses a non-landmark root while preserving its public scroll/focus API.
- `src/web/components/IdentityPanel.vue` - Provides ordered comparison and provenance content without dialog behavior.
- `src/web/components/KeyboardHelp.vue` - Provides focusable content-only keyboard help.
- `src/web/components/IdentityHeader.vue` - Keeps Details trigger semantics without a stale controlled-panel reference.
- `src/web/styles.css` - Gives the shared modal close control a 44px target.
- `scripts/verify-semantic-css.mjs` - Retires obsolete overlay allowances.
- `tests/e2e/pinned-session.spec.ts` - Covers live metadata requests and visible Details metadata.
- `tests/e2e/responsive-session.spec.ts` - Covers Details dialog focus and responsive behavior.
- `tests/integration/anchored-workspace.spec.ts` - Supplies metadata API fixture responses and validates Details interactions.

## Decisions Made

- Used one `detailsOpen` state instead of retaining separate identity and keyboard-help modal states; `ModalDialog` remains the focus and Escape authority.
- Requested metadata on selection rather than on dialog-open so Details cannot display another file's metadata after switching files.
- Used a nested `nextTick` for keyboard-help entry so the inner heading exists before it receives focus.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Enlarged the shared dialog close target**
- **Found during:** Task 3 (mount Details and migrate triggers, styling, and fixtures)
- **Issue:** The close target measured 40px, below the required 44px accessible target.
- **Fix:** Set `min-width` and `min-height` to 44px on the shared modal close control.
- **Files modified:** `src/web/styles.css`
- **Verification:** Scoped responsive Playwright coverage passed.
- **Committed in:** `2e7f631`

**2. [Rule 1 - Bug] Added metadata responses to the anchored-workspace fixture**
- **Found during:** Task 3 (mount Details and migrate triggers, styling, and fixtures)
- **Issue:** Newly live metadata requests received fixture 404s and produced console errors.
- **Fix:** Added the file-metadata endpoint response and route distinction to the existing fixture.
- **Files modified:** `tests/integration/anchored-workspace.spec.ts`
- **Verification:** Anchored-workspace Playwright coverage passed without console errors.
- **Committed in:** `2e7f631`

---

**Total deviations:** 2 auto-fixed (2 bug fixes)
**Impact on plan:** Both fixes were necessary for the required accessible modal contract and fixture-backed live metadata behavior; no scope creep.

## Issues Encountered

- The unrelated `selector-drift-ui.spec.ts` still expects the pre-Phase-11 `Cumpa:` heading and fails before its Details assertion. It was left unmodified and excluded from this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- REV-03 is complete and its Details surface is available to later workspace-shell plans.
- No blockers identified.

---
*Phase: 11-workspace-shell-review-surfaces*
*Completed: 2026-09-14*
