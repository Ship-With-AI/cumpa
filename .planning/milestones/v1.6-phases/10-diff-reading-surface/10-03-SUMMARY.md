---
phase: 10-diff-reading-surface
plan: "03"
subsystem: ui
tags: [monaco, diff-editor, semantic-css, playwright, hidden-regions]
requires:
  - phase: 10-diff-reading-surface
    provides: Immutable Monaco diff options and typed hidden-region theme paint
provides:
  - Monaco-only paint authority for collapsed hidden-region bands
  - Production consumers for collapsed-context gap and hunk-surface tokens
  - Chromium proof of hidden-region rest, hover, link, count, and native-name behavior
affects: [10-04, 10-05, monaco-diff-adapter, semantic-css]
tech-stack:
  added: []
  patterns:
    - Let Monaco theme paint surfaces it owns; scope Cumpa CSS to native edge affordances Monaco leaves unpainted.
    - Assert rendered Monaco colors against canonical-root bytes through toRootRgb rather than copied literals.
key-files:
  created:
    - .planning/phases/10-diff-reading-surface/10-03-SUMMARY.md
  modified:
    - src/web/styles.css
    - src/web/prototypes/MonacoStabilityPrototype.vue
    - tests/integration/monaco-anchor.spec.ts
key-decisions:
  - "The Monaco theme owns the hidden-region center band through unchangedRegion theme keys; Cumpa owns only edge controls and breadcrumb hover."
  - "Edge control background and border declarations need !important because Monaco injects its equal-specificity stylesheet after author CSS."
patterns-established:
  - "Use a reachable lower native edge control for real-pointer hover proof when Monaco's upper edge overlaps the view-zone boundary."
requirements-completed: [DIFF-02, DIFF-03]
duration: 17m
completed: 2026-09-13
status: complete
---

# Phase 10 Plan 03: Hidden-Region Paint Authority and Token Re-homing Summary

**Collapsed Monaco region bands now inherit their canonical surface and foreground only from the registered Monaco theme, while the native context edges provide distinct gap and hunk feedback.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-09-13T16:08:32Z
- **Completed:** 2026-09-13T16:25:42Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Deleted the competing `.monaco-editor .diff-hidden-lines .center` rule (original `styles.css:2759-2763`), returning its background, foreground, and shadow to `diffEditor.unchangedRegion*` theme keys.
- Re-homed `--surface-gap` to the native top/bottom edge controls at rest and `--diff-hunk-background` to their hover/drag state; the edges now carry `--border-gap` rather than `--border-default`.
- Added a real Chromium test for the collapsed band's canonical color bytes, lower-edge rest and pointer-hover paint, themed link codicon, visible hidden-line count, and Monaco-native control title/role.

## Task Commits

Each task was committed atomically:

1. **Task 1: Give the band back to the theme and re-home both tokens in one change** - `fe0a7ac` (feat)
2. **Task 2: Prove the four hidden-region surfaces against canonical token bytes in a real browser** - `523c130` (feat)

## Files Created/Modified

- `src/web/styles.css` - Removes duplicate center-band paint; establishes the gap and hunk token consumers on native context edges, with vendor-cascade-safe declarations.
- `src/web/prototypes/MonacoStabilityPrototype.vue` - Extends the existing first fixture's leading unchanged run so Monaco renders a collapsed region for the browser proof.
- `tests/integration/monaco-anchor.spec.ts` - Adds the canonical-byte, native-count, native-control, and real-pointer hidden-region assertion.
- `.planning/phases/10-diff-reading-surface/10-03-SUMMARY.md` - Records plan outcome and evidence.

## Decisions Made

- Kept the theme's `--surface-panel` mapping for the center band rather than re-pointing it to `--surface-gap`; this preserves the approved Monaco theme table and a single paint authority.
- Used the existing native lower edge for the pointer hover proof. The first fixture's upper edge lies at Monaco's view-zone boundary and is not targetable by Playwright, while the lower edge is the same native control state and receives real pointer hover.

## Verification

| Command | Result |
| --- | --- |
| `npm run verify:semantic-css` | Passed after final changes. |
| `npx vitest run tests/unit/monaco-theme.test.ts tests/unit/monaco-diff-semantics.test.ts` | Passed — 2 files, 9 tests. |
| `npm run test:browser -- tests/integration/monaco-anchor.spec.ts` | Passed — 14 Chromium tests. |

The declared red window was observed after deleting the center rule and before re-homing `--surface-gap`: `Semantic CSS audit failed: canonical tokens no consumer: --surface-gap`. It closed before Task 1's `fe0a7ac` commit; the semantic CSS gate was green for that commit and at plan end.

The browser assertions observed canonical computed colors: `--surface-panel` `rgb(22, 27, 34)`, `--diff-hunk-foreground` `rgb(173, 200, 230)`, `--surface-gap` `rgb(17, 24, 33)`, `--border-gap` `rgb(37, 45, 56)`, and `--diff-hunk-background` `rgb(23, 33, 49)`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Vendor cascade] Made native edge paint effective after Monaco stylesheet injection**
- **Found during:** Task 2 (real-browser proof)
- **Issue:** The initial edge rule's equal-specificity background was overridden by Monaco's later stylesheet, yielding transparent rest paint instead of `--surface-gap`.
- **Fix:** Applied `!important` only to the edge background and border declarations, and to the native edge hover/drag background; no semantic-CSS allowlist changed.
- **Files modified:** `src/web/styles.css`
- **Verification:** Chromium observed all five canonical token bytes and passed all 14 anchor tests.
- **Committed in:** `523c130` (Task 2)

**Total deviations:** 1 auto-fixed (1 bug fix).
**Impact on plan:** The correction makes the planned token re-homing observable in Monaco's real CSS cascade without adding a new authority or widening any gate.

## Issues Encountered

- The first existing fixture did not naturally produce a `.diff-hidden-lines` widget under the live Monaco configuration. Per the plan's conditional instruction, its leading unchanged run was extended in place; no fixture was inserted or reordered.
- Because that required fixture adjustment, `src/web/prototypes/` was modified only for Task 2's planned browser precondition. `scripts/verify-semantic-css.mjs` was not modified.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 10-04 can rely on a single theme authority for collapsed bands, production consumers for both previously stranded tokens, and a no-allowlist-widening semantic CSS gate.
- `STATE.md` and `ROADMAP.md` remain unmodified. Pre-existing untracked user files were preserved.

---
*Phase: 10-diff-reading-surface*
*Completed: 2026-09-13*

## Self-Check: PASSED

- Task commits `fe0a7ac` and `523c130` are present.
- Final semantic CSS, focused Monaco unit, and focused Chromium browser verification passed.
- No tracked `STATE.md` or `ROADMAP.md` change is present.
