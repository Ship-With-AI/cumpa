import { describe, expect, test } from 'vitest';

import type { ExactPathDto } from '../../src/contracts/comparison.js';
import {
  buildDurableAnchor,
  verifyDurableAnchor,
} from '../../src/domain/anchor.js';

function path(value: string): ExactPathDto {
  return {
    bytesBase64url: Buffer.from(value, 'utf8').toString('base64url'),
    display: value.replaceAll('\n', '\\n').replaceAll('\r', '\\r'),
    utf8: value,
  };
}

describe('canonical side-specific anchors', () => {
  test('derives exact model-line text and bounded numbered context across line endings', () => {
    const anchor = buildDurableAnchor({
      path: path('src/\u03b4\nname.ts'),
      safeDisplayPath: 'src/\u03b4\\nname.ts',
      side: 'base',
      blobOid: 'a'.repeat(40),
      line: 4,
      text: 'first\r\n\r\nthird\r\nselected\r\nfifth\r\nsixth\r\nseventh',
    });

    expect(anchor.selectedText).toBe('selected');
    expect(anchor.context).toEqual({
      before: [
        { line: 1, text: 'first' },
        { line: 2, text: '' },
        { line: 3, text: 'third' },
      ],
      target: { line: 4, text: 'selected' },
      after: [
        { line: 5, text: 'fifth' },
        { line: 6, text: 'sixth' },
        { line: 7, text: 'seventh' },
      ],
    });
    expect(anchor.contextHash).toEqual({
      algorithm: 'sha256-v1',
      value: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
  });

  test('preserves first, last, only, blank, empty, and no-final-newline model lines', () => {
    const cases = [
      { text: 'first\nlast', line: 1, selected: 'first', before: 0, after: 1 },
      { text: 'first\nlast', line: 2, selected: 'last', before: 1, after: 0 },
      { text: 'only', line: 1, selected: 'only', before: 0, after: 0 },
      { text: '', line: 1, selected: '', before: 0, after: 0 },
      { text: 'one\n\nthree\nfour', line: 2, selected: '', before: 1, after: 2 },
    ] as const;

    for (const entry of cases) {
      const anchor = buildDurableAnchor({
        path: path('line-boundary.txt'),
        safeDisplayPath: 'line-boundary.txt',
        side: 'head',
        blobOid: 'b'.repeat(64),
        line: entry.line,
        text: entry.text,
      });
      expect(anchor.selectedText).toBe(entry.selected);
      expect(anchor.context.before).toHaveLength(entry.before);
      expect(anchor.context.after).toHaveLength(entry.after);
    }
  });

  test('uses framed lossless bytes, opaque oid lengths, and side in deterministic hashes and duplicate keys', () => {
    const common = {
      path: path('odd\u0000\u03c0\npath.ts'),
      safeDisplayPath: 'odd\\u{00}\u03c0\\npath.ts',
      blobOid: 'c'.repeat(64),
      line: 1,
      text: 'same',
    } as const;
    const base = buildDurableAnchor({ ...common, side: 'base' });
    const repeated = buildDurableAnchor({ ...common, side: 'base' });
    const head = buildDurableAnchor({ ...common, side: 'head' });
    const sha1 = buildDurableAnchor({ ...common, side: 'base', blobOid: 'd'.repeat(40) });

    expect(repeated).toEqual(base);
    expect(head.contextHash.value).not.toBe(base.contextHash.value);
    expect(head.uniqueKey).not.toBe(base.uniqueKey);
    expect(sha1.uniqueKey).not.toBe(base.uniqueKey);
  });

  test('classifies exact verification without changing the stored anchor or relocating it', () => {
    const recorded = buildDurableAnchor({
      path: path('old-name.ts'),
      safeDisplayPath: 'old-name.ts',
      side: 'base',
      blobOid: 'e'.repeat(40),
      line: 2,
      text: 'first\nneedle\nlast',
    });
    const frozenRecord = structuredClone(recorded);
    const exact = buildDurableAnchor({
      path: path('old-name.ts'),
      safeDisplayPath: 'old-name.ts',
      side: 'base',
      blobOid: 'e'.repeat(40),
      line: 2,
      text: 'first\nneedle\nlast',
    });
    const movedNeedle = buildDurableAnchor({
      path: path('old-name.ts'),
      safeDisplayPath: 'old-name.ts',
      side: 'base',
      blobOid: 'e'.repeat(40),
      line: 2,
      text: 'first\ninserted\nneedle\nlast',
    });

    expect(verifyDurableAnchor(recorded, exact)).toMatchObject({ state: 'verified' });
    expect(verifyDurableAnchor(recorded, movedNeedle)).toMatchObject({ state: 'stale' });
    expect(verifyDurableAnchor(recorded, undefined)).toMatchObject({ state: 'orphaned' });
    expect(recorded).toEqual(frozenRecord);
    expect(recorded.line).toBe(2);
  });
});
