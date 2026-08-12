import Stripe from 'stripe';

import { createSupportApp } from './app.js';
import { loadSupportServiceConfig } from './config.js';
import { createDatabasePool } from './db.js';

const config = loadSupportServiceConfig();
const pool = createDatabasePool(config.databaseUrl);
const stripe = new Stripe(config.stripeApiKey);
const app = await createSupportApp(config, { pool, stripe });

const close = async () => {
  await app.close();
  await pool.end();
};
process.once('SIGINT', () => void close());
process.once('SIGTERM', () => void close());
await app.listen({ host: config.host, port: config.port });
