import { z } from 'zod';

import {
  AvailabilitySchema,
  ChangedFileStatusKindSchema,
  ExactPathSchema,
  GitModeSchema,
  GitObjectIdSchema,
} from './comparison.js';
import {
  CommentBodySchema,
  CommentIdSchema,
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
  ])
  .readonly();

export const DraftMutationResultSchema = z
  .union([DraftMutationAcceptedSchema, DraftMutationConflictSchema, DraftMutationFailureSchema])
  .readonly();

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
export type FileContentResponse = z.infer<typeof FileContentResponseSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
