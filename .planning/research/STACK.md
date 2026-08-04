# Stack Research

**Domain:** Agent-to-human review handoff for Compare's local-first Node.js CLI
**Milestone:** v1.3 Agent Review Handoff
**Researched:** 2026-08-04
**Confidence:** MEDIUM — recommendations are grounded in the installed repository, current primary Node/Git/Fastify/Zod documentation, and registry metadata. The isolated Git object-overlay composition still needs implementation proof at Compare's Git 2.43.0 floor.

## Executive Recommendation

**Add no dependency and perform no v1.3-driven upgrade.** The confirmed handoff is an integration of capabilities Compare already ships or requires:

- Node.js 24 can consume one EOF-delimited, size-bounded stdin document and write exact bytes to stdout while diagnostics remain on stderr.
- Installed `zod@4.4.3` can enforce a strict, versioned request with exactly one discriminated mode.
- Installed Git can safely resolve explicit commits, enforce base-to-head ancestry, honor native pathspecs, parse and validate unified patches, and create a patched tree through an isolated temporary index/object overlay.
- Existing Fastify 5 can expose a token-protected **Finish review** browser route and signal completion only in a route-level `onResponse` hook, after the response has been sent.
- Existing review-export code already owns the output schema and canonical JSON bytes; stdout should reuse those bytes directly.

Do not introduce a JSON framing library, Git library, unified-diff parser, WebSocket/IPC layer, temporary worktree, or second export serializer. Existing interactive launch, repository-local drafts, browser UI, Markdown export, and loopback security remain in place.

## Stack Decision Summary

| Concern | Existing/runtime-native choice | v1.3 recommendation | Dependency change |
|---------|--------------------------------|---------------------|-------------------|
| Agent request framing | Node `process.stdin`, `Buffer`, fatal `TextDecoder`, `JSON.parse` | Read exactly one bounded JSON value through EOF when stdin is piped; reject empty, oversized, malformed, non-UTF-8, or schema-invalid input before bind/browser-open | None |
| Request contract | `zod@4.4.3` | Add shared strict schemas for `schemaVersion: 1` and a discriminated `revisions`/`patch` mode union | None |
| Explicit revisions | Installed Git through existing `GitRunner` | Resolve each untrusted revision to one full commit OID and require base to be an ancestor of head | None |
| Path filtering | Git pathspec arguments | Forward requested native pathspec strings verbatim after `--` to every inventory diff command | None |
| Unified patch parsing | `git apply` | Let Git parse and validate the supplied patch against a disposable index seeded from current committed `HEAD` | None |
| Patch materialization | Git alternate index/object environment plus Node temp-directory APIs | Produce a temporary patched tree without changing the worktree, real index, refs, or repository object store | None |
| Browser completion | Existing `fastify@5.10.0` routes/hooks | Add an authenticated human-UI Finish route; resolve attached completion from route-level `onResponse`, then close Fastify | None |
| Review result | Existing `ReviewExportV1Schema`, `buildReviewExportV1`, `canonicalizeReviewExport` | Reuse the same validated document and exact canonical bytes on stdout | None |
| Diagnostics | `process.stderr` and existing injected output seams | Send URL, browser fallback, warnings, and failures only to stderr in attached mode | None |

## Recommended Stack

### Core Technologies

| Technology | Version | Status | v1.3 purpose | Why recommended |
|------------|---------|--------|--------------|-----------------|
| Node.js | Project `>=24`; installed `24.15.0`; current Node 24 LTS release `24.19.0` | Existing; keep | stdin/stdout/stderr, bounded buffers, child-process lifecycle, temp paths, cleanup, browser-process lifetime | Node 24 already provides async-readable iteration, byte-oriented writes, `AbortSignal`, `node:fs/promises`, `node:os`, and `node:child_process`. There is no missing runtime primitive. |
| Git CLI | Project floor `>=2.43.0`; installed `2.50.1 (Apple Git-155)`; current official docs `2.55.0` | Existing prerequisite; keep | Revision authority, ancestry, pathspecs, unified-patch parser/validator, temporary index, tree/blob materialization, inventory | Git must remain the semantic authority. The documented commands used here exist at the project floor; current 2.55 docs identify no required replacement library. |
| TypeScript | Installed and current npm `latest` `7.0.2` | Existing; keep | Typed agent request, attached-session completion, and Git-overlay contracts | The handoff adds contracts and orchestration inside the current language boundary, not a new execution environment. |

