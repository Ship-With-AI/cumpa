---
phase: quick
plan: 260724-cg0
subsystem: documentation
tags: [readme, local-source, git-review, export]
requires:
  - phase: 04-agent-ready-export
    provides: "Pinned local comparison, review persistence, and export contracts"
provides:
  - "Accurate local-source user journey for Diff Review"
  - "Audited CLI, browser, persistence, export, shortcut, and file-limit reference"
affects: [developer-onboarding, local-review-workflow]
tech-stack:
  added: []
  patterns:
    - "User-facing claims are grounded in implemented source contracts"
key-files:
  created: [README.md]
  modified: []
key-decisions:
  - "Document only the private local-source install path; do not imply registry publication."
  - "Keep hashed draft identity distinct from ordered-OID export paths."
patterns-established:
  - "README launch guidance distinguishes saved accepted state from unsaved tab buffers."
requirements-completed: [QUICK-260724-CG0]
metrics:
  duration: session
  completed: 2026-07-24
status: complete
---

# Quick Task 260724-cg0: User-facing README Summary

**A local-source guide now takes developers from building Diff Review through pinned review, durable feedback, export, shortcuts, and v1 file boundaries.**

## Performance

- **Tasks:** 2/2
- **Implementation files modified:** 1 (`README.md`)
- **Planning artifacts committed:** None — explicitly excluded by the task constraint.

## Accomplishments

- Added a copy-pasteable private local-source setup and target-worktree launch journey.
- Documented ordered base/head selection, merge-base-to-head pinning, browser review, repository-local drafts, and accepted-revision exports.
- Audited every user-facing claim against the listed contracts, including all keyboard shortcuts and file-availability classifications.

## Task Commits

1. **Task 1: Write the local Diff Review user journey** — `88984cb` (`docs`)
2. **Task 2: Audit every user-facing claim against implementation** — `ce8028e` (`docs`)

## Files Created/Modified

- `README.md` — User-facing local installation, launch, review, persistence, export, shutdown, keyboard shortcut, and v1-limit guide.

## Verification

- **Task 1 focused README assertion:** Passed — required install, launch, persistence, export, shortcut, and limit tokens are present.
- **Task 2 focused contract assertion:** Passed — package privacy/version/Node contract, full shortcut list, limits, exact draft/export paths, and no registry-install claim were verified.
- **Scope:** The two implementation commits change only `README.md`.

## Decisions Made

- Kept installation guidance limited to `npm ci`, `npm run build`, and local `npm link` from the source checkout.
- Described draft storage as a 64-hex ordered-comparison key and exports as literal `<baseOid>..<headOid>` paths.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The first Task 2 assertion found that the prose used `missing-object` without the expected human-readable `missing object` phrase. The audit updated the classification copy, then the focused assertion passed.

## Next Phase Readiness

- README is ready for local developers; no source or test changes were needed.

## Self-Check: PASSED

- Summary exists at the requested quick-task path.
- Both task commits exist and the implementation change scope is limited to `README.md`.
