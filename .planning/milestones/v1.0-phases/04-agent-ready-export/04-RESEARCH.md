# Phase 4: Agent-Ready Export - Research

**Researched:** 2026-07-11
**Domain:** Canonical review serialization, crash-aware filesystem publication, Git identity/drift safety, and non-mutating packaged verification
**Confidence:** HIGH for project constraints and data-flow recommendations; MEDIUM for cross-platform durability guarantees because Node exposes OS-dependent primitives rather than a portable two-directory exchange

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Export location, snapshot, and re-export
- **D-01:** Use one stable comparison-specific directory: `.diff-review/exports/<fullBaseOid>..<fullHeadOid>/`, containing exactly `review.json` and `review.md`. Mutable labels never determine the path or comparison authority.
- **D-02:** Export one accepted whole-draft revision captured at export start. Canonical JSON and Markdown must derive from the same immutable snapshot; if canonical state changes before publication, fail and retry rather than mixing revisions.
- **D-03:** Re-export atomically replaces the stable pair for that pinned comparison only after both new files pass schema, derivation, and durability checks. Any failure preserves the previous complete pair.
- **D-04:** Canonically order files by exact repository-relative path identity and comments by side-specific anchor then stable comment ID. Use canonical JSON serialization and LF output. For unchanged accepted state, only the explicit export timestamp may vary.

#### Markdown review structure and agent contract
- **D-05:** Structure Markdown as: pinned comparison identities and drift status; optional summary; open actionable requests grouped by exact file path; non-actionable anchor problems; applying-agent instructions.
- **D-06:** Do not include resolved comments as requested work. Markdown shows their count and directs readers to canonical JSON for full history; JSON retains every comment state and timestamp.
- **D-07:** Every actionable Markdown comment shows repository-relative path, base/head side, recorded line, relevant blob ID, exact selected text, nearby context, context hash, and comment text. Never expose absolute filesystem paths.
- **D-08:** Embedded agent instructions require verification of pinned commit, blob, exact selected text, and context hash before editing. Line number alone is never authority. Ambiguous, missing, stale, or orphaned anchors must be reported, not guessed. Resolved comments must not be applied.
- **D-09:** Stale/orphaned open comments remain in JSON with state and anchors, but appear only in a non-actionable **Needs reviewer attention** Markdown section.

#### Drift and export readiness
- **D-10:** Selector drift does not invalidate the pinned review. Export the original pinned comparison, include launch/current selector identities and a prominent warning, and require explicit acknowledgement before publication. Never refresh the comparison automatically.
- **D-11:** The overall summary remains optional. When empty, omit its body and state **No summary provided** in metadata.
- **D-12:** Zero open actionable comments is valid. Export a complete artifact that explicitly states there are no open actionable requests while retaining full draft history in JSON.

#### Safety, gitignore, failure, and completion feedback
- **D-13:** If `/.diff-review/` is not ignored, offer an explicit append action that preserves every existing byte/rule and adds exactly one rule. Never modify `.gitignore` silently or rewrite existing content.
- **D-14:** Declining gitignore modification still allows export with a persistent warning. Diff Review's own comparison logic always excludes `.diff-review/` regardless of ignore state.
- **D-15:** Generate both formats in a temporary sibling generation, validate canonical JSON, Markdown derivation, content hashes, and snapshot revision, durably flush, then publish as one pair. A failed generation exposes neither new file.
- **D-16:** Success feedback shows accepted draft revision, export timestamp, repository-relative output paths, SHA-256 content hashes, drift acknowledgement state, and actions to copy paths or reveal the directory.
- **D-17:** Export may create files only beneath `.diff-review/` plus an explicitly approved append to `.gitignore`. It must never call add/commit/push/apply, write source, or execute repository code.
- **D-18:** Packaged tests cumpa HEAD, index, and source worktree state before/after export, excluding the explicitly permitted `.diff-review/` output and approved gitignore append, and cover pair-write failure without partial publication.

### Claude's Discretion
The user delegated all four export areas to Claude's recommendations. Planning may choose schema field names, canonical JSON encoder mechanics, temporary-generation naming, fsync/rename strategy per supported platform, and exact receipt styling while preserving every decision above.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within Phase 4 scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research support |
|---|---|---|
| EXP-01 | Explicit repository-local `review.json` and `review.md` export | Closed server export command, stable full-OID path, and receipt interface below |
| EXP-02 | Versioned, schema-valid canonical JSON with identities, summary, all comments/states/timestamps/anchors | Proposed `ReviewExportV1`, canonicalization pipeline, and validation invariants |
| EXP-03 | Markdown derived from canonical JSON, grouping open actionable comments and excluding resolved work | Pure projection and actionability truth table below |
| EXP-04 | Applying agent verifies commit/blob/context and reports ambiguity | Required instruction block and non-actionable classifications below |
| EXP-05 | Repository-relative paths and hashes after export | Receipt schema and exact-byte SHA-256 algorithm below |
| EXP-06 | Never expose only one new format after write failure | Sibling-generation transaction, rollback/recovery, and fault matrix below |
| EXP-07 | Deterministic except explicit export timestamp | Injected clock, canonical ordering, RFC 8785-compatible serialization, and golden tests below |
| EXP-08 | Never apply, stage, commit, or push | Closed route authority, Git-command allowlist, and before/after snapshots below |
| SAFE-04 | Exclude `.diff-review/` from comparison and safely add one ignore rule | Domain-level path exclusion plus explicit byte-preserving append below |
</phase_requirements>

## Summary

Phase 4 should be implemented as a server-owned export transaction over the Phase 3 canonical draft store, not as a browser serialization feature. The server captures one accepted aggregate draft revision, copies it into a strict versioned export document, resolves selector drift without changing the pinned comparison, requires an acknowledgement bound to the observed drift state, canonicalizes and validates JSON, reparses those exact bytes, derives Markdown only from that parsed document, hashes the exact bytes, and publishes the already-validated pair. This preserves the Phase 1–3 authority chain: full Git objects and lossless paths originate at launch, anchors originate from frozen blobs, and the accepted draft revision originates at the serialized persistence boundary. [VERIFIED: `.planning/phases/01-pinned-local-comparison/01-CONTEXT.md`, `.planning/phases/02-anchored-diff-review/02-CONTEXT.md`, `.planning/phases/03-complete-review-draft/03-CONTEXT.md`]

