---
phase: 10-on-demand-branch-search
verified: 2026-07-30T16:30:44Z
status: passed
score: 7/7 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 10: On-Demand Branch Search Verification Report

**Phase Goal:** Users can discover and choose matching local branches on demand without restoring eager full-branch enumeration.
**Verified:** 2026-07-30T16:30:44Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | SRCH-01: a non-empty term returns complete matching local branch names on demand, while empty input performs no branch-search Git work. | ✓ VERIFIED | `SourceDiscovery.searchBranches()` exits before `runner.run` for `term.length === 0` (`src/git/candidates.ts:434-436`); non-empty terms use one `git branch --list` request (`438-451`) and only run the `git log` batch after non-empty validated records (`467-485`). The real-Git recording-runner test asserts zero calls for empty input, one filtered branch call for matches, and no `log` for no-match inputs (`tests/git/candidates.test.ts:151-263`). |
| 2 | Branch-name matching is case-insensitive and treats Git wildcard characters, backslashes, and option-looking text as literal user data rather than broader patterns or command options. | ✓ VERIFIED | `escapeBranchPattern()` escapes `\\`, `*`, `?`, `[`, and `]` then wraps only the resulting term in substring wildcards (`src/git/candidates.ts:133-135`); the fixed argv includes `--ignore-case` and places the sole pattern after `--` (`438-450`). Parsed rows are additionally guarded by lower-cased `record.label.includes(query)` (`453-455`). The real-Git test covers mixed case, `*`, `?`, `[`, `]`, `\\`, and `--target`, including argv position and no abbreviation work (`tests/git/candidates.test.ts:178-263`). |
| 3 | Every successful non-empty lookup consumes and validates the complete branch-record NUL protocol before abbreviation: every record has a non-empty `refs/heads/` ref, non-empty label, and valid full OID, and any truncated, extra, empty, invalid, or non-local record rejects the whole query before publication. | ✓ VERIFIED | `splitNulLineTerminated()`, `parseLocalBranchRef()`, and `parseBranchRecords()` require exact final framing, triples, record separators, valid UTF-8 identity fields, non-empty labels, `refs/heads/` refs, valid OIDs, and unique refs (`src/git/candidates.ts:53-131`). Parsing completes before OID batching/candidate construction (`452-485`). Controlled-runner cases cover truncated, extra, empty, invalid, high-bit, and remote records, each requiring promise rejection (`tests/git/candidates.test.ts:265-391`); separate cases prove malformed/duplicate/invalid-UTF-8 output never starts the abbreviation stage (`392-443`, `444-495`). |
| 4 | Abbreviation output is accepted only when its full-OID keys are exactly the requested unique OID set: every record is unique, and every short OID is lowercase hexadecimal, 12..full-length characters, and a prefix of its full OID. | ✓ VERIFIED | `parseAbbreviationRecords()` requires complete pairs/framing, full OID validation, a lowercase hexadecimal 12+ prefix no longer than and matching its full OID, and rejects duplicate keys (`137-165`). `searchBranches()` requests unique OIDs once and rejects unequal map size or missing requested keys before it maps any candidate (`467-503`). Controlled cases exercise non-hex, uppercase, non-prefix, short, duplicate/conflicting, unrequested, missing, and malformed terminators as whole-query rejections (`tests/git/candidates.test.ts:302-387`). |
| 5 | Only the latest non-aborted term can render and install branch rows; its returned exact IDs remain selectable for ordered Base or Head selection. | ✓ VERIFIED | The prompt source forwards its exact signal to `searchBranches`, checks it after await, then and only then installs candidates into the picker-lifetime exact-ID map (`src/cli/picker.ts:264-291`). The ordered picker resolves both roles only from that map (`310-360`). The stale/current race test aborts the old request, verifies its late completion rejects, verifies only current IDs render, and selects the returned exact ID as both Base and Head (`tests/cli/selection.test.ts:369-421`). The Git-stage cancellation test separately proves the same caller signal reaches either native search stage and prevents subsequent/publication work (`tests/git/candidates.test.ts:854-921`). |
| 6 | A non-empty result set contains only fresh branches returned for that term: an eager attached branch absent from the fresh lookup is not reinserted, while registered worktrees retain their truthful rows and porcelain order. | ✓ VERIFIED | `mergedCandidates()` exact-ID-deduplicates only its fresh `branches` argument, preserving that order, then appends the unchanged eager worktree sequence (`src/cli/picker.ts:236-249`); it has no eager-branch fallback. The picker regression supplies a duplicated fresh response excluding the eager branch and asserts fresh branch order followed by worktrees while the eager branch remains absent (`tests/cli/selection.test.ts:324-367`). Real-Git discovery verifies worktree identity/state and porcelain order (`tests/git/candidates.test.ts:22-131`). |
| 7 | Phase 09 truths 1–6 and 8–9 remain intact, as does truth 7's branch/worktree ordering; Phase 10 deliberately supersedes only truth 7's eager-attached-branch reinsertion clause, making the completed current term's fresh branch set authoritative. | ✓ VERIFIED | Phase 09's staged eager flow, shared registry, Base-before-Head/Back behavior, terminal escaping, and `runCli` recovery remain in their original owners (`src/cli/picker.ts:73-114`, `264-360`; `src/cli/run.ts:419-423`). The phase regression matrix passed `tests/git/comparison.test.ts` and `tests/cli/errors.test.ts` in addition to the changed Git/picker suites. The Phase 10 picker test proves the intended truth-7 replacement without changing branches-before-worktrees order (`tests/cli/selection.test.ts:324-367`). |

