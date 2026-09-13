export type TokenMap = ReadonlyMap<string, string>;

const DECLARATION = /(--[\w-]+)\s*:\s*([^;]+);/gu;
const HEX_COLOR = /^#([\da-f]{6})$/iu;
const RGB_COLOR = /^rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*(\d+)%\)$/u;
const COLOR_IN_DECLARATION = /#[\da-f]{6}\b|rgb\(\d+\s+\d+\s+\d+\s*\/\s*\d+%\)/giu;

export function parseTokenRoot(rootCss: string): TokenMap {
  const entries = [...rootCss.matchAll(DECLARATION)].map(
    (match) => [match[1], match[2].trim()] as const,
  );
  const tokens = new Map(entries);

  if (tokens.size !== entries.length) {
    const names = new Set<string>();
    const duplicate = entries.find(([name]) => names.has(name) || !names.add(name))?.[0];
    throw new Error(`canonical root declares duplicate token ${duplicate}`);
  }

  return tokens;
}

export function resolveToken(tokens: TokenMap, token: string): string {
  const value = tokens.get(token);
  if (value === undefined) {
    throw new Error(`canonical root is missing ${token}`);
  }

  const alias = value.match(/^var\((--[\w-]+)\)$/u)?.[1];
  return alias === undefined ? value : resolveToken(tokens, alias);
}

export function normalizeColor(value: string): string | null {
  const hex = value.match(HEX_COLOR)?.[1];
  if (hex !== undefined) {
    return `#${hex.toLowerCase()}`;
  }

  const rgb = value.match(RGB_COLOR);
  if (rgb === null) {
    return null;
  }

  const [red, green, blue, alpha] = rgb.slice(1).map(Number);
  if ([red, green, blue].some((channel) => channel > 255) || alpha > 100) {
    return null;
  }

  return `#${[red, green, blue, Math.round((alpha / 100) * 255)]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;
}

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

export function normalizeDeclaration(value: string): string {
  return value.replace(COLOR_IN_DECLARATION, (color) => normalizeColor(color) ?? color);
}
