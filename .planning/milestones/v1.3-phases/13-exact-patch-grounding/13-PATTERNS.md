# Phase 13: Exact Patch Grounding — Pattern Map

**Mapped:** 2026-08-05  
**Scope:** Phase 12 substrate and Phase 13 source/test surfaces only  
**Files analyzed:** 25 likely production/test targets  
**Analogs found:** 24 / 25 (snapshot persistence is new; use the existing versioned draft/file-I/O patterns)

## File Classification

| Likely target | Role | Data flow | Closest concrete analog | Match |
|---|---|---|---|---|
| `src/contracts/request.ts` | contract/schema | transform, request-response | existing strict request schema, whole file | exact extension |
| `src/cli/request.ts`, `src/cli/run.ts` | protocol reader/dispatcher | bounded stdin stream → request-response | `src/cli/request.ts` and `src/cli/run.ts:287-487` | exact extension |
| `src/contracts/comparison.ts`, `src/git/comparison.ts` | patch provenance/model and builder | transform, request-response | `PinnedComparisonSchema`; `createPinnedRangeComparison()` | role-match |
| `src/git/exact-patch.ts` (likely new adapter) | patch parser/grounder | file I/O, transform | `src/git/raw-diff.ts`, `src/git/objects.ts`, `src/git/availability.ts` | no exact analog |
| `src/git/runner.ts`, `src/git/repository.ts` | Git subprocess/repository boundary | bounded request-response | `createGitRunner()`, `discoverGitRepository()` | exact |
| `src/git/raw-diff.ts`, `src/git/inventory.ts`, `src/domain/path-bytes.ts` | metadata/path inventory | batch transform | `parseRawDiff()`, `createChangedFileInventory()`, `createExactPath()` | exact |
| `src/git/objects.ts`, `src/git/availability.ts` | immutable blob/preimage reader | bounded file I/O | `createObjectReader()`, `classifyAvailability()` | exact |
| `src/contracts/api.ts`, `src/server/capabilities.ts`, `src/server/routes.ts` | authenticated session DTO/capability routes | request-response | `/api/session`, `/api/files/:fileId/content`, `createCapabilityRegistry()` | exact extension |
| `src/server/patch-snapshot.ts` (likely new) | owned frozen snapshot store | file I/O, session-scoped lookup | `src/server/draft-store.ts`, `src/server/draft-loader.ts` | role-match |
| `src/git/selector-drift.ts` (or patch observer) | drift observer | request-response | `createSelectorDriftObserver()` | exact extension |
| `src/contracts/draft.ts`, `src/server/draft-store.ts` | draft provenance | CRUD/file I/O | `ReviewDraftV1Schema`, `createDraftStore()` | exact extension |
| `src/export/review-export.ts`, `src/export/render-review-markdown.ts` | canonical JSON/Markdown provenance | transform/file I/O | `buildReviewExportV1()`, renderer | exact extension |
| `src/web/App.vue` | review workspace coordinator | request-response/UI state | existing range branch (`isRangeSession`, `loadFile`, drift/error surfaces) | exact extension |
| `src/web/components/IdentityHeader.vue`, `IdentityPanel.vue` | source identity presentation | UI transform | Phase 12 range scope presentation | exact extension |
| `src/web/components/DiffWorkspace.vue`, `FileMetadataPane.vue`, `FileTree.vue` | frozen content/metadata presentation | request-response/UI | existing file content + availability rendering | exact |
| `src/web/components/InlineNotice.vue`, `ErrorState.vue`, `CopyButton.vue` | status/error/copy UI | UI event-response | existing components, whole files | exact reuse |
| `tests/cli/request.test.ts` | protocol test | streaming request-response | `tests/cli/request.test.ts`/`tests/cli/errors.test.ts` conventions | exact extension |
| `tests/git/exact-patch.test.ts` | Git grounder test | file I/O/transform | `tests/git/inventory.test.ts`, `anchored-content.test.ts` | role-match |
| `tests/git/objects.test.ts`, `availability.test.ts`, `raw-diff.test.ts` | reader/parser/metadata tests | bounded I/O/transform | existing Git unit tests | exact |
| `tests/api/session.test.ts`, `tests/api/exact-patch.test.ts` | capability/snapshot routes | request-response | `tests/api/session.test.ts` frozen fixture and inject | exact extension |
| `tests/git/selector-drift.test.ts`, `tests/integration/selector-drift-ui.spec.ts` | drift behavior/UI | request-response/browser | existing selector-drift tests | exact extension |
| `tests/unit/review-export.test.ts`, `tests/unit/review-markdown.test.ts` | export provenance | transform | existing export tests | exact extension |
| `tests/e2e/anchored-workspace.spec.ts` | patch workspace browser flow | process → browser | anchored/pinned workspace specs | role-match |

