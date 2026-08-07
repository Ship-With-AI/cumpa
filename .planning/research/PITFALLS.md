# Pitfalls Research

**Domain:** Agent-submitted Git ranges and repository-grounded exact patches for an existing local-first code review CLI
**Researched:** 2026-08-04
**Confidence:** HIGH

## Scope and Phase Vocabulary

This document covers only the additions needed for v1.3 Agent Review Handoff. Existing interactive launch, browser review, loopback security, durable comments, draft persistence, and canonical export behavior remain authoritative.

The phase names below are research labels for sequencing the work:

1. **Request Protocol and Range Grounding** — stdin mode selection, schema validation, revision resolution, pathspec handling, and stdout/stderr ownership.
2. **Patch Grounding and Review Model** — exact-patch validation, safe materialization, file inventory, provenance, durable anchors, and scoped persistence.
3. **Attached Lifecycle and Canonical Completion** — browser reconnection, explicit Finish semantics, cancellation, serialization, response flushing, and shutdown.
4. **Adversarial Integration Gate** — end-to-end scenarios covering malformed, ambiguous, drifting, interrupted, binary, rename, mode-change, and output-integrity cases.

## Critical Pitfalls

### Pitfall 1: Agent input detection changes the existing interactive launch

**What goes wrong:**
The CLI waits for stdin when launched interactively, starts Inquirer while a piped request is being decoded, or treats empty/partial piped input as an interactive launch. The existing human command can hang or change behavior, and the agent path can emit prompts into a machine protocol.

**Why it happens:**
TTY detection, Commander parsing, Inquirer startup, and stream consumption are often added independently. stdin is a single-owner stream: once a prompt library or JSON decoder consumes it, the other mode cannot reliably recover it.

**How to avoid:**
Choose the input owner before starting Inquirer. Preserve the current interactive path when stdin is a TTY. For non-TTY stdin, read one bounded UTF-8 document, reject malformed encoding, trailing non-whitespace, or multiple JSON values, then validate a strict versioned discriminated union with exactly one mode: `range` or `patch`. Reject unknown fields at the request trust boundary. An invalid attached request must produce diagnostics only on stderr and zero stdout bytes.

**Warning signs:**
- Inquirer is imported or initialized before attached-mode detection.
- A timeout is used to guess whether stdin contains a request.
- Empty piped input falls through to the branch picker.
- A schema permits both revision and patch fields, or silently strips unknown fields.
- Prompt text appears when stdout is captured.

**Phase to address:**
Request Protocol and Range Grounding; exercise both TTY and pipe entry paths again in the Adversarial Integration Gate.

---

### Pitfall 2: Free-form revision syntax creates ambiguous or non-contiguous comparisons

**What goes wrong:**
A field described as a revision accepts expressions such as `A..B`, `A...B`, `^A`, reflog selectors, or a name that resolves differently as a ref and a path. Cumpa reviews a set of commits rather than two explicit endpoints, selects the wrong object type, or changes meaning after refs move.

**Why it happens:**
Git revision syntax is deliberately rich. Commands interpret two-dot and three-dot notation differently, while `git diff A..B` is only an endpoint comparison and not the same conceptual operation as a revision walk. Refname resolution also has precedence rules that make short names ambiguous.

**How to avoid:**
The protocol must carry separate `baseRevision` and `headRevision` strings, never a revset. Resolve each independently with native Git using an argument-array invocation equivalent to `git rev-parse --verify --end-of-options "$value^{commit}"`. Require exactly one result, reject non-commit objects, and immediately pin both to full object IDs. Every later Git operation, persisted scope, and export provenance must use those pinned IDs rather than re-resolving the submitted names.

**Warning signs:**
- Request examples contain `..`, `...`, `^`, or a single “range” string.
- A revision is passed directly to `git diff` before `rev-parse --verify`.
- Short submitted names are persisted instead of full OIDs.
- Refreshing the UI after a branch moves changes the reviewed bytes.
- A tag pointing to a blob or tree is accepted as an endpoint.

