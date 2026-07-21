<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import type { FileContentResponse } from '../../contracts/api.js';
import {
  createMonacoDiffAdapter,
  type MonacoDiffAdapter,
} from '../monaco/diff-adapter.js';
import { configureMonacoWorkers, languageForPath } from '../monaco/configure.js';

const props = defineProps<{
  content: FileContentResponse;
  path: string;
}>();

const emit = defineEmits<{
  ready: [fileId: string];
}>();

const host = ref<HTMLElement>();
let adapter: MonacoDiffAdapter | undefined;
let resizeObserver: ResizeObserver | undefined;
let loadVersion = 0;

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

async function loadContent(): Promise<void> {
  if (adapter === undefined) {
    return;
  }
  const version = ++loadVersion;
  await adapter.setFile(immutableFile());
  if (version === loadVersion) {
    emit('ready', props.content.fileId);
  }
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

defineExpose({ layout, nextChange, previousChange });

onMounted(() => {
  if (host.value === undefined) {
    return;
  }
  configureMonacoWorkers();
  adapter = createMonacoDiffAdapter(host.value, languageForPath, () => undefined);
  resizeObserver = new ResizeObserver(() => adapter?.layout());
  resizeObserver.observe(host.value);
  void loadContent();
});

watch(() => props.content, () => {
  void loadContent();
});

onBeforeUnmount(() => {
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
    <div ref="host" class="diff-workspace__editor" />
    <p class="diff-workspace__context-help">
      Unchanged regions begin collapsed. Use Monaco’s context controls to reveal bounded context or all remaining context.
    </p>
  </section>
</template>
