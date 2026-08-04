# Feature Research

**Domain:** Coding-agent-to-human local code review handoff
**Researched:** 2026-08-04
**Confidence:** HIGH for required product behavior; MEDIUM for the exact-patch grounding mechanism until it is proven against real Git edge cases

## Milestone Scope

This research covers only **Compare v1.3 Agent Review Handoff**. A coding agent sends one versioned JSON request to `compare` on standard input, Compare validates and pins the requested repository change, the developer reviews it in the existing browser workspace, and the same waiting process returns canonical JSON only after an explicit human finish action.

The attached flow has exactly two source modes:

1. **Range:** one ordered base revision and one ordered head revision, using Compare's existing pinned merge-base-to-head review semantics, optionally restricted by native Git pathspecs.
2. **Patch:** one exact patch describing changes already present in the current repository/worktree. Compare must prove both the repository-backed preimage and equality with the current result before opening the review; it must not accept a detached or prospective patch merely because it could apply somewhere.

Existing interactive launch remains behaviorally unchanged. Arbitrary non-contiguous commit composition, detached patches, headless review, remote hosting, multiple reviewers, and an agent-controlled HTTP API remain out of scope.

## Recommended Request Contract

Use one strict, discriminated, versioned object rather than independent nullable `range` and `patch` fields:

```json
{
  "kind": "compare/review-request",
  "schemaVersion": 1,
  "source": {
    "kind": "range",
    "base": "main",
    "head": "feature/agent-handoff",
    "pathspecs": ["src", ":(exclude)src/generated"]
  }
}
```

```json
{
  "kind": "compare/review-request",
  "schemaVersion": 1,
  "source": {
    "kind": "patch",
    "patch": "diff --git a/src/example.ts b/src/example.ts\n..."
  }
}
```

Behavioral requirements for the contract:

- The root and both union members are strict: unknown fields, unknown `kind` values, unsupported versions, and trailing JSON values fail explicitly.
- `source.kind` makes the modes mutually exclusive by construction. There is no precedence rule and no mode guessing.
- Range revisions and pathspecs are non-empty strings with bounded count and byte size. Pathspec order and spelling are retained as submitted and passed to Git as data after `--`; shell expansion is never part of the contract.
- Patch input is a bounded UTF-8 string in v1. Invalid UTF-8, an empty/no-change patch, unsafe paths, and unsupported patch forms fail before browser launch. Alternate encodings and multiple patch parts are not silently inferred.
- The process accepts exactly one request and consumes it to EOF. It is not a stream of jobs and does not remain available for a second request.

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Requirement-ready behavior |
|---------|--------------|------------|----------------------------|
| TTY-safe mode selection | Existing users expect `compare` to keep opening the current interactive picker, while agents need a pipeable entry point. | MEDIUM | If `stdin` is a TTY, run the existing interactive picker, confirmation, browser, export, and shutdown flow unchanged. If `stdin` is not a TTY, read one attached request and never invoke Inquirer. Empty non-TTY input is an error, not a reason to prompt or hang. Redirecting `stdout` alone does not switch modes. |
| Bounded single-request ingestion | Agents need deterministic behavior and malformed producers must not exhaust memory or leave the CLI waiting forever. | MEDIUM | Read one bounded UTF-8 JSON document to EOF. Reject empty input, oversized input, invalid UTF-8, malformed JSON, trailing non-whitespace, and multiple JSON documents before starting the browser. |
| Strict request versioning | Agents need failures rather than accidental reinterpretation when producer and consumer versions differ. | LOW | Require exact root `kind` and `schemaVersion`. Accept only supported versions; report the received and supported version. Reject unknown fields rather than ignoring misspellings. |
| Exclusive source modes | Reviewing the wrong change is worse than refusing a request. | LOW | Represent range and patch as a discriminated union. Exactly one source mode is valid; neither mode, both modes, or fields from the other mode produce a schema-path error. No precedence or fallback exists. |
| Ordered contiguous range semantics | A coding agent expects its base/head request to mean one reproducible review scope, not an inferred set of commits. | HIGH | Resolve the submitted base and head once to full commit OIDs, validate them using the existing comparison gates, and preserve Compare's ordered merge-base-to-head semantics. Do not accept commit arrays, unions, exclusions, or multiple independent ranges. A moved selector after pinning cannot change the open session. |
| Native Git pathspec filtering | Path-limited review is useful only if it behaves exactly like Git. | HIGH | Pass each requested pathspec unchanged as a separate argument after `--` to the native Git operations that build the entire review inventory. Preserve Git magic and exclusion semantics; do not shell-expand, normalize into globs, or apply a second browser-only filter. Bind the exact ordered pathspec list into the result. A valid filter with zero matches opens a truthful zero-change review. |
| Exact already-applied patch grounding | A local patch review must prove the browser shows the agent's actual repository change, not merely a plausible textual diff. | HIGH | Before launch, prove every preimage is repository-backed and every postimage path, byte sequence, file mode, addition, deletion, and rename matches the current repository/worktree result. A reverse applicability check can be one gate but is not sufficient alone. Validation is read-only: never apply, reverse, reset, stage, or rewrite user files/index. Reject partial matches, omitted current changes within the submitted patch scope, unsafe paths, missing base objects, and prospective/detached patches. |
| Pinned patch snapshot | The developer may review for minutes while the worktree continues to change. | HIGH | Once the exact patch is validated, materialize or otherwise pin immutable base/result Git object identities for the existing inventory, diff, anchor, draft, and export machinery. The displayed bytes must not follow later worktree changes. |
| Actionable validation feedback | A coding agent must be able to correct a rejected request without inspecting a stack trace. | MEDIUM | Write one concise diagnostic to `stderr` with a stable high-level code, failing JSON path or Git scope, human explanation, and corrective action. Distinguish malformed request, unsupported version, invalid revisions, invalid pathspec, patch-not-grounded, launch failure, cancellation, and result-delivery failure. Exit nonzero and write nothing to `stdout`. Do not echo untrusted patch contents or security tokens. |
| Existing human review workspace | The handoff is valuable because a human receives the proven review UI, not a reduced agent-only renderer. | MEDIUM | After validation, open the same loopback-only authenticated browser workspace with the same file tree, Monaco diff, inline comments, summary, draft persistence, anchor verification, unsupported-file states, keyboard/accessibility behavior, and drift reporting. Agent mode bypasses source selection and launch confirmation only; it does not fork the review UX. |
| Attached waiting lifecycle | The requesting agent expects the invoking process to represent the review's lifetime. | HIGH | Keep the CLI and loopback server alive after browser launch. Send the fallback URL and progress only to `stderr`. Do not detach, daemonize, return early, or require the agent to poll a file. There is no arbitrary review timeout. |
| Browser disconnect resilience | Closing a tab is ambiguous and must not silently submit or destroy work. | MEDIUM | Reloading, navigating away, losing the browser connection, or closing the tab neither finishes nor cancels. The server keeps the draft and attached process alive; the authenticated fallback URL can reopen the same session while the CLI remains attached. Browser-open failure also leaves a usable URL on `stderr`. |
| Explicit Finish review action | Human intent, not transport state, must decide when feedback is final. | HIGH | Show `Finish review` only for attached sessions. On activation, settle all pending summary/comment mutations, capture one accepted draft revision, revalidate the reviewed scope/drift, and ask for any required acknowledgement. If validation fails, keep the session open with actionable UI feedback. Only an accepted finish transitions the session terminally. |
| Race-free terminal transition | Double clicks, retries, cancellation, or a late mutation must not create two answers or mismatch visible feedback. | HIGH | Finish and cancel share one atomic session state machine. The first accepted terminal transition wins. Repeated finish requests return the same accepted result; late mutations cannot enter it; no second result is emitted. Disable terminal actions while settlement is in progress and show the final state in the browser. |
| Canonical request-bound result | The agent must know feedback belongs to exactly the change it submitted. | HIGH | Write one versioned canonical result that includes the existing validated review content plus submitted-request identity and exact reviewed scope: resolved range OIDs and ordered pathspecs, or patch digest and pinned base/result identities. Reuse the current canonical serializer, anchor records, accepted revision, counts, and drift evidence. Do not return an unscoped `compare/export` v1 document when filters or patch identity would be lost. |
| Clean standard streams | A consumer should be able to parse `stdout` without filtering banners or URLs. | MEDIUM | On successful Finish, write exactly one canonical JSON document to `stdout` with no prefix, progress, ANSI control sequences, fallback URL, or trailing non-canonical newline. Put all diagnostics on `stderr`. Flush the full result before successful shutdown; a broken pipe or partial write is a delivery failure, not success. |
| Meaningful success, failure, and cancellation statuses | Agents use process status to decide whether feedback exists. | LOW | Exit `0` only after the full canonical result is delivered. Request, validation, launch, session, and delivery failures exit nonzero with no stdout result. Preserve the existing signal conventions: `SIGINT` exits `130`, `SIGTERM` exits `143`. |
| Explicit cancellation | A human or agent needs a safe way to abandon a review without fabricating empty approval. | MEDIUM | Attached UI provides a separate `Cancel review`/`Abandon review` action with confirmation; terminal `Ctrl+C`/termination also cancels. Cancellation closes the listener, aborts active Git work, retains the repository-local draft, emits no result to `stdout`, explains cancellation on `stderr`, and exits nonzero (or the signal status). It is never represented as a successful empty review. |
| Empty-feedback completion | “No issues found” is a legitimate human outcome. | LOW | Finish may succeed with no comments and no summary. The canonical result still binds the exact reviewed scope and records zero counts; absence of feedback is distinguishable from cancellation by result presence and exit `0`. |
| Interactive CLI compatibility | v1.3 must add a new path without changing the validated human path. | MEDIUM | TTY launch retains current prompts, Back/recovery behavior, browser messages, export files/Markdown, and Ctrl+C lifecycle. Attached-only Finish/Cancel controls and stdout discipline do not alter the interactive session contract. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Synchronous agent-to-human-to-agent rendezvous | Unlike clipboard or file handoffs, the agent can invoke once, wait, and resume with structured feedback from the same process. | HIGH | The process lifetime is the rendezvous; no polling, pane injection, remote PR, or agent-controlled web API is required. |
| Scope-bound canonical feedback | Every comment and summary can be traced to the exact filtered range or already-applied patch the human saw. | HIGH | Add the minimum versioned result wrapper/evolution around existing canonical export content so request digest, source mode, and reviewed scope cannot be dropped. |
| One trusted review UX for committed and worktree-backed change | Humans get the mature Compare workspace regardless of whether the agent submits commits or an exact current patch. | HIGH | Both modes converge on pinned Git objects and the existing comparison/draft/anchor pipeline after different validation gates. |
| Stronger patch identity than “applies cleanly” | A patch that can reverse-apply may still be ambiguous or incomplete; exact result equality protects the human-agent contract. | HIGH | Require repository preimage identity plus full postimage bytes/modes/path equality. Record a digest in the result. |
| Human-controlled terminal boundary | Finish and Cancel are explicit, durable decisions rather than consequences of closing a window. | MEDIUM | Mirrors mature pending-review/submit/abandon workflows while remaining local and single-user. |
| Zero-noise machine channel | Direct canonical bytes on stdout make the CLI naturally composable by any coding agent. | MEDIUM | Existing interactive messages may remain human-oriented because only the attached path reserves stdout. |
| Safe local-only bridge | The agent gets a reliable blocking interface without remote publishing or broad HTTP authority. | MEDIUM | The browser remains loopback-only and capability-authenticated; the agent controls only the initial stdin request and receives only terminal stdout. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Guess mode from whichever fields parse | Appears forgiving to request producers. | Both-present requests gain hidden precedence and misspellings can review the wrong source. | Strict discriminated `source.kind` union; reject ambiguity. |
| Ignore unknown fields or future versions | Seems forward-compatible. | A producer may believe a filter or identity field was honored when Compare discarded it. | Reject unsupported versions and unknown fields with the exact schema path. |
| Accept multiple requests on one stdin stream | Looks like batching for agents. | Requires multiplexing browser sessions, correlating results, and defining partial cancellation. | One process, one request, one human review, one terminal result. |
| Unbounded request or patch input | Avoids choosing limits. | Enables accidental hangs and memory exhaustion before validation. | Publish finite byte/count limits and fail before browser launch. |
| Treat two endpoints as arbitrary commit composition | Gives maximum Git flexibility. | Non-contiguous sets have unclear diff, merge-base, comment anchor, and result identity semantics. | One ordered base/head pair; agents create an appropriate branch/commit range first. |
| Reimplement pathspecs as application globs | Seems simpler than threading native Git arguments. | Diverges from Git magic, exclusions, case behavior, and repository attributes. | Preserve each pathspec and pass it after `--` to native Git. |
| Accept a detached or prospective patch | Lets agents review proposed text without updating a repository. | There is no trusted preimage/postimage, blob identity, durable anchor authority, or drift check. | Require an already-applied patch whose base is present and result exactly matches the current repository/worktree. |
| Use only `git apply --check --reverse` as patch proof | It is a convenient one-command check. | Applicability is not equality: context fuzz, partial scope, modes, renames, or unrelated current bytes can remain ambiguous. | Combine native-Git applicability with exact preimage object and postimage path/byte/mode comparison. |
| Mutate the repository to validate a patch | Applying/reversing in place seems like the easiest proof. | Risks data loss, index changes, filters/hooks, race conditions, and altered user work. | Validate read-only and materialize temporary/pinned Git objects outside user-visible refs and worktree state. |
| Finish when the tab closes or connection drops | Avoids adding a button. | Browser closure is accidental/ambiguous and can lose pending edits or submit incomplete feedback. | Explicit Finish; explicit Cancel; disconnect leaves the session waiting. |
| Emit URL, progress, or errors on stdout | Retains current launch printing with less refactoring. | Corrupts the only machine-readable result channel. | Attached diagnostics to stderr; canonical result only on stdout. |
| Return existing export v1 without submitted scope | Reuses bytes with no schema work. | Range pathspecs and patch identity disappear, so an agent cannot prove which change was reviewed. | Minimal versioned result wrapper or export evolution that embeds scope and reuses current review content. |
| Successful empty result on cancellation | Gives every exit a JSON document. | The agent cannot distinguish “human found no issues” from “review abandoned.” | Cancellation emits no stdout and exits nonzero; empty finished review emits canonical JSON and exits `0`. |
| End the process immediately after opening the browser | Matches the current interactive launch's fire-and-wait implementation shape poorly. | The agent has no completion rendezvous and must poll files or guess. | Keep the attached process alive until Finish, Cancel, signal, or fatal failure. |
| Arbitrary review timeout | Prevents forgotten processes. | Human review duration is unpredictable; timeout can destroy an almost-finished review. | Wait indefinitely by default; explicit Cancel or terminal signals end the session. |
| Add an agent-controlled HTTP API | Appears more flexible than stdin/stdout. | Expands security, lifecycle, discovery, authentication, and automation scope; conflicts with human-controlled review. | One bounded stdin request and one terminal stdout result; browser API remains human-session capability only. |
| Add headless review mode | Useful for automation benchmarks. | Removes the human from a milestone whose purpose is human judgment and creates a second product path. | Require the existing browser workspace. |
| Change interactive launch based on stdout redirection | Seems like automation detection. | Humans commonly pipe or capture output while still using a TTY for input. | Branch only on stdin TTY/request presence; keep interactive behavior otherwise. |
| Delete the draft on Finish or Cancel | Seems tidy. | Removes recovery/audit evidence and risks data loss after delivery failure. | Retain the versioned repository-local draft under existing policy. |