**Phase to address:**
Request Protocol and Range Grounding.

---

### Pitfall 3: Pathspec filters become option injection or silently change review scope

**What goes wrong:**
A filter beginning with `-` is parsed as a Git option, pathspec magic changes matching rules, exclusions expand the effective scope unexpectedly, or attribute-based pathspecs are evaluated against the working tree rather than the pinned tree. Two requests that appear equivalent review different files.

**Why it happens:**
Git pathspec is a language, not a list of plain relative paths. It supports magic such as `top`, `literal`, `glob`, `icase`, `attr`, and `exclude`; exclusions have special behavior when no positive pathspec exists. Attribute requirements are obtained from the working tree even when matching another tree.

**How to avoid:**
Pass every submitted pathspec as one argv element after `--`; never construct a shell string. Reject NUL bytes and bound count and byte length. Run from the discovered repository root with the existing safe Git runner and neutralize inherited Git environment variables that alter pathspec parsing. Define the supported native pathspec subset explicitly: either preserve all accepted pathspecs byte-for-byte with their documented Git semantics or reject unstable forms such as `attr:` rather than pretending they are ordinary globs. Materialize and persist the exact file inventory at launch. Repository-internal `.cumpa/` exclusion must remain authoritative and must not be defeated by user exclusions or magic.

**Warning signs:**
- Filters are concatenated into a command string.
- `--` is absent before filter arguments.
- Code rewrites slashes, glob characters, or `:(...)` magic.
- Scope is recalculated on every browser request.
- Draft identity records only base/head and omits filter scope.
- Attribute pathspec results vary with an unrelated worktree edit.

**Phase to address:**
Request Protocol and Range Grounding, with persistence consequences completed in Patch Grounding and Review Model.

---

### Pitfall 4: Treating an exact patch as only unified text hunks loses Git metadata

**What goes wrong:**
Binary changes appear as “Binary files differ” without bytes, renames are reconstructed as delete/add, executable-bit or symlink changes disappear, copy metadata is lost, quoted paths are decoded incorrectly, or rename swaps are applied in the wrong order. The displayed comparison is not the submitted patch.

**Why it happens:**
Git patch format carries meaning outside `@@` hunks: `old mode`, `new mode`, `new file mode`, `deleted file mode`, similarity indices, rename/copy headers, full blob IDs, and binary payloads. Extended headers may have no text hunks at all, and patch paths have Git quoting and prefix rules.

**How to avoid:**
Define the accepted payload as a documented Git-generated patch dialect capable of carrying full-index and binary data, equivalent to `git diff --full-index --binary` for supported changes. Let native Git validate and materialize it; do not build a second JavaScript patch parser as the semantic authority. Preserve exact old/new paths, old/new blob OIDs, modes, status, and similarity metadata in the existing changed-file model. Reject combined diffs and incomplete binary summaries explicitly. Keep content types that Cumpa cannot render visible as non-reviewable rather than dropping them.

**Warning signs:**
- Validation only searches for `diff --git` and `@@` lines.
- A patch with only mode headers produces no changed file.
- Rename, copy, or binary coverage is absent from acceptance scenarios.
- Paths are split on spaces or decoded by URL/path helpers.
- The implementation applies file sections sequentially in JavaScript.

**Phase to address:**
Patch Grounding and Review Model.

---

### Pitfall 5: `git apply --check` is mistaken for proof that a patch exactly describes the current repository

**What goes wrong:**
A patch applies with fuzz or whitespace tolerance but does not describe the current checked-out result; a forward check fails because the coding agent has already applied the change; a three-way fallback synthesizes a different result; or validation mutates the real index or worktree. Review bytes can drift between validation and display.

**Why it happens:**
`git apply --check` answers whether a patch can be applied under the selected options. It does not by itself prove that the patch's postimage equals the current repository. `--3way`, `--reject`, zero-context hunks, whitespace configuration, and index/worktree selection materially change that answer.

