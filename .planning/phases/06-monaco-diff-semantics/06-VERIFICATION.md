---
phase: 06-monaco-diff-semantics
verified: 2026-07-27T09:52:38Z
status: human_needed
score: 6/11 must-haves verified
behavior_unverified: 5
overrides_applied: 0
behavior_unverified_items:
  - truth: "Every syntax foreground remains readable over normal, whole-line, intraline, focused-selection, and inactive-selection layers."
    test: "Inspect TypeScript and JSON token samples across the five diff backgrounds and focused/inactive selections."
    expected: "Every text composite is at least 4.5:1 and selected text is white without hiding diff meaning."
    why_human: "The current Chromium spec checks one selected range but contains no source-over contrast loop for the full token/state matrix."
  - truth: "All required Monaco canvas, widget, scrollbar, separator, hidden-region, and workspace layers visibly coordinate on the semantic dark contract."
    test: "Open a changed file, a collapsed hunk, and editor widget/scrollbar states."
    expected: "Surfaces stay dark and semantic; hunk purple is restricted to context controls and separators."
    why_human: "Theme parity is unit-tested and canvas/gutter first frame is browser-tested, but the focused Chromium spec does not inspect all named visible Monaco roles."
  - truth: "All diff-region hierarchy states are visibly distinguishable while code remains readable."
    test: "Inspect whole-line and intraline additions/deletions, unchanged context, collapsed/revealed hunk, and empty counterparts."
    expected: "Quiet whole-line fills, stronger intraline fills, neutral unchanged context, purple hunk controls, and flat empty counterparts remain distinct."
    why_human: "The automated browser test proves bars/signs and flat empty regions but does not assert computed whole-line/intraline/hidden-region styles together."
  - truth: "Active-line emphasis and line-number contrast coexist with the unchanged 32px comment action without reflow."
    test: "Move the caret across changed/unchanged lines while the comment action is visible at each required width."
    expected: "Active line gets only its edge and primary number; gutter/action geometry remains fixed."
    why_human: "The viewport geometry/action contract passes, but no Chromium assertion reads the active-line number and edge in this state."
  - truth: "Every required selection, active-line, hover, anchor, focused-pane, and diff overlap state remains simultaneously distinguishable, including grayscale."
    test: "Exercise the seven UI-SPEC overlap states and repeat Base/Head addition/deletion cues in grayscale."
    expected: "Bars/signs, selection edge and white text, active edge/number, anchor rail, hover action, and focus perimeter coexist; labels, signs, bars, and side position survive without hue."
    why_human: "The focused browser spec proves one Head selection/focus/anchor channel but has no seven-state or grayscale matrix."
human_verification:
  - test: "Run the full token/diff/selection contrast matrix in real Monaco."
    expected: "All specified text composites meet 4.5:1 and meaningful cue boundaries meet 3:1."
    why_human: "No current Playwright assertion calculates source-over contrast for that matrix."
  - test: "Inspect all named Monaco surfaces: hidden hunk controls, separator, widget, hover widget, and scrollbars."
    expected: "They use the approved dark semantic roles, with purple restricted to hunk/context cues."
    why_human: "The theme object is exact and first canvas/gutter paint is covered, but current browser assertions do not observe every visible role."
  - test: "Exercise all seven overlap states and grayscale Base/Head interpretation at 1280×760."
    expected: "Each independent cue remains visible, no state erases diff meaning, and Base/Head remain identifiable without red/green."
    why_human: "Current Chromium coverage only executes one representative selection/focus/anchor state and no grayscale pass."
  - test: "Move the active cursor with the native 32px comment action visible across 1440, 1280, 1100, 768, and 640px."
    expected: "Active line edge/number remain legible and all measured geometry remains unchanged."
    why_human: "The five-viewport geometry test passes but does not read active-line computed styles."
---

# Phase 06: Monaco Diff Semantics Verification Report

**Phase Goal:** Users can accurately interpret the side-by-side Monaco diff when editor layers and surrounding workspace share the same dark semantic contract.

