---
phase: 02-move-the-implementation-to-supabase
plan: 07
subsystem: deployment-security
tags: [github-actions, supabase, custom-domain, evidence, deno, playwright]

requires:
  - phase: 02-06
    provides: local runtime support-disablement and configured hosted capability boundary
provides:
  - CI-only guarded Supabase deployment and offline evidence-verification contract
  - One protected-main deployment workflow with credential-free repository gates
  - Ref-free custom-origin support-flow browser/Auth routing and bounded HTML responses
affects: [02-08, 02-09, 02-10, 02-11, 02-16]

tech-stack:
  added: []
  patterns:
    - Full in-memory project-ref SHA-256 guard immediately precedes each hosted mutation
    - Browser-facing Auth and function URLs derive only from the validated custom origin

key-files:
  created:
    - .github/workflows/deploy-supabase-production.yml
  modified:
    - scripts/verify-supabase-support.mjs
    - tests/e2e/support-payment.spec.ts
    - tests/e2e/support-recovery.spec.ts
    - tests/e2e/support-restore.spec.ts
    - supabase/functions/support-flow/index.ts
    - supabase/functions/tests/support-flow.test.ts
    - docs/support-service-operations.md

key-decisions:
  - "GitHub Actions is the sole guarded deployment path; repository gates remain credential-free."
  - "SUPPORT_PUBLIC_ORIGIN owns every browser/Auth surface while SUPABASE_URL remains internal to service-role RPCs."

patterns-established:
  - "Evidence verifiers fail closed on unknown, duplicate, conflicting, and incomplete CLI or record inputs."
  - "Custom-domain activation, schema, configuration, secrets, and function deployment stay serialized behind a per-mutation fingerprint guard."

requirements-completed: [PAY-03, PAY-04, REC-01, REC-02]
duration: N/A
completed: 2026-08-30
status: complete
---

# Phase 02 Plan 07: Protected Supabase Deployment Boundary Summary

**Protected main pushes now pass credential-free repository gates before a CI-only, fingerprint-guarded Supabase deployment uses one ref-free custom origin for Auth and support browser flows.**

## Performance

- **Duration:** Not recorded
- **Started:** Not recorded
- **Completed:** 2026-08-30T21:14:15Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Replaced the local deployment path with strict CI-only deployment, hostile-matrix, and redacted evidence-verification interfaces.
- Routed support-flow browser Auth/callback/function URLs through validated `SUPPORT_PUBLIC_ORIGIN`; internal service-role RPCs retain `SUPABASE_URL`.
- Added the sole serialized protected-main workflow, exact Node/Deno/Supabase repository gates, redacted artifact upload, and operations boundary documentation.

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace local deployment behavior with a CI-only guarded deployment contract** — `46cc5cb` (RED tests), `b1b6e33` (implementation)
2. **Task 2: Route browser-facing support flow through the validated custom origin** — `325619b` (RED tests), `8890824` (implementation)
3. **Task 3: Add the sole every-push-to-main production workflow** — `d8477b8` (implementation and focused workflow regressions)

## Files Created/Modified

- `.github/workflows/deploy-supabase-production.yml` — Sole `main` push deployment path with credential-free gates and protected production job.
- `scripts/verify-supabase-support.mjs` — Strict verifier CLI, CI-only deployment driver, target guards, custom-origin routing, hostile-case records, and offline evidence validation.
- `tests/e2e/support-payment.spec.ts` — Rejects local deployment arguments and workflow pin/command/order regressions.
- `tests/e2e/support-recovery.spec.ts` — Rejects malformed, raw, and invalid run-evidence inputs.
- `tests/e2e/support-restore.spec.ts` — Rejects incomplete hostile acceptance lineage and invalid promotion options.
- `supabase/functions/support-flow/index.ts` — Validates the public origin, confines `SUPABASE_URL` to internal RPCs, and returns bounded browser HTML.
- `supabase/functions/tests/support-flow.test.ts` — Covers invalid public origins and HTML completion/invalid-state signatures.
- `docs/support-service-operations.md` — Documents dashboard DNS prerequisite and the automatic protected deployment order without a local deployment path.

## Decisions Made

- GitHub Actions is the only deploy-capable process; no local invocation accepts hosted provider or deployment inputs.
- The public custom origin is the browser/Auth URL authority, while the default Supabase URL remains an internal RPC endpoint.

## Verification

Passed without provider inputs or hosted mutation:

- `node scripts/verify-supabase-support.mjs --verify-workflow .github/workflows/deploy-supabase-production.yml`
- `npx playwright test --config=tests tests/e2e/support-payment.spec.ts tests/e2e/support-recovery.spec.ts tests/e2e/support-restore.spec.ts` — 4 passed
- `deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests/support-flow.test.ts` — 7 passed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected a verifier string-literal syntax error**
- **Found during:** Task 3
- **Issue:** The workflow-mode check initially embedded GitHub expression syntax in a JavaScript template literal.
- **Fix:** Used a plain string literal and added exact gate-command validation, including repository-gate-only pin checks and `db start` ordering.
- **Files modified:** `scripts/verify-supabase-support.mjs`, `tests/e2e/support-payment.spec.ts`
- **Verification:** Focused workflow-verifier Playwright test passed.
- **Committed in:** `d8477b8`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The correction strengthens the specified workflow contract; no deployment or provider action occurred.

## Issues Encountered

- The GSD progress updater could not locate its expected progress field in the existing state file; all other sequential state updates completed.

## User Setup Required

No hosted mutation was performed. Before the first protected push, register the one custom subdomain and its CNAME/TXT records in the Supabase Dashboard, then configure the protected `production` environment inputs described by the operations document.

## Next Phase Readiness

- Plan 02-08 can configure the protected environment and trigger the first ordinary `main` push without adding another deployment path.
- No blocker.

## Self-Check: PASSED

- Summary exists at `.planning/phases/02-move-the-implementation-to-supabase/02-07-SUMMARY.md`.
- Task commits `46cc5cb`, `b1b6e33`, `325619b`, `8890824`, and `d8477b8` exist.

---
*Phase: 02-move-the-implementation-to-supabase*
*Completed: 2026-08-30*
