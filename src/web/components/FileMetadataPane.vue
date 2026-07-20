<script setup lang="ts">
import { computed } from 'vue';

import type {
  FileMetadataResponse,
  SessionFile,
} from '../../contracts/api.js';
import type {
  ExactPathDto,
  UnsupportedAvailabilityReason,
} from '../../contracts/comparison.js';
import CopyButton from './CopyButton.vue';
import InlineNotice from './InlineNotice.vue';

const props = defineProps<{
  readonly file: SessionFile;
  readonly metadata?: FileMetadataResponse;
  readonly loading: boolean;
  readonly errorMessage: string;
}>();

const emit = defineEmits<{
  retry: [];
}>();

interface PathEntry {
  readonly copyLabel: string;
  readonly copyValue: string;
  readonly label: string;
  readonly value: string;
}

const UNSUPPORTED_EXPLANATION: Record<
  UnsupportedAvailabilityReason,
  string
> = {
  binary:
    'Git classifies this file as binary. Its metadata remains inspectable, but inline content is unavailable. No in-browser recovery is available in this version.',
  'non-utf8':
    'This file is not valid UTF-8 text. Its metadata remains inspectable, but inline content is unavailable. No in-browser recovery is available in this version.',
  oversized:
    'This file exceeds the inline-content size limit. Its metadata remains inspectable, but inline content is unavailable. No in-browser recovery is available in this version.',
  submodule:
    'This entry records a submodule commit, not a regular text file. Its metadata remains inspectable, but inline content is unavailable. Open the submodule with Git outside this session if you need to inspect it.',
  symlink:
    'This entry records a symbolic link, not a regular text file. Its metadata remains inspectable, but inline content is unavailable. Inspect the committed link target with Git outside this session if needed.',
  'mode-or-type':
    "This entry's Git mode or object type is not supported as a regular text file. Its metadata remains inspectable, but inline content is unavailable. No in-browser recovery is available in this version.",
};

const MISSING_OBJECT_EXPLANATION =
  "The required object for this pinned file is missing or unreadable. Metadata already loaded remains inspectable, but inline content is unavailable. Diff Review will not fall back to a moving ref or worktree file. Repair the repository's object data with Git, then relaunch this comparison.";

const selectedRecord = computed(() => props.metadata ?? props.file);
const isMove = computed(
  () =>
    selectedRecord.value.status.kind === 'renamed' ||
    selectedRecord.value.status.kind === 'copied',
);
const effectivePath = computed(() => {
  if (selectedRecord.value.status.kind === 'deleted') {
    return selectedRecord.value.oldPath;
  }
  return selectedRecord.value.newPath ?? selectedRecord.value.oldPath;
});
const statusLabel = computed(() => {
  const { kind, similarity } = selectedRecord.value.status;
  const labelByKind: Record<typeof kind, string> = {
    added: 'Added',
    copied: 'Copied',
    deleted: 'Deleted',
    modified: 'Modified',
    renamed: 'Renamed',
    'type-changed': 'Mode changed',
    unsupported: 'Unsupported',
  };
  const label = labelByKind[kind];
  if ((kind === 'renamed' || kind === 'copied') && similarity !== undefined) {
    return `${label} (${similarity}% similarity)`;
  }
  return label;
});
const availabilityLabel = computed(() => {
  switch (selectedRecord.value.availability.kind) {
    case 'text':
      return 'Text';
    case 'unsupported':
      return 'Unsupported';
    case 'unavailable':
      return 'Unavailable';
  }
});
const machineReason = computed(() => {
  const availability = selectedRecord.value.availability;
  return availability.kind === 'text'
    ? undefined
    : `${availability.kind}: ${availability.reason}`;
});
const availabilityExplanation = computed(() => {
  const availability = selectedRecord.value.availability;
  switch (availability.kind) {
    case 'text':
      return 'Text file — content preview is not available in this version.';
    case 'unsupported':
      return UNSUPPORTED_EXPLANATION[availability.reason];
    case 'unavailable':
      return MISSING_OBJECT_EXPLANATION;
  }
});

