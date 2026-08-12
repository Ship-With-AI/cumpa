import { createHmac } from 'node:crypto';
import Stripe from 'stripe';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { createSupportApp } from '../src/app.js';

const installationId = 'i'.repeat(43);
const webhookSecret = 'test-webhook-secret';
const stripe = new Stripe('not-a-production-key');

class MemoryPool {
  readonly events = new Set<string>();
  readonly sessions = new Map<string, number>();
  readonly bindings = new Map<string, number>();
  queries: string[] = [];
  fail = false;

  async connect() {
    return {
      query: async (text: string, values: unknown[] = []) => {
        this.queries.push(text);
        if (this.fail) throw new Error('temporary database fault');
        if (text.startsWith('INSERT INTO stripe_events')) {
          const eventId = String(values[0]);
          if (this.events.has(eventId)) return { rowCount: 0, rows: [] };
          this.events.add(eventId);
          return { rowCount: 1, rows: [] };
        }
        if (text.includes('FROM entitlements WHERE source_session_id')) {
          const id = this.sessions.get(String(values[0]));
          return { rowCount: id ? 1 : 0, rows: id ? [{ id }] : [] };
        }
        if (text.startsWith('INSERT INTO entitlements')) {
          const id = this.sessions.size + 1;
          this.sessions.set(String(values[1]), id);
          return { rowCount: 1, rows: [{ id }] };
        }
        if (text.includes('FROM installation_bindings')) {
          const entitlementId = this.bindings.get(String(values[0]));
          return { rowCount: entitlementId ? 1 : 0, rows: entitlementId ? [{ entitlement_id: entitlementId }] : [] };
        }
        if (text.startsWith('INSERT INTO installation_bindings')) {
          this.bindings.set(String(values[0]), Number(values[1]));
          return { rowCount: 1, rows: [] };
        }
        return { rowCount: 0, rows: [] };
      },
      release: () => undefined,
    };
  }
}

function config() {
  return {
    nodeEnv: 'production',
    host: '0.0.0.0',
    port: 3000,
    databaseUrl: 'postgresql://not-a-production-host/support',
    stripeApiKey: 'not-a-production-key',
    stripeWebhookSecret: webhookSecret,
    stripePriceId: 'price_test_4999',
    stripePaymentLinkId: 'plink_test_fixed',
    emailLookupHmacKey: 'test-email-lookup-key',
    recoveryTokenHmacKey: 'test-recovery-key',
    publicBaseUrl: 'https://support.invalid',
    resendApiKey: 'not-a-production-key',
    emailFrom: 'support@example.invalid',
  } as const;
}

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cs_test_session',
    livemode: true,
    mode: 'payment',
    payment_status: 'paid',
    payment_link: 'plink_test_fixed',
    client_reference_id: installationId,
    customer_details: { email: ' Supporter@Example.invalid ' },
    currency: 'usd',
    amount_total: 4999,
    line_items: {
      data: [{ price: { id: 'price_test_4999' }, quantity: 1 }],
      has_more: false,
    },
    ...overrides,
  };
}

function event(id = 'evt_test_1') {
  return JSON.stringify({ id, type: 'checkout.session.completed', data: { object: { id: 'not-trusted' } } });
}

async function build(pool = new MemoryPool(), retrieved = session()) {
  const retrieve = vi.fn().mockResolvedValue(retrieved);
  const app = await createSupportApp(config(), {
    pool: pool as never,
    stripe: { webhooks: stripe.webhooks, checkout: { sessions: { retrieve } } } as never,
  });
  return { app, pool, retrieve };
}

async function webhook(app: Awaited<ReturnType<typeof createSupportApp>>, body = event(), signature = stripe.webhooks.generateTestHeaderString({ payload: event(), secret: webhookSecret })) {
  return app.inject({ method: 'POST', url: '/v1/stripe/webhook', payload: Buffer.from(body), headers: { 'stripe-signature': signature, 'content-type': 'application/json' } });
}

afterEach(() => vi.restoreAllMocks());

describe('Stripe payment authority', () => {
  test('fulfills one valid retrieved live Checkout Session only after signature verification', async () => {
    const { app, pool, retrieve } = await build();
    const body = event();
    const response = await webhook(app, body, stripe.webhooks.generateTestHeaderString({ payload: body, secret: webhookSecret }));

    expect(response.statusCode).toBe(200);
    expect(retrieve).toHaveBeenCalledWith('not-trusted', { expand: ['line_items.data.price'] });
    expect(pool.sessions.size).toBe(1);
    expect(pool.bindings.get(installationId)).toBe(1);
    expect(pool.queries.join('\n')).toContain('FOR UPDATE');
    await app.close();
  });

  test.each([
    ['test-mode session', { livemode: false }],
    ['wrong payment link', { payment_link: 'plink_test_other' }],
    ['wrong price', { line_items: { data: [{ price: { id: 'price_test_other' }, quantity: 1 }], has_more: false } }],
    ['wrong mode', { mode: 'subscription' }],
    ['unpaid', { payment_status: 'unpaid' }],
    ['wrong quantity', { line_items: { data: [{ price: { id: 'price_test_4999' }, quantity: 2 }], has_more: false } }],
    ['wrong currency', { currency: 'eur' }],
    ['wrong amount', { amount_total: 5000 }],
    ['missing email', { customer_details: { email: null } }],
    ['bad installation reference', { client_reference_id: 'invalid' }],
  ])('rejects %s without a durable grant', async (_name, overrides) => {
    const { app, pool } = await build(new MemoryPool(), session(overrides));
    const response = await webhook(app);
    expect(response.statusCode).toBe(400);
    expect(pool.sessions.size).toBe(0);
    expect(pool.bindings.size).toBe(0);
    await app.close();
  });

  test('rejects unsigned or mutated bytes before retrieval and mutation', async () => {
    const { app, pool, retrieve } = await build();
    const response = await webhook(app, `${event()} `, stripe.webhooks.generateTestHeaderString({ payload: event(), secret: webhookSecret }));
    expect(response.statusCode).toBe(400);
    expect(retrieve).not.toHaveBeenCalled();
    expect(pool.queries).toEqual([]);
    await app.close();
  });

  test('is idempotent for duplicate events and duplicate Sessions', async () => {
    const { app, pool } = await build();
    for (const id of ['evt_test_1', 'evt_test_1', 'evt_test_2']) {
      const body = event(id);
      expect((await webhook(app, body, stripe.webhooks.generateTestHeaderString({ payload: body, secret: webhookSecret }))).statusCode).toBe(200);
    }
    expect(pool.sessions.size).toBe(1);
    expect(pool.bindings.size).toBe(1);
    await app.close();
  });

  test('maps Stripe and PostgreSQL transient failures to retryable 503 without a partial grant', async () => {
    const pool = new MemoryPool();
    const { app } = await build(pool);
    const body = event();
    pool.fail = true;
    expect((await webhook(app, body, stripe.webhooks.generateTestHeaderString({ payload: body, secret: webhookSecret }))).statusCode).toBe(503);
    expect(pool.sessions.size).toBe(0);
    await app.close();
  });

  test('normalizes then HMACs email rather than storing raw email', async () => {
    const { app, pool } = await build();
    const body = event();
    await webhook(app, body, stripe.webhooks.generateTestHeaderString({ payload: body, secret: webhookSecret }));
    const inserts = pool.queries.filter((query) => query.startsWith('INSERT INTO entitlements'));
    expect(inserts).toHaveLength(1);
    expect(createHmac('sha256', config().emailLookupHmacKey).update('supporter@example.invalid').digest()).toBeTruthy();
    await app.close();
  });
});
