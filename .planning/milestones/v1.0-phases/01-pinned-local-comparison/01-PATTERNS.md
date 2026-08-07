# Phase 1: Pinned Local Comparison - Pattern Map

**Mapped:** 2026-07-11
**Repository state:** Greenfield
**Expected implementation/config artifacts classified:** 43
**Real codebase analogs found:** 0 / 43

## Evidence Boundary

This repository contains planning material only. A targeted implementation scan found no `src/`, `tests/`, `package.json`, lockfile, TypeScript configuration, Vite configuration, Vitest configuration, or Playwright configuration. `01-CONTEXT.md` likewise records that no source tree, application, packages, manifest, reusable assets, or established implementation patterns exist.

Consequently:

- There are **no actual project code conventions to copy**: no import style, naming convention, dependency-injection style, error wrapper, route registration pattern, Vue component pattern, fixture helper, or test layout has been implemented.
- The stack and skeleton below are **project constraints/research recommendations**, not existing analogs.
- External examples quoted from `01-RESEARCH.md` are implementation guidance only. They must not be represented in a plan as code already present in this repository.
- No implementation file was opened because none exists. This map does not invent source excerpts or line-number references to nonexistent files.

## Expected File and Module Classification

The file list comes from the recommended project skeleton in `01-RESEARCH.md`, expanded only where the research explicitly names browser responsibilities. Component filenames are planner-level proposed names, not locked existing paths.

### Project and build configuration

| Expected file | Role | Data flow | Closest real analog | Status |
|---|---|---|---|---|
| `package.json` | config | build/package lifecycle | None | greenfield; stack constraint only |
| `package-lock.json` | config | dependency resolution | None | generated after approved installation |
| `tsconfig.json` | config | transform/type-check | None | greenfield |
| `vite.config.ts` | config | build/static-assets | None | greenfield |
| `vitest.config.ts` | config | test discovery/execution | None | greenfield |
| `playwright.config.ts` | config | packaged E2E lifecycle | None | greenfield |

### CLI and Git/domain core

| Expected file | Role | Data flow | Closest real analog | Status |
|---|---|---|---|---|
| `src/cli/main.ts` | controller / CLI entry | request-response | None | greenfield |
| `src/cli/launch.ts` | service / composition root | event-driven orchestration | None | greenfield |
| `src/cli/picker.ts` | controller / prompt adapter | request-response | None | greenfield |
| `src/git/runner.ts` | service | streaming subprocess I/O | None | greenfield |
| `src/git/repository.ts` | service | request-response | None | greenfield |
| `src/git/candidates.ts` | service | batch discovery/transform | None | greenfield |
| `src/git/comparison.ts` | service | request-response | None | greenfield |
| `src/git/raw-diff.ts` | utility / parser | streaming transform | None | greenfield |
| `src/git/numstat.ts` | utility / parser | streaming transform | None | greenfield |
| `src/git/objects.ts` | service | streaming object I/O | None | greenfield |
| `src/git/availability.ts` | service / classifier | transform | None | greenfield |
| `src/domain/path-bytes.ts` | model / utility | transform | None | greenfield |
| `src/domain/file-tree.ts` | model / projection | transform | None | greenfield |
| `src/domain/errors.ts` | model | request-response error mapping | None | greenfield |

### Wire contracts and loopback server

| Expected file | Role | Data flow | Closest real analog | Status |
|---|---|---|---|---|
| `src/contracts/comparison.ts` | model / schema | transform/validation | None | greenfield |
| `src/contracts/api.ts` | model / schema | request-response validation | None | greenfield |
| `src/server/app.ts` | provider / app factory | request-response | None | greenfield |
| `src/server/security.ts` | middleware / hook | request-response | None | greenfield |
| `src/server/capabilities.ts` | store / provider | request-response lookup | None | greenfield |
| `src/server/routes.ts` | route / controller | request-response | None | greenfield |
| `src/server/static.ts` | provider / route | file-I/O/request-response | None | greenfield |
| `src/server/lifecycle.ts` | service | event-driven | None | greenfield |

### Browser workspace

