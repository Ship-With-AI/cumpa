---
title: CLI startup discovery findings
date: 2026-07-29
context: Exploration of faster time-to-picker and scalable branch search
---

# CLI Startup Discovery Findings

## Observations

- The CLI currently completes repository and source discovery before `pickOrderedSources` becomes interactive.
- A local trace measured 15 Git subprocesses before the prompt, with total startup between 429 ms and 635 ms.
- In the current one-branch, one-worktree repository, branch listing took 1.98 ms and worktree listing took 1.21 ms. Eager listing is not the current bottleneck.
- Scaling risk comes from serial `rev-parse --short` calls per distinct head and serial HEAD/status checks per worktree.

## Decision

Use staged discovery without adding recency persistence:

1. Eagerly expose the current branch and registered worktrees as initial choices.
2. Load remaining local branches when the user starts searching.
3. Avoid serial Git subprocesses per branch.

Treat fixed launch latency and large-repository search latency as separate performance budgets.
