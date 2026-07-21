import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, test, vi } from 'vitest';

import type { PinnedComparison } from '../../src/contracts/comparison.js';
import { comparisonKey } from '../../src/domain/comparison-key.js';
import { createSessionApp } from '../../src/server/app.js';

const token = 'a'.repeat(43);
const host = '127.0.0.1:43129';
const origin = `http://${host}`;
const fileId = `file_${'a'.repeat(43)}`;
const headers = { host, origin, authorization: `Bearer ${token}` };
const apps = new Set<FastifyInstance>();
const roots: string[] = [];

function exactPath(value: string) {
  return {
    utf8: value,
    display: value,
    bytesBase64url: Buffer.from(value, 'utf8').toString('base64url'),
  };
}

function comparison(root: string, baseOid = '1'.repeat(40), headOid = '2'.repeat(40)): PinnedComparison {
  return {
    repositoryRoot: root,
    objectFormat: 'sha1',
    base: { label: 'moving-base', oid: baseOid },
    head: { label: 'moving-head', oid: headOid },
    mergeBaseOid: '3'.repeat(40),
    changedFiles: [{
      id: fileId,
      status: { code: 'M', kind: 'modified', similarity: null },
      oldMode: '100644',
      newMode: '100644',
      oldBlobOid: '4'.repeat(40),
      newBlobOid: '5'.repeat(40),
      oldPath: exactPath('src/review.ts'),
      newPath: exactPath('src/review.ts'),
      additions: 1,
      deletions: 1,
      availability: { kind: 'text' },
    }],
    hasCommittedChanges: true,
  };
}

function buildApp(root: string, baseOid?: string, headOid?: string, onLookup?: (file: string) => void) {
  const app = createSessionApp(comparison(root, baseOid, headOid), {
    sessionToken: token,
    onCapabilityLookup: onLookup,
    objectReader: {
      inspect: async () => ({ kind: 'available' as const, objectType: 'blob', size: 12 }),
      read: async (oid: string) => ({
        kind: 'available' as const,
        bytes: Buffer.from(oid === '4'.repeat(40) ? 'before\n' : 'after\n'),
      }),
    },
  });
  apps.add(app);
  app.bindSessionSecurity({ expectedHost: host, expectedOrigin: origin });
  return app;
}

async function root(): Promise<string> {
  const value = await mkdtemp(join(tmpdir(), 'diff-review-draft-'));
  roots.push(value);
  return value;
}

afterEach(async () => {
  await Promise.all([...apps].map(async (app) => app.close()));
  apps.clear();
  await Promise.all(roots.splice(0).map(async (path) => rm(path, { recursive: true, force: true })));
});

describe('comparison-local draft routes', () => {
  test('returns an empty strict draft and resumes only the same selected pair', async () => {
    const repositoryRoot = await root();
    const first = buildApp(repositoryRoot);

    expect((await first.inject({ method: 'GET', url: '/api/draft', headers })).json()).toEqual({
      schemaVersion: 1,
      comparison: {
        baseCommitOid: '1'.repeat(40),
        headCommitOid: '2'.repeat(40),
        mergeBaseOid: '3'.repeat(40),
      },
      revision: 0,
      summary: '',
      comments: [],
    });

    const added = await first.inject({
      method: 'POST',
      url: '/api/draft/comments',
      headers,
      payload: { fileId, side: 'head', line: 1, body: 'Keep this exact line.' },
    });
    expect(added.statusCode).toBe(201);
    expect(added.json()).toMatchObject({ revision: 1, comment: { state: 'open', body: 'Keep this exact line.' } });

    const resumed = buildApp(repositoryRoot);
    expect((await resumed.inject({ method: 'GET', url: '/api/draft', headers })).json()).toMatchObject({
      revision: 1,
      comments: [{ state: 'open', body: 'Keep this exact line.', verification: { state: 'verified', reason: 'exact-match' } }],
    });

    const isolated = buildApp(repositoryRoot, '6'.repeat(40));
    expect((await isolated.inject({ method: 'GET', url: '/api/draft', headers })).json()).toMatchObject({ revision: 0, comments: [] });
  });

  test('stores only server-derived canonical records and rejects the exact side-specific duplicate', async () => {
    const app = buildApp(await root());
    const accepted = await app.inject({
      method: 'POST',
      url: '/api/draft/comments',
      headers,
      payload: { fileId, side: 'base', line: 1, body: 'Check the prior version.' },
    });
    expect(accepted.statusCode).toBe(201);
    expect(accepted.json()).toMatchObject({
      revision: 1,
      comment: {
        id: expect.any(String),
        state: 'open',
        body: 'Check the prior version.',
        anchor: { side: 'base', line: 1, blobOid: '4'.repeat(40), safeDisplayPath: 'src/review.ts' },
      },
    });

    const duplicate = await app.inject({
      method: 'POST',
      url: '/api/draft/comments',
      headers,
      payload: { fileId, side: 'base', line: 1, body: 'A different body cannot duplicate the anchor.' },
    });
    expect(duplicate.statusCode).toBe(409);

    const view = await app.inject({ method: 'GET', url: '/api/draft', headers });
    expect(view.json()).toMatchObject({ revision: 1, comments: [expect.objectContaining({ body: 'Check the prior version.' })] });
  });

  test('denies unauthenticated draft work before lookup and preserves invalid existing bytes', async () => {
    const repositoryRoot = await root();
    const onLookup = vi.fn();
    const app = buildApp(repositoryRoot, undefined, undefined, onLookup);
    const denied = await app.inject({
      method: 'GET',
      url: '/api/draft',
      headers: { ...headers, authorization: `Bearer ${'z'.repeat(43)}` },
    });
    expect(denied.statusCode).toBe(401);
    expect(onLookup).not.toHaveBeenCalled();

    const directory = join(repositoryRoot, '.diff-review', 'drafts');
    await mkdir(directory, { recursive: true });
    const file = join(
      directory,
      `${comparisonKey('1'.repeat(40), '2'.repeat(40))}.json`,
    );
    await writeFile(file, '{ invalid json');
    const invalid = await app.inject({ method: 'POST', url: '/api/draft/comments', headers, payload: { fileId, side: 'head', line: 1, body: 'do not overwrite' } });
    expect(invalid.statusCode).toBe(500);
    expect(await readFile(file, 'utf8')).toBe('{ invalid json');
  });
});
