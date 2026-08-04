# Architecture Research

**Domain:** Agent-to-human review handoff in the existing local-first Compare CLI
**Researched:** 2026-08-04
**Confidence:** HIGH for existing integration boundaries and native-Git mechanisms; MEDIUM-HIGH for the exact-patch overlay sequence until exercised against Compare's complete patch fixture set

## Recommendation

Add one alternate **ingress and completion path** around the existing review pipeline. Do not build a second reviewer, patch renderer, server, export format, or agent HTTP API.

A non-TTY invocation reads one strict, versioned request from stdin and normalizes either supported input mode into the same `PinnedComparison` already consumed by `createSessionApp()`. From that boundary onward, the current changed-file inventory, blob reader, Monaco UI, durable anchors, draft mutations, export builder, canonical serializer, Markdown renderer, loopback security, and browser launch remain authoritative.

The only attached-session UI difference is an explicit **Finish review** action. It invokes the existing export operation. After the successful HTTP response has flushed, a one-shot in-process completion channel wakes the waiting CLI. The CLI reads and validates the already-published canonical `review.json`, writes those exact bytes to stdout, writes every diagnostic to stderr, and shuts down Fastify.

Preserve interactive compatibility structurally:

- `stdin.isTTY === true` follows the current discovery → picker → confirmation → launch flow unchanged.
- piped stdin follows the new handoff path and never invokes Inquirer.
- both input modes finish Git preparation before `createSessionApp()` and produce immutable OIDs.
- the existing authenticated `/api/export` remains the browser boundary; no route is exposed for agent control.
- absent attached-session options preserve current API payloads, persistence paths, export directories, terminal output, and shutdown behavior.

## Standard Architecture

### System Overview

```text
                         one Compare process
┌──────────────────────────────────────────────────────────────────────────────┐
│ CLI ingress                                                                  │
│                                                                              │
│  TTY stdin                              piped stdin                          │
│     │                                      │                                │
│     ▼                                      ▼                                │
│ existing runCli()                    NEW handoff request reader              │
│ discovery → picker → confirm         bounded UTF-8 → JSON → Zod             │
│     │                                      │                                │
│     │                                NEW handoff Git adapter                 │
│     │                                ├── revisions + pathspecs               │
│     │                                └── exact applied patch                 │
│     │                                      │                                │
│     └──────────────────┬───────────────────┘                                │
│                        ▼                                                    │
│             existing PinnedComparison boundary                              │
│                        │                                                    │
├────────────────────────┼────────────────────────────────────────────────────┤
│ Existing review runtime                                                      │
│                        ▼                                                    │
│ createSessionApp() → Fastify 127.0.0.1:0 → bearer-token browser URL          │
│                        │                                                    │
│       capability registry + repository-local draft store                    │
│                        │                                                    │
│             Vue 3 + Monaco review workspace                                  │
│                        │                                                    │
│        comments / summary / anchor verification / drift                      │
│                        │                                                    │
├────────────────────────┼────────────────────────────────────────────────────┤
│ Completion                                                                   │
│                        ▼                                                    │
│ existing export service → canonical JSON + Markdown → atomic publication     │
│                        │                                                    │
│ interactive: receipt in UI          attached: response flushes               │
│                                                │                             │
│                                                ▼                             │
│                                      one-shot completion channel             │
│                                                │                             │
│                                      validate canonical file bytes           │
│                                                │                             │
│                                      stdout bytes; diagnostics stderr        │
│                                                │                             │
│                                      close server + dispose overlay + exit   │
└──────────────────────────────────────────────────────────────────────────────┘
```

The normalization seam is the central decision. The browser never receives raw revisions, raw pathspecs, or patch text, and it never applies a patch.

### Component Responsibilities

