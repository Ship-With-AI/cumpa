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

test('the CI verifier rejects malformed and retired routing options', async ({}, testInfo) => {
  const workflow = testInfo.outputPath('workflow.yml');
  await writeFile(workflow, 'name: unsafe\non: workflow_dispatch\n');

  await reject(['--deploy'], 'unknown option --deploy');
  await reject(['--verify-workflow'], 'missing value --verify-workflow');
  await reject(['--verify-workflow', workflow, '--require-environment'], 'missing value --require-environment');
  await reject(['--verify-workflow', workflow, '--require-environment', 'production', '--require-environment', 'production'], 'duplicate option --require-environment');
  await reject(['--verify-workflow', workflow, '--expected-mode', 'invalid'], 'invalid expected mode');
  await reject(['--verify-workflow', workflow, '--unknown'], 'unknown option --unknown');
  await reject(['--verify-workflow', workflow, '--require-custom-domain'], 'unknown option --require-custom-domain');
});

test('workflow verification rejects toolchain, database-order, and retired-input regressions', async ({}, testInfo) => {
  const source = await readFile(new URL('../../.github/workflows/deploy-supabase-production.yml', import.meta.url), 'utf8');
  const cases: Array<[string, string, string, string]> = [
    ['node', 'node-version: 24', 'node-version: 22', 'workflow is missing required'],
    ['deno', 'deno-version: v2.7.14', 'deno-version: v2.7.13', 'workflow is missing required'],
    ['install', 'npm ci', 'npm install', 'workflow is missing required'],
    ['build', 'npm run build', 'npm run build:runtime', 'workflow is missing required'],
    ['browser install', 'npx playwright install --with-deps chromium', 'npx playwright install chromium', 'workflow is missing required'],
    ['vitest', 'npx vitest run --no-file-parallelism', 'npx vitest run --no-file-parallelism tests/unit', 'workflow is missing required'],
    ['playwright', 'npx playwright test', 'npx playwright test tests/e2e/support-payment.spec.ts', 'workflow is missing required'],
    ['deno suite', 'deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests', 'deno test supabase/functions/tests', 'workflow is missing required'],
    ['Supabase pin', 'npx supabase@2.114.0 db start', 'npx supabase db start', 'workflow is missing required'],
    ['project ref', 'SUPABASE_PROJECT_REF: ${{ vars.SUPABASE_PROJECT_REF }}', 'SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}', 'workflow does not map the protected project ref'],
    ['stored origin', 'STRIPE_PRICE_ID: ${{ vars.STRIPE_PRICE_ID }}', 'SUPPORT_PUBLIC_ORIGIN: ${{ vars.SUPPORT_PUBLIC_ORIGIN }}', 'workflow contains forbidden retired input'],
    ['configured fingerprint', 'STRIPE_PRICE_ID: ${{ vars.STRIPE_PRICE_ID }}', 'APPROVED_SUPABASE_PROJECT_REF_SHA256: ${{ vars.APPROVED_SUPABASE_PROJECT_REF_SHA256 }}', 'workflow contains forbidden retired input'],
    ['domain command', 'node scripts/verify-supabase-support.mjs "${args[@]}"', 'npx supabase@2.114.0 domains activate --project-ref "$SUPABASE_PROJECT_REF"', 'workflow contains forbidden domain lifecycle'],
  ];
  for (const [name, expected, replacement, message] of cases) {
    const workflow = testInfo.outputPath(`${name}.yml`);
    await writeFile(workflow, source.replace(expected, replacement));
    await reject(['--verify-workflow', workflow], message);
  }
  const reordered = testInfo.outputPath('reordered.yml');
  await writeFile(reordered, source.replace(
    'npx supabase@2.114.0 db start\n      - run: npx supabase@2.114.0 db reset --local --no-seed',
    'npx supabase@2.114.0 db reset --local --no-seed\n      - run: npx supabase@2.114.0 db start',
  ));
  await reject(['--verify-workflow', reordered], 'workflow database gates are out of order');
  const testsReordered = testInfo.outputPath('tests-reordered.yml');
  await writeFile(testsReordered, source.replace(
    'npx playwright install --with-deps chromium\n      - run: npx vitest run --no-file-parallelism',
    'npx vitest run --no-file-parallelism\n      - run: npx playwright install --with-deps chromium',
  ));
  await reject(['--verify-workflow', testsReordered], 'workflow test gates are out of order');
});
