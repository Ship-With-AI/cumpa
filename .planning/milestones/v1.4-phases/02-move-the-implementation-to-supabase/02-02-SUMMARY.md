---
phase: 02-move-the-implementation-to-supabase
plan: 02
subsystem: database
tags: [supabase, postgres, rls, pgtap, stripe, authority]

# Dependency graph
requires:
  - phase: 02-move-the-implementation-to-supabase
    provides: "Plan 02-01 approved the exact Supabase CLI development/CI pin."
provides:
  - "Versioned, database-only Supabase authority schema with five private RLS tables."
  - "Six service-role-only transactional authority RPCs for intent, checkout, webhook, restoration, and status transitions."
  - "39 live pgTAP assertions and redacted two-cycle zero-state migration evidence."
affects: [02-03, supabase-functions, stripe-webhook, hosted-support-flow]

# Tech tracking
tech-stack:
  added: [supabase@2.114.0]
  patterns:
    - "Database-only local verification uses supabase db start, reset, pgTAP, migration list, and live lint."
    - "Authority writes use fixed-search-path security-definer RPCs with RLS and service-role-only grants."

key-files:
  created:
    - supabase/config.toml
    - supabase/migrations/20260814000000_support_authority.sql
    - supabase/tests/support_authority.sql
    - .planning/phases/02-move-the-implementation-to-supabase/02-02-SCHEMA-EVIDENCE.md
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Root supabase@2.114.0 is development/CI tooling only, using the exact approved pin."
  - "Authority data remains in a private RLS schema; only service_role can execute the six transactional RPCs."
  - "Intent plaintext, identity/profile data, OAuth tokens, email, and recovery-token fields are structurally excluded."

patterns-established:
  - "Use schema constraints and transaction-locked security-definer functions—not browser claims or preflight reads—for payment and installation authority."
  - "Treat an already owned installation as an immutable cross-user binding while allowing paid users unlimited distinct installations."

requirements-completed: [PAY-03, REC-02, REC-03]

# Metrics
duration: 23min
completed: 2026-08-15
status: complete
---

# Phase 02 Plan 02: Supabase Authority Schema Summary

**Database-only Supabase authority substrate with versioned RLS tables, service-role RPCs, and two proven empty-state application cycles.**

## Performance

- **Duration:** 23 min
- **Started:** 2026-08-15T09:56:14Z
- **Completed:** 2026-08-15T10:19:17Z
- **Tasks:** 2/2
- **Files modified:** 6

## Accomplishments

- Added the exact approved Supabase CLI development/CI pin and disabled every non-Postgres local service while declaring the three future public functions.
- Defined a single forward migration for hash-only support intents, supporter authority, server-recorded checkout facts, Stripe event replay, immutable installation bindings, RLS, and restricted RPC grants.
- Proved RED without the migration, then passed all 39 live pgTAP assertions plus migration-list and schema-lint checks across two independent zero-state applications.

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — specify the absent database authority contract** — `3223ad2` (test)
2. **Task 2: GREEN — implement, apply, inspect, reset, and reapply the schema** — `6644822` (feat)

**Plan metadata:** committed with this summary.

## Files Created/Modified

- `package.json` / `package-lock.json` — exact approved Supabase CLI development/CI pin.
- `supabase/config.toml` — database-only local target and explicit JWT declarations for `support-api`, `support-flow`, and `stripe-webhook`.
- `supabase/migrations/20260814000000_support_authority.sql` — private authority schema, constraints, RLS, RPCs, and grants.
- `supabase/tests/support_authority.sql` — live pgTAP authority, access-control, migration, and data-minimization contracts.
- `02-02-SCHEMA-EVIDENCE.md` — redacted RED and two-cycle application evidence.

## Verification

```text
npx supabase@2.114.0 db start && \
  npx supabase@2.114.0 db reset --local --no-seed && \
  npx supabase@2.114.0 test db && \
  npx supabase@2.114.0 migration list --local && \
  npx supabase@2.114.0 db lint --local && \
  npx supabase@2.114.0 db reset --local --no-seed && \
  npx supabase@2.114.0 test db && \
  npx supabase@2.114.0 migration list --local && \
  npx supabase@2.114.0 db lint --local

Postgres already running; both resets applied 20260814000000.
Both pgTAP runs: PASS (39 tests).
Both migration listings: local/remote 20260814000000.
Both lints: no schema errors.
```

## Decisions Made

- Used `support_private` rather than an exposed API schema, with no permissive RLS policies or direct untrusted table grants.
- Kept fulfillment idempotent through unique Stripe identifiers and transaction row locks; payment facts must have been server-recorded before settlement.
- Kept unpaid restoration non-enumerating (`false`) and repeated paid restoration unlimited, without retaining a device ledger.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Aligned the local Auth test fixture with the database-only target**
- **Found during:** Task 2
- **Issue:** The local Supabase Postgres `auth.users` fixture uses `confirmed_at`, not the obsolete `email_confirmed_at` column.
- **Fix:** Seeded the verified test users through the actual local column.
- **Files modified:** `supabase/tests/support_authority.sql`
- **Verification:** Both reset-and-pgTAP cycles passed.
- **Committed in:** `6644822`

**2. [Rule 2 - Missing Critical] Asserted grants for every authority RPC**
- **Found during:** Task 2
- **Issue:** The initial SQL contract checked service-role execution on one representative RPC only.
- **Fix:** Added catalog-backed assertions that service_role executes all six RPCs and untrusted roles execute none.
- **Files modified:** `supabase/tests/support_authority.sql`
- **Verification:** Both reset-and-pgTAP cycles passed 39 assertions.
- **Committed in:** `6644822`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical security coverage).
**Impact on plan:** Both fixes are confined to the planned database contract and required for reliable local proof; no scope expanded beyond the authority substrate.

## Issues Encountered

None beyond the resolved local Auth fixture and grant-coverage corrections above.

## User Setup Required

None - this plan operates only against the local database target and starts no Auth or Edge Function service.

## Next Phase Readiness

- Plan 02-03 can call the six schema RPCs from Edge Functions using the approved hosted-only dependency boundary.
- The authority schema has no external deployment, credentials, Auth setup, or Edge Function implementation in this plan.

## Self-Check: PASSED

- All six plan artifacts exist on disk.
- Task commits `3223ad2` and `6644822` exist in Git history.
- No placeholder or TODO markers were found in created runtime/schema/test files.

---
*Phase: 02-move-the-implementation-to-supabase*
*Completed: 2026-08-15*
