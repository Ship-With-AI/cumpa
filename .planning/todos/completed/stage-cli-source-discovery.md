---
title: Stage CLI source discovery
date: 2026-07-29
priority: medium
---

# Stage CLI Source Discovery

Make the ordered source picker interactive before enumerating every local branch.

## Outcome

- Initial choices contain the current branch and registered worktrees using Git state only.
- Remaining local branches load when the user starts searching.
- Branch metadata is resolved in bounded or batched Git calls, not one subprocess per branch.
- The implementation satisfies `PERF-01` using the large-repository benchmark spike.
