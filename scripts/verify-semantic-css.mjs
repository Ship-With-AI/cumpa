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

function selectorArms(selector) {
  return selector.split(',').map((arm) => arm.trim());
}

function skipCssStringOrComment(css, cursor) {
  if (css.startsWith('/*', cursor)) {
    const closing = css.indexOf('*/', cursor + 2);
    if (closing === -1) fail('unterminated CSS comment');
    return closing + 2;
  }
  if (css[cursor] !== '"' && css[cursor] !== "'") return cursor;

  const quote = css[cursor];
  cursor += 1;
  while (cursor < css.length) {
    if (css[cursor] === '\\') {
      cursor += 2;
    } else if (css[cursor] === quote) {
      return cursor + 1;
    } else {
      cursor += 1;
    }
  }
  fail('unterminated CSS string');
}

function closingBrace(css, opening, selector) {
  let depth = 1;
  for (let cursor = opening + 1; cursor < css.length; cursor += 1) {
    const next = skipCssStringOrComment(css, cursor);
    if (next !== cursor) {
      cursor = next - 1;
      continue;
    }
    if (css[cursor] === '{') depth += 1;
    if (css[cursor] === '}') depth -= 1;
    if (depth === 0) return cursor;
  }
  fail(`unbalanced rule near ${selector}`);
}

function blocks(css) {
  const rules = [];
  let preludeStart = 0;
  let groupingDepth = 0;

  for (let cursor = 0; cursor < css.length; cursor += 1) {
    const next = skipCssStringOrComment(css, cursor);
    if (next !== cursor) {
      cursor = next - 1;
      continue;
    }

    if (css[cursor] === '(' || css[cursor] === '[') groupingDepth += 1;
    if (css[cursor] === ')' || css[cursor] === ']') groupingDepth -= 1;
    if (groupingDepth !== 0) continue;
    if (css[cursor] === ';') {
      preludeStart = cursor + 1;
      continue;
    }
    if (css[cursor] !== '{') continue;

    const selector = css.slice(preludeStart, cursor).replaceAll(/\/\*[\s\S]*?\*\//g, '').trim();
    const closing = closingBrace(css, cursor, selector);
    rules.push({ selector, body: css.slice(cursor + 1, closing) });
    preludeStart = closing + 1;
    cursor = closing;
  }
  return rules;
}

function isKeyframes(selector) {
  return /^@(?:-[\w]+-)?keyframes\b/i.test(selector);
}

function leafRules(css, context = []) {
  const rules = [];
  for (const { selector, body } of blocks(css)) {
    if (selector.startsWith('@')) {
      if (!isKeyframes(selector)) rules.push(...leafRules(body, [...context, selector]));
    } else {
      rules.push({ selector, body, declarations: declarations(body), context });
    }
  }
  return rules;
}

function rootRule(css, label, tokenBearing = false) {
  const roots = leafRules(css).filter((rule) => selectorArms(rule.selector).includes(':root'));
  const contextualRoot = roots.find((rule) => rule.context.length !== 0);
  if (contextualRoot !== undefined) {
    fail(`${label} :root must be context-free; found ${contextualRoot.context.join(' > ')}`);
  }
  const candidates = tokenBearing
    ? roots.filter((rule) => rule.declarations.some(({ property }) => property === '--surface-canvas'))
    : roots;
  if (candidates.length !== 1) {
    fail(`${label} must contain exactly one ${tokenBearing ? 'canonical token-bearing ' : ''}:root rule; found ${candidates.length}`);
  }
  return candidates[0];
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
    if (hasColorLiteral && !(rule.selector === ':root' && rule.context.length === 0)) {
      fail(`raw color literal outside the token root in ${rule.selector}`);
    }
  }

  const insetAllowlist = new Map([
    ['.tree-row--selected', 'inset 3px 0 var(--selection-border)'],
    ['.view-tab[aria-selected="true"]', 'inset 0 -3px var(--selection-border)'],
  ]);
  const overlayAllowlist = new Set([
    '.identity-panel', '.keyboard-help', '.ui-tooltip__content', '.diff-workspace__gutter-action::after',
    '.comments-rail--open', '.review-files--open',
  ]);

  for (const rule of leafRules(ordinary)) {
    const shadows = rule.declarations.filter(({ property }) => property === 'box-shadow');
    if (shadows.length > 1) fail(`rule ${rule.selector} declares box-shadow more than once`);
    const [shadow] = shadows;
    const arms = selectorArms(rule.selector);
    const isPressed = arms.some((selector) => selector.includes(':active') || selector.includes('[aria-pressed="true"]'));
    if (isPressed && shadow?.value !== 'none') fail(`pressed control rule ${rule.selector} must explicitly set box-shadow: none`);
    if (shadow === undefined) continue;
    for (const selector of arms) {
      if (shadow.value.includes('inset')) {
        if (insetAllowlist.get(selector) !== shadow.value) fail(`inset shadow is not allowlisted for ${selector}`);
      } else if (shadow.value === 'var(--shadow-overlay)') {
        if (!overlayAllowlist.has(selector)) fail(`overlay shadow is not allowlisted for ${selector}`);
        if ((selector === '.comments-rail--open' && !rule.context.some((item) => item.includes('max-width: 1439px')))
          || (selector === '.review-files--open' && !rule.context.some((item) => item.includes('max-width: 1099px')))) {
          fail(`overlay shadow for ${selector} is outside its permitted responsive query`);
        }
      } else if (shadow.value !== 'none') {
        fail(`box-shadow value ${shadow.value} is not permitted for ${selector}`);
      }
    }
  }
}

function expectAuditFailure(assertion, name) {
  try {
    assertion();
  } catch {
    return;
  }
  fail(`self-check did not reject ${name}`);
}

function assertAuditSelfChecks() {
  const forcedColors = '@media (forced-colors: active) { body { color: CanvasText; } }';
  const canonicalRoot = ':root { --surface-canvas: #0D1117; }';

  for (const [name, groupingRule] of [
    ['@supports', '@supports (display: grid)'],
    ['@layer', '@layer components'],
    ['@container', '@container (width > 0px)'],
    ['@scope', '@scope (.review-workspace)'],
  ]) {
    expectAuditFailure(
      () => rootRule(`${canonicalRoot} ${groupingRule} { :root { --surface-canvas: var(--surface-panel); } }`, `${name} nested-root fixture`),
      `a contextual :root inside ${name}`,
    );
  }

  expectAuditFailure(
    () => assertAuthorStyle(`${canonicalRoot} @container (width > 0px) { .ui-button:active { box-shadow: inset 1px 1px black; } } ${forcedColors}`),
    'a non-permitted pressed-control shadow inside @container',
  );
  expectAuditFailure(
    () => assertAuthorStyle(`${canonicalRoot} @scope (.review-workspace) { .review-heading { color: #E6EDF3; } } ${forcedColors}`),
    'a raw color literal inside @scope',
  );
}

assertAuditSelfChecks();

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
