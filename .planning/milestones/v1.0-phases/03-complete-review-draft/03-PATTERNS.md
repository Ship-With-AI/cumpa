# Phase 3: Complete Review Draft — Pattern Map

**Mapped:** 2026-07-11
**Repository state:** Greenfield; Phase 1 and Phase 2 are unexecuted planning contracts, not source
**Likely files/responsibilities classified:** 29
**Implemented source analogs found:** 0 / 29

## Evidence Boundary

No implementation is established. The Phase 3 context and research explicitly report no source tree, package manifest, test configuration, or implemented Phase 1/2 product. Therefore this map contains **no fake source excerpts, imports, signatures, line-number claims, or settled filenames**.

Every path below is a conditional responsibility proposed by `03-RESEARCH.md`, not an instruction to create that exact file. At execution time, begin each plan by inspecting Phase 1/2 execution summaries and actual source, then extend the existing seam. If an actual file already owns a responsibility, modify it rather than creating the proposed parallel file.

Planning inputs used:

- Phase 3: `03-CONTEXT.md`, `03-RESEARCH.md`, `03-UI-SPEC.md`
- Product: `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`
- Prior contracts: Phase 1 and Phase 2 contexts and Phase 2 pattern map; their proposed paths are **planned-not-implemented**

## Execution-Time Reconciliation Gate

Before creating or modifying Phase 3 source:

1. Locate the actual shared Zod schemas, current draft schema/version, API result algebra, and text limits. Extend them; do not introduce duplicate TypeScript interfaces or a second schema vocabulary.
2. Locate the actual secured Fastify app factory, route registration, token/Host/Origin guard, error mapping, capability registry, API client, and active-session closure. Register Phase 3 behavior there; do not create another app, guard, route tree, or browser authority path.
3. Locate the actual comparison-keyed draft repository, per-draft serialization primitive, atomic same-directory replacement routine, initial-draft factory, and Phase 2 add-comment path. Retrofit **addComment** into the same aggregate revision CAS gateway before exposing any Phase 3 mutation.
4. Confirm the actual draft version already anticipates `revision`, `summary`, open/resolved comment state, and timestamps. Extend the current schema if compatible; do not create a speculative V2 or migration framework solely because planned names differ.
5. Locate the actual exact/lossless path type, safe-display helper, immutable comparison/capability identity, typed launch-selector descriptors, native-Git runner, and worktree porcelain parser. Reuse those authority types for grouping, recovery display, and drift checks.
6. Locate the actual Vue canonical draft owner, comments rail/review surface, UI primitives, API client, workspace state, Monaco adapter, exact anchor verifier, and show-comment command. Extend those instances; never introduce a second canonical comment index, editor adapter, navigation implementation, or design system.
7. Locate actual Vitest/Playwright scripts, fixture builders, fault-injection ports, packaged-app harness, and real-Monaco prototype tests. Add focused cases in their conventions; do not create competing configs or test harnesses.
8. Reconcile installed package versions. `markdown-it` is only a researched candidate and was flagged `SUS` because its latest release was too new; installation requires the research-mandated human verification checkpoint. Add optional declarations only if the actual compiler/package needs them.

## Planned Phase 1/2 Handoffs — Non-Authoritative Analogs

These are the closest available integration references, but none is executable precedent.

