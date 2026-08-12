import { z } from 'zod';

export const InstallationIdSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const InstallationStatusSchema = z.object({ status: z.enum(['unverified', 'verified']) }).strict();
export type InstallationStatus = z.infer<typeof InstallationStatusSchema>;
