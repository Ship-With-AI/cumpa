---
phase: 10-diff-reading-surface
plan: "06"
subsystem: testing
tags: [vitest, playwright, monaco, css, accessibility]
requires:
  - phase: 10-diff-reading-surface
    provides: Hunk boundary styling and semantic decoration coverage from plans 03 and 05.
provides:
  - Diagnostic boundary geometry, forced-colors, and hunk-decoration class assertions.
affects: [monaco-diff-semantics, monaco-anchor, responsive-session]
tech-stack:
  added: []
  patterns:
    - Browser geometry checks use rendered boxes rather than computed CSS height.
    - Forced-colors checks compare the resolved system color and preserved border paint.
key-files:
  created:
    - .planning/phases/10-diff-reading-surface/10-06-SUMMARY.md
  modified:
    - tests/unit/monaco-diff-semantics.test.ts
    - tests/integration/monaco-anchor.spec.ts
    - tests/e2e/responsive-session.spec.ts
key-decisions:
  - "Kept product source unchanged; the review findings were assertion-only defects."
requirements-completed: [DIFF-02, DIFF-03]
duration: 5min
completed: 2026-09-13
status: complete
---

# Phase 10 Plan 06: Diff Reading Surface Review Closure Summary

**Diagnostic tests now fail when a hunk boundary changes rendered line geometry, disappears in forced colors, or carries the wrong Monaco decoration class.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-13T17:22:00Z
- **Completed:** 2026-09-13T17:27:05Z
- **Tasks:** 1
- **Files modified:** 3 test files; 1 summary file

## Warning Closure

| Warning | Action | Deliberately broken input and observed failure | Final evidence |
|---|---|---|---|
| WR-01 — equal-height check was non-diagnostic | Replaced computed `height` equality with start/end boundary `boundingBox().height` comparisons against an interior changed line; asserted each expected border side is `1px solid`. | Temporarily changed the start boundary to `box-sizing: content-box`; `11c` failed with `Expected: 26` / `Received: 27` at `monaco-anchor.spec.ts:315`. | `npm run test:browser -- tests/integration/monaco-anchor.spec.ts tests/e2e/responsive-session.spec.ts` passed (16 tests). |
| WR-02 — forced-colors check only asserted RGB serialization | Added `1px` and `solid` assertions for both boundary sides and compared their resolved colors to a same-page `CanvasText` probe. | Temporarily set both hunk borders to `0`; responsive forced-colors coverage failed with `Expected: "1px"` / `Received: "0px"` at `responsive-session.spec.ts:1241`. | Focused browser suite passed; `npm run verify:semantic-css` passed. |
| WR-03 — decoration edge cases omitted class identity | Projected `options.className` when present and asserted `monaco-diff-hunk-start` / `monaco-diff-hunk-end` in every existing edge-case fixture. | Temporarily emitted `monaco-diff-hunk-start-broken`; unit tests failed with expected `monaco-diff-hunk-start` versus received `monaco-diff-hunk-start-broken` at `monaco-diff-semantics.test.ts:47`. | `npx vitest run tests/unit/monaco-diff-semantics.test.ts tests/unit/monaco-diff-adapter.test.ts tests/unit/monaco-theme.test.ts` passed (14 tests). |

## Task Commit

1. **Strengthen review-flagged diff assertions** — `53b5307` (`test`)

## Verification

- `npx vitest run tests/unit/monaco-diff-semantics.test.ts tests/unit/monaco-diff-adapter.test.ts tests/unit/monaco-theme.test.ts` — passed, 14 tests.
- `npm run test:browser -- tests/integration/monaco-anchor.spec.ts tests/e2e/responsive-session.spec.ts` — passed, 16 tests.
- `npm run verify:semantic-css` — passed.
- `npm run typecheck:web` — passed.

## Decisions Made

- Kept `src/web/monaco/diff-semantics.ts` and `src/web/styles.css` unchanged after the temporary diagnostic mutations; no product defect was found.
- Did not update `STATE.md` or `ROADMAP.md`, per assignment constraint.

## Deviations from Plan

None - plan executed exactly as requested.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

All three Phase 10 code-review warnings have diagnostic regression coverage and are closed.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/10-diff-reading-surface/10-06-SUMMARY.md`.
- Task commit `53b5307` exists in repository history.