**Verified:** 2026-07-27T09:52:38Z  
**Status:** human_needed  
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Actual evidence |
| --- | --- | --- | --- |
| 1 | Stable `diff-review-dark` is typed, idempotent, and selected before any diff editor is constructed. | ✓ VERIFIED | `theme.ts` exports one `IStandaloneThemeData` with `base: 'vs-dark'`/`inherit: true`; its helper calls `defineTheme` then `setTheme`. `diff-adapter.ts:98-99` invokes it immediately before `createDiffEditor`. `monaco-theme.test.ts` verifies two ordered applications; `monaco-diff-adapter.test.ts` verifies set-theme precedes editor construction. All three Monaco units passed. |
| 2 | Monaco semantic roles match the sole Phase 05 root without a second palette or fallback. | ✓ VERIFIED | `styles.css:1-76` contains the only root and all five approved syntax roles. `theme.ts` maps every UI-SPEC color/token scope. `monaco-theme.test.ts` parses that root and checks every painted role/token against it. The rebuilt source/generated CSS audit passed. |
| 3 | Syntax remains readable over normal, diff, and selection composites, with explicit white selected text. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Theme/root values and `refreshSelectionDecorations()` implement the contract; Chromium observes a white selection class and blue edge. The required full TypeScript/JSON source-over contrast matrix is not present in either Phase 06 browser spec. |
| 4 | Canvas, syntax, gutters, widgets, scrollbars, separators, hidden regions, and workspace form one dark interface from first paint. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Chromium captures first canvas `rgb(13, 17, 23)` and gutter `rgb(1, 4, 9)` before file readiness. Exact widget/scrollbar/hidden-role values are unit-parity checked, but not all are browser-observed. |
| 5 | Additions, deletions, intraline spans, hunks, unchanged context, and flat empty counterparts remain distinguishable and readable. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `theme.ts` supplies exact 15%/35% diff layers and hunk/empty roles; Chromium verifies flat `.diagonal-fill` and correct empty-side signs. It does not inspect whole-line, intraline, and hidden-hunk computed styles together. |
| 6 | Base/deletion and Head/addition carry persistent non-color meaning. | ✓ VERIFIED | `diff-semantics.ts` only emits fixed Base/Head bar/sign classes from public `ILineChange` fields. Chromium observes literal `−`/`+`, 2px bars, no signs on empty counterparts; production Chromium verifies `BASE`/`HEAD` labels. Unit boundaries passed. |
| 7 | One contiguous bar and the sparse-sign rule are deterministic. | ✓ VERIFIED | `buildDiffDecorations()` rejects invalid sides, clamps, sorts, merges touching ranges, emits one whole-line bar, one sign for 1–3 lines, and endpoint signs for 4+ lines. `monaco-diff-semantics.test.ts` covers 1/3/4+, merges, bounds, and fixed option keys; it passed. |
| 8 | Pure additions/deletions have no phantom empty-side marker and decoration ranges stay in immutable-model bounds. | ✓ VERIFIED | The unit contract tests exact insertion/deletion shapes and out-of-range values. `diff-adapter.ts:425-443` passes zero effective lines for text-empty models. Chromium checks added/deleted files have zero counterpart signs. |
| 9 | Line gutters, active-line emphasis, and the 32px comment action remain legible without reflow. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `theme.ts` defines muted/active line-number and transparent active-row roles; `anchored-workspace.spec.ts` passes its five-width geometry/action matrix, including unchanged origins/gutters/panes/sashes/action and no page overflow. It does not observe active-line computed number/edge values. |
| 10 | Selection, active line, hover action, anchor rail, focus perimeter, and diff meaning coexist in every required overlap. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Independent diff/selection/anchor collections, CSS edge/rail/outline channels, and one real Head selection/focus/anchor state are present and browser-tested. The mandated seven-state overlap and grayscale matrices are absent. |
| 11 | Semantic decoration lifecycles remain bounded and independent through recomputation and file restoration. | ✓ VERIFIED | Adapter owns separate diff, selection, and anchor collections; diff update refresh precedes existing anchor rebuild, and model disposal clears all phase collections. Chromium proves 17 stable listeners, two live models, two paired zones, one composer, ten recomputations, and A→B→A restoration. |

