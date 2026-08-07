---
phase: 13-exact-patch-grounding
plan: 01
subsystem: git-validation
tags: [zod, git, patch, immutable-bytes, vitest]
requires:
  - phase: 12-request-protocol-range-grounding
    provides: strict versioned request boundary and bounded native-Git seams
provides:
  - strict exclusive exact-patch request schema
  - read-only exact-patch preimage/postimage grounding with SHA-256 provenance
  - source-control snapshots that include object inventory evidence
affects: [13-02, patch-snapshot, patch-session]
tech-stack:
  added: []
  patterns: [strict source discriminated union, in-memory unified/binary patch reconstruction, immutable owned patch bytes]
key-files:
  created: [src/git/exact-patch.ts, tests/git/exact-patch.test.ts]
  modified: [src/contracts/request.ts, src/contracts/comparison.ts, tests/cli/request.test.ts, tests/helpers/source-control-snapshot.ts]
key-decisions:
  - "Patch input has one strict mode discriminator and server-owned repository/worktree target literals."
  - "Grounding reconstructs bytes in memory and cumpas them to the selected target without Git apply or writes."
patterns-established:
  - "Patch provenance is one lowercase SHA-256 digest over accepted UTF-8 bytes."
requirements-completed: [PATCH-01, PATCH-02, PATCH-03, PATCH-04]
duration: 18min
completed: 2026-08-05
status: complete
---

# Phase 13 Plan 01: Exact Patch Grounding Summary

**Strict exact-patch input is reconstructed from repository blob preimages and accepted only when its owned postimage bytes match the selected target.**

## Performance

- **Duration:** 18min
- **Started:** 2026-08-05T08:58:45Z
- **Completed:** 2026-08-05T09:16:11Z
- **Tasks:** 3/3
- **Files modified:** 7 production/test artifacts plus this tracking artifact

## Accomplishments

- Added mutually exclusive `mode: "patch"` request validation with bounded valid-Unicode content and target literals only.
- Added `GroundedExactPatch`, exact-patch scope contracts, a SHA-256 digest, full object preimage reads, in-memory hunk/binary reconstruction, and byte-exact repository/worktree validation.
- Extended source-control snapshots with object-count and object-inventory evidence; focused acceptance and target-drift rejection preserve repository state.

## TDD Evidence

- **RED:** `npm exec -- vitest run tests/cli/request.test.ts tests/git/exact-patch.test.ts` exited nonzero because the patch request export and exact grounder did not exist; existing revision cases remained green after the import repair.
- **GREEN:** the same command passed: 2 files, 38 tests.
- **REFACTOR:** the same command passed: 2 files, 38 tests. The one-use zero-OID helper was inlined; no parser framework, overlay, cache, or dependency was added.

## Accepted Interface and Command Boundary

- `AgentReviewRequestSchema` is a strict `mode` union. Patch requests own only `patch.content` and `patch.target: { kind: "repository" | "worktree" }`.
- `createGroundedExactPatch({ cwd, patchContent, target, signal? })` returns frozen scope/inventory DTOs and copied preimage/postimage `Buffer` values keyed by opaque file ID.
- The validator uses existing bounded runner/discovery/object-reader seams and only read-oriented repository/object/tree operations. It does not invoke `git apply`, index updates, checkouts, refs updates, or object writes.
- Before/after snapshots cumpa tracked and untracked bytes/modes, index bytes/checksum, HEAD/ref/remotes, staged/unstaged deltas, and loose/packed object count and object inventory.

## Task Commits

1. **Task 1: RED — specify exclusive request, exact bytes, metadata, and non-mutation** — `ad2ed21` (`test`)
2. **Task 2: GREEN — implement strict in-memory patch grounding** — `92dbd23` (`feat`)
3. **Task 3: REFACTOR — freeze one minimal validation authority** — `5fcd507` (`refactor`)

## Files Created/Modified

- `src/contracts/request.ts` — strict patch request variant and byte-bound validation.
- `src/contracts/comparison.ts` — exact-patch scope, target, and grounded result contracts.
- `src/git/exact-patch.ts` — bounded parser, object preimage proof, reconstruction, digest, and target validation.
- `src/cli/request.ts` — freezes the selected strict union branch safely. 
- `tests/cli/request.test.ts` — request exclusivity and exact accepted byte coverage.
- `tests/git/exact-patch.test.ts` — real-Git successful grounding and one-byte target-drift rejection.
- `tests/helpers/source-control-snapshot.ts` — object-store inventory/count non-mutation proof.

## Decisions Made

- Reused the existing native Git runner and object reader instead of adding a Git or patch dependency.
- Kept patch-specific reconstruction private to one module; shared contracts retain `ChangedFile` as the inventory authority.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced missing object-reader test reference with the available object-reader availability fixture**
- **Found during:** Task 1
- **Issue:** `tests/git/objects.test.ts` named by the plan does not exist in the checkout.
- **Fix:** Used `tests/git/availability.test.ts`, which exercises `createObjectReader()` with the existing real-Git fixture pattern.
- **Files modified:** None
- **Verification:** Focused RED test reached only missing patch exports/behavior.
- **Committed in:** `ad2ed21`

**2. [Rule 1 - Bug] Froze the active request-union branch**
- **Found during:** Task 2
- **Issue:** the existing request freezer unconditionally read `revisions.pathspecs`, crashing valid patch requests.
- **Fix:** froze revision or patch nested values after discriminating `mode`; updated bounded generic request error copy.
- **Files modified:** `src/cli/request.ts`, `tests/cli/request.test.ts`
- **Verification:** focused GREEN command passed 38 tests.
- **Committed in:** `92dbd23`

**3. [Rule 1 - Bug] Corrected target-drift fixture ordering**
- **Found during:** Task 2
- **Issue:** mutating patch text invalidated its declared postimage OID before target comparison.
- **Fix:** kept submitted patch bytes intact and moved the repository target after fixture construction.
- **Files modified:** `tests/git/exact-patch.test.ts`
- **Verification:** rejection now reaches the bounded target-mismatch error and the snapshot remains unchanged.
- **Committed in:** `92dbd23`

**Total deviations:** 3 auto-fixed (2 Rule 1, 1 Rule 3).
**Impact on plan:** Each change was required for the strict union or observable target-grounding contract; no new dependency or alternate authority was added.

## Issues Encountered

- The initial RED test edit briefly had a malformed import; it was repaired before the recorded RED evidence. The recorded RED failure was only missing exact-patch behavior.

## Known Stubs

None. The stub scan found only ordinary empty collections and test fixtures, not placeholder behavior.

## Next Phase Readiness

- Phase 13-02 can materialize its private patch snapshot from `GroundedExactPatch` without a live target fallback.
- No authentication or user setup is required.

## Self-Check: PASSED

- `src/git/exact-patch.ts`, `tests/git/exact-patch.test.ts`, and this summary exist.
- TDD commits `ad2ed21`, `92dbd23`, and `5fcd507` exist in history.
