import { describe, expect, test } from 'vitest';

import {
  SupportCheckoutResultSchema,
  SupportRecoveryRequestSchema,
  SupportStatusSchema,
} from '../../src/contracts/api.js';

describe('support API contracts', () => {
  test('rejects unknown fields and unsafe checkout URLs', () => {
    expect(SupportStatusSchema.safeParse({ status: 'verified', email: 'payer@example.test' }).success).toBe(false);
    expect(SupportRecoveryRequestSchema.safeParse({ email: 'payer@example.test', token: 'secret' }).success).toBe(false);
    expect(SupportCheckoutResultSchema.safeParse({ kind: 'ready', url: 'http://example.test' }).success).toBe(false);
  });
});
