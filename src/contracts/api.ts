import { z } from 'zod';

import {
  AvailabilitySchema,
  ChangedFileStatusKindSchema,
  ExactPathSchema,
  GitModeSchema,
  GitObjectIdSchema,
} from './comparison.js';
import {
  AnchorVerificationSchema,
  CommentBodySchema,
  CommentIdSchema,
  DurableAnchorV1Schema,
  RevisionSchema,
  ReviewDraftV1Schema,
  SummaryMarkdownSchema,
} from './draft.js';

export const OpaqueFileIdSchema = z.string().regex(/^file_[A-Za-z0-9_-]{43}$/);

const AnchorSideSchema = z.enum(['base', 'head']);

export const AddCommentRequestSchema = z
  .strictObject({
    type: z.literal('addComment'),
    expectedRevision: RevisionSchema,
    fileId: OpaqueFileIdSchema,
    side: AnchorSideSchema,
    line: z.number().int().positive(),
    body: CommentBodySchema,
  })
  .readonly();

export const DraftMutationRequestSchema = z
  .discriminatedUnion('type', [
    AddCommentRequestSchema,
    z.strictObject({
      type: z.literal('editComment'),
      expectedRevision: RevisionSchema,
      commentId: CommentIdSchema,
      body: CommentBodySchema,
    }),
    z.strictObject({
      type: z.literal('deleteComment'),
      expectedRevision: RevisionSchema,
      commentId: CommentIdSchema,
    }),
    z.strictObject({
      type: z.literal('resolveComment'),
      expectedRevision: RevisionSchema,
      commentId: CommentIdSchema,
    }),
    z.strictObject({
      type: z.literal('reopenComment'),
      expectedRevision: RevisionSchema,
      commentId: CommentIdSchema,
    }),
    z.strictObject({
      type: z.literal('setSummary'),
      expectedRevision: RevisionSchema,
      markdown: SummaryMarkdownSchema,
    }),
  ])
  .readonly();

const DraftCommentViewSchema = z
  .discriminatedUnion('state', [
    z.strictObject({
      id: CommentIdSchema,
      state: z.literal('open'),
      body: CommentBodySchema,
      anchor: DurableAnchorV1Schema,
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
      verification: AnchorVerificationSchema,
    }),
    z.strictObject({
      id: CommentIdSchema,
      state: z.literal('resolved'),
      body: CommentBodySchema,
      anchor: DurableAnchorV1Schema,
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
      resolvedAt: z.string().datetime(),
      verification: AnchorVerificationSchema,
    }),
  ])
  .readonly();

export const DraftViewSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    comparison: z
      .strictObject({
        baseCommitOid: GitObjectIdSchema,
        headCommitOid: GitObjectIdSchema,
        mergeBaseOid: GitObjectIdSchema,
      })
      .readonly(),
    revision: RevisionSchema,
    summary: SummaryMarkdownSchema,
    comments: z.array(DraftCommentViewSchema).max(10_000).readonly(),
  })
  .readonly();

export const SafeDraftPathSchema = z
  .string()
  .regex(/^\.diff-review\/drafts\/[A-Za-z0-9._-]+$/u);

const DraftMalformedLoadSchema = z
  .strictObject({
    kind: z.literal('malformed'),
    path: SafeDraftPathSchema,
    fingerprint: z.string().regex(/^[0-9a-f]{64}$/u),
    detail: z.strictObject({ message: z.string().min(1).max(160) }).readonly(),
  })
  .readonly();

const DraftSchemaInvalidLoadSchema = z
  .strictObject({
    kind: z.literal('schemaInvalid'),
    path: SafeDraftPathSchema,
    fingerprint: z.string().regex(/^[0-9a-f]{64}$/u),
    details: z
      .array(z.strictObject({ path: z.string().max(160), message: z.string().min(1).max(160) }).readonly())
      .min(1)
      .max(8)
      .readonly(),
  })
  .readonly();

const DraftNewerUnsupportedLoadSchema = z
  .strictObject({
    kind: z.literal('newerUnsupported'),
    path: SafeDraftPathSchema,
    foundVersion: z.number().int().positive(),
    supportedVersion: z.literal(1),
  })
  .readonly();

