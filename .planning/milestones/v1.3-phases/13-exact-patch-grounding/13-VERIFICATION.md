---
phase: 13-exact-patch-grounding
verified: 2026-08-05T15:03:00Z
status: passed
score: 12/12 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps: []
---

# Phase 13: Exact Patch Grounding — Verification Report

**Phase goal:** Coding agents can submit an exact already-applied patch and developers review only immutable bytes proven against repository-backed content.

**Re-verification:** Yes — the prior report found one blocker (ordinary exact-patch export) and two behavior-unverified UI truths. This report rechecks those items against current source and focused execution rather than relying on plan summaries.

## Goal Achievement

### Observable truths

| # | Truth | Status | Current evidence |
| --- | --- | --- | --- |
| 1 | A patch request is strict, exclusive, and launched without range selection, repair, or approval. | ✓ VERIFIED | `ExactPatchRequestSchema` is a strict `mode: "patch"` union member in `src/contracts/request.ts`; `runOrdinaryAction()` branches directly through `createGroundedExactPatch()` and `createExactPatchSessionApp()` in `src/cli/run.ts`. Request and dispatch tests passed. |
| 2 | Every non-absent preimage is read by full object ID and every reconstructed postimage byte-matches the selected target. | ✓ VERIFIED | `src/git/exact-patch.ts` uses `createObjectReader().inspect/read()` for complete object IDs, reconstructs text/binary content in memory, verifies blob identity, mode, and `Buffer.equals()` against the repository tree or worktree. The real-Git grounding suite passed. |
| 3 | Accepted inventory preserves Git-derived paths, states, modes, similarity, counts, and availability without browser inference. | ✓ VERIFIED | Grounding creates authoritative `ChangedFile` records; `PatchSnapshot` stores their manifest entries; snapshot session/file DTOs project them; the browser consumes parsed session/content DTOs. The focused API/browser tests cover renamed, unsupported, and exact preimage/postimage presentation paths. |
| 4 | Validation, snapshot creation, review reads, and drift observation do not mutate Git worktree, index, refs, remotes, or objects. | ✓ VERIFIED | Grounding uses read-oriented Git/object/tree/worktree operations only. Snapshot writes are generated private files; draft/export writes are Cumpa-owned `.cumpa` data. `tests/git/exact-patch.test.ts` includes before/after source-control evidence and passed. |
| 5 | Accepted bytes and metadata are privately copied before listener registration and cannot be changed by later target/caller mutation. | ✓ VERIFIED | `createExactPatchSessionApp()` awaits `materializePatchSnapshot()` before Fastify/routing composition. `PatchSnapshot` persists a verified manifest and owned content files, while `readContent()` returns fresh buffers. `tests/api/exact-patch.test.ts` mutates source buffers after app creation and still receives frozen content. |
| 6 | Every exact-patch content-dependent capability, including ordinary export, reads the same snapshot and remains usable through source drift. | ✓ VERIFIED | `createExactPatchCapabilityRegistry().exportReview()` now loads the accepted draft, obtains `snapshot.exportScope()`, builds/canonicalizes `ReviewExportV3`, and publishes it. `exportScope()` derives status/files solely from the verified manifest and rejects terminal loss; it never supplies live bytes. The focused API test successfully exports V3 provenance after a real target mutation and confirms the changed live content is absent. |
| 7 | Missing, corrupt, incomplete, unauthenticated, or unowned snapshots become terminal `snapshotUnavailable`; retryable reads remain snapshot-only. | ✓ VERIFIED | `PatchSnapshot` verifies root ownership/mode, manifest provenance, file type/length/digest, and latches terminal loss. API tests remove/corrupt the snapshot, receive `snapshotUnavailable`, and receive failed content/export requests rather than a fallback. The browser test executes the resulting terminal state. |
| 8 | Draft identity and V3 export provenance are server-derived from digest, target, review key, and frozen inventory; browser input cannot select them. | ✓ VERIFIED | The exact registry creates the draft store from snapshot session provenance. `buildReviewExportV3()` rejects a draft whose digest, target, or review key differs from `ExactPatchExportScope`; `snapshot.exportScope()` supplies frozen inventory/status. V3 focused unit tests and the end-to-end route test passed. |
| 9 | Existing interactive and revision-range contracts remain intact, including range-only selector drift. | ✓ VERIFIED | Exact and pinned registries remain distinct; patch sessions use `/api/patch-status`, range sessions retain `/api/selector-drift`. `selector-drift-ui.spec.ts` executed both paths successfully. |
| 10 | A valid exact patch opens the authenticated ordinary workspace from frozen server inventory with exact-patch terminology. | ✓ VERIFIED | `App.vue` starts patch status only for the strict patch session member; `IdentityHeader`, `IdentityPanel`, and `DiffWorkspace` consume that member and render frozen/exact/preimage/postimage labels. Browser coverage verifies heading, scope trigger, endpoint separation, side labels, and accessible diff label. |
| 11 | Terminal snapshot loss replaces content-dependent browser surfaces with the blocking state and never substitutes live bytes. | ✓ VERIFIED | `App.vue` branches `patchStatus.kind === "snapshotUnavailable"` to `ErrorState` before rendering `.review-shell`. The exact browser test transitions from a snapshot-only retry to `snapshotUnavailable`, proves the one focused `Frozen patch unavailable` heading, no retry button, and no review shell. The API test independently proves terminal content/export blocking. |
| 12 | The approved exact-patch scope, retry, responsive, focus, and preimage/postimage UI contract works across all required regimes. | ✓ VERIFIED | `selector-drift-ui.spec.ts` executes exact retry and terminal behavior, 1440/1100/768 overlay behavior, and the 320px modal focus trap/Escape-return/no-horizontal-overflow case. It also verifies full digest rendering and exact side terminology. |

