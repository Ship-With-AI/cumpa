---
phase: 10-diff-reading-surface
plan: "05"
subsystem: ui
tags: [monaco, diff-editor, responsive, forced-colors, playwright, semantic-css]
requires:
  - phase: 10-diff-reading-surface
    provides: Monaco-authoritative options, responsive density, native hidden-region paint, and structural hunk boundaries
provides:
  - Unclipped 37px Base/Head label track from the approved 9px 18px exception
  - Forced-colors browser proof for Monaco hunk start and end boundaries
  - Final phase verification record with all in-scope unit, Git, API, build, semantic-CSS, and browser gates green
affects: [phase-10-verification, diff-reading-surface, monaco-diff-adapter]
tech-stack:
  added: []
  patterns:
    - Keep label span geometry and its containing grid track in the same change; account for the label row border in the track.
    - Assert forced-colors cues as resolved system colours, never canonical RGB tokens.
key-files:
  created:
    - .planning/phases/10-diff-reading-surface/10-05-SUMMARY.md
  modified:
    - src/web/styles.css
    - tests/e2e/responsive-session.spec.ts
key-decisions:
  - "Use the UI-SPEC bounded 9px 18px label-padding exception directly; it is not a reusable token."
  - "Set the canvas row to 37px: the 36px label span plus the side-label row's 1px border-bottom."
patterns-established:
  - "For geometry inside a fixed grid row, browser coverage must assert both child and parent rendered heights."
  - "Forced-colors assertions check browser-resolved border colours for hunk cues."
requirements-completed: [DIFF-02, DIFF-03]
duration: 20m
completed: 2026-09-13
status: complete
---

# Phase 10 Plan 05: Side-Label Geometry and Phase-Wide Green Summary

**Base/Head labels now use the approved 9px 18px padding in an unclipped 37px canvas track, while all diff cues—including hunk boundaries—have in-scope forced-colors proof.**

## Performance

- **Duration:** 20m
- **Started:** 2026-09-13T16:40:58Z
- **Completed:** 2026-09-13T17:01:18Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added browser geometry assertions for `9px 18px` span padding, 36px label-span height, and 37px label-row height. The first assertion failed against the prior `8px 16px` padding, then passed after the paired CSS change.
- Changed only the side-label geometry: `grid-template-rows` is `37px minmax(0, 1fr)` and label padding is `9px 18px`. The arithmetic is `9 + 18 + 9 = 36px` for the span, plus the row's 1px `border-bottom`.
- Extended the existing forced-colors browser step with resolved `border-top-color` and `border-bottom-color` checks for `monaco-diff-hunk-start` and `monaco-diff-hunk-end` before media restoration.

## Task Commits

Each task was committed atomically:

1. **Task 1: Apply the bounded label padding with the canvas track resized in the same edit**
   - `769a750` — `test(10-05): add failing label geometry assertion` (RED)
   - `ab521b2` — `feat(10-05): size side label track` (GREEN)
2. **Task 2: Extend forced-colors coverage to the group boundaries and record the phase green**
   - `39bf481` — `test(10-05): cover forced color hunk boundaries`

## Files Created/Modified

- `src/web/styles.css` — Keeps the 640px canvas minimum and localized overflow ownership while raising the label track to 37px and applying the authorized literal padding exception.
- `tests/e2e/responsive-session.spec.ts` — Observes child and parent label geometry and validates resolved forced-colors boundary borders.
- `.planning/phases/10-diff-reading-surface/10-05-SUMMARY.md` — Records final phase evidence.

## Decisions Made

- Kept the padding as the explicit UI-SPEC exception rather than creating a `--space-*` token.
- Counted the label row's structural one-pixel border in the grid track. A 36px track would still clip the row by one pixel.
- Did not modify `tests/integration/anchored-workspace.spec.ts` or `src/web/components/DiffWorkspace.vue`; the unchanged integration selectors and overflow canary prove the existing markup and local-scroll ownership remain valid.

## Phase Success-Criteria Evidence

