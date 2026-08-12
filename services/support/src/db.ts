import { Pool, type PoolClient } from 'pg';

export type DatabasePool = Pick<Pool, 'connect' | 'end'>;
export type DatabaseClient = Pick<PoolClient, 'query' | 'release'>;

export function createDatabasePool(databaseUrl: string): Pool {
  return new Pool({ connectionString: databaseUrl });
}

export async function withTransaction<T>(pool: DatabasePool, operation: (client: DatabaseClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const value = await operation(client);
    await client.query('COMMIT');
    return value;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
