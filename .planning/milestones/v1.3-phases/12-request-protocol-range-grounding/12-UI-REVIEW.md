# Phase 12 — UI Review

**Audited:** 2026-08-04  
**Baseline:** `12-UI-SPEC.md`  
**Screenshots:** Not captured — no dev server responded on ports 3000, 5173, or 8080. Screenshot storage gate verified at `.planning/ui-reviews/.gitignore`; generated-path browser behavior was exercised by the focused Playwright suite.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | Exact range copy, terminology, empty state, unavailable state, and retry label match the contract. |
| 2. Visuals | 4/4 | Reuses the existing header and disclosure surface; the range branch adds no prohibited protocol UI. |
| 3. Color | 4/4 | Uses the established GitHub-dark tokens; range emphasis is confined to the disclosure action and focus treatment. |
| 4. Typography | 3/4 | **WARNING:** Pathspec rows do not explicitly receive the required 20px body line-height. |
| 5. Spacing | 3/4 | **WARNING:** The mobile range retry button remains a 32px minimum-height control, below the required 44px target. |
| 6. Experience Design | 3/4 | **WARNING:** The narrow `aria-modal` scope dialog leaves the header disclosure interactive outside the dialog. |

**Overall: 21/24**

---

## Top 3 Priority Fixes

1. **Make the range retry control 44px or larger below 768px** — a touch user can miss `Try loading pinned diff again` — include `.ui-button` in the existing mobile target-size selector in `src/web/styles.css:2255-2260`.
2. **Make all content outside the narrow scope dialog inert** — `aria-modal="true"` currently overstates the modal boundary because the header disclosure remains operable — apply the same narrow-open inert condition used for `.review-shell` to `IdentityHeader` in `src/web/App.vue:795,811`.
3. **Set pathspec-list body metrics explicitly** — native/default line-height is not the 20px contract — add `font-size: var(--font-size-body)` and `line-height: var(--line-height-body)` to `.pathspec-list code` in `src/web/styles.css:620-623`.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)

**PASS — no contract violation found.**

- `src/web/components/IdentityHeader.vue:65` uses the exact conditional action text, `View review scope`.
- `src/web/components/IdentityPanel.vue:88-116,171-175` uses `Review scope`, `Base commit`, `Head commit`, `Ordered Git pathspecs`, `All changed paths`, and both exact scope-footer variants. The range branch omits the interactive `Merge base` row.
- `src/web/App.vue:881-906` matches the approved no-pathspec and scoped empty-state variants, `Pinned range unavailable`, the approved recovery body, and `Try loading pinned diff again`.
- A focused string scan of the affected Vue files found no user-visible forbidden range terminology or Phase-12 completion/patch/protocol screen language. The occurrences of `filter` are implementation calls, not rendered copy.

### Pillar 2: Visuals (4/4)

**PASS — no contract violation found.**

- The range view is a conditional extension of the existing `IdentityHeader` and `IdentityPanel`, not a new workflow surface (`IdentityHeader.vue:21-24,65`; `IdentityPanel.vue:31-37,88-119`).
- The scope uses a labelled `region` on wide layouts and a labelled `dialog` on narrow layouts (`IdentityPanel.vue:70-79`), while the existing workspace remains the primary surface.
- `src/web/styles.css:575-609,2022-2034` supplies the required overlay geometry: 520px maximum at desktop, 480px maximum at intermediate widths, internal vertical scrolling, and no diff-column narrowing.
- The generated range E2E case passed and verified the scoped tree, header action, full OIDs, ordered list, copy controls, and absence of `Merge base` (`tests/e2e/pinned-session.spec.ts:458-519`).

### Pillar 3: Color (4/4)

**PASS — no contract violation found.**

- The specified colors are tokenized exactly: `--interactive-accent: #2F81F7`, `--focus-ring: #58A6FF`, `--text-primary: #E6EDF3`, and `--text-secondary: #B1BAC4` (`src/web/styles.css:10-23`).
- The range disclosure is the affected control receiving `var(--interactive-accent)` (`src/web/styles.css:366-379`); the scope panel, OIDs, pathspecs, and neutral copy use the existing surface/text tokens instead.
- Focus remains a separate 2px `#58A6FF` outline (`src/web/styles.css:102-105`), so range scope and selection are not conveyed by accent fill alone. Forced-colors overrides preserve system colors for controls, focus, selection, and panel boundaries (`src/web/styles.css:2405-2473`).

### Pillar 4: Typography (3/4)

**WARNING — body line-height is not guaranteed for pathspec rows.**

