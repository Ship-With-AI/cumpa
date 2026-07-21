---
phase: 02-anchored-diff-review
plan: 03
subsystem: atomic-draft-persistence
tags: [fastify, zod, sha256, filesystem, atomic-write, vitest, tdd]
requires:
  - phase: 02-anchored-diff-review
    provides: authenticated opaque file capabilities and server-derived durable anchors
provides:
  - Ordered full selected-base/full-selected-head SHA-256 draft identity
  - Strict versioned repository-local draft documents with serialized mutation
  - Atomic temp-sync-rename persistence and exact draft anchor presentation states
affects: [02-05-review-workspace, 02-06-comment-ui, 02-07-browser-flow, phase-03-reconciliation]
tech-stack:
  added: []
  patterns:
    - Server-owned comparison/repository state is wired internally and never added to browser DTOs.
    - Draft mutations validate the full next document before a same-directory synced temp replacement.
key-files:
  created:
    - src/domain/comparison-key.ts
    - src/server/draft-store.ts
    - tests/unit/comparison-key.test.ts
    - tests/api/draft.test.ts
    - tests/api/draft-atomicity.test.ts
  modified:
    - src/contracts/draft.ts
    - src/server/routes.ts
    - src/server/app.ts
    - src/server/capabilities.ts
key-decisions:
  - "Key drafts only from length-framed ordered full selected endpoint OIDs; labels, refs, merge bases, paths, and short IDs do not select a draft."
  - "Return accepted comments only after the serialized store crosses its atomic persistence boundary; retain generic route failures and do not expose filesystem detail."
  - "Permit known unsupported directory fsync results after rename, while treating any other directory-sync failure as a failed acceptance."
patterns-established:
  - "ReviewDraftV1: strict versioned canonical JSON with immutable open comments and internally incremented revision."
  - "Atomic draft store: load/validate → pure next document → restrictive unique sibling temp → sync/close → rename → directory sync."
requirements-completed: [CMT-01, CMT-02, CMT-08, DRFT-01, DRFT-02, DRFT-03]
duration: 14min
completed: 2026-07-21
status: complete
---

# Phase 02 Plan 03: Atomic comparison-local comment drafts Summary

**Pinned comparisons now retain strict, side-specific durable comments in isolated repository-local drafts only after an atomic persisted replacement succeeds.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-07-21T11:44:00Z [INFERENCE]
- **Completed:** 2026-07-21T11:58:06Z
- **Tasks:** 3/3
- **Files modified:** 9 implementation/test files, including the Rule 3 internal-wiring deviation

## Accomplishments

- Added ordered selected-base/selected-head comparison keys using domain-separated SHA-256 and unsigned-64-bit length framing.
- Added strict `ReviewDraftV1` persistence, same-pair resume, changed-endpoint isolation, exact duplicate conflicts, and verified/stale/orphaned presentation states.
- Added serialized, fault-injected atomic persistence coverage for mkdir, exclusive temp open, write, sync, close, rename, and directory sync; concurrent distinct adds retain both comments.

## Task Commits

| Task | RED / GREEN / REFACTOR evidence | Commit |
| --- | --- | --- |
| 1. RED — specify comparison isolation, resume, duplicate, and atomic failure semantics | Focused comparison-key test failed because its domain module did not exist; API test failed with missing draft GET, unaccepted POST, and no persistence boundary. | `d762ee7` |
| 2. GREEN — persist one canonical draft per pinned comparison atomically | Implemented canonical schemas, comparison key, strict store, routes, and internal server-only wiring. Both focused commands passed. | `e66bccd` |
| 3. REFACTOR — isolate validated documents from filesystem commit mechanics | Extracted pure next-document construction from the serialized atomic commit path; focused commands remained green. | `da88c80` |
| Coverage completion | Added exact stale/orphan presentation proof without relocation. | `4873e4d` |

## Files Created/Modified

- `src/domain/comparison-key.ts` — domain-separated length-framed ordered comparison key.
- `src/contracts/draft.ts` — strict canonical `ReviewDraftV1` and open comment schemas.
- `src/server/draft-store.ts` — strict load, per-comparison serialization, atomic replacement, and fault-injection port.
- `src/server/routes.ts` — closed draft GET/add API, duplicate conflict, and success-after-persistence behavior.
- `src/server/app.ts`, `src/server/capabilities.ts` — minimal server-only pinned comparison/repository-root store wiring and anchor verification; no browser DTO expansion.
- `tests/unit/comparison-key.test.ts` — SHA-1/SHA-256 vector, ordering, and endpoint-isolation contract.
- `tests/api/draft.test.ts` — resume, isolation, accepted canonical records, authorization, malformed-data preservation, and exact stale/orphan view contract.
- `tests/api/draft-atomicity.test.ts` — canonical-byte failure matrix and concurrent distinct mutation contract.

## Comparison-Key Vectors

- Identical opaque 40- or 64-hex selected endpoint pairs produce a stable lowercase 64-hex key.
- Swapping the pair, changing selected base, or changing selected head produces a different key.
- Labels, refs, paths, merge base, and short IDs do not enter the key input.

## Canonical Schema

