# Phase 4: Agent-Ready Export — Pattern Map

**Mapped:** 2026-07-11  
**Evidence status:** Greenfield. No Phase 1–3 source implementation was inspected or assumed to exist. Every `src/**`, `tests/**`, export name, DTO, route, method, and symbol below is a **planned responsibility label** until the mandatory execution-time reconciliation resolves the actual implemented owner.  
**Primary inputs:** `04-CONTEXT.md`, `04-RESEARCH.md`, `04-UI-SPEC.md`  
**Upstream contracts inspected:** Phase 1 plans `01-03`, `01-04`, `01-06`; Phase 2 plans `02-02`, `02-03`, `02-04`, `02-05`, `02-06`, `02-07`; Phase 3 plans `03-01`, `03-02`, `03-04`, `03-06`, plus their context-level ownership boundaries.

## How the Planner Must Use This Map

1. Treat every Phase 1–3 plan as a **contract**, never as evidence that a named path or export exists.
2. Make the first Phase 4 task a read-only automatic reconciliation against implemented source, package/lock data, summaries, and focused commands. If Phases 1–3 are absent, stop with a specific prerequisite error; do not create guessed parallel owners.
3. Substitute actual paths and exports into later tasks. The responsibility labels below indicate what to locate, not what to manufacture blindly.
4. Preserve the authority chain: fixed launch comparison → server-built immutable anchors → accepted whole-draft store revision → server-owned export transaction → validated exact-byte receipt.
5. Do not ask the browser to serialize, classify, order, hash, choose a path, or supply Git/filesystem authority.

## Existing Evidence vs Proposed Reconciliation

| Statement | Status | Planning consequence |
|---|---|---|
| Phase 1 contracts a native-Git adapter, lossless path identity, frozen comparison DTO, closed Fastify registry, token/Host/Origin guard, opaque capabilities, and focused real-Git/API/package seams. | **Upstream plan contract**, not implementation evidence | Locate and extend the actual owners. |
| Phase 2 contracts strict draft/anchor schemas, exact context hashes, an atomic comparison-local draft store, canonical accepted records, and browser workspace state. | **Upstream plan contract**, not implementation evidence | Reuse exact schema vocabulary, path representation, verifier, writer/fault seam, and fixtures. |
| Phase 3 contracts one aggregate revisioned draft, serialized CAS queue, raw loader/recovery, selector-drift resolver, canonical Vue draft owner, Review panel, API client, and reveal capability. | **Upstream plan contract**, not implementation evidence | Export must snapshot through these owners; it must not create a second draft or UI authority. |
| RFC-8785-compatible canonicalization, export DTO field names, opaque drift acknowledgement token, transaction generation names, and `ExportFs` are recommended designs. | **Phase 4 proposal/research conclusion** | Reconcile naming and supported-platform behavior before implementation; preserve behavior even if names change. |
| Portable Node core can atomically exchange two non-empty directories with zero absence window. | **Not established; explicitly false as a portable claim** | Plan rollback/recovery and complete-pair invariants honestly; require a native exchange adapter or decision change if acceptance demands stronger semantics. |

## Mandatory Reconciliation Ledger

Before any source edit, locate and record exactly one actual owner for each row:

