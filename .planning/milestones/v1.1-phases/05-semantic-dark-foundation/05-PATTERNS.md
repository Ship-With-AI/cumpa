# Phase 05: Semantic Dark Foundation — Pattern Map

**Mapped:** 2026-07-26  
**Files analyzed:** 6 likely implementation/test files (plus integration-boundary analogs)
**Analogs found:** 6 / 6 likely files (the forced-colors addition itself has no existing analog)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/web/styles.css` | global stylesheet / design-token contract | transform (semantic tokens → rendered UI) | existing `src/web/styles.css` root, workbench, breakpoint, state rules | exact same file; atomic cutover |
| `scripts/verify-semantic-css.mjs` | dependency-free Node ESM build audit | filesystem validation (source CSS + `dist/web` assets → thrown failure or concise success) | `scripts/verify-production-artifacts.mjs`, with output ownership confirmed by `vite.config.ts` and invocation conventions confirmed by `package.json` | strong structural analog |
| `tests/e2e/responsive-session.spec.ts` | browser contract test | request-response + responsive UI state transitions | existing computed-style/responsive contract in same file | exact |
| `tests/e2e/pinned-session.spec.ts` | packaged browser lifecycle contract test | request-response + loading/security/identity/empty-state transitions | same-file `proveLoadingTransition` helper and `identity session and empty states` packaged flow | exact |
| `tests/integration/draft-recovery-ui.spec.ts` | mounted browser integration test | request-response + corrupt-draft recovery state transitions | same-file `corrupt drafts remain read only until the fingerprint-bound recovery response succeeds` flow | exact |
| `tests/integration/export-receipt-ui.spec.ts` | browser integration test | request-response + export state transitions | existing receipt assertions in same file | exact |
| `src/web/App.vue` | integration boundary (no expected edit) | request-response + responsive drawer state | existing template and `styles.css` import | exact boundary analog; preserve structure |
| `src/web/components/ui/UiPrimitives.vue` | component (no expected edit) | event-driven tooltip state | existing tooltip template and global class hooks | exact boundary analog; CSS-only visual migration |
| `src/web/components/DiffWorkspace.vue` | component (no expected edit) | event-driven editor/comment annotation state | existing Monaco host and annotation boundary | role/data-flow match; Phase 06 excluded |

No new Vue component, dependency, API, persistence, or Monaco adapter file is implied by the approved context/research.

## Pattern Assignments

### `src/web/styles.css` (global stylesheet, transform)

**Analog:** the existing file itself, especially `:root`/`body` at lines 1–42 and 970–1007, workbench rules at 1017–1308, responsive rules at 1314–1401, and state/export rules at 1451–1872.

This is a **single-file sequential migration**. Do not create a third override block or move the existing cascade while recoloring. Replace both competing roots and migrate every consumer in place. The early root currently contains the dark `--color-*` vocabulary and spacing; the later root currently introduces light `--canvas`/`--panel`/`--surface` plus aliases back to `--color-*`. The research audit verified live consumers of both (`--rule` 22 uses, `--surface` 15, `--color-border` 17). A rename-only alias layer is therefore not safe.

**Root/import integration pattern** (existing lines 1–42, 970–1007; first-paint analog `src/web/index.html:3-11`):
```css
:root {
  --color-dominant: #0D1117;
  --color-text-primary: #F0F6FC;
  --space-md: 16px;
  color: var(--color-text-primary);
  background: var(--color-dominant);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 14px;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  min-height: 100dvh;
  background: #0d1117;
}

:focus-visible {
  outline: 2px solid #58a6ff;
  outline-offset: 2px;
}
```
Preserve the existing early `<meta name="color-scheme" content="dark">` in `src/web/index.html`; put `color-scheme: dark`, semantic root/body foreground/background, and the single focus rule in the one replacement root contract. Raw application colors should remain only in token declarations (and system colors in the forced-colors block).

**Semantic token consumer pattern** (copy the existing direct-consumer shape from lines 1090–1165, but use the approved role vocabulary):
```css
.ui-button {
  min-height: 32px;
  padding: 4px 8px;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  background: var(--surface-interactive);
  color: var(--text-primary);
  font: inherit;
  line-height: 20px;
}

