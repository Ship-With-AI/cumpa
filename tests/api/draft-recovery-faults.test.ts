import { describe, expect, test } from 'vitest';

import { createDraftRecovery } from '../../src/server/draft-recovery.js';

describe('backup-first recovery fault boundaries', () => {
  test('requires a verified backup before a replacement is acknowledged', async () => {
    const recovery = createDraftRecovery({
      repositoryRoot: '/fixture/repository',
      comparison: {
        baseCommitOid: '1'.repeat(40),
        headCommitOid: '2'.repeat(40),
        mergeBaseOid: '3'.repeat(40),
      },
      fileSystem: {
        readFile: async () => Buffer.from('{"schemaVersion":1,"invalid":true}', 'utf8'),
        mkdir: async () => undefined,
        open: async () => { throw new Error('backup open failed'); },
        rename: async () => undefined,
        unlink: async () => undefined,
        syncDirectory: async () => undefined,
      },
    });
    await expect(recovery.recover({ expectedFingerprint: '0'.repeat(64) })).resolves.not.toMatchObject({ kind: 'recovered' });
  });
});
