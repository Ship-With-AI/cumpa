---
phase: 07-clean-public-artifact-acceptance
plan: "06"
subsystem: testing
tags: [public-artifact, npm, playwright, acceptance]
provides:
  - Fresh committed public global and empty-cache npx reports for both support windows.
  - Report-only evidence inputs with identity-aware blocked verified rows.
requirements-completed: [ACC-01, ACC-02]
requirements-blocked: [ACC-04]
completed: 2026-09-12
status: partially-blocked
---

# Phase 07 Plan 06: Public Artifact Acceptance Summary

**Fresh hardened public-global and public-npx runs completed their browser-review, export, Finish, and asset-graph contracts in both support windows; only the live verified entitlement remains unavailable.**

## Real report matrix

| Window | Public global | Public npx |
| --- | --- | --- |
| pre-Restore | passed | passed, empty cache / no prior global or local binary / registry fetch observed |
| post-Restore | verified state blocked: `live-entitlement-unavailable`, `substituted: false` | same |

All four redacted driver reports are committed beneath `acceptance-reports/`. Each records the pinned `@shipwithai/cumpa@1.5.0` registry tarball/integrity, one isolated install attempt, Darwin arm64 host facts and Chromium runtime version, asset graph (`assets`, `workers`, `codicon`), review/export facts, Finish, and non-empty asserted source-control scenarios.

The already-consumed Restore attempt is bound to the shared installation identity. The hosted service still reports unverified, so the post-Restore reason is accurately `live-entitlement-unavailable`, never `human-sign-in-unavailable`; no additional sign-in occurred. The historical attempt predates this rerun, so public-global did not newly observe a false completion: `restoreReportedCompleteWithoutLinkage` is false rather than invented.

## Persistence and consolidation

- `fdc9348` committed pre-Restore reports immediately after the public path completed.
- `59292a8` committed post-Restore reports immediately after the public path completed.
- `9389f18` replaces the never-published pre-review aggregate only after the full real three-path matrix existed. It uses these reports, plus the two marketplace reports, as its sole runtime inputs.

The superseded record was not used as input: its pre-review pipeline had BL-01 fabricated marketplace support rows, BL-02 order-dependent merge behavior, and BL-03 inability to rebuild from actual driver reports.

## ACC-04 boundary

`support_private.restore_installation` returns `false` without raising for a user with no `supporters` row; `support-flow` discards that boolean and renders `Support flow complete. You can return to Cumpa.` The live service therefore falsely reports completion while the state remains unverified. The historical Stripe purchase used test/sandbox mode while the service is live. Fixing or deploying that hosted product defect is out of scope under D-09.

## Disclosures

- One shared support HOME/identity was used across global, npx, and marketplace; npm cache/configuration, install prefix, browser state, checkout, and PATH stayed isolated.
- Local isolation is not fresh-machine proof. This covers one macOS arm64 host and Chromium only. OMP is the only agent runtime exercised; the Phase 6 four-agent waiver remains waived.
- The local-archive path still requires operator-held custody inputs and protected support-service configuration.
- `tsconfig.json` excludes `tests/`. A discarded minimal `tsconfig.tests` experiment found 131 diagnostics in 25 files; top counts were `workspace-state.test.ts` 18, `request.test.ts` 13, `agent-ready-export-safety.spec.ts` 13, `draft-load.test.ts` 13, and `selection.test.ts` 11.

## Verification

The final regression gate passed: unit 27 files / 162 tests, git 9 / 69, API 19 / 142, Node typecheck, and web typecheck.
