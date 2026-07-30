# Pitfalls Research

**Domain:** Lazy asynchronous native-Git branch discovery in an existing ordered `@inquirer/search` picker
**Researched:** 2026-07-30
**Confidence:** HIGH

## Scope and Proposed Roadmap Placement

This research covers only v1.2 Fast Source Discovery. Existing ordered base/head selection, Git identity, dirty-state labeling, unavailable-worktree behavior, comparison pinning, and recovery behavior remain authoritative.

The current roadmap has not assigned v1.2 phase numbers. To make every warning actionable, this document uses these proposed phases:

1. **Phase 09 — Staged Picker Contract:** split eager current-branch/worktree discovery from lazy branch search while preserving stable identities, ordered selection, recovery, cancellation, and error ownership.
2. **Phase 10 — Bounded Native-Git Search:** implement literal filtered branch lookup and Git-authoritative batched abbreviation with bounded process, input, output, and concurrency behavior.
3. **Phase 11 — Performance and Safety Gate:** verify the production path against packed and loose refs, rapid typing, broad results, worktree edge cases, and a repository non-mutation invariant.

## Critical Pitfalls

### Pitfall 1: An older search overwrites a newer term

**What goes wrong:**
A slow search for `f` completes after a fast search for `fea`, and the picker displays results for `f` under the `fea` input. A related failure occurs when an old promise mutates a shared candidate array after the prompt has moved on.

**Why it happens:**
Asynchronous completion order is not request order. `@inquirer/search` aborts the previous source call when the term changes and checks that call's signal before installing its result, but this protection is lost if the integration ignores the supplied signal, launches detached work, or mutates state outside the source result.

**How to avoid:**
- Keep each source invocation self-contained: return one immutable result for that term and do not push later results into a shared array.
- Forward the prompt's `AbortSignal` through every Git call in that search pipeline.
- Check `signal.throwIfAborted()` between branch listing, parsing, and the abbreviation batch so an obsolete query cannot start its second process.
- If results are ever stored outside the prompt source, gate installation by the exact term or a monotonically increasing request generation in addition to the signal. Do not add that state if the prompt-owned signal is sufficient.
- Preserve the literal term associated with each result; never read a mutable “current term” after awaiting Git.

**Warning signs:**
- Typing quickly makes the result list grow broader again.
- A result label does not contain the visible query.
- Source code starts work without using the provided `signal`.
- An async callback calls `candidates.push(...)` after the source has returned.

**Verification signal:**
Delay query A, issue query B, then release A. Only B's rows may become selectable; A must neither update the list nor populate the selectable-candidate map.

**Phase to address:**
Phase 09 — Staged Picker Contract.

---

### Pitfall 2: Cancellation hides stale UI but leaves Git processes running

**What goes wrong:**
The picker looks correct because Inquirer ignores an aborted result, yet every keystroke leaves `git branch` or `git log` running. Rapid typing produces overlapping subprocesses, delayed exit, excess CPU and file I/O, or process-limit failures.

**Why it happens:**
Cancellation is both a correctness concern and a resource concern. Checking `signal.aborted` only after `await` prevents stale display but does not stop the child. The existing `GitRunner` already accepts a signal and aborts its spawned process; a new discovery layer can accidentally omit it or translate cancellation into a normal empty result.

**How to avoid:**
- Pass the exact source-call signal to both filtered listing and batched abbreviation.
- Do not catch `GitRunnerError` with kind `aborted` and return “no matches”; let the aborted source settle as cancellation.
- Skip the abbreviation command when listing produced no candidates.
- Allow at most one active search pipeline per picker. A replacement query must abort the previous pipeline before starting its second stage.
- Keep the runner's timeout and child termination behavior; do not replace it with an untracked `spawn`.

**Warning signs:**
- Process counts rise with characters typed rather than completed searches.
- Exiting the prompt waits for old Git commands.
- Cancelled searches flash “No branches match” or an error.
- The new code calls `spawn` directly instead of the bounded runner.

**Verification signal:**
Drive a rapid sequence such as `f`, `fe`, `fea`, `feat`; observe that superseded children are terminated, no cancellation message is shown, and the process count returns to zero after the final result settles.

**Phase to address:**
Phase 09 defines cancellation ownership; Phase 10 proves it reaches every Git subprocess.

---

### Pitfall 3: Lazy rows are visible but cannot be selected

**What goes wrong:**
A searched branch appears in the prompt, but pressing Enter throws “Base/Head selection did not identify an available source.”

