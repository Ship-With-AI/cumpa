# Project Research Summary

**Project:** Compare
**Domain:** Fast, staged native-Git source discovery for a local ordered comparison picker
**Milestone:** v1.2 Fast Source Discovery
**Researched:** 2026-07-30
**Confidence:** HIGH for scope and architecture; MEDIUM for production performance until the implementation is measured on the supported Git floor

## Executive Summary

Compare is a local-first, single-developer code-review tool whose CLI must let users choose an ordered base and head from local branches or registered worktrees before opening the existing browser review flow. v1.2 is a focused discovery-latency milestone, not a new persistence or Git subsystem: make the picker usable from an eager snapshot of the current branch and registered worktrees, then search the remaining local branches only when the user types a non-empty term.

The recommended implementation keeps Node 24, TypeScript, `@inquirer/search`, native installed Git, and the existing bounded/cancellable `GitRunner`. Split the existing candidate authority into an eager snapshot and an abortable lazy branch-search closure, while leaving comparison pinning, review UI, persistence, exports, and all previously validated selection/recovery semantics unchanged. The main risks are asynchronous stale results, unbounded subprocess or buffer growth, and confusing storage-dependent performance with correctness. Signal propagation, stable identity maps, constant-process batching, explicit limits, and separate packed/loose verification address those risks without mutating repositories or adding an index.

## Key Findings

### Recommended Stack

No dependency or runtime upgrade is warranted. Node.js `>=24`, strict TypeScript, `@inquirer/search@4.2.1`, installed Git `>=2.43.0`, and the existing `GitRunner` already provide the required async source callback, argument-array spawning, `AbortSignal` cancellation, timeouts, byte limits, and Git-authoritative ref/object semantics. Keep Commander and the rest of the validated application stack untouched; v1.2 changes query timing and shape, not the browser/server/review stack.

**Core technologies:**
- **Native Git through `GitRunner`:** authoritative local refs, worktrees, full OIDs, and read-only filtering; avoids a second Git semantics or cancellation boundary.
- **Node.js 24 / TypeScript:** built-in abortable subprocesses and timers with existing strict contracts; no worker or job-queue dependency for this I/O-bound path.
- **`@inquirer/search@4.2.1`:** its async `source(term, { signal })` seam supports eager empty-term choices and superseded-query cancellation.
- **Git filtered listing plus one batched abbreviation call:** one filtered branch query followed by a `git log --no-walk --stdin` batch for unique OIDs avoids per-branch process fan-out.

Performance contracts are distinct: picker readiness is ≤400 ms from process start, and packed-ref search is ≤500 ms for 10,000 branches. Loose-ref search must remain complete and correct even when slower (the measured 10,000-ref case was about 798.5 ms). Do not pack refs, enlarge limits without measurement, or persist a recency/index state to disguise that trade-off.

### Expected Features

**Must (table stakes):**
- **Staged initial choices:** current attached branch and every registered worktree (including detached, dirty, and unavailable states) are usable/visible according to existing labels and disabling rules before full branch enumeration.
- **On-demand local-branch search:** non-empty input performs case-insensitive literal matching under `refs/heads/*`; wildcard characters remain literal, with canonical ref-name ordering independent of user `branch.sort`.
- **Identity and selection continuity:** branch IDs use full refs and full commit OIDs; worktree IDs use stable paths and committed HEAD state. Distinct refs/worktrees sharing an OID remain distinct. Base-before-head, suggested head, Back, retained selections, and ref-drift recovery remain unchanged.
- **Race-safe bounded work:** propagate the prompt signal through every Git call; return only the active term; use a constant/bounded process count and batch unique OIDs; distinguish cancellation, no matches, and actual failure.
- **Packed/loose parity:** packed refs meet the strict benchmark; loose refs return the complete authoritative result without mutation or false “no matches.”

**Should have (competitive):**
- **Useful-before-complete discovery:** users can begin comparison while large branch namespaces remain undiscovered.
- **Git-authoritative, stateless scale:** fast search without a private catalog, stale cache, daemon, or repository rewrite.
- **Honest storage-dependent behavior:** loading may remain visible for slow loose-ref searches rather than hiding or truncating correct results.

