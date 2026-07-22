import { expect, test } from '@playwright/test';

import { createReviewDraftState } from '../../src/web/model/review-draft-state.js';

const commentId = 'comment_00000000-0000-4000-8000-000000000001';

test('retains unsaved summary and comment edits while canonical review state changes only after acceptance', () => {
  const review = createReviewDraftState({
    revision: 1,
    summary: 'Saved summary',
    comments: [{
      id: commentId,
      state: 'open',
      body: 'Saved comment',
      side: 'head',
      line: 4,
      createdAt: '2026-07-22T00:00:00.000Z',
      path: { bytesBase64url: 'c3JjL2ZpbGUudHM', display: 'src/file.ts' },
    }],
  });

  review.setSummaryBuffer('Attempted summary');
  review.setCommentBuffer(commentId, 'Attempted comment');
  expect(review.start('comment')).toBe(true);
  review.conflict({ revision: 2, summary: 'Latest summary', comments: [] }, 1);
  expect(review.snapshot().canonical.summary).toBe('Saved summary');
  expect(review.snapshot().commentBuffers.get(commentId)).toBe('Attempted comment');

  review.reloadLatest();
  expect(review.snapshot().canonical.summary).toBe('Latest summary');
  expect(review.snapshot().summaryBuffer).toBe('Attempted summary');
  expect(review.snapshot().retained.comments.has(commentId)).toBe(true);
});
