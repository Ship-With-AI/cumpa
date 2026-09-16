---
phase: 06-monaco-diff-semantics
reviewed: 2026-07-27T09:35:09Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - package.json
  - tsconfig.web.json
  - scripts/verify-semantic-css.mjs
  - src/web/model/workspace-command.ts
  - src/web/model/workspace-state.ts
  - src/web/styles.css
  - src/web/monaco/theme.ts
  - src/web/monaco/diff-semantics.ts
  - src/web/monaco/diff-adapter.ts
  - src/web/prototypes/MonacoStabilityPrototype.vue
  - tests/unit/monaco-theme.test.ts
  - tests/unit/monaco-diff-semantics.test.ts
  - tests/unit/monaco-diff-adapter.test.ts
  - tests/integration/monaco-anchor.spec.ts
  - tests/integration/anchored-workspace.spec.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: passed
---

# Phase 06: Code Review Report

**Reviewed:** 2026-07-27T09:35:09Z  
**Depth:** Standard, with cross-module lifecycle and browser-contract tracing  
**Files Reviewed:** 15  
**Status:** passed

## Summary

The complete current Phase 06 scope is clean. The remediation at `aff4241` corrects the anchor layout defect, makes the adapter call type-safe under a focused strict web target, extends the semantic audit to the browser-served Vue fixture, derives theme parity from the canonical CSS root, and records the first mounted Monaco surfaces before file readiness. No current blocker, warning, or info finding was established.

The review traced the typed theme through `PublicMonacoDiffAdapter` construction, immutable-model diff decoration and selection lifecycles, fixed CSS class hooks, prototype timing publication, real-Chromium geometry checks, and the production workspace. Decorations remain numeric-range/fixed-class only: repository content cannot become injected decoration text, a selector, or a control.

## Prior-Finding Disposition

| Prior ID | Disposition | Direct evidence |
|---|---|---|
| BL-01 — anchor rail shifts code origin | **Resolved** | `.monaco-anchor-line` now uses the non-layout `box-shadow: inset 3px 0 var(--interactive-accent)` rather than a border. The production browser test records token and line x-origin, gutters, panes, sash, action, document dimensions, scroll owners, and paired zones before/after anchoring at 1440, 1280, 1100, 768, and 640px. The focused suite passed. |
| WR-01 — hidden helper call-signature error | **Resolved** | `applyDiffReviewTheme()` has a zero-argument call in the adapter. `tsconfig.web.json` includes the adapter and its Monaco/type-boundary dependencies; `npm run typecheck:web` passed. `monaco-diff-adapter.test.ts` proves `defineTheme`, `setTheme`, then `createDiffEditor` ordering. |
| WR-02 — SFC palette escape un-audited | **Resolved** | The verifier reads `MonacoStabilityPrototype.vue`, extracts every `<style>` block, and subjects it to the same authored-style/direct-colour confinement checks. The prototype now consumes semantic variables rather than raw palette literals. The verifier contains a negative self-check for a raw Vue style literal and passed against the production build. |
| WR-03 — no-reflow and responsive proof too narrow | **Resolved** | `anchored-workspace.spec.ts` now asserts content origin, gutters, line height, pane/sash geometry, action placement, local scroll ownership, document overflow, and paired-zone alignment across every required phase viewport. All focused Chromium tests passed. |
| WR-04 — CSS/theme parity tested against duplicated literals | **Resolved** | `monaco-theme.test.ts` parses the canonical `:root` declarations, resolves aliases, derives the required Monaco hex/alpha values, and requires every painted theme color and syntax rule to map to an explicit root role. Its 3 focused contracts passed. |
| WR-05 — first-frame sample occurred after file readiness | **Resolved** | The prototype starts a `MutationObserver` before editor construction, captures the first canvas/gutter surfaces once present, exposes capture/ready sequence data, and disconnects on capture/unmount. The browser test waits for that captured state and requires it to precede file-ready sequencing; it passed in real Chromium. |

## Narrative Findings (AI reviewer)

No findings. The reviewed implementation preserves the Phase 06 observable contracts without a demonstrated regression.

## Checked Risk Areas

- **Theme ordering and first paint:** Stable typed `diff-review-dark` registration and selection execute before `createDiffEditor`; the first captured Monaco canvas is `rgb(13, 17, 23)` and gutter is `rgb(1, 4, 9)` before file-ready sequencing.
- **CSS/theme semantic parity:** Every non-transparent Monaco color and every syntax foreground rule has an explicit canonical-root mapping. Alpha conversion is exercised for selection, whitespace, scrollbar, whole-line, and intraline roles.
- **Semantic CSS audit:** Source CSS, emitted CSS, and the prototype SFC style block are audited for canonical root integrity, retired vocabulary, direct-colour confinement, forbidden visual effects, forced-colours placement, and permitted inset/overlay shadows.
- **Diff correctness and safety:** `buildDiffDecorations` rejects empty counterparts before clamping, merges touching/overlapping ranges deterministically, bounds populated ranges, and emits only fixed Base/Head class names and numeric ranges.
- **Lifecycle isolation:** Diff, selection, and anchor decorations remain separately owned and cleared on outgoing-model/final disposal. The real-Monaco recomputation test observes two live models, 17 stable listeners, one active composer, and two paired zones through repeated updates.
- **No reflow and local overflow:** The production workspace verifies no semantic-anchor movement of code origin, gutters, line height, panes, sash, action, or document width at all five Phase 06 viewport widths; paired zones remain aligned.
- **Scope and compatibility:** The type split leaves state transitions as the command producer while letting the adapter consume the narrow command type without importing workspace state. No API, persistence, model-text, line-mapping, side-by-side breakpoint, or interaction-control change was introduced.

## Verification Evidence

- `npm run typecheck:web` — passed.
- `./node_modules/.bin/vitest run tests/unit/monaco-theme.test.ts tests/unit/monaco-diff-semantics.test.ts tests/unit/monaco-diff-adapter.test.ts` — passed: 3 files, 9 tests.
- `npm run build:web` — passed.
- `node scripts/verify-semantic-css.mjs` — passed: canonical root, retired vocabulary, and author-style invariants.
- `npm run test:browser -- tests/integration/monaco-anchor.spec.ts tests/integration/anchored-workspace.spec.ts` — passed: 22 focused Chromium tests.

---

_Reviewed: 2026-07-27T09:35:09Z_  
_Reviewer: gsd-code-reviewer_  
_Depth: standard_
