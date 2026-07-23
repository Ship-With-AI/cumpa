---
phase: quick
plan: 260723-mzp
subsystem: cli-launch-and-packaged-testing
tags: [cmux, child-process, vitest, playwright, hermetic-tests]
requires: []
provides:
  - Browser URLs use cmux only when CMUX_WORKSPACE_ID is present.
  - Packaged anchored-review launches are intercepted by an executable observable fake opener.
affects: [cli-launch, packaged-acceptance]
tech-stack:
  added: []
  patterns:
    - Presence-based environment routing with a shell-free fixed cmux command.
    - Per-launch fake-opener marker polling before Playwright navigation.
key-files:
  created: []
  modified:
    - src/cli/run.ts
    - tests/cli/errors.test.ts
    - tests/e2e/anchored-review.spec.ts
key-decisions:
  - "Only browser URL launch is cmux-aware; launch-owned draft reveal remains the direct system open adapter."
  - "The packaged test deletes inherited CMUX_WORKSPACE_ID and proves its own executable fake open intercepted the published URL."
requirements-completed: [QUICK-260723-MZP]
duration: 4min
completed: 2026-07-23
status: complete
---

# Quick Task 260723-mzp Summary

**Browser URL launch now routes through `cmux open <url>` only inside cmux, while focused unit and packaged Chromium tests keep every opener hermetic.**

## Performance

- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added a presence-based `CMUX_WORKSPACE_ID` browser URL opener that awaits a fixed, shell-free `cmux open <url>` invocation and retains the `open` package outside cmux.
- Kept injected `openBrowser` as the runtime override and left the separate `revealDraftFile(canonicalPath)` direct `open` adapter unchanged.
- Made the anchored packaged fake `open` executable, per-launch observable, and mandatory before Playwright consumes the printed loopback URL.

## Task Commits

1. **Task 1: Route only production browser URLs through cmux** — `b6510e6c917feaea4d851fc395e6f3598eaf1e64` (`fix(260723-mzp): route browser URLs through cmux`)
   - `src/cli/run.ts`
   - `tests/cli/errors.test.ts`
2. **Task 2: Make the anchored packaged opener executable and observable** — `ce6504ea93b9a2e98c8b28dbd308897b8ca03c57` (`test(260723-mzp): keep packaged browser launch hermetic`)
   - `tests/e2e/anchored-review.spec.ts`

## Verification

- RED: `node scripts/run-focused-vitest.mjs tests/cli/errors.test.ts` failed as intended because `createBrowserUrlOpener` was absent (`TypeError: createBrowserUrlOpener is not a function`).
- GREEN: `node scripts/run-focused-vitest.mjs tests/cli/errors.test.ts` passed: 1 file, 15 tests.
- `npx playwright test tests/e2e/anchored-review.spec.ts --project=chromium --workers=1 --reporter=line` passed on the final focused run: 2 Chromium tests in 8.9s. The packaged path built and packed production output, used the executable fake opener, observed its exact URL marker, and ran headless Chromium scenarios.
- Parent verification reruns also reached the fake-opener interception before later failing in the concurrently modified Monaco unchanged-region flow; the browser-routing assertion itself completed without a host browser or cmux launch.

## Decisions Made

- `CMUX_WORKSPACE_ID !== undefined` is the selector so an empty workspace value still selects cmux.
- The cmux process is fixed to executable `cmux`, arguments `['open', url]`, and `shell: false`; failures remain inside the existing best-effort opener fallback.
- Fake opener marker files are unique per generated CLI process, preventing stale launches from satisfying the URL interception check.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The first focused Playwright invocation timed out waiting for a newly added comment to appear in the rail while the mutation returned 201. The identical focused command immediately passed both scenarios; no task-scoped code change was made for the non-reproducing failure.
- During parent verification, the separate active Phase 04-05 executor had uncommitted UI changes on main. Three reruns reached the intercepted loopback URL, then failed in `activateMonacoLine` because Monaco's unchanged-region control was detached or absent. That concurrent UI failure is outside this quick task's three plan-owned files.

## User Setup Required

None - no external service or configuration required.

## Self-Check: PASSED

- Both requested task commits are atomic and contain only their plan-owned implementation/test files.
- Both requested focused commands passed on their final runs.
- No formatter, linter, project-wide test suite, branch, worktree, ROADMAP.md, or unrelated Phase 4 file was changed by this task.
