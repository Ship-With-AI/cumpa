---
phase: quick
plan: 260913-apr
subsystem: hosted-support-ui
tags: [supabase, restore, vue, playwright, deno]
requires:
 - phase: 07
provides:
 - finite support wait with a retryable terminal dialog state
affects: []
tech-stack:
 added: []
 patterns:
 - hosted intent lifetime bounds local waiting polls
key-files:
 created:
 - .planning/quick/260913-apr-hosted-restore-linkage-truth/260913-apr-SUMMARY.md
 modified:
 - src/web/App.vue
 - src/web/components/SupportDialog.vue
 - tests/integration/support-dialog.spec.ts
key-decisions:
 - "The hosted unlinked response was deliberately reverted to preserve indistinguishable paid and unpaid restore completion."
 - "The local waiting dialog ends after the hosted intent's 600,000 ms lifetime exposes existing retry actions."
patterns-established:
 - "Terminal support-dialog states reuse the existing invitation action row."
requirements-completed: []
duration: 0min
completed: 2026-09-13
status: complete
---

# Quick 260913-apr: Hosted restore linkage truth Summary

**The app-side bounded support wait stands; the hosted unlinked-response half was deliberately reverted to preserve the specified indistinguishable restore completion.**

## Final Outcome

The observed defect is fixed entirely in the app: the support modal no longer waits forever on “Waiting for confirmation” when the hosted status remains unverified. It does not depend on the hosted completion page disclosing whether Restore created a linkage.

The hosted half was implemented and then **deliberately reverted** in `05384c8` (`revert(quick-260913-apr): restore indistinguishable paid/unpaid restore completion`). The reason is the property specified by `32b048b` (`test(02-03): specify Supabase support authority`): Restore uses the same opaque proof and has indistinguishable paid and unpaid completion. Consequently, a hosted completion page reading `Support flow complete. You can return to Cumpa.` for an unpaid Restore is intentional, specified behavior—not a defect.

The revert was exact: `git diff e1dc5f4^ -- supabase/functions/` was empty, and the hosted suite reported `ok | 17 passed | 0 failed`.

## Standing App-side Fix

- `src/web/App.vue` bounds support polling at 600,000 ms, guarded on `mode === 'waiting'`.
- `src/web/components/SupportDialog.vue` adds the `notConfirmed` terminal mode. It renders a reason-free retry line with the existing invitation action row.
- The 30-second background refresh and `visibilitychange` refresh remain intact.

Verification already established for the standing app-side change:

- App-side suite: `5 passed`, including `ends an unconfirmed hosted restore wait with a retryable invitation`.
- Web typecheck: clean.

## Source-only Deployment Note

The app-side change ships with the normal build. No hosted-function change is pending deployment: the deployed hosted service is unaffected by this task, as is Phase 7's acceptance evidence.

## Open Question

**Undecided:** the Restore branch still ignores an RPC transport error or raise, so a transport fault also renders the completion page. Reverting the hosted half restored that pre-existing behavior. Whether to distinguish a transport fault from a legitimate unpaid Restore without breaking paid/unpaid indistinguishability is deliberately not resolved here.

## Implementation History

1. **Hosted RED:** `e1dc5f4` — `test(quick-260913-apr): add failing restore outcome coverage`
2. **Hosted GREEN:** `e560b82` — `fix(quick-260913-apr): honor restore linkage result`
3. **App RED:** `cd8af1e` — `test(quick-260913-apr): add failing support wait deadline coverage`
4. **App GREEN:** `79f20dd` — `fix(quick-260913-apr): bound support wait terminal outcome`
5. **Hosted revert:** `05384c8` — `revert(quick-260913-apr): restore indistinguishable paid/unpaid restore completion`

## Files That Stand

- `src/web/App.vue` — applies the 600,000 ms waiting-only deadline while retaining existing refresh behavior.
- `src/web/components/SupportDialog.vue` — renders the reason-free `notConfirmed` terminal state with existing actions.
- `tests/integration/support-dialog.spec.ts` — verifies the terminal retryable invitation after an unconfirmed hosted Restore wait.

## Deviations from the Original Plan

The operator chose a deliberate product/design correction after implementation: D-01's hosted `unlinked` HTTP 409 response was reverted because it violated the specified indistinguishability property. D-02 and D-03 stand unchanged.

## Self-Check: PASSED

- Summary file exists at `.planning/quick/260913-apr-hosted-restore-linkage-truth/260913-apr-SUMMARY.md`.
- `05384c8` records the deliberate hosted revert; the standing app-side commit is `79f20dd`.
