---
phase: 03-complete-review-draft
plan: 03
subsystem: draft-recovery-and-reveal
tags: [fastify, zod, vitest, sha-256, atomic-persistence]
requires:
  - phase: 03-complete-review-draft
    provides: reconciled paths, aggregate draft store, and approved focused verification command
provides:
  - raw-byte draft loader algebra with safe public load states
  - queue-serialized, fingerprint-bound backup-first recovery
  - fixed-authority draft-file reveal capability and strict client contract
  - interruption, stale-fingerprint, and concurrent-recovery byte proofs
affects: [draft-persistence, session-api, review-ui]
tech-stack:
  added: []
  patterns: [raw-buffer-classification, verified-exclusive-backup, bounded-safe-dtos, launch-owned-capability]
key-files:
  created:
    - src/server/draft-loader.ts
    - src/server/draft-recovery.ts
  modified:
    - src/contracts/draft.ts
    - src/contracts/api.ts
    - src/server/capabilities.ts
    - src/server/draft-store.ts
    - src/server/routes.ts
    - src/web/api/client.ts
    - src/web/App.vue
    - tests/unit/draft-load.test.ts
    - tests/api/draft-recovery.test.ts
    - tests/api/draft-recovery-faults.test.ts
    - tests/api/draft-reveal.test.ts
    - tests/api/draft.test.ts
key-decisions:
  - Draft load begins from one untouched Buffer; raw corrupt bytes never cross the server/API boundary.
  - Recovery rechecks the expected full SHA-256 inside the existing comparison queue, writes and rereads an exclusive byte-identical backup, then atomically replaces only that active draft.
  - Reveal is a fixed no-body/no-query action closed over the launch-owned canonical draft path; browsers provide no filesystem authority.
patterns-established:
  - Explicit load discriminants distinguish missing, current, malformed, schema-invalid, and newer-unsupported drafts.
  - Corrupt and newer drafts are read-only before every mutation reaches a writer.
requirements-completed: [DRFT-05]
duration: 24m
completed: 2026-07-22
---

# Phase 03 Plan 03: Raw-Byte Recovery and Fixed Reveal Summary

**Draft loading is now loss-resistant: corrupt bytes remain server-only and immutable until an authenticated caller proves the current SHA-256, the server has verified an exclusive byte-identical backup, and an atomic empty-draft replacement completes.**

## Performance

- **Completed:** 2026-07-22T10:22:40Z
- **Tasks:** 3/3
- **Focused verification:** 10 unit files / 80 tests; 10 API files / 71 tests
- **Commits:** `7a69753`, `d2fb9b4`, `63b2471`, `aef3f96`

## Completed Tasks

1. **RED — raw classification, lockout, and reveal contracts** — `7a69753` (`test(03-03): add failing draft recovery tests`)
   - Added loader-state, raw-byte preservation, mutation-lockout, recovery, fault, and fixed reveal tests before production support existed.
   - The reconciled command failed at the intended boundary: `tests/unit/draft-load.test.ts` could not import the missing `src/server/draft-loader.js`; the pre-existing unit suite otherwise passed 73 tests. This established an implementation absence rather than a setup failure.

2. **GREEN — raw-buffer loader and backup-first recovery** — `d2fb9b4` (`feat(03-03): recover corrupt draft files safely`)
   - Added a strict version envelope and the raw loader algebra: `missing`, `current`, `malformed`, `schemaInvalid`, and `newerUnsupported`.
   - Added safe public DTOs, strict recovery/reveal contracts, secure route mappings, client parsing, and the active caller's classified startup handling.
   - Extended the existing serialized aggregate store rather than creating parallel persistence. Recovery rereads state in the same queue, requires the caller's SHA-256 fingerprint, creates a `wx` backup, syncs and verifies its exact Buffer/length before replacing the canonical file.
   - Migrated directly coupled legacy draft API fixtures to the classified GET response and read-only corrupt response; the reconciled API script executes the whole API directory.

3. **REFACTOR — interruption and race hardening** — `63b2471` (`refactor(03-03): harden draft recovery persistence`) and `aef3f96` (`test(03-03): serialize concurrent recoveries`)
   - Added a deterministic injected-filesystem matrix for every backup and replacement boundary plus stale-fingerprint, mutation/recovery serialization, backup-collision, and concurrent-recovery cases.
   - A directory-sync error after successful rename is resolved by rereading canonical state: recovery reports success only when the empty valid draft is already visible, avoiding a false retryable failure after replacement.

## Load, Mutation, and Security Matrix

