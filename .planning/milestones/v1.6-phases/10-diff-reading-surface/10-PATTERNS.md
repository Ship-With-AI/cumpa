# Phase 10: Diff Reading Surface - Pattern Map

**Mapped:** 2026-09-13
**Files analyzed:** 12 (0 created, 12 modified)
**Analogs found:** 12 / 12

Phase 10 is a **reconciliation** phase. Nothing is greenfield, so every "analog"
below is an **in-file precedent**: the exact existing call site, rule, or
assertion block that the change must join or amend. That is a stronger analog
than a sibling file — prefer it in every case.

## File Classification

| Modified file | Role | Data flow | Closest analog | Match quality |
|---|---|---|---|---|
| `src/web/monaco/diff-adapter.ts` | adapter / controller | event-driven (`onDidUpdateDiff`) + request-response (`setFile`) | itself — `:107-122` (construction), `:174-179` (`updateOptions`) | exact (in-file) |
| `src/web/monaco/theme.ts` | config / transform | build-time token → theme map | itself — `:88-93` (diff key run) | exact (in-file) |
| `src/web/monaco/diff-semantics.ts` | utility / transform | batch (`ILineChange[]` → decorations) | itself — `:70-93` (decoration push loop) | exact (in-file) |
| `src/web/styles.css` | config / stylesheet | declarative cascade | itself — `:2721-2757` (Monaco override block), `:1684-1712` (geometry) | exact (in-file) |
| `src/web/components/DiffWorkspace.vue` | component | event-driven (lifecycle + media listeners) | `src/web/App.vue:1038-1045,1097-1100` (matchMedia own/teardown) | role-match |
| `tests/unit/monaco-theme.test.ts` | test | assertion table | itself — `:26-64` map, `:114` exhaustive equality | exact (in-file) |
| `tests/unit/monaco-diff-semantics.test.ts` | test | assertion table | itself — `:44-74` decoration array | exact (in-file) |
| `tests/unit/monaco-diff-adapter.test.ts` | test | mocked construction | itself — `:66-73` `expect.objectContaining` | exact (in-file) |
| `tests/e2e/responsive-session.spec.ts` | test | browser computed-style | itself — `:595-596,618-621` | exact (in-file) |
| `tests/e2e/anchored-review.spec.ts` | test | browser text probe | itself — `:145-146` | exact (in-file) |
| `tests/e2e/complete-review-draft.spec.ts` | test | browser text probe | `tests/e2e/anchored-review.spec.ts:145-146` (byte-identical helper) | exact |
| `tests/integration/anchored-workspace.spec.ts` | test (constraint only) | browser geometry | itself — `:1203-1207`, `:1222-1225` | exact (in-file) |

---

## Pattern Assignments

### `src/web/monaco/diff-adapter.ts` (adapter, event-driven + request-response)

**Analog:** itself. Three distinct call sites, three distinct changes.

**(a) The exact options object a new option must join** — `:107-122`. This is
the only `createDiffEditor` call in the repo. Five options are missing; they go
in this literal, nowhere else:

```typescript
    applyCumpaTheme();
    this.diffEditor = monaco.editor.createDiffEditor(host, {
      ariaLabel: 'Immutable base and head side-by-side diff',
      automaticLayout: false,
      fontFamily: CODE_FONT_FAMILY,
      fontSize: CODE_FONT_SIZE,
      lineHeight: CODE_LINE_HEIGHT,
      glyphMargin: true,
      minimap: { enabled: false },
      occurrencesHighlight: 'off',
      originalEditable: false,
      readOnly: true,
      renderSideBySide: true,
      renderSideBySideInlineBreakpoint: 0,
      hideUnchangedRegions: HIDE_UNCHANGED_REGIONS,
      renderIndicators: false,
    });
```

Note the existing style: flat literal, one option per line, no grouping
comments, `as const` sub-objects hoisted to module scope (`HIDE_UNCHANGED_REGIONS`
at `:64-69`). Missing per UI-SPEC `:128-137`: `useInlineViewWhenSpaceIsLimited: false`,
`renderGutterMenu: false`, `renderMarginRevertIcon: false`, `diffWordWrap: 'off'`,
`diffAlgorithm: 'advanced'`.

**(b) How the adapter reacts to option updates** — `:174-179`. This is the
existing `updateOptions` precedent, and it lives **inside `setFile()`**, which is
exactly where a per-file `ariaLabel` must be applied:

```typescript
    this.currentFile = file;
    const saved = this.stateByFileId.get(file.id);
    this.contextMode = saved?.contextMode ?? 'collapsed';
    this.diffEditor.updateOptions({
      hideUnchangedRegions: this.contextMode === 'collapsed'
        ? HIDE_UNCHANGED_REGIONS
        : { enabled: false },
    });
```

Pattern to copy: read per-file state → single `updateOptions` call → then build
models. A responsive `setCodeDensity()` method follows the same shape
(`this.diffEditor.updateOptions({ fontSize, lineHeight })`).

**(c) Token-derived numerics are module-scope constants** — `:71-74`. Any
responsive 14/28 and 12/24 variants derive here, in TypeScript, not as new CSS
tokens (UI-SPEC forbids unconsumed tokens):

```typescript
const TOKENS = parseTokenRoot(TOKEN_ROOT_CSS);
const CODE_FONT_FAMILY = resolveToken(TOKENS, '--font-mono');
const CODE_FONT_SIZE = Number.parseInt(resolveToken(TOKENS, '--font-size-code'), 10);
const CODE_LINE_HEIGHT = Number.parseInt(resolveToken(TOKENS, '--line-height-code'), 10);
```

**(d) Public surface is an explicit `Readonly<{...}>` type** — `:48-61`. A new
`setCodeDensity` must be added to `MonacoDiffAdapter` there, or the component
cannot call it:

```typescript
export type MonacoDiffAdapter = Readonly<{
  activateAnchor: (side: DiffSide, line: number) => void;
  ...
  setFile: (file: ImmutableDiffFile) => Promise<void>;
}>;
```

**(e) Side names must arrive from the component, not be recomputed.** The
adapter's file type is `ImmutableDiffFile` (`:13-17`) and carries no source kind:

```typescript
export type ImmutableDiffFile = Readonly<{
  id: string;
  base: Readonly<{ path: string; text: string }>;
  head: Readonly<{ path: string; text: string }>;
}>;
```

The `preimage`/`postimage` vs `base`/`head` decision already has a single
authority at `DiffWorkspace.vue:49-53`. Extend this type rather than duplicating
that mapping.

---

### `src/web/monaco/theme.ts` (config, token → theme transform)

**Analog:** itself, `:88-93` — the diff key run. Every key is
`'<monaco.key>': color('--token')`, one per line, no literals:

```typescript
    'diffEditor.border': color('--diff-region-border'),
    'diffEditor.diagonalFill': color('--diff-empty-background'),
    'diffEditor.unchangedCodeBackground': color('--diff-unchanged-background'),
    'diffEditor.unchangedRegionBackground': color('--surface-panel'),
    'diffEditor.unchangedRegionForeground': color('--diff-hunk-foreground'),
    'diffEditor.unchangedRegionShadow': UNPAINTED_COLOR,
```

`color()` is the only permitted value producer (`:10-12`), and `UNPAINTED_COLOR`
(`:8`, `'#00000000'`) is the sentinel for "deliberately not painted". An added
key (e.g. `editorLink.activeForeground`) follows this exact form.

**Hard coupling:** the theme object is `satisfies monaco.editor.IStandaloneThemeData`
(`:105`), so an unknown key is a type error, not a silent drop.

---

### `src/web/monaco/diff-semantics.ts` (utility, batch transform)

**Analog:** itself, `:70-93` — the decoration push loop. Any hunk-boundary
decoration is appended inside this same `for (const range of ranges)` block:

```typescript
  for (const range of ranges) {
    decorations.push({
      range: { startLineNumber: range.start, startColumn: 1, endLineNumber: range.end, endColumn: 1 },
      options: {
        isWholeLine: true,
        linesDecorationsClassName: `monaco-diff-change-bar--${suffix}`,
      },
    });
    decorations.push({
      range: { startLineNumber: range.start, startColumn: 1, endLineNumber: range.start, endColumn: 1 },
      options: {
        glyphMarginClassName: `monaco-diff-change-sign--${suffix}`,
      },
    });

    if (range.end - range.start >= 3) {
      decorations.push({
        range: { startLineNumber: range.end, startColumn: 1, endLineNumber: range.end, endColumn: 1 },
        options: {
          glyphMarginClassName: `monaco-diff-change-sign--${suffix}`,
        },
      });
    }
  }
```

