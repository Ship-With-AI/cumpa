# Architecture Research

**Domain:** Existing Vue 3 / Monaco local diff-review workspace, GitHub dark-default visual adaptation
**Researched:** 2026-07-24
**Confidence:** HIGH for repository integration points; MEDIUM for external design guidance

## Standard Architecture

### System Overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│                 One canonical dark presentation contract            │
│                                                                      │
│  src/web/styles.css :root                                            │
│  semantic surfaces · text · borders · controls · states · diff      │
└───────────────────────┬──────────────────────────────┬───────────────┘
                        │ CSS var()                    │ computed token
                        │                              │ values, once
┌───────────────────────▼──────────────────────┐  ┌────▼────────────────┐
│ Vue / HTML presentation                     │  │ Monaco presentation  │
│                                             │  │                     │
│ App shell and responsive drawers            │  │ NEW monaco/theme.ts │
│ File header, file tree, toolbar, notices     │  │ defineTheme()       │
│ Review rail and inline comment DOM           │  │                     │
│ Custom Monaco-adjacent overlays in CSS       │  │ diff-adapter.ts     │
└───────────────────────┬──────────────────────┘  │ createDiffEditor()  │
                        │                         └──────────┬───────────┘
                        └────────────────────┬───────────────┘
                                             │ presentation only