| Component | Status | v1.3 responsibility | Communicates with |
|-----------|--------|---------------------|-------------------|
| `src/cli/run.ts` | **Modify narrowly** | Dispatch TTY input to current `runCli()` unchanged and non-TTY input to the handoff runner; retain the interactive picker/recovery loop | current CLI modules, new handoff runner, launch runtime |
| `src/contracts/handoff.ts` | **New** | Strict versioned stdin request schema; discriminated union guaranteeing exactly one mode; bounded revision/pathspec/patch fields; inferred types | CLI handoff reader, Git handoff adapter |
| `src/cli/handoff.ts` | **New** | Bounded stdin read, fatal UTF-8/JSON/Zod handling, stderr diagnostics, attached-session wait, canonical stdout write with EPIPE/backpressure handling, failure exits | handoff contract, Git adapter, launch runtime, completion channel |
| `src/git/handoff.ts` | **New** | Resolve both modes, compute a domain-separated review key, own any patch overlay, and return a normal `PinnedComparison` plus attached runtime resources | repository discovery, `GitRunner`, comparison builder, inventory, object reader |
| `src/git/comparison.ts` | **Modify by extraction** | Expose one lower-level builder from already-resolved base/head/diff-base snapshots so interactive and handoff paths share object verification, inventory, freezing, and schema parsing | interactive source resolution, handoff adapter, inventory |
| `src/git/inventory.ts` | **Modify** | Accept optional pathspec strings and append them after the existing `--` in both raw and numstat Git calls; keep parsing and `.compare` exclusion unchanged | `GitRunner`, object reader, availability classifier |
| `src/git/runner.ts` | **Modify narrowly** | Support a controlled per-runner Git environment overlay for temporary index/object directories and deterministic `commit-tree`; retain argument arrays, safe config, aborts, timeouts, and caps | all Git adapters |
| `src/domain/comparison-key.ts` | **Modify** | Preserve current two-OID key bytes for interactive sessions; add a domain-separated handoff key over normalized mode, resolved OIDs, ordered pathspecs, and/or patch digest | handoff adapter, draft/export namespaces |
| `src/server/attached-review.ts` | **New** | One-shot completion primitive with `finish(receipt)`, `cancel(reason)`, and a promise; reject duplicate completion and unblock on signals/errors | launch runtime, routes, CLI handoff runner |
| `src/server/app.ts` | **Modify** | Accept optional attached metadata, scoped review key, completion port, and patch-overlay `ObjectReader`; pass them into current stores/capabilities/routes | launch runtime, capability registry, draft store |
| `src/server/capabilities.ts` | **Modify** | Use the supplied review key for attached draft/export identity and exported `comparisonKey`; use the supplied overlay reader for patch blobs; otherwise retain current defaults | draft/export stores, routes, object reader |
| `src/server/routes.ts` | **Modify narrowly** | For a successful existing `/api/export` in an attached session, complete only after the raw response `finish`/Fastify response hook; do nothing for interactive or unsuccessful responses | capability registry, optional completion port |
| `src/server/draft-loader.ts`, `src/server/draft-store.ts` | **Modify narrowly** | Accept an optional caller-selected storage key while continuing to store and validate the existing draft comparison tuple with atomic replacement | app/capabilities, `.compare/drafts` |
| `src/server/export-store.ts` | **Modify narrowly** | Accept an optional safe stable directory name. Preserve `<base>..<head>` for interactive exports; use the full review key for attached exports | capability registry, `.compare/exports` |
| `src/contracts/api.ts` | **Modify compatibly** | Add an optional attached marker to `SessionResponseSchema`; allow the scoped export receipt path form without weakening repository-relative path validation | routes, browser client |
| `src/web/api/client.ts` | **Reuse with type update** | Continue invoking the authenticated existing export endpoint and parsing shared schemas | Vue app, Fastify |
| `src/web/App.vue`, `src/web/components/ExportSection.vue` | **Modify conditionally** | When attached, label the explicit successful action **Finish review** and state that success closes the session; retain current Export behavior/copy otherwise | session API, current review/export state |
| `src/export/review-export.ts`, `src/export/render-review-markdown.ts` | **Unchanged authority** | Build/canonicalize the existing `compare/export` v1 document and derive Markdown; stdout uses these exact canonical bytes | capability registry, export store, CLI result writer |
| `src/web/monaco/*`, draft/comment/anchor models | **Unchanged** | Review normalized immutable blobs exactly as today | existing session APIs |
| `src/cli/picker.ts`, `src/cli/confirm.ts`, `src/git/candidates.ts` | **Unchanged** | Interactive-only selection; never entered for piped requests | current `runCli()` only |

### Modified Versus New Scope

**New production modules stop at four:** shared handoff contract, CLI handoff runner, Git handoff adapter, and one-shot completion primitive. All other changes extend an existing authority.

Do **not** add:

- a unified-diff AST/parser or JavaScript diff engine;
- a second Fastify app or detached patch server;
- agent polling, WebSockets, callback listeners, or a control endpoint;
- a second review-result schema or serializer;
- an in-memory-only draft store;
- a process manager, queue, daemon, database, or persistent session registry;
- a TypeScript pathspec matcher;
- a CLI subcommand unless the contract later replaces TTY detection with explicit opt-in.

