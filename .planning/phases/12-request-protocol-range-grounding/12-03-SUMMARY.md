---
phase: 12-request-protocol-range-grounding
plan: 03
subsystem: cli-session-contracts
tags: [typescript, commander, stdin, zod, fastify, vitest]
requires:
  - phase: 12-request-protocol-range-grounding
    plan: 01
    provides: Strict bounded versioned request reader and typed request failures
  - phase: 12-request-protocol-range-grounding
    plan: 02
    provides: Immutable pinned range comparison and typed native pathspec failure
provides:
  - TTY/non-TTY ordinary-action dispatch before picker construction
  - Pre-launch typed request/range failure boundary with stderr-only diagnostics
  - Strict frozen range projection in authenticated session responses
affects: [12-04, 12-05, 12-06, agent-review-handoff]
tech-stack:
  added: []
  patterns: [strict TTY ownership dispatch, typed pre-launch error boundary, server-derived range session projection]
key-files:
  created: []
  modified:
    - src/cli/run.ts
    - src/contracts/api.ts
    - src/server/capabilities.ts
    - tests/cli/request.test.ts
    - tests/api/session.test.ts
key-decisions:
  - "Keep runCli as the sole interactive picker owner; dispatch only at the Commander ordinary action."
  - "Project range endpoints and ordered pathspecs from PinnedComparison.range and validate their equality with session endpoints."
patterns-established:
  - "Non-TTY request/range validation completes before launchPinnedComparison can bind or open a browser."
  - "Session range DTOs expose full pinned OIDs and ordered pathspecs, never submitted labels or server authority."
requirements-completed: [AGENT-01, AGENT-02, AGENT-03, RANGE-03]
duration: 10 min
completed: 2026-08-04
status: complete
---

# Phase 12 Plan 03: Pre-browser Request Dispatch and Frozen Session Scope Summary

**One strict non-TTY request path now grounds a pinned range before launch, while the existing TTY picker remains unchanged and authenticated sessions expose only frozen range scope.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-08-04T19:16:12Z
- **Completed:** 2026-08-04T19:26:25Z
- **Tasks:** 3/3
- **Files modified:** 5

## Accomplishments

- Added an injected ordinary-action dispatcher which selects TTY ownership before any request read or picker behavior.
- Routed valid non-TTY requests through the Plan 12-01 reader and Plan 12-02 range builder before one existing pinned-comparison launch.
- Added a strict, server-derived range session DTO containing matching full OIDs and exact ordered pathspecs only.

## Task Commits

| Task | Commit | Outcome |
| --- | --- | --- |
| 1. RED — specify stream ownership, safe range failure, and session projection | `f2fa2a7` | Focused command exited 1 only on the absent ordinary-action dispatch and range session projection; existing TTY authority passed. |
| 2. GREEN — route before prompts and project one immutable session scope | `40935f3` | Identical focused command passed: 3 files, 59 tests. |
| 3. REFACTOR — remove only duplicate dispatch or projection glue | No code change | No-op: distinct TTY/non-TTY owners and direct session projection contain no duplicate glue; identical focused command passed. |

## Files Created/Modified

- `src/cli/run.ts` — dispatches ordinary actions by strict TTY state and grounds non-TTY requests before launch.
- `src/contracts/api.ts` — defines the optional strict range session projection and endpoint consistency refinement.
- `src/server/capabilities.ts` — derives range response data only from the frozen comparison.
- `tests/cli/request.test.ts` — proves stream ownership, launch count, and typed pre-launch diagnostics.
- `tests/api/session.test.ts` — proves exact frozen range scope and absence of authority leakage.

## Verification

- **RED:** `npm exec -- vitest run tests/cli/request.test.ts tests/cli/selection.test.ts tests/api/session.test.ts` exited 1 with 7 intended failures: six missing ordinary-action behaviors and one missing range projection. The unchanged selection suite passed.
- **GREEN:** The identical command exited 0: 3 files and 59 tests passed.
- **REFACTOR:** The identical command exited 0: 3 files and 59 tests passed.
- The invalid-native-pathspec vector returns status 1, one diagnostic shorter than 256 characters, empty stdout, and zero launch calls; it does not contain submitted pathspec or Git stderr text.
- Typed process-error vectors covered: `AgentRequestError`, `endpoint-unavailable`, `non-ancestor-range`, and `invalid-pathspec`.
- Existing TTY authority retained its injected event order: `discover` → `pick-base-head` → `pin-comparison` → `confirm` → `launch`; no PTY or performance-harness path was added.
- Range session artifacts are `kind: revisions`, the full frozen base/head OIDs, and the exact ordered `pathspecs`; `requestedBase`, `requestedHead`, `reviewKey`, repository root, blob OIDs, and token remain absent.

## Decisions Made

- Use exactly one small ordinary-action dispatcher rather than a second CLI or request-shape sniffing path.
- Let `SessionResponseSchema` reject a range projection whose frozen OIDs do not match the session endpoints.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed. **Impact:** No scope change.

## Issues Encountered

None.

## Next Phase Readiness

- Plans 12-04 through 12-06 can consume the authenticated frozen range session scope without adding browser authority.
- No blocker or external setup is required.

## Self-Check: PASSED

- Confirmed required RED `f2fa2a7` and GREEN `40935f3` commits exist and contain no tracked-file deletions.
- Confirmed the identical focused Vitest command passed after GREEN and the no-op REFACTOR gate.
- Confirmed no dependency, PTY harness, request-content echo, client-side pathspec filter, or compatibility shim was introduced.
