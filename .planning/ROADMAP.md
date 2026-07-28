# Roadmap: Diff Review

## Overview

v1.1 is a presentation-only adaptation of the shipped Diff Review workspace. Work proceeds from one dark semantic foundation, through Monaco diff semantics and the surrounding review surfaces, to responsive and accessibility hardening that proves the existing local review workflow remains unchanged.

## Milestones

- **v1.0 MVP** — Phases 01–04 plus closure Phase 04.1 (shipped 2026-07-24)
- **v1.1 GitHub Dark Diff** — Phases 05–08 (planned)

## Phases

<details>
<summary>v1.0 MVP — SHIPPED 2026-07-24</summary>

- [x] **Phase 01: Pinned Local Comparison** — 13/13 plans, completed 2026-07-20
- [x] **Phase 02: Anchored Diff Review** — 10/10 plans, completed 2026-07-21
- [x] **Phase 03: Complete Review Draft** — 7/7 plans, completed 2026-07-23
- [x] **Phase 04: Agent-Ready Export** — 8/8 plans, completed 2026-07-23
- [x] **Phase 04.1: Close CMT-01 Async Comment Settlement** — 2/2 plans, completed 2026-07-24

Full phase goals, success criteria, requirement mappings, and plan details are archived in `.planning/milestones/v1.0-ROADMAP.md`.

</details>

### v1.1 GitHub Dark Diff

- [x] **Phase 05: Semantic Dark Foundation** Establish one coherent dark-only visual language for the existing diff workspace. (completed 2026-07-26)
- [x] **Phase 06: Monaco Diff Semantics** — Make every diff, gutter, selection, and overlapping editor state legible within that language. (completed 2026-07-27)
- [x] **Phase 07: GitHub-Familiar Review Surfaces** — Adapt the file header, controls, comments, notices, and review rail without changing review mechanics. (completed 2026-07-28)
- [ ] **Phase 08: Accessible Responsive Continuity** — Prove the restyled workspace remains accessible, reflows safely, and preserves the complete review workflow.

## Phase Details

### Phase 05: Semantic Dark Foundation

**Goal**: Users experience one coherent GitHub dark-default-inspired visual foundation across the existing diff workspace while Diff Review retains its own identity.
**Depends on**: Phase 04.1 (v1.0 complete)
**Requirements**: VIS-01, VIS-02, VIS-03
**Success Criteria** (what must be TRUE):

  1. User sees a consistently dark workspace across page, panels, drawers, controls, loading, empty, and error surfaces without light panels or browser-default flashes.
  2. User can read compact, GitHub-familiar interface typography while code, labels, line numbers, and controls remain legible and aligned.
  3. User can distinguish canvas, inset, raised, and interactive regions through restrained surface steps, borders, radii, and overlay-only elevation without decoration competing with code.

**Planning detail**: Establish one dark-only semantic vocabulary for surfaces, text, borders, controls, status, focus, selection, and diff roles; migrate existing CSS consumers rather than layering a second palette. Keep current Vue structure, DOM semantics, local copy, and dependencies intact.
**Plans**: 1/1 plans complete

Plans:

- [x] 05-01-PLAN.md — Replace both visual vocabularies with one semantic dark CSS contract and prove every foundation state in focused Chromium flows.

**UI hint**: yes

### Phase 06: Monaco Diff Semantics

**Goal**: Users can accurately interpret the side-by-side Monaco diff when editor layers and surrounding workspace share the same dark semantic contract.
**Depends on**: Phase 05
**Requirements**: DIFF-01, DIFF-02, DIFF-03, DIFF-04, DIFF-05
**Success Criteria** (what must be TRUE):

  1. User sees the Monaco canvas, syntax tokens, gutters, widgets, and surrounding workspace as one coordinated dark interface.
  2. User can distinguish additions, deletions, intraline changes, hunks, unchanged regions, and empty diff regions while text remains readable over every layer.
  3. User can tell Base/deletion from Head/addition without relying on red versus green alone.
  4. User sees legible line-number gutters, active-line emphasis, and the existing comment affordance without movement or gutter reflow.
  5. User can still distinguish selection, active lines, hover targets, comment anchors, keyboard focus, and diff meaning when those states overlap.

**Planning detail**: Register an idempotent typed Monaco theme before editor construction and map the shared semantic roles into editor, syntax, diff, gutter, widget, selection, unchanged-region, and focus colors. Preserve the existing adapter, models, line mapping, view zones, hidden regions, side-by-side geometry, accessibility labels, and keyboard commands.
**Plans**: 3/3 plans executed

Plans:
**Wave 1**

- [x] 06-01-PLAN.md — Define and audit the exact typed diff-review-dark theme contract.
- [x] 06-02-PLAN.md — Derive deterministic continuous bars and sparse signed gutter cues from Monaco line changes.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 06-03-PLAN.md — Integrate all Monaco semantic layers and prove overlap, contrast, no-reflow, and lifecycle behavior in Chromium.

