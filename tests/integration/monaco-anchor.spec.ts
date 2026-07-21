import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';

const repositoryRoot = resolve(import.meta.dirname, '../..');
let server: ViteDevServer | undefined;
let origin = '';

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

test.beforeAll(async () => {
  origin = await startPrototypeServer();
});

test.afterAll(async () => {
  await server?.close();
});

test('Monaco stability: real renderer reaches the paired-zone alignment gate', async ({ page }) => {
  await page.goto(`${origin}/monaco-stability`);
  await expect(page.getByTestId('monaco-render-status')).toHaveText('Rendered real Monaco');

  const diff = page.locator('.monaco-diff-editor');
  await expect(diff).toBeVisible();
  expect(await diff.boundingBox()).not.toBeNull();

  const state = await page.evaluate(() => (window as Window & {
    __monacoStabilityPrototype?: {
      rendered: boolean;
      language: string;
      liveModels: number;
      diffUpdates: number;
      pairedZones: number;
      alignment: string;
    };
  }).__monacoStabilityPrototype);
  expect(state).toMatchObject({
    rendered: true,
    language: 'typescript',
    liveModels: 2,
  });
  expect(state?.diffUpdates).toBeGreaterThan(0);

  expect(state?.alignment, 'Monaco stability: paired-zone top alignment after real diff render').toBe('aligned');
});
