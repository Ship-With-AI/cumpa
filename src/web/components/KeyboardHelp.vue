<script setup lang="ts">
defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <section v-if="open" class="keyboard-help" aria-labelledby="keyboard-actions-heading">
    <div class="keyboard-help__heading">
      <h2 id="keyboard-actions-heading" tabindex="-1">Keyboard actions</h2>
      <button type="button" class="ui-button" @click="emit('close')">Close keyboard help</button>
    </div>
    <ul>
      <li>Previous file — Alt+Shift+[</li>
      <li>Next file — Alt+Shift+]</li>
      <li>Previous change — Shift+F7</li>
      <li>Next change — F7</li>
      <li>Add or focus comment on current line — Option+Enter on macOS; Alt+Enter on Windows and Linux</li>
      <li>Add comment — Command+Enter on macOS; Ctrl+Enter on Windows and Linux</li>
      <li>Discard or close composer — Escape</li>
      <li>Move through controls — Tab and Shift+Tab</li>
      <li>Move within the changed-file tree — Arrow keys; Enter opens a file</li>
      <li>Open Monaco accessibility help — Alt+F1</li>
    </ul>
    <p>Shortcuts never replace the visible controls.</p>
  </section>
</template>
