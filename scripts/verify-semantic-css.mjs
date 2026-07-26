import { readFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';

const repositoryRoot = resolve(import.meta.dirname, '..');
const sourcePath = resolve(repositoryRoot, 'src/web/styles.css');
const outputRoot = resolve(repositoryRoot, 'dist/web');
const indexPath = resolve(outputRoot, 'index.html');

const canonicalTokens = [
  '--surface-canvas', '--surface-inset', '--surface-panel', '--surface-raised',
  '--surface-interactive', '--surface-interactive-hover', '--surface-interactive-active',
  '--text-primary', '--text-secondary', '--text-muted', '--text-on-emphasis',
  '--border-muted', '--border-default', '--border-strong', '--interactive-accent',
  '--interactive-accent-emphasis', '--focus-ring', '--selection-background',
  '--selection-border', '--destructive-foreground', '--destructive-emphasis',
  '--status-success-foreground', '--status-success-background', '--status-warning-foreground',
  '--status-warning-background', '--status-error-foreground', '--status-error-background',
  '--status-information-foreground', '--status-information-background',
  '--status-resolved-foreground', '--status-resolved-background', '--status-pending-foreground',
  '--status-pending-background', '--status-disabled-foreground', '--status-disabled-background',
  '--diff-addition-foreground', '--diff-addition-background', '--diff-addition-intraline-background',
  '--diff-deletion-foreground', '--diff-deletion-background', '--diff-deletion-intraline-background',
  '--diff-hunk-foreground', '--diff-hunk-background', '--diff-empty-background',
  '--diff-unchanged-background', '--diff-region-border', '--font-ui', '--font-mono',
  '--font-size-metadata', '--line-height-metadata', '--font-size-body', '--line-height-body',
  '--font-size-section-heading', '--line-height-section-heading', '--font-size-page-heading',
  '--line-height-page-heading', '--font-weight-regular', '--font-weight-semibold',
  '--radius-compact', '--radius-control', '--radius-overlay', '--radius-pill', '--shadow-overlay',
  '--space-xs', '--space-sm', '--space-md', '--space-lg', '--space-xl', '--space-2xl', '--space-3xl',
];

const expectedValues = new Map([
  ['--surface-canvas', '#0D1117'], ['--surface-inset', '#010409'], ['--surface-panel', '#161B22'],
  ['--surface-raised', '#21262D'], ['--surface-interactive', '#21262D'],
  ['--surface-interactive-hover', '#292E36'], ['--surface-interactive-active', '#30363D'],
  ['--text-primary', '#E6EDF3'], ['--text-secondary', '#B1BAC4'], ['--text-muted', '#8B949E'],
  ['--text-on-emphasis', '#FFFFFF'], ['--border-muted', '#21262D'], ['--border-default', '#30363D'],
  ['--border-strong', '#484F58'], ['--interactive-accent', '#2F81F7'],
  ['--interactive-accent-emphasis', '#1F6FEB'], ['--focus-ring', '#58A6FF'],
  ['--selection-background', 'rgb(56 139 253 / 35%)'], ['--selection-border', '#58A6FF'],
  ['--destructive-foreground', '#F85149'], ['--destructive-emphasis', '#B62324'],
  ['--status-success-foreground', '#3FB950'], ['--status-success-background', 'rgb(46 160 67 / 15%)'],
  ['--status-warning-foreground', '#D29922'], ['--status-warning-background', 'rgb(187 128 9 / 15%)'],
  ['--status-error-foreground', '#F85149'], ['--status-error-background', 'rgb(248 81 73 / 15%)'],
  ['--status-information-foreground', '#58A6FF'], ['--status-information-background', 'rgb(56 139 253 / 15%)'],
  ['--status-resolved-foreground', '#A371F7'], ['--status-resolved-background', 'rgb(163 113 247 / 15%)'],
  ['--status-pending-foreground', '#B1BAC4'], ['--status-pending-background', '#21262D'],
  ['--status-disabled-foreground', '#8B949E'], ['--status-disabled-background', '#161B22'],
  ['--diff-addition-foreground', '#3FB950'], ['--diff-addition-background', 'rgb(46 160 67 / 15%)'],
  ['--diff-addition-intraline-background', 'rgb(46 160 67 / 35%)'],
  ['--diff-deletion-foreground', '#F85149'], ['--diff-deletion-background', 'rgb(248 81 73 / 15%)'],
  ['--diff-deletion-intraline-background', 'rgb(248 81 73 / 35%)'],
  ['--diff-hunk-foreground', '#A371F7'], ['--diff-hunk-background', 'rgb(163 113 247 / 15%)'],
  ['--diff-empty-background', 'var(--surface-inset)'], ['--diff-unchanged-background', 'var(--surface-inset)'],
  ['--diff-region-border', 'var(--border-default)'], ['--shadow-overlay', '0 8px 24px rgb(0 0 0 / 40%)'],
]);

function fail(message) {
  throw new Error(`Semantic CSS audit failed: ${message}`);
}

function declarations(body) {
  return [...body.matchAll(/([\w-]+)\s*:\s*([^;{}]+);/g)].map(([, property, value]) => ({
    property,
    value: value.trim(),
  }));
}

function leafRules(css, context = []) {
  const rules = [];
  let cursor = 0;
  while (cursor < css.length) {
    const opening = css.indexOf('{', cursor);
    if (opening === -1) break;
    const selector = css.slice(cursor, opening).trim();
    let depth = 1;
    let closing = opening + 1;
    while (closing < css.length && depth > 0) {
      if (css[closing] === '{') depth += 1;
      if (css[closing] === '}') depth -= 1;
      closing += 1;
    }
    if (depth !== 0) fail(`unbalanced rule near ${selector}`);
    const body = css.slice(opening + 1, closing - 1);
    if (selector.startsWith('@media')) {
      rules.push(...leafRules(body, [...context, selector]));
    } else if (!selector.startsWith('@keyframes')) {
      rules.push({ selector, body, declarations: declarations(body), context });
    }
    cursor = closing;
  }
  return rules;
}

function rootRule(css, label, tokenBearing = false) {
  const roots = leafRules(css).filter((rule) => rule.selector === ':root'
    && rule.context.length === 0
    && (!tokenBearing || rule.declarations.some(({ property }) => property === '--surface-canvas')));
  if (roots.length !== 1) fail(`${label} must contain exactly one ${tokenBearing ? 'canonical token-bearing ' : 'document-foundation '}:root; found ${roots.length}`);
  return roots[0];
}

function assertTokenRoot(rule, label, exact) {
  const tokenDeclarations = rule.declarations.filter(({ property }) => property.startsWith('--'));
  const names = tokenDeclarations.map(({ property }) => property);
  const uniqueNames = new Set(names);
  if (uniqueNames.size !== names.length) fail(`${label} token root declares a token more than once`);
  for (const token of canonicalTokens) {
    if (!uniqueNames.has(token)) fail(`${label} token root is missing ${token}`);
  }
  if (exact && (uniqueNames.size !== canonicalTokens.length || names.some((name) => !canonicalTokens.includes(name)))) {
    fail(`${label} token root contains a non-canonical custom property`);
  }
  if (names.filter((name) => name === '--text-muted').length !== 1) {
    fail(`${label} token root must declare --text-muted exactly once`);
  }
}

function assertExpectedValues(rule) {
  const values = new Map(rule.declarations.map(({ property, value }) => [property, value]));
  for (const [token, expected] of expectedValues) {
    if (values.get(token) !== expected) fail(`source token ${token} must equal ${expected}`);
  }
}

function assertNoLegacy(css, label) {
  const legacy = /(?<![\w-])--(?:canvas|panel|accent|destructive|surface|text|rule|addition-(?:bg|fg)|deletion-(?:bg|fg)|warning-(?:bg|fg)|info-(?:bg|fg)|error-(?:bg|fg))(?![\w-])|(?<![\w-])--color-[\w-]+/g;
  const match = css.match(legacy);
  if (match !== null) fail(`${label} still references retired token ${match[0]}`);
}

function assertAuthorStyle(source) {
  if (/@import\b|url\(\s*(?:['"]?https?:|['"]?\/\/)|(?:repeating-)?(?:linear|radial|conic)-gradient\(|backdrop-filter\s*:|text-shadow\s*:|filter\s*:\s*drop-shadow\(/i.test(source)) {
    fail('source contains an import, remote URL, gradient, glow, glass, or drop shadow');
  }
  const forcedStart = source.indexOf('@media (forced-colors: active)');
  if (forcedStart === -1 || forcedStart < source.lastIndexOf('@media (prefers-reduced-motion: reduce)')) {
    fail('forced-colors repair must be one terminal media block');
  }
  const ordinary = source.slice(0, forcedStart);
  const systemKeyword = /\b(?:Canvas|CanvasText|ButtonFace|ButtonText|ButtonBorder|LinkText|Highlight|HighlightText|GrayText)\b/;
  if (systemKeyword.test(ordinary)) fail('system colors are only allowed in the forced-colors repair block');

  for (const rule of leafRules(ordinary)) {
    const hasColorLiteral = /#[0-9a-f]{3,8}\b|\b(?:rgb|hsl)a?\(/i.test(rule.body);
    if (hasColorLiteral && rule.selector !== ':root') fail(`raw color literal outside the token root in ${rule.selector}`);
  }

  const insetAllowlist = new Map([
    ['.tree-row--selected', 'inset 3px 0 var(--selection-border)'],
    ['.view-tab[aria-selected="true"]', 'inset 0 -3px var(--selection-border)'],
  ]);
  const overlayAllowlist = new Set([
    '.identity-panel', '.keyboard-help', '.ui-tooltip__content', '.diff-workspace__gutter-action::after',
    '.comments-rail', '.review-files',
  ]);

  for (const rule of leafRules(ordinary)) {
    const shadow = rule.declarations.find(({ property }) => property === 'box-shadow');
    const selectorArms = rule.selector.split(',').map((selector) => selector.trim());
    const isPressed = selectorArms.some((selector) => selector.includes(':active') || selector.includes('[aria-pressed="true"]'));
    if (isPressed && shadow?.value !== 'none') fail(`pressed control rule ${rule.selector} must explicitly set box-shadow: none`);
    if (shadow === undefined) continue;
    for (const selector of selectorArms) {
      if (shadow.value.includes('inset')) {
        if (insetAllowlist.get(selector) !== shadow.value) fail(`inset shadow is not allowlisted for ${selector}`);
      } else if (shadow.value === 'var(--shadow-overlay)') {
        if (!overlayAllowlist.has(selector)) fail(`overlay shadow is not allowlisted for ${selector}`);
        if ((selector === '.comments-rail' && !rule.context.some((item) => item.includes('max-width: 1439px')))
          || (selector === '.review-files' && !rule.context.some((item) => item.includes('max-width: 1099px')))) {
          fail(`overlay shadow for ${selector} is outside its permitted responsive query`);
        }
      } else if (shadow.value !== 'none') {
        fail(`box-shadow value ${shadow.value} is not permitted for ${selector}`);
      }
    }
  }
}

const source = await readFile(sourcePath, 'utf8');
const index = await readFile(indexPath, 'utf8');
const cssHrefs = [...index.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi)]
  .map((match) => match[1]);
if (cssHrefs.length === 0) fail('generated index has no application stylesheet link');

const generatedAssets = await Promise.all(cssHrefs.map(async (href) => {
  const assetPath = resolve(outputRoot, href);
  const assetRelativePath = relative(outputRoot, assetPath);
  if (assetRelativePath.startsWith(`..${sep}`) || assetRelativePath === '..') {
    fail(`generated stylesheet escapes dist/web: ${href}`);
  }
  try {
    return await readFile(assetPath, 'utf8');
  } catch {
    fail(`generated stylesheet linked by dist/web/index.html is missing: ${href}`);
  }
}));
const generated = generatedAssets.join('\n');

const sourceRoot = rootRule(source, 'source CSS');
const generatedRoot = rootRule(generated, 'generated CSS', true);
assertTokenRoot(sourceRoot, 'source CSS', true);
assertTokenRoot(generatedRoot, 'generated CSS', false);
assertExpectedValues(sourceRoot);
assertNoLegacy(source, 'source CSS');
assertNoLegacy(generated, 'generated CSS');
assertAuthorStyle(source);

console.log('Semantic CSS verified: canonical root, retired vocabulary, and author-style invariants pass.');
