---
status: resolved
trigger: "Two Phase 14 regressions: corrupt exact snapshot manifest GET /api/session returns 200 instead of 500; exact-patch CLI dispatch times out after 10s after printing server URL. Find actual shared root cause, preserve Phase 14 behavior, fix and commit atomically."
created: 2026-08-05T17:47:27Z
updated: 2026-08-05T19:52:45Z
---

## Current Focus

hypothesis: Phase 14 changed the definition of “attached” at shared launch/app-composition boundaries, causing ordinary legacy callers to inherit completion waiting while session composition stopped forcing snapshot validation on session reads
test: compare src/cli/run.ts and exact-patch capability/app composition against their pre-Phase-14 versions and trace every caller
expecting: a single opt-in dependency or launcher distinction was lost or broadened in Phase 14
next_action: none — fixed and verified in Phase 14

## Symptoms

expected: corrupting the exact snapshot manifest makes GET /api/session return 500; exact-patch CLI dispatch completes within the existing 10 second contract
actual: GET /api/session returns 200 after manifest corruption; exact-patch CLI dispatch prints the server URL and waits until the test times out
errors: "tests/api/exact-patch.test.ts:291 expected 500, received 200; tests/cli/selection.test.ts:594 timed out after 10000ms"
reproduction: "npm exec -- vitest run tests/api/exact-patch.test.ts; npm exec -- vitest run tests/cli/selection.test.ts"
started: after completed Phase 14 plans; both are Phase 13 regression contracts

## Eliminated

## Evidence

- timestamp: 2026-08-05T17:50:04Z
  checked: Phase 14 summaries and named regression contracts
  found: Plan 14-01 modified capabilities/routes for attached completion; Plan 14-03 replaced ordinary non-TTY range/exact-patch launch with a shared attached launcher that intentionally waits for Finish. Existing exact-patch API test requires /api/session to revalidate and latch corrupt snapshot state; existing selection test expects runOrdinaryAction to return after readiness.
  implication: Phase 14 changed both session capability composition and non-TTY dispatch lifecycle, so the regression boundary is likely shared launch/app composition rather than the assertions themselves.

- timestamp: 2026-08-05T17:50:39Z
  checked: isolated tests/api/exact-patch.test.ts reproduction
  found: 8 tests ran; only the corrupt-manifest session read failed, returning 200 instead of 500 at line 291. The remaining snapshot status, file content, export, drift, and snapshot-loss contracts passed.
  implication: snapshot validation still works through other exact-patch capabilities, but /api/session no longer traverses the validation boundary.

- timestamp: 2026-08-05T19:52:45Z
  checked: isolated tests/cli/selection.test.ts reproduction
  found: 13 tests ran; only exact-patch readiness dispatch timed out at 10 seconds. The server URL and Ctrl+C message printed, proving grounding, app creation, listen, security binding, and browser open all completed before the wait.
  implication: the regression is post-readiness lifecycle waiting, not grounding, app creation, or browser startup.

## Resolution

root_cause: Phase 14 cached the exact-patch session projection instead of revalidating the snapshot on each read, while a legacy CLI fixture invoked the new attached launcher without terminating its intentional Finish wait.
fix: Derive exact `/api/session` data from `snapshot.session()` on every request, and terminate the attached lifecycle explicitly in the legacy readiness fixture after browser launch.
verification: `tests/api/exact-patch.test.ts` and `tests/cli/selection.test.ts` passed 21/21; the broader attached lifecycle set passed 60/60.
files_changed: [src/server/capabilities.ts, tests/cli/selection.test.ts]
