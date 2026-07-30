# Stack Research

**Domain:** Staged source discovery for Compare's local-first TypeScript/Node CLI
**Milestone:** v1.2 Fast Source Discovery
**Researched:** 2026-07-30
**Confidence:** MEDIUM — the recommendation is supported by current official Node, Git, Inquirer, and npm sources plus the repository's measured 10,000-ref spike; implementation still needs benchmark proof on Compare's supported Git 2.43.0 floor.

## Executive Recommendation

**Add and upgrade nothing for v1.2.** The existing stack already contains every required capability:

- Node.js 24 provides cancellable, bounded native subprocess execution through `node:child_process` and `AbortSignal`.
- Installed Git remains the source of truth for current-branch, worktree, ref, and object-ID discovery.
- `@inquirer/search@4.2.1` already supports an asynchronous `source(term, { signal })` function, which is the exact seam needed to return eager choices immediately and defer branch lookup until typing begins.
- The existing `GitRunner` already centralizes argument-array spawning, `shell: false`, cancellation, timeout, stdout/stderr limits, and non-interactive Git configuration.

The v1.2 work is therefore an integration and query-shaping change, not a stack change. Keep all validated comparison, picker ordering, identity, dirty-state, unavailable-worktree, and recovery behavior behind the same existing boundaries.

## Stack Decision Summary

| Area | Existing Choice | v1.2 Decision | Addition or Change |
|------|-----------------|---------------|--------------------|
| Runtime | Node.js `>=24` | Keep Node 24 LTS; latest Node 24 release is 24.18.1 on the research date | None |
| Language | TypeScript 7.0.2 | Keep existing strict TypeScript implementation | None |
| Git authority | Installed Git `>=2.43.0` with positive capability probes | Keep native Git; add only read-only filtered and batched invocations through the existing runner | No new executable or library |
| Interactive picker | `@inquirer/search@4.2.1` | Keep the pinned package; 4.2.1 is also the current npm `latest` release | None |
| Process boundary | `node:child_process.spawn` through `createGitRunner()` | Reuse it and forward Inquirer's search `AbortSignal` | None |
| Performance evidence | Existing large-repository benchmark and spike scripts | Extend production planning around the same 10,000-ref fixture and separate readiness/search budgets | No benchmark package |
| Persistence/indexing | No branch index or recency state | Keep none | None |

## Recommended Stack

### Core Technologies

| Technology | Version | Status | Purpose | Why Recommended |
|------------|---------|--------|---------|-----------------|
| Node.js | `>=24`; 24.18.1 is current LTS release | Existing; keep | CLI runtime, subprocess lifecycle, cancellation, byte buffers | Node 24 `spawn(command, args, options)` defaults to no shell and supports `AbortSignal`, timeouts, and pipe-based stdio. This already covers bounded Git work without another process library. |
| Git CLI | `>=2.43.0` project baseline; current official docs are 2.55.0 | Existing external prerequisite; keep | Repository, current branch, registered worktree, filtered local-ref, full-OID, and abbreviated-OID authority | The product already requires Git and positively probes machine protocols. `git branch --list` supports patterns, `--ignore-case`, and custom ref formatting; `git log` supports `--stdin`, `--no-walk`, and abbreviated commit formats. |
| TypeScript | 7.0.2 | Existing; keep | Typed staged-discovery and prompt contracts | The source function, cancellation, candidate union, and recovery contracts are already typed. A new abstraction or language would only create a second boundary. |

### Supporting Libraries and Native APIs

| Library or API | Version | Status | Purpose | When to Use |
|----------------|---------|--------|---------|-------------|
| `@inquirer/search` | 4.2.1, current npm `latest` | Existing; keep | Ordered searchable base/head prompt | Use its async `source(term, { signal })`: return eager current-branch/worktree choices for empty input; query branches only for a non-empty term. |
| `node:child_process` | Node 24 built-in | Existing; keep | Spawn Git with argument arrays and no shell | Use only through the existing `GitRunner`, not directly from picker code. Forward the current prompt signal so superseded searches stop promptly. |
| `AbortController` / `AbortSignal` | Node 24 built-in | Existing; keep | Cancellation ownership between Inquirer and Git | Treat each source invocation as replaceable work. A newer term must be able to abort the older Git request without surfacing a user-facing Git failure. |
| Existing `GitRunner` | Internal project module | Existing; extend call sites, not architecture | Safe environment, `shell: false`, input bytes, timeout, abort, and output caps | Reuse for eager discovery and both search calls. Set an explicit bounded stdout allowance only if the broad 10,000-result fixture proves the current cap insufficient. |

