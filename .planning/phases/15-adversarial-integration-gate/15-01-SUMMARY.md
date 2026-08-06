---
phase: 15-adversarial-integration-gate
plan: "01"
subsystem: testing
tags: [attached-review, storage-isolation, exports, chromium]
requires:
  - phase: 14-attached-lifecycle-canonical-completion
    provides: server-authoritative attached completion lifecycle
provides:
  - Trusted per-invocation attached storage scope separate from canonical source provenance
  - API, CLI, and packaged Chromium evidence for equivalent attached range isolation
affects: [HAND-06, attached-review, export-publication]
tech-stack:
  added: []
  patterns: [dual source-provenance and invocation-storage identity]
key-files:
  created: []
  modified: [src/cli/run.ts, src/server/draft-loader.ts, src/server/export-store.ts, tests/e2e/agent-ready-export.spec.ts]
key-decisions:
  - "Attached storage uses CLI-created agent-<32 lowercase hex> scope while deterministic range and patch review keys remain canonical provenance."
patterns-established:
  - "Use one attached scope for draft filename, draft queue, export publication, and reveal path."
requirements-completed: [HAND-06]
duration: 18min
completed: 2026-08-06
status: complete
---

# Phase 15: Adversarial Integration Gate Summary

**Attached invocations now retain deterministic canonical provenance while owning isolated mutable draft and export storage.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-08-06T10:32:43Z
- **Completed:** 2026-08-06T10:50:58Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments

- Allocated one trusted `agent-<32 hex>` storage scope per attached CLI launch and threaded it through range and exact-patch draft/export ownership.
- Preserved deterministic range and patch review keys in drafts, canonical V2/V3 output, and publication identity validation.
- Proved focused API/CLI isolation and packaged Chromium equivalent-range behavior with independent draft files and complete one-document stdout delivery.

## Task Commits

1. **Task 1: TDD the trusted attached storage seam without changing source provenance** - `edb178e` (feat)
2. **Task 2: Prove cross-session lifecycle, interactive coexistence, and one-shot delivery isolation** - `3506bb9` (test)
3. **Task 3: Prove equivalent range and exact-patch isolation through the packaged Chromium path** - `7efaf77` (test)

## Files Created/Modified

- `src/cli/run.ts` - Allocates the sole attached storage scope.
- `src/server/app.ts`, `src/server/capabilities.ts` - Pass the scope to draft and export operations.
- `src/server/draft-loader.ts`, `src/server/draft-store.ts` - Use the scope for canonical draft paths and queue ownership.
- `src/server/export-store.ts`, `src/contracts/api.ts` - Publish and validate scoped export receipt paths without changing provenance.
- `tests/api/*.test.ts`, `tests/cli/request.test.ts` - Verify scope and coordinator isolation.
- `tests/e2e/agent-ready-export.spec.ts` - Exercises two equivalent packaged attached children in Chromium.

## Decisions Made

- Mutable attached ownership is separate from source provenance; interactive storage remains unchanged.
- Invalid attached scope values fail before filesystem path construction.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Permit attached receipt directories in the existing response schema**
- **Found during:** Task 1
- **Issue:** Valid scoped export receipts were rejected by the response schema's legacy-only path expression.
- **Fix:** Added the structural `agent-<32 lowercase hex>` directory grammar while retaining legacy interactive/range patterns.
- **Files modified:** `src/contracts/api.ts`
- **Verification:** Focused API suite passed.
- **Committed in:** `edb178e`

---

**Total deviations:** 1 auto-fixed (missing critical). **Impact:** Required to expose the planned scoped receipt path; no protocol or provenance fields changed.

## Issues Encountered

- The first packaged parallel-session scenario needed both review panels explicitly opened before saving independent summaries; the corrected packaged gate passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- HAND-06 implementation and planned evidence are ready for phase-level verification and configured review gates.

---
*Phase: 15-adversarial-integration-gate*
*Completed: 2026-08-06*
