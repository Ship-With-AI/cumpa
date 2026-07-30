# Architecture Research

**Domain:** Staged local-source discovery in the existing TypeScript/Node CLI and native-Git adapter
**Researched:** 2026-07-30
**Confidence:** HIGH for repository integration and measured Git behavior; MEDIUM for external library documentation

## Recommendation

Integrate v1.2 as a clean split of the existing `src/git/candidates.ts` authority, not as a second catalog, index, or service. One discovery session should expose:

1. an eager immutable snapshot containing the current branch and registered worktrees; and
2. an abortable `searchBranches(term, signal)` function that materializes matching local branches only for a non-empty query.

`src/cli/run.ts` continues to own the selection/recovery loop. `src/cli/picker.ts` continues to own ordered Base-then-Head interaction and row construction. `src/git/candidates.ts` continues to own every Git command, parser, candidate identity, availability classification, and abbreviation. `src/git/runner.ts` remains the only subprocess boundary. Comparison pinning, confirmation, server launch, and all post-picker behavior remain unchanged.

This is a refactor of one existing path, not a new subsystem. No dependency, daemon, persistent index, ref mutation, recency store, background watcher, or alternate Git implementation is warranted.

## Standard Architecture

### System Overview

```text
Process start
    │
    ▼
Commander / run()                                  EXISTING
    │
    ▼
runCli selection + recovery loop                   MODIFY
    │ creates one discovery session per attempt
    ▼
createSourceDiscovery() in git/candidates.ts       MODIFY EXISTING AUTHORITY
    ├── discoverGitRepository()                    REUSE
    ├── eager current-branch/worktree snapshot     NEW LOGICAL STAGE
    └── searchBranches(term, signal)               NEW LOGICAL STAGE
              │
              ▼
        GitRunner.run()                            UNCHANGED BOUNDARY
        spawn('git', argument array)
        AbortSignal · timeout · stdout/stderr caps
    │
    ▼
pickOrderedSources() in cli/picker.ts              MODIFY
    ├── initial source(undefined) → eager rows
    ├── source(term) → abortable lazy branch search
    ├── session-local candidate map
    └── Base → Head → Back ordering unchanged
    │
    ▼
createPinnedComparison() → confirmation → launch   UNCHANGED
```

The discovery session is an in-process closure over the already-resolved repository root and the existing `GitRunner`. It prevents repository discovery from being repeated for every keystroke while keeping Git—not cached JavaScript state—as the authority for every request.

### Component Responsibilities

| Component | v1.2 responsibility | Communication |
|-----------|---------------------|---------------|
| `src/cli/run.ts` | Create/recreate a discovery session, pass it to the picker, preserve the ordered selection and existing retry/confirmation loop | Calls candidate discovery, picker, comparison creation, confirmation, launch |
| `src/cli/picker.ts` | Render eager choices immediately; invoke lazy search from `@inquirer/search`'s async `source`; merge/deduplicate rows; retain selected objects by stable ID for the current Base/Head interaction | Receives initial candidates and a search function; returns `OrderedSources` |
| `src/git/candidates.ts` | Sole source-discovery authority: parse worktree/ref protocols, construct `SourceCandidate` values, classify worktree availability, batch abbreviations, filter branch names through Git | Uses `discoverGitRepository()` and `GitRunner` |
| `src/git/repository.ts` | Existing repository root, current `HEAD`, Git version, and protocol support authority | Uses `GitRunner`; returns one canonical repository context |
| `src/git/runner.ts` | Existing safe native-Git process boundary, including argument arrays, abort, timeout, byte limits, disabled hooks/fsmonitor/optional locks | Spawns installed Git only |
| `src/domain/source.ts` | Existing stable branch/worktree candidate and ordered-selection contracts | Shared by Git, picker, CLI, and comparison handoff |
| `src/git/comparison.ts` | Final authority after selection: re-resolve a branch ref or accept the selected committed worktree OID, then pin full identities | Unchanged caller contract from `run.ts` |
| `@inquirer/search` 4.2.1 | Terminal state machine; starts a source request per term and aborts the previous request | Calls the picker source with `{ signal }` |

## Modified Versus New Scope

### Runtime files

