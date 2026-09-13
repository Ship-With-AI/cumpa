---
phase: quick
plan: 260913-apr
type: execute
mode: quick
autonomous: true
files_modified:
  - supabase/functions/support-flow/index.ts
  - supabase/functions/tests/support-flow.test.ts
  - src/web/App.vue
  - src/web/components/SupportDialog.vue
  - tests/integration/support-dialog.spec.ts
---

# Hosted restore must tell the truth about linkage

## Defect

A voluntary-support **Restore** that links nothing reports success and then hangs.

1. `supabase/migrations/20260814000000_support_authority.sql:189-191` — `support_private.restore_installation` returns `false` (no raise) when the signed-in user has no `support_private.supporters` row. It returns `true` only when a binding exists or is created.
2. `supabase/functions/support-flow/index.ts:128-131` — the `claimed.action === "restore"` branch awaits that RPC and discards both `data` and `error`, then unconditionally redirects to `/functions/v1/support-flow/complete`, which renders `"Support flow complete. You can return to Cumpa."`. A restore that linked nothing renders success.
3. `src/web/App.vue:952-965` — `scheduleSupportPoll` falls back to `delays[index++] ?? 15_000`, so polling repeats forever while `installation_status` keeps returning false. `supportDialogMode` stays `'waiting'` and `SupportDialog.vue:20` keeps showing `"Waiting for confirmation… You can close this and keep reviewing."` with no terminal state.

Observed end to end during Phase 7 acceptance: real GitHub sign-in completed, the hosted page displayed success, the app modal waited indefinitely, `/api/support/status` stayed `unverified`. Root cause was a Stripe test-mode entitlement against a now-live-mode service — exactly the "no supporters row" case that returns `false`.

## Decisions

**D-01 — Hosted: a fourth terminal browser state, returned directly from the callback.**
Add `"unlinked"` to `BrowserState` and return it from the restore branch when the RPC resolves to anything other than `true`. Return it *directly* from `/callback` (like the existing `invalid` and `unavailable` states) rather than redirecting to a new route: no new hosted path, no change to what `scripts/verify-supabase-support.mjs probeRoutes` and the release evidence assert about `/complete`, and it matches how every other non-success callback outcome already terminates.

