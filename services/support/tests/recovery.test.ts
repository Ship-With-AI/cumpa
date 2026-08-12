import { createHmac } from 'node:crypto';

import { afterEach, describe, expect, test, vi } from 'vitest';

import { emailLookup, normalizeEmail } from '../src/fulfillment.js';
import { createRecoveryService, type RecoveryStore } from '../src/recovery.js';

const config = {
  emailLookupHmacKey: 'email-key',
  recoveryTokenHmacKey: 'token-key',
  publicBaseUrl: 'https://support.example.test',
  resendApiKey: 'resend-key',
  emailFrom: 'support@example.test',
};
const installationA = 'a'.repeat(43);
const installationB = 'b'.repeat(43);
const installationC = 'c'.repeat(43);

function store(): RecoveryStore & { bindings: Map<string, number>; challenges: Map<string, unknown> } {
  const bindings = new Map<string, number>();
  const challenges = new Map<string, any>();
  return {
    bindings,
    challenges,
    async create(challenge) { challenges.set(challenge.challengeId, challenge); },
    async lookupEntitlement(lookup) { return Buffer.compare(lookup, emailLookup('paid@example.test', config.emailLookupHmacKey)) === 0 ? 1 : null; },
    async incrementLimit() { return false; },
    async status(challengeId, pollTokenHash, now) {
      const challenge = challenges.get(challengeId);
      if (!challenge || !challenge.pollTokenHash.equals(pollTokenHash)) return null;
      return challenge.expiresAt <= now ? 'expired' : challenge.state;
    },
    async consume(magicTokenHash, now) {
      const challenge = [...challenges.values()].find((item) => item.magicTokenHash?.equals(magicTokenHash));
      if (!challenge || challenge.expiresAt <= now || challenge.consumedAt) return false;
      challenge.consumedAt = now;
      challenge.state = 'verified';
      if (challenge.entitlementId) bindings.set(challenge.installationId, challenge.entitlementId);
      return Boolean(challenge.entitlementId);
    },
  };
}

describe('recovery service', () => {
  afterEach(() => vi.restoreAllMocks());

  test('canonicalizes before HMAC lookup and never retains raw email', async () => {
    expect(normalizeEmail('  PAID@EXAMPLE.TEST  ')).toBe('paid@example.test');
    expect(normalizeEmail('ＰＡＩＤ@ＥＸＡＭＰＬＥ．ＴＥＳＴ')).toBe('paid@example.test');
    const memory = store();
    const service = createRecoveryService(config, memory, { now: () => new Date('2026-01-01T00:00:00.000Z'), randomBytes: () => Buffer.alloc(32, 7), wait: async () => undefined, send: vi.fn() });
    await service.request({ installationId: installationA, email: '  PAID@EXAMPLE.TEST  ', sourceIp: '127.0.0.1' });
    expect(JSON.stringify([...memory.challenges.values()])).not.toContain('PAID@EXAMPLE');
    expect([...memory.challenges.values()][0]).toMatchObject({ emailLookup: createHmac('sha256', config.emailLookupHmacKey).update('paid@example.test').digest() });
  });

  test('returns indistinguishable accepted requests with independent 256-bit secrets and a timing floor', async () => {
    let step = 0;
    const now = new Date('2026-01-01T00:00:00.000Z');
    const clock = vi.fn(() => new Date(now.getTime() + step));
    const send = vi.fn().mockResolvedValue(undefined);
    const service = createRecoveryService(config, store(), { now: clock, randomBytes: () => Buffer.alloc(32, ++step), wait: async (milliseconds) => { step += milliseconds; }, send });
    const paid = await service.request({ installationId: installationA, email: 'paid@example.test', sourceIp: '127.0.0.1' });
    const unknown = await service.request({ installationId: installationB, email: 'unknown@example.test', sourceIp: '127.0.0.1' });
    expect(paid).toEqual({ kind: 'accepted', challengeId: expect.any(String), pollToken: expect.any(String), expiresAt: '2026-01-01T00:15:00.000Z' });
    expect(unknown).toEqual(expect.objectContaining({ kind: 'accepted' }));
    expect(paid.pollToken).not.toBe(unknown.pollToken);
    expect(paid.challengeId).not.toBe(unknown.challengeId);
    expect(send).toHaveBeenCalledTimes(1);
    expect(step).toBeGreaterThanOrEqual(1200);
  });

  test('GET-equivalent lookup is inert while one POST binds only its requested installation', async () => {
    const memory = store();
    let next = 0;
    const service = createRecoveryService(config, memory, { now: () => new Date('2026-01-01T00:00:00.000Z'), randomBytes: () => Buffer.alloc(32, ++next), wait: async () => undefined, send: vi.fn() });
    const accepted = await service.request({ installationId: installationA, email: 'paid@example.test', sourceIp: '127.0.0.1' });
    expect(await service.inspect(accepted.magicToken!)).toBe('pending');
    expect(memory.bindings).toEqual(new Map());
    await expect(Promise.all([service.consume(accepted.magicToken!), service.consume(accepted.magicToken!)]))
      .resolves.toEqual([true, false]);
    expect(memory.bindings).toEqual(new Map([[installationA, 1]]));
    expect(await service.getStatus(accepted.challengeId, accepted.pollToken)).toBe('verified');
  });

  test('permits independent restores without transfers and rejects expired or malformed input', async () => {
    let time = new Date('2026-01-01T00:00:00.000Z');
    let next = 0;
    const memory = store();
    const service = createRecoveryService(config, memory, { now: () => time, randomBytes: () => Buffer.alloc(32, ++next), wait: async () => undefined, send: vi.fn() });
    for (const installationId of [installationB, installationC]) {
      const accepted = await service.request({ installationId, email: 'paid@example.test', sourceIp: '127.0.0.1' });
      expect(await service.consume(accepted.magicToken!)).toBe(true);
    }
    const expired = await service.request({ installationId: installationA, email: 'paid@example.test', sourceIp: '127.0.0.1' });
    time = new Date('2026-01-01T00:15:00.001Z');
    expect(await service.consume(expired.magicToken!)).toBe(false);
    await expect(service.request({ installationId: 'bad', email: 'x'.repeat(321), sourceIp: '127.0.0.1' })).rejects.toThrow();
  });
});
