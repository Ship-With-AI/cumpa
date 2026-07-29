# Phase 08: Accessible Responsive Continuity - Pattern Map

**Mapped:** 2026-07-28  
**Files analyzed:** 5 likely modified files; 4 preserved supporting seams  
**Analogs found:** 5 / 5 modified files

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/web/App.vue` | Vue workspace composition/template | request-response UI state; event-driven child commands | Existing review context header at lines 814-855 | exact |
| `src/web/components/DiffWorkspace.vue` | Vue component/layout wrapper | streaming/editor presentation + event-driven comments | Existing component template and lifecycle at lines 1-273 | exact |
| `src/web/styles.css` | global presentation/configuration | transform/reflow; localized file/editor I/O viewport | Existing workspace rules lines 1056-1530, breakpoints 1896-2130, forced colors 2232-2305 | exact |
| `tests/integration/anchored-workspace.spec.ts` | integration/browser geometry test | request-response fixture + DOM geometry/scroll ownership | Existing `readMonacoGeometry` and phase viewport test lines 295-386, 1119-1161 | exact |
| `tests/e2e/responsive-session.spec.ts` | packaged Playwright accessibility/regression test | request-response packaged CLI + keyboard/media/emulation | Existing responsive contract test lines 620-1035 | exact |

Supporting seams that should remain unchanged (use as contracts, not new files): `src/web/components/ReviewToolbar.vue` (semantic toolbar groups, lines 1-92), `src/web/components/PathDisplay.vue` and `src/web/components/ui/PathText.vue` (complete path/rename semantics), and `src/web/monaco/diff-adapter.ts` (Monaco authority, lines 98-125 and public `layout` at 286-289).

## Pattern Assignments

### `src/web/App.vue` (Vue composition, request-response/event-driven)

**Analog:** Current review context header, `src/web/App.vue:814-855`.

**Template/data ownership pattern** (lines 815-855):
```vue
<header class="review-context-header">
  <div class="review-context-header__context">
    <div class="review-context-header__endpoint"> ...BASE... </div>
    <div class="review-context-header__file">
      <PathDisplay v-if="selectedFile !== undefined" :file="selectedFile" />
    </div>
    <div class="review-context-header__endpoint review-context-header__endpoint--head"> ...HEAD... </div>
  </div>
  <div class="review-context-header__toolbar">
    <ReviewToolbar
      :at-first-file="atFirstFile" :at-last-file="atLastFile"
      :has-active-file="selectedFile?.availability.kind === 'text'"
      :open-comment-count="openCommentCount"
      :resolved-comment-count="resolvedCommentCount"
      :review-expanded="commentsOpen"
      @previous-file="previousFile" @next-file="nextFile"
      @previous-change="previousChange" @next-change="nextChange"
      @comments="toggleComments" @keyboard-help="keyboardHelpOpen = true"
    />
  </div>
</header>
```

Phase action: reorder only the three existing context blocks to semantic source order **file, Base, Head** (do not use CSS `order` to repair reading order). Preserve all labels, bindings, event handlers, ARIA, and `PathDisplay`; CSS grid areas restore desktop Base | file | Head visually. The toolbar stays after context in source and retains `ReviewToolbar` as command authority. Do not add responsive refs, duplicate components, media listeners, API calls, or state.

**Workspace/drawer containment pattern** (`src/web/App.vue:800-903`): `.review-shell` contains `.review-files`, `.review-main`, and `.comments-rail`; drawer inertness, `aria-hidden`, close controls, and focus restoration are Vue behavior. Keep these mechanics unchanged while CSS changes the containing block from hard-coded header offsets to `.review-shell` relative positioning.

### `src/web/components/DiffWorkspace.vue` (Vue component, localized editor stream/event-driven)

**Analog:** Existing mounted Monaco host and comment view-zone lifecycle, `src/web/components/DiffWorkspace.vue:22-273`.

**Imports/lifecycle pattern** (lines 1-8, 230-270):
```ts
import { h, nextTick, onBeforeUnmount, onMounted, ref, render, watch } from 'vue';
import { createMonacoDiffAdapter, type AnchorAffordanceTarget, ... } from '../monaco/diff-adapter.js';