| Required actual seam | Contract source | Required observation |
|---|---|---|
| Shared Zod schema module and installed Zod version | `01-06-PLAN.md`; `02-02-PLAN.md`; `03-02-PLAN.md` | Actual module/export names, strict-object convention, invariant/refinement style, API parse/serialize convention. |
| Whole-draft store and accepted snapshot boundary | `02-03-PLAN.md`; `03-02-PLAN.md` | Queue key, raw loader/classification, revision type, full-document validator, atomic writer, comparison-key/path factory, fingerprint/CAS seam. |
| Draft/anchor vocabulary | `02-02-PLAN.md`; `03-02-PLAN.md` | Exact comment ID, state, timestamps, `resolvedAt`, side/path/blob/line/selected-text/context/context-hash representation, verified/stale/orphaned vocabulary, object-format-aware OID schema. |
| Selector drift resolver and observation DTO | `03-06-PLAN.md` | Retained launch descriptors, base/head independent statuses, current full OIDs/unavailable reasons, polling/server resolution method. |
| Secured Fastify registry and API client | `01-06-PLAN.md`; `03-02-PLAN.md`; `03-06-PLAN.md` | Actual app factory, registration pattern, token/Host/Origin ordering, content-type/body-size/unknown-key behavior, validated client result algebra. |
| Browser canonical state and Review panel | `03-04-PLAN.md`; `04-UI-SPEC.md` | Actual canonical accepted draft owner, pending/conflict/read-only priority, local unsaved buffers, panel/disclosure primitives, focus/live-region conventions. |
| Reveal-directory capability | `03-01-PLAN.md` reconciliation requirement; `03-05-PLAN.md` | Whether a fixed no-body reveal capability exists, its safe relative-path contract, and fallback if absent. |
| Git runner and changed-record construction/filter | `01-03-PLAN.md`; `01-04-PLAN.md` | Actual shell-free argv runner/environment and the single lossless old/new path inventory seam. |
| Filesystem and test seams | `02-03-PLAN.md`; `02-07-PLAN.md`; `03-03-PLAN.md`; `03-07-PLAN.md` | Actual injected atomic-write/fault port, disposable Git fixture, app-factory test injection, focused Vitest/Fastify/Playwright/package commands. |
| UI tokens/primitives | `02-05-PLAN.md`; `03-04-PLAN.md`; `04-UI-SPEC.md` | Actual `UiButton`, icon button, badge, tooltip, notice, drawer, confirm row, spinner, disclosure equivalents and inherited spacing/color/type tokens. |

If any row has two owners, reconcile/consolidate rather than adding a third. If a prerequisite is missing, report it explicitly and stop the dependent implementation task.

## File Classification and Pattern Assignments

Paths in this table are conditional responsibility labels. Prefer modifying the reconciled actual owner over creating a new file.

| Planned responsibility / conditional file | Role | Data flow | Closest contract analog | Match | Required reconciliation |
|---|---|---|---|---|---|
| Shared export/API schema owner (`src/contracts/draft.ts` and/or `src/contracts/api.ts`) | model/contract | transform + request-response | Phase 2 `src/contracts/draft.ts`; Phase 3 shared schemas | role/data-flow contract | Extend one strict Zod vocabulary; no export-only validator or duplicated comment/anchor schema. |
| Canonical export builder/serializer (conditional `src/export/review-export.ts`) | utility/service | transform | Phase 3 pure reducer + Phase 2 canonical anchor builder | transform contract | Resolve actual domain module layout; build from immutable accepted snapshot only. |
| Markdown projector (conditional `src/export/render-review-markdown.ts`) | utility | transform | Phase 3 Markdown preview is UI-safety precedent only; no export analog | partial | Do not reuse rendered HTML/AST; render from reparsed canonical export JSON only. |
| Pair publisher/recovery (conditional `src/server/export-store.ts`) | store/service | file-I/O transaction | Phase 2/3 atomic draft writer, loader, recovery and fault port | strong role match | Reuse filesystem port/error conventions but deepen from one-file replace to complete pair generation/backup/recovery. |
| Export orchestration (conditional `src/server/export-review.ts`) | service | serialized snapshot + request-response | Phase 3 serialized whole-draft CAS/store | strong flow match | Capture/revalidate through the existing queue; add per-comparison export mutex without a second draft store. |
| Secure export and ignore commands in actual route registry | route/controller | request-response | Phase 1/3 secured routes | exact role contract | Add closed commands behind inherited guards; request carries only expected revision and optional opaque token. |
| Drift acknowledgement service/result algebra | service/contract | request-response | Phase 3 selector drift resolver/DTO | strong role match | Extend actual server observation; never let client supply refs/OIDs or refresh pinned identities. |
| Gitignore status/append capability | service + route | Git inspection + append-only file-I/O | Phase 1 fixed Git runner and Phase 3 fixed reveal capability | partial | Fixed probe/path/rule only; separate explicit command; preserve original bytes. |
| `.diff-review/` changed-record exclusion in actual inventory owner | Git/domain filter | transform | Phase 1 raw/numstat lossless changed-record construction | exact flow contract | Filter using canonical old and new path identities before presentation; not `.gitignore` state or display strings. |
| API client methods | service/client | request-response | Phase 3 validated draft/drift client | exact role contract | Extend one Bearer client/result algebra; no browser serializer/hash/path parameters. |
| Existing canonical browser state owner | store/model | event-driven request state | Phase 3 `review-draft-state` responsibility | exact role contract | Add export operation/receipt/ignore slots without changing canonical draft or unsaved-buffer ownership. |
| Existing Review panel + conditional export components | component | event-driven request-response | Phase 3 Review panel and Phase 2/3 local primitives | exact UI contract | Add one Export section after Resolved; no page/modal/toast/state-store duplicate. |
| Pure focused tests | test | transform | Phase 2 anchor/schema tests; Phase 3 mutation/projection tests | strong pattern | Reuse actual test runner/table conventions. |
| API/storage fault tests | test | request-response + file-I/O | Phase 2 draft atomicity; Phase 3 recovery/conflict tests | strong pattern | Extend actual injected filesystem seam with every awaited publication boundary. |
| Real-Git/package/browser tests | test | batch + E2E | Phase 1–3 disposable Git/package matrices | strong pattern | Extend fixture and generated-bin path; do not create a second fixture vocabulary or dev-server-only proof. |

