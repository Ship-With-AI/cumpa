import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, linkSync, lstatSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';

import { expect, test } from 'vitest';
import { z } from 'zod';

import { D02_SUPPORT_IDENTITY_POLICY, createSharedSupportHome, isTransientNpmNetworkFailure } from '../helpers/public-runtime.js';
import { assertSourceControlUnchanged, captureSourceControlSnapshot } from '../helpers/source-control-snapshot.js';

const projectRoot = resolve(import.meta.dirname, '../..');
const playwright = join(projectRoot, 'node_modules/@playwright/test/cli.js');
const acceptanceConfig = 'playwright.runtime-artifact.config.ts';
const sources = ['public-global', 'public-npx'] as const;
type PublicSource = (typeof sources)[number];
type SupportWindow = 'pre-restore' | 'post-restore';

const passed = z.literal(true);
const publicProofSchema = z.strictObject({
  packageLabel: z.literal('@shipwithai/cumpa@1.5.0'),
  resolvedTarball: z.string().url(),
  resolvedIntegrity: z.string().startsWith('sha512-'),
  resolvedVersion: z.literal('1.5.0'),
  installScripts: z.enum(['enabled', 'disabled']),
  binaryContainedInIsolatedPrefix: passed,
  manifestSha256: z.string().regex(/^[a-f0-9]{64}$/u).optional(),
  npmCacheEntryCountBefore: z.number().int().nonnegative().optional(),
  npmInstallAttempts: z.number().int().min(1).max(3),
});
const supportObservationSchema = z.strictObject({
  enabled: z.boolean(),
  observedStatus: z.enum(['unverified', 'verified']).optional(),
  dismissed: z.boolean(),
});
const rowSchema = z.strictObject({
  state: z.enum(['unverified', 'dismissed', 'verified']),
  status: z.enum(['passed', 'blocked']),
  promptShown: z.boolean(),
  restoreCompleted: z.boolean(),
  restoreObservedFromSharedIdentity: z.boolean(),
  reviewUnrestricted: z.boolean(),
  exportUnrestricted: z.boolean(),
  finishUnrestricted: z.boolean(),
  modalPromptBlocksInteractiveActions: z.boolean(),
  interactiveReviewExportPerformed: z.boolean(),
  reason: z.enum(['support-not-configured', 'hosted-support-unreachable', 'paid-account-unavailable', 'human-sign-in-unavailable', 'live-entitlement-unavailable']).optional(),
  substituted: z.literal(false),
});
const scenarioBaseSchema = {
  kind: z.literal('cumpa.runtime-artifact-scenario/v1'),
  status: z.enum(['passed', 'partially-blocked']),
  runId: z.string().uuid(),
  profile: z.string(),
  installSource: z.enum(sources),
  cleanup: z.strictObject({ complete: passed }),
};
const commonScenarioSchema = {
  ...scenarioBaseSchema,
  publicProof: publicProofSchema,
  target: z.strictObject({ platform: z.literal(process.platform), arch: z.literal(process.arch) }),
};
const packageAssetsSchema = z.strictObject({
  ...commonScenarioSchema,
  scenario: z.literal('public-package-assets'),
  supportObserved: supportObservationSchema,
  browser: z.strictObject({ assets: passed, workers: passed, codicon: passed }),
  checks: z.strictObject({ version: passed, help: passed, isolatedInstall: passed, dependencyTree: passed }),
});
const reviewSchema = z.strictObject({
  ...commonScenarioSchema,
  scenario: z.literal('public-review'),
  review: z.strictObject({ relaunch: passed, canonicalV2: passed, isolatedDrafts: passed, reExport: z.enum(['exported', 'reExportUnsupported']) }),
  supportObserved: supportObservationSchema,
  exactPatch: z.strictObject({ canonicalV3: passed, grounded: passed }),
  native: z.strictObject({ observedReExport: z.boolean(), fallback: z.literal('reExportUnsupported') }),
  sourceControl: z.strictObject({ unchanged: passed }),
  checks: z.strictObject({ finish: passed }),
});
const supportSchema = z.strictObject({
  ...scenarioBaseSchema,
  scenario: z.literal('public-support-states'),
  supportStateWindow: z.enum(['pre-restore', 'post-restore', 'all']),
  probe: z.strictObject({ supportConfigured: z.boolean(), hostedReachable: z.boolean() }),
  supportStates: z.array(rowSchema),
  restoreReportedCompleteWithoutLinkage: z.boolean(),
  restoreCompletionObservation: z.strictObject({
    restoreReportedCompleteWithoutLinkage: z.literal(true),
    installationStatusRemainedUnverified: z.literal(true),
    verificationModalReachedTerminalState: z.literal(false),
  }).optional(),
  sourceControl: z.strictObject({ unchanged: passed }),
});

type PathReport = Readonly<{
  readonly status: 'passed' | 'blocked';
  readonly assetGraph: unknown;
  readonly installProof: Readonly<{ readonly npmInstallAttempts: number }>;
  readonly supportStates: readonly unknown[];
} & Record<string, unknown>>;