| Expected handoff (planned only) | Contract to preserve | Planning source | Phase 3 extension rule |
|---|---|---|---|
| Shared API/comparison/draft Zod contracts, expected under `src/contracts/*` | Strict browser/API/persistence contracts; immutable pinned identities; opaque request authority | Phase 1 plans; Phase 2 research/patterns | Add aggregate mutation/conflict/load/recovery/drift result schemas to the actual shared contract owner. |
| Secured Fastify app/routes/security, expected under `src/server/*` | One app; earliest Bearer token + exact Host + absent-or-exact Origin guard; bounded errors | Phase 1 plans; Phase 2 pattern map | Extend the actual app and route registry. Security runs before body parsing, Git, loader, or repository work. |
| Launch capability/session registry | Browser cannot choose repository, refs, paths, Git OIDs, comparison key, draft path, or backup destination | Phase 1 context D-18; SAFE-03 | Recovery and drift endpoints close over the active launch state and accept only bounded operation data/fingerprint. |
| Native Git comparison/object helpers | Argument arrays, immutable launch OIDs/blobs, exact path handling, porcelain `-z` parsing | Phase 1 context/plans | Drift re-resolves retained typed selectors only; it never rebuilds or replaces the open comparison. |
| Comparison-keyed draft store/writer | Strict current draft; serialized mutations; sibling temp `wx`; write/sync/close/rename/directory-sync; acknowledge after disk success | Phase 2 context/research/pattern map | Generalize the actual add path into one whole-draft CAS gateway and reuse its atomic writer. |
| Durable anchor and exact verifier | Server-derived path/blob/side/line/context/hash; `verified | stale | orphaned`; no fuzzy relocation | Phase 2 context D-12; Phase 2 pattern map | Edit/navigation may use the anchor but no Phase 3 operation may replace or rewrite it. |
| Vue canonical draft state/API client | Accepted comments come from canonical server responses; failed adds retain local composer text | Phase 2 context D-06; UI contract | Split canonical state from all attempted buffers and conflict state; canonical changes only on accepted response or explicit Reload latest. |
| One long-lived Monaco adapter and `showComment` flow | One active side-by-side editor; per-file state; reveal exact hidden context; side/model-line focus; zone recreation | Phase 2 UI/research | Extend the existing navigation command and anchored composer; never create another editor integration or use viewport/DOM identity. |
| Comments rail/right drawer and local UI primitives | Wide rail/narrow non-modal drawer; accessible buttons, notices, disclosures, confirmations | Phase 2 UI/pattern map | Evolve the same surface into Review; preserve shell, focus, drawer, and styling conventions. |
| Phase 1/2 test fixtures and packaged harness | Fastify injection, real Git, filesystem faults, real Monaco, packaged Playwright | Phase 1/2 plans | Add focused Phase 3 cases to actual harnesses; mock DOM cannot prove anchor navigation. |

## File Classification

Names are conditional labels for responsibilities. “Closest analog” means a **planned-not-implemented contract**, not source to copy.

