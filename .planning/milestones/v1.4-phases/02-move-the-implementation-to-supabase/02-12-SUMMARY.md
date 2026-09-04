---
phase: 02-move-the-implementation-to-supabase
plan: 12
subsystem: infrastructure
tags: [supabase, retirement, fastify, recovery, stripe, cleanup]
requires:
  - phase: 02-11
    provides: exact seven-file legacy provider/schema retirement after immutable 02-10 promotion evidence
provides:
  - Complete removal of the standalone Node support runtime and legacy routes
  - Positive retention proof for the local Cumpa app and all active Supabase Edge Functions
affects: [02-13, 02-14, 02-15, 02-16, 02-17]
tech-stack:
  added: []
  patterns:
    - Exact named-file deletion with positive replacement-presence checks
key-files:
  created:
    - .planning/phases/02-move-the-implementation-to-supabase/02-12-SUMMARY.md
  modified:
    - services/support/src/app.ts
    - services/support/src/server.ts
    - services/support/src/routes/installations.ts
    - services/support/src/recovery.ts
    - services/support/src/recovery-store.ts
    - services/support/src/routes/recovery.ts
    - services/support/src/routes/stripe-webhook.ts
key-decisions:
  - "The exact seven-file 02-11 retirement slice and its immutable 02-10 gate were confirmed before the second deletion slice."
  - "Legacy Fastify, email recovery, and Node webhook paths were deleted without compatibility aliases or fallbacks; the local app and Supabase functions remain authoritative."
patterns-established:
  - "Retirement proceeds only through bounded deletion slices after predecessor evidence and positive replacement checks."
requirements-completed: [PAY-01, PAY-02, PAY-03, PAY-04, SUP-01, SUP-02, SUP-03, SUP-04, SUP-05, REC-01, REC-02, REC-03]
duration: 7min
completed: 2026-09-03
status: complete
---

# Phase 02 Plan 12: Remaining Legacy Runtime Retirement Summary

**Removed the standalone Node support runtime, email-recovery lifecycle, and legacy routes while retaining Cumpa's loopback server and all Supabase Edge Function replacements.**

## Performance

- **Duration:** 7min
- **Started:** 2026-09-03T14:28:08Z
- **Completed:** 2026-09-03T14:35:09Z
- **Tasks:** 2/2
- **Files modified:** 7 deleted

## Accomplishments

- Confirmed 02-11 records exactly seven retired provider/schema files and cites immutable 02-10 promotion evidence as its retirement gate.
- Deleted the standalone Fastify support app, server entrypoint, and installation status route.
- Deleted the email recovery state/store/route and Node Stripe webhook route without aliases, fallbacks, or archived copies.

## Task Commits

Each task was committed atomically:

1. **Task 1: Gate and delete the legacy Node app, server, and installation route** — `18f8d36` (refactor)
2. **Task 2: Delete recovery state and remaining legacy routes** — `de537cb` (refactor)

## Files Removed

- `services/support/src/app.ts` — standalone Fastify support application.
- `services/support/src/server.ts` — standalone Node support server entrypoint.
- `services/support/src/routes/installations.ts` — legacy installation-status endpoint.
- `services/support/src/recovery.ts` — email magic-link recovery lifecycle.
- `services/support/src/recovery-store.ts` — PostgreSQL-backed recovery store.
- `services/support/src/routes/recovery.ts` — email recovery endpoints.
- `services/support/src/routes/stripe-webhook.ts` — Node Stripe webhook endpoint.

## Decisions Made

- Required the exact seven-file 02-11 predecessor summary slice and its immutable 02-10 promotion-evidence gate before this deletion slice.
- Preserved `src/server/app.ts`, `supabase/functions/support-api/index.ts`, `supabase/functions/support-flow/index.ts`, and `supabase/functions/stripe-webhook/index.ts` as active replacement surfaces.

## Verification

- `test ! -e services/support/src/app.ts && test ! -e services/support/src/server.ts && test ! -e services/support/src/routes/installations.ts && test -e src/server/app.ts && test -e supabase/functions/support-api/index.ts` — passed.
- `test ! -e services/support/src/recovery.ts && test ! -e services/support/src/recovery-store.ts && test ! -e services/support/src/routes/recovery.ts && test ! -e services/support/src/routes/stripe-webhook.ts && test -e supabase/functions/support-flow/index.ts && test -e supabase/functions/stripe-webhook/index.ts` — passed.
- Combined all-seven absence and four active-entrypoint presence check — passed.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

All seven Plan 02-12 legacy runtime/route files are absent. Plan 02-13 can migrate active evidence assertions and remove only stale tests.

---
*Phase: 02-move-the-implementation-to-supabase*
*Completed: 2026-09-03*

## Self-Check: PASSED

- Summary file exists.
- Task commits `18f8d36` and `de537cb` exist in Git history.