| State | GET response | Mutations | Recovery | Bytes |
|---|---|---|---|---|
| Missing | `missing` with safe relative path | allowed | unavailable | no file synthesized by GET |
| Current | `current` with validated draft | allowed | unavailable | validated persisted bytes retained |
| Malformed | `malformed` with SHA-256 and bounded detail | 409 `readOnly` | fingerprint-bound backup/reset | raw bytes stay server-only until verified backup |
| Current-version schema invalid | `schemaInvalid` with SHA-256 and bounded issues | 409 `readOnly` | fingerprint-bound backup/reset | raw bytes stay server-only until verified backup |
| Newer unsupported | `newerUnsupported` with found/supported versions | 409 `readOnly` | unavailable | zero-write; no downgrade/reset path |

The reveal route accepts only the fixed launch-owned action. Standard token, Host, and Origin hooks execute before route work; a body or query string is rejected. Neither request nor response carries a path, and responses are only `{ kind: 'revealed' }` or `{ kind: 'revealFailed' }`.

## Recovery Byte and Fault Evidence

The integration recovery proof uses a non-normalized corrupt Buffer and calculates its full SHA-256. It confirms the GET DTO exposes neither raw bytes nor an absolute path, verifies every one of the six mutation types returns read-only without changing bytes, performs recovery with the matching fingerprint, and then proves:

- backup Buffer `equals(original)`;
- backup `length === original.length` by Buffer equality and the store's explicit length check;
- backup SHA-256 equals the required fingerprint;
- canonical content is a valid empty revision-0 draft only after that backup verifies.

The injected filesystem matrix records the following original/backup/canonical expectations:

| Interruption point | Result | Original canonical | Backup expectation | Replacement canonical |
|---|---|---|---|---|
| Backup open/write/sync/close | `persistenceFailure` | exact original Buffer retained | no acknowledged backup | no replacement |
| Backup directory sync or verification reread | `persistenceFailure` | exact original Buffer retained | candidate is never accepted without successful reread/length/byte equality | no replacement |
| Temporary open/write/sync/close or rename | `persistenceFailure` | exact original Buffer retained | verified byte-identical backup exists | no replacement |
| Canonical directory sync after rename | `recovered` only after reread observes current draft | verified backup retained | exact original Buffer remains in backup | valid empty revision-0 draft is visible |
| Existing deterministic backup mismatch | `recovered` through exclusive suffix | unrelated existing bytes retained | `.1.bak` equals original Buffer | valid empty revision-0 draft |
| Changed fingerprint / newer schema | non-success | changed/newer Buffer retained | no backup created | no replacement |

Two recovery requests against the same queue produce exactly one recovered empty draft and one `recoveryUnavailable` current-state result. The sole backup equals the original corrupt Buffer. A queued normal mutation waits behind recovery and then commits revision 1, proving recovery and mutations use the existing serialized store queue rather than an independent path.

## Verification

The reconciliation artifact contains one approved Phase 03-03 command entry, `03-03-task-1-load-recovery`; it is the sole executable/argument authority for RED, GREEN, and REFACTOR because the plan's three nominal keys are not present in the reconciled command map.

- **RED:** resolved `node -e "const{spawnSync}=require('node:child_process');for(const a of [['run','test:unit','--','tests/unit/draft-load.test.ts'],['run','test:api','--','tests/api/draft-recovery.test.ts','tests/api/draft-recovery-faults.test.ts','tests/api/draft-reveal.test.ts']]){const r=spawnSync('npm',a,{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1)}"` — expected exit 1 from the missing loader import.
- **GREEN:** same resolved command — passed 10 unit files / 80 tests and 10 API files / 56 tests.
- **REFACTOR:** same resolved command — passed 10 unit files / 80 tests and 10 API files / 71 tests.

## Deviations

- **[Rule 2 — clean-cutover caller migration]** Updated `src/web/App.vue` and the active API client because the prior client assumed every GET draft response was a current draft. Leaving that caller unchanged would crash on the required classified states and retain an incompatible path.
- **[Rule 3 — focused-suite compatibility]** Updated the directly coupled expectations in `tests/api/draft.test.ts`. The approved `test:api` command runs the full API directory, and its legacy GET/corrupt-mutation expectations no longer matched the specified classified contract.
- No dependencies, worktrees, recovery UI, arbitrary-path opener, selector changes, export changes, or parallel persistence were introduced.

## Self-Check: PASSED

- Loader classification preserves raw corrupt bytes and exposes only safe bounded metadata.
- Newer schema bytes are read-only across GET, every mutation, and recovery.
- Recovery never writes a replacement before an exclusive, synced, reread byte-identical backup exists.
- Fixed reveal cannot receive browser-selected filesystem authority and remains behind inherited request security.
- RED → GREEN → REFACTOR evidence and focused verification are recorded with the reconciled executable/argument array.