Established conventions to copy: class names are built by template literal from
`const suffix = side === 'base' ? 'base' : 'head'` (`:67`); ranges are already
clamped (`:26-28`) and merged (`:31-48`) upstream — **never re-derive
boundaries from Git**; `startColumn`/`endColumn` are always `1`.

**Shape any new decoration must satisfy** — `tests/unit/monaco-diff-semantics.test.ts:21-34`
projects decorations through `observableDecorations`, which captures
`optionKeys: Object.keys(options).sort()`:

```typescript
  return decorations.map(({ range, options }) => ({
    range: [range.startLineNumber, range.endLineNumber],
    bar: options.linesDecorationsClassName,
    sign: options.glyphMarginClassName,
    optionKeys: Object.keys(options).sort(),
  }));
```

A boundary decoration using `className` would surface as
`bar: undefined, sign: undefined, optionKeys: ['className', 'isWholeLine']` —
invisible in `bar`/`sign` but **caught by `optionKeys`**. The five `toEqual`
blocks that must gain entries are at `:44-74`, `:76-110`, `:112-135`, `:137-160`,
`:162-194`. Example of the exact literal shape to extend (`:44-58`):

```typescript
    expect(observableDecorations(buildDiffDecorations([change(2, 4, 6, 8)], 'base', 10))).toEqual([
      {
        range: [2, 4],
        bar: 'monaco-diff-change-bar--base',
        sign: undefined,
        optionKeys: ['isWholeLine', 'linesDecorationsClassName'],
      },
      {
        range: [2, 2],
        bar: undefined,
        sign: 'monaco-diff-change-sign--base',
        optionKeys: ['glyphMarginClassName'],
      },
    ]);
```

These are `toEqual` on full arrays — order-sensitive and exhaustive. ROADMAP
lists this file as "unchanged"; that is **incorrect if boundaries are added**.
The tests stay valuable (they pin side-ownership, merging, clamping) and should
be extended, not deleted.

---

### `src/web/styles.css` (stylesheet)

**Analog (delete target):** `:2759-2763` — the band rule that re-paints what the
Monaco theme already paints:

```css
.monaco-editor .diff-hidden-lines .center {
  background: var(--surface-gap);
  box-shadow: none;
  color: var(--diff-hunk-foreground);
}
```

**Analog (the deliberate-deference pattern this should become):** `:2765-2768`
is the in-file example of a rule that touches only what Monaco does *not* theme,
and defers the rest:

```css
.monaco-editor .diff-hidden-lines .top,
.monaco-editor .diff-hidden-lines .bottom {
  border-color: var(--border-default);
}
```

One property, no `background`, no `box-shadow` reset — it corrects a border
colour and leaves Monaco's own paint alone. Contrast with `:2754-2757`, the
in-file example of a rule that *legitimately* overrides Monaco because Monaco
paints a texture Cumpa must flatten (and says so with `!important` scoped to two
properties):

```css
.monaco-editor .diagonal-fill {
  background-color: var(--diff-empty-background) !important;
  background-image: none !important;
}
```

**Analog (keep, do not rename):** `:2721-2752` — the rail/sign block. Four class
names referenced from five sites (builder, this block, forced-colors repair
`:2914-2930`, unit test, e2e). Rail pattern:

```css
.monaco-editor .monaco-diff-change-bar--base {
  box-sizing: border-box;
  border-left: 2px solid var(--diff-deletion-foreground);
  border-left-style: dashed;
}
```

Note `box-sizing: border-box` — this is the in-file precedent for **adding
border paint to a Monaco line decoration without changing box metrics**, which
is exactly what UI-SPEC `:167` demands of hunk boundaries.

**Analog (geometry to amend):** `:1684-1712`. The `32px` label row and the
`--space-2 --space-4` padding that UI-SPEC `:75` replaces with a bounded
`9px 18px` exception:

```css
.diff-workspace__canvas {
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  min-width: 640px;
  min-height: 100%;
  grid-template-rows: 32px minmax(0, 1fr);
}

.diff-workspace__side-labels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  border-bottom: 1px solid var(--border-default);
  background: var(--border-default);
}

.diff-workspace__side-labels > span {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--surface-panel);
  color: var(--text-muted);
  font-size: var(--font-size-metadata);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-metadata);
}
```

