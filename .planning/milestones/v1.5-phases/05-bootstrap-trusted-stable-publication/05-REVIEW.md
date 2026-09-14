---
phase: 05-bootstrap-trusted-stable-publication
reviewed: 2026-09-10T16:07:52Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - scripts/pack-runtime.mjs
  - scripts/verify-production-artifacts.mjs
  - scripts/verify-npm-release.mjs
  - tests/helpers/runtime-artifact.ts
  - tests/package/runtime-producer.test.ts
  - tests/package/runtime-artifact-verifier.test.ts
  - tests/package/npm-release-verifier.test.ts
  - tests/package/agent-ready-export.test.ts
  - tests/e2e/package-assets.spec.ts
  - tests/e2e/agent-ready-export.spec.ts
  - tests/helpers/open-runtime-session.ts
  - .github/workflows/publish-npm.yml
  - docs/distribution-operations.md
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
resolved_findings: 2
---

# Phase 05: Code Review Report

**Reviewed:** 2026-09-09T15:43:49Z  
**Depth:** deep  
**Files Reviewed:** 11  
**Status:** Both local code blockers resolved and verified by Main

## Summary

The initial independent review of local plans 05-01 through 05-03 found two real evidence-handoff failures masked by synthetic fixtures. Main corrected the fixtures to the producer/aggregator's actual formats, observed each rejection, and repaired both contracts in `bad28f7`. There are no remaining open findings from this scoped review.

This is a prerequisite source review only. Bootstrap execution, GitHub dispatch/approval, npm publication/provenance, and public-consumer receipts remain explicit unexecuted operational gates under 05-04 through 05-06.

## Narrative Findings (AI reviewer)

At initial review, the producer, acceptance aggregator and stdlib sealing verifier had incompatible serialized contracts. Both failures would occur after candidate production and acceptance but before sealing/upload. The resolution evidence below records their repair without claiming an actual CI or publication result.

## Resolved Critical Issues — Original Review

### CR-01: Clean producer evidence is rejected by the candidate sealer

**File:** `scripts/pack-runtime.mjs:147`; `scripts/verify-npm-release.mjs:180`

**Issue:** `trackedSource()` defines its digest as `sha256(JSON.stringify([index, working]))`. For the clean checkout required by the candidate workflow, that is the hash of `["",""]`. `validateProducer()` instead requires the hash of the different byte sequence `""`. Consequently, the actual clean candidate evidence emitted at `pack-runtime.mjs:492` always fails `seal-candidate` with `invalid producer source`; no sealed evidence can be uploaded or passed to the protected publish job. `tests/package/npm-release-verifier.test.ts:76` fabricates `sha256('')`, so it does not model producer output and cannot catch the cross-module incompatibility.

**Fix:** Make the verifier require the producer's canonical clean tracked-diff representation, e.g. `hash('sha256', JSON.stringify(['', '']))`, and change the seal fixture to derive the same representation (or share the canonical digest helper). Keep the existing exact clean-source requirement.

### CR-02: Stable acceptance report is rejected by the candidate sealer

**File:** `tests/package/agent-ready-export.test.ts:199`; `scripts/verify-npm-release.mjs:249`

**Issue:** The real acceptance aggregator always writes `profile: selected.profile`; the candidate workflow's normal profile is therefore `"stable"`. `validateAcceptance()` has a strict root allowlist that excludes `profile`, so it rejects the real report before it reaches its candidate-purpose checks. This makes `seal-candidate` fail after otherwise successful scanner and installed-browser acceptance. `tests/package/npm-release-verifier.test.ts:92` omits `profile` from its fabricated acceptance report, masking the failure.

**Fix:** Add `profile` to the strict acceptance-report contract and require it to equal `"stable"` for the stable candidate that this sealer accepts. Update the fixture to include the real field so schema drift remains covered.

## Resolution Evidence

- **CR-01:** The corrected fixture first failed with `invalid producer source`. The verifier now uses the producer's canonical `sha256(JSON.stringify(['', '']))` clean-diff representation.
- **CR-02:** After CR-01's fix, that same real-shape fixture failed with `invalid acceptance report`. The verifier now requires and preserves exactly `profile: stable`; a crossed bootstrap profile is rejected.
- **Verification:** Main ran the release verifier suite (**21/21 passed**) and strict fixture TypeScript checking after both fixes. This is Main's targeted resolution verification, not an unperformed independent re-review.
- **Security cross-check:** The separate read-only security reviewer independently confirmed these two fail-closed blockers and reported no evidence-backed exploitable vulnerability within the local plans 05-01/02/03 threat model. Full operational security proof remains gated and incomplete.

---

_Reviewed: 2026-09-09T15:43:49Z_  
_Reviewer: the agent (gsd-code-reviewer)_  
_Depth: deep_

## Final Review — 2026-09-10

**Reviewed:** 2026-09-10T16:07:52Z  
**Depth:** standard  
**Files Reviewed:** 13  
**Status:** clean — 0 active BLOCKER, 0 active WARNING, 0 active INFO findings

### Scope and evidence assessed

Reviewed the Phase 5 producer/profile boundary, artifact scanner, release verifier, installed-acceptance helpers and scenarios, same-run workflow, and operative publication policy listed in the final verification input. This final pass also read all six phase summaries, the associated plans, the preserved initial review, and canonical `05-RELEASE-EVIDENCE.json`.

The canonical release evidence records the fulfilled operational proof for the immutable source `fcc12be291623c37211291681420fe0203df6cb0`, workflow run `34490078365` attempt `1`, publisher job `102915021477`, and artifact `10157421286`. It records npm 11.19.1 cryptographic audit/attestation verification with 12 exact claim checks; a distinct normal, scripts-enabled global install whose generated bin returned `1.5.0`; and a literal fresh-context `npx --yes @shipwithai/cumpa@1.5.0 --version` that returned `1.5.0`. It also distinguishes the release verifier's intentionally scripts-disabled global installation from that separate normal-consumer observation and records removal of all owned consumer/tooling state.

### Narrative Findings (AI reviewer)

No additional reportable correctness, security, or maintainability defect was established in the reviewed source scope. In particular, the current closed profile selection happens before evidence acceptance; stable and bootstrap identities remain fixed rather than evidence-selected; the sealer validates the producer's actual clean-diff representation and acceptance `profile: stable`; and the workflow maintains the intended source-first candidate gate, exact same-run handoff, publisher-only OIDC, and one-publish path.

The scripts-disabled global check in `scripts/verify-npm-release.mjs:548-553` is not an open defect in this completed phase: it is a deliberately isolated verifier check. The separately recorded normal script-enabled global installation and literal fresh-context npx proof satisfy the public-consumer requirement without altering immutable published source. The initial public visibility gap remains an operational limitation with an unconfirmed backend cause, not an evidence-based source-code finding.

This is a bounded code review, not a claim that the package or its dependencies are universally bug-free. The release evidence retains the explicit limits on bounded disclosure scanning, Darwin ARM64 native observation/fallback elsewhere, non-exhaustive dependency observation, and the absence of a full public browser-review claim.

---

_Final review: 2026-09-10T16:07:52Z_  
_Reviewer: Phase5FinalCodeReview (gsd-code-reviewer)_  
_Depth: standard_
