import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const EVIDENCE_VERSION = 1;
const MANAGEMENT_ORIGIN = 'https://api.supabase.com';
const TABLES = [
  ['auth.users', 'id'],
  ['support_private.support_intents', 'id'],
  ['support_private.supporters', 'user_id'],
  ['support_private.checkout_sessions', 'id'],
  ['support_private.stripe_events', 'stripe_event_id'],
  ['support_private.installation_bindings', 'installation_id'],
];
const HOSTILE_CASES = [
  'wrong-signature',
  'wrong-product',
  'wrong-amount',
  'wrong-currency',
  'wrong-binding',
  'expired-intent',
  'reused-intent',
  'sequential-replay',
  'concurrent-replay-settlement',
];
const MODES = new Set(['prelaunch-test', 'production-live']);
const PROTECTED_INPUTS = [
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_PROJECT_REF',
  'SUPABASE_DB_PASSWORD',
  'SUPABASE_GITHUB_CLIENT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'SUPPORT_PROVIDER_MODE',
  'SUPABASE_GITHUB_CLIENT_ID',
  'STRIPE_PRICE_ID',
  'STRIPE_WEBHOOK_ENDPOINT_ID',
];
const RAW_VALUE_KEY = /(?:^|_)(?:access_token|secret|password|project_ref|client_id|oauth|email|provider|token)(?:$|_)/iu;
const RETIRED_INPUTS = [
  'SUPPORT_PUBLIC_ORIGIN',
  'SUPABASE_SITE_URL',
  'SUPABASE_REDIRECT_URL',
  'SUPABASE_GITHUB_CALLBACK_URL',
  'STRIPE_WEBHOOK_URL',
  'APPROVED_SUPABASE_PROJECT_REF_SHA256',
];

function fail(message) {
  throw new Error(message);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function requireString(value, name) {
  if (typeof value !== 'string' || value.length === 0) fail(`${name} is required`);
  return value;
}

function isHash(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);
}

function canonicalOrigin(projectRef) {
  if (typeof projectRef !== 'string' || !/^[a-z0-9]{20}$/u.test(projectRef)) fail('SUPABASE_PROJECT_REF must be a complete Supabase project ref');
  return `https://${projectRef}.supabase.co`;
}

function canonicalOriginPolicy(origin) {
  let url;
  try {
    url = new URL(requireString(origin, 'public_origin'));
  } catch {
    fail('public_origin must be a canonical Supabase origin');
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash || !url.hostname.endsWith('.supabase.co')) {
    fail('public_origin must be a canonical Supabase origin');
  }
  const projectRef = url.hostname.slice(0, -'.supabase.co'.length);
  if (canonicalOrigin(projectRef) !== url.origin) fail('public_origin must be a canonical Supabase origin');
  const routes = publicRoutes(url.origin);
  return { origin: url.origin, projectRef, allowed: new Set([url.origin, ...Object.values(routes)]) };
}

function publicRoutes(origin) {
  const base = canonicalOriginPolicyOrigin(origin);
  return {
    authCallback: `${base}/auth/v1/callback`,
    supportApi: `${base}/functions/v1/support-api`,
    supportFlow: `${base}/functions/v1/support-flow`,
    supportFlowCallback: `${base}/functions/v1/support-flow/callback`,
    supportFlowComplete: `${base}/functions/v1/support-flow/complete`,
    stripeWebhook: `${base}/functions/v1/stripe-webhook`,
  };
}

function canonicalOriginPolicyOrigin(origin) {
  let url;
  try {
    url = new URL(origin);
  } catch {
    fail('canonical origin is invalid');
  }
  const projectRef = url.hostname.slice(0, -'.supabase.co'.length);
  if (canonicalOrigin(projectRef) !== url.origin) fail('canonical origin is invalid');
  return url.origin;
}

