# Phase 09: Changed-File Tree - Pattern Map

**Mapped:** 2026-09-13
**Files analyzed:** 11 modified, 0 created
**Analogs found:** 11 / 11 (9 exact, 2 partial — see "No Analog Found")

Phase 09 creates **no new files**. Every change lands in an existing file, so the
primary analog for most work is the *adjacent existing function in the same file*
whose shape the new code must match. Where a capability is genuinely new to the
repo (single-line text input, no-match empty state inside the tree), the closest
sibling analog elsewhere in `src/web` is named instead.

---

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/web/model/file-tree.ts` | model (immutable state machine) | transform / event-driven | self: `selectFile` `src/web/model/file-tree.ts:174-183`, `flattenVisibleRows` `:65-93` | exact |
| `src/web/components/FileTree.vue` | component (container) | event-driven | self: `toggleDirectory` `:67-69` + `applyModel`; local-state binding `DriftExportAcknowledgement.vue:24,60` | exact (model wiring) / partial (input) |
| `src/web/components/FileRow.vue` | component (presentational leaf) | render | self: `FileRow.vue:41-74` row anatomy | exact |
| `src/web/components/DirectoryRow.vue` | component (recursive presentational) | render | sibling: `FileRow.vue:41-74` (count span + a11y name) | exact |
| `src/web/components/PathDisplay.vue` | component (presentational) | render | self: `PathDisplay.vue:34-40` `aria-label`+`title` move branch | exact |
| `src/web/components/StatusBadge.vue` | component (presentational) | render | self: `StatusBadge.vue:30-33` (visible glyph + `visually-hidden` name) | exact — no code change expected, tokens only |
| `src/web/styles.css` | config (canonical token root + rules) | n/a | self: `:root` `:118-139`, `.tree-row` `:940-953`; token+consumer precedent commit `532abdf` | exact |
| `scripts/css-token-contract.mjs` | config (drift-gate allowlist) | n/a | self: `CANONICAL_TOKENS` `:1-27` | exact |
| `tests/unit/file-tree.test.ts` | test (unit, model) | n/a | self: `:310-325` expansion, `:327-363` selection, `:365-425` keyboard | exact |
| `tests/e2e/file-tree.spec.ts` | test (e2e, browser) | n/a | self: `:328-345` role/name/tabindex assertions | exact |
| `tests/e2e/responsive-session.spec.ts` | test (e2e, browser) | n/a | self: tree locators at `:548,562-568,1088-1092` | exact |

**Read-only dependency (MUST NOT be modified):** `src/domain/file-tree.ts` — the
filter prunes its output; it never re-enters `buildFileTree`.

---

## Pattern Assignments

### `src/web/model/file-tree.ts` (model, transform/event-driven)

**Analog:** itself — three existing shapes the new code must clone.

**1. Transition shape with identity reuse** (`src/web/model/file-tree.ts:174-183`) — `setQuery` must copy this exactly, including the `=== ? model :` early-out so a no-op keystroke does not re-render:

```ts
  const selectFile = (fileId: string): FileTreeModel =>
    selectedFileId === fileId
      ? model
      : createModel(
          tree,
          allDirectoryIds,
          expandedDirectoryIds,
          focusedRowId,
          fileId,
        );
