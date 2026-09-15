---
phase: 07-github-familiar-review-surfaces
plan: "02"
subsystem: ui
tags: [vue, monaco, playwright, chromium, inline-comments, accessibility]

requires:
  - phase: 06-monaco-diff-semantics
    provides: paired Monaco anchor zones, independent source-line rails, and geometry regression helpers
  - phase: 07-github-familiar-review-surfaces
    provides: local UiIcon and PathText presentation primitives
provides:
  - compact inline composer and accepted-comment conversation cards
  - typed icon-plus-label lifecycle and anchor badges
  - production Chromium coverage for inline validation, pending, failure, lifecycle, focus, and paired-zone geometry
affects: [07-03, 07-04, 07-05, 07-06, 08-accessibility-responsive-continuity]

tech-stack:
  added: []
  patterns: [presentation-only review-state badges, card content inside one paired Monaco zone, scoped real-Monaco browser locators]

key-files:
  created:
    - src/web/components/ui/ReviewStateBadge.vue
  modified:
    - src/web/components/CommentComposer.vue
    - src/web/components/DiffWorkspace.vue
    - src/web/styles.css
    - tests/integration/anchored-workspace.spec.ts

key-decisions:
  - "Keep lifecycle and verified-anchor meanings as separate visible badges while the Phase 06 source-line rail remains authoritative."
  - "Exercise Escape from the focused composer field so the existing keyboard route, focus recovery, and card-local action scope are observed accurately."

patterns-established:
  - "Accepted comment headings use a card-scoped structural locator in production Monaco zones; card actions are scoped to their footer region."
  - "A schema-valid resolved draft fixture provides lifecycle coverage without client-synthesizing an accepted comment."

requirements-completed: [REVW-02]
duration: recovery
completed: 2026-07-28
status: complete
---

# Phase 07 Plan 02: Inline Conversation Cards Summary

**Compact composer and accepted-comment cards now expose fixed anchor identity, separate lifecycle and verification badges, field-adjacent busy and error feedback, and real-Monaco Chromium regression evidence without changing Monaco ownership.**

## Performance

- **Duration:** Recovered across interrupted provider sessions; exact prior-session duration was unavailable.
- **Completed:** 2026-07-28
- **Tasks:** 2/2
- **Files modified:** 5

## Accomplishments

- Added the typed, presentation-only `ReviewStateBadge` and structured composer/accepted-comment conversation-card anatomy inside the existing paired view zone.
- Kept filename, Base/Head line identity, fixed-anchor explanation, lifecycle, verified anchor, source-line rail, persistence boundary, and focus ownership independent.
- Added production Chromium coverage for ready, validation, delayed persistence failure, pending feedback, Escape recovery, accepted Open and Resolved cards, scoped card locators, and paired Monaco geometry.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build typed review badges and conversation-card anatomy** — `2b95a41` (feat)
2. **Task 2: Prove inline lifecycle, failure, cleanup, and Monaco geometry in Chromium** — `457be3e` (test)

## Files Created/Modified

- `src/web/components/ui/ReviewStateBadge.vue` — closed, visible icon-label badge vocabulary for lifecycle and anchor meaning.
- `src/web/components/CommentComposer.vue` — conversation-card identity punctuation compatible with safe `PathText` display.
- `src/web/components/DiffWorkspace.vue` — accepted-card rendering within the existing single annotation root and paired-zone lifecycle.
- `src/web/styles.css` — stable box sizing for wrapped card action content.
- `tests/integration/anchored-workspace.spec.ts` — production Vite/Monaco coverage for conversation states, lifecycle cards, and geometry invariants.

## Decisions Made

- Preserved the exact `setAnchorZoneHeight(Math.max(280, contentHeight + 16))` path, one zone root, one counterpart spacer, and existing canonical persistence response as the acceptance boundary.
- Seeded the Resolved browser fixture as a valid persisted draft record, including its canonical resolved timestamp and unique anchor, so browser coverage remains server-backed rather than client-synthesized.

## Verification

- `npm run test:browser -- tests/integration/anchored-workspace.spec.ts --grep "inline comment persistence|async comment settlement|Phase 07 inline conversation states|no-reflow Monaco semantic channels"` — passed: 7 tests.
- The same focused command with `--headed` — passed: 7 tests, including the inherited representative-width path through 640px.
- Task commits touch only `CommentComposer.vue`, `DiffWorkspace.vue`, `ReviewStateBadge.vue`, `styles.css`, and `anchored-workspace.spec.ts`; no API, schema, persistence, workspace model/event, Monaco adapter, package, or lockfile file changed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected browser state locators and keyboard setup.**
- **Found during:** Task 2 recovery
- **Issue:** The recovered test activated Escape from the destructive confirmation control, which follows the global Escape path rather than the existing composer-field route. Its accepted heading and footer action locators also relied on inaccessible or overly broad scopes in a live Monaco zone.
- **Fix:** Scoped the destructive action to the card footer, focused the composer textarea before Escape, and used the structural accepted-card heading locator.
- **Files modified:** `tests/integration/anchored-workspace.spec.ts`
- **Verification:** The focused headless and headed Chromium commands passed all 7 selected tests.
- **Committed in:** `457be3e`

**2. [Rule 1 - Bug] Made the Resolved lifecycle fixture canonical-draft valid.**
- **Found during:** Task 2 recovery
- **Issue:** The initial Resolved fixture lacked the required `resolvedAt` timestamp and collided with the accepted comment's durable anchor key; adding draft-view-only verification data to the canonical mutation result also violated its strict schema.
- **Fix:** Seeded one valid resolved draft comment with `resolvedAt` and a distinct anchor key; `draftView()` continues to attach its verified view data.
- **Files modified:** `tests/integration/anchored-workspace.spec.ts`
- **Verification:** Real Chromium rendered the separate Resolved card and retained paired-zone geometry.
- **Committed in:** `457be3e`

---

**Total deviations:** 2 auto-fixed (2 Rule 1 test/fixture correctness fixes).
**Impact on plan:** Required to make the intended real-browser coverage truthful; no product mechanics, persistence contract, adapter API, or scope changed.

## Issues Encountered

- Recovery began from Task 1 commit `2b95a41` plus uncommitted Task 2 work after two provider failures. Task 1 was preserved unchanged; only the three recovered Task 2 files were staged for `457be3e`.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Later review-surface plans can reuse the card, badge, and scoped real-Monaco assertion patterns while preserving the existing source-line rail and paired-zone authority.
- Phase 08 still owns milestone-wide narrow-layout, forced-colors, grayscale, and 400%-zoom proof.

## Self-Check: PASSED

---
*Phase: 07-github-familiar-review-surfaces*
*Completed: 2026-07-28*
