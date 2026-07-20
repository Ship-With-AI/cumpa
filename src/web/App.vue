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
import ErrorState from './components/ErrorState.vue';
import FileTree from './components/FileTree.vue';
import FileMetadataPane from './components/FileMetadataPane.vue';
import IdentityHeader from './components/IdentityHeader.vue';
import IdentityPanel from './components/IdentityPanel.vue';

type ComparisonView = 'details' | 'files';

const session = shallowRef<SessionResponse>();
const errorMessage = ref('');
const identityOpen = ref(false);
const isNarrow = ref(false);
const activeView = ref<ComparisonView>('files');
const identityHeader = ref<InstanceType<typeof IdentityHeader>>();
const identityPanel = ref<InstanceType<typeof IdentityPanel>>();
const fileTree = ref<InstanceType<typeof FileTree>>();
const fileMetadataPane = ref<InstanceType<typeof FileMetadataPane>>();
const filesTab = ref<HTMLButtonElement>();
const detailsTab = ref<HTMLButtonElement>();
const emptyFilesHeading = ref<HTMLHeadingElement>();
const emptyDetailsHeading = ref<HTMLHeadingElement>();
const selectedFile = shallowRef<SessionFile>();
const selectedMetadata = shallowRef<FileMetadataResponse>();
const detailErrorMessage = ref('');
const detailLoading = ref(false);
let detailRequestVersion = 0;
let sessionClient: SessionClient | undefined;
let narrowMedia: MediaQueryList | undefined;
let filesScrollPosition = 0;
let detailsScrollPosition = 0;

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
    detailErrorMessage.value = '';
  }
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
    detailErrorMessage.value = '';
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

function captureViewScroll(view: ComparisonView): void {
  if (view === 'files') {
    filesScrollPosition =
      fileTree.value?.getScrollPosition() ?? filesScrollPosition;
  } else {
    detailsScrollPosition =
      fileMetadataPane.value?.getScrollPosition() ?? detailsScrollPosition;
  }
}

function restoreViewScroll(view: ComparisonView): void {
  if (view === 'files') {
    fileTree.value?.setScrollPosition(filesScrollPosition);
  } else {
    fileMetadataPane.value?.setScrollPosition(detailsScrollPosition);
  }
}

function captureAllScrollPositions(): void {
  captureViewScroll('files');
  captureViewScroll('details');
}

function restoreAllScrollPositions(): void {
  restoreViewScroll('files');
  restoreViewScroll('details');
}

function activateFile(): void {
  if (!isNarrow.value) {
    return;
  }
  captureViewScroll('files');
  activeView.value = 'details';
  void nextTick(() => {
    restoreViewScroll('details');
    fileMetadataPane.value?.focusHeading();
  });
}

function retryFileDetails(): void {
  if (selectedFile.value !== undefined) {
    void loadFileDetails(selectedFile.value.fileId, false);
  }
}

function focusViewHeading(view: ComparisonView): void {
  if (view === 'files') {
    if (session.value?.files.length === 0) {
      emptyFilesHeading.value?.focus();
    } else {
      fileTree.value?.focusHeading();
    }
    return;
  }
  if (session.value?.files.length === 0) {
    emptyDetailsHeading.value?.focus();
  } else {
    fileMetadataPane.value?.focusHeading();
  }
}

function activateTab(view: ComparisonView): void {
  captureViewScroll(activeView.value);
  activeView.value = view;
  void nextTick(() => {
    restoreViewScroll(view);
    focusViewHeading(view);
  });
}

function handleTabKeydown(event: KeyboardEvent, current: ComparisonView): void {
  const key = event.key;
  let nextView: ComparisonView | undefined;
  if (key === 'Home') {
    nextView = 'files';
  } else if (key === 'End') {
    nextView = 'details';
  } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
    nextView = current === 'files' ? 'details' : 'files';
  }
  if (nextView === undefined) {
    return;
  }
  event.preventDefault();
  captureViewScroll(current);
  activeView.value = nextView;
  void nextTick(() => {
    restoreViewScroll(nextView);
    (nextView === 'files' ? filesTab.value : detailsTab.value)?.focus();
  });
}

function backToFiles(): void {
  captureViewScroll('details');
  activeView.value = 'files';
  void nextTick(() => {
    restoreViewScroll('files');
    if (session.value?.files.length === 0) {
      emptyFilesHeading.value?.focus();
    } else {
      fileTree.value?.focusSelectedFile();
    }
  });
}

function closeIdentities(): void {
  identityOpen.value = false;
  void nextTick(() => identityHeader.value?.focusDisclosure());
}