| Status | File / component | Required change |
|--------|------------------|-----------------|
| **Modified** | `src/git/candidates.ts` | Replace monolithic eager `discoverSourceCandidates()` with one discovery-session factory containing eager worktree/current-branch discovery and lazy branch search. Reuse its NUL parsing, schemas, labels, IDs, and availability rules. Add private batch-abbreviation and bounded-concurrency helpers only if needed locally. |
| **Modified** | `src/cli/picker.ts` | Allow an async candidate source instead of a fixed complete array; keep `buildSourceSearchItems()`, separators, disabled rows, escaping, Base/Head copy, suggestion, Back, and ordering. Update the session-local ID map only from a non-aborted completed request. |
| **Modified** | `src/cli/run.ts` | Inject/create the discovery session, seed the picker with eager candidates, and recreate discovery after an existing comparison-recovery error. Keep comparison creation and launch sequencing unchanged. |
| **Modified** | `tests/git/candidates.test.ts` | Separate eager-discovery and lazy-search contracts; assert stable IDs, byte-safe protocols, batching, bounded worktree concurrency, cancellation, packed/loose correctness, and no mutation. |
| **Modified** | `tests/cli/selection.test.ts` | Prove the prompt is entered before branch enumeration, async search results remain ordered, selected lazy candidates survive the Base/Head handoff, and stale searches cannot replace current results. |
| **Modified** | `tests/cli/errors.test.ts` | Preserve fatal initial-discovery behavior, worktree recovery, branch recovery, focused-row behavior where the ref still exists, and retained opposite-side selection. |
| **Reused verification** | `.planning/spikes/001-large-repo-startup-baseline/` and `002-staged-source-discovery/` | Keep the process-start-to-picker and packed/loose branch fixtures as the milestone performance proof; production behavior, not the prototype alone, must be measured. |
| **Conditionally modified** | `src/git/repository.ts` | Only if the production picker-ready benchmark still exceeds 400 ms: parallelize its independent machine-protocol probes or remove duplicate work from the same authority. Do not create a second root/HEAD probe in candidate discovery. |

### Explicitly new logical components

These additions belong inside existing modules; no new production file is necessary.

| New logical component | Home | Purpose |
|-----------------------|------|---------|
| `SourceDiscovery` result | `src/git/candidates.ts` | Immutable eager candidates plus an abortable branch-search closure over repository root and runner |
| Eager discovery stage | `src/git/candidates.ts` | Current branch and all registered worktrees without enumerating `refs/heads` |
| Lazy branch-search stage | `src/git/candidates.ts` | At most one filtered branch-list call and one batch-abbreviation call per accepted query |
| Session candidate registry | `src/cli/picker.ts` | Map stable IDs to the materialized candidate objects needed when Inquirer returns an ID; lifespan is one picker interaction only |
| Abortable debounce | `src/cli/picker.ts` | Coalesce fast typing before a Git process starts, using Node's promise timer and Inquirer's request signal; no package or shared scheduler |

### Explicitly unchanged

- `src/domain/source.ts` candidate identities and dirty/unavailable copy
- `src/git/runner.ts` process authority and safety flags
- branch-versus-worktree selection semantics in `selectionForCandidate()`
- `createPinnedComparison()` and all merge-base, inventory, comparison, and drift behavior
- Base-first, Head-second ordering; current-checkout Head suggestion; Back behavior
- dirty-state calculation and “committed HEAD only” meaning
- unavailable registered-worktree rows and disabled selection
- server, browser, contracts, draft persistence, export, and UI

## Recommended Project Structure

```text
src/
├── cli/
│   ├── run.ts             # MODIFY: discovery lifetime + existing recovery loop
│   ├── picker.ts          # MODIFY: async source + transient candidate registry
│   └── confirm.ts         # UNCHANGED
├── git/
│   ├── candidates.ts      # MODIFY: eager stage + lazy search; sole candidate authority
│   ├── repository.ts      # REUSE; optimize in place only if benchmark requires
│   ├── runner.ts          # UNCHANGED safe subprocess boundary
│   └── comparison.ts      # UNCHANGED final pinning authority
└── domain/
    └── source.ts          # UNCHANGED candidate/ordering contracts

tests/
├── cli/
│   ├── selection.test.ts  # MODIFY: staged prompt/search flow
│   └── errors.test.ts     # MODIFY: recovery across lazy candidates
└── git/
    └── candidates.test.ts # MODIFY: Git protocols, batch counts, cancellation
```

