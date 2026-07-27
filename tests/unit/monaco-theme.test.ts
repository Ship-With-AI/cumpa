import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

const { defineTheme, setTheme } = vi.hoisted(() => ({
  defineTheme: vi.fn(),
  setTheme: vi.fn(),
}));

vi.mock('monaco-editor', () => ({
  editor: { defineTheme, setTheme },
}));

import {
  applyDiffReviewTheme,
  DIFF_REVIEW_THEME,
  DIFF_REVIEW_THEME_ID,
} from '../../src/web/monaco/theme.js';

type RootMapping = Readonly<{ token: string; alpha?: number }>;

const THEME_COLOR_ROOT_MAP: Readonly<Record<string, RootMapping>> = {
  'editor.background': { token: '--surface-canvas' },
  'editor.foreground': { token: '--text-primary' },
  'editorGutter.background': { token: '--surface-inset' },
  'editorLineNumber.foreground': { token: '--text-muted' },
  'editorLineNumber.activeForeground': { token: '--text-primary' },
  'editorCursor.foreground': { token: '--focus-ring' },
  'editorWhitespace.foreground': { token: '--border-strong', alpha: 0.5 },
  'editorIndentGuide.background1': { token: '--border-muted' },
  'editorIndentGuide.activeBackground1': { token: '--border-default' },
  'editor.selectionBackground': { token: '--selection-background' },
  'editor.inactiveSelectionBackground': { token: '--selection-background', alpha: 0.25 },
  'editor.selectionForeground': { token: '--text-on-emphasis' },
  'editor.lineHighlightBorder': { token: '--border-strong' },
  'editorOverviewRuler.border': { token: '--border-default' },
  'diffEditor.insertedLineBackground': { token: '--diff-addition-background' },
  'diffEditor.removedLineBackground': { token: '--diff-deletion-background' },
  'diffEditor.insertedTextBackground': { token: '--diff-addition-intraline-background' },
  'diffEditor.removedTextBackground': { token: '--diff-deletion-intraline-background' },
  'diffEditor.insertedTextBorder': { token: '--diff-addition-foreground' },
  'diffEditor.removedTextBorder': { token: '--diff-deletion-foreground' },
  'diffEditorGutter.insertedLineBackground': { token: '--diff-addition-background' },
  'diffEditorGutter.removedLineBackground': { token: '--diff-deletion-background' },
  'diffEditorOverview.insertedForeground': { token: '--diff-addition-foreground' },
  'diffEditorOverview.removedForeground': { token: '--diff-deletion-foreground' },
  'diffEditor.border': { token: '--diff-region-border' },
  'diffEditor.diagonalFill': { token: '--diff-empty-background' },
  'diffEditor.unchangedCodeBackground': { token: '--surface-canvas' },
  'diffEditor.unchangedRegionBackground': { token: '--surface-panel' },
  'diffEditor.unchangedRegionForeground': { token: '--diff-hunk-foreground' },
  'editorWidget.background': { token: '--surface-interactive' },
  'editorWidget.foreground': { token: '--text-primary' },
  'editorWidget.border': { token: '--border-default' },
  'editorHoverWidget.background': { token: '--surface-interactive' },
  'editorHoverWidget.foreground': { token: '--text-primary' },
  'editorHoverWidget.border': { token: '--border-default' },
  focusBorder: { token: '--focus-ring' },
  'scrollbarSlider.background': { token: '--border-default', alpha: 0.5 },
  'scrollbarSlider.hoverBackground': { token: '--border-strong', alpha: 0.65 },
  'scrollbarSlider.activeBackground': { token: '--border-strong' },
};

const UNPAINTED_THEME_COLORS = {
  'editor.lineHighlightBackground': '#00000000',
  'diffEditor.unchangedRegionShadow': '#00000000',
} as const;

const TOKEN_ROOT_MAP: Readonly<Record<string, Readonly<{ token: string; fontStyle?: string }>>> = {
  '': { token: '--text-primary' },
  source: { token: '--text-primary' },
  comment: { token: '--text-secondary' },
  'comment.*': { token: '--text-secondary' },
  keyword: { token: '--syntax-keyword-foreground' },
  'keyword.*': { token: '--syntax-keyword-foreground' },
  storage: { token: '--syntax-keyword-foreground' },
  control: { token: '--syntax-keyword-foreground' },
  string: { token: '--syntax-string-foreground' },
  'string.*': { token: '--syntax-string-foreground' },
  number: { token: '--syntax-number-foreground' },
  'number.*': { token: '--syntax-number-foreground' },
  'constant.numeric': { token: '--syntax-number-foreground' },
  'constant.language': { token: '--syntax-number-foreground' },
  'constant.character': { token: '--syntax-number-foreground' },
  type: { token: '--syntax-type-foreground' },
  'type.*': { token: '--syntax-type-foreground' },
  'type.identifier': { token: '--syntax-type-foreground' },
  class: { token: '--syntax-type-foreground' },
  interface: { token: '--syntax-type-foreground' },
  namespace: { token: '--syntax-type-foreground' },
  function: { token: '--text-primary' },
  'function.*': { token: '--text-primary' },
  method: { token: '--text-primary' },
  identifier: { token: '--text-primary' },
  variable: { token: '--text-primary' },
  property: { token: '--text-primary' },
  operator: { token: '--text-secondary' },
  delimiter: { token: '--text-secondary' },
  'delimiter.*': { token: '--text-secondary' },
  punctuation: { token: '--text-secondary' },
  tag: { token: '--syntax-keyword-foreground' },
  'attribute.name': { token: '--syntax-string-foreground' },
  invalid: { token: '--syntax-invalid-foreground', fontStyle: 'underline' },
  'invalid.*': { token: '--syntax-invalid-foreground', fontStyle: 'underline' },
};