## Pattern Assignments in Detail

### 1. Canonical whole-draft capture and shared schema

**Contract sources:**

- `02-02-PLAN.md`: strict persisted anchor/comment schema and exact verifier.
- `02-03-PLAN.md`: comparison-keyed store and validated atomic persistence.
- `03-02-PLAN.md`: one serialized whole-draft expected-revision CAS; canonical changes only after durable replacement.

**Copy the responsibility pattern, not provisional symbols:**

```text
existing per-comparison queue
  → raw load/classify accepted draft
  → require expectedRevision === canonical revision
  → validate the entire current draft
  → clone/freeze immutable export snapshot + fingerprint
  → leave queue for pure generation
  → before publication, re-enter queue and revalidate revision + fingerprint
```

The export request's `expectedRevision` is only a concurrency precondition. The server must load summary, comments, anchors, comparison identities, and timestamps itself. Never accept a replacement draft, comment list, summary, path, OID, anchor, schema version, filename, or export directory from the browser.

Extend the actual strict Zod owner with one versioned export document and strict command/result/receipt algebra. Reuse the exact implemented OID/path/comment/timestamp/status schemas by composition. Reconcile Phase 4's recommended `ReviewExportV1` names against actual Phase 2/3 fields; do not fork synonyms such as `anchorState` beside an existing `verificationStatus`.

**Export document invariants:** schema/kind/version; accepted revision; full launch base/head/merge-base/comparison identity; launch/current drift observation and acknowledgement; optional exact summary; every retained comment including resolved; exact immutable anchors; derived counts consistent with records; no absolute paths; no unknown keys; resolved-state/timestamp invariants.

**D-02 reconciliation:** the draft may change while generation runs, but stale bytes must never publish. Capture once, derive both formats from it, then cumpa revision and fingerprint immediately before commit.

### 2. Canonical ordering, serialization, and exact-byte hashes

**Contract sources:** Phase 1 lossless byte-safe path identity (`01-04-PLAN.md`); Phase 2 side-specific anchor (`02-02-PLAN.md`); Phase 3 grouping avoids display collisions (`03-04-PLAN.md`).

**Required pattern:**

