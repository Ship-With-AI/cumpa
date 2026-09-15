---
phase: 07-github-familiar-review-surfaces
plan: "01"
subsystem: ui
tags: [vue, css, playwright, local-svg, review-header]

requires:
  - phase: 06-monaco-diff-semantics
    provides: stable Monaco theme, independent semantic decoration layers, and production-workspace geometry checks
provides:
  - grouped Base/path/Head file context header with retained review controls
  - fixed local inline SVG and safe display-string path presentation primitives
  - explicit icon, selected, and busy control presentation hooks with Chromium regression coverage
affects: [07-02, 07-03, 07-04, 07-05, 07-06, 08-accessibility-responsive-continuity]

tech-stack:
  added: []
  patterns: [presentation-only local SVG, safe display-string path segmentation, grouped header with inherited responsive ownership]

key-files:
  created:
    - src/web/components/ui/UiIcon.vue
    - src/web/components/ui/PathText.vue
  modified:
    - src/web/components/PathDisplay.vue
    - src/web/components/ReviewToolbar.vue
    - src/web/App.vue
    - src/web/styles.css
    - tests/integration/anchored-workspace.spec.ts

key-decisions:
  - "Render the header only from the existing pinned session endpoints and selected SessionFile safe display values."
  - "Keep toolbar behavior in ReviewToolbar; compose it into the grouped header without changing its emits, shortcuts, ARIA, or native disabled rules."
  - "Use bounded local SVG names and CSS state hooks instead of adding icon assets, packages, or product state."

patterns-established:
  - "PathText segments the final slash of an already-safe display string only for typography; it never constructs path identity."
  - "Review's expanded state owns the selected treatment while the global focus-visible ring remains independent."

requirements-completed: [VIS-04, REVW-01]

duration: 22min
completed: 2026-07-27
status: complete
---

# Phase 07 Plan 01: GitHub-Familiar Header Summary

**A compact, framed Base/path/Head context header now keeps every shipped diff navigation and review control available while presenting safe renamed-file identity with local icon controls.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-07-27T16:49:29Z
- **Completed:** 2026-07-27T17:11:36Z
- **Tasks:** 2/2
- **Files modified:** 7

## Accomplishments

- Added a closed, decorative local SVG vocabulary and a shared safe path display primitive with muted directories and strong filenames.
- Converted the four navigation controls to exact-size local icon controls while retaining names, tooltips, shortcuts, emits, disabled boundaries, and labeled Review/help actions.
- Replaced detached active-file and toolbar siblings with one two-band Base/path/Head context header, including complete renamed-file identity and inherited responsive containment.
- Added a production Chromium scenario covering header anatomy, endpoint IDs, path typography, control names/tooltips/states, reduced motion, and representative inherited widths.

## Task Commits

Each task was committed atomically:

1. **Task 1: Establish local icon, path typography, and state-complete control primitives** — `88fd575` (feat)
2. **Task 2: Compose the compact two-band Base file Head header** — `836570b` (feat)

## Files Created/Modified

- `src/web/components/ui/UiIcon.vue` — closed local 16px decorative SVG icon vocabulary.
- `src/web/components/ui/PathText.vue` — safe display-string directory/filename segmentation.
- `src/web/components/PathDisplay.vue` — complete normal, deleted, renamed, and copied path presentation.
- `src/web/components/ReviewToolbar.vue` — accessible icon-only navigation controls and selected Review treatment.
- `src/web/App.vue` — grouped Base/path/Head context band plus retained toolbar composition.
- `src/web/styles.css` — context-header, path, icon, selected, busy, and spinner contracts.
- `tests/integration/anchored-workspace.spec.ts` — production-workspace header/control/reflow coverage.

## Decisions Made

- Kept Base and Head labels/OIDs entirely within the already pinned session authority; short OIDs use the established seven-character presentation.
- Retained `PathDisplay` as the authoritative renamed/copied relationship owner and used `PathText` only for visual segmentation of its supplied safe strings.
- Kept responsive ownership with the existing `review-main`/Monaco boundary and inherited breakpoints; the context header has no breakpoint or overflow-menu behavior of its own.

## Verification

- `npm run test:browser -- tests/integration/anchored-workspace.spec.ts --grep "diff navigation and session state|Phase 07 header and control states|no-reflow Monaco semantic channels"` — passed: 3 tests.
- The same focused command with `--headed` ran the two new/retained semantic cases successfully, but the pre-existing `diff navigation and session state` console assertion reported the known Vite-served 404. Phase 06 recorded this same headed-only 404; headless focused verification passed.
- `git diff --name-only 88fd575^..HEAD` — exactly the seven plan-declared Vue/CSS/Playwright paths; no package, API, schema, persistence, or Monaco-adapter file changed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Closed the updated PathDisplay template.**
- **Found during:** Task 1 (focused browser verification)
- **Issue:** The initial component edit omitted the template closing tag, which prevented Vite from compiling the workspace.
- **Fix:** Restored the closing tag before the Task 1 commit.
- **Files modified:** `src/web/components/PathDisplay.vue`
- **Verification:** Focused Chromium test passed after the repair.
- **Committed in:** `88fd575`

**2. [Rule 1 - Bug] Restored independent icon and busy-control geometry.**
- **Found during:** Task 2 (focused Chromium verification)
- **Issue:** The initial icon CSS was nested within the destructive hover selector, so 32px controls did not receive their presentation contract; a busy spinner also widened its host control.
- **Fix:** Moved icon/state hooks to the top level and positioned a busy spinner without affecting control bounds.
- **Files modified:** `src/web/styles.css`, `tests/integration/anchored-workspace.spec.ts`
- **Verification:** The final focused Chromium command passed all three selected cases.
- **Committed in:** `836570b`

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs).
**Impact on plan:** Both repairs were required for the planned presentation contract and introduced no product behavior or scope expansion.

## Issues Encountered

- The headed focused run preserves a known Vite-served 404 console error in the existing `diff navigation and session state` assertion. It was already recorded in the Phase 06 summary; the plan-required headless Chromium suite passes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Later Phase 07 plans can reuse the local icon, path typography, selected/current, busy, and grouped-header conventions without changing review mechanics.
- Phase 08 retains ownership of final 320px, 400% zoom, forced-colors, grayscale, and milestone-wide continuity proof.

## Self-Check: PASSED

---
*Phase: 07-github-familiar-review-surfaces*
*Completed: 2026-07-27*
