# Stack Research

**Domain:** Dark-only, GitHub dark-default-inspired pull-request diff workspace for an existing local Vue/Monaco application
**Researched:** 2026-07-24
**Confidence:** MEDIUM — recommendations are cross-checked against the installed packages, their published type definitions, current official documentation, Primer Primitives 11.9.0, and WCAG 2.2; visual parity still requires implementation-time browser inspection because GitHub's production CSS is not a stable public API.

## Executive Recommendation

The current stack is sufficient. Keep Vue 3.5.39, Monaco Editor 0.55.1, Vite 8.1.4, and plain CSS. Add **no npm package** for v1.1.

Implement the milestone as two coordinated presentation layers:

1. Consolidate the application shell onto one dark-only set of semantic CSS custom properties in the existing global `src/web/styles.css`.
2. Define one Monaco standalone theme with `monaco.editor.defineTheme(...)`, based on `vs-dark`, and pass that theme to the existing `createDiffEditor(...)` call.

Use the current published `@primer/primitives` dark values as a **design reference**, not as a dependency. This gives the app a close GitHub dark-default adaptation while preserving Diff Review's Vue components, Monaco integration, information architecture, and review behavior.

## Current-State Findings

- `package.json` pins Vue `3.5.39`, Monaco Editor `0.55.1`, Vite `8.1.4`, `@vitejs/plugin-vue` `6.0.7`, and TypeScript `7.0.2`. No styling system, preprocessor, or component library is installed.
- `App.vue` already loads the global stylesheet with `<style src="./styles.css"></style>`. Vue's non-scoped SFC style block and Vite's native CSS pipeline are enough for application-wide tokens.
- `styles.css` currently contains **two competing root palettes**. Lines 1–26 begin with GitHub-like dark values, but the later Phase 2 `:root` block at lines 970–1003 overrides them with a light workbench palette. The milestone should replace these layers with one semantic dark token system rather than adding a third layer or compatibility aliases.
- `DiffWorkspace.vue` creates the Monaco adapter once and already uses a `ResizeObserver`; no Vue wrapper or resize package is needed.
- `diff-adapter.ts` already uses the relevant native Monaco APIs: `createDiffEditor`, `getOriginalEditor`, `getModifiedEditor`, `onDidUpdateDiff`, `createDecorationsCollection`, view zones, `updateOptions`, and `hideUnchangedRegions`.
- The current Monaco construction is read-only and side-by-side, with `ariaLabel`, `glyphMargin`, disabled minimap, and `renderSideBySideInlineBreakpoint: 0`. It does **not** set a theme, original/modified labels, explicit diff indicators, or custom diff colors.
- The active anchor decoration already emits the class `monaco-anchor-line`, but the global stylesheet has no matching rule. That is the existing seam for an accessible selected-line treatment; no decoration library is required.

## Recommended Stack

### Core Technologies

| Technology | Version | Status | Purpose | Why Recommended |
|------------|---------|--------|---------|-----------------|
| Vue | 3.5.39 | Existing; keep | Existing component templates, ARIA attributes, responsive drawers, and state rendering | The milestone changes presentation rather than component mechanics. Vue already renders every surface that needs restyling. |
| Monaco Editor | 0.55.1 | Existing; keep | Side-by-side code diff, gutters, line mapping, decorations, view zones, syntax tokens, and accessible diff viewer | Its public theming and diff APIs cover the required line, word, gutter, selection, focus, and unchanged-region visuals. Replacing it would risk the validated comment/anchor workflow. |
| Vite | 8.1.4 | Existing; keep | Vue SFC and CSS bundling, worker imports, CSS HMR | Vite injects ordinary CSS and recommends native CSS variables for modern-browser projects. No Sass, Less, PostCSS plugin, or theme plugin is needed. |
| Native CSS custom properties and media queries | Browser platform | Existing; expand | Semantic palette, component states, responsive layout, and reduced motion | The theme is fixed and dark-only. Native variables provide the smallest and most maintainable source of truth for the shell. |
| Node.js | 24 LTS baseline | Existing; keep | Existing build/package runtime | No server, CLI, contract, or persistence change is required for a visual milestone. |