1. Group each comment by its recorded side-specific exact path: base side uses old/base path; head side uses new/head path.
2. Sort file groups with the reconciled canonical path-identity comparator, never locale, filesystem collation, display labels, case folding, or host separators.
3. Sort comments with explicit total ordering: side enum rank (base then head), recorded line, blob OID, context hash, stable comment ID. If implemented upstream contract establishes a stronger compatible tie order, reconcile and document it rather than duplicating comparators.
4. Build arrays in that order. Canonicalizer recursively sorts object keys but does not reorder arrays.
5. Encode the strict closed JSON domain using the researched RFC 8785-compatible profile: I-JSON values, UTF-16 code-unit property order, ECMAScript primitive serialization, UTF-8, no normalization, no lone surrogates/non-finite values, no insignificant whitespace.
6. `review.json`: exact canonical bytes with no trailing whitespace under the research recommendation. `review.md`: LF only with exactly one final LF. If product requires a JSON final LF, explicitly name and validate the framing rather than falsely calling framed bytes pure JCS.
7. Reparse exact JSON bytes, validate again with the shared schema, and render Markdown only from that reparsed value.
8. Hash each final `Buffer` independently with Node `createHash('sha256')`; return lowercase 64-character hex, algorithm label, and byte length. Re-read the published bytes and require receipt hashes to match. Never hash an object, decoded/re-encoded string, path, draft, or unframed concatenation.
9. Inject one UTC RFC-3339 `exportedAt` instant and reuse it in JSON, Markdown metadata, and receipt. For unchanged accepted state, only this explicit timestamp may vary.

### 3. Markdown projection and actionability

**Contract sources:** Phase 2 exact verifier/status; Phase 3 canonical summary/comment lifecycle; Phase 4 D-05–D-12 and UI contract.

| State | Anchor status | Requested work? | Markdown placement | Canonical JSON |
|---|---|---:|---|---|
| open | verified | yes | **Open actionable requests**, exact-path group | full record |
| open | stale | no | **Needs reviewer attention** | full record |
| open | orphaned | no | **Needs reviewer attention** | full record |
| resolved | any | no | count + pointer to JSON only | full record |

Markdown order is fixed: pinned identities and drift status; summary metadata/body; actionable requests grouped by exact path; reviewer-attention records; applying-agent instructions. Empty summary prints **No summary provided** in metadata and omits its body. Zero actionable comments is valid and explicitly states none exist. JSON retains all records still present in the accepted aggregate, including resolved records; Phase 3 hard deletion means deleted records are not reconstructible history.

Every actionable entry includes safe repository-relative path, side, recorded line as hint, relevant blob OID, exact selected text, nearby context, context hash, comment ID/body. Render untrusted text as escaped/fenced data with a dynamically safe fence; never allow review content to alter the fixed instruction template. Do not use `os.EOL`.

The fixed agent instructions must require verification of pinned commit, exact blob, exact path/side, selected text, and context hash before editing; line is navigation only. They must prohibit applying resolved/stale/orphaned/missing/ambiguous anchors, fuzzy matching, guessing, or silent relocation and require reporting mismatches with recorded identity/comment ID.

### 4. Secure Fastify export route and drift observation

**Contract sources:** `01-06-PLAN.md` security/route registry; `03-02-PLAN.md` strict mutation gateway; `03-06-PLAN.md` retained-descriptor drift resolver.

Add to the reconciled route registry; do not instantiate another Fastify app or guard. Token, exact Host, acceptable Origin, method, content type, body-size, and strict-schema denial must occur before draft/Git/filesystem work. The route body is exactly the reconciled equivalent of:

```ts
{ expectedRevision: number; driftAcknowledgementToken?: string }
```

Reject unknown fields. In particular, reject repository roots, selectors, refs, commits, blobs, paths, filenames, schemas, hashes, content, Git commands, and overwrite flags.

Observe drift by re-resolving only server-retained launch descriptors through the actual Phase 3 safe Git adapter. Preserve the pinned launch OIDs, merge base, comparison key, blobs, anchors, and export directory. If moved/unavailable, return an opaque session-bound acknowledgement token bound to role/status/launch/current OIDs and observation time; generate/publish nothing. Retry submits only that token. Reobserve immediately before commit; changed observation returns stale acknowledgement with a new token and publishes nothing. The receipt records `none observed` or `acknowledged for this export`; it does not claim refs could not move after observation.

Result algebra must distinguish exported receipt, revision conflict, acknowledgement required, acknowledgement stale, corrupt/unsupported read-only draft, publication failure, and recovery-required ambiguity. Map to existing safe error conventions; never expose absolute paths, session tokens, temp names, raw Git commands, or unbounded stderr.

