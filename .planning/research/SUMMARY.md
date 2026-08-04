# Project Research Summary

**Project:** Compare
**Domain:** Local-first agent-to-human code-review handoff
**Researched:** 2026-08-04
**Confidence:** MEDIUM-HIGH

## Executive Summary

Compare v1.3 should add an attached agent handoff ingress and completion path, not a second review product. A coding agent submits exactly one bounded, versioned JSON request on stdin; Compare validates it before opening the existing loopback-authenticated Vue/Monaco workspace; the human explicitly finishes or cancels; and the invoking process emits one canonical, request-bound JSON result on stdout. Interactive TTY behavior, Git semantics, draft persistence, anchors, export, Markdown, and browser security remain authoritative.

The recommended implementation adds no dependency or runtime upgrade. Reuse Node 24 streams and process lifecycle, Zod 4 strict discriminated schemas, native Git through the existing safe runner, Fastify 5 response hooks, and the existing canonical export serializer. Range requests resolve and pin ordered base/head commits and pass native pathspecs through Git. Patch requests are accepted only when an exact already-applied patch can be proven against the repository and materialized in an isolated temporary Git index/object overlay. The primary risks are false patch grounding, scope/draft identity collisions, stdout contamination, and races between autosave, Finish, cancellation, drift, and shutdown; each requires explicit gates and an adversarial integration phase.

## Key Findings

### Recommended Stack

The stack research recommends **no v1.3 dependency additions or upgrades**. Keep Node.js >=24, Git >=2.43, Commander/Inquirer, Fastify 5, Vue 3/Vite/Monaco, Zod 4, and the existing TypeScript/Vitest/Playwright toolchain. Use native `process.stdin` async iteration with a finite byte ceiling, fatal UTF-8 decoding, one `JSON.parse`, and strict Zod validation. Keep Git as the semantic authority: resolve revisions with `rev-parse --verify --end-of-options`, enforce ancestry, pass pathspecs after `--`, and use a temporary index/object overlay for exact patch materialization. Reuse the current canonical export bytes directly; stdout is data only and diagnostics stay on stderr.

**Core technologies:**
- **Node.js 24 + standard streams:** bounded one-document ingestion, lifecycle, temp storage, and exact stdout delivery without a new protocol library.
- **Native Git via the existing `GitRunner`:** authoritative revision, pathspec, patch, object, mode, rename, and inventory semantics with shell-free argument arrays.
- **Zod 4:** strict, versioned, discriminated request validation and derived TypeScript types at the trust boundary.
- **Fastify 5 + Vue 3/Monaco:** reuse the authenticated loopback review session; add only attached Finish/Cancel presentation and completion signaling.
- **Existing canonical export service:** generate, validate, publish, and emit one immutable byte sequence; do not add a serializer.

### Expected Features

The milestone boundaries remain the four researched phases: **Request Protocol Range Grounding**, **Patch Grounding Review Model**, **Attached Lifecycle Canonical Completion**, and **Adversarial Integration Gate**.

**Must (table stakes):**
- TTY-compatible routing that leaves the current interactive picker and lifecycle unchanged; non-TTY accepts one request and never prompts.
- Bounded UTF-8 ingestion, strict schema/version/unknown-field rejection, exclusive range-or-patch modes, and actionable stderr failures before browser launch.
- Ordered base/head resolution to pinned full commit IDs, native Git pathspec semantics, truthful zero-match/zero-change reviews, and request-bound scope identity.
- Exact already-applied patch grounding (preimages, postimages, paths, bytes, modes, renames/binary metadata) without mutating the worktree, real index, refs, or object store; immutable snapshot pinning.
- Existing authenticated browser review with attached wait, disconnect/reload resilience, explicit race-safe Finish and separate Cancel, pending mutation settlement, final drift checks, and canonical stdout-only success.
- Correct statuses: successful empty feedback is distinct from cancellation; signals and delivery failures produce no result and retain drafts.

**Should have (competitive):**
- Synchronous one-process agent → human → agent rendezvous without polling, hosted services, clipboard, or agent-controlled HTTP.
- Scope-bound canonical feedback carrying resolved range/pathspec provenance or patch digest and pinned identities while reusing existing anchors and review content.
- Stronger-than-applicability patch identity and a mature human UX for both source modes.

**Defer (v2+):**
- Multiple requests per process, non-contiguous commit composition, detached/prospective patches, headless review, remote or multi-reviewer collaboration, and agent-controlled HTTP APIs.
- Optional titles/instructions or explicit mode flags only after real usage validates the need; they are not prerequisites for v1.3.

### Architecture Approach