## Expected Behavior and Edge Cases

| Given | When | Required user-visible or agent-visible outcome |
|-------|------|-----------------------------------------------|
| `stdin` is a TTY | Developer runs `compare` normally | Existing ordered picker and confirmation run unchanged; attached request parsing and Finish/Cancel controls are absent. |
| `stdin` is piped but empty | Process reaches EOF | No prompt or browser opens. `stderr` identifies empty request, exit is nonzero, and `stdout` is empty. |
| Input is malformed JSON, invalid UTF-8, oversized, or contains a second value | Request ingestion completes | Reject before any Git or browser work, point to the input fault without echoing content, and leave stdout empty. |
| Request has an unknown root/source field or unsupported version | Schema validation runs | Reject with code, JSON path, received version/field, and supported version; never best-effort parse. |
| Request contains both range and patch fields, neither, or fields from the other branch | Union validation runs | Reject as an exclusive-mode violation; do not pick a winner. |
| Range revisions are valid symbolic names | Request is accepted | Resolve each once to a full commit OID and pin it. Later ref movement cannot change displayed content or result identity. |
| Base/head are invalid, unavailable, unrelated, or produce an unsupported merge-base case | Range validation runs | Reuse the existing typed comparison explanation on stderr and exit nonzero; agent mode does not open interactive recovery prompts. |
| A pathspec starts with `-` or uses `:(exclude)`/other Git magic | Inventory is built | It remains data after `--` and follows native Git semantics; it cannot become a Compare or shell option. |
| Valid pathspecs match nothing, or base equals head | Browser opens | Show the existing truthful zero-change state. Human may Finish an empty review; result retains the filtered scope. |
| Patch describes changes not yet present | Patch validation runs | Reject as prospective/detached even if forward apply would succeed. Explain that patch mode requires already-applied repository changes. |
| Patch reverse-applies but a touched current file/mode differs, base blob is missing, or only part of the current result matches | Exact grounding runs | Reject before launch. Reverse applicability alone does not satisfy exact equality. |
| Patch contains an absolute path, `..` escape, or unsupported unsafe form | Patch validation runs | Reject without touching repository state or revealing sensitive path contents. |
| Patch exactly matches already-applied tracked/new/deleted/renamed paths in the current repository | Validation completes | Pin immutable base/result identities and open the same review workspace over that exact snapshot. |
| Worktree changes after patch validation | Human continues reviewing | Open diff remains pinned. Finish rechecks current grounding/drift; mismatch blocks Finish until acknowledged only where policy safely permits, or requires cancel/relaunch when exact patch identity no longer holds. It never silently emits feedback for a changed patch. |
| Automatic browser open fails | Server is ready | Print authenticated fallback URL and recovery text to stderr, keep waiting, and allow manual open. Stdout remains empty. |
| Browser reloads or tab closes | Review is unfinished | Draft and server remain available; no result, cancel, or successful exit occurs. |
| Summary/comment mutation is still pending | Human selects Finish | Finish waits for or explicitly resolves the mutation. It cannot snapshot an earlier revision while showing later text as accepted. |
| Drift/anchor validation requires attention | Human selects Finish | Keep the session open and show the exact blocking state/acknowledgement. CLI continues waiting with no stdout result. |
| Review contains no summary and no comments | Human selects Finish | Emit a valid request-bound canonical result with zero counts and exit `0`. This means “review completed with no feedback,” not cancellation. |
| Human double-clicks Finish or the browser retries after a lost response | Finish settles | One accepted draft/result is reused; stdout receives one document only. |
| Human selects Cancel review | Confirmation is accepted | Close the attached session, retain draft, emit no stdout, explain cancellation on stderr, and exit nonzero. |
| Agent/operator sends `SIGINT` or `SIGTERM` while waiting | Shutdown begins | Abort active Git/session work, close listener, emit no partial result, and exit `130`/`143` using the existing lifecycle behavior. |
| Cancel races with Finish | A terminal transition is accepted | First accepted transition wins atomically. A successful accepted Finish delivers one result; accepted Cancel delivers none. |
| Stdout consumer closes before/during result write | Finish attempts delivery | Treat as delivery failure, stop session safely, keep draft, and do not claim successful completion. |
| Canonical result is delivered | Process exits | Result is one parseable canonical JSON document with request/scope identity and existing review content; diagnostics remain entirely on stderr. |

