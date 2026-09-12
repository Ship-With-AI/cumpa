# Roadmap: Cumpa

## Milestones

- **[v1.0 MVP](./milestones/v1.0-ROADMAP.md)** — Phases 01–04.1, 40 plans, shipped 2026-07-24.
- **[v1.1 GitHub Dark Diff](./milestones/v1.1-ROADMAP.md)** — Phases 05–08, 16 plans, 18/18 requirements, shipped 2026-07-29.
- **[v1.2 Fast Source Discovery](./milestones/v1.2-ROADMAP.md)** — Phases 09–11, 4 plans, 5/5 requirements, shipped 2026-07-30.
- **[v1.3 Agent Review Handoff](./milestones/v1.3-ROADMAP.md)** — Phases 12–15, 14 plans, 42 tasks, 17/17 requirements, shipped 2026-08-06.
- **[v1.4 Voluntary Support](./milestones/v1.4-ROADMAP.md)** — Phases 01–02, 22 plans, 30 tasks, 12/12 requirements, shipped 2026-09-04.
- **[v1.5 MIT Distribution](./milestones/v1.5-ROADMAP.md)** — Phases 03–07, 19 requirements.
- **v1.6 Workspace Restyle** — Phases 08–12, 24 requirements, planned.

## Overview

Cumpa restyles the existing browser review workspace to the approved visual contract in `mockups/01b-quiet-workspace-tree.html`, `mockups/01b-desktop.png`, `mockups/01b-desktop-full.png`, and `mockups/01b-mobile.png`. The work proceeds through five dependency-ordered outcomes: establish one mockup-derived semantic visual system shared exactly with Monaco; deliver the dense, filterable changed-file tree; quiet the Monaco-authoritative diff reading surface; compose the responsive shell, metadata and review dialogs, inline comments, and comments rail; then prove the unchanged review-to-export and attached-session workflow. Session, draft, persistence, export, agent-handoff, and voluntary-support mechanics remain unchanged. Selector drift, stale and orphaned anchors, patch drift, and draft recovery remain visible in the workspace shell rather than only in dialogs.

## Phases

- [ ] **Phase 08: Semantic Visual Foundation** — Establish the mockup-derived token root, Monaco parity, and shared typography, spacing, density, and radius language.
- [ ] **Phase 09: Changed-File Tree** — Deliver the mockup's dense, filterable, keyboard-operable changed-file navigation without losing existing tree semantics.
- [ ] **Phase 10: Diff Reading Surface** — Restyle the Monaco-authoritative diff into the mockup's quieter, explicit Base/Head reading surface while preserving geometry and context behavior.
- [ ] **Phase 11: Workspace Shell & Review Surfaces** — Compose the responsive shell, dialogs, inline comments, and comments rail while keeping critical warnings continuously visible.
- [ ] **Phase 12: Behavior Continuity** — Prove the complete restyled workflow preserves review contracts, packaged behavior, and structural accessibility.

## Phase Details

### Phase 08: Semantic Visual Foundation

**Goal**: Reviewers see one mockup-derived visual system shared exactly by the workspace and Monaco before any surface-specific restyling consumes it.
**Depends on**: Phase 07 implementation baseline
**Requirements**: VIS-01, VIS-02, VIS-03
**UI hint**: yes
**Success Criteria** (what must be TRUE):

1. One canonical semantic token root supplies the mockup's surfaces, borders, text hierarchy, accent, status colors, diff fills, typography, spacing, density, and radii to shell, tree, diff, dialog, and control styles.
2. Monaco canvas, gutters, widgets, syntax, selections, and diff fills resolve to byte-identical values from that canonical root rather than maintaining a second palette.
3. Component styles contain no independent hard-coded color palette, and an automated parity check rejects future CSS/Monaco color drift.
4. A representative workspace at the reference desktop and mobile viewports visibly adopts the contract's dark surfaces, compact scale, and quiet control treatment without changing interaction behavior.

**Expected test impact**:

- Update the palette and presentation expectations in `tests/unit/monaco-theme.test.ts` and the semantic-style assertions in `tests/e2e/responsive-session.spec.ts` to the canonical root.
- Keep `tests/unit/monaco-diff-semantics.test.ts`, `tests/unit/monaco-diff-adapter.test.ts`, `tests/unit/workspace-state.test.ts`, and the API, Git, draft, persistence, and export contract suites passing unchanged.

**Plans**: TBD

### Phase 09: Changed-File Tree

**Goal**: Reviewers can scan, filter, and keyboard-navigate the mockup's dense changed-file tree without losing existing tree semantics or selection.
**Depends on**: Phase 08
**Requirements**: TREE-01, TREE-02, TREE-03, TREE-04, TREE-05
**UI hint**: yes
**Success Criteria** (what must be TRUE):

1. Each dense file row shows status, filename, signed addition/deletion counts, and a clear unsupported or unavailable identity; each directory row shows its descendant changed-file count.
2. Nested directories, single-child path compaction, exact path ordering, all-expanded default, collapse/expand, selection, and roving-tabindex operation for Up, Down, Left, Right, Home, End, Enter, and Space remain observable.
3. Typing in the tree filter shows only matching files with their ancestor directories visible and force-expanded.
4. A no-match filter state explains how to restore the full tree, and clearing the filter restores the tree with the open file still selected.
5. The desktop sidebar and narrow changed-files presentation match the reference tree density and hierarchy at their contract viewports.

**Expected test impact**:

- Extend `tests/unit/file-tree.test.ts` for filter reconciliation and ancestor expansion while preserving its existing ordering, selection, expansion, and keyboard expectations.
- Update the presentation and accessible-name assertions in `tests/e2e/file-tree.spec.ts` and the changed-files portions of `tests/e2e/responsive-session.spec.ts`; keep existing file-selection and content-loading flows in `tests/e2e/pinned-session.spec.ts` unchanged.