### Structure Rationale

- **Do not add `discovery/`, a repository service, or a cache module.** Candidate construction already has one clear home and one implementation.
- **Keep async terminal concerns in `picker.ts`.** Debounce, current query, separators, default focus, and request cancellation are prompt behavior; Git syntax and parsing are not.
- **Keep repository facts out of the picker.** The picker receives candidate values and a function. It never receives a repository path, ref namespace, or command arguments.
- **Keep the runner generic.** Its existing `input`, `signal`, timeout, and per-call byte-cap options already support batching and cancellation.

## Architectural Patterns

### Pattern 1: One Discovery Session, Two Stages

**What:** Resolve the repository once, eagerly materialize only current branch/worktrees, and return a closure for later branch searches.

```typescript
interface SourceDiscovery {
  readonly initialCandidates: readonly SourceCandidate[];
  readonly searchBranches: (
    term: string,
    options: { readonly signal: AbortSignal },
  ) => Promise<readonly BranchCandidate[]>;
}

const discovery = await createSourceDiscovery({ cwd });
const selected = await pickOrderedSources({ discovery });
```

**Why:** This is the smallest cut through the current eager pipeline. Repository/root/runner state is shared without making the CLI or picker a Git authority. A new discovery session is created only when the existing recovery loop intentionally refreshes repository state.

**Trade-off:** Initial candidates are a snapshot. That is already true today. Branch refs are authoritatively re-resolved by comparison creation, and worktree selections remain pinned to the committed OID shown to the user.

### Pattern 2: Inquirer Owns Request Supersession

`@inquirer/search` 4.2.1 creates an `AbortController` for each `searchTerm`, aborts it when the term changes, passes the signal to `source`, and ignores results after abortion. Use that contract directly; do not add a parallel global generation manager.

The picker source should:

1. return eager rows without Git branch enumeration for `undefined` or empty input;
2. await a short abortable debounce before spawning Git;
3. pass the same signal through every `GitRunner.run()` call;
4. call `signal.throwIfAborted()` after each await and before updating the candidate map;
5. rethrow aborts so obsolete work disappears silently;
6. convert a non-abort search failure into an explicit non-selectable row while retaining matching eager choices.

The last rule matters because the installed search implementation records a source error but leaves its status as `loading`; letting routine search failures escape can strand navigation until the term changes. Initial discovery remains a fatal boundary, but an individual interactive search is retryable and must not discard the already-usable eager picker.

Node 24's `node:timers/promises` `setTimeout(delay, value, { signal })` supplies the debounce without a dependency. The debounce duration is a measured constant, not user configuration or persisted state. It must leave enough of the 500 ms packed-ref budget for Git and rendering.

### Pattern 3: Git-Side Name Filtering, Then Batch Enrichment

For a non-empty branch-name query:

```text
query
  ↓ escape Git wildcard metacharacters
one git branch --list --ignore-case --sort=refname
  --format=<existing NUL-safe ref/label/full-OID format>
  "*<escaped term>*"
  ↓ parse + exact in-memory substring guard
unique full OIDs
  ↓ if non-empty only
one git log --no-walk=unsorted --abbrev=12
  --format=%H%x00%h%x00 --stdin
  ↓
BranchCandidate[] with existing IDs, labels, ref names, OIDs
```

Why both steps:

- `git branch --list` makes Git filter refs before output, which is fast for packed refs and stays correct, though slower, for loose refs.
- `--sort=refname` prevents user `branch.sort` configuration from changing the validated branch ordering.
- the existing NUL-safe parser avoids human-oriented decoration and preserves the current byte-safe protocol style.
- one `git log --stdin` call asks Git to authoritatively abbreviate every distinct matching OID; JavaScript must not invent short hashes.
- deduplicating OIDs before abbreviation retains duplicate-ref identities while avoiding duplicate work.
- skipping the `git log` call for zero matches avoids Git interpreting an empty revision set unexpectedly.