## Feature Dependencies

```text
[stdin TTY/request routing]
    ├──TTY──────────────> [unchanged interactive CLI]
    └──piped────────────> [bounded UTF-8 JSON ingestion]
                              └──requires──> [strict versioned discriminated request]

[range source]
    ├──requires──> [repository discovery]
    ├──requires──> [one-time revision resolution]
    ├──requires──> [native Git pathspec scope]
    └──converges──> [pinned comparison model]

[patch source]
    ├──requires──> [repository discovery]
    ├──requires──> [read-only preimage object validation]
    ├──requires──> [exact current postimage equality]
    ├──requires──> [patch digest and immutable materialization]
    └──converges──> [pinned comparison model]

[pinned comparison model]
    └──enables──> [existing browser workspace and draft]
                      ├──requires──> [attached session state machine]
                      ├──Finish────> [settled accepted draft + final drift/scope validation]
                      │                  └──requires──> [request-bound canonical result]
                      │                                      └──requires──> [stdout-only delivery]
                      └──Cancel────> [no result + nonzero exit]

[browser close] ──must-not-imply──> [Finish or Cancel]
[detached/prospective patch] ──conflicts──> [repository-grounded patch mode]
[unscoped export v1] ──conflicts──> [request-bound result]
[agent HTTP/headless mode] ──conflicts──> [human-controlled local handoff]
```