### Supporting Libraries and APIs

| Library or API | Version | Status | Purpose | When to Use |
|----------------|---------|--------|---------|-------------|
| `monaco.editor.defineTheme` + `IStandaloneThemeData` | Monaco 0.55.1 | Existing API | Register `diff-review-dark` with `base: 'vs-dark'`, `inherit: true`, token rules, and editor color IDs | Define once before the existing diff editor is created. Pass `theme: 'diff-review-dark'` at construction; reserve `setTheme` for an already-created editor. |
| `IDiffEditorConstructionOptions` | Monaco 0.55.1 | Existing API | Configure `originalAriaLabel`, `modifiedAriaLabel`, side-by-side rendering, indicators, overview, and unchanged regions | Extend the existing options object; do not introduce a wrapper component. |
| `createDecorationsCollection` | Monaco 0.55.1 | Existing API | Selected/anchored-line styling through the existing `monaco-anchor-line` class | Add a non-color cue such as an inset accent bar or border in addition to a selected background. |
| CSS `:focus-visible` | Browser platform | Existing; strengthen | Persistent keyboard-focus indication | Keep a visible 2px outline with offset and sufficient adjacent contrast across buttons, tree rows, inputs, drawers, and comment actions. |
| `@media (prefers-reduced-motion: reduce)` | Browser platform | Existing; keep | Disable drawer/spinner transitions for users requesting reduced motion | The stylesheet already contains this mechanism; migrate it into the final consolidated layer rather than duplicating it. |
| `@primer/primitives` | 11.9.0 published reference | Reference only; **do not install** | Source of current GitHub dark-default semantic and diff color values | Pin the provenance in a code comment or milestone note, then copy only the narrowly used values into Diff Review-owned semantic tokens. |

### Development Tools

| Tool | Version | Status | Purpose | Notes |
|------|---------|--------|---------|-------|
| TypeScript | 7.0.2 | Existing; keep | Type-check Monaco theme data and options | Type the theme object as `monaco.editor.IStandaloneThemeData`; avoid untyped color-key maps. |
| `@vitejs/plugin-vue` | 6.0.7 | Existing; keep | Compile Vue SFCs and the existing external global style block | No CSS plugin configuration is needed. |
| Browser DevTools accessibility/contrast inspection | Browser built-in | No package | Inspect computed token values, focus visibility, and responsive layout | Use during implementation verification; do not ship a runtime contrast checker. |

## Theme Mechanism

### Application CSS: one semantic token layer

Replace both current root color families (`--color-*` and the later light `--canvas`/`--panel` family) with one Diff Review-owned semantic namespace, then migrate all call sites and delete the superseded names. Suggested roles:

- Surfaces: `--dr-bg-canvas`, `--dr-bg-muted`, `--dr-bg-overlay`, `--dr-bg-control`, `--dr-bg-disabled`
- Foregrounds: `--dr-fg-default`, `--dr-fg-muted`, `--dr-fg-disabled`, `--dr-fg-on-emphasis`
- Borders: `--dr-border-default`, `--dr-border-muted`, `--dr-border-emphasis`, `--dr-border-focus`
- Semantic states: `--dr-accent-*`, `--dr-success-*`, `--dr-attention-*`, `--dr-danger-*`
- Diff roles: `--dr-diff-add-line`, `--dr-diff-add-number`, `--dr-diff-add-word`, `--dr-diff-delete-line`, `--dr-diff-delete-number`, `--dr-diff-delete-word`
- Interaction roles: `--dr-control-rest`, `--dr-control-hover`, `--dr-control-active`, `--dr-control-selected`, `--dr-control-disabled`

Do not name application tokens after a particular component (`--green`, `--file-header-gray`) or expose raw palette scales. Semantic roles allow the same accessible state to remain consistent across the file tree, header, toolbar, inline composer, notices, and review rail.

### Reference palette

The following values are resolved from the current published `@primer/primitives@11.9.0` dark functional theme. They are suitable starting points, not a mandate to reproduce every GitHub token:

