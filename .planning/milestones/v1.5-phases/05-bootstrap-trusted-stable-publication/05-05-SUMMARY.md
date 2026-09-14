---
phase: 05-bootstrap-trusted-stable-publication
plan: 05
subsystem: distribution
tags: [github-actions, npm, trusted-publishing, immutable-candidate, guarded-cleanup]
requires:
  - phase: 04-exact-runtime-tarball
    provides: Immutable archive, scanner and installed-acceptance contracts
depends_on: [05-04]
provides:
  - Exact protected trusted-publisher setup with documented assurance levels
  - Successful repaired-source CI candidate from one run and attempt
  - Verified removal of owned temporary production transports
  - Attributable approval of exact read-only candidate bytes without publication authority
affects: [05-06]
tech-stack:
  added: []
  patterns: [Separate source and candidate authorities, Owned recoverable CI transports, Actual startup-response synchronization]
key-files:
  created:
    - .planning/phases/05-bootstrap-trusted-stable-publication/05-CI-ARTIFACT-APPROVAL.md
    - .planning/phases/05-bootstrap-trusted-stable-publication/05-REPAIRED-SOURCE-PUBLICATION-REVIEW.md
    - tests/helpers/open-runtime-session.ts
  modified:
    - tests/e2e/agent-ready-export.spec.ts
    - tests/e2e/package-assets.spec.ts
    - .planning/phases/05-bootstrap-trusted-stable-publication/05-CONTEXT.md
    - .planning/phases/05-bootstrap-trusted-stable-publication/05-05-PLAN.md
key-decisions:
  - Preserve operator inspection as npm setup assurance rather than claiming an authenticated API observation.
  - Preserve failed runs and consumed authorities; use separately authorized new dispatches, never reruns.
  - D-11 authorizes only the exact repaired prospective source after separate source-only publication and public verification.
  - Candidate approval grants no protected publisher approval or stable registry mutation.
patterns-established:
  - Wait for actual startup support state before dismissing its optional invitation; a one-shot visibility check races late rendering.
  - Native GitHub response validation projects security-relevant fields rather than comparing incidental provider metadata.
requirements-completed: []
requirements-progress: [REL-02]
duration: 265min
completed: 2026-09-10
status: complete
---

# Phase 5 Plan 05: Protected CI Candidate and Exact Approval

**One source-bound Darwin ARM64 CI candidate is independently inspected, held read-only and approved by the owner; its same-run publisher remains protected and unapproved.**

## Completion boundary

All three plan tasks are complete. REL-02 remains pending overall because 05-06 must still perform and verify actual trusted stable publication. PKG-01, PKG-02 and Phase 5 also remain incomplete. No npm publication or protected `npm-release` approval occurred here.

Elapsed chronology, including human checkpoints: `2026-09-10T10:30:09Z` to candidate approval revalidation at `2026-09-10T14:55:40Z`.

## Protected setup

Separate setup authorization `9a227dabff0930494f45f38d031c5e2022a82315fe7f1f723cd247fec20df29b` permitted the exact GitHub/npm configuration only.

Native GitHub observations verified repository `1327753770`, actor `alemagio` / `21338507`, environment `npm-release` / `21638471478`, required reviewer `alemagio`, self-review allowed, administrator bypass disabled, main-only branch policy `59602014`, and zero environment secrets. The owner saved/reloaded and confirmed npm's GitHub publisher for `Ship-With-AI/cumpa`, `publish-npm.yml`, `npm-release`, with direct publication enabled. This npm assurance is attributable operator UI inspection, not an invented authenticated API response; anonymous trust API access returned 401.

Existing authentication and unrelated configuration were preserved. No npm token was introduced for CI.

## Execution and repaired source

The original private guard stopped in read-only preflight because it compared complete GitHub metadata objects rather than the required protection fields. No candidate configuration or dispatch occurred. Its authorization and frozen bytes were retained; the owner separately authorized the repaired guard.

Runs `34476480752` and `34481083655`, each attempt 1 at original source `72c9bb499538a2c542d5165148e2d45096f7da56`, failed installed acceptance. Both publishers were skipped, no candidate artifact was uploaded, and both owned production transports were removed and independently confirmed absent. Each new cycle had its own actual authority; no workflow rerun or publication retry occurred.

The second failure's native browser log identified `support-dialog-backdrop` intercepting a file-tree click. The installed test openers checked `Not now` only once, before asynchronous support refresh could open its invitation. The shared opener now observes actual startup session/support responses and dismisses the real invitation before proceeding. The existing asset test holds refresh beyond the editor's first paint, reproducing the old failure deterministically.

The delayed-refresh case failed before the fix and passed afterward. Full installed browser/native acceptance and strict affected-file TypeScript checks passed using immutable published bootstrap bytes for local diagnosis only. No application behavior, timeout, forced click, dependency or acceptance requirement changed.

D-11 separately authorized exact replacement source `fcc12be291623c37211291681420fe0203df6cb0`, tree `23f87114ad2ddbc18c51f95e2611ef5b4f1e9f9c`. The reviewed exposure covered 26 commits, 93 trees and 67 blobs: 186 objects, manifest SHA-256 `0092459d52c22432d08a9ce0067127132e1201be67001488ae0c29330a1b2490`. Source-only authority `e07f23c8c5a9956db1fc3f8b2191127e1f4ee05b2cabc009f65e8d787618c632` permitted one non-forced/no-tags push of that exact commit. Credential-free reads matched all 764 recursive entries; two post-push observations found no target workflow or deployment. Later bookkeeping was not pushed.

