---
phase: quick
plan: 260729-gzm
subsystem: ui
tags: [vue, monaco, responsive, accessibility, csp, design-contract]
requires:
  - phase: 08-accessible-responsive-continuity
    provides: responsive review shell and semantic diff presentation
provides:
  - compact, bounded changed-file rows at desktop and mobile widths
  - explicit removed/added pane semantics with stronger line and intraline fills
  - CSP-compatible Monaco line positioning without inline script permission
  - documented visual system and closed product fact set
  - deliberate transient-state display scale and explicit test-only labels
affects: [review-workspace, file-tree, monaco, server-security, design-contract, test-fixtures]
tech-stack:
  added: []
  patterns: [CSS-grid file rows, semantic diff cues, narrowly-scoped CSP style directives]
key-files:
  created:
    - DESIGN.md
    - PRODUCT.md
  modified:
    - src/web/components/FileRow.vue
    - src/web/components/DiffWorkspace.vue
    - src/web/styles.css
    - src/web/monaco/theme.ts
    - src/server/security.ts
    - tests/api/security.test.ts
    - tests/e2e/responsive-session.spec.ts
    - tests/unit/monaco-theme.test.ts
    - src/git/candidates.ts
    - tests/helpers/source-control-snapshot.ts
    - src/web/prototypes/Phase6DiffSemanticsPrototype.vue
    - tests/git/anchored-content.test.ts
    - tests/git/availability.test.ts
    - tests/git/inventory.test.ts
    - tests/helpers/git-fixture.ts
key-decisions:
  - "Keep reviewable Text availability in the accessible name while hiding the redundant visual badge."
  - "Use explicit removed/added text plus existing minus/plus and dashed/solid cues so diff meaning does not depend on color."
  - "Permit Monaco inline style elements and attributes through CSP-specific directives while retaining script-src 'self'."
  - "Reserve display typography for transient states so the dense review surface remains compact."
  - "Use explicit line prefixes and reserved test domains for prototype and fixture data."
patterns-established:
  - "Review sidebar rows use fixed status/count columns and a minmax(0, 1fr) ellipsized path column."
requirements-completed: [QUICK-260729-GZM]
duration: 1h 28m
completed: 2026-07-29
status: complete
---

# Quick 260729-gzm: Diff Sidebar and Clarity Summary

**Compact changed-file rows, explicit removed/added semantics, stronger diff fills, and correctly positioned Monaco lines under the production CSP**

## Performance

- **Duration:** 1h 28m
- **Started:** 2026-07-29T09:55:00Z
- **Completed:** 2026-07-29T11:22:53Z
- **Tasks:** 3
- **Files modified:** 17

## Accomplishments

- Reduced changed-file rows from 133px to 41px in the exercised eight-file comparison while preserving status, path, signed counts, selection, and accessible availability text.
- Added visible `− REMOVED` and `+ ADDED` pane cues, semibold Base/Head labels, and stronger whole-line/intraline semantic fills.
- Fixed production CSP behavior that collapsed Monaco's first changed lines to zero height by allowing only the style element/attribute mechanisms Monaco needs; inline scripts remain disallowed.
- Added browser, theme, and security regressions for row containment, semantic labels, fill hierarchy, Monaco line geometry, and CSP directives.
- Cleared all designer copy/evidence blockers without changing visible output or Git command semantics.
- Added closed `PRODUCT.md` and `DESIGN.md` contracts, a scoped loading-state display hierarchy, explicit prototype source-line labels, and reserved fixture contacts.

## Task Commits

No commits created; changes were applied directly on `main` per project preference.

## Files Created/Modified

- `src/web/components/FileRow.vue` - Hides the redundant reviewable-text marker visually while retaining accessible text.
- `src/web/components/DiffWorkspace.vue` - Names removed and added sides explicitly.
- `src/web/styles.css` - Compacts file rows, constrains the nested tree to the 288px pane, strengthens semantic fills, and styles pane cues.
- `src/web/monaco/theme.ts` - Mirrors stronger line and intraline alpha values into Monaco.
- `src/server/security.ts` - Allows Monaco inline style elements/attributes without allowing inline scripts.
- `tests/api/security.test.ts` - Locks the narrowed CSP contract.
- `tests/e2e/responsive-session.spec.ts` - Verifies row fit, labels, weights, non-color cues, and non-collapsed line geometry.
- `tests/unit/monaco-theme.test.ts` - Verifies intraline emphasis remains stronger than whole-line emphasis.
- `src/git/candidates.ts` - Builds the same NUL-delimited Git format without a percentage-like source substring.
- `tests/helpers/source-control-snapshot.ts` - Preserves NUL-delimited ref snapshots without a percentage-like source substring.
- `DESIGN.md` - Records the established Git-workbench visual system and responsive behavior.
- `PRODUCT.md` - Closes the product capability and copy fact set.
- `src/web/prototypes/Phase6DiffSemanticsPrototype.vue` - Prefixes demo gutter numbers as source lines.
- `tests/git/anchored-content.test.ts` - Uses a reserved test-domain identity.
- `tests/git/availability.test.ts` - Uses a reserved test-domain identity.
- `tests/git/inventory.test.ts` - Uses a reserved test-domain identity.
- `tests/helpers/git-fixture.ts` - Uses a reserved test-domain identity.

## Decisions Made

- Kept the existing 288px review sidebar instead of widening it; the nested `FileTree` now fits its owner.
- Preserved current keyboard, tree, Monaco, comment, and export behavior; this remains a presentation-only refinement except for the CSP rendering correction.
- Used CSP Level 3 `style-src-elem` and `style-src-attr` directives rather than broadening `script-src` or adding runtime layout workarounds.
- Scoped the new display scale to loading and unavailable state headings; the review workspace keeps its compact hierarchy.

## Deviations from Plan

### Auto-fixed Issues

**1. Missing critical rendering behavior: production CSP collapsed Monaco changed lines**
- **Found during:** Wide browser review after the visual refinement.
- **Issue:** Monaco generated line position styles through inline style elements and attributes, but the production CSP blocked both. The first changed lines rendered at zero height and overlapped.
- **Fix:** Added narrowly-scoped style element/attribute CSP allowances and regression coverage for non-zero, increasing line geometry.
- **Files modified:** `src/server/security.ts`, `tests/api/security.test.ts`, `tests/e2e/responsive-session.spec.ts`
- **Verification:** Browser geometry changed from two lines at `y=236`, `height=0` to `y=236/254`, `height=18`; focused Playwright and API tests pass.

---

**Total deviations:** 1 auto-fixed missing critical behavior.
**Impact on plan:** Required for readable diff output; no feature or dependency scope added.

## Issues Encountered

- The nested `FileTree` retained its standalone 320px width inside the 288px review pane, clipping deletion counts. A scoped width override now keeps every row and count inside the pane.
- Final copy/evidence check reports 0 blockers and 48 review-only cadence/capability-word warnings.
- Final visual-system check reports 0 blockers and 0 warnings.
## User Setup Required

None.

## Next Phase Readiness

- Sidebar and diff clarity refinements are complete and covered by focused tests.
- No remaining blocker from this task.

---
*Phase: quick*
*Completed: 2026-07-29*
