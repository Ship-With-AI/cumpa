---
phase: 01-add-voluntary-stripe-support-payment-and-email-recovery
plan: 02
subsystem: hosted-support-payment-authority
tags: [stripe, postgresql, fastify, webhook, tdd]
requires: [01-01]
provides: [verified-payment-fulfillment, installation-status]
affects: [services/support]
tech-stack:
  added: [fastify@5.10.0, stripe@22.5.0, pg@8.23.0, zod@4.4.3]
  patterns: [raw-webhook-signature-verification, retrieved-session-validation, postgresql-transaction]
key-files:
  created:
    - services/support/src/fulfillment.ts
    - services/support/src/routes/stripe-webhook.ts
    - services/support/migrations/001_init.sql
  modified: []
decisions:
  - Webhook bytes are verified before event data can trigger Stripe retrieval or database access.
  - A retrieved live Session with fixed Payment Link, Price, quantity, currency, amount, email, and installation reference is the only payment grant input.
  - Entitlements store only an HMAC-SHA-256 email lookup, never raw email.
metrics:
  completed: 2026-08-12
  tasks_completed: 3
status: complete
---

# Phase 01 Plan 02: Hosted Payment Authority Summary

Implemented a separately deployable Fastify/PostgreSQL payment authority that grants verified installation status only after raw-byte Stripe signature verification and live Checkout Session validation.

## Delivered

- Private Node 24 service graph with the approved exact hosted-only dependencies and Docker-backed PostgreSQL test runner.
- Immutable environment configuration, advisory-locked checksum migration runner, and PostgreSQL entitlement/event/binding constraints.
- Raw-body webhook endpoint that verifies `Stripe-Signature` before retrieval or fulfillment, accepts only `checkout.session.completed`, retrieves expanded line items, validates the fixed live payment invariants, and commits one idempotent transaction.
- Public `GET /v1/installations/:installationId/status` exposes only `verified` or `unverified`; `GET /healthz` exposes only process readiness.
- Email canonicalization (`NFKC`, trim, lowercase) and HMAC-only retention.

## TDD Gate Compliance

- RED: `1541473` — focused tests failed because the hosted application and migration runner did not exist.
- GREEN: `d96bcdd` — implemented the hosted authority and focused tests passed.
- REFACTOR: `645b270` — retained signature-first handling and serialized Session fulfillment; focused tests passed.

## Verification

Passed:

```text
npm --prefix services/support test -- --run tests/fulfillment.test.ts tests/installations.test.ts
# 2 files, 17 tests passed

npm --prefix services/support run test:postgres
# postgres:17.6-alpine; 1 file, 3 tests passed

npx tsc --noEmit
# passed in services/support
```

Docker PostgreSQL was available and the migration ran against a fresh ephemeral database.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- Required hosted source, migration, tests, service manifest, and lockfile exist.
- RED, GREEN, and REFACTOR commits exist.