| Conditional new/modified responsibility | Role | Data flow | Closest planning analog | Match quality |
|---|---|---|---|---|
| Actual shared draft/API contract owner (research suggests `src/contracts/draft.ts`) | model / contract | transform, request-response | Phase 2 planned `ReviewDraftV1` and shared Zod DTOs | planned role-match |
| Actual selector-drift contract owner (suggested `src/contracts/selector-drift.ts`) | model / contract | request-response | Phase 1 immutable comparison/source descriptors | planned partial match |
| Raw-byte draft loader (suggested `src/draft/load-draft.ts`) | service / utility | file-I/O, transform | Phase 2 planned strict draft load | planned extension |
| Pure draft mutation reducer (suggested `src/draft/mutate-draft.ts`) | model / service | transform, CRUD | Phase 2 planned add-comment mutation | planned extension |
| Aggregate draft repository/gateway (suggested `src/draft/draft-repository.ts` or actual store) | service / store | serialized file-I/O, CRUD | Phase 2 planned atomic draft store | planned exact extension |
| Corrupt recovery service (suggested `src/draft/recover-draft.ts`) | service | serialized file-I/O | Phase 2 atomic writer + Phase 3 research | greenfield responsibility |
| Actual secured draft routes | route / controller | request-response, CRUD | Phase 2 planned GET/add-comment routes | planned extension |
| Actual API client draft methods | service / client | request-response | Phase 1/2 planned token-bearing client | planned extension |
| Typed selector re-resolution service (suggested `src/git/selector-drift.ts`) | service | Git process I/O, transform | Phase 1 planned selector/Git discovery helpers | planned role-match |
| Actual secured drift/session-status route | route / controller | request-response | Phase 1 planned fixed session/status APIs | planned role-match |
| Canonical/local draft composable (suggested `src/web/draft/useReviewDraft.ts`) | store / hook | event-driven, request-response | Phase 2 planned canonical draft state | planned extension |
| Comment grouping/count projection (suggested `src/web/draft/groupComments.ts`) | utility / selector | transform | Phase 2 planned rail ordering | planned extension |
| Anchored navigation command in actual workspace/adapter | service / adapter | event-driven navigation | Phase 2 planned `showComment` and Monaco adapter | planned exact extension |
| Existing anchored composer | component | event-driven, request-response | Phase 2 planned add composer | planned exact extension |
| Review panel (suggested `ReviewPanel.vue`; modify actual comments rail) | component | event-driven presentation | Phase 2 planned comments rail/drawer | planned exact extension |
| Summary section (suggested `SummarySection.vue`) | component | event-driven, request-response, transform | Phase 2 composer interaction conventions | greenfield role-match |
| Comment group/record lifecycle UI (suggested `CommentGroup.vue`) | component | event-driven, request-response | Phase 2 planned accepted comment rail records | planned extension |
| Revision conflict UI within actual draft/composer surfaces | component / state | event-driven, request-response | Phase 2 persistence-failure retention | planned extension |
| Draft recovery/upgrade screen (suggested `DraftRecovery.vue`) | component | request-response, file-I/O command | Phase 1 blocking state conventions | planned role-match |
| Selector drift notice (suggested `SelectorDriftNotice.vue`) | component | polling/event-driven presentation | Phase 1 pinned identity header | planned extension |
| Safe Markdown preview renderer | utility / component | transform | No Phase 1/2 equivalent | greenfield responsibility |
| Draft loader/schema unit tests | test | file-I/O, transform | Phase 2 planned strict draft tests | planned extension |
| Mutation reducer unit tests | test | CRUD, transform | Phase 2 planned add/anchor domain tests | planned extension |
| Grouping/summary-preview unit tests | test | transform | Phase 2 planned rail state tests | planned role-match |
| Repository concurrency/atomicity tests | test | concurrent file-I/O | Phase 2 planned atomicity/fault tests | planned exact extension |
| Recovery fault/byte-preservation tests | test | file-I/O, fault injection | Phase 2 planned atomicity tests | planned extension |
| Draft lifecycle/conflict/recovery API tests | test | request-response, CRUD | Phase 2 planned Fastify draft tests | planned extension |
| Selector-drift Git/API tests | test | Git process I/O, request-response | Phase 1 planned real-Git fixture tests | planned role-match |
| Complete-review real-Monaco/component/packaged E2E tests | test | browser event-driven, request-response, file-I/O | Phase 2 planned Monaco and packaged review suites | planned extension |

## Pattern Assignments

Because no source exists, these assignments provide contracts and reconciliation targets rather than fabricated excerpts.

### Shared draft/API contract owner — model/contract, transform and request-response

**Planning analog:** Phase 2 proposed `ReviewDraftV1`, strict shared Zod DTOs, and server-derived anchors; planned-not-implemented.

**Extend, do not duplicate:** the actual current draft schema and API response schemas.

Required contract:

- One current versioned document containing immutable comparison identity, safe non-negative aggregate `revision`, exact canonical `summary: string`, and flat comments.
- Comment states are `open | resolved`; unique IDs; open records omit `resolvedAt`; resolved records require it; anchors, comparison identity, ID, and `createdAt` are immutable.
- Preserve the one-comment-per-exact-side-specific-anchor invariant across open and resolved records.
- A strict discriminated mutation operation covers add/edit/delete/resolve/reopen/set-summary. **Every** operation, including retrofitted add, carries `expectedRevision`.
- Edit carries only comment ID and body; lifecycle/delete carry only comment ID; summary carries exact Markdown. None accepts replacement drafts, anchor fields, filesystem paths, repositories, refs, Git OIDs, or comparison keys.
- Comment body rejects whitespace-only input without silently rewriting accepted text. Summary preserves the submitted string exactly and accepts `''`.
- Explicit result algebra distinguishes accepted, revision conflict with latest canonical state, draft read-only/load classification, invalid target/transition, and recoverable persistence failure.
- Response schemas must explicitly include every 2xx and `409` body so conflict `latest` state and recovery identity cannot be silently omitted.

**Prohibitions:** no per-comment revisions, ETags, persisted counts/groups, tombstones, replies, parent IDs, history, replacement-draft DTO, force flag, merge payload, export DTO, or speculative schema migration framework.

### Raw-byte draft loader — service/utility, file-I/O and transform

