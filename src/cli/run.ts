import { randomBytes } from 'node:crypto';

import open from 'open';
import { z } from 'zod';

import { confirmPinnedComparison } from './confirm.js';
import {
  pickOrderedSources,
  type PickerRecoveryOptions,
} from './picker.js';
import {
  ComparisonSelectionSchema,
  type ComparisonSelection,
  type PinnedComparison,
} from '../contracts/comparison.js';
import type {
  OrderedSources,
  SourceCandidate,
  WorktreeCandidate,
} from '../domain/source.js';
import { isLaunchError, type LaunchError } from '../domain/errors.js';
import { discoverSourceCandidates } from '../git/candidates.js';
import {
  createPinnedComparison,
  type CreatePinnedComparisonOptions,
} from '../git/comparison.js';
import { createSessionApp, type SessionApp } from '../server/app.js';
import type { DraftRevealPort } from '../server/capabilities.js';
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

const browserFallback =
  'Open the URL above if the browser did not open. Press Ctrl+C to stop.';

export interface LaunchPinnedSessionDependencies {
  readonly openBrowser?: (url: string) => Promise<unknown>;
  readonly revealDraftFile?: DraftRevealPort;
  readonly output?: (message: string) => void;
  readonly signalSource?: ShutdownSignalSource;
  readonly setExitStatus?: (status: number) => void;
  readonly webRoot?: string;
}

export interface RunCliOptions {
  readonly cwd: string;
}

export interface RunCliDependencies {
  readonly discoverCandidates?: (
    options: RunCliOptions,
  ) => Promise<readonly SourceCandidate[]>;
  readonly pickSources?: (
    options: {
      readonly candidates: readonly SourceCandidate[];
      readonly suggestedHeadId?: string;
      readonly initialBase?: SourceCandidate;
      readonly initialHead?: SourceCandidate;
      readonly recovery?: PickerRecoveryOptions;
    },
  ) => Promise<OrderedSources>;
  readonly createDescriptor?: (
    options: CreatePinnedComparisonOptions,
  ) => Promise<PinnedComparison>;
  readonly confirmComparison?: (
    comparison: PinnedComparison,
  ) => Promise<'back' | 'launch'>;
  readonly launchComparison?: (
    comparison: PinnedComparison,
  ) => Promise<unknown>;
  readonly output?: (message: string) => void;
  readonly setExitStatus?: (status: number) => void;
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

interface LaunchRuntime {
  readonly activeGit: AbortController;
  readonly launch: (
    comparison: PinnedComparison,
  ) => Promise<PinnedSessionLaunch | undefined>;
  readonly fail: (error: unknown) => Promise<undefined>;
}

function createLaunchRuntime(
  dependencies: LaunchPinnedSessionDependencies,
): LaunchRuntime {
  const activeGit = new AbortController();
  const output = dependencies.output ?? console.log;
  const openBrowser =
    dependencies.openBrowser ??
    (async (url: string) => {
      await open(url);
    });
  const revealDraftFile =
    dependencies.revealDraftFile ??
    (async (canonicalPath: string) => {
      await open(canonicalPath);
    });
  let app: SessionApp | undefined;
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

  const fail = async (error: unknown): Promise<undefined> => {
    if (shutdown.isShuttingDown) {
      await shutdown.shutdown();
      return undefined;
    }
    await shutdown.shutdown(1);
    throw error;
  };

  const launch = async (
    comparison: PinnedComparison,
  ): Promise<PinnedSessionLaunch | undefined> => {
    try {
      if (shutdown.isShuttingDown) {
        await shutdown.shutdown();
        return undefined;
      }

      const token = randomBytes(32).toString('base64url');
      app = createSessionApp(comparison, {
        webRoot: dependencies.webRoot,
        sessionToken: token,
        revealDraftFile,
        diagnostics: ({ correlationId, reason }) => {
          console.error(`Diff Review request denied [${correlationId}]: ${reason}.`);
        },
      });
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
        throw new Error(
          'Fastify did not bind the required IPv4 loopback address',
        );
      }
      const authority = `127.0.0.1:${address.port}`;
      app.bindSessionSecurity({
        expectedHost: authority,
        expectedOrigin: `http://${authority}`,
      });
      const url = `http://${authority}/#token=${token}`;

      output(url);
      output(browserFallback);
      try {
        await openBrowser(url);
      } catch {
        output(
          'Browser did not open automatically. Open the URL above manually.',
        );
      }

      return { comparison, shutdown, url };
    } catch (error) {
      return await fail(error);
    }
  };

  return { activeGit, launch, fail };
}

export async function launchPinnedComparison(
  comparison: PinnedComparison,
  dependencies: LaunchPinnedSessionDependencies = {},
): Promise<PinnedSessionLaunch | undefined> {
  return await createLaunchRuntime(dependencies).launch(comparison);
}

