import { resolve } from 'node:path';

import { canonicalRoot } from '../helpers/canonical-root.js';
import { resolveToken } from '../../src/web/theme/token-contract.js';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const disposable = () => ({ dispose: vi.fn() });
  const decorationCollection = () => ({ clear: vi.fn(), set: vi.fn() });
  const codeEditor = () => ({
    addAction: vi.fn(),
    createDecorationsCollection: vi.fn(decorationCollection),
    getContainerDomNode: vi.fn(() => ({ classList: { add: vi.fn() } })),
    onDidChangeCursorPosition: vi.fn(disposable),
    onDidChangeCursorSelection: vi.fn(disposable),
    onDidChangeModel: vi.fn(disposable),
    onDidFocusEditorText: vi.fn(disposable),
    onDidScrollChange: vi.fn(disposable),
    onMouseDown: vi.fn(disposable),
    onMouseMove: vi.fn(disposable),
    updateOptions: vi.fn(),
  });
  const originalEditor = codeEditor();
  const modifiedEditor = codeEditor();
  return {
    createDiffEditor: vi.fn(() => ({
      dispose: vi.fn(),
      getLineChanges: vi.fn(() => []),
      getModifiedEditor: vi.fn(() => modifiedEditor),
      getOriginalEditor: vi.fn(() => originalEditor),
      onDidUpdateDiff: vi.fn(disposable),
      updateOptions: vi.fn(),
    })),
    originalEditor,
    modifiedEditor,
    defineTheme: vi.fn(),
    setTheme: vi.fn(),
  };
});

vi.mock('monaco-editor', () => ({
  KeyCode: { Enter: 1 },
  KeyMod: { Alt: 1 },
  Range: class Range {},
  editor: {
    createDiffEditor: mocks.createDiffEditor,
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
});