**How to avoid:**
Ground a submitted patch against the current repository by reverse-validating the already-applied change, then materializing the exact preimage/postimage in isolated Git state. Use a temporary index and temporary object directory with the real object database as an alternate; carry the resulting overlay object reader for the lifetime of the review. Never touch the user's real index or worktree. Disable semantic escape hatches: no three-way merge, reject files, unsafe paths, zero-context patches, or configuration-dependent whitespace loosening. Verify every declared postimage against current repository bytes and every reversed preimage against the isolated materialization. Snapshot identities and bytes once; detect repository changes before Finish rather than re-grounding silently. Bound patch size, file count, output, object creation, and execution time.

**Warning signs:**
- Validation is only `git apply --check patch` in the real worktree.
- `--3way`, `--reject`, `--unidiff-zero`, or `--unsafe-paths` is enabled.
- Tests need to reset the user's index after validation.
- The UI reads live filesystem files after patch validation.
- A context-mismatched patch succeeds because of whitespace settings.
- Temporary objects are deleted before the browser finishes reading blobs.

**Phase to address:**
Patch Grounding and Review Model; concurrency and cleanup are verified again in Attached Lifecycle and Canonical Completion.

---

### Pitfall 6: Scoped agent requests reuse the base/head-only draft identity

**What goes wrong:**
A filtered review opens comments from an unfiltered review, two different pathspec requests overwrite one another, or a patch-grounded session collides with an ordinary comparison. Comments and summaries attach to the wrong review scope.

**Why it happens:**
The current comparison key is intentionally based on the existing interactive comparison. v1.3 adds provenance dimensions that are material to identity: exact filters for range mode, or patch digest and grounding snapshot for patch mode.

**How to avoid:**
Do not change the identity of existing interactive launches. Introduce a domain-separated attached-request identity that includes protocol version and mode. Range identity includes pinned base/head OIDs and exact pathspec scope; patch identity includes a canonical patch digest plus repository grounding identity. Persist the provenance beside the versioned draft and export. Reuse the existing atomic replace and optimistic revision behavior. Never persist the bearer token, browser URL, port, process handle, or transient server state.

**Warning signs:**
- Attached code calls the existing `comparisonKey(base, head)` unchanged.
- Opening two differently filtered sessions shows the same draft revision.
- A patch digest is computed after line-ending or path normalization.
- Deleting a transient browser session deletes durable review comments.

**Phase to address:**
Patch Grounding and Review Model.

---

### Pitfall 7: Friendly CLI output corrupts canonical stdout

**What goes wrong:**
A startup banner, browser URL, progress indicator, warning, newline, shutdown message, or stack trace is mixed with the canonical review JSON. The coding agent cannot parse the result or receives different bytes from those persisted by Cumpa.

**Why it happens:**
The current interactive CLI can reasonably use console output, while an attached subprocess contract makes stdout a data channel. Global `console.log`, dependencies that print, and abrupt process termination bypass that distinction. On POSIX, writes to piped stdout are asynchronous; `process.exit()` can truncate them.

**How to avoid:**
In attached mode, reserve stdout exclusively for the exact canonical JSON bytes produced by the existing canonicalizer, with no extra newline. Route every diagnostic, browser notice, and recoverable error to stderr. Inject or centralize output sinks so the existing interactive path remains unchanged. Await stream backpressure and completion, handle stdout `error`/EPIPE as cancellation, and set exit status without calling `process.exit()` while output is pending. Persist and emit the same immutable byte buffer.

**Warning signs:**
- Attached code calls `console.log` or prints the browser URL.
- JSON is produced once for disk and separately with `JSON.stringify` for stdout.
- A snapshot expects a trailing newline not produced by the canonicalizer.
- Completion immediately calls `process.exit(0)`.
- A closed stdout pipe leaves the server running.

**Phase to address:**
Request Protocol and Range Grounding establishes channel ownership; Attached Lifecycle and Canonical Completion implements terminal emission.

---

### Pitfall 8: Loopback is treated as authentication, or the agent controls the browser capability

