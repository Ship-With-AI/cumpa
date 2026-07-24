---
phase: 01-pinned-local-comparison
plan: 07
subsystem: git-availability
status: complete
tags: [git, cat-file, availability, utf8, zod, vitest]
requires:
  - phase: 01-pinned-local-comparison
    plan: 06
    provides: Frozen raw-diff blob IDs, modes, status, binary numstat markers, and strict changed-file inventory
provides:
  - Bounded immutable Git object metadata and content reads over NUL machine protocols
  - Ordered per-entry text, unsupported, and unavailable classification with a strict reason vocabulary
  - Exact 1 MiB per-side eligibility with metadata-before-content allocation
  - Real-Git proof that refs, worktree bytes, conversions, symlink targets, and vanished objects never broaden authority
affects:
  - 01-08
  - 01-09
  - 01-10
  - 01-12
  - Phase 2 immutable blob content
tech-stack:
  added: []
  patterns:
    - Full raw object IDs travel only through cat-file --batch-command -Z standard input
    - Every regular blob side is typed and sized before any bounded content read
    - Unsupported and unavailable facts remain frozen inventory data rather than exceptional or omitted rows
key-files:
  created:
    - src/git/objects.ts
    - src/git/availability.ts
    - tests/unit/availability.test.ts
    - tests/git/availability.test.ts
  modified:
    - src/git/runner.ts
    - src/git/inventory.ts
    - src/contracts/comparison.ts
    - tests/git/inventory.test.ts
key-decisions:
  - Use NUL-framed cat-file info and contents commands whose only object authority is a validated full lowercase object ID.
  - Classify gitlinks, symlinks, and unsupported modes without content access; inspect every regular side before any content read.
  - Replace the legacy free-form unsupportedReason with one strict text, unsupported, or unavailable discriminated union.
patterns-established:
  - ObjectReader: bounded typed metadata/content results hide cat-file framing and preserve cancellation.
  - Availability: immutable shared results use the exact UI reason vocabulary and one reason per changed entry.
requirements-completed: [CMP-09]
duration: 21min
completed: 2026-07-20
---

# Phase 01 Plan 07: Immutable Object Availability Summary

**Frozen raw-diff object IDs now produce one precise, strict availability result per inventory entry through bounded NUL-framed Git object reads, with exact 1 MiB and no-fallback guarantees.**

## Performance

- **Duration:** 21 min
- **Started:** 2026-07-20T13:24:26Z
- **Completed:** 2026-07-20T13:44:59Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added `createObjectReader`, which validates full SHA-1/SHA-256 IDs and uses only `git cat-file --batch-command -Z` `info` and `contents` commands with bounded stdout, bounded diagnostics inherited from the runner, and existing abort-signal cancellation.
- Added deterministic classification for text, binary, non-UTF-8, oversized, submodule, symlink, unsupported mode/type, and missing or wrong objects; every inventory entry retains exactly one frozen availability result.
- Proved exactly 1,048,576 bytes per blob side remains text-eligible while 1,048,577 bytes is rejected from metadata without a content read or allocation.
- Proved real pinned objects remain authoritative after worktree mutation and ref movement, repository conversion commands remain unused, symlink targets are not followed, and later object disappearance returns `unavailable: missing-object` without changing loaded metadata.

## Task Commits

The plan followed the required RED then GREEN sequence:

1. **Task 1 — RED: specify immutable availability precedence and bounds** — `4f63488` (`test(01-07): specify immutable object availability`)
2. **Task 2 — GREEN: classify frozen blobs without fallback** — `887415f` (`feat(01-07): classify immutable object availability`)

No separate refactor commit was needed; the GREEN implementation already kept protocol parsing, classification policy, and inventory wiring in their owning modules.

## TDD Evidence

### RED

- `npm run test:unit -- tests/unit/availability.test.ts`
  - Exited 1.
  - All 13 named availability tests reached their behavioral assertions and failed at the intentional classifier/schema seams.
- `npm run test:git -- tests/git/availability.test.ts`
  - Exited 1.
  - All 6 named real-Git tests reached inventory or object-reader assertions and failed because immutable classification/object reads were not implemented.

### GREEN

- `npm run test:unit -- tests/unit/availability.test.ts`
  - Exited 0: 2 focused unit files, 25 tests passed.
- `npm run test:git -- tests/git/availability.test.ts`
  - Exited 0 after migrating the affected strict-inventory assertion: 5 focused Git files, 27 tests passed.