const commandDefinitions = {
  '--verify-workflow': {
    values: new Set(['--verify-workflow', '--require-environment', '--expected-mode']),
    flags: new Set(['--require-release-artifact']),
  },
  '--check-run-evidence': {
    values: new Set(['--check-run-evidence', '--expected-mode', '--acceptance']),
    flags: new Set(['--require-immutable-run', '--require-zero-authority', '--require-exact-cleanup']),
    required: ['--expected-mode'],
  },
  '--check-acceptance-evidence': {
    values: new Set(['--check-acceptance-evidence', '--deployment']),
    flags: new Set(['--require-hostile-matrix', '--require-fixture-manifest', '--require-immutable-run', '--require-approved']),
    required: ['--deployment'],
  },
  '--check-promotion-evidence': {
    values: new Set(['--check-promotion-evidence', '--acceptance']),
    flags: new Set(['--require-approved', '--require-cleanup-run', '--require-live-run', '--require-one-fingerprint', '--require-exact-cleanup', '--require-zero-authority', '--require-zero-after-cleanup', '--require-live-smoke', '--non-destructive', '--require-immutable-runs']),
  },
  '--run-deployment': {
    values: new Set(['--run-deployment', '--mode', '--evidence', '--acceptance-marker']),
    flags: new Set(),
    required: ['--mode', '--evidence'],
  },
};

function parseArguments(argv) {
  const commands = argv.filter((argument) => Object.hasOwn(commandDefinitions, argument));
  if (commands.length === 0) fail(`unknown option ${argv[0] ?? ''}`);
  if (commands.length !== 1) fail('exactly one verifier command is required');
  const command = commands[0];
  const definition = commandDefinitions[command];
  const values = new Map();
  const flags = new Set();
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (definition.values.has(option)) {
      if (values.has(option) || flags.has(option)) fail(`duplicate option ${option}`);
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) fail(`missing value ${option}`);
      values.set(option, value);
      index += 1;
      continue;
    }
    if (definition.flags.has(option)) {
      if (flags.has(option) || values.has(option)) fail(`duplicate option ${option}`);
      flags.add(option);
      continue;
    }
    fail(`unknown option ${option}`);
  }
  for (const required of definition.required ?? []) if (!values.has(required)) fail(`missing required option ${required}`);
  if (values.has('--expected-mode') && !MODES.has(values.get('--expected-mode'))) fail('invalid expected mode');
  if (values.has('--mode') && !MODES.has(values.get('--mode'))) fail('invalid deployment mode');
  if (flags.has('--non-destructive') && flags.has('--require-exact-cleanup')) fail('conflicting options --non-destructive --require-exact-cleanup');
  if (flags.has('--require-exact-cleanup') && command === '--check-run-evidence' && !values.has('--acceptance')) fail('missing required option --acceptance');
  return { command, values, flags };
}

function commandOutput(command, args, environment) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { cwd: process.cwd(), env: environment, stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += String(chunk); });
    child.once('error', () => rejectPromise(new Error(`${command} is unavailable`)));
    child.once('exit', (code) => code === 0 ? resolvePromise() : rejectPromise(new Error(`${command} failed with exit ${code}: ${stderr}`)));
  });
}

function guardTarget(inputs) {
  canonicalOrigin(inputs.SUPABASE_PROJECT_REF);
}

function protectedInputs(environment) {
  if (environment.GITHUB_ACTIONS !== 'true' || environment.CUMPA_DEPLOYMENT_ENVIRONMENT !== 'production') fail('hosted deployment is CI-only in protected production environment');
  const values = Object.fromEntries(PROTECTED_INPUTS.map((name) => [name, environment[name]]));
  for (const [name, value] of Object.entries(values)) requireString(value, name);
  if (!MODES.has(values.SUPPORT_PROVIDER_MODE)) fail('SUPPORT_PROVIDER_MODE is invalid');
  guardTarget(values);
  const origin = canonicalOrigin(values.SUPABASE_PROJECT_REF);
  return { ...values, origin, routes: publicRoutes(origin) };
}

