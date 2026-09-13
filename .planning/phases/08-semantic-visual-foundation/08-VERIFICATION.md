---
phase: 08-semantic-visual-foundation
verified: 2026-09-13T09:01:56Z
status: passed
score: 6/6 verified
requirements:
  - VIS-01
  - VIS-02
  - VIS-03
re_verification: true
---

# Phase 08 — Semantic Visual Foundation Verification

## Goal verdict

**PASSED.** The workspace and Monaco derive their paint from one canonical semantic root. The former G-01 mismatch is closed: the browser-facing global ring is a `2px` tokenized outline with a `3px` tokenized offset, browser checks derive both expectations from that root, and the semantic audit rejects an orphaned canonical token.

The G-01 closure is token wiring and test derivation only. Its sole production-style files are `src/web/styles.css` and the Phase 6 prototype stylesheet; its test changes are focus assertions. No Phase 09 tree, Phase 10 diff layout, or Phase 11–12 shell/review/export surface work was introduced.

## Requirement ownership

| Requirement | REQUIREMENTS.md owner | Phase-plan coverage | Verdict |
|---|---|---|---|
| VIS-01 | Phase 08 | 08-01, 08-02, 08-04, 08-05 | VERIFIED |
| VIS-02 | Phase 08 | 08-01, 08-03, 08-05 | VERIFIED |
| VIS-03 | Phase 08 | 08-02, 08-04, 08-05, 08-06 | VERIFIED — G-01 closed |

`REQUIREMENTS.md:12-14` assigns all three IDs only to Phase 08. No Phase 08 PLAN claims a requirement owned by another phase.

## Must-have evidence

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Workspace has one canonical semantic token root and components do not carry a second palette. | VERIFIED | `src/web/styles.css:1-135` is the sole context-free root. `scripts/verify-semantic-css.mjs:588-595` audits source CSS, all CSS/Vue style sources, Monaco theme source, and fresh generated CSS. `npm run verify:semantic-css` passed. |
| 2 | Monaco colours resolve byte-for-byte from the canonical root rather than a second palette. | VERIFIED | `src/web/monaco/theme.ts:3-11` imports build-time root text and resolves named tokens with `toMonacoHex`; its complete colour map is token calls (`:45-105`). `tests/unit/monaco-theme.test.ts:110-139` independently maps each Monaco key/rule to filesystem-root bytes. `npm run test:unit -- tests/unit/monaco-theme.test.ts` passed: 29 files, 166 tests. |
| 3 | Direct colour drift, malformed/duplicate/missing root tokens, retired vocabulary, and stale-bundle auditing are rejected by a runnable gate. | VERIFIED | `package.json:35` defines build-first `verify:semantic-css`; `scripts/verify-semantic-css.mjs:459-551` runs self-checks unconditionally, `:584-595` audits the fresh generated bundle and reports success. The named command passed after a fresh Vite build. |
| 4 | Monaco is actually painted in the browser with canonical canvas, gutter, selection, focus, syntax, and diff roles. | VERIFIED | Runtime theme registration is at `src/web/monaco/theme.ts:107-109`; browser assertions are `tests/integration/monaco-anchor.spec.ts:217-285`. The full browser run passed both Monaco assertions. |
| 5 | Browser expectations derive palette and focus geometry from the root rather than pin stale values. | VERIFIED | `tests/integration/draft-recovery-ui.spec.ts:214-216` and `tests/e2e/responsive-session.spec.ts:1285-1290` resolve outline width/offset through canonical tokens. A scoped source/test search found no `outline-offset: 2px` or test assertion pinning the superseded focus offset. |
| 6 | Canonical type, spacing, radius, focus geometry, and currently owned density values are supplied by the root without zero-consumer declarations. | VERIFIED | Root values include `--focus-outline-width: 2px` and `--focus-offset: 3px` at `src/web/styles.css:111-112`; global `:focus-visible` consumes both at `:148-150`. Other owned geometry wiring is visible at `:406-409`, `:630-631`, `:939-940`, `:1231-1233`, and `:2598-2605`. The root contains 93 declarations. `scripts/verify-semantic-css.mjs:256-275,588` independently extracts declarations, CSS/Vue `var()` references, Monaco `color('--token')` references, and transitive root aliases, then fails on any zero-consumer token. `npm run verify:semantic-css` passed: **no declared token has zero consumers.** |