function createPathEntry(
  path: ExactPathDto,
  role: 'path' | 'old path' | 'new path',
): PathEntry {
  if (path.utf8 === undefined) {
    return {
      label: `Exact ${role} bytes (base64url)`,
      value: path.bytesBase64url,
      copyLabel: `Copy exact ${role} bytes`,
      copyValue: path.bytesBase64url,
    };
  }
  return {
    label: role[0]!.toUpperCase() + role.slice(1),
    value: path.display,
    copyLabel: `Copy exact ${role}`,
    copyValue: path.utf8,
  };
}

const pathEntries = computed<readonly PathEntry[]>(() => {
  const record = selectedRecord.value;
  if (
    isMove.value &&
    record.oldPath !== undefined &&
    record.newPath !== undefined
  ) {
    return [
      createPathEntry(record.oldPath, 'old path'),
      createPathEntry(record.newPath, 'new path'),
    ];
  }
  const path = effectivePath.value;
  return path === undefined ? [] : [createPathEntry(path, 'path')];
});
</script>

<template>
  <main class="file-metadata-pane" aria-label="File details">
    <h2>File details — {{ effectivePath?.display }}</h2>

    <InlineNotice v-if="errorMessage !== ''" tone="error">
      <p role="alert">{{ errorMessage }}</p>
      <button
        type="button"
        class="retry-button"
        :disabled="loading"
        @click="emit('retry')"
      >
        Retry file details
      </button>
    </InlineNotice>

    <div class="file-facts" aria-label="Selected file summary">
      <span class="metadata-label">Status</span>
      <span>{{ statusLabel }}</span>
      <span class="metadata-label">Availability</span>
      <span>{{ availabilityLabel }}</span>
    </div>

    <section class="metadata-section" aria-labelledby="paths-heading">
      <h3 id="paths-heading">Paths</h3>
      <div
        v-for="entry in pathEntries"
        :key="entry.copyLabel"
        class="metadata-value-row"
      >
        <div class="metadata-value-group">
          <span class="metadata-label">{{ entry.label }}</span>
          <code class="metadata-value">{{ entry.value }}</code>
        </div>
        <CopyButton
          :label="entry.copyLabel"
          :value="entry.copyValue"
          failure-message="Could not copy. Select the value and copy it manually."
        />
      </div>
    </section>

    <section class="metadata-section" aria-labelledby="changes-heading">
      <h3 id="changes-heading">Changes</h3>
      <dl
        v-if="selectedRecord.additions !== null && selectedRecord.deletions !== null"
        class="metadata-list"
      >
        <div>
          <dt>Additions</dt>
          <dd>{{ selectedRecord.additions }}</dd>
        </div>
        <div>
          <dt>Deletions</dt>
          <dd>{{ selectedRecord.deletions }}</dd>
        </div>
      </dl>
      <p v-else class="metadata-unavailable">Line counts unavailable</p>
    </section>

    <section class="metadata-section" aria-labelledby="modes-heading">
      <h3 id="modes-heading">Modes</h3>
      <dl v-if="metadata !== undefined" class="metadata-list">
        <div>
          <dt>Old mode</dt>
          <dd><code>{{ metadata.oldMode }}</code></dd>
        </div>
        <div>
          <dt>New mode</dt>
          <dd><code>{{ metadata.newMode }}</code></dd>
        </div>
      </dl>
      <p v-else-if="loading" class="metadata-unavailable" role="status">
        Loading file details…
      </p>
      <p v-else class="metadata-unavailable">Mode details require a successful retry.</p>
    </section>

    <section class="metadata-section" aria-labelledby="availability-heading">
      <h3 id="availability-heading">Availability</h3>
      <InlineNotice
        :tone="selectedRecord.availability.kind === 'text' ? 'neutral' : selectedRecord.availability.kind === 'unavailable' ? 'error' : 'warning'"
      >
        <h4 v-if="selectedRecord.availability.kind !== 'text'">
          File cannot be shown inline
        </h4>
        <p v-if="machineReason !== undefined" class="machine-reason">
          {{ machineReason }}
        </p>
        <p>{{ availabilityExplanation }}</p>
      </InlineNotice>
    </section>
  </main>
</template>
