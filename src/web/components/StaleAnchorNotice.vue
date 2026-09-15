<script setup lang="ts">
import UiIcon from './ui/UiIcon.vue';

</script>

<template>
  <aside class="inline-notice inline-notice--warning" aria-labelledby="stale-anchor-heading">
    <UiIcon name="warning" class="inline-notice__icon" />
    <div class="inline-notice__content">
      <h2 id="stale-anchor-heading">Some saved comment anchors cannot be verified</h2>
      <p>Their recorded anchors are unchanged and may not be actionable in exported feedback.</p>
    </div>
  </aside>
</template>
