import { access, readdir, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';

const repositoryRoot = resolve(import.meta.dirname, '..');
const executablePath = resolve(repositoryRoot, 'dist/bin/compare.mjs');
const indexPath = resolve(repositoryRoot, 'dist/web/index.html');
const assetsPath = resolve(repositoryRoot, 'dist/web/assets');

await access(executablePath, constants.X_OK);

const index = await stat(indexPath);
if (!index.isFile() || index.size === 0) {
  throw new Error('Expected non-empty production web index.html');
}

const assets = await readdir(assetsPath, { withFileTypes: true });
const assetSizes = await Promise.all(
  assets
    .filter((entry) => entry.isFile())
    .map(async (entry) => (await stat(resolve(assetsPath, entry.name))).size),
);

if (!assetSizes.some((size) => size > 0)) {
  throw new Error('Expected at least one non-empty production web asset');
}

console.log('Production artifacts verified: executable CLI, web index, and assets.');