```

`selectFile` is also the TREE-03 fix site: it currently passes `focusedRowId`
straight through, which is why a load-time `selectFile()` leaves the tab stop on
a different row than `aria-selected="true"` (`tests/e2e/file-tree.spec.ts:331`).

**2. Recursive walk that freezes and preserves order** (`src/web/model/file-tree.ts:65-93`) — the `pruneTree` helper must sit beside this and match its `Object.freeze({ ...node, … })` spread-preserving style:

```ts
function flattenVisibleRows(
  nodes: readonly FileTreeNode[],
  expanded: ReadonlySet<string>,
  depth: number,
  output: VisibleFileTreeRow[],
): void {
  for (const node of nodes) {
    if (node.kind === 'directory') {
      output.push(
        Object.freeze({
          ...node,
          rowId: directoryRowId(node.directoryId),
          depth,
        }),
      );
      if (expanded.has(node.directoryId)) {
        flattenVisibleRows(node.children, expanded, depth + 1, output);
      }
    } else {
      output.push(
        Object.freeze({
          ...node,
          rowId: fileRowId(node.fileId),
          depth,
        }),
      );
    }
  }
}
```

The `{ ...node }` spread is the mechanism that lets a pruned directory keep its
original `directoryId`, `path`, and `segments` while swapping `children` — the
exact property that makes prune-not-rebuild work.

**3. Recursive fold over directories** (`src/web/model/file-tree.ts:53-62`) — the TREE-02 descendant count is the same walk with a different accumulator:

```ts
function collectDirectoryIds(
  nodes: readonly FileTreeNode[],
  output: string[],
): void {
  for (const node of nodes) {
    if (node.kind === 'directory') {
      output.push(node.directoryId);
      collectDirectoryIds(node.children, output);
    }
  }
}
```

**4. Derived-value site for `tabbableRowId`** (`src/web/model/file-tree.ts:120-131`) — everything derived from the projection is computed once here, before the closures capture it. `tabbableRowId` belongs in this block, not in a component:

```ts
function createModel(
  tree: readonly FileTreeNode[],
  allDirectoryIds: readonly string[],
  expandedDirectoryIds: readonly string[],
  focusedRowId: string | null,
  selectedFileId: string | null,
): FileTreeModel {
  const expanded = new Set(expandedDirectoryIds);
  const visibleRows: VisibleFileTreeRow[] = [];
  flattenVisibleRows(tree, expanded, 0, visibleRows);
  const frozenVisibleRows = Object.freeze(visibleRows);
```

**5. Public surface** (`src/web/model/file-tree.ts:243-255`) — `query`, `setQuery`, and `tabbableRowId` must be added to both the `FileTreeModel` interface (`:33-43`) and this frozen literal:

```ts
  model = Object.freeze({
    tree,
    visibleRows: frozenVisibleRows,
    expandedDirectoryIds,
    focusedRowId,
    selectedFileId,
    focusRow,
    toggleDirectory,
    selectFile,
    handleKey,
  });
  return model;
}
```

**6. Factory seeding** (`src/web/model/file-tree.ts:257-275`) — `createFileTreeModel` seeds an empty query and is where the all-expanded default lives:

```ts
export function createFileTreeModel(
  files: readonly SessionFile[],
): FileTreeModel {
  const tree = buildFileTree(files);
  const directoryIds: string[] = [];
  collectDirectoryIds(tree, directoryIds);
  const expandedDirectoryIds = Object.freeze(directoryIds);
  const initialRows: VisibleFileTreeRow[] = [];
  flattenVisibleRows(tree, new Set(directoryIds), 0, initialRows);
  const initialLeaf = initialRows.find((row) => row.kind === 'file');

  return createModel(
    tree,
    expandedDirectoryIds,
    expandedDirectoryIds,
    initialLeaf?.rowId ?? null,
    initialLeaf?.kind === 'file' ? initialLeaf.fileId : null,
  );
}
```

`initialLeaf` is the *first tree leaf*, which is why it diverges from
`App.vue`'s first *reviewable* file — the root cause behind the `tabindex` defect.

**7. Keyboard transitions to preserve verbatim** (`src/web/model/file-tree.ts:213-239`) — TREE-03 says these must survive; they operate on `frozenVisibleRows`, so a filtered projection changes what they traverse without changing this code:

```ts
    if (key === 'ArrowRight') {
      if (focused.kind === 'file') {
        return model;
      }
      if (!expanded.has(focused.directoryId)) {
        return toggleDirectory(focused.directoryId);
      }
      const firstChild = frozenVisibleRows[focusedIndex + 1];
      return firstChild !== undefined && firstChild.depth > focused.depth
        ? focusRow(firstChild.rowId)
        : model;
    }
    if (key === 'ArrowLeft') {
      if (
        focused.kind === 'directory' &&
        expanded.has(focused.directoryId)
      ) {
        return toggleDirectory(focused.directoryId);
      }
      const parent = findParentDirectoryRowId(tree, focused.rowId);
      return parent === undefined || parent === null ? model : focusRow(parent);
    }