.ui-button:hover:not(:disabled) {
  border-color: var(--border-strong);
  background: var(--surface-interactive-hover);
}
```
Use direct semantic roles, not component aliases such as `--button-bg`, and do not retain `--canvas`, `--panel`, `--surface`, `--rule`, or compatibility `--color-*` declarations after migration. Classify each old consumer by responsibility: canvas/inset/panel/raised/interactive, text primary/secondary/muted, boundary strength, status meaning, focus, selection, or future diff role.

**State/surface analogs** (existing lines 45–99, 1017–1088, 1451–1515):
```css
.loading-shell,
.unavailable-shell { min-height: 100vh; min-height: 100dvh; padding: var(--space-xl); }

.state-card {
  width: min(100%, 680px);
  padding: var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-secondary);
  text-align: center;
}

.diff-state,
.review-main > .empty-state {
  margin: 24px;
  padding: 24px;
  border: 1px solid var(--rule);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
}
```
Keep loading, unavailable, empty, recovery, review, and export DOM/class hooks. Re-map these selectors to semantic roles and normalize the approved 6px contained-card radius where applicable; do not change copy or layout mechanics.

**Overlay/elevation and responsive analog** (existing lines 1025–1051, 1314–1366):
```css
.comments-rail { background: var(--surface-panel); box-shadow: none; }

