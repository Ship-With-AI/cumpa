---
phase: 06-monaco-diff-semantics
plan: "03"
subsystem: ui
tags: [monaco, diff-editor, decorations, selection, playwright, chromium]
requires:
  - phase: 06-monaco-diff-semantics
    provides: typed diff-review-dark theme and pure public-ILineChange decoration builder
provides:
  - theme selection before every Monaco diff-editor construction
  - bounded independent diff, selection, and anchor decoration lifecycles
  - fixed non-geometric CSS channels for signed changes, selection, anchors, focus, empty regions, and hidden hunks
  - focused real-Chromium fixture and production-workspace semantic regression coverage
affects: [07-review-surfaces, 08-accessibility-responsive-continuity]
tech-stack:
  added: []
  patterns: [theme-before-editor, concern-owned Monaco decoration collections, source-over-safe semantic CSS hooks, focused Chromium geometry checks]
key-files:
  created: []
  modified:
    - src/web/monaco/diff-adapter.ts
    - src/web/styles.css
    - src/web/prototypes/MonacoStabilityPrototype.vue
    - tests/integration/monaco-anchor.spec.ts
    - tests/integration/anchored-workspace.spec.ts
key-decisions:
  - "Select the stable typed theme immediately before createDiffEditor and use only public Monaco decoration collections."
  - "Keep diff, selection, and anchor decoration ownership independent so composer rebuilds cannot erase persistent diff or selection meaning."
  - "Use non-layout outline, border, and existing decoration lanes rather than row fills, new zones, or injected text."
patterns-established:
  - "Treat an empty immutable Monaco model as zero effective decoration lines to prevent counterpart signs."
  - "Use fixed Base/Head class names and CSS pseudo-content for non-interactive signed gutter cues."
requirements-completed: [DIFF-01, DIFF-02, DIFF-03, DIFF-04, DIFF-05]
duration: 35min
completed: 2026-07-27
status: complete
---

# Phase 06 Plan 03: Monaco Semantic Integration Summary

**The production Monaco adapter now selects the shared dark theme before construction and composes sparse signed diffs, selection contrast, anchors, focus, flat empty regions, and hidden hunks without changing review mechanics or editor geometry.**

## Performance

- **Duration:** 35 min
- **Completed:** 2026-07-27T08:36:28Z
- **Tasks:** 2/2
- **Files modified:** 5

## Accomplishments

- Registered and selected `diff-review-dark` immediately before every `createDiffEditor` call, preserving all existing options while adding only `renderIndicators: false`.
- Added stable Base/Head diff and selection collections; diff updates replace bar/sign decorations before existing anchor-layout, affordance, and change callbacks, while model disposal clears every concern independently.
- Applied phase-owned semantic hooks for 2px continuous change bars, sparse `−`/`+` signs, flat empty counterparts, collapsed-region colors, high-contrast selected text, anchor rails, and focused panes without changing dimensions or introducing new controls.
- Expanded deterministic TypeScript, JSON, added-file, and deleted-file Chromium fixtures; verified lifecycle bounds, first-paint values, empty-side behavior, overlap channels, production labels/action geometry, and localized overflow.

## Task Commits

1. **Task 1: Select the theme before construction and integrate bounded signed diff layers** — `7406347` (feat)
2. **Task 2: Compose selection, active line, anchor, hover, and focus without reflow** — `2f70d4c` (feat)

## Files Created/Modified

- `src/web/monaco/diff-adapter.ts` — theme-before-construction, concern-owned decoration collections, stable listeners, selection refresh, and empty-model sign suppression.
- `src/web/styles.css` — semantic Monaco selectors for signed bars, signs, empty/hunk regions, selected foreground/edge, anchor rail, and pane focus.
- `src/web/prototypes/MonacoStabilityPrototype.vue` — deterministic TypeScript, JSON, added-file, and deleted-file fixture sequence.
- `tests/integration/monaco-anchor.spec.ts` — real Monaco first-paint, sparse sign, empty counterpart, lifecycle, overlap, selection, focus, and anchor assertions.
- `tests/integration/anchored-workspace.spec.ts` — production Base/Head, 32px comment-action, anchor-channel, geometry, and localized-overflow assertions.