```

**Caution — `expanded` vs. filter-forced expansion:** `handleKey` closes over
`expanded` (`:127`), built from `expandedDirectoryIds`. If filter-forced
expansion is smuggled into `expandedDirectoryIds`, `ArrowLeft` on a
force-expanded directory would mutate the user's snapshot and break TREE-05.

---

### `src/domain/file-tree.ts` (domain, read-only reference)

**Not modified.** Excerpted because the filter must preserve what it produces.

**Identity minting the filter must not re-run** (`src/domain/file-tree.ts:145-169`):

```ts
function projectDirectory(directory: MutableDirectory): ProjectedNode {
  const segments: ExactPath[] = [directory.segment];
  let compacted = directory;

  while (
    compacted.files.length === 0 &&
    compacted.directories.size === 1
  ) {
    const child = compacted.directories.values().next()
      .value as MutableDirectory;
    segments.push(child.segment);
    compacted = child;
  }

  const children = projectChildren(compacted);
  return {
    node: Object.freeze({
      kind: 'directory',
      directoryId: `directory_${compacted.path.bytesBase64url}`,
      path: compacted.path,
      segments: Object.freeze(segments),
      children: children.nodes,
    }),
    firstFile: children.firstFile!,
  };
}
```

`directoryId` is derived from the **compacted** path. Filtering by rebuilding
would re-run the `while` loop over a smaller child set, mint a different
`directoryId`, and change the visible label (`a/` → `a/b/`). Prune instead.

**Type the pruned node must satisfy** (`src/domain/file-tree.ts:17-23`) — note there is no count field; TREE-02's count is folded client-side, not added here:

```ts
export interface FileTreeDirectory {
  readonly kind: 'directory';
  readonly directoryId: string;
  readonly path: ExactPath;
  readonly segments: readonly ExactPath[];
  readonly children: readonly FileTreeNode[];
}
```

**Ordering the prune must preserve** (`src/domain/file-tree.ts:202-215`) — order is established once at build time by byte comparison; a prune that keeps relative child order inherits it for free:

```ts
export function buildFileTree(
  files: readonly SessionFile[],
): readonly FileTreeNode[] {
  const projectedFiles = files
    .map((file) => ({ file, effectivePath: effectivePath(file) }))
    .sort(orderProjectedFiles);
  const root: MutableRoot = { directories: new Map(), files: [] };

  for (const projected of projectedFiles) {
    insertProjectedFile(root, projected);
  }

  return projectChildren(root).nodes;
}
```

**Match field for the filter predicate** (`src/domain/file-tree.ts:10-15`) — `effectivePath` is already status-resolved on the leaf, so matching it is consistent with what the row renders:

```ts
export interface FileTreeLeaf {
  readonly kind: 'file';
  readonly fileId: string;
  readonly file: SessionFile;
  readonly effectivePath: ExactPath;
}
```

---

### `src/web/components/FileTree.vue` (component, container/event-driven)

**Analog:** itself for model wiring; `DriftExportAcknowledgement.vue` for the local-state input binding.

**Model-transition handler shape** (`src/web/components/FileTree.vue:67-69`) — the query handler is one more of these, but must **not** route through `applyModel`, because `applyModel` calls `focusModelRow()` and would steal DOM focus out of the input:

```ts
function toggleDirectory(directoryId: string): void {
  applyModel(model.value.toggleDirectory(directoryId));
}
```

**Assign-without-focus precedent** (`src/web/components/FileTree.vue:138-146`) — this watcher already assigns `model.value` directly, bypassing `applyModel`. The query handler copies this, not the handler above:

```ts
watch(
  () => props.initialSelectedFileId,
  (fileId) => {
    if (fileId !== undefined) {
      model.value = model.value.selectFile(fileId);
    }
  },
  { immediate: true },
);
```

**Focus side effect to avoid on keystroke** (`src/web/components/FileTree.vue:28-39`):

```ts
function focusModelRow(): void {
  const focusedRowId = model.value.focusedRowId;
  if (focusedRowId === null) {
    return;
  }
  void nextTick(() => {
    const row = Array.from(
      treeElement.value?.querySelectorAll<HTMLElement>('[role="treeitem"]') ?? [],
    ).find((candidate) => candidate.dataset.rowId === focusedRowId);
    row?.focus();
  });
}
```

`[role="treeitem"]` + `dataset.rowId` are contractual here — the tree DOM contract
cannot drop either attribute.

**Keydown guard that must keep working over a filtered projection** (`src/web/components/FileTree.vue:71-85`):

```ts
function handleKeydown(event: KeyboardEvent): void {
  const supportedKeys: readonly FileTreeNavigationKey[] = [
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
    'Enter',
    ' ',
  ];
  if (!supportedKeys.includes(event.key as FileTreeNavigationKey)) {
    return;
  }
```

The handler is bound on `<ul role="tree">` (`:169`), so a filter `<input>` placed
**outside** that `<ul>` will not have its space bar or arrow keys swallowed. Keep
the input a sibling of the tree, not a descendant.

**Existing header + landmark to preserve** (`src/web/components/FileTree.vue:161-172`) — do not add a third "Changed files" landmark; the filter and header restyle happen inside this `<nav>`:

```vue
  <nav ref="paneElement" class="file-tree-pane" aria-label="Changed files">
    <h2 id="changed-files-heading" ref="headingElement" tabindex="-1">
      Changed files ({{ files.length }})
    </h2>
    <ul
      ref="treeElement"
      class="file-tree"
      role="tree"
      aria-label="Changed files"
      aria-labelledby="changed-files-heading"
      @keydown="handleKeydown"
    >
```

**Scroll owner note** (`src/web/components/FileTree.vue:115-123`) — `paneElement` is the scroll target exposed to `App.vue`; if the scroller moves below the filter, these must follow it:

```ts
function getScrollPosition(): number {
  return paneElement.value?.scrollTop ?? 0;
}

function setScrollPosition(position: number): void {
  if (paneElement.value !== undefined) {
    paneElement.value.scrollTop = position;
  }
}
```

**Local reactive state bound to a control** (`src/web/components/DriftExportAcknowledgement.vue:24` and `:59-60`) — the only `v-model`-to-local-`ref` binding in `src/web`; the closest analog for `const query = ref('')`:

```ts
const acknowledged = ref(false);
```

```vue
      <label class="export-drift__consent">
        <input v-model="acknowledged" type="checkbox" :disabled="pending">
```

**Icon button with an accessible name and a plain emit** (`src/web/components/ReviewToolbar.vue:40-47`) — the shape for the `Clear file filter` button:

```vue
        <button
          type="button"
          class="ui-button ui-button--icon"
          aria-label="Next file"
          :disabled="atLastFile || !hasActiveFile"
          @click="emit('nextFile')"
        >
          <UiIcon name="next-file" />
        </button>
```

**No-match empty state** (`src/web/components/ReviewPanel.vue:563-566`) — heading + body inside a `<section aria-labelledby>`; the phase's `No matching files` state clones this, with a fresh id (never reuse `changed-files-heading`):

```vue
        <section v-if="resolvedCount === 0" class="review-panel__empty" aria-labelledby="no-resolved-comments-heading">
          <h4 id="no-resolved-comments-heading">No resolved comments</h4>
          <p>Resolved comments will remain available here.</p>
        </section>
```

---

### `src/web/components/FileRow.vue` (component, presentational leaf)

**Analog:** itself — the full row is the template for the dense restyle.

**Full row anatomy** (`src/web/components/FileRow.vue:41-74`). The `:tabindex` on
line 49 is the single line the TREE-03 fix changes (`focused ? 0 : -1` →
`tabbable ? 0 : -1`); the descendant order on lines 56-73 is what composes the
accessible name and must not be reordered:

```vue
  <li role="none">
    <div
      :id="rowId"
      class="tree-row file-row"
      :class="{ 'tree-row--selected': selected }"
      role="treeitem"
      :aria-level="level"
      :aria-selected="selected"
      :tabindex="focused ? 0 : -1"
      :data-row-id="rowId"
      :data-file-id="leaf.fileId"
      :style="{ '--tree-indent': `${8 + (level - 1) * 16}px` }"
      @focus="emit('focusRow', rowId)"
      @click="emit('activate', leaf.fileId)"
    >
      <StatusBadge :kind="leaf.file.status.kind" />
      <PathDisplay :file="leaf.file" />
      <span class="line-counts" :aria-label="countLabel">
        <template v-if="leaf.file.additions !== null && leaf.file.deletions !== null">
          <span class="line-counts__added" aria-hidden="true">+{{ leaf.file.additions }}</span>
          <span class="line-counts__deleted" aria-hidden="true">−{{ leaf.file.deletions }}</span>
        </template>
        <span v-else aria-hidden="true">—</span>
      </span>
      <span
        class="availability-marker"
        :class="[
          `availability-marker--${leaf.file.availability.kind}`,
          { 'visually-hidden': leaf.file.availability.kind === 'text' },
        ]"
      >
        {{ availabilityLabel }}
      </span>
    </div>
  </li>
