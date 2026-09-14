# Milestones

## v1.6 Workspace Restyle (Shipped: 2026-09-14)

**Delivered:** One mockup-derived visual system across the workspace and Monaco — dense changed-file tree, quieter Base/Head diff surface, mockup-equivalent shell with Details and Review-notes dialogs — with review behaviour, exports, and support mechanics unchanged.

**Phases completed:** 5 phases, 25 plans, 76 tasks
**Timeline:** 2026-09-12 → 2026-09-14
**Git range:** `6279e15` → `de1362e` — 164 files changed, +27,770 / -2,270

**Key accomplishments:**

- Collapsed four independently-authored palettes into one canonical semantic token root, with the Monaco theme deriving byte-identical values from it at build time through a Vite virtual module.
- Turned an inherited, unwired drift audit into a real gate: `npm run verify:semantic-css` now rejects stray colour literals, orphan tokens, gradients, uppercase hex, and retired vocabulary, and proves it can reject via unconditional self-checks.
- Rebuilt the changed-file tree as dense rows with signed counts and directory descendant counts, plus a filter that prunes (never rebuilds) the tree so expansion identity and selection survive clearing.
- Fixed roving tabindex, which the shipped implementation had never satisfied despite a spec asserting it since 2026-07-20.
- Restyled the diff surface entirely through Monaco's own mechanisms — pinned options, source-correct side labels, responsive code density, and zero-height hunk boundaries that cannot desynchronise comment anchoring.
- Recomposed the shell around one extracted `ModalDialog` primitive with three dialogs, unified four disagreeing breakpoint systems onto 760/1050/1650, and kept every warning class in the shell behind a single live-region owner.
- Repaired `tests/e2e/agent-ready-export.spec.ts`, which no default runner executed for the entire milestone and which failed 6/6 once run.

### Final Evidence

- Requirements: 24/24
- Phase verifications: 08 6/6, 09 25/25, 10 29/29, 11 5/5, 12 4/4 — all `passed`
- Security audits: 08 25 threats, 09 23/23, 10 17/17, 11 41/41 — all closed
- UI audits: 09 24/24, 10 24/24, 11 24/24, 12 native-scale visual equivalence signed off
- Suites at close: 186 unit, 69 git, 142 api, 99 browser, 7 runtime-artifact
- Milestone audit: status `tech_debt`; archiveable with one accepted inherited item

### Defects found and fixed that predated the restyle

- A browser spec excluded from every default runner, silently rotting for a full milestone.
- An order-sensitive suite failure root-caused to the runtime packer inheriting `NODE_ENV=development` from a Vite server started by an earlier spec, packaging a development Vue runtime.
- A pack lock whose stale-owner recovery let two packers delete each other's lock and run concurrently.
- Roving tabindex never satisfied by the implementation.
- The v1.0 debt item "retire or intentionally consume the orphan `SessionClient.getFileMetadata()`" is now resolved: the Details dialog is its first real caller.

### Retained Technical Debt

- DEBT-01 (audit D-01): four `ReviewToolbar.vue` layout containers carry `aria-label` or nothing without a queryable `role`, so `getByRole('group', …)` cannot reach them. Pre-existing and byte-unchanged across v1.6; promoted into `.planning/REQUIREMENTS.md` as a scheduled next-milestone requirement rather than left in a ledger.
- Two release-only specs remain documented external prerequisites, not regressions: `tests/e2e/public-support-states.spec.ts` (published package plus live hosted origin; gate at `:327-329`) and `tests/e2e/marketplace-review.spec.ts:97-99`.

### Archives

- Roadmap: `.planning/milestones/v1.6-ROADMAP.md`
- Requirements: `.planning/milestones/v1.6-REQUIREMENTS.md`
- Milestone audit: `.planning/milestones/v1.6-MILESTONE-AUDIT.md`
- Phase history: `.planning/milestones/v1.6-phases/`

---

