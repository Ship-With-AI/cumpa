import { expect, test } from 'vitest';

import {
  assertNoPrivateValues,
  buildAcceptanceEvidence,
  deriveAcceptanceStatus,
} from '../../scripts/write-acceptance-evidence.mjs';

const tarballUrl = 'https://registry.npmjs.org/@shipwithai/cumpa/-/cumpa-1.5.0.tgz';
const integrity = 'sha512-gUBrMYwL8u75k1JX1OxO2dwfUsjQGHAqPUjh8e5Ep6gVs52wwEZFwkl49fBU2eggU9S7J1r27SCa8W1X/iHn5g==';
const marketplaceRepository = 'https://github.com/Ship-With-AI/skills.git';

function supportStates(source: string, verified: 'passed' | 'blocked' = 'passed') {
  return ['unverified', 'dismissed', 'verified'].map((state) => ({
    installSource: source,
    state,
    status: state === 'verified' ? verified : 'passed',
    ...(state === 'verified' && verified === 'blocked' ? { reason: 'live-entitlement-unavailable', substituted: false } : { substituted: false }),
  }));
}

function rows(verified: 'passed' | 'blocked' = 'passed') {
  return [
    { requirement: 'ACC-01', status: 'passed', installSource: 'global' },
    { requirement: 'ACC-02', status: 'passed', installSource: 'npx' },
    { requirement: 'ACC-03', status: 'passed', installSource: 'marketplace' },
    { requirement: 'ACC-04', status: verified, ...(verified === 'blocked' ? { reason: 'live-entitlement-unavailable', substituted: false } : {}), supportStates: [...supportStates('global', verified), ...supportStates('npx', verified), ...supportStates('marketplace', verified)] },
  ];
}
function inputs(sharedSupportIdentity = false) {
  return {
    acceptedAt: '2026-09-12T16:05:28.000Z',
    host: { platform: 'darwin', arch: 'arm64', osRelease: '25.6.0', node: '24.11.0', npm: '11.6.2', git: '2.50.1', playwright: '1.55.0', browser: 'Chromium 140' },
    artifactIdentity: { tarballUrl, byteLength: 3514800, sha256: 'dc8f792920833415d309015d5f4c31501016e9a4a6cc945bb69dde2453137141', npmShasumSha1: '2d58866c862283f2c41b3f4f7d51282b2ca96472', npmIntegritySha512: integrity },
    marketplaceIdentity: { collectionVersion: '0.3.0', commit: '984e28c5838176ec15d2af8b996d0307e45b28d5', skillDigest: '8974c947bceaf2921fdd74ea900c8af6a85c1c9f94428f66f53eea923d630220', repository: marketplaceRepository },
    paths: [
      { installSource: 'global', requirement: 'ACC-01', status: 'passed', installProof: { resolvedIntegrity: integrity }, supportStates: supportStates('global'), sharedSupportIdentity },
      { installSource: 'npx', requirement: 'ACC-02', status: 'passed', installProof: { resolvedIntegrity: integrity }, supportStates: supportStates('npx'), sharedSupportIdentity },
      { installSource: 'marketplace', requirement: 'ACC-03', status: 'passed', installProof: { resolvedIntegrity: integrity }, supportStates: supportStates('marketplace'), sharedSupportIdentity },
    ],
  };
}

test('derives passed only from a complete all-passed matrix', () => {
  expect(deriveAcceptanceStatus(rows())).toBe('passed');
  expect(deriveAcceptanceStatus(rows('blocked'))).toBe('partially-blocked');
});

test('treats blocked rows and incomplete support observations as partially blocked', () => {
  expect(deriveAcceptanceStatus(rows('blocked'))).toBe('partially-blocked');
  const incomplete = rows();
  incomplete[3].supportStates = incomplete[3].supportStates.filter((row) => row.state !== 'verified');
  expect(deriveAcceptanceStatus(incomplete)).toBe('partially-blocked');
});

test('rejects blocked rows without a named unsubstituted reason', () => {
  expect(() => deriveAcceptanceStatus([...rows().slice(0, 3), { requirement: 'ACC-04', status: 'blocked', supportStates: [] }])).toThrow(/reason/u);
  expect(() => deriveAcceptanceStatus([...rows().slice(0, 3), { requirement: 'ACC-04', status: 'blocked', reason: 'blocked', substituted: true, supportStates: [] }])).toThrow(/substituted/u);
});

test('requires every requirement and every ACC-04 path', () => {
  expect(() => deriveAcceptanceStatus(rows().slice(0, 3))).toThrow(/coverage/u);
  const missingMarketplace = rows();
  missingMarketplace[3].supportStates = missingMarketplace[3].supportStates.filter((row) => row.installSource !== 'marketplace');
  expect(() => deriveAcceptanceStatus(missingMarketplace)).toThrow(/marketplace/u);
});

test('refuses private values without echoing them', () => {
  expect(() => assertNoPrivateValues({ token: 'logical-token' })).toThrow(/private key/u);
  expect(() => assertNoPrivateValues({ location: '/Users/example/private' })).toThrow(/absolute private path/u);
  expect(() => assertNoPrivateValues({ identifier: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq' })).toThrow(/installation id/u);
  expect(() => assertNoPrivateValues({ url: 'https://private.example.test/flow' })).toThrow(/https url/u);
  expect(() => assertNoPrivateValues({ tarballUrl, marketplaceRepository, digest: 'abc123' })).not.toThrow();
});

test('builds a pinned partially-blocked record and records shared support narrowing', () => {
  const record = buildAcceptanceEvidence(inputs(true));
  expect(record.kind).toBe('cumpa.public-artifact-acceptance/v1');
  expect(record.status).toBe('passed');
  expect(record.artifactIdentity).toMatchObject(inputs().artifactIdentity);
  expect(record.limitations.join('\n')).toMatch(/shared voluntary-support identity/u);
  const broken = inputs();
  broken.paths[1].installProof.resolvedIntegrity = 'sha512-wrong';
  expect(() => buildAcceptanceEvidence(broken)).toThrow(/integrity/u);
});
