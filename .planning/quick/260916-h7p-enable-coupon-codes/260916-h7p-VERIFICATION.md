---
phase: quick-260916-h7p
verified: 2026-09-16T00:00:00Z
status: passed
score: 14/14 must-haves verified (6 truths, 5 artifacts, 3 key links)
behavior_unverified: 0
overrides_applied: 0
---

# Quick Task 260916-h7p: Enable Dashboard promotion codes on the support Checkout — Verification Report

**Task Goal:** Enable Stripe Dashboard-issued promotion codes on Cumpa's one-time USD $49.99 voluntary support Checkout, without weakening the fulfillment invariant, per locked decisions D-1..D-5.
**Verified:** 2026-09-16
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Hosted Checkout page offers a promotion-code field because `allow_promotion_codes: true` is set on the server-owned session | ✓ VERIFIED | `supabase/functions/support-flow/index.ts:136` — `allow_promotion_codes: true,` is the second property of the `checkout.sessions.create({...})` call (between `mode: "payment"` and `line_items`). Exercised by `supabase/functions/tests/support-flow.test.ts:133-142`'s exact `JSON.stringify` equality assertion, which passed (`deno test` → `ok \| 5 passed \| 0 failed`). |
| 2 | A promotion-code-discounted paid session with `amount_subtotal: 4999` fulfills through the webhook | ✓ VERIFIED | `supabase/functions/_shared/fulfillment.ts:18-19` — `amount_subtotal: z.literal(4999)` + `amount_total: z.number().int().min(1).max(4999)`. Behavior-dependent (settlement state transition) — exercised by the dedicated named test `supabase/functions/tests/stripe-webhook.test.ts:73-79` (`session({ amount_total: 3999 })`, default `amount_subtotal: 4999`), asserting `status === 200` and exactly one `fulfill_checkout_session` call. Test passed. |
| 3 | Sessions with wrong subtotal, wrong line item, wrong currency, or non-`paid` status are rejected by `checkoutSessionInvariant` before settlement | ✓ VERIFIED | `supabase/functions/_shared/fulfillment.ts:31-39` — `checkoutSessionInvariant` returns `undefined` on `safeParse` failure or price-id/metadata mismatch; caller returns 400 without calling `fulfillVerifiedCheckout` (`stripe-webhook/index.ts:62-63`). Exercised by the rejection-cases loop `supabase/functions/tests/stripe-webhook.test.ts:114-130`, covering `{mode: "subscription"}`, `{payment_status: "unpaid"}`, `{currency: "eur"}`, `{amount_total: 5000}`, `{amount_subtotal: 3999}`, wrong price id, wrong quantity, and malformed metadata — each asserts `status === 400 && deps.calls.length === 0`. Test passed. |
| 4 | A 100%-off session (`amount_total === 0`) is rejected before settlement because it has no PaymentIntent | ✓ VERIFIED | `min(1)` bound in `fulfillment.ts:19` rejects `amount_total: 0`. Behavior-dependent — exercised by the dedicated named test `supabase/functions/tests/stripe-webhook.test.ts:81-87` (`session({ amount_total: 0 })`), asserting `status === 400 && deps.calls.length === 0`. Test passed. |
| 5 | No DB migration, no RPC signature change, no local (non-Supabase) package file touched, no new env var; local Cumpa client still holds no Stripe secret | ✓ VERIFIED | `git diff --stat 7fc8765~1..HEAD` touches exactly the 5 planned files (`docs/support-service-operations.md`, `supabase/functions/_shared/fulfillment.ts`, `supabase/functions/support-flow/index.ts`, `supabase/functions/tests/stripe-webhook.test.ts`, `supabase/functions/tests/support-flow.test.ts`) — `git diff 7fc8765~1..8d47c62 -- supabase/migrations src package.json 'tsconfig*.json'` is empty (0 lines). `Deno.env.get` call sites in `support-flow/index.ts` and `stripe-webhook/index.ts` are byte-identical before/after (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` — same 8 call sites, no new name). `record_checkout_session`/`fulfill_checkout_session` signatures in `supabase/migrations/20260814000000_support_authority.sql:109-118,210-215` are untouched (file has 0 diff lines in the commit range). |
| 6 | `docs/support-service-operations.md` documents Dashboard coupon/promotion-code steps, the $49.99 Price-stability invariant, and the 100%-off prohibition | ✓ VERIFIED | `docs/support-service-operations.md:19-27` — new `## Support Checkout discount and coupon policy` section, positioned between `## Default project origin` (ends line 17) and `## Retirement and release scanning` (line 29). Contains Dashboard Coupon→Promotion-code creation steps (lines 23), the Price-stability invariant naming `p_amount_total: 4999`, the `amount_total = 4999` CHECK, and `amount_subtotal` (line 25), and an explicit "100%-off prohibition" (line 27). |

**Score:** 6/6 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/functions/_shared/fulfillment.ts` | `RetrievedCheckoutSchema` pins pre-discount `amount_subtotal` while bounding `amount_total` | ✓ VERIFIED | Line 18: `amount_subtotal: z.literal(4999),` — literal string present. `checkoutSessionInvariant` (lines 31-39) and `fulfillVerifiedCheckout` (lines 41-53) bodies unchanged (diff confirms only the schema field split, lines 15-19). |
| `supabase/functions/tests/stripe-webhook.test.ts` | RED-then-GREEN coverage for discount, 100%-off, subtotal-mismatch | ✓ VERIFIED | `amount_subtotal` present 6× (fixture line 18, new tests, rejection case). 9 `Deno.test` blocks including the 2 new named tests (lines 73, 81) and the widened `cases` array (line 119: `{ amount_subtotal: 3999 }`). All 9 pass. |
| `supabase/functions/support-flow/index.ts` | Server-owned session requests promotion-code entry | ✓ VERIFIED | Line 136: `allow_promotion_codes: true,` — literal string present, second property of the `create()` call as specified. |
| `supabase/functions/tests/support-flow.test.ts` | Asserts `allow_promotion_codes` reaches Stripe and RPC facts stay at list total | ✓ VERIFIED | Line 135: `allow_promotion_codes: true,` inside the exact `JSON.stringify` equality assertion (lines 133-142); line 130: `p_amount_total: 4999,` inside the `record_checkout_session` args equality assertion (lines 123-132). |
| `docs/support-service-operations.md` | Dashboard coupon/promotion-code runbook section with Price-stability invariant and 100%-off prohibition | ✓ VERIFIED | Line 27 contains the literal string `100%-off prohibition:`. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `supabase/functions/support-flow/index.ts` | `supabase/functions/_shared/fulfillment.ts` | Checkout Session created with `allow_promotion_codes:true` is later retrieved by stripe-webhook and validated against `amount_subtotal`, not the now-discountable `amount_total` | ✓ WIRED | `support-flow/index.ts:136` sets `allow_promotion_codes: true`; the resulting session is retrieved in `stripe-webhook/index.ts:57` and parsed by `RetrievedCheckoutSchema`, whose pinned field is `amount_subtotal: z.literal(4999)` (`fulfillment.ts:18`) while `amount_total` is now a bounded range (`fulfillment.ts:19`), not a literal. Pattern `amount_subtotal` present in `fulfillment.ts`. |
| `supabase/functions/stripe-webhook/index.ts` | `supabase/functions/_shared/fulfillment.ts` | `checkoutSessionInvariant` gates every retrieved session before `fulfillVerifiedCheckout` runs | ✓ WIRED | `stripe-webhook/index.ts:4` imports `checkoutSessionInvariant, fulfillVerifiedCheckout` from `fulfillment.ts`; line 62 calls `checkoutSessionInvariant(session, dependencies.priceId)`; line 63 returns 400 if falsy; line 65 calls `fulfillVerifiedCheckout` only on the gated `checkout` value. Pattern `checkoutSessionInvariant` present and call-site confirmed. |
| `supabase/migrations/20260814000000_support_authority.sql` | `supabase/functions/support-flow/index.ts` | `record_checkout_session`'s `amount_total = 4999` CHECK still matches the intent-time `p_amount_total: 4999` argument | ✓ WIRED | Migration line 30: `amount_total bigint NOT NULL CHECK (amount_total = 4999)`; line 141: `OR p_amount_total <> 4999`. `support-flow/index.ts:152` sends `p_amount_total: 4999,` unchanged (confirmed byte-identical in diff — no change to this line). Pattern `p_amount_total: 4999` present. |

### Behavioral Spot-Checks (Deno suites run directly by verifier)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Fulfillment invariant (discount, 100%-off, subtotal-mismatch) | `deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests/stripe-webhook.test.ts` | `ok \| 9 passed \| 0 failed` | ✓ PASS (matches SUMMARY's claimed 9/9) |
| Promotion-code Checkout input + unchanged RPC facts | `deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests/support-flow.test.ts` | `ok \| 5 passed \| 0 failed` | ✓ PASS (matches SUMMARY's claimed 5/5) |
| Regression: untouched support-api suite | `deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests/support-api.test.ts` | `ok \| 5 passed \| 0 failed` | ✓ PASS (matches SUMMARY's claimed 5/5 regression) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| QUICK-260916-h7p | 260916-h7p-PLAN.md | Enable Dashboard promotion codes without weakening fulfillment invariant | ✓ SATISFIED | All 6 truths, 5 artifacts, 3 key links verified above; 3/3 focused Deno suites pass with claimed counts. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | none found (`TBD`/`FIXME`/`XXX` grep on all 5 modified files returned 0 matches) | — | — |

### Negative/No-Regression Contract Checks (independent, not from SUMMARY)

| Check | Result |
|-------|--------|
| Diffstat `7fc8765~1..HEAD` touches only the 5 planned files | ✓ Confirmed — `git diff --stat` output: `docs/support-service-operations.md \| 10+`, `fulfillment.ts \| 3 (+2/-1)`, `support-flow/index.ts \| 1+`, `stripe-webhook.test.ts \| 18+`, `support-flow.test.ts \| 11+`. No migration, `src/`, `package.json`, `tsconfig*.json`, or `stripe-webhook/index.ts` touched (each confirmed 0 diff lines). |
| `support-flow/index.ts` still sends `p_amount_total: 4999`, `p_quantity: 1`, `p_currency: "usd"` | ✓ Confirmed at lines 150-153, unchanged by the diff. |
| No `discounts` property, no request-derived promo-code value in `support-flow/index.ts` | ✓ Confirmed — `grep discounts` = no match; only promo-related string is the static `allow_promotion_codes: true` literal; nothing reads `request`/`url.searchParams`/`claimed` for a promotion code. |
| No new environment variable | ✓ Confirmed — identical `Deno.env.get` call sites (5 names, same locations) before and after across both edge functions. |
| Raw-body `constructEventAsync` verification in `stripe-webhook/index.ts` byte-identical | ✓ Confirmed — `git diff 7fc8765~1..8d47c62 -- supabase/functions/stripe-webhook/index.ts` is empty (file untouched in the entire commit range). |
| `checkoutSessionInvariant` body (priceId equality + `CheckoutMetadataSchema`) unchanged; `mode`/`payment_status`/`currency`/`customer`/`payment_intent`/`line_items` invariants unchanged and equally strict | ✓ Confirmed — diff shows only lines 15-19 (the `amount_total`→`amount_subtotal`+`amount_total` split) changed in `fulfillment.ts`; `checkoutSessionInvariant` (lines 31-39) and every other schema field are untouched. |
| Repo-wide search for a consumer assuming charged `amount_total` equals exactly 4999 | ✓ No inconsistent consumer found. `src/`, `scripts/`, `tests/`, `.github/workflows/` have zero matches. The only remaining `amount_total = 4999` / `p_amount_total <> 4999` checks are in `supabase/migrations/20260814000000_support_authority.sql` (lines 30, 141) and are deliberately unchanged by design (D-4): they validate the **intent-time recorded fact** (`p_amount_total`, always the pre-discount list price, sent unconditionally by `support-flow/index.ts:152` before any code is entered), which is a distinct field from the **retrieved Stripe session's charged total** (`amount_total` in `fulfillment.ts`, now correctly bounded `1..4999`). No conflict. |
| Stripe semantics: `amount_subtotal` = pre-discount total, `amount_total` = final charged amount; retrieve call actually carries both fields | ✓ Confirmed, not a gap. `stripe-webhook/index.ts:57` retrieves with `{ expand: ["line_items.data.price"] }`. Per Stripe's API reference (docs.stripe.com/api/checkout/sessions/retrieve, docs.stripe.com/expand), `amount_subtotal` and `amount_total` are plain top-level scalar fields on every Checkout Session response and are **not** expandable/gated fields (unlike `line_items`, which does require `expand`) — they are always present regardless of the `expand` parameter. The validated `RetrievedCheckoutSchema` therefore really does receive both fields on every retrieve call. |

### Human Verification Required

None. All must-haves are verifiable via static evidence and the 3 focused Deno suites, which this verifier ran independently (not copied from SUMMARY.md) and which match the claimed counts exactly (9/9, 5/5, 5/5).

Two items remain explicit, documented **operator prerequisites** (deploying the edited `support-flow` Edge Function; creating a Stripe Dashboard coupon and promotion code) — both are out of scope for this quick task per its own "Deployment and Dashboard prerequisites" section and the assignment's constraints, and do not affect the status.

### Gaps Summary

None. All 6 truths, 5 artifacts, and 3 key links verified against actual file contents and independently-run test output. No anti-patterns, no debt markers, no scope violations, no regressions in the untouched `support-api.test.ts` suite, and no residual inconsistent consumer of the old `amount_total === 4999` literal anywhere in the repository.

---

_Verified: 2026-09-16_
_Verifier: QuickVerifier (subagent)_
