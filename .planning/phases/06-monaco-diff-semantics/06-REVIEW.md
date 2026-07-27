---
phase: 06-monaco-diff-semantics
reviewed: 2026-07-27T08:51:22Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - scripts/verify-semantic-css.mjs
  - src/web/styles.css
  - src/web/monaco/theme.ts
  - src/web/monaco/diff-semantics.ts
  - src/web/monaco/diff-adapter.ts
  - src/web/prototypes/MonacoStabilityPrototype.vue
  - tests/unit/monaco-theme.test.ts
  - tests/unit/monaco-diff-semantics.test.ts
  - tests/integration/monaco-anchor.spec.ts
  - tests/integration/anchored-workspace.spec.ts
findings:
  critical: 1
  warning: 5
  info: 0
  total: 6
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-07-27T08:51:22Z  
**Depth:** standard, with cross-file contract tracing  
**Files Reviewed:** 10  
**Status:** issues_found

## Summary

The review traced the typed theme through adapter construction, the public `ILineChange` decoration transform through its adapter collections and CSS hooks, the prototype/browser harnesses, and the semantic-CSS verifier. The range transform correctly rejects empty counterpart ranges before clamping, merges touching ranges, uses fixed side-owned classes only, and does not inject repository text. Theme/theme-test mappings use public Monaco APIs and the adapter keeps diff, selection, and anchor decorations independently owned and cleared. No security injection, secret, network, or model-mutation defect was found in the reviewed scope.

One blocker violates the phase's explicit no-reflow contract: the anchor rail is a layout-consuming border on the whole-line code decoration. The current browser checks do not measure the affected code origin, so the regression can pass. The remaining warnings are integration/type-safety and verification gaps that leave specified semantic contracts unenforced.

## Critical Issues

### BL-01: Anchor rail shifts the anchored line's code origin

**Files:** `src/web/monaco/diff-adapter.ts:507-511`, `src/web/styles.css:1669-1672`, `tests/integration/anchored-workspace.spec.ts:697-711`  
**Issue:** `anchorDecoration()` applies `className: 'monaco-anchor-line'` to an `isWholeLine` decoration. That is the code-line decoration surface, not the independently allocated line-decoration/glyph-margin lane used for the change bars. The CSS then applies `border-left: 3px`; a left border consumes inline box space and moves the anchored line's content start by 3px. This violates DIFF-04/UI-SPEC's invariant that an anchor rail must not move code, gutter, sash, or line geometry. `box-sizing: border-box` only keeps the outer width fixed; it does not keep the content origin fixed. The sole production geometry assertion compares the outer diff-editor rectangle before and after anchoring, so it cannot detect this line-level shift.

**Fix:** Paint the rail through a non-layout channel, then prove it at the affected element level. For example, permit this exact inset shadow in the semantic-CSS verifier and replace the border:

```css
.monaco-editor .monaco-anchor-line {
  box-shadow: inset 3px 0 var(--interactive-accent);
}
```

Alternatively, use an absolutely positioned decoration pseudo-element that does not participate in line layout. Extend the browser test to record the anchored `.view-line`/token `x` coordinate, gutter width, and line height before and after activating the anchor, asserting exact equality while still asserting the visible 3px rail.

## Warnings

### WR-01: The web adapter has a TypeScript call-signature error hidden by the build configuration

**Files:** `src/web/monaco/diff-adapter.ts:98`, `src/web/monaco/theme.ts:90-93`, `tsconfig.json:14-19`  
**Issue:** The adapter calls `applyDiffReviewTheme(monaco)`, but the exported helper accepts zero arguments. A focused strict TypeScript check of the adapter with bundler resolution reports `TS2554: Expected 0 arguments, but got 1.` The normal `build:node` command does not catch it because `tsconfig.json` excludes `src/web/**`; Vite transpiles without type checking. JavaScript currently ignores the extra argument, but the shipped TypeScript source is invalid and the integration test invokes the helper directly with no argument, so it cannot catch the adapter integration error.

**Fix:** Invoke the helper with no argument:

```ts
applyDiffReviewTheme();
```

Add a web type-check target (or include the web adapter in the existing type-check) and an adapter construction-order test that asserts theme definition/selection occur before `createDiffEditor`.

