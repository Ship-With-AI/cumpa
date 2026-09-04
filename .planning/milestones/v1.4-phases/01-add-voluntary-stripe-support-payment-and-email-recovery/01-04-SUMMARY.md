---
phase: 01-add-voluntary-stripe-support-payment-and-email-recovery
plan: 04
subsystem: local-support-client
status: complete
requires: [01-02, 01-03]
provides: [machine-support-state, authenticated-support-routes, hosted-support-client]
affects: [src/server, src/cli, src/web/api]
---

# Phase 01 Plan 04: Local Support Client Summary

Implemented the local, machine-wide support bridge: one installation ID/state file per user, outbound HTTPS hosted-status/recovery client, and fixed authenticated loopback support APIs. Support remains presentation-only and never gates review behavior.

## Delivered

- Strict shared Zod support DTO contracts without email, provider credentials, raw tokens, or installation identifiers in browser responses.
- Private OS-specific support state resolution, 32-byte base64url installation IDs, strict state reads, no-follow exclusive temporary writes, fsync/rename/parent-sync persistence, fail-closed corrupt/unsafe state handling, and monotonic verified promotion.
- Fixed HTTPS-only public-service/payment client with five-second request bound, eight KiB response ceiling, validated hosted responses, fixed route construction, and process-memory-only recovery poll credential.
- Existing Host/Origin/bearer-protected loopback routes for status, checkout, refresh, recovery request, and recovery status; browser client methods use the existing closure-held bearer.
- Support capability injection for ordinary, range, and exact-patch launch paths; shutdown clears transient recovery credentials and aborts hosted work.

## Commits

- `1e46a06 test(01-04): specify machine support state`
- `35505d5 feat(01-04): implement local support bridge`
- `af3e29b refactor(01-04): centralize support authority`
- `9404385 refactor(01-04): share support state across launches`

## Verification

- `npx tsc --noEmit` — passed.
- `npx vitest run tests/api/support-store.test.ts tests/api/support.test.ts tests/api/security.test.ts` — passed: 3 files, 17 tests.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED
