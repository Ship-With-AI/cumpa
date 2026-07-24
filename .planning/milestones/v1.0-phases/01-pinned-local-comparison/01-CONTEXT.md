# Phase 1: Pinned Local Comparison - Context

**Gathered:** 2026-07-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 launches a secure loopback browser session from a non-bare Git worktree, lets the developer explicitly select an ordered base and head from local branches and registered worktrees, resolves both to committed objects, computes one PR-style merge base, and exposes an immutable merge-base-to-head changed-file inventory pinned to full Git identities. It includes selection, comparison metadata, file-tree availability states, launch/security boundaries, and actionable empty/error states. Text-diff rendering, line comments, draft lifecycle, selector-drift handling, and export belong to later phases.

</domain>

<decisions>
## Implementation Decisions

### Base/head picker experience
- **D-01:** Reuse one searchable picker in an explicit two-step flow: choose base first, then head. The active role must be prominent at each step, followed by an identity-rich confirmation before launch.
- **D-02:** Present one result list grouped into **Local branches** and **Worktrees**. Preserve separate entries even when they resolve to the same commit because source identity, worktree path, detached state, and dirty-state context differ.
- **D-03:** Every candidate shows its type, human label, short commit ID, worktree path when applicable, detached state, and clean/dirty indicator. Those identifying fields remain searchable.
- **D-04:** Suggest the current worktree or current branch as the head, but require an explicit base. Do not guess a base from branch names, remote tracking data, or naming conventions.
- **D-05:** Keep equal-commit candidates visible so the list remains truthful, but prevent launch and explain that both selections resolve to the same commit.

### Pinned identity and dirty-state cues
- **D-06:** Show dirty state on worktree rows, repeat it in the launch confirmation, and retain a persistent browser badge for selected dirty worktrees. Do not require a blocking modal.
- **D-07:** Dirty-state copy must say that the worktree's committed `HEAD` is reviewed and staged, unstaged, and untracked bytes are ignored.
- **D-08:** The browser's persistent comparison header uses source labels and short object IDs. An always-accessible identity panel exposes copyable full base, head, and merge-base commit IDs.
- **D-09:** Before opening the browser, confirm the ordered source labels, resolved full base/head commits, computed merge base, selected worktree paths, and any ignored dirty-state warnings.
- **D-10:** State that the open session is pinned to the displayed commits and does not follow moving refs. Active selector-drift detection remains Phase 3 scope.

### Changed-file inventory
- **D-11:** Use a hierarchical changed-file tree with compacted single-child directories and deterministic path ordering. Preserve a lossless path value independently from its safe visual representation.
- **D-12:** Each file row shows a status badge, path, available additions/deletions, and a clear unsupported indicator. Renames and copies render as old path → new path while retaining Git's exact record identity.
- **D-13:** Select the first changed entry initially. In Phase 1, selection opens a read-only metadata/availability pane containing status, paths, counts, mode information, and any unsupported reason; Monaco text diff remains Phase 2 scope.
- **D-14:** Visually escape control characters such as tabs and newlines without changing the underlying path. Provide the exact path through a copy/details affordance. Git record parsing must not depend on line-oriented human output.

### Errors and empty states
- **D-15:** Keep pre-session failures in the CLI: missing Git, invalid/bare/empty repository, unresolved commits or objects, equal commits, unrelated histories, and multiple merge bases. Preserve valid prior selections when the user can recover by changing one endpoint.
- **D-16:** Failures after a valid session starts appear in the browser with concise recovery guidance and a detailed terminal diagnostic. Session expiry or server shutdown instructs the user to relaunch rather than silently attaching to a new identity.
- **D-17:** A valid pinned comparison with no merge-base-to-head changes opens the browser and shows a deliberate empty state with the comparison identities. It is not an error.
- **D-18:** Unsupported files remain in the inventory with a specific reason. Security denials use non-leaking browser messages while the terminal records the actionable cause; no fallback may broaden repository, object, path, token, or origin access.

### Claude's Discretion
The user explicitly delegated all four discussed areas to Claude's recommendations. Within the locked decisions above, planners may choose visual styling, exact copy, keyboard details for the picker, and internal implementation structure consistent with the project constraints.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product boundary and technical constraints
- `.planning/PROJECT.md` — Defines the local-first product boundary, ordered comparison semantics, committed-object rule, stack constraints, persistence boundary, and v1 exclusions.

### Phase requirements and acceptance
- `.planning/REQUIREMENTS.md` — Defines Phase 1 requirements `SEL-01`–`SEL-08`, `CMP-01`–`CMP-09`, `DIFF-01`, `DIFF-06`, and `SAFE-01`–`SAFE-03`, `SAFE-05`, plus milestone acceptance criteria.
- `.planning/ROADMAP.md` § Phase 1 — Defines the Phase 1 goal, boundary, projected plan count, and five success criteria.

No external specs or ADRs exist; requirements and decisions are fully captured by the planning documents above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None found. No `src/`, `app/`, `packages/`, package manifest, or codebase map exists yet; Phase 1 is a greenfield implementation.

### Established Patterns
- No implementation patterns exist to preserve. Use the locked project stack and contracts in `.planning/PROJECT.md` rather than introducing parallel conventions.

### Integration Points
- CLI repository discovery and ordered picker feed native Git object resolution.
- Resolved comparison identity and changed-file metadata feed a token-protected Fastify loopback session.
- The packaged Vue browser workspace consumes only launch-scoped repository/object/path capabilities and remains read-only toward source control.

</code_context>

<specifics>
## Specific Ideas

- Suggest the current checkout as head while leaving base explicit.
- Use a compact persistent identity header with a full-ID detail panel.
- Make Phase 1's file selection useful through metadata and availability details without prematurely implementing Phase 2's Monaco diff.
- Treat no-change comparisons as valid, inspectable pinned sessions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Pinned Local Comparison*
*Context gathered: 2026-07-11*
