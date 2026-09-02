---
phase: 02-move-the-implementation-to-supabase
plan: 08
subsystem: deployment-routing
tags: [github-actions, supabase, default-origin, stripe, oauth]

requires:
  - phase: 02-07
    provides: historical CI-only protected deployment boundary
provides:
  - Canonical default Supabase origin for Auth, browser, function, webhook, package, and evidence routes
  - Reduced protected input contract without custom-domain state, duplicate URL variables, or configured target fingerprint
  - Built-in SUPABASE_URL routing and bounded plain-text browser terminal responses
  - Protected production environment and default-origin provider callbacks ready for the first ordinary push
affects: [02-09, 02-10, 02-11, 02-15, 02-16, 02-17]

tech-stack:
  added: []
  patterns:
    - Derive every public route from the protected production SUPABASE_PROJECT_REF variable
    - Validate canonical project-ref shape immediately before hosted mutation
    - Keep any evidence fingerprint internally derived and supplemental only

key-files:
  created: []
  modified:
    - .github/workflows/deploy-supabase-production.yml
    - scripts/verify-supabase-support.mjs
    - supabase/functions/support-api/index.ts
    - supabase/functions/support-flow/index.ts
    - supabase/functions/tests/support-flow.test.ts
    - tests/e2e/support-payment.spec.ts
    - tests/e2e/support-recovery.spec.ts
    - tests/e2e/support-restore.spec.ts
    - docs/support-service-operations.md

key-decisions:
  - "Use https://<project-ref>.supabase.co directly; no custom domain, DNS, proxy, or domain add-on."
  - "Store SUPABASE_PROJECT_REF as a protected production environment variable; do not configure a duplicate SHA-256 approval value."
  - "Subscribe the Stripe webhook only to checkout.session.completed and checkout.session.async_payment_succeeded."
  - "Plan 02-09 owns the first commit and ordinary main push."

patterns-established:
  - "Workflow verification rejects retired domain, URL, and configured-fingerprint inputs."
  - "Browser completion, invalid, and unavailable responses are fixed bounded text/plain bodies."

requirements-completed: [PAY-03, PAY-04, SUP-01, REC-01, REC-02]
duration: N/A
completed: 2026-09-02
status: complete
---

# Phase 02 Plan 08: Default Supabase Origin Correction Summary

**The protected deployment now derives every hosted route from the sole project's default Supabase origin without custom-domain machinery or redundant target configuration.**

## Accomplishments

- Removed custom-domain discovery, DNS, reverify, activation, and default-host rejection.
- Removed the five stored URL inputs and configured project-ref SHA-256 input.
- Moved `SUPABASE_PROJECT_REF` to a protected production environment variable and retained canonical shape validation before hosted mutation.
- Configured exact derived Auth, support, and Stripe webhook routes.
- Switched hosted functions to built-in `SUPABASE_URL` and fixed bounded `text/plain` browser responses.
- Confirmed the protected GitHub environment and default-origin GitHub OAuth/Stripe test configuration are ready.

## Task Commits

None by design. Plan 02-09 owns the first corrected commit and ordinary protected `main` push so immutable deployment lineage covers the complete correction.

## Verification

Passed without provider inputs or hosted mutation:

- `npx playwright test --config=tests tests/e2e/support-payment.spec.ts tests/e2e/support-recovery.spec.ts tests/e2e/support-restore.spec.ts` — 4 passed
- `node scripts/verify-supabase-support.mjs --verify-workflow .github/workflows/deploy-supabase-production.yml --require-environment production --expected-mode prelaunch-test` — passed
- `deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests/support-flow.test.ts` — 5 passed
- `deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests/stripe-webhook.test.ts` — 5 passed

## Deviations from Plan

- Replaced the originally planned custom-domain route with the default Supabase origin before any push or hosted mutation.
- Removed the configured project-ref SHA-256 after determining that a checksum stored beside the ref was not an independent security boundary; evidence correlation remains internally derived.

## Next Plan Readiness

Plan 02-09 can create the acceptance marker, commit the complete correction, push protected `main`, capture immutable deployment evidence, and begin the one-time browser acceptance matrix.

---

*Completed: 2026-09-02*
