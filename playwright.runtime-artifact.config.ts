import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: 'node_modules/.cache/cumpa-runtime-playwright',
  testMatch: [
    '**/e2e/package-assets.spec.ts',
    '**/e2e/agent-ready-export.spec.ts',
  ],
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: 'line',
  timeout: 30_000,
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        browserName: 'chromium',
        headless: true,
      },
    },
  ],
});
