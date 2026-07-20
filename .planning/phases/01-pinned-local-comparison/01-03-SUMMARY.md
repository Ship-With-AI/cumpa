---
phase: 01-pinned-local-comparison
plan: 03
subsystem: session-lifecycle
status: complete
tags: [fastify, loopback, playwright, vue, native-git, tdd]

requires:
  - phase: 01-pinned-local-comparison
    plan: 01
    provides: Generated Node 24 ESM package boundary, production Vue asset build, and focused package-test command
  - phase: 01-pinned-local-comparison
    plan: 02
    provides: Strict recursively frozen native-Git comparison descriptor with pinned base, head, and merge-base object identities
provides:
  - Production Fastify session factory closed over one immutable comparison descriptor
  - Ephemeral 127.0.0.1 listener whose actual URL is printed before browser-open dispatch
  - Packaged Vue loading transition and pinned-comparison identity surface
  - Idempotent SIGINT/SIGTERM shutdown coordination across active Git work and listener close
  - Packaged Chromium coverage for immutable session publication and interrupt cleanup
  - Random per-launch session-token seed for the later loopback security boundary
affects: [01-04-source-selection, 01-05-comparison-errors, 01-06-changed-file-inventory, 01-08-loopback-security]

tech-stack:
  added: []
  patterns:
    - Resolve and freeze Git comparison state before constructing or binding the HTTP session
    - Publish the kernel-assigned loopback address before invoking the non-authoritative browser opener
    - Close over immutable session state instead of resolving refs in request handlers
    - Route process signals through one shared idempotent shutdown promise

key-files:
  created:
    - playwright.config.ts
    - tests/e2e/pinned-session.spec.ts
    - src/server/app.ts
    - src/server/lifecycle.ts
    - src/web/styles.css
  modified:
    - src/cli/run.ts
    - src/web/App.vue

key-decisions:
  - "Construct the Fastify app only after createComparisonLaunchDescriptor has returned the frozen ordered comparison, so no port is bound for an invalid or unresolved selection."
  - "Treat the browser opener as best effort: print the actual loopback URL and exact manual-open fallback first, then keep serving if opener dispatch rejects."
  - "Use a single memoized shutdown promise for signals and programmatic cleanup so Git abort, listener close, handler removal, and first-signal exit status happen at most once."
  - "Keep interactive selection out of Plan 01-03; the packaged lifecycle test supplies ordered launch options through the orchestration seam that Plan 01-04 will replace with the real selector."

patterns-established:
  - "Frozen session boundary: request handlers expose only the descriptor captured at app creation."
  - "Loopback launch order: pin comparison, create app, bind 127.0.0.1:0, read actual address, print recovery instructions, dispatch opener."
  - "Coordinated shutdown: first termination request owns exit status while all later requests join the same cleanup promise."

requirements-completed: [SEL-08, SAFE-01, SAFE-05]

duration: 30min
completed: 2026-07-20
---

# Phase 01 Plan 03: Loopback Production Session Lifecycle Summary

**The generated package now turns one frozen native-Git comparison into a real loopback-only Fastify/Vue session, publishes its recoverable URL before browser dispatch, and tears Git work and HTTP ownership down exactly once on interrupt.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-07-20T10:07:21Z
- **Completed:** 2026-07-20T10:36:53Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added a production Fastify app factory that closes over the already-frozen comparison descriptor, exposes it through `GET /api/session`, and serves the compiled Vue application from the packaged `dist/web` boundary.
- Composed CLI startup in the required safety order: cancellation ownership first, complete native-Git comparison resolution second, loopback binding third, actual URL plus exact manual fallback output fourth, and best-effort browser dispatch last.
- Bound exclusively to `127.0.0.1` on port `0`, derived the browser URL from Fastify's actual listener address, and seeded each launch with a cryptographically random base64url session token for the later authentication plan.
- Implemented one idempotent shutdown coordinator for SIGINT, SIGTERM, explicit cleanup, active Git cancellation, listener closure, handler removal, and first-signal exit-code preservation.
- Replaced the production Vue placeholder with a validated loading-to-ready pinned-comparison surface showing ordered base/head labels, short and full object IDs, merge-base identity, and an explicit pinned-session cue.
- Added two focused packaged Chromium tests that exercise the generated executable against a disposable real Git repository, prove output ordering despite opener rejection, verify the rendered identities against independent native-Git queries, and assert interrupt cleanup exactly once.

## RED / GREEN Evidence

### RED — `2829e2a`

`npm run verify:prerequisites` exited 0 before the behavioral run: Node v24.15.0, Git, all fourteen approved exact dependency releases, generated bin production, and TypeScript compilation succeeded.

The required package command then failed for the intended missing behaviors:

```text
npm run test:package -- tests/e2e/pinned-session.spec.ts --grep "generated CLI opens immutable pinned session|interrupt closes loopback session once"
```

Both named tests failed behaviorally: the generated CLI exited through the earlier deferred-launch message without publishing a loopback URL, and the shutdown lifecycle module did not exist.

### GREEN — `41d5cb2`

The identical required package command exited 0 with the Chromium project: one file, two tests passed in 2.4 seconds.

The packaged executable test observed the real listener at `127.0.0.1` with a nonzero kernel-assigned port, captured terminal output at opener invocation to prove URL and exact fallback precedence, forced opener failure, then loaded the still-live production page and matched base, head, and merge-base IDs against independent Git commands. The interrupt test proved one Git abort, one listener close, removed signal handlers, preserved the first status 130, and confirmed the generated process also exited 130 on SIGINT.

