---
status: resolved
trigger: "I tried on @../../trustlayer/cwt seems still very slow on startup"
created: 2026-07-31T07:53:18Z
updated: 2026-07-31T09:19:35Z
---

## Current Focus

hypothesis: Picker readiness is blocked by an eager status contract even though worktree path/branch/OID identity is available first; publishing ordered identities immediately and resolving exact dirty/unavailable labels asynchronously removes the six-second floor without weakening selection semantics.
test: Complete — isolated readiness, exact enrichment completion, unchanged production gate, scoped semantics, cleanup, and repository immutability all passed.
expecting: Complete — initial rows show explicit pending state, later source calls show exact state, and worktree selection awaits enrichment.
next_action: Archive this resolved session and record the final atomic commit.
reasoning_checkpoint:
  hypothesis: "The blocking contract—not a tunable concurrency value—is the remaining root cause: `discoverSourceCandidates` waits for every expensive dirty scan before returning identities that are already resolved."
  confirming_evidence:
    - "The bounded sweep found a six-second floor at every concurrency from 4 through 30."
    - "Original profiling measured identity HEAD/abbreviation/protocol work below one second while status consumed 8.46 seconds serially."
    - "The new regression directly observes discovery remaining blocked after every status has started."
  falsification_test: "If two-stage discovery still cannot publish the exact branch/OID marker before gated statuses resolve, status is not separable from identity at the production seam."
  fix_rationale: "Publishing immutable identities first removes status from the readiness critical path; awaiting one shared enrichment before worktree acceptance preserves exact dirty, unavailable, recovery, order, and Git identity semantics."
  blind_spots: "The prompt must refresh its candidate snapshot without reordering, and cancellation/rejection of deferred status work must remain observable."
tdd_checkpoint:
  test_file: tests/git/candidates.test.ts
  test_name: starts every worktree dirty-state check before waiting for one to finish
  status: green
  failure_output: "AssertionError: expected 'blocked' to be 'published' at tests/git/candidates.test.ts:207:25"

## Symptoms

expected: Running the shipped `cumpa` command in `../../trustlayer/cwt` should make the ordered source picker usable quickly, with the attached current branch and registered worktrees visible before remaining local branches are searched.
actual: Startup in `../../trustlayer/cwt` remains perceptibly very slow after the v1.2 Fast Source Discovery change.
errors: No error message was reported.
reproduction: Build or link the current Cumpa checkout, change directory to `../../trustlayer/cwt`, run `cumpa`, and measure from process start until the ordered source picker is usable.
started: Observed while manually testing the shipped v1.2 change on 2026-07-31.

## Eliminated

- hypothesis: H5 — CWT's local-branch/ref count dominates initial readiness.
  evidence: The unchanged shipped picker passes the generated fixture containing 10,000 packed local branches at a 219.12 ms median readiness, versus 9,441.90 ms median in CWT. Initial discovery does not enumerate searchable branches until a non-empty query.
  timestamp: 2026-07-31T08:06:24Z

- hypothesis: H2 — fixed per-worktree HEAD and abbreviation subprocess count dominates readiness.
  evidence: Across a 9,315.87 ms control discovery, 31 HEAD resolutions summed to 380.18 ms and 23 abbreviations summed to 308.16 ms, versus 8,498.37 ms in status.
  timestamp: 2026-07-31T08:09:42Z

- hypothesis: H3 — repository version/protocol/worktree-list probes dominate readiness.
  evidence: In the same control, repository protocol probes summed to 72.54 ms and two worktree-list calls summed to 38.93 ms.
  timestamp: 2026-07-31T08:09:42Z

- hypothesis: H4 — generated-bin, module, Commander, or Inquirer initialization dominates readiness.
  evidence: Direct production discovery controls took 9,315.87–9,810.85 ms, matching the shipped picker median of 9,441.90 ms; importing candidate/runner modules took only 35.37 ms.
  timestamp: 2026-07-31T08:09:42Z

- hypothesis: Unbounded 30-way enrichment contention is the primary remaining startup cause.
  evidence: Repeated real-CWT medians were 10,580.69 ms at concurrency 1, 7,486.53 at 2, 6,182.60 at 4, 6,848.74 at 8, 7,229.95 at 16, and 6,338.12 at 30. Bounding at 4 improved only 2.2% versus 30 and still failed the original scenario.
  timestamp: 2026-07-31T08:47:15Z

