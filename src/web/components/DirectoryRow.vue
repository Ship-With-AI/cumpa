<script setup lang="ts">
import { computed } from 'vue';

import type { FileTreeDirectory } from '../../domain/file-tree.js';
import FileRow from './FileRow.vue';

defineOptions({ name: 'DirectoryRow' });

const props = defineProps<{
  directory: FileTreeDirectory;
  level: number;
  expandedDirectoryIds: readonly string[];
  focusedRowId: string | null;
  selectedFileId: string | null;
}>();

const emit = defineEmits<{
  activateFile: [fileId: string];
  focusRow: [rowId: string];
  toggleDirectory: [directoryId: string];
}>();

const rowId = computed(() => `directory:${props.directory.directoryId}`);
const expanded = computed(() =>
  props.expandedDirectoryIds.includes(props.directory.directoryId),
);
const displayPath = computed(() =>
  props.directory.segments.map((segment) => segment.display).join('/'),
);
</script>

<template>
  <li role="none">
    <div
      :id="rowId"
      class="tree-row directory-row"
      role="treeitem"
      :aria-level="level"
      :aria-expanded="expanded"
      aria-selected="false"
      :tabindex="focusedRowId === rowId ? 0 : -1"
      :data-row-id="rowId"
      :style="{ '--tree-indent': `${8 + (level - 1) * 16}px` }"
      @focus="emit('focusRow', rowId)"
      @click="emit('toggleDirectory', directory.directoryId)"
    >
      <span class="directory-row__disclosure" aria-hidden="true">
        {{ expanded ? '▾' : '▸' }}
      </span>
      <span class="directory-row__path">{{ displayPath }}</span>
    </div>

    <ul v-if="expanded" class="tree-group" role="group">
      <template v-for="child in directory.children" :key="child.kind === 'file' ? child.fileId : child.directoryId">
        <DirectoryRow
          v-if="child.kind === 'directory'"
          :directory="child"
          :level="level + 1"
          :expanded-directory-ids="expandedDirectoryIds"
          :focused-row-id="focusedRowId"
          :selected-file-id="selectedFileId"
          @activate-file="emit('activateFile', $event)"
          @focus-row="emit('focusRow', $event)"
          @toggle-directory="emit('toggleDirectory', $event)"
        />
        <FileRow
          v-else
          :key="child.fileId"
          :leaf="child"
          :level="level + 1"
          :focused="focusedRowId === `file:${child.fileId}`"
          :selected="selectedFileId === child.fileId"
          @activate="emit('activateFile', $event)"
          @focus-row="emit('focusRow', $event)"
        />
      </template>
    </ul>
  </li>
</template>
