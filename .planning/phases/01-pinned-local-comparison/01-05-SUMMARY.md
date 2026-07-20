---
phase: 01-pinned-local-comparison
plan: 05
subsystem: comparison-validation
tags: [native-git, capability-probes, launch-errors, picker-recovery, tdd]

requires:
  - phase: 01-pinned-local-comparison
    plan: 02
    provides: Pinned comparison descriptor and native-Git comparison core
  - phase: 01-pinned-local-comparison
    plan: 03
    provides: Loopback-only launch lifecycle for an already-pinned comparison
  - phase: 01-pinned-local-comparison
    plan: 04
    provides: Ordered local branch and worktree selection with frozen source identities
provides:
  - Git 2.43 minimum and positive startup probes for every required machine protocol
  - Typed fatal and recoverable pre-session launch-error taxonomy with exact terminal copy
  - Equal-commit rejection, exactly-one-merge-base validation, and pinned-object verification
  - Role-local picker recovery that preserves the valid opposite endpoint
  - Real-Git fixtures for bare, unborn, unrelated, criss-cross, equal, stale-ref, and removed-object states
affects: [01-06-changed-file-inventory, 01-07-diff-contract, 01-08-loopback-security]

tech-stack:
  added: []
  patterns:
    - Probe the installed Git version and required machine protocols before source selection
    - Resolve selected endpoints once to full object IDs and use only those IDs for comparison validation
    - Classify launch failures as fatal environment errors or role-local recoverable selection errors
    - Require exactly one merge-base result and verify every pinned commit object before session creation

key-files:
  created:
    - src/domain/errors.ts
    - tests/git/comparison.test.ts
    - tests/cli/errors.test.ts
    - scripts/run-focused-vitest.mjs
  modified:
    - package.json
    - src/git/repository.ts
    - src/git/comparison.ts
    - src/cli/run.ts
    - src/cli/picker.ts
    - tests/helpers/git-fixture.ts

key-decisions:
  - "Capability boundary: Git 2.43.0 and every required machine protocol must pass positive probes before source selection; no weaker parser fallback is permitted."
  - "Failure ownership: environment and repository-shape failures exit before launch, while endpoint, equality, graph, and object failures restore only the failed picker role and preserve the opposite valid selection."
  - "Pinned authority: resolve endpoints once, pass discrete full OIDs to merge-base --all, accept exactly one result, and verify endpoint and merge-base objects without substituting moving refs or worktree files."

patterns-established:
  - "Fatal-before-interaction: capability and repository prerequisites complete before the picker, listener, or browser can run."
  - "Role-local recovery: typed failures identify the picker role to clear, the opposite endpoint to retain, and the focus target to restore."
  - "Exactly-one ancestry: distinct endpoints require one and only one native-Git merge base before a comparison descriptor can be frozen."

requirements-completed: [SEL-02, SEL-06, CMP-03]

duration: 29min
completed: 2026-07-20
status: complete
---

# Phase 01 Plan 05: Pinned Comparison Validation and Recovery Summary

**Diff Review now rejects unsupported Git and invalid repository states before interaction, rejects equal commits, accepts only one unambiguous native-Git merge base, verifies pinned objects, and returns recoverable failures to the correct picker role without discarding the opposite valid selection.**

## Performance

- **Duration:** 29 min
- **Started:** 2026-07-20T11:46:53Z
- **Completed:** 2026-07-20T12:16:32Z
- **Tasks:** 2
- **Files created or modified:** 10

## Accomplishments

- Added a shared `LaunchError` domain taxonomy covering exact fatal and recoverable pre-session states, failed selection roles, preservation ownership, and focus behavior.
- Enforced Git `>=2.43.0` and positively probed the required worktree, ref, merge-base, raw diff, numstat, and batch object protocols before comparison selection can proceed.
- Distinguished missing Git, unsupported Git/capabilities, non-worktree directories, bare repositories, and empty or unborn repositories before picker, bind, browser-open, or session activity.
- Rejected equal full object IDs before pair ancestry computation, required exactly one best merge base for distinct endpoints, and verified base, head, and merge-base commit objects before freezing the descriptor.
- Implemented role-local recovery: base failures restore base, head/equality/graph failures restore head, merge-base object failures restore head, and the valid opposite selection remains retained.
- Proved with real Git fixtures that unrelated histories yield no merge base, criss-cross history yields two best merge bases, stale refs fail by endpoint role, and object disappearance never causes moving-ref or worktree-file substitution.

