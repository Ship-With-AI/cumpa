import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, test } from 'vitest';

import type { GroundedExactPatch } from '../../src/contracts/comparison.js';
import { createExactPatchSessionApp } from '../../src/server/app.js';

const token = 'p'.repeat(43);
const host = '127.0.0.1:43130';
const headers = {
  host,
  origin: `http://${host}`,
  authorization: `Bearer ${token}`,
};
const fileId = `file_${'p'.repeat(43)}`;
const unknownFileId = `file_${'z'.repeat(43)}`;
const apps = new Set<FastifyInstance>();
const roots: string[] = [];

function path(value: string) {
  return {
    bytesBase64url: Buffer.from(value).toString('base64url'),
    display: value,
    utf8: value,
  } as const;
}

function grounded(repositoryRoot = '/private/repository/never-on-the-wire'): GroundedExactPatch {
  const before = Buffer.from('before\n');
  const after = Buffer.from('after\n');
  return Object.freeze({
    repositoryRoot,
    objectFormat: 'sha1' as const,
    scope: Object.freeze({
      kind: 'exact-patch' as const,
      digest: 'a'.repeat(64),
      validationTarget: Object.freeze({ kind: 'repository' as const }),
      submittedByteLength: 42,
    }),
    changedFiles: Object.freeze([
      Object.freeze({
        id: fileId,
        status: Object.freeze({ code: 'R', kind: 'renamed' as const, similarity: 100 }),
        oldMode: '100644',
        newMode: '100755',
        oldBlobOid: '1'.repeat(40),
        newBlobOid: '2'.repeat(40),
        oldPath: path('old\u0000name.ts'),
        newPath: path('new-name.ts'),
        additions: 1,
        deletions: 1,
        availability: Object.freeze({ kind: 'text' as const }),
      }),
      Object.freeze({
        id: `file_${'q'.repeat(43)}`,
        status: Object.freeze({ code: 'A', kind: 'added' as const, similarity: null }),
        oldMode: '000000',
        newMode: '100644',
        oldBlobOid: '0'.repeat(40),
        newBlobOid: '3'.repeat(40),
        newPath: path('binary.bin'),
        additions: 0,
        deletions: 0,
        availability: Object.freeze({ kind: 'unsupported' as const, reason: 'binary' as const }),
      }),
    ]),
    contents: new Map([
      [fileId, Object.freeze({ preimage: before, postimage: after })],
      [`file_${'q'.repeat(43)}`, Object.freeze({ preimage: undefined, postimage: Buffer.from([0]) })],
    ]),
  });
}

async function root(): Promise<string> {
  const value = await mkdtemp(join(tmpdir(), 'compare-exact-patch-'));
  roots.push(value);
  return value;
}

async function buildApp(drifted = false) {
  const repositoryRoot = await root();
  const app = await createExactPatchSessionApp(grounded(repositoryRoot), {
    sessionToken: token,
    snapshotParent: repositoryRoot,
    observePatchTarget: async () => drifted,
  });
  app.bindSessionSecurity({ expectedHost: host, expectedOrigin: `http://${host}` });
  apps.add(app);
  return app;
}

afterEach(async () => {
  await Promise.all([...apps].map(async (app) => app.close()));
  apps.clear();
  await Promise.all(roots.splice(0).map(async (value) => rm(value, { recursive: true, force: true })));
});

describe('exact patch snapshot sessions', () => {
  test('serves a strict patch-only frozen session and content across reload-like reads', async () => {
    const repositoryRoot = await root();
    const source = grounded(repositoryRoot);
    const app = await createExactPatchSessionApp(source, { sessionToken: token, snapshotParent: repositoryRoot });
    app.bindSessionSecurity({ expectedHost: host, expectedOrigin: `http://${host}` });
    apps.add(app);
    source.contents.get(fileId)!.preimage!.fill(0x78);
    source.contents.get(fileId)!.postimage!.fill(0x79);

    const session = await app.inject({ method: 'GET', url: '/api/session', headers });
    expect(session.statusCode).toBe(200);
    expect(session.json()).toMatchObject({
      patch: {
        kind: 'exact-patch',
        digest: 'a'.repeat(64),
        validationTarget: { kind: 'repository' },
        changedFileCount: 2,
      },
      files: [{ fileId }, { fileId: `file_${'q'.repeat(43)}` }],
    });
    expect(Object.keys(session.json() as object)).toEqual(['patch', 'files']);

    for (let index = 0; index < 2; index += 1) {
      const content = await app.inject({ method: 'GET', url: `/api/files/${fileId}/content`, headers });
      expect(content.statusCode).toBe(200);
      expect(content.json()).toMatchObject({
        fileId,
        base: { exists: true, text: 'before\n' },
        head: { exists: true, text: 'after\n' },
      });
    }
  });

  test('latches drift while frozen content and draft mutations remain available', async () => {
    const app = await buildApp(true);
    const status = await app.inject({ method: 'GET', url: '/api/patch-status', headers });
    expect(status.statusCode).toBe(200);
    expect(status.json()).toEqual({ kind: 'drifted', validationTargetLabel: 'Repository content' });
    expect((await app.inject({ method: 'GET', url: '/api/patch-status', headers })).json()).toEqual(status.json());
    expect((await app.inject({ method: 'GET', url: `/api/files/${fileId}/content`, headers })).statusCode).toBe(200);
    expect((await app.inject({
      method: 'POST',
      url: '/api/draft/mutations',
      headers,
      payload: { type: 'setSummary', expectedRevision: 0, markdown: 'Frozen feedback.' },
    })).statusCode).toBe(200);
  });

  test('latches snapshot loss and blocks frozen content without rebuilding from the repository', async () => {
    const repositoryRoot = await root();
    const app = await createExactPatchSessionApp(grounded(repositoryRoot), {
      sessionToken: token,
      snapshotParent: repositoryRoot,
    });
    app.bindSessionSecurity({ expectedHost: host, expectedOrigin: `http://${host}` });
    apps.add(app);
    const snapshotRoot = (await readdir(repositoryRoot)).find((name) => name.startsWith('compare-patch-'));
    expect(snapshotRoot).toBeDefined();
    await rm(join(repositoryRoot, snapshotRoot!), { recursive: true, force: true });

    expect((await app.inject({ method: 'GET', url: '/api/patch-status', headers })).json()).toEqual({ kind: 'snapshotUnavailable' });
    expect((await app.inject({ method: 'GET', url: `/api/files/${fileId}/content`, headers })).statusCode).toBe(500);
  });

  test('keeps snapshot capabilities session-local and rejects unauthenticated file and status access', async () => {
    const first = await buildApp();
    const second = await buildApp();
    expect((await first.inject({ method: 'GET', url: `/api/files/${unknownFileId}/content`, headers })).statusCode).toBe(404);
    expect((await second.inject({ method: 'GET', url: `/api/files/${unknownFileId}/content`, headers })).statusCode).toBe(404);
    expect([401, 403]).toContain((await first.inject({ method: 'GET', url: `/api/files/${fileId}/content` })).statusCode);
    expect([401, 403]).toContain((await first.inject({ method: 'GET', url: '/api/patch-status' })).statusCode);
  });
});
