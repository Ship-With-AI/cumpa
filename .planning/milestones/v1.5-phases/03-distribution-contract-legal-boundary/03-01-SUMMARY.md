---
phase: 03-distribution-contract-legal-boundary
plan: 01
subsystem: legal
tags: [licensing, rights-review, third-party-notices, source-available]
requires: []
provides:
  - Exact proprietary application LICENSE approved by both named licensors
  - Redacted initial rights/history/exposure review with resolved owner dispositions
  - Reconciled notices and a digest-bound attributable approval record
affects: [03-02, 03-03, phase-04, phase-05]
tech-stack:
  added: []
  patterns: [Native Git evidence, Exact-byte license approval, Separate publication authorization]
key-files:
  created: [LICENSE, .planning/phases/03-distribution-contract-legal-boundary/03-RIGHTS-REVIEW.md, .planning/phases/03-distribution-contract-legal-boundary/03-LICENSE-APPROVAL.md]
  modified: [THIRD_PARTY_NOTICES.md]
key-decisions:
  - Initial R-01/R-02/R-03 dispositions were supplied by the operator without deletion or history rewriting.
  - Manuel's own co-approval is recorded as witnessed and reported by Alessandro, not as a fabricated direct signature or proxy grant.
  - Exact-license approval does not authorize any private push or public visibility change.
requirements-completed: [PKG-06, PKG-07]
duration: not separately timed; human checkpoint wait included
completed: 2026-09-07
status: complete
---

# Phase 03 Plan 01: Rights, Notices and Exact License Approval

**The source-and-compiled proprietary terms now have both named licensors' attributable approvals, with immutable license, notice and initial-review bindings.**

## Performance

- Completed: 2026-09-07.
- Start time and active duration were not separately recorded; no timing estimate is asserted.
- Tasks: 3/3.
- Deliverable files: 4.

## Accomplishments

- Audited 844 primary reachable commits, 7,037 objects, 601 tracked paths and 991 historical paths; supplemented with 53 reflog-only objects. All scanned blobs were accessible UTF-8 text. Bounded credential checks found no confirmed live credential/private key/JWT, not a confidentiality certification.
- Accounted for all 254 lockfile locations and 253 named name-version pairs. Reconciled browser dependency notices, preserved the complete upstream Monaco notice bytes and confirmed Markdown-It's actual nested entities 4.5.0 resolution. Final package/bundle/native material remains Phase 4 work.
- Recorded the operator's necessary-rights statement and exact-scope acceptance of reviewed identifying metadata and non-Cumpa context. No deletion, rewrite or broader disclosure permission was inferred.
- Obtained Alessandro's personal exact-digest approval and the operator's subsequent witnessed report of Manuel's own approval of the same presented draft/disclosure. Preserved the actual events and their provenance rather than inventing Manuel's verbatim words or an external signature.

## Task Commits

1. Initial evidence and notice reconciliation — `48f6f24`.
2. Complete proprietary LICENSE draft — `83c55b3`.
3. Digest-bound dual-licensor approval record — `d64576a`.

Intermediate checkpoint/disposition records: `334f584`, `629a05e`, `8302b81`.

## Verified Bindings

| Artifact | SHA-256 |
|---|---|
| LICENSE | 889614622bf0bf5da0f7f543868fe9dc9ff568e22872edcfa7b03996a15ad29a |
| THIRD_PARTY_NOTICES.md | 847c9cb7c9e3585ed7ae518208ac934c5658f0fdb01ad2f2a20b50f56015d143 |
| Initial rights review | d65e5f780c5469757fefef685100a1d4bc6ceaded20b1234b010e8d2b8136e94 |
| License approval record | 1fe81efbda42d8955ba63a67f561a0840e6879126653eb9321ceb4734968bbf0 |

The first three hashes were recomputed before recording the final approval. The approval record was then hashed and committed. No application behavior changed, and no build or application test suite was run for this legal/documentary plan.

## Decisions and Evidence Limits

- Both approvals bind the unchanged 4,561-byte LICENSE and the applicable GitHub D.4/D.5/D.8 disclosure, including hosting/public access, in-platform forks and GitHub/affiliate AI-training-related implications. No no-AI-training promise is made.
- Manuel's approval source is Alessandro's actual statement, “he approved with me”, directly following the exact-license/disclosure approval request. It is a witnessed report of Manuel's personal co-approval, not independently authenticated correspondence. The approval record explicitly preserves that distinction.
- The bound rights review remains the initial snapshot; its pending-approval wording describes collection time. The later approval record is authoritative for the completed exact-text gate.

## Deviations from Plan

No scope or license-text change. Manuel's approval was supplied as a co-present witness report rather than a separately uploaded statement; its actual source and limits are recorded. There is no agent-authored assent or approval by Alessandro on Manuel's behalf.

## Issues Encountered

Initial rights and privacy questions required actual owner input; the operator resolved them. Both exact-text approvals are now recorded. No current Plan 03-01 blocker remains. Final remote exposure, protection, authentication and publication questions are not resolved by this plan.

## Requirement Scope and Next Plan Readiness

The frontmatter requirement IDs identify the completed plan contribution, not full milestone acceptance. Do not mark PKG-06 or PKG-07 complete in REQUIREMENTS.md from this plan alone: package metadata/documentation and actual public-source verification still depend on 03-02 and 03-03.

Ready for 03-02. Keep private:true and the existing files allowlist until Phase 4. Keep the repository's visibility, refs and protections unchanged until the separate Plan 03-03 authorizations. No push, publication, provider mutation or history rewrite occurred in this plan.
