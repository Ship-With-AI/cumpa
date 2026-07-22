import type { DraftRecoveryResult, DraftStore } from './draft-store.js';

export type DraftRecovery = Readonly<{
  recover(input: Readonly<{ readonly expectedFingerprint: string }>): Promise<DraftRecoveryResult>;
}>;

export function createDraftRecovery(draftStore: DraftStore): DraftRecovery {
  return Object.freeze({
    recover: async (input) => draftStore.recover(input),
  });
}
