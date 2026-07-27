import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';

const repositoryRoot = resolve(import.meta.dirname, '../..');
let server: ViteDevServer | undefined;
let origin = '';

type PrototypeState = {
  rendered: boolean;
  language: string;
  fileId: string;
  diffUpdates: number;
  liveModels: number;
  listenerCount: number;
  pairedZones: number;
  activeComposers: number;
  contextMode: 'collapsed' | 'all-revealed';
};

async function startPrototypeServer(): Promise<string> {
  server = await createServer({
    configFile: resolve(repositoryRoot, 'vite.config.ts'),
    plugins: [
      {
        name: 'monaco-stability-prototype-entry',
        configureServer(viteServer) {
          viteServer.middlewares.use('/monaco-stability', (_request, response) => {
            response.statusCode = 200;
            response.setHeader('content-type', 'text/html');
            response.end(`<!doctype html><html lang="en"><body><div id="app"></div><script type="module" src="/__monaco-stability-entry.ts"></script></body></html>`);
          });
        },
        resolveId(id) {
          return id === '/__monaco-stability-entry.ts' ? id : undefined;
        },
        load(id) {
          return id === '/__monaco-stability-entry.ts'
            ? `import { createApp } from 'vue';\nimport Prototype from '/prototypes/MonacoStabilityPrototype.vue';\ncreateApp(Prototype).mount('#app');`
            : undefined;
        },
      },
    ],
    server: { host: '127.0.0.1', port: 0 },
  });
  await server.listen();
  return server.resolvedUrls?.local[0]?.replace(/\/$/, '') ?? '';
}

async function readState(page: Page): Promise<PrototypeState> {
  return page.evaluate(() => (window as Window & {
    __monacoStabilityPrototype: PrototypeState;
  }).__monacoStabilityPrototype);
}

async function openPrototype(page: Page): Promise<void> {
  await page.goto(`${origin}/monaco-stability`);
  await expect(page.getByTestId('monaco-render-status')).toHaveText('Rendered real Monaco');
}

async function expectPairedZonesAligned(page: Page): Promise<void> {
  const composer = page.locator('.monaco-anchor-zone--composer');
  const spacer = page.locator('.monaco-anchor-zone--spacer');
  await expect(composer).toBeVisible();
  await expect(spacer).toBeVisible();
  const [composerBox, spacerBox] = await Promise.all([composer.boundingBox(), spacer.boundingBox()]);
  expect(composerBox, 'Monaco stability: composer zone must be rendered').not.toBeNull();
  expect(spacerBox, 'Monaco stability: paired spacer zone must be rendered').not.toBeNull();
  expect(Math.abs((composerBox?.y ?? 0) - (spacerBox?.y ?? 0)), 'Monaco stability: paired-zone top alignment').toBeLessThanOrEqual(1);
}

test.beforeAll(async () => {
  origin = await startPrototypeServer();
});

test.afterAll(async () => {
  await server?.close();
});

test('1. renders real read-only Monaco with exact immutable TypeScript fixture text', async ({ page }) => {
  await openPrototype(page);
  const diff = page.locator('.monaco-diff-editor');
  await expect(diff).toBeVisible();
  expect(await diff.boundingBox()).not.toBeNull();
  await expect(page.locator('.view-lines').nth(1)).toContainText("const inserted = 'head only';");
  await expect.poll(() => readState(page)).toMatchObject({
    rendered: true,
    language: 'typescript',
    fileId: 'fixture-a',
    liveModels: 2,
  });
});

test('2. anchors both base and head model lines through one active composer', async ({ page }) => {
  await openPrototype(page);
  await page.getByRole('button', { name: 'Add base comment' }).click();
  await expect(page.locator('textarea[aria-label=\"Comment\"]')).toHaveCount(1);
  await expect(page.locator('.monaco-anchor-zone--composer')).toContainText('Base · line 10');
  await expectPairedZonesAligned(page);

  await page.getByRole('button', { name: 'Add head comment' }).click();
  await expect(page.locator('.monaco-anchor-zone--composer')).toContainText('Head · line 16');
  await expect.poll(() => readState(page)).toMatchObject({ pairedZones: 2, activeComposers: 1 });
});