**Why it happens:**
`pickOrderedSources` currently builds `candidateById` once from the eager `options.candidates`. A lazy source can return a new branch ID without adding the corresponding `SourceCandidate` to the selection authority. Rendering and selection then use different inventories.

**How to avoid:**
- Define one prompt-lifetime candidate authority keyed by stable source ID.
- Install a completed, non-aborted search batch into that authority before returning its rows.
- Resolve the chosen ID to the exact candidate that produced the displayed row.
- Keep branch selection on the existing live-ref path (`revision: refName`) and worktree selection on its committed `HEAD` snapshot; do not silently change identity semantics to make lookup easier.
- Reject unknown values explicitly as the current picker does.

**Warning signs:**
- Prompt tests assert labels but never submit a lazily discovered row.
- The search service returns display objects with no corresponding domain candidate.
- Selection uses a map created before the first query.

**Verification signal:**
Select a branch that is absent from the eager set and present only in search results as both base and head in separate runs. The existing descriptor and recovery paths must receive its stable branch ID and ref name.

**Phase to address:**
Phase 09 — Staged Picker Contract.

---

### Pitfall 4: Deduplication collapses distinct Git source identities

**What goes wrong:**
The current branch is shown twice as the same branch row, or, in the opposite direction, valid branch and worktree rows disappear because they point to the same commit. Detached worktrees at the same OID may also collapse into one row.

**Why it happens:**
The eager current branch will also match a later branch search. That exact branch must be merged once. However, Compare intentionally permits several distinct source identities to share one commit. Existing IDs encode identity: `branch:<full-ref>` and `worktree:<path>`. Commit OID and display label are not identity keys.

**How to avoid:**
- Merge eager and lazy results by exact candidate `id`, not by `commitOid`, `shortOid`, label, branch leaf name, or `branchRef`.
- Let the lazy copy of the same `branch:<full-ref>` replace or confirm the eager copy; never append it as a second branch row.
- Preserve a worktree row even when its `branchRef` and OID match a branch row.
- Preserve multiple worktrees at the same commit because their paths, dirty states, availability, and detached states differ.
- Keep group ordering unchanged: local branches, then worktrees, with the existing Back action for head.

**Warning signs:**
- A `Map` is keyed by OID or label.
- Candidate count drops when several refs point to one commit.
- Searching the current branch shows two identical `[Branch]` rows.
- Selecting a worktree unexpectedly records a branch source.

**Verification signal:**
Use one current branch, another branch at the same OID, an attached worktree, and a detached worktree at that OID. Exact branch IDs are unique, the eager/search copy of the current branch appears once, and every distinct worktree remains selectable.

**Phase to address:**
Phase 09 — Staged Picker Contract.

---

### Pitfall 5: Result refresh destroys ordered selection and recovery state

**What goes wrong:**
Loading branches clears a chosen base, changes the suggested head, moves recovery focus to a different row, loses the typed recovery term, or recreates the prompt. A user can end up reviewing the reverse ordering from what they intended.

**Why it happens:**
The brownfield picker has state beyond a list: base must be chosen first; Back returns from head to base; current checkout is suggested only for head; descriptor failures preserve the opposite valid role and may focus the prior row. Inquirer's `default` is applied once, and each new result set resets the active cursor. Treating asynchronous results as a reason to reconstruct the picker discards these contracts.

**How to avoid:**
- Keep selected base/head as domain candidates outside transient result arrays.
- Do not recreate the prompt when a query finishes; let the source promise resolve once for that term.
- Preserve existing `initialBase`, `initialHead`, `recovery.searchTerm`, `focusedCandidateId`, and suggested-head rules.
- If a focused candidate is absent from the current filtered result, focus the search input rather than a different candidate; restore the candidate only when its exact ID returns.
- Never auto-select a newly loaded first match.

**Warning signs:**
- Async completion calls `pickOrderedSources` again.
- The selected base is derived from the current result-array index.
- A recovery test must change expected base/head ordering to accommodate discovery.
- Current checkout becomes the default for base.

**Verification signal:**
Cover Base → Head → Back → Base, retained-head recovery, retained-base recovery, and a focused candidate that disappears and later reappears after search. The same stable IDs and terms must survive each transition.

**Phase to address:**
Phase 09 — Staged Picker Contract.

---

### Pitfall 6: Search, startup, and selection errors acquire the wrong owner

**What goes wrong:**
A cancelled query becomes “no matches,” a branch-search failure terminates the CLI, an unavailable worktree becomes a fatal startup error, or a ref that moves after selection bypasses existing `LaunchError` recovery.

**Why it happens:**
Splitting discovery creates multiple failure boundaries. Existing behavior already assigns ownership: repository prerequisite failures exit; unavailable registered worktrees remain disabled rows; picker selection failures are explicit; comparison descriptor failures print exact copy and preserve the opposite role. A single broad catch around staged discovery flattens these meanings.

**How to avoid:**
- **Eager startup owner:** repository/Git prerequisite failures retain existing fatal handling.
- **Worktree owner:** retain clean, dirty, detached, and unavailable row semantics; one broken registration does not fail the entire picker.
- **Search owner:** non-abort listing/abbreviation failures stay in the active prompt with actionable retry/narrowing copy and must not erase eager choices or a retained base/head.
- **Cancellation owner:** aborted work is silent.
- **Selection/descriptor owner:** keep existing ref re-resolution and recovery logic; do not trust an old branch result to bypass it.
- Distinguish “zero matches” from “search failed” and “search was cancelled.”

**Warning signs:**
- Every error returns an empty array.
- Every `GitRunnerError` is wrapped as a fatal `LaunchError`.
- Search code prints directly to stderr while Inquirer owns the terminal.
- Existing exact recovery-copy tests are removed or rewritten.

**Verification signal:**
Independently inject startup failure, unavailable worktree, search exit failure, stdout-limit failure, cancellation, and branch deletion after selection. Each must reach only its established owner and preserve the unaffected picker state.

**Phase to address:**
Phase 09 — Staged Picker Contract; Phase 10 supplies typed search failures.

---

### Pitfall 7: Loose-ref latency is disguised as incorrectness or “fixed” by mutation

**What goes wrong:**
A correct search over 10,000 loose branch refs takes about 800 ms, so the implementation times out at 500 ms, returns partial/no results, or runs `git pack-refs` against the user's repository to force a benchmark pass.

**Why it happens:**
The spike measured a large storage-layout difference: the chosen two-process query took 20.4 ms with packed refs and 798.5 ms with loose refs. Git must inspect thousands of loose files before filtering. The milestone explicitly requires loose-ref correctness but allows it to exceed 500 ms.

**How to avoid:**
- State the performance contract precisely: ≤500 ms for the 10,000 packed-ref fixture; loose refs must remain complete and correct without the same guarantee.
- Let the prompt's loading state remain visible during a slow loose-ref search.
- Do not use a 500 ms command timeout as the budget assertion; measurement and operational timeout are different controls.
- Do not return a prefix of results when the budget expires.
- Do not add a persistent index, recency cache, background ref database, or automatic packing.

**Warning signs:**
- Benchmark reports only one ref storage layout.
- Search has a hard 500 ms timeout.
- Loose-ref tests assert speed but not complete result identity.
- Documentation implies every repository meets 500 ms.

**Verification signal:**
The packed fixture meets ≤500 ms. The loose fixture returns the same matching branch IDs and OIDs as an authoritative full Git listing even when its observed time exceeds 500 ms.

**Phase to address:**
Phase 10 preserves correctness; Phase 11 records the separate packed and loose verdicts.

---

### Pitfall 8: Per-branch subprocesses return through a side door

**What goes wrong:**
Branch listing is lazy, but each match still triggers `rev-parse --short`, `show`, or `log`. A broad query causes thousands of serial or concurrent children and recreates the measured 96-second startup problem inside search.

**Why it happens:**
Mapping an async helper over candidates looks clean, and a narrow developer query hides the scaling curve. `Promise.all` changes serial explosion into concurrent explosion; it does not make the process count bounded.

**How to avoid:**
- Use the chosen constant-process search: one filtered `git branch --list --ignore-case` call and at most one `git log --no-walk=unsorted ... --stdin` abbreviation batch.
- Deduplicate full OIDs before the abbreviation batch.
- Require process count to be O(queries), never O(branches) or O(matches).
- Preserve worktree status/HEAD semantics separately. If eager worktree checks remain per worktree because each has a different cwd, cap their concurrency rather than launching an unbounded `Promise.all`.
- Do not introduce a Git library that merely hides the same child-process pattern.

**Warning signs:**
- `await` appears inside a loop over branch records.
- `Promise.all(matches.map(...git...))` appears.
- Search time scales with number of matches even when ref listing time is flat.
- Process count is absent from benchmark output.

