# Phase 10: On-Demand Branch Search - Research

**Researched:** 2026-07-30
**Domain:** Literal case-insensitive native-Git local-branch lookup through the staged terminal picker
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Users can discover and choose matching local branches on demand without restoring eager full-branch enumeration.

### Claude's Discretion

All implementation choices are at Claude's discretion — discuss phase was skipped per user setting. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

### Deferred Ideas (OUT OF SCOPE)

None — discuss phase skipped.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SRCH-01 | User can enter a non-empty search term and receive case-insensitive literal matches from local branch names on demand. | Replace only `SourceDiscovery.searchBranches()`'s interim full inventory and per-OID loop with an escaped `git branch --list --ignore-case` name filter plus one unique-OID abbreviation batch; preserve the already verified prompt signal, exact-ID registry, grouping, ordered Base/Head flow, and recovery seams. [VERIFIED: `.planning/REQUIREMENTS.md:16-19`, `src/git/candidates.ts:259-330`, `src/cli/picker.ts:245-398`] |
</phase_requirements>

## Project Constraints

- Keep Node.js 24 and TypeScript end to end; installed Git is the ref/object authority, and Git commands must continue through `GitRunner` argument arrays rather than a shell or Git library. [VERIFIED: `.claude/CLAUDE.md`, `package.json:7-8`, `src/git/runner.ts:69-74,142-155`]
- Retain the direct `@inquirer/search@4.2.1` integration. Add no dependency, branch index, background enumerator, remote-ref discovery, fuzzy ranking, repository mutation, or speculative debounce. [VERIFIED: `package.json:34-43`, `.planning/REQUIREMENTS.md:25-40`]
- This research task changes planning documentation only: no source edit, commit, formatter, linter, build, or test run. [VERIFIED: assignment]

## Summary

Phase 09 already created the correct architecture. `discoverSourceCandidates()` returns a frozen eager `initialCandidates` snapshot and an abortable `searchBranches(term, signal?)`; `runCli()` enters `pickOrderedSources()` with that snapshot before any deferred lookup; and `sourceForPrompt()` forwards Inquirer's request-local signal, re-checks it after awaiting Git, then installs completed candidates into one exact-ID registry shared by Base and Head. Phase 09 verification passed all nine must-haves and the focused Git/CLI matrices. [VERIFIED: `src/git/candidates.ts:31-37,143-330`, `src/cli/run.ts:334-440`, `src/cli/picker.ts:281-310,313-398`, `.planning/phases/09-immediate-source-picker/09-VERIFICATION.md`]

The remaining interim implementation is isolated inside `SourceDiscovery.searchBranches()`: every non-empty term still runs an unfiltered `for-each-ref refs/heads`, serially runs `rev-parse --short=12` once per distinct matching head, and only then applies an identifying-text substring test. Phase 10 should replace that body with two read-only native-Git stages: one escaped, case-insensitive local branch-name listing and, only when matches exist, one stdin-fed abbreviation batch. The existing NUL branch record parser and `GitRunner` already provide the necessary parsing, cancellation, timeout, input, no-shell, and output-limit boundaries. [VERIFIED: `src/git/candidates.ts:15-21,54-90,264-330`, `src/git/runner.ts:54-74,86-235`, `.planning/spikes/002-staged-source-discovery/README.md:19-28`]

Phase 10 is a correctness and integration phase, not the milestone latency gate. It must prove non-empty-only lookup, literal case-insensitive name matching, complete local-only identities, constant Cumpa-spawned Git process count, canonical result ordering, cancellation, and selectable returned rows. Phase 11 alone accepts or rejects the production-path 400 ms picker-readiness and 500 ms packed-10,000-ref search budgets. Loose-ref correctness remains mandatory, but its strict sub-500 ms performance is explicitly future scope. [VERIFIED: `.planning/ROADMAP.md:46-70`, `.planning/REQUIREMENTS.md:20-40`, `.planning/spikes/002-staged-source-discovery/README.md:58-67`]

**Primary recommendation:** Keep the Phase 09 session/picker orchestration intact; implement an escaped `git branch --list --ignore-case` query plus one unique-OID `git log --no-walk=unsorted --stdin` abbreviation batch inside `src/git/candidates.ts`, and make `mergedCandidates()` trust only fresh returned branch rows for non-empty terms. [VERIFIED: current seams and spike at `src/git/candidates.ts:259-330`, `src/cli/picker.ts:245-310`, `.planning/spikes/002-staged-source-discovery/benchmark.mjs:66-68,117-147`]

## Success Criteria Resolution

