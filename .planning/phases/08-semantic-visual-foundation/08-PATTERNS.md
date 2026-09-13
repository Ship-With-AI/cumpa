# Phase 08: Semantic Visual Foundation - Pattern Map

**Mapped:** 2026-09-13
**Files analyzed:** 17 (3 created, 14 modified)
**Analogs found:** 16 / 17

---

## File Classification

| New/Modified File | New? | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|------|-----------|----------------|---------------|
| `src/web/styles.css` | mod | config (token root) | build-time transform | *itself* — `styles.css:1-86` is already the single canonical `:root` | exact (self) |
| `scripts/token-root-plugin.mjs` *(see Hazard 1 re: location)* | **NEW** | build plugin | file-I/O → transform | `tests/integration/monaco-anchor.spec.ts:33-52` (only custom Vite plugin in repo: `resolveId`/`load`) | role-match |
| `src/web/theme/token-contract.ts` | **NEW** | utility (pure) | transform | `tests/unit/monaco-theme.test.ts:113-131` (`rootColor` + `themeHex` — the logic being extracted) | exact |
| `src/web/theme/virtual-tokens.d.ts` | **NEW** | config (ambient decl) | n/a | **none** — repo has zero `.d.ts` and zero `declare module` (verified: `find src -name "*.d.ts"` empty) | **no analog** |
| `src/web/monaco/theme.ts` | mod | config (theme data) | transform | *itself* — `theme.ts:5-86` shape must be preserved | exact (self) |
| `vite.config.ts` | mod | config | n/a | `vite.config.ts:9` (`plugins: [vue()]`) | exact (self) |
| `vitest.config.ts` | mod | config | n/a | `vite.config.ts:9` (plugin array shape) | role-match |
| `tsconfig.web.json` | mod | config | n/a | `tsconfig.web.json:12-18` (explicit `files` list) | exact (self) |
| `tests/unit/monaco-theme.test.ts` | mod | test (parity gate) | file-I/O → assert | *itself* — `monaco-theme.test.ts:106-157` | exact (self) |
| `scripts/verify-semantic-css.mjs` | mod | test (stray-literal gate) | file-I/O → assert | *itself* — `verify-semantic-css.mjs:294-309` `assertDirectColorConfinement` **already implements the stray-literal gate** | exact (self) |
| `package.json` | mod | config | n/a | `package.json` `scripts` block (no `verify:semantic-css` verb exists today) | exact (self) |
| `tests/e2e/responsive-session.spec.ts` | mod | test (computed style) | request-response | `responsive-session.spec.ts:921-922` | exact (self) |
| `tests/e2e/pinned-session.spec.ts` | mod | test (computed style) | request-response | `pinned-session.spec.ts:343-345` | exact (self) |
| `tests/integration/monaco-anchor.spec.ts` | mod | test (computed style) | request-response | `monaco-anchor.spec.ts:246,268-270` | exact (self) |
| `tests/integration/anchored-workspace.spec.ts` | mod | test (computed style) | request-response | `anchored-workspace.spec.ts:1265` | exact (self) |
| `tests/integration/draft-recovery-ui.spec.ts` | mod | test (computed style) | request-response | `draft-recovery-ui.spec.ts:202-212` | exact (self) |
| `tests/integration/export-receipt-ui.spec.ts` | mod | test (computed style) | request-response | `export-receipt-ui.spec.ts:262-264` | exact (self) |
| `DESIGN.md` | mod | doc | n/a | `DESIGN.md:9-21` (stale v1.1 palette prose) | exact (self) |

**Colour-literal census across browser specs** (`grep -c "rgb([0-9]"`, verified):

| Spec | Hard-coded `rgb(...)` literals |
|------|-------------------------------|
| `tests/e2e/responsive-session.spec.ts` | 18 |
| `tests/integration/monaco-anchor.spec.ts` | 7 |
| `tests/e2e/pinned-session.spec.ts` | 6 |
| `tests/integration/draft-recovery-ui.spec.ts` | 4 |
| `tests/integration/export-receipt-ui.spec.ts` | 4 |
| `tests/integration/anchored-workspace.spec.ts` | 1 |
| **Total** | **40** |

---

## Pattern Assignments

### 1. `scripts/token-root-plugin.mjs` (build plugin, file-I/O → transform) — **NEW**

**Analog:** `tests/integration/monaco-anchor.spec.ts:31-54` — the repo's *only* existing custom Vite plugin. Copy the `name` / `resolveId` / `load` triple and the `undefined`-not-`null` return convention it uses.

**Plugin object shape** (`tests/integration/monaco-anchor.spec.ts:33-52`):

```ts
      {
        name: 'monaco-stability-prototype-entry',
        configureServer(viteServer) {
          viteServer.middlewares.use('/monaco-stability', (_request, response) => {
            response.statusCode = 200;
            response.setHeader('content-type', 'text/html');
            response.end(`<!doctype html><html lang="en"><body><div id="app"></div><script type="module" src="/__monaco-stability-entry.ts"></script></body></html>`);
          });
        },
        resolveId(id) {
          return id === '/__monaco-stability-entry.ts' ? id : undefined;
        },
        load(id) {
          return id === '/__monaco-stability-entry.ts'
            ? `import { createApp } from 'vue';\nimport Prototype from '/prototypes/MonacoStabilityPrototype.vue';\ncreateApp(Prototype).mount('#app');`
            : undefined;
        },
      },
```

**Repository-root resolution pattern** — copy from `scripts/verify-semantic-css.mjs:4-5`, which is the established way a repo script locates `styles.css`:

