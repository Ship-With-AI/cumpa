---
phase: 09-changed-file-tree
plan: "06"
subsystem: web-ui
tags: [vue, file-tree, accessibility, performance, playwright]
requires:
  - phase: 09-changed-file-tree
    provides: filtered changed-file tree and roving tree navigation
provides:
  - Opaque-ID reconciliation for changed-file replacements
  - Constant-time recursive row expansion and descendant-count lookups
  - Pointer-transparent changed-file filter glyph
affects: [changed-file-tree, session-refresh, browser-regression-tests]
tech-stack:
  added: []
  patterns:
    - File-tree replacement is a model transition that preserves surviving opaque IDs.
    - Projected directory rendering receives precomputed lookup collections.
key-files:
  created:
    - .planning/phases/09-changed-file-tree/09-06-SUMMARY.md
  modified:
    - src/web/model/file-tree.ts
    - src/web/components/FileTree.vue
    - src/web/components/DirectoryRow.vue
    - src/web/styles.css
    - tests/unit/file-tree.test.ts
    - tests/e2e/file-tree.spec.ts
key-decisions:
  - "Keep reconciliation in FileTreeModel so all prop replacements share opaque-ID semantics."
  - "Use the projected tree as the sole descendant-count source so filtering remains exact."
requirements-completed: [TREE-01, TREE-02, TREE-03, TREE-04, TREE-05]
duration: "execution session"
completed: 2026-09-13
status: complete
---

# Phase 09 Plan 06: Review Finding Closure Summary

**Changed-file replacements retain reviewer state by opaque ID while filtered directory rows use one projected lookup derivation and the filter icon remains clickable.**

## Finding Closure

| Finding | Action | Evidence |
|---|---|---|
| BL-01: replacement loses selection, focus, and expansion | Added `FileTreeModel.replaceFiles()`, which retains surviving selected IDs, preserves survivor expansion while default-expanding new directories, retains projected focus or uses the existing tab-stop precedence, and is applied through `applyModel()` so unchanged selection emits nothing. | The RED regression failed before the fix with `Expected: file_B…; Received: file_C…` at `tests/unit/file-tree.test.ts:654`. The unit regression and isolated browser component harness now pass, asserting query projection, collapsed opaque IDs, focus, selection, one tab stop, and no extra selection event. |
| WR-01: glyph consumes pointer clicks | Added `pointer-events: none` to `.file-tree-pane__filter-glyph`. | Packaged browser test clicks the glyph's visible coordinates and confirms the `Filter files` searchbox receives focus. |
| WR-02: directory rendering recomputes recursively | Added model-owned `effectiveExpandedDirectoryIds` and `directoryDescendantCounts`; recursive rows perform only `Set.has()` and `Map.get()` lookups. | Focused deep-tree unit test verifies filtered projected directories share one complete count map and effective expansion set; `npm run test:unit` passed 183 tests. |

## Task Commits

1. **RED regression:** `bc65481` — `test(09-06): expose file tree replacement regression`
2. **Review fixes:** `755fe9b` — `fix(09-06): preserve changed tree state on refresh`

## Verification

| Command | Result |
|---|---|
| `npm run test:unit` | Passed: 29 files, 183 tests. |
| `npm run verify:semantic-css` | Passed: production web build and semantic CSS token gate. |
| `npm run typecheck:web` | Passed. |
| `npm run build` | Passed: runtime and web builds. |
| `npm run test:browser -- tests/e2e/file-tree.spec.ts tests/e2e/responsive-session.spec.ts tests/e2e/pinned-session.spec.ts` | Passed: 15 Chromium tests. |

## Decisions Made

- Model replacement uses opaque file and directory IDs, never display paths, so display-colliding paths remain unambiguous.
- Focus falls back only when its row is absent from the replacement projection; the existing selected-if-visible, focused-if-visible, first-visible, null precedence is unchanged.
- No UI surface outside Phase 09 changed.

## Deviations from Plan

None — the requested review closure was implemented directly.

## User Setup Required

None.

## Self-Check: PASSED

- `09-06-SUMMARY.md` exists.
- RED and GREEN commits `bc65481` and `755fe9b` exist.
