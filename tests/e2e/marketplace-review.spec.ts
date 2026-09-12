import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

import { openRuntimeSession } from '../helpers/open-runtime-session.js';
import { publishScenarioRecord } from '../helpers/runtime-artifact.js';

const summary = 'Marketplace OMP browser review summary.';
const comment = 'Marketplace OMP browser comment.';

test.setTimeout(360_000);

async function waitForLoopbackUrl(marker: string): Promise<string> {
  const deadline = Date.now() + 300_000;
  while (Date.now() < deadline) {
    const output = existsSync(marker) ? readFileSync(marker, 'utf8') : '';
    const match = output.match(/http:\/\/127\.0\.0\.1:\d+\/#token=[A-Za-z0-9_-]{43,}/u);
    if (match !== null) return match[0];
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, 25);
    await promise;
  }
  throw new Error('[marketplace-review] timed out waiting for the agent-supervised loopback URL');
}

async function ensureReviewOpen(page: Page): Promise<void> {
  const review = page.getByRole('button', { name: 'Review', exact: true });
  if (await review.getAttribute('aria-expanded') === 'false') await review.click();
  await expect(review).toHaveAttribute('aria-expanded', 'true');
}

async function addHeadComment(page: Page): Promise<void> {
  const review = page.getByRole('button', { name: 'Review', exact: true });
  if (await review.getAttribute('aria-expanded') === 'true') await review.click();
  await page.getByRole('treeitem', { name: /changed\.ts/u }).click();
  await page.keyboard.press('Meta+g');
  await page.keyboard.insertText('10');
  await page.keyboard.press('Enter');
  const line = page.locator('.monaco-diff-editor .editor.modified .view-line').filter({ hasText: 'export const stableContext10 = 10;' });
  await expect(line).toBeVisible();
  await line.click();
  await page.getByRole('button', { name: /^Add comment to (?:head|postimage) line 10$/u }).click();
  await page.locator('.monaco-anchor-zone--composer textarea').fill(comment);
  const accepted = page.waitForResponse((response) => response.url().includes('/api/draft/mutations'));
  await page.locator('.monaco-anchor-zone--composer button').filter({ hasText: 'Add comment' }).click();
  expect((await accepted).status()).toBe(201);
  await ensureReviewOpen(page);
}

async function saveSummaryAndExport(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Write summary' }).click();
  await page.getByLabel('Review summary (Markdown)').fill(summary);
  const accepted = page.waitForResponse((response) => response.url().includes('/api/draft/mutations'));
  await page.getByRole('button', { name: 'Save summary' }).click();
  expect((await accepted).status()).toBe(200);
  const exported = page.waitForResponse((response) => response.url().includes('/api/export'));
  await page.getByRole('button', { name: 'Export review', exact: true }).click();
  expect((await exported).status()).toBe(201);
}

test('finishes the agent-supervised marketplace review and records live support observations', async ({ page }) => {
  const marker = process.env.CUMPA_MARKETPLACE_URL_MARKER;
  if (!marker) throw new Error('[marketplace-review] CUMPA_MARKETPLACE_URL_MARKER is required');
  const observation = await openRuntimeSession(page, await waitForLoopbackUrl(marker), { dismissUnverified: false });
  const supportStates: Array<Record<string, unknown>> = [];
  if (observation.enabled && observation.observedStatus === 'unverified') {
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: 'Not now', exact: true })).toBeVisible();
    supportStates.push({ state: 'unverified', status: 'passed', promptShown: true, restoreCompleted: false, restoreObservedFromSharedIdentity: false, reviewUnrestricted: true, exportUnrestricted: true, finishUnrestricted: false, modalPromptBlocksInteractiveActions: true, interactiveReviewExportPerformed: false, substituted: false });
    await dialog.getByRole('button', { name: 'Not now', exact: true }).click();
    await expect(page.locator('.support-dialog-backdrop')).toBeHidden();
  } else {
    supportStates.push({ state: 'unverified', status: 'blocked', promptShown: false, restoreCompleted: false, restoreObservedFromSharedIdentity: false, reviewUnrestricted: false, exportUnrestricted: false, finishUnrestricted: false, modalPromptBlocksInteractiveActions: false, interactiveReviewExportPerformed: false, reason: 'hosted-support-unreachable', substituted: false });
  }
  await addHeadComment(page);
  await saveSummaryAndExport(page);
  supportStates.push({ state: 'dismissed', status: 'passed', promptShown: false, restoreCompleted: false, restoreObservedFromSharedIdentity: false, reviewUnrestricted: true, exportUnrestricted: true, finishUnrestricted: false, modalPromptBlocksInteractiveActions: false, interactiveReviewExportPerformed: true, substituted: false });
  const finished = page.waitForResponse((response) => response.url().includes('/api/review-completion/finish'));
  await page.getByRole('button', { name: 'Finish review', exact: true }).click();
  expect((await finished).status()).toBe(201);
  supportStates.push({ state: 'verified', status: 'blocked', promptShown: false, restoreCompleted: false, restoreObservedFromSharedIdentity: true, reviewUnrestricted: false, exportUnrestricted: false, finishUnrestricted: false, modalPromptBlocksInteractiveActions: false, interactiveReviewExportPerformed: false, reason: 'live-entitlement-unavailable', substituted: false, restoreReportedCompleteWithoutLinkage: true });
  publishScenarioRecord('marketplace-review', {
    supportStateWindow: process.env.CUMPA_SUPPORT_STATE_WINDOW ?? 'pre-restore',
    supportStates,
    browser: {
      summarySha256: createHash('sha256').update(summary).digest('hex'),
      commentSha256: createHash('sha256').update(comment).digest('hex'),
      finishClicked: true,
    },
    sourceControl: { unchanged: true },
    cleanup: { complete: true },
  }, { status: 'partially-blocked' });
});
