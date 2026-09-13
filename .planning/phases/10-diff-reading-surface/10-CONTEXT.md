# Phase 10: Diff Reading Surface - Context

**Gathered:** 2026-09-13
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Reviewers read the same Monaco-authoritative comparison through the mockup's quieter, explicit Base/Head diff treatment.

**Depends on:** Phase 08 (canonical semantic token root, byte-identical Monaco theme, live drift gate) and Phase 09 (dense changed-file tree). This phase consumes those contracts.

**Requirements:** DIFF-01, DIFF-02, DIFF-03

- DIFF-01: Monaco stays the diff authority — no hand-rolled diff rendering, line mapping, or syntax highlighting is introduced.
- DIFF-02: The mockup's quieter reading treatment — side identity labels, gutter and sign presentation, line and intraline fills, hunk separation, hidden-region affordances — with removed and added meaning still explicit without relying on colour alone.
- DIFF-03: Existing expandable context, side-by-side geometry, and localized horizontal overflow behaviour of the diff canvas are preserved.

**Out of scope:** shell, dialogs, inline comment surfaces, comments rail, and the mobile files flow (Phase 11); behaviour continuity and packaging/accessibility evidence (Phase 12); the changed-file tree (Phase 09, done). Token authorship remains Phase 08's root — a new token may only land together with its consumer, because the drift gate rejects orphans.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — discuss phase was skipped per user setting. Use the ROADMAP phase goal, success criteria, the Phase 08 token contract, and codebase conventions to guide decisions.

</decisions>

<code_context>
## Existing Code Insights

Codebase context will be gathered during plan-phase research.

Carried forward from Phases 08–09:

- Monaco colours are derived at build time from the canonical `:root` via the `virtual:cumpa-tokens` module; `src/web/monaco/theme.ts` holds no literals and `npm run verify:semantic-css` rejects stray colour literals and declared-but-unconsumed tokens.
- Monaco font family, size (13px) and line-height (26px) are now set from canonical tokens in the diff adapter.
- `npm run test:browser` forces a fresh web build first, so a stale `dist/` can no longer fake a pass.
- Two browser specs fail for missing environment markers only and are out of scope: `tests/e2e/marketplace-review.spec.ts` (CUMPA_MARKETPLACE_URL_MARKER) and `tests/e2e/public-support-states.spec.ts` (CUMPA_RUNTIME_CUSTODY_DIR).

</code_context>

<specifics>
## Specific Ideas

Expected test impact recorded in the ROADMAP:

- Update diff presentation assertions in `tests/e2e/responsive-session.spec.ts` and side-label assertions in `tests/e2e/anchored-review.spec.ts` and `tests/e2e/complete-review-draft.spec.ts`.
- Keep `tests/unit/line-mapping.test.ts`, `tests/unit/monaco-diff-semantics.test.ts`, `tests/unit/monaco-diff-adapter.test.ts`, and the anchoring behaviour in `tests/integration/monaco-anchor.spec.ts` passing unchanged.

Reference mockups: `mockups/01-quiet-workspace.html` (Phase 08 normative numerics), `mockups/02-review-stream.html`, and `mockups/03-focus-mode.html` for the diff reading treatment.

</specifics>

<deferred>
## Deferred Ideas

None — discuss phase skipped.

</deferred>
