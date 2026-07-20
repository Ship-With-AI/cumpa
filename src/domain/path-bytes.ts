export interface ExactPath {
  readonly bytesBase64url: string;
  readonly display: string;
  readonly utf8?: string;
}

export function createExactPath(_bytes: Uint8Array): ExactPath {
  throw new Error('Exact path byte identity is not implemented');
}

export function compareExactPaths(_left: ExactPath, _right: ExactPath): number {
  throw new Error('Exact path byte comparison is not implemented');
}
