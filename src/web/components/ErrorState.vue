<script setup lang="ts">
import { onMounted, ref } from 'vue';

const props = withDefaults(defineProps<{
  readonly alert?: boolean;
  readonly focusHeading?: boolean;
  readonly heading: string;
  readonly message: string;
}>(), {
  alert: true,
  focusHeading: false,
});
const headingElement = ref<HTMLHeadingElement>();

onMounted(() => {
  if (props.focusHeading) {
    headingElement.value?.focus();
  }
});
</script>

<template>
  <section class="state-card" aria-labelledby="unavailable-heading">
    <h1 id="unavailable-heading" ref="headingElement" tabindex="-1">{{ heading }}</h1>
    <p :role="alert ? 'alert' : undefined">{{ message }}</p>
  </section>
</template>