| Expected file/module | Role | Data flow | Closest real analog | Status |
|---|---|---|---|---|
| `src/web/index.html` | config / shell | request-response | None | greenfield |
| `src/web/main.ts` | controller / bootstrap | event-driven | None | greenfield |
| `src/web/App.vue` | component / workspace shell | request-response | None | greenfield |
| `src/web/api/client.ts` | service | request-response | None | greenfield |
| `src/web/components/IdentityHeader.vue` | component | transform/render | None | inferred filename for explicitly required UI responsibility |
| `src/web/components/FileTree.vue` | component | event-driven selection/render | None | inferred filename for explicitly required UI responsibility |
| `src/web/components/FileMetadataPane.vue` | component | transform/render | None | inferred filename for explicitly required UI responsibility |
| `src/web/components/EmptyState.vue` | component | transform/render | None | inferred filename for explicitly required UI responsibility |
| `src/web/components/ErrorState.vue` | component | transform/render | None | inferred filename for explicitly required UI responsibility |
| `src/web/model/file-tree.ts` | model / store-like projection | transform | None | inferred module for research's browser-only tree selection/projection |

### Tests

| Expected file/module | Role | Data flow | Closest real analog | Status |
|---|---|---|---|---|
| `tests/helpers/git-fixture.ts` | test utility | file-I/O/event-driven | None | greenfield |
| `tests/unit/*.test.ts` | test | transform | None | greenfield suite category |
| `tests/git/*.test.ts` | test | subprocess/file-I/O | None | greenfield suite category |
| `tests/api/*.test.ts` | test | request-response | None | greenfield suite category |
| `tests/e2e/*.spec.ts` | test | event-driven/request-response | None | greenfield suite category |

## Actual Analog Status

### No implementation analog exists

Every proposed file above has the same truthful analog assignment: **none in this repository**. There is no basis for saying, for example, “copy imports from X,” “use the existing error handler,” or “follow the current component structure.” The planner should establish each convention once, coherently, in the first slice and reuse it in later slices.

### What can legitimately guide implementation

| Guidance source | What it establishes | What it does not establish |
|---|---|---|
| `.planning/PROJECT.md` | Locked product/stack boundary | Existing code style |
| `.planning/REQUIREMENTS.md` | Observable acceptance and security behavior | Module implementation pattern |
| `01-CONTEXT.md` | Locked UX, identity, inventory, and failure decisions | Existing analogs |
| `01-RESEARCH.md` | Recommended architecture, protocols, APIs, and test seams | Repository convention or proven local code |
| Upstream library/native Git documentation cited by research | API/protocol semantics | A local wrapper convention |

## Reusable Guidance (Not Existing Code)

The following excerpts are the closest available concrete patterns. Their source is research or upstream documentation, **not implementation in this repository**.

### 1. Shell-free, byte-oriented Git subprocess boundary

**Intended file:** `src/git/runner.ts`  
**Guidance source:** `01-RESEARCH.md`, “Pattern 1: shell-free byte-oriented Git runner” (around lines 262-279)  
**Analog status:** External Node API example; no local analog

```ts
const child = spawn('git', args, {
  cwd,
  shell: false,
  signal,
  stdio: ['pipe', 'pipe', 'pipe'],
});
```

Planner instructions:

- Centralize this primitive rather than spawning Git independently across services.
- Keep machine stdout as `Buffer`; NUL-delimited parsing precedes text decoding.
- Pass arguments discretely, never through a shell command string.
- Give each operation an abort/timeout signal, stdout ceiling, bounded diagnostic stderr, and typed failure mapping.
- Use `--` or `--end-of-options` at supported option/revision boundaries.

### 2. Candidate identity is distinct from commit identity

**Intended files:** `src/git/candidates.ts`, `src/cli/picker.ts`, `src/contracts/comparison.ts`  
**Guidance source:** `01-RESEARCH.md`, “Pattern 2: discovery preserves source identity separately from commit identity” (around lines 281-300)  
**Analog status:** Research-recommended model; no local analog

```ts
type SourceCandidate =
  | { kind: 'branch'; id: string; label: string; refName: string; commitOid: string }
  | {
      kind: 'worktree'; id: string; label: string; pathBytes: PathBytes;
      branchRef?: string; detached: boolean; commitOid: string;
      dirty: 'clean' | 'dirty' | 'unavailable'; unavailableReason?: string;
    };
```

