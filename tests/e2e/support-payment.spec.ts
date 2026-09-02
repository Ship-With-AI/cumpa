import { execFile } from 'node:child_process';
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { delimiter, join } from 'node:path';
import { pathToFileURL } from 'node:url';
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
  await reject([
    '--run-deployment',
    '--mode',
    'prelaunch-test',
    '--evidence',
    testInfo.outputPath('deployment.json'),
  ], 'hosted deployment is CI-only');
  await reject(['--verify-workflow', workflow, '--require-environment'], 'missing value --require-environment');
  await reject(['--verify-workflow', workflow, '--require-environment', 'production', '--require-environment', 'production'], 'duplicate option --require-environment');
  await reject(['--verify-workflow', workflow, '--expected-mode', 'invalid'], 'invalid expected mode');
  await reject(['--verify-workflow', workflow, '--unknown'], 'unknown option --unknown');
  await reject(['--verify-workflow', workflow, '--require-custom-domain'], 'unknown option --require-custom-domain');
});
test('deployment targets the protected project, sends secret entries, and redacts hosted errors', async ({}, testInfo) => {
  const projectRef = 'a'.repeat(20);
  const bin = testInfo.outputPath('bin');
  const npx = join(bin, 'npx');
  const fetchHook = testInfo.outputPath('fetch-hook.mjs');
  await mkdir(bin, { recursive: true });
  await writeFile(npx, `#!/usr/bin/env node
const expected = ['supabase@2.114.0', 'db', 'push', '--project-ref', process.env.SUPABASE_PROJECT_REF];
const actual = process.argv.slice(2);
if (JSON.stringify(actual) !== JSON.stringify(expected)) {
  console.error(\`unexpected npx arguments: \${JSON.stringify(actual)}\`);
  process.exit(92);
}
`);
  await chmod(npx, 0o755);
  await writeFile(fetchHook, [
    'let calls = 0;',
    'globalThis.fetch = async (_url, options = {}) => {',
    "  if (++calls === 1) return new Response('{}');",
    '  const actual = JSON.parse(options.body);',
    '  const expected = [',
    "    { name: 'STRIPE_SECRET_KEY', value: process.env.STRIPE_SECRET_KEY },",
    "    { name: 'STRIPE_WEBHOOK_SECRET', value: process.env.STRIPE_WEBHOOK_SECRET },",
    "    { name: 'STRIPE_PRICE_ID', value: process.env.STRIPE_PRICE_ID },",
    '  ];',
    "  const message = JSON.stringify(actual) === JSON.stringify(expected) ? 'secrets array accepted' : 'unexpected secrets payload';",
    '  return new Response(JSON.stringify({ message: `${message} ${process.env.SUPABASE_DB_PASSWORD}` }), { status: 400 });',
    '};',
    '',
  ].join('\n'));

  const failure = await execFileAsync(process.execPath, [
    script,
    '--run-deployment',
    '--mode',
    'prelaunch-test',
    '--evidence',
    testInfo.outputPath('deployment.json'),
  ], {
    env: {
      ...process.env,
      PATH: `${bin}${delimiter}${process.env.PATH ?? ''}`,
      NODE_OPTIONS: `--import=${pathToFileURL(fetchHook).href}`,
      GITHUB_ACTIONS: 'true',
      CUMPA_DEPLOYMENT_ENVIRONMENT: 'production',
      SUPPORT_PROVIDER_MODE: 'prelaunch-test',
      SUPABASE_ACCESS_TOKEN: 'token',
      SUPABASE_PROJECT_REF: projectRef,
      SUPABASE_DB_PASSWORD: 'sensitive-db-value',
      SUPABASE_GITHUB_CLIENT_ID: 'client-id',
      SUPABASE_GITHUB_CLIENT_SECRET: 'client-secret',
      STRIPE_SECRET_KEY: 'stripe-secret',
      STRIPE_WEBHOOK_SECRET: 'webhook-secret',
      STRIPE_PRICE_ID: 'price',
      STRIPE_WEBHOOK_ENDPOINT_ID: 'endpoint',
    },
  }).then(() => undefined, (error: { stderr: string }) => error);

  expect(failure?.stderr).toContain('HTTP 400: {"message":"secrets array accepted [redacted]"}');
  expect(failure?.stderr).not.toContain('sensitive-db-value');
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
    ['playwright', 'npx playwright test tests/e2e/support-payment.spec.ts tests/e2e/support-recovery.spec.ts tests/e2e/support-restore.spec.ts', 'npx playwright test tests/e2e/support-payment.spec.ts', 'workflow is missing required'],
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