**UI hint**: yes

### Phase 07: GitHub-Familiar Review Surfaces

**Goal**: Users can operate every existing review surface through a close GitHub dark diff adaptation with clear hierarchy and complete interaction-state feedback.
**Depends on**: Phase 06
**Requirements**: VIS-04, REVW-01, REVW-02, REVW-03, REVW-04
**Success Criteria** (what must be TRUE):

  1. User can identify the current file and its Base/Head context in a compact file header that retains every existing file and diff control.
  2. User can distinguish rest, hover, pressed, selected, focused, disabled, destructive, and busy states on every existing diff-workspace control.
  3. User can read and operate inline comment composers and comment cards with clear anchors, headings, validation, and lifecycle status.
  4. User can scan the review rail through clear heading, count, group, card, form, and selected-comment hierarchy.
  5. User can distinguish error, warning, informational, success, pending, disabled, open, and resolved states through text or icons and structural treatment in addition to color.

**Planning detail**: Restyle the existing file tree and header, toolbar, drawers, inline view-zone content, comment composer and cards, review rail, notices, conflict and recovery states, summary, and export surfaces. Reuse current components, semantic hooks, ARIA relationships, focus targets, events, and state transitions; add no review mechanics or information-architecture changes.
**Plans**: 9/9 plans complete

- [x] 07-07-PLAN.md
- [x] 07-08-PLAN.md
- [x] 07-09-PLAN.md

**Wave 1**

- [x] 07-01-PLAN.md

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 07-02-PLAN.md

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 07-03-PLAN.md

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 07-04-PLAN.md

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 07-05-PLAN.md

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 07-06-PLAN.md

**UI hint**: yes

### Phase 08: Accessible Responsive Continuity

**Goal**: Users can complete the unchanged review workflow across desktop, narrow, zoomed, keyboard, and forced-color contexts without losing meaning or operability.
**Depends on**: Phase 07
**Requirements**: A11Y-01, A11Y-02, A11Y-03, RESP-01, CONT-01
**Success Criteria** (what must be TRUE):

  1. User can read normal text and identify meaningful indicators at WCAG 2.2 AA contrast after translucent diff, selection, comment, and status layers are composited.
  2. Keyboard user sees a persistent, unclipped focus indicator on every operable workspace control and editor affordance.
  3. User retains durable labels, markers, borders, and focus cues when browser or operating-system forced-colors behavior overrides the palette.
  4. User can use headers, controls, drawers, comments, notices, and forms at narrow widths and 400% zoom without page-wide horizontal scrolling; only the side-by-side diff owns localized two-dimensional scrolling.
  5. User can complete existing file navigation, side-by-side review, commenting, summary, and export with unchanged information architecture, keyboard commands, persistence, and review mechanics.

**Planning detail**: Validate representative desktop, narrow, zoomed, overlapping-state, grayscale, and forced-color scenarios after all real review surfaces are styled. Keep the diff viewport as the sole localized two-dimensional scroll owner and use the existing end-to-end workflow as the behavioral regression boundary.
**Plans:** 1/3 plans executed

**Wave 1**

- [x] 08-01-PLAN.md — Reflow the existing header, drawers, and workspace around one localized 640px diff canvas without changing Monaco or review mechanics.

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 08-02-PLAN.md — Harden composited contrast, persistent focus, and forced-color cues through the shared CSS contract and real browser states.

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 08-03-PLAN.md — Prove the full responsive, zoom, grayscale, forced-color, keyboard, persistence, and export continuity matrix.

**UI hint**: yes

## Progress

**Execution order:** Phase 05 → Phase 06 → Phase 07 → Phase 08

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 01. Pinned Local Comparison | v1.0 | 13/13 | Complete | 2026-07-20 |
| 02. Anchored Diff Review | v1.0 | 10/10 | Complete | 2026-07-21 |
| 03. Complete Review Draft | v1.0 | 7/7 | Complete | 2026-07-23 |
| 04. Agent-Ready Export | v1.0 | 8/8 | Complete | 2026-07-23 |
| 04.1. Close CMT-01 Async Comment Settlement | v1.0 | 2/2 | Complete | 2026-07-24 |
| 05. Semantic Dark Foundation | v1.1 | 1/1 | Complete    | 2026-07-26 |
| 06. Monaco Diff Semantics | v1.1 | 3/3 | Complete    | 2026-07-27 |
| 07. GitHub-Familiar Review Surfaces | v1.1 | 9/9 | Complete    | 2026-07-28 |
| 08. Accessible Responsive Continuity | v1.1 | 1/3 | In Progress|  |

**v1.1 coverage:** 4 phases, 18 requirements, 18 mapped, 0 unmapped.
