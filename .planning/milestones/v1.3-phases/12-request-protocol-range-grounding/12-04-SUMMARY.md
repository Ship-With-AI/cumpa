---
phase: 12-request-protocol-range-grounding
plan: 04
subsystem: draft-persistence
tags: [typescript, zod, fastify, drafts, range-scope, vitest]
requires:
  - phase: 12-request-protocol-range-grounding
    plan: 02
    provides: Immutable range review keys and frozen ordered pathspec provenance
  - phase: 12-request-protocol-range-grounding
    plan: 03
    provides: Production range sessions carrying frozen comparison scope
provides:
  - Range drafts keyed by the server-derived ordered-scope review key
  - Strict persisted range provenance matched to draft comparison endpoints
  - Pair-only interactive draft compatibility and production range-store wiring
affects: [12-05, 12-06, attached-review-drafts]
tech-stack:
  added: []
  patterns:
    - One persisted draft contract with an optional complete frozen range scope
    - Explicit range and pair-only composition branches feeding one loader/store pipeline
key-files:
  created: []
  modified:
    - src/contracts/draft.ts
    - src/contracts/api.ts
    - src/server/app.ts
    - src/server/capabilities.ts
    - src/server/draft-loader.ts
    - src/server/draft-store.ts
    - tests/unit/draft-load.test.ts
    - tests/api/draft.test.ts
key-decisions:
  - "Range drafts use only frozen range.reviewKey while interactive drafts retain comparisonKey paths."
  - "Interactive DraftComparison objects omit range entirely; range provenance is strict and endpoint-matched."
patterns-established:
  - "Draft range identity is validated both as strict persisted provenance and against the server-held frozen comparison."
requirements-completed: [RANGE-03]
duration: 6min
completed: 2026-08-04
status: complete
---

# Phase 12 Plan 04: Scoped Range Draft Ownership Summary

**Frozen ordered range scope now owns its draft path, serialized mutation queue, and persisted immutable provenance without changing interactive pair-only draft bytes.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-08-04T19:36:00Z
- **Completed:** 2026-08-04T19:42:52Z
- **Tasks:** 3/3
- **Files modified:** 8

## Accomplishments

- Bound range draft paths and serialized queue keys to the server-held 64-hex review key, preventing ordered-pathspec collisions for identical OIDs.
- Persisted and strictly validated full frozen range provenance, including endpoint consistency and exact pathspec order.
- Wired production `createSessionApp -> createAppDraftStore -> createDraftStore` and direct capability fallback while retaining exact pair-only interactive construction.

## Task Commits

| Task | Commit | Outcome |
| --- | --- | --- |
| 1. RED — specify scoped draft paths, provenance, resume, and isolation | `7054859` | Focused command exited 1 with eight intended scoped-path/provenance/isolation failures after a test-fixture syntax correction. |
| 2. GREEN — key range drafts by exact frozen scope | `58d5903` | Focused command exited 0: 2 files, 25 tests passed. |
| 3. REFACTOR — keep one draft identity and parse path | `e8442df` | No-op refactor: direct conditional composition preserves one loader/store path; focused command exited 0. |

## Files Created/Modified

- `src/contracts/draft.ts` — adds optional strict range draft provenance and endpoint consistency validation.
- `src/contracts/api.ts` — permits validated range provenance in the public current-draft view.
- `src/server/draft-loader.ts` — selects the range review key and performs exact range comparison validation.
- `src/server/draft-store.ts` — carries optional frozen range scope so its existing path-derived queue remains scoped.
- `src/server/app.ts` — passes frozen range scope through the production draft-store composition root.
- `src/server/capabilities.ts` — applies the same pair-only/range conditional in its direct fallback.
- `tests/unit/draft-load.test.ts` — covers ordered-scope keys, provenance acceptance, invalid provenance, and preserved raw bytes.
- `tests/api/draft.test.ts` — covers production range isolation/resume, pair-only persisted bytes, and rejected client authority.

## Scoped Identity and Compatibility Evidence

- Same full OIDs plus reordered pathspecs produce distinct `rangeReviewKey` paths and independent mutation queues; identical ordered scopes reopen revision 1 with their exact stored provenance.
- Range drafts reject missing, partial, malformed, unknown, reordered, and mismatched scope data as `schemaInvalid`, retaining the original bytes and fingerprint.
- Interactive drafts retain `.cumpa/drafts/${comparisonKey(baseOid, headOid)}.json` and persisted comparison objects with no `range` member.
- API mutation bodies with `reviewKey`, `path`, endpoint OIDs, `label`, or `pathspecs` are rejected with 400 before any draft write.

## Verification

- **RED:** `npm exec -- vitest run tests/unit/draft-load.test.ts tests/api/draft.test.ts` exited 1 with eight intended range-draft contract failures: seven loader/provenance failures and one production range-path failure.
- **GREEN:** the identical command exited 0 with 25 tests passing.
- **REFACTOR:** the identical command exited 0 with 25 tests passing.

## Decisions Made

- Use the existing range review key as the only range persistence namespace rather than recomputing scope or introducing a second store.
- Keep the public draft view schema aligned with the strict persisted draft schema so production range reloads remain representable.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test correctness] Corrected range review-key fixture arguments.**
- **Found during:** Task 2 (GREEN)
- **Issue:** New tests passed request labels to the existing three-argument `rangeReviewKey`, causing distinct pathspec scopes to share a test key.
- **Fix:** Passed only base OID, head OID, and the exact ordered pathspec array.
- **Files modified:** `tests/unit/draft-load.test.ts`, `tests/api/draft.test.ts`
- **Verification:** The focused 25-test command passes and the ordered-scope isolation assertions are active.
- **Committed in:** `58d5903`

**2. [Rule 2 - Missing critical functionality] Exposed validated range provenance through the existing draft view schema.**
- **Found during:** Task 2 (GREEN)
- **Issue:** A production range draft reloaded successfully but the strict public `DraftViewSchema` rejected its required range member, returning an unavailable response.
- **Fix:** Added the existing strict `RangeReviewScopeSchema` as an optional draft-view comparison member.
- **Files modified:** `src/contracts/api.ts`
- **Verification:** The production `createSessionApp()` range-resume test passes.
- **Committed in:** `58d5903`

---

**Total deviations:** 2 auto-fixed (1 test correctness, 1 missing critical functionality). **Impact:** Both fixes were required to make the specified range isolation observable; no scope authority or new abstraction was added.

## Issues Encountered

None beyond the auto-fixed fixture and public-schema issues above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 12-05 and 12-06 can consume drafts whose range identity is distinct from interactive pairs and bound to frozen provenance.
- No blocker remains.

## Self-Check: PASSED

- Confirmed RED `7054859`, GREEN `58d5903`, and REFACTOR `e8442df` are the three task commits in order.
- Confirmed the required focused command passed after GREEN and REFACTOR: `npm exec -- vitest run tests/unit/draft-load.test.ts tests/api/draft.test.ts` (2 files, 25 tests).
- Confirmed range path/key, exact provenance, recovery classification, interactive pair-only bytes, production composition-root wiring, and client-authority rejection are all covered by the focused suite.

---
*Phase: 12-request-protocol-range-grounding*
*Completed: 2026-08-04*
