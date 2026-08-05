import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { Command } from 'commander';

import open from 'open';
import { z } from 'zod';

import { confirmPinnedComparison } from './confirm.js';
import { AgentRequestError, readAgentReviewRequest } from './request.js';
import {
  pickOrderedSources,
  type PickerRecoveryOptions,
} from './picker.js';
import {
  ComparisonSelectionSchema,
  type GroundedExactPatch,
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
import type { SourceDiscovery } from '../git/candidates.js';
import {
  createPinnedComparison,
  createPinnedRangeComparison,
  type CreatePinnedComparisonOptions,
  type CreatePinnedRangeComparisonOptions,
} from '../git/comparison.js';
import {
  createGroundedExactPatch,
  ExactPatchGroundingError,
} from '../git/exact-patch.js';
import {
  createExactPatchSessionApp,
  createSessionApp,
  type SessionApp,
} from '../server/app.js';
import {
  createAttachedCompletionCoordinator,
  type AttachedCompletionCoordinator,
} from '../server/attached-completion.js';
import type { AttachedCompletionOptions } from '../server/capabilities.js';
import type { DraftRevealPort } from '../server/capabilities.js';
import { PatchSnapshotError } from '../server/patch-snapshot.js';
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

type CmuxCommandRunner = (
  executable: 'cmux',
  arguments_: readonly ['open', string],
) => Promise<unknown>;

export interface BrowserUrlOpenerDependencies {
  readonly environment?: NodeJS.ProcessEnv;
  readonly openSystemBrowser?: (url: string) => Promise<unknown>;
  readonly runCmux?: CmuxCommandRunner;
}

function runCmux(
  executable: 'cmux',
  arguments_: readonly ['open', string],
): Promise<void> {
  const { promise, reject, resolve } = Promise.withResolvers<void>();
  const child = spawn(executable, arguments_, { shell: false, stdio: 'ignore' });
  child.once('error', reject);
  child.once('close', (code) => {
    if (code === 0) {
      resolve();
      return;
    }
    reject(new Error('cmux could not open the browser URL'));
  });
  return promise;
}

export function createBrowserUrlOpener(
  dependencies: BrowserUrlOpenerDependencies = {},
): (url: string) => Promise<unknown> {
  const environment = dependencies.environment ?? process.env;
  const openSystemBrowser =
    dependencies.openSystemBrowser ??
    (async (url: string) => {
      await open(url);
    });
  const runCmuxCommand = dependencies.runCmux ?? runCmux;

  return async (url: string) => {
    if (environment.CMUX_WORKSPACE_ID !== undefined) {
      await runCmuxCommand('cmux', ['open', url]);
      return;
    }
    await openSystemBrowser(url);
  };
}

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
  ) => Promise<SourceDiscovery>;
  readonly pickSources?: (
    options: {
      readonly candidates: readonly SourceCandidate[];
      readonly searchBranches: SourceDiscovery['searchBranches'];
      readonly candidateEnrichment?: SourceDiscovery['candidateEnrichment'];
      readonly startCandidateEnrichment?: SourceDiscovery['startCandidateEnrichment'];
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

export interface OrdinaryActionDependencies {
  readonly isTTY?: boolean;
  readonly input?: AsyncIterable<Uint8Array>;
  readonly runCli?: (options: RunCliOptions) => Promise<void>;
  readonly readRequest?: typeof readAgentReviewRequest;
  readonly createRangeComparison?: (
    options: CreatePinnedRangeComparisonOptions,
  ) => Promise<PinnedComparison>;
  readonly createGroundedExactPatch?: typeof createGroundedExactPatch;
  readonly createSessionApp?: typeof createSessionApp;
  readonly createExactPatchSessionApp?: typeof createExactPatchSessionApp;
  readonly openBrowser?: (url: string) => Promise<unknown>;
  readonly webRoot?: string;
  readonly revealDraftFile?: DraftRevealPort;
  readonly output?: (message: string) => void;
  readonly stdout?: (bytes: Uint8Array) => Promise<void> | void;
  readonly signalSource?: ShutdownSignalSource;
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
  const openBrowser = dependencies.openBrowser ?? createBrowserUrlOpener();
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
      console.error('Compare shutdown failed.', error);
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
          console.error(`Compare request denied [${correlationId}]: ${reason}.`);
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
    (candidate.availability !== 'clean' &&
      candidate.availability !== 'dirty') ||
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

function writeStdout(bytes: Uint8Array): Promise<void> {
  const { promise, reject, resolve } = Promise.withResolvers<void>();
  process.stdout.write(bytes, (error) => {
    if (error === undefined || error === null) {
      resolve();
      return;
    }
    reject(error);
  });
  return promise;
}

function waitForAttachedOutcome(
  coordinator: AttachedCompletionCoordinator,
  signalSource: ShutdownSignalSource | undefined,
): Promise<Awaited<AttachedCompletionCoordinator['delivery']> | undefined> {
  const source = signalSource ?? process;
  const signal = Promise.withResolvers<undefined>();
  const onSignal = () => {
    signal.resolve(undefined);
  };
  source.on('SIGINT', onSignal);
  source.on('SIGTERM', onSignal);
  return Promise.race([coordinator.delivery, signal.promise]).finally(() => {
    source.off('SIGINT', onSignal);
    source.off('SIGTERM', onSignal);
  });
}

async function launchAttachedSession(
  dependencies: OrdinaryActionDependencies,
  activeGit: AbortController,
  createApp: (
    sessionToken: string,
    attachedCompletion: AttachedCompletionOptions,
    revealDraftFile: DraftRevealPort,
  ) => Promise<SessionApp>,
): Promise<void> {
  const output = dependencies.output ?? console.error;
  const openBrowser = dependencies.openBrowser ?? createBrowserUrlOpener();
  const stdout = dependencies.stdout ?? writeStdout;
  const revealDraftFile =
    dependencies.revealDraftFile ??
    (async (canonicalPath: string) => {
      await open(canonicalPath);
    });
  const coordinator = createAttachedCompletionCoordinator();
  let app: SessionApp | undefined;
  const shutdown = createShutdownController({
    signalSource: dependencies.signalSource,
    abortActiveWork: () => {
      activeGit.abort();
    },
    closeListener: async () => {
      await app?.close();
    },
    setExitStatus: dependencies.setExitStatus,
    reportError: () => {
      output('Attached review shutdown failed.');
    },
  });

  try {
    const token = randomBytes(32).toString('base64url');
    app = await createApp(token, {
      coordinator,
      deliver: async (bytes) => {
        await stdout(bytes);
      },
    }, revealDraftFile);
    await app.listen({ host: '127.0.0.1', port: 0 });
    if (shutdown.isShuttingDown) return;

    const address = app.server.address();
    if (
      address === null
      || typeof address === 'string'
      || address.address !== '127.0.0.1'
      || address.port === 0
    ) {
      throw new Error('Fastify did not bind the required IPv4 loopback address');
    }
    const authority = `127.0.0.1:${address.port}`;
    app.bindSessionSecurity({
      expectedHost: authority,
      expectedOrigin: `http://${authority}`,
    });
    const url = `http://${authority}/#token=${token}`;
    output(url);
    output(browserFallback);
    await openBrowser(url);

    const result = await waitForAttachedOutcome(coordinator, dependencies.signalSource);
    if (result === undefined || result.kind !== 'completed') {
      if (result !== undefined) output('Attached review result could not be delivered.');
      await shutdown.shutdown(1);
      return;
    }
    await coordinator.responseSettled;
    await shutdown.shutdown();
  } catch {
    output('Attached review could not be completed.');
    await shutdown.shutdown(1);
  }
}

async function launchExactPatchSession(
  grounded: GroundedExactPatch,
  dependencies: OrdinaryActionDependencies,
  activeGit: AbortController,
): Promise<void> {
  await launchAttachedSession(
    dependencies,
    activeGit,
    async (sessionToken, attachedCompletion, revealDraftFile) => {
      return await (dependencies.createExactPatchSessionApp ?? createExactPatchSessionApp)(
        grounded,
        {
          webRoot: dependencies.webRoot,
          sessionToken,
          revealDraftFile,
          attachedCompletion,
          diagnostics: () => {
            (dependencies.output ?? console.error)('Exact patch review request denied.');
          },
        },
      );
    },
  );
}

export async function runOrdinaryAction(
  options: RunCliOptions,
  dependencies: OrdinaryActionDependencies = {},
): Promise<void> {
  if (dependencies.isTTY ?? process.stdin.isTTY === true) {
    await (dependencies.runCli ?? runCli)(options);
    return;
  }

  const readRequest = dependencies.readRequest ?? readAgentReviewRequest;
  const createRangeComparison =
    dependencies.createRangeComparison ?? createPinnedRangeComparison;
  const output = dependencies.output ?? console.error;
  const setExitStatus =
    dependencies.setExitStatus ??
    ((status: number) => {
      process.exitCode = status;
    });
  const activeGit = new AbortController();
  try {
    const request = await readRequest(dependencies.input ?? process.stdin);
    if (request.mode === 'patch') {
      const grounded = await (dependencies.createGroundedExactPatch ?? createGroundedExactPatch)({
        cwd: options.cwd,
        patchContent: request.patch.content,
        target: request.patch.target,
        signal: activeGit.signal,
      });
      await launchExactPatchSession(grounded, dependencies, activeGit);
      return;
    }

    const comparison = await createRangeComparison({
      cwd: options.cwd,
      baseRevision: request.revisions.base,
      headRevision: request.revisions.head,
      pathspecs: request.revisions.pathspecs,
    });
    await launchAttachedSession(
      dependencies,
      activeGit,
      async (sessionToken, attachedCompletion, revealDraftFile) => {
        return (dependencies.createSessionApp ?? createSessionApp)(comparison, {
          webRoot: dependencies.webRoot,
          sessionToken,
          revealDraftFile,
          attachedCompletion,
          diagnostics: ({ correlationId, reason }) => {
            output(`Compare request denied [${correlationId}]: ${reason}.`);
          },
        });
      },
    );
  } catch (error) {
    if (
      error instanceof AgentRequestError
      || error instanceof ExactPatchGroundingError
      || error instanceof PatchSnapshotError
      || (isLaunchError(error) && error.recovery.kind === 'exit')
    ) {
      output(
        error instanceof ExactPatchGroundingError || error instanceof PatchSnapshotError
          ? 'Exact patch review could not be prepared.'
          : error.message,
      );
      setExitStatus(1);
      return;
    }
    throw error;
  }
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

  let discovery: SourceDiscovery;
  try {
    discovery = await discoverCandidates(options);
  } catch (error) {
    if (!isLaunchError(error) || error.recovery.kind !== 'exit') {
      throw error;
    }
    reportFatalLaunchError(error, output, setExitStatus);
    return;
  }

  let candidates = discovery.initialCandidates;
  let searchBranches = discovery.searchBranches;
  let initialBase: SourceCandidate | undefined;
  let initialHead: SourceCandidate | undefined;
  let recovery: PickerRecoveryOptions | undefined;

  while (true) {
    const suggestedHead = candidates.find(
      (candidate) =>
        candidate.kind === 'worktree' &&
        candidate.isCurrentCheckout &&
        candidate.availability !== 'unavailable',
    );
    const selected = await pickSources({
      candidates,
      searchBranches,
      candidateEnrichment: discovery.candidateEnrichment,
      startCandidateEnrichment: discovery.startCandidateEnrichment,
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
        discovery = await discoverCandidates(options);
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
      const eagerCandidate = discovery.initialCandidates.find(
        (candidate) => candidate.id === failedCandidate.id,
      );
      let recoveredCandidate = eagerCandidate;
      if (recoveredCandidate === undefined && failedCandidate.kind === 'branch') {
        const branches = await discovery.searchBranches(failedCandidate.label);
        recoveredCandidate = branches.find(
          (candidate) => candidate.id === failedCandidate.id,
        );
      }
      candidates =
        recoveredCandidate === undefined || eagerCandidate !== undefined
          ? discovery.initialCandidates
          : Object.freeze([...discovery.initialCandidates, recoveredCandidate]);
      searchBranches = discovery.searchBranches;
      initialBase =
        error.recovery.preserve === 'base' ? selected.base : undefined;
      initialHead =
        error.recovery.preserve === 'head' ? selected.head : undefined;
      recovery = {
        role: error.recovery.role,
        focusedCandidateId: recoveredCandidate?.id,
        searchTerm:
          failedCandidate.kind === 'branch' ? failedCandidate.label : '',
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

  await new Command()
    .name('cumpa')
    .description('Local-first review of pinned Git comparisons')
    .action(async () => {
      const serializedLaunchOptions = process.env.COMPARE_LAUNCH_OPTIONS;
      if (serializedLaunchOptions === undefined) {
        await runOrdinaryAction({ cwd: process.cwd() });
        return;
      }
      const launchOptions = packagedLaunchOptionsSchema.parse(
        JSON.parse(serializedLaunchOptions),
      );
      await launchPinnedSession(launchOptions);
    })
    .parseAsync(process.argv);
}
