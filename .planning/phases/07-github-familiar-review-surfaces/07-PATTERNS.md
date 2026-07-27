# Phase 07: GitHub-Familiar Review Surfaces — Pattern Map

**Mapped:** 2026-07-27  
**Files analyzed:** 18 implementation surfaces (including optional primitives)  
**Analogs found:** 18 / 18 (some are direct same-file analogs; no new backend contract is implied)

## File Classification

| Proposed file / surface | Role | Data flow | Closest existing analog | Match |
|---|---|---|---|---|
| `src/web/App.vue` | composition/controller | request-response + workspace command stream | current active-file strip and `runCommands()` | exact |
| `src/web/styles.css` | global presentation/config | transform (state → CSS) | existing semantic tokens and `.ui-button` matrix | exact |
| `src/web/components/ReviewToolbar.vue` | component | request-response events | current toolbar | exact |
| `src/web/components/PathDisplay.vue` (or shared display helper) | component/utility | transform | rename/copy path component | exact |
| `src/web/components/CommentComposer.vue` | component | request-response + Monaco view-zone | current composer | exact |
| `src/web/components/DiffWorkspace.vue` | component/controller | streaming/rendered Monaco zone | `renderAnnotation()` | exact |
| `src/web/components/CommentsRail.vue` | composition component | request-response event forwarding | current rail wrapper | exact |
| `src/web/components/ReviewPanel.vue` | component/controller | CRUD/event-driven lifecycle | current grouped review panel | exact |
| `src/web/components/SummarySection.vue` | form component | CRUD/request-response | current summary edit/disclosure | exact |
| `src/web/components/InlineNotice.vue` + raw notice users | status component | transform (state → notice) | current tone classes and ARIA notices | role-match |
| `src/web/components/ExportSection.vue` | component/controller | request-response + file-I/O state | current export state branches | exact |
| `src/web/components/ExportProgress.vue` | status component | streaming/progress | existing spinner/status | exact |
| `src/web/components/ExportReceipt.vue` | status component | file-I/O receipt | current receipt | exact |
| `src/web/components/GitignoreStatus.vue` | status/action component | file-I/O request-response | current ignore-status branches | exact |
| `src/web/components/DraftRecovery.vue` | recovery component | file-I/O request-response | current recovery card/notice/actions | exact |
| `src/web/components/ui/UiIcon.vue` (optional new) | presentational primitive | transform | `UiPrimitives.vue` + inline SVG in composer | role-match |
| `src/web/components/ui/ReviewStateBadge.vue` (optional new) | presentational primitive | transform | `StatusBadge.vue` and existing status spans | role-match |
| `tests/integration/anchored-workspace.spec.ts` / `tests/e2e/review-panel-resolved.spec.ts` | browser tests | request-response/UI state | existing anchored workspace and rail specs | exact |

No API, persistence, Git adapter, model, or Monaco adapter file is a proposed implementation target. They remain sources of truth and should not be changed for this presentation phase.

## Pattern Assignments

### `src/web/App.vue` — grouped context header and transient selection

**Analog:** the existing template and command seam (`App.vue:494-501,803-904`). Keep session/file/workspace state in this owner; do not fetch or derive new server data.

**Current composition excerpt (`App.vue:803-827`):**
```vue
<div class="active-file-strip">
  <div>
    <p class="active-file-strip__eyebrow">Diff review</p>
    <h1 id="diff-review-heading">{{ selectedPath }}</h1>
  </div>
  <button v-if="isFilesDrawer" type="button" class="ui-button" @click="openFiles">Files</button>
</div>
<ReviewToolbar
  :at-first-file="atFirstFile"
  :at-last-file="atLastFile"
  :has-active-file="selectedFile?.availability.kind === 'text'"
  :open-comment-count="openCommentCount"
  :resolved-comment-count="resolvedCommentCount"
  :review-expanded="commentsOpen"
  ...
/>
```

Wrap these siblings in one two-band header. Use current `session.base`/`session.head`, safe selected-file `oldPath`/`newPath`, and existing seven-character OID convention; do not re-resolve refs or normalize paths. Keep conditional Files control in the context band.

**Selection command seam (`App.vue:494-501`):**
```ts
case 'focus-comment':
  void nextTick(() => diffWorkspace.value?.focusComment(command.commentId));
  break;
```
Add only transient `selectedCommentId` assignment alongside this existing focus call, clear when the comment disappears, then pass through the existing rail props/events. It is presentation state, not persistence or a new command.

### `src/web/styles.css` — all visual adaptation

**Analog:** semantic root and global control matrix (`styles.css:1-80,325-480`). Extend this one stylesheet; do not add scoped token roots, component color literals, shadows, gradients, or a second palette.

