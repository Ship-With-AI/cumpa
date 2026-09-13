---
phase: 09-changed-file-tree
status: passed
score: 24/24
reviewed: 2026-09-13
screenshots: .planning/ui-reviews/09-live-20260913
---

# Phase 09 — UI Review

**Audited:** 2026-09-13  
**Baseline:** approved `09-UI-SPEC.md` and `mockups/01b-quiet-workspace-tree.html`  
**Screenshots:** captured from a freshly built CLI session. PNG files are protected by `.planning/ui-reviews/.gitignore`.

A fresh `npm run build` completed, then an isolated Git fixture was opened through the shipped `dist/bin/cumpa.mjs` using the Playwright harness mechanism: `CUMPA_LAUNCH_OPTIONS`, a fake `open` executable, and the CLI-emitted ephemeral `127.0.0.1` URL. This is live browser evidence, not a component-only mount.

---

## Pillar Scores

| Pillar | Score | Key finding |
|---|---:|---|
| 1. Copywriting | 4/4 | The filter, recovery state, and clear controls use the UI-SPEC’s exact operational copy. |
| 2. Visuals | 4/4 | Live 288px, 256px, and 420px captures retain the reference’s compact hierarchy, one-line rows, row anatomy, and selected rail. |
| 3. Color | 4/4 | Tree chrome uses semantic tokens; live selection, hover, status letters, signed counts, and rail all retain non-color cues. |
| 4. Typography | 4/4 | The approved four-size/two-weight system is used; dense file, directory, count, and header roles remain legible at shipped widths. |
| 5. Spacing | 4/4 | Observed 34px rows, 8px tree inset, 20/18/14px header treatment, 16px hierarchy step, and contained scroller match the approved geometry. |
| 6. Experience Design | 4/4 | The live session proves filter/collapse/recovery/roving-focus behavior, including the formerly unverified active-filter collapse transition. |

**Overall: 24/24**

No BLOCKER or WARNING findings were identified in the Phase 09 tree scope.

---

## Required Live Checks

| # | Check | Result | Observed evidence |
|---:|---|---|---|
| 1 | Reference-viewport visual comparison | **PASS** | `desktop-1440x900.png` and `desktop-tree-288px.png` show the dense single-line tree, Files/count/Changed order, immediately following filter, 34px rows, 8px hierarchy inset plus 16px level step, slash-suffixed directory/count, literal `+`/`−` counts, hover fill, selection boundary/3px rail, and hint. `narrow-tree-256px.png` preserves those anatomy cues at the shipped 256px host; `mobile-420x900.png` / `mobile-tree.png` preserve them in the live compact Files surface. Against `reference-mockup-1440x900.png`, the tree interior agrees on density, hierarchy and state treatment. The reference’s 294px shell and its All files/Unviewed/progress controls are deliberately outside Phase 09; the approved contract instead evaluates the shipped 288px/256px hosts and explicitly defers viewed controls. |
| 2 | Collapse a surviving directory while filtering | **PASS** | In a live query for `src`, the matching `src/` directory was initially force-expanded. Clicking it changed `aria-expanded` to `false` and reduced visible treeitems from **4 to 1**; its three child rows disappeared. This proves rendered state and ARIA state agree. |
| 3 | Clear filter restores reviewer state and open selection | **PASS** | The reviewer’s pre-filter collapsed `src/` state returned as `aria-expanded="false"`; `root-selected.ts` remained selected (`aria-selected="true"`) and became the sole roving target (`tabindex="0"`). |
| 4 | Exactly one `tabindex="0"` in every state | **PASS** | Live counts were: unfiltered **1**; filtered **1**; no-match **0** (the required empty-projection exception); after clearing **1**, on the selected open file. |
| 5 | Decorative search glyph focuses filter | **PASS** | A real pointer click at the glyph’s visible coordinates focused the native `Filter files` searchbox. The glyph is intentionally `pointer-events: none`, allowing the underlying input to receive the click. |

### Capture inventory

- `.planning/ui-reviews/09-live-20260913/reference-mockup-1440x900.png`
- `.planning/ui-reviews/09-live-20260913/desktop-1440x900.png`
- `.planning/ui-reviews/09-live-20260913/desktop-tree-288px.png`
- `.planning/ui-reviews/09-live-20260913/narrow-1280x900.png`
- `.planning/ui-reviews/09-live-20260913/narrow-tree-256px.png`
- `.planning/ui-reviews/09-live-20260913/mobile-420x900.png`
- `.planning/ui-reviews/09-live-20260913/mobile-tree.png`

---

## Top 3 Priority Fixes

No Phase 09 tree changes are recommended.

1. **No tree-density fix** — live rows measure **34px**, with status, filename, signed counts, selection rail, directory count, and hierarchy visible at all inspected hosts.
2. **No filter-state fix** — live collapse during filtering removes descendants and reports `aria-expanded="false"`; clearing restores reviewer-owned expansion and selected-file tab-stop state.
3. **No narrow-tree fix** — the captured 256px host and 420px Files surface retain compact rows and do not hide status, count, indentation, or selection information.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)

