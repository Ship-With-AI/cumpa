---
phase: 02-anchored-diff-review
plan: 04
subsystem: workspace-interaction-state
tags: [vitest, monaco-editor, workspace-state, immutable-anchors, tdd]
requires:
  - phase: 02-anchored-diff-review
    provides: Public Monaco diff adapter and immutable side/model-line anchor contract
provides:
  - Session-only per-opaque-file workspace state transitions
  - Ordered commands for file/change navigation, composer persistence, and comment reveal
  - Focused transition and diff-boundary behavior contracts
affects: [02-05-review-workspace, 02-06-comment-ui, 02-07-browser-flow]
tech-stack:
  added: []
  patterns:
    - Pure workspace transitions emit imperative commands without DOM or Monaco view-zone identity
    - Opaque file IDs, side, and model line are the complete in-memory interaction coordinates
key-files:
  created:
    - src/web/model/workspace-state.ts
    - tests/unit/workspace-state.test.ts
    - tests/unit/line-mapping.test.ts
  modified:
    - src/web/monaco/diff-adapter.ts
key-decisions:
  - "Keep scroll, focus, context, and composer records in a browser-memory fileId map; repository draft payloads contain only accepted comments."
  - "Use one typed command stream for public Monaco effects and composition-owned persistence or DOM focus effects."
patterns-established:
  - "Workspace transitions: immutable-coordinate events return next state plus ordered commands."
requirements-completed: [DIFF-04, DIFF-05, DIFF-07, CMT-01]
duration: 7min
completed: 2026-07-21
status: complete
---

# Phase 02 Plan 04: Session-only Anchored Workspace Transitions Summary

**Pure per-file workspace state restores immutable-coordinate interaction state only after diff readiness and emits explicit Monaco, persistence, and focus commands.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-07-21T11:20:00Z
- **Completed:** 2026-07-21T11:26:54Z
- **Tasks:** 3 completed
- **Files modified:** 4

## Accomplishments

- Added a typed, in-memory state machine keyed exclusively by opaque file ID, side, and model line.
- Covered switching, cancellation, explicit persistence outcomes, navigation, reveal ordering, and counterpart-boundary behavior through focused unit contracts.
- Kept public Monaco layout, next/previous change, and model-line reveal actions behind a narrow imperative adapter seam.

## Task Commits

| Task | TDD stage | Commit | Result |
| --- | --- | --- | --- |
| Task 1: Specify session state, composer, navigation, and acceptance transitions | RED | `659a22a` | Focused command failed nonzero because `workspace-state` did not yet exist. |
| Task 2: Implement immutable-coordinate session transitions | GREEN | `fef0e11` | Focused command passed: 6 files, 50 tests. |
| Task 3: Separate pure state from imperative adapter commands | REFACTOR | — | Reviewed the GREEN split; no behavior-free production edit was necessary. The identical focused command remained green. |

## Transition Contract

| Transition | State result | Ordered effects |
| --- | --- | --- |
| File switch then diff-ready | Snapshot remains in the outgoing file record; incoming state becomes ready only after its diff-ready event | `load-file` → `restore-view` → rebuild annotations → reveal/focus model line |
| Line activation | Exact verified side/line focuses its canonical comment; otherwise opens or moves the per-file composer | rebuild annotations or focus canonical comment |
| Empty/non-empty cancel | Empty draft closes; non-empty draft enters confirmation; Escape from confirmation keeps text | Focus gutter only after empty close |
| Add | Whitespace stays ready with validation; pending remains unaccepted; failure/duplicate preserve text; canonical success consumes the composer | `persist-comment` → canonical focus on success or existing-comment focus on duplicate |
| File/change navigation | File order uses the supplied deterministic reviewable leaf sequence; change movement does not recreate models | `load-file` or public `go-to-change` |
| Show verified comment | Stale/orphan records do not navigate or decorate inline | switch/load → diff-ready → reveal context → rebuild zones → center → focus → announce |

## Effect Ordering and Adapter Linkage

`src/web/model/workspace-state.ts` owns transition state and returns typed command objects. `applyMonacoWorkspaceCommand` in `src/web/monaco/diff-adapter.ts` executes only the public Monaco operations: `layout`, public next/previous diff navigation, and immutable-anchor reveal. Persistence and DOM focus remain composition effects, so no Monaco private fields, rendered rows, pixels, viewport values, DOM IDs, or view-zone IDs are state authority.

## Session-only Proof

- The state record contains only opaque file ID map entries, scroll position, focused side/model line, context mode, composer data, accepted comments, and a transient reveal target.
- `toRepositoryDraft()` returns only accepted comments; it excludes view, context, focus, and composer state.
- The state module contains no `localStorage`, `sessionStorage`, `IndexedDB`, viewport, pixel, DOM, or view-zone reference.

## Verification Evidence

| Stage | Command | Result |
| --- | --- | --- |
| RED | `npm run test:unit -- tests/unit/workspace-state.test.ts tests/unit/line-mapping.test.ts` | Nonzero as required: module `src/web/model/workspace-state.js` was absent. |
| GREEN | `npm run test:unit -- tests/unit/workspace-state.test.ts tests/unit/line-mapping.test.ts` | PASS — 6 files, 50 tests. |
| REFACTOR | `npm run test:unit -- tests/unit/workspace-state.test.ts tests/unit/line-mapping.test.ts` | PASS — unchanged focused command, 6 files, 50 tests. |
| Memory-only guard | `grep 'localStorage|sessionStorage|indexedDB|viewZone|pixel|viewport|DOM' src/web/model/workspace-state.ts` | PASS — no matches. |
| TDD ordering | `git log --grep='^test(02-04)'` followed by `git log --grep='^feat(02-04)'` | PASS — `659a22a` precedes `fef0e11`. |

No formatter, linter, browser suite, API suite, or project-wide test suite was run.

## Decisions Made

- State stores exact side/model-line facts and never uses Monaco layout identities as comment identity.
- Diff readiness gates restore effects so A→B→A does not restore into incomplete immutable models.
- The adapter seam executes only documented public Monaco actions; all other commands remain pure composition contracts.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The RED command failed solely because the planned production module did not yet exist.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- UI composition may consume `WorkspaceController` transitions and dispatch its typed commands after immutable content models report ready.
- Comment UI may render only verified records inline and leave stale/orphan records rail-only as the state machine requires.

## Self-Check: PASSED

- All four declared implementation/test artifacts exist.
- RED commit `659a22a` precedes GREEN commit `fef0e11`.
- GREEN and unchanged REFACTOR focused unit commands passed.
- No unplanned persistence, network, schema, or trust-boundary surface was introduced.

---
*Phase: 02-anchored-diff-review*
*Completed: 2026-07-21*
