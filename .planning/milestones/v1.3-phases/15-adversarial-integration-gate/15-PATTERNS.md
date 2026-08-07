# Phase 15: Adversarial Integration Gate — Pattern Map

**Mapped:** 2026-08-06  
**Scope:** HAND-06 and all three Phase 15 success criteria  
**Files analyzed:** 15 production/test harness files plus phase planning artifacts  
**Analogs found:** 15 / 15

Phase 15 is an identity/ownership seam, not a second review workflow. Preserve deterministic source provenance (`range.reviewKey`, exact-patch `reviewKey`, and interactive comparison identity) and introduce one trusted per-attached-invocation storage scope. That one value must own draft filename/queue, export directory, reveal path, and recovery path for both source modes.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/cli/run.ts` | CLI launcher/coordinator composition | request-response, streaming stdout, lifecycle | `launchAttachedSession()` and `createLaunchRuntime()` (`src/cli/run.ts:400-475`, `195-291`) | exact |
| `src/server/app.ts` | session app composition | request-response, file I/O | `createSessionApp()` / `createExactPatchSessionApp()` (`src/server/app.ts:86-160`) | exact |
| `src/server/capabilities.ts` | capability/service registry | CRUD + request-response + export file I/O | `createCapabilityRegistry()` / `createExactPatchCapabilityRegistry()` (`src/server/capabilities.ts:95-131`, `262-601`, `603-827`) | exact |
| `src/server/draft-loader.ts` | persistence identity/path loader | CRUD + file I/O | `draftPaths()`, `classifyDraft()`, `createDraftLoader()` (`src/server/draft-loader.ts:89-166`) | exact |
| `src/server/draft-store.ts` | durable draft queue/store | CRUD + serialized file I/O | `createDraftStore()` and `runSerialized()` (`src/server/draft-store.ts:81-92`, `141-151`) | exact |
| `src/server/export-store.ts` | atomic export publication | file I/O + request-response | `stableNameFor()` / `publishReviewExport()` (`src/server/export-store.ts:121-154`, `211-318`) | exact |
| `tests/api/draft.test.ts` | API persistence integration evidence | request-response + CRUD/file I/O | `buildApp()` and same-pair/range isolation tests (`tests/api/draft.test.ts:42-112`, `114-181`) | exact |
| `tests/api/exact-patch.test.ts` | exact-patch API integration evidence | request-response + snapshot/file I/O | `grounded()`, `buildApp()`, `setSummary()`, `exportReview()` (`tests/api/exact-patch.test.ts:24-136`) | exact |
| `tests/api/export-publication.test.ts` | publication/path safety evidence | atomic file I/O | stable-name, candidate, recovery, symlink, exact-byte tests (`tests/api/export-publication.test.ts:69-91`, `207-257`) | exact |
| `tests/api/attached-completion.test.ts` | authenticated Finish route evidence | request-response + one-shot delivery | real `createSessionApp()` with `attachedCompletion` (`tests/api/attached-completion.test.ts:87-167`) | exact |
| `tests/api/attached-completion-coordinator.test.ts` | completion state-machine evidence | event-driven/streaming | concurrent Finish coalescing and terminal delivery tests (`tests/api/attached-completion-coordinator.test.ts:27-97`) | exact |
| `tests/cli/request.test.ts` | CLI stream/termination evidence | streaming + request-response | routing, stdout/stderr, cancellation and delivery-failure tests (`tests/cli/request.test.ts:221-550`) | exact |
| `tests/e2e/agent-ready-export.spec.ts` | packaged production handoff evidence | multi-process request-response, browser, streaming, file I/O | `beforeAll` pack/extract setup; generated CLI helpers (`tests/e2e/agent-ready-export.spec.ts:88-177`, `274-293`) | exact |
| `tests/helpers/git-fixture.ts` | real repository fixture | Git/file I/O | `createDirtyGitFixture()` | exact |
| `src/server/security.ts` / `src/server/lifecycle.ts` | security and shutdown boundary | authenticated request-response / lifecycle | `registerSessionSecurity()` and `createShutdownController()` (`src/server/lifecycle.ts:21-24`, `42-103`) | exact |

## Pattern Assignments

### `src/cli/run.ts` — trusted attached identity, options threading, launch/shutdown/stdout

**Analog:** `launchAttachedSession()` (`src/cli/run.ts:400-475`), with runtime ownership in `createLaunchRuntime()` (`195-291`).

**Existing ownership pattern:** one invocation creates one `AttachedCompletionCoordinator`, one bearer token, one app, one loopback listener, one stdout delivery sink, and one shutdown controller. The relevant composition is:

```ts
const coordinator = createAttachedCompletionCoordinator();
const token = randomBytes(32).toString('base64url');
app = await createApp(token, {
  coordinator,
  deliver: async (bytes) => await coordinator.runDelivery(async () => await stdout(bytes)),
}, revealDraftFile);
await app.listen({ host: '127.0.0.1', port: 0 });
const authority = `127.0.0.1:${address.port}`;
app.bindSessionSecurity({ expectedHost: authority, expectedOrigin: `http://${authority}` });
const url = `http://${authority}/#token=${token}`;
output(url);
output(browserFallback);
await openBrowser(url);
const result = await waitForAttachedOutcome(coordinator, dependencies.signalSource);
await coordinator.responseSettled;
await shutdown.shutdown();
```

Allocate the attached storage scope exactly once in this launcher, beside the coordinator/token. Pass it through the existing `createApp` callback/options. Do not allocate it from request JSON, browser state, `reviewKey`, or independently in draft/export layers. Keep `createLaunchRuntime()` and the TTY interactive launch unchanged.

**Stream and shutdown pattern:** URLs/fallback/diagnostics use the existing diagnostic output; only the settled canonical bytes go through the coordinator-owned stdout callback. A successful launch waits for `responseSettled` before shutdown; failure invokes shutdown with status 1. Preserve one invocation per stdin request, loopback-only binding, and per-launch abort/close ownership.

**Required storage grammar pattern:** use existing `node:crypto` `randomBytes` import, but a literal domain prefix plus fixed lowercase-hex body (for example `agent-${randomBytes(32).toString('hex')}`), not a bare key. Validate the internal name again at the store boundary before `join()`. Never persist or reuse the bearer token as a storage authority.

### `src/server/app.ts` — options ownership fence

**Analog:** `createAppDraftStore()`, `createSessionApp()`, and `createExactPatchSessionApp()` (`src/server/app.ts:86-160`).

The app currently makes one draft store and passes that exact store into the capability registry:

```ts
const draftStore = createAppDraftStore(comparison, options);
const capabilities = createCapabilityRegistry(comparison, { ...options, draftStore });
```

Exact-patch composition similarly passes all options to `createExactPatchCapabilityRegistry()` and attaches snapshot disposal to `onClose`. Extend this existing options seam with the trusted storage scope (or equivalent draft/export storage override), so range and patch apps receive one owned value. Do not create a second scope while materializing a patch snapshot, app, capability registry, draft loader, or export publisher. Existing snapshot cleanup on app close remains per-app.

### `src/server/capabilities.ts` — preserve provenance, override only mutable storage names

**Analog:** range `exportReview()` and exact-patch `exportReview()` in `createCapabilityRegistry()` / `createExactPatchCapabilityRegistry()` (`src/server/capabilities.ts:262-601`, `603-827`).

Current range publication deliberately keeps deterministic provenance in the canonical document while publication identity uses the source `reviewKey`:

```ts
identity: range === undefined
  ? { kind: 'interactive', baseOid: comparison.base.oid, headOid: comparison.head.oid }
  : { kind: 'range', reviewKey: range.reviewKey },
