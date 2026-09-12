# Requirements: Cumpa

**Defined:** 2026-09-12
**Core Value:** A developer can accurately review repository-grounded changes chosen by a developer or coding agent and return precise, drift-detectable feedback the agent can act on.

## v1.6 Requirements

**Milestone:** v1.6 Workspace Restyle — restyle the whole browser review workspace to the approved mockup without changing any review, comment, persistence, or export mechanic.

**Visual contract:** `mockups/01b-quiet-workspace-tree.html` and its captured references `mockups/01b-desktop.png`, `mockups/01b-desktop-full.png`, `mockups/01b-mobile.png`. The running app must be visually equivalent at those viewports; divergence is allowed only where production data (Monaco, inline comments, unsupported or unavailable files, exact-patch sessions) requires it.

**Predecessor note:** v1.5 MIT Distribution completed all 23 plans but was never archived; its Phase 07 acceptance-evidence blocker is carried over unchanged and is out of this milestone's scope.

### Visual System

- [ ] **VIS-01**: Reviewers see one canonical semantic token root re-derived from the mockup's values — surfaces, borders, muted text, accent, status colors, and diff fills — with no second palette or hard-coded color left in component styles.
- [ ] **VIS-02**: Reviewers see Monaco colors that match the re-derived root byte-for-byte, so editor content never drifts from the surrounding workspace.
- [ ] **VIS-03**: Reviewers see the mockup's type scale, row density, spacing, and radius applied consistently across shell, sidebar, diff surface, dialogs, and controls.

### Workspace Shell

- [ ] **SHELL-01**: Reviewers see the mockup's identity header with the product mark and the ordered comparison strip, showing Base and Head labels for pinned sessions and preimage/postimage identity for exact-patch sessions.
- [ ] **SHELL-02**: Reviewers see the mockup's file toolbar above the diff — active file name, its directory path, and the file/sidebar toggle — instead of a permanently expanded metadata header.
- [ ] **SHELL-03**: Reviewers can hide and restore the changed-files sidebar, and the hidden sidebar is removed from tab order while hidden.
- [ ] **SHELL-04**: Reviewers on narrow viewports get the mockup's reflow, including the changed-files dialog in place of the persistent sidebar, with file → Base → Head reading order preserved.
- [ ] **SHELL-05**: Reviewers see the mockup's footer status line without any claim the product does not support.

### Changed-File Tree

- [ ] **TREE-01**: Reviewers read each changed file as one dense row showing its change status, file name, and addition/deletion counts, with unavailable or unsupported files still identified as non-reviewable.
- [ ] **TREE-02**: Reviewers see directory rows in the mockup's treatment, each showing how many changed files it contains.
- [ ] **TREE-03**: Reviewers keep the existing tree semantics after the restyle: nested directories, single-child path compaction, exact path ordering, all-expanded default, expand/collapse, selection, and roving-tabindex keyboard navigation (up, down, left, right, home, end, enter, space).
- [ ] **TREE-04**: Reviewers narrow the tree by typing in a filter field and see only matching files with their ancestor directories expanded.
- [ ] **TREE-05**: Reviewers who filter to no matches see an explicit empty state that tells them how to return to the full tree, and clearing the filter restores the previous tree with the open file still selected.

### Diff Surface

- [ ] **DIFF-01**: Reviewers read diffs on the restyled surface with Monaco still the diff authority — no hand-rolled diff rendering, line mapping, or syntax highlighting is introduced.
- [ ] **DIFF-02**: Reviewers see the mockup's quieter reading treatment for the diff — side identity labels, gutter and sign presentation, line and intraline fills, hunk separation, and hidden-region affordances — with removed and added meaning still explicit without relying on color alone.
- [ ] **DIFF-03**: Reviewers keep the existing expandable context, side-by-side geometry, and localized horizontal overflow behavior of the diff canvas.

### Review Surfaces

