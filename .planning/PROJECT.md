# Compare

## What This Is

Compare is a local-first code review application for developers who want a GitHub pull-request-style review experience without publishing branches or worktrees to a remote host. A CLI launched inside a Git repository opens a browser workspace where the developer selects two local branches or registered worktrees, reviews PR-style changes side by side, leaves line comments and an overall summary, and exports the result as Markdown plus canonical JSON that a coding agent can apply.

## Core Value

A developer can accurately review committed changes between any two local branch or worktree heads and export precise, drift-detectable feedback an agent can act on.

## Current State: v1.2 Fast Source Discovery

**Shipped:** 2026-07-30

Compare now opens its ordered source picker from an immutable eager snapshot of the attached current branch and registered worktrees, then searches remaining local branches only after the user enters a term. The shipped path preserves exact source identity, worktree truthfulness, selection ordering, drift recovery, and native-Git authority without a persistent branch index or repository mutation.

<details>
<summary>v1.2 milestone intent</summary>

**Goal:** Make the ordered source picker interactive quickly and keep branch search scalable in repositories with 10,000 local branches.

**Delivered features:**
- Exposed the attached current branch and registered worktrees before complete local-branch enumeration.
- Added case-insensitive literal local-branch search on non-empty picker input.
- Batched branch metadata and abbreviation work through bounded native-Git protocols.
- Verified the compiled production path with exactly 10,000 packed local refs: readiness median 221.532417 ms and search median 38.266167 ms.
- Preserved correct identity, ordering, worktree state, cancellation, recovery, and failure behavior without mutating refs.

</details>
## Next Milestone Goals

No next milestone is active. Run `/gsd-new-milestone` to define the next goal, requirements, and roadmap.
## Requirements

### Validated

- [x] User can launch the application from a Git repository through a CLI that opens a loopback-only browser session.
- [x] User can interactively select an ordered base and head from local branches and registered worktrees.
- [x] User can review merge-base-to-head changes in a GitHub-like side-by-side text diff with changed-file navigation and expandable context.
- [x] User can create, edit, delete, and resolve comments on any visible line on either side of a diff.
- [x] User can write an overall review summary while the review remains an editable repository-local draft.
- [x] User can export a completed review as readable Markdown and versioned JSON containing stable Git identities and context anchors for an applying agent.

Validated in Phase 01: Pinned Local Comparison.

Validated in Phase 02: Anchored Diff Review.

Validated in Phase 03: Complete Review Draft.

Validated in Phase 04: Agent-Ready Export.

Phase 04.1 closed the audited CMT-01 async cross-file settlement gap without changing the validated product scope.

Validated in Phase 05: Semantic Dark Foundation established the dark semantic palette, typography, interaction-state, surface, and responsive foundation; Monaco diff semantics and later review-surface adaptation remain active.
Validated in Phase 06: Monaco Diff Semantics coordinated editor, syntax, diff, gutter, selection, comment-anchor, and focus layers while preserving Monaco as diff authority.

Validated in Phase 07: GitHub-Familiar Review Surfaces adapted the file header, controls, inline conversations, review rail, recovery, notices, and export feedback without changing review mechanics.

Validated in Phase 08: Accessible Responsive Continuity completed the GitHub-dark workspace adaptation with composited WCAG contrast, durable focus and forced-color cues, localized side-by-side diff overflow, responsive reflow through true 400% zoom, and unchanged review/export behavior.

The final v1.1 clarity pass compacted the changed-files sidebar, made removed/added semantics explicit, strengthened diff fills, preserved Monaco positioning under the production CSP, and recorded the shipped product and visual contracts.

Validated in Phase 09: Immediate Source Picker exposed the attached current branch and truthful registered worktrees before complete local-branch enumeration.

Validated in Phase 10: On-Demand Branch Search added fresh case-insensitive literal local-head search through bounded native-Git protocols.

Validated in Phase 11: Production Performance Gate proved the compiled picker path within fixed readiness and search budgets against exactly 10,000 packed local refs.

### Active

No active requirements. v1.2 shipped all five milestone requirements.

### Out of Scope

- Reviewing staged, unstaged, or untracked worktree changes — v1 compares committed worktree `HEAD` values only and reports ignored dirty state.
- Hosting reviews remotely or supporting multiple simultaneous reviewers — the product is a single-developer local tool.
- Posting reviews to GitHub, GitLab, or another forge — export files are the integration boundary for v1.
- Applying requested changes from inside the application — a separate coding agent consumes the export.
- Image, notebook, document, or binary diff rendering — v1 reviews text; unsupported files are identified but not rendered inline.
- Full GitHub review mechanics such as replies, suggestion patches, approvals, and pending-review submission — v1 provides line comments, resolution, and an overall summary.

