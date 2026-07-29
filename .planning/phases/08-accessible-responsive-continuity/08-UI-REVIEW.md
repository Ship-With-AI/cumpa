# Phase 08 — UI Review

**Audited:** 2026-07-29  
**Baseline:** `08-UI-SPEC.md`  
**Screenshots:** Not captured — no runnable dev server was reachable at `127.0.0.1:3000`, `:5173`, or `:8080`; this is a code-and-focused-browser-test audit.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 2/4 | The session-empty copy in `App.vue` diverges from the UI-SPEC’s exact empty-comparison contract. |
| 2. Visuals | 3/4 | The semantic header, three toolbar groups, and localized diff canvas are structurally sound, but wrapped toolbar separators have no narrow-row treatment verified in a live screen. |
| 3. Color | 3/4 | The single semantic palette, control-boundary token, and forced-color rules are implemented; the required full composited state matrix is not covered by the focused contrast assertions. |
| 4. Typography | 3/4 | The four-size/two-weight root is retained, but visible `BASE`/`HEAD` side labels inherit regular weight rather than the specified semibold. |
| 5. Spacing | 3/4 | Most layout uses the 4-point token scale, but icon-only toolbar buttons retain a literal `7px` padding exception not permitted by the contract. |
| 6. Experience Design | 3/4 | Focus, drawers, local diff overflow, keyboard paths, forced colors, and reduced motion have focused browser coverage; true 400% zoom remains an opt-in test branch rather than part of the standard focused run. |

**Overall: 17/24**

---

## Top 3 Priority Fixes

1. **Restore the exact empty-comparison copy in `App.vue`.** — A user can encounter wording that conflicts with the approved no-changes state and its terminal exit instruction. — Replace `App.vue:857-859` with the `08-UI-SPEC.md` exact `No changes in this pinned comparison` heading and explanatory sentence, or reuse the canonical `EmptyState.vue` rendering.
2. **Make the visible Monaco `BASE` and `HEAD` labels semibold.** — The pane identity cue loses required typographic emphasis, which matters in grayscale and forced colors. — Add `font-weight: var(--font-weight-semibold)` to `.diff-workspace__side-labels span` and assert computed `600` in the focused browser contract.
3. **Remove the non-scale `7px` icon-button padding.** — It breaks the locked 4-point spacing rule in the repeatedly used file/change controls. — Keep the `32px` grid target, center the `16px` icon with `padding: 0`, and retain the existing accessible name and target size.

---

## Detailed Findings

### Pillar 1: Copywriting (2/4)

**WARNING — exact empty-comparison copy is inconsistent.** `src/web/App.vue:857-859` renders `No PR-style changes in this pinned comparison` and `The selected head has no changes from the displayed merge base.` The Phase 08 copywriting contract requires `No changes in this pinned comparison` plus `The merge base and head resolve to identical trees. Open Comparison identities to review the pinned commits, then press Ctrl+C in the terminal when you are finished.` `src/web/components/EmptyState.vue:3-8` already contains that canonical wording, leaving two competing empty-state messages.

**Evidence of retained good copy:** the inspected implementation preserves the specified verb-plus-object primary controls: `Add comment` / `Adding comment…` in `CommentComposer.vue:93-94`, `Save summary` / `Saving summary…` in `SummarySection.vue:203-214`, and export action labels in `ExportSection.vue:157-158`. The prohibited narrow-mode widening notice was not found in `src/web`.

### Pillar 2: Visuals (3/4)

**WARNING — wrapped toolbar-group separators are not responsive to a new row.** `.review-toolbar__group + .review-toolbar__group` at `src/web/styles.css:1218-1221` always adds a left border and left padding, while `.review-toolbar` becomes wrapping at `src/web/styles.css:2178-2180`. The three groups remain atomic as required, but a group moved to a later row can retain a left-edge divider that visually reads as a continuation of an earlier row. The focused test establishes group geometry and order (`tests/e2e/responsive-session.spec.ts:478-496`) but not the resulting separator treatment.

**Evidence of conformance:** source order is active file → Base → Head in `App.vue:818-836`; desktop and narrow grid areas preserve the specified visual reflow in `styles.css:1120-1169,1987-1991,2159-2171`. `DiffWorkspace.vue:275-296` keeps side labels, comment action, and editor host together in the fixed inner canvas, while `styles.css:1280-1295` localizes the `640px` comparison floor and horizontal scrolling to the diff viewport.

### Pillar 3: Color (3/4)

**WARNING — the reviewed contrast proof is narrower than the approved composite matrix.** The real rendered contrast assertions in `tests/e2e/responsive-session.spec.ts:781-810` measure the session heading, active-file heading, and two toolbar controls/boundaries. They do not themselves measure all required final composites: normal/addition/deletion/intraline diff layers; inactive and focused selections; comment lifecycle/anchor states; notices; disabled/recovery/export receipt surfaces. The contract explicitly requires the complete matrix to be evaluated after composition.

