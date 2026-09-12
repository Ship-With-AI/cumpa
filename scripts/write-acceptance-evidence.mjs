import { existsSync, linkSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

const requiredRequirements = new Set(['ACC-01', 'ACC-02', 'ACC-03', 'ACC-04']);
const requiredSources = ['global', 'npx', 'marketplace'];
const requiredStates = ['unverified', 'dismissed', 'verified'];
const allowedHttpsUrls = new Set([
  'https://registry.npmjs.org/@shipwithai/cumpa/-/cumpa-1.5.0.tgz',
  'https://github.com/Ship-With-AI/skills.git',
]);

function fail(message) {
  throw new Error(`acceptance evidence: ${message}`);
}

function blockedRow(row) {
  if (row.status !== 'blocked') return;
  if (typeof row.reason !== 'string' || row.reason.length === 0) fail('blocked row requires a named reason');
  if (row.substituted !== false) fail('blocked row requires substituted: false');
}

function supportRows(row) {
  return Array.isArray(row.supportStates) ? row.supportStates : [];
}

export function deriveAcceptanceStatus(rows) {
  if (!Array.isArray(rows)) fail('rows must be an array');
  const requirements = new Set(rows.map((row) => row?.requirement));
  if (requirements.size !== requiredRequirements.size || [...requiredRequirements].some((requirement) => !requirements.has(requirement))) {
    fail('requirement coverage must include ACC-01 through ACC-04');
  }
  for (const row of rows) {
    if (!row || !['passed', 'blocked'].includes(row.status)) fail('row status must be passed or blocked');
    blockedRow(row);
    for (const nested of supportRows(row)) {
      if (!nested || !['passed', 'blocked'].includes(nested.status)) fail('support-state row status must be passed or blocked');
      blockedRow(nested);
    }
  }
  const acc04 = rows.find((row) => row.requirement === 'ACC-04');
  const states = supportRows(acc04);
  for (const source of requiredSources) {
    const sourceRows = states.filter((row) => row.installSource === source);
    if (sourceRows.length === 0) fail(`ACC-04 support-state rows missing for ${source}`);
    for (const state of requiredStates) {
      if (!sourceRows.some((row) => row.state === state)) return 'partially-blocked';
    }
  }
  return rows.some((row) => row.status === 'blocked' || supportRows(row).some((nested) => nested.status === 'blocked'))
    ? 'partially-blocked'
    : 'passed';
}

export function assertNoPrivateValues(record, extraForbiddenValues = []) {
  const serialized = JSON.stringify(record);
  if (/"[^"\n]*(?:path|origin|email|credential|token|secret)[^"\n]*"\s*:/iu.test(serialized)) fail('private key name found');
  if (/(?:^|[^A-Za-z])(?:\/Users\/|\/home\/|[A-Z]:\\)/u.test(serialized)) fail('absolute private path found');
  if (/(?:^|[^A-Za-z0-9_-])[A-Za-z0-9_-]{43}(?:$|[^A-Za-z0-9_-])/u.test(serialized)) fail('installation id shaped value found');
  for (const url of serialized.match(/https:\/\/[^"\s]+/gu) ?? []) {
    if (!allowedHttpsUrls.has(url.replace(/[),.]+$/u, ''))) fail('unapproved https url found');
  }
  for (const value of extraForbiddenValues) {
    if (typeof value === 'string' && value.length > 0 && serialized.includes(value)) fail('supplied forbidden value found');
  }
}

function exactIdentity(identity) {
  const required = ['tarballUrl', 'byteLength', 'sha256', 'npmShasumSha1', 'npmIntegritySha512'];
  if (!identity || required.some((key) => identity[key] === undefined)) fail('artifact identity is incomplete');
  return Object.freeze({
    tarballUrl: identity.tarballUrl,
    byteLength: identity.byteLength,
    sha256: identity.sha256,
    npmShasumSha1: identity.npmShasumSha1,
    npmIntegritySha512: identity.npmIntegritySha512,
  });
}

function limitationText(paths, restoreDefect) {
  const limitations = [
    'Local process isolation is not fresh-machine proof.',
    'One macOS host platform and one browser were exercised; no operating-system or browser compatibility matrix is claimed.',
    'OMP is the only agent runtime exercised; Claude Code, Codex, and Pi remain unexercised and the Phase 6 four-agent waiver remains intact.',
    'The Phase 4 and Phase 5 local-archive acceptance record is separate and unchanged.',
    'The local-archive path requires operator-held custody inputs and the protected CUMPA_RELEASE_SUPPORT_SERVICE_URL; its full execution was not available.',
  ];
  if (paths.some((path) => path.sharedSupportIdentity)) limitations.push('One shared voluntary-support identity was used across all three installation paths; three distinct identities would have required three protected sign-ins. This operator-confirmed narrowing left npm cache, npm configuration, install prefix, browser profile state, checkout separation, and sanitized PATH isolated per path.');
  if (paths.some((path) => path.providerAuthenticationReused)) limitations.push('The isolated OMP profile reused a temporary read-only copy of the operator provider credential and was not independently authenticated.');
  if (restoreDefect) limitations.push('restoreReportedCompleteWithoutLinkage was observed and remains a product defect outside Phase 7 scope under D-09.');
  for (const reason of new Set(paths.flatMap((path) => supportRows(path).filter((state) => state.status === 'blocked').map((state) => state.reason)).filter(Boolean))) limitations.push(`Blocked support-state reason: ${reason}.`);
  return limitations;
}

export function buildAcceptanceEvidence(inputs) {
  const identity = exactIdentity(inputs?.artifactIdentity);
  const paths = inputs?.paths;
  if (!Array.isArray(paths) || paths.length !== 3) fail('three installation paths are required');
  const sources = new Set(paths.map((path) => path.installSource));
  if (sources.size !== 3 || requiredSources.some((source) => !sources.has(source))) fail('global, npx, and marketplace paths are required');
  for (const path of paths) {
    if (path?.installProof?.resolvedIntegrity !== identity.npmIntegritySha512) fail('install proof integrity differs from pinned identity');
    for (const state of supportRows(path)) blockedRow(state);
  }
  const allStates = paths.flatMap((path) => supportRows(path));
  const blockedStates = allStates.filter((state) => state.status === 'blocked');
  const acc04Blocked = blockedStates.length > 0;
  const rows = [
    ...paths.map((path) => ({ requirement: path.requirement, status: path.status, installSource: path.installSource, ...(path.status === 'blocked' ? { reason: path.reason, substituted: false } : {}) })),
    { requirement: 'ACC-04', status: acc04Blocked ? 'blocked' : 'passed', ...(acc04Blocked ? { reason: blockedStates[0].reason, substituted: false } : {}), supportStates: allStates },
  ];
  const uniqueRows = rows.filter((row, index) => row.requirement === 'ACC-04' || index === rows.findIndex((candidate) => candidate.requirement === row.requirement));
  const status = deriveAcceptanceStatus(uniqueRows);
  const record = {
    kind: 'cumpa.public-artifact-acceptance/v1',
    status,
    acceptedAt: inputs.acceptedAt,
    host: inputs.host,
    isolationBoundary: {
      type: 'isolated-local-environments',
      freshMachine: false,
      ranOutsideCheckout: true,
      preservedUserState: true,
      isolatedDimensions: ['npm-cache', 'npm-configuration', 'install-prefix', 'browser-profile-state', 'checkout-separation', 'sanitized-path'],
      sharedSupportHome: paths.some((path) => path.sharedSupportIdentity),
    },
    artifactIdentity: identity,
    marketplaceIdentity: inputs.marketplaceIdentity,
    installations: paths,
    restoreReportedCompleteWithoutLinkage: inputs.restoreReportedCompleteWithoutLinkage === true,
    localArchivePrerequisite: inputs.localArchivePrerequisite === true,
    limitations: limitationText(paths, inputs.restoreReportedCompleteWithoutLinkage === true, inputs.localArchivePrerequisite === true),
  };
  assertNoPrivateValues(record, inputs.extraForbiddenValues ?? []);
  return record;
}

function reportPath(source, requirement, reason, identity) {
  return {
    installSource: source,
    requirement,
    status: 'blocked',
    reason,
    substituted: false,
    installProof: { resolvedIntegrity: identity.npmIntegritySha512 },
    supportStates: requiredStates.map((state) => ({ installSource: source, state, status: 'blocked', reason, substituted: false })),
    sharedSupportIdentity: false,
  };
}

function normalizedSource(source) {
  return source === 'public-global' ? 'global' : source === 'public-npx' ? 'npx' : source;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    fail('input report is not valid JSON');
  }
}

function mergeReports(reports, source, requirement, identity) {
  if (reports.length === 0) return reportPath(source, requirement, source === 'marketplace' ? 'marketplace-run-not-performed' : 'public-run-not-performed', identity);
  const first = reports[0];
  const installProof = first.installProof ?? first.publicProof ?? { resolvedIntegrity: identity.npmIntegritySha512 };
  const sharedSupportIdentity = Boolean(first.sharedSupportIdentity?.supportHomeShared ?? first.isolation?.sharedSupportHome);
  const supportStates = reports.flatMap((report) => report.supportStates ?? []).map((state) => ({ ...state, installSource: source }));
  const deduplicatedStates = requiredStates.map((state) => supportStates.find((entry) => entry.state === state)).filter(Boolean);
  const pathBlocked = reports.find((report) => report.status === 'blocked');
  return {
    installSource: source,
    requirement,
    status: pathBlocked ? 'blocked' : (source === 'marketplace' ? (first.acc03?.status ?? first.status) : first.status),
    ...(pathBlocked ? { reason: pathBlocked.reason, substituted: false } : {}),
    installProof,
    supportStates: deduplicatedStates,
    sharedSupportIdentity,
    ...(first.isolation?.providerCredentialReused === true ? { providerAuthenticationReused: true } : {}),
    restoreReportedCompleteWithoutLinkage: first.restoreReportedCompleteWithoutLinkage === true || first.support?.restoreReportedCompleteWithoutLinkage === true,
    evidence: source === 'marketplace'
      ? { collection: first.marketplace?.collection, lifecycle: first.lifecycle, canonical: first.canonical }
      : { assetGraph: first.assetGraph, reviewExport: first.reviewExport, finish: first.finish },
  };
}

const root = resolve(import.meta.dirname, '..');
const releaseEvidencePath = join(root, '.planning/phases/05-bootstrap-trusted-stable-publication/05-RELEASE-EVIDENCE.json');
const marketplaceEvidencePath = join(root, '.planning/phases/06-independent-mit-marketplace-skill/06-PUBLICATION-EVIDENCE.json');

function readPinnedIdentity() {
  const releaseEvidence = JSON.parse(readFileSync(releaseEvidencePath, 'utf8'));
  return Object.freeze({
    tarballUrl: 'https://registry.npmjs.org/@shipwithai/cumpa/-/cumpa-1.5.0.tgz',
    byteLength: releaseEvidence.candidate.archive.byteLength,
    sha256: releaseEvidence.candidate.archive.sha256,
    npmShasumSha1: releaseEvidence.candidate.archive.npmShasumSha1,
    npmIntegritySha512: releaseEvidence.candidate.archive.npmIntegritySha512,
  });
}

function readMarketplaceIdentity() {
  const evidence = JSON.parse(readFileSync(marketplaceEvidencePath, 'utf8'));
  return {
    collectionVersion: evidence.collectionVersion.to,
    commit: evidence.candidateOid,
    skillDigest: evidence.reviewedFileHashes['skills/cumpa/SKILL.md'],
    repository: evidence.repository,
  };
}

export function writeAcceptanceEvidence({ publicReportPaths = [], marketplaceReportPaths = [], outputPath, acceptedAt, extraForbiddenValues = [] }) {
  if (!isAbsolute(outputPath)) fail('output path must be absolute');
  if (existsSync(outputPath)) fail('output path already exists');
  const identity = readPinnedIdentity();
  const publicReports = publicReportPaths.map(readJson);
  const marketplaceReports = marketplaceReportPaths.map(readJson);
  const allReports = [...publicReports, ...marketplaceReports];
  const observedHost = allReports.find((report) => report.host)?.host;
  if (!observedHost) fail('reports must contain observed host facts');
  const bySource = new Map(requiredSources.map((source) => [source, []]));
  for (const report of allReports) {
    const source = normalizedSource(report.installSource ?? 'marketplace');
    if (!bySource.has(source)) fail('report has an unsupported installation path');
    bySource.get(source).push(report);
  }
  const paths = [
    mergeReports(bySource.get('global'), 'global', 'ACC-01', identity),
    mergeReports(bySource.get('npx'), 'npx', 'ACC-02', identity),
    mergeReports(bySource.get('marketplace'), 'marketplace', 'ACC-03', identity),
  ];
  const record = buildAcceptanceEvidence({
    acceptedAt,
    host: observedHost,
    artifactIdentity: identity,
    marketplaceIdentity: readMarketplaceIdentity(),
    paths,
    restoreReportedCompleteWithoutLinkage: paths.some((path) => path.restoreReportedCompleteWithoutLinkage === true),
    localArchivePrerequisite: true,
    extraForbiddenValues,
  });
  mkdirSync(dirname(outputPath), { recursive: true, mode: 0o700 });
  const temporary = join(dirname(outputPath), `.${basename(outputPath)}.${randomUUID()}.tmp`);
  try {
    writeFileSync(temporary, `${JSON.stringify(record, null, 2)}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    linkSync(temporary, outputPath);
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
  return record;
}

function parseArguments(argv) {
  const options = { publicReportPaths: [], marketplaceReportPaths: [] };
  for (let index = 0; index < argv.length; index += 2) {
    const [name, value] = [argv[index], argv[index + 1]];
    if (typeof value !== 'string' || value === '') fail('invalid writer arguments');
    if (name === '--public-report') options.publicReportPaths.push(value);
    else if (name === '--marketplace-report') options.marketplaceReportPaths.push(value);
    else if (name === '--output') options.outputPath = value;
    else if (name === '--accepted-at') options.acceptedAt = value;
    else fail('invalid writer arguments');
  }
  if (!options.outputPath || !options.acceptedAt) fail('output and accepted-at are required');
  return options;
}

if (import.meta.main) {
  try {
    process.stdout.write(`${JSON.stringify(writeAcceptanceEvidence(parseArguments(process.argv.slice(2))))}\n`);
  } catch {
    process.stderr.write('acceptance evidence writer failed\n');
    process.exitCode = 1;
  }
}
