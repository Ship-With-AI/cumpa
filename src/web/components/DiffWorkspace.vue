<script setup lang="ts">
import { h, nextTick, onBeforeUnmount, onMounted, ref, render, watch } from 'vue';

import type { FileContentResponse } from '../../contracts/api.js';
import CommentComposer from './CommentComposer.vue';
import PathText from './ui/PathText.vue';
import ReviewStateBadge from './ui/ReviewStateBadge.vue';
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
let observedComposerAnchor = '';
let zoneRoot: HTMLElement | undefined;
let focusComposerAnchor: string | undefined;

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
function composerAnchor(side: DiffSide, line: number): string {
  return `${side}:${line}`;
}



function unmountZone(): void {
  if (zoneRoot !== undefined) {
    render(null, zoneRoot);
    zoneRoot = undefined;
  }
}
function resizeAnchorZoneToContent(zone: HTMLElement): void {
  const contentHeight = zone.firstElementChild?.scrollHeight ?? zone.scrollHeight;
  adapter?.setAnchorZoneHeight(Math.max(280, contentHeight + 16));
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
    render(h('section', { class: 'conversation-card inline-accepted-comment', 'data-comment-id': comment.id }, [
      h('header', { class: 'conversation-card__header' }, [
        h('h3', { tabindex: -1, class: 'conversation-card__identity' }, [
          h(PathText, { display: props.path }),
          h('span', ` · ${comment.side === 'base' ? 'Base' : 'Head'} · line ${comment.line}`),
        ]),
        h('div', { class: 'conversation-card__badges' }, [
          h(ReviewStateBadge, { kind: comment.state, label: comment.state === 'open' ? 'Open' : 'Resolved' }),
          h(ReviewStateBadge, { kind: 'verified', label: 'Verified' }),
        ]),
      ]),
      h('div', { class: 'conversation-card__body' }, [h('p', comment.body)]),
      h('footer', { class: 'conversation-card__footer' }, [h('span', { class: 'comment-badge' }, 'Saved locally')]),
    ]), zone);
    void nextTick(() => {
      resizeAnchorZoneToContent(zone);
    });
    return;
  }
  if (props.composer === undefined || props.composer.side !== anchor.side || props.composer.line !== anchor.line) {
    render(null, zone);
    return;
  }
  const shouldFocusComposer = focusComposerAnchor === composerAnchor(props.composer.side, props.composer.line);
  render(h(CommentComposer, {
    ...props.composer,
    path: props.path,
    onCancel: () => emit('cancel'),
    onAdd: () => emit('add'),
    onConfirmDiscard: () => emit('confirmDiscard'),
    onConfirmMove: () => emit('confirmMove'),
    onKeepWriting: () => emit('keepWriting'),
    onUpdateText: (text: string) => emit('updateText', text),
  }), zone);
  void nextTick(() => {
    resizeAnchorZoneToContent(zone);
    if (shouldFocusComposer) {
      requestAnimationFrame(() => {
        if (zone !== host.value?.querySelector('.monaco-anchor-zone--composer')) {
          return;
        }
        zone.querySelector<HTMLTextAreaElement>('textarea')?.focus();
        focusComposerAnchor = undefined;
      });
    }
  });
}

function syncAdapterState(): void {
  const pendingMove = props.composer?.pendingMove;
  anchorAffordance.value = pendingMove === undefined
    ? adapter?.getAnchorAffordance()
    : adapter?.getAnchorAffordanceAt(pendingMove.side, pendingMove.line);
  if (pendingMove !== undefined) {
    return;
  }
  const anchor = adapter?.getActiveAnchor();
  if (anchor === undefined || anchor.fileId !== props.content.fileId) {
    return;
  }
  const key = composerAnchor(anchor.side, anchor.line);
  if (key === observedAnchor) {
    return;
  }
  observedAnchor = key;
  focusComposerAnchor = key;
  emit('activate', anchor.side, anchor.line);
}

async function loadContent(): Promise<void> {
  if (adapter === undefined) return;
  const version = ++loadVersion;
  await adapter.setFile(immutableFile());
  if (version !== loadVersion) return;

  const composer = props.composer;
  if (composer !== undefined && composer.side !== undefined && composer.line !== undefined) {
    const anchor = composerAnchor(composer.side, composer.line);
    observedAnchor = anchor;
    focusComposerAnchor = anchor;
    adapter.setActiveAnchor({ fileId: props.content.fileId, side: composer.side, line: composer.line });
    void nextTick(renderAnnotation);
  }

  emit('ready', props.content.fileId);
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
  if (props.composer === undefined || props.composer.text.trim().length === 0) {
    adapter?.activateAnchor(target.side, target.line);
    return;
  }
  emit('activate', target.side, target.line);
}

function focusComment(commentId: string): void {
  void nextTick(() => {
    host.value?.querySelector<HTMLElement>(`[data-comment-id="${CSS.escape(commentId)}"] h3`)?.focus();
  });
}


function revealComment(side: DiffSide, line: number): void {
  adapter?.revealAnchor({ fileId: props.content.fileId, side, line });
  void nextTick(renderAnnotation);
}

defineExpose({ focusComment, layout, nextChange, previousChange, revealComment });

watch(() => [props.composer, props.comments] as const, () => {
  if (props.composer !== undefined) {
    const activeComposerAnchor = composerAnchor(props.composer.side, props.composer.line);
    if (activeComposerAnchor !== observedComposerAnchor) {
      observedComposerAnchor = activeComposerAnchor;
      focusComposerAnchor = activeComposerAnchor;
    }
    observedAnchor = activeComposerAnchor;
    const anchor = adapter?.getActiveAnchor();
    if (anchor?.fileId !== props.content.fileId
      || anchor.side !== props.composer.side || anchor.line !== props.composer.line) {
      adapter?.setActiveAnchor({
        fileId: props.content.fileId,
        side: props.composer.side,
        line: props.composer.line,
      });
      focusComposerAnchor = activeComposerAnchor;
    }
  } else {
    observedComposerAnchor = '';
    if (currentComment() === undefined && adapter?.getActiveAnchor() !== undefined) {
      unmountZone();
      adapter.clearAnchor();
    }
  }
  const pendingMove = props.composer?.pendingMove;
  anchorAffordance.value = pendingMove === undefined
    ? adapter?.getAnchorAffordance()
    : adapter?.getAnchorAffordanceAt(pendingMove.side, pendingMove.line);
  void nextTick(renderAnnotation);
}, { deep: true });

watch(() => props.content, () => {
  observedAnchor = '';
  observedComposerAnchor = '';
  focusComposerAnchor = undefined;
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
