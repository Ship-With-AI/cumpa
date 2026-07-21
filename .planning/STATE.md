---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 02
current_phase_name: anchored-diff-review
status: verifying
stopped_at: Completed 02-10-PLAN.md
last_updated: "2026-07-21T21:36:35.115Z"
last_activity: 2026-07-21
last_activity_desc: Phase 02 execution started
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 38
  completed_plans: 23
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-11)

**Core value:** A developer can accurately review committed changes between any two local branch or worktree heads and export precise, drift-detectable feedback an agent can act on.
**Current focus:** Phase 02 — anchored-diff-review

## Current Position

Phase: 02 (anchored-diff-review) — EXECUTING
Plan: 10 of 10
Status: Phase complete — ready for verification
Last activity: 2026-07-21 — Phase 02 execution started

Progress: ████░░░░░░ [██████░░░░] 61%

## Performance Metrics

**Velocity:**

- Total plans completed: 25
- Average duration: 23 min
- Total execution time: 4.7 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 13 | - | - |

**Recent Trend:**

- Last 5 plans: 26min, 15min, 27min, 20min, 14min
- Trend: Improving

*Updated after each plan completion*
| Phase 01 P01 | 11 min | 3 tasks | 12 files |
| Phase 01 P02 | 23 min | 2 tasks | 8 files |
| Phase 01 P03 | 30 min | 2 tasks | 7 files |
| Phase 01 P04 | 31min | 2 tasks | 10 files |
| Phase 01 P05 | 29min | 2 tasks | 10 files |
| Phase 01 P06 | 32min | 2 tasks | 10 files |
| Phase 01 P07 | 21min | 2 tasks | 8 files |
| Phase 01-pinned-local-comparison P08 | 26min | 2 tasks | 12 files |
| Phase 01-pinned-local-comparison P09 | 15min | 2 tasks | 3 files |
| Phase 01-pinned-local-comparison P10 | 27min | 2 tasks | 10 files |
| Phase 01 P11 | 20min | 2 tasks | 12 files |
| Phase 01 P12 | 14min | 2 tasks | 6 files |
| Phase 01 P13 | 26min | 3 tasks | 7 files |
| Phase 02 P02 | 8min | 3 tasks | 8 files |
| Phase 02 P04 | 7min | 3 tasks | 4 files |
| Phase 02 P03 | 14min | 3 tasks | 9 files |
| Phase 02 P05 | 27min | 1 tasks | 8 files |
| Phase 02 P06 | 10min | 2 tasks | 8 files |
| Phase 02 P07 | 34min | 2 tasks | 8 files |
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 02 P08 | 20min | 3 tasks | 5 files |
| Phase 02 P09 | current execution session | 3 tasks | 9 files |
| Phase 02 P10 | current execution session | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions.

