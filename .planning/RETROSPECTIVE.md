# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-07-24
**Phases:** 5 | **Plans:** 40 | **Executed tasks:** 75

### What Was Built

- A Node.js CLI that discovers local branches and registered worktrees, freezes ordered native-Git merge-base comparisons, and launches a token-protected loopback browser session.
- A real Monaco side-by-side review workspace with exact durable line anchors, per-file state, complete comment and summary lifecycle, atomic repository-local drafts, conflict/recovery handling, and selector-drift reporting.
- Canonical JSON and derived Markdown export as a validated atomic pair with receipts, hashes, safe reveal, ignore management, relaunch/resume, and generated-package acceptance.
- A closure phase that eliminated cross-file async settlement corruption and made success, persistence failure, concurrent conflict, controller replacement, and repeated announcements origin-safe.

### What Worked

- Native Git remained the sole semantic authority. Fixed argument arrays, NUL-framed protocols, opaque IDs, and exact path bytes kept branch/worktree, rename, blob, and unusual-path behavior aligned with Git.
- RED-to-GREEN plan commits made state-machine and persistence contracts explicit before implementation. The final Phase 04.1 TDD review found zero sequence violations.
- Generated-package Playwright journeys exercised real Git repositories, the shipped CLI/server/browser assets, Monaco, persisted drafts, and export bytes instead of relying only on development seams.
- Independent code, security, UI, and goal verification found load-bearing issues that focused implementation tests initially missed: replaced-controller callbacks, mutable conflict revision metadata, hidden live-region styling, revision-conflict announcements, and repeated identical announcements.
- Canonical server-returned state and serialized cumpa-and-swap mutation prevented browser state from becoming persistence authority.

### What Was Inefficient

- The initial Phase 2 verification accepted an async callback path without a production A-to-B delayed-settlement journey. The milestone audit found WR-002 late and required closure Phase 04.1.
- Phase 3 requirements were behaviorally verified but seven checkboxes and traceability rows remained stale until milestone completion.
- The `test:browser` script is only valid with an explicit file filter because `--config=tests` otherwise collects Vitest files. The canonical full browser command is `npm run test:package`; this mismatch caused one invalid regression attempt.
- Full-suite load exposed a stale `.sr-only` test selector and a five-second callback assertion bound only after focused tests were green. The final configured suite passed 56/56 after correcting both.
- Automatic milestone accomplishment extraction emitted one bullet per summary; manual curation was required to produce a useful release-level record.

### Patterns Established

- Freeze refs once; pass full object identities through every downstream comparison, draft, anchor, drift, and export boundary.
- Browser requests use opaque capabilities; repository paths, refs, object IDs, and filesystem destinations remain server-owned.
- Persist first, then accept only the typed server-returned canonical draft. Conflicts retain local buffers and expose authoritative latest state.
- Immutable anchors are verified exactly; mismatch becomes stale or orphaned and is never silently relocated.
- Async UI commands capture controller, file, request, and originating revision identity before awaiting external work.
- Accessible live feedback must be visually hidden with an existing utility and must force a fresh DOM update for repeated identical messages.
- Release evidence belongs at the generated-package boundary and must independently reread durable output bytes.

### Key Lessons

1. Every asynchronous command whose destination can change while awaiting must carry immutable origin identity and have a production-path interleaving test.
2. A response arriving at the network boundary does not prove the application callback settled; wait for callback-produced state while the intervening UI state remains observable.
3. Milestone audits must cross-reference requirements, verification reports, summaries, integrations, and API consumers; any single ledger can be stale or incomplete.
4. Advisory code and UI review findings should be resolved before archival when they identify data-integrity or accessibility defects, even if the phase verifier already passed.
5. Keep one documented full-suite command per test family; wrapper commands that depend on positional filters are not safe regression defaults.

### Cost Observations

- Model mix: Not measured.
- Sessions: Not measured in planning artifacts.
- Notable: 326 milestone commits across 40 plans preserved atomic history, but generated documentation and repeated package-level browser gates added substantial workflow overhead.

---

## Milestone: v1.1 — GitHub Dark Diff

**Shipped:** 2026-07-29
**Phases:** 4 | **Plans:** 16 | **Executed tasks:** 29

### What Was Built