## Successful candidate

Separate candidate authority `e04ab004b7dcace698bf2ebdfacaa602962a46cf00d3b6589eff20ab7b3841bf` permitted the fixed new source, absent-only source/origin transports, one input-free build/upload, exact artifact inspection and owned cleanup. The source-bound private driver passed 34 lifecycle checks and complete native read-only preflight before execution. It preserved prior frozen guards and receipts, owned its temporary resources, monitored competitors and left publication unapproved.

| Binding | Actual value |
|---|---|
| Package | `@shipwithai/cumpa@1.5.0` |
| Source | `fcc12be291623c37211291681420fe0203df6cb0` |
| Run / attempt | `34490078365` / `1` |
| Successful candidate job | `102914227367` |
| Waiting publisher job | `102915021477` |
| Native artifact ID | `10157421286` |
| Transport SHA-256 | `b6af207adbe4a0f1b1873a0e284986d0e4dc86ee163dbb388a3f6685578ea2d9` |
| Transport bytes | `3520829` |
| Archive bytes | `3514800` |
| Archive SHA-256 | `dc8f792920833415d309015d5f4c31501016e9a4a6cc945bb69dde2453137141` |
| npm SHA-1 | `2d58866c862283f2c41b3f4f7d51282b2ca96472` |
| npm SHA-512 SRI | `sha512-gUBrMYwL8u75k1JX1OxO2dwfUsjQGHAqPUjh8e5Ep6gVs52wwEZFwkl49fBU2eggU9S7J1r27SCa8W1X/iHn5g==` |
| Sealed evidence SHA-256 | `b7fe676a35c40cbd03a8d73bbb7bc83c5a4893d6aa7d01d1ab60799af3ff1091` |
| Candidate approval SHA-256 | `866598a581710953d75b90b8e60fcc321defb5317c31e0f8cbb05a6aef714f13` |

The exact native artifact contained only `evidence.json` and `shipwithai-cumpa-1.5.0.tgz`. Independent inspection checked all 144 archive members, 140 distribution hashes, 95 reachable web assets, legal/manifest/support parity, 167 installed dependency relationships and every sealed scanner/acceptance/source/native invariant. Both payload files and the transport are read-only and were rehashed after custody and again after actual assent.

Native CI observed Node `v24.20.0`, npm `11.19.1`, installed review/Finish behavior, canonical V2/V3, isolated drafts, configured support unavailability/dismissal, and actual Darwin ARM64 native re-export. Both temporary production names were absent afterward and the authoritative fingerprint remained unchanged.

## Attributable approval and validity

The owner supplied the complete actual-value `CI CANDIDATE APPROVED` statement. Original line wrapping is preserved in `05-CI-ARTIFACT-APPROVAL.md`; only whitespace was normalized for comparison. Candidate approval was recorded only after current bytes, source/run/attempt/artifact, protected waiting publisher, cleanup, vacancy and remaining validity were rechecked.

Run creation: `2026-09-10T14:35:39Z`. Conservative approval deadline: `2026-10-10T14:35:39Z`. Total-run deadline: `2026-10-15T14:35:39Z`. Native artifact expiry: `2026-12-09T14:35:41Z`. The conservative deadline is derived from run creation plus the documented review/workflow bounds, not presented as an API-provided pending-review expiry. At least the configured 15-minute publish window must remain before any later approval.

## Task commits

- Protected GitHub setup and npm confirmation: `2ceef99`, `41f2e60`.
- Acceptance race repair: `fcc12be` (the exact public source).
- Owner-approved prospective-source amendment: `04ab9e1` (local bookkeeping, not part of the source push).
- Repaired source publication result: `dda79ab` (local bookkeeping).
- Exact candidate approval: `7632ada5f19349494feb87c9a800d9db4bfdc7c3`.

## Deviations, limitations and preserved history

The provider-metadata guard repair and deterministic startup-prompt fix were required for correct execution; no gate was weakened. The replacement-source rule required and received explicit owner amendment before the separately authorized push. Failed cycles remain failed and their authorities remain consumed.

The approved MIT license, third-party notices, Phase 4 archive/evidence/approval, all sealed bootstrap records, legacy artifacts/backups, unrelated user state and existing authentication remain preserved. The new candidate supersedes only Phase 4's prospective publication designation and never supplies retrospective provenance.

Scanning is bounded; native proof covers Darwin ARM64 with fallback elsewhere; transitive dependencies are observed at installation time. Registry bytes, attestation cryptography and exact claims, generated public global-bin behavior and literal exact-version npx still require 05-06. No SLSA-level, every-platform native or full public-browser-flow claim is made.

## Next plan readiness

05-06 can now perform its read-only drift/tooling preflight and request the separate exact-value stable-publication phrase for publisher job `102915021477`. Do not approve that deployment, invoke local publication, rebuild/repack, change source/configuration, retry or claim public success under this candidate assent.
