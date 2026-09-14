<script setup lang="ts">
import UiIcon from './ui/UiIcon.vue';

defineEmits<{
  openComments: [];
}>();
</script>

<template>
  <aside class="inline-notice inline-notice--warning" aria-labelledby="stale-anchor-heading">
    <UiIcon name="warning" class="inline-notice__icon" />
    <div class="inline-notice__content">
      <h2 id="stale-anchor-heading">Some saved comment anchors cannot be verified</h2>
      <p>Stale and unavailable comments remain visible as read-only history.</p>
      <button type="button" class="ui-button" @click="$emit('openComments')">Open comments</button>
    </div>
  </aside>
</template>
