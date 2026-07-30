---
phase: 11-production-performance-gate
verified: 2026-07-30T18:57:13Z
status: passed
score: 7/7 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 11: Production Performance Gate Verification Report

**Phase Goal:** Users receive fast picker readiness and branch-search results through the same production path they run in a packed 10,000-branch repository.
**Verified:** 2026-07-30T18:57:13Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | PERF-01: across five serial measured production processes after one discarded warmup, median time from immediately before spawning `dist/bin/cumpa.mjs` to the exact rendered eager current-branch row is at most 400 ms. | ✓ VERIFIED | `npm run test:performance` exited 0. Its five raw readiness values were `218.595542`, `218.303333`, `232.982584`, `221.532417`, and `223.814625` ms; sorted raw median `221.532417` ms is within the fixed 400 ms budget. The harness starts `readyStartedAt` immediately before `spawn()` and stops only on the exact row marker (`tests/performance/production-picker.mjs:277-291`). |
| 2 | PERF-02: in the same five production processes, median time from immediately before writing `branch-09999` to the exact rendered matching row is at most 500 ms. | ✓ VERIFIED | The same gate produced raw search values `38.266167`, `37.274166`, `39.490291`, `36.605625`, and `39.703375` ms; sorted raw median `38.266167` ms is within the fixed 500 ms budget. The parent clock starts immediately before `child.stdin.write('branch-09999')` and stops only on the target rendered row (`tests/performance/production-picker.mjs:292-302`). |
| 3 | The gate proves a fresh fixture has exactly 10,000 local `refs/heads` entries, all packed and none loose, before warmup or measurement. | ✓ VERIFIED | The current gate result reported `expectedCount: 10000`, `logicalCount: 10000`, `packedCount: 10000`, `looseHeadFiles: 0`, and all three set-equality proofs `true`. Fixture setup creates the disposable repository, packs refs, checks logical/packed exact sets, and rejects any mismatch before returning (`tests/performance/production-picker.mjs:155-208`). |
| 4 | Every sample traverses the compiled Commander, repository-discovery, real Inquirer renderer, native-Git search, and rendered candidate-row path with no injected CLI, picker, or Git seam. | ✓ VERIFIED | The executed report named absolute `/Users/alessandro/projects/diff-review/dist/bin/cumpa.mjs`. The generated bin imports and awaits compiled `run()` (`dist/bin/cumpa.mjs:2-4`); absent `COMPARE_LAUNCH_OPTIONS` invokes `runCli()` (`src/cli/run.ts:472-474`), whose production defaults are `discoverSourceCandidates` and `pickOrderedSources` (`src/cli/run.ts:334-336`). The picker uses installed `search` with its real source (`src/cli/picker.ts:295-309`), forwarding the term to `searchBranches` (`src/cli/picker.ts:263-287`), which invokes native Git (`src/git/candidates.ts:427-510`). The harness has no `runCli`, injected picker, or injected Git import/call. |
| 5 | A failed budget is classified separately from fatal fixture/protocol/lifecycle failures; only a completed one-warmup/five-measured run with successful cleanup can classify PASS or budget RED. | ✓ VERIFIED | `runPickerSample()` times out/exits through `fail()` and awaited termination (`tests/performance/production-picker.mjs:242-315`). The top-level path records exactly one completed warmup and five serial samples before calculating medians; an incomplete set, unsettled child, failed fixture, or failed cleanup remains `HARD_FAILURE` (`:379-429`). The observed run was `classification: "PASS"`, with one warmup, five measured records, every child `SIGTERM`-settled, and `cleanupSucceeded: true`. Because this run passed, the conditional diagnosis/correction branch was not entered. |
| 6 | The existing Node 24 CI runner owns a separate serial `npm run test:performance` acceptance command that records machine metadata for each result. | ✓ VERIFIED | `package.json` defines exactly `"test:performance": "npm run build:runtime && node tests/performance/production-picker.mjs"`. The executed command first rebuilt the runtime, then ran only the standalone gate. The harness records Node, Git, platform, arch, CPU model/count, load, and CI/run/job fields (`tests/performance/production-picker.mjs:333-353`) and its sample loop awaits each child before starting the next (`:388-391`). |
| 7 | Focused picker/Git/CLI regressions, including Git version/protocol prerequisites, pass before the final production gate. | ✓ VERIFIED | Approved focused command `npm exec -- vitest run tests/git/candidates.test.ts tests/git/comparison.test.ts tests/cli/selection.test.ts tests/cli/errors.test.ts tests/cli/help.test.ts` passed: **5 files, 57 tests**. `tests/git/comparison.test.ts:72-104` specifically probes Git 2.43 and required machine protocols; `:108-132` rejects an older Git version. The separate unchanged production-gate command above then passed. |

