<script setup lang="ts">
import { h, nextTick, onBeforeUnmount, onMounted, ref, render, watch } from 'vue';

import type { FileContentResponse } from '../../contracts/api.js';
import CommentComposer from './CommentComposer.vue';
import {
  createMonacoDiffAdapter,
  type DiffSide,
  type MonacoDiffAdapter,
} from '../monaco/diff-adapter.js';
import type { WorkspaceComment, WorkspaceComposer } from '../model/workspace-state.js';
import { configureMonacoWorkers, languageForPath } from '../monaco/configure.js';

const props = defineProps<{
  comments: readonly WorkspaceComment[];
  composer?: WorkspaceComposer;
  content: FileContentResponse;
  path: string;
}>();

const emit = defineEmits<{
  add: [];
  cancel: [];
  confirmDiscard: [];
  activate: [side: DiffSide, line: number];
  keepWriting: [];
  ready: [fileId: string];
  updateText: [text: string];
}>();

const host = ref<HTMLElement>();
let adapter: MonacoDiffAdapter | undefined;
let resizeObserver: ResizeObserver | undefined;
let annotationObserver: MutationObserver | undefined;
let loadVersion = 0;
let observedAnchor = '';

function immutableFile() {
  const fallbackPath = props.path;
  return {
    id: props.content.fileId,
    base: props.content.base.exists
      ? { path: props.content.base.path.display, text: props.content.base.text }
      : { path: fallbackPath, text: '' },
    head: props.content.head.exists
      ? { path: props.content.head.path.display, text: props.content.head.text }
      : { path: fallbackPath, text: '' },
  };
}

function currentComment() {
  const anchor = adapter?.getActiveAnchor();
  return anchor === undefined
    ? undefined
    : props.comments.find((comment) => comment.fileId === anchor.fileId
      && comment.side === anchor.side && comment.line === anchor.line && comment.status === 'verified');
}

function renderAnnotation(): void {
  const zone = host.value?.querySelector<HTMLElement>('.monaco-anchor-zone--composer');
  const anchor = adapter?.getActiveAnchor();
  if (zone === undefined || anchor === undefined || anchor.fileId !== props.content.fileId) {
    return;
  }
  const comment = currentComment();
  if (comment !== undefined) {
    render(h('section', { class: 'inline-accepted-comment', 'data-comment-id': comment.id },
      [h('h3', { tabindex: -1 }, `${props.path} · ${comment.side === 'base' ? 'Base' : 'Head'} · line ${comment.line}`),
        h('span', { class: 'comment-badge' }, 'Saved locally'), h('p', comment.body)]), zone);
    return;
  }
  if (props.composer === undefined || props.composer.side !== anchor.side || props.composer.line !== anchor.line) {
    return;
  }
  render(h(CommentComposer, {
    ...props.composer,
    path: props.path,
    onAdd: () => emit('add'),
    onCancel: () => emit('cancel'),
    onConfirmDiscard: () => emit('confirmDiscard'),
    onKeepWriting: () => emit('keepWriting'),
    onUpdateText: (text: string) => emit('updateText', text),
  }), zone);
}

function syncActiveAnchor(): void {
  const anchor = adapter?.getActiveAnchor();
  if (anchor === undefined || anchor.fileId !== props.content.fileId) {
    return;
  }
  const key = `${anchor.side}:${anchor.line}`;
  if (key !== observedAnchor) {
    observedAnchor = key;
    emit('activate', anchor.side, anchor.line);
  }
  void nextTick(renderAnnotation);
}

async function loadContent(): Promise<void> {
  if (adapter === undefined) return;
  const version = ++loadVersion;
  await adapter.setFile(immutableFile());
  if (version === loadVersion) emit('ready', props.content.fileId);
}

function previousChange(): void {
  adapter?.goToChange('previous');
}

function nextChange(): void {
  adapter?.goToChange('next');
}

function layout(): void {
  adapter?.layout();
}

function addHeadComment(): void {
  adapter?.activateAnchor('head', 1);
}

function focusComment(commentId: string): void {
  host.value?.querySelector<HTMLElement>(`[data-comment-id="${CSS.escape(commentId)}"] h3`)?.focus();
}

function revealComment(side: DiffSide, line: number): void {
  adapter?.revealAnchor({ fileId: props.content.fileId, side, line });
}

defineExpose({ focusComment, layout, nextChange, previousChange, revealComment });

watch(() => [props.composer, props.comments] as const, () => {
  const anchor = adapter?.getActiveAnchor();
  if (props.composer === undefined && currentComment() === undefined && anchor !== undefined) {
    adapter?.clearAnchor();
  } else {
    void nextTick(renderAnnotation);
  }
}, { deep: true });

watch(() => props.content, () => {
  observedAnchor = '';
  void loadContent();
});

onMounted(() => {
  if (host.value === undefined) return;
  configureMonacoWorkers();
  adapter = createMonacoDiffAdapter(host.value, languageForPath, syncActiveAnchor);
  annotationObserver = new MutationObserver(() => void nextTick(renderAnnotation));
  annotationObserver.observe(host.value, { childList: true, subtree: true });
  resizeObserver = new ResizeObserver(() => adapter?.layout());
  resizeObserver.observe(host.value);
  void loadContent();
});
onBeforeUnmount(() => {
  annotationObserver?.disconnect();
  resizeObserver?.disconnect();
  adapter?.dispose();
});
</script>

<template>
  <section class="diff-workspace" :aria-label="`${path}: base and head side-by-side diff`">
    <div class="diff-workspace__side-labels" aria-hidden="true">
      <span>BASE</span>
      <span>HEAD</span>
    </div>
    <button
      type="button"
      class="diff-workspace__gutter-action"
      aria-label="Add comment to head line 1"
      title="Add comment to head line 1 · Option+Enter"
      @click="addHeadComment"
    >+</button>
    <div ref="host" class="diff-workspace__editor" />
    <CommentComposer
      v-if="composer"
      :path="path"
      :side="composer.side"
      :line="composer.line"
      :text="composer.text"
      :status="composer.status"
      :validation="composer.validation"
      :error="composer.error"
      @add="emit('add')"
      @cancel="emit('cancel')"
      @confirm-discard="emit('confirmDiscard')"
      @keep-writing="emit('keepWriting')"
      @update-text="(text) => emit('updateText', text)"
    />
    <p class="diff-workspace__context-help">
      Unchanged regions begin collapsed. Use Monaco’s context controls to reveal bounded context or all remaining context.
    </p>
  </section>
</template>
