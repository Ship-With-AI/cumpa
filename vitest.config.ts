import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'tests/unit/**/*.test.ts',
      'tests/git/**/*.test.ts',
      'tests/api/**/*.test.ts',
      'tests/cli/**/*.test.ts',
      'tests/package/**/*.test.ts',
    ],
    exclude: ['tests/package/agent-ready-export.test.ts'],
    testTimeout: 10_000,
    hookTimeout: 10_000,
  },
});
