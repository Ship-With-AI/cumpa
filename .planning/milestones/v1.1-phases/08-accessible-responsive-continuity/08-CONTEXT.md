# Phase 08: Accessible Responsive Continuity - Context

**Gathered:** 2026-07-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Harden the existing side-by-side review workspace so users can complete file navigation, diff review, commenting, summary, and export across desktop, narrow, 400% zoom, keyboard, grayscale, and forced-color contexts. Preserve the current information architecture, commands, focus destinations, persistence, review mechanics, Monaco authority, and local-first behavior. Only the side-by-side diff may own localized two-dimensional scrolling; the surrounding page, headers, controls, drawers, comments, notices, and forms must reflow without page-wide horizontal scrolling.

</domain>

<decisions>
## Implementation Decisions

### Narrow header reflow
- **D-01:** When the existing Base | file | Head header no longer fits, reflow it to active file identity first, Base/Head endpoints second, and the existing toolbar last. This keeps the current file as the primary orientation cue while preserving comparison context and all controls.
- **D-02:** Keep Base and Head paired left/right while each endpoint remains usable. At the smallest effective widths, stack Base above Head with explicit labels rather than truncate meaningful selector identities. Preserve Base-before-Head reading order and the established relationship to the Monaco panes.
- **D-03:** Reflow the toolbar only at semantic-group boundaries. Keep each previous/next pair intact, preserve file navigation before change navigation before Review/Keyboard Help, and move whole groups to later rows as needed. Do not split pairs unpredictably or replace visible controls with a menu.
- **D-04:** Allow the complete active path to wrap without hiding content, while retaining quieter directory text and stronger filename emphasis. For renamed or copied files, stack the existing old → new identity when necessary at the smallest widths rather than depending on ellipsis or hover-only disclosure.

### Claude's Discretion
Exact responsive breakpoints, endpoint minimums, wrapping thresholds, row/column gaps, and the smallest-width stack geometry remain flexible. Drawer width behavior, non-header long-content wrapping, forced-color system-color mappings, composited-contrast adjustments, and validation scenario details were not selected for discussion; research and planning should choose the smallest standards-aligned implementation that satisfies A11Y-01 through A11Y-03, RESP-01, and CONT-01. All such choices remain bounded by the inherited semantic-token, non-color-cue, unclipped-focus, side-by-side Monaco, and unchanged-workflow contracts.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase contract
- `.planning/ROADMAP.md` — Phase 08 goal, five success criteria, dependency order, localized-scroll ownership, representative validation contexts, and unchanged-workflow boundary.
- `.planning/REQUIREMENTS.md` — A11Y-01, A11Y-02, A11Y-03, RESP-01, and CONT-01 plus exclusions covering information-architecture redesign, new review mechanics, additional themes, Primer, remote assets, and Monaco replacement.
- `.planning/PROJECT.md` — v1.1 presentation-only goal, active accessibility and continuity requirements, runtime constraints, current product state, and milestone decisions.

### Inherited visual, editor, and review contracts
- `.planning/phases/05-semantic-dark-foundation/05-CONTEXT.md` — locked dark-default semantic vocabulary, typography, density, shape, elevation, and centralized styling decisions.
- `.planning/phases/05-semantic-dark-foundation/05-UI-SPEC.md` — semantic roles, state matrix, focus geometry, control sizing, responsive foundation, and non-color accessibility constraints.
- `.planning/phases/06-monaco-diff-semantics/06-CONTEXT.md` — locked diff layering, signed Base/Head cues, selection, active-line, anchor, focus, and immutable-editor decisions.
- `.planning/phases/06-monaco-diff-semantics/06-UI-SPEC.md` — Monaco theme, side-by-side geometry, decoration, view-zone, anchor-rail, and overlap invariants that responsive and forced-color work must preserve.
- `.planning/phases/07-github-familiar-review-surfaces/07-CONTEXT.md` — locked file-header, toolbar, inline conversation, review-rail, control-state, notice, and workflow-preservation decisions.
- `.planning/phases/07-github-familiar-review-surfaces/07-UI-SPEC.md` — detailed review-surface hierarchy, interaction states, labels, icon treatment, responsive handoff, and accessibility acceptance boundaries.

No external design specification or ADR is canonical for this phase.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/web/App.vue`: already composes active file identity, Base/Head endpoint data, `ReviewToolbar`, side-by-side `DiffWorkspace`, Files drawer, and Review drawer. The narrow header reflow can preserve this source authority and component order.
- `src/web/components/ReviewToolbar.vue`: already exposes three semantic groups—file navigation, change navigation, and labeled Review/Keyboard Help actions—with stable commands, tooltips, ARIA relationships, and disabled behavior.
- `src/web/components/PathDisplay.vue` and `src/web/components/ui/PathText.vue`: already separate directory and filename presentation and preserve renamed/copied old → new semantics, providing the exact structure needed for complete wrapping without reconstructing paths.
- `src/web/styles.css`: remains the single global semantic stylesheet and already owns all workspace breakpoints, drawer geometry, focus treatment, reduced-motion behavior, and forced-colors overrides.
- `src/web/monaco/theme.ts` and `src/web/components/DiffWorkspace.vue`: own the fixed typed Monaco palette, public side-by-side editor surface, Base/Head labels, signed diff cues, anchors, and localized editor geometry that Phase 08 must harden rather than replace.

### Established Patterns
- Presentation stays centralized in `src/web/styles.css`; Vue templates provide semantic hooks and existing behavior rather than introducing scoped styles, a second token root, or new layout state.
- At widths below 1100px the existing Files and Review regions already become edge drawers. At 767px the header and toolbar begin wrapping, but `.review-main` is still forced to 640px and `.review-shell` owns overflow; this is the concrete page-wide horizontal-scroll conflict Phase 08 must remove.
- The global two-pixel `:focus-visible` ring, Phase 06 signed gutter/anchor geometry, and Phase 07 icon-plus-label/status structures are already the non-color and keyboard foundations. Phase 08 should make them survive clipping, composition, zoom, and forced-color overrides instead of inventing parallel cues.
- Existing forced-colors CSS maps generic shells, controls, selected tree rows, and focus to system colors, but does not yet cover all Phase 06/07 Monaco signs, comment anchors, selected comments, badges, header regions, and conversation surfaces.

### Integration Points
- Reflow `.review-context-header__context`, `.review-context-header__file`, endpoint blocks, and `.review-context-header__toolbar` in `src/web/styles.css` while retaining the current `App.vue` data and DOM semantics.
- Make `.review-shell` and `.review-main` fit the visual viewport at narrow and zoomed widths; keep horizontal and vertical two-dimensional overflow localized to the Monaco diff host.
- Extend existing forced-color and focus rules through current semantic classes rather than changing state or adding duplicate accessibility ownership.
- Evolve `tests/integration/anchored-workspace.spec.ts` from its current 640px fixed-main expectation into the Phase 08 narrow, zoomed, keyboard, forced-color, scroll-ownership, and unchanged-workflow regression boundary; retain focused Monaco and review-surface suites for overlapping states.

</code_context>

<specifics>
## Specific Ideas

- Narrow header reading order is file → comparison endpoints → toolbar.
- Base/Head remain a paired left/right row until that row becomes unusable, then stack explicitly in Base-before-Head order.
- Toolbar wrapping follows semantic groups; previous/next pairs never split merely because a flex row ran out of space.
- Full path identity remains available without hover. Directory/filename emphasis survives wrapping, and renamed old → new identities may stack.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-Accessible Responsive Continuity*
*Context gathered: 2026-07-28*
