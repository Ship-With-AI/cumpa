---
phase: 02-move-the-implementation-to-supabase
plan: 05
subsystem: browser-support-ui
tags: [vue, playwright, support, github-oauth, accessibility, tdd]

# Dependency graph
requires:
  - phase: 02-move-the-implementation-to-supabase
    provides: "Plan 02-04 strict loopback Support/Restore action and verified-only refresh contract."
provides:
  - "Browser Support and Restore actions that open hosted OAuth flow URLs in new tabs."
  - "Polling-only verified promotion, automatic thank-you close, and persisted launch suppression."
  - "Accessible optional USD $49.99 support dialog with no email-recovery browser state."
affects: [02-06, hosted-support-flow, package-safety]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Browser parses strict local SupportStartResult before opening a hosted flow; only refresh may promote local support status."
    - "Rendered Playwright support coverage fulfills hosted URLs in popup tabs without allowing navigation results to establish verification."

key-files:
  created: []
  modified:
    - src/web/api/client.ts
    - src/web/App.vue
    - src/web/components/SupportDialog.vue
    - tests/integration/support-dialog.spec.ts

key-decisions:
  - "Use one startSupportAction(action) browser client method for both hosted Support and Restore handoffs."
  - "Keep unavailable hosted actions in the invitation state and never treat an action, popup, cancellation, or delay as verification."

patterns-established:
  - "The support dialog remains fully keyboard-accessible and cancellable while status polling is bounded by the existing lifecycle."

requirements-completed: [PAY-01, PAY-02, PAY-03, SUP-01, SUP-02, SUP-03, SUP-04, SUP-05, REC-01, REC-02, REC-03]

# Metrics
duration: 20min
completed: 2026-08-15
status: complete
---

# Phase 02 Plan 05: Browser hosted Support/Restore cutover Summary

**Vue browser client now sends strict Support/Restore actions to the loopback, opens the returned GitHub OAuth flow in a separate tab, and suppresses the optional support prompt only after verified status polling.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-08-15T11:36:10Z
- **Completed:** 2026-08-15T11:56:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Replaced Checkout and email-recovery browser calls with strict `startSupportAction('support' | 'restore')` parsing against the shared action/result schemas.
- Preserved the optional USD $49.99 Support, Restore, Not now, focus trap, Escape, inert background, cancellation, waiting, polling, thank-you, and automatic-close experience.
- Deleted browser email input, recovery modes, recovery submission state, and obsolete client methods without touching unrelated draft-recovery behavior.
- Added rendered Playwright proof for both hosted handoffs, unavailable behavior, unrestricted reviewing, accessibility, polling-only promotion, and next-launch suppression.

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — specify the complete browser action and dialog contract** — `b137219` (test)
2. **Task 2: GREEN — migrate all browser callers and remove email state** — `11d597a` (feat)

## Files Created/Modified

- `src/web/api/client.ts` — replaces Checkout/recovery API methods with strict `startSupportAction`.
- `src/web/App.vue` — routes both actions through hosted handoff and retains refresh-only verification promotion.
- `src/web/components/SupportDialog.vue` — retains accessible support states while deleting email recovery UI and emits the Support action directly.
- `tests/integration/support-dialog.spec.ts` — renders the full browser contract against action/status loopback seams and hosted popup tabs.

## Verification

- `npx playwright test --config=tests tests/integration/support-dialog.spec.ts` — passed: 3/3 tests.
- Obsolete Support Checkout/recovery browser seam scan — only negative test assertions for absent email-recovery controls remain.
- Browser smoke is included in the focused Playwright run: Support and Restore opened hosted popup tabs, cancellation retained the workspace, and visibility refresh alone produced thank-you, automatic close, and future-launch suppression.

## Decisions Made

- Both user-facing actions use the same strict action result instead of retaining Checkout or recovery compatibility methods.
- Hosted flow completion is intentionally untrusted in the local browser; only `refreshSupportStatus()` may enter the verified/thank-you path.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The RED suite initially failed while loading the stale browser client because Plan 02-04 had removed its imported Checkout/recovery schemas; this is the intended clean-cutover failure identifying obsolete callers.
- The popup test fulfills the example hosted origin so Chromium can retain its final URL without external network dependency.
- `requirements.mark-complete` found no checkbox-form requirement IDs in the existing requirements format, so it made no edit; State and Roadmap progression completed normally.

## User Setup Required

None - deployment and real hosted OAuth/Stripe evidence remain owned by Plan 02-06.

## Next Phase Readiness

- Plan 02-06 can exercise the same browser action contract against the hosted development capability.
- No browser Checkout, email recovery, recovery token, OAuth session/code, GitHub profile, or payer email seam remains.

## Self-Check: PASSED

- Summary artifact exists at the required path.
- Task commits `b137219` and `11d597a` resolve to commit objects.
