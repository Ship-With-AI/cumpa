---
phase: 09-changed-file-tree
plan: 01
subsystem: ui-model
tags: [typescript, vitest, file-tree, filtering, accessibility]

# Dependency graph
requires:
  - phase: 08-semantic-visual-foundation
    provides: Browser build and semantic CSS verification baseline
provides:
  - Immutable, full-display-path filtered file-tree projection
  - Query-aware expansion restoration and a single derived tree tab stop
affects: [09-03-directory-counts, 09-04-file-tree-rendering, 09-05-browser-evidence]

# Tech tracking
tech-stack:
  added: []
  patterns: [prune-built-tree, query-scoped-collapse-override, selected-first-roving-tab-stop]

key-files:
  created: [".planning/phases/09-changed-file-tree/09-01-SUMMARY.md"]
  modified: ["src/web/model/file-tree.ts", "tests/unit/file-tree.test.ts"]

key-decisions:
  - "Filter the built tree with spread-preserved directories instead of rebuilding it, retaining compacted directory identity."
  - "Derive the tab stop selected-first, then exact focused row, then first visible row."
  - "Use an exact focused-row fallback rather than a nearest-surviving-row search; DOM focus re-homes through the existing row focus handler."

patterns-established:
  - "Filter projections preserve original node ordering, segments, and directory IDs while freezing reconstructed directory nodes."
  - "Filter-time collapse overrides remain model-private and are reset when the query changes."

requirements-completed: [TREE-02, TREE-03, TREE-04, TREE-05]

# Metrics
duration: 10min
completed: 2026-09-13
status: complete
---

# Phase 09 Plan 01: Changed-File Tree Model Summary

**The file-tree model now exposes immutable full-path filtering, display expansion, restoration-safe collapse intent, and a selected-first roving tab stop.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-09-13T11:41:46Z
- **Completed:** 2026-09-13T11:51:40Z
- **Tasks:** 3 completed
- **Files modified:** 2

## Accomplishments

- Added ten RED-first model contracts for case-insensitive full-path filtering, preserved compacted directory identity, filter restoration, query-time collapse, and tab-stop precedence.
- Added `query`, `setQuery`, `projectedTree`, `displayExpandedDirectoryIds`, and `tabbableRowId` to `FileTreeModel`.
- Pruned the already-built frozen tree with object spreads, preserving directory IDs, paths, segments, and byte-exact child order without re-entering `buildFileTree`.
- Derived display expansion from reviewer expansion plus surviving filtered ancestors, subtracting model-private query collapse overrides so the disclosure state truthfully matches visible descendants.
- Re-homed file selection onto its visible row when possible, and derived the sole tab stop in selected-visible, focused-visible, first-visible, then null order.

## Task Commits

Each changed task was committed atomically:

1. **Task 1: RED — pin the filter, restoration, and tab-stop contracts as failing unit tests** — `a1544a5` (`test`)
2. **Task 2: GREEN — add the pruned projection, effective expansion, and derived tab stop to the model** — `204b96b` (`feat`)
3. **Task 3: Confirm no browser-visible behaviour moved yet** — verification-only; no source change to commit.

## Files Created/Modified

- `src/web/model/file-tree.ts` — query-aware tree projection, display expansion, query-scoped collapse tracking, focus re-homing, and derived tab stop.
- `tests/unit/file-tree.test.ts` — ten model contracts plus recursive projected-descendant fold coverage.
- `.planning/phases/09-changed-file-tree/09-01-SUMMARY.md` — execution record and verification evidence.

## Decisions Made

- `pruneTree` retains matching leaves and only their existing ancestors, freezing spread-cloned directories so compaction and opaque directory identity survive filtering.
- `toggleDirectory` decides from effective display expansion, then records query-time collapses separately. This permits a force-expanded ancestor to collapse visibly while its unfiltered reviewer state remains restorable.
- The tab stop gives the selected visible file precedence over focus. The UI contract's "nearest surviving focused row" wording is deliberately simplified to an exact surviving focused row, then the first visible row: the existing row focus event immediately re-establishes a concrete focus anchor when reviewers tab back into the tree.

## Verification

- RED: `npm run test:unit -- --grep "createFileTreeModel"` failed as intended with all ten added cases failing; the observed representative failure was `TypeError: model.setQuery is not a function` at `tests/unit/file-tree.test.ts:496`.
- GREEN: `npm run test:unit -- --grep "createFileTreeModel"` passed 15 tests in 8 ms.
- Full unit suite: `npm run test:unit` passed 181 tests in 29 files (reported duration 188.31 s).
- Typecheck: `npm run typecheck:web` passed.
- Structural checks: `buildFileTree` occurs exactly twice (import plus factory call); `createModel` has the declaration plus five transition/factory callers; the query-collapse override remains absent from every Vue component; no `RegExp` occurs in the model.
- Browser surface: `npm run test:browser -- tests/e2e/file-tree.spec.ts` built fresh assets and passed its single Playwright test in 7.7 s. `FileTree.vue` still iterates `model.tree` and both row components still bind `tabindex` to focus, so these new model members remain unused at the browser surface pending 09-04.

## Deviations from Plan

None - plan implementation executed exactly as written.

## Issues Encountered

- The plan expected `tests/e2e/file-tree.spec.ts:331` to remain the single known-red selected-treeitem `tabindex="0"` assertion for 09-04. In this checkout, the specified browser command passed 1/1, including that assertion. No browser test or Vue component was changed, and no failure was fabricated; 09-04 still owns binding `tabbableRowId` into row components.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 09-04 can consume `projectedTree`, `displayExpandedDirectoryIds`, `setQuery`, and `tabbableRowId` to bind the filter and actual browser tree rendering.
- Plan 09-03 can fold projected directory children for descendant counts without another model API.

## Self-Check: PASSED

- Summary exists at the required path.
- RED (`a1544a5`) and GREEN (`204b96b`) commits exist in repository history.
- This summary is the only pending plan artifact; STATE.md and ROADMAP.md remain unchanged.
