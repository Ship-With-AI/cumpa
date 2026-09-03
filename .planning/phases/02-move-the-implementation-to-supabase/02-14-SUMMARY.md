---
phase: 02-move-the-implementation-to-supabase
plan: 14
subsystem: infrastructure
tags: [npm, lockfile, supabase, fastify, vitest, playwright, retirement]
requires:
  - phase: 02-13
    provides: "Retired standalone support-service test suites after their active Supabase replacements passed"
provides:
  - "No services/support npm workspace manifests, configs, or PostgreSQL scripts"
  - "No root standalone PostgreSQL E2E wrapper"
  - "A resolved root graph retaining Fastify, Supabase CLI, Vitest, Playwright, and package build tooling"
affects: [02-15, 02-16, 02-17]
tech-stack:
  added: []
  patterns:
    - "Retire dependency surfaces only after their complete caller set has been removed"
key-files:
  created:
    - .planning/phases/02-move-the-implementation-to-supabase/02-14-SUMMARY.md
  modified:
    - services/support/package.json
    - services/support/package-lock.json
    - services/support/tsconfig.json
    - services/support/vitest.config.ts
    - services/support/scripts/test-postgres.mjs
    - services/support/scripts/migrate.mjs
    - scripts/test-support-e2e-postgres.mjs
key-decisions:
  - "The root manifest already contained no support workspace, Postgres, Render, or Resend caller, so it required no further deletion."
  - "Retained root Fastify, Supabase CLI, Vitest, Playwright, and package build dependencies unchanged."
patterns-established:
  - "Use npm lockfile-only regeneration with lifecycle scripts ignored when retiring manifests."
requirements-completed: [PAY-04, REC-01, REC-02]
duration: N/A
completed: 2026-09-03
status: complete
---

# Phase 02 Plan 14: Retire Legacy Support Workspace Summary

**Removed the final standalone support-workspace manifests, PostgreSQL runners, and root E2E wrapper while retaining Cumpa's resolved Fastify and Supabase verification graph.**

## Performance

- **Duration:** N/A (executor start timestamp was not persisted)
- **Completed:** 2026-09-03T17:20:07Z
- **Tasks:** 2
- **Files modified:** 7 deleted

## Accomplishments

- Deleted all six remaining `services/support` manifest/config/script files and `scripts/test-support-e2e-postgres.mjs`.
- Confirmed the root manifest already lacked the retired support workspace and Postgres/Render/Resend scripts or dependencies; no active root package entry was removed.
- Regenerated the root lockfile with npm's lockfile-only, lifecycle-script-free path and resolved the retained 346-entry graph.

## Task Commits

1. **Task 1: Remove the legacy workspace and exact root callers** — `cb40475` (`refactor`)
2. **Task 2: Prove no legacy workspace command remains** — recorded in this summary; no source change required after the Task 1 deletion.

## Files Created/Modified

- `services/support/package.json` — deleted retired workspace manifest.
- `services/support/package-lock.json` — deleted retired workspace dependency graph.
- `services/support/tsconfig.json` — deleted retired workspace TypeScript config.
- `services/support/vitest.config.ts` — deleted retired workspace Vitest config.
- `services/support/scripts/test-postgres.mjs` — deleted standalone Docker/PostgreSQL test runner.
- `services/support/scripts/migrate.mjs` — deleted standalone direct-Postgres migration runner.
- `scripts/test-support-e2e-postgres.mjs` — deleted root standalone PostgreSQL Playwright wrapper.
- `package.json` — unchanged: active local server, Supabase, Vitest, Playwright, build, package, and deployment tooling retained.
- `package-lock.json` — lockfile-only regeneration confirmed the active graph; no content change was needed.

## Verification

- `npm install --package-lock-only --ignore-scripts && npm ls --all` — passed; npm reported the graph up to date and resolved 346 entries.
- Exact seven-file absence assertion followed by `npm ls --all` — passed.
- Root manifest/lockfile legacy-caller scan found no support workspace, standalone PostgreSQL, Stripe, Resend, or Render entry; the only `render` text was Vue's retained `@vue/server-renderer` dependency.

## Decisions Made

- Removed only the retired workspace files named in the plan.
- Preserved root Fastify, Supabase CLI, Vitest, Playwright, build, package, and deployment surfaces.

## Deviations from Plan

None - plan executed exactly as written. The root manifest and lockfile were already free of retired entries, so their required cleanup was a verified no-op.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The standalone support workspace and root PostgreSQL wrapper have no remaining executable path.
- Root npm resolution remains ready for Phase 02 package and final verification plans.

## Self-Check: PASSED

---
*Phase: 02-move-the-implementation-to-supabase*
*Completed: 2026-09-03*