```

Current exact-patch publication does the same:

```ts
identity: { kind: 'exact-patch', reviewKey: patch.reviewKey },
```

Retain those identities for canonical V2/V3 validation, drift evidence, and result fields. Thread the trusted attached storage name only into draft path/queue and export stable-directory selection. The storage override must be shared by draft receipt, export receipt, reveal, and recovery; never recompute it per operation. Interactive apps must continue using legacy pair identity and pair-only paths.

### `src/server/draft-loader.ts` and `src/server/draft-store.ts` — path and queue must share one key

**Analogs:** `draftPaths()` and `createDraftLoader()` (`src/server/draft-loader.ts:89-166`), then `createDraftStore()` (`src/server/draft-store.ts:141-151`).

Current path derivation is deterministic and feeds both canonical path and relative response path:

```ts
const key = 'kind' in comparison
  ? comparison.reviewKey
  : comparison.range?.reviewKey ?? comparisonKey(comparison.baseCommitOid, comparison.headCommitOid);
const relativePath = `${draftsDirectory}/${key}.json`;
return Object.freeze({ key, directory, canonicalPath: join(repositoryRoot, relativePath), relativePath });
```

Current store derives its serialized queue key from the same loader key:

```ts
const loader = createDraftLoader({ repositoryRoot, comparison, fileSystem });
const { canonicalPath, directory, key, relativePath } = loader.paths;
const queueKey = `${options.repositoryRoot}\u0000${key}`;
```

Add a validated trusted storage-key override to this existing path seam. Keep `classifyDraft()` and `sameComparison()` checking the persisted deterministic `DraftComparison`; changing the filename must not make a draft with another source comparison current. Temporary file names, atomic rename/fsync, revision conflicts, settle fencing, recovery, and read-only malformed-state behavior remain unchanged. The single overridden `key` must drive both `canonicalPath` and `queueKey`.

### `src/server/export-store.ts` — separate stable storage name from publication provenance

**Analog:** `stableNameFor()` and `publishReviewExport()` (`src/server/export-store.ts:121-154`, `211-318`).

The current boundary validates stable names before filesystem joins and uses candidate directories plus exact pair validation:

```ts
function stableNameFor(identity: ExportPublicationIdentity): string | undefined {
  if (identity.kind === 'range' || identity.kind === 'exact-patch') {
    return Object.keys(identity).length === 2 && /^[0-9a-f]{64}$/u.test(identity.reviewKey)
      ? identity.reviewKey
      : undefined;
  }
  // interactive validates both OIDs before constructing `<base>..<head>`.
}
```

`publishReviewExport()` creates a managed export root, writes a random candidate directory, validates exactly `review.json`/`review.md`, atomically promotes/recoveries the stable directory, and returns receipt paths/hashes. Preserve all of that. Add a distinct validated attached stable storage name as an internal publication-path input while the canonical `ExportPublicationIdentity` remains deterministic range/patch provenance. Assert draft and export receipts contain the same attached scope component. Never weaken stable-name validation, managed-root/symlink checks, exact-byte checks, or re-export behavior.

### `src/server/security.ts` and `src/server/lifecycle.ts` — preserve per-session boundaries

**Analogs:** `registerSessionSecurity()` and `createShutdownController()` (`src/server/security.ts`; `src/server/lifecycle.ts:21-24`, `42-103`).

Each app retains its own expected host/origin and bearer token. Each launcher retains its own signal source, abort callback, listener close callback, and exit status. Scope isolation must not be “fixed” by a global coordinator, shared listener, process-global token, shared stdout wrapper, or cross-app shutdown hook.

## Test Pattern Assignments

### `tests/api/draft.test.ts` — range and interactive path identity

Reuse its real `createSessionApp()`/`app.inject()` setup, temporary roots, app cleanup set, strict auth headers, and raw filesystem reads. Existing tests prove interactive pair drafts resume only the same pair and same-OID ranges isolate by frozen ordered scope (`tests/api/draft.test.ts:42-181`). Extend the `buildApp()` seam with two distinct trusted attached scopes over equivalent ranges. Assert missing initial drafts, distinct exact `.cumpa/drafts/*.json` names, equal persisted `comparison.range.reviewKey`, independent revisions/comments, and no resume through the interactive pair path. Do not replace this with mocked stores or object-only equality.

### `tests/api/exact-patch.test.ts` — patch storage and snapshot ownership

Reuse `grounded()`, `buildApp()`, `setSummary()`, `exportReview()`, real exact-patch `createExactPatchSessionApp()`, and temporary roots (`tests/api/exact-patch.test.ts:24-136`, `138-307`). Build two equivalent grounded patch apps with different trusted scopes. Assert equal patch digest/reviewKey in session/export provenance but distinct draft/export paths and raw bytes; close one app and assert the other snapshot/content remains readable. Keep snapshot drift/cleanup assertions focused on each app’s owned state.

### `tests/api/export-publication.test.ts` — path safety and exact bytes

Reuse existing stable-name validation, candidate publication, recovery, symlink, exact-byte, and range identity tests (`tests/api/export-publication.test.ts:69-91`, `207-257`). Add only assertions that attached storage names are accepted as internal names, are structurally disjoint from interactive/deterministic names, and are used consistently for receipt paths while `matchesPublicationIdentity()`/canonical parser still checks source provenance. Include traversal/invalid-name rejection at this boundary. Do not make tests trust a client-supplied request ID.

### `tests/api/attached-completion.test.ts` and `tests/api/attached-completion-coordinator.test.ts` — API race evidence

Use authenticated Fastify `inject()` against real session apps. `attached-completion.test.ts` already proves the attached session marker and explicit Finish route; keep it as the route-level harness (`tests/api/attached-completion.test.ts:87-167`). `attached-completion-coordinator.test.ts` already gates concurrent Finish, shares the operation, freezes terminal state, counts one delivery, distinguishes retryable/terminal failure, and fences draft mutations (`tests/api/attached-completion-coordinator.test.ts:27-97`). Add two coordinator/app instances with equal provenance and distinct storage scopes; concurrently finish/mutate/export them; assert per-instance `status()`, `delivery`, `responseSettled`, repeated Finish (`alreadyCompleted`), and terminal failure outcomes.

### `tests/cli/request.test.ts` — stdout/shutdown failure boundary

Reuse existing TTY/non-TTY routing, output capture, signal source, child/lifecycle, and delivery-failure tests (`tests/cli/request.test.ts:221-550`). Extend only where necessary to observe launcher composition: a failing attached invocation emits zero stdout and no success exit, while another invocation remains live and later emits exactly one result. Preserve diagnostics on stderr and do not wrap or concatenate stdout documents.

### `tests/e2e/agent-ready-export.spec.ts` — required production handoff proof

This is the closest and required end-to-end harness. Reuse its one-time build/verify/`npm pack`/extract setup and Chromium run (`:274-293`), real dirty Git fixture (`tests/helpers/git-fixture.ts`), fake browser opener, generated packaged CLI, separate stdout/stderr descriptors, loopback URL/token helpers, and process wait/stop helpers (`:88-218`). Reuse `openSession()`, `ensureReviewOpen()`, `addHeadComment()`, and `saveSummary()` (`:219-258`).

Add adversarial scenarios, not a second harness:

- **Criterion 1 / HAND-06:** two byte-equivalent attached range requests and two equivalent patch requests have equal deterministic source `reviewKey` but distinct loopback/token/storage identities, feedback, draft bytes, export trees, stdout bytes, and completion lifetimes. Finish sequentially and prove the waiting peer remains live.
- **Criterion 2 / HAND-06:** interactive and attached sessions over the same revisions use disjoint namespaces. Attached begins `missing`/revision 0, cannot resume/overwrite/reveal/publish through the interactive pair identity, and interactive raw draft/export bytes/UI remain unchanged.
- **Criterion 3 / HAND-06:** success in A does not terminate or alter B; failure/SIGINT/delivery failure in A yields zero stdout and no successful exit while B remains operable and can later emit one complete result. Parse the entire stdout file with `parseCanonicalReviewExport()`; reject concatenation, partial JSON, or trailing newline. Assert exact raw draft/export bytes, process exit codes/liveness, browser summaries/comments, and per-app cleanup.

Do not use a fake UI, mocked production app, prefix JSON parsing, mtime-only assertions, or a second package/browser setup.

## Shared Patterns

### One trusted value ownership fence
Created once by `launchAttachedSession()`, passed through app/capability/store options, and consumed by draft paths, draft queue, export stable path, reveal, and recovery. Draft/export layers must not derive it independently.

### Source provenance remains canonical
`comparisonKey()`, `rangeReviewKey()`, patch `reviewKey`, `DraftComparison`, `ExportPublicationIdentity`, V2/V3 schemas, anchor verification, and drift fingerprints remain deterministic. Storage scope is not a request field and never appears as a replacement canonical source identity.

### Existing security and lifecycle isolation
One bearer token, loopback authority, Fastify app, coordinator, stdout sink, snapshot, and shutdown controller per attached invocation. Interactive launch behavior and persisted interactive paths remain byte-for-byte compatible.

### Existing durable-store guarantees
Reuse atomic temp-write/fsync/rename, per-key serialized queue, revision/settle fencing, malformed/read-only classification, managed export root checks, candidate publication, exact pair validation, and recovery behavior.

### Evidence hierarchy
Production changes are the storage option/threading seam only. API tests prove state/path/race invariants cheaply; CLI tests prove stream/failure boundaries; packaged Playwright proves real child process + loopback + browser + filesystem handoff. No test-only fake may substitute for the packaged production path for HAND-06.

## Prohibited Divergent Patterns

- Randomizing or replacing deterministic range/patch `reviewKey` or interactive `comparisonKey`.
- Accepting a client-supplied request/storage ID, browser-provided storage scope, or bearer token as storage authority.
- Using a bare unprefixed nonce that can occupy existing 40/64-hex/OID grammar; relying on probability instead of structural namespace separation.
- Allocating scope in multiple layers, deriving draft and export names independently, or letting draft/export receipt paths disagree.
- Changing interactive draft filenames/export directories or migrating legacy `.cumpa/` data.
- Sharing coordinators, queues, stdout descriptors, Fastify listeners, tokens, shutdown controllers, or patch snapshots between invocations.
- Weakening path validation, managed-root/symlink protection, atomic publication, canonical provenance validation, revision fencing, or response-settlement ordering.
- Treating ordinary browser Export, reload, close, or disconnect as attached completion.
- Introducing dependencies, a database, lock service, remote coordination, new runner, broad cleanup, or a second browser harness.
- Proving isolation only through in-memory object equality, mtime checks, trimmed/prefix stdout parsing, or mocked app/UI behavior.

## Coverage and No Analog Gaps

All requested production seams have exact analogs. All three roadmap criteria and HAND-06 are covered by the API, CLI, and packaged-browser harness assignments above. No new role/data-flow lacks a current codebase pattern; no new production workflow is justified.

## PATTERN MAPPING COMPLETE
