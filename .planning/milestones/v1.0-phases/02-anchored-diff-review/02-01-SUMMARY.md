---
phase: 02-anchored-diff-review
plan: 01
subsystem: monaco-diff-stability
tags: [monaco-editor, vite, vue, playwright, chromium, anchored-comments]

requires:
  - phase: 01-pinned-local-comparison
    provides: Pinned opaque file capabilities, immutable file availability, secured loopback session, and responsive Vue workspace seams
provides:
  - Exact monaco-editor 0.55.1 Vite worker and language configuration
  - Public-API side-by-side read-only diff anchor adapter with bounded disposable lifecycle
  - Production-shaped real Chromium stability proof for paired comment zones and context restoration
affects: [02-02-anchor-contract, 02-04-workspace-state, 02-05-review-workspace, 02-07-comment-ui]

tech-stack:
  added: [monaco-editor@0.55.1]
  patterns:
    - Monaco workers are selected through Vite ESM worker imports and public MonacoEnvironment.getWorker routing
    - Comment identity remains file ID, editor side, and model line; geometry and view-zone IDs remain disposable layout details

key-files:
  created:
    - src/web/monaco/configure.ts
    - src/web/monaco/diff-adapter.ts
    - src/web/monaco/line-mapping.ts
    - src/web/prototypes/MonacoStabilityPrototype.vue
    - tests/integration/monaco-anchor.spec.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Approved and installed exactly monaco-editor@0.55.1 only after reconciling executed Phase 1 seams and completing its registry provenance audit."
  - "Use Monaco 0.55.1 published APIs for worker routing, diff editor lifecycle, line changes, view zones, and hidden unchanged regions; private editor internals are forbidden."

patterns-established:
  - "Diff adapter: replace disposable models, zones, decorations, and listeners as one bounded lifecycle while preserving anchors by side/model-line identity."
  - "Browser proof: real Chromium geometry and lifecycle assertions, not screenshots or mocked editor APIs, gate later review-workspace plans."

requirements-completed: [DIFF-02, DIFF-03, DIFF-04, DIFF-05, DIFF-07, CMT-01]

duration: 24min
completed: 2026-07-21
status: complete
---

# Phase 02 Plan 01: Monaco Stability Gate Summary

**A real Monaco 0.55.1 side-by-side prototype now preserves opaque side/model-line comment anchors across diff recomputation, context changes, resizing, and file restoration under focused Chromium proof.**

## Performance

- **Duration:** 24 min
- **Tasks:** 3 (one approved no-edit audit checkpoint; RED and GREEN implementation tasks)
- **Files modified:** 8

## Accomplishments

- Reconciled all Phase 1 summaries and the current implementation before editing: the Vue workspace, opaque capability DTOs, bearer client, Fastify security boundary, immutable object reader, metadata pane, styles, and Chromium test configuration are implemented seams rather than planned-only paths.
- Audited and approved exact `monaco-editor@0.55.1`: MIT, Microsoft Monaco repository, Microsoft-maintained publisher set, no Node engine restriction or install lifecycle hooks, signed registry release, and integrity `sha512-jz4x+TJNFHwHtwuV9vA9rMujcZRb0CEilTEwG2rRSpe/A7Jdkuj8xPKttCgOh+v/lkHy7HsZ64oj+q3xoAFl9A==`.
- Added the missing focused `test:browser` command, production Vite ESM worker/language configuration, a reusable public-API adapter and mapping layer, and a production-shaped prototype.
- Proved ten focused real-Chromium scenarios covering rendered Monaco, pair alignment, public unchanged-region controls, resize, reveal/restore, A→B→A restoration, keyboard/pointer parity, navigation, repeated swaps/recomputation, and bounded model/zone/listener disposal.

## Task Commits

1. **Task 1: Audit implemented Phase 1 seams and approve the exact Monaco release** — approved checkpoint; no repository edit by design.
2. **Task 2: Reconcile approved Phase 1 seams, install Monaco, wire production workers, and establish RED** — `2e3b5f6` (`test(02-01): establish Monaco stability red`)
3. **Task 3: Implement and pass the blocking Monaco adapter prototype** — `8d91429` (`feat(02-01): stabilize Monaco diff anchors`)

## Verification Evidence

- `npm ls monaco-editor@0.55.1 --depth=0` passed and resolved the exact approved release.
- `npm run build` passed before the behavioral RED.
- RED: `npm run test:browser -- tests/integration/monaco-anchor.spec.ts` rendered real Chromium Monaco and failed only the named `Monaco stability: paired-zone top alignment after real diff render` assertion with the intentional missing implementation state.
- GREEN: the same focused command passed all ten real-Chromium scenarios in 12.7 seconds.

## Files Created/Modified

- `src/web/monaco/configure.ts` — Vite ESM worker routing and path-to-language selection with plaintext fallback.
- `src/web/monaco/diff-adapter.ts` — long-lived public Monaco diff lifecycle, paired anchor zones, and bounded disposal.
- `src/web/monaco/line-mapping.ts` — model-coordinate counterpart mapping used only for layout.
- `src/web/prototypes/MonacoStabilityPrototype.vue` — production-shaped read-only side-by-side proof surface.
- `tests/integration/monaco-anchor.spec.ts` — mandatory focused real-browser stability contract.
- `package.json` and `package-lock.json` — exact Monaco dependency and focused browser command.

## Decisions Made

- Retain only stable semantic anchor identity (opaque file identity, side, and model line); pixels, rendered rows, view-zone IDs, and listener handles are disposable implementation state.
- Keep public unchanged-region controls configured to preserve three context lines, collapse runs of at least eight lines, and use bounded reveal behavior.

## Deviations from Plan

None - plan executed exactly as written. The missing `test:browser` command was discovered during the mandated current-source reconciliation and added as the required focused browser seam before the behavioral RED.

## Issues Encountered

None. The planned RED was a real rendered-editor behavioral failure, not a Vite, dependency, or test-discovery failure.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 02-02 and 02-04 may consume the proven public Monaco adapter and mapping seams.
- The mandatory stability gate passed; no fallback layout is required.

## Self-Check: PASSED

- Required Monaco configuration, adapter, mapping, prototype, and focused Chromium contract artifacts exist.
- RED commit `2e3b5f6` precedes GREEN commit `8d91429`.
- The exact dependency, production build, and ten-scenario focused Chromium GREEN contract passed.

---
*Phase: 02-anchored-diff-review*
*Completed: 2026-07-21*
