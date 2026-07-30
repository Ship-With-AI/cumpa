---
phase: 09-immediate-source-picker
review: 09-REVIEW.md
status: applied
---

# Phase 09: Review Fix Report

## Applied

### CR-01: C1 terminal-control sequences are emitted unescaped

- Commit: `7272dd4` — `fix(09): escape C1 terminal controls`
- Files: `src/cli/picker.ts`, `tests/cli/selection.test.ts`
- Escaped U+0080–U+009F with the existing `\\xHH` representation; added a C1 regression assertion.

### WR-01: Aborting repository-root discovery is mapped to “not a worktree”

- Commits: `6f7183c` — `fix(09): preserve repository discovery aborts`; `4f50168` — `test(09): pass abort signal through public options`
- Files: `src/git/repository.ts`, `tests/git/comparison.test.ts`
- Preserved the originating abort from both top-level and bare-repository discovery; added focused coverage for both paths through the public `CreatePinnedComparisonOptions.signal` contract.

## Skipped

None.