## Evidence

- timestamp: 2026-07-31T08:03:32Z
  checked: Shipped CLI call path in `dist/bin/cumpa.mjs` and source implementations.
  found: The generated bin imports `run`; Commander calls `runCli`; `runCli` awaits `discoverSourceCandidates` before invoking Inquirer. Candidate discovery performs repository/version/protocol probes, a second worktree-list call, then sequential per-worktree `rev-parse HEAD`, `status --porcelain`, and OID abbreviation calls.
  implication: Delay before candidates render can be isolated entirely within eager discovery; branch search and session launch are not on initial readiness path.

- timestamp: 2026-07-31T08:03:32Z
  checked: Real CWT `git worktree list --porcelain -z` metadata.
  found: CWT has 30 registered worktrees: 13 attached branches and 17 detached worktrees.
  implication: Unlike the generated 10,000-ref fixture, real CWT multiplies eager per-worktree subprocess and dirty-scan work.

- timestamp: 2026-07-31T08:06:24Z
  checked: Shipped picker readiness in real CWT using one warmup and five measured invocations.
  found: Warmup was 9,737.29 ms; measured values were 9,405.34, 9,441.90, 9,451.90, 9,428.13, and 9,490.77 ms; median 9,441.90 ms.
  implication: The reported delay is deterministic and reproducible on the actual production command path.

- timestamp: 2026-07-31T08:06:24Z
  checked: Existing generated 10,000-packed-local-ref production picker gate, unchanged.
  found: Gate classified PASS; measured readiness values were 209.86, 213.85, 222.16, 219.12, and 219.16 ms; median 219.12 ms. Search median was 33.90 ms.
  implication: Large packed branch/ref count and lazy branch search are not the cause of initial CWT readiness; the real-repository differential is about 43x.

- timestamp: 2026-07-31T08:06:24Z
  checked: Ranked falsifiable fault tree before stage profiling.
  found: H1 sequential untracked-aware status scans; H2 per-worktree HEAD/abbreviation process count; H3 repository/protocol/list probes; H4 bin/Commander/Inquirer/module initialization; H5 branch/ref count.
  implication: The profiler can discriminate H1–H4 by measured command categories and a one-variable status counterfactual; the generated gate already eliminates H5.

- timestamp: 2026-07-31T08:09:42Z
  checked: Three wrapped-runner control profiles using unmodified production discovery semantics.
  found: Total discovery was 9,532.88, 9,810.85, and 9,315.87 ms. In the last profile, 30 status calls summed to 8,498.37 ms (max 1,304.33 ms), while HEAD summed to 380.18 ms, abbreviations 308.16 ms, protocols 72.54 ms, and worktree lists 38.93 ms.
  implication: Status accounts for 91.22% of direct discovery elapsed time; H2–H4 cannot explain the observed delay.

- timestamp: 2026-07-31T08:09:42Z
  checked: One-variable counterfactual replacing only `--untracked-files=normal` with `--untracked-files=no`.
  found: Candidate count remained 31; discovery fell from 9,315.87 ms to 6,158.54 ms, and aggregate status time fell from 8,498.37 ms to 5,191.84 ms.
  implication: Untracked scanning contributes about 3.31 seconds, but status remains the dominant stage because tracked/index work across these large worktrees is also expensive.

- timestamp: 2026-07-31T08:12:36Z
  checked: One-variable status-bypass counterfactual at the production Git-runner seam.
  found: Control discovery was 9,288.45 ms with 8,459.73 ms in 30 status calls; bypassing only status execution reduced discovery to 724.00 ms while retaining all 31 initial candidates.
  implication: The status stage is causally responsible for 92.2% of elapsed startup; combined with the source loop, the root mechanism is sequential accumulation of expensive per-worktree dirty-state checks.

- timestamp: 2026-07-31T08:14:49Z
  checked: Targeted causal regression only via `npx vitest run tests/git/candidates.test.ts -t "starts every worktree dirty-state check before waiting for one to finish"`.
  found: RED as required — one test failed, 16 skipped; assertion expected 3 status checks to have started before release but received 1 at `tests/git/candidates.test.ts:192:38`.
  implication: The test deterministically reproduces serialization at the causal seam without a timing threshold and is ready for the GREEN-phase fix.

