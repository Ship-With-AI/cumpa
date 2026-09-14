# Phase 08: Semantic Visual Foundation - Context

**Gathered:** 2026-09-13
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Reviewers see one mockup-derived visual system shared exactly by the workspace and Monaco before any surface-specific restyling consumes it.

**Requirements:** VIS-01, VIS-02, VIS-03

- VIS-01: One canonical semantic token root re-derived from the mockup's values — surfaces, borders, muted text, accent, status colors, diff fills — with no second palette or hard-coded color left in component styles.
- VIS-02: Monaco colors match the re-derived root byte-for-byte, so editor content never drifts from the surrounding workspace.
- VIS-03: The mockup's type scale, row density, spacing, and radius applied consistently across shell, sidebar, diff surface, dialogs, and controls.

**Out of scope:** surface-specific restyling of the changed-file tree (Phase 09), diff reading surface treatment (Phase 10), shell/dialog/comment surfaces (Phase 11), behavior-continuity and packaging evidence (Phase 12). This phase delivers the shared contract those phases consume.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — discuss phase was skipped per user setting. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

</decisions>

<code_context>
## Existing Code Insights

Codebase context will be gathered during plan-phase research.

</code_context>

<specifics>
## Specific Ideas

Expected test impact recorded in the ROADMAP:

- Update the palette and presentation expectations in `tests/unit/monaco-theme.test.ts` and the semantic-style assertions in `tests/e2e/responsive-session.spec.ts` to the canonical root.
- Keep `tests/unit/monaco-diff-semantics.test.ts`, `tests/unit/monaco-diff-adapter.test.ts`, `tests/unit/workspace-state.test.ts`, and the API, Git, draft, persistence, and export contract suites passing unchanged.

</specifics>

<deferred>
## Deferred Ideas

None — discuss phase skipped.

</deferred>
