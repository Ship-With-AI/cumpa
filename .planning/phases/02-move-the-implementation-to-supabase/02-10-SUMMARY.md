---
phase: 02-move-the-implementation-to-supabase
plan: 10
subsystem: live-promotion
status: complete
tags: [supabase, stripe, github-oauth, cleanup, production]

requires:
  - phase: 02-09
    provides: approved exact six-table fixture manifest
provides:
  - Atomic exact-manifest cleanup with repeated zero-authority proof
  - Same-project production-live GitHub OAuth and Stripe deployment
  - Live Stripe Price and webhook coherence verification
  - Non-destructive live route and generic status smoke
  - Immutable cleanup and live artifacts bound into one promotion record
affects: [02-11, 02-12, 02-13, 02-14, 02-15, 02-16, 02-17]

tech-stack:
  added: []
  patterns:
    - Lock and recheck the complete accepted authority set before atomic deletion
    - Prove zero authority before and after same-project live deployment
    - Validate live provider coherence before any hosted mutation

key-files:
  created:
    - .planning/phases/02-move-the-implementation-to-supabase/02-10-LIVE-PROMOTION-EVIDENCE.md
  modified:
    - .github/workflows/deploy-supabase-production.yml
    - scripts/verify-supabase-support.mjs
    - tests/e2e/support-payment.spec.ts
    - tests/e2e/support-restore.spec.ts

key-decisions:
  - "Delete only the approved table-qualified raw keys inside one locked PostgreSQL transaction."
  - "Reject live promotion unless authority is already zero and the configured live Price and webhook are coherent."
  - "Keep live smoke non-destructive: route probes plus one random generic-unverified status lookup only."
  - "Bind complete cleanup and live records, their artifact digests, canonical origin, fingerprint, and immutable run lineages into final evidence."

patterns-established:
  - "A failed provider gate exits before schema, Auth, secret, or function mutation."
  - "Promotion evidence embeds both immutable run records so every zero, route, coherence, and lineage claim remains independently verifiable."

requirements-completed: [PAY-01, PAY-03, PAY-04, REC-01, REC-02, REC-03]
duration: N/A
completed: 2026-09-03
---

# Phase 02 Plan 10: Live Promotion Summary

**The approved prelaunch authority was deleted exactly, the same Supabase project was promoted to coherent live providers, and immutable evidence proves zero authority before and after a non-destructive live smoke.**

## Accomplishments

- Cleanup run `33757825727` matched every approved table-qualified SHA-256 handle, deleted in dependency-safe order inside one guarded atomic transaction, and proved all six authority tables zero twice.
- Preserved the sole canonical project origin and fingerprint throughout cleanup and promotion.
- Verified the live Stripe secret mode, active one-time USD 49.99 Price, enabled canonical webhook endpoint, and exactly the two supported Checkout events before mutation.
- Live run `33763437194` passed repository gates, guarded schema/Auth/secret/function deployment, all route probes, and a generic-unverified status probe.
- Proved all six authority tables were zero immediately before live mutation and unchanged after smoke.
- Combined both immutable run records and artifact digests into `02-10-LIVE-PROMOTION-EVIDENCE.md`.

## Task Commits

- `e36636d` — implement and execute approved exact cleanup.
- `c1fa8a4` — record cleanup evidence and prepare live promotion.
- `a25a75e` — trigger promotion after protected mode correction.
- `c22ac35` — add bounded provider-coherence failure markers.
- `d260778` — trigger successful promotion after webhook event correction.

## Verification

- `npx playwright test --config=tests tests/e2e/support-payment.spec.ts tests/e2e/support-restore.spec.ts` — passed.
- Cleanup artifact validation with exact-cleanup, zero-authority, acceptance, and immutable-run requirements — passed.
- GitHub Actions cleanup run `33757825727` — repository gates and protected exact cleanup passed.
- GitHub Actions live run `33763437194` — repository gates and protected live deployment passed.
- Final promotion validation with cleanup/live run, one-fingerprint, zero-authority, non-destructive, and immutable-run requirements — passed.

## Deviations from Plan

- The first live attempt observed the protected mode still set to prelaunch and failed closed before mutation.
- The next live attempts found the webhook event set incomplete; bounded diagnostics identified only the failed coherence category, and promotion remained mutation-free until the exact event set was corrected.
- Corrective attempts used new ordinary pushes to protected `main`; no workflow dispatch or rerun bypass was used.

## Next Plan Readiness

Plans 02-11 through 02-14 can now remove the retired Render, PostgreSQL, Fastify, and Resend paths while preserving the proven live Supabase flow.

---

*Completed: 2026-09-03*
