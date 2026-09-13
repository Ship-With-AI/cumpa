export type CssDeclaration = Readonly<{ property: string; value: string }>;
export type CssBlock = Readonly<{ selector: string; body: string }>;
export type TokenMap = ReadonlyMap<string, string>;

export const CANONICAL_TOKENS: readonly string[];
export function skipCssStringOrComment(css: string, cursor: number): number;
export function cssBlocks(css: string): readonly CssBlock[];
export function selectorArms(selector: string): readonly string[];
export function cssDeclarations(body: string): readonly CssDeclaration[];
export function canonicalRootCss(css: string, label?: string): string;
export function parseTokenRoot(rootCss: string): TokenMap;
export function resolveToken(tokens: TokenMap, token: string): string;
export function normalizeColor(value: string): string | null;
export function normalizeDeclaration(value: string): string;
export function assertCanonicalTokenSet(tokens: TokenMap): void;
export function assertCanonicalTokenValues(tokens: TokenMap): void;