**Score:** 6/11 truths verified; 5 present and wired but behaviorally unverified.

### Plan Must-Have Accounting

| Plan | Must-have truth | Disposition |
| --- | --- | --- |
| 06-01 | Stable typed idempotent theme, ready before construction | Truth 1 — ✓ VERIFIED |
| 06-01 | Exact semantic canvas/syntax/diff/gutter/widget/selection/hunk/empty/focus role mapping | Truths 2 and 4 — role parity verified; full browser-visible-role sweep is ⚠️ unverified |
| 06-01 | Syntax readable on all diff/selection layers; explicit white selected foreground | Truth 3 — ⚠️ unverified full matrix |
| 06-02 | Base/Head structural cues independent of hue | Truth 6 — ✓ VERIFIED |
| 06-02 | Contiguous bar and sparse 1–3/4+ marker density | Truth 7 — ✓ VERIFIED |
| 06-02 | Empty-side suppression and immutable-model clamping | Truth 8 — ✓ VERIFIED |
| 06-03 | First-paint coordinated interface and bounded diff lifecycle | Truths 4 and 11 — first canvas/gutter/lifecycle ✓; full visible-role sweep ⚠️ |
| 06-03 | Diff-region hierarchy and readable code | Truth 5 — ⚠️ unverified full browser layer sweep |
| 06-03 | Base/Head non-color cues | Truth 6 — ✓ VERIFIED |
| 06-03 | Gutters, active line, and comment affordance without reflow | Truth 9 — ⚠️ active computed style unverified; geometry/action ✓ |
| 06-03 | Complete interaction overlap composition | Truth 10 — ⚠️ required state/grayscale matrix unverified |

## Required Artifacts

| Artifact | Expected | Status | Three-/four-level evidence |
| --- | --- | --- | --- |
| `src/web/monaco/theme.ts` | Typed theme and registration helper | ✓ VERIFIED | Exists, substantive exact map, imported by adapter, and its data flows to Monaco `defineTheme`/`setTheme`. |
| `tests/unit/monaco-theme.test.ts` | Exact parity and call-order contract | ✓ VERIFIED | Parses actual `styles.css`, imports the real theme, and passed as part of the 3-file/9-test unit command. |
| `src/web/styles.css` | Sole semantic root and non-geometric Monaco hooks | ✓ VERIFIED | One root declares five syntax tokens; fixed sign/bar/selection/empty/anchor/focus selectors consume root variables. Built audit passed source and emitted CSS. |
| `scripts/verify-semantic-css.mjs` | Root/value/author-style audit | ✓ VERIFIED | Reads `styles.css`, bundled CSS, and the prototype SFC styles; its exact source/generated gate passed. |
| `src/web/monaco/diff-semantics.ts` | Public `ILineChange` → fixed decorations | ✓ VERIFIED | Reads only original/modified range fields; no DOM/model text/diff algorithm; adapter calls it with public changes and model counts. |
| `tests/unit/monaco-diff-semantics.test.ts` | Range/marker boundary contract | ✓ VERIFIED | Exercises observable returned ranges/classes/options, insertion/deletion, density, merge, clamp, and deterministic output; passed. |
| `src/web/monaco/diff-adapter.ts` | Theme-before-construction and independent lifecycles | ✓ VERIFIED | Imports both helpers, owns four phase collections, uses `.set()` from diff/selection public events, and clears them on model disposal. Chromium exercises updates/file switching. |
| `src/web/prototypes/MonacoStabilityPrototype.vue` | Deterministic real-Monaco fixture | ✓ VERIFIED | The Vite server in `monaco-anchor.spec.ts` mounts it directly; its published diagnostics drive first-frame and lifecycle assertions. Its style block passed the semantic audit. |
| `tests/integration/monaco-anchor.spec.ts` | Real Monaco behavior | ✓ VERIFIED (partial visual matrix) | Passed 12 Chromium scenarios for first frame, signs, empty sides, selection/focus/anchor channels, lifecycle, files, and paired zones. |
| `tests/integration/anchored-workspace.spec.ts` | Production workspace behavior/no reflow | ✓ VERIFIED (partial active/overlap matrix) | Passed production labels/action/geometry/local-overflow evidence across 1440/1280/1100/768/640px. |