**Verification signal:**
For 100 and 9,999 matches, completed branch search uses at most two Git processes. The benchmark reports both total invocations and peak concurrent children.

**Phase to address:**
Phase 10 — Bounded Native-Git Search.

---

### Pitfall 9: Broad searches exceed output or memory bounds

**What goes wrong:**
A short term matches nearly every branch. Git output exceeds the runner's stdout limit, the abbreviation stdin/result batch becomes huge, or Inquirer allocates and normalizes thousands of decorated rows. Raising limits without a product bound only moves the failure.

**Why it happens:**
Pagination limits rendered rows, not source output or the in-memory choice array. The spike's broad query returned 9,999 branches. The existing runner deliberately caps stdout at 1 MiB and stderr at 64 KiB; a richer format or long ref names can cross that bound.

**How to avoid:**
- Request only fields needed for branch identity: full OID and full ref name; keep NUL-safe/minimal parsing where supported.
- Keep explicit timeout, stdout, stderr, and input-size bounds. Size them against the supported 10,000-branch broad-query fixture rather than removing them.
- If a deliberate displayed-result cap is introduced, make truncation explicit (“more matches; narrow the search”) and keep ordering deterministic. Never label truncation as complete results.
- Treat `stdout-limit` as a search error with narrowing guidance, not as zero matches.
- Batch only unique OIDs and skip abbreviation when there are no matches.

**Warning signs:**
- `maxStdoutBytes` is set to an effectively unlimited value.
- Choice names include unnecessary commit subjects, dates, or decoration.
- A 10,000-match query is not exercised.
- Output-limit errors are caught and replaced with `[]`.

**Verification signal:**
The 9,999-match fixture completes within declared byte bounds, or produces an explicit deterministic truncation/narrowing state. A forced low stdout limit produces a typed search error while eager choices and retained selection remain usable.

**Phase to address:**
Phase 10 — Bounded Native-Git Search; Phase 11 exercises the broad-query boundary.

---

### Pitfall 10: Display abbreviations are computed by slicing full OIDs

**What goes wrong:**
Two objects display the same 12-character prefix, a SHA-256 repository is mishandled, or the UI shows an abbreviation Git would have extended to remain unique.

**Why it happens:**
`oid.slice(0, 12)` is fast and appears equivalent in ordinary fixtures. Git's abbreviation is repository-aware: `rev-parse --short=<n>` and log abbreviation choose a unique prefix of at least the requested length. Compare's contract accepts both 40- and 64-hex full IDs and has deliberately used Git-authoritative short IDs.

**How to avoid:**
- Keep full OIDs as authority and stable data; short OIDs are display only.
- Feed unique full OIDs to one batched `git log --no-walk=unsorted --abbrev=12 --format=%H%x00%h%x00 --stdin` call.
- Parse the full-to-short mapping byte-safely and fail if any requested OID is absent.
- Never use a short OID as candidate identity, deduplication key, selection revision, or batch correlation key.
- Verify both 40- and 64-character full-OID parsing where supported by the existing Git fixture capabilities.

**Warning signs:**
- `.slice(0, 12)` or `.substring(0, 12)` appears in discovery.
- Results are correlated by output order rather than returned full OID.
- Candidate IDs contain abbreviated hashes.
- Tests assert only that short IDs have length 12, not that Git produced them.

**Verification signal:**
Create or inject colliding 12-character prefixes; displayed abbreviations must extend as Git requires while full IDs and candidate IDs remain distinct. Every requested full OID must map exactly once.

**Phase to address:**
Phase 10 — Bounded Native-Git Search.

---

### Pitfall 11: Staging discovery changes worktree semantics

**What goes wrong:**
The “fast” eager set omits detached or unavailable registrations, treats a locked worktree as unavailable, derives dirty state from the main worktree, or turns a checked-out branch and its worktree into one source. Dirty bytes may accidentally enter the comparison instead of only affecting labels/warnings.

**Why it happens:**
The initial set is intentionally worktree-heavy, so startup optimization is tempted to parse less or skip per-worktree checks. Git's `worktree list --porcelain -z` has distinct `branch`, `detached`, `bare`, `locked`, and `prunable` records. Compare additionally resolves each usable worktree's committed `HEAD` and status in that worktree's cwd.