- One semantic GitHub-dark-inspired workspace spanning application surfaces, Monaco syntax and diff layers, controls, comments, notices, recovery, summary, and export.
- Persistent Base/deletion and Head/addition cues, stronger line and intraline fills, stable comment anchors, and CSP-compatible Monaco positioning.
- Responsive and accessible review continuity across desktop, narrow layouts, true 400% zoom, keyboard navigation, grayscale, and forced colors.
- A final compact sidebar and diff-clarity pass, plus root product and visual-system contracts.

### What Worked

- A single semantic CSS root and byte-parity Monaco theme tests prevented palette drift.
- Existing state, persistence, export, and Monaco authorities stayed unchanged; presentation derived from them instead of creating parallel models.
- Browser evidence used generated-package sessions and real Monaco geometry for layout, focus, contrast, and workflow continuity.
- Phase verification, UAT, security, UI review, and the milestone integration audit together closed stale evidence states before archival.

### What Was Inefficient

- Phase 06 and Phase 08 verification frontmatter remained stale after UAT accepted their human gates, requiring milestone-level interpretation.
- Nine Phase 07 plans fragmented one coherent surface adaptation and made automatic accomplishment extraction too verbose.
- The final designer pass found missing product/design contracts and ambiguous fixture/prototype strings only after phase completion.
- A standalone 320px file-tree width and production CSP interaction were discovered during final visual inspection rather than the original responsive plan.

### Patterns Established

- Keep one semantic CSS vocabulary and map Monaco colors directly to it.
- Preserve source order and behavioral ownership; use CSS placement and presentation-only derivation for responsive adaptation.
- Pair hue with explicit text, signs, line styles, borders, and focus geometry.
- Measure final browser composites and geometry rather than inferring accessibility from source tokens.
- Keep product facts and visual rules in explicit root contracts.

### Key Lessons

1. Human UAT completion must update or clearly supersede verifier frontmatter so close-time audits do not report resolved gates as open.
2. Visual review must exercise the packaged CSP path; development rendering can hide Monaco positioning failures.
3. Dense code-review surfaces benefit more from clearer semantic hierarchy and compact alignment than from wider panels or additional badges.
4. Product and design contracts should exist before automated taste checks become a release gate.

### Cost Observations

- Model mix: Not measured.
- Sessions: Not measured in planning artifacts.
- Notable: 136 commits after the v1.0 close changed 277 files (+23,900 / -2,600); focused generated-browser evidence caught the final layout and CSP defects.

---

## Milestone: v1.3 — Agent Review Handoff

**Shipped:** 2026-08-06
**Phases:** 4 | **Plans:** 14 | **Executed tasks:** 42

### What Was Built

- Strict agent stdin framing for either pinned native-Git ranges or repository-grounded exact patches, while preserving interactive CLI selection.
- Immutable range and patch provenance through browser review, repository-local drafts, and canonical V2/V3 exports.
- An authenticated, explicit Finish lifecycle that validates final state and anchors before delivering one canonical stdout document.
- Isolated mutable draft/export storage for concurrent or equivalent agent submissions.

### What Worked

- Native Git and repository objects remained the source of truth for range and patch grounding.
- The existing browser review workspace and its persistence/export authorities were reused instead of creating a parallel agent-review product.
- Focused API, Git, canonical-export, and packaged Chromium checks together covered request framing, explicit completion, and invocation isolation.

### What Was Inefficient

- The milestone accumulated advisory code, UI, and audit-evidence debt that required an explicit acceptance decision at close.
- Automatic accomplishment extraction was plan-granular; the release record required manual curation.

### Patterns Established

- Agent input is strict and bounded before browser launch; canonical stdout is emitted only after one server-authoritative completion transaction.
- Immutable submitted provenance and per-invocation mutable storage are separate concerns.

### Key Lessons

1. Exact-patch workflows need a single package-boundary Finish journey and stale-anchor server journey in addition to segmented contract proof.
2. Non-blocking review warnings still need an explicit milestone disposition rather than being left implicit.

### Cost Observations

- Model mix: Not measured.
- Sessions: Not measured in planning artifacts.
- Notable: 110 files changed (+14,765 / -553) from the first to final feature commit; 61 TypeScript, Vue, and CSS files changed (+7,437 / -476).

---

## Milestone: v1.4 — Voluntary Support