```

Line 52 is the indentation formula the UI-SPEC re-expresses in tokens
(`8 + (level - 1) * 16` → `calc(var(--space-2) + (level - 1) * var(--space-4))`);
it is already the mockup's formula, so the *values* do not change.

**Pluralized accessible label built in a `computed`** (`src/web/components/FileRow.vue:22-29`) — the directory count label (`1 changed file` / `N changed files`) copies this exact singular/plural ternary style:

```ts
const countLabel = computed(() => {
  const { additions, deletions } = props.leaf.file;
  if (additions === null || deletions === null) {
    return 'Line counts unavailable';
  }
  return `${additions} ${additions === 1 ? 'addition' : 'additions'}, ${deletions} ${deletions === 1 ? 'deletion' : 'deletions'}`;
});
```

---

### `src/web/components/DirectoryRow.vue` (component, recursive presentational)

**Analog:** `FileRow.vue:41-74` (above) for the count span and the `:tabindex` binding.

**Current row** (`src/web/components/DirectoryRow.vue:33-51`) — gains a `/` suffix on the path and a count span; `aria-expanded` and `aria-selected="false"` stay:

```vue
  <li role="none">
    <div
      :id="rowId"
      class="tree-row directory-row"
      role="treeitem"
      :aria-level="level"
      :aria-expanded="expanded"
      aria-selected="false"
      :tabindex="focusedRowId === rowId ? 0 : -1"
      :data-row-id="rowId"
      :style="{ '--tree-indent': `${8 + (level - 1) * 16}px` }"
      @focus="emit('focusRow', rowId)"
      @click="emit('toggleDirectory', directory.directoryId)"
    >
      <span class="directory-row__disclosure" aria-hidden="true">
        {{ expanded ? '▾' : '▸' }}
      </span>
      <span class="directory-row__path">{{ displayPath }}</span>
    </div>
```

The disclosure glyphs `▾`/`▸` already match the mockup; no icon package needed.

**Compacted display path** (`src/web/components/DirectoryRow.vue:27-29`) — joins `segments`, which is how compaction stays visible; a pruned node keeps the same array:

```ts
const displayPath = computed(() =>
  props.directory.segments.map((segment) => segment.display).join('/'),
);
```

**Recursion + prop drilling** (`src/web/components/DirectoryRow.vue:53-56`) — any new prop (e.g. `tabbableRowId`) must be threaded through both this recursive call and the `FileRow` branch below it, and through `FileTree.vue:173-199`:

```vue
    <ul v-if="expanded" class="tree-group" role="group">
      <template v-for="child in directory.children" :key="child.kind === 'file' ? child.fileId : child.directoryId">
        <DirectoryRow
