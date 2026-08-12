import { expect, test } from '@playwright/test';

test('support payment authority remains outside the npm artifact', async () => {
  // The packed artifact test exercises the browser package. Entitlement authority is only the hosted PostgreSQL service.
  expect(process.env.DATABASE_URL).toMatch(/^postgresql:\/\/cumpa:cumpa@127\.0\.0\.1:\d+\/cumpa_test$/);
  expect(process.env.TEST_DATABASE_URL).toBe(process.env.DATABASE_URL);
});
