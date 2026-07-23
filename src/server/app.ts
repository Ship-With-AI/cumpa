import * as fs from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';

import type { PinnedComparison } from '../contracts/comparison.js';
import { createCapabilityRegistry, type CapabilityRegistryOptions } from './capabilities.js';
import {
  createDraftStore,
  type DraftFileSystem,
  type DraftStore,
} from './draft-store.js';
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

type TestRecoveryFailure = 'backup' | 'replacement';

function testRecoveryFailure(): TestRecoveryFailure | undefined {
  if (process.env.NODE_ENV !== 'test') {
    return undefined;
  }

  const configured = process.env.DIFF_REVIEW_TEST_RECOVERY_FAILURE;
  return configured === 'backup' || configured === 'replacement' ? configured : undefined;
}

function createRecoveryFaultFileSystem(failure: TestRecoveryFailure): DraftFileSystem {
  return {
    readFile: async (path) => fs.readFile(path),
    mkdir: async (path) => {
      await fs.mkdir(path, { recursive: true });
    },
    open: async (path, flags, mode) => {
      if (
        (failure === 'backup' && path.endsWith('.bak')) ||
        (failure === 'replacement' && path.endsWith('.tmp'))
      ) {
        throw new Error('Test-only recovery persistence failure.');
      }

      const handle = await fs.open(path, flags, mode);
      return {
        writeFile: async (bytes) => handle.writeFile(bytes),
        sync: async () => handle.sync(),
        close: async () => handle.close(),
      };
    },
    rename: async (from, to) => fs.rename(from, to),
    unlink: async (path) => fs.unlink(path),
    syncDirectory: async (path) => {
      const handle = await fs.open(path, 'r');
      try {
        await handle.sync();
      } finally {
        await handle.close();
      }
    },
  };
}

function createAppDraftStore(
  comparison: PinnedComparison,
  options: CreateSessionAppOptions,
): DraftStore {
  if (options.draftStore !== undefined) {
    return options.draftStore;
  }

  const failure = testRecoveryFailure();
  return createDraftStore({
    repositoryRoot: comparison.repositoryRoot,
    comparison: {
      baseCommitOid: comparison.base.oid,
      headCommitOid: comparison.head.oid,
      mergeBaseOid: comparison.mergeBaseOid,
    },
    ...(failure === undefined ? {} : { fileSystem: createRecoveryFaultFileSystem(failure) }),
  });
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
  const draftStore = createAppDraftStore(comparison, options);
  const capabilities = createCapabilityRegistry(comparison, { ...options, draftStore });
  const security = registerSessionSecurity(app, options);

  app.decorate('bindSessionSecurity', security.bind);
  registerSessionRoutes(app, capabilities);
  void app.register(fastifyStatic, {
    root: webRoot,
    index: ['index.html'],
  });

  return app;
}