**How to avoid:**
- Keep `git worktree list --porcelain -z` as the registration authority and retain byte-safe parsing.
- Eagerly include every registered worktree, including disabled unavailable entries; do not show only currently mounted/clean worktrees.
- Derive the current branch only from the current checkout's full `branchRef`; a detached current checkout contributes no fabricated branch.
- Preserve attached versus detached, clean/dirty/unavailable, path, branch ref, and `isCurrentCheckout` fields.
- A locked worktree remains usable when its path and HEAD resolve; prunable/bare/missing registrations keep existing unavailable behavior.
- Preserve the established comparison rule: a worktree selects committed `HEAD`; staged, unstaged, and untracked bytes only mark it dirty.

**Warning signs:**
- Worktree discovery uses human-formatted output or line splitting without `-z`.
- One `git status` at repository root labels every worktree.
- Worktree and branch rows are merged by `branchRef`.
- A detached current checkout is exposed as a branch named `HEAD`.

**Verification signal:**
Initial choices include current attached checkout, linked attached checkout, detached checkout, dirty checkout, locked usable checkout, and prunable/missing disabled checkout with their existing IDs, labels, and availability. The selected worktree comparison still pins committed bytes only.

**Phase to address:**
Phase 09 preserves the contract; Phase 11 runs the full worktree matrix.

---

### Pitfall 12: A favorable benchmark certifies the wrong implementation

**What goes wrong:**
The prototype meets both budgets, but the packaged CLI does not. Results exclude module startup, use warmed packed refs only, search for very few matches, omit process counts, or start the clock after expensive discovery.

**Why it happens:**
Microbenchmarks naturally isolate the code under investigation. The product budgets are user-observed boundaries: process start to usable picker, and input submission to installed matching results. Spike 002 is intentionally partial and manually models the staged path; final verification must move to the production implementation.

**How to avoid:**
- Measure the built production CLI/module path, not a duplicate benchmark implementation.
- Start readiness timing before process creation and stop only when the prompt can accept selection with current branch/worktrees installed.
- Start search timing when the term is delivered and stop when selectable rows are installed.
- Report every run plus median; retain the first run so warm-cache bias is visible.
- Record ref storage (`packed` or `loose`), branch count, worktree count, match count, total Git invocations, peak concurrency, listing time, abbreviation time, and end-to-end round trip.
- Exercise at least: 100 packed matches, 9,999 packed matches, 100 loose matches, 32 worktrees, and rapid superseding terms.
- Keep fixture creation and `pack-refs` outside the measured child, but include normal CLI module load and repository discovery.

**Warning signs:**
- Only internal Git duration is reported.
- The benchmark imports prototype helpers instead of production discovery.
- One median is shown without raw runs or storage layout.
- Search subprocess count is inferred from source code rather than observed.

**Verification signal:**
The production boundary meets ≤400 ms picker readiness and ≤500 ms packed-ref search in the 10,000-branch fixture. Loose-ref results remain complete, and process counts remain bounded in broad and cancelled searches.

**Phase to address:**
Phase 11 — Performance and Safety Gate.

---

### Pitfall 13: Read-only discovery mutates the repository to improve itself

**What goes wrong:**
Compare runs `git pack-refs`, maintenance, `gc`, `update-ref`, or writes a branch cache/recency file. Search becomes faster but changes repository representation, creates lock contention, surprises other Git processes, or makes results stale across tools.

**Why it happens:**
Packing refs is the easiest way to turn the failing loose-ref benchmark into a pass, and a persistent index makes repeated substring search cheap. Both violate the local read-only discovery decision. Official Git documentation states that `pack-refs` writes packed ref storage and normally removes corresponding loose refs.

**How to avoid:**
- Restrict product discovery to read-only commands: repository inspection, `worktree list`, filtered branch listing, and object display/abbreviation.
- Retain the runner's `--no-optional-locks`, disabled hooks, argument arrays, and non-interactive environment.
- Keep `git pack-refs` strictly inside fixture setup.
- Add no `.compare` branch index, recency store, background cache, or filesystem watcher for this milestone.
- Do not invoke Git maintenance implicitly on slow or broad searches.

**Warning signs:**
- Product code contains `pack-refs`, `maintenance`, `gc`, or `update-ref`.
- Search performance improves only on its second run because Compare wrote state.
- New files appear under `.git` or `.compare` before the user starts a review.
- A cancelled search leaves a lock file.

**Verification signal:**
Hash ref contents/storage and inventory before and after successful, failed, broad, slow, and cancelled searches. They must be byte-identical, no lock remains, and no persistent discovery artifact is created.