## Recommended Project Structure

```text
src/
├── cli/
│   ├── run.ts                    # MODIFY: TTY versus piped dispatch
│   ├── handoff.ts                # NEW: stdin → launch → wait → stdout
│   ├── picker.ts                 # UNCHANGED interactive selection
│   └── confirm.ts                # UNCHANGED interactive confirmation
├── contracts/
│   ├── handoff.ts                # NEW: strict versioned request union
│   ├── comparison.ts             # REUSE PinnedComparison
│   ├── api.ts                    # MODIFY: attached marker/receipt path
│   └── draft.ts                  # REUSE draft/export schemas
├── git/
│   ├── handoff.ts                # NEW: revision/patch normalization + overlay
│   ├── comparison.ts             # MODIFY: resolved-snapshot builder
│   ├── inventory.ts              # MODIFY: optional native pathspecs
│   ├── runner.ts                 # MODIFY: controlled Git env overlay
│   ├── repository.ts             # REUSE repository authority
│   └── objects.ts                # REUSE blob authority; configurable runner
├── domain/
│   └── comparison-key.ts         # MODIFY: scoped handoff identity
├── server/
│   ├── attached-review.ts        # NEW: one-shot completion
│   ├── app.ts                    # MODIFY: optional attached context
│   ├── routes.ts                 # MODIFY: complete after response flush
│   ├── capabilities.ts           # MODIFY: review key + object reader
│   ├── draft-loader.ts           # MODIFY: caller storage key
│   ├── draft-store.ts            # MODIFY: caller storage key
│   └── export-store.ts           # MODIFY: caller stable directory
├── export/
│   ├── review-export.ts          # UNCHANGED canonical JSON authority
│   └── render-review-markdown.ts # UNCHANGED Markdown authority
└── web/
    ├── App.vue                   # MODIFY: attached action semantics
    ├── api/client.ts             # REUSE existing export call
    └── components/ExportSection.vue # MODIFY: Export/Finish label
```

### Structure Rationale

- **Transport belongs in `cli/handoff.ts`.** Stdin, stdout, process cancellation, and exit status are not Git or UI concerns.
- **Trust-boundary schemas belong in `contracts/handoff.ts`.** A strict discriminated union makes “exactly one mode” structural.
- **Both modes belong in one Git adapter.** They differ only before snapshot pinning. Once base, head, diff base, pathspecs, and an object reader exist, they use the current pipeline.
- **Completion stays separate from export.** Export remains reusable; an optional observer turns successful browser delivery into process completion.
- **Scope stays out of draft contents.** An out-of-band storage key leaves the versioned draft schema intact while preventing filtered/unfiltered comments from colliding.
- **Stdout reuses published bytes.** Reading and validating `review.json` avoids a second serializer or divergence from canonical file exports.

## Architectural Patterns

### Pattern 1: Normalize at the Edge, Reuse the Pinned Core

**What:** Convert either request mode into an existing `PinnedComparison` before Fastify starts.

```typescript
interface HandoffLaunch {
  readonly comparison: PinnedComparison;
  readonly reviewKey: string;
  readonly objectReader?: ObjectReader;
  dispose(): Promise<void>;
}

const subject = await createHandoffComparison(request, { cwd, signal });
const completion = createAttachedReviewCompletion();
const session = await launchPinnedComparison(subject.comparison, {
  attachedReview: {
    reviewKey: subject.reviewKey,
    completion,
    objectReader: subject.objectReader,
  },
  output: diagnosticToStderr,
});
```

**When to use:** Every piped request. No raw handoff data crosses into Vue/Monaco.

**Trade-offs:** Patch preparation performs more native-Git plumbing up front, but every correctness-sensitive feature after it is reused.

### Pattern 2: Separate Presentation Mode from Comparison Data

**What:** Carry attached behavior in `CreateSessionAppOptions`, not in branch/worktree source identities or a parallel comparison contract.

```typescript
createSessionApp(comparison, {
  sessionToken,
  attachedReview: { reviewKey, completion, objectReader },
});
```

The `PinnedComparison` answers what is reviewed. Optional app context answers only:

1. which persistence/export namespace to use;
2. whether the browser action says Export or Finish review;
3. which object overlay supplies patch blobs; and
4. who to notify after successful response delivery.

**Trade-offs:** A small optional branch reaches app/routes/UI. It avoids inventing an `agent` selector identity and polluting drift behavior.

### Pattern 3: Domain-Separated Scoped Review Identity

