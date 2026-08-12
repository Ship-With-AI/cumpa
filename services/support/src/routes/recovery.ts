import type { FastifyInstance } from 'fastify';

import type { SupportServiceConfig } from '../config.js';
import type { RecoveryEmailSender, RecoveryStore } from '../recovery.js';
import { createRecoveryService } from '../recovery.js';

export function registerRecoveryRoutes(app: FastifyInstance, config: SupportServiceConfig, store: RecoveryStore, sender: RecoveryEmailSender): void {
  const recovery = createRecoveryService(config, store, { send: sender.send });
  app.post('/v1/recovery-requests', { bodyLimit: 2048 }, async (request, reply) => {
    const body = request.body;
    if (!body || typeof body !== 'object' || !('installationId' in body) || !('email' in body) || typeof body.installationId !== 'string' || typeof body.email !== 'string') return reply.code(400).send({ error: 'invalid-request' });
    try {
      const result = await recovery.request({ installationId: body.installationId, email: body.email, sourceIp: request.ip });
      return reply.code(202).send(result);
    } catch {
      return reply.code(400).send({ error: 'invalid-request' });
    }
  });
  app.get('/v1/recovery-requests/:challengeId/status', async (request, reply) => {
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    const params = request.params;
    if (!params || typeof params !== 'object' || !('challengeId' in params) || typeof params.challengeId !== 'string') return reply.code(404).send({ error: 'not-found' });
    const state = await recovery.getStatus(params.challengeId, token);
    return state ? { kind: state } : reply.code(404).send({ error: 'not-found' });
  });
  app.get('/v1/recovery/:magicToken', async (request, reply) => {
    const params = request.params;
    if (!params || typeof params !== 'object' || !('magicToken' in params) || typeof params.magicToken !== 'string') return reply.code(404).send();
    return reply.header('Cache-Control', 'no-store').header('Referrer-Policy', 'no-referrer').type('text/html').send(`<!doctype html><form method="post" action="/v1/recovery/${encodeURIComponent(params.magicToken)}/confirm"><button type="submit">Confirm</button></form>`);
  });
  app.post('/v1/recovery/:magicToken/confirm', async (request, reply) => {
    const params = request.params;
    const complete = Boolean(params && typeof params === 'object' && 'magicToken' in params && typeof params.magicToken === 'string' && await recovery.consume(params.magicToken));
    return reply.header('Cache-Control', 'no-store').header('Referrer-Policy', 'no-referrer').type('text/html').send(`<!doctype html><p>${complete ? 'Recovery complete.' : 'Recovery link expired.'}</p>`);
  });
}
