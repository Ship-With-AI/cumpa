<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';

const props = defineProps<{
  readonly label: string;
  readonly value: string;
}>();

const feedback = ref<'idle' | 'success' | 'failure'>('idle');
let resetTimer: ReturnType<typeof setTimeout> | undefined;

function clearResetTimer(): void {
  if (resetTimer !== undefined) {
    clearTimeout(resetTimer);
    resetTimer = undefined;
  }
}

async function copyValue(): Promise<void> {
  clearResetTimer();
  feedback.value = 'idle';
  try {
    await navigator.clipboard.writeText(props.value);
    feedback.value = 'success';
    resetTimer = setTimeout(() => {
      feedback.value = 'idle';
      resetTimer = undefined;
    }, 2_000);
  } catch {
    feedback.value = 'failure';
  }
}

onBeforeUnmount(clearResetTimer);
</script>

<template>
  <div class="copy-action">
    <button
      type="button"
      class="copy-button"
      :aria-label="label"
      @click="copyValue"
    >
      Copy
    </button>
    <span class="copy-feedback" role="status" aria-live="polite">
      {{ feedback === 'success' ? 'Copied' : '' }}
    </span>
    <span v-if="feedback === 'failure'" class="copy-error" role="alert">
      Copy failed. The full value remains available to select.
    </span>
  </div>
</template>
