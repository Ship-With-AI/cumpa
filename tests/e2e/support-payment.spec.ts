import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

import { expect, test } from '@playwright/test';

const execFileAsync = promisify(execFile);
const script = new URL('../../scripts/verify-supabase-support.mjs', import.meta.url).pathname;

async function reject(args: string[], message: string) {
  await expect(execFileAsync(process.execPath, [script, ...args])).rejects.toMatchObject({
    stderr: expect.stringContaining(message),
  });
}

test('the CI verifier rejects local deployment and malformed workflow verifier arguments', async ({}, testInfo) => {
  const workflow = testInfo.outputPath('workflow.yml');
  await writeFile(workflow, 'name: unsafe\non: workflow_dispatch\n');

  await reject(['--deploy'], 'unknown option --deploy');
  await reject(['--verify-workflow'], 'missing value --verify-workflow');
  await reject(['--verify-workflow', workflow, '--require-environment'], 'missing value --require-environment');
  await reject(['--verify-workflow', workflow, '--require-environment', 'production', '--require-environment', 'production'], 'duplicate option --require-environment');
  await reject(['--verify-workflow', workflow, '--expected-mode', 'invalid'], 'invalid expected mode');
  await reject(['--verify-workflow', workflow, '--unknown'], 'unknown option --unknown');
  await reject(['--verify-workflow', workflow, '--require-custom-domain', '--require-custom-domain'], 'duplicate option --require-custom-domain');
});

test('workflow verification rejects toolchain pin, command, and database-order regressions', async ({}, testInfo) => {
  const source = await readFile(new URL('../../.github/workflows/deploy-supabase-production.yml', import.meta.url), 'utf8');
  const cases: Array<[string, string, string]> = [
    ['node', 'node-version: 24', 'node-version: 22'],
    ['deno', 'deno-version: v2.7.14', 'deno-version: v2.7.13'],
    ['install', 'npm ci', 'npm install'],
    ['vitest', 'npx vitest run', 'npx vitest run tests/unit'],
    ['playwright', 'npx playwright test --config=tests', 'npx playwright test'],
    ['deno suite', 'deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests', 'deno test supabase/functions/tests'],
    ['Supabase pin', 'npx supabase@2.114.0 db start', 'npx supabase db start'],
  ];
  for (const [name, expected, replacement] of cases) {
    const workflow = testInfo.outputPath(`${name}.yml`);
    await writeFile(workflow, source.replace(expected, replacement));
    await reject(['--verify-workflow', workflow], 'workflow is missing required');
  }
  const reordered = testInfo.outputPath('reordered.yml');
  await writeFile(reordered, source.replace(
    'npx supabase@2.114.0 db start\n      - run: npx supabase@2.114.0 db reset --local --no-seed',
    'npx supabase@2.114.0 db reset --local --no-seed\n      - run: npx supabase@2.114.0 db start',
  ));
  await reject(['--verify-workflow', reordered], 'workflow database gates are out of order');
});