**Defer (v2+):**
- Remote-tracking refs, fuzzy or recency ranking, persistent branch indexes, cross-launch caches, watchers, and repository maintenance such as automatic `git pack-refs`.
- Debounce or alternate ref-storage optimization unless production measurements demonstrate a concrete need after cancellation and batching are correct.

### Architecture Approach

Integrate one discovery session into the existing modules. `candidates.ts` remains the sole source-discovery authority and returns an immutable eager snapshot plus `searchBranches(term, signal)`. `picker.ts` owns async prompt behavior, grouping, transient result rendering, and a prompt-lifetime stable-ID candidate registry. `run.ts` creates/recreates the session inside the existing selection/recovery loop and preserves role ordering. `runner.ts`, repository discovery, domain source contracts, comparison pinning, confirmation, server launch, and browser review remain their existing boundaries.

**Major components:**
1. **`src/git/candidates.ts`:** parse Git protocols, build current-branch/worktree candidates, classify availability, filter branches, and batch Git-derived abbreviations.
2. **`src/cli/picker.ts`:** return eager choices for empty input, invoke abortable search for non-empty terms, merge by stable source ID, preserve branch-before-worktree groups and Back behavior, and resolve lazy selections.
3. **`src/cli/run.ts`:** own one session per attempt, retain selected candidates through Base/Head and confirmation-back, and delegate ref-drift recovery unchanged.
4. **`src/git/runner.ts` / repository authority:** retain safe argument-array subprocesses, cancellation, timeouts, byte bounds, and canonical repository facts.
5. **Existing comparison/review pipeline:** re-resolve branch refs and pin immutable comparison identities exactly as before; no v1.2 changes to browser review, drafts, exports, or server behavior.

Data flow is: repository/root and worktree snapshot → bounded worktree enrichment → one abbreviation batch for eager OIDs → prompt opens; typed term → escaped Git filter → unique-OID abbreviation batch → immutable result installed in the candidate map → ordered selection → existing authoritative pinning and recovery.

### Critical Pitfalls

1. **Stale query overwrites newer query:** keep each source invocation self-contained, pass the exact `AbortSignal`, check it after awaits, and never mutate shared choices after return.
2. **Cancellation leaks Git children:** signal every filtered-list and abbreviation subprocess through `GitRunner`; do not translate abort into “no matches”; keep at most one active pipeline per picker.
3. **Lazy rows cannot be selected:** install completed results in the same stable-ID authority used for rendering before returning choices; retain branch/worktree identity semantics.
4. **Identity or recovery collapse:** merge by source ID, never OID/label; preserve duplicate refs/worktrees, selected Base/Head state, focus, Back, and role-specific ref-drift recovery.
5. **Performance work becomes unsafe or dishonest:** avoid per-branch processes, bound stdout/stderr/timeouts and worktree concurrency, skip empty batches, and treat loose-ref latency separately from packed-ref guarantees. Never auto-pack refs, return partial results as complete, or hide Git failures as empty results.

## Implications for Roadmap

The milestone should be planned as three dependent slices, with the performance gate last:

1. **Staged picker contract.** Split eager current-branch/worktree discovery from lazy branch search and add the prompt-lifetime stable-ID registry. Deliver usable empty-term choices, async source integration, branch/worktree grouping, candidate retention, Base→Head/Back continuity, cancellation ownership, and existing recovery/error semantics. This phase must avoid stale-result races, duplicate identity collapse, and state resets. It is an established Inquirer pattern but needs repository-specific contract tests.
2. **Bounded native-Git search.** Implement literal wildcard-safe filtering, explicit `--sort=refname`, NUL-safe full-ref/full-OID records, unique-OID batched abbreviation, bounded runner resources, and bounded worktree inspection. Deliver complete packed and loose results with typed distinction between cancellation, no matches, and search failure. This phase must prove process count does not scale with branches or matches and must not add dependencies, indexes, or mutations.
3. **Performance and safety gate.** Measure the production path, not only the spike: process-start-to-picker readiness ≤400 ms; packed 10,000-branch search ≤500 ms; loose 10,000-ref search complete/correct even if slower; broad 9,999-match output within explicit limits; rapid typing leaves no children; many-worktree and detached/dirty/unavailable cases preserve truth; repository refs/config remain unchanged. This phase is the acceptance gate before declaring v1.2 complete.