function rootTokens(): ReadonlyMap<string, string> {
  const source = readFileSync(resolve(import.meta.dirname, '../../src/web/styles.css'), 'utf8');
  const root = source.match(/:root\s*\{([\s\S]*?)\}/u)?.[1];
  if (root === undefined) throw new Error('styles.css must declare the canonical :root token block');
  return new Map([...root.matchAll(/(--[\w-]+):\s*([^;]+);/gu)].map((match) => [match[1], match[2].trim()]));
}

function rootColor(tokens: ReadonlyMap<string, string>, token: string): string {
  const value = tokens.get(token);
  if (value === undefined) throw new Error(`canonical root is missing ${token}`);
  const alias = value.match(/^var\((--[\w-]+)\)$/u)?.[1];
  return alias === undefined ? value : rootColor(tokens, alias);
}

function themeHex(tokens: ReadonlyMap<string, string>, mapping: RootMapping): string {
  const value = rootColor(tokens, mapping.token);
  const hex = value.match(/^#([0-9A-F]{6})$/iu)?.[1];
  if (hex !== undefined) {
    return `#${hex.toUpperCase()}${mapping.alpha === undefined ? '' : Math.round(mapping.alpha * 255).toString(16).padStart(2, '0').toUpperCase()}`;
  }
  const rgb = value.match(/^rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*(\d+)%\)$/u);
  if (rgb === null) throw new Error(`${mapping.token} must resolve to a canonical RGB or hex color`);
  const alpha = mapping.alpha ?? Number(rgb[4]) / 100;
  return `#${[rgb[1], rgb[2], rgb[3]].map((part) => Number(part).toString(16).padStart(2, '0').toUpperCase()).join('')}${Math.round(alpha * 255).toString(16).padStart(2, '0').toUpperCase()}`;
}

describe('diff-review Monaco theme', () => {
  it('maps every semantic Monaco color and token foreground to the canonical root bytes', () => {
    const tokens = rootTokens();
    const colors = DIFF_REVIEW_THEME.colors;
    const mappedKeys = Object.keys(THEME_COLOR_ROOT_MAP).sort();
    expect(Object.keys(colors).filter((key) => !(key in UNPAINTED_THEME_COLORS)).sort()).toEqual(mappedKeys);

    for (const [color, mapping] of Object.entries(THEME_COLOR_ROOT_MAP)) {
      expect(colors[color as keyof typeof colors]).toBe(themeHex(tokens, mapping));
    }
    expect(Object.fromEntries(Object.entries(UNPAINTED_THEME_COLORS).map(([color, value]) => [color, colors[color as keyof typeof colors]]))).toEqual(UNPAINTED_THEME_COLORS);

    const rules = new Map(DIFF_REVIEW_THEME.rules.map((rule) => [rule.token, rule]));
    expect([...rules.keys()].sort()).toEqual(Object.keys(TOKEN_ROOT_MAP).sort());
    for (const [scope, mapping] of Object.entries(TOKEN_ROOT_MAP)) {
      const rule = rules.get(scope);
      expect(rule?.foreground).toBe(themeHex(tokens, { token: mapping.token }).slice(1));
      expect(rule?.fontStyle).toBe(mapping.fontStyle);
    }
  });

  it('redefines then selects the stable theme on every invocation', () => {
    applyDiffReviewTheme();
    applyDiffReviewTheme();

    expect(defineTheme).toHaveBeenNthCalledWith(1, DIFF_REVIEW_THEME_ID, DIFF_REVIEW_THEME);
    expect(setTheme).toHaveBeenNthCalledWith(1, DIFF_REVIEW_THEME_ID);
    expect(defineTheme).toHaveBeenNthCalledWith(2, DIFF_REVIEW_THEME_ID, DIFF_REVIEW_THEME);
    expect(setTheme).toHaveBeenNthCalledWith(2, DIFF_REVIEW_THEME_ID);
    expect(defineTheme.mock.invocationCallOrder[0]).toBeLessThan(setTheme.mock.invocationCallOrder[0]);
    expect(defineTheme.mock.invocationCallOrder[1]).toBeLessThan(setTheme.mock.invocationCallOrder[1]);
  });
});
