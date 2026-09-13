---
phase: 08-semantic-visual-foundation
plan: "03"
subsystem: ui
tags: [monaco, vite, vitest, semantic-tokens]

requires:
  - phase: 08-semantic-visual-foundation
    provides: Canonical semantic root, token normalizer, and virtual token module from plans 08-01 and 08-02.
provides:
  - Monaco theme values derived from the canonical root at build time
  - A non-tautological Monaco token-name parity gate with source-shape and totality checks
  - Canonical six-digit emphasis color compatible with the shared token transform
affects: [08-04-semantic-css-audit, 08-05-browser-contracts, Monaco theme]

tech-stack:
  added: []
  patterns: [Monaco colors and token rules resolve through virtual canonical-root declarations with independently stated token-name mappings]

key-files:
  created:
    - .planning/phases/08-semantic-visual-foundation/08-03-SUMMARY.md
  modified:
    - src/web/monaco/theme.ts
    - src/web/styles.css
    - tests/unit/monaco-theme.test.ts

key-decisions:
  - "Keep Monaco color keys explicit in an object literal so satisfies preserves literal key types."
  - "Keep transparent Monaco instructions as one named sentinel rather than semantic CSS vocabulary."
  - "State expected key-to-token names independently in the test so a wrong token repoint fails by key name."

patterns-established:
  - "Monaco receives canonical build-time hex via virtual:cumpa-tokens and toMonacoHex; it never reads DOM custom properties."
  - "Tests compare canonical bytes but independently own the Monaco-key-to-token contract."

requirements-completed: [VIS-02]
duration: 12min
completed: 2026-09-13
status: complete
---

# Phase 08 Plan 03: Monaco Theme Canonical Derivation Summary

**The Monaco theme now resolves every painted color and token foreground from the canonical semantic root, with a parity gate that rejects both unmapped keys and a second palette.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-09-13T07:21:49Z
- **Completed:** 2026-09-13T07:33:07Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Replaced 42 literal tokenizer foregrounds and 36 literal Monaco colors with canonical root token resolution through `virtual:cumpa-tokens`, `parseTokenRoot`, and `toMonacoHex`.
- Preserved literal Monaco color key types with `satisfies`, retained the two deliberately unpainted values through one named sentinel, and left registration timing unchanged.
- Reworked the parity test to use the shared root loader/normalizer, assert full color/rule totality, reject source literals, and prove opaque line fills remain distinct from eight-digit intraline fills.

## Monaco Color-Key Mapping

| Monaco key | Canonical source |
|---|---|
| `editor.background` | `--surface-canvas` |
| `editor.foreground` | `--text-primary` |
| `editorGutter.background` | `--surface-sidebar` |
| `editorLineNumber.foreground` | `--text-line-number` |
| `editorLineNumber.activeForeground` | `--text-primary` |
| `editorCursor.foreground` | `--focus-ring` |
| `editorWhitespace.foreground` | `--monaco-whitespace-foreground` (previously unnamed) |
| `editorIndentGuide.background1` | `--border-gap` (previously unnamed) |
| `editorIndentGuide.activeBackground1` | `--border-default` (previously unnamed) |
| `editor.selectionBackground` | `--selection-background` |
| `editor.inactiveSelectionBackground` | `--monaco-inactive-selection-background` (previously unnamed) |
| `editor.selectionForeground` | `--text-on-emphasis` |
| `editor.lineHighlightBackground` | `UNPAINTED_COLOR` sentinel |
| `editor.lineHighlightBorder` | `--border-control` |
| `editorOverviewRuler.border` | `--border-default` (previously unnamed) |
| `diffEditor.insertedLineBackground` | `--diff-addition-background` |
| `diffEditor.removedLineBackground` | `--diff-deletion-background` |
| `diffEditor.insertedTextBackground` | `--diff-addition-intraline-background` |
| `diffEditor.removedTextBackground` | `--diff-deletion-intraline-background` |
| `diffEditorGutter.insertedLineBackground` | `--diff-addition-background` |
| `diffEditorGutter.removedLineBackground` | `--diff-deletion-background` |
| `diffEditorOverview.insertedForeground` | `--diff-addition-foreground` |
| `diffEditorOverview.removedForeground` | `--diff-deletion-foreground` |
| `diffEditor.border` | `--diff-region-border` |
| `diffEditor.diagonalFill` | `--diff-empty-background` |
| `diffEditor.unchangedCodeBackground` | `--diff-unchanged-background` |
| `diffEditor.unchangedRegionBackground` | `--surface-panel` |
| `diffEditor.unchangedRegionForeground` | `--diff-hunk-foreground` |
| `diffEditor.unchangedRegionShadow` | `UNPAINTED_COLOR` sentinel |
| `editorWidget.background` | `--surface-interactive` |
| `editorWidget.foreground` | `--text-primary` |
| `editorWidget.border` | `--border-default` |
| `editorHoverWidget.background` | `--surface-interactive` |
| `editorHoverWidget.foreground` | `--text-primary` |
| `editorHoverWidget.border` | `--border-default` |
| `focusBorder` | `--focus-ring` |
| `scrollbarSlider.background` | `--scrollbar-thumb` |
| `scrollbarSlider.hoverBackground` | `--monaco-scrollbar-hover-background` (previously unnamed) |
| `scrollbarSlider.activeBackground` | `--monaco-scrollbar-active-background` (previously unnamed) |

