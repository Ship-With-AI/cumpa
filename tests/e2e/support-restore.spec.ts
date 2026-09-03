import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
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

test('acceptance marker and machine merge bind browser observations to the protected hostile run', async ({}, testInfo) => {
  const tables = [
    'auth.users',
    'support_private.support_intents',
    'support_private.supporters',
    'support_private.checkout_sessions',
    'support_private.stripe_events',
    'support_private.installation_bindings',
  ];
  const hash = (value: string) => createHash('sha256').update(value).digest('hex');
  const manifest = (populated: string[] = []) => Object.fromEntries(tables.map((table) => [
    table,
    { count: populated.includes(table) ? 1 : 0, handles: populated.includes(table) ? [hash(table)] : [] },
  ]));
  const routes = {
    'auth-settings': { status: 401, content_type: 'application/json' },
    'support-api-invalid-input': { status: 400, content_type: 'application/json' },
    'support-flow-invalid-state': { status: 400, content_type: 'text/plain' },
    'stripe-webhook-invalid-signature': { status: 400, content_type: 'application/json' },
  };
  const order = ['schema', 'auth-provider-configuration', 'edge-function-secrets', 'support-api', 'support-flow', 'stripe-webhook'];
  const deployment = {
    version: 1,
    kind: 'deployment-run',
    status: 'passed',
    mode: 'prelaunch-test',
    fingerprint,
    public_origin: origin,
    run: { id: '100', url: 'https://github.com/example/repo/actions/runs/100', commit: 'a'.repeat(40), immutable: true },
    order,
    routes,
    authority: manifest(),
    artifacts: { evidence_sha256: '' },
  };
  deployment.artifacts.evidence_sha256 = hash(JSON.stringify(deployment));
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
  const marker = {
    version: 1,
    kind: 'acceptance-marker',
    mode: 'prelaunch-test',
    fingerprint,
    public_origin: origin,
    run: deployment.run,
    routes,
    acceptance_marker: {
      status: 'interactive-matrix-complete',
      deployment_evidence_sha256: deployment.artifacts.evidence_sha256,
      observations_sha256: hash(JSON.stringify(observations)),
    },
    observations,
  };
  const rejected = manifest();
  const settled = manifest([
    'support_private.supporters',
    'support_private.stripe_events',
    'support_private.installation_bindings',
  ]);
  const hostileMatrix = [
    'wrong-signature',
    'wrong-product',
    'wrong-amount',
    'wrong-currency',
    'wrong-binding',
    'expired-intent',
    'reused-intent',
  ].map((id, index) => ({
    id,
    fixtures: [(index + 1).toString(16).padStart(64, '0')],
    before: rejected,
    after: rejected,
    expected: 'rejected-without-authority',
    actual: 'rejected-without-authority',
    guard: true,
  }));
  hostileMatrix.push({
    id: 'sequential-replay',
    fixtures: ['8'.padStart(64, '0')],
    before: rejected,
    after: settled,
    expected: 'idempotent-replay',
    actual: 'idempotent-replay',
    guard: true,
    responses: [200, 200],
    first_after: settled,
  });
  hostileMatrix.push({
    id: 'concurrent-replay-settlement',
    fixtures: ['9'.padStart(64, '0')],
    before: rejected,
    after: settled,
    expected: 'single-authority-settlement',
    actual: 'single-authority-settlement',
    guard: true,
    responses: [200, 503],
  });
  const hostileRun = {
    ...deployment,
    run: { id: '101', url: 'https://github.com/example/repo/actions/runs/101', commit: 'b'.repeat(40), immutable: true },
    hostile_matrix: hostileMatrix,
    fixture_manifest: settled,
    acceptance_marker: { ...marker.acceptance_marker, marker_sha256: hash(JSON.stringify(marker)) },
    artifacts: { evidence_sha256: '' },
  };
  hostileRun.artifacts.evidence_sha256 = hash(JSON.stringify(hostileRun));
  const deploymentPath = testInfo.outputPath('deployment.json');
  const observationsPath = testInfo.outputPath('observations.json');
  const markerPath = testInfo.outputPath('marker.json');
  const runPath = testInfo.outputPath('hostile-run.json');
  const outputPath = testInfo.outputPath('acceptance.md');
  await Promise.all([
    writeFile(deploymentPath, JSON.stringify(deployment)),
    writeFile(observationsPath, JSON.stringify(observations)),
    writeFile(markerPath, JSON.stringify(marker)),
    writeFile(runPath, JSON.stringify(hostileRun)),
  ]);

  await expect(execFileAsync(process.execPath, [
    script,
    '--check-acceptance-marker', markerPath,
    '--deployment', deploymentPath,
    '--expected-mode', 'prelaunch-test',
  ])).resolves.toBeDefined();
  await expect(execFileAsync(process.execPath, [
    script,
    '--merge-acceptance-evidence', observationsPath,
    '--deployment-run', runPath,
    '--marker', markerPath,
    '--output', outputPath,
  ])).resolves.toBeDefined();
  const merged = JSON.parse((await readFile(outputPath, 'utf8')).match(/<!-- cumpa-evidence\n(.+)\n-->/su)?.[1] ?? '');
  expect(merged).toMatchObject({
    kind: 'acceptance',
    hostile_matrix: hostileMatrix,
    fixture_manifest: settled,
    acceptance_marker: { status: 'interactive-matrix-complete' },
  });
  const duplicateManifestRun = structuredClone(hostileRun);
  const duplicated = duplicateManifestRun.fixture_manifest['auth.users'].handles[0];
  duplicateManifestRun.fixture_manifest['auth.users'] = { count: 2, handles: [duplicated, duplicated] };
  duplicateManifestRun.artifacts.evidence_sha256 = '';
  duplicateManifestRun.artifacts.evidence_sha256 = hash(JSON.stringify(duplicateManifestRun));
  await writeFile(runPath, JSON.stringify(duplicateManifestRun));
  await reject([
    '--merge-acceptance-evidence', observationsPath,
    '--deployment-run', runPath,
    '--marker', markerPath,
    '--output', outputPath,
  ], 'evidence fixture manifest is invalid');
});

