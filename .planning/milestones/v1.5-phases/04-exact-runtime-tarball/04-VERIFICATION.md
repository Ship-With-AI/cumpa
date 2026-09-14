---
phase: 04-exact-runtime-tarball
verified: "2026-09-09T07:37:36.904623+00:00"
status: passed
score: "4/4 roadmap success criteria verified"
behavior_unverified: 0
overrides_applied: 0
requirements_completed: [PKG-03, PKG-04, PKG-05, REL-03]
human_verification: []
human_verification_completed:
  - test: Actual immutable runtime artifact digest and limitations approval
    confirmed: "2026-09-09T07:16:13.622996+00:00"
    source: Direct user assent preserved verbatim in 04-ARTIFACT-APPROVAL.md; post-assent hashes and read-only custody independently checked
---

# Phase 4: Exact Runtime Tarball Verification Report

**Goal:** Maintainers hold one reviewed, immutable `.tgz` containing every required compiled runtime asset and no development-only or sensitive material, regardless of public source availability.

**Status:** passed — all four roadmap criteria and all four assigned requirements are accounted for. Actual human approval is complete, security has zero open/HIGH blockers, and no further Phase 4 human verification is pending.

## Observable truths

| # | Required truth | Status | Evidence |
|---|---|---|---|
| 1 | Installing the candidate outside a source checkout exposes `cumpa --version` exactly as `1.5.0` and retains Node.js 24+/Git guidance. | VERIFIED | `package.json`; `src/cli/run.ts:65-80,747-771`; `scripts/verify-prerequisites.mjs:29-87`; version side-effect and prerequisite contracts in `tests/package/runtime-package-contract.test.ts:79-186`; actual installed generated-bin assertions in `tests/e2e/package-assets.spec.ts:90-105`; sealed acceptance records PKG-03. |
| 2 | The archive contains every compiled Node/browser asset needed to launch and complete the existing review workflow. | VERIFIED | `scripts/pack-runtime.mjs:187-310,357-422`; recursive asset/worker/font and dist-byte checks in `scripts/verify-production-artifacts.mjs:278-349,390-489`; isolated install in `tests/helpers/runtime-artifact.ts:260-416`; installed assets and review/Finish scenarios in `tests/e2e/package-assets.spec.ts` and `tests/e2e/agent-ready-export.spec.ts`; recorded final acceptance passed all seven Chromium scenarios. |
| 3 | Archive inspection excludes development, source/map, local-state, skill, Git/history and sensitive material within the declared scanner boundary. | VERIFIED | Exact runtime/legal allowlist in `package.json:20-25`; producer preflight and inventory parity in `scripts/pack-runtime.mjs:148-172,186-211,255-274`; protected, hash-bound non-producing inspection and bounded exclusions in `scripts/verify-production-artifacts.mjs:57-228,260-275,366-440`; sealed evidence records the passed 144-file scanner result and exact legal/source/dist identities. |
| 4 | Maintainers inspect/install and approve one actual digest, then designate those same immutable bytes for publication without a later rebuild or substitution. | VERIFIED | Sole one-build/one-pack producer at `scripts/pack-runtime.mjs:345-420`; consumer rehashing at `scripts/verify-production-artifacts.mjs:57-123,366-476`; identical archive identity across producer/verifier/acceptance/custody/approval; direct user assent and sealed evidence digest in `04-ARTIFACT-APPROVAL.md`; independent post-assent and verifier rehashes; explicit Phase 5 unchanged-byte obligations. |

## Required artifacts and connections

| Artifact / connection | Result |
|---|---|
| Manifest → installed CLI version | `readPackageVersionFromManifest()` validates package name/version and Commander handles version before Git discovery, stdin review input, server startup or browser launch. It resolves the installed package root from compiled CLI code. |
| Build → npm file inventory → one archive | One producer builds runtime/bin/native/web outputs, enforces exact inventory parity and captures one scripts-disabled pack result with all identities. No new producer or repacking verifier was introduced. |
| Archive → scanner → browser graph | Supplied archive and evidence must match before protected inspection. Every dist byte matches its inventory; recursively referenced HTML/CSS/JS assets exist; all five Monaco worker roles and codicon are required. |
| Archive → isolated install → real consumer | Acceptance installs scripts-disabled with fresh prefix/HOME/cache/config, checks exact direct dependencies and the resolved tree, then launches npm's generated bin from fixture repositories rather than checkout `dist`. |
| Installed review → V2/V3 Finish | Recorded installed scenarios cover review/relaunch, isolated drafts, canonical V2 and grounded V3 completion. The added/deleted exact-patch regression was fixed at optional-path construction without relaxing canonical encoding. |
| Configured support → unavailable/dismissal → unrestricted Finish | Existing GitHub configuration was reused in memory. Both server and browser egress were denied during acceptance; the real unavailable path and `Not now` dismissal preserved completion. |
| Exact bytes → human approval → immutable handoff | The actual response binds package/version, SHA-256, length and limitations. Evidence is accepted-local and sealed; Phase 5 must locate and rehash these same bytes, not rebuild them. |

