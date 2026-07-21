import type * as monaco from 'monaco-editor';

export type DiffSide = 'base' | 'head';


function clampBoundary(line: number, maximum: number): number {
  return Math.max(0, Math.min(line, maximum));
}

/**
 * Maps a model-line boundary to its public diff counterpart for paired layout only.
 * The returned value is an `afterLineNumber`, never a durable anchor identity.
 */
export function counterpartBoundary(
  changes: readonly monaco.editor.ILineChange[] | null,
  side: DiffSide,
  line: number,
  counterpartLineCount: number,
): number {
  if (changes === null || changes.length === 0) {
    return clampBoundary(line, counterpartLineCount);
  }

  let accumulatedDelta = 0;
  for (const change of changes) {
    const sourceStart = side === 'base'
      ? change.originalStartLineNumber
      : change.modifiedStartLineNumber;
    const sourceEnd = side === 'base'
      ? change.originalEndLineNumber
      : change.modifiedEndLineNumber;
    const targetStart = side === 'base'
      ? change.modifiedStartLineNumber
      : change.originalStartLineNumber;
    const targetEnd = side === 'base'
      ? change.modifiedEndLineNumber
      : change.originalEndLineNumber;
    const sourceLines = sourceEnd < sourceStart ? 0 : sourceEnd - sourceStart + 1;
    const targetLines = targetEnd < targetStart ? 0 : targetEnd - targetStart + 1;
    const sourceBoundaryBeforeChange = sourceStart - 1;

    if (line <= sourceBoundaryBeforeChange) {
      return clampBoundary(line + accumulatedDelta, counterpartLineCount);
    }
    if (sourceLines > 0 && line <= sourceEnd) {
      return clampBoundary(targetLines === 0 ? targetStart - 1 : targetEnd, counterpartLineCount);
    }

    accumulatedDelta += targetLines - sourceLines;
  }

  return clampBoundary(line + accumulatedDelta, counterpartLineCount);
}