**What:** Derive a full 64-hex review key from canonical normalized facts. Preserve `comparisonKey(baseOid, headOid)` byte-for-byte for interactive sessions.

```text
interactive key = existing v1 domain + base OID + head OID

revision handoff key = handoff-v1 domain
                     + resolved base OID
                     + resolved head OID
                     + ordered native pathspec strings

patch handoff key    = handoff-v1 domain
                     + current HEAD OID
                     + SHA-256(exact patch bytes)
                     + synthetic head OID
```

Use the existing length-framed hashing pattern, never delimiter concatenation. The full key names attached draft/export directories and populates `ReviewExportV1.comparison.comparisonKey`.

**Trade-offs:** A no-pathspec revision handoff intentionally does not inherit an interactive draft for the same commits. An identical request resumes deterministically.

### Pattern 4: Exact Applied Patch in an Isolated Git Overlay

**What:** Treat patch mode as an exact patch already present in the current repository, not a future/detached patch. Validate both sides and materialize immutable objects in a temporary Git overlay.

```text
strict patch bytes
    │
    ├─ git apply --reverse --check --binary -
    │      against current worktree: postimage exists now
    │
    ├─ resolve current HEAD^{commit} as base OID
    ├─ resolve real repository object directory
    │
    ├─ create temporary directory containing:
    │      GIT_INDEX_FILE=<temp>/index
    │      GIT_OBJECT_DIRECTORY=<temp>/objects
    │      GIT_ALTERNATE_OBJECT_DIRECTORIES=<real objects>
    │
    ├─ git read-tree <base OID>
    ├─ git apply --cached --check --binary -
    │      against temp index: preimage belongs to current HEAD
    ├─ git apply --cached --binary -
    ├─ git write-tree
    └─ git commit-tree <tree> -p <base OID>
           fixed Compare author/committer metadata
           message contains exact patch digest
           no ref update
                 │
                 ▼
       deterministic synthetic head commit in temp objects
```

All overlay Git calls—including inventory and later blob reads—use the same configured runner. The real object database is a read-only alternate; new blob/tree/commit objects go to the temporary primary directory. The overlay lives until Finish, failure, or signal shutdown, then `dispose()` removes it in `finally`.

Keep `--3way`, `--reject`, and `--unsafe-paths` off: they weaken exactness, permit partial results, or widen the path boundary. Never change the real index, worktree, `HEAD`, refs, or object database.

The checks intentionally allow unrelated changes outside the patch because the patch itself defines the exact review scope. They reject a detached/future patch, a patch based on another `HEAD`, and a patch whose postimage is not currently present.

**Trade-offs:** A patch session must carry its overlay `ObjectReader` through server capabilities and keep temporary files alive. That is smaller and safer than teaching Monaco/export about patches or leaving unreachable objects in the repository. The final export remains useful after cleanup because it contains durable line context and blob OIDs; an identical request recreates deterministic objects.

### Pattern 5: Native Pathspecs at the Inventory Boundary

**What:** Validate pathspecs as bounded strings with no NUL, preserve order/syntax, and append them after `--` to both inventory commands.

```typescript
const args = [
  'diff', '--raw', /* existing flags */,
  baseOid, headOid, '--', ...pathspecs,
];
```

**When to use:** Revision mode only.

**Trade-offs:** Git magic such as `:(top)`, inclusions, and exclusions remains available exactly as contracted. Both raw metadata and numstat must receive the identical array or `joinDiffStats()` loses its one-to-one invariant.

### Pattern 6: Export Is the Completion Commit Point

**What:** Finish review performs the existing export. Only `kind: "exported"` completes, and only after the response flushes.

```typescript
const response = await capabilities.exportReview(input);
if (response.kind === 'exported' && attachedCompletion !== undefined) {
  reply.raw.once('finish', () => attachedCompletion.finish(response));
}
return reply.code(201).send(response);
```

Drift acknowledgement, revision conflict, read-only draft, recovery-required, and publication failures remain in the browser flow and do not wake the CLI.

**Trade-offs:** The browser may render success only briefly before shutdown. Waiting for response completion prevents a false browser network error after a successful stdout result.

### Pattern 7: Stdout as a Single-Document Channel

**What:** Reserve stdout from process start through exit. Route the URL, fallback instructions, security diagnostics, Git failures, cancellation, and shutdown errors to stderr. On completion:

1. resolve the repository-relative JSON path from the validated receipt;
2. read without escaping the repository root or following an unsafe receipt path;
3. verify receipt SHA-256 and byte count;
4. call `parseCanonicalReviewExport(bytes)`;
5. write those exact bytes to stdout, honoring backpressure and handling EPIPE;
6. emit no banner, wrapper, or trailing diagnostic.

Interactive `console.log` behavior remains unchanged because its path never reserves stdout.

## Data Flow

### Mode 1: Explicit Contiguous Revisions With Optional Pathspecs

```text
agent writes one versioned JSON request
    ↓
bounded stdin → fatal UTF-8 → JSON → HandoffRequestSchema(mode=revisions)
    ↓
Git handoff adapter
    ├── discoverGitRepository(cwd)
    ├── rev-parse --verify <base>^{commit}
    ├── rev-parse --verify <head>^{commit}
    ├── reject equal endpoints
    ├── merge-base --is-ancestor <baseOid> <headOid>
    │      exact contiguous range; no commit-list composition
    ├── verify both objects
    ├── diff base = resolved base OID
    └── createChangedFileInventory(baseOid, headOid, pathspecs)
          ├── git diff --raw ... -- <pathspecs>
          ├── git diff --numstat ... -- <pathspecs>
          └── current parsers/availability classification
                 ↓
PinnedComparison
    base.oid = explicit resolved base
    head.oid = explicit resolved head
    mergeBaseOid = base.oid
    source identities absent (immutable revisions do not drift)
                 ↓
scoped review key → existing browser runtime
```

Do not call the interactive `createPinnedComparison()` policy unchanged. It intentionally compares the selected branch's merge base to head. The handoff contract names an exact base-to-head ancestry interval. Share a lower-level resolved-snapshot builder, not the picker-specific merge-base decision.

### Mode 2: Exact Patch Already Applied in the Repository

```text
agent request(mode=patch, exact patch string)
    ↓
strict validation + repository discovery + current HEAD pin
    ↓
reverse-check patch against current worktree
    ↓
create temp index/object overlay with real object DB as alternate
    ↓
forward-check/apply against index seeded from HEAD
    ↓
write-tree → deterministic ref-less commit-tree in overlay
    ↓
base OID = current HEAD
head OID = synthetic patch commit
merge base OID = base OID
pathspecs = none; patch is the scope
    ↓
existing inventory and overlay object reader
    ↓
PinnedComparison + patch review key + disposable overlay
    ↓
existing browser runtime
```

Patch text is discarded after snapshot creation except for its digest. File content is subsequently read by blob OID; Monaco never renders patch hunks directly.

### Shared Review and Persistence

```text
PinnedComparison + optional attached context
    ↓
createSessionApp()
    ├── createDraftStore(repositoryRoot, comparison tuple, storageKey)
    ├── createCapabilityRegistry(comparison, reviewKey, objectReader)
    ├── registerSessionSecurity()
    └── registerSessionRoutes()
          ↓
Fastify 127.0.0.1:0 + fragment token
          ↓
Vue SessionResponse
    ├── attached marker absent → current Export UI
    └── attached marker true   → explicit Finish review UI
          ↓
current draft mutations / blob APIs / Monaco / durable anchors
```

The scoped key prevents collisions among:

- a full interactive review;
- revision handoff over the same endpoints with pathspec set A;
- revision handoff over the same endpoints with pathspec set B;
- an exact patch rooted at the same base.

### Finish-to-Stdout Result

```text
Human clicks Finish review
    ↓
existing POST /api/export with expected revision
    ├── reload accepted draft
    ├── reject conflicts/read-only state
    ├── observe/acknowledge selector drift where applicable
    ├── verify durable anchors through current/overlay ObjectReader
    ├── build ReviewExportV1
    ├── canonicalize JSON once
    ├── render Markdown from canonical JSON
    └── atomically publish under handoff review key
          ↓
201 exported receipt flushes to browser
          ↓
one-shot completion resolves
          ↓
waiting CLI
    ├── read published review.json
    ├── verify receipt hash/length
    ├── parseCanonicalReviewExport(bytes)
    ├── close Fastify
    ├── dispose patch overlay if present
    └── write exact canonical bytes to stdout
          ↓
agent receives one `compare/export` v1 document
```

### Cancellation and Failure

```text
invalid request / Git validation failure / browser launch failure
    → stderr diagnostic → nonzero exit → no stdout

SIGINT/SIGTERM while waiting
    → abort work → cancel completion → close Fastify → dispose overlay
    → nonzero/signal exit → no stdout

export conflict / acknowledgement / publication failure
    → remain in browser; CLI keeps waiting; user may Finish again

stdout EPIPE
    → stop writing, close server, dispose overlay, nonzero exit
```

