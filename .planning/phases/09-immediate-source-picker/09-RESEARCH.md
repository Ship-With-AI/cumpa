# Phase 09: Immediate Source Picker - Research

**Researched:** 2026-07-30
**Domain:** Staged native-Git source discovery and asynchronous terminal selection
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Users can begin ordered source selection from the attached current branch and registered worktrees without waiting for remaining local branches to be enumerated.

### Claude's Discretion

All implementation choices are at Claude's discretion — discuss phase was skipped per user setting. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

### Deferred Ideas (OUT OF SCOPE)

None — discuss phase skipped.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PICK-01 | User can interact with the ordered source picker before Compare enumerates all remaining local branches. | Split the monolithic candidate discovery into an eager worktree/current-branch snapshot and a non-empty-term branch lookup; make the picker consume the snapshot before any unbounded `refs/heads` command. |
| PICK-02 | User initially sees the attached current branch and registered worktrees as selectable sources. | Derive the attached branch from the current registered worktree record, retain every registered worktree row and its existing availability semantics, and preserve the current branch/worktree stable IDs. |
</phase_requirements>

## Summary

The current production path cannot satisfy PICK-01 because `runCli()` awaits `discoverSourceCandidates()` before it calls `pickOrderedSources()`. That discovery eagerly runs a sorted `for-each-ref` over every local branch and then serially asks Git to abbreviate every distinct branch head. There is also a second eager `for-each-ref` inside `discoverGitRepository()`'s machine-protocol probe. The prompt is not installed until all of that work finishes. [VERIFIED: `src/cli/run.ts:328-378`, `src/git/candidates.ts:131-184`, `src/git/repository.ts:84-121`]

The code already has nearly all behavior Phase 09 must preserve: byte-safe `git worktree list --porcelain -z` parsing, branch/worktree stable identities, dirty/unavailable/detached classification, branch-first row grouping, Base-before-Head selection, current-worktree Head suggestion, Back, retained selections, and descriptor-time drift recovery. The smallest safe change is therefore one seam refactor, not a new subsystem: make `src/git/candidates.ts` return an immutable eager snapshot plus an abortable lazy branch operation; let `src/cli/picker.ts` own a prompt-lifetime candidate registry; and let `src/cli/run.ts` continue owning ordered selection and recovery. No new package or production file is needed. [VERIFIED: `src/domain/source.ts:7-37`, `src/cli/picker.ts:145-321`, `src/cli/run.ts:359-435`]

Phase 09 should preserve existing branch search behavior by moving the current full branch inventory behind a non-empty source term. Phase 10 can replace that deliberately slow lazy implementation with filtered, literal, bounded native-Git lookup. This is the cleanest phase boundary: Phase 09 proves true startup laziness and the async picker/state contract without prematurely implementing SRCH-01's optimized Git protocol; Phase 10 changes only the lazy operation. [VERIFIED: `.planning/research/SUMMARY.md:68-79`, `.planning/ROADMAP.md:25-45`]

**Primary recommendation:** Introduce a `SourceDiscovery` session in `src/git/candidates.ts` with eager current-branch/worktree candidates and an abortable non-empty-term branch operation, then adapt the existing picker and `runCli()` state machine without changing source IDs, row grouping, selection revisions, worktree truthfulness, or post-selection code.

## Project Constraints

- Use Node.js 24 LTS and TypeScript end to end. [VERIFIED: `package.json:7-9`; repository instructions]
- Keep the installed Git CLI as the sole authority and invoke it through argument arrays, never shell interpolation. [VERIFIED: repository instructions; `src/git/runner.ts:142-153`]
- Keep Commander and the installed `@inquirer/search` integration; do not add a prompt package. [VERIFIED: `package.json:34-43`, `src/cli/run.ts:451-465`, `src/cli/picker.ts:1-1`]
- Preserve existing source identity, ordering, worktree state, selection, recovery, and failure behavior. [VERIFIED: `.planning/REQUIREMENTS.md:7-14`, `.planning/STATE.md:51-61`]
- Add no repository mutation, persistent branch inventory, background full enumeration, remote refs, fuzzy ranking, or speculative debounce. [VERIFIED: `.planning/REQUIREMENTS.md:31-40`, `.planning/STATE.md:57-61`]
- Investigation was read-only except for this research artifact; no formatter, linter, test, build, or validation command was run, as required by the assignment.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Repository/current-checkout discovery | CLI Git adapter | Installed Git | `src/git/candidates.ts` should interpret authoritative Git records and expose domain candidates. |
| Initial picker choices | CLI picker | CLI Git adapter | Git builds the eager snapshot; `picker.ts` renders and selects it. |
| Ordered Base/Head state | CLI picker | CLI orchestration | `pickOrderedSources()` already owns role order, Back, defaults, and retained endpoints. |
| Candidate refresh and descriptor recovery | CLI orchestration | CLI Git adapter | `runCli()` already recreates discovery after descriptor failures and owns preserved-role behavior. |
| Final branch/worktree pinning | Git comparison adapter | Installed Git | `createPinnedComparison()` remains the live authority after selection; search results are not final truth. |

