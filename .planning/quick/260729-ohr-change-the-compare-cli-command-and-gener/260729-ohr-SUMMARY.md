---
phase: quick
plan: 260729-ohr
subsystem: cli-packaging
tags: [npm, cli, packaging, documentation]
requires:
  - phase: 260729-lga
    provides: Compare project and private package identity
provides:
  - A sole `cumpa` npm bin and generated executable at `dist/bin/cumpa.mjs`
  - Synchronized packed-package fixtures and user-facing CLI documentation
affects: [CLI installation, npm packaging, generated-package verification]
tech-stack:
  added: []
  patterns:
    - One npm bin mapping, generated wrapper, verifier, fixtures, and documentation share one artifact path.
key-files:
  created: []
  modified:
    - package.json
    - package-lock.json
    - scripts/build-bin.mjs
    - scripts/verify-production-artifacts.mjs
    - tests/package/agent-ready-export.test.ts
    - tests/e2e/package-assets.spec.ts
    - tests/e2e/anchored-review.spec.ts
    - tests/e2e/complete-review-draft.spec.ts
    - tests/e2e/file-tree.spec.ts
    - tests/e2e/agent-ready-export.spec.ts
    - README.md
key-decisions:
  - "Cut over cleanly to the single `cumpa` command; retain no `compare` bin alias."
  - "Keep Compare as product identity and `compare` as the private npm package while documenting the Neapolitan-derived command name."
patterns-established:
  - "CLI artifact names are synchronized across manifest, generator, verifier, package fixtures, and README."
requirements-completed: [QUICK-260729-OHR]
duration: 7min
completed: 2026-07-29
status: complete
---

# Quick 260729-ohr: Cumpa CLI Summary

**The private `compare` package now ships one `cumpa` executable, with build, packaging evidence, fixtures, and README guidance aligned to `dist/bin/cumpa.mjs`.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-07-29T15:49:51Z
- **Completed:** 2026-07-29T15:57:02Z
- **Tasks:** 3/3
- **Files modified:** 11

## Accomplishments

- Replaced the sole npm bin and generated executable with `cumpa -> dist/bin/cumpa.mjs` while retaining both package-name records as `compare`.
- Aligned production-artifact verification and all generated-package inventory, launch, fingerprint, and evidence fixtures to the same executable path.
- Documented Compare product, `compare` package, and `cumpa` command identities, including the ASCII Neapolitan spelling `cumpà` and its colloquial meaning.

## Task Commits

1. **Task 1: Cut over the package and generated-bin contract** — `a7ea612` (`chore`)
2. **Task 2: Synchronize every packaged CLI fixture and assertion** — `640e5be` (`test`)
3. **Task 3: Document Compare and cumpa without renaming protected identities** — `322d8ac` (`docs`)

Planning artifacts are intentionally uncommitted; orchestration owns `PLAN.md`, `SUMMARY.md`, and `STATE.md`.

## Files Created/Modified

- `package.json` — maps the only bin key, `cumpa`, to `dist/bin/cumpa.mjs`.
- `package-lock.json` — mirrors the root package bin mapping without dependency changes.
- `scripts/build-bin.mjs` — writes and chmods `cumpa.mjs`.
- `scripts/verify-production-artifacts.mjs` — verifies the executable new path.
- `tests/package/agent-ready-export.test.ts` — fingerprints and asserts the new packaged artifact.
- `tests/e2e/package-assets.spec.ts` — inventories the new packed artifact.
- `tests/e2e/anchored-review.spec.ts` — launches the new generated artifact.
- `tests/e2e/complete-review-draft.spec.ts` — launches the new generated artifact.
- `tests/e2e/file-tree.spec.ts` — launches the new generated artifact.
- `tests/e2e/agent-ready-export.spec.ts` — reports and hashes the new generated artifact.
- `README.md` — distinguishes Compare, `compare`, and `cumpa` and updates shell commands.

## Decisions Made

- Used a clean cutover: only `cumpa` is declared or generated; no `compare` compatibility alias exists.
- Kept protected Compare product, package, persistence, schema, and test-protocol identifiers unchanged.

## Verification

- **Build and production artifact:** PASS — `npm run build`, `npm run verify:production-artifacts`, executable presence/absence checks, and manifest/lock identity assertions passed.
- **Packed inventory and focused generated-name search:** PASS — `npm pack --dry-run --json --ignore-scripts` includes `dist/bin/cumpa.mjs`, excludes `dist/bin/compare.mjs`, and all six focused fixture files use `cumpa.mjs` with no legacy generated filename.
- **README acceptance:** PASS — required Compare/package/`cumpa`/`cumpà`/meaning/persistence tokens are present; legacy executable forms are absent.
- **Protected contracts and scope:** PASS — `compare/export`, `compareExactPaths`, and `COMPARE_AGENT_READY_EVIDENCE_REPORT` remain present; final diff is exactly the eleven planned files, contains no `src/` changes, and `git diff --check` passed.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Vite emitted its existing large-chunk advisory during the required production build; the build completed successfully and no formatter, linter, Vitest, Playwright, CLI test, or project-wide suite was run.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The source installation and packed package expose only `cumpa`; downstream documentation and package verification can rely on `dist/bin/cumpa.mjs`.

## Self-Check: PASSED

- Summary file exists at the required quick-task path.
- Task commits `a7ea612`, `640e5be`, and `322d8ac` exist in git history.
