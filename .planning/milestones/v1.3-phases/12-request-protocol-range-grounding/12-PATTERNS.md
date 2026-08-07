# Phase 12: Request Protocol & Range Grounding — Pattern Map

**Mapped:** 2026-08-04  
**Files analyzed:** 24 likely created/modified files (source, contracts, persistence/export, UI, tests)  
**Analogs found:** 23 / 24 (the new request reader/schema has no exact existing analog)

## File Classification

| New/Modified File | Role | Data flow | Closest analog | Match |
|---|---|---|---|---|
| `src/contracts/request.ts` | contract/schema | request-response / transform | `src/contracts/comparison.ts:1-64` | role-match |
| `src/cli/request.ts` | protocol reader/orchestrator | streaming stdin → request-response | `src/cli/run.ts:287-487`, `src/server/draft-loader.ts:77-116` | role-match |
| `src/cli/run.ts` | CLI dispatcher | request-response / launch | `runCli()` and `launchPinnedSession()` at `src/cli/run.ts:287-487` | exact |
| `src/git/comparison.ts` | Git comparison builder | transform / request-response | `createPinnedComparison()` at `src/git/comparison.ts:122-327` | exact, with range variant |
| `src/git/inventory.ts` | Git inventory | batch transform / file I/O | `createChangedFileInventory()` at `src/git/inventory.ts:105-199` | exact |
| `src/git/runner.ts` | subprocess adapter | request-response / bounded I/O | `createGitRunner()` at `src/git/runner.ts:80-237` | exact |
| `src/domain/comparison-key.ts` | scoped identity utility | transform | `comparisonKey()` at `src/domain/comparison-key.ts:1-25` | exact |
| `src/contracts/comparison.ts` | shared model | transform | existing pinned schemas at `src/contracts/comparison.ts:25-64` | exact |
| `src/contracts/api.ts` | session/export DTOs | request-response | `SessionResponseSchema` `src/contracts/api.ts:310-317`; export schemas `:211-220`, `:440-480` | exact |
| `src/server/app.ts` / `src/server/routes.ts` | session capability/API | request-response | `createSessionApp()` and `/api/session` routes | role-match |
| `src/server/draft-loader.ts` | draft namespace/load | file I/O | `draftPaths()` / `classifyDraft()` `:61-150` | exact |
| `src/server/draft-store.ts` | draft persistence | CRUD/file I/O | `DraftComparison` and mutation flow | exact |
| `src/server/export-store.ts` | export persistence | file I/O | existing export directory/key handling | role-match |
| `src/export/review-export.ts` | canonical export/provenance | transform/file I/O | `buildReviewExportV1()` at `src/export/review-export.ts:75-116` | exact |
| `src/web/components/IdentityHeader.vue` | Vue component | request-response/presentation | existing identity header | exact |
| `src/web/components/IdentityPanel.vue` | Vue component | request-response/presentation | existing disclosure modal/focus trap | exact |
| `src/web/App.vue` | Vue composition/root | request-response/presentation | existing identity state wiring | exact |
| `tests/cli/request.test.ts` (new) | Vitest protocol test | streaming/request-response | `tests/cli/errors.test.ts`, `tests/cli/selection.test.ts` | role-match |
| `tests/cli/selection.test.ts` | Vitest CLI regression | request-response | `runCli` injection test `:500-523` | exact |
| `tests/git/comparison.test.ts` | Vitest Git range test | transform | recording runner `:45-90` | exact |
| `tests/git/inventory.test.ts` | Vitest pathspec test | batch transform | `recordingRunner()` `:197-206` and fixture matrix | exact |
| `tests/unit/comparison-key.test.ts` | Vitest identity test | transform | existing key test | exact |
| `tests/server/draft-load.test.ts`, `tests/api/session.test.ts`, `tests/api/export*.test.ts` | Vitest persistence/API | file I/O/request-response | frozen session fixture `tests/api/session.test.ts:19-139` | exact |
| `tests/e2e/pinned-session.spec.ts` | Playwright packaged flow | process streaming → browser | generated CLI helpers/test at `:50-103` and tests | exact |
| `tests/performance/production-picker.mjs` | benchmark compatibility | streaming stdin | current benchmark | intentional no bypass |

## Pattern Assignments

### `src/contracts/request.ts` (new, schema/transform)

Use one Zod authority, strict objects, literal discriminators, inferred types. Copy `src/contracts/comparison.ts:1-15,25-40`: `z.strictObject`, `z.literal`, `.readonly()`, and exported `z.infer` types. Recommended shape from research:

```ts
const boundedGitString = z.string().min(1).refine(/* reject NUL/surrogates and UTF-8 byte limit */);
const RevisionRangeSchema = z.strictObject({
  base: boundedGitString,
  head: boundedGitString,
  pathspecs: z.array(boundedGitString).max(MAX_PATHSPEC_COUNT).default([]),
});
export const AgentReviewRequestV1Schema = z.strictObject({
  kind: z.literal('cumpa.review-request'),
  schemaVersion: z.literal(1),
  mode: z.literal('revisions'),
  revisions: RevisionRangeSchema,
});
export type AgentReviewRequestV1 = z.infer<typeof AgentReviewRequestV1Schema>;
```

