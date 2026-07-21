import type { ExactPathDto } from '../contracts/comparison.js';

export type AnchorSide = 'base' | 'head';

export type DurableAnchorV1 = Readonly<{
  readonly version: 'durable-anchor-v1';
  readonly path: ExactPathDto;
  readonly safeDisplayPath: string;
  readonly side: AnchorSide;
  readonly line: number;
  readonly blobOid: string;
  readonly selectedText: string;
  readonly context: Readonly<{
    readonly before: readonly Readonly<{ readonly line: number; readonly text: string }>[];
    readonly target: Readonly<{ readonly line: number; readonly text: string }>;
    readonly after: readonly Readonly<{ readonly line: number; readonly text: string }>[];
  }>;
  readonly contextHash: Readonly<{ readonly algorithm: 'sha256-v1'; readonly value: string }>;
  readonly uniqueKey: string;
}>;

export type AnchorVerification = Readonly<{
  readonly state: 'verified' | 'stale' | 'orphaned';
  readonly reason: 'exact-match' | 'anchor-mismatch' | 'anchor-unavailable';
}>;

export function buildDurableAnchor(_input: {
  readonly path: ExactPathDto;
  readonly safeDisplayPath: string;
  readonly side: AnchorSide;
  readonly blobOid: string;
  readonly line: number;
  readonly text: string;
}): DurableAnchorV1 {
  throw new Error('Canonical durable anchor construction is not implemented.');
}

export function verifyDurableAnchor(
  _recorded: DurableAnchorV1,
  _current: DurableAnchorV1 | undefined,
): AnchorVerification {
  throw new Error('Canonical durable anchor verification is not implemented.');
}
