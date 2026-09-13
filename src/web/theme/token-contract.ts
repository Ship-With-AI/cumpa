import {
  normalizeColor as normalizeColorValue,
  normalizeDeclaration as normalizeDeclarationValue,
  parseTokenRoot as parseTokenRootValue,
  resolveToken as resolveTokenValue,
} from '../../../scripts/css-token-contract.mjs';

export type TokenMap = ReadonlyMap<string, string>;

export const parseTokenRoot: (rootCss: string) => TokenMap = parseTokenRootValue;
export const resolveToken: (tokens: TokenMap, token: string) => string = resolveTokenValue;
export const normalizeColor: (value: string) => string | null = normalizeColorValue;
export const normalizeDeclaration: (value: string) => string = normalizeDeclarationValue;

export function toMonacoHex(tokens: TokenMap, token: string): string {
  const value = resolveToken(tokens, token);
  const color = normalizeColor(value);
  if (color === null) {
    throw new Error(`${token} must resolve to a canonical color, got ${value}`);
  }
  return color;
}

export function toCssRgb(tokens: TokenMap, token: string): string {
  const color = toMonacoHex(tokens, token);
  if (color.length !== 7) {
    throw new Error(`${token} must resolve to an opaque color, got ${resolveToken(tokens, token)}`);
  }

  return `rgb(${[color.slice(1, 3), color.slice(3, 5), color.slice(5, 7)]
    .map((channel) => Number.parseInt(channel, 16))
    .join(', ')})`;
}
