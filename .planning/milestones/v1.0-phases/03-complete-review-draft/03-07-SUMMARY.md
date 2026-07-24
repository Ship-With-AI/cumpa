---
phase: 03-complete-review-draft
plan: 07
subsystem: packaged-acceptance
tags: [playwright, real-git, monaco, fastify, draft-cas, recovery, selector-drift]
requires:
  - phase: 03-complete-review-draft
    provides: complete draft API, browser review lifecycle, recovery, and selector-drift behavior from plans 03-02 through 03-06
provides:
  - packaged real-Git and real-Monaco proof for the complete comment and summary lifecycle
  - two-tab aggregate-CAS proof with zero-write conflicts and retained local buffers
  - byte-preserving corrupt/newer draft, reveal-authority, and selector-drift acceptance
  - production wiring for the launch-owned canonical draft reveal adapter
affects: [phase-04-export, packaged-acceptance, draft-recovery, selector-drift]
tech-stack:
  added: []
  patterns: [package-first-playwright, independent-byte-snapshots, retained-buffer-cas-proof, launch-owned-reveal-capability]
key-files:
  created:
    - tests/e2e/complete-review-draft.spec.ts
  modified:
    - src/cli/run.ts
    - src/server/app.ts
    - src/web/App.vue
    - src/web/components/CommentsRail.vue
    - src/web/components/DiffWorkspace.vue
    - src/web/components/ReviewPanel.vue
    - src/web/components/ReviewToolbar.vue
    - tests/e2e/complete-review-draft.spec.ts
    - tests/helpers/git-fixture.ts
key-decisions:
  - Exercise Phase 3 only through the generated package, authenticated loopback API, real Git repositories, repository-local bytes, and real Monaco.
  - Keep draft reveal browser-authority-free by wiring a server-retained canonical path to a launch-owned opener adapter; the browser supplies no path, query, or body.
  - Treat asynchronous opener dispatch as success at response time and poll the test marker rather than assuming the child process has already run.
patterns-established:
  - Packaged acceptance observes canonical draft bytes, hashes, revisions, Git OIDs, and source state independently of UI claims.
  - Worktree drift tests activate a visible Monaco gutter affordance before retaining a local composer buffer.
requirements-completed: [CMT-03, CMT-04, CMT-05, CMT-06, CMT-07, DRFT-04, DRFT-05, DRFT-06]
duration: 1h 34m plus safe-resume recovery
completed: 2026-07-23
status: complete
---

# Phase 03 Plan 07: Packaged Complete Review Draft Summary

**The generated CLI, secured Fastify server, repository-local draft store, real Git fixtures, and real Monaco now prove the complete Phase 3 review lifecycle and its failure boundaries end to end.**

## Accomplishments

- Proved comment edit, cancel, save, resolve, reopen, hard-delete, grouping, counts, exact-anchor navigation, and one optional Markdown summary across close and same-comparison relaunch.
- Proved one aggregate expected-revision CAS across two tabs: stale mutations write zero canonical bytes, return the latest whole state, retain every attempted local buffer, and require explicit reload plus a fresh save.
- Proved corrupt recovery preserves exact bytes until verified backup-first replacement, injected backup/replacement failures preserve the original, and newer-schema drafts remain immutable and read-only.
- Proved branch and registered-worktree movement expose full pinned/current OIDs while comparison blobs, draft identity, anchors, Monaco, and unsaved composer buffers remain pinned.
- Proved secured fixed draft reveal and safe relative path copy without browser-selected filesystem authority, absolute-path leakage, source mutation, or Phase 4 export behavior.

## Task Commits

1. **Task 1 RED — packaged lifecycle proof** — `bef2e6b` (`test(03-07): add failing packaged lifecycle proof`)
2. **Task 1 GREEN — packaged review lifecycle** — `9465a0f` (`feat(03-07): prove packaged review lifecycle`)
3. **Task 2 RED — packaged draft safety proof** — `d78add2` (`test(03-07): prove packaged draft safety`)
4. **Task 2 GREEN — aggregate lifecycle/CAS proof** — `657df89` (`feat(03-07): complete packaged lifecycle CAS proof`)
5. **Safe-resume recovery — complete packaged safety acceptance** — `4efba07` (`fix(03-07): complete packaged safety acceptance`)

## Verification

Both reconciliation-ledger commands passed after safe-resume recovery:

- `03-07-task-1-packaged-lifecycle` resolved to `npm run test:package -- tests/e2e/complete-review-draft.spec.ts --grep complete draft lifecycle|two-tab conflict` and passed 3/3 Chromium scenarios.
- `03-07-task-2-packaged-safety` resolved to `npm run test:package -- tests/e2e/complete-review-draft.spec.ts --grep corrupt|newer|drift|security|reveal` and passed 5/5 Chromium scenarios.

