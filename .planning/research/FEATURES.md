# Feature Research

**Domain:** Staged native-Git source discovery for an ordered local comparison picker
**Researched:** 2026-07-30
**Confidence:** HIGH for milestone scope and required behavior; MEDIUM for integration performance until the production path replaces the spike

## Milestone Scope

This research covers only **Compare v1.2 Fast Source Discovery**: make the existing ordered base/head picker interactive before all local branches are enumerated, then discover matching local branches on demand.

**In scope:** current-branch and registered-worktree initial choices, non-empty-query branch discovery, bounded or batched Git work, cancellation of obsolete searches, packed- and loose-ref correctness, deterministic candidate ordering, and the existing 10,000-branch performance benchmark.

**Must remain unchanged:** base-before-head selection, current-checkout head suggestion, Back behavior, retained selections, recovery after ref drift, branch/worktree identity, full commit pinning, dirty-worktree labels, unavailable-worktree disabling, detached-worktree handling, comparison semantics, and all browser review behavior.

**Budgets:** the picker must be usable within 400 ms of process start. Matching packed-ref results must appear within 500 ms in the 10,000-local-branch benchmark. Loose-ref results must remain complete and correct, but the 500 ms search budget does not apply to the measured 10,000-loose-ref case.

**Explicitly out of scope:** remote refs, repository maintenance, `git pack-refs`, a persistent branch index, branch-recency state, fuzzy or recency ranking, Git mutation, comparison changes, and background enumeration of every local branch merely to warm a cache.

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Requirement-ready behavior |
|---------|--------------|------------|----------------------------|
| Useful staged initial choices | A fast empty picker is not useful. The developer should be able to choose the likely sources immediately. | HIGH | Before all local branches are listed, show the current branch when attached and every registered worktree, including the current worktree. Preserve separate branch and worktree rows even when they resolve to the same commit. |
| No eager enumeration of remaining branches | Enumerating 10,000 branches before prompt interactivity defeats the milestone. | HIGH | With an empty search term, do not enumerate or enrich all other local branches. Clearing a query returns to the staged initial set rather than retaining a previously loaded full inventory. |
| On-demand local-branch search | Users still need any local branch, not only the current checkout and worktrees. | HIGH | After the user enters a non-empty term, return matching `refs/heads/*` candidates. Matching remains case-insensitive and literal: wildcard metacharacters in user input do not broaden the query. |
| Existing identifying-field search continuity | The shipped picker searches labels, full refs, full and short OIDs, kind aliases, worktree paths, detached/attached state, and availability text. A performance refactor must not silently narrow discoverability. | HIGH | A term matching an existing branch or worktree identifying field produces that candidate. The chosen spike directly proves branch-name filtering; full-ref/OID/kind-alias coverage therefore needs explicit production coverage rather than being assumed from the prototype. |
| Deterministic branch-before-worktree presentation | The ordered picker already groups local branches before worktrees. Refactoring data arrival must not change selection meaning or scanning order. | MEDIUM | Keep the `Local branches` group before `Worktrees`; order branch matches by canonical ref name rather than repository-specific `branch.sort`, arrival timing, popularity, or recency. Keep registered worktrees in the existing Git-derived order. |
| Git-authoritative candidate identity | Comparisons are pinned to immutable commit IDs. A fast label without a trustworthy object ID is not selectable authority. | HIGH | Each branch result has its stable `branch:refs/heads/...` ID, label, full ref name, full commit OID, and Git-derived unique abbreviation. Each worktree keeps its stable path ID and committed `HEAD` identity. |
| Duplicate-identity preservation | Multiple branches and worktrees may legitimately point to the same commit but still represent different user-selected sources. | MEDIUM | Do not deduplicate candidates by commit OID. Deduplicate only the batched abbreviation work for identical OIDs; retain every source row and source ID. |
| Truthful worktree state in the initial set | Dirty and unavailable worktrees are already validated user-visible behavior and affect selection eligibility. | HIGH | Dirty worktrees remain selectable with `Dirty — committed HEAD only`; staged, unstaged, and untracked bytes remain excluded. Prunable, bare, missing, or otherwise unresolved registered worktrees remain visible and disabled with the existing recovery text. Detached worktrees remain visible as detached committed `HEAD` sources. |
| Search race safety | Search sources are asynchronous; a slower old query must not replace a newer result set. | MEDIUM | Propagate the `@inquirer/search` `AbortSignal` to Git work. If the term changes, obsolete work is canceled or its result is ignored. Only the latest active term may update choices. |
| Bounded/batched native-Git work | Process-per-branch behavior caused the 96-second baseline and scales with branch count. | HIGH | Branch search uses a constant or bounded number of native-Git subprocesses per query, with one filtered branch read and batched OID abbreviation rather than serial `rev-parse --short` calls. Worktree enrichment is bounded or batched rather than unbounded fan-out or serial startup work. |
| Packed- and loose-ref correctness | Git may store refs as loose files, `packed-refs`, or a mixture. Storage format is Git's concern, not a visibility rule. | HIGH | The same query returns the same matching branch identities regardless of ref storage. Packed refs meet the performance budget; loose refs may be slower but may not be omitted, truncated, timed out as “no matches,” or require mutation. |
| Explicit empty and failure states | “No result” and “Git failed” are materially different. | MEDIUM | A successful empty query keeps both group separators and the existing non-selectable no-match message. A failed Git search follows existing launch error/recovery conventions; it is not rendered as an empty result set and does not fall back to stale choices. |
| Selection and drift recovery continuity | Refs can move or disappear between discovery and comparison creation. Existing recovery preserves the opposite role and reprompts the failed role. | HIGH | A searched candidate selected as base or head remains available to the state machine by stable ID. Back, confirmation-back, retained base/head, and post-selection ref-drift recovery work without forcing eager enumeration of every branch. |
| Measured readiness and search latency | “Feels fast” is not acceptance for a 10,000-branch milestone. | MEDIUM | Measure process-start-to-usable-prompt separately from active-term-to-rendered-results. Pass 400 ms picker readiness and 500 ms packed-ref search in the existing benchmark, including broad matches and the many-worktree probe. |
| Read-only, session-ephemeral discovery | Compare is local-first and must not rewrite repository metadata to improve its own latency. | LOW | Discovery invokes read-only Git commands, writes no refs or config, runs no maintenance, and stores no branch inventory or recency history across launches. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Useful-before-complete discovery | The developer can start an ordered comparison while a large branch namespace remains undiscovered. | HIGH | This is progressive disclosure, not a loading placeholder: current checkout and registered worktrees are real selectable sources. |
| Scale without a private source of truth | Compare gets fast packed-ref search while Git remains the only authority. | HIGH | No database, file index, daemon, recency file, or repository rewrite can become stale or disagree with Git. |
| Honest loose-ref behavior | Correctness wins when Git's own loose-ref scan exceeds the target. | MEDIUM | The product distinguishes a packed-ref performance guarantee from a storage-independent correctness guarantee instead of hiding slow repositories or changing them. |
| Ordered-picker continuity | The optimization is invisible to the review model: users still choose base first and head second, with the current checkout suggested only for head. | HIGH | Preserving the existing state machine avoids turning a discovery milestone into a comparison or recovery rewrite. |
| Git-authoritative batching | Full and abbreviated IDs remain native-Git results while subprocess count no longer grows per matching branch. | HIGH | The spike's filtered `git branch` plus one `git log --no-walk --stdin` abbreviation batch met the packed-ref budget even for 9,999 matches. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Eagerly enumerate every local branch before opening the prompt | Simplifies the current `candidates[]` API. | It preserves the startup bottleneck and makes readiness proportional to branch count. | Build the initial current-branch/worktree set first; search remaining branches through the prompt source callback. |
| Enumerate all branches in the background after the prompt opens | Appears to combine fast startup with instant later search. | It still performs unrequested O(N) work, competes with the user's first query, and creates an in-memory inventory the milestone does not need. | Run only the active query and discard query-local data when no longer needed. |
| One Git subprocess per branch or matching branch | Is straightforward for abbreviation and validation. | Process startup dominates at scale; the production baseline took about 96 seconds with 10,000 refs. | Batch object IDs through one native-Git invocation and reuse abbreviations for duplicate OIDs. |
| Run `git pack-refs` automatically | Makes the benchmarked loose-ref repository fast. | It writes `packed-refs` and normally removes loose refs; discovery would mutate user repository state. | Accept slower loose-ref search while remaining correct; let users and Git maintenance own ref storage. |
| Persistent branch index or recency database | Promises instant search and “smart” ordering. | It introduces invalidation, stale identities, new persistence semantics, privacy/state cleanup, and a second authority beside Git. | Query Git on demand and preserve deterministic ref-name ordering. |
| Session-wide fuzzy or recency ranking | Seems friendlier than literal substring search. | It changes validated ordering, makes results less predictable, and does not address the actual subprocess bottleneck. | Keep case-insensitive literal matching and canonical ordering. |
| Silent result caps or pagination that changes completeness | Reduces rendering work for broad queries. | A matching branch can disappear without explanation, and the spike already passes with 9,999 packed-ref matches. | Return the complete match set for the established search contract; revisit explicit limits only with a separate user-facing requirement. |
| Drop or time out loose refs to protect the 500 ms number | Makes performance dashboards green. | It violates source correctness and can produce false “no matches.” | Exempt loose-ref latency from the strict budget while keeping results complete. |
| Search remote-tracking refs | More choices appear useful. | v1 comparisons are defined around local branches and registered worktrees; remote refs expand identity and product scope. | Restrict branch discovery to `refs/heads/*`. |
| Deduplicate rows by commit OID | Reduces a visually repetitive list. | It collapses distinct branch and worktree source identities and can change exported selection metadata. | Deduplicate only internal abbreviation work, never selectable sources. |
| Hide dirty or unavailable worktrees until requested | Makes initial discovery cheaper. | It removes registered sources and regresses validated truthfulness/recovery behavior. | Keep every registered worktree visible; use bounded enrichment and existing disabled/state labels. |
| Treat rejected or canceled search as “no matches” | Avoids designing error handling. | It masks Git failures, flashes stale/empty results during normal typing, and breaks recovery semantics. | Ignore expected cancellation; surface real Git errors through existing typed launch errors. |

