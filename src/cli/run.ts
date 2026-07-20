import { randomBytes } from 'node:crypto';

import open from 'open';
import { z } from 'zod';
import type { FastifyInstance } from 'fastify';

import {
  ComparisonSelectionSchema,
  type PinnedComparison,
} from '../contracts/comparison.js';
import {
  createPinnedComparison,
  type CreatePinnedComparisonOptions,
} from '../git/comparison.js';
import { createSessionApp } from '../server/app.js';
import {
  createShutdownController,
  type ShutdownController,
  type ShutdownSignalSource,
} from '../server/lifecycle.js';

const packagedLaunchOptionsSchema = z.strictObject({
  cwd: z.string().min(1),
  base: ComparisonSelectionSchema,
  head: ComparisonSelectionSchema,
});

const notYetWiredMessage =
  'Diff Review production entry reached; local session launch is not wired yet.';
const browserFallback =
  'Open the URL above if the browser did not open. Press Ctrl+C to stop.';

export interface LaunchPinnedSessionDependencies {
  readonly openBrowser?: (url: string) => Promise<unknown>;
  readonly output?: (message: string) => void;
  readonly signalSource?: ShutdownSignalSource;
  readonly setExitStatus?: (status: number) => void;
  readonly webRoot?: string;
}

export interface PinnedSessionLaunch {
  readonly comparison: PinnedComparison;
  readonly shutdown: ShutdownController;
  readonly url: string;
}

export async function createComparisonLaunchDescriptor(
  options: CreatePinnedComparisonOptions,
): Promise<PinnedComparison> {
  return await createPinnedComparison(options);
}

export async function launchPinnedSession(
  options: CreatePinnedComparisonOptions,
  dependencies: LaunchPinnedSessionDependencies = {},
): Promise<PinnedSessionLaunch | undefined> {
  const activeGit = new AbortController();
  const output = dependencies.output ?? console.log;
  const openBrowser =
    dependencies.openBrowser ??
    (async (url: string) => {
      await open(url);
    });
  let app: FastifyInstance | undefined;
  const shutdown = createShutdownController({
    signalSource: dependencies.signalSource,
    abortActiveWork: () => {
      activeGit.abort();
    },
    closeListener: async () => {
      if (app !== undefined) {
        await app.close();
      }
    },
    setExitStatus: dependencies.setExitStatus,
    reportError: (error) => {
      console.error('Diff Review shutdown failed.', error);
    },
  });

  try {
    const comparison = await createComparisonLaunchDescriptor({
      ...options,
      signal:
        options.signal === undefined
          ? activeGit.signal
          : AbortSignal.any([options.signal, activeGit.signal]),
    });
    if (shutdown.isShuttingDown) {
      await shutdown.shutdown();
      return undefined;
    }

    app = createSessionApp(comparison, { webRoot: dependencies.webRoot });
    await app.listen({ host: '127.0.0.1', port: 0 });
    if (shutdown.isShuttingDown) {
      await shutdown.shutdown();
      return undefined;
    }

    const address = app.server.address();
    if (
      address === null ||
      typeof address === 'string' ||
      address.address !== '127.0.0.1' ||
      address.port === 0
    ) {
      throw new Error('Fastify did not bind the required IPv4 loopback address');
    }
    const token = randomBytes(32).toString('base64url');
    const url = `http://127.0.0.1:${address.port}/#token=${token}`;

    output(url);
    output(browserFallback);
    try {
      await openBrowser(url);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      output(`Browser did not open automatically: ${detail}`);
    }

    return { comparison, shutdown, url };
  } catch (error) {
    if (shutdown.isShuttingDown) {
      await shutdown.shutdown();
      return undefined;
    }
    await shutdown.shutdown(1);
    throw error;
  }
}

export function run(): Promise<void>;
export function run(
  options: CreatePinnedComparisonOptions,
): Promise<PinnedComparison>;
export async function run(
  options?: CreatePinnedComparisonOptions,
): Promise<void | PinnedComparison> {
  if (options !== undefined) {
    return await createComparisonLaunchDescriptor(options);
  }

  const serializedLaunchOptions = process.env.DIFF_REVIEW_LAUNCH_OPTIONS;
  if (serializedLaunchOptions === undefined) {
    console.log(notYetWiredMessage);
    return;
  }
  const launchOptions = packagedLaunchOptionsSchema.parse(
    JSON.parse(serializedLaunchOptions),
  );
  await launchPinnedSession(launchOptions);
}