Keep request-controlled fields limited to revisions/pathspecs. Root and nested unknown fields fail; future versions can use a discriminated union rather than optional fields.

### `src/cli/request.ts` (new, bounded reader/orchestrator)

No prompt logic here. Follow `src/server/draft-loader.ts:77-116` for fatal UTF-8 decode (`new TextDecoder('utf-8', { fatal: true })`), parse once, bounded diagnostics. Read `process.stdin` as bytes/chunks, count before concatenation, reject empty/over-limit, decode only after EOF, then `JSON.parse` and strict Zod parse. Stable categories: `empty-request`, `request-too-large`, `invalid-utf8`, `malformed-json`, `unsupported-version`, `invalid-request`, `invalid-revision`, `non-ancestor-range`, `invalid-pathspec`; write only safe concise stderr and set exit status.

The range orchestrator should resolve endpoint labels exactly once, verify ancestry, then call a pinned-OID builder and existing `launchPinnedComparison()`—never call Inquirer or re-resolve refs. Preserve `shell: false` and array arguments. Do not echo raw JSON or request pathspecs to terminal.

### `src/cli/run.ts` (modified dispatcher)

Insert ownership selection before Commander/Inquirer can consume stdin. `process.stdin.isTTY === true` routes unchanged to `runCli({ cwd: process.cwd() })`; non-TTY routes request reader. Preserve packaged `CUMPA_LAUNCH_OPTIONS` behavior at `src/cli/run.ts:460-487` and keep `runCli()` untouched as the TTY regression seam. Existing launch error boundary `reportFatalLaunchError()` (`:287-296`) prints actionable message and status 1; request failures should use equivalent boundary without binding server/opening browser.

### `src/git/comparison.ts` (modified, pinned range)

Reuse repository discovery/object-format checks and immutable inventory construction from `createPinnedComparison()` (`:122-327`). Existing endpoint resolution is `rev-parse --verify --end-of-options `${selection.revision}^{commit}`` (`:50-75`) and current merge-base flow (`:179-258`). Add a lower-level range path accepting resolved `baseOid/headOid`, using `git merge-base --is-ancestor baseOid headOid`; equality is valid for agent ranges and creates a zero-file comparison. For range diffs, use `diffBaseOid: baseOid`, not a moving ref or merge-base. Keep full OIDs in the model and freeze returned comparison (`:300-327`).

Do not reuse interactive equal-commit or multiple-merge-base rejection for the agent contiguous range. A recording runner should prove submitted revision strings appear only in the two rev-parse calls; all subsequent Git operations consume OIDs.

### `src/git/inventory.ts` (modified, native pathspec)

Extend `CreateChangedFileInventoryOptions` with ordered `pathspecs?: readonly string[]`. In both existing parallel invocations (`:123-150`), append one shared `['--', ...pathspecs]` after OIDs. Preserve exact order/spelling, including exclusion/magic/leading-dash values; do not sort, normalize, deduplicate, expand, or post-filter in TypeScript. Keep `.cumpa` filtering (`isCumpaInternalPath`, `:48-62`) as a separate repository invariant. Tests should record both commands and assert identical pathspec tails.

### `src/git/runner.ts` (modified environment)

Copy subprocess safety from `src/git/runner.ts:80-150`: argument arrays, `shell: false`, safe Git arguments, bounded stdout/stderr and abort/timeout handling. For range commands explicitly remove inherited `GIT_LITERAL_PATHSPECS`, `GIT_GLOB_PATHSPECS`, `GIT_NOGLOB_PATHSPECS`, and `GIT_ICASE_PATHSPECS` from the environment so native default pathspec semantics are deterministic; retain existing `GIT_CONFIG_NOSYSTEM`, `GIT_EXTERNAL_DIFF`, and `GIT_TERMINAL_PROMPT` controls.

### `src/domain/comparison-key.ts` (modified scoped key)

Retain `comparisonKey(baseOid, headOid)` byte-for-byte for interactive sessions. Copy its length-framed SHA-256 implementation (`:1-25`): domain bytes, UTF-8 `TextEncoder`, 8-byte length prefix, `createHash('sha256')`. Add a separate range key that frames mode, pinned OIDs, pathspec count, and each ordered pathspec. Include no delimiter-joined strings, moving revision labels, or merge-base; same scope is stable and insertion/removal/reordering/spelling changes are distinct.

### Shared contracts/session/API (`src/contracts/comparison.ts`, `src/contracts/api.ts`, `src/server/app.ts`, `src/server/routes.ts`)

Extend the single `PinnedComparison` model (`src/contracts/comparison.ts:42-64`) with optional/discriminated immutable range provenance: submitted endpoint labels, full pinned OIDs, ordered pathspecs, and scoped review key. Keep API DTOs narrow: follow `SessionResponseSchema` (`src/contracts/api.ts:310-317`) and route projection to expose only browser-approved scope fields, never repository root, blob OIDs, tokens, or capability IDs. Session must serve a frozen snapshot created at launch; do not add a browser ref-refresh/filter path.

