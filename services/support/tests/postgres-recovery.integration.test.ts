import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const databaseUrl = process.env.TEST_DATABASE_URL;
const enabled = databaseUrl ? describe : describe.skip;
let pool: Pool;

enabled('PostgreSQL recovery schema', () => {
  beforeAll(() => { pool = new Pool({ connectionString: databaseUrl }); });
  afterAll(async () => { await pool.end(); });

  test('migration creates hashed recovery constraints', async () => {
    const sql = await readFile(resolve(import.meta.dirname, '../migrations/001_init.sql'), 'utf8');
    expect(sql).toContain('CREATE TABLE recovery_challenges');
    expect(sql).toContain('CREATE TABLE recovery_rate_limits');
    const tables = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    expect(tables.rows.map((row) => row.tablename)).toEqual(expect.arrayContaining(['recovery_challenges', 'recovery_rate_limits']));
  });

  test('row lock supports exactly one recovery consumption', async () => {
    await pool.query("INSERT INTO entitlements (email_lookup, source_session_id) VALUES ($1, $2)", [Buffer.alloc(32, 1), 'session-recovery']);
    await expect(pool.query("INSERT INTO recovery_challenges (challenge_id, poll_token_hash, magic_token_hash, installation_id, entitlement_id, email_lookup, expires_at, state) VALUES ($1, $2, $3, $4, 1, $5, now() + interval '15 minutes', 'pending')", ['challenge', Buffer.alloc(32, 2), Buffer.alloc(32, 3), 'a'.repeat(43), Buffer.alloc(32, 4)])).resolves.toBeDefined();
    await expect(pool.query("UPDATE recovery_challenges SET consumed_at = now(), state = 'verified' WHERE challenge_id = $1 AND consumed_at IS NULL RETURNING challenge_id", ['challenge'])).resolves.toMatchObject({ rowCount: 1 });
    await expect(pool.query("UPDATE recovery_challenges SET consumed_at = now(), state = 'verified' WHERE challenge_id = $1 AND consumed_at IS NULL RETURNING challenge_id", ['challenge'])).resolves.toMatchObject({ rowCount: 0 });
  });
});