Add one narrow ingress/completion path around the existing `PinnedComparison` pipeline. The CLI handoff adapter owns stdin, stdout, cancellation, and exit status; a shared strict contract owns request validation; one Git adapter normalizes range or grounded patch inputs into immutable comparison data; and a one-shot attached-session primitive owns terminal transitions. `createSessionApp()` continues to serve the same Fastify loopback session, stores, capabilities, browser, anchors, drafts, and export. Attached metadata (scope key, optional object reader, completion port) is presentation/session context, not a new comparison identity model. Existing interactive behavior remains the default path.

**Major components:**
1. **CLI routing and handoff contract:** choose TTY versus piped ownership before Inquirer; decode, validate, report, and deliver exact bytes.
2. **Git handoff adapter:** pin revisions/pathspecs or create and retain a temporary index/object overlay; feed the existing inventory/object reader and comparison model.
3. **Attached session and server/UI:** preserve loopback token/origin security, expose explicit Finish/Cancel, settle drafts, and resolve completion only after the response is flushed.
4. **Scoped persistence/export identity:** domain-separate attached request keys from interactive base/head keys; include mode-specific provenance without changing existing draft schemas unnecessarily.
5. **Existing review/export pipeline:** remain the authority for frozen file inventory, Monaco rendering, anchors, canonical JSON, Markdown, and atomic publication.

### Critical Pitfalls

1. **Changing interactive mode or corrupting stream ownership** — decide TTY/piped mode before Inquirer; validate all attached input before prompts/server work; reserve stdout for data and stderr for every diagnostic.
2. **Mistaking patch applicability for exact repository grounding** — do not use the real index/worktree, `--3way`, rejects, unsafe paths, or whitespace reinterpretation; prove exact metadata/content equality and retain the isolated overlay through Finish.
3. **Reinterpreting Git scope or allowing scope collisions** — resolve and pin OIDs once, pass each pathspec unchanged after `--`, freeze inventory at launch, and use domain-separated keys containing mode and exact scope/digest.
4. **Conflating browser disconnect, Export, Finish, and Cancel** — only an authenticated explicit Finish is terminal; reload/close remains recoverable; Cancel is explicit and never a successful empty result.
5. **Racing finalization and delivery** — serialize active → finalizing → finished/cancelled/failed transitions, settle pending revisions and drift gates, publish one immutable canonical buffer, flush the response and stdout before shutdown.

## Implications for Roadmap

Build in the confirmed research order; do not merge the four boundaries into one risky implementation phase.

### Phase 1: Request Protocol Range Grounding

**Rationale:** Everything else depends on safe input ownership and a pinned, scoped comparison. Establishing this first prevents prompts, revision ambiguity, pathspec reinterpretation, and stdout contamination from infecting later work.

**Delivers:** TTY/non-TTY dispatch; bounded strict request schema; actionable pre-launch errors; pinned ordered range revisions; native pathspec propagation through all inventory calls; attached scoped identity; clean stream and exit-status policy.

**Addresses:** TTY routing, bounded ingestion, strict exclusive modes, range mode, pathspec table stakes, and request-bound provenance.

**Avoids:** Pitfalls 1–3 and 7. Keep the existing interactive path behaviorally unchanged.

**Research flag:** **Plan-phase research recommended** for repository-specific CLI seams, pathspec environment controls, and exact backward-compatibility checks; standard Node/Zod patterns otherwise need no new library research.

### Phase 2: Patch Grounding Review Model

**Rationale:** Patch mode is the highest correctness and implementation risk and must produce the same immutable data model before lifecycle work can trust it.

**Delivers:** Git-generated patch dialect acceptance; read-only exact preimage/postimage and metadata checks; temporary index/object overlay with cleanup ownership; frozen inventory/blob reader; patch digest and provenance; scoped draft/export identity; binary, rename, mode, symlink, and unsupported-file classification preservation.

**Uses:** Native Git, controlled `GitRunner` environments, temporary filesystem APIs, existing inventory/object readers, anchors, and export contracts.

**Implements:** Git handoff adapter and immutable `PinnedComparison` convergence.

**Avoids:** Pitfalls 4–6 and false confidence from forward `git apply --check` alone.

**Research flag:** **Mandatory focused implementation spike/research-phase.** Exercise Git 2.43 behavior with Compare fixtures for binary, rename/copy, mode/symlink, quoting, zero-context, attributes, concurrent worktree changes, and object-overlay lifetime before committing the final mechanism.

### Phase 3: Attached Lifecycle Canonical Completion

**Rationale:** Once both inputs yield a frozen review, make the process rendezvous deterministic and preserve the established browser/export authority.

**Delivers:** Attached session state machine; explicit Finish and Cancel UI; reload/disconnect resilience; pending draft mutation settlement; final scope/drift/anchor checks; route-level post-response completion; exact canonical stdout delivery; signal, EPIPE, server-close, and cleanup handling.