- Initialization: Use PR-style merge-base-to-head semantics for ordered base/head selections.
- Initialization: Review committed branch/worktree objects only; dirty worktree bytes are ignored and reported.
- Initialization: Use native Git with Node.js 24, Fastify, Vue 3, Vite, Monaco, Zod, and versioned local JSON.
- Initialization: Export canonical JSON plus derived Markdown; do not apply source changes.
- [Phase 01]: Use only fourteen audited exact direct releases — The approved supply-chain gate forbids additional or ranged direct dependencies.
- [Phase 01]: Generate the package bin over compiled production output — The wrapper imports dist/cli/run.js and never falls back to TypeScript source.
- [Phase 01]: Publish only dist runtime output — The package allowlist excludes TypeScript, Vue source, tests, and development configuration.
- [Phase 01]: Use hasCommittedChanges as the Plan 01-02 committed fact — Full file inventory remains Plan 01-06 scope.
- [Phase 01]: Resolve ordered base and head refs exactly once, then use only full object IDs — Moving refs cannot alter the frozen comparison descriptor.
- [Phase 01]: Suppress repository execution surfaces at the shared Git runner — Hooks, fsmonitor, external diffs, prompts, optional locks, and file transport are disabled.
- [Phase 01]: Construct Fastify only after the frozen ordered comparison exists — Invalid or unresolved selections must not bind a port.
- [Phase 01]: Treat browser opening as best effort — Print the actual loopback URL and exact fallback first, then keep serving if opener dispatch rejects.
- [Phase 01]: Use one memoized shutdown promise for signals and programmatic cleanup — Git abort, listener close, handler removal, and the first exit status occur at most once.
- [Phase 01]: Keep interactive selection out of Plan 01-03 — The packaged lifecycle uses ordered launch options; Plan 01-04 owns the Commander and Inquirer selector.
- [Phase 01]: Require Git 2.43.0 and positive machine-protocol probes before selection — A version string alone cannot prove the native protocols needed for immutable comparison are available.
- [Phase 01]: Encode fatal versus role-local recovery ownership in LaunchError — Environment failures must exit before launch while recoverable endpoint and graph failures preserve the opposite valid selection.
- [Phase 01]: Require exactly one merge-base --all result and reverify pinned commit objects — Ambiguous ancestry or vanished objects must fail instead of choosing a base, re-resolving a ref, or reading worktree bytes.
- [Phase 01]: Parse raw diff and numstat as separate byte and NUL grammars, joining only by exact path-byte tuples.
- [Phase 01]: Derive opaque file IDs from a process namespace and exact raw-record identity; display paths never select records.
- [Phase 01]: Use matching rename, copy, external-diff, and text-conversion controls with the same pinned merge-base and head OIDs for both inventory commands.
- [Phase 01]: Use NUL-framed cat-file commands with validated full object IDs as the sole content authority. — Machine framing stays byte-safe and forbids refs, paths, filters, textconv, and filesystem fallback.
- [Phase 01]: Classify structural non-regular modes without object access, then inspect every regular side before reading bytes. — This prevents symlink traversal and makes missing, wrong-type, and oversized precedence deterministic.
- [Phase 01]: Use one strict availability union per changed file and remove free-form unsupported reasons. — Downstream API and UI consumers receive exactly one synchronized machine reason while every record stays visible.
- [Phase 01-pinned-local-comparison]: Bind exact loopback Host and Origin only after the ephemeral listener reports its actual authority; fail closed before binding.
- [Phase 01-pinned-local-comparison]: Expose only strict metadata DTOs through frozen opaque file capabilities; repository roots and blob object IDs remain server-side.
- [Phase 01-pinned-local-comparison]: Protect API requests with a per-process 256-bit fragment bearer erased from browser history and held only inside a fixed-method client closure.
- [Phase 01]: Exact path bytes and opaque IDs drive tree authority — Status-specific effective paths, bytewise ordering, and selection never parse display strings
- [Phase 01]: Compact only one-directory and zero-file chains — Mixed file-directory nodes and branched directories remain explicit while exact full prefixes survive compaction
- [Phase 01]: Keep directory focus separate from file selection — Roving focus can traverse and collapse directories without replacing selectedFileId with path or directory authority
- [Phase 01]: Render the hierarchy recursively with complete ARIA tree semantics while retaining the Plan 09 model as the only navigation state machine.
- [Phase 01]: Treat safe display strings as presentation only; opaque file IDs drive keys, selection emissions, and the existing file-capability request.
- [Phase 01]: Use platform-neutral Uint8Array and base64url operations so the shared exact-path tree projection executes in production browser assets without a Node Buffer polyfill.
- [Phase 01]: Expose only selected worktree path and dirty state in the browser identity DTO — Preserves required identity context without exposing branch refs, source IDs, object capabilities, or diagnostics.
- [Phase 01]: Classify a failed session fetch as a stopped local session — Keeps stopped recovery truthful while HTTP, validation, and security failures retain their fixed non-leaking copy.
- [Phase 01]: Keep Plan 01-11 identity disclosure non-modal — Plan 01-13 owns narrow sheet modality, focus trapping, tabs, and final responsive acceptance.
- [Phase 01]: Keep safe display paths separate from exact UTF-8 or base64url copy payloads.
- [Phase 01]: Render session status, paths, counts, and availability immediately; add modes only from matching opaque detail responses.
- [Phase 01]: Require request-generation and response fileId equality before accepting selected-file details.
- [Phase 01]: Keep the narrow comparison disclosure in the persistent header while the modal identity sheet occupies the workspace grid row.
- [Phase 01]: Treat Enter and Space on directory treeitems as directory toggles only; emit file activation only for focused file rows.
- [Phase 01]: Prove ref immutability by advancing the selected head ref after each packaged server listens and asserting the session remains pinned.
- [Phase 02]: Derive every anchor field server-side from opaque fileId, side, and line after the session guard. — Clients cannot select repository, path, blob, or context authority.
- [Phase 02]: Use domain-separated unsigned-64-bit-length-framed SHA-256 over lossless path bytes and immutable anchor facts. — Makes context and uniqueness identities deterministic across text, paths, and SHA-1 or SHA-256 OIDs.
- [Phase 02]: Classify unavailable anchors as orphaned and exact mismatches as stale without search, relocation, or record rewrites. — Preserves drift-detectable review feedback.
- [Phase 02]: Keep workspace interaction state in an opaque fileId-keyed browser-memory map and emit pure ordered commands. — Preserves per-file interaction state without browser or repository persistence.
- [Phase 02]: Separate workspace transitions from public Monaco effects; layout, diff navigation, and reveal are adapter commands. — Keeps tests bound to state and documented public Monaco behavior rather than editor internals.
- [Phase 02]: Key drafts only from framed ordered full selected endpoint OIDs. — Labels, refs, merge bases, paths, and short IDs cannot select a repository-local draft.
- [Phase 02]: Reuse the public Monaco adapter for one active immutable side-by-side diff; keep opaque IDs as the only selection input. — Preserves Phase 1 authority and existing A→B→A editor restoration without a second lifecycle.
- [Phase 02]: Treat visible file/change controls and documented keyboard shortcuts as accessible peers. — Boundary-disabled controls remain discoverable while narrow layouts retain the side-by-side diff plane.
- [Phase 02]: Persist canonical server comment responses only — The server owns accepted anchor normalization; workspace state must not manufacture persisted comments.
- [Phase 02]: Sort comments rail by file order, side, and line — Deterministic ordering makes review navigation stable across reloads.
- [Phase 02]: Use package-first Chromium acceptance against real Git rather than development seams. — The final Phase 2 contract requires generated CLI, loopback server, browser assets, and real Git objects end to end.
- [Phase 02]: Index active comparison paths by side and exact bytesBase64url before reconciling comments.
- [Phase 02]: Retain validated durable-anchor evidence even when the active comparison lacks an exact file capability.
- [Phase 02]: Use a pending move target and explicit discard confirmation before replacing a non-empty composer anchor. — Prevents silent loss of locally unsaved review text when a user activates a different Monaco line.
- [Phase 02]: Assert the canonical persisted comparison tuple, including mergeBaseOid. — Draft comparison validation requires the full immutable base, head, and merge-base identity.
- [Phase 02]: Use a deleted head-side exact path for orphan package fixtures. — Recorded-file inspection remains unavailable unless the current immutable comparison grants an exact-file capability.

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 2: Prove Monaco inline comment view zones preserve side alignment through context expansion, resize, file switching, and diff recomputation; use `@pierre/diffs` only if the prototype fails.
- Product: PRless already covers generic local agent review; preserve committed branch/worktree parity, merge-base semantics, comparison-specific drafts, and canonical anchored JSON.
- Phase 03 Plan 03-01 is blocked before Task 1: mandatory read_first requires all .planning/phases/02-anchored-diff-review/*-SUMMARY.md, but none exist because Phase 02 is at its own blocking human-approval checkpoint. No Phase 03 source or reconciliation artifacts were created; resume only after all Phase 02 prerequisite summaries exist and their checkpoint permits continuation.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Inputs | Commits, tags, direct comparison, and dirty working-tree modes | v2 | Initialization |
| Review | Ranges, file comments, suggestions, replies, viewed state, filters, unified layout, themes | v2 | Initialization |
| Delivery | Clipboard, direct agent delivery, rich formats, extensions, forge integration | v2 | Initialization |

## Session Continuity

Last session: 2026-07-21T21:34:56.950Z
Stopped at: Completed 02-10-PLAN.md
Resume file: None