`9 + 18 + 9 = 36px` content box vs the `32px` track — the padding and the
`grid-template-rows` value must change in the same edit. The `gap: 1px` +
`background: var(--border-default)` pair at `:1697-1699` is the structural
separator candidate for re-homing `--surface-gap` (see Shared Patterns).

---

### `src/web/components/DiffWorkspace.vue` (component, event-driven)

**Analog for matchMedia ownership:** `src/web/App.vue:1038-1045` — acquire in
`onMounted`, call the handler once eagerly, then subscribe:

```typescript
  filesDrawerMedia = window.matchMedia('(max-width: 1099px)');
  commentsDrawerMedia = window.matchMedia('(max-width: 1439px)');
  compactIdentityMedia = window.matchMedia('(max-width: 767px)');
  commentsOpen.value = !commentsDrawerMedia.matches;
  handleViewportChange();
  filesDrawerMedia.addEventListener('change', handleViewportChange);
  compactIdentityMedia.addEventListener('change', handleViewportChange);
  commentsDrawerMedia.addEventListener('change', handleViewportChange);
```

Paired teardown, `src/web/App.vue:1098-1100` — optional-chained, same handler
reference:

```typescript
  filesDrawerMedia?.removeEventListener('change', handleViewportChange);
  commentsDrawerMedia?.removeEventListener('change', handleViewportChange);
  compactIdentityMedia?.removeEventListener('change', handleViewportChange);
```

Single handler reads all lists, `App.vue:888-892`:

```typescript
function handleViewportChange(): void {
  isFilesDrawer.value = filesDrawerMedia?.matches ?? false;
  isCommentsDrawer.value = commentsDrawerMedia?.matches ?? false;
  isNarrow.value = isFilesDrawer.value;
  isCompact.value = compactIdentityMedia?.matches ?? false;
```

Module-scope `let x: MediaQueryList | undefined` declaration style: `App.vue:136`.

**Where it lands in this component** — `DiffWorkspace.vue:272-284` already owns
an observer plus symmetric teardown; the media listeners join these two hooks:

```typescript
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

**Side-name authority to reuse (do not duplicate)** — `:49-53`:

```typescript
const visibleSides = computed(() =>
  props.sourceKind === 'exact-patch'
    ? { original: 'PREIMAGE', modified: 'POSTIMAGE', originalName: 'preimage', modifiedName: 'postimage' }
    : { original: 'BASE', modified: 'HEAD', originalName: 'base', modifiedName: 'head' },
);
```

**Markup nesting that must survive** — `:291-300`. `div` > `span` > `span`,
label text in the **first** child span, cue in the second:

```html
        <div class="diff-workspace__side-labels" aria-hidden="true">
          <span>
            <span>{{ visibleSides.original }}</span>
            <span class="diff-workspace__side-cue diff-workspace__side-cue--base">− REMOVED</span>
          </span>
          <span>
            <span>{{ visibleSides.modified }}</span>
            <span class="diff-workspace__side-cue diff-workspace__side-cue--head">+ ADDED</span>
          </span>
        </div>
```

The existing source-correct accessible name pattern is one line above, `:288`,
and is the model for the Monaco `ariaLabel` string:

```html
  <section class="diff-workspace" :aria-label="`${path}: ${visibleSides.originalName} and ${visibleSides.modifiedName} side-by-side diff`">
```

---

### `tests/unit/monaco-theme.test.ts` (test)

**Analog:** itself, `:26-64` — the mirror map. A theme key added to `theme.ts`
must be added here in the same change, same one-line form:

```typescript
const THEME_COLOR_ROOT_MAP: Readonly<Record<string, RootMapping>> = {
  'editor.background': { token: '--surface-canvas' },
  ...
  'diffEditor.unchangedRegionForeground': { token: '--diff-hunk-foreground' },
```

The assertion that fails on any unmirrored key, `:114`:

```typescript
    expect(Object.keys(colors).filter((key) => !(key in UNPAINTED_THEME_COLORS)).sort()).toEqual(mappedKeys);
```

Set equality, both directions. Deliberately-unpainted keys go in the second map
instead (`:67-70`):

```typescript
const UNPAINTED_THEME_COLORS = {
  'editor.lineHighlightBackground': '#00000000',
  'diffEditor.unchangedRegionShadow': '#00000000',
} as const;
```

**Flag for planner:** this file is absent from the ROADMAP's expected-impact
list but is a mandatory companion to any theme key addition.

---

### `tests/unit/monaco-diff-adapter.test.ts` (test)

**Analog:** itself, `:66-73` — the option-proving pattern. New diff options are
proven exactly this way (mocked `createDiffEditor`, partial match), never by
reading source text:

```typescript
    expect(mocks.createDiffEditor).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        fontFamily: resolveToken(tokens, '--font-mono'),
        fontSize: Number.parseInt(resolveToken(tokens, '--font-size-code'), 10),
        lineHeight: Number.parseInt(resolveToken(tokens, '--line-height-code'), 10),
      }),
    );
