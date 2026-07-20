<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
} from 'vue';

import type {
  FileMetadataResponse,
  SessionFile,
  SessionResponse,
} from '../contracts/api';
import {
  createSessionClient,
  FILE_UNAVAILABLE_MESSAGE,
  SECURITY_FAILURE_MESSAGE,
  SessionClientError,
} from './api/client';
import type { SessionClient } from './api/client';
import EmptyState from './components/EmptyState.vue';
import ErrorState from './components/ErrorState.vue';
import FileTree from './components/FileTree.vue';
import FileMetadataPane from './components/FileMetadataPane.vue';
import IdentityHeader from './components/IdentityHeader.vue';
import IdentityPanel from './components/IdentityPanel.vue';

const session = shallowRef<SessionResponse>();
const errorMessage = ref('');
const identityOpen = ref(false);
const identityHeader = ref<InstanceType<typeof IdentityHeader>>();
const selectedFile = shallowRef<SessionFile>();
const selectedMetadata = shallowRef<FileMetadataResponse>();
const detailErrorMessage = ref('');
const detailLoading = ref(false);
let detailRequestVersion = 0;
let sessionClient: SessionClient | undefined;

async function loadFileDetails(
  fileId: string,
  clearMetadata: boolean,
): Promise<void> {
  const file = session.value?.files.find((candidate) => candidate.fileId === fileId);
  if (file === undefined || sessionClient === undefined) {
    return;
  }

  selectedFile.value = file;
  if (clearMetadata) {
    selectedMetadata.value = undefined;
  }
  detailErrorMessage.value = '';
  detailLoading.value = true;
  const requestVersion = ++detailRequestVersion;

  try {
    const metadata = await sessionClient.getFileMetadata(fileId);
    if (requestVersion !== detailRequestVersion) {
      return;
    }
    if (metadata.fileId !== fileId) {
      throw new Error('File metadata capability mismatch');
    }
    selectedMetadata.value = metadata;
  } catch {
    if (requestVersion === detailRequestVersion) {
      detailErrorMessage.value = FILE_UNAVAILABLE_MESSAGE;
    }
  } finally {
    if (requestVersion === detailRequestVersion) {
      detailLoading.value = false;
    }
  }
}

function selectFile(fileId: string): void {
  void loadFileDetails(fileId, true);
}

function retryFileDetails(): void {
  if (selectedFile.value !== undefined) {
    void loadFileDetails(selectedFile.value.fileId, false);
  }
}

function toggleIdentities(): void {
  identityOpen.value = !identityOpen.value;
}

function handleEscape(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !identityOpen.value) {
    return;
  }
  identityOpen.value = false;
  void nextTick(() => identityHeader.value?.focusDisclosure());
}

onMounted(async () => {
  document.addEventListener('keydown', handleEscape);
  try {
    sessionClient = createSessionClient();
    session.value = await sessionClient.getSession();
  } catch (error) {
    errorMessage.value =
      error instanceof SessionClientError
        ? error.message
        : SECURITY_FAILURE_MESSAGE;
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape);
});
</script>

<template>
  <main
    v-if="session === undefined && errorMessage === ''"
    class="loading-shell"
  >
    <section class="state-card" aria-labelledby="loading-heading">
      <h1 id="loading-heading">Diff Review: loading pinned comparison</h1>
      <p role="status">Loading pinned comparison…</p>
    </section>
  </main>

  <main v-else-if="errorMessage !== ''" class="unavailable-shell">
    <h1>Diff Review: pinned session unavailable</h1>
    <ErrorState :message="errorMessage" />
  </main>

  <div v-else class="session-shell">
    <IdentityHeader
      ref="identityHeader"
      :session="session"
      :expanded="identityOpen"
      @toggle="toggleIdentities"
    />
    <IdentityPanel v-if="identityOpen" :session="session" />

    <div class="workspace-shell">
      <main v-if="session.files.length === 0" class="state-main">
        <EmptyState />
      </main>
      <FileTree
        v-else
        :files="session.files"
        @select="selectFile"
      />
      <FileMetadataPane
        v-if="selectedFile !== undefined"
        :file="selectedFile"
        :metadata="selectedMetadata"
        :loading="detailLoading"
        :error-message="detailErrorMessage"
        @retry="retryFileDetails"
      />
    </div>
  </div>
</template>

<style src="./styles.css"></style>
