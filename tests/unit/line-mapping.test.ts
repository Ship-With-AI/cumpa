import type * as monaco from 'monaco-editor';
import { describe, expect, it } from 'vitest';

import { counterpartBoundary } from '../../src/web/monaco/line-mapping.js';

describe('counterpartBoundary', () => {
  it('keeps unchanged boundaries aligned', () => {
    expect(counterpartBoundary(null, 'base', 4, 6)).toBe(4);
    expect(counterpartBoundary([], 'head', 9, 6)).toBe(6);
  });

  it('maps insertion boundaries without treating the inserted head lines as durable base anchors', () => {
    const insertion: monaco.editor.ILineChange[] = [{
      originalStartLineNumber: 4,
      originalEndLineNumber: 3,
      modifiedStartLineNumber: 4,
      modifiedEndLineNumber: 6,
      charChanges: [],
    }];

    expect(counterpartBoundary(insertion, 'base', 3, 8)).toBe(3);
    expect(counterpartBoundary(insertion, 'base', 4, 8)).toBe(7);
    expect(counterpartBoundary(insertion, 'head', 5, 5)).toBe(3);
    expect(counterpartBoundary(insertion, 'head', 7, 5)).toBe(4);
  });

  it('maps deletion boundaries without inventing a head-side counterpart line', () => {
    const deletion: monaco.editor.ILineChange[] = [{
      originalStartLineNumber: 2,
      originalEndLineNumber: 4,
      modifiedStartLineNumber: 2,
      modifiedEndLineNumber: 1,
      charChanges: [],
    }];

    expect(counterpartBoundary(deletion, 'base', 2, 4)).toBe(1);
    expect(counterpartBoundary(deletion, 'base', 5, 4)).toBe(2);
    expect(counterpartBoundary(deletion, 'head', 2, 7)).toBe(5);
  });

  it('uses the far boundary of a changed range while keeping following unchanged lines offset', () => {
    const change: monaco.editor.ILineChange[] = [{
      originalStartLineNumber: 3,
      originalEndLineNumber: 4,
      modifiedStartLineNumber: 3,
      modifiedEndLineNumber: 5,
      charChanges: [],
    }];

    expect(counterpartBoundary(change, 'base', 3, 8)).toBe(5);
    expect(counterpartBoundary(change, 'base', 5, 8)).toBe(6);
    expect(counterpartBoundary(change, 'head', 4, 7)).toBe(4);
    expect(counterpartBoundary(change, 'head', 6, 7)).toBe(5);
  });
});
