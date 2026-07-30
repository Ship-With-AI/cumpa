# Spike Manifest

## Idea

Measure current CLI startup against a representative repository with 10,000 local branches, then compare it with staged source discovery that exposes the current branch and registered worktrees before loading searchable branches.

## Requirements

- The ordered source picker must be usable within 400 ms from process start.
- Initial choices use Git state only: the current branch and registered worktrees.
- First branch-search results must appear within 500 ms with 10,000 local branches.
- Branch discovery must not invoke a serial Git subprocess per branch.
- No branch-recency persistence is introduced.

## Spikes

| # | Name | Type | Validates | Verdict | Tags |
|---|------|------|-----------|---------|------|
| 001 | large-repo-startup-baseline | standard | Given 10,000 local branches, when the current CLI reaches its picker, then fixed and scaled latency plus Git subprocess counts are measured separately. | VALIDATED | cli, git, performance |
| 002 | staged-source-discovery | comparison | Given the same repository, when eager discovery is compared with current-branch/worktree-first discovery, then both latency budgets hold without serial per-branch Git calls. | PENDING | cli, git, performance, search |
