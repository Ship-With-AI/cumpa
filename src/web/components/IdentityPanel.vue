<script setup lang="ts">
import { computed } from 'vue';

import type { SessionResponse } from '../../contracts/api';
import { controlSafeDisplay } from '../../domain/path-bytes';
import CopyButton from './CopyButton.vue';

const props = defineProps<{
  readonly session: SessionResponse;
}>();

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
</script>

<template>
  <section
    id="comparison-identities-panel"
    class="identity-panel"
    role="region"
    aria-labelledby="comparison-identities-heading"
  >
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
