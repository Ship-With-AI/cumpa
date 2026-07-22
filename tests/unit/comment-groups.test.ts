import { describe, expect, test } from 'vitest';

import {
  createReviewDraftState,
  projectCommentGroups,
  type ReviewCommentProjection,
} from '../../src/web/model/review-draft-state.js';

const comment = (overrides: Partial<ReviewCommentProjection>): ReviewCommentProjection => ({
  id: 'comment_00000000-0000-4000-8000-000000000001',
  state: 'open',
  body: 'Review this.',
  side: 'head',
  line: 10,
  createdAt: '2026-07-22T00:00:00.000Z',
  path: { bytesBase64url: 'c3JjL2EudHM', display: 'src/a.ts' },
  ...overrides,
});

describe('review draft projections', () => {
  test('keeps lossless identities distinct, follows inventory order, then byte order', () => {
    const firstCollision = { bytesBase64url: 'c3JjL2EtdHdvLnRz', display: 'src/�.ts' };
    const secondCollision = { bytesBase64url: 'c3JjL2EtdGhyZWUudHM', display: 'src/�.ts' };
    const groups = projectCommentGroups([
      comment({ id: 'comment_00000000-0000-4000-8000-000000000004', path: { bytesBase64url: 'c3JjL3oudHM', display: 'src/z.ts' } }),
      comment({ id: 'comment_00000000-0000-4000-8000-000000000003', path: firstCollision }),
      comment({ id: 'comment_00000000-0000-4000-8000-000000000002', path: secondCollision }),
      comment({ id: 'comment_00000000-0000-4000-8000-000000000001', path: { bytesBase64url: 'c3JjL2EudHM', display: 'src/a.ts' } }),
    ], [
      { identity: secondCollision.bytesBase64url, display: secondCollision.display },
      { identity: 'c3JjL2EudHM', display: 'src/a.ts' },
    ]);

    expect(groups.open.map((group) => group.path.bytesBase64url)).toEqual([
      secondCollision.bytesBase64url,
      'c3JjL2EudHM',
      firstCollision.bytesBase64url,
      'c3JjL3oudHM',
    ]);
  });

  test('orders Base before Head, then line, created time, and stable ID', () => {
    const groups = projectCommentGroups([
      comment({ id: 'comment_00000000-0000-4000-8000-000000000004', side: 'head', line: 1 }),
      comment({ id: 'comment_00000000-0000-4000-8000-000000000003', side: 'base', line: 99 }),
      comment({ id: 'comment_00000000-0000-4000-8000-000000000002', side: 'base', line: 3, createdAt: '2026-07-23T00:00:00.000Z' }),
      comment({ id: 'comment_00000000-0000-4000-8000-000000000001', side: 'base', line: 3 }),
    ], []);

    expect(groups.open[0]?.comments.map((entry) => entry.id)).toEqual([
      'comment_00000000-0000-4000-8000-000000000001',
      'comment_00000000-0000-4000-8000-000000000002',
      'comment_00000000-0000-4000-8000-000000000003',
      'comment_00000000-0000-4000-8000-000000000004',
    ]);
  });
});

describe('canonical versus attempted review state', () => {
  test('adopts canonical data only after accepted response and retains every attempt through conflict reload', () => {
    const state = createReviewDraftState({ revision: 3, summary: 'Saved', comments: [] });
    state.setSummaryBuffer('Attempted summary');
    state.setCommentBuffer('comment_00000000-0000-4000-8000-000000000001', 'Attempted comment');
    state.start('summary');
    state.conflict({ revision: 4, summary: 'Latest', comments: [] }, 3);

    expect(state.snapshot().canonical.summary).toBe('Saved');
    expect(state.snapshot().summaryBuffer).toBe('Attempted summary');
    expect(state.snapshot().commentBuffers.get('comment_00000000-0000-4000-8000-000000000001')).toBe('Attempted comment');

    state.reloadLatest();
    expect(state.snapshot().canonical.summary).toBe('Latest');
    expect(state.snapshot().summaryBuffer).toBe('Attempted summary');
    expect(state.snapshot().retained.summary).toBe(true);
    expect(state.snapshot().pending).toBeNull();
  });
});