The lazy Git filter is branch-name/ref discovery. Materialized eager/worktree rows can still use the existing in-memory identifying-field match. Do not silently fall back to enumerating every branch merely to preserve searches for generic type words or arbitrary OID substrings; that would defeat staged discovery. If those terms are retained as a formal product contract, implement a separate bounded hex-query path (`rev-parse` plus `branch --points-at`) and benchmark it rather than restoring full enumeration.

### Pattern 4: Bounded Worktree Inspection

`git worktree list --porcelain -z` already provides path, full `HEAD`, branch ref, detached/prunable/bare state. Reuse it as the initial inventory. For each usable registered worktree, a status command still needs that worktree's `cwd`; this cannot be collapsed into one repository-root command.

Use a small fixed worker pool for those per-worktree status calls instead of the current serial loop or unbounded `Promise.all`. The status result retains the existing `clean`/`dirty` classification; failure retains the existing `unavailable` downgrade unless the shared signal is aborted. Batch all valid worktree/current-branch OID abbreviations into one Git call after inspection.

Do not add a second `rev-parse HEAD` per worktree unless a correctness fixture proves `worktree list` insufficient. The listed full OID is already the committed snapshot presented by this discovery stage; comparison creation remains the final authority.

### Pattern 5: Stable Identity, Fresh Authority

The picker registry is only a lookup from the stable existing IDs (`branch:<full-ref>` and `worktree:<path>`) to candidate objects materialized during the current prompt. It is not an index:

- no disk writes;
- no ordering or recency metadata;
- no reuse across CLI launches;
- no promise/result cache required for correctness;
- no ref resolution after selection.

When a selected branch moves or disappears before pinning, `createPinnedComparison()` detects it through the existing native-Git path. `runCli` recreates discovery and re-enters the existing role-specific recovery flow. For a failed lazy branch, seed recovery with its branch label so the fresh async source can find and focus the same stable ID if it still exists; if it does not, keep the opposite selection and show the normal no-match state. Worktree recovery continues to use the refreshed eager worktree inventory.

## Data Flow

### Process Start to Initial Picker

```text
1. Node loads the packaged CLI and Commander dispatches runCli({ cwd }).
2. runCli calls createSourceDiscovery({ cwd }).
3. candidates.ts calls discoverGitRepository(cwd, runner):
     supported Git → canonical real repository root → committed HEAD → protocol support.
4. candidates.ts runs worktree list --porcelain -z once.
5. It identifies the record whose path equals repository.root.
6. It constructs the current branch candidate from that record's branchRef + HEAD,
   when attached, without listing refs/heads.
7. It inspects registered worktree status with bounded concurrency.
8. It abbreviates distinct initial OIDs in one batch and freezes candidates.
9. runCli calls pickOrderedSources with the eager candidates and search closure.
10. @inquirer/search invokes source(undefined).
11. picker.ts builds the existing Local branches then Worktrees groups synchronously.
12. The user can navigate/select; full branch enumeration has not run.
```

The current checkout worktree remains the suggested Head. The attached current branch is a distinct branch row, preserving the existing branch/worktree identity distinction even when both point to the same commit.

### Search Request

```text
User types term N
    ↓
@inquirer/search aborts request N-1 and calls source(term N, { signal N })
    ↓
abortable debounce
    ↓ (still current)
searchBranches(term N, signal N)
    ├── Git branch filter (one process)
    └── Git batch abbreviation (zero or one process)
    ↓
signal N checked again
    ↓
merge branch matches with matching eager candidates by stable ID
    ↓
update session candidate map
    ↓
buildSourceSearchItems() preserves branch group → worktree group → Back
    ↓
Inquirer renders results
```

Clearing the term aborts in-flight Git and immediately returns the eager set. A later query performs a fresh native-Git lookup; there is no persistent or recency state.

### Selection, Pinning, and Recovery

```text
Base ID selected → candidate object retained locally
    ↓
Head prompt uses same discovery session and stable-ID registry
    ↓
Head ID selected → OrderedSources returned
    ↓
selectionForCandidate()
    ├── branch: pass full ref name for authoritative re-resolution
    └── worktree: pass displayed committed OID
    ↓
createPinnedComparison()                     UNCHANGED
    ├── success → confirm → launch
    └── LaunchError with picker recovery
          ↓
       recreate SourceDiscovery
       retain opposite side as today
       refresh/focus failed stable ID if it still exists
       re-enter picker
```

## Cancellation, Race, and Error Boundaries

| Boundary | Owner | Required behavior |
|----------|-------|-------------------|
| Invalid directory, missing/old Git, bare/empty repository, unsupported machine protocol | `discoverGitRepository()` / `runCli` | Preserve existing fatal `LaunchError` copy, exit status, and no picker |
| Ctrl+C or superseded term before spawn | Inquirer signal + picker debounce | No Git process starts; abort is not rendered as an error |
| Superseded term during Git | `GitRunner` | Abort child process through the existing spawn signal; reject as `GitRunnerError('aborted')` |
| Old request completes near a new keystroke | Inquirer + picker | Inquirer ignores aborted results; picker checks the signal before mutating its ID map, so old data cannot replace the current row objects |
| One registered worktree cannot be read | `candidates.ts` | Preserve disabled unavailable row and exact reason; do not fail all eager discovery unless the shared operation was aborted |
| Search Git exit/timeout/output-cap failure | Picker source | Keep eager rows usable and show one non-selectable retryable search-error row; do not continue with partial branch results |
| Branch changes between list and abbreviation | `candidates.ts` | Treat missing batch output as a failed request, never fabricate or partially label identities |
| Branch moves/deletes after rendering | `createPinnedComparison()` + `runCli` | Existing authoritative re-resolution and role-specific recovery; never trust displayed search data as final pinning authority |
| Loose-ref search exceeds 500 ms | Git filesystem behavior | Continue to the correct result within the normal runner timeout; the 500 ms target is not a cancellation deadline |
| Broad result exceeds configured byte cap | `GitRunner` + picker | Explicit retryable search error, not truncation; choose a per-call cap that accommodates the 10,000-ref broad fixture |

## Native-Git Call Plan

| Stage | Calls | Boundedness / batching | Mutation |
|-------|-------|------------------------|----------|
| Repository discovery | Existing `discoverGitRepository()` sequence | Once per selection/recovery attempt; optimize inside this module only if the 400 ms production measurement requires it | Read-only |
| Initial inventory | One `worktree list --porcelain -z` | Output byte-capped and parsed with existing protocol | Read-only |
| Initial worktree state | One `status --porcelain=v1 -z --untracked-files=normal` per usable worktree | Fixed concurrency pool; no serial chain and no unbounded fan-out | Read-only; runner disables optional locks |
| Initial abbreviations | One `log --no-walk=unsorted ... --stdin` for distinct valid OIDs | One batch; omit when empty | Read-only |
| Each accepted non-empty search | One filtered `branch --list ... --format=...` | Git filters by name; explicit sort and per-call stdout cap | Read-only |
| Search abbreviations | Zero or one batched `log --no-walk=unsorted ... --stdin` | Unique OIDs; omit for zero matches | Read-only |

Never call `pack-refs`, `update-ref`, `branch` mutation forms, `checkout`, `switch`, `gc`, or maintenance commands. `git pack-refs` remains fixture setup only. The tested loose-ref penalty is an accepted filesystem cost, not a reason to alter the user's repository.

## Scaling Considerations

| Repository shape | Architecture behavior | Expected constraint |
|------------------|-----------------------|---------------------|
| Typical repository | Eager worktree/current-branch stage dominates; search uses two short-lived Git calls | Picker must be usable within 400 ms |
| 10,000 packed local refs | Initial cost does not scale with branch count; filtered search and batch abbreviation remain constant-process | Spike measured 20.4 ms for 100 matches and 63.8 ms for 9,999 matches; production must prove results render within 500 ms |
| 10,000 loose local refs | Same correct commands and result semantics | Git must read thousands of loose files; spike measured about 798.5 ms. Do not time out at 500 ms, mutate refs, or add an index |
| Many registered worktrees | Initial work scales with worktree count, not branch count | Fixed worker pool prevents process explosion; 32-worktree spike met picker budget, but production batching must retain dirty/unavailable semantics |
| Very broad/long branch names | O(n) parse, normalization, candidate-map update, and Inquirer choice normalization | Rendering and the runner's 1 MiB default can become the next bottlenecks; set explicit measured caps, do not truncate |

### Scaling Priorities

1. **First bottleneck:** serial per-branch abbreviation. Remove it completely through lazy filtering plus one batch call.
2. **Second bottleneck:** fixed repository/protocol and worktree inspection before the prompt. Reuse one repository context, bound worktree concurrency, and optimize existing probes in place only if production process-start timing misses 400 ms.
3. **Accepted ceiling:** loose refs. Correctness wins over the packed-ref latency target because persistent indexing and repository mutation are explicitly out of scope.

## Anti-Patterns

### Eagerly Start Full Discovery “in the Background”

**Why wrong:** It still consumes Git/filesystem work, creates races with search, and can delay terminal rendering or contend with the query that matters.

**Instead:** Do not enumerate local branches until a non-empty source request arrives.

### Keep a Second JavaScript Branch Catalog

**Why wrong:** A preload, recency list, filesystem scan, or persisted index can drift from Git and introduces invalidation and mutation semantics.

**Instead:** Run a fresh filtered native-Git query per accepted term; retain only prompt-session candidate objects needed for selection.

### Per-Branch `rev-parse --short`

**Why wrong:** The baseline grows from 21 Git processes at one branch to 10,020 at 10,000 branches and roughly 96 seconds before the picker.

**Instead:** Send unique OIDs to one Git process and parse a NUL-safe full-to-short map.

### Unbounded `Promise.all` for Worktrees

**Why wrong:** It passes small fixtures but creates process bursts as registered worktrees grow.

**Instead:** A private fixed-concurrency loop in `candidates.ts`; no general job-queue abstraction.

### Treat 500 ms as a Hard Search Timeout

**Why wrong:** It would make loose-ref repositories incorrect even though correctness is explicitly required.

**Instead:** Measure and report the packed-ref budget; let loose-ref requests finish or be superseded by user input under the normal runner timeout.

### Let the Picker Resolve Git Identities

**Why wrong:** It duplicates parsing and makes terminal state an authority for refs and OIDs.

**Instead:** The picker handles terms, rows, and IDs only. `candidates.ts` returns complete candidates; `comparison.ts` performs the final pin.

### Reject Search Errors Directly into Inquirer

**Why wrong:** In installed 4.2.1, the prompt records the error while remaining in loading state, which can leave navigation disabled.

**Instead:** Propagate aborts, but translate ordinary search failures into an explicit disabled row while keeping eager choices selectable.

## Dependency-Aware Build Order

1. **Extract batch primitives inside `candidates.ts`.** Reuse the existing NUL parser and `GitObjectIdSchema`; add batch abbreviation, escaped branch pattern, and bounded worktree mapping. Prove duplicate OIDs, SHA-1/SHA-256-compatible parsing, empty input, missing output, abort, and byte limits before changing the CLI.
2. **Split eager discovery from search.** Build `createSourceDiscovery()` using the existing repository and runner boundaries. Preserve current branch/worktree IDs, labels, status, unavailable behavior, and current-checkout detection. At this point initial discovery must contain no full branch-list command.
3. **Implement filtered lazy search.** Add explicit ref ordering, NUL-safe format, exact post-filter guard, unique-OID batch abbreviation, and no-match fast path. Verify packed and loose refs return the same correct matches; only latency differs.
4. **Adapt `picker.ts` to async data.** Make `sourceForPrompt` async, add abortable debounce and the transient ID registry, then preserve group/action construction through `buildSourceSearchItems()`. Prove empty input never calls branch search and stale requests cannot update selectable state.
5. **Wire `run.ts` and recovery.** Replace complete-array injection with discovery-session injection, keep the Base/Head loop, and refresh lazy branch focus through the new search path after pinning failures. Do not touch comparison creation or launch code.
6. **Run production-path performance verification.** Measure from child-process start through actual initial prompt usability, then from input through rendered packed-ref results using the existing 10,000-branch fixture. Also verify broad results, 32 worktrees, process counts, and loose-ref correctness.
7. **Optimize only the measured remaining fixed cost.** If picker readiness still misses 400 ms, parallelize independent work in `repository.ts` or remove duplicate calls there. Do not add caching, persistence, mutation, or a parallel repository-discovery implementation.

