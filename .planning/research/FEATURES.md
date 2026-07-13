# Feature Research

**Project:** Diff Review  
**Researched:** 2026-07-11

## Ecosystem Baseline

GitHub establishes the expected review loop: inspect changed files one at a time, leave comments on specific lines or ranges, mark files viewed, navigate review progress, and submit an overall review summary. Local agent-oriented tools such as PRless and diffmux confirm that the valuable handoff is precise file/line feedback delivered without a remote pull request.

A close existing product, PRless, already supports browser-based local diffs, inline and range comments, durable context anchors, filters, keyboard shortcuts, and a Markdown handoff for agents. Diff Review therefore should not compete merely on “local diff plus comments.” Its v1 distinction is an exact committed-snapshot workflow across local branches and registered worktrees, PR-style merge-base semantics, resumable comparison identity, and a canonical drift-detectable JSON export alongside Markdown.

## Table Stakes for v1

### Launch and Selection

- Launch from anywhere inside a non-bare Git worktree.
- Fail clearly outside a Git repository or when Git is unavailable.
- Search local branches and all registered worktrees in one picker.
- Select base first and head second; show labels, branch/detached state, worktree path, short SHA, and dirty-state warning.
- Prevent identical resolved commits from starting a meaningless review.
- Pin the session to resolved commit IDs so branch movement cannot silently rewrite an open review.
- Open the default browser automatically and print the local URL plus stop instructions in the terminal.

### Comparison

- Compute `merge-base(base, head)` and compare that commit to head.
- Show the exact base, selected head, resolved commit IDs, and merge-base ID in the UI.
- Enumerate added, modified, deleted, renamed, copied, mode-only, binary, and unsupported files.
- Show per-file additions/deletions where Git can compute them.
- Clearly report unrelated histories or ambiguous merge bases rather than fabricating a diff.
- Use committed worktree `HEAD` only; surface but ignore staged, unstaged, and untracked state.

### Diff Review

- Changed-file tree with status and line counts.
- Side-by-side old/new text with syntax highlighting and synchronized navigation.
- Collapsible file sections or a focused single-file workspace.
- Hidden unchanged regions that can expand to reveal commentable context lines.
- File jump and next/previous change keyboard navigation.
- Clear placeholders for binary, oversized, non-UTF-8, generated, or otherwise unsupported files.
- Empty-state explanation when selected commits have no PR-style changes.

### Comments and Summary

- Add a comment on any visible line on either side, including unchanged context.
- Edit, delete, resolve, and reopen a comment.
- Persist comments immediately; reload and browser closure must not lose accepted edits.
- Jump from a comment list to its file and line.
- Display orphaned or stale anchors explicitly if a draft is loaded against unexpected content.
- Provide one editable overall review summary.
- Show counts of open and resolved comments.

### Export

- Explicit Export action; export does not mutate Git or apply changes.
- Canonical, versioned JSON validated by the same schema used for drafts.
- Human-readable Markdown generated from the canonical review model.
- Include comparison identities, timestamps, summary, open comments, resolution state in JSON, side-specific paths, line/range, blob IDs, and context anchors.
- Markdown groups actionable open comments by file and tells an agent to verify commit/anchor identity before editing.
- Deterministic ordering and serialization so repeated unchanged exports are stable apart from an explicit export timestamp.
- Write exports atomically and show their repository-relative paths.

### Local Safety and Recovery

- Bind only to `127.0.0.1` on an ephemeral port.
- Require an unguessable in-memory session token for API access.
- Constrain all reads and writes to the resolved repository and `.diff-review/` data directory.
- Exclude `.diff-review/` from the reviewed diff and recommend or install the gitignore entry without overwriting user rules.
- Preserve a corrupt draft for diagnosis and fail with a recovery message instead of replacing it.
- Shut down cleanly on terminal interrupt.

## Differentiators Worth Keeping in v1

1. **Branch/worktree parity** — every combination resolves through the same selector and committed-object model.
2. **PR semantics by default** — merge-base-to-head, not PRless's documented two-dot branch comparison and not a raw filesystem diff.
3. **Pinned review identity** — the draft is keyed by resolved comparison commits, not only a repository-wide comments file.
4. **Agent-grade JSON** — stable schema with blobs and context hashes, not only prose or clipboard text.
5. **Visible dirty-state exclusion** — worktrees are useful selectors, but v1 remains reproducible by reviewing committed `HEAD`.

## Defer to v2

- Direct tree-to-tree/two-dot comparison mode.
- Commit and tag selection beyond local branches and registered worktrees.
- Staged, unstaged, and untracked review modes.
- Multi-line range comments and whole-file comments.
- Suggested replacement patches.
- Viewed-state tracking, review progress, filters, file search, generated-file heuristics, and customizable keyboard shortcuts.
- Unified diff layout and theme selection.
- Selective export of chosen comments.
- Live refresh when a branch/worktree advances and anchor reattachment across revisions.
- Clipboard export or direct delivery to a running agent.
- Image and notebook previews.
- VS Code extension or native desktop shell.
- GitHub/GitLab import or publishing.

These are valuable precedents, especially in GitHub and PRless, but including them in the initial release would dilute the committed-ref comparison and export contracts that distinguish the product.

## Explicit Non-Goals

- User accounts, remote hosting, collaboration, notifications, or permissions.
- Approve/request-changes enforcement; local review completion is explicit export.
- Replies and social discussion threads.
- Applying, committing, or pushing code.
- Executing repository code or evaluating diff content.
- Rich rendering of binary or document formats.

## Sources

- [GitHub: Reviewing proposed changes](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/reviewing-proposed-changes-in-a-pull-request) — expected file navigation, line/range comments, viewed state, progress, and summary review flow.
- [GitHub REST review-comment schema](https://docs.github.com/en/rest/pulls/comments?apiVersion=2022-11-28#create-a-review-comment-for-a-pull-request) — established `commit_id`, `path`, `side`, `line`, `start_line`, and `start_side` anchor vocabulary.
- [PRless](https://github.com/muhammadZihad/prless) — close local-agent review precedent, including durable comments, Markdown export, filters, and local-only operation.
- [PRless Git implementation](https://github.com/muhammadZihad/prless/blob/main/src/server/git.ts) — confirms its branch compare uses two-dot `git diff <base> <head>` and local branches rather than the required worktree/merge-base model.
- [diffmux](https://github.com/Nicomalacho/diffmux) — compact local review and direct-agent handoff precedent.
