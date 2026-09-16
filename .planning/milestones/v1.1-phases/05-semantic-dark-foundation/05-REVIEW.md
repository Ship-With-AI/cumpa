---
phase: 05-semantic-dark-foundation
reviewed: 2026-07-26T15:24:56Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - scripts/verify-semantic-css.mjs
  - src/web/styles.css
  - tests/e2e/pinned-session.spec.ts
  - tests/e2e/responsive-session.spec.ts
  - tests/integration/draft-recovery-ui.spec.ts
  - tests/integration/export-receipt-ui.spec.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Phase 05: Code Review Report

**Reviewed:** 2026-07-26T15:24:56Z  
**Depth:** standard  
**Files Reviewed:** 6  
**Status:** clean

## Summary

Reviewed the six locked Phase 05 artifacts against `05-01-PLAN.md`, `05-UI-SPEC.md`, and the phase summary. The current stylesheet retains one exact semantic root, confines direct paint values to that root or the terminal forced-colors repair, and preserves the Phase 05-only foundation boundary: no Monaco theme/model/diff-layer adaptation is introduced.

The CSS audit traverses declaration-bearing keyframe steps and grouping contexts; rejects duplicate or non-allowlisted shadows; and its deterministic self-checks cover raw colors in keyframes, named colors, current CSS color functions, and unapproved forced-colors system colors. The browser contracts use the packaged/mounted state journeys required for this phase, including the real Monaco gutter and `UiPrimitives` tooltip journeys, drawer transitions, exact 1280px/1279px layout distinction, recovery, receipt, loading, unavailable, and empty states.

No actionable defect remains in the supplied Phase 05 scope. Tests, linters, and formatters were not run by this reviewer, as directed.

## Historical Findings Re-evaluated

| Historical finding | Current result | Current evidence |
| --- | --- | --- |
| WR-01 — closed responsive drawers painted overlay elevation | **Resolved** | Closed responsive drawer rules explicitly compute `box-shadow: none`; overlay elevation is applied only by `.comments-rail--open` and `.review-files--open` in their permitted responsive contexts (`src/web/styles.css:1355-1369`, `src/web/styles.css:1380-1402`). The packaged journey asserts both open shadow and post-close `none` across the affected tiers (`tests/e2e/responsive-session.spec.ts:805-812`, `836-862`, `925-951`, `970-976`). |
| WR-02 — later `box-shadow` declaration could bypass the audit | **Resolved** | The audit gathers all `box-shadow` declarations and fails a rule with more than one before evaluating selector/context allowlists (`scripts/verify-semantic-css.mjs:328-347`). The inset allowlist contains only the two specified resting rails, while the overlay allowlist and responsive-context checks name only the permitted overlays (`scripts/verify-semantic-css.mjs:317-342`). |
| WR-03 — contextual/nested token roots could evade the audit | **Resolved** | `rootRule()` rejects contextual `:root` leaves, and direct-color exemption requires both selector `:root` and an empty context (`scripts/verify-semantic-css.mjs:175-188`, `296-308`). Deterministic fixtures cover nested roots under `@supports`, `@layer`, `@container`, and `@scope` (`scripts/verify-semantic-css.mjs:375-386`). |
| WR-04 — gutter/tooltip proof used a fixture or let hover mask focus | **Resolved** | The test drives the generated Monaco session, finds the real gutter action by exact accessible name, proves hover open/mouse-leave close and focus open/focus-out close, then separately proves the `UiPrimitives` hover, focus, focus-out, and Escape journeys (`tests/e2e/responsive-session.spec.ts:673-717`). The only synthetic gutter control remains the separate target-spacing fixture (`tests/e2e/responsive-session.spec.ts:599-654`). |
| WR-05 — receipt visual checks ran only at 360px | **Resolved** | Typography and static receipt/file-row surface assertions execute inside the `[768, 360]` viewport loop (`tests/integration/export-receipt-ui.spec.ts:192-210`). |
| Later WR-01 — keyframe declaration steps escaped raw-color and shadow auditing | **Resolved** | `declarationRules()` descends into declaration-bearing nested blocks, including keyframe steps; direct-color and shadow checks consume those rules (`scripts/verify-semantic-css.mjs:156-173`, `295-308`, `328-347`). Deterministic raw-color and shadow keyframe fixtures must fail (`scripts/verify-semantic-css.mjs:390-397`). The shipped spinner keyframe contains only a transform (`src/web/styles.css:1323-1326`). |
| Later WR-02 — named/modern direct colors and forced-colors allowed-value boundaries escaped confinement | **Resolved** | Direct-color detection now covers named colors, hex, legacy/current color functions including `hwb()`, `oklab()/oklch()`, `lab()/lch()`, `color()`, `color-mix()`, `device-cmyk()`, `light-dark()`, and both contrast-function spellings (`scripts/verify-semantic-css.mjs:260-274`). It distinguishes all standard system colors from the documented forced-colors allowlist (`scripts/verify-semantic-css.mjs:218-230`, `300-306`). Fixtures reject named and modern color syntax plus forced-colors `AccentColor`, while allowing only approved system keywords and intentional `currentColor`/`transparent` values (`scripts/verify-semantic-css.mjs:399-423`). |
| Later WR-03 — 1280px/1279px breakpoint proof did not exercise distinct real layouts | **Resolved** | At 1280px the packaged test asserts an unwrapped header, static adjacent files/diff columns, and comments-only overlay behavior (`tests/e2e/responsive-session.spec.ts:814-862`). At 1279px it separately asserts wrapping, in-header/non-overlapping bounding boxes, the same static column ownership, comments-only overlay, and no document overflow (`tests/e2e/responsive-session.spec.ts:864-951`). |

## Narrative Findings (AI reviewer)

No critical issues, warnings, or information findings.

---

_Reviewed: 2026-07-26T15:24:56Z_  
_Reviewer: agent (gsd-code-reviewer)_  
_Depth: standard_