Planner instructions:

- Keep branch and worktree rows separate even at the same OID.
- Build refs from explicit `for-each-ref` fields and worktrees from `worktree list --porcelain -z`.
- Probe worktree dirty state with porcelain `-z`; do not parse human status.
- Run one search prompt twice: explicit base, then head with a suggestion only.
- Equal resolved commits remain visible candidates but block launch.

### 3. Exact merge-base cardinality

**Intended file:** `src/git/comparison.ts`  
**Guidance source:** `01-RESEARCH.md`, “Exact merge-base cardinality” code example (around lines 706-709)  
**Analog status:** Research example derived from Git documentation; no local analog

```ts
const output = await git.runBytes(['merge-base', '--all', baseOid, headOid]);
const bases = parseOidLines(output.stdout, objectFormat);
if (bases.length === 0) throw new UnrelatedHistoriesError(baseOid, headOid);
if (bases.length > 1) throw new MultipleMergeBasesError(bases);
const mergeBaseOid = bases[0];
```

Planner instructions:

- Resolve selected endpoints to full commit OIDs before comparison and freeze those OIDs.
- Never omit `--all`; zero and multiple results are distinct pre-session errors.
- Treat OIDs as object-format-dependent opaque full identities, not hard-coded SHA-1 strings.

### 4. Machine-readable raw diff and numstat are separate protocols

**Intended files:** `src/git/raw-diff.ts`, `src/git/numstat.ts`, inventory assembly in `src/git/comparison.ts` or a narrowly named service if the planner introduces one  
**Guidance source:** `01-RESEARCH.md`, “Pattern 5” command guidance (around lines 323-350)  
**Analog status:** Native Git command protocol; no local parser analog

```text
git diff --raw -z --no-abbrev --find-renames=50% --find-copies=50% \
  --find-copies-harder --no-ext-diff --no-textconv <mergeBase> <head> --
git diff --numstat -z --find-renames=50% --find-copies=50% \
  --find-copies-harder --no-ext-diff --no-textconv <mergeBase> <head> --
```

Planner instructions:

- Implement separate byte parsers; the two formats do not share a line grammar.
- Preserve modes, blob IDs, status/similarity, and one or two exact path byte sequences.
- Join raw and numstat records by an exact byte identity key and assert one-to-one cardinality.
- Unknown statuses become explicit unsupported records, not dropped entries or parser crashes.
- Disable external diff and textconv; do not execute repository-configured transformations.

### 5. Lossless paths and safe display are separate values

**Intended files:** `src/domain/path-bytes.ts`, `src/contracts/comparison.ts`, `src/domain/file-tree.ts`  
**Guidance source:** `01-RESEARCH.md`, “Pattern 7: lossless path model” (around lines 371-393)  
**Analog status:** Research-recommended schema; no local analog

```ts
const ExactPathSchema = z.strictObject({
  bytesBase64url: z.string(),
  display: z.string(),
  utf8: z.string().optional(),
});
```

Planner instructions:

- Retain bytes as identity; never use the escaped display string as identity.
- Escape controls and backslash visibly without Unicode normalization.
- Sort deterministically by byte identity with an explicit tie-breaker.
- Compact only view-model directory nodes; never mutate the exact stored path.
- Use opaque file IDs for browser lookup, not paths.

### 6. Zod owns wire contracts, not Git byte parsing

**Intended files:** `src/contracts/comparison.ts`, `src/contracts/api.ts`  
**Guidance source:** `01-RESEARCH.md`, “Pattern 8: Zod owns wire, not Git parser” (around lines 395-407)  
**Analog status:** Stack/research constraint; no local analog

Required schema families are:

- pinned identity: object format, base/head/merge-base identities, labels, selected worktrees, dirty warnings;
- changed file: opaque ID, status, paths, modes, blob IDs, optional counts, availability;
- strict discriminated availability states;
- session and file-metadata responses;
- generic non-leaking API errors.

Use strict schemas and derive TypeScript types with `z.infer`. Parse Git bytes into internal models first; validate only serializable DTOs at process/browser boundaries.