| Diff Review role | Primer 11.9.0 reference | Value |
|------------------|--------------------------|-------|
| Canvas | `--bgColor-default` | `#0d1117` |
| Muted surface | `--bgColor-muted` | `#151b23` |
| Control surface | `--control-bgColor-rest` | `#212830` |
| Emphasis surface | `--bgColor-emphasis` | `#3d444d` |
| Default text | `--fgColor-default` | `#f0f6fc` |
| Muted text | `--fgColor-muted` | `#9198a1` |
| Disabled text | `--fgColor-disabled` | `#656c76` |
| Default border | `--borderColor-default` | `#3d444d` |
| Muted border | `--borderColor-muted` | `#3d444db3` |
| Accent text | `--fgColor-accent` | `#4493f8` |
| Accent/focus emphasis | `--borderColor-accent-emphasis` | `#1f6feb` |
| Success | `--fgColor-success` | `#3fb950` |
| Attention | `--fgColor-attention` | `#d29922` |
| Danger | `--fgColor-danger` | `#f85149` |
| Added line | `--diffBlob-additionLine-bgColor` | `#2ea04326` |
| Added line number/gutter | `--diffBlob-additionNum-bgColor` | `#3fb9504d` |
| Added word | `--diffBlob-additionWord-bgColor` | `#2ea04366` |
| Deleted line | `--diffBlob-deletionLine-bgColor` | `#f851491a` |
| Deleted line number/gutter | `--diffBlob-deletionNum-bgColor` | `#f851494d` |
| Deleted word | `--diffBlob-deletionWord-bgColor` | `#f8514966` |

The eight-digit colors intentionally retain alpha. Monaco's official color reference says inserted/removed line and text backgrounds must not be opaque, so underlying selection and decoration states remain visible.

### Monaco: dedicated standalone theme

Create a small internal theme configurator adjacent to the existing Monaco configuration, not a new dependency. Define the theme before `createMonacoDiffAdapter` constructs the editor:

```typescript
monaco.editor.defineTheme('diff-review-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    // Keep rules narrow; inherit language coverage from vs-dark.
  ],
  colors: {
    'editor.background': '#0d1117',
    'editor.foreground': '#f0f6fc',
    'editorGutter.background': '#0d1117',
    'editorLineNumber.foreground': '#9198a1',
    'editorLineNumber.activeForeground': '#f0f6fc',
    'editor.selectionBackground': '#388bfd66',
    'editor.inactiveSelectionBackground': '#388bfd33',
    'diffEditor.insertedLineBackground': '#2ea04326',
    'diffEditor.insertedTextBackground': '#2ea04366',
    'diffEditor.removedLineBackground': '#f851491a',
    'diffEditor.removedTextBackground': '#f8514966',
    'diffEditorGutter.insertedLineBackground': '#3fb9504d',
    'diffEditorGutter.removedLineBackground': '#f851494d',
    'diffEditor.border': '#3d444d',
  },
});
```

The implementation should also deliberately map these supported Monaco color IDs where visible: `editor.lineHighlightBackground`, `editor.lineHighlightBorder`, `editorCursor.foreground`, `focusBorder`, `diffEditor.diagonalFill`, `diffEditorOverview.insertedForeground`, `diffEditorOverview.removedForeground`, `diffEditor.unchangedRegionBackground`, `diffEditor.unchangedRegionForeground`, `diffEditor.unchangedRegionShadow`, and `diffEditor.unchangedCodeBackground`.

Use `base: 'vs-dark'` with `inherit: true`. Do not replace Monaco's complete per-language token rules. If syntax colors are tuned, keep the overrides small and use Primer's published code colors as references (comment `#656c76`, keyword `#ff7b72`, string `#a5d6ff`, constant/support `#79c0ff`, entity/type `#d2a8ff`, variable `#ffa657`). Broadly replacing token rules would create language-specific regressions unrelated to this milestone.

For one source of truth, application code may read resolved `--dr-*` values with `getComputedStyle(document.documentElement)` and pass concrete color strings into `defineTheme`. Do **not** pass unresolved `var(...)` expressions as Monaco theme values. Fail explicitly during development if a required token resolves empty.