### 5. Repository-relative stable path and pair publication/recovery

**Contract sources:** Phase 2/3 atomic draft writer/recovery are the closest planned analogs, but a two-file generation transaction is a Phase 4 deepening, not a copy-paste equivalent.

Compute the stable directory solely from validated full launch OIDs using the actual object-format-aware OID schema:

```text
.diff-review/exports/<fullBaseOid>..<fullHeadOid>/
  review.json
  review.md
```

Labels, current ref targets, short IDs, browser input, and display paths never influence this location. Receipt paths are POSIX-style repository-relative strings; absolute root remains server-private. The stable directory contains exactly the two regular files—receipt is API/UI state, not a third file.

Under a per-comparison export mutex:

```text
recover validated remnants
→ create unpredictable sibling candidate under fixed .diff-review/exports authority
→ exclusive mode-0600 writes of both Buffers with flush/sync
→ close, re-read, hash, parse/validate JSON, rerender Markdown, byte-cumpa
→ require candidate contains exactly two regular files
→ sync candidate directory/parent where supported and tested
→ revalidate draft revision/fingerprint and drift observation
→ absent stable: rename candidate to stable, sync parent
→ re-export: rename complete stable to complete backup; rename complete candidate to stable;
   sync parent; verify final pair/hashes; delete validated backup; sync parent
→ expose receipt only after final complete-pair verification
```

Reject symlinks and unexpected file types at every managed boundary; never follow repository-controlled links outside `.diff-review/`. A failure before commit preserves the old complete pair or leaves no stable files on first export. Roll back ordinary/injected failures. On startup, recover deterministically: complete stable wins and validated stale remnants may be removed; stable absent plus exactly one valid complete backup may be restored; ambiguous remnants are preserved and produce recovery-required—never guess or delete evidence.

**Honesty constraint:** Node `rename()` is not a portable atomic exchange of two non-empty directories. The plan may claim no mixed/one-file new generation, rollback of tested failures, and deterministic restart recovery. It must not claim portable zero-absence crash atomicity. If D-03 is interpreted as requiring that stronger property for uncooperative external readers/power loss, gate implementation on a supported native exchange adapter or an explicit layout/decision reconciliation.

### 6. `.gitignore` status and explicit append

**Contract sources:** Phase 1 fixed Git runner/security; Phase 4 D-13–D-14 and UI contract. No upstream append analog exists.

Inspection and append are separate fixed capabilities. Determine effective ignored state using the actual safe Git runner with fixed `check-ignore --no-index` probe `.diff-review/.diff-review-ignore-probe`; do not infer it by scanning root `.gitignore`, because nested rules, info/exclude, global excludes, and negations apply.

The append route accepts no body-selected path, pattern, text, repository, or replacement content. It targets only fixed repository-root `.gitignore`, serializes in-process append actions, rejects symlinks/non-regular files/unsafe boundaries, rereads current bytes immediately before append, and reruns effective-ignore inspection. If already ignored, write nothing.

Append exactly one fixed rule while preserving every existing byte as prefix:

```text
existing ends with LF:  "/.diff-review/\n"
otherwise:              "\n/.diff-review/\n"
```

For a missing/empty file, reconcile the exact no-spurious-leading-LF behavior in focused fixtures while preserving the invariant of exactly one rule. Flush before success, verify prefix/rule and effective ignore. Never temp-rewrite, normalize CRLF, trim, reorder, deduplicate unrelated rules, chmod, open an editor, stage, or commit. Decline/failure does not block export; the unignored warning persists. Ignore state is UI/session information, not canonical export content.

### 7. Unconditional changed-record exclusion

**Contract source:** Phase 1 lossless raw/numstat changed-record construction (`01-04-PLAN.md`).

Deepen the one actual canonical inventory seam. Exclude a changed record if **either** exact old/base path or exact new/head path equals `.diff-review` or has the exact root prefix `.diff-review/`. This covers add/delete/rename/copy crossings. Cumpa lossless canonical repository-relative identity—not substrings, case-folded text, display-escaped labels, absolute paths, globs, or host separators. Apply regardless of tracked/untracked/ignored/negated/absent state. Do not filter only in the tree or Markdown; internal records must never enter the reviewed comparison.

