---
phase: 03-distribution-contract-legal-boundary
verified: 2026-09-08T13:28:56Z
status: human_needed
score: "10/10 must-haves verified"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Operator revokes the two temporary fine-grained GitHub tokens used for private preparation and the visibility-only conversion, then records server-side revocation confirmation without exposing token material."
    expected: "Both temporary authorizations are revoked; the record no longer reports revocation as pending."
    why_human: "The retained evidence explicitly says revocation is unconfirmed, and local Keychain removal cannot prove server-side token revocation."
---

# Phase 3: Distribution Contract & Legal Boundary Verification Report

**Phase Goal:** Establish standard MIT terms, refreshed dual-licensor exact-text assent, rights/sensitive-history review, safe publication of the existing repository and reviewed history, truthful metadata/Issues links, and an evidence-backed future provenance policy.

**Verified:** 2026-09-08T13:28:56Z  
**Status:** human_needed — implementation and observed public-state must-haves are verified; the single administrative token-revocation confirmation remains open.  
**Re-verification:** No — initial verification; no earlier `03-VERIFICATION.md` existed.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Cumpa source and compiled releases use standard MIT with the named copyright holders, without downstream bespoke restrictions. | ✓ VERIFIED | `LICENSE` is substantive standard MIT text naming Alessandro Magionami & Manuel Salvatore Martone. The exact approved-public-source object resolves locally and its `LICENSE` hashes to `c947d781600d41cdeac710b2c81f5cd04ed88bad83dcc2277cffb30768490c7d` at 1,104 bytes. Its grants expressly include use, copy, modify, publish, distribute, sublicense, and sell, subject only to the MIT notice condition. |
| 2 | The exact MIT bytes have renewed assent from both named licensors; historical proprietary assent is not used for MIT. | ✓ VERIFIED | `03-LICENSE-APPROVAL.md` binds both current entries to the current MIT hash. Alessandro’s direct assent is recorded. Manuel’s own assent is recorded only as Alessandro’s witnessed report—no independent verification, verbatim Manuel statement, or proxy approval is claimed. The same record explicitly marks the 4,561-byte proprietary record historical and insufficient for the MIT bytes. |
| 3 | Required third-party rights and notices remain separate from the application MIT grant. | ✓ VERIFIED | `THIRD_PARTY_NOTICES.md` is a substantive independent-notices file; `README.md` links it and says third-party components retain their own licenses and notices. The current contract and approval record keep notices/right-review bindings distinct from the Cumpa MIT license. |
| 4 | Prepared npm metadata is coherent and truthful: `@shipwithai/cumpa@1.5.0`, `cumpa`, Node.js 24+, MIT, and the exact existing repository/Issues identity, with no homepage. | ✓ VERIFIED | `package.json` and root `package-lock.json` agree on name, version, MIT license, executable `dist/bin/cumpa.mjs`, and Node `>=24`. The manifest uses only `git+https://github.com/Ship-With-AI/cumpa.git` and `https://github.com/Ship-With-AI/cumpa/issues`; no `homepage` field exists. `private: true` and the current allowlist remain pending Phase 4’s artifact cutover. |
| 5 | The self-contained guide selects only the exact public source and verified Issues surface, without inventing a homepage/contact channel or registry availability. | ✓ VERIFIED | `README.md` names the exact package/command, links only `Ship-With-AI/cumpa` and its Issues URL for this distribution boundary, and explicitly says Phase 3 does not establish npm availability. The publication result records credential-free repository/ref/Issues API success and source/Issues HTML HTTP 200 at the approved source OID. |
| 6 | The existing immutable repository and reviewed history became public only after current MIT assent, final rights/exposure review, scoped private preparation, approved protection disposition, and content-bound final authorization. | ✓ VERIFIED | `03-PUBLICATION-REVIEW.md` binds `Ship-With-AI/cumpa` to repository ID `1327753770`, node ID `R_kgDOTyPqKg`, main `ff72519969da8d2c0761c9533ccb27b809cd17bb`, authorized snapshot `e784668b66563df3476f9f1039847b40df8c79bc803fc569d70f725a9e27da18`, and protection disposition `6dc6bf9649b4be99a9dd5ec34b71f10d673d284d8028a1077fd65150fca8ea48`. It records separate guarded private preparation and Alessandro’s exact final publication authorization. |
| 7 | Publication evidence establishes the actual public result rather than merely a successful mutation command. | ✓ VERIFIED | The same record reports only the visibility transition at `2026-09-08T13:02:24Z`; the result block records public identity/main/LICENSE/Issues verification with no Authorization header or credential helper, and public source/Issues HTML status 200. It also records the approved post-public controls rather than assuming private controls survived conversion. |
| 8 | Rights, sensitive-material, and retention handling is explicit and does not invent third-party clearance or unapproved destructive remediation. | ✓ VERIFIED | The rights review is redacted and records the reviewed current/historical/material scope. The publication result preserves only artifacts `9907668126` and `9928300866` under the exact owner-accepted notice-risk exception; it explicitly does not claim third-party permission or compliance. No deletion, rewrite, source/ref push, npm operation, retention change, or other settings mutation is claimed beyond authorized visibility. |
| 9 | The maintainer policy preserves eligible automatic provenance while requiring actual Phase 5 attestation evidence and forbidding unsupported claims. | ✓ VERIFIED | `docs/distribution-operations.md` assigns tarball acceptance to Phase 4 and registry/OIDC publication to Phase 5; it requires matching registry integrity, source commit, workflow/run, and emitted attestation subject/source claims. It expressly states OIDC success or a UI badge is not proof of emitted provenance and requires no provenance claim when the attestation is absent or mismatched. |
| 10 | Phase 3 did not substitute later distribution work or product changes for its legal/public-source boundary. | ✓ VERIFIED | The manifest stays private, the runtime-only package cutover remains Phase 4, and registry/provenance evidence remains Phase 5. The README and policy retain separate marketplace-skill lifecycle, voluntary-support neutrality, and prohibit DRM, activation, license-server, payment-gating, and application/UI/API/schema changes. The publication record also says later local review/SUMMARY/verification evidence is outside the approved public snapshot and must not be auto-pushed. |