## Key Link Verification

| From | To | Via | Status | Evidence |
| --- | --- | --- | --- | --- |
| `theme.ts` | `styles.css` | Root-derived parity test | ✓ WIRED | `monaco-theme.test.ts` reads the canonical root and compares all painted theme roles/token foregrounds. |
| `verify-semantic-css.mjs` | `styles.css` / emitted CSS / prototype styles | `canonicalTokens`, `expectedValues`, author-style audit | ✓ WIRED | Rebuilt audit reported canonical root, retired vocabulary, and author-style invariants pass. |
| `diff-semantics.ts` | Monaco `ILineChange` | Original/modified public start/end fields | ✓ WIRED | Direct implementation inspection plus passing insertion/deletion, merge, and clamp contract. |
| `diff-adapter.ts` | `diff-semantics.ts` | `onDidUpdateDiff` → `getLineChanges()` → per-side `.set()` | ✓ WIRED | `diff-adapter.ts:121-126,425-443` refreshes before existing anchor layout with actual model counts. |
| `diff-adapter.ts` | `theme.ts` | immediate helper call before constructor | ✓ WIRED | `diff-adapter.ts:98-99`; adapter unit order test passed. |
| `diff-adapter.ts` | `styles.css` | fixed Base/Head bar/sign, selection, anchor, pane hooks | ✓ WIRED | Fixed strings in adapter match CSS selectors; Chromium observes their computed bars/signs/selection/anchor/focus effects. |
| Browser specs | prototype/production workspace | Vite mounts and diagnostics/real DOM | ✓ WIRED | The two explicit specs passed 22 Chromium tests. |

## Requirements Coverage

| Requirement | Description | Code-level evidence | Observable evidence | Status |
| --- | --- | --- | --- | --- |
| DIFF-01 | One coordinated Monaco/workspace dark palette | Typed full theme map, root parity, semantic CSS hooks | First Monaco frame canvas/gutter is dark before readiness; production workspace renders BASE/HEAD/editor | ✓ SATISFIED; broader named-role visual sweep remains human verification |
| DIFF-02 | All diff/context/empty regions readable | Exact whole/intraline/hunk/empty theme roles; flat-empty CSS hook | Chromium observes bars/signs and a flat, no-image empty counterpart | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED for whole/intraline/hunk visual sweep |
| DIFF-03 | Base/Head and deletion/addition are not color-only | Fixed side classes, literal signs, preserved labels/side ownership | Unit range assertions and Chromium literal signs/empty-side tests; production labels visible | ✓ SATISFIED |
| DIFF-04 | Gutters/active/action legible without movement | Theme line-number/active roles; no-layout bars/rails; preserved action geometry | Five-width Chromium matrix confirms 32px action, gutters/origins/panes/sash/action unchanged and no document overflow | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED for active-line computed styles |
| DIFF-05 | Required interaction overlap remains distinguishable | Separate collections and CSS channels for selection/anchor/focus; transparent active row | Chromium observes selection white foreground/blue edge, focus outline, diff bar, and anchor rail together | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED for remaining mandated overlap and grayscale states |

## Automated Evidence

| Command | Result |
| --- | --- |
| `npm run typecheck:web` | ✓ Passed — strict web TypeScript target exited 0. |
| `./node_modules/.bin/vitest run tests/unit/monaco-theme.test.ts tests/unit/monaco-diff-semantics.test.ts tests/unit/monaco-diff-adapter.test.ts` | ✓ Passed — 3 files, 9 tests. |
| `npm run build:web && node scripts/verify-semantic-css.mjs` | ✓ Passed — Vite production build completed; audit reported `Semantic CSS verified: canonical root, retired vocabulary, and author-style invariants pass.` |
| `npm run test:browser -- tests/integration/monaco-anchor.spec.ts tests/integration/anchored-workspace.spec.ts` | ✓ Passed — 22 Chromium tests. Vite selected alternative ports because 5173/5174 were occupied; the specs' own servers completed successfully. |