**Evidence of conformance:** `styles.css:1-57` holds one semantic dark root, including `--control-boundary: #8B949E`, reserved accent roles, and approved state colors. Resting controls use the high-contrast boundary at `styles.css:318-330`; the dedicated forced-color layer maps controls, links, selected rails, Base/Head bars/signs, anchor rail, and pane focus to system colors at `styles.css:2302-2429`. The focused Chromium contract passed on this audit run and exercises forced colors and achromatopsia (`responsive-session.spec.ts:1131-1186`). No component-level raw color literals were found; literals are centralized in the root and Monaco theme as required.

### Pillar 4: Typography (3/4)

**WARNING — side labels are regular-weight instead of semibold.** `.diff-workspace__side-labels span` specifies the 12px/16px metadata type at `src/web/styles.css:1305-1311` but does not set `font-weight`; it consequently inherits root regular `400`. The UI-SPEC requires visible Base/Head cues at 12px/16px **semibold**. This is distinct from the header endpoint labels, which correctly set semibold at `styles.css:1151-1156`.

**Evidence of conformance:** `styles.css:61-78` declares exactly the approved four sizes, line heights, and two weights. The typography scan found only approved literal values for the 16px comment affordance and 12px Monaco signs (`styles.css:1326-1328,2229-2232`), and no third weight was found. `PathText` retains the required quiet regular directory and primary semibold filename distinction (`styles.css:849-862`).

### Pillar 5: Spacing (3/4)

**WARNING — icon-only controls use an unapproved 7px padding value.** `src/web/styles.css:493-500` sets `.ui-button--icon` to `32px` square with `padding: 7px`. The UI-SPEC permits no non-4px spacing exception for this control; it limits exceptions to visual details such as 1–3px borders/rails and selected radii. The target size is correct, but the internal padding is not on the stated scale.

**Evidence of conformance:** the semantic scale is centralized at `styles.css:80-87`; toolbar, context band, path wrapping, drawers, and narrow layouts use the approved `4px`, `8px`, `16px`, and wider named roles (`styles.css:1120-1225,1950-2008`). The local comparison canvas retains its intentional `640px` geometry at `styles.css:1288-1295`, and the focused browser test passed document-fit plus positive local overflow assertions at 320px (`responsive-session.spec.ts:483-525`).

### Pillar 6: Experience Design (3/4)

**WARNING — true 400% zoom is optional in the automated path.** The test branch that waits for an actual 1280px browser window to become a 320 CSS-px viewport is guarded by `DIFF_REVIEW_TRUE_ZOOM === '1'` at `tests/e2e/responsive-session.spec.ts:1478-1508`. The focused test run performed for this review passed 1/1, but did not execute that opt-in branch. This leaves a required zoom context dependent on manual/explicit invocation rather than the ordinary focused regression command.

**Evidence of conformance:** `:focus-visible` provides the specified 2px ring at `styles.css:100-103`, with pane-local inset focus at `styles.css:2282-2286`; the test validates focus perimeter geometry against clipping ancestors (`responsive-session.spec.ts:369-420`). The focused Chromium test passed in this audit (`npm run test:package -- tests/e2e/responsive-session.spec.ts --grep "responsive keyboard and accessibility contract"`, 1 passed, 9.5s) and covers 320px skip links, drawers, focus return, keyboard help, local diff use, achromatopsia, forced colors, and reduced-motion styles. Existing controls retain accessible names and tooltip feedback: `ReviewToolbar.vue:24-92`, `DiffWorkspace.vue:278-292`, and `UiPrimitives.vue:14-24`.

---

## Human Review Flags

- **needs_human_review: true — screenshots and direct interaction.** No local dev server was available during the audit, so the actual visual balance, accent distribution, wrapped-toolbar separator appearance, and clipping at breakpoint edges were not inspected as rendered screenshots.
- **needs_human_review: true — real 400% browser zoom.** Run the opt-in headed zoom branch and visually confirm that focus stays unobscured and no non-diff surface gains horizontal scrolling.
- **needs_human_review: true — Windows High Contrast.** Chromium forced-colors emulation passed, but the UI-SPEC treats a real Windows High Contrast pass as additional evidence when that environment is available.

---

## Files Audited

### Phase inputs

- `.planning/phases/08-accessible-responsive-continuity/08-CONTEXT.md`
- `.planning/phases/08-accessible-responsive-continuity/08-UI-SPEC.md`
- `.planning/phases/08-accessible-responsive-continuity/08-01-PLAN.md`
- `.planning/phases/08-accessible-responsive-continuity/08-02-PLAN.md`
- `.planning/phases/08-accessible-responsive-continuity/08-03-PLAN.md`
- `.planning/phases/08-accessible-responsive-continuity/08-01-SUMMARY.md`
- `.planning/phases/08-accessible-responsive-continuity/08-02-SUMMARY.md`
- `.planning/phases/08-accessible-responsive-continuity/08-03-SUMMARY.md`

### Implementation and evidence

- `src/web/App.vue`
- `src/web/components/DiffWorkspace.vue`
- `src/web/components/ReviewToolbar.vue`
- `src/web/components/PathDisplay.vue`
- `src/web/components/EmptyState.vue`
- `src/web/components/StatusBadge.vue`
- `src/web/components/ui/UiPrimitives.vue`
- `src/web/styles.css`
- `tests/e2e/responsive-session.spec.ts`
- `tests/integration/anchored-workspace.spec.ts`
