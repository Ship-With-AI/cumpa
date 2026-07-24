---
phase: 03-complete-review-draft
plan: 01
subsystem: reconciliation
status: complete
approval: approved
---

# Phase 03 Plan 01: Actual Handoff Reconciliation

## Status

**Tasks 1 and 2 complete. The human reviewer approved the Task 1 reconciliation; Plans 03-02 through 03-07 are unblocked. No commit was made because this inspection-only plan forbids Git and commits.**

This inspection-only reconciliation created exactly this summary and `03-01-RECONCILIATION.json`. The JSON ledger is the sole authority for downstream executable command arrays, actual paths, dispositions, and file counts.

## Actual authorities — extend, do not replace

| Concern | Actual owner | Reconciliation rule |
|---|---|---|
| Strict persisted review draft | `src/contracts/draft.ts` — `ReviewDraftV1Schema`, schema version `1` | Extend this shared Zod owner; do not introduce a parallel draft schema/store. It currently has comparison tuple, monotonic `revision`, empty-only `summary`, up to 10,000 comments, and `body.trim().min(1).max(100000)`. |
| API DTOs | `src/contracts/api.ts` | Extend shared request/response Zod schemas and derived types only. |
| Draft identity/path | `src/domain/comparison-key.ts`, `src/server/draft-store.ts` | Ordered base/head selected OIDs yield the server-computed `.diff-review/drafts/<comparisonKey>.json` path. |
| Atomic persistence | `src/server/draft-store.ts` — `createDraftStore` | One queue per repository/comparison; strict whole-document parse; same-directory restrictive `wx` temp, sync/close, rename, directory sync. Put every Phase 3 mutation and CAS here. |
| One-comment-per-anchor | `src/server/draft-store.ts` — `appendComment`/`DraftConflictError` | Preserve the existing occupied-anchor invariant while adding aggregate revision conflict behavior. |
| Raw corruption/loading | current `src/server/draft-store.ts`; new `src/server/draft-loader.ts` needed | `MUST_CREATE_03_03`: classify raw bytes before mutation, preserve malformed/schema-invalid/newer bytes, and use verified backup-first recovery. |
| Secured Fastify application | `src/server/app.ts` — `createSessionApp`; `src/server/routes.ts` — `registerSessionRoutes` | `createSessionApp` registers session security before routes/static assets. Add all Phase 3 routes to this one registry; no second app/plugin boundary. |
| Request boundary | `src/server/security.ts` — `registerSessionSecurity` | Existing token, exact Host, and absent-or-exact Origin checks precede route work. |
| Frozen server capability | `src/server/capabilities.ts` — `createCapabilityRegistry` | Fixed opaque file map, object reader, `draftStore`, and anchor verifier; browser never chooses repository/path/ref/OID/blob/comparison/draft path/anchor facts. |
| Browser API closure | `src/web/api/client.ts` — `createSessionClient` | Fragment token is captured then removed; fixed GET/POST closure sends Bearer, same-origin credentials, no-store, and strictly parses Zod responses. |
| Canonical Vue state | `src/web/model/workspace-state.ts` — `createWorkspaceState` | This currently owns accepted comments, session-only view state, and an independent composer add buffer. Evolve it (or an explicit full replacement) as the only canonical index; never add a competing comment map. |
| Existing review surface | `src/web/App.vue`, `src/web/components/DiffWorkspace.vue`, `CommentsRail.vue`, `CommentComposer.vue`, `ui/UiPrimitives.vue` | Extend the existing rail/workspace/composer and primitives. |
| One Monaco lifecycle | `src/web/monaco/diff-adapter.ts` — `createMonacoDiffAdapter` and `applyMonacoWorkspaceCommand` | Adapter owns models, zones, decorations, listeners, exact reveal, and disposal. Vue owns persistence/focus. `src/domain/anchor.ts#verifyDurableAnchor` remains the exact verifier. |
| Git observation | `src/git/runner.ts` — `createGitRunner`; candidates/source/comparison seams | Native Git accepts argument arrays only. Retain launch descriptors server-side; browser gets no selector authority. |

## Fixed-action dispositions

- **`revealDraftFile`: `MUST_IMPLEMENT_03_03`.** Current routes, client, and capabilities do not contain a fixed no-body active-draft reveal action. Existing source matches are Monaco comment/context reveal only. The Phase 3 action must target only the launch-owned active draft; standard token/Host/Origin checks must occur before platform work; it must reject body/query/path authority and expose only a safe relative display value.
- **New comparison: `CLI_RELAUNCH`.** No existing pre-authorized fixed no-body new-comparison action exists. Phase 03 drift UI must give CLI relaunch guidance, not invent current-session comparison refresh or selector authority.

## Actual command ledger

`03-01-RECONCILIATION.json#commands` contains executable-plus-argument-array entries for every later task verification:

- `03-02-task-1-red`, `03-02-task-2-green`, `03-02-task-3-refactor`
- `03-03-task-1-load-recovery`
- `03-04-task-1-markdown-registry`, `03-04-task-2-review-panel`, `03-04-task-3-review-panel-refactor`
- `03-05-task-1-recovery-ui`
- `03-06-task-1-git-api`, `03-06-task-2-drift-ui`
- `03-07-task-1-packaged-lifecycle`, `03-07-task-2-packaged-safety`

Those commands target the actual focused Vitest (`tests/unit`, `tests/git`, `tests/api`), real Monaco integration (`tests/integration`), and packaged Playwright (`tests/e2e`) harnesses. The filesystem-fault injection seam stays in `DraftFileSystem`/`tests/api/draft-atomicity.test.ts`; Fastify uses `inject`; real Git uses `tests/helpers/git-fixture.ts`; real Monaco uses the integration harness; production packaging uses the established Playwright harness.

