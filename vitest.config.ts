import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'tests/unit/**/*.test.ts',
      'tests/git/**/*.test.ts',
      'tests/api/**/*.test.ts',
    ],
    testTimeout: 10_000,
    hookTimeout: 10_000,
  },
});
