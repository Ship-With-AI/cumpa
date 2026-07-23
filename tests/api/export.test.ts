import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { createSessionApp } from '../../src/server/app.js';

const token = 'a'.repeat(43);
const host = '127.0.0.1:43130';
const headers = { host, origin: `http://${host}`, authorization: `Bearer ${token}` };
const apps = new Set<FastifyInstance>();
const roots: string[] = [];

async function buildApp() {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'diff-review-export-api-'));
  roots.push(repositoryRoot);
  const revealDraftFile = vi.fn(async () => undefined);
  const app = createSessionApp({
    repositoryRoot,
    objectFormat: 'sha1',
    base: { label: 'base', oid: '1'.repeat(40) },
    head: { label: 'head', oid: '2'.repeat(40) },
    mergeBaseOid: '3'.repeat(40),
    changedFiles: [],
    hasCommittedChanges: true,
  }, { sessionToken: token, revealDraftFile });
  app.bindSessionSecurity({ expectedHost: host, expectedOrigin: `http://${host}` });
  apps.add(app);
  return { app, repositoryRoot, revealDraftFile };
}

async function writeCompleteExport(repositoryRoot: string): Promise<void> {
  const directory = join(repositoryRoot, '.diff-review', 'exports', `${'1'.repeat(40)}..${'2'.repeat(40)}`);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'review.json'), '{}');
  await writeFile(join(directory, 'review.md'), 'review\n');
}

afterEach(async () => {
  await Promise.all([...apps].map(async (app) => app.close()));
  apps.clear();
  await Promise.all(roots.splice(0).map(async (root) => rm(root, { recursive: true, force: true })));
});

describe('secured export and fixed export-directory reveal APIs', () => {
  test('refuses invalid export authority before any reveal-capability invocation', async () => {
    const { app, revealDraftFile } = await buildApp();
    for (const deniedHeaders of [
      { ...headers, authorization: `Bearer ${'z'.repeat(43)}` },
      { ...headers, host: 'localhost:43130' },
      { ...headers, origin: 'http://localhost:43130' },
    ]) {
      const response = await app.inject({ method: 'POST', url: '/api/export/reveal', headers: deniedHeaders });
      expect([401, 403]).toContain(response.statusCode);
      expect(revealDraftFile).not.toHaveBeenCalled();
    }
  });

  test('rejects export replacement authority and fixed reveal body, query, and wrong methods', async () => {
    const { app, repositoryRoot, revealDraftFile } = await buildApp();
    await writeCompleteExport(repositoryRoot);
    for (const request of [
      { method: 'POST' as const, url: '/api/export', payload: { expectedRevision: 0, path: '/tmp/evil' } },
      { method: 'POST' as const, url: '/api/export', payload: { expectedRevision: 0, content: 'evil' } },
      { method: 'POST' as const, url: '/api/export/reveal?path=/tmp/evil', payload: undefined },
      { method: 'POST' as const, url: '/api/export/reveal', payload: { path: '/tmp/evil' } },
      { method: 'GET' as const, url: '/api/export/reveal', payload: undefined },
    ]) {
      const response = await app.inject({ method: request.method, url: request.url, headers, payload: request.payload });
      expect([400, 404]).toContain(response.statusCode);
      expect(revealDraftFile).not.toHaveBeenCalled();
    }
  });

  test('reveals only the complete full-launch-OID export directory without leaking its absolute path', async () => {
    const { app, repositoryRoot, revealDraftFile } = await buildApp();
    await writeCompleteExport(repositoryRoot);

    const response = await app.inject({ method: 'POST', url: '/api/export/reveal', headers });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ kind: 'revealed' });
    expect(revealDraftFile).toHaveBeenCalledWith(join(repositoryRoot, '.diff-review', 'exports', `${'1'.repeat(40)}..${'2'.repeat(40)}`));
    expect(JSON.stringify(response.json())).not.toContain(repositoryRoot);
  });
});