@media (max-width: 1439px) {
  .comments-rail {
    position: absolute;
    z-index: 7;
    transform: translateX(100%);
    transition: transform 120ms ease-out;
    box-shadow: 0 8px 24px rgb(0 0 0 / 40%);
  }
}
```
Preserve 1439/1099/767 breakpoint behavior, transforms, widths, and transitions. Static panes/editor hosts and active/pressed controls have no shadow; only an open comments rail, files drawer, identity panel, keyboard-help/dialog, tooltip, or the floating gutter-action label may use exterior overlay elevation. The only non-elevation inset shadows are the exact resting `.tree-row--selected` and `.view-tab[aria-selected="true"]` selected/current rails described below. Do not add breakpoints or transfer Monaco/document scrolling.

**Control/status/focus analogs** (existing lines 1136–1165, 1459–1535, 1569–1580):
- Keep `.ui-button`, legacy `identity-disclosure`/`copy-button`/`retry-button`, textarea, checkbox, and native control hooks. Give dark background, text, border, caret/placeholder, hover/focus/disabled/autofill-safe rules explicitly; do not use opacity-only disabled styling.
- Preserve existing `.inline-notice`, `.draft-recovery__notice`, warning/error classes and their labels/roles. Convert colored inherited text to readable `text-primary` body text with semantic foreground border/rail and subtle status backgrounds.
- Use one `:focus-visible` rule: `2px solid var(--focus-ring)` and `2px` offset; no later duplicate override.
- Remove the existing inset pressed effects. Every control selector arm containing `:active` or `[aria-pressed="true"]` must explicitly set `box-shadow: none`, including a selected view tab while pressed. The complete ordinary-palette inset allowlist is `.tree-row--selected { box-shadow: inset 3px 0 var(--selection-border); }` and `.view-tab[aria-selected="true"] { box-shadow: inset 0 -3px var(--selection-border); }` at rest; no focus rule, static surface, active/pressed control, or other selector receives an inset shadow.

**Forced-colors addition (no existing analog):**
```css
@media (forced-colors: active) {
  :focus-visible { outline-color: Highlight; }
  .ui-button, textarea {
    border-color: ButtonBorder;
    background: ButtonFace;
    color: ButtonText;
  }
  .tree-row--selected { border-left: 3px solid Highlight; }
}
```
This is a targeted system-color repair at stylesheet end, not a second theme/token system. Include `Canvas`, `CanvasText`, `ButtonFace`, `ButtonText`, `ButtonBorder`, `LinkText`, `Highlight`, `HighlightText`, and `GrayText` where needed; retain explicit boundaries/rails/focus after forced-color shadow removal. Do not set `forced-color-adjust: none` on ordinary workspace UI.

**Typography/spacing analogs:** existing root system/monospace split and `--space-xs` through `--space-3xl` (lines 1–26), `.diff-workspace__side-labels span` (lines 1203–1210), and export metadata (lines 1600+). Keep system UI for interface and existing `ui-monospace` for paths, hashes, IDs, line metadata. Migrate live 18px headings (`.comments-rail h3`, `.active-file-strip h1`, `.export-section h3,h4`) to the four-size contract: 16px/24px/600. Keep 4/8/16/24/32/48/64 rhythm and existing 288px/360px/640px geometry.

**Explicit scope warning:** do not style Monaco descendants, call `defineTheme`/`setTheme`, change diff options/models/decorations/view zones/gutter geometry, or edit `src/web/monaco/diff-adapter.ts`; those are Phase 06. Do not redesign detailed comments/review surfaces (Phase 07) or claim final responsive/forced-colors proof (Phase 08).

### `scripts/verify-semantic-css.mjs` (dependency-free Node ESM build audit)

**Analog:** `scripts/verify-production-artifacts.mjs` resolves the repository root with `resolve(import.meta.dirname, '..')`, owns paths beneath `dist/web`, uses only `node:` filesystem/path APIs, throws descriptive `Error` failures, and emits one concise success line. `vite.config.ts` confirms that Vite exclusively owns `dist/web` through `outDir: resolve(import.meta.dirname, 'dist/web')`; `package.json` confirms ESM, Node 24+, `build:web`, and direct `node scripts/*.mjs` verification conventions.

Reuse those conventions exactly: derive source and generated paths from an `import.meta.dirname` repository root rather than the process working directory; inspect only the Vite-owned `dist/web/index.html` and its emitted stylesheet assets; remain dependency-free Node ESM; throw immediately with source/generated context for every failed invariant or missing asset; print one concise success message only after every check passes. Do not add a dependency or package script.

### `tests/e2e/responsive-session.spec.ts` (browser contract test, request-response + responsive transitions)

**Analog:** existing same-file packaged Chromium test, especially helpers `readStyles` (lines 187–210), `contrastRatio` (lines 215–240), `assertNoPageOverflow` (lines 242–249), fixture/session route setup, and the `responsive keyboard and accessibility contract` test (lines 397–685).

Preserve conventions:
- Run the packaged CLI/session fixture and exact Chromium prerequisite; do not replace with a static HTML mock.
- Inspect browser behavior via `getComputedStyle`, not source-text substring tests.
- Reuse `readStyles` fields for background/border/shadow/type/focus/motion and `contrastRatio` for deterministic checks.
- Keep `test.step(...)` grouping, `expect(...)` diagnostics, viewport transitions at 1440/1439/1100/1099/768/375/320, and `assertNoPageOverflow`.

The existing token step reads `:root` custom properties and injects representative `.inline-notice`, `.draft-recovery__notice`, and `.ui-button--destructive` fixtures (lines 397–515); replace assertions for the old light token vocabulary with the approved one semantic dark vocabulary and representative composed status/control styles. Retain typography checks and change expected system font, 16/24 heading scale, 400/600 weights, and exact line heights. Retain rail/drawer/focus/inert checks (lines 593–679), adding targeted static `box-shadow: none`, overlay shadow, native control, and `page.emulateMedia({ forcedColors: 'active' })` checks as required by the contract. Do not turn this into a full Phase 08 accessibility audit.

### `tests/e2e/pinned-session.spec.ts` (packaged browser lifecycle contract, request-response + state transitions)

**Analog:** same-file `proveLoadingTransition` (lines 193–202) and `identity session and empty states` packaged flow (beginning at line 636). The helper already gates `/api/session` before continuing the real generated-package request, and the named flow already covers ready identity, 403 unavailable, 500 error, stopped session, dirty identity, and zero-file empty states.

Preserve the exact Chromium prerequisite, generated CLI/package launch, route gate, security redaction, clipboard/copy, stopped-session, identity, and empty-state assertions. Add computed-style evidence inside those existing transitions: inspect root/body/loading before releasing `proveLoadingTransition`, then the actual unavailable/error/stopped and empty shells/cards after each route or package state resolves. Do not replace these seams with an injected static fixture or change deterministic response timing beyond the existing gate.

### `tests/integration/draft-recovery-ui.spec.ts` (mounted browser integration test, corrupt-draft recovery flow)

**Analog:** same-file `corrupt drafts remain read only until the fingerprint-bound recovery response succeeds` mounted flow (beginning at line 135). It already mounts the real Vite application, drives reveal/copy/confirmation/pending/failure/success states, and proves the fingerprint-bound request body plus byte-preserving read-only recovery behavior.

Add computed-style assertions for the rendered recovery shell, card, badge, notice, controls, pending/disabled state, focus, and static no-shadow contract inside that same flow. Preserve the Vite server seam, request/body evidence, safe path handling, byte/fingerprint guarantees, confirmation/Escape/focus behavior, and recovery outcome assertions; do not create an isolated visual-only test.

### `tests/integration/export-receipt-ui.spec.ts` (browser integration test, export request-response)

**Analog:** same-file receipt flow test (lines 149–223). It drives export, reveal failure, clipboard success/failure, disclosure expansion, accessible descriptions, and narrow viewport overflow before asserting receipt heading styles.

Preserve the complete behavioral flow and only update superseded visual contract values:
```ts
await expect(receipt.locator('h4')).toHaveCSS('font-size', '16px');
await expect(receipt.locator('h4')).toHaveCSS('font-weight', '600');
await expect(receipt.locator('h4')).toHaveCSS('line-height', '24px');
```
Do not alter export mechanics, copy strings, accessibility names, or receipt data assertions.

## Integration Boundaries (No Expected Source Edits)

### `src/web/App.vue`

**Analog:** existing `styles.css` import at the end of the file and stable shell/template hooks (`loading-shell`, `unavailable-shell`, `session-shell`, `review-shell`, `review-files`, `review-main`, `comments-rail`, `empty-state`, `diff-state`) at lines 756–912. CSS is imported once globally; loading/error/recovery/workspace states all pass through this boundary. Preserve event handlers, `inert`, `aria-hidden`, focus behavior, DOM order, and copy. A template edit is justified only if an existing semantic hook is demonstrably insufficient; research found none.

### `src/web/components/ui/UiPrimitives.vue`

**Analog:** tooltip state/events at lines 16–26. Preserve focusin/focusout, mouseenter/mouseleave, Escape dismissal, `role="tooltip"`, and `.ui-tooltip`/`.ui-tooltip__content` hooks. Restyle tooltip as raised dark overlay (12px/16px, 4px radius, 1px border, overlay shadow) in CSS; do not rewrite Vue behavior.

### `src/web/components/DiffWorkspace.vue`

**Analog:** Monaco host/annotation boundary and class hooks (`diff-workspace`, `diff-workspace__editor`, `diff-workspace__side-labels`, `diff-workspace__gutter-action`, `inline-comment-composer`, `inline-accepted-comment`) in the existing component/template and adapter calls. Style host/surrounding labels/borders/focus roles only. Do not touch Monaco internals or adapter theme APIs; Phase 06 owns that mapping.

## Shared Patterns

### One semantic vocabulary
**Source:** `src/web/styles.css` root and all consumers.  
**Apply to:** every stylesheet selector.  
Declare one role-based root (`surface-*`, `text-*`, `border-*`, `interactive-*`, `status-*`, `focus`, `selection`, diff-facing roles) and consume those roles directly. No duplicate root, component-named tokens, compatibility aliases, or raw legacy names.

### Responsive visual tiers
**Source:** existing `.comments-rail` and `.review-files` breakpoint rules.  
**Apply to:** panes/drawers/overlays.  
Static regions use surface steps/borders/no shadow; breakpoint-promoted overlays use raised surface and overlay shadow while preserving transforms, widths, focus restoration, and overflow ownership.

### Accessibility semantics are preserved
**Sources:** `App.vue`, `FileRow.vue`, `StatusBadge.vue`, `InlineNotice.vue`, and responsive test.  
**Apply to:** all statuses, selected rows, controls, drawers.  
Retain text/icon/`+`/`−`/label/rail cues, ARIA/inert/role/live-region semantics, and persistent 2px focus-visible outline. Color alone must not carry meaning.

## No Analog Found

| Addition | Role | Data Flow | Reason |
|---|---|---|---|
| `@media (forced-colors: active)` CSS fallback | accessibility stylesheet rule | transform (OS palette → rendered UI) | No existing forced-colors block exists in `src/web/styles.css`; use the approved system-color contract rather than inventing a project convention. |

## Metadata

**Analog search scope:** `src/web/styles.css`, `src/web/index.html`, `src/web/App.vue`, `src/web/components/ui/UiPrimitives.vue`, `src/web/components/DiffWorkspace.vue`, `scripts/verify-production-artifacts.mjs`, `vite.config.ts`, `package.json`, `tests/e2e/responsive-session.spec.ts`, `tests/e2e/pinned-session.spec.ts`, `tests/integration/draft-recovery-ui.spec.ts`, `tests/integration/export-receipt-ui.spec.ts`
**Files scanned:** 12 targeted files
**Pattern extraction date:** 2026-07-26
