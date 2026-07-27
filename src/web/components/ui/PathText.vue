<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  display: string;
}>();

const directory = computed(() => {
  const lastSlash = props.display.lastIndexOf('/');
  return lastSlash === -1 ? '' : props.display.slice(0, lastSlash + 1);
});
const filename = computed(() => props.display.slice(directory.value.length));
</script>

<template>
  <span class="path-text"><span class="path-text__directory">{{ directory }}</span><span class="path-text__filename">{{ filename }}</span></span>
</template>
