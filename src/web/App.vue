<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue';

import FileTree from './components/FileTree.vue';
import type { SessionResponse } from '../contracts/api';
import {
  createSessionClient,
  SECURITY_FAILURE_MESSAGE,
  SessionClientError,
} from './api/client';
import type { SessionClient } from './api/client';

const session = shallowRef<SessionResponse>();
let sessionClient: SessionClient | undefined;
const errorMessage = ref('');
const loadedHeading = computed(() => {
  if (session.value === undefined) {
    return '';
  }
  return `Diff Review: ${session.value.base.label} · ${session.value.base.oid.slice(0, 7)} → ${session.value.head.label} · ${session.value.head.oid.slice(0, 7)}`;
});

function selectFile(fileId: string): void {
  if (sessionClient !== undefined) {
    void sessionClient.getFileMetadata(fileId).catch(() => undefined);
  }
}

onMounted(async () => {
  try {
    sessionClient = createSessionClient();
    session.value = await sessionClient.getSession();
  } catch (error) {
    errorMessage.value =
      error instanceof SessionClientError && error.kind === 'security'
        ? SECURITY_FAILURE_MESSAGE
        : error instanceof SessionClientError
          ? error.message
          : SECURITY_FAILURE_MESSAGE;
  }
});
</script>

<template>
  <main v-if="session === undefined && errorMessage === ''" class="loading-shell">
    <section class="state-card" aria-labelledby="loading-heading">
      <h1 id="loading-heading">Diff Review: loading pinned comparison</h1>
      <p role="status">Loading pinned comparison…</p>
    </section>
  </main>

  <main v-else-if="errorMessage !== ''" class="unavailable-shell">
    <section class="state-card" aria-labelledby="unavailable-heading">
      <h1>Diff Review: pinned session unavailable</h1>
      <h2 id="unavailable-heading">Pinned session unavailable</h2>
      <p role="alert">{{ errorMessage }}</p>
    </section>
  </main>

  <div v-else class="session-shell">
    <header class="session-header">
      <h1>{{ loadedHeading }}</h1>
      <p class="pin-cue">Pinned to displayed commits</p>
    </header>

    <div class="workspace-shell">
      <FileTree :files="session.files" @select="selectFile" />

      <main class="identity-main" aria-labelledby="identity-heading">
        <h2 id="identity-heading">Comparison identities</h2>
        <p class="identity-intro">
          This session is pinned to these commits and does not follow moving refs.
        </p>

        <dl class="identity-list">
          <div class="identity-row">
            <dt>Base</dt>
            <dd>
              <span class="source-label">{{ session.base.label }}</span>
              <code class="object-id">{{ session.base.oid }}</code>
            </dd>
          </div>
          <div class="identity-row">
            <dt>Head</dt>
            <dd>
              <span class="source-label">{{ session.head.label }}</span>
              <code class="object-id">{{ session.head.oid }}</code>
            </dd>
          </div>
          <div class="identity-row">
            <dt>Merge base</dt>
            <dd>
              <code class="object-id">{{ session.mergeBaseOid }}</code>
            </dd>
          </div>
        </dl>
      </main>
    </div>
  </div>
</template>

<style src="./styles.css"></style>
