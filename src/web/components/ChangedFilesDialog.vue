<script setup lang="ts">
import type { SessionFile } from '../../contracts/api.js';
import FileTree from './FileTree.vue';
import ModalDialog from './ui/ModalDialog.vue';

const props = defineProps<{
  readonly files: readonly SessionFile[];
  readonly initialSelectedFileId?: string;
  readonly narrow: boolean;
  readonly open: boolean;
}>();

const emit = defineEmits<{
  activate: [fileId: string];
  close: [];
  select: [fileId: string];
}>();
</script>

<template>
  <ModalDialog
    :open="open"
    :keep-mounted="true"
    initial-focus-selector="#file-tree-filter"
    title="Changed files"
    close-label="Close"
    close-aria-label="Close changed files"
    @close="emit('close')"
  >
    <div id="changed-files-dialog-tree" class="changed-files-dialog__results"></div>
  </ModalDialog>
  <Teleport v-if="narrow || files.length > 0" defer :to="narrow ? '#changed-files-dialog-tree' : '#changed-files'">
    <FileTree
      v-if="files.length > 0"
      :files="files"
      :initial-selected-file-id="initialSelectedFileId"
      @select="emit('select', $event)"
      @activate="emit('activate', $event)"
    />
    <p v-else>0 changed files</p>
  </Teleport>
</template>

<style scoped>
.changed-files-dialog__results {
  max-height: 50dvh;
  overflow: auto;
}
</style>