No error JSON is written to stdout. Success is one canonical document; failure is exit status plus stderr.

## State Management

```text
immutable request
    ↓ parse + normalize
immutable PinnedComparison + reviewKey + optional overlay lifetime
    ↓
repository-local ReviewDraftV1 (existing revision state machine)
    ↕ authenticated Fastify mutations
Vue review state / unsaved composer buffers (existing)
    ↓ Finish review
accepted immutable draft snapshot
    ↓
canonical immutable ReviewExportV1 bytes
    ↓
one-shot process completion
```

There is no new long-lived session registry. The completion channel is process-local with one producer and one consumer. Durable state remains repository-local JSON/Markdown; the patch overlay is disposable read-only review material.

## Anti-Patterns

### Anti-Pattern 1: Parallel Patch Review Model

**What people do:** Parse unified diff in TypeScript and feed hunks directly to Monaco.

**Why wrong:** Rename/copy metadata, modes, binary handling, exact paths, blob IDs, anchors, and export verification diverge from Compare's Git-backed model.

**Do instead:** Validate/materialize with native Git, then reuse `PinnedComparison`, inventory, and blob readers.

### Anti-Pattern 2: Mutating Real Git State

**What people do:** `git apply`, `git add`, checkout a branch, update a ref, or write synthetic objects into the repository object database.

**Why wrong:** Launch mutates the coding agent's repository, races concurrent edits, and leaves garbage or lossy cancellation.

**Do instead:** Temporary index plus temporary primary object directory, with the real object directory as a read-only alternate; dispose it at session end.

### Anti-Pattern 3: Filtering After Inventory

**What people do:** Build a full diff and filter `ChangedFile[]` in JavaScript.

**Why wrong:** It does not implement native pathspec semantics, can split rename/copy records, wastes work, and makes scope identity ambiguous.

**Do instead:** Pass the identical ordered pathspec array after `--` to both Git diff commands and hash it into the review key.

### Anti-Pattern 4: Base/Head-Only Persistence for Filtered Sessions

**What people do:** Reuse draft/export paths regardless of pathspec scope.

**Why wrong:** Comments from filtered-out files reappear as orphaned anchors; summaries and exports leak between scopes.

**Do instead:** Keep current paths for interactive flow and use the full review key for attached drafts, exports, receipts, and exported `comparisonKey`.

### Anti-Pattern 5: Completing Before Response Delivery

**What people do:** Resolve the CLI promise as soon as export files exist.

**Why wrong:** CLI shutdown can race the HTTP response, so the browser reports failure while stdout succeeds.

**Do instead:** Complete only after a successful response flush/onResponse boundary.

### Anti-Pattern 6: Any stdout Decoration or Token Leakage

**What people do:** Print browser URL/token, progress, warnings, or a status record before JSON.

**Why wrong:** The agent no longer receives one parseable canonical document, and the bearer token leaks into captured output.

**Do instead:** All attached URL/fallback/diagnostics go to stderr; stdout contains only validated canonical bytes.

### Anti-Pattern 7: Browser Close as Finish

**What people do:** Treat tab close, disconnect, idle timeout, or shutdown as acceptance.

**Why wrong:** None proves the human accepted a specific draft revision, anchor verification result, or published export.

**Do instead:** Only explicit Finish review plus successful publication/response delivery completes.

### Anti-Pattern 8: Agent-Controlled HTTP API

**What people do:** Print an endpoint/token for the agent to poll, mutate review state, or request completion.

**Why wrong:** It expands the trust boundary and bypasses the human action.

**Do instead:** stdin is the agent request channel, stdout is the result channel, and loopback HTTP remains browser-internal.

## Integration Points

### External Boundaries

