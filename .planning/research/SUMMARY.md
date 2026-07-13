# Research Summary

**Project:** Diff Review  
**Researched:** 2026-07-11

## Executive Summary

Diff Review is technically straightforward as a local TypeScript modular monolith, but its correctness rests on three non-negotiable boundaries: Git must own comparison/object semantics, Monaco-visible lines must own comment positions, and one versioned review document must own persistence and both exports.

The market is not empty. PRless already delivers a browser-based local review with durable comments and an agent Markdown handoff; diffmux demonstrates a smaller direct-to-agent workflow. Diff Review remains justified only if it delivers the stated distinction cleanly: ordered local branch/worktree selection, committed-`HEAD` parity, PR-style merge-base-to-head comparison, pinned review identity, and canonical JSON with blob/context anchors.

## Recommended Stack

- Node.js 24 LTS, ESM, TypeScript
- npm package with Commander and `@inquirer/search`
- Native Git CLI through a single safe `spawn` adapter
- Fastify 5 bound to `127.0.0.1` on port `0`
- Vue 3 + Vite
- Monaco Diff Editor
- Zod as the canonical runtime schema layer
- Repository-local atomic JSON drafts
- Vitest, Fastify `inject()`, real temporary Git repositories, and Playwright

Keep one package and one process. Avoid Rust, SQLite, a background daemon, a JavaScript Git implementation, or premature extension APIs.

## Table Stakes

1. Searchable ordered selection of local branches and registered worktrees.
2. Clear pinned base/head/merge-base identity and dirty-worktree warnings.
3. Accurate changed-file metadata across additions, deletions, renames, binary/unsupported files, and unusual paths.
4. GitHub-like changed-file navigation with side-by-side text, expandable context, and keyboard movement.
5. Durable create/edit/delete/resolve line comments on either side plus an overall summary.
6. Resume by deterministic comparison identity after browser closure.
7. Explicit atomic export to canonical versioned JSON and derived Markdown.
8. Loopback-only, token-protected, repository-scoped local API.
9. Clear failures for missing Git, non-repositories, equal commits, unrelated histories, ambiguous merge bases, corrupt drafts, and unsupported content.

## Architecture Decisions

### Git owns immutable inputs

Resolve branch/worktree selections to commits, compute merge base explicitly, enumerate paths with NUL-delimited Git output, and fetch old/new bytes by blob ID. Never review filesystem contents from selected worktrees. This preserves reproducibility and the user's committed-HEAD decision.

### Monaco owns displayed line positions

Load full old/new blobs as read-only models. Monaco computes and renders the side-by-side view; its original/modified line coordinates become base/head comment anchors. Git owns file and object identity, not the widget's line mapping.

### The review JSON is canonical

Draft, API, and export share one Zod schema. Markdown is generated from validated JSON. Each anchor records side-specific path, base/head side, line/range, blob ID, exact selected text, nearby context, and a hash. Resolved comments remain in JSON and are excluded from actionable Markdown.

### One process is one capability boundary

The CLI selects and pins a comparison before starting Fastify. Routes accept opaque file IDs rather than arbitrary paths or refs. A random in-memory bearer token, exact Origin validation, no CORS, and loopback binding protect source and review mutations.

## Highest-Risk Unknown

Monaco supports the necessary APIs, including original/modified editors, line changes, hidden unchanged regions, and view zones. The unresolved UX risk is stable inline comment rendering while preserving side-by-side alignment through hidden-region expansion, resize, and file switching. Build and test that thin vertical prototype before investing in the full review workspace. If it fails, `@pierre/diffs` is the researched fallback.

## Product Scope Recommendation

### v1

- committed local branch/worktree selectors
- PR-style merge-base-to-head comparison
- changed-file tree and side-by-side text diffs
- single-line comments on any visible line, including context
- edit/delete/resolve/reopen comments
- overall summary
- repository-local resumable draft
- canonical JSON plus Markdown export
- unsupported-file placeholders and explicit Git/graph errors

### v2

Direct snapshots, commits/tags, dirty working-tree modes, ranges, file comments, suggestions, viewed progress, filters/search, themes, unified view, live refresh/reattachment, selective or clipboard export, direct agent delivery, image previews, editor extensions, and remote-forge integration.

## Key Pitfalls

- accidental two-dot or filesystem comparison
- human/line-delimited Git parsing and shell interpolation
- detached or stale worktree assumptions
- multiple/no merge-base handling
- Git/Monaco line-model disagreement
- asymmetric or leaking Monaco comment zones
- assuming loopback means authenticated
- non-atomic drafts or schema drift
- `path:line`-only exports that become unsafe after code moves
- feature parity work that erases the product's differentiation

## Implications for Roadmap

1. Establish toolchain, domain schemas, safe Git adapter, graph fixtures, and selector semantics.
2. Prove a vertical browser slice: pinned comparison → file list → Monaco diff → one persisted anchored comment → JSON/Markdown export.
3. Complete comment lifecycle, summary, resume/conflict handling, error/unsupported states, and loopback security.
4. Finish GitHub-like navigation, context expansion, keyboard behavior, packaging, and end-to-end verification.

This is a coarse four-phase project. Every phase should end in an observable user workflow, not only internal scaffolding.

## Research Files

- [STACK.md](./STACK.md)
- [FEATURES.md](./FEATURES.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [PITFALLS.md](./PITFALLS.md)

## Primary Sources

- [Git diff documentation](https://git-scm.com/docs/git-diff)
- [Git worktree documentation](https://git-scm.com/docs/git-worktree)
- [GitHub review workflow](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/reviewing-proposed-changes-in-a-pull-request)
- [GitHub review comment API](https://docs.github.com/en/rest/pulls/comments?apiVersion=2022-11-28#create-a-review-comment-for-a-pull-request)
- [Fastify server reference](https://fastify.dev/docs/latest/Reference/Server/)
- [Monaco published type definitions](https://unpkg.com/monaco-editor@latest/monaco.d.ts)
- [Node.js release schedule](https://nodejs.org/en/about/previous-releases)
- [PRless](https://github.com/muhammadZihad/prless)
- [diffmux](https://github.com/Nicomalacho/diffmux)
