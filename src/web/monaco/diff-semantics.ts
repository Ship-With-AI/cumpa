import * as monaco from 'monaco-editor';

import type { DiffSide } from './line-mapping.js';

type LineRange = Readonly<{
  start: number;
  end: number;
}>;

function populatedRange(
  change: monaco.editor.ILineChange,
  side: DiffSide,
  modelLineCount: number,
): LineRange | undefined {
  const start = side === 'base'
    ? change.originalStartLineNumber
    : change.modifiedStartLineNumber;
  const end = side === 'base'
    ? change.originalEndLineNumber
    : change.modifiedEndLineNumber;

  if (end < start) {
    return undefined;
  }

  const clampedStart = Math.max(1, start);
  const clampedEnd = Math.min(modelLineCount, end);
  return clampedEnd < clampedStart ? undefined : { start: clampedStart, end: clampedEnd };
}

function mergeRanges(ranges: readonly LineRange[]): LineRange[] {
  const sortedRanges = [...ranges].sort((left, right) => left.start - right.start || left.end - right.end);
  const mergedRanges: LineRange[] = [];

  for (const range of sortedRanges) {
    const previous = mergedRanges.at(-1);
    if (previous === undefined || range.start > previous.end + 1) {
      mergedRanges.push(range);
      continue;
    }

    if (range.end > previous.end) {
      mergedRanges[mergedRanges.length - 1] = { start: previous.start, end: range.end };
    }
  }

  return mergedRanges;
}

/**
 * Converts Monaco-authoritative changed line ranges into non-interactive gutter decorations.
 */
export function buildDiffDecorations(
  changes: readonly monaco.editor.ILineChange[] | null,
  side: DiffSide,
  modelLineCount: number,
): monaco.editor.IModelDeltaDecoration[] {
  if (changes === null || changes.length === 0 || modelLineCount <= 0) {
    return [];
  }

  const ranges = mergeRanges(
    changes
      .map((change) => populatedRange(change, side, modelLineCount))
      .filter((range): range is LineRange => range !== undefined),
  );
  const suffix = side === 'base' ? 'base' : 'head';
  const decorations: monaco.editor.IModelDeltaDecoration[] = [];

  for (const range of ranges) {
    decorations.push({
      range: new monaco.Range(range.start, 1, range.end, 1),
      options: {
        isWholeLine: true,
        linesDecorationsClassName: `monaco-diff-change-bar--${suffix}`,
      },
    });
    decorations.push({
      range: new monaco.Range(range.start, 1, range.start, 1),
      options: {
        glyphMarginClassName: `monaco-diff-change-sign--${suffix}`,
      },
    });

    if (range.end - range.start >= 3) {
      decorations.push({
        range: new monaco.Range(range.end, 1, range.end, 1),
        options: {
          glyphMarginClassName: `monaco-diff-change-sign--${suffix}`,
        },
      });
    }
  }

  return decorations;
}
