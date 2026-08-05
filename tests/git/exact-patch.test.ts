import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { createGroundedExactPatch } from '../../src/git/exact-patch.js';
import {
  assertSourceControlUnchanged,
  captureSourceControlSnapshot,
} from '../helpers/source-control-snapshot.js';

const fixtures: string[] = [];

function git(cwd: string, arguments_: readonly string[]): Buffer {
  return execFileSync('git', ['--no-pager', ...arguments_], {
    cwd,
    encoding: 'buffer',
    env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_PAGER: 'cat', GIT_TERMINAL_PROMPT: '0' },
  });
}

async function fixture(): Promise<{ readonly root: string; readonly oldBytes: Buffer; readonly newBytes: Buffer; readonly oldOid: string; readonly newOid: string }> {
  const root = await mkdtemp(join(tmpdir(), 'compare-exact-patch-'));
  fixtures.push(root);
  git(root, ['init', '--quiet']);
  git(root, ['config', 'user.email', 'tests@example.com']);
  git(root, ['config', 'user.name', 'Compare tests']);

  const oldBytes = Buffer.from('first line\nlast line', 'utf8');
  const newBytes = Buffer.from('first line\nchanged line', 'utf8');
  await writeFile(join(root, 'notes.txt'), oldBytes);
  git(root, ['add', '--', 'notes.txt']);
  git(root, ['commit', '--quiet', '-m', 'base']);
  const oldOid = git(root, ['rev-parse', 'HEAD:notes.txt']).toString('ascii').trim();

  await writeFile(join(root, 'notes.txt'), newBytes);
  git(root, ['add', '--', 'notes.txt']);
  git(root, ['commit', '--quiet', '-m', 'implemented patch']);
  const newOid = git(root, ['rev-parse', 'HEAD:notes.txt']).toString('ascii').trim();
  return { root, oldBytes, newBytes, oldOid, newOid };
}

function patch(oldOid: string, newOid: string): string {
  return [
    'diff --git a/notes.txt b/notes.txt',
    `index ${oldOid}..${newOid} 100644`,
    '--- a/notes.txt',
    '+++ b/notes.txt',
    '@@ -1,2 +1,2 @@',
    ' first line',
    '-last line',
    '\\ No newline at end of file',
    '+changed line',
    '\\ No newline at end of file',
    '',
  ].join('\n');
}

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('read-only exact patch grounding', () => {
  it('grounds full-object preimages, exact in-memory postimages, digest, and metadata without mutating the repository', async () => {
    const source = await fixture();
    const content = patch(source.oldOid, source.newOid);
    const before = await captureSourceControlSnapshot(source.root);

    const grounded = await createGroundedExactPatch({
      cwd: source.root,
      patchContent: content,
      target: { kind: 'repository' },
    });

    const after = await captureSourceControlSnapshot(source.root);
    assertSourceControlUnchanged(before, after);
    expect(grounded.scope).toEqual({
      kind: 'exact-patch',
      digest: createHash('sha256').update(Buffer.from(content, 'utf8')).digest('hex'),
      validationTarget: { kind: 'repository' },
      submittedByteLength: Buffer.byteLength(content, 'utf8'),
    });
    expect(grounded.changedFiles).toHaveLength(1);
    const file = grounded.changedFiles[0]!;
    expect(file.oldBlobOid).toBe(source.oldOid);
    expect(file.newBlobOid).toBe(source.newOid);
    expect(file.oldPath?.utf8).toBe('notes.txt');
    expect(file.newPath?.utf8).toBe('notes.txt');
    expect(file.additions).toBe(1);
    expect(file.deletions).toBe(1);
    expect(grounded.contents.get(file.id)?.preimage).toEqual(source.oldBytes);
    expect(grounded.contents.get(file.id)?.postimage).toEqual(source.newBytes);
    expect(Object.isFrozen(grounded)).toBe(true);
    expect(Object.isFrozen(grounded.scope)).toBe(true);
    expect(Object.isFrozen(grounded.changedFiles)).toBe(true);
  });

  it('rejects an exact patch when the selected target differs by one byte and leaves the repository unchanged', async () => {
    const source = await fixture();
    const before = await captureSourceControlSnapshot(source.root);
    const content = patch(source.oldOid, source.newOid).replace('changed line', 'changed lime');

    await expect(
      createGroundedExactPatch({ cwd: source.root, patchContent: content, target: { kind: 'repository' } }),
    ).rejects.toMatchObject({ name: 'ExactPatchGroundingError', message: 'Patch does not match the selected target.' });

    assertSourceControlUnchanged(before, await captureSourceControlSnapshot(source.root));
  });
});
