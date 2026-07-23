---
phase: 04-agent-ready-export
reviewed: 2026-07-23T22:23:01Z
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
  warning: 1
  info: 0
  total: 1
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-07-23T22:23:01Z
**Depth:** deep
**Files Reviewed:** 18
**Status:** issues_found

## Summary

Reviewed the production native-exchange capability path from add-on build/load/probe through publication, the packed tarball re-export journey, and the scripts that build shared `dist/` artifacts. The observer correctly loads and probes the add-on only after probe-directory creation and fails closed on setup and cleanup errors. The serialized safety runner builds before its read-only safety suite.

The target-aware packed remediation closes the prior cross-platform package finding. `hasObservedNativeReExport()` encodes the ledger's sole Darwin/arm64 target; the packed journey requires `201` and an exported receipt only there. On every other host it now proves the actual packed runtime returns `409` with typed `reExportUnsupported`, preserves the first stable pair byte-for-byte, and emits evidence that records the observed target and outcome.

One real compiler test remains unguarded, so the review cannot yet be clean.

## Warnings

### WR-01: Native compiler probe is not gated to its declared target

**File:** `tests/unit/directory-exchange.test.ts:22-31, 43-51`

**Issue:** `buildAddon()` always invokes `/usr/bin/c++` with Darwin-only `-dynamiclib` and `-undefined dynamic_lookup` flags, before the test's `process.platform` branch can assert an unsupported result. Therefore a non-Darwin unit-suite run fails at compilation rather than exercising a supported skip/refusal path. It also runs on Darwin/x64 despite the ledger declaring only Darwin/arm64 as an observed native target. This contradicts the portable real-compiler-test contract.

**Fix:** Gate this real add-on compile/probe test with `test.runIf(process.platform === 'darwin' && process.arch === 'arm64')` (or an equivalent `describe.runIf`). Keep all-host coverage in the existing build-target and capability/refusal tests; do not try to compile a Darwin dynamic library on unsupported hosts.

## Verification

- `npm exec vitest run tests/unit/build-native-addon.test.ts tests/unit/native-exchange-capability.test.ts` — passed: 2 files, 4 tests.
- `node_modules/.bin/vitest run tests/package/agent-ready-export.test.ts -t "runs packed re-export as"` — passed: 1 file, 3 target-policy cases; the full package-evidence test was intentionally skipped.
- Static target-policy inspection: reconciliation declares only `darwin-arm64` with `observedNativeExchange`; `scripts/build-native-addon.mjs` removes the add-on on all other targets.
- Static re-review of `8179e3b`: target-aware E2E assertions cover exported native re-export on Darwin/arm64 and typed refusal plus stable-byte preservation elsewhere; package evidence validates the corresponding target and result algebra.

---

_Reviewed: 2026-07-23T22:23:01Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
