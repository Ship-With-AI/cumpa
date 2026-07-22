<script setup lang="ts">
import { nextTick, onMounted, ref, shallowRef, watch } from 'vue';

import type { SessionFile } from '../../contracts/api.js';
import {
  createFileTreeModel,
  type FileTreeNavigationKey,
  type FileTreeModel,
} from '../model/file-tree.js';
import DirectoryRow from './DirectoryRow.vue';
import FileRow from './FileRow.vue';

const props = defineProps<{
  files: readonly SessionFile[];
  initialSelectedFileId?: string;
}>();

const emit = defineEmits<{
  activate: [fileId: string];
  select: [fileId: string];
}>();

const headingElement = ref<HTMLHeadingElement>();
const paneElement = ref<HTMLElement>();
const treeElement = ref<HTMLElement>();
const model = shallowRef<FileTreeModel>(createFileTreeModel(props.files));

function focusModelRow(): void {
  const focusedRowId = model.value.focusedRowId;
  if (focusedRowId === null) {
    return;
  }
  void nextTick(() => {
    const row = Array.from(
      treeElement.value?.querySelectorAll<HTMLElement>('[role="treeitem"]') ?? [],
    ).find((candidate) => candidate.dataset.rowId === focusedRowId);
    row?.focus();
  });
}

function applyModel(nextModel: FileTreeModel): void {
  const previousSelection = model.value.selectedFileId;
  model.value = nextModel;
  if (
    nextModel.selectedFileId !== null &&
    nextModel.selectedFileId !== previousSelection
  ) {
    emit('select', nextModel.selectedFileId);
  }
  focusModelRow();
}

function focusRow(rowId: string): void {
  applyModel(model.value.focusRow(rowId));
}

function activateFile(fileId: string): void {
  const row = model.value.visibleRows.find(
    (candidate) => candidate.kind === 'file' && candidate.fileId === fileId,
  );
  if (row !== undefined) {
    applyModel(model.value.focusRow(row.rowId));
    emit('activate', fileId);
  }
}

function toggleDirectory(directoryId: string): void {
  applyModel(model.value.toggleDirectory(directoryId));
}

function handleKeydown(event: KeyboardEvent): void {
  const supportedKeys: readonly FileTreeNavigationKey[] = [
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
    'Enter',
    ' ',
  ];
  if (!supportedKeys.includes(event.key as FileTreeNavigationKey)) {
    return;
  }

  event.preventDefault();
  const activatedRow =
    event.key === 'Enter' || event.key === ' '
      ? model.value.visibleRows.find(
          (candidate) => candidate.rowId === model.value.focusedRowId,
        )
      : undefined;
  applyModel(model.value.handleKey(event.key as FileTreeNavigationKey));
  if (activatedRow?.kind === 'file') {
    emit('activate', activatedRow.fileId);
  }
}


function focusHeading(): void {
  headingElement.value?.focus({ preventScroll: true });
}

function focusSelectedFile(): void {
  const selectedFileId = model.value.selectedFileId;
  if (selectedFileId === null) {
    focusHeading();
    return;
  }
  treeElement.value
    ?.querySelector<HTMLElement>(`[data-file-id="${selectedFileId}"]`)
    ?.focus({ preventScroll: true });
}

function getScrollPosition(): number {
  return paneElement.value?.scrollTop ?? 0;
}

function setScrollPosition(position: number): void {
  if (paneElement.value !== undefined) {
    paneElement.value.scrollTop = position;
  }
}

defineExpose({
  focusHeading,
  focusSelectedFile,
  getScrollPosition,
  setScrollPosition,
});

onMounted(() => {
  if (props.initialSelectedFileId === undefined && model.value.selectedFileId !== null) {
    emit('select', model.value.selectedFileId);
  }
});


watch(
  () => props.files,
  (files) => {
    model.value = createFileTreeModel(files);
    if (model.value.selectedFileId !== null) {
      emit('select', model.value.selectedFileId);
    }
  },
);
</script>

<template>
  <nav ref="paneElement" class="file-tree-pane" aria-label="Changed files">
    <h2 id="changed-files-heading" ref="headingElement" tabindex="-1">
      Changed files ({{ files.length }})
    </h2>
    <ul
      ref="treeElement"
      class="file-tree"
      role="tree"
      aria-label="Changed files"
      aria-labelledby="changed-files-heading"
      @keydown="handleKeydown"
    >
      <template
        v-for="node in model.tree"
        :key="node.kind === 'file' ? node.fileId : node.directoryId"
      >
        <DirectoryRow
          v-if="node.kind === 'directory'"
          :directory="node"
          :level="1"
          :expanded-directory-ids="model.expandedDirectoryIds"
          :focused-row-id="model.focusedRowId"
          :selected-file-id="model.selectedFileId"
          @activate-file="activateFile"
          @focus-row="focusRow"
          @toggle-directory="toggleDirectory"
        />
        <FileRow
          v-else
          :leaf="node"
          :level="1"
          :focused="model.focusedRowId === `file:${node.fileId}`"
          :selected="model.selectedFileId === node.fileId"
          @activate="activateFile"
          @focus-row="focusRow"
        />
      </template>
    </ul>
  </nav>
</template>