### Development and Verification Tools

| Tool | Version | Status | Purpose | Planning Guidance |
|------|---------|--------|---------|-------------------|
| Existing staged-discovery benchmark | Repository script | Existing; keep | Process-start-to-picker-ready and search round-trip measurement | Preserve separate 400 ms picker-readiness and 500 ms packed-ref search budgets. Run packed, loose, broad-query, and many-worktree scenarios. |
| Vitest | 4.1.10 | Existing; keep | Focused observable-contract coverage | Cover async source behavior, stale-query cancellation, literal pattern escaping, stable ordering, error/recovery ownership, and branch/worktree deduplication. Add no test framework. |
| Native Git fixtures | Git `>=2.43.0` | Existing; keep | Real packed/loose ref behavior | `git pack-refs` belongs only in fixture setup. Compare must never invoke it against a user's repository. |

## Native Node/Git/Inquirer Integration

Plan the implementation around one existing prompt seam and one existing Git boundary:

1. **Open the picker without full branch enumeration.** The Inquirer source receives `term === undefined` for empty input. Return choices built from the already requested eager set: current branch plus registered worktrees. Do not start background enumeration merely because the prompt opened.
2. **Start branch search only for a non-empty term.** Escape Git wildcard metacharacters so the user's text remains a literal case-insensitive substring, then issue one read-only filtered listing equivalent to `git branch --list --ignore-case "*<escaped-term>*" --format=...`.
3. **Preserve byte-safe project conventions.** Request full OIDs and full ref names from Git, use explicit machine delimiters, validate output, and retain existing terminal-text escaping. Do not copy the spike's human-oriented parsing into production unchanged.
4. **Batch abbreviation.** Deduplicate matching full OIDs, send them through stdin to one `git log --no-walk=unsorted --abbrev=12 --format=%H%x00%h%x00 --stdin` process, then join abbreviations back by full OID. This keeps Git authoritative and process count constant with respect to branch count.
5. **Propagate cancellation.** Forward Inquirer's `signal` to `GitRunner.run`. A new keystroke can cancel obsolete work rather than allowing stale results to win or accumulating subprocesses.
6. **Return existing candidate shapes.** Merge matching branches with the eager current-branch/worktree candidates using the existing identity and ordering rules. Do not alter branch/worktree labels, dirty or unavailable states, ordered base/head selection, or recovery focus behavior.
7. **Keep resource use explicit.** Maintain timeout and stderr/stdout caps. Verify the widest 9,999-match benchmark against the production runner's byte cap; change the per-call cap only from measured output, not by removing the bound.

The measured spike validates this composition: two search subprocesses produced median packed-ref results in 20.4 ms for 100 matches and 63.8 ms for 9,999 matches. Loose-ref search remained correct at 798.5 ms. That is an accepted storage-layout limitation for v1.2, not evidence for a new dependency.

## Installation

No dependency or version change is required.

```bash
# Intentionally no npm install command for v1.2 source discovery.
# Keep package.json and package-lock.json unchanged.
```

The surrounding stack also remains unchanged: Commander, Fastify, Vue, Vite, Monaco, Zod, repository-local JSON persistence, and Playwright do not participate in branch search and must not be changed for this milestone.

## Alternatives Considered

