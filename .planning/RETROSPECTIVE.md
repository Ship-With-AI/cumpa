# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-07-24
**Phases:** 5 | **Plans:** 40 | **Executed tasks:** 75

### What Was Built

- A Node.js CLI that discovers local branches and registered worktrees, freezes ordered native-Git merge-base comparisons, and launches a token-protected loopback browser session.
- A real Monaco side-by-side review workspace with exact durable line anchors, per-file state, complete comment and summary lifecycle, atomic repository-local drafts, conflict/recovery handling, and selector-drift reporting.
- Canonical JSON and derived Markdown export as a validated atomic pair with receipts, hashes, safe reveal, ignore management, relaunch/resume, and generated-package acceptance.
- A closure phase that eliminated cross-file async settlement corruption and made success, persistence failure, concurrent conflict, controller replacement, and repeated announcements origin-safe.

### What Worked

- Native Git remained the sole semantic authority. Fixed argument arrays, NUL-framed protocols, opaque IDs, and exact path bytes kept branch/worktree, rename, blob, and unusual-path behavior aligned with Git.
- RED-to-GREEN plan commits made state-machine and persistence contracts explicit before implementation. The final Phase 04.1 TDD review found zero sequence violations.
- Generated-package Playwright journeys exercised real Git repositories, the shipped CLI/server/browser assets, Monaco, persisted drafts, and export bytes instead of relying only on development seams.
- Independent code, security, UI, and goal verification found load-bearing issues that focused implementation tests initially missed: replaced-controller callbacks, mutable conflict revision metadata, hidden live-region styling, revision-conflict announcements, and repeated identical announcements.
- Canonical server-returned state and serialized compare-and-swap mutation prevented browser state from becoming persistence authority.

### What Was Inefficient

- The initial Phase 2 verification accepted an async callback path without a production A-to-B delayed-settlement journey. The milestone audit found WR-002 late and required closure Phase 04.1.
- Phase 3 requirements were behaviorally verified but seven checkboxes and traceability rows remained stale until milestone completion.
- The `test:browser` script is only valid with an explicit file filter because `--config=tests` otherwise collects Vitest files. The canonical full browser command is `npm run test:package`; this mismatch caused one invalid regression attempt.
- Full-suite load exposed a stale `.sr-only` test selector and a five-second callback assertion bound only after focused tests were green. The final configured suite passed 56/56 after correcting both.
- Automatic milestone accomplishment extraction emitted one bullet per summary; manual curation was required to produce a useful release-level record.

### Patterns Established

- Freeze refs once; pass full object identities through every downstream comparison, draft, anchor, drift, and export boundary.
- Browser requests use opaque capabilities; repository paths, refs, object IDs, and filesystem destinations remain server-owned.
- Persist first, then accept only the typed server-returned canonical draft. Conflicts retain local buffers and expose authoritative latest state.
- Immutable anchors are verified exactly; mismatch becomes stale or orphaned and is never silently relocated.
- Async UI commands capture controller, file, request, and originating revision identity before awaiting external work.
- Accessible live feedback must be visually hidden with an existing utility and must force a fresh DOM update for repeated identical messages.
- Release evidence belongs at the generated-package boundary and must independently reread durable output bytes.

### Key Lessons

1. Every asynchronous command whose destination can change while awaiting must carry immutable origin identity and have a production-path interleaving test.
2. A response arriving at the network boundary does not prove the application callback settled; wait for callback-produced state while the intervening UI state remains observable.
3. Milestone audits must cross-reference requirements, verification reports, summaries, integrations, and API consumers; any single ledger can be stale or incomplete.
4. Advisory code and UI review findings should be resolved before archival when they identify data-integrity or accessibility defects, even if the phase verifier already passed.
5. Keep one documented full-suite command per test family; wrapper commands that depend on positional filters are not safe regression defaults.

### Cost Observations

- Model mix: Not measured.
- Sessions: Not measured in planning artifacts.
- Notable: 326 milestone commits across 40 plans preserved atomic history, but generated documentation and repeated package-level browser gates added substantial workflow overhead.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 5 | 40 | Established TDD, threat registers, package-first browser acceptance, cross-phase integration audit, and closure-phase remediation |

### Cumulative Quality

| Milestone | Unit | Git | API | Playwright | Requirements | Integrations | Flows |
|-----------|------|-----|-----|------------|--------------|--------------|-------|
| v1.0 | 108 | 35 | 98 | 56 | 51/51 | 22/22 | 8/8 |

### Top Lessons (Verified Across Milestones)

1. Cross-milestone trends require another shipped milestone before any lesson can be called repeated.