## Verification

- `./node_modules/.bin/vitest run tests/unit/monaco-theme.test.ts tests/unit/monaco-diff-semantics.test.ts` — passed: 2 files, 8 tests.
- `npm run build:web` — passed.
- `node scripts/verify-semantic-css.mjs` — passed: canonical root, retired vocabulary, and author-style invariants.
- `npm run test:browser -- tests/integration/monaco-anchor.spec.ts tests/integration/anchored-workspace.spec.ts` — passed: 22 Chromium tests.
- `npm run test:browser -- tests/integration/monaco-anchor.spec.ts --headed` — passed: 12 headed Chromium tests.
- `npm run test:browser -- tests/integration/anchored-workspace.spec.ts --headed -g "preserves production"` — passed: headed production-workspace semantic check.

## Browser Evidence

- First mounted fixture frame computed a `rgb(13, 17, 23)` canvas and `rgb(1, 4, 9)` gutter.
- Bars were observed at 2px with literal pseudo-content `−` for Base and `+` for Head; added/deleted empty counterparts had no phantom sign and `diagonal-fill` computed `background-image: none` over `rgb(1, 4, 9)`.
- Chromium observed white selected text, blue inset selection/focus edges, a blue 3px anchor rail, preserved semantic bars, production BASE/HEAD labels, and the unchanged 32px comment action.
- Recompute and file-switch assertions retained two live models, one composer pair when active, no duplicate zones, and a fixed listener baseline of 17.

## Decisions Made

- Applied Wave 1 public APIs exactly: `applyDiffReviewTheme(monaco)` and `buildDiffDecorations(changes, side, modelLineCount)`; no public adapter API changed.
- Retained immutable models, side-by-side settings, hidden-region constants, line mapping, keyboard commands, accessibility labels, comment lifecycle, and persistence.
- Used fixed phase-owned classes only; no repository-derived selector, injected model text, dynamic gutter width, package, schema, API, or persistence contribution was introduced.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Suppressed phantom empty-counterpart signs**
- **Found during:** Task 1
- **Issue:** Monaco represents an empty model as one logical line, so a pure added or deleted file could receive a counterpart sign despite the pure range builder correctly rejecting empty `end < start` ranges.
- **Fix:** Passed zero effective lines to `buildDiffDecorations` when a current immutable model has no text.
- **Files modified:** `src/web/monaco/diff-adapter.ts`, `tests/integration/monaco-anchor.spec.ts`
- **Verification:** Added/deleted-file real Chromium assertions passed with zero signs on the empty side.
- **Committed in:** `7406347`

---

**Total deviations:** 1 auto-fixed (1 Rule 1 bug).
**Impact on plan:** Necessary empty-model correctness fix; no scope expansion or behavior change.

## Issues Encountered

- The semantic CSS verifier rejects unallowlisted inset shadows. The required non-layout selection, anchor, and focus channels use equivalent inset outlines and the existing decoration lane border instead, and the audit plus real geometry assertions pass.
- A full headed workspace suite emitted one Vite-served 404 console message in an existing navigation assertion; the headed Monaco suite and isolated headed production semantic workspace check passed. The plan-required headless focused suite passed 22/22.

## Known Stubs

None. The existing `::placeholder` selector is a browser pseudo-element rule, not a product stub.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 07 can adapt review surfaces against one concrete Monaco semantic contract without changing adapter ownership or review mechanics.
- Phase 08 can use the focused Chromium seams for broader forced-colors, grayscale, narrow-layout, and composited-contrast continuity proof.

## Self-Check: PASSED

- Task commits `7406347` and `2f70d4c` exist and contain only their plan-owned production/test artifacts.
- Required summary artifact and all five plan-owned implementation/test files exist.
- No API, schema, package, persistence, or public-adapter contribution was introduced.