**What goes wrong:**
Another local process can read or mutate the review; a request chooses the bind host, port, callback URL, token, or browser URL; bearer credentials leak through stdout, logs, persisted JSON, process arguments, or browser history; a finished session remains usable.

**Why it happens:**
Loopback prevents LAN exposure but not same-device interception. OAuth native-app guidance explicitly treats loopback interception as possible. Bearer tokens grant access by possession, and URL-carried tokens are especially prone to logging and history leakage.

**How to avoid:**
Preserve the existing random per-session token, exact Host/Origin checks, bearer authorization, loopback IP binding, ephemeral port, CSP, `no-store`, and no-referrer policy. Keep the existing fragment-based browser bootstrap and history removal. The stdin schema must not accept network routing, callbacks, browser commands, tokens, or arbitrary URLs. Never place the capability on stdout or in durable state. Revoke it and close the listener after a terminal outcome. State explicitly that stderr and the spawned browser are observable by the invoking local agent; do not claim protection from the process that launched Cumpa.

**Warning signs:**
- An attached request has `host`, `port`, `callback`, `token`, or `url` fields.
- Authentication is skipped because the listener uses `127.0.0.1`.
- The complete browser URL is included in canonical output or draft JSON.
- A finished URL can still call the API.
- Binding uses `localhost` or a wildcard address rather than the existing explicit loopback policy.

**Phase to address:**
Attached Lifecycle and Canonical Completion, with schema exclusion begun in Request Protocol and Range Grounding.

---

### Pitfall 9: Browser disconnect, reload, Export, and Finish are conflated

**What goes wrong:**
Closing a tab returns an incomplete review, a reload cancels the CLI, an ordinary export ends the session unexpectedly, or a temporary network disconnect loses the draft. Conversely, the CLI waits forever because “Finish” is only a client-side navigation event.

**Why it happens:**
Browser lifecycle events are unreliable and semantically weaker than a user decision. Existing export behavior produces an artifact but does not mean the reviewer has ended an attached session.

**How to avoid:**
Only an explicit, authenticated **Finish review** server action may complete an attached session. Tab close, browser process exit, page unload, reload, websocket/HTTP disconnect, and ordinary Export remain non-terminal. A reload reconnects to the same server-side session, token, and repository-local draft. The Finish control should state that it returns the review to the waiting agent; retain the existing interactive UI semantics when no attached session exists. Do not add idle auto-finish.

**Warning signs:**
- `beforeunload`, socket close, or browser-process exit calls the completion handler.
- Existing Export is renamed or silently repurposed as Finish.
- Session state lives only in a Vue component.
- Reload creates a new token or new draft identity.
- An idle timer returns partial output.

**Phase to address:**
Attached Lifecycle and Canonical Completion.

---

### Pitfall 10: Finish races with autosave, drift, cancellation, response flushing, or shutdown

**What goes wrong:**
The CLI emits an older draft than the reviewer saw, emits twice, reports success before durable publication, truncates stdout, or lets SIGINT/EPIPE cancel after Finish has committed. A concurrent mutation lands between validation and export.

**Why it happens:**
Finish crosses several asynchronous systems: browser state, optimistic draft writes, drift checks, canonical generation, durable export publication, HTTP response delivery, stdout backpressure, and server teardown. Boolean flags do not define ordering or a cancellation commit point.

**How to avoid:**
Serialize terminal transitions with a small server-side state machine such as `active → finalizing → finished`, with competing `cancelled` and `failed` terminal states. Finish carries the expected draft revision. Reject or defer it while edits are unsaved, a save is pending, a revision conflict exists, repository drift is unresolved, or publication fails. Freeze one canonical byte buffer after the accepted revision and grounding checks. Publish it atomically, flush the Finish HTTP response so the browser gets confirmation, then write those exact bytes once to stdout, await completion, revoke the token, and close the server. Define the cancellation commit point: before accepted finalization, signal/EPIPE cancels with zero stdout; after it, no second terminal transition may win.

