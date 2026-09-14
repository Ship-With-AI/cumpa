---
phase: 09-changed-file-tree
plan: 04
subsystem: ui
tags: [vue, file-tree, accessibility, filtering, keyboard-navigation, playwright]

# Dependency graph
requires:
  - phase: 09-changed-file-tree
    provides: FileTreeModel projection, filter expansion state, and derived tab-stop precedence
  - phase: 09-changed-file-tree
    provides: Dense changed-file tree chrome and basename/count presentation
provides:
  - Changed-files header, native filter, no-match recovery, keyboard hint, and independently scrolling tree
  - Projection-correct directory expansion and model-derived roving tab stop through recursive tree rows
  - Scoped unavailable-diff editable-control regression assertion compatible with the persistent tree filter
affects: [09-05-browser-evidence, changed-file-tree, browser-review]

# Tech tracking
tech-stack:
  added: []
  patterns: [model-owned-tab-stop, local-query-without-focus-stealing, mounted-tree-empty-recovery, inner-pane-scroller]

key-files:
  created: [".planning/phases/09-changed-file-tree/09-04-SUMMARY.md"]
  modified: ["src/web/components/FileTree.vue", "src/web/components/DirectoryRow.vue", "src/web/components/FileRow.vue", "src/web/styles.css", "tests/e2e/pinned-session.spec.ts"]

key-decisions:
  - "Render the visible Files chrome as aria-hidden and retain the exact Changed files (N) accessible heading contract in visually hidden text."
  - "Keep query transitions out of applyModel so typing never focuses a tree row."
  - "Use displayExpandedDirectoryIds only for rendering; toggleDirectory continues to own the reviewer's persisted expansion state."
  - "Scope the unavailable-diff editable-control assertion to review-main so a persistent tree filter does not invalidate an unrelated contract."

patterns-established:
  - "FileTree passes the model's single tabbableRowId downward; rows never independently choose the tab stop."
  - "Recovery content sits beside an always-mounted role=tree, preserving the tree's identity while a query has no visible rows."

requirements-completed: [TREE-01, TREE-02, TREE-03, TREE-04, TREE-05]

# Metrics
duration: 14min
completed: 2026-09-13
status: complete
---

# Phase 09 Plan 04: Changed-file tree rendering Summary

**Changed-files navigation now combines accessible dense chrome, query projection and recovery, a model-owned roving tab stop, and a dedicated scrolling tree pane.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-09-13T12:19:56Z
- **Completed:** 2026-09-13T12:34:13Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Composed the `Files` header, exact `Changed files (N)` accessible name, native `Filter files` search field, clear affordance, always-mounted no-match recovery state, and keyboard hint.
- Routed rendering through `projectedTree` and `displayExpandedDirectoryIds`; clearing a query reveals the selected file without taking focus from the filter.
- Replaced component-side focused-tab logic with the model's `tabbableRowId`, including recursive directory and leaf bindings.
- Made the outer file-tree pane a two-row non-scrolling grid, delegated scroll to its inset scroller, and removed the negative focus-outline offset. Responsive browser verification observed clearance above the first row.
- Confirmed `tests/e2e/file-tree.spec.ts:331` is green with that test file unedited, closing the inherited red window.

## Task Commits

Each task was committed atomically:

1. **Task 1: compose tree header, filter, recovery, hint, and query projection** — `b7fff04` (`feat`)
2. **Task 2: bind recursive rows to the model-derived tab stop** — `982f16d` (`fix`)
3. **Task 3: hand scrolling to the inner tree scroller and preserve focus clearance** — `d10b8f5` (`fix`)

**Plan metadata:** committed with this summary.

## Files Created/Modified

