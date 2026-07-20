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

export const PinnedComparisonSchema = z.strictObject({
  repositoryRoot: z.string().min(1),
  objectFormat: z.enum(['sha1', 'sha256']),
  base: PinnedEndpointSchema,
  head: PinnedEndpointSchema,
  mergeBaseOid: GitObjectIdSchema,
  hasCommittedChanges: z.boolean(),
});

export type ComparisonSelection = z.infer<typeof ComparisonSelectionSchema>;
export type PinnedComparison = z.infer<typeof PinnedComparisonSchema>;
