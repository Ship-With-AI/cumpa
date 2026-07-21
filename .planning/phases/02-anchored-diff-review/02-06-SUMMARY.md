---
phase: 02-anchored-diff-review
plan: 06
subsystem: ui
tags: [vue, monaco, playwright, anchored-comments, draft-resume]

requires:
  - phase: 02-anchored-diff-review
    provides: canonical anchor persistence, draft API contracts, and Monaco diff adapter
provides:
  - Inline anchored-comment composer with explicit save, discard confirmation, and recoverable persistence errors
  - Draft hydration into the review workspace and a deterministic comments rail for verified, stale, and orphaned anchors
  - Browser coverage for inline comment persistence and empty-draft anchor-state startup
  - Public Monaco adapter controls for clearing and inspecting the active anchor
  
affects: [02-07, browser-review-flow, export]

tech-stack:
  added: []
  patterns:
    - Vue workspace commands persist only canonical API comment responses
    - Draft comments are rehydrated into opaque workspace file identifiers before rendering
    - Monaco active anchor state is exposed through narrow adapter methods for Vue orchestration

key-files:
  created:
    - src/web/components/CommentComposer.vue
    - src/web/components/CommentsRail.vue
  modified:
    - src/web/App.vue
    - src/web/api/client.ts
    - src/web/components/DiffWorkspace.vue
    - src/web/monaco/diff-adapter.ts
    - src/web/styles.css
    - tests/integration/anchored-workspace.spec.ts

key-decisions:
  - "Persist only the server-returned canonical comment; never synthesize client-side accepted comments."
  - "Order the comments rail by session file order, side, and line to make review navigation predictable."
  - "Expose only clear/get active-anchor operations from the Monaco adapter so Vue can dismiss and synchronize composer state."

patterns-established:
  - "Anchored composer: its text, validation, pending, and recoverable error state belong to WorkspaceState."
  - "Draft resume: resolve recorded safe display paths against current session capabilities before supplying an opaque file ID to the workspace."

requirements-completed: [DIFF-02, DIFF-03, DIFF-04, DIFF-05, DIFF-07, CMT-01, CMT-02, CMT-08, DRFT-01, DRFT-02, DRFT-03]

duration: 10min
completed: 2026-07-21
status: complete
---

# Phase 02: Anchored Diff Review Summary

**Inline Vue/Monaco comment composition now persists canonical anchors, restores draft comments, and exposes a deterministic review rail.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-07-21T12:57:32Z
- **Completed:** 2026-07-21T13:06:13Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added accessible inline comment composition with keyboard handling, validation, discard confirmation, pending feedback, and an explicit recoverable-save error.
- Used strict Zod API parsing and accepted only the canonical comment record returned by the persistence endpoint.
- Restored draft comments into workspace state and added a deterministic comments rail with verified, stale, and orphaned presentations and navigation actions.
- Exercised the browser paths for comment persistence and empty-draft startup without relevant browser failures.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the inline comment composer and persistence flow** - `4f777dd` (feat)
2. **Task 2: Restore the draft and add comments rail navigation** - `72b3836` (feat)

**Plan metadata:** Included in the final documentation and tracking commit.

## Files Created/Modified

- `src/web/api/client.ts` - Strictly parses canonical comment and draft API responses.
- `src/web/App.vue` - Hydrates drafts, coordinates workspace commands, and renders the comments rail.
- `src/web/components/DiffWorkspace.vue` - Couples the Monaco surface to composer state and anchor navigation.
- `src/web/components/CommentComposer.vue` - Provides the inline draft, save, error, and discard-confirmation controls.
- `src/web/components/CommentsRail.vue` - Lists comments in deterministic order and presents anchor-state actions.
- `src/web/monaco/diff-adapter.ts` - Exposes active-anchor inspection and clearing for the Vue owner.
- `src/web/styles.css` - Styles accessible composer, accepted-comment, rail, and overlay layering states.
- `tests/integration/anchored-workspace.spec.ts` - Covers inline persistence and draft/anchor startup browser flows.

## Decisions Made

- Canonical server responses, not client-generated records, are the only comments dispatched as persisted workspace state.
- The comments rail sorts by the current session file order, then side and line, preventing nondeterministic navigation.
- The adapter owns Monaco mechanics while the Vue workspace owns composer state and save lifecycle.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Exposed the Monaco adapter's active-anchor lifecycle**
- **Found during:** Task 1 (Build the inline comment composer and persistence flow)
- **Issue:** The plan required App and DiffWorkspace to dismiss and synchronize the active composer, but the adapter kept active-anchor state private and offered no supported way to inspect or clear it.
- **Fix:** Added narrow `getActiveAnchor()` and `clearAnchor()` methods to the adapter contract and implementation.
- **Files modified:** `src/web/monaco/diff-adapter.ts`
- **Verification:** The inline persistence Playwright flow opens, submits, and clears its composer successfully.
- **Committed in:** `4f777dd` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The change was necessary to connect planned Vue controls to Monaco-owned anchor state. No scope creep.

## Issues Encountered

- Monaco's editor viewport initially covered the anchored action and composer controls in the browser. Establishing explicit editor and overlay stacking layers restored pointer access; the focused inline persistence browser test passes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The browser workspace now has canonical comment persistence and draft restoration available to the remaining Phase 02 plan.
- No blockers identified for the final anchored-review browser flow work.

---
*Phase: 02-anchored-diff-review*
*Completed: 2026-07-21*