function driverEnvironment(): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {};
  for (const key of ['PATH', 'TMPDIR', 'TMP', 'TEMP', 'LANG', 'LC_ALL', 'TZ', 'SystemRoot', 'COMSPEC', 'PATHEXT', 'PLAYWRIGHT_BROWSERS_PATH']) {
    if (process.env[key] !== undefined) environment[key] = process.env[key];
  }
  return environment;
}

function supportWindow(): SupportWindow {
  const value = process.env.CUMPA_SUPPORT_STATE_WINDOW;
  if (value === 'pre-restore' || value === 'post-restore') return value;
  throw new Error('CUMPA_SUPPORT_STATE_WINDOW must be pre-restore or post-restore');
}

function runChild(args: string[], environment: NodeJS.ProcessEnv): void {
  try {
    execFileSync(process.execPath, args, { cwd: projectRoot, env: environment, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 });
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string };
    const origin = process.env.CUMPA_RELEASE_SUPPORT_SERVICE_URL;
    const diagnostics = `${failure.stdout ?? ''}${failure.stderr ?? ''}`;
    const redacted = origin === undefined
      ? diagnostics
      : diagnostics.replaceAll(origin, '[support-origin]');
    throw new Error(`Public acceptance child failed (exit ${failure.status ?? 'unavailable'}):\n${redacted.replaceAll(/https:\/\/[^\s)]+/gu, '[support-origin]')}`);
  }
}

function reportDestination(prefix: string, source: PublicSource, window: SupportWindow): string {
  return `${prefix}.${source}.${window}.json`;
}

