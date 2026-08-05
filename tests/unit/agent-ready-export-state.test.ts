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

test('requires the latest drift acknowledgement before showing the accepted-pair export progress', () => {
  const review = createReviewDraftState({ revision: 7, summary: '', comments: [] });
  const firstObservation = {
    base: {
      kind: 'moved' as const,
      role: 'base' as const,
      label: 'main',
      selectorType: 'branch' as const,
      oldOid: '1'.repeat(40),
      newOid: '2'.repeat(40),
    },
    head: {
      kind: 'unchanged' as const,
      role: 'head' as const,
      label: 'feature/export',
      selectorType: 'branch' as const,
    },
  };

  review.completeExport({
    kind: 'driftAcknowledgementRequired',
    acknowledgementToken: 'first-token',
    observation: firstObservation,
  });

  expect(review.startExport('old-token')).toBe(false);
  expect(review.startExport('first-token')).toBe(true);
  expect(review.snapshot().export.progress).toBe('preparing');

  review.completeExport({
    kind: 'driftAcknowledgementStale',
    acknowledgementToken: 'latest-token',
    observation: {
      ...firstObservation,
      base: {
        ...firstObservation.base,
        newOid: '3'.repeat(40),
      },
    },
  });

  expect(review.snapshot().export).toMatchObject({
    pending: false,
    phase: 'drift',
    driftStale: true,
    driftAcknowledgementToken: 'latest-token',
  });
  expect(review.startExport('first-token')).toBe(false);
});

test('keeps recovery-required export state distinct from ordinary publication failure', () => {
  const review = createReviewDraftState({ revision: 7, summary: '', comments: [] });

  expect(review.startExport()).toBe(true);
  review.completeExport({ kind: 'recoveryRequired' });

  expect(review.snapshot().export).toMatchObject({
    pending: false,
    phase: 'failed',
    failure: 'recoveryRequired',
  });
});

test('uses strict attached completion status and revision-zero Finish requests', async () => {
  const requests: Array<{ readonly path: string; readonly body: unknown }> = [];
  const responses = [
    new Response(JSON.stringify({ kind: 'waiting' })),
    new Response(JSON.stringify({ kind: 'completed', revision: 0 }), { status: 201 }),
    new Response(JSON.stringify({ kind: 'waiting', unexpected: true })),
  ];
  const client = createSessionClient({
    location: { hash: `#token=${token}`, pathname: '/', search: '' },
    history: { state: null, replaceState() {} },
    fetch: async (path, init) => {
      requests.push({ path: String(path), body: init?.body === undefined ? undefined : JSON.parse(String(init.body)) });
      return responses.shift()!;
    },
  });

  await expect(client.getAttachedCompletionStatus()).resolves.toEqual({ kind: 'waiting' });
  await expect(client.finishReview({ expectedRevision: 0 })).resolves.toEqual({ kind: 'completed', revision: 0 });
  await expect(client.getAttachedCompletionStatus()).rejects.toThrow('Local draft couldn’t be opened');

  expect(requests).toEqual([
    { path: '/api/attached-completion', body: undefined },
    { path: '/api/attached-completion/finish', body: { expectedRevision: 0 } },
    { path: '/api/attached-completion', body: undefined },
  ]);
});