┌────────────────────────────────────────────▼─────────────────────────┐
│ Existing review behavior remains authoritative                      │
│ App.vue events → workspace-state / review-draft-state → API client   │
│ No server, persistence, contract, anchor, export, or review changes  │
└──────────────────────────────────────────────────────────────────────┘
```

The milestone should remain a presentation-layer cutover. `src/web/styles.css` is the single production stylesheet and should become the only source of raw palette values. Monaco needs a JavaScript theme object, but that object should consume the CSS semantic tokens rather than introduce a second palette. Vue components continue to emit the same events and render the same accessible state text; the Monaco adapter continues to own models, view state, line mapping, zones, and editor lifecycle.

### Component Responsibilities

| Component | Responsibility | Typical Implementation for v1.1 |
|-----------|----------------|----------------------------------|
| `src/web/styles.css` | Canonical semantic token values; all production DOM/component CSS; interaction, forced-color, reduced-motion, and responsive rules | Consolidate the two current `:root` vocabularies into one dark-only token contract, then migrate existing selectors without aliases |
| `src/web/App.vue` | Workspace composition and responsive drawer control | Preserve `filesOpen`, `commentsOpen`, `handleViewportChange()`, focus return, `inert`, and `aria-hidden`; its existing classes remain style hooks |
| `src/web/components/DiffWorkspace.vue` | Vue-to-Monaco mount boundary; custom gutter action and comment-zone rendering | Register the theme before adapter creation; optionally add one internal scroll viewport that keeps side labels, gutter affordance, and editor in the same positioned coordinate space |
| `src/web/monaco/theme.ts` **(new)** | Translate canonical CSS tokens into Monaco theme color IDs | Idempotent `registerDiffReviewMonacoTheme()` plus exported theme name; no editor models or behavior |
| `src/web/monaco/diff-adapter.ts` | Monaco editor lifecycle and review-specific editor behavior | Keep `PublicMonacoDiffAdapter`; add the registered theme name to `createDiffEditor()` options only |
| `src/web/monaco/configure.ts` | Worker routing and path-to-language metadata | Leave worker and language responsibilities unchanged; do not turn this into a general visual-style module |
| `FileTree.vue`, `DirectoryRow.vue`, `FileRow.vue`, `StatusBadge.vue` | Changed-file navigation markup and existing non-color file/status cues | Restyle existing `.file-tree-*`, `.tree-row*`, `.status-badge*`, `.line-counts*`, and availability hooks in global CSS |
| `ReviewToolbar.vue`, `components/ui/UiPrimitives.vue` | Navigation controls, counts, expanded state, and tooltip behavior | Restyle `.ui-button`, `.review-toolbar*`, `.ui-tooltip*`; use existing `disabled` and `aria-expanded` attributes as state selectors |
| `ReviewPanel.vue`, `CommentComposer.vue` | Review rail, comment cards, comment lifecycle controls, and inline composer markup | Restyle existing `.review-panel*`, `.comments-rail*`, `.inline-comment-composer*`, and `.inline-accepted-comment`; no event or lifecycle changes |
| `InlineNotice.vue`, existing notice users, state cards | Warning, error, conflict, unavailable, recovery, and export status presentation | Keep explicit headings/text and ARIA roles; use semantic state tokens for background, border, icon/accent, and readable text |

## Current Styling Ownership

The current production styling path is unusually clear and should be preserved rather than replaced:

- `src/web/App.vue:912` imports `./styles.css`; `src/web/main.ts` only mounts `App`. There is no component-library theme provider and no second production CSS entrypoint.
- Production Vue components expose global BEM-like class hooks and contain no scoped styles. The only scoped `<style>` is in `src/web/prototypes/MonacoStabilityPrototype.vue`; that prototype is not an integration point and must not become a palette source.
- `src/web/styles.css:1` already begins with a GitHub-dark-like `--color-*` palette, but `src/web/styles.css:970` introduces a second light Phase 2 vocabulary (`--canvas`, `--panel`, `--surface`, `--text`, `--rule`, state colors) and maps the first vocabulary onto it. Because the later `:root` wins, the production workbench is effectively owned by the light override block. Adding a third dark override would perpetuate the exact parallel convention this milestone should remove.
- `App.vue` owns responsive control state. `handleViewportChange()` is synchronized to CSS breakpoints through `matchMedia('(max-width: 1099px)')` for the files drawer and `matchMedia('(max-width: 1439px)')` for the comments rail. CSS owns placement and animation; Vue owns visibility, focus, `inert`, Escape handling, and return focus.
- `DiffWorkspace.vue:onMounted()` calls `configureMonacoWorkers()` and then `createMonacoDiffAdapter()`. `PublicMonacoDiffAdapter` calls `monaco.editor.createDiffEditor()` with no `theme`, so Monaco currently uses its default presentation independently of the surrounding UI.
- `diff-adapter.ts` creates `.monaco-anchor-line`, `.monaco-anchor-zone--composer`, and `.monaco-anchor-zone--spacer`; `DiffWorkspace.vue` creates the custom `+` gutter button, `.inline-comment-composer`, and `.inline-accepted-comment`. These are application DOM/decorations around or inside Monaco, not Monaco theme color IDs.

## Recommended Project Structure

```text
src/web/
├── App.vue                              # EXISTING: composition + drawer control
├── main.ts                              # UNCHANGED: Vue mount only
├── styles.css                           # MODIFY: one token root + all DOM CSS
├── components/
│   ├── DiffWorkspace.vue                # MODIFY: theme registration + narrow scroll boundary
│   ├── ReviewToolbar.vue                # EXISTING CSS consumer; behavior unchanged
│   ├── ReviewPanel.vue                  # EXISTING CSS consumer; behavior unchanged
│   ├── CommentComposer.vue              # EXISTING CSS consumer; behavior unchanged
│   ├── FileTree.vue                     # EXISTING CSS consumer; behavior unchanged
│   ├── FileRow.vue / DirectoryRow.vue   # EXISTING CSS consumers; behavior unchanged
│   ├── StatusBadge.vue                  # EXISTING text/border status cue
│   └── InlineNotice.vue                 # EXISTING state semantics
└── monaco/
    ├── configure.ts                     # UNCHANGED: workers + language metadata
    ├── theme.ts                         # NEW: CSS tokens → Monaco theme registration
    ├── diff-adapter.ts                  # MODIFY: explicit theme at editor creation
    └── line-mapping.ts                  # UNCHANGED
