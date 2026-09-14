---
phase: 09-changed-file-tree
plan: 05
subsystem: testing
tags: [playwright, vue, file-tree, responsive, accessibility, filtering]

# Dependency graph
requires:
  - phase: 09-changed-file-tree
    provides: Filtered projection, recursive rows, dense tree chrome, and model-derived tab stop
provides:
  - Packaged filter, recovery, selection-preservation, and tab-stop browser evidence
  - Shipped-host responsive tree-interior evidence at 1440, 1280, and 420 viewports
  - Updated browser regressions that no longer pin removed full-path presentation or volatile gutter hover geometry
affects: [phase-11-workspace-shell, changed-file-tree, browser-review]

# Tech tracking
tech-stack:
  added: []
  patterns: [packaged-filter-request-baseline, shipped-host-responsive-tree-proof, structural-monaco-geometry]

key-files:
  created: [".planning/phases/09-changed-file-tree/09-05-SUMMARY.md"]
  modified: ["tests/e2e/file-tree.spec.ts", "tests/e2e/responsive-session.spec.ts", "tests/integration/anchored-workspace.spec.ts"]

key-decisions:
  - "Filter evidence first selects a visible non-collision file, then captures the request baseline, so restored selection and restored collapsed collision state can both be observed."
  - "Responsive evidence measures shipped 288px and 256px hosts rather than the Phase 11-owned mockup shell widths."
  - "Monaco geometry checks retain code, pane, sash, and scroll invariants; transient hover gutter position is not a reflow invariant."

patterns-established:
  - "Verify tree interiors against canonical tokens and host bounding boxes at the browser surface."
  - "When Monaco virtualizes a target line, measure a visible modified line rather than treating DOM virtualization as layout reflow."

requirements-completed: [TREE-01, TREE-02, TREE-03, TREE-04, TREE-05]

# Metrics
duration: 35min
completed: 2026-09-13
status: complete
---

# Phase 09 Plan 05: Browser Evidence Summary

**Packaged browser coverage now proves changed-file filtering and recovery preserve reviewer state, and tree interiors remain dense and contained at the shipped desktop and narrow hosts.**

## Performance

- **Duration:** 35 min
- **Started:** 2026-09-13T12:37:56Z
- **Completed:** 2026-09-13T13:12:55Z
- **Tasks:** 3 completed
- **Files modified:** 4

## Accomplishments

- Added the second packaged tree test: it proves one initial roving tab stop, case-insensitive and full-path filtering, force-expanded ancestors, zero requests while filtering, no-match recovery, focus-returning clear control, restored selected file, and restored reviewer collapse state.
- Added one width-parameterised tree-interior helper at `1440`, `1280`, and `420`; it resolves `--file-row-min-height` from the canonical root and proves host containment, increasing indentation, visible directory counts, visible signed counts, and no document overflow.
- Closed two unrelated browser assertions exposed by the full suite: navigation no longer pins hidden full paths after basename presentation, and Monaco geometry no longer treats virtualized lines or a hover-driven gutter overlay as reflow.

## ROADMAP Success-Criteria Evidence

1. **Dense row anatomy and directory counts:** `npm run test:browser -- tests/e2e/file-tree.spec.ts` passed both packaged tests. Existing row assertions cover status, basename, signed counts, unsupported/unavailable markers, and plan 09-03 directory labels; Task 2 proves the 34px canonical row height, non-empty directory count, and visible `+`/`−` cues.
2. **Tree semantics, ordering, and keyboard navigation:** `npm run test:unit` passed 181 tests, including `buildFileTree` and `createFileTreeModel` ordering, expansion, selection, and roving-tab-stop contracts. The existing packaged tree keyboard matrix and selected-treeitem `tabindex="0"` assertion passed without modifying its original test.
3. **Filtered ancestors and force expansion:** Task 1's `COLLISION` and `src/deep` assertions prove case-insensitive full-path narrowing, matching ancestors, and force-expanded paths in the packaged browser.
4. **No-match recovery with preserved open file:** Task 1 proves zero rows and zero tab stops under no match, exact recovery copy and Clear filter action, then restores the selected `tracked.txt` row, its sole tab stop, reviewer-collapsed `collision/`, and the unchanged file-request baseline.
5. **Desktop and narrow density/hierarchy:** Task 2 runs the helper at 1440 (shipped 288px persistent host), 1280 (shipped 256px persistent host), and 420 (opened with the existing Files trigger), asserting density, containment, indentation, counts, signs, and no page overflow.

## Task Commits

Each task was committed atomically:

1. **Task 1: Packaged filter, recovery, and tab-stop evidence** — `0127af8` (`test`)
2. **Task 2: Shipped-width tree-interior evidence** — `b730fdc` (`test`)
3. **Task 3: Full-suite browser regression closure** — `34e3dce`, `800a17d` (`test`)

