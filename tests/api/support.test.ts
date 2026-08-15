import Fastify from 'fastify';
import { describe, expect, test, vi } from 'vitest';

import * as contracts from '../../src/contracts/api.js';
import { createSupportCapability } from '../../src/server/capabilities.js';
import type { CapabilityRegistry } from '../../src/server/capabilities.js';
import { createHostedSupportClient } from '../../src/server/support-client.js';
import type { HostedSupportClient } from '../../src/server/support-client.js';
import type { SupportStateV1, SupportStore } from '../../src/server/support-store.js';
import { registerSessionRoutes } from '../../src/server/routes.js';

const installationId = 'a'.repeat(43);
const serviceUrl = 'https://support.example.test';

function supportStore(status: 'unverified' | 'verified' = 'unverified') {
  let state: SupportStateV1 = status === 'verified'
    ? { version: 1, installationId, status, verifiedAt: '2026-08-15T00:00:00.000Z' }
    : { version: 1, installationId, status };
  const markVerified = vi.fn(async (verifiedAt: string) => {
    state = { ...state, status: 'verified', verifiedAt };
    return state;
  });
  const store: SupportStore = {
    canonicalPath: '/tmp/support.json',
    state: async () => state,
    markVerified,
  };
  return { store, markVerified };
}

describe('hosted support contracts', () => {
  test('accept only a strict support or restore action', () => {
    expect(contracts.SupportActionSchema.safeParse('support').success).toBe(true);
    expect(contracts.SupportActionSchema.safeParse('restore').success).toBe(true);
    expect(contracts.SupportActionSchema.safeParse('checkout').success).toBe(false);
    expect(contracts.SupportStartRequestSchema.safeParse({ action: 'support', installationId }).success).toBe(false);
    expect(contracts.SupportStartResultSchema.safeParse({ kind: 'ready', flowUrl: 'https://support.example.test/flow' }).success).toBe(true);
    expect(contracts.SupportStartResultSchema.safeParse({ kind: 'ready', flowUrl: 'http://support.example.test/flow' }).success).toBe(false);
    expect(contracts.SupportStatusSchema.safeParse({ status: 'verified', email: 'payer@example.test' }).success).toBe(false);
  });

  test('posts the server-owned installation ID only to the configured HTTPS capability', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ flowUrl: `${serviceUrl}/functions/v1/support-flow?intent=1` })));
    const client = createHostedSupportClient({ serviceUrl, fetch: fetch as typeof globalThis.fetch });

    await expect(client.start('support', installationId)).resolves.toEqual({ flowUrl: `${serviceUrl}/functions/v1/support-flow?intent=1` });
    expect(fetch).toHaveBeenCalledWith(
      `${serviceUrl}/functions/v1/support-api/start`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ action: 'support', installationId }),
      }),
    );
  });

  test('fails closed for malformed, oversized, cross-origin, and aborted hosted responses', async () => {
    const oversized = createHostedSupportClient({
      serviceUrl,
      fetch: (async () => new Response('{}', { headers: { 'content-length': '8193' } })) as typeof globalThis.fetch,
    });
    await expect(oversized.start('support', installationId)).resolves.toBeUndefined();

    const crossOrigin = createHostedSupportClient({
      serviceUrl,
      fetch: (async () => new Response(JSON.stringify({ flowUrl: 'https://attacker.example.test/flow' }))) as typeof globalThis.fetch,
    });
    await expect(crossOrigin.start('restore', installationId)).resolves.toBeUndefined();

    let rejectRequest: ((reason?: unknown) => void) | undefined;
    const aborted = createHostedSupportClient({
      serviceUrl,
      fetch: ((_input, init) => new Promise<Response>((_resolve, reject) => {
        rejectRequest = reject;
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      })) as typeof globalThis.fetch,
    });
    const pending = aborted.status(installationId);
    aborted.close();
    rejectRequest?.(new Error('aborted'));
    await expect(pending).resolves.toBeUndefined();
  });

  test('starts hosted flow without treating it as support authority', async () => {
    const { store, markVerified } = supportStore();
    const client: HostedSupportClient = {
      start: vi.fn(async () => ({ flowUrl: `${serviceUrl}/functions/v1/support-flow?intent=1` })),
      status: vi.fn(async () => 'unverified'),
      close: vi.fn(),
    };
    const capability = createSupportCapability(store, client);

    await expect(capability.start('restore')).resolves.toEqual({ kind: 'ready', flowUrl: `${serviceUrl}/functions/v1/support-flow?intent=1` });
    expect(client.start).toHaveBeenCalledWith('restore', installationId);
    expect(markVerified).not.toHaveBeenCalled();
    await expect(capability.refresh()).resolves.toEqual({ status: 'unverified' });
    expect(markVerified).not.toHaveBeenCalled();
  });

  test('only refresh can monotonically promote hosted verified status and existing verified state remains local', async () => {
    const { store, markVerified } = supportStore('verified');
    const client: HostedSupportClient = {
      start: vi.fn(async () => ({ flowUrl: `${serviceUrl}/functions/v1/support-flow?intent=1` })),
      status: vi.fn(async () => 'unverified'),
      close: vi.fn(),
    };
    const capability = createSupportCapability(store, client);

    await expect(capability.status()).resolves.toEqual({ status: 'verified' });
    expect(client.status).not.toHaveBeenCalled();
    await expect(capability.refresh()).resolves.toEqual({ status: 'verified' });
    expect(markVerified).not.toHaveBeenCalled();
  });

  test('exposes only action start, status, and refresh loopback routes', async () => {
    const { store } = supportStore();
    const capability = createSupportCapability(store, {
      start: async () => undefined,
      status: async () => undefined,
      close: () => undefined,
    });
    const app = Fastify();
    registerSessionRoutes(app, { support: capability } as CapabilityRegistry);

    await expect(app.inject({
      method: 'POST',
      url: '/api/support/start',
      payload: { action: 'support' },
    })).resolves.toMatchObject({ statusCode: 200, json: expect.any(Function) });
    await expect(app.inject({ method: 'POST', url: '/api/support/checkout' })).resolves.toMatchObject({ statusCode: 404 });
    await expect(app.inject({ method: 'POST', url: '/api/support/recovery' })).resolves.toMatchObject({ statusCode: 404 });
    await expect(app.inject({
      method: 'POST',
      url: '/api/support/start',
      payload: { action: 'checkout' },
    })).resolves.toMatchObject({ statusCode: 400 });
    await app.close();
  });

  test('removes legacy checkout and recovery exports', () => {
    expect(contracts).not.toHaveProperty('SupportCheckoutResultSchema');
    expect(contracts).not.toHaveProperty('SupportRecoveryRequestSchema');
    expect(contracts).not.toHaveProperty('SupportRecoveryResultSchema');
    expect(contracts).not.toHaveProperty('SupportRecoveryStatusSchema');
  });
});
