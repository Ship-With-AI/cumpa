import { z } from "zod";

export const SupportActionSchema = z.enum(["support", "restore"]);
export const InstallationIdSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/u);
export const SupportStartRequestSchema = z.strictObject({
  action: SupportActionSchema,
  installationId: InstallationIdSchema,
});
export const CheckoutMetadataSchema = z.strictObject({
  user_id: z.uuid(),
  installation_id: InstallationIdSchema,
  intent_id: z.uuid(),
});