**Warning signs:**
- Completion is represented by multiple booleans or event listeners.
- Finish does not include the expected draft revision.
- The server closes inside the Finish route before the response is flushed.
- Canonical bytes are regenerated during stdout emission.
- SIGINT, EPIPE, and Finish handlers can each resolve the same promise.
- Publication errors still produce stdout.

**Phase to address:**
Attached Lifecycle and Canonical Completion.

---

### Pitfall 11: Patch mode fabricates commit identities or weakens durable anchors

**What goes wrong:**
A patch-grounded review claims fake base/head commits, anchors comments only by current path and line, maps rename-side comments to the wrong blob, or emits anchors the coding agent cannot verify. Existing range exports can also regress if a broad schema change makes provenance optional.

**Why it happens:**
The existing canonical review is commit-specific, while an exact patch may have real blob identities without two truthful comparison commit IDs. Forcing both modes into one flat set of fields encourages sentinel OIDs, `HEAD/HEAD`, or nullable identity. Lines and paths alone are unstable across renames and edits.

**How to avoid:**
Use an explicit versioned provenance union rather than inventing commits. Range provenance records submitted names, pinned base/head commit OIDs, merge base, and exact pathspecs. Patch provenance records the canonical patch digest, repository grounding identity, and verified per-file preimage/postimage blob IDs and modes. Preserve the current durable-anchor semantics: exact Git path bytes, old/new side, side-specific blob OID, selected text, bounded surrounding context, context hash, and line only as a hint. Reuse existing verified/stale/orphaned resolution behavior. Persist and emit canonical anchors derived from the frozen inventory, not live files.

**Warning signs:**
- Patch exports set both revisions to `HEAD` or all-zero OIDs.
- Provenance fields become optional without a mode discriminator.
- Rename comments store only the destination path.
- Anchors omit side-specific blob OIDs or context hash.
- The stdout result and repository-local JSON use different schemas or bytes.

**Phase to address:**
Patch Grounding and Review Model, finalized through Attached Lifecycle and Canonical Completion.

## Technical Debt Patterns

Shortcuts that look small here tend to corrupt review identity or the machine protocol.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Reuse base/head-only comparison keys for scoped requests | No persistence changes | Cross-scope draft collisions and wrong comments | Never for attached scoped sessions |
| Represent patch mode as `HEAD` versus `HEAD` | Reuses flat export fields | False provenance and unverifiable anchors | Never |
| Parse and apply Git patches in TypeScript | Avoids temporary Git plumbing | Diverges on binary, mode, rename, quoting, and future Git behavior | Never; native Git is a project constraint |
| Use only forward `git apply --check` | One command | Rejects already-applied changes or validates the wrong direction | Never for the stated exact-current-repository contract |
| Enable `--3way` to make more patches pass | Higher apparent success rate | Produces a merge result different from the submitted patch | Never for exact validation |
| Print a result URL or status line on stdout | Easy integration demo | Breaks canonical pipe consumers | Never in attached mode |
| Treat existing Export as Finish | Avoids a new action | Changes established UI semantics and makes accidental completion likely | Never |
| Keep completion state only in memory | Minimal prototype | Reload/race behavior becomes undefined, though drafts remain durable | Acceptable only for the transient session state if one server owns it and the state machine is explicit; review content must remain repository-local |
| Accept detached patches without repository grounding | Broader feature | No trustworthy postimage or anchor identity | Never; explicitly out of scope |

## Integration Gotchas

