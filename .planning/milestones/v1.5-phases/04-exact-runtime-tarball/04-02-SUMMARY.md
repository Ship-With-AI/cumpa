---
phase: 04-exact-runtime-tarball
plan: 02
subsystem: packaging
tags: [archive-verification, npm, deployment, isolation]
requires:
  - phase: 04-exact-runtime-tarball
    plan: 01
    provides: Explicit producer and immutable archive evidence
provides:
  - Non-producing supplied-archive verifier with bounded JSON results
  - Exact archive identity and protected extraction/inventory checks
  - Explicit disposable artifact flow for every live scanner caller
affects: [04-03, 04-04]
tech-stack:
  added: []
  patterns: [Trusted-producer archive verification, syntax-aware asset discovery, environment-only origin]
key-files:
  created: [tests/package/runtime-artifact-verifier.test.ts]
  modified: [scripts/verify-production-artifacts.mjs, scripts/verify-supabase-support.mjs, .github/workflows/deploy-supabase-production.yml, tests/e2e/package-assets.spec.ts, tests/e2e/support-payment.spec.ts, tests/e2e/anchored-review.spec.ts, tests/e2e/complete-review-draft.spec.ts, docs/distribution-operations.md, docs/support-service-operations.md]
key-decisions:
  - Use Vue's already-installed compiler parser for JavaScript asset references rather than matching compiler strings with regular expressions.
  - Compare extracted permission modes after the protective 077 umask while preserving owner execute checks.
  - Keep configured deployment artifacts disposable and upload only Supabase deployment evidence.
requirements-completed: [PKG-04, PKG-05, REL-03]
duration: not separately timed
completed: 2026-09-08
status: complete
---

# Phase 04 Plan 02: Verify supplied bytes and migrate callers

**Verification consumes one existing archive and never builds, repacks or mutates it; local/deployment callers explicitly produce the disposable bytes they verify.**

## Task Commits

1. Supplied-archive verifier and behavioral tests — `dd71273`.
2. Deployment and local caller migration — `60efa5e`.
3. Remaining browser callers, local evidence fixture cutover and bounded failure diagnostics — `4ffcc42`.

## Verification

- Six focused verifier tests passed: independent hash/length/basename failures, CLI rejection without package-tool side effects, post-extraction content substitution, candidate stage enrichment, configured-origin enforcement and missing static template asset references.
- Actual unconfigured producer archive verified unchanged: 144 files, 14,747,954 extracted bytes and 95 reachable browser assets, including all five Monaco workers and codicon. Native binary presence/digest matched the declared Darwin ARM64 build.
- Real `--retirement-review` passed with configured absence and disposable cleanup.
- Actual workflow verifier passed. No workflow was dispatched.
- The full `--local-package-security-review` passed all 12 commands: ordinary Vitest, support Playwright, Deno and two complete local database reset/test/migration/lint cycles. The record is configured-absent; no hosted provider credentials were supplied.
- Both remaining ordinary browser caller suites passed: 10 anchored-review and complete-draft tests using explicit development-check archives.
- Schema-drift and UI-safety gates did not block; this plan changes no application UI.

## Implementation and bounded evidence

The verifier accepts only absolute archive/evidence paths plus expected SHA-256. It independently checks SHA-256, npm SHA-1, SHA-512 SRI and length, then uses protected temporary extraction and full npm/dist inventory parity. It validates runtime metadata/dependencies, reviewed legal bytes, emitted asset graph, native target and exact generated support assignment. Success is one `cumpa.runtime-artifact-verification/v1` JSON result with logical labels, digests/counts and limits; archive/evidence are not modified.

Retirement/local security use one unconfigured development-check producer. The deployment release block uses one configured deployment-check producer and the same environment-only origin for the scanner. Only `supabase-deployment-evidence.json` is uploaded. The transparent package verifier alias has no defaults.

## Deviations and integration corrections

- The full local-security command depended on Plan 04-03's candidate-runner exclusion. Its final verification was therefore performed after that exclusion was integrated, rather than attempting the old candidate suite without inputs.
- Native tar applies umask 077 to extracted files. Real extraction demonstrated 0755 becoming 0700 and 0644 becoming 0600; comparisons now account for that protection rather than rejecting correct archives.
- Regex-only JavaScript scanning misread compiler strings and missed Vite template-literal worker URLs. The existing `vue/compiler-sfc` Babel parser now walks real import/export/URL syntax; no dependency was added.
- Isolated scanner fixtures replaced tests that rebuilt the checkout or required a clean main tree. Static native fixture bytes are not represented as native capability observations; actual installed observation belongs to Plan 04-03.
- The retirement classifier previously treated documented empty Stripe key prefixes as credentials. It now requires a terminal alphanumeric payload boundary; the real retirement gate passes without excluding planning documents from credential scanning.
- A whole-repository caller search found two ordinary browser suites outside the initial file list. Both were migrated to explicit producer/verifier inputs; no no-argument compatibility path was retained.
- Local gate integration removed the obsolete browser config path/candidate spec, migrated the old redundant build/scanner command-record fixture, and removed one brittle error-wording assertion while retaining rejection coverage.
- Validation was centralized after parallel edits; no full pre-implementation RED-commit sequence is claimed.

## Limits and Next Steps

The scanner assumes trusted local producer output and bounded signatures, not arbitrary hostile tar safety or exhaustive secret detection. No publication, source push, runtime upload, provenance or public-source alignment is claimed. Final configured artifact creation, installed acceptance, read-only custody and human approval remain separate Plan 04-04 gates.

## Self-Check: PASSED

Verifier behavior, real archive inspection, every migrated caller class and the full credential-free local gate passed. Plan 04-03's final installed aggregation and Plan 04-04's actual-origin approval remain separate work.
