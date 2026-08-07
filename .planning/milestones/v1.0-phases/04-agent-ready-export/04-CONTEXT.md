# Phase 4: Agent-Ready Export - Context

**Gathered:** 2026-07-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 explicitly exports one accepted pinned-review revision as a versioned, schema-valid canonical `review.json` plus derived `review.md` beneath `.diff-review/exports/`. It preserves full comparison/comment identities and anchors, separates actionable from resolved or unverifiable feedback, publishes both formats transactionally, reports paths/hashes, safely offers gitignore setup, and proves that export never applies, stages, commits, pushes, executes repository code, or writes source files.

</domain>

<decisions>
## Implementation Decisions

### Export location, snapshot, and re-export
- **D-01:** Use one stable comparison-specific directory: `.diff-review/exports/<fullBaseOid>..<fullHeadOid>/`, containing exactly `review.json` and `review.md`. Mutable labels never determine the path or comparison authority.
- **D-02:** Export one accepted whole-draft revision captured at export start. Canonical JSON and Markdown must derive from the same immutable snapshot; if canonical state changes before publication, fail and retry rather than mixing revisions.
- **D-03:** Re-export atomically replaces the stable pair for that pinned comparison only after both new files pass schema, derivation, and durability checks. Any failure preserves the previous complete pair.
- **D-04:** Canonically order files by exact repository-relative path identity and comments by side-specific anchor then stable comment ID. Use canonical JSON serialization and LF output. For unchanged accepted state, only the explicit export timestamp may vary.

### Markdown review structure and agent contract
- **D-05:** Structure Markdown as: pinned comparison identities and drift status; optional summary; open actionable requests grouped by exact file path; non-actionable anchor problems; applying-agent instructions.
- **D-06:** Do not include resolved comments as requested work. Markdown shows their count and directs readers to canonical JSON for full history; JSON retains every comment state and timestamp.
- **D-07:** Every actionable Markdown comment shows repository-relative path, base/head side, recorded line, relevant blob ID, exact selected text, nearby context, context hash, and comment text. Never expose absolute filesystem paths.
- **D-08:** Embedded agent instructions require verification of pinned commit, blob, exact selected text, and context hash before editing. Line number alone is never authority. Ambiguous, missing, stale, or orphaned anchors must be reported, not guessed. Resolved comments must not be applied.
- **D-09:** Stale/orphaned open comments remain in JSON with state and anchors, but appear only in a non-actionable **Needs reviewer attention** Markdown section.

### Drift and export readiness
- **D-10:** Selector drift does not invalidate the pinned review. Export the original pinned comparison, include launch/current selector identities and a prominent warning, and require explicit acknowledgement before publication. Never refresh the comparison automatically.
- **D-11:** The overall summary remains optional. When empty, omit its body and state **No summary provided** in metadata.
- **D-12:** Zero open actionable comments is valid. Export a complete artifact that explicitly states there are no open actionable requests while retaining full draft history in JSON.

### Safety, gitignore, failure, and completion feedback
- **D-13:** If `/.diff-review/` is not ignored, offer an explicit append action that preserves every existing byte/rule and adds exactly one rule. Never modify `.gitignore` silently or rewrite existing content.
- **D-14:** Declining gitignore modification still allows export with a persistent warning. Diff Review's own comparison logic always excludes `.diff-review/` regardless of ignore state.
- **D-15:** Generate both formats in a temporary sibling generation, validate canonical JSON, Markdown derivation, content hashes, and snapshot revision, durably flush, then publish as one pair. A failed generation exposes neither new file.
- **D-16:** Success feedback shows accepted draft revision, export timestamp, repository-relative output paths, SHA-256 content hashes, drift acknowledgement state, and actions to copy paths or reveal the directory.
- **D-17:** Export may create files only beneath `.diff-review/` plus an explicitly approved append to `.gitignore`. It must never call add/commit/push/apply, write source, or execute repository code.
- **D-18:** Packaged tests cumpa HEAD, index, and source worktree state before/after export, excluding the explicitly permitted `.diff-review/` output and approved gitignore append, and cover pair-write failure without partial publication.

### Claude's Discretion
The user delegated all four export areas to Claude's recommendations. Planning may choose schema field names, canonical JSON encoder mechanics, temporary-generation naming, fsync/rename strategy per supported platform, and exact receipt styling while preserving every decision above.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and export requirements
- `.planning/PROJECT.md` — Defines canonical JSON plus derived Markdown, drift-detectable anchors, local-only integration boundary, and source read-only constraint.
- `.planning/REQUIREMENTS.md` — Defines `EXP-01`–`EXP-08` and `SAFE-04`, including deterministic output, pair-write atomicity, agent verification instructions, and non-mutation.
- `.planning/ROADMAP.md` § Phase 4 — Defines the export goal and five success criteria.

### Prior locked contracts
- `.planning/phases/01-pinned-local-comparison/01-CONTEXT.md` — Defines ordered pinned comparison identity, safe paths, dirty-byte exclusion, and `.diff-review/` comparison exclusion boundary.
- `.planning/phases/02-anchored-diff-review/02-CONTEXT.md` — Defines side-specific immutable comment anchors and accepted persistence semantics.
- `.planning/phases/03-complete-review-draft/03-CONTEXT.md` — Defines canonical draft revision, Markdown summary, comment lifecycle/states, stale/orphan behavior, conflict handling, corrupt-draft preservation, and selector-drift reporting.

No external specs or ADRs exist.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No implemented source assets exist yet. Earlier phases are being planned in background; downstream planners must treat their artifacts as contracts until execution creates code.

### Established Patterns
- Shared Zod schemas govern API, persistence, and export contracts.
- Accepted draft state is revisioned and atomically persisted before UI acknowledgment.
- Full Git object, blob, path, side, and context identities are canonical; display labels and line numbers alone are not authority.

### Integration Points
- Export snapshots the canonical Phase 3 draft through the server-side persistence boundary, not browser-local projected state.
- Canonical JSON serialization is the single source from which Markdown and receipt hashes are derived.
- Transactional publication writes beneath the repository-local `.diff-review/exports/` boundary and returns a receipt to the existing review panel.
- Gitignore handling is a separate explicit mutation capability limited to a byte-preserving append of one exact rule.
- Packaged tests use real Git fixtures and filesystem fault injection to prove pair publication and source-control non-mutation.

</code_context>

<specifics>
## Specific Ideas

- Stable comparison directory uses full base/head OIDs rather than short IDs or labels.
- Markdown distinguishes **Open actionable requests** from **Needs reviewer attention**.
- Success receipt is independently verifiable through relative paths and SHA-256 hashes.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 4 scope.

</deferred>

---

*Phase: 4-Agent-Ready Export*
*Context gathered: 2026-07-11*
