# Phase 3: Complete Review Draft - Context

**Gathered:** 2026-07-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 completes safe maintenance of the repository-local review draft: edit, delete, resolve, reopen, count, group, and navigate comments; write one optional Markdown summary; reject stale-tab writes through revision checks; preserve malformed or unsupported draft files; and visibly report when selected refs move while the open comparison stays pinned. It does not add comment threads, undo history, automatic merges, comparison refresh, source mutation, or export.

</domain>

<decisions>
## Implementation Decisions

### Comment lifecycle and review panel
- **D-01:** Use a toggleable review panel grouped by exact repository-relative file path. Show open comments first and resolved comments in a collapsed section, with separate open/resolved counts.
- **D-02:** Every listed comment provides jump-to-anchor. Navigation selects the file, reveals collapsed context, restores the correct side/line, and focuses the comment without relocating its anchor.
- **D-03:** Edit accepted comments inline at the revealed anchor using the same anchored composer model. Save explicitly; cancellation or persistence failure retains the prior accepted text.
- **D-04:** Delete only after confirmation showing path, side, line, and comment preview. Atomically remove the comment, update counts, and focus the next logical comment.
- **D-05:** Do not add soft-delete tombstones, undo history, threads, or replies in v1.
- **D-06:** Resolve and reopen through atomic state mutations. Resolved comments remain grouped by file with jump, edit, and reopen actions.

### Overall summary experience
- **D-07:** Place one persistent, collapsible Summary section at the top of the review panel above grouped comments.
- **D-08:** Store the canonical summary as Markdown text and provide edit/preview modes. Phase 4 must derive `review.md` from this same canonical source rather than a separate rich-text model.
- **D-09:** Accept summary edits only through explicit **Save summary** or Ctrl/Cmd+Enter. Show saved/unsaved state and perform one atomic revision-checked write.
- **D-10:** On persistence failure or conflict, retain unsaved summary text locally and keep canonical accepted state unchanged.
- **D-11:** The summary is optional. Empty is valid, displays as **No summary yet**, and never blocks comment work or export.

### Conflicts and corrupt drafts
- **D-12:** Use one monotonically increasing revision for the entire draft. Every accepted comment or summary mutation supplies the client's last-seen revision.
- **D-13:** The server atomically applies a matching mutation and increments the revision; a stale revision returns an explicit conflict with the latest canonical state and does not write.
- **D-14:** On conflict, preserve attempted text locally, explain what changed, and offer **Reload latest**. Do not auto-merge or expose a force-overwrite path.
- **D-15:** If draft JSON is malformed or schema-invalid, preserve the original file byte-for-byte, disable mutations, and show a read-only recovery screen with repository-relative path and validation details.
- **D-16:** Recovery may offer reveal/copy plus an explicit **Back up and start new** action. That action must create a preserved backup before creating a replacement and must never silently overwrite the original.
- **D-17:** A valid draft with a newer unsupported schema remains unchanged and read-only. Identify the unsupported version and require upgrading Diff Review; never attempt downgrade or best-effort rewrite.

### Claude's Discretion
- Exact review-panel sizing, badges, and comment ordering within each open/resolved group.
- Exact conflict comparison copy and how much canonical change detail to show, while avoiding sensitive absolute paths.
- Backup filename convention for explicit corrupt-draft recovery, provided it is deterministic/collision-safe and the original bytes remain recoverable.
- Selector-drift presentation. It must identify which selected source moved and old/new full commit IDs, keep the open review pinned, forbid silent refresh, and offer only an explicit path to launch a new comparison.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product boundary and draft requirements
- `.planning/PROJECT.md` — Defines the versioned repository-local JSON draft, single-user local boundary, pinned comparison semantics, and export separation.
- `.planning/REQUIREMENTS.md` — Defines Phase 3 requirements `CMT-03`–`CMT-07` and `DRFT-04`–`DRFT-06`, plus corrupt-state and selector-drift acceptance.
- `.planning/ROADMAP.md` § Phase 3 — Defines the complete-draft goal and five success criteria.

### Prior locked decisions
- `.planning/phases/01-pinned-local-comparison/01-CONTEXT.md` — Defines immutable comparison identities, safe path authority, persistent pinned-session cues, and the Phase 3 boundary for active selector drift.
- `.planning/phases/02-anchored-diff-review/02-CONTEXT.md` — Defines one comment per side-specific line, atomic acceptance, inline anchored editing model, comment navigation/context reveal, and draft separation by commit pair.

No external specs or ADRs exist.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No implemented source assets exist yet. Phase 1 and Phase 2 planning run in background; their plans are contracts, not established code patterns.

### Established Patterns
- All accepted mutations are server-validated, atomically persisted, and acknowledged only after disk success.
- Comparison and anchor identity are immutable; UI navigation may reveal/focus anchors but never rewrite them.
- Shared Zod schemas are the source of truth for browser/API/persistence contracts.

### Integration Points
- Extend Phase 2's accepted comment mutation path with edit/delete/resolve/reopen operations guarded by whole-draft revision checks.
- The review panel consumes the canonical draft and existing file/anchor navigation, not a duplicate client-only comment index.
- Summary mutations share the same revision and atomic persistence boundary as comments.
- Draft loading must distinguish valid/current, valid/newer-unsupported, malformed/schema-invalid, and missing states before exposing mutation routes.
- Selector-drift checks cumpa the launch-time source selectors with current resolved commits without changing pinned base/head/merge-base/blob identities.

</code_context>

<specifics>
## Specific Ideas

- After deletion, focus the next logical comment so keyboard review can continue.
- Conflict handling preserves attempted text locally even though the canonical write is rejected.
- Recovery is intentionally read-only until the user explicitly backs up and starts a replacement draft.

</specifics>

<deferred>
## Deferred Ideas

- Soft-delete/undo history, automatic conflict merge, force overwrite, comment threads, and generated summaries remain outside v1.

</deferred>

---

*Phase: 3-Complete Review Draft*
*Context gathered: 2026-07-11*