## Pattern Assignments

### Request boundary and PATCH-01

**Sources:** `src/contracts/request.ts` (entire file), `src/cli/request.ts`, `src/cli/run.ts:287-296,460-487`, `tests/cli/request.test.ts`, `tests/cli/selection.test.ts:500-523`.

Keep one Zod authority: `z.strictObject`, literal discriminators, readonly nested values, and `z.infer`. The patch request must be a mutually exclusive discriminated mode, not optional fields on the revisions request. Preserve `MAX_AGENT_REQUEST_BYTES`, `MAX_GIT_ARGUMENT_BYTES`, NUL/lone-surrogate rejection, fatal UTF-8 decoding, bounded diagnostics, and no raw request echo. `run()` remains the sole TTY ownership seam: TTY follows interactive `runCli`; non-TTY consumes exactly one request before Commander/Inquirer/browser/server. Reuse launch error boundary (`reportFatalLaunchError`) and guarantee invalid/mixed/unknown patch input exits before listener/browser.

PATCH-01 proof should mirror Phase 12 request tests: valid patch parses; patch plus revisions/mixed source is rejected; strict unknown fields/version/mode fail; only server-built inventory reaches the workspace. Do not create a second stdin protocol or interactive patch picker.

### `src/git/exact-patch.ts` (new grounder) and PATCH-02

**Nearest analogs:** `src/git/objects.ts:42-160` (`validateObjectId`, `parseBatchHeader`, `createObjectReader`), `src/git/availability.ts:50-124` (`classifyAvailability`), `src/git/raw-diff.ts:21-112` (`malformedRawDiff`, `readNulField`, `parseRawDiff`), `src/git/comparison.ts` commit verification helpers.

Implement the minimum patch-specific orchestration around these primitives: parse patch bytes with NUL-safe/path-safe handling; resolve current repository/worktree target; inspect/read every preimage object by full OID; cumpa bytes with `Buffer` equality; cumpa every implemented postimage against the patch's postimage (including absent sides); and reject malformed patch, missing/type-mismatched objects, changed live target, or any mismatch. Do not use shell interpolation, mutate refs/worktree/index, or reconstruct paths from display text. Use `ObjectReader.read(..., { maxBytes })` and preserve bounded framing/error behavior from `objects.ts`; do not silently classify a failed proof as unavailable.

PATCH-02 tests should use injected/recording `GitRunner` where command shape matters and real temporary Git fixtures where byte identity matters. Assert rejection for absent side, missing object, non-blob/type mismatch, changed target, malformed patch, and postimage mismatch; assert accepted bytes are the exact frozen values.

### Git boundary, PATCH-03 and PATCH-04

**Sources:** `src/git/runner.ts:80-193`, `src/git/repository.ts`, `src/git/inventory.ts:105-223`, `src/git/raw-diff.ts:21-112`, `src/domain/path-bytes.ts:1-98`, `src/git/availability.ts:50-124`.

Use `createGitRunner()`'s argument-array `spawn('git', [...safeGitArguments, ...arguments_])`, `shell: false`, `GIT_CONFIG_NOSYSTEM`, disabled hooks/external diff/terminal prompt, timeout, abort, and bounded stdout/stderr. Preserve native Git as authority and restrict the patch adapter to read commands. Repository discovery must use existing `discoverGitRepository` validation; never add a write command or shell command construction.

Reuse `createChangedFileInventory()` semantics: raw `--raw -z --no-abbrev`, `--find-renames=50%`, `--find-copies=50%`, `--find-copies-harder`, `--no-ext-diff`, `--no-textconv`, exact `--` pathspec boundary, status/similarity/modes/OIDs, `.cumpa` filtering, opaque file IDs, and `ChangedFileSchema.parse`. Preserve `inventoryPaths()` old/new side rules. `parseRawDiff()` must retain two paths for rename/copy and create `ExactPath` from raw bytes. `createExactPath()` is the only display conversion: retain `bytesBase64url`, control-safe `display`, optional strict UTF-8, and no optimistic decode/re-encode.

Availability must remain truthful for add/delete/modify/rename/copy/mode-only, symlink, binary, submodule, non-UTF-8, missing, unsupported, and oversized content. Metadata entries remain visible even when no inline diff exists. PATCH-03 tests should extend `tests/git/inventory.test.ts` fixture matrix (including `symlink`, `submodule`, mode changes, binary, non-UTF-8, oversized and non-UTF-8 filenames), and assert status/mode/path/similarity/availability are not reduced to text-only records.

