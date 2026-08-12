import { createHmac } from 'node:crypto';

import { describe, expect, test } from 'vitest';

import { emailLookup, normalizeEmail } from '../src/fulfillment.js';
import { createRecoveryService, type RecoveryChallenge, type RecoveryStore } from '../src/recovery.js';

const config = { emailLookupHmacKey: 'email-key', recoveryTokenHmacKey: 'token-key' };
const installationA = 'a'.repeat(43);
const installationB = 'b'.repeat(43);
const installationC = 'c'.repeat(43);

function store(): RecoveryStore & { bindings: Map<string, number>; challenges: Map<string, RecoveryChallenge> } {
  const bindings = new Map<string, number>();
  const challenges = new Map<string, RecoveryChallenge>();
  return {
    bindings,
    challenges,
    async create(challenge) { challenges.set(challenge.challengeId, challenge); },
    async inspect(hash, now) {
      const challenge = [...challenges.values()].find((item) => item.magicTokenHash?.equals(hash));
      return !challenge || challenge.expiresAt <= now ? 'expired' : challenge.state;
    },
    async lookupEntitlement(lookup) { return Buffer.compare(lookup, emailLookup('paid@example.test', config.emailLookupHmacKey)) === 0 ? 1 : null; },
    async incrementLimit() { return false; },
    async status(challengeId, hash, now) {
      const challenge = challenges.get(challengeId);
      return !challenge || !challenge.pollTokenHash.equals(hash) ? null : challenge.expiresAt <= now ? 'expired' : challenge.state;
    },
    async consume(hash, now) {
      const challenge = [...challenges.values()].find((item) => item.magicTokenHash?.equals(hash));
      if (!challenge || challenge.expiresAt <= now || challenge.consumedAt || !challenge.entitlementId) return false;
      challenge.consumedAt = now;
      challenge.state = 'verified';
      bindings.set(challenge.installationId, challenge.entitlementId);
      return true;
    },
  };
}

function service(memory: ReturnType<typeof store>, sent: string[], now: () => Date = () => new Date('2026-01-01T00:00:00.000Z')) {
  let next = 0;
  return createRecoveryService(config, memory, { now, randomBytes: () => Buffer.alloc(32, ++next), wait: async () => undefined, send: ({ magicToken }) => { sent.push(magicToken); } });
}

describe('recovery service', () => {
  test('canonicalizes NFKC trim lowercase then retains only its HMAC', async () => {
    expect(normalizeEmail(' ＰＡＩＤ@ＥＸＡＭＰＬＥ．ＴＥＳＴ ')).toBe('paid@example.test');
    const memory = store();
    await service(memory, []).request({ installationId: installationA, email: ' PAID@EXAMPLE.TEST ', sourceIp: '127.0.0.1' });
    const challenge = [...memory.challenges.values()][0]!;
    expect(challenge.emailLookup).toEqual(createHmac('sha256', config.emailLookupHmacKey).update('paid@example.test').digest());
    expect(JSON.stringify(challenge)).not.toContain('PAID@EXAMPLE');
  });

  test('normalizes paid and unknown requests while issuing independent 256-bit credentials', async () => {
    let millisecondsWaited = 0;
    const sent: string[] = [];
    let next = 0;
    const recovery = createRecoveryService(config, store(), { now: () => new Date('2026-01-01T00:00:00.000Z'), randomBytes: () => Buffer.alloc(32, ++next), wait: async (milliseconds) => { millisecondsWaited += milliseconds; }, send: ({ magicToken }) => { sent.push(magicToken); } });
    const paid = await recovery.request({ installationId: installationA, email: 'paid@example.test', sourceIp: '127.0.0.1' });
    const unknown = await recovery.request({ installationId: installationB, email: 'unknown@example.test', sourceIp: '127.0.0.1' });
    expect(paid).toEqual({ kind: 'accepted', challengeId: expect.any(String), pollToken: expect.any(String), expiresAt: expect.any(String) });
    expect(unknown).toEqual(expect.objectContaining({ kind: 'accepted' }));
    expect(paid.pollToken).not.toBe(unknown.pollToken);
    expect(sent).toHaveLength(1);
    expect(millisecondsWaited).toBe(2400);
  });

  test('GET is inert and only one POST binds the requesting installation', async () => {
    const memory = store();
    const sent: string[] = [];
    const recovery = service(memory, sent);
    const accepted = await recovery.request({ installationId: installationA, email: 'paid@example.test', sourceIp: '127.0.0.1' });
    expect(await recovery.inspect(sent[0]!)).toBe('pending');
    await expect(Promise.all([recovery.consume(sent[0]!), recovery.consume(sent[0]!)])).resolves.toEqual([true, false]);
    expect(memory.bindings).toEqual(new Map([[installationA, 1]]));
    expect(await recovery.getStatus(accepted.challengeId, accepted.pollToken)).toBe('verified');
  });

  test('restores unlimited installations but rejects expiration and invalid input', async () => {
    let time = new Date('2026-01-01T00:00:00.000Z');
    const memory = store();
    const sent: string[] = [];
    const recovery = service(memory, sent, () => time);
    for (const installationId of [installationB, installationC]) {
      await recovery.request({ installationId, email: 'paid@example.test', sourceIp: '127.0.0.1' });
      expect(await recovery.consume(sent.at(-1)!)).toBe(true);
    }
    await recovery.request({ installationId: installationA, email: 'paid@example.test', sourceIp: '127.0.0.1' });
    time = new Date('2026-01-01T00:15:00.001Z');
    expect(await recovery.consume(sent.at(-1)!)).toBe(false);
    await expect(recovery.request({ installationId: 'bad', email: 'x'.repeat(321), sourceIp: '127.0.0.1' })).rejects.toThrow();
  });
});