### 7. Loopback security is a mandatory request boundary

**Intended files:** `src/server/security.ts`, `src/server/app.ts`, `src/web/api/client.ts`  
**Guidance source:** `01-RESEARCH.md`, “Pattern 9: loopback is network security boundary” (around lines 409-439)  
**Analog status:** Research security design; no local middleware analog

Concrete lifecycle and request constraints:

```ts
await fastify.listen({ host: '127.0.0.1', port: 0 });
```

- Generate a process-scoped high-entropy token.
- Put it in the URL fragment, remove the fragment immediately in the SPA, retain it in memory, and send it as a bearer token.
- Require exact Host; reject any present Origin that differs from the expected origin; allow absent Origin only with exact Host and token.
- Cumpa tokens in constant time.
- Do not enable CORS.
- Apply no-store/no-referrer/nosniff/frame/base/CSP protections.
- Browser denials are generic; terminal diagnostics carry correlation and actionable detail without logging the token.

### 8. Capability-shaped API

**Intended files:** `src/server/capabilities.ts`, `src/server/routes.ts`, `src/server/app.ts`  
**Guidance source:** `01-RESEARCH.md`, “Pattern 10: closure-owned API capabilities” (around lines 441-458)  
**Analog status:** Research route recommendation; no local route analog

```text
GET /api/session
GET /api/files/:fileId
```

The app factory should close over a frozen session and `Map<FileId, FrozenChangedFile>`. Requests must not carry repository roots, refs, commit IDs, blob IDs, source/destination paths, Git flags, filesystem paths, or export destinations. Unknown opaque IDs receive the same generic not-found response. The server layer must have no general request-to-Git command path.

### 9. Bind-before-open and idempotent shutdown

**Intended files:** `src/cli/main.ts`, `src/cli/launch.ts`, `src/server/lifecycle.ts`  
**Guidance source:** `01-RESEARCH.md`, “Pattern 11: bind-before-open idempotent shutdown” (around lines 460-475)  
**Analog status:** Research lifecycle recommendation; no local analog

Required order:

1. Discover, select, resolve, cumpa, inventory, classify, and confirm.
2. Freeze session, capabilities, and token.
3. Bind to `127.0.0.1` with an OS-assigned port.
4. Print URL and shutdown instructions.
5. Attempt to open the browser; opener failure remains recoverable because the URL is already printed.
6. Route SIGINT/SIGTERM through one idempotent shutdown promise that aborts children and awaits Fastify close.

Commander entry should use `parseAsync()`.

### 10. Vue is a projection of one immutable session

**Intended files:** `src/web/App.vue`, browser components, `src/web/model/file-tree.ts`  
**Guidance source:** `01-CONTEXT.md` decisions D-08 and D-11 through D-18; `01-RESEARCH.md` architecture map  
**Analog status:** Product behavior only; no local Vue analog

The Phase-1 browser must project, not mutate or re-resolve:

- persistent labels and short IDs plus an accessible full-ID panel;
- persistent dirty-worktree badge and committed-HEAD warning;
- deterministic compacted changed-file tree;
- first changed entry selected initially;
- read-only metadata/availability pane;
- explicit unsupported, empty-comparison, post-session error, and expired/shutdown states.

Do not instantiate Monaco or request text content in Phase 1. Plain Composition API/local state is the research recommendation; it is not yet an established repository convention.

## Shared Cross-Cutting Patterns to Establish

Because no local pattern exists, the first implementing plan should deliberately establish these once and have later plans copy them.

### Authority flow

```text
CLI source identity
  -> full immutable base/head OIDs
  -> exactly one immutable merge-base OID
  -> raw Git metadata/object IDs
  -> frozen session and opaque capabilities
  -> narrow read-only API DTOs
  -> browser presentation
```

Moving refs, dirty worktree bytes, browser-provided paths/OIDs, filesystem reads, textconv, and external diff drivers must never re-enter this authority flow.

### Error ownership