## Context

Compare has shipped three milestones: the complete local browser-review-to-agent loop, a GitHub-dark accessible review workspace, and scalable local source discovery. The CLI now opens source selection from the attached current branch and registered worktrees without waiting for a complete local-branch scan; non-empty input performs fresh, literal, case-insensitive local-head search through native Git.

Each comparison remains ordered and frozen to full commit IDs. The displayed change is the merge base of those commits compared with the selected head; selected worktrees resolve to committed `HEAD` values and dirty bytes never enter the review.

The browser workspace provides an exact changed-file tree, real Monaco side-by-side text diffs, expandable context, keyboard navigation, durable line comments, review summary and comment lifecycle, conflict recovery, selector-drift reporting, and explicit unsupported, stale, and orphaned states.

Exports are versioned and machine-validated. Canonical JSON owns comparison identities, accepted summary and comments, timestamps, blob identities, and context anchors; Markdown is derived from that same validated model. Publication is an atomic pair beneath `.compare/exports/`, with hashes and a bounded receipt.

v1.2 completed 5/5 requirements, 12/12 cross-phase integrations, and 5/5 end-to-end flows. Its compiled production gate proved exactly 10,000 packed local heads with zero loose heads, one discarded warmup, five serial measurements, readiness median 221.532417 ms against a 400 ms budget, and search median 38.266167 ms against a 500 ms budget.

Retained debt is bounded: one authenticated orphan metadata route/client method, Phase 3 UI polish, accepted Phase 4 filesystem/power-loss durability limits, focused rather than compiled black-box coverage for uncommon worktree recovery states, and host-sensitive absolute performance evidence. No shipped requirement or user flow remains blocked.
## Constraints

