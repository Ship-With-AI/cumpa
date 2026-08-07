---
phase: 13
slug: exact-patch-grounding
researched: 2026-08-05
status: complete
---

# Phase 13: Exact Patch Grounding — Research

## Scope and established substrate

Phase 12 accepts one strict stdin `cumpa.review-request` and resolves its revision selectors once into a `PinnedComparison`. Its source boundary is `src/contracts/request.ts`, which uses strict Zod objects, bounded UTF-8 Git arguments, no NULs, a one-megabyte request limit, and an exclusive `mode: 'revisions'` payload. The new exact-patch form belongs at that same contract and CLI parsing boundary: it must be mutually exclusive with revisions and interactive selection, not an alternate browser-side source.

`src/server/capabilities.ts` already owns session-scoped file lookup/content reads, draft identity, export wiring, and selector-drift observation. `src/git/objects.ts` supplies bounded, native-Git object reads by full 40/64-hex object ID. `src/git/inventory.ts`, `src/git/raw-diff.ts`, `src/git/availability.ts`, and `src/domain/path-bytes.ts` are the existing authority for NUL-safe Git metadata, file availability, and exact displayable path bytes. The Phase 12 review plans and implemented range path establish the required pattern: freeze source identity on the server, use it for every route/draft/export operation, and never make the browser derive scope.

## Decided implementation approach

1. Extend the strict request discriminated union with one explicit exact-patch variant. It accepts the submitted patch as the sole request input; reject unknown fields, mixed revision/patch fields, malformed/oversize bytes, invalid UTF-8 control representation, and unsafe paths before server startup/browser launch.
2. Parse and validate the patch server-side using native Git behavior and existing NUL/path DTO practices. Construct the authoritative changed-file inventory from Git-derived patch metadata; preserve add/modify/delete/rename/copy/mode/type metadata, old/new exact path bytes, similarity, modes, and unsupported reasons. Do not let Vue parse unified diff text or synthesize statuses.
3. For every non-absent preimage, resolve the named object with `createObjectReader()` and retain the exact bytes read from Git. For every non-absent postimage, cumpa the patch-produced bytes to the actual implementation target at validation time using byte equality, not decoded strings or line comparisons. The target is either repository content or the selected worktree according to the request/session contract. A missing object, type mismatch, path escape, patch application ambiguity, or byte mismatch rejects the request before launch.
4. On acceptance, materialize a session-owned immutable snapshot containing only validated inventory, frozen preimage/postimage bytes, digest, metadata, and validation target. The capability registry and file-content routes read this snapshot exclusively. The normal Git/object/worktree readers are validation inputs only and are not fallbacks after acceptance.
5. Create a focused post-launch observer which cumpas the original validated implementation identity/content against the live target. When it changes, expose one explicit drift state while retaining frozen routes and review feedback; never replace an accepted side, rebuild the snapshot, or offer acknowledgement/refresh/current-content continuation. If snapshot content itself is lost/corrupt/unreadable, return a blocking snapshot failure rather than live data.

This is a clean cutover for patch sessions. Interactive comparison and Phase 12 revision-range behavior remain on their existing `PinnedComparison` paths.

## File and pattern anchors

| Concern | Existing anchor | Planning implication |
|---|---|---|
| Strict request boundary | `src/contracts/request.ts`, CLI request reader and Phase 12 request tests | Add a discriminated patch form and enforce exclusive source selection at decode/launch time. |
| Native Git subprocess safety | `src/git/runner.ts`, `src/git/repository.ts` | Use argument arrays and current repository discovery; no shell command construction or write command. |
| Immutable repository blob reads | `src/git/objects.ts` | Preimages must be full object-ID reads with bounded byte handling and raw Buffer equality. |
| Metadata/inventory truth | `src/git/raw-diff.ts`, `src/git/inventory.ts`, `src/git/availability.ts` | Retain Git status, rename/copy similarity, modes, type/availability, and non-reviewable entries rather than reducing them to text diffs. |
| Path safety and rendering | `src/domain/path-bytes.ts` and file-tree DTO consumers | Preserve raw path representation and control-safe display; never decode/reconstruct paths optimistically. |
| Session ownership | `src/server/capabilities.ts`, `src/server/routes.ts` | Add a patch session scope and snapshot-backed lookup/read path adjacent to the frozen range scope, without cross-session globals. |
| Draft and export identity | `src/contracts/draft.ts`, `src/server/draft-store.ts`, `src/export/review-export.ts`, `src/export/render-review-markdown.ts` | Persist and export server-derived exact-patch identity/digest only; browser values are not trusted. |
| Existing drift pattern | `src/git/selector-drift.ts`, capability routes and API contracts | Reuse one server-side observer/status route pattern, but patch drift must preserve readable frozen content and prohibit substitution. |
| Existing review UI | `src/web/App.vue`, identity/header/panel, file tree, diff workspace, metadata pane, inline notices | Add the exact-patch presentation branch specified by `13-UI-SPEC.md`; retain review controls and use preimage/postimage terminology. |

