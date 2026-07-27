<script setup lang="ts">
import { computed } from 'vue';

import type { DiffSide } from '../monaco/line-mapping.js';
import UiIcon from './ui/UiIcon.vue';
import PathText from './ui/PathText.vue';

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
  confirmMove: [];
  keepWriting: [];
  updateText: [text: string];
}>();

const sideLabel = () => props.side === 'base' ? 'Base' : 'Head';
const commentSupportId = computed(() => `comment-support-${props.side}-${props.line}`);
const commentFeedbackId = computed(() => `comment-feedback-${props.side}-${props.line}`);
const commentDescribedBy = computed(() => [
  commentSupportId.value,
  props.validation !== undefined || props.error !== undefined ? commentFeedbackId.value : undefined,
].filter((value): value is string => value !== undefined).join(' '));
</script>

<template>
  <section
    class="conversation-card inline-comment-composer"
    :class="{ 'conversation-card--busy': status === 'pending' }"
    :aria-busy="status === 'pending' ? 'true' : undefined"
    :aria-label="`Comment on ${side} line ${line}`"
  >
    <header class="conversation-card__header inline-comment-composer__header" title="Anchor fields are fixed for this comment.">
      <div class="conversation-card__identity">
        <PathText :display="path" />
        <span>{{ sideLabel() }} line {{ line }}</span>
      </div>
      <span class="conversation-card__fixed">
        <UiIcon name="lock" />
        <span>Fixed anchor</span>
      </span>
    </header>

    <div class="conversation-card__body">
      <label>
        <span>Comment</span>
        <textarea
          aria-label="Comment"
          :aria-describedby="commentDescribedBy"
          :value="text"
          :disabled="status === 'pending'"
          placeholder="Describe the issue or requested change…"
          @input="emit('updateText', ($event.target as HTMLTextAreaElement).value)"
        />
      </label>
    </div>

    <div class="conversation-card__support">
      <p :id="commentSupportId" class="inline-comment-composer__support">Your comment is accepted only after it is saved locally.</p>
      <div v-if="validation || error" :id="commentFeedbackId" class="inline-comment-composer__feedback">
        <p v-if="validation" class="inline-notice inline-notice--error" role="alert">{{ validation }}</p>
        <p v-if="error" class="inline-notice inline-notice--error" role="alert">{{ error }}</p>
      </div>
    </div>

    <footer v-if="status === 'confirm-discard' || status === 'confirm-move'" class="conversation-card__footer inline-comment-composer__confirm">
      <p>Discard this comment draft? Your text hasn’t been saved.</p>
      <div class="conversation-card__actions">
        <button type="button" class="ui-button" @click="emit('keepWriting')">Keep writing</button>
        <button type="button" class="ui-button ui-button--destructive" @click="status === 'confirm-move' ? emit('confirmMove') : emit('confirmDiscard')">Discard draft</button>
      </div>
    </footer>
    <footer v-else class="conversation-card__footer">
      <div class="conversation-card__actions">
        <button
          type="button"
          class="ui-button ui-button--primary"
          :class="{ 'ui-button--busy': status === 'pending' }"
          :aria-busy="status === 'pending' ? 'true' : undefined"
          :disabled="status === 'pending'"
          @click="emit('add')"
        >
          <span v-if="status === 'pending'" class="ui-spinner" aria-hidden="true" />
          {{ status === 'pending' ? 'Adding comment…' : 'Add comment' }}
        </button>
        <button type="button" class="ui-button ui-button--destructive" :disabled="status === 'pending'" @click="emit('cancel')">Discard draft</button>
      </div>
    </footer>
  </section>
</template>