## G-01 closure

**Resolved.** The prior failure was the contradicted focus contract: root `--focus-offset: 3px`, but global paint and tests used `2px`.

- The root now declares the approved values at `src/web/styles.css:111-112`; the actual global ring consumes them at `:148-150`.
- Prototype focus styling also consumes the same tokens at `src/web/prototypes/Phase6DiffSemanticsPrototype.vue:890-892`.
- The runtime responsive test checks the ring is both token-derived and unclipped at `tests/e2e/responsive-session.spec.ts:1285-1290`; the recovery test checks the same contract at `tests/integration/draft-recovery-ui.spec.ts:214-216`.
- The closure diff removes unused declarations rather than preempting later surfaces. `08-06-SUMMARY.md:61-95` records each disposition: unused tree/diff/shell/dialog density values (`--radius-file-row`, `--radius-scrollbar`, `--control-height-compact`, `--file-row-min-height`, `--diff-row-height`, `--diff-gutter-width`, `--diff-sign-width`, `--sidebar-width`, `--dialog-width`, `--dialog-max-height`, `--space-3`, `--space-5`) were retired; `--border-width-default`, `--focus-outline-width`, `--focus-offset`, `--selected-rail-width`, and `--control-height-standard` were wired. The live audit confirms no remaining canonical root declaration is unconsumed.

## Focused verification

| Command | Result |
|---|---|
| `npm run verify:semantic-css` | Passed — fresh web build completed and semantic audit reported canonical-root, retired-vocabulary, and author-style invariants green. |
| `npm run test:unit -- tests/unit/monaco-theme.test.ts` | Passed — 29 files, 166 tests. The package wrapper intentionally runs the complete unit category. |
| `npx vitest run tests/unit/token-contract.test.ts` | Passed — 1 file, 6 tests. |
| `npm run typecheck:web` | Passed. |
| `npm run build` | Passed as the first half of `npm run build && npm run test:browser`. |
| `npm run build && npm run test:browser` | Build passed. Browser result: 91 passed; exactly the three known external failures below; no Phase 08 regression. |

## Browser residuals — external to Phase 08

The full browser run reproduced **only** the three already-known failures:

1. `tests/e2e/file-tree.spec.ts:331` expects selected treeitem `tabindex="0"`, received `"-1"` — pre-existing failure attributed by the supplied investigation to `b960bb7e`.
2. `tests/e2e/marketplace-review.spec.ts:97` — `CUMPA_MARKETPLACE_URL_MARKER required`.
3. `tests/e2e/public-support-states.spec.ts:348` — `CUMPA_RUNTIME_CUSTODY_DIR required`.

No additional browser failure appeared. These environmental/pre-existing failures do not change the Phase 08 verdict.

## Scope check

`823d8f4` changes only the semantic audit, shared token consumption in `styles.css`, the prototype focus rule, and canonical-root-derived focus assertions. `c218fef` adds only the closure summary. The closure changes no Vue template/script, no changed-file tree behavior or markup, no Monaco layout/diff semantics, no shell/dialog composition, and no comment, draft, persistence, or export behavior. This preserves Phase 09–12 ownership.

## Remaining human check

Recommended, not a blocking automated gap: inspect a running workspace at the approved desktop and mobile references to confirm the visible 2px/3px ring is not visually clipped and the mockup-derived system is aesthetically equivalent. Automated browser evidence verifies the computed focus geometry, clipping perimeter, root-derived paint, Monaco semantic channels, and behavior continuity.
