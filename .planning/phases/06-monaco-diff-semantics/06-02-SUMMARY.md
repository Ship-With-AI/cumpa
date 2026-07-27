---
phase: 06-monaco-diff-semantics
plan: 02
subsystem: ui
tags: [monaco, diff, decorations, vitest, tdd]
requires:
  - phase: 06-monaco-diff-semantics
    provides: typed diff-review-dark Monaco theme and Phase 05 semantic vocabulary
provides:
  - pure public-ILineChange decoration transformation with continuous side-owned bars and sparse endpoint signs
  - deterministic empty-side rejection, immutable-model clamping, and touching/overlapping range coalescing
  - focused RED/GREEN range-boundary contract coverage
affects: [06-03-monaco-diff-semantics, diff-adapter]
tech-stack:
  added: []
  patterns: [type-only Monaco contracts, public ILineChange range normalization, sparse glyph-margin decorations]
key-files:
  created:
    - src/web/monaco/diff-semantics.ts
    - tests/unit/monaco-diff-semantics.test.ts
  modified: []
key-decisions:
  - "Use only public ILineChange line numbers, fixed DiffSide-derived classes, and structural IRange objects so the builder remains browser-runtime independent."
  - "Reject empty sides before clamping, then merge touching or overlapping populated ranges before emitting endpoint markers."
patterns-established:
  - "Decorate one full block range with linesDecorationsClassName and emit glyphMarginClassName only at the first line or long-block endpoints."
requirements-completed: [DIFF-03, DIFF-04]
duration: 8min
completed: 2026-07-27
status: complete
---

# Phase 06 Plan 02: Monaco-Authoritative Diff Semantics Summary

**Pure Monaco line-change normalization now produces continuous Base/Head change bars and sparse non-interactive gutter-sign decorations without recomputing diffs or altering model text.**

## Performance

- **Duration:** approximately 8 min
- **Started:** approximately 2026-07-27T07:49:00Z
- **Completed:** 2026-07-27T07:57:15Z
- **Tasks:** 1/1
- **Files modified:** 2

## Accomplishments

- Added `buildDiffDecorations`, which consumes only Monaco public `ILineChange` data and closed `DiffSide` identity.
- Returned one whole-block bar per normalized range, one sign for 1–3-line blocks, and endpoint signs for blocks of four or more lines.
- Protected insertion/deletion empty counterparts, out-of-bounds data, deterministic coalescing, and non-layout decoration options with six focused Vitest behaviors.

## Task Commits

Task 1 used the required RED → GREEN → REFACTOR sequence:

1. **RED contract:** `ca0dd78` — `test(06-02): add failing diff semantics contract`
2. **GREEN implementation:** `61d3dc2` — `feat(06-02): implement diff semantics decorations`
3. **Pure-transform refactor:** `5abffb9` — `refactor(06-02): keep diff semantics transform pure`

## Files Created/Modified

- `src/web/monaco/diff-semantics.ts` — Public-ILineChange to fixed-class Monaco decoration builder with pre-clamp empty-side rejection and deterministic range coalescing.
- `tests/unit/monaco-diff-semantics.test.ts` — Observable contract for empty sides, sparse signs, contiguous blocks, merged ranges, bounds, and fixed non-interactive options.

## Verification

- RED observed: `./node_modules/.bin/vitest run tests/unit/monaco-diff-semantics.test.ts` failed before implementation because `src/web/monaco/diff-semantics.ts` did not exist.
- GREEN/refactor verification: `./node_modules/.bin/vitest run tests/unit/monaco-diff-semantics.test.ts` — passed: 1 file, 6 tests.
- Export inspection: `grep -nE '^export ' src/web/monaco/diff-semantics.ts` reported only `buildDiffDecorations`.
- Decoration-option inspection found no injected text, interactive semantics, foreground override, or layout-affecting option.
- TDD gate log contains the required ordered `test(06-02)` RED and `feat(06-02)` GREEN commits, followed by an optional `refactor(06-02)` commit.

## Decisions Made

- Convert Monaco ranges to structural `IRange` values through a type-only import; this preserves the pure transformation contract and avoids a browser-runtime dependency.
- Side identity determines only fixed Base/Head class names; repository content cannot reach a selector, injected-text, or interaction path.
- API, persistence, export, Zod schema, package, and dependency contributions remain none.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed browser-runtime Monaco dependency from the pure transform**
- **Found during:** Task 1 (GREEN verification)
- **Issue:** Creating runtime `monaco.Range` objects caused the Node-focused Vitest environment to access `window`, preventing the pure contract from loading.
- **Fix:** Returned structural `IRange` objects accepted by `IModelDeltaDecoration` and changed the Monaco import to type-only.
- **Files modified:** `src/web/monaco/diff-semantics.ts`, `tests/unit/monaco-diff-semantics.test.ts`
- **Verification:** Focused Vitest contract passed 6/6 after the refactor.
- **Committed in:** `5abffb9`

**Total deviations:** 1 auto-fixed (1 blocking issue).

**Impact on plan:** The correction preserves the planned public Monaco range contract while making the promised transformation genuinely pure. No scope or boundary expansion occurred.

## Issues Encountered

- Context7 CLI was unavailable in the execution environment. The plan's pinned Monaco 0.55.1 research and installed `monaco.d.ts` declarations supplied the public `IRange` and `IModelDeltaDecoration` contract used for the implementation.

## Known Stubs

None. The created source and focused contract scan contain no placeholder or TODO paths.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 03 can pass `getLineChanges()`, `DiffSide`, and each immutable model line count to `buildDiffDecorations` through dedicated adapter decoration collections.
- CSS-visible U+2212/`+` pseudo-content, lifecycle integration, and browser no-reflow/overlap proof remain exclusively in Plan 03.

## Self-Check: PASSED

- Created implementation, focused contract, and summary files exist.
- RED, GREEN, and refactor commits `ca0dd78`, `61d3dc2`, and `5abffb9` exist in the repository history.