## Accepted identity

- Package: `@shipwithai/cumpa@1.5.0`.
- Basename: `shipwithai-cumpa-1.5.0.tgz`.
- SHA-256: `e7766d43f7f804b138e694b298480cdec62ebfc16960f86d4c1e3c7959cf1dca`.
- Byte length: `3513998`.
- npm SHA-1: `53d3ae3d58548558ff2dcdb7947c27e5ad3ec902`.
- npm SHA-512 SRI: `sha512-HplL30C2B6SvORJt4EqpfZ2tEV49SJH6lAa4XVq966fBoDhAfIAvMoimByF2g9/RIGsvfcM0yuB7kwQcqIEORA==`.
- Outside-checkout custody label: `accepted-candidate`; observed mode `0444`.
- Sealed evidence SHA-256: `3bf27f13de08b85527240c76ddc1e4df6c37dc06a5e1bbf006ab9d45f94fb379`.
- Approval: direct Alessandro Magionami assent, recorded at `2026-09-09T07:16:13.622996+00:00`. Its line break was preserved verbatim and whitespace alone normalized for matching.

The immutable archive core, verifier and acceptance contain matching basename/length/all-algorithm identities. Custody and approval bind the same SHA-256/length. The approval record's evidence digest matches the sealed accepted-local JSON. No private archive path or cleartext production origin is retained here.

## Requirement coverage

| Requirement | Status | Scope |
|---|---|---|
| PKG-03 | SATISFIED | Criterion 1: exact installed version and preserved Node/Git guidance. |
| PKG-04 | SATISFIED | Criterion 2: compiled runtime completeness through actual installed review and Finish. |
| PKG-05 | SATISFIED | Criterion 3: runtime/legal-only archive with explicit bounded disclosure controls. |
| REL-03 | SATISFIED FOR PHASE 4 | Criterion 4: inspected/installed exact bytes, attributable approval and mandatory unchanged-byte handoff. Actual registry publication and equality remain Phase 5 work, not a Phase 4 claim. |

All requirement IDs declared by the four current plans are covered. No unassigned requirement was marked complete and no later-phase registry or marketplace goal was substituted for this phase's scope.

## Verification performed and limits

- **Main's recorded live execution:** the final scanner and complete installed acceptance passed against this real production-configured archive. All seven Chromium scenarios, source-control preservation, cleanup and actual Darwin ARM64 native re-export are bound in evidence. Earlier source-suite/build/regression results are documented in the implementation summaries, not represented as freshly rerun checks here.
- **Main's approval closeout:** independently rehashed all algorithms/length after direct user assent, verified stable file identity/read-only/outside-checkout custody, sealed evidence and recorded verbatim assent. Bounded-data checks found no private checkout/custody path, canonical origin or matching raw project reference in the evidence/approval records.
- **RuntimeGoalVerify (gsd-verifier):** independently traced criteria 1–2 and PKG-03/04 from source to installed consumers and sealed proof; independently matched the evidence digest. No missing asset, hollow connection or behavioral gap found.
- **ArtifactGoalVerify (gsd-verifier):** independently traced criteria 3–4 and PKG-05/REL-03, matched current source/legal input hashes and all identity relationships, located and read-only rehashed the archive, confirmed mode 0444 and the evidence seal. No mismatches or unresolved human gates found.
- **Security:** all 33 unique plan-time threat IDs remain represented in `04-SECURITY.md`: 32 implemented/lifecycle controls closed, one declared bounded limitation, zero open/HIGH blockers and zero implementation gaps.

The final verifier slices performed no builds, tests, linters, formatters, fresh installation, scanner rerun, extraction, compiled-origin plaintext read, network operation or remote mutation. Recorded live acceptance is distinguished from these source/hash inspections.

Bounded scanning is not exhaustive secret detection or arbitrary hostile-tar safety. Notice reconciliation is not a legal warranty. Native runtime observation is Darwin ARM64 only, with the explicit fallback elsewhere. Separately installed dependencies were observed at installation time, not bundled into the immutable Cumpa archive.

No upload, staging, source push, deployment, registry publication/availability/equality, public-source alignment, provenance/attestation or transport authorization is claimed. Phase 5 retains its own authorization and evidence gates.

## Gaps and human verification

None for Phase 4. No overrides applied. The actual artifact assent closed the only outstanding human gate; it must not be requested again or expanded into publication authority.

_Verification integrated by Main from the two independent gsd-verifier slices and direct approval/security closeout._
