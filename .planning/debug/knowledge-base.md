---
status: resolved
---

# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## cwt-slow-picker-startup — Real multi-worktree picker blocked on exact dirty scans
- **Date:** 2026-07-31
- **Error patterns:** slow startup, picker readiness, CWT, worktree status, dirty-state scans
- **Root cause:** `discoverSourceCandidates` treated exact dirty-state completion as a prerequisite for publishing already-resolved worktree identities; CWT's 30 native status scans have an irreducible roughly 6.7-second completion cost.
- **Fix:** Publish ordered identities with explicit pending availability, start one shared asynchronous exact enrichment after initial prompt publication, refresh later prompt sources, and await enrichment before accepting worktree selections.
- **Files changed:** src/domain/source.ts, src/git/candidates.ts, src/cli/picker.ts, src/cli/run.ts, tests/git/candidates.test.ts, tests/cli/selection.test.ts
---

## stripe-checkout-popup-again — 100%-off comped Checkout Session was structurally unfulfillable
- **Date:** 2026-09-16
- **Error patterns:** support prompt reappears after paying, stuck on "Waiting for confirmation…", `installation_status` false, webhook 400, promotion code, 100%-off coupon, `no_payment_required`, missing PaymentIntent
- **Root cause:** `RetrievedCheckoutSchema` required `payment_status: "paid"`, `amount_total >= 1`, and a non-empty `payment_intent`, none of which a $0 fully discounted Stripe session provides, so `checkoutSessionInvariant` rejected it, `fulfill_checkout_session` never ran, and no `installation_bindings` row was ever written. `supporters.stripe_payment_intent_id NOT NULL` made the state unrepresentable even in principle.
- **Fix:** Split the invariant into a paid/comped union over one shared identity schema (mode, USD, `amount_subtotal = 4999`, exact price, quantity 1, metadata, real Customer all retained), made `paymentIntentId` nullable end to end, dropped `NOT NULL` from `supporters.stripe_payment_intent_id`, and narrowed the `supporter payment conflict` guard to two differing *charged* PaymentIntents.
- **Diagnostic shortcut:** local support state is machine-scoped (`~/Library/Application Support/Cumpa/support.json` on darwin, never repo-local), and `GET /functions/v1/support-api/status?installationId=…` answers the hosted truth directly — one curl separates "client never promoted" from "authority never bound".
- **Files changed:** supabase/functions/_shared/fulfillment.ts, supabase/migrations/20260916000000_comped_support_fulfillment.sql, supabase/functions/tests/stripe-webhook.test.ts, supabase/tests/support_authority.sql, docs/support-service-operations.md
---
