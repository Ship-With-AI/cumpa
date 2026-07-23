---
phase: 04-agent-ready-export
plan: 08
subsystem: testing
tags: [playwright, chromium, packaged-cli, fastify, vue, monaco, git, export]

requires:
  - phase: 04-agent-ready-export
    provides: Canonical export, refusal-first native re-export, safety harnesses, and accessible receipt contracts from plans 04-02 through 04-07.
provides:
  - Generated-package Chromium acceptance covering persisted review recovery after complete browser/server shutdown and fresh CLI launch.
  - Machine-readable executed-evidence map for all Phase 4 requirements, decisions, UI state families, and high threats.
affects: [phase-04-acceptance, release-verification]

tech-stack:
  added: []
  patterns:
    - Package-first Playwright journeys launch the packed CLI in a disposable real Git repository, then independently reread persisted artifacts.
    - Coverage evidence rejects missing, duplicate, or unexecuted contract references and fingerprints the generated package artifact.

key-files:
  created:
    - tests/e2e/agent-ready-export.spec.ts
    - tests/package/agent-ready-export.test.ts
  modified: []

key-decisions:
  - "Keep final acceptance at the generated package boundary: a fresh CLI/server/browser process, real Monaco, and on-disk export bytes are the authority."
  - "Record the roadmap resume criterion only against the named close/relaunch/recover/export journey, with different ordered-pair isolation."

patterns-established:
  - "Resume acceptance: preserve accepted state in a real repository, terminate browser and generated server, relaunch the packed CLI, and compare recovered draft and independently reread exports exactly."
  - "Evidence maps: emit bounded machine-readable records with concrete executed commands and package artifact identity."

requirements-completed: [EXP-01, EXP-02, EXP-03, EXP-04, EXP-05, EXP-06, EXP-07, EXP-08, SAFE-04]

duration: 1h 28min
completed: 2026-07-23
status: complete
---

# Phase 04 Plan 08: Agent-Ready Export Acceptance Summary

**Generated package acceptance now proves a real Git review survives browser/server shutdown and fresh CLI relaunch, remains isolated by ordered comparison pair, and exports independently validated canonical bytes.**

## Performance

- **Duration:** 1h 28min
- **Started:** 2026-07-23T19:37:00+02:00
- **Completed:** 2026-07-23T21:05:18+02:00
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added the named `packaged-resume-after-relaunch` journey using a packed production CLI, authenticated loopback browser, real Monaco, and a dirty disposable Git repository.
- Proved accepted summary/comment state persists through full browser/server termination and a fresh packed CLI launch; a different valid ordered pair stays separate, while resumed export matches independently parsed JSON, reparsed Markdown, hashes, receipt paths, and source-control snapshot.
- Bound coverage evidence to a fresh, exact 22-test packaged Chromium run and its run-ID/fingerprint report, eliminating the static `executed: true` manifest.

## Verification

- `node .planning/phases/04-agent-ready-export/validate-reconciliation.mjs .planning/phases/04-agent-ready-export/04-01-RECONCILIATION.json` — passed.
- Prescribed ledger-driven command (`04-08-packaged-export`) — 22 Chromium E2E tests passed, including `packaged-resume-after-relaunch`.
- `node_modules/.bin/vitest run tests/package/agent-ready-export.test.ts` — 1 test passed after running the exact 22-test packaged Chromium suite; its fresh random-run-ID report matched both packed and generated package SHA-256 values (`3114aef65e9db770828c4e882439b51c187a1ceabd32bb732bbcc469372f2341`).

## Task Commits

Each task was committed atomically:

1. **Task 1: Prove the complete generated browser-to-Git export journey** - `6b7a16e` (test, RED) and `b77a950` (feat, GREEN)
2. **Task 2: Record complete source, decision, requirement, and threat disposition evidence** - `8ce7d85` (test), remediated by `96e191a` (test, RED) and `8b4ef5a` (fix, GREEN)

**Plan metadata:** included in the final plan-metadata commit.

_Note: Task 1 followed the required RED → GREEN sequence. The RED test initially exposed the open review drawer intercepting the Monaco line interaction; the GREEN test closes that drawer before the real editor interaction and reopens it for the persisted mutation._

## Native Target Evidence Update

- Ledger commit `257eab8` declares the executable `darwin-arm64` Node 24/N-API target.
- `4023bdf` compiles the project-owned addon into `dist/native/directory_exchange.node`, resolves it relative to the packaged server module, and grants exchange authority only after its one-time native probe succeeds.
- Generated package safety now proves first export followed by successful atomic complete-pair re-export, continuous complete stable observations, and recovery of the new exact bytes. Unsupported or failed load/probe targets remain typed `reExportUnsupported`.

## Files Created/Modified

- `tests/e2e/agent-ready-export.spec.ts` - Packed CLI/browser/Git resume and independent export-byte acceptance journey.
- `tests/package/agent-ready-export.test.ts` - Runs the exact packaged Chromium suite and validates a fresh run-ID, complete report, and matching packed/generated package fingerprints before emitting coverage.

## Decisions Made

- Kept existing server and Vue composition unchanged: the RED failure was in test interaction setup, not production behavior, so no integration correction was justified.
- Treated persisted raw draft bytes and independently reread `review.json`/`review.md` as acceptance authority rather than trusting browser state or API DTOs.

## Deviations from Plan

None - plan behavior was implemented through the existing generated-package and safety owners without adding a new application authority path.

## Issues Encountered

- The original ledger command attempted `node test tests/e2e`, which cannot run the Playwright suite. The ledger owner corrected it in `76ab013` to invoke the absolute project Playwright executable; reconciliation validation and the prescribed 22-test command then passed.
- CR-03 found that Task 2's coverage map declared execution with static literals. `96e191a` first proved the false-positive by requiring a missing scenario report; `8b4ef5a` now runs the exact packaged Chromium command, requires a fresh random-run-ID report emitted only after the real resume scenario completes, and rejects fingerprint or required-evidence mismatches.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 4 has final generated-package acceptance evidence for the agent-ready export boundary.
- Ready for phase-level verification and release review.

---
*Phase: 04-agent-ready-export*
*Completed: 2026-07-23*

## Self-Check: PASSED

- Created acceptance files are present: `tests/e2e/agent-ready-export.spec.ts` and `tests/package/agent-ready-export.test.ts`.
- Required task and remediation commits are present in history: `6b7a16e`, `b77a950`, `8ce7d85`, `96e191a`, and `8b4ef5a`.
