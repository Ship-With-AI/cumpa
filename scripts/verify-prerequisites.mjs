import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const approvedDependencies = new Map([
  ['@fastify/static', '9.3.0'],
  ['@inquirer/search', '4.2.1'],
  ['@playwright/test', '1.61.1'],
  ['@types/node', '24.11.1'],
  ['@vitejs/plugin-vue', '6.0.7'],
  ['commander', '15.0.0'],
  ['fastify', '5.10.0'],
  ['monaco-editor', '0.55.1'],
  ['open', '11.0.0'],
  ['typescript', '7.0.2'],
  ['vite', '8.1.4'],
  ['vitest', '4.1.10'],
  ['vue', '3.5.39'],
  ['vue-tsc', '3.3.7'],
  ['zod', '4.4.3'],
]);

const nodeMajor = Number.parseInt(process.versions.node.split('.')[0] ?? '', 10);
if (nodeMajor < 24) {
  throw new Error(`Node.js 24 or newer is required; found ${process.version}`);
}

const repositoryRoot = resolve(import.meta.dirname, '..');
const packageJson = JSON.parse(
  await readFile(resolve(repositoryRoot, 'package.json'), 'utf8'),
);
const configuredDependencies = new Map(
  Object.entries({
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }),
);

if (configuredDependencies.size !== approvedDependencies.size) {
  throw new Error(
    `Expected exactly ${approvedDependencies.size} approved direct dependencies; found ${configuredDependencies.size}`,
  );
}

for (const [name, version] of approvedDependencies) {
  if (configuredDependencies.get(name) !== version) {
    throw new Error(
      `Expected approved exact release ${name}@${version}; found ${configuredDependencies.get(name) ?? 'missing'}`,
    );
  }
}

execFileSync('git', ['--version'], { stdio: 'pipe' });
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
execFileSync(npmCommand, ['ls', '--depth=0'], {
  cwd: repositoryRoot,
  stdio: 'pipe',
});

console.log(
  `Prerequisites verified: ${process.version}, Git available, and 15 approved exact releases installed.`,
);