onMounted(() => {
  if (host.value === undefined) return;
  configureMonacoWorkers();
  adapter = createMonacoDiffAdapter(host.value, languageForPath, syncAdapterState);
  resizeObserver = new ResizeObserver(() => adapter?.layout());
  resizeObserver.observe(host.value);
  void loadContent();
});
onBeforeUnmount(() => {
  unmountZone();
  resizeObserver?.disconnect();
  adapter?.dispose();
});
```

**Current template seam** (lines 274-297):
```vue
<section class="diff-workspace" :aria-label="`${path}: base and head side-by-side diff`">
  <div class="diff-workspace__side-labels" aria-hidden="true">...</div>
  <button v-if="anchorAffordance" class="diff-workspace__gutter-action" ...>+</button>
  <div ref="host" class="diff-workspace__editor" />
  <p class="diff-workspace__context-help">Unchanged regions begin collapsed...</p>
</section>
```

Phase action: add only presentational `.diff-workspace__viewport` and `.diff-workspace__canvas` wrappers. Put side labels, existing gutter action, and Monaco host/editor in the canvas (one coordinate space; existing `host.offsetTop`/anchor positioning remains valid). Keep context-help outside the horizontal viewport/canvas so it wraps to fluid page width. Do not alter script, props, emits, adapter calls, ARIA, immutable models, view zones, or focus destinations.

### `src/web/styles.css` (global CSS, transform/reflow and localized scroll)

**Analog:** Existing centralized semantic stylesheet; relevant ranges `src/web/styles.css:1056-1530`, `:1896-2130`, `:2232-2305`. Reuse existing token and class vocabulary; no scoped styles or second theme root.

**Current workspace grid and overflow** (`1056-1103`, `1233-1242`):
```css
.review-shell {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-columns: 288px minmax(640px, 1fr) 360px;
  overflow: hidden;
}
.review-main { display: grid; min-width: 0; min-height: 0;
  grid-template-rows: auto minmax(0, 1fr); overflow: hidden; }
.diff-workspace { position: relative; display: grid; min-width: 640px;
  min-height: 0; grid-template-rows: 32px minmax(0, 1fr) auto; overflow: hidden; }
```

Transfer the 640px floor from `.review-shell`/`.review-main`/`.diff-workspace` to `.diff-workspace__canvas`; make `.review-shell`, `.review-main`, `.diff-workspace`, and viewport `width/max-width:100%; min-width:0`. The sole horizontal scroll owner is:
```css
.diff-workspace__viewport { min-width: 0; max-width: 100%; overflow-x: auto; overflow-y: hidden; }
.diff-workspace__canvas { position: relative; min-width: 640px; }
```
Preserve Monaco's own pane/vertical scroll ownership and side-by-side geometry.

**Header grid/wrapping pattern** (`1108-1190`, breakpoint additions):
```css
.review-context-header__context { display: grid; min-width: 0;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr);
  align-items: center; gap: var(--space-md); padding: var(--space-sm) var(--space-md); }
