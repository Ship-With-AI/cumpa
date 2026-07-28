<script setup lang="ts">
import { computed } from 'vue';

import UiIcon, { type UiIconName } from './ui/UiIcon.vue';

const props = withDefaults(
  defineProps<{
    readonly tone?: 'neutral' | 'information' | 'success' | 'warning' | 'error';
    readonly role?: 'alert' | 'note' | 'status';
  }>(),
  {
    tone: 'neutral',
    role: 'note',
  },
);

const toneIcon = computed<UiIconName>(() => {
  switch (props.tone) {
    case 'neutral':
    case 'information':
      return 'information';
    case 'success':
      return 'check';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
  }
});
</script>

<template>
  <aside class="inline-notice" :class="`inline-notice--${tone}`" :role="role">
    <UiIcon :name="toneIcon" class="inline-notice__icon" />
    <div class="inline-notice__content">
      <slot />
    </div>
  </aside>
</template>
