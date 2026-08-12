import Fastify, { type FastifyInstance } from 'fastify';

import type { SupportServiceConfig } from './config.js';
import type { DatabasePool } from './db.js';
import { createRecoveryEmailSender } from './email.js';
import { createPostgresRecoveryStore } from './recovery-store.js';
import { registerInstallationRoutes } from './routes/installations.js';
import { registerRecoveryRoutes } from './routes/recovery.js';
import { registerStripeWebhookRoute, type StripeWebhookPort } from './routes/stripe-webhook.js';

export interface SupportAppDependencies {
  pool: DatabasePool;
  stripe: StripeWebhookPort;
}

export async function createSupportApp(config: SupportServiceConfig, dependencies: SupportAppDependencies): Promise<FastifyInstance> {
  const app = Fastify({ logger: false, bodyLimit: 1024 * 1024 });
  registerInstallationRoutes(app, dependencies.pool);
  registerStripeWebhookRoute(app, config, dependencies.pool, dependencies.stripe);
  registerRecoveryRoutes(app, config, createPostgresRecoveryStore(dependencies.pool), createRecoveryEmailSender(config));
  await app.ready();
  return app;
}
