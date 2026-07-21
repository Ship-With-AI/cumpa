<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  text: string;
}>();

const open = ref(false);

function dismiss(): void {
  open.value = false;
}
</script>

<template>
  <span
    class="ui-tooltip"
    @focusin="open = true"
    @focusout="dismiss"
    @mouseenter="open = true"
    @mouseleave="dismiss"
    @keydown.escape.stop="dismiss"
  >
    <slot />
    <span v-if="open" class="ui-tooltip__content" role="tooltip">{{ text }}</span>
  </span>
</template>