For PATCH-04, follow `tests/git/inventory.test.ts` recording runner and `tests/helpers/git-fixture.ts` temporary fixture cleanup. Capture worktree bytes, index checksum/status, refs, and object count before and after both successful and rejected grounding; prove they are unchanged. Do not use a second fixture mechanism or broad integration setup.

### Contracts, session scope, capabilities and PATCH-05

**Sources:** `src/contracts/comparison.ts` (`PinnedComparisonSchema`, `ChangedFileSchema`), `src/contracts/api.ts` (`SessionResponseSchema`, `FileMetadataResponseSchema`, `FileContentResponseSchema`, `SelectorDriftResponseSchema`), `src/server/capabilities.ts:224-420`, `src/server/routes.ts:39-220`, `src/git/selector-drift.ts`, `tests/api/session.test.ts:24-190`.

Add a discriminated patch provenance/scope to the existing pinned comparison/API DTOs. Follow `createCapabilityRegistry()`'s per-instance `Map` ownership (`filesByCapability`, `frozenFilesByCapability`), immutable `session` projection, and opaque file IDs. Patch capabilities must resolve and read only the owned snapshot, never current worktree bytes or cross-session globals. Preserve security route behavior: strict empty query schemas, `OpaqueFileIdSchema.safeParse`, generic `REQUEST_UNAVAILABLE_ERROR`, and 404/409 handling for unknown/non-text/unreadable files.

Patch drift is a sibling of selector drift, not a refresh path. Reuse `SelectorDriftObserver` shape (`observe(): Promise<SelectorDriftResponse>`), server-side observation, and one route. On implementation drift, retain frozen content and return persistent explicit failure; never substitute current content or offer acknowledge/refresh/continue. A retry must reread the same snapshot only. Snapshot missing/corrupt/incomplete/read-only must block rather than rebuild from live repository. `ErrorState` geometry is the fallback for blocking snapshot failure.

PATCH-05 API tests should copy `tests/api/session.test.ts`'s `comparisonFixture()`, `buildApp()`, authenticated Fastify `inject()`, and leakage assertions. Mutate the fixture/repository after acceptance and assert session/file/content/digest remain unchanged while drift is reported. Delete/corrupt snapshot and assert blocking error with no live fallback. Add repeated reads to prove ownership and no cross-session map leakage.

### Draft/export identity

**Sources:** `src/contracts/draft.ts` (`ReviewDraftV1Schema`, `DraftVersionEnvelopeSchema`, `ReviewExportV1/V2Schema`), `src/server/draft-loader.ts:77-150`, `src/server/draft-store.ts`, `src/export/review-export.ts`, `src/export/render-review-markdown.ts`, `src/domain/comparison-key.ts:1-35`.

Extend schemas with server-derived exact-patch identity/digest and snapshot provenance, preserving strict objects, version envelope, `sameComparison` rejection, canonical ordering and deterministic serialization. Use a separate length-framed SHA-256 domain key (like `rangeReviewKey()`), including patch identity/digest and target identity; never derive identity from browser values, display paths, moving labels, or delimiter-joined strings. `createDraftStore()` remains repository-local atomic JSON persistence; malformed/schema-invalid/newer drafts become read-only via `createDraftLoader()` and no partial overwrite. Export builders/renderers must copy only validated server provenance into canonical JSON/Markdown; never accept a client-supplied digest as authority. Existing ordinary/range export behavior remains unchanged.

Test with `tests/unit/review-export.test.ts`, `tests/unit/review-markdown.test.ts`, and `tests/api/export*.test.ts`: parse final export schemas, cumpa deterministic output, assert patch identity/digest survives draft → export and cannot be spoofed or omitted.

### Vue exact-patch presentation (PATCH-05 UI)

**Sources:** `src/web/App.vue:67-125,201-225,744-976`, `src/web/components/IdentityHeader.vue`, `IdentityPanel.vue`, `DiffWorkspace.vue`, `FileMetadataPane.vue`, `InlineNotice.vue`, `ErrorState.vue`, `CopyButton.vue`, `FileTree.vue`, plus Phase 12 `12-UI-SPEC.md` component/interaction contract.

Branch only on server-provided patch source identity; valid patch sessions open directly in the existing file tree, Monaco diff, comments, summary, persistence, and export workspace. Reuse `App.vue`'s `loadFile()` request-version guard and `FILE_UNAVAILABLE_MESSAGE` handling. Never refresh Monaco models from live filesystem bytes. Preserve file tree as server-authoritative inventory and metadata pane for non-reviewable entries.

