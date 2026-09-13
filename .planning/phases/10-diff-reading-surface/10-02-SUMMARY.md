---
phase: 10-diff-reading-surface
plan: "02"
subsystem: ui
tags: [monaco, diff-editor, aria, accessibility, responsive-typography, vitest, playwright]
requires:
  - phase: 10-diff-reading-surface
    provides: Immutable Monaco construction options and 17-listener adapter baseline
provides:
  - Source-correct Monaco accessible labels for range and exact-patch diffs
  - Token-derived wide, default, and compact Monaco code densities
  - Diff-local responsive listener lifecycle owned by DiffWorkspace
  - Explicit browser proof at 1650x900 and 720x900 viewports
affects: [10-03, 10-04, monaco-diff-adapter, DiffWorkspace]
tech-stack:
  added: []
  patterns:
    - Reapply child-editor accessibility options after Monaco replaces models.
    - Keep responsive Monaco options driven by component-owned media queries, not CSS or adapter listeners.
key-files:
  created:
    - .planning/phases/10-diff-reading-surface/10-02-SUMMARY.md
  modified:
    - src/web/monaco/diff-adapter.ts
    - src/web/components/DiffWorkspace.vue
    - tests/unit/monaco-diff-adapter.test.ts
    - tests/integration/selector-drift-ui.spec.ts
    - tests/e2e/responsive-session.spec.ts
key-decisions:
  - "Use Monaco child-editor updateOptions fallback because diff-editor ariaLabel did not publish a rendered accessible name."
  - "Use 1650px and 760px diff-local media breakpoints, distinct from Phase 11 shell breakpoints."
  - "Derive wide and compact code size from canonical body and metadata tokens; retain canonical code token pair for default."
patterns-established:
  - "DiffWorkspace owns balanced media-query listeners and resolves wide before compact before default."
requirements-completed: [DIFF-01, DIFF-02, DIFF-03]
duration: 17min
completed: 2026-09-13
status: complete
---

# Phase 10 Plan 02: Source-Correct Monaco Labels and Responsive Typography Summary

**Monaco now names immutable exact-patch and range panes by their actual sources, while token-derived public options render code at 14/28 wide, 13/26 default, and 12/24 compact density.**

## Performance

- **Completed:** 2026-09-13T16:05:07Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added `setSideNames` using `visibleSides` as the sole source-kind authority. The published strings are `Immutable preimage and postimage side-by-side diff` for exact patches and `Immutable base and head side-by-side diff` for range sessions; both remain distinct from the enclosing section name.
- Verified that diff-editor-level `updateOptions({ ariaLabel })` did not change Monaco's rendered accessible name. The implemented public-API fallback applies the same label to each child editor after model installation; the exact-patch browser test reads it through the `.monaco-diff-editor` root without DOM attribute mutation.
- Added `setCodeDensity` with `wide` `14px/28px` from `--font-size-body`, `default` `13px/26px` from `--font-size-code` and `--line-height-code`, and `compact` `12px/24px` from `--font-size-metadata`.
- Added two balanced component-owned media listeners: `(min-width: 1650px)` and `(max-width: 760px)`. These diff-local breakpoints are distinct from Phase 11 shell breakpoints; wide wins over compact, then default.
- Preserved the adapter listener inventory at `17`, confirmed by the unchanged anchoring browser spec.

## Verification

| Command | Result |
| --- | --- |
| `npx vitest run tests/unit/monaco-diff-adapter.test.ts` | Passed — 1 file, 5 tests. |
| `npm run typecheck:web` | Passed. |
| `npm run test:browser -- tests/integration/selector-drift-ui.spec.ts tests/e2e/responsive-session.spec.ts tests/integration/monaco-anchor.spec.ts` | Passed — 20 Chromium tests, including exact-patch accessible name and explicit 1650x900/720x900 typography assertions. |
| `npm run verify:semantic-css` | Passed after fresh web build. |

## Task Commits

Each TDD task retained separate RED and GREEN commits.

1. **Task 1: Source-correct Monaco accessible names**
   - `1563c81` — `test(10-02): add failing source-correct aria label test`
   - `e00b75b` — `feat(10-02): name Monaco diff sides by source`
2. **Task 2: Responsive Monaco code densities**
   - `2c34696` — `test(10-02): add failing responsive Monaco density tests`
   - `173ed2a` — `feat(10-02): adapt Monaco code density to viewport`

## Files Created/Modified

- `src/web/monaco/diff-adapter.ts` — Exposes source naming and token-derived density updates through Monaco public options.
- `src/web/components/DiffWorkspace.vue` — Synchronizes source names around model changes and owns balanced diff-local media listeners.
- `tests/unit/monaco-diff-adapter.test.ts` — Covers source-name and three-density public option payloads.
- `tests/integration/selector-drift-ui.spec.ts` — Proves the rendered exact-patch Monaco accessible name without colliding with the section name.
- `tests/e2e/responsive-session.spec.ts` — Proves 14px/28px at 1650x900 and 12px/24px at 720x900, then restores 1440x560.

## Decisions Made

- Monaco's diff-editor `ariaLabel` option alone did not publish an accessible rendered name in this installed version. Per-editor `updateOptions({ ariaLabel })` is the required documented public-surface fallback.
- The side label is reapplied after `setFile()` because replacing Monaco models resets the child editor options.
- No CSS targets Monaco rendered code; `updateOptions({ fontSize, lineHeight })` remains the sole typography authority.

## Deviations from Plan

None - the plan explicitly prescribed the per-editor fallback when diff-editor-level aria forwarding did not render an accessible name.

## Issues Encountered

- Initial exact-patch browser assertion showed an empty accessible name after diff-editor-level `updateOptions`. Applying the plan's child-editor fallback after model installation produced the required rendered name; the browser test passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 10-03 and 10-04 can retain the 17-listener adapter invariant while relying on source-correct Monaco labels and component-owned responsive code density.
- `STATE.md` and `ROADMAP.md` remain intentionally unmodified; pre-existing untracked user files were preserved.

---
*Phase: 10-diff-reading-surface*
*Completed: 2026-09-13*