### 8. Browser canonical state, Export section, and receipt

**Contract sources:** Phase 3 canonical/local state and Review panel (`03-04-PLAN.md`); Phase 4 UI-SPEC.

Extend the actual canonical browser state owner and existing 360px Review panel. Add Export after Summary, Open, and Resolved. Do not create a page, modal framework, toast queue, second store, or draft-persisted export model. Canonical draft remains server-accepted state; unsaved buffers remain separate and exportable only after their own accepted mutation. Export state comprises readiness/pending/result, current drift observation/checkbox, ignore status/append state, failure, and receipt.

Required UI states: ready, needs acknowledgement, exporting, exported, failed, unavailable; with priority inherited session/auth → corrupt/unsupported draft → revision conflict → drift acknowledgement → exporting/failure/receipt. Ignore warning is independent and nonblocking.

Use inherited tokens/primitives after reconciliation. Preserve exact Phase 4 spacing tokens (`4/8/16/24/32/48/64px`), four typography sizes (`12/14/18/24px`), 400/600 weights, warm Phase 2/3 palette, 32px minimum pointer targets, focus ring, reduced motion, and no new success green. Receipt is neutral and appears only after pair confirmation.

UI contracts the planner must assign explicitly:

- readiness shows accepted revision, actionable/attention/resolved counts, summary presence, effective ignore status;
- unsaved text warns it is excluded but does not disable export;
- zero actionable and empty review remain exportable;
- explicit `Export review` / `Export review again`; never autosave/on-close/background export;
- drift checkbox is local consent only; `Export pinned review` sends latest opaque token; changed observation clears it;
- progress is pair-level (`Preparing export`, `Validating export pair`, `Publishing export pair`), never per-file success;
- revision conflict uses inherited reload-latest while preserving buffers and never auto-retries;
- corrupt/newer-unsupported state offers no export escape hatch;
- gitignore append requires inline two-step explicit consent and remains separate from export;
- receipt shows accepted revision, one timestamp, drift acknowledgement state, exactly two full relative paths, full untruncated hashes, byte counts, copy each/copy details/reveal actions;
- copy/reveal failure retains selectable values and never leaks an absolute path;
- no apply/stage/commit/push/source-control actions or completion implications.

### 9. Focused test architecture

**Contract sources:** Phase 2 unit/Git/API/browser/package seams and fault-injected draft atomicity; Phase 3 mutation/conflict/recovery/drift/package seams. Reconcile actual commands and paths before writing tests.

#### Pure schema/projection tests

- strict schemas, unknown-key rejection, object-format-aware full OIDs, revision/timestamp/state/resolvedAt/count invariants;
- canonical RFC vectors, recursive key ordering, array preservation, invalid Unicode/non-finite rejection, UTF-8 framing;
- canonical path ordering and total comment ordering including display collisions/unusual paths;
- four-row actionability matrix, empty summary, zero actionable, all resolved, no comments/summary;
- exact fixed agent instructions; hostile Markdown fences/structure; LF-only; no absolute path;
- exact-byte SHA-256: same bytes same hash, one-byte mutation changes only corresponding file hash.

#### Storage fault/crash tests

Inject the actual narrow filesystem port and fail each awaited boundary once: candidate creation; JSON open/write/sync/close; Markdown open/write/sync/close; readback; schema/derivation equality; either hash; candidate directory sync; precommit revision/drift recheck; stable→backup rename; candidate→stable rename; parent sync; cleanup; final readback. With an old export, every precommit failure leaves old JSON+Markdown bytes/hashes together. With no old export, neither stable file exists. Never accept mixed generations, one stable file, early receipt, or deletion of ambiguous remnants.

Add child-process interruption at transaction states (after backup rename, after candidate rename, around parent sync, around backup deletion). Restart recovery restores/retains a complete pair deterministically and preserves ambiguous evidence. Exercise every supported OS because flush/directory sync/rename behavior is platform-sensitive.

#### API/security/drift tests