### WR-02: The semantic-CSS gate does not enforce the component-style palette rule, and the Phase fixture violates it

**Files:** `src/web/prototypes/MonacoStabilityPrototype.vue:296-308`, `scripts/verify-semantic-css.mjs:451-457`  
**Issue:** The prototype's scoped component CSS uses raw light palette literals (`#f6f3ec`, `#242822`, and `#c9c2b5`) even though the Phase 06 contract requires component CSS to consume the root semantic roles and confines raw colors to the root/theme mapping. The verifier validates author-style/direct-color confinement only for `src/web/styles.css` (`assertAuthorStyle(source)`); it never validates the browser-served prototype SFC style. Consequently, the claimed semantic CSS gate passes while the phase's real-Monaco test fixture renders a light surrounding surface and can conceal the prohibited palette escape.

**Fix:** Replace those declarations with the existing semantic variables (for example `var(--surface-canvas)`, `var(--text-primary)`, and `var(--border-default)`) and ensure the verifier or a focused build-time test also examines authored Vue/SFC style blocks that are served by the Phase fixture.

### WR-03: The no-reflow integration test cannot catch the anchor-induced code movement or the required responsive boundary

**Files:** `tests/integration/anchored-workspace.spec.ts:688-711`, `src/web/styles.css:1669-1672`  
**Issue:** The test checks only the outer `.monaco-diff-editor` bounding box at one 1280px viewport. It does not capture content origin, gutter allocation, line height, pane split, sash position, scroll dimensions, or paired-zone positions before/after semantic states. Its `hasNoPageOverflow` expression compares `.review-main.scrollWidth` with the document viewport rather than asserting `document.documentElement.scrollWidth <= document.documentElement.clientWidth`, and it never runs the required 1440/1280/1100/768/640px matrix. It therefore passes despite the concrete line-level reflow in BL-01 and does not defend the stated localized-overflow contract.

**Fix:** At each required viewport, retain baseline measurements for both panes' code/gutter origins, line height, pane widths/sash, scroll dimensions, action position, and paired-zone geometry; activate selection/anchor/focus/hover states; then assert no change. Separately assert document-level overflow is absent while allowing the designated local Monaco/review-main scroll owner.

### WR-04: Theme tests duplicate literals but do not test CSS-to-theme parity

**Files:** `tests/unit/monaco-theme.test.ts:19-111`, `src/web/styles.css:1-48`, `src/web/monaco/theme.ts:5-87`  
**Issue:** The test compares `DIFF_REVIEW_THEME` to locally duplicated `REQUIRED_COLORS` and `REQUIRED_RULES`; it never reads or derives the values from the canonical root token declaration. The semantic CSS script independently checks a different duplicated `expectedValues` map. A future approved root-token update can therefore change the CSS and its verifier expectation without changing the theme test expectation, leaving Monaco on a parallel palette—the exact divergence the Phase contract says the parity test must prevent.

**Fix:** In the unit test, read and parse the canonical `:root` declarations (test-time only; do not add runtime token extraction), then assert every mapped Monaco color/token foreground is byte-identical to its specified root role. Keep the explicit map of Monaco role-to-root-token relationships as the tested contract.

### WR-05: The test labelled “first-frame” samples only after the asynchronous diff has rendered

**Files:** `tests/integration/monaco-anchor.spec.ts:57-60`, `tests/integration/monaco-anchor.spec.ts:205-211`, `src/web/prototypes/MonacoStabilityPrototype.vue:212-215`, `src/web/prototypes/MonacoStabilityPrototype.vue:251-255`  
**Issue:** `openPrototype()` waits for `Rendered real Monaco`. That state is set by the adapter's change callback and again after `await adapter.setFile(...)`; only then does test 11 sample canvas/gutter colors. A light/base-theme flash between editor construction and that later state would not fail this test, despite its name and the Phase requirement that the first mounted Monaco frame is already themed.

**Fix:** Add an adapter-level construction-order test that spies on the public Monaco API and proves `defineTheme`/`setTheme` precede `createDiffEditor`. In the real-browser fixture, also record the first editor frame's computed canvas/gutter values before the asynchronous file-ready signal and assert those recorded values, not only the settled DOM.

---

_Reviewed: 2026-07-27T08:51:22Z_  
_Reviewer: gsd-code-reviewer_  
_Depth: standard_