## Expected Behavior and Edge Cases

| Given | When | Required user-visible outcome |
|-------|------|-------------------------------|
| Current checkout is attached to `refs/heads/main` | The base prompt first becomes usable | `main` appears in `Local branches`; all registered worktrees appear in `Worktrees`; no other branch inventory was required first. |
| Current checkout is detached | The prompt first becomes usable | No fabricated current-branch row appears. The current registered worktree appears as `Detached HEAD` and remains the suggested head when available. |
| Current branch and current worktree point to the same commit | Initial choices render | Both rows remain because branch and worktree are distinct source identities. |
| Two branches point to one commit | Their shared query matches | Both branch rows appear with distinct stable IDs; Git abbreviation work may be shared. |
| A registered worktree is dirty | Initial choices render | It is selectable, clearly labeled `Dirty — committed HEAD only`, and comparison still uses committed `HEAD`. |
| A registered worktree is missing, prunable, bare, or cannot resolve `HEAD` | Initial choices render | It remains visible but disabled with the existing unavailable explanation. |
| Search input is empty or cleared | The source callback runs | Only the staged current-branch and worktree choices are returned; remaining branches are not eagerly loaded. |
| Search input contains mixed case | Results update | Matching is case-insensitive. |
| Search input contains `*`, `?`, `[`, `]`, or `\` | Results update | Those characters are treated as literal query text, not Git glob control or shell syntax. |
| Search input matches a label, `refs/heads/...` identity, displayed abbreviation, full OID, or the established branch kind alias | Results update | The corresponding branch candidates appear. The production implementation must cover these existing fields; the spike's name filter alone is not sufficient evidence for all of them. |
| Search matches a worktree path, label, OID, detached/attached state, or clean/dirty/unavailable state | Results update | Matching registered worktree rows remain available using the shipped identifying-field behavior. |
| A query matches no source | Results settle successfully | Both group headings remain and the non-selectable “No branches or worktrees match this search.” message appears. Head selection still exposes Back. |
| A broad query matches nearly all 10,000 packed refs | Results update | All matches remain selectable, canonically ordered, and arrive within the 500 ms packed-ref budget. |
| A newer term arrives before the previous Git query completes | The old query settles later | Only the newer term's results are shown; cancellation is not presented as an error. |
| Repository uses 10,000 loose refs | A matching query runs | Results are complete and correct even when the measured search exceeds 500 ms. Compare does not pack refs, persist an index, or pretend the query had no matches. |
| A branch moves or is deleted after it was shown | The user confirms the ordered selection | Existing descriptor validation and role-specific recovery run; the unaffected base or head is retained exactly as today. |
| The user presses Back from head selection | Base/head ordering resumes | The picker returns to base selection and then asks for head again; staged discovery does not reverse or collapse the roles. |
| The user returns from comparison confirmation | Head selection resumes | The selected base remains retained, and searched candidates can be rediscovered without enumerating every branch. |
| Repository config defines a custom `branch.sort` | Branch search returns matches | Result order still matches Compare's established canonical ref-name order. |
| Git search fails for a reason other than cancellation | Results cannot be produced | The existing launch error path is used; stale results and the no-match message are not substitutes for the failure. |

## Feature Dependencies

```text
[Repository discovery]
    └──requires──> [Native Git runner with AbortSignal]

