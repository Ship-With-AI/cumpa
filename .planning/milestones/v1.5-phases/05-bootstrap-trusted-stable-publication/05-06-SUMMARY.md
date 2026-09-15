---
phase: 05-bootstrap-trusted-stable-publication
plan: 06
subsystem: distribution
tags: [npm, oidc, provenance, public-consumers, immutable-release]
requires:
  - phase: 04-exact-runtime-tarball
    provides: Exact runtime archive and acceptance contracts
depends_on: [05-05]
provides:
  - Public byte-identical trusted-publisher release of @shipwithai/cumpa@1.5.0
  - npm-verified attestation cryptography and exact source/run/attempt claims
  - Normal scripts-enabled global installation and independent literal npx proof
  - Bounded canonical release evidence with completed owned cleanup
affects: [06, 07]
tech-stack:
  added: []
  patterns: [One irreversible publication attempt, Read-only visibility reconciliation, Independent public-byte and cryptographic verification]
key-files:
  created:
    - .planning/phases/05-bootstrap-trusted-stable-publication/05-RELEASE-EVIDENCE.json
  modified: []
key-decisions:
  - Exact candidate approval did not authorize publication; a separate full actual-value stable statement preceded the one native deployment approval.
  - Initial registry absence did not trigger republishing or a workflow rerun; only read-only reconciliation and verification were repeated.
  - Supplement the fixed verifier's scripts-disabled global check with a real normal scripts-enabled global install, without changing approved source or candidate bytes.
requirements-completed: [PKG-01, PKG-02, REL-02]
duration: 31min
completed: 2026-09-10
status: complete
---

# Phase 5 Plan 06: Verified Trusted Stable Publication

**The exact approved CI candidate is public as `@shipwithai/cumpa@1.5.0`, with verified registry bytes, npm-validated provenance and clean global/npx execution after one publish attempt.**

## Actual authority and execution

The owner supplied the complete `AUTHORIZE STABLE PUBLICATION` statement. Original line wrapping is preserved in the canonical evidence; only whitespace was normalized for binding comparison. Current read-only checks verified the approved archive/evidence/transport, source, run/attempt, native artifact, waiting publisher job, current reviewer ability, environment protections, stable vacancy, owned cleanup and remaining validity.

- Authority recorded: `2026-09-10T15:16:15Z`.
- Stable authority SHA-256: `98ba4c9427acbd07a7fe6804107dde2ec16e020db7dc96a023860be453b0eecf`.
- Candidate approval SHA-256: `866598a581710953d75b90b8e60fcc321defb5317c31e0f8cbb05a6aef714f13`.
- Exactly one native pending-deployment approval targeted `npm-release` / `21638471478` for run `34490078365`, attempt `1`, publisher job `102915021477`. Native deployment ID: `6374161747`.
- The protected job revalidated the exact downloaded artifact and sealed evidence, then executed the one direct OIDC `npm publish` command with an absolute supplied tgz, `latest`, public access, `--ignore-scripts` and `--fetch-retries=0`.
- Candidate production and publication remained in the same top-level run and attempt. No local publish, source change, rebuild, repack, fallback, second publish command or workflow rerun occurred.

## Exact public result

| Binding | Verified value |
|---|---|
| Package | `@shipwithai/cumpa@1.5.0` |
| Public registry publication timestamp | `2026-09-10T15:27:53.362Z` |
| Source | `fcc12be291623c37211291681420fe0203df6cb0` |
| Run / attempt | `34490078365` / `1` |
| Artifact | `10157421286` |
| Artifact transport SHA-256 | `b6af207adbe4a0f1b1873a0e284986d0e4dc86ee163dbb388a3f6685578ea2d9` |
| Sealed evidence SHA-256 | `b7fe676a35c40cbd03a8d73bbb7bc83c5a4893d6aa7d01d1ab60799af3ff1091` |
| Archive bytes | `3514800` |
| Archive SHA-256 | `dc8f792920833415d309015d5f4c31501016e9a4a6cc945bb69dde2453137141` |
| npm SHA-1 | `2d58866c862283f2c41b3f4f7d51282b2ca96472` |
| npm SHA-512 SRI | `sha512-gUBrMYwL8u75k1JX1OxO2dwfUsjQGHAqPUjh8e5Ep6gVs52wwEZFwkl49fBU2eggU9S7J1r27SCa8W1X/iHn5g==` |
| Canonical release evidence SHA-256 | `95863383e21642a05e7666fb675c10da6315beaf43a52b2b720b473bdac3225d` |

`latest` now points to `1.5.0`; `bootstrap` remains `1.5.0-bootstrap.0`. The D-10 temporary latest condition ended through the separately authorized stable publication, not a tag workaround. Public metadata identifies the MIT license, Node `>=24` requirement and generated `cumpa` bin.

## Public verification

The actual `verify-public` command passed with isolated npm `11.19.1`:

- Exact public metadata and downloaded tarball matched approved byte length, SHA-256, npm SHA-1 and SHA-512 integrity.
- The audit consumer actually installed the exact package and matching lock entry before `npm audit signatures --json --include-attestations` exited successfully.
- npm's verified bundle passed all 12 decoded policy comparisons: exact package subject/SHA-512, GitHub repository and IDs, workflow path/ref, source commit, `workflow_dispatch`, GitHub-hosted runner and run/attempt invocation identity.
- The verifier's isolated generated global bin and independent npx consumer returned `1.5.0`; their temporary roots were removed.

A separate fresh credential-free consumer then performed a normal global install with scripts enabled and verified the generated executable was contained in the exact installed package and returned `1.5.0`. Another independent empty-context consumer executed the literal `npx --yes @shipwithai/cumpa@1.5.0 --version` and returned `1.5.0`. No global/cache/local-tarball fallback was used. Both roots and the pinned verification toolchain were removed.

## Visibility gap and honest reconciliation

The CI publish step exited successfully and logged the package version plus a provenance transparency notice, but initial exact registry endpoints, valid packument, direct tarball and native npm view still reported absence. No retry, staging approval, account change or second publish occurred. Later public website and native registry reads exposed the exact version; the full verifier then passed.

This is recorded as an observed public-visibility gap, not an established quarantine, staging or backend-processing explanation. A transparency notice or CLI success was never substituted for public-byte or cryptographic proof.

## Cleanup and preservation

Both temporary production transports remain absent and the authoritative origin fingerprint is unchanged. The publisher removed its isolated npm state; all owned local consumer/toolchain roots and the dedicated public npm inspection tab were removed. Existing user authentication and unrelated tabs were preserved. Approved candidate custody remains read-only.

The Phase 4 archive/evidence/approval, original bootstrap records, prior failed candidate cycles, frozen guards, legal grants and retained legacy artifacts remain unchanged. No retrospective provenance or all-platform native claim is made. Native acceptance remains Darwin ARM64 with the documented fallback elsewhere; full public browser acceptance remains Phase 7 scope.

## Commits and readiness

Canonical evidence was committed in `cee096ecc95e61951bcf11114d74708d9812d33a`. This summary and final phase review records are local bookkeeping, not an additional source push.

PKG-01, PKG-02 and REL-02 now have actual public proof and completed requirement tracking. All six plans and final Phase 5 gates passed: clean 13-file source review, 59/59 authored threats closed, 39/39 must-haves verified, 58 files/463 regression tests passed, and two TDD plans with no violations. UI review is not applicable because no production frontend surface changed. Canonical phase completion returned no warnings. Phase 6 remains unstarted; no further publication action is authorized or needed.