```css
:root {
  --surface-canvas: #0D1117;
  --surface-panel: #161B22;
  --surface-interactive: #21262D;
  --surface-interactive-hover: #292E36;
  --surface-interactive-active: #30363D;
  --text-primary: #E6EDF3;
  --border-default: #30363D;
  --interactive-accent: #2F81F7;
  --focus-ring: #58A6FF;
}
.ui-button:hover:not(:disabled) { border-color: var(--border-strong); background: var(--surface-interactive-hover); }
.ui-button:active:not(:disabled) { border-color: var(--border-strong); background: var(--surface-interactive-active); }
.ui-button:disabled { background: var(--status-disabled-background); color: var(--status-disabled-foreground); opacity: 1; }
.ui-button--primary { background: var(--interactive-accent-emphasis); color: var(--text-on-emphasis); }
.ui-button--destructive { border-color: var(--destructive-foreground); background: var(--surface-interactive); color: var(--destructive-foreground); }
```
Preserve the inherited unclipped `:focus-visible` 2px outer ring (`styles.css:99-102`) and reduced-motion block (`styles.css:1679-1692`). Add selected/busy/icon/badge rules using existing tokens; independent selected rail, lifecycle, anchor, focus, and destructive channels must not be merged.

### `src/web/components/ReviewToolbar.vue` — icon navigation, labeled actions

**Analog:** same component (`ReviewToolbar.vue:1-70`), which already has the complete behavior contract.

```vue
<UiTooltip text="Previous change · Shift+F7">
  <button type="button" class="ui-button" :disabled="!hasActiveFile" @click="emit('previousChange')">
    Previous change
  </button>
</UiTooltip>
...
<button
  type="button" class="ui-button"
  aria-controls="review-panel"
  :aria-expanded="reviewExpanded"
  aria-describedby="review-description"
  @click="emit('comments')"
>Review</button>
```
Convert only the four navigation button contents to decorative local icons while retaining exact button names through `aria-label`/tooltip and native disabled conditions. Keep Review and Keyboard help visibly labeled, all six emits, shortcut strings, count description, `aria-controls`, and `aria-expanded`. Review’s selected styling mirrors its existing expanded state; it must not own selection state.

### `src/web/components/PathDisplay.vue` (or display-only helper)

**Analog:** `PathDisplay.vue:1-35`; it is the authoritative old/new relationship and accessible move label.

```ts
const isMove = computed(() => props.file.status.kind === 'renamed' || props.file.status.kind === 'copied');
const effectivePath = computed(() => props.file.status.kind === 'deleted' ? props.file.oldPath : props.file.newPath ?? props.file.oldPath);
const moveLabel = computed(() => {
  if (!isMove.value || props.file.oldPath === undefined || props.file.newPath === undefined) return undefined;
  const verb = props.file.status.kind === 'copied' ? 'copied' : 'renamed';
  return `${verb} from ${props.file.oldPath.display} to ${props.file.newPath.display}`;
});
```
Reuse exact safe display values and `aria-label`; split only for presentation (`lastIndexOf('/')` is acceptable) into muted directory and semibold filename. Never reconstruct path bytes. For deleted files retain old path; for rename/copy retain complete old → new relationship.

### `src/web/components/CommentComposer.vue` — inline conversation card

**Analog:** current composer (`CommentComposer.vue:1-65`). Preserve props/emits and textarea/focus/confirmation behavior; change only anatomy and status presentation.

```vue
<section class="inline-comment-composer" :aria-label="`Comment on ${side} line ${line}`">
  <header class="inline-comment-composer__header" :title="'Anchor fields are fixed for this comment.'">
    <span>{{ path }} · {{ sideLabel() }} · line {{ line }}</span>
    <svg aria-hidden="true" ...><path ... /></svg>
  </header>
  <label><span>Comment</span><textarea :disabled="status === 'pending'" ... /></label>
  <p class="inline-comment-composer__support">Your comment is accepted only after it is saved locally.</p>
  <p v-if="validation" class="inline-notice inline-notice--error" role="alert">{{ validation }}</p>
  <footer><button class="ui-button ui-button--primary">{{ status === 'pending' ? 'Adding comment…' : 'Add comment' }}</button>...</footer>
</section>
```
Make header filename/Base-or-Head line lead, directory/fixed-anchor copy quieter; keep validation immediately after field support with `role=alert`. Pending keeps native disable, explicit “Adding comment…” and local spinner/`aria-busy`; confirmation copy and Escape/focus paths stay unchanged. Use flat panel, 1px border, 6px radius, no shadow.

### `src/web/components/DiffWorkspace.vue` — accepted annotation inside paired zone

**Analog:** `renderAnnotation()` (`DiffWorkspace.vue:62-117`). This is the highest-risk seam: preserve one zone root, active-anchor lookup, adapter geometry and focus target.

