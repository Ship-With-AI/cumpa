import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [category, ...arguments_] = process.argv.slice(2);
if (category === undefined) {
  throw new Error('Focused Vitest category is required');
}

const vitestArguments = ['run', category];
for (let index = 0; index < arguments_.length; index += 1) {
  const argument = arguments_[index];
  if (argument !== '--grep') {
    vitestArguments.push(argument);
    continue;
  }

  const pattern = arguments_[index + 1];
  if (pattern === undefined) {
    throw new Error('--grep requires a test-name pattern');
  }
  vitestArguments.push('--testNamePattern', pattern);
  index += 1;
}

const result = spawnSync(
  process.execPath,
  [
    fileURLToPath(new URL('../node_modules/vitest/vitest.mjs', import.meta.url)),
    ...vitestArguments,
  ],
  { stdio: 'inherit' },
);

if (result.error !== undefined) {
  throw result.error;
}
process.exitCode = result.status ?? 1;