### Markdown declaration decision

No Markdown parser or declaration package is present in the current manifest/lockfile. Therefore this ledger **does not assume** `markdown-it` or `@types/markdown-it`.

After the human approves the Phase 03 package registry artifact in 03-04 Task 1, the executor must inspect the approved locked parser’s bundled declaration metadata, then run `npm exec tsc -- --noEmit --project tsconfig.json` after adding the planned importer. An external declaration package is justified only by that actual compiler/import failure. The pre-install approval gate is `03-04-task-1-markdown-registry` in the JSON ledger.

## Downstream actual-file recount

| Plan | Actual substituted unique files | Count | Disposition |
|---|---|---:|---|
| 03-02 | contracts draft/API, new pure mutation reducer, existing store/routes/client, focused unit/API tests | 9 | UNDER_15 |
| 03-03 | contracts, new loader/recovery, existing store/capabilities/routes/client, focused loader/recovery/reveal tests | 12 | UNDER_15 |
| 03-04 | manifest/lock, existing client/workspace/rail/composer/styles, new grouping/preview/panel/summary modules, focused tests | 14 | UNDER_15 |
| 03-05 | App, workspace state, recovery component, styles, focused integration test | 5 | UNDER_15 |
| 03-06 | API/capabilities, new drift service/state/notice, existing routes/client/App, Git/API/UI tests | 11 | UNDER_15 |
| 03-07 | existing fixture/App/app factory and one packaged acceptance spec | 4 | UNDER_15 |

The complete actual-path lists are in `fileCounts` in the JSON ledger. Every count is below 15; no split/replan is required.

## Decision coverage

| Decision | Reconciled owner path and behavior |
|---|---|
| D-01 | `workspace-state` + grouping model + `CommentsRail`: exact-path groups with open first and resolved collapsed/countable. |
| D-02 | Workspace show-command sequence plus the one Monaco adapter reveals/focuses the exact anchor, never relocates it. |
| D-03 | Inline edit uses an independent workspace composer buffer and explicit server save. |
| D-04 | Pure mutation/state/panel owns confirmed hard delete and deterministic successor focus. |
| D-05 | No tombstones, undo, threads, or replies; deletion removes the canonical record. |
| D-06 | Resolve/reopen is a legal atomic transition in the reducer/store/CAS path. |
| D-07 | One persistent top-of-review summary spans draft contract, API/store/client/state, and summary component. |
| D-08 | One canonical Markdown edit/preview representation; parser/declaration choice waits for the approved registry plus compiler/import check. |
| D-09 | Explicit save or Cmd/Ctrl+Enter writes the complete draft with expected revision. |
| D-10 | Failure preserves every local attempted buffer; canonical state is never optimistically replaced. |
| D-11 | Empty summary remains valid canonical state. |
| D-12 | One complete draft has a monotonic revision, serialized by the existing store queue. |
| D-13 | Stale expected revision returns conflict/latest and writes zero bytes. |
| D-14 | Reload latest retains attempts; no automatic merge, force write, or retry. |
| D-15 | Malformed/schema-invalid raw bytes remain byte-identical and read-only until recovery. |
| D-16 | Recovery verifies an identical backup before start-fresh replacement. |
| D-17 | Newer-schema bytes are immutable and expose upgrade-only guidance. |

## Requirement coverage

| Requirement | Actual seam coverage |
|---|---|
| CMT-03 | Edit through shared contract, pure mutation, one store/routes/client, workspace composer/panel, packaged test. |
| CMT-04 | Delete through shared contract, pure mutation, one store/routes/client, deterministic focus state/panel, packaged test. |
| CMT-05 | Resolve/reopen legal transitions through reducer/store/CAS/client/grouped UI. |
| CMT-06 | Counts/groups/jump via pure grouping, rail, workspace commands, and exact Monaco adapter navigation. |
| CMT-07 | One summary through contract/store/routes/client/canonical state/SummarySection and safe preview. |
| DRFT-04 | Serialized whole-draft expected-revision CAS; stale write leaves disk unchanged and returns latest canonical state. |
| DRFT-05 | Raw loader/classifier, backup-first recovery, newer read-only UI, and fixed reveal action. |
| DRFT-06 | Server-retained launch descriptor, native Git runner, secured observation route, and read-only pinned-drift notice. |

## Human approval — Task 2 complete

The human reviewer approved the complete implementation handoff boundary:

1. Phase 1/2 source and every actual owner path above exist and are the correct extension seams.
2. The executable/argument-array command ledger is the sole downstream verification authority.
3. `src/contracts/draft.ts`, `src/server/draft-store.ts`, `src/server/app.ts`/`routes.ts`, `src/web/api/client.ts`, `src/web/model/workspace-state.ts`, and `src/web/monaco/diff-adapter.ts` are single authorities — no parallel schema/store/app/client/index/adapter is allowed.
4. The Markdown registry/declaration procedure waits for approved registry evidence and an actual compiler/import check.
5. `revealDraftFile` is `MUST_IMPLEMENT_03_03`; new comparison remains `CLI_RELAUNCH`.
6. The actual file recount is accepted: every plan is below 15 files.

**Approval recorded:** `approved` on 2026-07-22. The approval covers the Phase 1/2 source and actual owners, executable/argument-array command matrix, Markdown compiler-declaration decision procedure, `MUST_IMPLEMENT_03_03` reveal disposition, `CLI_RELAUNCH` selector disposition, below-15 actual-file recount, and the prohibition on parallel schemas, stores, apps, clients, canonical indexes, or Monaco adapters. Plans 03-02 through 03-07 are unblocked.
