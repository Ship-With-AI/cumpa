import type { DraftLoadResponse, DiffReviewIgnoreStatus, ExportReviewResult, SelectorDriftResponse } from '../../contracts/api.js';

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

export type ReviewExportState = Readonly<{
  pending: boolean;
  phase: 'ready' | 'pending' | 'drift' | 'conflict' | 'failed' | 'exported' | 'unavailable';
  failure: 'publicationFailed' | 'reExportUnsupported' | null;
  conflict: Readonly<{ expectedRevision: number; actualRevision: number }> | null;
  receipt: Extract<ExportReviewResult, { readonly kind: 'exported' }> | null;
  previousConfirmedReceipt: Extract<ExportReviewResult, { readonly kind: 'exported' }> | null;
  driftAcknowledgementToken: string | null;
  driftObservation: SelectorDriftResponse | null;
  ignoreStatus: DiffReviewIgnoreStatus | null;
  driftStale: boolean;
}>;

export type ReviewDraftSnapshot = Readonly<{
  canonical: ReviewCanonicalDraft;
  summaryBuffer: string;
  commentBuffers: ReadonlyMap<string, string>;
  pending: ReviewPendingOperation | null;
  conflict: Readonly<{ latest: ReviewCanonicalDraft; expectedRevision: number }> | null;
  retained: Readonly<{ summary: boolean; comments: ReadonlySet<string> }>;
  export: ReviewExportState;
}>;

export type ReadOnlyDraftLoad = Extract<
  DraftLoadResponse,
  { readonly kind: 'malformed' | 'schemaInvalid' | 'newerUnsupported' }
>;

export type ReviewPrimarySurface = 'loading' | 'workspace' | 'recovery' | 'upgrade';

export function reviewPrimarySurface(load: DraftLoadResponse | undefined): ReviewPrimarySurface {
  switch (load?.kind) {
    case undefined:
      return 'loading';
    case 'missing':
    case 'current':
      return 'workspace';
    case 'malformed':
    case 'schemaInvalid':
      return 'recovery';
    case 'newerUnsupported':
      return 'upgrade';
  }
}

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
  cancelExport(): void;
  completeExport(result: ExportReviewResult): void;
  fail(): void;
  groups(inventory: readonly ChangedFileInventoryEntry[]): CommentGroupSections;
  reloadLatest(): void;
  setCommentBuffer(commentId: string, value: string): void;
  setIgnoreStatus(status: DiffReviewIgnoreStatus): void;
  setSummaryBuffer(value: string): void;
  snapshot(): ReviewDraftSnapshot;
  startExport(driftAcknowledgementToken?: string): boolean;
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
  let exportState: ReviewExportState = {
    pending: false,
    phase: 'ready',
    failure: null,
    conflict: null,
    receipt: null,
    previousConfirmedReceipt: null,
    driftAcknowledgementToken: null,
    driftObservation: null,
    driftStale: false,
    ignoreStatus: null,
  };

  function snapshot(): ReviewDraftSnapshot {
    return {
      canonical,
      summaryBuffer,
      commentBuffers: new Map(commentBuffers),
      pending,
      conflict: latestConflict,
      retained: { summary: retainedSummary, comments: new Set(retainedComments) },
      export: exportState,
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
    cancelExport() {
      if (exportState.phase !== 'drift') return;
      exportState = {
        ...exportState,
        phase: 'ready',
        driftAcknowledgementToken: null,
        driftObservation: null,
        driftStale: false,
      };
    },
    conflict(latest, expectedRevision) {
      latestConflict = { latest: freezeCanonical(latest), expectedRevision };
      pending = null;
    },
    completeExport(result) {
      if (result.kind === 'exported') {
        exportState = {
          ...exportState,
          pending: false,
          phase: 'exported',
          failure: null,
          conflict: null,
          receipt: result,
          previousConfirmedReceipt: result,
          driftAcknowledgementToken: null,
          driftObservation: null,
          driftStale: false,
        };
      } else if (result.kind === 'revisionConflict') {
        exportState = {
          ...exportState,
          pending: false,
          phase: 'conflict',
          failure: null,
          conflict: { expectedRevision: result.expectedRevision, actualRevision: result.actualRevision },
          receipt: null,
          driftAcknowledgementToken: null,
          driftObservation: null,
          driftStale: false,
        };
      } else if (result.kind === 'driftAcknowledgementRequired' || result.kind === 'driftAcknowledgementStale') {
        exportState = {
          pending: false,
          ...exportState,
          phase: 'drift',
          failure: null,
          conflict: null,
          receipt: null,
          driftAcknowledgementToken: result.acknowledgementToken,
          driftObservation: result.observation,
          driftStale: result.kind === 'driftAcknowledgementStale',
        };
      } else if (result.kind === 'publicationFailed' || result.kind === 'reExportUnsupported') {
        exportState = {
          ...exportState,
          phase: 'failed',
          failure: result.kind,
          pending: false,
          conflict: null,
          receipt: null,
          driftAcknowledgementToken: null,
          driftObservation: null,
          driftStale: false,
        };
      } else {
        exportState = {
          ...exportState,
          phase: 'unavailable',
          failure: null,
          conflict: null,
          receipt: null,
          driftAcknowledgementToken: null,
          pending: false,
          driftObservation: null,
          driftStale: false,
        };
      }
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
      if (exportState.phase === 'conflict') {
        exportState = { ...exportState, pending: false, phase: 'ready', conflict: null };
      }
    },
    setCommentBuffer(commentId, value) {
      commentBuffers.set(commentId, value);
    },
    setIgnoreStatus(status) {
      exportState = { ...exportState, ignoreStatus: status };
    },
    setSummaryBuffer(value) {
      summaryBuffer = value;
    },
    snapshot,
    startExport(driftAcknowledgementToken) {
      if (pending !== null || latestConflict !== null || exportState.phase === 'pending' || exportState.phase === 'conflict' || exportState.phase === 'unavailable') {
        return false;
      }
      if (exportState.phase === 'drift' && driftAcknowledgementToken !== exportState.driftAcknowledgementToken) {
        return false;
      }
      exportState = {
        ...exportState,
        phase: 'pending',
        failure: null,
        conflict: null,
        receipt: null,
        pending: true,
      };
      return true;
    },
    start(operation) {
      if (pending !== null || latestConflict !== null || exportState.phase === 'pending') return false;
      pending = operation;
      return true;
    },
  };
}
