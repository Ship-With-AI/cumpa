import { describe, expect, test } from 'vitest';

import { AddCommentRequestSchema } from '../../src/contracts/api.js';
import { ReviewDraftV1Schema, type DraftMutation, type ReviewDraftV1 } from '../../src/contracts/draft.js';
import { applyDraftMutation } from '../../src/draft/mutate-draft.js';

const objectId = 'a'.repeat(40);
const commentId = 'comment_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

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

function draft(state: 'open' | 'resolved' = 'open'): ReviewDraftV1 {
  const comment = {
    id: commentId,
    state,
    body: 'Original body',
    anchor: anchor(),
    createdAt: '2026-07-22T08:00:00.000Z',
    updatedAt: '2026-07-22T08:00:00.000Z',
    ...(state === 'resolved' ? { resolvedAt: '2026-07-22T08:01:00.000Z' } : {}),
  };

  return ReviewDraftV1Schema.parse({
    schemaVersion: 1,
    comparison: {
      baseCommitOid: objectId,
      headCommitOid: 'b'.repeat(40),
      mergeBaseOid: 'c'.repeat(40),
    },
    revision: 4,
    summary: '# Original summary',
    comments: [comment],
  });
}

function applied(current: ReviewDraftV1, mutation: DraftMutation): ReviewDraftV1 {
  const result = applyDraftMutation(current, mutation, '2026-07-22T08:02:00.000Z');
  expect(result.kind).toBe('applied');
  if (result.kind !== 'applied') {
    throw new Error(`Expected an applied mutation, received ${result.kind}.`);
  }
  return result.draft;
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

describe('aggregate draft mutation reducer', () => {
  test.each([
    {
      name: 'adds an open comment with server materialized identity',
      current: draft(),
      mutation: {
        type: 'addComment',
        commentId: 'comment_bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        body: 'Second body',
        anchor: { ...anchor(), uniqueKey: 'd'.repeat(64) },
      },
      verify(next: ReviewDraftV1) {
        expect(next.comments).toHaveLength(2);
        expect(next.comments[1]).toMatchObject({
          id: 'comment_bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          state: 'open',
          body: 'Second body',
          createdAt: '2026-07-22T08:02:00.000Z',
          updatedAt: '2026-07-22T08:02:00.000Z',
        });
      },
    },
    {
      name: 'edits only the comment body and updated timestamp',
      current: draft(),
      mutation: { type: 'editComment', commentId, body: 'Edited body' },
      verify(next: ReviewDraftV1) {
        expect(next.comments[0]).toEqual({
          ...draft().comments[0],
          body: 'Edited body',
          updatedAt: '2026-07-22T08:02:00.000Z',
        });
      },
    },
    {
      name: 'physically deletes the selected comment',
      current: draft(),
      mutation: { type: 'deleteComment', commentId },
      verify(next: ReviewDraftV1) {
        expect(next.comments).toEqual([]);
      },
    },
    {
      name: 'resolves an open comment without changing its body or anchor',
      current: draft(),
      mutation: { type: 'resolveComment', commentId },
      verify(next: ReviewDraftV1) {
        expect(next.comments[0]).toEqual({
          ...draft().comments[0],
          state: 'resolved',
          updatedAt: '2026-07-22T08:02:00.000Z',
          resolvedAt: '2026-07-22T08:02:00.000Z',
        });
      },
    },
    {
      name: 'reopens a resolved comment and removes resolvedAt',
      current: draft('resolved'),
      mutation: { type: 'reopenComment', commentId },
      verify(next: ReviewDraftV1) {
        const { resolvedAt: _resolvedAt, ...openComment } = draft('resolved').comments[0];
        expect(next.comments[0]).toEqual({
          ...openComment,
          state: 'open',
          updatedAt: '2026-07-22T08:02:00.000Z',
        });
        expect('resolvedAt' in next.comments[0]).toBe(false);
      },
    },
    {
      name: 'sets the exact Markdown summary without changing comments',
      current: draft(),
      mutation: { type: 'setSummary', markdown: '# Exact replacement\n\nNo trimming.  ' },
      verify(next: ReviewDraftV1) {
        expect(next.summary).toBe('# Exact replacement\n\nNo trimming.  ');
        expect(next.comments).toEqual(draft().comments);
      },
    },
  ] satisfies ReadonlyArray<{
    readonly name: string;
    readonly current: ReviewDraftV1;
    readonly mutation: DraftMutation;
    readonly verify: (next: ReviewDraftV1) => void;
  }>)('$name', ({ current, mutation, verify }) => {
    verify(applied(current, mutation));
  });

  test.each([
    {
      name: 'rejects a duplicate anchor',
      current: draft(),
      mutation: {
        type: 'addComment',
        commentId: 'comment_bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        body: 'Duplicate anchor body',
        anchor: anchor(),
      },
      kind: 'invalidTarget',
    },
    {
      name: 'rejects a missing target',
      current: draft(),
      mutation: {
        type: 'editComment',
        commentId: 'comment_bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        body: 'Missing target body',
      },
      kind: 'invalidTarget',
    },
    {
      name: 'rejects resolving an already resolved comment',
      current: draft('resolved'),
      mutation: { type: 'resolveComment', commentId },
      kind: 'illegalTransition',
    },
    {
      name: 'rejects reopening an already open comment',
      current: draft(),
      mutation: { type: 'reopenComment', commentId },
      kind: 'illegalTransition',
    },
  ] satisfies ReadonlyArray<{
    readonly name: string;
    readonly current: ReviewDraftV1;
    readonly mutation: DraftMutation;
    readonly kind: 'invalidTarget' | 'illegalTransition';
  }>)('$name', ({ current, mutation, kind }) => {
    expect(applyDraftMutation(current, mutation, '2026-07-22T08:02:00.000Z')).toEqual({ kind });
  });
});
