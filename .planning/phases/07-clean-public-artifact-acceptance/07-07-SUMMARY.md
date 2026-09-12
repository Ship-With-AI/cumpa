---
phase: 07-clean-public-artifact-acceptance
plan: "07"
subsystem: testing
tags: [acceptance-evidence, marketplace, omp, privacy]
provides:
  - Regenerated report-only Phase 07 evidence with a truthful partially-blocked ACC-04 result.
  - Real marketplace pre/post acceptance reports proving ACC-03.
requirements-completed: [ACC-01, ACC-02, ACC-03]
requirements-blocked: [ACC-04]
completed: 2026-09-12
status: partially-blocked
---

# Phase 07 Plan 07: Consolidated Acceptance Evidence Summary

**The evidence record was regenerated only after six fresh hardened driver reports existed: ACC-01 through ACC-03 pass, and ACC-04 is truthfully partially blocked by the live entitlement boundary.**

## Supersession

`9389f18` deletes the never-published stale `07-ACCEPTANCE-EVIDENCE.json` and creates its replacement in one commit. Its message records why the former pre-review record could not remain authoritative: BL-01 fabricated marketplace support rows, BL-02 used order-dependent merging, and BL-03 could not rebuild from real driver reports. The new record is built by `write-acceptance-evidence.mjs` solely from the committed public-global, public-npx, and marketplace pre/post reports.

Independent parsing confirmed:

```json
{"kind":"cumpa.public-artifact-acceptance/v1","status":"partially-blocked","installations":["global","npx","marketplace"],"blockedRows":3,"verifiedBlockedReasons":["live-entitlement-unavailable"],"restoreReportedCompleteWithoutLinkage":false,"leakScan":"clear"}
```

The check required all three sources to contain exactly unverified, dismissed, and verified rows; every blocked row has a named reason with `substituted: false`; all verified rows use `live-entitlement-unavailable`; pinned Phase 5 tarball and Phase 6 marketplace identities match; and the recursive leak scan found no prohibited hosted origin, private path, credential-like key, or installation-id-shaped value.

## ACC-03 real run

Both marketplace windows ran from the public skill collection (`ship-with-ai` 0.3.0 at `984e28c…28d5`) with the installed skill digest `8974c…0220`, a separately installed exact public CLI, and isolated profile. They proved the skill checker precedes Cumpa launch, executable containment, canonical export/browser summary/comment equality, and distinct readiness/completion timestamps. Pre-Restore passed support states; post-Restore produced only the honest verified blocked row `live-entitlement-unavailable` with `substituted: false` while its browser-review, export, and Finish behavior remained unrestricted.

The final hardening is deliberate rather than a guard bypass:

- `a9722eb` injects harness-owned opener/marker state into the isolated process environment so supervised Cumpa readiness is observed from its actual browser launch, without requiring the published skill to thread harness-only environment through `hub.start`.
- `f4963a0` verifies checker/launch order from the isolated agent's session trace, not an unstable stdout event format.
- The real-state digest retains installed plugins, marketplaces, agent/model configuration, broker credential, managed skills, and OMP-owned XDG configuration/data/state/cache. It deliberately excludes live-session volatiles: `agent.db`, `history.db`, `models.db`, all `-wal`/`-shm` siblings, sessions, logs, and cache. The operator's live OMP session updates those during an attended run; treating them as contamination caused a false positive. This narrowing is disclosed and tests cover excluded volatile churn plus retained configuration change detection.
- `6492551` is misleadingly marketplace-only by subject: it also carries a writer correction and superseded orphaned `a6de9c8` through concurrent amend.

## ACC-04 and limits

The sole Restore was already consumed. Its same-identity attempt is why all verified rows report `live-entitlement-unavailable`, not `human-sign-in-unavailable`. The hosted `restore_installation` false return is discarded by `support-flow`, which renders a false success despite no entitlement; this non-terminal-modal defect remains out of scope under D-09. No second sign-in, payment, publish, deployment, database mutation, or provider change occurred.

One shared support HOME was a disclosed narrowing. Local process isolation does not prove a fresh machine; only macOS arm64/Chromium and OMP were exercised, and the Phase 6 four-agent waiver remains waived. Local-archive verification remains separately unavailable without operator-held custody inputs and protected service configuration.

`tsconfig.json` still excludes `tests/`; a minimal discarded `tsconfig.tests` experiment found 131 diagnostics across 25 files, led by `workspace-state.test.ts` 18, `request.test.ts` 13, `agent-ready-export-safety.spec.ts` 13, `draft-load.test.ts` 13, and `selection.test.ts` 11.

## Final verification

- Fresh marketplace pre-Restore: 1 file / 1 test passed in 198.63 s.
- Fresh marketplace post-Restore: 1 file / 1 test passed in 321.64 s.
- Final regression gate: unit 27 files / 162 tests, git 9 / 69, API 19 / 142, Node typecheck, and web typecheck all passed.
