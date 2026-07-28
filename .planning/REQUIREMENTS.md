# Requirements: Diff Review

**Defined:** 2026-07-24
**Core Value:** A developer can accurately review committed changes between any two local branch or worktree heads and export precise, drift-detectable feedback an agent can act on.

## v1.1 Requirements

Requirements for the GitHub Dark Diff milestone. Each maps to exactly one roadmap phase.

### Visual Foundation

- [x] **VIS-01**: User experiences one coherent GitHub dark-default-inspired surface hierarchy across the diff workspace without light panels or browser-default control flashes.
- [x] **VIS-02**: User sees compact GitHub-familiar UI typography and density while code, line numbers, labels, and controls remain legible and aligned.
- [x] **VIS-03**: User can distinguish workspace regions through restrained surface steps, borders, radii, and overlay-only elevation without decorative effects competing with code.
- [x] **VIS-04**: User can identify the current file and its Base/Head context from a compact file header that preserves every existing file and diff control.

### Diff Semantics

- [x] **DIFF-01**: User sees the Monaco diff canvas, syntax tokens, gutters, widgets, and surrounding workspace rendered from one coordinated dark semantic palette.
- [x] **DIFF-02**: User can distinguish added, deleted, intraline-changed, hunk, unchanged, and empty diff regions while code remains readable over every layer.
- [x] **DIFF-03**: User can distinguish Base from Head and deletion from addition without relying on red and green alone.
- [x] **DIFF-04**: User sees legible line-number gutters, active-line emphasis, and the existing comment affordance without code movement or gutter reflow.
- [x] **DIFF-05**: User can distinguish text selection, active lines, hover targets, comment anchors, keyboard focus, and addition or deletion meaning when those states overlap.

### Review Surfaces

- [x] **REVW-01**: User can distinguish rest, hover, pressed, selected, focused, disabled, destructive, and busy states on every existing diff-workspace control.
- [x] **REVW-02**: User can read and operate inline comment composers and comment cards in the dark workspace with clear anchors, headings, validation, and lifecycle status.
- [x] **REVW-03**: User can scan the review rail through clear heading, count, group, card, form, and selected-comment hierarchy.
- [x] **REVW-04**: User can distinguish error, warning, informational, success, pending, disabled, open, and resolved states through text or icons and structural treatment in addition to color.

### Accessibility and Responsive Layout

- [ ] **A11Y-01**: User can read normal text and identify meaningful UI indicators at WCAG 2.2 AA contrast after translucent diff, selection, and state layers are composited.
- [ ] **A11Y-02**: Keyboard user sees a persistent, unclipped focus indicator on every operable diff-workspace control and editor affordance.
- [ ] **A11Y-03**: User retains durable labels, markers, borders, and focus cues when browser or operating-system forced-colors behavior overrides the palette.
- [ ] **RESP-01**: User can use headers, controls, drawers, comments, notices, and forms at narrow widths and 400% zoom without page-wide horizontal scrolling; only the side-by-side diff owns localized two-dimensional scrolling.

### Workflow Continuity

- [ ] **CONT-01**: User can complete the existing file navigation, side-by-side review, commenting, summary, and export workflow after the restyle with unchanged information architecture, keyboard commands, persistence, and review mechanics.

## Future Requirements

### Additional Themes

- **THEME-01**: User can choose a complete light color mode with state parity to the dark workspace.
- **THEME-02**: User can choose additional high-contrast or branded color modes with full state parity.

### Review Mechanics

- **MECH-01**: User can use additional GitHub-style review mechanics such as viewed files, replies, suggestions, approvals, or pending-review submission after separate product and contract design.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Pixel-for-pixel GitHub clone or GitHub branding | The milestone is a close semantic adaptation that preserves Diff Review's local identity. |
| Outer application information-architecture redesign | Scope is the existing diff workspace and the states already rendered within it. |
| Light theme or theme switch | Dark-only precision avoids doubling the palette and verification matrix in v1.1. |
| New review mechanics | Replies, suggestions, approvals, viewed state, and pending review change behavior, persistence, and contracts. |
| Primer runtime dependency | Current Vue, Monaco, and native CSS stack can implement the design without a second UI system. |
| Monaco replacement or custom diff renderer | Existing line mapping, syntax, view zones, accessibility, and durable comment anchors remain authoritative. |
| Remote fonts or network-hosted visual assets | Diff Review remains local-first and must avoid network dependence, layout shifts, and privacy leakage. |

## Traceability

Roadmap mapping for the approved v1.1 milestone.

| Requirement | Phase | Status |
|-------------|-------|--------|
| VIS-01 | Phase 05 | Complete |
| VIS-02 | Phase 05 | Complete |
| VIS-03 | Phase 05 | Complete |
| VIS-04 | Phase 07 | Complete |
| DIFF-01 | Phase 06 | Complete |
| DIFF-02 | Phase 06 | Complete |
| DIFF-03 | Phase 06 | Complete |
| DIFF-04 | Phase 06 | Complete |
| DIFF-05 | Phase 06 | Complete |
| REVW-01 | Phase 07 | Complete |
| REVW-02 | Phase 07 | Complete |
| REVW-03 | Phase 07 | Complete |
| REVW-04 | Phase 07 | Complete |
| A11Y-01 | Phase 08 | Pending |
| A11Y-02 | Phase 08 | Pending |
| A11Y-03 | Phase 08 | Pending |
| RESP-01 | Phase 08 | Pending |
| CONT-01 | Phase 08 | Pending |

**Coverage:**

- v1.1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-07-24*
*Last updated: 2026-07-24 v1.1 roadmap mapping*
