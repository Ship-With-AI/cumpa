import type { GitRunner } from './runner.js';

export type ObjectMetadata =
  | {
      readonly kind: 'available';
      readonly objectType: string;
      readonly size: number;
    }
  | { readonly kind: 'missing' };

export type ObjectContent =
  | { readonly kind: 'available'; readonly bytes: Buffer }
  | { readonly kind: 'missing' };

export interface ObjectReadOptions {
  readonly maxBytes: number;
  readonly signal?: AbortSignal;
}

export interface ObjectReader {
  inspect(oid: string, signal?: AbortSignal): Promise<ObjectMetadata>;
  read(oid: string, options: ObjectReadOptions): Promise<ObjectContent>;
}

export interface CreateObjectReaderDependencies {
  readonly runner?: GitRunner;
}

export function createObjectReader(
  _repositoryRoot: string,
  _dependencies: CreateObjectReaderDependencies = {},
): ObjectReader {
  throw new Error('Immutable object reading is not implemented');
}
