import { createHash } from 'node:crypto';
import { access, lstat, mkdtemp, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path';

const requiredSeamKeys = [
  'sharedSchema', 'draftStore', 'draftAnchorVocabulary', 'exactPathIdentity',
  'comparisonInventory', 'selectorDriftResolver', 'safeGitRunner',
  'securedRouteRegistry', 'capabilityRegistry', 'apiClient', 'canonicalBrowserState',
  'reviewPanel', 'uiPrimitives', 'filesystemFaultPort', 'platformRevealAdapter',
  'packageRunner', 'browserRunner',
];
const requiredCommandKeys = [
  '04-02-canonical', '04-03-export-api', '04-03-native-exchange',
  '04-03-publication-faults', '04-04-inventory-ignore', '04-04-gitignore-api',
  '04-05-export-ui-states', '04-06-receipt-ignore-ui', '04-07-source-snapshot',
  '04-07-real-fs-recovery', '04-08-packaged-export',
];
const requiredDependencyNames = ['zod', 'fastify', 'vitest', '@playwright/test'];
const topLevelKeys = ['commands', 'failures', 'packageEvidence', 'publicationPolicy', 'repositoryRoot', 'schemaVersion', 'seams', 'status', 'substitutions'];
const shellCharacters = /[;&|><`$\n\r]/u;

class ReconciliationError extends Error {
  constructor(code, message) {
    super(`${code}: ${message}`);
    this.code = code;
  }
}

function fail(code, message) {
  throw new ReconciliationError(code, message);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function object(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail('schema', `${label} must be an object`);
  }
  return value;
}

function exactKeys(value, keys, label) {
  const actual = Object.keys(object(value, label)).sort();
  const expected = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail('schema', `${label} has unknown or omitted keys`);
  }
}

function exactOrOptionalKeys(value, keys, optionalKeys, label) {
  const actual = Object.keys(object(value, label)).sort();
  const allowed = new Set([...keys, ...optionalKeys]);
  if (actual.some((key) => !allowed.has(key)) || keys.some((key) => !actual.includes(key))) {
    fail('schema', `${label} has unknown or omitted keys`);
  }
}

function text(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    fail('schema', `${label} must be a nonempty string`);
  }
  return value;
}

function array(value, label) {
  if (!Array.isArray(value)) {
    fail('schema', `${label} must be an array`);
  }
  return value;
}

function exactSet(value, expected, label, code = 'schema') {
  const actual = Object.keys(object(value, label)).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    fail(code, `${label} must have the exact required key set`);
  }
}

function positiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 1) {
    fail('schema', `${label} must be a positive safe integer`);
  }
  return value;
}

function unique(values, label) {
  if (new Set(values).size !== values.length) {
    fail('cardinality', `${label} contains duplicates`);
  }
}

async function containedRegularPath(root, candidate, label) {
  text(candidate, label);
  if (isAbsolute(candidate)) {
    fail('path', `${label} must be repository-relative`);
  }
  const absolute = resolve(root, candidate);
  const rel = relative(root, absolute);
  if (rel === '' || rel.startsWith('../') || rel === '..' || isAbsolute(rel)) {
    fail('path', `${label} escapes repository root`);
  }
  let entry;
  try {
    entry = await lstat(absolute);
  } catch {
    fail('path', `${label} does not exist`);
  }
  if (entry.isSymbolicLink()) {
    fail('path', `${label} must not be a symlink`);
  }
  if (!entry.isFile()) {
    fail('path', `${label} must be a regular file`);
  }
  return absolute;
}

async function readVerifiedFile(root, record, label) {
  exactKeys(record, ['path', 'sha256'], label);
  const absolute = await containedRegularPath(root, record.path, `${label}.path`);
  const bytes = await readFile(absolute);
  if (sha256(bytes) !== text(record.sha256, `${label}.sha256`)) {
    fail('hash', `${label} whole-file hash is stale`);
  }
  return { absolute, bytes };
}

function rangeBytes(bytes, start, end, label) {
  const lines = bytes.toString('utf8').split('\n');
  positiveInteger(start, `${label}.lineStart`);
  positiveInteger(end, `${label}.lineEnd`);
  if (start > end || end > lines.length) {
    fail('evidence', `${label} has an invalid inclusive line range (1-${lines.length})`);
  }
  return Buffer.from(lines.slice(start - 1, end).join('\n'), 'utf8');
}

async function validateSymbol(root, ownerPath, symbol, label) {
  exactOrOptionalKeys(symbol, ['name', 'kind', 'signature', 'evidencePath', 'lineStart', 'lineEnd', 'rangeSha256', 'fileSha256'], ['integrationToken'], label);
  const name = text(symbol.name, `${label}.name`);
  text(symbol.kind, `${label}.kind`);
  const signature = text(symbol.signature, `${label}.signature`);
  if (symbol.evidencePath !== ownerPath) {
    fail('evidence', `${label} must identify its owner path`);
  }
  const evidencePath = await containedRegularPath(root, symbol.evidencePath, `${label}.evidencePath`);
  const bytes = await readFile(evidencePath);
  if (sha256(bytes) !== text(symbol.fileSha256, `${label}.fileSha256`)) {
    fail('hash', `${label} whole-file hash is stale`);
  }
  if (sha256(rangeBytes(bytes, symbol.lineStart, symbol.lineEnd, label)) !== text(symbol.rangeSha256, `${label}.rangeSha256`)) {
    fail('hash', `${label} inclusive-range hash is stale`);
  }
  const source = bytes.toString('utf8');
  if (!source.includes(name) || !source.includes(signature)) {
    fail('evidence', `${label} is missing its declared symbol or signature token`);
  }
  if (symbol.integrationToken !== undefined && !source.includes(text(symbol.integrationToken, `${label}.integrationToken`))) {
    fail('evidence', `${label} is missing its caller, callee, or registration evidence`);
  }
}

async function validateSeams(ledger, root) {
  exactSet(ledger.seams, requiredSeamKeys, 'seams', 'cardinality');
  const substitutionKeys = [];
  for (const seam of requiredSeamKeys) {
    const owners = array(ledger.seams[seam], `seams.${seam}`);
    if (owners.length !== 1) {
      fail('cardinality', `seams.${seam} must have exactly one owner`);
    }
    const owner = object(owners[0], `seams.${seam}[0]`);
    exactKeys(owner, ['ownerPath', 'responsibility', 'substitutionKey', 'symbols'], `seams.${seam}[0]`);
    const ownerPath = text(owner.ownerPath, `seams.${seam}[0].ownerPath`);
    await containedRegularPath(root, ownerPath, `seams.${seam}[0].ownerPath`);
    text(owner.responsibility, `seams.${seam}[0].responsibility`);
    const substitutionKey = text(owner.substitutionKey, `seams.${seam}[0].substitutionKey`);
    substitutionKeys.push(substitutionKey);
    const symbols = array(owner.symbols, `seams.${seam}[0].symbols`);
    if (symbols.length === 0) {
      fail('cardinality', `seams.${seam} must have at least one symbol`);
    }
    unique(symbols.map((symbol) => object(symbol, `seams.${seam}[0].symbols[]`).name), `seams.${seam} symbol names`);
    for (let index = 0; index < symbols.length; index += 1) {
      await validateSymbol(root, ownerPath, symbols[index], `seams.${seam}[0].symbols[${index}]`);
    }
  }
  unique(substitutionKeys, 'seam substitution keys');
  exactSet(ledger.substitutions, substitutionKeys, 'substitutions', 'substitution');
  for (const seam of requiredSeamKeys) {
    const owner = ledger.seams[seam][0];
    const substitution = object(ledger.substitutions[owner.substitutionKey], `substitutions.${owner.substitutionKey}`);
    exactKeys(substitution, ['seam', 'ownerPath', 'symbolName'], `substitutions.${owner.substitutionKey}`);
    if (substitution.seam !== seam || substitution.ownerPath !== owner.ownerPath || !owner.symbols.some((symbol) => symbol.name === substitution.symbolName)) {
      fail('substitution', `substitutions.${owner.substitutionKey} does not map one-to-one to its seam owner and symbol`);
    }
  }
}

async function validateCommand(root, command, label) {
  exactKeys(command, ['executable', 'argv', 'cwd', 'purpose', 'evidence'], label);
  if (!isAbsolute(text(command.executable, `${label}.executable`))) {
    fail('command', `${label}.executable must be absolute`);
  }
  let executable;
  try {
    executable = await realpath(command.executable);
    const executableStat = await stat(executable);
    await access(executable, 1);
    if (!executableStat.isFile()) throw new Error('not file');
  } catch {
    fail('command', `${label}.executable must resolve to an executable regular file`);
  }
  const argv = array(command.argv, `${label}.argv`);
  if (argv.length === 0 || argv.some((argument) => typeof argument !== 'string' || argument.length === 0 || shellCharacters.test(argument))) {
    fail('command', `${label}.argv must be a nonempty explicit argument array without shell syntax`);
  }
  if (command.cwd !== root) {
    fail('command', `${label}.cwd must equal the ledger repository root`);
  }
  text(command.purpose, `${label}.purpose`);
  exactKeys(command.evidence, ['path', 'fileSha256', 'token'], `${label}.evidence`);
  const evidence = await containedRegularPath(root, command.evidence.path, `${label}.evidence.path`);
  const bytes = await readFile(evidence);
  if (sha256(bytes) !== text(command.evidence.fileSha256, `${label}.evidence.fileSha256`)) {
    fail('command', `${label}.evidence has a stale file hash`);
  }
  if (!bytes.toString('utf8').includes(text(command.evidence.token, `${label}.evidence.token`))) {
    fail('command', `${label}.evidence token is not owned by its runner or config`);
  }
}

async function validateCommands(ledger, root) {
  exactSet(ledger.commands, requiredCommandKeys, 'commands', 'command');
  for (const key of requiredCommandKeys) {
    await validateCommand(root, ledger.commands[key], `commands.${key}`);
  }
}

async function validatePackageEvidence(ledger, root) {
  const evidence = object(ledger.packageEvidence, 'packageEvidence');
  exactKeys(evidence, ['packageManager', 'manifest', 'lockfile', 'dependencies', 'requiredInstalls', 'toolchain', 'packaging'], 'packageEvidence');
  exactKeys(evidence.packageManager, ['kind', 'declaration', 'agreement'], 'packageEvidence.packageManager');
  if (evidence.packageManager.kind !== 'npm') fail('package', 'package manager must be npm');
  if (evidence.packageManager.declaration !== null && typeof evidence.packageManager.declaration !== 'string') fail('package', 'package manager declaration must be string or null');
  text(evidence.packageManager.agreement, 'packageEvidence.packageManager.agreement');
  const manifest = await readVerifiedFile(root, evidence.manifest, 'packageEvidence.manifest');
  exactKeys(evidence.lockfile, ['path', 'kind', 'sha256'], 'packageEvidence.lockfile');
  const lockfile = await readVerifiedFile(root, { path: evidence.lockfile.path, sha256: evidence.lockfile.sha256 }, 'packageEvidence.lockfile');
  if (evidence.lockfile.kind !== 'npm-lockfile-v3') fail('package', 'lockfile kind must be npm-lockfile-v3');
  let manifestJson;
  let lockJson;
  try {
    manifestJson = JSON.parse(manifest.bytes.toString('utf8'));
    lockJson = JSON.parse(lockfile.bytes.toString('utf8'));
  } catch {
    fail('package', 'manifest and lockfile must parse as JSON');
  }
  if (lockJson.lockfileVersion !== 3) fail('package', 'lockfile must be npm v3');
  if (evidence.packageManager.declaration === null) {
    if (manifestJson.packageManager !== undefined || !evidence.packageManager.agreement.startsWith('lockfile-only')) fail('package', 'package manager declaration agreement is false');
  } else if (manifestJson.packageManager !== evidence.packageManager.declaration || !String(manifestJson.packageManager).startsWith('npm@')) {
    fail('package', 'package manager declaration disagreement');
  }
  const dependencies = array(evidence.dependencies, 'packageEvidence.dependencies');
  if (dependencies.length !== requiredDependencyNames.length) fail('package', 'dependency evidence is incomplete');
  unique(dependencies.map((dependency) => object(dependency, 'packageEvidence.dependencies[]').name), 'dependency evidence names');
  if (JSON.stringify(dependencies.map((dependency) => dependency.name).sort()) !== JSON.stringify([...requiredDependencyNames].sort())) fail('package', 'dependency evidence has missing or extra dependency names');
  for (const dependency of dependencies) {
    exactKeys(dependency, ['name', 'section', 'manifestVersion', 'lockedVersion'], `dependency.${dependency.name}`);
    const manifestVersions = manifestJson[dependency.section];
    const locked = lockJson.packages?.[`node_modules/${dependency.name}`]?.version;
    if (typeof manifestVersions !== 'object' || manifestVersions[dependency.name] !== dependency.manifestVersion || locked !== dependency.lockedVersion || dependency.manifestVersion !== dependency.lockedVersion) {
      fail('package', `dependency disagreement for ${dependency.name}`);
    }
  }
  if (array(evidence.requiredInstalls, 'packageEvidence.requiredInstalls').length !== 0) fail('package', 'requiredInstalls must be empty');
  exactKeys(evidence.toolchain, ['nodeEngine', 'configs'], 'packageEvidence.toolchain');
  if (manifestJson.engines?.node !== evidence.toolchain.nodeEngine) fail('package', 'Node engine evidence disagrees with manifest');
  const configs = array(evidence.toolchain.configs, 'packageEvidence.toolchain.configs');
  if (configs.length === 0) fail('package', 'toolchain config evidence is required');
  for (const config of configs) {
    exactKeys(config, ['path', 'sha256', 'token'], 'packageEvidence.toolchain.config');
    const verified = await readVerifiedFile(root, { path: config.path, sha256: config.sha256 }, 'packageEvidence.toolchain.config');
    if (!verified.bytes.toString('utf8').includes(text(config.token, 'packageEvidence.toolchain.config.token'))) fail('package', 'toolchain config token is missing');
  }
  exactKeys(evidence.packaging, ['declarations', 'declaredTargets'], 'packageEvidence.packaging');
  const declarations = array(evidence.packaging.declarations, 'packageEvidence.packaging.declarations');
  if (declarations.length === 0) fail('package', 'packaging declaration evidence is required');
  for (const declaration of declarations) {
    exactKeys(declaration, ['path', 'sha256', 'token'], 'packageEvidence.packaging.declaration');
    const verified = await readVerifiedFile(root, { path: declaration.path, sha256: declaration.sha256 }, 'packageEvidence.packaging.declaration');
    if (!verified.bytes.toString('utf8').includes(text(declaration.token, 'packageEvidence.packaging.declaration.token'))) fail('package', 'packaging declaration token is missing');
  }
}

function targetKey(target) {
  return `${target.os}/${target.architecture}/${target.triple}`;
}

function validateTarget(target, label) {
  exactKeys(target, ['os', 'architecture', 'triple', 'commandKey', 'toolchainEvidence', 'packagingEvidence', 'reExportCapability'], label);
  for (const key of ['os', 'architecture', 'triple', 'commandKey', 'toolchainEvidence', 'packagingEvidence', 'reExportCapability']) text(target[key], `${label}.${key}`);
  if (!requiredCommandKeys.includes(target.commandKey)) fail('publication', `${label} references an undeclared command`);
  if (target.reExportCapability !== 'pending') fail('publication', `${label} cannot claim re-export capability before the Plan 04-03 probe`);
}

function validatePublicationPolicy(ledger) {
  const policy = object(ledger.publicationPolicy, 'publicationPolicy');
  exactKeys(policy, ['kind', 'stablePath', 'fallbackKind', 'promotionRequirement', 'targets'], 'publicationPolicy');
  if (policy.kind !== 'native-exchange-probe-pending') fail('publication', 'unknown or preapproved publication policy kind');
  if (policy.stablePath !== '.diff-review/exports/<fullBaseOid>..<fullHeadOid>') fail('publication', 'stable export path is absent or not comparison-specific');
  if (policy.fallbackKind !== 'reExportUnsupported') fail('publication', 'portable or stable-to-backup fallback is forbidden');
  if (!text(policy.promotionRequirement, 'publicationPolicy.promotionRequirement').includes('Plan 04-03')) fail('publication', 'publication policy lacks the Plan 04-03 promotion gate');
  const targets = array(policy.targets, 'publicationPolicy.targets');
  const declared = array(ledger.packageEvidence.packaging.declaredTargets, 'packageEvidence.packaging.declaredTargets');
  unique(targets.map(targetKey), 'publication policy targets');
  unique(declared.map(targetKey), 'declared packaging targets');
  if (targets.length !== declared.length || targets.some((target) => !declared.some((candidate) => targetKey(candidate) === targetKey(target)))) fail('publication', 'publication targets are duplicate or undeclared');
  for (let index = 0; index < targets.length; index += 1) {
    validateTarget(targets[index], `publicationPolicy.targets[${index}]`);
    const declaredTarget = declared.find((candidate) => targetKey(candidate) === targetKey(targets[index]));
    validateTarget(declaredTarget, `packageEvidence.packaging.declaredTargets[${index}]`);
  }
}

export async function validateReconciliationLedger(ledger, options = {}) {
  exactKeys(ledger, topLevelKeys, 'ledger');
  if (ledger.schemaVersion !== 1 || ledger.status !== 'approved') fail('schema', 'ledger must be schemaVersion 1 and approved');
  if (!Array.isArray(ledger.failures)) fail('schema', 'failures must be an array');
  const expectedRoot = options.root === undefined ? resolve(ledger.repositoryRoot) : resolve(options.root);
  if (!isAbsolute(text(ledger.repositoryRoot, 'repositoryRoot')) || resolve(ledger.repositoryRoot) !== expectedRoot) fail('path', 'repositoryRoot must be the validation root');
  await validateSeams(ledger, expectedRoot);
  await validateCommands(ledger, expectedRoot);
  await validatePackageEvidence(ledger, expectedRoot);
  validatePublicationPolicy(ledger);
  return ledger;
}

function markdown(ledger) {
  const ownerRows = requiredSeamKeys.map((seam) => {
    const owner = ledger.seams[seam][0];
    return `| ${seam} | \`${owner.ownerPath}\` | \`${owner.symbols.map((symbol) => symbol.name).join(', ')}\` | \`${owner.substitutionKey}\` |`;
  }).join('\n');
  return `# Phase 04 Plan 01 Reconciliation\n\n## Status\n\n**Approved for Phase 4 source planning only.** Native exchange remains unbuilt and unapproved.\n\n## Grounded seam owners\n\n| Seam | Owner | Evidence | Substitution |\n|---|---|---|---|\n${ownerRows}\n\n## Focused commands\n\n${requiredCommandKeys.map((key) => `- \`${key}\`: \`${ledger.commands[key].executable}\` ${ledger.commands[key].argv.map((argument) => `\`${argument}\``).join(' ')}`).join('\n')}\n\n## Package and publication disposition\n\n- Package manager: ${ledger.packageEvidence.packageManager.kind}; required installs: none.\n- Manifest: \`${ledger.packageEvidence.manifest.path}\`; lockfile: \`${ledger.packageEvidence.lockfile.path}\`.\n- Declared packaging targets: ${ledger.packageEvidence.packaging.declaredTargets.length}.\n- Publication policy: \`${ledger.publicationPolicy.kind}\`; every target capability is pending.\n- Reusable reveal adapter: \`${ledger.seams.platformRevealAdapter[0].ownerPath}\`; no export-directory reveal route is asserted.\n\n## Failures\n\n${ledger.failures.length === 0 ? 'None.' : ledger.failures.map((failure) => `- ${failure}`).join('\n')}\n`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function createFixture() {
  const root = await mkdtemp(resolve(tmpdir(), 'diff-review-reconciliation-'));
  const write = async (path, contents) => {
    const absolute = resolve(root, path);
    await (await import('node:fs/promises')).mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, contents);
  };
  const owner = (seam) => `owners/${seam}.txt`;
  for (const seam of requiredSeamKeys) await write(owner(seam), `export const ${seam}Symbol = '${seam}';\nregister ${seam}\n`);
  await write('runner.mjs', 'const runnerToken = true;\n');
  await write('config.json', '{"configToken":true}\n');
  await write('package.json', JSON.stringify({ engines: { node: '>=24' }, dependencies: { zod: '1.0.0', fastify: '1.0.0' }, devDependencies: { vitest: '1.0.0', '@playwright/test': '1.0.0' } }) + '\n');
  await write('package-lock.json', JSON.stringify({ lockfileVersion: 3, packages: Object.fromEntries(requiredDependencyNames.map((name) => [`node_modules/${name}`, { version: '1.0.0' }])) }) + '\n');
  const proof = async (path) => ({ path, sha256: sha256(await readFile(resolve(root, path))) });
  const seams = {};
  const substitutions = {};
  for (const seam of requiredSeamKeys) {
    const path = owner(seam);
    const bytes = await readFile(resolve(root, path));
    const substitutionKey = `${seam}-key`;
    seams[seam] = [{ ownerPath: path, responsibility: `${seam} responsibility`, substitutionKey, symbols: [{ name: `${seam}Symbol`, kind: 'fixture symbol', signature: `export const ${seam}Symbol`, evidencePath: path, lineStart: 1, lineEnd: 3, rangeSha256: sha256(bytes), fileSha256: sha256(bytes), integrationToken: `register ${seam}` }] }];
    substitutions[substitutionKey] = { seam, ownerPath: path, symbolName: `${seam}Symbol` };
  }
  const runnerProof = await proof('runner.mjs');
  const configProof = await proof('config.json');
  const manifest = await proof('package.json');
  const lockfile = await proof('package-lock.json');
  const commands = Object.fromEntries(requiredCommandKeys.map((key) => [key, { executable: process.execPath, argv: ['runner.mjs'], cwd: root, purpose: `${key} purpose`, evidence: { path: 'runner.mjs', fileSha256: runnerProof.sha256, token: 'runnerToken' } }]));
  return {
    schemaVersion: 1, status: 'approved', repositoryRoot: root, seams, substitutions, commands,
    packageEvidence: { packageManager: { kind: 'npm', declaration: null, agreement: 'lockfile-only fixture' }, manifest, lockfile: { ...lockfile, kind: 'npm-lockfile-v3' }, dependencies: requiredDependencyNames.map((name) => ({ name, section: name === 'zod' || name === 'fastify' ? 'dependencies' : 'devDependencies', manifestVersion: '1.0.0', lockedVersion: '1.0.0' })), requiredInstalls: [], toolchain: { nodeEngine: '>=24', configs: [{ ...configProof, token: 'configToken' }] }, packaging: { declarations: [{ ...configProof, token: 'configToken' }], declaredTargets: [] } },
    publicationPolicy: { kind: 'native-exchange-probe-pending', stablePath: '.diff-review/exports/<fullBaseOid>..<fullHeadOid>', fallbackKind: 'reExportUnsupported', promotionRequirement: 'Plan 04-03 probe required.', targets: [] }, failures: [],
  };
}

