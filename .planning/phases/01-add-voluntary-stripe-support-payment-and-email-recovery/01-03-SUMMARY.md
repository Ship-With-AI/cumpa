---
phase: 01-add-voluntary-stripe-support-payment-and-email-recovery
plan: 03
subsystem: hosted-support-recovery
status: complete
tags: [recovery, resend, postgresql, render, tdd]
requires: [01-02]
provides: [email-recovery, installation-bound-magic-links, render-deployment]
affects: [services/support, render.yaml]
tech-stack:
  added: []
  patterns: [hmac-identity-lookup, opaque-single-use-token, postgres-transaction, native-fetch]
key-files:
  created:
    - services/support/src/recovery.ts
    - services/support/src/recovery-store.ts
    - services/support/src/email.ts
    - services/support/src/routes/recovery.ts
    - services/support/tests/recovery.test.ts
    - services/support/tests/deployment.test.ts
    - services/support/tests/postgres-recovery.integration.test.ts
    - render.yaml
  modified:
    - services/support/src/app.ts
    - services/support/migrations/001_init.sql
    - services/support/scripts/test-postgres.mjs
decisions:
  - Recovery normalizes then HMACs email identities and persists only keyed lookup bytes.
  - Confirmation GET is inert; only an opaque POST token consumption can bind its recorded installation.
  - Recovery delivery uses one 1000 ms-bounded native Resend fetch without SDK, queue, worker, or outbox.
metrics:
  completed: 2026-08-12
  tasks_completed: 3
---

# Phase 01 Plan 03: Hosted Recovery and Deployment Summary

Implemented hosted recovery with HMAC-only email identity, independent 256-bit opaque credentials, explicit confirmation, PostgreSQL single-use consumption, and Render deployment configuration.

## Delivered

- Recovery requests canonicalize `NFKC → trim → lowercase`, enforce request bounds, use hashed identity/token storage, create decoy challenges, and apply the shared generic accepted response floor.
- Magic-link delivery calls Resend exactly once through native `fetch` with a 1000 ms abort boundary; raw email/token values do not enter durable records.
- Challenge polling requires its narrow bearer; confirmation GET remains cache-free and read-only, while POST transactionally consumes the token and creates the requesting installation binding.
- Recovery tables add hashed challenge and persisted IP/keyed-email rate-limit windows. The PostgreSQL harness accepts focused Vitest paths.
- Render blueprint declares Node 24 web service, managed PostgreSQL, and dashboard-supplied secret environment names without credential values.

## Verification

- `npm --prefix services/support test -- --run tests/recovery.test.ts tests/deployment.test.ts` — passed: 5 tests.
- `npm --prefix services/support run test:postgres -- tests/postgres-recovery.integration.test.ts` — passed: 2 tests against Docker PostgreSQL.
- `npm --prefix services/support test -- --run tests/fulfillment.test.ts tests/installations.test.ts tests/recovery.test.ts tests/deployment.test.ts` — passed: 22 tests.
- `npm --prefix services/support run test:postgres -- tests/postgres-payment.integration.test.ts tests/postgres-recovery.integration.test.ts` — passed: 5 tests against Docker PostgreSQL.

## TDD Gate Compliance

- RED: `ea4f570 test(01-03): add failing recovery contracts`
- GREEN: `346bc8d feat(01-03): implement magic link recovery`
- REFACTOR: `21535a6 refactor(01-03): close recovery privacy boundary`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Regression] Restored Stripe webhook registration after recovery wiring**
- **Found during:** Task 3
- **Issue:** The recovery app composition edit omitted the existing Stripe webhook import, breaking the hosted payment authority regression tests.
- **Fix:** Restored the established webhook route import while keeping recovery registration additive.
- **Files modified:** `services/support/src/app.ts`
- **Verification:** Hosted payment and installation unit tests plus PostgreSQL payment integration passed.
- **Commit:** `21535a6`

**Total deviations:** 1 auto-fixed. **Impact:** Existing webhook/payment behavior remains intact.

## Self-Check: PASSED

- Required recovery source, migration, route, tests, PostgreSQL integration test, Render blueprint, and all RED/GREEN/REFACTOR commits exist.
- No plaintext email/token fixture is persisted in recovery records; no new untracked generated runtime artifacts were created.