| Recommended | Alternative | When the Alternative Would Be Appropriate | Why Not for v1.2 |
|-------------|-------------|-------------------------------------------|------------------|
| Existing `GitRunner` + native Git | `simple-git` | A new application that wants a convenience wrapper and accepts its abstraction | Compare already owns safer bounded byte protocols and native-Git semantics. A wrapper would not eliminate subprocesses and would add a second error/cancellation model. |
| Native Git | `isomorphic-git` or direct `.git` ref-file parsing | A browser-only product without an installed Git executable | It would duplicate Git semantics, mishandle repository storage/config variants, and violate the installed-Git authority constraint. |
| Inquirer's async `source` | Load every branch into memory, then use Fuse.js or another fuzzy-search library | A small static catalog already available in memory where fuzzy ranking is a product requirement | Enumeration is the scaling problem. A client-side matcher cannot make 10,000 loose refs cheaper to discover and would change established substring semantics. |
| One filtered list + one batched abbreviation call | Per-branch `rev-parse --short` | Never for this milestone | Serial subprocess count grows with matches and is the measured 96-second failure mode. |
| Git-side filtered lookup | Eager `for-each-ref` of all branches | Only if full inventory is required before interaction and measured repositories are small | It delays the picker and measured roughly 872 ms for 10,000 loose refs before any useful filtering. |
| No persistent state | SQLite, JSON index, recency cache, filesystem watcher | A future explicitly approved milestone requiring cross-session ranking or indexed loose-ref latency | It introduces invalidation, mutation, privacy, and lifecycle responsibilities explicitly excluded from v1.2. |
| Read-only queries | Running `git pack-refs` to meet the search budget | Fixture preparation only | It mutates repository ref storage. Compare must report correct loose-ref results without changing user state, even when they exceed 500 ms. |
| `spawn('git', argv, { shell: false })` | Shell command strings, `exec`, or interpolation | None at this trust boundary | Search text and repository data must never enter shell syntax; argument arrays preserve the existing security and portability boundary. |
| Direct `@inquirer/search` package | Replace with the `@inquirer/prompts` umbrella or another TUI | A broader prompt migration with independent product value | The installed direct package already exposes the required API. Migration adds no source-discovery capability. |
| Main event loop plus async subprocesses | Worker threads or a job-queue package | CPU-bound parsing proven to block interaction after subprocess work is fixed | Discovery is I/O-bound and the measured packed-ref path is already far below budget. Cancellation and bounded output are sufficient. |

## What NOT to Add or Change

| Avoid | Specific Problem | Use Instead |
|-------|------------------|-------------|
| Any Git JavaScript library | Duplicates native authority and existing runner behavior | Installed Git through `GitRunner` |
| Search/fuzzy-index dependency | Does not avoid ref enumeration; risks changing matching behavior | Git `branch --list --ignore-case` with escaped literal substring pattern |
| Generic concurrency limiter | Search requires a constant two-process pipeline, not a variable worker pool | Sequential list then one batch-abbreviation call, with prompt cancellation |
| Persistent or recency index | New state, invalidation, and mutation contract outside milestone | Stateless query per entered term |
| Automatic `git pack-refs` | Mutates user repository storage | Correct loose-ref search with relaxed latency |
| Per-branch subprocesses | O(branches) or O(matches) launch cost | One filtered list and one batched abbreviation process |
| Unbounded buffers or disabled timeouts | Broad searches can consume uncontrolled memory or hang the prompt | Existing runner limits, measured per-call sizing, and `AbortSignal` |
| Changes to comparison/session contracts | Risks already validated identities and recovery behavior | Confine changes to discovery timing and prompt-source data loading |
| Node 26 Current | Project requires an LTS baseline; Node 24 is the latest LTS line on the research date | Keep Node `>=24` for v1.2 |

## Stack Patterns by Repository Variant

**Empty search input:**
- Return only the eager current branch and registered worktrees.
- Do not enumerate all local branches or create a hidden cache.

**Non-empty search input:**
- Escape the term, query matching local branches with Git, then batch abbreviate unique OIDs.
- Cancel superseded work through the Inquirer-provided signal.

**Packed refs:**
- Enforce the 500 ms search budget in the 10,000-branch benchmark.
- Keep subprocess count constant regardless of result count.

**Loose refs:**
- Preserve complete, correct results through the same read-only commands.
- Record latency separately; do not mutate refs or introduce an index to force the packed-ref budget.

**Broad query:**
- Preserve all matching candidates and existing ordering.
- Verify bounded production output and memory against the 9,999-match fixture.

## Version Compatibility

