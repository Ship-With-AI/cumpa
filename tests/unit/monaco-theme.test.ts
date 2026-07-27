
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

const REQUIRED_COLORS = {
  'editor.background': '#0D1117',
  'editor.foreground': '#E6EDF3',
  'editorGutter.background': '#010409',
  'editorLineNumber.foreground': '#8B949E',
  'editorLineNumber.activeForeground': '#E6EDF3',
  'editorCursor.foreground': '#58A6FF',
  'editorWhitespace.foreground': '#484F5880',
  'editorIndentGuide.background1': '#21262D',
  'editorIndentGuide.activeBackground1': '#30363D',
  'editor.selectionBackground': '#388BFD59',
  'editor.inactiveSelectionBackground': '#388BFD40',
  'editor.selectionForeground': '#FFFFFF',
  'editor.lineHighlightBackground': '#00000000',
  'editor.lineHighlightBorder': '#484F58',
  'editorOverviewRuler.border': '#30363D',
  'diffEditor.insertedLineBackground': '#2EA04326',
  'diffEditor.removedLineBackground': '#F8514926',
  'diffEditor.insertedTextBackground': '#2EA04359',
  'diffEditor.removedTextBackground': '#F8514959',
  'diffEditor.insertedTextBorder': '#3FB950',
  'diffEditor.removedTextBorder': '#F85149',
  'diffEditorGutter.insertedLineBackground': '#2EA04326',
  'diffEditorGutter.removedLineBackground': '#F8514926',
  'diffEditorOverview.insertedForeground': '#3FB950',
  'diffEditorOverview.removedForeground': '#F85149',
  'diffEditor.border': '#30363D',
  'diffEditor.diagonalFill': '#010409',
  'diffEditor.unchangedCodeBackground': '#0D1117',
  'diffEditor.unchangedRegionBackground': '#161B22',
  'diffEditor.unchangedRegionForeground': '#A371F7',
  'diffEditor.unchangedRegionShadow': '#00000000',
  'editorWidget.background': '#21262D',
  'editorWidget.foreground': '#E6EDF3',
  'editorWidget.border': '#30363D',
  'editorHoverWidget.background': '#21262D',
  'editorHoverWidget.foreground': '#E6EDF3',
  'editorHoverWidget.border': '#30363D',
  focusBorder: '#58A6FF',
  'scrollbarSlider.background': '#30363D80',
  'scrollbarSlider.hoverBackground': '#484F58A6',
  'scrollbarSlider.activeBackground': '#484F58',
} as const;

const REQUIRED_RULES = {
  '': { foreground: 'E6EDF3' },
  source: { foreground: 'E6EDF3' },
  comment: { foreground: 'B1BAC4' },
  'comment.*': { foreground: 'B1BAC4' },
  keyword: { foreground: 'D2A8FF' },
  'keyword.*': { foreground: 'D2A8FF' },
  storage: { foreground: 'D2A8FF' },
  control: { foreground: 'D2A8FF' },
  string: { foreground: 'A5D6FF' },
  'string.*': { foreground: 'A5D6FF' },
  number: { foreground: 'F2CC60' },
  'number.*': { foreground: 'F2CC60' },
  'constant.numeric': { foreground: 'F2CC60' },
  'constant.language': { foreground: 'F2CC60' },
  'constant.character': { foreground: 'F2CC60' },
  type: { foreground: '79C0FF' },
  'type.*': { foreground: '79C0FF' },
  'type.identifier': { foreground: '79C0FF' },
  class: { foreground: '79C0FF' },
  interface: { foreground: '79C0FF' },
  namespace: { foreground: '79C0FF' },
  function: { foreground: 'E6EDF3' },
  'function.*': { foreground: 'E6EDF3' },
  method: { foreground: 'E6EDF3' },
  identifier: { foreground: 'E6EDF3' },
  variable: { foreground: 'E6EDF3' },
  property: { foreground: 'E6EDF3' },
  operator: { foreground: 'B1BAC4' },
  delimiter: { foreground: 'B1BAC4' },
  'delimiter.*': { foreground: 'B1BAC4' },
  punctuation: { foreground: 'B1BAC4' },
  tag: { foreground: 'D2A8FF' },
  'attribute.name': { foreground: 'A5D6FF' },
  invalid: { foreground: 'FFA198', fontStyle: 'underline' },
  'invalid.*': { foreground: 'FFA198', fontStyle: 'underline' },
} as const;


describe('diff-review Monaco theme', () => {
  it('pins the complete semantic theme contract', () => {
    expect(DIFF_REVIEW_THEME_ID).toBe('diff-review-dark');
    expect(DIFF_REVIEW_THEME.base).toBe('vs-dark');
    expect(DIFF_REVIEW_THEME.inherit).toBe(true);
    expect(DIFF_REVIEW_THEME.colors).toEqual(REQUIRED_COLORS);
    expect(Object.fromEntries(DIFF_REVIEW_THEME.rules.map((rule) => [rule.token, {
      foreground: rule.foreground,
      ...(rule.fontStyle === undefined ? {} : { fontStyle: rule.fontStyle }),
    }]))).toEqual(REQUIRED_RULES);
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
