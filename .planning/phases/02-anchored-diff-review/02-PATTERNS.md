# Phase 2: Anchored Diff Review — Pattern Map

**Mapped:** 2026-07-11
**Repository state:** Greenfield; no implemented product source or test suite exists
**Proposed files classified:** 27
**Implemented source analogs found:** 0 / 27

## Evidence Boundary

A narrow repository scan found no `src/`, `tests/`, `package.json`, Vite, Vitest, or Playwright configuration. This confirms the repository-reality statement in `02-RESEARCH.md:70-80` and the Phase 1 roadmap status of **Not started** in `.planning/ROADMAP.md`. Consequently:

- There are **no established source imports, component conventions, route patterns, error helpers, persistence utilities, test fixtures, or CSS tokens to copy**.
- Phase 1 CONTEXT and PLAN files are planning documents, not executable code. Every Phase 1 path below is an **expected handoff proposal**, never an implemented analog.
- Phase 2 implementation must begin by inspecting actual Phase 1 source and summaries after Phase 1 executes. It must extend the actual contracts and composition seams rather than creating parallel security hooks, path identities, capability registries, app factories, API clients, test scripts, or UI shell components.
- Research and UI-SPEC excerpts below are **prescriptive planning contracts**, not proof of working code. Monaco behavior involving view zones and hidden context remains conditional on the mandatory real-browser prototype.

### Inputs used

