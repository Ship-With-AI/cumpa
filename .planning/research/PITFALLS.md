# Pitfalls Research

**Project:** Diff Review  
**Researched:** 2026-07-11

## Critical Risks

### 1. Comparing the wrong commits

**Failure:** Treating `base...head` as two endpoints passed directly to a library, using two-dot comparison, or comparing worktree files. The UI then differs from a PR and changes when local files change.

**Prevention:** Resolve selectors once, calculate merge base explicitly, pin full object IDs, and fetch blobs from Git objects. Display all three IDs. Test diverged branches where direct base-to-head and merge-base-to-head produce different files.

### 2. Worktree identity confusion

**Failure:** Assuming a worktree always has a branch, reading the main worktree's `HEAD`, or parsing human-formatted `git worktree list` output. Detached, locked, missing, and prunable worktrees break selection or point to the wrong commit.

**Prevention:** Parse `git worktree list --porcelain -z`, keep path/HEAD/branch/detached/prunable fields, and resolve within the selected worktree when confirmation is needed. Treat dirty state as a warning only; reviewed bytes come from the recorded commit object.

### 3. Unsafe or lossy Git parsing

**Failure:** Splitting output on lines or spaces, interpolating ref/path strings into a shell command, accepting leading-dash values as options, or parsing localized/human output. Unusual valid paths become corrupted; malicious names may alter commands.

**Prevention:** `spawn` with an argument array and `shell: false`, NUL-delimited plumbing/porcelain output, explicit `--`, full commit IDs after resolution, disabled pager/color/external diff, bounded output, and fixture coverage for pathological names.

### 4. Mixing Git and Monaco line models

**Failure:** File counts come from Git while commentable line numbers come from a separately parsed patch or from Monaco with different whitespace/diff settings. Anchors can point to a line the user did not see.

**Prevention:** Fetch exact old/new blobs. Treat the Monaco model line numbers as the UI anchor source of truth, while Git owns file identity and object IDs. Set diff options deliberately and capture selected/context text at comment creation. Do not derive comment positions from `--numstat` or unified-patch offsets.

### 5. Fragile inline comment widgets

**Failure:** Injecting DOM into Monaco without lifecycle ownership, adding a zone on only one side, or recreating models without reattaching zones causes scroll jumps, broken alignment, orphaned widgets, and memory leaks. Diffmux documents similar annotation flakiness with another renderer.

**Prevention:** Build a prototype with multiple comments on both sides, hidden-region expansion, file switching, resizing, and keyboard navigation. Keep widget IDs in one adapter, add compensating opposite-side zones, recreate from persisted state after `onDidUpdateDiff`, and dispose models/listeners. Retain `@pierre/diffs` as a fallback only if the prototype fails.

### 6. Treating loopback as authentication

**Failure:** Any local page or malicious site can attempt requests to a loopback server. Permissive CORS, path-based APIs, or unauthenticated mutations can expose source or alter reviews.

**Prevention:** Random per-process bearer token delivered in the URL fragment, exact Origin checks, no CORS, JSON-only authenticated API, opaque server-issued file IDs, fixed repository/comparison scope, and no arbitrary file/ref/output parameters after startup.

### 7. Non-atomic or incompatible drafts

**Failure:** A crash truncates JSON, two tabs overwrite each other, or a future schema silently drops fields. Losing review comments destroys the product's core value.

**Prevention:** Runtime schema versioning, whole-document validation, temporary sibling plus atomic rename, restrictive permissions, optimistic revision checks, corruption quarantine/recovery messaging, and explicit migrations. Never replace an unreadable draft with an empty document.

### 8. Weak export anchors

**Failure:** Exporting only `path:line` makes feedback unsafe as soon as an agent or branch advances. Renames, deleted lines, and repeated code cause edits at the wrong location.

**Prevention:** Include pinned commits, merge base, side-specific old/new path, blob ID, line/range, exact selected text, surrounding context, and a hash. In Markdown, require identity check and explicit ambiguity reporting. Test duplicate snippets and branch movement.

## Important Edge Cases

### Git graph

- unrelated histories: no merge base
- multiple merge bases from criss-cross merges
- base and head resolving to the same commit
- unborn branch or empty repository
- selected branch deleted or advanced after launch
- shallow or partial clones missing required objects
- submodules and gitlinks

For v1, fail explicitly on missing/ambiguous graph prerequisites; do not synthesize an arbitrary comparison.

### File identity

- add/delete where one blob side is absent
- rename and copy with distinct old/new paths
- mode-only changes with identical content
- symlink blobs
- submodule commit changes
- binary files and Git attributes
- non-UTF-8 text
- huge files, huge lines, and diff-computation timeout
- filenames containing tabs, newlines, Unicode, or a leading dash
- `\ No newline at end of file`

Use Git object modes and object IDs; do not infer file type only from extensions. Define explicit UI limits and show why a file is not rendered.

### Review state

- comment on deleted/base line
- comment on unchanged context revealed after expansion
- comment edit while another tab has a newer revision
- resolved comments excluded from Markdown but retained in JSON
- summary-only export
- no-change comparison
- export path already exists
- partial failure writing two export formats

The JSON review document is canonical. Generate Markdown from it in the same export transaction.

## Scope Traps

### Rebuilding GitHub wholesale

Viewed state, progress bars, multi-line comments, suggestions, replies, approvals, filters, themes, unified view, and live refresh are all useful. They are not all required to prove the product. First prove committed branch/worktree selection, accurate PR-style comparison, durable line comments, and agent-grade export.

### Generalizing the server too early

Do not create a multi-repository daemon, arbitrary Git query API, extension protocol, or plug-in system. One CLI process, one repository, one pinned comparison, one browser session.

### Hiding close competitors

PRless already offers much of the generic local-review experience. The project must preserve its distinct committed worktree/branch parity and canonical JSON anchor contract. If those are removed, using or contributing to PRless is more rational than building another tool.

### Overusing Monaco

Monaco is an editor platform, not a pull-request review system. Disable editing, code actions, minimap, and services that do not support review. Keep Vue responsible for navigation/comments and use Monaco only for text models, diff computation, rendering, and line placement.

## Verification Strategy

- Create real temporary Git repositories in tests; never mock Git output for contract coverage.
- Build graph fixtures: linear, diverged, rename, deletion, mode change, detached worktree, dirty worktree, unusual paths, no merge base.
- Snapshot the canonical JSON schema only as a supplement; primary tests parse exports and assert observable fields and agent instructions.
- Kill the process during draft writes and verify the prior valid draft survives.
- Run Playwright against the packaged Fastify/Vite build, not only Vite dev mode.
- Verify loopback binding, API token rejection, Origin rejection, and path traversal attempts.
- Exercise Monaco comment zones visually and behaviorally with both sides, hidden context, resize, and file changes.

## Sources

- [Git diff documentation](https://git-scm.com/docs/git-diff) — merge-base equivalence, raw/numstat formats, binary output, and textconv limitations.
- [Git worktree documentation](https://git-scm.com/docs/git-worktree) — stable porcelain mode and worktree-specific `HEAD` behavior.
- [GitHub review comment API](https://docs.github.com/en/rest/pulls/comments?apiVersion=2022-11-28#create-a-review-comment-for-a-pull-request) — warns that non-latest commit identity can make comments outdated and defines side/line semantics.
- [PRless](https://github.com/muhammadZihad/prless) — close product baseline and durable-anchor precedent.
- [diffmux](https://github.com/Nicomalacho/diffmux) — documents practical asynchronous annotation issues in a local diff renderer.
