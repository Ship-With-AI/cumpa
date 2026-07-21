<script setup lang="ts">
import type { DiffSide } from '../monaco/line-mapping.js';

const props = defineProps<{
  path: string;
  side: DiffSide;
  line: number;
  text: string;
  status: 'ready' | 'pending' | 'confirm-discard' | 'confirm-move';
  validation?: string;
  error?: string;
}>();

const emit = defineEmits<{
  add: [];
  cancel: [];
  confirmDiscard: [];
  keepWriting: [];
  updateText: [text: string];
}>();

const sideLabel = () => props.side === 'base' ? 'Base' : 'Head';
</script>

<template>
  <section class="inline-comment-composer" :aria-label="`Comment on ${side} line ${line}`">
    <header class="inline-comment-composer__header" :title="'Anchor fields are fixed for this comment.'">
      <span>{{ path }} · {{ sideLabel() }} · line {{ line }}</span>
      <span aria-hidden="true">🔒</span>
    </header>
    <label>
      <span>Comment</span>
      <textarea
        :value="text"
        :disabled="status === 'pending'"
        placeholder="Describe the issue or requested change…"
        @input="emit('updateText', ($event.target as HTMLTextAreaElement).value)"
      />
    </label>
    <p class="inline-comment-composer__support">Your comment is accepted only after it is saved locally.</p>
    <p v-if="validation" class="inline-notice inline-notice--error" role="alert">{{ validation }}</p>
    <p v-if="error" class="inline-notice inline-notice--error" role="alert">{{ error }}</p>
    <footer v-if="status === 'confirm-discard' || status === 'confirm-move'" class="inline-comment-composer__confirm">
      <p>Discard this comment draft? Your text hasn’t been saved.</p>
      <button type="button" class="ui-button" @click="emit('keepWriting')">Keep writing</button>
      <button type="button" class="ui-button ui-button--destructive" @click="emit('confirmDiscard')">Discard draft</button>
    </footer>
    <footer v-else>
      <button type="button" class="ui-button ui-button--primary" :disabled="status === 'pending'" @click="emit('add')">
        {{ status === 'pending' ? 'Adding comment…' : 'Add comment' }}
      </button>
      <button type="button" class="ui-button ui-button--destructive" :disabled="status === 'pending'" @click="emit('cancel')">Discard draft</button>
    </footer>
  </section>
</template>
