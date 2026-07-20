<script setup lang="ts">
import { computed, ref } from 'vue';

import type { SessionResponse } from '../../contracts/api';
import { controlSafeDisplay } from '../../domain/path-bytes';
import CopyButton from './CopyButton.vue';

const props = defineProps<{
  readonly modal: boolean;
  readonly session: SessionResponse;
}>();

const emit = defineEmits<{
  close: [];
}>();

const closeButton = ref<HTMLButtonElement>();

const baseLabel = computed(() => controlSafeDisplay(props.session.base.label));
const headLabel = computed(() => controlSafeDisplay(props.session.head.label));
const baseWorktreePath = computed(() =>
  props.session.base.worktree === undefined
    ? undefined
    : controlSafeDisplay(props.session.base.worktree.path),
);
const headWorktreePath = computed(() =>
  props.session.head.worktree === undefined
    ? undefined
    : controlSafeDisplay(props.session.head.worktree.path),
);

function focusClose(): void {
  closeButton.value?.focus();
}

function containFocus(event: KeyboardEvent): void {
  if (!props.modal || event.key !== 'Tab') {
    return;
  }
  const panel = event.currentTarget as HTMLElement;
  const controls = Array.from(
    panel.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
  );
  if (controls.length === 0) {
    return;
  }
  const first = controls[0]!;
  const last = controls.at(-1)!;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

defineExpose({ focusClose });
</script>

<template>
  <section
    id="comparison-identities-panel"
    class="identity-panel"
    :class="{ 'identity-panel--modal': modal }"
    :role="modal ? 'dialog' : 'region'"
    :aria-modal="modal ? 'true' : undefined"
    aria-labelledby="comparison-identities-heading"
    @keydown="containFocus"
  >
    <button
      v-if="modal"
      ref="closeButton"
      type="button"
      class="sheet-close-button"
      @click="emit('close')"
    >
      Close comparison identities
    </button>
    <h2 id="comparison-identities-heading">Comparison identities</h2>
    <dl class="identity-list">
      <div class="identity-row">
        <dt>Base</dt>
        <dd>
          <span class="source-label">{{ baseLabel }}</span>
          <div class="identity-value">
            <code class="object-id">{{ session.base.oid }}</code>
            <CopyButton
              label="Copy full base commit"
              :value="session.base.oid"
            />
          </div>
          <template v-if="session.base.worktree !== undefined">
            <span class="identity-meta-label">Worktree path</span>
            <code class="worktree-path">{{ baseWorktreePath }}</code>
            <p v-if="session.base.worktree.dirty" class="dirty-explanation">
              The worktree's committed HEAD will be reviewed. Staged, unstaged,
              and untracked bytes are ignored.
            </p>
          </template>
        </dd>
      </div>
      <div class="identity-row">
        <dt>Head</dt>
        <dd>
          <span class="source-label">{{ headLabel }}</span>
          <div class="identity-value">
            <code class="object-id">{{ session.head.oid }}</code>
            <CopyButton
              label="Copy full head commit"
              :value="session.head.oid"
            />
          </div>
          <template v-if="session.head.worktree !== undefined">
            <span class="identity-meta-label">Worktree path</span>
            <code class="worktree-path">{{ headWorktreePath }}</code>
            <p v-if="session.head.worktree.dirty" class="dirty-explanation">
              The worktree's committed HEAD will be reviewed. Staged, unstaged,
              and untracked bytes are ignored.
            </p>
          </template>
        </dd>
      </div>
      <div class="identity-row">
        <dt>Merge base</dt>
        <dd>
          <div class="identity-value">
            <code class="object-id">{{ session.mergeBaseOid }}</code>
            <CopyButton
              label="Copy full merge-base commit"
              :value="session.mergeBaseOid"
            />
          </div>
        </dd>
      </div>
    </dl>
    <p class="identity-statement">
      This session is pinned to these commits and does not follow moving refs.
    </p>
  </section>
</template>
