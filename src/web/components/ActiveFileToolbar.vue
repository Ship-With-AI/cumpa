<script setup lang="ts">
import { computed, ref } from 'vue';

import type { SessionFile } from '../../contracts/api.js';
import PathDisplay from './PathDisplay.vue';

const props = defineProps<{
  readonly filesCollapsed: boolean;
  readonly filesDrawer: boolean;
  readonly selectedFile?: SessionFile;
  readonly selectedPath: string;
}>();

const emit = defineEmits<{
  toggleFiles: [];
}>();

const filesToggle = ref<HTMLButtonElement>();
const effectivePath = computed(() => {
  const file = props.selectedFile;
  if (file === undefined) return props.selectedPath;
  return file.status.kind === 'deleted'
    ? file.oldPath?.display ?? props.selectedPath
    : file.newPath?.display ?? file.oldPath?.display ?? props.selectedPath;
});
const counts = computed(() => props.selectedFile !== undefined
  && props.selectedFile.additions !== null
  && props.selectedFile.deletions !== null
  ? `+${props.selectedFile.additions} −${props.selectedFile.deletions}`
  : undefined);
const filesHostVisible = computed(() => !props.filesDrawer && !props.filesCollapsed);
const filesToggleCopy = computed(() => props.filesDrawer ? 'Files' : props.filesCollapsed ? 'Show files' : 'Hide files');
const filesToggleLabel = computed(() => props.filesDrawer
  ? 'Open changed files'
  : props.filesCollapsed ? 'Show changed files sidebar' : 'Hide changed files sidebar');

function focusFilesToggle(): void {
  filesToggle.value?.focus();
}

function focusHeading(): void {
  document.getElementById('cumpa-heading')?.focus();
}

defineExpose({ focusFilesToggle, focusHeading });
</script>

<template>
  <div class="review-toolbar__active-file">
    <h1 id="cumpa-heading" tabindex="-1" :title="effectivePath">
      <PathDisplay v-if="selectedFile !== undefined" :file="selectedFile" basename />
      <template v-else>{{ selectedPath }}</template>
    </h1>
    <span v-if="selectedFile !== undefined" class="review-toolbar__status">{{ selectedFile.status.kind }}</span>
    <span v-if="counts !== undefined" class="review-toolbar__counts">{{ counts }}</span>
    <button
      ref="filesToggle"
      type="button"
      class="ui-button"
      :aria-label="filesToggleLabel"
      :aria-controls="filesHostVisible ? 'changed-files' : undefined"
      :aria-expanded="filesHostVisible ? true : undefined"
      @click="emit('toggleFiles')"
    >{{ filesToggleCopy }}</button>
  </div>
</template>