**Phase to address:**
Phase 10 enforces the read-only command allowlist; Phase 11 proves non-mutation.

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep one eager all-branch array and merely delay rendering | Small picker diff | Startup still enumerates/abbreviates every branch; misses milestone | Never |
| Key candidates by commit OID | Easy deduplication | Destroys branch/worktree identity and dirty/path semantics | Never |
| Slice full OIDs to 12 characters | Removes abbreviation Git call | Non-unique, non-authoritative display; SHA-format assumptions | Never |
| Ignore source `AbortSignal` because Inquirer ignores stale results | Less plumbing | Orphaned Git children and process storms | Never |
| `Promise.all` per branch | Faster than serial calls in small fixtures | Unbounded concurrent subprocesses | Never |
| Cache all branches for the prompt lifetime after first query | Faster subsequent terms | Stale branch view and unnecessary 10,000-row memory; changes fresh-search semantics | Only if later requirements explicitly choose snapshot semantics; not v1.2 |
| Persist a branch/recency index | Fast repeated launches | Invalidation, mutation, privacy/state, and new authority | Never in v1.2 |
| Auto-run `pack-refs` | Makes loose-ref benchmark fast | Mutates repository and may contend with Git | Fixture setup only |
| Remove runner byte limits | Broad query stops failing locally | Memory exhaustion and unbounded terminal data | Never |
| Promise a 500 ms loose-ref result | Simpler marketing/acceptance text | Encourages truncation, timeout, or mutation | Never; report packed budget and loose correctness separately |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `@inquirer/search` source | Treating source calls as ordered | Forward its signal and return one immutable result per exact term |
| `@inquirer/search` default/cursor | Assuming row focus survives every result replacement | Preserve domain selection separately; use stable values and existing recovery focus rules |
| Existing picker map | Returning lazy IDs absent from `candidateById` | Install completed lazy candidates into one prompt-lifetime ID authority before rows become selectable |
| Git branch patterns | Passing user input as an unescaped wildcard | Escape Git pattern metacharacters and wrap the literal term for substring matching; keep `--list` and argv arrays |
| Git output | Parsing human branch decorations such as `*` and `+` | Request explicit full ref/OID fields and parse a machine-oriented format |
| Git abbreviation | Correlating abbreviated lines by position | Emit full OID plus `%h`, then map by full OID |
| Worktree inventory | Parsing newline output | Use `worktree list --porcelain -z` and preserve boolean/value records |
| Git runner | Direct `spawn`, no limits, no signal | Reuse bounded `GitRunner` with signal, timeout, stdout/stderr caps, safe config, and no shell |
| Existing recovery | Treating an old search snapshot as final Git truth | Keep live branch ref resolution and current `LaunchError` recovery after selection |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Serial abbreviation | Search time increases roughly per unique head | One `log --no-walk --stdin` batch | Broad queries; measured eager path reached ~96 seconds at 10,000 refs |
| Concurrent per-branch abbreviation | CPU/process spike despite acceptable median | Constant number of branch-search processes | Hundreds to thousands of matches |
| Loose-ref enumeration | Correct search exceeds target | Accept slower correct result; benchmark separately; no mutation | Spike: ~798.5 ms at 10,000 loose refs |
| Packed-only benchmark | Green budget that does not describe all storage layouts | Always pair packed performance with loose correctness | Any repository with many loose branch files |
| Result pagination mistaken for data bound | Low visible row count but large memory/output | Bound Git output and choice creation independently | Broad 9,999-match term or long ref names |
| Unbounded eager worktree checks | Picker readiness becomes process-scheduler dependent | Cap concurrency while preserving per-worktree cwd semantics | Dozens of registered worktrees; spike used 66 initial calls at 32 worktrees |
| Warm-cache-only median | Repeat runs hide first-launch filesystem cost | Retain first run and raw samples beside median | Cold launch or recently created refs |
| Measuring internal Git time only | Git looks fast while CLI misses 400/500 ms | Measure process/prompt round trip at production boundary | Module load, parsing, formatting, and prompt installation |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Shell interpolation of the search term | Command injection and platform-specific quoting errors | Keep `shell: false`, argv arrays, and escape only Git's own branch-pattern metacharacters |
| Rendering raw branch names | Terminal control-sequence injection or corrupted prompt | Continue using `escapeTerminalText` for every candidate label/path |
| Removing process/output limits | A repository with hostile/extreme ref names can exhaust memory or hang the prompt | Retain timeout and byte caps; treat limit failures explicitly |
| Letting Git invoke hooks or optional locks | Discovery can execute repository-controlled code or create lock contention | Reuse the runner's disabled hooks, `--no-optional-locks`, non-interactive environment, and read-only command set |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Empty input launches all-branch search | Picker becomes slow before user asks for branches | Empty term returns eager current branch/worktrees only |
| Cancellation displayed as error/no matches | Normal typing looks broken | Keep cancellation silent and install only the latest result |
| Slow loose refs have no loading state | User assumes the prompt froze | Keep Inquirer's loading state until complete, correct results arrive |
| Exact current branch appears twice | User cannot tell whether rows differ | Deduplicate only the exact branch ID while keeping its worktree row distinct |
| Search failure removes eager choices | A branch error blocks selecting a known worktree | Keep eager choices and retained role state; show owned search error |
| Background results move cursor | Enter selects an unintended branch | One result installation per term; never auto-submit or recreate the prompt |
| Output cap masquerades as completeness | User believes a branch does not exist | State truncation/limit explicitly and ask for a narrower term |