## Exact Monaco Options Relevant to v1.1

These are present in the installed 0.55.1 type definitions:

| API/option | Recommendation | Integration note |
|------------|----------------|------------------|
| `theme` | Set to `diff-review-dark` when constructing the diff editor | Presentation only; models and anchors are unchanged. |
| `originalAriaLabel` / `modifiedAriaLabel` | Add concise Base and Head labels including the current file context where practical | More specific than the existing shared `ariaLabel`; does not alter visible IA. |
| `renderIndicators` | Set explicitly to `true` | Preserves `+`/`−` non-color cues for additions and deletions. |
| `renderSideBySide` | Keep `true` | Preserves the validated side-by-side review model. |
| `renderSideBySideInlineBreakpoint` | Keep `0` for v1.1 | The current external BASE/HEAD labels and comment-gutter action positioning assume a 50/50 split. Enabling inline fallback without coordinating those elements would create visual and anchoring defects. |
| `useInlineViewWhenSpaceIsLimited` | Do not enable independently | It is available if a later phase intentionally redesigns the narrow diff presentation; it is not a stack requirement. |
| `compactMode` | Leave off unless narrow visual inspection proves it necessary | It changes Monaco's small-view presentation but adds no capability needed now. |
| `accessibilityVerbose` | Evaluate with the existing keyboard-help text; do not enable blindly | Avoid duplicate or noisy screen-reader instructions. |
| `onlyShowAccessibleDiffViewer` | Do not force | Monaco should expose its accessible viewer without replacing the visual diff for all users. |
| `hideUnchangedRegions` | Keep the current configuration and context controls | Existing behavior is validated and themable through the unchanged-region color IDs. |
| `diffAlgorithm` | Do not change for a visual milestone | Diff computation is product behavior, not theming. |

## Accessible State Strategy

WCAG 2.2 requires normal text at 4.5:1, meaningful non-text component/state cues at 3:1 against adjacent colors, visible keyboard focus, and a visible alternative whenever color conveys information. Apply those constraints to both the CSS shell and Monaco:

| State | Color treatment | Required non-color/programmatic cue |
|-------|-----------------|-------------------------------------|
| Addition/deletion | Green/red transparent line, number, and word layers | Keep Monaco's `+`/`−` indicators, separate gutters, and Base/Head labels. |
| Selected/anchored line | Accent-muted background distinct from diff colors | Style existing `monaco-anchor-line` with an inset bar/border; keep the visible `+` comment action and its accessible label. |
| Saved/open/resolved comment | Semantic accent/success/muted surface | Retain text badges/status labels and action labels; never encode lifecycle only with border hue. |
| Keyboard focus | Accent focus outline with sufficient adjacent contrast | Persistent `:focus-visible` outline, normally 2px with offset; never remove Monaco's internal focus indication. |
| Error/warning | Danger/attention surface and border | Retain headings, visible text, icon/shape where present, `role="alert"` or live-region semantics, and explicit recovery action. |
| Disabled | Disabled surface/foreground/border | Native `disabled`/`inert`, cursor change, and stable control geometry. WCAG exempts inactive controls from contrast thresholds, but muted styling alone must not be the only indication. |
| Hover/active | Subtle surface and border changes | Do not make essential actions discoverable only on hover; keep control text/icon visible at rest. |

The current app already has skip links, labelled drawers, alerts/live regions, disabled attributes, and reduced-motion rules. Preserve those mechanisms while changing their visual tokens.

## Responsive Implications

No responsive library is necessary. The existing CSS already changes the three-column desktop shell into file/review drawers and uses `ResizeObserver` to re-layout Monaco.

For v1.1:

- Keep Monaco side-by-side and the current `640px` minimum diff canvas, allowing horizontal scrolling on genuinely narrow viewports. This preserves the external two-column side labels and gutter-action geometry.
- Polish the shell around that canvas: drawer widths, overlays, fixed controls, touch target size, overflow wrapping, and focus containment can remain ordinary media-query CSS.
- Do not turn on Monaco's inline fallback as an isolated option. If a future milestone chooses unified diff on narrow screens, it must also redesign Base/Head labels, comment action placement, side mapping, and visual verification together.
- Retain `prefers-reduced-motion: reduce` for drawer transforms and progress animation.

