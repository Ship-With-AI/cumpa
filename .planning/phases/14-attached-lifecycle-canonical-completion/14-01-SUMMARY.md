---
phase: 14-attached-lifecycle-canonical-completion
plan: "01"
subsystem: api
tags: [fastify, zod, vitest, draft-persistence, canonical-json]
requires:
  - phase: 13-exact-patch-grounding
    provides: Frozen exact-patch sessions and canonical V3 provenance
provides:
  - Attached-only authenticated Finish lifecycle for range and exact-patch sessions
  - One-shot completion coordinator and typed retry-safe versus terminal outcomes
  - Queue-held two-phase draft settlement with non-persisted revision-zero missing drafts
affects: [14-02, 14-03, attached-review-handoff]
tech-stack:
  added: []
  patterns:
    - Session-local coordinator owns completion state while DraftStore owns the mutation queue
    - Completion validates and delivers one existing canonical V2/V3 document without publication
key-files:
  created: [src/server/attached-completion.ts, tests/api/attached-completion-coordinator.test.ts, tests/api/attached-completion.test.ts]
  modified: [src/contracts/api.ts, src/server/draft-store.ts, src/server/capabilities.ts, src/server/routes.ts]
key-decisions:
  - "Keep lifecycle state in memory and out of persisted review drafts."
  - "Use DraftStore's existing per-draft queue through final validation and delivery."
patterns-established:
  - "Attached capabilities are opt-in composition dependencies; interactive sessions receive neither metadata nor routes."
  - "Finish uses existing canonical export builders and never calls ordinary export publication."
requirements-completed: [HAND-01, HAND-02, HAND-03, HAND-04, HAND-05]
duration: 14min
completed: 2026-08-05
status: complete
---

# Phase 14 Plan 01: Attached Lifecycle Canonical Completion Summary

**Attached range and exact-patch sessions now finish only through an authenticated one-shot server transaction that validates and delivers canonical review bytes.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-08-05T16:11:40Z
- **Completed:** 2026-08-05T16:25:50Z
- **Tasks:** 3/3
- **Files modified:** 8

## Accomplishments

- Added strict attached-session metadata, lifecycle status, Finish request, and result contracts without exposing canonical bytes to browser responses.
- Added `AttachedCompletionCoordinator` and queue-safe `DraftStore.settle`, including missing revision-zero drafts that remain unpersisted.
- Attached range and exact-patch capabilities now validate submitted scope, every anchor, and parsed canonical V2/V3 bytes immediately before one delivery; routes remain absent from ordinary sessions.

## Task Commits

1. **Task 1: RED — specify two-phase settlement, missing-draft completion, and shared outcomes** — `9044b2b` (test)
2. **Task 2: GREEN — implement strict outcomes, coordinator, and two-phase DraftStore settlement** — `f440742` (feat)
3. **Task 3: GREEN/REFACTOR — wire final scope, anchor, canonical-byte, route, and response checks** — `9b4e5e1` (feat)

## Files Created/Modified

- `src/contracts/api.ts` — strict attached metadata and lifecycle schemas.
- `src/server/attached-completion.ts` — shared in-flight, immutable-completed, and terminal-failure coordinator.
- `src/server/draft-store.ts` — serialized prepare/finalize settlement with missing-draft sentinel behavior.
- `src/server/capabilities.ts` — range and exact-patch canonical finalization and byte delivery.
- `src/server/routes.ts` — attached-only authenticated status and Finish routes with strict status mapping.
- `tests/api/attached-completion-coordinator.test.ts` — direct coordinator and queue-settlement coverage.
- `tests/api/attached-completion.test.ts` — attached metadata, strict routes, explicit completion, duplicate, and ordinary-session coverage.

## Decisions Made

- Reused V2/V3 builders and `parseCanonicalReviewExport`; no completion wrapper, export publication, or second serializer was added.
- Kept completion state session-local and used the existing DraftStore queue rather than adding another lock.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Verification

- **RED:** `npm exec -- vitest run tests/api/attached-completion-coordinator.test.ts tests/api/attached-completion.test.ts tests/api/draft-atomicity.test.ts tests/api/draft-recovery-faults.test.ts tests/api/session.test.ts tests/api/export.test.ts` exited 1 only because the new attached-completion module and lifecycle contracts were absent.
- **GREEN Task 2:** `npm exec -- vitest run tests/api/attached-completion-coordinator.test.ts tests/api/draft-atomicity.test.ts tests/api/draft-recovery-faults.test.ts` exited 0: 3 files, 30 tests.
- **GREEN Task 3:** `npm exec -- vitest run tests/api/attached-completion.test.ts tests/api/draft-atomicity.test.ts tests/api/draft-recovery-faults.test.ts tests/api/session.test.ts tests/api/export.test.ts` exited 0: 5 files, 59 tests.
- **Final scoped check:** the six-file command above exited 0: 6 files, 63 tests.

## Next Phase Readiness

- Plans 14-02 and 14-03 can consume attached lifecycle status, one-shot completion outcomes, queue-held finalization, and canonical byte delivery.
- No blocker remains.

## Self-Check: PASSED

- Confirmed task commits `9044b2b`, `f440742`, and `9b4e5e1` exist.
- Confirmed the final plan-scoped API/persistence command passes.
- Confirmed attached routes are opt-in, ordinary export remains independent, and no interactive lifecycle route is registered.

---
*Phase: 14-attached-lifecycle-canonical-completion*
*Completed: 2026-08-05*
