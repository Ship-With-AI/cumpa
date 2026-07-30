---
phase: 09-immediate-source-picker
verified: 2026-07-30T12:07:18Z
status: passed
score: 9/9 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 09: Immediate Source Picker Verification Report

**Phase Goal:** Users can begin ordered source selection from the attached current branch and registered worktrees without waiting for remaining local branches to be enumerated.
**Verified:** 2026-07-30T12:07:18Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | User can interact with the ordered source picker before Compare enumerates the remaining local branches. | ✓ VERIFIED | `discoverSourceCandidates()` builds only repository/worktree prerequisites before returning `initialCandidates`; the complete `for-each-ref --sort=refname … refs/heads` occurs only inside `searchBranches()` (`src/git/candidates.ts:143-322`). The focused Git contract records no unbounded eager ref command and the focused CLI contract invokes both prompts from `source(undefined)` while `searchStarted` remains false (`tests/git/candidates.test.ts:153-215`, `tests/cli/selection.test.ts:252-297`). Both focused suites passed. |
| 2 | User initially sees the attached current branch and every registered worktree as source choices. | ✓ VERIFIED | The eager snapshot derives `branch:<full-ref>` solely from the current porcelain worktree record and includes all parsed worktree records in Git record order (`src/git/candidates.ts:174-261`). Real-Git tests cover attached, linked, detached, dirty, unavailable, and duplicate-OID rows, including the no-fabricated-branch detached-current case (`tests/git/candidates.test.ts:27-150`). `buildSourceSearchItems()` presents branches before worktrees and disables rather than hides unavailable registered worktrees (`src/cli/picker.ts:177-212`). |
| 3 | User can choose an eager source for either ordered Base or Head selection without waiting for the remaining branch namespace. | ✓ VERIFIED | Empty/undefined prompt terms return the eager candidates without invoking `searchBranches` (`src/cli/picker.ts:282-295`); the picker keeps its Base-then-Head flow and exact-ID registry (`src/cli/picker.ts:325-411`). The staged picker test completes Base from the attached branch and Head from the current worktree while deferred discovery never starts (`tests/cli/selection.test.ts:252-297`). |
| 4 | A non-empty term explicitly starts deferred local-branch discovery, while an empty term performs no branch enumeration. | ✓ VERIFIED | `searchBranches('')` returns a frozen empty array before any Git call; non-empty terms run the existing sorted local-ref inventory, filter case-insensitive identifying fields, and return frozen exact-ref candidates (`src/git/candidates.ts:264-322`). Recording-runner coverage proves no Git work for empty input, two uncached non-empty inventories, and a full sorted enumeration only after lookup (`tests/git/candidates.test.ts:153-215`). |
| 5 | Startup retains fatal Git/version/root/HEAD/protocol checks without a hidden eager all-refs probe. | ✓ VERIFIED | `discoverGitRepository()` retains version, root, bare, HEAD, and machine-protocol checks; its ref-format capability check is bounded by `--count=1` (`src/git/repository.ts:42-218`). The comparison matrix passes positive bounded-probe coverage, fatal prerequisite mapping, and the review-fix abort propagation cases (`tests/git/comparison.test.ts:63-204`). |
| 6 | Completed non-empty lookups make lazy branch rows selectable by their exact stable IDs for either ordered role. | ✓ VERIFIED | A picker-lifetime `candidateById` map is seeded with eager candidates, then receives only completed post-abort-check branch results before rows are returned (`src/cli/picker.ts:282-305`, `src/cli/picker.ts:325-411`). The focused contract selects distinct lazy branch objects as Base and Head and verifies that Inquirer’s exact signal is forwarded (`tests/cli/selection.test.ts:299-326`). |
| 7 | For each completed non-empty lookup, lazy branch order remains sorted-refname order with the eager attached branch at its sorted position; worktrees remain after branches in porcelain record order. | ✓ VERIFIED | `mergedCandidates()` exact-ID-deduplicates lazy branch IDs, inserts a matching eager branch by `refName`, then appends worktrees in the unchanged eager sequence (`src/cli/picker.ts:239-280`). The picker ordering test proves `alpha`, eager `feature`, `zulu`, then both worktrees (`tests/cli/selection.test.ts:328-369`); the real-Git test independently asserts porcelain worktree order (`tests/git/candidates.test.ts:69-77`). |
| 8 | Superseded or aborted lookups cannot install stale candidates or replace current prompt results. | ✓ VERIFIED | Both source callback and Git discovery check the caller signal before and after asynchronous work; aborted results throw before `candidateById` mutation (`src/cli/picker.ts:289-305`, `src/git/candidates.ts:264-322`). The focused stale-request test resolves an obsolete request after abort and verifies that it rejects rather than becoming a valid selection; the Git contract verifies an aborted lookup adds no ref enumeration (`tests/cli/selection.test.ts:371-404`, `tests/git/candidates.test.ts:205-215`). |
| 9 | Descriptor recovery recreates authority, retains the opposite endpoint, freshly exact-ID-resolves a searched branch, and leaves focus unset when it disappeared. | ✓ VERIFIED | On recoverable descriptor errors `runCli()` creates a fresh session, searches only when a failed branch is absent from the eager snapshot, accepts only an exact ID, and seeds the fresh object; it preserves only the specified opposite endpoint (`src/cli/run.ts:398-440`). Focused recovery contracts assert a fresh object is passed to the next picker and disappearance yields `focusedCandidateId: undefined` (`tests/cli/errors.test.ts:429-535`). |

