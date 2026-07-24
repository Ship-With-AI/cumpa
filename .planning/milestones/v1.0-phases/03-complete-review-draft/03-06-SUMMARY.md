---
phase: 03-complete-review-draft
plan: 06
subsystem: selector-drift
tags: [native-git, fastify, zod, vue, playwright, pinned-comparison]
requires:
  - phase: 03-complete-review-draft
    provides: reconciled Phase 03 command ledger and immutable pinned comparison session
provides:
  - server-retained native-Git selector observation for branch and registered-worktree sources
  - fixed, token-protected selector-drift API with safe unavailable states
  - visible-only browser drift polling and pinned-identity warning UI
affects: [selector-drift, review-draft, launch-selection, packaged-acceptance]
tech-stack:
  added: []
  patterns: [retained-launch-descriptor, fixed-no-body-browser-capability, visible-coalesced-read-only-polling]
key-files:
  created:
    - src/git/selector-drift.ts
    - src/web/model/selector-drift-state.ts
    - src/web/components/SelectorDriftNotice.vue
    - tests/git/selector-drift.test.ts
    - tests/api/selector-drift.test.ts
    - tests/integration/selector-drift-ui.spec.ts
  modified:
    - src/contracts/api.ts
    - src/server/capabilities.ts
    - src/server/routes.ts
    - src/web/api/client.ts
    - src/web/App.vue
key-decisions:
  - Retain launch descriptors server-side and re-resolve only exact branch refs or registered worktree HEADs through native Git argument arrays.
  - Treat re-resolution errors, deleted worktrees, malformed output, and unavailable sources as the bounded `source-unavailable` state without stderr, paths, or a fabricated current OID.
  - Poll only while visible, coalesce overlap, and keep drift state isolated from the pinned comparison, draft, Monaco, anchor, and local editor buffers.
patterns-established:
  - Fixed capability client methods carry no browser-selected repository, ref, worktree, path, or OID authority.
  - Drift UI always identifies the original full pinned OID and gives relaunch-only recovery guidance.
requirements-completed: [DRFT-06]
completed: 2026-07-22
status: complete
---

# Phase 03 Plan 06: Selector Drift Summary

**Pinned comparisons now independently observe retained branch/worktree selectors and visibly report movement without changing the open review.**

## Accomplishments

- Added strict selector-drift API contracts and a server-owned observer that uses fixed native-Git argument arrays, full commit OIDs, and retained launch descriptors only.
- Added the fixed no-body/no-query browser capability, visible-only coalesced poll state, and a pinned-identity notice with copyable full OIDs and explicit relaunch guidance.
- Proved branch/worktree movement, detached worktree movement, dirty-byte immunity, unavailable sources, security-first route rejection, browser request shape, polling visibility, focus preservation, and unsaved-buffer preservation.

## Task Commits

1. **Task 1 RED — server selector drift coverage** — `bcefe72` (`test(03-06): add failing selector drift tests`)
2. **Task 1 GREEN — retained selector observation** — `c3c3ee8` (`feat(03-06): observe retained selector drift`)
3. **Task 2 RED — browser selector drift coverage** — `38905a8` (`test(03-06): add failing selector drift UI coverage`)
4. **Task 2 GREEN — pinned selector drift UI** — `475959a` (`feat(03-06): surface pinned selector drift`)

## Server Observation Matrix

| Retained source pair | Observed behavior |
|---|---|
| branch / branch | Exact full ref is re-resolved with `git rev-parse --verify --end-of-options <full-ref>^{commit}`; movement is reported with old and new full OIDs. |
| branch / worktree | Branch uses the retained full ref; registered worktree uses `git worktree list --porcelain -z` and its retained exact path. |
| worktree / branch | Worktree `HEAD` and branch ref are re-resolved independently without browser inputs. |
| worktree / worktree | Both retained registered worktree paths are independently observed, including detached `HEAD` movement. |
| dirty worktree | Uncommitted bytes do not alter the observed commit or the pinned comparison. |
| deleted/unregistered source | Returns `{ kind: "unavailable", reason: "source-unavailable" }`; it contains the old pinned OID, never a made-up current OID or diagnostics. |

The strict contract requires full 40-hex OIDs. For example, the browser assertion exposes the complete pinned base `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` and changed base `dddddddddddddddddddddddddddddddddddddddd`, not abbreviated identities.

## Browser Polling Timeline

1. After the pinned session loads, the client calls only fixed `GET /api/selector-drift` with no query or body.
2. The state owner starts one visible interval and a `visibilitychange` listener; hidden documents neither start nor continue requests.
3. An overlap is coalesced behind the active request, with at most one trailing visible refresh.
4. A newly moved or unavailable status, or a different full current OID, announces once: `Selected source changed. The open review remains pinned.` Repeated equivalent results do not announce again.
5. The notice independently lists Base and Head movement/unavailability, full pinned/current OIDs where available, safe source type/label, copy actions, and only the `Launch new comparison` terminal guidance.
6. Polling never writes comparison identity, draft canonical state, Monaco state, anchors, or editor buffers; the browser check retains focus and an unsaved summary through updates.

## API and Authority Boundary

- `GET /api/selector-drift` is capability-authenticated before invoking the observer. Unexpected Host/Origin, query input, and body input are rejected before any Git call.
- The browser client has no API that accepts repository, ref, worktree path, selector, OID, comparison key, draft path, or anchor facts.
- The observer maps Git failures to a bounded unavailable state and never exposes stderr, stack text, absolute paths, or an unverified identity.
- The UI owner is `src/web/App.vue`; the existing identity-header component is `IdentityHeader.vue` rather than the plan shorthand `PinnedComparisonHeader.vue`.

## Verification

All verification used only reconciliation-ledger commands:

- **Task 1 RED:** `03-06-task-1-git-api` exited 1 because `src/git/selector-drift.js` did not yet exist, establishing the intended missing behavior.
- **Task 1 GREEN:** `03-06-task-1-git-api` passed: `npm run test:git -- tests/git/selector-drift.test.ts` reported 7 files / 30 tests and `npm run test:api -- tests/api/selector-drift.test.ts` reported 11 files / 76 tests.
- **Task 2 RED:** `03-06-task-2-drift-ui` exited 1 because `src/web/model/selector-drift-state.js` did not yet exist, establishing the intended missing UI behavior.
- **Task 2 GREEN:** `03-06-task-2-drift-ui` passed: `npm run test:browser -- tests/integration/selector-drift-ui.spec.ts` reported 2 passed tests.

## Deviations from Plan

None — plan behavior and the reconciliation ledger were followed. The browser fixture was completed with the existing required draft `missing.path` field so its test session remained schema-valid.

## Issues Encountered

The initial Task 2 fixture omitted the required safe relative `path` on the existing `DraftLoadResponse` `missing` variant, which correctly caused the existing client schema validation to display the unavailable surface. Adding the contract-required fixture field restored the intended browser route; the focused ledger check passed afterward.

## Next Phase Readiness

- Later Phase 03 and packaged acceptance work can rely on a strict fixed selector-drift endpoint and a visible, read-only pinned-comparison warning.
- No dependency, setup, or unresolved blocker was introduced.

---
*Phase: 03-complete-review-draft*
*Completed: 2026-07-22*
