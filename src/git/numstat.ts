import type { ExactPath } from '../domain/path-bytes.js';
import type { RawDiffRecord } from './raw-diff.js';

export interface NumstatRecord {
  readonly additions: number | null;
  readonly deletions: number | null;
  readonly paths: readonly [ExactPath] | readonly [ExactPath, ExactPath];
}

export interface JoinedDiffStat {
  readonly diff: RawDiffRecord;
  readonly stats: NumstatRecord;
}

export function parseNumstat(_output: Buffer): readonly NumstatRecord[] {
  throw new Error('Numstat parsing is not implemented');
}

export function joinDiffStats(
  _diffRecords: readonly RawDiffRecord[],
  _statRecords: readonly NumstatRecord[],
): readonly JoinedDiffStat[] {
  throw new Error('Raw diff and numstat joining is not implemented');
}