| Integration Boundary | Common Mistake | Prevention |
|----------------------|----------------|------------|
| Commander ↔ Inquirer | Prompt initialization consumes piped stdin | Decide TTY versus attached mode before any prompt starts |
| Request decoder ↔ Zod | Stream framing and schema validation are conflated | Bound and decode one UTF-8 JSON document first, then apply a strict versioned union |
| Request ↔ Git runner | Shell quoting or option injection | Existing `spawn` argument arrays, `--end-of-options` for revisions, `--` for pathspecs, bounded output |
| Pathspec ↔ Git environment | `GIT_LITERAL_PATHSPECS`, `GIT_GLOB_PATHSPECS`, or related variables change meaning | Supply a controlled environment for accepted semantics |
| Patch validation ↔ repository | Real index/worktree is mutated | Temporary index and object overlay; real object database only as a read-only alternate |
| Temporary object overlay ↔ server lifetime | Objects are cleaned up after launch | Keep the overlay reader and cleanup owner alive until terminal shutdown |
| File inventory ↔ browser API | Live Git/filesystem reads change the review after launch | Serve frozen pinned inventory and blobs; report drift separately |
| Attached identity ↔ draft store | Existing comparison key aliases scopes | Domain-separated identity containing mode-specific provenance |
| Finish ↔ draft store | Last editor state has not reached disk | Expected revision and no pending save before finalization |
| Finish ↔ export store | stdout succeeds when durable publication failed | Atomic publication must succeed before output emission |
| Finish route ↔ server shutdown | Listener closes before browser receives acknowledgement | Flush HTTP response before terminal CLI emission and teardown |
| Browser launcher ↔ auth | Capability appears in logs/output | Keep existing fragment bootstrap; never persist or print it on stdout |
| Canonicalizer ↔ stdout | Separate serializers produce different bytes | Generate once, persist and emit the same immutable buffer |

## Performance Traps

These are local single-review workloads; prevention should be bounded and boring, not a new job system.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Unbounded stdin or patch buffering | Memory spike or CLI appears hung | Protocol byte limit and read deadline/cancellation | Large accidental input or malicious local producer |
| Copying the whole repository for patch validation | Slow launch and large temporary directories | Temporary index/object overlay; materialize only changed blobs | Medium repositories even with small patches |
| One Git process per file or hunk | Launch latency scales sharply with file count | Use existing batched NUL-delimited Git queries and object reads | Hundreds of changed files |
| Re-evaluating revisions/pathspecs on every API request | UI changes under the reviewer and repeats Git work | Pin once and cache the frozen inventory | Any moving branch; latency visible on large diffs |
| Keeping the server alive after EPIPE or cancellation | Orphan listeners and temporary objects | One terminal owner closes listener and overlay on every outcome | Repeated automated runs |
| Unbounded diagnostics from Git | stderr floods logs or deadlocks a child pipe | Existing output caps plus concise structured diagnostics | Malformed binary patch or pathological Git output |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Assuming loopback equals authentication | Another local process accesses the review | Preserve random bearer token plus exact Host/Origin enforcement |
| Letting the request choose host, port, callback, token, browser command, or URL | SSRF-like local routing, LAN exposure, token fixation, or command execution | Exclude these fields from the strict request schema |
| Shell-building revisions, paths, or pathspecs | Command injection | `spawn` with argument arrays; explicit Git separators |
| Applying against the real index/worktree | Data loss or staged-state corruption | Isolated index/object overlay and read-only real repository access |
| Allowing unsafe patch paths or permissive apply fallbacks | Writes outside scope or accepts non-exact content | Reject unsafe paths; no 3-way, reject files, or zero-context relaxation |
| Inheriting Git configuration that changes patch/pathspec behavior | Validation depends on caller environment | Controlled Git config/environment for semantic inputs |
| Printing or persisting the bearer capability | Any reader can operate the live session | Capability only in browser bootstrap and authorization header; revoke on terminal state |
| Returning repository details in machine-protocol errors on stdout | Protocol corruption and unintended disclosure to downstream consumers | Zero stdout on failure; bounded diagnostics on stderr |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Export and Finish are visually or semantically identical | Reviewer ends a session accidentally | Separate explicit **Finish review** action, only in attached mode, with clear consequence text |
| Closing the tab means cancel or finish | Accidental loss or partial return | Treat disconnect as non-terminal; allow reopening the live URL/session |
| Finish is enabled with unsaved comment text | The agent receives less than the reviewer saw | Surface pending save/conflict state and gate Finish |
| Filtered scope is invisible | Reviewer assumes the whole comparison was reviewed | Display attached mode, pinned endpoints, and active pathspec scope |
| Unsupported binary/mode/type changes disappear | Review falsely appears complete | Keep every changed entry visible and label non-reviewable content |
| Drift silently refreshes the review | Comments move beneath the reviewer | Freeze the session, report drift, and require a new grounded launch |
| Browser says done before durable output exists | Reviewer closes the page but agent gets failure | Confirm success only after accepted revision and publication; make terminal result clear |