`ReviewDraftV1` is a strict object with `schemaVersion: 1`, full selected base/head/merge-base identities, nonnegative internal `revision`, immutable empty `summary`, and bounded open comments. Each comment carries a generated ID, body, exact `DurableAnchorV1`, and ISO creation/update timestamps. Phase 2 exposes no edit, delete, resolve, summary-mutation, or client revision-conflict route.

## Atomic Fault Matrix

| Injected boundary | Result |
| --- | --- |
| mkdir, exclusive temp open, write, file sync, close, rename | Add rejects; prior canonical bytes remain identical. |
| directory sync | Add rejects after rename; canonical bytes remain complete validated JSON with the new record rather than a partial/truncated file. |
| simultaneous distinct adds | Both serialized additions survive at revision 2. |
| malformed existing canonical bytes | Load/mutation safely refuses and preserves the original bytes. |

## Security and API Evidence

- Browser requests use only `fileId`, `side`, `line`, and body; strict request validation rejects comparison, draft key, repository, path, blob, anchor, and revision authority fields.
- Inherited session security rejects unauthenticated draft access before capability lookup.
- The draft root and hex filename are computed exclusively from server-owned pinned comparison state; generic failures do not reveal root, canonical path, temp name, document contents, or tokens.
- `GET /api/draft` returns canonical draft data plus non-persisted verified, stale, or orphaned presentation state without relocating or rewriting an anchor.

## Verification Evidence

| Stage | Command | Result |
| --- | --- | --- |
| RED | `npm run test:unit -- tests/unit/comparison-key.test.ts` | Nonzero: `comparison-key` module absent. |
| RED | `npm run test:api -- tests/api/draft.test.ts tests/api/draft-atomicity.test.ts` | Nonzero: missing draft store/key modules plus observable GET/POST contract failures. |
| GREEN | `npm run test:unit -- tests/unit/comparison-key.test.ts` | PASS: 7 files, 53 tests. |
| GREEN | `npm run test:api -- tests/api/draft.test.ts tests/api/draft-atomicity.test.ts` | PASS: 5 files, 45 tests. |
| REFACTOR/final | Same two focused commands | PASS: 7 unit files/53 tests and 5 API files/46 tests. |

No formatter, linter, full suite, browser test, or project-wide command was run. The configured API script runs its `tests/api` root in addition to supplied focused paths; only API tests executed.

## Decisions Made

- Server-only capability wiring owns repository root and pinned comparison facts so the route cannot accept browser-controlled draft selection.
- Directory sync is attempted after rename and unsupported platform errors are tolerated only because the canonical file was already atomically replaced; other errors reject the API acceptance.
- A trailing terminal newline does not create a commentable phantom line, preserving the existing anchor route contract.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added minimum internal draft-store wiring through app and capabilities**
- **Found during:** Task 2 (GREEN)
- **Issue:** The plan-declared `routes.ts` receives only `CapabilityRegistry`; it had neither repository root nor pinned comparison identities needed to construct the fixed-root, comparison-local store. Deriving a root from browser data or process cwd would violate the trust boundary.
- **Fix:** Added the minimum `src/server/app.ts` and `src/server/capabilities.ts` internal-only wiring for a server-created store and anchor verifier. Browser session DTOs remain unchanged.
- **Files modified:** `src/server/app.ts`, `src/server/capabilities.ts`
- **Verification:** Focused API contract passed, including same-pair resume and changed-endpoint isolation.
- **Committed in:** `e66bccd`

**2. [Rule 1 - Test correctness] Corrected temporary test fixtures to match exact-path and canonical-filename contracts**
- **Found during:** Task 2 (GREEN)
- **Issue:** RED fixtures initially included a non-schema `encoding` field and wrote malformed JSON under a noncanonical filename, so they failed before exercising the intended store contract.
- **Fix:** Used valid lossless path DTOs and the computed canonical key filename.
- **Files modified:** `tests/api/draft.test.ts`, `tests/api/draft-atomicity.test.ts`
- **Verification:** Focused API tests pass and exercise malformed canonical data plus all fault boundaries.
- **Committed in:** `e66bccd`

---

**Total deviations:** 2 auto-fixed (1 blocking internal wiring, 1 test correctness).
**Impact on plan:** Both changes were necessary to satisfy the declared filesystem trust boundary and make RED/GREEN evidence behavioral; no browser contract or later-phase feature was added.

## Issues Encountered

None remaining.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 02-05 through 02-07 can consume canonical persisted comments and presentation verification states through the closed draft routes.
- Phase 3 may add recovery UI, lifecycle mutations, summary mutation, and client conflict behavior without changing the v1 document identity or atomic replacement boundary.

## Self-Check: PASSED

- Created `src/domain/comparison-key.ts`, `src/server/draft-store.ts`, and all three declared focused test files exist.
- RED commit `d762ee7` precedes GREEN commit `e66bccd`; refactor commit `da88c80` follows GREEN.
- Final focused commands passed: comparison-key unit contract (53 tests) and draft API contract (46 tests).
- No known stubs or unplanned browser-facing trust-boundary surface were introduced.

---
*Phase: 02-anchored-diff-review*
*Completed: 2026-07-21*