- **Evidence:** The range pathspec values are `<code>` elements (`src/web/components/IdentityPanel.vue:111-114`). `.pathspec-list code` sets only block layout, wrapping, and whitespace (`src/web/styles.css:620-623`), while neither `.pathspec-list`, its parent `<dd>`, nor the root establishes `var(--line-height-body)`. The range OID style does explicitly set the 14px/20px body metrics (`src/web/styles.css:688-694`); pathspecs should have the same guarantee under the approved contract.
- **Impact:** Long or multiline ordered pathspecs can fall back to the browser's normal line-height rather than the required 20px rhythm.
- **Recommendation:** Add the existing `--font-size-body` and `--line-height-body` values to `.pathspec-list code`. This preserves the inherited monospace family and does not change content or ordering.
- Positive evidence: the heading and labels use the established 20px/28px page heading, 16px/24px section heading, 12px/16px metadata, and only regular/semibold token weights (`src/web/styles.css:56-68,192-225,635-694`).

### Pillar 5: Spacing (3/4)

**WARNING — the narrow range retry control misses the required hit-area minimum.**

- **Evidence:** The Phase 12 unavailable state renders `Try loading pinned diff again` as `.ui-button` (`src/web/App.vue:902-906`). All generic controls begin with `min-height: 32px` (`src/web/styles.css:320-342`). The below-768px rule upgrades only `.identity-disclosure`, `.identity-panel--modal .sheet-close-button`, and `.identity-panel--modal .copy-button` to 44px (`src/web/styles.css:2255-2260`); `.ui-button` is absent.
- **Impact:** At 320–767px, the range-specific retry action can be only 32px high, violating the UI-SPEC's explicit 44px by 44px minimum for interactive targets.
- **Recommendation:** Add `.ui-button` to that mobile selector, reusing the existing 44px declaration.
- Positive evidence: range panel padding, row gaps, ordered-list gap, desktop/intermediate width rules, and the mobile one-column/wrapping rules all use the established 4px spacing tokens (`src/web/styles.css:575-623,2032-2034,2228-2260`).

### Pillar 6: Experience Design (3/4)

**WARNING — narrow modal semantics do not fully match its interactive boundary.**

- **Evidence:** On narrow widths the scope panel is correctly exposed as `role="dialog"` with `aria-modal="true"` (`src/web/components/IdentityPanel.vue:70-79`), and keyboard Tab containment, Escape dismissal, and focus return are implemented (`IdentityPanel.vue:40-60`; `src/web/App.vue:668-706`). However, `src/web/App.vue:811` makes only `.review-shell` inert when the narrow scope is open; `IdentityHeader` remains outside that inert subtree at line 795 and contains the active disclosure button (`IdentityHeader.vue:55-66`).
- **Impact:** A pointer user can still activate the header's `View review scope` control outside a declared modal dialog. This conflicts with the `aria-modal` promise to assistive technology and makes the modal boundary incomplete, although keyboard containment and Escape work.
- **Recommendation:** Bind the same narrow-open inert state to `IdentityHeader` (or place both header and workspace in one inertable background wrapper) until the dialog closes. Preserve the current close path, which returns focus to the trigger after inertness is removed.
- Positive evidence: the focused browser test passed all 11 cases, including range launch, invalid-pathspec no-browser behavior, empty/error states, narrow-dialog focus looping, Escape, and disclosure focus return (`tests/e2e/pinned-session.spec.ts:458-620`). Reduced-motion and forced-colors support remains present (`src/web/styles.css:2394-2473`).

---

## Files Audited

### Contract and execution evidence

- `.planning/phases/12-request-protocol-range-grounding/12-UI-SPEC.md`
- `.planning/phases/12-request-protocol-range-grounding/12-01-PLAN.md` through `12-06-PLAN.md`
- `.planning/phases/12-request-protocol-range-grounding/12-01-SUMMARY.md` through `12-06-SUMMARY.md`
- `.planning/phases/12-request-protocol-range-grounding/12-VERIFICATION.md`
- `.planning/phases/12-request-protocol-range-grounding/12-REVIEW.md`

### Implementation and focused evidence

- `src/web/App.vue`
- `src/web/components/IdentityHeader.vue`
- `src/web/components/IdentityPanel.vue`
- `src/web/components/CopyButton.vue`
- `src/web/styles.css`
- `tests/e2e/pinned-session.spec.ts`

### Audit execution

- Verified screenshot storage ignore rules before attempting capture.
- No standalone dev server responded on `127.0.0.1:3000`, `:5173`, or `:8080`; no screenshot was produced.
- Focused browser verification: `npm exec -- playwright test tests/e2e/pinned-session.spec.ts` — **11 passed** in 22.2 seconds.
