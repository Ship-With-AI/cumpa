import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { spawn } from 'node:child_process';

const EVIDENCE_VERSION = 1;
const MANAGEMENT_ORIGIN = 'https://api.supabase.com';
const PRELAUNCH_DEPLOYMENT_EVIDENCE = '.planning/phases/02-move-the-implementation-to-supabase/02-08-TEST-DEPLOYMENT-EVIDENCE.md';
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
const BROWSER_CASES = [
  'paid-support',
  'restart-persistence',
  'restore-paid-one',
  'restore-paid-two',
  'restore-unpaid',
  'checkout-delay',
  'checkout-cancellation',
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
  '--check-acceptance-marker': {
    values: new Set(['--check-acceptance-marker', '--deployment', '--expected-mode']),
    flags: new Set(),
    required: ['--deployment', '--expected-mode'],
  },
  '--merge-acceptance-evidence': {
    values: new Set(['--merge-acceptance-evidence', '--deployment-run', '--marker', '--output']),
    flags: new Set(),
    required: ['--deployment-run', '--marker', '--output'],
  },
  '--check-promotion-evidence': {
    values: new Set(['--check-promotion-evidence', '--acceptance']),
    flags: new Set(['--require-approved', '--require-cleanup-run', '--require-live-run', '--require-one-fingerprint', '--require-exact-cleanup', '--require-zero-authority', '--require-zero-after-cleanup', '--require-live-smoke', '--non-destructive', '--require-immutable-runs']),
  },
  '--run-deployment': {
    values: new Set(['--mode', '--evidence', '--acceptance-marker']),
    flags: new Set(['--run-deployment']),
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
function redactedHostedError(body, inputs) {
  let value = body;
  const protectedValues = [
    ...PROTECTED_INPUTS.map((name) => inputs[name]),
    inputs.origin,
    ...Object.values(inputs.routes),
  ].filter((entry) => typeof entry === 'string' && entry.length > 0).sort((left, right) => right.length - left.length);
  for (const protectedValue of protectedValues) value = value.replaceAll(protectedValue, '[redacted]');
  return value.replace(/[\u0000-\u001f\u007f]/gu, ' ').trim().slice(0, 512);
}


async function managementRequest(inputs, path, options = {}) {
  const { suppressDetail = false, ...requestOptions } = options;
  const response = await fetch(`${MANAGEMENT_ORIGIN}${path}`, {
    ...requestOptions,
    headers: {
      authorization: `Bearer ${inputs.SUPABASE_ACCESS_TOKEN}`,
      'content-type': 'application/json',
      ...requestOptions.headers,
    },
  });
  const body = await response.text();
  if (!response.ok) {
    const detail = suppressDetail ? '' : redactedHostedError(body, inputs);
    fail(`hosted request failed with HTTP ${response.status}${detail ? `: ${detail}` : ''}`);
  }
  return body.length === 0 ? undefined : JSON.parse(body);
}

async function guardedMutation(inputs, operation, mutate, order) {
  guardTarget(inputs);
  order.push(operation);
  return mutate();
}

async function deploy(inputs, evidencePath, acceptanceMarkerPath) {
  let marker;
  if (acceptanceMarkerPath) {
    if (inputs.SUPPORT_PROVIDER_MODE !== 'prelaunch-test') fail('acceptance marker is unavailable in live mode');
    marker = await readEvidence(acceptanceMarkerPath);
    await validateAcceptanceMarker(marker, PRELAUNCH_DEPLOYMENT_EVIDENCE, 'prelaunch-test');
    if (marker.public_origin !== inputs.origin || marker.fingerprint !== sha256(inputs.SUPABASE_PROJECT_REF)) fail('acceptance marker target does not match');
  }
  const order = [];
  await guardedMutation(inputs, 'schema', () => commandOutput('npx', ['supabase@2.114.0', 'db', 'push', '--project-ref', inputs.SUPABASE_PROJECT_REF], process.env), order);
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
    body: JSON.stringify([
      { name: 'STRIPE_SECRET_KEY', value: inputs.STRIPE_SECRET_KEY },
      { name: 'STRIPE_WEBHOOK_SECRET', value: inputs.STRIPE_WEBHOOK_SECRET },
      { name: 'STRIPE_PRICE_ID', value: inputs.STRIPE_PRICE_ID },
    ]),
  }), order);
  for (const name of ['support-api', 'support-flow', 'stripe-webhook']) {
    await guardedMutation(inputs, name, () => commandOutput('npx', ['supabase@2.114.0', 'functions', 'deploy', name, '--project-ref', inputs.SUPABASE_PROJECT_REF, '--use-api', '--import-map', 'supabase/functions/deno.json'], process.env), order);
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
  if (marker) {
    record.hostile_matrix = await runHostileExecutor(inputs, marker);
    record.fixture_manifest = await snapshotAuthority(inputs);
    record.acceptance_marker = {
      ...marker.acceptance_marker,
      marker_sha256: sha256(JSON.stringify(marker)),
    };
  }
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
    ['auth-settings', `${new URL(routes.authCallback).origin}/auth/v1/settings`, 401, 'application/json', 'GET'],
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

function evidenceDigest(record) {
  if (!record?.artifacts || !isHash(record.artifacts.evidence_sha256)) fail('evidence artifact digest is invalid');
  return sha256(JSON.stringify({ ...record, artifacts: { ...record.artifacts, evidence_sha256: '' } }));
}

function assertExactKeys(value, expected, message) {
  if (!value || typeof value !== 'object' || JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...expected].sort())) fail(message);
}