- [ ] **REV-01**: Reviewers create, edit, delete, resolve, and read line comments with unchanged mechanics, anchoring, and announcements on the restyled surface, including paired Base/Head card containment.
- [ ] **REV-02**: Reviewers see the comments rail in the restyled visual language with its existing states and navigation intact.
- [ ] **REV-03**: Reviewers open comparison metadata — identities, commit IDs, merge base, file metadata, keyboard help — from a Details dialog rather than a permanent toolbar.
- [ ] **REV-04**: Reviewers write the overall review summary and run export, including readiness, progress, receipts, and drift acknowledgement, from a Review-notes dialog that leaves the diff at full width.
- [ ] **REV-05**: Reviewers always see selector-drift, stale or orphaned anchor, patch-drift, and draft-recovery warnings in the workspace shell itself, never only inside a dialog, and their existing actions and single-owner live announcements remain intact.

### Behavior Continuity

- [ ] **CON-01**: Reviewers complete the existing end-to-end flow — launch, select file, comment, resolve, summarize, export, recover, and finish attached sessions — with no change to session, draft, persistence, export, or support mechanics.
- [ ] **CON-02**: Maintainers see the packaged Playwright review/export suite and the existing Vitest contract suites pass against the restyled UI, with any test that asserted removed presentation updated rather than skipped.
- [ ] **CON-03**: Maintainers see accessibility re-checked wherever markup structurally changed — focus reachability, roles, names, and keyboard operability of the new tree rows, filter, toolbar, and dialogs.

## Deferred

Tracked but not in this roadmap.

### Mockup affordances excluded from v1.6

- **DEFER-01**: Per-file viewed tracking with viewed marks, an Unviewed filter, and "N of M viewed" progress — requires a new persisted draft field.
- **DEFER-02**: Change-to-change (hunk) jump navigation with a position indicator.
- **DEFER-03**: A wrap-lines toggle for the diff surface.
- **DEFER-04**: Composited WCAG contrast re-verification of the re-derived palette, and the rest of the v1.1 accessibility gate battery (forced colors, 320px, true 400% zoom).

## Out of Scope

| Feature | Reason |
|---------|--------|
| Viewed tracking, Unviewed filter, viewed progress | Present in the mockup but needs a new persisted draft field; v1.6 is presentation only. |
| Hunk jump navigation and wrap-lines toggle | Present in the mockup but change review navigation behavior, not presentation. |
| Replacing Monaco with a custom diff renderer | Would re-implement line mapping, syntax highlighting, and comment anchoring, and breaks the documented diff-authority constraint. |
| Any change to session, draft, persistence, export, agent-handoff, or voluntary-support mechanics | The restyle must not become a second behavior authority. |
| Composited contrast re-verification of the new palette | Owner-accepted risk for v1.6; only structurally changed markup is re-checked. |
| Light theme or theme switching | Not requested; the product remains dark-only. |
| Closing the v1.5 Phase 07 acceptance-evidence blocker | Distribution acceptance is independent of the restyle and may not be closed with substitute evidence. |

## Traceability

Each active requirement maps to exactly one roadmap phase. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| VIS-01 | TBD | Pending |
| VIS-02 | TBD | Pending |
| VIS-03 | TBD | Pending |
| SHELL-01 | TBD | Pending |
| SHELL-02 | TBD | Pending |
| SHELL-03 | TBD | Pending |
| SHELL-04 | TBD | Pending |
| SHELL-05 | TBD | Pending |
| TREE-01 | TBD | Pending |
| TREE-02 | TBD | Pending |
| TREE-03 | TBD | Pending |
| TREE-04 | TBD | Pending |
| TREE-05 | TBD | Pending |
| DIFF-01 | TBD | Pending |
| DIFF-02 | TBD | Pending |
| DIFF-03 | TBD | Pending |
| REV-01 | TBD | Pending |
| REV-02 | TBD | Pending |
| REV-03 | TBD | Pending |
| REV-04 | TBD | Pending |
| REV-05 | TBD | Pending |
| CON-01 | TBD | Pending |
| CON-02 | TBD | Pending |
| CON-03 | TBD | Pending |

---
*Last updated: 2026-09-12 at v1.6 definition; 24 active requirement IDs awaiting phase assignment. v1.5 requirements archived to .planning/milestones/v1.5-REQUIREMENTS.md.*