async function expectRejected(name, mutate, expectedCode) {
  const fixture = await createFixture();
  try {
    const candidate = clone(fixture);
    await mutate(candidate, fixture.repositoryRoot);
    try {
      await validateReconciliationLedger(candidate, { root: fixture.repositoryRoot });
    } catch (error) {
      if (error instanceof ReconciliationError && error.code === expectedCode) return;
      throw new Error(`${name} rejected through ${error.code ?? 'unexpected error'} instead of ${expectedCode}`);
    }
    throw new Error(`${name} was accepted`);
  } finally {
    await rm(fixture.repositoryRoot, { recursive: true, force: true });
  }
}

export async function runMutationSelfTest() {
  const fixture = await createFixture();
  try {
    await validateReconciliationLedger(fixture, { root: fixture.repositoryRoot });
  } finally {
    await rm(fixture.repositoryRoot, { recursive: true, force: true });
  }
  const tests = [
    ['unknown top key', (x) => { x.unknown = true; }, 'schema'],
    ['omitted top key', (x) => { delete x.failures; }, 'schema'],
    ['wrong top type', (x) => { x.seams = []; }, 'schema'],
    ['empty owner responsibility', (x) => { x.seams.sharedSchema[0].responsibility = ''; }, 'schema'],
    ['zero owners', (x) => { x.seams.sharedSchema = []; }, 'cardinality'],
    ['two owners', (x) => { x.seams.sharedSchema.push(clone(x.seams.sharedSchema[0])); }, 'cardinality'],
    ['duplicate substitution', (x) => { x.seams.draftStore[0].substitutionKey = x.seams.sharedSchema[0].substitutionKey; }, 'cardinality'],
    ['duplicate symbol', (x) => { x.seams.sharedSchema[0].symbols.push(clone(x.seams.sharedSchema[0].symbols[0])); }, 'cardinality'],
    ['missing substitution mapping', (x) => { delete x.substitutions[x.seams.sharedSchema[0].substitutionKey]; }, 'substitution'],
    ['broken substitution mapping', (x) => { x.substitutions[x.seams.sharedSchema[0].substitutionKey].symbolName = 'missing'; }, 'substitution'],
    ['absent owner path', (x) => { x.seams.sharedSchema[0].ownerPath = 'missing.txt'; }, 'path'],
    ['directory owner path', async (x, root) => { await (await import('node:fs/promises')).mkdir(resolve(root, 'directory')); x.seams.sharedSchema[0].ownerPath = 'directory'; }, 'path'],
    ['symlink owner path', async (x, root) => { await (await import('node:fs/promises')).symlink(resolve(root, 'owners/sharedSchema.txt'), resolve(root, 'link.txt')); x.seams.sharedSchema[0].ownerPath = 'link.txt'; }, 'path'],
    ['absolute evidence path', (x) => { x.seams.sharedSchema[0].symbols[0].evidencePath = '/tmp/nope'; }, 'evidence'],
    ['escaping evidence path', (x) => { x.seams.sharedSchema[0].symbols[0].evidencePath = '../escape'; }, 'evidence'],
    ['stale file hash', (x) => { x.seams.sharedSchema[0].symbols[0].fileSha256 = '0'.repeat(64); }, 'hash'],
    ['stale range hash', (x) => { x.seams.sharedSchema[0].symbols[0].rangeSha256 = '0'.repeat(64); }, 'hash'],
    ['missing signature', (x) => { x.seams.sharedSchema[0].symbols[0].signature = 'missing signature'; }, 'evidence'],
    ['missing callsite', (x) => { x.seams.sharedSchema[0].symbols[0].integrationToken = 'missing callsite'; }, 'evidence'],
    ['missing command', (x) => { delete x.commands['04-02-canonical']; }, 'command'],
    ['extra command', (x) => { x.commands.extra = clone(x.commands['04-02-canonical']); }, 'command'],
    ['unfocused argv', (x) => { x.commands['04-02-canonical'].argv = ['runner.mjs; rm']; }, 'command'],
    ['unresolvable executable', (x) => { x.commands['04-02-canonical'].executable = '/missing/executable'; }, 'command'],
    ['nonabsolute executable', (x) => { x.commands['04-02-canonical'].executable = 'node'; }, 'command'],
    ['manifest disagreement', (x) => { x.packageEvidence.dependencies[0].manifestVersion = '9.9.9'; }, 'package'],
    ['lock disagreement', (x) => { x.packageEvidence.dependencies[0].lockedVersion = '9.9.9'; }, 'package'],
    ['package manager disagreement', (x) => { x.packageEvidence.packageManager.agreement = 'declared'; }, 'package'],
    ['required install', (x) => { x.packageEvidence.requiredInstalls.push('native addon'); }, 'package'],
    ['unknown policy kind', (x) => { x.publicationPolicy.kind = 'native-approved'; }, 'publication'],
    ['preapproved capability', (x) => { const target = { os: 'darwin', architecture: 'arm64', triple: 'darwin-arm64', commandKey: '04-03-native-exchange', toolchainEvidence: 'config', packagingEvidence: 'config', reExportCapability: 'capable' }; x.packageEvidence.packaging.declaredTargets = [target]; x.publicationPolicy.targets = [clone(target)]; }, 'publication'],
    ['undeclared target', (x) => { x.publicationPolicy.targets = [{ os: 'darwin', architecture: 'arm64', triple: 'darwin-arm64', commandKey: '04-03-native-exchange', toolchainEvidence: 'config', packagingEvidence: 'config', reExportCapability: 'pending' }]; }, 'publication'],
    ['portable fallback', (x) => { x.publicationPolicy.fallbackKind = 'stable-to-backup'; }, 'publication'],
    ['stable path absent', (x) => { x.publicationPolicy.stablePath = ''; }, 'publication'],
    ['first export overwrite', (x) => { x.publicationPolicy.firstExportOverwrite = true; }, 'schema'],
  ];
  for (const [name, mutate, expectedCode] of tests) await expectRejected(name, mutate, expectedCode);
  return { mutations: tests.map(([name]) => name), status: 'passed' };
}

async function main() {
  const [mode, input] = process.argv.slice(2);
  if (mode === '--self-test') {
    const result = await runMutationSelfTest();
    process.stdout.write(`mutation self-test passed (${result.mutations.length} rejection branches)\n`);
    return;
  }
  const inputPath = mode === '--schema-only' ? input : mode;
  const path = inputPath ?? '.planning/phases/04-agent-ready-export/04-01-RECONCILIATION.json';
  const ledger = JSON.parse(await readFile(path, 'utf8'));
  await validateReconciliationLedger(ledger, { root: resolve(ledger.repositoryRoot) });
  if (mode !== '--schema-only') await writeFile(resolve(ledger.repositoryRoot, '.planning/phases/04-agent-ready-export/04-01-RECONCILIATION.md'), markdown(ledger));
  process.stdout.write(`reconciliation ledger valid: ${basename(path)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
