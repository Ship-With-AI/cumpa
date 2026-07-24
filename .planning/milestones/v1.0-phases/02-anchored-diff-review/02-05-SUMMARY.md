---
phase: 02-anchored-diff-review
plan: 05
subsystem: review-workspace-ui
tags: [vue, monaco-editor, playwright, accessibility, responsive-ui]
requires:
  - phase: 02-anchored-diff-review
    provides: immutable opaque content DTOs, proven public Monaco adapter, and session-only workspace transitions
provides:
  - Phase 1 identity header and deterministic file tree composed with one active immutable Monaco side-by-side diff
  - Persistent visible and keyboard file/change navigation with accessible tooltips and help
  - Responsive file/comment drawers and focused real-browser navigation coverage
affects: [02-06-comment-ui, 02-07-browser-flow]
tech-stack:
  added: []
  patterns:
    - Closed session client validates frozen content DTOs before passing them to Monaco
    - App composition delegates per-file editor restoration to the proven adapter and navigation ordering to workspace-state
key-files:
  created:
    - src/web/components/DiffWorkspace.vue
    - src/web/components/ReviewToolbar.vue
    - src/web/components/KeyboardHelp.vue
    - src/web/components/ui/UiPrimitives.vue
    - tests/integration/anchored-workspace.spec.ts
  modified:
    - src/web/api/client.ts
    - src/web/App.vue
    - src/web/styles.css
key-decisions:
  - "Keep opaque file IDs as the only browser selection input; content remains fetched through the inherited authenticated client."
  - "Reuse the Plan 02-01 public Monaco adapter for side-by-side models, collapsed context, resize layout, and per-file session restoration rather than introducing a second editor lifecycle."
patterns-established:
  - "Visible navigation and documented keyboard shortcuts are peers, with disabled boundary controls retaining their label and tooltip copy."
  - "Narrow layouts retain the 640px side-by-side diff plane and move navigation and comments into non-modal drawers."
requirements-completed: [DIFF-02, DIFF-03, DIFF-04, DIFF-05, DIFF-07, CMT-01]
duration: 27min
completed: 2026-07-21
status: complete
---

# Phase 02 Plan 05: Anchored Diff Review Shell Summary

**The Phase 1 pinned identity and opaque file tree now drive a single, syntax-highlighted, read-only Monaco side-by-side workspace with persistent navigation and responsive review chrome.**

## Performance

- **Duration:** 27 min [INFERENCE]
- **Started:** 2026-07-21 execution session
- **Completed:** 2026-07-21T12:27:36Z
- **Tasks:** 1/1
- **Files modified:** 8

## Accomplishments

- Extended the actual Phase 1 `IdentityHeader`, `IdentityPanel`, and `FileTree` shell rather than recreating identity, path, dirty-state, or selection authority.
- Added strict client validation for the existing closed `/api/files/:fileId/content` DTO and rendered exactly one selected text file through the established public Monaco adapter.
- Added persistent labeled file/change controls, Alt+Shift+[ / ], F7 / Shift+F7 peers, discoverable tooltips, keyboard help, skip links, landmarks, side labels, responsive drawers, and a 640px side-by-side fallback.
- Added a focused production-shaped Chromium contract covering actual Vue/Monaco navigation, keyboard peers, help, narrow geometry, drawer access, and absence of page/console errors.

## Task Commits

| Task | Commit | Evidence |
| --- | --- | --- |
| 1. Compose one-file diff, responsive navigation, and session restoration | `1775b78` | `feat(02-05): compose anchored diff review shell` |

## Actual Phase 1 Seams Used

- `src/web/App.vue` retains the existing `IdentityHeader`, `IdentityPanel`, and `FileTree`; only the selected-file detail center is replaced by the review workspace.
- `src/web/api/client.ts` retains the fragment-bearer fixed-method closure and adds only strict parsing of the already-closed content endpoint.
- `src/web/components/DiffWorkspace.vue` configures Vite Monaco workers once and delegates file swaps, collapsed context, layout, immutable side/model coordinates, and A→B→A editor-state restoration to `diff-adapter.ts`.
- `workspace-state.ts` remains the deterministic opaque-ID command seam for file/change navigation and resize commands; it introduces no repository, path, blob, or anchor authority.

