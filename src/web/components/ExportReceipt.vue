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
const revealFailed = ref(false);
const revealAlert = ref<HTMLElement>();

const headingText = computed(() => props.previous ? 'Previous confirmed export' : 'Review export complete');
const driftText = computed(() => props.receipt.drift.kind === 'acknowledged' ? 'Acknowledged for this export' : 'None observed');
const acknowledgedIdentitiesOpen = ref(false);
const acknowledgedIdentities = computed(() => props.receipt.drift.kind === 'acknowledged'
  ? props.receipt.drift.identities
  : []);
const acknowledgedIdentityDetails = computed(() => acknowledgedIdentities.value.map((identity) => [
  `${identity.role === 'base' ? 'Base' : 'Head'} pinned: ${identity.pinned.oid}`,
  identity.current.kind === 'available'
    ? `${identity.role === 'base' ? 'Base' : 'Head'} current: ${identity.current.oid}`
    : `${identity.role === 'base' ? 'Base' : 'Head'} current unavailable: ${identity.current.reason}`,
].join('\n')).join('\n'));
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
    copyMessage.value = 'Copied export receipt details.';
  } catch {
    copyMessage.value = 'Could not copy receipt details. Select and copy the visible values manually.';
  }
}

async function copyAcknowledgedIdentities(): Promise<void> {
  copyMessage.value = '';
  try {
    await navigator.clipboard.writeText(acknowledgedIdentityDetails.value);
    copyMessage.value = 'Acknowledged identities copied.';
  } catch {
    copyMessage.value = 'Could not copy acknowledged identities. Select and copy the visible values manually.';
  }
}

async function revealDirectory(): Promise<void> {
  revealMessage.value = '';
  revealFailed.value = false;
  try {
    const result = await props.revealExportDirectory();
    if (result.kind === 'revealed') {
      revealMessage.value = 'Export directory revealed in the system file browser.';
      return;
    }
  } catch {
    // The fixed capability reports no path or OS diagnostic to the browser.
  }
  revealFailed.value = true;
  revealMessage.value = 'Reveal failed; copy a displayed relative path and open it from the repository root.';
  await nextTick();
  revealAlert.value?.focus();
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
    <section v-if="acknowledgedIdentities.length > 0" class="export-receipt__drift-disclosure">
      <button
        type="button"
        class="ui-button"
        :aria-expanded="acknowledgedIdentitiesOpen"
        aria-controls="acknowledged-identities"
        @click="acknowledgedIdentitiesOpen = !acknowledgedIdentitiesOpen"
      >View acknowledged identities</button>
      <div v-if="acknowledgedIdentitiesOpen" id="acknowledged-identities" class="export-receipt__acknowledged-identities">
        <dl v-for="identity in acknowledgedIdentities" :key="identity.role">
          <dt>{{ identity.role === 'base' ? 'Base' : 'Head' }}</dt>
          <dd>Pinned {{ identity.role === 'base' ? 'Base' : 'Head' }}: <code>{{ identity.pinned.oid }}</code></dd>
          <dd v-if="identity.current.kind === 'available'">Current {{ identity.role === 'base' ? 'Base' : 'Head' }}: <code>{{ identity.current.oid }}</code></dd>
          <dd v-else>Current {{ identity.role === 'base' ? 'Base' : 'Head' }} unavailable: {{ identity.current.reason }}</dd>
        </dl>
        <button type="button" class="ui-button" @click="copyAcknowledgedIdentities">Copy acknowledged identities</button>
      </div>
    </section>
    <div class="export-receipt__files" aria-label="Published files">
      <ReceiptFileRow :file="receipt.files[0]" file-name="review.json" />
      <ReceiptFileRow :file="receipt.files[1]" file-name="review.md" />
    </div>
    <p v-if="copyMessage !== ''" class="export-receipt__message" :class="{ 'inline-notice inline-notice--error': copyMessage.startsWith('Could not') }" :role="copyMessage.startsWith('Could not') ? 'alert' : 'status'">{{ copyMessage }}</p>
    <p v-if="revealMessage !== ''" ref="revealAlert" class="export-receipt__message" :class="{ 'inline-notice inline-notice--error': revealFailed }" :role="revealFailed ? 'alert' : 'status'" tabindex="-1">{{ revealMessage }}</p>
  </section>
</template>
