---
phase: 07-github-familiar-review-surfaces
plan: "09"
subsystem: ui
tags: [vue, playwright, accessibility, live-regions, recovery, selector-drift]
requires:
  - phase: 07-github-familiar-review-surfaces
    provides: verified recovery and pinned-selector notice presentation with shared InlineNotice anatomy
provides:
  - recovered-draft receipt with its existing success InlineNotice as the sole polite announcement owner
  - selector-drift copy feedback with its existing parent status notice as the sole polite announcement owner
  - dynamic Chromium assertions that count rendered announcement owners after recovery and copy success
affects: [08-accessibility-responsive-continuity]
tech-stack:
  added: []
  patterns: [single authoritative live-region owner, dynamic browser accessibility assertions]
key-files:
  created: []
  modified:
    - src/web/components/DraftRecovery.vue
    - src/web/components/SelectorDriftNotice.vue
    - tests/integration/draft-recovery-ui.spec.ts
    - tests/e2e/review-panel-resolved.spec.ts
key-decisions:
  - "Keep the success InlineNotice as the recovered result's sole status owner because it already contains the heading, outcome text, and icon anatomy."
  - "Keep the selector-drift parent notice as the copy feedback's sole status owner because it owns the pinned-source context and mutable result text."
patterns-established:
  - "Count live-region owners in the rendered state after the authoritative recovery or clipboard mutation rather than inspecting source text."
requirements-completed: [REVW-04]
duration: not-recorded
completed: 2026-07-28
status: complete
---

# Phase 07 Plan 09: Single Live-Region Ownership Summary

**Recovered-draft and pinned-selector copy feedback now retain one authoritative polite announcement owner each, with real-browser assertions over their completed dynamic states.**

## Performance

- **Duration:** Not independently captured in executor context.
- **Started:** Not independently captured in executor context.
- **Completed:** 2026-07-28.
- **Tasks:** 2/2 completed.
- **Files modified:** 4.

## Accomplishments

- Removed only the redundant outer recovered-card live attribute; the verified success InlineNotice still exposes the visible heading, preserved-before-created outcome, and existing icon treatment.
- Removed only the redundant selector copy-result live attribute; the parent warning status notice still exposes its pinned-source context, copy success, and existing warning anatomy.
- Extended the focused recovery and selector browser cases to count actual rendered `[role="status"]` / `[aria-live="polite"]` owners after the recovery response and clipboard success.

## Task Commits

Each task was committed atomically:

1. **Task 1: Keep one recovered-receipt announcement owner** — `04d332d` (fix)
2. **Task 2: Keep one selector-drift copy-feedback announcement owner** — `52914d1` (fix)

## Files Created/Modified

- `src/web/components/DraftRecovery.vue` — makes the recovered receipt structural while retaining the existing success status notice.
- `tests/integration/draft-recovery-ui.spec.ts` — proves the recovered card has exactly one rendered owner with the exact recovery heading and outcome text.
- `src/web/components/SelectorDriftNotice.vue` — keeps copy result text visible without adding a nested live region.
- `tests/e2e/review-panel-resolved.spec.ts` — stubs clipboard success through the browser, activates the real copy button, and proves the parent status remains the only owner.

## Decisions Made

- Kept the success InlineNotice as the sole recovered-draft status owner because it already contains the complete visible receipt and shared non-color success anatomy.
- Kept the parent selector-drift notice as the sole copy-feedback status owner because it preserves the fixed pinned-source context, warning structure, and existing result mutation.

## Verification

- `npm run test:browser -- tests/integration/draft-recovery-ui.spec.ts --grep "corrupt drafts remain read only until the fingerprint-bound recovery response succeeds"` — passed (1 Chromium test).
- `npm run test:browser -- tests/e2e/review-panel-resolved.spec.ts --grep "Phase 07 notice status language"` — passed (1 Chromium test).

## Deviations from Plan

None - plan executed exactly as written. The first selector test run exposed that a descendant locator excluded the parent status owner; the planned dynamic assertion was corrected to scope the union to the notice element and its descendants before the required verification passed. This was test assertion repair within Task 2, not a production-scope deviation.

## Issues Encountered

- The initial Task 2 assertion selected only descendants of `.selector-drift-notice`, excluding the parent `role="status"`; the selector was corrected to count the notice itself and any nested polite region, then the same focused command passed.

## Known Stubs

None. The modified files were scanned for placeholder text and UI-facing empty values; the matches were existing test fixture request arrays and nullable request metadata, not UI stubs.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 07's duplicate announcement findings G-03a / WR-04 and G-03b / WR-05 are closed without changing recovery, clipboard, pinned-selector, API, persistence, schema, or filesystem authority.
- Phase 08 remains responsible for milestone-wide responsive, forced-colors, grayscale, and full workflow proof.

## Self-Check: PASSED

---
*Phase: 07-github-familiar-review-surfaces*
*Completed: 2026-07-28*