function toggleIdentities(): void {
  if (identityOpen.value) {
    closeIdentities();
    return;
  }
  identityOpen.value = true;
  if (isNarrow.value) {
    void nextTick(() => identityPanel.value?.focusClose());
  }
}

function handleEscape(event: KeyboardEvent): void {
  if (event.key === 'Escape' && identityOpen.value) {
    closeIdentities();
  }
}

function handleViewportChange(event: MediaQueryListEvent): void {
  captureAllScrollPositions();
  isNarrow.value = event.matches;
  void nextTick(() => {
    restoreAllScrollPositions();
    if (!identityOpen.value) {
      return;
    }
    if (event.matches) {
      identityPanel.value?.focusClose();
    } else {
      identityHeader.value?.focusDisclosure();
    }
  });
}

onMounted(async () => {
  document.addEventListener('keydown', handleEscape);
  narrowMedia = window.matchMedia('(max-width: 767px)');
  isNarrow.value = narrowMedia.matches;
  narrowMedia.addEventListener('change', handleViewportChange);
  try {
    sessionClient = createSessionClient();
    session.value = await sessionClient.getSession();
    if (session.value.files.length === 0) {
      activeView.value = 'details';
    }
  } catch (error) {
    errorMessage.value =
      error instanceof SessionClientError
        ? error.message
        : SECURITY_FAILURE_MESSAGE;
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape);
  narrowMedia?.removeEventListener('change', handleViewportChange);
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
    <IdentityPanel
      v-if="identityOpen"
      ref="identityPanel"
      :session="session"
      :modal="isNarrow"
      @close="closeIdentities"
    />

    <div
      class="workspace-shell"
      :inert="identityOpen && isNarrow"
    >
      <div
        v-if="isNarrow"
        class="view-tabs"
        role="tablist"
        aria-label="Comparison view"
      >
        <button
          id="files-tab"
          ref="filesTab"
          type="button"
          class="view-tab"
          role="tab"
          aria-controls="files-panel"
          :aria-selected="activeView === 'files'"
          :tabindex="activeView === 'files' ? 0 : -1"
          @click="activateTab('files')"
          @keydown="handleTabKeydown($event, 'files')"
        >
          Files
        </button>
        <button
          id="details-tab"
          ref="detailsTab"
          type="button"
          class="view-tab"
          role="tab"
          aria-controls="details-panel"
          :aria-selected="activeView === 'details'"
          :tabindex="activeView === 'details' ? 0 : -1"
          @click="activateTab('details')"
          @keydown="handleTabKeydown($event, 'details')"
        >
          Details
        </button>
      </div>

      <div
        id="files-panel"
        class="view-panel view-panel--files"
        :role="isNarrow ? 'tabpanel' : undefined"
        :aria-labelledby="isNarrow ? 'files-tab' : undefined"
        :hidden="isNarrow && activeView !== 'files'"
      >
        <FileTree
          v-if="session.files.length > 0"
          ref="fileTree"
          :files="session.files"
          @select="selectFile"
          @activate="activateFile"
        />
        <nav
          v-else-if="isNarrow"
          class="empty-files-pane"
          aria-label="Changed files"
        >
          <h2 ref="emptyFilesHeading" tabindex="-1">Changed files</h2>
          <p>0 changed files</p>
        </nav>
      </div>

      <div
        id="details-panel"
        class="view-panel view-panel--details"
        :role="isNarrow ? 'tabpanel' : undefined"
        :aria-labelledby="isNarrow ? 'details-tab' : undefined"
        :hidden="isNarrow && activeView !== 'details'"
      >
        <button
          v-if="isNarrow"
          type="button"
          class="back-to-files-button"
          @click="backToFiles"
        >
          Back to files
        </button>
        <main v-if="session.files.length === 0" class="state-main">
          <section class="empty-state">
            <h2 ref="emptyDetailsHeading" tabindex="-1">
              No changes in this pinned comparison
            </h2>
            <p>
              The merge base and head resolve to identical trees. Open
              Comparison identities to review the pinned commits, then press
              Ctrl+C in the terminal when you are finished.
            </p>
            <p class="empty-count">0 changed files</p>
          </section>
        </main>
        <FileMetadataPane
          v-else-if="selectedFile !== undefined"
          ref="fileMetadataPane"
          :file="selectedFile"
          :metadata="selectedMetadata"
          :loading="detailLoading"
          :error-message="detailErrorMessage"
          @retry="retryFileDetails"
        />
      </div>
    </div>
  </div>
</template>

<style src="./styles.css"></style>
