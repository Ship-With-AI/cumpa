---
phase: quick
plan: 260913-dzc
subsystem: deployment-verification
tags: [supabase, production-live, authority-evidence, playwright]
requires:
  - phase: 07-clean-public-artifact-acceptance
    provides: production deploy workflow and support evidence contracts
provides:
  - Production-live authority gate checks snapshot stability rather than pre-launch emptiness
  - Deploy workflow and verifier no longer name the retired recovery spec
  - TD-1 closure record
  - Live-deploy coverage for zero, populated-stable, changed, and Stripe-incoherent cases
affects: [deploy-supabase-production, support-evidence, v1.4-tech-debt]
tech-stack:
  added: []
  patterns:
    - Snapshot manifests remain structurally validated by manifestForRows before stable-state comparison
key-files:
  created:
    - .planning/quick/260913-dzc-live-deploy-authority/260913-dzc-SUMMARY.md
  modified:
    - scripts/verify-supabase-support.mjs
    - tests/e2e/support-payment.spec.ts
    - .github/workflows/deploy-supabase-production.yml
    - .planning/MILESTONES.md
key-decisions:
  - "Recurring production deploys must prove authority stability, not zero authority rows."
  - "Retain every prelaunch, cleanup, promotion, and release-lineage zero-authority requirement."
requirements-completed: []
duration: execution session
completed: 2026-09-13
status: complete
---

# Quick Task 260913-dzc: Live Deploy Authority Stability Summary

**The production-live deploy gate now accepts unchanged populated authority manifests while rejecting any authority mutation, with the retired recovery-spec workflow contract removed.**

## Performance

- **Tasks:** 2/2
- **Files modified:** 4 implementation/tracking files; 1 summary; 1 state record
- **Completed:** 2026-09-13T08:19:13Z

## Accomplishments

- Removed `requireZero` from only the two `deployLive` snapshots. `manifestForRows` still calls `assertManifest(manifest)` for both snapshots, and the unchanged `live deployment changed authority rows` equality check is the sole live-path authority gate.
- Converted live deployment coverage from the retired non-zero rejection to an accepted POPULATED case with `authority['auth.users'].count === 1` and a CHANGED rejection, while retaining the zero-row and Stripe endpoint-coherence cases.
- Removed `support-recovery.spec.ts` from the workflow, all three `verifyWorkflow` pinned command contracts, and the workflow-mutation test. Marked TD-1 closed.

## Task Commits

1. **Task 1: Live deploy verifies authority stability instead of emptiness** — `86a10b0` (`fix`)
2. **Task 2: Deploy gate names only extant specs** — `e9042bc` (`chore`)

## Decisions Made

The zero-authority requirement was retired only for recurring `production-live` deploy snapshots because the operator's genuine GitHub sign-in permanently populated authority rows. It remains required for release lineage, exact cleanup, evidence-reader, and promotion paths.

The next production-live evidence record may therefore contain non-zero authority counts and hashed handles. It remains redacted and structurally validated. No deployment was triggered by this task: the next push to `main` is what can run the workflow.

## Verification

- `npx playwright test tests/e2e/support-payment.spec.ts tests/e2e/support-restore.spec.ts` — `12 passed`.
- `node scripts/verify-supabase-support.mjs --verify-workflow .github/workflows/deploy-supabase-production.yml` — `workflow verifier: PASS`.
- `npx vitest run --no-file-parallelism` — `Test Files 65 passed (65)` and `Tests 520 passed (520)` in `126.43s`. This is green; the observed count is 520, while the task brief cited 521. The task diff contains no Vitest test file.
- `deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests` — `ok | 17 passed | 0 failed (345ms)`.
- `npx tsc --noEmit --project tsconfig.json` — exited 0 with no output.
- `npm run typecheck:web` — `tsc --noEmit --project tsconfig.web.json` exited 0.

## Boundary Checks

- `grep` found exactly seven retained `assertManifest(..., true)` callsites: 480, 481, 855, 858, 1088, 1094, and 1226 after the two-line removal; none is in `deployLive`.
- The Task 1 script diff contains only the two removed `assertManifest(..., true)` lines, proving structural `assertManifest` checks were unchanged.
- `git diff --name-only 86a10b0^ e9042bc` listed only `.github/workflows/deploy-supabase-production.yml`, `.planning/MILESTONES.md`, `scripts/verify-supabase-support.mjs`, and `tests/e2e/support-payment.spec.ts`; its `supabase/` and `src/` filter was empty.
- Verification used local stubs and static workflow verification only. No production data was written, no Supabase CLI command was run, and no deploy was triggered.

## Deviations from Plan

None - plan executed as specified, including the user-authorized TD-1 close-out update in `.planning/MILESTONES.md`.

## Issues Encountered

Vitest's successful CI-equivalent run reported 65 files and 520 tests rather than the 521 tests cited in the task brief. No changed file participates in that Vitest count.

## Self-Check: PASSED

- Confirmed both task commits exist: `86a10b0` and `e9042bc`.
- Confirmed this summary exists at the required quick-task path.
- Confirmed all scoped and requested verification commands above completed successfully.