**Score:** 7/7 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `tests/performance/production-picker.mjs` | Standalone compiled-production gate and lifecycle owner. | ✓ VERIFIED | Substantive 430-line harness creates/proves the fixture, launches production children, owns both clocks, reports raw samples/statistics, and removes the temporary root (`:1-430`). It is invoked by `package.json` and directly exercised by the passing gate. |
| `src/git/repository.ts` | Conditional PERF-01 correction surface only. | ✓ VERIFIED | No correction was required by the current passing baseline. The production path remains substantive and reached through `discoverSourceCandidates()` (`src/git/candidates.ts:287-297`); no benchmark hook or bypass was added. |
| `src/git/candidates.ts` | Conditional discovery/search correction surface only. | ✓ VERIFIED | `discoverSourceCandidates()` is the `runCli()` production default (`src/cli/run.ts:334-336`); its returned `searchBranches()` performs the native `git branch` and `git log` operations and returns real branch candidates (`src/git/candidates.ts:427-510`). |
| `src/cli/picker.ts` | Conditional search/render-handoff correction surface only. | ✓ VERIFIED | `pickOrderedSources()` is the `runCli()` production default (`src/cli/run.ts:336`); its real Inquirer `search` source renders `candidateItem().name`, whose branch format is `[Branch] {label} · {shortOid}` (`src/cli/picker.ts:153-166, 263-309`). |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `package.json` | `tests/performance/production-picker.mjs` | `test:performance` runs `build:runtime` then the standalone gate. | ✓ WIRED | Exact script observed in `package.json`; executed successfully. |
| `tests/performance/production-picker.mjs` | `dist/bin/cumpa.mjs` | Parent uses `spawn(process.execPath, [executablePath])` with fixture cwd, pipes, and `shell: false`. | ✓ WIRED | Absolute executable path is resolved at `:32-33` and spawned at `:277-283`; executed report names that absolute path. |
| `dist/bin/cumpa.mjs` | `src/cli/run.ts` | Generated bin imports and awaits compiled `run()`. | ✓ WIRED | `dist/bin/cumpa.mjs:2-4`; build source produces the same wrapper (`scripts/build-bin.mjs:6-18`). |
| `src/cli/run.ts` | `src/git/candidates.ts` | `runCli()` defaults to real `discoverSourceCandidates()`. | ✓ WIRED | `src/cli/run.ts:24, 334-336, 472-474`; discovery implementation at `src/git/candidates.ts:287-510`. |
| `src/cli/picker.ts` | `src/git/candidates.ts` | Prompt source forwards entered term to `SourceDiscovery.searchBranches()` and renders merged candidate names. | ✓ WIRED | `src/cli/picker.ts:263-287, 304-309`; `src/git/candidates.ts:427-510`. |

### Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Produces real data | Status |
| --- | --- | --- | --- | --- |
| `src/cli/picker.ts` | Branch search items | `SourceDiscovery.searchBranches(term, signal)` | Native Git `branch --list` plus `log --stdin` returns parsed, abbreviated branch candidates; `candidateItem()` supplies the rendered row name. | ✓ FLOWING |
| `tests/performance/production-picker.mjs` | Fixture proof and timing samples | Disposable native-Git repository and real child stdout | Exact ref inventories are derived from Git/filesystem state; raw timings are parent `performance.now()` deltas on child stdout markers. | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Focused picker/Git/CLI contracts, including Git 2.43/protocol prerequisite tests | `npm exec -- vitest run tests/git/candidates.test.ts tests/git/comparison.test.ts tests/cli/selection.test.ts tests/cli/errors.test.ts tests/cli/help.test.ts` | Exit 0; 5 files and 57 tests passed. | ✓ PASS |
| Compiled production readiness/search gate | `npm run test:performance` | Exit 0; rebuilt runtime, then emitted `classification: "PASS"`, exact 10,000 packed/no-loose fixture proof, one warmup, five measured samples, and both fixed-budget medians passed. | ✓ PASS |

### Production-Gate Evidence

