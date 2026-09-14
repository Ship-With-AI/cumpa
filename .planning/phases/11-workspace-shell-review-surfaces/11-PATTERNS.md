# Phase 11: Workspace Shell & Review Surfaces - Pattern Map

**Mapped:** 2026-09-13
**Files analyzed:** 20 (7 new, 12 modified, 1 deleted)
**Analogs found:** 18 / 20
**Repo read:** `/Users/alessandro/.omp/wt/restyle-dc04bec` — every `file:line` below re-verified by direct `read`/`grep` in this session, not copied from `11-RESEARCH.md`.
**Contradictions found:** 7 (3 stale line citations, 4 test-surface claims disproven) — see the two contradiction sections.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/web/components/ui/ModalDialog.vue` **(NEW)** | ui primitive | event-driven (keydown/focus) | `src/web/components/SupportDialog.vue:30-43,53-64` | exact |
| `src/web/components/DetailsDialog.vue` **(NEW)** | dialog host | request-response (prop-driven read) | `src/web/components/IdentityPanel.vue:75-87` + `SupportDialog.vue:53-64` | exact |
| `src/web/components/ReviewNotesDialog.vue` **(NEW)** | dialog host | CRUD (summary/export mutation) | `src/web/components/ReviewPanel.vue:341-404,654-818` | exact |
| `src/web/components/ChangedFilesDialog.vue` **(NEW)** | dialog host | event-driven (select/activate) | `src/web/App.vue:1162-1173` (current narrow drawer) | exact |
| `src/web/components/ActiveFileToolbar.vue` **(NEW)** | component | request-response (display-only) | `src/web/App.vue:1181-1222` (`.review-context-header`) | exact |
| `src/web/components/ShellFooter.vue` **(NEW)** | component | transform (session → 2 strings) | `src/web/components/IdentityHeader.vue:70-73` (`.pin-cue`) | role-match |
| `src/web/components/StaleAnchorNotice.vue` **(NEW)** | component | event-driven (derived count) | `src/web/components/SelectorDriftNotice.vue:41-77` | exact |
| `src/web/App.vue` | shell / state owner | event-driven + request-response | *(itself — self-analog by region, see §Pattern Assignments)* | exact |
| `src/web/components/IdentityHeader.vue` | component | transform | `src/web/components/IdentityHeader.vue:69-107` (in place) | exact |
| `src/web/components/IdentityPanel.vue` | dialog body | request-response | `src/web/components/SupportDialog.vue:30-43` (trap to delete) | exact |
| `src/web/components/ReviewPanel.vue` | component (split) | CRUD | `src/web/components/ReviewPanel.vue:405-653` (rail half survives) | exact |
| `src/web/components/SelectorDriftNotice.vue` | component | event-driven | `src/web/components/CopyButton.vue` (operation-scoped `role=status`) | role-match |
| `src/web/components/FileMetadataPane.vue` | component (revive) | request-response | `src/web/App.vue:293-319` (`getFileContent` fetch) | flow-match |
| `src/web/components/SupportDialog.vue` | dialog host | event-driven | *(becomes `ModalDialog` consumer)* | exact |
| `src/web/components/KeyboardHelp.vue` | component | static | `src/web/components/KeyboardHelp.vue:12-30` (moves, unchanged) | exact |
| `src/web/components/DiffWorkspace.vue` | component | event-driven (layout) | `src/web/components/DiffWorkspace.vue:105-108,245` | exact |
| `src/web/styles.css` | config (stylesheet) | — | `src/web/styles.css:2435-2506` (existing overlay blocks) | exact |
| `scripts/css-token-contract.mjs` | config | — | `scripts/css-token-contract.mjs:1-28` | exact |
| `scripts/verify-semantic-css.mjs` | config (gate) | — | `scripts/verify-semantic-css.mjs:230-233,248-251` | exact |
| `src/web/components/CommentsRail.vue` **(DELETE)** | dead stub | — | *(none — nothing imports it)* | none |

---

## Pattern Assignments

### `src/web/components/ui/ModalDialog.vue` (NEW — ui primitive, event-driven)

**Analog:** `src/web/components/SupportDialog.vue` — the more complete of the two hand-rolled traps.

**Focus-containment pattern to copy verbatim, then widen** (`SupportDialog.vue:30-43`):

```typescript
function containFocus(event: KeyboardEvent): void {
  if (event.key !== 'Tab') return;
  const controls = Array.from(dialog.value?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)') ?? []);
  if (controls.length === 0) return;
  const first = controls[0]!;
  const last = controls.at(-1)!;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
```

**The defect to fix while extracting** (`IdentityPanel.vue:50-58`) — the second copy queries `button` only:

```typescript
function containFocus(event: KeyboardEvent): void {
  if (!props.modal || event.key !== 'Tab') {
    return;
  }
  const panel = event.currentTarget as HTMLElement;
  const controls = Array.from(
    panel.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),   // <- line 56
  );
```

`SupportDialog`'s selector already includes `input`; `IdentityPanel`'s does not. Review notes hosts a `<textarea>` (`SummarySection`, reached via `ReviewPanel.vue:390-404`) and Changed files hosts `<input type="search">` (`FileTree.vue:159-167`) — **neither selector covers `textarea`**, so the extracted primitive must widen to:
`button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])`.

**Root element + ESC + initial-focus pattern** (`SupportDialog.vue:53-65`):

```vue
<template>
  <div v-if="open" class="support-dialog-backdrop">
    <section
      ref="dialog"
      class="support-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-dialog-heading"
      aria-describedby="support-dialog-status"
      @keydown="containFocus"
      @keydown.esc.prevent="emit('close')"
    >
