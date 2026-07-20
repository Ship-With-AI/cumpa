import {
  createPinnedComparison,
  type CreatePinnedComparisonOptions,
} from '../git/comparison.js';
import type { PinnedComparison } from '../contracts/comparison.js';

const notYetWiredMessage =
  'Diff Review production entry reached; local session launch is not wired yet.';

export async function createComparisonLaunchDescriptor(
  options: CreatePinnedComparisonOptions,
): Promise<PinnedComparison> {
  return await createPinnedComparison(options);
}

export function run(): Promise<void>;
export function run(
  options: CreatePinnedComparisonOptions,
): Promise<PinnedComparison>;
export async function run(
  options?: CreatePinnedComparisonOptions,
): Promise<void | PinnedComparison> {
  if (options !== undefined) {
    return await createComparisonLaunchDescriptor(options);
  }
  console.log(notYetWiredMessage);
}
