<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  revision: number;
  stage: 'preparing' | 'validating' | 'publishing';
}>();

const heading = computed(() => {
  switch (props.stage) {
    case 'validating':
      return 'Validating export pair…';
    case 'publishing':
      return 'Publishing export pair…';
    default:
      return `Preparing accepted revision ${props.revision}…`;
  }
});
</script>

<template>
  <section class="export-progress" role="status" aria-live="polite" aria-label="Exporting accepted revision">
    <span class="ui-spinner" aria-hidden="true" />
    <div>
      <h4>{{ heading }}</h4>
      <p><code>review.json</code> and <code>review.md</code> become available only after both pass validation and publication checks.</p>
    </div>
  </section>
</template>
