---
phase: 01-pinned-local-comparison
plan: 06
subsystem: git-inventory
status: complete
tags: [git, diff, inventory, paths, zod, vitest]
requires:
  - phase: 01-pinned-local-comparison
    plan: 05
    provides: Pinned base, head, and merge-base object IDs plus the native Git runner boundary
provides:
  - Byte-exact changed-file inventory parsed independently from native Git raw and numstat protocols
  - Strict shared contracts for exact paths, supported and unsupported statuses, modes, object IDs, and line counts
  - Stable process-local opaque file IDs derived from raw record identity rather than display paths
  - Focused pure-protocol and real-repository coverage for file kinds, path edge cases, and pinned-object immutability
affects:
  - 01-07
  - comparison API consumers
  - review draft identity
tech-stack:
  added: []
  patterns:
    - Parse NUL-delimited Git protocols as bytes and decode only ASCII control fields
    - Join independently parsed Git streams by exact base64url path-byte tuples
    - Preserve unsupported-but-valid Git facts instead of silently coercing them
key-files:
  created:
    - src/domain/path-bytes.ts
    - src/git/raw-diff.ts
    - src/git/numstat.ts
    - src/git/inventory.ts
    - tests/unit/inventory-protocol.test.ts
    - tests/git/inventory.test.ts
  modified:
    - src/contracts/comparison.ts
    - src/git/comparison.ts
    - tests/cli/errors.test.ts
    - tests/cli/selection.test.ts
key-decisions:
  - Treat display strings as presentation only; exact path bytes are the sole authority for joins and identity.
  - Run raw diff and numstat as separate native Git commands over the identical frozen merge-base/head object IDs, then require a one-to-one exact-path join.
  - Retain syntactically valid unknown modes and statuses as explicitly unsupported records with their raw metadata.
  - Derive opaque file IDs from a process namespace and exact raw record identity so IDs are stable during one server process without exposing repository paths.
requirements-completed: [CMP-04, CMP-05, CMP-07]
completed: 2026-07-20
---

# Phase 01 Plan 06: Byte-Exact Native-Git Changed-File Inventory Summary

**Native Git now produces a strict, byte-exact, drift-resistant changed-file inventory from independently parsed raw-diff and numstat streams pinned to the comparison's frozen object IDs.**

## Performance

- **Duration:** 32 min
- **Started:** 2026-07-20T12:39:14Z
- **Completed:** 2026-07-20T13:11:10Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Added byte-preserving path values with base64url transport, optional strict UTF-8 text, safe display escaping, bytewise ordering, and frozen public state.
- Implemented independent `--raw -z` and `--numstat -z` parsers that preserve tabs, newlines, leading dashes, rename/copy pairs, modes, object IDs, statuses, similarity, binary counts, and malformed-input failures.
- Added a strict one-to-one join keyed only by exact path-byte tuples, with explicit duplicate, missing, and extra-record errors.
- Added the native Git inventory boundary using the same full merge-base/head object IDs and matching rename, copy, external-diff, and text-conversion controls for both protocol commands.
- Extended comparison contracts and resolution so committed-change truth comes from the frozen inventory rather than a name-only diff.
- Covered ordinary changes, deletes, renames, copies, chmod-only changes, type changes, binary files, additions, difficult path bytes, unknown protocol facts, and ref/worktree drift.

## Task Commits

Each task followed RED then GREEN TDD ordering:

1. **RED: Specify byte-exact changed-file inventory behavior** — `10b0d07` (`test(01-06): specify byte-exact changed-file inventory`)
2. **GREEN: Implement byte-exact changed-file inventory** — `3b1f4c1` (`feat(01-06): implement byte-exact changed-file inventory`)

## TDD Evidence

### RED

- `npm run test:unit -- tests/unit/inventory-protocol.test.ts`
  - Exited 1 with all 12 named protocol tests reaching and failing at the intentional not-implemented seams.
- `npm run test:git -- tests/git/inventory.test.ts`
  - Exited 1 with all 5 named inventory integration tests reaching and failing at the intentional inventory seam; the three pre-existing Git test files in the adapter category still passed.

### GREEN

- `npm run test:unit -- tests/unit/inventory-protocol.test.ts`
  - Passed: 1 file, 12 tests.
- `npm run test:git -- tests/git/inventory.test.ts`
  - Passed: 4 files, 21 tests.

The committed history preserves RED before GREEN, and the temporary failing seams were fully replaced by production behavior in GREEN.

## Native Git Protocol Contract

Both commands use native Git, NUL framing, the identical pinned object-ID pair, and an explicit pathspec terminator:

```text
git diff --raw -z --no-abbrev --find-renames=50% --find-copies=50% --find-copies-harder --no-ext-diff --no-textconv <mergeBaseOid> <headOid> --
git diff --numstat -z --find-renames=50% --find-copies=50% --find-copies-harder --no-ext-diff --no-textconv <mergeBaseOid> <headOid> --
```

The raw parser decodes only the ASCII metadata header. Path fields remain bytes. The numstat parser independently recognizes ordinary records and rename/copy two-path records, including ordinary paths containing tabs. Inventory creation rejects duplicate raw keys, duplicate numstat keys, missing numstat records, and extra numstat records.

