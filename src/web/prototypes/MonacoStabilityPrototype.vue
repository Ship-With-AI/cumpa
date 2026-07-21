<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import {
  createMonacoDiffAdapter,
  type MonacoDiffAdapter,
  type ImmutableDiffFile,
} from '../monaco/diff-adapter';
import { configureMonacoWorkers, languageForPath } from '../monaco/configure';

const FILES: readonly ImmutableDiffFile[] = [
  {
    id: 'fixture-a',
    base: {
      path: 'src/review.ts',
      text: `export function renderReview() {
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
}`,
    },
    head: {
      path: 'src/review.ts',
      text: `export function renderReview() {
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
}`,
    },
  },
  {
    id: 'fixture-b',
    base: {
      path: 'config/review.json',
      text: `{
  "name": "diff-review",
  "stable01": true,
  "stable02": true,
  "stable03": true,
  "stable04": true,
  "stable05": true,
  "stable06": true,
  "stable07": true,
  "stable08": true,
  "stable09": true,
  "stable10": true,
  "stable11": true,
  "stable12": true,
  "stable13": true,
  "stable14": true,
  "stable15": true,
  "obsolete": "base only"
}`,
    },
    head: {
      path: 'config/review.json',
      text: `{
  "name": "diff-review",
  "stable01": true,
  "stable02": true,
  "stable03": true,
  "stable04": true,
  "stable05": true,
  "stable06": true,
  "stable07": true,
  "stable08": true,
  "inserted": "head only",
  "stable09": true,
  "stable10": "changed",
  "stable11": true,
  "stable12": true,
  "stable13": true,
  "stable14": true
}`,
    },
  },
];

const host = ref<HTMLElement>();
const currentFileIndex = ref(0);
const rendered = ref(false);
const updateVersion = ref(0);
const currentFile = computed(() => FILES[currentFileIndex.value]);
let adapter: MonacoDiffAdapter | undefined;
let resizeObserver: ResizeObserver | undefined;

function publishContract(): void {
  const diagnostics = adapter?.getDiagnostics();
  Object.assign(window, {
    __monacoStabilityPrototype: {
      rendered: rendered.value,
      language: languageForPath(currentFile.value.head.path),
      fileId: currentFile.value.id,
      diffUpdates: diagnostics?.diffUpdates ?? 0,
      liveModels: diagnostics?.liveModels ?? 0,
      listenerCount: diagnostics?.listenerCount ?? 0,
      pairedZones: diagnostics?.pairedZoneCount ?? 0,
      activeComposers: diagnostics?.activeComposerCount ?? 0,
      contextMode: diagnostics?.contextMode ?? 'collapsed',
    },
  });
}

async function selectFile(index: number): Promise<void> {
  currentFileIndex.value = index;
  await adapter?.setFile(currentFile.value);
  rendered.value = true;
  updateVersion.value += 1;
  publishContract();
}

function addComment(side: 'base' | 'head'): void {
  adapter?.activateAnchor(side, side === 'base' ? 10 : 11);
  updateVersion.value += 1;
  publishContract();
}

function showHiddenComment(): void {
  adapter?.revealAnchor({
    fileId: currentFile.value.id,
    side: 'head',
    line: 5,
  });
  updateVersion.value += 1;
  publishContract();
}

function navigateChange(direction: 'next' | 'previous'): void {
  adapter?.goToChange(direction);
}

async function stressRecompute(): Promise<void> {
  const initialIndex = currentFileIndex.value;
  for (let iteration = 0; iteration < 10; iteration += 1) {
    await selectFile(iteration % 2 === 0 ? 1 - initialIndex : initialIndex);
  }
  await selectFile(initialIndex);
}

onMounted(async () => {
  if (host.value === undefined) {
    return;
  }
  configureMonacoWorkers();
  adapter = createMonacoDiffAdapter(host.value, languageForPath, () => {
    rendered.value = true;
    updateVersion.value += 1;
    publishContract();
  });
  resizeObserver = new ResizeObserver(() => adapter?.layout());
  resizeObserver.observe(host.value);
  await selectFile(0);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  adapter?.dispose();
  adapter = undefined;
});
</script>

<template>
  <main class="prototype" aria-label="Monaco stability prototype">
    <header>
      <h1>Monaco stability prototype</h1>
      <p data-testid="monaco-render-status" role="status">
        {{ rendered ? 'Rendered real Monaco' : 'Computing real Monaco diff…' }}
      </p>
      <p data-testid="monaco-metrics" :data-version="updateVersion">
        {{ currentFile.id }} · {{ languageForPath(currentFile.head.path) }}
      </p>
      <nav aria-label="Prototype navigation">
        <button type="button" :disabled="currentFileIndex === 0" @click="selectFile(0)">Previous file</button>
        <button type="button" :disabled="currentFileIndex === FILES.length - 1" @click="selectFile(1)">Next file</button>
        <button type="button" title="Previous change · Shift+F7" @click="navigateChange('previous')">Previous change</button>
        <button type="button" title="Next change · F7" @click="navigateChange('next')">Next change</button>
        <button type="button" @click="addComment('base')">Add base comment</button>
        <button type="button" @click="addComment('head')">Add head comment</button>
        <button type="button" @click="showHiddenComment">Show hidden comment</button>
        <button type="button" @click="stressRecompute">Recompute 10 times</button>
      </nav>
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
p { margin: 4px 0; }
nav { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
button { min-height: 32px; }
.monaco-host { border: 1px solid #c9c2b5; height: calc(100dvh - 164px); min-height: 500px; }
</style>
