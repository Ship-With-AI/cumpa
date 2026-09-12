import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import {
  chmodSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { ExportReviewResultSchema } from '../../src/contracts/api.js';
import { SupportStateV1Schema, resolveSupportStatePath } from '../../src/server/support-store.js';
import { resolveAcceptanceRuntime, publicSupportHomeOf } from '../helpers/acceptance-runtime.js';
import type { AcceptanceRuntime } from '../helpers/acceptance-runtime.js';
import { createDirtyGitFixture } from '../helpers/git-fixture.js';
import type { DirtyGitFixture } from '../helpers/git-fixture.js';
import { openRuntimeSession } from '../helpers/open-runtime-session.js';
import { publishScenarioRecord } from '../helpers/runtime-artifact.js';
import { assertSourceControlUnchanged, captureSourceControlSnapshot } from '../helpers/source-control-snapshot.js';

test.setTimeout(12 * 60_000);
test.use({ headless: process.env.CUMPA_SUPPORT_RESTORE_HEADED !== '1' });
test.describe.configure({ mode: 'serial' });

type SupportStateWindow = 'pre-restore' | 'post-restore' | undefined;
type Row = Readonly<{
  readonly state: 'unverified' | 'dismissed' | 'verified';
  readonly status: 'passed' | 'blocked';
  readonly promptShown: boolean;
  readonly restoreCompleted: boolean;
  readonly restoreObservedFromSharedIdentity: boolean;
  readonly reviewUnrestricted: boolean;
  readonly exportUnrestricted: boolean;
  readonly finishUnrestricted: boolean;
  readonly modalPromptBlocksInteractiveActions: boolean;
  readonly interactiveReviewExportPerformed: boolean;
  readonly reason?: 'support-not-configured' | 'hosted-support-unreachable' | 'paid-account-unavailable' | 'human-sign-in-unavailable';
  readonly substituted: false;
}>;
type Probe = Readonly<{ readonly supportConfigured: boolean; readonly hostedReachable: boolean }>;

interface RunningCli {
  readonly child: ChildProcess;
  readonly markerPath: string;
  readonly outputPath: string;
  readonly outputDescriptor: number;
}

let acceptance: AcceptanceRuntime;
let fakeBinRoot: string;
let supportHome: string;
let stateWindow: SupportStateWindow;
let probe: Probe | undefined;
const supportStates: Row[] = [];
let sourceControlUnchanged = true;

function stateWindowFromEnvironment(): SupportStateWindow {
  const value = process.env.CUMPA_SUPPORT_STATE_WINDOW;
  if (value === undefined) return undefined;
  if (value === 'pre-restore' || value === 'post-restore') return value;
  throw new Error('[public-support-states] CUMPA_SUPPORT_STATE_WINDOW must be pre-restore, post-restore, or unset');
}

function startCli(fixture: DirtyGitFixture): RunningCli {
  const markerPath = join(acceptance.root, `support-browser-open-${crypto.randomUUID()}.log`);
  const outputPath = join(acceptance.root, `support-terminal-${crypto.randomUUID()}.log`);
  const outputDescriptor = openSync(outputPath, 'w');
  const child = spawn(acceptance.launch.command, [...acceptance.launch.args], {
    cwd: fixture.nestedCwd,
    env: {
      ...acceptance.env,
      PATH: `${fakeBinRoot}:${acceptance.env.PATH ?? ''}`,
      CUMPA_BROWSER_OPEN_MARKER: markerPath,
      BROWSER: join(fakeBinRoot, 'open'),
      CUMPA_LAUNCH_OPTIONS: JSON.stringify({
        cwd: fixture.nestedCwd,
        base: { label: fixture.baseRef.slice('refs/heads/'.length), revision: fixture.baseRef },
        head: { label: fixture.headRef.slice('refs/heads/'.length), revision: fixture.headRef },
      }),
    },
    stdio: ['ignore', outputDescriptor, outputDescriptor],
  });
  return { child, markerPath, outputPath, outputDescriptor };
}

async function waitForLoopbackUrl(running: RunningCli): Promise<string> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const output = existsSync(running.outputPath) ? readFileSync(running.outputPath, 'utf8') : '';
    const match = output.match(/http:\/\/127\.0\.0\.1:\d+\/#token=[A-Za-z0-9_-]{43,}/);
    if (match !== null && existsSync(running.markerPath) && readFileSync(running.markerPath, 'utf8').includes(match[0])) return match[0];
    if (running.child.exitCode !== null || running.child.signalCode !== null) {
      throw new Error('[public-support-states] public CLI exited before publishing its loopback session');
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('[public-support-states] timed out waiting for public CLI loopback session');
}

async function stopCli(running: RunningCli): Promise<void> {
  try {
    if (running.child.exitCode === null && running.child.signalCode === null) {
      const events = running.child as unknown as EventEmitter;
      const exited = Promise.withResolvers<void>();
      const timer = setTimeout(() => exited.reject(new Error('[public-support-states] public CLI did not exit after SIGINT')), 15_000);
      events.once('error', exited.reject);
      events.once('exit', () => {
        clearTimeout(timer);
        exited.resolve();
      });
      running.child.kill('SIGINT');
      await exited.promise;
    }
  } finally {
    closeSync(running.outputDescriptor);
  }
}

async function ensureReviewOpen(page: Page): Promise<void> {
  const review = page.getByRole('button', { name: 'Review', exact: true });
  if (await review.getAttribute('aria-expanded') === 'false') await review.click();
  await expect(review).toHaveAttribute('aria-expanded', 'true');
}

async function addHeadComment(page: Page, body: string): Promise<void> {
  const review = page.getByRole('button', { name: 'Review', exact: true });
  if (await review.getAttribute('aria-expanded') === 'true') await review.click();
  await expect(review).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('treeitem', { name: /changed\.ts/ }).click();
  const surface = page.locator('.monaco-diff-editor .editor.modified .monaco-scrollable-element.editor-scrollable').first();
  await surface.click({ position: { x: 16, y: 16 } });
  await page.keyboard.press('Meta+g');
  await page.keyboard.insertText('10');
  await page.keyboard.press('Enter');
  const line = page.locator('.monaco-diff-editor .editor.modified .view-line').filter({ hasText: 'export const stableContext10 = 10;' });
  await expect(line).toBeVisible();
  await line.click();
  await page.getByRole('button', { name: /^Add comment to (?:head|postimage) line 10$/u }).click({ timeout: 10_000 });
  await page.locator('.monaco-anchor-zone--composer textarea').fill(body);
  const accepted = page.waitForResponse((response) => response.url().includes('/api/draft/mutations'));
  await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Add comment' }).click();
  expect((await accepted).status()).toBe(201);
  await ensureReviewOpen(page);
}

async function saveSummaryAndExport(page: Page, summary: string): Promise<void> {
  await page.getByRole('button', { name: 'Write summary' }).click();
  await page.getByLabel('Review summary (Markdown)').fill(summary);
  const accepted = page.waitForResponse((response) => response.url().includes('/api/draft/mutations'));
  await page.getByRole('button', { name: 'Save summary' }).click();
  expect((await accepted).status()).toBe(200);
  const exported = page.waitForResponse((response) => response.url().includes('/api/export'));
  const firstExport = page.getByRole('button', { name: 'Export review', exact: true });
  const exportButton = await firstExport.count() === 1
    ? firstExport
    : page.getByRole('button', { name: 'Export review again', exact: true });
  await exportButton.click();
  const response = await exported;
  expect(response.status()).toBe(201);
  expect(ExportReviewResultSchema.parse(await response.json()).kind).toBe('exported');
}

function readSupportState() {
  return SupportStateV1Schema.parse(JSON.parse(readFileSync(resolveSupportStatePath({ home: supportHome }), 'utf8')));
}

async function withFixture<T>(index: number, action: (fixture: DirtyGitFixture) => Promise<T>): Promise<T> {
  const fixture = await createDirtyGitFixture('branch-to-worktree', index);
  const before = await captureSourceControlSnapshot(fixture.root);
  try {
    return await action(fixture);
  } finally {
    sourceControlUnchanged &&= (await assertSourceControlUnchanged(before, await captureSourceControlSnapshot(fixture.root))) === undefined;
    await fixture.cleanup();
  }
}

function blockPreRestoreRows(reason: Row['reason']): void {
  supportStates.push(
    { state: 'unverified', status: 'blocked', promptShown: false, restoreCompleted: false, restoreObservedFromSharedIdentity: false, reviewUnrestricted: false, exportUnrestricted: false, finishUnrestricted: false, modalPromptBlocksInteractiveActions: false, interactiveReviewExportPerformed: false, reason, substituted: false },
    { state: 'dismissed', status: 'blocked', promptShown: false, restoreCompleted: false, restoreObservedFromSharedIdentity: false, reviewUnrestricted: false, exportUnrestricted: false, finishUnrestricted: false, modalPromptBlocksInteractiveActions: false, interactiveReviewExportPerformed: false, reason, substituted: false },
  );
}

test.beforeAll(() => {
  acceptance = resolveAcceptanceRuntime();
  if (acceptance.source === 'local-archive') throw new Error('[public-support-states] live support states require a public runtime, never local-archive');
  supportHome = publicSupportHomeOf(acceptance) ?? (() => { throw new Error('[public-support-states] public runtime did not supply shared support HOME'); })();
  stateWindow = stateWindowFromEnvironment();
  fakeBinRoot = join(acceptance.root, 'fake-bin');
  mkdirSync(fakeBinRoot, { recursive: true });
  const opener = join(fakeBinRoot, 'open');
  writeFileSync(opener, [
    '#!/usr/bin/env node',
    "const { appendFileSync } = require('node:fs');",
    "if (process.env.CUMPA_BROWSER_OPEN_MARKER) appendFileSync(process.env.CUMPA_BROWSER_OPEN_MARKER, `${JSON.stringify(process.argv.slice(2))}\\n`);",
    '',
  ].join('\n'));
  chmodSync(opener, 0o755);
  if ((stateWindow === 'pre-restore' || stateWindow === undefined) && existsSync(resolveSupportStatePath({ home: supportHome }))) {
    const state = readSupportState();
    if (state.status === 'verified') throw new Error('[public-support-states] pre-restore window cannot run after the shared support identity is verified');
  }
});

test('probes configured hosted support before claiming support states', async ({ page }) => {
  await withFixture(401, async (fixture) => {
    const running = startCli(fixture);
    try {
      const observation = await openRuntimeSession(page, await waitForLoopbackUrl(running), { dismissUnverified: false });
      probe = { supportConfigured: observation.enabled, hostedReachable: observation.observedStatus !== undefined };
    } finally {
      await page.close();
      await stopCli(running);
    }
  });
  if (probe === undefined) throw new Error('[public-support-states] support capability probe did not complete');
});

test('records live unverified and dismissed support rows with unrestricted review and export', async ({ browser }) => {
  test.skip(stateWindow === 'post-restore', 'post-restore emits only probe and verified rows');
  if (probe === undefined) throw new Error('[public-support-states] probe must complete before pre-restore rows');
  if (!probe.supportConfigured) {
    blockPreRestoreRows('support-not-configured');
    return;
  }
  if (!probe.hostedReachable) {
    blockPreRestoreRows('hosted-support-unreachable');
    return;
  }

  const page = await browser.newPage();
  await withFixture(402, async (fixture) => {
    const running = startCli(fixture);
    try {
      const observation = await openRuntimeSession(page, await waitForLoopbackUrl(running), { dismissUnverified: false });
      expect(observation).toEqual({ enabled: true, observedStatus: 'unverified', dismissed: false });
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('heading', { name: 'Support Cumpa' })).toBeVisible();
      await expect(dialog.getByText('Cumpa stays fully usable. One optional USD $49.99 payment supports development. Paying once stops the launch prompt.')).toBeVisible();
      await expect(dialog.getByRole('button', { name: 'Restore support', exact: true })).toBeVisible();
      await expect(dialog.getByRole('button', { name: 'Not now', exact: true })).toBeVisible();
      await expect(page.locator('.support-dialog-backdrop')).toHaveCSS('position', 'fixed');
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      const stored = readSupportState();
      expect(stored.status).toBe('unverified');
      expect(stored.verifiedAt).toBeUndefined();
      supportStates.push({ state: 'unverified', status: 'passed', promptShown: true, restoreCompleted: false, restoreObservedFromSharedIdentity: false, reviewUnrestricted: true, exportUnrestricted: true, finishUnrestricted: false, modalPromptBlocksInteractiveActions: true, interactiveReviewExportPerformed: false, substituted: false });

      await dialog.getByRole('button', { name: 'Not now', exact: true }).click();
      await expect(page.locator('.support-dialog-backdrop')).toBeHidden();
      await addHeadComment(page, 'Dismissed support does not restrict review.');
      await saveSummaryAndExport(page, 'Dismissed support does not restrict export.');
      supportStates.push({ state: 'dismissed', status: 'passed', promptShown: false, restoreCompleted: false, restoreObservedFromSharedIdentity: false, reviewUnrestricted: true, exportUnrestricted: true, finishUnrestricted: false, modalPromptBlocksInteractiveActions: false, interactiveReviewExportPerformed: true, substituted: false });
    } finally {
      await page.close();
      await stopCli(running);
    }
  });
});

test.afterAll(() => {
  if (acceptance === undefined) return;
  let cleaned = false;
  try {
    const status = supportStates.some((row) => row.status === 'blocked') ? 'partially-blocked' : 'passed';
    publishScenarioRecord('public-support-states', {
      installSource: acceptance.source,
      supportStateWindow: stateWindow ?? 'all',
      probe: probe ?? { supportConfigured: false, hostedReachable: false },
      supportStates,
      sourceControl: { unchanged: sourceControlUnchanged },
      cleanup: { complete: true },
    }, { status });
    acceptance.cleanup();
    cleaned = true;
  } finally {
    if (!cleaned) acceptance.cleanup();
  }
});