```

### Modified Versus New Artifacts

| Status | File / component | Change |
|--------|------------------|--------|
| **New** | `src/web/monaco/theme.ts` | Register one `vs-dark`-based Monaco theme from canonical CSS semantic tokens and export its stable name |
| **Modified** | `src/web/styles.css` | Replace both color vocabularies and the Phase 2 override strategy with one dark semantic token root; restyle existing hooks; add state, custom Monaco decoration, forced-color, and responsive rules |
| **Modified** | `src/web/components/DiffWorkspace.vue` | Call theme registration before adapter construction; if isolating horizontal overflow, add one presentational viewport wrapper while keeping host/button geometry together |
| **Modified** | `src/web/monaco/diff-adapter.ts` | Set `theme` in `createDiffEditor()`; keep `ariaLabel`, read-only mode, side-by-side mode, hidden regions, actions, models, zones, and mapping unchanged |
| **Visually affected, no source change expected** | `App.vue`, `IdentityHeader.vue`, `IdentityPanel.vue`, `FileTree.vue`, `FileRow.vue`, `DirectoryRow.vue`, `StatusBadge.vue`, `ReviewToolbar.vue`, `ReviewPanel.vue`, `CommentComposer.vue`, `KeyboardHelp.vue`, notices and export/recovery panels | Existing global class hooks and semantic HTML are sufficient for the requested restyle |
| **Explicitly unchanged** | `workspace-state.ts`, `review-draft-state.ts`, API client, contracts, server, persistence, export, Git code | The milestone adds no review mechanics or data contract |

### Structure Rationale

- **Keep tokens in `styles.css`:** it is already the sole production stylesheet. A new token CSS file or component-scoped palette would add ordering and ownership ambiguity without benefit at this scale.
- **Add only `monaco/theme.ts`:** Monaco's public theming boundary is JavaScript (`defineTheme` and the editor `theme` option), so a small adapter is justified. Worker setup and theme translation are separate reasons to change and should remain separate modules.
- **Do not add Vue theme state:** dark-only scope means there is no user-selectable mode, persistence, provider, or reactive theme controller to justify.
- **Do not add new visual Vue components:** existing components already expose useful semantic markup, ARIA state, and stable class hooks. v1.1 changes their presentation, not their composition or domain behavior.

## Architectural Patterns

### Pattern 1: One Semantic Token Vocabulary

**What:** Replace both current token families with one role-based contract. Raw colors appear only in the first `:root` block. Every later selector uses semantic tokens.

Recommended groups:

| Group | Concrete token examples | Consumers |
|-------|-------------------------|-----------|
| Surfaces | `--surface-canvas`, `--surface-panel`, `--surface-raised`, `--surface-overlay` | body, review shell, file header, drawers, cards, tooltips |
| Text | `--text-primary`, `--text-muted`, `--text-on-emphasis`, `--text-link` | headings, metadata, buttons, badges, notices |
| Borders/shadows | `--border-default`, `--border-muted`, `--border-emphasis`, `--shadow-overlay` | file separators, cards, drawers, keyboard help |
| Controls | `--control-bg`, `--control-hover-bg`, `--control-active-bg`, `--control-disabled-fg`, `--control-primary-bg`, `--control-danger-fg` | `.ui-button*`, disclosure buttons, gutter action |
| Focus/selection | `--focus-outline`, `--selection-bg`, `--selection-border` | global `:focus-visible`, selected tree rows, active review button, Monaco mapping |
| Semantic states | `--state-info-*`, `--state-attention-*`, `--state-danger-*`, `--state-success-*` | notices, conflicts, recovery, export progress, status badges |
| Diff | `--diff-addition-line-bg`, `--diff-addition-word-bg`, `--diff-addition-gutter-bg`, corresponding deletion tokens | Monaco theme plus any app-owned diff legends/cues |
| Geometry | existing `--space-*` plus, if useful, `--radius-sm/md` | all DOM components; values are not theme mode state |

Primer's current guidance distinguishes raw/base values from functional and component tokens, directs product code toward functional semantic roles, and notes that semantic tokens are what adapt across color modes. Diff Review is dark-only, but the same semantic ownership prevents palette values from leaking into components [Primer color usage](https://primer.style/product/getting-started/foundations/color-usage/).

**When to use:** Every production selector and every Monaco color mapping.

**Trade-offs:** This is a deliberate one-time rename across a large stylesheet. It is safer than retaining aliases because aliases leave two naming systems for future maintainers and make it unclear which token is authoritative.

**Example:**

```css
:root {
  /* Raw GitHub-dark-inspired values exist only here. */
  --surface-canvas: #0d1117;
  --surface-panel: #161b22;
  --text-primary: #e6edf3;
  --border-default: #30363d;
  --focus-outline: #58a6ff;
  --diff-addition-line-bg: #12261e;
  --diff-addition-word-bg: #1f6f3a66;
}

