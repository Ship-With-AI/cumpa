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

const patchSession = computed(() => 'patch' in props.session ? props.session : undefined);
const pinnedSession = computed(() => 'base' in props.session ? props.session : undefined);
const isExactPatch = computed(() => patchSession.value !== undefined);
const baseLabel = computed(() => controlSafeDisplay(pinnedSession.value!.base.label));
const headLabel = computed(() => controlSafeDisplay(pinnedSession.value!.head.label));
const baseWorktreePath = computed(() =>
  pinnedSession.value!.base.worktree === undefined
    ? undefined
    : controlSafeDisplay(pinnedSession.value!.base.worktree.path),
);
const headWorktreePath = computed(() =>
  pinnedSession.value!.head.worktree === undefined
    ? undefined
    : controlSafeDisplay(pinnedSession.value!.head.worktree.path),
);
const isRange = computed(() => pinnedSession.value?.range?.kind === 'revisions');
const range = computed(() => pinnedSession.value?.range);
const panelId = computed(() =>
  isExactPatch.value ? 'patch-scope-panel' : isRange.value ? 'review-scope-panel' : 'comparison-identities-panel',
);
const headingId = computed(() =>
  isExactPatch.value ? 'patch-scope-heading' : isRange.value ? 'review-scope-heading' : 'comparison-identities-heading',
);
const patchTarget = computed(() =>
  patchSession.value?.patch.validationTarget.kind === 'repository' ? 'Repository content' : 'Worktree',
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
    :id="panelId"
    class="identity-panel"
    :class="{ 'identity-panel--modal': modal }"
    :role="modal ? 'dialog' : 'region'"
    :aria-modal="modal ? 'true' : undefined"
    :aria-labelledby="headingId"
    @keydown="containFocus"
  >
    <button
      v-if="modal"
      ref="closeButton"
      type="button"
      class="sheet-close-button"
      @click="emit('close')"
    >
      {{ isExactPatch ? 'Close patch scope' : isRange ? 'Close review scope' : 'Close comparison identities' }}
    </button>
    <h2 :id="headingId">{{ isExactPatch ? 'Patch scope' : isRange ? 'Review scope' : 'Comparison identities' }}</h2>
    <dl v-if="isExactPatch && patchSession !== undefined" class="identity-list">
      <div class="identity-row">
        <dt>Patch digest</dt>
        <dd>
          <div class="identity-value">
            <code class="object-id">{{ patchSession.patch.digest }}</code>
            <CopyButton label="Copy full patch digest" :value="patchSession.patch.digest" />
          </div>
        </dd>
      </div>
      <div class="identity-row">
        <dt>Changed files</dt>
        <dd>{{ patchSession.patch.changedFileCount }}</dd>
      </div>
      <div class="identity-row">
        <dt>Verified against</dt>
        <dd>{{ patchTarget }}</dd>
      </div>
    </dl>
    <dl v-else-if="isRange && range?.kind === 'revisions'" class="identity-list">
      <div class="identity-row">
        <dt>Base commit</dt>
        <dd>
          <div class="identity-value">
            <code class="object-id">{{ range.baseOid }}</code>
            <CopyButton label="Copy full base commit" :value="range.baseOid" />
          </div>
        </dd>
      </div>
      <div class="identity-row">
        <dt>Head commit</dt>
        <dd>
          <div class="identity-value">
            <code class="object-id">{{ range.headOid }}</code>
            <CopyButton label="Copy full head commit" :value="range.headOid" />
          </div>
        </dd>
      </div>
      <div class="identity-row">
        <dt>Ordered Git pathspecs</dt>
        <dd>
          <ol v-if="range.pathspecs.length > 0" class="pathspec-list">
            <li v-for="(pathspec, index) in range.pathspecs" :key="`${index}:${pathspec}`">
              <code>{{ controlSafeDisplay(pathspec) }}</code>
            </li>
          </ol>
          <p v-else class="pathspec-empty">All changed paths</p>
        </dd>
      </div>
    </dl>
    <dl v-else class="identity-list">
      <div class="identity-row">
        <dt>Base</dt>
        <dd>
          <span class="source-label">{{ baseLabel }}</span>
          <div class="identity-value">
            <code class="object-id">{{ session.base.oid }}</code>
            <CopyButton label="Copy full base commit" :value="session.base.oid" />
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
            <CopyButton label="Copy full head commit" :value="session.head.oid" />
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
      {{
        isExactPatch
          ? 'This review is frozen to the accepted patch. Every preimage is repository-grounded and every postimage matched implemented content at launch. Compare never refreshes reviewed bytes from the worktree.'
          : isRange && range?.kind === 'revisions'
            ? range.pathspecs.length === 0
              ? 'This review is pinned to these commits and all changed paths. Moving refs do not change its files or content.'
              : 'This review is pinned to these commits and ordered Git pathspecs. Moving refs do not change its files or content.'
            : 'This session is pinned to these commits and does not follow moving refs.'
      }}
    </p>
  </section>
</template>
