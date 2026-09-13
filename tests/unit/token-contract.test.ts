import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';
import { TOKEN_ROOT_CSS } from 'virtual:cumpa-tokens';

import { canonicalRoot } from '../helpers/canonical-root.js';
import {
  normalizeColor,
  normalizeDeclaration,
  parseTokenRoot,
  resolveToken,
  toCssRgb,
  toMonacoHex,
} from '../../src/web/theme/token-contract.js';

const root = `
  color-scheme: dark;
  --opaque: #A7B1BD;
  --translucent: rgb(46 160 67 / 45%);
  --faint: rgb(248 81 73 / 22%);
  --alias-one: var(--alias-two);
  --alias-two: var(--opaque);
  --font: -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--opaque);
`;

describe('token contract', () => {
  it('parses custom properties and resolves aliases', () => {
    const tokens = parseTokenRoot(root);

    expect([...tokens]).toEqual([
      ['--opaque', '#A7B1BD'],
      ['--translucent', 'rgb(46 160 67 / 45%)'],
      ['--faint', 'rgb(248 81 73 / 22%)'],
      ['--alias-one', 'var(--alias-two)'],
      ['--alias-two', 'var(--opaque)'],
      ['--font', '-apple-system, BlinkMacSystemFont, sans-serif'],
    ]);
    expect(resolveToken(tokens, '--alias-one')).toBe('#A7B1BD');
  });

  it('normalizes only supported color notations to lowercase bytes', () => {
    expect(normalizeColor('#A7B1BD')).toBe('#a7b1bd');
    expect(normalizeColor('rgb(46 160 67 / 45%)')).toBe('#2ea04373');
    expect(normalizeColor('rgb(248 81 73 / 22%)')).toBe('#f8514938');
    expect(normalizeColor('14px')).toBeNull();
  });

  it('formats Monaco and Chromium color spellings from resolved tokens', () => {
    const tokens = parseTokenRoot(root);

    expect(toMonacoHex(tokens, '--alias-one')).toBe('#a7b1bd');
    expect(toMonacoHex(tokens, '--translucent')).toBe('#2ea04373');
    expect(toCssRgb(tokens, '--opaque')).toBe('rgb(167, 177, 189)');
  });

  it('rejects duplicate, absent, and non-color tokens by name', () => {
    expect(() => parseTokenRoot('--opaque: #ffffff; --opaque: #000000;')).toThrow('--opaque');

    const tokens = parseTokenRoot(root);
    expect(() => resolveToken(tokens, '--missing')).toThrow('--missing');
    expect(() => toMonacoHex(tokens, '--font')).toThrow('--font');
  });

  it('normalizes colors within composite declarations only', () => {
    expect(normalizeDeclaration('0 8px 24px rgb(1 4 9 / 68%)')).toBe('0 8px 24px #010409ad');
  });
  it('agrees on the canonical root from build and filesystem readers', () => {
    const repositoryRoot = resolve(import.meta.dirname, '../..');
    const buildTokens = parseTokenRoot(TOKEN_ROOT_CSS);
    const filesystemTokens = canonicalRoot(repositoryRoot);

    expect(buildTokens.size).toBeGreaterThan(0);
    expect(filesystemTokens.size).toBeGreaterThan(0);
    expect(buildTokens).toEqual(filesystemTokens);
  });

});
