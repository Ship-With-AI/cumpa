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
    })),
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
});
