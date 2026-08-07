# Phase 11: Production Performance Gate - Pattern Map

**Mapped:** 2026-07-30  
**Files analyzed:** 2 required files; 4 conditional source files  
**Analogs found:** 2 / 2 required files

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `tests/performance/production-picker.mjs` | standalone acceptance harness | Git/file I/O, child-process streams, request-response timing | `.planning/spikes/001-large-repo-startup-baseline/support.mjs`, `benchmark.mjs`; `tests/cli/help.test.ts` | partial (no existing real-render benchmark) |
| `package.json` | package config | batch command | existing `build:runtime` and test scripts | exact |
| `src/cli/run.ts` (only if PERF-01 fails) | CLI controller/entrypoint | request-response | `runCli()`/`run()` | exact |
| `src/cli/picker.ts` (only if a segment fails) | picker component | request-response + streaming search | `sourceForPrompt()`/`pickOrderedSources()` | exact |
| `src/git/candidates.ts` (only if a segment fails) | Git discovery service | Git read/transform | `discoverSourceCandidates()`/`searchBranches()` | exact |

## Pattern Assignments

### `tests/performance/production-picker.mjs`

**Fixture/process analog:** `.planning/spikes/001-large-repo-startup-baseline/support.mjs:6-79`

```js
spawn(command, args, {
  cwd,
  env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0' },
  stdio: ['pipe', 'pipe', 'pipe'],
});
```

Copy the one-stream fast-import algorithm from `support.mjs:33-49`: `main` plus `branch-00001` through `branch-09999`, distinct commits, one shared small blob. Create a fresh `mkdtemp` repository, `git init -q -b main`, fast-import, reset `main`, then run `git pack-refs --all`. Keep all setup outside timed intervals and remove the temp root recursively in `finally` (`support.mjs:51-79`). Add stronger proofs than the spike: `git for-each-ref --format=%(refname) refs/heads` must equal the exact 10,000-ref set; recursively inspect the common Git dir's `refs/heads` for zero loose files; parse `packed-refs` branch records and require the same exact set.

**Production launch analog:** `tests/cli/help.test.ts:1-25` resolves `dist/bin/cumpa.mjs` with `fileURLToPath(new URL(...))` and invokes `spawnSync(process.execPath, [executablePath], { cwd, encoding: 'utf8', timeout: 10_000 })`. Use asynchronous `spawn` with the same executable/argv, `shell: false`, `cwd: fixture.repository`, and piped stdin/stdout/stderr. `scripts/build-bin.mjs:6-10` proves this wrapper imports `run` from `../cli/run.js` and is the shipped entrypoint.

The child environment must explicitly omit `CUMPA_LAUNCH_OPTIONS` and `CMUX_WORKSPACE_ID`: `src/cli/run.ts:460-483` bypasses the picker when the former is present. Do not import `runCli`, inject dependencies, wrap Git, or add a PTY dependency. Installed Inquirer over direct pipes is the real prompt path.

**Markers and timing:** Use parent `performance.now()` only. Start PERF-01 immediately before child `spawn()`; stop only when stdout contains the exact rendered eager row `[Branch] main · ${mainShortOid}` from `src/cli/picker.ts:145-159`. Start PERF-02 immediately before `child.stdin.write('branch-09999')`; stop only on `[Branch] branch-09999 · ${targetShortOid}`. This covers the actual chain `run.ts:330-453` → `candidates.ts:287-507` → `picker.ts:263-381` → `@inquirer/search` renderer. Do not stop on prompt title, Git completion, echoed input, or synthetic child output.

Attach stream listeners immediately; use `StringDecoder('utf8')` and a rolling bounded tail so split markers/chunks are handled. Drain stderr continuously. Use a 10-second marker watchdog (not the 400/500 ms budgets), report phase/marker/exit/signal/cwd/versions and bounded tails on failure. After both markers, deliberately terminate the still-open prompt, await close, and escalate after a short cleanup timeout. Early exit is failure.

Run one complete discarded warmup, then five measured children serially. Record all raw values; no retries, outlier deletion, concurrency, adaptive samples, or platform multipliers. Sort copies and use the five-sample median: readiness `<=400 ms`, search `<=500 ms`. Report min/median/max, samples, fixture proofs, runtime/Git/platform metadata; exit nonzero on setup, invocation, timeout, or budget failure.

**Spike distinction:** Spike 001 `benchmark.mjs:17-50` imports compiled modules and injects `pickSources`/throws a readiness symbol; spike 002 uses simulated readline/staged discovery. Both are evidence only, not acceptance. `tests/cli/selection.test.ts` uses injected prompts and `tests/git/candidates.test.ts` uses injected Git runners; these remain correctness coverage, not timing seams.

### `package.json`

Add exactly:

```json
"test:performance": "npm run build:runtime && node tests/performance/production-picker.mjs"
```

Keep it out of `test:unit`, `test:git`, Vitest, and browser suites. No new dependency, PTY, benchmark framework, or statistics package.

## Conditional Source Optimization Surface

Gate first. If both medians pass, change only the harness and script. If PERF-01 fails, inspect `src/cli/run.ts:330-453`, `src/git/candidates.ts:287-507`, and `src/cli/picker.ts:295-381`. If PERF-02 alone fails, inspect `src/cli/picker.ts:263-293` (`sourceForPrompt`/merge) and `src/git/candidates.ts:392-507` (`searchBranches`). Preserve ordered selection, literal matching, deterministic sorting, cancellation, and batched abbreviation; do not add indexes, debounce, fuzzy search, automatic packing, or timing hooks. If source changes are needed, retain regression coverage in `tests/cli/selection.test.ts` and `tests/git/candidates.test.ts`; the standalone harness remains the only latency acceptance.

## Shared Patterns

- **Native Git/process safety:** argument arrays + `shell:false`; sanitized Git env; continuously drain both child pipes; bounded diagnostics; only harness-owned temp paths may be removed or packed.
- **Production flow:** `dist/bin/cumpa.mjs` → Commander `run()` → `runCli()` → `discoverSourceCandidates()` → `pickOrderedSources()` → `sourceForPrompt()` → native `searchBranches()` → real Inquirer rendered `candidateItem().name`.
- **Fixture lifecycle:** mirror `tests/helpers/git-fixture.ts:57-207` (`mkdtemp`, deterministic Git setup, async cleanup) and spike support's `finally` removal. The small correctness fixture is not suitable for 10,000 refs.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `tests/performance/production-picker.mjs` | acceptance harness | real terminal output + parent timing | No existing file drives the shipped binary through real Inquirer rendering; existing spikes intentionally use injected/simulated seams. |

## Metadata

**Analog search scope:** `src/cli`, `src/git`, `scripts`, `tests/cli`, `tests/git`, `tests/helpers`, `.planning/spikes`, package config.  
**Pattern extraction date:** 2026-07-30