function validateObservations(observations) {
  assertExactKeys(observations, ['browser_matrix', 'completion', 'review_unrestricted'], 'browser observations are malformed');
  if (!Array.isArray(observations.browser_matrix) || observations.browser_matrix.length !== BROWSER_CASES.length) fail('browser matrix is incomplete');
  for (const [index, id] of BROWSER_CASES.entries()) {
    const entry = observations.browser_matrix[index];
    if (!entry || entry.id !== id || entry.status !== 'passed' || Object.keys(entry).length !== 2) fail('browser matrix is incomplete');
  }
  const completion = observations.completion;
  if (!completion || completion.status !== 200 || completion.content_type !== 'text/plain' || completion.body !== 'Support flow complete. You can return to Cumpa.' || Object.keys(completion).length !== 3) fail('browser completion signature is invalid');
  if (observations.review_unrestricted !== true) fail('browser review availability is incomplete');
}

function validateMarkerRecord(record, expectedMode) {
  assertBaseRecord(record, 'acceptance-marker');
  assertExactKeys(record, ['version', 'kind', 'mode', 'fingerprint', 'public_origin', 'run', 'routes', 'acceptance_marker', 'observations'], 'acceptance marker fields are invalid');
  if (record.mode !== expectedMode || record.run.immutable !== true) fail('acceptance marker immutable mode is invalid');
  assertRoutes(record.routes);
  assertExactKeys(record.acceptance_marker, ['status', 'deployment_evidence_sha256', 'observations_sha256'], 'acceptance marker binding is invalid');
  if (record.acceptance_marker.status !== 'interactive-matrix-complete' || !isHash(record.acceptance_marker.deployment_evidence_sha256) || !isHash(record.acceptance_marker.observations_sha256)) fail('acceptance marker binding is invalid');
  validateObservations(record.observations);
  if (sha256(JSON.stringify(record.observations)) !== record.acceptance_marker.observations_sha256) fail('acceptance marker observations digest does not match');
}

async function validateAcceptanceMarker(record, deploymentPath, expectedMode) {
  validateMarkerRecord(record, expectedMode);
  const deployment = await readEvidence(deploymentPath);
  validateRun(deployment, {
    values: new Map([['--expected-mode', expectedMode]]),
    flags: new Set(['--require-immutable-run', '--require-zero-authority']),
  });
  if (
    record.fingerprint !== deployment.fingerprint
    || record.public_origin !== deployment.public_origin
    || JSON.stringify(record.run) !== JSON.stringify(deployment.run)
    || JSON.stringify(record.routes) !== JSON.stringify(deployment.routes)
    || evidenceDigest(deployment) !== deployment.artifacts.evidence_sha256
    || record.acceptance_marker.deployment_evidence_sha256 !== deployment.artifacts.evidence_sha256
  ) fail('acceptance marker deployment binding does not match');
}

async function writeAcceptanceEvidence(path, record) {
  if (evidenceContainsProtectedValue(record, '', evidencePolicy(record))) fail('evidence contains protected or raw content');
  const temporary = `${path}.tmp-${process.pid}`;
  await writeFile(temporary, `# Phase 02 hosted acceptance evidence\n\n<!-- cumpa-evidence\n${JSON.stringify(record, null, 2)}\n-->\n`, { encoding: 'utf8', mode: 0o600 });
  await rename(temporary, path);
}

