<script setup lang="ts">
import { computed, ref } from 'vue';

import type { WorkspaceComment } from '../model/workspace-state.js';
import { projectCommentGroups } from '../model/comment-groups.js';
import SummarySection from './SummarySection.vue';

const props = defineProps<{
  comments: readonly WorkspaceComment[];
  inventory: readonly { identity: string; display: string }[];
  summary: string;
  summaryBuffer: string;
  commentBuffers: ReadonlyMap<string, string>;
  pending: boolean;
  conflict: boolean;
}>();

const emit = defineEmits<{
  cancelSummary: [];
  copyRecordedAnchor: [commentId: string];
  delete: [commentId: string];
  edit: [commentId: string];
  reloadLatest: [];
  reopen: [commentId: string];
  inspectRecordedFile: [commentId: string];
  resolve: [commentId: string];
  saveComment: [commentId: string];
  saveSummary: [];
  show: [commentId: string];
  'update:commentBuffer': [commentId: string, value: string];
  'update:summaryBuffer': [value: string];
}>();

const resolvedOpen = ref(false);
const editing = ref<string | null>(null);
const confirmingDelete = ref<string | null>(null);
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

function buffer(comment: WorkspaceComment): string {
  return props.commentBuffers.get(comment.id) ?? comment.body;
}
</script>

<template>
  <section class="review-panel" aria-labelledby="review-heading">
    <header class="review-panel__heading"><h2 id="review-heading" tabindex="-1">Review</h2></header>
    <SummarySection
      :canonical="summary"
      :model-value="summaryBuffer"
      :pending="pending"
      :conflict="conflict"
      @cancel="emit('cancelSummary')"
      @save="emit('saveSummary')"
      @update:model-value="emit('update:summaryBuffer', $event)"
    />
    <div v-if="conflict" class="review-panel__conflict" role="alert">
      <p>Review changed in another tab. Your change was not saved because newer draft revision exists.</p>
      <button type="button" @click="emit('reloadLatest')">Reload latest</button>
    </div>
    <section aria-labelledby="open-comments-heading">
      <h3 id="open-comments-heading">Open comments ({{ comments.filter((comment) => comment.state === 'open').length }})</h3>
      <template v-for="group in groups.open" :key="group.path.bytesBase64url">
        <h4>{{ group.path.display }}</h4>
        <article v-for="comment in group.comments" :key="comment.id" :data-comment-id="comment.id" class="review-panel__comment comments-rail__comment">
          <p>{{ comment.side === 'base' ? 'Base' : 'Head' }} line {{ comment.line }} · {{ comment.status === 'verified' ? 'Verified' : comment.status === 'stale' ? 'Stale anchor' : 'Anchor unavailable' }}</p>
          <template v-if="editing === comment.id">
            <p>{{ comment.recordedAnchor.safeDisplayPath }} · Anchor fields fixed for comment.</p>
            <label>Comment <textarea :value="buffer(comment)" :disabled="pending || conflict" @input="emit('update:commentBuffer', comment.id, ($event.target as HTMLTextAreaElement).value)" /></label>
            <button type="button" :disabled="pending || conflict || buffer(comment).trim() === ''" @click="emit('saveComment', comment.id)">Save comment</button>
            <button type="button" :disabled="pending" @click="editing = null">Cancel edit</button>
          </template>
          <template v-else>
            <p>{{ comment.body }}</p>
            <template v-if="comment.status === 'verified'">
              <button type="button" @click="emit('show', comment.id)">Show comment</button>
              <button type="button" :disabled="pending || conflict" @click="editing = comment.id">Edit</button>
            </template>
            <template v-else>
              <p>This recorded anchor cannot be relocated. Its exact recorded details remain available.</p>
              <dl class="comments-rail__anchor-details">
                <dt>Exact path bytes</dt><dd>{{ comment.recordedAnchor.path.bytesBase64url }}</dd>
                <dt>Blob OID</dt><dd>{{ comment.recordedAnchor.blobOid }}</dd>
                <dt>Selected text</dt><dd>{{ comment.recordedAnchor.selectedText }}</dd>
                <dt>Verification</dt><dd>{{ comment.status }}</dd>
              </dl>
              <button v-if="comment.exactFile.kind === 'available'" type="button" @click="emit('inspectRecordedFile', comment.id)">Inspect recorded file</button>
              <button type="button" @click="emit('copyRecordedAnchor', comment.id)">Copy anchor details</button>
            </template>
            <button type="button" :disabled="pending || conflict" @click="emit('resolve', comment.id)">Resolve</button>
            <button type="button" :disabled="pending || conflict" @click="confirmingDelete = comment.id">Delete</button>
          </template>
          <div v-if="confirmingDelete === comment.id" class="review-panel__confirm" role="alert">
            <h4>Delete comment?</h4><p>{{ comment.recordedAnchor.safeDisplayPath }} · {{ comment.side === 'base' ? 'Base' : 'Head' }} line {{ comment.line }}</p><p>This permanently removes comment local draft. Diff Review has no undo history.</p>
            <button type="button" :disabled="pending" @click="confirmingDelete = null">Keep comment</button>
            <button type="button" :disabled="pending || conflict" @click="emit('delete', comment.id); confirmingDelete = null">Delete comment</button>
          </div>
        </article>
      </template>
    </section>
    <section aria-labelledby="resolved-comments-heading">
      <button id="resolved-comments-heading" type="button" :aria-expanded="resolvedOpen" @click="resolvedOpen = !resolvedOpen">Resolved ({{ comments.filter((comment) => comment.state === 'resolved').length }})</button>
      <template v-if="resolvedOpen">
        <template v-for="group in groups.resolved" :key="group.path.bytesBase64url">
          <h4>{{ group.path.display }}</h4>
          <article v-for="comment in group.comments" :key="comment.id" :data-comment-id="comment.id" class="review-panel__comment comments-rail__comment">
            <p>{{ comment.side === 'base' ? 'Base' : 'Head' }} line {{ comment.line }} · Resolved</p><p>{{ comment.body }}</p>
            <button v-if="comment.status === 'verified'" type="button" @click="emit('show', comment.id)">Show comment</button>
            <button type="button" :disabled="comment.status !== 'verified' || pending || conflict" @click="editing = comment.id">Edit</button>
            <button type="button" :disabled="pending || conflict" @click="emit('reopen', comment.id)">Reopen</button>
            <button type="button" :disabled="pending || conflict" @click="confirmingDelete = comment.id">Delete</button>
          </article>
        </template>
      </template>
    </section>
  </section>
</template>