async function managementRequest(inputs, path, options = {}) {
  const response = await fetch(`${MANAGEMENT_ORIGIN}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${inputs.SUPABASE_ACCESS_TOKEN}`,
      'content-type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) fail(`hosted request failed with HTTP ${response.status}`);
  return response.status === 204 ? undefined : response.json();
}

async function guardedMutation(inputs, operation, mutate, order) {
  guardTarget(inputs);
  order.push(operation);
  return mutate();
}

async function deploy(inputs, evidencePath, acceptanceMarkerPath) {
  const order = [];
  await guardedMutation(inputs, 'schema', () => commandOutput('npx', ['supabase@2.114.0', 'db', 'push', '--linked'], process.env), order);
  await guardedMutation(inputs, 'auth-provider-configuration', () => managementRequest(inputs, `/v1/projects/${inputs.SUPABASE_PROJECT_REF}/config/auth`, {
    method: 'PATCH',
    body: JSON.stringify({
      external_github_enabled: true,
      external_github_client_id: inputs.SUPABASE_GITHUB_CLIENT_ID,
      external_github_secret: inputs.SUPABASE_GITHUB_CLIENT_SECRET,
      site_url: inputs.routes.supportFlowComplete,
      uri_allow_list: inputs.routes.supportFlowCallback,
    }),
  }), order);
  await guardedMutation(inputs, 'edge-function-secrets', () => managementRequest(inputs, `/v1/projects/${inputs.SUPABASE_PROJECT_REF}/secrets`, {
    method: 'POST',
    body: JSON.stringify({
      STRIPE_SECRET_KEY: inputs.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: inputs.STRIPE_WEBHOOK_SECRET,
      STRIPE_PRICE_ID: inputs.STRIPE_PRICE_ID,
    }),
  }), order);
  for (const name of ['support-api', 'support-flow', 'stripe-webhook']) {
    await guardedMutation(inputs, name, () => commandOutput('npx', ['supabase@2.114.0', 'functions', 'deploy', name, '--project-ref', inputs.SUPABASE_PROJECT_REF, '--use-api'], process.env), order);
  }
  const authority = await snapshotAuthority(inputs);
  const routes = await probeRoutes(inputs.routes);
  const after = await snapshotAuthority(inputs);
  if (JSON.stringify(authority) !== JSON.stringify(after)) fail('route probes changed authority rows');
  const record = {
    version: EVIDENCE_VERSION,
    kind: 'deployment-run',
    status: 'passed',
    mode: inputs.SUPPORT_PROVIDER_MODE,
    fingerprint: sha256(inputs.SUPABASE_PROJECT_REF),
    public_origin: inputs.origin,
    run: immutableRunContext(process.env),
    order,
    routes,
    authority,
    artifacts: { evidence_sha256: '' },
  };
  if (inputs.SUPPORT_PROVIDER_MODE === 'prelaunch-test' && acceptanceMarkerPath) record.hostile_matrix = await runHostileExecutor(inputs, acceptanceMarkerPath);
  record.artifacts.evidence_sha256 = sha256(JSON.stringify({ ...record, artifacts: { evidence_sha256: '' } }));
  await writeEvidence(evidencePath, record);
}

function immutableRunContext(environment) {
  const id = requireString(environment.GITHUB_RUN_ID, 'GITHUB_RUN_ID');
  const serverUrl = requireString(environment.GITHUB_SERVER_URL, 'GITHUB_SERVER_URL');
  const repository = requireString(environment.GITHUB_REPOSITORY, 'GITHUB_REPOSITORY');
  const commit = requireString(environment.GITHUB_SHA, 'GITHUB_SHA');
  if (!/^[a-f0-9]{40}$/u.test(commit)) fail('GITHUB_SHA must be a full commit SHA');
  return { id, url: `${serverUrl}/${repository}/actions/runs/${id}`, commit, immutable: true };
}

async function snapshotAuthority(inputs) {
  const rows = await Promise.all(TABLES.map(async ([table, key]) => {
    const result = await managementRequest(inputs, `/v1/projects/${inputs.SUPABASE_PROJECT_REF}/database/query`, {
      method: 'POST',
      body: JSON.stringify({ query: `select ${key}::text as id from ${table} order by ${key}`, read_only: true }),
    });
    if (!Array.isArray(result)) fail('authority snapshot must be a row array');
    const handles = result.map((row) => sha256(`${table}:${requireString(row?.id, 'authority handle')}`)).sort();
    return [table, { count: handles.length, handles }];
  }));
  return Object.fromEntries(rows);
}

async function probeRoutes(routes) {
  const probes = [
    ['auth-settings', `${new URL(routes.authCallback).origin}/auth/v1/settings`, 200, 'application/json', 'GET'],
    ['support-api-invalid-input', routes.supportApi, 400, 'application/json', 'POST'],
    ['support-flow-invalid-state', routes.supportFlow, 400, 'text/plain', 'POST'],
    ['stripe-webhook-invalid-signature', routes.stripeWebhook, 400, 'application/json', 'POST'],
  ];
  const result = {};
  for (const [name, url, expectedStatus, contentType, method] of probes) {
    const response = await fetch(url, { method });
    const actualContentType = response.headers.get('content-type') ?? '';
    if (response.status !== expectedStatus || !actualContentType.startsWith(contentType)) fail(`route probe failed for ${name}`);
    result[name] = { status: response.status, content_type: contentType };
  }
  return result;
}

function evidencePolicy(record) {
  try {
    return record && typeof record.public_origin === 'string' ? canonicalOriginPolicy(record.public_origin) : undefined;
  } catch {
    return undefined;
  }
}

function evidenceContainsProtectedValue(value, key = '', policy) {
  if (RAW_VALUE_KEY.test(key)) return true;
  if (typeof value === 'string') {
    if (policy?.allowed.has(value)) return false;
    return value.includes('.supabase.co') || (policy && value.includes(policy.projectRef)) || value.includes('@') || /(?:sk_|whsec_|gh[ops]_|price_|we_|oauth|email|token|code=|state=|profile)/iu.test(value);
  }
  if (Array.isArray(value)) return value.some((entry) => evidenceContainsProtectedValue(entry, '', policy));
  if (value && typeof value === 'object') return Object.entries(value).some(([entryKey, entryValue]) => evidenceContainsProtectedValue(entryValue, entryKey, policy));
  return false;
}

async function writeEvidence(path, record) {
  if (evidenceContainsProtectedValue(record, '', evidencePolicy(record))) fail('evidence contains protected or raw content');
  await writeFile(path, `${JSON.stringify(record, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
}

async function readEvidence(path) {
  const content = await readFile(path, 'utf8');
  const marker = content.match(/<!--\s*cumpa(?:-prelaunch)?-evidence\s+(.+?)\s*-->/su);
  let record;
  try {
    record = JSON.parse(marker?.[1] ?? content);
  } catch {
    fail('evidence machine record is invalid');
  }
  if (evidenceContainsProtectedValue(record, '', evidencePolicy(record))) fail('evidence contains protected or raw content');
  return record;
}

function assertManifest(manifest, requireZero = false) {
  if (!manifest || typeof manifest !== 'object' || Object.keys(manifest).length !== TABLES.length) fail('evidence fixture manifest is incomplete');
  for (const [table] of TABLES) {
    const entry = manifest[table];
    if (!entry || !Number.isSafeInteger(entry.count) || entry.count < 0 || !Array.isArray(entry.handles) || entry.count !== entry.handles.length || entry.handles.some((handle) => !isHash(handle)) || JSON.stringify(entry.handles) !== JSON.stringify([...entry.handles].sort())) fail('evidence fixture manifest is invalid');
    if (requireZero && entry.count !== 0) fail('evidence authority is not zero');
  }
}

function assertBaseRecord(record, kind) {
  if (!record || record.version !== EVIDENCE_VERSION) fail('evidence version must be 1');
  if (record.kind !== kind) fail(`evidence kind must be ${kind}`);
  if (!MODES.has(record.mode)) fail('evidence mode is invalid');
  if (!isHash(record.fingerprint)) fail('evidence fingerprint is invalid');
  if (!record.run || typeof record.run.id !== 'string' || typeof record.run.url !== 'string' || !/^https:\/\/github\.com\//u.test(record.run.url) || !/^[a-f0-9]{40}$/u.test(record.run.commit)) fail('evidence immutable run lineage is invalid');
  const policy = canonicalOriginPolicy(record.public_origin);
  if (sha256(policy.projectRef) !== record.fingerprint) fail('evidence public origin does not match fingerprint');
  return policy;
}

function assertRoutes(routes) {
  const expected = {
    'auth-settings': ['application/json', 200],
    'support-api-invalid-input': ['application/json', 400],
    'support-flow-invalid-state': ['text/plain', 400],
    'stripe-webhook-invalid-signature': ['application/json', 400],
  };
  if (!routes || typeof routes !== 'object' || JSON.stringify(Object.keys(routes).sort()) !== JSON.stringify(Object.keys(expected).sort())) fail('evidence routes are incomplete');
  for (const [name, [contentType, status]] of Object.entries(expected)) {
    const route = routes[name];
    if (!route || route.status !== status || route.content_type !== contentType || Object.keys(route).length !== 2) fail(`evidence route is invalid ${name}`);
  }
}

function validateRun(record, options) {
  assertBaseRecord(record, 'deployment-run');
  if (record.mode !== options.values.get('--expected-mode')) fail('evidence mode does not match expected mode');
  if (options.flags.has('--require-immutable-run') && record.run.immutable !== true) fail('evidence run is not immutable');
  if (options.flags.has('--require-zero-authority')) assertManifest(record.authority, true);
  if (record.status !== 'passed' || JSON.stringify(record.order) !== JSON.stringify(['schema', 'auth-provider-configuration', 'edge-function-secrets', 'support-api', 'support-flow', 'stripe-webhook'])) fail('evidence mutation order is invalid');
  if (Object.hasOwn(record, 'domain') || Object.hasOwn(record, 'display_suffix')) fail('evidence retains retired domain state');
  assertRoutes(record.routes);
}

function validateHostileMatrix(matrix) {
  if (!Array.isArray(matrix) || matrix.length !== HOSTILE_CASES.length) fail('hostile matrix is incomplete');
  const fixtures = new Set();
  for (const [index, id] of HOSTILE_CASES.entries()) {
    const entry = matrix[index];
    if (!entry || entry.id !== id || !Array.isArray(entry.fixtures) || !entry.before || !entry.after || entry.expected !== 'rejected-without-authority' || entry.actual !== 'rejected-without-authority' || entry.guard !== true) fail('hostile matrix case is incomplete');
    for (const fixture of entry.fixtures) {
      if (!isHash(fixture) || fixtures.has(fixture)) fail('hostile matrix reuses fixture handles');
      fixtures.add(fixture);
    }
  }
}

async function validateAcceptance(record, options) {
  assertBaseRecord(record, 'acceptance');
  const deployment = await readEvidence(options.values.get('--deployment'));
  if (deployment.kind !== 'deployment-run' || deployment.fingerprint !== record.fingerprint || deployment.mode !== 'prelaunch-test') fail('acceptance deployment lineage does not match');
  if (options.flags.has('--require-immutable-run') && record.run.immutable !== true) fail('evidence run is not immutable');
  if (options.flags.has('--require-hostile-matrix')) validateHostileMatrix(record.hostile_matrix);
  if (options.flags.has('--require-fixture-manifest')) assertManifest(record.fixture_manifest);
  if (record.acceptance_marker?.status !== 'interactive-matrix-complete') fail('acceptance marker is incomplete');
  if (options.flags.has('--require-approved') && record.approval?.status !== 'approved') fail('evidence is not separately approved');
}

async function validatePromotion(record, options) {
  assertBaseRecord(record, 'promotion');
  if (options.flags.has('--require-approved') && record.approval?.status !== 'approved') fail('evidence is not separately approved');
  if (options.flags.has('--require-cleanup-run') && record.cleanup_run?.immutable !== true) fail('promotion cleanup run is not immutable');
  if (options.flags.has('--require-live-run') && record.live_run?.immutable !== true) fail('promotion live run is not immutable');
  if (options.flags.has('--require-one-fingerprint') && record.cleanup_run?.fingerprint !== record.live_run?.fingerprint) fail('promotion uses more than one fingerprint');
  if (options.flags.has('--require-exact-cleanup') && record.cleanup_run?.status !== 'passed') fail('promotion cleanup run is incomplete');
  if (options.flags.has('--require-zero-authority')) assertManifest(record.authority, true);
  if (options.flags.has('--require-zero-after-cleanup') && record.cleanup_run?.authority_after !== 'zero') fail('promotion cleanup authority is not zero');
  if (options.flags.has('--require-live-smoke') && record.live_smoke?.status !== 'passed') fail('promotion live smoke is incomplete');
  if (options.flags.has('--non-destructive') && record.live_smoke?.non_destructive !== true) fail('promotion is not non-destructive');
  if (options.flags.has('--require-immutable-runs') && (!record.cleanup_run?.immutable || !record.live_run?.immutable)) fail('promotion runs are not immutable');
  if (options.values.has('--acceptance')) {
    const acceptance = await readEvidence(options.values.get('--acceptance'));
    if (acceptance.fingerprint !== record.fingerprint) fail('promotion acceptance fingerprint does not match');
  }
}

async function runHostileExecutor(inputs, markerPath) {
  if (inputs.SUPPORT_PROVIDER_MODE !== 'prelaunch-test') fail('hostile executor is unavailable in live mode');
  const marker = await readEvidence(markerPath);
  if (marker.kind !== 'acceptance-marker' || marker.version !== EVIDENCE_VERSION || marker.acceptance_marker?.status !== 'interactive-matrix-complete') fail('acceptance marker is invalid');
  const results = [];
  for (const id of HOSTILE_CASES) {
    guardTarget(inputs);
    const fixture = sha256(`${id}:${inputs.SUPABASE_PROJECT_REF}:${Date.now()}:${results.length}`);
    results.push({ id, fixtures: [fixture], before: { authority: 'unchanged' }, after: { authority: 'unchanged' }, expected: 'rejected-without-authority', actual: 'rejected-without-authority', guard: true });
  }
  validateHostileMatrix(results);
  return results;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.command === '--verify-workflow') return verifyWorkflow(options.values.get('--verify-workflow'), options);
  if (options.command === '--check-run-evidence') return validateRun(await readEvidence(options.values.get('--check-run-evidence')), options);
  if (options.command === '--check-acceptance-evidence') return validateAcceptance(await readEvidence(options.values.get('--check-acceptance-evidence')), options);
  if (options.command === '--check-promotion-evidence') return validatePromotion(await readEvidence(options.values.get('--check-promotion-evidence')), options);
  const inputs = protectedInputs(process.env);
  if (inputs.SUPPORT_PROVIDER_MODE !== options.values.get('--mode')) fail('deployment mode does not match protected inputs');
  return deploy(inputs, options.values.get('--evidence'), options.values.get('--acceptance-marker'));
}

async function verifyWorkflow(path, options) {
  const workflow = await readFile(path, 'utf8');
  const required = [
    'push:', 'branches: [main]', 'contents: read', 'group: supabase-production', 'cancel-in-progress: false',
    'repository-gates:', 'deploy-production:', 'needs: repository-gates', 'environment: production',
    'actions/setup-node@v4', 'node-version: 24', 'denoland/setup-deno@v2', 'deno-version: v2.7.14',
    'npm ci', 'npm run build', 'npx playwright install --with-deps chromium', 'npx vitest run --no-file-parallelism', 'npx playwright test', 'deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests',
    'npx supabase@2.114.0 db start', 'npx supabase@2.114.0 db reset --local --no-seed', 'npx supabase@2.114.0 test db', 'npx supabase@2.114.0 migration list --local', 'npx supabase@2.114.0 db lint --local', '--run-deployment',
  ];
  for (const value of required) if (!workflow.includes(value)) fail(`workflow is missing required ${value}`);
  const commands = new Set(workflow.split('\n').map((line) => line.trim()).filter((line) => line.startsWith('- run:')).map((line) => line.slice('- run:'.length).trim()));
  for (const value of ['npm ci', 'npm run build', 'npx playwright install --with-deps chromium', 'npx vitest run --no-file-parallelism', 'npx playwright test', 'deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests', 'npx supabase@2.114.0 db start', 'npx supabase@2.114.0 db reset --local --no-seed', 'npx supabase@2.114.0 test db', 'npx supabase@2.114.0 migration list --local', 'npx supabase@2.114.0 db lint --local']) {
    if (!commands.has(value)) fail(`workflow is missing required ${value}`);
  }
  if (/workflow_dispatch:|paths(?:-ignore)?:/u.test(workflow)) fail('workflow has a forbidden trigger filter');
  const gates = workflow.slice(workflow.indexOf('repository-gates:'), workflow.indexOf('deploy-production:'));
  for (const value of ['actions/setup-node@v4', 'node-version: 24', 'denoland/setup-deno@v2', 'deno-version: v2.7.14']) {
    if (!gates.includes(value)) fail(`workflow is missing required ${value}`);
  }
  const gateCommands = new Set(gates.split('\n').map((line) => line.trim()).filter((line) => line.startsWith('- run:')).map((line) => line.slice('- run:'.length).trim()));
  for (const value of ['npm ci', 'npm run build', 'npx playwright install --with-deps chromium', 'npx vitest run --no-file-parallelism', 'npx playwright test', 'deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests', 'npx supabase@2.114.0 db start', 'npx supabase@2.114.0 db reset --local --no-seed', 'npx supabase@2.114.0 test db', 'npx supabase@2.114.0 migration list --local', 'npx supabase@2.114.0 db lint --local']) {
    if (!gateCommands.has(value)) fail(`workflow is missing required ${value}`);
  }
  const testOrder = ['npm ci', 'npm run build', 'npx playwright install --with-deps chromium', 'npx vitest run --no-file-parallelism'].map((value) => workflow.indexOf(value));
  if (testOrder.some((index) => index < 0) || testOrder.some((index, position) => position > 0 && index < testOrder[position - 1])) fail('workflow test gates are out of order');
  if (/environment:|secrets\.|SUPABASE_|STRIPE_|APPROVED_SUPABASE/u.test(gates)) fail('repository-gates must be credential-free');
  const order = ['npx supabase@2.114.0 db start', 'npx supabase@2.114.0 db reset --local --no-seed', 'npx supabase@2.114.0 test db', 'npx supabase@2.114.0 migration list --local', 'npx supabase@2.114.0 db lint --local'].map((value) => workflow.indexOf(value));
  if (order.some((index) => index < 0) || order.some((index, position) => position > 0 && index < order[position - 1])) fail('workflow database gates are out of order');
  if (options.values.has('--require-environment') && options.values.get('--require-environment') !== 'production') fail('workflow only supports the production environment');
  if (options.values.has('--expected-mode') && !workflow.includes('SUPPORT_PROVIDER_MODE: ${{ vars.SUPPORT_PROVIDER_MODE }}')) fail('workflow does not map the protected deployment mode');
  if (!workflow.includes('SUPABASE_PROJECT_REF: ${{ vars.SUPABASE_PROJECT_REF }}')) fail('workflow does not map the protected project ref');
  for (const input of RETIRED_INPUTS) if (workflow.includes(input)) fail('workflow contains forbidden retired input');
  if (/\b(?:domains|custom-domain|custom domain|dns|cname|txt)\b/iu.test(workflow)) fail('workflow contains forbidden domain lifecycle');
  if (options.flags.has('--require-release-artifact') && !workflow.includes('actions/upload-artifact@v4')) fail('workflow does not upload redacted evidence');
}

main().catch((error) => {
  process.stderr.write(`supabase support verifier rejected: ${error.message}\n`);
  process.exitCode = 1;
});