```

`expect.objectContaining` means adding the five missing options does **not**
break this test — it is extended, not repaired.

---

### `tests/e2e/responsive-session.spec.ts` (test)

**Analog:** itself, `:595-596` and `:618-621` — the two assertion styles for
this surface. Concatenated label text plus computed style:

```typescript
  await expect(sideLabels).toHaveText(/BASE− REMOVEDHEAD\+ ADDED/);
  await expect(sideLabels.locator(':scope > span').first()).toHaveCSS('font-weight', '600');
```

Rail/sign proof is computed-style and pseudo-element `content`, never class
presence — copy this for any new hunk-boundary or band assertion:

```typescript
  await expect(baseBar).toHaveCSS('border-left-style', 'dashed');
  await expect(headBar).toHaveCSS('border-left-style', 'solid');
  expect(await baseSign.evaluate((element) => getComputedStyle(element, '::before').content)).toContain('−');
  expect(await headSign.evaluate((element) => getComputedStyle(element, '::before').content)).toContain('+');
```

Locator convention, `:588-593` — `.monaco-editor` prefix plus `.first()`:

```typescript
  const baseBar = page.locator('.monaco-editor .monaco-diff-change-bar--base').first();
```

---

### `tests/e2e/anchored-review.spec.ts` + `tests/e2e/complete-review-draft.spec.ts` (test)

**Analog:** `tests/e2e/anchored-review.spec.ts:142-147` — byte-identical helper
in both files (`complete-review-draft.spec.ts:152-157`). `getByText(..., exact)`
requires the label to remain **its own text node**:

```typescript
async function openGeneratedReview(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.monaco-diff-editor')).toBeVisible();
  await expect(page.getByText('BASE', { exact: true })).toBeVisible();
  await expect(page.getByText('HEAD', { exact: true })).toBeVisible();
}
```

Merging the label and cue into one node breaks both specs. Strengthening these
to assert source-correct labels means editing both copies together.

---

### `tests/integration/anchored-workspace.spec.ts` (constraint, not a target)

**Analog:** itself, `:1222-1225` — positional selectors into the exact nesting:

```typescript
        const baseLabelReachableAtStart = intersectsViewport(document.querySelector('.diff-workspace__side-labels > span:first-child > span:first-child'));
        viewport.scrollLeft = viewport.scrollWidth;
        const headLabelReachableAtEnd = intersectsViewport(document.querySelector('.diff-workspace__side-labels > span:last-child > span:first-child'));
```

`> span:first-child > span:first-child` pins two levels of `span` nesting and
requires the **name** span to be first. Re-wrapping the label markup silently
breaks reachability probes rather than a text assertion.

**The overflow canary any new diff-surface element must pass**, `:1203-1208` —
expected value is the empty array, so a single wide un-truncated element (hunk
label, band) names its own class in the failure:

```typescript
    const outerOverflowOwners = await page.locator('.review-main').evaluate((root) => [...root.querySelectorAll<HTMLElement>('*')]
      .filter((element) => !element.closest('.diff-workspace__viewport')
        && !element.classList.contains('sr-only')
        && element.scrollWidth > element.clientWidth)
      .map((element) => element.className));
    expect(outerOverflowOwners).toEqual([]);
```

Adjacent pin that the `36px` row change must not disturb, `:1256-1257`:

```typescript
    await expect(action).toHaveCSS('width', '32px');
    await expect(action).toHaveCSS('height', '32px');