Reuse `IdentityHeader`/`IdentityPanel` layout but label sides `Preimage` and `Postimage`; show `Repository object` under preimage and `Implemented content` under postimage; use `Absent` for missing side; omit global endpoint OID slot. Reuse `FileMetadataPane` for modes/status/availability/copy actions and `CopyButton` for full patch digest. Reuse `InlineNotice` after header and before review shell with exact UI-SPEC copy: `The repository or worktree no longer matches this exact patch. The frozen review remains readable, but Cumpa will not substitute current content. Relaunch with a patch that matches the current implementation.` No dismiss, refresh, accept-current, revalidate, apply, or continue action.

For frozen file read failure use existing diff error geometry and exact copy: `Cumpa could not read this file from the frozen patch snapshot. Try the same snapshot again; current repository or worktree bytes will not be substituted.` For missing/corrupt/incomplete snapshot use `ErrorState` geometry and exact blocking copy from UI-SPEC. Preserve 44px narrow hit targets, 96px narrow header, regular/semibold weights only, monospace 14px/20px for digest/OIDs/modes/paths, existing `#0D1117/#161B22/#2F81F7` allocation, and semantic text labels (never color-only status).

Browser tests should extend `tests/e2e/anchored-workspace.spec.ts`, `tests/integration/selector-drift-ui.spec.ts`, and `tests/e2e/file-tree.spec.ts` patterns: launch valid patch through existing helper, verify direct workspace and truthful labels, mutate repository after acceptance, assert frozen bytes remain and persistent non-dismissible drift notice appears, reload same snapshot, and assert snapshot loss blocks without live fallback. Review comments/summary remain editable; stale/orphaned anchors remain non-actionable.

## PATCH Requirement Coverage

| Requirement | Pattern/proof to preserve |
|---|---|
| **PATCH-01** | Strict exclusive request (`request.ts`), one-shot non-TTY ownership (`run.ts`), server-built inventory/capability scope; valid patch only opens existing workspace entries. |
| **PATCH-02** | `ObjectReader` full-OID bounded reads + raw `Buffer` equality; reject absent/missing/type/malformed/live-target/postimage mismatch. |
| **PATCH-03** | Native raw diff/inventory/path-byte/availability DTOs retain all Git metadata and non-reviewable entries. |
| **PATCH-04** | Read-only `GitRunner` commands plus fixture checksum/status/ref/object-count before/after success and rejection. |
| **PATCH-05** | Per-session snapshot capabilities, server drift observer, frozen reads/retry, blocking snapshot-loss state, draft/export provenance, and Vue presentation branch. |

## Shared Patterns

- **Validation:** strict Zod schemas at request/API/draft/export boundaries; parse before side effects.
- **Git safety:** `createGitRunner()` argument arrays, `shell:false`, disabled hooks/external diff/optional locks, bounded output, abort/timeout; native Git is sole semantic authority.
- **Immutability:** `Object.freeze` DTOs and per-session `Map`s; no mutable module-global review state; snapshot bytes are owned once and served unchanged.
- **Paths:** raw NUL-delimited Git bytes → `ExactPath`; preserve base64 bytes and control-safe display, never round-trip through display text.
- **Errors/security:** generic unavailable response, bounded diagnostics, no repository root/blob IDs/tokens in public responses; rejected patch never launches browser.
- **UI:** reuse existing workspace/components and state geometry; exact patch changes terminology and drift/error copy only, not review controls or source-selection screens.

## No Exact Analog

| Target | Why | Planner direction |
|---|---|---|
| `src/git/exact-patch.ts` / `src/server/patch-snapshot.ts` | No prior patch parser/accepted-byte snapshot exists | Compose existing raw-diff/object-reader/draft-loader patterns; keep adapter read-only and snapshot per authenticated session. |

## Pattern Mapping Complete

- **Files classified:** 25
- **Analogs found:** 24 / 25
- **Exact analogs:** 17 (including extensions)
- **Role-match analogs:** 7
- **No exact analog:** 1
- **PATCH-01..PATCH-05:** fully mapped above
- **Research questions:** none unresolved; use the cited existing symbols and approved `13-UI-SPEC.md` as executor constraints.

**Analog search scope:** `src/contracts`, `src/cli`, `src/git`, `src/domain`, `src/server`, `src/export`, `src/web`, `tests/cli`, `tests/git`, `tests/api`, `tests/unit`, `tests/e2e`, `tests/integration`, `tests/helpers`, and Phase 12 planning artifacts.