- HTTP status **409**. The request was well-formed, the origin was allowed, the user authenticated and the intent claimed; only the account state conflicts. `400` would claim the link was invalid (it was not) and `503` would claim a transient outage (it is not).
- RPC transport/raise (`restored.error`, which is how `restore_installation`'s `P0001 installation already bound` surfaces) maps to the existing `unavailable` + `dependencies.log?.(...)` path, not to `unlinked` — "already bound to another account" must not be distinguishable in the response body.
- Copy must satisfy the existing `assertTerminal` contract: exact `text/plain; charset=utf-8`, ≤ 96 bytes, and no match for `/intent|code|token|state|email|profile|stripe|github|secret/i`. It must tell the user the next step without naming an account, an entitlement, a payment, or a provider. Suggested literal: `No support to restore for this sign-in. Return to Cumpa to support.` (67 bytes).
- The response must carry the already-accumulated `cookies` array (the cleared intent cookie plus any auth cookies), so give `browserResponse` an optional trailing cookies parameter and pass `cookies` only at this call site. Every existing `browserResponse(...)` call keeps its current single-argument form and current headers.

**D-02 — App: bounded polling with a 10-minute deadline and a `notConfirmed` terminal mode.**
The status contract is `z.strictObject({ status: z.enum(['unverified','verified']) })` (`src/contracts/api.ts:698-700`) and the hosted status endpoint answers `{status}` only — there is no failure signal to plumb through, and inventing one would mean changing the hosted API, the Zod contract, the local capability, and the store. The infinite wait is removable entirely inside `src/web/App.vue`, so bound the poll instead.

- Deadline is **600_000 ms** from `scheduleSupportPoll`, matching the hosted intent's own lifetime (`supabase/functions/support-api/index.ts:84` sets `p_expires_at` at `now + 600_000`; the state cookie is `Max-Age=600`). Past that point the claimed intent can never settle, so further polling for *that attempt* cannot change the answer. Justify the constant with that reference in a short comment.
- On deadline: stop the poll and, only if `supportDialogMode.value === 'waiting'`, set it to `'notConfirmed'` and `announce(...)`. Guarding on `'waiting'` keeps the `thankYou` promotion in `refreshSupportStatus` from being clobbered by a late timer.
- The 30-second background refresh (`startSupportStatus`) and the `visibilitychange` refresh are untouched, so a genuinely late verification still promotes `supportStatus` and `openSupportDialog` still opens as `'verified'`.

**D-03 — `notConfirmed` is an actionable terminal state, not a dead end.**
Add `'notConfirmed'` to the `mode` union in both `App.vue` and `SupportDialog.vue`, give it a status line, and render the existing invitation action row for it so the user can retry Restore or choose Support. Do not add a new button set.

## Non-goals / must not change

- **Deployment is out of scope.** This change is source-only. `supabase functions deploy`, `scripts/verify-supabase-support.mjs --run-deployment`, `.github/workflows/deploy-supabase-production.yml`, provider/Stripe configuration, and any database mutation are all excluded. **Consequence:** the currently deployed hosted service keeps the old behavior until the operator separately deploys `support-flow`, so existing acceptance evidence that shows the hosted page rendering `"Support flow complete. You can return to Cumpa."` for a restore — including `tests/e2e/public-support-states.spec.ts:455` and the recorded Phase 7 evidence — stays valid and must not be rewritten or re-run as part of this task.
- No purchase, payment, checkout, or entitlement creation; no Stripe test/live mode change.
- `restore_installation` / `installation_status` SQL and the `supporters` / `installation_bindings` data are unchanged. No new migration.
- The support (checkout) branch of the callback — Checkout session creation, `record_checkout_session`, `success_url`/`cancel_url`, the `unavailable` catch — is untouched.
- Intent and cookie handling is untouched: `stateCookie`, `clearStateCookie`, `opaqueIntent`, `intentHash`, `claim_support_intent`, `allowedOrigin`, and the `/complete`, `/callback`, `/support-flow` route set all keep their current behavior and bytes-on-the-wire.
- `/complete` keeps its exact 200 body — the deployment verifier asserts it literally (`scripts/verify-supabase-support.mjs:1001`).
- The local status contract stays terse: no change to `SupportStatusSchema`, `SupportStartResultSchema`, `src/server/routes.ts`, `src/server/support-client.ts`, `src/server/support-store.ts`, or `src/server/capabilities.ts`. No reason string reaches the app.
- No retries, telemetry, logging of user-identifying data, or redesign of the support flow.
- Work on `main`; no branch, worktree, or workspace. Leave untracked `.gsd/`, `EVIDENCE.md`, and `mockups/` alone. Never `git commit --no-verify`.
- Do not weaken any existing assertion. In particular `supabase/functions/tests/support-flow.test.ts:148` ("restore keeps paid and unpaid completion indistinguishable and rejects foreign origins") stubs `restore_installation` → `{ data: true }` and must keep passing unchanged: a *successful* restore still redirects to `/complete` and is still indistinguishable from a paid completion. Only the linked-nothing case becomes distinguishable, and only to the signed-in person who needs to act on it.

## Blast radius

The restore branch shares the `/callback` entry point with the payment path: the same origin check, OAuth exchange, `getUser`, and `claim_support_intent` run before the branch splits. The edit must stay strictly inside `if (claimed.action === "restore") { … }` plus the `browserResponse` signature; nothing above the branch and nothing in the `try { … }` checkout block changes. `browserResponse`'s new parameter is optional and unused by all four existing call sites, so the `invalid`/`unavailable`/`complete` responses keep byte-identical headers.

## Tasks

### Task 1 — Hosted restore honors the RPC result

**Files:** `supabase/functions/support-flow/index.ts`, `supabase/functions/tests/support-flow.test.ts`

**Action:**
1. In `index.ts`: add `"unlinked"` to the `BrowserState` union and to `browserMessages` with the D-01 copy; extend the status map in `browserResponse` so `unlinked` is `409` while `complete`/`invalid`/`unavailable` keep `200`/`400`/`503`; give `browserResponse` an optional second parameter for `Set-Cookie` values, appended with `headers.append("set-cookie", …)` exactly like `redirect` does.
2. Replace the fire-and-forget restore call: capture the result, return `browserResponse("unavailable", cookies)` after `dependencies.log?.("support_flow_unavailable")` when `restored.error` is truthy, return `browserResponse("unlinked", cookies)` when `restored.data !== true`, and only otherwise keep the existing `redirect(completionPath, cookies)`.
3. In `support-flow.test.ts`, following the existing `dependencies(overrides)` + `assertTerminal` style: add a test where `claim_support_intent` returns a `restore` intent and `restore_installation` returns `{ data: false, error: null }`. Assert the response is **not** the `complete` message and not a 302; assert `assertTerminal(response, 409, unlinked)` against a new module-level `unlinked` literal; assert `checkoutCalls.length === 0`; assert the response still clears the intent cookie. Add a second case in the same test where `restore_installation` returns `{ data: null, error: { message: "installation already bound" } }` and assert `assertTerminal(response, 503, unavailable)` — i.e. the raise is not distinguishable from a transient outage.

**Verify:** `deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests/support-flow.test.ts`

**Done:** The focused Deno suite passes with the new cases and the pre-existing restore/indistinguishability test unmodified and green. A restore whose RPC resolves `false` produces a 409 `text/plain` body that is ≤ 96 bytes, is not the completion message, matches none of `/intent|code|token|state|email|profile|stripe|github|secret/i`, and carries the cleared intent cookie.

**Commit:** `fix(quick-260913-apr): honor restore linkage result in hosted flow`

### Task 2 — App-side wait reaches a terminal state

**Files:** `src/web/App.vue`, `src/web/components/SupportDialog.vue`, `tests/integration/support-dialog.spec.ts`

**Action:**
1. `App.vue`: widen `supportDialogMode`'s type to include `'notConfirmed'`. In `scheduleSupportPoll`, compute `const deadline = Date.now() + 600_000;` (comment it as the hosted intent lifetime, per D-02) and, in the `.finally()` continuation, when `Date.now() >= deadline`, call `stopSupportWaiting()` and — only if `supportDialogMode.value === 'waiting'` — set `supportDialogMode.value = 'notConfirmed'` and `announce(...)` with the same sentence the dialog shows, instead of scheduling another `setTimeout`. Leave `startSupportStatus`, `stopSupportStatus`, `refreshSupportStatus`, `startSupportAction`, and the `thankYou` promotion untouched.
2. `SupportDialog.vue`: add `'notConfirmed'` to the `mode` prop union; add a `status` line for it that states the outcome and the next step without naming a reason (e.g. `Support wasn't confirmed. You can try again.`); change the invitation branch condition to also render for `'notConfirmed'` so the Support / Restore support / Not now row is reachable. Do not add emits or buttons.
3. `tests/integration/support-dialog.spec.ts`: add a test in the existing style (module-level `support`/`startAvailable` fixtures, `openReview`, `startHostedAction`). Call `await page.clock.install()` before `openReview(page)`, keep the mock status at `'unverified'`, run `startHostedAction(page, 'Restore support')`, assert the waiting text is visible, then advance the faked clock past the deadline in one-minute steps (`for (let i = 0; i < 12; i++) await page.clock.runFor('1:00');`) so each pending status fetch settles before the next timer is scheduled. Assert the waiting text is gone, the `notConfirmed` status line is visible, and `Restore support` is clickable again.

**Verify:** `npm run typecheck:web && npx playwright test tests/integration/support-dialog.spec.ts`

**Done:** Web typecheck is clean and all four pre-existing dialog tests plus the new one pass. With the hosted status never flipping, the dialog leaves `waiting` within the bounded window and lands on a terminal state that offers Restore again; the existing "only polling promotion thanks, closes, and suppresses future launches" test still passes unmodified.

**Commit:** `fix(quick-260913-apr): bound support wait with a terminal outcome`

## Verification

Run after both tasks, from the repository root:

1. `deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests` — the whole hosted suite, proving the support-api and stripe-webhook contracts are untouched.
2. `npx vitest run tests/api/support.test.ts` — proving the local `/api/support/{status,start,refresh}` contract and the terse `{status}` shape are unchanged.
3. `npx playwright test tests/integration/support-dialog.spec.ts` — rendered dialog behavior including the new terminal state.
4. `git diff --stat` limited to the five files in `files_modified`; no migration, no workflow, no `src/server`, no `src/contracts` change.

Do not run the deployment verifier, the live acceptance specs (`tests/e2e/public-support-states.spec.ts`, `tests/e2e/support-*.spec.ts` deployment paths), or any `supabase` CLI command.

## Follow-up (not this task)

After the operator deploys `support-flow`, the live restore-of-an-unentitled-account path will render the 409 `unlinked` body instead of the completion body. Anyone re-recording live acceptance evidence at that point will need to account for the new outcome; existing evidence remains accurate for the currently deployed revision.