## "Looks Done But Isn't" Checklist

- [ ] **Mode selection:** Existing TTY launch is byte-for-byte behaviorally unchanged; piped input never invokes Inquirer.
- [ ] **Request framing:** One bounded UTF-8 JSON value is required; malformed, extra, unknown, or dual-mode input emits zero stdout.
- [ ] **Revision grounding:** Each endpoint is independently verified as a commit and pinned to a full OID before diffing.
- [ ] **Range meaning:** The protocol cannot express non-contiguous revsets; `A..B` and `A...B` are not accepted as a single range field.
- [ ] **Pathspec safety:** Every native pathspec is an argv element after `--`, semantic environment is controlled, and exact scope is persisted.
- [ ] **Patch completeness:** Binary, rename/copy, mode-only, symlink, quoted-path, add, and delete cases are either preserved or explicitly rejected.
- [ ] **Patch exactness:** Validation proves current postimages and isolated reversed preimages; permissive apply fallbacks are absent.
- [ ] **Repository safety:** Validation leaves the real worktree, index, refs, config, and object database unchanged.
- [ ] **Frozen review:** Browser blobs come from pinned commits or the retained patch overlay, not live mutable files.
- [ ] **Scoped persistence:** Two filters or patches over the same commits cannot share a draft identity.
- [ ] **Canonical anchors:** Every comment carries exact path, side, side-specific blob OID, selected text/context hash, and truthful provenance.
- [ ] **Browser lifecycle:** Reload and disconnect preserve the attached session; only explicit Finish is terminal.
- [ ] **Finish correctness:** Pending saves, conflicts, drift, and publication failures block completion; output occurs exactly once.
- [ ] **Output integrity:** Success stdout is exactly the existing canonicalizer bytes with no newline or diagnostic; failure/cancel stdout is empty.
- [ ] **Pipe failure:** Backpressure and EPIPE are handled without truncation, duplicate emission, or an orphan server.
- [ ] **Capability boundary:** Token and browser URL never enter stdout or repository persistence and are invalid after shutdown.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Invalid or ambiguous revision | Low | Emit a concise stderr diagnostic, zero stdout, resolve nothing else, and let the agent submit explicit endpoints |
| Unsupported or unstable pathspec | Low | Reject before session creation and name the unsupported construct without rewriting it |
| Patch is incomplete or not exact for current repository | Low | Leave repository untouched, remove temporary state, report the first bounded grounding failure, require a newly generated exact patch |
| Temporary materialization fails | Low | Close subprocesses, remove temporary index/object state, emit zero stdout; never fall back to the real index |
| Browser disconnects | Low | Keep session and repository-local draft active; user reopens the same live session |
| Draft is corrupt | Existing behavior | Use the existing explicit corruption handling/backup; do not synthesize an empty successful review |
| Mutation races with Finish | Low | Reject the stale expected revision, keep the session active, reload latest draft, and require Finish again |
| Canonical publication fails | Medium | Keep the review active, retain the draft, report the error in UI/stderr, and emit no stdout |
| stdout consumer disconnects | Low | Treat EPIPE as terminal cancellation, close server, revoke token, clean temporary state, and do not retry output elsewhere |
| Wrong provenance or anchor data was already emitted | High | Do not patch the artifact in place; invalidate it and start a new grounded session because canonical identities are part of the review contract |

## Pitfall-to-Phase Mapping

