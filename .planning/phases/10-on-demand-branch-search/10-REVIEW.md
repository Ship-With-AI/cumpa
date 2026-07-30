---
phase: 10-on-demand-branch-search
reviewed: 2026-07-30T14:07:50Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/git/candidates.ts
  - src/cli/picker.ts
  - tests/git/candidates.test.ts
  - tests/cli/selection.test.ts
findings:
  critical: 2
  warning: 1
  info: 0
  total: 3
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-07-30T14:07:50Z  
**Depth:** standard  
**Files Reviewed:** 4  
**Status:** issues_found

## Summary

Reviewed the Phase 10 literal local-branch lookup, strict Git output parsing, keyed abbreviation batch, fresh-only picker merge, exact-ID selection, and the focused test coverage. The fixed argv construction, `--` option terminator, literal label guard, raw-ref ordering, fresh-branch merge, and post-await picker abort gate follow the intended contract. However, both NUL parsers accept a final field without its required NUL delimiter, and branch identities are decoded lossily from repository-controlled bytes. Either defect breaks the required fail-closed/exact-ID protocol boundary. Cancellation coverage also omits the Git-stage contract.

## Critical Issues

### CR-01: Parsers accept an unterminated final NUL field as a complete record

**File:** `src/git/candidates.ts:42-62, 96-110`  
**Issue:** `splitNul()` adds trailing bytes as a field when no final NUL exists. Consequently, `parseBranchRecords()` accepts `refs/heads/topic\0topic\0<full-oid>` without the terminal delimiter (three fields), and `parseAbbreviationRecords()` likewise accepts `<full-oid>\0<short-oid>`. The checks for field counts, OIDs, and record separators all pass. A truncated Git stdout protocol is therefore published as a valid candidate/abbreviation response, contrary to the Phase 10 whole-query fail-closed requirement. The malformed-output matrix tests truncated records only after the first or second field and does not cover this terminal-delimiter case.

**Fix:** Before decoding fields, require each non-empty protocol buffer to end in a complete record terminator: either the final NUL, or Git's final `NUL + LF` form after removing the LF. Reject any final non-NUL field rather than treating it as a valid last field. Add branch and abbreviation controlled-runner cases that omit only the final NUL and assert that `searchBranches()` rejects.

### CR-02: Lossy UTF-8 decoding can collapse distinct Git ref identities

**File:** `src/git/candidates.ts:73-75`  
**Issue:** Ref names and labels arrive as Git-controlled bytes but are decoded with `Buffer.toString('utf8')` without validating UTF-8. Node replaces malformed sequences with U+FFFD. Git permits non-UTF-8 bytes in ref names, so distinct local refs such as `refs/heads/\x80` and `refs/heads/\x81` can both become `refs/heads/�`. They then produce the same `branch:${refName}` ID; `mergedCandidates()` deduplicates one row and `candidateById.set()` can overwrite the other. This violates the exact-ID selection guarantee and means malformed protocol data is not rejected fail-closed.

**Fix:** Validate that the ref and label fields are valid UTF-8 before conversion (for example, require a UTF-8 decode/re-encode round trip to equal the original field, or use `node:buffer`'s UTF-8 validator). Reject the entire lookup on invalid bytes, and add a controlled-runner test with malformed UTF-8 in a ref suffix/label that proves no candidate is returned or registered.

## Warnings

### WR-01: Tests do not prove cancellation reaches both native Git stages

**File:** `tests/git/candidates.test.ts:143-239`  
**Issue:** The recording runner retains only argv and cwd, discarding `GitRunOptions.signal`; this test therefore cannot verify that the exact caller signal reaches either the branch listing or the abbreviation batch. `tests/cli/selection.test.ts:371-419` verifies the picker's post-await stale-result gate with a fake `searchBranches`, but that fake ignores its signal and cannot detect a regression where `searchBranches()` stops forwarding the signal to `runner.run()`. This leaves the required cancellation of an in-flight second Git child unguarded.

**Fix:** Record `options.signal` in the Git test runner and assert object identity for both calls. Add controlled abort cases after starting the branch stage and after starting the log stage; each should reject the lookup and prove no later stage/candidate publication occurs.

---

_Reviewed: 2026-07-30T14:07:50Z_  
_Reviewer: the agent (gsd-code-reviewer)_  
_Depth: standard_
