import type { FastifyInstance } from 'fastify';

import type { DatabasePool } from '../db.js';
import { InstallationIdSchema, InstallationStatusSchema } from '../schema.js';

export function registerInstallationRoutes(app: FastifyInstance, pool: DatabasePool): void {
  app.get('/healthz', async () => ({ status: 'ok' }));
  app.get('/v1/installations/:installationId/status', async (request, reply) => {
    const parsed = InstallationIdSchema.safeParse((request.params as { installationId?: unknown }).installationId);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid-installation' });
    try {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT installation_id FROM installation_bindings WHERE installation_id = $1', [parsed.data]);
        return InstallationStatusSchema.parse({ status: result.rows.length === 1 ? 'verified' : 'unverified' });
      } finally {
        client.release();
      }
    } catch {
      return reply.code(503).send({ error: 'status-unavailable' });
    }
  });
}
