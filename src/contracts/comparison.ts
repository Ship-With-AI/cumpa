import { z } from 'zod';

export const GitObjectIdSchema = z
  .string()
  .regex(/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/);

export const BranchSourceIdentitySchema = z.strictObject({
  kind: z.literal('branch'),
  id: z.string().min(1),
  refName: z.string().min(1),
});

export const WorktreeSourceIdentitySchema = z.strictObject({
  kind: z.literal('worktree'),
  id: z.string().min(1),
  path: z.string().min(1),
  detached: z.boolean(),
  dirty: z.boolean(),
});

export const SelectedSourceIdentitySchema = z.discriminatedUnion('kind', [
  BranchSourceIdentitySchema,
  WorktreeSourceIdentitySchema,
]);

export const ComparisonSelectionSchema = z.strictObject({
  label: z.string().min(1),
  revision: z.string().min(1),
  source: SelectedSourceIdentitySchema.optional(),
});

export const PinnedEndpointSchema = z.strictObject({
  label: z.string().min(1),
  oid: GitObjectIdSchema,
  source: SelectedSourceIdentitySchema.optional(),
});

export const ExactPathSchema = z
  .strictObject({
    bytesBase64url: z.string().regex(/^[A-Za-z0-9_-]+$/),
    display: z.string(),
    utf8: z.string().optional(),
  })
  .readonly();

export const ChangedFileStatusKindSchema = z.enum([
  'added',
  'copied',
  'deleted',
  'modified',
  'renamed',
  'type-changed',
  'unsupported',
]);

export const ChangedFileStatusSchema = z
  .strictObject({
    code: z.string().regex(/^[A-Z]$/),
    kind: ChangedFileStatusKindSchema,
    similarity: z.number().int().min(0).max(100).nullable(),
  })
  .readonly();

export const GitModeSchema = z.string().regex(/^[0-7]{6}$/);

export const ChangedFileSchema = z
  .strictObject({
    id: z.string().regex(/^file_[A-Za-z0-9_-]{43}$/),
    status: ChangedFileStatusSchema,
    oldMode: GitModeSchema,
    newMode: GitModeSchema,
    oldBlobOid: GitObjectIdSchema,
    newBlobOid: GitObjectIdSchema,
    oldPath: ExactPathSchema.optional(),
    newPath: ExactPathSchema.optional(),
    additions: z.number().int().nonnegative().nullable(),
    deletions: z.number().int().nonnegative().nullable(),
    unsupportedReason: z.string().min(1).optional(),
  })
  .readonly();

export const PinnedComparisonSchema = z.strictObject({
  repositoryRoot: z.string().min(1),
  objectFormat: z.enum(['sha1', 'sha256']),
  base: PinnedEndpointSchema,
  head: PinnedEndpointSchema,
  mergeBaseOid: GitObjectIdSchema,
  changedFiles: z.array(ChangedFileSchema).readonly(),
  hasCommittedChanges: z.boolean(),
});

export type ComparisonSelection = z.infer<typeof ComparisonSelectionSchema>;
export type PinnedComparison = z.infer<typeof PinnedComparisonSchema>;
export type ExactPathDto = z.infer<typeof ExactPathSchema>;
export type ChangedFileStatusKind = z.infer<
  typeof ChangedFileStatusKindSchema
>;
export type ChangedFileStatus = z.infer<typeof ChangedFileStatusSchema>;
export type ChangedFile = z.infer<typeof ChangedFileSchema>;