> **Archive note (2026-09-14):** `v1.5-phases/` was empty — a prior archive run created the directory but never copied phases 03–07. Back-filled at v1.6 close (101 files, verified byte-identical before the working copies were removed).

## v1.4 Voluntary Support (Shipped: 2026-09-04)

**Delivered:** Optional one-time support and paid-account restoration through a canonical Supabase-hosted flow without gating or changing any review feature.

**Phases completed:** 2 phases, 22 plans, 30 tasks
**Timeline:** 2026-08-12 → 2026-09-04
**Git range:** `1541473` → `59b53e9` — 99 files changed, +14,648 / -87

**Key accomplishments:**

- Added an optional Stripe-hosted USD $49.99 support action while keeping unpaid and dismissed sessions fully usable.
- Built a private Supabase authority with service-role RPCs, GitHub OAuth, server-owned Checkout creation, and signature-verified idempotent webhook fulfillment.
- Added monotonic machine-wide verified-state persistence and privacy-safe restoration to unlimited installations through one-use installation-bound OAuth intents.
- Kept ordinary local builds support-free; only the approved release package embeds the exact canonical Supabase origin.
- Proved prelaunch acceptance, exact cleanup, same-project live promotion, legacy retirement, and final release lineage through immutable evidence.
- Removed the superseded Render, standalone PostgreSQL, Resend, Node fulfillment, email-recovery, and legacy route surfaces.

### Final Evidence

- Requirements: 12/12
- Phase 02 verification: 81/81 must-haves
- Cross-phase integrations: 8/8
- End-to-end flows: 8/8
- Plans and summaries: 22/22
- Milestone audit: no critical gaps; status `tech_debt`

### Retained Technical Debt

- Remove the stale deleted `tests/e2e/support-recovery.spec.ts` workflow filter and verifier contract.
- Remove unused local `GET /api/support/status` and `SessionClient.getSupportStatus()` surfaces.

### Archives

- Roadmap: `.planning/milestones/v1.4-ROADMAP.md`
- Requirements: `.planning/milestones/v1.4-REQUIREMENTS.md`
- Milestone audit: `.planning/milestones/v1.4-MILESTONE-AUDIT.md`
- Phase history: `.planning/milestones/v1.4-phases/`

---

## v1.3 Agent Review Handoff (Shipped: 2026-08-06)

**Delivered:** A coding agent can submit a grounded range or exact-patch review, await explicit browser completion, and receive one canonical JSON result.

**Phases completed:** 4 phases, 14 plans, 42 tasks

**Key accomplishments:**

- Added bounded, strict stdin request framing while preserving the TTY picker.
- Pinned Git ranges and native ordered pathspecs through sessions, drafts, and canonical V2 exports.
- Grounded exact already-applied patches against repository bytes and served immutable snapshots with V3 provenance.
- Added an authenticated, server-authoritative Finish lifecycle that validates anchors before one stdout delivery.
- Isolated mutable draft and export storage for every attached agent invocation.

### Final Evidence

- Requirements: 17/17
- Cross-phase integrations: 10/10
- End-to-end flows: 10/10
- Plans and summaries: 14/14
- Milestone audit: no critical gaps, unsatisfied requirements, integration blockers, or broken flows

### Retained Technical Debt

- Range draft-equivalence diagnostics and scoped Git-failure taxonomy.
- Non-blocking narrow-screen and lifecycle UI contract warnings.
- Patch-status polling rejection handling and missing Phase 13 security report.
- Single-command exact-patch Finish and server-level stale-anchor integration evidence.

### Archives

- Roadmap: `.planning/milestones/v1.3-ROADMAP.md`
- Requirements: `.planning/milestones/v1.3-REQUIREMENTS.md`
- Milestone audit: `.planning/milestones/v1.3-MILESTONE-AUDIT.md`

---

## v1.2 Fast Source Discovery (Shipped: 2026-07-30)

**Phases completed:** 3 phases, 4 plans, 9 tasks

**Key accomplishments:**

