import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
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
test('deployment accepts hosted response contracts without losing redacted errors', async ({}, testInfo) => {
  const projectRef = 'a'.repeat(20);
  const bin = testInfo.outputPath('bin');
  const npx = join(bin, 'npx');
  const fetchHook = testInfo.outputPath('fetch-hook.mjs');
  await mkdir(bin, { recursive: true });
  await writeFile(npx, `#!/usr/bin/env node
const actual = process.argv.slice(2);
const projectRef = process.env.SUPABASE_PROJECT_REF;
const database = JSON.stringify(['supabase@2.114.0', 'db', 'push', '--project-ref', projectRef]);
const functions = ['support-api', 'support-flow', 'stripe-webhook'];
const functionDeployment = actual.length === 9 && actual[0] === 'supabase@2.114.0' && actual[1] === 'functions' && actual[2] === 'deploy' && functions.includes(actual[3]) && actual[4] === '--project-ref' && actual[5] === projectRef && actual[6] === '--use-api' && actual[7] === '--import-map' && actual[8] === 'supabase/functions/deno.json';
if (JSON.stringify(actual) !== database && !functionDeployment) {
  console.error(\`unexpected npx arguments: \${JSON.stringify(actual)}\`);
  process.exit(92);
}
`);
  await chmod(npx, 0o755);
  await writeFile(fetchHook, [
    'let calls = 0;',
    'globalThis.fetch = async (_url, options = {}) => {',
    "  if (++calls === 1) return new Response('{}');",
    '  if (calls === 2) {',
    '    const actual = JSON.parse(options.body);',
    '    const expected = [',
    "      { name: 'STRIPE_SECRET_KEY', value: process.env.STRIPE_SECRET_KEY },",
    "      { name: 'STRIPE_WEBHOOK_SECRET', value: process.env.STRIPE_WEBHOOK_SECRET },",
    "      { name: 'STRIPE_PRICE_ID', value: process.env.STRIPE_PRICE_ID },",
    '    ];',
    "    if (JSON.stringify(actual) !== JSON.stringify(expected)) return new Response(JSON.stringify({ message: `unexpected secrets payload ${process.env.SUPABASE_DB_PASSWORD}` }), { status: 400 });",
    '    return new Response(null, { status: 201 });',
    '  }',
    "  if (calls === 3) return new Response('[]');",
    "  if (calls === 4) return new Response('{}', { status: 401, headers: { 'content-type': 'application/json' } });",
    "  if (calls === 5) return new Response('{}', { status: 400, headers: { 'content-type': 'application/json' } });",
    "  if (calls === 6) return new Response('', { status: 400, headers: { 'content-type': 'text/plain; charset=utf-8' } });",
    "  if (calls === 7) return new Response('{}', { status: 400, headers: { 'content-type': 'application/json' } });",
    '  return new Response(JSON.stringify({ message: `route probes accepted ${process.env.SUPABASE_DB_PASSWORD}` }), { status: 400 });',
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

  expect(failure?.stderr).toContain('HTTP 400: {"message":"route probes accepted [redacted]"}');
  expect(failure?.stderr).not.toContain('sensitive-db-value');
});

test('live deployment rejects nonzero authority and keeps its smoke non-destructive', async ({}, testInfo) => {
  const projectRef = 'a'.repeat(20);
  const origin = `https://${projectRef}.supabase.co`;
  const bin = testInfo.outputPath('live-bin');
  const npx = join(bin, 'npx');
  const fetchHook = testInfo.outputPath('live-fetch-hook.mjs');
  const evidence = testInfo.outputPath('live-deployment.json');
  await mkdir(bin, { recursive: true });
  await writeFile(npx, '#!/usr/bin/env node\n');
  await chmod(npx, 0o755);
  await writeFile(fetchHook, `
globalThis.fetch = async (input, options = {}) => {
  const url = String(input);
  if (url.includes('/database/query')) {
    if (process.env.NONZERO === 'true') return new Response(JSON.stringify([{ table_name: 'auth.users', id: '11111111-1111-4111-8111-111111111111' }]));
    return new Response('[]');
  }
  if (url === 'https://api.stripe.com/v1/prices/price_live') return new Response(JSON.stringify({ object: 'price', active: true, livemode: true, currency: 'usd', unit_amount: 4999, type: 'one_time' }));
  if (url === 'https://api.stripe.com/v1/webhook_endpoints/we_live') return new Response(JSON.stringify({ object: 'webhook_endpoint', status: 'enabled', livemode: true, url: '${origin}/functions/v1/stripe-webhook', enabled_events: ['checkout.session.completed', 'checkout.session.async_payment_succeeded'] }));
  if (url.includes('/config/auth')) return new Response('{}');
  if (url.includes('/secrets')) return new Response(null, { status: 201 });
  if (url.includes('/auth/v1/settings')) return new Response('{}', { status: 401, headers: { 'content-type': 'application/json' } });
  if (url.includes('/support-api/status?')) return new Response('{"status":"unverified"}', { status: 200, headers: { 'content-type': 'application/json' } });
  if (url.endsWith('/support-api')) return new Response('{}', { status: 400, headers: { 'content-type': 'application/json' } });
  if (url.endsWith('/support-flow')) return new Response('', { status: 400, headers: { 'content-type': 'text/plain' } });
  if (url.endsWith('/stripe-webhook')) return new Response('{}', { status: 400, headers: { 'content-type': 'application/json' } });
  throw new Error('unexpected hosted request');
};
`);
  const environment = {
    ...process.env,
    PATH: `${bin}${delimiter}${process.env.PATH ?? ''}`,
    NODE_OPTIONS: `--import=${pathToFileURL(fetchHook).href}`,
    GITHUB_ACTIONS: 'true',
    CUMPA_DEPLOYMENT_ENVIRONMENT: 'production',
    SUPPORT_PROVIDER_MODE: 'production-live',
    SUPABASE_ACCESS_TOKEN: 'token',
    SUPABASE_PROJECT_REF: projectRef,
    SUPABASE_DB_PASSWORD: 'database-password',
    SUPABASE_GITHUB_CLIENT_ID: 'github-client',
    SUPABASE_GITHUB_CLIENT_SECRET: 'github-secret',
    STRIPE_SECRET_KEY: 'sk_live_example',
    STRIPE_WEBHOOK_SECRET: 'whsec_example',
    STRIPE_PRICE_ID: 'price_live',
    STRIPE_WEBHOOK_ENDPOINT_ID: 'we_live',
    GITHUB_RUN_ID: '200',
    GITHUB_SERVER_URL: 'https://github.com',
    GITHUB_REPOSITORY: 'example/repo',
    GITHUB_SHA: 'd'.repeat(40),
  };
  const args = ['--run-deployment', '--mode', 'production-live', '--evidence', evidence];

  await expect(execFileAsync(process.execPath, [script, ...args], { env: environment })).resolves.toBeDefined();
  expect(JSON.parse(await readFile(evidence, 'utf8'))).toMatchObject({
    mode: 'production-live',
    coherence: { status: 'passed' },
    live_smoke: { status: 'passed', non_destructive: true },
  });
  await expect(execFileAsync(process.execPath, [script, ...args], {
    env: { ...environment, NONZERO: 'true' },
  })).rejects.toMatchObject({ stderr: expect.stringContaining('evidence authority is not zero') });
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
    ['cleanup evidence', '02-09-ACCEPTANCE-EVIDENCE.md', '02-09-ACCEPTANCE-MARKER.json', 'workflow is missing required'],
    ['cleanup branch', 'args+=(--acceptance "$acceptance")', 'args+=(--acceptance-marker "$acceptance")', 'workflow is missing required'],
    ['live branch', 'production-live', 'production-staging', 'workflow is missing required'],
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

test('acceptance markers reject browser observations not covered by their digest', async ({}, testInfo) => {
  const projectRef = 'a'.repeat(20);
  const publicOrigin = `https://${projectRef}.supabase.co`;
  const observations = {
    browser_matrix: [
      'paid-support',
      'restart-persistence',
      'restore-paid-one',
      'restore-paid-two',
      'restore-unpaid',
      'checkout-delay',
      'checkout-cancellation',
    ].map((id) => ({ id, status: 'passed' })),
    completion: { status: 200, content_type: 'text/plain', body: 'Support flow complete. You can return to Cumpa.' },
    review_unrestricted: true,
  };
  const marker = testInfo.outputPath('marker.json');
  const deployment = testInfo.outputPath('deployment.json');
  await writeFile(marker, JSON.stringify({
    version: 1,
    kind: 'acceptance-marker',
    mode: 'prelaunch-test',
    fingerprint: createHash('sha256').update(projectRef).digest('hex'),
    public_origin: publicOrigin,
    run: { id: '100', url: 'https://github.com/example/repo/actions/runs/100', commit: 'b'.repeat(40), immutable: true },
    routes: {
      'auth-settings': { status: 401, content_type: 'application/json' },
      'support-api-invalid-input': { status: 400, content_type: 'application/json' },
      'support-flow-invalid-state': { status: 400, content_type: 'text/plain' },
      'stripe-webhook-invalid-signature': { status: 400, content_type: 'application/json' },
    },
    acceptance_marker: {
      status: 'interactive-matrix-complete',
      deployment_evidence_sha256: '1'.repeat(64),
      observations_sha256: '2'.repeat(64),
    },
    observations,
  }));
  await writeFile(deployment, '{}');

  await reject([
    '--check-acceptance-marker', marker,
    '--deployment', deployment,
    '--expected-mode', 'prelaunch-test',
  ], 'acceptance marker observations digest does not match');
});
