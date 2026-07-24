# Milestones

## v1.0 MVP (Shipped: 2026-07-24)

**Scope:** 5 phases, 40 plans, 75 executed tasks, 51 requirements

**Timeline:** 2026-07-20 → 2026-07-24

**Git range:** `cdf6f82` → `bc1e26f` — 326 commits, 243 files changed, +48,023 / -148

**Current codebase:** 30,428 tracked TypeScript, Vue, and MJS lines

### Key Accomplishments

- Built byte-safe local branch/worktree discovery, explicit ordered selection, immutable merge-base-to-head comparison, and a token-protected loopback browser session.
- Delivered a real Monaco side-by-side review workspace with exact durable anchors, per-file state restoration, keyboard/responsive interaction, and explicit stale or orphaned records.
- Added repository-local canonical drafts with complete comment and summary lifecycle, serialized compare-and-swap mutation, conflict recovery, selector drift, and loss-safe corrupt/newer-draft handling.
- Published versioned canonical JSON and derived Markdown as an atomic export pair with content hashes, receipts, safe reveal, ignore management, source-control safety checks, and target-aware re-export.
- Closed the audited cross-file async settlement gap across acceptance, persistence failure, concurrent revision conflict, controller replacement, and repeated accessible announcements.

### Final Evidence

- Requirements: 51/51
- Cross-phase integrations: 22/22
- End-to-end flows: 8/8
- Plans and summaries: 40/40
- Final configured Playwright suite: 56/56
- Phase 04.1: verification 11/11, code review clean, security 11/11 closed, UI audit 24/24, TDD 0 violations

### Retained Technical Debt

- Retire or intentionally consume the authenticated orphan `GET /api/files/:fileId` route and `SessionClient.getFileMetadata()` method.
- Retain Phase 3 non-blocking UI polish findings until separately prioritized.
- Retain accepted Phase 4 same-UID managed-parent replacement and operating-system power-loss durability boundaries.

### Archives

- Roadmap: `.planning/milestones/v1.0-ROADMAP.md`
- Requirements: `.planning/milestones/v1.0-REQUIREMENTS.md`
- Milestone audit: `.planning/milestones/v1.0-MILESTONE-AUDIT.md`
- Phase history: `.planning/milestones/v1.0-phases/`

---
