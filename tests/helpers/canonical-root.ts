import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { ROOT_DECLARATIONS } from '../../scripts/token-root-plugin.mjs';
import { parseTokenRoot } from '../../src/web/theme/token-contract.js';

export function canonicalRootCss(repositoryRoot: string): string {
  const source = readFileSync(resolve(repositoryRoot, 'src/web/styles.css'), 'utf8');
  const root = source.match(ROOT_DECLARATIONS)?.[1];
  if (root === undefined) {
    throw new Error('src/web/styles.css must declare the canonical :root token block');
  }
  return root;
}

export function canonicalRoot(repositoryRoot: string) {
  return parseTokenRoot(canonicalRootCss(repositoryRoot));
}
