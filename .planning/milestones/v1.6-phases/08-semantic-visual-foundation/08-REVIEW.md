---
phase: 08-semantic-visual-foundation
reviewed: 2026-09-13T09:09:03Z
depth: deep
files_reviewed: 21
files_reviewed_list:
  - DESIGN.md
  - package.json
  - scripts/token-root-plugin.mjs
  - scripts/verify-semantic-css.mjs
  - src/web/monaco/theme.ts
  - src/web/prototypes/Phase6DiffSemanticsPrototype.vue
  - src/web/styles.css
  - src/web/theme/token-contract.ts
  - src/web/theme/virtual-tokens.d.ts
  - tests/e2e/pinned-session.spec.ts
  - tests/e2e/responsive-session.spec.ts
  - tests/helpers/canonical-root.ts
  - tests/integration/anchored-workspace.spec.ts
  - tests/integration/draft-recovery-ui.spec.ts
  - tests/integration/export-receipt-ui.spec.ts
  - tests/integration/monaco-anchor.spec.ts
  - tests/unit/monaco-theme.test.ts
  - tests/unit/token-contract.test.ts
  - tsconfig.web.json
  - vite.config.ts
  - vitest.config.ts
findings:
  blocker: 2
  warning: 2
  info: 0
  total: 4
status: findings
---

# Phase 08: Code Review Report

**Reviewed:** 2026-09-13T09:09:03Z  
**Depth:** deep  
**Files reviewed:** 21  
**Status:** findings

## Summary

The current root and Monaco values are valid, and the focused token/theme tests plus the semantic CSS command pass. However, the foundation's loaders and drift gate do not uphold their malformed-CSS contract: valid comments can silently truncate the virtual root, and values the audit approves can make Monaco throw when the browser opens the diff. The Vue prototype audit also has a raw-colour shadow bypass, while the loader-agreement test shares the implementation defect it purports to detect.

## Blockers

### BL-01: Valid CSS comments can silently truncate the virtual token root

**File:** `scripts/token-root-plugin.mjs:6,21`  
**Issue:** `ROOT_DECLARATIONS` stops at the first newline followed by `}`. A valid multiline comment inside `:root` that contains a `}` ends the match early. `load()` then emits that partial text as `TOKEN_ROOT_CSS` without checking that it contains the complete root or all required tokens. Production build succeeds because Vite bundles the string without evaluating Monaco's `color()` calls; the browser then throws when `theme.ts` resolves a missing token. The shared test helper uses the same regex, so it agrees with the same truncated output. A targeted probe with a root containing `/* note\n} */` returned only `"\n--surface-canvas: #000000;\n/* note"`.

**Fix:** Replace the regex extractor with the brace/comment/string-aware rule scanner already used by `verify-semantic-css.mjs` (or extract it into one production-safe parser). Require exactly one context-free `:root`, and validate the emitted declaration set before returning the virtual module. Add a plugin-level fixture for multiline comments, braces in strings/comments, and a missing/duplicate canonical token.

### BL-02: The audit accepts color values Monaco rejects at runtime

**Files:** `scripts/verify-semantic-css.mjs:274-296`; `src/web/theme/token-contract.ts:29-45`  
**Issue:** `assertTokenValueShapes()` only validates the shape of a recognized function. It accepts, for example, `rgb(256 0 0 / 45.5%)`: its audit regex permits three-digit channels and fractional alpha without checking ranges. `normalizeColor()` accepts only integral alpha and rejects a channel above 255, so `toMonacoHex()` throws when the theme module evaluates. The audit's value loop also accepts arbitrary non-function values after the `colorFunctions` loop. Thus `npm run verify:semantic-css` can build and report green for a malformed canonical color map that makes the review UI fail at runtime.

**Fix:** Make the audit enforce a complete value grammar rather than merely reject a few bad forms: classify every color token, require each resolved color to be a lowercase six/eight-digit hex or the exact supported `rgb(r g b / n%)` form, check channel/alpha ranges, and resolve every alias with cycle detection. Better, expose one parser/normalizer usable by both the Node audit and `token-contract.ts`, then add rejection fixtures for out-of-range channels, fractional alpha, arbitrary values, and cycles.

## Warnings

### WR-01: Vue prototypes can introduce raw palette shadows without the drift gate rejecting them

**File:** `scripts/verify-semantic-css.mjs:377,404,442-449`  
**Issue:** `assertDirectColorConfinement()` explicitly skips `box-shadow`. For production CSS, the later shadow allowlist compensates; for Vue styles, `assertVueStyleBlocks()` calls `assertAuthorStyle(..., { enforceShadowAllowlist: false })`, which returns before that allowlist. Consequently a Phase 6 prototype rule such as `box-shadow: 0 0 1px #fff` or `... red` passes the semantic audit despite the contract requiring component-local paint literals to remain in the canonical root.

**Fix:** Independently inspect `box-shadow` values for direct colors before applying the production selector allowlist, and keep the selector-specific shadow policy disabled only for prototype geometry. Add a self-check using a Vue `<style>` fixture with a raw `box-shadow` color.

### WR-02: The virtual/filesystem agreement assertion is tautological for root extraction

**Files:** `tests/helpers/canonical-root.ts:4,9`; `tests/unit/token-contract.test.ts:66-76`  
**Issue:** Both sides of the supposed agreement use `ROOT_DECLARATIONS` from the Vite plugin. Therefore the test passes when the shared regex extracts the same wrong substring; it cannot detect the comment-truncation defect above, malformed-root extraction, or dev-server invalidation behavior. The non-empty/map-equality assertions establish only that the two consumers invoke the same extractor.

**Fix:** Test `tokenRootPlugin(...).load()` against fixtures using an independent brace-aware expected parser, including comment/string braces and malformed roots. Add a Vite dev-server integration test that changes `styles.css` and verifies a subsequent virtual-module import observes the new declaration map.

## Verification

- `npx vitest run tests/unit/token-contract.test.ts tests/unit/monaco-theme.test.ts` — passed: 2 files, 9 tests.
- `npm run verify:semantic-css` — passed on the current valid stylesheet.
- Focused loader probe demonstrated that `ROOT_DECLARATIONS` truncates a valid root containing a multiline comment with `}`.

---

_Reviewed: 2026-09-13T09:09:03Z_  
_Reviewer: gsd-code-reviewer_  
_Depth: deep_
