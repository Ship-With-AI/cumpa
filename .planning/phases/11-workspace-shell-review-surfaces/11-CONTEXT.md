# Phase 11: Workspace Shell & Review Surfaces - Context

**Gathered:** 2026-09-13
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Reviewers use the mockup-equivalent shell, dialogs, inline comment surfaces, comments rail, and mobile files flow while critical warnings remain continuously visible.

**Depends on:** Phase 08 (canonical token root + Monaco parity + drift gate), Phase 09 (dense changed-file tree), Phase 10 (quiet Monaco diff reading surface). This phase composes those surfaces into the mockup's shell.

**Requirements:** SHELL-01 … SHELL-05, REV-01 … REV-05 — the largest phase of the milestone.

- SHELL-01: identity header with product mark and the ordered comparison strip; Base/Head labels for pinned sessions, preimage/postimage identity for exact-patch sessions.
- SHELL-02: file toolbar above the diff — active file name, directory path, file/sidebar toggle — replacing the permanently expanded metadata header.
- SHELL-03: hide and restore the changed-files sidebar; hidden sidebar is removed from tab order while hidden.
- SHELL-04: narrow-viewport reflow including the changed-files dialog in place of the persistent sidebar, preserving file → Base → Head reading order.
- SHELL-05: footer status line, with no claim the product does not support.
- REV-01: line comment create/edit/delete/resolve/read with unchanged mechanics, anchoring, and announcements, including paired Base/Head card containment.
- REV-02: comments rail in the restyled language with existing states and navigation intact.
- REV-03: a Details dialog for comparison identities, commit IDs, merge base, file metadata, keyboard help — replacing the permanent toolbar.
- REV-04: a Review-notes dialog for summary and export (readiness, progress, receipts, drift acknowledgement) that leaves the diff at full width.
- REV-05: selector-drift, stale/orphaned anchor, patch-drift, and draft-recovery warnings always visible in the workspace shell itself, never only inside a dialog, with existing actions and single-owner live announcements intact.

**Out of scope:** behaviour continuity end-to-end evidence and packaging/accessibility evidence (Phase 12, CON-01). Token authorship remains Phase 08's root — a new token may only land with its consumer, because the drift gate rejects orphans. Monaco remains the diff authority (Phase 10's contract must not regress).

**Highest-risk requirement:** REV-05. Moving metadata and review notes into dialogs must not sweep a warning into a dialog with them. Warnings are the one thing that must remain in the shell.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — discuss phase was skipped per user setting. Use the ROADMAP phase goal, success criteria, the Phase 08–10 contracts, and codebase conventions to guide decisions.

</decisions>

<code_context>
## Existing Code Insights

Codebase context will be gathered during plan-phase research.

Carried forward from Phases 08–10:

- The canonical `:root` in `src/web/styles.css` is the sole palette; `npm run verify:semantic-css` rejects stray colour literals, orphan tokens, and gradients (substring rejection before any colour audit).
- `--sidebar-width` was explicitly deferred to this phase; the shipped shell is 288px desktop / 256px narrow.
- `npm run test:browser` forces a fresh web build first.
- Monaco carries the diff: pinned options, source-correct `ariaLabel`, responsive density at the 1650/760 breakpoints, hunk-group boundary decorations that contribute zero line height, and a 37px side-label track.
- `tests/integration/anchored-workspace.spec.ts` holds an `outerOverflowOwners` empty-array canary for document-level horizontal overflow, and positional `> span:first-child > span:first-child` selectors into the side-label markup.
- `tests/e2e/pinned-session.spec.ts:1418` was scoped to `main.review-main` in Phase 09 so the persistent tree filter would not trip a page-global editable-control count.
- Two browser specs fail for missing environment markers only and are out of scope: `tests/e2e/marketplace-review.spec.ts` (CUMPA_MARKETPLACE_URL_MARKER) and `tests/e2e/public-support-states.spec.ts` (CUMPA_RUNTIME_CUSTODY_DIR).

</code_context>

<specifics>
## Specific Ideas

Expected test impact recorded in the ROADMAP:

- Update shell, dialog, and presentation selectors in `tests/e2e/responsive-session.spec.ts`, `tests/integration/complete-review-panel.spec.ts`, `tests/integration/export-receipt-ui.spec.ts`, and `tests/integration/anchored-workspace.spec.ts` for the new composition.
- Keep warning behaviour in `tests/integration/selector-drift-ui.spec.ts` and `tests/integration/draft-recovery-ui.spec.ts`, comment mechanics in `tests/e2e/anchored-review.spec.ts`, and all selector-drift, draft, persistence, export, attached-completion, and support contract tests passing unchanged.

Reference mockups: `mockups/01-quiet-workspace.html` (Phase 08 normative numerics), `mockups/02-review-stream.html` (review surfaces), `mockups/03-focus-mode.html`.

</specifics>

<deferred>
## Deferred Ideas

None — discuss phase skipped.

</deferred>
