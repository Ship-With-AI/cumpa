import type { ExactPath } from '../domain/path-bytes.js';

export interface RawDiffRecord {
  readonly oldMode: string;
  readonly newMode: string;
  readonly oldBlobOid: string;
  readonly newBlobOid: string;
  readonly status: string;
  readonly similarity: number | null;
  readonly paths: readonly [ExactPath] | readonly [ExactPath, ExactPath];
}

export function parseRawDiff(_output: Buffer): readonly RawDiffRecord[] {
  throw new Error('Raw diff parsing is not implemented');
}
