<script setup lang="ts">
import type { FinishReviewResult } from '../../contracts/api.js';
import { computed, nextTick, ref, watch } from 'vue';

import type { ReviewPendingOperation } from '../model/review-draft-state.js';
import type { ReviewExportState } from '../model/review-draft-state.js';
import type { AppendCompareIgnoreResult, ExportDirectoryRevealResult } from '../../contracts/api.js';
import { projectCommentGroups } from '../model/comment-groups.js';
import type { WorkspaceComment } from '../model/workspace-state.js';
import SummarySection from './SummarySection.vue';
import ExportSection from './ExportSection.vue';
import ReviewStateBadge from './ui/ReviewStateBadge.vue';
import UiIcon from './ui/UiIcon.vue';
import PathText from './ui/PathText.vue';

type ReviewFailure = Readonly<{
  operation: ReviewPendingOperation;
  commentId?: string;
}>;

type AttachedLifecycle =
  | 'waiting'
  | 'waitingDisconnected'
  | 'finishing'
  | 'completed'
  | 'retryableFailure'
  | 'terminalFailure';

const props = defineProps<{
  readonly comments: readonly ReviewComment[];
  readonly inventory: readonly FileInventoryEntry[];
  readonly summary: string;
  readonly revision: number;
  readonly pinnedEndpoints?: PinnedRangeEndpoints;
  readonly summaryBuffer: string;
  readonly commentBuffers: ReadonlyMap<string, string>;
  readonly pending: ReviewPendingOperation | null;
  readonly conflict: ReviewConflict | null;
  readonly failure: ReviewFailure | null;
  readonly retainedSummary: boolean;
  readonly exportState: ReviewExportState;
  readonly appendIgnoreRule: AppendCompareIgnoreRule | undefined;
  readonly refreshIgnoreStatus: RefreshCompareIgnoreStatus | undefined;
  readonly revealExportDirectory: RevealExportDirectory | undefined;
  readonly selectedCommentId?: string;
  readonly attachedLifecycle?: AttachedLifecycle;
  readonly attachedReady?: boolean;
  readonly attachedFailure?: FinishReviewResult;
  readonly mutationLocked?: boolean;
  readonly isExactPatch?: boolean;
}>();

const emit = defineEmits<{
  'update:summaryBuffer': [body: string];
  'update:commentBuffer': [commentId: string, body: string];
  saveSummary: [];
  cancelSummary: [];
  editComment: [commentId: string];
  cancelComment: [commentId: string];
  resolveComment: [commentId: string];
  reopenComment: [commentId: string];
  deleteComment: [commentId: string];
  edit: [commentId: string];
  show: [commentId: string];
  delete: [commentId: string];
  close: [];
  cancelExport: [];
  export: [];
  inspectRecordedFile: [commentId: string];
  copyRecordedAnchor: [commentId: string];
  saveComment: [commentId: string];
  reloadLatest: [];
  reviewUnsavedText: [];
  refreshIgnoreStatus: [];
  revealExportDirectory: [];
  exportReview: [];
  finishReview: [];
  reloadAttached: [];
  viewAttachedScope: [];
}>();

const root = ref<HTMLElement>();
const heading = ref<HTMLElement>();
const openCommentsOpen = ref(true);
const resolvedOpen = ref(false);
const editing = ref<string | null>(null);
const confirmingEditDiscard = ref<string | null>(null);
const confirmingDelete = ref<string | null>(null);
const failureAlert = ref<HTMLElement>();
const pendingFocus = ref<Readonly<{
  kind: 'resolve' | 'reopen' | 'delete';
  commentId: string;
  visibleOrder: readonly string[];
}> | null>(null);

const groups = computed(() => {
  const commentsById = new Map(props.comments.map((comment) => [comment.id, comment]));
  const projectedGroups = projectCommentGroups(props.comments.map((comment) => ({
    id: comment.id,
    state: comment.state,
    body: comment.body,
    side: comment.side,
    line: comment.line,
    createdAt: comment.createdAt,
    path: comment.recordedAnchor.path,
  })), props.inventory);
  const restoreRecords = (sections: typeof projectedGroups.open) => sections.map((section) => ({
    ...section,
    comments: section.comments.flatMap((comment) => {
      const record = commentsById.get(comment.id);
      return record === undefined ? [] : [record];
    }),
  }));
  return {
    open: restoreRecords(projectedGroups.open),
    resolved: restoreRecords(projectedGroups.resolved),
  };
});

const openCount = computed(() => props.comments.filter((comment) => comment.state === 'open').length);
const resolvedCount = computed(() => props.comments.filter((comment) => comment.state === 'resolved').length);
const visibleOrder = computed(() => [
  ...groups.value.open.flatMap((group) => group.comments.map((comment) => comment.id)),
  ...(resolvedOpen.value ? groups.value.resolved.flatMap((group) => group.comments.map((comment) => comment.id)) : []),
]);
const summaryFailure = computed(() => props.failure?.operation === 'summary');
const reviewFailure = computed(() => props.failure !== null && props.failure.operation !== 'summary');

