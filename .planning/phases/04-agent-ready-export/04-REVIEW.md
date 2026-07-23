---
phase: 04-agent-ready-export
reviewed: 2026-07-23T22:28:24Z
depth: deep
files_reviewed: 18
files_reviewed_list:
  - package.json
  - playwright.config.ts
  - scripts/build-native-addon.mjs
  - scripts/run-package-export-safety.mjs
  - scripts/verify-production-artifacts.mjs
  - src/native/directory-exchange.cc
  - src/server/capabilities.ts
  - src/server/export-store.ts
  - src/server/native-exchange-capability.ts
  - tests/e2e/agent-ready-export-safety.spec.ts
  - tests/e2e/agent-ready-export.spec.ts
  - tests/helpers/agent-ready-export-target.ts
  - tests/helpers/export-fault-runner.ts
  - tests/package/agent-ready-export-safety.test.ts
  - tests/package/agent-ready-export.test.ts
  - tests/unit/build-native-addon.test.ts
  - tests/unit/directory-exchange.test.ts
  - tests/unit/native-exchange-capability.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Phase 04: Code Review Report

**Reviewed:** 2026-07-23T22:28:24Z
**Depth:** deep
**Files Reviewed:** 18
**Status:** clean

## Summary

Reviewed the production native-exchange capability path from add-on build/load/probe through publication, the packed tarball re-export journey, and the scripts that build shared `dist/` artifacts. No actionable correctness, security, portability, or test-quality defects remain in this Phase 04 scope.

Production capability is granted only after temporary probe-directory setup, add-on load, and a supported native probe. Add-on-load/probe/setup failures and cleanup failures return typed `reExportUnsupported`; the publication path receives that capability before a stable re-export exchange. The build script removes stale add-ons on every target other than the declared Darwin/arm64 target.

The real compiler/probe test is now gated to Darwin/arm64, matching the sole observed target in the reconciliation policy. The packed test uses the same target predicate: Darwin/arm64 requires a `201` exported re-export receipt; every other host requires the actual packed runtime's `409` `reExportUnsupported` response and verifies the first stable pair remains byte-identical. Its evidence reports both target and result. `test:package-contract` builds once and uses Vitest `--no-file-parallelism` for the two package test files, eliminating concurrent shared-`dist/` mutation in the canonical contract command.

## Narrative Findings (AI reviewer)

No findings. The two prior portability warnings are closed:

- The native compiler test no longer invokes Darwin linker flags outside its declared Darwin/arm64 target.
- The packed default contract no longer demands observed native re-export on unsupported targets; it proves typed refusal without stable-pair mutation instead.

## Verification

- `npm exec vitest run tests/unit/build-native-addon.test.ts tests/unit/native-exchange-capability.test.ts` — passed: 2 files, 4 tests.
- `node_modules/.bin/vitest run tests/package/agent-ready-export.test.ts -t "runs packed re-export as"` — passed: 1 file, 3 target-policy cases; the full package-evidence test was intentionally skipped.
- Static final re-review of `28b7407`: `tests/unit/directory-exchange.test.ts` gates the real compiler/probe with `test.runIf(process.platform === 'darwin' && process.arch === 'arm64')`; `package.json` defines the serialized `test:package-contract` command.
- Per Main's ledger-owned final evidence report, the focused native checks passed 3 files/5 tests and the canonical package contract passed 2 files/12 tests plus the 22-test Chromium suite. The reviewer did not rerun build/package commands because the ledger owned the sole final evidence run.

---

_Reviewed: 2026-07-23T22:28:24Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