Final `npm run verify:prerequisites` exited 0 after GREEN, including the generated executable and `tsc --project tsconfig.json` checks.

## Session Launch Contract

The runtime now follows one explicit ownership sequence:

```text
install shutdown ownership
  -> resolve repository and freeze ordered comparison
  -> create Fastify app closed over that comparison
  -> bind 127.0.0.1:0
  -> read actual listener address
  -> print URL and manual-open fallback
  -> dispatch best-effort browser opener
  -> serve until the shared shutdown promise completes
```

No route re-resolves source labels or reads moving refs. The JSON returned by `/api/session` is the same immutable comparison fact captured before the listener existed. An opener error is therefore recoverable from terminal output and does not terminate the session.

## Shutdown Contract

`createShutdownController` owns process-level termination without duplicating cleanup:

- SIGINT requests status 130 and SIGTERM requests status 143.
- The first shutdown request fixes the status; later requests join the existing promise.
- Active Git work is aborted before listener closure is awaited.
- Registered signal handlers are removed during cleanup.
- Git-abort and listener-close failures are both retained rather than allowing one cleanup branch to skip the other.
- Programmatic cleanup uses the same path as signal cleanup, so tests and production do not have competing lifecycle implementations.

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — specify packaged loopback session lifecycle** — `2829e2a` (`test`)
2. **Task 2: GREEN — serve frozen comparison on loopback** — `41d5cb2` (`feat`)

Plan metadata is recorded separately in the `docs(01-03)` completion commit.

## TDD Gate Compliance

Required gate ordering is present in Git history:

1. `2829e2a test(01-03): specify packaged loopback session lifecycle`
2. `41d5cb2 feat(01-03): serve frozen comparison on loopback`

RED failed on the absent packaged lifecycle and shutdown behavior before GREEN; GREEN passed the same focused package command. No optional refactor commit was necessary.

## Files Created/Modified

- `playwright.config.ts` — focused Chromium-only production-package configuration with a repository-owned web-server lifecycle.
- `tests/e2e/pinned-session.spec.ts` — generated-bin, real-Git, production-Vue, opener-order, pinned-identity, and exactly-once interrupt coverage.
- `src/server/app.ts` — Fastify production application closed over the frozen comparison and packaged static asset root.
- `src/server/lifecycle.ts` — shared idempotent signal, abort, listener-close, handler-removal, and exit-status controller.
- `src/web/styles.css` — dark pinned-session layout, loading state, identity rows, pin cue, and responsive presentation.
- `src/cli/run.ts` — frozen-comparison-to-loopback startup composition, actual URL publication, token seed, opener resilience, and shutdown wiring.
- `src/web/App.vue` — strict session-response validation and loading-to-pinned-comparison rendering.

## Decisions Made

- Comparison creation remains the gate before any listener exists. Fastify does not start speculatively while Git resolution is still fallible.
- The actual listener address, not a predicted port, is the only URL printed or sent to the browser opener.
- Browser launching is intentionally non-authoritative. Terminal recovery output is durable and precedes the opener call, while opener rejection cannot invalidate a healthy local server.
- The session token is created now because the URL is created now, but token authorization remains dependency-ordered work for Plan 01-08 rather than a partial security implementation here.
- The temporary ordered-options orchestration seam is limited to package lifecycle testing because interactive Commander/Inquirer selection belongs to Plan 01-04.

## Deviations from Plan

None - the plan was executed exactly as written without crossing into selector, file-inventory, review, or loopback-authentication scope.

## Issues Encountered

- A packed npm tarball does not contain its installed dependencies. The extracted-package fixture was corrected to link the repository's already-approved exact `node_modules` tree, preserving the required no-install package test while still executing the generated package boundary.
- Base and merge-base object IDs can legitimately be identical. The browser assertion was scoped to each labeled identity row rather than requiring globally unique text, preserving the intended semantic assertion.

## Known Stubs

- The no-selection generated-bin path still emits the Plan 01-01 deferred selector message. Plan 01-04 owns replacing this seam with the ordered Commander/Inquirer base/head workflow; Plan 01-03's package test injects the already-ordered selections and exercises the complete lifecycle after that boundary.
- The random URL token is a seed only in this plan. Route authorization and browser-serving token enforcement are explicitly owned by Plan 01-08.

## User Setup Required

None - no external service configuration is required.

## Next Phase Readiness

- Plan 01-04 can feed real ordered selector output directly into the completed `launchPinnedSession` boundary.
- Plans 01-05 and 01-06 can reuse the pre-bind comparison gate and frozen-session endpoint for explicit Git failures and byte-exact file inventory.
- Plan 01-08 can enforce the already-generated per-launch token across HTTP and browser asset requests without changing launch URL ownership.
- No blocker remains for the next dependency-ordered plan.

## Self-Check: PASSED

- All seven created or modified implementation/test artifacts and this summary exist on disk.
- RED commit `2829e2a` and later GREEN commit `41d5cb2` exist in Git history in required order.
- Final focused prerequisite/build verification exited 0.
- Final focused packaged Chromium verification exited 0 with one file and two named tests passed.
- Stub scan found only JavaScript/TypeScript spread syntax; the two intentionally deferred boundaries are documented above.

---
*Phase: 01-pinned-local-comparison*
*Completed: 2026-07-20*
