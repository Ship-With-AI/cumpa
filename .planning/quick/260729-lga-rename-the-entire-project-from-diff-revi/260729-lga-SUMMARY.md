---
phase: quick
plan: 260729-lga
subsystem: product-identity
tags: [cumpa, npm, cli, persistence, vue, typescript]
requires: []
provides:
  - "Clean Diff Review to Cumpa product, package, CLI, persistence, and machine-identifier cutover"
  - "Cumpa fixtures, assertions, current documentation, and planning identity"
affects: [package-release, local-persistence, CLI, documentation]
tech-stack:
  added: []
  patterns:
    - "Clean cutovers migrate every caller without aliases or dual persistence roots"
key-files:
  created:
    - .planning/quick/260729-lga-rename-the-entire-project-from-diff-revi/260729-lga-SUMMARY.md
  modified:
    - package.json
    - scripts/build-bin.mjs
    - src/server/draft-loader.ts
    - src/server/export-store.ts
    - src/git/inventory.ts
    - README.md
    - PRODUCT.md
    - .planning/PROJECT.md
    - .planning/ROADMAP.md
key-decisions:
  - "Cumpa is the sole active product name; cumpa and CUMPA own all machine identifiers."
  - "Historical milestone and v1.0 records retain their original Diff Review wording."
patterns-established:
  - "Repository-local persistence, receipt schemas, inventory exclusion, and ignore flow share one .cumpa root."
requirements-completed: [QUICK-260729-LGA]
duration: not-recorded
completed: 2026-07-29
status: complete
---

# Quick 260729-lga: Cumpa Identity Cutover Summary

**Cumpa now owns the package, CLI, executable, persistence root, export discriminator, product copy, fixtures, and current project authority without legacy aliases.**

## Performance

- **Tasks:** 3/3
- **Files modified:** 92 active source/test/live-document files, plus current `.planning/PROJECT.md` and `.planning/ROADMAP.md`
- **Dependencies added:** None

## Accomplishments

- Replaced the npm package/bin identity with `cumpa` and generated executable with `dist/bin/cumpa.mjs`.
- Migrated persistence, receipts, ignore handling, inventory exclusion, environment variables, export kind, hash domains, Monaco IDs, callers, and fixtures to Cumpa.
- Updated user-facing documentation and current planning identity while retaining historical milestone and v1.0 wording.

## Task Commits

1. **Task 1: Cut over runtime, package, CLI, and persistence identity** — `b00fa4a` (`feat`)
2. **Task 2: Migrate fixtures and assertions to the Cumpa contract** — `7e94924` (`test`)
3. **Task 3: Rename live documentation and current planning identity** — `11835f4` (`docs`)
4. **Task 1 correction: Remove final legacy runtime label** — `9fac4fa` (`fix`)

Planning artifacts, including this summary and current planning identity edits, remain uncommitted as requested.

## Files Created/Modified

- `.gitignore`, `package.json`, `package-lock.json`, `scripts/build-*.mjs`, `scripts/verify-production-artifacts.mjs` — package, binary, native-build environment, and artifact identity.
- `src/cli`, `src/contracts`, `src/domain`, `src/export`, `src/git`, `src/server`, and `src/web` — runtime product, persistence, schema, exported-symbol, API, Monaco, and UI identity migration.
- `tests/api`, `tests/cli`, `tests/e2e`, `tests/git`, `tests/helpers`, `tests/integration`, `tests/package`, and `tests/unit` — fixture and assertion migration.
- `README.md`, `PRODUCT.md`, `.claude/CLAUDE.md`, `.planning/PROJECT.md`, `.planning/ROADMAP.md` — live documentation and current planning identity.

## Verification Evidence

- PASS — package/lockfile assertion confirmed `cumpa -> dist/bin/cumpa.mjs` in both root metadata records.
- PASS — `npm run build && test -x dist/bin/cumpa.mjs && test ! -e dist/bin/diff-review.mjs` completed successfully after the final runtime-label correction.
- PASS — `npm pack --dry-run --json` produced package `cumpa@0.0.0` and listed executable `dist/bin/cumpa.mjs` with mode `493`.
- PASS — targeted legacy identifier searches for runtime/build sources, tests, and live documentation returned no matches.
- PASS — targeted `git diff --check` commands for migrated tests and live documentation completed successfully.
- PASS — required project identity checks confirmed `.cumpa/` in current project authority and `# Roadmap: Cumpa`.
- NOT RUN — formatters, linters, Vitest, Playwright, and project-wide test suites, per plan constraint.

## Decisions Made

- Used a clean cutover: no compatibility CLI, aliases, dual persistence roots, deprecated exports, or dependencies.
- Kept `Diff Review` in completed milestone and explicit v1.0 historical records in `.planning/PROJECT.md`; current persistence statements changed to `.cumpa/`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed the final legacy browser label**
- **Found during:** Final active-scope search
- **Issue:** `Diff review` in `src/web/App.vue` matched the plan's case-insensitive legacy identifier gate.
- **Fix:** Replaced it with the generic `Comparison` label.
- **Files modified:** `src/web/App.vue`
- **Verification:** Rebuilt successfully and reran the Task 1 scoped search.
- **Committed in:** `9fac4fa`

**Total deviations:** 1 auto-fixed (1 blocking).
**Impact on plan:** Necessary to satisfy the exact no-legacy-identifier search gate; no scope increase.

## Issues Encountered

None.

## Next Phase Readiness

- Cumpa is ready for normal package, CLI, persistence, and browser workflows under its final identity.
- The physical checkout remains `/Users/alessandro/projects/diff-review`.

## Self-Check: PASSED

- Summary exists at the required quick-task path.
- All four execution commits exist locally.
- Planning artifacts remain uncommitted.
