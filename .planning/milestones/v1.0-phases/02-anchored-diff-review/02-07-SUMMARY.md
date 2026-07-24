---
phase: 02-anchored-diff-review
plan: 07
subsystem: testing
tags: [playwright, chromium, monaco, packaged-cli, git, draft-persistence]

requires:
  - phase: 02-anchored-diff-review
    provides: frozen comparison sessions, Monaco anchors, canonical comments, and comparison-keyed draft persistence
provides:
  - Packaged production Chromium proof that real Git comparisons create and resume canonical base/head comments
  - A production-artifact gate for the generated executable CLI and browser bundle
  - Base-side anchored comment affordance alongside the existing head-side control
affects: [phase-03, browser-review-flow, export]

tech-stack:
  added: []
  patterns:
    - Package-first Playwright acceptance launches the packed generated CLI against a real Git fixture and browser
    - Canonical comment API responses are direct comment records consumed by the strict browser client

key-files:
  created:
    - scripts/verify-production-artifacts.mjs
    - tests/e2e/anchored-review.spec.ts
  modified:
    - package.json
    - scripts/verify-prerequisites.mjs
    - tests/helpers/git-fixture.ts
    - src/server/routes.ts
    - src/web/components/DiffWorkspace.vue
    - src/web/styles.css

key-decisions:
  - "Run Phase 2 acceptance through npm-packaged production output, a loopback Fastify process, Chromium, and actual Git object contents rather than development seams."
  - "Return the direct canonical comment record from the POST endpoint because the strict client contract accepts CommentRecord, not a persistence envelope."
  - "Keep persistence isolated by selected endpoint pair; stale and orphan records remain rail-visible without inline relocation."

patterns-established:
  - "Production package gate: build output must include an executable CLI, HTML entrypoint, and a nonempty asset before browser acceptance runs."
  - "Persistence failure proof: retain composer text and avoid a UI acceptance state before re-enabling the repository-local draft directory."

requirements-completed: [DIFF-02, DIFF-03, DIFF-04, DIFF-05, DIFF-07, CMT-01, CMT-02, CMT-08, DRFT-01, DRFT-02, DRFT-03]

duration: 34min
completed: 2026-07-21
status: complete
---

# Phase 02 Plan 07: Anchored Diff Review Summary

**Packaged production CLI acceptance now exercises real Git diffs in Chromium, persists canonical base/head comments atomically, resumes the selected comparison, and isolates a different comparison.**

## Performance

- **Duration:** 34 min
- **Started:** 2026-07-21T13:17:53Z
- **Completed:** 2026-07-21T13:51:44Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added a package-first Playwright scenario that builds, packs, extracts, launches the generated CLI against an independent real-Git fixture, opens the loopback capability URL in Chromium, and shuts the process down cleanly.
- Proved rejected persistence retains the composer, successful base/head comments are server-canonical and persisted, seeded stale/orphan records do not relocate inline, same-pair relaunch restores comments, and an alternate pair is isolated.
- Added an explicit production-artifact gate and reconciled the audited dependency gate with the existing exact `monaco-editor@0.55.1` production dependency.
- Corrected the endpoint/client contract and exposed a base-side comment control so both sides can initiate an anchored composer through the production UI.

## Task Commits

Each task was committed atomically:

1. **Task 1: Establish packaged real-Git acceptance red and production gates** - `bba8a26` (test)
2. **Task 2: Complete production anchored review flow** - `74f6d42` (feat)

**Plan metadata:** Included in the final documentation and tracking commit.

## Files Created/Modified

- `package.json` - Adds the production-artifact verification command.
- `scripts/verify-prerequisites.mjs` - Allows the already-audited exact Monaco production release while retaining the exact direct-dependency gate.
- `scripts/verify-production-artifacts.mjs` - Verifies the generated executable, browser entrypoint, and bundled assets.
- `tests/helpers/git-fixture.ts` - Supplies a rename, changed, unchanged, deleted, and alternate-comparison Git fixture.
- `tests/e2e/anchored-review.spec.ts` - Drives generated packaged output, loopback capability launch, Chromium/Monaco interactions, persistence, stale/orphan resume, isolation, and shutdown.
- `src/server/routes.ts` - Returns the accepted canonical comment record matching the browser contract.
- `src/web/components/DiffWorkspace.vue` - Provides base and head comment-entry controls.
- `src/web/styles.css` - Positions the base-side control in the side-by-side workspace.

## Decisions Made

- The acceptance test uses `npm pack --ignore-scripts`, extracts the tarball, and launches its generated executable. This prevents source imports, Vite dev assets, and mock DTOs from proving the contract accidentally.
- The POST comment endpoint exposes its canonical `CommentRecord` directly. The persistence revision remains server-owned but is not part of the strict client comment parse contract.
- The different selected endpoint pair must open with no comments even when the same repository contains persisted comments for the original pair.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reconciled the prerequisite allowlist and supplied its missing production-artifact command**
- **Found during:** Task 1 (Establish packaged real-Git acceptance red and production gates)
- **Issue:** Phase 02-01 had intentionally added exact `monaco-editor@0.55.1`, but the prerequisite gate still allowed only fourteen dependencies; the plan-required `verify:production-artifacts` command did not exist.
- **Fix:** Added Monaco to the existing exact-version allowlist and created a narrow artifact verifier for the actual generated `dist/bin/diff-review.mjs`, web HTML, and assets.
- **Files modified:** `package.json`, `scripts/verify-prerequisites.mjs`, `scripts/verify-production-artifacts.mjs`
- **Verification:** `npm run verify:prerequisites`, `npm run build`, and `npm run verify:production-artifacts` passed before each final packaged browser run.
- **Committed in:** `bba8a26` (Task 1 commit)

