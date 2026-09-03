---
phase: 02-move-the-implementation-to-supabase
plan: 09
subsystem: hosted-acceptance
status: complete
tags: [supabase, stripe, github-oauth, hostile-testing, acceptance]

requires:
  - phase: 02-08
    provides: immutable canonical-origin prelaunch deployment
provides:
  - Approved browser acceptance matrix bound to the immutable 02-08 deployment
  - Nine-case protected hostile runner using real Stripe and Supabase boundaries
  - Exact hashed six-table fixture manifest for automatic cleanup
  - Immutable protected-run evidence with canonical origin and run lineage
  - Approval scoped to exact manifest cleanup and same-project promotion
affects: [02-10, 02-15, 02-16, 02-17]

tech-stack:
  added: []
  patterns:
    - Validate the committed acceptance marker before the first hosted mutation
    - Hash raw fixture keys in protected runner memory before evidence generation
    - Consolidate authority inventory into one read-only Management API query

key-files:
  created:
    - .planning/phases/02-move-the-implementation-to-supabase/02-09-ACCEPTANCE-MARKER.json
    - .planning/phases/02-move-the-implementation-to-supabase/02-09-ACCEPTANCE-EVIDENCE.md
  modified:
    - scripts/verify-supabase-support.mjs
    - tests/e2e/support-payment.spec.ts
    - tests/e2e/support-restore.spec.ts

key-decisions:
  - "Use the real Stripe test Checkout completion sequence and retrieve the resulting event before signed webhook tests."
  - "Permit concurrent replay responses of 200/200 or 200/503 only when authority proves exactly one settlement."
  - "Keep provider and database error diagnostics bounded to safe operation, status, code, parameter, category, and column markers."
  - "Approval authorizes only exact in-workflow manifest cleanup and in-place promotion of the same project."

patterns-established:
  - "Browser observations, marker, historical deployment, hostile run, and final evidence are digest- and lineage-bound."
  - "Every case-owned hosted mutation immediately follows the complete-ref guard."

requirements-completed: [PAY-01, PAY-02, PAY-03, PAY-04, SUP-01, SUP-02, SUP-03, SUP-04, SUP-05, REC-01, REC-02, REC-03]
duration: N/A
completed: 2026-09-03
---

# Phase 02 Plan 09: Hosted Acceptance Summary

**The canonical prelaunch deployment passed the complete browser matrix and all nine real protected hostile cases, producing an approved exact cleanup manifest.**

## Accomplishments

- Completed paid Support, restart persistence, two paid Restore installs, unpaid Restore, delayed Checkout, and cancelled Checkout checks without gating review.
- Fixed support polling so one timed-out request cannot poison subsequent refreshes.
- Validated and consumed a marker bound to deployment run `33631411293` and its redacted browser observations.
- Executed the nine hostile cases in protected run `33754289126` at commit `eaf561ca8b98dfd7e03f17b2abc691dfec94003f`.
- Proved rejection without authority for wrong signature, product, amount, currency, binding, expired intent, and reused intent.
- Proved idempotent sequential replay with responses `200/200` and single-settlement concurrent replay with responses `200/200`.
- Captured sorted SHA-256 handles for all current rows in `auth.users` and the five `support_private` tables; no raw fixture keys entered evidence.
- Recorded explicit approval dated 2026-09-03, scoped to exact manifest cleanup and same-project promotion.

## Task Commits

- `901f3df` — fix support polling after a timed-out request
- `9dd26fb` — implement protected hostile acceptance and marker/evidence contracts
- `1640016`, `0314bbc`, `76ce101`, `849aa3f` — add bounded protected-run diagnostics
- `ca47f39` — complete the Stripe Checkout billing fixture
- `a8e54f7`, `ce057be` — align hosted Auth fixtures with the production schema
- `eaf561c` — consolidate authority snapshots and complete the successful protected run

## Verification

- `npm run build` — passed.
- `npx playwright test --config=tests tests/e2e/support-payment.spec.ts tests/e2e/support-restore.spec.ts` — 6 passed.
- Acceptance marker validation against `02-08-TEST-DEPLOYMENT-EVIDENCE.md` — passed.
- GitHub Actions run `33754289126` — repository gates and protected deployment/hostile executor passed.
- Final acceptance validation with approval, hostile matrix, fixture manifest, and immutable-run requirements — passed.

## Deviations from Plan

- Stripe's test Checkout confirmation required the complete billing fixture used by Stripe CLI.
- Hosted `auth.users.confirmed_at` is generated; the runner writes `email_confirmed_at` instead.
- Six parallel authority queries per snapshot exceeded the Management API throttle during the full matrix; one equivalent read-only union query now produces each exact manifest.
- Failed forward runs left legitimate test fixtures. The successful final inventory intentionally includes every current row so Plan 02-10 can clean the exact complete set.

## Next Plan Readiness

Plan 02-10 is authorized to implement and execute only the approved exact-manifest cleanup, prove all six tables are zero, then pause for in-place live provider replacement on the same project.

---

*Completed: 2026-09-03*
