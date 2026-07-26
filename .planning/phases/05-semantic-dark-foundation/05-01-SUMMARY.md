---
phase: 05-semantic-dark-foundation
plan: 01
subsystem: ui
tags: [css, semantic-tokens, playwright, chromium, dark-mode]

requires:
  - phase: 04.1-close-gap-cmt-01-correlate-async-comment-settlement
    provides: existing review workflow, responsive states, and browser-contract seams
provides:
  - one canonical semantic dark CSS vocabulary and forced-colors repair
  - deterministic source/generated stylesheet audit
  - focused packaged and mounted Chromium contracts for foundation surfaces
affects: [06-monaco-diff-foundation, 07-review-surface-adaptation, 08-accessibility-reflow]

tech-stack:
  added: []
  patterns: [single-root semantic CSS vocabulary, dependency-free generated-CSS audit, computed-style browser contracts]

key-files:
  created:
    - scripts/verify-semantic-css.mjs
  modified:
    - src/web/styles.css
    - tests/e2e/responsive-session.spec.ts
    - tests/e2e/pinned-session.spec.ts
    - tests/integration/draft-recovery-ui.spec.ts
    - tests/integration/export-receipt-ui.spec.ts

key-decisions:
  - "Use a single direct semantic-token root with no compatibility aliases or component token roots."
  - "Keep Monaco internals untouched; Phase 05 exposes only CSS foundation roles for later consumers."
  - "Prove CSS behavior with built-package and mounted computed-style journeys, complementing the source/generated audit."

patterns-established:
  - "Semantic CSS audit: inspect source and Vite-emitted CSS independently from a repository-root-resolved dependency-free Node script."
  - "Foundation UI contracts: assert actual state journeys and computed styles rather than source text."

requirements-completed: [VIS-01, VIS-02, VIS-03]

duration: 18min
completed: 2026-07-26
status: complete
---

# Phase 05: Semantic Dark Foundation Summary

**A single GitHub-dark semantic stylesheet now renders the local review workflow with role-based surfaces, typography, controls, status states, constrained overlay elevation, and deterministic Chromium evidence.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-07-26T13:31:00Z
- **Completed:** 2026-07-26T13:49:38Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Replaced competing visual vocabularies with one canonical semantic dark root; migrated direct consumers, preserved responsive drawer state mechanics, retained a terminal forced-colors repair, and left Monaco internals unchanged.
- Added a dependency-free audit that validates source and emitted Vite CSS for the exact token root, legacy-token retirement, raw-style restrictions, and elevation/selected-rail invariants.
- Expanded packaged and mounted Chromium journeys to cover semantic token resolution, dark first paint and state surfaces, controls, typography, receipt/recovery presentation, and locked responsive tiers.


## Post-review corrections

- **WR-01:** Closed responsive comments/files drawers now compute `box-shadow: none`; only their corresponding open overlay classes apply `var(--shadow-overlay)`. Packaged Chromium assertions cover closed, open, and restored-closed states.
- **WR-02:** The dependency-free audit rejects duplicate `box-shadow` declarations and exempts raw colors only in the sole context-free source token root.
- **WR-03:** `7bbbc11` makes the rule walker recurse through every non-keyframes block-bearing at-rule while preserving context. Contextual `:root` rules under `@supports`, `@layer`, `@container`, and `@scope` now fail; deterministic fixtures also prove nested `@container` shadows and `@scope` raw colors are audited.
- **WR-04:** The responsive package journey now loads deterministic real diff content, drives the generated Monaco gutter action by exact accessible name, and independently exercises the real `UiPrimitives` tooltip through hover/leave, focus/focus-out, and focus/Escape states.
- **WR-05:** Receipt heading and static-surface computed-style assertions now execute at both 768px and 360px.
- **Verification:** `npm run build:web && node scripts/verify-semantic-css.mjs` passed after the WR-03 correction; prior focused Chromium verification remains recorded above.

## Task Commits

Each task was committed atomically:

1. **Task 1: Atomically replace both visual vocabularies with one semantic dark contract** - `5094258` (feat)
2. **Task 1 correction: complete recovery and narrow state styles** - `351467a` (fix)
3. **Task 2: Update focused Chromium contracts for every foundation state and preserved responsive tier** - `fbf8e3e` (test)
4. **Task 2 correction: cover forced-colors foundation** - `555d20b` (test)
5. **Post-review corrections: drawer elevation, audit bypasses, and browser evidence** - `e4fa809` (fix)
6. **WR-03 correction: close nested semantic root audit gap** - `7bbbc11` (fix)

**Plan metadata:** this completion commit

## Files Created/Modified

- `src/web/styles.css` - canonical semantic dark role system, responsive surfaces, controls, status composition, and forced-colors repair.
- `scripts/verify-semantic-css.mjs` - source/generated CSS vocabulary and author-style audit.
- `tests/e2e/responsive-session.spec.ts` - built-package token, typography, control, contrast, elevation, and responsive visual contract.
- `tests/e2e/pinned-session.spec.ts` - built-package loading, unavailable, and empty-state style contract.
- `tests/integration/draft-recovery-ui.spec.ts` - mounted corrupt-recovery visual contract.
- `tests/integration/export-receipt-ui.spec.ts` - mounted receipt typography and static-surface visual contract.

## Decisions Made

- Adopted the exact approved role tokens as the only CSS custom-property vocabulary, retaining `--text-muted` solely as the approved canonical name.
- Preserved all Vue templates, API/persistence/export behavior, and Monaco theme ownership while proving observable browser presentation through existing journeys.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Recovery badge and narrow state-card styles were incomplete under the new semantic foundation.**
- **Found during:** Task 2 (focused Chromium contract updates)
- **Issue:** The recovery badge lacked its information semantic treatment and a state card did not reduce to the locked 16px padding at the narrow contract width.
- **Fix:** Applied the information status border/background and primary text to the recovery badge; added the existing narrow-breakpoint state-card padding rule.
- **Files modified:** `src/web/styles.css`
- **Verification:** `npm run build:web && node scripts/verify-semantic-css.mjs`; full Task 2 Chromium verification command passed.
- **Committed in:** `351467a`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Required to satisfy the locked visual contract; no scope expansion or production boundary change.

## Issues Encountered

- Chromium normalizes custom-property color syntax in computed styles. Runtime expectations use the normalized browser values, while the audit enforces the exact approved source literals.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The semantic CSS foundation and regression gates are ready for Phase 06 Monaco diff consumption without introducing Monaco theme internals here.
- No blockers identified.

## Self-Check: PASSED

- Verified `scripts/verify-semantic-css.mjs` and this summary exist.
- Verified task commits `5094258`, `351467a`, and `fbf8e3e` are reachable.
- Verified forced-colors contract commit `555d20b` is reachable.

---
*Phase: 05-semantic-dark-foundation*
*Completed: 2026-07-26*