export const DraftLoadResponseSchema = z
  .discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('missing'), path: SafeDraftPathSchema }).readonly(),
    z.strictObject({ kind: z.literal('current'), path: SafeDraftPathSchema, draft: DraftViewSchema }).readonly(),
    DraftMalformedLoadSchema,
    DraftSchemaInvalidLoadSchema,
    DraftNewerUnsupportedLoadSchema,
  ])
  .readonly();

const DraftReadOnlyLoadSchema = z.union([
  DraftMalformedLoadSchema,
  DraftSchemaInvalidLoadSchema,
  DraftNewerUnsupportedLoadSchema,
]);

export const DraftMutationAcceptedSchema = z
  .strictObject({
    kind: z.literal('accepted'),
    draft: ReviewDraftV1Schema,
  })
  .readonly();

export const DraftMutationConflictSchema = z
  .strictObject({
    kind: z.literal('revisionConflict'),
    expectedRevision: RevisionSchema,
    actualRevision: RevisionSchema,
    latest: ReviewDraftV1Schema,
  })
  .readonly();

export const DraftMutationFailureSchema = z
  .discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('invalidTarget') }),
    z.strictObject({ kind: z.literal('illegalTransition') }),
    z.strictObject({ kind: z.literal('persistenceFailure') }),
    z.strictObject({ kind: z.literal('readOnly'), load: DraftReadOnlyLoadSchema }),
  ])
  .readonly();

export const DraftMutationResultSchema = z
  .union([DraftMutationAcceptedSchema, DraftMutationConflictSchema, DraftMutationFailureSchema])
  .readonly();

export const DraftRecoveryRequestSchema = z
  .strictObject({ expectedFingerprint: z.string().regex(/^[0-9a-f]{64}$/u) })
  .readonly();

export const DraftRecoveryResultSchema = z
  .discriminatedUnion('kind', [
    z.strictObject({
      kind: z.literal('recovered'),
      backupPath: SafeDraftPathSchema,
      draft: ReviewDraftV1Schema,
    }).readonly(),
    z.strictObject({ kind: z.literal('fingerprintChanged') }).readonly(),
    z.strictObject({ kind: z.literal('recoveryUnavailable'), load: DraftLoadResponseSchema }).readonly(),
    z.strictObject({ kind: z.literal('persistenceFailure') }).readonly(),
  ])
  .readonly();

export const DraftRevealResultSchema = z
  .union([
    z.strictObject({ kind: z.literal('revealed') }).readonly(),
    z.strictObject({ kind: z.literal('revealFailed') }).readonly(),
  ])
  .readonly();

export const ExportReviewRequestSchema = z
  .strictObject({
    expectedRevision: RevisionSchema,
    driftAcknowledgementToken: z.string().regex(/^[A-Za-z0-9_-]{43,128}$/u).optional(),
  })
  .readonly();

export const ExportDirectoryRevealResultSchema = z
  .union([
    z.strictObject({ kind: z.literal('revealed') }).readonly(),
    z.strictObject({ kind: z.literal('revealFailed') }).readonly(),
  ])
  .readonly();

export type ExportReviewRequest = z.infer<typeof ExportReviewRequestSchema>;
export type ExportDirectoryRevealResult = z.infer<typeof ExportDirectoryRevealResultSchema>;

const ExistingFileContentSideSchema = z
  .strictObject({
    exists: z.literal(true),
    path: ExactPathSchema,
    language: z.string().min(1),
    blobOid: GitObjectIdSchema,
    text: z.string(),
  })
  .readonly();

const MissingFileContentSideSchema = z
  .strictObject({
    exists: z.literal(false),
  })
  .readonly();

export const FileContentResponseSchema = z
  .strictObject({
    fileId: OpaqueFileIdSchema,
    base: z.union([ExistingFileContentSideSchema, MissingFileContentSideSchema]),
    head: z.union([ExistingFileContentSideSchema, MissingFileContentSideSchema]),
  })
  .readonly();

const ApiWorktreeIdentitySchema = z
  .strictObject({
    path: z.string().min(1),
    dirty: z.boolean(),
  })
  .readonly();

