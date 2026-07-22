import { z } from 'zod';

import { ExactPathSchema, GitObjectIdSchema } from './comparison.js';

export const RevisionSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const CommentIdSchema = z.string().regex(/^comment_[0-9a-f-]{36}$/u);
export const CommentBodySchema = z
  .string()
  .max(100_000)
  .refine((value) => value.trim().length > 0, 'Comment body must not be blank.');
export const SummaryMarkdownSchema = z.string().max(100_000);

const AnchorSideSchema = z.enum(['base', 'head']);
const AnchorLineSchema = z
  .strictObject({
    line: z.number().int().positive(),
    text: z.string(),
  })
  .readonly();

export const DurableAnchorV1Schema = z
  .strictObject({
    version: z.literal('durable-anchor-v1'),
    path: ExactPathSchema,
    safeDisplayPath: z.string(),
    side: AnchorSideSchema,
    line: z.number().int().positive(),
    blobOid: GitObjectIdSchema,
    selectedText: z.string(),
    context: z
      .strictObject({
        before: z.array(AnchorLineSchema).max(3).readonly(),
        target: AnchorLineSchema,
        after: z.array(AnchorLineSchema).max(3).readonly(),
      })
      .readonly(),
    contextHash: z
      .strictObject({
        algorithm: z.literal('sha256-v1'),
        value: z.string().regex(/^[0-9a-f]{64}$/),
      })
      .readonly(),
    uniqueKey: z.string().regex(/^[0-9a-f]{64}$/),
  })
  .readonly();

export const AnchorVerificationSchema = z
  .strictObject({
    state: z.enum(['verified', 'stale', 'orphaned']),
    reason: z.enum(['exact-match', 'anchor-mismatch', 'anchor-unavailable']),
  })
  .readonly();

const DraftComparisonSchema = z
  .strictObject({
    baseCommitOid: GitObjectIdSchema,
    headCommitOid: GitObjectIdSchema,
    mergeBaseOid: GitObjectIdSchema,
  })
  .readonly();

const DraftCommentSchema = z
  .discriminatedUnion('state', [
    z.strictObject({
      id: CommentIdSchema,
      state: z.literal('open'),
      body: CommentBodySchema,
      anchor: DurableAnchorV1Schema,
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    }),
    z.strictObject({
      id: CommentIdSchema,
      state: z.literal('resolved'),
      body: CommentBodySchema,
      anchor: DurableAnchorV1Schema,
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
      resolvedAt: z.string().datetime(),
    }),
  ])
  .readonly();

export const ReviewDraftV1Schema = z
  .strictObject({
    schemaVersion: z.literal(1),
    comparison: DraftComparisonSchema,
    revision: RevisionSchema,
    summary: SummaryMarkdownSchema,
    comments: z.array(DraftCommentSchema).max(10_000).readonly(),
  })
  .superRefine((draft, context) => {
    const ids = new Set<string>();
    const anchors = new Set<string>();
    for (const [index, comment] of draft.comments.entries()) {
      if (ids.has(comment.id)) {
        context.addIssue({ code: 'custom', message: 'Comment IDs must be unique.', path: ['comments', index, 'id'] });
      }
      if (anchors.has(comment.anchor.uniqueKey)) {
        context.addIssue({ code: 'custom', message: 'Comments must have unique anchors.', path: ['comments', index, 'anchor', 'uniqueKey'] });
      }
      ids.add(comment.id);
      anchors.add(comment.anchor.uniqueKey);
    }
  })
  .readonly();

export const DraftMutationSchema = z
  .discriminatedUnion('type', [
    z.strictObject({ type: z.literal('addComment'), commentId: CommentIdSchema, body: CommentBodySchema, anchor: DurableAnchorV1Schema }),
    z.strictObject({ type: z.literal('editComment'), commentId: CommentIdSchema, body: CommentBodySchema }),
    z.strictObject({ type: z.literal('deleteComment'), commentId: CommentIdSchema }),
    z.strictObject({ type: z.literal('resolveComment'), commentId: CommentIdSchema }),
    z.strictObject({ type: z.literal('reopenComment'), commentId: CommentIdSchema }),
    z.strictObject({ type: z.literal('setSummary'), markdown: SummaryMarkdownSchema }),
  ])
  .readonly();

export type ReviewDraftV1 = z.infer<typeof ReviewDraftV1Schema>;
export type ReviewDraftCommentV1 = z.infer<typeof DraftCommentSchema>;
export type DraftMutation = z.infer<typeof DraftMutationSchema>;

export type DurableAnchorV1Dto = z.infer<typeof DurableAnchorV1Schema>;
export type AnchorVerificationDto = z.infer<typeof AnchorVerificationSchema>;