```

**Initial focus** (`SupportDialog.vue:26-28,46-50`):

```typescript
function focusInitial(): void {
  void nextTick(() => initial.value?.focus());
}
watch(() => props.open, (open) => {
  if (open) focusInitial();
});
defineExpose({ focusInitial });
```

**Focus return — currently NOT owned by either dialog.** The host must absorb this. Two flavours exist in `App.vue`:

Captured-opener flavour (`App.vue:237-241,251-254`) — copy this one:

```typescript
function openFiles(): void {
  filesOpener = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
  filesOpen.value = true;
  void nextTick(() => filesDrawer.value?.focus());
}
function closeFiles(): void {
  filesOpen.value = false;
  void nextTick(() => filesOpener?.focus());
}
```

Fixed-trigger flavour with fallback (`App.vue:979-990`) — the more robust shape:

```typescript
function openSupportDialog(): void {
  if (!supportEnabled.value) return;
  supportOpener = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
  supportDialogOpen.value = true;
function closeSupportDialog(): void {
  supportDialogOpen.value = false;
  void nextTick(() => (supportOpener === undefined ? identityHeader.value?.focusSupport() : supportOpener.focus()));
```

Hard-coded-trigger flavour (`App.vue:839-842`) — the one being replaced:

```typescript
function closeIdentity(): void {
  identityOpen.value = false;
  void nextTick(() => identityHeader.value?.focusDisclosure());
}
```

**Contract the primitive must not break** (`tests/e2e/responsive-session.spec.ts:1586-1599`):

```typescript
const dialog = page.getByRole('dialog', { name: 'Comparison identities' });
const close = dialog.getByRole('button', { name: 'Close comparison identities' });
await expect(dialog).toHaveAttribute('aria-modal', 'true');
await expect(close).toBeFocused();
await expect(page.locator('.review-shell')).toHaveAttribute('inert', '');
const copyButtons = dialog.getByRole('button', { name: /^Copy full/ });
await copyButtons.last().focus();
await page.keyboard.press('Tab');
await expect(close).toBeFocused();          // tight wrap — no BODY stop
await page.keyboard.press('Escape');
await expect(dialog).toHaveCount(0);
await expect(disclosure).toBeFocused();     // focus return
```

**Background-inert pattern the host must keep external** (`App.vue:1158-1161`) — the inert target is `.review-shell`, not the dialog:

```vue
<div
  v-else
  class="review-shell"
  :class="{ 'review-shell--files-collapsed': !isFilesDrawer && filesCollapsed }"
  :inert="(identityOpen && identityModal) || supportDialogOpen"
>
```

**ESC routing already centralised** (`App.vue:857-871`) — new dialogs must join this chain, not add a second `document` listener:

```typescript
if (event.key === 'Escape') {
  if (isExactPatchSession.value && identityOpen.value) {
    closeIdentity();
    return;
  }
  if (keyboardHelpOpen.value) {
    keyboardHelpOpen.value = false;
  } else if (commentsOpen.value) {
    closeComments();
  } else if (filesOpen.value) {
    closeFiles();
  } else if (identityOpen.value) {
    closeIdentity();
  }
  return;
}
```

Note `handleKeydown` early-returns for any `input`/`textarea`/`select` target (`App.vue:856`), so a dialog containing the `FileTree` filter input or the summary textarea will **not** receive the global ESC. `SupportDialog` solves this with its own `@keydown.esc.prevent` on the dialog root (`SupportDialog.vue:63`) — the extracted primitive must own ESC locally for exactly this reason.

---

### `src/web/components/DetailsDialog.vue` (NEW — dialog host, request-response)

**Analog:** `src/web/components/IdentityPanel.vue:75-87` (the dual-mode root that collapses to always-modal).

**Current dual-mode root to collapse** (`IdentityPanel.vue:76-87`):

```vue
<section
  :id="panelId"
  class="identity-panel"
  :class="{ 'identity-panel--modal': modal }"
  :role="modal ? 'dialog' : 'region'"
  :aria-modal="modal ? 'true' : undefined"
  :aria-labelledby="headingId"
  @keydown="containFocus"
>
  <button v-if="modal" ref="closeButton" type="button" class="sheet-close-button" @click="emit('close')">
    {{ isExactPatch ? 'Close patch scope' : isRange ? 'Close review scope' : 'Close comparison identities' }}
  </button>
```

Once Details is always modal, `props.modal` and the `identityModal` computed (`App.vue:156-158`) both collapse:

```typescript
const identityModal = computed(() =>
  isExactPatchSession.value ? isCompact.value : isNarrow.value,
);
```
*(verbatim at `App.vue:156-158`; both `identityModal` branches at `App.vue:827` and `App.vue:834` become unconditional.)*

**Content it must host, all pure prop-driven, no writable state to move:**

| Source | Current mount | Root element today |
|---|---|---|
| `IdentityPanel.vue` | `App.vue:1146` — sibling of `.review-shell` | `<section class="identity-panel">` |
| `KeyboardHelp.vue` | `App.vue:1240` — **inside `.review-main`** | `<section v-if="open" class="keyboard-help" aria-labelledby="keyboard-actions-heading">` (`KeyboardHelp.vue:12`) |
| `FileMetadataPane.vue` | *(none — orphaned)* | `<main ref="paneElement" class="file-metadata-pane" aria-label="File details">` (`FileMetadataPane.vue:173`) |

**Copy-value row pattern for OIDs/paths** (`FileMetadataPane.vue:196-213`) — reuse for Details rows:

```vue
<div v-for="entry in pathEntries" :key="entry.copyLabel" class="metadata-value-row">
  <div class="metadata-value-group">
    <span class="metadata-label">{{ entry.label }}</span>
    <code class="metadata-value">{{ entry.value }}</code>
  </div>
  <CopyButton
    :label="entry.copyLabel"
    :value="entry.copyValue"
    failure-message="Could not copy. Select the value and copy it manually."
  />
</div>
```

---

### `src/web/components/FileMetadataPane.vue` (MODIFY/REVIVE — component, request-response)

**Orphan status — verified, not assumed.** `grep "FileMetadataPane" src tests` returns exactly two owners:
- `src/web/components/FileMetadataPane.vue` (itself)
- `tests/e2e/pinned-session.spec.ts:55` — inside a **string literal** Vite harness module, not an app import:

```javascript
const metadataHarnessModule = `
import { createApp, h } from 'vue';
import FileMetadataPane from '/components/FileMetadataPane.vue';
...
export function mountMetadataHarness() {
  createApp({
    setup: () => () => h('main', { id: 'metadata-harness' }, [
      h('section', { id: 'metadata-text' }, [
        h(FileMetadataPane, { file: file({ kind: 'text' }, 'src/safe text.ts'), loading: false, errorMessage: '' }),
      ]),
      ...
```
*(`tests/e2e/pinned-session.spec.ts:53-107`)*

No file under `src/` imports it. **`props.metadata` is never supplied by the app**, because `sessionClient.getFileMetadata` (declared `src/web/api/client.ts:80`, implemented `:271-275`) has **zero callers** — `grep "getFileMetadata" src tests` matches only `client.ts`. Reviving the pane therefore requires new fetch wiring, not just a mount.

**Fetch analog to copy** — `App.vue:293-319`, the `getFileContent` path, has the exact loading/error/stale-response shape needed:

```typescript
  selectedFile.value = file;
  diffError.value = '';
  selectedContent.value = undefined;
  if (file.availability.kind !== 'text') {
    diffLoading.value = false;
    return;
  }

  const version = ++requestVersion;
  diffLoading.value = true;
  try {
    const content = await sessionClient?.getFileContent(file.fileId);
    ...
  } catch (error) {
    if (version === requestVersion) {
      diffError.value = error instanceof SessionClientError ? error.message : FILE_UNAVAILABLE_MESSAGE;
    }
  } finally {
    if (version === requestVersion) {
      diffLoading.value = false;
    }
  }
```

The pane's props map 1:1 onto that shape: `:metadata` ← result, `:loading` ← `metadataLoading`, `:error-message` ← `metadataError`, `@retry` ← re-invoke.

**Exposed API to preserve** (`FileMetadataPane.vue:157-171`):

```typescript
function focusHeading(): void {
  headingElement.value?.focus({ preventScroll: true });
}
function getScrollPosition(): number {
  return paneElement.value?.scrollTop ?? 0;
}
function setScrollPosition(position: number): void {
  if (paneElement.value !== undefined) { paneElement.value.scrollTop = position; }
}
defineExpose({ focusHeading, getScrollPosition, setScrollPosition });
```

**Landmark defect to fix on revival.** The pane's root is a second `<main>` (`FileMetadataPane.vue:173`):

```vue
<main ref="paneElement" class="file-metadata-pane" aria-label="File details">
  <h2 ref="headingElement" tabindex="-1">
    File details — {{ effectivePath?.display }}
  </h2>
```

Mounting that inside a Details dialog puts a `main` landmark inside `role="dialog"` while `.review-main` (`App.vue:1181`) is already the page's `main`. The existing spec locators are name-scoped (`pinned-session.spec.ts:896,1387,1410` all use `getByRole('main', { name: … })`) so Playwright strict mode will not catch it — this is a silent a11y regression. Change the root to `<section>`/`<div>` and keep `aria-label="File details"`; keep `paneElement` for the exposed scroll accessors.

---

### `src/web/components/ReviewNotesDialog.vue` (NEW) + `src/web/components/ReviewPanel.vue` (SPLIT)

**Analog:** `ReviewPanel.vue` itself. Section boundaries **verified by grep against the file**, all matching `11-RESEARCH.md`:

| Lines (verified) | Section | Destination |
|---|---|---|
| `341-342` | `<section ref="root" class="review-panel" aria-labelledby="review-heading" @keydown.escape="closeFromEscape">` | two roots |
| `343-349` | `header.review-panel__heading` + `h2#review-heading` + `.review-panel__heading-counts` | **both** |
| `354-373` | revision-conflict `role="alert"` (`:357`) | Review notes |
| `374-389` | operation-failed `role="alert"` (`:378`) | Review notes |
| `390-404` | `<section class="review-panel__section review-panel__section--summary">` + `<SummarySection>` (`:391`) | Review notes |
| `405-550` | `<section class="review-panel__comments …" aria-labelledby="open-comments-heading">` | Rail |
| `551-653` | `<section class="review-panel__comments …" aria-labelledby="resolved-comments-heading">` | Rail |
| `654-674` | `<section class="review-panel__section review-panel__section--export">` + `<ExportSection>` (`:655`) | Review notes |
| `675-817` | `<section v-if="attached" class="review-panel__section attached-completion" …>` | Review notes |

**Heading contract both halves interact with** (`ReviewPanel.vue:343-349`):

```vue
<header class="review-panel__heading">
  <div>
    <h2 id="review-heading" ref="heading" tabindex="-1">Review</h2>
    <div class="review-panel__heading-counts">
      <ReviewStateBadge kind="open" :label="`Open ${openCount}`" />
      <ReviewStateBadge kind="resolved" :label="`Resolved ${resolvedCount}`" />
    </div>
```

`#review-heading` is the skip-link target (`App.vue:1128`) **and** the rail's initial-focus target (`App.vue:256-260`):

```typescript
function openComments(): void {
  commentsOpener = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
  commentsOpen.value = true;
  void nextTick(() => commentsDrawer.value?.querySelector<HTMLElement>('#review-heading')?.focus());
}
```

Only one half may own `id="review-heading"` — the rail, per `complete-review-draft.spec.ts:326-327`.

**Cross-half handler that must be promoted to `App.vue`** (`ReviewPanel.vue:150-153`, triggered from `:740` inside the attached-completion block which moves to Review notes, but which scrolls/focuses comment cards that stay in the rail):

```typescript
function focusStaleFeedback(): void {
  const result = props.attachedFailure;
  if (result?.kind !== 'staleAnchors') return;
```

```vue
<button type="button" class="ui-button" @click="focusStaleFeedback">Review stale feedback</button>
```

**Prop surface to split, not narrow.** The current mount passes ~25 props (`App.vue:1316-1357`). Both halves need `comments` + `commentBuffers`, because the Review-notes side derives readiness from rail data (`ReviewPanel.vue:132-135` reads `props.comments` buffers).

---

### `src/web/components/ChangedFilesDialog.vue` (NEW — dialog host, event-driven)

**Analog:** the current narrow drawer, `App.vue:1162-1173`:

```vue
<nav
  v-if="isFilesDrawer || !filesCollapsed"
  ref="filesDrawer"
  class="review-files"
  :class="{ 'review-files--open': filesOpen }"
  id="changed-files"
  :inert="isFilesDrawer && !filesOpen"
  :aria-hidden="isFilesDrawer && !filesOpen ? 'true' : undefined"
  aria-label="Changed files"
  tabindex="-1"
>
  <button v-if="isFilesDrawer" type="button" class="drawer-close ui-button" @click="closeFiles">Close files</button>
  <FileTree v-if="session.files.length > 0" :files="session.files" :initial-selected-file-id="selectedFile?.fileId" @select="selectFile" @activate="selectFile" />
```

**The `FileTree` element to host unchanged** (`FileTree.vue:148-167`) — swap its container, do not fork it:

```vue
<nav class="file-tree-pane" aria-label="Changed files">
  <div class="file-tree-pane__top">
    <h2 id="changed-files-heading" tabindex="-1">
      <span aria-hidden="true">Files</span>
      <span class="visually-hidden">Changed files ({{ files.length }})</span>
      ...
    <div class="file-tree-pane__filter">
      <span class="file-tree-pane__filter-glyph" aria-hidden="true">⌕</span>
      <label class="visually-hidden" for="file-tree-filter">Filter files</label>
      <input
        id="file-tree-filter"
        ref="filterInput"
        type="search"
        autocomplete="off"
        placeholder="Find file…"
```

**Duplicate landmark to collapse:** `App.vue:1165` (`class="review-files" … aria-label="Changed files"` on a `<nav>`) wraps `FileTree.vue:148` (`<nav class="file-tree-pane" aria-label="Changed files">`). Two identically-named nested navigation landmarks today. Collapse one during the swap.

**Initial focus target changes:** today `openFiles()` (`App.vue:237-241`) focuses the drawer container (`filesDrawer.value?.focus()` — the `tabindex="-1"` nav); UI-SPEC requires `#file-tree-filter` (`FileTree.vue:159`).

---

### `src/web/components/ActiveFileToolbar.vue` (NEW) + `src/web/components/IdentityHeader.vue` (MODIFY)

**Analog for the toolbar:** the block being replaced, `App.vue:1181-1222`:

```vue
<header class="review-context-header">
  <div class="review-context-header__context">
    <div class="review-context-header__file">
      <div>
        <p class="active-file-strip__eyebrow">{{ isExactPatchSession ? 'Exact patch' : 'Comparison' }}</p>
        <h1 id="cumpa-heading">
          <PathDisplay v-if="selectedFile !== undefined" :file="selectedFile" />
          <template v-else>{{ selectedPath }}</template>
        </h1>
      </div>
      <button
        type="button"
        class="ui-button"
        aria-controls="changed-files"
        :aria-expanded="isFilesDrawer ? filesOpen : !filesCollapsed"
        @click="toggleFiles"
      >Files</button>
```

Followed by the ordered endpoint strip that already satisfies **file → Base → Head** DOM order (`App.vue:1200-1221`):

```vue
<template v-if="isExactPatchSession">
  <div class="review-context-header__endpoint review-context-header__endpoint--base">
    <span class="review-context-header__endpoint-label">Preimage</span>
    <span class="review-context-header__endpoint-name">Repository object</span>
  </div>
  <div class="review-context-header__endpoint review-context-header__endpoint--head">
    <span class="review-context-header__endpoint-label">Postimage</span>
    <span class="review-context-header__endpoint-name">Implemented content</span>
  </div>
</template>
<template v-else-if="pinnedSession !== undefined">
  <div class="review-context-header__endpoint review-context-header__endpoint--base">
    <span class="review-context-header__endpoint-label">Base</span>
    <span class="review-context-header__endpoint-name" :title="pinnedSession.base.label">{{ pinnedSession.base.label }}</span>
    <span class="review-context-header__endpoint-oid" :title="pinnedSession.base.oid">{{ baseShortOid }}</span>
  </div>
```

**Reading-order rule preserved by CSS only** (`styles.css:2476-2481`, inside `@media (max-width: 1099px)`):

```css
  .review-context-header__context {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas:
      "file file"
      "base head";
  }
```

**`IdentityHeader.vue` two-`h1` hazard** — the product mark lives *inside* the `h1` today (`IdentityHeader.vue:70-73`):

```vue
<header class="session-header">
  <h1><span class="session-header__product">Cumpa:</span> <span class="session-header__comparison">{{ heading }}</span></h1>
  <div class="header-facts">
    <span class="pin-cue">{{ isExactPatch ? 'Frozen verified patch' : 'Pinned to displayed commits' }}</span>
```

The disclosure trigger to restyle into `Details` (`IdentityHeader.vue:96-105`):

```vue
<button
  ref="disclosure"
  type="button"
  class="identity-disclosure"
  :aria-controls="panelId"
  :aria-expanded="expanded"
  @click="emit('toggle')"
>
  {{ isExactPatch ? 'View patch scope' : isRange ? 'View review scope' : 'Comparison identities' }}
</button>
```

`defineExpose({ focusDisclosure, focusSupport })` at `IdentityHeader.vue:66` is consumed by `App.vue:841` and `App.vue:989` — keep both accessors or migrate both callers.

**`ShellFooter.vue` analog:** `.pin-cue` at `IdentityHeader.vue:73` is the only shipped "state cue string derived from session kind" and the closest role match; its `isExactPatch` branch (`IdentityHeader.vue:25`, `const isExactPatch = computed(() => 'patch' in props.session)`) is the exact discriminant the footer's two rows need. `grep '<footer' src/web` matches only `CommentComposer.vue:78,85` (conversation-card footers); `DiffWorkspace.vue:136` builds one more via `h('footer', …)`. **No shell-level footer element exists**; this is genuinely new markup on an existing discriminant.

---

### `src/web/components/StaleAnchorNotice.vue` (NEW) + `src/web/components/SelectorDriftNotice.vue` (MODIFY)

**Analog:** `SelectorDriftNotice.vue:41-77` — same `inline-notice` shell, same icon slot, same copy-action shape.

**Root to change** (`SelectorDriftNotice.vue:41-49`):

```vue
<aside
  v-if="affectedSources.length > 0"
  class="inline-notice inline-notice--warning selector-drift-notice"
  role="status"
  aria-labelledby="selector-drift-heading"
>
  <UiIcon name="warning" class="inline-notice__icon" />
  <div class="inline-notice__content">
    <h2 id="selector-drift-heading">Selected source changed — open review remains pinned</h2>
```

Line **44** (`role="status"`) is the duplicate live owner. The single announcement already fires from the poller (`src/web/model/selector-drift-state.ts:70-78`):

```typescript
    activeRequest = client.getSelectorDrift()
      .then((next) => {
        const previousKey = transitionKey(status.value);
        const nextKey = transitionKey(next);
        status.value = next;
        if (nextKey !== '' && nextKey !== previousKey) {
          announce('Selected source changed. The open review remains pinned.');
        }
      })
```

wired to the sole global announcer at `App.vue:1060`:

```typescript
      selectorDriftState = createSelectorDriftState(sessionClient, announce, { status: selectorDriftStatus });
      selectorDriftState.start();
```

**Line 68 — the node that must carry the scoped role instead** (`SelectorDriftNotice.vue:68`):

```vue
      <p>{{ copied }}</p>
```

Its writer is `copyPinnedCommit` (`SelectorDriftNotice.vue:32-36`):

```typescript
function copyPinnedCommit(status: Exclude<SelectorDriftStatus, { readonly kind: 'unchanged' }>): void {
  void navigator.clipboard.writeText(status.oldOid)
    .then(() => { copied.value = `Pinned ${status.role === 'base' ? 'Base' : 'Head'} commit copied.`; })
    .catch(() => { copied.value = 'Couldn’t copy the pinned commit.'; });
}
```

Without a `v-if`, the node exists at first render and a "zero live owners before the operation" assertion cannot pass. The operation-scoped-live analog to copy is `CopyButton.vue:53,56` (`role="status"` / `role="alert"`), already listed as a local owner in the UI-SPEC ownership table.

**`StaleAnchorNotice.vue` data source:** `WorkspaceCommentStatus` (`src/web/model/workspace-state.ts:8`):

```typescript
export type WorkspaceCommentStatus = 'verified' | 'stale' | 'orphaned';
```

already consumed per-comment at `ReviewPanel.vue:441,587`. `grep -n "stale\|orphan" src/web/App.vue` returns no shell surface today.

**Announce-once dedupe to mirror** — same `previousKey`/`nextKey` shape as `selector-drift-state.ts:71-78` above, against the global announcer (`App.vue:232-235`):

```typescript
function announce(message: string): void {
  liveMessage.value = message;
  liveMessageVersion.value += 1;
}
```

**Mutually-exclusive pair to replace with an independent stack** (`App.vue:1141-1145`):

```vue
<InlineNotice v-if="patchDrifted" tone="error" role="alert">
  <h2>Implemented content changed</h2>
  <p>The repository or worktree no longer matches this exact patch. …</p>
</InlineNotice>
<SelectorDriftNotice v-else :drift="selectorDriftStatus" />
```

---

### `src/web/App.vue` (MODIFY — shell composition, sole announcer)

**Overlay mount point — the structural rule.** Verified sibling order under `.session-shell` (opens `App.vue:1125`):

| Child | Lines | Relationship to `.review-shell` |
|---|---|---|
| 3× `a.skip-link` | `1126-1128` | before |
| `IdentityHeader` | `1129-1140` | before |
| warning pair | `1141-1145` | before |
| `IdentityPanel` | `1146` | **sibling, before** |
| `DraftRecovery` | `1148-1155` | `v-if` alternative |
| `div.review-shell` | `1157-1360` | — |
| `SupportDialog` | `1361-1371` | **sibling, after** |
| `p.visually-hidden[aria-live]` | `1372-1374` | **sibling, after** |

Canonical overlay-sibling excerpt (`App.vue:1361-1374`):

```vue
    <SupportDialog
      v-if="supportEnabled"
      ref="supportDialog"
      :open="supportDialogOpen"
      :mode="supportDialogMode"
      :busy="supportBusy"
      @support="() => { void startSupportAction('support'); }"
      @restore="restoreSupport"
      @dismiss="dismissSupportDialog"
      @close="closeSupportDialog"
    />
    <p class="visually-hidden" aria-live="polite">
      <span :key="liveMessageVersion" :data-announcement-version="liveMessageVersion">{{ liveMessage }}</span>
    </p>
  </div>
```

Every Phase 11 dialog mounts here. `KeyboardHelp` at `App.vue:1240` is currently **inside** `.review-main` and must move out.

**The `:key` remount is load-bearing** — `anchored-workspace.spec.ts:1146` pins that repeated identical messages produce distinct updates. Preserve `:key="liveMessageVersion"`.

**matchMedia block to unify** (`App.vue:1036-1045`):

```typescript
onMounted(async () => {
  document.addEventListener('keydown', handleKeydown);
  filesDrawerMedia = window.matchMedia('(max-width: 1099px)');
  commentsDrawerMedia = window.matchMedia('(max-width: 1439px)');
  compactIdentityMedia = window.matchMedia('(max-width: 767px)');
  commentsOpen.value = !commentsDrawerMedia.matches;
  handleViewportChange();
  filesDrawerMedia.addEventListener('change', handleViewportChange);
  compactIdentityMedia.addEventListener('change', handleViewportChange);
  commentsDrawerMedia.addEventListener('change', handleViewportChange);
```

**Teardown to keep symmetric** (`App.vue:1096-1103`):

```typescript
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
  filesDrawerMedia?.removeEventListener('change', handleViewportChange);
  commentsDrawerMedia?.removeEventListener('change', handleViewportChange);
  compactIdentityMedia?.removeEventListener('change', handleViewportChange);
  selectorDriftState?.stop();
  stopPatchStatus();
  stopSupportStatus();
});
```

Any media query removed from `onMounted` must lose its listener here, its `ref`, and its read in `handleViewportChange` (`App.vue:888-896`) in the same edit.

---

### `src/web/components/DiffWorkspace.vue` (MODIFY — component, event-driven layout)

**The correct, already-unified breakpoints** (`DiffWorkspace.vue:290-302`) — the target the other three systems collapse onto:

```typescript
onMounted(() => {
  if (host.value === undefined) return;
  configureMonacoWorkers();
  adapter = createMonacoDiffAdapter(host.value, languageForPath, syncAdapterState);
  wideCodeMedia = window.matchMedia('(min-width: 1650px)');
  compactCodeMedia = window.matchMedia('(max-width: 760px)');
  syncCodeDensity();
  wideCodeMedia.addEventListener('change', syncCodeDensity);
  compactCodeMedia.addEventListener('change', syncCodeDensity);
  syncSideNames();
  resizeObserver = new ResizeObserver(() => adapter?.layout());
  resizeObserver.observe(host.value);
  void loadContent();
});
```

**The paired-zone re-measure the resize path misses** (`DiffWorkspace.vue:105-108`):

```typescript
function resizeAnchorZoneToContent(zone: HTMLElement): void {
  const contentHeight = zone.firstElementChild?.scrollHeight ?? zone.scrollHeight;
  adapter?.setAnchorZoneHeight(Math.max(280, contentHeight + 16));
}
```

Its only callers are inside `renderAnnotation` (`DiffWorkspace.vue:138-140` for the accepted-comment card, `:159-161` for the composer), both behind `void nextTick(…)`. The `ResizeObserver` at `:300` calls `adapter?.layout()` only — width changes never re-measure the card.

**Exposed API to extend** (`DiffWorkspace.vue:245`):

```typescript
defineExpose({ focusComment, layout, nextChange, previousChange, revealComment });
```

**Existing relayout caller — the analog for the sidebar toggle** (`App.vue:888-896`):

```typescript
function handleViewportChange(): void {
  isFilesDrawer.value = filesDrawerMedia?.matches ?? false;
  isCommentsDrawer.value = commentsDrawerMedia?.matches ?? false;
  isNarrow.value = isFilesDrawer.value;
  isCompact.value = compactIdentityMedia?.matches ?? false;
  if (!isFilesDrawer.value) {
    filesOpen.value = false;
  }
  dispatchWorkspace({ type: 'resize' });
  diffWorkspace.value?.layout();
}
```

**The gap, verbatim** (`App.vue:243-249`) — `toggleFiles` changes `.review-main`'s width and calls **neither** `layout()` nor any re-measure:

```typescript
function toggleFiles(): void {
  if (isFilesDrawer.value) {
    openFiles();
  } else {
    filesCollapsed.value = !filesCollapsed.value;
  }
}
```

SHELL-03's toggle must do what `handleViewportChange` does, plus a re-measure that `handleViewportChange` itself also lacks.

---

### `src/web/styles.css` (MODIFY — config)

**Shell grid to extend to four explicit rows** (`styles.css:226-234`):

```css
.session-shell {
  position: relative;
  display: grid;
  height: 100vh;
  height: 100dvh;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
}
```

**Workspace grid to tokenize** (`styles.css:1436-1448`):

```css
.review-shell {
  position: relative;
  display: grid;
  min-width: 0;
  max-width: 100%;
  min-height: 0;
  contain: paint;
  grid-template-columns: 288px minmax(0, 1fr) 360px;
}

.review-shell--files-collapsed {
  grid-template-columns: minmax(0, 1fr) 360px;
}
```

**The four breakpoints** — verified by `grep '@media' src/web/styles.css`:

| Line | Query | Becomes |
|---|---|---|
| `2415` | `@media (min-width: 768px) and (max-width: 1279px)` | unify |
| `2435` | `@media (max-width: 1439px)` | unify |
| `2467` | `@media (max-width: 1099px)` | → `1050px` |
| `2509` | `@media (max-width: 767px)` | → `760px` |
| `2808` | `@media (prefers-reduced-motion: reduce)` | unchanged |
| `2819` | `@media (forced-colors: active)` | unchanged |

**Overlay rail — the shape it should have at every width** (`styles.css:2444-2463`, today only inside `@media (max-width: 1439px)`):

```css
  .comments-rail {
    position: absolute;
    z-index: 7;
    inset-block: 0;
    right: 8px;
    width: min(360px, calc(100vw - 16px));
    max-width: calc(100vw - 16px);
    transform: translateX(calc(100% + 8px));
    transition: transform 120ms ease-out;
    box-shadow: none;
  }

  .comments-rail--open {
    transform: translateX(0);
    box-shadow: var(--shadow-overlay);
  }

  .comments-rail:not(.comments-rail--open) {
    display: none;
  }
```

**Existing overlay-shadow rule to extend for new dialogs** (`styles.css:675-681`):

```css
.identity-panel,
.keyboard-help,
.ui-tooltip__content {
  border: 1px solid var(--border-default);
  background: var(--surface-raised);
  box-shadow: var(--shadow-overlay);
}
```

Every `var(--shadow-overlay)` site in the stylesheet — `:680`, `:713` (`.support-dialog`), `:1751` (`.diff-workspace__gutter-action::after`), `:2458` (`.comments-rail--open`), `:2501` (`.review-files--open`) — is gate-allowlisted. New dialog panels add a sixth site and must be allowlisted in the same change.

**Modal panel geometry analog** (`styles.css:695-714`):

```css
.support-dialog-backdrop {
  position: fixed;
  z-index: 20;
  inset: 0;
  ...
.support-dialog {
  display: grid;
  width: min(100%, 460px);
  gap: var(--space-4);
  ...
  background: var(--surface-raised);
  box-shadow: var(--shadow-overlay);
}
```

`min(100%, 460px)` is the shipped precedent for the new `--dialog-width: min(560px, calc(100% - 24px))`.

---

### `scripts/css-token-contract.mjs` + `scripts/verify-semantic-css.mjs` (MODIFY — gate config)

**Token set to extend** (`scripts/css-token-contract.mjs:1-2`, array closes `:27`):

```javascript
export const CANONICAL_TOKENS = [
  '--border-control', '--border-default', '--border-gap', '--border-hunk', '--border-overlay', '--border-width-default',
  '--control-height-standard', '--destructive-emphasis', '--destructive-foreground',
```

`--control-height-standard` already exists (line 3); `--control-height-compact`, `--sidebar-width`, `--dialog-width`, `--dialog-max-height` do not — verified by reading the full array.

**Colour-token regex that governs whether a new name needs a hex value** (`css-token-contract.mjs:28`):

```javascript
const COLOR_TOKEN = /^(?!--(?:border-width-default|focus-offset|focus-outline-width)$)--(?:surface|text|border|interactive|focus|selection|scrollbar|destructive|status|diff|monaco|syntax)-/u;
```

None of the four new names match, so `assertCanonicalTokenValues` will not demand a colour value.

**Overlay allowlist** (`scripts/verify-semantic-css.mjs:230-233`):

```javascript
  const overlayAllowlist = new Set([
    '.identity-panel', '.keyboard-help', '.ui-tooltip__content', '.diff-workspace__gutter-action::after',
    '.comments-rail--open', '.review-files--open', '.support-dialog',
  ]);
```

**Hard-coded breakpoint pins** (`scripts/verify-semantic-css.mjs:247-251`):

```javascript
        if (!overlayAllowlist.has(selector)) fail(`overlay shadow is not allowlisted for ${selector}`);
        if ((selector === '.comments-rail--open' && !rule.context.some((item) => item.includes('max-width: 1439px')))
          || (selector === '.review-files--open' && !rule.context.some((item) => item.includes('max-width: 1099px')))) {
          fail(`overlay shadow for ${selector} is outside its permitted responsive query`);
        }
```

Both string literals are exact-substring matches against the at-rule context. Moving `1099px → 1050px` or lifting `.comments-rail` out of its media block fails the gate **on the same commit** — the script is a first-class deliverable of the breakpoint slice, not follow-up.

---

## Shared Patterns

### Focus return to trigger
**Source:** `src/web/App.vue:979-990` (capture + fallback), `:237-241,251-254` (capture), `:839-842` (fixed trigger)
**Apply to:** `ModalDialog.vue` and every dialog consumer
```typescript
supportOpener = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
// …
void nextTick(() => (supportOpener === undefined ? identityHeader.value?.focusSupport() : supportOpener.focus()));
```

### Background inert (never `display: none`)
**Source:** `src/web/App.vue:1160`
**Apply to:** every new modal
```vue
:inert="(identityOpen && identityModal) || supportDialogOpen"
```
`display: none` would zero `scrollHeight` inside `resizeAnchorZoneToContent` (`DiffWorkspace.vue:106`), clamping paired zones to the 280px floor.

### Control-byte neutralisation on any displayed identity
**Source:** `src/domain/path-bytes.ts` → `controlSafeDisplay`, used at `IdentityHeader.vue:5,31`, `IdentityPanel.vue:5,22-32`, `SelectorDriftNotice.vue:5,55`
**Apply to:** Details dialog rows, footer, active-file toolbar, stale-anchor notice
```typescript
const baseLabel = computed(() => controlSafeDisplay(pinnedSession.value!.base.label));
```

### Sole global announcer
**Source:** `src/web/App.vue:232-235` + `:1372-1374`
**Apply to:** every cross-workspace transition; never add a second `aria-live` region
```typescript
function announce(message: string): void {
  liveMessage.value = message;
  liveMessageVersion.value += 1;
}
```

### Operation-scoped live feedback (not a persistent live root)
**Source:** `src/web/components/CopyButton.vue:53,56`; counter-example `SelectorDriftNotice.vue:44`
**Apply to:** `SelectorDriftNotice.vue:68`, all new copy actions

### `.sr-only`, never `.visually-hidden`, inside `.review-main`
**Source:** `src/web/styles.css:448-455` vs `:905-915`; precedent `ReviewToolbar.vue:77`
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
```
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
Both produce `scrollWidth > clientWidth`. The canary excludes only the `sr-only` class (`anchored-workspace.spec.ts:1205`):
```typescript
const outerOverflowOwners = await page.locator('.review-main').evaluate((root) => [...root.querySelectorAll<HTMLElement>('*')]
  .filter((element) => !element.closest('.diff-workspace__viewport')
    && !element.classList.contains('sr-only')
    && element.scrollWidth > element.clientWidth)
  .map((element) => element.className));
expect(outerOverflowOwners).toEqual([]);
```
`FileTree.vue:152,158` use `visually-hidden`, which is safe **only** because `.review-files` is outside `.review-main` — this stays true whether the tree sits in the sidebar or in a `.session-shell`-level dialog.

### Zero editable controls inside `.review-main`
**Source:** `tests/e2e/pinned-session.spec.ts:1418`
```typescript
await expect(page.locator('main.review-main').locator('input, textarea, select')).toHaveCount(0);
```
Every dialog carrying a filter input or summary textarea must mount as a `.session-shell` sibling, like `SupportDialog` (`App.vue:1361`).

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/web/components/ShellFooter.vue` | component | transform | `grep '<footer' src/web` matches only `CommentComposer.vue:78,85`; `DiffWorkspace.vue:136` adds one via `h('footer', …)`. No shell-level status line exists. Nearest role analog is the `.pin-cue` span (`IdentityHeader.vue:73`); use RESEARCH/UI-SPEC copy table for content. |
| `src/web/components/CommentsRail.vue` | dead stub | — | Delete. Declares 7 props (`CommentsRail.vue:5-13`) and forwards to a `ReviewPanel` that now takes ~25 (`App.vue:1316-1357`). `grep` shows no importer anywhere in `src/` or `tests/`. |

---

## RESEARCH ↔ Repo Contradictions

Three line citations in the assignment brief and/or `11-RESEARCH.md` do not match the worktree. All three verified by direct read this session.

### 1. `pinned-session.spec.ts` editable-control trap is line **1418**, not 1414

The brief and `11-RESEARCH.md` (Anti-Patterns section) cite `pinned-session.spec.ts:1414`. `11-CONTEXT.md:53` cites 1418. **CONTEXT is correct.**

`tests/e2e/pinned-session.spec.ts:1414` is:
```typescript
      await expect(unavailable.getByText(reason, { exact: false })).toBeVisible();
```
`tests/e2e/pinned-session.spec.ts:1418` is the actual trap:
```typescript
    await expect(page.locator('main.review-main').locator('input, textarea, select')).toHaveCount(0);
```
*(proof: read of `tests/e2e/pinned-session.spec.ts:1400-1425`)*

### 2. `.session-shell` `grid-template-rows` is line **232**, not 231

Both the brief and `11-RESEARCH.md` §Pitfall 9 cite `styles.css:231` for "the two-row shell grid". Line 231 is `min-height: 0;`. The declaration is at 232:
```css
226 .session-shell {
227   position: relative;
228   display: grid;
229   height: 100vh;
230   height: 100dvh;
231   min-height: 0;
232   grid-template-rows: auto minmax(0, 1fr);
233   overflow: hidden;
234 }
```
The block range `226-234` quoted elsewhere in RESEARCH is correct.

### 3. `.visually-hidden` rule is **905-915**, not 905-916

Line 916 is blank; the rule closes at 915. Cosmetic, but the brief's range is one line long.

### Non-contradictions confirmed accurate
`SupportDialog.vue:30-43` ✓ · `IdentityPanel.vue:56` ✓ · `App.vue:1038-1045` ✓ · `App.vue:1098-1100` ✓ · `App.vue:1163` ✓ · `App.vue:1372-1374` ✓ · `SelectorDriftNotice.vue:44,68` ✓ · `DiffWorkspace.vue:105-108` ✓ and `:294-295` (1650/760) inside `:290-303` ✓ · `verify-semantic-css.mjs:230-233,248-251` ✓ · `styles.css:2415,2435,2467,2509` ✓ · `styles.css:1436-1448,2444-2463,2476-2481` ✓ · `anchored-workspace.spec.ts:1203-1208` ✓ · `responsive-session.spec.ts:1592,1594-1596` ✓ · every `ReviewPanel.vue` split boundary (`342/343-353/354-373/374-389/390-404/405-550/551-653/654-674/675-818`) ✓ · `FileTree.vue:148,150,159` ✓ · `KeyboardHelp.vue:12-30` ✓ · `workspace-state.ts:8` ✓ · `selector-drift-state.ts:71-78` ✓ · `App.vue:1060` ✓.

### Two hazards RESEARCH does not name

**a. `FileMetadataPane` has no data path, not just no mount.** `sessionClient.getFileMetadata` exists (`src/web/api/client.ts:80` declaration, `:271-275` implementation) but has **zero callers** across `src/` and `tests/`. REV-03's "revive the pane" is a fetch-wiring task, not a mount task. Use `App.vue:293-319` as the fetch analog.

**b. `FileMetadataPane`'s root is a second `<main>` landmark** (`FileMetadataPane.vue:173`). Hosting it in the Details dialog nests `main` inside `role="dialog"` alongside `.review-main` (`App.vue:1181`). No spec catches this — all three `getByRole('main', …)` locators (`pinned-session.spec.ts:896,1387,1410`) are name-scoped, so Playwright strict mode stays green. Change the root element on revival.

**c. Global ESC will not reach dialogs containing form controls.** `handleKeydown` returns early for `input`/`textarea`/`select` targets (`App.vue:856`):
```typescript
if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
```
So a Changed-files dialog focused on `#file-tree-filter`, or a Review-notes dialog focused on the summary textarea, gets no Escape from the central chain. `SupportDialog.vue:63`'s local `@keydown.esc.prevent` is the required pattern — `ModalDialog.vue` must own ESC locally, not delegate to `App.vue:857-871`.

---


## Test-Surface Contradictions the Plan Must Absorb

`11-CONTEXT.md:64-65` and the ROADMAP say `tests/integration/selector-drift-ui.spec.ts` and the comment-mechanics specs "keep passing unchanged", and `11-RESEARCH.md` pins `review-panel-resolved.spec.ts:344-353` as byte-unchanged. Three of those claims are false against the worktree. Each is proven by a direct read below.

### 4. `review-panel-resolved.spec.ts:332` locator cannot survive the REV-05 role move

RESEARCH correctly says "update `review-panel-resolved.spec.ts:331-333`" but treats `:342` as unaffected. It is affected, because both lines share one locator built at `:332`:

```typescript
331  await expect(drift).toHaveAttribute('role', 'status');
332  const driftLiveOwners = page.locator('.selector-drift-notice[role="status"], .selector-drift-notice [aria-live="polite"]');
333  await expect(driftLiveOwners).toHaveCount(1);
...
340  await drift.getByRole('button', { name: `Copy pinned Base commit ${'1'.repeat(40)}` }).click();
341  await expect(drift).toContainText('Pinned Base commit copied.');
342  await expect(driftLiveOwners).toHaveCount(1);
```
*(`tests/e2e/review-panel-resolved.spec.ts:331-342`, read verbatim)*

The locator has two arms: root `[role="status"]`, and any descendant `[aria-live="polite"]`. The planned REV-05 shape — drop the root role at `SelectorDriftNotice.vue:44`, add a scoped `<p v-if="copied !== ''" role="status">` at `:68` — satisfies **neither arm**. The descendant arm matches `aria-live`, not `role="status"`. So after the change `driftLiveOwners` is `0` at `:333` *and* `0` at `:342`. Line 342 must be re-authored, not preserved.

Correct post-change assertions: widen the locator to include `.selector-drift-notice [role="status"]`, expect `0` before the copy (proving "zero live owners before the operation") and `1` after.

Note the frozen-visual block RESEARCH does protect is `:344-353` — icon count, `border-left-width: 3px`, headings, `inline-notice--warning`. That block **is** safe; it reads `drift` (the `.selector-drift-notice` class locator at `:326`), not the role.

### 5. `selector-drift-ui.spec.ts:336` locates the notice *by the role being removed*

```typescript
336  const notice = page.getByRole('status', { name: 'Selected source changed — open review remains pinned' });
337  await expect(notice).toBeVisible();
338  await expect(notice).toContainText('Base source moved');
339  await expect(notice).toContainText(baseOid);
340  await expect(notice).toContainText(movedBaseOid);
```
*(`tests/integration/selector-drift-ui.spec.ts:336-340`)*

`getByRole('status', …)` resolves via `SelectorDriftNotice.vue:44`. Removing that attribute makes the locator match nothing. RESEARCH's slice 6 does say "update notice selector in `selector-drift-ui.spec.ts`", so the work is scoped — but `11-CONTEXT.md:64`'s "Keep warning behaviour in `tests/integration/selector-drift-ui.spec.ts` … passing unchanged" is not achievable. New locator per UI-SPEC: `getByRole('complementary', { name: 'Selected source changed — open review remains pinned' })`, matching the retained `<aside aria-labelledby="selector-drift-heading">`.

### 6. Two specs reach `SummarySection` through the **comments rail**, which REV-04 empties

`SummarySection` (`ReviewPanel.vue:390-404`) moves to the Review-notes dialog. Two specs open the **rail** and then immediately assert summary surfaces:

```typescript
325    await ensureReviewOpen(page);
326    await expect(page.getByRole('complementary', { name: 'Review', exact: true })).toBeVisible();
327    await expect(page.getByRole('heading', { level: 2, name: 'Review', exact: true })).toBeVisible();
328    await expect(page.getByRole('region', { name: 'Summary Saved', exact: true })).toBeVisible();
329    await expect(page.getByText('No summary yet', { exact: true })).toBeVisible();
```
*(`tests/e2e/complete-review-draft.spec.ts:325-329`)*

```typescript
342  const reviewDisclosure = page.getByRole('button', { name: 'Review', exact: true });
343  if (await reviewDisclosure.getAttribute('aria-expanded') === 'false') {
344    await reviewDisclosure.click();
345  }
346  await expect(reviewDisclosure).toHaveAttribute('aria-expanded', 'true');
347
348  const summaryDisclosure = page.getByRole('button', { name: /^Summary\b/ });
349  await expect(summaryDisclosure).toHaveAttribute('aria-expanded', 'true');
350  const editSummary = page.getByRole('tab', { name: 'Edit', exact: true });
351  await editSummary.click();
...
354  const summary = page.getByLabel('Review summary (Markdown)');
355  await summary.fill('Unsaved review buffer');
```
*(`tests/integration/selector-drift-ui.spec.ts:342-355`)*

`ensureReviewOpen` is the rail toggle in every spec that defines it — it clicks `getByRole('button', { name: 'Review', exact: true })` and asserts `aria-expanded` (`complete-review-draft.spec.ts:141-144`, `anchored-review.spec.ts:131-134`, `anchored-workspace.spec.ts:428-431`, `agent-ready-export.spec.ts:245-248`, `marketplace-review.spec.ts:28-31`, `public-support-states.spec.ts:195-198`). After REV-04 the rail contains open/resolved groups only; the summary is behind the `Review notes` trigger.

**Neither file is on the ROADMAP's test-impact list** (`11-CONTEXT.md:62-63` names `responsive-session`, `complete-review-panel`, `export-receipt-ui`, `anchored-workspace`). Both must be added, re-pointed at the `Review notes` trigger:
- `tests/e2e/complete-review-draft.spec.ts:328-329`
- `tests/integration/selector-drift-ui.spec.ts:342-360` (the unsaved-buffer + focus-preservation path, which is the *point* of that test — it must keep proving the buffer survives a drift poll, now from inside the dialog)

### 7. `tests/integration/complete-review-panel.spec.ts` needs no edit — confirming RESEARCH's flag

RESEARCH flags the ROADMAP as wrong to list this file. That flag is correct and worth carrying into the plan: it is a pure `createReviewDraftState` model test with zero DOM selectors.

---

## Metadata

**Analog search scope:** `src/web/` (App.vue, components/, components/ui/, model/, api/, monaco/, styles.css), `scripts/`, `tests/e2e/`, `tests/integration/`
**Files read this session:** 22 source + 10 spec + 2 script + 3 planning
**Searches run:** 13 targeted `grep` passes (landmark ids, media queries, live roles, dialog handlers, orphan imports, ReviewPanel boundaries, overlay shadows, `main` locators, footer elements, ensureReviewOpen definitions, summary assertions)
**Pattern extraction date:** 2026-09-13
**Invalidated by:** any commit to `src/web/`, `scripts/verify-semantic-css.mjs`, `scripts/css-token-contract.mjs`, or the named specs