test('3. reveals a hidden durable anchor only through the public all-context fallback', async ({ page }) => {
  await openPrototype(page);
  await page.getByRole('button', { name: 'Show hidden comment' }).click();
  await expect(page.locator('.monaco-anchor-zone--composer')).toContainText('Head · line 5');
  await expect.poll(() => readState(page)).toMatchObject({ contextMode: 'all-revealed', pairedZones: 2 });
  await expectPairedZonesAligned(page);
});

test('4. keeps paired zones aligned through composer growth, layout, and resize', async ({ page }) => {
  await openPrototype(page);
  await page.getByRole('button', { name: 'Add head comment' }).click();
  await page.locator('textarea[aria-label=\"Comment\"]').fill('A deliberately long comment\nthat grows the editor-owned composer\nwithout moving its paired spacer.');
  await expectPairedZonesAligned(page);
  await page.setViewportSize({ width: 1280, height: 760 });
  await expectPairedZonesAligned(page);
  await expect.poll(() => readState(page)).toMatchObject({ liveModels: 2, pairedZones: 2 });
});

test('5. follows deterministic file order and public previous/next change controls', async ({ page }) => {
  await openPrototype(page);
  await expect(page.getByRole('button', { name: 'Previous file' })).toBeDisabled();
  await page.getByRole('button', { name: 'Next file' }).click();
  await expect(page.getByTestId('monaco-metrics')).toContainText('fixture-b · json');
  await page.getByRole('button', { name: 'Next file' }).click();
  await expect(page.getByTestId('monaco-metrics')).toContainText('fixture-added · typescript');
  await page.getByRole('button', { name: 'Next file' }).click();
  await expect(page.getByTestId('monaco-metrics')).toContainText('fixture-deleted · typescript');
  await expect(page.getByRole('button', { name: 'Next file' })).toBeDisabled();
  await page.getByRole('button', { name: 'Previous change' }).click();
  await page.getByRole('button', { name: 'Next change' }).click();
  await page.keyboard.press('F7');
  await page.keyboard.press('Shift+F7');
  await page.getByRole('button', { name: 'Previous file' }).click();
  await page.getByRole('button', { name: 'Previous file' }).click();
  await page.getByRole('button', { name: 'Previous file' }).click();
  await expect(page.getByTestId('monaco-metrics')).toContainText('fixture-a · typescript');
});

test('6. restores A → B → A composer text, focus side, and model state after readiness', async ({ page }) => {
  await openPrototype(page);
  await page.getByRole('button', { name: 'Add base comment' }).click();
  await page.locator('textarea[aria-label=\"Comment\"]').fill('preserved composer text');
  await page.getByRole('button', { name: 'Next file' }).click();
  await page.getByRole('button', { name: 'Previous file' }).click();
  await expect(page.locator('textarea[aria-label=\"Comment\"]')).toHaveValue('preserved composer text');
  await expect(page.locator('.monaco-anchor-zone--composer')).toContainText('Base · line 10');
  await expect.poll(() => readState(page)).toMatchObject({ fileId: 'fixture-a', liveModels: 2, pairedZones: 2 });
});

test('7. bounds live models, listeners, zones, and composers over ten recomputations', async ({ page }) => {
  await openPrototype(page);
  await page.getByRole('button', { name: 'Add head comment' }).click();
  const initial = await readState(page);
  expect(initial.listenerCount).toBe(13);
  await page.getByRole('button', { name: 'Recompute 10 times' }).click();
  await expect.poll(() => readState(page)).toMatchObject({
    fileId: 'fixture-a',
    liveModels: 2,
    listenerCount: initial.listenerCount,
    pairedZones: 2,
  });
  expect((await readState(page)).diffUpdates).toBeGreaterThanOrEqual(11);
});

