---
phase: 07-clean-public-artifact-acceptance
plan: "06"
subsystem: testing
tags: [playwright, npm, public-artifact, acceptance, support]

requires:
  - phase: 07-clean-public-artifact-acceptance
    provides: pinned public runtime adapters, shared support-home policy, browser review contracts
provides:
  - Public-global and empty-cache public-npx browser-review acceptance driver with bounded reports.
  - npx package-root exposure for the existing source-independent package-asset assertion.
  - Repaired completed-scenario accumulator in the inherited 07-03 review spec.
affects: [07-07, public-artifact-acceptance]

tech-stack:
  added: []
  patterns: [bounded transient npm retry, redacted per-path public acceptance report]

key-files:
  created:
    - tests/package/public-artifact-acceptance.test.ts
  modified:
    - tests/helpers/public-runtime.ts
    - tests/e2e/agent-ready-export.spec.ts

key-decisions:
  - "Keep the local-archive scenario record default status passed; public support records may publish partially-blocked."
  - "Treat live-entitlement-unavailable as the phase-wide blocked ACC-04 outcome without weakening browser review or asset assertions."

patterns-established:
  - "Public acceptance runs global then npx against a shared support HOME and emits one redacted bounded report per path."

requirements-completed: [ACC-01, ACC-02]
requirements-blocked: [ACC-04]
duration: not-recorded
completed: 2026-09-12
status: complete
acceptance-status: partially-blocked
---

# Phase 07 Plan 06: Public Artifact Acceptance Summary

**The public-global and empty-cache npx installs completed the full installed browser review/export/Finish contract; live verified-support remains honestly blocked as `live-entitlement-unavailable`.**

## Accomplishments

- Repaired the inherited 07-03 `completedScenarios` `ReferenceError` with the missing dynamic scenario accumulator. All source-independent review scenarios completed during both public runs; assertions and the local-archive support contract remain intact.
- Ran global and npx public artifact paths end-to-end. Both installed the pinned public package, completed relaunch/resume, comment and accepted-summary review, Markdown plus canonical JSON export, exact-patch export, isolated drafts, and attached Finish.
- Exposed the guarded real npx cache package root through the existing source-independent `AcceptanceRuntime.packageRoot` accessor. The unchanged asset assertion observed `assets`, workers, and codicon successfully; it was not weakened.
- Added a maximum-three-attempt retry only for transient npm transport failures. The real global and npx installations each completed on attempt 1.

## Task Commits

1. **Task 1: Extend acceptance configuration, narrow local-archive collection, and add entry points** — `5e8e4c8` (chore)
2. **Inherited 07-03 repair: declare completed scenario accumulator** — `4f6804c` (fix)
3. **Task 2: Public-artifact acceptance driver for global and npx paths** — `b3f775b` (feat)

## Files Created/Modified

- `tests/e2e/agent-ready-export.spec.ts` — declares the accumulator used by every completed review scenario and the after-all completeness assertion.
- `tests/helpers/public-runtime.ts` — preserves the guarded npx cache root for package-asset inspection and retries only transient npm network failures, bounded at three attempts.
- `tests/package/public-artifact-acceptance.test.ts` — runs both public sources, validates their scenario bridges, writes redacted per-path reports, and reports the phase-wide honest result.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Inherited 07-03 `completedScenarios` reference was undeclared**
- **Found during:** Task 2 real acceptance execution.
- **Issue:** six review scenarios attempted `.add(...)` and the after-all record gate read an identifier with no declaration, causing `ReferenceError: completedScenarios is not defined`.
- **Fix:** declared the dynamic `Set<string>` accumulator adjacent to the required scenario list. The original test assertions, local-archive `passed` default, and public record status behavior remain unchanged.
- **Verification:** both public paths completed the source-independent review suite; the local-archive selection lists seven tests in exactly two files with no `ReferenceError`.
- **Committed in:** `4f6804c`.

**2. [Rule 3 - Blocking] Public driver required install proof on the deliberately separate support-state record**
- **Found during:** Task 2 real acceptance execution.
- **Issue:** `public-support-states` correctly publishes support rows without the review/package record's `publicProof` and `target`, but the driver's strict schema incorrectly required them and then dereferenced `publicProof`.
- **Fix:** retained strict schemas, separated the shared scenario envelope from the review/package proof envelope, and assert source/run identity on the support record itself. Install proof assertions remain strict for both review and package-asset records.
- **Verification:** final real command parsed all three bridge records for both paths and wrote reports.
- **Committed in:** `b3f775b`.

**Total deviations:** 2 auto-fixed (1 inherited correctness bug, 1 blocking driver-schema bug). **Impact:** both fixes preserve the full review, export, Finish, asset, and support contracts; no assertion was removed, skipped, or weakened.

## Typecheck Coverage

The production and web projects still omit `tests/`. The focused strict command below exposed and then cleared two real errors in `tests/helpers/public-runtime.ts`:

```text
$ npx tsc --noEmit --ignoreConfig --strict --target es2024 --module nodenext --moduleResolution nodenext --esModuleInterop --skipLibCheck --types node tests/helpers/public-runtime.ts
before: TS18046 at line 102 (`error` is `unknown`); TS2339 at line 155 (`Error` has no `code`)
after: exit 0; no diagnostics
```

The smallest complete `tsconfig.tests.json` attempt was reverted: it found 131 diagnostics in 25 files, led by `tests/unit/workspace-state.test.ts` (18), `tests/cli/request.test.ts` (13), `tests/e2e/agent-ready-export-safety.spec.ts` (13), `tests/unit/draft-load.test.ts` (13), and `tests/cli/selection.test.ts` (11). That is a broad pre-existing surface, not a couple of files owned by this work; no sweeping refactor or new script was kept.

## Local-Archive Regression and Custody Boundary

The explicit local-archive Playwright selection resolves to seven tests in exactly two specs: `tests/e2e/package-assets.spec.ts` and `tests/e2e/agent-ready-export.spec.ts`. The public executions then ran the latter spec's five source-independent scenarios end-to-end with no `ReferenceError`.

`npm run accept:runtime-artifact` was attempted for the full local regression but stopped before launching Playwright at its required operator-held `CUMPA_RELEASE_SUPPORT_SERVICE_URL`. It also requires a new absolute `CUMPA_RUNTIME_ACCEPTANCE_REPORT` plus custody inputs `CUMPA_RUNTIME_CUSTODY_DIR`, `CUMPA_RUNTIME_ARCHIVE_BASENAME`, `CUMPA_RUNTIME_ARCHIVE_SHA256`, and `CUMPA_RUNTIME_EVIDENCE`. Those inputs were unavailable and were not synthesized. Public paths use their baked launcher and did not require an operator-supplied support origin.

## Self-Check

```text
$ npx tsc --noEmit --project tsconfig.json && npx tsc --noEmit --project tsconfig.web.json
(exit 0; no output)

$ npx playwright test --config playwright.runtime-artifact.config.ts --list tests/e2e/package-assets.spec.ts tests/e2e/agent-ready-export.spec.ts
Total: 7 tests in 2 files

$ npm run accept:public-artifact -- --reporter=verbose
stdout | runs the public global and npx browser acceptance paths
{"status":"partially-blocked","reason":"live-entitlement-unavailable","paths":[{"installSource":"public-global","status":"passed","assetGraph":{"assets":true,"workers":true,"codicon":true},"installAttempts":1,"supportStates":[{"state":"unverified","status":"passed","substituted":false},{"state":"dismissed","status":"passed","substituted":false}]},{"installSource":"public-npx","status":"passed","assetGraph":{"assets":true,"workers":true,"codicon":true},"installAttempts":1,"supportStates":[{"state":"unverified","status":"passed","substituted":false},{"state":"dismissed","status":"passed","substituted":false}]}]}
Test Files  1 passed (1)
Tests  1 passed (1)
```

The npx report additionally recorded the empty cache (`npmCacheEntryCountBefore: 0`), no prior global/local binary, registry fetch observed, `npxResolvedPackageVersion: "1.5.0"`, and `npmInstallAttempts: 1`. Both reports carried pinned tarball/integrity, enabled install scripts, review/export and Finish observations, shared D-02 identity flags, unchanged source-control flags, cleanup completion, and no forbidden values.

## Hardened-Pipeline Rerun

After `792806a`, `f3b9079`, and `6492551`, the public pre-restore rerun passed for global and npx (asset graph true; one install attempt each; unverified and dismissed rows passed). The public post-restore rerun completed its browser workflows but produced honest blocked verified rows with `reason: human-sign-in-unavailable`, `substituted: false`: a fresh shared support HOME cannot carry the already-consumed protected Restore. A second Restore was not triggered.

The marketplace pre/post commands both reached the enforced isolation gate. They passed their Vitest driver by publishing `status: blocked`, `reason: omp-isolation-unavailable`, `substituted: false` before profile creation, install, or agent launch. A pre-existing operator XDG symlink and socket initially blocked the read-only profile digest; `69bbf52` made that digest preserve symlink target identity/content and special-entry metadata. The gate remained unhonored, so no marketplace review was claimed.

Because the new reports do not establish the required established `live-entitlement-unavailable` verified result or ACC-03 execution, they were not fed to the writer. The prior committed record remains in place rather than being silently mutated or regenerated from incompatible evidence.

## Next Phase Readiness

- The prior established outcome remains `partially-blocked`; a correct regeneration requires reports that observe the one already-attempted Restore without another protected sign-in and an OMP runtime that honors all required redirections.
- The public global/npx pre-restore evidence is complete. A full local-archive run awaits the operator-held custody/origin inputs above.

---
*Phase: 07-clean-public-artifact-acceptance*
*Completed: 2026-09-12*