- **Runtime**: Node.js 24 LTS with TypeScript end to end — one language across CLI, server, shared contracts, and UI, using the current supported LTS baseline.
- **Git semantics**: Invoke the installed Git CLI as the source of truth — merge bases, refs, worktrees, renames, diff metadata, and blobs must match Git behavior.
- **CLI**: Commander with an Inquirer-based searchable selector — launch is interactive and ordered base/head selection is explicit.
- **Server**: Fastify bound only to `127.0.0.1` on an ephemeral port — the default browser opens automatically and no LAN service is exposed.
- **UI**: Vue 3 with Vite and Monaco Diff Editor — side-by-side diff rendering, line mapping, syntax highlighting, and inline review controls run in the browser.
- **Contracts**: Zod schemas shared by API, draft persistence, and export generation — incompatible or corrupt data fails explicitly.
- **Persistence**: Versioned JSON files in a gitignored repository-local `.compare/` directory — no database or browser-only source of truth.
- **Content**: Text files only in v1 — binary, generated, oversized, or unsupported files remain visible as non-reviewable entries.
- **Testing**: Vitest for Git, diff, persistence, and export contracts; Playwright for the browser review flow.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use PR-style merge-base-to-head comparison | Match the mental model and visible change set of hosted pull-request reviews | Good — native-Git fixtures verify frozen merge-base-to-head semantics across branch/worktree orderings |
| Resolve branches and worktrees to committed Git objects | Produce stable, reproducible comparisons and exclude ambiguous dirty state | Good — sessions, drafts, anchors, and exports remain pinned while selectors drift |
| Use the installed Git CLI rather than a Git library | Preserve native Git behavior for merge bases, worktrees, renames, blobs, and diff metadata | Good — byte-safe native protocols cover discovery, inventory, availability, and object reads |
| Use TypeScript, Node.js, Fastify, Vue 3, Vite, and Monaco | Keep shared contracts in one language while supporting a capable browser diff workspace | Good — one packaged runtime serves strict shared contracts and the real browser workspace |
| Store drafts as repository-local versioned JSON | Keep reviews resumable, portable within the local repository, and independent of browser storage | Good — comparison-keyed atomic drafts survive relaunch and fail explicitly on corruption or newer schemas |
| Export canonical JSON plus generated Markdown | Give agents a strict contract and humans a readable review artifact | Good — canonical bytes and reparse-derived Markdown publish together with hashes and receipts |
| Keep v1 local and single-user | Focus effort on accurate comparison, commenting, persistence, and export rather than hosting or collaboration | Good — the loopback-only capability model delivered the full v1 workflow without remote infrastructure |
| Use opaque file IDs and fixed capability routes | Prevent browser paths, refs, and object IDs from becoming repository authority | Good — all API operations are authenticated and path-safe; one unused metadata operation remains cleanup debt |
| Accept only server-returned canonical draft state | Prevent client-synthesized persistence and silent concurrent overwrite | Good — atomic CAS, typed conflicts, and accepted-result ordering cover every review mutation |
| Keep durable anchors immutable and classify mismatch instead of relocating | Preserve drift-detectable feedback for applying agents | Good — stale and orphaned records retain exact recorded evidence and never move silently |
| Verify release behavior at the generated-package boundary | Test the same CLI, server, browser assets, Git objects, and export bytes users receive | Good — final configured Playwright suite passes 56/56 |
| Correlate asynchronous comment settlement to controller, file, request, and originating revision | Prevent late results from mutating the active or replacement composer | Good — Phase 04.1 closed the audit gap across success, failure, conflict, replacement, and repeated announcements |
| Use one stable typed Monaco theme mapped byte-for-byte to the canonical semantic CSS root | Prevent editor colors from drifting from the surrounding dark workspace or changing across applications | Good — focused parity, build, semantic CSS, and first-frame browser checks pass |
| Derive Base/Head cues only from public `ILineChange` ranges and fixed side classes | Preserve Monaco as diff authority while preventing repository text, phantom empty-side signs, or unbounded decorations from entering presentation | Good — bounded pure-transform tests and real Chromium signs/bars pass |
| Keep diff, selection, anchor, and focus semantics in independent replacement collections | Ensure overlapping review cues coexist without model mutation, listener growth, or composer interference | Good — lifecycle, restoration, overlap, and production geometry checks pass |
| Keep Phase 07 presentation derived from existing session, review, export, recovery, and selector state | Prevent a visual adaptation from creating a second behavior, persistence, or filesystem authority | Good — all five roadmap criteria and 42/42 plan must-haves passed goal verification |
| Resize accepted and composing inline cards through one post-render paired-zone helper | Keep Base/Head Monaco zones equal while long accepted content remains contained without changing adapter or anchor authority | Good — production Chromium proves long-card containment and following-code separation |
| Give each dynamic recovery and selector-copy outcome one authoritative live-region owner | Prevent duplicate assistive announcements while retaining visible feedback, actions, and focus behavior | Good — focused browser checks count exactly one owner after each real state transition |
| Keep responsive visual placement separate from semantic source order | Preserve file → Base → Head reading order while matching the desktop composition and narrow reflow | Good — exact-width and keyboard browser evidence passed without duplicate controls or state paths |
| Keep the 640px side-by-side comparison floor inside one localized viewport | Prevent page-wide overflow without reflowing Monaco or changing Base/Head geometry | Good — 320px and true 400% zoom evidence retained a 640px locally scrollable canvas with document fit |
| Measure composited rendered contrast and focus geometry against actual browser states | Token-only checks cannot prove translucent diff, selection, status, or clipping behavior | Good — completed UAT accepted the full contrast, focus-inventory, and true-zoom gates |
| Keep the review sidebar at 288px and compact rows within it | Preserve diff space while keeping status, path, counts, and exceptional availability readable | Good — wide and narrow browser evidence shows contained rows without page overflow |
| Pair Base/Head identity with explicit removed/added text, signed gutters, and structural bars | Make diff meaning clear without relying on red and green | Good — stronger line/intraline fills and CSP-safe Monaco positioning passed focused browser and theme checks |
| Record shipped product facts and visual rules in root contracts | Prevent future copy and styling work from inventing a second product or design language | Good — final designer checks report no contract, display-scale, numeric-claim, or contact-detail blockers |

| Freeze eager source discovery before deferred branch search | Make the picker usable without enumerating every local branch while retaining a stable initial authority | Good — the attached branch and registered worktrees render immediately; fresh branch results arrive only for non-empty input |
| Share one prompt-lifetime exact-ID registry across Base and Head selection | Keep eager, lazy, and recovered candidates unambiguous across ordered selection | Good — abort-safe lazy results and descriptor recovery preserve exact source identity |
| Use bounded native-Git protocols for literal local-head search and metadata | Avoid a persistent index and one subprocess per branch while retaining Git semantics | Good — strict protocol validation and batched abbreviation pass real-Git coverage |
| Gate discovery performance through the compiled production binary | Prevent injected seams or spike-only measurements from claiming release budgets | Good — the packed-10,000-ref gate passes fixed 400 ms readiness and 500 ms search medians |
## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? Move them to Out of Scope with a reason.
2. Requirements validated? Move them to Validated with a phase reference.
3. New requirements emerged? Add them to Active.
4. Decisions to log? Add them to Key Decisions.
5. Is “What This Is” still accurate? Update it if reality drifted.

**After each milestone:**
1. Review every section.
2. Confirm Core Value is still the right priority.
3. Audit Out of Scope and its reasons.
4. Update Context with the current product state and feedback.

---
*Last updated: 2026-07-30 after shipping v1.2 Fast Source Discovery*
