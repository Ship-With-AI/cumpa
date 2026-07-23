import { mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { ReExportCapability } from './export-store.js';

type DirectoryExchangeAddon = Readonly<{
  readonly exchangeDirectories: (
    root: string,
    stable: string,
    candidate: string,
  ) => Readonly<{ readonly kind: 'supported' | 'unsupported' | 'failed' }>;
  readonly probeDirectoryExchange: (root: string) => Readonly<{ readonly kind: 'supported' | 'unsupported' | 'failed' }>;
}>;

const require = createRequire(import.meta.url);
let observedCapability: Promise<ReExportCapability> | undefined;

async function observeNativeExchangeCapability(): Promise<ReExportCapability> {
  const probeRoot = await mkdtemp(join(tmpdir(), 'diff-review-native-exchange-probe-'));
  try {
    const addon = require('../native/directory_exchange.node') as DirectoryExchangeAddon;
    if (addon.probeDirectoryExchange(probeRoot).kind !== 'supported') {
      return Object.freeze({ kind: 'reExportUnsupported' });
    }
    return Object.freeze({
      kind: 'observedNativeExchange',
      exchangeDirectories: addon.exchangeDirectories,
    });
  } catch {
    return Object.freeze({ kind: 'reExportUnsupported' });
  } finally {
    await rm(probeRoot, { recursive: true, force: true });
  }
}

export function getObservedNativeExchangeCapability(): Promise<ReExportCapability> {
  observedCapability ??= observeNativeExchangeCapability();
  return observedCapability;
}
