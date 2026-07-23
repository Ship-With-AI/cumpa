import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

import { ReviewExportV1Schema } from '../../src/contracts/draft.js';
import { canonicalizeReviewExport } from '../../src/export/review-export.js';
import { renderReviewMarkdown } from '../../src/export/render-review-markdown.js';
import { publishReviewExport } from '../../src/server/export-store.js';

const roots: string[] = [];
const baseOid = '1'.repeat(40);
const headOid = '2'.repeat(40);

async function root(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'diff-review-export-publication-'));
  roots.push(directory);
  return directory;
}

async function readStable(repositoryRoot: string): Promise<readonly [string, string]> {
  const stable = join(repositoryRoot, '.diff-review', 'exports', `${baseOid}..${headOid}`);
  return Promise.all([
    readFile(join(stable, 'review.json'), 'utf8'),
    readFile(join(stable, 'review.md'), 'utf8'),
  ]);
}

function candidatePair(kind: string): Readonly<{ readonly json: Buffer; readonly markdown: Buffer }> {
  const json = Buffer.from(
    canonicalizeReviewExport(
      ReviewExportV1Schema.parse({
        schemaVersion: 1,
        kind: 'diff-review/export',
        exportedAt: '2026-07-23T08:02:00.000Z',
        acceptedDraftRevision: 0,
        comparison: {
          selectedBase: { label: 'base', launchOid: baseOid },
          selectedHead: { label: 'head', launchOid: headOid },
          mergeBaseOid: '3'.repeat(40),
          comparisonKey: '4'.repeat(64),
        },
        drift: {
          observedAt: '2026-07-23T08:02:00.000Z',
          acknowledged: false,
          base: { launchOid: baseOid, currentOid: baseOid, status: 'unchanged' },
          head: { launchOid: headOid, currentOid: headOid, status: 'unchanged' },
        },
        summary: { markdown: kind },
        files: [],
        counts: { all: 0, openActionable: 0, openNeedsAttention: 0, resolved: 0 },
      }),
    ),
  );
  return Object.freeze({ json, markdown: Buffer.from(renderReviewMarkdown(json), 'utf8') });
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map(async (directory) => rm(directory, { recursive: true, force: true })));
});

describe('literal export publication state machine', () => {
  test('allows first export through one validated candidate-to-stable rename and returns only final exact-byte receipt evidence', async () => {
    const repositoryRoot = await root();

    const result = await publishReviewExport({
      repositoryRoot,
      baseOid,
      headOid,
      json: Buffer.from('{"kind":"new"}'),
      markdown: Buffer.from('# new\n'),
      reExportCapability: { kind: 'reExportUnsupported' },
    });

    expect(result.kind).toBe('exported');
    expect(await readStable(repositoryRoot)).toEqual(['{"kind":"new"}', '# new\n']);
    if (result.kind === 'exported') {
      expect(result.receipt.files.map((file) => file.path)).toEqual([
        `.diff-review/exports/${baseOid}..${headOid}/review.json`,
        `.diff-review/exports/${baseOid}..${headOid}/review.md`,
      ]);
      expect(result.receipt.files.every((file) => /^[0-9a-f]{64}$/u.test(file.sha256))).toBe(true);
    }
  });

  test('refuses an invalid candidate before it can become the stable pair', async () => {
    const repositoryRoot = await root();

    const result = await publishReviewExport({
      repositoryRoot,
      baseOid,
      headOid,
      json: Buffer.from('{"kind":"invalid"}'),
      markdown: Buffer.from('# invalid\n'),
      reExportCapability: { kind: 'reExportUnsupported' },
    });

    expect(result).toEqual({ kind: 'publicationFailed' });
  });

  test('refuses unsupported re-export before exchange or stable mutation while retaining the exact old pair', async () => {
    const repositoryRoot = await root();
    const stable = join(repositoryRoot, '.diff-review', 'exports', `${baseOid}..${headOid}`);
    await mkdir(stable, { recursive: true });
    await writeFile(join(stable, 'review.json'), '{"kind":"old"}');
    await writeFile(join(stable, 'review.md'), '# old\n');

    const result = await publishReviewExport({
      repositoryRoot,
      baseOid,
      headOid,
      json: Buffer.from('{"kind":"new"}'),
      markdown: Buffer.from('# new\n'),
      reExportCapability: { kind: 'reExportUnsupported' },
    });

    expect(result).toEqual({ kind: 'reExportUnsupported' });
    expect(await readStable(repositoryRoot)).toEqual(['{"kind":"old"}', '# old\n']);
  });
});