This order keeps every intermediate change behind an existing boundary: Git behavior first, terminal integration second, orchestration/recovery third, performance tuning last.

## Integration Points

### External Boundaries

| Boundary | Integration pattern | Notes |
|----------|---------------------|-------|
| Installed Git CLI (minimum already enforced by `repository.ts`) | `GitRunner.run(argumentArray, { cwd, input, signal, limits })` | Sole repository authority; shell disabled; no optional locks/hooks/fsmonitor; NUL-safe output |
| `@inquirer/search` 4.2.1 | Async `source(term, { signal })` | No internal debounce; prior term is aborted; late results ignored; picker must handle non-abort errors without stranding loading state |
| Node.js 24 | `AbortSignal`, child-process cancellation, `node:timers/promises` | Enough for cancellation/debounce; no new package |

### Internal Boundaries

| Boundary | Communication | Invariant |
|----------|---------------|-----------|
| `run.ts` ↔ `candidates.ts` | Direct async factory/function calls | One fresh discovery session per selection attempt/recovery |
| `run.ts` ↔ `picker.ts` | Initial candidates + search function in, `OrderedSources` out | Picker ordering and opposite-side retention remain unchanged |
| `picker.ts` ↔ `candidates.ts` | Abortable branch query | Picker never knows Git command syntax or repository root |
| `candidates.ts` ↔ `runner.ts` | Argument arrays, byte input/output, `AbortSignal` | No shell, no mutation, bounded subprocess I/O |
| `run.ts` ↔ `comparison.ts` | Existing `ComparisonSelection` handoff | Search-time OIDs are display facts; comparison creation is final branch authority |

## Sources

### Repository and milestone evidence — HIGH confidence

- `.planning/PROJECT.md` — v1.2 goal, active requirements, unchanged native-Git and ordered-picker constraints.
- `.planning/notes/cli-startup-discovery.md` — measured pre-prompt process count and staged-discovery decision.
- `.planning/spikes/001-large-repo-startup-baseline/README.md` — production eager path: 364.0 ms/21 processes at one branch and 96,109.6 ms/10,020 processes at 10,000 distinct branch heads.
- `.planning/spikes/002-staged-source-discovery/README.md` and `benchmark.mjs` — chosen filtered-branch plus batched-abbreviation approach; packed, loose, broad-query, and 32-worktree measurements.
- `src/git/candidates.ts` — current monolithic discovery, byte-safe parsers, stable candidate construction, serial abbreviation, and worktree state behavior.
- `src/git/repository.ts` and `src/git/runner.ts` — repository/protocol authority and abortable bounded subprocess implementation.
- `src/cli/picker.ts` and `src/cli/run.ts` — current prompt source, static candidate map, Base/Head flow, comparison handoff, and recovery loop.
- `tests/git/candidates.test.ts`, `tests/cli/selection.test.ts`, and `tests/cli/errors.test.ts` — validated identity, row ordering, dirty/unavailable behavior, and recovery contracts.
- Installed `node_modules/@inquirer/search/dist/index.js` 4.2.1 — exact request-abort, late-result, and error/loading behavior used by this milestone.

### Official documentation — MEDIUM confidence through the research confidence seam

- [Inquirer search prompt README](https://github.com/SBoudrias/Inquirer.js/blob/main/packages/search/README.md) — async source signature, request `AbortSignal`, and manual debounce example.
- [Git branch documentation](https://git-scm.com/docs/git-branch) — `--list` wildcard filtering, multiple patterns, `--ignore-case`, and ref-filter `--format`; documentation last updated in Git 2.51.0.
- [Git log documentation](https://git-scm.com/docs/git-log) — `--stdin` revision input and `--no-walk=unsorted` behavior; documentation current through Git 2.55.0.
- [Node.js 24 timers documentation](https://nodejs.org/docs/latest-v24.x/api/timers.html#timerspromisessettimeoutdelay-value-options) — abortable promise timers for dependency-free debounce.

---
*Architecture research for: Compare v1.2 Fast Source Discovery*
*Researched: 2026-07-30*
