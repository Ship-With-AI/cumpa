# Phase 06: Monaco Diff Semantics - Pattern Map

**Mapped:** 2026-07-27  
**Files analyzed:** 9 likely changed/extended files (plus 3 explicit no-change integration surfaces)  
**Analogs found:** 9 / 9 (existing role/data-flow analogs)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/web/monaco/theme.ts` | provider/config | request-response (synchronous editor setup) | `src/web/monaco/configure.ts` | role-match |
| `src/web/monaco/diff-semantics.ts` | utility/transform | transform (public `ILineChange`/selection to decorations) | `src/web/monaco/line-mapping.ts` | exact role/data-shape |
| `src/web/monaco/diff-adapter.ts` | adapter/service | request-response + event-driven Monaco lifecycle | current `PublicMonacoDiffAdapter` | exact |
| `src/web/styles.css` | global styling/config | transform (semantic roles to DOM/Monaco hooks) | existing `:root` and `.diff-workspace` rules | exact |
| `scripts/verify-semantic-css.mjs` | verification utility | batch/transform (CSS allowlist audit) | current Phase 05 semantic CSS verifier | exact |
| `src/web/prototypes/MonacoStabilityPrototype.vue` | browser fixture/component | event-driven UI state | `MonacoStabilityPrototype.vue` itself | exact |
| `tests/unit/monaco-theme.test.ts` | unit test | transform contract | `tests/unit/line-mapping.test.ts` | role-match |
| `tests/unit/monaco-diff-semantics.test.ts` | unit test | transform/range edge cases | `tests/unit/line-mapping.test.ts` | exact |
| `tests/integration/monaco-anchor.spec.ts` | browser integration test | event-driven/rendering | current Monaco anchor spec | exact |

**Explicitly preserve (normally no edit):** `src/web/components/DiffWorkspace.vue` (component; request-response/event-driven UI), `src/web/monaco/line-mapping.ts` (pure transform), and API/persistence/server files. Their stable hooks are test targets, not replacement implementations.

## Pattern Assignments

### `src/web/monaco/theme.ts` (provider/config, synchronous editor setup)

**Analog:** `src/web/monaco/configure.ts` (Monaco configuration helper; inspect its worker/language setup and export style).

**Required reusable symbols/contract:** export `DIFF_REVIEW_THEME_ID`, a typed `DIFF_REVIEW_THEME` satisfying `monaco.editor.IStandaloneThemeData`, and `applyDiffReviewTheme()` that calls `monaco.editor.defineTheme(DIFF_REVIEW_THEME_ID, DIFF_REVIEW_THEME)` followed immediately by `monaco.editor.setTheme(DIFF_REVIEW_THEME_ID)`. The helper is synchronous, deterministic, and safe to call for every adapter construction.

**Theme setup pattern (new file, modeled on existing Monaco helper imports):**
```ts
import * as monaco from 'monaco-editor';

export const DIFF_REVIEW_THEME_ID = 'diff-review-dark';
export const DIFF_REVIEW_THEME = { base: 'vs-dark', inherit: true, rules: [] /* typed rules/colors */ }
  satisfies monaco.editor.IStandaloneThemeData;

