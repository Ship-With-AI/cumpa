import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import pg from 'pg';

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');
const directory = new URL('../migrations/', import.meta.url);
const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
try {
  await client.query('SELECT pg_advisory_lock(432408102)');
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
  for (const name of (await readdir(directory)).filter((file) => /^\d+_.+\.sql$/.test(file)).sort()) {
    const sql = await readFile(join(directory.pathname, name), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const known = await client.query('SELECT checksum FROM schema_migrations WHERE name = $1', [name]);
    if (known.rowCount !== 0) {
      if (known.rows[0].checksum !== checksum) throw new Error(`migration checksum mismatch: ${name}`);
      continue;
    }
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)', [name, checksum]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
} finally {
  await client.query('SELECT pg_advisory_unlock(432408102)').catch(() => undefined);
  await client.end();
}
