<script setup lang="ts">
import { computed, ref } from 'vue';

import type { SessionFile, SessionResponse } from '../../contracts/api.js';
import { controlSafeDisplay } from '../../domain/path-bytes.js';
import PathDisplay from './PathDisplay.vue';

const props = defineProps<{
  readonly filesCollapsed: boolean;
  readonly filesDrawer: boolean;
  readonly filesOpen: boolean;
  readonly selectedFile?: SessionFile;
  readonly selectedPath: string;
  readonly session: SessionResponse;
}>();

const emit = defineEmits<{
  toggleFiles: [];
}>();

const filesToggle = ref<HTMLButtonElement>();
const isExactPatch = computed(() => 'patch' in props.session);
const pinnedSession = computed(() => 'base' in props.session ? props.session : undefined);
const effectivePath = computed(() => {
  const file = props.selectedFile;
  if (file === undefined) return props.selectedPath;
  return file.status.kind === 'deleted'
    ? file.oldPath?.display ?? props.selectedPath
    : file.newPath?.display ?? file.oldPath?.display ?? props.selectedPath;
});
const directoryPath = computed(() => effectivePath.value.slice(0, effectivePath.value.lastIndexOf('/') + 1));
const baseShortOid = computed(() => controlSafeDisplay(pinnedSession.value?.base.oid.slice(0, 7) ?? ''));
const headShortOid = computed(() => controlSafeDisplay(pinnedSession.value?.head.oid.slice(0, 7) ?? ''));

function focusFilesToggle(): void {
  filesToggle.value?.focus();
}

defineExpose({ focusFilesToggle });
</script>

<template>
  <header class="active-file-toolbar">
    <div class="active-file-toolbar__context">
      <div class="active-file-toolbar__file">
        <div class="active-file-toolbar__title">
          <h1 id="cumpa-heading">
            <PathDisplay v-if="selectedFile !== undefined" :file="selectedFile" basename />
            <template v-else>{{ selectedPath }}</template>
          </h1>
          <p v-if="directoryPath !== ''" class="active-file-toolbar__directory" :title="directoryPath">{{ directoryPath }}</p>
        </div>
        <div v-if="selectedFile !== undefined" class="active-file-toolbar__metadata">
          <span class="active-file-toolbar__status">{{ selectedFile.status.kind }}</span>
          <span v-if="selectedFile.additions !== null && selectedFile.deletions !== null" class="active-file-toolbar__counts">
            +{{ selectedFile.additions }} −{{ selectedFile.deletions }}
          </span>
        </div>
        <button
          ref="filesToggle"
          type="button"
          class="ui-button"
          aria-controls="changed-files"
          :aria-expanded="filesDrawer ? filesOpen : !filesCollapsed"
          @click="emit('toggleFiles')"
        >Files</button>
      </div>
      <template v-if="isExactPatch">
        <div class="active-file-toolbar__endpoint active-file-toolbar__endpoint--base">
          <span class="active-file-toolbar__endpoint-label">Preimage</span>
          <span class="active-file-toolbar__endpoint-name">Repository object</span>
        </div>
        <div class="active-file-toolbar__endpoint active-file-toolbar__endpoint--head">
          <span class="active-file-toolbar__endpoint-label">Postimage</span>
          <span class="active-file-toolbar__endpoint-name">Implemented content</span>
        </div>
      </template>
      <template v-else-if="pinnedSession !== undefined">
        <div class="active-file-toolbar__endpoint active-file-toolbar__endpoint--base">
          <span class="active-file-toolbar__endpoint-label">Base</span>
          <span class="active-file-toolbar__endpoint-name" :title="pinnedSession.base.label">{{ controlSafeDisplay(pinnedSession.base.label) }}</span>
          <span class="active-file-toolbar__endpoint-oid" :title="pinnedSession.base.oid">{{ baseShortOid }}</span>
        </div>
        <div class="active-file-toolbar__endpoint active-file-toolbar__endpoint--head">
          <span class="active-file-toolbar__endpoint-label">Head</span>
          <span class="active-file-toolbar__endpoint-name" :title="pinnedSession.head.label">{{ controlSafeDisplay(pinnedSession.head.label) }}</span>
          <span class="active-file-toolbar__endpoint-oid" :title="pinnedSession.head.oid">{{ headShortOid }}</span>
        </div>
      </template>
    </div>
  </header>
</template>