### Supporting Libraries and Native APIs

| Library or API | Version | Status | Purpose | When to use |
|----------------|---------|--------|---------|-------------|
| Zod `z.strictObject`, `z.discriminatedUnion` | Installed/current `4.4.3` | Existing; reuse | Reject unknown fields and enforce exactly one request mode | Parse the decoded stdin value once at the trust boundary. Derive TypeScript types from the schema. Do not separately maintain interfaces. |
| Commander | Installed/current `15.0.0` | Existing; keep | Existing CLI command lifecycle | Retain the current interactive command. Dispatch piped stdin to the attached flow without adding a second CLI framework. |
| Fastify route-level `onResponse` and `close()` | Installed `5.10.0`; current `5.11.2` | Existing; reuse, no v1.3 upgrade | Signal Finish only after the browser receives its response; drain and close the loopback server | Add the Finish action to the existing authenticated session API. Do not expose an agent-oriented HTTP endpoint. |
| Vue | Installed `3.5.39`; current `3.5.40` | Existing; reuse, no v1.3 upgrade | Render the explicit human **Finish review** control | A normal component event and existing API client are sufficient. No state-management or UI package is needed. |
| `process.stdin` / Readable async iterator | Node 24 built-in | Existing; reuse | Consume all chunks until EOF | Use only for attached input. Count bytes as chunks arrive and stop at an explicit request ceiling before concatenation/decoding. |
| `TextDecoder('utf-8', { fatal: true })` + `JSON.parse` | Node 24 built-ins | Existing; reuse | Strict UTF-8 and one-document JSON decode | Decode once after EOF and after the byte bound passes. `JSON.parse` naturally rejects concatenated JSON documents and trailing non-whitespace. |
| `process.stdout.write` | Node 24 built-in | Existing; reuse | Emit exact canonical review bytes | Write the `Uint8Array` returned by `canonicalizeReviewExport`; await the write callback. Do not call `console.log`, append a newline, or call `process.exit()`. |
| `process.stderr.write` / `console.error` | Node 24 built-ins | Existing; reuse | Human-readable diagnostics | Route URL, browser-open fallback, security denials, validation errors, shutdown failures, and progress here only. |
| Existing `GitRunner` | Internal (`src/git/runner.ts`) | Existing; extend narrowly | Safe argument-array Git invocation, bounded output, timeout, cancellation, stdin bytes | Reuse for every Git operation. Add only the minimum per-session environment overlay needed by patch mode; preserve safe config, `shell: false`, limits, and abort behavior. |
| `node:fs/promises.mkdtemp`, `mkdir`, `rm`; `node:os.tmpdir`; `node:path` | Node 24 built-ins | Existing; reuse | Lifetime-bound temporary index/object storage | Create patch-session storage outside the repository before `git apply`; remove it after Fastify closes or any failure/signal occurs. |
| Existing export functions | Internal (`src/export/review-export.ts`) | Existing; reuse | Validate and canonicalize the finished review | Share document generation between file publication and attached stdout instead of reading a published file back or adding another serializer. |

### Development Tools

No new development tool is warranted for v1.3. The existing TypeScript/Vite build remains sufficient. This research does not recommend a protocol generator, code generator, patch fixture package, process supervisor, or alternate test framework.

## Integration Patterns

### 1. JSON stdin framing: one document, delimited by EOF

Use the simplest framing that matches the contract:

1. Preserve the current interactive path when launched from an interactive terminal.
2. For piped stdin, consume `process.stdin` with `for await ... of` until EOF.
3. Track cumulative bytes before retaining/concatenating further chunks; reject over the product's explicit request ceiling.
4. Decode once with fatal UTF-8 handling, then call `JSON.parse` once.
5. Validate the parsed `unknown` with an installed Zod strict discriminated union.
6. Reject before server bind or browser launch if framing or validation fails.

This is **one JSON text, not NDJSON and not a length-prefixed stream**. The CLI never needs to parse another request during the same process, so a streaming JSON parser would add state and ambiguity without reducing a bounded one-document requirement.

Recommended schema shape:

- fixed request identity/version fields (`kind`, `schemaVersion: 1`);
- literal discriminator `mode: 'revisions' | 'patch'`;
- a strict revisions branch containing explicit `base`, `head`, and optional `pathspecs`;
- a strict patch branch containing the exact patch text and no revision/pathspec fields;
- strict nested objects and non-empty strings; reject NUL because neither argv nor repository paths can contain it.

