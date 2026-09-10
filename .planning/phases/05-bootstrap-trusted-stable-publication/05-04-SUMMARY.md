---
phase: 05-bootstrap-trusted-stable-publication
plan: 04
subsystem: distribution
tags: [npm, bootstrap, immutable-artifact, guarded-authentication, revocation]
requires:
  - phase: 05-01
    provides: Configured bootstrap producer and installed acceptance profile
  - phase: 05-03
    provides: Reviewed release workflow and operative publication policy
provides:
  - Public usable MIT bootstrap with exact approved bytes and generated-bin proof
  - Exact reviewed public source and no collateral deployment observations
  - Completed temporary credential cleanup at explicitly recorded assurance levels
  - Owner-approved first-release latest exception pending stable CI replacement
affects: [05-05, 05-06]
tech-stack:
  added: []
  patterns: [Separate actual authorization gates, Private bounded credential ownership, Public byte reconciliation before usability claims]
key-files:
  created:
    - .planning/phases/05-bootstrap-trusted-stable-publication/05-SOURCE-PUBLICATION-REVIEW.md
    - .planning/phases/05-bootstrap-trusted-stable-publication/05-BOOTSTRAP-EVIDENCE.json
    - .planning/phases/05-bootstrap-trusted-stable-publication/05-BOOTSTRAP-APPROVAL.md
    - .planning/phases/05-bootstrap-trusted-stable-publication/05-BOOTSTRAP-PUBLICATION.json
    - .planning/phases/05-bootstrap-trusted-stable-publication/05-BOOTSTRAP-AUTH-REVOCATION.md
  modified:
    - .planning/phases/05-bootstrap-trusted-stable-publication/05-CONTEXT.md
    - .planning/phases/05-bootstrap-trusted-stable-publication/05-04-PLAN.md
key-decisions:
  - Publish only the separately built and approved bootstrap, never the historical Phase 4 archive.
  - A failed publication consumed its one-attempt authority; the successful second attempt received separate exact authority.
  - D-10 accepts npm's first-release latest pointer temporarily after an authorized removal was rejected E400.
  - Supported logout, operator confirmation and independent rejected-token proof remain distinct assurance levels.
requirements-completed: [REL-01]
duration: multi-session and human-gated; not separately timed
completed: 2026-09-10
status: complete
---

# Phase 05 Plan 04: Public bootstrap and scoped authorization closure

**The real MIT bootstrap is public, byte-identical to the approved archive, installable from npm, and cleaned of temporary publication authority. Closure includes the explicit D-10 first-release latest exception.**

## Published identity