**Planning analog:** Phase 2 strict loader; insufficient for Phase 3 corruption safety and not implemented.

Required state machine:

1. Read the canonical file once as untouched bytes.
2. Return `missing` normally if absent.
3. Decode/parse only for classification while retaining the original raw bytes.
4. Distinguish `malformed` JSON from `schemaInvalid` current data.
5. Parse a minimal positive-integer version envelope before current-schema validation; a greater version is `newerUnsupported` immediately.
6. Return `current` only after strict current-schema validation.
7. Corrupt states retain raw bytes, full SHA-256 fingerprint, safe repository-relative path, and bounded structured validation details. Newer state reports found/supported versions and remains read-only.

**Availability matrix:** normal mutation is allowed only for `missing` and `current`. `malformed`, `schemaInvalid`, and `newerUnsupported` must be denied server-side, not merely hidden in the UI.

**Prohibitions:** no catch-and-return-empty, JSON reserialization for preservation, unknown-key stripping, best-effort current parsing of newer data, migration/downgrade, raw content/absolute path/stack trace in browser errors, or mutation route work before classification.

### Pure mutation reducer — model/service, CRUD transform

**Planning analog:** Phase 2 add-comment operation and strict anchor invariants; planned-not-implemented.

Required operation table:

| Operation | Allowed change | Invariants / no-write cases |
|---|---|---|
| addComment | Append one server-derived anchored open record | Exact anchor unoccupied; retrofit through aggregate CAS; no client anchor authority. |
| editComment | Change `body` and `updatedAt` only | ID exists; verified anchored UI required for editing; no anchor/ID/createdAt change. |
| deleteComment | Physically remove exactly one record | ID exists; no tombstone/history; cancellation is UI-only and writes nothing. |
| resolveComment | `open → resolved`, set `resolvedAt` and `updatedAt` | Already resolved is illegal/no-op and does not increment/write. |
| reopenComment | `resolved → open`, remove `resolvedAt`, update `updatedAt` | Already open is illegal/no-op and does not increment/write. |
| setSummary | Change canonical summary only | Exact empty string valid; no rich-text or rendered-HTML field. |

The reducer applies exactly one operation and validates invariants. Revision increment belongs to the repository gateway only after a valid operation produces a next document.

### Aggregate draft repository/gateway — service/store, serialized file-I/O and CRUD

**Planning analog:** Phase 2 per-comparison mutation queue and same-directory atomic writer; planned-not-implemented.

Required sequence for every accepted mutation:

1. Enter the actual per-draft/per-comparison serialization queue.
2. Reload and classify canonical disk state inside the critical section.
3. Reject read-only corrupt/newer states.
4. Materialize the valid missing-state initial draft only through the actual factory.
5. Cumpa `expectedRevision` to the reloaded whole-draft revision.
6. On mismatch, return explicit conflict with expected revision, actual revision, and latest canonical draft; write nothing.
7. Only after a match, validate target/transition and apply exactly one pure operation.
8. Increment revision exactly once; validate the entire next document.
9. Reuse the actual sibling-temp atomic replacement: exclusive temp, complete write, sync, close, rename over canonical without prior delete/truncate, directory sync where supported.
10. Return accepted canonical state only after the persistence boundary succeeds.

**Conflict precedence:** after auth/request validation, queue → load/read-only classification → expected-revision conflict → target/transition validation. A stale request therefore cannot become misleading “target missing” because a newer mutation removed it.

**Prohibitions:** no check before queue ownership, in-memory-only CAS, route-specific writer, optimistic accepted response, rollback UI, write on stale/no-op/invalid transition, per-operation lock, automatic retry/merge, or force overwrite.

### Corrupt recovery service — service, serialized raw file-I/O

**Planning analog:** reuse the actual Phase 2 path authority, queue, and atomic writer; recovery semantics are greenfield.

Required backup-first handshake under the same per-draft queue:

1. Request accepts only server-issued `expectedFingerprint`; active draft path is launch-owned.
2. Re-read raw canonical bytes and classification. Reject changed fingerprint, missing/current state, or newer-unsupported state without writing.
3. Create deterministic/collision-safe repository-local backup using exclusive creation. If a deterministic backup exists, reuse only after byte equality; otherwise choose a safe exclusive suffix and never overwrite it.
4. Write the untouched original buffer, sync/close, then freshly read and verify byte length and SHA-256/byte equality.
5. Construct and validate a fresh empty current draft for the same pinned comparison.
6. Only after verified backup durability, atomically replace the corrupt canonical path through the existing writer.
7. Return safe repository-relative backup path and canonical draft after success.

