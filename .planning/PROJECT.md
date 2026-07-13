# Diff Review

## What This Is

Diff Review is a local-first code review application for developers who want a GitHub pull-request-style review experience without publishing branches or worktrees to a remote host. A CLI launched inside a Git repository opens a browser workspace where the developer selects two local branches or registered worktrees, reviews PR-style changes side by side, leaves line comments and an overall summary, and exports the result as Markdown plus canonical JSON that a coding agent can apply.

## Core Value

A developer can accurately review committed changes between any two local branch or worktree heads and export precise, drift-detectable feedback an agent can act on.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can launch the application from a Git repository through a CLI that opens a loopback-only browser session.
- [ ] User can interactively select an ordered base and head from local branches and registered worktrees.
- [ ] User can review merge-base-to-head changes in a GitHub-like side-by-side text diff with changed-file navigation and expandable context.
- [ ] User can create, edit, delete, and resolve comments on any visible line on either side of a diff.
- [ ] User can write an overall review summary while the review remains an editable repository-local draft.
- [ ] User can export a completed review as readable Markdown and versioned JSON containing stable Git identities and context anchors for an applying agent.

### Out of Scope

- Reviewing staged, unstaged, or untracked worktree changes — v1 compares committed worktree `HEAD` values only and reports ignored dirty state.
- Hosting reviews remotely or supporting multiple simultaneous reviewers — the product is a single-developer local tool.
- Posting reviews to GitHub, GitLab, or another forge — export files are the integration boundary for v1.
- Applying requested changes from inside the application — a separate coding agent consumes the export.
- Image, notebook, document, or binary diff rendering — v1 reviews text; unsupported files are identified but not rendered inline.
- Full GitHub review mechanics such as replies, suggestion patches, approvals, and pending-review submission — v1 provides line comments, resolution, and an overall summary.

## Context

The motivating workflow is reviewing local agent or developer work before it is pushed or opened as a pull request. Existing hosted review tools require remote branches. Local tools such as PRless and diffmux already prove the browser-review-to-agent loop; this project is distinct only if it preserves committed branch/worktree parity, PR-style merge-base semantics, pinned comparison identity, and a canonical drift-detectable JSON export.

Each comparison is ordered: the first selection is the base and the second is the head. PR-style semantics mean the displayed change is the merge base of those commits compared with the selected head, not a direct tree-to-tree snapshot. A selected worktree resolves to its committed `HEAD`; dirty files do not affect the review.

The browser workspace should provide a changed-file tree with statuses and counts, collapsible file diffs, side-by-side hunks, syntax highlighting, context expansion, and keyboard navigation. Comments may attach to any visible changed or context line on either side. Drafts survive browser closure in a repository-local, gitignored directory.

The canonical JSON export must be versioned and machine-validated. Each comment must carry enough identity to detect drift: comparison commit IDs, relevant blob IDs, file path, old/new side, line or range, nearby context anchors, comment text, and resolution state. Markdown is generated from the same review model for human readability.

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
| Use PR-style merge-base-to-head comparison | Match the mental model and visible change set of hosted pull-request reviews | — Pending |
| Resolve branches and worktrees to committed Git objects | Produce stable, reproducible comparisons and exclude ambiguous dirty state | — Pending |
| Use the installed Git CLI rather than a Git library | Preserve native Git behavior for merge bases, worktrees, renames, blobs, and diff metadata | — Pending |
| Use TypeScript, Node.js, Fastify, Vue 3, Vite, and Monaco | Keep shared contracts in one language while supporting a capable browser diff workspace | — Pending |
| Store drafts as repository-local versioned JSON | Keep reviews resumable, portable within the local repository, and independent of browser storage | — Pending |
| Export canonical JSON plus generated Markdown | Give agents a strict contract and humans a readable review artifact | — Pending |
| Keep v1 local and single-user | Focus effort on accurate comparison, commenting, persistence, and export rather than hosting or collaboration | — Pending |

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
*Last updated: 2026-07-11 after initialization*
