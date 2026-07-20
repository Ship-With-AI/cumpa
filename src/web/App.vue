<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
} from 'vue';

import type { SessionResponse } from '../contracts/api';
import {
  createSessionClient,
  SECURITY_FAILURE_MESSAGE,
  SessionClientError,
} from './api/client';
import type { SessionClient } from './api/client';
import EmptyState from './components/EmptyState.vue';
import ErrorState from './components/ErrorState.vue';
import FileTree from './components/FileTree.vue';
import IdentityHeader from './components/IdentityHeader.vue';
import IdentityPanel from './components/IdentityPanel.vue';

const session = shallowRef<SessionResponse>();
const errorMessage = ref('');
const identityOpen = ref(false);
const identityHeader = ref<InstanceType<typeof IdentityHeader>>();
let sessionClient: SessionClient | undefined;

function selectFile(fileId: string): void {
  if (sessionClient !== undefined) {
    void sessionClient.getFileMetadata(fileId).catch(() => undefined);
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
    </div>
  </div>
</template>

<style src="./styles.css"></style>
