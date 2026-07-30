---
phase: 09-immediate-source-picker
reviewed: 2026-07-30T11:40:03Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/cli/picker.ts
  - src/cli/run.ts
  - src/git/candidates.ts
  - src/git/repository.ts
  - src/git/inventory.ts
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
status: issues_found
---

# Phase 09: Code Review Report

**Reviewed:** 2026-07-30T11:40:03Z  
**Depth:** standard  
**Files Reviewed:** 5  
**Status:** issues_found

## Summary

Reviewed the staged source-discovery, picker handoff, repository probe, and the post-wave byte-exact `.compare` path filtering change. The internal-path filter correctly distinguishes only the repository-root `.compare` directory from lookalike or nested names. Two actionable defects remain: Git-controlled text can inject C1 terminal controls, and cancellation during repository discovery can be incorrectly reported as a fatal non-worktree error.

## Critical Issues

### CR-01: C1 terminal-control sequences are emitted unescaped

**Severity:** BLOCKER  
**File:** `src/cli/picker.ts:78-112`  
**Issue:** `escapeTerminalText()` escapes C0 controls and DEL, but passes the C1 control range `U+0080`–`U+009F` through unchanged. Candidate labels and paths originate from Git and are rendered through this function at lines 165-177. A repository-controlled branch name or filename containing (for example) `U+009B` (CSI) or `U+009D` (OSC) can therefore supply a terminal control sequence to terminals that recognize C1 controls, allowing terminal-state spoofing or OSC actions such as clipboard manipulation.

**Fix:** Escape the full C1 range using the existing hexadecimal representation, rather than treating only DEL as a control.

```ts
const isControl =
  codePoint < 0x20 ||
  (codePoint >= 0x7f && codePoint <= 0x9f);
result += isControl
  ? `\\x${codePoint.toString(16).toUpperCase().padStart(2, '0')}`
  : character;
```

## Warnings

### WR-01: Aborting repository-root discovery is mapped to “not a worktree”

**Severity:** WARNING  
**File:** `src/git/repository.ts:143-169`  
**Issue:** If the abort signal cancels `rev-parse --show-toplevel`, `topLevelError` is an abort error. The fallback bare-repository probe is then immediately aborted too, but its `GitRunnerError` is swallowed by the inner `catch` at lines 160-163. The method subsequently creates a `LaunchError('not-worktree')` at line 165. This converts caller cancellation into a fatal repository-shape failure instead of preserving cancellation, unlike the explicit signal handling in the surrounding prerequisite probes.

**Fix:** Re-throw aborted work before attempting or swallowing the fallback probe, and re-throw an abort from the fallback probe as well.

```ts
} catch (topLevelError) {
  if (signal?.aborted) {
    throw topLevelError;
  }
  try {
    // existing bare-repository probe
  } catch (bareError) {
    if (bareError instanceof LaunchError || signal?.aborted) {
      throw bareError;
    }
  }
  // existing not-worktree mapping
}
```

---

_Reviewed: 2026-07-30T11:40:03Z_  
_Reviewer: gsd-code-reviewer_  
_Depth: standard_