If any backup step fails, original remains canonical and read-only. If replacement fails after backup, original plus backup remain recoverable and UI stays read-only. Newer unsupported documents never expose this action.

**Prohibitions:** no browser path/destination, parse-and-stringify backup, copy after replacement, truncate/delete first, silent start-empty, recovery of newer versions, force-open, or claim of success before backup verification and atomic replacement.

### Secured routes and API client — controller/client, request-response

**Planning analog:** Phase 1 secured app/client and Phase 2 draft routes; planned-not-implemented.

- Extend the actual route registry and token-bearing same-origin client.
- Existing token, Host, and Origin guard runs before validation, Git, loader, repository, reveal, or recovery work.
- Draft GET returns a discriminated load view; it never substitutes empty state for corruption.
- One actual mutation gateway handles add/edit/delete/resolve/reopen/summary and returns explicit `409 revisionConflict` with latest canonical state.
- Recovery accepts fingerprint only; drift/status accepts no body or selector authority.
- Browser errors contain bounded safe details and correlation IDs, not absolute paths, raw bytes, stack traces, or secrets.

**Route-surface prohibition:** no force-overwrite, merge, downgrade, refresh-current-comparison, arbitrary reveal/path, export, thread/reply, undo, tombstone, or Phase 4 route.

### Canonical/local draft composable — store/hook, event-driven request-response

**Planning analog:** Phase 2 canonical accepted comments and failed-add buffer retention; planned-not-implemented.

Maintain distinct state domains:

- canonical server draft/load state;
- independent summary, comment-edit, and add-composer attempted buffers;
- one whole-draft pending operation;
- conflict result/latest canonical snapshot;
- retained-after-reload state and explicit continue-editing acknowledgement;
- non-conflict persistence errors;
- ephemeral panel/disclosure/focus state.

Before a text request, snapshot the exact attempted string. An accepted response replaces canonical state and clears only the successful operation’s buffer. Failure or conflict preserves every buffer byte-for-byte and leaves canonical state/counts/groups unchanged. Only accepted response or explicit `Reload latest` may replace canonical state.

`Reload latest` adopts `conflict.latest`, recomputes projections, retains all attempted buffers, labels the causing buffer retained/not saved, and requires explicit **Continue editing retained text** before an ordinary future save. It never submits, retries, merges, or overwrites automatically. If an edited comment was deleted, retain its text read-only with copy/confirmed-close. If an add anchor became occupied, show existing canonical comment and retained attempted text separately; allow show/copy/confirmed discard only.

While any whole-draft mutation is pending, disable all mutation initiators but keep navigation, reveal/focus, reading, copying, disclosure, and scrolling available.

### Exact grouping/count projection — utility/selector, transform

**Planning analog:** Phase 2 rail ordering and Phase 1 lossless path identity; planned-not-implemented.

- Project solely from the latest canonical comments; never persist or maintain an authoritative duplicate index.
- Group keys use canonical lossless repository-relative path identity, not safe display strings.
- Open comments precede one collapsed Resolved section; separate counts derive from state.
- Follow the inherited deterministic file-tree order. Records absent from current inventory follow using the actual byte-safe path comparator.
- Within a state/path group use UI-SPEC order: Base then Head, side-specific line ascending, creation time ascending, stable ID.
- For delete, compute focus from flattened visible pre-delete order: next, else previous, else nearest visible group/section heading, else Review heading. Do not expand collapsed content implicitly.
- Resolve focuses next/previous open record or Open heading; reopen reveals/focuses the reopened record.

### Anchored navigation and editor reuse — adapter/service, event-driven navigation

**Planning analog:** Phase 2 single long-lived Monaco adapter, exact verifier, per-file state, and show-comment sequence; planned-not-implemented.