### Dependency Notes

- **Transport routing comes first.** The current CLI owns an interactive stdin and prints launch information during server startup. Attached mode must select its path before Inquirer reads piped JSON and must give stdout a different policy without changing TTY behavior.
- **Validation must finish before browser launch.** A browser opened for an invalid or ungrounded request creates false confidence and complicates cancellation. Schema, repository, range/pathspec, and patch equality gates are startup dependencies.
- **Both source modes must converge on the existing pinned model.** Duplicating inventory, Monaco, draft, anchor, and export logic for patches would create two review products. Patch materialization is high complexity specifically because it must satisfy existing immutable Git-object assumptions.
- **Pathspec is part of identity, not presentation.** It must constrain inventory before file IDs, counts, drafts, and comments exist, and it must appear in the terminal result. A browser-only filter cannot satisfy the contract.
- **Reverse applicability is necessary evidence, not sufficient proof.** Exact patch mode also needs base object availability and postimage path/content/mode equality with the current worktree. This mechanism deserves a focused real-Git spike before roadmap implementation.
- **Finish depends on accepted-state settlement.** Existing comment/summary mutations are asynchronous and revisioned. The terminal result must be built from one accepted server draft after all pending UI buffers are settled, not from browser memory or the revision visible when the button was first clicked.
- **Finish also depends on final scope validation.** Range refs may drift and patch-backed worktree bytes may change. The attached result must retain pinned reviewed identities and disclose or block unsafe drift according to the existing explicit policy.
- **Result delivery is part of completion.** The session is not successfully finished until canonical bytes have been fully written. Server shutdown must follow delivery, while cancellation/failure must never leak a partial or placeholder success document.
- **A minimal result wrapper avoids breaking the existing export.** Prefer a new versioned `compare/review-result` containing request digest/scope plus the validated existing `compare/export` review document. This retains the existing serializer and consumer-rich anchor model without pretending export v1 contains pathspec/patch identity.
- **Cancellation shares lifecycle infrastructure but adds product state.** Existing `SIGINT`/`SIGTERM` shutdown already aborts Git and closes Fastify. Browser Cancel and Finish need an atomic attached-session outcome above that controller.