## "Looks Done But Isn't" Checklist

- [ ] **Picker readiness:** Clock starts before process creation, and current branch plus all registered worktrees are selectable within 400 ms.
- [ ] **True laziness:** No all-local-branch command runs before a non-empty search term.
- [ ] **Latest-query wins:** Delayed old results cannot update rows or candidate authority.
- [ ] **Real cancellation:** Superseded Git children terminate; cancellation is silent.
- [ ] **Lazy selection:** A branch discovered only by search can be selected and reaches the existing descriptor path.
- [ ] **Identity dedupe:** Same branch ID appears once; different refs/worktrees sharing an OID remain distinct.
- [ ] **Ordered state:** Base/head order, Back, current-head suggestion, retained opposite role, search term, and recovery focus are unchanged.
- [ ] **Error ownership:** Startup, unavailable worktree, no matches, search failure, cancellation, and descriptor recovery remain distinguishable.
- [ ] **Process bound:** Search uses one listing plus at most one abbreviation process for both narrow and broad queries.
- [ ] **Output bound:** 9,999 matches fit declared bounds or produce explicit narrowing/truncation behavior.
- [ ] **Git abbreviation:** Short IDs come from Git and map by full 40/64-character OID.
- [ ] **Worktree semantics:** Attached, detached, clean, dirty, unavailable, locked, prunable, and current-checkout cases retain existing behavior.
- [ ] **Packed budget:** 10,000 packed refs return matching rows within 500 ms at the production boundary.
- [ ] **Loose correctness:** 10,000 loose refs return the complete authoritative match set even if slower than 500 ms.
- [ ] **Benchmark honesty:** Raw runs, first run, median, match count, storage layout, subprocess count, and peak concurrency are reported.
- [ ] **Non-mutation:** Successful, failed, broad, slow, and cancelled searches leave refs/storage and discovery state unchanged.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Stale-result state mutation | MEDIUM | Remove detached/shared mutation, make source results immutable, add delayed A/B cancellation verification |
| Orphaned Git children | LOW | Thread prompt signal through runner and stop starting batch stage after abort |
| Lazy row missing from selection map | MEDIUM | Introduce one prompt-lifetime candidate authority and install non-aborted batches atomically |
| OID-based dedupe shipped | HIGH | Restore branch/worktree IDs, rebuild merge logic, re-verify recovery and exported source identities |
| Selection/recovery regression | HIGH | Revert prompt reconstruction/index state and restore existing stable-ID role state machine |
| Loose refs timed out/truncated | LOW | Remove budget-as-timeout, restore complete search, document measured loose latency |
| Per-branch subprocess path | MEDIUM | Replace helper loop with filtered listing plus one unique-OID abbreviation batch |
| Output-limit ambiguity | LOW | Surface typed narrowing guidance and add broad/forced-limit cases |
| Naive abbreviation | MEDIUM | Restore full-OID authority and Git batch mapping; invalidate any short-ID keyed state |
| Worktree semantics drift | HIGH | Reuse porcelain parser and established candidate construction; rerun full worktree matrix |
| Biased benchmark | LOW | Point harness at built production path and publish raw packed/loose scenarios |
| Repository mutation | HIGH | Remove mutating command/state, restore fixture, inspect/repair refs with Git, and add before/after content proof |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Stale searches | Phase 09 — Staged Picker Contract | Delayed A cannot overwrite faster B or candidate authority |
| Cancellation | Phase 09 + Phase 10 | Rapid terms terminate superseded children with no user-facing error |
| Lazy row absent from selection authority | Phase 09 | Search-only branch selects successfully for either role |
| Duplicate identities | Phase 09 | Exact branch ID once; same-OID refs/worktrees remain distinct |
| Selection preservation | Phase 09 | Base/head/Back/suggestion/recovery matrix unchanged |
| Error ownership | Phase 09 + Phase 10 | Inject each failure class and observe only its designated owner |
| Loose-ref latency | Phase 10 + Phase 11 | Complete loose results; separate measured verdict from packed budget |
| Process explosion | Phase 10 | ≤2 branch-search Git calls for 100 and 9,999 matches; bounded concurrency |
| Unbounded output | Phase 10 + Phase 11 | Broad query respects declared bounds and limit errors stay explicit |
| Object abbreviation | Phase 10 | Git-produced unique abbreviations mapped by full OID |
| Worktree semantics | Phase 09 + Phase 11 | Full registration/dirty/detached/unavailable matrix remains unchanged |
| Benchmark bias | Phase 11 — Performance and Safety Gate | Production-boundary raw runs meet 400/500 ms packed budgets |
| Repository mutation | Phase 10 + Phase 11 | Ref/storage hashes unchanged across success, failure, and cancellation |

