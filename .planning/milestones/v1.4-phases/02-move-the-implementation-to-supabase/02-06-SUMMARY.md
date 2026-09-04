---
phase: 02-move-the-implementation-to-supabase
plan: 06
subsystem: runtime-support-gate
tags: [support, fastify, vue, cli, capabilities]

requires:
  - phase: 02-05
    provides: configured hosted support, restore, and browser support contracts
provides:
  - Explicit optional support metadata on pinned and exact-patch sessions
  - HTTPS-only support construction gate shared by app factories and CLI launch paths
  - Capability-driven browser support controls and polling
affects: [02-07, 02-11, support-runtime]

tech-stack:
  added: []
  patterns:
    - Decide optional hosted capabilities before their store or client is constructed
    - Advertise optional server capabilities in the session contract and gate browser work on that metadata

key-files:
  created: []
  modified:
    - src/contracts/api.ts
    - src/server/app.ts
    - src/server/capabilities.ts
    - src/cli/run.ts
    - src/web/App.vue
    - src/web/components/IdentityHeader.vue
    - tests/api/support.test.ts
    - tests/cli/request.test.ts
    - tests/cli/selection.test.ts
    - tests/integration/support-dialog.spec.ts

key-decisions:
  - "Only an explicit HTTPS CUMPA_SUPPORT_SERVICE_URL constructs hosted support; omitted and non-HTTPS values produce no capability."
  - "Session metadata is emitted only when the shared capability exists, and the browser uses it as its sole support enablement signal."

patterns-established:
  - "Optional capability gate: compose the concrete dependency only after validated configuration, then pass undefined through every default caller."
  - "Capability-driven UI: conditional session metadata controls controls, dialog mounting, refreshes, timers, and delayed prompts."

requirements-completed: [PAY-02, PAY-04, SUP-01, SUP-03, SUP-04, SUP-05]

duration: 10min
completed: 2026-08-17
status: complete
---

# Phase 02 Plan 06: Support-Free Local Runtime Summary

**HTTPS-gated hosted support capability leaves ordinary pinned, range, exact-patch, and attached local reviews free of support routes, browser work, and provider construction.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-08-17T05:51:30Z
- **Completed:** 2026-08-17T06:01:09Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Added a strict optional `{ enabled: true }` session capability shared by pinned and exact-patch responses, so support metadata and route availability agree.
- Centralized support composition behind a validated HTTPS configuration gate, including all CLI launch and session-app entry points.
- Suppressed absent-capability browser controls, dialog mounting, refreshes, timers, visibility handling, and prompts while preserving configured support behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — specify support-free local behavior across every entry point** - `99719dc` (test)
2. **Task 2: GREEN — gate capability construction and browser lifecycle** - `6d07ef4` (feat)
3. **Task 3: REFACTOR — retain one launch decision** - `eacec6a` (refactor)

**Plan metadata:** captured by the final documentation commit.

## Files Created/Modified

- `src/contracts/api.ts` - Defines optional support capability metadata for both session shapes.
- `src/server/app.ts` - Validates configuration before hosted support store/client construction.
- `src/server/capabilities.ts` - Emits metadata only with an actual support capability.
- `src/cli/run.ts` - Reuses one optional capability decision per launch path.
- `src/web/App.vue` - Gates all support UI lifecycle work on advertised capability metadata.
- `src/web/components/IdentityHeader.vue` - Renders the support control only for enabled sessions.
- `tests/api/support.test.ts` - Covers absent routes/metadata and configured metadata.
- `tests/cli/request.test.ts` - Covers range and attached local launch absence.
- `tests/cli/selection.test.ts` - Covers exact-patch local launch absence.
- `tests/integration/support-dialog.spec.ts` - Covers disabled UI/request absence and configured regression behavior.

## Decisions Made

- Accepted only explicit HTTPS service URLs before constructing hosted support dependencies; invalid, empty, and absent values retain a fully local runtime.
- Reused optional capability injection instead of adding a disabled implementation or fallback route.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking verification] Used the repository's focused Vitest invocation**
- **Found during:** Task 1 (RED — specify support-free local behavior across every entry point)
- **Issue:** The prescribed `npm test -- --run ...` command cannot run because `package.json` has no `test` script.
- **Fix:** Ran the same focused contracts with `npx vitest run` before the prescribed Playwright command.
- **Files modified:** None
- **Verification:** The corrected command proved RED before implementation and all focused Vitest and Playwright contracts passed after GREEN and REFACTOR.
- **Committed in:** N/A (verification command correction only)

---

**Total deviations:** 1 auto-fixed (1 blocking verification)
**Impact on plan:** No production scope changed; the corrected command executed the intended focused contracts.

## Issues Encountered

- The initial browser GREEN run exposed a Vue syntax error introduced while adding the refresh guard; restoring the function declaration resolved the compiler error, and all four browser contracts passed.
- `requirements.mark-complete` could not resolve the plan's IDs in the table-shaped `REQUIREMENTS.md`; the requirements remain Planned because later Phase 02 plans also own them.

## TDD Gate Compliance

- RED proof: `99719dc` captured the expected failures from unconditional support construction, routes, metadata, and UI.
- GREEN proof: `6d07ef4` passed 60 focused Vitest tests and 4 Playwright tests.
- REFACTOR proof: `eacec6a` retained one stdin launch decision and reran the same 60 focused Vitest tests and 4 Playwright tests.

## User Setup Required

None - no external service configuration required. Hosted support remains available only when the existing explicit HTTPS service URL is supplied.

## Next Phase Readiness

- Later runtime/package plans can rely on ordinary local reviews having no hosted support composition unless explicitly configured.
- No blockers.

## Self-Check: PASSED

- Summary file exists.
- Task commits `99719dc`, `6d07ef4`, and `eacec6a` exist in git history.

---
*Phase: 02-move-the-implementation-to-supabase*
*Completed: 2026-08-17*