const attached = computed(() => props.attachedLifecycle !== undefined);
const attachedHasUnsavedText = computed(() => (
  props.summaryBuffer !== props.summary
  || props.comments.some((comment) => buffer(comment) !== comment.body)
));
const attachedBlockedByPending = computed(() => props.pending !== null);
const attachedBlockedByConflict = computed(() => props.conflict !== null);
const attachedNoFeedback = computed(() => props.summary === '' && props.comments.length === 0);
const completionAction = ref<HTMLButtonElement>();
const completionSuccess = ref<HTMLElement>();
const completionFailure = ref<HTMLElement>();

function finishAttachedReview(): void {
  if (props.attachedReady) emit('finishReview');
}

function focusStaleFeedback(): void {
  const result = props.attachedFailure;
  if (result?.kind !== 'staleAnchors') return;

  const commentId = result.affectedCommentIds.find((id) => props.comments.some((comment) => comment.id === id));
  if (commentId === undefined) return;

  const comment = props.comments.find((candidate) => candidate.id === commentId);
  if (comment?.state === 'resolved') resolvedOpen.value = true;
  else openCommentsOpen.value = true;
  void nextTick(() => focusCommentHeading(commentId));
}

function buffer(comment: WorkspaceComment): string {
  return props.commentBuffers.get(comment.id) ?? comment.body;
}

function selectorForComment(commentId: string): string {
  return `[data-comment-id="${CSS.escape(commentId)}"]`;
}

function focusWithinComment(commentId: string, selector: string): void {
  void nextTick(() => root.value?.querySelector<HTMLElement>(`${selectorForComment(commentId)} ${selector}`)?.focus());
}

function focusCommentHeading(commentId: string): void {
  focusWithinComment(commentId, '[data-comment-heading]');
}

function focusEditButton(commentId: string): void {
  focusWithinComment(commentId, '[data-comment-edit]');
}

function startEdit(comment: WorkspaceComment): void {
  if (props.mutationLocked) return;
  editing.value = comment.id;
  confirmingEditDiscard.value = null;
  emit('edit', comment.id);
  emit('show', comment.id);
  void nextTick(() => nextTick(() => root.value?.querySelector<HTMLTextAreaElement>(`${selectorForComment(comment.id)} textarea`)?.focus()));
}

function closeEdit(comment: WorkspaceComment): void {
  if (buffer(comment) !== comment.body) {
    confirmingEditDiscard.value = comment.id;
    focusWithinComment(comment.id, '[data-keep-editing]');
    return;
  }

  editing.value = null;
  void nextTick(() => focusEditButton(comment.id));
}

function keepEditing(commentId: string): void {
  confirmingEditDiscard.value = null;
  focusWithinComment(commentId, 'textarea');
}

function discardEdits(comment: WorkspaceComment): void {
  if (props.mutationLocked) return;
  emit('update:commentBuffer', comment.id, comment.body);
  confirmingEditDiscard.value = null;
  editing.value = null;
  void nextTick(() => focusEditButton(comment.id));
}

function onEditKeydown(event: KeyboardEvent, comment: WorkspaceComment): void {
  if (!props.mutationLocked && (event.metaKey || event.ctrlKey) && event.key === 'Enter' && buffer(comment).trim() !== '' && props.pending === null && props.conflict === null) {
    event.preventDefault();
    event.stopPropagation();
    emit('saveComment', comment.id);
    return;
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    closeEdit(comment);
  }
}

function openDeleteConfirmation(commentId: string): void {
  if (props.mutationLocked) return;
  confirmingDelete.value = commentId;
  focusWithinComment(commentId, '[data-keep-comment]');
}

function cancelDelete(commentId: string): void {
  confirmingDelete.value = null;
  focusWithinComment(commentId, '[data-delete-trigger]');
}

function confirmDelete(commentId: string): void {
  if (props.mutationLocked) return;
  pendingFocus.value = { kind: 'delete', commentId, visibleOrder: [...visibleOrder.value] };
  emit('delete', commentId);
}

function runLifecycle(commentId: string, kind: 'resolve' | 'reopen'): void {
  if (props.mutationLocked) return;
  pendingFocus.value = { kind, commentId, visibleOrder: [...visibleOrder.value] };
  emit(kind, commentId);
}

function focusAfterRemoval(action: NonNullable<typeof pendingFocus.value>): void {
  const removedIndex = action.visibleOrder.indexOf(action.commentId);
  const candidates = [
    ...action.visibleOrder.slice(removedIndex + 1),
    ...action.visibleOrder.slice(0, Math.max(removedIndex, 0)).reverse(),
  ];
  const currentIds = new Set(props.comments.map((comment) => comment.id));
  const nextId = candidates.find((id) => currentIds.has(id));
  if (nextId !== undefined) {
    const nextComment = props.comments.find((comment) => comment.id === nextId);
    if (nextComment?.state === 'resolved' && !resolvedOpen.value) {
      void nextTick(() => root.value?.querySelector<HTMLElement>('#resolved-comments-heading')?.focus());
    } else {
      focusCommentHeading(nextId);
    }
    return;
  }
  void nextTick(() => root.value?.querySelector<HTMLElement>('#open-comments-heading')?.focus());
}

