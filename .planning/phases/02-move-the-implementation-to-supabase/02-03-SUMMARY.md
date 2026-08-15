---
phase: 02-move-the-implementation-to-supabase
plan: 03
subsystem: hosted-support-authority
tags: [supabase, edge-functions, github-oauth, stripe, deno, tdd]

# Dependency graph
requires:
  - phase: 02-move-the-implementation-to-supabase
    provides: "Plan 02-01 exact hosted-only dependency approval and Plan 02-02 six service-role authority RPCs."
provides:
  - "Anonymous, bounded support start/status capability with hash-only intents."
  - "Hosted GitHub PKCE flow that creates server-priced Checkout or generic Restore completion."
  - "Raw-signature Stripe webhook classification and atomic settlement through the schema RPC."
affects: [02-04, 02-05, 02-06, hosted-support-flow, package-safety]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Exact approved npm imports stay in supabase/functions/deno.json and its Deno lockfile."
    - "Three explicit injectable Edge handlers share strict validation and checkout classification only."

key-files:
  created:
    - supabase/functions/deno.json
    - supabase/functions/deno.lock
    - supabase/functions/_shared/validation.ts
    - supabase/functions/_shared/fulfillment.ts
    - supabase/functions/support-api/index.ts
    - supabase/functions/support-flow/index.ts
    - supabase/functions/stripe-webhook/index.ts
    - supabase/functions/tests/support-api.test.ts
    - supabase/functions/tests/support-flow.test.ts
    - supabase/functions/tests/stripe-webhook.test.ts
  modified: []

key-decisions:
  - "The local application receives only a hosted flow URL and later boolean installation status; it never receives an OAuth session, code, token, profile, or email."
  - "Only the signature-verified webhook may call fulfill_checkout_session; browser success/cancel and restore completion never settle payment authority."
  - "Deno runs the nested function suite with its exact nested config; a root invocation supplies --config supabase/functions/deno.json."

patterns-established:
  - "Public support-api accepts only strict action/installation input, limits body size to 8 KiB, and returns generic errors."
  - "support-flow uses Secure HttpOnly SameSite state plus a request-scoped Supabase OAuth client before deriving the user server-side."
  - "stripe-webhook verifies untouched request text before reading event details or Stripe Checkout facts."

requirements-completed: [PAY-01, PAY-03, SUP-02, REC-01, REC-02, REC-03]

# Metrics
duration: 26min
completed: 2026-08-15
status: complete
---

# Phase 02 Plan 03: Hosted Support Authority Summary

**Strict Supabase Edge support authority with GitHub PKCE, server-owned Stripe Checkout facts, and webhook-only idempotent fulfillment.**

## Performance

- **Duration:** 26 min
- **Started:** 2026-08-15T10:32:49Z
- **Completed:** 2026-08-15T10:58:54Z
- **Tasks:** 3/3
- **Files modified:** 10

## Accomplishments

- Added strict anonymous `start` and `status` capability handlers with 256-bit opaque intent generation, SHA-256-only persistence, 8 KiB request limits, fixed hosted URLs, and boolean-only status.
- Added hosted GitHub PKCE initiation/callback, validated Supabase-user binding, server-selected $49.99 Checkout metadata, and indistinguishable paid/unpaid Restore completion.
- Added raw-text Stripe signature verification, exact paid product classification, and one settlement RPC for replay/concurrency-safe database authority.

## Verification

```text
deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests
15 passed | 0 failed
```

The test suite exercises malformed input/origins/body limits, cookie attributes, validated callback identity, response/log redaction, server-owned Checkout facts, raw signature ordering, invalid payment facts, delayed payment events, and replay behavior.

## Task Commits

Each TDD stage was committed atomically:

1. **Task 1: RED — specify every hosted trust-boundary behavior** — `32b048b` (test)
2. **Task 2: GREEN — implement the narrow Supabase functions** — `bab2f7a` (feat)
3. **Task 3: REFACTOR — close duplicate seams without broadening authority** — `871de9c` (refactor)

**Plan metadata:** recorded in the close-out commit.

## Files Created/Modified

- `supabase/functions/deno.json` / `deno.lock` — exact approved hosted dependency graph.
- `supabase/functions/_shared/validation.ts` — strict action, installation, start, and Checkout metadata validators.
- `supabase/functions/_shared/fulfillment.ts` — parsed exact-product Checkout invariant and one settlement RPC call.
- `supabase/functions/support-api/index.ts` — anonymous bounded start/status capability.
- `supabase/functions/support-flow/index.ts` — GitHub PKCE callback, server-side identity, Checkout, and Restore orchestration.
- `supabase/functions/stripe-webhook/index.ts` — raw-signature webhook boundary.
- `supabase/functions/tests/*.test.ts` — focused public behavior and hostile-input contracts.

## Decisions Made

- Used only the Plan 02-01-approved exact imports inside `supabase/functions/**`; no hosted dependency or credential enters the published Cumpa runtime.
- Kept fulfillment authority in the Plan 02-02 transactional RPC: handlers validate and classify untrusted inputs but do not replace database idempotency.
- Kept explicit function handlers rather than adding a shared router or provider abstraction.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test contract] Corrected RED fixtures to match the deployed function path and schema-valid database IDs.**
- **Found during:** Task 2 (GREEN)
- **Issue:** Initial fixtures used a root path rather than `/functions/v1/support-flow` and a non-UUID intent ID that the authoritative database cannot return. They also rejected Stripe test-mode sessions despite Plan 02 development verification using Stripe test mode.
- **Fix:** Pointed handler requests at the declared function paths, used UUID intent IDs, and retained payment-fact validation without treating Stripe test mode as an invalid product fact.
- **Files modified:** `supabase/functions/tests/support-flow.test.ts`, `supabase/functions/tests/stripe-webhook.test.ts`
- **Verification:** Focused Deno suite passes 15/15.
- **Committed in:** `bab2f7a`

---

**Total deviations:** 1 auto-fixed (1 test contract correction).
**Impact on plan:** The correction aligns the focused tests with the planned Supabase endpoint and development environment; authority scope did not expand.

## Issues Encountered

- Deno discovers configuration from its working directory, so the root-targeted command needs `--config supabase/functions/deno.json`; the equivalent function-directory command also passes. No project-wide validation ran.
- `state.update-progress` and `requirements.mark-complete` could not parse the existing planning formats; `state.advance-plan`, metric/decision/session recording, and roadmap progress succeeded.

## User Setup Required

None - hosted deployment, Auth provider configuration, and real Stripe/GitHub evidence are deliberately deferred to Plan 02-06.

## Next Phase Readiness

- Plan 02-04 can consume only the `start(action, installationId)` and `status(installationId)` capability contract.
- Plan 02-06 must provide hosted development OAuth, Stripe test Checkout/webhook, and real deployment evidence; this plan provides unit-level authority evidence only.

---
*Phase: 02-move-the-implementation-to-supabase*
*Completed: 2026-08-15*

## Self-Check: PASSED

- All ten hosted-function artifacts and the summary exist on disk.
- TDD commits `32b048b`, `bab2f7a`, and `871de9c` exist in Git history in RED → GREEN → REFACTOR order.
