# Spike Wrap-Up Summary

**Date:** 2026-07-30
**Spikes processed:** 2
**Feature areas:** CLI startup and source discovery
**Skill output:** `./.kimi-code/skills/spike-findings-cumpa/`

## Processed Spikes

| # | Name | Type | Verdict | Feature Area |
|---|------|------|---------|--------------|
| 001 | large-repo-startup-baseline | standard | VALIDATED | CLI startup and source discovery |
| 002 | staged-source-discovery | comparison | PARTIAL | CLI startup and source discovery |

## Key Findings

- Current eager discovery scales linearly because each distinct branch head triggers a serial `rev-parse --short=12`; 10,000 branches took 96,109.6 ms and 10,020 Git processes.
- Showing the current branch and registered worktrees before branch search reduced the tested picker-ready median to 149.7 ms.
- Filtering branches with one `git branch --list --ignore-case` call and abbreviating matching OIDs with one batched `git log --no-walk --stdin` call reduced packed-ref search to 20.4 ms for 100 matches.
- Broad packed-ref queries and 32-worktree startup remained within budget.
- The tested 10,000-loose-ref repository took 798.5 ms to search. The 500 ms requirement remains unproven for that state without persistence, a relaxed budget, or repository mutation; automatic `git pack-refs` is rejected.
