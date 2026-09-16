import { defineConfig, devices } from '@playwright/test';
import { custodyGatedSpecs } from './playwright.runtime-artifact.config.js';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  testIgnore: custodyGatedSpecs,
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
