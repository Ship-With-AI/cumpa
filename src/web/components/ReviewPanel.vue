<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';

import type { ReviewPendingOperation } from '../model/review-draft-state.js';
import type { ReviewExportState } from '../model/review-draft-state.js';
import type { AppendDiffReviewIgnoreResult, ExportDirectoryRevealResult } from '../../contracts/api.js';
import { projectCommentGroups } from '../model/comment-groups.js';
import type { WorkspaceComment } from '../model/workspace-state.js';
import SummarySection from './SummarySection.vue';
import ExportSection from './ExportSection.vue';
import ReviewStateBadge from './ui/ReviewStateBadge.vue';

type ReviewFailure = Readonly<{
  operation: ReviewPendingOperation;
  commentId?: string;
}>;

const props = defineProps<{
  comments: readonly WorkspaceComment[];
  inventory: readonly { identity: string; display: string }[];
  summary: string;
  revision: number;
  pinnedBase: Readonly<{ label: string; oid: string }>;
  pinnedHead: Readonly<{ label: string; oid: string }>;
  summaryBuffer: string;
  commentBuffers: ReadonlyMap<string, string>;
  pending: ReviewPendingOperation | null;
  conflict: Readonly<{ expectedRevision: number; actualRevision: number }> | null;
  failure: ReviewFailure | null;
  retainedSummary: boolean;
  exportState: ReviewExportState;
  appendIgnoreRule: () => Promise<AppendDiffReviewIgnoreResult>;
  refreshIgnoreStatus: () => Promise<void>;
  revealExportDirectory: () => Promise<ExportDirectoryRevealResult>;
  selectedCommentId?: string | null;
}>();

const emit = defineEmits<{
  cancelSummary: [];
  close: [];
  copyRecordedAnchor: [commentId: string];
  delete: [commentId: string];
  edit: [commentId: string];
  'reload-latest': [];
  reopen: [commentId: string];
  inspectRecordedFile: [commentId: string];
  resolve: [commentId: string];
  saveComment: [commentId: string];
  cancelExport: [];
  saveSummary: [];
  export: [];
  reviewUnsavedText: [];
  show: [commentId: string];
  'update:commentBuffer': [commentId: string, value: string];
  'update:summaryBuffer': [value: string];
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
  emit('update:commentBuffer', comment.id, comment.body);
  confirmingEditDiscard.value = null;
  editing.value = null;
  void nextTick(() => focusEditButton(comment.id));
}

function onEditKeydown(event: KeyboardEvent, comment: WorkspaceComment): void {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && buffer(comment).trim() !== '' && props.pending === null && props.conflict === null) {
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
  confirmingDelete.value = commentId;
  focusWithinComment(commentId, '[data-keep-comment]');
}

function cancelDelete(commentId: string): void {
  confirmingDelete.value = null;
  focusWithinComment(commentId, '[data-delete-trigger]');
}

function confirmDelete(commentId: string): void {
  pendingFocus.value = { kind: 'delete', commentId, visibleOrder: [...visibleOrder.value] };
  emit('delete', commentId);
}

