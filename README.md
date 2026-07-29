# Compare

Compare gives committed local Git comparisons a pull-request-style review workspace without publishing a branch or worktree. Choose local branches or registered worktrees, leave durable feedback, and export it for an agent or teammate to use.

This is a **local source setup** for the private `compare@0.0.0` package. It is not a published npm package.

## Prerequisites

You need:

- Node.js 24 or later
- npm
- Git 2.43.0 or later
- A non-bare Git worktree containing at least one commit for the repository you want to review

## Install and build from this checkout

Run these commands in the Compare source checkout:

```sh
npm ci
npm run build
npm link
```

`npm run build` creates the `dist/bin/compare.mjs` executable, and `npm link` makes this locally built `compare` command available from your shell.

## Start a review

Change to the Git worktree whose local branches or registered worktrees you want to compare, then run:

```sh
cd /path/to/repository-to-review
compare
```

Compare first asks you to choose the **base**, then the **head**, using searchable lists of local branches and registered worktrees. The base is the reference point; the selected head is the committed state under review.

The comparison is a diff from the selected base and head’s merge base to the selected head. If a selected worktree is dirty, Compare uses its committed HEAD only; uncommitted worktree bytes are not reviewed.

Before launch, the confirmation screen shows the full base, head, and merge base OIDs. Confirm only after checking them: the session is pinned to those commits and does not follow later ref movement.

Compare listens only on an ephemeral `127.0.0.1` loopback port. It prints the review URL before attempting to open your default browser. If no browser opens, use the printed URL directly.

## Review in the browser

1. Select a changed file in the file tree.
2. Inspect the side-by-side Monaco diff: **BASE** is on the left and **HEAD** is on the right. Unchanged regions start collapsed; use Monaco’s context controls to reveal more context.
3. Move between files and changes using visible controls or shortcuts. On either side of the diff, add a line comment and save it.
4. Open **Review** to write and save the overall Markdown summary. Use its preview to inspect the rendered summary.
5. Inspect saved comments, edit them, resolve them when addressed, and reopen resolved feedback when needed.
6. Check the review-readiness information and any warning about unsaved text before exporting. Export uses the accepted saved revision, not unsaved text currently in a tab.

Saved comments and the saved summary are repository-local, versioned JSON state. Reopen the same ordered comparison to continue that saved review. Text left unsaved in a comment or summary editor remains only in the current browser tab; it is not durable and is excluded from export.

### Draft location

Compare stores a draft at:

```text
.compare/drafts/<comparison-key>.json
```

`<comparison-key>` is a 64-hex SHA-256 hash derived from the ordered, pinned base and head commit OIDs. It is an application-generated draft identity, not a filename you choose or a literal base/head path.

## Export an accepted review

Export creates this pair together from the accepted draft revision:

```text
.compare/exports/<baseOid>..<headOid>/review.json
.compare/exports/<baseOid>..<headOid>/review.md
```

`review.json` is the canonical export; `review.md` is derived from it. Export does not apply, stage, commit, or push changes.

After a successful export, the receipt offers **Reveal export directory**. The export area also shows `.gitignore` status and offers an optional flow to append the Compare ignore rule. Ignore status is not a prerequisite for reviewing or exporting.

## Stop Compare

Return to the terminal where you launched `compare` and press `Ctrl+C`. This stops the local loopback server.

## Keyboard shortcuts

Visible controls remain available for every action. These shortcuts are additional ways to work:

| Action | Shortcut |
| --- | --- |
| Previous file | Alt+Shift+[ |
| Next file | Alt+Shift+] |
| Previous change | Shift+F7 |
| Next change | F7 |
| Add or focus a comment on the current line | Option+Enter on macOS; Alt+Enter on Windows and Linux |
| Add the comment | Command+Enter on macOS; Ctrl+Enter on Windows and Linux |
| Discard or close the composer | Escape |
| Move through controls | Tab and Shift+Tab |
| Move in the changed-file tree; open a file | Arrow keys; Enter |
| Open Monaco accessibility help | Alt+F1 |

## v1 file limits

Compare reviews regular UTF-8 text files only. Each inspected blob side must be at most 1,048,576 bytes (1 MiB).

Binary, non-UTF-8, oversized, symlink, submodule, and unsupported mode/type entries stay visible but are not reviewable. Missing-object cases (missing objects) are separately unavailable rather than unsupported file kinds. Compare does not separately detect arbitrary generated source files. Its own `.compare/` internal output is always excluded from the review inventory.
