import { execFile } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

import { expect, test } from '@playwright/test';

const execFileAsync = promisify(execFile);
const script = new URL('../../scripts/verify-supabase-support.mjs', import.meta.url).pathname;
const origin = 'https://abcdefghijklmnopqrst.supabase.co';
const fingerprint = 'dd65eea0329dcb94b17187af9dff28c31a1d78026737a16af75979a1fa4618e5';

async function reject(args: string[], message: string) {
  await expect(execFileAsync(process.execPath, [script, ...args])).rejects.toMatchObject({
    stderr: expect.stringContaining(message),
  });
}

test('run evidence validation permits only canonical default-origin routes and fails closed', async ({}, testInfo) => {
  const evidence = testInfo.outputPath('evidence.json');
  const base = {
    version: 99,
    kind: 'deployment-run',
    mode: 'prelaunch-test',
    run: { id: 'run', url: 'https://github.com/example/run', commit: 'a'.repeat(40), immutable: true },
    fingerprint,
    public_origin: origin,
  };

  await writeFile(evidence, JSON.stringify(base));
  await reject(['--check-run-evidence', evidence], 'missing required option --expected-mode');
  await reject(['--check-run-evidence', evidence, '--expected-mode', 'prelaunch-test', '--expected-mode', 'prelaunch-test'], 'duplicate option --expected-mode');
  await reject(['--check-run-evidence', evidence, '--expected-mode', 'prelaunch-test', '--require-immutable-run', '--require-immutable-run'], 'duplicate option --require-immutable-run');
  await reject(['--check-run-evidence', evidence, '--expected-mode', 'prelaunch-test', '--require-exact-cleanup', '--acceptance'], 'missing value --acceptance');
  await reject(['--check-run-evidence', evidence, '--expected-mode', 'prelaunch-test'], 'evidence version must be 1');

  await writeFile(evidence, JSON.stringify({ ...base, release_label: 'abcdefghijklmnopqrst' }));
  await reject(['--check-run-evidence', evidence, '--expected-mode', 'prelaunch-test'], 'evidence contains protected or raw content');
  await writeFile(evidence, JSON.stringify({ ...base, release_url: 'https://otherprojectabcdefgh.supabase.co/functions/v1/support-api' }));
  await reject(['--check-run-evidence', evidence, '--expected-mode', 'prelaunch-test'], 'evidence contains protected or raw content');
});
