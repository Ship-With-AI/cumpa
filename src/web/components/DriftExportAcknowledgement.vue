<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';

import type { SelectorDriftResponse } from '../../contracts/api.js';

type PinnedEndpoint = Readonly<{ label: string; oid: string }>;

const props = defineProps<{
  observation: SelectorDriftResponse;
  stale: boolean;
  pending: boolean;
  pinnedBase: PinnedEndpoint;
  pinnedHead: PinnedEndpoint;
}>();

const emit = defineEmits<{
  cancel: [];
  confirm: [];
}>();

const acknowledged = ref(false);
const heading = ref<HTMLElement>();
const rows = computed(() => [
  { observed: props.observation.base, pinned: props.pinnedBase },
  { observed: props.observation.head, pinned: props.pinnedHead },
]);

function focusHeading(): void {
  void nextTick(() => heading.value?.focus());
}

onMounted(focusHeading);
watch(() => props.observation, () => {
  acknowledged.value = false;
  focusHeading();
});

defineExpose({ focusHeading });
</script>

<template>
  <section class="export-drift inline-notice inline-notice--warning" :role="stale ? 'alert' : undefined" aria-labelledby="export-drift-heading">
    <h4 id="export-drift-heading" ref="heading" tabindex="-1">{{ stale ? 'Selected sources changed again' : 'Confirm export of pinned review' }}</h4>
    <p>{{ stale ? 'The previous acknowledgement is out of date. Review the latest source identities before exporting the same pinned comparison.' : 'Selected sources changed after this review opened. Export will use the original pinned comparison, not the current source targets.' }}</p>
    <dl class="export-drift__identities">
      <div v-for="row in rows" :key="row.observed.role">
        <dt>{{ row.observed.role === 'base' ? 'Base' : 'Head' }} · {{ row.pinned.label }}</dt>
        <dd><span>Pinned at</span> <code>{{ row.pinned.oid }}</code></dd>
        <dd v-if="row.observed.kind === 'moved'"><span>Now at</span> <code>{{ row.observed.newOid }}</code></dd>
        <dd v-else-if="row.observed.kind === 'unavailable'"><span>Now unavailable</span> <span>{{ row.observed.reason }}</span></dd>
        <dd v-else><span>Now at</span> <code>{{ row.pinned.oid }}</code></dd>
      </div>
    </dl>
    <label class="export-drift__consent">
      <input v-model="acknowledged" type="checkbox" :disabled="pending">
      I understand this export remains pinned to the original commits and records the selector drift.
    </label>
    <div class="export-actions">
      <button type="button" class="ui-button" :disabled="pending" @click="emit('cancel')">Cancel export</button>
      <button type="button" class="ui-button ui-button--primary" :disabled="!acknowledged || pending" @click="emit('confirm')">Export pinned review</button>
    </div>
  </section>
</template>