## MVP Definition

### Launch With (v1.3)

- [ ] TTY stdin follows the existing interactive CLI unchanged; piped stdin follows the attached request path without prompting.
- [ ] One bounded strict `compare/review-request` v1 discriminated union accepts exactly range or patch mode.
- [ ] Range mode resolves ordered base/head revisions once, uses existing merge-base-to-head semantics, and applies optional native Git pathspecs to the full review scope.
- [ ] Patch mode accepts only an already-applied, repository-grounded exact patch, validates preimage plus current postimage equality read-only, and pins immutable reviewed content.
- [ ] All request/repository validation failures are actionable on stderr, exit nonzero, and leave stdout empty.
- [ ] Valid requests open the existing authenticated loopback browser workspace and keep the CLI attached.
- [ ] Browser close/reload does not finish or cancel; failed auto-open provides the URL on stderr.
- [ ] Attached UI exposes explicit, race-safe Finish review and Cancel review actions.
- [ ] Finish settles pending draft mutations, performs final scope/drift validation, and accepts exactly one draft revision.
- [ ] Successful Finish emits exactly one canonical, versioned, request-bound review result on stdout and exits `0` only after full delivery.
- [ ] Browser Cancel, `SIGINT`, `SIGTERM`, fatal server failure, and delivery failure emit no result and preserve the draft.
- [ ] A completed review with zero comments/summary remains a successful, explicitly finished result.

### Add After Validation (v1.x)

- [ ] Optional agent-supplied display title or instructions — add only if real handoffs show the human cannot understand review purpose from repository/scope alone; keep it non-authoritative and size-bounded.
- [ ] Explicit `--request`/`--interactive` override — add only if stdin TTY detection proves insufficient in a real host environment. The default must remain backward-compatible.
- [ ] Resume token for a restarted attached process — add only if interrupted long reviews are common and the token can preserve request/result identity without adding a daemon. Existing draft persistence already prevents feedback loss.

### Future Consideration (v2+)

- [ ] Multiple queued requests in one process — requires multiplexed browser sessions, correlation, and partial cancellation; not justified for the one-agent/one-human handoff.
- [ ] Non-contiguous commit composition — requires a new comparison and anchor model.
- [ ] Detached/prospective patch review — requires a trusted virtual repository/snapshot model distinct from current repository grounding.
- [ ] Headless or agent-controlled HTTP review — conflicts with this milestone's human-controlled local boundary.
- [ ] Remote/multi-reviewer collaboration — belongs to a hosted product, not the loopback single-developer CLI.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| TTY-compatible stdin routing | HIGH | MEDIUM | P1 |
| Strict versioned exclusive request schema | HIGH | LOW | P1 |
| Bounded ingestion and actionable validation | HIGH | MEDIUM | P1 |
| Ordered range plus native pathspec scope | HIGH | HIGH | P1 |
| Exact already-applied patch grounding | HIGH | HIGH | P1 |
| Immutable patch snapshot convergence | HIGH | HIGH | P1 |
| Existing browser workspace reuse | HIGH | MEDIUM | P1 |
| Attached wait and disconnect resilience | HIGH | HIGH | P1 |
| Explicit race-safe Finish | HIGH | HIGH | P1 |
| Explicit Cancel plus signal cancellation | HIGH | MEDIUM | P1 |
| Request-bound canonical stdout result | HIGH | HIGH | P1 |
| Zero-feedback successful completion | MEDIUM | LOW | P1 |
| Optional request title/instructions | MEDIUM | LOW | P2 |
| Restartable attached-session token | MEDIUM | HIGH | P2 only after evidence |
| Multi-request stream | LOW | HIGH | P3 / OUT OF SCOPE |
| Detached patch, headless mode, or agent HTTP API | NEGATIVE for milestone | HIGH | DO NOT BUILD |

**Priority key:**
- **P1:** Required for v1.3 acceptance.
- **P2:** Add only after the complete handoff is validated and observed use proves need.
- **P3:** Separate future product scope.

## Competitor Feature Analysis

