# Compare

Compare gives committed local Git comparisons a pull-request-style review workspace without publishing a branch or worktree. Choose local branches or registered worktrees, leave durable feedback, and export it for an agent or teammate to use.

This is a **local source setup** for the private `compare@0.0.0` package. It is not a published npm package.

Compare is the project and product; `compare` is its private npm package; `cumpa` is the command. `cumpa` is the ASCII terminal spelling of Neapolitan `cumpà`, used colloquially for a friend, mate, or comrade.

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

`npm run build` creates the `dist/bin/cumpa.mjs` executable, and `npm link` makes this locally built `cumpa` command available from your shell.

## Start a review

Change to the Git worktree whose local branches or registered worktrees you want to compare, then run:

```sh
cd /path/to/repository-to-review
cumpa
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

Return to the terminal where you launched `cumpa` and press `Ctrl+C`. This stops the local loopback server.

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

## Review changes from a coding agent

Run these commands from the repository being reviewed. Redirect `stdout` to the review JSON file your agent will consume; Compare sends the browser URL and diagnostics to `stderr`.

### Review a revision range

Provide full, pinned commit OIDs with the base before the head. This example limits the review to the ordered pathspecs shown:

```sh
node --input-type=module -e '
const request = {
  kind: "compare.review-request",
  schemaVersion: 1,
  mode: "revisions",
  revisions: {
    base: "0123456789abcdef0123456789abcdef01234567",
    head: "89abcdef0123456789abcdef0123456789abcdef",
    pathspecs: ["src", ":(exclude)src/generated"],
  },
};
process.stdout.write(JSON.stringify(request));
' | cumpa > agent-review.json
```

Replace those OIDs with real full object IDs from the repository. Explicit range mode requires the base to be an ancestor of the head, resolves both revisions to full object IDs, and freezes those resolved IDs for the session. It does not use the interactive picker’s merge-base selection or follow moving references.

### Review an exact patch

Use Node to read a named UTF-8 patch file and `JSON.stringify` its content. This avoids shell interpolation, hand-escaped patch text, `eval`, and source mutation that could alter quoting or newlines:

```sh
node --input-type=module -e '
import { readFileSync } from "node:fs";

const request = {
  kind: "compare.review-request",
  schemaVersion: 1,
  mode: "patch",
  patch: {
    content: readFileSync("review.patch", "utf8"),
    target: { kind: "repository" },
  },
};
process.stdout.write(JSON.stringify(request));
' | cumpa > agent-review.json
```

Choose `repository` to ground the patch against the current committed `HEAD` tree, or `worktree` to ground it against current on-disk entries. The patch’s preimages and modes must exactly match that target before Compare freezes the grounded bytes. Compare never applies, stages, commits, or pushes the patch.

### Finish and receive canonical JSON

When stdin is a TTY, `cumpa` runs the existing interactive picker. A pipe or redirected stdin selects this agent-request protocol instead: the browser opens and the process stays attached. The URL, fallback text, and safe diagnostics go to `stderr`; `stdout` stays empty while the review is open.

In the browser, save the feedback and choose **Finish**. Once Finish successfully settles the accepted saved revision, Compare writes exactly one canonical review JSON document to `stdout`, waits for the Finish response to settle, closes the local server, and exits `0`. Revision conflicts and failed Finish attempts leave canonical `stdout` empty. Validation, grounding, or delivery failures also leave it empty and exit `1`. Pressing `Ctrl+C` before delivery cancels without partial JSON and exits `130`.

Treat a zero exit plus parseable captured `stdout` as the agent handoff contract.

### Request reference

Both v1 requests are strict JSON objects with `kind` set to `compare.review-request` and `schemaVersion` set to `1`.

agent-request-example:revisions
```json
{
  "kind": "compare.review-request",
  "schemaVersion": 1,
  "mode": "revisions",
  "revisions": {
    "base": "0123456789abcdef0123456789abcdef01234567",
    "head": "89abcdef0123456789abcdef0123456789abcdef",
    "pathspecs": ["src", ":(exclude)src/generated"]
  }
}
```

`pathspecs` defaults to `[]` when omitted. Its order is preserved and passed to Git.

agent-request-example:patch
```json
{
  "kind": "compare.review-request",
  "schemaVersion": 1,
  "mode": "patch",
  "patch": {
    "content": "diff --git a/src/example.ts b/src/example.ts\nindex 1111111..2222222 100644\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-before\n+after\n",
    "target": {
      "kind": "repository"
    }
  }
}
```

For patches, `target.kind` is exclusively `repository` or `worktree`; revision and patch fields cannot be mixed. Unknown fields are rejected. The complete request must be one non-empty valid UTF-8 JSON document of at most 1,048,576 bytes. Each revision and pathspec Git argument must be non-empty, NUL-free valid Unicode, and at most 4,096 UTF-8 bytes; there can be at most 256 pathspecs. Patch content must be non-empty, NUL-free valid Unicode and fit within the total request budget, so its usable size is less than 1 MiB after JSON overhead.

### Isolation and persistence

Every piped launch receives a fresh repository-local `agent-` scope followed by 32 lowercase hexadecimal characters. Its saved draft cannot resume or overwrite an ordinary comparison draft or another agent launch. Saved draft state is durable; unsaved browser text is not. A successful Finish makes the accepted result terminal and read-only, and the captured canonical `stdout` is the agent handoff.

For exact-patch reviews, the frozen source snapshot is private to the session. It is never replaced by later live repository or worktree bytes, and is disposed when the server closes.

## v1 file limits

Compare reviews regular UTF-8 text files only. Each inspected blob side must be at most 1,048,576 bytes (1 MiB).

Binary, non-UTF-8, oversized, symlink, submodule, and unsupported mode/type entries stay visible but are not reviewable. Missing-object cases (missing objects) are separately unavailable rather than unsupported file kinds. Compare does not separately detect arbitrary generated source files. Its own `.compare/` internal output is always excluded from the review inventory.
