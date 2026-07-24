# Walking Skeleton — Diff Review

**Phase:** 1
**Generated:** 2026-07-11
**Synchronized:** 2026-07-12 against verified `01-UI-SPEC.md`

## Phase Goal

**As a** developer working in a local Git repository, **I want to** choose an ordered base and head and open their pinned PR-style changed-file inventory in my browser, **so that** I can verify committed local changes without publishing branches or reading dirty worktree bytes.

## Capability Proven End-to-End

A developer launches the generated CLI from a nested directory in a real non-bare worktree, explicitly chooses an ordered base and head from local branches or registered worktrees, confirms immutable identities, and inspects the native-Git merge-base-to-head changed-file inventory in a token-protected Vue page served by Fastify on an OS-assigned IPv4-loopback port.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Runtime/package | One Node.js 24 ESM TypeScript npm package | CLI, Git adapter, server, shared Zod contracts, production Vue assets, and generated bin ship through one auditable release boundary. |
| Git authority | Installed Git CLI via `spawn('git', args)` with `shell:false`, bounded byte streams, cancellation, and option separators | Native Git remains authoritative for repositories, worktrees, refs, merge bases, statuses, renames/copies, modes, counts, and objects; no JavaScript Git semantics or shell interpolation is introduced. |
| Minimum Git policy | Git 2.43.0 or newer plus positive capability probes for every machine protocol used | Unsupported machines fail before selection with actionable guidance; no line-oriented or semantically weaker fallback is allowed. |
| Repository discovery | Canonical non-bare worktree root resolved from any nested cwd | One CLI process owns one repository and one comparison. |
| Source selection | One Inquirer searchable picker used base first then head, grouped into Local branches and Worktrees | Source identity remains distinct from commit identity; base is explicit, only current checkout may be suggested as head, and same-OID rows remain truthful. |
| Candidate availability | Every registered worktree remains represented; inaccessible/prunable entries are disabled with an exact reason | Missing inspection data is never mislabeled clean or silently omitted. |
| Comparison identity | Resolve full base/head commit IDs, reject equality, require exactly one `merge-base --all` result, verify objects, then freeze | The session never follows moving refs and never substitutes an ambiguous or unavailable object. |
| Changed-file inventory | Separate NUL-delimited raw and numstat Git protocols joined by exact byte path identity | Add/modify/delete/rename/copy/mode/type facts and available counts match Git without path corruption. |
| Path model | Preserve base64url path bytes, optional strict UTF-8, control-safe display, and opaque file IDs separately | Spaces, Unicode, tabs, newlines, leading dashes, invalid UTF-8, display collisions, and old→new pairs cannot become confused authority. |
| Content access | Raw diff blob IDs and `cat-file`; type/size before bytes; 1 MiB per-side inline-text ceiling | Dirty worktree bytes, moving refs, filters, textconv, external diff, symlink following, and repository code never enter comparison data. |
| Availability taxonomy | `text`; `unsupported: binary`, `non-utf8`, `oversized`, `submodule`, `symlink`, `mode-or-type`; `unavailable: missing-object` | Every changed record remains visible with one precise reason; no fallback broadens authority. |
| Local API | Fastify 5 bound only to `127.0.0.1:0`, serving production Vite assets and two read-only capability routes | No LAN listener, daemon, general-purpose Git API, mutation route, or blob-text route exists in Phase 1. |
| Browser security | Random 256-bit-or-stronger process token in URL fragment, immediate fragment removal, memory-only bearer, exact Host and unexpected-Origin rejection, no CORS, strict headers, opaque launch-scoped file IDs | Public origins cannot use the loopback service to select or read arbitrary repository, ref, object, path, or destination data. |
| Browser UI | Vue 3 Composition API with local state and local components/CSS tokens; no router, global store, component registry, icon library, tree package, or Monaco wrapper | The browser is a projection of one immutable session and implements the verified `01-UI-SPEC.md` without a parallel design system. |
| Persistence | None in Phase 1 | The phase is read-only toward the reviewed repository; drafts and exports belong to later phases. |
| Lifecycle | Bind, print actual URL and Ctrl+C guidance, attempt browser open, then await an idempotent SIGINT/SIGTERM shutdown that aborts children and closes Fastify | Opener failure remains recoverable and terminal interrupt cannot leave server or accepted-write work incomplete. |
| Local deployment | Generated executable plus production-built Vite assets served by the CLI | Focused packaged Playwright runs exercise the release shape rather than a dev proxy or TypeScript source entry. |

