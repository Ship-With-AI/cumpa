import { z } from 'zod';

import { ExactPathSchema, GitObjectIdSchema } from './comparison.js';

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
  .strictObject({
    id: z.string().regex(/^comment_[0-9a-f-]{36}$/u),
    state: z.literal('open'),
    body: z.string().trim().min(1).max(100_000),
    anchor: DurableAnchorV1Schema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .readonly();

export const ReviewDraftV1Schema = z
  .strictObject({
    schemaVersion: z.literal(1),
    comparison: DraftComparisonSchema,
    revision: z.number().int().nonnegative(),
    summary: z.literal(''),
    comments: z.array(DraftCommentSchema).max(10_000).readonly(),
  })
  .readonly();

export type ReviewDraftV1 = z.infer<typeof ReviewDraftV1Schema>;
export type ReviewDraftCommentV1 = z.infer<typeof DraftCommentSchema>;

export type DurableAnchorV1Dto = z.infer<typeof DurableAnchorV1Schema>;
export type AnchorVerificationDto = z.infer<typeof AnchorVerificationSchema>;
