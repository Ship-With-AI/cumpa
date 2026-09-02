import { execFile } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

import { expect, test } from '@playwright/test';

const execFileAsync = promisify(execFile);
const script = new URL('../../scripts/verify-supabase-support.mjs', import.meta.url).pathname;
const fingerprint = 'dd65eea0329dcb94b17187af9dff28c31a1d78026737a16af75979a1fa4618e5';
const origin = 'https://abcdefghijklmnopqrst.supabase.co';

async function reject(args: string[], message: string) {
  await expect(execFileAsync(process.execPath, [script, ...args])).rejects.toMatchObject({
    stderr: expect.stringContaining(message),
  });
}

test('acceptance and promotion evidence reject incomplete hostile lineage and conflicting options', async ({}, testInfo) => {
  const evidence = testInfo.outputPath('evidence.json');
  const deployment = testInfo.outputPath('deployment.json');
  await writeFile(deployment, JSON.stringify({ version: 1, kind: 'deployment-run', mode: 'prelaunch-test', fingerprint }));
  await writeFile(evidence, JSON.stringify({
    version: 1,
    kind: 'acceptance',
    mode: 'prelaunch-test',
    fingerprint,
    public_origin: origin,
    acceptance_marker: { status: 'interactive-matrix-complete' },
    hostile_matrix: [{ id: 'wrong-signature', fixtures: [], before: {}, after: {} }],
    fixture_manifest: { 'auth.users': { count: 0, handles: [] } },
    run: { id: 'run', url: 'https://github.com/example/run', commit: 'a'.repeat(40), immutable: false },
  }));

  await reject(['--check-acceptance-evidence', evidence], 'missing required option --deployment');
  await reject(['--check-acceptance-evidence', evidence, '--deployment', deployment, '--require-immutable-run'], 'evidence run is not immutable');
  await reject(['--check-promotion-evidence', evidence, '--non-destructive', '--require-exact-cleanup'], 'conflicting options');
});