## Task Commits

Each TDD gate was committed atomically and remains unchanged:

1. **Task 1: RED — specify every pre-session validation and recovery state** — `17060f8` (`test`)
2. **Task 2: GREEN/REFACTOR — enforce unambiguous pinned comparison launch** — `acd89f6` (`feat`)

**Plan metadata:** recorded separately by `docs(01-05): complete comparison recovery plan`.

## TDD Evidence

### RED — `17060f8`

The RED commit added the real-Git DAG fixtures and the comparison/CLI failure contracts before production support. Its plan-prescribed fixture proof established that the criss-cross fixture exposes two native best merge bases, while the behavioral comparison matrix and CLI recovery checks were recorded nonzero against the missing implementation.

```text
npm run test:git -- tests/git/comparison.test.ts --grep "fixture has two best merge bases"
# fixture proof: expected 0

npm run test:git -- tests/git/comparison.test.ts --grep "comparison validation matrix"
# behavioral RED: expected nonzero

npm run test:unit -- tests/cli/errors.test.ts
# behavioral RED: expected nonzero
```

### GREEN — `acd89f6`

The existing GREEN commit implemented the typed validation and recovery state machine. During recovery closeout on `main`, the exact two Task 2 commands were rerun from `acd89f6`; both exited 0:

```text
npm run test:git -- tests/git/comparison.test.ts
# Test Files 3 passed (3)
# Tests 16 passed (16)

npm run test:unit -- tests/cli/errors.test.ts
# Test Files 1 passed (1)
# Tests 12 passed (12)
```

The Git script intentionally executes the existing `tests/git` category in addition to the named comparison file. The CLI script executed only the named error-recovery file. No formatter, linter, project-wide suite, or unrelated test category ran during closeout.

## Capability and Repository Gates

Startup applies these gates before an interactive comparison can launch:

| Gate | Native-Git command/protocol | Failure behavior |
|---|---|---|
| Installed Git | `git --version` | Missing executable becomes `git-missing`; no later probe runs |
| Supported version | Parsed version `>=2.43.0` | Older or malformed version becomes `git-unsupported`; no fallback parser runs |
| Worktree discovery protocol | `worktree list --porcelain -z` | Any unsupported protocol becomes one fatal prerequisite failure |
| Ref discovery protocol | `for-each-ref --format=%(refname)%00 refs/heads` | Same fatal prerequisite ownership |
| Complete ancestry protocol | `merge-base --all <oid> <oid>` | Same fatal prerequisite ownership |
| Changed-record protocols | `diff --raw -z ...` and `diff --numstat -z ...` | Same fatal prerequisite ownership |
| Batch object protocol | `cat-file --batch-command -Z` | Same fatal prerequisite ownership |
| Repository shape | `rev-parse --show-toplevel`, bare check, verified `HEAD^{commit}` | Distinct not-worktree, bare, and empty/unborn fatal states |

A recognized version alone is insufficient: every required machine protocol must also succeed positively before selection.

## Exact Pre-Session Terminal States

Every failure remains terminal-owned and occurs before session creation. Fatal states set failure status and exit; recoverable states keep the process alive, preserve the opposite valid selection, and restore the failed role.

