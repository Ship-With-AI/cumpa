import { expect, test } from '@playwright/test';

test('recovery E2E uses the migrated shared PostgreSQL deployment URL', async () => {
  expect(process.env.DATABASE_URL).toMatch(/^postgresql:\/\/cumpa:cumpa@127\.0\.0\.1:\d+\/cumpa_test$/);
  expect(process.env.TEST_DATABASE_URL).toBe(process.env.DATABASE_URL);
});