**Score:** **12/12 must-haves verified**.

## Required Artifacts and Wiring

| Artifact / link | Status | Evidence |
| --- | --- | --- |
| `src/contracts/request.ts` → `src/git/exact-patch.ts` | ✓ WIRED | Strict patch content/target are the only patch-request inputs passed to grounding. |
| `src/git/exact-patch.ts` → repository object/tree/worktree readers | ✓ WIRED | Full object reads and target comparisons produce frozen grounded data without apply/index/write operations. |
| `src/cli/run.ts` → `createExactPatchSessionApp()` | ✓ WIRED | Patch branch grounds once, then creates the exact app directly; range selection is bypassed. |
| `src/server/app.ts` → `src/server/patch-snapshot.ts` | ✓ WIRED | Snapshot materializes before capability/routing composition and disposes on app close. |
| `src/server/capabilities.ts` → `PatchSnapshot` | ✓ WIRED | Session, file metadata/content, anchor verification, patch status, exact draft identity, and export scope use the snapshot. |
| `src/server/capabilities.ts` → `buildReviewExportV3()` / publisher | ✓ WIRED | Exact `exportReview()` validates accepted draft/revision, reads `snapshot.exportScope()`, builds canonical V3 JSON and Markdown, and publishes atomically. |
| `src/web/api/client.ts` → `/api/patch-status` | ✓ WIRED | `getPatchStatus()` parses `PatchStatusResponseSchema`; selector drift remains range-only. |
| `src/web/App.vue` → terminal/error and frozen workspace UI | ✓ WIRED | Patch status selects persistent drift notice or terminal `ErrorState`; content retry remains the frozen endpoint only. |

### Data-flow check

`GroundedExactPatch` (object-proven preimages + target-verified postimages) → `PatchSnapshot` (owned manifest/content) → exact capability registry (session/files/anchors/draft/status/export scope) → authenticated API → parsed browser session/status/content. The export branch is now part of that same flow: accepted draft + `snapshot.exportScope()` → `buildReviewExportV3()` → canonical JSON/Markdown. No exact content-dependent branch reads current source as a content fallback.

## Focused Behavioral Evidence

| Behavior | Command / test evidence | Result |
| --- | --- | --- |
| Strict request, byte grounding, target match, metadata, and non-mutation | `npm exec -- vitest run tests/cli/request.test.ts tests/git/exact-patch.test.ts tests/api/exact-patch.test.ts tests/cli/selection.test.ts tests/unit/review-export.test.ts tests/unit/review-markdown.test.ts` | **6 files, 78 tests passed**. Includes exact `/api/export` success, V3 artifact parsing, drifted export, and snapshot-loss export blocking. |
| Exact terminal/retry/responsive/focus browser contract | `npm exec playwright test -- tests/integration/selector-drift-ui.spec.ts` | **6 tests passed**. Includes terminal loss, snapshot-only retry, exact scope behavior at 1440/1100/768/320px, modal focus trap/Escape return, and preimage/postimage rendering. |
| Full-suite evidence inspected | Coordinator-supplied final evidence: `npm run build` passed; full Vitest passed **51 files / 393 tests**; full Playwright passed **74/74** after `ab3ea40`. These project-wide checks were not rerun here, per verifier constraint; the focused commands above were rerun against current code. | No contradictory evidence. |

## Requirements Coverage

| Requirement | Status | Verified evidence |
| --- | --- | --- |
| PATCH-01 — exclusive already-applied patch review | ✓ SATISFIED | Strict request union, one grounding/launch branch, patch-only session/UI. |
| PATCH-02 — object-grounded preimages and target-byte-exact postimages | ✓ SATISFIED | Full object verification, in-memory reconstruction, and real-Git target `Buffer.equals()` evidence. |
| PATCH-03 — truthful Git-derived paths/state/mode/type/unsupported visibility | ✓ SATISFIED | Authoritative `ChangedFile` records are frozen in the manifest and projected through API/UI; no browser status/path inference. |
| PATCH-04 — no Git mutation | ✓ SATISFIED | Read-only grounding/drift observation; Cumpa-owned snapshot/draft/export storage; real-Git non-mutation test evidence. |
| PATCH-05 — frozen readable review/export with explicit drift | ✓ SATISFIED | Snapshot-only workspace, drift notice, functional V3 export after drift, and terminal loss blocking without live fallback. |

All PATCH-01 through PATCH-05 are owned by Phase 13 plans; none is orphaned or deferred.

## Previous Gaps Rechecked

1. **Snapshot-authoritative V3 export through drift — closed.** The former unconditional exact `exportReview()` throw is gone. The current registry builds/publishes V3 from frozen scope and its focused route test proves both unchanged and drifted success, while terminal snapshot loss blocks export.
2. **Terminal exact UI behavior — closed.** The current exact browser test drives `snapshotUnavailable` after rendering and verifies the focused blocking UI replaces the review shell without a retry or live substitute.
3. **Responsive/focus exact UI behavior — closed.** The current exact browser test drives all specified viewport regimes and the compact dialog focus loop/Escape return.

## Gaps

None. No blocker, warning, or behavior-unverified truth remains.

## Verification Complete

**Status: passed**

**Score: 12/12 must-haves verified**

**Remaining gap: none.**

---

_Verified: 2026-08-05T15:03:00Z_  
_Verifier: ExecutePhase13.Reverify13 (gsd-verifier)_
