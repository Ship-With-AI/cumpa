import {
  DraftMutationSchema,
  ReviewDraftV1Schema,
  type DraftMutation,
  type ReviewDraftV1,
} from '../contracts/draft.js';

export type DraftMutationFailureKind = 'invalidTarget' | 'illegalTransition';

export type DraftMutationApplication =
  | Readonly<{ readonly kind: 'applied'; readonly draft: ReviewDraftV1 }>
  | Readonly<{ readonly kind: DraftMutationFailureKind }>;

export function applyDraftMutation(
  current: ReviewDraftV1,
  input: DraftMutation,
  timestamp: string,
): DraftMutationApplication {
  const mutation = DraftMutationSchema.parse(input);

  switch (mutation.type) {
    case 'addComment': {
      if (current.comments.some((comment) => comment.anchor.uniqueKey === mutation.anchor.uniqueKey)) {
        return Object.freeze({ kind: 'invalidTarget' });
      }
      return Object.freeze({
        kind: 'applied',
        draft: ReviewDraftV1Schema.parse({
          ...current,
          comments: [
            ...current.comments,
            {
              id: mutation.commentId,
              state: 'open',
              body: mutation.body,
              anchor: mutation.anchor,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          ],
        }),
      });
    }
    case 'setSummary':
      return Object.freeze({
        kind: 'applied',
        draft: ReviewDraftV1Schema.parse({ ...current, summary: mutation.markdown }),
      });
    default:
      break;
  }

  const comment = current.comments.find((candidate) => candidate.id === mutation.commentId);
  if (comment === undefined) {
    return Object.freeze({ kind: 'invalidTarget' });
  }

  switch (mutation.type) {
    case 'editComment':
      return Object.freeze({
        kind: 'applied',
        draft: ReviewDraftV1Schema.parse({
          ...current,
          comments: current.comments.map((candidate) =>
            candidate.id === comment.id ? { ...candidate, body: mutation.body, updatedAt: timestamp } : candidate,
          ),
        }),
      });
    case 'deleteComment':
      return Object.freeze({
        kind: 'applied',
        draft: ReviewDraftV1Schema.parse({
          ...current,
          comments: current.comments.filter((candidate) => candidate.id !== comment.id),
        }),
      });
    case 'resolveComment':
      if (comment.state !== 'open') {
        return Object.freeze({ kind: 'illegalTransition' });
      }
      return Object.freeze({
        kind: 'applied',
        draft: ReviewDraftV1Schema.parse({
          ...current,
          comments: current.comments.map((candidate) =>
            candidate.id === comment.id
              ? { ...candidate, state: 'resolved', updatedAt: timestamp, resolvedAt: timestamp }
              : candidate,
          ),
        }),
      });
    case 'reopenComment':
      if (comment.state !== 'resolved') {
        return Object.freeze({ kind: 'illegalTransition' });
      }
      return Object.freeze({
        kind: 'applied',
        draft: ReviewDraftV1Schema.parse({
          ...current,
          comments: current.comments.map((candidate) => {
            if (candidate.id !== comment.id || candidate.state !== 'resolved') {
              return candidate;
            }
            const { resolvedAt: _resolvedAt, ...reopened } = candidate;
            return { ...reopened, state: 'open' as const, updatedAt: timestamp };
          }),
        }),
      });
  }
}
