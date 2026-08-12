import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { emailLookup, normalizeEmail } from './fulfillment.js';
import { InstallationIdSchema } from './schema.js';

const RECOVERY_LIFETIME_MS = 15 * 60 * 1000;
const RESPONSE_FLOOR_MS = 1200;

export type RecoveryState = 'pending' | 'verified' | 'expired';

export interface RecoveryChallenge {
  challengeId: string;
  pollTokenHash: Buffer;
  magicTokenHash: Buffer | null;
  installationId: string;
  entitlementId: number | null;
  expiresAt: Date;
  consumedAt: Date | null;
  state: 'pending' | 'verified';
  emailLookup: Buffer;
}

export interface RecoveryStore {
  create(challenge: RecoveryChallenge): Promise<void>;
  inspect(magicTokenHash: Buffer, now: Date): Promise<RecoveryState>;
  lookupEntitlement(lookup: Buffer): Promise<number | null>;
  incrementLimit(scope: 'ip' | 'email', lookup: Buffer, windowStart: Date, maximum: number): Promise<boolean>;
  status(challengeId: string, pollTokenHash: Buffer, now: Date): Promise<RecoveryState | null>;
  consume(magicTokenHash: Buffer, now: Date): Promise<boolean>;
}

export interface RecoveryEmailSender {
  send(input: { email: string; magicToken: string; expiresAt: Date }): Promise<void>;
}

export interface RecoverySeams {
  now?: () => Date;
  randomBytes?: (size: number) => Buffer;
  wait?: (milliseconds: number) => Promise<void>;
  send: RecoveryEmailSender['send'];
}

export interface RecoveryConfig {
  emailLookupHmacKey: string;
  recoveryTokenHmacKey: string;
}

function digest(value: string, key: string): Buffer {
  return createHmac('sha256', key).update(value).digest();
}

function accepted(challenge: RecoveryChallenge, pollToken: string) {
  return { kind: 'accepted' as const, challengeId: challenge.challengeId, pollToken, expiresAt: challenge.expiresAt.toISOString() };
}

export function createRecoveryService(config: RecoveryConfig, store: RecoveryStore, seams: RecoverySeams) {
  const now = seams.now ?? (() => new Date());
  const random = seams.randomBytes ?? randomBytes;
  const wait = seams.wait ?? ((milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));

  return {
    async request(input: { installationId: string; email: string; sourceIp: string }) {
      const startedAt = now().getTime();
      if (!InstallationIdSchema.safeParse(input.installationId).success || [...input.email].length > 320 || !input.email.includes('@')) throw new Error('invalid-recovery-request');
      const normalized = normalizeEmail(input.email);
      if (normalized.length === 0) throw new Error('invalid-recovery-request');
      const lookup = emailLookup(normalized, config.emailLookupHmacKey);
      const [ipLimited, emailLimited, entitlementId] = await Promise.all([
        store.incrementLimit('ip', digest(input.sourceIp, config.recoveryTokenHmacKey), new Date(Math.floor(startedAt / 3_600_000) * 3_600_000), 5),
        store.incrementLimit('email', lookup, new Date(Math.floor(startedAt / 900_000) * 900_000), 3),
        store.lookupEntitlement(lookup),
      ]);
      const pollToken = random(32).toString('base64url');
      const magicToken = random(32).toString('base64url');
      const challenge: RecoveryChallenge = {
        challengeId: random(32).toString('base64url'),
        pollTokenHash: digest(pollToken, config.recoveryTokenHmacKey),
        magicTokenHash: entitlementId && !ipLimited && !emailLimited ? digest(magicToken, config.recoveryTokenHmacKey) : null,
        installationId: input.installationId,
        entitlementId: entitlementId && !ipLimited && !emailLimited ? entitlementId : null,
        expiresAt: new Date(startedAt + RECOVERY_LIFETIME_MS),
        consumedAt: null,
        state: 'pending',
        emailLookup: lookup,
      };
      await store.create(challenge);
      if (challenge.entitlementId) await Promise.resolve(seams.send({ email: normalized, magicToken, expiresAt: challenge.expiresAt })).catch(() => undefined);
      const remaining = RESPONSE_FLOOR_MS - (now().getTime() - startedAt);
      if (remaining > 0) await wait(remaining);
      return accepted(challenge, pollToken, null);
    },
    async getStatus(challengeId: string, pollToken: string): Promise<RecoveryState | null> {
      return store.status(challengeId, digest(pollToken, config.recoveryTokenHmacKey), now());
    },
    async inspect(magicToken: string): Promise<RecoveryState> {
      return store.inspect(digest(magicToken, config.recoveryTokenHmacKey), now());
    },
    async consume(magicToken: string): Promise<boolean> {
      const tokenHash = digest(magicToken, config.recoveryTokenHmacKey);
      return store.consume(tokenHash, now());
    },
    tokenMatches(left: Buffer, right: Buffer): boolean {
      return left.length === right.length && timingSafeEqual(left, right);
    },
  };
}
