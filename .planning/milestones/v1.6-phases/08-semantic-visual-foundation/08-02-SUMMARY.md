---
phase: 08-semantic-visual-foundation
plan: "02"
subsystem: ui
tags: [css, semantic-tokens, vite, monaco, vue]

requires:
  - phase: 08-semantic-visual-foundation
    provides: Pure token contract, Vite virtual token module, and shared node loader from plan 08-01.
provides:
  - One lowercase, context-free CSS semantic token root derived from the approved quiet-workspace mockup.
  - Consumer cutover with no retired token references or stray production paint/type literals.
  - Design prose that identifies the root rather than maintaining a competing palette.
affects: [08-03-monaco-theme, 08-04-semantic-css-audit, 08-05-browser-contracts]

tech-stack:
  added: []
  patterns: ["CSS consumers reference the canonical root instead of authored palette or typography literals."]

key-files:
  created:
    - .planning/phases/08-semantic-visual-foundation/08-02-SUMMARY.md
  modified:
    - src/web/styles.css
    - src/web/prototypes/Phase6DiffSemanticsPrototype.vue
    - DESIGN.md

key-decisions:
  - "Kept display, control-state, alpha-layer, shadow, warning, resolved, destructive, and icon continuity values with source citations."
  - "Mapped both retired section-heading consumer groups to the authored page-heading role."
  - "Kept forced-colors and reduced-motion overrides byte-unchanged."

patterns-established:
  - "New visual values belong in src/web/styles.css :root; consumers use semantic var() references."

requirements-completed: [VIS-01, VIS-03]

duration: 17m
completed: 2026-09-13
status: complete
---

# Phase 08 Plan 02: Semantic Token Cutover Summary

**The approved quiet-workspace palette, type roles, density vocabulary, and every migrated consumer now converge on one CSS root.**

## Performance

- **Duration:** 16m 30s
- **Started:** 2026-09-13T06:57:15Z
- **Completed:** 2026-09-13T07:13:45Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Re-authored the single context-free `:root` with lowercase mockup-derived surfaces, text, boundaries, interaction, status/diff, syntax, type, geometry, spacing, and Monaco alpha roles.
- Repointed all production and prototype token consumers; no retired `var()` name or direct production color/type literal remains.
- Removed DESIGN.md's normative palette, type, and geometry enumerations while retaining semantic and accessibility intent.

## Token cutover ledger

The pre-cutover column is the observed `var()` consumer count before this plan's edit; `—` means the root token itself had no `var()` consumer. New-only rows have no prior token. Mockup citations refer to `mockups/01-quiet-workspace.html:8-12`; continuity citations identify the governing UI-SPEC row or carried-forward source.

