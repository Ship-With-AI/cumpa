import { z } from 'zod';

export const GitObjectIdSchema = z
  .string()
  .regex(/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/);

export const ComparisonSelectionSchema = z.strictObject({
  label: z.string().min(1),
  revision: z.string().min(1),
});

export const PinnedEndpointSchema = z.strictObject({
  label: z.string().min(1),
  oid: GitObjectIdSchema,
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