## TDD Evidence

- **RED:** The new gate failed against the old literal theme with `expected '#0D1117' to be '#0d1117' // Object.is equality` and the source-shape assertion `expected [ '#0D1117', '#E6EDF3', …(37) ] to deeply equal [ '#00000000' ]`. These are byte/source-shape failures, not an import failure.
- **GREEN:** `node node_modules/vitest/vitest.mjs run tests/unit/monaco-theme.test.ts --reporter=verbose` passed all 3 tests after the canonical derivation.
- **REFACTOR:** No separate cleanup commit was needed.
- **Anti-tautology proof:** Temporarily repointing `editor.background` to `--surface-panel` failed the gate with `editor.background: expected '#161b22' to be '#0d1117' // Object.is equality`; the canvas lookup was restored.

## Verification

Passed:

- `node node_modules/vitest/vitest.mjs run tests/unit/monaco-theme.test.ts --reporter=verbose` — 3 tests passed.
- `node node_modules/vitest/vitest.mjs run tests/unit/token-contract.test.ts --reporter=verbose` — 6 tests passed.
- `npm run typecheck:web` — passed.
- `npm run build:web` — passed.
- `node node_modules/vitest/vitest.mjs run tests/unit/monaco-diff-adapter.test.ts --reporter=verbose` — 1 test passed.
- `node node_modules/vitest/vitest.mjs run tests/unit/monaco-diff-semantics.test.ts --reporter=verbose` — 6 tests passed.
- `node node_modules/vitest/vitest.mjs run tests/unit/workspace-state.test.ts --reporter=verbose` — 14 tests passed.
- Source checks confirmed exactly one `virtual:cumpa-tokens` import, retained `satisfies monaco.editor.IStandaloneThemeData`, and found no non-sentinel color literal or color-function notation in `src/web/monaco/theme.ts`.
- `git status --short tests/unit/monaco-diff-adapter.test.ts tests/unit/monaco-diff-semantics.test.ts` — empty.

## Task Commits

Each task was committed atomically:

1. **Task 1: Turn the Monaco mirror into a failing gate** — `ad200f9` (`test`)
2. **Task 2: Derive the Monaco theme from the canonical root** — `be399da` (`feat`)

## Files Created/Modified

- `src/web/monaco/theme.ts` — Build-time semantic-root derivation for every Monaco rule and painted color.
- `src/web/styles.css` — Corrected `--text-on-emphasis` to six-digit canonical hex.
- `tests/unit/monaco-theme.test.ts` — Independent token-name map, source-shape, totality, byte-parity, and intraline gates.
- `.planning/phases/08-semantic-visual-foundation/08-03-SUMMARY.md` — Execution evidence and canonical mapping.

## Decisions Made

- Kept no runtime CSS/DOM lookup: Monaco gets normalizable hex before first paint from the Vite virtual module.
- Used a descriptive Vitest assertion message so a deliberate wrong-token probe names the affected Monaco key.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Canonical emphasis token used unsupported shorthand hex**
- **Found during:** Task 2 green verification.
- **Issue:** `--text-on-emphasis: #fff` could not pass the intentionally narrow six-digit `toMonacoHex` contract used by `editor.selectionForeground`.
- **Fix:** Changed it to equivalent canonical `#ffffff`; no alias or parser expansion was introduced.
- **Files modified:** `src/web/styles.css`.
- **Verification:** token contract, Monaco gate, web typecheck, and web build passed.
- **Committed in:** `be399da`.

---

**Total deviations:** 1 auto-fixed blocking issue.
**Impact on plan:** Necessary for the existing canonical root to satisfy its shared parser contract; no scope expansion.

## Issues Encountered

- `npm run test:unit -- tests/unit/monaco-theme.test.ts` reaches the focused test but the wrapper also launches the broader unit category and did not terminate within 120 seconds during RED collection. Direct Vitest execution isolated and recorded the required two RED failures; all final scoped gates passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 08-04 and 08-05 can consume the canonical root knowing Monaco colors have a byte-level parity gate.
- `STATE.md` and `ROADMAP.md` were intentionally unchanged; the orchestrator owns those writes.

## Self-Check: PASSED

---
*Phase: 08-semantic-visual-foundation*
*Completed: 2026-09-13*
