---
phase: 04-exact-runtime-tarball
plan: 04
subsystem: distribution
tags: [immutable-artifact, human-approval, custody, npm]
requires:
  - phase: 04-exact-runtime-tarball
    plan: 03
    provides: Verified exact-byte installed acceptance pipeline
provides:
  - One real production-configured read-only approved runtime archive
  - Sealed accepted-local artifact evidence and attributable human approval
  - Unchanged-byte Phase 5 handoff without publication or transport authority
affects: ["Phase 5: Bootstrap & Trusted Stable Publication"]
tech-stack:
  added: []
  patterns: [Single-source GitHub configuration, digest-bound human assent, immutable custody]
key-files:
  created: [.planning/phases/04-exact-runtime-tarball/04-ARTIFACT-EVIDENCE.json, .planning/phases/04-exact-runtime-tarball/04-ARTIFACT-APPROVAL.md]
  modified: [THIRD_PARTY_NOTICES.md]
key-decisions:
  - Reuse the existing GitHub production variable in memory instead of requiring a duplicate local configuration file.
  - Preserve prior third-party grants and add build-generated helper attributions before producing the final archive.
  - Accept whitespace-only wrapping of the exact user approval while preserving the verbatim statement.
  - Approval binds local bytes only and grants no remote mutation authority.
requirements-completed: [PKG-03, PKG-04, PKG-05, REL-03]
duration: not separately timed
completed: 2026-09-09
status: complete
---

# Phase 04 Plan 04: Approved immutable runtime artifact

**The actual production-configured archive is verified, read-only and approved by its exact SHA-256/length; Phase 5 must consume those same bytes.**

## Task Commits

1. Final candidate production and verification — `a616366`.
2. Installed acceptance and read-only custody — `57f0578`.
3. Attributable human approval and sealed handoff — `30e60bc`.

Preparation reused existing GitHub configuration and reconciled helper notices in `a0f6a10`; no application source or dependency version changed during this plan.

## Accepted artifact

- Package: `@shipwithai/cumpa@1.5.0`.
- Basename: `shipwithai-cumpa-1.5.0.tgz`.
- Byte length: **3,513,998**.
- SHA-256: `e7766d43f7f804b138e694b298480cdec62ebfc16960f86d4c1e3c7959cf1dca`.
- npm SHA-1: `53d3ae3d58548558ff2dcdb7947c27e5ad3ec902`.
- npm SHA-512 SRI: `sha512-HplL30C2B6SvORJt4EqpfZ2tEV49SJH6lAa4XVq966fBoDhAfIAvMoimByF2g9/RIGsvfcM0yuB7kwQcqIEORA==`.
- Custody label: `accepted-candidate`; one durable outside-checkout file, mode **0444**. No extra copy or backup is required or claimed.
- Evidence status: **accepted-local**.
- Sealed evidence SHA-256: `3bf27f13de08b85527240c76ddc1e4df6c37dc06a5e1bbf006ab9d45f94fb379`.

## Human approval

Alessandro Magionami directly supplied the requested package/version, actual SHA-256, exact length and limitations acknowledgement. The message wrapped between “limitations” and “acknowledged”; the verbatim text is preserved in `04-ARTIFACT-APPROVAL.md`, with whitespace normalized only for matching. This is not a generic or proxy approval.

After the user response, Main independently recomputed SHA-256, SHA-1, SHA-512 SRI and byte length, confirmed stable file identity during the read, verified outside-checkout placement and read-only mode, and matched all producer/scanner/acceptance/custody identities. The same checks still matched after acceptance was recorded. The archive and sealed evidence are not to be modified further.

## Verification

- The final producer performed exactly one configured build and one scripts-disabled pack in a unique custody leaf.
- Static verification passed **144 packaged files** and **95 reachable browser assets**, including all five Monaco worker roles and codicon.
- The exact archive passed isolated scripts-disabled global installation and **167 resolved dependency relationships**.
- The complete acceptance command passed all **seven installed Chromium scenarios**, with recorded assertions for browser assets/workers/codicon, review/relaunch, isolated drafts, canonical V2 and grounded V3 Finish, and unavailable support/dismissal without restricting completion.
- The real installed Darwin ARM64 addon completed the second export. No native observation on other targets is claimed.
- Cleanup and source-control preservation passed. The acceptance harness blocked both server-side and browser non-loopback support access; no hosted-support mutation occurred.
- All algorithm-specific identities agreed before/after scanner, installed acceptance, read-only mode and the actual human assent.
- The approved MIT LICENSE digest remains unchanged. All prior grants and Monaco's upstream notice were preserved; final notice additions and source/lock/build identities are bound in evidence.

## Configuration and notice reconciliation

The local configuration blocker was resolved by the user pointing to the existing GitHub `production` environment. Main read `SUPABASE_PROJECT_REF` without displaying it, validated it, confirmed its fingerprint in the prior review and passed the derived origin only through process environment. No duplicate local configuration file was created. Durable evidence stores source labels and a fingerprint, not the origin or project reference.

Final emitted output includes generated build helpers. Before creating this archive, Vite/Rolldown and Rolldown's upstream Rollup/esbuild attributions were added using the existing MIT-notice grouping. Prior grant text and the approved Cumpa LICENSE did not change. `legalReconciliation` records the old/new notice digests, source references and exact final inventories. This is not a new legal certification or warranty.

## Deviations from Plan

- Reused readable GitHub production configuration in memory rather than forcing an unnecessary local `.env` copy. The user explicitly challenged duplication; the environment-only build/scanner and fingerprint-only record boundaries remain intact.
- Added the missing build-helper attributions before the one final build, without changing Cumpa's MIT grant or dependency versions.
- Preserved the approval's actual line wrap while accepting its exact words, hash, length and acknowledged limitations.

## Phase 5 obligations and limits

This is **local artifact acceptance**, not publication. No source push, upload, staging, npm mutation, deployment, retention change, transport authorization, registry availability/equality, public-source alignment or provenance claim occurred.

Phase 5 must independently locate the `accepted-candidate`, verify the sealed evidence digest, rehash all archive identities and use these same bytes for any separately authorized action. A rebuild with the same name/version is not an acceptable substitute. Missing custody or any mismatch must stop publication preparation, not trigger recreation.

Bounded scanning is not exhaustive secret detection or arbitrary hostile-tar safety. Native observation is Darwin ARM64 only, with the existing explicit fallback elsewhere. Separately installed transitive dependencies are observed installation inputs, not bytes inside the Cumpa archive.

## Self-Check: PASSED

The three plan tasks are complete and committed; actual assent, unchanged read-only bytes and sealed accepted-local evidence are present. Phase-level security and goal verification must finish before the roadmap is advanced.