function closeFromEscape(event: KeyboardEvent): void {
  event.preventDefault();
  event.stopPropagation();
  emit('close');
}

function onEditConfirmationEscape(event: KeyboardEvent, commentId: string): void {
  if (event.key !== 'Escape') return;
  event.preventDefault();
  event.stopPropagation();
  keepEditing(commentId);
}

function onDeleteConfirmationEscape(event: KeyboardEvent, commentId: string): void {
  if (event.key !== 'Escape') return;
  event.preventDefault();
  event.stopPropagation();
  cancelDelete(commentId);
}

function focusHeading(): void {
  heading.value?.focus();
}

defineExpose({ focusHeading });

watch(() => props.comments, () => {
  const action = pendingFocus.value;
  if (action !== null) {
    const current = props.comments.find((comment) => comment.id === action.commentId);
    if (action.kind === 'reopen' && current?.state === 'open') {
      openCommentsOpen.value = true;
      pendingFocus.value = null;
      focusCommentHeading(action.commentId);
    } else if (action.kind === 'resolve' && current?.state === 'resolved') {
      pendingFocus.value = null;
      focusAfterRemoval(action);
    } else if (action.kind === 'delete' && current === undefined) {
      pendingFocus.value = null;
      confirmingDelete.value = null;
      focusAfterRemoval(action);
    }
  }

  const editingId = editing.value;
  if (editingId !== null) {
    const updated = props.comments.find((comment) => comment.id === editingId);
    if (updated !== undefined && buffer(updated) === updated.body && props.pending === null) {
      editing.value = null;
      confirmingEditDiscard.value = null;
      focusCommentHeading(editingId);
    }
  }
}, { deep: true });

watch(reviewFailure, (failed) => {
  if (failed) void nextTick(() => failureAlert.value?.focus());
});

watch(() => [props.attachedLifecycle, props.attachedFailure] as const, ([lifecycle, failure]) => {
  if (lifecycle === 'finishing') void nextTick(() => completionAction.value?.focus());
  if (lifecycle === 'completed') void nextTick(() => completionSuccess.value?.focus());
  if (lifecycle === 'waitingDisconnected' || lifecycle === 'terminalFailure' || failure !== undefined) {
    void nextTick(() => completionFailure.value?.focus());
  }
}, { deep: true });
</script>

