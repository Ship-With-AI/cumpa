---
phase: 03-complete-review-draft
plan: 02
subsystem: aggregate-draft-mutations
tags: [fastify, zod, vitest, cas, json-persistence]
requires:
  - phase: 03-complete-review-draft
    provides: reconciled paths, owners, and executable verification argv
provides:
  - strict aggregate mutation request/result contracts
  - serialized compare-and-swap draft persistence
  - one mutation gateway for every draft write
  - deterministic lifecycle, conflict, atomicity, and reducer-matrix evidence
affects: [draft-persistence, session-api, review-ui]
tech-stack:
  added: []
  patterns: [strict-discriminated-unions, aggregate-revision-cas, serialized-commit-before-acknowledgement]
key-files:
  created: [src/draft/mutate-draft.ts]
  modified:
    - src/contracts/draft.ts
    - src/contracts/api.ts
    - src/server/draft-store.ts
    - src/server/routes.ts
    - src/web/api/client.ts
    - src/web/App.vue
    - tests/unit/draft-mutations.test.ts
    - tests/api/draft-lifecycle.test.ts
    - tests/api/draft-conflict.test.ts
key-decisions:
  - The persisted review draft is the single aggregate CAS boundary; a successful mutation increments revision exactly once after durable commit.
  - Stale clients receive a typed 409 response containing the latest aggregate and do not write bytes.
  - Comment identity is materialized in the store, not accepted from add-comment clients.
patterns-established:
  - Draft writes use POST /api/draft/mutations with a strict type discriminant and expectedRevision.
  - Reducer operations preserve every non-owned field, including durable anchors and creation timestamps.
requirements-completed: [CMT-03, CMT-04, CMT-05, CMT-07, DRFT-04]
duration: 33m
completed: 2026-07-22
---

# Phase 03 Plan 02: Aggregate Draft Mutation Engine Summary

**A strict, serialized draft aggregate now accepts all six review mutations through one compare-and-swap gateway, acknowledges only committed state, and returns authoritative state on revision conflicts.**

## Performance

- **Duration:** 33m
- **Started:** 2026-07-22T08:30:33Z
- **Completed:** 2026-07-22T09:03:56Z
- **Tasks:** 3/3
- **Files changed:** 13 implementation and focused-test files, plus this summary
- **Commits:** `7c65254`, `d943141`, `2942065`

## Completed Tasks

1. **RED — aggregate mutation contract tests** — `7c65254` (`test(03-02): add failing aggregate mutation tests`)
   - Added the named behavioral failures for required add-comment `expectedRevision` and a valid non-empty summary plus resolved-comment invariant.
   - Ran the reconciled RED command exactly: `npm run test:unit -- tests/unit/draft-mutations.test.ts`.
   - It failed for the intended missing contract: `AddCommentRequestSchema` accepted no aggregate revision, and `ReviewDraftV1Schema` rejected the exact summary/resolved-comment fixture. The command exited 1 with two failing tests; no setup or provisional test failure was used as RED evidence.

2. **GREEN — durable aggregate mutation implementation** — `d943141` (`feat(03-02): implement aggregate draft CAS mutations`)
   - Added strict Zod contracts for revisions, comment states, all six mutation payloads, and typed accepted/conflict/failure results.
   - Added the pure mutation reducer and serialized store CAS operation: read current aggregate inside the queue, reject stale revision without a write, apply exactly one transition, increment exactly once, atomically commit, then acknowledge.
   - Replaced route-specific draft writers with `POST /api/draft/mutations`; the client and the current add-comment UI caller now pass the aggregate revision and consume the authoritative result.
   - Updated directly coupled legacy API fixtures that still called superseded route/store writers, preserving focused contract coverage.

3. **REFACTOR — matrix coverage and centralized response mapping** — `2942065` (`refactor(03-02): table-drive draft mutation checks`)
   - Centralized the one gateway's typed HTTP response mapping, so success and each expected operation result share one response policy.
   - Table-drove the reducer matrix for add, edit, delete, resolve, reopen, and summary operations, plus duplicate-anchor, missing-target, and illegal-transition failures.
   - Re-ran the reconciled verification command exactly; it passed: **9 unit files / 73 tests** and **7 API files / 49 tests**.

## Mutation Matrix and Invariants

