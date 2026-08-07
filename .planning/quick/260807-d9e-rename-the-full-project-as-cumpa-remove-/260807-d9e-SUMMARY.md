---
phase: quick
plan: 260807-d9e
subsystem: runtime, package, persistence, documentation
tags: [cumpa, cli, fastify, vue, monaco, zod]
requires: []
provides:
  - Cumpa runtime, package, protocol, storage, API, UI, test, and documentation identity
  - Cumpa-only repository-local persistence and strict wire contracts
affects: [CLI, API, persistence, browser UI, package publishing, planning records]
tech-stack:
  added: []
  patterns:
    - Neutral deterministic ordering helpers replace name-bound ordering identifiers
key-files:
  created:
    - .planning/quick/260807-d9e-rename-the-full-project-as-cumpa-remove-/260807-d9e-SUMMARY.md
  modified:
    - package.json
    - package-lock.json
    - src/contracts/request.ts
    - src/contracts/draft.ts
    - src/server/draft-loader.ts
    - src/server/export-store.ts
    - README.md
key-decisions:
  - Cumpa is the sole product, package, CLI, protocol, storage, and theme identity.
  - The legacy namespace is ordinary repository content and is never migrated or read.
patterns-established:
  - Use neutral order helpers for deterministic byte and text ordering.
requirements-completed: [QUICK-260807-D9E]
duration: N/A
completed: 2026-08-07
status: complete
---

# Quick Plan 260807-d9e: Cumpa Identity Cutover Summary

**Cumpa now owns package metadata, strict request and export contracts, repository-local storage, runtime identifiers, browser identity, tests, tracked skill material, and planning records.**

## Accomplishments

- Set the private package and both lockfile root identities to `cumpa` while retaining the sole `cumpa` executable at `dist/bin/cumpa.mjs`.
- Cut strict requests and exports to `cumpa.review-request` and `cumpa/export`, and moved every managed draft, export, receipt, ignore, inventory, and reserved-path boundary to `.cumpa`.
- Renamed runtime identifiers, CUMPA environment keys, Monaco theme/action identifiers, API/client exports, UI copy, fixtures, and deterministic ordering helpers.
- Preserved no-fallback coverage by constructing a legacy-namespace fixture from character codes and asserting it is ordinary repository content.
- Moved the tracked Cumpa spike skill and historical quick-task directory with Git history preservation, then updated root documentation and tracked planning evidence.

## Task Commits

1. **Task 1 RED: renamed contract tests** — `771bc5e` (`test`)
2. **Task 1 GREEN: runtime Cumpa cutover** — `562f9f5` (`feat`)
3. **Task 2: tracked documentation and path cutover** — `7ea013b` (`docs`)
4. **Task 3: repair renamed ordering calls** — `3066422` (`fix`)
5. **Task 3: restore delete-cancel focus** — `bcdbbfc` (`fix`)
6. **Task 2 follow-up: tracked product facts cutover** — `7ae6687` (`docs`)

## Verification

Passed:

- `npm run build`
- `npm run verify:production-artifacts`
- Generated `dist/bin/cumpa.mjs --help` smoke check
- `npm run test:unit` — 21 files, 131 tests
- `npm run test:git` — 9 files, 69 tests
- `npm run test:api` — 17 files, 126 tests
- `npm run test:package` — 78 browser tests
- `npm run test:package-export-safety` — 8 tests
- `npm run test:package-contract` — 12 contract tests and 4 packaged browser tests
- Focused ordering and delete-focus regression checks
- Package/lockfile/sole-bin assertion
- Encoded case-insensitive tracked path and content scan
## Files Created or Modified

- `package.json` and `package-lock.json` — Cumpa package identity and sole bin contract.
- `src/contracts/request.ts` and `src/contracts/draft.ts` — strict Cumpa request and export discriminators.
- `src/server/draft-loader.ts`, `src/server/export-store.ts`, and `src/server/gitignore-capability.ts` — `.cumpa` persistence authority.
- `src/domain/path-bytes.ts`, `src/git/candidates.ts`, and `src/web/model/comment-groups.ts` — neutral deterministic ordering helpers.
- `src/web/index.html` and `src/web/monaco/theme.ts` — Cumpa browser and Monaco identity.
- `tests/` — Cumpa contracts, storage fixtures, environment keys, identifiers, and no-fallback coverage.
- `README.md`, `.gitignore`, `.claude/CLAUDE.md`, `.kimi-code/skills/spike-findings-cumpa/`, and `.planning/` — tracked documentation, skill, and planning cutover.

## Decisions Made

- Cumpa is the only accepted runtime and persistence identity; the legacy name, token, and namespace have no compatibility path.
- Existing byte and UTF-16 ordering loops remain the authority after neutral helper renames.

## Deviations from Plan

- The unfiltered `test:browser` command is a documented invalid full-suite command because its config scope collects Vitest files; the canonical `test:package` browser suite passed 78 tests.
- The historical performance harness is documented as incompatible with the strict non-TTY request protocol introduced later. It reached its existing readiness watchdog without exercising Cumpa; restoring it requires a real PTY harness and is outside this identity cutover.

## Issues Encountered

- Two mechanical ordering callsites invoked nonexistent methods after the exhaustive rename. Existing unit and Git tests exposed both; the fixes reuse the neutral ordering helpers.
- The full browser suite exposed a pre-existing delete-cancel focus selector mismatch. The existing end-to-end test now passes after aligning the selector with the rendered button.

## Self-Check: PASSED

- Required summary path exists.
- Task commits `771bc5e`, `562f9f5`, and `7ea013b` exist.
- The summary uses only Cumpa/cumpa plus neutral legacy name/token/namespace wording.
