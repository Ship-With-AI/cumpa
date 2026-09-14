---
phase: 07-clean-public-artifact-acceptance
plan: 04
subsystem: testing
tags: [playwright, public-install, voluntary-support, restore, acceptance]

requires:
  - phase: 07-clean-public-artifact-acceptance
    provides: public runtime launch descriptor and shared support-HOME selector
provides:
  - Public-global live unverified and dismissed support-state evidence.
  - An uncompromised blocked verified row when the hosted Restore completion lacks a live entitlement binding.
affects: [07-05, 07-06, 07-07, public-artifact-acceptance]

tech-stack:
  added: []
  patterns: [window-scoped support evidence, blocked verified evidence, separate product-defect observation]

key-files:
  created: []
  modified:
    - tests/e2e/public-support-states.spec.ts
    - .planning/phases/07-clean-public-artifact-acceptance/07-04-SUMMARY.md

key-decisions:
  - "A hosted Restore completion without a live entitlement binding is recorded as live-entitlement-unavailable, never as verified support."
  - "The false hosted completion and non-terminal application modal are a separate product-defect observation, not acceptance evidence."

patterns-established:
  - "Pre-restore and post-restore windows emit only the rows they attempted."
  - "A blocked verified row claims none of verified-state review, export, or Finish behaviour."

requirements-completed: []
requirements-blocked: [ACC-04]
duration: not-recorded
completed: 2026-09-12
status: complete
acceptance-status: partially-blocked
---

# Phase 07 Plan 04: Live Public Support-State Matrix Summary

**The public-global support matrix passed the real live-unverified and dismissed rows; the verified row is honestly blocked because a reported Restore completion created no live entitlement binding.**

## ACC-04 Outcome

| Window | State | Outcome | Evidence |
| --- | --- | --- | --- |
| pre-restore | live unverified | PASSED | Real hosted-service refresh observed `unverified`. The invitation is a `role="dialog" aria-modal="true"` in fixed `.support-dialog-backdrop`; it intentionally blocks pointer interaction, so this row asserts live status plus unrestricted capability rather than clicking through the overlay. |
| pre-restore | dismissed | PASSED | After dismissing the prompt, an independent interactive walkthrough added a review comment, saved a summary, and exported the review. |
| post-restore | verified | BLOCKED | `reason: live-entitlement-unavailable`; `substituted: false`; `restoreCompleted: false`; `restoreObservedFromSharedIdentity: false`; verified-state review, export, and Finish were not observed and are all recorded false. |

The emitted acceptance record is **`partially-blocked`**, never `passed`. No unavailable, unverified, or dismissed observation was substituted for verified behaviour.

## Restore Attempts

1. **Unattended window:** the first 12-minute Restore window elapsed while the operator was away. This was neither a product failure nor a hosted-service failure.
2. **Attended Restore:** the operator completed GitHub sign-in. The hosted page reported completion, but the application stayed unverified during live polling; its in-product verification modal reached no terminal state.
3. **Diagnosis instead of another Restore:** source-level diagnosis established the cause, so no further protected sign-in or Restore attempt was made.

## Root Cause

The established source diagnosis is authoritative:

1. `supabase/migrations/20260814000000_support_authority.sql:177` implements `support_private.restore_installation(p_user_id, p_installation_id)` so that it returns `false` without raising when the signed-in user has no row in `support_private.supporters`.
2. `supabase/functions/support-flow/index.ts` awaits that RPC in its Restore branch but discards its boolean result and redirects to the completion page unconditionally.
3. The account's paid support was purchased while Stripe was in TEST/sandbox mode. The hosted service now uses Stripe LIVE mode, so no LIVE-mode `supporters` row exists for that account; the installation had never been verified.

Therefore a genuine verified ACC-04 row is unreachable without a new LIVE-mode support purchase. D-07 forbids that purchase, so this is a correctly blocked row under D-08, not a harness failure and not `human-sign-in-unavailable`.

## Separate Product Defect Finding

The Restore branch produces a false success page by ignoring the `restore_installation` boolean: it can report completion even though no installation linkage was created. The application's verification modal also remains non-terminal when `installation_status` continues to report unverified.

`restoreReportedCompleteWithoutLinkage: true` is recorded separately from `supportStates`, with the retained unverified status and the non-terminal modal observation. It is not blurred into, or treated as evidence for, the blocked verified acceptance row.

Fixing or deploying a correction to the hosted edge function or SQL is outside Phase 7 scope under D-09. No deployment, provider configuration change, Stripe change, database mutation, support-store edit, mock, interception, or new purchase was performed.

## Task Commits

1. **Task 1: Support-capability probe plus live unverified and dismissed rows** — `0008213` (test)
2. **Task 2: Human Restore sign-in** — `014584c` (test)
3. **Task 3: Verified row and bounded support record** — `da1f17b`, `8843dbc`, `e101994` (test/docs)
4. **Accurate blocked-reason and defect record** — `3f0f341`, `a3bccd7` (test/fix)

## Files Modified

- `tests/e2e/public-support-states.spec.ts` — preserves the corrected initial-refresh ordering and bounded Restore diagnostics; adds `live-entitlement-unavailable` and records the Restore-completion-without-linkage defect separately from acceptance rows.
- `.planning/phases/07-clean-public-artifact-acceptance/07-04-SUMMARY.md` — records the real ACC-04 outcome and its blocking condition.

## Decisions Made

- Preserve the passing pre-restore rows and strict window separation: each window reports only rows it actually attempted.
- Treat a hosted completion page plus continued unverified live status as a distinct defect observation, not verification.
- Leave ACC-04 partially blocked rather than claim success through substituted evidence.

## Deviations from Plan

The plan's permitted blocked branch was used. The original generic `human-sign-in-unavailable` reason was corrected because a real sign-in and hosted completion were observed; its live-entitlement cause is more precise.

## Next Phase Readiness

- The public-global path has real passing live-unverified and dismissed evidence.
- ACC-04 remains blocked until an authorised account has a genuine LIVE-mode paid entitlement and a Restore creates the installation binding. That condition cannot be created within D-07/D-09.
- Downstream work must retain `partially-blocked` status and must not reuse these rows as verified evidence.

## Self-Check: PASSED

Real scoped verification output (redacted):

```text
$ npx tsc --noEmit --project tsconfig.json
(exit 0; no output)

$ CUMPA_PUBLIC_INSTALL_SOURCE=public-global CUMPA_SUPPORT_STATE_WINDOW=pre-restore npx playwright test tests/e2e/public-support-states.spec.ts --project=chromium
1 skipped
2 passed (21.6s)
```

The pre-restore run executed no headed Restore flow. Its skipped test is the post-restore verified row; its two passing tests are the probe and the separate live-unverified/dismissed matrix.

---
*Phase: 07-clean-public-artifact-acceptance*
*Completed: 2026-09-12*