[VERIFIED: `src/cli/run.ts:328-435`, `src/cli/picker.ts:240-321`, `src/git/comparison.ts:164-184`]

## Standard Stack

### Core

| Library / Tool | Version | Purpose | Why Standard Here |
|----------------|---------|---------|-------------------|
| Node.js | `>=24` | CLI runtime, promises, `AbortSignal` | Existing required runtime; no worker or scheduler is needed. [VERIFIED: `package.json:7-9`] |
| TypeScript | `7.0.2` | Strict source and discovery contracts | Existing language and compiler. [VERIFIED: `package.json:45-53`] |
| `@inquirer/search` | `4.2.1` | Interactive async source prompt | Its source callback receives `undefined` for empty input, supports async choices, and receives an `AbortSignal` when terms change. [CITED: https://github.com/SBoudrias/Inquirer.js/blob/main/packages/search/README.md] |
| Installed Git CLI | `>=2.43.0` | Repository, refs, worktrees, OIDs, status | Existing product authority and supported floor. [VERIFIED: `src/git/repository.ts:9-13`] |
| Existing `GitRunner` | internal | Bounded, cancellable, no-shell Git subprocesses | Already enforces timeouts, byte limits, safe config, argument arrays, and caller cancellation. [VERIFIED: `src/git/runner.ts:3-17`, `src/git/runner.ts:49-74`, `src/git/runner.ts:112-180`] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | `4.1.10` | CLI and Git contract tests | Extend existing `tests/cli` and `tests/git`; create no parallel test harness. [VERIFIED: `package.json:45-53`, `vitest.config.ts`] |
| Commander | `15.0.0` | CLI entrypoint | Leave unchanged; it already transfers control to `runCli()`. [VERIFIED: `package.json:34-43`, `src/cli/run.ts:451-465`] |

**Installation:** None. All required libraries are already installed and locked. No Package Legitimacy Audit is required because Phase 09 should install no external package. [VERIFIED: `package.json:34-53`]

## Current End-to-End Flow

```text
`cumpa` bin
  → `run()` Commander action
  → `runCli({ cwd })`
  → await `discoverSourceCandidates()`
      → `discoverGitRepository()`
          → Git version/root/HEAD probes
          → serial machine-protocol probes
              → includes eager `for-each-ref refs/heads`
      → parallel full branch listing + worktree listing
      → serial branch-head abbreviation loop
      → serial worktree HEAD/status/abbreviation loop
  → find current available worktree for Head suggestion
  → `pickOrderedSources({ candidates })`
      → Base `@inquirer/search`
      → Head `@inquirer/search`
  → `createComparisonLaunchDescriptor()`
  → confirmation
  → browser/server launch
```

[VERIFIED: `src/cli/run.ts:328-435`, `src/git/candidates.ts:131-255`, `src/git/repository.ts:49-215`, `src/cli/picker.ts:240-321`]

### Why startup currently blocks

1. `runCli()` line 350 awaits all candidate discovery before line 370 invokes the picker. [VERIFIED: `src/cli/run.ts:348-378`]
2. `discoverGitRepository()` runs `for-each-ref ... refs/heads` as one of six serial machine-protocol probes. This must be bounded or deferred; otherwise a new staged candidate API would still enumerate the namespace before the prompt. [VERIFIED: `src/git/repository.ts:84-121`]
3. `discoverSourceCandidates()` then runs another sorted `for-each-ref` for all local branches. [VERIFIED: `src/git/candidates.ts:141-157`]
4. The branch loop awaits `rev-parse --short=12` once per previously unseen head, so process count scales with distinct branch heads. [VERIFIED: `src/git/candidates.ts:158-184`]
5. Worktrees are resolved truthfully but serially: each usable row gets `HEAD^{commit}`, status, and abbreviation work before the function returns. [VERIFIED: `src/git/candidates.ts:187-252`]
6. The measured 10,000-branch spike took 96,109.6 ms and 10,020 Git processes for the current eager design; staged initial discovery produced five eager choices for four worktrees and reached a 149.7 ms median in the prototype. These are spike findings, not production acceptance. [VERIFIED: `.planning/spikes/002-staged-source-discovery/README.md:19-28`, `.planning/spikes/002-staged-source-discovery/README.md:45-67`]

## Recommended Architecture

### System Architecture Diagram

```text
Process start
  → `runCli()` creates one source-discovery session
      → bounded repository/root/HEAD prerequisites
      → `git worktree list --porcelain -z`
      → resolve eager worktree rows
      → derive attached current-branch row from current worktree record
      → immutable eager candidates
  → immediately call `pickOrderedSources()`
      ├─ source(undefined / empty)
      │    → eager current branch + all registered worktrees
      │    → user may select Base or Head
      └─ source(non-empty term, AbortSignal)
           → lazy branch operation
           → completed branch candidates installed by stable ID
           → existing row builder groups Branches before Worktrees
  → selected objects returned to unchanged `runCli()` state machine
  → unchanged descriptor-time live Git re-resolution / recovery
  → unchanged confirmation and launch
```

The initial path must contain no unbounded local-branch command. A bounded capability probe such as `for-each-ref --count=1` is acceptable if the repository prerequisite contract still needs an early format probe; the current unbounded probe is not. [RECOMMENDATION grounded in `src/git/repository.ts:84-121` and PICK-01]

### Recommended Project Structure

No new production directory or file is warranted.

```text
src/
├── git/
│   ├── candidates.ts    # modify: SourceDiscovery session, eager snapshot, lazy branch operation
│   ├── repository.ts    # modify only enough to remove/bound eager all-ref protocol probe
│   ├── runner.ts        # reuse unchanged
│   └── comparison.ts    # reuse unchanged
├── cli/
│   ├── picker.ts        # modify: async source + prompt-lifetime ID registry
│   └── run.ts           # modify: discovery-session and recovery handoff
└── domain/
    └── source.ts        # reuse stable candidate contracts unless a tiny discovery type belongs here

tests/
├── git/
│   ├── candidates.test.ts  # eager/lazy Git authority and no-eager-enumeration contract
│   └── comparison.test.ts  # adjust only if the bounded protocol probe expectation changes
└── cli/
    ├── selection.test.ts   # prompt timing, eager selection, lazy selection, ordered state
    └── errors.test.ts      # recovery and error ownership through staged discovery
```

[VERIFIED touchpoints: `src/git/candidates.ts`, `src/git/repository.ts`, `src/cli/picker.ts`, `src/cli/run.ts`, `tests/git/candidates.test.ts`, `tests/git/comparison.test.ts`, `tests/cli/selection.test.ts`, `tests/cli/errors.test.ts`]

### Pattern 1: One discovery session, two stages

**What:** Replace the complete-array-only `discoverSourceCandidates()` seam with one session value. Keep it inside `src/git/candidates.ts`, where parsing and candidate construction already live.

```typescript
// Proposed shape; exact name is discretionary.
interface SourceDiscovery {
  readonly initialCandidates: readonly SourceCandidate[];
  readonly searchBranches: (
    term: string,
    signal: AbortSignal,
  ) => Promise<readonly BranchCandidate[]>;
}
```

**Phase 09 implementation boundary:** `searchBranches()` may initially defer the current full sorted branch inventory until the first non-empty term, then apply the shipped identifying-field match. Phase 10 replaces its internals with filtered literal Git work. Do not enumerate branches in the background and do not cache the full namespace after the first search. [RECOMMENDATION grounded in `.planning/research/SUMMARY.md:68-79` and `.planning/research/PITFALLS.md:397-407`]

### Pattern 2: Derive the eager attached branch without listing branches

Use the current worktree record—`record.path === repository.root` and `record.branchRef !== undefined`—to construct the branch candidate:

- `id`: `branch:${record.branchRef}`
- `label`: strip `refs/heads/`
- `refName`: full `record.branchRef`
- `commitOid` and `shortOid`: the same Git-resolved current worktree HEAD metadata

Then include every worktree candidate separately. If the current worktree is detached, create no branch row; include its `Detached HEAD` worktree row. When the current branch and current worktree point to the same OID, retain both because their source identities differ. [VERIFIED existing identity rules: `src/git/candidates.ts:229-252`, `src/domain/source.ts:14-33`; RECOMMENDATION grounded in PICK-02]

### Pattern 3: Keep one prompt-lifetime candidate registry

`pickOrderedSources()` currently creates `candidateById` once from the fixed option array. With lazy rows, that map must be seeded with eager candidates plus retained Base/Head/recovery candidates, then atomically updated with each completed, non-aborted lazy result before those rows are returned to Inquirer. Resolve Enter by the exact candidate object that produced the row. [VERIFIED current map: `src/cli/picker.ts:240-280`; RECOMMENDATION]

Merge only the duplicate eager/lazy **branch ID**. Never deduplicate by commit OID, short OID, label, or leaf branch name; distinct branches and worktrees may validly share commits. [VERIFIED: `tests/git/candidates.test.ts:30-113`, `.planning/research/PITFALLS.md:105-130`]

### Pattern 4: Let Inquirer own request replacement

The installed prompt's `source(term, { signal })` is already the correct seam. `undefined` means empty input and can return default eager choices; a changing term supplies an `AbortSignal` for the superseded request. [CITED: https://github.com/SBoudrias/Inquirer.js/blob/main/packages/search/README.md]

Make each invocation self-contained:

```typescript
// Proposed behavior inside sourceForPrompt().
signal.throwIfAborted();
if ((term ?? '').length === 0) return eagerItems;
const branches = await discovery.searchBranches(term!, signal);
signal.throwIfAborted();
installByExactId(branches);
return buildSourceSearchItems(merge(branches, eagerCandidates), term, options);
```

Do not let an old promise mutate a shared displayed array after it resolves. Do not convert aborts into “no matches.” [RECOMMENDATION grounded in official Inquirer cancellation semantics and `src/git/runner.ts:112-153`]

### Pattern 5: Preserve `runCli()` ownership and recovery

Keep these responsibilities in `runCli()`:

- current available **worktree** is the suggested Head—not the eager branch row;
- Base/Head selected candidates are converted by the existing `selectionForCandidate()` / `selectionForWorktree()` functions;
- descriptor failures recreate authoritative discovery, preserve the opposite endpoint, and recover the failed role;
- confirmation Back retains Base and returns to Head.

[VERIFIED: `src/cli/run.ts:278-317`, `src/cli/run.ts:359-435`]

A searched non-current branch is not in a recreated session's eager snapshot. Recovery must therefore exactly re-resolve that branch ID (for example through the lazy operation using its label/ref and an exact-ID check) before setting `focusedCandidateId`, or leave focus undefined if Git no longer reports it. Seed the re-resolved object into the picker registry so focus and Enter resolve to the same candidate. Do not keep the stale pre-failure candidate merely to simplify focus. [RECOMMENDATION grounded in `src/cli/run.ts:396-423` and `.planning/research/ARCHITECTURE.md:128-132`]

### Anti-Patterns to Avoid

- **Start the prompt while `discoverSourceCandidates()` continues in the background:** violates the explicit no-background-full-enumeration constraint and creates stale shared state.
- **Return lazy IDs without registering their objects:** displayed branches fail with the existing “selection did not identify an available source” error.
- **Key candidates by OID:** collapses branch/worktree identities and duplicate refs.
- **Rebuild the whole prompt after a query:** loses Base/Head/Back/default/recovery state.
- **Make the branch row the suggested Head:** current behavior suggests the current worktree because it carries committed-worktree and dirty-state semantics.
- **Drop unavailable/prunable worktrees for speed:** they must remain visible and disabled with existing copy.
- **Treat a detached checkout as an attached branch:** no fabricated branch candidate.
- **Directly `spawn()` Git from picker code:** bypasses existing cancellation, limits, safe configuration, and no-shell guarantees.
- **Implement Phase 10 now:** literal Git pattern escaping, filtered branch commands, batch abbreviation, and performance budgets belong to SRCH-01/PERF phases; Phase 09 should establish the seam and preserve behavior.

## Existing Contracts That Must Not Change

### Source identity

| Source | Stable ID | Selection revision | Required behavior |
|--------|-----------|--------------------|-------------------|
| Branch | `branch:${fullRef}` | live full ref name | Descriptor re-resolves the ref after selection. |
| Worktree | `worktree:${path}` | selected committed full OID | Dirty bytes affect labels/warnings only; comparison uses committed HEAD. |

[VERIFIED: `src/git/candidates.ts:174-184`, `src/git/candidates.ts:229-252`, `src/cli/run.ts:278-317`]

### Candidate and display order

`buildSourceSearchItems()` filters candidates by kind and emits the `Local branches` group before the `Worktrees` group, preserving order within each filtered input sequence. Existing branch discovery requests `--sort=refname`; worktrees preserve Git's record order. Async worktree enrichment must map results back to input record order rather than append in completion order. [VERIFIED: `src/cli/picker.ts:177-212`, `src/git/candidates.ts:141-157`; RECOMMENDATION for async enrichment]

### Worktree truthfulness

- `git worktree list --porcelain -z` is the registration authority. Its porcelain format uses a `worktree` first field, NUL field terminators with `-z`, empty record terminators, and boolean fields such as `bare` and `detached`. [CITED: https://git-scm.com/docs/git-worktree]
- Usable worktrees resolve `HEAD^{commit}` and status in that worktree's own cwd. [VERIFIED: `src/git/candidates.ts:192-226`]
- `prunable` or `bare`, missing/invalid HEAD, or failed per-worktree inspection becomes unavailable; cancellation is rethrown rather than mislabeled unavailable. [VERIFIED: `src/git/candidates.ts:192-226`]
- Locked but otherwise usable worktrees remain usable because current parsing does not classify `locked` as unavailable. [VERIFIED: `src/git/candidates.ts:78-129`, `src/git/candidates.ts:199-226`]
- Current checkout Head suggestion remains the available `WorktreeCandidate` where `isCurrentCheckout` is true. [VERIFIED: `src/cli/run.ts:359-364`]

### Picker state

- Base is always selected first. [VERIFIED: `src/cli/picker.ts:258-287`]
- Current checkout is suggested only for Head. [VERIFIED: `src/cli/picker.ts:149-152`, `src/cli/picker.ts:289-305`]
- Head can return Back to Base. [VERIFIED: `src/cli/picker.ts:306-311`]
- Retained opposite endpoints and recovery terms/defaults remain supported. [VERIFIED: `src/cli/picker.ts:255-305`, `tests/cli/errors.test.ts:349-406`]
- Unknown or unavailable selections still fail explicitly. [VERIFIED: `src/cli/picker.ts:277-283`, `src/cli/picker.ts:312-317`, `src/cli/run.ts:295-305`]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Async searchable terminal state | Custom readline UI | Installed `@inquirer/search` source callback | Already supplies empty-term/default choices, request signals, separators, disabled rows, defaults. [CITED: official Inquirer README] |
| Git process cancellation and limits | Direct child-process wrapper | Existing `GitRunner` | Already handles caller abort, timeout, stdout/stderr caps, safe environment, and `shell: false`. [VERIFIED: `src/git/runner.ts`] |
| Worktree inventory | Filesystem scan of `.git/worktrees` | `git worktree list --porcelain -z` | Git owns main/linked/detached/prunable/bare registration semantics. [CITED: https://git-scm.com/docs/git-worktree] |
| Candidate identity | OID/label-based dedupe | Existing branch/full-ref and worktree/path IDs | Several valid sources can point to one commit. [VERIFIED: `src/domain/source.ts`, `tests/git/candidates.test.ts`] |
| Cross-launch branch cache/index | JSON cache, watcher, daemon | Lazy Git query per non-empty term | Persistence and background full inventory are explicitly out of scope. [VERIFIED: `.planning/REQUIREMENTS.md:31-40`] |
| New discovery service/file hierarchy | Provider framework/factory | One small session type in `candidates.ts` | Existing module already owns all candidate parsing and construction. [VERIFIED: current module boundaries] |

**Key insight:** this phase is a timing/seam change around existing authorities. New authorities create more invalidation, identity, and recovery work than they remove.

## Common Pitfalls

### Pitfall 1: The repository protocol probe secretly defeats PICK-01

**What goes wrong:** Main candidate listing is deferred, but `discoverGitRepository()` still executes unbounded `for-each-ref refs/heads` before returning.

**How to avoid:** Bound that capability probe (for example `--count=1`) or defer that specific check to the lazy branch operation while retaining version/root/HEAD and required startup failure behavior.

**Warning sign:** a recording runner sees any all-refs command before `pickSources` is entered.

[VERIFIED root cause: `src/git/repository.ts:84-121`]

### Pitfall 2: Initial current branch is derived by enumerating refs

**What goes wrong:** A special branch query restores the namespace scan merely to materialize one row.

**How to avoid:** derive the attached current branch from the current worktree's existing `branchRef` and resolved HEAD data. Detached current checkout produces no branch row.

### Pitfall 3: Lazy rows render but cannot be selected

**What goes wrong:** `candidateById` was frozen before lazy results arrived.

**How to avoid:** use one prompt-lifetime map, install a completed request before returning its rows, and resolve the selected ID from that map.

### Pitfall 4: Older requests corrupt newer state

**What goes wrong:** a slow earlier term updates a shared array/map after a newer term has rendered.

**How to avoid:** pass the exact Inquirer signal, check it before and after awaits, return immutable per-term results, and make registry installation atomic for non-aborted completion only.

### Pitfall 5: Identity dedupe removes legitimate rows

**What goes wrong:** attached branch and current worktree share an OID, so one disappears; or two refs at one OID collapse.

**How to avoid:** dedupe only exact identical candidate IDs. Branch and worktree remain distinct.

### Pitfall 6: Recovery assumes every candidate is eager

**What goes wrong:** after a selected non-current branch drifts, the recreated eager snapshot cannot focus or resolve it.

**How to avoid:** re-resolve the exact failed branch ID through the session's lazy authority, seed that result into the next picker registry, and preserve the opposite endpoint. If absent, keep focus undefined and retain current recovery copy.

### Pitfall 7: Faster worktree checks reorder or weaken rows

**What goes wrong:** concurrent completion changes worktree order, or errors/cancellation are collapsed into unavailable.

**How to avoid:** concurrency, if introduced, must preserve input indices; abort propagates; only genuine per-worktree inspection failure maps to existing unavailable behavior. Phase 09 does not need an elaborate pool unless measurement requires one.

### Pitfall 8: Phase 09 absorbs search optimization

**What goes wrong:** scope expands into escaping Git patterns, batched abbreviation, broad-output sizing, and packed/loose performance before the staged state contract is stable.

**How to avoid:** first move current semantics behind the final lazy seam. Phase 10 changes Git query internals; Phase 11 proves production budgets.

## Concrete Files and Symbols

| File | Symbol(s) | Likely Phase 09 change |
|------|-----------|------------------------|
| `src/git/candidates.ts` | `discoverSourceCandidates`, `parseWorktreeRecords`, `parseBranchRecords`, `CandidateDiscoveryOptions`, `CandidateDiscoveryDependencies` | Replace monolithic result with discovery session; extract eager worktree/current-branch construction; retain lazy old branch inventory behind non-empty term; reuse all parsers and candidate fields. |
| `src/git/repository.ts` | `probeMachineProtocols`, `discoverGitRepository` | Remove or bound the eager all-local-ref capability probe so staged startup is genuinely lazy. Keep fatal prerequisite semantics. |
| `src/cli/picker.ts` | `PickOrderedSourcesOptions`, `SourceSearchPromptConfig`, `sourceForPrompt`, `buildSourceSearchItems`, `pickOrderedSources`, local `candidateById` | Accept eager candidates plus async branch operation; return eager rows for empty term; install lazy results into prompt-lifetime ID registry; preserve grouping, labels, Back/default/recovery behavior. |
| `src/cli/run.ts` | `RunCliDependencies`, `runCli`, `selectionForCandidate`, `selectionForWorktree` | Change injected discovery seam and recovery refresh; compute Head suggestion from eager worktree; otherwise retain state machine and conversion functions. |
| `src/domain/source.ts` | `BranchCandidate`, `WorktreeCandidate`, `SourceCandidate`, `OrderedSources` | Reuse unchanged unless the discovery-session type is intentionally shared; do not alter stable identities. |
| `src/git/runner.ts` | `GitRunner.run`, `GitRunOptions.signal` | Reuse unchanged; every lazy Git call must receive the prompt signal. |
| `tests/git/candidates.test.ts` | `truthful native-Git source candidate discovery` suite | Split assertions between eager snapshot and lazy branch operation; assert no unbounded branch call before eager return. |
| `tests/git/comparison.test.ts` | machine-protocol call expectations | Adjust only if `probeMachineProtocols` becomes bounded or phase-specific; final comparison must retain required protocol/error behavior. |
| `tests/cli/selection.test.ts` | `ordered searchable source picker`, CLI integration suite | Add initial-source timing, eager Base/Head selection, lazy-row selection, exact-ID dedupe, and stale-request cases while retaining existing grouping/order/Back tests. |
| `tests/cli/errors.test.ts` | descriptor recovery tests | Adapt discovery mocks; prove searched-branch recovery, retained opposite role, vanished candidate focus fallback, and exact failure copy. |

## Verification Strategy

No commands were run during research. Implementation should be verified through the smallest existing suites and behavior-focused additions below.

### PICK-01 contract tests

1. Use a fake/recording discovery session whose branch operation is a deferred promise.
2. Enter the injected picker prompt and invoke its source with `undefined`.
3. Assert eager rows are returned and an eager Base/Head can be selected while the branch promise has neither started nor resolved.
4. Assert the recording Git runner has no unbounded `refs/heads` command before eager discovery returns; explicitly cover `probeMachineProtocols`, not only `discoverSourceCandidates`.
5. Invoke source with a non-empty term and then assert lazy enumeration begins.

**Likely homes:** `tests/cli/selection.test.ts`, `tests/git/candidates.test.ts`.

### PICK-02 contract matrix

Assert the eager snapshot contains:

- attached current branch row with `branch:<full-ref>`;
- current worktree row with `worktree:<path>` and `isCurrentCheckout: true`;
- linked attached worktree;
- detached worktree with no fabricated branch row;
- dirty worktree still selectable with committed-HEAD label;
- prunable/missing/bare or failed-HEAD registration visible but disabled;
- distinct branch/worktree and duplicate-OID identities retained;
- branch group before worktree group; worktree record order unchanged;
- current worktree, not current branch, suggested for Head.

**Likely homes:** extend the existing fixture in `tests/git/candidates.test.ts:30-113` and row assertions in `tests/cli/selection.test.ts:103-219`.

### Selection and recovery regression tests

- Base → Head → Back → Base remains identical.
- Selecting a branch that exists only in lazy results works for Base and Head.
- Confirmation Back retains Base without eager re-enumeration.
- A descriptor failure on a lazy branch recreates authoritative discovery, retains the opposite role, and focuses the exact branch only if it still exists.
- A disappeared worktree keeps existing unavailable/focus-fallback behavior and exact copy.
- Superseded source requests cannot install stale candidates; abort remains cancellation rather than “no matches.”

**Likely homes:** `tests/cli/selection.test.ts`, `tests/cli/errors.test.ts`.

### Suggested future commands for the executor

- Focused CLI: `npx vitest run tests/cli/selection.test.ts tests/cli/errors.test.ts`
- Focused Git: `npx vitest run tests/git/candidates.test.ts tests/git/comparison.test.ts`
- Phase smoke scenario: launch the real CLI in a fixture whose branch enumeration is intentionally delayed, select eager Base and Head, and observe that comparison creation starts without that enumeration.

The milestone's 400 ms production-path benchmark is Phase 11 acceptance, not a Phase 09 substitute for these behavioral contracts. [VERIFIED: `.planning/ROADMAP.md:47-56`]

## Security Domain

Security enforcement is enabled at ASVS Level 1. [VERIFIED: `.planning/config.json:40-44`]

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Local unauthenticated CLI; no auth change. |
| V3 Session Management | No | No web session change. |
| V4 Access Control | No | No authorization boundary change. |
| V5 Input Validation | Yes | Keep user terms out of shells, preserve argv arrays, NUL-safe Git parsing, output caps, and terminal escaping. |
| V6 Cryptography | No | No cryptographic operation change; OIDs remain Git-provided identities, not security hashes invented by application code. |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Branch names/terms interpreted as shell syntax | Tampering / Elevation | Use existing `GitRunner` argument arrays and `shell: false`; never construct a command string. [VERIFIED: `src/git/runner.ts:142-153`] |
| Git-controlled labels/path inject terminal control sequences | Spoofing | Continue applying `escapeTerminalText()` to displayed candidate labels/paths and retained copy. [VERIFIED: `src/cli/picker.ts:81-106`, `src/cli/picker.ts:145-174`] |
| Broad or rapid queries exhaust processes/memory | Denial of Service | Propagate `AbortSignal`; retain runner timeout/output caps; do not start background full inventory. [VERIFIED: `src/git/runner.ts:86-180`] |
| Stale candidate bypasses current Git truth | Tampering | Preserve descriptor-time branch ref re-resolution and worktree committed-OID selection/recovery. [VERIFIED: `src/cli/run.ts:278-317`, `src/git/comparison.ts`] |

## Environment Availability

Step 2.6 skipped: Phase 09 adds no external dependency and changes only existing code/config paths using the already-required Node, Git, TypeScript, Inquirer, and Vitest stack. Per assignment, no environment/version validation commands were run.

## State of the Art

| Old Approach | Current Recommended Approach | Impact |
|--------------|------------------------------|--------|
| Complete immutable candidate array before prompt | Immutable eager snapshot plus abortable lazy branch operation | Prompt becomes useful without namespace enumeration. |
| Candidate map built once from complete array | Prompt-lifetime exact-ID registry | Lazy rows remain selectable without changing identity. |
| Empty term searches complete inventory | Empty term returns attached current branch + registered worktrees only | Satisfies PICK-01/PICK-02 and avoids background work. |
| Full namespace scan at startup | Full existing scan deferred to non-empty term in Phase 09; optimized filtered scan in Phase 10 | Keeps this phase minimal and preserves behavior while establishing the final seam. |

[VERIFIED roadmap direction: `.planning/research/SUMMARY.md:68-79`, `.planning/ROADMAP.md:25-45`]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | None. Recommendations are derived from current source/tests, locked planning artifacts, measured repository spikes, and official Inquirer/Git documentation. | — | — |

## Open Questions (RESOLVED)

1. **How should `discoverGitRepository()` expose a bounded startup protocol profile?**
   - What is known: its current unbounded `for-each-ref` probe violates true startup laziness, while comparison creation still benefits from prerequisite checks. [VERIFIED: `src/git/repository.ts:84-121`]
   - Resolution: use the bounded startup probe with `--count=1`; it validates the required format while the lazy branch operation owns full-enumeration failures, without duplicating root/HEAD discovery.

2. **How should a lazy branch be re-seeded after descriptor recovery?**
   - What is known: the existing recovery recreates candidate discovery and focuses only if the candidate still exists; a non-current branch is absent from the new eager snapshot. [VERIFIED: `src/cli/run.ts:396-423`]
   - Resolution: perform fresh lazy exact-ID recovery through the recreated session's branch operation, seed only the newly resolved exact-ID candidate, and keep focus undefined when the ref vanished.

3. **Should worktree enrichment be parallelized in Phase 09?**
   - What is known: current enrichment is serial, while the spike's concurrent prototype met the many-worktree readiness case. [VERIFIED: `src/git/candidates.ts:187-252`, `.planning/spikes/002-staged-source-discovery/README.md:45-67`]
   - Resolution: retain serial worktree enrichment and porcelain record order; introduce bounded concurrency only if measured production performance later requires it, while preserving record order and abort semantics.

## Sources

### Primary — HIGH confidence

- `.planning/phases/09-immediate-source-picker/09-CONTEXT.md` — phase boundary and discretion.
- `.planning/REQUIREMENTS.md` — PICK-01/PICK-02 and milestone exclusions.
- `.planning/ROADMAP.md` — phase success criteria and Phase 09/10/11 boundaries.
- `.planning/STATE.md` — locked non-regression constraints.
- `src/cli/run.ts` — production startup, ordered orchestration, recovery, selection conversion.
- `src/cli/picker.ts` — Inquirer source adapter, row construction, candidate map, Base/Head state machine.
- `src/git/candidates.ts` — current eager branch/worktree enumeration and candidate identity.
- `src/git/repository.ts` — repository prerequisites and hidden eager ref probe.
- `src/git/runner.ts` — cancellation, bounds, argument-array subprocess behavior.
- `src/domain/source.ts` — stable candidate contracts.
- `tests/git/candidates.test.ts`, `tests/git/comparison.test.ts`, `tests/cli/selection.test.ts`, `tests/cli/errors.test.ts` — existing source, picker, protocol, and recovery contracts.
- `.planning/spikes/002-staged-source-discovery/README.md` and benchmark — measured staged-discovery evidence.
- `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md`, `.planning/research/SUMMARY.md` — milestone-wide codebase research and phase slicing.

### Official documentation

- [Inquirer Search README](https://github.com/SBoudrias/Inquirer.js/blob/main/packages/search/README.md) — async source, empty input, `AbortSignal`, separators, disabled choices.
- [Git worktree documentation](https://git-scm.com/docs/git-worktree) — registered worktree semantics and porcelain `-z` format.

### Tertiary — LOW confidence

- None used.

## Metadata

**Confidence breakdown:**
- Current startup trace: HIGH — read directly from production source and tests.
- Source/worktree identity constraints: HIGH — encoded in source contracts and fixture tests.
- Async prompt contract: HIGH for behavior — official Inquirer documentation; integration details still require project tests.
- Minimal architecture: HIGH — follows existing ownership boundaries and milestone research.
- Performance outcome: MEDIUM — spike validates the prototype shape, but Phase 11 must measure the production path.

**Research date:** 2026-07-30
**Valid until:** 2026-08-29, or until `candidates.ts`, `picker.ts`, `run.ts`, or repository discovery changes.

## RESEARCH COMPLETE