## Installation

No new installation is required.

```bash
# Keep the existing lockfile and dependencies.
npm install

# Intentionally do not install @primer/primitives, a CSS framework,
# a Monaco wrapper, a preprocessor, or another diff renderer.
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Diff Review-owned semantic CSS variables | Install/import `@primer/primitives` CSS | Only if the product adopts Primer as a maintained design-system dependency across multiple themes and components. v1.1 needs a small fixed palette, so the dependency and global selectors are unnecessary. |
| Monaco `defineTheme` on existing editor | CSS selectors against Monaco's generated DOM | Never for supported colors. Generated DOM classes are implementation details; use theme color IDs and only use CSS for Diff Review's own decoration/view-zone classes. |
| Existing Monaco integration | Vue Monaco wrapper | Only for a new app without an established adapter. Here it adds a second lifecycle abstraction around validated models, zones, and anchors. |
| Plain CSS | Sass/Less/PostCSS plugin/Tailwind | Only when the project needs language features that native CSS cannot express. This dark-only semantic token layer does not. |
| `vs-dark` inheritance with narrow syntax overrides | Full custom syntax grammar/theme | Only if syntax fidelity becomes a separate requirement with per-language validation. It is unnecessary for GitHub-like diff surfaces. |
| Existing side-by-side responsive canvas | Enable Monaco inline fallback immediately | Only after the app's external labels, comment affordance, side mapping, and narrow interaction design are intentionally adapted together. |

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@primer/primitives` as a runtime dependency | The package is a large cross-product token system; Diff Review needs a small, dark-only adapted subset and should retain its own identity. | Record 11.9.0 as palette provenance and own semantic `--dr-*` tokens. |
| Primer React, Primer CSS, or another component library | Wrong framework or unnecessary global component reset; would duplicate existing Vue controls and IA. | Restyle existing Vue components. |
| Tailwind, UnoCSS, CSS-in-JS, Sass, or Less | Adds a second styling convention and build surface for values native CSS already expresses. | Existing global stylesheet plus CSS custom properties/media queries. |
| `monaco-themes` or a downloaded VS Code theme bundle | General editor themes do not map GitHub PR diff semantics or Diff Review's shell states. | A small typed `IStandaloneThemeData` owned by the app. |
| `monaco-editor-vue3` or another Monaco wrapper | Risks lifecycle, model disposal, view-zone, and anchor behavior that the existing adapter already handles. | Extend `diff-adapter.ts` and existing Monaco configuration directly. |
| Shiki, Prism, CodeMirror, or another diff renderer | Duplicates syntax/diff responsibilities and would threaten stable line mapping and comments. | Monaco's built-in tokenization and diff theming. |
| A light-theme switcher or system-color-mode library | v1.1 is explicitly dark-only; it doubles state and verification without serving the milestone. | One fixed dark theme. |
| Runtime contrast-checking library | Contrast is a design/verification concern, not application behavior. | Precompute token pairings and inspect them during implementation. |
| New review mechanics | The milestone is visual; replies, suggestions, approvals, and submission workflows remain out of scope. | Preserve current comments, summary, persistence, and export behavior. |

## Version Compatibility

| Package/API | Compatible With | Notes |
|-------------|-----------------|-------|
| `monaco-editor@0.55.1` | Existing Vite worker imports and adapter | Installed published types include `defineTheme`, `setTheme`, `IStandaloneThemeData`, diff color-supporting theme map, `originalAriaLabel`, `modifiedAriaLabel`, responsive diff options, and accessible viewer options. Keep pinned for the milestone. |
| `vue@3.5.39` | `@vitejs/plugin-vue@6.0.7` | Existing SFC external non-scoped style block remains the global CSS entry point. No Vue-specific theme package is required. |
| `vite@8.1.4` | Node 24 baseline | Vite supports imported plain CSS and native variables directly. Preprocessor packages are only needed if preprocessor syntax is introduced, which is not recommended. |
| `@primer/primitives@11.9.0` | Reference only | Values were verified from the published dark functional CSS. Do not add it to `package.json`; re-check provenance only if implementation occurs after a deliberate token refresh. |
| WCAG 2.2 | CSS and Monaco states | Target Level AA contrast/use-of-color/focus requirements; inactive controls are contrast-exempt but still need clear native disabled semantics. |

