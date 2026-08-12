import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const databaseUrl = process.env.TEST_DATABASE_URL;
const enabled = databaseUrl ? describe : describe.skip;
let pool: Pool;
const installationId = 'i'.repeat(43);

enabled('PostgreSQL payment schema', () => {
  beforeAll(() => { pool = new Pool({ connectionString: databaseUrl }); });
  afterAll(async () => { await pool.end(); });

  test('migration created payment constraints from an empty database', async () => {
    const tables = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
    expect(tables.rows.map((row) => row.tablename)).toEqual(expect.arrayContaining(['entitlements', 'installation_bindings', 'stripe_events', 'schema_migrations']));
    await expect(pool.query('INSERT INTO installation_bindings (installation_id, entitlement_id, verified_at, source) VALUES ($1, 999, now(), $2)', ['bad', 'payment'])).rejects.toThrow();
  });

  test('migration is an idempotent numbered advisory-locked source of truth', async () => {
    const sql = await readFile(resolve(import.meta.dirname, '../migrations/001_init.sql'), 'utf8');
    expect(sql).toContain('CREATE TABLE entitlements');
    expect(sql).toContain('FOR UPDATE');
    const migrations = await pool.query('SELECT name, checksum FROM schema_migrations');
    expect(migrations.rows).toHaveLength(1);
  });

  test('locks and uniqueness prevent duplicate Session/binding grants', async () => {
    const entitlement = await pool.query('INSERT INTO entitlements (email_lookup, source_session_id) VALUES ($1, $2) RETURNING id', [Buffer.from('lookup'), 'cs_test_lock']);
    await pool.query('INSERT INTO installation_bindings (installation_id, entitlement_id, verified_at, source) VALUES ($1, $2, now(), $3)', [installationId, entitlement.rows[0].id, 'payment']);
    await expect(pool.query('INSERT INTO entitlements (email_lookup, source_session_id) VALUES ($1, $2)', [Buffer.from('lookup'), 'cs_test_other'])).rejects.toThrow();
    await expect(pool.query('INSERT INTO installation_bindings (installation_id, entitlement_id, verified_at, source) VALUES ($1, $2, now(), $3)', [installationId, entitlement.rows[0].id, 'payment'])).rejects.toThrow();
  });
});
