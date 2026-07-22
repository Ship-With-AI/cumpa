<script setup lang="ts">
import { computed, ref } from 'vue';

import { renderMarkdownPreview } from '../model/markdown-preview.js';

const props = defineProps<{
  canonical: string;
  modelValue: string;
  pending: boolean;
  conflict: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  cancel: [];
  save: [];
}>();

const open = ref(true);
const mode = ref<'edit' | 'preview'>('preview');
const unsaved = computed(() => props.modelValue !== props.canonical);
const status = computed(() => {
  if (props.conflict) return 'Conflict — unsaved text retained';
  if (props.pending) return 'Saving';
  return unsaved.value ? 'Unsaved' : 'Saved';
});
const preview = computed(() => renderMarkdownPreview(props.modelValue));

function edit(): void {
  mode.value = 'edit';
}

function onKeydown(event: KeyboardEvent): void {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && unsaved.value && !props.pending && !props.conflict) {
    event.preventDefault();
    emit('save');
  }
}
</script>

<template>
  <section class="review-summary" aria-labelledby="review-summary-heading">
    <header class="review-summary__header">
      <button
        id="review-summary-heading"
        type="button"
        :aria-expanded="open"
        class="review-summary__toggle"
        @click="open = !open"
      >
        Summary <span class="review-summary__status">{{ status }}</span>
      </button>
    </header>
    <div v-if="open" class="review-summary__content">
      <div role="tablist" aria-label="Summary mode">
        <button type="button" role="tab" :aria-selected="mode === 'edit'" @click="edit">Edit</button>
        <button type="button" role="tab" :aria-selected="mode === 'preview'" @click="mode = 'preview'">Preview</button>
      </div>
      <template v-if="mode === 'edit'">
        <label>
          Review summary (Markdown)
          <textarea
            :value="modelValue"
            placeholder="Summarize the review outcome and the most important changes requested…"
            :disabled="pending || conflict"
            @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
            @keydown="onKeydown"
          />
        </label>
        <p>Markdown is supported. Your summary changes only after you save.</p>
        <button type="button" :disabled="!unsaved || pending || conflict" @click="emit('save')">Save summary</button>
        <button type="button" :disabled="pending" @click="emit('cancel')">Cancel changes</button>
      </template>
      <template v-else>
        <div class="review-summary__preview" v-html="preview" />
        <button v-if="modelValue === ''" type="button" @click="edit">Write summary</button>
      </template>
    </div>
  </section>
</template>