| Package/API | Compatible With | v1.2 Guidance |
|-------------|-----------------|---------------|
| Node.js `>=24` | `@inquirer/search@4.2.1` requires Node `>=23.5.0 || ^22.13.0 || ^20.17.0` | Node 24 satisfies the package engine range. Keep the project engine floor. |
| Node.js 24 `child_process.spawn` | Standard `AbortSignal` | Existing runner already uses `signal`, `shell: false`, and piped stdio; no polyfill is needed. |
| Git `>=2.43.0` | Existing positive startup protocol probes | Preserve the minimum and capability probes. Add focused proof for the exact `branch --list --ignore-case --format` and `log --no-walk --stdin` forms at the supported floor rather than raising it without evidence. |
| TypeScript 7.0.2 | `@types/node@24.11.1` | Existing types cover `AbortSignal` and child-process options. Keep pinned versions. |
| `@inquirer/search@4.2.1` | Async source returning a promise of choices/separators | Update Compare's local source type to permit the documented promise result when implementing staged discovery; do not wrap the prompt in another library. |
| Vitest 4.1.10 | Existing Node 24 test environment | Reuse focused CLI/Git suites; no benchmark or mocking dependency is needed. |

## Downstream Planning Guidance

1. **Change the discovery contract before optimizing Git commands.** Split eager candidates from searchable branches while preserving the final `SourceCandidate` identity and picker ordering contract.
2. **Wire the async Inquirer source to the existing runner.** Forward cancellation and classify an abort as superseded prompt work, not repository failure.
3. **Implement the two-call search pipeline.** Escape literal terms, request byte-safe records, deduplicate OIDs, batch abbreviation, and reject malformed joins.
4. **Prove unchanged behavior.** Keep current branch/worktree visibility, duplicate suppression, dirty/unavailable labels, base/head order, retained selections, and recovery behavior.
5. **Measure the production path.** Verify process-start-to-ready and search round-trip separately in packed, loose, broad-query, and many-worktree fixtures. Count Git processes; no branch-count-dependent process path is acceptable.
6. **Do not turn the loose-ref result into scope creep.** Correctness is required; the 500 ms guarantee is packed-ref-specific. A persistent index or repository mutation requires a future product decision, not a stack workaround.

## Sources

### Authoritative external sources

- [Node.js release status](https://nodejs.org/en/about/previous-releases) — verifies Node 24.18.1 as the latest LTS release and Node 26 as Current on 2026-07-30.
- [Node.js 24 `child_process` documentation](https://nodejs.org/docs/latest-v24.x/api/child_process.html#child_processspawncommand-args-options) — verifies argument-array spawning, default `shell: false`, `AbortSignal`, timeout, and stdio options.
- [`@inquirer/search` official README](https://github.com/SBoudrias/Inquirer.js/blob/main/packages/search/README.md) — verifies async `source(term, { signal })`, undefined empty term, choices/separators, and cancellation signal.
- [`@inquirer/search` npm registry `latest`](https://registry.npmjs.org/%40inquirer%2Fsearch/latest) — verifies version 4.2.1 and its Node engine range on the research date.
- [`git branch` documentation](https://git-scm.com/docs/git-branch) — verifies `--list` pattern filtering, `--ignore-case`, `--format`, and read-only list semantics; the documentation is unchanged through current Git 2.55.0.
- [`git log` documentation](https://git-scm.com/docs/git-log) — verifies `--stdin`, `--no-walk`, `--abbrev-commit`, and `%h`; current page updated for Git 2.55.0.
- [`git worktree` documentation](https://git-scm.com/docs/git-worktree) — authoritative registered-worktree listing semantics retained by eager discovery.
- [`git pack-refs` documentation](https://git-scm.com/docs/git-pack-refs) — confirms packing changes ref storage, supporting fixture-only use.

### Repository evidence

- [`package.json`](../../package.json) — exact existing Node engine and dependency versions.
- [`src/git/runner.ts`](../../src/git/runner.ts) — existing safe, bounded, cancellable native-Git process boundary.
- [`src/git/repository.ts`](../../src/git/repository.ts) — Git 2.43.0 minimum and positive capability checks.
- [`src/cli/picker.ts`](../../src/cli/picker.ts) — existing Inquirer source seam and validated ordered picker behavior.
- [`cli-startup-discovery.md`](../notes/cli-startup-discovery.md) — measured startup subprocess and latency findings.
- [`Spike 002: staged source discovery`](../spikes/002-staged-source-discovery/README.md) — 10,000-ref packed/loose, broad-query, and many-worktree measurements that support the no-new-dependency recommendation.

---
*Stack research for: Compare v1.2 Fast Source Discovery*
*Researched: 2026-07-30*