| State | Exact terminal copy | Recovery |
|---|---|---|
| Git executable missing | `Git is required but was not found. Install Git, then run Diff Review again.` | Exit; no picker, bind, or browser activity |
| Unsupported Git or required protocol | `Git 2.43.0 or newer with the required machine protocols is required. Upgrade Git, then run Diff Review again.` | Exit; no parser fallback or launch activity |
| Not inside a Git worktree | `This directory is not inside a Git worktree. Run Diff Review from a Git worktree.` | Exit |
| Bare repository | `Bare repositories are not supported. Run Diff Review from a non-bare Git worktree.` | Exit |
| Empty or unborn repository | `This repository has no commits yet. Create the first commit, then run Diff Review again.` | Exit |
| Selected branch/ref unavailable | `The selected {role} “{label}” no longer resolves to a commit. Choose another {role} or repair the ref with Git.` | Return to the failed role; preserve the opposite endpoint |
| Selected worktree HEAD unavailable | `The selected {role} worktree cannot resolve a committed HEAD. Choose another {role} or repair the worktree with Git.` | Return to the failed role; preserve the opposite endpoint |
| Required pinned object unavailable | `Required Git object {short ID} is missing or unreadable. Repair the repository's object data with Git, then retry.` | Return to the object's endpoint role; merge-base failures return to head |
| Equal full OIDs | `Base and head resolve to the same commit. Choose a different head.` | Preserve base, clear head, return to head |
| No merge base | `Base and head have unrelated histories; Git could not find a merge base. Choose a different head or go back to change base.` | Preserve base, clear head, return to head |
| Multiple merge bases | `Base and head have multiple merge bases, so this comparison cannot be pinned unambiguously. Choose a different head or go back to change base.` | Preserve base, clear head, return to head |

## Comparison Validation Matrix

| Selected state | Result before session creation | Picker behavior |
|---|---|---|
| Base OID equals head OID | Throw `equal-commits` before the selected-pair merge-base command or descriptor creation | Preserve base; clear and restore head |
| Distinct endpoints with one best merge base | Verify base, head, and sole merge-base commit objects, then freeze the descriptor | Continue to confirmation and launch |
| Unrelated histories | Throw `unrelated-histories`; no descriptor or launch | Preserve base; return to head |
| Criss-cross histories with two best merge bases | Throw `multiple-merge-bases`; never choose either base | Preserve base; return to head |
| Base branch or worktree disappeared | Throw role-specific `endpoint-unavailable` | Return to base; preserve head when present |
| Head branch or worktree disappeared | Throw role-specific `endpoint-unavailable` | Preserve base; return to head |
| Base or head object disappeared after resolution | Throw `object-unavailable` for that full pinned identity | Return to the affected endpoint role |
| Sole merge-base object disappeared | Throw `object-unavailable` for the merge-base identity | Preserve base; return to head |

The criss-cross fixture is not a mocked parser case: native `git merge-base --all` returns two distinct best common ancestors before the application assertion evaluates the ambiguity.

## Terminal Ownership and Picker Recovery

Fatal environment and repository-shape states print one actionable message, set status 1, and leave picker, Fastify bind, browser open, and session launch untouched.

Recoverable selection states behave as follows:

- A base endpoint or base object failure returns focus to base and preserves head when available.
- A head endpoint, equality, graph, head object, or merge-base object failure returns focus to head and preserves base.
- If the failed candidate still exists after rediscovery, the prior row becomes the focus/default target.
- If the failed candidate no longer exists, focus falls back to the failed role's search input rather than selecting a replacement.
- The retained opposite selection is rendered above the restored picker.
- No HTTP listener or browser is launched until validation succeeds and confirmation accepts the frozen descriptor.

## Pinned Authority and No-Substitution Proof

```text
selected branch/worktree records
  -> resolve each endpoint once to a full commit OID
  -> reject equal full OIDs
  -> git merge-base --all <base-oid> <head-oid>
  -> require exactly one result
  -> reverify base, head, and merge-base commit objects
  -> freeze comparison descriptor
  -> confirmation
  -> bind loopback session and open browser
```

The validation code passes discrete argument-array values and does not invoke a shell. The stale-ref test records only one selected-ref resolution. The removed-object test deletes a selected object after resolution and asserts the pinned short-ID failure, one ref resolution, no `git show`, and no `ref:path` fallback. The comparison path does not read worktree content as an object substitute.

## Files Created/Modified