[Staged initial choices]
    ├──requires──> [Current checkout identity]
    ├──requires──> [Registered worktree inventory]
    ├──requires──> [Bounded worktree HEAD/status enrichment]
    └──enables───> [Usable ordered picker within 400 ms]

[On-demand branch search]
    ├──requires──> [Non-empty prompt term]
    ├──requires──> [Literal case-insensitive refs/heads filtering]
    ├──requires──> [Batched full-OID abbreviation]
    ├──requires──> [Canonical ref-name ordering]
    ├──requires──> [Abort/stale-result protection]
    └──enables───> [Any local branch remains selectable]

[Stable candidate IDs and query-local candidate retention]
    ├──requires──> [Branch/worktree identity contract]
    ├──enables───> [Base then head state machine]
    ├──enables───> [Back and confirmation-back]
    └──enables───> [Role-specific ref-drift recovery]

[Packed-ref performance] ──enhances──> [On-demand branch search]
[Loose-ref correctness] ──required-regardless-of──> [Packed-ref performance]
[Automatic pack-refs] ──conflicts──> [Read-only discovery]
[Persistent/recency index] ──conflicts──> [Git-only authority]
[Fuzzy/recency ranking] ──conflicts──> [Established deterministic ordering]
```

### Dependency Notes

- **Staging changes the discovery/picker seam, not the picker state machine.** The current CLI awaits one complete `discoverSourceCandidates()` result and gives `pickOrderedSources()` a fixed array. v1.2 needs an initial-choice operation plus an asynchronous query operation, while keeping the same candidate identities and ordered selection outcomes.
- **Recovery needs candidates that were not initial choices.** A previously selected non-current branch may need to remain the retained base/head or regain focus after drift. The staged provider must preserve or exactly re-resolve that stable branch ID; it cannot assume every relevant candidate lives in the initial set.
- **Git filtering is not the whole search contract.** `git branch --list --ignore-case` efficiently narrows names, but the shipped picker also searches full refs, OIDs, aliases, paths, and state text. Production acceptance must exercise those fields or explicitly change the product contract; they must not disappear accidentally as an implementation side effect.
- **Ordering must be explicit.** The old branch inventory uses `--sort=refname`. A raw `git branch --list` can respect repository `branch.sort`; v1.2 must request Compare's canonical order rather than inheriting user configuration or asynchronous completion order.
- **Batched abbreviation follows filtering.** Git should abbreviate only matching unique OIDs, not every local branch and not one OID per subprocess. Full candidate rows are then reconstructed without merging distinct refs that share an OID.
- **Cancellation is part of correctness.** `@inquirer/search` supplies an `AbortSignal` whenever the term changes. The Git runner already accepts signals; the source provider must propagate them and prevent late results from replacing current choices.
- **Initial worktree truth has an unavoidable bounded cost.** Dirty/unavailable state and committed `HEAD` are validated behavior. The fix is bounded concurrency or batching, not hiding worktrees, removing state, serializing all checks, or spawning an unbounded pair of processes per worktree.
- **Performance budgets measure different paths.** Readiness covers module load, repository/current-worktree discovery, initial enrichment, and prompt usability. Search latency starts with an active term and ends when matching choices are available. Passing one does not imply passing the other.

## MVP Definition

### Launch With (v1.2)

- [ ] Current attached branch and all registered worktrees are selectable before remaining local branches are enumerated.
- [ ] Detached, dirty, clean, and unavailable worktree behavior remains exactly visible and truthful.
- [ ] Empty input returns only staged choices; non-empty input performs case-insensitive literal local-branch search.
- [ ] Existing identifying-field matching, group order, canonical branch order, head suggestion, Back, retained-selection, and recovery behavior are preserved.
- [ ] Matching branches carry stable IDs, full refs, full commit OIDs, and batched Git-derived abbreviations; duplicate-OID sources remain separate.
- [ ] Stale asynchronous searches cannot replace newer results.
- [ ] Branch subprocess count is bounded per query and never grows one-for-one with branch count.
- [ ] Discovery is read-only and creates no persistent or recency state.
- [ ] Packed and loose refs return the same correct matches; only packed refs carry the strict 500 ms guarantee.
- [ ] Existing large-repository evidence proves a usable picker within 400 ms and packed-ref results within 500 ms, including broad-match and many-worktree cases.

### Add After Validation (v1.x)

- [ ] Add a small input debounce only if production measurement shows rapid typing creates avoidable overlapping Git work after cancellation is correct. Do not add it speculatively or let it consume the 500 ms result budget.
- [ ] Optimize additional ref-storage backends only when a reproducible repository shows a correctness or performance gap; use Git's public commands rather than reading storage files directly.

### Future Consideration (v2+)

- [ ] Remote-tracking branch discovery — only with an explicit product decision about local/remote source identity.
- [ ] Fuzzy or relevance ranking — only as a separate picker-behavior change with deterministic tie-breaking and recovery coverage.
- [ ] A persistent index — only if loose-ref latency becomes a hard requirement and the product accepts invalidation, privacy, and second-authority costs. It is not part of v1.2.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Staged current-branch/worktree initial choices | HIGH | HIGH | P1 |
| Empty-term avoidance of full branch enumeration | HIGH | MEDIUM | P1 |
| On-demand local-branch search | HIGH | HIGH | P1 |
| Stable Git identity and batched abbreviations | HIGH | HIGH | P1 |
| Existing ordered picker and recovery continuity | HIGH | HIGH | P1 |
| Async cancellation and stale-result protection | HIGH | MEDIUM | P1 |
| Deterministic grouping and ref-name ordering | HIGH | MEDIUM | P1 |
| Packed/loose result parity | HIGH | HIGH | P1 |
| 400 ms readiness benchmark | HIGH | MEDIUM | P1 |
| 500 ms packed-ref search benchmark | HIGH | MEDIUM | P1 |
| Optional measured debounce | MEDIUM | LOW | P2 |
| Remote refs | LOW for this milestone | HIGH | P3 / OUT OF SCOPE |
| Fuzzy or recency ranking | LOW for this milestone | HIGH | P3 / OUT OF SCOPE |
| Persistent branch index | OUT OF SCOPE | HIGH | P3 / OUT OF SCOPE |
| Automatic repository packing | NEGATIVE | MEDIUM | DO NOT BUILD |

**Priority key:**
- **P1:** Required for v1.2 acceptance.
- **P2:** Only after the complete staged flow passes and measurement proves a need.
- **P3:** Separate future product scope.

## Complexity and Current-Code Implications

| Area | Complexity driver | Existing dependency |
|------|-------------------|--------------------|
| Discovery API split | Current discovery returns one fully enriched array only after branch and worktree enumeration. Staging requires separate initial and query paths. | `src/git/candidates.ts`, `src/cli/run.ts` |
| Prompt data source | Current `sourceForPrompt()` only filters a fixed in-memory array synchronously. It must combine staged choices with asynchronous query results without changing prompt semantics. | `src/cli/picker.ts`, `@inquirer/search` 4.2.1 |
| Candidate retention | Searched branches must remain resolvable after selection, Back, confirmation-back, and role-specific recovery even though they were not initial candidates. | `pickOrderedSources()`, `runCli()` |
| Existing search fields | Filtered branch-name lookup does not automatically preserve OID, full-ref, short-OID, and kind-alias queries. | `candidateMatches()`, `tests/cli/selection.test.ts` |
| Stable ordering | The old inventory explicitly sorts by ref name; `git branch` can use repository configuration unless Compare supplies its own sort. | Current `for-each-ref --sort=refname`, picker group construction |
| Batched abbreviations | One batch must map unique full OIDs back to every matching ref while handling duplicate-OID branches correctly. | `BranchCandidate` identity contract, native Git output parsing |
| Worktree readiness | Every registered worktree needs committed `HEAD`, abbreviation, dirty status, availability, and current-checkout identity before initial interaction. | `git worktree list --porcelain -z`, current status/HEAD probes |
| Cancellation | Git child processes and result publication must both honor the prompt's changing `AbortSignal`. | `GitRunner`, `SourceSearchPromptConfig.source` |
| Ref drift | Discovery results are snapshots; comparison creation remains the authority and can fail after a ref moves or disappears. | Existing launch errors and recovery loop in `src/cli/run.ts` |
| Benchmark boundary | A module-load-only or discovery-only timer does not prove prompt usability; a Git-only timer does not prove rendered search results. | Existing 10,000-ref spike/benchmark harness |

## Behavioral Baseline Analysis

| Capability | Shipped Compare behavior | Platform/spike evidence | v1.2 requirement |
|------------|--------------------------|-------------------------|------------------|
| Initial source callback | Picker receives every candidate after eager discovery. | `@inquirer/search` calls `source` with `undefined` for empty input and permits default choices. | Return staged current-branch/worktree choices immediately; do not enumerate remaining branches. |
| Typed search | Fixed candidates are filtered case-insensitively across identifying text. | Inquirer supports asynchronous choices and passes an `AbortSignal` when the term changes. | Query Git for matching branches, merge with matching staged worktrees, and suppress stale results. |
| Branch inventory | `for-each-ref --sort=refname` returns every local branch before the prompt. | Filtered `git branch --list --ignore-case` plus one batched `git log` call took 20.4 ms median for 100 packed-ref matches. | Defer branch work until search and keep explicit canonical order. |
| Broad search | Every in-memory match is returned. | The spike returned 9,999 packed-ref matches in 63.8 ms median. | Do not silently cap complete results. |
| Loose refs | Current eager discovery is correct but slow at scale. | The staged spike returned correct matches in 798.5 ms median for 10,000 loose refs. | Preserve correctness; document that the strict 500 ms target applies to packed refs only. |
| Worktree state | Current, linked, detached, duplicate-OID, dirty, and unavailable worktrees are represented. | Four worktrees yielded five initial choices in 149.7 ms; 32 worktrees reached readiness in 250.6 ms in the spike. | Keep all registered worktree semantics while bounding enrichment work. |
| Ordered flow | Base first, then head; current checkout suggested only for head; Back and recovery preserve roles. | Existing CLI tests and `runCli()` state machine encode these outcomes. | Replace only the source provider, not the ordering or recovery contract. |

## Sources

### Authoritative local sources

- **[L1]** `.planning/PROJECT.md` — v1.2 goal, active requirements, 400/500 ms budgets, and unchanged product constraints.
- **[L2]** `.planning/notes/cli-startup-discovery.md` — measured startup observations and the decision to show current branch/worktrees before on-demand branches without recency persistence.
- **[L3]** `.planning/spikes/MANIFEST.md` — benchmark requirements and partial staged-discovery verdict.
- **[L4]** `.planning/spikes/002-staged-source-discovery/README.md` — approach comparison, process counts, packed/loose results, broad-query and 32-worktree probes, and explicit no-mutation conclusion.
- **[L5]** `.planning/spikes/002-staged-source-discovery/benchmark.mjs` — prototype query escaping, filtered `git branch` call, batched `git log --no-walk --stdin`, and measurement boundary.
- **[L6]** `src/cli/picker.ts` and `tests/cli/selection.test.ts` — shipped grouping, identifying-field matching, no-match copy, suggested head, Back, and base/head ordering.
- **[L7]** `src/cli/run.ts` — discovery-before-picker baseline, selection retention, confirmation-back, and role-specific ref-drift recovery.
- **[L8]** `src/git/candidates.ts`, `src/domain/source.ts`, and `tests/git/candidates.test.ts` — current native-Git candidate identities and dirty, detached, duplicate-OID, and unavailable-worktree behavior.

### Current official documentation

- **[S1]** [Inquirer.js `@inquirer/search` README](https://github.com/SBoudrias/Inquirer.js/blob/main/packages/search/README.md) — asynchronous source signature, `undefined` empty term, default choices, separators, disabled choices, and term-change `AbortSignal`; repository documentation updated in Context7 on 2026-07-15.
- **[S2]** [Git `branch` documentation](https://git-scm.com/docs/git-branch) — local branch listing, shell-wildcard patterns, `--list` requirement, multiple-pattern behavior, case-insensitive filtering, format, and sort controls; current page reports no changes through Git 2.55.0.
- **[S3]** [Git `log` documentation](https://git-scm.com/docs/git-log) — stdin revision input, `--no-walk=unsorted`, and unique abbreviated commit names; current page updated for Git 2.55.0 on 2026-06-29.
- **[S4]** [Git `pack-refs` documentation](https://git-scm.com/docs/git-pack-refs) — persistent ref packing and the normal removal of packed loose refs, confirming it is repository mutation rather than discovery; current page reports no changes through Git 2.55.0.

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Milestone boundaries and user outcomes | HIGH | PROJECT, exploration notes, manifest, and spike agree on staged choices, on-demand branches, no persistence/mutation, and separate budgets. |
| Existing picker dependencies | HIGH | Current source and focused tests directly encode grouping, ordering, suggestions, identity, dirty/unavailable state, Back, and recovery. |
| Packed-ref performance | HIGH for spike, MEDIUM for production integration | The representative benchmark passed narrow, broad, and many-worktree packed scenarios, but the production picker still uses eager discovery. |
| Loose-ref behavior | HIGH | The spike measured correct results and a 798.5 ms median; the milestone explicitly preserves correctness while relaxing the strict search budget. |
| Inquirer and Git capabilities | MEDIUM | Current official documentation and Context7 agree, but provider classification is MEDIUM and production integration remains to be implemented. |
| Existing identifying-field parity through filtered branch search | MEDIUM | The shipped picker contract is clear, but the chosen prototype directly validates branch-name filtering rather than every existing alias/ref/OID query path. This needs focused acceptance coverage. |

---
*Feature research for: Compare v1.2 Fast Source Discovery*
*Researched: 2026-07-30*
