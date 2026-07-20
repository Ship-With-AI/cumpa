import { resolve } from 'node:path';

import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';

import type { PinnedComparison } from '../contracts/comparison.js';
import { createCapabilityRegistry, type CapabilityRegistryOptions } from './capabilities.js';
import { registerSessionRoutes } from './routes.js';
import {
  registerSessionSecurity,
  type SecurityDiagnostic,
  type SessionSecurityTarget,
} from './security.js';

export interface CreateSessionAppOptions extends CapabilityRegistryOptions {
  readonly sessionToken: string;
  readonly webRoot?: string;
  readonly diagnostics?: (diagnostic: SecurityDiagnostic) => void;
}

export interface SessionApp extends FastifyInstance {
  bindSessionSecurity(target: SessionSecurityTarget): void;
}

export function createSessionApp(
  comparison: PinnedComparison,
  options: CreateSessionAppOptions,
): SessionApp {
  const app = Fastify({
    logger: false,
    ajv: { customOptions: { removeAdditional: false } },
  }) as unknown as SessionApp;
  const webRoot = options.webRoot ?? resolve(import.meta.dirname, '../web');
  const capabilities = createCapabilityRegistry(comparison, options);
  const security = registerSessionSecurity(app, options);

  app.decorate('bindSessionSecurity', security.bind);
  registerSessionRoutes(app, capabilities);
  void app.register(fastifyStatic, {
    root: webRoot,
    index: ['index.html'],
  });

  return app;
}
