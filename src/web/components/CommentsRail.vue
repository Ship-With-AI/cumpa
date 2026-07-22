<script setup lang="ts">
import type { WorkspaceComment } from '../model/workspace-state.js';
import ReviewPanel from './ReviewPanel.vue';

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
  delete: [commentId: string];
  copyRecordedAnchor: [commentId: string];
  edit: [commentId: string];
  reopen: [commentId: string];
  inspectRecordedFile: [commentId: string];
  reloadLatest: [];
  resolve: [commentId: string];
  saveComment: [commentId: string];
  saveSummary: [];
  show: [commentId: string];
  'update:commentBuffer': [commentId: string, value: string];
  'update:summaryBuffer': [value: string];
}>();

function forwardCommentBuffer(commentId: string, value: string): void {
  emit('update:commentBuffer', commentId, value);
}
</script>

<template>
  <ReviewPanel
    :comments="comments"
    :inventory="inventory"
    :summary="summary"
    :summary-buffer="summaryBuffer"
    :comment-buffers="commentBuffers"
    :pending="pending"
    :conflict="conflict"
    @cancel-summary="emit('cancelSummary')"
    @copy-recorded-anchor="emit('copyRecordedAnchor', $event)"
    @inspect-recorded-file="emit('inspectRecordedFile', $event)"
    @delete="emit('delete', $event)"
    @edit="emit('edit', $event)"
    @reopen="emit('reopen', $event)"
    @resolve="emit('resolve', $event)"
    @save-comment="emit('saveComment', $event)"
    @save-summary="emit('saveSummary')"
    @reload-latest="emit('reloadLatest')"
    @show="emit('show', $event)"
    @update:comment-buffer="forwardCommentBuffer"
    @update:summary-buffer="emit('update:summaryBuffer', $event)"
  />
</template>