### Persistence/export (`src/server/draft-loader.ts`, `src/server/draft-store.ts`, `src/server/export-store.ts`, `src/export/review-export.ts`)

Thread the scoped key through every draft/export ownership call site. `draftPaths()` currently computes pair-only identity (`src/server/draft-loader.ts:61-70`); change its comparison input/key source for range sessions while retaining interactive paths unchanged. Keep `sameComparison()` validation (`:45-58`) and versioned JSON classification (`:77-116`). Export should retain immutable range provenance and scoped identity in canonical JSON/Markdown based on `buildReviewExportV1()` (`src/export/review-export.ts:75-116`), while receipt paths and drift checks remain tied to pinned OIDs. Same OIDs with different ordered pathspecs must never collide; identical scope must reopen the same draft.

### UI (`src/web/components/IdentityHeader.vue`, `IdentityPanel.vue`, `App.vue`)

Reuse current computed display and focus patterns. `IdentityHeader.vue` uses `controlSafeDisplay`, computed heading, a ref exposed through `defineExpose({ focusDisclosure })`, and an explicit disclosure button. `IdentityPanel.vue` uses `controlSafeDisplay`, `CopyButton`, `defineExpose({ focusClose })`, and a narrow-modal Tab focus loop. Add conditional range-only action/title exactly per UI spec: “View review scope” / “Review scope”; show full base/head OIDs and ordered pathspecs, “All changed paths” when empty. Never sort/truncate/normalize pathspecs or add client filtering. Preserve App’s `identityOpen`, narrow `inert`, Escape close, focus return, and error/empty surfaces (`src/web/App.vue` template).

## Shared Patterns

### Launch and TTY ownership
`run()`/Commander action (`src/cli/run.ts:460-487`) is the only top-level dispatch seam. TTY must preserve `runCli` event order: discover → pick → pin → confirm → launch. Existing injected test at `tests/cli/selection.test.ts:500-523` asserts `['pick', 'launch']`; extend, do not replace it.

### Git safety and exact scope
Use `rev-parse --verify --end-of-options <revision>^{commit}` (`src/git/comparison.ts:50-75`), `shell:false` argument arrays, `--` before exact pathspecs, and immutable OIDs/object blobs. Equality is accepted only in machine range mode. Remove global pathspec env overrides for range commands.

### Validation and error boundary
Zod strict schemas and `LaunchError` recovery are established in `src/git/comparison.ts:8-17,76-121`; malformed request failures must be nonzero before `launchPinnedComparison`, with zero stdout and no browser/listener. Avoid raw request echo; use bounded safe categories.

### Persistence/provenance
Use SHA-256 length-framed keys (`src/domain/comparison-key.ts:1-25`), versioned strict JSON (`src/server/draft-loader.ts:77-116`), and frozen opaque capability/session data (`tests/api/session.test.ts:104-150`). Provenance must survive session, draft, export, and receipt paths without exposing repository internals.

### Tests
- **Protocol:** new `tests/cli/request.test.ts`, modeled after `tests/cli/errors.test.ts` and injected dependencies in `tests/cli/selection.test.ts`; cover all failure categories, fatal UTF-8, byte cap, strict unknown/version, no stdout/bind/open.
- **Range:** `tests/git/comparison.test.ts` real `createValidationGitFixture` plus recording `GitRunner` (`:45-90`); ancestor/equal/reversed/non-commit and resolve-once assertions.
- **Pathspec:** `tests/git/inventory.test.ts` fixture and `recordingRunner()` (`:197-206`); assert exact ordered tails in raw and numstat and native magic/include/exclude behavior.
- **Identity/persistence:** `tests/unit/comparison-key.test.ts`, `tests/server/draft-load.test.ts`, API/export tests; assert stable same-scope keys, order-sensitive collisions, moved refs do not change inventory/blob/draft/export provenance.
- **Interactive regression:** retain `tests/cli/selection.test.ts` unchanged behavior. Do not teach `tests/performance/production-picker.mjs` to bypass protocol; it pipes non-TTY input and must use a real PTY if retained.
- **Browser:** `tests/e2e/pinned-session.spec.ts` packaged CLI helpers spawn generated binary (`spawn`, stdout/stderr readers, loopback URL wait). Add scope disclosure/ordered/empty/error/focus assertions; invalid requests should be covered with process-level opener spy and never launch a browser.

## No Analog Found

| File | Role | Data flow | Guidance |
|---|---|---|---|
| `src/cli/request.ts` and `src/contracts/request.ts` | protocol reader + versioned request contract | bounded streaming stdin → strict transform | No existing machine-input protocol. Use the concrete byte-first/TextDecoder/Zod sequence in RESEARCH.md and the analogs above; do not add a second CLI or dependency. |

## Metadata

**Analog search scope:** `src/cli`, `src/git`, `src/domain`, `src/contracts`, `src/server`, `src/export`, `src/web`, `tests/cli`, `tests/git`, `tests/unit`, `tests/api`, `tests/e2e`, `tests/performance`  
**Files scanned:** 24 targeted files plus related test directories  
**Pattern extraction date:** 2026-08-04
