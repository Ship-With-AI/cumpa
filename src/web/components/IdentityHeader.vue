<script setup lang="ts">
import { computed, ref } from 'vue';

import type { SessionResponse } from '../../contracts/api';
import { controlSafeDisplay } from '../../domain/path-bytes';

const props = defineProps<{
  readonly attachedLifecycle?: 'waiting' | 'finishing' | 'completed';
  readonly expanded: boolean;
  readonly inert?: boolean;
  readonly session: SessionResponse;
}>();

const emit = defineEmits<{
  toggle: [];
}>();

const disclosure = ref<HTMLButtonElement>();
const isExactPatch = computed(() => 'patch' in props.session);
const patchSession = computed(() => 'patch' in props.session ? props.session : undefined);
const pinnedSession = computed(() => 'base' in props.session ? props.session : undefined);
const heading = computed(() =>
  isExactPatch.value
    ? `Compare: exact patch · ${patchSession.value!.patch.digest.slice(0, 12)}`
    : `Compare: ${controlSafeDisplay(pinnedSession.value!.base.label)} · ${pinnedSession.value!.base.oid.slice(0, 7)} → ${controlSafeDisplay(pinnedSession.value!.head.label)} · ${pinnedSession.value!.head.oid.slice(0, 7)}`,
);
const isRange = computed(() => pinnedSession.value?.range?.kind === 'revisions');
const panelId = computed(() =>
  isExactPatch.value ? 'patch-scope-panel' : isRange.value ? 'review-scope-panel' : 'comparison-identities-panel',
);
const dirtyEndpoints = computed(() =>
  isExactPatch.value
    ? []
    : [
        { role: 'Base', worktree: pinnedSession.value!.base.worktree },
        { role: 'Head', worktree: pinnedSession.value!.head.worktree },
      ].filter(
        (entry): entry is { role: string; worktree: { path: string; dirty: true } } =>
          entry.worktree?.dirty === true,
      ),
);

const attachedFact = computed(() => {
  switch (props.attachedLifecycle) {
    case 'finishing': return 'Agent attached · finishing review';
    case 'completed': return 'Agent review finished';
    case 'waiting': return 'Agent attached · waiting for Finish review';
    default: return '';
  }
});

function focusDisclosure(): void {
  disclosure.value?.focus();
}

defineExpose({ focusDisclosure });
</script>

<template>
  <header class="session-header">
    <h1>{{ heading }}</h1>
    <div class="header-facts">
      <span class="pin-cue">{{ isExactPatch ? 'Frozen verified patch' : 'Pinned to displayed commits' }}</span>
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
      <span v-if="attachedFact !== ''" class="attached-fact">{{ attachedFact }}</span>
      <button
        ref="disclosure"
        type="button"
        class="identity-disclosure"
        :aria-controls="panelId"
        :aria-expanded="expanded"
        @click="emit('toggle')"
      >
        {{ isExactPatch ? 'View patch scope' : isRange ? 'View review scope' : 'Comparison identities' }}
      </button>
    </div>
  </header>
</template>
