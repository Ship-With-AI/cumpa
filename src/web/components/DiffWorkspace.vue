<script setup lang="ts">
import { h, nextTick, onBeforeUnmount, onMounted, ref, render, watch } from 'vue';

import type { FileContentResponse } from '../../contracts/api.js';
import CommentComposer from './CommentComposer.vue';
import {
  createMonacoDiffAdapter,
  type AnchorAffordanceTarget,
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
  confirmMove: [];
  activate: [side: DiffSide, line: number];
  keepWriting: [];
  ready: [fileId: string];
  updateText: [text: string];
}>();

const host = ref<HTMLElement>();
const anchorAffordance = ref<AnchorAffordanceTarget>();
let adapter: MonacoDiffAdapter | undefined;
let resizeObserver: ResizeObserver | undefined;
let loadVersion = 0;
let observedAnchor = '';
let zoneRoot: HTMLElement | undefined;
let focusComposerAfterRender = false;

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

function unmountZone(): void {
  if (zoneRoot !== undefined) {
    render(null, zoneRoot);
    zoneRoot = undefined;
  }
}

function renderAnnotation(): void {
  const zone = host.value?.querySelector<HTMLElement>('.monaco-anchor-zone--composer');
  const anchor = adapter?.getActiveAnchor();
  if (zone === undefined || anchor === undefined || anchor.fileId !== props.content.fileId) {
    unmountZone();
    return;
  }
  if (zoneRoot !== zone) {
    unmountZone();
    zoneRoot = zone;
  }
  const comment = currentComment();
  if (comment !== undefined) {
    render(h('section', { class: 'inline-accepted-comment', 'data-comment-id': comment.id },
      [h('h3', { tabindex: -1 }, `${props.path} · ${comment.side === 'base' ? 'Base' : 'Head'} · line ${comment.line}`),
        h('span', { class: 'comment-badge' }, 'Saved locally'), h('p', comment.body)]), zone);
    return;
  }
  if (props.composer === undefined || props.composer.side !== anchor.side || props.composer.line !== anchor.line) {
    render(null, zone);
    return;
  }
  render(h(CommentComposer, {
    ...props.composer,
    path: props.path,
    onAdd: () => emit('add'),
    onCancel: () => emit('cancel'),
    onConfirmDiscard: () => emit('confirmDiscard'),
    onConfirmMove: () => emit('confirmMove'),
    onKeepWriting: () => emit('keepWriting'),
    onUpdateText: (text: string) => emit('updateText', text),
  }), zone);
  void nextTick(() => {
    adapter?.setAnchorZoneHeight(Math.max(80, zone.scrollHeight));
    if (focusComposerAfterRender) {
      zone.querySelector<HTMLTextAreaElement>('textarea')?.focus();
      focusComposerAfterRender = false;
    }
  });
}

function syncAdapterState(): void {
  anchorAffordance.value = adapter?.getAnchorAffordance();
  const anchor = adapter?.getActiveAnchor();
  if (anchor === undefined || anchor.fileId !== props.content.fileId) {
    return;
  }
  const key = `${anchor.side}:${anchor.line}`;
  if (key !== observedAnchor) {
    observedAnchor = key;
    focusComposerAfterRender = true;
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

function addComment(target: AnchorAffordanceTarget): void {
  adapter?.activateAnchor(target.side, target.line);
}

function focusComment(commentId: string): void {
  host.value?.querySelector<HTMLElement>(`[data-comment-id="${CSS.escape(commentId)}"] h3`)?.focus();
}

function revealComment(side: DiffSide, line: number): void {
  adapter?.revealAnchor({ fileId: props.content.fileId, side, line });
}

defineExpose({ focusComment, layout, nextChange, previousChange, revealComment });

watch(() => [props.composer, props.comments] as const, () => {
  if (props.composer !== undefined) {
    const anchor = adapter?.getActiveAnchor();
    if (anchor?.fileId !== props.content.fileId
      || anchor.side !== props.composer.side || anchor.line !== props.composer.line) {
      adapter?.setActiveAnchor({
        fileId: props.content.fileId,
        side: props.composer.side,
        line: props.composer.line,
      });
      focusComposerAfterRender = true;
    }
  } else if (currentComment() === undefined && adapter?.getActiveAnchor() !== undefined) {
    unmountZone();
    adapter.clearAnchor();
  }
  void nextTick(renderAnnotation);
}, { deep: true });

watch(() => props.content, () => {
  observedAnchor = '';
  anchorAffordance.value = undefined;
  unmountZone();
  void loadContent();
});

onMounted(() => {
  if (host.value === undefined) return;
  configureMonacoWorkers();
  adapter = createMonacoDiffAdapter(host.value, languageForPath, syncAdapterState);
  resizeObserver = new ResizeObserver(() => adapter?.layout());
  resizeObserver.observe(host.value);
  void loadContent();
});
onBeforeUnmount(() => {
  unmountZone();
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
      v-if="anchorAffordance"
      type="button"
      class="diff-workspace__gutter-action"
      :class="{ 'diff-workspace__gutter-action--base': anchorAffordance.side === 'base' }"
      :style="{ top: `${anchorAffordance.top}px` }"
      :data-anchor-side="anchorAffordance.side"
      :data-anchor-line="anchorAffordance.line"
      :aria-label="`Add comment to ${anchorAffordance.side} line ${anchorAffordance.line}`"
      :title="`Add comment to ${anchorAffordance.side} line ${anchorAffordance.line} · Option+Enter`"
      @click="addComment(anchorAffordance)"
    >+</button>
    <div ref="host" class="diff-workspace__editor" />
    <p class="diff-workspace__context-help">
      Unchanged regions begin collapsed. Use Monaco’s context controls to reveal bounded context or all remaining context.
    </p>
  </section>
</template>