```js
const repositoryRoot = resolve(import.meta.dirname, '..');
const sourcePath = resolve(repositoryRoot, 'src/web/styles.css');
```

Note `import.meta.dirname` (not `fileURLToPath(import.meta.url)`) is the convention in `scripts/` and in `tests/unit/monaco-theme.test.ts:107`. `tests/e2e/responsive-session.spec.ts:30` uses the older `dirname(fileURLToPath(import.meta.url))` form — prefer `import.meta.dirname`.

**Registration** — `vite.config.ts:1-14` in full (this is the whole file; the plugin array is line 9):

```ts
import { resolve } from 'node:path';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  root: resolve(import.meta.dirname, 'src/web'),
  base: './',
  plugins: [vue()],
  build: {
    outDir: resolve(import.meta.dirname, 'dist/web'),
    emptyOutDir: true,
  },
});
```

`vitest.config.ts:1-17` has **no `plugins` key today** — one must be added:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'tests/unit/**/*.test.ts',
      'tests/git/**/*.test.ts',
      'tests/api/**/*.test.ts',
      'tests/cli/**/*.test.ts',
      'tests/package/**/*.test.ts',
    ],
    exclude: ['tests/package/agent-ready-export.test.ts'],
    testTimeout: 10_000,
    hookTimeout: 10_000,
  },
});
```

**Coverage already solved for browser specs:** every Playwright spec that serves the app boots an in-process Vite dev server with `configFile: .../vite.config.ts`, so registering the plugin in `vite.config.ts` alone covers all nine of them. Verified call sites:

| Spec | Line |
|------|------|
| `tests/e2e/agent-ready-export-safety.spec.ts` | `78-79` |
| `tests/e2e/pinned-session.spec.ts` | `107-108` |
| `tests/e2e/review-panel-resolved.spec.ts` | `160-161` |
| `tests/integration/anchored-workspace.spec.ts` | `156-157` |
| `tests/integration/draft-recovery-ui.spec.ts` | `124-125` |
| `tests/integration/export-receipt-ui.spec.ts` | `90-91` |
| `tests/integration/monaco-anchor.spec.ts` | `31-32` |
| `tests/integration/selector-drift-ui.spec.ts` | `190-191` |
| `tests/integration/support-dialog.spec.ts` | `26-27` |

`tests/e2e/responsive-session.spec.ts` is the exception — it goes through `npm run build` + `npm pack` (see Hazard 2).

---

### 2. `src/web/theme/token-contract.ts` (utility, pure transform) — **NEW**

**Analog:** `tests/unit/monaco-theme.test.ts:106-131`. The three helpers below are the code being extracted. `rootColor` and `themeHex` move verbatim (minus I/O); `rootTokens`' `readFileSync` stays behind in the *callers* (test tier), and the regex body becomes `parseTokenRoot(cssText)`.

**Root parse + alias resolution + hex normalisation** (`tests/unit/monaco-theme.test.ts:106-131`):

```ts
function rootTokens(): ReadonlyMap<string, string> {
  const source = readFileSync(resolve(import.meta.dirname, '../../src/web/styles.css'), 'utf8');
  const root = source.match(/:root\s*\{([\s\S]*?)\}/u)?.[1];
  if (root === undefined) throw new Error('styles.css must declare a canonical :root token block');
  return new Map([...root.matchAll(/(--[\w-]+):\s*([^;]+);/gu)].map((match) => [match[1], match[2].trim()]));
}

