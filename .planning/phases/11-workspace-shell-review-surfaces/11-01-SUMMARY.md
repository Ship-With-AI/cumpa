---
phase: 11-workspace-shell-review-surfaces
plan: 01
subsystem: ui
tags: [vue, css-tokens, responsive-layout, playwright, accessibility]

requires:
  - phase: 08-visual-token-foundation
    provides: canonical token root and semantic CSS drift gate
  - phase: 10-quiet-diff-surface
    provides: Monaco-authoritative review workspace and responsive browser contract
provides:
  - Deferred geometry tokens for the workspace shell and shared modal surfaces
  - Unified 760px, 1050px, and 1650px responsive behavior
  - Reusable application-modal primitive with explicit focus containment
  - Support dialog migrated to the shared modal primitive
  - Responsive and semantic CSS gates aligned to the new shell geometry
affects: [11-02, 11-03, workspace-shell, review-surfaces]

tech-stack:
  added: []
  patterns: [canonical geometry tokens, shared manual modal focus trap, breakpoint-gate lockstep]

key-files:
  created:
    - src/web/components/ui/ModalDialog.vue
  modified:
    - scripts/css-token-contract.mjs
    - scripts/verify-semantic-css.mjs
    - src/web/styles.css
    - src/web/App.vue
    - src/web/components/SupportDialog.vue
    - tests/e2e/responsive-session.spec.ts

key-decisions:
  - "Keep an explicit Vue modal rather than native dialog so focus cycling stays inside the panel and the App-owned inert background contract remains intact."
  - "Use one max-width 760px media query in App.vue and drive file drawer and identity compact state from it."
  - "Make the review rail an opt-in absolute overlay at every viewport width so opening it never changes diff width."

patterns-established:
  - "Geometry tokens: shell tracks and modal dimensions are canonical root tokens with shipped consumers."
  - "Application modal: own Escape, focus trap, initial close-button focus, and opener restoration locally; callers retain background inert ownership."

requirements-completed: [SHELL-03, SHELL-04, REV-03, REV-04]

duration: 39min
completed: 2026-09-13
status: complete
---

# Phase 11: Workspace Shell & Review Surfaces Summary

**Canonical workspace geometry, a single responsive model, and a reusable accessible modal now keep review surfaces stable without changing Monaco diff width.**

## Performance

- **Duration:** 39 min
- **Started:** 2026-09-13T19:53:09Z
- **Completed:** 2026-09-13T20:31:19Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Added canonical sidebar, dialog, and compact-control geometry tokens, consuming them in the shell and shared modal CSS.
- Replaced legacy 767/768/1099/1279/1439 breakpoints with the 760/1050/1650 model; the review rail is now an overlay only when a reviewer opens it.
- Extracted `ModalDialog.vue`, including ARIA ownership, local Escape, full forward/reverse Tab containment, initial focus, and opener restoration; `SupportDialog.vue` now supplies only its domain content.

## Task Commits

Each task was committed atomically:

1. **Task 1: Declare workspace geometry tokens** - `270d3e1` (feat)
2. **Task 2: Unify workspace breakpoints** - `734009c` (test, RED), `8d93c4f` (feat, GREEN)
3. **Task 3: Extract ModalDialog.vue and prove it against the shipped support-dialog contract** - `2506d10` (test, RED), `ecf2b9d` (feat, GREEN)

_Plan metadata: this summary is committed separately._

## Files Created/Modified

- `src/web/components/ui/ModalDialog.vue` - Shared ARIA modal host with expanded focusable-control trap and local Escape behavior.
- `src/web/components/SupportDialog.vue` - Support-specific copy and events rendered inside `ModalDialog`.
- `src/web/styles.css` - Canonical geometry consumers, two-column shell, overlay rail, responsive tokens, and shared modal styling.
- `src/web/App.vue` - Single 760px media query driving narrow, compact, and file-drawer state; review rail initializes closed.
- `scripts/css-token-contract.mjs` - Canonical geometry-token declarations.
- `scripts/verify-semantic-css.mjs` - Modal allowlist entry and responsive overlay pin realignment.
- `tests/e2e/responsive-session.spec.ts` - Boundary, shell-track, and overlay-rail coverage for the unified breakpoints.

## Decisions Made

- Rejected native `<dialog>`/`showModal()` to preserve tight Tab wrapping and App-owned `.review-shell[inert]` behavior.
- Kept the support dialog's mount location, copy, state events, and App-level focus fallback unchanged while replacing its local trap.
- Applied the wide sidebar at 1650px, compact sidebar at 761–1050px, and removed the persistent sidebar track at 760px and below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Align the overlay allowlist with Task 1's required shared modal consumer**
- **Found during:** Task 1 (Declare workspace geometry tokens)
- **Issue:** The required shared `.modal-dialog` token consumer uses `var(--shadow-overlay)`, which the semantic CSS gate rejects until it is allowlisted.
- **Fix:** Added `.modal-dialog` to the existing `overlayAllowlist` alongside its shared CSS rule.
- **Files modified:** `scripts/verify-semantic-css.mjs`, `src/web/styles.css`
- **Verification:** `npm run verify:semantic-css` passed.
- **Committed in:** `270d3e1`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required the gate and authored stylesheet to move together; no behavior or scope was added beyond the declared shared modal surface.

## Issues Encountered

- The initial token-array edit omitted existing canonical entries while inserting the new names; the token-root plugin identified each missing entry, they were restored, and the semantic gate then passed.
- A throwaway browser harness for the widened selector could not be served reliably from the test root and was removed. The shipped support and responsive Playwright contracts, `typecheck:web`, and semantic CSS gate all passed; source inspection confirms the primitive selector contains `textarea`, `select`, `a[href]`, and non-negative `tabindex` controls.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 11-02 through 11-04 can consume the canonical shell and modal primitive without reintroducing old responsive breakpoints or local support-dialog focus traps.
- `IdentityPanel.vue` intentionally retains its existing local trap for plan 11-03 to migrate.

---
*Phase: 11-workspace-shell-review-surfaces*
*Completed: 2026-09-13*
