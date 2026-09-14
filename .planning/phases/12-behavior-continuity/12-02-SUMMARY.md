---
phase: 12-behavior-continuity
plan: 02
subsystem: testing
tags: [playwright, accessibility, keyboard, tab-order, review-toolbar]

requires:
  - phase: 11-workspace-shell-review-surfaces
    provides: ReviewToolbar's six accessible named controls and responsive-session harness
provides:
  - Desktop sequential Tab-order regression coverage for every ReviewToolbar control
  - Phase 11 owning-phase record for the unroled toolbar-container gap
affects: [phase-11-workspace-shell-review-surfaces, accessibility, review-toolbar]

tech-stack:
  added: []
  patterns: [Use exact-name button locators and focus destinations for toolbar accessibility contracts]

key-files:
  created: [.planning/phases/12-behavior-continuity/12-02-SUMMARY.md]
  modified: [tests/e2e/responsive-session.spec.ts]

key-decisions:
  - "Assert controls individually rather than adding a generic scanner or asserting an unavailable group role."
  - "Record the unroled containers for their owning phase without changing Phase 12 production markup."

patterns-established:
  - "A middle-file fixture makes both file-navigation controls genuinely enabled before sequential Tab traversal."

requirements-completed: [CON-03]

duration: 1min
completed: 2026-09-14
status: complete
---

# Phase 12 Plan 02: Toolbar Accessibility Continuity Summary

**Desktop packaged-session coverage now proves that all six named review-toolbar controls are enabled, visibly focusable, and reached in sequential Tab order without changing production markup.**

## Performance

- **Duration:** 1 min
- **Started:** 2026-09-14T05:31:21Z
- **Completed:** 2026-09-14T05:31:36Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added one desktop `test.step` to the existing responsive keyboard contract: after selecting file 2 of 18, focus advances `Previous file` → `Next file` → `Previous change` → `Next change` → `Review` → `Keyboard help` through five sequential Tab presses.
- The step proves all navigation controls are enabled, both actions visible, each control's focus indicator unclipped, no horizontal overflow, and restores `alpha.ts` before later responsive checks.
- Recorded the complete four-container semantic-group gap for Phase 11 ownership, with byte-history and test-suite search evidence.

## Task Commits

Each task was committed atomically:

1. **Task 1: Desktop sequential Tab traversal of the six review-toolbar controls** - `284a11f` (test)
2. **Task 2: Record the ReviewToolbar semantic-group gap as a Phase 11 owning-phase finding** - this summary commit (docs)

## Files Created/Modified

- `tests/e2e/responsive-session.spec.ts` - Adds the desktop six-control ordered keyboard-focus regression step.
- `.planning/phases/12-behavior-continuity/12-02-SUMMARY.md` - Documents the finding, ownership, non-regression evidence, and recommended repair.

## Decisions Made

- Reused `expectFocusIndicatorUnclipped()` and exact Playwright role/name locators; no accessibility dependency or duplicate helper was needed.
- Used one `Alt+Shift+]` hop to make the fixture's previous/next file controls both meaningful, then restored file 1 with `Alt+Shift+[`.
- Kept the semantic-group issue as an owning-phase finding exactly as `12-UI-SPEC.md:182` requires.

## Owning-phase finding (Phase 11): unroled review-toolbar containers

`ReviewToolbar.vue` contains four bare `div` containers that group the six review controls but are not exposed as named groups in the accessibility tree:

1. `ReviewToolbar.vue:25` — `Diff navigation`: bare `div` with `aria-label`, but no `role`.
2. `ReviewToolbar.vue:26` — `File navigation`: bare `div` with `aria-label`, but no `role`; owns Previous file and Next file.
3. `ReviewToolbar.vue:51` — `Change navigation`: bare `div` with `aria-label`, but no `role`; owns Previous change and Next change.
4. `ReviewToolbar.vue:76` — action container: bare `div` with neither `role` nor label; owns Review and Keyboard help.

**Non-regression evidence.** Executed:

```bash
git log --oneline f810081..HEAD -- src/web/components/ReviewToolbar.vue
```

Observed output: *(empty; exit 0)*. The restyle did not change this component. Executed:

```bash
grep -R --fixed-strings "getByRole('group'" tests/
```

Observed output: *(0 matches)*. No test has ever asserted the named toolbar group, so the restyle removed no previous group contract.

**Why this remains Phase 11-owned.** `12-UI-SPEC.md:182` explicitly records this as a Phase 11-owned gap and forbids Phase 12 from implementing or visually redesigning around it. The existing container semantics were retained; Phase 12 instead verifies all six controls individually by role and exact accessible name in `responsive-session.spec.ts:1147-1178`, including their sequential Tab order and visible focus.

**Recommended owning-phase repair.** Add `role="group"` to `ReviewToolbar.vue:25` to expose the outer `Diff navigation` group required by the UI-SPEC matrix. The three inner containers at `ReviewToolbar.vue:26`, `ReviewToolbar.vue:51`, and `ReviewToolbar.vue:76` are the same latent issue and should be corrected together by the Phase 11 owner; fixing only line 25 must not be mistaken for complete group coverage.

## Deviations from Plan

None - plan execution required no production-source changes, generic accessibility scanner, added dependency, group-role assertion, skip, or fixme.

## Issues Encountered

None.

## Verification

- `npm run build:web && npx playwright test tests/e2e/responsive-session.spec.ts` — passed (1 test).
- `npx playwright test tests/e2e/responsive-session.spec.ts` — 1 passed in 7.7s.
- `test.step(` count is 13; the new step is the sole increase.
- `responsive-session.spec.ts` has no `.skip(`, `.fixme(`, or `getByRole('group'` usage.
- `git log --oneline f810081..HEAD -- src/web/components/ReviewToolbar.vue` — empty output.
- `getByRole('group'` search across `tests/` — 0 matches.
- `git diff --check` — passed; no files under `src/`, `package.json`, or `package-lock.json` changed.

## User Setup Required

None.

## Next Phase Readiness

- Phase 12's keyboard continuity and its Phase 11 ownership record are complete.
- The Phase 11 owner can address all four unroled toolbar containers together when semantic grouping is scheduled; Phase 12 deliberately leaves production markup unchanged.

---
*Phase: 12-behavior-continuity*
*Completed: 2026-09-14*
