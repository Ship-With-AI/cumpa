---
phase: 08-semantic-visual-foundation
plan: "04"
subsystem: testing
tags: [css, semantic-tokens, vite, vue, audit]

# Dependency graph
requires:
  - phase: 08-semantic-visual-foundation
    provides: canonical CSS root tokens and Monaco theme parity gate from plans 08-02 and 08-03
provides:
  - build-first semantic CSS audit runnable as `npm run verify:semantic-css`
  - exact canonical root-name, retired-vocabulary, and Vue prototype checks
  - self-checked token notation validation without a duplicate value palette
affects: [08-05, visual-regression, css-tokens]

# Tech tracking
tech-stack:
  added: []
  patterns: [CSS root is the only token-value authority; audit checks structural names and notation shape]

key-files:
  created: [.planning/phases/08-semantic-visual-foundation/08-04-SUMMARY.md]
  modified: [scripts/verify-semantic-css.mjs, package.json]

key-decisions:
  - "Removed the audit's expected-value table rather than duplicating root token values."
  - "Treat color-mix compositions made solely from semantic tokens as token-derived rather than direct palette literals."
  - "Keep selector-specific shadow policy for production CSS while Vue prototypes receive direct-color and retired-vocabulary auditing."

patterns-established:
  - "Run `npm run verify:semantic-css` after CSS token or authored-style changes; it rebuilds dist/web first."
  - "Use lowercase token color notation and canonical `var(--token)` aliases in the root."

requirements-completed: [VIS-01, VIS-03]

# Metrics
duration: 7min
completed: 2026-09-13
status: complete
---

# Phase 08: Semantic Visual Foundation Summary

**The semantic CSS gate now derives its complete vocabulary from the canonical root, verifies both prototypes, and rebuilds the browser bundle before auditing it.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-09-13T07:45:25Z
- **Completed:** 2026-09-13T07:52:23Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Replaced the independent 76-name/expected-value audit contract with the 118-name canonical root vocabulary and notation-shape checks.
- Added self-checks for uppercase hexadecimal tokens, non-canonical aliases, unsupported colour functions, and the complete retired Phase 08 vocabulary.
- Audited Monaco and Phase 6 Vue style blocks, and exposed the build-first audit through `npm run verify:semantic-css`.

## Audit Evidence

- **Inherited pre-phase failure:** `Semantic CSS audit failed: source CSS token root is missing --surface-inset`
- **Canonical-name counts:** 76 before this plan; 118 canonical root declarations and 118 audit names after it. Sorted `comm -3` comparison produced no differences.
- **Deliberate uppercase failure:** `Semantic CSS audit failed: source CSS token --surface-canvas must not use uppercase hex color`
- **Deliberate retired-token failure:** `Semantic CSS audit failed: source CSS still references retired token --surface-inset`
- **Final success:** `Semantic CSS verified: canonical root, retired vocabulary, and author-style invariants pass.`
- **Build-first proof:** `rm -rf dist/web && npm run verify:semantic-css` rebuilt `dist/web` and completed successfully.
- `expectedValues` has no remaining occurrence in the audit, and no dependency was added.

## Task Commits

Each task was committed atomically:

1. **Task 1: Re-derive and harden token audit** - `c859c2d` (fix)
2. **Task 2: Cover retired vocabulary and both prototypes** - `c42a243` (fix)
3. **Task 3: Wire the build-first npm command** - `d4d69b7` (chore)

**Plan metadata:** pending this summary commit

## Files Created/Modified

- `scripts/verify-semantic-css.mjs` - Canonical token-name contract, notation-shape checks, Phase 08 retired vocabulary, and dual-prototype auditing.
- `package.json` - `verify:semantic-css` runs `build:web` before the audit.
- `.planning/phases/08-semantic-visual-foundation/08-04-SUMMARY.md` - Evidence and decision record for this plan.

## Decisions Made

- Root CSS remains the sole value authority; the audit validates names, aliases, and allowed notation rather than holding a second palette.
- A `color-mix()` expression using semantic variables is not a direct literal; literal hex, colour functions, named colours, and system colours remain confined by the existing direct-colour gate.
- Production selector-specific shadow allowlists remain enforced, while prototypes are checked for the reusable semantic contracts rather than production layout selectors.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Correctness] Comment-adjacent root declarations were not parsed**
- **Found during:** Task 1 (re-derive and harden token audit)
- **Issue:** The declaration regex consumed a CSS comment containing a colon and skipped the immediately following custom property, preventing the re-derived exact root list from passing.
- **Fix:** Strip comments before extracting declarations.
- **Files modified:** `scripts/verify-semantic-css.mjs`
- **Verification:** Full 118-name root/list comparison passed and the audit completed successfully.
- **Committed in:** `c859c2d`

**2. [Rule 1 - Correctness] Existing source and prototype semantic styles exposed source-specific assumptions**
- **Found during:** Tasks 1 and 2
- **Issue:** `.support-dialog` uses the existing canonical overlay shadow, while Phase 6 intentionally uses semantic `color-mix()` compositions and semantic shadows that cannot be matched against production selector allowlists.
- **Fix:** Allowlisted the production dialog overlay; retained strict production shadow checks; made Vue audits enforce direct-colour and retired-token policy without applying production selector-specific shadow constraints; treat token-derived `color-mix()` as non-literal.
- **Files modified:** `scripts/verify-semantic-css.mjs`
- **Verification:** `npm run build:web && node scripts/verify-semantic-css.mjs` and the clean-dist named command passed; deliberate raw/retired failures remained observable.
- **Committed in:** `c859c2d`, `c42a243`

---

**Total deviations:** 2 auto-fixed (2 correctness)
**Impact on plan:** Both changes make the single semantic audit accurately cover the canonical root and existing prototype semantics without adding a second audit or changing source prototypes.

## Issues Encountered

- The audit was intentionally inherited red before this plan, so its initial missing `--surface-inset` failure was recorded rather than treated as a regression introduced here.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The semantic CSS command is green and can be used as the targeted visual-token gate.
- `npm run test:browser` remains known red on colour, radius, and type assertions; plan 08-05 owns that work.

---
*Phase: 08-semantic-visual-foundation*
*Completed: 2026-09-13*
