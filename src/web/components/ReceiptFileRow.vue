<script setup lang="ts">
import { ref } from 'vue';

import type { ExportReviewResult } from '../../contracts/api.js';

type ReceiptFile = Extract<ExportReviewResult, { readonly kind: 'exported' }>['files'][number];

const props = defineProps<{
  file: ReceiptFile;
  fileName: 'review.json' | 'review.md';
}>();

const copyMessage = ref('');

async function copyPath(): Promise<void> {
  copyMessage.value = '';
  try {
    await navigator.clipboard.writeText(props.file.path);
    copyMessage.value = `${props.fileName} path copied.`;
  } catch {
    copyMessage.value = `Could not copy the ${props.fileName} path. Select and copy it manually.`;
  }
}
</script>

<template>
  <article class="receipt-file-row" :aria-labelledby="`receipt-file-${fileName}`">
    <div class="receipt-file-row__identity">
      <h5 :id="`receipt-file-${fileName}`">{{ fileName }}</h5>
      <button type="button" class="ui-button" @click="copyPath">Copy path</button>
    </div>
    <code class="receipt-file-row__value">{{ file.path }}</code>
    <dl class="receipt-file-row__metadata">
      <div><dt>Digest</dt><dd><code>{{ file.algorithm }}:{{ file.sha256 }}</code></dd></div>
      <div><dt>Bytes</dt><dd>{{ file.bytes }}</dd></div>
    </dl>
    <p v-if="copyMessage !== ''" class="receipt-file-row__message" :class="{ 'inline-notice inline-notice--error': copyMessage.startsWith('Could not') }" :role="copyMessage.startsWith('Could not') ? 'alert' : 'status'">{{ copyMessage }}</p>
  </article>
</template>
