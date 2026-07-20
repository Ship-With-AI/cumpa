---
phase: 01-pinned-local-comparison
plan: 13
subsystem: ui
tags: [vue, playwright, responsive, accessibility, packaged-cli]

# Dependency graph
requires:
  - phase: 01-pinned-local-comparison
    provides: Pinned comparison identity, inventory, metadata, capability, and generated-package seams from Plans 01-12
provides:
  - Responsive wide, medium, and narrow pinned-comparison workspace
  - Keyboard-complete changed-file tree and focus-contained comparison identity sheet
  - Generated-package acceptance matrix for every branch/worktree ordering and all Phase 1 safety boundaries
affects: [02-diff-rendering, browser-workspace, accessibility, package-acceptance]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CSS grid pane switching with inert hidden regions and preserved component state
    - Playwright generated-bin matrices that derive expected identities and paths independently from Git

key-files:
  created:
    - .planning/phases/01-pinned-local-comparison/01-13-SUMMARY.md
  modified:
    - src/web/App.vue
    - src/web/components/FileMetadataPane.vue
    - src/web/components/FileTree.vue
    - src/web/components/IdentityPanel.vue
    - src/web/styles.css
    - tests/e2e/pinned-session.spec.ts
    - tests/e2e/responsive-session.spec.ts

key-decisions:
  - "Keep the narrow comparison disclosure in the persistent header while the modal identity sheet occupies the workspace grid row, so the sheet remains modal without making its own disclosure unreachable."
  - "Treat Enter and Space on directory treeitems as directory toggles only; file activation is emitted only when the focused row is a file."
  - "Prove ref immutability by advancing the selected head ref after each packaged server is listening and asserting the session still exposes the independently resolved pinned identities and file set."

patterns-established:
  - "Responsive state continuity: files/details panes remain mounted and preserve selection, directory expansion, scroll, and focus while CSS and inert state determine the active narrow view."
  - "Packaged acceptance: launch the generated executable from a nested repository directory, derive expected Git facts outside the app, then assert the browser and capability API against those facts."

requirements-completed: []

# Metrics
duration: 26min
completed: 2026-07-20
status: complete
---

# Phase 1 Plan 13: Responsive and Packaged Acceptance Summary

**Responsive pinned-comparison workspace with keyboard-safe pane switching, modal identity disclosure, exact accessibility tokens, and repeated generated-package proof across all branch/worktree orderings**

## Performance

- **Duration:** 26 min
- **Started:** 2026-07-20T17:22:10Z
- **Completed:** 2026-07-20T17:47:47Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Added the named RED responsive contract and preserved its authoritative test-first commit before implementing production behavior.
- Completed wide and medium independent pane scrolling plus narrow Files/Details tabs, persistent selection/expansion/scroll state, focus transfer, a focus-contained identity sheet, 40px targets, 320px reflow, 200% zoom, text-spacing resilience, contrast, announcements, and reduced-motion behavior.
- Extended the generated executable acceptance suite with branch-to-branch, branch-to-worktree, worktree-to-branch, and worktree-to-worktree cases launched from nested working directories.
- Proved independently resolved base, head, and merge-base identities; merge-base-to-head paths; status and line counts; exact size-limit behavior; dirty-byte exclusion; empty state; initial and later selection; moving-ref immutability; stopped/unavailable behavior; fail-closed token, Origin, Host, capability, and query-field boundaries; object disappearance; opener fallback; and single interrupt shutdown.
- Ran the complete packaged matrix twice independently, the complete responsive suite, and the npm dry-run pack audit successfully.

## Accessibility Matrix

| Contract | Packaged evidence |
|---|---|
| Wide ≥1280px | Independently scrolling 280px file tree and flexible details pane |
| Medium 768-1279px | Fixed 280px tree, visible pinned identity summary, no page overflow |
| Narrow <768px | Exact Files and selected-path Details tabs with inactive pane removed from focus/accessibility order |
| 320 CSS px / 200% zoom / text spacing | No horizontal document overflow; full object IDs reflow without clipping |
| Keyboard tree | Arrow/Home/End navigation, file-only Enter/Space activation, directory toggle semantics, visible focus |
| Identity sheet | `aria-modal`, inert workspace, contained Tab cycle, Escape/close/disclosure dismissal, focus restoration |
| Visual system | Exact palette, spacing, typography, monospace, target, focus, control-state, contrast, and reduced-motion assertions |
| Async states | Loading/error/status announcements remain named and non-stale through selection and retry transitions |

