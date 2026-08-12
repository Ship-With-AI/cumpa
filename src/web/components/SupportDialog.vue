<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';

const props = defineProps<{
  readonly open: boolean;
  readonly mode: 'invitation' | 'waiting' | 'recovery' | 'recoveryPending' | 'verified' | 'thankYou';
  readonly busy: boolean;
}>();

const emit = defineEmits<{
  checkout: [];
  restore: [];
  submitRecovery: [email: string];
  dismiss: [];
  close: [];
}>();

const dialog = ref<HTMLElement>();
const initial = ref<HTMLButtonElement>();
const email = ref('');
const status = computed(() => {
  if (props.mode === 'waiting') return 'Waiting for confirmation… You can close this and keep reviewing.';
  if (props.mode === 'recoveryPending') return 'Check your email for a recovery link. This request does not confirm whether support exists.';
  if (props.mode === 'verified') return 'Support is verified on this machine.';
  if (props.mode === 'thankYou') return 'Thank you for supporting Cumpa.';
  return '';
});

function focusInitial(): void {
  void nextTick(() => initial.value?.focus());
}

function containFocus(event: KeyboardEvent): void {
  if (event.key !== 'Tab') return;
  const controls = Array.from(dialog.value?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)') ?? []);
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

function submitRecovery(): void {
  if (email.value === '' || props.busy) return;
  emit('submitRecovery', email.value);
  email.value = '';
}

watch(() => props.open, (open) => {
  if (open) focusInitial();
});

defineExpose({ focusInitial });
</script>

<template>
  <div v-if="open" class="support-dialog-backdrop">
    <section
      ref="dialog"
      class="support-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-dialog-heading"
      aria-describedby="support-dialog-status"
      @keydown="containFocus"
      @keydown.esc.prevent="emit('close')"
    >
      <button ref="initial" type="button" class="sheet-close-button support-dialog__close" aria-label="Close support dialog" @click="emit('close')">Close</button>
      <h2 id="support-dialog-heading">{{ mode === 'recovery' || mode === 'recoveryPending' ? 'Restore support' : 'Support Cumpa' }}</h2>
      <p id="support-dialog-status" class="support-dialog__status" aria-live="polite">{{ status }}</p>
      <template v-if="mode === 'invitation'">
        <p>Cumpa stays fully usable. One optional $49.99 payment supports development. Paying once stops the launch prompt.</p>
        <div class="support-dialog__actions">
          <button type="button" class="ui-button ui-button--primary" :disabled="busy" @click="emit('checkout')">Support Cumpa — $49.99</button>
          <button type="button" class="ui-button" :disabled="busy" @click="emit('restore')">Restore support</button>
          <button type="button" class="ui-button" :disabled="busy" @click="emit('dismiss')">Not now</button>
        </div>
      </template>
      <template v-else-if="mode === 'recovery'">
        <p>Enter the email used for payment. We will send recovery instructions if available.</p>
        <form class="support-dialog__form" @submit.prevent="submitRecovery">
          <label for="support-recovery-email">Email</label>
          <input id="support-recovery-email" v-model="email" type="email" autocomplete="email" maxlength="320" required :disabled="busy">
          <button type="submit" class="ui-button ui-button--primary" :disabled="busy">Send recovery email</button>
        </form>
      </template>
      <template v-else-if="mode === 'waiting' || mode === 'recoveryPending'">
        <button type="button" class="ui-button" @click="emit('close')">Keep reviewing</button>
      </template>
      <template v-else-if="mode === 'verified'">
        <p>Thank you for supporting Cumpa. Cumpa remains fully usable.</p>
        <button type="button" class="ui-button" @click="emit('close')">Close</button>
      </template>
    </section>
  </div>
</template>