- inherited token/Host/Origin/method/content/body/strict-schema denial before draft/Git/filesystem calls;
- only expected revision + optional opaque acknowledgement accepted;
- revision conflict and corrupt/unsupported load publish nothing;
- moved/unavailable drift requires acknowledgement; changed observation invalidates token; pinned identities/path never change;
- response/error/receipt never exposes absolute paths, temp names, tokens, Git commands, or raw stderr;
- gitignore inspection/append is separate and fixed-authority.

#### Gitignore/changed-record tests

Fixtures: missing/empty `.gitignore`, LF, CRLF, no final newline, comments, blanks, trailing spaces, UTF-8 and non-UTF-8 bytes, concurrent change, symlink/non-regular/read-only failure, already ignored via each effective source, later negation. Assert original bytes remain exact prefix and exactly one fixed rule is appended only after consent. Add lossless inventory cases for `.diff-review` adds/deletes and rename/copy crossing each direction, independent of ignore state.

#### Packaged non-mutation proof

Extend the real generated CLI/Fastify/Vue/Monaco fixture, not a dev-server/fake DTO. Seed distinguishable HEAD, staged, unstaged, untracked, mode, and binary states before export. Snapshot and cumpa:

- HEAD/ref/remotes;
- exact index file bytes/hash at the worktree-specific Git path;
- staged and unstaged binary-safe diffs with external diff/textconv disabled;
- tracked source content/modes;
- untracked path identities/bytes;
- Git command audit log.

Exclude only permitted `.diff-review/**` output and, when explicitly approved, the exact `.gitignore` append. Assert no add/apply/am/commit/merge/rebase/reset/restore/checkout/switch/update-index/update-ref/push/network/hook/package-script/editor/pager/shell/repository-code execution. Cover successful export, decline append, approved append, revision/drift failures, pair-write failure, re-export, receipt copy/reveal, zero actionable, stale/orphaned, resolved, empty summary, and corrupt/unsupported draft UI.

## Shared Cross-Cutting Patterns

### Security and authority

Apply the inherited earliest Fastify guard to every Phase 4 route. Browser inputs are concurrency/opaque capability values, never repository/Git/filesystem/content authority. Use the existing shell-free Git runner with fixed argv and sanitized environment. Export filesystem writes are rooted beneath fixed `.diff-review/`; the only source-root exception is separately approved fixed `.gitignore` append.

### Error and acceptance semantics

Use discriminated typed results and existing safe external errors. Success means durable complete pair plus final readback/hash verification. No UI state may say JSON succeeded while Markdown failed, partial export, or one file written. Preserve prior confirmed receipt separately from a failed new attempt.

### Path safety

Use exact repository-relative lossless identity internally and safe relative projection externally. Never reconstruct identity from display labels or use absolute paths in JSON, Markdown, API responses, UI, clipboard, or routine terminal output. Reject symlinks and containment escapes at managed filesystem boundaries.

### No duplicated authority

Canonical JSON is the sole export machine model. Markdown is a pure projection of reparsed exact JSON bytes. Receipt hashes are computed from exact published bytes. UI counts are projections, not selectable subsets. Ignore configuration does not control comparison exclusion. Line numbers do not control anchor application.

## Forbidden Duplicate Patterns

The planner must explicitly prohibit all of the following:

1. A second draft store, queue, revision, comparison key, or browser canonical draft.
2. A second Zod vocabulary or copied comment/anchor/path/OID/status interfaces.
3. A new Fastify instance, auth guard, route registry, API client, token store, or capability registry.
4. Browser-generated JSON/Markdown/hashes, browser-selected output paths, or export from local unsaved buffers.
5. Independently rendered Markdown from draft/UI state rather than reparsed canonical JSON.
6. A second path comparator, display-label identity, locale sorting, or host-path conversion.
7. Fuzzy anchor search, reattachment, relocation, line-only authority, or promotion of stale/orphaned comments.
8. A generic filesystem write endpoint or generic Git-command endpoint.
9. Two independent file renames presented as an atomic pair without generation validation, rollback, and recovery.
10. A receipt file inside the stable export directory.
11. `.gitignore` text scanning as effective-ignore truth, temp-file rewrite, silent append, or append folded into Export.
12. UI-only `.diff-review/` filtering or ignore-dependent exclusion.
13. A second Review panel/page/modal/toast/state framework or new visual/token system.
14. Per-file progress/success, automatic retry, stale acknowledgement reuse, or automatic export after reload.
15. New dependencies for hashing, Git parsing, runtime validation, canonicalization, filesystem routing, or state management without an explicit reconciled necessity and approval.
16. Tests that inspect source text instead of observable behavior, use only clean repos, mock away the production route/store/Git boundary, or prove only one format.

