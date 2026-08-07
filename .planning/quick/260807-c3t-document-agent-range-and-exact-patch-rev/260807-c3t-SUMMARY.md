---
phase: quick
plan: 260807-c3t
subsystem: documentation
tags: [readme, agent-review, cli, zod]
requires:
  - phase: 12-agent-request-protocol
    provides: strict v1 revision request contract
  - phase: 13-exact-patch-review
    provides: strict exact-patch request contract
  - phase: 14-attached-agent-lifecycle
    provides: Finish delivery and isolated session lifecycle
provides:
  - Coding-agent review how-to and compact strict request reference
  - Schema-validated revision and exact-patch JSON examples
affects: [README, coding-agent handoff]
tech-stack:
  added: []
  patterns: [Diátaxis how-to followed by compact reference]
key-files:
  created: [.planning/quick/260807-c3t-document-agent-range-and-exact-patch-rev/260807-c3t-SUMMARY.md]
  modified: [README.md]
key-decisions:
  - "Documented only shipped agent protocol behavior and kept interactive review guidance authoritative."
  - "Used Node readFileSync plus JSON.stringify for the patch wrapper to avoid shell interpolation."
patterns-established:
  - "Agent request examples are marked and validated through AgentReviewRequestSchema."
requirements-completed: [QUICK-260807-C3T]
duration: not-recorded
completed: 2026-08-07
status: complete
---

# Quick Task 260807-c3t: Coding-Agent Review Protocol Summary

**README how-to for pinned revision ranges and exact patches, with strict v1 request examples and attached Finish delivery semantics.**

## Performance

- **Duration:** Not recorded
- **Completed:** 2026-08-07T07:03:46Z
- **Tasks:** 2
- **Product files modified:** 1

## Accomplishments

- Added the five approved coding-agent subsections in the required order.
- Documented safe Node-based range and byte-preserving patch request invocations with separate canonical stdout capture.
- Recorded dispatch, Finish, exit, request-validation, isolation, and frozen-snapshot contracts from the shipped sources.

## Task Commit

1. **Task 1: Add the coding-agent range and exact-patch how-to** — `4cc0bed` (`docs(260807-c3t): document agent review protocol`)
2. **Task 2: Mechanically validate examples and audit protocol claims** — no code commit; verification-only task completed against the README commit.
3. **Follow-up: Render request markers neutrally** — `7c16851` (`docs(260807-c3t): hide request example markers`)

## Files Created/Modified

- `README.md` — focused Diátaxis how-to and compact reference for coding-agent review requests.
- `.planning/quick/260807-c3t-document-agent-range-and-exact-patch-rev/260807-c3t-SUMMARY.md` — execution evidence; intentionally uncommitted.

## Verification

Passed the two plan-scoped, read-only Node checks before and after converting both request markers to HTML comments:

1. README heading-order and required-token check — passed with no output.
2. Marked `revisions` and `patch` JSON examples parsed through `AgentReviewRequestSchema` with their expected modes — passed with no output.

Focused source-to-document audit used only `src/contracts/request.ts`, `src/cli/request.ts`, `src/cli/run.ts`, and `tests/cli/request.test.ts`. No formatter, linter, build, typecheck, Vitest, Playwright, package test, CLI/browser scenario, or project-wide validation was run.

## Decisions Made

- Kept the existing interactive picker and export documentation unchanged; the new section describes only the TTY/non-TTY dispatch boundary.
- Used JSON examples matching the strict shipped Zod union, including ordered pathspecs and a repository-grounded exact patch.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Documentation bug] Rendered request-example markers neutrally**
- **Found during:** Post-execution verification
- **Issue:** The marker text was visible in rendered README output.
- **Fix:** Converted both markers to HTML comments without changing the extractor contract.
- **Files modified:** `README.md`
- **Verification:** Both focused Node checks passed again.
- **Committed in:** `7c16851`

## Issues Encountered

None.

## Self-Check: PASSED

- README commits `4cc0bed` and `7c16851` exist and each contains only `README.md`.
- This summary exists with `status: complete` and remains uncommitted as required.

## Next Steps

No follow-up required.
