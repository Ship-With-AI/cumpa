# Milestones

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
- A complete, typed `compare-dark` Monaco theme now maps Phase 05 semantic roles into canvas, syntax, diff, selection, widget, and scrollbar colors with deterministic source/generated CSS parity enforcement.
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
- Added repository-local canonical drafts with complete comment and summary lifecycle, serialized compare-and-swap mutation, conflict recovery, selector drift, and loss-safe corrupt/newer-draft handling.
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
