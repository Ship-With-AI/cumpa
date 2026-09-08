import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/package/agent-ready-export.test.ts'],
    fileParallelism: false,
    testTimeout: 600_000,
    hookTimeout: 30_000,
  },
});