export async function launchPinnedSession(
  options: CreatePinnedComparisonOptions,
  dependencies: LaunchPinnedSessionDependencies = {},
): Promise<PinnedSessionLaunch | undefined> {
  const runtime = createLaunchRuntime(dependencies);
  let comparison: PinnedComparison;
  try {
    comparison = await createComparisonLaunchDescriptor({
      ...options,
      signal:
        options.signal === undefined
          ? runtime.activeGit.signal
          : AbortSignal.any([options.signal, runtime.activeGit.signal]),
    });
  } catch (error) {
    return await runtime.fail(error);
  }
  return await runtime.launch(comparison);
}

function selectionForCandidate(
  candidate: SourceCandidate,
): ComparisonSelection {
  if (candidate.kind === 'branch') {
    return {
      label: candidate.label,
      revision: candidate.refName,
      source: {
        kind: 'branch',
        id: candidate.id,
        refName: candidate.refName,
      },
    };
  }
  return selectionForWorktree(candidate);
}

function selectionForWorktree(
  candidate: WorktreeCandidate,
): ComparisonSelection {
  if (
    candidate.availability === 'unavailable' ||
    candidate.commitOid === undefined
  ) {
    throw new Error(
      `Unavailable worktree cannot be selected: ${candidate.path}`,
    );
  }
  return {
    label: candidate.label,
    revision: candidate.commitOid,
    source: {
      kind: 'worktree',
      id: candidate.id,
      path: candidate.path,
      detached: candidate.detached,
      dirty: candidate.availability === 'dirty',
    },
  };
}

function reportFatalLaunchError(
  error: LaunchError,
  output: (message: string) => void,
  setExitStatus: (status: number) => void,
): void {
  output(error.message);
  setExitStatus(1);
}

export async function runCli(
  options: RunCliOptions,
  dependencies: RunCliDependencies = {},
): Promise<void> {
  const discoverCandidates =
    dependencies.discoverCandidates ?? discoverSourceCandidates;
  const pickSources = dependencies.pickSources ?? pickOrderedSources;
  const createDescriptor =
    dependencies.createDescriptor ?? createComparisonLaunchDescriptor;
  const confirmComparison =
    dependencies.confirmComparison ?? confirmPinnedComparison;
  const launchComparison =
    dependencies.launchComparison ?? launchPinnedComparison;
  const output = dependencies.output ?? console.error;
  const setExitStatus =
    dependencies.setExitStatus ??
    ((status: number) => {
      process.exitCode = status;
    });

  let candidates: readonly SourceCandidate[];
  try {
    candidates = await discoverCandidates(options);
  } catch (error) {
    if (!isLaunchError(error) || error.recovery.kind !== 'exit') {
      throw error;
    }
    reportFatalLaunchError(error, output, setExitStatus);
    return;
  }

  const suggestedHead = candidates.find(
    (candidate) =>
      candidate.kind === 'worktree' &&
      candidate.isCurrentCheckout &&
      candidate.availability !== 'unavailable',
  );
  let initialBase: SourceCandidate | undefined;
  let initialHead: SourceCandidate | undefined;
  let recovery: PickerRecoveryOptions | undefined;

  while (true) {
    const selected = await pickSources({
      candidates,
      ...(suggestedHead === undefined
        ? {}
        : { suggestedHeadId: suggestedHead.id }),
      ...(initialBase === undefined ? {} : { initialBase }),
      ...(initialHead === undefined ? {} : { initialHead }),
      ...(recovery === undefined ? {} : { recovery }),
    });
    let comparison: PinnedComparison;
    try {
      comparison = await createDescriptor({
        cwd: options.cwd,
        base: selectionForCandidate(selected.base),
        head: selectionForCandidate(selected.head),
      });
    } catch (error) {
      if (!isLaunchError(error)) {
        throw error;
      }
      output(error.message);
      if (error.recovery.kind === 'exit') {
        setExitStatus(1);
        return;
      }

      try {
        candidates = await discoverCandidates(options);
      } catch (discoveryError) {
        if (
          !isLaunchError(discoveryError) ||
          discoveryError.recovery.kind !== 'exit'
        ) {
          throw discoveryError;
        }
        reportFatalLaunchError(discoveryError, output, setExitStatus);
        return;
      }

      const failedCandidate = selected[error.recovery.role];
      const focusedCandidateId = candidates.some(
        (candidate) => candidate.id === failedCandidate.id,
      )
        ? failedCandidate.id
        : undefined;
      initialBase =
        error.recovery.preserve === 'base' ? selected.base : undefined;
      initialHead =
        error.recovery.preserve === 'head' ? selected.head : undefined;
      recovery = {
        role: error.recovery.role,
        focusedCandidateId,
        searchTerm: '',
      };
      continue;
    }

    const action = await confirmComparison(comparison);
    if (action === 'back') {
      initialBase = selected.base;
      initialHead = undefined;
      recovery = undefined;
      continue;
    }

    await launchComparison(comparison);
    return;
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
    await runCli({ cwd: process.cwd() });
    return;
  }
  const launchOptions = packagedLaunchOptionsSchema.parse(
    JSON.parse(serializedLaunchOptions),
  );
  await launchPinnedSession(launchOptions);
}