Only the plan-named unit and Git commands were run. No formatter, linter, broad build, project-wide suite, API suite, or Playwright suite was run.

## Artifacts and Symbols

- `src/git/objects.ts`
  - `ObjectReader`
  - `ObjectMetadata`
  - `ObjectContent`
  - `createObjectReader`
- `src/git/availability.ts`
  - `MAX_INLINE_TEXT_BYTES`
  - `AvailabilityInput`
  - `Availability`
  - `classifyAvailability`
- `src/contracts/comparison.ts`
  - `UnsupportedAvailabilityReasonSchema`
  - `AvailabilitySchema`
  - required `ChangedFileSchema.availability`
- `src/git/inventory.ts`
  - creates one reader for the frozen repository session and classifies every joined raw-diff/numstat record before strict parsing and freezing

## Classifier Matrix

| Condition | Result | Object/content behavior |
|---|---|---|
| Either mode is `160000` | `unsupported: submodule` | No object access |
| Either mode is `120000` | `unsupported: symlink` | No object access; target never followed |
| Unknown status, unknown mode, tree mode, or other non-regular type | `unsupported: mode-or-type` | No object access |
| Required object missing or not a blob | `unavailable: missing-object` | Metadata only; no content or fallback |
| Any regular side exceeds 1,048,576 bytes | `unsupported: oversized` | All required metadata inspected; no content read |
| Git numstat reports binary | `unsupported: binary` | Metadata inspected; no content read |
| Any bounded content contains NUL | `unsupported: binary` | At most 1 MiB read per side |
| Any bounded content fails fatal UTF-8 decoding | `unsupported: non-utf8` | At most 1 MiB read per side |
| Every present side is a valid regular UTF-8 blob | `text` | At most 1 MiB read per side |
| Object disappears between metadata and content | `unavailable: missing-object` | No ref, path, worktree, or conversion fallback |

Added and deleted records skip their absent all-zero side. Modified, renamed, copied, type-changed, and mode-only records evaluate every present side under the same per-side ceiling.

## Size and Allocation Proof

Pure spies establish this call order for a two-sided regular entry:

1. inspect old object type and size;
2. inspect new object type and size;
3. only if both are blobs at or below the ceiling, read old with `maxBytes: 1_048_576`;
4. read new with the same independent ceiling.

The 1,048,577-byte case records only the two metadata calls. No content call is made. The exact-limit case records both metadata calls followed by two bounded reads and remains `text`. Real-Git fixtures repeat both boundaries with actual loose blobs.

`ObjectReader.read` additionally caps cat-file stdout at the requested content bound plus a 256-byte protocol header allowance, validates the returned declared size and NUL framing, and exposes a zero-copy buffer view of only the object bytes.

## Immutable-Object Proof

- Object commands receive the object only as `info <full-oid>\0` or `contents <full-oid>\0` on stdin; command arguments contain no ref, path, `ref:path`, textconv, filter, external-diff, symlink-following, or caller-selected object option.
- The real fixture configures failing textconv, clean/smudge filter, and external-diff commands. Classification still succeeds because none is invoked.
- After the first inventory, the test replaces worktree text with binary bytes, makes the symlink target oversized/binary, and advances the selected branch ref. Rebuilding from the frozen merge-base/head OIDs yields the identical availability matrix and original blob ID.
- After deleting the already-inventoried loose blob, reclassification returns `unavailable: missing-object`; the frozen entry retains its path, blob ID, and previously loaded `text` availability metadata.
- A commit object supplied in a regular-file slot is treated as `unavailable: missing-object`, never dereferenced or coerced into text.

## Decisions Made

- Structural Git modes are authoritative enough to reject gitlinks, symlinks, and non-regular modes without reading their objects or following a path.
- For regular sides, missing/wrong objects take precedence over oversized and content reasons because all metadata is inspected before content policy runs.
- Git's numstat binary fact takes precedence over raw byte inspection after the size ceiling; NUL detection takes precedence over UTF-8 validation.
- Strict availability replaces the earlier free-form `unsupportedReason`; downstream consumers now receive only the exact machine vocabulary synchronized with `SKELETON.md` and `01-UI-SPEC.md`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added intentional RED module seams**
- **Found during:** Task 1 RED setup
- **Issue:** Static imports for the planned modules could not reach named behavioral assertions while the modules did not exist.
- **Fix:** Added minimal typed throwing exports in the RED commit, then replaced every throw with the real implementation in GREEN.
- **Files modified:** `src/git/objects.ts`, `src/git/availability.ts`
- **Verification:** RED suites failed at the named seams; the final stub scan found no remaining not-implemented path.
- **Committed in:** `4f63488`, completed by `887415f`