**Score:** 7/7 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/git/candidates.ts` | Native-Git literal local-branch search, strict complete protocols, canonical ordering, immutable results, and cancellation | ✓ VERIFIED | Substantive parser and discovery implementation (`1-507`); its `searchBranches` closure is consumed by the picker and recovery paths. Focused real-Git and controlled-runner contracts pass. |
| `src/cli/picker.ts` | Fresh-result-only branch merge over the exact-ID staged picker | ✓ VERIFIED | `mergedCandidates` and `sourceForPrompt` are substantive and executed by exported `pickOrderedSources` (`236-360`); focused interaction contracts pass. |
| `tests/git/candidates.test.ts` | Literal/local-only/batching/order/protocol/cancellation behavior contracts | ✓ VERIFIED | Contains real fixture plus controlled-runner tests for each required native-Git behavior; executed in the passing matrix. |
| `tests/cli/selection.test.ts` | Current-term rendering, stale suppression, exact-ID roles, and worktree-order contracts | ✓ VERIFIED | Executes `SourceSearchPromptConfig.source` through `pickOrderedSources`, including current/stale race and fresh-only merge; executed in the passing matrix. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `src/cli/picker.ts` | `src/git/candidates.ts` | `sourceForPrompt` forwards exact term and `AbortSignal` to `searchBranches` | ✓ WIRED | `await searchBranches(effectiveTerm!, signal)` occurs before the post-await abort gate (`src/cli/picker.ts:280-281`); the selection contract observes the received signal (`tests/cli/selection.test.ts:280-322`). |
| `src/git/candidates.ts` | `src/git/runner.ts` | Fixed argument arrays through `runner.run` | ✓ WIRED | Listing and optional batch use array literals with `signal`, and OIDs are stdin bytes (`src/git/candidates.ts:438-451`, `467-485`). `GitRunner` uses `spawn(..., { shell: false })` (`src/git/runner.ts:142-155`). |
| Branch records | `BranchCandidate` | Complete branch parsing plus exact abbreviation key set | ✓ WIRED | Candidate construction follows parser/key-set validation and retrieves each short OID only after success (`src/git/candidates.ts:486-503`). |
| `sourceForPrompt` | `candidateById` | Post-await abort check before exact-ID registry installation | ✓ WIRED | Signal gate directly precedes the registration loop (`src/cli/picker.ts:280-284`); stale-result test exercises the sequence (`tests/cli/selection.test.ts:369-421`). |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `src/git/candidates.ts` | `records` / frozen `BranchCandidate[]` | Native `git branch` stdout, then native `git log` stdin batch | Yes — parsed protocol bytes and exact-set abbreviation map, never a static fallback | ✓ FLOWING |
| `src/cli/picker.ts` | `branches` / rendered prompt items | Awaited `SourceDiscovery.searchBranches(term, signal)` result | Yes — fresh candidates are registered and rendered through `buildSourceSearchItems` | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| SRCH-01 lookup, literal patterns, local-only scope, canonical order, strict protocols, exact OIDs, cancellation, and worktree truth | `npm exec -- vitest run tests/git/candidates.test.ts tests/git/comparison.test.ts tests/cli/selection.test.ts tests/cli/errors.test.ts` | 4 files passed; 56 tests passed | ✓ PASS |
| Current-term rendering, stale-result suppression, exact-ID Base/Head selection, and fresh-only branch merge | Same focused matrix; exercised by `tests/cli/selection.test.ts` | Included in 4 files passed; 56 tests passed | ✓ PASS |
| Phase 09 comparison/recovery regression | Same focused matrix; exercised by `tests/git/comparison.test.ts` and `tests/cli/errors.test.ts` | Included in 4 files passed; 56 tests passed | ✓ PASS |

### Probe Execution

No phase probe was declared by the plan or summary, and this is not a migration/tooling phase. **SKIPPED — no probe applicable.**

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| SRCH-01 | `10-01-PLAN.md` | User can enter a non-empty search term and receive case-insensitive literal matches from local branch names on demand. | ✓ SATISFIED | `searchBranches` runs a filtered local-only native Git request only for non-empty input; the real-Git contract proves case-insensitive literal matches and the picker contract proves returned exact IDs are selectable. The focused matrix passed. |

No orphaned Phase 10 requirements: `.planning/REQUIREMENTS.md` assigns only `SRCH-01` to Phase 10, and `10-01-PLAN.md` claims it.

### Review-Fix and Regression Closure

| Concern | Final code evidence | Verification evidence |
| --- | --- | --- |
| Complete NUL framing and byte-safe identity/OID handling | Strict final newline/NUL framing, UTF-8 identity checks, Latin-1 OID validation, and duplicate rejection are in `src/git/candidates.ts:53-165`. | Controlled malformed framing, invalid UTF-8, and high-bit OID tests pass (`tests/git/candidates.test.ts:265-495`). |
| Exact cancellation and publication gates | Discovery/search checks signals around Git stages; picker checks again before registry mutation (`src/git/candidates.ts:431-503`; `src/cli/picker.ts:264-284`). | Both-stage Git cancellation and stale picker race tests pass (`tests/git/candidates.test.ts:854-921`; `tests/cli/selection.test.ts:369-421`). |
| Worktree truth and immutable candidates | Worktree porcelain parser rejects malformed, contradictory, duplicate, and invalid identities; published candidates are frozen (`src/git/candidates.ts:167-426`). | Worktree protocol/state/immutability coverage passes (`tests/git/candidates.test.ts:22-131`, `496-853`). |
| No eager full-branch restoration; Phase 11 budgets remain out of scope | The only `for-each-ref` under `src/` is the pre-existing startup capability probe bounded by `--count=1` (`src/git/repository.ts:91-93`); Phase 10 search uses `git branch --list` only after a non-empty term. Roadmap Phase 11 exclusively owns the 400/500 ms budgets. | Recording-runner and source inspection confirm empty input starts no branch search; no latency threshold was run or used as Phase 10 evidence. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `tests/cli/selection.test.ts` | 165 | `placeholder` in a test description | ℹ️ Info | It asserts that a no-match separator is not selectable; it is not a production placeholder or incomplete implementation. |

No `TBD`, `FIXME`, `XXX`, `TODO`, `HACK`, production stub, swallowed runner error, eager branch fallback, cache/index/background enumeration, or Phase 11 latency claim was found in the four phase-owned files.

### Disconfirmation Checks

- **Partial-requirement check:** the literal guard filters only `record.label`, not ref/OID/alias metadata (`src/git/candidates.ts:452-456`); the shared-OID metadata lookup test returns no result (`tests/git/candidates.test.ts:255-262`).
- **Misleading-test check:** cancellation is not inferred from mock call order alone. The Git test aborts at both native stages and checks the second stage is not reached after branch-stage cancellation (`tests/git/candidates.test.ts:854-921`), while the picker test resolves the stale promise after abort and requires rejection (`tests/cli/selection.test.ts:369-421`).
- **Error-path check:** malformed Git stdout is fail-closed rather than reduced to empty results; branch, abbreviation, and worktree malformed-protocol families each pass controlled rejection contracts (`tests/git/candidates.test.ts:265-921`).

### Human Verification Required

None. All behavior-dependent cancellation, ordering, exact-ID selection, and protocol-validation truths were executed by focused automated contracts. Visual validation is not a Phase 10 acceptance criterion because the phase delivers terminal prompt data/selection behavior rather than a browser UI.

---

_Verified: 2026-07-30T16:30:44Z_
_Verifier: the agent (gsd-verifier)_