## Path and File-Kind Matrix

Focused tests establish:

- Modified, deleted, added, renamed (`R100`), and copied (`C100`) files.
- Chmod-only changes with identical blob IDs and mode transition `100644` to `100755`.
- Type changes from regular file mode `100644` to symlink mode `120000`.
- Binary numstat represented as `null` additions and deletions.
- Paths containing spaces, tabs, newlines, and leading dashes.
- Canonically composed and decomposed Unicode remaining distinct when the filesystem preserves both names.
- Invalid UTF-8 bytes remaining distinct through base64url authority and safe display replacement.
- Syntactically valid unknown status and mode facts retained as unsupported inventory entries.

The real-repository fixture detects host filesystem capabilities: this Darwin/APFS environment rejects invalid pathname bytes with `EILSEQ` and normalizes canonically equivalent Unicode names. Those two byte-preservation cases are therefore proven in the platform-independent protocol tests, while the real Git fixture exercises them whenever the host filesystem can represent them.

## Pinned Immutability Proof

The integration test resolves a comparison, then moves a branch ref and creates dirty modified and untracked worktree content. Rebuilding the inventory from the already pinned full merge-base/head object IDs yields the same committed inventory, establishing that moving refs and worktree dirt cannot mutate comparison semantics.

## Files Created

- `src/domain/path-bytes.ts` — exact byte transport, display escaping, UTF-8 detection, and bytewise comparison.
- `src/git/raw-diff.ts` — strict raw-diff NUL protocol parser.
- `src/git/numstat.ts` — independent numstat NUL protocol parser and exact join.
- `src/git/inventory.ts` — native command execution, supported/unsupported classification, validation, and opaque IDs.
- `tests/unit/inventory-protocol.test.ts` — malformed protocol, path-byte, join, and contract tests.
- `tests/git/inventory.test.ts` — real Git inventory and immutability matrix.

## Files Modified

- `src/contracts/comparison.ts` — strict readonly path and changed-file schemas; required inventory on pinned comparisons.
- `src/git/comparison.ts` — inventory construction from the frozen merge-base/head pair and committed-change derivation.
- `tests/cli/errors.test.ts` — typed comparison fixture updated for the required inventory.
- `tests/cli/selection.test.ts` — typed comparison fixture updated for the required inventory.

## Decisions Made

- **Bytes before strings:** no Unicode normalization or display decoding participates in record matching, ordering, or identity.
- **Independent parsers:** raw metadata and numstat counts have separate grammars and cannot accidentally inherit assumptions from one another.
- **Exact failure over partial inventory:** any duplicate, missing, extra, or malformed record fails inventory construction explicitly.
- **Preserve unknown facts:** unknown but syntactically valid modes and statuses remain visible as unsupported instead of disappearing or masquerading as known changes.
- **Process-local opaque identity:** file IDs reveal neither path nor repository data and remain stable for the life of the process; tests inject a deterministic namespace.

## Deviations from Plan

### Auto-fixed Issues

**1. Added temporary throwing module seams to make the RED tests executable**
- **Found during:** Task 1 RED setup
- **Issue:** Static test imports could not exercise the named behavioral assertions until the planned modules existed.
- **Fix:** Added minimal throwing exports in the RED commit, proved every named test failed at those seams, then replaced every seam with real implementations in GREEN.
- **Files:** `src/domain/path-bytes.ts`, `src/git/raw-diff.ts`, `src/git/numstat.ts`, `src/git/inventory.ts`
- **Verification:** Final focused suites pass and the stub scan found no remaining not-implemented behavior.

**2. Made real-path edge cases capability-aware without weakening byte-level coverage**
- **Found during:** Task 2 fixture execution
- **Issue:** Darwin/APFS rejects invalid pathname bytes and canonicalizes composed/decomposed Unicode, so a fixture requiring both names would test filesystem behavior rather than Git inventory behavior.
- **Fix:** Detect those filesystem capabilities in the real Git fixture and keep unconditional exact-byte assertions in the pure protocol suite.
- **Files:** `tests/git/inventory.test.ts`, `tests/unit/inventory-protocol.test.ts`
- **Verification:** The real Git suite passes deterministically on this host; the pure suite still proves invalid UTF-8 and normalization-distinct byte identities.

No production scope was added beyond the plan.

## Issues Encountered

- The first integration-fixture draft contained a test syntax typo and assumed invalid pathname bytes were representable on every host. Both were corrected before preserving the valid RED commit, so the recorded RED evidence reflects intended behavioral failures rather than broken test construction.

## Known Stubs

None. The RED-only throwing seams were replaced in the GREEN commit.

## User Setup Required

None.

## Next Phase Readiness

- Plan 01-07 can consume strict changed-file inventory records, opaque file IDs, exact path transport, and pinned object IDs without querying live refs or worktree state.
- No blockers remain for the next plan.

## Self-Check: PASSED

- Summary exists at `.planning/phases/01-pinned-local-comparison/01-06-SUMMARY.md`.
- RED commit `10b0d07` and GREEN commit `3b1f4c1` are present in history in the required order.
