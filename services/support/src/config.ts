import { z } from 'zod';

const required = z.string().min(1);

export const SupportServiceConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'production']),
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  databaseUrl: z.string().url(),
  stripeApiKey: required,
  stripeWebhookSecret: required,
  stripePriceId: required,
  stripePaymentLinkId: required,
  emailLookupHmacKey: required,
  recoveryTokenHmacKey: required,
  publicBaseUrl: z.string().url(),
  resendApiKey: required,
  emailFrom: z.string().email(),
}).strict();

export type SupportServiceConfig = Readonly<z.infer<typeof SupportServiceConfigSchema>>;

export function loadSupportServiceConfig(environment: NodeJS.ProcessEnv = process.env): SupportServiceConfig {
  return Object.freeze(SupportServiceConfigSchema.parse({
    nodeEnv: environment.NODE_ENV ?? 'production',
    host: environment.HOST ?? '0.0.0.0',
    port: Number(environment.PORT ?? '3000'),
    databaseUrl: environment.DATABASE_URL,
    stripeApiKey: environment.STRIPE_API_KEY,
    stripeWebhookSecret: environment.STRIPE_WEBHOOK_SECRET,
    stripePriceId: environment.STRIPE_PRICE_ID,
    stripePaymentLinkId: environment.STRIPE_PAYMENT_LINK_ID,
    emailLookupHmacKey: environment.EMAIL_LOOKUP_HMAC_KEY,
    recoveryTokenHmacKey: environment.RECOVERY_TOKEN_HMAC_KEY,
    publicBaseUrl: environment.PUBLIC_BASE_URL,
    resendApiKey: environment.RESEND_API_KEY,
    emailFrom: environment.EMAIL_FROM,
  }));
}
