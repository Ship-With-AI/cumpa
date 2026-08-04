---
phase: 12-request-protocol-range-grounding
plan: "05"
subsystem: export
tags: [typescript, zod, canonical-json, range-review, fastify]
requires:
  - phase: 12-request-protocol-range-grounding
    provides: pinned range session, draft provenance, and range review key
provides:
  - strict canonical ReviewExport V2 documents carrying frozen range provenance
  - server-derived range-key publication and recovery directories
  - V1-compatible interactive export behavior
 affects: [12-06-range-review-ui, exports, review-agents]
tech-stack:
  added: []
  patterns: [version-discriminated canonical export parsing, typed publication identity]
key-files:
  created: []
  modified:
    - src/contracts/draft.ts
    - src/contracts/api.ts
    - src/export/review-export.ts
    - src/export/render-review-markdown.ts
    - src/server/export-store.ts
    - src/server/capabilities.ts
    - tests/unit/review-export.test.ts
    - tests/api/export.test.ts
    - tests/api/export-publication.test.ts
key-decisions:
  - "V1 exports remain on their original schema and pair directory; range exports use strict V2 and review-key directories."
  - "Range export provenance is checked against both the accepted draft and frozen server comparison before serialization."
patterns-established:
  - "Range publication identity is a typed, exact server-derived identity, never a browser-provided path."
  - "Markdown displays range labels and pathspecs with control-safe fenced data while canonical JSON retains exact values."
requirements-completed: [RANGE-03]
duration: 20min
completed: 2026-08-04
status: complete
---

# Phase 12 Plan 05: Request Protocol Range Grounding Summary

**Canonical V2 feedback exports now preserve one frozen range scope and publish only under its server-derived review key while interactive V1 exports retain their existing representation.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-08-04T19:48:51Z
- **Completed:** 2026-08-04T20:08:59Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Added strict `ReviewExportV2Schema`, canonical parser dispatch, and range provenance validation against the accepted draft and pinned comparison.
- Rendered frozen range scope in Markdown using control-safe fenced display data without altering V1 output.
- Published and recovered V2 range exports exclusively from their review key, with exact typed identity validation and canonical JSON/Markdown revalidation.

## Task Commits

1. **Task 1: Add failing V2 range export contracts** - `c7c9d19` (`test`)
2. **Task 2: Implement V2 range export and review-key publication** - `b991788` (`feat`)
3. **Task 3: Refactor and rerun focused contracts** - no code change; the direct version-dispatch and typed-identity implementation was already non-duplicative.

## Verification

- RED: `npm exec -- vitest run tests/unit/review-export.test.ts tests/api/export.test.ts tests/api/export-publication.test.ts` failed with the intended missing V2 builder/schema and pair-directory behavior (3 new failures; 24 existing tests passed).
- GREEN and refactor verification: the same command passed with **3 files and 27 tests**.
- V1 export tests remained in the focused suite and passed unchanged; V2 tests prove ordered range scope validation, canonical parse/reparse, review-key publication, recovery, and malformed-key rejection.

## Files Created/Modified

- `src/contracts/draft.ts` - Defines strict V2 export contract and V1/V2 union.
- `src/contracts/api.ts` - Accepts validated review-key receipt paths alongside interactive pair paths.
- `src/export/review-export.ts` - Builds, validates, parses, and canonicalizes versioned exports.
- `src/export/render-review-markdown.ts` - Renders V2 frozen range scope safely.
- `src/server/export-store.ts` - Uses typed, exact publication identities and canonical candidate checks.
- `src/server/capabilities.ts` - Selects V1 or V2 exports from the frozen session range.
- `tests/unit/review-export.test.ts` - Covers V2 canonical scope and provenance mismatch behavior.
- `tests/api/export.test.ts` - Covers range export API publication.
- `tests/api/export-publication.test.ts` - Covers range-key publication and recovery.

## Decisions Made

- V1 remains the interactive export schema and pair directory convention; V2 is reserved for range review scope so existing interactive artifacts remain compatible.
- A V2 export must match the accepted draft's exact ordered pathspecs and all frozen range labels, OIDs, and review key before it can be serialized.
- Publication checks exact identity shape and valid OID/key syntax before constructing a managed path.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Extended receipt path validation for range-key directories**
- **Found during:** Task 2 (Implement V2 range export and review-key publication)
- **Issue:** `ExportReviewResultSchema` accepted only interactive `base..head` receipt paths, causing valid range-key publication to fail at the API boundary.
- **Fix:** Allowed either validated full-OID pair or 64-character review-key export directories while retaining same-directory receipt validation.
- **Files modified:** `src/contracts/api.ts`
- **Verification:** Focused export suite passes all 27 tests, including range API publication.
- **Committed in:** `b991788`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary API contract completion; no scope creep.

## Issues Encountered

- The initial range publication assertion expected a one-element tuple subset; the receipt intentionally has both JSON and Markdown entries, so the test now asserts both exact paths.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 12-06 can consume strict V2 range artifacts and stable review-key export locations for UI work.
- No blockers.

---
*Phase: 12-request-protocol-range-grounding*
*Completed: 2026-08-04*
