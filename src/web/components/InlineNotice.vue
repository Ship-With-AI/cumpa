<script setup lang="ts">
withDefaults(
  defineProps<{
    readonly tone?: 'neutral' | 'warning' | 'error';
    readonly role?: 'alert' | 'note' | 'status';
  }>(),
  {
    tone: 'neutral',
    role: 'note',
  },
);
</script>

<template>
  <aside class="inline-notice" :class="`inline-notice--${tone}`" :role="role">
    <slot />
  </aside>
</template>
