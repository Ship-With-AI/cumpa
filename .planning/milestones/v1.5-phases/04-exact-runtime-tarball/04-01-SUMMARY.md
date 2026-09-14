---
phase: 04-exact-runtime-tarball
plan: 01
subsystem: packaging
tags: [npm, runtime, immutable-artifact, prerequisites]
requires:
  - phase: 03-distribution-contract-legal-boundary
    provides: Approved MIT text and package identity
provides:
  - Runtime/legal-only publishable manifest and metadata-backed CLI version
  - Strict full direct-dependency prerequisite gate
  - Purpose-aware one-build one-pack producer with immutable archive evidence
affects: [04-02, 04-03, 04-04]
tech-stack:
  added: []
  patterns: [Explicit archive custody, independent algorithm identities, source-index drift binding]
key-files:
  created: [scripts/pack-runtime.mjs, tests/package/runtime-package-contract.test.ts, tests/package/runtime-producer.test.ts]
  modified: [package.json, src/cli/run.ts, scripts/verify-prerequisites.mjs, docs/distribution-operations.md]
key-decisions:
  - Producer tests use a separate file to avoid concurrent mutation of contract tests.
  - Main owns validation and atomic commits; independent implementation agents run no validations.
requirements-completed: [PKG-03, PKG-04, PKG-05, REL-03]
duration: 25min
completed: 2026-09-08
status: complete
---

# Phase 04 Plan 01: Runtime contract and candidate producer

**One explicit producer creates a runtime-only archive with source, build, legal, native and algorithm-specific identity; CLI version comes from the installed manifest.**

## Task Commits

1. Package contract and metadata-backed version — `9e897e2`.
2. Exact prerequisite allowlist — `aa90645`.
3. Purpose-aware producer and operations documentation — `4105481`.

## Verification

- `npm run build:runtime` passed.
- Initial focused contract/producer suite: 11 tests passed.
- Added regressions exposed compiler source-map string rejection and staged changes cancelled by working-tree bytes: 2 tests failed before correction.
- Final `npx vitest run tests/package/runtime-package-contract.test.ts tests/package/runtime-producer.test.ts --no-file-parallelism`: 13 tests passed.
- Real checkout prerequisite command passed with Node v24.15.0, Git available, and 18 approved exact releases.
- Actual built CLI invoked outside any repository printed `1.5.0` and exited successfully.
- Actual unconfigured development-check producer completed one build and one real pack: `shipwithai-cumpa-1.5.0.tgz`, 3,513,652 bytes, 140 dist members, npm 11.12.1, Darwin ARM64 native binary present. Disposable smoke identity is not the final candidate or approval.
- Approved LICENSE and reviewed THIRD_PARTY_NOTICES digests match; the full Monaco upstream notice remains included. The current lockfile differs from the rights-reviewed lock only in root package name/version/license metadata; the complete non-root dependency inventory is unchanged. Final emitted-content reconciliation remains Plan 04-04.

## Evidence Interface

`cumpa.runtime-artifact-evidence/v1` contains `purpose`, stage `status`, `package.{name,version,runtimeDependencies}`, `archive.{basename,byteLength,sha256,npmShasumSha1,npmIntegritySha512,files}`, `source.{repository,head,tree,clean,trackedDiffSha256,inputsSha256,packageJsonSha256,packageLockSha256}`, `build.{configured,node,npm,git,os,platform,arch,napi,compiler}`, `contents.dist.{files,sha256}`, `legal`, `native`, and bounded `support`.

Inventory members carry paths, modes, byte lengths and SHA-256; npm members carry path/size/mode. `inputsSha256` also binds untracked build inputs observed during the closed lstat walk. Tracked index and working diffs are fingerprinted separately so cancellation cannot claim clean source. Support cleartext is environment-only; evidence does not retain custody paths.

## Deviations from Plan

- Split producer tests into `runtime-producer.test.ts` to give concurrent implementations disjoint ownership.
- Validation and commits were centralized after concurrent edits. The original tests did not receive pre-implementation RED commits; do not claim a complete RED-commit sequence. The two integration regressions were observed failing before their fixes, then passing.
- Real smoke exposed a false positive in TypeScript worker code that writes a source-map directive as a string. The bounded scan now recognizes emitted line directives and source-content array payloads rather than every compiler string mentioning the syntax.
- Integration strengthened staged/unstaged cancellation detection, build-input drift detection, exact output inventory parity and actual npm version capture. Added regressions cover cancellation and unexpected npm inventory members.
- Updated existing distribution operations documentation after smoke verification to remove the obsolete private/skill-allowlist instructions.

## Limits and Next Steps

No remote mutation, source push, upload, npm publication or provenance claim occurred. Plan 04-02 must verify the supplied archive; Plan 04-03 must prove installed behavior; Plan 04-04 must produce a fresh clean configured candidate and obtain digest-bound human approval. Requirement IDs above identify this plan's coverage, not completed phase-level acceptance.

The protected support origin is absent from the current executor environment and no documented local environment file was found. If still unavailable at final candidate production, use the plan's human input gate; never invent an origin or read a remote provider to bypass that gate.

## Self-Check: PASSED

All three task implementations are committed; focused tests and actual CLI/producer smoke passed. Final candidate and installed acceptance remain intentionally unperformed in this plan.