- `src/web/components/FileTree.vue` — renders the changed-files chrome, filter and recovery state; removes the old exposed imperative API; binds projection, expansion display, and tab stop.
- `src/web/components/DirectoryRow.vue` — drills `tabbableRowId` recursively and computes child row tabindex from it.
- `src/web/components/FileRow.vue` — accepts the derived `tabbable` flag for its sole tab-stop binding.
- `src/web/styles.css` — makes the outer pane a clipped two-row grid and drops the clipping negative focus offset.
- `tests/e2e/pinned-session.spec.ts` — scopes the unavailable-diff editable-control assertion to `main.review-main`.
- `.planning/phases/09-changed-file-tree/09-04-SUMMARY.md` — execution record and verification evidence.

## Decisions Made

- The visible header presents `Files`, count, and `Changed` eyebrow while visually-hidden `Changed files (N)` preserves the pinned accessible-heading contract.
- `toggleDirectory` continues to write only the reviewer's expansion set. Active filtering adds force-expanded surviving ancestors only through `displayExpandedDirectoryIds`.
- The placeholder `Find file…` comes from the UI specification, not mockup `01b`.
- Re-search after removing `defineExpose`, `focusHeading`, `focusSelectedFile`, `getScrollPosition`, and `setScrollPosition` found no FileTree consumer of the removed API.

## Deviations from Plan

### Deliberate rendering departures from mockup 01b

- The `role="tree"` stays mounted beside the no-match recovery content. This preserves the tree's accessible role and name while the projection contains no rows.
- An explicit `Clear file filter` button accompanies the native search field. Native search clear controls are not reliably keyboard reachable; the explicit control makes clearing accessible.

### Auto-fixed verification contract

**1. [Rule 1 - Broken test contract] Scoped an over-broad unavailable-diff editable-control assertion**
- **Found during:** Task 1 (native filter composition)
- **Issue:** `tests/e2e/pinned-session.spec.ts:1418` globally counted `input, textarea, select` after selecting unavailable files. The new required persistent native search input is outside the review surface, so the global locator pinned a page implementation detail instead of the test's contract: unavailable diffs must not expose editable review/comment controls.
- **Fix:** Changed only that locator to `page.locator('main.review-main').locator('input, textarea, select')`.
- **Verification:** `npm run test:browser -- tests/e2e/pinned-session.spec.ts` passed all 11 tests; the narrowed assertion still proves that unavailable main review content exposes no editable control.
- **Committed in:** `b7fff04` (Task 1)

---

**Total deviations:** 1 auto-fixed verification-contract correction; 2 planned mockup departures.
**Impact on plan:** The required filter remains persistently accessible while the unavailable-diff regression assertion continues to test its actual review-surface contract.

## Verification

- `npm run typecheck:web` — passed.
- `npm run verify:semantic-css` — passed.
- `npm run test:browser -- tests/e2e/file-tree.spec.ts` — passed; selected leaf remains the sole `tabindex="0"` row at line 331 without editing the spec.
- `npm run test:browser -- tests/e2e/responsive-session.spec.ts tests/e2e/file-tree.spec.ts` — passed; focus-ring perimeter checks observed clearance above the first tree row.
- `npm run test:browser -- tests/e2e/pinned-session.spec.ts` — passed, 11 tests.
- `npm run test:unit` — passed, 29 files and 181 tests.
- Final source checks found no removed exposed FileTree API, no `applyModel(model.value.setQuery(...))`, no `model.expandedDirectoryIds` render binding, no unsafe HTML/timer/debounce pattern, no `focusedRowId` in `DirectoryRow.vue`, and no negative `.review-files .tree-row:focus-visible` rule.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 09-05 can add browser evidence against the persistent filter, recovery state, projection-correct expansion, inner scrolling, and model-owned roving tabindex.
- `STATE.md` and `ROADMAP.md` were intentionally not modified.

## Self-Check: PASSED

- All three task commits exist: `b7fff04`, `982f16d`, and `d10b8f5`.
- Required summary exists at `.planning/phases/09-changed-file-tree/09-04-SUMMARY.md`.
- `STATE.md` and `ROADMAP.md` remain unchanged.

---
*Phase: 09-changed-file-tree*
*Completed: 2026-09-13*