**Research flags:**
- Phase 1: focused research is optional for library API usage but required validation of existing picker/recovery contracts and async error ownership.
- Phase 2: plan with explicit Git 2.43.0 capability checks, output-size assumptions, literal escaping, OID format handling, and process-count instrumentation; research further only if the production runner or Git floor differs from the spike.
- Phase 3: no new architecture research is needed; it needs reproducible benchmark fixtures and safety assertions. Investigate only a measured failure, especially loose-ref performance or output limits.

Do not create roadmap work for remote refs, review UI, persistence, export, server, automatic packing, persistent/recency state, fuzzy ranking, or staged/unstaged content: those are either previously validated/out of scope or explicitly deferred beyond v1.2.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Official Node/Git/Inquirer capabilities and the spike support reuse; production proof on the supported Git 2.43.0 floor remains. |
| Features | HIGH | Milestone boundaries and preserved behavior are explicit; identifying-field parity needs focused production coverage. |
| Architecture | HIGH | Repository boundaries and measured native-Git integration are clear; external library details are less certain than local contracts. |
| Pitfalls | HIGH | Failure modes map directly to existing state, runner limits, and measured packed/loose behavior. |

**Overall confidence:** HIGH for roadmap scope and phase dependencies; MEDIUM for final latency claims.

### Gaps Address

- **Production benchmark equivalence:** run the actual CLI/picker path on supported Git versions and packed/loose fixtures; do not infer readiness from Git-only timings.
- **Existing identifying-field search parity:** explicitly cover full refs, full and abbreviated OIDs, kind aliases, worktree paths, and state labels without reintroducing eager all-branch enumeration.
- **Runner output limits and long names:** validate the 9,999-match fixture against production byte caps; preserve typed limit failures and user-visible narrowing guidance.
- **Interactive search failure rendering:** verify non-abort failures remain retryable and retain eager choices, while startup failures remain fatal and selection drift keeps existing recovery.
- **Git object/hash compatibility:** use Git-authoritative abbreviation mapping and test supported full-OID formats rather than slicing hashes in TypeScript.

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` — product core value, v1.2 goal, existing validated behavior, and hard boundaries.
- `.planning/research/FEATURES.md` — milestone scope, required behaviors, edge cases, anti-features, and budgets.
- `.planning/research/ARCHITECTURE.md` — module boundaries, data flow, cancellation/error ownership, and integration patterns.
- `.planning/research/PITFALLS.md` — race, identity, process, buffer, loose-ref, and recovery failure modes with verification signals.
- [Git branch documentation](https://git-scm.com/docs/git-branch) — filtered local-ref listing, literal escaping requirements, and ordering considerations.
- [Git log documentation](https://git-scm.com/docs/git-log) — stdin-fed no-walk abbreviation batching.
- [Inquirer search README](https://github.com/SBoudrias/Inquirer.js/blob/main/packages/search/README.md) — async source, empty-term behavior, separators, and abort signals.
- [Node.js child_process documentation](https://nodejs.org/api/child_process.html) — argument-array spawning and AbortSignal support.

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` — dependency/version decision and measured integration guidance.
- `.planning/notes/cli-startup-discovery.md` — startup observations and no-recency decision.
- `.planning/spikes/002-staged-source-discovery/README.md` — packed/loose, broad-query, and many-worktree measurements.
- Repository evidence in `src/git/runner.ts`, `src/git/candidates.ts`, `src/cli/picker.ts`, and `src/cli/run.ts` — existing contracts and safe Git boundary.

### Tertiary (LOW confidence)
- None. Remaining uncertainty is an implementation-validation gap, not reliance on an unverified source.

---
*Research completed: 2026-07-30*
*Ready roadmap: yes*
