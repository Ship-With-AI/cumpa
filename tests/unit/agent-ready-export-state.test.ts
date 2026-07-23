import { expect, test } from 'vitest';

import { createSessionClient } from '../../src/web/api/client.js';
import { createReviewDraftState } from '../../src/web/model/review-draft-state.js';

const commentId = 'comment_00000000-0000-4000-8000-000000000001';
const token = 'a'.repeat(43);

test('exports only the accepted revision and preserves unsaved buffers through a failed pair publication', async () => {
  const requests: Array<{ readonly path: string; readonly body: unknown }> = [];
  const client = createSessionClient({
    location: { hash: `#token=${token}`, pathname: '/', search: '' },
    history: { state: null, replaceState() {} },
    fetch: async (path, init) => {
      requests.push({ path: String(path), body: init?.body === undefined ? undefined : JSON.parse(String(init.body)) });
      return new Response(JSON.stringify({ kind: 'publicationFailed' }), { status: 500 });
    },
  });
  const review = createReviewDraftState({
    revision: 7,
    summary: 'Accepted summary',
    comments: [{
      id: commentId,
      state: 'open',
      body: 'Accepted comment',
      side: 'head',
      line: 4,
      createdAt: '2026-07-23T00:00:00.000Z',
      path: { bytesBase64url: 'c3JjL2ZpbGUudHM', display: 'src/file.ts' },
    }],
  });

  review.setSummaryBuffer('Unsaved summary');
  review.setCommentBuffer(commentId, 'Unsaved comment');
  expect(review.startExport()).toBe(true);

  const result = await client.exportReview({ expectedRevision: review.snapshot().canonical.revision });
  review.completeExport(result);

  expect(requests).toEqual([{ path: '/api/export', body: { expectedRevision: 7 } }]);
  expect(review.snapshot().canonical).toMatchObject({ revision: 7, summary: 'Accepted summary' });
  expect(review.snapshot().summaryBuffer).toBe('Unsaved summary');
  expect(review.snapshot().commentBuffers.get(commentId)).toBe('Unsaved comment');
  expect(review.snapshot().export).toMatchObject({ pending: false, failure: 'publicationFailed' });
});
