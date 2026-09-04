---
phase: 01-add-voluntary-stripe-support-payment-and-email-recovery
plan: 01
subsystem: payments
tags: [stripe, postgresql, npm, supply-chain, hosted-service]

# Dependency graph
requires: []
provides:
  - "Explicit provenance approval for the exact hosted-service package pins needed by Plan 01-02."
affects: [01-02, hosted-support-service]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hosted-only dependency provenance gate before installation."

key-files:
  created:
    - .planning/phases/01-add-voluntary-stripe-support-payment-and-email-recovery/01-01-SUMMARY.md
  modified: []

key-decisions:
  - "Approved stripe@22.5.0 only for the separately deployed hosted support service after registry metadata verified stripe/stripe-node and no install lifecycle hook."
  - "Approved pg@8.23.0 only for the separately deployed hosted support service after registry metadata verified brianc/node-postgres and no install lifecycle hook."
  - "Approved development-only @types/pg@8.21.0 only for the separately deployed hosted support service after registry metadata verified DefinitelyTyped/DefinitelyTyped and no install lifecycle hook."
  - "Root Cumpa package remains outside the hosted dependency boundary; no dependency installation occurred in this plan."

patterns-established:
  - "Do not install a hosted dependency until its exact npm identity, repository, scripts, and release provenance are explicitly approved."

requirements-completed: [PAY-03, PAY-04]

# Metrics
duration: 0min
completed: 2026-08-12
status: complete
---

# Phase 01 Plan 01: Hosted Dependency Provenance Summary

**Approved exact Stripe and PostgreSQL package identities for later installation solely in the separately deployed hosted support service, preserving the root Cumpa package boundary.**

## Performance

- **Duration:** 0 min
- **Started:** 2026-08-12T17:01:00Z
- **Completed:** 2026-08-12T17:01:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Verified `stripe@22.5.0` registry metadata: package name and version match the approved pin, repository is `stripe/stripe-node`, and published scripts contain no lifecycle install hook.
- Verified `pg@8.23.0` registry metadata: package name and version match the approved pin, repository is `brianc/node-postgres`, and published scripts contain no lifecycle install hook.
- Verified development-only `@types/pg@8.21.0` registry metadata: package name and version match the approved pin, repository is `DefinitelyTyped/DefinitelyTyped`, and published scripts are empty.
- Recorded human approval limited to the separately deployed hosted service. No package was installed, and the root `package.json` was not changed.

## Task Commits

The checkpoint created no task commit because it changed no product or dependency artifact.

1. **Task 1: Verify hosted dependency provenance** - human-approved after successful npm registry and repository provenance verification; recorded by the plan metadata commit below.

**Plan metadata:** recorded in the closeout commit.

## Files Created/Modified

- `.planning/phases/01-add-voluntary-stripe-support-payment-and-email-recovery/01-01-SUMMARY.md` - durable approval record for the hosted-only dependency provenance gate.

## Decisions Made

- Approval covers exactly `stripe@22.5.0`, `pg@8.23.0`, and development-only `@types/pg@8.21.0`, and no similarly named substitute.
- `stripe@22.5.0` may be used only in `services/support/`, the separately deployed hosted service; its verified repository is `stripe/stripe-node`.
- `pg@8.23.0` may be used only in `services/support/`, the separately deployed hosted service; its verified repository is `brianc/node-postgres`.
- Development-only `@types/pg@8.21.0` may be used only in `services/support/`; its verified repository is `DefinitelyTyped/DefinitelyTyped`.
- The root Cumpa package is not a hosted service boundary. No root dependency or credential may be added, and no dependency file changed in this plan.

## Verification

Ran:

```text
npm view stripe@22.5.0 name version repository scripts --json && npm view pg@8.23.0 name version repository scripts --json && npm view @types/pg@8.21.0 name version repository scripts --json
```

Result: passed. The registry returned the exact approved names and versions, canonical repositories (`stripe/stripe-node`, `brianc/node-postgres`, and `DefinitelyTyped/DefinitelyTyped`), and no lifecycle install scripts. The supplied human response is recorded as `approved` after that successful registry verification.

No formatter, linter, build, test suite, package installation, or project-wide validation was run, as required by the plan.

## Deviations from Plan

None - plan executed exactly as written, except that the required summary records the checkpoint outcome because the assignment explicitly mandates it.

## Issues Encountered

None.

## User Setup Required

None - this plan only approves dependency provenance and changes no deployment configuration.

## Next Phase Readiness

- Plan 01-02 may install only the approved pins in `services/support/` after its own planned implementation work.
- The root `package.json` and its dependency graph remain outside this approval and must remain unchanged.

## Self-Check: PASSED

- Summary file exists at the mandated path.
- Registry verification passed for all three exact approved package identities.
- No dependency manifest or lockfile changed during this plan.

---
*Phase: 01-add-voluntary-stripe-support-payment-and-email-recovery*
*Completed: 2026-08-12*
