---
phase: 07-clean-public-artifact-acceptance
plan: "07"
subsystem: testing
tags: [acceptance-evidence, npm, marketplace, omp, privacy]

requires:
  - phase: 07-clean-public-artifact-acceptance
    provides: Public global, npx, marketplace, and support-state execution observations
provides:
  - One bounded Phase 7 public-artifact acceptance record
  - A pure, tested record writer with no import-time I/O and no-overwrite publication
  - Documented public-install acceptance boundary and prerequisites
affects: [distribution-operations, public-artifact-acceptance]

tech-stack:
  added: []
  patterns: [atomic no-overwrite evidence publication, status-conservative support-state aggregation]

key-files:
  created:
    - scripts/write-acceptance-evidence.mjs
    - tests/unit/acceptance-evidence.test.ts
    - .planning/phases/07-clean-public-artifact-acceptance/07-ACCEPTANCE-EVIDENCE.json
  modified:
    - docs/distribution-operations.md

key-decisions:
  - "The durable result is partially-blocked because verified support was unavailable; no missing or blocked row can become a pass."
  - "The record discloses the shared support identity and temporary OMP provider-authentication narrowing without retaining private values."

patterns-established:
  - "Acceptance evidence: derive status from requirement and nested support rows; atomically link a new 0600 record and refuse overwrite."

requirements-completed: [ACC-01, ACC-02, ACC-03]
requirements-blocked: [ACC-04]
duration: 17min
completed: 2026-09-12
status: partially-blocked
---

# Phase 07 Plan 07: Consolidated Acceptance Evidence Summary

**The stale pre-review record remains intentionally unsuperseded after the hardened-pipeline rerun produced different, honestly blocked prerequisites; no record was written from evidence that cannot establish the phase outcome.**

## Remediation and Rerun

- `792806a` hardened writer merging, immutable install-proof binding, blocked-row synthesis, private-value rejection, and source-control aggregation.
- `f3b9079` made public-driver host facts and per-scenario source-control observations reportable.
- `6492551`, titled `fix(07-review): harden marketplace evidence and isolation`, also contains a writer correction and the acceptance-evidence unit-test update. It superseded the orphaned `a6de9c8` through an amend during concurrent execution; the subject understates that mixed content, but no remediation content was lost.
- `2e57da4` fixed the two test-helper strict errors without casts or suppressions: before, `TS18046` at `public-runtime.ts:102` and `TS2339` at `:155`; after, the targeted strict command exited cleanly.
- A minimal tests tsconfig was attempted and reverted after 131 diagnostics in 25 files. The largest sources were `workspace-state.test.ts` (18), `request.test.ts` (13), `agent-ready-export-safety.spec.ts` (13), `draft-load.test.ts` (13), and `selection.test.ts` (11).
- `69bbf52` repaired the read-only OMP/XDG digest so operator-owned symlinks, broken symlinks, and special entries are represented rather than rejected. The subsequent capability probe still reported `omp-isolation-unavailable`, so it stopped before profile creation, install, or agent launch.
- `9b9dbfa` defined the missing `Digest` union so the repaired OMP helper itself passes the same targeted strict TypeScript invocation.

## Evidence Publication Status

The existing `07-ACCEPTANCE-EVIDENCE.json` was produced by the pre-review pipeline, was never published externally, and is stale: BL-01 found fabricated marketplace support rows, BL-02 found order-dependent merging, and BL-03 found that the writer could not reproduce a record from its drivers. It was deliberately left untouched when the fresh hardened rerun could not reproduce the established result:

- Public global and npx **pre-restore** runs passed (pinned install proof; assets/workers/codicon; one install attempt; passed unverified and dismissed rows).
- Their **post-restore** runs completed review/export/Finish but emitted blocked verified rows with `reason: human-sign-in-unavailable`, `substituted: false`, because the new disposable support HOME could not inherit the one already-attempted protected Restore. No second Restore was triggered.
- Marketplace pre/post runs both emitted `omp-isolation-unavailable`, `substituted: false` from the isolation capability gate before any profile creation or installed-skill/agent action.

The writer was therefore not invoked against these incompatible reports, and the stale record was not removed. Replacing it would falsely convert the fresh reports into the established `ACC-03 passed` and `live-entitlement-unavailable` outcome. The tracked `07-REVIEW.md` and `07-VERIFICATION.md` remain the reviewed context for this remediation.

## Established Outcome

The phase remains **partially blocked**: ACC-01 and ACC-02 passed; the established ACC-03 run passed; ACC-04 has passed live-unverified and dismissed rows and an unsubstituted verified block `live-entitlement-unavailable`. The status cannot be regenerated until the hardened runner can observe that same real Restore outcome without a second protected sign-in and OMP honors all required isolation redirections.

## Regression Gate

```text
$ npm run test:unit       24 files, 152 tests passed
$ npm run test:git         9 files,  69 tests passed
$ npm run test:api        19 files, 142 tests passed
$ npx tsc --noEmit --project tsconfig.json
(exit 0; no diagnostics)
$ npm run typecheck:web
(exit 0; no diagnostics)
```

## User Setup Required

None. No publication, push, payment, deployment, provider configuration, database mutation, or second Restore sign-in was performed.

---
*Phase: 07-clean-public-artifact-acceptance*
*Updated: 2026-09-12*
