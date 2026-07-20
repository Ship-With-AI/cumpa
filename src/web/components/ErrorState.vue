<script setup lang="ts">
defineProps<{
  readonly message: string;
}>();
</script>

<template>
  <section class="state-card" aria-labelledby="unavailable-heading">
    <h2 id="unavailable-heading">Pinned session unavailable</h2>
    <p role="alert">{{ message }}</p>
  </section>
</template>