| Feature | GitHub pull-request review | PRless | diffmux | Compare v1.3 approach |
|---------|----------------------------|--------|---------|-----------------------|
| Human completion | Pending comments become visible through explicit **Submit review**; pending review has separate **Abandon review**. | Human explicitly selects **Export for AI**. | Human explicitly selects **Send to agent**. | Explicit **Finish review** returns the result; separate **Cancel review** abandons. Tab closure does neither. |
| Local-first review | Requires a hosted pull request. | Local browser over working tree, staged, or branch diff. | Local browser over `git diff`, commonly inside cmux. | Existing loopback-only Compare workspace over a strictly grounded/pinned request. |
| Agent delivery | Remote review data must be fetched through forge tooling/API. | Clipboard plus `.prless/review.md`; agent is invoked or prompted separately. | Pastes a prompt into a launching cmux pane; README warns the agent must be idle. | Same invoking process blocks and emits one canonical request-bound JSON result to stdout. |
| Exact scope binding | PR/commit identities provide hosted scope. | Export is a readable agent prompt tied to local comments; no attached process result contract is documented. | Sends `file:line` prompt references from the current diff. | Result includes resolved range/pathspec scope or exact patch digest and pinned identities plus durable anchors. |
| Cancellation/disconnect | Pending review can be abandoned explicitly; browser closure does not submit it. | Server lifecycle/export are separate user actions. | Send is an explicit action; process/pane delivery has timing constraints. | Explicit Cancel and terminal signals produce no success result; closing/reloading browser keeps the attached review alive. |
| Remote/API dependency | GitHub account and hosted repository. | None for review/handoff. | cmux-specific pane integration. | No forge, API key, agent HTTP authority, clipboard, or terminal-pane injection. |

The ecosystem evidence supports two strong expectations: review feedback remains draft until an explicit human action, and local agent tools currently rely on clipboard/files or terminal injection. Compare's defensible differentiation is not another diff viewer; it is an exact request-to-canonical-result rendezvous built on the already shipped review workspace.

## Complexity and Existing Dependencies

| Area | Complexity driver | Existing dependency to reuse |
|------|-------------------|------------------------------|
| CLI routing and streams | Current `run()` always starts Commander/Inquirer and launch status can reach stdout. Attached mode must consume stdin before prompts and reserve stdout without altering TTY behavior. | `src/cli/run.ts`, Commander, existing error output seams |
| Request contract | Strict versioning, bounded strings/arrays, and exclusive modes cross a new agent trust boundary. | Shared Zod contract pattern in `src/contracts/*` |
| Range validation | Endpoint pinning and merge-base errors exist, but pathspec scope must flow through inventory and result identity. | `createPinnedComparison`, native Git runner, comparison schemas |
| Patch grounding | Must prove already-applied exact bytes/modes/paths against repository base without mutating worktree/index, then create immutable identities. | Git runner safety, repository discovery, raw diff/object readers; requires focused spike |
| Patch content limitations | Existing UI keeps binary/oversized/unsupported files visible but non-reviewable; patch mode must preserve this classification rather than silently dropping entries. | Inventory/availability contracts and object reader |
| Attached session state | Current server waits for signals but has no browser-driven terminal outcome carrying a result. | Fastify session app, capability routes, shutdown controller |
| Finish settlement | Summary buffers and comment mutations are revisioned/asynchronous; finalization must wait for accepted state and resist retries/races. | Draft store CAS, accepted server responses, export snapshot builder |
| Final drift/scope gate | Range selectors and patch worktree can change while the human reviews. | Selector drift, anchor verification, explicit acknowledgement model |
| Result schema | Existing export v1 is canonical and rich but omits submitted pathspec/patch scope. | `ReviewExportV1Schema`, canonical serializer/parser, export builder |
| Delivery | Exact stdout bytes must be isolated from diagnostics and fully flushed before shutdown. | Node process streams; current output dependency seams need attached-specific policy |
| Cancellation | Signals already abort and close once; browser Cancel must join the same terminal state without racing Finish. | `createShutdownController`, active Git AbortController, repository-local draft retention |
| Browser continuity | Existing capability URL supports one local browser session; attached mode must survive a tab lifecycle without treating it as intent. | Loopback binding, session token, existing session/draft APIs |

## Requirement Seeds

The following statements are intentionally phrased for direct conversion into milestone requirements:

1. **When standard input is interactive, Compare shall execute the shipped interactive launch behavior without attempting to parse a review request.**
2. **When standard input is piped, Compare shall accept exactly one bounded UTF-8 `compare/review-request` document and shall not prompt.**
3. **The request shall contain exactly one discriminated source: an ordered base/head range with optional native Git pathspecs, or an exact already-applied repository patch.**
4. **Compare shall reject unsupported versions, unknown fields, ambiguous modes, invalid revisions/pathspecs, and ungrounded patches before opening a browser, with actionable stderr and no stdout.**
5. **Range mode shall pin resolved commit identities once and shall bind the exact ordered pathspec scope into the terminal result.**
6. **Patch mode shall prove repository-backed preimages and exact equality between patch postimages and current worktree paths/content/modes without mutating repository state, then pin the reviewed snapshot.**
7. **A valid attached request shall open the existing authenticated loopback browser review workspace and keep the invoking process waiting.**
8. **Closing or reloading the browser shall neither finish nor cancel an attached review.**
9. **Only an accepted Finish review action shall finalize feedback; it shall settle pending mutations, accept one draft revision, and perform final scope/drift validation.**
10. **Successful Finish shall write exactly one canonical versioned result, bound to the submitted request and reviewed scope, to stdout and exit `0` only after full delivery.**
11. **Browser Cancel, terminal signals, validation failure, server failure, or stdout delivery failure shall produce no canonical result and shall retain the repository-local draft.**
12. **A finished review with no comments and no summary shall still return a successful zero-feedback result, distinct from cancellation.**