**2. [Rule 3 - Blocking] Extended the shared Git runner with bounded stdin**
- **Found during:** Task 2 object reader implementation
- **Issue:** The runner intentionally ignored stdin, but `cat-file --batch-command -Z` requires NUL-framed commands on stdin. A command-line object fallback would violate the plan's machine-protocol boundary.
- **Fix:** Added optional `Uint8Array` input and closed the child stdin after writing; existing subprocess byte limits, cancellation, safe arguments, and environment suppression remain shared.
- **Files modified:** `src/git/runner.ts`
- **Verification:** Real-Git recording assertions observed exactly the two NUL commands and bounded stdout settings; all focused Git tests passed.
- **Committed in:** `887415f`

**3. [Rule 1 - Bug] Migrated the affected legacy unsupported assertion**
- **Found during:** Task 2 GREEN Git verification
- **Issue:** The existing inventory test still expected the removed free-form `unsupportedReason` string, conflicting with the planned strict one-reason cutover.
- **Fix:** Asserted `availability: { kind: 'unsupported', reason: 'mode-or-type' }` instead.
- **Files modified:** `tests/git/inventory.test.ts`
- **Verification:** The named Git command passed all 27 tests across its five focused files.
- **Committed in:** `887415f`

**4. [Rule 1 - Bug] Corrected generated project progress metadata**
- **Found during:** Sequential planning-state close-out
- **Issue:** `state.update-progress` reported 20 percent but wrote `0` in state frontmatter and left the visible state label at 17 percent; `roadmap.update-plan-progress` updated the overview row but left the detailed progress row at 6/13 plans and 17/23 requirements.
- **Fix:** Corrected state to 20 percent and the detailed roadmap row to 7/13 plans and 18/23 requirements.
- **Files modified:** `.planning/STATE.md`, `.planning/ROADMAP.md`
- **Verification:** Re-read metadata shows 7 completed plans, 20 percent overall progress, and 18 of 23 Phase 1 requirements complete.
- **Committed in:** final plan metadata commit

**Total deviations:** 4 auto-fixed (2 bugs, 2 blocking). **Impact:** Production changes were required to execute the specified machine protocol and clean strict-contract cutover; the metadata correction records actual disk progress. No later-plan API, UI, tree, or content-rendering behavior was implemented.

## Issues Encountered

- The first GREEN Git run correctly exposed the one legacy inventory assertion. It was migrated to the new exact availability union and the complete named Git command then passed.
- The GSD progress handlers returned or partially wrote the new totals but persisted inconsistent state and roadmap fields; final metadata was corrected to the computed values.

## Known Stubs

None. The RED-only throwing seams were fully replaced in the GREEN commit.

## Threat Model Verification

- **T-01-15:** Type and size precede content; each side is capped at 1 MiB and oversized objects never reach content reads.
- **T-01-16:** Raw cat-file commands use validated full OIDs only and never enable filters, textconv, external diff, path resolution, or symlink following.
- **T-01-17:** Missing, wrong-type, or mid-read vanished objects return the single unavailable reason without ref or filesystem substitution.
- **T-01-SC:** No dependency or install change was made.

No unplanned network, authentication, browser, schema trust-boundary, or source-write surface was introduced.

## User Setup Required

None.

## Next Phase Readiness

- Plan 01-08 can expose opaque capabilities over inventory entries that already carry strict frozen availability facts.
- Plans 01-10 and 01-12 can render the exact text/unsupported/unavailable vocabulary without deriving policy in the browser.
- Phase 2 can reuse `ObjectReader` for bounded immutable blob content without accepting paths, refs, or worktree authority.
- No blockers remain.

## Self-Check: PASSED

- Summary exists at `.planning/phases/01-pinned-local-comparison/01-07-SUMMARY.md`.
- RED commit `4f63488` and GREEN commit `887415f` are present in the required order.
- Created source and test artifacts exist; focused unit and Git verification passed.

---
*Phase: 01-pinned-local-comparison*
*Completed: 2026-07-20*
