import { execFile } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

import { expect, test } from '@playwright/test';

const execFileAsync = promisify(execFile);
const script = new URL('../../scripts/verify-supabase-support.mjs', import.meta.url).pathname;

async function reject(args: string[], message: string) {
  await expect(execFileAsync(process.execPath, [script, ...args])).rejects.toMatchObject({
    stderr: expect.stringContaining(message),
  });
}

test('run evidence validation fails closed on schema, origin, raw-value, and option violations', async ({}, testInfo) => {
  const evidence = testInfo.outputPath('evidence.json');
  await writeFile(evidence, JSON.stringify({
    version: 99,
    kind: 'deployment-run',
    mode: 'prelaunch-test',
    run: { id: 'run', url: 'https://github.com/example/run', commit: 'a'.repeat(40), immutable: true },
    fingerprint: 'a'.repeat(64),
    public_origin: 'https://secret-ref.supabase.co',
  }));

  await reject(['--check-run-evidence', evidence], 'missing required option --expected-mode');
  await reject(['--check-run-evidence', evidence, '--expected-mode', 'prelaunch-test', '--expected-mode', 'prelaunch-test'], 'duplicate option --expected-mode');
  await reject(['--check-run-evidence', evidence, '--expected-mode', 'prelaunch-test', '--require-custom-domain-routes', '--require-custom-domain-routes'], 'duplicate option --require-custom-domain-routes');
  await reject(['--check-run-evidence', evidence, '--expected-mode', 'prelaunch-test', '--require-exact-cleanup', '--acceptance'], 'missing value --acceptance');
  await reject(['--check-run-evidence', evidence, '--expected-mode', 'prelaunch-test'], 'evidence contains protected or raw content');
});
