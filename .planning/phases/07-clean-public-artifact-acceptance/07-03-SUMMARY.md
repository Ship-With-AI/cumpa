---
phase: 07-clean-public-artifact-acceptance
plan: 03
subsystem: testing
tags: [playwright, npm, acceptance, support, runtime]

requires:
  - phase: 07-clean-public-artifact-acceptance
    provides: pinned public runtime adapters and shared support-home policy
provides:
  - One install-source resolver for local archives and the two pinned public runtime paths.
  - Source-independent CLI version assertions and bounded public scenario records.
  - Explicit browser support observations separating enabled state, live status, and dismissal.
affects: [07-04, 07-05, 07-06, public-artifact-acceptance]

tech-stack:
  added: []
  patterns: [source-selected launch descriptor, public scenario record separation, support observation]

key-files:
  created:
    - tests/helpers/acceptance-runtime.ts
  modified:
    - tests/helpers/open-runtime-session.ts
    - tests/e2e/agent-ready-export.spec.ts
    - tests/e2e/package-assets.spec.ts

key-decisions:
  - "Keep local-archive evidence structurally unchanged while publishing public paths under separate scenario names."
  - "Require expectedVersion on every resolved runtime instead of reading local archive metadata at public call sites."

patterns-established:
  - "Acceptance suites select runtime source only through resolveAcceptanceRuntime and spawn its launch descriptor."
  - "Support startup evidence records enabled, observed live status, and prompt dismissal independently."

requirements-completed: [ACC-01, ACC-02, ACC-04]
duration: unrecorded
completed: 2026-09-12
status: complete
---

# Phase 07 Plan 03: Install-Source Acceptance Wiring Summary

**One resolver drives the established browser review and asset contracts through local-archive, pinned global-public, and pinned npx-public launch descriptors while preserving support-state observations.**

## Performance

- **Completed:** 2026-09-12T10:18:48Z
- **Tasks:** 3/3
- **Files modified:** 4

## Accomplishments

- Added a uniform acceptance runtime with explicit source selection, pinned public-version validation, and shared-support-HOME ownership.
- Returned support enabled state, observed live status, and dismissal independently from browser startup.
- Routed all three CLI spawns through the resolved descriptor, retained local-archive records exactly, and separated public records from local evidence.

## Task Commits

1. **Task 1: One resolver for the three install sources** — `1c0a1ee` (`feat`)
2. **Task 2: Make the session helper report the observed support state** — `ba2032a` (`feat`)
3. **Task 3: Drive both acceptance suites through the resolved launch descriptor** — `b924a83` (`test`)

## Files Created/Modified

- `tests/helpers/acceptance-runtime.ts` — resolves the selected runtime and supplies a uniform launch contract.
- `tests/helpers/open-runtime-session.ts` — returns separate support startup observations.
- `tests/e2e/agent-ready-export.spec.ts` — runs review/export/Finish scenarios through the resolved runtime and gates local-only support denial.
- `tests/e2e/package-assets.spec.ts` — runs CLI surface and browser assets through the resolved runtime with source-appropriate package checks.

## Decisions Made

- Local `review` and `package-assets` evidence records remain exactly shaped for the existing parser; public source runs publish `public-review` and `public-package-assets` records instead.
- A public path may not inherit the local archive's legal-file evidence or support-denial scenario.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The requested local-archive regression command was attempted with `CUMPA_PUBLIC_INSTALL_SOURCE` unset, but its existing driver stopped before launching Playwright because `CUMPA_RELEASE_SUPPORT_SERVICE_URL` was absent. No substitute origin was supplied or fabricated. This did not exercise the local browser contract; Plan 07-06 owns the configured runnable commands and per-path runs.

## User Setup Required

None - no external service configuration was changed. The later configured acceptance run requires its existing `CUMPA_RELEASE_SUPPORT_SERVICE_URL` and report-path prerequisites.

## Next Phase Readiness

- Plans 07-04 through 07-06 can select either public runtime with `CUMPA_PUBLIC_INSTALL_SOURCE` and retain one shared support identity through `CUMPA_ACCEPTANCE_SUPPORT_HOME`.
- Public runtime browser workflows were not executed here; their configured matrix and support-state evidence remain Plan 07-06 work.

## Self-Check: PASSED

```text
$ npx tsc --noEmit --project tsconfig.json && npx tsc --noEmit --project tsconfig.web.json
exit 0 (no diagnostics)

$ grep spawn descriptor sites
agent-ready-export.spec.ts: 2
package-assets.spec.ts: 1
no spawn site referenced fetchGuardPath or nodeEntrypointPath

$ env -u CUMPA_PUBLIC_INSTALL_SOURCE npm run accept:runtime-artifact
Error: CUMPA_RELEASE_SUPPORT_SERVICE_URL required candidate acceptance
```

The typechecks and static launch wiring passed. The configured local-archive browser regression and all public-source browser runs were intentionally not claimed as executed.