<template>
  <section ref="root" class="review-panel" aria-labelledby="review-heading" @keydown.escape="closeFromEscape">
    <header class="review-panel__heading">
      <div>
        <h2 id="review-heading" ref="heading" tabindex="-1">Review</h2>
        <div class="review-panel__heading-counts">
          <ReviewStateBadge kind="open" :label="`Open ${openCount}`" />
          <ReviewStateBadge kind="resolved" :label="`Resolved ${resolvedCount}`" />
        </div>
      </div>
      <button type="button" class="ui-button" @click="emit('close')">Close review</button>
    </header>

    <section
      v-if="conflict !== null"
      class="inline-notice inline-notice--warning review-panel__conflict"
      role="alert"
      tabindex="-1"
      aria-labelledby="review-conflict-heading"
    >
      <UiIcon name="warning" class="inline-notice__icon" />
      <div class="inline-notice__content">
        <h3 id="review-conflict-heading">Review changed in another tab</h3>
        <dl>
          <div><dt>Your revision</dt><dd>{{ conflict.expectedRevision }}</dd></div>
          <div><dt>Latest revision</dt><dd>{{ conflict.actualRevision }}</dd></div>
        </dl>
        <p>Nothing from your attempt was written.</p>
        <p>Unsaved text retained in this tab.</p>
        <button type="button" class="ui-button" @click="emit('reload-latest')">Reload latest</button>
      </div>
    </section>

    <section
      v-if="reviewFailure"
      ref="failureAlert"
      class="inline-notice inline-notice--error review-panel__failure"
      role="alert"
      tabindex="-1"
      aria-labelledby="review-operation-failed-heading"
    >
      <UiIcon name="error" class="inline-notice__icon" />
      <div class="inline-notice__content">
        <h3 id="review-operation-failed-heading">Review change failed</h3>
        <p v-if="failure?.operation === 'comment'">Comment wasn’t saved. Your text is still here in this tab.</p>
        <p v-else>The review change wasn’t saved. The accepted local draft is unchanged. Try again after checking Compare is running.</p>
      </div>
    </section>

    <section class="review-panel__section review-panel__section--summary">
      <SummarySection
        :canonical="summary"
        :model-value="summaryBuffer"
        :pending="pending !== null || mutationLocked === true"
        :saving="pending === 'summary'"
        :conflict="conflict !== null"
        :failure="summaryFailure"
        :retained="retainedSummary"
        @cancel="emit('cancelSummary')"
        @save="emit('saveSummary')"
        @update:model-value="emit('update:summaryBuffer', $event)"
      />
    </section>

    <section class="review-panel__comments review-panel__section" aria-labelledby="open-comments-heading">
      <h3>
        <button
          id="open-comments-heading"
          type="button"
          class="ui-button review-panel__disclosure"
          :aria-expanded="openCommentsOpen"
          aria-controls="open-comments-content"
          @click="openCommentsOpen = !openCommentsOpen"
        >Open comments ({{ openCount }})</button>
      </h3>
      <div v-if="openCommentsOpen" id="open-comments-content">
        <section v-if="openCount === 0" class="review-panel__empty" aria-labelledby="no-open-comments-heading">
          <h4 id="no-open-comments-heading">No open comments</h4>
          <p>Add a comment from a line in the diff, or reopen one from Resolved comments.</p>
        </section>
        <section v-for="group in groups.open" v-else :key="group.path.bytesBase64url" class="review-panel__group">
          <header class="review-panel__group-header">
            <h4 tabindex="-1"><PathText :display="group.path.display" /></h4>
            <span>({{ group.comments.length }})</span>
          </header>
          <div class="review-panel__group-rows">
          <article
            v-for="comment in group.comments"
            :key="comment.id"
            :data-comment-id="comment.id"
            class="review-panel__comment comments-rail__comment"
            :class="{ 'review-panel__comment--selected': selectedCommentId === comment.id, 'review-panel__comment--busy': (pending === 'resolve' || pending === 'reopen' || pending === 'delete') && pendingFocus?.commentId === comment.id }"
            :aria-labelledby="`comment-heading-${comment.id}`"
          >
            <div class="review-panel__comment-heading">
              <h5 :id="`comment-heading-${comment.id}`" data-comment-heading tabindex="-1">
                <PathText :display="comment.recordedAnchor.safeDisplayPath" /> · {{ comment.side === 'base' ? 'Base' : 'Head' }} line {{ comment.line }}
              </h5>
              <div class="review-panel__comment-badges">
                <ReviewStateBadge kind="open" label="Open" />
                <ReviewStateBadge :kind="comment.status === 'verified' ? 'verified' : comment.status === 'stale' ? 'stale' : 'unavailable'" :label="comment.status === 'verified' ? 'Verified' : comment.status === 'stale' ? 'Stale anchor' : 'Anchor unavailable'" />
                <ReviewStateBadge v-if="selectedCommentId === comment.id" kind="selected" label="Selected" />
              </div>
            </div>

            <template v-if="editing === comment.id">
              <p>{{ comment.recordedAnchor.safeDisplayPath }} · {{ comment.side === 'base' ? 'Base' : 'Head' }} · line {{ comment.line }} · Anchor fields fixed for this comment.</p>
              <details><summary>Saved text</summary><p>{{ comment.body }}</p></details>
              <label>Comment
                <textarea
                  :value="buffer(comment)"
                  :disabled="pending !== null || conflict !== null || mutationLocked === true"
                  @input="emit('update:commentBuffer', comment.id, ($event.target as HTMLTextAreaElement).value)"
                  @keydown="onEditKeydown($event, comment)"
                />
              </label>
              <p v-if="buffer(comment) !== comment.body">Unsaved</p>
              <p v-if="buffer(comment).trim() === ''" role="alert">Write a comment before saving it.</p>
              <div class="review-panel__actions">
                <button
                  type="button"
                  class="ui-button ui-button--primary"
                  :class="{ 'ui-button--busy': pending === 'comment' }"
                  :aria-busy="pending === 'comment' || undefined"
                  :disabled="pending !== null || conflict !== null || mutationLocked === true || buffer(comment).trim() === ''"
                  @click="emit('saveComment', comment.id)"
                >
                  <span v-if="pending === 'comment'" class="ui-spinner" aria-hidden="true" />
                  {{ pending === 'comment' ? 'Saving comment…' : 'Save comment' }}
                </button>
                <button type="button" class="ui-button" :disabled="pending !== null || mutationLocked === true" @click="closeEdit(comment)">Cancel edit</button>
              </div>
            </template>
            <template v-else>
              <p>{{ comment.body }}</p>
              <div class="review-panel__actions">
                <button v-if="comment.status === 'verified'" type="button" class="ui-button" @click="emit('show', comment.id)">Show comment</button>
                <button v-else type="button" class="ui-button" disabled>Show comment</button>
                <button data-comment-edit type="button" class="ui-button" :disabled="comment.status !== 'verified' || pending !== null || conflict !== null || mutationLocked === true" @click="startEdit(comment)">Edit</button>
                <button
                  type="button"
                  class="ui-button"
                  :class="{ 'ui-button--busy': pending === 'resolve' && pendingFocus?.commentId === comment.id }"
                  :aria-busy="pending === 'resolve' && pendingFocus?.commentId === comment.id || undefined"
                  :disabled="pending !== null || conflict !== null || mutationLocked === true"
                  @click="runLifecycle(comment.id, 'resolve')"
                >
                  <span v-if="pending === 'resolve' && pendingFocus?.commentId === comment.id" class="ui-spinner" aria-hidden="true" />
                  {{ pending === 'resolve' && pendingFocus?.commentId === comment.id ? 'Resolving…' : 'Resolve' }}
                </button>
                <button data-comment-delete-trigger type="button" class="ui-button ui-button--destructive" :disabled="pending !== null || conflict !== null || mutationLocked === true" @click="openDeleteConfirmation(comment.id)">Delete</button>
              </div>
              <p v-if="comment.status !== 'verified'">Editing requires a verified anchor.</p>
              <template v-if="comment.status !== 'verified'">
                <p>This recorded anchor cannot be relocated. Its exact recorded details remain available.</p>
                <dl class="comments-rail__anchor-details">
                  <dt>Exact path bytes</dt><dd>{{ comment.recordedAnchor.path.bytesBase64url }}</dd>
                  <dt>Blob OID</dt><dd>{{ comment.recordedAnchor.blobOid }}</dd>
                  <dt>Selected text</dt><dd>{{ comment.recordedAnchor.selectedText }}</dd>
                  <dt>Verification</dt><dd>{{ comment.status }}</dd>
                </dl>
                <button v-if="comment.exactFile.kind === 'available'" type="button" class="ui-button" @click="emit('inspectRecordedFile', comment.id)">Inspect recorded file</button>
                <button type="button" class="ui-button" @click="emit('copyRecordedAnchor', comment.id)">Copy anchor details</button>
              </template>
            </template>

            <section
              v-if="confirmingEditDiscard === comment.id"
              class="review-panel__confirm"
              role="region"
              :aria-labelledby="`discard-comment-heading-${comment.id}`"
              @keydown="onEditConfirmationEscape($event, comment.id)"
            >
              <h6 :id="`discard-comment-heading-${comment.id}`">Discard comment edits?</h6>
              <p>Your saved comment will stay unchanged.</p>
              <button data-keep-editing type="button" class="ui-button" @click="keepEditing(comment.id)">Keep editing</button>
              <button type="button" class="ui-button ui-button--destructive" @click="discardEdits(comment)">Discard edits</button>
            </section>

            <section
              v-if="confirmingDelete === comment.id"
              class="review-panel__confirm"
              role="region"
              :aria-labelledby="`delete-comment-heading-${comment.id}`"
              @keydown="onDeleteConfirmationEscape($event, comment.id)"
            >
              <h6 :id="`delete-comment-heading-${comment.id}`">Delete comment?</h6>
              <p>{{ comment.recordedAnchor.safeDisplayPath }} · {{ comment.side === 'base' ? 'Base' : 'Head' }} line {{ comment.line }}</p>
              <p>{{ comment.body }}</p>
              <p>This permanently removes the comment from this local draft. Compare has no undo history.</p>
              <button data-keep-comment type="button" class="ui-button" :disabled="pending !== null || mutationLocked === true" @click="cancelDelete(comment.id)">Keep comment</button>
              <button
                type="button"
                class="ui-button ui-button--destructive"
                :class="{ 'ui-button--busy': pending === 'delete' && pendingFocus?.commentId === comment.id }"
                :aria-busy="pending === 'delete' && pendingFocus?.commentId === comment.id || undefined"
                :disabled="pending !== null || conflict !== null || mutationLocked === true"
                @click="confirmDelete(comment.id)"
              >
                <span v-if="pending === 'delete' && pendingFocus?.commentId === comment.id" class="ui-spinner" aria-hidden="true" />
                {{ pending === 'delete' && pendingFocus?.commentId === comment.id ? 'Deleting…' : 'Delete comment' }}
              </button>
            </section>
            <p v-if="pending === 'resolve' && pendingFocus?.commentId === comment.id" role="status">Resolving comment…</p>
          </article>
          </div>
        </section>
      </div>
    </section>

    <section class="review-panel__comments review-panel__section" aria-labelledby="resolved-comments-heading">
      <h3>
        <button
          id="resolved-comments-heading"
          type="button"
          class="ui-button review-panel__disclosure"
          :aria-expanded="resolvedOpen"
          aria-controls="resolved-comments-content"
          @click="resolvedOpen = !resolvedOpen"
        >Resolved comments ({{ resolvedCount }})</button>
      </h3>
      <div v-if="resolvedOpen" id="resolved-comments-content">
        <section v-if="resolvedCount === 0" class="review-panel__empty" aria-labelledby="no-resolved-comments-heading">
          <h4 id="no-resolved-comments-heading">No resolved comments</h4>
          <p>Resolved comments will remain available here.</p>
        </section>
        <section v-for="group in groups.resolved" v-else :key="group.path.bytesBase64url" class="review-panel__group">
          <header class="review-panel__group-header">
            <h4 tabindex="-1"><PathText :display="group.path.display" /></h4>
            <span>({{ group.comments.length }})</span>
          </header>
          <div class="review-panel__group-rows">
          <article
            v-for="comment in group.comments"
            :key="comment.id"
            :data-comment-id="comment.id"
            class="review-panel__comment comments-rail__comment"
            :class="{ 'review-panel__comment--selected': selectedCommentId === comment.id, 'review-panel__comment--busy': (pending === 'resolve' || pending === 'reopen' || pending === 'delete') && pendingFocus?.commentId === comment.id }"
            :aria-labelledby="`comment-heading-${comment.id}`"
          >
            <div class="review-panel__comment-heading">
              <h5 :id="`comment-heading-${comment.id}`" data-comment-heading tabindex="-1">
                <PathText :display="comment.recordedAnchor.safeDisplayPath" /> · {{ comment.side === 'base' ? 'Base' : 'Head' }} line {{ comment.line }}
              </h5>
              <div class="review-panel__comment-badges">
                <ReviewStateBadge kind="resolved" label="Resolved" />
                <ReviewStateBadge :kind="comment.status === 'verified' ? 'verified' : comment.status === 'stale' ? 'stale' : 'unavailable'" :label="comment.status === 'verified' ? 'Verified' : comment.status === 'stale' ? 'Stale anchor' : 'Anchor unavailable'" />
                <ReviewStateBadge v-if="selectedCommentId === comment.id" kind="selected" label="Selected" />
              </div>
            </div>
            <template v-if="editing === comment.id">
              <p>{{ comment.recordedAnchor.safeDisplayPath }} · {{ comment.side === 'base' ? 'Base' : 'Head' }} · line {{ comment.line }} · Anchor fields fixed for this comment.</p>
              <details><summary>Saved text</summary><p>{{ comment.body }}</p></details>
              <label>Comment
                <textarea
                  :value="buffer(comment)"
                  :disabled="pending !== null || conflict !== null"
                  @input="emit('update:commentBuffer', comment.id, ($event.target as HTMLTextAreaElement).value)"
                  @keydown="onEditKeydown($event, comment)"
                />
              </label>
              <p v-if="buffer(comment) !== comment.body">Unsaved</p>
              <p v-if="buffer(comment).trim() === ''" role="alert">Write a comment before saving it.</p>
              <div class="review-panel__actions">
              <button type="button" class="ui-button ui-button--primary" :class="{ 'ui-button--busy': pending === 'comment' }" :aria-busy="pending === 'comment' || undefined" :disabled="pending !== null || conflict !== null || buffer(comment).trim() === ''" @click="emit('saveComment', comment.id)"><span v-if="pending === 'comment'" class="ui-spinner" aria-hidden="true" />{{ pending === 'comment' ? 'Saving comment…' : 'Save comment' }}</button>
                <button type="button" class="ui-button" :disabled="pending !== null" @click="closeEdit(comment)">Cancel edit</button>
              </div>
            </template>
            <template v-else>
              <p>{{ comment.body }}</p>
              <div class="review-panel__actions">
                <button v-if="comment.status === 'verified'" type="button" class="ui-button" @click="emit('show', comment.id)">Show comment</button>
                <button v-else type="button" class="ui-button" disabled>Show comment</button>
                <button data-comment-edit type="button" class="ui-button" :disabled="comment.status !== 'verified' || pending !== null || conflict !== null || mutationLocked === true" @click="startEdit(comment)">Edit</button>
                <button type="button" class="ui-button" :class="{ 'ui-button--busy': pending === 'reopen' && pendingFocus?.commentId === comment.id }" :aria-busy="pending === 'reopen' && pendingFocus?.commentId === comment.id || undefined" :disabled="pending !== null || conflict !== null || mutationLocked === true" @click="runLifecycle(comment.id, 'reopen')"><span v-if="pending === 'reopen' && pendingFocus?.commentId === comment.id" class="ui-spinner" aria-hidden="true" />{{ pending === 'reopen' && pendingFocus?.commentId === comment.id ? 'Reopening…' : 'Reopen' }}</button>
                <button data-comment-delete-trigger type="button" class="ui-button ui-button--destructive" :disabled="pending !== null || conflict !== null || mutationLocked === true" @click="openDeleteConfirmation(comment.id)">Delete</button>
              </div>
              <p v-if="comment.status !== 'verified'">Editing requires a verified anchor.</p>
            </template>

            <section
              v-if="confirmingEditDiscard === comment.id"
              class="review-panel__confirm"
              role="region"
              :aria-labelledby="`discard-comment-heading-${comment.id}`"
              @keydown="onEditConfirmationEscape($event, comment.id)"
            >
              <h6 :id="`discard-comment-heading-${comment.id}`">Discard comment edits?</h6>
              <p>Your saved comment will stay unchanged.</p>
              <button data-keep-editing type="button" class="ui-button" @click="keepEditing(comment.id)">Keep editing</button>
              <button type="button" class="ui-button ui-button--destructive" @click="discardEdits(comment)">Discard edits</button>
            </section>

            <section
              v-if="confirmingDelete === comment.id"
              class="review-panel__confirm"
              role="region"
              :aria-labelledby="`delete-comment-heading-${comment.id}`"
              @keydown="onDeleteConfirmationEscape($event, comment.id)"
            >
              <h6 :id="`delete-comment-heading-${comment.id}`">Delete comment?</h6>
              <p>{{ comment.recordedAnchor.safeDisplayPath }} · {{ comment.side === 'base' ? 'Base' : 'Head' }} line {{ comment.line }}</p>
              <p>{{ comment.body }}</p>
              <p>This permanently removes the comment from this local draft. Compare has no undo history.</p>
              <button data-keep-comment type="button" class="ui-button" :disabled="pending !== null || mutationLocked === true" @click="cancelDelete(comment.id)">Keep comment</button>
              <button type="button" class="ui-button ui-button--destructive" :class="{ 'ui-button--busy': pending === 'delete' && pendingFocus?.commentId === comment.id }" :aria-busy="pending === 'delete' && pendingFocus?.commentId === comment.id || undefined" :disabled="pending !== null || conflict !== null || mutationLocked === true" @click="confirmDelete(comment.id)"><span v-if="pending === 'delete' && pendingFocus?.commentId === comment.id" class="ui-spinner" aria-hidden="true" />{{ pending === 'delete' && pendingFocus?.commentId === comment.id ? 'Deleting…' : 'Delete comment' }}</button>
            </section>
            <p v-if="pending === 'reopen' && pendingFocus?.commentId === comment.id" role="status">Reopening comment…</p>
          </article>
          </div>
        </section>
      </div>
    </section>
    <section class="review-panel__section review-panel__section--export">
      <ExportSection
        :revision="revision"
        :pinned-endpoints="pinnedEndpoints"
        :summary="summary"
        :summary-buffer="summaryBuffer"
        :comments="comments"
        :comment-buffers="commentBuffers"
        :export-state="exportState"
        :append-ignore-rule="appendIgnoreRule"
        :refresh-ignore-status="refreshIgnoreStatus"
        :reveal-export-directory="revealExportDirectory"
        :attached="attached"
        :locked="mutationLocked"
        @cancel="emit('cancelExport')"
        @export="emit('export')"
        @reload-latest="emit('reload-latest')"
        @review-unsaved-text="emit('reviewUnsavedText')"
      />
    </section>

    <section v-if="attached" class="review-panel__section attached-completion" aria-labelledby="finish-attached-review-heading">
      <header class="attached-completion__heading">
        <h3 id="finish-attached-review-heading">Finish attached review</h3>
        <ReviewStateBadge
          :kind="attachedLifecycle === 'completed' ? 'resolved' : 'open'"
          :label="attachedLifecycle === 'completed' ? 'Completed' : attachedLifecycle === 'finishing' ? 'Finishing' : 'Waiting'"
        />
      </header>

      <template v-if="attachedLifecycle === 'completed'">
        <div class="inline-notice inline-notice--success" role="status">
          <UiIcon name="success" class="inline-notice__icon" />
          <div class="inline-notice__content">
            <h4 ref="completionSuccess" tabindex="-1">Review finished</h4>
            <p>The accepted review was returned to the requesting agent from revision {{ revision }}. You can close this tab.</p>
          </div>
        </div>
      </template>

      <template v-else-if="attachedLifecycle === 'finishing'">
        <button ref="completionAction" type="button" class="ui-button ui-button--primary attached-completion__action" disabled aria-busy="true">
          <span class="ui-spinner" aria-hidden="true" />Finishing review…
        </button>
        <p class="attached-completion__progress" role="status" aria-live="polite">Validating accepted revision {{ revision }} and its recorded anchors…</p>
      </template>

      <template v-else-if="attachedLifecycle === 'waitingDisconnected'">
        <div class="inline-notice inline-notice--error" role="alert">
          <UiIcon name="error" class="inline-notice__icon" />
          <div class="inline-notice__content">
            <h4 ref="completionFailure" tabindex="-1">Waiting for agent connection</h4>
            <p>Compare can’t confirm whether this attached review was finished. Reload this page to check the coordinator.</p>
            <button type="button" class="ui-button" @click="emit('reloadAttached')">Reload page</button>
          </div>
        </div>
      </template>

      <template v-else-if="attachedLifecycle === 'terminalFailure'">
        <div class="inline-notice inline-notice--error" role="alert">
          <UiIcon name="error" class="inline-notice__icon" />
          <div class="inline-notice__content">
            <h4 ref="completionFailure" tabindex="-1">Finish status is ambiguous</h4>
            <p>Compare may have finished this review, but the coordinator did not confirm delivery. Reload this page to check the coordinator. Do not retry Finish review from this tab.</p>
            <button type="button" class="ui-button" @click="emit('reloadAttached')">Reload page</button>
          </div>
        </div>
      </template>

      <template v-else-if="attachedLifecycle === 'retryableFailure' && attachedFailure?.kind === 'revisionConflict'">
        <div class="inline-notice inline-notice--warning" role="alert">
          <UiIcon name="warning" class="inline-notice__icon" />
          <div class="inline-notice__content">
            <h4 ref="completionFailure" tabindex="-1">Review changed before finishing</h4>
            <p>This tab expected revision {{ attachedFailure.expectedRevision }}, but the accepted review is now revision {{ attachedFailure.actualRevision }}. Nothing was finished. Reload the latest review before trying again.</p>
            <button type="button" class="ui-button" @click="emit('reloadLatest')">Reload latest</button>
          </div>
        </div>
      </template>

      <template v-else-if="attachedLifecycle === 'retryableFailure' && attachedFailure?.kind === 'staleAnchors'">
        <div class="inline-notice inline-notice--warning" role="alert">
          <UiIcon name="warning" class="inline-notice__icon" />
          <div class="inline-notice__content">
            <h4 ref="completionFailure" tabindex="-1">Review can’t be finished</h4>
            <p>{{ attachedFailure.affectedCount }} comment{{ attachedFailure.affectedCount === 1 ? '' : 's' }} no longer {{ attachedFailure.affectedCount === 1 ? 'has' : 'have' }} a verified anchor. Update or delete stale feedback before finishing.</p>
            <button type="button" class="ui-button" @click="focusStaleFeedback">Review stale feedback</button>
          </div>
        </div>
      </template>

      <template v-else-if="attachedLifecycle === 'retryableFailure' && attachedFailure?.kind === 'scopeInvalid'">
        <div class="inline-notice inline-notice--warning" role="alert">
          <UiIcon name="warning" class="inline-notice__icon" />
          <div class="inline-notice__content">
            <h4 ref="completionFailure" tabindex="-1">Review scope is no longer valid</h4>
            <p>{{ isExactPatch ? 'The exact patch request is no longer available. Relaunch the review from the requesting agent.' : 'The selected review range no longer resolves to the requested commits. Relaunch the review from the requesting agent.' }}</p>
            <button type="button" class="ui-button" @click="emit('viewAttachedScope')">View requested scope</button>
          </div>
        </div>
      </template>

      <template v-else-if="attachedLifecycle === 'retryableFailure' && attachedFailure?.kind === 'draftReadOnly'">
        <div class="inline-notice inline-notice--warning" role="alert">
          <UiIcon name="warning" class="inline-notice__icon" />
          <div class="inline-notice__content">
            <h4 ref="completionFailure" tabindex="-1">Review draft needs recovery</h4>
            <p>The local review draft could not be accepted. Reload the review before trying again.</p>
            <button type="button" class="ui-button" @click="emit('reloadAttached')">Reload review</button>
          </div>
        </div>
      </template>

      <template v-else-if="attachedLifecycle === 'retryableFailure'">
        <div class="inline-notice inline-notice--error" role="alert">
          <UiIcon name="error" class="inline-notice__icon" />
          <div class="inline-notice__content">
            <h4 ref="completionFailure" tabindex="-1">Review was not finished</h4>
            <p>The accepted review could not be finished. Your saved feedback is unchanged. Try again after checking Compare is running.</p>
            <button type="button" class="ui-button ui-button--primary" @click="finishAttachedReview">Try Finish review again</button>
          </div>
        </div>
      </template>

      <template v-else>
        <p class="attached-completion__waiting">The requesting agent is waiting. Only Finish review returns the accepted summary and comments. Exporting, closing, reloading, or disconnecting leaves this review unfinished.</p>
        <div v-if="attachedNoFeedback" class="inline-notice">
          <div class="inline-notice__content">
            <h4>No feedback added</h4>
            <p>This review has no accepted summary or comments. You can still finish and return an empty review result, or add feedback first.</p>
          </div>
        </div>
        <div v-if="attachedHasUnsavedText" class="inline-notice inline-notice--warning">
          <div class="inline-notice__content">
            <h4>Save or discard your changes first</h4>
            <p>Finish review uses only the accepted review. Save your summary or comment changes, or discard them before finishing.</p>
            <button type="button" class="ui-button" @click="emit('reviewUnsavedText')">Review unsaved changes</button>
          </div>
        </div>
        <p v-else-if="attachedBlockedByPending" class="attached-completion__pending" role="status">Saving review changes…</p>
        <div v-else-if="attachedBlockedByConflict" class="inline-notice inline-notice--warning">
          <div class="inline-notice__content">
            <h4>Review changed in another tab</h4>
            <p>Nothing from your attempt was written. Unsaved text retained in this tab.</p>
            <button type="button" class="ui-button" @click="emit('reloadLatest')">Reload latest</button>
          </div>
        </div>
        <button ref="completionAction" type="button" class="ui-button ui-button--primary attached-completion__action" :disabled="attachedReady !== true" @click="finishAttachedReview">Finish review</button>
      </template>
    </section>
  </section>
</template>