`z.strictObject` matters: ordinary `z.object` strips unknown fields, which could silently accept both-mode or misspelled fields. `z.discriminatedUnion` makes mutual exclusivity structural rather than a hand-written post-parse check.

### 2. Contiguous explicit revisions and native pathspecs

Keep native Git as authority and reuse the current repository discovery/object-format checks:

1. Resolve each untrusted revision with the semantic equivalent of `git rev-parse --verify --end-of-options <revision>^{commit}`. The commit peel rejects non-commit objects; `--end-of-options` prevents a revision beginning with `-` from becoming an option.
2. Pin both results to full object IDs once. Never use the moving revision text again for inventory or export identity.
3. Require `git merge-base --is-ancestor <baseOid> <headOid>` to exit 0. Exit 1 means the explicit pair is not one contiguous ancestry range and must be rejected; other nonzero statuses are Git failures.
4. Since the accepted base is an ancestor, use the pinned base itself as the comparison base rather than recomputing unrelated branch-selection merge-base behavior.
5. Append optional native pathspec strings after a literal `--` to **both** existing `git diff --raw -z` and `git diff --numstat -z` inventory calls. Forward them unchanged so Git pathspec magic, exclusions, and case behavior remain native semantics.

Do not pre-expand globs, normalize separators, reinterpret pathspec magic, or filter the completed inventory only in JavaScript. Filtering at both Git protocol calls keeps raw metadata and numstat joins consistent and avoids reading excluded blobs.

### 3. Unified patch parsing, validation, and materialization

Do not parse unified diff syntax in TypeScript. Use a disposable Git index and isolated object directory so Git validates against current committed `HEAD` while user state remains untouched:

1. Pin current `HEAD` to a full commit OID and locate the repository's actual object directory through Git.
2. Create one session temp directory with an index path and object directory.
3. Scope patch-session Git calls with:
   - `GIT_INDEX_FILE=<temp>/index`;
   - `GIT_OBJECT_DIRECTORY=<temp>/objects`;
   - `GIT_ALTERNATE_OBJECT_DIRECTORIES=<repository objects>`.
4. Seed the alternate index with `git read-tree <headOid>`.
5. Feed the exact UTF-8 patch bytes on stdin to `git apply --cached --check -`. This asks Git to parse and test applicability against the seeded index without touching the worktree.
6. On success, feed the same bytes to `git apply --cached -` with no permissive transformation flags, then call `git write-tree` to obtain the patched tree OID.
7. Run the existing raw/numstat inventory and object-reader paths between pinned `HEAD` and the patched tree while retaining the object overlay for the attached session.
8. Close the server, abort active Git, and remove the temp directory on Finish, signal, validation failure, browser-launch failure, or stdout failure.

`GIT_OBJECT_DIRECTORY` receives new patch blobs and the tree; `GIT_ALTERNATE_OBJECT_DIRECTORIES` permits reads from the repository object database but documents that new objects are not written to alternates. This avoids changes to the real index, worktree, refs, or repository object store. A synthetic commit is unnecessary because `git diff` accepts tree-ish objects.

Use fixed `git apply` arguments. Do **not** enable `--3way`, `--reject`, `--ignore-whitespace`, `--recount`, `--unsafe-paths`, or `--whitespace=fix`: those can merge, partially apply, reinterpret, or rewrite the requested patch instead of reviewing the exact input. Git's default unsafe-path rejection should remain enabled.

The existing `parseRawDiff` is still useful *after* Git materializes the patched tree. It parses Git's NUL-delimited `--raw` machine output; it is not a unified-patch parser and should not be expanded into one.

### 4. Attached CLI completion

Reuse the current loopback server, session token, origin/host checks, and browser UI:

1. Agent mode creates one one-shot completion promise before server launch.
2. Add a token-protected browser route for **Finish review** under the existing session API.
3. The handler validates the current accepted draft and builds the same `ReviewExportV1` document used by canonical export. Validation/conflict responses keep the browser session open.
4. A route-level Fastify `onResponse` resolves the one-shot promise only for a successful Finish response. Fastify documents `onResponse` as running after the response is sent.
5. The attached CLI awaits that promise, then awaits `app.close()` so in-flight requests drain.
6. Interactive launch keeps its current Ctrl+C-owned lifetime and does not wait for or emit an agent result.

