<script setup lang="ts">
import { ref } from 'vue';

const headingElement = ref<HTMLHeadingElement>();

function focusHeading(): void {
  headingElement.value?.focus();
}

defineExpose({ focusHeading });
</script>

<template>
  <section class="keyboard-help" aria-labelledby="keyboard-actions-heading">
    <div class="keyboard-help__heading">
      <h3 id="keyboard-actions-heading" ref="headingElement" tabindex="-1">Keyboard actions</h3>
    </div>
    <ul>
      <li><kbd>j</kbd> / <kbd>k</kbd> — next / previous file</li>
      <li><kbd>n</kbd> / <kbd>p</kbd> — next / previous changed line</li>
      <li><kbd>f</kbd> — focus file tree</li>
      <li><kbd>c</kbd> — focus comments</li>
      <li><kbd>?</kbd> — focus this keyboard help</li>
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