## Sources

### Authoritative local sources

- **[L1]** `.planning/PROJECT.md` — v1.3 goal, five active requirements, existing validated browser/export behavior, constraints, and exclusions.
- **[L2]** `src/cli/run.ts` — current Commander/Inquirer entry, loopback browser launch, output seams, one-time comparison launch, and interactive recovery behavior that must remain unchanged.
- **[L3]** `src/server/lifecycle.ts` — existing idempotent Git abort/listener shutdown and signal statuses `130`/`143`.
- **[L4]** `src/contracts/draft.ts` and `src/export/review-export.ts` — strict versioned export schema, accepted revision, durable anchors, drift/count fields, canonical ordering, exact-byte parser, and serializer reusable by the attached result.
- **[L5]** `src/server/capabilities.ts` and `src/server/export-store.ts` — accepted server draft snapshot, final anchor/drift validation, and current canonical JSON/Markdown publication boundary.

### Current primary documentation and ecosystem evidence

- **[S1]** [Git `diff` documentation](https://git-scm.com/docs/git-diff) — ordered two-endpoint diff forms, `--` pathspec boundary, merge-base forms, and path-limited comparison; page current through Git 2.55.0 (2026-06-29).
- **[S2]** [Git `apply` documentation](https://git-scm.com/docs/git-apply) — stdin patch input, read-only `--check`, `--reverse`, index/worktree distinctions, unsafe path behavior, and embedded blob identity used for three-way/fake-ancestor operations; page current through Git 2.55.0.
- **[S3]** [Model Context Protocol stdio transport](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#stdio) — machine messages only on stdout, diagnostics permitted on stderr, explicit cancellation rather than interpreting disconnect as cancel, and protocol-version rejection behavior.
- **[S4]** [Command Line Interface Guidelines](https://clig.dev/) — primary output on stdout, messaging on stderr, zero/nonzero status, prompts only for TTY stdin, bounded/clear Ctrl+C behavior, and machine-readable JSON conventions.
- **[S5]** [GitHub: Reviewing proposed changes in a pull request](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/reviewing-proposed-changes-in-a-pull-request) — pending line comments, explicit Submit review, and separate Abandon review behavior.
- **[S6]** [PRless](https://github.com/muhammadZihad/prless) — local browser review with explicit Export for AI through clipboard and `.prless/review.md`, demonstrating the current manual handoff baseline.
- **[S7]** [diffmux](https://github.com/Nicomalacho/diffmux) — local browser review with explicit Send to agent through cmux pane injection, including the documented idle-agent delivery constraint.

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Milestone boundaries and required user outcomes | HIGH | The assignment contract and current PROJECT agree on transport, two exclusive modes, browser review, explicit Finish, stdout result, compatibility, and exclusions. |
| Interactive compatibility | HIGH | Current CLI source directly shows the TTY-owned interactive flow and output/lifecycle seams that must remain unchanged. |
| Finish/cancel semantics | HIGH | GitHub's current documented pending/submit/abandon model, MCP disconnect guidance, CLI signal conventions, and Compare's existing draft lifecycle converge on explicit terminal actions. |
| Canonical result behavior | HIGH | Compare already has strict canonical export content and exact-byte serialization; the missing request/scope binding is clear and bounded. |
| Range/pathspec behavior | HIGH | Existing pinned comparison behavior and current official Git diff/pathspec semantics are authoritative. |
| Exact-patch validation mechanism | MEDIUM | The required outcome is unambiguous and Git exposes relevant read-only/object primitives, but reverse applicability alone is insufficient. Real-Git cases for new/deleted/renamed files, modes, binary data, index/worktree mixtures, and concurrent drift should be proven in a focused spike before planning the implementation sequence. |
| Competitor landscape | MEDIUM | Current public documentation demonstrates explicit export/send patterns, but PRless and diffmux are small projects and do not define an industry-standard attached protocol. |

---
*Feature research for: Compare v1.3 Agent Review Handoff*
*Researched: 2026-08-04*
