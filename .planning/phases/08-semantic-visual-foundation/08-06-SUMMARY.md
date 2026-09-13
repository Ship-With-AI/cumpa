---
phase: 08-semantic-visual-foundation
plan: "06"
subsystem: semantic-css
status: complete
commits:
  - 823d8f4
requires:
  - phase: 08-semantic-visual-foundation
    provides: canonical root semantic token contract
provides:
  - Focus geometry painted from canonical root tokens
  - No unconsumed canonical root tokens
  - Drift-gate coverage for missing token consumers
affects:
  - VIS-03
  - Phase 09 tree restyle
  - Phase 11 shell and dialog restyle
tech-stack:
  added: []
  patterns:
    - Canonical tokens must have a CSS/Vue var() or Monaco theme color() consumer, including transitive root aliases.
key-files:
  created:
    - .planning/phases/08-semantic-visual-foundation/08-06-SUMMARY.md
  modified:
    - src/web/styles.css
    - src/web/prototypes/Phase6DiffSemanticsPrototype.vue
    - scripts/verify-semantic-css.mjs
    - tests/integration/draft-recovery-ui.spec.ts
    - tests/e2e/responsive-session.spec.ts
key-decisions:
  - Retired geometry and palette tokens without a current consumer instead of preempting surfaces reserved for later phases.
  - Kept Monaco token consumers authoritative through the existing token-contract color() mapping.
requirements-completed: [VIS-03]
duration: 13m
completed: 2026-09-13
---

# Phase 08 Plan 06: G-01 Geometry Token Closure Summary

**The canonical root now paints the approved 2px focus ring at a 3px offset, and every remaining root token has a real CSS/Vue or Monaco consumer.**

## Performance

- **Duration:** 13m
- **Started:** 2026-09-13T08:39:27Z
- **Completed:** 2026-09-13T08:52:35Z
- **Tasks:** 1/1
- **Files modified:** 6

## Accomplishments

- Replaced global and prototype focus literals with `--focus-outline-width` and `--focus-offset`; the skip-link position preserves the full external ring within the viewport.
- Routed current control height, default border width, and selected rails through their canonical geometry tokens.
- Retired every unused/speculative root token, preserving Phase 09–12 ownership of tree, Monaco density, shell, and dialog redesigns.
- Extended `verify-semantic-css` to reject a canonical token with no CSS/Vue `var()` or Monaco `color()` consumer; its unconditional self-check proves the rejection path.
- Re-derived browser focus assertions from `canonicalRoot()` through `resolveToken()`.

## G-01 Token Disposition

The initial mechanical scan compared canonical root declarations with CSS/Vue `var()` references, then included the existing Monaco `color()` consumer and transitive root aliases so Monaco tokens remained correctly recognized as painted.