The package setup rebuilt Node and Vue production output, verified the production artifact allowlist, packed the npm artifact, extracted it, launched its generated executable, and drove the real authenticated browser session.

## Safety Evidence

| Contract | Packaged observation |
|---|---|
| Aggregate CAS | Two independent tabs mutate one comparison-specific draft; the stale tab receives the latest canonical state and performs no write. |
| Local buffer retention | Attempted comment and summary text survives conflict, reload-latest, panel/file transitions, and pinned selector-drift notices until explicit continuation. |
| Corrupt recovery | Original Buffer, length, SHA-256, and file snapshot remain unchanged on cancel and injected failures; successful recovery verifies an identical backup before replacement. |
| Newer schema | Load is safe and read-only; mutation and recovery return conflicts; canonical bytes, hash, size, timestamp, source tree, index, and HEAD remain unchanged. |
| Reveal authority | Host, Origin, token, body, query, and arbitrary-path probes fail before opener work; the accepted call opens only the server-retained canonical draft path. |
| Selector drift | Moved branch/worktree states expose complete old/new OIDs; unavailable worktrees expose no fabricated new OID; pinned content and local composer state remain intact. |
| Exclusions | No soft delete, undo, threads, replies, automatic merge, force overwrite, fuzzy relocation, source mutation, or Phase 4 export route/control/artifact exists. |

## Decisions Made

- Added the draft reveal adapter at CLI launch rather than in browser/API input. `src/cli/run.ts` owns `open(canonicalPath)` and injects it into the fixed server capability.
- Kept recovery fault injection process-local and test-only: it activates only under `NODE_ENV=test` and never adds a production debug route or browser-selected path.
- Used explicit API response algebra in the newer-draft scenario: authenticated load returns the safe read-only descriptor, while mutation and recovery return `409`.

## Deviations from Plan

### Auto-fixed Issues

**1. Safe-resume anomaly — prior executor commits existed without a summary**
- **Found during:** workflow safe-resume gate.
- **Issue:** Four `03-07` RED/GREEN commits existed while `03-07-SUMMARY.md` was missing, and planned files still contained uncommitted acceptance work.
- **Fix:** Chose the workflow's manual closeout path, inspected the commits, completed the remaining acceptance wiring, ran both approved commands, and created this summary without redispatching duplicate work.
- **Verification:** Both reconciliation-ledger commands pass.

**2. Missing production reveal wiring**
- **Found during:** Task 2 packaged newer/reveal scenario.
- **Issue:** The secured reveal route existed, but packaged CLI launch did not inject a `DraftRevealPort`, so the route always returned `revealFailed`.
- **Fix:** Added `src/cli/run.ts` to the modified set and injected a launch-owned opener over the draft store's canonical path.
- **Verification:** The packaged reveal scenario returns `{"kind":"revealed"}` and the external opener marker confirms dispatch.

**3. Acceptance harness contract/race defects**
- **Found during:** Task 2 packaged safety verification.
- **Issue:** The raw newer-draft mutation used `summary` instead of contract field `markdown`; the fake opener was not executable and conflated browser URL launch with draft reveal; the test assumed the detached opener completed before the HTTP response; worktree drift activated a transient line locator without first creating a visible gutter affordance.
- **Fix:** Corrected the payload, made the fake opener executable and target-aware, polled its marker, and explicitly hovered/clicked the visible head-side Monaco gutter action.
- **Verification:** Focused newer/worktree scenarios passed 2/2 before the complete 5/5 safety command.

**Total deviations:** 3 auto-fixed (1 safe-resume recovery, 1 missing critical production wiring, 1 blocking acceptance-harness repair).

**Impact on plan:** All changes were necessary to prove the specified packaged behavior. No deferred feature, source mutation, dependency, production debug API, or Phase 4 export behavior was added.

## Issues Encountered

- The initial safe-resume state contained valid-looking RED/GREEN commits but no summary and three planned files with uncommitted work. The workflow correctly blocked executor redispatch until manual recovery was selected.
- The macOS `open` adapter dispatches without waiting by default. The route can truthfully report accepted dispatch before the fake child writes its marker, so the test now polls the external observation.

## User Setup Required

None — no external service or configuration is required.

## Next Phase Readiness

- Phase 3's complete review draft contract has packaged proof for all eight requirement IDs and the D-01–D-17 decisions.
- Phase 4 can consume canonical draft comments and summary state without changing the Phase 3 mutation, recovery, selector-drift, or reveal authority boundaries.
- No unresolved blocker remains in Plan 03-07.

## Self-Check: PASSED

- `tests/e2e/complete-review-draft.spec.ts` exists and both approved focused commands pass.
- All five plan commits are present.
- No Phase 4 export artifact or direct source mutation was introduced.

---
*Phase: 03-complete-review-draft*
*Completed: 2026-07-23*
