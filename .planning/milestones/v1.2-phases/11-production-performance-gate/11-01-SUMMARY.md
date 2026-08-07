---
phase: 11-production-performance-gate
plan: 01
subsystem: testing
tags: [performance, cli, inquirer, native-git, packed-refs]
requires:
  - phase: 10-on-demand-branch-search
    provides: staged native-Git branch discovery and rendered source picker
provides:
  - Compiled production-picker performance gate for PERF-01 and PERF-02
  - Reproducible 10,000-packed-local-head fixture proof and raw five-sample evidence
affects: [phase-11-verification, milestone-v1.2]
tech-stack:
  added: []
  patterns:
    - Parent-owned monotonic clocks bounded by exact real rendered Inquirer rows
    - Native-Git packed-ref fixture proof before serial production children
key-files:
  created:
    - tests/performance/production-picker.mjs
  modified:
    - package.json
key-decisions:
  - "Initial valid gate PASS required no production source edits."
  - "The harness measures only the compiled bin with real child pipes, native Git, and Inquirer rendering."
patterns-established:
  - "Performance gate: one discarded warmup, five serial samples, raw median budgets, bounded diagnostics, and awaited child/temp cleanup."
requirements-completed: [PERF-01, PERF-02]
duration: 13min
completed: 2026-07-30
status: complete
---

# Phase 11 Plan 01: Production Performance Gate Summary

**A standalone compiled-production picker gate proves packed-10,000-ref readiness and branch-search budgets with exact rendered-row timing.**

## Performance

- **Started:** 2026-07-30T18:00:17Z
- **Completed:** 2026-07-30T18:12:44Z
- **Tasks:** 3/3
- **Files modified:** 2
- **Production source edits:** 0 — Task 1's valid initial classification was `PASS`.

## Accomplishments

- Added `npm run test:performance`, which builds the runtime then spawns only the absolute compiled `dist/bin/cumpa.mjs` entrypoint.
- Created a disposable native-Git fixture with exactly 10,000 local heads (`main`, `branch-00001`–`branch-09999`), all packed and none loose before warmup.
- Proved both budgets through one discarded warmup and five serial real Inquirer processes; the final focused regression command passed 57 tests before the final gate.

## Gate Evidence

### Fixture and execution boundary

The terminal `CUMPA_PERF_RESULT` records proved, before any child process:

- `expectedCount: 10000`, `logicalCount: 10000`, `packedCount: 10000`, `looseHeadFiles: 0`.
- `logicalMatchesExpected`, `packedMatchesExpected`, and `logicalMatchesPacked`: all `true`.
- Absolute executable: `/Users/alessandro/projects/diff-review/dist/bin/cumpa.mjs`.
- Child launch: `process.execPath` plus the absolute executable, `shell: false`, fixed child pipes, real `PATH`, and removed `CUMPA_LAUNCH_OPTIONS` / `CMUX_WORKSPACE_ID`.
- Terminal markers: `[Branch] main · <fixture short OID>` for readiness and `[Branch] branch-09999 · <fixture short OID>` after exactly one `stdin.write('branch-09999')` without Enter.
- Node `24.15.0`; Git `2.50.1 (Apple Git-155)`; Darwin arm64; Apple M5 (10 CPUs); `CI=1`. The raw terminal record also contains the runner load and CI identity fields.

### Initial valid gate — `PASS`

`npm run test:performance -- --accept-budget-red` completed with `classification: "PASS"`, settled children, removed the temporary root, and no diagnostics. This Task 1 payload did **not** emit `completed`; its `warmup` object and five `samples` entries establish the one discarded warmup and five measured invocations.

| Invocation | Readiness ms | Search ms |
|---|---:|---:|
| Discarded warmup | 404.6617500000002 | 41.39958300000035 |
| Measured 1 | 250.1772919999994 | 54.04874999999993 |
| Measured 2 | 221.96391700000004 | 36.78145899999981 |
| Measured 3 | 216.95570899999984 | 38.66874999999982 |
| Measured 4 | 225.8266250000006 | 36.26050000000032 |
| Measured 5 | 215.30920900000092 | 38.423917000000074 |

- Readiness raw min/median/max: `215.30920900000092 / 221.96391700000004 / 250.1772919999994` ms; budget `<= 400` ms.
- Search raw min/median/max: `36.26050000000032 / 38.423917000000074 / 54.04874999999993` ms; budget `<= 500` ms.
- Because both values passed, Task 2 made no conditional production change and no stage probes were introduced.

### Historical final unchanged gate — `PASS`

The required final command was:

```text
npm exec -- vitest run tests/git/candidates.test.ts tests/git/comparison.test.ts tests/cli/selection.test.ts tests/cli/errors.test.ts tests/cli/help.test.ts && npm run test:performance
```

It passed **5 test files / 57 tests**, then emitted `classification: "PASS"`, `completed: { warmups: 1, measured: 5 }`, `childrenSettled: true`, `tempRemoved: true`, and `diagnostics: null`.

