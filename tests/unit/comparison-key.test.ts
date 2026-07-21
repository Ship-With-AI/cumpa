import { describe, expect, test } from 'vitest';

import { comparisonKey } from '../../src/domain/comparison-key.js';

const sha1Base = 'a'.repeat(40);
const sha1Head = 'b'.repeat(40);
const sha256Base = 'c'.repeat(64);
const sha256Head = 'd'.repeat(64);

describe('comparisonKey', () => {
  test('is stable for identical opaque full selected endpoint OIDs', () => {
    expect(comparisonKey(sha1Base, sha1Head)).toBe(comparisonKey(sha1Base, sha1Head));
    expect(comparisonKey(sha1Base, sha1Head)).toMatch(/^[0-9a-f]{64}$/u);
    expect(comparisonKey(sha256Base, sha256Head)).toMatch(/^[0-9a-f]{64}$/u);
  });

  test('frames the ordered selected base and head identities independently', () => {
    const original = comparisonKey(sha1Base, sha1Head);

    expect(comparisonKey(sha1Head, sha1Base)).not.toBe(original);
    expect(comparisonKey('e'.repeat(40), sha1Head)).not.toBe(original);
    expect(comparisonKey(sha1Base, 'f'.repeat(40))).not.toBe(original);
  });

  test('does not derive comparison identity from labels, refs, paths, short IDs, or merge base', () => {
    const selectedBase = '0123456789abcdef0123456789abcdef01234567';
    const selectedHead = '89abcdef0123456789abcdef0123456789abcdef';

    expect(comparisonKey(selectedBase, selectedHead)).toBe(
      comparisonKey(selectedBase, selectedHead),
    );
    expect(comparisonKey(selectedBase, selectedHead)).not.toBe(
      comparisonKey(selectedBase.slice(0, 12), selectedHead),
    );
  });
});