**Score:** 9/9 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/git/candidates.ts` | Frozen eager `SourceDiscovery` and abortable deferred branch lookup | ✓ VERIFIED | Substantive `SourceDiscovery`, porcelain parsing/enrichment, attached-branch derivation, immutable eager snapshot, and lazy search are implemented and consumed by `runCli()`. |
| `src/git/repository.ts` | Bounded startup machine-protocol probes | ✓ VERIFIED | Protocol array retains all required probes and bounds only `for-each-ref` with `--count=1`; invoked by repository discovery. |
| `tests/git/candidates.test.ts` | Real-Git staged discovery, identity, state, and cancellation contracts | ✓ VERIFIED | Contains real fixture assertions for eager identities/states, no eager enumeration, empty/non-empty behavior, uncached lookup, and abort. Passed in the focused Git command. |
| `tests/git/comparison.test.ts` | Bounded capability-probe and startup-regression contracts | ✓ VERIFIED | Contains positive bounded-probe assertion and fatal/abort prerequisite contracts. Passed in the focused Git command. |
| `src/cli/picker.ts` | Async staged picker and exact-ID picker-lifetime registry | ✓ VERIFIED | The exported picker receives eager seeds plus `searchBranches`, forwards prompt cancellation, merges ordering deterministically, and resolves selections through one map. |
| `src/cli/run.ts` | Discovery handoff, current-worktree suggestion, and fresh recovery | ✓ VERIFIED | `runCli()` passes only eager candidates initially, derives Head suggestion from an available current worktree, and refreshes recovery authority. |
| `tests/cli/selection.test.ts` | Immediate selection, lazy selection, ordering, identity, and abort-race contracts | ✓ VERIFIED | Exercises source callbacks directly for the interaction timing and lifecycle contracts. Passed in the focused CLI command. |
| `tests/cli/errors.test.ts` | Fresh searched-branch recovery and disappeared-identity fallback | ✓ VERIFIED | Exercises descriptor failure recovery with fresh and missing exact IDs. Passed in the focused CLI command. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `src/git/candidates.ts` | `src/git/repository.ts` | Eager discovery awaits repository prerequisites | ✓ WIRED | `discoverSourceCandidates()` awaits `discoverGitRepository()` before `worktree list` and snapshot construction (`src/git/candidates.ts:147-160`). |
| `src/git/candidates.ts` | `src/git/runner.ts` | Eager worktree inspection and deferred branch inventory use `GitRunner.run` with caller signals | ✓ WIRED | Every Git command uses argument arrays through `runner.run`; eager calls use `options.signal`, lazy calls use the supplied `signal` (`src/git/candidates.ts:151-322`). |
| Current worktree record | `SourceDiscovery.initialCandidates` | Root-path/branch-ref derivation without refs enumeration | ✓ WIRED | `record.path === repository.root` plus `branchRef`, committed OID, and short OID constructs the attached branch; the separate worktree candidate is retained (`src/git/candidates.ts:219-261`). |
| `src/cli/run.ts` | `src/git/candidates.ts` | `SourceDiscovery` eager snapshot and branch operation handoff | ✓ WIRED | `runCli()` receives `SourceDiscovery`, passes `initialCandidates` and `searchBranches` to `pickSources`, and refreshes both on recovery (`src/cli/run.ts:334-429`). |
| `src/cli/picker.ts` | `@inquirer/search` | Prompt source forwards exact abort signal | ✓ WIRED | Default prompt passes `config.source` to `search`; `sourceForPrompt` forwards its supplied `signal` to `searchBranches` (`src/cli/picker.ts:282-305`, `src/cli/picker.ts:327-337`). |
| Picker source callback | Exact-ID registry | Completed non-aborted rows install authority before rendering | ✓ WIRED | The post-await `signal.throwIfAborted()` precedes `candidateById.set`; Base and Head retrieve choices from that shared map (`src/cli/picker.ts:298-305`, `src/cli/picker.ts:325-411`). |
| `src/cli/run.ts` recovery | `src/cli/picker.ts` recovery | Fresh exact-ID candidate seeds recovery focus while opposite endpoint remains retained | ✓ WIRED | Fresh eager/lazy lookup determines recovery candidates; `initialBase`/`initialHead` preserve only the requested role and recovery carries the fresh focus ID (`src/cli/run.ts:410-440`). |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `src/git/candidates.ts` | `initialCandidates` | Native Git repository probes and `worktree list --porcelain -z`, plus per-worktree HEAD/status calls | Yes — parsed Git output constructs immutable branch/worktree candidates | ✓ FLOWING |
| `src/git/candidates.ts` | Deferred branch candidates | Native Git `for-each-ref --sort=refname` and per-OID abbreviation | Yes — parsed/filterable local refs construct exact-ID branch candidates | ✓ FLOWING |
| `src/cli/run.ts` | Picker `candidates` / `searchBranches` | `SourceDiscovery.initialCandidates` / `SourceDiscovery.searchBranches` | Yes — direct session handoff, not static fallback | ✓ FLOWING |
| `src/cli/picker.ts` | Rendered prompt rows and `candidateById` | Eager session data and completed lazy lookup results | Yes — rows are built from candidates and selected IDs resolve through the same runtime registry | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Eager snapshot, bounded startup probe, empty/non-empty discovery, identities, worktree truth, and cancellation | `npm exec -- vitest run tests/git/candidates.test.ts tests/git/comparison.test.ts` | 2 files passed; 16 tests passed | ✓ PASS |
| Immediate Base/Head interaction, lazy exact-ID selection/order, abort race, and recovery | `npm exec -- vitest run tests/cli/selection.test.ts tests/cli/errors.test.ts` | 2 files passed; 28 tests passed | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| PICK-01 | `09-01-PLAN.md`, `09-02-PLAN.md` | User can interact with the ordered source picker before Compare enumerates all remaining local branches. | ✓ SATISFIED | Eager discovery has no unbounded local-ref command; empty picker requests render immediately; focused Git and CLI interaction contracts passed. |
| PICK-02 | `09-01-PLAN.md`, `09-02-PLAN.md` | User initially sees the attached current branch and registered worktrees as selectable sources. | ✓ SATISFIED | Eager snapshot derives the attached branch and preserves all worktree rows/states; picker renders branch-first/worktree-second with unavailable rows visibly disabled; focused contracts passed. |

No orphaned Phase 09 requirements were found: `.planning/REQUIREMENTS.md` maps only PICK-01 and PICK-02 to Phase 09, and both plans declare both IDs.

### Review-Fix Impact

The post-plan fixes are present and covered by the focused commands: `escapeTerminalText()` escapes the C1 range (`src/cli/picker.ts:93-98`; `tests/cli/selection.test.ts:109-111`), and repository root/bare fallback preserves caller cancellation (`src/git/repository.ts:149-174`; `tests/git/comparison.test.ts:164-204`). These fixes do not alter staged discovery, identity, picker order, or recovery authority.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `tests/cli/selection.test.ts` | 165 | “placeholder” appears in a test description | ℹ️ Info | It asserts that a no-match separator is not selectable; it is not a production stub or debt marker. |

No `TBD`, `FIXME`, `XXX`, `TODO`, `HACK`, production placeholder, empty implementation, or hardcoded rendered-data stub was found in the Phase 09 artifacts.

### Disconfirmation Pass

- **Partial-requirement check:** unavailable and prunable worktrees remain visible but disabled, rather than being silently removed. This preserves the pre-existing truthful-state contract while satisfying PICK-02’s initial visibility requirement.
- **Misleading-test check:** the eager interaction test is not merely a call-order assertion: it calls each real picker source callback with `undefined`, checks its returned IDs, completes Base and Head, and observes the deferred function was never started.
- **Uncovered-error-path check:** recovery’s fresh lazy branch lookup has no explicit abort signal because descriptor recovery runs outside the Inquirer request lifecycle. It is not a Phase 09 cancellation gap: the lookup is immediately awaited before recovery state is installed, and cancellation authority is covered at the public prompt/Git seams by the passing abort contracts.

---

_Verified: 2026-07-30T12:07:18Z_
_Verifier: the agent (gsd-verifier)_