| Old name | Old value | New name | New value | Disposition | Pre-cutover consumer count | Mockup / continuity citation |
|---|---|---|---|---|---:|---|
| `--surface-canvas` | `#0D1117` | `--surface-canvas` | `#0d1117` | kept, case-normalized | — | mockup `--bg` |
| `--surface-inset` | `#010409` | `--surface-sidebar`, `--surface-empty`, `--surface-gap` | `#10151c`, `#12171e`, `#111821` | retired and split by role | — | UI-SPEC palette; mockup |
| `--surface-panel` | `#161B22` | `--surface-panel` | `#161b22` | kept, case-normalized | — | mockup `--panel` |
| `--surface-raised` | `#21262D` | `--surface-raised` | `#21262d` | kept, case-normalized | — | mockup `--raised` |
| `--surface-interactive` | `#21262D` | `--surface-interactive` | `var(--surface-raised)` | alias | — | D-INTERACTIVE; mockup raised surface |
| `--surface-interactive-hover` | `#292E36` | `--surface-interactive-hover` | `#292e36` | retained | — | approved continuity, old `styles.css:8` |
| `--surface-interactive-active` | `#30363D` | `--surface-interactive-active` | `#30363d` | retained | — | approved continuity, old `styles.css:9` |
| `--text-primary` | `#E6EDF3` | `--text-primary` | `#e6edf3` | kept, case-normalized | — | mockup `--text` |
| `--text-secondary` | `#B1BAC4` | `--text-muted` | `#a7b1bd` | retired | 15 | UI-SPEC metadata role; mockup |
| `--text-muted` | `#8B949E` | `--text-muted`, `--text-line-number`, `--text-hunk` | `#a7b1bd`, `#8794a5`, `#adc8e6` | re-valued and expanded | — | UI-SPEC palette; mockup |
| `--text-on-emphasis` | `#FFFFFF` | `--text-on-emphasis` | `#fff` | kept, case-normalized | — | mockup |
| `--border-muted` | `#21262D` | `--border-gap`, `--border-hunk` | `#252d38`, `#293849` | retired and split by role | 1 | UI-SPEC palette; mockup |
| `--border-default` | `#30363D` | `--border-default` | `#30363d` | kept, case-normalized | — | mockup `--border` |
| `--border-strong` | `#484F58` | `--border-control` | `#4e5b6b` | retired | 7 | D-BORDER; UI-SPEC control boundary |
| `--control-boundary` | `#8B949E` | `--border-control` | `#4e5b6b` | retired | 1 | D-BORDER; UI-SPEC control boundary |
| `—` | `—` | `--border-overlay` | `#596678` | new | — | UI-SPEC dialog boundary; mockup |
| `--interactive-accent` | `#2F81F7` | `--interactive-accent` | `#79b8ff` | re-valued | — | mockup `--blue` |
| `--interactive-accent-emphasis` | `#1F6FEB` | `--interactive-accent-emphasis`, `--interactive-accent-emphasis-hover` | `#1f6feb`, `#2b7afa` | kept and expanded | — | UI-SPEC palette; mockup |
| `--focus-ring` | `#58A6FF` | `--focus-ring` | `#58a6ff` | kept, case-normalized | — | mockup `--focus` |
| `--selection-background` | `rgb(56 139 253 / 35%)` | `--selection-background`, `--text-selection-background` | `#1a2b43`, `#254d79` | re-valued and expanded | — | UI-SPEC palette; mockup |
| `--selection-border` | `#58A6FF` | `--selection-border` | `#345477` | re-valued | — | UI-SPEC palette; mockup |
| `--scrollbar-thumb` | `—` | `--scrollbar-thumb` | `#536174` | new | — | UI-SPEC palette; mockup |
| `--destructive-foreground` | `#F85149` | `--destructive-foreground` | `#ffa198` | re-valued | — | UI-SPEC destructive role; mockup red |
| `--destructive-emphasis` | `#B62324` | `--destructive-emphasis` | `#b62324` | kept | — | approved continuity, UI-SPEC:166 |
| `--status-success-foreground`, `--status-success-background` | `#3FB950`, `rgb(46 160 67 / 15%)` | same | `#7ee787`, `#122b22` | re-valued | — | mockup green/added |
| `--status-warning-foreground`, `--status-warning-background` | `#D29922`, `rgb(187 128 9 / 15%)` | same | `#d29922`, `var(--surface-raised)` | foreground retained; background role-aligned | — | foreground continuity, UI-SPEC:164; raised mockup |
| `--status-error-foreground`, `--status-error-background` | `#F85149`, `rgb(248 81 73 / 15%)` | same | `#ffa198`, `#321c23` | re-valued | — | mockup red/removed |
| `--status-information-foreground`, `--status-information-background` | `#58A6FF`, `rgb(56 139 253 / 15%)` | same | `var(--focus-ring)`, `var(--selection-background)` | root aliases | 16 | D-INFORMATION; mockup aliases |
| `--status-resolved-foreground`, `--status-resolved-background` | `#A371F7`, `rgb(163 113 247 / 15%)` | same | `#a371f7`, `var(--surface-raised)` | foreground retained; background role-aligned | — | foreground continuity, UI-SPEC:165; raised mockup |
| `--status-pending-foreground`, `--status-pending-background` | `#B1BAC4`, `#21262D` | same | `var(--text-muted)`, `var(--surface-raised)` | re-pointed | — | mockup aliases |
| `--status-disabled-foreground`, `--status-disabled-background` | `#8B949E`, `#161B22` | same | `var(--text-muted)`, `var(--surface-panel)` | re-pointed | — | mockup aliases |
| `—` | `—` | `--status-modified-*`, `--status-added-*`, `--status-deleted-*` | UI-SPEC foreground/background/border triads | new | — | UI-SPEC status table; mockup |
| `--diff-addition-foreground`, `--diff-addition-background` | `#3FB950`, `rgb(46 160 67 / 22%)` | same | `#7ee787`, `#122b22` | re-valued | — | mockup green/added |
| `--diff-addition-intraline-background` | `rgb(46 160 67 / 45%)` | same | unchanged | retained | — | approved continuity, UI-SPEC:162 |
| `--diff-deletion-foreground`, `--diff-deletion-background` | `#F85149`, `rgb(248 81 73 / 22%)` | same | `#ffa198`, `#321c23` | re-valued | — | mockup red/removed |
| `--diff-deletion-intraline-background` | `rgb(248 81 73 / 45%)` | same | unchanged | retained | — | approved continuity, UI-SPEC:163 |
| `--diff-hunk-foreground` | `#A371F7` | `--diff-hunk-foreground` | `var(--text-hunk)` | re-pointed | — | UI-SPEC hunk role; mockup |
| `--diff-hunk-background`, `--diff-region-border` | `—` | same | `var(--surface-hunk)`, `var(--border-hunk)` | new | — | UI-SPEC hunk roles; mockup |
| `--diff-empty-background`, `--diff-unchanged-background` | `var(--surface-inset)` | same | `var(--surface-empty)`, `var(--surface-canvas)` | re-pointed | — | UI-SPEC split-diff roles; mockup |
| `--syntax-keyword-foreground` | `#D2A8FF` | same | `#ffb5ab` | re-valued | — | UI-SPEC syntax; mockup |
| `--syntax-string-foreground` | `#A5D6FF` | same | `#b4d7ff` | re-valued | — | UI-SPEC syntax; mockup |
| `--syntax-number-foreground`, `--syntax-type-foreground` | `#F2CC60`, `#79C0FF` | same | `#79b8ff` | re-valued | — | UI-SPEC syntax; mockup blue |
| `--syntax-invalid-foreground` | `#FFA198` | same | `#ffa198` | kept, case-normalized | — | UI-SPEC syntax; mockup red |
| `—` | `—` | `--syntax-default-foreground`, `--syntax-comment-foreground` | `var(--text-primary)`, `var(--text-muted)` | new aliases | — | UI-SPEC syntax; mockup aliases |
| `--font-size-section-heading`, `--line-height-section-heading` | `16px`, `24px` | removed; consumers use page-heading pair | `21px`, `31.5px` | retired | 2 each | D-RETIRE-SECTION; UI-SPEC type table |
| `--font-size-page-heading`, `--line-height-page-heading` | `20px`, `28px` | same | `21px`, `31.5px` | re-valued | 1 each | UI-SPEC type table; mockup |
| `--font-size-display`, `--line-height-display` | `clamp(2rem, 8vw, 3.5rem)`, `1.05` | same | unchanged | retained | 1 each | approved continuity, D-KEEP-DISPLAY |
| `--font-size-metadata`, `--line-height-metadata` | `12px`, `16px` | same | `12px`, `18px` | line height re-valued | — | UI-SPEC type table; mockup |
| `--font-size-code`, `--line-height-code` | `13px`, `20px` | same | `13px`, `26px` | line height re-valued | — | UI-SPEC type table; mockup |
| `--font-size-body`, `--line-height-body` | `14px`, `20px` | same | `14px`, `21px` | line height re-valued | 7 body line-height | UI-SPEC type table; mockup |
| `--font-ui`, `--font-mono`, `--font-weight-regular`, `--font-weight-semibold` | existing stacks and weights | same | canonical root stacks and weights | retained | — | UI-SPEC type contract |
| `--radius-compact` | `4px` | `--radius-control` for existing consumers; `--radius-file-row` added | `6px`; `5px` file-row role | retired and role-split | 5 | UI-SPEC geometry; mockup |
| `--radius-control` | `6px` | same | `6px` | kept | 9 | UI-SPEC geometry; mockup |
| `--radius-overlay` | `8px` | same; `--radius-scrollbar` added | `10px`; `8px` scrollbar role | re-valued and split | 3 | UI-SPEC geometry; mockup |
| `--radius-pill` | `999px` | same | unchanged | retained | 1 | D-INFORMATION; mockup badge rule |
| `--tree-indent` | `20px` | same | `20px` | retained | 1 | mockup spacing |
| `--border-width-default`, `--focus-outline-width`, `--focus-offset`, `--selected-rail-width` | existing geometry | same | canonical geometry tokens | retained | — | UI-SPEC geometry; mockup |
| `—` | `—` | `--control-height-standard`, `--control-height-compact`, `--file-row-min-height`, `--diff-row-height`, `--diff-gutter-width`, `--diff-sign-width`, `--sidebar-width`, `--dialog-width`, `--dialog-max-height`, `--icon-size` | UI-SPEC density values | new | — | UI-SPEC geometry; mockup; icon continuity UI-SPEC:23 |
| `--space-xs`, `--space-sm`, `--space-md`, `--space-lg`, `--space-xl` | `4px`, `8px`, `16px`, `24px`, `32px` | `--space-1`, `--space-2`, `--space-4`, `--space-6`, `--space-8` | same values | renamed | 34, 68, 59, 19, 3 | UI-SPEC spacing; mockup |
| `—` | `—` | `--space-3`, `--space-5` | `12px`, `20px` | new | — | UI-SPEC spacing; mockup |
| `--space-2xl`, `--space-3xl` | `48px`, `64px` | removed | `—` | deleted, zero consumer | 0, 0 | D-DEAD |
| `--shadow-overlay` | `0 8px 24px rgb(0 0 0 / 40%)` | same | unchanged | retained | — | approved continuity, D-SHADOW |
| `—` | `—` | `--surface-scrim`, `--monaco-whitespace-foreground`, `--monaco-inactive-selection-background`, `--monaco-scrollbar-hover-background`, `--monaco-scrollbar-active-background` | root-owned alpha values | new | — | approved continuity, D-SCRIM and D-MONACO-ALPHA |

