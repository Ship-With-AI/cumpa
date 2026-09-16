---
phase: quick
plan: 260916-h7p
subsystem: payments
tags: [stripe, checkout, deno, supabase-edge-functions, zod]

# Dependency graph
requires: []
provides:
  - "Widened RetrievedCheckoutSchema pinning amount_subtotal at list price while bounding the (now possibly discounted) amount_total to 1..4999"
  - "Server-owned Checkout Session sets allow_promotion_codes: true so the hosted Stripe Checkout page offers a promotion-code field"
  - "Deno test coverage proving discounted-but-list-subtotal sessions settle, 100%-off sessions are rejected pre-settlement, and subtotal-mismatched sessions are rejected"
  - "Runbook section documenting the Dashboard coupon/promotion-code creation steps, the $49.99 Price-stability invariant, and the 100%-off prohibition"
affects: [support-checkout, stripe-webhook, support-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fulfillment invariant pins the pre-discount list subtotal (amount_subtotal) rather than the charged total (amount_total), letting Stripe-side discounts through while keeping the Price itself invariant"

key-files:
  created: []
  modified:
    - supabase/functions/_shared/fulfillment.ts
    - supabase/functions/tests/stripe-webhook.test.ts
    - supabase/functions/support-flow/index.ts
    - supabase/functions/tests/support-flow.test.ts
    - docs/support-service-operations.md

key-decisions:
  - "D-1: allow_promotion_codes: true as a static server-side literal, second property in the checkout.sessions.create input; no discounts array, no client/browser-supplied promotion code"
  - "D-2: RetrievedCheckoutSchema now pins amount_subtotal: z.literal(4999) and bounds amount_total: z.number().int().min(1).max(4999); every other invariant (mode, payment_status, currency, customer, payment_intent, metadata, single line item at price/quantity) is untouched"
  - "D-3: amount_total === 0 (100%-off) is rejected via min(1), proven by a dedicated named Deno test, not folded into the generic rejection-cases loop"
  - "D-4: no migration; record_checkout_session keeps sending p_amount_total: 4999 (the pre-discount list total, recorded before any code is entered) unchanged"
  - "D-5: added a new '## Support Checkout discount and coupon policy' runbook section, inserted between 'Default project origin' and 'Retirement and release scanning'"

patterns-established:
  - "Pattern: when a payment provider allows post-authorization discounts, pin the schema invariant to the pre-discount list-price field (amount_subtotal) and bound the discountable field (amount_total) instead of pinning both to the same literal"

requirements-completed:
  - QUICK-260916-h7p

# Metrics
duration: 25min
completed: 2026-09-16
status: complete
---

# Quick Task 260916-h7p: Enable Dashboard promotion codes on the support Checkout Summary

**Widened the Stripe fulfillment schema from a single `amount_total: z.literal(4999)` pin to a split `amount_subtotal: z.literal(4999)` / `amount_total: z.number().int().min(1).max(4999)` invariant, and set `allow_promotion_codes: true` on the server-owned Checkout Session, so Dashboard-issued promotion codes can discount the $49.99 support purchase without breaking fulfillment or permitting a 100%-off (unfulfillable) session.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 3 completed
- **Files modified:** 5

## Accomplishments
- `RetrievedCheckoutSchema` in `supabase/functions/_shared/fulfillment.ts` now accepts a discounted `amount_total` (1..4999) while still pinning the pre-discount `amount_subtotal` at exactly 4999, and rejects `amount_total === 0` (100%-off) before settlement.
- `support-flow/index.ts`'s server-owned `checkout.sessions.create` call now carries `allow_promotion_codes: true` as its second property, immediately after `mode: "payment"`, so the hosted Checkout page shows a promotion-code field; `record_checkout_session`'s RPC arguments stay byte-identical (still the pre-discount list-price facts).
- `docs/support-service-operations.md` gained a new "Support Checkout discount and coupon policy" section documenting the Dashboard coupon/promotion-code creation steps, the $49.99 Price-stability invariant, and the 100%-off prohibition.

## Task Commits

Each task was committed atomically, RED-first for the two TDD tasks:

1. **Task 1: Shift the fulfillment invariant from charged total to list subtotal (per D-2, D-3)** - `7fc8765300cc974860700048c3f659bc551c2a42` (fix)
2. **Task 2: Offer promotion codes on the server-owned Checkout Session (per D-1)** - `d4702967888bdb5973604eeb3550d4c1571b3a9f` (feat)
3. **Task 3: Document the coupon and promotion-code operating policy (per D-5)** - `8d47c6292781d615f6556546522cd7fdefd30d17` (docs)

## RED Evidence (TDD tasks)

### Task 1 — `stripe-webhook.test.ts` RED before `fulfillment.ts` edit

Added `amount_subtotal: 4999,` to the `session()` fixture, two new named `Deno.test` blocks ("a promotion-code discount that keeps the exact list subtotal still settles", "a 100%-off session has no PaymentIntent to audit and is rejected before settlement"), and a `{ amount_subtotal: 3999 }` entry to the rejection-cases loop — all before touching `fulfillment.ts`. Ran:

```
deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests/stripe-webhook.test.ts
```

Result: `FAILED | 7 passed | 2 failed (6ms)`

- `a promotion-code discount that keeps the exact list subtotal still settles` — FAILED (assertion at line 77): today's `amount_total: z.literal(4999)` rejects the discounted `amount_total: 3999` session outright (400, zero RPC calls), so the new assertion expecting `status === 200` and one `fulfill_checkout_session` call failed.
- `irrelevant events and every non-authoritative product fact are ignored without settlement` — FAILED (assertion at line 129): the new `{ amount_subtotal: 3999 }` case is not checked by today's schema (it only pins `amount_total`, and `amount_subtotal` is an unrecognized/stripped field), so the session parses successfully and settles (200, one RPC call) instead of being rejected (400, zero calls) as the new case expects.
- `a 100%-off session has no PaymentIntent to audit and is rejected before settlement` — passed even pre-fix, because today's `amount_total: z.literal(4999)` already happens to reject `amount_total: 0` (for the wrong reason — literal mismatch, not a `min(1)` bound). This is expected: not every new assertion needs to fail RED when an incidental invariant already covers the input; the two failures above are the load-bearing RED evidence for this task.

After applying the `fulfillment.ts` schema change (`amount_subtotal: z.literal(4999)` + `amount_total: z.number().int().min(1).max(4999)`), re-ran the same command: `ok | 9 passed | 0 failed (6ms)`.

### Task 2 — `support-flow.test.ts` RED before `support-flow/index.ts` edit

Inserted `allow_promotion_codes: true,` into the expected Checkout input object (matching production's intended property order) and added the `record_checkout_session` RPC-args equality assertion, before touching `index.ts`. Ran:

```
deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests/support-flow.test.ts
```

Result: `FAILED | 4 passed | 1 failed (6ms)`

- `callback validates the hosted user then makes one server-owned support Checkout` — FAILED (assertion at line 133, the new `allow_promotion_codes: true` JSON.stringify equality check): today's `checkout.sessions.create` input has no `allow_promotion_codes` property, so the exact-shape JSON.stringify comparison against the expected object (which now includes it) failed.

After adding `allow_promotion_codes: true,` as the second property in `support-flow/index.ts`'s `checkout.sessions.create({...})` call, re-ran the same command: `ok | 5 passed | 0 failed (4ms)`.

## Final Test Counts

Run after all three commits, from the repository root:

- `deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests/stripe-webhook.test.ts` → **ok | 9 passed | 0 failed**
- `deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests/support-flow.test.ts` → **ok | 5 passed | 0 failed**
- `deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests/support-api.test.ts` (regression check, untouched suite) → **ok | 5 passed | 0 failed**

`grep -n "allow_promotion_codes\|amount_subtotal\|100%-off" docs/support-service-operations.md` confirms all three strings are present in the new runbook section.

`git diff --stat` across the three task commits touches exactly the five files in the plan's `files_modified` list (`docs/support-service-operations.md`, `supabase/functions/_shared/fulfillment.ts`, `supabase/functions/support-flow/index.ts`, `supabase/functions/tests/stripe-webhook.test.ts`, `supabase/functions/tests/support-flow.test.ts`) — no migration, no `src/`, no `package.json`, no workflow file touched.

## Files Created/Modified
- `supabase/functions/_shared/fulfillment.ts` - `RetrievedCheckoutSchema` pins `amount_subtotal: z.literal(4999)` and bounds `amount_total: z.number().int().min(1).max(4999)`; `checkoutSessionInvariant` and `fulfillVerifiedCheckout` bodies unchanged
- `supabase/functions/tests/stripe-webhook.test.ts` - Fixture gains `amount_subtotal: 4999`; two new named tests (discount-settles, 100%-off-rejected) and one new rejection-cases entry (`{ amount_subtotal: 3999 }`)
- `supabase/functions/support-flow/index.ts` - `checkout.sessions.create` input's second property is now `allow_promotion_codes: true`
- `supabase/functions/tests/support-flow.test.ts` - Asserts `allow_promotion_codes: true` in the Checkout input (exact JSON.stringify shape) and asserts `record_checkout_session`'s RPC args stay unchanged at the pre-discount list price
- `docs/support-service-operations.md` - New "Support Checkout discount and coupon policy" section between "Default project origin" and "Retirement and release scanning"

## Decisions Made
None beyond the locked contract (D-1 through D-5) — plan executed exactly as written, including the exact property-insertion positions and test names specified in the PLAN.md action blocks.

## Deviations from Plan

None - plan executed exactly as written. The Task 3 commit message was taken verbatim from the plan's `<commit>` tag (`docs(quick-260916-h7p): document the support Checkout coupon and promotion-code policy`), which the plan did in fact provide despite the assignment's note suggesting it might be absent.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required. Deploying the edited `support-flow` Edge Function and creating the Stripe Dashboard coupon/promotion code remain explicit operator steps outside this quick task, as documented in the plan's "Deployment and Dashboard prerequisites" section and now in the runbook itself.

## Next Phase Readiness
- All three Deno suites in scope pass cleanly (9/9, 5/5, 5/5); the untouched `support-api.test.ts` suite was re-run as a regression check and still passes 5/5.
- The `support-flow` Edge Function still needs to be deployed to the hosted Supabase project (`supabase functions deploy`, outside this task's scope) before promotion codes take effect in production, and an operator must create at least one Stripe Dashboard coupon/promotion code per the new runbook section before any code can be redeemed.

---
*Phase: quick*
*Completed: 2026-09-16*
