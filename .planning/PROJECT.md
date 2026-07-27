# Diff Review

## What This Is

Diff Review is a local-first code review application for developers who want a GitHub pull-request-style review experience without publishing branches or worktrees to a remote host. A CLI launched inside a Git repository opens a browser workspace where the developer selects two local branches or registered worktrees, reviews PR-style changes side by side, leaves line comments and an overall summary, and exports the result as Markdown plus canonical JSON that a coding agent can apply.

## Core Value

A developer can accurately review committed changes between any two local branch or worktree heads and export precise, drift-detectable feedback an agent can act on.

## Current Milestone: v1.1 GitHub Dark Diff

**Goal:** Make the existing diff-review workspace feel substantially closer to GitHub's dark pull-request diff experience without changing review mechanics.

**Target features:**
- Apply a GitHub dark-default-inspired semantic palette to the diff workspace.
- Restyle the file header, Monaco diff, gutters, controls, inline comments, and review rail.
- Improve visual hierarchy, spacing, typography, interaction states, contrast, non-color cues, and responsive behavior.
- Preserve Diff Review's identity, information architecture, and existing review workflow.

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

### Active

- [ ] User experiences a close adaptation of GitHub's dark-default pull-request diff palette throughout the diff workspace.
- [ ] User can distinguish additions, deletions, selected lines, comments, focus, errors, and disabled states through accessible color and non-color cues.
- [ ] User retains the existing review workflow and information architecture across desktop and narrow layouts.

### Out of Scope

- Reviewing staged, unstaged, or untracked worktree changes — v1 compares committed worktree `HEAD` values only and reports ignored dirty state.
- Hosting reviews remotely or supporting multiple simultaneous reviewers — the product is a single-developer local tool.
- Posting reviews to GitHub, GitLab, or another forge — export files are the integration boundary for v1.
- Applying requested changes from inside the application — a separate coding agent consumes the export.
- Image, notebook, document, or binary diff rendering — v1 reviews text; unsupported files are identified but not rendered inline.
- Full GitHub review mechanics such as replies, suggestion patches, approvals, and pending-review submission — v1 provides line comments, resolution, and an overall summary.

## Context

Phase 05 v1.1 complete: application chrome and workflow states consume one verified semantic dark vocabulary. Phase 06 complete: real Monaco now applies the typed `diff-review-dark` theme, bounded Base/Head bars and signs, selection/anchor/focus layers, and flat empty/hunk regions while preserving immutable diff mechanics and geometry.

Diff Review v1.0 shipped the complete local browser-review-to-agent loop. A developer can select ordered local branches or registered worktrees, inspect the immutable merge-base-to-head change set, maintain a repository-local review draft, and export canonical JSON plus derived Markdown without publishing refs or modifying source control.

Each comparison is ordered and frozen to full commit IDs. The displayed change is the merge base of those commits compared with the selected head; selected worktrees resolve to committed `HEAD` values and dirty bytes never enter the review.

The browser workspace now provides an exact changed-file tree, real Monaco side-by-side text diffs, expandable context, keyboard navigation, durable line comments, review summary and comment lifecycle, conflict recovery, selector-drift reporting, and explicit unsupported, stale, and orphaned states.

Exports are versioned and machine-validated. Canonical JSON owns comparison identities, accepted summary and comments, timestamps, blob identities, and context anchors; Markdown is derived from that same validated model. Publication is an atomic pair beneath `.diff-review/exports/`, with hashes and a bounded receipt.

The shipped repository contains 30,428 tracked TypeScript, Vue, and MJS lines. v1.0 completed 51/51 requirements, 22/22 integrations, eight end-to-end flows, and a final 56/56 configured Playwright run.

Retained debt is bounded: one authenticated orphan metadata route/client method, Phase 3 UI polish, and accepted Phase 4 filesystem/power-loss durability limits. No v1.0 requirement or user flow remains blocked.

## Constraints

- **Runtime**: Node.js 24 LTS with TypeScript end to end — one language across CLI, server, shared contracts, and UI, using the current supported LTS baseline.
- **Git semantics**: Invoke the installed Git CLI as the source of truth — merge bases, refs, worktrees, renames, diff metadata, and blobs must match Git behavior.
- **CLI**: Commander with an Inquirer-based searchable selector — launch is interactive and ordered base/head selection is explicit.
- **Server**: Fastify bound only to `127.0.0.1` on an ephemeral port — the default browser opens automatically and no LAN service is exposed.
- **UI**: Vue 3 with Vite and Monaco Diff Editor — side-by-side diff rendering, line mapping, syntax highlighting, and inline review controls run in the browser.
- **Contracts**: Zod schemas shared by API, draft persistence, and export generation — incompatible or corrupt data fails explicitly.
- **Persistence**: Versioned JSON files in a gitignored repository-local `.diff-review/` directory — no database or browser-only source of truth.
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
*Last updated: 2026-07-27 after completing Phase 06 Monaco Diff Semantics*