No WebSocket, SSE, polling timer, child IPC, lockfile watcher, or agent-controlled HTTP API is needed. The only new route represents an explicit human UI action inside the already authenticated browser session.

### 5. stdout/stderr discipline

Treat stdout as a protocol channel in attached mode:

- **stdout:** exactly one canonical `ReviewExportV1` byte sequence from `canonicalizeReviewExport`, and nothing else. Do not append `\n`; the current canonical parser compares exact byte length and representation.
- **stderr:** URL, fallback instructions, warnings, validation details, Git failures, security diagnostics, and shutdown errors.
- Await the `process.stdout.write(bytes, callback)` completion before allowing natural process exit.
- Set `process.exitCode` for failures; do not call `process.exit()`, which Node documents can truncate pending stdout.
- Keep existing interactive output behavior unchanged by injecting a stderr diagnostic writer only into the attached launch path.

Do not serialize with `JSON.stringify` at the CLI boundary. The repository already has a canonical serializer with stable UTF-16 key ordering, I-JSON checks, Zod validation, and exact-byte parsing.

## Installation

No install, removal, or version change is required for v1.3.

```text
package.json: unchanged
package-lock.json: unchanged
```

Fastify `5.11.2` and Vue `3.5.40` are newer than the pinned `5.10.0` and `3.5.39`, respectively, on the research date, but neither adds a capability needed by this handoff. Handle routine upgrades separately rather than coupling them to the protocol change. Installed Zod `4.4.3`, Commander `15.0.0`, and TypeScript `7.0.2` already match npm `latest`.

## Alternatives Considered

| Recommended | Alternative | When the alternative would be appropriate | Why not for v1.3 |
|-------------|-------------|-------------------------------------------|------------------|
| EOF-delimited bounded JSON + `JSON.parse` | NDJSON, length-prefix framing, `stream-json` | Multiple requests or unbounded documents over one long-lived channel | Contract has exactly one request and one response per process. Extra framing creates another protocol. |
| Installed Zod strict union | JSON Schema validator, TypeBox, hand-written guards | A project without a shared runtime-schema authority | Compare already uses Zod across trust boundaries and exports. |
| Existing `GitRunner` + Git CLI | `simple-git`, `isomorphic-git`, `nodegit`/libgit2 | A product that cannot rely on installed Git or intentionally accepts different Git semantics | Compare requires installed Git and already owns safe subprocess, cancellation, and byte-limit behavior. |
| `git apply` | `parse-diff`, `gitdiff-parser`, `unidiff`, custom parser | A detached patch viewer that intentionally does not validate against a repository | Patch grammar, quoted paths, modes, renames, binary markers, object formats, and applicability belong to Git. Detached patches are out of scope. |
| Temp index + temp object overlay | Temporary worktree/clone, stash, real-index mutation | A workflow that explicitly needs a checkout users can edit | Review is read-only. Worktrees/clones are slower and introduce cleanup/ref/worktree metadata; stashing or real-index use risks user state. |
| Tree OID from `write-tree` | `commit-tree` synthetic commit | A later feature that explicitly needs commit graph identity for a generated revision | Existing inventory reads tree-ish objects; writing an unnecessary commit adds identity and lifecycle questions. |
| Fastify `onResponse` one-shot completion | WebSocket, SSE, polling, file watcher | Continuous bidirectional updates or many completion events | Finish is one browser action and one terminal result. Existing HTTP response lifecycle is sufficient. |
| Existing canonical serializer | `fast-json-stable-stringify`, `json-stable-stringify`, ordinary `JSON.stringify` | A project without an established canonical byte contract | Compare already validates and canonicalizes its review export; a second serializer risks byte drift. |
| Awaited `process.stdout.write` | `console.log`, stdout logger, forced `process.exit` | Human-only output with no machine contract | Attached stdout must contain only exact canonical JSON and must not be truncated. |

## What NOT to Add or Change

