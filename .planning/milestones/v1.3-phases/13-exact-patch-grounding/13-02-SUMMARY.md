---
phase: 13-exact-patch-grounding
plan: 02
subsystem: api
tags: [fastify, zod, vitest, snapshot, draft, drift]
requires:
  - phase: 13-exact-patch-grounding
    provides: strict grounded exact-patch bytes and immutable inventory
provides:
  - private atomic PatchSnapshot lifecycle
  - snapshot-only exact-patch session capabilities and patch status route
  - server-derived exact-patch draft identity
  - latched source drift and terminal snapshot-unavailable state
affects: [13-03, 13-04, exact-patch-ui, exports]
tech-stack:
  added: []
  patterns: [session-owned snapshot authority, exact patch review key, dedicated patch status]
key-files:
  created: [src/server/patch-snapshot.ts, tests/api/exact-patch.test.ts]
  modified: [src/contracts/api.ts, src/contracts/draft.ts, src/server/app.ts, src/server/capabilities.ts, src/server/routes.ts, src/server/draft-loader.ts, src/server/draft-store.ts]
key-decisions:
  - "Exact patch snapshots are materialized before Fastify composition and owned by that app's close hook."
  - "Patch routes use a dedicated capability branch and never register selector drift."
patterns-established:
  - "Exact patch draft namespaces use a private length-framed digest/target/repository key."
requirements-completed: [PATCH-01, PATCH-03, PATCH-04, PATCH-05]
duration: 141min
completed: 2026-08-05
status: complete
---

# Phase 13 Plan 02: Exact Patch Grounding Summary

**Exact-patch sessions now own an atomically materialized snapshot, serving frozen bytes and feedback while exposing latched drift or terminal snapshot loss without a live-content fallback.**

## Performance

- **Duration:** 141 min
- **Started:** 2026-08-05T09:24:28Z
- **Completed:** 2026-08-05T11:45:47Z
- **Tasks:** 3/3
- **Files modified:** 10 production/test artifacts plus this tracking artifact

## Accomplishments

- Created an owner-only staged and atomically renamed `PatchSnapshot` that verifies its manifest, files, byte lengths, and SHA-256 digests on every frozen-content read, cleans up idempotently, and bounds snapshot size.
- Added an async `createExactPatchSessionApp` composition path with a close-owned snapshot disposer, distinct strict patch session DTO, snapshot-backed capability registry, and authenticated `GET /api/patch-status`.
- Extended draft comparison persistence with a strict exact-patch union member keyed only from server-held digest, validation target, and a private length-framed review key.

## TDD Evidence

- **RED:** `npm exec -- vitest run tests/api/exact-patch.test.ts tests/api/session.test.ts tests/api/draft.test.ts` exited 1 because `createExactPatchSessionApp` did not exist (3 exact-patch failures); existing session and draft suites passed.
- **GREEN:** the identical command passed: 3 files, 35 tests.
- **REFACTOR:** the identical command passed: 3 files, 36 tests, including terminal snapshot loss. The direct snapshot/capability boundary already had one authority path, so no speculative provider abstraction was added.

## Snapshot, API, and Draft Contract

- `materializePatchSnapshot()` copies accepted content to opaque `fileId.preimage`/`fileId.postimage` files under a generated owner-only root, writes a versioned provenance-digested manifest through a staging child, then atomically renames it.
- `PatchSnapshot` owns the digest, target, review key, file mapping, status latch, and disposer. Frozen reads return new buffers after manifest, ownership, size, and hash checks; lost or corrupt storage latches `snapshotUnavailable` and transient non-integrity reads are classified retryable.
- Exact sessions expose only `{ patch, files }`; patch provenance contains the authoritative full digest, private review key, target, and inventory count. Existing pinned session shapes remain a separate union member.
- `PatchStatusResponseSchema` is the sole patch-status wire contract: `unchanged`, latched `drifted`, or terminal `snapshotUnavailable`. `/api/selector-drift` remains range-only.
- Exact draft comparison is the strict `{ kind: "exact-patch", digest, validationTarget, reviewKey }` member. Request schemas do not accept any of these authority values.