.review-context-header__endpoint { display: grid; min-width: 0; align-content: start; }
.review-context-header__endpoint--head { text-align: right; }
.review-context-header__file { display: grid; min-width: 0; grid-template-columns: minmax(0,1fr) auto; }
```
Assign `grid-area` (`file`, `base`, `head`) to the reordered blocks; at 1099px use `file file` then `base head`; at 767px use one-column `file`, `base`, `head`. Keep each toolbar `.review-toolbar__group` atomic (`flex: 0 0 auto; flex-wrap: nowrap`) while outer toolbar wraps groups in existing source order. Allow endpoint/path/name/OID content to wrap with `overflow-wrap:anywhere`; remove no-wrap ellipsis and fixed warning pseudo-content. Preserve PathText directory/filename emphasis and old→new stack semantics.

**Drawer containment pattern** (`1896-1970`):
```css
@media (max-width: 1439px) {
  .comments-rail { position: absolute; top: 64px; right: 0; bottom: 0; width: 360px; }
}
@media (max-width: 1099px) {
  .review-shell { display: block; overflow: auto; }
  .review-files { position: absolute; top: 64px; bottom: 0; left: 0; width: 288px; }
}
```
Make `.review-shell { position: relative; }`; remove `top:64px`, anchor drawers with `inset-block:0`/active edge, cap narrow widths at `min(288px, calc(100vw - 16px))` Files and `min(360px, calc(100vw - 16px))` Review (8px gutters), and leave drawer bodies as internal vertical scroll owners. Avoid `overflow-x:hidden` as proof; assert reachability and document width.

**Focus/contrast/forced-colors patterns:** Existing global focus is `src/web/styles.css:99-101` (`:focus-visible { outline:2px solid var(--focus-ring); outline-offset:2px; }`); Monaco pane inset fallback is `:2230-2230` (`.monaco-diff-pane--base:focus-within, ... { outline:2px solid var(--focus-ring); outline-offset:-2px; }`). Preserve these; add inset/negative-offset only at identified clipping boundaries and scroll padding where focus can land on a scrollport edge. Add one `--control-boundary` semantic token, then measure rendered source-over composites (normal text >=4.5:1, non-text indicators >=3:1) before promoting failing roles.

Extend the existing single `@media (forced-colors: active)` block (`2232-2305`) with targeted system colors, not `forced-color-adjust:none`: Canvas/CanvasText for surfaces/copy, ButtonFace/ButtonText/ButtonBorder controls, GrayText disabled, LinkText links, Highlight focus/selection/rails, and CanvasText durable signed bars/signs/anchors/status edges. Preserve literal `−`/`+` and dashed-vs-solid Base/Head distinction. Do not replace Monaco theme or simulate private Monaco DOM; Monaco automatic high-contrast remains authoritative.

### `tests/integration/anchored-workspace.spec.ts` (integration geometry, browser/DOM data flow)

**Analog:** `readMonacoGeometry` helper and no-reflow assertions at `:295-386`; existing phase viewport test at `:1119-1161`.

**Geometry helper pattern**:
```ts
const scrollDimensions = (element: HTMLElement) => ({
  clientHeight: element.clientHeight, clientWidth: element.clientWidth,
  scrollHeight: element.scrollHeight, scrollWidth: element.scrollWidth,
});
return {
  document: { clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth },
  reviewMain: reviewMain === null ? null : scrollDimensions(reviewMain),
  scrollOwners: [...document.querySelectorAll<HTMLElement>('.monaco-diff-editor .monaco-scrollable-element')]
    .map(scrollDimensions),
  // gutters, panes, sashes, zones, anchor action...
};
```

Replace obsolete `width:640` expectation at `:436-439` and expand boundary widths to `[1099, 768, 767, 640, 320]` (alongside desktop widths). Add `.diff-workspace__viewport`/canvas dimensions to the helper and assert conjunctively: document `scrollWidth <= clientWidth`; review main fits shell; viewport is the only horizontal overflow owner (`scrollWidth > clientWidth` when canvas reaches 640); canvas width >=640; Monaco panes/sashes/gutters/zones and line mapping remain unchanged. Keep existing anchor action and side-by-side no-reflow comparisons; do not mutate adapter behavior.

### `tests/e2e/responsive-session.spec.ts` (packaged Playwright, accessibility/media data flow)

**Analog:** Existing packed CLI harness and single real application contract test (`:1-220`, `:224-300`, `:470-523`, `:620-1035`). Reuse `runPrerequisite`, package extraction, `installPackagedSessionRoutes`, `readStyles`, `expectMinimumTarget`, and `assertNoPageOverflow`; do not create a second harness.

**Existing helper excerpts:**
```ts
async function assertNoPageOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
}
await page.emulateMedia({ forcedColors: 'active' });
await page.emulateMedia({ forcedColors: 'none' });
```

Extend the real-state matrix, not synthetic-only fixtures: boundary widths 1100/1099/768/767/640/320; assert semantic/source order, full path wrapping and renamed/copied stack, atomic toolbar pair rectangles, drawer exact 8px gutters and internal scroll, and no page overflow. Add local viewport/canvas scroll ownership and focus clipping geometry. Upgrade `contrastRatio` from opaque hex tokens to browser-rendered source-over RGBA compositing for selected/diff/comment/resolved/stale/recovery/export states; retain thresholds without rounding. Use keyboard journeys (Tab/commands/Escape and opener restoration), `toBeFocused`, and ancestor rectangle checks rather than relying only on `locator.focus()`.

Forced color extension follows current test:
```ts
await page.emulateMedia({ forcedColors: 'active' });
// assert computed system-color boundaries, signs/rails/anchors, focus, links,
// disabled-vs-enabled distinction, and forcedColorAdjust !== 'none'
await page.emulateMedia({ forcedColors: 'none' });
```
For grayscale, reuse packaged page and create Chromium CDP session (`Emulation.setEmulatedVisionDeficiency`, `achromatopsia` then `none`) to assert signs, patterns, labels, borders, and position—not hue alone. Keep reduced-motion coverage and existing workflow suites (`complete-review-draft.spec.ts`, `agent-ready-export.spec.ts`) unchanged as continuity contracts.

## Shared Patterns

### Semantic ordering and no duplicate UI
**Sources:** `App.vue:815-855`, `ReviewToolbar.vue:1-92`, `PathDisplay.vue:1-37`  
**Apply to:** header/template and all responsive tests. Reorder source DOM file → Base → Head; preserve existing toolbar groups and path text. CSS-only presentation changes; no runtime mobile mode, duplicate controls, or altered event/persistence/API paths.

### Localized Monaco scroll ownership
**Sources:** `DiffWorkspace.vue:230-270`, `diff-adapter.ts:98-125,286-289`, `styles.css:1233-1507`  
**Apply to:** wrapper CSS and geometry tests. New viewport owns horizontal overflow; canvas holds 640px comparison surface; Monaco continues immutable side-by-side rendering, public original/modified editors, line mapping, anchors, view zones, and pane vertical scrolling. `ResizeObserver` calls existing adapter `layout()`.

### Focus and durable non-color cues
**Sources:** `styles.css:99-101,2232-2305`, `diff-adapter.ts:98-125`, existing e2e focus steps `responsive-session.spec.ts:674-715`  
**Apply to:** CSS and e2e. Keep 2px global ring and Monaco inset fallback; use signs, borders, dashed/solid bars, text labels, and position in grayscale/forced colors. Map system colors selectively; never blanket opt out of forced colors.

### Rendered contrast verification
**Sources:** `responsive-session.spec.ts:224-264,620-645`; research WCAG thresholds  
**Apply to:** e2e helper and real state steps. Measure actual computed/rendered RGBA after source-over alpha layers, not raw root tokens or opaque-only pairs; fail normal text below 4.5:1 and meaningful non-text below 3:1.

### Existing workflow continuity
**Sources:** `App.vue:800-903`, `tests/e2e/complete-review-draft.spec.ts`, `tests/e2e/agent-ready-export.spec.ts`  
**Apply to:** all plans/tests. Keep file/change navigation, comments, summary, persistence, recovery, and export mechanics untouched; phase tests only prove reachability/operability in new presentation contexts.

## No Analog Found

None for the five likely modified files. The following new concepts have no pre-existing exact implementation and must use the research contract while copying surrounding CSS/test conventions:

| Concept | Role/Data Flow | Reason |
|---|---|---|
| `.diff-workspace__viewport` and `.diff-workspace__canvas` | presentation boundary / localized horizontal scroll | New wrapper seam required to move 640px floor without changing Monaco. |
| Rendered source-over contrast helper | test utility / transform | Existing `contrastRatio` only parses opaque hex tokens; no composited RGBA helper exists. |
| Full Phase 08 forced-color mappings for Monaco signs/anchors/comment states | global CSS / presentation | Existing block covers generic shells/controls/tree selection, not all app-owned semantic overlays. |

## Metadata

**Analog search scope:** `src/web/App.vue`, `src/web/components`, `src/web/monaco`, `src/web/styles.css`, `tests/integration`, `tests/e2e`  
**Files scanned:** 9 primary files/ranges plus supporting symbol references  
**Pattern extraction date:** 2026-07-28