.review-toolbar {
  border-bottom: 1px solid var(--border-default);
  background: var(--surface-panel);
}
```

The specific values should be validated as a complete palette rather than copied piecemeal from GitHub. “Close adaptation” means role and hierarchy fidelity, not importing Primer or pretending Diff Review is a GitHub page.

### Pattern 2: Monaco Theme as a Presentation Adapter

**What:** Register a custom theme after CSS is available but before `createDiffEditor()`. Read required semantic CSS variables once, fail explicitly if a token is missing, define a `vs-dark`-based theme, and pass its name in the editor construction options.

```typescript
// src/web/monaco/theme.ts
import * as monaco from 'monaco-editor';

export const DIFF_REVIEW_MONACO_THEME = 'diff-review-github-dark';

export function registerDiffReviewMonacoTheme(root = document.documentElement): void {
  const css = getComputedStyle(root);
  const token = (name: string): string => {
    const value = css.getPropertyValue(name).trim();
    if (value === '') throw new Error(`Missing theme token: ${name}`);
    return value;
  };

  monaco.editor.defineTheme(DIFF_REVIEW_MONACO_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': token('--surface-canvas'),
      'editor.foreground': token('--text-primary'),
      'editor.selectionBackground': token('--selection-bg'),
      'focusBorder': token('--focus-outline'),
      'diffEditor.insertedLineBackground': token('--diff-addition-line-bg'),
      'diffEditor.insertedTextBackground': token('--diff-addition-word-bg'),
      'diffEditorGutter.insertedLineBackground': token('--diff-addition-gutter-bg'),
      'diffEditor.removedLineBackground': token('--diff-deletion-line-bg'),
      'diffEditor.removedTextBackground': token('--diff-deletion-word-bg'),
      'diffEditorGutter.removedLineBackground': token('--diff-deletion-gutter-bg'),
    },
  });
}
```

The installed Monaco 0.55.1 contract exposes `defineTheme()`, `setTheme()`, a construction-time `theme` option, and `IStandaloneThemeData`. Its own color registry says inserted/removed text and line backgrounds must be non-opaque so underlying decorations remain visible, and provides distinct gutter, text-border, selection, focus, and unchanged-region keys [Monaco published type definitions](https://unpkg.com/monaco-editor@0.55.1/monaco.d.ts) and [Monaco editor color registry](https://github.com/microsoft/vscode/blob/main/src/vs/platform/theme/common/colors/editorColors.ts).

**When to use:** Only for Monaco-owned internals: editor background/foreground, syntax tokens, line numbers, cursor/selection, diff lines/words/gutters, unchanged regions, widgets, and focus colors.

**Trade-offs:** `getComputedStyle()` produces a registration-time snapshot, not live CSS-variable binding. That is correct for dark-only scope. A future runtime theme switch would require an explicit re-registration/controller and is intentionally out of scope.

Keep Monaco's default `autoDetectHighContrast` behavior. An operating-system high-contrast override is an accessibility accommodation, not a product light-mode feature.

### Pattern 3: DOM CSS Owns Application Overlays

**What:** Keep styling for the file strip, toolbar, file tree, drawers, comment cards, custom `+` gutter action, `.monaco-anchor-line`, and view-zone content in `styles.css`. These elements are application DOM or adapter-created decorations, not Monaco theme IDs.

**When to use:** Any class named by Vue templates or created explicitly in `diff-adapter.ts`.

**Trade-offs:** A few selectors live inside Monaco's DOM subtree, but they target application-owned class names only. Never target generated Monaco class structure such as `.margin-view-overlays > div`; that structure is not the app's contract.

The selected anchor should combine a translucent background with a border/outline or gutter marker. `.monaco-anchor-line` already exists as a stable decoration class, so no new selection state is needed.

### Pattern 4: Attribute-Driven Accessible States

**What:** Style native and ARIA states already present in markup instead of adding presentation state to Vue. Examples include `.ui-button:disabled`, `.ui-button[aria-expanded='true']`, `.tree-row[aria-selected='true']`, `:focus-visible`, and existing notice tone classes.

**When to use:** Hover, active, selected, expanded, disabled, pending, resolved, warning, and error presentation.

**Trade-offs:** CSS selectors depend on semantic attributes being preserved—which is desirable because visual and assistive-technology state then share one source of truth.

| State | Color role | Required non-color cue already available or to preserve |
|-------|------------|---------------------------------------------------------|
| Addition/deletion | Separate diff line, word, and gutter fills | Monaco line/gutter structure; `+`/`−` counts and `A`/`D` status badge text in file tree |
| Selected file | Accent-muted surface | `aria-selected='true'`, inset marker/border, and stronger label weight |
| Selected comment line | Selection/anchor surface | `.monaco-anchor-line` border or gutter marker plus the labeled `+` button |
| Saved comment | Accent/success border | “Saved locally” badge, path/side/line heading, and comment body |
| Warning/error/conflict | Attention/danger muted surface | Explicit heading and explanatory text, 3–4px border, and existing `role='alert'`/`status` where appropriate |
| Focus | Focus outline | A visible two-pixel outline with offset; never hover color alone |
| Disabled/pending | Muted control colors | Native `disabled`, unavailable cursor, stable label or pending text; never opacity alone |
| Resolved | Muted hierarchy | Separate “Resolved comments” section, count, disclosure label, and Reopen action |

WCAG 2.2 requires a visible alternative when color conveys meaning [SC 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html), 4.5:1 contrast for normal text [SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), and 3:1 for meaningful control/state visuals [SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). A two-pixel outline is also the simplest robust implementation of the stronger WCAG 2.2 focus-appearance guidance [SC 2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html).

### Pattern 5: Synchronized CSS and Control Breakpoints

**What:** Preserve the current breakpoint contract and change layout, not review behavior.

| Width | CSS presentation | Existing Vue control contract |
|-------|------------------|-------------------------------|
| `>= 1440px` | Files / diff / review rail in three columns | `commentsOpen` initially true; no comments drawer |
| `1100–1439px` | Files + diff; comments rail overlays from right | `isCommentsDrawer` from the `1439px` media query; focus and Escape remain in `App.vue` |
| `768–1099px` | Diff primary; both files and comments use drawers | `isFilesDrawer` from the `1099px` query; existing `inert`, `aria-hidden`, open/close, and return-focus behavior |
| `320–767px` | Toolbar and non-diff prose reflow; drawers fit viewport; side-by-side diff alone gets bounded horizontal overflow | Same drawer state; do not switch Monaco to inline diff or remove actions |

For the narrow layout, isolate two-dimensional scrolling to the side-by-side diff region. A safe `DiffWorkspace.vue` wrapper places side labels, gutter affordance, and editor host inside one `position: relative; min-width: 640px` viewport, while the outer `.diff-workspace` and context-help prose fit the available width. Keep the button in the same positioned wrapper as the host so `host.offsetTop`-based affordance geometry in `PublicMonacoDiffAdapter.getAnchorAffordanceAt()` and `captureAffordance()` remains valid.

WCAG reflow guidance explicitly uses a two-column code/document diff as an example where a horizontally scrollable comparison is appropriate, while surrounding non-excepted prose and controls still need to reflow [SC 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html). The current mobile rule `.review-main { width: 640px; }` expands the entire main surface; narrowing that exception to the diff viewport is the key responsive architectural improvement.

## Data Flow

### Theme Initialization Flow

```text
Vite loads App.vue
    ↓