## Sources

### Existing application and installed versions

- [`package.json`](../../package.json) — exact dependency versions and absence of a styling library or preprocessor.
- [`src/web/App.vue`](../../src/web/App.vue) — global `<style src>`, current diff/file/review information architecture, drawers, skip links, and live region.
- [`src/web/styles.css`](../../src/web/styles.css) — competing root palettes, existing responsive rules, focus treatment, control states, and reduced motion.
- [`src/web/components/DiffWorkspace.vue`](../../src/web/components/DiffWorkspace.vue) — existing Monaco lifecycle, resize observer, side labels, gutter action, and inline comment zones.
- [`src/web/monaco/diff-adapter.ts`](../../src/web/monaco/diff-adapter.ts) — existing Monaco options, decorations, view zones, and unchanged-region behavior.
- [`monaco-editor@0.55.1` published type definitions](https://unpkg.com/monaco-editor@0.55.1/monaco.d.ts) — exact current theme and diff-editor API surface.

### Primary/current external sources

- [Monaco Editor repository: custom theme example](https://github.com/microsoft/monaco-editor/blob/main/website/src/website/data/playground-samples/customizing-the-appearence/exposed-colors/sample.js) — `defineTheme`, theme color map, alpha colors, and `setTheme`.
- [Monaco Editor accessibility guide for integrators](https://github.com/microsoft/monaco-editor/wiki/Accessibility-Guide-for-Integrators) — editor/diff `ariaLabel` guidance.
- [VS Code Theme Color reference](https://code.visualstudio.com/api/references/theme-color#diff-editor-colors) — current official diff editor, gutter, overview, unchanged-region, focus, selection, line-number, and widget color identifiers; updated 2026-07-15.
- [Vue SFC CSS Features](https://vuejs.org/api/sfc-css-features.html) — global/non-scoped styles, scoped CSS, CSS Modules, and custom-property behavior.
- [Vite CSS features](https://vite.dev/guide/features.html#css) — ordinary CSS injection/HMR, CSS Modules, preprocessors, and recommendation to use native CSS variables.
- [`@primer/primitives@11.9.0` published dark theme](https://unpkg.com/@primer/primitives@11.9.0/dist/css/functional/themes/dark.css) — exact current dark semantic, syntax, and diff token values.
- [Primer Primitives `diffBlob` source](https://github.com/primer/primitives/blob/main/src/tokens/component/diffBlob.json5) — semantic relationships and dark overrides for addition/deletion line, number, and word states.
- [W3C WCAG 2.2 — Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) — color cannot be the only visual means of conveying information; updated 2025-09-16.
- [W3C WCAG 2.2 — Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) — 4.5:1 normal-text and 3:1 large-text thresholds, including inactive-control exception.
- [W3C WCAG 2.2 — Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) — 3:1 meaningful component and state cue contrast.
- [W3C WCAG 2.2 — Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) — persistent visible keyboard focus and `:focus-visible` technique; updated 2025-09-17.

### Documentation lookup trail

- Context7 `/microsoft/monaco-editor` — theme registration, theme application, construction options, and accessibility guide references.
- Context7 `/vuejs/vue` — SFC external/global/scoped style mechanisms.
- Context7 `/vitejs/vite` (`v8.0.10` documentation set) — CSS imports, native variables, and preprocessor requirements, cross-checked against installed Vite 8.1.4 metadata.
- Context7 `/websites/primer_style` — semantic foreground/background/border/diff token model, cross-checked against published Primitives 11.9.0 CSS.

---
*Stack research for: Diff Review v1.1 GitHub Dark Diff*
*Researched: 2026-07-24*