```

**Flag for planner:** absent from the ROADMAP's expected-impact list.

---

## Shared Patterns

### Token re-homing: delete a consumer and land its replacement in the same change

**Source precedent:** `.planning/phases/09-changed-file-tree/09-02-PLAN.md:90`
— Phase 09 split declaration from consumption across two tasks and stated the
red window explicitly rather than letting it surprise the gate:

> This task leaves the gate red on purpose: the four are declared but not yet referenced, so `assertDeclaredTokensConsumed` will report them as orphans. Task 2 authors the consumers.

Same phase, the in-plan form of "check the replacement keeps a consumer"
(`09-02-PLAN.md:131`):

> **Hover.** Point `.tree-row:hover` `--surface-raised` per `09-UI-SPEC.md:142`. `--surface-interactive-hover` keeps two consumers, no orphan results.

And the Phase 09 pattern map recorded the identical hazard for `--tree-indent`
(`09-PATTERNS.md:290`): sole consumer, rewriting the rule would fail the gate,
so "Keep a `var(--tree-indent)` reference."

**Apply to:** `src/web/styles.css`. Two tokens in this phase have exactly one
consumer each (verified by grep):

| Token | Declared | Sole consumer | Phase 10 hazard |
|---|---|---|---|
| `--surface-gap` | `styles.css:8` | `styles.css:2760` | That rule is the delete target. Deleting it orphans the token. |
| `--diff-hunk-background` | `styles.css:77` | `prototypes/Phase6DiffSemanticsPrototype.vue:614` | No production consumer; survives only because `webSources` globs every `.vue` under `src/web`. |

**The gate that fails** — `scripts/verify-semantic-css.mjs:105-106`:

```javascript
  const unused = [...declared].filter((name) => !referenced.has(name));
  if (unused.length !== 0) fail(`canonical tokens have no consumer: ${unused.join(', ')}`);