**Plans**: TBD

### Phase 10: Diff Reading Surface

**Goal**: Reviewers read the same Monaco-authoritative comparison through the mockup's quieter, explicit Base/Head diff treatment.
**Depends on**: Phase 09
**Requirements**: DIFF-01, DIFF-02, DIFF-03
**UI hint**: yes
**Success Criteria** (what must be TRUE):

1. Production diffs remain rendered and mapped by Monaco as the sole diff authority, including comment anchor placement and syntax highlighting.
2. Base/Head or preimage/postimage side labels, removed/added text, gutter bars and signs, line and intraline fills, hunk separation, and hidden-region affordances match the quiet reference and communicate meaning without color alone.
3. Existing expandable context, side-by-side geometry, paired comment-card alignment, and the 640px diff canvas with localized horizontal overflow remain intact.
4. Desktop, full-desktop, and mobile views keep the diff readable without introducing document-level horizontal overflow.

**Expected test impact**:

- Update diff presentation assertions in `tests/e2e/responsive-session.spec.ts` and side-label assertions in `tests/e2e/anchored-review.spec.ts` and `tests/e2e/complete-review-draft.spec.ts`.
- Keep `tests/unit/line-mapping.test.ts`, `tests/unit/monaco-diff-semantics.test.ts`, `tests/unit/monaco-diff-adapter.test.ts`, and the anchoring behavior in `tests/integration/monaco-anchor.spec.ts` passing unchanged.

**Plans**: TBD

### Phase 11: Workspace Shell & Review Surfaces

**Goal**: Reviewers use the mockup-equivalent shell, dialogs, inline comment surfaces, comments rail, and mobile files flow while critical warnings remain continuously visible.
**Depends on**: Phase 10
**Requirements**: SHELL-01, SHELL-02, SHELL-03, SHELL-04, SHELL-05, REV-01, REV-02, REV-03, REV-04, REV-05
**UI hint**: yes
**Success Criteria** (what must be TRUE):

1. Desktop and full-desktop references show the product identity header, ordered comparison strip, active-file toolbar, optional files sidebar, full-width diff, Review notes entry, and footer in the mockup composition; exact-patch sessions show preimage/postimage identity, and all three reference captures remain visually equivalent except for documented production-data differences.
2. Reviewers can hide and restore the desktop files sidebar with hidden content removed from tab order; narrow viewports use the changed-files dialog and preserve file → Base → Head reading order.
3. A Details dialog exposes comparison identities, commit and merge-base data, file metadata, and keyboard help, while a Review-notes dialog exposes summary, export readiness, progress, receipts, drift acknowledgement, and attached-session completion without narrowing the diff.
4. Inline comments and the comments rail retain create, edit, delete, resolve, reopen, show, navigate, announce, and paired Base/Head card-containment behavior in the new visual language.
5. Selector drift, stale or orphaned anchors, patch drift, and draft recovery remain visible in the workspace shell with their existing actions and single-owner live announcements, never solely inside a dialog.

**Expected test impact**:

- Update shell, dialog, and presentation selectors in `tests/e2e/responsive-session.spec.ts`, `tests/integration/complete-review-panel.spec.ts`, `tests/integration/export-receipt-ui.spec.ts`, and `tests/integration/anchored-workspace.spec.ts` for the new composition.
- Keep warning behavior in `tests/integration/selector-drift-ui.spec.ts` and `tests/integration/draft-recovery-ui.spec.ts`, comment mechanics in `tests/e2e/anchored-review.spec.ts`, and all selector-drift, draft, persistence, export, attached-completion, and support contract tests passing unchanged.

**Plans**: TBD

### Phase 12: Behavior Continuity

**Goal**: Reviewers complete the unchanged review-to-export and attached-session workflow while maintainers have packaged and accessibility evidence for the integrated restyle.
**Depends on**: Phase 11
**Requirements**: CON-01, CON-02, CON-03
**UI hint**: yes
**Success Criteria** (what must be TRUE):

1. A human reviewer completes launch → file selection → line comment → resolve → summary → export → recovery → attached Finish through the restyled workspace with unchanged session, draft, persistence, export, agent-handoff, and voluntary-support mechanics.
2. The packaged Playwright review/export suite and existing Vitest contract suites pass against the restyled UI; assertions tied only to removed presentation are updated rather than skipped.
3. Structurally changed tree rows, filter, toolbar, files dialog, Details dialog, and Review-notes dialog retain focus reachability, appropriate roles and names, and keyboard operation.
4. Desktop, full-desktop, and mobile captures are visually equivalent to the approved contract except for documented production-data differences.

**Expected test impact**:

- Reconcile only remaining presentation-dependent selectors in `tests/e2e/file-tree.spec.ts`, `tests/e2e/pinned-session.spec.ts`, `tests/e2e/anchored-review.spec.ts`, `tests/e2e/complete-review-draft.spec.ts`, `tests/e2e/agent-ready-export.spec.ts`, and `tests/e2e/responsive-session.spec.ts`; do not skip covered flows.
- Keep the existing Vitest session, draft, persistence, export, agent-ready handoff, exact-patch, selector-drift, and voluntary-support contract suites passing unchanged.

**Plans**: TBD

## Progress

**Execution Order:** Phase 08 → Phase 09 → Phase 10 → Phase 11 → Phase 12

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 08. Semantic Visual Foundation | 0/TBD | Not started | — |
| 09. Changed-File Tree | 0/TBD | Not started | — |
| 10. Diff Reading Surface | 0/TBD | Not started | — |
| 11. Workspace Shell & Review Surfaces | 0/TBD | Not started | — |
| 12. Behavior Continuity | 0/TBD | Not started | — |