## Verified Browser UI Contract

Phase 1 UI implementation must read `.planning/phases/01-pinned-local-comparison/01-UI-SPEC.md` directly. The following points are architectural constraints, not a substitute for that file:

- Dense dark developer-tool language using the exact neutral, accent, semantic status, typography, spacing, focus, target-size, and contrast tokens defined by the UI spec.
- One persistent h1 with ordered safe labels/short IDs, visible pin state, dirty badges, and an always-reachable Comparison identities disclosure.
- Full base, head, and merge-base IDs never truncate in the identity panel and have specifically named adjacent copy actions; worktree paths and dirty warnings remain attached to the relevant endpoint.
- Wide/medium layout uses an independently scrolling file-tree rail plus primary metadata pane. Narrow layout uses the exact accessible Files/Details tab contract and modal identity sheet with focus containment/restoration.
- The deterministic file tree exposes status text, safe path, available counts, unsupported/unavailable text, complete rename/copy semantics, opaque-ID selection, and the specified keyboard/focus behavior.
- The metadata pane exposes exact path or base64url path bytes, modes, counts, and availability reasons. Supported text remains metadata-only in Phase 1.
- Loading, zero-change success, retryable file-detail failure, security denial, stopped/expired session, copy success/failure, and every unsupported/unavailable reason use the exact UI-spec copy and state hierarchy.
- WCAG 2.2 AA keyboard, focus, names/roles/states, announcements, 320px reflow, 200% zoom, text spacing, reduced motion, and non-overlapping 40×40 semantic targets are required.
- No Monaco instance, blob text, diff hunks, comments, drafts, drift detection, export, source mutation, browser repository/ref switching, or browser shutdown control is present.

## Authority Flow Contract

```text
launch cwd
  → native Git repository and candidate discovery
  → explicit ordered base then head source identities
  → full immutable base/head commit IDs
  → exactly one immutable merge-base commit ID
  → raw Git metadata, modes, object IDs, counts, and exact path bytes
  → bounded immutable-object availability classification
  → frozen session plus opaque file capability registry and process token
  → Fastify on 127.0.0.1:OS-assigned-port
  → strict token/Host/Origin/capability API
  → production Vue validated immutable projection
```

Moving refs, dirty worktree files, request-provided repositories/refs/object IDs/paths/options/export paths, filesystem fallbacks, external diff drivers, textconv, filters, symlink traversal, and repository code execution never re-enter this flow.

## Stack Touched in Phase 1

- [x] Project scaffold — one ESM package, TypeScript/Vite builds, focused Vitest/Playwright commands, generated executable.
- [x] Routing — production static assets and narrow read-only loopback capability routes.
- [x] Git read path — discovery, committed comparison, exact inventory, immutable object classification.
- [x] UI — interactive changed-file selection and metadata/availability presentation wired to the secure API.
- [x] Local deployment — generated bin serving production assets with a tested full-stack run command.
- [x] Persistence decision — explicitly none; no database/read-write requirement applies to this local read-only product phase.

## Dependency-Ordered Walking-Skeleton Sequence

