<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue';

import { PinnedComparisonSchema } from '../contracts/comparison';
import type { PinnedComparison } from '../contracts/comparison';

const session = shallowRef<PinnedComparison>();
const loadFailed = ref(false);
const loadedHeading = computed(() => {
  if (session.value === undefined) {
    return '';
  }
  return `Diff Review: ${session.value.base.label} · ${session.value.base.oid.slice(0, 7)} → ${session.value.head.label} · ${session.value.head.oid.slice(0, 7)}`;
});

onMounted(async () => {
  try {
    const response = await fetch('/api/session');
    if (!response.ok) {
      throw new Error(`Session request failed with status ${response.status}`);
    }
    session.value = PinnedComparisonSchema.parse(await response.json());
  } catch {
    loadFailed.value = true;
  }
});
</script>

<template>
  <main v-if="session === undefined && !loadFailed" class="loading-shell">
    <section class="state-card" aria-labelledby="loading-heading">
      <h1 id="loading-heading">Diff Review: loading pinned comparison</h1>
      <p role="status">Loading pinned comparison…</p>
    </section>
  </main>

  <main v-else-if="loadFailed" class="unavailable-shell">
    <section class="state-card" aria-labelledby="unavailable-heading">
      <h1>Diff Review: pinned session unavailable</h1>
      <h2 id="unavailable-heading">Pinned session unavailable</h2>
      <p role="alert">
        This pinned session is unavailable. Return to the terminal and launch
        Diff Review again. Diagnostic details are shown in the terminal.
      </p>
    </section>
  </main>

  <div v-else class="session-shell">
    <header class="session-header">
      <h1>{{ loadedHeading }}</h1>
      <p class="pin-cue">Pinned to displayed commits</p>
    </header>

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
</template>

<style src="./styles.css"></style>