| Boundary | Pattern | Required invariants |
|----------|---------|---------------------|
| Coding agent → Compare | One bounded versioned UTF-8 JSON document on stdin | Strict Zod union; exactly one mode; no prompts or streaming protocol |
| Compare → Git | Existing `GitRunner`, argument arrays, stdin bytes, optional controlled overlay | No shell; `--` before pathspecs; safe config retained; patch work abortable/bounded |
| Compare → browser | Existing loopback Fastify and fragment token | `127.0.0.1`, ephemeral port, Host/Origin/Bearer checks; no LAN/agent API |
| Compare → repository | Existing `.compare` atomic persistence | Scoped key; no real index/worktree/ref/object mutation for patch preparation |
| Compare → agent | Exact canonical `ReviewExportV1` bytes on stdout | No token/diagnostic/wrapper; validate receipt/file first; failure leaves stdout empty |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `run.ts` ↔ `cli/handoff.ts` | Direct TTY dispatch | Current `runCli()` is not rewritten |
| CLI ↔ handoff contract | Zod parse | Owns bounds and exclusive-mode validation |
| CLI ↔ Git handoff | Typed request/result | Returns pinned comparison, review key, reader/lifetime—not render hunks |
| Git handoff ↔ comparison | Resolved-snapshot builder | One verification/inventory/freezing authority |
| comparison ↔ inventory | OIDs + optional pathspecs + runner/reader | Interactive passes no pathspec/overlay |
| launch ↔ app | Optional attached context | Absence yields current app behavior |
| app/capabilities ↔ stores | Caller storage key | Existing document schemas remain unchanged |
| capabilities ↔ object reader | Existing reader interface | Patch reader is overlay-configured and lives through export verification |
| routes ↔ completion | One-shot callback after response flush | No public completion endpoint/polling |
| Vue ↔ Fastify | Existing authenticated client | Session marker changes label/action intent only |
| export ↔ CLI stdout | Receipt → canonical file bytes | Existing serializer is the single authority |

## Scaling and Resource Considerations

This is a per-repository, per-human, short-lived local process. Input size and concurrent local processes—not user count—are relevant.

| Concern | Normal review | Large repository/patch | Multiple processes |
|---------|---------------|------------------------|--------------------|
| stdin memory | One bounded request | Reject above explicit byte cap before JSON parse; no streaming parser yet | Independent process memory |
| Git output | Existing caps/machine protocols | Raise only measured per-call limits; keep global defaults | Immutable real objects; isolated temp overlays |
| file content | Existing lazy blob reads | Existing oversized/non-text availability | Capabilities remain per process |
| patch overlay | None for revision/interactive | Temp objects/index live for session only | Unique temp directories; `finally` cleanup |
| drafts | Atomic replacement/revision checks | Same schema/rules | Scoped keys prevent cross-scope collision |
| exports | Atomic pair publication | Same canonical bytes/Markdown | Full review key prevents scope collision |
| completion | One promise | Constant memory | One primitive per CLI; no registry |

### Scaling Priorities

1. **First limit: request/patch bytes.** Bound stdin and retain Git timeout/output controls. Do not add chunked JSON before a real accepted patch exceeds the limit.
2. **Second limit: inventory size.** Keep lazy blob reads and current non-reviewable classifications; native pathspecs reduce work early.
3. **Not a target: service scale.** Do not split the CLI/server/UI or add a daemon.

## Dependency-Ordered Implementation Phases

The minimal safe build order is five slices. Each preserves the interactive path.

### Phase 1: Request Contract and Scoped Identity

**Build:** strict versioned handoff union; bounded fields; exact fingerprint/review key; optional attached session marker; scoped receipt path validation.

**Why first:** Every later layer needs one trusted request type and collision-free namespace. Deferring identity causes draft/export migration later.

**Compatibility boundary:** No runtime dispatch changes; all current interactive keys and payloads remain valid.

### Phase 2: Both Git Modes to `PinnedComparison`

**Build:** extract resolved-snapshot builder; add identical native pathspecs to raw/numstat; implement revision ancestry semantics; add controlled runner overlay; implement reverse/forward patch checks, temp index/object cleanup, deterministic synthetic commit, overlay inventory/reader.

**Why second:** Both modes must converge on a fully reviewable immutable comparison before server/UI work.

**Compatibility boundary:** Interactive selection still resolves sources and merge base exactly as today, then calls the shared builder with no pathspecs/overlay.

### Phase 3: Scoped Persistence and Export Reuse

**Build:** optional draft storage key; optional export stable name; capability propagation of review key/object reader; existing exported `comparisonKey` set to review key; canonical JSON/Markdown unchanged.

**Why third:** Attached UI must not open before its comments/result can persist without colliding with other scopes.

**Compatibility boundary:** Missing options retain current draft filenames, `<base>..<head>` export directories, receipts, and export bytes.

### Phase 4: Attached Lifecycle and Stdout Delivery

**Build:** one-shot completion; optional launch/app/routes context; success completion after response flush; signal/failure cancellation; receipt/path/hash/canonical validation; EPIPE/backpressure-aware stdout; overlay disposal in every terminal path; all attached diagnostics on stderr.

**Why fourth:** Completion depends on stable publication and receipt paths from Phase 3.