function rootColor(tokens: ReadonlyMap<string, string>, token: string): string {
  const value = tokens.get(token);
  if (value === undefined) throw new Error(`canonical root missing ${token}`);
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
```

**Two behavioural facts the extraction must preserve or deliberately change:**

- `themeHex` **uppercases** output (`:120-131`). `08-UI-SPEC.md` writes the new palette in **lowercase** (`#0d1117`, `#10151c`, `#a7b1bd`). `src/web/styles.css:3-80` is currently **uppercase**. Pick one casing for the root and keep `toUpperCase()`/`toLowerCase()` consistent, or byte-parity fails on case alone. Monaco's `Color.fromHex` is case-insensitive, so only the *gate* cares.
- `rootTokens` uses non-greedy `([\s\S]*?)\}` — it stops at the **first** `}`. `src/web/styles.css:86` is the root's closing brace, so this works today, but the shorter regex is laxer than `scripts/verify-semantic-css.mjs`'s real block parser (`closingBrace`/`blocks`, `:101-145`). If the new root gains a nested block, the test-tier regex silently truncates. `verify-semantic-css.mjs` is the stricter analog.

**Exports must be import-safe from three runtimes** (browser bundle via Rollup, Vitest `environment: 'node'`, Playwright). Therefore: no `node:fs`, no `monaco-editor` import. Note `src/web/monaco/theme.ts:1` imports `monaco-editor` for the `satisfies` type only, and the unit test has to mock it (`tests/unit/monaco-theme.test.ts:11-13`) — do not repeat that coupling in `token-contract.ts`.

---

### 3. `src/web/theme/virtual-tokens.d.ts` (config, ambient declaration) — **NEW, NO ANALOG**

No `.d.ts` file and no `declare module` statement exists anywhere in `src/` (verified). Planner should use `RESEARCH.md`'s guidance rather than a codebase pattern.

**Consumption constraint from `tsconfig.web.json:12-18`** — an explicit `files` list, not `include`, so new modules are invisible to `npm run typecheck:web` unless added:

```json
  "files": [
    "src/web/monaco/diff-adapter.ts",
    "src/web/monaco/diff-semantics.ts",
    "src/web/monaco/line-mapping.ts",
    "src/web/monaco/theme.ts",
    "src/web/model/workspace-command.ts"
  ]
```

Both `src/web/theme/token-contract.ts` and `src/web/theme/virtual-tokens.d.ts` must be appended here. `tsconfig.json:15-20` (`include`, Node build) covers only `src/{cli,contracts,git,server}` — `src/web` is deliberately out of the `tsc` emit path, so no change is needed there.

---

### 4. `src/web/monaco/theme.ts` (config, theme data) — MODIFIED

**Analog:** itself. The exported *shape* is load-bearing for `tests/unit/monaco-theme.test.ts` and `src/web/monaco/diff-adapter.ts:98` and must survive byte-for-byte in structure while every literal is replaced.

**Structure that must be preserved** — `theme.ts:1-10` and `:44-46` and `:86-91`:

```ts
import * as monaco from 'monaco-editor';

export const CUMPA_THEME_ID = 'cumpa-dark';

export const CUMPA_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: '', foreground: 'E6EDF3' },
    { token: 'source', foreground: 'E6EDF3' },
```

```ts
  colors: {
    'editor.background': '#0D1117',
    'editor.foreground': '#E6EDF3',
```

```ts
} satisfies monaco.editor.IStandaloneThemeData;

export function applyCumpaTheme(): void {
  monaco.editor.defineTheme(CUMPA_THEME_ID, CUMPA_THEME);
  monaco.editor.setTheme(CUMPA_THEME_ID);
}
```

**Literal census to eliminate:** `rules` spans `theme.ts:8-44` (42 entries, `foreground` **without** leading `#`); `colors` spans `theme.ts:45-85` (36 entries, **with** leading `#`, some with baked alpha: `'#484F5880'`, `'#388BFD59'`, `'#388BFD40'`, `'#2EA04338'`, `'#2EA04373'`, `'#F8514938'`, `'#F8514973'`, `'#484F58A6'`, plus two fully transparent `'#00000000'`).

**`satisfies` constraint:** `theme.ts:86` uses `satisfies`, not `:` annotation, so `CUMPA_THEME.colors` keeps its literal key type. `tests/unit/monaco-theme.test.ts:139` depends on that: `colors[color as keyof typeof colors]`. If `colors` becomes a computed `Record<string, string>`, that index type collapses to `string` and the gate's key-completeness assertion at `:137` weakens. Build the object with explicit literal keys and a `color(token)` call per value — do **not** build it by mapping over a table.

**Call site that must keep working** — `src/web/monaco/diff-adapter.ts:5` and `:98`:

```ts
import { applyCumpaTheme } from './theme';
```
```ts
    applyCumpaTheme();
```

---

### 5. `tests/unit/monaco-theme.test.ts` (test, parity gate) — MODIFIED

**Analog:** itself — this file *is* the existing parity gate. It already reads the canonical root from disk; the change is (a) importing the shared `token-contract` instead of private helpers, (b) removing the `alpha:` multipliers, (c) adding literal-rejection assertions.

**Mocking convention for `monaco-editor` under `environment: 'node'`** (`monaco-theme.test.ts:6-19`) — keep this exactly; `theme.ts` imports `monaco-editor` at module scope and the hoisted mock is what makes the node-tier gate possible:

```ts
const { defineTheme, setTheme } = vi.hoisted(() => ({
  defineTheme: vi.fn(),
  setTheme: vi.fn(),
}));

vi.mock('monaco-editor', () => ({
  editor: { defineTheme, setTheme },
}));

import {
  applyCumpaTheme,
  CUMPA_THEME,
  CUMPA_THEME_ID,
} from '../../src/web/monaco/theme.js';
```

Note the `.js` extension on a `.ts` source import — repo convention, keep it.

**Mapping-table shape to retire** (`monaco-theme.test.ts:21-34`). The `alpha` field is what makes the current gate a mirror rather than a gate; `RESEARCH.md` Pattern 2 requires alpha be baked into root tokens instead:

```ts
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
```

The four `alpha:` sites are `:29` (`--border-strong`, 0.5), `:34` (`--selection-background`, 0.25), `:59` (`--border-default`, 0.5), `:60` (`--border-strong`, 0.65).

**Escape hatch for genuinely unpainted keys** (`monaco-theme.test.ts:63-66`) — the pattern for keys that must not map to a token; reuse it rather than inventing a new allowlist mechanism:

```ts
const UNPAINTED_THEME_COLORS = {
  'editor.lineHighlightBackground': '#00000000',
  'diffEditor.unchangedRegionShadow': '#00000000',
} as const;
```

**Key-completeness + rule-completeness assertions to preserve** (`monaco-theme.test.ts:133-157`):

```ts
  it('maps every semantic Monaco color and token foreground to the canonical root bytes', () => {
    const tokens = rootTokens();
    const colors = CUMPA_THEME.colors;
    const mappedKeys = Object.keys(THEME_COLOR_ROOT_MAP).sort();
    expect(Object.keys(colors).filter((key) => !(key in UNPAINTED_THEME_COLORS)).sort()).toEqual(mappedKeys);
      expect(colors[color as keyof typeof colors]).toBe(themeHex(tokens, mapping));
    }
    expect(Object.fromEntries(Object.entries(UNPAINTED_THEME_COLORS).map(([color, value]) => [color, colors[color as keyof typeof colors]]))).toEqual(UNPAINTED_THEME_COLORS);
    expect(Number.parseInt(colors['diffEditor.insertedTextBackground'].slice(-2), 16)).toBeGreaterThan(
      Number.parseInt(colors['diffEditor.insertedLineBackground'].slice(-2), 16),
    );
    expect(Number.parseInt(colors['diffEditor.removedTextBackground'].slice(-2), 16)).toBeGreaterThan(
      Number.parseInt(colors['diffEditor.removedLineBackground'].slice(-2), 16),
    );

    const rules = new Map(CUMPA_THEME.rules.map((rule) => [rule.token, rule]));
    expect([...rules.keys()].sort()).toEqual(Object.keys(TOKEN_ROOT_MAP).sort());
    for (const [scope, mapping] of Object.entries(TOKEN_ROOT_MAP)) {
      const rule = rules.get(scope);
      expect(rule?.foreground).toBe(themeHex(tokens, { token: mapping.token }).slice(1));
      expect(rule?.fontStyle).toBe(mapping.fontStyle);
    }
  });
```

The `.slice(-2)` intraline-vs-line alpha comparison (`:143-149`) is the "approved intraline continuity additions differ from normative line fills" check `08-UI-SPEC.md` requires — it survives unchanged. The `.slice(1)` at `:154` is the `#`-stripping for token rules.

**Second `it` block that must keep passing unchanged** (`monaco-theme.test.ts:159-169`) — asserts `defineTheme` precedes `setTheme` on every invocation. No Phase 08 edit required.

**How to run just this gate** (`package.json` `test:unit` → `scripts/run-focused-vitest.mjs:9-24`; it supports `--grep` → `--testNamePattern`):

```
npm run test:unit -- tests/unit/monaco-theme.test.ts
```

---

### 6. `scripts/verify-semantic-css.mjs` (test, stray-literal gate) — MODIFIED

**This is the closest analog for the stray-colour-literal gate, and it already exists.** Do not write a second one. `08-UI-SPEC.md`'s bullet "reject component-local color literals outside canonical root, except `transparent`, `currentColor`, forced-colors system keywords" is implemented verbatim at `:294-309`.

**The stray-literal gate itself** (`verify-semantic-css.mjs:294-309`):

```js
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
```

**Colour-syntax detector** (`:266-288`) — already covers hex, every CSS colour function, all 148 named colours, all system colours, `currentColor`, `transparent`:

```js
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
```

**Token-root structural gate — missing / duplicate / non-canonical** (`:181-217`). This is the "reject missing or duplicate required semantic tokens" requirement, already implemented:

```js
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
```

**THE SECOND PALETTE — `expectedValues` (`:35-62`) is a third literal table that must be re-derived or deleted:**

```js
function assertExpectedValues(rule) {
  const values = new Map(rule.declarations.map(({ property, value }) => [property, value]));
  for (const [token, expected] of expectedValues) {
    if (values.get(token) !== expected) fail(`source token ${token} must equal ${expected}`);
  }
}
```

```js
const expectedValues = new Map([
  ['--surface-canvas', '#0D1117'],
  ['--surface-inset', '#010409'],
  ['--surface-panel', '#161B22'],
  ['--surface-raised', '#21262D'],
  ['--surface-interactive', '#21262D'],
  ...
  ['--selection-background', 'rgb(56 139 253 / 35%)'],
```

Plus `canonicalTokens` (`:10-33`), a 63-name hard-coded list. Together with `theme.ts`'s 78 literals and `monaco-theme.test.ts`'s mapping table, this is the **third** authored palette artifact. VIS-01 ("no second palette") is not satisfiable while `expectedValues` exists as a value table. Either re-derive it to the mockup values or reduce it to a *shape* gate (tokens exist, resolve to `#RRGGBB[AA]` or `rgb(… / …%)`) and let `08-UI-SPEC.md` remain the only value authority.

**Retired-vocabulary regex** (`:219-223`) — the rename gate; must be extended for any Phase 08 rename (e.g. `--space-xs` → `--space-1`, `--font-size-metadata`, `--surface-inset`):

```js
function assertNoLegacy(css, label) {
  const legacy = /(?<![\w-])--(?:canvas|panel|accent|destructive|surface|text|rule|addition-(?:bg|fg)|deletion-(?:bg|fg)|warning-(?:bg|fg)|info-(?:bg|fg)|error-(?:bg|fg))(?![\w-])|(?<![\w-])--color-[\w-]+/g;
  const match = css.match(legacy);
  if (match !== null) fail(`${label} still references retired token ${match[0]}`);
}
```

**Self-check pattern** (`:369-377`) — the repo's convention for proving a gate can actually fail. Any new assertion added to this script should get a matching `expectAuditFailure` case in `assertAuditSelfChecks` (`:378-446`), which runs unconditionally at `:445`:

```js
function expectAuditFailure(assertion, name) {
  try {
    assertion();
  } catch {
    return;
  }
  fail(`self-check did not reject ${name}`);
}
```

**Vue `<style>` coverage gap** (`:359-367`, invoked at `:476`). The script audits exactly one Vue file:

```js
function assertVueStyleBlocks(source, label) {
  const styles = [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((match) => match[1]);
  if (styles.length === 0) fail(`${label} has no authored style block to audit`);
  for (const style of styles) {
    assertAuthorStyle(`:root { --surface-canvas: #0D1117; } ${style} @media (forced-colors: active) {
      body { background: Canvas; color: CanvasText; }
    }`);
  }
}
```

Three Vue files contain `<style>`: `src/web/App.vue:1378` (`<style src="./styles.css">`, no inline rules), `src/web/prototypes/MonacoStabilityPrototype.vue:359-373` (audited), `src/web/prototypes/Phase6DiffSemanticsPrototype.vue:462+` (**not audited**). All three currently contain zero colour literals (verified), so the gap is latent, not live — but `Phase6DiffSemanticsPrototype.vue` should be added to the audit list at `:476`.

Also note the synthetic fixtures at `:363` and `:380` hard-code `#0D1117` as an *arbitrary* canonical value. `08-UI-SPEC.md` keeps `--surface-canvas: #0d1117`, so these happen to stay valid, but they are fixtures and must not be read as palette authority.

**Wiring gap — the gate is not runnable from `package.json` and not in CI:**
- `package.json` `scripts` has no `verify:semantic-css` entry (verified: the only verbs are `build:*`, `typecheck:web`, `verify:prerequisites`, `verify:production-artifacts`, `test:*`, `pack:*`, `accept:*`, `evidence:*`).
- `grep verify-semantic-css .github` → **no matches**. It is referenced only from `.planning/quick/260812-dqa-.../260812-dqa-PLAN.md:124,189`.
- `.planning/quick/260812-dqa-SUMMARY.md:54` records it as **currently RED**: "two display tokens are absent from its canonical list, and four diff alpha values differ from its expected values."

So the phase inherits a pre-existing red gate. Planner must either fix it as part of the re-derivation or explicitly record it as a known-red precondition in the RED step.

---

### 7. `src/web/styles.css` (config, token root) — MODIFIED

**Analog:** itself. The structural precondition VIS-01 needs is already met — exactly one `:root`, lines 1-86, closing brace at `:86`.

**Colour section** (`styles.css:1-20`):

```css
:root {
  color-scheme: dark;
  --surface-canvas: #0D1117;
  --surface-inset: #010409;
  --surface-panel: #161B22;
  --surface-raised: #21262D;
  --surface-interactive: #21262D;
  --surface-interactive-hover: #292E36;
  --surface-interactive-active: #30363D;
  --text-primary: #E6EDF3;
  --text-secondary: #B1BAC4;
  --text-muted: #8B949E;
  --text-on-emphasis: #FFFFFF;
  --border-muted: #21262D;
  --border-default: #30363D;
  --border-strong: #484F58;
  --control-boundary: #8B949E;
  --interactive-accent: #2F81F7;
  --interactive-accent-emphasis: #1F6FEB;
  --focus-ring: #58A6FF;
```

**Alpha-baked and aliased tokens** (`styles.css:44-54`) — `RESEARCH.md` Pattern 2 says *this* is the shape all translucent Monaco values must adopt; note `--diff-empty-background` / `--diff-unchanged-background` / `--diff-region-border` are already `var()` aliases, which is why `token-contract.ts` needs `rootColor`'s recursive alias resolution:

```css
  --diff-addition-foreground: #3FB950;
  --diff-addition-background: rgb(46 160 67 / 22%);
  --diff-addition-intraline-background: rgb(46 160 67 / 45%);
  --diff-deletion-foreground: #F85149;
  --diff-deletion-background: rgb(248 81 73 / 22%);
  --diff-deletion-intraline-background: rgb(248 81 73 / 45%);
  --diff-hunk-foreground: #A371F7;
  --diff-hunk-background: rgb(163 113 247 / 15%);
  --diff-empty-background: var(--surface-inset);
  --diff-unchanged-background: var(--surface-inset);
  --diff-region-border: var(--border-default);
```

**Type / radius / spacing section to re-derive for VIS-03** (`styles.css:55-80`):

```css
  --font-ui: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --font-size-metadata: 12px;
  --line-height-metadata: 16px;
  --font-size-body: 14px;
  --line-height-body: 20px;
  --font-size-section-heading: 16px;
  --line-height-section-heading: 24px;
  --font-size-display: clamp(2rem, 8vw, 3.5rem);
  --line-height-display: 1.05;
  --font-size-page-heading: 20px;
  --line-height-page-heading: 28px;
  --font-weight-regular: 400;
  --font-weight-semibold: 600;
  --radius-compact: 4px;
  --radius-control: 6px;
  --radius-overlay: 8px;
  --radius-pill: 999px;
  --shadow-overlay: 0 8px 24px rgb(0 0 0 / 40%);
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
```

`08-UI-SPEC.md` mandates `--space-1..12`/`--space-16` names and four type sizes (12/13/14/21px). Every rename here is a mass `var()` rewrite across `styles.css:88-2705` plus a new entry in `assertNoLegacy`'s retired-vocabulary regex. `--font-mono` in the root does not match `08-UI-SPEC.md`'s `'SFMono-Regular', Consolas, 'Liberation Mono', monospace`.

**The single surviving production colour literal** (`styles.css:621-623`):

```css
  place-items: center;
  padding: var(--space-md);
  background: rgb(1 4 9 / 68%);
}
```

Selector is `.support-dialog-backdrop` (`styles.css:616`). It is a `background` (a `nonPaletteColorProperties` member) but `rgb(…)` is a "color function", not `transparent`/`currentColor`, so `isNonPaletteColor` at `:285-288` does **not** exempt it and `assertDirectColorConfinement` fails on it. This is the one literal VIS-01 must move into the root.

---

### 8. Playwright computed-style specs (test, request-response) — MODIFIED

`08-UI-SPEC.md` requires "Expected values must come from the canonical root via one shared contract export, never a separately maintained palette." All 40 literals below are currently separately maintained. `token-contract.ts` is importable from Playwright specs (they are plain Node ESM and already import from `src/`, e.g. `tests/e2e/responsive-session.spec.ts:23-27`), so the spec-side fix is `readFileSync(styles.css)` → `parseTokenRoot` → a `cssRgb(token)` helper.

**`tests/e2e/responsive-session.spec.ts:920-922`** — the primary semantic-style assertion CONTEXT.md names:

```ts
    expect(await page.locator(':root').evaluate((element) => getComputedStyle(element).colorScheme)).toBe('dark');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(13, 17, 23)');
    await expect(page.locator('body')).toHaveCSS('color', 'rgb(230, 237, 243)');
```

Also `:956-957` (status border colours), `:545` (`font-weight`, `600`), `:547` (`border-left-width`, `3px`), `:1303` (`padding`, `24px`), `:1305`/`:1323` (`box-shadow`).

**`tests/integration/monaco-anchor.spec.ts:245-246` and `:268-270`** — Monaco canvas/gutter and selection/focus colours; the only spec that proves the Monaco theme actually painted:

```ts
  await expect(addedEmpty).toHaveCSS('background-image', 'none');
  await expect(addedEmpty).toHaveCSS('background-color', 'rgb(1, 4, 9)');
```

```ts
  await expect(selectionContrast.first()).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(page.locator('.selected-text').first()).toHaveCSS('outline-color', 'rgb(88, 166, 255)');
  await expect(modifiedPane).toHaveCSS('outline-color', 'rgb(88, 166, 255)');
```

`rgb(1, 4, 9)` is `--surface-inset`/`--diff-empty-background`; `rgb(255, 255, 255)` is `--text-on-emphasis`; `rgb(88, 166, 255)` is `--focus-ring`.

**`tests/integration/anchored-workspace.spec.ts:1264-1265`** — the accent literal is embedded in a composite `box-shadow` string, so a naive token substitution will not match; it needs interpolation:

```ts
    await expect(anchorLine).toHaveCSS('border-left-width', '0px');
    await expect(anchorLine).toHaveCSS('box-shadow', 'rgb(47, 129, 247) 3px 0px 0px 0px inset');
```

`rgb(47, 129, 247)` is `--interactive-accent`. Corresponding source rule is in `verify-semantic-css.mjs`'s `insetAllowlist`: `['.monaco-editor .monaco-anchor-line', 'inset 3px 0 var(--interactive-accent)']` (`:328`).

**`tests/e2e/pinned-session.spec.ts:343-345`**:

```ts
    await expect(page.locator(':root')).toHaveCSS('color-scheme', 'dark');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(13, 17, 23)');
    await expect(page.locator('.loading-shell')).toHaveCSS('background-color', 'rgb(13, 17, 23)');
```

Also `:1067-1070` (unavailable shell / state card).

**`tests/integration/draft-recovery-ui.spec.ts:202-212`** — the densest block; also pins radius and focus-ring geometry, so it is a VIS-03 as well as VIS-01 edit:

```ts
    await expect(recovery).toHaveCSS('background-color', 'rgb(13, 17, 23)');
    await expect(card).toHaveCSS('background-color', 'rgb(22, 27, 34)');
    await expect(card).toHaveCSS('border-color', 'rgb(48, 54, 61)');
    await expect(card).toHaveCSS('border-radius', '6px');
    await expect(card).toHaveCSS('box-shadow', 'none');
    await expect(badge).toHaveCSS('border-style', 'solid');
    await expect(badge).toHaveCSS('border-width', '1px');
    await recoveryAction.focus();
    await expect(recoveryAction).toHaveCSS('outline-color', 'rgb(88, 166, 255)');
    await expect(recoveryAction).toHaveCSS('outline-width', '2px');
    await expect(recoveryAction).toHaveCSS('outline-offset', '2px');
```

`08-UI-SPEC.md` mandates `2px` focus outline with `3px` offset — so `outline-offset` at `:212` changes from `2px` to `3px`, and `border-radius` at `:206` from `6px` (`--radius-control`) to `10px` if the card is a dialog surface.

**`tests/integration/export-receipt-ui.spec.ts:262-264`** — type-scale assertions that VIS-03 breaks (`16px` section heading is not one of the four permitted sizes):

```ts
    await expect(receipt.locator('h4')).toHaveCSS('font-size', '16px');
    await expect(receipt.locator('h4')).toHaveCSS('font-weight', '600');
```

Same hazard at `responsive-session.spec.ts:989-990` (`font-size`/`line-height` both `16px`).

---

### 9. `DESIGN.md` (doc) — MODIFIED

**Analog:** itself. `DESIGN.md:9-21` documents the *outgoing* palette as normative and will be factually wrong the moment `styles.css` is re-derived:

```markdown
## Color

Source: the existing v1.1 semantic dark contract in `src/web/styles.css`, adapted to a familiar GitHub-dark code-review environment.

- Canvas/inset: `#0D1117` / `#010409`; primary text: `#E6EDF3`.
- Panel/raised: `#161B22` / `#21262D`; secondary and muted text: `#B1BAC4` / `#8B949E`.
- Interactive accent/focus: `#2F81F7` / `#58A6FF`.
- Interactive hover/emphasis and emphasized text: `#292E36`, `#1F6FEB`, and `#FFFFFF`.
- Borders: `#21262D`, `#30363D`, and `#484F58` for emphasis.
- Removed state: `#F85149`; added state: `#3FB950`. Literal minus/plus labels and dashed/solid rails carry the same meaning without color.
- Destructive emphasis: `#B62324`.
- Warning and resolved states use the existing amber `#D29922` and violet `#A371F7` roles only where those states exist.
- Syntax roles: keyword `#D2A8FF`, string `#A5D6FF`, number `#F2CC60`, type `#79C0FF`, invalid `#FFA198`.

Components consume the semantic variables; isolated component hex values are not introduced.
```

The last sentence is the DESIGN.md statement of VIS-01 and stays true. The value list is a **fourth** palette table — the cleanest resolution is to replace the enumerated literals with a pointer to `src/web/styles.css :root` as the single source, which is the same move VIS-01 demands of `expectedValues`.

---

## Shared Patterns

### Repository-root path resolution
**Source:** `scripts/verify-semantic-css.mjs:4-5`, `tests/unit/monaco-theme.test.ts:107`, `vite.config.ts:7`
**Apply to:** the new Vite plugin, `token-contract.ts` callers, the parity gate
```js
const repositoryRoot = resolve(import.meta.dirname, '..');
const sourcePath = resolve(repositoryRoot, 'src/web/styles.css');
```
`import.meta.dirname` is the convention. Avoid the older `dirname(fileURLToPath(import.meta.url))` form at `tests/e2e/responsive-session.spec.ts:30`.

### Throwing gate failures with a labelled prefix
**Source:** `scripts/verify-semantic-css.mjs:64-66`
**Apply to:** the plugin's missing-`:root` error, `token-contract.ts` validation
```js
function fail(message) {
  throw new Error(`Semantic CSS audit failed: ${message}`);
}
```
`token-contract.ts`'s existing counterparts throw bare messages (`monaco-theme.test.ts:115`, `:127`): `` throw new Error(`canonical root missing ${token}`) ``. Keep the bare form for the pure module (it has no single audit identity) and the prefixed form in the script.

### In-process Vite dev server for browser specs
**Source:** `tests/integration/monaco-anchor.spec.ts:31-54`
**Apply to:** verification of the token plugin in the browser tier — nothing to change, but this is why `vite.config.ts` registration alone covers nine specs
```ts
    server = await createServer({
      configFile: resolve(repositoryRoot, 'vite.config.ts'),
      plugins: [ /* spec-local additions */ ],
      server: { host: '127.0.0.1', port: 0 },
    });
    await server.listen();
    return server.resolvedUrls?.local[0]?.replace(/\/$/, '') ?? '';
```

### Gate self-check (proving a gate can fail)
**Source:** `scripts/verify-semantic-css.mjs:369-377`, invoked unconditionally at `:445`
**Apply to:** every new assertion added to the stray-literal gate
```js
function expectAuditFailure(assertion, name) {
  try {
    assertion();
  } catch {
    return;
  }
  fail(`self-check did not reject ${name}`);
}
```

### Non-greedy vs. real CSS block parsing
**Source (lax):** `tests/unit/monaco-theme.test.ts:108` — `/:root\s*\{([\s\S]*?)\}/u`
**Source (strict):** `scripts/verify-semantic-css.mjs:79-145` — `skipCssStringOrComment` / `closingBrace` / `blocks`
**Apply to:** the Vite plugin's `:root` extraction. `RESEARCH.md` proposes `/:root\s*\{([\s\S]*?)\n\}/u` (newline-anchored), which is between the two. Whatever the plugin uses, `token-contract.ts` must use the *same* function so the build tier and both test tiers cannot disagree — that divergence is exactly the bug class the phase exists to kill.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/web/theme/virtual-tokens.d.ts` | config (ambient module declaration) | n/a | Repo contains zero `.d.ts` files under `src/` and zero `declare module` statements anywhere (verified). Planner should follow `08-RESEARCH.md` Pitfall 7 rather than a codebase pattern, and must add the file to `tsconfig.web.json`'s explicit `files` list. |

---

## Hazards the Planner Must Route Around

### Hazard 1 — `build/` is gitignored; `RESEARCH.md`'s proposed plugin path is untracked
`08-RESEARCH.md` recommends `build/token-root-plugin.ts`. `.gitignore:11` contains `build/`, and `git ls-files build` returns nothing — `build/` is **node-gyp output for the native addon** (contains `Makefile`, `Release/`, `binding.Makefile`, `config.gypi`, `gyp-mac-tool`, `directory_exchange.target.mk`). A plugin placed there would be untracked, clobbered by `scripts/build-native-addon.mjs`, and absent from any clone or `npm pack`.

Tracked top-level directories (verified via `git ls-files`): `.claude`, `.github`, `.kimi-code`, `.planning`, `docs`, `mockups`, `scripts`, `src`, `supabase`, `tests`. The plugin must live in `scripts/` (existing convention: `.mjs`, `import.meta.dirname`, 11 sibling files) or under `src/web/theme/`. `scripts/` matches the repo's build-tooling convention and is what `verify-semantic-css.mjs` already does.

### Hazard 2 — `responsive-session.spec.ts` builds and packs; stale `dist/` and packaging both bite
`tests/e2e/responsive-session.spec.ts:725-754` runs a full build then `npm pack --ignore-scripts`, extracts the tarball, and executes `dist/bin/cumpa.mjs` from the extracted package:

```ts
test.beforeAll(() => {
  runPrerequisite(npmCommand, ['run', 'build']);
  const packOutput = runPrerequisite(npmCommand, [
    'pack',
    '--json',
    '--ignore-scripts',
    '--pack-destination',
    packedRoot,
  ]);
  const [packResult] = JSON.parse(packOutput) as PackResult[];
  runPrerequisite('tar', [
    '-xzf',
    join(packedRoot, packResult.filename),
    '-C',
    packedRoot,
  ]);
  symlinkSync(
    join(repositoryRoot, 'node_modules'),
    join(extractedPackageRoot, 'node_modules'),
    'dir',
  );
```

Three consequences:
1. This spec is self-refreshing (`npm run build` first), so it cannot go stale — but it is slow and it is the **only** browser spec that exercises the *built* bundle rather than the dev server. The Vite plugin must therefore work under `vite build`, not just `createServer`.
2. `package.json` `files: ["dist/", "README.md", "LICENSE", "THIRD_PARTY_NOTICES.md"]` — the plugin is a build-time input, never shipped, so no `files` change is needed. `--ignore-scripts` skips `prepack`, which is why the explicit `npm run build` precedes it.
3. **`scripts/verify-semantic-css.mjs` has the real staleness hazard.** It reads `dist/web/index.html` (`:8`) and the linked stylesheet assets (`:450-466`), but nothing in it triggers a build:
```js
const index = await readFile(indexPath, 'utf8');
const cssHrefs = [...index.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi)]
  .map((match) => match[1]);
if (cssHrefs.length === 0) fail('generated index has no application stylesheet link');
```
`dist/` is gitignored. Running the gate without a fresh `npm run build:web` audits a stale (or absent) bundle. The `.planning/quick/260812-dqa-PLAN.md:188-191` verification order handles this by running `build:web` **after** the gate — which is backwards for the generated-CSS half. Any `verify:semantic-css` npm script the phase adds must be `npm run build:web && node scripts/verify-semantic-css.mjs`.

### Hazard 3 — hex casing
`src/web/styles.css:3-80` is uppercase (`#0D1117`). `08-UI-SPEC.md` writes the new palette lowercase (`#0d1117`, `#10151c`, `#a7b1bd`, `#79b8ff`, `#7ee787`, `#ffa198`). `themeHex` (`monaco-theme.test.ts:120-131`) calls `.toUpperCase()` on output, and `verify-semantic-css.mjs`'s `expectedValues` compares raw strings case-sensitively (`:213-216`). Byte parity will fail on casing alone unless one casing is chosen for the root and both gates normalise identically. Monaco's `Color.fromHex` is case-insensitive, so only the gates care.

### Hazard 4 — `satisfies` preserves `colors` key literal types; a computed object destroys them
`src/web/monaco/theme.ts:86` uses `satisfies monaco.editor.IStandaloneThemeData`. `tests/unit/monaco-theme.test.ts:139` and `:142` index with `colors[color as keyof typeof colors]`. If Phase 08 builds `colors` by iterating a mapping table, `keyof typeof colors` degrades to `string`, `Object.keys(colors)` completeness (`:137`) still works at runtime but the compile-time guarantee vanishes. Build the object with explicit literal keys and a `color('--token')` call per value.

### Hazard 5 — the phase touches four independently-authored palette tables, not two
`08-RESEARCH.md` names two (`theme.ts` literals + `monaco-theme.test.ts` mapping). There are four:

| # | Artifact | Location | Kind |
|---|----------|----------|------|
| 1 | `styles.css :root` | `src/web/styles.css:1-86` | 78 declarations — the intended sole source |
| 2 | `CUMPA_THEME` | `src/web/monaco/theme.ts:8-85` | 42 rule foregrounds + 36 colour literals |
| 3 | `expectedValues` + `canonicalTokens` | `scripts/verify-semantic-css.mjs:10-62` | 63 names + ~60 value assertions |
| 4 | `DESIGN.md` colour prose | `DESIGN.md:11-21` | ~20 literals documented as normative |

Plus 40 `rgb(...)` literals across six Playwright specs. VIS-01's "no second palette" is not met until 2, 3, 4 derive from 1 or are reduced to shape-only assertions.

### Hazard 6 — the stray-literal gate is currently red and unwired
`.planning/quick/260812-dqa-SUMMARY.md:54` records `scripts/verify-semantic-css.mjs` as failing on pre-existing drift (two display tokens missing from `canonicalTokens`; four diff alpha values differing from `expectedValues`). It is referenced by no `package.json` script and by no `.github` workflow. The phase inherits a red gate that nothing runs — the RED step must record this baseline honestly rather than presenting a green-to-green transition.

### Hazard 7 — `--space-2xl` / `--space-3xl` have zero `var()` consumers
`styles.css:78-79` declare them; `08-RESEARCH.md` confirms zero consumers. `assertTokenRoot`'s `exact` mode (`:205-207`) rejects non-canonical properties and `canonicalTokens` currently lists them, so deleting them requires editing both the root and `canonicalTokens` in the same commit or the gate fails on "missing".

---

## Metadata

**Analog search scope:** `src/web/`, `scripts/`, `tests/{unit,integration,e2e,package,helpers}/`, root config files (`vite.config.ts`, `vitest.config.ts`, `tsconfig*.json`, `playwright.config.ts`, `package.json`, `.gitignore`), `.github/`, `DESIGN.md`
**Files read:** 20 (`vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `tsconfig.web.json`, `playwright.config.ts`, `package.json`, `.gitignore`, `src/web/styles.css` §§1-90/615-632, `src/web/monaco/theme.ts`, `scripts/verify-semantic-css.mjs`, `scripts/run-focused-vitest.mjs`, `tests/unit/monaco-theme.test.ts`, `tests/e2e/responsive-session.spec.ts` §§1-40/715-760, `tests/e2e/pinned-session.spec.ts`, `tests/integration/monaco-anchor.spec.ts`, `tests/integration/anchored-workspace.spec.ts`, `tests/integration/draft-recovery-ui.spec.ts`, `tests/integration/export-receipt-ui.spec.ts`, `DESIGN.md`, phase `CONTEXT`/`RESEARCH`/`UI-SPEC`)
**Pattern extraction date:** 2026-09-13
**Constraint honoured:** read-only — no source file modified; no lint, build, or test suite executed
