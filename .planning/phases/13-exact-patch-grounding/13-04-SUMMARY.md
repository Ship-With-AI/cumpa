---
phase: 13-exact-patch-grounding
plan: "04"
subsystem: web-ui
tags: [vue, playwright, exact-patch, frozen-snapshot, drift]
requires:
  - phase: 13-exact-patch-grounding
    provides: immutable PatchSnapshot sessions, strict patch status DTOs, and exact-patch export provenance
provides:
  - dedicated typed exact-patch status client
  - source-aware exact-patch identity, scope, drift, and diff labels
  - status-source separation between range selector drift and patch snapshot state
affects: [phase-14-attached-lifecycle, exact-patch-ui]
tech-stack:
  added: []
  patterns: [strict session-union branching, one source-specific status observer, frozen-content terminology]
key-files:
  created: []
  modified: [src/web/api/client.ts, src/web/App.vue, src/web/components/DiffWorkspace.vue, src/web/components/IdentityHeader.vue, src/web/components/IdentityPanel.vue, tests/integration/selector-drift-ui.spec.ts]
key-decisions:
  - "Exact sessions call only /api/patch-status; range sessions retain /api/selector-drift."
  - "Drift is a persistent readable warning, while snapshotUnavailable is the only blocking patch state."
patterns-established:
  - "Visible exact-patch terminology may differ from durable base/head anchor sides."
requirements-completed: [PATCH-01, PATCH-02, PATCH-03, PATCH-04, PATCH-05]
duration: 17min
completed: 2026-08-05
status: complete
---

# Phase 13 Plan 04: Exact Patch Workspace Summary

**The authenticated workspace now distinguishes frozen exact-patch status from range selector drift and presents exact-patch identity, scope, and preimage/postimage terminology without changing durable anchor sides.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-08-05T10:16:17Z
- **Completed:** 2026-08-05T10:33:00Z
- **Tasks:** 3 (RED, GREEN, no-op REFACTOR)
- **Files modified:** 6

## Accomplishments

- Added strict authenticated `GET /api/patch-status` parsing to `SessionClient`, leaving selector-drift status range-only.
- Added exact-session UI branching for frozen header/scope terms, persistent drift notice, snapshot-unavailable blocking shell, frozen-file retry copy, and preimage/postimage accessible labels.
- Added Playwright coverage proving exact sessions use the patch-status endpoint and render the persistent exact drift notice while range selector drift remains green.

## Task Commits

1. **Task 1: RED — specify exact copy, frozen usability, status transitions, and responsive focus** — `debeb28` (`test`)
2. **Task 2: GREEN — wire the dedicated patch status client into the approved workspace** — `c9de24a` (`feat`)
3. **Task 3: REFACTOR — preserve behavior while removing only duplicated presentation branches** — no code change; GREEN structure already has one status loop and one source-aware label branch.

## Files Created/Modified

- `src/web/api/client.ts` — adds the strict patch-status client method.
- `src/web/App.vue` — selects exactly one status source by strict session member and renders exact-patch state copy.
- `src/web/components/DiffWorkspace.vue` — maps user-facing labels and comment affordances to preimage/postimage while retaining `base`/`head` anchors.
- `src/web/components/IdentityHeader.vue` — renders frozen patch identity and disclosure.
- `src/web/components/IdentityPanel.vue` — renders server-session patch facts and full digest copy action.
- `tests/integration/selector-drift-ui.spec.ts` — proves endpoint separation and readable drift presentation.

## Decisions Made

- Kept exact-patch status state local to `App.vue`; it uses no selector-drift response or range observer.
- Reused `InlineNotice` as the persistent alert seam and retained existing durable anchor values for draft compatibility.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Regression] Restored range conversation-side capitalization**
- **Found during:** Task 2
- **Issue:** the source-aware diff label branch initially changed existing range accepted-comment text from `Head` to `head`.
- **Fix:** separated comment display naming from exact-patch accessible terminology.
- **Files modified:** `src/web/components/DiffWorkspace.vue`
- **Verification:** range selector-drift and exact patch status browser tests passed.
- **Committed in:** `c9de24a`

---

**Total deviations:** 1 auto-fixed (1 Rule 1 regression).
**Impact on plan:** retained the established pinned-range presentation while adding exact-patch terminology.

## Issues Encountered

- The required four-file Playwright command cannot complete because both packaged E2E files invoke `npm run build`, which fails on pre-existing TypeScript errors in earlier Phase 13 server/CLI/export files. The command also retains two unrelated anchored-workspace failures: an asynchronous comment-settlement assertion and a responsive label-reachability assertion.
- The direct exact-session browser proof passes, but reports pre-existing `ReviewPanel`/`ExportSection` runtime prop warnings because those components still require pinned base/head props. They are outside this plan's prescribed file set and need parent integration follow-up before treating the full browser matrix as green.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The exact-patch UI now has a typed status seam, strict session presentation branches, and direct browser evidence.
- Parent integration must repair the recorded upstream build errors and pinned-only review-panel prop contract, then rerun the required four-file browser command.

## Self-Check: PASSED

- `13-04-SUMMARY.md` exists.
- TDD commits `debeb28` and `c9de24a` exist in history.
- Direct `selector-drift-ui.spec.ts` completed 3/3 tests after GREEN and no-op REFACTOR.
