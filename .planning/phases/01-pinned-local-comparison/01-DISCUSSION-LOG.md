# Phase 1: Pinned Local Comparison - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-11
**Phase:** 1-Pinned Local Comparison
**Areas discussed:** Base/head picker experience, Pinned identity and dirty-state cues, Changed-file inventory, Errors and empty states

---

## Base/head picker experience

| Option | Description | Selected |
|--------|-------------|----------|
| Two-step reusable picker | Reuse one searchable list for explicit base-first and head-second selection, then confirm identities. | ✓ |
| Single combined form | Display base and head selectors together before resolving the comparison. | |
| Separate picker modes | Put branches and worktrees in separate selection experiences. | |
| Guess both endpoints | Infer base and head from checkout and branch/remote naming conventions. | |

**User's choice:** “all good, pick your recommendations for these” — delegated the area to Claude.
**Notes:** Recommended a grouped single list, source-specific metadata, current checkout suggested only as head, explicit base selection, and an identity-rich confirmation. Equal-commit candidates remain visible but cannot launch.

---

## Pinned identity and dirty-state cues

| Option | Description | Selected |
|--------|-------------|----------|
| Repeated non-blocking cues | Show dirty state in picker, confirmation, and browser while clearly stating dirty bytes are ignored. | ✓ |
| One-time warning | Show dirty state only before launch. | |
| Blocking acknowledgment | Require the user to approve a modal warning before continuing. | |
| Full IDs always in header | Permanently occupy primary header space with complete object IDs. | |
| Compact header plus identity panel | Keep labels/short IDs persistent and full copyable IDs immediately accessible. | ✓ |

**User's choice:** Delegated the area to Claude's recommendation.
**Notes:** The session explicitly communicates that it is pinned. Active moving-ref drift detection remains Phase 3 scope.

---

## Changed-file inventory

| Option | Description | Selected |
|--------|-------------|----------|
| Hierarchical tree | Deterministically ordered directory tree with compacted paths and dense status/count rows. | ✓ |
| Flat path list | Render every changed file as one flat full-path row. | |
| Status-grouped lists | Split changed files into separate added/modified/deleted/etc. groups. | |
| Metadata pane | Selecting a Phase 1 entry shows Git metadata and availability without rendering text diff. | ✓ |
| Premature text preview | Implement file content or Monaco diff before Phase 2. | |

**User's choice:** Delegated the area to Claude's recommendation.
**Notes:** Exact Git paths remain lossless; control characters are safely escaped visually. Renames and copies show old path → new path. Unsupported entries remain visible with specific reasons.

---

## Errors and empty states

| Option | Description | Selected |
|--------|-------------|----------|
| CLI before session | Resolve launch/comparison failures before starting the server and keep recoverable selection context. | ✓ |
| Open browser for every error | Start a browser session even when no valid comparison exists. | |
| Browser message plus terminal detail | Show post-launch recovery guidance in the UI and detailed diagnostics in the terminal. | ✓ |
| Valid browser empty state | Treat a pinned no-change comparison as valid and inspectable. | ✓ |
| Stop no-change comparison in CLI | Treat an empty change set as a launch failure. | |
| Permissive security fallback | Retry denied requests with broader repository/object/path access. | |

**User's choice:** Delegated the area to Claude's recommendation.
**Notes:** Security failures must not leak sensitive path/object details in the browser and must never broaden access. Server shutdown or expiry requires explicit relaunch.

---

## Claude's Discretion

The user delegated all selected areas to Claude's recommendations. Claude chose the concrete behaviors recorded in `01-CONTEXT.md`; planners retain discretion only over styling, exact copy, picker keyboard details, and internal structure that do not alter those decisions.

## Deferred Ideas

None.