- timestamp: 2026-07-31T08:14:49Z
  checked: Diagnostic instrumentation cleanup and CWT mutation boundary.
  found: Both `CUMPA_DIAG_CWT_STARTUP` temporary harnesses were removed and `/tmp/cumpa-cwt-*-diag.mjs` matches no files. All CWT commands issued were read-only Git discovery/status commands; no tool wrote within CWT.
  implication: Tagged instrumentation is gone and the real repository was not modified.

- timestamp: 2026-07-31T08:24:34Z
  checked: Causal GREEN regression via `npx vitest run tests/git/candidates.test.ts -t "starts every worktree dirty-state check before waiting for one to finish"`.
  found: One test passed and 16 were skipped; all 3 status checks started before release and the assertion retaining porcelain worktree order passed.
  implication: Ordered concurrent enrichment removes the confirmed serialization mechanism without reordering candidates.

- timestamp: 2026-07-31T08:25:52Z
  checked: Complete scoped candidate-discovery coverage via `npx vitest run tests/git/candidates.test.ts`.
  found: All 17 tests passed in one test file, including Git identity, eager dirty labels, stable order, unavailable recovery, cancellation, and byte-safe runner contracts.
  implication: Concurrency preserved the surrounding candidate-discovery semantics defended by the existing focused suite.

- timestamp: 2026-07-31T08:27:15Z
  checked: First unchanged `npm run test:performance` attempt.
  found: Runtime build passed, but the gate classified HARD_FAILURE before any warmup or measured run while creating its Git fixture; the captured output truncated the diagnostic after `git pack…`.
  implication: This attempt did not exercise picker performance and must be diagnosed and rerun unchanged before acceptance.

- timestamp: 2026-07-31T08:29:00Z
  checked: Unchanged `node tests/performance/production-picker.mjs` retry after the fixture-setup failure.
  found: PASS; warmup readiness was 219.72 ms, measured readiness was 232.18, 217.29, 220.06, 217.25, and 219.98 ms (median 219.98 ms); measured search median was 35.31 ms.
  implication: Candidate concurrency passes both production budgets; the prior zero-cycle fixture failure was transient, but the exact npm command still requires a passing rerun.

- timestamp: 2026-07-31T08:33:48Z
  checked: Exact unchanged `npm run test:performance` retry.
  found: PASS after the runtime build; warmup readiness was 320.73 ms, measured readiness was 233.17, 226.02, 263.88, 226.42, and 234.19 ms (median 233.17 ms); measured search median was 41.86 ms.
  implication: The unchanged production gate passes without threshold or harness changes; the earlier pre-cycle fixture failure was transient.

- timestamp: 2026-07-31T08:35:46Z
  checked: Original real-CWT production picker timing harness, unchanged, with one warmup and five measured runs.
  found: Warmup was 6,462.48 ms; measured readiness was 6,406.55, 6,371.90, 6,179.14, 6,323.67, and 6,182.83 ms (median 6,323.67 ms), down 33.03% from the 9,441.90 ms before median while retaining the exact `[Branch] master · 3dfb3d37be6d` marker.
  implication: Concurrent enrichment materially lowers the original production startup path while preserving exact Git-derived picker identity and stable output.

- timestamp: 2026-07-31T08:35:46Z
  checked: CWT repository identity and dirty state after timing, plus temporary diagnostic cleanup.
  found: CWT remained at `3dfb3d37be6d80079ef02d5b3cff34d18ed3e76f` with empty porcelain status (`e3b0c442…b855`); no `/tmp/cumpa-cwt-*-diag.mjs` files or diagnostic tags remained.
  implication: Verification did not mutate CWT and all instrumentation/prototypes were removed.

- timestamp: 2026-07-31T08:47:15Z
  checked: Full production-picker bound sweep on real CWT, changing only enrichment concurrency; each level used one warmup and three measured cycles.
  found: Median readiness was 10,580.69 ms at concurrency 1, 7,486.53 at 2, 6,182.60 at 4, 6,848.74 at 8, 7,229.95 at 16, and 6,338.12 at 30; every run retained the exact branch/OID marker.
  implication: Concurrency 4 is the measured optimum, but contention explains only a small fraction of the remaining six-second delay; the expensive status operation itself requires isolation.

