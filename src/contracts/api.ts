import { z } from 'zod';

import {
  AvailabilitySchema,
  ChangedFileStatusKindSchema,
  ExactPathSchema,
  GitModeSchema,
  GitObjectIdSchema,
} from './comparison.js';

export const OpaqueFileIdSchema = z.string().regex(/^file_[A-Za-z0-9_-]{43}$/);

const ApiPinnedEndpointSchema = z
  .strictObject({
    label: z.string().min(1),
    oid: GitObjectIdSchema,
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
export type ApiError = z.infer<typeof ApiErrorSchema>;