### Consumer evidence

- The retired-token scan observed **211** pre-cutover references across `src/web` (the plan's historical inventory said 190) and **0** afterward.
- The prototype has **148** `var()` references after cutover; `comm -23` against the root declaration set produced no output.
- The retired heading group (`.state-card h2` through `.review-panel h4`) and `.review-context-header__file h1` both now use `--font-size-page-heading` / `--line-height-page-heading`; semibold remains the hierarchy cue where it was already present.
- The reduced-motion and forced-colors blocks have no diff hunks; selector-preservation check produced zero changed class-selector lines.

## Task Commits

1. **Task 1: Author the canonical semantic token root** — `53722f7` (`feat`)
2. **Task 2: Cut every consumer over to the canonical root** — `318dcce` (`feat`), corrected by `ccb1a0d` (`fix`) to route the dialog's final former strong-boundary consumer to `--border-control`.
3. **Task 3: Retire the palette prose in DESIGN.md** — `e8842b9` (`docs`)

## Files Created/Modified

- `src/web/styles.css` — canonical token root and token-only stylesheet consumers.
- `src/web/prototypes/Phase6DiffSemanticsPrototype.vue` — live token names only in the scoped style block.
- `DESIGN.md` — role-based visual guidance that names the canonical root.
- `.planning/phases/08-semantic-visual-foundation/08-02-SUMMARY.md` — cutover ledger and verification evidence.

## Verification

Passed:

- `npm run build:web` (after the final boundary correction).
- `npx vitest run tests/unit/workspace-state.test.ts` — 14 tests passed.
- `npx vitest run tests/unit/monaco-diff-semantics.test.ts` — 6 tests passed.
- `npx vitest run tests/unit/monaco-diff-adapter.test.ts` — 1 test passed.
- Root invariant checks: 0 duplicate declarations, 0 uppercase custom-property hex declarations, 1 `:root`, 1 `color-scheme: dark`.
- Retired vocabulary, backdrop literal, non-root paint literal, and numeric consumer type-literal scans produced no matches; DESIGN.md has 0 hex literals and names `src/web/styles.css` twice.

Known red gates, intentionally left for their owning plans:

- `npm run test:unit -- tests/unit/monaco-theme.test.ts` failed in `tests/unit/monaco-theme.test.ts`: `canonical root missing --surface-inset` at `rootColor` (`tests/unit/monaco-theme.test.ts:115:34`). The command also runs the entire `tests/unit` category and reported the unrelated isolation failure `expected ... "contaminated": false` / received `"contaminated": true` from `tests/unit/omp-isolation.test.ts:32:24`. 08-03 owns the Monaco theme remapping.
- `node scripts/verify-semantic-css.mjs` failed exactly with `Semantic CSS audit failed: source CSS token root is missing --surface-inset`. 08-04 owns its canonical-name and expected-value tables.
- `npm run test:browser` completed with 86 passed and 8 failed. The deliberate visual-contract failures include: review control boundary contrast expected `>= 3`, received `1.8228377006969865`; Monaco anchor expected `rgb(47, 129, 247) 3px 0px 0px 0px inset`, received `rgb(121, 184, 255) 3px 0px 0px 0px inset`; export heading expected `16px`, received `21px`; empty fill expected `rgb(1, 4, 9)`, received `rgb(18, 23, 30)`; and selected-text outline expected `rgb(88, 166, 255)`, received `rgb(52, 84, 119)`. It also reported pre-existing environment/contract failures: selected file tree `tabindex` expected `0`, received `-1`; `[marketplace-review] CUMPA_MARKETPLACE_URL_MARKER required`; and `[runtime-artifact] CUMPA_RUNTIME_CUSTODY_DIR required`. 08-05 owns browser contract updates.

## Decisions Made

- Used the Phase 08 UI specification and `01-quiet-workspace` mockup as the value authority; Phase 09's `01b` mockup was not used.
- Retained only the planned continuity values, with comments at their root declarations; the direct backdrop color became `--surface-scrim`.
- Applied D-BORDER uniformly: the dialog's former strong boundary now resolves through `--border-control`, while `--border-overlay` remains canonical vocabulary for later overlay-specific consumers.

## Deviations from Plan

### Auto-fixed Issues

**1. Rule 1 — correctness: final former strong-boundary consumer used the overlay boundary.**

- **Found during:** final ledger review.
- **Issue:** D-BORDER requires every `--border-strong` consumer to move to `--border-control`.
- **Fix:** Repointed `.support-dialog` from `--border-overlay` to `--border-control`.
- **Files modified:** `src/web/styles.css`.
- **Verification:** final web build succeeded; retired-token scan is empty.
- **Committed in:** `ccb1a0d`.

**Total deviations:** 1 auto-fixed correctness correction. No scope creep.

## Issues Encountered

- The package's `test:unit` script fixes `tests/unit` as its first Vitest path, so appending one test path still executes the category. The required workspace-state target passed when executed directly; the package command remains red because this plan intentionally removed `--surface-inset` before 08-03 updates its Monaco test.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 08-03 can consume the stable root and the four root-owned Monaco alpha layers to replace literal Monaco theme mappings.
- 08-04 can update its stale canonical token and expected-value tables from this ledger.
- 08-05 can revise visual browser assertions to the approved semantic contract.

---
*Phase: 08-semantic-visual-foundation*
*Completed: 2026-09-13*