```

---

### `src/web/components/PathDisplay.vue` (component, presentational)

**Analog:** itself — the move branch already proves the "visible text ≠ accessible name" mechanism the basename change needs.

**`aria-label` + `title` carrying full identity while children are `aria-hidden`** (`src/web/components/PathDisplay.vue:31-43`):

```vue
  <span
    v-if="isMove && file.oldPath !== undefined && file.newPath !== undefined"
    class="path-display"
    :aria-label="moveLabel"
    :title="moveLabel"
  >
    <span aria-hidden="true" class="path-display__old"><PathText :display="file.oldPath.display" /></span>
    <span aria-hidden="true" class="path-display__arrow">→</span>
    <span aria-hidden="true" class="path-display__new"><PathText :display="file.newPath.display" /></span>
  </span>
  <span v-else class="path-display" :title="effectivePath?.display">
    <PathText v-if="effectivePath !== undefined" :display="effectivePath.display" />
  </span>
```

The `v-else` branch on line 41 has `:title` but **no** `:aria-label` — so its
accessible name is currently the visible text. Rendering a basename there without
adding an `:aria-label` would silently shorten the row's accessible name and break
`tests/e2e/pinned-session.spec.ts` path assertions. The `v-if` branch is the
pattern to copy.

**Move label copy to preserve verbatim** (`src/web/components/PathDisplay.vue:21-27`):

```ts
const moveLabel = computed(() => {
  if (!isMove.value || props.file.oldPath === undefined || props.file.newPath === undefined) {
    return undefined;
  }
  const verb = props.file.status.kind === 'copied' ? 'copied' : 'renamed';
  return `${verb} from ${props.file.oldPath.display} to ${props.file.newPath.display}`;
});
```

**Shared-component caution:** `PathDisplay` is also rendered inside the workspace
`<h1>` (`src/web/App.vue:1188`). Basename display must be opt-in via a prop, not
the new default.

---

### `src/web/components/StatusBadge.vue` (component, presentational)

**Analog:** itself. No logic change expected — the mapping is already the UI-SPEC's mapping. It is the canonical *visually-hidden accessible name* pattern (`src/web/components/StatusBadge.vue:30-33`):

```vue
  <span class="status-badge" :class="`status-badge--${presentation.tone}`">
    <span aria-hidden="true">{{ presentation.text }}</span>
    <span class="visually-hidden">{{ presentation.label }}</span>
  </span>
```

Same pattern elsewhere: `src/web/components/ReceiptFileRow.vue:40`,
`src/web/components/IdentityHeader.vue:80-82`, `src/web/App.vue:1372-1374`.

---

### `src/web/styles.css` (config, canonical token root + rules)

**Analog:** itself, plus commit `532abdf` for the token-with-consumer precedent.

**Geometry token declaration block** (`src/web/styles.css:118-139`) — where the four new tokens go; note the `/* Approved continuity — … */` comment convention on any value carried over rather than derived:

```css
  /* Approved continuity — existing file-tree nesting geometry. */
  --tree-indent: 20px;
  --radius-overlay: 10px;
  /* Approved continuity — D-INFORMATION retains the existing badge radius. */
  --radius-pill: 999px;
  --border-width-default: 1px;
  --focus-outline-width: 2px;
  --focus-offset: 3px;
  --selected-rail-width: 3px;
  --control-height-standard: 36px;
  /* Approved continuity — UI-SPEC:23 icon geometry. */
  --icon-size: 16px;
  /* Approved continuity — styles.css:73 overlay separation. */
  --shadow-overlay: 0 8px 24px rgb(0 0 0 / 40%);

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  /* Approved continuity — UI-SPEC:61 retained spacing token. */
  --space-8: 32px;
```

`--space-5` is absent between `--space-4` (`:136`) and `--space-6` (`:137`); insert it in sequence.

**Row rules to rewrite** (`src/web/styles.css:940-974`):

```css
.tree-row {
  display: grid;
  min-height: 40px;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  padding-left: var(--tree-indent);
  border-bottom: 1px solid var(--border-default);
  color: var(--text-primary);
  cursor: default;
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-body);
}

.review-files .tree-row {
  min-height: 44px;
  font-size: var(--font-size-body);
  line-height: var(--line-height-body);
}

.review-files .tree-row:focus-visible {
  outline-offset: calc(var(--focus-outline-width) * -1);
}

.tree-row:hover {
  background: var(--surface-interactive-hover);
}

.tree-row--selected {
  border-left: var(--selected-rail-width) solid var(--selection-border);
  background: var(--selection-background);
  box-shadow: none;
  font-weight: var(--font-weight-semibold);
}
```

Three load-bearing details: `padding-left: var(--tree-indent)` at `:946` is the
**only** consumer of `--tree-indent` (removing it fails the no-orphan gate);
`.review-files .tree-row { min-height: 44px }` at `:955-959` is the mobile density
bump the UI-SPEC retires; `.tree-row--selected` at `:969` is on the gate's
inset-shadow allowlist (`scripts/verify-semantic-css.mjs:226`) and in the
forced-colors block — the class name cannot be renamed.

**Visually-hidden utility already available** (`src/web/styles.css:901-911`) — reuse, do not redefine:

```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

**Empty-state class already available** (`src/web/styles.css:896-899`):

```css
.empty-state {
  width: min(100%, 680px);
  text-align: center;
}
```

**Outer scroll owner that must stay** (`src/web/styles.css:1298-1301`) — `tests/e2e/responsive-session.spec.ts:1459` asserts this computed value:

