import { createHmac } from 'node:crypto';

import type { SupportServiceConfig } from './config.js';
import type { DatabasePool } from './db.js';
import { withTransaction } from './db.js';
import { InstallationIdSchema } from './schema.js';

export interface StripeSessionRetriever {
  retrieve(id: string, options: { expand: string[] }): Promise<unknown>;
}

interface RetrievedSession {
  id: string;
  livemode: boolean;
  mode: string;
  payment_status: string;
  payment_link: string | { id: string } | null;
  client_reference_id: string | null;
  customer_details: { email: string | null } | null;
  currency: string | null;
  amount_total: number | null;
  line_items: { data: Array<{ price: { id: string } | null; quantity: number | null }>; has_more: boolean };
}

export function normalizeEmail(email: string): string {
  return email.normalize('NFKC').trim().toLowerCase();
}

export function emailLookup(email: string, key: string): Buffer {
  return createHmac('sha256', key).update(normalizeEmail(email)).digest();
}

function paymentLinkId(value: RetrievedSession['payment_link']): string | null {
  return typeof value === 'string' ? value : value?.id ?? null;
}

function sessionInvariant(session: unknown, config: SupportServiceConfig): RetrievedSession | null {
  const value = session as Partial<RetrievedSession>;
  if (value.livemode !== true || value.mode !== 'payment' || value.payment_status !== 'paid' || paymentLinkId(value.payment_link ?? null) !== config.stripePaymentLinkId || value.currency !== 'usd' || value.amount_total !== 4999 || !value.id || !value.client_reference_id || !InstallationIdSchema.safeParse(value.client_reference_id).success || !value.customer_details?.email) return null;
  const lineItems = value.line_items;
  if (!lineItems || lineItems.has_more || lineItems.data.length !== 1) return null;
  const [line] = lineItems.data;
  if (line?.price?.id !== config.stripePriceId || line.quantity !== 1) return null;
  return value as RetrievedSession;
}

export async function fulfillCheckoutSession(eventId: string, eventType: string, checkoutSessionId: string, retrieve: StripeSessionRetriever, pool: DatabasePool, config: SupportServiceConfig): Promise<'fulfilled' | 'ignored'> {
  const session = sessionInvariant(await retrieve.retrieve(checkoutSessionId, { expand: ['line_items.data.price'] }), config);
  if (!session) throw new Error('invalid-payment-session');
  return withTransaction(pool, async (client) => {
    const event = await client.query('INSERT INTO stripe_events (event_id, event_type, object_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING event_id', [eventId, eventType, session.id]);
    if (event.rowCount === 0) return 'ignored';
    const existing = await client.query('SELECT id FROM entitlements WHERE source_session_id = $1 FOR UPDATE', [session.id]);
    const entitlementId = existing.rows[0]?.id ?? (await client.query('INSERT INTO entitlements (email_lookup, source_session_id) VALUES ($1, $2) RETURNING id', [emailLookup(session.customer_details!.email!, config.emailLookupHmacKey), session.id])).rows[0]!.id;
    const binding = await client.query('SELECT entitlement_id FROM installation_bindings WHERE installation_id = $1 FOR UPDATE', [session.client_reference_id]);
    if (binding.rowCount === 0) await client.query("INSERT INTO installation_bindings (installation_id, entitlement_id, verified_at, source) VALUES ($1, $2, now(), 'payment')", [session.client_reference_id, entitlementId]);
    else if (Number(binding.rows[0]!.entitlement_id) !== Number(entitlementId)) throw new Error('installation-already-bound');
    return 'fulfilled';
  });
}
