<script setup lang="ts">
import type { WorkspaceComment } from '../model/workspace-state.js';

const props = defineProps<{
  comments: readonly WorkspaceComment[];
  fileOrder: readonly string[];
  filePath: (fileId: string) => string;
}>();

const emit = defineEmits<{
  inspect: [commentId: string];
  show: [commentId: string];
}>();

const orderedComments = () => [...props.comments].sort((left, right) => {
  const fileOrder = props.fileOrder.indexOf(left.fileId) - props.fileOrder.indexOf(right.fileId);
  if (fileOrder !== 0) return fileOrder;
  const sideOrder = (left.side === 'base' ? 0 : 1) - (right.side === 'base' ? 0 : 1);
  return sideOrder !== 0 ? sideOrder : left.line - right.line;
});

const badge = (comment: WorkspaceComment) => comment.status === 'verified'
  ? 'Saved'
  : comment.status === 'stale' ? 'Stale anchor' : 'Anchor unavailable';
</script>

<template>
  <section v-if="comments.length === 0" class="comments-rail__empty">
    <h3>Start with a line</h3>
    <p>Choose a line in the diff, then use the + gutter button or Option+Enter on macOS; Alt+Enter on Windows and Linux.</p>
  </section>
  <ol v-else class="comments-rail__list">
    <li v-for="comment in orderedComments()" :key="comment.id" class="comments-rail__comment">
      <p class="comments-rail__metadata">{{ filePath(comment.fileId) }}</p>
      <p class="comments-rail__metadata">{{ comment.side === 'base' ? 'Base' : 'Head' }} line {{ comment.line }}</p>
      <span class="comment-badge">{{ badge(comment) }}</span>
      <p class="comments-rail__body">{{ comment.body }}</p>
      <template v-if="comment.status === 'verified'">
        <button type="button" class="ui-button" @click="emit('show', comment.id)">Show comment</button>
      </template>
      <template v-else>
        <p>{{ comment.status === 'stale'
          ? 'Anchor no longer verifies. The pinned text or context does not match this comment’s recorded anchor. It has not been moved.'
          : 'The recorded file, blob, side, or line can’t be opened in this pinned comparison. The comment is preserved and has not been moved.' }}</p>
        <button type="button" class="ui-button" @click="emit('inspect', comment.id)">Inspect recorded file</button>
      </template>
    </li>
  </ol>
</template>
