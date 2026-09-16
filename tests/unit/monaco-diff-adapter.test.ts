import { resolve } from 'node:path';

import { canonicalRoot } from '../helpers/canonical-root.js';
import { resolveToken } from '../../src/web/theme/token-contract.js';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const disposable = () => ({ dispose: vi.fn() });
  const cursorListeners: Array<(event: { position: { lineNumber: number } }) => void> = [];
  const decorationCollection = () => ({ clear: vi.fn(), set: vi.fn() });
  const codeEditor = () => ({
    addAction: vi.fn(),
    changeViewZones: vi.fn((change) => change({
      addZone: vi.fn(() => 'zone'),
      layoutZone: vi.fn(),
      removeZone: vi.fn(),
    })),
    createDecorationsCollection: vi.fn(decorationCollection),
    focus: vi.fn(),
    getContainerDomNode: vi.fn(() => ({ classList: { add: vi.fn() } })),
    getPosition: vi.fn(() => null),
    getScrolledVisiblePosition: vi.fn(() => ({ top: 0 })),
    getScrollTop: vi.fn(() => 0),
    getSelections: vi.fn(() => []),
    getTopForLineNumber: vi.fn(() => 0),
    onDidChangeCursorSelection: vi.fn(disposable),
    onDidChangeModel: vi.fn(disposable),
    onDidFocusEditorText: vi.fn(disposable),
    onDidScrollChange: vi.fn(disposable),
    onDidChangeCursorPosition: vi.fn((listener) => {
      cursorListeners.push(listener);
      return disposable();
    }),
    onMouseMove: vi.fn(disposable),
    updateOptions: vi.fn(),
    onMouseDown: vi.fn(disposable),
    revealLineInCenter: vi.fn(),
    setPosition: vi.fn(),
  });
  const originalEditor = codeEditor();
  const modifiedEditor = codeEditor();
  const diffUpdateListeners: Array<() => void> = [];
  const diffEditor = {
    dispose: vi.fn(),
    getLineChanges: vi.fn(() => []),
    getModifiedEditor: vi.fn(() => modifiedEditor),
    getOriginalEditor: vi.fn(() => originalEditor),
    layout: vi.fn(),
    onDidUpdateDiff: vi.fn((listener: () => void) => {
      diffUpdateListeners.push(listener);
      return disposable();
    }),
    restoreViewState: vi.fn(),
    saveViewState: vi.fn(() => null),
    setModel: vi.fn(),
    updateOptions: vi.fn(),
  };
  return {
    createDiffEditor: vi.fn(() => diffEditor),
    createModel: vi.fn(() => ({
      dispose: vi.fn(),
      getLineCount: vi.fn(() => 20),
      getValueLength: vi.fn(() => 1),
      updateOptions: vi.fn(),
    })),
    originalEditor,
    modifiedEditor,
    defineTheme: vi.fn(),
    cursorListeners,
    diffUpdateListeners,
    parseUri: vi.fn((value: string) => value),
    setTheme: vi.fn(),
  };
});

vi.mock('monaco-editor', () => ({
  KeyCode: { Enter: 1 },
  KeyMod: { Alt: 1 },
  Range: class Range {},
  Uri: { parse: mocks.parseUri },
  editor: {
    createDiffEditor: mocks.createDiffEditor,
    createModel: mocks.createModel,
    defineTheme: mocks.defineTheme,
    setTheme: mocks.setTheme,
  },
}));

import { createMonacoDiffAdapter } from '../../src/web/monaco/diff-adapter.js';

