# Phase 4: Agent-Ready Export - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves alternatives considered.

**Date:** 2026-07-11
**Phase:** 4-Agent-Ready Export
**Areas discussed:** Export location and re-export, Markdown review structure, Drift and export readiness, Safety and completion feedback

**User direction:** “all good, go with your recommendations” — delegated all four areas to Claude.

---

## Export location and re-export

| Decision | Recommended selection | Alternatives rejected |
|----------|-----------------------|-----------------------|
| Directory | Stable `<fullBaseOid>..<fullHeadOid>` directory | Timestamped snapshots; one global pair |
| Re-export | Transactionally replace the stable pair | Independent overwrites; delete-first |
| Snapshot | One accepted whole-draft revision | Per-format reads; session-long edit lock |
| Ordering | Canonical path/anchor ordering and LF serialization | UI order; chronology-only |

**Notes:** JSON and Markdown derive from one immutable snapshot. A failure preserves the previous complete export. Only the explicit export timestamp may vary for unchanged state.

---

## Markdown review structure

| Decision | Recommended selection | Alternatives rejected |
|----------|-----------------------|-----------------------|
| Hierarchy | Identity/drift → summary → actionable files → attention → instructions | Raw dump; prose-first report |
| Resolved comments | Count only; complete history remains in JSON | Resolved appendix; mix with open |
| Anchors | Complete safe anchor block | Path/line only; opaque ID only |
| Agent instructions | Strict verify-or-report contract | Best-effort line matching; none |

**Notes:** Absolute paths never export. Stale/orphaned comments are non-actionable. Resolved comments cannot be interpreted as requested work.

---

## Drift and export readiness

| Decision | Recommended selection | Alternatives rejected |
|----------|-----------------------|-----------------------|
| Drift | Allow pinned export after explicit acknowledgement | Block all drift; silent export |
| Empty summary | Valid | Required; generated |
| No open comments | Valid complete artifact | Require request; skip generation |
| Stale/orphaned open comments | JSON + Needs reviewer attention | Block export; treat as normal work |

**Notes:** Drift metadata records launch/current selector identities but never refreshes pinned blobs. Empty artifacts state clearly that no actionable requests exist.

---

## Safety and completion feedback

| Decision | Recommended selection | Alternatives rejected |
|----------|-----------------------|-----------------------|
| Gitignore | Explicit byte-preserving append offer | Silent mutation; no help |
| Pair failure | Temporary generation + transactional publication | Independent files; delete-first |
| Receipt | Revision, timestamp, relative paths, SHA-256 hashes, drift state | Generic toast; auto-open |
| Non-mutation proof | Behaviorally compare Git/source state before/after | Trust review; cleanup afterward |

**Notes:** Declining gitignore setup still allows export with a warning. `.diff-review/` remains excluded from the reviewed change set regardless. Source-control writes/commands are prohibited.

---

## Claude's Discretion

All selected decisions were delegated to Claude. Schema names, canonical encoder, temporary-generation mechanics, fsync/rename strategy, and receipt styling remain implementation discretion within CONTEXT.md.

## Deferred Ideas

None.
