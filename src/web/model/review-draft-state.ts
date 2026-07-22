import {
  projectCommentGroups,
  type ChangedFileInventoryEntry,
  type CommentGroupSections,
  type ReviewCommentProjection,
} from './comment-groups.js';

export { projectCommentGroups, type ReviewCommentProjection } from './comment-groups.js';

export type ReviewCanonicalDraft = Readonly<{
  revision: number;
  summary: string;
  comments: readonly ReviewCommentProjection[];
}>;

export type ReviewPendingOperation = 'summary' | 'comment' | 'add' | 'delete' | 'resolve' | 'reopen';

export type ReviewDraftSnapshot = Readonly<{
  canonical: ReviewCanonicalDraft;
  summaryBuffer: string;
  commentBuffers: ReadonlyMap<string, string>;
  pending: ReviewPendingOperation | null;
  conflict: Readonly<{ latest: ReviewCanonicalDraft; expectedRevision: number }> | null;
  retained: Readonly<{ summary: boolean; comments: ReadonlySet<string> }>;
}>;

function freezeCanonical(draft: ReviewCanonicalDraft): ReviewCanonicalDraft {
  return Object.freeze({
    revision: draft.revision,
    summary: draft.summary,
    comments: Object.freeze([...draft.comments]),
  });
}

export interface ReviewDraftState {
  accept(draft: ReviewCanonicalDraft, successfulBuffer?: 'summary' | string): void;
  conflict(latest: ReviewCanonicalDraft, expectedRevision: number): void;
  fail(): void;
  groups(inventory: readonly ChangedFileInventoryEntry[]): CommentGroupSections;
  reloadLatest(): void;
  setCommentBuffer(commentId: string, value: string): void;
  setSummaryBuffer(value: string): void;
  snapshot(): ReviewDraftSnapshot;
  start(operation: ReviewPendingOperation): boolean;
}

export function createReviewDraftState(initial: ReviewCanonicalDraft): ReviewDraftState {
  let canonical = freezeCanonical(initial);
  let summaryBuffer = canonical.summary;
  const commentBuffers = new Map<string, string>();
  let pending: ReviewPendingOperation | null = null;
  let latestConflict: Readonly<{ latest: ReviewCanonicalDraft; expectedRevision: number }> | null = null;
  let retainedSummary = false;
  const retainedComments = new Set<string>();

  function snapshot(): ReviewDraftSnapshot {
    return {
      canonical,
      summaryBuffer,
      commentBuffers: new Map(commentBuffers),
      pending,
      conflict: latestConflict,
      retained: { summary: retainedSummary, comments: new Set(retainedComments) },
    };
  }

  return {
    accept(draft, successfulBuffer) {
      canonical = freezeCanonical(draft);
      pending = null;
      latestConflict = null;
      if (successfulBuffer === 'summary') {
        summaryBuffer = canonical.summary;
        retainedSummary = false;
      } else if (typeof successfulBuffer === 'string') {
        commentBuffers.delete(successfulBuffer);
        retainedComments.delete(successfulBuffer);
      }
    },
    conflict(latest, expectedRevision) {
      latestConflict = { latest: freezeCanonical(latest), expectedRevision };
      pending = null;
    },
    fail() {
      pending = null;
    },
    groups(inventory) {
      return projectCommentGroups(canonical.comments, inventory);
    },
    reloadLatest() {
      if (latestConflict === null) return;
      canonical = latestConflict.latest;
      retainedSummary ||= summaryBuffer !== canonical.summary;
      for (const [commentId, buffer] of commentBuffers) {
        const accepted = canonical.comments.find((comment) => comment.id === commentId)?.body;
        if (accepted !== buffer) retainedComments.add(commentId);
      }
      latestConflict = null;
      pending = null;
    },
    setCommentBuffer(commentId, value) {
      commentBuffers.set(commentId, value);
    },
    setSummaryBuffer(value) {
      summaryBuffer = value;
    },
    snapshot,
    start(operation) {
      if (pending !== null || latestConflict !== null) return false;
      pending = operation;
      return true;
    },
  };
}
