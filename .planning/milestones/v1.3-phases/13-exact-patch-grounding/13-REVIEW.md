---
phase: 13-exact-patch-grounding
reviewed: 2026-08-05T13:04:38Z
depth: deep
files_reviewed: 16
files_reviewed_list:
  - src/cli/run.ts
  - src/contracts/api.ts
  - src/git/exact-patch.ts
  - src/server/app.ts
  - src/server/capabilities.ts
  - src/server/export-store.ts
  - src/server/patch-snapshot.ts
  - src/server/routes.ts
  - src/web/App.vue
  - src/web/components/ErrorState.vue
  - src/web/components/ExportReceipt.vue
  - tests/api/exact-patch.test.ts
  - tests/git/exact-patch.test.ts
  - tests/integration/anchored-workspace.spec.ts
  - tests/integration/draft-recovery-ui.spec.ts
  - tests/integration/selector-drift-ui.spec.ts
findings:
  critical: 0
  warning: 1
  info: 0
  total: 1
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-08-05T13:04:38Z  
**Depth:** deep  
**Files Reviewed:** 16  
**Status:** issues_found — **0 unresolved blockers; 1 warning**

## Summary

Re-reviewed the previous five blockers against the remediated production paths and focused runtime evidence. None remains a blocker:

- **Exact export:** the exact-patch capability now builds and canonicalizes `ReviewExportV3`, renders Markdown from that canonical JSON, and publishes it under the frozen patch review key (`src/server/capabilities.ts:630-682`; `src/server/export-store.ts:133-149,218-302`). `tests/api/exact-patch.test.ts:216-285` exercises the real `/api/export` route before and after target drift, verifies a `201` V3 document, frozen inventory/provenance, and excludes the changed live bytes.
- **Production drift observer:** ordinary CLI patch launch reaches `createExactPatchSessionApp()` without browser-provided authority (`src/cli/run.ts:393-404,464-472`). The session factory materializes a snapshot whose default observer compares the server-owned frozen postimage, mode, and target-path presence (`src/server/app.ts:133-143`; `src/server/patch-snapshot.ts:392-435,489-505`). The production-style worktree test mutates bytes, modes, target presence, and renamed-old-path presence after app creation and observes a latched `drifted` status (`tests/api/exact-patch.test.ts:179-213`).
- **Delete/rename absence:** grounding rejects a present old path for deletions and distinct-path renames before accepting the selected target (`src/git/exact-patch.ts:591-600`). It is covered for both repository and worktree targets with source-control non-mutation assertions (`tests/git/exact-patch.test.ts:167-182`). The snapshot observer independently treats an old renamed path returning as drift (`src/server/patch-snapshot.ts:424-431`).
- **Malformed hunk framing:** `applyText()` now parses declared old/new counts, tracks consumption, rejects overflow, underflow, outside-hunk records, and mismatched offsets (`src/git/exact-patch.ts:362-428`). The focused real-Git test covers malformed old/new counts, truncated hunks, invalid start positions, and an outside record while proving no Git-state change (`tests/git/exact-patch.test.ts:143-165`).
- **Unsupported inventory acceptance:** unsupported binary, non-UTF-8, oversized, symlink, mode/type, and submodule entries remain inventory facts rather than causing a generic rejection (`src/git/exact-patch.ts:431-443,540-583`). The test uses real Git blobs/gitlinks and asserts exact unsupported reasons, IDs, and retained bounded content (`tests/git/exact-patch.test.ts:184-275`).
- **Anchored assertion:** the final responsive/anchored Playwright contract asserts the accepted viewport-local horizontal-scroll zone at 320px, all required reachable controls, no document scroll offset, no outer overflow, and no Monaco reflow through every phase viewport (`tests/integration/anchored-workspace.spec.ts:1169-1272`).

Focused verification run during this review:

- `npm exec -- vitest run tests/git/exact-patch.test.ts tests/api/exact-patch.test.ts` — **2 files, 15 tests passed**.
- `npm exec playwright test -- tests/integration/anchored-workspace.spec.ts --grep 'production Base Head labels'` — **1 Chromium test passed**; covers all eight specified viewport widths and the final anchored geometry assertion.

The recorded full-suite evidence in the assignment (Vitest 51 files/393 tests; Playwright 74/74) is consistent with these focused executions, but this review does not relabel it as newly run evidence.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: Patch-status polling can reject outside an error boundary

**File:** `src/web/App.vue:772-793`  
**Issue:** `refreshPatchStatus()` resets its in-flight flag in `finally` but does not catch a rejected `sessionClient.getPatchStatus()`. It is deliberately invoked with `void` at startup, on visibility changes, and by a 30-second timer. A transport failure, non-success status, or invalid status payload can therefore surface as an unhandled promise rejection and repeats on later polling. The exact-patch browser tests cover successful status transitions and terminal status, but do not exercise a failed `/api/patch-status` response.  
**Fix:** Catch the client error inside `refreshPatchStatus()`, retain the last authoritative status, and present the established retry/unavailable state without inferring drift or snapshot loss from a failed poll. Add one browser test that returns a failing patch-status response and asserts no unhandled rejection plus continued polling eligibility.

---

_Reviewed: 2026-08-05T13:04:38Z_  
_Reviewer: gsd-code-reviewer_  
_Depth: deep_
