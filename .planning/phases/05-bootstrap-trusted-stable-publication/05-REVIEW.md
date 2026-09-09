---
phase: 05-bootstrap-trusted-stable-publication
reviewed: 2026-09-09T15:43:49Z
depth: deep
files_reviewed: 11
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
  - .github/workflows/publish-npm.yml
  - docs/distribution-operations.md
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: resolved
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
