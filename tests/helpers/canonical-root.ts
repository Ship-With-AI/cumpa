import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { parseTokenRoot } from '../../src/web/theme/token-contract.js';

export function independentRootCss(source: string): string {
  const root = source.indexOf(':root');
  const opening = source.indexOf('{', root);
  if (root === -1 || opening === -1) {
    throw new Error('src/web/styles.css must declare the canonical :root token block');
  }

  let depth = 1;
  for (let cursor = opening + 1; cursor < source.length; cursor += 1) {
    if (source.startsWith('/*', cursor)) {
      const closing = source.indexOf('*/', cursor + 2);
      if (closing === -1) throw new Error('unterminated CSS comment');
      cursor = closing + 1;
    } else if (source[cursor] === '"' || source[cursor] === "'") {
      const quote = source[cursor];
      for (cursor += 1; cursor < source.length && source[cursor] !== quote; cursor += 1) {
        if (source[cursor] === '\\') cursor += 1;
      }
      if (cursor === source.length) throw new Error('unterminated CSS string');
    } else if (source[cursor] === '{') {
      depth += 1;
    } else if (source[cursor] === '}' && --depth === 0) {
      return source.slice(opening + 1, cursor);
    }
  }

  throw new Error('unbalanced canonical :root token block');
}

export function canonicalRootCss(repositoryRoot: string): string {
  return independentRootCss(readFileSync(resolve(repositoryRoot, 'src/web/styles.css'), 'utf8'));
}

export function canonicalRoot(repositoryRoot: string) {
  return parseTokenRoot(canonicalRootCss(repositoryRoot));
}
