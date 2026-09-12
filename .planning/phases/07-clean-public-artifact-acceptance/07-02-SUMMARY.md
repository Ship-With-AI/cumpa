---
phase: 07-clean-public-artifact-acceptance
plan: 02
subsystem: testing
tags: [npm, public-artifact, isolated-runtime, support-identity]

requires:
  - phase: 07-clean-public-artifact-acceptance
    provides: pinned public artifact identity and isolated runtime seams
provides:
  - Public global and empty-cache npx adapters with exact public-resolution guards.
  - Machine-readable operator-confirmed D-02 shared-support-identity policy.
affects: [07-03, 07-04, 07-05, 07-06, 07-07]

tech-stack:
  added: []
  patterns: [per-adapter owned npm roots, shared support identity with explicit limitation]

key-files:
  created:
    - .planning/phases/07-clean-public-artifact-acceptance/07-02-SUMMARY.md
  modified:
    - tests/helpers/public-runtime.ts

key-decisions:
  - "shared-support-home"
  - "The operator will complete exactly 1 Restore sign-in."

patterns-established:
  - "Downstream paths import D02_SUPPORT_IDENTITY_POLICY instead of re-deriving the D-02 narrowing."
  - "A path observing verified state from the shared identity records restoreCompleted: false and restoreObservedFromSharedIdentity: true."

requirements-completed: [ACC-01, ACC-02]

duration: 12min
completed: 2026-09-12
status: complete
---

# Phase 07 Plan 02: Public Install Adapters Summary

**Public global and empty-cache npx adapters keep package-manager state isolated while an operator-confirmed policy shares only the voluntary-support identity.**

## Performance

- **Tasks:** 3/3
- **Files modified:** 2
- **Adapter execution:** A post-decision isolated smoke invoked the global adapter. Its pre-install PATH guard aborted before npm ran because an existing `cumpa` was resolvable; the failure proves the guard rejects the user's installation rather than accepting it as public-artifact evidence.

## Accomplishments

- Retained the committed global (`635d7ee`) and npx (`8940cc3`) adapters, each with an owned run root and isolation supplied by `protectedEnvironment`.
- Recorded the operator's verbatim selection: **`shared-support-home`** — "One shared support HOME across all three paths".
- Exported `D02_SUPPORT_IDENTITY_POLICY` from `tests/helpers/public-runtime.ts` so Plans 07-04 through 07-07 can programmatically consume the narrowing and shared-observation record fields.

## Task Commits

1. **Task 1: Global public install adapter with the executed resolution guard** — `635d7ee` (`feat`)
2. **Task 2: Empty-cache npx adapter** — `8940cc3` (`feat`)
3. **Task 3: Confirm the shared-support-identity narrowing of D-02** — `953be42` (`feat`)
4. **Rule 1 fix: Resolve the npx cache payload** — `f1e400a` (`fix`)

## Files Created/Modified

- `tests/helpers/public-runtime.ts` — exports the explicit D-02 policy alongside the existing isolated global/npx adapters.
- `.planning/phases/07-clean-public-artifact-acceptance/07-02-SUMMARY.md` — records the decision, its limitation, and downstream contract.

## Shared-Support-Identity Decision

The operator selected, verbatim, **`shared-support-home`** — "One shared support HOME across all three paths" — and is prepared to complete **exactly 1** real Restore sign-in later in Plan 07-04.

This is an explicit operator-confirmed narrowing of D-02, recorded before any adapter run. The one shared support HOME supplies the support identity, installation identity, and voluntary-support status for the global, npx, and marketplace paths.

### Limitation

This is **not** full per-path HOME isolation: the three paths are not independent with respect to support identity or voluntary-support status. Every other D-02 dimension remains isolated per path:

- npm cache
- npm configuration
- install prefix
- browser profile state
- checkout separation
- sanitized PATH

`D02_SUPPORT_IDENTITY_POLICY.perPathIsolation` encodes those dimensions. Its `sharedIdentityObservation` value supplies `restoreCompleted: false` and `restoreObservedFromSharedIdentity: true` for a path observing state established by the one real Restore. Such paths must not request a second protected sign-in or copy another path's row.

## Decisions Made

- Used the selected shared support HOME only for the support identity; adapters retain their own temporary root, npm cache/configuration, prefix, and sanitized PATH.
- Kept the shared-identity limitation explicit in exported data and this summary so later plans do not present it as full D-02 HOME separation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Captured the npx cache payload before using it**
- **Found during:** post-decision isolated adapter smoke preparation
- **Issue:** `preparePublicNpxRuntime` used `installed` without assigning `npxPackage(cache)`, which would throw after a successful npx fetch.
- **Fix:** Assigned the cache payload immediately after the warm-up invocation and before containment, resolution, and manifest validation.
- **Files modified:** `tests/helpers/public-runtime.ts`
- **Verification:** `npx tsc --noEmit --project tsconfig.json` exited 0.
- **Committed in:** `f1e400a`

**Impact:** Required correctness fix; no scope expansion.

## Issues Encountered

The real pre-install guard correctly rejected the host's pre-existing `cumpa` executable. No public npm installation was attempted, so the user's npm prefix, configuration, cache, HOME, and existing installation were not mutated.

## User Setup Required

One protected Restore sign-in remains for Plan 07-04. No sign-in, payment, publication, push, or deployment occurred in this plan.

## Next Phase Readiness

Plans 07-04 through 07-07 can import `D02_SUPPORT_IDENTITY_POLICY` and must preserve all per-path isolation dimensions while flagging observations from the shared verified identity.

## Self-Check: PASSED

```text
$ npx tsc --noEmit --project tsconfig.json
tsc: exit 0 (no diagnostics)
FOUND: 07-02-SUMMARY.md
FOUND: 635d7ee
FOUND: 8940cc3
FOUND: 953be42
FOUND: f1e400a
```

### Guard Smoke Output

```text
$ npx vitest run tests/unit/.public-runtime-smoke.test.ts
Error: [public-runtime] PATH leakage resolved a pre-existing cumpa executable before install
```

The temporary smoke file was removed. The adapter reported the PATH-leakage error rather than a cleanup failure, which confirms its owned-root cleanup completed on the catch path.