**2. [Rule 1 - Bug] Aligned the comment endpoint response with the strict browser API contract**
- **Found during:** Task 2 (Complete production anchored review flow)
- **Issue:** The production endpoint returned `{ comment, revision }`, while the strict client accepts a direct canonical `CommentRecord`; the request returned 201 but the accepted comment never rendered.
- **Fix:** Returned `accepted.comment` directly from the POST route.
- **Files modified:** `src/server/routes.ts`
- **Verification:** The packaged Chromium flow visibly renders and persists both accepted comments, then restores them after relaunch.
- **Committed in:** `74f6d42` (Task 2 commit)

**3. [Rule 1 - Bug] Added the missing base-side anchor entry control**
- **Found during:** Task 2 (Complete production anchored review flow)
- **Issue:** The workspace exposed only a hard-coded head-side action, blocking the required base-side comment path.
- **Fix:** Replaced the head-specific handler with a shared side-aware handler and exposed a positioned base-side control.
- **Files modified:** `src/web/components/DiffWorkspace.vue`, `src/web/styles.css`
- **Verification:** The packaged Chromium flow opens, saves, and shows a base-side comment on `changed.ts`.
- **Committed in:** `74f6d42` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 rule-1 bugs, 1 rule-3 blocker)
**Impact on plan:** All corrections were necessary to run the specified generated-package production flow; no unrelated scope was added.

## Issues Encountered

- The first packaged red exposed an endpoint envelope mismatch masked by the Vite mock response; aligning the response with the shared strict client contract restored visible accepted comments.
- The initial fixture did not create its `src` directory before writing the anchored paths; creating it made the real Git fixture deterministic.
- Monaco's existing keyboard actions covered both sides, but the visible production entry control covered only head line 1; adding the base counterpart unblocked the base-side acceptance path.

## Verification

The final required sequence passed twice after the green implementation:

```text
npm run verify:prerequisites
npm run build
npm run verify:production-artifacts
npm run test:package -- tests/e2e/anchored-review.spec.ts
```

Each run verified Node/Git/direct-release prerequisites, compiled runtime and Vite assets, verified production artifacts, and passed the Chromium packaged review scenario.

### Production evidence

- **Runtime versions:** Chromium `149.0.7827.55` (the Playwright `chromium-1228` executable observed with `--version`) and exact `monaco-editor@0.55.1`.
- **Real-Git facts:** the fixture created distinct `main` and `feature` endpoint OIDs; the base object at `src/old-name.ts` contains `base path`, while the feature object at renamed `src/new-name.ts` contains `new path`. The alternate head is a distinct committed comparison containing only `src/alternate.ts`.
- **Atomic fault/resume/isolation:** a non-writable `.diff-review/drafts` directory produces the composer failure state while retaining typed text; restoring permissions permits server-confirmed comments. A relaunch of the original endpoint pair shows both accepted comments and seeded stale/orphan entries; an alternate endpoint pair has none of the original comments.
- **Stale/orphan observation:** records seeded with altered exact selected/context text display `Stale anchor`; a record with line `999` displays `Anchor unavailable`. Neither is asserted as an inline relocated marker.
- **Capability and lifecycle observation:** the only browser entrypoint in the scenario is the generated CLI's `127.0.0.1` fragment-capability URL. Each of the initial, resumed, and alternate generated processes is stopped with `SIGINT` and awaited before the next lifecycle step.

### Source coverage audit

| Coverage | Packaged or focused evidence |
| --- | --- |
| D-01, D-02 | Generated Monaco side-by-side view loads exact renamed base/head blobs. The visible base and head actions plus the adapter's cursor-based `Option/Alt+Enter` actions initiate side-specific anchors; the scenario saves both sides. |
| D-03, D-04, D-05 | The focused test resizes the browser and exercises next-change navigation; Phase 02-03 through 02-06 focused adapter/workspace tests cover recomputation, file switching, and paired view-zone lifecycle. |
| D-06 | The real POST path accepts a server-derived canonical record, the browser renders it twice (inline and rail), and the JSON draft contains exactly the accepted records before relaunch. |
| D-07, D-08 | Generated Chromium uses the production tree, selected-file heading, visible comment rail, and deterministic stale/orphan presentations. |
| D-09, D-10 | The generated loopback lifecycle carries the launch fragment token; the existing Phase 01 focused capability/origin tests remain the security seam coverage. This plan introduced no alternate API authority or source-content path. |
| D-11, D-12 | Same-pair resume restores comments, a changed selected endpoint pair isolates its draft, and failure/retry proves persistence confirmation is not optimistic. |

### Phase boundary audit

- The browser test imports no application source and uses no Vite server, DTO mock, browser storage, or synthetic Git metadata; it runs the tarball's generated CLI against a real repository and immutable Git objects.
- No Phase 3/later behavior was added: there is no comment mutation, summary mutation, revision-conflict UI, drift recovery UI, fuzzy reattachment, thread/reply surface, export, unified layout, or theme control.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 02's final generated-package Chromium acceptance evidence is complete and ready for Phase 03 planning and verification.
- No blockers identified.

---
*Phase: 02-anchored-diff-review*
*Completed: 2026-07-21*