| Initially unconsumed token | Disposition | Evidence |
|---|---|---|
| `--surface-gap` | Retired | No Phase 08 consumer; later diff-surface work owns any gap treatment. |
| `--border-overlay` | Retired | No current overlay rule consumes it; Phase 11 owns overlay composition. |
| `--interactive-accent-emphasis-hover` | Retired | No current state rule consumes it. |
| `--text-selection-background` | Retired | No browser or Monaco rule consumes it. |
| `--status-modified-foreground` | Retired | No status rule consumes the redundant role. |
| `--status-modified-background` | Retired | No status rule consumes the redundant role. |
| `--status-modified-border` | Retired | No status rule consumes the redundant role. |
| `--status-added-foreground` | Retired | No status rule consumes the redundant role. |
| `--status-added-background` | Retired | No status rule consumes the redundant role. |
| `--status-added-border` | Retired | No status rule consumes the redundant role. |
| `--status-deleted-foreground` | Retired | No status rule consumes the redundant role. |
| `--status-deleted-background` | Retired | No status rule consumes the redundant role. |
| `--status-deleted-border` | Retired | No status rule consumes the redundant role. |
| `--radius-file-row` | Retired | File-row shape/density is Phase 09 scope. |
| `--radius-scrollbar` | Retired | No authored scrollbar geometry rule consumes it. |
| `--border-width-default` | Wired | Shared control border uses `var(--border-width-default)`. |
| `--focus-outline-width` | Wired | Global, prototype, and internal Monaco focus rules use it. |
| `--focus-offset` | Wired | Global and prototype focus rules use it; skip-link placement accounts for the external ring. |
| `--selected-rail-width` | Wired | Selected tree rows, tabs, Monaco anchor rails, and forced-colors equivalents use it. |
| `--control-height-standard` | Wired | Shared controls use the approved 36px standard minimum height. |
| `--control-height-compact` | Retired | No compact-control rule exists; adding one would preempt later density work. |
| `--file-row-min-height` | Retired | Phase 09 owns the file-tree density cutover. |
| `--diff-row-height` | Retired | No CSS/Vue consumer; Monaco density work remains out of Phase 08 scope. |
| `--diff-gutter-width` | Retired | No CSS/Vue consumer; Monaco density work remains out of Phase 08 scope. |
| `--diff-sign-width` | Retired | No CSS/Vue consumer; Monaco density work remains out of Phase 08 scope. |
| `--sidebar-width` | Retired | Shell layout sizing is Phase 11 scope. |
| `--dialog-width` | Retired | Dialog composition is Phase 11 scope. |
| `--dialog-max-height` | Retired | Dialog composition is Phase 11 scope. |
| `--space-3` | Retired | No shared Phase 08 rule consumes it. |
| `--space-5` | Retired | No shared Phase 08 rule consumes it. |

## Verification

| Command | Result |
|---|---|
| `npm run verify:semantic-css` | Passed — fresh web build and semantic audit completed; self-check exercises an unused-token rejection fixture. |
| `npm run test:unit -- tests/unit/monaco-theme.test.ts` | Passed — 29 files, 166 tests. |
| `npx vitest run tests/unit/token-contract.test.ts` | Passed — 1 file, 6 tests. |
| `npm run typecheck:web` | Passed. |
| `npm run build` | Passed. |
| `npm run build && npm run test:browser -- tests/integration/draft-recovery-ui.spec.ts tests/e2e/responsive-session.spec.ts` | Passed — 5 browser tests. |

The prior browser run exposed skip-link focus clipping under the newly correct 3px offset. The skip link now reserves `outline width + offset` from the viewport edges; the required browser command then passed.

## Task Commit

1. **Close G-01 semantic geometry gap** — `823d8f4` (`fix`)

## Decisions Made

- Retire token declarations that no current rule or Monaco theme actually paints; do not create speculative consumers for surfaces assigned to Phase 09–12.
- Treat the existing Monaco `color('--token')` mapping as a real token consumer while retaining CSS/Vue `var()` discovery for browser-authored rules.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Keep the corrected global focus ring inside the viewport for skip links**
- **Found during:** Browser verification
- **Issue:** The approved 3px offset extended a skip link's ring one pixel beyond the viewport at 320px.
- **Fix:** Positioned the focused skip link by its shared focus width and offset instead of weakening the canonical focus geometry.
- **Files modified:** `src/web/styles.css`
- **Verification:** Required targeted browser command passed.
- **Committed in:** `823d8f4`

---

**Total deviations:** 1 auto-fixed (Rule 1).
**Impact on plan:** Preserves the approved focus contract without changing a later-phase surface.

## Issues Encountered

None remaining. The pre-existing unrelated file-tree tabindex and environment-marker failures were not exercised or modified.

## User Setup Required

None.

## Next Phase Readiness

- VIS-03 has an authoritative geometry/density token contract with an enforced no-orphan rule.
- Phase 09 and Phase 11 can introduce new geometry tokens only alongside their owned consumers.

## Self-Check: PASSED

- `823d8f4` exists and contains the G-01 source, test, and drift-gate changes.
- This summary exists at the required Phase 08 path.
- `.planning/STATE.md` and `.planning/ROADMAP.md` were intentionally unchanged.
