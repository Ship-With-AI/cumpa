---
phase: 10-diff-reading-surface
plan: "01"
subsystem: ui
status: complete
tags: [monaco, diff-editor, vitest, playwright, semantic-css]
requires:
  - phase: 08-semantic-visual-foundation
    provides: canonical CSS token root and Monaco theme parity gate
provides:
  - Immutable Monaco diff construction options for side-by-side review
  - Canonical hidden-region link hover foreground mapping
  - Chromium proof of absent edit affordances with both panes visible
affects: [10-02, 10-03, 10-04]
tech-stack:
  added: []
  patterns:
    - Express Monaco presentation only through its typed option and theme APIs.
    - Mirror every painted Monaco theme key in the exhaustive canonical-token map.
key-files:
  created:
    - .planning/phases/10-diff-reading-surface/10-01-SUMMARY.md
  modified:
    - src/web/monaco/diff-adapter.ts
    - src/web/monaco/theme.ts
    - tests/unit/monaco-diff-adapter.test.ts
    - tests/unit/monaco-theme.test.ts
    - tests/integration/monaco-anchor.spec.ts
key-decisions:
  - "Disable Monaco's inline fallback, gutter menu, and revert icon in the construction literal rather than fighting rendered DOM."
  - "Supply editorLink.activeForeground from --diff-hunk-foreground so Monaco owns hidden-region hover paint."
patterns-established:
  - "Construction options that define immutable review behavior are unit-pinned and browser-proven when Monaco exposes a DOM effect."
requirements-completed: [DIFF-01, DIFF-02, DIFF-03]
duration: 6m 15s
completed: 2026-09-13
---

# Phase 10 Plan 01: Monaco Public Option Surface and Theme Paint Authority Summary

**Monaco now explicitly renders Cumpa's immutable, side-by-side reading surface and keeps hidden-region hover controls on the canonical hunk-foreground channel.**

## Performance

- **Duration:** 6m 15s (first task commit through final validation capture)
- **Started:** 2026-09-13T15:38:20Z
- **Completed:** 2026-09-13T15:44:35Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Added all five UI-SPEC options to the sole `createDiffEditor` construction literal at `src/web/monaco/diff-adapter.ts:107-127`: `diffAlgorithm: 'advanced'`, `diffWordWrap: 'off'`, `useInlineViewWhenSpaceIsLimited: false`, `renderGutterMenu: false`, and `renderMarginRevertIcon: false`; the existing `renderSideBySide: true`, zero inline breakpoint, and `readOnly: true` remain pinned.
- Added `editorLink.activeForeground` mapped through `color('--diff-hunk-foreground')` and its exhaustive `THEME_COLOR_ROOT_MAP` companion entry, preserving byte-identical canonical-root theme values.
- Added real-Chromium coverage that observed zero gutter-menu lanes and zero revert arrows while Base and Head pane locators each remained present and visible.

## TDD Evidence

- **Task 1 RED:** `pins the immutable side-by-side review surface options` failed because `createDiffEditor` lacked the asserted `diffAlgorithm`, `diffWordWrap`, gutter/revert, and inline-view keys. The GREEN run passed all 3 adapter construction tests.
- **Task 2 RED:** canonical theme-key equality failed with `editorLink.activeForeground` expected by the mirror map but absent from `CUMPA_THEME.colors`. The GREEN run passed all 3 theme tests.

## Verification

| Command | Result |
| --- | --- |
| `npx vitest run tests/unit/monaco-diff-adapter.test.ts tests/unit/monaco-theme.test.ts` | Passed — 2 files, 6 tests. |
| `npx vitest run tests/unit/line-mapping.test.ts tests/unit/monaco-diff-semantics.test.ts` | Passed — 2 files, 10 tests. |
| `npm run typecheck:web` | Passed. |
| `npm run verify:semantic-css` | Passed after a fresh web build. |
| `npm run test:browser -- tests/integration/monaco-anchor.spec.ts` | Passed — 13 Chromium tests; gutter and revert locators each measured zero, both pane locators measured one and were visible. |

The unchanged listener inventory remains `17`, observed in the existing anchor spec assertions; Plan 10-02 must preserve it when adding host media listeners.

## Task Commits

Each task was committed atomically; TDD tasks retain their separate RED and GREEN commits.

1. **Task 1: Pass the five mandated diff options through the construction literal**
   - `c6cb768` — `test(10-01): add failing diff option assertion`
   - `015c002` — `feat(10-01): pin immutable diff editor options`
2. **Task 2: Supply the hidden-region link hover colour Monaco reads with !important**
   - `9382a86` — `test(10-01): add failing theme hover mapping`
   - `5b1161f` — `feat(10-01): theme hidden-region link hover`
3. **Task 3: Prove in a real browser that the gutter-menu lane is gone and both panes still render**
   - `0b9cec0` — `test(10-01): prove immutable Monaco surface`

## Files Created/Modified

- `src/web/monaco/diff-adapter.ts` — sole typed construction literal carries the five immutable-reading options.
- `src/web/monaco/theme.ts` — maps Monaco active link foreground to the canonical hidden-region foreground.
- `tests/unit/monaco-diff-adapter.test.ts` — pins all five options with the side-by-side continuity values.
- `tests/unit/monaco-theme.test.ts` — mirrors the new painted theme key to the canonical root token.
- `tests/integration/monaco-anchor.spec.ts` — proves gutter/revert absence and two visible panes in real Monaco.

## Decisions Made

- Keep Monaco as the sole diff authority: use typed construction options and theme variables instead of CSS overrides or a custom renderer.
- Treat the revert-arrow assertion as a `readOnly` regression canary; the construction unit assertion is the proof that `renderMarginRevertIcon: false` is passed.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 10-02 through 10-04 can rely on the explicit immutable Monaco option baseline and green semantic CSS gate.
- No blocker. The pre-existing untracked `.gsd/`, `10-PATTERNS.md`, `EVIDENCE.md`, and `.omp-profile-*.test.ts` files were preserved.

## Self-Check: PASSED

- Summary exists and all five commits for this execution appear in Git history.
- `STATE.md` and `ROADMAP.md` remain unmodified.
