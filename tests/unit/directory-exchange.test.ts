import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

import { afterEach, describe, expect, test } from 'vitest';

const require = createRequire(import.meta.url);
const roots: string[] = [];

type DirectoryExchangeAddon = Readonly<{
  probeDirectoryExchange(root: string): Readonly<{ kind: 'supported' | 'unsupported' }>;
}>;

async function buildAddon(): Promise<DirectoryExchangeAddon> {
  const root = await mkdtemp(join(tmpdir(), 'diff-review-native-exchange-'));
  roots.push(root);
  const source = join(process.cwd(), 'src/native/directory-exchange.cc');
  const output = join(root, 'directory_exchange.node');
  const nodeRoot = dirname(dirname(process.execPath));
  const build = spawnSync('/usr/bin/c++', [
    '-std=c++20',
    '-dynamiclib',
    '-undefined',
    'dynamic_lookup',
    '-I',
    join(nodeRoot, 'include', 'node'),
    source,
    '-o',
    output,
  ], { encoding: 'utf8' });

  expect(build.status, `${build.stdout}\n${build.stderr}`).toBe(0);
  return require(output) as DirectoryExchangeAddon;
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map(async (root) => rm(root, { recursive: true, force: true })));
});

describe('native directory exchange probe', () => {
  test('compiles the actual adapter and proves one complete sibling pair swaps without stable absence', async () => {
    const root = await mkdtemp(join(tmpdir(), 'diff-review-native-probe-'));
    roots.push(root);
    await cp(join(process.cwd(), 'tests', 'fixtures'), join(root, 'fixtures'), { recursive: true, force: true }).catch(() => undefined);

    const addon = await buildAddon();
    const result = addon.probeDirectoryExchange(root);

    if (process.platform === 'darwin') {
      expect(result).toEqual({ kind: 'supported' });
      expect(await readFile(join(root, 'stable', 'review.json'), 'utf8')).toBe('new-json');
      expect(await readFile(join(root, 'stable', 'review.md'), 'utf8')).toBe('new-markdown');
    } else {
      expect(result).toEqual({ kind: 'unsupported' });
    }
  });
});
