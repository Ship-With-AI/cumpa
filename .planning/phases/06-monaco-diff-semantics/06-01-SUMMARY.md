---
phase: 06-monaco-diff-semantics
plan: 01
subsystem: ui
tags: [monaco, theme, css, vitest, semantic-tokens]
requires:
  - phase: 05-semantic-dark-foundation
    provides: one canonical semantic dark CSS vocabulary and generated-CSS audit
provides:
  - typed, stable `diff-review-dark` Monaco theme data and idempotent registration helper
  - exact root/theme syntax-role parity contract and deterministic generated-CSS audit coverage
affects: [06-02-monaco-diff-semantics, 06-03-monaco-diff-semantics]
tech-stack:
  added: []
  patterns: [typed Monaco theme contract, defineTheme-then-setTheme idempotence, CSS/theme byte parity]
key-files:
  created:
    - src/web/monaco/theme.ts
    - tests/unit/monaco-theme.test.ts
  modified:
    - src/web/styles.css
    - scripts/verify-semantic-css.mjs
key-decisions:
  - "Use one stable diff-review-dark IStandaloneThemeData contract with explicit local literals and no runtime CSS-token extraction."
  - "Extend the Phase 05 root only with the five approved accessible syntax foreground roles, audited in source and emitted CSS."
patterns-established:
  - "Theme tests mock Monaco's public editor API and assert defineTheme before setTheme on every application."
  - "Typed theme literals remain byte-parity checked against canonical semantic CSS roles."
requirements-completed: [DIFF-01, DIFF-02, DIFF-05]
duration: 8min
completed: 2026-07-27
status: complete
---

# Phase 06 Plan 01: Typed Monaco Theme Contract Summary

**A complete, typed `diff-review-dark` Monaco theme now maps Phase 05 semantic roles into canvas, syntax, diff, selection, widget, and scrollbar colors with deterministic source/generated CSS parity enforcement.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-27T07:34:11Z
- **Completed:** 2026-07-27T07:42:02Z
- **Tasks:** 2/2
- **Files modified:** 4

## Accomplishments

- Added the five approved syntax foreground roles to the only CSS semantic root and extended the existing source/generated audit allowlist with their exact values.
- Added a typed `IStandaloneThemeData` object covering the exact Phase 06 Monaco color and syntax-token mappings.
- Proved the stable theme ID, full mapping, parity values, and repeatable `defineTheme` then `setTheme` call order through a focused Vitest contract.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend the sole semantic root and its generated-CSS audit** - `ecca041` (feat)
2. **Task 2 RED: Add failing Monaco theme contract** - `742436c` (test)
3. **Task 2 GREEN: Define semantic Monaco theme** - `46fa622` (feat)

## Files Created/Modified

- `src/web/styles.css` - Canonical five-role syntax foreground extension.
- `scripts/verify-semantic-css.mjs` - Exact source/generated CSS allowlist and value checks for syntax roles.
- `src/web/monaco/theme.ts` - Typed semantic Monaco theme plus idempotent public registration/selection helper.
- `tests/unit/monaco-theme.test.ts` - Exact color, token scope, parity, and call-order contract.

## Verification

- `./node_modules/.bin/vitest run tests/unit/monaco-theme.test.ts` — passed: 2 tests.
- `npm run build:web && node scripts/verify-semantic-css.mjs` — passed; emitted CSS retained the canonical root contract and author-style invariants.
- `git diff --name-only ecca041^..HEAD` — contained only the four plan-declared source/test files.
- RED gate observed: the focused test failed before implementation because `src/web/monaco/theme.ts` did not exist.

## Decisions Made

- Use `diff-review-dark` as the only theme identifier and call public `defineTheme` before `setTheme` on every invocation, making repeated adapter construction safe without generated IDs or fallback themes.
- Keep typed Monaco literals strictly mapped to the Phase 05 root contract; no runtime CSS-token extraction, remote asset, package, API, schema, or runtime-behavior contribution was introduced.
- **Inherited-role assumption delta:** None. Existing Phase 05 semantic roles remain byte-identical; only the five explicitly approved syntax roles extend the sole root.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None. The pre-existing `::placeholder` CSS selector is a browser pseudo-element rule, not a product stub.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 1 adapter work can import the stable typed theme and select it immediately before `createDiffEditor` construction.
- The CSS audit and Vitest contract now prevent semantic syntax, selection, diff-layer, and theme-registration drift.

## Self-Check: PASSED

---
*Phase: 06-monaco-diff-semantics*
*Completed: 2026-07-27*