- `src/domain/errors.ts` — launch-failure kinds, fatal/recoverable ownership, selection roles, exact fatal messages, and the structural `LaunchError` guard.
- `src/git/repository.ts` — Git version enforcement, positive machine-protocol probes, and repository-shape classification.
- `src/git/comparison.ts` — endpoint resolution, equality rejection, object-format-aware merge-base parsing, exactly-one cardinality checks, and pinned commit verification.
- `src/cli/run.ts` — fatal reporting, recoverable retry/rediscovery loop, retained endpoint state, and exclusion of launch until successful validation and confirmation.
- `src/cli/picker.ts` — recovery defaults, retained-opposite copy, prior-row focus, and search-input fallback.
- `tests/helpers/git-fixture.ts` — bare, unborn, non-repository, unrelated, criss-cross, equal, stale-ref, and removed-object fixture support.
- `tests/git/comparison.test.ts` — real-Git capability, repository, equality, graph, stale-ref, and no-substitution contracts.
- `tests/cli/errors.test.ts` — exact fatal copy, zero-launch activity, and role-local picker recovery contracts.
- `scripts/run-focused-vitest.mjs` — focused Vitest argument adapter for the plan's required `--grep` form.
- `package.json` — routes focused Git and unit scripts through the adapter while retaining their category roots.

`src/git/runner.ts` required no Plan 01-05 edit; the existing bounded, shell-free argument-array runner already satisfied the implementation boundary.

## Decisions Made

- Git support is a positive capability contract, not only a version-string check. Git 2.43.0 is the minimum and every required machine protocol must pass before selection.
- Pre-session failures carry recovery ownership in the domain error. Fatal environment/repository states exit; recoverable endpoint/equality/graph/object states restore one picker role and retain the opposite endpoint.
- Pinned OIDs are the only comparison authority after resolution. Distinct endpoints require exactly one `merge-base --all` record, and object disappearance fails instead of re-resolving or reading worktree bytes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adapted the plan-prescribed Vitest `--grep` command**
- **Found during:** Task 1 RED fixture proof
- **Issue:** Installed Vitest 4.1.10 does not accept the plan's `--grep <pattern>` argument, so the exact focused fixture command failed in CLI parsing before reaching the named test.
- **Fix:** Added `scripts/run-focused-vitest.mjs` to translate `--grep <pattern>` to Vitest's supported `--testNamePattern <pattern>`, then routed the existing `test:git` and `test:unit` scripts through it without broadening their category roots.
- **Files modified:** `scripts/run-focused-vitest.mjs`, `package.json`
- **Verification:** The exact fixture-proof command reached the named criss-cross test; the final exact Git and CLI GREEN commands both exited 0.
- **Committed in:** `17060f8`

---

**Total deviations:** 1 auto-fixed (1 blocking test-command compatibility issue).
**Impact on plan:** The adapter changed only focused test argument handling. Production scope and test category ownership remained unchanged.

## Issues Encountered

- Vitest's unsupported `--grep` form initially blocked the plan-prescribed fixture proof; the focused adapter made that exact command executable.
- GREEN test refinement exercised real bare, unborn, and non-repository fixtures and actual picker recovery state rather than relying only on injected error plumbing.

## Known Stubs

None. The delivered source contains no `TODO`, `FIXME`, placeholder, coming-soon, or not-available implementation marker. The scan's `null` checks and empty default dependency objects are functional control flow, not stubs.

## User Setup Required

None. The implementation uses the project's already-required native Git executable and repository-local committed objects.

## Next Phase Readiness

- Plan 01-06 can consume a comparison descriptor whose distinct endpoints and sole merge base are verified immutable commit objects.
- Changed-file inventory can rely on prerequisite machine protocols having passed before source selection.
- Later server/security work inherits the strict no-listener-before-validation boundary.
- No blocker remains; sequential execution resumes at Plan 01-06.

## Self-Check: PASSED

- All ten implementation, test, and focused-command artifacts exist on disk.
- RED commit `17060f8` precedes GREEN commit `acd89f6` on `main`; no commit was duplicated, rewritten, reverted, or replaced.
- The exact final Git comparison check exited 0 with 3 files and 16 tests passed.
- The exact final CLI recovery check exited 0 with 1 file and 12 tests passed.
- Equality is documented as a launch-blocking recoverable error, matching the plan, UI contract, test, and implementation.
- No later-plan implementation was added.
- Unrelated `.planning/config.json` and `.planning/forensics/` changes remain outside this plan's closeout files.

---
*Phase: 01-pinned-local-comparison*
*Completed: 2026-07-20*