**PASS — exact contract copy is present and was rendered live.** `FileTree.vue:121-157` supplies `Filter files`, `Find file…`, `Clear file filter`, `No matching files`, `Clear the filter to show all changed files.`, and `Clear filter` exactly as specified. `FileTree.vue:217` supplies the approved keyboard hint. The live no-match state rendered the heading, recovery instruction, and CTA together; the trailing clear control returned focus to the input after its normal click path.

### Pillar 2: Visuals (4/4)

**PASS — reference comparison found no Phase 09 visual divergence.** The capture shows the prescribed header/filter/scroller/hint order, compact directory/file hierarchy, three-column row anatomy, recursive directory count, and selected-file rail. `styles.css:952-1044` implements the 34px dense row, 5px radius, transparent default boundary, raised hover state, selected boundary, and inset rail. `DirectoryRow.vue:30-41` provides the visible slash-suffixed directory label and count; `FileRow.vue:47-70` provides visible status, basename, signed counts, and availability identity.

The approved departures are intact rather than defects: the shipped desktop host is 288px (not the mockup’s Phase-11-owned 294px shell), the UI-SPEC retains the Phase 08 page-heading role for `Files`, and viewed-state controls remain deferred. The live captures show no missing hierarchy or clipped row information as a result.

### Pillar 3: Color (4/4)

**PASS — semantic state treatment is both visible and non-color dependent.** The tree component files contain no direct color literals; tree styling uses semantic variables (`styles.css:952-1044,1132-1223`). Live inspection measured selection as `rgb(26, 43, 67)` with its `rgb(52, 84, 119)` boundary and a **3px** rail, while a non-selected hover row changed to `rgb(33, 38, 45)`. The visible `M`, literal `+1`/`−1`, directory disclosure, selection boundary, and rail communicate state independent of hue.

### Pillar 4: Typography (4/4)

**PASS — the observed roles follow the approved type system.** File names use the code-size role (`styles.css:1110-1113`), directory/count/header/filter typography uses the inherited body/metadata/page-heading roles (`styles.css:275-307,1023-1044,1137-1145`), and the live 256px and 420px captures retain readable single-line rows. No extra Phase 09 size, weight, font source, or icon library was introduced.

### Pillar 5: Spacing (4/4)

**PASS — measured and visual geometry agrees with the contract.** Browser evidence measured selected rows at **34px**. The implementation uses the required `8 + (level - 1) × 16px` row-local indent in `DirectoryRow.vue:55` and `FileRow.vue:52`; screenshots show the nested children stepping right while counts remain contained. `styles.css:1132-1251` applies the documented 20px/18px/14px header inset, 9px/12px/33px input padding, 8px scroller inset, 16px bottom inset, and 10px hint inset. At 1440px the shipped host measured **288px**; at 1280px it measured **256px**; neither tree capture hides counts or produces page-level horizontal overflow.

### Pillar 6: Experience Design (4/4)

**PASS — all tree interaction states are live-proven.** `FileTree.vue:54-74` keeps query transitions local and restores/reveals selection without focus theft; its rendered rows receive `model.effectiveExpandedDirectoryIds` and exactly one `model.tabbableRowId` (`:170-207`). The model removes explicit filter-time collapses from effective expansion (`file-tree.ts:215-234`) and selects the selected-visible/focused-visible/first-visible tab stop precedence (`file-tree.ts:243-252`). The direct browser sequence verified the high-risk behavior instead of inferring it from that code: filter collapse hid descendants and changed ARIA state, no-match yielded zero tab stops with recovery copy, and clearing restored reviewer collapse plus selected sole tab stop.

### Registry Safety

Skipped: `components.json` is absent and `09-UI-SPEC.md` declares no component or third-party registry.

---

## Files Audited

- `.planning/phases/09-changed-file-tree/09-UI-SPEC.md`
- `.planning/phases/09-changed-file-tree/09-VERIFICATION.md`
- `.planning/phases/09-changed-file-tree/09-02-SUMMARY.md`
- `.planning/phases/09-changed-file-tree/09-03-SUMMARY.md`
- `.planning/phases/09-changed-file-tree/09-04-SUMMARY.md`
- `.planning/phases/09-changed-file-tree/09-05-SUMMARY.md`
- `.planning/phases/09-changed-file-tree/09-06-SUMMARY.md`
- `src/web/styles.css`
- `src/web/components/FileTree.vue`
- `src/web/components/DirectoryRow.vue`
- `src/web/components/FileRow.vue`
- `src/web/components/PathDisplay.vue`
- `src/web/model/file-tree.ts`
- `mockups/01b-quiet-workspace-tree.html`
- `tests/e2e/file-tree.spec.ts`
- `tests/e2e/responsive-session.spec.ts`
- `tests/helpers/git-fixture.ts`