```

Referenced-set collection covers both CSS and the Monaco theme, `:95-98` — this
is why `color('--x')` in `theme.ts` counts as a consumer:

```javascript
  const referenced = new Set(sources.flatMap((source) => [
    ...source.matchAll(/var\(\s*(--[\w-]+)/g),
    ...source.matchAll(/\bcolor\(\s*['"](--[\w-]+)['"]\s*\)/g),
  ].map(([, name]) => name)));
```

Nearest structural re-home for `--surface-gap` is the existing 1px inter-pane
separator at `styles.css:1697-1699` (`gap: 1px` + `background: var(--border-default)`).

### Paint authority: supply the variable Monaco reads, never escalate specificity

**Source:** `src/web/monaco/theme.ts:91-93` paired with `src/web/styles.css:2765-2768`.
**Apply to:** every hidden-region, line-fill, intraline-fill, gutter-fill, and
diagonal-fill change.

Monaco's bundled stylesheet consumes `--vscode-diffEditor-*` custom properties
derived from the registered theme. When Cumpa wants a different colour there,
the change belongs in `theme.ts`; when Monaco marks the rule `!important`
(`.diff-hidden-lines .center a:hover .codicon`), a competing Cumpa rule loses
outright — `styles.css:2770-2778` currently loses this way:

```css
.monaco-editor .diff-hidden-lines:not(.dragging) .top:hover,
.monaco-editor .diff-hidden-lines:not(.dragging) .bottom:hover,
.monaco-editor .diff-hidden-lines .top.dragging,
.monaco-editor .diff-hidden-lines .bottom.dragging,
.monaco-editor .diff-hidden-lines .center a:hover .codicon,
.monaco-editor .diff-hidden-lines div.breadcrumb-item:hover {
  background-color: var(--surface-panel);
  color: var(--diff-hunk-foreground);
}
```

### Non-colour redundancy rides on decorations plus a forced-colors repair

**Source:** `src/web/styles.css:2914-2930`.
**Apply to:** any new cue that carries meaning.

Every meaning-bearing diff class has a matching entry in the terminal
forced-colors block, restated in system keywords:

```css
  .monaco-editor .monaco-diff-change-bar--base,
  .monaco-editor .monaco-diff-change-bar--head {
    border-left-color: CanvasText;
  }

  .monaco-editor .monaco-diff-change-bar--base {
    border-left-style: dashed;
  }

  .monaco-editor .monaco-diff-change-bar--head {
    border-left-style: solid;
  }

  .monaco-editor .monaco-diff-change-sign--base::before,
  .monaco-editor .monaco-diff-change-sign--head::before {
    color: CanvasText;
  }
```

System keywords are legal **only** inside this terminal block —
`verify-semantic-css.mjs:219` fails `system colors are only allowed in the
forced-colors repair block`, and `:213-216` additionally requires the
forced-colors block to be the last media block in the file.

---

## Conflict Found: the research's recommended hunk-boundary mechanism cannot pass the gate

`10-RESEARCH.md` Q4 recommends a `linear-gradient` hairline and logs assumption
A2 as "RESOLVED / VERIFIED" on the basis of `verify-semantic-css.mjs:152-155,161,183-186`
(paint-bearing + non-palette-exempt analysis). That analysis is correct as far as
it goes, but it never reaches those functions: `assertAuthorStyle` rejects
gradients by substring **before** any colour audit runs.

`scripts/verify-semantic-css.mjs:209-211`:

```javascript
function assertAuthorStyle(source, { enforceShadowAllowlist = true } = {}) {
  if (/@import\b|url\(\s*(?:['"]?https?:|['"]?\/\/)|(?:repeating-)?(?:linear|radial|conic)-gradient\(|backdrop-filter\s*:|text-shadow\s*:|filter\s*:\s*drop-shadow\(/i.test(source)) {
    fail('source contains an import, remote URL, gradient, glow, glass, or drop shadow');
  }
```

`assertAuthorStyle(source)` is invoked on `src/web/styles.css` at `:420`, and on
both prototype `.vue` style blocks via `assertVueStyleBlocks` at `:421-422`.

Verified directly against the research's own proposed rule:

```
$ node -e '<regex from :213>.test(".monaco-editor .monaco-diff-hunk-start--head { background: linear-gradient(var(--diff-region-border) 0 1px, var(--diff-hunk-background) 1px); }")'
gradient rejected by assertAuthorStyle: true
```

The approved contract agrees independently — `10-UI-SPEC.md:352` lists
"gradients" among the exclusions.

**Remaining mechanisms consistent with UI-SPEC `:167`** ("inset paint rather
than borders that change box metrics", `1px`, consumes `--diff-region-border`):

- `box-shadow: inset` — permitted only by adding a verbatim selector/value pair
  to the allowlist at `verify-semantic-css.mjs:225-229`, and `:237` limits a rule
  to one `box-shadow` declaration:
  ```javascript
  const insetAllowlist = new Map([
    ['.tree-row--selected', 'inset var(--selected-rail-width) 0 var(--selection-border)'],
    ['.view-tab[aria-selected="true"]', 'inset 0 calc(var(--selected-rail-width) * -1) var(--selection-border)'],
    ['.monaco-editor .monaco-anchor-line', 'inset var(--selected-rail-width) 0 var(--interactive-accent)'],
  ]);
  ```
- A border on a `box-sizing: border-box` decoration — the in-file precedent is
  the rail at `styles.css:2721-2725`, which already adds `2px` of border paint to
  a Monaco line decoration without changing box metrics.

Both keep `--diff-region-border` (already multi-consumer: `theme.ts:88`,
`styles.css:1672`) and neither re-homes `--diff-hunk-background` — so if the
gradient is dropped, `--diff-hunk-background` needs a separate production
consumer or it remains prototype-only.

---

## No Analog Found

| File | Role | Data flow | Reason |
|---|---|---|---|
| — | — | — | Every file in this phase already exists with an in-file precedent. |

**Requested precedent that does not exist:** there is no prior
JS/`matchMedia`-driven *responsive typography* anywhere in the repo. The only
`matchMedia` usage is `src/web/App.vue:1038-1045`, and it drives **drawer
open/closed and compact-identity booleans**, not type scale. Responsive sizing
elsewhere is pure CSS media queries. So `App.vue` is a role-match analog for
listener ownership and teardown only; the `updateOptions({ fontSize, lineHeight })`
payload has its own in-file precedent at `diff-adapter.ts:174-179` and no
precedent as a responsive driver. This combination is new in Phase 10.

## Metadata

**Analog search scope:** `src/web/monaco/`, `src/web/components/`, `src/web/App.vue`,
`src/web/styles.css`, `src/web/prototypes/`, `scripts/verify-semantic-css.mjs`,
`tests/unit/`, `tests/integration/`, `tests/e2e/`, `.planning/phases/08-*`, `.planning/phases/09-*`
**Files read:** 18
**Pattern extraction date:** 2026-09-13
