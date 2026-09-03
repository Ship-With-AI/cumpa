---
phase: 02-move-the-implementation-to-supabase
plan: 13
subsystem: testing
tags: [supabase, playwright, support, retirement, assertion-migration]
requires:
  - phase: 02-12
    provides: exact standalone Node support runtime retirement while retaining active Supabase replacements
provides:
  - Canonical-origin deployment evidence assertions in the active payment E2E suite
  - Removal of the stale recovery E2E suite and six standalone-service test files
affects: [02-14, 02-15, 02-16, 02-17]
tech-stack:
  added: []
  patterns:
    - Preserve every active assertion with an explicit source-to-destination inventory before retiring a suite
key-files:
  created:
    - .planning/phases/02-move-the-implementation-to-supabase/02-13-SUMMARY.md
  modified:
    - tests/e2e/support-payment.spec.ts
    - tests/e2e/support-recovery.spec.ts
    - services/support/tests/deployment.test.ts
    - services/support/tests/fulfillment.test.ts
    - services/support/tests/installations.test.ts
    - services/support/tests/postgres-payment.integration.test.ts
    - services/support/tests/postgres-recovery.integration.test.ts
    - services/support/tests/recovery.test.ts
key-decisions:
  - "The post-02-08 recovery suite contained one active canonical-origin evidence contract; it now lives unchanged in the payment suite."
  - "No source assertion mapped to restore; its active OAuth, fixture, approval, promotion, cleanup, restore, and non-enumeration coverage remains unchanged."
patterns-established:
  - "Retire stale support tests only after destination suites pass both before and after deletion."
requirements-completed: [PAY-01, PAY-02, PAY-03, PAY-04, SUP-01, SUP-02, SUP-03, SUP-04, SUP-05, REC-01, REC-02, REC-03]
duration: 142min
completed: 2026-09-03
status: complete
---

# Phase 02 Plan 13: Recovery Assertion Migration and Legacy Test Retirement Summary

**Canonical default-origin evidence validation now resides in the durable payment E2E suite; stale recovery and standalone-service tests are removed without reducing active Supabase contracts.**

## Performance

- **Started:** 2026-09-03T14:43:01Z
- **Completed:** 2026-09-03T17:05:22Z
- **Tasks:** 2/2
- **Files modified:** 8

## Accomplishments

- Migrated the sole active `support-recovery.spec.ts` contract to `support-payment.spec.ts` with its original title and seven behavioral rejections intact.
- Proved the payment and restore E2E suites before source deletion, after source deletion, and after standalone-service test retirement.
- Deleted only the six named legacy Node-service tests; active root, Deno, Supabase, workflow, payment, and restore tests were not changed.

## One-to-One Recovery Assertion Inventory

Execution-time source inventory: one active title, **`run evidence validation permits only canonical default-origin routes and fails closed`**, with seven substantive assertions. The complete test now appears in `tests/e2e/support-payment.spec.ts:39-63` under the identical title.

| Source assertion | Destination assertion |
| --- | --- |
| `support-recovery.spec.ts:30` rejects a missing `--expected-mode` | `support-payment.spec.ts:53` rejects the same missing option |
| `support-recovery.spec.ts:31` rejects duplicate `--expected-mode` | `support-payment.spec.ts:54` rejects the same duplicate option |
| `support-recovery.spec.ts:32` rejects duplicate `--require-immutable-run` | `support-payment.spec.ts:55` rejects the same duplicate option |
| `support-recovery.spec.ts:33` rejects an `--acceptance` flag without a value | `support-payment.spec.ts:56` rejects the same malformed invocation |
| `support-recovery.spec.ts:34` rejects evidence version 99 | `support-payment.spec.ts:57` rejects the same invalid version |
| `support-recovery.spec.ts:37` rejects raw project-ref content in `release_label` | `support-payment.spec.ts:60` rejects the same protected/raw content |
| `support-recovery.spec.ts:39` rejects another Supabase host in `release_url` | `support-payment.spec.ts:62` rejects the same protected/raw content |

The fixture setup that establishes the canonical `https://abcdefghijklmnopqrst.supabase.co` origin, immutable run, and evidence shape also migrated unchanged at `support-payment.spec.ts:40-52`.

`tests/e2e/support-restore.spec.ts` retains its active OAuth, exact fixture-manifest, approval, promotion, cleanup, restore, and non-enumeration contracts. The source suite had no assertion in those categories, so no source-to-restore mapping was required.

## Task Commits

1. **Task 1: Inventory and migrate every active recovery assertion before deletion** — `222d920` (`test`)
2. **Task 2: Delete tests for the retired standalone service** — `dbb0832` (`test`)

## Files Created/Modified

- `tests/e2e/support-payment.spec.ts` — durable canonical-origin deployment-evidence contract.
- `tests/e2e/support-recovery.spec.ts` — deleted after its complete contract passed in the destination suites.
- `services/support/tests/deployment.test.ts` — deleted legacy Render deployment test.
- `services/support/tests/fulfillment.test.ts` — deleted legacy Fastify/Stripe fulfillment test.
- `services/support/tests/installations.test.ts` — deleted legacy installation-status test.
- `services/support/tests/postgres-payment.integration.test.ts` — deleted obsolete standalone PostgreSQL payment integration test.
- `services/support/tests/postgres-recovery.integration.test.ts` — deleted obsolete standalone PostgreSQL recovery integration test.
- `services/support/tests/recovery.test.ts` — deleted legacy email-recovery test.

## Verification

- Before deleting `support-recovery.spec.ts`: `npx playwright test --config=tests tests/e2e/support-payment.spec.ts tests/e2e/support-restore.spec.ts` — **10 passed** (5.5s).
- After deleting `support-recovery.spec.ts`: same command — **10 passed** (2.2s).
- After deleting the six named standalone-service tests: exact six-file absence check followed by the same command — **10 passed** (2.6s).

## Decisions Made

- Kept the migrated title and each behavioral rejection identical rather than replacing the contract with source-text checks.
- Removed only the task allowlist of six obsolete standalone-service tests.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness

- Stale support-recovery and standalone Node-service test surfaces are gone.
- Active payment and restore E2E contracts remain executable for subsequent Phase 02 work.

## Self-Check: PASSED

---
*Phase: 02-move-the-implementation-to-supabase*
*Completed: 2026-09-03*