| Pitfall | Preventing Phase | Required Gate |
|---------|------------------|---------------|
| Input detection changes interactive launch | Request Protocol and Range Grounding | TTY launch unchanged; piped invalid input never prompts |
| Free-form or ambiguous revisions | Request Protocol and Range Grounding | Independent commit verification and pinned-OID scenarios |
| Pathspec injection/semantic drift | Request Protocol and Range Grounding | Option-like, magic, exclusion, Unicode, and environment cases |
| Patch metadata loss | Patch Grounding and Review Model | Binary, rename/copy, mode, symlink, and quoted-path inventories |
| Apply check without exact grounding | Patch Grounding and Review Model | Already-applied reverse validation, mismatch rejection, and repository non-mutation |
| Scoped draft collisions | Patch Grounding and Review Model | Same endpoints with different filters/patches remain isolated |
| stdout corruption/truncation | Attached Lifecycle and Canonical Completion | Exact-byte capture, backpressure, and EPIPE scenarios |
| Loopback/capability boundary mistakes | Attached Lifecycle and Canonical Completion | Host, Origin, bearer, schema exclusion, revocation, and no-leak checks |
| Disconnect/reload/export conflated with Finish | Attached Lifecycle and Canonical Completion | Reload/reconnect remains active; only Finish resolves CLI |
| Finish/cancel/save/publication races | Attached Lifecycle and Canonical Completion | Deterministic state-transition race scenarios and one output |
| Fabricated provenance or weak anchors | Patch Grounding and Review Model | Truthful mode union and side-specific anchor verification |
| Cross-cutting regressions | Adversarial Integration Gate | End-to-end agent pipe → browser review → Finish → canonical stdout |

## Sources

### Primary documentation

- [Git revisions](https://git-scm.com/docs/gitrevisions) — revision syntax, ref disambiguation, two-dot/three-dot semantics. **Confidence: HIGH**
- [git-rev-parse](https://git-scm.com/docs/git-rev-parse) — `--verify`, peeling to commits, and `--end-of-options`. **Confidence: HIGH**
- [Git pathspec glossary](https://git-scm.com/docs/gitglossary#def_pathspec) — pathspec magic, exclusion behavior, and attribute matching caveat. **Confidence: HIGH**
- [git-diff](https://git-scm.com/docs/git-diff) — endpoint comparison semantics, full-index, binary, and rename options. **Confidence: HIGH**
- [Git diff format](https://git-scm.com/docs/diff-generate-patch) — extended mode/rename/copy/index headers and non-sequential rename application. **Confidence: HIGH**
- [git-apply](https://git-scm.com/docs/git-apply) — check/index/3-way/reject/zero-context/binary/unsafe-path and whitespace behavior. **Confidence: HIGH**
- [Node.js 24 process documentation](https://nodejs.org/docs/latest-v24.x/api/process.html) — asynchronous pipe writes and truncation risk from `process.exit()`. **Confidence: HIGH**
- [Node.js 24 stream documentation](https://nodejs.org/docs/latest-v24.x/api/stream.html) — writable backpressure, completion, and error handling. **Confidence: HIGH**
- [RFC 8252: OAuth 2.0 for Native Apps](https://www.rfc-editor.org/rfc/rfc8252) — loopback IP literals, ephemeral ports, prompt listener closure, and interception considerations. **Confidence: HIGH**
- [RFC 6750: Bearer Token Usage](https://www.rfc-editor.org/rfc/rfc6750) — possession semantics and URI/log/history leakage risks. **Confidence: HIGH**
- [GitHub REST review comments](https://docs.github.com/en/rest/pulls/comments) — established side/path/line/original-commit anchoring precedent. **Confidence: MEDIUM** for Cumpa design; this is precedent, not a required dependency.

### Existing Cumpa authority

The recommendations were checked against the repository's current request/server boundary, Git runner, comparison identity, changed-file model, durable-anchor schema, draft store, export store/canonicalizer, loopback security plugin, browser launcher, and Vue review/export flow. Those implementations remain the source of truth for behavior v1.3 must preserve.

---

*Pitfalls research for: v1.3 Agent Review Handoff*
*Researched: 2026-08-04*