- timestamp: 2026-07-31T08:55:04Z
  checked: Identity-first RED regression via `npx vitest run tests/git/candidates.test.ts -t "starts every worktree dirty-state check before waiting for one to finish"`.
  found: The named test failed because discovery remained `blocked` until the gated statuses were released instead of being `published`.
  implication: The production discovery API still places exact dirty-state completion on the picker-readiness critical path.

- timestamp: 2026-07-31T09:02:08Z
  checked: Identity-first causal GREEN, asynchronous picker-state regression, complete candidate discovery coverage, complete picker selection coverage, and runtime build.
  found: The named causal test passed (1/1); the picker installed exact dirty state before accepting the selected worktree (1/1); candidate tests passed 17/17; picker tests passed 11/11; `npm run build:runtime` completed.
  implication: Identity publication is no longer blocked by statuses, and eventual dirty/unavailable state remains ordered and exact at the selection boundary.

- timestamp: 2026-07-31T09:19:35Z
  checked: Process-group-isolated real-CWT picker readiness with one warmup and five measured runs, killing and draining every descendant group before the next sample.
  found: Warmup was 973.19 ms; samples were 419.20, 472.31, 534.23, 446.87, and 472.41 ms; median readiness was 472.31 ms versus the 9,441.90 ms before median, with the exact `[Branch] master · 3dfb3d37be6d` marker.
  implication: Picker identity is genuinely usable in under half a second without cross-sample enrichment contention.

- timestamp: 2026-07-31T09:19:35Z
  checked: Separate exact real-CWT enrichment completion with one warmup and five measured runs.
  found: Identity publication median was 378.64 ms and exact enrichment completion median was 6,740.70 ms; every run retained exact candidate IDs/order and ended with no pending worktree.
  implication: The expensive exact dirty scan remains asynchronous and measurable, while selection waits for its exact result rather than publishing false clean state.

- timestamp: 2026-07-31T09:19:35Z
  checked: Final unchanged `npm run test:performance`, final scoped tests, diagnostics cleanup, and CWT immutability.
  found: Production gate PASS with 240.06 ms readiness and 46.12 ms search medians; candidate and picker suites passed 28/28; no diagnostic tags or `/tmp/cumpa-cwt-*-diag.mjs` remained; CWT stayed clean at `3dfb3d37be6d80079ef02d5b3cff34d18ed3e76f`.
  implication: Thresholds, output order, exact Git identity, dirty/unavailable selection semantics, cancellation-aware enrichment, and repository immutability are preserved.

## Resolution

root_cause: `discoverSourceCandidates` treated exact dirty-state completion as a prerequisite for publishing already-resolved worktree identities. Real CWT's 30 native status scans have an irreducible roughly 6.7-second completion cost; concurrency changes alone cannot make the picker usable quickly.
fix: Discovery now publishes immutable ordered branch/worktree identities with explicit `pending` availability, exposes one idempotently started ordered `candidateEnrichment` promise, and runs exact statuses after the first prompt source publication. Later source calls render exact Clean/Dirty/Unavailable state, and the picker awaits enrichment before accepting any worktree selection.
verification: Isolated real-CWT picker readiness median improved from 9,441.90 ms to 472.31 ms; separate exact enrichment completion median was 6,740.70 ms; unchanged production gate passed at 240.06/46.12 ms readiness/search; final scoped tests passed 28/28; CWT and diagnostics cleanup checks passed.
cycles: {tdd: "2 red + 2 green", bounded_sweep: "6 levels × (1 warmup + 3 measured)", isolated_readiness: "1 warmup + 5 measured", exact_enrichment: "1 warmup + 5 measured", production_gate: "4 attempts, final PASS"}
files_changed: [src/domain/source.ts, src/git/candidates.ts, src/cli/picker.ts, src/cli/run.ts, tests/git/candidates.test.ts, tests/cli/selection.test.ts]
commit: 2e15ac69e951eedfe0681509d351d8722216e5ab