App.vue loads styles.css
    ↓
Browser resolves one dark :root token set
    ↓
DiffWorkspace.vue onMounted()
    ├── configureMonacoWorkers()                existing
    ├── registerDiffReviewMonacoTheme()         new, idempotent
    └── createMonacoDiffAdapter()               existing
            ↓
PublicMonacoDiffAdapter.createDiffEditor({
  theme: DIFF_REVIEW_MONACO_THEME,              new presentation option
  readOnly: true,
  renderSideBySide: true,
  hideUnchangedRegions: ...
})
```

Registration must occur before editor construction so the first rendered frame uses the correct theme. Do not call `setTheme()` from arbitrary components or watchers. There is one dark theme and one editor presentation boundary.

### Existing Review Flow (Unchanged)

```text
User selects file / line / comment action
    ↓
App.vue or DiffWorkspace.vue emits existing event
    ↓
workspace-state.ts / review-draft-state.ts
    ↓
existing API client and accepted canonical response
    ↓
props update existing Vue components and Monaco zones/decorations
```

No semantic token, CSS class, Monaco color, or responsive rule becomes domain state. Theme initialization must not touch file content, anchors, comment settlement, canonical draft revisions, or export state.

### Responsive Control Flow (Unchanged)

```text
CSS breakpoint changes layout
    ↕ exact same numeric thresholds