| Avoid | Specific problem | Use instead |
|-------|------------------|-------------|
| JSON streaming/framing dependency | One bounded EOF-delimited document does not need incremental grammar state | Readable async iteration + byte ceiling + fatal decode + `JSON.parse` |
| New schema package | Duplicates Zod and creates competing TypeScript types | `z.strictObject` + `z.discriminatedUnion` |
| Git JavaScript implementation/wrapper | Adds a second semantics/error model without removing Git subprocesses | Existing `GitRunner` and fixed native Git argv |
| JavaScript unified-diff parser | Easy to diverge on extended headers, paths, modes, binary patches, and applicability | `git apply --cached --check` |
| Real index/worktree patch application | Can overwrite or conflict with developer state | Temporary `GIT_INDEX_FILE` and isolated object directory |
| Temporary Git worktree or clone | More filesystem I/O, metadata, cleanup, and ref behavior than a read-only review needs | Temporary index/object overlay |
| Synthetic refs or commits | Leaves repository-visible or unreachable object state and invents history | Diff pinned commit/tree against temporary patched tree |
| JS glob/minimatch package | Reinterprets native pathspec semantics and can disagree with Git | Pass pathspec arguments after `--` to Git |
| WebSocket/Socket.IO/SSE | Long-lived transport for a one-shot human completion event | Existing authenticated POST + route-level `onResponse` |
| Agent-facing HTTP control API | Violates confirmed boundary and expands attack/lifecycle surface | stdin request, human browser UI, stdout result |
| New logger | Risks stdout contamination or duplicate formatting | Existing injected output functions; stderr in attached mode |
| Fastify/Vue upgrade inside v1.3 | Unrelated lockfile and regression surface | Keep pinned versions; routine maintenance separately |
| Headless browser/review path | Explicitly out of scope and bypasses the human handoff | Existing Vue/Monaco browser session |

## Stack Patterns by Request Variant

**Interactive terminal launch:**
- Use the current Commander/Inquirer selection and current session lifetime unchanged.
- Emit no canonical review document merely because the browser closes or the process receives EOF.

**Attached revisions request:**
- Strictly parse the versioned branch, resolve full commit OIDs, require `base` ancestor of `head`, pass native pathspecs after `--`, and use existing comparison/inventory/export code.
- Reject non-contiguous compositions rather than accepting commit lists, revsets, or cherry-pick synthesis.

**Attached patch request:**
- Pin current committed `HEAD`, validate/materialize the exact patch in an isolated temporary Git index/object overlay, and keep that overlay alive only for the browser session.
- Accept no pathspec field; the exact patch itself defines the reviewed file set.

**Successful Finish:**
- Respond to the authenticated browser first, close Fastify, write exactly one canonical JSON document to stdout, await the write, clean temporary resources, and exit naturally with status 0.

**Invalid request, Git validation failure, signal, or failed Finish validation:**
- Write diagnostics only to stderr and set a nonzero exit status when terminal.
- Never emit partial JSON or a placeholder result to stdout.

## Version Compatibility

| Package/API | Compatible with | v1.3 guidance |
|-------------|-----------------|---------------|
| Node `>=24` | Commander `15.0.0`, Fastify `5.10.0`, Zod `4.4.3`, TypeScript `7.0.2` | Keep project engine floor. Node 24 contains all standard APIs recommended here. |
| Git `>=2.43.0` | `rev-parse --verify --end-of-options`, `merge-base --is-ancestor`, `apply --cached --check`, alternate index/object environment, `read-tree`, `write-tree` | Keep the existing floor and positive capability philosophy. Add capability probes only for exact commands/environment behavior the production implementation relies on; do not raise the version solely because current docs are 2.55.0. |
| Zod `4.4.3` | TypeScript `7.0.2` | Use idiomatic `z.strictObject`; do not use stripping object schemas for the stdin trust boundary. |
| Fastify `5.10.0` | Route-level `onResponse`, Promise-returning `close()` | Installed version documents both required lifecycle APIs. No update is required. |
| Vue `3.5.39` | Existing Vite/UI stack | A Finish button and existing API client need no additional UI package or minor upgrade. |
| Existing `canonicalizeReviewExport` | Existing `ReviewExportV1Schema` | Write its bytes directly. Appending whitespace or using a different serializer breaks Compare's exact canonical-byte contract. |
| Existing `GitRunner` | Patch overlay environment | Extend the runner with a narrow, trusted internal environment input rather than accepting request-controlled environment variables. Preserve `shell: false`, timeout, limits, disabled hooks/fsmonitor/external diff, and `AbortSignal`. |

## Sources

### Primary documentation and current version sources

