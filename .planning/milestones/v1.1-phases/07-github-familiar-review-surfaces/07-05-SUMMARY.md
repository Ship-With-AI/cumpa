---
phase: 07-github-familiar-review-surfaces
plan: "05"
subsystem: ui
tags: [vue, css, playwright, draft-recovery, accessibility]
requires:
  - phase: 07-github-familiar-review-surfaces
    provides: shared UiIcon, ReviewStateBadge, InlineNotice, ui-spinner, and state-complete controls
provides:
  - explicit icon-label-boundary Read only recovery presentation
  - localized destructive backup progress with verified-only recovery receipt
  - production Chromium evidence for fixed-authority recovery states
affects: [07-06, 08-accessible-responsive-continuity]
tech-stack:
  added: []
  patterns: [authoritative recovery presentation, local busy-control feedback, fixed-authority browser assertions]
key-files:
  created: []
  modified:
    - src/web/components/DraftRecovery.vue
    - src/web/styles.css
    - tests/integration/draft-recovery-ui.spec.ts
key-decisions:
  - "Classified ReadOnlyDraftLoad remains the only recovery-state authority; the UI only renders its existing branches."
  - "Only the confirmation action receives the shared spinner and aria-busy while recovery is pending."
patterns-established:
  - "Recovery uses the shared disabled badge and full notice anatomy while retaining fixed reveal and fingerprint-bound recovery closures."
requirements-completed: [REVW-04]
duration: not-recorded
completed: 2026-07-28
status: complete
---

# Phase 07 Plan 05: Read-Only Draft Recovery Summary

**Read-only draft recovery now uses icon-label status boundaries, structured outcome notices, and a locally busy destructive confirmation while preserving fixed recovery authority and verified backup semantics.**

## Performance

- **Duration:** Not independently captured in the executor context.
- **Started:** Not independently captured in the executor context.
- **Completed:** 2026-07-28T08:42:05Z
- **Tasks:** 1/1
- **Files modified:** 3

## Accomplishments

- Replaced the recovery-only text badge and ad hoc notices with the established disabled/success badge and full notice language for recoverable, upgrade-blocked, action, failure, and verified receipt states.
- Kept classified loads, fixed no-body reveal, exact copy values, fingerprint-bound recovery, backup-first ordering, no-replacement failure, and Open new draft continuation unchanged.
- Localized the existing shared spinner, exact `Backing up existing draft…` label, and `aria-busy` to the confirmation's destructive recovery action; sibling disabled controls do not claim progress.
- Extended the production Vite/Playwright harness for icon-plus-label structural status, pending bounds, no-replacement failure, verified receipt, focus/Escape, and request-shape authority proof.

## Task Commits

Each task was committed atomically:

1. **Task 1: Make read-only recovery states explicit, safe, and locally busy** — `6968316` (feat)

## Files Created/Modified

- `src/web/components/DraftRecovery.vue` — renders classified read-only/recovery outcomes using existing shared presentation primitives and preserves confirmation focus.
- `src/web/styles.css` — supplies recovery status, notice, confirmation, busy-action, receipt, and wrapping treatments without a new breakpoint or motion primitive.
- `tests/integration/draft-recovery-ui.spec.ts` — exercises malformed, schema-invalid, newer-schema, pending, failure, verified recovery, and fixed-authority browser paths.

## Decisions Made

- Classified `ReadOnlyDraftLoad` discriminants and the fixed reveal/recovery closures remain authoritative; presentation adds no filesystem path, request body, persistence, or success signal.
- A recovery success badge and notice render only from the existing `recovered` result; failures retain the disabled status and explicitly state that existing bytes were not replaced.
- The shared spinner is placed only in the acted-on destructive control, whose fixed inline minimum preserves its width and height while its label changes.

## Verification

- `npm run test:browser -- tests/integration/draft-recovery-ui.spec.ts` — passed: 3 Chromium tests.
- `npm run test:browser -- tests/integration/draft-recovery-ui.spec.ts --headed` — passed: 3 Chromium tests.
- Focused browser assertions prove reveal sends no body, recovery sends only `expectedFingerprint`, recovery remains explicitly confirmed, and success appears only after the verified recovered response.
- Task commit changed exactly the three declared production/test paths; no API, contract, persistence, service, package, lockfile, or Phase 08 path changed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Restored confirmation focus after the recovery presentation refactor.**
- **Found during:** Task 1 focused Chromium verification.
- **Issue:** The existing next-tick focus handoff did not reliably focus `Keep existing draft` after the conditional confirmation mounted.
- **Fix:** Added a local mount-time focus directive to the existing confirmation target while retaining Escape's current return focus.
- **Files modified:** `src/web/components/DraftRecovery.vue`
- **Verification:** Both focused headless and headed Chromium runs prove confirmation focus and Escape restoration.
- **Committed in:** `6968316`

**2. [Rule 3 - Blocking] Made the delayed recovery response assertion deterministic.**
- **Found during:** Task 1 focused Chromium verification.
- **Issue:** The test could release the delayed response after the pending label rendered but before the Vite middleware had registered the recovery request.
- **Fix:** Waited for the existing fingerprint-only request body before releasing the fixture response.
- **Files modified:** `tests/integration/draft-recovery-ui.spec.ts`
- **Verification:** Both focused headless and headed Chromium runs pass all three recovery scenarios.
- **Committed in:** `6968316`

---

**Total deviations:** 2 auto-fixed (1 Rule 1 presentation/focus fix; 1 Rule 3 browser-harness reliability fix).
**Impact on plan:** Both corrections preserve the planned recovery authority and make the specified focus and request-order evidence reliable; no scope expanded.

## Issues Encountered

None beyond the auto-fixed focus and request-order issues documented above.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 07-06 can consume the established notice, badge, and busy-control language while treating recovery authority and byte-safety behavior as immutable.
- Phase 08 still owns milestone-wide narrow-layout, 400% zoom, forced-colors, grayscale, and full workflow proof.

## Self-Check: PASSED

---
*Phase: 07-github-familiar-review-surfaces*
*Completed: 2026-07-28*