1. `01-01` audits every exact package release and proves the generated bin plus mounted minimal production Vue asset; `01-03` extends that same entry with the frozen loopback session.
2. `01-02` adds the native-Git repository and immutable pinned-comparison core.
3. `01-03` closes the first end-to-end path through ephemeral IPv4 loopback, production Vue, browser opening, and idempotent shutdown.
4. `01-04`–`01-08` expand selection, validation, inventory, availability, and API security in dependency order.
5. `01-09` proves the pure tree model; `01-10` renders it as the packaged DIFF-01 slice.
6. `01-11`, `01-12`, and `01-13` sequentially add identity/session, metadata/availability, then responsive/accessibility behavior because they share `App.vue` and styles. `01-13` ends with a test-only packaged acceptance task.

## Plan and Requirement Ownership

Each Phase 1 requirement appears in exactly one plan frontmatter entry:

| Plan | Vertical capability added | Requirement ownership |
|---|---|---|
| 01-01 | Audited package/build/generated-bin and minimal production-asset smoke | Supporting unit; no requirement ownership |
| 01-02 | Native-Git repository discovery and immutable pinned-comparison core | SEL-01, SEL-05, CMP-01, CMP-02, CMP-06 |
| 01-03 | Frozen comparison → ephemeral loopback → production Vue lifecycle | SEL-08, SAFE-01, SAFE-05 |
| 01-04 | Truthful branch/worktree discovery and searchable ordered picker | SEL-03, SEL-04, SEL-07 |
| 01-05 | Pre-session repository, endpoint, equality, graph, and object validation/recovery | SEL-02, SEL-06, CMP-03 |
| 01-06 | Byte-exact statuses, modes, renames/copies, counts, and unusual paths | CMP-04, CMP-05, CMP-07 |
| 01-07 | Immutable object availability and precise unsupported reasons | CMP-09 |
| 01-08 | Token/origin/host and opaque capability API closure | SAFE-02, SAFE-03 |
| 01-09 | Deterministic tree projection and navigation model | Supporting unit; no requirement ownership |
| 01-10 | Accessible packaged changed-file tree navigation | DIFF-01 |
| 01-11 | Persistent identities, session states, and zero-change success | CMP-08 |
| 01-12 | Metadata, exact paths/copy, and unsupported/unavailable placeholders | DIFF-06 |
| 01-13 | Responsive/accessibility completion and final packaged acceptance | Supporting unit; no requirement ownership |

## Focused Verification Contract

- Pure Vitest: NUL protocol parsers, exact paths, joins, availability precedence/bounds, tree order/compaction, strict schemas, security helpers.
- Real-Git Vitest: discovery, dirty state, endpoint resolution, merge-base cardinality, statuses/modes/blobs/counts, unusual paths, no-change, missing objects.
- Fastify inject/socket Vitest: actual loopback bind, exact token/Host/Origin behavior, strict routes, opaque IDs, security headers, generic denials, zero handler/object work.
- Packaged Playwright: generated bin, production Vite assets, verified Chromium, all four branch/worktree orders, identity/tree/metadata/unsupported/empty/error/responsive states, immutable dirty exclusion, security denials, shutdown.
- Focused commands only; no formatter, linter, or project-wide suite is part of Phase 1 execution.

## Out of Scope (Deferred to Later Slices)

- Phase 2: Monaco text rendering, syntax highlighting, hunk/context navigation, line comments, stable anchors, comparison-specific draft resume.
- Phase 3: full comment lifecycle, summary, concurrency, corrupt-draft recovery, active selector-drift detection.
- Phase 4: canonical JSON/Markdown export, `.diff-review/` persistence/export management, hashes and agent instructions.
- Outside v1: accounts, remote hosting/forge integration, dirty-byte review, direct tree-to-tree comparison, repository code execution, background daemon, rich/binary rendering.
- Product architecture: database, ORM, migrations, and schema push are not used.

## Subsequent Slice Plan

- Phase 2 adds immutable text blobs in side-by-side Monaco and one durable side-specific line comment that resumes on the same pinned comparison.
- Phase 3 completes and safely maintains the review draft, including comment lifecycle, summary, concurrency, corrupt-state recovery, and selector drift.
- Phase 4 produces deterministic canonical JSON plus derived Markdown without mutating source control.
