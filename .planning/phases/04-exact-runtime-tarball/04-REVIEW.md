---
phase: 04-exact-runtime-tarball
reviewed: 2026-09-08T20:25:53Z
depth: standard
baseline: 17dbecf
files_reviewed: 23
files_reviewed_list:
  - package.json
  - src/cli/run.ts
  - scripts/verify-prerequisites.mjs
  - scripts/pack-runtime.mjs
  - scripts/verify-production-artifacts.mjs
  - scripts/verify-supabase-support.mjs
  - .github/workflows/deploy-supabase-production.yml
  - tests/helpers/runtime-artifact.ts
  - tests/package/runtime-package-contract.test.ts
  - tests/package/runtime-producer.test.ts
  - tests/package/runtime-artifact-verifier.test.ts
  - tests/package/agent-ready-export.test.ts
  - tests/e2e/package-assets.spec.ts
  - tests/e2e/agent-ready-export.spec.ts
  - tests/e2e/anchored-review.spec.ts
  - tests/e2e/complete-review-draft.spec.ts
  - tests/e2e/support-payment.spec.ts
  - vitest.config.ts
  - vitest.runtime-artifact.config.ts
  - playwright.config.ts
  - playwright.runtime-artifact.config.ts
  - docs/distribution-operations.md
  - docs/support-service-operations.md
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Phase 04: Code Review Report

**Reviewed baseline:** `17dbecf` plus current uncommitted scoped changes
**Depth:** standard
**Files reviewed:** 23
**Status:** clean

## Summary

Reviewed the producer → supplied-archive verifier → isolated npm installation → dedicated browser/Finish aggregation flow, live producer and verifier callers, ordinary-runner exclusions, and the deployment/local-security caller cutover.

The producer rebuilds a clean package output: `npm run build` starts `build:runtime`, which starts `build:bin`; `scripts/build-bin.mjs` recursively removes `dist` before TypeScript, native, and Vite outputs are written. The stale-`dist` contamination path is therefore not present in the reviewed build order.

The supplied-archive scanner is restricted to trusted locally produced, hash-bound evidence, performs no build or pack action, binds independent archive identities, checks complete packaged/dist inventory and reachable browser assets, and keeps configured-origin evidence redacted. The candidate-only aggregator remains excluded from ordinary Vitest and Playwright discovery. The configured deployment check remains disposable and uploads only deployment evidence.

The Windows command-shim concern identified during review was corrected before this report: generated `.cmd` bins are executed through `cmd.exe` for version/help coverage, while guarded Node launches use the installed manifest entrypoint on Windows. The three guarded callers now use that platform-aware entrypoint.

## Review Boundary

The independent code review preceded Plan 04-04's final cycle. Main subsequently produced and verified the real GitHub-configured archive and read-only custody; final evidence records that work. Digest-bound human approval remains absent and is not inferred from source review or automated acceptance.

## Verification Limitation

Per assignment constraints, this review performed no tests, builds, linters, formatters, archive production, deployment actions, source edits, commits, or remote actions. Orchestrator-reported validation is not independent reviewer verification.

---

_Reviewer: gsd-code-reviewer_

## Post-review integration verification — Main

Installed testing exposed an additional runtime defect after the independent source review: exact-patch added/deleted files carried explicit `undefined` optional path fields into the strict canonical encoder. Main reviewed the grounding/snapshot/export flow and fixed the construction in `src/git/exact-patch.ts` using the existing conditional-property pattern. Canonical validation was not relaxed.

`tests/api/exact-patch.test.ts` reproduces the actual 500 before the fix and 201/canonical V3 delivery afterward. The related 29-test suite, strict acceptance-harness TypeScript check, and full seven-scenario installed acceptance passed. These two files are Main's additional integration scope, not an assertion that the independent reviewer examined them originally. Existing GitHub configuration has since resolved the input gate; attributable artifact approval remains open.

## Final artifact notice reconciliation — Main

Before the final build, Main retained four build-generated helper attributions from the installed Vite/Rolldown MIT licenses and Rolldown 1.1.5's upstream Rollup/esbuild notices. Existing grant text and Monaco's complete upstream notice were preserved; the approved Cumpa MIT LICENSE did not change. The real archive passed its scanner and full installed acceptance after this additive notice update. `04-ARTIFACT-EVIDENCE.json` records the exact legal/source/archive identities; this is not a new independent legal certification.