- **Compiled path:** current result reports `/Users/alessandro/projects/diff-review/dist/bin/cumpa.mjs`; the gate launches it with Node, `shell: false`, disposable fixture `cwd`, and stdio pipes.
- **Fixture proof:** `10000` expected/logical/packed heads; `0` loose head files; expected/logical/packed set comparisons all `true`.
- **Warmup:** one complete discarded sample: readiness `264.650834` ms, search `38.290583` ms.
- **Measured readiness samples (ms):** `218.595542`, `218.303333`, `232.982584`, `221.532417`, `223.814625`; raw median `221.532417 <= 400`.
- **Measured search samples (ms):** `38.266167`, `37.274166`, `39.490291`, `36.605625`, `39.703375`; raw median `38.266167 <= 500`.
- **Lifecycle:** each current measured child closed by `SIGTERM` with `cleanupSucceeded: true`; the harness only marks PASS after `childrenSettled` and temporary-root removal checks (`tests/performance/production-picker.mjs:401-429`).
- **No bypass:** the shared baseline deletes all Git-routing variables plus `COMPARE_LAUNCH_OPTIONS` and `CMUX_WORKSPACE_ID` (`tests/performance/production-picker.mjs:18-30`); picker children derive only from that sanitized baseline (`:210-222`).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| PERF-01 | `11-01-PLAN.md` | Ordered picker usable within 400 ms of process start in a 10,000 packed-local-ref production benchmark. | ✓ SATISFIED | Real compiled path, exact eager rendered row, five raw parent-clock samples; current median `221.532417` ms. |
| PERF-02 | `11-01-PLAN.md` | Matching local branch result within 500 ms of entering a term in the same production benchmark. | ✓ SATISFIED | Real stdin term, exact rendered `branch-09999` row, five raw parent-clock samples; current median `38.266167` ms. |

`11-01-PLAN.md` declares both requirement IDs, and `.planning/REQUIREMENTS.md:22-23, 49-50` maps exactly PERF-01 and PERF-02 to Phase 11. No Phase 11 requirement is orphaned.

### Code-Review Closure

The current code independently confirms every closure item recorded in `11-REVIEW.md`:

| Closed finding | Current code evidence | Status |
| --- | --- | --- |
| CR-01 — Git routing isolation | Shared `baseEnvironment` deletes six Git routing variables before fixture commands and picker children inherit it (`tests/performance/production-picker.mjs:18-31, 210-222`). | ✓ CLOSED |
| CR-02 — stdin EPIPE lifecycle | The child stdin error listener is attached immediately after spawn and enters the same fail/terminate path (`tests/performance/production-picker.mjs:242-267, 284`). | ✓ CLOSED |
| WR-01 — temporary-root cleanup | `tempRoot` is captured before setup and removed from `finally` after every later path (`tests/performance/production-picker.mjs:379-422`). | ✓ CLOSED |
| WR-02 — bounded raw diagnostics/marker safety | Separate bounded `Buffer` tails are continuously retained while `StringDecoder` handles marker recognition (`tests/performance/production-picker.mjs:34-42, 249-250, 286-309`). | ✓ CLOSED |
| CR-03 — launch-bypass environment | Both launch-routing variables are actually deleted before every picker child; `run()` takes `runCli()` only when `COMPARE_LAUNCH_OPTIONS` is absent (`tests/performance/production-picker.mjs:26-30, 210-222`; `src/cli/run.ts:471-479`). | ✓ CLOSED |
| WR-04 — immediate parent timing boundaries | `performance.now()` precedes `spawn()` and the guarded term write directly, with elapsed times assigned only after exact row markers (`tests/performance/production-picker.mjs:277-302`). | ✓ CLOSED |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `tests/performance/production-picker.mjs` | 392, 428 | `console.log` structured sample/final evidence | ℹ️ Info | Intentional machine-readable gate reporting; not a stub or production logging path. |

No `TBD`, `FIXME`, `XXX`, placeholder implementation, injected timing seam, threshold scaling, retry loop, or unbounded diagnostic buffer was found in the phase scope.

### Gaps Summary

None. All roadmap success criteria, all seven plan must-haves, both Phase 11 requirements, and every recorded review-closure item have direct code and runnable evidence. The performance contracts are fully automatable; no human verification is required.

---

_Verified: 2026-07-30T18:57:13Z_
_Verifier: the agent (gsd-verifier)_
