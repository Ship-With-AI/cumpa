---
phase: quick
plan: 260913-apr
subsystem: hosted-support-ui
tags: [supabase, restore, vue, playwright, deno]
requires:
  - phase: 07
    provides: hosted voluntary-support flow and local support dialog
provides:
  - truthful terminal response when restore did not create a linkage
  - finite support wait with a retryable terminal dialog state
affects: [hosted-support-deployment, phase-07-acceptance]
tech-stack:
  added: []
  patterns:
    - restore RPC booleans are handled before rendering a hosted completion outcome
    - hosted intent lifetime bounds local waiting polls
key-files:
  created:
    - .planning/quick/260913-apr-hosted-restore-linkage-truth/260913-apr-SUMMARY.md
  modified:
    - supabase/functions/support-flow/index.ts
    - supabase/functions/tests/support-flow.test.ts
    - src/web/App.vue
    - src/web/components/SupportDialog.vue
    - tests/integration/support-dialog.spec.ts
key-decisions:
  - "A false restore result is a 409 unlinked terminal response; RPC failures remain the existing generic 503 unavailable response."
  - "The local waiting dialog ends after the hosted intent's 600,000 ms lifetime and exposes the existing retry actions."
patterns-established:
  - "Terminal hosted responses preserve accumulated Set-Cookie values when a callback has already cleared its intent cookie."
requirements-completed: []
duration: 0min
completed: 2026-09-13
status: complete
---

# Quick 260913-apr: Hosted restore linkage truth Summary

**Restore now reports an unlinked outcome instead of false completion, and an unverified hosted handoff returns the local dialog to a retryable state after ten minutes.**

## SOURCE ONLY — deployment caveat

This changes source only. No Supabase deployment, provider, workflow, Stripe, database, payment, publish, push, or sign-in action was performed. The deployed hosted service still has its old false-success Restore behavior until the operator separately deploys `support-flow`; Phase 7 acceptance evidence, including the untouched live-page record, remains accurate as written.

## Accomplishments

- Added the `unlinked` browser state: a false `restore_installation` result returns HTTP 409 with bounded, safe plain text and the cleared intent cookie; an RPC error remains the generic 503 unavailable result; true remains the existing completion redirect.
- Bounded `scheduleSupportPoll` at the hosted intent's 600,000 ms lifetime without changing its 30-second background refresh, visibility refresh, or verified/thank-you promotion.
- Added `notConfirmed` dialog rendering that uses the existing Support, Restore support, and Not now action row, plus hosted and Playwright regression coverage.

## RED → GREEN Evidence

### Task 1 — Hosted restore honors RPC result

- **RED:** `deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests/support-flow.test.ts` reported `FAILED | 5 passed | 1 failed (5ms)` at the new restore-outcome assertion before the implementation.
- **GREEN:** the same command reported `ok | 6 passed | 0 failed (5ms)` after handling `restored.error` and `restored.data !== true`.

### Task 2 — App-side wait reaches a terminal state

- **RED:** `npm run typecheck:web && npx playwright test tests/integration/support-dialog.spec.ts` reported `1 failed, 4 passed (11.5s)` because the waiting text remained visible after twelve virtual minutes.
- **GREEN:** the same command reported `5 passed (6.2s)` after the deadline transition and retryable dialog rendering.

## Verification

- `deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests/support-flow.test.ts` — `ok | 6 passed | 0 failed (5ms)`.
- `npm run typecheck:web && npx playwright test tests/integration/support-dialog.spec.ts` — web typecheck completed; `5 passed (6.2s)`.
- `deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests` — `ok | 18 passed | 0 failed (116ms)`.
- `npx vitest run tests/api/support.test.ts` — `Test Files 1 passed (1)` and `Tests 10 passed (10)`.

## Protected Invariants

- The existing exact `/complete` test remained green, proving its literal 200 body remains `Support flow complete. You can return to Cumpa.`
- The source diff changes only the `BrowserState`/`browserResponse` definition and restore branch; the checkout creation, `record_checkout_session`, `success_url`, `cancel_url`, and checkout `unavailable` catch are untouched.
- The existing paid/unpaid indistinguishability test at line 149 is unmodified and green. The test diff contains only a new literal and a new test after that protected case.
- `browserResponse` retains all existing single-argument calls; only the new restore outcomes pass the optional cookie array. The cookie loop appends values to preserve the cleared intent cookie.
- `tests/e2e/public-support-states.spec.ts`, SQL/migrations, route set, state/cookie helpers, contracts, and server support code were not modified or run.
- `git diff --name-only e1dc5f4^..HEAD` reported exactly the five planned source/test files. `git diff --check e1dc5f4^..HEAD` produced no errors.

## Task Commits

1. **Task 1 RED:** `e1dc5f4` — `test(quick-260913-apr): add failing restore outcome coverage`
2. **Task 1 GREEN:** `e560b82` — `fix(quick-260913-apr): honor restore linkage result`
3. **Task 2 RED:** `cd8af1e` — `test(quick-260913-apr): add failing support wait deadline coverage`
4. **Task 2 GREEN:** `79f20dd` — `fix(quick-260913-apr): bound support wait terminal outcome`

## Files Modified

- `supabase/functions/support-flow/index.ts` — maps restore truth, failure, and cookies to terminal responses.
- `supabase/functions/tests/support-flow.test.ts` — asserts false and error restore outcomes and no Checkout.
- `src/web/App.vue` — sets a 600,000 ms polling deadline guarded by `mode === 'waiting'`.
- `src/web/components/SupportDialog.vue` — renders the reason-free not-confirmed status with existing actions.
- `tests/integration/support-dialog.spec.ts` — advances the virtual clock past the deadline and verifies Restore is enabled again.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used Playwright's accepted one-minute clock format**
- **Found during:** Task 2
- **Issue:** the plan's `page.clock.runFor('1:00')` was rejected by the installed Playwright: `Clock only understands numbers, 'mm:ss' 'hh:mm:ss'`.
- **Fix:** used semantically identical `page.clock.runFor('01:00')`, the documented one-minute `mm:ss` form.
- **Files modified:** `tests/integration/support-dialog.spec.ts`
- **Verification:** the virtual-clock regression test reached the deadline and passed.
- **Committed in:** `79f20dd`

**2. [Rule 1 - Bug] Restored an unrelated declaration after an edit-anchor mistake**
- **Found during:** Task 2
- **Issue:** a duplicate support dialog mode declaration caused the Vue compiler to fail; correcting it also restored the existing `attachedResult` declaration.
- **Fix:** retained one widened dialog mode declaration at its original location and preserved `attachedResult`.
- **Files modified:** `src/web/App.vue`
- **Verification:** web typecheck and all five dialog integration tests passed without the prior Vue warning.
- **Committed in:** `79f20dd`

**Total deviations:** 2 auto-fixed (1 blocking compatibility issue, 1 implementation bug). **Impact:** no scope expansion; the final behavior matches the plan.

## Issues Encountered

None remaining.

## Next Readiness

Source is ready for an operator-controlled hosted-function deployment. Until that deployment occurs, the deployed service intentionally remains unchanged.

## Self-Check: PASSED

- Summary file exists at `.planning/quick/260913-apr-hosted-restore-linkage-truth/260913-apr-SUMMARY.md`.
- `git log --oneline --all --grep="quick-260913-apr"` returned `79f20dd`, `cd8af1e`, `e560b82`, and `e1dc5f4`.