## Review and Remediation Verification

`06-REVIEW.md` currently reports **0 critical, 0 warning, and 0 info findings**. I independently checked its prior findings against current code and reran their focused gates:

| Prior finding | Current evidence | Disposition |
| --- | --- | --- |
| BL-01 anchor rail reflow | `styles.css` uses `box-shadow: inset 3px 0`, not a border; production Chromium compares code origin, gutters, panes, sash, action, document, local scroll ownership, and paired zones over five widths. | ✓ Resolved |
| WR-01 hidden adapter call-signature issue | Adapter calls zero-argument `applyDiffReviewTheme()`; strict web typecheck and adapter order unit passed. | ✓ Resolved |
| WR-02 prototype palette audit gap | Semantic audit reads the prototype `<style>` block and passed after rebuilding. | ✓ Resolved |
| WR-03 narrow no-reflow evidence | The production spec's 1440/1280/1100/768/640 matrix passed. | ✓ Resolved |
| WR-04 duplicated-literal parity test | Theme test parses and resolves the canonical `:root` rather than carrying a duplicate expected palette. | ✓ Resolved |
| WR-05 post-readiness first-frame sample | Prototype records first canvas/gutter values before file-ready sequence; Chromium assertion passed. | ✓ Resolved |

The required remediation commit `aff4241` exists (`fix(06): enforce Monaco semantic no-reflow contracts`) and changes the strict web target, audit, adapter/prototype/CSS, and focused tests needed for these findings. Its current behavior—not its summary claim—is covered by the checks above.

## Prohibitions and Scope Audit

- No second diff algorithm, model mutation, private Monaco service, custom renderer, injected decoration option text, dynamic repository-derived class, or new visual-only view zone was introduced. `diff-semantics.ts` is a pure public-range transform; fixed CSS pseudo-content supplies the static signs in an existing glyph lane.
- No gutter width/padding/margin, font-metric, line-height, side-by-side setting, inline breakpoint, hidden-region constants, keyboard command, copy, ARIA name, comment lifecycle, persistence, API, Git, CLI, server, export, dependency, remote asset, theme switch, or additional theme change was found. The only `package.json` addition is the `typecheck:web` script; its dependency lists are unchanged. The remediation's workspace-model files split a command type for strict typechecking without changing their state-transition data.
- `renderSideBySide: true`, `renderSideBySideInlineBreakpoint: 0`, read-only models, existing paired zones, and `HIDE_UNCHANGED_REGIONS` remain present. `renderIndicators: false` is the single planned option change.
- The rebuilt semantic audit rejects an additional token root, direct paint colors outside the root/forced-colors repair, remote imports/assets, gradients, unallowlisted shadows, and the prototype SFC palette escape. It passed.
- Debt-marker scan of the phase production/test files found only the pre-existing CSS `::placeholder` pseudo-element, not a TODO/placeholder implementation.

## Human Verification Required

Automated Chromium evidence is substantial but does **not** fully cover the requested visual behavior. Perform the four targeted checks in the frontmatter before treating the phase as fully verified. No code defect or closure-plan gap was found; this is an evidence/visual-completeness gate.

## Gaps Summary

No failed implementation, missing artifact, unwired key link, or blocker anti-pattern was found. The only remaining items are the five present-and-wired visual behaviors listed above. They require the targeted human checks because the current focused specs do not execute the full contrast, grayscale, active-line, all-role, and seven-overlap matrices prescribed by the UI contract.

## Next Action

Run the targeted visual checks above, or add focused automated coverage for the missing contrast/role/overlap/grayscale assertions and re-run this verification. Do not create a closure implementation plan unless a visual check reveals an actual defect.

---

_Verified: 2026-07-27T09:52:38Z_  
_Verifier: the agent (gsd-verifier)_