## Sources

### Project evidence — HIGH confidence

- [v1.2 project contract](../PROJECT.md) — active requirements, non-mutation and no-persistence decisions.
- [CLI startup discovery findings](../notes/cli-startup-discovery.md) — current 15-process startup trace and staged-discovery decision.
- [Spike 002: Staged Source Discovery](../spikes/002-staged-source-discovery/README.md) — empirical packed/loose, broad-query, and worktree results; verdict is explicitly PARTIAL.
- [`src/cli/picker.ts`](../../src/cli/picker.ts) — stable candidate values, ordered base/head state, default/recovery behavior, and current immutable candidate map.
- [`src/cli/run.ts`](../../src/cli/run.ts) — existing discovery, selection, descriptor, and recovery ownership.
- [`src/git/candidates.ts`](../../src/git/candidates.ts) — branch/worktree identity, NUL parsing, per-head abbreviation, dirty/unavailable semantics.
- [`src/git/runner.ts`](../../src/git/runner.ts) — AbortSignal propagation, process termination, timeouts, output limits, disabled hooks, and no-shell execution.
- [`tests/git/candidates.test.ts`](../../tests/git/candidates.test.ts) and [`tests/cli/selection.test.ts`](../../tests/cli/selection.test.ts) — validated duplicate-OID, worktree, ordering, and recovery contracts.

### Official documentation — HIGH confidence for documented semantics

- [`@inquirer/search` README](https://github.com/SBoudrias/Inquirer.js/tree/main/packages/search) — async source contract, term-change `AbortSignal`, defaults, and separators.
- [`@inquirer/search` current source](https://github.com/SBoudrias/Inquirer.js/blob/main/packages/search/src/index.ts) — aborted-result guard, one-time default application, result replacement, and active-row reset.
- [Git `branch`](https://git-scm.com/docs/git-branch) — `--list` and wildcard filtering semantics.
- [Git `worktree`](https://git-scm.com/docs/git-worktree) — stable porcelain records and `-z` path safety.
- [Git `rev-parse`](https://git-scm.com/docs/git-rev-parse) and [Git `log`](https://git-scm.com/docs/git-log) — unique abbreviation with a requested minimum length.
- [Git `pack-refs`](https://git-scm.com/docs/git-pack-refs) — ref-storage mutation and loose-ref removal behavior.
- [Node.js 24 child process documentation](https://nodejs.org/docs/latest-v24.x/api/child_process.html) — asynchronous spawning, AbortSignal, pipe limits, and bounded output behavior.

### Confidence note

The integration risks and thresholds are HIGH confidence because they are grounded in the current code, existing contract tests, and the repository's measured spike. The research-plan web search produced no useful authoritative benchmark source; no external anecdotal benchmark claim is used. Platform/filesystem variance remains a Phase 11 measurement concern rather than an unsupported guarantee.

---
*Pitfalls research for: Compare v1.2 Fast Source Discovery*
*Researched: 2026-07-30*
