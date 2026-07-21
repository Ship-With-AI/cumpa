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

export type DurableAnchorV1Dto = z.infer<typeof DurableAnchorV1Schema>;
export type AnchorVerificationDto = z.infer<typeof AnchorVerificationSchema>;