test('exact cleanup evidence requires the approved manifest, repeated zero, and immutable lineage', async ({}, testInfo) => {
  const acceptancePath = new URL('../../.planning/phases/02-move-the-implementation-to-supabase/02-09-ACCEPTANCE-EVIDENCE.md', import.meta.url).pathname;
  const acceptance = JSON.parse((await readFile(acceptancePath, 'utf8')).match(/<!-- cumpa-evidence\n(.+)\n-->/su)?.[1] ?? '');
  const empty: Record<string, { count: number; handles: string[] }> = Object.fromEntries(
    Object.keys(acceptance.fixture_manifest).map((table) => [table, { count: 0, handles: [] }]),
  );
  const record = {
    version: 1,
    kind: 'deployment-run',
    status: 'passed',
    mode: 'prelaunch-test',
    operation: 'exact-cleanup',
    fingerprint: acceptance.fingerprint,
    public_origin: acceptance.public_origin,
    run: { id: '102', url: 'https://github.com/example/repo/actions/runs/102', commit: 'c'.repeat(40), immutable: true },
    order: [
      'delete:support_private.stripe_events',
      'delete:support_private.installation_bindings',
      'delete:support_private.supporters',
      'delete:support_private.checkout_sessions',
      'delete:support_private.support_intents',
      'delete:auth.users',
    ],
    routes: {
      'auth-settings': { status: 401, content_type: 'application/json' },
      'support-api-invalid-input': { status: 400, content_type: 'application/json' },
      'support-flow-invalid-state': { status: 400, content_type: 'text/plain' },
      'stripe-webhook-invalid-signature': { status: 400, content_type: 'application/json' },
    },
    authority_before: acceptance.fixture_manifest,
    deleted: acceptance.fixture_manifest,
    authority: empty,
    authority_confirmation: empty,
    acceptance: {
      run_id: acceptance.run.id,
      run_evidence_sha256: acceptance.artifacts.hostile_run_evidence_sha256,
      record_sha256: createHash('sha256').update(JSON.stringify(acceptance)).digest('hex'),
    },
    artifacts: { evidence_sha256: '' },
  };
  const evidencePath = testInfo.outputPath('cleanup.json');
  const save = async (value: typeof record) => {
    value.artifacts.evidence_sha256 = '';
    value.artifacts.evidence_sha256 = createHash('sha256').update(JSON.stringify(value)).digest('hex');
    await writeFile(evidencePath, JSON.stringify(value));
  };
  const args = [
    '--check-run-evidence', evidencePath,
    '--expected-mode', 'prelaunch-test',
    '--acceptance', acceptancePath,
    '--require-exact-cleanup',
    '--require-zero-authority',
    '--require-immutable-run',
  ];

  await save(record);
  await expect(execFileAsync(process.execPath, [script, ...args])).resolves.toBeDefined();

  const extra = structuredClone(record);
  extra.authority_before['auth.users'].handles.push('f'.repeat(64));
  extra.authority_before['auth.users'].handles.sort();
  extra.authority_before['auth.users'].count += 1;
  await save(extra);
  await reject(args, 'evidence cleanup manifest does not match acceptance');

  const missing = structuredClone(record);
  missing.deleted['auth.users'].handles.pop();
  missing.deleted['auth.users'].count -= 1;
  await save(missing);
  await reject(args, 'evidence cleanup manifest does not match acceptance');

  const duplicate = structuredClone(record);
  duplicate.deleted['auth.users'].handles[1] = duplicate.deleted['auth.users'].handles[0];
  await save(duplicate);
  await reject(args, 'evidence fixture manifest is invalid');

  const nonzero = structuredClone(record);
  nonzero.authority_confirmation['auth.users'] = { count: 1, handles: ['e'.repeat(64)] };
  await save(nonzero);
  await reject(args, 'evidence authority is not zero');

  const wrongRun = structuredClone(record);
  wrongRun.acceptance.run_id = '999';
  await save(wrongRun);
  await reject(args, 'evidence cleanup lineage does not match acceptance');
});

test('promotion evidence binds complete cleanup and live artifacts', async ({}, testInfo) => {
  const acceptance = new URL('../../.planning/phases/02-move-the-implementation-to-supabase/02-09-ACCEPTANCE-EVIDENCE.md', import.meta.url).pathname;
  const promotion = new URL('../../.planning/phases/02-move-the-implementation-to-supabase/02-10-LIVE-PROMOTION-EVIDENCE.md', import.meta.url).pathname;
  const args = [
    '--check-promotion-evidence', promotion,
    '--acceptance', acceptance,
    '--require-cleanup-run',
    '--require-live-run',
    '--require-one-fingerprint',
    '--require-zero-authority',
    '--non-destructive',
    '--require-immutable-runs',
  ];
  await expect(execFileAsync(process.execPath, [script, ...args])).resolves.toBeDefined();

  const record = JSON.parse((await readFile(promotion, 'utf8')).match(/<!-- cumpa-evidence\n(.+)\n-->/su)?.[1] ?? '');
  record.cleanup_run.id = '999';
  const tampered = testInfo.outputPath('promotion.json');
  await writeFile(tampered, JSON.stringify(record));
  await reject(args.map((value) => value === promotion ? tampered : value), 'promotion artifact lineage does not match');
});
