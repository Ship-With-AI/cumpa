---
phase: 07-github-familiar-review-surfaces
plan: "07"
subsystem: ui
tags: [vue, monaco, playwright, inline-comments, geometry]

requires:
  - phase: 06-monaco-diff-semantics
    provides: paired Monaco anchor zones, source-line rail, and geometry invariants
  - phase: 07-github-familiar-review-surfaces
    provides: accepted-comment conversation cards and focused browser regression coverage
provides:
  - post-render paired-zone resizing for accepted inline comments
  - real-Chromium proof that long accepted cards are contained and leave following code unobscured
affects: [07-08, 07-09, 08-accessibility-responsive-continuity]

tech-stack:
  added: []
  patterns: [shared measured-anchor-zone resize helper, real-Monaco long-card containment assertion]

key-files:
  created: []
  modified:
    - src/web/components/DiffWorkspace.vue
    - tests/integration/anchored-workspace.spec.ts

key-decisions:
  - "Route accepted and composer card height through one file-local helper using Math.max(280, contentHeight + 16) and the existing adapter."
  - "Keep long-card evidence on the canonical mutation path and inspect real Monaco rectangles rather than synthesizing client DOM."

patterns-established:
  - "Both accepted and composer annotation branches resize the existing paired zone only after Vue has rendered their content."
  - "Long accepted-card browser coverage asserts zone alignment, equal height, card containment, and following-code separation together."

requirements-completed: [VIS-04, REVW-01, REVW-02, REVW-03]
duration: not recorded
completed: 2026-07-28
status: complete
---

# Phase 07 Plan 07: Accepted Inline Card Containment Summary

**Accepted inline comments now resize the existing paired Monaco zone from rendered content height, with Chromium evidence that a long persisted card stays contained and does not overlap subsequent code.**

## Performance

- **Duration:** Not recorded by the executor.
- **Completed:** 2026-07-28
- **Tasks:** 1/1
- **Files modified:** 2

## Accomplishments

- Centralized the existing post-render zone formula in `resizeAnchorZoneToContent()` and invoked it for both accepted and composer annotation branches.
- Preserved the existing adapter, one composer zone, one counterpart spacer, model, line-map, focus handoff, source-line rail, and persistence authority.
- Extended the canonical production mutation scenario with a rendered long accepted comment and real Monaco containment, equal-height, and following-code geometry assertions.

## Task Commits

Each task was committed atomically:

1. **Task 1: Resize accepted cards through the existing paired-zone contract** — `6986c62` (fix)

## Files Created/Modified

- `src/web/components/DiffWorkspace.vue` — shares the bounded post-render paired-zone resize calculation between accepted and composer annotations.
- `tests/integration/anchored-workspace.spec.ts` — persists a long accepted comment and proves card containment, equal paired-zone height, and no overlap with following code in Chromium.

## Decisions Made

- Kept the height calculation exactly `Math.max(280, contentHeight + 16)` and invoked only the existing `setAnchorZoneHeight` adapter method.
- Located the following rendered Head-code line after the zone boundary so the test proves visible separation, not only zone equality.

## Verification

- `npm run test:browser -- tests/integration/anchored-workspace.spec.ts --grep "Phase 07 header and control states|Phase 07 inline conversation states|Phase 07 rail selection follows focus-comment"` — passed: 3 tests.
- `npm run test:browser -- tests/integration/anchored-workspace.spec.ts --grep "Phase 07 inline conversation states" --headed` — passed: 1 test at the scenario's 1280×760 viewport.
- The long accepted card's `scrollHeight` exceeded 280px; composer and spacer zones aligned within 1px and had equal heights; the card stayed within its composer zone; and the next rendered Head code line began at or below both the zone and card boundaries.
- No Monaco adapter, API, persistence, schema, package, or Phase 08 path changed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Regression] Restored the resolved-comment fixture declaration after an intermediate test edit removed it.**
- **Found during:** Task 1 focused browser verification
- **Issue:** The existing resolved fixture referenced an unavailable `resolvedText` value.
- **Fix:** Restored its original local declaration while retaining the planned long accepted-comment fixture.
- **Files modified:** `tests/integration/anchored-workspace.spec.ts`
- **Verification:** Both focused headless and headed Chromium commands passed.
- **Committed in:** `6986c62`

**2. [Rule 3 - Blocking] Reconciled the stale Phase 07 plan position before standard tracking updates.**
- **Found during:** Plan close-out
- **Issue:** `STATE.md` still identified Plan 1 even though summaries for 07-01 through 07-06 were present; one standard advance would have misreported this completed plan as Plan 2.
- **Fix:** Advanced the standard plan counter to Plan 8, then recalculated progress and updated the roadmap from the seven summaries on disk.
- **Files modified:** `.planning/STATE.md`, `.planning/ROADMAP.md`
- **Verification:** GSD reported 11/13 plans complete and Phase 07 at 7/9 summaries.
- **Committed in:** Plan metadata commit


---

**Total deviations:** 2 auto-fixed (1 Rule 1 regression correction, 1 Rule 3 tracking reconciliation).
**Impact on plan:** Restored pre-existing fixture and tracking state only; no product contract, adapter authority, persistence, API, schema, dependency, or scope changed.

## Issues Encountered

None after the fixture correction.

## Known Stubs

None. The stub-pattern scan found only existing test harness initialization and null checks, not shipped placeholders.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The accepted-card/paired-zone seam now has real-browser long-content regression coverage for later review-surface work.
- Phase 08 remains responsible for milestone-wide narrow-layout, 400% zoom, grayscale, forced-colors, and end-to-end continuity proof.

## Self-Check: PASSED

- Summary exists at `.planning/phases/07-github-familiar-review-surfaces/07-07-SUMMARY.md`.
- Task commit `6986c62` completed successfully with the two declared task files.
