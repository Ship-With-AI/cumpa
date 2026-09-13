# Phase 09: Changed-File Tree - Context

**Gathered:** 2026-09-13
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Reviewers can scan, filter, and keyboard-navigate the mockup's dense changed-file tree without losing existing tree semantics or selection.

**Depends on:** Phase 08 — the canonical semantic token root in `src/web/styles.css` consumed byte-identically by the workspace and Monaco. This phase consumes that contract; it does not author new palettes.

**Requirements:** TREE-01 … TREE-05

- TREE-01: Each changed file reads as one dense row showing change status, file name, and addition/deletion counts, with unavailable or unsupported files still identified as non-reviewable.
- TREE-02: Directory rows in the mockup's treatment, each showing how many changed files it contains.
- TREE-03: Existing tree semantics survive the restyle — nested directories, single-child path compaction, exact path ordering, all-expanded default, expand/collapse, selection, and roving-tabindex keyboard navigation (up, down, left, right, home, end, enter, space).
- TREE-04: Typing in a filter field narrows the tree to matching files with their ancestor directories expanded.
- TREE-05: A no-match filter state explains how to return to the full tree; clearing the filter restores the previous tree with the open file still selected.

**Out of scope:** diff reading surface (Phase 10), shell/dialogs/comments rail/mobile files flow composition (Phase 11), behavior continuity and packaging evidence (Phase 12). Token authorship stays in Phase 08's root — this phase consumes tokens and may only add a token when it also adds its consumer.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — discuss phase was skipped per user setting. Use ROADMAP phase goal, success criteria, the Phase 08 token contract, and codebase conventions to guide decisions.

</decisions>

<code_context>
## Existing Code Insights

Codebase context will be gathered during plan-phase research.

Known from Phase 08: `tests/e2e/file-tree.spec.ts:331` fails on a pre-existing defect — a selected treeitem renders `tabindex="-1"` where the spec expects `"0"` (blamed to `b960bb7e`, 2026-07-20, predating v1.6). TREE-03 owns roving-tabindex behavior, so this phase is the right place to fix it rather than inherit it.

</code_context>

<specifics>
## Specific Ideas

Expected test impact recorded in the ROADMAP:

- Extend `tests/unit/file-tree.test.ts` for filter reconciliation and ancestor expansion while preserving its existing ordering, selection, expansion, and keyboard expectations.
- Update the presentation and accessible-name assertions in `tests/e2e/file-tree.spec.ts` and the changed-files portions of `tests/e2e/responsive-session.spec.ts`; keep existing file-selection and content-loading flows in `tests/e2e/pinned-session.spec.ts` unchanged.

Reference mockup for tree density and hierarchy: `mockups/01b-quiet-workspace-tree.html` (with `mockups/01-quiet-workspace.html` as the Phase 08 normative numeric source).

</specifics>

<deferred>
## Deferred Ideas

None — discuss phase skipped.

</deferred>
