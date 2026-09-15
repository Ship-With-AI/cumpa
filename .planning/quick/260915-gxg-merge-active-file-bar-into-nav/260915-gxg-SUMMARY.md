---
phase: quick
plan: 260915-gxg
subsystem: ui
tags: [vue, css, playwright, accessibility]
requires:
  - phase: v1.6
    provides: existing review toolbar, active-file controls, and responsive review coverage
provides:
  - one review toolbar containing the active heading, metadata, Files toggle, and navigation controls
  - compact one-line renamed heading at narrow width
  - test coverage aligned with the merged toolbar contract
affects: [review-toolbar, responsive-layout, accessibility]
tech-stack:
  added: []
  patterns:
    - slotted active-file controls inside the existing review navigation toolbar
key-files:
  created: [.planning/quick/260915-gxg-merge-active-file-bar-into-nav/260915-gxg-SUMMARY.md]
  modified:
    - src/web/components/ActiveFileToolbar.vue
    - src/web/components/ReviewToolbar.vue
    - src/web/App.vue
    - src/web/styles.css
    - tests/e2e/responsive-session.spec.ts
    - tests/e2e/pinned-session.spec.ts
    - tests/integration/anchored-workspace.spec.ts
key-decisions:
  - "Keep h1#cumpa-heading visible and slotted first in the sole review toolbar."
  - "Use 40% desktop active-file cap with no narrow cap so navigation stays clear of the review overlay while the heading remains visible at 320px."
requirements-completed: [QUICK-260915-GXG]
duration: 16min
completed: 2026-09-15
status: complete
---

# Quick 260915-gxg: Merge Active File Bar Into Navigation Summary

**Merged the visible active-file heading, metadata, and Files toggle into one responsive review toolbar while preserving accessibility and compact renamed-path rendering.**

## Accomplishments

- Removed the duplicate active-file context bar, including Base/Head and Preimage/Postimage endpoint markup.
- Preserved the level-1 heading, full-path title, Files-toggle focus/ARIA behavior, and the three existing navigation groups.
- Updated only affected assertions; added falsifiable 320px heading and desktop toolbar compactness gates.

## Task Commits

1. **Task 1: Merge active-file controls into the review bar** — `8a9fa1c`
2. **Follow-up: Keep review navigation clear of the open review overlay** — `8abde96`
3. **Follow-up: Preserve narrow active-heading visibility** — `928059d`
4. **Task 2: Retarget and remove merged-toolbar assertions** — `d2bb700`
5. **Follow-up: Keep merged toolbar controls compact** — `644f00e`

## Files Changed

- `src/web/components/ActiveFileToolbar.vue` — repurposed as the slotted active-file block; retains the exposed focus methods and Files toggle.
- `src/web/components/ReviewToolbar.vue` — accepts the active-file block through its leading default slot; navigation groups remain unchanged.
- `src/web/App.vue` — renders `ActiveFileToolbar` inside `ReviewToolbar`; keeps `#changed-files` on `v-show`.
- `src/web/styles.css` — removes all legacy bar rules, styles the merged toolbar, truncates heading paths to one line, preserves review-navigation hit-area clearance, and keeps active Files/count controls on one line.
- `tests/e2e/responsive-session.spec.ts` — removes deleted-bar geometry assertions, retargets heading contracts, and bounds the 320px heading plus 1440px toolbar height.
- `tests/e2e/pinned-session.spec.ts` — removes deleted endpoint-context assertions.
- `tests/integration/anchored-workspace.spec.ts` — verifies one bar/heading, identity-header HEAD oid, and permits deliberate internal ellipsis overflow without allowing document overflow.

## Verification

- `npm run typecheck:web` — passed (exit 0).
- `npm run build:web` — passed (exit 0; Vite built in 1.25s; only its existing chunk-size warning appeared).
- `npx playwright test tests/e2e/responsive-session.spec.ts tests/e2e/pinned-session.spec.ts tests/integration/anchored-workspace.spec.ts` — passed: **25 tests in 51.9s**.
  - `responsive-session.spec.ts`: 1 passing test.
  - `pinned-session.spec.ts`: 11 passing tests.
  - `anchored-workspace.spec.ts`: 13 passing tests.
- `grep` search for `active-file-toolbar` across `src/web` and `tests` — no matches.

## Falsifiability Evidence

Temporarily changed only `.review-toolbar__active-file .path-display` from `flex-wrap: nowrap` to `flex-wrap: wrap` and ran the responsive spec. The new `#cumpa-heading` height gate failed at the renamed 320px fixture with **102.5px** observed versus the required `<= 32px`. Restored `nowrap` without committing the temporary change; the final scoped suite passed.

## Desktop Toolbar Compactness

The inherited Files label and `+1 −1` count text wrapped inside the newly shared toolbar, producing a **61px** desktop bar before this follow-up. The fix applies `white-space: nowrap` only to the active Files button and counts; the bar itself still wraps at `<=760px`.

At 1440px the fixed toolbar measures **41px**. The new `<=41px` gate is derived from the heading’s 31.5px line-height plus 4px top padding, 4px bottom padding, and 1px bottom border: **40.5px**, rounded to the rendered 41px. The pre-fix 61px bar exceeds that bound, so this gate fails for the inherited wrapping defect and passes for the fixed compact row.

## Overlay Geometry

The initial `flex: 1 1 auto` implementation pushed File navigation under the open Review rail. At 1440px with the rail open, after changing the active-file block to `flex: 0 1 auto; max-width: 40%`, File navigation ended at **x=710.53125px** and the rail began at **x=1072px**, leaving **361.46875px** of hit-area headroom. The 40% cap applies only above the narrow breakpoint; at `<=760px` it is removed so status/counts/Files do not collapse the visible heading.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 1 - Interaction regression] Prevented review-overlay interception of File navigation**
   - **Found during:** Task 2 verification.
   - **Issue:** The planned `flex: 1 1 auto` active-file block claimed toolbar free space, moving File/Change navigation beneath an open Review panel.
   - **Fix:** Changed it to `flex: 0 1 auto` with a 40% desktop cap; disabled that cap at the narrow breakpoint after proving a narrow cap collapsed the heading.
   - **Verification:** Anchored workspace suite passed; measured 361.46875px clearance at 1440px.
   - **Commits:** `8abde96`, `928059d`.

2. **[Rule 1 - Test contract] Excluded deliberate ellipsis internals from broad overflow-owner detection**
   - **Found during:** Task 2 verification.
   - **Issue:** The old assertion treated the intentionally clipped renamed-path descendants as document-overflow owners.
   - **Fix:** Kept document/review-main overflow assertions and excluded only descendants of `.review-toolbar__active-file`.
   - **Verification:** Anchored workspace suite passed across all phase widths.
   - **Commit:** `d2bb700`.

## Issues Encountered

- The first anchored workspace run found the overlay collision; it led to the measured, minimal flex correction above.

## Known Stubs

None.

## Self-Check: PASSED

- SUMMARY.md exists.
- Task commits `8a9fa1c`, `8abde96`, `928059d`, `d2bb700`, and `644f00e` exist.
