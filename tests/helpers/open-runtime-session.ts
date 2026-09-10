import { expect, type Page } from '@playwright/test';

import { SessionResponseSchema, SupportStatusSchema } from '../../src/contracts/api.js';

export async function openRuntimeSession(page: Page, url: string): Promise<void> {
  const origin = new URL(url).origin;
  const startup = page.waitForResponse(async (response) => {
    const target = new URL(response.url());
    if (target.origin !== origin) return false;
    if (target.pathname === '/api/support/refresh' && response.request().method() === 'POST') return true;
    if (target.pathname !== '/api/session') return false;
    return SessionResponseSchema.parse(await response.json()).support?.enabled !== true;
  });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.monaco-diff-editor')).toBeVisible();
  const response = await startup;
  if (new URL(response.url()).pathname === '/api/support/refresh' && response.ok()) {
    const support = SupportStatusSchema.parse(await response.json());
    if (support.status === 'unverified') {
      await page.getByRole('button', { name: 'Not now', exact: true }).click();
      await expect(page.locator('.support-dialog-backdrop')).toBeHidden();
    }
  }
}
