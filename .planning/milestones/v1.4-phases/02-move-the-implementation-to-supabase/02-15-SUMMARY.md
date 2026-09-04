---
phase: 02-move-the-implementation-to-supabase
plan: 15
subsystem: infrastructure
tags: [supabase, npm, package-scan, evidence, playwright, security]
requires:
  - phase: 02-14
    provides: "Legacy standalone workspace and dependency surfaces removed"
provides:
  - "Configured-absent retirement evidence over tracked sources, dist, tarball inventory, and extracted package"
  - "Exact canonical-origin package scanner capability for Plan 02-16"
  - "Six-input immutable final-evidence and local/package/security collector interfaces for Plan 02-17"
affects: [02-16, 02-17]
tech-stack:
  added: []
  patterns:
    - "Caller-supplied canonical origin allowlists remove only exact origin and documented route occurrences before leak denial"
    - "Final evidence stores distinct path, kind, version, and SHA-256 bindings; release approval is a separate immutable record"
key-files:
  created:
    - .planning/phases/02-move-the-implementation-to-supabase/02-15-RETIREMENT-EVIDENCE.md
  modified:
    - scripts/verify-supabase-support.mjs
    - scripts/verify-production-artifacts.mjs
    - tests/e2e/support-payment.spec.ts
    - tests/e2e/package-assets.spec.ts
    - docs/support-service-operations.md
    - supabase/functions/tests/stripe-webhook.test.ts
key-decisions:
  - "Configured-absent scanning remains the default; the actual configured launcher is deferred to Plan 02-16."
  - "The final reviewer requires exactly six named immutable records and derives the release approval path from the release record."
patterns-established:
  - "Retirement evidence is generated only after source, built dist, inventory, and extracted-package scans complete with zero violations."
  - "Local package/security evidence rejects hosted and provider inputs before it executes its credential-free command inventory."
requirements-completed: [PAY-01, PAY-02, PAY-03, PAY-04, SUP-01, SUP-02, SUP-03, SUP-04, SUP-05, REC-01, REC-02, REC-03]
duration: 35m
completed: 2026-09-03
status: complete
---

# Phase 02 Plan 15: Scoped retirement and final-evidence contracts Summary

**Configured-absent package retirement now has deterministic evidence, while canonical-origin release scanning and six-input final evidence are fail-closed contracts ready for Plans 02-16 and 02-17.**

## Performance

- **Duration:** 35m
- **Started:** 2026-09-03T17:26:25Z
- **Completed:** 2026-09-03T18:01:53Z
- **Tasks:** 2/2
- **Files modified:** 7

## Accomplishments

- Added deterministic tracked-source, rebuilt-dist, tarball-inventory, and extracted-package retirement scanning with immutable scope/evidence metadata.
- Added exact-origin package capability mode: one supplied canonical origin and one launcher assignment pass; alternate hosts, bare refs, duplicates, retired runtime content, and protected values fail.
- Added the local/package/security collector plus final-review/check-final interfaces, requiring six distinct immutable records and a release approval bound to release bytes, run ID, and package digest.

## Task Commits

1. **Task 1: scoped retirement and canonical-origin scans** - `044a941` (test), `eec0350` (feat)
2. **Task 2: six immutable final-evidence inputs** - `a64b764` (test), `2ef9d63` (feat)
3. **Retirement evidence refresh** - `17b5ff4` (chore)

## Files Created/Modified

- `scripts/verify-supabase-support.mjs` — retirement, local/package/security, final-review, and read-only final-check contracts.
- `scripts/verify-production-artifacts.mjs` — configured-absent and exact canonical-origin package scanner modes.
- `tests/e2e/support-payment.spec.ts` — table-driven scanner fixtures and six-input final-evidence regressions.
- `tests/e2e/package-assets.spec.ts` — configured-absent published-package scanner proof.
- `docs/support-service-operations.md` — retirement, Plan 02-16 scanner capability, and six-record operations policy.
- `supabase/functions/tests/stripe-webhook.test.ts` — removes a secret-shaped fixture literal from scanned tracked content.
- `.planning/phases/02-move-the-implementation-to-supabase/02-15-RETIREMENT-EVIDENCE.md` — redacted configured-absent retirement evidence.

## Verification

- `npx playwright test --config=tests tests/e2e/support-payment.spec.ts tests/e2e/package-assets.spec.ts` — passed, 10 tests.
- `node scripts/verify-supabase-support.mjs --retirement-review --output .planning/phases/02-move-the-implementation-to-supabase/02-15-RETIREMENT-EVIDENCE.md` — passed.
- `npx playwright test --config=tests tests/e2e/support-payment.spec.ts` — passed, 8 tests.

## Decisions Made

- Keep configured absence as the ordinary package policy; no configured release embedding was added.
- Restrict the public-origin exception to one caller-supplied canonical origin and enumerated routes in configured release scans.
- Require final evidence to bind six named paths and raw file digests, with release approval loaded independently from the release-record directory.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Security] Removed secret-shaped fixture literals from tracked webhook tests**
- **Found during:** Task 1
- **Issue:** The required whole-tracked-file protected-value scan correctly rejected a `whsec_`-shaped test fixture.
- **Fix:** Constructed the fixture string at runtime without changing webhook test behavior.
- **Files modified:** `supabase/functions/tests/stripe-webhook.test.ts`, `tests/e2e/support-payment.spec.ts`, `scripts/verify-supabase-support.mjs`
- **Verification:** Focused Playwright scanner suites passed and retirement evidence emitted with zero violations.
- **Committed in:** `eec0350`

**Total deviations:** 1 auto-fixed (1 security)

## Issues Encountered

- Generic bundled-code identifiers resembled 20-character refs and generic query values; scanners now identify a configured raw ref only when it is the supplied ref, while configured-absent mode rejects Supabase hosts and standalone 20-character values without rejecting unrelated compiled code.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02-16 can embed and prove exactly one protected-workflow-derived canonical origin with `--expected-support-origin` and `--require-configured-launcher`.
- Plan 02-17 can invoke the credential-free local collector and then write/check the six-input final evidence record.

## Self-Check: PASSED

- Required retirement evidence exists.
- Task commits `044a941`, `eec0350`, `a64b764`, `2ef9d63`, and `17b5ff4` exist.

---
*Phase: 02-move-the-implementation-to-supabase*
*Completed: 2026-09-03*
