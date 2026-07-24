# Phase 3: Complete Review Draft - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves alternatives considered.

**Date:** 2026-07-11
**Phase:** 3-Complete Review Draft
**Areas discussed:** Comment lifecycle and list, Overall summary experience, Conflicts and corrupt drafts

---

## Comment lifecycle and list

| Decision | Alternatives considered | Selected |
|----------|-------------------------|----------|
| List organization | File-grouped review panel; flat chronology; inline only | File-grouped review panel |
| Editing | Inline at anchor; review-panel only; keystroke autosave | Inline at anchor |
| Deletion | Confirm and remove; soft-delete with undo; immediate delete | Confirm and remove |
| Resolution visibility | Collapsed resolved section; mixed list; fully hidden | Collapsed resolved section |

**User's choice:** Selected the recommended option for all decisions.
**Notes:** Open/resolved counts remain separate. Jump-to-anchor reveals context. Deletion has no tombstone/undo model. Resolved comments retain jump/edit/reopen actions.

---

## Overall summary experience

| Decision | Alternatives considered | Selected |
|----------|-------------------------|----------|
| Placement | Top of review panel; dedicated page; file-tree footer | Top of review panel |
| Persistence | Explicit save; debounced autosave; save on blur | Explicit save |
| Format | Markdown + preview; plain text; rich text | Markdown + preview |
| Requirement | Optional; required before export; auto-generated | Optional |

**User's choice:** Selected the recommended option for all decisions.
**Notes:** Ctrl/Cmd+Enter saves through one atomic revision-checked mutation. Empty summary is valid. Canonical Markdown becomes Phase 4's export source.

---

## Conflicts and corrupt drafts

| Decision | Alternatives considered | Selected |
|----------|-------------------------|----------|
| Stale tab | Block/reload canonical; force overwrite; automatic merge | Block/reload canonical |
| Revision scope | Whole draft; per comment; timestamp last-write-wins | Whole draft |
| Invalid JSON/schema | Read-only recovery; silently empty; auto-repair | Read-only recovery |
| Newer schema | Preserve/require upgrade; auto-backup/new; best-effort downgrade | Preserve/require upgrade |

**User's choice:** Selected the recommended option for all decisions.
**Notes:** Conflicts preserve attempted local text but never write it over canonical state. Malformed files remain byte-for-byte intact. Backup-and-start-new is explicit. Newer valid schemas are never rewritten by an older app.

---

## Claude's Discretion

Selector-drift reporting was not selected for discussion. Planning may choose the presentation while preserving the locked contract: report which selectors moved and old/new identities, keep the session pinned, never auto-refresh, and require an explicit new comparison.

## Deferred Ideas

- Soft delete/undo, automatic merge, force overwrite, comment threads, and generated summaries.