describe('PublicMonacoDiffAdapter construction', () => {
  it('defines and selects the stable theme before constructing a diff editor', () => {
    createMonacoDiffAdapter({} as HTMLElement, () => 'typescript', vi.fn());

    expect(mocks.defineTheme).toHaveBeenCalledOnce();
    expect(mocks.setTheme).toHaveBeenCalledOnce();
    expect(mocks.createDiffEditor).toHaveBeenCalledOnce();
    expect(mocks.defineTheme.mock.invocationCallOrder[0]).toBeLessThan(mocks.setTheme.mock.invocationCallOrder[0]);
    expect(mocks.setTheme.mock.invocationCallOrder[0]).toBeLessThan(mocks.createDiffEditor.mock.invocationCallOrder[0]);
  });

  it('derives diff-editor code typography from the canonical root', () => {
    const tokens = canonicalRoot(resolve(import.meta.dirname, '../..'));

    createMonacoDiffAdapter({} as HTMLElement, () => 'typescript', vi.fn());

    expect(mocks.createDiffEditor).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        fontFamily: resolveToken(tokens, '--font-mono'),
        fontSize: Number.parseInt(resolveToken(tokens, '--font-size-code'), 10),
        lineHeight: Number.parseInt(resolveToken(tokens, '--line-height-code'), 10),
      }),
    );
  });

  it('updates Monaco aria label with source-correct side names', () => {
    const adapter = createMonacoDiffAdapter({} as HTMLElement, () => 'typescript', vi.fn());

    adapter.setSideNames({ original: 'preimage', modified: 'postimage' });

    const options = { ariaLabel: 'Immutable preimage and postimage side-by-side diff' };
    expect(mocks.originalEditor.updateOptions).toHaveBeenCalledWith(options);
    expect(mocks.modifiedEditor.updateOptions).toHaveBeenCalledWith(options);
  });

  it('updates Monaco code typography for each responsive density', () => {
    const tokens = canonicalRoot(resolve(import.meta.dirname, '../..'));
    const adapter = createMonacoDiffAdapter({} as HTMLElement, () => 'typescript', vi.fn());
    const updateOptions = mocks.createDiffEditor.mock.results.at(-1)?.value.updateOptions;

    adapter.setCodeDensity('wide');
    adapter.setCodeDensity('compact');
    adapter.setCodeDensity('default');

    expect(updateOptions).toHaveBeenNthCalledWith(1, {
      fontSize: Number.parseInt(resolveToken(tokens, '--font-size-body'), 10),
      lineHeight: Number.parseInt(resolveToken(tokens, '--font-size-body'), 10) * 2,
    });
    expect(updateOptions).toHaveBeenNthCalledWith(2, {
      fontSize: Number.parseInt(resolveToken(tokens, '--font-size-metadata'), 10),
      lineHeight: Number.parseInt(resolveToken(tokens, '--font-size-metadata'), 10) * 2,
    });
    expect(updateOptions).toHaveBeenNthCalledWith(3, {
      fontSize: Number.parseInt(resolveToken(tokens, '--font-size-code'), 10),
      lineHeight: Number.parseInt(resolveToken(tokens, '--line-height-code'), 10),
    });
  });
  it('pins the immutable side-by-side review surface options', () => {
    createMonacoDiffAdapter({} as HTMLElement, () => 'typescript', vi.fn());

    expect(mocks.createDiffEditor).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        diffAlgorithm: 'advanced',
        diffWordWrap: 'off',
        readOnly: true,
        renderGutterMenu: false,
        renderMarginRevertIcon: false,
        renderSideBySide: true,
        renderSideBySideInlineBreakpoint: 0,
        useInlineViewWhenSpaceIsLimited: false,
      }),
    );
  });

  it('keeps an anchor activated while its file is finishing its first diff', async () => {
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({ className: '', setAttribute: vi.fn() })),
    });
    try {
      mocks.diffUpdateListeners.length = 0;
      const adapter = createMonacoDiffAdapter({ offsetTop: 0 } as HTMLElement, () => 'typescript', vi.fn());
      const loading = adapter.setFile({
        id: 'file_a',
        base: { path: 'src/example.ts', text: 'const base = 1;' },
        head: { path: 'src/example.ts', text: 'const head = 2;' },
      });

      adapter.activateAnchor('head', 10);
      const finishInitialDiff = mocks.diffUpdateListeners.at(-1);
      if (finishInitialDiff === undefined) throw new Error('expected pending initial diff listener');
      finishInitialDiff();

      await loading;

      expect(adapter.getActiveAnchor()).toEqual({ fileId: 'file_a', side: 'head', line: 10 });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('restores saved focus independently from saved composer', async () => {
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({ className: '', setAttribute: vi.fn() })),
    });
    try {
      mocks.diffUpdateListeners.length = 0;
      mocks.cursorListeners.length = 0;
      const adapter = createMonacoDiffAdapter({ offsetTop: 0 } as HTMLElement, () => 'typescript', vi.fn());
      const fileA = {
        id: 'file_a',
        base: { path: 'src/example.ts', text: 'const base = 1;' },
        head: { path: 'src/example.ts', text: 'const head = 2;' },
      };
      const loadingA = adapter.setFile(fileA);
      const finishA = mocks.diffUpdateListeners.at(-1);
      if (finishA === undefined) throw new Error('expected file A diff listener');
      finishA();
      await loadingA;
      adapter.activateAnchor('base', 10);
      const captureHeadCursor = mocks.cursorListeners.at(-1);
      if (captureHeadCursor === undefined) throw new Error('expected head cursor listener');
      captureHeadCursor({ position: { lineNumber: 11 } });

      const loadingB = adapter.setFile({
        id: 'file_b',
        base: { path: 'src/other.ts', text: 'const otherBase = 1;' },
        head: { path: 'src/other.ts', text: 'const otherHead = 2;' },
      });
      const finishB = mocks.diffUpdateListeners.at(-1);
      if (finishB === undefined) throw new Error('expected file B diff listener');
      finishB();
      await loadingB;

      const restoringA = adapter.setFile(fileA);
      const finishRestoringA = mocks.diffUpdateListeners.at(-1);
      if (finishRestoringA === undefined) throw new Error('expected restored file A diff listener');
      finishRestoringA();
      await restoringA;

      expect(adapter.getActiveAnchor()).toEqual({ fileId: 'file_a', side: 'base', line: 10 });
      expect(mocks.modifiedEditor.setPosition).toHaveBeenLastCalledWith({ lineNumber: 11, column: 1 });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
