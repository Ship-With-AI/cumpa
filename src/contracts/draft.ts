import { z } from 'zod';

import { ExactPathSchema, GitObjectIdSchema } from './comparison.js';
import { decodeBase64url } from '../domain/path-bytes.js';

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

export const CURRENT_DRAFT_SCHEMA_VERSION = 1;

export const DraftVersionEnvelopeSchema = z
  .object({ schemaVersion: z.number().int().positive() })
  .passthrough()
  .readonly();

export const ReviewDraftV1Schema = z
  .strictObject({
    schemaVersion: z.literal(CURRENT_DRAFT_SCHEMA_VERSION),
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

function containsLoneSurrogate(value: unknown): boolean {
  if (typeof value === 'string') {
    return /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value);
  }
  if (Array.isArray(value)) return value.some(containsLoneSurrogate);
  if (value !== null && typeof value === 'object') return Object.values(value).some(containsLoneSurrogate);
  return false;
}

const ExportStringSchema = z.string().refine(
  (value) => !containsLoneSurrogate(value),
  'Strings must not contain lone UTF-16 surrogate code units.',
);

function hasRepositoryRelativePath(path: { readonly bytesBase64url: string; readonly display: string; readonly utf8?: string }): boolean {
  let bytes: Uint8Array;
  try {
    bytes = decodeBase64url(path.bytesBase64url);
  } catch {
    return false;
  }

  const values = [path.display, ...(path.utf8 === undefined ? [] : [path.utf8])];
  return (
    bytes.length > 0 &&
    bytes[0] !== 0x2f &&
    bytes[0] !== 0x5c &&
    values.every(
      (value) =>
        value.length > 0 &&
        !/^(?:[\\/]|[A-Za-z]:[\\/])/u.test(value) &&
        !value.split('/').some((segment) => segment === '.' || segment === '..'),
    )
  );
}

const ExportExactPathSchema = ExactPathSchema.superRefine((path, context) => {
  if (!hasRepositoryRelativePath(path)) {
    context.addIssue({ code: 'custom', message: 'Export paths must be repository-relative.' });
  }
});

const ExportCommentSchema = z
  .strictObject({
    id: CommentIdSchema,
    state: z.enum(['open', 'resolved']),
    body: CommentBodySchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    resolvedAt: z.string().datetime().nullable(),
    verification: AnchorVerificationSchema,
    anchor: DurableAnchorV1Schema,
  })
  .superRefine((comment, context) => {
    const hasResolvedAt = comment.resolvedAt !== null;
    if ((comment.state === 'resolved') !== hasResolvedAt) {
      context.addIssue({
        code: 'custom',
        message: 'Resolved comments require resolvedAt; open comments must not have it.',
        path: ['resolvedAt'],
      });
    }
    if (!hasRepositoryRelativePath(comment.anchor.path)) {
      context.addIssue({ code: 'custom', message: 'Anchor paths must be repository-relative.', path: ['anchor', 'path'] });
    }
  })
  .readonly();

const ExportFileSchema = z
  .strictObject({
    path: ExportExactPathSchema,
    comments: z.array(ExportCommentSchema).readonly(),
  })
  .readonly();

const ExportCountsSchema = z
  .strictObject({
    all: z.number().int().nonnegative(),
    openActionable: z.number().int().nonnegative(),
    openNeedsAttention: z.number().int().nonnegative(),
    resolved: z.number().int().nonnegative(),
  })
  .readonly();

const ExportEndpointSchema = z
  .strictObject({
    label: ExportStringSchema.min(1),
    launchOid: GitObjectIdSchema,
  })
  .readonly();

const ExportDriftEndpointSchema = z
  .strictObject({
    launchOid: GitObjectIdSchema,
    currentOid: GitObjectIdSchema.nullable(),
    status: z.enum(['unchanged', 'moved', 'unavailable']),
  })
  .superRefine((endpoint, context) => {
    if ((endpoint.status === 'unavailable') !== (endpoint.currentOid === null)) {
      context.addIssue({ code: 'custom', message: 'Unavailable drift endpoints have no current OID.', path: ['currentOid'] });
    }
    if (endpoint.status === 'unchanged' && endpoint.currentOid !== endpoint.launchOid) {
      context.addIssue({ code: 'custom', message: 'Unchanged drift endpoints retain their launch OID.', path: ['currentOid'] });
    }
  })
  .readonly();

export const ReviewExportV1Schema = z
  .strictObject({
    schemaVersion: z.literal(1),
    kind: z.literal('diff-review/export'),
    exportedAt: z.string().datetime(),
    acceptedDraftRevision: RevisionSchema,
    comparison: z
      .strictObject({
        selectedBase: ExportEndpointSchema,
        selectedHead: ExportEndpointSchema,
        mergeBaseOid: GitObjectIdSchema,
        comparisonKey: z.string().regex(/^[0-9a-f]{64}$/u),
      })
      .readonly(),
    drift: z
      .strictObject({
        observedAt: z.string().datetime(),
        acknowledged: z.boolean(),
        base: ExportDriftEndpointSchema,
        head: ExportDriftEndpointSchema,
      })
      .readonly(),
    summary: z.strictObject({ markdown: ExportStringSchema.nullable() }).readonly(),
    files: z.array(ExportFileSchema).readonly(),
    counts: ExportCountsSchema,
  })
  .superRefine((document, context) => {
    if (containsLoneSurrogate(document)) {
      context.addIssue({ code: 'custom', message: 'Export strings must not contain lone UTF-16 surrogate code units.' });
    }
    const comments = document.files.flatMap((file) => file.comments);
    const ids = new Set<string>();
    for (const [index, comment] of comments.entries()) {
      if (ids.has(comment.id)) {
        context.addIssue({ code: 'custom', message: 'Export comment IDs must be unique.', path: ['files', index] });
      }
      ids.add(comment.id);
    }

    const counts = {
      all: comments.length,
      openActionable: comments.filter((comment) => comment.state === 'open' && comment.verification.state === 'verified').length,
      openNeedsAttention: comments.filter((comment) => comment.state === 'open' && comment.verification.state !== 'verified').length,
      resolved: comments.filter((comment) => comment.state === 'resolved').length,
    };
    for (const key of Object.keys(counts) as Array<keyof typeof counts>) {
      if (document.counts[key] !== counts[key]) {
        context.addIssue({ code: 'custom', message: `Export count ${key} must match comment records.`, path: ['counts', key] });
      }
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
export type ReviewExportV1 = z.infer<typeof ReviewExportV1Schema>;
export type ReviewDraftCommentV1 = z.infer<typeof DraftCommentSchema>;
export type DraftMutation = z.infer<typeof DraftMutationSchema>;

export type DurableAnchorV1Dto = z.infer<typeof DurableAnchorV1Schema>;
export type AnchorVerificationDto = z.infer<typeof AnchorVerificationSchema>;