## Visible and Keyboard Control Matrix

| Control | Visible peer | Keyboard peer | Boundary behavior |
| --- | --- | --- | --- |
| Previous file | `Previous file` | Alt+Shift+[ | Disabled at first reviewable file with first-file tooltip copy |
| Next file | `Next file` | Alt+Shift+] | Disabled at last reviewable file with last-file tooltip copy |
| Previous change | `Previous change` | Shift+F7 | Public Monaco previous-diff navigation |
| Next change | `Next change` | F7 | Public Monaco next-diff navigation |
| Comments | `Comments` | Tab-visible control | Opens the non-modal comments drawer |
| Keyboard help | `Keyboard help` | ? outside inputs | Opens exact documented `Keyboard actions` help |
| Monaco accessibility help | Monaco editor | Alt+F1 | Preserved by the unmodified public Monaco configuration |

## Responsive, Context, and Restoration Evidence

- The workspace preserves one 640px-minimum side-by-side diff canvas below 768px; `BASE` and `HEAD` labels remain visible and the narrow notice requests a wider window rather than switching layouts.
- At 1100px and below, the deterministic file tree and comments surface use non-modal drawers. The focused browser contract observed the `Files` and `Comments` controls at 640px.
- Monaco starts unchanged regions collapsed through the established adapter configuration (`minimumLineCount: 8`, three retained context lines, ten-line bounded reveal). Its public controls retain bounded reveal; the adapter's public all-context fallback is used for durable-anchor reveal.
- The adapter remains mounted across deterministic file navigation and `ResizeObserver` layout calls. Its existing Plan 02-01 real-Chromium proof covers A→B→A active composer text, focus, scroll, and collapsed-context restoration without duplicate zones/listeners/models; this shell invokes that same adapter rather than duplicating the lifecycle.

## Verification Evidence

| Check | Result |
| --- | --- |
| `npm run build:web` | PASS — production Vue/Vite bundle compiled with Monaco workers and review shell. |
| `npm run test:browser -- tests/integration/anchored-workspace.spec.ts --grep "diff navigation and session state"` | PASS — 1 Chromium test; verified initial/disabled navigation, button and shortcut file navigation, help copy, side-by-side narrow geometry, comments drawer, and no relevant page or console errors. |

No formatter, linter, aggregate browser suite, API/unit sweep, or project-wide test suite was run.

## Later-Phase Exclusion Audit

No edit, delete, resolve/reopen, lifecycle counts, summary, conflict handling, selector drift, export, reattachment, thread/reply, stacked/unified layout, or theme toggle was added. The comments rail deliberately presents only the Phase 2 empty entry state; persistence and accepted-comment rail behavior remain Plan 02-06/02-07 work.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test correctness] Used exact accessible names for narrow drawer triggers**
- **Found during:** Task 1 browser verification
- **Issue:** The initial Playwright locators partially matched `Close files` and `Close comments`, making the test strictness failure unrelated to the requested browser behavior.
- **Fix:** Changed the focused contract to exact `Files` and `Comments` accessible-name locators.
- **Files modified:** `tests/integration/anchored-workspace.spec.ts`
- **Verification:** Final focused Chromium contract passed.
- **Committed in:** `1775b78`

---

**Total deviations:** 1 auto-fixed (1 test correctness).
**Impact on plan:** The correction makes the real-browser assertion deterministic; it adds no product scope or authority surface.

## Issues Encountered

- The focused browser test initially exposed partial accessible-name matching for drawer controls. The corrected exact locators passed and continued to verify the visible control contract.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02-06 can render persisted accepted comments and rail records into the existing single-file workspace without reopening Phase 1 identity, content authority, or editor lifecycle.
- Plan 02-07 can extend `anchored-workspace.spec.ts` with comment-persistence observations while retaining this focused shell/navigation contract.

## Self-Check: PASSED

- Required review shell, toolbar, keyboard help, local primitive, focused Chromium test, and task commit `1775b78` exist.
- The focused browser contract and production web build passed after the final task commit.
- The task commit contains no tracked-file deletions; unrelated untracked `.bg-shell/`, `.gsd/`, `.planning/forensics/`, and `local:/` remain untouched.

---
*Phase: 02-anchored-diff-review*
*Completed: 2026-07-21*