function runLifecycle(commentId: string, kind: 'resolve' | 'reopen'): void {
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
</script>

<template>
  <section ref="root" class="review-panel" aria-labelledby="review-heading" @keydown.escape="closeFromEscape">
    <header class="review-panel__heading">
      <div>
        <h2 id="review-heading" ref="heading" tabindex="-1">Review</h2>
        <p><span>Open {{ openCount }}</span> · <span>Resolved {{ resolvedCount }}</span></p>
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
      <h3 id="review-conflict-heading">Review changed in another tab</h3>
      <dl>
        <div><dt>Your revision</dt><dd>{{ conflict.expectedRevision }}</dd></div>
        <div><dt>Latest revision</dt><dd>{{ conflict.actualRevision }}</dd></div>
      </dl>
      <p>Nothing from your attempt was written.</p>
      <p>Unsaved text retained in this tab.</p>
      <button type="button" class="ui-button" @click="emit('reload-latest')">Reload latest</button>
    </section>

    <section
      v-if="reviewFailure"
      ref="failureAlert"
      class="inline-notice inline-notice--error review-panel__failure"
      role="alert"
      tabindex="-1"
      aria-labelledby="review-operation-failed-heading"
    >
      <h3 id="review-operation-failed-heading">Review change failed</h3>
      <p v-if="failure?.operation === 'comment'">Comment wasn’t saved. Your text is still here in this tab.</p>
      <p v-else>The review change wasn’t saved. The accepted local draft is unchanged. Try again after checking Diff Review is running.</p>
    </section>

    <SummarySection
      :canonical="summary"
      :model-value="summaryBuffer"
      :pending="pending !== null"
      :saving="pending === 'summary'"
      :conflict="conflict !== null"
      :failure="summaryFailure"
      :retained="retainedSummary"
      @cancel="emit('cancelSummary')"
      @save="emit('saveSummary')"
      @update:model-value="emit('update:summaryBuffer', $event)"
    />

    <section class="review-panel__comments" aria-labelledby="open-comments-heading">
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
          <h4 tabindex="-1">{{ group.path.display }} <span>({{ group.comments.length }})</span></h4>
          <article
            v-for="comment in group.comments"
            :key="comment.id"
            :data-comment-id="comment.id"
            class="review-panel__comment comments-rail__comment"
            :class="{ 'review-panel__comment--selected': selectedCommentId === comment.id }"
            :aria-labelledby="`comment-heading-${comment.id}`"
          >
            <h5 :id="`comment-heading-${comment.id}`" class="review-panel__comment-heading" data-comment-heading tabindex="-1">
              {{ comment.side === 'base' ? 'Base' : 'Head' }} line {{ comment.line }}
            </h5>
            <p><span>Open</span> · <span>{{ comment.status === 'verified' ? 'Verified' : comment.status === 'stale' ? 'Stale anchor' : 'Anchor unavailable' }}</span><ReviewStateBadge v-if="selectedCommentId === comment.id" kind="selected" label="Selected" /></p>

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
                <button type="button" class="ui-button ui-button--primary" :disabled="pending !== null || conflict !== null || buffer(comment).trim() === ''" @click="emit('saveComment', comment.id)">
                  {{ pending === 'comment' ? 'Saving comment…' : 'Save comment' }}
                </button>
                <button type="button" class="ui-button" :disabled="pending !== null" @click="closeEdit(comment)">Cancel edit</button>
              </div>
            </template>
            <template v-else>
              <p>{{ comment.body }}</p>
              <div class="review-panel__actions">
                <button v-if="comment.status === 'verified'" type="button" class="ui-button" @click="emit('show', comment.id)">Show comment</button>
                <button v-else type="button" class="ui-button" disabled>Show comment</button>
                <button data-comment-edit type="button" class="ui-button" :disabled="comment.status !== 'verified' || pending !== null || conflict !== null" @click="startEdit(comment)">Edit</button>
                <button type="button" class="ui-button" :disabled="pending !== null || conflict !== null" @click="runLifecycle(comment.id, 'resolve')">Resolve</button>
                <button data-delete-trigger type="button" class="ui-button ui-button--destructive" :disabled="pending !== null || conflict !== null" @click="openDeleteConfirmation(comment.id)">Delete</button>
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
              <p>This permanently removes the comment from this local draft. Diff Review has no undo history.</p>
              <button data-keep-comment type="button" class="ui-button" :disabled="pending !== null" @click="cancelDelete(comment.id)">Keep comment</button>
              <button type="button" class="ui-button ui-button--destructive" :disabled="pending !== null || conflict !== null" @click="confirmDelete(comment.id)">
                {{ pending === 'delete' ? 'Deleting comment…' : 'Delete comment' }}
              </button>
            </section>
            <p v-if="pending === 'resolve' && pendingFocus?.commentId === comment.id" role="status">Resolving comment…</p>
          </article>
        </section>
      </div>
    </section>

    <section class="review-panel__comments" aria-labelledby="resolved-comments-heading">
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
          <h4 tabindex="-1">{{ group.path.display }} <span>({{ group.comments.length }})</span></h4>
          <article
            v-for="comment in group.comments"
            :key="comment.id"
            :data-comment-id="comment.id"
            class="review-panel__comment comments-rail__comment"
            :class="{ 'review-panel__comment--selected': selectedCommentId === comment.id }"
            :aria-labelledby="`comment-heading-${comment.id}`"
          >
            <h5 :id="`comment-heading-${comment.id}`" class="review-panel__comment-heading" data-comment-heading tabindex="-1">
              {{ comment.side === 'base' ? 'Base' : 'Head' }} line {{ comment.line }}
            </h5>
            <p><span>Resolved</span> · <span>{{ comment.status === 'verified' ? 'Verified' : comment.status === 'stale' ? 'Stale anchor' : 'Anchor unavailable' }}</span><ReviewStateBadge v-if="selectedCommentId === comment.id" kind="selected" label="Selected" /></p>
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
                <button type="button" class="ui-button ui-button--primary" :disabled="pending !== null || conflict !== null || buffer(comment).trim() === ''" @click="emit('saveComment', comment.id)">{{ pending === 'comment' ? 'Saving comment…' : 'Save comment' }}</button>
                <button type="button" class="ui-button" :disabled="pending !== null" @click="closeEdit(comment)">Cancel edit</button>
              </div>
            </template>
            <template v-else>
              <p>{{ comment.body }}</p>
              <div class="review-panel__actions">
                <button v-if="comment.status === 'verified'" type="button" class="ui-button" @click="emit('show', comment.id)">Show comment</button>
                <button v-else type="button" class="ui-button" disabled>Show comment</button>
                <button data-comment-edit type="button" class="ui-button" :disabled="comment.status !== 'verified' || pending !== null || conflict !== null" @click="startEdit(comment)">Edit</button>
                <button type="button" class="ui-button" :disabled="pending !== null || conflict !== null" @click="runLifecycle(comment.id, 'reopen')">Reopen</button>
                <button data-delete-trigger type="button" class="ui-button ui-button--destructive" :disabled="pending !== null || conflict !== null" @click="openDeleteConfirmation(comment.id)">Delete</button>
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
              <p>This permanently removes the comment from this local draft. Diff Review has no undo history.</p>
              <button data-keep-comment type="button" class="ui-button" :disabled="pending !== null" @click="cancelDelete(comment.id)">Keep comment</button>
              <button type="button" class="ui-button ui-button--destructive" :disabled="pending !== null || conflict !== null" @click="confirmDelete(comment.id)">{{ pending === 'delete' ? 'Deleting comment…' : 'Delete comment' }}</button>
            </section>
            <p v-if="pending === 'reopen' && pendingFocus?.commentId === comment.id" role="status">Reopening comment…</p>
          </article>
        </section>
      </div>
    </section>
    <ExportSection
      :revision="revision"
      :pinned-base="pinnedBase"
      :pinned-head="pinnedHead"
      :summary="summary"
      :summary-buffer="summaryBuffer"
      :comments="comments"
      :comment-buffers="commentBuffers"
      :export-state="exportState"
      :append-ignore-rule="appendIgnoreRule"
      :refresh-ignore-status="refreshIgnoreStatus"
      :reveal-export-directory="revealExportDirectory"
      @cancel="emit('cancelExport')"
      @export="emit('export')"
      @reload-latest="emit('reload-latest')"
      @review-unsaved-text="emit('reviewUnsavedText')"
    />
  </section>
</template>
