---
phase: 07-github-familiar-review-surfaces
plan: "08"
subsystem: ui
tags: [vue, playwright, export, revision-conflict, gitignore, status]

requires:
  - phase: 07-github-familiar-review-surfaces
    provides: Export presentation composed from existing ReviewExportState and DiffReviewIgnoreStatus authorities
provides:
  - Truthful error badge label for revision-conflict export state
  - Pending-to-unavailable ignore-status presentation from the existing nullable status value
  - Deterministic Chromium evidence for a held ignore-status request and later unavailable result
affects: [08-accessibility-responsive-continuity]

tech-stack:
  added: []
  patterns: [exhaustive state presentation, held asynchronous browser fixture response]

key-files:
  created: []
  modified:
    - src/web/components/ExportSection.vue
    - src/web/components/ExportReadinessSummary.vue
    - tests/integration/export-receipt-ui.spec.ts

key-decisions:
  - "Keep ReviewExportState.phase as the sole export-badge authority; conflict is an explicit error-label branch."
  - "Keep DiffReviewIgnoreStatus | null as the sole readiness authority; null is pending and unavailable requires the concrete discriminant."

patterns-established:
  - "Async browser fixtures hold the existing request response with PromiseWithResolvers so pending UI is observed before a concrete result."

requirements-completed: [REVW-04]

duration: 9min
completed: 2026-07-28
status: complete
---

# Phase 07: GitHub-Familiar Review Surfaces Summary

**Revision conflicts now display a truthful error badge, while export-readiness and Gitignore notices consistently distinguish an in-progress ignore check from a concrete unavailable result.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-07-28T11:34:44Z
- **Completed:** 2026-07-28T11:43:27Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments

- Added the explicit `Review changed` error badge for the existing conflict phase without changing revision-conflict behavior or recovery.
- Made the readiness summary exhaustive for `null`, `ignored`, `notIgnored`, and `unavailable` ignore statuses.
- Held the production Vite fixture's ignore-status request to prove Chromium renders both pending status surfaces before unavailable replaces them.

## Task Commits

Each task was committed atomically:

1. **Task 1: Make conflict and ignore-check status mappings exhaustive and observable** — `42c8105` (fix)

## Files Created/Modified

- `src/web/components/ExportSection.vue` — maps the existing `conflict` phase to the truthful `Review changed` error badge label.
- `src/web/components/ExportReadinessSummary.vue` — maps nullable pending and each concrete ignore-status discriminant to distinct badge presentation.
- `tests/integration/export-receipt-ui.spec.ts` — deterministically pauses the existing ignore-status endpoint and asserts pending, unavailable, and conflict badge states in Chromium.

## Decisions Made

- Kept `ReviewExportState.phase` and `DiffReviewIgnoreStatus | null` as the only authorities; this change is presentation-only and introduces no export, reload, ignore mutation, persistence, API, schema, or filesystem transition.
- Used the existing browser harness and its request-body assertions, adding only a test-local held response so the pending interval cannot be skipped.

## Verification

- `npm run test:browser -- tests/integration/export-receipt-ui.spec.ts --grep "Phase 07 explicit export and status states"` — passed (1 Chromium test).
- `npm run test:browser -- tests/integration/export-receipt-ui.spec.ts --grep "Phase 07 explicit export and status states" --headed` — passed (1 headed Chromium test).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The focused export status gap is closed with Chromium evidence; Phase 08 can evaluate its accessibility and workflow-continuity boundaries without contradictory status language.
- No blocker for 07-09 is introduced; this plan did not execute it.

## Self-Check: PASSED

- Confirmed `07-08-SUMMARY.md` exists.
- Confirmed task commit `42c8105` exists in Git history.