Extend the actual one navigation command. It must preserve outgoing file scroll/focus/context and every local buffer; select the opaque exact file identity; wait for immutable models and diff layout; reveal the exact recorded line (using only inherited bounded/all-context session state); restore correct original/Base or modified/Head editor; rebuild the existing comment zone; center the exact model line; focus the inline comment heading; and announce location.

The command changes view/focus state only. It never writes or changes path, blob, side, line, context/hash, comment ID, comparison identity, draft key, or revision. Stale/orphaned anchors remain listed and report that they could not be shown and have not moved; no nearby search or rewrite is allowed. Inline edit requires a verified revealed anchor, but resolve/reopen/delete remain available for unverifiable records.

### Existing anchored composer and comment lifecycle UI — components, event-driven request-response

**Planning analog:** Phase 2 inline add composer and accepted comment surface; planned-not-implemented.

- Reuse the same anchored composer for verified comment editing, prefilled from latest canonical text with immutable anchor header and saved text reference.
- Save only by explicit button or correctly scoped Cmd/Ctrl+Enter. Blur, mode switch, panel close, file switch, resize, and disclosure changes never save or discard.
- Cancel unchanged text locally. Changed text requires inline confirmation; confirmed discard resets only the local buffer.
- No optimistic accepted text, state, count, group, or record movement.
- Resolve/reopen are explicit legal transitions. Resolved records retain Show, Edit, Reopen, Delete.
- Delete requires a second inline confirmation showing safe path, side, line, bounded preview, and no-undo warning. Pending and failure retain the record/confirmation; success uses deterministic successor focus.
- Visible actions stay explicit rather than hidden in a menu. No thread/reply/activity/avatar/undo surface.

### Review panel — component, event-driven presentation

**Planning analog:** evolve the actual Phase 2 comments rail/drawer; planned-not-implemented.

Preserve the existing shell and responsive side-by-side Monaco workspace. The same surface becomes toggleable **Review**, 360px at wide widths and a non-modal drawer at narrower widths. Closing/hiding it preserves panel scroll, Summary mode/disclosure, resolved disclosure, focused state, and every local buffer.

Fixed hierarchy:

1. Review heading, Open/Resolved derived counts, close control.
2. Persistent collapsible Summary, first and present even when empty.
3. Expanded Open comments grouped by exact path.
4. One collapsed-by-default Resolved section with the same grouping.
5. Section-local empty guidance that never replaces Summary.

Reuse actual local UI primitives, palette, typography, focus, live-region, confirmation, drawer, and disclosure conventions. Do not add a third-party UI system, modal framework, toast queue, rich-text editor, or new workspace region.

### Summary and safe Markdown preview — component/utility, event-driven transform/request-response

**Planning analog:** Phase 2 explicit composer interaction; Markdown preview itself is greenfield.

- Canonical source is exactly one Markdown string in the draft. Local textarea buffer is separate; preview renders that same local buffer, including unsaved changes.
- Edit/Preview switching never saves. Explicit **Save summary** and textarea-scoped Cmd/Ctrl+Enter call the same CAS mutation. Empty string is valid and renders **No summary yet**.
- States are Saved, Unsaved, Saving, Save failed, and Conflict — unsaved text retained. Failure/conflict never erase local text or replace canonical accepted summary.
- If the audited parser is installed, configure raw HTML off, linkify off, typographer off, no plugins/highlighting/generated IDs; reject executable `javascript:`, `file:`, and dangerous data links; controlled external links get safe attributes/cue.
- Hostile-input tests must prove inert HTML and schemes. Do not hand-roll Markdown with regex and do not persist AST/rendered HTML.

**Phase 4 boundary:** this canonical summary is an extension point for later derivation, but Phase 3 must not generate/write `review.md` or `review.json`, add export routes/buttons/status/hashes/paths/timestamps, create export directories, or snapshot a speculative export format.

### Draft recovery/upgrade UI — component, request-response and file-I/O command

**Planning analog:** Phase 1 blocking/session state conventions; greenfield behavior.

Normal mutable Review controls remain unavailable until one server load classification is known. Malformed and schema-invalid states show the pinned identity plus read-only recovery screen, safe relative draft path, bounded structured details, reveal/copy fixed-path actions, and two-step **Back up and start new**. The UI must not display a new empty draft until server confirms byte-identical durable backup and atomic replacement. Failure remains read-only and reports preserved paths safely.