1. **Monaco remains the sole diff authority.** `npx vitest run tests/unit/monaco-theme.test.ts tests/unit/monaco-diff-adapter.test.ts tests/unit/monaco-diff-semantics.test.ts tests/unit/line-mapping.test.ts` passed 18/18. The final in-scope browser suite passed `tests/integration/monaco-anchor.spec.ts`, including real Monaco rendering and paired-zone alignment. This plan changed only CSS and browser assertions—no diff computation, mapper, or syntax renderer was introduced.
2. **Quiet, non-colour diff meaning persists.** `tests/e2e/responsive-session.spec.ts` passed with the forced-colors step asserting Base/Head labels, removed/added text, dashed/solid rails, minus/plus glyphs, and resolved borders for both hunk-boundary classes.
3. **Expandable context, side-by-side geometry, paired zones, and local 640px overflow remain intact.** `tests/integration/anchored-workspace.spec.ts` passed 13/13, including the empty `outerOverflowOwners` canary, 640px canvas minimum, unchanged positional label selectors, 32px gutter affordance, and 320px Base/Head label reachability. `tests/integration/monaco-anchor.spec.ts` passed its paired-zone geometry coverage.
4. **Desktop, full-desktop, and mobile stay readable without document horizontal overflow.** The final full in-scope browser invocation passed 94/94, including `responsive-session.spec.ts` and the anchored-workspace viewport matrix. The label test directly measured 36px spans and a 37px row, and the integration canary found no external overflow owner.

## Verification

| Command | Result |
| --- | --- |
| `npm run verify:semantic-css` | Passed after fresh web build. |
| `npm run typecheck:web` | Passed. |
| `npx vitest run tests/unit/monaco-theme.test.ts tests/unit/monaco-diff-adapter.test.ts tests/unit/monaco-diff-semantics.test.ts tests/unit/line-mapping.test.ts` | Passed — 4 files, 18 tests. |
| `npm run test:browser -- tests/e2e/responsive-session.spec.ts tests/e2e/anchored-review.spec.ts tests/e2e/complete-review-draft.spec.ts tests/integration/monaco-anchor.spec.ts tests/integration/anchored-workspace.spec.ts tests/integration/selector-drift-ui.spec.ts` | Passed — 45 Chromium tests. |
| `npm run build` | Passed — runtime and web production artifacts built. |
| `npm run test:unit` | Passed in isolation — 29 files, 186 tests. |
| `npm run test:git` | Passed — 9 files, 69 tests. |
| `npm run test:api` | Passed — 19 files, 142 tests. |
| Full in-scope browser suite, naming all browser specs except `marketplace-review.spec.ts` and `public-support-states.spec.ts` | Passed — 94 Chromium tests. |

The two excluded browser specs are documented pre-existing environment-marker cases and were not run: `tests/e2e/marketplace-review.spec.ts` requires `CUMPA_MARKETPLACE_URL_MARKER`; `tests/e2e/public-support-states.spec.ts` requires `CUMPA_RUNTIME_CUSTODY_DIR`.

## Deviations from Plan

None - plan implementation executed exactly as written.

## Issues Encountered

- The first full `npm run test:unit` was launched concurrently with Git and API suites; its Vite virtual-token watcher test exceeded its 10-second timeout. Its isolated single-test reproduction passed in 130ms, and the complete unit suite then passed in isolation (186/186). No source change was warranted.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 10 is fully green in scope. All five phase summaries together close DIFF-01, DIFF-02, and DIFF-03.
- `STATE.md` and `ROADMAP.md` were intentionally left unchanged. Pre-existing untracked user files were preserved.

---
*Phase: 10-diff-reading-surface*
*Completed: 2026-09-13*

## Self-Check: PASSED

- Task commits `769a750`, `ab521b2`, and `39bf481` exist.
- The summary contains evidence for all four ROADMAP Phase 10 success criteria.
- Final in-scope verification is green: build, semantic CSS, web typecheck, focused phase unit tests, unit, Git, API, and 94-test browser suite.
- `STATE.md` and `ROADMAP.md` are unmodified.
