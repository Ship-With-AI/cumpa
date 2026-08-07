---
phase: 12-request-protocol-range-grounding
plan: 01
subsystem: cli-contracts
tags: [typescript, zod, vitest, stdin, utf-8]
requires:
  - phase: 11-production-performance-gate
    provides: Existing Node 24 TypeScript CLI and Vitest conventions
provides:
  - Strict versioned revisions-only agent request schema
  - Bounded EOF-delimited UTF-8 request reader with safe typed failures
affects: [12-02, 12-03, agent-review-handoff]
tech-stack:
  added: []
  patterns: [byte-first bounded input, fatal UTF-8 then single JSON parse, strict Zod protocol schema]
key-files:
  created: [src/contracts/request.ts, src/cli/request.ts, tests/cli/request.test.ts]
  modified: []
key-decisions:
  - "Use one strict Zod schema and inferred public type for the revisions-only request wire contract."
  - "Bound raw chunks before retention, then fatal-decode once and parse one EOF-delimited JSON document."
patterns-established:
  - "Agent input errors expose stable categories and messages without request content or parser details."
requirements-completed: [AGENT-01, AGENT-02]
duration: 10min
completed: 2026-08-04
status: complete
---

# Phase 12 Plan 01: Bounded Versioned One-Request Protocol Summary

**Strict, immutable revisions-only agent request validation with bounded raw input, fatal UTF-8 decoding, and one-document JSON framing.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-08-04T18:30:00Z
- **Completed:** 2026-08-04T18:40:14Z
- **Tasks:** 3/3
- **Files modified:** 3

## Accomplishments

- Added the public Zod-inferred `cumpa.review-request` v1 contract with immutable revisions and ordered pathspecs.
- Added a byte-first, one-MiB reader that rejects empty, oversized, invalid UTF-8, malformed, unsupported-version, and invalid requests without reflecting input.
- Captured RED, GREEN, and no-op REFACTOR evidence through one focused 21-case Vitest matrix.

## Task Commits

| Task | Commit | Outcome |
| --- | --- | --- |
| 1. RED — specify the bounded strict request contract | `b0983f5` | Failing focused matrix: missing `src/contracts/request.js` before production code existed. |
| 2. GREEN — implement byte-first decoding and strict Zod authority | `9266a0e` | 21 focused tests passed. |
| 3. REFACTOR — freeze the smallest safe protocol surface | No code change | No-op: GREEN has one schema, one accumulation path, one decode/parse boundary, and one error mapping; 21 focused tests passed unchanged. |

## Files Created/Modified

- `src/contracts/request.ts` — protocol bounds, strict immutable request schema, and inferred request type.
- `src/cli/request.ts` — bounded asynchronous byte reader and typed safe request errors.
- `tests/cli/request.test.ts` — framing, byte-cap, UTF-8, strict-schema, exclusivity, immutability, and pathspec-order matrix.

## Protocol Contract

- `MAX_AGENT_REQUEST_BYTES = 1_048_576`
- `MAX_GIT_ARGUMENT_BYTES = 4_096`
- `MAX_PATHSPEC_COUNT = 256`
- Error categories: `empty-request`, `request-too-large`, `invalid-utf8`, `malformed-json`, `unsupported-version`, and `invalid-request`.

## Verification

- **RED:** `npm exec -- vitest run tests/cli/request.test.ts` exited 1 because the new request modules did not exist; no fixture or unrelated-suite failure occurred.
- **GREEN:** `npm exec -- vitest run tests/cli/request.test.ts` exited 0 with 21/21 tests passing.
- **REFACTOR:** The identical command exited 0 with 21/21 tests passing. The injected cap-plus-one generator proves the reader stops before a third chunk; split invalid UTF-8 is exercised across two chunks.
- The focused command launches no browser, Git operation, formatter, linter, package install, or project-wide suite.

## Decisions Made

- The protocol accepts exactly one EOF-delimited document; it does not add NDJSON, streaming JSON parsing, a CLI flag, or an adapter layer.
- Values are validated but never normalized, sorted, deduplicated, or interpreted at this boundary.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Repaired stale planning position after state handler rejection**
- **Found during:** Plan closeout
- **Issue:** `state.advance-plan` could not parse the pre-existing `Plan: Not planned` position; the installed handlers also require named flags rather than the executor protocol's documented positional syntax.
- **Fix:** Used the working named state handlers for metrics, decisions, session, roadmap, and requirements, then updated only the stale Current Position fields to reflect plan 1 of 6.
- **Files modified:** `.planning/STATE.md`
- **Verification:** `state.update-progress` reported 1/6 summaries (17%), and `roadmap.update-plan-progress 12` reported 1/6 in progress.
- **Committed in:** Final plan metadata commit.

---

**Total deviations:** 1 auto-fixed (1 blocking workflow-state issue).
**Impact on plan:** No application behavior or plan scope changed.

## Issues Encountered

None.

## TDD Gate Compliance

- RED commit `b0983f5` precedes GREEN commit `9266a0e`.
- REFACTOR was explicitly a no-op because no duplication or mutable public surface remained after GREEN.

## Next Phase Readiness

- Plan 12-02 and Plan 12-03 can reuse `AgentReviewRequestSchema` and `readAgentReviewRequest` without introducing another request parser or request type.
- No blocker or user setup is required.

## Self-Check: PASSED

- Confirmed all three plan artifacts exist.
- Confirmed RED commit `b0983f5` and GREEN commit `9266a0e` exist in Git history.
