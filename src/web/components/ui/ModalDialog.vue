<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

const props = withDefaults(defineProps<{
  readonly open: boolean;
  readonly title: string;
  readonly closeLabel?: string;
  readonly closeAriaLabel?: string;
  readonly descriptionId?: string;
}>(), {
  closeLabel: 'Close',
});

const emit = defineEmits<{ close: []; }>();

const panel = ref<HTMLElement>();
const closeButton = ref<HTMLButtonElement>();
let opener: HTMLElement | undefined;

const focusableSelector = [
  'button:not(:disabled)',
  'input:not(:disabled)',
  'textarea:not(:disabled)',
  'select:not(:disabled)',
  'a[href]',
  '[tabindex]:not([tabindex="-1"]):not(:disabled)',
].join(', ');

function focusInitial(): void {
  void nextTick(() => closeButton.value?.focus());
}

function restoreFocus(): void {
  if (opener?.isConnected) opener.focus();
}

function dismiss(): void {
  emit('close');
  void nextTick(restoreFocus);
}

function containFocus(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    dismiss();
    return;
  }
  if (event.key !== 'Tab') return;

  const controls = Array.from(panel.value?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
  if (controls.length === 0) return;

  const first = controls[0]!;
  const last = controls.at(-1)!;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(() => props.open, (open) => {
  if (!open) return;
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
  focusInitial();
});

defineExpose({ focusInitial });
</script>

<template>
  <div v-if="open" class="modal-dialog-backdrop">
    <section
      ref="panel"
      class="modal-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-dialog-heading"
      :aria-describedby="descriptionId"
      @keydown="containFocus"
    >
      <button
        ref="closeButton"
        type="button"
        class="sheet-close-button modal-dialog__close"
        :aria-label="closeAriaLabel ?? closeLabel"
        @click="dismiss"
      >{{ closeLabel }}</button>
      <h2 id="modal-dialog-heading">{{ title }}</h2>
      <slot />
    </section>
  </div>
</template>