Newer unsupported is a separate upgrade-required screen with found/supported version and reveal/copy only. It has no reset, recovery mutation, downgrade, raw JSON editor, preview, or best-effort rewrite.

### Selector drift service/route/notice — Git service, route, component; polling/event-driven

**Planning analog:** Phase 1 typed source identities, immutable pinned comparison, native-Git helpers, and identity header; planned-not-implemented.

- Retain server-owned typed launch descriptors separately for Base and Head. Branch identity uses exact full ref; worktree identity uses actual registered worktree identity/path representation and committed launch HEAD, including detached worktrees.
- Re-resolve using the actual native-Git discipline and worktree `--porcelain -z` parser. Cumpa full OIDs, never short display IDs or labels.
- Return each side independently as unchanged, moved, or unavailable. Moved reports role, safe label/type, full old and new OIDs; unavailable reports old OID and bounded reason without fabricated identity.
- Check on initial load, visibility regain, and a modest visible interval, coalescing overlapping checks. Announce only transitions/new current identities.
- Warning remains below pinned identity header; it names affected source(s), shows full old/new identities, states the open review remains pinned, and offers only explicit **Launch new comparison** guidance. Default is CLI relaunch instructions unless actual Phase 1 already provides a safe pre-authorized no-body action.

**Hard prohibition:** drift never calls comparison rebuilding, swaps base/head/merge-base, changes blobs/inventory/models/zones/anchors/draft key, writes draft, increments revision, refreshes current session, or accepts repository/ref/worktree path/OID input from browser.

## Shared Patterns

### Whole-Draft CAS and Atomic Persistence

**Apply to:** add, edit, delete, resolve, reopen, and summary.

One document revision is the aggregate cumpa-and-swap token. Queue ownership, disk reload/classification, expected-revision comparison, pure operation, single increment, full validation, atomic replacement, and accepted response are one ordered boundary. Two same-revision requests must yield exactly one accepted operation and one conflict containing the latest canonical state.

### Canonical State Versus Local Buffers

**Apply to:** add composer, comment edit, Summary, conflict reload, panel/file/layout changes.

Canonical accepted state and local attempted text are separate. No optimistic canonical mutation means no rollback mechanism is needed. Failure, conflict, reload, collapse, close, file switch, and resize preserve local attempts. Counts/groups always derive from canonical state.

### Identity and Authority

**Apply to:** grouping, navigation, recovery, drift, every route.

Lossless path identities and immutable full Git identities remain authority; safe display strings are presentation only. Browser operations use opaque IDs and bounded commands. It cannot choose repository, comparison, ref, OID, path, backup destination, or draft key.

### Error Classification and Safe Details

**Apply to:** loader, repository, routes, UI.

Keep distinct validation, target/transition, revision conflict, persistence failure, corrupt current schema, newer unsupported schema, security/session, and selector unavailable states. Browser receives safe relative paths, bounded structured validation issues, full authorized identity values where required, and correlation IDs—not raw draft bytes, absolute paths, stacks, or secrets.

### Accessibility and Focus

**Apply to:** Review drawer, disclosures, tabs, confirmations, comment navigation, deletion, recovery, conflicts, drift.

Use native button/disclosure/tab semantics; non-modal drawer; safe action first in confirmations; focus return to invoker; deterministic successor focus; real readiness before Monaco focus; scoped shortcuts; polite success/navigation/count/drift transition announcements; one assertive announcement for user-triggered failure/conflict/corrupt state. Polling never steals focus or repeats unchanged announcements.

## Focused Test Pattern Assignments

No test convention is implemented. Reconcile the actual Phase 1/2 harness first and add only focused Phase 3 suites.

