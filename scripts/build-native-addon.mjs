import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const nodeRoot = dirname(dirname(process.execPath));
const output = join(root, 'dist', 'native', 'directory_exchange.node');

mkdirSync(dirname(output), { recursive: true });
execFileSync('/usr/bin/c++', [
  '-std=c++20',
  '-dynamiclib',
  '-undefined',
  'dynamic_lookup',
  '-I',
  join(nodeRoot, 'include', 'node'),
  join(root, 'src', 'native', 'directory-exchange.cc'),
  '-o',
  output,
], { stdio: 'inherit' });