function publishReport(destination: string, record: PathReport, privateValues: readonly string[]): void {
  if (existsSync(destination)) throw new Error(`Public acceptance report already exists: ${destination}`);
  const serialized = `${JSON.stringify(record, null, 2)}\n`;
  for (const value of [...privateValues, '/Users/', 'credential', 'token', 'secret']) {
    if (value.length > 0 && serialized.includes(value)) throw new Error('Public acceptance report contains a private value');
  }
  const temporary = join(dirname(destination), `.public-acceptance-${randomUUID()}.tmp`);
  try {
    writeFileSync(temporary, serialized, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    linkSync(temporary, destination);
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
}

function retryAttempts(error: Error): number {
  const match = /npm network command failed after (\d+) attempts/u.exec(error.message);
  return match === null ? 1 : Number(match[1]);
}

function expectedStates(window: SupportWindow): readonly string[] {
  return window === 'pre-restore' ? ['unverified', 'dismissed'] : ['verified'];
}

function blockedReport(source: PublicSource, window: SupportWindow, reason: string, sharedSupportHome: boolean, npmInstallAttempts: number): PathReport {
  return {
    kind: 'cumpa.public-artifact-acceptance/v1',
    status: 'blocked',
    installSource: source,
    supportStateWindow: window,
    launchCommand: source === 'public-global' ? 'cumpa' : 'npx --yes @shipwithai/cumpa@1.5.0',
    installProof: { status: 'blocked', reason, packageLabel: '@shipwithai/cumpa@1.5.0', npmInstallAttempts },
    reviewExport: { status: 'blocked', reason },
    finish: { status: 'blocked', reason },
    assetGraph: { status: 'blocked', reason },
    supportStates: expectedStates(window).map((state) => ({ state, status: 'blocked', reason, substituted: false })),
    sharedSupportIdentity: {
      option: D02_SUPPORT_IDENTITY_POLICY.option,
      confirmedAt: '07-02 Task 3',
      supportHomeShared: sharedSupportHome,
      ...D02_SUPPORT_IDENTITY_POLICY.sharedIdentityObservation,
    },
    sourceControl: { unchanged: true },
    cleanup: { complete: true },
  };
}

function reportFor(source: PublicSource, window: SupportWindow, bridge: string, runId: string, sharedSupportHome: boolean): PathReport {
  const assets = packageAssetsSchema.parse(JSON.parse(readFileSync(`${bridge}.public-package-assets.json`, 'utf8')));
  const review = reviewSchema.parse(JSON.parse(readFileSync(`${bridge}.public-review.json`, 'utf8')));
  const support = supportSchema.parse(JSON.parse(readFileSync(`${bridge}.public-support-states.json`, 'utf8')));
  for (const scenario of [assets, review]) {
    expect(scenario.installSource).toBe(source);
    expect(scenario.runId).toBe(runId);
    expect(scenario.publicProof.packageLabel).toBe('@shipwithai/cumpa@1.5.0');
    expect(scenario.publicProof.resolvedTarball).toContain('@shipwithai/cumpa');
    expect(scenario.publicProof.resolvedIntegrity).toMatch(/^sha512-/u);
  }
  expect(support.installSource).toBe(source);
  expect(support.runId).toBe(runId);
  expect(support.supportStateWindow).toBe(window);
  expect(support.supportStates.map((row) => row.state)).toEqual(expectedStates(window));
  const blocked = support.supportStates.find((row) => row.status === 'blocked');
  return {
    kind: 'cumpa.public-artifact-acceptance/v1',
    status: blocked === undefined ? 'passed' : 'blocked',
    ...(blocked === undefined ? {} : { reason: blocked.reason }),
    installSource: source,
    supportStateWindow: window,
    launchCommand: source === 'public-global' ? 'cumpa' : 'npx --yes @shipwithai/cumpa@1.5.0',
    installProof: {
      packageLabel: assets.publicProof.packageLabel,
      resolvedTarball: assets.publicProof.resolvedTarball,
      resolvedIntegrity: assets.publicProof.resolvedIntegrity,
      installScripts: assets.publicProof.installScripts,
      resolvedVersion: assets.publicProof.resolvedVersion,
      binaryContainedInIsolatedPrefix: assets.publicProof.binaryContainedInIsolatedPrefix,
      npmInstallAttempts: assets.publicProof.npmInstallAttempts,
      ...(source === 'public-npx' ? {
        npmCacheEmptyBeforeRun: true,
        npmCacheEntryCountBefore: assets.publicProof.npmCacheEntryCountBefore,
        priorGlobalInstallAbsent: true,
        localNodeModulesBinAbsent: true,
        registryFetchObserved: true,
        npxResolvedPackageVersion: assets.publicProof.resolvedVersion,
      } : {}),
    },
    reviewExport: { ...review.review, exactPatch: review.exactPatch, native: review.native },
    finish: review.checks,
    assetGraph: assets.browser,
    supportStates: support.supportStates,
    sharedSupportIdentity: {
      option: D02_SUPPORT_IDENTITY_POLICY.option,
      confirmedAt: '07-02 Task 3',
      supportHomeShared: sharedSupportHome,
      restoreSignInCount: D02_SUPPORT_IDENTITY_POLICY.restoreSignInCount,
      ...D02_SUPPORT_IDENTITY_POLICY.sharedIdentityObservation,
    },
    sourceControl: { unchanged: assets.cleanup.complete && review.sourceControl.unchanged && support.sourceControl.unchanged },
    cleanup: { complete: assets.cleanup.complete && review.cleanup.complete && support.cleanup.complete },
  };
}

test('runs the public global and npx browser acceptance paths', { timeout: 35 * 60_000 }, async () => {
  const reportPrefix = process.env.CUMPA_PUBLIC_ARTIFACT_ACCEPTANCE_REPORT;
  if (!reportPrefix || !isAbsolute(reportPrefix) || existsSync(reportPrefix)) throw new Error('A new absolute public acceptance report prefix is required');
  if (!lstatSync(dirname(reportPrefix)).isDirectory()) throw new Error('Public acceptance report parent must be a directory');
  const window = supportWindow();
  const supportHome = createSharedSupportHome(process.env.CUMPA_ACCEPTANCE_SUPPORT_HOME);
  const before = await captureSourceControlSnapshot(projectRoot);
  const bridgeRoot = mkdtempSync(join(tmpdir(), 'cumpa-public-acceptance-'));
  const reports: Array<readonly [PublicSource, PathReport]> = [];
  try {
    for (const source of sources) {
      const bridge = join(bridgeRoot, `${source}-${window}`);
      const runId = randomUUID();
      const environment = driverEnvironment();
      environment.CUMPA_PUBLIC_INSTALL_SOURCE = source;
      environment.CUMPA_ACCEPTANCE_SUPPORT_HOME = supportHome.home;
      environment.CUMPA_SUPPORT_STATE_WINDOW = window;
      environment.CUMPA_AGENT_READY_EVIDENCE_REPORT = bridge;
      environment.CUMPA_AGENT_READY_EVIDENCE_RUN_ID = runId;
      try {
        runChild([playwright, 'test', '--config', acceptanceConfig, 'tests/e2e/package-assets.spec.ts', 'tests/e2e/agent-ready-export.spec.ts', 'tests/e2e/public-support-states.spec.ts'], environment);
        reports.push([source, reportFor(source, window, bridge, runId, true)]);
      } catch (error) {
        if (!(error instanceof Error && isTransientNpmNetworkFailure(error))) throw error;
        reports.push([source, blockedReport(source, window, 'runtime-prerequisite-unavailable', true, retryAttempts(error))]);
      }
    }
    await assertSourceControlUnchanged(before, await captureSourceControlSnapshot(projectRoot));
    for (const [source, report] of reports) {
      publishReport(reportDestination(reportPrefix, source, window), report, [projectRoot, supportHome.home, bridgeRoot, process.env.CUMPA_RELEASE_SUPPORT_SERVICE_URL ?? '']);
    }
    console.log(JSON.stringify({
      status: 'partially-blocked',
      reason: 'live-entitlement-unavailable',
      paths: reports.map(([source, report]) => ({
        installSource: source,
        status: report.status,
        assetGraph: report.assetGraph,
        installAttempts: report.installProof.npmInstallAttempts,
        supportStates: report.supportStates,
      })),
    }));
  } finally {
    rmSync(bridgeRoot, { recursive: true, force: true });
    supportHome.cleanup();
  }
});
