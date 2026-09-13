<script setup lang="ts">
import { computed } from 'vue';

import type { SessionResponse } from '../../contracts/api';
import { controlSafeDisplay } from '../../domain/path-bytes';
import CopyButton from './CopyButton.vue';

const props = defineProps<{
  readonly session: SessionResponse;
}>();

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
const patchTarget = computed(() =>
  patchSession.value?.patch.validationTarget.kind === 'repository' ? 'Repository content' : 'Worktree',
);
</script>

<template>
  <section class="identity-panel" aria-labelledby="comparison-heading">
    <h3 id="comparison-heading">Comparison</h3>
    <dl v-if="isExactPatch && patchSession !== undefined" class="identity-list">
      <div class="identity-row">
        <dt>PREIMAGE</dt>
        <dd>Repository object</dd>
      </div>
      <div class="identity-row">
        <dt>POSTIMAGE</dt>
        <dd>Implemented content</dd>
      </div>
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
        <dt>Review key</dt>
        <dd><code class="object-id">{{ patchSession.patch.reviewKey }}</code></dd>
      </div>
      <div class="identity-row">
        <dt>Changed files</dt>
        <dd>{{ patchSession.patch.changedFileCount }}</dd>
      </div>
      <div class="identity-row">
        <dt>Validation target</dt>
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
    </dl>
    <dl v-else class="identity-list">
      <div class="identity-row">
        <dt>Base</dt>
        <dd>
          <span class="source-label">{{ baseLabel }}</span>
          <span class="identity-meta-label">Selector type: {{ session.base.worktree === undefined ? 'Branch' : 'Worktree' }}</span>
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
          <span class="identity-meta-label">Selector type: {{ session.head.worktree === undefined ? 'Branch' : 'Worktree' }}</span>
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
    <section class="identity-provenance" aria-labelledby="provenance-heading">
      <h3 id="provenance-heading">Scope and provenance</h3>
      <dl v-if="isRange && range?.kind === 'revisions'" class="identity-list">
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
      <p class="identity-statement">
        {{
          isExactPatch
            ? 'This frozen snapshot retains repository-grounded preimages and implemented postimages from launch. Cumpa never refreshes reviewed bytes from the worktree.'
            : isRange && range?.kind === 'revisions'
              ? range.pathspecs.length === 0
                ? 'This review is pinned to these commits and all changed paths. Moving refs do not change its files or content.'
                : 'This review is pinned to these commits and ordered Git pathspecs. Moving refs do not change its files or content.'
              : 'This session is pinned to these commits and does not follow moving refs.'
        }}
      </p>
    </section>
  </section>
</template>
