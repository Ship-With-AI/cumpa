# Phase 2: Anchored Diff Review - Context

**Gathered:** 2026-07-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 turns Phase 1's immutable pinned comparison and changed-file inventory into a read-only, syntax-highlighted Monaco side-by-side text workspace. It supports one active file, expandable unchanged context, file/change navigation, one durable comment on any visible line on either side, precise side-specific anchoring, atomic accepted-comment persistence, same-comparison resume, separate drafts for different commit pairs, and explicit stale/orphan handling when an anchor cannot be verified. Comment editing/deletion/resolution, summary, multi-tab conflict handling, active selector-drift handling, and export remain later-phase scope.

</domain>

<decisions>
## Implementation Decisions

### Comment creation interaction
- **D-01:** Hovering or focusing any visible base/head line exposes a gutter comment affordance. A documented keyboard action must open the same composer without requiring a mouse.
- **D-02:** The composer renders inline directly below the anchored line on the selected diff side. Its header shows the repository-relative path, base/head side, and side-specific line number.
- **D-03:** v1 allows one comment per side-specific line. Activating a line that already has a comment focuses that comment instead of creating a duplicate, reply, or thread.
- **D-04:** The reviewer accepts text explicitly with **Add comment** or Ctrl/Cmd+Enter. Blur never submits an unfinished comment.
- **D-05:** Cancel or Escape discards an empty composer immediately and asks for confirmation before discarding non-empty unaccepted text.
- **D-06:** A comment is accepted only after its atomic persistence succeeds. On failure, retain the composer text and anchor in place, show the recoverable error, and do not render the comment as accepted.

### Diff workspace and navigation
- **D-07:** Render one active file diff at a time, selected from the existing changed-file tree. Do not add a stacked-diff mode or layout toggle in v1.
- **D-08:** Collapse unchanged regions by default. Provide controls to reveal bounded context chunks or all remaining context in that region.
- **D-09:** Remember expansion state per file for the open browser session. Navigating to a durable comment must automatically reveal its anchored line before focusing it.
- **D-10:** Provide persistent previous/next controls for files and changes, mirrored by documented, non-conflicting keyboard shortcuts and discoverable tooltips/help.
- **D-11:** Preserve per-file scroll position, focused side/line, expanded context, and active composer while switching files or resizing during the open session.
- **D-12:** Comment identity and placement must derive from immutable blob identity, exact path, side, and side-specific line—not viewport position, rendered row index, or current scroll state.

### Claude's Discretion
- Exact shortcut keys, while keeping them documented, non-conflicting, and available through visible controls.
- Monaco integration details, language mapping, diff options, and lifecycle architecture needed to keep side alignment stable.
- Exact context-chunk size and visual treatment of expand controls.
- Anchor context-window size/hash algorithm, provided the persisted record includes every field required by CMT-02 and never silently relocates an unverifiable anchor.
- Stale/orphan presentation details, provided comments remain visible and actionable as stale/orphaned rather than disappearing or moving.
- Saved-state and resume copy, provided atomic persistence completes before UI confirmation, the same commit pair resumes automatically, and a different pair receives a separate draft.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product boundary and technical constraints
- `.planning/PROJECT.md` — Defines immutable committed-object review, Monaco/Vue stack constraints, repository-local versioned JSON persistence, and later-phase exclusions.

### Phase requirements and acceptance
- `.planning/REQUIREMENTS.md` — Defines Phase 2 requirements `DIFF-02`–`DIFF-05`, `DIFF-07`, `CMT-01`, `CMT-02`, `CMT-08`, and `DRFT-01`–`DRFT-03`, plus browser-flow acceptance criteria.
- `.planning/ROADMAP.md` § Phase 2 — Defines the anchored review goal and five success criteria, including the Monaco stability prototype requirement.

### Prior locked decisions
- `.planning/phases/01-pinned-local-comparison/01-CONTEXT.md` — Defines the pinned identity header, deterministic file tree, safe path display, unsupported states, and closed launch-scoped browser authority that Phase 2 extends.

No external specs or ADRs exist.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No implemented source assets exist yet. Phase 1 planning is running in the background; its plans are not executable code and must not be treated as established implementation patterns.

### Established Patterns
- Locked stack: Vue 3/Vite browser UI, Monaco Diff Editor, Zod contracts, Fastify loopback API, and versioned repository-local JSON persistence.
- Phase 1 context establishes immutable comparison identities, exact path authority, a one-file metadata pane, and explicit unsupported states.

### Integration Points
- Extend the Phase 1 file selection path so supported text entries load frozen base/head blob content through closed, launch-scoped capabilities.
- Monaco line/side events feed a shared anchor builder whose accepted output is validated and atomically persisted server-side.
- Per-file browser view state remains ephemeral; accepted comments and exact anchor data live in the repository-local draft.
- The comment list/navigation path must reveal hidden context before focusing an anchored line and must surface stale/orphan records without relocation.

</code_context>

<specifics>
## Specific Ideas

- Inline composer header repeats path, side, and line to make incorrect-side attachment obvious before submission.
- Visible buttons and keyboard shortcuts are peers; neither is a hidden secondary path.
- Context remains PR-like—collapsed first—despite briefly considering full-file default rendering.

</specifics>

<deferred>
## Deferred Ideas

- Stacked-file diff and user-toggleable diff layouts remain outside v1.
- Comment threads/replies and multiple independent comments on one side-specific line remain outside v1.

</deferred>

---

*Phase: 2-Anchored Diff Review*
*Context gathered: 2026-07-11*
