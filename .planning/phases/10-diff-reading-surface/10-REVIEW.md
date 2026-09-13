---
phase: 10-diff-reading-surface
reviewed: 2026-09-13T17:10:36Z
depth: deep
files_reviewed: 12
files_reviewed_list:
  - src/web/components/DiffWorkspace.vue
  - src/web/monaco/diff-adapter.ts
  - src/web/monaco/diff-semantics.ts
  - src/web/monaco/theme.ts
  - src/web/prototypes/MonacoStabilityPrototype.vue
  - src/web/styles.css
  - tests/e2e/responsive-session.spec.ts
  - tests/integration/monaco-anchor.spec.ts
  - tests/integration/selector-drift-ui.spec.ts
  - tests/unit/monaco-diff-adapter.test.ts
  - tests/unit/monaco-diff-semantics.test.ts
  - tests/unit/monaco-theme.test.ts
findings:
  critical: 0
  warning: 3
  info: 0
  total: 3
status: findings
---

# Phase 10: Code Review Report

**Reviewed:** 2026-09-13T17:10:36Z  
**Depth:** deep  
**Files Reviewed:** 12  
**Status:** findings

## Summary

Reviewed the Phase 10 source delta, including the Vue lifecycle, Monaco adapter/model flow, decoration generation, theme/CSS authority, and focused browser/unit coverage. The `matchMedia` listeners are paired with matching removal calls, the mutually exclusive density queries converge correctly when both change notifications are delivered, and the child-editor aria-label fallback is reapplied after every `setFile()` completion. The Monaco-owned center-band paint remains theme-driven; the only new `!important` rules target Monaco controls with no theme key for their edge surface.

No BLOCKER was found. Three browser/unit assertions do not prove the new boundary contract and can allow visual regressions through.

## Warnings

### WR-01: Equal-height assertion cannot detect a hunk-boundary geometry regression

**File:** `tests/integration/monaco-anchor.spec.ts:313-314`  
**Issue:** The assertion compares `getComputedStyle(element).height`. If `box-sizing: border-box` is removed or a border becomes content-box, that CSS height can remain equal while the hunk line's rendered outer height grows by the two one-pixel borders. The test would still pass despite the exact code-line/paired-zone geometry regression it claims to cover.  
**Fix:** Compare rendered dimensions instead, for example the `boundingBox().height` (or `offsetHeight`) of the start/end boundary lines against an interior line; retain the paired-zone alignment assertion after adding a comment.

### WR-02: Forced-colors boundary assertion is tautological about visibility

**File:** `tests/e2e/responsive-session.spec.ts:1233-1234`  
**Issue:** Checking only that `border-*-color` serializes as `rgb(...)` does not prove a visible hunk boundary. Browsers report a computed border color even for a zero-width/default border, and forced-colors auto-adjustment can also produce an RGB color without Phase 10's `CanvasText` override. Removing the boundary border rule can therefore leave these assertions green.  
**Fix:** Assert `border-top-width`/`border-bottom-width` are `1px` and the style is `solid`, then compare the resolved color to a same-page `CanvasText` probe (or other explicit system-color reference) rather than merely matching the serialization format.

### WR-03: Edge-case decoration tests discard the structural class identity

**File:** `tests/unit/monaco-diff-semantics.test.ts:21-34, 61-68`  
**Issue:** `observableDecorations()` projects the new hunk decorations to their range and the presence of the `className` key, but drops `options.className`. All seven extended arrays therefore accept `className: undefined`, an arbitrary class, or the same class for both boundaries. The browser test covers one normal head-side fixture, not the merged, clamped, insertion/deletion, and single-line cases these arrays are meant to protect.  
**Fix:** Include `className: options.className` in the projection and assert `monaco-diff-hunk-start` and `monaco-diff-hunk-end` for every affected expected entry, alongside their existing range assertions.

## Focused Validation

- `npx vitest run tests/unit/monaco-diff-adapter.test.ts tests/unit/monaco-diff-semantics.test.ts tests/unit/monaco-theme.test.ts` — passed (14 tests).
- `npm run test:browser -- tests/integration/monaco-anchor.spec.ts --grep "11c"` — passed (1 Chromium test).

---

_Reviewer: gsd-code-reviewer_  
_Depth: deep_
