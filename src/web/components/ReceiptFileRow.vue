<script setup lang="ts">
import { ref } from 'vue';

import type { ExportReviewResult } from '../../contracts/api.js';

type ReceiptFile = Extract<ExportReviewResult, { readonly kind: 'exported' }>['files'][number];

const props = defineProps<{
  file: ReceiptFile;
  fileName: 'review.json' | 'review.md';
}>();

const copyMessage = ref('');
const descriptionId = `receipt-file-${props.fileName}-description`;
const accessibleDescription = `${props.fileName}. Path ${props.file.path}. SHA-256 ${props.file.sha256}. ${props.file.bytes} bytes.`;

async function copyPath(): Promise<void> {
  copyMessage.value = '';
  try {
    await navigator.clipboard.writeText(props.file.path);
    copyMessage.value = `Copied relative path for ${props.fileName}.`;
  } catch {
    copyMessage.value = `Could not copy the ${props.fileName} path. Select and copy it manually.`;
  }
}
</script>

<template>
  <article class="receipt-file-row" :aria-labelledby="`receipt-file-${fileName}`" :aria-describedby="descriptionId">
    <div class="receipt-file-row__identity">
      <h5 :id="`receipt-file-${fileName}`">{{ fileName }}</h5>
      <button type="button" class="ui-button" @click="copyPath">Copy path</button>
    </div>
    <code class="receipt-file-row__value">{{ file.path }}</code>
    <dl class="receipt-file-row__metadata">
      <div><dt>Digest</dt><dd><code>{{ file.algorithm }}:{{ file.sha256 }}</code></dd></div>
      <div><dt>Bytes</dt><dd>{{ file.bytes }}</dd></div>
    </dl>
    <span :id="descriptionId" class="visually-hidden">{{ accessibleDescription }}</span>
    <p v-if="copyMessage !== ''" class="receipt-file-row__message" :class="{ 'inline-notice inline-notice--error': copyMessage.startsWith('Could not') }" :role="copyMessage.startsWith('Could not') ? 'alert' : 'status'">{{ copyMessage }}</p>
  </article>
</template>