| Test responsibility | Required observable proof | Required real boundary |
|---|---|---|
| Loader/schema classification | missing/current/malformed/schema-invalid/newer distinct; raw buffer/fingerprint preserved; newer bypasses current rewrite | Real byte fixtures, including malformed and unusual bytes |
| Mutation reducer | operation transition table; only allowed fields change; exact text; empty summary; invalid/no-op writes nothing | Injected clock/IDs; full document/invariant assertions |
| Whole-draft concurrency | two same-revision operations: one success, one conflict/latest; one increment; valid final file | Concurrent repository/API calls, not mocked revision getter |
| Atomicity and stale write | faults at temp open/write/sync/close/rename/directory-sync; no early success; stale bytes/hash/mtime unchanged; no temp survivor | Actual filesystem/fault ports |
| Recovery | fingerprint race; exclusive backup collisions; byte-identical verified backup before replacement; every fault preserves recoverability; newer never changes | `Buffer.equals`, byte length, SHA-256, real files |
| Route/security algebra | expectedRevision required for all operations including add; explicit 409 latest; corrupt/newer server lockout; no path authority; guards first; prohibited routes absent | Actual secured Fastify factory with injection |
| Grouping/focus | exact-path keys, inherited ordering, open/resolved counts, collapsed resolved, first/middle/last/only delete successor | Pure selector/component tests |
| Summary preview | Markdown behavior, exact empty state, no blur save, scoped shortcut, failed/conflicted text retained; hostile HTML/links inert | Component plus audited real renderer |
| Anchor navigation/edit | base/head, collapsed context, exact model line, immutable anchor before/after, stale/orphan no relocation, disposed-zone safety | Real Monaco in Chromium; never jsdom-only |
| Conflict-local buffers | two tabs at revision N; A accepted N+1; B 409; exact B text retained; Reload latest adopts canonical but keeps attempt; no auto retry/merge/force | Packaged two-page Playwright |
| Add collision after reload | occupied exact anchor shows canonical and retained add separately; show/copy/discard only | Packaged/component conflict flow |
| Selector drift | branch/worktree combinations; base/head moved/unavailable independently; full IDs; pinned blobs/comparison/draft/anchors unchanged | Disposable real Git fixtures and packaged app |
| Recovery/upgrade browser flows | corrupt read-only; backup-first start; newer upgrade-only; original bytes unchanged across denied actions | Packaged Playwright with byte fixtures |
| Complete lifecycle | edit/delete/resolve/reopen/count/group/jump/summary/relaunch behavior | Focused packaged Phase 3 flow |

Test contracts must assert user-visible behavior, canonical bytes, and identity invariants—not source text, helper call counts, or merely that `rename` was invoked. Do not use jsdom to claim Monaco geometry/focus correctness. During implementation verification, run only the touched/focused Phase 3 tests plus prerequisite focused suites required by the actual changed seam.

## No Implemented Analog Found

Every classified responsibility lacks an implemented source analog at mapping time.

| Responsibility family | Reason | Planner direction |
|---|---|---|
| Contracts/repository/routes | Phase 1/2 are planning-only | Reconcile actual dependency outputs, then extend one schema/app/repository path. |
| Review/summary/conflict/recovery UI | No Vue source exists | Evolve actual Phase 2 comments surface and primitives after execution; preserve UI-SPEC. |
| Monaco navigation/edit | Adapter is only proposed | Reuse actual Phase 2 adapter and prototype result; do not duplicate or assume proposed API names. |
| Drift service | Phase 1 Git/session code is only proposed | Extend actual typed selector/native-Git seam without coupling to comparison refresh. |
| Tests | No configs/harnesses exist | Add focused tests to actual Phase 1/2 infrastructure; do not create parallel configs. |

## Explicit No-Go Boundary

Phase 3 contains no export implementation. It may persist and preview canonical summary/comments only. Do not add `review.md`, `review.json`, export directories, hashes, timestamps, agent instructions, open-only export grouping, paired export transactions, `.gitignore` changes, Export UI, exporter stubs, or speculative Phase 4 tests. Also exclude threads/replies, soft delete/undo/history, automatic merge/retry, force overwrite, anchor relocation, comparison refresh, source editing/staging/committing/pushing, database/state framework, arbitrary browser authority, and rich-text canonical state.

## Metadata

**Analog search scope:** planning-only repository; Phase 3 contracts and relevant Phase 1/2 planning artifacts
**Implemented files scanned:** none exist according to Phase 3 research and prior pattern evidence
**Pattern extraction date:** 2026-07-11
**Coverage:** CMT-03–CMT-07, DRFT-04–DRFT-06; D-01–D-17; inherited pinned identity, exact path, anchor, security, and atomic persistence contracts