App.vue matchMedia listeners
    ↓
handleViewportChange()
    ├── updates isFilesDrawer / isCommentsDrawer
    ├── closes files drawer when it ceases to be a drawer
    ├── dispatches existing workspace resize
    └── calls DiffWorkspace.layout()
```

Because CSS custom properties cannot drive `matchMedia()` thresholds, the two numeric breakpoints remain duplicated by necessity. Keep them documented together in `styles.css` and `App.vue`; changing one without the other is a control-flow bug, not a visual tweak.

## Scaling Considerations

This remains a single-user, local application; network/user scaling is irrelevant to v1.1. The meaningful scale is presentation complexity.

| Scale | Architecture Adjustment |
|-------|-------------------------|
| Current v1.1 scope | One token root, one global production stylesheet, one Monaco theme adapter |
| More components, same dark mode | Keep token names stable; group/reorder `styles.css` by tokens → base → primitives → workspace → diff overlays → review states → responsive/accessibility. Split files only if navigation cost becomes material, with one explicit import entry and unchanged token ownership |
| Future runtime themes | Add a deliberate theme controller that sets root mode and re-registers Monaco. Do not prebuild it in v1.1 |

### Scaling Priorities

1. **First failure mode:** token drift between the surrounding UI and Monaco. Prevent it by reading Monaco colors from canonical CSS tokens and rejecting missing tokens.
2. **Second failure mode:** responsive CSS diverging from `App.vue` drawer state. Prevent it by treating `1099px` and `1439px` as shared control contracts.

## Anti-Patterns

### Anti-Pattern 1: A Third Override Palette

**What people do:** Append a new `:root` block after the Phase 2 light override and remap old variables again.

**Why it's wrong:** Cascade order, not semantic ownership, decides the theme; components continue using two vocabularies; later maintenance cannot know which token is canonical.

**Do this instead:** Replace both color roots with one semantic dark root and migrate every consumer in the same cutover. Delete obsolete variables rather than aliasing them.

### Anti-Pattern 2: Duplicate Raw Colors in TypeScript

**What people do:** Copy the dark hex palette into `monaco/theme.ts` while keeping another copy in CSS.

**Why it's wrong:** Monaco and the shell will drift, particularly for selection, diff opacity, border, and focus colors.

**Do this instead:** Resolve required CSS tokens once during theme registration and feed those values to Monaco.

### Anti-Pattern 3: Styling Monaco's Private DOM

**What people do:** Recreate GitHub gutters by targeting generated `.monaco-*` descendant structure.

**Why it's wrong:** Monaco upgrades can change internal markup, and CSS can conflict with its layout/accessibility modes.

**Do this instead:** Use documented theme color IDs for Monaco-owned visuals. Use CSS only for app-owned classes (`.monaco-anchor-line`, `.monaco-anchor-zone*`, `.diff-workspace__gutter-action`).

### Anti-Pattern 4: Responsive Behavior Rewrite

**What people do:** Replace side-by-side mode with inline mode, introduce a new mobile navigation state, or let CSS hide drawers without updating Vue state.

**Why it's wrong:** It changes validated review mechanics, keyboard flow, and information architecture.

**Do this instead:** Preserve `renderSideBySide: true`, the current App events, drawer controls, and focus restoration. Bound overflow to the diff region and reflow surrounding controls.

### Anti-Pattern 5: Color-Only Git Semantics

**What people do:** Depend on green/red backgrounds alone to distinguish additions, deletions, errors, selected rows, or resolved comments.

**Why it's wrong:** It fails the active accessibility requirement and can become ambiguous in forced colors.

**Do this instead:** Preserve existing letters, signs, headings, labels, borders, ARIA states, and section placement; treat color as reinforcement.

## Integration Points

### External Libraries and Platform Features

| Service / feature | Integration pattern | Notes |
|-------------------|---------------------|-------|
| Monaco Editor 0.55.1 | `defineTheme()` before `createDiffEditor({ theme })` | Use documented color IDs; retain `vs-dark` inheritance and automatic high-contrast detection |
| Browser CSS custom properties | One `:root` dark token set; `getComputedStyle()` bridge for Monaco | No runtime mode switch; required tokens should fail explicitly if absent |
| CSS media queries | Existing `1439px`, `1099px`, and `767px` rules plus `prefers-reduced-motion` | Keep JS media queries synchronized at control breakpoints |
| Forced-colors mode | Small final `@media (forced-colors: active)` block | Restore visible borders/outlines with system colors; do not create an app light theme |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `styles.css` ↔ Vue components | Existing class names, attributes, and CSS variables | No prop or store for color |
| `styles.css` ↔ `monaco/theme.ts` | Required CSS token names read once | CSS owns raw values; TypeScript owns Monaco color-ID mapping |
| `DiffWorkspace.vue` ↔ `monaco/theme.ts` | Direct initialization call | Must happen before adapter creation |
| `DiffWorkspace.vue` ↔ `diff-adapter.ts` | Existing adapter interface | Theme is construction presentation; review actions and zones unchanged |
| `App.vue` ↔ responsive CSS | Matched numeric media thresholds | Vue controls accessibility state; CSS controls geometry |
| Monaco internals ↔ app overlays | Documented theme IDs vs app-owned class names | Do not cross the ownership boundary |

## Dependency-Aware Build Order

1. **Canonicalize tokens first.** In `styles.css`, define the complete semantic dark palette, spacing/radius/shadow roles, and delete the Phase 2 light token root plus old aliases. Migrate base/body/focus styles before component sections so every subsequent rule has a stable contract.
2. **Restyle shared primitives and states.** Update `.ui-button*`, text inputs/textareas, tooltips, status badges, state cards, `.inline-notice*`, focus, disabled, hover, active, and forced-color behavior. Higher-level components depend on these primitives.
3. **Create the Monaco theme adapter.** Add `monaco/theme.ts` after token names are final. Map editor, selection, diff line/word/gutter, unchanged-region, border, widget, and focus IDs to those tokens; keep transparent diff colors non-opaque.
4. **Wire Monaco initialization.** In `DiffWorkspace.vue`, register the theme after styles resolve and before adapter construction. In `diff-adapter.ts`, pass the stable theme name. Do not change any other editor option or adapter behavior in this step.
5. **Style diff-specific application DOM.** Use the same tokens for side labels, custom gutter action, `.monaco-anchor-line`, view zones, inline saved comments, and `CommentComposer`. This step can now visually align with the actual Monaco theme rather than approximating it.
6. **Restyle the workspace hierarchy.** Apply surface, border, typography, spacing, and interaction tokens to the active-file strip, toolbar, file tree/rows, identity header/panel, comments rail, review cards, notices, recovery, and export sections. Existing templates should remain intact.
7. **Apply accessibility state polish.** Audit every selected, expanded, disabled, pending, resolved, warning, error, and focus state against the state matrix. Add CSS selectors or app-owned decoration styles, not new domain state.
8. **Finish responsive rules last.** Once final control and panel dimensions are known, preserve the `1439px` and `1099px` drawer contract, reflow toolbar and rail content at `767px`, and isolate horizontal overflow to the side-by-side diff viewport. If the internal wrapper is added, keep gutter button and editor host in the same positioned box to preserve adapter geometry.
9. **Remove superseded rules as part of the same cutover.** Do not leave the “Phase 2 review workbench” override block, shadow literals, legacy color variables, or duplicate media rules behind. The final stylesheet should read in ownership order rather than milestone chronology.

This order makes the token contract a dependency of both styling systems, makes Monaco and shared primitives available before large surfaces are tuned, and defers responsive decisions until the final component geometry is stable. At no point does it require a temporary second theme, behavior shim, or review-state migration.

## Sources

- [Diff Review `PROJECT.md`](../PROJECT.md) — authoritative v1.1 scope, validated behavior, constraints, and out-of-scope mechanics.
- [`src/web/styles.css`](../../src/web/styles.css) — current dual-token roots, global production styles, state selectors, and responsive breakpoints.
- [`src/web/App.vue`](../../src/web/App.vue) — sole stylesheet import, workspace composition, drawer state, focus behavior, and `matchMedia` control flow.
- [`src/web/components/DiffWorkspace.vue`](../../src/web/components/DiffWorkspace.vue) — Monaco mount lifecycle, custom gutter action, inline zones, and adapter boundary.
- [`src/web/monaco/diff-adapter.ts`](../../src/web/monaco/diff-adapter.ts) — `PublicMonacoDiffAdapter`, editor options, line decoration, zones, and affordance geometry.
- [`src/web/monaco/configure.ts`](../../src/web/monaco/configure.ts) — existing worker and language configuration ownership.
- [Primer color usage](https://primer.style/product/getting-started/foundations/color-usage/) — functional semantic tokens, color roles, and dark-mode-aware token guidance.
- [Primer color token reference](https://primer.style/product/primitives/color/) — current foreground, background, border, and semantic token families.
- [Monaco Editor 0.55.1 type definitions](https://unpkg.com/monaco-editor@0.55.1/monaco.d.ts) — `defineTheme`, `setTheme`, `IStandaloneThemeData`, `theme`, and high-contrast options.
- [VS Code/Monaco editor color registry](https://github.com/microsoft/vscode/blob/main/src/vs/platform/theme/common/colors/editorColors.ts) — registered selection and diff editor color IDs and transparency requirements.
- [WCAG 2.2: Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) — visible alternatives to color-coded information.
- [WCAG 2.2: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) — text contrast requirements.
- [WCAG 2.2: Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) — control and state visual contrast.
- [WCAG 2.2: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) — narrow layout guidance and explicit side-by-side code diff example.
- [WCAG 2.2: Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) — robust focus indicator size and contrast guidance.

---
*Architecture research for: Diff Review v1.1 GitHub Dark Diff*
*Researched: 2026-07-24*