| Invocation | Readiness ms | Search ms |
|---|---:|---:|
| Discarded warmup | 283.9056250000003 | 39.57691700000032 |
| Measured 1 | 225.34012500000063 | 40.18541699999969 |
| Measured 2 | 233.2207500000004 | 38.40845900000022 |
| Measured 3 | 245.8800000000001 | 46.34062499999982 |
| Measured 4 | 236.38437500000055 | 39.857750000000124 |
| Measured 5 | 225.76566600000115 | 44.115499999999884 |

- Final readiness raw min/median/max: `225.34012500000063 / 233.2207500000004 / 245.8800000000001` ms; budget `<= 400` ms.
- Final search raw min/median/max: `38.40845900000022 / 40.18541699999969 / 46.34062499999982` ms; budget `<= 500` ms.

### Post-CR-03/WR-04 gate — `PASS`

With the shared environment deleting `CUMPA_LAUNCH_OPTIONS` and `CMUX_WORKSPACE_ID`, and parent clocks starting immediately before `spawn()` and the guarded `stdin.write('branch-09999')`, `npm run test:performance` exited `0`. It emitted `classification: "PASS"`, `completed: { warmups: 1, measured: 5 }`, `childrenSettled: true`, `tempRemoved: true`, `diagnostics: null`, and `environment: { removedCumpaLaunchOptions: true, removedCmuxWorkspaceId: true, shell: false, stdinTerm: "branch-09999" }`. Fixture proof: `expectedCount: 10000`, `logicalCount: 10000`, `packedCount: 10000`, `looseHeadFiles: 0`; all three set comparisons were `true`.

| Invocation | Readiness ms | Search ms |
|---|---:|---:|
| Discarded warmup | 275.4880830000002 | 35.987208000000464 |
| Measured 1 | 213.104875 | 36.39816599999995 |
| Measured 2 | 211.95970800000032 | 36.07824999999957 |
| Measured 3 | 214.61366699999962 | 34.94012499999917 |
| Measured 4 | 291.18216699999994 | 41.32329200000004 |
| Measured 5 | 215.50520799999958 | 38.64375000000018 |

- Readiness raw min/median/max: `211.95970800000032 / 214.61366699999962 / 291.18216699999994` ms; budget `<= 400` ms.
- Search raw min/median/max: `34.94012499999917 / 36.39816599999995 / 41.32329200000004` ms; budget `<= 500` ms.

## Task Commits

1. **Task 1: GATE FIRST** — `09afe5a` (`test`) — harness and package command.
2. **Task 2: RED→GREEN** — no commit; the valid initial `PASS` required and preserved zero conditional production edits.
3. **Task 3: REFACTOR/PROOF** — `1e477fd` (`refactor`) — explicit completed-invocation evidence, focused regressions, and final unchanged gate.

## Files Created/Modified

- `tests/performance/production-picker.mjs` — standalone Node 24 production harness with fixture proof, watchdogs, safe child escalation, bounded diagnostics, and machine-readable classification.
- `package.json` — adds exactly `test:performance` using `build:runtime` then the standalone harness.

## Decisions Made

- Initial valid `PASS` is the only evidence permitted to decide Task 2; no production files were changed.
- The fixed median cumpas unrounded parent-clock durations. Display rounding is not used for acceptance.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Repaired a temporary harness lifecycle cleanup regression**
- **Found during:** Task 1.
- **Issue:** Compaction of successful sample records left a stale `terminating` assignment, producing a harness `HARD_FAILURE` before measurement.
- **Fix:** Removed the stale assignment and reran the required gate until it produced a valid initial `PASS`; added explicit completed warmup/measured counters to the terminal report.
- **Files modified:** `tests/performance/production-picker.mjs`.
- **Verification:** Initial valid gate and final unchanged gate both reported a complete 1+5 set, successful lifecycle cleanup, and `PASS`.
- **Committed in:** `09afe5a`, `1e477fd`.

**Total deviations:** 1 auto-fixed (Rule 1). **Impact:** Corrected only the harness lifecycle/reporting contract; no production code, budget, fixture, sample policy, marker, or acceptance seam changed.

## Issues Encountered

- Two preliminary harness runs correctly classified `HARD_FAILURE` after the lifecycle regression; neither advanced Task 2. The valid initial `PASS` and final `PASS` had no hard-failure diagnostics.

## User Setup Required

None — the gate uses existing Node 24, installed Git, the current lockfile, and the generated production binary.

## Next Phase Readiness

- PERF-01 and PERF-02 now have reproducible production-path evidence.
- No phase completion, verification artifact, review artifact, or project-wide validation was performed by this plan executor.

## Self-Check: PASSED

- `tests/performance/production-picker.mjs` exists and was exercised by the final command.
- Task commits `09afe5a` and `1e477fd` exist.
- The final focused five-file Vitest command passed before the unchanged default gate classified `PASS`.
