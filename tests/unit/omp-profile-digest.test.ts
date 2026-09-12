import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { captureOmpProfileDigest, changedOmpProfileEntries } from '../helpers/omp-profile.js';

const homes: string[] = [];

afterEach(() => {
  for (const home of homes.splice(0)) rmSync(home, { recursive: true, force: true });
});

function temporaryHome(): string {
  const home = mkdtempSync(join(tmpdir(), 'cumpa-omp-digest-'));
  homes.push(home);
  return home;
}

describe('real OMP profile digest', () => {
  it('does not conflate unrelated XDG sibling changes with OMP contamination', () => {
    const home = temporaryHome();
    const sibling = join(home, '.local', 'share', 'unrelated', 'state');
    mkdirSync(join(sibling, '..'), { recursive: true });
    writeFileSync(sibling, 'before');
    const before = captureOmpProfileDigest(home);
    writeFileSync(sibling, 'after');

    expect(captureOmpProfileDigest(home)).toEqual(before);
  });

  it('detects a change to an OMP-owned XDG directory', () => {
    const home = temporaryHome();
    const state = join(home, '.local', 'state', 'omp', 'state.json');
    mkdirSync(join(state, '..'), { recursive: true });
    writeFileSync(state, 'before');
    const before = captureOmpProfileDigest(home);
    writeFileSync(state, 'after');

    expect(captureOmpProfileDigest(home)).not.toEqual(before);
  });

  it('attributes changed OMP state to its guarded path', () => {
    const home = temporaryHome();
    const state = join(home, '.local', 'state', 'omp', 'state.json');
    mkdirSync(join(state, '..'), { recursive: true });
    writeFileSync(state, 'before');
    const before = captureOmpProfileDigest(home);
    writeFileSync(state, 'after');

    expect(changedOmpProfileEntries(before, captureOmpProfileDigest(home))).toEqual(['xdgState:state.json']);
  });
});
