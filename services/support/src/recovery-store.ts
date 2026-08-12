import type { DatabasePool } from './db.js';
import { withTransaction } from './db.js';
import type { RecoveryChallenge, RecoveryState, RecoveryStore } from './recovery.js';

export function createPostgresRecoveryStore(pool: DatabasePool): RecoveryStore {
  return {
    async create(challenge: RecoveryChallenge): Promise<void> {
      await withTransaction(pool, async (client) => {
        await client.query('INSERT INTO recovery_challenges (challenge_id, poll_token_hash, magic_token_hash, installation_id, entitlement_id, email_lookup, expires_at, consumed_at, state) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [challenge.challengeId, challenge.pollTokenHash, challenge.magicTokenHash, challenge.installationId, challenge.entitlementId, challenge.emailLookup, challenge.expiresAt, challenge.consumedAt, challenge.state]);
      });
    },
    async inspect(magicTokenHash: Buffer, now: Date): Promise<RecoveryState> {
      const client = await pool.connect();
      try {
        const result = await client.query("SELECT state, expires_at FROM recovery_challenges WHERE magic_token_hash = $1", [magicTokenHash]);
        if (result.rowCount !== 1 || result.rows[0]!.expires_at <= now) return 'expired';
        return result.rows[0]!.state;
      } finally { client.release(); }
    },
    async lookupEntitlement(lookup: Buffer): Promise<number | null> {
      const client = await pool.connect();
      try { return (await client.query('SELECT id FROM entitlements WHERE email_lookup = $1', [lookup])).rows[0]?.id ?? null; } finally { client.release(); }
    },
    async incrementLimit(scope, lookup, windowStart, maximum): Promise<boolean> {
      return withTransaction(pool, async (client) => {
        const result = await client.query('INSERT INTO recovery_rate_limits (scope, lookup, window_started_at, attempts) VALUES ($1, $2, $3, 1) ON CONFLICT (scope, lookup, window_started_at) DO UPDATE SET attempts = recovery_rate_limits.attempts + 1 RETURNING attempts', [scope, lookup, windowStart]);
        return result.rows[0]!.attempts > maximum;
      });
    },
    async status(challengeId, pollTokenHash, now): Promise<RecoveryState | null> {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT state, expires_at FROM recovery_challenges WHERE challenge_id = $1 AND poll_token_hash = $2', [challengeId, pollTokenHash]);
        if (result.rowCount !== 1) return null;
        return result.rows[0]!.expires_at <= now ? 'expired' : result.rows[0]!.state;
      } finally { client.release(); }
    },
    async consume(magicTokenHash, now): Promise<boolean> {
      return withTransaction(pool, async (client) => {
        const challenge = await client.query("SELECT installation_id, entitlement_id FROM recovery_challenges WHERE magic_token_hash = $1 AND consumed_at IS NULL AND expires_at > $2 FOR UPDATE", [magicTokenHash, now]);
        if (challenge.rowCount !== 1 || !challenge.rows[0]!.entitlement_id) return false;
        await client.query("UPDATE recovery_challenges SET consumed_at = $2, state = 'verified' WHERE magic_token_hash = $1", [magicTokenHash, now]);
        await client.query("INSERT INTO installation_bindings (installation_id, entitlement_id, verified_at, source) VALUES ($1, $2, $3, 'recovery') ON CONFLICT (installation_id) DO NOTHING", [challenge.rows[0]!.installation_id, challenge.rows[0]!.entitlement_id, now]);
        return true;
      });
    },
  };
}
