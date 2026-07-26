---
phase: 05-semantic-dark-foundation
reviewed: 2026-07-26
depth: standard
files_reviewed: 6
files_reviewed_list:
  - scripts/verify-semantic-css.mjs
  - src/web/styles.css
  - tests/e2e/pinned-session.spec.ts
  - tests/e2e/responsive-session.spec.ts
  - tests/integration/draft-recovery-ui.spec.ts
  - tests/integration/export-receipt-ui.spec.ts
findings:
  critical: 0
  warning: 5
  info: 0
  total: 5
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-07-26
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

The semantic token cutover is largely consistent with the locked palette and the scoped recovery, receipt, and first-paint assertions use real rendered states. However, closed responsive drawers still carry overlay elevation, the stylesheet audit has two concrete bypasses, and the responsive browser contract substitutes a fixture for required real accessibility journeys. The receipt assertions also do not execute at both claimed viewport widths.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: Closed responsive drawers still paint the overlay shadow

**File:** `src/web/styles.css:1364-1374`, `src/web/styles.css:1389-1402`  
**Issue:** Both media-query base rules assign `box-shadow: var(--shadow-overlay)` to the drawer before its `--open` class is applied. A translated-offscreen element's blurred shadow still extends into the viewport (leftward for the closed comments rail and rightward for the closed files drawer), so a closed drawer can leave a visible elevated edge. This contradicts the UI contract that only an *open* overlay is raised/shadowed. The responsive test also codifies this incorrect state by expecting a rail shadow before it clicks `Review` at `tests/e2e/responsive-session.spec.ts:674-681`.

**Fix:** Keep `box-shadow: none` on the closed drawer rules and place `box-shadow: var(--shadow-overlay)` on `.comments-rail--open` and `.review-files--open` inside their respective media queries. Update the test to assert `none` while closed and the overlay shadow only after opening.

### WR-02: The semantic CSS audit accepts a disallowed later `box-shadow` declaration

**File:** `scripts/verify-semantic-css.mjs:165-185`  
**Issue:** `assertAuthorStyle()` uses `rule.declarations.find(...)`, so it validates only the first `box-shadow` declaration in a rule. CSS resolves duplicate declarations by using the later applicable declaration. Consequently, a rule such as `.ui-button:active { box-shadow: none; box-shadow: inset 1px 1px black; }` passes the pressed-shadow check even though its computed style violates the no-inset-shadow contract. The same bypass applies to the selected-rail and overlay allowlists.

**Fix:** Collect every `box-shadow` declaration per rule. Reject duplicate declarations outright (simplest for this constrained stylesheet), or validate every declaration and use the final declaration when determining the computed contract.

### WR-03: The audit permits additional nested token roots with raw colors

**File:** `scripts/verify-semantic-css.mjs:109-115`, `scripts/verify-semantic-css.mjs:143-145`  
**Issue:** `rootRule()` counts only a context-free `:root`, while the raw-color scan exempts every rule whose selector is `:root`, regardless of its media-query context. An added `@media (...) { :root { --some-token: #fff; } }` would therefore pass this audit: it is not counted as another root and its raw literal is exempted. That violates the required single root vocabulary and allows responsive palette overrides to evade the clean-cutover gate.

**Fix:** Fail when any `:root` leaf rule has a non-empty context, and make the raw-color exemption conditional on both `selector === ':root'` and `context.length === 0`. Prefer counting all `:root` rules before selecting the canonical one so the error states the duplicate-root violation directly.

### WR-04: Required real gutter and tooltip journeys are replaced by a fixture, and the focus assertion is a hover false positive

**File:** `tests/e2e/responsive-session.spec.ts:506-510`, `tests/e2e/responsive-session.spec.ts:552-568`  
**Issue:** The test injects a standalone `.diff-workspace__gutter-action` into `document.body`; it never drives the generated Monaco session until the real gutter action appears, as required by the Phase 05 plan. It also has no `UiPrimitives` tooltip journey at all. Further, the test calls `gutter.focus()` immediately after `gutter.hover()` without moving the pointer away, so `::after { display: block }` can be caused solely by `:hover`; removal of the `:focus-visible` selector would still pass.

**Fix:** Route the real diff content and use the existing Monaco hover path to locate the actual button by its exact accessible name. After the pointer-open assertion, move outside the control and assert closure before separately focusing it, then focus another control and assert closure. Add the independent `UiPrimitives` hover/mouse-leave, focus/focus-out, and focus/Escape journeys required by the UI contract.

### WR-05: Receipt static-surface assertions run only at 360px, not both promised widths

**File:** `tests/integration/export-receipt-ui.spec.ts:165-171`, `tests/integration/export-receipt-ui.spec.ts:189-199`  
**Issue:** The viewport loop ends at 360px. The following typography and surface assertions execute once, at that final width only. A 768px-specific receipt rule could reintroduce a light/static-shadow surface or wrong heading type without this test failing, despite the Phase 05 contract requiring evidence at both 768px and 360px.

**Fix:** Move the receipt/row computed-style assertions into the `[768, 360]` loop (or extract and invoke a helper for each width), retaining the overflow assertion alongside them.

---

_Reviewed: 2026-07-26_  
_Reviewer: the agent (gsd-code-reviewer)_  
_Depth: standard_