## Threat and No-Fallback Proof

- Owner-only generated roots, opaque fixed side filenames, staged fsync/rename, manifest/content verification, bounded accounting, and idempotent root disposal implement T-13-02-01/02/06.
- Existing bearer/Host/Origin gates protect opaque capabilities; focused coverage rejects unauthenticated and unknown-file access (T-13-02-03).
- The patch review key frames the server digest, target kind, and validated repository identity with SHA-256, avoiding display-path or browser-selected draft identity (T-13-02-04).
- Focused drift coverage proves a latched `drifted` response while frozen content and draft feedback remain usable; snapshot removal returns `snapshotUnavailable` and frozen content is blocked rather than rebuilt (T-13-02-05/07).
- The exact capability branch reads only `PatchSnapshot`; it neither constructs an `ObjectReader` nor invokes a worktree/content fallback.

## Task Commits

1. **Task 1: RED — specify ownership, frozen routes, drafts, drift, and no fallback** — `f2ef662` (`test`)
2. **Task 2: GREEN — materialize and serve one authenticated frozen snapshot** — `6c8ef89` (`feat`)
3. **Task 3: REFACTOR — keep snapshot lifetime and authority single-path** — `eece562` (`refactor`)
4. **Metadata ownership correction** — `02f2dd6` (`fix`)

## Files Created/Modified

- `src/server/patch-snapshot.ts` — private atomic snapshot creation, integrity reads, status latch, and cleanup.
- `src/server/app.ts` — async exact-patch app composition and close-hook ownership.
- `src/server/capabilities.ts` — dedicated snapshot-only patch capability branch and draft identity.
- `src/server/routes.ts` — strict authenticated patch-status registration while retaining range selector drift.
- `src/contracts/api.ts` — exact-patch session and patch-status schemas.
- `src/contracts/draft.ts`, `src/server/draft-loader.ts`, `src/server/draft-store.ts` — exact provenance draft serialization, matching, and namespacing.
- `tests/api/exact-patch.test.ts` — immutable content, session DTO, drift, terminal loss, draft mutation, and authentication coverage.

## Decisions Made

- Kept patch content authority explicit and separate from `ObjectReader`-backed pinned comparisons rather than introducing a generic provider that could fall through to live data.
- Used Node filesystem and crypto primitives already in the runtime; no dependency, database, or mutable process-global snapshot registry was added.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Detached accepted metadata from grounded caller objects**
- **Found during:** Task 3 (REFACTOR)
- **Issue:** a shallow file-record copy could retain nested metadata references from the accepted grounding input.
- **Fix:** cloned each accepted file record before recording manifest-side metadata.
- **Files modified:** `src/server/patch-snapshot.ts`
- **Verification:** the focused API command passed 36 tests.
- **Committed in:** `02f2dd6`

---

**Total deviations:** 1 auto-fixed (1 Rule 1 bug).
**Impact on plan:** Required to preserve immutable session metadata; no scope expansion or new authority was introduced.

## Issues Encountered

- The RED fixture initially used a deliberately non-existent repository root, which prevented the production draft store from persisting feedback. The fixture now uses a generated local root while retaining the no-wire-leak assertions.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 13-03 can compose its grounded input through `createExactPatchSessionApp` and consume the strict patch session, draft comparison, and status contracts.
- Exact export composition remains intentionally owned by Plan 13-03; no patch route falls back to repository content.

## Self-Check: PASSED

- `src/server/patch-snapshot.ts`, `tests/api/exact-patch.test.ts`, and this summary exist.
- TDD commits `f2ef662`, `6c8ef89`, `eece562`, and correction `02f2dd6` exist.
- `npm exec -- vitest run tests/api/exact-patch.test.ts tests/api/session.test.ts tests/api/draft.test.ts` passed: 3 files, 36 tests.
