import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('Render deployment', () => {
  test('declares Node 24 web service, PostgreSQL, and secret-only configuration', async () => {
    const render = await readFile(resolve(import.meta.dirname, '../../../render.yaml'), 'utf8');
    expect(render).toContain('runtime: node');
    expect(render).toContain('nodeVersion: 24');
    expect(render).toContain('services/support');
    expect(render).toContain('databases:');
    for (const name of ['DATABASE_URL', 'EMAIL_LOOKUP_HMAC_KEY', 'RECOVERY_TOKEN_HMAC_KEY', 'PUBLIC_BASE_URL', 'RESEND_API_KEY', 'EMAIL_FROM']) {
      expect(render).toContain(name);
    }
    expect(render).not.toMatch(/(?:sk|rk|whsec)_(?:live|test)_[A-Za-z0-9]+/);
  });
});
