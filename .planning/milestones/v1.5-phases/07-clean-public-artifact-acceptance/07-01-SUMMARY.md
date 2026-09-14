---
phase: 07-clean-public-artifact-acceptance
plan: 01
subsystem: testing
tags: [vitest, zod, npm, artifact-identity, acceptance]

requires:
  - phase: 05-bootstrap-trusted-stable-publication
    provides: immutable published artifact identity evidence
provides:
  - Exact public npm artifact and installed-resolution guards.
  - Reusable isolated-install seams, launch descriptor, and bounded scenario publisher.
  - Status-preserving scenario evidence publication.
affects: [07-02, 07-03, public-artifact-acceptance]

tech-stack:
  added: []
  patterns: [exact pinned identity comparison, separator-bounded realpath containment, caller-controlled bounded evidence status]

key-files:
  created:
    - tests/helpers/public-artifact-identity.ts
    - tests/unit/public-artifact-identity.test.ts
    - tests/unit/publish-scenario-record.test.ts
  modified:
    - tests/helpers/runtime-artifact.ts

key-decisions:
  - "Pinned all public distribution equality checks to the immutable Phase 5 registry evidence."
  - "Kept local-tarball scenario records hard-stamped passed while allowing public adapters to publish partially-blocked evidence."

patterns-established:
  - "Public installation adapters consume exported isolation builders and a launch descriptor rather than copying runtime-artifact behavior."
  - "Path containment requires both relative-path and separator-boundary checks."

requirements-completed: [ACC-01, ACC-02]

duration: 1h 53m
completed: 2026-09-12
status: complete
---

# Phase 07 Plan 01: Clean Public Artifact Acceptance Summary

**Pinned public npm artifact checks reject substitutions, while reusable runtime seams preserve local-archive launch and evidence behavior.**

## Performance

- **Duration:** 1h 53m
- **Started:** 2026-09-12T09:12:58Z
- **Completed:** 2026-09-12T11:05:18Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Added frozen Phase 5 artifact identity, strict registry/install resolution assertions, separator-safe realpath containment, and an environment-independent PATH builder.
- Exposed the existing isolation environment builders and added the exact existing `node --import <fetch-guard> <entrypoint>` launch descriptor for local archive suites.
- Extracted bounded scenario publication so public adapters can record `partially-blocked`, while local archive records remain `passed`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Pin the public artifact identity and the isolation containment primitives** - `9a24ab5` (RED test), `602c765` (GREEN implementation)
2. **Task 2: Open the three reuse seams in the runtime-artifact helper** - `9e0ed34`
3. **Task 3: Prove the scenario publisher's status parameter and the pinned local-archive status** - `45bb30e`

## Files Created/Modified

- `tests/helpers/public-artifact-identity.ts` - Pinned immutable artifact data and pure install/containment guards.
- `tests/unit/public-artifact-identity.test.ts` - Behavioral coverage for substitutions, installed locks, realpath containment, and isolated PATH construction.
- `tests/helpers/runtime-artifact.ts` - Exported isolation seams, immutable launch descriptor, and reusable bounded publisher.
- `tests/unit/publish-scenario-record.test.ts` - Behavioral scenario-record status and privacy tests.

## Decisions Made

- Used exact string equality after strict Zod parsing; shape-valid rebuilt archives are rejected.
- Kept `writeRuntimeScenario` validation, scenario union, private-data rejection, publication mode, and local status behavior unchanged; it delegates only publication mechanics.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 07-02 and 07-03 can reuse the pinned identity, isolation builders, launch descriptor, and bounded publisher without duplicating local-archive logic.
- No public install, browser run, publication, push, or protected sign-in was performed.

## Self-Check: PASSED

- `npx vitest run tests/unit/public-artifact-identity.test.ts tests/unit/publish-scenario-record.test.ts` exited 0: **2 passed files, 10 passed tests**.
- `node scripts/run-focused-vitest.mjs tests/unit/public-artifact-identity.test.ts && node scripts/run-focused-vitest.mjs tests/unit/publish-scenario-record.test.ts` exited 0: **5 passed tests** in each targeted repository-runner invocation.
- `npx tsc --noEmit --project tsconfig.json` exited 0 with no diagnostics.
- Required artifact checks confirmed all three created files exist; `git log --oneline --all --grep='07-01'` contained `9a24ab5`, `602c765`, `9e0ed34`, and `45bb30e`.
- The local-archive launch descriptor was statically verified against the still-current e2e vector: `process.execPath` with frozen `['--import', fetchGuardPath, nodeEntrypointPath]`. The existing acceptance suites were not launched because this plan explicitly prohibits Playwright/install runs.
