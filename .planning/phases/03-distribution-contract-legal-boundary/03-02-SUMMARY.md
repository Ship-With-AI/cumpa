---
phase: 03-distribution-contract-legal-boundary
plan: 02
subsystem: distribution
tags: [npm, package-metadata, documentation, provenance]
requires:
  - phase: 03-01
    provides: Approved exact proprietary LICENSE, resolved initial rights review and reconciled notices
provides:
  - Guarded @shipwithai/cumpa@1.5.0 manifest and root-lock identity
  - Self-contained conditional release and review guidance
  - Bounded Phase 3-to-5 artifact/publication/provenance evidence policy
affects: [03-03, phase-04, phase-05, phase-06]
tech-stack:
  added: []
  patterns: [Immutable artifact evidence, Conditional availability claims]
key-files:
  created: [docs/distribution-operations.md]
  modified: [package.json, package-lock.json, README.md]
key-decisions:
  - Retain private publication guard and the existing allowlist until the Phase 4 artifact cutover.
  - Use only the existing repository and its Issues tracker, without a homepage or premature public-access claim.
  - Preserve eligible automatic provenance but require the actual exact-subject attestation before claiming it.
requirements-completed: [PKG-06, PKG-07, REL-04, REL-05]
duration: 12min
completed: 2026-09-07
status: complete
---

# Phase 03 Plan 02: Guarded Package Identity and Truthful Guidance

**The approved license now backs coherent guarded package metadata and one consumer guide, without claiming a published package, public repository or emitted provenance.**

## Performance

- Started: 2026-09-07T18:09:22.185Z.
- Completed: 2026-09-07T18:21:01.592Z.
- Elapsed: 12 minutes, rounded up.
- Tasks: 2/2.
- Deliverable files: 4.

## Accomplishments

- Set manifest/root-lock name and version to `@shipwithai/cumpa@1.5.0`, with `SEE LICENSE IN LICENSE`, the existing repository and its exact Issues URL. No homepage was added.
- Preserved the private guard, both allowlist entries, compiled bin, Node >=24, every script, exact direct/dev dependency pin and every transitive lock entry.
- Replaced source-checkout build/link and bundled-skill installation directions with conditional exact-version global/npx commands. Kept existing review, persistence, export, shortcut and revision/patch handoff contracts.
- Explained proprietary source availability, independent notices, separate MIT skill distribution and feature-neutral support without inventing broader grants or a support commitment.
- Added the compact maintainer policy separating legal assent, private preparation, final public-source authorization, immutable Phase 4 artifact evidence and actual Phase 5 registry/OIDC/attestation evidence.

## Task Commits

1. Guarded metadata — `69ff9c9`.
2. User guidance and maintainer policy — `b955fe8`.

## Verification

- Whole-object comparison against the pre-task manifest proved only the intended metadata fields changed.
- Whole-object comparison against the pre-task lockfile proved only top-level/root identity and root license changed; all 254 dependency locations are unchanged.
- The planned read-only Node assertions passed for coherent manifest/root-lock identity, preserved guard/allowlist/bin/engine, required documentation links/commands/policy boundaries, absent homepage, and unchanged approved LICENSE SHA-256 `889614622bf0bf5da0f7f543868fe9dc9ff568e22872edcfa7b03996a15ad29a`.
- Source checks found no package-name consumer requiring migration; the remaining unscoped name examples are unrelated prototype JSON fixtures and were not changed.
- Documentation review retained conditional registry/public-access claims, separate third-party rights, no invented contact surface and no unsupported provenance assertion.
- No build, package/install/publish operation, linter or application test suite was run. No permanent tests, dependencies, application behavior or release machinery were added.

## Deviations from Plan

None. Existing README behavior/reference sections were preserved while replacing the obsolete installation/distribution sections in place.

## Issues Encountered

None. Future registry availability and final GitHub exposure/protection decisions remain intentionally unproven, not waived.

## Requirement Scope and Next Plan Readiness

Frontmatter IDs identify this plan's contribution. Do not mark the four Phase 3 requirements globally complete until Plan 03-03 supplies the required actual public-source/Issues evidence and Phase 3 verification passes. Phase 5 still owns real package and provenance evidence.

Ready for 03-03's read-only final source/GitHub inventory. No private push, protection change, repository visibility change, npm mutation or other external mutation has been authorized by completing this plan.