## Git, Security, and Shutdown Proof

- Each ordering resolves commit IDs and merge base independently with Git before launch and compares the returned immutable session to those values.
- The test advances `refs/heads/feature` after the generated server is listening; the browser and capability API continue to expose the pinned commit and three-file comparison, including exactly-limit text and limit-plus-one oversized classification.
- Missing/wrong bearer tokens return 401; hostile Origin and Host return 403; unknown opaque capability returns 404; arbitrary repository/ref query fields return the generic 400 fail-closed response. Error bodies expose neither the token nor repository paths.
- Existing generated-package cases retain opener failure fallback, stopped-session UI, object-loss recovery guidance, and empty comparison behavior.
- Repeated signals and explicit shutdown drain abort/close work once, remove listeners once, and preserve terminal SIGINT exit code 130.

## Package Audit

`npm pack --dry-run` rebuilt the runtime and reported only the generated executable plus runtime `dist/` modules and web assets (bin, CLI, contracts, domain, Git, server, and Vite output, with package metadata). No tests, planning artifacts, or source-only application files were included.

## Task Commits

Each task was committed atomically:

1. **Task 1: Write the failing responsive/accessibility behavior contract** - `da9911f` (test, RED)
2. **Task 2: Implement responsive workspace and accessibility behavior** - `a68729a` (feat, GREEN)
3. **Task 3: Prove the complete packaged Phase 1 matrix** - `c62ff79` (test)

**Plan metadata:** pending final planning commit

_Note: Task 1 and Task 2 preserve the required TDD RED → GREEN commit order._

## Files Created/Modified

- `src/web/App.vue` - Responsive view state, tabs, focus transfer, identity-sheet disclosure, and pane persistence.
- `src/web/components/FileMetadataPane.vue` - Details-pane focus target and resilient async metadata behavior.
- `src/web/components/FileTree.vue` - Exposed focus/scroll behavior and correct file-versus-directory keyboard activation.
- `src/web/components/IdentityPanel.vue` - Modal focus containment, Escape handling, and focus restoration hooks.
- `src/web/styles.css` - Exact responsive grid, design tokens, target sizes, control states, reflow, focus, contrast, and reduced-motion styles.
- `tests/e2e/responsive-session.spec.ts` - Named packaged responsive, keyboard, focus, and accessibility contract.
- `tests/e2e/pinned-session.spec.ts` - Four-ordering generated-package matrix plus Host, capability, and arbitrary-field security cases.

## Decisions Made

- The narrow identity surface overlays only the workspace row rather than the persistent comparison header. This keeps the background review workspace inert and focus-contained while preserving the explicitly required disclosure toggle.
- Directory treeitems own expansion semantics on Enter/Space; they do not activate whichever file happens to remain selected.
- The final ordering matrix uses registered-worktree identity data and real Git objects, advances the live ref after server startup, and checks the pinned session through both API and browser surfaces.

## Deviations from Plan

None - plan executed exactly as written. Task 3 modified only `tests/e2e/pinned-session.spec.ts`; no production files changed during final verification.

## Issues Encountered

- The first GREEN run exposed that a viewport-fixed narrow modal intercepted the header disclosure needed for toggle-close behavior. Constraining the modal to the workspace grid row satisfied both modal focus containment and disclosure reachability.
- Initial matrix assertions expected generic count copy and a successful arbitrary-query response. The production contract instead exposes the count in the tree heading and rejects undeclared query fields with 400; assertions were corrected to the actual fail-closed observable contracts.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1's 23 launch, comparison, workspace-placeholder, and local-safety requirements are jointly observable in the generated package and ready for Phase 2 diff rendering.
- No known blockers. The unrelated local `.planning/config.json` change and `.planning/forensics/` directory were preserved and excluded from all plan commits.

## Self-Check: PASSED

- All seven implementation/test artifacts and this summary exist.
- Task commits `da9911f`, `a68729a`, and `c62ff79` are present in RED → GREEN → final-acceptance order.
- Both packaged matrix runs, the responsive suite, and the dry-run package audit passed.

---
*Phase: 01-pinned-local-comparison*
*Completed: 2026-07-20*
