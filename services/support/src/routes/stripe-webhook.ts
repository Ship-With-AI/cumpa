import type { FastifyInstance } from 'fastify';

import type { SupportServiceConfig } from '../config.js';
import type { DatabasePool } from '../db.js';
import { fulfillCheckoutSession, type StripeSessionRetriever } from '../fulfillment.js';

export interface StripeWebhookPort {
  webhooks: { constructEvent(payload: Buffer, signature: string, secret: string): { id: string; type: string; data: { object: unknown } } };
  checkout: { sessions: StripeSessionRetriever };
}

export function registerStripeWebhookRoute(app: FastifyInstance, config: SupportServiceConfig, pool: DatabasePool, stripe: StripeWebhookPort): void {
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_request, body, done) => done(null, body));
  app.post('/v1/stripe/webhook', async (request, reply) => {
    const signature = request.headers['stripe-signature'];
    if (typeof signature !== 'string' || !Buffer.isBuffer(request.body)) return reply.code(400).send({ error: 'invalid-webhook' });
    let event: { id: string; type: string; data: { object: unknown } };
    try {
      event = stripe.webhooks.constructEvent(request.body, signature, config.stripeWebhookSecret);
    } catch {
      return reply.code(400).send({ error: 'invalid-webhook' });
    }
    if (!event.data.object || typeof event.data.object !== 'object' || !('id' in event.data.object) || typeof event.data.object.id !== 'string') return reply.code(400).send({ error: 'invalid-webhook' });
    if (event.type !== 'checkout.session.completed') return reply.code(200).send({ received: true });
    try {
      await fulfillCheckoutSession(event.id, event.type, event.data.object.id, stripe.checkout.sessions, pool, config);
      return reply.code(200).send({ received: true });
    } catch (error) {
      return reply.code(error instanceof Error && ['invalid-payment-session', 'installation-already-bound'].includes(error.message) ? 400 : 503).send({ error: 'webhook-unavailable' });
    }
  });
}
