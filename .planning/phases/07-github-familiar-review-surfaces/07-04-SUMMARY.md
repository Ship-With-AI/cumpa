---
phase: 07-github-familiar-review-surfaces
plan: "04"
subsystem: ui
tags: [vue, css, playwright, accessibility, notices, summary]

requires:
  - phase: 07-github-familiar-review-surfaces
    provides: framed review rail, transient selection treatment, local UiIcon, ReviewStateBadge, and localized lifecycle busy feedback
provides:
  - shared full-notice icon, heading/content, and structural-edge language across neutral, information, success, warning, and error states
  - explicit FileMetadataPane availability and retry-error headings with unchanged retry and safe-text behavior
  - framed Summary status badges, selected tabs, field wiring, localized save progress, and error/retained feedback
  - focused Chromium evidence for notice, selector-drift, metadata, Summary, keyboard, and focus contracts
affects: [07-05, 07-06, 08-accessibility-responsive-continuity]

tech-stack:
  added: []
  patterns: [closed notice tone-to-icon mapping, raw-notice icon/content anatomy for ref-preserving roots, localized action busy state, field-adjacent summary feedback]

key-files:
  created: []
  modified:
    - src/web/components/InlineNotice.vue
    - src/web/components/FileMetadataPane.vue
    - src/web/components/ReviewPanel.vue
    - src/web/components/SelectorDriftNotice.vue
    - src/web/components/SummarySection.vue
    - src/web/styles.css
    - tests/e2e/review-panel-resolved.spec.ts
    - tests/e2e/pinned-session.spec.ts

key-decisions:
  - "Map neutral and information notices to the same fixed information glyph and structural edge; pending remains a spinner plus the existing action-specific status text."
  - "Keep raw ReviewPanel and selector-drift notice roots in place, adding only decorative icon/content children so their role, refs, and focus ownership remain authoritative."
  - "Represent Summary state with the existing presentation-only ReviewStateBadge and local field IDs rather than adding summary state."

patterns-established:
  - "Full notices expose a decorative 16px glyph, visible state heading, min-width-zero content column, and 3px inline-start edge regardless of tint availability."
  - "Only the initiating summary save control receives spinner and aria-busy feedback; disabled sibling controls remain visually non-busy."

requirements-completed: [REVW-04]
duration: 5min
completed: 2026-07-28
status: complete
---

# Phase 07 Plan 04: Non-Color Status Language Summary

**Shared notices, pinned-source drift, file metadata, and Summary now pair visible labels and fixed local glyphs with structural edges while retaining their existing review, retry, focus, and persistence semantics.**

## Performance

- **Duration:** 5 min from the first task commit.
- **Started:** 2026-07-28T08:16:11Z
- **Completed:** 2026-07-28T08:20:47Z
- **Tasks:** 2/2
- **Files modified:** 8

## Accomplishments

- Expanded the closed full-notice vocabulary to neutral, information, success, warning, and error, with fixed decorative SVGs, content anatomy, wrapping, and a non-color leading edge.
- Preserved ReviewPanel conflict/failure and pinned selector-drift roots while giving metadata retry, text, unsupported, and unavailable states explicit headings.
- Framed Summary feedback through visible icon-label badges, selected tabs, textarea support and feedback IDs, local save progress, and retained/error notice structure.
- Added focused Chromium scenarios for notice roles, headings, focus, icons, edges, metadata state branches, save busy state, keyboard tabs, confirmation recovery, and retained buffers.

## Task Commits

Each task was committed atomically:

1. **Task 1: Normalize full notices and FileMetadataPane states without changing roles, refs, or retry actions** — `c2b39cd` (feat)
2. **Task 2: Complete Summary selected, field, pending, and failure states** — `d25dee1` (feat)

## Files Created/Modified

- `src/web/components/InlineNotice.vue` — closed tone union and fixed decorative glyph mapping around authoritative slot content.
- `src/web/components/FileMetadataPane.vue` — explicit retry-error and availability headings with the existing retry, loading, and safe-text behavior.
- `src/web/components/ReviewPanel.vue` — icon/content anatomy for the existing conflict and operation-failure roots.
- `src/web/components/SelectorDriftNotice.vue` — warning anatomy without changing pinned-comparison behavior.
- `src/web/components/SummarySection.vue` — status badge, selected tabs, field feedback wiring, localized save progress, and structured retained/failure notices.
- `src/web/styles.css` — shared full-notice, wrapping, Summary, feedback, and busy-control presentation hooks.
- `tests/e2e/review-panel-resolved.spec.ts` — mounted notice and Summary browser evidence.
- `tests/e2e/pinned-session.spec.ts` — generated-package availability coverage plus mounted FileMetadataPane state evidence.

## Decisions Made

- Notice tones remain presentation-only mappings from existing branches; no pending notice tone, new live region, or state reducer was introduced.
- The Summary badge reports the existing computed status while save progress stays limited to the primary Save summary control.
- FileMetadataPane remains a presentation target; retry authority, disabled state, and content capability requests remain unchanged.

## Verification

- `npm run test:browser -- tests/e2e/review-panel-resolved.spec.ts --grep "Phase 07 notice status language"` — passed: 1 test.
- `node node_modules/@playwright/test/cli.js test --config=playwright.config.ts tests/e2e/pinned-session.spec.ts --grep "metadata and availability states"` — passed: 1 Chromium test.
- `npm run test:browser -- tests/e2e/review-panel-resolved.spec.ts` — passed: 2 tests.
- Repeated the focused notice, metadata, and full Summary browser checks with `--headed` — passed.
- `git diff --name-only c2b39cd^..HEAD` — exactly the eight plan-declared Vue, CSS, and browser-test files; no API, schema, persistence, package, or lockfile file changed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Aligned the existing generated-package metadata test with the already-shipped grouped header.**
- **Found during:** Task 1 focused Chromium verification.
- **Issue:** The existing scenario expected only the effective renamed path and used ambiguous Base/Head text locators, while the preceding Phase 07 grouped header now correctly exposes the old-to-new path relationship and two visible Base/Head labels.
- **Fix:** Updated the scenario to assert the shipped renamed-path heading and scope Base/Head assertions to the context header.
- **Files modified:** `tests/e2e/pinned-session.spec.ts`
- **Verification:** The configured generated-package Chromium scenario passed headless and headed.
- **Committed in:** `c2b39cd`

---

**Total deviations:** 1 auto-fixed (1 Rule 3 blocking test correction).
**Impact on plan:** The correction made the plan-required production test assert the current shipped header without changing production behavior or scope.

## Issues Encountered

- The documented `npm run test:browser -- tests/e2e/pinned-session.spec.ts --grep "metadata and availability states"` command passes `--config=tests`, which leaves the Playwright project unnamed and trips that scenario's Chromium prerequisite. The same focused test passed with the repository's `playwright.config.ts` through the checked-in Playwright CLI.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 07-05 and 07-06 can use the shared notice and Summary status anatomy without changing review authority or pending semantics.
- Phase 08 still owns milestone-wide forced-colors, grayscale, narrow-layout, and 400%-zoom validation.

## Self-Check: PASSED

- Summary exists at `.planning/phases/07-github-familiar-review-surfaces/07-04-SUMMARY.md`.
- Task commits `c2b39cd` and `d25dee1` exist in git history.