const ApiPinnedEndpointSchema = z
  .strictObject({
    label: z.string().min(1),
    oid: GitObjectIdSchema,
    worktree: ApiWorktreeIdentitySchema.optional(),
  })
  .readonly();

const ApiFileStatusSchema = z
  .strictObject({
    kind: ChangedFileStatusKindSchema,
    similarity: z.number().int().min(0).max(100).optional(),
  })
  .readonly();

export const SessionFileSchema = z
  .strictObject({
    fileId: OpaqueFileIdSchema,
    status: ApiFileStatusSchema,
    oldPath: ExactPathSchema.optional(),
    newPath: ExactPathSchema.optional(),
    additions: z.number().int().nonnegative().nullable(),
    deletions: z.number().int().nonnegative().nullable(),
    availability: AvailabilitySchema,
  })
  .readonly();

export const SessionResponseSchema = z
  .strictObject({
    base: ApiPinnedEndpointSchema,
    head: ApiPinnedEndpointSchema,
    mergeBaseOid: GitObjectIdSchema,
    files: z.array(SessionFileSchema).readonly(),
  })
  .readonly();

export const SelectorDriftRoleSchema = z.enum(['base', 'head']);
export const SelectorTypeSchema = z.enum(['branch', 'worktree']);
export const SelectorUnavailableReasonSchema = z.literal('source-unavailable');

export const SelectorDriftStatusSchema = z
  .discriminatedUnion('kind', [
    z
      .strictObject({
        kind: z.literal('unchanged'),
        role: SelectorDriftRoleSchema,
      })
      .readonly(),
    z
      .strictObject({
        kind: z.literal('moved'),
        role: SelectorDriftRoleSchema,
        label: z.string().min(1),
        selectorType: SelectorTypeSchema,
        oldOid: GitObjectIdSchema,
        newOid: GitObjectIdSchema,
      })
      .readonly(),
    z
      .strictObject({
        kind: z.literal('unavailable'),
        role: SelectorDriftRoleSchema,
        label: z.string().min(1),
        selectorType: SelectorTypeSchema,
        oldOid: GitObjectIdSchema,
        reason: SelectorUnavailableReasonSchema,
      })
      .readonly(),
  ])
  .readonly();

export const SelectorDriftResponseSchema = z
  .strictObject({
    base: SelectorDriftStatusSchema,
    head: SelectorDriftStatusSchema,
  })
  .readonly();

export const FileMetadataResponseSchema = z
  .strictObject({
    fileId: OpaqueFileIdSchema,
    status: ApiFileStatusSchema,
    oldPath: ExactPathSchema.optional(),
    newPath: ExactPathSchema.optional(),
    additions: z.number().int().nonnegative().nullable(),
    deletions: z.number().int().nonnegative().nullable(),
    availability: AvailabilitySchema,
    oldMode: GitModeSchema,
    newMode: GitModeSchema,
  })
  .readonly();

export const ApiErrorSchema = z
  .strictObject({
    code: z.enum(['request-unavailable', 'session-unavailable']),
    message: z.string().min(1),
  })
  .readonly();

export type SessionFile = z.infer<typeof SessionFileSchema>;
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
export type FileMetadataResponse = z.infer<
  typeof FileMetadataResponseSchema
>;
export type AddCommentRequest = z.infer<typeof AddCommentRequestSchema>;
export type DraftMutationRequest = z.infer<typeof DraftMutationRequestSchema>;
export type DraftMutationResult = z.infer<typeof DraftMutationResultSchema>;
export type DraftLoadResponse = z.infer<typeof DraftLoadResponseSchema>;
export type DraftRecoveryRequest = z.infer<typeof DraftRecoveryRequestSchema>;
export type DraftRecoveryResult = z.infer<typeof DraftRecoveryResultSchema>;
export type DraftRevealResult = z.infer<typeof DraftRevealResultSchema>;
export type FileContentResponse = z.infer<typeof FileContentResponseSchema>;
export type SelectorDriftStatus = z.infer<typeof SelectorDriftStatusSchema>;
export type SelectorDriftResponse = z.infer<typeof SelectorDriftResponseSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