## Read-only and threat boundaries

- The validation path MUST call only read-only Git/object/worktree operations. It must not invoke patch application, checkout, reset, add, commit, update-index, update-ref, or object-writing operations. Validation tests must observe that worktree files, index, refs, and object-store contents are unchanged.
- Treat patch path bytes, headers, mode/type declarations, object IDs, and target-path resolution as hostile. Reject traversal, absolute paths, NUL/control corruption, malformed rename/copy pairs, duplicate/conflicting entries, invalid modes, and any value that cannot be represented by the existing exact-path contract.
- Hash the canonical submitted patch bytes once on the server with SHA-256 after strict input validation. Use the lowercase full digest as source identity and snapshot/draft/export key material; the browser only displays/copies it.
- Snapshot storage must be private to the authenticated session, atomically created before launch, read-only after acceptance, bounded by existing content limits, and cleaned at session end. No request-controlled filename may choose a snapshot location.
- Drift detection is a failure signal, not permission to revalidate or mutate. A drifted session remains readable from frozen bytes, and a missing snapshot is terminal for that session.

## Requirement mapping

| Requirement | Plan-ready implementation and proof |
|---|---|
| PATCH-01 | Strict exclusive patch request variant; server-built inventory/scope; browser opens existing workspace containing only snapshot entries. Cover valid exact patch, mixed-input rejection, and inventory isolation. |
| PATCH-02 | Object-reader preimage proof plus byte-exact implemented postimage comparison. Cover absent sides, object missing/type mismatch, changed live target, malformed patch, and mismatch rejection. |
| PATCH-03 | Reuse native Git inventory/raw diff/path-byte DTOs. Cover add/delete/modify/rename/copy/mode-only/symlink/binary/submodule/non-UTF-8/oversize and preserve metadata even when diff is unavailable. |
| PATCH-04 | Restrict adapter calls to reads and prove fixtures retain file bytes, index checksum/status, refs, and object counts after both success and rejection. |
| PATCH-05 | Snapshot-backed routes/models and drift observer. Cover initial frozen reads, mutation after acceptance, persistent explicit drift, retry from same snapshot only, and missing/corrupt snapshot blocking without live fallback. |

## Validation architecture

Use TDD plans for pure patch parsing/grounding/snapshot/digest logic and route contracts; use execute tasks for narrow UI presentation wiring. Each TDD task follows RED (focused test demonstrates missing behavior), GREEN (minimal production change), REFACTOR (same focused command stays green). Focused test groups should follow existing project conventions in `tests/cli`, `tests/git`, `tests/api`, `tests/unit`, and `tests/e2e`, with the existing Git fixture helper extended only where needed.

Test matrix must cover: request exclusivity; malformed/unsafe inputs; repository-object preimages; exact and non-exact worktree/repository postimages; all inventory status/type/path edge cases; no mutation on success and failure; immutable snapshot reads through route reload/navigation; post-launch drift; unavailable/corrupt snapshot; draft/export provenance; and UI copy/accessibility/state contracts in the approved UI spec. The executor runs only focused tests selected by the changed plan, never broad project validation.

## Plan split and dependencies

- **13-01 (wave 1, TDD):** strict exact-patch contract plus native Git parser/grounding/metadata/read-only validation. It establishes the only accepted patch scope and covers PATCH-01–04 foundations.
- **13-02 (wave 2, TDD):** owned immutable snapshot, patch session capability/routes, digest/provenance, and explicit drift detection. It depends on 13-01 and completes PATCH-05 server behavior.
- **13-03 (wave 3, execute plus focused UI/API verification):** connect frozen patch scope to existing review/draft/export/UI presentation while preserving range/interactive flows. It depends on 13-02 and covers visible PATCH-01/03/05 behavior and the approved UI contract.

All research questions are resolved by the established Phase 12 substrate and the above boundaries; no external library or speculative mechanism is required.

## RESEARCH COMPLETE
