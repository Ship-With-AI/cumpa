import type * as monaco from 'monaco-editor';
import { describe, expect, it, vi } from 'vitest';

const { Range } = vi.hoisted(() => ({
  Range: class {
    constructor(
      readonly startLineNumber: number,
      readonly startColumn: number,
      readonly endLineNumber: number,
      readonly endColumn: number,
    ) {}
  },
}));

vi.mock('monaco-editor', () => ({ Range }));

import { buildDiffDecorations } from '../../src/web/monaco/diff-semantics.js';

function change(
  originalStartLineNumber: number,
  originalEndLineNumber: number,
  modifiedStartLineNumber = originalStartLineNumber,
  modifiedEndLineNumber = originalEndLineNumber,
): monaco.editor.ILineChange {
  return {
    originalStartLineNumber,
    originalEndLineNumber,
    modifiedStartLineNumber,
    modifiedEndLineNumber,
    charChanges: [],
  };
}

function observableDecorations(
  decorations: readonly monaco.editor.IModelDeltaDecoration[],
): Array<{
  range: readonly [number, number];
  bar: string | null | undefined;
  sign: string | null | undefined;
  optionKeys: string[];
}> {
  return decorations.map(({ range, options }) => ({
    range: [range.startLineNumber, range.endLineNumber],
    bar: options.linesDecorationsClassName,
    sign: options.glyphMarginClassName,
    optionKeys: Object.keys(options).sort(),
  }));
}

describe('buildDiffDecorations', () => {
  it('returns no decorations for absent changes or a non-positive model line count', () => {
    expect(buildDiffDecorations(null, 'base', 4)).toEqual([]);
    expect(buildDiffDecorations([], 'head', 4)).toEqual([]);
    expect(buildDiffDecorations([change(1, 1)], 'base', 0)).toEqual([]);
  });

  it('uses side-owned fixed bar and sign classes for valid contiguous blocks', () => {
    expect(observableDecorations(buildDiffDecorations([change(2, 4, 6, 8)], 'base', 10))).toEqual([
      {
        range: [2, 4],
        bar: 'monaco-diff-change-bar--base',
        sign: undefined,
        optionKeys: ['isWholeLine', 'linesDecorationsClassName'],
      },
      {
        range: [2, 2],
        bar: undefined,
        sign: 'monaco-diff-change-sign--base',
        optionKeys: ['glyphMarginClassName'],
      },
    ]);

    expect(observableDecorations(buildDiffDecorations([change(2, 4, 6, 8)], 'head', 10))).toEqual([
      {
        range: [6, 8],
        bar: 'monaco-diff-change-bar--head',
        sign: undefined,
        optionKeys: ['isWholeLine', 'linesDecorationsClassName'],
      },
      {
        range: [6, 6],
        bar: undefined,
        sign: 'monaco-diff-change-sign--head',
        optionKeys: ['glyphMarginClassName'],
      },
    ]);
  });

  it('decorates only the populated side of exact insertion and deletion fixtures', () => {
    const insertion = change(4, 3, 4, 6);
    const deletion = change(2, 4, 2, 1);

    expect(buildDiffDecorations([insertion], 'base', 8)).toEqual([]);
    expect(observableDecorations(buildDiffDecorations([insertion], 'head', 8))).toEqual([
      {
        range: [4, 6],
        bar: 'monaco-diff-change-bar--head',
        sign: undefined,
        optionKeys: ['isWholeLine', 'linesDecorationsClassName'],
      },
      {
        range: [4, 4],
        bar: undefined,
        sign: 'monaco-diff-change-sign--head',
        optionKeys: ['glyphMarginClassName'],
      },
    ]);
    expect(observableDecorations(buildDiffDecorations([deletion], 'base', 8))).toEqual([
      {
        range: [2, 4],
        bar: 'monaco-diff-change-bar--base',
        sign: undefined,
        optionKeys: ['isWholeLine', 'linesDecorationsClassName'],
      },
      {
        range: [2, 2],
        bar: undefined,
        sign: 'monaco-diff-change-sign--base',
        optionKeys: ['glyphMarginClassName'],
      },
    ]);
    expect(buildDiffDecorations([deletion], 'head', 8)).toEqual([]);
  });

  it('places endpoint signs only for blocks of four or more lines', () => {
    expect(observableDecorations(buildDiffDecorations([change(3, 3)], 'base', 8))).toHaveLength(2);
    expect(observableDecorations(buildDiffDecorations([change(3, 5)], 'base', 8))).toHaveLength(2);
    expect(observableDecorations(buildDiffDecorations([change(3, 6)], 'base', 8))).toEqual([
      {
        range: [3, 6],
        bar: 'monaco-diff-change-bar--base',
        sign: undefined,
        optionKeys: ['isWholeLine', 'linesDecorationsClassName'],
      },
      {
        range: [3, 3],
        bar: undefined,
        sign: 'monaco-diff-change-sign--base',
        optionKeys: ['glyphMarginClassName'],
      },
      {
        range: [6, 6],
        bar: undefined,
        sign: 'monaco-diff-change-sign--base',
        optionKeys: ['glyphMarginClassName'],
      },
    ]);
  });

  it('merges touching and overlapping populated ranges before deciding marker density', () => {
    const changes = [change(3, 4), change(5, 6), change(6, 8)];

    expect(observableDecorations(buildDiffDecorations(changes, 'base', 10))).toEqual([
      {
        range: [3, 8],
        bar: 'monaco-diff-change-bar--base',
        sign: undefined,
        optionKeys: ['isWholeLine', 'linesDecorationsClassName'],
      },
      {
        range: [3, 3],
        bar: undefined,
        sign: 'monaco-diff-change-sign--base',
        optionKeys: ['glyphMarginClassName'],
      },
      {
        range: [8, 8],
        bar: undefined,
        sign: 'monaco-diff-change-sign--base',
        optionKeys: ['glyphMarginClassName'],
      },
    ]);
  });

  it('clamps populated ranges to immutable model bounds and discards ranges empty after clamping', () => {
    const changes = [change(-4, 2), change(6, 14), change(-8, -2)];
    const decorations = buildDiffDecorations(changes, 'base', 7);

    expect(observableDecorations(decorations)).toEqual([
      {
        range: [1, 2],
        bar: 'monaco-diff-change-bar--base',
        sign: undefined,
        optionKeys: ['isWholeLine', 'linesDecorationsClassName'],
      },
      {
        range: [1, 1],
        bar: undefined,
        sign: 'monaco-diff-change-sign--base',
        optionKeys: ['glyphMarginClassName'],
      },
      {
        range: [6, 7],
        bar: 'monaco-diff-change-bar--base',
        sign: undefined,
        optionKeys: ['isWholeLine', 'linesDecorationsClassName'],
      },
      {
        range: [6, 6],
        bar: undefined,
        sign: 'monaco-diff-change-sign--base',
        optionKeys: ['glyphMarginClassName'],
      },
    ]);
    expect(decorations.every(({ range }) => range.startLineNumber >= 1 && range.endLineNumber <= 7)).toBe(true);
    expect(observableDecorations(buildDiffDecorations(changes, 'base', 7))).toEqual(observableDecorations(decorations));
  });
});
