# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## cwt-slow-picker-startup — Real multi-worktree picker blocked on exact dirty scans
- **Date:** 2026-07-31
- **Error patterns:** slow startup, picker readiness, CWT, worktree status, dirty-state scans
- **Root cause:** `discoverSourceCandidates` treated exact dirty-state completion as a prerequisite for publishing already-resolved worktree identities; CWT's 30 native status scans have an irreducible roughly 6.7-second completion cost.
- **Fix:** Publish ordered identities with explicit pending availability, start one shared asynchronous exact enrichment after initial prompt publication, refresh later prompt sources, and await enrichment before accepting worktree selections.
- **Files changed:** src/domain/source.ts, src/git/candidates.ts, src/cli/picker.ts, src/cli/run.ts, tests/git/candidates.test.ts, tests/cli/selection.test.ts
---
