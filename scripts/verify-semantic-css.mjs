import { readFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';

const repositoryRoot = resolve(import.meta.dirname, '..');
const sourcePath = resolve(repositoryRoot, 'src/web/styles.css');
const prototypePath = resolve(repositoryRoot, 'src/web/prototypes/MonacoStabilityPrototype.vue');
const outputRoot = resolve(repositoryRoot, 'dist/web');
const indexPath = resolve(outputRoot, 'index.html');

const canonicalTokens = [
  '--border-control',
  '--border-default',
  '--border-gap',
  '--border-hunk',
  '--border-overlay',
  '--border-width-default',
  '--control-height-compact',
  '--control-height-standard',
  '--destructive-emphasis',
  '--destructive-foreground',
  '--dialog-max-height',
  '--dialog-width',
  '--diff-addition-background',
  '--diff-addition-foreground',
  '--diff-addition-intraline-background',
  '--diff-deletion-background',
  '--diff-deletion-foreground',
  '--diff-deletion-intraline-background',
  '--diff-empty-background',
  '--diff-gutter-width',
  '--diff-hunk-background',
  '--diff-hunk-foreground',
  '--diff-region-border',
  '--diff-row-height',
  '--diff-sign-width',
  '--diff-unchanged-background',
  '--file-row-min-height',
  '--focus-offset',
  '--focus-outline-width',
  '--focus-ring',
  '--font-mono',
  '--font-size-body',
  '--font-size-code',
  '--font-size-display',
  '--font-size-metadata',
  '--font-size-page-heading',
  '--font-ui',
  '--font-weight-regular',
  '--font-weight-semibold',
  '--icon-size',
  '--interactive-accent',
  '--interactive-accent-emphasis',
  '--interactive-accent-emphasis-hover',
  '--line-height-body',
  '--line-height-code',
  '--line-height-display',
  '--line-height-metadata',
  '--line-height-page-heading',
  '--monaco-inactive-selection-background',
  '--monaco-scrollbar-active-background',
  '--monaco-scrollbar-hover-background',
  '--monaco-whitespace-foreground',
  '--radius-control',
  '--radius-file-row',
  '--radius-overlay',
  '--radius-pill',
  '--radius-scrollbar',
  '--scrollbar-thumb',
  '--selected-rail-width',
  '--selection-background',
  '--selection-border',
  '--shadow-overlay',
  '--sidebar-width',
  '--space-1',
  '--space-2',
  '--space-3',
  '--space-4',
  '--space-5',
  '--space-6',
  '--space-8',
  '--status-added-background',
  '--status-added-border',
  '--status-added-foreground',
  '--status-deleted-background',
  '--status-deleted-border',
  '--status-deleted-foreground',
  '--status-disabled-background',
  '--status-disabled-foreground',
  '--status-error-background',
  '--status-error-foreground',
  '--status-information-background',
  '--status-information-foreground',
  '--status-modified-background',
  '--status-modified-border',
  '--status-modified-foreground',
  '--status-pending-background',
  '--status-pending-foreground',
  '--status-resolved-background',
  '--status-resolved-foreground',
  '--status-success-background',
  '--status-success-foreground',
  '--status-warning-background',
  '--status-warning-foreground',
  '--surface-canvas',
  '--surface-empty',
  '--surface-gap',
  '--surface-hunk',
  '--surface-interactive',
  '--surface-interactive-active',
  '--surface-interactive-hover',
  '--surface-panel',
  '--surface-raised',
  '--surface-scrim',
  '--surface-sidebar',
  '--syntax-comment-foreground',
  '--syntax-default-foreground',
  '--syntax-invalid-foreground',
  '--syntax-keyword-foreground',
  '--syntax-number-foreground',
  '--syntax-string-foreground',
  '--syntax-type-foreground',
  '--text-hunk',
  '--text-line-number',
  '--text-muted',
  '--text-on-emphasis',
  '--text-primary',
  '--text-selection-background',
  '--tree-indent',
];

function fail(message) {
  throw new Error(`Semantic CSS audit failed: ${message}`);
}

function declarations(body) {
  const uncommented = body.replaceAll(/\/\*[\s\S]*?\*\//g, '');
  return [...uncommented.matchAll(/([\w-]+)\s*:\s*([^;{}]+);/g)].map(([, property, value]) => ({
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

function declarationRules(css, context = []) {
  const rules = [];
  for (const { selector, body } of blocks(css)) {
    const nested = blocks(body);
    if (selector.startsWith('@')) {
      if (nested.length === 0) {
        const directDeclarations = declarations(body);
        if (directDeclarations.length !== 0) {
          rules.push({ selector, body, declarations: directDeclarations, context });
        }
      }
      rules.push(...declarationRules(body, [...context, selector]));
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

function assertTokenValueShapes(rule, label) {
  for (const { property, value } of rule.declarations.filter(({ property }) => property.startsWith('--'))) {
    const hex = value.match(/#[0-9a-fA-F]+/);
    if (hex !== null && /[A-F]/.test(hex[0])) {
      fail(`${label} token ${property} must not use uppercase hex color`);
    }

    const alias = value.match(/^var\(\s*(--[\w-]+)\s*\)$/);
    if (alias !== null) {
      if (!canonicalTokens.includes(alias[1])) fail(`${label} token ${property} references non-canonical ${alias[1]}`);
      continue;
    }
    if (value.includes('var(')) fail(`${label} token ${property} must be a single canonical var() reference`);
    if (/^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/.test(value)) continue;
    const colorFunctions = [...value.matchAll(/\b(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix)\s*\(([^)]*)\)/gi)];
    for (const [, name, argumentsText] of colorFunctions) {
      if (name.toLowerCase() !== 'rgb' || !/^\s*\d{1,3}\s+\d{1,3}\s+\d{1,3}\s*\/\s*(?:\d+(?:\.\d+)?|\.\d+)%\s*$/u.test(argumentsText)) {
        fail(`${label} token ${property} must use lowercase hex or rgb(r g b / n%)`);
      }
    }
  }
}

function assertNoLegacy(css, label) {
  const legacy = /(?<![\w-])--(?:canvas|panel|accent|destructive|surface|text|rule|addition-(?:bg|fg)|deletion-(?:bg|fg)|warning-(?:bg|fg)|info-(?:bg|fg)|error-(?:bg|fg))(?![\w-])|(?<![\w-])--color-[\w-]+/g;
  const match = css.match(legacy);
  if (match !== null) fail(`${label} still references retired token ${match[0]}`);
}

const allowedForcedColorKeywords = new Set([
  'canvas', 'canvastext', 'buttonface', 'buttontext', 'buttonborder',
  'linktext', 'highlight', 'highlighttext', 'graytext',
]);
const systemColorKeywords = new Set([
  ...allowedForcedColorKeywords,
  'accentcolor', 'accentcolortext', 'activetext', 'field', 'fieldtext',
  'mark', 'marktext', 'selecteditem', 'selecteditemtext', 'visitedtext',
]);
const namedColorKeywords = new Set(`
  aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond
  blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue
  cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey
  darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon
  darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet
  deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen
  fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew
  hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon
  lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey
  lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey
  lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine
  mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen
  mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite
  navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise
  palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red
  rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue
  slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise
  violet wheat white whitesmoke yellow yellowgreen
`.trim().split(/\s+/));
const nonPaletteColorProperties = new Set([
  'background', 'background-color', 'border', 'border-color', 'border-top', 'border-right',
  'border-bottom', 'border-left', 'border-top-color', 'border-right-color',
  'border-bottom-color', 'border-left-color', 'outline', 'outline-color',
  'text-decoration', 'text-decoration-color', 'fill', 'stroke',
]);

function isPaintBearingProperty(property) {
  return property.startsWith('--')
    || /^(?:background(?:-color)?|border(?:-(?:top|right|bottom|left))?(?:-color)?|outline(?:-color)?|color|caret-color|accent-color|column-rule(?:-color)?|text-(?:decoration|emphasis)(?:-color)?|(?:-webkit-)?text-(?:fill|stroke)(?:-color)?|fill|stroke|stop-color|flood-color|lighting-color)$/.test(property);
}

function directColorSyntaxes(value) {
  const inspected = value
    .replace(/(["'])(?:\\.|(?!\1)[\s\S])*\1/g, '')
    .replace(/url\([^)]*\)/gi, '');
  const syntaxes = [];
  if (/#[0-9a-f]{3,8}\b/i.test(inspected)) syntaxes.push('hex color');
  if (/\b(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch|color-mix|color|device-cmyk|light-dark|color-contrast|contrast-color)\s*\(/i.test(inspected)) {
    syntaxes.push('color function');
  }
  for (const word of inspected.matchAll(/\b[a-z][\w-]*\b/gi)) {
    const normalized = word[0].toLowerCase();
    if (systemColorKeywords.has(normalized)) syntaxes.push(`system color ${word[0]}`);
    if (namedColorKeywords.has(normalized)) syntaxes.push(`named color ${word[0]}`);
    if (normalized === 'currentcolor') syntaxes.push('currentColor');
    if (normalized === 'transparent') syntaxes.push('transparent');
  }
  return syntaxes;
}

function isNonPaletteColor(property, syntax) {
  return nonPaletteColorProperties.has(property)
    && (syntax === 'currentColor' || syntax === 'transparent');
}

function isForcedColorsContext(context) {
  return context.some((item) => /^@media\s*\(\s*forced-colors\s*:\s*active\s*\)$/i.test(item));
}

function assertDirectColorConfinement(source) {
  for (const rule of declarationRules(source)) {
    const isTokenRoot = rule.selector === ':root' && rule.context.length === 0;
    const inForcedColors = isForcedColorsContext(rule.context);
    for (const declaration of rule.declarations) {
      if (!isPaintBearingProperty(declaration.property) || declaration.property === 'box-shadow') continue;
      const syntaxes = directColorSyntaxes(declaration.value);
      for (const syntax of syntaxes) {
        if (isTokenRoot || isNonPaletteColor(declaration.property, syntax)) continue;
        if (inForcedColors && syntax.startsWith('system color ')
          && allowedForcedColorKeywords.has(syntax.slice('system color '.length).toLowerCase())) continue;
        fail(`direct ${syntax} outside the permitted token root or forced-colors repair in ${rule.selector}`);
      }
    }
  }
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
  const systemKeyword = /\b(?:AccentColor|AccentColorText|ActiveText|ButtonBorder|ButtonFace|ButtonText|Canvas|CanvasText|Field|FieldText|GrayText|Highlight|HighlightText|LinkText|Mark|MarkText|SelectedItem|SelectedItemText|VisitedText)\b/;
  if (systemKeyword.test(ordinary)) fail('system colors are only allowed in the forced-colors repair block');

  assertDirectColorConfinement(source);

  const insetAllowlist = new Map([
    ['.tree-row--selected', 'inset 3px 0 var(--selection-border)'],
    ['.view-tab[aria-selected="true"]', 'inset 0 -3px var(--selection-border)'],
    ['.monaco-editor .monaco-anchor-line', 'inset 3px 0 var(--interactive-accent)'],
  ]);
  const overlayAllowlist = new Set([
    '.identity-panel', '.keyboard-help', '.ui-tooltip__content', '.diff-workspace__gutter-action::after',
    '.comments-rail--open', '.review-files--open', '.support-dialog',
  ]);

  for (const rule of declarationRules(ordinary)) {
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

function assertVueStyleBlocks(source, label) {
  const styles = [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((match) => match[1]);
  if (styles.length === 0) fail(`${label} has no authored style block to audit`);
  for (const style of styles) {
    assertAuthorStyle(`:root { --surface-canvas: #0D1117; } ${style} @media (forced-colors: active) {
      body { background: Canvas; color: CanvasText; }
    }`);
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
  expectAuditFailure(
    () => assertAuthorStyle(`${canonicalRoot} @keyframes theme-bypass { to { color: #FFFFFF; } } ${forcedColors}`),
    'a raw color literal inside a keyframe step',
  );
  expectAuditFailure(
    () => assertAuthorStyle(`${canonicalRoot} @keyframes theme-shadow { to { box-shadow: 0 0 1px white; } } ${forcedColors}`),
    'a non-allowlisted shadow inside a keyframe step',
  );
  for (const [name, declaration] of [
    ['white', 'background: white;'],
    ['rebeccapurple', 'color: rebeccapurple;'],
    ['oklch()', 'border-color: oklch(75% 0.1 250);'],
    ['color()', 'background: color(srgb 1 1 1);'],
    ['hwb()', 'color: hwb(0 0% 0%);'],
    ['device-cmyk()', 'border-color: device-cmyk(0% 100% 100% 0%);'],
    ['light-dark()', 'background: light-dark(white, black);'],
    ['contrast-color()', 'color: contrast-color(var(--surface-canvas));'],
  ]) {
    expectAuditFailure(
      () => assertAuthorStyle(`${canonicalRoot} .direct-color { ${declaration} } ${forcedColors}`),
      `a direct ${name} color outside the token root`,
    );
  }

  expectAuditFailure(
    () => assertAuthorStyle(`${canonicalRoot} @media (forced-colors: active) { .direct-color { background: AccentColor; } }`),
    'an unapproved forced-colors system color',
  );

  expectAuditFailure(
    () => assertVueStyleBlocks('<style scoped>.prototype { background: #f6f3ec; }</style>', 'raw Vue fixture'),
    'a direct palette literal in an authored Vue style block',
  );

  const uppercaseRoot = canonicalRoot.replace('#0d1117', '#0d1117'.toUpperCase());
  expectAuditFailure(
    () => assertTokenValueShapes(rootRule(uppercaseRoot, 'uppercase token fixture'), 'uppercase token fixture'),
    'uppercase token hex',
  );
  expectAuditFailure(
    () => assertTokenValueShapes(rootRule(':root { --surface-canvas: var(--unknown-token); }', 'unknown alias fixture'), 'unknown alias fixture'),
    'non-canonical token alias',
  );
  expectAuditFailure(
    () => assertTokenValueShapes(rootRule(':root { --surface-canvas: hsl(0 0% 0%); }', 'unsupported color fixture'), 'unsupported color fixture'),
    'unsupported color function',
  );

  assertAuthorStyle(`${canonicalRoot} .semantic-colors { color: var(--text-primary); border-color: currentColor; background: transparent; } @media (forced-colors: active) {
    body { background: Canvas; color: CanvasText; }
    button { background: ButtonFace; color: ButtonText; border-color: ButtonBorder; }
    a { color: LinkText; }
    .selected { background: Highlight; color: HighlightText; }
    :disabled { color: GrayText; }
  }`);
}

assertAuditSelfChecks();

const source = await readFile(sourcePath, 'utf8');
const prototypeSource = await readFile(prototypePath, 'utf8');
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
assertTokenValueShapes(sourceRoot, 'source CSS');
assertNoLegacy(source, 'source CSS');
assertNoLegacy(generated, 'generated CSS');
assertAuthorStyle(source);
assertVueStyleBlocks(prototypeSource, 'Monaco stability prototype');

console.log('Semantic CSS verified: canonical root, retired vocabulary, and author-style invariants pass.');
