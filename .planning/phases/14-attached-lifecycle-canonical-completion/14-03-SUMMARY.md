---
phase: 14-attached-lifecycle-canonical-completion
plan: "03"
subsystem: cli
tags: [cli, fastify, attached-review, canonical-json, playwright, vitest]
requires:
  - phase: 14-attached-lifecycle-canonical-completion
    provides: Attached Finish coordinator, typed outcomes, and browser lifecycle UI
provides:
  - One shared non-TTY range/exact-patch attached launcher
  - Awaited byte-exact canonical stdout delivery before response settlement and shutdown
  - Packaged browser evidence for explicit Finish-only range completion
affects: [attached-review-handoff, phase-15-adversarial-integration-gate]
tech-stack:
  added: []
  patterns:
    - CLI owns stdout while the server owns Finish validation and canonicalization
    - Retry-safe coordinator outcomes leave the process waiting; delivery ambiguity is terminal
key-files:
  created: []
  modified: [src/cli/run.ts, tests/cli/request.test.ts, tests/unit/review-export.test.ts, tests/e2e/agent-ready-export.spec.ts, tests/package/agent-ready-export.test.ts]
key-decisions:
  - "Pass Plan 14-01 canonical bytes directly to the injected stdout sink; do not parse, serialize, or append a delimiter."
  - "Use the coordinator delivery and response-settlement promises as the only successful handoff ordering signals."
patterns-established:
  - "Attached non-TTY sessions reuse one loopback launcher for range and exact-patch factories."
requirements-completed: [HAND-01, HAND-02, HAND-03, HAND-04, HAND-05]
duration: N/A
completed: 2026-08-05
status: complete
---

# Phase 14 Plan 03: Attached Lifecycle Canonical Completion Summary

**Non-TTY range and exact-patch reviews now stay attached until explicit Finish produces one unchanged canonical document on stdout.**

## Performance

- **Duration:** N/A (start timestamp was not recorded by this executor)
- **Completed:** 2026-08-05T17:38:44Z
- **Tasks:** 3/3
- **Files modified:** 5

## Accomplishments

- Replaced ordinary non-TTY launch with one attached range/exact-patch lifecycle that injects the Plan 14-01 coordinator and an awaited stdout byte sink.
- Preserved retry-safe refusal waiting while treating delivery failure, signal, server, and browser-launch failure as one idempotent nonzero shutdown path.
- Added focused CLI and packaged Chromium coverage for response ordering, empty revision-zero completion, channel isolation, canonical V2 bytes, and no trailing newline.

## Task Commits

1. **Task 1: RED — pin bytes, channels, shared outcomes, and process ordering** — `75d7bf7` (test)
2. **Task 2: GREEN/REFACTOR — attach both modes and implement wait-versus-terminal delivery** — `d1656b2` (feat)
3. **Task 3: GREEN/REFACTOR — prove packaged/browser zero-feedback, retry-safe refusal, and terminal safety** — `58d50a3` (test)

## Files Created/Modified

- `src/cli/run.ts` — shared attached launcher, awaited stdout transport, response-settlement ordering, and terminal shutdown.
- `tests/cli/request.test.ts` — range waiting/recovery/success ordering and exact-patch terminal-delivery coverage.
- `tests/unit/review-export.test.ts` — V2/V3 no-trailing-newline canonical-byte regression assertions.
- `tests/e2e/agent-ready-export.spec.ts` — packed non-TTY range, Finish-only revision-zero handoff, and stdout/stderr isolation.
- `tests/package/agent-ready-export.test.ts` — confines nested package evidence to its owning browser spec.

## Decisions Made

- CLI writes the coordinator-supplied `Uint8Array` as-is, so canonical V2/V3 generation remains solely in the server capability path.
- Success waits for the stdout callback and then the Fastify response settlement latch before shutdown; a delivery rejection cannot be retried or reported as completion.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Scoped nested package browser evidence to its owning spec**
- **Found during:** Task 3 package verification.
- **Issue:** The package evidence test invoked every browser suite, contrary to the plan-scoped verification constraint and vulnerable to unrelated suite failures.
- **Fix:** Ran only `tests/e2e/agent-ready-export.spec.ts`, which contains the packaged attached completion scenario.
- **Files modified:** `tests/package/agent-ready-export.test.ts`
- **Verification:** Both package suites pass together.
- **Committed in:** `58d50a3`

---

**Total deviations:** 1 auto-fixed (1 blocking). **Impact:** Keeps package evidence isolated to the contract it owns; no production scope changed.

## Issues Encountered

- The first package-safety execution occurred before the production artifact contained `dist/server/gitignore-capability.js`; rebuilding through the scoped browser suite restored the generated artifact, and the required combined package check passed.

## User Setup Required

None - no external service configuration required.

## Verification

- `npm exec -- vitest run tests/unit/review-export.test.ts tests/cli/request.test.ts` — passed: 2 files, 46 tests.
- `npm exec -- vitest run tests/package/agent-ready-export.test.ts tests/package/agent-ready-export-safety.test.ts` — passed: 2 files, 12 tests.
- `npm exec -- playwright test tests/e2e/complete-review-draft.spec.ts tests/e2e/agent-ready-export.spec.ts tests/e2e/agent-ready-export-safety.spec.ts` — passed: 12 Chromium tests.

## Next Phase Readiness

- Phase 14 has complete attached CLI/browser transport evidence and is ready for phase verification.
- No implementation blocker remains.

## Self-Check: PASSED

- Confirmed all three task commits exist and all plan-scoped verification commands pass.
- Confirmed successful range output is one canonical V2 document without a trailing newline; the shared exact-patch path uses the identical stdout transport with V3 bytes.

---
*Phase: 14-attached-lifecycle-canonical-completion*
*Completed: 2026-08-05*
