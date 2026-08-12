<script setup lang="ts">
import UiIcon from './ui/UiIcon.vue';
import UiTooltip from './ui/UiPrimitives.vue';

defineProps<{
  atFirstFile: boolean;
  atLastFile: boolean;
  hasActiveFile: boolean;
  openCommentCount: number;
  resolvedCommentCount: number;
  reviewExpanded: boolean;
}>();

const emit = defineEmits<{
  previousFile: [];
  nextFile: [];
  previousChange: [];
  nextChange: [];
  comments: [];
  keyboardHelp: [];
}>();
</script>

<template>
  <div class="review-toolbar" aria-label="Diff navigation">
    <div class="review-toolbar__group" aria-label="File navigation">
      <span class="review-toolbar__label" aria-hidden="true">File</span>
      <UiTooltip :text="atFirstFile ? 'Previous file · Alt+Shift+[ · First changed file.' : 'Previous file · Alt+Shift+['">
        <button
          type="button"
          class="ui-button ui-button--icon"
          aria-label="Previous file"
          :disabled="atFirstFile || !hasActiveFile"
          @click="emit('previousFile')"
        >
          <UiIcon name="previous-file" />
        </button>
      </UiTooltip>
      <UiTooltip :text="atLastFile ? 'Next file · Alt+Shift+] · Last changed file.' : 'Next file · Alt+Shift+]'">
        <button
          type="button"
          class="ui-button ui-button--icon"
          aria-label="Next file"
          :disabled="atLastFile || !hasActiveFile"
          @click="emit('nextFile')"
        >
          <UiIcon name="next-file" />
        </button>
      </UiTooltip>
    </div>
    <div class="review-toolbar__group" aria-label="Change navigation">
      <span class="review-toolbar__label" aria-hidden="true">Change</span>
      <UiTooltip text="Previous change · Shift+F7">
        <button
          type="button"
          class="ui-button ui-button--icon"
          aria-label="Previous change"
          :disabled="!hasActiveFile"
          @click="emit('previousChange')"
        >
          <UiIcon name="previous-change" />
        </button>
      </UiTooltip>
      <UiTooltip text="Next change · F7">
        <button
          type="button"
          class="ui-button ui-button--icon"
          aria-label="Next change"
          :disabled="!hasActiveFile"
          @click="emit('nextChange')"
        >
          <UiIcon name="next-change" />
        </button>
      </UiTooltip>
    </div>
    <div class="review-toolbar__group review-toolbar__group--actions">
      <span id="review-description" class="sr-only">
        {{ openCommentCount }} open comments, {{ resolvedCommentCount }} resolved comments
      </span>
      <UiTooltip text="Review">
        <button
          type="button"
          :class="['ui-button', { 'ui-button--selected': reviewExpanded }]"
          aria-controls="review-panel"
          :aria-expanded="reviewExpanded"
          aria-describedby="review-description"
          @click="emit('comments')"
        >
          Review
        </button>
      </UiTooltip>
      <UiTooltip text="Keyboard help · ?">
        <button type="button" class="ui-button" @click="emit('keyboardHelp')">Keyboard help</button>
      </UiTooltip>
    </div>
  </div>
</template>
