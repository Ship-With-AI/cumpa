---
phase: 10-diff-reading-surface
plan: "04"
subsystem: ui
tags: [monaco, diff-editor, decorations, semantic-css, playwright, forced-colors]
requires:
  - phase: 10-diff-reading-surface
    provides: Monaco-authoritative diff decorations and hidden-region paint authority
provides:
  - Start and end whole-line decorations for every Monaco-derived merged changed range
  - Border-box hunk hairlines with forced-colors repair and zero-height browser proof
  - Exhaustive decoration assertions that retain range merging, clamping, and side ownership coverage
affects: [10-05, monaco-diff-adapter, monaco-diff-semantics, semantic-css]
tech-stack:
  added: []
  patterns:
    - Append structural model decorations inside the existing Monaco-derived merged-range loop.
    - Paint Monaco whole-line hunk boundaries with border-box borders, then repair their system colour inside the terminal forced-colors block.
key-files:
  created:
    - .planning/phases/10-diff-reading-surface/10-04-SUMMARY.md
  modified:
    - src/web/monaco/diff-semantics.ts
    - tests/unit/monaco-diff-semantics.test.ts
    - src/web/styles.css
    - tests/integration/monaco-anchor.spec.ts
key-decisions:
  - "Use side-independent structural start/end classes; existing rails, signs, and labels retain side identity."
  - "Use one-pixel border-box borders rather than gradients or inset shadows, preserving line metrics without widening the semantic-CSS allowlist."
patterns-established:
  - "Boundary decorations must derive solely from Monaco line changes after the existing clamping and merging path."
requirements-completed: [DIFF-01, DIFF-02]
duration: 8m 17s
completed: 2026-09-13
status: complete
---

# Phase 10 Plan 04: Hunk-Group Boundary Decorations Summary

**Merged Monaco changed ranges now have structural first/last-line hairlines that preserve code-line height and paired comment-zone alignment.**

## Performance

- **Duration:** 8m 17s
- **Started:** 2026-09-13T16:28:59Z
- **Completed:** 2026-09-13T16:37:16Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Appended one start and one end `className` whole-line decoration per already merged Monaco range, including one-line groups.
- Extended all seven exhaustive decoration arrays and raised both short-range length assertions while retaining existing merge, clamp, empty, and side-ownership coverage.
- Added canonical one-pixel border-box boundaries, terminal forced-colors repair, and Chromium evidence that a boundary line equals an interior changed-line height while paired comment zones remain aligned.

## Task Commits

Each task was committed atomically:

1. **Task 1: Emit start and end boundary decorations from the existing range loop**
   - `de2a765` — `test(10-04): add failing hunk boundary assertions`
   - `ad017b1` — `feat(10-04): emit hunk boundary decorations`
2. **Task 2: Paint the boundaries as zero-height hairlines and repair them for forced colors**
   - `b434ac3` — `feat(10-04): paint hunk group boundaries`

## Files Created/Modified

- `src/web/monaco/diff-semantics.ts` - Appends structural first/last-line decorations in the existing clamped, merged Monaco range loop.
- `tests/unit/monaco-diff-semantics.test.ts` - Exhaustively observes the two new whole-line decorations across all seven arrays.
- `src/web/styles.css` - Paints canonical border-box hairlines and repairs their borders with `CanvasText` in forced-colors mode.
- `tests/integration/monaco-anchor.spec.ts` - Proves boundary paint, canonical colour, unchanged computed line height, and paired-zone geometry in Chromium.
- `.planning/phases/10-diff-reading-surface/10-04-SUMMARY.md` - Records execution evidence.

## Decisions Made

- Retained Monaco as the only diff authority: boundary ranges reuse the existing clamped and merged `ILineChange[]` projection.
- Used two side-independent classes because side identity already has rails, signs, line lanes, and pane labels.
- Used border-box one-pixel borders; gradients are rejected by the semantic-CSS gate and inset shadows would require allowlist expansion.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The documented ROADMAP expectation that this decoration suite remain unchanged is incompatible with its exhaustive decoration projection. The plan correctly required seven arrays (not the roadmap correction's five) to gain boundary entries; no ROADMAP edit was made per assignment.
- RED evidence: the expanded unit suite failed 5 assertions before implementation. The new browser assertion failed with `border-top-width` `0px` before CSS; after the border-box rules it passed.

## User Setup Required

None - no external service configuration required.

## Verification

| Command | Result |
| --- | --- |
| `npx vitest run tests/unit/monaco-diff-semantics.test.ts tests/unit/line-mapping.test.ts` | Passed — 2 files, 10 tests. |
| `npm run typecheck:web` | Passed. |
| `npm run verify:semantic-css` | Passed after production web build; no gradient, allowlist, or direct-colour violation. |
| `npm run test:browser -- tests/integration/monaco-anchor.spec.ts` | Passed — 15 Chromium tests, including equal boundary/interior computed line heights and paired-zone alignment. |

## Next Phase Readiness

- Plan 10-05 can rely on Monaco-derived structural hunk boundaries without changed line metrics or new diff authority.
- `STATE.md` and `ROADMAP.md` remain unmodified; pre-existing untracked user files remain preserved.

## Self-Check: PASSED

- Task commits `de2a765`, `ad017b1`, and `b434ac3` are present in Git history.
- Summary exists at `.planning/phases/10-diff-reading-surface/10-04-SUMMARY.md`.
- Final focused unit, typecheck, semantic-CSS, and Chromium browser verification passed.
- `STATE.md` and `ROADMAP.md` have no tracked working-tree modifications.