| Failure timing | Owner | Presentation |
|---|---|---|
| Before a valid session | CLI/domain | actionable typed terminal error; preserve recoverable selection |
| After session start | Browser plus terminal | concise recovery in browser; detailed correlated terminal diagnostic |
| Security denial | Security hook | non-leaking browser response; actionable terminal cause |
| No changes | Successful session | deliberate identity-bearing empty state, never an error |
| Unsupported file | Inventory/UI | retained row and specific reason, never silently omitted |

No existing `AppError`, result type, logger, or response envelope exists. The planner must define the smallest taxonomy needed by these observable distinctions instead of claiming to reuse one.

### Validation ownership

- Git protocol parsers validate bytes and record grammar.
- Domain constructors validate invariants such as full OID/cardinality and raw-numstat joins.
- Zod validates strict JSON boundaries.
- Fastify security hooks authorize requests before routes.
- Vue treats validated API DTOs as immutable session data.

### Test ownership

There is no existing test style. Establish behavior-first seams using:

- pure Vitest tests for NUL parsers, byte paths, joins, availability precedence, tree compaction/order, schemas, and token-gate helpers;
- isolated real-Git fixtures for Git facts and unusual filenames;
- Fastify `inject` plus a focused socket check for API/security behavior;
- packaged Playwright flows for the static Vue application served by Fastify;
- injected prompt/opener ports only at orchestration edges, while retaining real domain behavior.

Tests should defend observable contracts and plausible regressions: line-based parsing, display-as-identity, moving-ref reuse, worktree filesystem reads, missing `merge-base --all`, permissive Host/Origin checks, arbitrary request authority, open-before-bind, and non-idempotent shutdown.

## Project-Level Stack Constraints vs. Code Conventions

| Area | Project-level constraint/recommendation | Actual code convention today |
|---|---|---|
| Runtime | Node 24, native Git CLI | None |
| Package shape | One ESM npm package | None |
| CLI | Commander and `@inquirer/search` | None |
| Server | Fastify 5 and `@fastify/static` | None |
| Contracts | Zod strict schemas with inferred types | None |
| Browser | Vue 3 + Vite | None |
| Tests | Vitest + Playwright | None |
| Imports | TypeScript ESM expected | No alias, extension, barrel, or ordering convention exists |
| Errors/logging | Typed domain distinctions and non-leaking browser errors required | No error base class, result wrapper, logger, or formatter exists |
| State | Immutable process session and plain Vue local state recommended | No store convention exists |
| Styling | Planner discretion within locked UX | No CSS/design-system convention exists |
| Versions | Research records observed versions and human-verification checkpoints for recent releases | No manifest pins any version |

The planner must treat package-version freshness checkpoints in research as installation gates. This pattern map does not approve or install packages.

## No Analog Found

| Module family | Why no analog exists | Planner fallback |
|---|---|---|
| Config/build | No manifest or config files | Apply locked stack and keep one-package build |
| CLI/picker | No CLI source | Use research lifecycle and Inquirer API guidance |
| Git services/parsers | No source or fixture helpers | Use native Git machine protocols and byte-first design |
| Domain/contracts | No models or schemas | Establish exact-path, pinned-identity, availability, and strict DTO contracts |
| Server/security | No Fastify application | Establish factory/hooks/capability routes from the security boundary |
| Vue workspace | No browser source | Build a projection of immutable session metadata only |
| Tests | No tests/configuration | Establish focused behavior layers described above |

## Planner Guardrails

1. Do not cite any proposed path in this document as an “existing analog.”
2. Do not fabricate imports or line-number excerpts from future files.
3. Keep the initial implementation modular, but do not introduce a monorepo, repository abstraction, state library, router, database, CORS plugin, Git library, tree widget, or Monaco wrapper.
4. Add only files that serve Phase-1 behavior; named component files may be consolidated if the plan preserves clear ownership and testability.
5. Keep Monaco/text-diff, comments, drafts, selector drift, export, and persistence out of Phase 1.
6. Prefer a clean one-way authority graph over convenience APIs that accept arbitrary refs, objects, or paths.

## Metadata

**Analog search scope:** repository root, targeted at `src/**`, `tests/**`, and expected root package/build/test configuration files  
**Implementation files scanned:** 0 (none exist)  
**Planning sources read:** `01-CONTEXT.md`, `01-RESEARCH.md`  
**Pattern extraction date:** 2026-07-11
