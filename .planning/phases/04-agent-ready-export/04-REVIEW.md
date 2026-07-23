---
phase: 04-agent-ready-export
reviewed: 2026-07-23T22:06:20Z
depth: deep
files_reviewed: 17
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
  - tests/helpers/export-fault-runner.ts
  - tests/package/agent-ready-export-safety.test.ts
  - tests/package/agent-ready-export.test.ts
  - tests/unit/build-native-addon.test.ts
  - tests/unit/directory-exchange.test.ts
  - tests/unit/native-exchange-capability.test.ts
findings:
  critical: 0
  warning: 2
  info: 0
  total: 2
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-07-23T22:06:20Z
**Depth:** deep
**Files Reviewed:** 17
**Status:** issues_found

## Summary

Reviewed the production native-exchange capability path from add-on build/load/probe through publication, the packed tarball re-export journey, and the scripts that build shared `dist/` artifacts. The observer correctly loads and probes the add-on only after probe-directory creation and fails closed on setup and cleanup errors. The serialized safety runner builds before its read-only safety suite, and the packed Darwin/arm64 journey exercises the add-on from the tarball.

However, the declared native target is only `darwin-arm64`; two unguarded tests still make that target-specific compiler/re-export proof a mandatory cross-platform default. On every other host the production build deliberately removes the add-on and the capability correctly returns `reExportUnsupported`, so the default suite fails instead of proving that refusal contract.

## Warnings

### WR-01: Native compiler probe is not gated to its declared target

**File:** `tests/unit/directory-exchange.test.ts:22-31, 43-51`

**Issue:** `buildAddon()` always invokes `/usr/bin/c++` with Darwin-only `-dynamiclib` and `-undefined dynamic_lookup` flags, before the test's `process.platform` branch can assert an unsupported result. Therefore a non-Darwin unit-suite run fails at compilation rather than exercising a supported skip/refusal path. It also runs on Darwin/x64 despite the ledger declaring only Darwin/arm64 as an observed native target. This contradicts the portable real-compiler-test contract.

**Fix:** Gate this real add-on compile/probe test with `test.runIf(process.platform === 'darwin' && process.arch === 'arm64')` (or an equivalent `describe.runIf`). Keep all-host coverage in the existing build-target and capability/refusal tests; do not try to compile a Darwin dynamic library on unsupported hosts.

### WR-02: Packed default test requires native re-export on targets intentionally marked unsupported

**File:** `tests/e2e/agent-ready-export.spec.ts:193-196, 214, 271-275`; `tests/package/agent-ready-export.test.ts:12, 78`

**Issue:** The E2E `beforeAll` builds and packs on every host, but its sole packaged acceptance test unconditionally rejects `reExportUnsupported` and requires an exported native receipt. The package evidence test unconditionally launches that E2E suite. Outside the ledger's sole `darwin-arm64` target, `scripts/build-native-addon.mjs` correctly omits the add-on and the production observer correctly fails closed, so `npm run test:package` and the package evidence test fail by demanding a capability the policy explicitly disallows.

**Fix:** Make the packed re-export-success journey and its success-only evidence target-aware: run the native complete-pair re-export assertion only on Darwin/arm64. On every other host, retain a packed-package journey that performs first export, expects typed `reExportUnsupported` for the second export, and verifies the old stable pair remains unchanged. The package evidence runner must select and validate the matching target-specific result instead of requiring a native-success report everywhere.

## Verification

- `npm exec vitest run tests/unit/build-native-addon.test.ts tests/unit/native-exchange-capability.test.ts` — passed: 2 files, 4 tests.
- Static target-policy inspection: reconciliation declares only `darwin-arm64` with `observedNativeExchange`; `scripts/build-native-addon.mjs` removes the add-on on all other targets.
- Traced `getObservedNativeExchangeCapability()` through `src/server/capabilities.ts` and `src/server/export-store.ts`: setup, add-on load/probe, and cleanup failures return typed `reExportUnsupported` before a stable re-export exchange.

---

_Reviewed: 2026-07-23T22:06:20Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