**Score:** 10/10 must-haves verified; 0 present-but-behavior-unverified.

## Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `LICENSE` | Exact standard MIT application terms | ✓ VERIFIED | Substantive, unmodified standard MIT wording apart from named copyright substitution; source-snapshot hash and byte count independently checked. |
| `THIRD_PARTY_NOTICES.md` | Independent third-party notices/grants | ✓ VERIFIED | Substantive notice corpus, explicitly not a Cumpa application license, and linked by the user guide. |
| `03-LICENSE-APPROVAL.md` | Digest-bound current-MIT assent record | ✓ VERIFIED | `cumpa.license-approval/v1`; distinguishes direct Alessandro assent from witnessed Manuel assent and superseded proprietary history. |
| `03-RIGHTS-REVIEW.md` | Redacted rights/sensitive-history record | ✓ VERIFIED | Covers reviewed scope/findings and retains uncertainty limits; publication evidence supplies the refreshed final exposure result. |
| `package.json` and `package-lock.json` | Coherent prepared distribution identity | ✓ VERIFIED | Root manifest/lock identity, license, bin, and Node engine agree; no homepage appears. |
| `README.md` | Truthful public consumer guide | ✓ VERIFIED | Exact source/Issues links, MIT/notices language, and no false registry claim. |
| `docs/distribution-operations.md` | Phase 4/5 artifact/provenance policy | ✓ VERIFIED | Requires evidence-backed future attestation results and declares Phase 3 has no npm mutation. |
| `03-PUBLICATION-REVIEW.md` | Bounded authorization and observed public-state evidence | ✓ VERIFIED | Content-bound authorization, public conversion, credential-free API/HTML result, control observation, and remaining token-cleanup limitation are all explicit. |

## Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `LICENSE` | `03-LICENSE-APPROVAL.md` | Current 1,104-byte SHA-256 binding | ✓ WIRED | Independently recomputed at approved commit; exact hash agrees with both current-MIT approval entries. |
| `THIRD_PARTY_NOTICES.md` | `README.md` and rights review | Required notice preservation | ✓ WIRED | README links the notices; current MIT context says the application license does not remove independent grants. |
| `package.json` | `package-lock.json` | Root name/version/license/bin/engine contract | ✓ WIRED | Both root records name `@shipwithai/cumpa@1.5.0`, MIT, `cumpa`, and Node `>=24`. |
| `README.md` | public `Ship-With-AI/cumpa/issues` | Exact selected Issues channel | ✓ WIRED | README uses the selected Issues URL; publication evidence records credential-free Issues API success and Issues HTML 200. |
| `03-PUBLICATION-REVIEW.md` | existing public repository result | Content-bound final authorization then visibility-only mutation | ✓ WIRED | Immutable IDs, approved snapshot/main/license, `only_setting: visibility`, and anonymous-result fields are all present in the observed-result record. |
| `docs/distribution-operations.md` | Phase 5 release evidence | Attestation, artifact, source, workflow, and run binding | ✓ WIRED | Policy names each required evidence item and its fail-closed no-claim outcome; it makes no present npm/provenance assertion. |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Approved source LICENSE is the exact reviewed MIT bytes | `git show ff72519969da8d2c0761c9533ccb27b809cd17bb:LICENSE \| shasum -a 256; ... \| wc -c` | `c947d781600d41cdeac710b2c81f5cd04ed88bad83dcc2277cffb30768490c7d`, 1,104 bytes | ✓ PASS |
| Approved source reference exists locally | `git rev-parse ff72519969da8d2c0761c9533ccb27b809cd17bb^{commit}` | Returned that exact commit OID | ✓ PASS |
| Builds, tests, linters, formatters, browser automation, and remote calls | Not run | Explicit assignment constraint; parent’s actual 13/13 Playwright, detached CLI, hosted CI/deployment, and anonymous API/HTML results were inspected as evidence, not rerun. | ? SKIPPED AS DIRECTED |

## Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
| --- | --- | --- | --- |
| PKG-06 | Current MIT contract and 03-03 plan | ✓ VERIFIED | Exact named MIT file/hash, named assent record, preserved independent notices, and no recipient-side bespoke permission condition. Tarball inclusion remains Phase 4, as required by the active roadmap boundary. |
| PKG-07 | Current MIT contract and 03-03 plan | ✓ VERIFIED | Existing immutable repository/history is publicly observed only after the recorded review/authorization chain; rights/sensitive findings have explicit dispositions, no credential material is recorded, and destructive remediation stayed separately authorized. |
| REL-04 | Current MIT contract and 03-03 plan | ✓ VERIFIED | Metadata/lock/README agree on package identity, executable, Node, MIT, exact repository, and sole Issues channel; anonymous API plus source/Issues HTML evidence proves the selected public source surface. |
| REL-05 | Current MIT contract and 03-03 plan | ✓ VERIFIED | Operations policy preserves eligible provenance but requires actual Phase 5 attestation evidence and forbids treating OIDC authentication as proof. No npm/registry/provenance claim is made here. |

## Anti-Patterns Found

No blocker debt markers (`TODO`, `FIXME`, `XXX`, `HACK`, or `PLACEHOLDER`) were found in the Phase 3 goal artifacts or the Phase 3-modified deployment workflow/verifier/test/support-operation files. No stub/data-flow check applies: this phase’s deliverables are legal, metadata, documentation, and external-state evidence rather than a new runtime UI/API flow.

## Evidence Limits and Deliberate Non-Claims

- Browser tooling timed out. This report does **not** claim graphical browser verification; the recorded credential-free Node HTTP/API and HTML checks are the actual exercised fallback and passed.
- The owner-accepted retention exception is bounded to artifacts `9907668126` and `9928300866`. It is not a waiver of third-party rights, notices, sensitive-material review, or future findings.
- The review records approved public source eligibility only. Runtime tarball contents/notice inclusion are Phase 4; registry availability, OIDC trusted publishing, and an emitted provenance attestation are Phase 5.
- No raw token, credential, or private configuration value was read or recorded during this verification.

## Human Verification Required

### 1. Confirm temporary-token revocation

**Test:** The responsible operator revokes the two temporary fine-grained GitHub tokens used for preparation and public conversion, then records confirmation through the authorized administrative channel without revealing token values.

**Expected:** Both temporary authorizations are revoked. The publication-review limitation can be updated from “not yet confirmed” only after that server-side confirmation.

**Why human:** The evidence confirms no token values were disclosed and no public-state verification needs them, but local removal cannot establish that remote authorization has been revoked.

---

_Verified: 2026-09-08T13:28:56Z_  
_Verifier: the agent (gsd-verifier)_