Node 24 provides file flush and rename primitives, but it does **not** document a portable atomic exchange of two non-empty directories. `writeFile({flush:true})` invokes `FileHandle.sync()` after successful writing, while `FileHandle.sync()` itself is explicitly OS/device-specific; `fsPromises.rename()` only promises a rename operation. [CITED: https://nodejs.org/docs/latest-v24.x/api/fs.html#fspromiseswritefilefile-data-options] [CITED: https://nodejs.org/docs/latest-v24.x/api/fs.html#filehandlesync] [CITED: https://nodejs.org/docs/latest-v24.x/api/fs.html#fspromisesrenameoldpath-newpath] Therefore the executable Node-core design is a serialized sibling-directory transaction with a complete backup, rollback on injected failures, startup recovery after interruption, directory sync where the supported platform permits it, and success visibility only after commit. This gives the required old-or-new **complete pair** invariant for controlled readers and all recoverable failures. A literal, continuously addressable, crash-atomic replacement of a non-empty stable directory would require either a native atomic-exchange primitive or a pointer/generation layout, both outside D-01; the planner must not falsely claim Node `rename()` alone provides that stronger property. [RESEARCH CONCLUSION]

**Primary recommendation:** Add one reconciled server-side `exportReview` transaction whose sole inputs are the expected draft revision and an optional server-issued drift acknowledgement token; generate canonical JSON first, derive Markdown from the reparsed canonical bytes, then commit a flushed sibling generation with rollback/recovery and return an exact-byte hash receipt.

## Architectural Responsibility Map

| Capability | Primary tier | Secondary tier | Rationale |
|---|---|---|---|
| Capture accepted immutable draft revision | API / Backend | Database / Storage | The Phase 3 server store owns canonical revision and serialization; browser state is not authority. [VERIFIED: Phase 3 D-12–D-14] |
| Build/validate canonical export document | API / Backend | — | Shared strict schemas and server-held comparison/anchor identities prevent client authority injection. [VERIFIED: Phase 4 D-02, D-17] |
| Render Markdown | API / Backend | — | A pure projection of canonical JSON prevents a second review model. [VERIFIED: Phase 4 D-02, D-05–D-09] |
| Publish and recover export pair | Database / Storage | API / Backend | Filesystem ordering, flush, rollback, and recovery are storage responsibilities surfaced as a typed result. [RESEARCH CONCLUSION] |
| Drift observation and acknowledgement | API / Backend | Browser / Client | Server re-resolves retained launch descriptors; client only confirms an opaque observation token. [VERIFIED: Phase 3 D-06; Phase 4 D-10] |
| Offer/perform ignore append | API / Backend | Browser / Client | UI makes the action explicit; server restricts the only permitted source-root write to `.gitignore`. [VERIFIED: Phase 4 D-13, D-17] |
| Display/copy/reveal receipt | Browser / Client | API / Backend | Server supplies validated relative paths/hashes; UI provides completion actions without inventing identities. [VERIFIED: Phase 4 D-16] |
| Exclude internal files from reviewed changes | API / Backend | Git adapter | Exclusion is a comparison-domain invariant independent of Git ignore configuration. [VERIFIED: Phase 4 D-14] |

## Standard Stack

No new external package is required or recommended. [RESEARCH CONCLUSION]

| Component | Version/contract | Purpose | Recommendation |
|---|---|---|---|
| Node.js core `node:fs/promises` | Supported Node 24 runtime | `open`, `writeFile`, `rename`, `rm`, `FileHandle.sync` | Inject a narrow filesystem port for deterministic fault testing; serialize operations because Node filesystem promises are not synchronized/thread-safe. [CITED: https://nodejs.org/docs/latest-v24.x/api/fs.html] |
| Node.js core `node:crypto` | Supported Node 24 runtime | SHA-256 exact-byte receipts | Use `createHash('sha256').update(buffer).digest('hex')`; hash buffers, not decoded/re-encoded strings. [CITED: https://nodejs.org/docs/latest-v24.x/api/crypto.html#cryptocreatehashalgorithm-options] |
| Existing shared Zod schemas | Exact installed version must be reconciled at execution | Runtime validation for draft, export, and API result algebra | Extend the existing schema owner; do not introduce a second validator. [VERIFIED: Phase 4 context “Established Patterns”] |
| Installed Git CLI | Existing project decision | Re-resolve retained selectors and check effective ignore state | Reuse the fixed-authority Git runner and argv arrays; never expose Git arguments in request bodies. [VERIFIED: `.planning/PROJECT.md`; Phase 1 D-18] |
| Project-owned canonical serializer | New internal pure function | Deterministic RFC 8785-compatible encoding of the strict export domain | Keep the supported JSON domain deliberately narrow and prove it with RFC vectors/golden bytes; adding a package solely for this small closed domain adds supply-chain surface. [RESEARCH CONCLUSION] |

### Canonical JSON profile

Use the RFC 8785 JSON Canonicalization Scheme rules for the export value: I-JSON-compatible values, no duplicate keys, recursive object-property sorting by unsigned UTF-16 code units, ECMAScript primitive serialization, no insignificant whitespace, no Unicode normalization, UTF-8 encoding, and rejection of lone surrogates/non-finite numbers. [CITED: https://www.rfc-editor.org/rfc/rfc8785.html#section-3] Arrays retain the explicit domain order established before canonicalization. [CITED: https://www.rfc-editor.org/rfc/rfc8785.html#section-3.2.3]

**Output framing decision:** `review.json` is the exact RFC-compatible UTF-8 canonical byte sequence with no trailing whitespace/newline. `review.md` uses LF only and exactly one final LF. This avoids appending a byte that is outside the canonical JSON representation while satisfying D-04’s LF policy for line-oriented output. [RESEARCH CONCLUSION] If product interpretation requires a final LF in JSON, name the format “JCS payload plus LF framing,” strip that one LF before canonical verification, and hash the complete framed file; do not call the framed bytes pure RFC 8785. [RESEARCH CONCLUSION]

### Package Legitimacy Audit

Not applicable: this phase should install no package. Existing Zod and test dependencies must be reconciled from the implemented Phase 1–3 lockfile before source work; prior PLAN files are contracts, not evidence that those dependencies or paths exist. [VERIFIED: Phase 4 context “Reusable Assets”]

## Required Upstream Reconciliation

Phase 1–3 are explicitly unimplemented at research time. [VERIFIED: `.planning/ROADMAP.md` Progress; Phase 4 context “Reusable Assets”] The first Phase 4 plan must perform a read-only automatic reconciliation before editing source and fail with a specific prerequisite error if implementation is absent. It must locate, rather than guess:

1. the one shared draft/export schema module and installed Zod version;
2. the whole-draft serialized queue/CAS store, raw loader, atomic writer, and draft-path/comparison-key factory;
3. the exact `ReviewDraftV1` fields, schema version, comment ID/timestamps/state, anchor path representation, context hash algorithm, and verification status vocabulary;
4. the fixed launch descriptors and selector-drift resolver, including its current observation DTO;
5. the secured Fastify route registry, token/Host/Origin hooks, opaque capability registry, API client, canonical Vue state owner, and reveal-directory capability;
6. the Git runner’s safe environment/argv conventions and the changed-record filter where `.diff-review/` must be excluded;
7. actual focused unit/API/Git/browser/package commands and filesystem fault seams.

No second store, schema vocabulary, security hook, Git runner, path encoding, anchor classifier, or browser canonical state is permitted. [VERIFIED: Phase 3 `03-01-PLAN.md` handoff contract]

## Proposed Interfaces and Data Model

Names are responsibility labels until reconciliation resolves actual owners. [RESEARCH CONCLUSION]

```ts
interface ExportReviewCommand {
  expectedRevision: number;
  driftAcknowledgementToken?: string; // opaque, server-issued; never OIDs/paths
}

type ExportReviewResult =
  | { kind: 'exported'; receipt: ExportReceipt }
  | { kind: 'revisionConflict'; expectedRevision: number; actualRevision: number }
  | { kind: 'driftAcknowledgementRequired'; observation: DriftObservation; acknowledgementToken: string }
  | { kind: 'driftAcknowledgementStale'; observation: DriftObservation; acknowledgementToken: string }
  | { kind: 'draftReadOnly'; reason: 'corrupt' | 'unsupportedSchema' }
  | { kind: 'publicationFailed'; stage: PublicationStage; retryable: true };

interface ExportReceipt {
  schemaVersion: 1;
  draftRevision: number;
  exportedAt: string; // canonical UTC RFC 3339 from injected clock
  driftAcknowledged: boolean;
  driftObservationId: string;
  files: readonly [
    { path: string; algorithm: 'sha256'; sha256: string; bytes: number },
    { path: string; algorithm: 'sha256'; sha256: string; bytes: number }
  ];
}

interface ExportServices {
  captureSnapshot(expectedRevision: number): Promise<ImmutableExportSnapshot>;
  buildDocument(snapshot: ImmutableExportSnapshot, exportedAt: string): ReviewExportV1;
  canonicalizeAndValidate(document: ReviewExportV1): Buffer;
  renderMarkdown(canonicalDocument: ReviewExportV1): Buffer;
  publishPair(input: PublishPairInput): Promise<PublishedPair>;
}
```

The route must reject unknown keys and accept no repository root, export path, filename, selector, ref, commit, blob, anchor, summary, comment collection, Git command, or overwrite flag. [RESEARCH CONCLUSION] A browser-provided `expectedRevision` is a concurrency precondition, not content authority; the server loads the entire accepted draft itself. [VERIFIED: Phase 3 D-12–D-14]

### Recommended `ReviewExportV1` shape

```ts
type ReviewExportV1 = {
  schemaVersion: 1;
  kind: 'diff-review/export';
  exportedAt: string;
  acceptedDraftRevision: number;
  comparison: {
    selectedBase: { label: string; launchOid: string };
    selectedHead: { label: string; launchOid: string };
    mergeBaseOid: string;
    comparisonKey: string;
  };
  drift: {
    status: 'unchanged' | 'moved' | 'unavailable';
    observedAt: string;
    acknowledged: boolean;
    base: { launchOid: string; currentOid: string | null; status: string };
    head: { launchOid: string; currentOid: string | null; status: string };
  };
  summary: { markdown: string | null };
  files: Array<{
    path: string; // existing exact safe repository-relative identity encoding
    comments: Array<{
      id: string;
      state: 'open' | 'resolved';
      anchorStatus: 'verified' | 'stale' | 'orphaned';
      body: string;
      createdAt: string;
      updatedAt: string;
      resolvedAt: string | null;
      anchor: {
        side: 'base' | 'head';
        line: number;
        blobOid: string;
        selectedText: string;
        contextBefore: string[];
        contextAfter: string[];
        contextHash: string;
      };
    }>;
  }>;
  counts: {
    all: number;
    openActionable: number;
    openNeedsAttention: number;
    resolved: number;
  };
};
```

`summary.markdown` should be `null` when the canonical Phase 3 exact string is empty; Markdown metadata prints **No summary provided** and omits a summary body. [VERIFIED: D-11] Counts are derived during export and schema-refined against the arrays; they are not separate mutable draft state. [RESEARCH CONCLUSION] JSON retains every current draft comment. Phase 3 hard-deletes comments and has no tombstones/history, so “full history” means every comment still present in the accepted revision, including resolved records—not previously deleted comments. [VERIFIED: Phase 3 D-05]

The export path is computed solely from already-validated lowercase full launch OIDs: `.diff-review/exports/${fullBaseOid}..${fullHeadOid}`. Use the project’s object-format-aware OID schema rather than hard-coding 40 hexadecimal characters; Git can expose different object formats, while D-01 requires the full identity. [CITED: https://git-scm.com/docs/git-rev-parse] [RESEARCH CONCLUSION]

## Deterministic Ordering and Derivation

1. Map every draft comment to its existing exact side-specific repository-relative path identity; for renames, a base-side comment uses the recorded old/base path and a head-side comment uses the recorded new/head path. [VERIFIED: Phase 2 D-12 and CMT-02 contract]
2. Group by that lossless canonical path key. Sort file groups by the project’s exact path-identity comparator, not locale, display-escaped text, case folding, or filesystem collation. [VERIFIED: Phase 1 D-11, D-14; Phase 4 D-04]
3. Within a path, sort by side (`base` before `head` as an explicit enum rank), recorded side-specific line ascending, blob OID, context hash, then stable comment ID. The final ID tie-breaker makes the order total. [RESEARCH CONCLUSION]
4. Build arrays in that order; canonicalization sorts object keys recursively but never reorders arrays. [CITED: https://www.rfc-editor.org/rfc/rfc8785.html#section-3.2.3]
5. Parse the canonical bytes as JSON and validate again with `ReviewExportV1Schema`; render Markdown from **that reparsed value**, never from the draft or a parallel view model. [RESEARCH CONCLUSION]
6. Render all Markdown newlines through one `lines.join('\n') + '\n'`; never use `os.EOL`. Escape Markdown structural characters in path/selected text/context/comment display, or use fenced blocks with a dynamically safe fence length. Preserve original text inside JSON exactly and never Unicode-normalize it. [CITED: https://www.rfc-editor.org/rfc/rfc8785.html#section-3.1]
7. Inject one `exportedAt` instant and reuse it in JSON, Markdown metadata, and receipt. Existing draft/comment timestamps must pass through unchanged. [RESEARCH CONCLUSION]

### Actionability truth table

| Comment state | Anchor status | Requested work in Markdown? | Markdown placement | JSON |
|---|---|---:|---|---|
| open | verified | Yes | **Open actionable requests**, grouped by exact path | Full record |
| open | stale | No | **Needs reviewer attention**, reason and recorded anchor | Full record |
| open | orphaned | No | **Needs reviewer attention**, reason and recorded anchor | Full record |
| resolved | any | No | Count only; canonical JSON pointer | Full record |

“Verified” means exact commit/blob/path/side/selected-text/context verification under the existing Phase 2 verifier. Export must not search for a similar line, reattach, or promote stale/orphaned records. [VERIFIED: Phase 2 CMT-08 contract; Phase 4 D-08–D-09]

### Required applying-agent instruction block

The generated Markdown must state, as normative instructions:

- operate against the pinned head commit shown in the artifact, not a mutable branch label;
- before every edit, verify the relevant side’s pinned commit, exact blob OID, repository-relative path, exact selected text, and context hash;
- treat line number only as a navigation hint;
- do not apply resolved comments;
- do not apply stale, orphaned, missing, or ambiguous anchors; report them to the reviewer with the comment ID and recorded identity;
- do not guess, fuzzy-match, or silently relocate an anchor;
- report if the current checkout/object differs from the pinned identity.

[VERIFIED: Phase 4 D-07–D-09, EXP-04]

## Snapshot, Drift, and Publication Algorithm

### 1. Capture the accepted snapshot

Enter the existing per-comparison serialized draft boundary. Load/classify the draft; reject corrupt/newer-unsupported state without changing its bytes. Require `expectedRevision === draft.revision`. Validate the current draft schema, clone it into a new immutable export snapshot, and compute a canonical draft fingerprint for later defense-in-depth revalidation. Exit the queue while generation work proceeds. [VERIFIED: Phase 3 D-12–D-17] A successful Phase 3 mutation always increments the whole-draft revision, so revision is the primary snapshot token. [VERIFIED: Phase 3 `03-02-PLAN.md` contract]

### 2. Bind drift acknowledgement to an observation

Re-resolve only the server-retained launch descriptors through the existing fixed-authority drift resolver. [VERIFIED: Phase 3 `03-06-PLAN.md` contract] Create an opaque, session-bound observation ID/token over the role/status/launch/current OIDs. If either selector moved or became unavailable and the request lacks the exact current token, return `driftAcknowledgementRequired` without generating/publishing. A retry carries only that opaque token. Immediately before commit, observe drift again; if the observation changed, return `driftAcknowledgementStale` with a new token. Never replace pinned OIDs, comparison key, blobs, anchors, draft, or export directory. [RESEARCH CONCLUSION]

Git refs are selectors that may resolve differently over time, while the resolved object names identify the pinned objects; the export must retain both launch and current observations. [CITED: https://git-scm.com/docs/git-rev-parse] Because Git offers no transaction tying an arbitrary ref observation to a filesystem rename, the receipt must include `observedAt` and the acknowledged observation ID rather than claim the ref could not move a microsecond later. [RESEARCH CONCLUSION]

### 3. Generate and validate a sibling candidate

Under a per-comparison export mutex, recover any prior interrupted transaction, then create unpredictable sibling names beneath `.diff-review/exports/`, for example `.<pair>.candidate-<random>` and `.<pair>.backup-<random>`. Reject symlinks and unexpected file types at every managed boundary; never follow a repository-controlled symlink out of `.diff-review/`. [RESEARCH CONCLUSION]

Write `review.json` and `review.md` into the candidate with exclusive creation and mode `0o600` (subject to umask). Use exact `Buffer`s and `writeFile({flush:true})`, then close. Node documents that `flush:true` calls `FileHandle.sync()` after a successful write; sync behavior remains OS/device-specific. [CITED: https://nodejs.org/docs/latest-v24.x/api/fs.html#fspromiseswritefilefile-data-options] Re-read both candidate files, hash their bytes, parse/validate JSON, re-render Markdown from parsed JSON, and require byte equality with the candidate Markdown. Require the directory to contain exactly the two expected regular files. Sync the candidate directory and exports parent when the supported platform permits opening/syncing directories; platform-specific behavior must be integration-tested, not assumed. [RESEARCH CONCLUSION]

### 4. Revalidate and commit

Re-enter the existing draft serialization boundary while holding the export mutex. Reload the canonical draft and require the same revision and fingerprint; re-observe drift and require the same acknowledged observation. On mismatch, delete only the candidate and return a typed retry result. [RESEARCH CONCLUSION]

Publication state machine:

```text
ABSENT:       candidate --rename--> stable --sync parent--> COMMITTED
RE-EXPORT:    stable --rename--> backup
              candidate --rename--> stable
              sync parent
              delete backup
              sync parent
FAILURE:      if stable missing and backup complete, rename backup back to stable
RECOVERY:     stable complete => discard stale candidate/backup
              stable absent + one valid backup => restore backup, sync parent
              ambiguous remnants => preserve all, return recovery error; never guess/delete
```

`rename()` prevents readers from seeing candidate files individually on the first publication, but Node does not document a portable atomic exchange for the re-export’s `stable → backup → candidate → stable` sequence. [CITED: https://nodejs.org/docs/latest-v24.x/api/fs.html#fspromisesrenameoldpath-newpath] The design therefore guarantees no **mixed or one-file new generation**, rollback of ordinary/injected failures, and deterministic restart recovery; a short stable-path absence/crash window remains on portable Node core. [RESEARCH CONCLUSION] If the acceptance gate interprets D-03 as zero absence even across power loss/uncooperative external readers, the plan must add a supported-platform native atomic directory-exchange adapter and a fallback policy, or revise D-01 to allow an atomically swapped pointer. It must not weaken the test while claiming stronger semantics. [RESEARCH CONCLUSION]

Return success only after stable files are re-read, hashes equal the generated hashes, the stable directory has exactly two regular files, and the containing directory sync has completed or an explicitly tested supported-platform durability policy has succeeded. Delete cleanup remnants only after commit. [RESEARCH CONCLUSION]

## SHA-256 Receipt Rules

Hash each final file independently over its exact published bytes using `createHash('sha256').update(buffer).digest('hex')`. [CITED: https://nodejs.org/docs/latest-v24.x/api/crypto.html#cryptocreatehashalgorithm-options] Use lowercase 64-character hex, label the algorithm, include byte length, and return repository-relative POSIX-style paths only. [RESEARCH CONCLUSION] Never hash the JavaScript object, pre-canonical draft, decoded/reformatted content, pathname, or the pair concatenation without framing. [RESEARCH CONCLUSION]

Recommended receipt display:

```text
Exported accepted draft revision 17 at 2026-07-11T18:30:00.000Z
Drift: acknowledged (observation …)
.diff-review/exports/<base>..<head>/review.json
  sha256:<64 lowercase hex>  <n> bytes
.diff-review/exports/<base>..<head>/review.md
  sha256:<64 lowercase hex>  <n> bytes
```

The receipt is API/UI state, not a third file, preserving D-01’s exactly-two-files directory. [VERIFIED: D-01, D-16]

## Gitignore Append Safety

The exact offered rule is `/.diff-review/`. A leading slash anchors the pattern to the `.gitignore` directory and a trailing slash matches a directory. [CITED: https://git-scm.com/docs/gitignore#_pattern_format] Effective ignore behavior may also come from nested `.gitignore`, `$GIT_COMMON_DIR/info/exclude`, `core.excludesFile`, and later negations, so test effective behavior with the fixed probe `.diff-review/.diff-review-ignore-probe` via the existing Git runner’s `check-ignore --no-index`, rather than merely searching root `.gitignore`. [CITED: https://git-scm.com/docs/gitignore#_description] [CITED: https://git-scm.com/docs/git-check-ignore]

The explicit mutation command should accept no text/path from the browser. [RESEARCH CONCLUSION] Server algorithm:

1. Authorize through inherited token/Host/Origin checks; require an explicit action distinct from Export. [VERIFIED: D-13, SAFE-02]
2. Resolve only `<fixed repository root>/.gitignore`; `lstat` each boundary, reject symlinks/non-regular files, and use no-follow flags where supported. [RESEARCH CONCLUSION]
3. Serialize all in-process ignore actions. Open/create only the fixed root file for append, retain its current mode, and reread current bytes immediately before writing. [RESEARCH CONCLUSION]
4. Re-run the effective-ignore probe. If already ignored, write nothing and return `alreadyIgnored`. [RESEARCH CONCLUSION]
5. Append one buffer: `existing ends 0x0a ? '/.diff-review/\n' : '\n/.diff-review/\n'`. The optional leading LF separates the new rule while every existing byte remains an unchanged prefix; it is not a rewrite or newline conversion. [RESEARCH CONCLUSION]
6. Flush the append before success, then verify old bytes are an exact prefix, the suffix is exactly the calculated append, and the Git probe now reports ignored. [RESEARCH CONCLUSION]
7. If append/flush fails, report the uncertainty honestly; direct append cannot be rolled back safely without rewriting possibly concurrent user content. Do not truncate or “restore” `.gitignore`. [RESEARCH CONCLUSION]

Core Node has no portable mandatory advisory file lock, so an external process editing `.gitignore` concurrently cannot be made fully transactional by an in-process mutex. [RESEARCH CONCLUSION] The planner must test internal concurrent requests and preserve external bytes through append semantics; it must not use read-modify-temp-rename because that can overwrite an external concurrent edit and contradicts “explicit append.” [RESEARCH CONCLUSION]

Declining or failing the append does not block export. Persist the warning in the current UI session/receipt feedback, but do not place mutable preference state into the canonical review document. [VERIFIED: D-14]

## `.diff-review/` Comparison Exclusion

Ignore configuration is not a security or correctness boundary. Filter `.diff-review` at the canonical changed-record construction layer using the existing lossless repository-relative path identity. Exclude a record when **either** old/base or new/head path is exactly `.diff-review` or has the exact root prefix `.diff-review/`; this covers adds, deletes, renames, and copies crossing the boundary. Do not use substring, case-folded, display-escaped, absolute-path, glob-from-user, or host-separator comparisons. [RESEARCH CONCLUSION]

This filter must run regardless of whether `.diff-review/` is tracked, ignored, untracked, absent, or later negated in ignore configuration. [VERIFIED: D-14, SAFE-04] Add a Phase 1 regression test at the actual inventory owner plus a packaged Phase 4 proof that exports never appear in the reviewed change set. [RESEARCH CONCLUSION]

## Source-Control Non-Mutation Boundary

The export route may invoke only: canonical draft reads, fixed selector resolution for drift, effective ignore inspection, writes beneath the fixed `.diff-review/` root, and the separately approved `.gitignore` append. [VERIFIED: D-17] It must not expose or call `git add`, `apply`, `am`, `commit`, `merge`, `rebase`, `reset`, `restore`, `checkout`, `switch`, `update-index`, `update-ref`, `push`, hooks, package scripts, repository binaries, editors, pagers, or shell command strings. [RESEARCH CONCLUSION]

Use argv arrays, a fixed working directory, `shell:false`, and the existing sanitized Git environment. [VERIFIED: Phase 1 safe-Git contract] Keep export filesystem functions below a capability rooted at `.diff-review`; do not accept relative traversal and do not trust symlinks inside a repository controlled by the reviewed content. [RESEARCH CONCLUSION]

## Test and Fault-Injection Strategy

Nyquist validation is explicitly disabled in `.planning/config.json`, so no formal Validation Architecture section is required. [VERIFIED: `.planning/config.json`]

### Unit boundaries

- **Canonical bytes:** golden vectors with permuted insertion order, nested objects, arrays, quotes/control characters, Unicode/non-BMP keys, negative zero, safe integer boundaries, and rejection of lone surrogates/non-finite values. Include selected RFC 8785 vectors. Assert exact UTF-8 bytes and no final JSON LF. [CITED: https://www.rfc-editor.org/rfc/rfc8785.html]
- **Domain ordering:** unusual safe path identities, base/head same numeric line, rename old/new paths, identical anchors with different IDs, locale/case traps. Assert a total stable order. [RESEARCH CONCLUSION]
- **Projection:** parse canonical bytes, render Markdown, and test the four-row actionability table, empty summary, zero actionable comments, resolved count/history pointer, fenced adversarial Markdown text, LF-only output, and no absolute path. [RESEARCH CONCLUSION]
- **Schema invariants:** full OIDs, revision/timestamp/state relationships, resolvedAt invariants, counts matching records, exact two format names, and unknown-key rejection. [RESEARCH CONCLUSION]
- **Receipts:** exact-byte mutation changes the relevant hash; same bytes reproduce it; published re-read hash must match. [CITED: https://nodejs.org/docs/latest-v24.x/api/crypto.html]

### Filesystem transaction fault matrix

Build `ExportFs` as a narrow injected port and fail each awaited boundary once: create candidate, open/write/sync/close JSON, open/write/sync/close Markdown, candidate readback, schema validation, derivation equality, either hash, candidate-directory sync, precommit revision check, drift recheck, stable-to-backup rename, candidate-to-stable rename, parent sync, backup cleanup, final readback. [RESEARCH CONCLUSION]

For every precommit/injected failure with an existing export, assert the old `review.json` and `review.md` bytes/hashes remain together; with no existing export, assert neither stable file exists. After a commit-point cleanup failure, assert the new stable pair is complete and recovery removes only a validated stale backup. Never accept old JSON/new Markdown, new JSON/old Markdown, one stable file, a receipt before durability, or deletion of ambiguous remnants. [RESEARCH CONCLUSION]

Add child-process crash tests at the transaction journal/state boundaries: after backup rename, after candidate rename, before/after parent sync, and before backup deletion. Restart recovery must deterministically restore or retain a complete pair and preserve ambiguous evidence. [RESEARCH CONCLUSION]

### Gitignore tests

Use byte fixtures for missing/empty files, LF, CRLF, no final newline, comments, blank lines, trailing spaces, UTF-8/non-UTF-8 opaque bytes, an exact rule, a broader effective rule, a later negation, `info/exclude`, symlink/non-regular targets, two simultaneous explicit requests, and write/flush failure. Assert the original buffer is an exact prefix and only the calculated suffix is added. [RESEARCH CONCLUSION]

### Real-Git and packaged boundaries

Use disposable repositories/worktrees and the actual generated CLI/server/browser assets. Test branch→branch, branch→worktree, worktree→branch, and worktree→worktree export; same-pair resume; selector movement before acknowledgement and again after acknowledgement; stale/orphan/resolved/zero-actionable cases; unsupported content; unusual paths; authentication/origin/arbitrary-authority denial; explicit ignore accept/decline; and copy/reveal receipt actions. [VERIFIED: Roadmap Phase 4 success criterion 5]

Before and after each export, record independently:

- full `HEAD` OID;
- exact index file bytes/hash at the worktree-specific Git path;
- tracked source content/mode snapshot excluding only `.diff-review/**` and, when approved, `.gitignore`;
- staged and unstaged binary-safe diffs with external diff/textconv disabled;
- untracked path identities and bytes excluding `.diff-review/**`;
- refs and configured remotes relevant to the fixture;
- a Git-command audit log from the test adapter/wrapper.

[RESEARCH CONCLUSION] Assert equality of every non-permitted snapshot and assert the audit log contains no source-mutating or network command. A clean-only fixture is insufficient: seed staged, unstaged, and untracked bytes before export so a destructive implementation is observable. [VERIFIED: D-18]

Run the real filesystem transaction tests on every supported OS because flush, directory handles, rename replacement, antivirus/file-lock behavior, and crash recovery are platform-sensitive. Node explicitly describes file sync as OS/device-specific. [CITED: https://nodejs.org/docs/latest-v24.x/api/fs.html#filehandlesync]

## Ordering Constraints for the Planner

1. **Reconcile actual Phase 1–3 implementation** and focused commands; stop with a prerequisite error if absent. Do not prompt or guess. [VERIFIED: unimplemented-prior-phase assumption]
2. **Deepen shared contracts first:** export schema/result algebra, actionability classifier, canonical serializer, Markdown projector, receipt hashing; prove pure deterministic behavior. [RESEARCH CONCLUSION]
3. **Add storage transaction and recovery** behind an injected filesystem port; pass the full fault/crash matrix before routing. [RESEARCH CONCLUSION]
4. **Integrate snapshot/CAS and drift acknowledgement** with the existing serialized store/resolver; reject stale revision/observation before commit. [RESEARCH CONCLUSION]
5. **Add closed authenticated export and gitignore commands**; neither accepts authority-bearing paths/OIDs/content. [RESEARCH CONCLUSION]
6. **Add UI export readiness, warning, acknowledgement, receipt, copy/reveal, and explicit separate ignore action.** [VERIFIED: D-10, D-13, D-16]
7. **Deepen the existing comparison inventory exclusion** for `.diff-review/` at old/new path identity. [VERIFIED: SAFE-04]
8. **Finish with real-Git packaged and crash/fault verification**, including dirty source snapshots and command audit. [VERIFIED: D-18]

## Security and Safety Checklist

- [ ] Export route inherits token, Host, Origin, method, content-type/body-size, and strict-schema controls before loading draft or touching disk. [VERIFIED: SAFE-02 inherited boundary]
- [ ] Browser request contains only expected revision and opaque drift acknowledgement token. [RESEARCH CONCLUSION]
- [ ] Repository root, comparison, OIDs, output directory, filenames, and Git selectors are server-retained fixed authority. [VERIFIED: SAFE-03, D-01]
- [ ] Every managed path is containment-checked and symlink/non-regular boundaries are rejected. [RESEARCH CONCLUSION]
- [ ] Canonical JSON rejects unsupported Unicode/numbers and is schema-validated before and after serialization. [CITED: RFC 8785 §3]
- [ ] Markdown safely fences/escapes untrusted review/path text and never renders absolute paths or executable HTML as authority. [RESEARCH CONCLUSION]
- [ ] SHA-256 covers exact final bytes and is recomputed from stable published files before receipt. [CITED: Node crypto docs]
- [ ] Drift acknowledgement is bound to the latest server observation; drift never changes pinned comparison or anchors. [VERIFIED: D-10]
- [ ] Open stale/orphaned and all resolved feedback are non-actionable. [VERIFIED: D-06, D-09]
- [ ] Publication is serialized per comparison, validates both files, flushes before commit, rolls back failures, and recovers interrupted generations without guessing. [RESEARCH CONCLUSION]
- [ ] `.gitignore` modification is a separate explicit fixed-rule append; declining does not block export. [VERIFIED: D-13–D-14]
- [ ] `.diff-review/` exclusion is unconditional at the comparison-domain layer. [VERIFIED: SAFE-04]
- [ ] No Git mutation/network commands, source writes, shell, hook, package script, or repository code execution occurs. [VERIFIED: D-17, EXP-08]
- [ ] Receipt/reveal paths remain repository-relative; terminal diagnostics do not leak session tokens. [VERIFIED: D-16 and inherited Phase 1 security]

## Applicable ASVS Categories

| ASVS category | Applies | Required control |
|---|---:|---|
| V2 Authentication | Yes | Reuse the per-process session token; no new auth surface. [VERIFIED: SAFE-02] |
| V3 Session Management | Yes | Drift acknowledgement token is opaque, session-bound, short-lived/current-observation-only, and not persisted in export. [RESEARCH CONCLUSION] |
| V4 Access Control | Yes | Fixed repository/comparison/output capabilities; request cannot select filesystem/Git authority. [VERIFIED: SAFE-03, D-17] |
| V5 Validation, Sanitization, Encoding | Yes | Strict Zod input/output/export schemas, canonical JSON constraints, safe Markdown rendering, path containment. [RESEARCH CONCLUSION] |
| V6 Stored Cryptography | Yes, integrity receipt only | Node/OpenSSL SHA-256; no custom hash and no claim of authenticity/signature. [CITED: Node crypto docs] |
| V8 Data Protection | Yes | No absolute paths or secrets in artifact/receipt; local mode `0o600`; preserve untrusted review text as data. [RESEARCH CONCLUSION] |
| V12 Files and Resources | Yes | Fixed filenames/root, no-follow/type checks, exact-byte append, bounded writes, directory recovery. [RESEARCH CONCLUSION] |
| V14 Configuration | Yes | Supported OS durability behavior and packaged artifact boundary must be explicit and tested. [RESEARCH CONCLUSION] |

### Threat patterns

| Pattern | STRIDE | Mitigation |
|---|---|---|
| Client-selected output/path traversal or symlink escape | Elevation/Tampering | Server-fixed capability, containment, lstat/no-follow, regular-file checks |
| Mixed revision or mixed JSON/Markdown | Tampering/Repudiation | immutable snapshot token, derivation from reparsed canonical bytes, serialized pair transaction |
| Hashing a logical object instead of file bytes | Repudiation | read-back exact-byte SHA-256 with byte length |
| Ref moves after review | Tampering | pinned launch OIDs plus server observation and bound acknowledgement; no refresh |
| Markdown instruction injection | Spoofing | fixed instruction template; review content rendered only as escaped/fenced data |
| `.gitignore` clobber | Tampering | separate explicit fixed append; original-byte prefix verification; no rewrite |
| Repository mutation or code execution | Tampering/Elevation | closed allowlist and packaged before/after/audit proof |
| Crash during re-export | Availability/Tampering | complete candidate/backup, synced state transitions, deterministic recovery, preserved ambiguity |

## Common Pitfalls

### Calling two file renames “atomic pair publication”
**What goes wrong:** JSON becomes visible before Markdown or re-export creates a mixed generation.  
**Avoidance:** Publish a validated directory generation, retain a complete backup, test every boundary, and document the portable Node re-export absence/crash window rather than overstating `rename()`. [CITED: Node fs rename docs] [RESEARCH CONCLUSION]

### Rendering Markdown from the draft
**What goes wrong:** JSON and Markdown can encode different ordering, filtering, timestamp, or revision.  
**Avoidance:** canonicalize JSON, parse and validate those exact bytes, and render only that value. [RESEARCH CONCLUSION]

### Treating line number or current ref as identity
**What goes wrong:** an applying agent edits a plausible but wrong location after drift.  
**Avoidance:** require pinned commit, relevant blob, path/side, exact selected text, and context hash; report ambiguity. [VERIFIED: EXP-04, D-08]

### Scanning `.gitignore` text to decide ignored state
**What goes wrong:** broader rules, other exclude sources, or later negations make the answer wrong.  
**Avoidance:** use fixed `git check-ignore --no-index` probe and append only after explicit action. [CITED: Git gitignore/check-ignore docs]

### Temp-rename rewriting `.gitignore`
**What goes wrong:** mode/inode/newline style changes or a concurrent external edit is lost.  
**Avoidance:** fixed append-only write; preserve original bytes as an exact prefix. [RESEARCH CONCLUSION]

### Hashing before publication and never reading back
**What goes wrong:** receipt describes intended bytes, not durable published bytes.  
**Avoidance:** cumpa precommit and stable read-back hashes before returning success. [RESEARCH CONCLUSION]

### Testing only a clean repository
**What goes wrong:** accidental reset/index/worktree mutation remains invisible.  
**Avoidance:** seed distinct HEAD, staged, unstaged, and untracked states and cumpa each independently. [VERIFIED: D-18]

### Trusting prior PLAN filenames as implemented APIs
**What goes wrong:** Phase 4 creates parallel owners or cannot compile after prior phases execute differently.  
**Avoidance:** mandatory automatic reconciliation from actual summaries/source/lockfile before editing. [VERIFIED: Phase 4 context “Reusable Assets”]

## Don't Hand-Roll

| Problem | Do not build | Use instead | Why |
|---|---|---|---|
| Runtime schema validation | Ad hoc property checks | Existing shared Zod owner | One contract across persistence/API/export; strict unknown-key/invariant handling. [VERIFIED: established project pattern] |
| Cryptographic digest | Custom checksum/hash | Node `createHash('sha256')` | Standard exact-byte SHA-256 implementation. [CITED: Node crypto docs] |
| Ref parsing/object resolution | String parsing `.git` files | Existing safe Git CLI adapter | Worktrees, symbolic refs, object formats, and unavailable objects already belong there. [VERIFIED: project decision] |
| Anchor reattachment | Fuzzy text search | Existing exact Phase 2 verifier/classification | Guessing violates CMT-08 and D-08. [VERIFIED: Phase 2/4 contracts] |
| Markdown review model | A second independently filtered DTO | Pure projection of reparsed `ReviewExportV1` | Prevents revision/filter/order divergence. [RESEARCH CONCLUSION] |
| Generic filesystem API | User-supplied output paths | Fixed export/gitignore capabilities | Eliminates arbitrary write authority. [VERIFIED: D-17] |

**Key insight:** canonical export is not “write two strings”; it is a concurrency-controlled, identity-preserving storage transaction whose readable Markdown is a projection of one machine contract. [RESEARCH CONCLUSION]

## Explicit Assumptions Log

| # | Assumption caused by unimplemented prior phases | Planning consequence | Risk if wrong |
|---|---|---|---|
| A1 | Phase 3 will expose one serialized whole-draft store with monotonically increasing revision and immutable canonical responses, as contracted in `03-02-PLAN.md`. [ASSUMED] | Reconcile actual store/queue before choosing signatures; export optimistic capture and precommit revalidation attach there. | A parallel lock could permit mixed revisions. |
| A2 | The persisted anchor has an exact safe repository-relative path identity, side, line, blob OID, selected text, context window/hash, and verified/stale/orphan vocabulary. [ASSUMED] | Map actual fields into `ReviewExportV1`; do not invent/convert identities silently. | Export may omit required identity or corrupt unusual paths. |
| A3 | Phase 3 drift resolver retains launch descriptors server-side and returns role-specific launch/current full OIDs plus unavailable state. [ASSUMED] | Extend it with observation IDs/tokens; browser never supplies selectors/OIDs. | A new resolver could broaden authority or acknowledge stale drift. |
| A4 | Existing comparison inventory exposes lossless old/new path identities at one canonical filter seam. [ASSUMED] | Put unconditional `.diff-review/` filtering there. | Filtering only display output could leak internal changes elsewhere. |
| A5 | Existing API security hooks, reveal capability, Git runner, test helpers, and package scripts match the responsibilities named in prior PLANs. [ASSUMED] | First task records actual paths/exports/commands and substitutes them in all later tasks. | Planned paths/tests may not exist. |
| A6 | Supported release platforms permit the chosen directory-open/sync strategy, or the project can explicitly limit durability support. [ASSUMED] | Run platform-specific integration/crash tests and define fallback/error policy before claiming D-15. | Flush success may not imply directory-entry durability. |
| A7 | “Atomic pair” acceptance means no mixed/one-file new generation plus rollback/recovery for tested failures, not a portable zero-absence directory exchange across kill/power loss. [ASSUMED] | Implement sibling transaction and make the limitation an explicit verification result; otherwise require native exchange/layout decision. | Literal D-03 interpretation cannot be met by portable Node core with D-01’s exact layout. |

## Open Questions Resolved as Planning Rules

1. **Does export lock the draft for the full generation?** No. Capture immutable revision, generate outside the queue, then re-enter and revalidate revision/fingerprint before commit. This avoids blocking edits while guaranteeing stale generation never publishes. [RESEARCH CONCLUSION]
2. **Does selector drift invalidate export?** No. It requires a server-bound acknowledgement and remains prominent metadata; the pinned comparison is unchanged. [VERIFIED: D-10]
3. **Are stale/orphaned comments actionable?** No. Open records go only to Needs reviewer attention; resolved records are count-only in Markdown; all remain in JSON if present in the draft. [VERIFIED: D-06, D-09]
4. **May JSON contain its own file hash?** No. That is circular. Hashes live in the post-publication receipt. [RESEARCH CONCLUSION]
5. **May ignore setup be folded into Export?** No. It is a separate explicit action; decline still exports. [VERIFIED: D-13–D-14]
6. **May a package solve canonicalization/publication?** No new package is needed. Canonicalization is a small closed-domain pure function with RFC vectors; publication semantics still require project-specific snapshot/drift/recovery logic. [RESEARCH CONCLUSION]

## Environment Availability

No external dependency is newly introduced by this phase. [RESEARCH CONCLUSION] Actual Node, Git, Zod, browser, supported OS, package scripts, and prior source availability must be observed by the Phase 4 reconciliation task after Phases 1–3 execute; this research intentionally did not run project-wide commands, tests, package managers, or implementation probes. [VERIFIED: assignment constraint]

## Sources

### Primary project contracts (HIGH confidence)
- `.planning/PROJECT.md` — stack, native Git, canonical JSON/Markdown, local/source-read-only boundary.
- `.planning/REQUIREMENTS.md` — EXP-01–EXP-08, SAFE-04, milestone acceptance.
- `.planning/ROADMAP.md` § Phase 4 — goal and success criteria.
- Phase 1–4 CONTEXT files — locked D-01–D-18 and upstream identity/anchor/draft contracts.
- Relevant Phase 1–3 PLAN artifacts — provisional responsibility contracts only, explicitly not implemented APIs.

### Official technical sources (MEDIUM confidence from research seam)
- https://nodejs.org/docs/latest-v24.x/api/fs.html — Node v24.18 filesystem promises, flush, `FileHandle.sync`, rename, and concurrency caveats.
- https://nodejs.org/docs/latest-v24.x/api/crypto.html — SHA-256 `createHash` exact-byte API.
- https://www.rfc-editor.org/rfc/rfc8785.html — JSON Canonicalization Scheme rules and test guidance.
- https://git-scm.com/docs/git-rev-parse — revision selectors and object identity resolution.
- https://git-scm.com/docs/gitignore — ignore source precedence and pattern syntax.
- https://git-scm.com/docs/git-check-ignore — effective ignore inspection.

## Metadata

**Confidence breakdown:**
- Project/requirement traceability: HIGH — copied and mapped from locked local contracts.
- Canonical serialization and SHA-256: HIGH in design, MEDIUM provenance tier — grounded in RFC 8785 and current Node 24 official docs.
- Architecture/actionability/drift: HIGH — direct consequence of Phase 1–4 locked decisions.
- Filesystem failure semantics: MEDIUM — Node primitives are documented, but exact crash durability is OS/device-specific and portable atomic directory exchange is absent from the documented API.
- Upstream interfaces: LOW until reconciliation — prior phases are not implemented; all concrete source names remain assumptions.

**Research date:** 2026-07-11  
**Valid until:** 2026-08-10 for Node/Git API details; revalidate after any Phase 1–3 implementation or contract change.