## Files Created/Modified

- `tests/e2e/file-tree.spec.ts` — adds packaged filter/recovery evidence with request and error collectors.
- `tests/e2e/responsive-session.spec.ts` — adds the three-width tree-interior helper and calls.
- `tests/integration/anchored-workspace.spec.ts` — removes stale hidden-path and volatile gutter assertions; keeps Monaco structural geometry checks resilient to expected virtualization.
- `.planning/phases/09-changed-file-tree/09-05-SUMMARY.md` — records closure evidence and Phase 11 handoff.

## Decisions Made

- The fixture initially opens a collision leaf, which cannot be visibly selected after deliberately restoring its parent as collapsed. The test intentionally selects visible `tracked.txt` before capturing the no-filter request baseline; filtering itself then proves no load or selection change.
- No partial-directory-count browser assertion was invented: this fixture has no directory with a selectively matching subset. Plan 09-01's unit coverage proves directory counts fold the projected children; plan 09-03's packaged test proves rendered recursive counts.
- The predicted pre-existing red at `tests/e2e/file-tree.spec.ts:331` never reproduced in this checkout. It was already green before this plan and remained green; no baseline was manufactured.

## Deviations from Plan

### Auto-fixed browser-test contracts

**1. Removed assertions for replaced or non-structural presentation**
- **Found during:** Task 3 full browser sweep.
- **Issue:** `anchored-workspace.spec.ts` asserted hidden full paths inside basename tree rows and exact gutter overlay position. A further helper assumed its named Monaco line must remain materialized despite normal virtual scrolling.
- **Fix:** Preserved the selected-row, header, code-origin, pane, sash, scroll, and zone contracts; removed three stale full-path text checks and the hover-driven gutter-position comparison; made geometry use a visible modified line when the preferred target is virtualized.
- **Verification:** Targeted navigation, inline-conversation, and phase-viewport browser tests passed. The final full suite had 93 passing browser tests and no product-test failures.
- **Committed in:** `34e3dce`, `800a17d`.

---

**Total deviations:** 1 auto-fixed verification-contract correction in this plan. All Phase 09 deliberate departures accumulated from prior plans remain intentional: the no-match `role="tree"` remains mounted, an explicit keyboard-reachable Clear file filter button accompanies native search, the inner scroller retains focus-clearance padding instead of mockup-zero top inset, and basename presentation uses the plan-authorized component fallback rather than CSS-only directory-segment suppression.

## Verification

- `npm run typecheck:web` — passed.
- `npm run verify:semantic-css` — passed after its fresh web build.
- `npm run test:unit` — passed: 181 tests in 29 files.
- `npm run test:git` — passed: 69 tests in 9 files.
- `npm run test:api` — passed: 142 tests in 19 files.
- `npm run test:browser -- tests/e2e/file-tree.spec.ts` — passed both packaged tree tests.
- `npm run test:browser -- tests/e2e/responsive-session.spec.ts` — passed the responsive keyboard/accessibility contract including the new hosts.
- `npm run test:browser` — 93 passed; the only two failures were externally configured acceptance tests: `marketplace-review.spec.ts` requires `CUMPA_MARKETPLACE_URL_MARKER`, and `public-support-states.spec.ts` requires `CUMPA_RUNTIME_CUSTODY_DIR` (then its archive/evidence inputs). No product assertion failed in the final run.
- Against phase base `0d12e03`, `tests/e2e/pinned-session.spec.ts` has no diff; it remained byte-unchanged throughout this plan and phase tail.
- No file under `src/` changed in plan 09-05.

## Human Verification

Pending end-of-phase reference comparison: open nested changed files at 1440×1000 and 420×900, then confirm dense row reading, Files/count/Changed header ordering, filter placement, sticky header/filter with tree scrolling, selected rail, slash-suffixed directory counts, keyboard hint, and unchanged narrow indentation/signed/count cues. Sidebar width, Files trigger, and drawer animation remain Phase 11 concerns.

## Phase 11 Handoff

- The mockup host widths `294px`, `248px`, and `320px` are deferred Phase 11 shell-sizing input. Phase 09 verified the shipped 288px and 256px hosts instead.
- No `--sidebar-width` token exists in the responsive spec or stylesheet; this plan did not alter shell tracks, drawer lifecycle, or modal composition.

## User Setup Required

None for the changed-file-tree contracts. The two documented external browser acceptance specs need their operator-owned marketplace marker/runtime-artifact environment before they can execute.

## Next Phase Readiness

- Phase 09 browser evidence is complete for TREE-01 through TREE-05.
- Phase 11 can own mockup shell widths and Files drawer composition without changing the tree-interior contracts established here.

---
*Phase: 09-changed-file-tree*
*Completed: 2026-09-13*