```ts
if (comment !== undefined) {
  render(h('section', { class: 'inline-accepted-comment', 'data-comment-id': comment.id }, [
    h('h3', { tabindex: -1 }, `${props.path} · ${comment.side === 'base' ? 'Base' : 'Head'} · line ${comment.line}`),
    h('span', { class: 'comment-badge' }, 'Saved locally'),
    h('p', comment.body),
  ]), zone);
  return;
}
...
void nextTick(() => {
  const contentHeight = zone.firstElementChild?.scrollHeight ?? zone.scrollHeight;
  adapter?.setAnchorZoneHeight(Math.max(280, contentHeight + 16));
  ...
});
```
Restructure accepted content to header/body/footer and separate lifecycle (`Open`/`Resolved`) from anchor (`Verified`/`Stale anchor`/`Anchor unavailable`) badges. Do not add a second view zone, move source-line cue, alter `setAnchorZoneHeight`, line mapping, adapter creation, or `focusComment` behavior.

### `src/web/components/CommentsRail.vue` — prop/event forwarding

**Analog:** current wrapper (`CommentsRail.vue:1-59`). Add `selectedCommentId?: string | null` and forward it; retain every emit unchanged.

```vue
<ReviewPanel
  :comments="comments"
  :inventory="inventory"
  ...
  @show="emit('show', $event)"
  @update:comment-buffer="forwardCommentBuffer"
/>
```
This is a compatibility seam only; no grouping or lifecycle logic belongs here.

### `src/web/components/ReviewPanel.vue` — hierarchy, grouping, selection, localized busy

**Analog:** current component (`ReviewPanel.vue:1-220,268-535`). Preserve computed `projectCommentGroups`, Summary → Open → Resolved → Export order, disclosures, action labels, confirmation flows, and focus recovery.

```ts
const pendingFocus = ref<Readonly<{
  kind: 'resolve' | 'reopen' | 'delete';
  commentId: string;
  visibleOrder: readonly string[];
}> | null>(null);
function runLifecycle(commentId: string, kind: 'resolve' | 'reopen'): void {
  pendingFocus.value = { kind, commentId, visibleOrder: [...visibleOrder.value] };
  emit(kind, commentId);
}
```

```vue
<header class="review-panel__heading">
  <div><h2 id="review-heading" ref="heading" tabindex="-1">Review</h2>
    <p><span>Open {{ openCount }}</span> · <span>Resolved {{ resolvedCount }}</span></p>
  </div>
</header>
<section v-for="group in groups.open" class="review-panel__group">
  <h4 tabindex="-1">{{ group.path.display }} <span>({{ group.comments.length }})</span></h4>
  <article v-for="comment in group.comments" :data-comment-id="comment.id" class="review-panel__comment" ...>
    <h5 data-comment-heading tabindex="-1">{{ ... }} line {{ comment.line }}</h5>
    ...
    <p v-if="pending === 'resolve' && pendingFocus?.commentId === comment.id" role="status">Resolving comment…</p>
  </article>
</section>
```
Add visible count badges, one frame per major section/file group, divider-separated rows (neutralize nested per-article borders), path directory/filename hierarchy, lifecycle and anchor badges, and transient selected modifier + visible `Selected` badge. Local busy text/spinner MUST require both operation and `pendingFocus.commentId`; do not make all rows appear busy. Do not use `aria-selected` on ordinary articles.

### `src/web/components/SummarySection.vue` — framed form and save busy

**Analog:** current summary (`SummarySection.vue:116-232`). Retain native disclosure and tab model, focus restoration, Markdown preview, retained text, confirmation, and failure focus.

```vue
<button id="summary-tab-edit" role="tab" :aria-selected="mode === 'edit'" ...>Edit</button>
<textarea :disabled="pending || conflict" ... />
<button class="ui-button ui-button--primary" :disabled="!unsaved || pending || conflict">
  {{ saving ? 'Saving summary…' : 'Save summary' }}
</button>
<section v-if="failure" class="inline-notice inline-notice--error" role="alert" tabindex="-1">...</section>
```
Frame section with flat interior; add local spinner and `aria-busy` to save control/status only, preserving exact labels, disable rules, and adjacent validation/failure.

### `src/web/components/InlineNotice.vue` and existing raw notices — shared status language

**Analog:** `InlineNotice.vue:1-18` plus direct notice branches in `ReviewPanel.vue:278-319` and `ExportSection.vue:62-142`.

```vue
<aside class="inline-notice" :class="`inline-notice--${tone}`" :role="role"><slot /></aside>
```
Keep roles, headings, body, refs, focus and live announcements. Add decorative local tone icon and structural leading edge; expand tone vocabulary only if required by existing semantic state. Existing raw notices (conflict, validation, export, readiness, gitignore) should consume the same hooks rather than one-off markup/colors.

