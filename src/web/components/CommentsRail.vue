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
  edit: [commentId: string];
  reopen: [commentId: string];
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
    v-bind="props"
    @cancel-summary="emit('cancelSummary')"
    @delete="emit('delete', $event)"
    @edit="emit('edit', $event)"
    @reopen="emit('reopen', $event)"
    @resolve="emit('resolve', $event)"
    @save-comment="emit('saveComment', $event)"
    @reload-latest="emit('reloadLatest')"
    @show="emit('show', $event)"
    @update:comment-buffer="forwardCommentBuffer"
    @update:summary-buffer="emit('update:summaryBuffer', $event)"
  />
</template>
