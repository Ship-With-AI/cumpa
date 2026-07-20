import { resolve } from 'node:path';

import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';

import type { PinnedComparison } from '../contracts/comparison.js';

export interface CreateSessionAppOptions {
  readonly webRoot?: string;
}

export function createSessionApp(
  comparison: PinnedComparison,
  options: CreateSessionAppOptions = {},
): FastifyInstance {
  const app = Fastify({ logger: false });
  const webRoot = options.webRoot ?? resolve(import.meta.dirname, '../web');

  app.get('/api/session', async () => comparison);
  void app.register(fastifyStatic, {
    root: webRoot,
    index: ['index.html'],
  });

  return app;
}
