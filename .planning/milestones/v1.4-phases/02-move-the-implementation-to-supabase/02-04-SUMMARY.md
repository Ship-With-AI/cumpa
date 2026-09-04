---
phase: 02-move-the-implementation-to-supabase
plan: 04
subsystem: local-support-api
tags: [supabase, support, fastify, zod, vitest, tdd]

# Dependency graph
requires:
  - phase: 02-move-the-implementation-to-supabase
    provides: "Plan 02-03 anonymous hosted support-api start/status capability."
provides:
  - "Strict local support/restore action and flow-result contracts."
  - "Bounded HTTPS support client and verified-only local promotion."
  - "Action-start/status/refresh loopback cutover without checkout or email recovery routes."
affects: [02-05, 02-06, support-dialog, package-safety]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Loopback start injects the persisted installation ID; browser input is action-only."
    - "Hosted flow responses must remain on the configured HTTPS capability origin."

key-files:
  created: []
  modified:
    - src/contracts/api.ts
    - src/server/support-client.ts
    - src/server/capabilities.ts
    - src/server/routes.ts
    - tests/api/support.test.ts

key-decisions:
  - "The local transport has only support/restore actions; an action response never changes persisted support authority."
  - "Only refresh may promote the existing local store after hosted verified status; unverified and failed observations leave verified state intact."

patterns-established:
  - "Hosted capability URLs are parsed against one configured HTTPS origin and response bodies are limited to 8 KiB with a five-second abort."

requirements-completed: [PAY-03, REC-02]

# Metrics
duration: 13min
completed: 2026-08-15
status: complete
---

# Phase 02 Plan 04: Loopback Support Cutover Summary

**Token-free Support/Restore start transport now delegates to bounded Supabase status capability while only verified refresh promotes machine-local state.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-08-15T11:11:55Z
- **Completed:** 2026-08-15T11:24:29Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Replaced checkout and email-recovery schemas with strict action-start and flow-result contracts.
- Replaced payment URL, recovery state, and recovery routes with one configured-HTTPS `start(action, installationId)` client operation and `start/status/refresh` loopback surface.
- Preserved the existing `SupportStateV1` format and verified-only monotonic promotion; started flows, unverified results, malformed responses, oversized responses, cross-origin URLs, and aborted calls cannot verify local state.

## Shared/Server Caller-Removal Inventory

- `src/contracts/api.ts`: removed `SupportCheckoutResultSchema`, `SupportRecoveryRequestSchema`, `SupportRecoveryResultSchema`, and `SupportRecoveryStatusSchema` plus inferred types.
- `src/server/support-client.ts`: removed `checkoutUrl`, `requestRecovery`, `recoveryStatus`, and `CUMPA_SUPPORT_PAYMENT_URL`; retains only `start`, `status`, and `close`.
- `src/server/capabilities.ts`: removed `checkout`, recovery state, `requestRecovery`, and `recoveryStatus`; exposes only `status`, `start`, `refresh`, and `close`.
- `src/server/routes.ts`: removed `/api/support/checkout`, `/api/support/recovery`, and `/api/support/recovery-status`; exposes `/api/support/start`, `/api/support/status`, and `/api/support/refresh`.
- `tests/api/support.test.ts`: replaced Phase 01 checkout/recovery assertions with action, bounds, abort, monotonicity, persisted-state, and route-removal coverage.

## Verification

- `npx vitest run tests/api/support.test.ts` — RED: failed as required against absent action-start interfaces and retained Phase 01 surface.
- `npx vitest run tests/api/support.test.ts tests/api/support-store.test.ts tests/api/security.test.ts` — passed: 3 files, 23 tests.
- Shared/server removal scan for checkout/recovery schemas, methods, routes, and `CUMPA_SUPPORT_PAYMENT_URL` — no matches.
- Hosted-link scan confirms the configured `CUMPA_SUPPORT_SERVICE_URL` and fixed `/functions/v1/support-api/start` and `/status` paths.

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — replace server payment/recovery tests with hosted action contracts** — `4b6ffa8` (test)
2. **Task 2: GREEN — cut shared contracts, hosted client, capability, and loopback routes** — `7b3dcd4` (feat)

## Files Created/Modified

- `src/contracts/api.ts` — strict readonly Support/Restore action, start request/result, and retained status schemas.
- `src/server/support-client.ts` — one-origin HTTPS client with POST start, GET status, five-second abort, and 8 KiB response ceiling.
- `src/server/capabilities.ts` — server-owned installation injection and refresh-only monotonic promotion.
- `src/server/routes.ts` — strict action-start route with existing status and refresh handlers.
- `tests/api/support.test.ts` — focused shared/server cutover contract tests.

## Decisions Made

- Retained the configured hosted origin as the only accepted flow URL origin; the current hosted API returns a support-flow URL on that same origin, so no Stripe redirect allowlist was needed.
- Left `SupportStateV1` and `support-store.ts` unchanged so existing verified local state remains valid without migration.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test assertion] Replaced Fastify route-tree text inspection with real route injection.**
- **Found during:** Task 2 (GREEN verification)
- **Issue:** `app.printRoutes()` renders compressed tree fragments, so a literal route-path assertion failed despite the route being registered.
- **Fix:** Assert the valid action endpoint and removed routes through `app.inject()` instead.
- **Files modified:** `tests/api/support.test.ts`
- **Verification:** Focused API/store/security suite passes 23 tests.
- **Committed in:** `7b3dcd4`

---

**Total deviations:** 1 auto-fixed (1 test assertion).
**Impact on plan:** The test now verifies observable routing rather than Fastify debug formatting; no production scope changed.

## Issues Encountered

- `requirements.mark-complete PAY-03 REC-02` could not update `.planning/REQUIREMENTS.md` because it contains descriptions and traceability rows rather than checkbox requirements. State, progress, metric, decision, session, and roadmap tracking updated successfully.

## User Setup Required

None - hosted deployment and browser-flow evidence remain owned by later plans.

## Next Phase Readiness

- Plan 02-05 can migrate browser callers to `SessionClient.startSupportAction(action)` without checkout or recovery compatibility paths.
- Plan 02-06 can verify this fixed local transport against the hosted development capability.

---
*Phase: 02-move-the-implementation-to-supabase*
*Completed: 2026-08-15*

## Self-Check: PASSED

- Summary artifact exists.
- Task commits `4b6ffa8` and `7b3dcd4` exist.