- A frozen eager snapshot now exposes the attached current branch and truthful registered worktrees without complete local-branch enumeration; non-empty searches perform the uncached native-Git branch lookup.
- The terminal picker now opens from the eager current branch and registered worktrees, then installs abort-safe lazy branch results by exact ID across Base/Head selection and drift recovery.
- Non-empty picker terms now perform a literal, case-insensitive local-branch Git query, validate complete Git protocols, and publish only fresh exact-ID branch rows alongside truthful worktrees.
- A standalone compiled-production picker gate proves packed-10,000-ref readiness and branch-search budgets with exact rendered-row timing.

### Final Evidence

- Requirements: 5/5
- Cross-phase integrations: 12/12
- End-to-end flows: 5/5
- Plans and summaries: 4/4
- Production gate: 10,000 packed refs, 0 loose refs; readiness median 221.532417 ms ≤ 400 ms; search median 38.266167 ms ≤ 500 ms
- Final build and regression suites: 322 tests passed across unit, Git, API, and focused Phase 11 verification
- Phase 11 code review: clean

### Retained Technical Debt

- Keep uncommon worktree recovery states at focused real-Git/CLI integration seams unless production-path risk changes.
- Re-run the absolute picker budgets when the supported Node 24 runner or host characteristics change.

### Archives

- Roadmap: `.planning/milestones/v1.2-ROADMAP.md`
- Requirements: `.planning/milestones/v1.2-REQUIREMENTS.md`
- Milestone audit: `.planning/milestones/v1.2-MILESTONE-AUDIT.md`
- Phase history: `.planning/milestones/v1.2-phases/`

---

## v1.1 GitHub Dark Diff (Shipped: 2026-07-29)

**Phases completed:** 4 phases, 16 plans, 29 tasks

**Key accomplishments:**

- A single GitHub-dark semantic stylesheet now renders the local review workflow with role-based surfaces, typography, controls, status states, constrained overlay elevation, and deterministic Chromium evidence.
- A complete, typed `cumpa-dark` Monaco theme now maps Phase 05 semantic roles into canvas, syntax, diff, selection, widget, and scrollbar colors with deterministic source/generated CSS parity enforcement.
- Pure Monaco line-change normalization now produces continuous Base/Head change bars and sparse non-interactive gutter-sign decorations without recomputing diffs or altering model text.
- The production Monaco adapter now selects the shared dark theme before construction and composes sparse signed diffs, selection contrast, anchors, focus, flat empty regions, and hidden hunks without changing review mechanics or editor geometry.
- A compact, framed Base/path/Head context header now keeps every shipped diff navigation and review control available while presenting safe renamed-file identity with local icon controls.
- Compact composer and accepted-comment cards now expose fixed anchor identity, separate lifecycle and verification badges, field-adjacent busy and error feedback, and real-Monaco Chromium regression evidence without changing Monaco ownership.
- The review rail now preserves the established review workflow while exposing durable command-derived selection, framed major hierarchy, grouped divider rows, and truthful per-comment lifecycle progress.
- Shared notices, pinned-source drift, file metadata, and Summary now pair visible labels and fixed local glyphs with structural edges while retaining their existing review, retry, focus, and persistence semantics.
- Read-only draft recovery now uses icon-label status boundaries, structured outcome notices, and a locally busy destructive confirmation while preserving fixed recovery authority and verified backup semantics.
- Export, receipt, drift, readiness, and optional ignore-consent surfaces now share the established icon-label-edge language while retaining explicit export and fixed filesystem capabilities.
- Accepted inline comments now resize the existing paired Monaco zone from rendered content height, with Chromium evidence that a long persisted card stays contained and does not overlap subsequent code.
- Revision conflicts now display a truthful error badge, while export-readiness and Gitignore notices consistently distinguish an in-progress ignore check from a concrete unavailable result.
- Recovered-draft and pinned-selector copy feedback now retain one authoritative polite announcement owner each, with real-browser assertions over their completed dynamic states.
- A fluid semantic review shell now contains one locally scrollable 640px side-by-side Monaco canvas, with browser evidence that narrow layouts retain Base-to-Head reachability and Monaco coordinate invariants.
- The packaged review workspace now measures composited live-control contrast, preserves keyboard focus geometry, and retains structural review meaning in Chromium forced colors without changing review behavior.
- One packaged browser matrix now proves responsive layout, true 400% browser zoom, non-color state cues, and keyboard continuity while the original packaged draft/export authorities retain behavioral ownership.
- A final clarity pass compacted the file sidebar, made Base/deletion and Head/addition semantics explicit, strengthened diff fills, preserved Monaco positioning under CSP, and added the shipped `DESIGN.md` and `PRODUCT.md` contracts.