- Package: `@shipwithai/cumpa@1.5.0-bootstrap.0`.
- Registry publication: `2026-09-10T08:31:35.088Z`, account `alemagio`, verified `shipwithai` owner.
- Tag: `bootstrap`; npm also assigned `latest` on this first release.
- Byte length: `3514006`.
- SHA-256: `4405580ba53d20ee2c802eb30a2e77c32fb4425ac7e53673c39de6c14cd97f5f`.
- npm SHA-1: `c34bee6983580de9f0fbbcce3bbb6759fc9933f2`.
- npm SHA-512 integrity: `sha512-911RewXQwTbNLlrqprXf9elM89Pcz41WYhAHSzQ6YZjo9Ka9zJPwcpR1uHoP11dnYYLQEpoCagReM8kXb933hw==`.
- Source P: `72c9bb499538a2c542d5165148e2d45096f7da56`.
- Source tree T: `cee68f305f818383364edc1a9595800970dac580`.
- [Published package](https://www.npmjs.com/package/@shipwithai/cumpa/v/1.5.0-bootstrap.0).

## Preparation and source publication

A fresh configured build from clean reviewed P/T passed the bootstrap scanner and complete installed acceptance: 144 files, 95 reachable web assets, 167 dependency relationships, browser/review/support-dismissal/V2/V3 behavior and actual Darwin ARM64 native re-export. A preceding parser-order preparation failure was closed and retained privately without approval; its archive was not used as the repaired build's input or authority.

Source review covered 53 commits, 196 trees, 156 blobs and no tags: 405 newly exposed objects, with reviewed-range digest `b73337990b01ea44daf50b50ef6a0fda75b45c183fd2aa6147a6b0b365f1f48c`. Separate exact authority permitted only P-to-main publication. Public commit/tree and all 757 recursive tree entries matched; two post-push observations found no target Actions run or Supabase deployment. Later local bookkeeping was not pushed.

The original Phase 4 archive/evidence/approval, legacy artifacts `9907668126` and `9928300866`, their backups, legal bytes, source package/lock and unrelated local state remain preserved. No historical artifact was repacked or used as a fallback.

## Actual publication and public verification

The approved archive/evidence were sealed before authentication. Actual account, owner role, verified email, 2FA `auth-only` with pending false, authenticated/public vacancy and source/artifact bindings were checked before each authorized publication.

The first publication command failed after the publishing-browser session was not completed in time, according to the operator. Its exact provider error was not recoverable from the discarded raw output. The command's isolated session was logged out and public npm still returned 404. No automatic retry occurred.

The second command used new exact authority `056cd80371e2f202b2449b2fa2241652e9083591b9e8b45d586f63d26b4a203a`, the same absolute read-only archive, and explicit bootstrap/public/ignore-scripts/fetch-retries-zero arguments. Separate login and publishing-browser requests were announced; the native command exited 0. Supported npm logout completed before credential-free public verification.

Public metadata and downloaded bytes matched name/version, MIT license, byte length, SHA-256, SHA-1 and SHA-512 integrity. A normal exact global installation from the public registry succeeded with install scripts enabled, no local-archive fallback, and fresh isolated HOME/cache/prefix/configs. The installed generated `cumpa` binary resolved inside that package and returned `1.5.0-bootstrap.0` with exit 0 on Node v24.15.0/npm 11.12.1, Darwin ARM64. All created consumer/download state was removed.

This was local interactive publication. No CI-build provenance, trusted-publication result, stable 1.5.0 availability, npx-stable proof or final phase completion is claimed.

## Latest-tag exception and credential assurance

Despite `--tag bootstrap`, public metadata contained both bootstrap and latest at the bootstrap version. A separately authorized fixed tag-only guard attempted only removal of latest after verifying its exact value, account authority and preserved bootstrap integrity. The registry rejected it with E400; tags and version bytes did not change. [npm/cli#8490](https://github.com/npm/cli/issues/8490) corroborates first-publication dual tags and the removal rejection.

The owner then selected **Accept until stable CI**, accepting only this first-release latest pointer until a separately approved stable CI publication replaces it. Exception SHA-256: `fdf592eef8725d7e5c5d2e6a59a94d9351b8bbca9884ebe4ae85ad9a1021fd19`, captured `2026-09-10T09:44:36Z`. D-10 and the plan amendment preserve the original failed condition and rejected repair as history; no criterion was silently waived. All other release, artifact, source, provenance and authorization requirements remain unchanged.

Six publication/preparation contexts and two tag-repair contexts are locally closed and cleaned. Their records distinguish no-session-created, operator-reported no completed CLI authorization, operator-confirmed targeted provider revocation, and successful supported npm logout. The owner confirmed both the successful publication-session and final tag-session revocations. No independent rejected-token probe is claimed, and no unrelated npm/GitHub/browser credential was removed.

Private lifecycle diagnostics passed 16 publication-guard and 19 tag-guard stand-ins. Actual credential-free npm PTY output reproduced and verified correction of a bounded error-parser defect; native tag JSON was checked through supported `npm view` rather than assuming `dist-tag ls --json` output. These checks did not perform authentication or registry mutation.

## Sealed evidence digests

| Artifact | SHA-256 |
|---|---|
| `05-BOOTSTRAP-EVIDENCE.json` | `54fc66c7354921bae673fe53aa0d58256055df967486089232d797ad59c5cdb4` |
| `05-BOOTSTRAP-APPROVAL.md` | `c91450bdd8fdf1c775bfa5189ba30e3534bd5867e6a55e9065db9ecdea0328ec` |
| `05-BOOTSTRAP-PUBLICATION.json` | `021ce9d595cc1b09bb9f4c3dd6e6b7222abf0e724fe492e516ebad5555548720` |
| `05-BOOTSTRAP-AUTH-REVOCATION.md` | `b14d9f961cd40fccc98753b78677533d7b626237235c13d5c7c3c754189efe9c` |
| `05-SOURCE-PUBLICATION-REVIEW.md` | `d787ab9829909bfcab95eaa3871024bf40793634c889192f50330cbcbdc76966` |


## Closeout and next boundary

Closure records and the owner amendment were committed in `c235911`; individual prior operational commits and attributable actions are preserved in the referenced records. Public product/workflow/policy bytes at P were intentionally not rewritten or pushed: the one-time operational outcome exception is recorded in D-10, while the prescribed bootstrap command remains unchanged.

REL-01 is complete under the expressly approved first-release amendment. Plans 05-05 and 05-06 remain incomplete. The next step is read-only preflight for the exact npm trusted-publisher relation and protected GitHub npm-release environment, followed by separate setup authority. No hosted configuration, CI dispatch/upload, stable artifact approval, protected-publisher approval or stable publication has been authorized.
