<script setup lang="ts">
import { ref } from 'vue';

import type { FileMetadataResponse, SessionFile, SessionResponse } from '../../contracts/api';
import FileMetadataPane from './FileMetadataPane.vue';
import IdentityPanel from './IdentityPanel.vue';
import KeyboardHelp from './KeyboardHelp.vue';
import ModalDialog from './ui/ModalDialog.vue';

const props = defineProps<{
  readonly file?: SessionFile;
  readonly metadata?: FileMetadataResponse;
  readonly metadataError: string;
  readonly metadataLoading: boolean;
  readonly open: boolean;
  readonly session: SessionResponse;
}>();

const emit = defineEmits<{
  close: [];
  retryMetadata: [];
}>();

const keyboardHelp = ref<InstanceType<typeof KeyboardHelp>>();

function focusKeyboardHelp(): void {
  keyboardHelp.value?.focusHeading();
}

defineExpose({ focusKeyboardHelp });
</script>

<template>
  <ModalDialog
    :open="open"
    title="Details"
    close-aria-label="Close details"
    @close="emit('close')"
  >
    <IdentityPanel :session="session" />
    <FileMetadataPane
      v-if="file !== undefined"
      :file="file"
      :metadata="metadata"
      :loading="metadataLoading"
      :error-message="metadataError"
      @retry="emit('retryMetadata')"
    />
    <section v-else class="details-dialog__empty-file" aria-labelledby="selected-file-heading">
      <h3 id="selected-file-heading">Selected file</h3>
      <p>No changed file is selected.</p>
    </section>
    <KeyboardHelp ref="keyboardHelp" />
  </ModalDialog>
</template>
