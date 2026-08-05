---
phase: 13-exact-patch-grounding
plan: 03
subsystem: cli-export
tags: [cli, exact-patch, zod, canonical-json, markdown, vitest]
requires:
  - phase: 13-exact-patch-grounding
    provides: grounded exact patch requests and private immutable patch snapshots
provides:
  - direct strict patch request dispatch to the exact patch session app
  - ReviewExport V3 canonical frozen exact-patch provenance
  - deterministic exact-patch Markdown with preimage and postimage terminology
affects: [13-04, attached-lifecycle, canonical-completion]
tech-stack:
  added: []
  patterns: [direct source-specific app dispatch, strict versioned export parsing, fenced exact-patch provenance]
key-files:
  created: []
  modified: [src/cli/run.ts, src/contracts/draft.ts, src/export/review-export.ts, src/export/render-review-markdown.ts, tests/cli/selection.test.ts, tests/unit/review-export.test.ts, tests/unit/review-markdown.test.ts]
key-decisions:
  - "Patch launch directly creates GroundedExactPatch then createExactPatchSessionApp; it never enters range selection or the pinned-session factory."
  - "V3 preserves server-owned digest, validation target, review key, frozen status, and ChangedFile facts while retaining durable review feedback anchors."
patterns-established:
  - "Exact-patch exports model base/head anchor sides as preimage/postimage only in rendered Markdown."
requirements-completed: [PATCH-01, PATCH-03, PATCH-04, PATCH-05]
duration: 18min
completed: 2026-08-05
status: complete
---

# Phase 13 Plan 03: Exact Patch Grounding Summary

**Strict patch requests now ground once, hand the same authority directly to the immutable patch session app, and serialize frozen patch provenance through canonical V3 JSON and deterministic Markdown.**

## Performance

- **Duration:** 18min
- **Started:** 2026-08-05T09:51:29Z
- **Completed:** 2026-08-05T12:10:10Z
- **Tasks:** 3/3
- **Files modified:** 7 application and focused-test files

## Accomplishments

- Added an exclusive ordinary CLI patch branch that calls `createGroundedExactPatch` exactly once, passes that result unchanged to `createExactPatchSessionApp`, waits for loopback readiness, and only then opens the browser.
- Bounded grounding and snapshot preparation failures to a generic terminal diagnostic, with no submitted patch content emitted.
- Added strict `ReviewExportV3Schema`, `ReviewExportV3`, `buildReviewExportV3`, V1/V2/V3 canonical parsing, and exact-patch Markdown sections for digest, validation target, review key, frozen status, raw file facts, and preimage/postimage anchor wording.

## TDD Evidence

- **RED:** `npm exec -- vitest run tests/cli/selection.test.ts tests/unit/review-export.test.ts tests/unit/review-markdown.test.ts` exited nonzero because patch mode entered range resolution and V3 builder/renderer exports were absent. Existing interactive/range and V1/V2 cases remained green.
- **GREEN:** the identical command passed: 3 files, 27 tests.
- **REFACTOR:** the identical command passed: 3 files, 27 tests. The provenance mismatch assertion was retained at the builder boundary, which is the only boundary that receives both accepted draft and server-owned scope.

## Dispatch and Export Contract

- `runOrdinaryAction()` discriminates `mode: "patch"` before any range selector or comparison construction. It supplies the validated `cwd`, submitted patch content, target, and cancellation signal to `createGroundedExactPatch`, then supplies that exact `GroundedExactPatch` to `createExactPatchSessionApp`.
- `ReviewExportV3Schema` accepts only full lowercase digest, literal validation target, review key, frozen `unchanged`/`drifted` snapshot status, and the server-originated `ChangedFile` list. V1 and V2 retain their previous strict parsers.
- `buildReviewExportV3()` rejects a digest, target, or review-key mismatch with the accepted exact-patch draft. Markdown is derived only from canonical bytes, fences hostile review/path text, and renders anchor sides as preimage/postimage without changing canonical durable anchors.

## Task Commits

1. **Task 1: RED — specify direct dispatch and canonical frozen export** — `aa2a75f` (`test`)
2. **Task 2: GREEN — dispatch the grounded patch and render frozen exports** — `d30466e` (`feat`)
3. **Task 3: REFACTOR — preserve one dispatch and one export authority** — `be46069` (`refactor`)

## Files Created/Modified

- `src/cli/run.ts` — strict direct exact-patch launch path and safe preparation diagnostics.
- `src/contracts/draft.ts` — strict V3 exact-patch export contract and union type.
- `src/export/review-export.ts` — canonical V3 builder and version-aware parser.
- `src/export/render-review-markdown.ts` — frozen provenance/file rendering and preimage/postimage terminology.
- `tests/cli/selection.test.ts` — direct handoff ordering, non-range dispatch, and safe failure evidence.
- `tests/unit/review-export.test.ts` — V3 canonical identity and mismatch rejection evidence.
- `tests/unit/review-markdown.test.ts` — exact-patch Markdown identity and terminology evidence.

## Decisions Made

- Kept the patch branch source-specific instead of abstracting it behind a generic app factory, preventing any fallback from grounded snapshot authority to range/live selection.
- Reused strict `ChangedFileSchema` for frozen patch file facts rather than duplicating path, status, mode, and availability validation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Assert provenance disagreement at the builder boundary**
- **Found during:** Task 3 (REFACTOR)
- **Issue:** a standalone V3 schema cannot determine whether a supplied digest belongs to an accepted draft; the initial assertion accidentally used an invalid-length digest.
- **Fix:** moved the mismatch assertion to `buildReviewExportV3`, where accepted draft and frozen provenance are both available.
- **Files modified:** `tests/unit/review-export.test.ts`
- **Verification:** focused REFACTOR command passed all 27 tests.
- **Committed in:** `be46069`

---

**Total deviations:** 1 auto-fixed (1 Rule 1 test-contract bug).
**Impact on plan:** The correction strengthens the required no-browser-authority proof without changing application behavior or export shape.

## Issues Encountered

- The initial RED test contained an arrow-function parse typo; it was corrected before recording RED evidence. The recorded RED failure was only missing direct patch dispatch and V3 behavior.

## Known Stubs

None. The focused source/test scan found no placeholder behavior in files changed by this plan.

## Next Phase Readiness

- Phase 13-04 can present the already-canonical exact patch digest, frozen status, file facts, and preimage/postimage terminology in the authenticated workspace.
- No authentication, package install, or manual setup is required.

## Self-Check: PASSED

- `src/cli/run.ts`, `src/contracts/draft.ts`, `src/export/review-export.ts`, `src/export/render-review-markdown.ts`, and this summary exist.
- TDD commits `aa2a75f`, `d30466e`, and `be46069` exist in history.
- Focused RED, GREEN, and REFACTOR commands were run; GREEN and REFACTOR passed 27 tests.