```css
.review-files {
  overflow-y: auto;
  border-right: 1px solid var(--border-default);
}
```

**Current pane header rule** (`src/web/styles.css:928-931`) — the `--space-5` consumer replaces/extends this:

```css
.file-tree-pane h2 {
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-default);
}
```

**Forced-colors repair to preserve** (`src/web/styles.css:2695-2703`) — new rules go **before** the `@media (forced-colors: active)` block at `:2649`; the gate requires it be the single terminal media block:

```css
  .tree-row--selected,
  .view-tab[aria-selected="true"] {
    border-color: Highlight;
    background: Highlight;
    color: HighlightText;
  }

  .tree-row--selected {
    box-shadow: inset var(--selected-rail-width) 0 Highlight;
  }
```

---

### `scripts/css-token-contract.mjs` (config, drift-gate allowlist)

**Analog:** itself — `CANONICAL_TOKENS` at `scripts/css-token-contract.mjs:1-27` is a flat, alphabetically sorted, multi-per-line array. Insert the four names in sort position (`--file-row-min-height` after `--destructive-foreground`'s diff block start, `--radius-file-row` / `--radius-scrollbar` beside `--radius-control`, `--space-5` between `--space-4` and `--space-6`):

```js
  '--radius-control', '--radius-overlay', '--radius-pill', '--scrollbar-thumb', '--selected-rail-width',
  '--selection-background', '--selection-border', '--shadow-overlay', '--space-1', '--space-2', '--space-3', '--space-4',
  '--space-6', '--space-8', '--status-added-background', '--status-added-border', '--status-added-foreground',
```

**The gate that forces declaration and consumer to land together** (`scripts/verify-semantic-css.mjs:91-107`):

```js
function assertDeclaredTokensConsumed(rule, sources) {
  const declared = new Set(rule.declarations
    .filter(({ property }) => property.startsWith('--'))
    .map(({ property }) => property));
  const referenced = new Set(sources.flatMap((source) => [
    ...source.matchAll(/var\(\s*(--[\w-]+)/g),
    ...source.matchAll(/\bcolor\(\s*['"](--[\w-]+)['"]\s*\)/g),
  ].map(([, name]) => name)));
  const dependencies = new Map(rule.declarations
    .filter(({ property }) => property.startsWith('--'))
    .map(({ property, value }) => [property, [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map(([, name]) => name)]));
  for (const token of referenced) {
    for (const dependency of dependencies.get(token) ?? []) referenced.add(dependency);
  }
  const unused = [...declared].filter((name) => !referenced.has(name));
  if (unused.length !== 0) fail(`canonical tokens have no consumer: ${unused.join(', ')}`);
}
```

Call site (`scripts/verify-semantic-css.mjs:417`) — the searched sources are the CSS minus the root, all `src/web` sources, and the Monaco theme:

```js
assertDeclaredTokensConsumed(sourceRoot, [source.replace(sourceRoot.body, ''), ...webSources, monacoThemeSource]);
```

**Style gate that constrains the new clear button** (`scripts/verify-semantic-css.mjs:225-229`):

```js
  const insetAllowlist = new Map([
    ['.tree-row--selected', 'inset var(--selected-rail-width) 0 var(--selection-border)'],
    ['.view-tab[aria-selected="true"]', 'inset 0 calc(var(--selected-rail-width) * -1) var(--selection-border)'],
    ['.monaco-editor .monaco-anchor-line', 'inset var(--selected-rail-width) 0 var(--interactive-accent)'],
  ]);
```

---

### Phase 08 precedent: token declared **with** its consumer in one change

**Commit `532abdf` — "fix: reconcile semantic visual foundation audits."** This is
the exact three-part move Phase 09 must repeat for its four tokens. In one commit:

1. Name added to the allowlist — `scripts/css-token-contract.mjs`:
```diff
+  '--border-control', '--border-default', '--border-gap', '--border-hunk', '--border-overlay', '--border-width-default',
```

2. Value declared in the canonical `:root` — `src/web/styles.css:26`:
```diff
+  --border-overlay: #596678;
```

3. Consumer added in the same commit — `src/web/styles.css:706`:
```diff
+  border: 1px solid var(--border-overlay);
```

Same commit does the same for `--interactive-accent-emphasis-hover`
(declared `styles.css:32`, consumed at `styles.css:574` in `.ui-button--primary:hover:not(:disabled)`) and `--status-added-*`
(declared `styles.css:47-49`, consumed `:396-398` in `.status-badge--added, .line-counts__added`).

**Counter-example worth reading:** commit `823d8f4` ("make semantic geometry
authoritative") *deleted* `--border-overlay`, `--control-height-compact`,
`--dialog-width`, `--diff-row-height` and friends precisely because they had no
consumer. A predeclared Phase 10/11 token would be deleted the same way.

---

### `tests/unit/file-tree.test.ts` (test, unit)

**Analog:** itself — three existing tests establish the style for the new filter tests.

**Helpers to reuse** (`tests/unit/file-tree.test.ts:20-24`, `:79-88`) — build paths and find rows through these, do not hand-roll:

```ts
function exactPath(value: string | readonly number[]): ExactPath {
  return createExactPath(
    typeof value === 'string' ? encoder.encode(value) : Uint8Array.from(value),
  );
}
```

```ts
function row(
  model: FileTreeModel,
  predicate: (candidate: VisibleFileTreeRow) => boolean,
): VisibleFileTreeRow {
  const match = model.visibleRows.find(predicate);
  if (match === undefined) {
    throw new Error('Missing visible row');
  }
  return match;
}
```

**Ordering/structure style — assert the whole projection as a tuple array** (`tests/unit/file-tree.test.ts:310-325`). A filter test asserting the pruned projection should use this same `visibleRows.map(...)` → `toEqual([...])` shape:

```ts
  it('starts fully expanded with the first deterministic leaf focused and selected', () => {
    const model = createFileTreeModel(navigationFiles());
    const firstLeaf = model.visibleRows.find((candidate) => candidate.kind === 'file');

    expect(model.visibleRows.map((candidate) => [candidate.kind, candidate.depth])).toEqual([
      ['directory', 0],
      ['file', 1],
      ['directory', 1],
      ['file', 2],
      ['file', 0],
    ]);
    expect(firstLeaf?.kind).toBe('file');
    expect(model.focusedRowId).toBe(firstLeaf?.rowId);
    expect(model.selectedFileId).toBe(fileId(0));
    expect(model.expandedDirectoryIds).toHaveLength(2);
  });
```

**Expansion + selection style — chain transitions, name each intermediate model** (`tests/unit/file-tree.test.ts:327-363`). The TREE-05 restore test (`setQuery(q)` → `setQuery('')`) clones this chaining and its "selection survives" assertion after every step:

```ts
  it('expands, collapses, and enters children without replacing file selection with a directory', () => {
    const initial = createFileTreeModel(navigationFiles());
    const aDirectory = row(
      initial,
      (candidate) =>
        candidate.kind === 'directory' && candidate.path.utf8 === 'a',
    );
    if (aDirectory.kind !== 'directory') {
      throw new Error('Expected directory row');
    }

    const focusedDirectory = initial.focusRow(aDirectory.rowId);
    expect(focusedDirectory.selectedFileId).toBe(fileId(0));

    const collapsed = focusedDirectory.handleKey('ArrowLeft');
    expect(collapsed.visibleRows.map((candidate) => candidate.kind)).toEqual([
      'directory',
      'file',
    ]);
    expect(collapsed.focusedRowId).toBe(aDirectory.rowId);
    expect(collapsed.selectedFileId).toBe(fileId(0));
```

**Keyboard style — one test covering the whole key matrix** (`tests/unit/file-tree.test.ts:365-380`). Keyboard behaviour under a filter belongs in a test shaped like this, not split per key:

```ts
  it('applies Arrow, Home, End, Enter, and Space transitions over visible rows with roving file selection', () => {
    const initial = createFileTreeModel(navigationFiles());

    const downToDirectory = initial.handleKey('ArrowDown');
    expect(
      row(
        downToDirectory,
        (candidate) => candidate.rowId === downToDirectory.focusedRowId,
      ).kind,
    ).toBe('directory');
    expect(downToDirectory.selectedFileId).toBe(fileId(0));
```

**Fixture builder for model tests** (`tests/unit/file-tree.test.ts:293-308`) — `navigationFiles()` is the shared 3-file/2-directory fixture; filter tests should reuse it rather than inventing a new tree, so the pruned-vs-full assertions compare against the already-asserted baseline at `:314-320`.

---

### `tests/e2e/file-tree.spec.ts` (test, e2e)

**Analog:** itself — `:328-345` is both the assertion style and the defect site.

**The failing assertion this phase fixes** (`tests/e2e/file-tree.spec.ts:328-334`) — line 331 is the roving-tabindex defect; the assertion is correct and stays, the implementation changes:

```ts
    const selectedLeaf = tree.locator('[role="treeitem"][aria-selected="true"]');
    await expect(selectedLeaf).toHaveCount(1);
    await expect(selectedLeaf).toHaveAttribute('aria-level', /\d+/);
    await expect(selectedLeaf).toHaveAttribute('tabindex', '0');
    await expect.poll(() => fileRequests.length).toBeGreaterThan(0);
```

**Accessible-name assertion style** (`tests/e2e/file-tree.spec.ts:335-345`) — rows are located by composed accessible name via case-insensitive regex, never by CSS text. New filter assertions must follow this, and the `Modified → path → counts → availability` ordering inside the regex is the contract Phase 09 must preserve:

```ts
    const modifiedRow = tree.getByRole('treeitem', {
      name: /Modified.*tracked\.txt.*\d+ additions?.*1 deletion.*Text/i,
    });
    await expect(modifiedRow).toBeVisible();
    const rowBox = await modifiedRow.boundingBox();
    expect(rowBox?.height).toBeGreaterThanOrEqual(40);

    const unsupportedRow = tree.getByRole('treeitem', {
      name: /Added.*binary\.dat.*Line counts unavailable.*Unsupported/i,
    });
    await expect(unsupportedRow).toBeVisible();
    await expect(unsupportedRow.getByText('Unsupported', { exact: true })).toBeVisible();
```

Line 339's `>= 40` is the density assertion the `34px` contract forces down.

**Landmark/tree scoping style** (`tests/e2e/file-tree.spec.ts:322-324`) — every locator descends from the named navigation, which is why the "do not add a third landmark" rule matters:

```ts
    const navigation = page.getByRole('navigation', { name: 'Changed files' });
    const tree = navigation.getByRole('tree', { name: 'Changed files' });
    await expect(navigation.getByRole('heading', { name: /^Changed files \(\d+\)$/ })).toBeVisible();
```

The heading regex is anchored (`/^…$/`), so the visible `Files`/`Changed`/count
split must still resolve to the exact accessible name `Changed files (N)` —
achievable with the `visually-hidden` pattern from `StatusBadge.vue:32`.

---

### `tests/e2e/responsive-session.spec.ts` (test, e2e)

**Analog:** `tests/e2e/file-tree.spec.ts` (above). Only the changed-file portions
move; the contractual selectors these tests key on —
`.tree-row--selected` (`:548`), row height `<= 48` (`:562-568`),
`.file-tree .file-row` (`:982-989`), header path text (`:1088-1092`),
`.review-files` `overflow-y: auto` (`:1459-1460`) — are all preserved by keeping
class names and the outer scroll owner intact.

---

## Shared Patterns

### Immutable transition + identity reuse
**Source:** `src/web/model/file-tree.ts:174-183`
**Apply to:** every new model capability (`setQuery`, focus re-homing)
Return a brand-new frozen model from `createModel(...)`; return the existing
`model` instance unchanged when nothing moved.

### Accessible name composed from row descendants
**Source:** `src/web/components/StatusBadge.vue:30-33`; CSS `src/web/styles.css:901-911`
**Apply to:** directory count span, header `Files`/`Changed`/count split, any row part whose visible text is shorter than its meaning
Visible glyph gets `aria-hidden="true"`; the full name goes in a sibling
`.visually-hidden` span or an `aria-label` on the wrapper.

### Row-local geometry via inline custom property
**Source:** `src/web/components/FileRow.vue:52`, `src/web/components/DirectoryRow.vue:43`; consumed at `src/web/styles.css:946`
**Apply to:** indentation on both row components
One shared CSS rule reads `var(--tree-indent)`; the per-row value is injected
inline. Keep at least one `var(--tree-indent)` reference or the no-orphan gate fails.

### Token declaration paired with its consumer
**Source:** commit `532abdf`; enforced by `scripts/verify-semantic-css.mjs:91-107,417`
**Apply to:** all four of `--space-5`, `--radius-file-row`, `--radius-scrollbar`, `--file-row-min-height`
Allowlist entry + `:root` declaration + at least one `var()` reference in
`src/web`, all in the same change.

### Prop drilling through the recursive tree
**Source:** `src/web/components/DirectoryRow.vue:53-79`, `src/web/components/FileTree.vue:173-199`
**Apply to:** `tabbableRowId` and any other new row-level input
Every prop must be threaded through three sites: the `FileTree` root loop, the
`DirectoryRow` recursive branch, and the `DirectoryRow` → `FileRow` branch.

### Prune, never rebuild
**Source:** `src/domain/file-tree.ts:145-169` (identity minting), `src/web/model/file-tree.ts:65-93` (spread-preserving walk)
**Apply to:** the filtered projection
`Object.freeze({ ...node, children })` keeps `directoryId`, `path`, and `segments`
byte-identical; `buildFileTree(filteredFiles)` would not.

---

## No Analog Found

| File / capability | Role | Data Flow | Reason |
|---|---|---|---|
| Filter field: `<input type="search">` bound to a local `ref` | component (control) | event-driven | `src/web` contains **no** single-line text input. Nearest: `DriftExportAcknowledgement.vue:24,60` (local `ref` + `v-model`, but a checkbox) and `SummarySection.vue:188-197` / `CommentComposer.vue:56-67` (label-wrapped `<textarea>` with `:value` + `@input`, but emits upward instead of holding local state). Combine the two: local `ref('')` + `v-model` on a native `<input type="search">`. |
| Scrollbar thumb radius consumer for `--radius-scrollbar` | config (CSS) | n/a | No `::-webkit-scrollbar*`, `scrollbar-color`, or `scrollbar-width` rule exists anywhere in `src/web/styles.css`. `--scrollbar-thumb` (`:37`) is consumed only by Monaco at `src/web/monaco/theme.ts:101` via `color('--scrollbar-thumb')`. The tree scroller rule will be the repo's first native scrollbar rule — no in-repo precedent for its selector shape. |

---

## Metadata

**Analog search scope:** `src/web/model`, `src/web/components`, `src/web/monaco`, `src/web/App.vue`, `src/web/styles.css`, `src/domain`, `scripts`, `tests/unit`, `tests/e2e`, plus `git log`/`git show` on `532abdf`, `823d8f4`, `88bb75a`
**Files scanned:** 18 read, 9 grep sweeps
**Pattern extraction date:** 2026-09-13
