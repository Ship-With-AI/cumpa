---
phase: 07-clean-public-artifact-acceptance
plan: "05"
subsystem: testing
tags: [omp, marketplace, playwright, npm, acceptance]

requires:
  - phase: 06-independent-mit-marketplace-skill
    provides: Published Ship-With-AI marketplace collection and frozen public skill digest
  - phase: 07-clean-public-artifact-acceptance
    provides: Shared support-home and public-runtime acceptance adapters
provides:
  - Isolated OMP marketplace acceptance driver with authenticated model access proof
  - Browser Finish walkthrough bound to the agent-supervised canonical export
  - Marketplace ACC-04 unverified, dismissed, and blocked verified evidence rows
affects: [07-06, 07-07, public-artifact-acceptance]

tech-stack:
  added: []
  patterns: [temporary OMP credential-store copy, hub-supervised browser handoff, marker mtime lifecycle evidence]

key-files:
  created:
    - tests/e2e/marketplace-review.spec.ts
    - tests/package/marketplace-profile-acceptance.test.ts
  modified:
    - tests/helpers/omp-profile.ts

key-decisions:
  - "The temporary profile reuses an authorized copy of the operator provider credential; this narrows authentication isolation, while all other profile dimensions remain isolated."
  - "The OMP hub process receives the browser marker environment explicitly because daemon inheritance is not sufficient."
  - "A temporary Playwright config selects only the marketplace spec because the fixed phase config does not match it."

patterns-established:
  - "Marketplace acceptance: derive readiness from the marker file mtime and accept a canonical result only after zero exit."
  - "OMP credential access: copy the authorized local store into the owned temporary profile, make the destination writable for SQLite, and digest the real source state before and after."

requirements-completed: [ACC-03, ACC-04]

duration: 4h 49m
completed: 2026-09-12
status: complete
---

# Phase 07 Plan 05: Isolated Marketplace Acceptance Summary

**The public Ship-With-AI collection was installed into an isolated OMP profile and drove the public pinned Cumpa CLI through a browser Finish to a validated canonical export.**

## Performance

- **Duration:** 4h 49m
- **Started:** 2026-09-12T12:12:00Z
- **Completed:** 2026-09-12T17:05:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Proved actual model access in the temporary OMP profile after the approved temporary copy of the existing provider credential; the source profile stayed byte-identical.
- Installed the public `Ship-With-AI/skills` collection at project scope, loaded the published Cumpa skill outside the checkout with the pinned SHA-256, and had OMP supervise the separately installed public `@shipwithai/cumpa@1.5.0` through browser Finish.
- Validated a non-empty canonical `cumpa/export` after zero exit, with the exact browser-entered summary and comment; readiness preceded terminal completion.
- Observed the marketplace path's live unverified invitation and dismissed review/export flow. The binding verified outcome is blocked as `live-entitlement-unavailable`, `substituted: false`, with `restoreReportedCompleteWithoutLinkage: true`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Isolated OMP profile harness with an isolation-capability probe** — `517e422` (test)
2. **Task 2: Authenticate the isolated OMP profile for model access** — `0a1c802` (test)
3. **Task 3: Marketplace end-to-end driver and its browser walkthrough** — `e21c4a7` (test)

## Files Created/Modified

- `tests/helpers/omp-profile.ts` — isolated profile setup, public marketplace install, authorized temporary auth-store copy, and real-profile digest guard.
- `tests/e2e/marketplace-review.spec.ts` — agent-launched loopback review, draft/export/Finish assertions, and marketplace support-state bridge record.
- `tests/package/marketplace-profile-acceptance.test.ts` — separate public runtime, OMP agent, hub lifecycle, canonical export, provenance, and redacted evidence driver.

## Decisions Made

- The isolated profile shares only the support HOME and a temporary, operator-authorized provider-credential copy. It is not independently authenticated; the agent directory, XDG config/data/cache/state, npm prefix/cache/config, browser profile, checkout, and PATH remain per-path.
- OMP's hub daemon requires the browser-opener environment to be passed on `hub.start`; relying on inherited environment did not produce a loopback observation.
- The temporary Playwright configuration is generated under the owned driver directory. The permanent phase config was not changed because its `testMatch` excludes this marketplace spec.

## Deviations from Plan

### Auto-fixed Issues

**1. Marketplace project scope had to follow the reviewed fixture**
- **Found during:** Task 3
- **Issue:** A project-scoped plugin installed under the profile harness root was not visible when the agent worked in the disposable reviewed repository.
- **Fix:** Install the frozen public collection at the fixture's project root while retaining profile state under the owned temporary root.
- **Files modified:** `tests/helpers/omp-profile.ts`, `tests/package/marketplace-profile-acceptance.test.ts`
- **Verification:** The agent loaded the installed published skill, ran its checker first, reached loopback readiness, and exited zero after Finish.
- **Committed in:** `e21c4a7`

**2. Fixed phase Playwright selection did not discover the new spec**
- **Found during:** Task 3
- **Issue:** The existing fixed config's `testMatch` listed only prior specs, so its requested positional filter produced no tests.
- **Fix:** Generate an owned temporary config that selects only `marketplace-review.spec.ts`; the fixed config remains untouched.
- **Files modified:** `tests/package/marketplace-profile-acceptance.test.ts`
- **Verification:** The isolated browser walkthrough passed as part of the acceptance run.
- **Committed in:** `e21c4a7`

---

**Total deviations:** 2 auto-fixed (2 blocking harness issues).
**Impact on plan:** Both changes preserve the public artifact and actual OMP-agent path; no review logic was duplicated or substituted.

## Issues Encountered

- An initial read-only destination copy of OMP's SQLite-backed auth store failed with `SQLITE_READONLY`. The source was never changed; the temporary copy is writable and removed with the isolated profile.
- The hosted service has no live entitlement linkage after Restore. Per the binding phase outcome, the verified marketplace row remains honestly blocked rather than using a substitute identity.

## User Setup Required

None — the operator's approved temporary credential-copy authorization was consumed and the temporary profile was destroyed after the successful run.

## Next Phase Readiness

- 07-06 can consume the marketplace record alongside the global and npx path records using the shared support-home ordering.
- Carry forward both explicit narrowing facts: the support HOME is shared across paths, and the temporary OMP profile reuses the operator provider credential rather than independently provisioning authentication.

---
*Phase: 07-clean-public-artifact-acceptance*
*Completed: 2026-09-12*