function assertManifest(manifest, requireZero = false) {
  if (!manifest || typeof manifest !== 'object' || Object.keys(manifest).length !== TABLES.length) fail('evidence fixture manifest is incomplete');
  const handles = new Set();
  for (const [table] of TABLES) {
    const entry = manifest[table];
    if (
      !entry
      || !Number.isSafeInteger(entry.count)
      || entry.count < 0
      || !Array.isArray(entry.handles)
      || entry.count !== entry.handles.length
      || new Set(entry.handles).size !== entry.handles.length
      || entry.handles.some((handle) => !isHash(handle) || handles.has(handle))
      || JSON.stringify(entry.handles) !== JSON.stringify([...entry.handles].sort())
    ) fail('evidence fixture manifest is invalid');
    for (const handle of entry.handles) handles.add(handle);
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
    'auth-settings': ['application/json', 401],
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
    if (!entry || entry.id !== id || !Array.isArray(entry.fixtures) || entry.fixtures.length === 0 || entry.guard !== true) fail('hostile matrix case is incomplete');
    assertManifest(entry.before);
    assertManifest(entry.after);
    for (const fixture of entry.fixtures) {
      if (!isHash(fixture) || fixtures.has(fixture)) fail('hostile matrix reuses fixture handles');
      fixtures.add(fixture);
    }
    if (index < 7) {
      if (entry.expected !== 'rejected-without-authority' || entry.actual !== entry.expected || JSON.stringify(entry.before) !== JSON.stringify(entry.after)) fail('hostile matrix rejection invariant failed');
      continue;
    }
    const expected = id === 'sequential-replay' ? 'idempotent-replay' : 'single-authority-settlement';
    if (entry.expected !== expected || entry.actual !== expected || !Array.isArray(entry.responses) || entry.responses.length !== 2) fail('hostile matrix replay invariant failed');
    if (id === 'sequential-replay' && (JSON.stringify(entry.responses) !== JSON.stringify([200, 200]) || JSON.stringify(entry.first_after) !== JSON.stringify(entry.after))) fail('hostile matrix sequential replay invariant failed');
    if (id === 'concurrent-replay-settlement' && (!entry.responses.includes(200) || entry.responses.some((status) => status !== 200 && status !== 503))) fail('hostile matrix concurrent replay invariant failed');
    for (const [table] of TABLES) {
      const delta = entry.after[table].count - entry.before[table].count;
      const expectedDelta = ['support_private.supporters', 'support_private.stripe_events', 'support_private.installation_bindings'].includes(table) ? 1 : 0;
      if (delta !== expectedDelta) fail('hostile matrix settlement authority invariant failed');
    }
  }
}

async function validateAcceptance(record, options) {
  assertBaseRecord(record, 'acceptance');
  if (options.flags.has('--require-immutable-run') && record.run.immutable !== true) fail('evidence run is not immutable');
  const deployment = await readEvidence(options.values.get('--deployment'));
  validateRun(deployment, {
    values: new Map([['--expected-mode', 'prelaunch-test']]),
    flags: new Set(['--require-immutable-run', '--require-zero-authority']),
  });
  if (
    record.status !== 'passed'
    || deployment.fingerprint !== record.fingerprint
    || deployment.public_origin !== record.public_origin
    || JSON.stringify(record.deployment_run) !== JSON.stringify(deployment.run)
    || record.acceptance_marker?.deployment_evidence_sha256 !== deployment.artifacts?.evidence_sha256
  ) fail('acceptance deployment lineage does not match');
  validateObservations(record.observations);
  if (sha256(JSON.stringify(record.observations)) !== record.acceptance_marker?.observations_sha256) fail('acceptance observations lineage does not match');
  if (options.flags.has('--require-hostile-matrix')) validateHostileMatrix(record.hostile_matrix);
  if (options.flags.has('--require-fixture-manifest')) assertManifest(record.fixture_manifest);
  if (record.acceptance_marker?.status !== 'interactive-matrix-complete' || !isHash(record.acceptance_marker?.marker_sha256)) fail('acceptance marker is incomplete');
  if (options.flags.has('--require-approved') && record.approval?.status !== 'approved') fail('evidence is not separately approved');
}

