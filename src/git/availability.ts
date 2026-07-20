import type { ChangedFile } from '../contracts/comparison.js';
import type { ObjectReader } from './objects.js';

export const MAX_INLINE_TEXT_BYTES = 1_048_576;

export type UnsupportedAvailabilityReason =
  | 'binary'
  | 'mode-or-type'
  | 'non-utf8'
  | 'oversized'
  | 'submodule'
  | 'symlink';

export type Availability =
  | { readonly kind: 'text' }
  | {
      readonly kind: 'unsupported';
      readonly reason: UnsupportedAvailabilityReason;
    }
  | { readonly kind: 'unavailable'; readonly reason: 'missing-object' };

export type AvailabilityInput = Pick<
  ChangedFile,
  | 'additions'
  | 'deletions'
  | 'newBlobOid'
  | 'newMode'
  | 'oldBlobOid'
  | 'oldMode'
  | 'status'
>;

export async function classifyAvailability(
  _file: AvailabilityInput,
  _objectReader: ObjectReader,
  _signal?: AbortSignal,
): Promise<Availability> {
  throw new Error('Availability classification is not implemented');
}
