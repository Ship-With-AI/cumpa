<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import * as monaco from 'monaco-editor';

import { configureMonacoWorkers, languageForPath } from '../monaco/configure';

const BASE_A = `export function renderReview() {
  const title = 'Diff Review';
  const stable01 = 'one';
  const stable02 = 'two';
  const stable03 = 'three';
  const stable04 = 'four';
  const stable05 = 'five';
  const stable06 = 'six';
  const stable07 = 'seven';
  const stable08 = 'eight';
  const stable09 = 'nine';
  const stable10 = 'ten';
  const stable11 = 'eleven';
  const stable12 = 'twelve';
  const stable13 = 'thirteen';
  const stable14 = 'fourteen';
  const stable15 = 'fifteen';
  return title;
}`;
const HEAD_A = `export function renderReview() {
  const title = 'Diff Review';
  const stable01 = 'one';
  const stable02 = 'two';
  const stable03 = 'three';
  const stable04 = 'four';
  const stable05 = 'five';
  const stable06 = 'six';
  const stable07 = 'seven';
  const inserted = 'head only';
  const stable08 = 'eight';
  const stable09 = 'nine';
  const stable10 = 'ten changed';
  const stable11 = 'eleven';
  const stable12 = 'twelve';
  const stable13 = 'thirteen';
  const stable14 = 'fourteen';
  return title;
}`;

const host = ref<HTMLElement>();
const rendered = ref(false);
const updates = ref(0);
let diffEditor: monaco.editor.IStandaloneDiffEditor | undefined;
let originalModel: monaco.editor.ITextModel | undefined;
let modifiedModel: monaco.editor.ITextModel | undefined;
let updateListener: monaco.IDisposable | undefined;

function publishRedContract(): void {
  Object.assign(window, {
    __monacoStabilityPrototype: {
      rendered: rendered.value,
      language: originalModel?.getLanguageId() ?? 'plaintext',
      liveModels: originalModel === undefined || modifiedModel === undefined ? 0 : 2,
      diffUpdates: updates.value,
      pairedZones: 0,
      alignment: 'not-installed',
    },
  });
}

onMounted(() => {
  if (host.value === undefined) {
    return;
  }

  configureMonacoWorkers();
  diffEditor = monaco.editor.createDiffEditor(host.value, {
    ariaLabel: 'src/review.ts: base and head side-by-side diff',
    automaticLayout: false,
    glyphMargin: true,
    minimap: { enabled: false },
    originalEditable: false,
    readOnly: true,
    renderSideBySide: true,
    hideUnchangedRegions: {
      enabled: true,
      contextLineCount: 3,
      minimumLineCount: 8,
      revealLineCount: 10,
    },
  });
  originalModel = monaco.editor.createModel(
    BASE_A,
    languageForPath('src/review.ts'),
    monaco.Uri.parse('inmemory://monaco-stability/base/src/review.ts'),
  );
  modifiedModel = monaco.editor.createModel(
    HEAD_A,
    languageForPath('src/review.ts'),
    monaco.Uri.parse('inmemory://monaco-stability/head/src/review.ts'),
  );
  updateListener = diffEditor.onDidUpdateDiff(() => {
    updates.value += 1;
    rendered.value = true;
    publishRedContract();
  });
  diffEditor.setModel({ original: originalModel, modified: modifiedModel });
  diffEditor.layout();
  publishRedContract();
});

onBeforeUnmount(() => {
  updateListener?.dispose();
  diffEditor?.setModel(null);
  diffEditor?.dispose();
  originalModel?.dispose();
  modifiedModel?.dispose();
  diffEditor = undefined;
  originalModel = undefined;
  modifiedModel = undefined;
  updateListener = undefined;
});
</script>

<template>
  <main class="prototype" aria-label="Monaco stability prototype">
    <header>
      <h1>Monaco stability prototype</h1>
      <p data-testid="monaco-render-status" role="status">
        {{ rendered ? 'Rendered real Monaco' : 'Computing real Monaco diff…' }}
      </p>
    </header>
    <div ref="host" class="monaco-host" data-testid="monaco-host" />
  </main>
</template>

<style scoped>
.prototype {
  background: #f6f3ec;
  color: #242822;
  font-family: "Avenir Next", Avenir, "Segoe UI", sans-serif;
  min-height: 100dvh;
  padding: 16px;
}

h1 { font-size: 18px; margin: 0; }
p { margin: 4px 0 12px; }
.monaco-host { border: 1px solid #c9c2b5; height: calc(100dvh - 96px); min-height: 540px; }
</style>
