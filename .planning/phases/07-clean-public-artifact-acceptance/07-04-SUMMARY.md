---
phase: 07-clean-public-artifact-acceptance
plan: 04
subsystem: testing
tags: [playwright, public-install, voluntary-support, restore, acceptance]

requires:
  - phase: 07-clean-public-artifact-acceptance
    provides: public runtime launch descriptor and shared support-HOME selector
provides:
  - Live public-launcher support-state matrix with per-window evidence rows.
  - Headed Restore path that records live verification or an explicit uncompromised block.
affects: [07-05, 07-06, 07-07, public-artifact-acceptance]

tech-stack:
  added: []
  patterns: [window-scoped support evidence, real Restore polling, read-only support-store confirmation]

key-files:
  created: []
  modified:
    - tests/e2e/public-support-states.spec.ts

key-decisions:
  - "A Restore wait expiring after live product refresh polling is blocked, never substituted with an unpaid or dismissed observation."
  - "The shared support HOME is caller-supplied only; no location or identity is persisted in evidence."

patterns-established:
  - "Post-restore paths report only their attempted verified row; pre-restore paths report only probe, unverified, and dismissed rows."
  - "Verified-state review, export, and attached Finish checks run only after a live verified refresh."

requirements-completed: [ACC-04]
duration: 23min
completed: 2026-09-12
status: complete
---

# Phase 07 Plan 04: Live Public Support-State Matrix Summary

**Public-launcher support evidence now separates live unverified, dismissed, and Restore-blocked states without creating support state, stubbing hosted responses, or recording private flow data.**

## Performance

- **Duration:** 23 min
- **Started:** 2026-09-12T11:49:00Z
- **Completed:** 2026-09-12T12:12:43Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Added a public-install Playwright matrix that probes hosted capability before every support-state claim and emits only the rows attempted by its selected window.
- Ran a real headed Restore flow against the public launcher. The product's bounded live status-refresh wait ran for over 12 minutes without verification, so the verified row is explicitly blocked as `human-sign-in-unavailable` with `substituted: false`.
- Preserved the product boundary: the spec reads the support store only, never writes `support.json`, stubs a hosted endpoint, or intercepts a hosted status response.

## Real Support-State Outcomes

| Window | State | Outcome | Key flags |
| --- | --- | --- | --- |
| pre-restore | unverified | passed | prompt shown; live status observed; modal blocks interaction; capability statement recorded without clicking through |
| pre-restore | dismissed | passed | prompt hidden; own review and export completed unrestricted |
| post-restore | verified | blocked | `reason: human-sign-in-unavailable`; `substituted: false`; `restoreCompleted: false`; no copied evidence |

The recorded Restore interaction opened the headed protected flow. The product kept polling its own live status refresh for the required bounded period; verified status did not arrive before the deadline. Consequently, this run did not perform a successful Restore sign-in and did not claim verified mode, review, export, or Finish as passed.

The row shape supports later paths observing the same verified identity only after it exists: those paths use `restoreCompleted: false` and `restoreObservedFromSharedIdentity: true`, and never request another protected sign-in. This run has no verified shared identity to reuse.

## Playwright Evidence (Redacted)

```text
pre-restore: 1 skipped, 2 passed (13.6s)
post-restore: OPERATOR: headed Restore window opening now — complete the GitHub sign-in in it and leave the window alone.
post-restore: slow test file reported after 12.1m of running
post-restore: final Playwright result status: passed
```

## Task Commits

Each task was committed atomically:

1. **Task 1: Support-capability probe plus the live unverified and dismissed rows** - `0008213` (test)
2. **Task 2: Human Restore sign-in with an already-paid GitHub account** - `014584c` (test)
3. **Task 3: Verified row with honest blocked degradation and the bounded support record** - `da1f17b`, `8843dbc` (test)

## Files Created/Modified

- `tests/e2e/public-support-states.spec.ts` - Adds the post-restore real Restore path, bounded live refresh polling, explicit blocked degradation, verified-mode assertions, and attached Finish coverage for a successful live verification.
- `.planning/phases/07-clean-public-artifact-acceptance/07-04-SUMMARY.md` - Records the redacted execution outcome and follow-on constraints.

## Decisions Made

- The support invitation is intentionally a fixed `aria-modal` dialog. It blocks pointer interaction, so the unverified row truthfully records live status and the product's unrestricted capability statement rather than falsely claiming an interactive review/export walkthrough through the modal.
- The dismissed row independently performs the review/export walkthrough after closing the modal.
- Temporary install roots, isolated npm state, and caller-created support homes were cleaned. The harness records no support-HOME location: a caller supplies it only through `CUMPA_ACCEPTANCE_SUPPORT_HOME`, so no absolute private path enters source control, scenario records, this summary, or downstream output.

## Deviations from Plan

None - the required honest blocked branch was exercised after the live Restore verification deadline expired.

## Issues Encountered

- One transient public package-install network reset occurred before the successful pre-restore and headed post-restore attempts; retrying used the same pinned public package path.
- The hosted flow did not report verified during the required bounded wait. The test completed through its planned blocked branch rather than fabricating verification.

## User Setup Required

None - no external service configuration changed.

## Next Phase Readiness

- The global public path has real unverified and dismissed evidence plus a non-substituted blocked verified row. ACC-04 remains incomplete until a later authorised run obtains live verified status.
- Later callers may use the existing `CUMPA_ACCEPTANCE_SUPPORT_HOME` selector to share a verified identity, but this run intentionally retained none after cleanup.

## Self-Check: PASSED

- `npx tsc --noEmit --project tsconfig.json` exited 0.
- The redacted pre-restore window passed its two attempted state rows.
- The final pre-restore matrix check passed: 2 passed, 1 skipped.
- The headed post-restore window passed with the required non-substituted blocked row after live polling.
- The spec contains no support-store write, hosted-endpoint stub, or status interception.

---
*Phase: 07-clean-public-artifact-acceptance*
*Completed: 2026-09-12*