test('8. keyboard and pointer activation converge on the same one-composer action', async ({ page }) => {
  await openPrototype(page);
  await page.getByRole('button', { name: 'Add head comment' }).click();
  await expect(page.locator('textarea[aria-label=\"Comment\"]')).toHaveCount(1);
  await page.locator('.monaco-editor').nth(1).click({ position: { x: 80, y: 60 } });
  await page.keyboard.press('Alt+Enter');
  await expect(page.locator('textarea[aria-label=\"Comment\"]')).toHaveCount(1);
  await expect.poll(() => readState(page)).toMatchObject({ activeComposers: 1, pairedZones: 2 });
});

test('9. uses read-only side editors and preserves separate base/head syntax language selection', async ({ page }) => {
  await openPrototype(page);
  await page.getByRole('button', { name: 'Next file' }).click();
  await expect.poll(() => readState(page)).toMatchObject({ language: 'json', liveModels: 2 });
  await page.locator('.monaco-editor').nth(1).click({ position: { x: 80, y: 60 } });
  await page.keyboard.type('unsafe mutation');
  await expect(page.locator('.view-lines').nth(1)).not.toContainText('unsafe mutation');
  await page.getByRole('button', { name: 'Previous file' }).click();
  await expect.poll(() => readState(page)).toMatchObject({ language: 'typescript', liveModels: 2 });
});

test('10. reconstructs paired public zones after repeated diff updates without duplicate composers', async ({ page }) => {
  await openPrototype(page);
  await page.getByRole('button', { name: 'Add base comment' }).click();
  await page.getByRole('button', { name: 'Recompute 10 times' }).click();
  await expect(page.locator('textarea[aria-label=\"Comment\"]')).toHaveCount(1);
  await expect(page.locator('.monaco-anchor-zone')).toHaveCount(2);
  await expectPairedZonesAligned(page);
  await expect.poll(() => readState(page)).toMatchObject({ pairedZones: 2, activeComposers: 1, liveModels: 2 });
});


test('11. paints first-frame semantic theme, flat empty regions, and sparse signed bars', async ({ page }) => {
  await openPrototype(page);

  const canvas = page.locator('.monaco-editor-background').first();
  const gutter = page.locator('.monaco-editor .margin').first();
  await expect(canvas).toHaveCSS('background-color', 'rgb(13, 17, 23)');
  await expect(gutter).toHaveCSS('background-color', 'rgb(1, 4, 9)');

  const headBars = page.locator('.monaco-diff-change-bar--head');
  const baseBars = page.locator('.monaco-diff-change-bar--base');
  const headSigns = page.locator('.monaco-diff-change-sign--head');
  const baseSigns = page.locator('.monaco-diff-change-sign--base');
  await expect(headBars).not.toHaveCount(0);
  await expect(baseBars).not.toHaveCount(0);
  await expect(headSigns).not.toHaveCount(0);
  await expect(baseSigns).not.toHaveCount(0);
  await expect(headBars.first()).toHaveCSS('border-left-width', '2px');
  await expect(baseBars.first()).toHaveCSS('border-left-width', '2px');
  await expect(headSigns.first()).toHaveJSProperty('tabIndex', -1);
  await expect(baseSigns.first()).toHaveJSProperty('tabIndex', -1);
  await expect.poll(() => headSigns.first().evaluate((element) => getComputedStyle(element, '::before').content)).toBe('"+"');
  await expect.poll(() => baseSigns.first().evaluate((element) => getComputedStyle(element, '::before').content)).toBe('"−"');

  await page.getByRole('button', { name: 'Next file' }).click();
  await page.getByRole('button', { name: 'Next file' }).click();
  const addedEmpty = page.locator('.diagonal-fill').first();
  await expect(addedEmpty).toHaveCSS('background-image', 'none');
  await expect(addedEmpty).toHaveCSS('background-color', 'rgb(1, 4, 9)');
  await expect(page.locator('.monaco-diff-change-sign--base')).toHaveCount(0);
  await expect(page.locator('.monaco-diff-change-sign--head')).not.toHaveCount(0);

  await page.getByRole('button', { name: 'Next file' }).click();
  await expect(page.locator('.monaco-diff-change-sign--head')).toHaveCount(0);
  await expect(page.locator('.monaco-diff-change-sign--base')).not.toHaveCount(0);
});
