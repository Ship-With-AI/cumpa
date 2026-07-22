<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';

import type { DraftRecoveryResult, DraftRevealResult } from '../../contracts/api.js';
import type { ReadOnlyDraftLoad } from '../model/review-draft-state.js';

const props = defineProps<{
  load: ReadOnlyDraftLoad;
  revealDraftFile: () => Promise<DraftRevealResult>;
  recoverDraft: (expectedFingerprint: string) => Promise<DraftRecoveryResult>;
}>();

const emit = defineEmits<{
  recovered: [result: Extract<DraftRecoveryResult, { readonly kind: 'recovered' }>];
  openNewDraft: [];
}>();

const confirming = ref(false);
const pending = ref(false);
const actionMessage = ref('');
const failed = ref(false);
const recovered = ref<Extract<DraftRecoveryResult, { readonly kind: 'recovered' }>>();
const recoveryTrigger = ref<HTMLButtonElement>();
const keepExisting = ref<HTMLButtonElement>();

const isRecoverable = computed(() => props.load.kind === 'malformed' || props.load.kind === 'schemaInvalid');
const problem = computed(() => props.load.kind === 'malformed'
  ? 'Malformed JSON'
  : 'Draft data does not match the supported schema');
const details = computed(() => props.load.kind === 'schemaInvalid'
  ? props.load.details
  : props.load.kind === 'malformed'
    ? [{ path: 'Draft data', message: props.load.detail.message }]
    : []);

function startConfirmation(): void {
  confirming.value = true;
  failed.value = false;
  actionMessage.value = '';
  void nextTick(() => keepExisting.value?.focus());
}

function cancelConfirmation(): void {
  confirming.value = false;
  void nextTick(() => recoveryTrigger.value?.focus());
}

async function reveal(): Promise<void> {
  actionMessage.value = '';
  try {
    const result = await props.revealDraftFile();
    actionMessage.value = result.kind === 'revealed'
      ? 'Draft file revealed in the system file browser.'
      : 'Could not reveal the draft file. Check the terminal details.';
  } catch {
    actionMessage.value = 'Could not reveal the draft file. Check the terminal details.';
  }
}

async function copyPath(path: string, label: string): Promise<void> {
  actionMessage.value = '';
  try {
    await navigator.clipboard.writeText(path);
    actionMessage.value = `${label} copied.`;
  } catch {
    actionMessage.value = `Could not copy the ${label.toLowerCase()}.`;
  }
}

async function recover(): Promise<void> {
  if (props.load.kind !== 'malformed' && props.load.kind !== 'schemaInvalid') {
    return;
  }

  pending.value = true;
  actionMessage.value = '';
  try {
    const result = await props.recoverDraft(props.load.fingerprint);
    if (result.kind === 'recovered') {
      recovered.value = result;
      confirming.value = false;
      emit('recovered', result);
      return;
    }
    failed.value = true;
    confirming.value = false;
  } catch {
    failed.value = true;
    confirming.value = false;
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <main class="draft-recovery" aria-labelledby="draft-recovery-heading" @keydown.escape="confirming ? cancelConfirmation() : undefined">
    <section v-if="recovered !== undefined" class="draft-recovery__card" aria-live="polite">
      <span class="draft-recovery__badge">Read only</span>
      <h1 id="draft-recovery-heading">New draft started</h1>
      <p>The original draft was preserved before the new empty draft was created.</p>
      <dl class="draft-recovery__details">
        <div>
          <dt>Backup file</dt>
          <dd>{{ recovered.backupPath }}</dd>
        </div>
      </dl>
      <div class="draft-recovery__actions">
        <button type="button" class="ui-button" @click="copyPath(recovered.backupPath, 'Backup path')">Copy backup path</button>
        <button type="button" class="ui-button ui-button--primary" @click="emit('openNewDraft')">Open new draft</button>
      </div>
    </section>

    <section v-else class="draft-recovery__card">
      <span class="draft-recovery__badge">Read only</span>
      <template v-if="isRecoverable">
        <h1 id="draft-recovery-heading">Local review draft needs recovery</h1>
        <p>Diff Review could not safely read this draft. The existing file has not been changed.</p>
      </template>
      <template v-else>
        <h1 id="draft-recovery-heading">This draft needs a newer Diff Review</h1>
        <p>Draft schema version {{ load.foundVersion }} is newer than supported version {{ load.supportedVersion }}. Upgrade Diff Review to open it. The file has not been changed.</p>
      </template>

      <dl class="draft-recovery__details">
        <div>
          <dt>Draft file</dt>
          <dd>{{ load.path }}</dd>
        </div>
        <template v-if="isRecoverable">
          <div>
            <dt>Problem</dt>
            <dd>{{ problem }}</dd>
          </div>
          <div v-for="detail in details" :key="`${detail.path}:${detail.message}`">
            <dt>{{ detail.path || 'Draft data' }}</dt>
            <dd>{{ detail.message }}</dd>
          </div>
        </template>
      </dl>

      <p v-if="actionMessage !== ''" class="draft-recovery__notice" role="status">{{ actionMessage }}</p>
      <template v-if="failed">
        <h2>Recovery did not complete</h2>
        <p class="draft-recovery__notice draft-recovery__notice--error" role="alert">The existing draft is still read only and has not been replaced. Check the terminal details, then try again.</p>
      </template>

      <div class="draft-recovery__actions">
        <button type="button" class="ui-button" :disabled="pending" @click="reveal">Reveal draft file</button>
        <button type="button" class="ui-button" :disabled="pending" @click="copyPath(load.path, 'Draft path')">Copy draft path</button>
        <button
          v-if="isRecoverable && !confirming"
          ref="recoveryTrigger"
          type="button"
          class="ui-button ui-button--destructive"
          :disabled="pending"
          @click="startConfirmation"
        >
          Back up and start new
        </button>
      </div>

      <section v-if="isRecoverable && confirming" class="draft-recovery__confirmation" aria-labelledby="draft-recovery-confirmation-heading">
        <h2 id="draft-recovery-confirmation-heading">Start a new draft?</h2>
        <p>Diff Review will first create and verify a byte-for-byte backup of {{ load.path }}. If the backup cannot be verified, the existing draft will not be replaced. The new draft will have no summary or comments.</p>
        <p>This action has no undo inside Diff Review.</p>
        <div class="draft-recovery__actions">
          <button ref="keepExisting" type="button" class="ui-button" :disabled="pending" @click="cancelConfirmation">Keep existing draft</button>
          <button type="button" class="ui-button ui-button--destructive" :disabled="pending" @click="recover">{{ pending ? 'Backing up existing draft…' : 'Back up and start new' }}</button>
        </div>
      </section>
    </section>
  </main>
</template>