| Mutation | Owned changes on accepted write | Required invariant |
|---|---|---|
| `addComment` | Appends one server-identified open comment with `createdAt` and `updatedAt` | Durable anchor key and comment ID remain unique |
| `editComment` | Changes only `body` and `updatedAt` | Anchor, ID, state, and `createdAt` are preserved |
| `deleteComment` | Removes the selected comment from the aggregate | The comment is physically absent afterward |
| `resolveComment` | Sets `state: resolved`, `resolvedAt`, and `updatedAt` | Only an open comment may resolve |
| `reopenComment` | Sets `state: open`, removes `resolvedAt`, and changes `updatedAt` | Only a resolved comment may reopen |
| `setSummary` | Replaces `summary` byte-for-byte as supplied | Comments are unchanged |

Every accepted operation creates a new aggregate with `revision = previous revision + 1` only after its atomic persistence commit succeeds. Missing targets yield `invalidTarget` (404); duplicate anchors are an invalid target; invalid state transitions yield `illegalTransition` (409). Strict request schemas reject unknown fields and unsupported operations before persistence.

## Two-Tab Conflict Timeline and Raw-Byte Proof

The API conflict test starts from revision 1 after adding a comment. Two concurrent tabs submit an edit and a summary update against revision 1. Serialization lets exactly one operation observe revision 1 and return 200 with revision 2. The loser observes revision 2 inside the queue and receives 409 with `{ kind: "revisionConflict", expectedRevision: 1, actualRevision: 2, latest }`.

The test then captures the draft file's raw `Buffer`, SHA-256 hash, `mtimeMs`, and its draft-directory entries. A subsequent stale mutation asserts that `latest` equals the JSON decoded from the captured buffer and that the buffer, hash, modification time, and directory entries are unchanged. This proves stale writes neither replace nor perturb the persisted aggregate.

## Persistence-Failure Evidence

The focused atomicity contract tests exercise failures at every writer boundary—directory creation, temporary-file open/write/sync/close, rename, and directory sync. A failure reports only the typed `persistenceFailure` result and does not acknowledge the requested mutation. Before rename, canonical bytes remain unchanged; after rename, the store does not claim failure for an already-committed draft, avoiding a false retry signal.

## Security and Scope Boundaries

- Mutation request objects are strict discriminated unions; unknown fields, unsafe revisions, arbitrary file/anchor data, and unrecognized operations are rejected.
- The route derives durable add-comment anchors from capability-controlled file content. It exposes no generic draft replacement route, filesystem path input, or client-selected comment ID for adds.
- Existing host, origin, and bearer-token gates run before route execution; the focused lifecycle test confirms unauthorized mutations receive 401 before repository work.
- Persisted draft schemas require immutable comparison identity, unique IDs and anchors, and the resolved/open field shape. Typed operation failures expose no filesystem or internal error detail.
- No recovery UI, selector behavior, Phase 4 work, dependencies, or parallel authoring path was added.

## Verification

- **RED:** `npm run test:unit -- tests/unit/draft-mutations.test.ts` — expected exit 1; 2 contract failures named above.
- **GREEN:** `node -e "const{spawnSync}=require('node:child_process');for(const a of [['run','test:unit','--','tests/unit/draft-mutations.test.ts'],['run','test:api','--','tests/api/draft-lifecycle.test.ts','tests/api/draft-conflict.test.ts']]){const r=spawnSync('npm',a,{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1)}"` — passed 9 unit files / 63 tests and 7 API files / 49 tests.
- **REFACTOR:** the same reconciled command — passed 9 unit files / 73 tests and 7 API files / 49 tests.

## Deviations

- **[Rule 2 — Missing critical clean-cutover work]** Updated `src/web/App.vue` together with the API client because replacing the draft client's `addComment` writer requires its active caller to supply `expectedRevision`; leaving that caller behind would retain a broken or deprecated write path.
- **[Rule 3 — Blocking focused-suite compatibility]** The reconciled `test:api` script always executes the full `tests/api` directory even when target paths are supplied. Existing directly coupled tests still used the superseded draft routes and store writer, so their fixtures were migrated to the required aggregate gateway before the approved ledger command could verify the implementation. No unrelated tests or behavior were changed.

## Self-Check: PASSED

- All six mutations use the same strict gateway and aggregate `expectedRevision`.
- Successful mutation responses carry the committed, authoritative aggregate; stale writes return typed 409 conflicts with the latest aggregate.
- Tests cover lifecycle transitions, stale raw-byte preservation, strict requests, failure responses, and the reducer's owned-field invariants.
- Task commits preserve RED → GREEN → REFACTOR history; no dependencies, recovery UI, selector changes, Phase 4 code, or worktrees were introduced.