async function mergeAcceptanceEvidence(observationsPath, deploymentRunPath, markerPath, outputPath) {
  const observations = await readEvidence(observationsPath);
  const marker = await readEvidence(markerPath);
  const deploymentRun = await readEvidence(deploymentRunPath);
  validateObservations(observations);
  validateMarkerRecord(marker, 'prelaunch-test');
  validateRun(deploymentRun, {
    values: new Map([['--expected-mode', 'prelaunch-test']]),
    flags: new Set(['--require-immutable-run']),
  });
  validateHostileMatrix(deploymentRun.hostile_matrix);
  assertManifest(deploymentRun.fixture_manifest);
  const markerSha256 = sha256(JSON.stringify(marker));
  if (
    sha256(JSON.stringify(observations)) !== marker.acceptance_marker.observations_sha256
    || JSON.stringify(observations) !== JSON.stringify(marker.observations)
    || deploymentRun.fingerprint !== marker.fingerprint
    || deploymentRun.public_origin !== marker.public_origin
    || JSON.stringify(deploymentRun.routes) !== JSON.stringify(marker.routes)
    || deploymentRun.acceptance_marker?.status !== marker.acceptance_marker.status
    || deploymentRun.acceptance_marker?.deployment_evidence_sha256 !== marker.acceptance_marker.deployment_evidence_sha256
    || deploymentRun.acceptance_marker?.observations_sha256 !== marker.acceptance_marker.observations_sha256
    || deploymentRun.acceptance_marker?.marker_sha256 !== markerSha256
    || evidenceDigest(deploymentRun) !== deploymentRun.artifacts.evidence_sha256
  ) fail('acceptance merge lineage does not match');
  await writeAcceptanceEvidence(outputPath, {
    version: EVIDENCE_VERSION,
    kind: 'acceptance',
    status: 'passed',
    mode: 'prelaunch-test',
    fingerprint: marker.fingerprint,
    public_origin: marker.public_origin,
    deployment_run: marker.run,
    run: deploymentRun.run,
    routes: marker.routes,
    acceptance_marker: deploymentRun.acceptance_marker,
    observations,
    hostile_matrix: deploymentRun.hostile_matrix,
    fixture_manifest: deploymentRun.fixture_manifest,
    artifacts: {
      deployment_evidence_sha256: marker.acceptance_marker.deployment_evidence_sha256,
      hostile_run_evidence_sha256: deploymentRun.artifacts.evidence_sha256,
      marker_sha256: markerSha256,
    },
    approval: { status: 'pending' },
  });
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

function sqlText(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function databaseQuery(inputs, query, readOnly = false) {
  if (!readOnly) guardTarget(inputs);
  return managementRequest(inputs, `/v1/projects/${inputs.SUPABASE_PROJECT_REF}/database/query`, {
    method: 'POST',
    body: JSON.stringify({ query, read_only: readOnly }),
    suppressDetail: true,
  });
}

async function expectDatabaseRejection(operation) {
  try {
    await operation();
  } catch (error) {
    if (error instanceof Error && /^hosted request failed with HTTP (?:400|422)$/u.test(error.message)) return;
    throw error;
  }
  fail('hostile database mutation was accepted');
}

async function stripeRequest(inputs, path, { method = 'POST', operation = 'request', params } = {}) {
  if (method !== 'GET') guardTarget(inputs);
  const response = await fetch(`https://api.stripe.com${path}`, {
    method,
    headers: {
      authorization: `Bearer ${inputs.STRIPE_SECRET_KEY}`,
      ...(params ? { 'content-type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: params?.toString(),
  });
  const body = await response.text();
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    fail(`Stripe acceptance ${operation} returned invalid JSON`);
  }
  if (!response.ok) {
    const code = typeof payload?.error?.code === 'string' && /^[a-z0-9_]{1,80}$/u.test(payload.error.code) ? payload.error.code : 'unknown';
    const parameter = typeof payload?.error?.param === 'string' && /^[a-z0-9_[\].]{1,80}$/u.test(payload.error.param) ? payload.error.param : 'unknown';
    fail(`Stripe acceptance ${operation} failed with HTTP ${response.status}, code ${code}, parameter ${parameter}`);
  }
  return payload;
}

function installationId() {
  return randomBytes(32).toString('base64url');
}

function fixtureHandles(caseId, fixtures) {
  return fixtures.map(([kind, value]) => sha256(`${caseId}:${kind}:${requireString(value, 'hostile fixture')}`)).sort();
}

async function insertAcceptanceUser(inputs) {
  const id = randomUUID();
  await databaseQuery(inputs, `
    insert into auth.users (id, aud, role, encrypted_password, confirmed_at, created_at, updated_at)
    values (${sqlText(id)}::uuid, 'authenticated', 'authenticated', '', now(), now(), now())
  `);
  return id;
}

async function createIntent(inputs, action, targetInstallation, expired = false) {
  const digest = randomBytes(32).toString('hex');
  const result = await databaseQuery(inputs, `
    select public.create_support_intent(
      ${sqlText(action)},
      ${sqlText(targetInstallation)},
      decode(${sqlText(digest)}, 'hex'),
      now() ${expired ? "- interval '1 second'" : "+ interval '10 minutes'"}
    )::text as id
  `);
  return { id: requireString(result?.[0]?.id, 'support intent id'), digest };
}

async function claimIntent(inputs, intent, userId) {
  return databaseQuery(inputs, `
    select * from public.claim_support_intent(
      decode(${sqlText(intent.digest)}, 'hex'),
      ${sqlText(userId)}::uuid
    )
  `);
}

async function recordCheckout(inputs, fixture, userId, targetInstallation) {
  return databaseQuery(inputs, `
    select public.record_checkout_session(
      ${sqlText(fixture.intentId)}::uuid,
      ${sqlText(fixture.sessionId)},
      ${sqlText(userId)}::uuid,
      ${sqlText(targetInstallation)},
      ${sqlText(fixture.currency)},
      ${sqlText(fixture.priceId)},
      ${fixture.amount},
      1
    )
  `);
}

async function createStripePrice(inputs, amount, currency) {
  const product = await stripeRequest(inputs, '/v1/products', {
    operation: 'product creation',
    params: new URLSearchParams({ name: `cumpa-acceptance-${randomUUID()}` }),
  });
  const price = await stripeRequest(inputs, '/v1/prices', {
    operation: 'price creation',
    params: new URLSearchParams({
      product: requireString(product.id, 'Stripe product id'),
      unit_amount: String(amount),
      currency,
    }),
  });
  return {
    productId: requireString(product.id, 'Stripe product id'),
    priceId: requireString(price.id, 'Stripe price id'),
  };
}

async function createStripeSession(inputs, priceId, metadata) {
  const params = new URLSearchParams({
    success_url: inputs.routes.supportFlowComplete,
    cancel_url: inputs.routes.supportFlowComplete,
    mode: 'payment',
    customer_creation: 'always',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
  });
  for (const [key, value] of Object.entries(metadata ?? {})) params.set(`metadata[${key}]`, value);
  const session = await stripeRequest(inputs, '/v1/checkout/sessions', { operation: 'session creation', params });
  if (!Number.isSafeInteger(session.created)) fail('Stripe Checkout Session timestamp is invalid');
  return {
    id: requireString(session.id, 'Stripe Checkout Session id'),
    created: session.created,
  };
}

async function completeStripeSession(inputs, sessionId, expectedAmount) {
  await stripeRequest(inputs, `/v1/payment_pages/${encodeURIComponent(sessionId)}`, { method: 'GET', operation: 'payment page initialization' });
  const paymentMethod = await stripeRequest(inputs, '/v1/payment_methods', {
    operation: 'payment method creation',
    params: new URLSearchParams({
      type: 'card',
      'card[token]': 'tok_visa',
      'billing_details[email]': 'cumpa-acceptance@example.com',
      'billing_details[name]': 'Cumpa Acceptance',
      'billing_details[address][line1]': '510 Townsend St',
      'billing_details[address][postal_code]': '94103',
      'billing_details[address][city]': 'San Francisco',
      'billing_details[address][state]': 'CA',
      'billing_details[address][country]': 'US',
    }),
  });
  await stripeRequest(inputs, `/v1/payment_pages/${encodeURIComponent(sessionId)}/confirm`, {
    operation: 'payment confirmation',
    params: new URLSearchParams({
      payment_method: requireString(paymentMethod.id, 'Stripe PaymentMethod id'),
      expected_amount: String(expectedAmount),
    }),
  });
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const session = await stripeRequest(inputs, `/v1/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=line_items.data.price`, { method: 'GET', operation: 'session retrieval' });
    if (session.payment_status === 'paid') return requireString(paymentMethod.id, 'Stripe PaymentMethod id');
    await delay(250);
  }
  fail('Stripe Checkout Session did not become paid');
}

async function checkoutEventForSession(inputs, sessionId, created) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const events = await stripeRequest(inputs, `/v1/events?type=checkout.session.completed&created[gte]=${created}&limit=100`, { method: 'GET', operation: 'event retrieval' });
    const event = Array.isArray(events.data) ? events.data.find((candidate) => candidate?.data?.object?.id === sessionId) : undefined;
    if (event?.id) return requireString(event.id, 'Stripe Event id');
    await delay(250);
  }
  fail('Stripe Checkout completion event was unavailable');
}

async function createPaidStripeFixture(inputs, { amount, currency, priceId, metadata }) {
  const session = await createStripeSession(inputs, priceId, metadata);
  const paymentMethodId = await completeStripeSession(inputs, session.id, amount);
  const eventId = await checkoutEventForSession(inputs, session.id, session.created);
  return { sessionId: session.id, paymentMethodId, eventId };
}

async function updateStripeMetadata(inputs, sessionId, metadata) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(metadata)) params.set(`metadata[${key}]`, value);
  await stripeRequest(inputs, `/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, { operation: 'session metadata update', params });
}

async function postWebhook(inputs, eventId, sessionId, validSignature = true) {
  const body = JSON.stringify({ id: eventId, type: 'checkout.session.completed', data: { object: { id: sessionId } } });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = validSignature
    ? createHmac('sha256', inputs.STRIPE_WEBHOOK_SECRET).update(`${timestamp}.${body}`).digest('hex')
    : '0'.repeat(64);
  guardTarget(inputs);
  const response = await fetch(inputs.routes.stripeWebhook, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'stripe-signature': `t=${timestamp},v1=${signature}`,
    },
    body,
  });
  return response.status;
}

async function runWrongSignature(inputs) {
  const eventId = `evt_${randomUUID()}`;
  const before = await snapshotAuthority(inputs);
  const status = await postWebhook(inputs, eventId, `cs_${randomUUID()}`, false);
  const after = await snapshotAuthority(inputs);
  if (status !== 400 || JSON.stringify(before) !== JSON.stringify(after)) fail('wrong-signature invariant failed');
  return {
    id: 'wrong-signature',
    fixtures: fixtureHandles('wrong-signature', [['event', eventId]]),
    before,
    after,
    expected: 'rejected-without-authority',
    actual: 'rejected-without-authority',
    guard: true,
  };
}

async function runWrongStripeInvariant(inputs, id, amount, currency) {
  const { productId, priceId } = await createStripePrice(inputs, amount, currency);
  const metadata = { user_id: randomUUID(), installation_id: installationId(), intent_id: randomUUID() };
  const fixture = await createPaidStripeFixture(inputs, { amount, currency, priceId, metadata });
  const before = await snapshotAuthority(inputs);
  const status = await postWebhook(inputs, fixture.eventId, fixture.sessionId);
  const after = await snapshotAuthority(inputs);
  if (status !== 400 || JSON.stringify(before) !== JSON.stringify(after)) fail(`${id} invariant failed`);
  return {
    id,
    fixtures: fixtureHandles(id, [
      ['product', productId],
      ['price', priceId],
      ['session', fixture.sessionId],
      ['payment-method', fixture.paymentMethodId],
      ['event', fixture.eventId],
    ]),
    before,
    after,
    expected: 'rejected-without-authority',
    actual: 'rejected-without-authority',
    guard: true,
  };
}

async function runWrongBinding(inputs) {
  const ownerId = await insertAcceptanceUser(inputs);
  const otherId = await insertAcceptanceUser(inputs);
  const targetInstallation = installationId();
  const intent = await createIntent(inputs, 'support', targetInstallation);
  await claimIntent(inputs, intent, ownerId);
  const session = await createStripeSession(inputs, inputs.STRIPE_PRICE_ID);
  const before = await snapshotAuthority(inputs);
  await expectDatabaseRejection(() => recordCheckout(inputs, {
    intentId: intent.id,
    sessionId: session.id,
    currency: 'usd',
    priceId: inputs.STRIPE_PRICE_ID,
    amount: 4999,
  }, otherId, targetInstallation));
  const after = await snapshotAuthority(inputs);
  if (JSON.stringify(before) !== JSON.stringify(after)) fail('wrong-binding invariant failed');
  return {
    id: 'wrong-binding',
    fixtures: fixtureHandles('wrong-binding', [['owner', ownerId], ['other', otherId], ['intent', intent.id], ['session', session.id]]),
    before,
    after,
    expected: 'rejected-without-authority',
    actual: 'rejected-without-authority',
    guard: true,
  };
}

async function runExpiredIntent(inputs) {
  const userId = await insertAcceptanceUser(inputs);
  const intent = await createIntent(inputs, 'restore', installationId(), true);
  const before = await snapshotAuthority(inputs);
  await expectDatabaseRejection(() => claimIntent(inputs, intent, userId));
  const after = await snapshotAuthority(inputs);
  if (JSON.stringify(before) !== JSON.stringify(after)) fail('expired-intent invariant failed');
  return {
    id: 'expired-intent',
    fixtures: fixtureHandles('expired-intent', [['user', userId], ['intent', intent.id]]),
    before,
    after,
    expected: 'rejected-without-authority',
    actual: 'rejected-without-authority',
    guard: true,
  };
}

async function runReusedIntent(inputs) {
  const userId = await insertAcceptanceUser(inputs);
  const intent = await createIntent(inputs, 'restore', installationId());
  await claimIntent(inputs, intent, userId);
  const before = await snapshotAuthority(inputs);
  await expectDatabaseRejection(() => claimIntent(inputs, intent, userId));
  const after = await snapshotAuthority(inputs);
  if (JSON.stringify(before) !== JSON.stringify(after)) fail('reused-intent invariant failed');
  return {
    id: 'reused-intent',
    fixtures: fixtureHandles('reused-intent', [['user', userId], ['intent', intent.id]]),
    before,
    after,
    expected: 'rejected-without-authority',
    actual: 'rejected-without-authority',
    guard: true,
  };
}

async function prepareSettlement(inputs, caseId) {
  const userId = await insertAcceptanceUser(inputs);
  const targetInstallation = installationId();
  const intent = await createIntent(inputs, 'support', targetInstallation);
  await claimIntent(inputs, intent, userId);
  const fixture = await createPaidStripeFixture(inputs, {
    amount: 4999,
    currency: 'usd',
    priceId: inputs.STRIPE_PRICE_ID,
  });
  await recordCheckout(inputs, {
    intentId: intent.id,
    sessionId: fixture.sessionId,
    currency: 'usd',
    priceId: inputs.STRIPE_PRICE_ID,
    amount: 4999,
  }, userId, targetInstallation);
  const before = await snapshotAuthority(inputs);
  await updateStripeMetadata(inputs, fixture.sessionId, {
    user_id: userId,
    installation_id: targetInstallation,
    intent_id: intent.id,
  });
  return {
    userId,
    intentId: intent.id,
    fixture,
    before,
    fixtures: fixtureHandles(caseId, [
      ['user', userId],
      ['intent', intent.id],
      ['session', fixture.sessionId],
      ['payment-method', fixture.paymentMethodId],
      ['event', fixture.eventId],
    ]),
  };
}

async function runSequentialReplay(inputs) {
  const prepared = await prepareSettlement(inputs, 'sequential-replay');
  const first = await postWebhook(inputs, prepared.fixture.eventId, prepared.fixture.sessionId);
  const firstAfter = await snapshotAuthority(inputs);
  const second = await postWebhook(inputs, prepared.fixture.eventId, prepared.fixture.sessionId);
  const after = await snapshotAuthority(inputs);
  return {
    id: 'sequential-replay',
    fixtures: prepared.fixtures,
    before: prepared.before,
    after,
    first_after: firstAfter,
    responses: [first, second],
    expected: 'idempotent-replay',
    actual: 'idempotent-replay',
    guard: true,
  };
}

async function runConcurrentReplay(inputs) {
  const prepared = await prepareSettlement(inputs, 'concurrent-replay-settlement');
  const responses = await Promise.all([
    postWebhook(inputs, prepared.fixture.eventId, prepared.fixture.sessionId),
    postWebhook(inputs, prepared.fixture.eventId, prepared.fixture.sessionId),
  ]);
  const after = await snapshotAuthority(inputs);
  return {
    id: 'concurrent-replay-settlement',
    fixtures: prepared.fixtures,
    before: prepared.before,
    after,
    responses,
    expected: 'single-authority-settlement',
    actual: 'single-authority-settlement',
    guard: true,
  };
}

async function runHostileExecutor(inputs, marker) {
  if (inputs.SUPPORT_PROVIDER_MODE !== 'prelaunch-test') fail('hostile executor is unavailable in live mode');
  validateMarkerRecord(marker, 'prelaunch-test');
  const results = [
    await runWrongSignature(inputs),
    await runWrongStripeInvariant(inputs, 'wrong-product', 4999, 'usd'),
    await runWrongStripeInvariant(inputs, 'wrong-amount', 5000, 'usd'),
    await runWrongStripeInvariant(inputs, 'wrong-currency', 4999, 'eur'),
    await runWrongBinding(inputs),
    await runExpiredIntent(inputs),
    await runReusedIntent(inputs),
    await runSequentialReplay(inputs),
    await runConcurrentReplay(inputs),
  ];
  validateHostileMatrix(results);
  return results;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.command === '--verify-workflow') return verifyWorkflow(options.values.get('--verify-workflow'), options);
  if (options.command === '--check-run-evidence') return validateRun(await readEvidence(options.values.get('--check-run-evidence')), options);
  if (options.command === '--check-acceptance-evidence') return validateAcceptance(await readEvidence(options.values.get('--check-acceptance-evidence')), options);
  if (options.command === '--check-acceptance-marker') {
    return validateAcceptanceMarker(
      await readEvidence(options.values.get('--check-acceptance-marker')),
      options.values.get('--deployment'),
      options.values.get('--expected-mode'),
    );
  }
  if (options.command === '--merge-acceptance-evidence') {
    return mergeAcceptanceEvidence(
      options.values.get('--merge-acceptance-evidence'),
      options.values.get('--deployment-run'),
      options.values.get('--marker'),
      options.values.get('--output'),
    );
  }
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
    'npm ci', 'npm run build', 'npx playwright install --with-deps chromium', 'npx vitest run --no-file-parallelism', 'npx playwright test tests/e2e/support-payment.spec.ts tests/e2e/support-recovery.spec.ts tests/e2e/support-restore.spec.ts', 'deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests',
    'npx supabase@2.114.0 db start', 'npx supabase@2.114.0 db reset --local --no-seed', 'npx supabase@2.114.0 test db', 'npx supabase@2.114.0 migration list --local', 'npx supabase@2.114.0 db lint --local', '--run-deployment',
  ];
  for (const value of required) if (!workflow.includes(value)) fail(`workflow is missing required ${value}`);
  const commands = new Set(workflow.split('\n').map((line) => line.trim()).filter((line) => line.startsWith('- run:')).map((line) => line.slice('- run:'.length).trim()));
  for (const value of ['npm ci', 'npm run build', 'npx playwright install --with-deps chromium', 'npx vitest run --no-file-parallelism', 'npx playwright test tests/e2e/support-payment.spec.ts tests/e2e/support-recovery.spec.ts tests/e2e/support-restore.spec.ts', 'deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests', 'npx supabase@2.114.0 db start', 'npx supabase@2.114.0 db reset --local --no-seed', 'npx supabase@2.114.0 test db', 'npx supabase@2.114.0 migration list --local', 'npx supabase@2.114.0 db lint --local']) {
    if (!commands.has(value)) fail(`workflow is missing required ${value}`);
  }
  if (/workflow_dispatch:|paths(?:-ignore)?:/u.test(workflow)) fail('workflow has a forbidden trigger filter');
  const gates = workflow.slice(workflow.indexOf('repository-gates:'), workflow.indexOf('deploy-production:'));
  for (const value of ['actions/setup-node@v4', 'node-version: 24', 'denoland/setup-deno@v2', 'deno-version: v2.7.14']) {
    if (!gates.includes(value)) fail(`workflow is missing required ${value}`);
  }
  const gateCommands = new Set(gates.split('\n').map((line) => line.trim()).filter((line) => line.startsWith('- run:')).map((line) => line.slice('- run:'.length).trim()));
  for (const value of ['npm ci', 'npm run build', 'npx playwright install --with-deps chromium', 'npx vitest run --no-file-parallelism', 'npx playwright test tests/e2e/support-payment.spec.ts tests/e2e/support-recovery.spec.ts tests/e2e/support-restore.spec.ts', 'deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests', 'npx supabase@2.114.0 db start', 'npx supabase@2.114.0 db reset --local --no-seed', 'npx supabase@2.114.0 test db', 'npx supabase@2.114.0 migration list --local', 'npx supabase@2.114.0 db lint --local']) {
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