## Requirements and Decision Coverage

| Requirement / decision | Pattern-map owner |
|---|---|
| EXP-01, D-01 | Fixed full-launch-OID stable directory; exact two files; closed server route; relative receipt paths. |
| EXP-02 | Shared strict versioned Zod export document preserving comparison, summary, all retained comment states/timestamps/anchors. |
| EXP-03, D-05–D-06, D-09 | Markdown solely from reparsed canonical JSON; actionability truth table; resolved count/history pointer; attention section. |
| EXP-04, D-07–D-08 | Full path/side/line/blob/text/context/hash fields and normative applying-agent verification/no-guess instructions. |
| EXP-05, D-16 | Exact published-buffer SHA-256, byte lengths, accepted revision/timestamp/drift state, safe copy/reveal receipt. |
| EXP-06, D-03, D-15 | Validated sibling generation, complete backup, mutex, revalidation, rollback/recovery, final readback, honest portability boundary. |
| EXP-07, D-04 | Canonical ordering/JCS-compatible encoding/LF profile/injected timestamp/golden exact bytes. |
| EXP-08, D-17 | Closed authority, Git command exclusion, rooted filesystem capability, no source/repository code execution. |
| SAFE-04, D-13–D-14 | Unconditional old/new canonical-path exclusion; effective-ignore probe; explicit fixed byte-preserving append; decline allowed. |
| D-02 | Immutable whole-draft snapshot plus precommit revision/fingerprint revalidation. |
| D-10 | Server-observed selector drift, opaque acknowledgement, pinned comparison unchanged, stale observation handling. |
| D-11–D-12 | Empty summary and zero actionable states remain valid/explicit. |
| D-18 | Dirty real-Git before/after snapshots, command audit, pair-failure/crash matrix, only explicit output/append exclusions. |
| UI-SPEC | Existing Review panel/state/primitives/tokens extended with readiness, acknowledgement, progress, failure, ignore, receipt, accessibility and responsive contracts. |

## No Direct Source Analog

| Responsibility | Why no direct analog exists | Planner fallback |
|---|---|---|
| Canonical export document/JCS encoder | Export is Phase 4-only. | Use Phase 4 research profile while composing actual upstream schemas. |
| JSON-to-agent-Markdown projector | Phase 3 preview renders browser HTML, not an agent contract. | Implement a pure exact-byte-tested projector from reparsed export JSON. |
| Two-file generation transaction/restart recovery | Upstream atomically replaces one draft file only. | Deepen the actual filesystem port; do not overclaim portable rename semantics. |
| Drift acknowledgement token | Phase 3 observes drift but does not authorize export. | Bind an opaque session token to actual observation DTO; no client authority. |
| Append-only `.gitignore` capability | No upstream mutation capability is planned. | Fixed no-body/text capability using effective Git probe and byte-prefix tests. |
| Export receipt UI | Phase 3 has no export state. | Extend canonical Review panel owner using the complete Phase 4 UI contract. |

## Metadata

**Planning artifacts analyzed:** 04 context/research/UI contract plus targeted Phase 1–3 plan contracts for Git/path/security, anchors/store/workspace, aggregate draft/recovery/UI/drift/package seams.  
**Direct source analogs:** 0 (source intentionally not treated as present).  
**Contract analog coverage:** all planned Phase 4 responsibilities have either a named upstream ownership contract or an explicit no-direct-analog reconciliation rule.  
**Scope:** Planning artifact only; no source edits, package operations, tests, formatters, linters, project-wide commands, or Git mutations performed.
