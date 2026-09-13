import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';

const repositoryRoot = resolve(import.meta.dirname, '../..');
let server: ViteDevServer | undefined;
let origin = '';

test.beforeAll(async () => {
  server = await createServer({ configFile: resolve(repositoryRoot, 'vite.config.ts') });
  await server.listen();
  origin = server.resolvedUrls?.local[0] ?? '';
});

test.afterAll(async () => {
  await server?.close();
});

test('traps every supported focusable control and owns Escape', async ({ page }) => {
  await page.goto(`${origin}tests/fixtures/modal-dialog.html`);

  const opener = page.getByRole('button', { name: 'Open dialog' });
  await opener.click();

  const dialog = page.getByRole('dialog', { name: 'Focus harness' });
  const close = dialog.getByRole('button', { name: 'Close dialog' });
  const textarea = dialog.getByRole('textbox', { name: 'Notes' });
  const link = dialog.getByRole('link', { name: 'Details' });
  const last = dialog.getByRole('button', { name: 'Last control' });

  await expect(close).toBeFocused();
  await last.focus();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(last).toBeFocused();

  await textarea.focus();
  await page.keyboard.press('Tab');
  await expect(link).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});
