import { afterEach, describe, expect, test } from 'vitest';
import type { FastifyInstance } from 'fastify';

import type { PinnedComparison } from '../../src/contracts/comparison.js';
import { AttachedCompletionCoordinator } from '../../src/server/attached-completion.js';
import { createSessionApp } from '../../src/server/app.js';

const token = 'a'.repeat(43);
const host = '127.0.0.1:43132';
const headers = { host, origin: `http://${host}`, authorization: `Bearer ${token}` };
const apps = new Set<FastifyInstance>();

function comparison(): PinnedComparison {
  return {
    repositoryRoot: '/private/repository/attached-completion',
    objectFormat: 'sha1',
    base: { label: 'main', oid: '1'.repeat(40) },
    head: { label: 'feature', oid: '2'.repeat(40) },
    mergeBaseOid: '1'.repeat(40),
    range: {
      kind: 'revisions',
      requestedBase: 'main',
      requestedHead: 'feature',
      baseOid: '1'.repeat(40),
      headOid: '2'.repeat(40),
      pathspecs: [],
      reviewKey: 'f'.repeat(64),
    },
    changedFiles: [],
    hasCommittedChanges: false,
  };
}

afterEach(async () => {
  await Promise.all([...apps].map(async (app) => await app.close()));
  apps.clear();
});

describe('attached completion API', () => {
  test('exposes authenticated status and explicit one-shot Finish only for attached sessions', async () => {
    let deliveries = 0;
    const coordinator = new AttachedCompletionCoordinator();
    const app = createSessionApp(comparison(), {
      sessionToken: token,
      selectorDriftObserver: {
        observe: async () => ({
          base: { kind: 'unchanged', role: 'base' as const },
          head: { kind: 'unchanged', role: 'head' as const },
        }),
      },
      attachedCompletion: {
        coordinator,
        deliver: async () => {
          deliveries += 1;
        },
      },
    });
    apps.add(app);
    app.bindSessionSecurity({ expectedHost: host, expectedOrigin: `http://${host}` });

    const session = await app.inject({ method: 'GET', url: '/api/session', headers });
    expect(session.json()).toMatchObject({ attached: { kind: 'agent-review' } });
    await expect(app.inject({ method: 'GET', url: '/api/review-completion', headers })).resolves.toMatchObject({
      statusCode: 200,
      json: expect.any(Function),
    });
    await expect(app.inject({
      method: 'POST',
      url: '/api/review-completion/finish?unexpected=true',
      headers,
      payload: { expectedRevision: 0, extra: true },
    })).resolves.toMatchObject({ statusCode: 400 });
    const first = await app.inject({ method: 'POST', url: '/api/review-completion/finish', headers, payload: { expectedRevision: 0 } });
    expect(first.statusCode).toBe(201);
    expect(first.json()).toEqual({ kind: 'completed', revision: 0 });
    const duplicate = await app.inject({ method: 'POST', url: '/api/review-completion/finish', headers, payload: { expectedRevision: 0 } });
    expect(duplicate.statusCode).toBe(200);
    expect(duplicate.json()).toEqual({ kind: 'alreadyCompleted', revision: 0 });
    expect(deliveries).toBe(1);

    const ordinary = createSessionApp(comparison(), { sessionToken: token });
    apps.add(ordinary);
    ordinary.bindSessionSecurity({ expectedHost: host, expectedOrigin: `http://${host}` });
    await expect(ordinary.inject({ method: 'GET', url: '/api/review-completion', headers })).resolves.toMatchObject({ statusCode: 404 });
  });
});