- [Node.js releases](https://nodejs.org/en/about/previous-releases) — Node `24.19.0` is the latest Node 24 LTS release on 2026-08-04; Node 24 remains a supported LTS line.
- [Node.js 24 process documentation](https://nodejs.org/docs/latest-v24.x/api/process.html#processstdin) — `process.stdin`, `stdout`, `stderr`, `exitCode`, and the warning that `process.exit()` can truncate pending stdout.
- [Node.js 24 stream documentation](https://nodejs.org/docs/latest-v24.x/api/stream.html#readablesymbolasynciterator) — async iteration fully consumes a Readable; `writable.write` callback/backpressure semantics.
- [Git `rev-parse`](https://git-scm.com/docs/git-rev-parse) — `--verify`, commit peeling, and `--end-of-options` for untrusted revision names.
- [Git `merge-base`](https://git-scm.com/docs/git-merge-base) — `--is-ancestor` exit semantics for an explicit ancestry range.
- [Git `diff`](https://git-scm.com/docs/git-diff) — two-tree/tree-ish comparison and native pathspec arguments after `--`; current docs last updated for Git 2.55.0.
- [Git `apply`](https://git-scm.com/docs/git-apply) — patch input on stdin, `--check`, `--cached`, unsafe-path behavior, and flags that alter application; page includes compatibility history through project floor 2.43.0 and is current at 2.55.0.
- [Git environment variables](https://git-scm.com/docs/git#Documentation/git.txt-GITINDEXFILE) — `GIT_INDEX_FILE`, `GIT_OBJECT_DIRECTORY`, and `GIT_ALTERNATE_OBJECT_DIRECTORIES`, including the guarantee that new objects are not written to alternates.
- [Git `read-tree`](https://git-scm.com/docs/git-read-tree) and [Git `write-tree`](https://git-scm.com/docs/git-write-tree) — seed an index from a tree and materialize an index as a tree object.
- [Fastify 5.10 hooks](https://fastify.dev/docs/v5.10.x/Reference/Hooks/#onresponse) — `onResponse` runs after a response is sent and can be route-local.
- [Fastify server `close`](https://fastify.dev/docs/v5.10.x/Reference/Server/#close) — Promise-returning graceful listener closure.
- [Zod 4 objects](https://zod.dev/api#objects) and [Zod 4 migration guide](https://zod.dev/v4/changelog) — `z.strictObject` rejects unknown keys and is the Zod 4 DTO form; discriminated unions provide literal-mode selection.
- npm registry metadata: [Fastify](https://registry.npmjs.org/fastify/latest), [Vue](https://registry.npmjs.org/vue/latest), [Zod](https://registry.npmjs.org/zod/latest), [Commander](https://registry.npmjs.org/commander/latest), [TypeScript](https://registry.npmjs.org/typescript/latest) — current `latest` versions on the research date.

### Repository evidence

- [`package.json`](../../package.json) — exact installed dependency versions and Node `>=24` engine.
- [`src/git/runner.ts`](../../src/git/runner.ts) — existing bounded, cancellable, no-shell Git process boundary with stdin bytes and separated stdout/stderr.
- [`src/git/comparison.ts`](../../src/git/comparison.ts) — existing full-OID pinning, commit verification, merge-base handling, and comparison descriptor boundary.
- [`src/git/inventory.ts`](../../src/git/inventory.ts) — existing paired raw/numstat Git inventory calls and object-reader integration.
- [`src/git/raw-diff.ts`](../../src/git/raw-diff.ts) — byte-safe parser for Git's NUL-delimited raw protocol, not unified patch syntax.
- [`src/cli/run.ts`](../../src/cli/run.ts) — existing Commander entry, loopback Fastify launch, browser open, injectable output, and signal shutdown lifecycle.
- [`src/server/app.ts`](../../src/server/app.ts), [`src/server/routes.ts`](../../src/server/routes.ts), and [`src/server/security.ts`](../../src/server/security.ts) — current authenticated loopback session boundary to extend with human Finish.
- [`src/export/review-export.ts`](../../src/export/review-export.ts) — existing Zod-backed canonical export builder/parser and exact canonical-byte serializer.

### Context7 lookups

- `/websites/nodejs_latest-v24_x_api` — process standard streams, async-readable iteration, writable callbacks, and process-exit truncation.
- `/git/htmldocs` — revision verification/ancestry, patch validation, temporary index, and object-overlay environment.
- `/fastify/fastify` — `onResponse` and graceful `close()` lifecycle.
- `/colinhacks/zod` — Zod 4 strict objects and discriminated unions.

---
*Stack research for: Compare v1.3 Agent Review Handoff*
*Researched: 2026-08-04*
