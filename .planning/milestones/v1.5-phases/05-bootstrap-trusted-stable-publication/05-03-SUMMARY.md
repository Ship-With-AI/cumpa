---
phase: 05-bootstrap-trusted-stable-publication
plan: 03
subsystem: distribution
tags: [github-actions, oidc, npm, release-policy]
requires:
  - phase: 04-exact-runtime-tarball
    provides: Existing artifact custody and acceptance contracts
depends_on: [05-01, 05-02]
provides:
  - Input-free same-run Darwin ARM64 candidate and protected Linux publisher workflow
  - Updated operative publication policy with separate source/configuration/artifact/publication gates
  - Resolved local source-review blockers and recorded security scope
affects: [05-04, 05-05, 05-06]
tech-stack:
  added: []
  patterns: [Source authorization before checkout, Sealed native-artifact handoff, Protected isolated OIDC publication]
key-files:
  created:
    - .github/workflows/publish-npm.yml
    - .planning/phases/05-bootstrap-trusted-stable-publication/05-REVIEW.md
  modified:
    - docs/distribution-operations.md
    - scripts/verify-npm-release.mjs
    - tests/package/npm-release-verifier.test.ts
key-decisions:
  - Only producer/scanner/acceptance steps receive the transient masked origin; only npm-release receives id-token write permission.
  - The native artifact handoff and independent inner hashes bind one candidate to the same top-level workflow run and attempt.
  - Local verification never dispatches a workflow or substitutes for an actual artifact/publication authorization.
requirements-completed: []
requirements-progress: [REL-02]
completed: 2026-09-09
status: complete
---

# 05-03 — Gated workflow and operative policy

The local source now defines the complete fixed candidate-to-publisher mechanism; no remote execution has occurred.

## Commits

- `146d9da` — Task 1: input-free workflow, source-first admission, one Darwin ARM64 candidate build/pack, complete checks, sealed read-only upload, exact-ID download and separately protected isolated OIDC publication.
- `4998997` — Task 2: replace obsolete forward-looking Phase 5 policy while retaining Phase 3/4 history and legacy artifact dispositions.
- `bad28f7` — Integration repair: align CI sealing with the actual producer's clean-diff fingerprint and the actual acceptance report's required stable profile.

## Workflow contract

- `workflow_dispatch` only; fixed noncanceling `cumpa-npm-stable-1.5.0` concurrency group.
- Candidate: `macos-15`, `production`, contents-read only, 45-minute limit, source guard before checkout/install/origin use, Node 24/npm 11.19.1, no dependency cache, one producer invocation, Chromium and full installed acceptance, one native artifact upload.
- Only three candidate steps map the masked origin. The authoritative production variable is not embedded in workflow source, local configuration or evidence.
- Outputs: native artifact ID/digest plus independent archive SHA-256/length and evidence SHA-256.
- Publisher: same run, `ubuntu-24.04`, protected `npm-release`, the sole `id-token: write`, 15-minute limit, no project dependency install/build/pack/full scanner/origin.
- Download by exact artifact ID with `merge-multiple: true`; the pinned download action's digest-mismatch default is `error`. Check the two expected payload files and independently compare archive hash/length, then invoke the stdlib-only prepublish verifier.
- One absolute-archive `npm publish` with explicit latest/public/ignore-scripts/fetch-retries=0/fixed-registry arguments, from private outside-checkout HOME/cache/prefix and distinct empty configs. Static npm auth/config is stripped while actual OIDC context is retained.

## Observed local verification

- All four full action SHAs matched their official release tags. GitHub's runner reference identifies `macos-15` as ARM64; the pinned download action declares the used ID/merge inputs and fails digest mismatch by default.
- YAML language-server diagnostics: **OK**. Parsed workflow checks confirmed the exact trigger/jobs/permissions/concurrency and three candidate-only origin mappings.
- All **13 shell run blocks** passed shell syntax checking; embedded Node blocks passed Node syntax checking.
- Local synthetic source-admission smoke covered missing, mismatched, malformed and matching authorization values.
- Actual hash/read-only code produced independently matching fixture identities; download admission accepted unchanged bytes and rejected substituted bytes and wrong length.
- The publication launcher was executed in a Node VM with its external mutation boundary blocked: **zero npm invocations**. The probe observed one exact intended call, private empty configs, static-auth removal, OIDC preservation, exact archive/no-script/no-retry arguments and owned scratch cleanup. This is not a real publication test.
- Full unconfigured local build and web typecheck passed. Vite reported the >500 kB chunk warning; no warning suppression or unrelated bundling change was made.
- Full ordinary Vitest suite passed **58 files / 463 tests** before the two evidence-shape integration repairs. After those narrow repairs, the affected verifier suite passed **21/21** and strict TypeScript checking passed again. Bootstrap producer/verifier **17/17** and acceptance-schema **2/2** had already passed with strict harness checks.
- `actionlint` is not installed; no tool/dependency was installed to add it. Native YAML diagnostics, parsed policy checks and executable local smoke were used instead.

## Review and repairs

Independent source review and a separate read-only security review both found two deterministic fail-closed handoff blockers: the real producer hashes JSON.stringify([index, working]), not an empty string, and the real acceptance aggregator emits profile=stable. Main corrected the fixtures to those real shapes, observed the source rejection, fixed it, observed the acceptance rejection, then required/preserved the exact stable profile. Both are resolved in `bad28f7`; the scoped review records zero remaining open findings.

The security reviewer reported no evidence-backed exploitable vulnerability within the local 05-01/02/03 threat model. This does not close the later operational security gates or claim real npm cryptography, hosted protection, token revocation or publication success.

## Next boundary

05-04 may now perform bounded local source review and one real configured bootstrap preparation from clean reviewed P/T. Source push, authentication, hosted configuration, CI dispatch/upload, artifact approval and publication remain separately unauthorized. The Supabase workflow, source package/lock, approved legal files and historical Phase 4 artifact/evidence remain unchanged.