- Phase 2: `02-CONTEXT.md`, `02-RESEARCH.md`, and `02-UI-SPEC.md`
- Project: `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, and `.planning/ROADMAP.md`
- Phase 1: `01-CONTEXT.md` and all plans `01-01-PLAN.md` through `01-09-PLAN.md`
- Narrow implementation scan: `src/**/*`, `tests/**/*`, `package.json`, and common Vite/Vitest/Playwright config names; no matches

## Planned Phase 1 Handoff — Not Source Analogs

These are the strongest available integration references, but they are tentative proposals only.

| Expected Phase 1 seam | Proposed contract | Planning evidence | Phase 2 instruction |
|---|---|---|---|
| `src/contracts/comparison.ts` | Frozen comparison identities, inventory entries, lossless side-specific path identities, availability/blob facts, opaque `fileId` | `02-RESEARCH.md:73-78`; `01-02`, `01-04`, `01-05`, and `01-07` plans | Extend the actual implemented contract; never reconstruct paths from display labels or replace `fileId` with browser-supplied path/blob authority. |
| `src/contracts/api.ts` | Strict Zod transport vocabulary for a closed API | `01-06-PLAN.md` artifacts and key links | Add content/draft schemas to the actual contract module if it exists; do not introduce a second validation vocabulary. |
| `src/server/app.ts` | One production Fastify app factory receiving frozen repository/session dependencies | `01-01-PLAN.md` and `01-06-PLAN.md` | Register Phase 2 routes in the actual app factory; never create another Fastify instance. |
| `src/server/security.ts` | Earliest token, exact Host, absent-or-exact Origin checks and non-leaking errors | `01-06-PLAN.md` | Reuse the actual `onRequest` guard unchanged for content reads and draft mutations. |
| `src/server/capabilities.ts` | Launch-scoped opaque `fileId` registry over immutable metadata/object facts | `01-06-PLAN.md` | Extend actual capability facts to resolve frozen side blobs and paths; requests must not select repository/ref/path/blob. |
| `src/server/routes.ts` | Closed route registration over capability registry | `01-06-PLAN.md` | Extend actual route registration with exactly the Phase 2 content/draft surface rather than parallel routes or guards. |
| `src/git/objects.ts` / `src/git/comparison.ts` | Bounded frozen-object reads and pinned comparison identity | `01-03`–`01-05` plans | Reuse the actual immutable object reader; do not read worktree files, refs, filters, textconv, or symlink targets. |
| `src/web/api/client.ts` | Fragment removed into memory; same-origin Bearer client | `01-06-PLAN.md` | Extend the actual client with strict content/draft methods and preserve generic security/session errors. |
| `src/web/components/FileTree.vue` | Deterministic opaque-ID selection | `01-07-PLAN.md` | Use actual tree order as file-navigation order and emit only `fileId`; do not key by safe display path. |
| `src/web/App.vue`, `IdentityHeader.vue`, `FileMetadataPane.vue`, `styles.css` | Pinned shell, identity header, selected-file pane, Phase 1 styles | `01-08-PLAN.md` | Reconcile actual names and replace/extend the metadata center pane with the Phase 2 workspace without duplicating the identity header or file tree. |
| Phase 1 focused test scripts and Git fixture | Vitest/API/Git/packaged Playwright seams | `01-01`–`01-09` plans | Reuse only if actually implemented; otherwise establish the smallest missing Phase 2-focused seam. |

## File Classification and Actionable Pattern Assignment

“Planning contract” means the closest guidance is Phase 2 RESEARCH/UI-SPEC, not source. “Expected handoff” means a Phase 1 plan proposes the seam but no implementation currently exists.

| Proposed new/modified file | Role | Data flow | Implemented analog | Strongest available planned pattern / action |
|---|---|---|---|---|
| `package.json` / lockfile | config | build/dependency | None | Reconcile actual Phase 1 graph, then add only exact audited `monaco-editor@0.55.1`; no wrapper or Monaco Vite plugin (`02-RESEARCH.md:110-140`). |
| `src/contracts/api.ts` | contract/config | request-response | None | Expected Phase 1 handoff. Extend strict Zod contracts for content, draft view, and add-comment; browser authority is only `fileId`, `side`, `line`, `body`. |
| `src/contracts/draft.ts` | model/contract | persistence transform | None | Create strict versioned canonical draft and presentation schemas; keep persisted anchor state separate from derived `verified | stale | orphaned` view state. |
| `src/domain/anchor.ts` | model/utility | transform | None | Implement server-owned path/side/line/blob/context derivation, framed SHA-256 context and uniqueness keys, and exact verification with no fuzzy relocation. |
| `src/domain/comparison-key.ts` | utility | transform | None | Compute deterministic key from full selected **base commit OID + head commit OID** in order; merge base alone is not draft identity. |
| `src/server/capabilities.ts` | service/registry | request-response | None | Modify the actual Phase 1 registry expected from `01-06`; resolve side-specific frozen path/blob facts from opaque `fileId`. Do not accept client path/blob/OID authority. |
| `src/server/routes.ts` | route/controller | request-response | None | Extend actual Phase 1 route registration with `GET /api/files/:fileId/content`, `GET /api/draft`, and `POST /api/draft/comments`; guard must run before validation/object/store work. |
| `src/server/draft-store.ts` | service/store | file-I/O, serialized mutation | None | Per comparison key, serialize mutations; load/strictly validate; write unique same-directory temp with `wx`; write/sync/close; rename over canonical; directory-sync where supported; return success only after rename. Preserve prior canonical bytes on failure. |
| `src/web/api/client.ts` | service/client | request-response | None | Extend actual Phase 1 Bearer client. Map canonical success, duplicate conflict, recoverable persistence failure, and ended session without leaking token/path/object/temp details. |
| `src/web/monaco/configure.ts` | config/provider | transform | None | Configure Vite workers through `MonacoEnvironment.getWorker`; map side-specific URI/path to a registered language or `plaintext`; do not alter blob text. |
| `src/web/monaco/line-mapping.ts` | utility | transform | None | Map opposite insertion boundaries from public `ILineChange[]`; this is layout support only, never durable identity. |
| `src/web/monaco/diff-adapter.ts` | service/adapter | event-driven | None | Own one long-lived diff editor, two explicit models, side events, model-coordinate decorations, paired zones, diff-update rebuilds, view-state save/restore, resize layout, and deterministic disposal. Public Monaco APIs only. |
| `src/web/model/workspace-state.ts` | store/model | event-driven state transitions | None | Hold session-only state per `fileId`: diff view state, focused side/line, context mode/expansion, scroll, and active composer anchor/text. Accepted comments come from canonical draft responses. |
| `src/web/components/DiffWorkspace.vue` | component | event-driven/request-response | None | Own adapter mount/unmount and active-file orchestration; one active file, read-only side-by-side plane, stable headers/toolbars, loading/unsupported states, comment reveal sequence. |
| `src/web/components/CommentComposer.vue` | component | event-driven/request-response | None | Inline side-specific composer: locked path/side/line header, explicit Add/Cmd-Ctrl+Enter, blur preserves, inline discard confirmation, pending/failure text retention, acceptance only after persisted response. |
| `src/web/components/CommentsRail.vue` | component | event-driven navigation | None | Render accepted records ordered by file-tree, base-before-head, line; verified show/reveal/focus, stale/orphan rail-only records, no edit/delete/resolve/reply/summary actions. |
| `src/web/components/ui/*` (or actual local primitive location) | components | event-driven presentation | None | UI-SPEC prescribes minimal local `UiButton`, `UiBadge`, `UiTooltip`, `UiInlineNotice`, `UiDrawer`, `UiConfirmRow`, `UiSpinner`; create/reuse actual Phase 1 primitives, not a third-party component system. |
| `src/web/App.vue` | component/composition root | request-response/event-driven | None | Extend actual Phase 1 shell: preserve one identity header and file tree, load comparison-local draft, compose responsive workspace/comments, and keep unsupported/no-change/session/security states. |
| `src/web/styles.css` | config/presentation | transform | None | Extend actual Phase 1 CSS with UI-SPEC warm neutral tokens, spacing, focus, responsive drawers, 100dvh shell, and reduced-motion rules; avoid a parallel token system. |
| `tests/unit/anchor.test.ts` | test | transform | None | Contract tests for side-specific paths/blobs, line boundaries/EOLs/UTF-8, context window/framing/hash, uniqueness, exact verified/stale/orphan classification, and zero fuzzy relocation. |
| `tests/unit/comparison-key.test.ts` | test | transform | None | Same pair stable; order matters; either selected OID changes key; merge-base-only change does not define a different key. |
| `tests/unit/line-mapping.test.ts` | test | transform | None | Pure mapping cases for unchanged offsets and insertion/deletion/change boundaries; do not claim browser alignment from this unit suite. |
| `tests/unit/workspace-state.test.ts` | test | event-driven state transitions | None | A→B→A restores scroll/focus/context/composer; blur and switch do not submit; accepted canonical state is not confused with ephemeral composer state. |
| `tests/integration/monaco-anchor.spec.ts` | test/prototype gate | event-driven/browser | None | Real Monaco 0.55.1 in Chromium: base/head and changed/unchanged anchors, paired-zone growth/alignment, bounded/all reveal, recomputation, resize, model swaps, restoration, keyboard/pointer parity, and leak counts. This gate blocks broad workspace work. |
| `tests/api/draft.test.ts` | test | request-response/CRUD | None | Fastify injection for strict bodies, auth-before-work, server-derived anchors, duplicate `409`, exact verification states, same-pair resume, and different-pair isolation. |
| `tests/api/draft-atomicity.test.ts` | test | file-I/O/fault injection | None | Fault each temp/open/write/sync/close/rename/directory-sync boundary; prove no early `201`, prior canonical preservation, temp-only cleanup, and serialized near-simultaneous adds. |
| `tests/git/anchored-content.test.ts` | test | Git object I/O | None | Real disposable repositories prove frozen base/head text, rename side paths/blobs, unusual paths, EOL boundaries, and independence from later worktree/ref movement. |
| `tests/e2e/anchored-review.spec.ts` | test | packaged browser/request-response/file-I/O | None | Packaged relaunch loop: exact blobs, navigation/reveal, comments on both sides/context, failed-save retention, accepted resume, pair isolation, stale/orphan visibility, unsupported/security/session states. |

## Prescriptive Planning Contracts to Implement

The excerpts in this section come from planning documents. They are actionable contracts, **not existing project code**.

### 1. One long-lived Monaco adapter

**Planning source:** `02-RESEARCH.md:176-213`

```ts
// Proposed options; must be proven against real Monaco 0.55.1.
{
  renderSideBySide: true,
  readOnly: true,
  originalEditable: false,
  glyphMargin: true,
  automaticLayout: false,
  hideUnchangedRegions: {
    enabled: true,
    contextLineCount: 3,
    minimumLineCount: 8,
    revealLineCount: 10
  },
  ariaLabel: `${safePathLabel}: base and head diff`
}
```

Create the editor once after mount. On file switch: save outgoing app + Monaco state; detach and dispose caller-owned models; create immutable original/modified models with side-specific URIs/languages; attach; wait for `onDidUpdateDiff`; restore state; rebuild decorations/zones; lay out. `ResizeObserver` calls `layout()` and is disconnected on unmount.

### 2. Anchor identity versus disposable layout identity

**Planning source:** `02-RESEARCH.md:215-230`; locked by `02-CONTEXT.md` D-12

```ts
type EphemeralAnchor = {
  fileId: string;
  side: 'base' | 'head';
  line: number;
};
```

The same `activateAnchor(side, line)` handles pointer and keyboard paths. Durable identity adds exact side-specific path and blob identity. DOM nodes, pixels, rendered rows, viewport offsets, view-zone IDs, and diff-hunk rows are never identity. Zone IDs are rebuilt lifecycle state.

### 3. Paired zones and hidden-context gate

**Planning source:** `02-RESEARCH.md` Patterns 3–4; `02-UI-SPEC.md` Inline Composer and Mandatory Stability Gate

- Put composer/verified comment in a view zone immediately below the target model line.
- Put an equal-height, `aria-hidden` spacer at the mapped opposite boundary.
- Update both zones together as content grows and after diff recomputation.
- Use only published Monaco APIs.
- Prototype whether public reveal/view-state behavior preserves hidden-region expansion. If selective reveal is unavailable, switch that file to explicit session-only all-context mode before revealing the exact line.
- If paired zones cannot remain aligned, the only permitted fallback is a tested full-width synchronized row directly below the anchored diff row. No overlay, pixel anchoring, private member, or silent relocation is acceptable.

### 4. Server-authoritative add-comment request

**Planning source:** `02-RESEARCH.md` Pattern 5

```ts
const AddCommentRequest = z.object({
  fileId: z.string().min(1).max(256),
  side: z.enum(['base', 'head']),
  line: z.number().int().positive(),
  body: z.string().trim().min(1).max(100_000)
}).strict();
```

The request must not contain path, blob OID, selected text, context, hash, repository, ref, commit, draft key, or filename. After the inherited guard, the server resolves `fileId`, validates side/text availability/line bounds, reads the frozen blob, and derives all durable fields.

```ts
type DurableAnchorV1 = {
  path: PathIdentity;
  safeDisplayPath: string;
  side: 'base' | 'head';
  line: number;
  blobOid: string;
  selectedText: string;
  context: {
    before: Array<{ line: number; text: string }>;
    target: { line: number; text: string };
    after: Array<{ line: number; text: string }>;
  };
  contextHash: { algorithm: 'sha256-v1'; value: string };
};
```

Use up to three lines before/after and a domain-separated, unsigned-64-bit-length-framed SHA-256 preimage. Durable uniqueness includes exact path bytes, side, blob OID, and line. Duplicate acceptance is server-rejected with `409 ANCHOR_ALREADY_COMMENTED`.

### 5. Versioned comparison-local draft

**Planning source:** `02-RESEARCH.md` Patterns 6–8

```ts
type ReviewDraftV1 = {
  schemaVersion: 1;
  comparison: {
    baseCommitOid: string;
    headCommitOid: string;
    mergeBaseOid: string;
  };
  revision: number;
  summary: string; // initialized only; no Phase 2 summary mutation UI
  comments: Array<{
    id: string;
    state: 'open'; // lifecycle transitions are Phase 3
    body: string;
    anchor: DurableAnchorV1;
    createdAt: string;
    updatedAt: string;
  }>;
};
```

Recommended location is `.diff-review/drafts/<comparisonKey>.json`, where the server computes the key from selected base and head OIDs. `revision` may advance internally for future compatibility, but Phase 2 must not claim multi-tab conflict prevention.

Atomic mutation order:

1. Serialize mutations per repository/comparison key.
2. Load and strictly validate the canonical draft, or create a valid initial draft.
3. Apply exactly one mutation and validate the whole next document.
4. Create a unique same-directory temp with `wx` and restrictive mode.
5. Write all bytes, `sync`, and close.
6. Rename directly over canonical—never delete/truncate canonical first.
7. Sync the directory where supported; document unsupported directory-sync behavior without exposing partial JSON.
8. Return `201` and let the UI render accepted state only after the persistence boundary succeeds.

### 6. Exact verification state machine

**Planning source:** `02-RESEARCH.md` Pattern 8; `02-UI-SPEC.md:301-347`

| State | Exact meaning | Placement |
|---|---|---|
| `verified` | Active comparison, exact side/path/blob/line/text/context/hash all match | Inline and comments rail |
| `stale` | Capability/file remains meaningful but exact recorded immutable facts do not match | Rail only; show recorded facts and “has not been moved” |
| `orphaned` | Exact file/blob/side/line cannot be opened in this pinned comparison | Rail only; preserve record and safe available details |

Verification is presentation-time classification. It never searches nearby lines, rewrites a line, changes a stored anchor, or invents a navigation target.

### 7. Ephemeral per-file workspace state

**Planning source:** `02-RESEARCH.md` workspace-state section; locked by `02-CONTEXT.md` D-09/D-11

```ts
type FileViewState = {
  diffViewState: monaco.editor.IDiffEditorViewState | null;
  focused: { side: 'base' | 'head'; line: number } | null;
  contextMode: 'collapsed' | 'restored' | 'all-revealed';
  composer: { side: 'base' | 'head'; line: number; text: string } | null;
};
```

Before switching, snapshot scroll/view state, focused model coordinate, context mode/expansion, and composer. Restore only after the incoming diff update, then rebuild zones/decorations and reveal/focus as needed. Resize lays out without recreating models. Blur never submits.

### 8. UI composition and interaction

**Planning source:** `02-UI-SPEC.md`

- Preserve the Phase 1 pinned identity header and deterministic changed-file tree.
- Wide layout: file tree / dominant side-by-side diff / comments rail; narrower layouts use non-modal docked drawers. Never switch to unified/stacked diff.
- Persistent visible controls and documented shortcuts are peers: previous/next file, previous/next change, comments, keyboard help, comment activation, accept, cancel.
- Composer header is immutable safe path + Base/Head + side-specific line. Add only through explicit button or Cmd/Ctrl+Enter. Non-empty discard requires inline confirmation.
- Pending persistence leaves composer and text in place. Failure retains them and is recoverable. Success moves focus only after canonical persisted response.
- `Show comment` saves outgoing state, selects by opaque file identity, waits for models/diff, reveals context, reconstructs zones, centers the exact model line, focuses the inline heading, and announces the location.
- Phase 2 has no edit/delete/resolve/reopen, summary mutation, conflict management, selector-drift handling, export, reattachment, threads, theme/layout toggle, or stacked-file mode.

## Shared Cross-Cutting Patterns

### Closed capability authority

**Expected handoff only:** `src/server/security.ts`, `src/server/capabilities.ts`, `src/server/routes.ts` from `01-06-PLAN.md`.

Apply to all Phase 2 API routes:

1. Existing per-process Bearer token + exact Host + absent-or-exact Origin guard runs first.
2. Browser selects only opaque launch-scoped `fileId` and constrained operation fields.
3. Server owns repository, comparison, path, blob, object-reader, draft root/key, and derived anchor facts.
4. Denials and errors never leak absolute path, token, attempted capability, object lookup, Git command/stderr, temp filename, or draft key.

### Lossless path and side authority

**Expected handoff only:** `src/contracts/comparison.ts`, `src/domain/path-bytes.ts`, and inventory contracts from `01-04`/`01-07` plans.

- Preserve exact encoded path identity independently from safe display text.
- Renames use old/base path and blob on the base side, new/head path and blob on the head side.
- Safe labels and compacted tree segments never become persistence or lookup authority.

### Error handling

No implemented error convention exists. Reconcile actual Phase 1 typed errors/correlation behavior first. Phase 2 must preserve these observable outcomes:

- validation: strict `400` without handler/store work;
- unknown capability: generic `404`;
- duplicate/unavailable anchor: constrained `409`;
- persistence failure: recoverable `500` with correlation ID, prior draft preserved, composer retained;
- invalid existing draft: refuse to overwrite it and show safe relaunch/terminal-detail guidance;
- ended session/security denial: non-leaking browser recovery copy.

### UI accessibility and focus

Apply across the workspace:

- Landmarks and skip links; one visible active-file `h1`; comments/file panels use `h2`.
- Side-specific Monaco labels and model-coordinate keyboard activation.
- 2px accent focus ring with offset; default 32×32 targets, documented 24×24 isolated gutter exception.
- Non-modal drawers do not trap focus and return focus to triggers.
- Alignment spacers are never tabbable or announced.
- Polite live region for load/navigation/reveal/save; assertive alerts only for persistence/session failure.
- Respect 200% zoom and `prefers-reduced-motion`.

### Testing discipline

There is no implemented test convention to copy. The Phase 1 PLAN scripts and fixtures are tentative. Reconcile the actual scripts, then use focused Phase 2 suites only:

- pure domain/state tests for hashes, keys, verification, mapping, and transitions;
- real Chromium Monaco prototype for geometry/lifecycle behavior;
- Fastify injection plus filesystem fault ports for authorization and atomicity;
- disposable real Git fixtures for frozen object/path/side behavior;
- packaged Playwright for relaunch and user-visible contracts.

Do not use jsdom to claim Monaco alignment. Do not test only that `rename` was called; assert observable atomic visibility and prior-byte preservation. Per the assignment, no formatter, linter, or project-wide test belongs in this mapping task.

## No Implemented Analog Found

Every proposed Phase 2 file lacks an implemented source analog. The planner should use the table above and the Phase 2 RESEARCH/UI-SPEC contracts, while making the first execution task reconcile the actual Phase 1 output.

| Area | Why no analog exists | Safe planning response |
|---|---|---|
| Monaco adapter and Vue diff workspace | Monaco is intentionally absent from Phase 1 plans and no source exists | Prototype production-shaped public APIs first; block broad integration on the stability gate. |
| Durable anchors and exact verifier | Phase 1 stops at comparison/file metadata | Implement as pure server-owned domain logic over actual capability/object seams. |
| Draft schema/store | No persistence implementation exists | Introduce one versioned schema and one atomic store; do not imply concurrency protection beyond serialized Phase 2 mutations. |
| Content/draft API | Phase 1 proposes metadata GET routes only | Extend the actual secured app/routes after reconciliation; do not create parallel auth or authority. |
| Comment UI/rail/primitives | Phase 1 UI itself is only planned | Follow UI-SPEC contract and actual Phase 1 shell/tokens if they materialize. |
| Phase 2 tests | No test infrastructure exists | Reuse actual Phase 1 scripts/fixtures if present; otherwise add only focused seams needed by the mapped behavior. |

## Planner Handoff Checklist

1. First task: inspect actual Phase 1 source, summaries, package scripts, and contracts; update proposed names to actual seams.
2. Keep the real Monaco browser prototype as a blocking first implementation slice before broad UI work.
3. Build server-owned anchor/comparison-key/draft contracts and fault-injected atomic persistence independently of the workspace.
4. Extend the existing security/capability/app/client seams—never duplicate them.
5. Compose the Vue workspace only after Monaco geometry/public reveal behavior and server persistence contracts pass their focused gates.
6. Preserve all later-phase exclusions explicitly; Phase 2 accepts one immutable open comment per side-specific line and no other lifecycle mutation.
7. Treat every Phase 1 path in this document as tentative until implementation is observed.

## Metadata

**Analog search scope:** repository root implementation paths (`src`, `tests`, package/config files), then Phase 1 planning handoff artifacts
**Implemented files scanned:** 0
**Planning artifacts analyzed:** Phase 2 CONTEXT/RESEARCH/UI-SPEC; PROJECT/REQUIREMENTS/ROADMAP; Phase 1 CONTEXT and nine PLAN files
**Match coverage:** 0 exact source analogs; 12 tentative Phase 1 integration seams; Phase 2 planning contracts supplied for all 27 proposed artifacts
**Pattern extraction date:** 2026-07-11

## PATTERN MAPPING COMPLETE