**Shipped:** 2026-09-04
**Phases:** 2 | **Plans:** 22 | **Executed tasks:** 30

### What Was Built

- Optional one-time USD $49.99 Stripe-hosted support that never gates review features.
- A Supabase private-schema and Edge Function authority for GitHub OAuth, Checkout creation, signature-verified webhook fulfillment, and installation restoration.
- Monotonic machine-wide prompt suppression, unlimited paid-account installation restoration, and a canonical configured release package that leaves ordinary local builds support-free.
- Immutable production evidence spanning prelaunch acceptance, exact cleanup, same-project live promotion, legacy retirement, release package approval, and final six-record lineage.

### What Worked

- Provider credentials and hosted dependencies remained outside the local application and published runtime.
- The final implementation reused the existing loopback capability boundary and browser dialog instead of creating a second review or licensing system.
- Live promotion evidence gated deletion of the superseded Render, PostgreSQL, Resend, and standalone Node service.

### What Was Inefficient

- Phase 01 built a standalone hosted backend that provider constraints later forced Phase 02 to replace and remove.
- Phase 01 lacked a standalone verification report; the milestone audit had to prove that Phase 02 superseded it and reverified all 12 requirements.
- One deleted Playwright suite name and one unused local status API survived the clean cutover as accepted debt.

### Patterns Established

- Optional hosted functionality is represented by capability absence, not disabled implementations or fallback origins.
- Browser and OAuth completion never establish payment; only signature-verified webhook settlement can promote verified state.
- Destructive provider cleanup follows immutable zero-state evidence and same-project promotion, not assumptions about deployment state.

### Key Lessons

1. Provider feasibility must be proven before building the first hosted implementation; replacement after integration is avoidable rework.
2. Superseded phases still need an explicit verification disposition so milestone audits do not infer release gaps from missing artifacts.
3. Release-lineage evidence should bind immutable run IDs, canonical origin, and package digest before obsolete authority paths are deleted.

### Cost Observations

- Model mix: Not measured.
- Sessions: Not measured in planning artifacts.
- Notable: 99 files changed (+14,648 / -87) across 23 calendar days from the first implementation commit to final evidence.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 5 | 40 | Established TDD, threat registers, package-first browser acceptance, cross-phase integration audit, and closure-phase remediation |
| v1.1 | 4 | 16 | Established one semantic UI/Monaco contract, browser-composite accessibility evidence, and final product/design contracts |
| v1.2 | 3 | 4 | Established eager source discovery, bounded search, and a compiled 10,000-ref performance gate |
| v1.3 | 4 | 14 | Established strict agent handoff, immutable range/patch grounding, explicit Finish, and invocation isolation |
| v1.4 | 2 | 22 | Established optional capability absence, Supabase webhook authority, immutable live-promotion evidence, and provider-runtime retirement |

### Cumulative Quality

| Milestone | Unit | Git | API | Playwright | Requirements | Integrations | Flows |
|-----------|------|-----|-----|------------|--------------|--------------|-------|
| v1.0 | 108 | 35 | 98 | 56 | 51/51 | 22/22 | 8/8 |
| v1.1 | Not recorded | Not recorded | Not recorded | Focused release gates passed | 18/18 | 12/12 | 7/7 |
| v1.2 | Focused release gates passed | 5/5 | 12/12 | 5/5 |
| v1.3 | Focused Git/API/CLI/package gates passed | 17/17 | 10/10 | 10/10 |
| v1.4 | Focused Vitest, Deno, and database gates passed | Not applicable | 10/10 local support API | Local and hosted support flows passed | 12/12 | 8/8 | 8/8 |

### Top Lessons (Verified Across Milestones)

1. Package-boundary browser evidence remains the strongest detector of integration, CSP, layout, and accessibility defects.
2. Cross-source milestone audits are necessary because phase frontmatter can lag accepted UAT evidence.
3. One canonical authority per state or visual role reduces both correctness risk and review complexity.

4. Attached agent workflows must prove both immutable provenance and per-invocation mutable-state isolation at the generated-package boundary.
5. Optional hosted functionality should disappear completely when unconfigured rather than expose dormant routes or arbitrary-origin seams.
6. A superseded phase needs explicit audit disposition even when a later phase removes its runtime and verifies every requirement.