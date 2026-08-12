import { describe, expect, test, vi } from 'vitest';

import { createSupportApp } from '../src/app.js';

const installationId = 'i'.repeat(43);

function config() {
  return {
    nodeEnv: 'production', host: '0.0.0.0', port: 3000,
    databaseUrl: 'postgresql://not-a-production-host/support', stripeApiKey: 'not-a-production-key',
    stripeWebhookSecret: 'test-webhook-secret', stripePriceId: 'price_test_4999', stripePaymentLinkId: 'plink_test_fixed',
    emailLookupHmacKey: 'test-email-lookup-key', recoveryTokenHmacKey: 'test-recovery-key',
    publicBaseUrl: 'https://support.invalid', resendApiKey: 'not-a-production-key', emailFrom: 'support@example.invalid',
  } as const;
}

async function appWithBindings(bindings = new Set<string>()) {
  return createSupportApp(config(), {
    pool: {
      connect: vi.fn().mockResolvedValue({
        query: vi.fn().mockImplementation((query: string, values: unknown[]) =>
          query.includes('installation_bindings') ? Promise.resolve({ rows: bindings.has(String(values[0])) ? [{ installation_id: values[0] }] : [] }) : Promise.resolve({ rows: [] })),
        release: vi.fn(),
      }),
    } as never,
    stripe: {} as never,
  });
}

describe('public installation status', () => {
  test('returns only verified or unverified for strict installation IDs', async () => {
    const app = await appWithBindings(new Set([installationId]));
    expect((await app.inject({ method: 'GET', url: `/v1/installations/${installationId}/status` })).json()).toEqual({ status: 'verified' });
    expect((await app.inject({ method: 'GET', url: `//v1/installations/${'u'.repeat(43)}/status` })).statusCode).toBe(404);
    expect((await app.inject({ method: 'GET', url: `/v1/installations/${'u'.repeat(43)}/status` })).json()).toEqual({ status: 'unverified' });
    expect((await app.inject({ method: 'GET', url: '/v1/installations/invalid/status' })).statusCode).toBe(400);
    await app.close();
  });

  test('health does not reveal database or configuration details', async () => {
    const app = await appWithBindings();
    const response = await app.inject({ method: 'GET', url: '/healthz' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
    expect(response.body).not.toContain('postgres');
    await app.close();
  });
});
