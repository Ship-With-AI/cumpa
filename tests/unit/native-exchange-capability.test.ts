import { describe, expect, test } from 'vitest';

import { createNativeExchangeCapabilityObserver } from '../../src/server/native-exchange-capability.js';

describe('native exchange capability observation', () => {
  test('fails closed when probe-directory setup rejects before the addon can load', async () => {
    let loadAttempts = 0;
    const observe = createNativeExchangeCapabilityObserver({
      mkdtemp: async () => {
        throw new Error('temporary directory unavailable');
      },
      rm: async () => undefined,
      loadAddon: () => {
        loadAttempts += 1;
        throw new Error('must not load after setup failure');
      },
    });

    await expect(observe()).resolves.toEqual({ kind: 'reExportUnsupported' });
    expect(loadAttempts).toBe(0);
  });

  test('fails closed when probe cleanup rejects after a supported probe', async () => {
    let cleanupAttempts = 0;
    const observe = createNativeExchangeCapabilityObserver({
      mkdtemp: async () => '/tmp/native-exchange-probe',
      rm: async () => {
        cleanupAttempts += 1;
        throw new Error('temporary directory cleanup unavailable');
      },
      loadAddon: () => ({
        exchangeDirectories: () => ({ kind: 'supported' }),
        probeDirectoryExchange: () => ({ kind: 'supported' }),
      }),
    });

    await expect(observe()).resolves.toEqual({ kind: 'reExportUnsupported' });
    expect(cleanupAttempts).toBe(1);
  });
});
