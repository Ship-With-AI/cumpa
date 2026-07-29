import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

import { comparisonKey } from '../../src/domain/comparison-key.js';
import { createDraftLoader } from '../../src/server/draft-loader.js';

const comparison = {
  baseCommitOid: '1'.repeat(40),
  headCommitOid: '2'.repeat(40),
  mergeBaseOid: '3'.repeat(40),
};
const roots: string[] = [];

async function fixture(bytes?: Buffer): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'compare-draft-load-'));
  roots.push(root);
  if (bytes !== undefined) {
    const directory = join(root, '.compare', 'drafts');
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, `${comparisonKey(comparison.baseCommitOid, comparison.headCommitOid)}.json`), bytes);
  }
  return root;
}

function current(overrides: Record<string, unknown> = {}): Buffer {
  return Buffer.from(JSON.stringify({
    schemaVersion: 1,
    comparison,
    revision: 0,
    summary: '',
    comments: [],
    ...overrides,
  }), 'utf8');
}

function fingerprint(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map(async (root) => rm(root, { recursive: true, force: true })));
});

describe('raw draft load classification', () => {
  test('distinguishes missing and strictly current bytes without normalizing them', async () => {
    const missing = await fixture();
    await expect(createDraftLoader({ repositoryRoot: missing, comparison }).load()).resolves.toMatchObject({
      kind: 'missing',
      path: '.compare/drafts/' + comparisonKey(comparison.baseCommitOid, comparison.headCommitOid) + '.json',
    });

    const bytes = Buffer.from(`{\n  "comments": [], "summary": "", "revision": 0,\n  "comparison": ${JSON.stringify(comparison)}, "schemaVersion": 1\n}\n`, 'utf8');
    const root = await fixture(bytes);
    const state = await createDraftLoader({ repositoryRoot: root, comparison }).load();
    expect(state).toMatchObject({ kind: 'current', draft: { revision: 0, comments: [] } });
    expect(state.raw.equals(bytes)).toBe(true);
    expect(state.raw.length).toBe(bytes.length);
    expect(fingerprint(state.raw)).toBe(fingerprint(bytes));
  });

  test('keeps malformed bytes intact and fingerprints the original buffer', async () => {
    const bytes = Buffer.from('{"schemaVersion":1,\n\xff', 'binary');
    const state = await createDraftLoader({ repositoryRoot: await fixture(bytes), comparison }).load();
    expect(state).toMatchObject({ kind: 'malformed', fingerprint: fingerprint(bytes) });
    expect(state.raw.equals(bytes)).toBe(true);
    expect(state.raw.length).toBe(bytes.length);
    expect(state.detail.message.length).toBeLessThanOrEqual(160);
  });

  test.each([
    ['absent version', Buffer.from(JSON.stringify({ comparison, revision: 0, summary: '', comments: [] }))],
    ['noninteger version', current({ schemaVersion: 1.5 })],
    ['nonpositive version', current({ schemaVersion: 0 })],
    ['invalid current shape', current({ unknown: true })],
  ])('classifies %s as schema-invalid without altering bytes', async (_label, bytes) => {
    const state = await createDraftLoader({ repositoryRoot: await fixture(bytes), comparison }).load();
    expect(state).toMatchObject({ kind: 'schemaInvalid', fingerprint: fingerprint(bytes) });
    expect(state.raw.equals(bytes)).toBe(true);
    expect(state.details.length).toBeGreaterThan(0);
    expect(state.details.length).toBeLessThanOrEqual(8);
    expect(state.details.every((detail) => detail.message.length <= 160 && detail.path.length <= 160)).toBe(true);
  });

  test('recognizes a greater schema version before strict current parsing and retains raw bytes', async () => {
    const bytes = Buffer.from(JSON.stringify({ schemaVersion: 2, futureOnly: { preserve: ['all', 'unknown', 'fields'] } }), 'utf8');
    const state = await createDraftLoader({ repositoryRoot: await fixture(bytes), comparison }).load();
    expect(state).toMatchObject({ kind: 'newerUnsupported', foundVersion: 2, supportedVersion: 1 });
    expect(state.raw.equals(bytes)).toBe(true);
    expect('fingerprint' in state).toBe(false);
  });
});
