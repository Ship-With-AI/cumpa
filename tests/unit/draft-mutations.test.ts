import { describe, expect, test } from 'vitest';

import { AddCommentRequestSchema } from '../../src/contracts/api.js';
import { ReviewDraftV1Schema } from '../../src/contracts/draft.js';

const objectId = 'a'.repeat(40);

function anchor() {
  return {
    version: 'durable-anchor-v1' as const,
    path: {
      utf8: 'src/review.ts',
      display: 'src/review.ts',
      bytesBase64url: 'c3JjL3Jldmlldy50cw',
    },
    safeDisplayPath: 'src/review.ts',
    side: 'head' as const,
    line: 1,
    blobOid: objectId,
    selectedText: 'after',
    context: {
      before: [],
      target: { line: 1, text: 'after' },
      after: [],
    },
    contextHash: { algorithm: 'sha256-v1' as const, value: 'b'.repeat(64) },
    uniqueKey: 'c'.repeat(64),
  };
}

describe('aggregate draft mutation contracts', () => {
  test('requires a safe aggregate revision for addComment and rejects unknown authority', () => {
    const payload = {
      type: 'addComment',
      expectedRevision: 0,
      fileId: `file_${'a'.repeat(43)}`,
      side: 'head',
      line: 1,
      body: 'exact nonblank body',
    };

    expect(AddCommentRequestSchema.safeParse({ ...payload, expectedRevision: undefined }).success).toBe(false);
    expect(AddCommentRequestSchema.safeParse({ ...payload, expectedRevision: -1 }).success).toBe(false);
    expect(AddCommentRequestSchema.safeParse({ ...payload, repositoryRoot: '/unsafe' }).success).toBe(false);
    expect(AddCommentRequestSchema.safeParse(payload).success).toBe(true);
  });

  test('accepts the one exact Markdown summary and resolved comment invariant', () => {
    const parsed = ReviewDraftV1Schema.safeParse({
      schemaVersion: 1,
      comparison: {
        baseCommitOid: objectId,
        headCommitOid: 'b'.repeat(40),
        mergeBaseOid: 'c'.repeat(40),
      },
      revision: 4,
      summary: '# Exact heading\n\nNo trimming.  ',
      comments: [{
        id: 'comment_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        state: 'resolved',
        body: 'Keep the exact body.  ',
        anchor: anchor(),
        createdAt: '2026-07-22T08:00:00.000Z',
        updatedAt: '2026-07-22T08:02:00.000Z',
        resolvedAt: '2026-07-22T08:02:00.000Z',
      }],
    });

    expect(parsed.success).toBe(true);
  });
});
