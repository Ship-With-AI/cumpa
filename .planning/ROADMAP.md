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

- [x] **Phase 08: Semantic Visual Foundation** — Establish the mockup-derived token root, Monaco parity, and shared typography, spacing, density, and radius language. (completed 2026-09-13)
- [x] **Phase 09: Changed-File Tree** — Deliver the mockup's dense, filterable, keyboard-operable changed-file navigation without losing existing tree semantics. (completed 2026-09-13)
- [x] **Phase 10: Diff Reading Surface** — Restyle the Monaco-authoritative diff into the mockup's quieter, explicit Base/Head reading surface while preserving geometry and context behavior. (completed 2026-09-13)
- [x] **Phase 11: Workspace Shell & Review Surfaces** — Compose the responsive shell, dialogs, inline comments, and comments rail while keeping critical warnings continuously visible. (completed 2026-09-14)
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

**Plans**: 7/5 plans complete

Plans:

- [x] 08-01-PLAN.md — Pure token contract, build-time root injection, and the shared node loader (wave 1)
- [x] 08-02-PLAN.md — Re-derive the canonical semantic token root and cut every CSS, Vue, and DESIGN.md consumer over to it (wave 2)
- [x] 08-03-PLAN.md — Derive the Monaco theme from the canonical root and turn the parity mirror into a real gate (wave 3)
- [x] 08-04-PLAN.md — Re-derive, harden, and wire the stray-literal and token-structure audit (wave 3)
- [x] 08-05-PLAN.md — Derive browser expectations from the root, take the browser suite green, and confirm the contract at the reference viewports (wave 4)

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

**Plans**: 6/5 plans complete

Plans:

- [x] 09-01-PLAN.md — Query-aware pruned projection, effective expansion, and the derived roving tab stop in the tree model (wave 1)
- [x] 09-02-PLAN.md — Land the four deferred geometry tokens with their consumers and rewrite the row and tree chrome CSS to the dense contract (wave 1)
- [x] 09-03-PLAN.md — Basename presentation with the full path as announced identity, plus recursive directory descendant counts (wave 2)
- [x] 09-04-PLAN.md — Compose the header, filter, scroller, recovery state, and hint, and bind tabindex to the single tab stop (wave 3)
- [x] 09-05-PLAN.md — Packaged browser evidence for filtering, recovery, and the tab stop, plus tree interior at the shipped contract viewports (wave 4)

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
- Keep `tests/unit/line-mapping.test.ts` and the anchoring behavior in `tests/integration/monaco-anchor.spec.ts` passing unchanged.
- Planning correction: `tests/unit/monaco-diff-semantics.test.ts` and `tests/unit/monaco-diff-adapter.test.ts` **cannot** stay unchanged. The decoration suite projects every decoration's sorted option keys, so the added hunk-boundary decorations change all five exhaustive arrays; the adapter suite gains the new option and density assertions. Also not listed but coupled: `tests/unit/monaco-theme.test.ts` enforces exhaustive theme-key set equality, and `tests/integration/anchored-workspace.spec.ts` pins the side-label markup nesting and the outer-overflow canary.

**Plans**: 6/5 plans complete

Plans:

- [x] 10-01-PLAN.md — Monaco public option surface and theme paint authority (wave 1)
- [x] 10-02-PLAN.md — Source-correct ariaLabel and responsive code typography (wave 2)
- [x] 10-03-PLAN.md — Hidden-region paint authority and token re-homing (wave 2)
- [x] 10-04-PLAN.md — Hunk-group boundary decorations (wave 3)
- [x] 10-05-PLAN.md — Side-label geometry and phase-wide green (wave 4)

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

- Update shell, dialog, and presentation selectors in `tests/e2e/responsive-session.spec.ts`, `tests/e2e/pinned-session.spec.ts`, `tests/integration/export-receipt-ui.spec.ts`, and `tests/integration/anchored-workspace.spec.ts` for the new composition.
- Re-point summary/export/attached-completion assertions that reach those surfaces through the comments rail: `tests/e2e/agent-ready-export-safety.spec.ts` (harness mounts `ReviewPanel.vue` directly at `:18`), `tests/e2e/complete-review-draft.spec.ts:328-329`, and `tests/integration/selector-drift-ui.spec.ts:342-360`.
- Re-author the REV-05 live-owner assertions: `tests/e2e/review-panel-resolved.spec.ts:331-342` (lines 333 and 342 share one locator built at `:332`; the visual block at `:344-353` stays byte-unchanged) and `tests/integration/selector-drift-ui.spec.ts:336` (locates the notice by the exact `role="status"` REV-05 removes, so it cannot stay unchanged).
- `tests/integration/complete-review-panel.spec.ts` needs no edit — it is a 33-line `createReviewDraftState` model test with zero DOM selectors.
- Keep draft-recovery behavior in `tests/integration/draft-recovery-ui.spec.ts`, comment mechanics in `tests/e2e/anchored-review.spec.ts`, the Phase 09 tree contract in `tests/e2e/file-tree.spec.ts`, the Phase 10 diff contract in `tests/integration/monaco-anchor.spec.ts`, and all persistence, export, attached-completion, and support contract tests passing unchanged.

**Plans:** 9/7 plans complete

Plans:

- [x] 11-01-PLAN.md — Geometry tokens, breakpoint unification, drift-gate realignment, ModalDialog extraction
- [x] 11-02-PLAN.md — Shell chrome: identity header, active-file toolbar, footer, sidebar hide/restore
- [x] 11-03-PLAN.md — Details dialog: identity, revived file metadata, keyboard help
- [x] 11-04-PLAN.md — ReviewPanel split, Review-notes dialog, comments-rail restyle
- [x] 11-07-PLAN.md — REV-01 inline comment surfaces restyled; two dead components deleted (wave 5)
- [x] 11-05-PLAN.md — Narrow reflow and the Changed files dialog
- [x] 11-06-PLAN.md — REV-05 shell warning stack and single-owner live behaviour

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
| 08. Semantic Visual Foundation | 7/5 | Complete   | 2026-09-13 |
| 09. Changed-File Tree | 6/5 | Complete   | 2026-09-13 |
| 10. Diff Reading Surface | 6/5 | Complete   | 2026-09-13 |
| 11. Workspace Shell & Review Surfaces | 9/7 | Complete   | 2026-09-14 |
| 12. Behavior Continuity | 0/TBD | Not started | — |
