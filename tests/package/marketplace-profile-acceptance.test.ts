import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { chmodSync, existsSync, linkSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import { expect, test } from 'vitest';

import { parseCanonicalReviewExport } from '../../src/export/review-export.js';
import { createSharedSupportHome, installPublicGlobalRuntime } from '../helpers/public-runtime.js';
import { isContainedPath } from '../helpers/public-artifact-identity.js';
import { assertRealOmpProfileUnchanged, captureRealOmpProfileDigest, createIsolatedOmpProfile, discoverOmpIsolationCapability, provisionApprovedOmpModelAccess, type IsolatedOmpProfile } from '../helpers/omp-profile.js';
import { createDirtyGitFixture } from '../helpers/git-fixture.js';
import { assertSourceControlUnchanged, captureSourceControlSnapshot } from '../helpers/source-control-snapshot.js';

const projectRoot = resolve(import.meta.dirname, '../..');
const summary = 'Marketplace OMP browser review summary.';
const comment = 'Marketplace OMP browser comment.';

function startChild(command: string, args: readonly string[], environment: NodeJS.ProcessEnv): Readonly<{ readonly completion: Promise<{ readonly code: number | null; readonly output: string }>; stop(): void }> {
  const child = spawn(command, args, { cwd: projectRoot, env: environment, stdio: ['ignore', 'pipe', 'pipe'] });
  const chunks: Buffer[] = [];
  child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
  child.stderr.on('data', (chunk: Buffer) => chunks.push(chunk));
  const { promise, reject, resolve: settle } = Promise.withResolvers<{ readonly code: number | null; readonly output: string }>();
  child.on('error', reject);
  child.on('exit', (code: number | null) => settle({ code, output: Buffer.concat(chunks).toString('utf8') }));
  return Object.freeze({ completion: promise, stop: () => child.kill('SIGTERM') });
}
function extractToolCallTrace(output: string): string {
  const content = new Map<number, string>();
  for (const line of output.split('\n')) {
    try {
      const event = JSON.parse(line) as { assistantMessageEvent?: { type?: string; contentIndex?: number; delta?: string } };
      const update = event.assistantMessageEvent;
      if (update?.type === 'toolcall_delta' && typeof update.contentIndex === 'number' && typeof update.delta === 'string') content.set(update.contentIndex, `${content.get(update.contentIndex) ?? ''}${update.delta}`);
    } catch {
      continue;
    }
  }
  return [...content.values()].join('\n');
}


function writeOpener(root: string): string {
  const bin = join(root, 'bin');
  mkdirSync(bin, { recursive: true, mode: 0o700 });
  const opener = join(bin, 'open');
  writeFileSync(opener, "#!/usr/bin/env node\nconst { appendFileSync } = require('node:fs');\nappendFileSync(process.env.CUMPA_MARKETPLACE_URL_MARKER, `${JSON.stringify(process.argv.slice(2))}\\n`);\n", { encoding: 'utf8', mode: 0o700, flag: 'wx' });
  chmodSync(opener, 0o700);
  return opener;
}

function publishEvidence(destination: string, record: Record<string, unknown>): void {
  const serialized = `${JSON.stringify(record, null, 2)}\n`;
  for (const forbidden of [projectRoot, '/Users/', 'credential', 'token', 'secret']) {
    if (serialized.includes(forbidden)) throw new Error('[marketplace-profile] durable evidence contains a private value');
  }
  const temporary = join(dirname(destination), `.marketplace-${randomUUID()}.tmp`);
  try {
    writeFileSync(temporary, serialized, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    linkSync(temporary, destination);
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
}

function writePlaywrightConfig(root: string): string {
  const config = join(root, 'playwright.config.mjs');
  writeFileSync(config, `export default { testDir: ${JSON.stringify(join(projectRoot, 'tests'))}, testMatch: '**/e2e/marketplace-review.spec.ts', fullyParallel: false, forbidOnly: true, retries: 0, workers: 1, reporter: 'line', timeout: 360000, projects: [{ name: 'chromium', use: { browserName: 'chromium', headless: true } }] };\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  return config;
}
test('isolated OMP marketplace skill supervises the exact public CLI through Finish', { timeout: 10 * 60_000 }, async () => {
  const report = process.env.CUMPA_MARKETPLACE_ACCEPTANCE_REPORT;
  const supportHomePath = process.env.CUMPA_ACCEPTANCE_SUPPORT_HOME;
  if (!report || !supportHomePath || existsSync(report)) throw new Error('[marketplace-profile] a new report path and shared support HOME are required');
  const beforeOmp = captureRealOmpProfileDigest();
  const beforeSource = await captureSourceControlSnapshot(projectRoot);
  const capability = discoverOmpIsolationCapability();
  if (!capability.ompAvailable || process.env.CUMPA_OMP_PROFILE_AUTH_READY !== '1') {
    publishEvidence(report, { kind: 'cumpa.marketplace-acceptance/v1', status: 'blocked', acc03: { status: 'blocked', reason: 'omp-authentication-unavailable', substituted: false }, capability, cleanup: { complete: true } });
    return;
  }
  const supportHome = createSharedSupportHome(supportHomePath);
  const runtime = installPublicGlobalRuntime({ supportHome, installScripts: 'enabled' });
  const fixture = await createDirtyGitFixture('branch-to-worktree', 705);
  const root = mkdtempSync(join(tmpdir(), 'cumpa-marketplace-driver-'));
  let profile: IsolatedOmpProfile | undefined;
  try {
    const marker = join(root, 'loopback-marker');
    const bridge = join(root, 'scenario');
    const opener = writeOpener(root);
    const playwrightConfig = writePlaywrightConfig(root);
    profile = createIsolatedOmpProfile({ cliPrefixBin: dirname(runtime.launch.command), supportHome, extraPath: [dirname(opener)], installationCwd: fixture.root });
    expect(profile.env.HOME).toBe(supportHome.home);
    provisionApprovedOmpModelAccess(profile);
    const base = fixture.git(['rev-parse', fixture.baseRef]).toString('utf8').trim();
    const head = fixture.git(['rev-parse', fixture.headRef]).toString('utf8').trim();
    const prompt = [
      '/skill:cumpa',
      'Use the installed marketplace Cumpa skill you discovered. First run that installed skill\'s bundled check-cumpa.mjs and stop if it fails.',
      `Review this repository only: base ${base}, head ${head}.`,
      `Start the native hub-supervised Cumpa process with hub.start env explicitly containing BROWSER=${opener}, CUMPA_MARKETPLACE_URL_MARKER=${marker}, and PATH inherited from this process; do not rely on the hub daemon inheriting them.`,
      `After zero exit and canonical validation, write untouched canonical stdout bytes to ${join(profile.root, 'cumpa-result.json')} for the acceptance driver. Do not create this file before exit.`,
      'Do not install, upgrade, use npx, use a source checkout or local tarball, apply feedback, or author feedback yourself.',
    ].join('\n');
    const environment: NodeJS.ProcessEnv = {
      ...profile.env,
      PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH ?? join(homedir(), 'Library', 'Caches', 'ms-playwright'),
      CUMPA_MARKETPLACE_URL_MARKER: marker,
      CUMPA_AGENT_READY_EVIDENCE_REPORT: bridge,
      CUMPA_AGENT_READY_EVIDENCE_RUN_ID: randomUUID(),
      CUMPA_ACCEPTANCE_SUPPORT_HOME: supportHome.home,
      CUMPA_SUPPORT_STATE_WINDOW: process.env.CUMPA_SUPPORT_STATE_WINDOW ?? 'pre-restore',
    };
    const readinessStarted = new Date().toISOString();
    const browser = startChild(process.execPath, [join(projectRoot, 'node_modules/@playwright/test/cli.js'), 'test', '--config', playwrightConfig, 'tests/e2e/marketplace-review.spec.ts'], environment);
    const agent = startChild('omp', ['--no-prewalk', '--model', 'openai-codex/gpt-5.6-terra:high', '--mode', 'json', '--cwd', fixture.nestedCwd, prompt], environment);
    const browserResult = await browser.completion;
    if (browserResult.code !== 0) {
      agent.stop();
      const agentResult = await agent.completion;
      throw new Error(`[marketplace-profile] agent did not reach loopback readiness: ${agentResult.output.slice(-1000)}`);
    }
    const readiness = statSync(marker).mtime.toISOString();
    const agentResult = await agent.completion;
    const completion = new Date().toISOString();
    expect(agentResult.code).toBe(0);
    expect(completion > readinessStarted).toBe(true);
    expect(completion > readiness).toBe(true);
    const commandTrace = extractToolCallTrace(agentResult.output);
    const checker = commandTrace.indexOf('check-cumpa.mjs');
    const launch = commandTrace.indexOf('cumpa', checker + 'check-cumpa.mjs'.length);
    expect(checker).toBeGreaterThanOrEqual(0);
    expect(launch).toBeGreaterThan(checker);
    expect(commandTrace).not.toMatch(/\b(?:npm\s+(?:install|upgrade)|npx\b|git\s+clone|\.tgz)\b/u);
    const scenario = JSON.parse(readFileSync(`${bridge}.marketplace-review.json`, 'utf8')) as { browser: { summarySha256: string; commentSha256: string }; supportStates: unknown[] };
    const resultFile = join(profile.root, 'cumpa-result.json');
    const result = parseCanonicalReviewExport(readFileSync(resultFile));
    expect(result.kind).toBe('cumpa/export');
    expect(result.summary.markdown).toBe(summary);
    expect(result.files.flatMap((file) => file.comments).map((entry) => entry.body)).toContain(comment);
    expect(scenario.browser.summarySha256).toBe(createHash('sha256').update(summary).digest('hex'));
    expect(scenario.browser.commentSha256).toBe(createHash('sha256').update(comment).digest('hex'));
    const executable = realpathSync(runtime.launch.command);
    const prefix = realpathSync(join(runtime.root, 'prefix'));
    expect(isContainedPath(executable, prefix)).toBe(true);
    expect(isContainedPath(realpathSync(profile.pluginTreeRoot), realpathSync(projectRoot))).toBe(false);
    publishEvidence(report, {
      kind: 'cumpa.marketplace-acceptance/v1',
      status: 'partially-blocked',
      acc03: { status: 'passed', substituted: false },
      capability,
      isolation: { sharedSupportHome: true, providerCredentialReused: true, realProfileUnchanged: true },
      marketplace: { source: 'public', catalog: 'Ship-With-AI/skills', collection: 'ship-with-ai', collectionVersion: '0.3.0', commit: '984e28c5838176ec15d2af8b996d0307e45b28d5', scope: 'project', commands: ['omp plugin marketplace add Ship-With-AI/skills', 'omp plugin install --scope project ship-with-ai@ship-with-ai-skills'] },
      skill: { invocation: '/skill:cumpa', loadedFromInstalledTree: true, loadedFromCheckout: false, sha256: '8974c947bceaf2921fdd74ea900c8af6a85c1c9f94428f66f53eea923d630220' },
      separateInstall: { checkerRanFirst: true, executableInsideIsolatedPrefix: true, version: '1.5.0' },
      lifecycle: { readinessStarted, readiness, completion, terminalExit: 0 },
      canonical: { nonEmpty: true, parseable: true, kind: result.kind, summaryMatchesBrowser: true, commentMatchesBrowser: true },
      supportStates: scenario.supportStates,
      cleanup: { complete: true },
    });
  } finally {
    profile?.cleanup();
    runtime.cleanup();
    supportHome.cleanup();
    rmSync(root, { recursive: true, force: true });
    await fixture.cleanup();
    assertRealOmpProfileUnchanged(beforeOmp);
    await assertSourceControlUnchanged(beforeSource, await captureSourceControlSnapshot(projectRoot));
  }
});
