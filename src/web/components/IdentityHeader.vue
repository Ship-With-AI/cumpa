<script setup lang="ts">
import { computed, ref } from 'vue';

import type { SessionResponse } from '../../contracts/api';
import { controlSafeDisplay } from '../../domain/path-bytes';

const props = defineProps<{
  readonly expanded: boolean;
  readonly session: SessionResponse;
}>();

const emit = defineEmits<{
  toggle: [];
}>();

const disclosure = ref<HTMLButtonElement>();
const heading = computed(
  () =>
    `Diff Review: ${controlSafeDisplay(props.session.base.label)} · ${props.session.base.oid.slice(0, 7)} → ${controlSafeDisplay(props.session.head.label)} · ${props.session.head.oid.slice(0, 7)}`,
);
const dirtyEndpoints = computed(() =>
  [
    { role: 'Base', worktree: props.session.base.worktree },
    { role: 'Head', worktree: props.session.head.worktree },
  ].filter(
    (entry): entry is { role: string; worktree: { path: string; dirty: true } } =>
      entry.worktree?.dirty === true,
  ),
);

function focusDisclosure(): void {
  disclosure.value?.focus();
}

defineExpose({ focusDisclosure });
</script>

<template>
  <header class="session-header">
    <h1>{{ heading }}</h1>
    <div class="header-facts">
      <span class="pin-cue">Pinned to displayed commits</span>
      <span
        v-for="endpoint in dirtyEndpoints"
        :key="endpoint.role"
        class="dirty-badge"
      >
        <span>Dirty bytes ignored</span>
        <span class="visually-hidden">
          Committed HEAD reviewed; staged, unstaged, and untracked bytes ignored.
        </span>
      </span>
      <button
        ref="disclosure"
        type="button"
        class="identity-disclosure"
        aria-controls="comparison-identities-panel"
        :aria-expanded="expanded"
        @click="emit('toggle')"
      >
        Comparison identities
      </button>
    </div>
  </header>
</template>
