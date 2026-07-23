---
phase: 04-agent-ready-export
reviewed: 2026-07-23T21:29:52Z
depth: standard
files_reviewed: 52
files_reviewed_list:
  - binding.gyp
  - package.json
  - playwright.config.ts
  - scripts/build-native-addon.mjs
  - src/contracts/api.ts
  - src/contracts/draft.ts
  - src/export/render-review-markdown.ts
  - src/export/review-export.ts
  - src/git/comparison.ts
  - src/git/ignore-status.ts
  - src/git/inventory.ts
  - src/native/directory-exchange.cc
  - src/server/app.ts
  - src/server/capabilities.ts
  - src/server/export-store.ts
  - src/server/gitignore-capability.ts
  - src/server/native-exchange-capability.ts
  - src/server/routes.ts
  - src/web/App.vue
  - src/web/api/client.ts
  - src/web/components/DriftExportAcknowledgement.vue
  - src/web/components/ExportProgress.vue
  - src/web/components/ExportReadinessSummary.vue
  - src/web/components/ExportReceipt.vue
  - src/web/components/ExportSection.vue
  - src/web/components/GitignoreStatus.vue
  - src/web/components/ReceiptFileRow.vue
  - src/web/components/ReviewPanel.vue
  - src/web/model/review-draft-state.ts
  - src/web/styles.css
  - tests/api/export-publication.test.ts
  - tests/api/export.test.ts
  - tests/api/gitignore.test.ts
  - tests/e2e/agent-ready-export-safety.spec.ts
  - tests/e2e/agent-ready-export.spec.ts
  - tests/e2e/anchored-review.spec.ts
  - tests/e2e/complete-review-draft.spec.ts
  - tests/e2e/review-panel-resolved.spec.ts
  - tests/git/ignore-status.test.ts
  - tests/git/inventory.test.ts
  - tests/helpers/export-fault-runner.ts
  - tests/helpers/git-fixture.ts
  - tests/helpers/source-control-snapshot.ts
  - tests/integration/agent-ready-export-states.spec.ts
  - tests/integration/export-receipt-ui.spec.ts
  - tests/package/agent-ready-export-safety.test.ts
  - tests/package/agent-ready-export.test.ts
  - tests/unit/agent-ready-export-state.test.ts
  - tests/unit/directory-exchange.test.ts
  - tests/unit/review-export.test.ts
  - tests/unit/review-markdown.test.ts
  - vitest.config.ts
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
status: issues_found
---

# Phase 04: Code Review Report

## Scope

Reviewed all Phase 04 source, configuration, and test changes, including the
verifier-gap remediation commits `4023bdf`, `be3148e`, `e11f2eb`, and
`cf06c75`. This pass traced the native build/package path, packaged-relative
loader, behavioural probe, capability wiring, failure fallback, directory
exchange flow, and packed CLI/browser re-export evidence.

## Summary

The remediation wires the packaged server to an add-on located relative to the
compiled server module, probes it once before publishing, and passes the
observed capability into the established directory-exchange publication path.
The focused packed CLI/browser test exercises an actual re-export and passed.

Two failures remain in the native capability boundary: the build is not gated
for platforms on which the native operation is intentionally unsupported, and
probe setup/cleanup failures escape rather than producing the documented
fail-closed capability.

## Narrative Findings (AI reviewer)

The native add-on's `exchangeDirectories` interface limits stable and candidate
to child names, opens the root with `O_NOFOLLOW`, and returns a typed outcome.
The server-side loader is correctly relative to `dist/server`, so
`../native/directory_exchange.node` resolves to the packaged `dist/native`
artifact. A successful packed Chromium run proves that the supported Darwin
path can rebuild, package, load, probe, atomically re-export, and recover the
new pair.

That success path does not establish the required unsupported-platform or
operational-failure fallback paths, which contain the following defects.

## Critical Issues

### CR-01: Native build prevents the intended unsupported-platform fallback

**File:** `scripts/build-native-addon.mjs:7-21`; `package.json:1`

`build:runtime` always invokes `/usr/bin/c++` with the Darwin linker arguments
`-dynamiclib` and `-undefined dynamic_lookup`. There is no
`process.platform`/architecture gate. [INFERENCE] On a non-Darwin build host,
these Darwin-only options fail the package build before the add-on's
non-Apple `unsupported` result or the JavaScript loader's fallback can run.
This makes the npm package unbuildable on platforms that the native source and
capability model otherwise describe as fail-closed unsupported.

Gate the add-on build to its supported platform and architecture; on unsupported
build hosts, remove or avoid packaging an incompatible stale `.node` artifact
and allow the JavaScript loader to return `reExportUnsupported`. Add a
non-Darwin build/package coverage path, or make the build script's platform
branch directly testable.

## Warnings

### WR-01: Probe filesystem failures reject export instead of failing closed

**File:** `src/server/native-exchange-capability.ts:20-35`

`mkdtemp()` executes before the `try`, and `rm()` in `finally` is awaited
without its own error handling. If either operation fails, the cached
`getObservedNativeExchangeCapability()` promise rejects. The caller awaits that
promise inside `exportReview`, so the export request rejects rather than
returning the declared `reExportUnsupported` capability result. This also
blocks a first export, which does not need native exchange at all.

Place probe-root creation inside the failure-to-unsupported boundary and ensure
cleanup errors cannot override the probe outcome. The function should resolve
`{ kind: 'reExportUnsupported' }` for every probe setup, load, invocation, or
cleanup failure. Add focused mocks for failed `mkdtemp` and `rm`.

## Accepted Residual / Threat-Boundary Note

The completed export publication sequence revalidates its path-based identity
at the defined checkpoints. As explicitly accepted for this phase, it does not
attempt descriptor-level protection against a malicious same-UID process
replacing a destination between those checks; the packaged release has no
native target providing that stronger guarantee.

**Remediation update (native runtime):** The declared `darwin-arm64` package target now builds and packages the narrow addon, and `createNativeExchangeCapabilityObserver` returns `reExportUnsupported` rather than rejecting or granting capability if temporary-directory setup, load, probe, or cleanup fails. The build script removes a stale addon and exits successfully for any non-declared platform/architecture. These corrections provide exchange capability and fail-closed fallback; they do not change the accepted descriptor-level parent-replacement residual described above.

## Verification

- `npm exec playwright test tests/e2e/agent-ready-export.spec.ts` — passed:
  1 packed Chromium CLI/browser re-export test.
