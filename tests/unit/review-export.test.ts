import { describe, expect, test } from 'vitest';

import { ReviewExportV1Schema } from '../../src/contracts/draft.js';
import {
  buildReviewExportV1,
  canonicalizeReviewExport,
  hashExportBytes,
  parseCanonicalReviewExport,
} from '../../src/export/review-export.js';

const oid = 'a'.repeat(40);
const commentId = 'comment_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function path(utf8: string) {
  return {
    bytesBase64url: btoa(utf8).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, ''),
    display: utf8,
    utf8,
  };
}

function comment(overrides: Record<string, unknown> = {}) {
  return {
    id: commentId,
    state: 'open' as const,
    body: 'Please make this explicit.',
    createdAt: '2026-07-23T08:00:00.000Z',
    updatedAt: '2026-07-23T08:00:00.000Z',
    anchor: {
      version: 'durable-anchor-v1' as const,
      path: path('src/a.ts'),
      safeDisplayPath: 'src/a.ts',
      side: 'head' as const,
      line: 7,
      blobOid: oid,
      selectedText: 'const answer = 41;',
      context: {
        before: [{ line: 6, text: 'export function answer() {' }],
        target: { line: 7, text: 'const answer = 41;' },
        after: [{ line: 8, text: 'return answer;' }],
      },
      contextHash: { algorithm: 'sha256-v1' as const, value: 'b'.repeat(64) },
      uniqueKey: 'c'.repeat(64),
    },
    ...overrides,
  };
}

function snapshot(comments = [comment()]) {
  return {
    acceptedDraft: {
      schemaVersion: 1 as const,
      comparison: { baseCommitOid: oid, headCommitOid: oid, mergeBaseOid: oid },
      revision: 4,
      summary: '',
      comments,
    },
    comparison: {
      selectedBase: { label: 'main', launchOid: oid },
      selectedHead: { label: 'topic', launchOid: oid },
      mergeBaseOid: oid,
      comparisonKey: 'comparison_'.concat('d'.repeat(64)),
    },
    drift: {
      observedAt: '2026-07-23T08:01:00.000Z',
      acknowledged: false,
      base: { launchOid: oid, currentOid: oid, status: 'unchanged' as const },
      head: { launchOid: oid, currentOid: oid, status: 'unchanged' as const },
    },
  };
}

describe('ReviewExportV1 canonical contract', () => {
  test('maps the accepted draft once, preserves every identity, and rejects unknown or invalid data', () => {
    const document = buildReviewExportV1(snapshot(), '2026-07-23T08:02:00.000Z');

    expect(document).toMatchObject({
      schemaVersion: 1,
      kind: 'diff-review/export',
      acceptedDraftRevision: 4,
      summary: { markdown: null },
      counts: { all: 1, openActionable: 1, openNeedsAttention: 0, resolved: 0 },
    });
    expect(document.files[0]?.comments[0]?.anchor.selectedText).toBe('const answer = 41;');
    expect(() => ReviewExportV1Schema.parse({ ...document, extra: true })).toThrow();
    expect(() =>
      ReviewExportV1Schema.parse({
        ...document,
        files: [{ ...document.files[0], path: path('/private/source.ts') }],
      }),
    ).toThrow();
    expect(() => ReviewExportV1Schema.parse({ ...document, counts: { ...document.counts, all: 9 } })).toThrow();
  });

  test('orders lossless paths and anchors independently of insertion order or display text', () => {
    const base = comment({
      id: 'comment_bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      anchor: { ...comment().anchor, path: { ...path('Z.ts'), display: 'z-display' }, side: 'base', line: 9, contextHash: { algorithm: 'sha256-v1', value: 'd'.repeat(64) }, uniqueKey: 'd'.repeat(64) },
    });
    const head = comment({
      id: 'comment_cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      anchor: { ...comment().anchor, path: { ...path('a.ts'), display: 'A-display' }, side: 'head', line: 1, contextHash: { algorithm: 'sha256-v1', value: 'e'.repeat(64) }, uniqueKey: 'e'.repeat(64) },
    });
    const document = buildReviewExportV1(snapshot([head, base]), '2026-07-23T08:02:00.000Z');

    expect(document.files.map((file) => file.path.utf8)).toEqual(['Z.ts', 'a.ts']);
    expect(document.files.flatMap((file) => file.comments.map((item) => item.anchor.side))).toEqual(['base', 'head']);
  });

  test('emits RFC 8785-compatible JSON without whitespace or a trailing newline', () => {
    const bytes = canonicalizeReviewExport(buildReviewExportV1(snapshot(), '2026-07-23T08:02:00.000Z'));
    const text = new TextDecoder().decode(bytes);

    expect(text).not.toMatch(/\n$/u);
    expect(text).not.toContain(', ');
    expect(new TextDecoder().decode(canonicalizeReviewExport({ z: 1, '\u{1f600}': 2, '\ufb33': 3, a: ['\u20ac'] } as never))).toBe('{"a":["€"],"z":1,"😀":2,"דּ":3}');
  });

  test('is byte-identical for one snapshot and changes only exportedAt when time changes', () => {
    const first = canonicalizeReviewExport(buildReviewExportV1(snapshot(), '2026-07-23T08:02:00.000Z'));
    const second = canonicalizeReviewExport(buildReviewExportV1(snapshot(), '2026-07-23T08:02:00.000Z'));
    const changed = canonicalizeReviewExport(buildReviewExportV1(snapshot(), '2026-07-23T08:03:00.000Z'));

    expect(second).toEqual(first);
    expect(new TextDecoder().decode(changed).replace('08:03', '08:02')).toBe(new TextDecoder().decode(first));
    expect(parseCanonicalReviewExport(first)).toEqual(JSON.parse(new TextDecoder().decode(first)));
  });

  test('hashes the exact final buffer with a lowercase SHA-256 digest and byte length', () => {
    const bytes = canonicalizeReviewExport(buildReviewExportV1(snapshot(), '2026-07-23T08:02:00.000Z'));
    const hash = hashExportBytes(bytes);

    expect(hash).toEqual({ algorithm: 'sha256', sha256: expect.stringMatching(/^[0-9a-f]{64}$/u), bytes: bytes.length });
    expect(hashExportBytes(new Uint8Array([...bytes, 0x20])).sha256).not.toBe(hash.sha256);
  });
});
