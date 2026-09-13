---
phase: 09-changed-file-tree
plan: 03
subsystem: ui
tags: [vue, playwright, accessibility, file-tree]

# Dependency graph
requires:
  - phase: 09-changed-file-tree
    provides: Dense tree geometry and immutable projected file-tree model
provides:
  - File-row basename rendering with full-path accessible identities and titles
  - Recursive, filter-projection-correct directory descendant counts
  - Chromium contracts for basename collisions, move identities, and directory count labels
affects: [09-04-file-tree-rendering, 09-05-browser-evidence]

# Tech tracking
tech-stack:
  added: []
  patterns: [opt-in-basename-presentation, projected-child-descendant-fold]

key-files:
  created: [".planning/phases/09-changed-file-tree/09-03-SUMMARY.md"]
  modified: ["src/web/components/PathDisplay.vue", "src/web/components/ui/PathText.vue", "src/web/components/FileRow.vue", "src/web/components/DirectoryRow.vue", "tests/e2e/file-tree.spec.ts"]

key-decisions:
  - "Use the plan-authorized opt-in PathDisplay basename fallback because CSS display suppression remains in Playwright text content."
  - "Fold each rendered directory's projected children so counts naturally follow filtering without model state or props."

patterns-established:
  - "Visual basename presentation is opt-in at the file-row consumer while PathDisplay always owns the full accessible identity and title."
  - "Directory aggregates derive from the rendered projected node graph rather than a parallel unfiltered count source."

requirements-completed: [TREE-01, TREE-02, TREE-03]

# Metrics
duration: 8min
completed: 2026-09-13
status: complete
---

# Phase 09 Plan 03: Basename Presentation and Directory Counts Summary

**Changed-file rows now show concise basenames while retaining full announced identities, and directories announce their recursive changed-file totals.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-13T12:07:36Z
- **Completed:** 2026-09-13T12:15:38Z
- **Tasks:** 3 completed
- **Files modified:** 5

## Accomplishments

- Bound the non-move `PathDisplay` branch to its complete effective-path accessible name and title, preserving exact identities for ordinary, deleted, and non-reviewable rows.
- Switched file rows to an opt-in basename `PathText` presentation; renamed and copied rows show two basenames while continuing to announce their full move identities.
- Added slash-suffixed directory labels and recursive counts from projected children, with singular/plural accessible labels.
- Extended packaged Chromium coverage for basename-only control paths, duplicate displayed basenames, full rename identity, and `collision/`/`control/` directory counts.

## Task Commits

Each task was committed atomically:

1. **Task 1: Present the file name only, keeping the full path as the announced identity** — `faf6b2d` (`feat`)
2. **Task 2: Give directory rows their recursive changed-file count and slash suffix** — `37c3328` (`feat`)
3. **Task 3: Move the packaged visible-text assertions to basenames and prove the names survived** — `063ee24` (`feat`)

## Files Created/Modified

- `src/web/components/PathDisplay.vue` — preserves effective and move full-path accessible identities while accepting opt-in basename presentation.
- `src/web/components/ui/PathText.vue` — omits directory text only when its consumer requests basename rendering.
- `src/web/components/FileRow.vue` — requests basename presentation for changed-file rows only.
- `src/web/components/DirectoryRow.vue` — renders slash-suffixed compacted labels and recursive projected-descendant counts.
- `tests/e2e/file-tree.spec.ts` — verifies basename rendering, collision selection, full rename identity, and directory count names.
- `.planning/phases/09-changed-file-tree/09-03-SUMMARY.md` — execution record and verification evidence.

## Decisions Made

- The initially planned CSS directory-segment suppression was not shipped. Chromium's visible render hid it, but Playwright's `toContainText` still included the hidden source text, so the plan-authorized opt-in `basename` fallback was used instead.
- The `collision/` fixture directory announces `2 changed files`; `control/` announces `1 changed file`; `src/deep/only/` contains the renamed descendant and receives its recursive count from the same projected-child fold.
- `FileRow.vue` and `PathText.vue` were modified only to implement the plan-authorized fallback. `App.vue`, `tests/e2e/pinned-session.spec.ts`, and `tests/e2e/responsive-session.spec.ts` remain unchanged.

## Deviations from Plan

None - the plan explicitly directed the opt-in basename fallback when CSS suppression remained present in rendered-text assertions.

## Issues Encountered

- The plan predicted a sole `tests/e2e/file-tree.spec.ts:331` tab-stop failure. This checkout passed that assertion before and after this work; no red baseline was manufactured. Plan 09-04 still owns binding `tabbableRowId` into Vue rows.

## Verification

- `npm run typecheck:web` passed.
- `npm run verify:semantic-css` passed after a fresh production web build.
- `npm run test:browser -- tests/e2e/file-tree.spec.ts` passed 1/1 in Chromium.
- The packaged test proves `collision/` has two descendants, `control/` has one, and the two identically displayed replacement-character basenames issue different opaque content requests.
- No `v-html` or `innerHTML` occurs in the changed rendering components; `STATE.md`, `ROADMAP.md`, `App.vue`, `pinned-session.spec.ts`, and `responsive-session.spec.ts` have no plan diff.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 09-04 can consume the existing model projection and tab-stop fields to wire the filter and roving tabindex without changing basename or count presentation.

## Self-Check: PASSED

- All three task commits exist in repository history.
- Required summary exists at `.planning/phases/09-changed-file-tree/09-03-SUMMARY.md`.
- `STATE.md` and `ROADMAP.md` remain unchanged.

---
*Phase: 09-changed-file-tree*
*Completed: 2026-09-13*
