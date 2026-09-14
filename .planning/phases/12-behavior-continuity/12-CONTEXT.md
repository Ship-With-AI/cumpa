# Phase 12: Behavior Continuity - Context

**Gathered:** 2026-09-14
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Reviewers complete the unchanged review-to-export and attached-session workflow while maintainers have packaged and accessibility evidence for the integrated restyle.

**Depends on:** Phases 08–11. This is the closing phase of milestone v1.6 — it proves the restyle changed appearance without changing behaviour.

**Requirements:** CON-01, CON-02, CON-03

- CON-01: the existing end-to-end flow — launch, select file, comment, resolve, summarize, export, recover, finish attached sessions — with no change to session, draft, persistence, export, or support mechanics.
- CON-02: the packaged Playwright review/export suite and the existing Vitest contract suites pass against the restyled UI, with any test that asserted removed presentation UPDATED rather than skipped.
- CON-03: accessibility re-checked wherever markup structurally changed — focus reachability, roles, names, and keyboard operability of the new tree rows, filter, toolbar, and dialogs.

**Out of scope:** new visual work. Phases 08–11 own the token contract, the tree, the diff surface, and the shell/dialogs respectively. This phase reconciles and evidences; it does not restyle. A visual change here is a signal that an earlier phase's contract was wrong — raise it rather than silently patching.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — discuss phase was skipped per user setting. Use the ROADMAP phase goal, success criteria, the Phase 08–11 contracts, and codebase conventions to guide decisions.

**Non-negotiable:** a covered flow may never be skipped to make the suite green. If an assertion pinned presentation that the restyle legitimately removed, re-author it against the new observable contract. If a flow genuinely broke, that is a defect to fix, not a test to weaken.

</decisions>

<code_context>
## Existing Code Insights

Codebase context will be gathered during plan-phase research.

State at the end of Phase 11:

- Full browser suite: 99 passed; the only failures are two specs missing environment markers — `tests/e2e/marketplace-review.spec.ts` (CUMPA_MARKETPLACE_URL_MARKER) and `tests/e2e/public-support-states.spec.ts` (CUMPA_RUNTIME_CUSTODY_DIR). Deciding what to do about those is in scope for CON-02.
- `npm run test:unit` 186, `npm run test:git` 69, `npm run test:api` 142 all pass; `npm run verify:semantic-css`, `npm run typecheck:web`, and `npm run build` pass.
- `npm run test:browser` forces a fresh web build; `scripts/pack-runtime.mjs` now serializes packing with an atomic lock, dead-owner takeover, and a race regression test. An earlier order-sensitive failure was root-caused to the packer inheriting `NODE_ENV=development` from a Vite server started by an earlier spec, which packaged a development Vue runtime; the packer now forces production.
- `src/web/App.vue` holds exactly ONE `aria-live` region; warnings render in the shell and announce once per transition through it.
- Two user-owned untracked repro files exist and are not ours: `tests/unit/.omp-profile-path-drift-repro.test.ts` and `tests/unit/.omp-profile-symlink-repro.test.ts`.

</code_context>

<specifics>
## Specific Ideas

Expected test impact recorded in the ROADMAP:

- Reconcile only the remaining presentation-dependent selectors in `tests/e2e/file-tree.spec.ts`, `tests/e2e/pinned-session.spec.ts`, `tests/e2e/anchored-review.spec.ts`, `tests/e2e/complete-review-draft.spec.ts`, `tests/e2e/agent-ready-export.spec.ts`, and `tests/e2e/responsive-session.spec.ts`; do not skip covered flows.
- Keep the existing Vitest session, draft, persistence, export, agent-ready handoff, exact-patch, selector-drift, and voluntary-support contract suites passing unchanged.

Success criterion 4 requires desktop, full-desktop, and mobile captures visually equivalent to the approved contract except for documented production-data differences — the same live-capture evidence the Phase 09–11 UI audits produced, now for the integrated result.

</specifics>

<deferred>
## Deferred Ideas

None — discuss phase skipped.

</deferred>
