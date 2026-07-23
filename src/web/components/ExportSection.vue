<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';

import type { ReviewExportState } from '../model/review-draft-state.js';
import type { WorkspaceComment } from '../model/workspace-state.js';
import ExportReadinessSummary from './ExportReadinessSummary.vue';
import DriftExportAcknowledgement from './DriftExportAcknowledgement.vue';
import ExportProgress from './ExportProgress.vue';

const props = defineProps<{
  revision: number;
  summary: string;
  summaryBuffer: string;
  comments: readonly WorkspaceComment[];
  pinnedBase: Readonly<{ label: string; oid: string }>;
  pinnedHead: Readonly<{ label: string; oid: string }>;
  commentBuffers: ReadonlyMap<string, string>;
  exportState: ReviewExportState;
}>();

const emit = defineEmits<{
  export: [];
  cancel: [];
  reloadLatest: [];
  reviewUnsavedText: [];
}>();
const conflictHeading = ref<HTMLElement>();
const failureHeading = ref<HTMLElement>();

const open = ref(true);
const heading = ref<HTMLElement>();
const hasUnsavedText = computed(() => props.summary !== props.summaryBuffer || props.comments.some((comment) => props.commentBuffers.get(comment.id) !== undefined && props.commentBuffers.get(comment.id) !== comment.body));
const stateLabel = computed(() => {
  switch (props.exportState.phase) {
    case 'drift': return 'Needs acknowledgement';
    case 'pending': return 'Exporting';
    case 'exported': return 'Exported';
    case 'failed': return 'Failed';
    case 'unavailable': return 'Unavailable';
    default: return 'Ready';
  }
});

watch(() => props.exportState.phase, (phase) => {
  if (phase === 'drift' || phase === 'conflict' || phase === 'failed' || phase === 'exported') {
    open.value = true;
    void nextTick(() => {
      if (phase === 'conflict') conflictHeading.value?.focus();
      else if (phase === 'failed') failureHeading.value?.focus();
      else if (phase !== 'drift') heading.value?.focus();
    });
  }
});
</script>

<template>
  <section class="export-section" aria-labelledby="export-heading">
    <header class="export-section__heading">
      <h3 id="export-heading" ref="heading" tabindex="-1">Export <span class="export-section__state">{{ stateLabel }}</span></h3>
      <button type="button" class="ui-button" :aria-expanded="open" aria-controls="export-section-content" @click="open = !open">{{ open ? 'Collapse export' : 'Expand export' }}</button>
    </header>

    <div v-if="open" id="export-section-content" class="export-section__content">
      <section v-if="exportState.phase === 'conflict' && exportState.conflict !== null" class="inline-notice inline-notice--error" role="alert" aria-labelledby="export-conflict-heading">
        <h4 id="export-conflict-heading" ref="conflictHeading" tabindex="-1">Review changed before export</h4>
        <p>Accepted revision {{ exportState.conflict.expectedRevision }} is no longer current. Nothing from this export attempt was published.</p>
        <p>Latest revision {{ exportState.conflict.actualRevision }}</p>
        <button type="button" class="ui-button" @click="emit('reloadLatest')">Reload latest</button>
        <p>Reloading adopts the latest accepted review. It does not export automatically.</p>
      </section>
      <DriftExportAcknowledgement
        v-else-if="exportState.phase === 'drift' && exportState.driftObservation !== null"
        :observation="exportState.driftObservation"
        :stale="exportState.driftStale"
        :pinned-base="pinnedBase"
        :pinned-head="pinnedHead"
        :pending="exportState.pending"
        @cancel="emit('cancel')"
        @confirm="emit('export')"
      />

      <section v-else-if="exportState.phase === 'failed'" class="inline-notice inline-notice--error" role="alert" aria-labelledby="export-failure-heading">
        <h4 id="export-failure-heading" ref="failureHeading" tabindex="-1">Export was not published</h4>
        <p>{{ exportState.failure === 'reExportUnsupported' ? 'This export cannot replace a previous pair safely on this runtime.' : 'The export pair could not be validated.' }}</p>
        <div class="export-actions">
          <button type="button" class="ui-button" @click="emit('export')">Try export again</button>
          <button type="button" class="ui-button" @click="emit('reviewUnsavedText')">Return to review</button>
        </div>
        <p>Retry starts a new complete export attempt from the current accepted revision.</p>
      </section>

      <ExportProgress v-else-if="exportState.phase === 'pending'" :revision="revision" :stage="exportState.progress ?? 'preparing'" />

      <template v-else-if="exportState.phase === 'unavailable'">
        <section class="inline-notice inline-notice--error" aria-labelledby="export-unavailable-heading">
          <h4 id="export-unavailable-heading">Export unavailable</h4>
          <p>A readable accepted draft is required before export.</p>
        </section>
      </template>

      <template v-else>
        <ExportReadinessSummary :revision="revision" :summary="summary" :comments="comments" :ignore-status="exportState.ignoreStatus" />
        <section v-if="hasUnsavedText" class="inline-notice inline-notice--warning" aria-labelledby="export-unsaved-heading">
          <h4 id="export-unsaved-heading">Unsaved text is excluded</h4>
          <p>Unsaved text in this tab is not included. Export uses accepted revision {{ revision }}.</p>
          <button type="button" class="ui-button" @click="emit('reviewUnsavedText')">Review unsaved text</button>
        </section>
        <button type="button" class="ui-button ui-button--primary" :disabled="exportState.pending" @click="emit('export')">{{ exportState.phase === 'exported' ? 'Export review again' : 'Export review' }}</button>
        <p class="export-section__support">Creates <code>review.json</code> and <code>review.md</code> together from accepted revision {{ revision }}. This does not apply, stage, commit, or push changes.</p>
      </template>
    </div>
  </section>
</template>