export function applyDiffReviewTheme(): void {
  monaco.editor.defineTheme(DIFF_REVIEW_THEME_ID, DIFF_REVIEW_THEME);
  monaco.editor.setTheme(DIFF_REVIEW_THEME_ID);
}
```

Do not parse CSS variables at runtime, create per-editor names, use a fallback theme, or register after editor construction. Theme values must byte-match Phase 05 root roles; `editor.selectionForeground` is required because regular `vs-dark` selected text does not reliably inherit it.

### `src/web/monaco/diff-semantics.ts` (utility, transform)

**Analog:** `src/web/monaco/line-mapping.ts`, especially `counterpartBoundary()` (lines 8-52): it accepts readonly public Monaco changes, handles `end < start` insertion/deletion ranges explicitly, clamps boundaries, and has no editor/DOM side effects.

**Reusable range rules/symbols:** keep a pure exported builder (e.g. `buildDiffDecorations`) accepting `readonly monaco.editor.ILineChange[]`, side, and model line count; return decoration descriptors for one continuous `linesDecorationsClassName` bar plus sparse `glyphMarginClassName` signs. Reject a side range when `end < start`; clamp to model line count; merge touching/overlapping ranges. For 1–3 lines emit one sign at start; for 4+ emit signs only at first and last. Original/base uses literal `−` (U+2212), modified/head uses `+`. Use Monaco ranges only for actual model lines; never synthesize a sign on an empty counterpart line.

**Source analogue for edge fixtures:** `tests/unit/line-mapping.test.ts:12-39` constructs insertion (`originalEndLineNumber: 3`, start 4) and deletion (`modifiedEndLineNumber: 1`, start 2) `ILineChange` objects. Reuse these exact boundary shapes in new semantic tests.

**Decoration ownership:** return stable class names for adapter-owned collections; do not inject `before`/`after` text. Signs must be CSS pseudo-content on already-enabled glyph margin; bars use existing `linesDecorationsClassName` lane, preserving geometry.

### `src/web/monaco/diff-adapter.ts` (adapter/service, event-driven lifecycle)

**Analog:** the existing `PublicMonacoDiffAdapter` is the exact analog and the only editor-construction boundary.

**Constructor pattern (lines 87-117):**
```ts
this.diffEditor = monaco.editor.createDiffEditor(host, {
  ariaLabel: 'Immutable base and head side-by-side diff',
  automaticLayout: false, glyphMargin: true, minimap: { enabled: false },
  occurrencesHighlight: 'off', originalEditable: false, readOnly: true,
  renderSideBySide: true, renderSideBySideInlineBreakpoint: 0,
  hideUnchangedRegions: HIDE_UNCHANGED_REGIONS,
});
this.originalEditor = this.diffEditor.getOriginalEditor();
this.modifiedEditor = this.diffEditor.getModifiedEditor();
```
Call `applyDiffReviewTheme()` on the line immediately before `createDiffEditor`; retain every existing option and ARIA label. Add only documented visual options required by the phase (`renderIndicators: false`) and independent collections for original/modified diff semantics, selection contrast, and anchor rails.

**Update/lifecycle pattern (lines 111-136 and `setFile()` lines 140+):** preserve `onDidUpdateDiff` ordering: increment `diffUpdates`, rebuild paired anchor layout, refresh affordance, then `onChange()`. Add an atomic `.set(build...)` refresh from `this.diffEditor.getLineChanges()` without changing that order or adding listeners per update. Keep `disposeModels()`/`removeZones()` behavior and clear each new collection on file switch/dispose.

**Critical existing ownership pattern (lines 378-387, 401-442):** `rebuildAnchoredLayout()` clears `originalDecorations` and `modifiedDecorations` when composer changes. New semantic, selection, and anchor collections MUST be separate; sharing them would erase signs/bars or selections when the composer is mounted/unmounted. Reuse `anchorDecoration`'s `.monaco-anchor-line` class (lines 432-442) for a 3px inset rail, not a new view zone.

**Selection/focus pattern:** subscribe once to each public editor's cursor-selection event; replace non-empty selection ranges in dedicated collections with `monaco-selection-contrast-foreground` and `inlineClassNameAffectsLetterSpacing: false`. Keep existing focus listeners, keyboard Alt+Enter actions, mouse affordance capture, scroll refresh, immutable models, paired zones, and diagnostics/listener bounds unchanged.

### `src/web/styles.css` (global styling, semantic transform)

**Analog:** `:root` semantic declarations at lines 1-78 and workspace/affordance block at lines 1043-1158.

Add only the five approved syntax roles to the existing single `:root` (`--syntax-keyword-foreground`, `--syntax-string-foreground`, `--syntax-number-foreground`, `--syntax-type-foreground`, `--syntax-invalid-foreground`) and map them byte-for-byte in the typed theme. Keep BEM hooks and existing geometry:
```css
.diff-workspace__gutter-action { position: absolute; z-index: 3; /* existing 32px action geometry */ }
.diff-workspace__editor { position: relative; z-index: 1; min-height: 0; }
```
Add only non-geometric Monaco hooks required where theme APIs end: `.selected-text` inset selection edge, `.diagonal-fill { background-image: none; }`, `.diff-hidden-lines .center` boundary, semantic sign/bar/anchor classes, and focused-pane perimeter via inset/non-layout outline. Use root variables, not raw component colors. Hover reveals the existing `.diff-workspace__gutter-action`; never add a row hover fill, padding, width, transition, or content injection.

### `scripts/verify-semantic-css.mjs` (verification utility, batch transform)

**Analog:** existing script's canonical token allowlist/value checks (lines 9-56, 193-211, 288-317 per research). Extend the existing expected root names/values with the five syntax roles and any narrowly permitted Monaco selectors. Preserve its one-root/raw-color confinement behavior and generated CSS inspection; do not create a second checker or weaken existing Phase 05 assertions.

### `src/web/prototypes/MonacoStabilityPrototype.vue` (browser fixture, event-driven UI)

**Analog:** itself and its deterministic `FILES` fixture (top of file), `createMonacoDiffAdapter()` mount in `onMounted`, `ResizeObserver`, `publishContract()`, navigation, comment actions, stress recompute, and `data-testid` status/metrics hooks. Extend fixtures with short/long contiguous changes, pure insertion/deletion, hidden unchanged region, selection/active-line/anchor overlap states. Do not move production review behavior into this fixture or replace `DiffWorkspace`.

### `tests/unit/monaco-theme.test.ts` (unit test, transform contract)

**Analog:** `tests/unit/line-mapping.test.ts:1-10` (`describe`/`expect`/`it` Vitest imports and focused deterministic assertions). Assert stable theme id, `base: 'vs-dark'`, typed required Monaco color roles, exact five syntax/root byte parity, and idempotent helper call order with mocked `defineTheme` then `setTheme`. Keep it dependency-free and focused; do not test browser geometry here.

### `tests/unit/monaco-diff-semantics.test.ts` (unit test, transform/range)

**Analog:** `tests/unit/line-mapping.test.ts:12-61`. Use explicit `ILineChange` fixtures for unchanged, insertion, deletion, one-to-three-line, four-plus-line, touching ranges, out-of-bounds/clamping, and empty-side filtering. Assert exact ranges/classes/sign glyph (`−`/`+`), no phantom empty-side marker, and deterministic replacement-friendly output. Test behavior, not source strings or private Monaco DOM.

### `tests/integration/monaco-anchor.spec.ts` (browser integration, event-driven rendering)

**Analog:** existing spec's `startPrototypeServer()`/`openPrototype()` harness and real Chromium assertions (`tests/integration/monaco-anchor.spec.ts:1-40`, current tests through ~194). Extend this same file and server fixture, retaining all current tests including exact immutable text, paired-zone alignment, A→B→A restoration, ten-recompute bounds (`listenerCount === 13` baseline must be updated only for intentionally added stable listeners), keyboard/pointer convergence, accessibility labels, and hidden-anchor reveal.

Add first-paint theme/computed-style assertions, syntax/diff/gutter/hunk/empty states, literal signs and continuous bars, selection + active line + anchor + focus overlap, and bounding-box/content-origin/sash/scroll/action/zone no-reflow assertions. Validate source-over composites rather than raw hex pairs; assert `.diagonal-fill` has `background-image: none`. Use existing Playwright config and focused integration command only; no project-wide tests.

## Shared Patterns

### One Monaco construction boundary
**Source:** `src/web/monaco/diff-adapter.ts:87-136`  
**Apply to:** theme integration and every visual decoration. `DiffWorkspace.vue` only owns lifecycle (`configureMonacoWorkers`, `ResizeObserver`, `adapter.dispose`) and must not gain a second editor or styling system.

### Immutable models and paired zones
**Source:** `diff-adapter.ts:setFile()`, `disposeModels()`, `rebuildAnchoredLayout()` lines 349-491; `DiffWorkspace.vue` mounted/unmounted hooks.  
**Apply to:** all new visual state. Never alter model text, line mapping, zone heights, counterpart calculations, or anchor focus handoff.

### Separate decoration collections
**Source:** adapter's existing `originalDecorations`/`modifiedDecorations` and cleanup.  
**Apply to:** diff bars/signs, selected-text contrast, and anchor rails. Atomically replace with `.set()`; clear on file detach/dispose; never share with composer collections.

### Existing semantic CSS root and affordance
**Source:** `src/web/styles.css:1-78,1043-1114`; `DiffWorkspace.vue:238-275`.  
**Apply to:** Monaco hooks and surrounding workspace. BASE/HEAD labels, absolute 32px action, exact `+` glyph/accessibility name, focus outlines, and host geometry remain authoritative.

### Focused browser proof
**Source:** `tests/integration/monaco-anchor.spec.ts` plus `tests/e2e/responsive-session.spec.ts` WCAG/source-over helper pattern.  
**Apply to:** overlap and contrast acceptance. Inspect real computed styles and geometry in Chromium; unit tests alone cannot prove Monaco compositing or no reflow.

## Incompatible Alternatives to Avoid

- Replacing Monaco or introducing another diff renderer/library/framework.
- Defining/selecting theme after `createDiffEditor`, per-editor/random theme ids, CSS-token extraction, network/fallback themes.
- A second CSS semantic-token root, raw-color component rules, or a new widget/view-zone comment system.
- A second diff algorithm, mutation of immutable model text, private Monaco services/DOM as behavior APIs.
- Injected `before`/`after` sign text (changes content/accessibility/geometry); use glyph-margin pseudo-content.
- One shared decoration collection (anchor rebuild clears it), repeated signs on every long-change row, phantom markers for `end < start` empty sides.
- Opaque hover/active/focus/anchor row fills that erase diff meaning; borders/padding/width changes that move code or gutters; visible diagonal hatch/gradient in empty counterparts.

## No Analog Found

None. Theme and semantic-decoration files are new, but their closest analogs are the existing Monaco configuration and pure line-mapping utility; all browser/unit coverage extends existing harnesses.

## Metadata

**Analog search scope:** `src/web/monaco`, `src/web/components`, `src/web/styles.css`, `src/web/prototypes`, `tests/unit`, `tests/integration`, `tests/e2e`, `scripts`.  
**Files scanned:** 10 focused source/test/config files plus phase artifacts.  
**Pattern extraction date:** 2026-07-27
