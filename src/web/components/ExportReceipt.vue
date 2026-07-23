<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';

import type { ExportDirectoryRevealResult, ExportReviewResult } from '../../contracts/api.js';
import ReceiptFileRow from './ReceiptFileRow.vue';

type ConfirmedReceipt = Extract<ExportReviewResult, { readonly kind: 'exported' }>;

const props = withDefaults(defineProps<{
  receipt: ConfirmedReceipt;
  revealExportDirectory: () => Promise<ExportDirectoryRevealResult>;
  previous?: boolean;
}>(), {
  previous: false,
});

const heading = ref<HTMLElement>();
const copyMessage = ref('');
const revealMessage = ref('');

const headingText = computed(() => props.previous ? 'Previous confirmed export' : 'Review export complete');
const driftText = computed(() => props.receipt.driftAcknowledged ? 'Acknowledged for this export' : 'None observed');
const receiptDetails = computed(() => [
  `Accepted revision: ${props.receipt.draftRevision}`,
  `Exported at: ${props.receipt.exportedAt}`,
  `Drift: ${driftText.value}`,
  `Path: ${props.receipt.files[0].path}`,
  `${props.receipt.files[0].algorithm}:${props.receipt.files[0].sha256}`,
  `Bytes: ${props.receipt.files[0].bytes}`,
  `Path: ${props.receipt.files[1].path}`,
  `${props.receipt.files[1].algorithm}:${props.receipt.files[1].sha256}`,
  `Bytes: ${props.receipt.files[1].bytes}`,
].join('\n'));

onMounted(() => {
  if (!props.previous) void nextTick(() => heading.value?.focus());
});

async function copyDetails(): Promise<void> {
  copyMessage.value = '';
  try {
    await navigator.clipboard.writeText(receiptDetails.value);
    copyMessage.value = 'Receipt details copied';
  } catch {
    copyMessage.value = 'Could not copy receipt details. Select and copy the visible values manually.';
  }
}

async function revealDirectory(): Promise<void> {
  revealMessage.value = '';
  try {
    const result = await props.revealExportDirectory();
    revealMessage.value = result.kind === 'revealed'
      ? 'Export directory revealed in the system file browser.'
      : 'Could not reveal the export directory. Check the terminal details.';
  } catch {
    revealMessage.value = 'Could not reveal the export directory. Check the terminal details.';
  }
}
</script>

<template>
  <section class="export-receipt" :class="{ 'export-receipt--previous': previous }" :aria-labelledby="previous ? 'previous-export-heading' : 'export-receipt-heading'">
    <header class="export-receipt__heading">
      <h4 :id="previous ? 'previous-export-heading' : 'export-receipt-heading'" ref="heading" tabindex="-1">{{ headingText }}</h4>
      <div v-if="!previous" class="export-actions">
        <button type="button" class="ui-button" @click="copyDetails">Copy receipt details</button>
        <button type="button" class="ui-button" @click="revealDirectory">Reveal export directory</button>
      </div>
    </header>
    <p v-if="previous" class="export-receipt__previous-note">This last confirmed pair remains available; the later export attempt was not published.</p>
    <dl class="export-receipt__metadata">
      <div><dt>Accepted revision</dt><dd>{{ receipt.draftRevision }}</dd></div>
      <div><dt>Exported at</dt><dd><time :datetime="receipt.exportedAt">{{ receipt.exportedAt }}</time></dd></div>
      <div><dt>Drift</dt><dd>{{ driftText }}</dd></div>
    </dl>
    <div class="export-receipt__files" aria-label="Published files">
      <ReceiptFileRow :file="receipt.files[0]" file-name="review.json" />
      <ReceiptFileRow :file="receipt.files[1]" file-name="review.md" />
    </div>
    <p v-if="copyMessage !== ''" class="export-receipt__message" :class="{ 'inline-notice inline-notice--error': copyMessage.startsWith('Could not') }" :role="copyMessage.startsWith('Could not') ? 'alert' : 'status'">{{ copyMessage }}</p>
    <p v-if="revealMessage !== ''" class="export-receipt__message" :class="{ 'inline-notice inline-notice--error': revealMessage.startsWith('Could not') }" :role="revealMessage.startsWith('Could not') ? 'alert' : 'status'">{{ revealMessage }}</p>
  </section>
</template>