**Compatibility boundary:** Without attached context, export routes and server shutdown remain unchanged.

### Phase 5: Ingress Dispatch and Conditional Finish UI

**Build:** TTY/non-TTY dispatch; bounded stdin orchestration; Vue attached marker; explicit Finish review label/help using the existing export call; successful finish closes the attached session.

**Why last:** This user-visible cutover should connect only complete contracts: request → pinned comparison → scoped draft → published export → stdout.

**Compatibility boundary:** TTY launch still enters discovery, ordered picker, confirmation, browser launch, interactive Export, and signal shutdown exactly as before.

### Ordering Summary

```text
request schema + review key
          ↓
mode normalization to PinnedComparison + optional overlay
          ↓
scope-safe draft/export publication
          ↓
one-shot completion + canonical stdout + cleanup
          ↓
TTY dispatch + Finish review UI
```

Do not start with the button or stdin detection. Without the first three layers, a superficially working handoff can corrupt draft scope, emit noncanonical results, or render patch data through a second model.

## Compatibility Checklist

- TTY launch still discovers candidates, prompts Base then Head, confirms, and opens the browser as today.
- interactive selections still compare merge base to head; only revision handoff uses exact base-to-head ancestry.
- interactive terminal URL/fallback output remains unchanged.
- Fastify still binds only `127.0.0.1:0` with current security.
- browser requests still use shared Zod API contracts and bearer token.
- changed files, modes, rename/copy metadata, availability, blob reads, Monaco mapping, comments, summaries, and anchors remain on current implementations.
- current drafts remain readable at current comparison-key paths.
- interactive exports remain `.compare/exports/<base>..<head>/review.{json,md}`.
- interactive Export does not stop the server.
- attached Finish does not complete on conflicts, acknowledgements, failed publication, tab close, or disconnect.
- patch object overlays remain alive through anchor verification/export and are disposed on every exit.
- successful attached stdout is exactly one canonical `compare/export` v1 document; every diagnostic and token-bearing URL is stderr-only.
- no agent HTTP API, headless path, arbitrary commit composition, or detached patch launch is added.

## Sources

### Existing Compare implementation (primary integration evidence)

- `src/cli/run.ts` — Commander action, interactive loop, launch, loopback bind, browser output, shutdown.
- `src/git/comparison.ts` — revision resolution, merge-base policy, object verification, inventory creation, `PinnedComparison` boundary.
- `src/git/inventory.ts` — paired native raw/numstat commands, `--` boundary, rename/copy policy, exact paths, availability.
- `src/git/runner.ts` — sole native-Git subprocess boundary, stdin, safe environment, aborts, timeouts, caps.
- `src/domain/comparison-key.ts` — domain-separated length-framed base/head persistence identity.
- `src/server/app.ts`, `src/server/routes.ts`, `src/server/capabilities.ts` — app construction, authenticated routes, object capabilities, draft/export acceptance and receipts.
- `src/server/draft-loader.ts`, `src/server/draft-store.ts`, `src/server/export-store.ts` — repository-local keying and atomic persistence/publication.
- `src/contracts/comparison.ts`, `src/contracts/api.ts`, `src/contracts/draft.ts` — shared pinned comparison, session, draft, export, receipt schemas.
- `src/export/review-export.ts`, `src/export/render-review-markdown.ts` — `ReviewExportV1`, canonical JSON validation/serialization, hashing, Markdown projection.
- `src/web/App.vue`, `src/web/api/client.ts`, `src/web/components/ExportSection.vue` — browser bootstrap, authenticated export, revision/drift states, action UI.

### Native Git documentation

- [git-apply](https://git-scm.com/docs/git-apply) — `--check`, `--cached`, `--reverse`, `--binary`, stdin patches.
- [git-write-tree](https://git-scm.com/docs/git-write-tree) — writes a tree from an index without updating worktree/ref.
- [git-commit-tree](https://git-scm.com/docs/git-commit-tree) — creates a commit from a tree/parent and emits its OID without a ref update.
- [git environment variables](https://git-scm.com/docs/git#Documentation/git.txt-codeGITOBJECTDIRECTORYcode) — alternate index/object database selection used by the disposable patch overlay.
- [Git glossary: pathspec](https://git-scm.com/docs/gitglossary#Documentation/gitglossary.txt-aiddefpathspecapathspec) — native pathspec syntax and magic remain Git's authority.

---
*Architecture research for: Compare v1.3 Agent Review Handoff*
*Researched: 2026-08-04*
