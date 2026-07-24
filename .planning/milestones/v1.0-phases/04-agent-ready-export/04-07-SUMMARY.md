---
phase: 04-agent-ready-export
plan: 07
subsystem: export-safety-testing
tags: [vitest, playwright, git, filesystem, child-process, export]
requires:
  - phase: 04-agent-ready-export/04-03
    provides: validated candidate publication and refusal-first re-export boundary
  - phase: 04-agent-ready-export/04-04
    provides: fixed append-only ignore capability and internal-path exclusion
provides:
  - dirty real-Git fixture matrix with independent binary-safe source-control snapshots
  - child-process generated-artifact publication, recovery, and fixed-ignore safety evidence
  - deterministic refusal-before-touch and exact final-pair reread assertions
affects: [04-08, release-verification, export]
tech-stack:
  added: []
  patterns: [independent Git/fs snapshots, generated-artifact child-process harnesses, exact approved-output exceptions]
key-files:
  created: [tests/helpers/source-control-snapshot.ts, tests/helpers/export-fault-runner.ts, tests/e2e/agent-ready-export-safety.spec.ts, tests/package/agent-ready-export-safety.test.ts]
  modified: [tests/helpers/git-fixture.ts, vitest.config.ts]
key-decisions:
  - "The reconciled packaged target declares no native exchange capability, so re-export is proven refusal-first before any stable metadata or byte mutation."
  - "Source-control comparisons permit only .diff-review descendants and the exact existing .gitignore bytes plus '/.diff-review/\\n'."
patterns-established:
  - "Safety evidence runs the generated dist publication, recovery, and fixed-ignore modules in isolated Node child processes against real temporary Git repositories."
requirements-completed: [EXP-05, EXP-06, EXP-08, SAFE-04]
duration: execution session
completed: 2026-07-23
status: complete
---

# Phase 04 Plan 07: Agent-ready export safety harnesses Summary

**Independent dirty Git snapshots and generated-child-process tests prove the fixed export boundary preserves source control, emits only complete validated pairs, and refuses this undeclared native re-export target before stable output changes.**

## Accomplishments

- Added four ordered real-Git selector fixture identities (branch→branch, branch→worktree, worktree→branch, worktree→worktree), each with unusual safe paths plus distinct staged, unstaged, untracked, and mode state.
- Added independent binary-safe snapshots for HEAD/ref, refs, remotes, raw index bytes/SHA-256, tracked content/modes, staged/unstaged no-external-diff deltas, and untracked bytes. Deliberate controls prove every forbidden class is detected.
- Added real child-process runs of generated `dist` export publication, recovery, and fixed ignore append behavior. The harness rereads final files independently, reparses canonical JSON, reprojects Markdown, hashes exact bytes, and validates restart/remnant behavior.
- Added focused package and Playwright safety tests without browser UI or alternate export APIs.

## Exact native availability and interruption/restart matrix

| Capability/state | External observation | Required invariant | Evidence |
|---|---|---|---|
| Declared native exchange target | None declared in reconciled package | Do not claim portable/native re-export support | `reExportUnsupported` is the only re-export disposition |
| Existing complete stable pair + unsupported re-export | Separate Node child samples 32 complete pairs | Every sample is the old exact JSON/Markdown pair; stable inode and bytes unchanged | Package safety test |
| Existing complete stable pair + failed/undeclared runtime path | No stable exchange is invoked | Typed refusal occurs before candidate/stable metadata or content changes | Generated production artifact child result |
| First export with invalid bytes | Stable absent before and after | No one-file/partial stable path appears | Generated child returns `publicationFailed` and `lstat(stable)` is ENOENT |
| Restart with complete stable | Separate recovery child | Recovery returns the exact final bytes | `runGeneratedRecovery` result equals independently reread pair |
| Restart with ambiguous candidate remnant and no stable | Separate recovery child | Stable is not restored or removed; remnant is preserved | Marker remains after recovery |

The plan's supported-platform interruption requirement is intentionally not claimed: reconciliation and the packaged capability both establish zero declared native exchange targets. The strict, externally observed safety contract on this target is refusal-before-touch, not a portable fallback replacement.

## Source-control and command audit evidence

- Before/after snapshots allow only `.diff-review/**`; no broad source, index, ref, remote, staged/unstaged, untracked, or audit exception exists.
- The only allowed root mutation is the exact byte append `/.diff-review/\n` after explicit generated fixed-capability execution; original `.gitignore` bytes are preserved.
- Deliberate controls independently detect HEAD/ref, remote, index, tracked source, tracked mode, and untracked binary-byte mutations.
- The command audit rejects mutating Git commands, network Git commands, shells, repository executables/hooks, and package-script executables. Product export test processes invoke generated modules through explicit Node argv, not a repository executable or shell string.

## Final receipt evidence

The generated stable directory contains exactly `review.json` and `review.md`. Tests independently re-read both buffers, validate the canonical JSON schema, derive Markdown from reparsed JSON for byte equality, and SHA-256 hash each final file independently. Receipt paths remain relative under `.diff-review/exports/`.

## Verification

- `node .planning/phases/04-agent-ready-export/validate-reconciliation.mjs .planning/phases/04-agent-ready-export/04-01-RECONCILIATION.json` — passed before edits.
- Reconciled `04-07-source-snapshot` runner — **8 files, 35 tests passed**.
- Reconciled `04-07-real-fs-recovery` runner — **14 files, 87 tests passed**.
- `node_modules/.bin/vitest run tests/package/agent-ready-export-safety.test.ts` — **6 tests passed**.
- `node_modules/.bin/playwright test tests/e2e/agent-ready-export-safety.spec.ts` — **1 test passed**.

## Task Commits

1. **Task 1: dirty real-Git fixtures and independent snapshots**
   - `feac2c4` — RED source-safety contracts
   - `5c2803b` — GREEN dirty fixtures and snapshot/audit implementation
2. **Task 2: generated publication/recovery/refusal safety harness**
   - `e908810` — RED generated recovery contracts
   - `1c237be` — GREEN generated child-process publication, restart, and ignore-capability harness

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Enabled focused package safety-test discovery.**
- **Found during:** Task 1 RED
- **Issue:** The existing Vitest include list excluded the plan-owned `tests/package/**/*.test.ts`, so the requested safety contract could not execute.
- **Fix:** Added the narrowly scoped package test include; no runtime, dependency, or product configuration changed.
- **Files modified:** `vitest.config.ts`
- **Verification:** The package safety runner executes all six real Git/filesystem/child-process cases.
- **Committed in:** `feac2c4`

**Total deviations:** 1 auto-fixed (1 blocking test-discovery issue).

## TDD Gate Compliance

- RED commits `feac2c4` and `e908810` were created only after their new tests failed on missing safety harness modules.
- GREEN commits `5c2803b` and `1c237be` follow their corresponding RED commits and pass the focused safety verification.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 04-08 can reuse the fixture matrix, source-control snapshots, and generated-artifact harnesses without weakening export authority or modifying receipt UI.
- No packaged native exchange target is declared. Any future target that enables re-export must add its actual packaged primitive and synchronized old-or-new continuous-reader proof before changing the refusal-first policy.

## Self-Check: PASSED

- All five required helper/test artifacts and this summary exist.
- RED/GREEN task commits `feac2c4`, `5c2803b`, `e908810`, and `1c237be` exist in repository history in the required order.
