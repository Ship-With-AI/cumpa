---
name: cumpa
description: "Launches Cumpa’s native coding-agent review flow and consumes its canonical review result. Use for /cumpa, reviewing local changes, or comparing ordered local branches, commits, or registered worktrees in Cumpa."
---

# Cumpa

Use Cumpa as the review UI and protocol authority. This skill is only a gate to the installed CLI: do not recreate its review logic, make review commits, mutate refs/index/worktrees, or review the diff yourself.

## Workflow

1. Run from the repository being reviewed. Confirm `cumpa` and Git are available.
2. Identify the ordered **base** and **head** the user requested. If either is ambiguous or omitted, ask only for the missing selection.
3. Resolve immutable full OIDs:
   - branch/commit: `git rev-parse <selection>`
   - registered worktree: resolve its committed `HEAD`; dirty bytes are not included
   - preserve PR semantics by sending `git merge-base <base-tip> <head-tip>` as `base` and the resolved head tip as `head`
4. Create unique temporary request and result files outside the repository. Write one strict request:

```json
{"kind":"cumpa.review-request","schemaVersion":1,"mode":"revisions","revisions":{"base":"<full-merge-base-oid>","head":"<full-head-oid>"}}
```

Add `pathspecs` only when the user requested them. Preserve their order.

5. Start Cumpa as a supervised background process from the reviewed repository. Unset `CMUX_WORKSPACE_ID`, redirect the request to stdin and stdout to the result file, and watch stderr for `http://127\.0\.0\.1:[0-9]+`. Equivalent command:

```sh
env -u CMUX_WORKSPACE_ID cumpa < "$CUMPA_REQUEST" > "$CUMPA_RESULT"
```

Use the harness process supervisor, not a detached shell. Give the user the URL and exact short OID range, keep the process alive, and wait for it to exit after **Finish**.

6. Accept the handoff only when Cumpa exits `0` and the result is one non-empty parseable JSON object with `kind: "cumpa/export"`. Exit `1`, exit `130`, empty stdout, or invalid JSON means no accepted review; report the Cumpa diagnostic without inventing feedback.
7. Consume and report; do not edit code:
   - overall `summary.markdown`
   - open comments grouped by file, with anchor side/line, body, and verification state
   - counts, drift warning, and acknowledged state
   - resolved-comment count; list resolved comments only when asked
   - if summary and comments are empty, say the review completed with no recorded feedback
8. Remove temporary request/result files only after the result has been consumed. Cumpa’s repository-local draft/export remains authoritative.

## Native exact-patch mode

Use exact-patch mode only when the user explicitly supplies a patch or asks to review one. Do not synthesize patches or temporary commits to extend Cumpa.

```json
{"kind":"cumpa.review-request","schemaVersion":1,"mode":"patch","patch":{"content":"<exact UTF-8 patch>","target":{"kind":"repository"}}}
```

`target.kind` is `repository` for committed `HEAD` or `worktree` for current on-disk entries. The patch must be non-empty, NUL-free UTF-8 and the entire request must not exceed 1 MiB.

## Protocol invariants

- Piped stdin selects agent mode; stdout stays empty until successful Finish.
- URL and diagnostics are stderr-only.
- Revision requests use full pinned OIDs; base must be an ancestor of head.
- Cumpa reviews committed worktree `HEAD`, not dirty worktree bytes.
- Cumpa never applies, stages, commits, or pushes changes.
- Do not treat process readiness as review completion; wait for successful exit and validate stdout.
