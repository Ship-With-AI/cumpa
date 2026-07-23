---
phase: 04-agent-ready-export
plan: 04
subsystem: git-api
tags: [git, gitignore, fastify, zod, inventory, authority]
requires:
  - phase: 04-agent-ready-export/04-01
    provides: reconciled canonical inventory and focused verification ledger
  - phase: 04-agent-ready-export/04-03
    provides: secured server capability registry and export route boundary
provides:
  - unconditional exclusion of root `.diff-review` paths from comparison inventory
  - fixed effective ignore-status probe and optional append-only `/.diff-review/` consent
  - separate secured status and consent endpoints with no caller-controlled Git or filesystem authority
affects: [04-05, 04-06, export-ui, receipt-ignore-ui]
tech-stack:
  added: []
  patterns: [byte-exact internal-path filtering, fixed-argument safe Git probe, append-confirmed fixed filesystem capability]
key-files:
  created: [src/git/ignore-status.ts, src/server/gitignore-capability.ts, tests/git/ignore-status.test.ts, tests/api/gitignore.test.ts]
  modified: [src/git/inventory.ts, src/contracts/api.ts, src/server/capabilities.ts, src/server/routes.ts, tests/git/inventory.test.ts]
key-decisions:
  - "Internal paths are excluded from inventory by exact decoded bytes, never by user ignore configuration."
  - "Ignore consent is a fixed `/.diff-review/` append capability whose result is confirmed by reread and a fixed safe Git probe."
patterns-established:
  - "User-facing routes expose narrow server-held actions; request bodies and query fields do not provide Git or filesystem authority."
  - "Append-only mutation reports unconfirmed rather than claiming success when target identity or bytes cannot be proved."
requirements-completed: [EXP-08, SAFE-04]
duration: execution session
completed: 2026-07-23
status: complete
---

# Phase 04 Plan 04: Internal Paths and Optional Ignore Consent Summary

**Exact internal `.diff-review` inventory exclusion plus a separately secured, append-only ignore consent action with byte-preserving confirmation.**

## Performance

- **Duration:** Execution session
- **Started:** Not recorded by harness
- **Completed:** 2026-07-23T14:26:25Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Excluded only exact root `.diff-review` and descendant path bytes from inventory, regardless of Git ignore state, while retaining near matches.
- Added an effective ignore-status probe using fixed `git check-ignore --no-index --quiet -- .diff-review/.diff-review-ignore-probe` arguments through the safe runner.
- Added distinct secured status and no-payload append endpoints. The append capability can only add the fixed rule, preserves original bytes, serializes concurrent calls, and returns `unconfirmed` when it cannot prove a safe result.

## Task Commits

1. **Task 1: Add internal exclusion and effective ignore inspection**
   - `c9fcc60` — RED tests
   - `294ecbf` — inventory filter and fixed safe probe
2. **Task 2: Extend the shared secured registry with exact append-only consent action**
   - `50e8d0c` — RED tests
   - `d417a24` — capability, schemas, secured routes, and unsafe-target coverage

## Files Created/Modified

- `src/git/inventory.ts` — excludes decoded exact internal path bytes before inventory output.
- `src/git/ignore-status.ts` — exposes the fixed, safe effective-ignore status probe.
- `src/server/gitignore-capability.ts` — serializes, safely appends, rereads, and reprobes the fixed rule.
- `src/contracts/api.ts` — adds strict status and append result schemas.
- `src/server/capabilities.ts` — keeps ignore inspection and consent as narrow server-held capabilities.
- `src/server/routes.ts` — provides separate `GET` status and `POST` consent endpoints with empty request algebra.
- `tests/git/inventory.test.ts` and `tests/git/ignore-status.test.ts` — cover unconditional path exclusion and real effective ignore behavior.
- `tests/api/gitignore.test.ts` — covers secured request denials, byte preservation, symlink/directory/concurrency refusal, and append confirmation.

## Decisions Made

- Internal path exclusion is based on decoded byte equality for `.diff-review` or `.diff-review/…`; it is not optional and does not consult ignore rules.
- The append operation accepts no caller-controlled path, rule, repository, or command. It opens only the repository-root `.gitignore` without symlink following, verifies identity and bytes after mutation, then confirms effective ignore status.

## Verification

- `node .planning/phases/04-agent-ready-export/validate-reconciliation.mjs .planning/phases/04-agent-ready-export/04-01-RECONCILIATION.json` — passed before implementation.
- Reconciled `04-04-inventory-ignore` command — 8 files and 35 tests passed.
- Reconciled `04-04-gitignore-api` command — 14 files and 87 tests passed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Correctness] Removed unsupported Fastify zero-byte body limit**
- **Found during:** Task 2 focused API verification.
- **Issue:** Fastify rejects `bodyLimit: 0` at route registration, preventing the secured session app from starting.
- **Fix:** Retained the explicit empty body/content-type/content-length guard while removing the invalid limit.
- **Files modified:** `src/server/routes.ts`
- **Verification:** Reconciled API command passed 87 tests.
- **Committed in:** `d417a24`

---

**Total deviations:** 1 auto-fixed (1 correctness)
**Impact on plan:** The route remains no-payload and grants no broader authority.

## Issues Encountered

- The initial denial matrix incorrectly treated the intended `GET /api/export/gitignore` status endpoint as a rejected method; it now tests an unsupported `PUT` method while status behavior is asserted separately.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 04 UI plans can query effective ignore status and request the exact append-only consent action without receiving generic Git or filesystem access.
- No blocker identified.

## Self-Check: PASSED

- Required summary exists and all four Task 1/Task 2 RED/GREEN commit objects are present.
- Both reconciled focused verification commands passed after the final feature commit.

---
*Phase: 04-agent-ready-export*
*Completed: 2026-07-23*