| Phase 10 success criterion | Planning-ready resolution |
|----------------------------|---------------------------|
| 1. A non-empty term returns matching local branch names on demand. | `searchBranches('')` remains a zero-Git fast path. A non-empty term invokes `git branch --list` without `-r`/`-a`, so only local branches participate; no background or eager full inventory is introduced. No-match is a successful empty array and skips abbreviation. [VERIFIED: `src/git/candidates.ts:264-285`; CITED: https://git-scm.com/docs/git-branch] |
| 2. Matching is case-insensitive and Git pattern characters are literal. | Pass `--ignore-case`; escape `\`, `*`, `?`, `[` and `]` before wrapping the term in outer `*` substring wildcards; pass the pattern after `--` as one argv element; then apply a lowercased literal `label.includes(term)` guard to parsed rows. [VERIFIED: `.planning/spikes/002-staged-source-discovery/benchmark.mjs:66-68,117-123`; CITED: https://git-scm.com/docs/git-branch] |
| 3. Changed terms show only current results, and returned rows are selectable in ordered comparison. | Inquirer creates an AbortController per search term, aborts it on effect cleanup, and publishes results only if that controller is not aborted. Cumpa additionally checks the same signal before and after `searchBranches()` and installs returned rows by exact ID only after the second check. `pickOrderedSources()` retains Base-before-Head and resolves the chosen ID from its shared registry. [VERIFIED: `node_modules/@inquirer/search/dist/index.js:59-92`, `src/cli/picker.ts:281-310,313-398`, `tests/cli/selection.test.ts:296-415`] |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Literal local branch filtering and candidate construction | CLI Git adapter (`src/git/candidates.ts`) | Installed Git | Git owns ref visibility and object IDs; the adapter owns escaping, machine parsing, batching, ordering, schemas, and immutable `BranchCandidate` construction. [VERIFIED: `src/git/candidates.ts`, `src/domain/source.ts:14-19`] |
| Request supersession and displayed result publication | Terminal picker (`src/cli/picker.ts`) | `@inquirer/search` | Inquirer owns per-term controllers; Cumpa owns the post-await abort guard and exact-ID candidate registry. [VERIFIED: `node_modules/@inquirer/search/dist/index.js:59-92`, `src/cli/picker.ts:281-319`] |
| Ordered Base/Head selection and Back behavior | Terminal picker (`pickOrderedSources`) | CLI orchestration | The existing loop selects Base first, then Head, and preserves retained/recovery state; branch search must not move this state into the Git layer. [VERIFIED: `src/cli/picker.ts:313-398`, `src/cli/run.ts:346-440`] |
| Descriptor-time ref authority and searched-branch recovery | CLI orchestration (`runCli`) | Git comparison adapter | `runCli()` recreates discovery, searches by the failed label, accepts only the exact failed ID, and preserves the opposite endpoint. [VERIFIED: `src/cli/run.ts:386-440`, `tests/cli/errors.test.ts:429-535`] |
| Packed-ref latency acceptance | Phase 11 benchmark | Production CLI path | Phase 10 establishes the production behavior; only Phase 11 measures the formal 400/500 ms budgets through that path. [VERIFIED: `.planning/ROADMAP.md:59-70`] |

## Standard Stack

### Core

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Node.js | `>=24`; workstation `v24.15.0` | Async process and AbortSignal runtime | Project baseline; no worker or process package is needed. [VERIFIED: `package.json:7-8`; observed `node --version`] |
| Git CLI | project minimum `2.43.0`; workstation `2.50.1` | Local branch, full OID, abbreviated OID authority | Existing positive startup checks and native semantics cover packed, loose, and mixed refs without parsing `.git`. [VERIFIED: `src/git/repository.ts:9-13,49-81`; observed `git --version`] |
| `@inquirer/search` | `4.2.1` | Async ordered source prompt with request signal | Already installed, documented, and integrated; Phase 09 verified its exact source seam. [VERIFIED: `package.json:34-37`, `node_modules/@inquirer/search/README.md:88-104`] |
| Existing `GitRunner` | internal | Bounded, cancellable, no-shell Git execution | Already owns safe Git arguments, input bytes, 10 s default timeout, 1 MiB stdout, 64 KiB stderr, and caller-signal child termination. [VERIFIED: `src/git/runner.ts:3-17,54-74,86-235`] |

### Supporting

| Component | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| Vitest | `4.1.10` | Observable Git and picker contracts | Extend existing `tests/git/candidates.test.ts` and `tests/cli/selection.test.ts`; use existing recovery tests as regression proof. [VERIFIED: `package.json:45-53`] |
| Existing native-Git spike | repository artifact | Command shape and packed/loose feasibility evidence | Use as design evidence only; Phase 11 must remeasure the integrated production path. [VERIFIED: `.planning/spikes/002-staged-source-discovery/README.md:11-28,58-67`] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Filtered `git branch --list` | Current unfiltered `for-each-ref refs/heads` plus JS filtering | Correct but emits the entire namespace for every term and retains serial per-OID work; it is precisely the interim body Phase 10 replaces. [VERIFIED: `src/git/candidates.ts:277-328`] |
| One batch abbreviation | Per-result `rev-parse --short=12` | Preserves Git authority but makes Cumpa's process count grow with distinct matched OIDs. [VERIFIED: `src/git/candidates.ts:288-301`; `.planning/spikes/002-staged-source-discovery/README.md:21-28`] |
| Stateless Git lookup | Persistent index, cache, watcher, or background inventory | Faster repeated lookup at the cost of invalidation, mutation, stale authority, and explicit scope violation. [VERIFIED: `.planning/REQUIREMENTS.md:31-40`] |
| Existing Inquirer cancellation | Debounce or custom request generations | Additional state is unnecessary: the installed prompt aborts superseded requests and refuses their publication, while Cumpa performs its own post-await guard. Speculative debounce is out of scope. [VERIFIED: `node_modules/@inquirer/search/dist/index.js:59-92`, `.planning/REQUIREMENTS.md:40`] |

**Installation:** None. Phase 10 must add no package and change no version. [VERIFIED: existing stack and phase scope]

## Package Legitimacy Audit

Not applicable: the recommended implementation installs no external package and uses only the existing lockfile stack, Node built-ins, internal `GitRunner`, and installed Git executable. [VERIFIED: `package.json`, `.planning/research/STACK.md`]

## Architecture Patterns

### System Architecture Diagram

```text
picker source(undefined / empty)
  -> existing eager current branch + every registered worktree
  -> no local branch query

picker source(non-empty literal term, signal N)
  -> signal N pre-check
  -> escape Git shell-wildcard metacharacters
  -> GitRunner.run(git branch --list --ignore-case ... -- *escaped*)
       -> local branch full ref + label + full object OID records
  -> signal N check
  -> parse NUL records; literal post-filter; canonical ref-name order
  -> unique full OIDs
  -> if non-empty: GitRunner.run(git log --no-walk=unsorted ... --stdin)
       -> full OID + Git abbreviation map
  -> signal N check; reject incomplete/malformed map
  -> immutable BranchCandidate[]
  -> sourceForPrompt signal N post-check
  -> exact-ID registry install
  -> merged fresh branches, then unchanged registered worktrees
  -> Base selection -> Head selection -> existing descriptor pin/recovery

term N+1
  -> Inquirer aborts signal N
  -> GitRunner terminates active child, or post-await guards discard completion
  -> only signal N+1 may publish/install rows
```

[VERIFIED: `src/git/candidates.ts:31-37,259-330`, `src/git/runner.ts:112-233`, `src/cli/picker.ts:245-310`, `node_modules/@inquirer/search/dist/index.js:59-92`; command pipeline verified by `.planning/spikes/002-staged-source-discovery/benchmark.mjs:66-68,117-147`]

### Recommended Project Structure

```text
src/
├── git/
│   ├── candidates.ts      # change searchBranches internals and private search helpers
│   ├── runner.ts          # reuse unchanged
│   └── repository.ts      # reuse Phase 09 bounded startup probe unchanged
├── cli/
│   ├── picker.ts          # remove stale eager-branch fallback; retain signal/registry/order loop
│   └── run.ts             # reuse unchanged discovery/recovery ownership
└── domain/
    └── source.ts          # reuse BranchCandidate/WorktreeCandidate contracts unchanged

tests/
├── git/candidates.test.ts # extend real-Git literal/filter/batch/order/error contracts
├── cli/selection.test.ts  # extend current-term/name-only merge contract; retain race/selection matrix
└── cli/errors.test.ts     # regression-only exact-ID searched-branch recovery
```

[VERIFIED: existing module ownership in the named files and Phase 09 summaries]

### Pattern 1: One filtered listing, one optional abbreviation batch

**What:** Reuse `BRANCH_FORMAT` and `parseBranchRecords()`, but change the listing command inside `discoverSourceCandidates().searchBranches()` to the equivalent argv below. Deduplicate only the full OIDs sent to the second command, then map abbreviations back to every ref without deduplicating candidate IDs. [VERIFIED: `src/git/candidates.ts:15-21,69-90,264-330`; `.planning/spikes/002-staged-source-discovery/benchmark.mjs:117-147`]

```typescript
// Sources: https://git-scm.com/docs/git-branch
//          https://git-scm.com/docs/git-log
//          https://git-scm.com/docs/pretty-formats
const pattern = `*${term.replace(/[\\*?\[\]]/gu, '\\$&')}*`;
const listed = await runner.run(
  [
    'branch',
    '--list',
    '--ignore-case',
    '--no-color',
    '--sort=refname',
    `--format=${BRANCH_FORMAT}`,
    '--',
    pattern,
  ],
  { cwd: repository.root, signal },
);

// If matching records exist, send each distinct validated full OID once.
const abbreviated = await runner.run(
  [
    'log',
    '--no-walk=unsorted',
    '--abbrev=12',
    '--format=%H%x00%h%x00',
    '--stdin',
  ],
  { cwd: repository.root, signal, input: Buffer.from(`${uniqueOids.join('\n')}\n`, 'ascii') },
);
```

`git branch --list` patterns are shell wildcards, not regexes; `--ignore-case` affects both filtering and sorting; explicit `--sort=refname` avoids `branch.sort`; `--format` uses `for-each-ref` atoms; and `--no-color` prevents configured decorations. `git log --stdin --no-walk=unsorted` accepts the selected commits without walking ancestors; `%H`, `%h`, and `%x00` provide a keyed machine record. [CITED: https://git-scm.com/docs/git-branch; https://git-scm.com/docs/git-log; https://git-scm.com/docs/pretty-formats]

### Pattern 2: Literal guard and canonical order are application invariants

Escaping is necessary but not the only assertion. After `parseBranchRecords()`, retain only rows whose local branch label contains `term` under the same lowercasing convention, so an escaping regression cannot broaden results. Then restore Phase 09's canonical case-sensitive full-ref order with `orderByteSequences(Buffer.from(a.refName), Buffer.from(b.refName))`; do not use `orderText`, repository `branch.sort`, completion order, popularity, or recency. The client-side order step is required because Git documents that `--ignore-case` changes sorting as well as filtering. [VERIFIED: Phase 09 ordering contract at `.planning/phases/09-immediate-source-picker/09-02-PLAN.md:18-24`; CITED: https://git-scm.com/docs/git-branch]

The search contract in SRCH-01 is the local branch name (`BranchCandidate.label`) as a literal substring. Do not restore generic kind-alias or OID searches by enumerating every branch. Full `refName`, full `commitOid`, and Git-derived `shortOid` remain result identity/revision metadata, not alternate Phase 10 query keys. Eager/worktree behavior remains under the existing picker contract. [VERIFIED: `.planning/REQUIREMENTS.md:16-19,31-40`, `src/domain/source.ts:14-30`; phase-boundary recommendation]

### Pattern 3: Fresh branch rows only; stable worktree rows remain

For a non-empty term, `mergedCandidates()` currently may insert an eager attached branch absent from Git's returned rows when `candidateMatches()` sees a kind alias, ref, or OID. That can violate literal branch-name matching and can reintroduce stale authority. Simplify it to exact-ID-deduplicate the fresh `branches` argument and append the unchanged eager worktree rows. A matching attached branch is already returned by authoritative Git and deduplicated by `branch:<full-ref>`; a nonmatching attached branch must not be injected. Keep branch rows before worktrees, and keep worktrees in Phase 09's porcelain-derived order and availability state. [VERIFIED: `src/cli/picker.ts:126-150,245-278`, `src/git/candidates.ts:218-263`, `.planning/phases/09-immediate-source-picker/09-VERIFICATION.md`]

### Pattern 4: One signal, three stale-result barriers

1. `@inquirer/search` aborts the previous request controller when `searchTerm` changes and only calls `setSearchResults` while that controller is live. [VERIFIED: `node_modules/@inquirer/search/dist/index.js:59-92`]
2. Every branch-list and abbreviation `runner.run()` receives that same signal; `GitRunner` rejects a pre-aborted request and aborts/kills an active child on caller cancellation. [VERIFIED: `src/git/runner.ts:112-155,187-205`]
3. `searchBranches()` checks after each Git stage, and `sourceForPrompt()` checks once more before mutating `candidateById`. [VERIFIED: existing checks at `src/git/candidates.ts:268-286,298-328`, `src/cli/picker.ts:289-302`]

Do not catch cancellation as `[]`, do not publish partial rows, and do not add a global generation counter or debounce. Each closure already captures its literal effective term, and the installed prompt owns supersession. [VERIFIED: Phase 09 cancellation tests at `tests/git/candidates.test.ts:151-261`, `tests/cli/selection.test.ts:371-415`; `.planning/REQUIREMENTS.md:40`]

### Anti-Patterns to Avoid

- **Regex escaping for a Git wildcard:** Git branch patterns are shell wildcards. Escape `\`, `*`, `?`, `[` and `]`; regex-specific escaping is the wrong grammar. [CITED: https://git-scm.com/docs/git-branch]
- **Quoting the pattern inside the argv string:** `shell: false` means quote characters would become data. Pass one unquoted argv value after `--`. [VERIFIED: `src/git/runner.ts:142-155`]
- **Trusting `--sort=refname` under `--ignore-case` to preserve Phase 09 ordering:** Git states `--ignore-case` affects sorting. Re-sort parsed full refs by raw UTF-8 bytes. [CITED: https://git-scm.com/docs/git-branch]
- **Using Git's human branch output:** It may contain current/worktree decorations and configured color. Keep explicit format atoms and NUL fields. [CITED: https://git-scm.com/docs/git-branch; VERIFIED: `BRANCH_FORMAT`/`parseBranchRecords`]
- **One process per matched branch:** No `await runner.run(rev-parse...)` inside a record loop. Batch unique OIDs once. [VERIFIED: measured failure in `.planning/spikes/002-staged-source-discovery/README.md:21-28`]
- **Caching the first result set:** Branches may move/create/delete between terms; the current session contract is fresh and uncached. [VERIFIED: `.planning/phases/09-immediate-source-picker/09-01-SUMMARY.md:34-40,88-89`]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Ref discovery | `.git/refs` / `packed-refs` parser | Installed `git branch --list` through `GitRunner` | Git owns loose, packed, mixed, linked-worktree, and future ref storage. [VERIFIED: project Git authority; spike packed/loose results] |
| Async search UI | Readline loop or prompt replacement | Existing `@inquirer/search` source callback | It already supplies empty-term semantics, per-term cancellation, normalized choices, and stale-publication guards. [VERIFIED: installed README/source] |
| Subprocess safety | New spawn wrapper | Existing `GitRunner` | It already supplies safe config, argv/no-shell execution, stdin, timeout, output limits, and AbortSignal handling. [VERIFIED: `src/git/runner.ts`] |
| Branch cache/index | JSON, SQLite, watcher, daemon | Stateless native-Git query per non-empty term | New state violates the milestone authority and invalidation boundary. [VERIFIED: `.planning/REQUIREMENTS.md:31-40`] |
| Ranking | Fuzzy matcher or recency sort | Literal case-insensitive substring plus canonical ref order | Fuzzy/recency semantics are explicitly future SRCH-03. [VERIFIED: `.planning/REQUIREMENTS.md:25-29`] |
| Abbreviation fan-out | Per-branch subprocess pool | One stdin-fed Git batch | A pool bounds concurrency but still leaves O(matches) processes; the batch leaves at most two search processes. [VERIFIED: spike design/results] |

**Key insight:** Phase 10 needs one private query implementation, not a new provider/index abstraction. Phase 09 already placed every lifecycle responsibility at the correct seam. [VERIFIED: Phase 09 plans, summaries, and verification]

## Exact Change Map and Plan Boundary

| File / symbol | Phase 10 action | Boundary |
|---------------|-----------------|----------|
| `src/git/candidates.ts` — `BRANCH_FORMAT`, `parseBranchRecords()` | Reuse unchanged unless a small keyed abbreviation parser is colocated beside them. [VERIFIED: `src/git/candidates.ts:15-21,69-90`] | Do not create a new Git service/file. |
| `src/git/candidates.ts` — `discoverSourceCandidates().searchBranches()` | Replace unfiltered `for-each-ref` and serial `rev-parse` loop with literal branch filter, parsed literal guard, canonical order, one optional abbreviation batch, completeness checks, and immutable `BranchCandidate[]`. [VERIFIED: `src/git/candidates.ts:264-330`] | Keep `SourceDiscovery` signature and eager worktree/current-branch code unchanged. |
| `src/cli/picker.ts` — `mergedCandidates()` | Remove the stale/mismatched eager-branch insertion fallback; exact-ID-deduplicate fresh branch results and append existing worktrees. [VERIFIED: `src/cli/picker.ts:245-278`] | Keep `sourceForPrompt()`, `candidateById`, `buildSourceSearchItems()`, and `pickOrderedSources()` orchestration otherwise unchanged. |
| `tests/git/candidates.test.ts` — `defers complete branch discovery behind uncached non-empty searches` and real-Git fixture suite | Replace interim command assertions; add mixed-case substring, literal `* ? [ ] \` terms, local-only exclusion, mixed-case canonical order, duplicate-OID batching, no-match one-call, malformed/missing abbreviation, and abort-at-each-stage coverage. [VERIFIED: existing seam at `tests/git/candidates.test.ts:151-261`] | No Phase 11 timing assertion. |
| `tests/cli/selection.test.ts` — `describe('staged source discovery')` | Add a current-term literal-name merge assertion and retain existing lazy selection, exact-ID dedupe, branch/worktree order, and old-after-new abort race tests. [VERIFIED: `tests/cli/selection.test.ts:233-433`] | Do not replace the prompt fake or create terminal E2E infrastructure. |
| `src/cli/run.ts` — `runCli()`, `selectionForCandidate()` | No implementation change expected. [VERIFIED: `src/cli/run.ts:280-318,334-440`] | Regression-check Base/Head order, ref-name selection authority, and exact-ID recovery only. |
| `tests/cli/errors.test.ts` — searched-branch recovery cases | No test edit expected unless the new literal fixture exposes a gap; run existing fresh exact-ID/disappearance matrix. [VERIFIED: `tests/cli/errors.test.ts:429-535`] | Do not change failure copy or recovery ownership. |
| `src/git/runner.ts`, `src/git/repository.ts`, `src/domain/source.ts` | Reuse unchanged. [VERIFIED: existing complete contracts] | Never disable limits, alter startup probes, or change candidate types for this phase. |

## Failure Modes and Required Behavior

| Failure / edge | Required behavior |
|----------------|-------------------|
| Empty or `undefined` input | Return Phase 09 eager candidates through the picker; `searchBranches('')` returns frozen `[]` with zero search Git calls. [VERIFIED: current Phase 09 behavior] |
| Successful query with no matching branch | Return frozen `[]`; skip the abbreviation command; picker keeps its separators/worktree rows and does not treat this as failure. [VERIFIED: existing picker construction; recommended branch pipeline] |
| Term contains `*`, `?`, `[`, `]`, or `\` | Treat it as literal data. Escaping plus the post-filter must prevent broadening; since several of these are invalid in Git ref names, the normal result is no branch, not all branches. [VERIFIED: SRCH-01 and spike escape helper] |
| Superseded before/during either Git stage | Reject as cancellation; the same signal terminates active Git and prevents registry/display mutation. Do not translate to no-match or terminal failure copy. [VERIFIED: runner, Inquirer, and picker signal flow] |
| Non-abort Git exit/spawn/timeout/stdout/stderr-limit | Propagate the error. Never return stale, partial, or empty rows as a fallback. Existing runner limits remain enabled. [VERIFIED: `src/git/runner.ts:19-45,157-231`] |
| Malformed branch record, invalid full OID, malformed abbreviation record, or missing OID mapping | Reject the whole query before constructing selectable rows. `GitObjectIdSchema` remains the full-OID validator. [VERIFIED: `src/git/candidates.ts:69-90`; batch completeness recommendation] |
| Multiple branches at one OID | Abbreviate the unique OID once, but emit every branch with its own `branch:<full-ref>` ID. [VERIFIED: `src/domain/source.ts:14-19`, Phase 09 identity contract] |
| Eager attached branch also appears in fresh results | Keep one row by exact candidate ID; never deduplicate by label or OID. [VERIFIED: `src/cli/picker.ts:245-257`] |
| Ref moves/disappears after result display | Keep existing descriptor-time live ref resolution and recovery. Search candidates are prompt authority, not the final pinned comparison. [VERIFIED: `src/cli/run.ts:280-318,386-440`] |
| Very broad match exceeds current bounded output | Fail explicitly with `stdout-limit`; never silently truncate. Whether the production 10,000-packed fixture requires a measured per-call bound adjustment belongs to Phase 11. [VERIFIED: `src/git/runner.ts:3-5,157-166`; Phase 11 boundary] |

## Phase 10 Correctness vs Phase 11 Performance

| Concern | Phase 10 acceptance | Phase 11 acceptance |
|---------|---------------------|---------------------|
| Picker readiness | Must not add eager/background full branch lookup; preserve Phase 09 verified staging. [VERIFIED: PICK-01 non-regression] | Production command path usable within 400 ms in 10,000 packed refs. [VERIFIED: PERF-01] |
| Search latency | No millisecond gate. Architecture must use one filtered list plus at most one abbreviation batch; Cumpa-spawned process count is O(1) per term, though Git may internally scan O(N) loose refs and output remains O(matches). [VERIFIED: spike design and loose result] | Production picker returns packed-10,000-ref results within 500 ms. [VERIFIED: PERF-02] |
| Packed/loose refs | Same complete, correct local branch identities; no mutation, cache, timeout-as-empty, or silent cap. [VERIFIED: requirements/out-of-scope] | Packed fixture carries strict budget. Loose refs remain correctness evidence; PERF-03 is future. [VERIFIED: `.planning/REQUIREMENTS.md:22-27`] |
| Broad result set | Correct complete rows within explicit runner limits; any bound failure is visible. [VERIFIED: runner contract] | Measure production rendering/output against the packed broad-match fixture and adjust a still-bounded per-call allowance only from evidence. [VERIFIED: spike broad 9,999-match evidence] |
| Rapid typing | Same signal must cancel children and prevent stale publication/registry installation. [VERIFIED: existing code/tests] | Production-path measurement may quantify process cleanup, but cannot redefine correctness. [VERIFIED: Phase 11 gate scope] |

**Boundary statement:** Do not put `performance.now()`, a 500 ms assertion, packed-ref fixture generation, production command benchmarking, debounce, pagination, cache, or runner-limit removal into the Phase 10 plan. Conversely, do not defer literal escaping, constant process shape, cancellation propagation, complete results, ordering, or selection continuity to Phase 11; those are Phase 10 correctness. [VERIFIED: roadmap/requirements/spike separation]

## Common Pitfalls

### Pitfall 1: Escaping for the wrong grammar
**What goes wrong:** A term broadens to unrelated branches or quote characters become literal. [VERIFIED: Git wildcard and no-shell semantics]
**Why it happens:** Git branch uses shell-wildcard patterns, while `GitRunner` does not invoke a shell. [CITED: https://git-scm.com/docs/git-branch; VERIFIED: `src/git/runner.ts:142-155`]
**How to avoid:** Escape Git wildcard metacharacters, add only Cumpa's outer substring `*`, and pass one argv pattern after `--`; apply a literal post-guard. [VERIFIED: spike helper and command]
**Warning signs:** Searching `*` or `[a]` returns most branches; searching text containing a quote unexpectedly returns none. [VERIFIED: derived contract]

### Pitfall 2: `--ignore-case` silently changes row order
**What goes wrong:** Mixed-case branch rows no longer match Phase 09's canonical ref-name sequence. [VERIFIED: Phase 09 order plus Git docs]
**Why it happens:** Git explicitly applies `--ignore-case` to sorting and filtering. [CITED: https://git-scm.com/docs/git-branch]
**How to avoid:** Parse first, literal-filter, then byte-sort full `refName` values before candidate construction. [VERIFIED: recommended invariant]
**Warning signs:** `Alpha`, `alpha`, and `beta` reorder when `--ignore-case` is added. [VERIFIED: derived contract]

### Pitfall 3: Serial abbreviation survives the filter refactor
**What goes wrong:** A broad query launches one process per distinct matching head and recreates the measured scaling failure. [VERIFIED: current loop and spike]
**Why it happens:** The existing `shortOidByFullOid` cache removes duplicates but not per-unique-OID subprocesses. [VERIFIED: `src/git/candidates.ts:288-301`]
**How to avoid:** Deduplicate full OIDs, run one stdin batch, validate every requested OID appears, then join by key. [CITED: Git log/pretty docs]
**Warning signs:** `runner.run` remains inside the parsed branch loop or call count grows with matches. [VERIFIED: code-shape signal]

### Pitfall 4: A stale eager branch defeats literal/native authority
**What goes wrong:** A kind alias or OID term inserts the eager current branch even though the native name query did not return it; a deleted/moved row can also be resurrected. [VERIFIED: `candidateMatches()` plus `mergedCandidates()` at `src/cli/picker.ts:126-150,245-278`]
**Why it happens:** Phase 09's temporary merge fallback predates the narrowed SRCH-01 name contract. [VERIFIED: Phase 09 staged implementation history]
**How to avoid:** Non-empty branch rows come only from the completed fresh lookup; append existing worktrees separately. [VERIFIED: recommended cutover]
**Warning signs:** Searching `branch` shows `main`, or a fake provider omitting the current branch still causes it to appear. [VERIFIED: derived regression]

### Pitfall 5: Cancellation is caught as no-match
**What goes wrong:** Old terms flash empty rows/errors, stale IDs enter the registry, or Git children accumulate. [VERIFIED: Phase 09 pitfall/test matrix]
**Why it happens:** Catch-all error handling collapses expected aborts and real failures. [VERIFIED: runner typed errors]
**How to avoid:** Let abort rejection flow through Inquirer, preserve checks after each await, and install only after the picker post-check. [VERIFIED: installed Inquirer and current picker]
**Warning signs:** An aborted source promise resolves `[]`, or `candidateById.set` executes before `signal.throwIfAborted()`. [VERIFIED: code-order invariant]

### Pitfall 6: Calling on-demand filtered search “sublinear”
**What goes wrong:** Phase 10 claims a performance guarantee that loose refs cannot meet and pressures later code toward mutation or truncation. [VERIFIED: spike loose-ref result]
**Why it happens:** Constant application subprocess count is confused with Git's internal ref scan and O(matches) output. [VERIFIED: measured spike]
**How to avoid:** State the exact bound: at most two Cumpa-spawned Git processes per non-empty term, no eager work, complete output within explicit limits; leave elapsed-time acceptance to Phase 11. [VERIFIED: roadmap and spike]
**Warning signs:** A Phase 10 task contains 500 ms acceptance or proposes `pack-refs`, a cache, or a silent cap. [VERIFIED: requirements exclusions]

## Code Examples

### Literal Git wildcard escaping

```typescript
// Source: existing spike + https://git-scm.com/docs/git-branch
function escapeBranchPattern(term: string): string {
  return term.replace(/[\\*?\[\]]/gu, '\\$&');
}
```

This helper escapes Git shell-wildcard controls, not shell syntax; `GitRunner` already passes argv with `shell: false`. [VERIFIED: `.planning/spikes/002-staged-source-discovery/benchmark.mjs:66-68`, `src/git/runner.ts:142-155`]

### Keyed abbreviation join

```typescript
// Source: https://git-scm.com/docs/git-log and https://git-scm.com/docs/pretty-formats
const shortByFull = parseAbbreviationRecords(result.stdout);
for (const record of records) {
  const shortOid = shortByFull.get(record.commitOid);
  if (shortOid === undefined) {
    throw new Error('Git did not abbreviate a matching branch head');
  }
  candidates.push(Object.freeze({
    kind: 'branch',
    id: `branch:${record.refName}`,
    label: record.label,
    refName: record.refName,
    commitOid: record.commitOid,
    shortOid,
  }));
}
```

Join by full OID, never by output position. Distinct refs sharing one OID receive separate immutable candidates. [VERIFIED: `BranchCandidate` contract and spike parser]

## State of the Art

| Old / interim approach | Current Phase 10 approach | When changed | Impact |
|------------------------|---------------------------|--------------|--------|
| Eager complete branch discovery before picker | Phase 09 eager worktree/current-branch snapshot plus lazy session search | Phase 09, completed 2026-07-30 | Picker readiness no longer waits on remaining local branches. [VERIFIED: Phase 09 summaries/verification] |
| Lazy but unfiltered `for-each-ref` and serial `rev-parse` | Filtered native branch-name listing plus one abbreviation batch | Phase 10 target | Literal on-demand results with constant Cumpa process count. [VERIFIED: current code vs spike] |
| Spike-only packed latency | Integrated production picker benchmark | Phase 11 target | Only production-path results can complete PERF-01/PERF-02. [VERIFIED: `.planning/ROADMAP.md:59-70`] |

**Deprecated/outdated:**
- The current `searchBranches()` identifying-text filter is intentional Phase 09 scaffolding, not the Phase 10 contract. Replace it cleanly; leave no alias path or full-inventory fallback. [VERIFIED: Phase 09 summary next-phase note]
- The spike's line-oriented branch parser is prototype-only. Production must retain `BRANCH_FORMAT`, NUL parsing, schema validation, and exact IDs. [VERIFIED: spike vs `src/git/candidates.ts`]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | None. All implementation claims are grounded in current source/tests, completed Phase 09 artifacts, the checked-in spike, installed dependency source/docs, or official Git documentation. | — | — |

## Open Questions

None. The implementation seam, command forms, parsers, identity join, cancellation owner, order restoration, failure behavior, files/symbols, and Phase 10/11 boundary are resolved. Phase 11's measured latency and any evidence-based runner-output allowance are future acceptance work, not unresolved Phase 10 design questions. [VERIFIED: roadmap phase split]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | CLI/runtime | ✓ | `v24.15.0` | None needed; satisfies `>=24`. [VERIFIED: observed command and `package.json`] |
| Git CLI | Branch/filter/abbreviation authority | ✓ | `2.50.1 (Apple Git-155)` | None needed; satisfies project minimum 2.43.0. [VERIFIED: observed command and `src/git/repository.ts`] |
| `@inquirer/search` | Per-term terminal source/cancellation | ✓ | `4.2.1` | None needed; locked installed dependency. [VERIFIED: `package.json`, `node_modules`] |

**Missing dependencies with no fallback:** None. [VERIFIED: environment probes]

**Missing dependencies with fallback:** None. [VERIFIED: environment probes]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Local interactive CLI has no authentication boundary in this phase. [VERIFIED: phase scope] |
| V3 Session Management | no | Browser/session behavior is unchanged and downstream of selection. [VERIFIED: phase boundary] |
| V4 Access Control | no | Search reads refs available to the invoking local user; it adds no service authorization path. [VERIFIED: native local Git architecture] |
| V5 Input Validation | yes | Treat prompt text as untrusted: argv/no-shell execution, `--` option terminator, Git-wildcard escaping, literal post-guard, NUL record parsing, and OID schema checks. [VERIFIED: runner/current parser/recommendation] |
| V6 Cryptography | no | Git-derived object IDs are identifiers here; Phase 10 implements no cryptography. [VERIFIED: phase scope] |

### Known Threat Patterns for Native-Git Search

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Option/shell injection through term | Tampering / Elevation | `shell: false`, argument arrays, pattern after `--`; never interpolate a command string. [VERIFIED: `src/git/runner.ts:142-155`] |
| Wildcard expansion broadens literal term | Tampering / Denial of Service | Escape Git wildcard controls and apply literal post-filter. [VERIFIED: SRCH-01 and spike] |
| Stale async request overwrites current rows | Tampering | Inquirer controller + same runner signal + post-await picker check before exact-ID install. [VERIFIED: installed source/current picker] |
| Broad query exhausts output/memory | Denial of Service | Preserve bounded runner timeout/stdout/stderr and fail explicitly; never disable limits or silently truncate. [VERIFIED: `src/git/runner.ts`] |
| Git-controlled label emits terminal controls | Spoofing | Keep existing `escapeTerminalText()` rendering unchanged. [VERIFIED: `src/cli/picker.ts:73-114,153-180`] |
| OID/label-based identity collapse | Spoofing / Tampering | Deduplicate only exact candidate IDs; batch OIDs only for computation, then restore every full-ref identity. [VERIFIED: `src/domain/source.ts`, `src/cli/picker.ts:245-257`] |

## Sources

### Primary (HIGH confidence)

- Current production source: `src/git/candidates.ts`, `src/git/runner.ts`, `src/git/repository.ts`, `src/cli/picker.ts`, `src/cli/run.ts`, `src/domain/source.ts` — exact implementation seams and contracts. [VERIFIED: codebase read]
- Current contract tests: `tests/git/candidates.test.ts`, `tests/cli/selection.test.ts`, `tests/cli/errors.test.ts` — real-Git, stale-request, selection, ordering, and recovery seams. [VERIFIED: codebase read]
- Phase 09 plans, summaries, and `09-VERIFICATION.md` — completed staged-discovery and prompt contracts. [VERIFIED: planning artifacts]
- `.planning/spikes/002-staged-source-discovery/README.md` and `benchmark.mjs` — exact filtered-list/batched-abbreviation prototype and packed/loose evidence. [VERIFIED: checked-in spike]
- Installed `@inquirer/search@4.2.1` README and `dist/index.js` — pinned source signature, controller cleanup, and stale-publication guard. [VERIFIED: installed package files]

### Secondary (official documentation)

- https://git-scm.com/docs/git-branch — `--list` wildcard patterns, `--ignore-case`, `--sort`, `--format`, `--no-color`, local/remotes behavior. [CITED: official Git docs; page reports no changes from 2.51.1 through 2.55.0 and compatibility entries through project floor]
- https://git-scm.com/docs/git-log — `--stdin` and `--no-walk=unsorted`. [CITED: official Git docs]
- https://git-scm.com/docs/pretty-formats — `%H`, `%h`, `%x00`. [CITED: official Git docs]
- https://github.com/SBoudrias/Inquirer.js/blob/main/packages/search/README.md — async source and AbortSignal contract, corroborated by the pinned installed package. [CITED: official project docs]

### Tertiary (LOW confidence)

- None used for implementation decisions. [VERIFIED: source inventory]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all components already installed and pinned; no new dependency. [VERIFIED: package/environment]
- Architecture: HIGH — Phase 09 implementation and verification already establish every lifecycle boundary. [VERIFIED: code and phase artifacts]
- Git command/parsing approach: HIGH — official docs, checked-in executable spike, and existing production parsers agree. [VERIFIED/CITED: sources above]
- Pitfalls: HIGH — directly observable in current code or measured by the checked-in spike. [VERIFIED: source/spike]

**Research date:** 2026-07-30
**Valid until:** 2026-08-29 (stable Git/project contract; recheck only if Git floor, Inquirer version, or Phase 09 seams change)