### `src/web/components/ExportSection.vue` and export children

**Analogs:** `ExportSection.vue:1-155`, `ExportProgress.vue:9-28`, `ExportReceipt.vue`, `GitignoreStatus.vue:71-112`.

```ts
const stateLabel = computed(() => {
  switch (props.exportState.phase) {
    case 'drift': return 'Needs acknowledgement';
    case 'pending': return 'Exporting';
    case 'exported': return 'Exported';
    case 'failed': return 'Failed';
    case 'unavailable': return 'Unavailable';
    default: return 'Ready';
  }
});
```
Reuse existing ready/drift/conflict/pending/failed/unavailable/exported branches and receipt/reveal/retry actions. Normalize icon + heading/body + edge treatments; reuse `ExportProgress` spinner rather than inventing a second animation. Preserve revision gate, all-or-nothing file publication, focus movement, and action copy. `GitignoreStatus` remains its existing file-I/O state machine; only add matching status structure.

### `src/web/components/DraftRecovery.vue` — recovery status

**Analog:** existing `DraftRecovery` card/notice/action hooks (component and `styles.css` selectors `.draft-recovery__card`, `.draft-recovery__notice`). Keep fingerprint gate, byte-for-byte backup, no-replacement-on-failure, and recovery focus/labels. Apply framed flat surface and warning/error icon + structural edge; no new persistence state.

### Optional `src/web/components/ui/UiIcon.vue`

**Analog:** `src/web/components/ui/UiPrimitives.vue` and the lock SVG in `CommentComposer.vue:26-31`. If introduced, make it a typed, behavior-free local SVG registry: 16×16 viewBox, 1.5px currentColor outline, `aria-hidden=true`. Native button/visible label owns accessible name. Do not add icon dependency or remote asset.

### Optional `src/web/components/ui/ReviewStateBadge.vue`

**Analog:** `StatusBadge.vue` and current lifecycle/anchor spans in `ReviewPanel.vue:321-517`. Keep typed presentation-only tone/name unions; render icon + visible label + boundary for Open, Resolved, Selected, Pending, Disabled and anchor warning/verified states. It must not own lifecycle state or mutation.

### Browser tests

**Analogs:** `tests/integration/anchored-workspace.spec.ts` (header/composer/Monaco geometry) and `tests/e2e/review-panel-resolved.spec.ts` (rail grouping/lifecycle/focus). Extend the closest existing scenarios rather than create a new test harness. Assertions should cover accessible names/tooltips, all six controls, OID/path identity, card anatomy, field-adjacent validation, selected cue persistence after focus moves, per-row localized busy state, notice/badge text or icons, computed state styles, and unchanged paired-zone geometry. Do not run tests as part of this mapping task.

## Shared Patterns

### Semantic state mirrors existing behavioral state
Bind classes and visible status directly to existing props, `reviewExpanded`/`aria-expanded`, summary tab state, native `disabled`, export phase, comment state/status, and `pendingFocus`. Never introduce a second reducer or persisted visual state.

### Independent semantic channels
Selected comment = persistent accent rail + visible `Selected`; keyboard focus = existing outer 2px ring; lifecycle = Open/Resolved; anchor = Verified/Stale/Unavailable; pending = local spinner + progressive verb; destructive intent = outlined red at rest. Never collapse these meanings into one fill or color.

### Flat containers and divider rows
Major sections and file groups own borders/radii. Comment articles inside a group have no own frame; use one divider between adjacent rows. Static review surfaces have no shadows.

### Native semantics and explicit status
Retain native `disabled`, existing `role="alert"`/`role="status"`, `aria-busy` where local mutation is active, headings and visible labels. Decorative SVGs are hidden from the accessibility tree; icon-only controls retain exact accessible names/tooltips.

### Monaco geometry is authoritative
Visual card markup may change only inside current paired anchor zone. Preserve adapter line mapping, anchor rail/decorations, single zone root, measurement loop and `setAnchorZoneHeight(Math.max(280, contentHeight + 16))`.

## No Analog Found

None for the proposed surfaces. The optional `UiIcon` and `ReviewStateBadge` are new primitives, but their behavior is fully covered by existing inline SVG, `UiPrimitives`, `StatusBadge`, and lifecycle spans; use those as role-match patterns. No backend/API/persistence changes are justified by the phase requirements.

## Metadata

**Analog search scope:** `src/web/App.vue`, `src/web/components/**`, `src/web/styles.css`, existing anchored/review-panel browser specs, and phase 05/06/07 UI contracts.  
**Pattern extraction date:** 2026-07-27  
**Constraints honored:** read-only code inspection; no formatter, linter, build, test, or project-wide command run.

## PATTERN MAPPING COMPLETE