### Final Evidence

- Requirements: 18/18
- Cross-phase integrations: 12/12
- End-to-end flows: 7/7
- Plans and summaries: 16/16
- Phase 08 UAT: 3/3 accepted
- Final designer checks: 0 blockers; visual-system analysis 0 warnings
- Final focused checks: build passed, Vitest 15/15, Playwright 1/1

### Retained Technical Debt

- Retire or intentionally consume the authenticated orphan file-metadata route and client method.
- Add explicit unsupported/unavailable rows to responsive fixture coverage if that path changes.
- Align 7px icon-button padding with the documented spacing scale when the control geometry is next revised.
- Remove unused `EmptyState.vue` when dead-code cleanup is prioritized.

### Archives

- Roadmap: `.planning/milestones/v1.1-ROADMAP.md`
- Requirements: `.planning/milestones/v1.1-REQUIREMENTS.md`
- Milestone audit: `.planning/milestones/v1.1-MILESTONE-AUDIT.md`

---

## v1.0 MVP (Shipped: 2026-07-24)

**Scope:** 5 phases, 40 plans, 75 executed tasks, 51 requirements

**Timeline:** 2026-07-20 → 2026-07-24

**Git range:** `cdf6f82` → `bc1e26f` — 326 commits, 243 files changed, +48,023 / -148

**Current codebase:** 30,428 tracked TypeScript, Vue, and MJS lines

### Key Accomplishments

- Built byte-safe local branch/worktree discovery, explicit ordered selection, immutable merge-base-to-head comparison, and a token-protected loopback browser session.
- Delivered a real Monaco side-by-side review workspace with exact durable anchors, per-file state restoration, keyboard/responsive interaction, and explicit stale or orphaned records.
- Added repository-local canonical drafts with complete comment and summary lifecycle, serialized cumpa-and-swap mutation, conflict recovery, selector drift, and loss-safe corrupt/newer-draft handling.
- Published versioned canonical JSON and derived Markdown as an atomic export pair with content hashes, receipts, safe reveal, ignore management, source-control safety checks, and target-aware re-export.
- Closed the audited cross-file async settlement gap across acceptance, persistence failure, concurrent revision conflict, controller replacement, and repeated accessible announcements.

### Final Evidence

- Requirements: 51/51
- Cross-phase integrations: 22/22
- End-to-end flows: 8/8
- Plans and summaries: 40/40
- Final configured Playwright suite: 56/56
- Phase 04.1: verification 11/11, code review clean, security 11/11 closed, UI audit 24/24, TDD 0 violations

### Retained Technical Debt

- Retire or intentionally consume the authenticated orphan `GET /api/files/:fileId` route and `SessionClient.getFileMetadata()` method.
- Retain Phase 3 non-blocking UI polish findings until separately prioritized.
- Retain accepted Phase 4 same-UID managed-parent replacement and operating-system power-loss durability boundaries.

### Archives

- Roadmap: `.planning/milestones/v1.0-ROADMAP.md`
- Requirements: `.planning/milestones/v1.0-REQUIREMENTS.md`
- Milestone audit: `.planning/milestones/v1.0-MILESTONE-AUDIT.md`
- Phase history: `.planning/milestones/v1.0-phases/`

---