**Uses:** Fastify `onResponse`/`close`, existing authenticated routes and draft CAS, canonical export bytes, Vue API client, and loopback security.

**Implements:** One-shot completion primitive and attached presentation context without an agent HTTP API or second serializer.

**Avoids:** Pitfalls 7–10 and accidental completion on ordinary Export or tab close.

**Research flag:** **Plan-phase research recommended** for current draft revision/anchor semantics and response/write ordering. Fastify and Node lifecycle APIs are well documented; validate against the actual app rather than upgrading dependencies.

### Phase 4: Adversarial Integration Gate

**Rationale:** The handoff contract crosses process streams, Git, filesystem snapshots, browser state, persistence, and shutdown; only end-to-end scenarios can prove the boundaries compose.

**Delivers:** Scenarios for malformed/oversized/ambiguous requests, invalid revisions/pathspecs, exact patch variants, binary/rename/mode changes, scope and repository drift, reload/browser-open failure, double Finish, Finish/Cancel races, signals, stdout backpressure/EPIPE, cancellation, and zero-feedback success.

**Addresses:** All v1.3 table stakes and confirmed milestone acceptance criteria.

**Avoids:** Regression of interactive mode, false patch reviews, leaked capabilities, duplicate results, partial canonical output, and stale drafts.

**Research flag:** **No broad new research required** once the patch spike and lifecycle design are settled; this phase is executable validation with real Git fixtures and browser/process integration.

**Research flags summary:** Phase 2 is the highest-uncertainty research gate; Phases 1 and 3 need targeted repository validation; Phase 4 should test, not expand, the design. Recommendations above are not unresolved requirements: open validation work is explicitly limited to proving exact Git overlay behavior, supported patch dialect/edge cases, and final race/drift semantics.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Official Node, Git, Fastify, Zod documentation and installed versions support the no-dependency recommendation; isolated Git overlay behavior still needs proof at the project's Git 2.43 floor. |
| Features | HIGH for required behavior; MEDIUM for patch mechanism | Product boundaries and table stakes are clear; exact patch grounding and result wrapper details require implementation evidence. |
| Architecture | HIGH for reuse boundaries; MEDIUM-HIGH for patch overlay | Existing session/export/Git boundaries are well established; overlay lifetime and all patch fixtures remain to be exercised. |
| Pitfalls | HIGH | Failure modes are cross-checked against project constraints, existing lifecycle, and native Git semantics; adversarial integration must still demonstrate prevention. |

**Overall confidence:** MEDIUM-HIGH

### Gaps Address

- **Exact patch overlay at Git >=2.43:** validate temporary index/object/alternate-object behavior, cleanup, and blob reads with real fixtures before Phase 2 implementation is considered complete.
- **Accepted patch dialect:** document and test full-index/binary, rename/copy, mode, symlink, quoting, and unsupported combined/partial forms; do not silently broaden parsing.
- **Finish ordering and drift policy:** establish the accepted draft revision, pending-save settlement, repository drift response, and cancellation commit point against current draft/anchor APIs during Phase 3 planning.
- **Result contract evolution:** decide the minimal versioned request-bound wrapper/provenance union while preserving canonical export compatibility and exact-byte guarantees.
- **Pathspec/environment edge behavior:** verify supported native pathspec subset, `.compare/` exclusion, inherited Git environment neutralization, and deterministic zero-match behavior.

## Sources

### Primary (HIGH confidence)

- Git `rev-parse`, `merge-base`, `diff`, `apply`, `read-tree`, `write-tree`, and environment-variable documentation — revision pinning, ancestry, pathspecs, patch validation, temporary index/object overlay semantics.
- Fastify 5 hooks and server `close` documentation — response-flush completion and graceful shutdown.
- Zod 4 objects and discriminated-union documentation — strict request boundary and schema-derived types.
- Node.js 24 releases and stream/process documentation — supported runtime APIs, bounded stdin, fatal decoding, stdout backpressure, and exit behavior.
- Compare repository evidence (`package.json`, Git runner/inventory, comparison, server/session, draft, export, and UI modules) — existing authority and compatibility boundaries.

### Secondary (MEDIUM confidence)

- `diffmux` and `PRless` local review precedents — ecosystem expectations for local review annotations and agent delivery; useful comparison, not normative for Compare's contract.
- npm registry metadata for Fastify, Vue, Zod, Commander, and TypeScript — current-version checks; no upgrade is justified by this milestone.

### Tertiary (LOW confidence)

- None relied upon for a recommendation. The remaining uncertainty is implementation validation, not an unsupported external claim.

---
*Research completed: 2026-08-04*
*Ready for roadmap: yes*
