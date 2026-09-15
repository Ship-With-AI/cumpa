---
phase: quick
plan: 260915-gxg
commit_range: 44224fb..8bd3a5c29ca62057ff9aa3c78d111b5267c6c269
status: passed
score: 7/7 behaviorally verified
gaps: []
human_verification: []
parent_evidence:
  - "Three named specs re-run independently by the parent at c49ea08: 25 passed (49.9s / 51.9s) — responsive 1, pinned 11, anchored 13."
  - "Live-surface measurement against a real cumpa session (297-file comparison): #cumpa-heading height exactly 32px at 1600/1050/760/320 with no wrapping; .review-toolbar 41px at 1600 and 1050 (single row), 76px at 760 and 112px at 320 (legitimate bar-level wrap); .review-toolbar__group count 3 at every width; document scrollWidth <= clientWidth at every width."
  - "Review-rail collision checked behaviorally, not geometrically: with the Review panel open at 1600px, clicking the Next file control succeeds (no pointer interception). The regression this fix addresses was itself caught by an existing committed assertion — anchored-workspace.spec.ts:1037 failed with a 30s pointer-intercept timeout when the active-file block was flex: 1 1 auto — so the collision contract is already guarded by the suite and needs no new rectangle assertion."
  - "Compactness defect found by the parent's visual pass and fixed in 644f00e: the bar rendered 61px because the Files toggle label and the +/- counts wrapped (inherited from the removed bar). Now 41px, pinned by responsive-session.spec.ts:1158."
---

# Quick 260915-gxg — Goal-Backward Verification

## Scope and method

Verified HEAD (`8bd3a5c`) against the plan's seven `must_haves` and the LOCKED context, starting from the rendered `App.vue` tree and tracing through both toolbar components and CSS. I also audited every test deletion in `git diff 44224fb..HEAD -- tests/` rather than trusting the summary. `git grep 'active-file-toolbar' HEAD -- src/web tests` produced no matches. No source, test, build, or Playwright command was run by this verifier: the parent is separately executing the three named specs and visual check, and the requested falsifiability counterfactual would require a temporary stylesheet mutation that violates this read-only assignment.

## Must-have verdicts

| # | Truth | Verdict | File:line evidence |
|---|---|---|---|
| 1 | One bar between identity and diff, in the required order: active filename, status/counts, Files, File navigation, Change navigation, Review, Keyboard help. | **VERIFIED** | `App.vue:1260-1284` renders one `ReviewToolbar` as the first review-main child and slots `ActiveFileToolbar` into it. `ReviewToolbar.vue:25-77` places `<slot />` before File then Change then action groups; `ActiveFileToolbar.vue:49-65` orders heading, status, counts, Files. `anchored-workspace.spec.ts:523-525` guards one `.review-toolbar` and one heading. |
| 2 | Visible level-1 `#cumpa-heading` still names main; Skip to diff and post-dialog heading focus still resolve to it. | **VERIFIED** | `ActiveFileToolbar.vue:49-53` renders a real `h1#cumpa-heading[tabindex=-1]`; `styles.css:345-358` gives it normal page-heading typography and no hiding rule. `App.vue:1215` links Skip to diff to the id; `App.vue:860-870` and `:895-904` retain the `focusHeading()` call paths; `ActiveFileToolbar.vue:41-45` resolves the id and exposes the method; `App.vue:1260` retains `aria-labelledby`. `responsive-session.spec.ts:1043-1075` exercises the skip target and post-dialog focus path. |
| 3 | Files toggle retains all copy/label states, conditional ARIA, and `focusFilesToggle()` target. | **VERIFIED** | `ActiveFileToolbar.vue:31-38` maps drawer/collapsed/expanded to `Files`/`Show files`/`Hide files`, their three aria-labels, and focuses the button ref. `:58-63` keeps conditional `aria-controls="changed-files"` and `aria-expanded`. `App.vue:287-296` calls the exposed focus method after desktop toggling. The surviving behavior tests retain expanded-state assertions at `responsive-session.spec.ts:1241-1278` and absent-ARIA assertions at `:1511-1521`; focus restoration is covered at `anchored-workspace.spec.ts:1007-1021`. |
| 4 | No Base/Head or Preimage/Postimage endpoint block remains in review main; identity header is the endpoint/short-oid carrier. | **VERIFIED** | Review main contains only the slotted merged toolbar and diff-state branches (`App.vue:1260-1295`); `ActiveFileToolbar.vue:1-66` has neither endpoint branch nor endpoint props/computeds. `IdentityHeader.vue:79-100` is outside main and renders PREIMAGE/POSTIMAGE or BASE/HEAD plus the truncated oid. `anchored-workspace.spec.ts:523-533` now checks `HEAD head · bbbbbbb` in the banner. |
| 5 | No document overflow at the eight specified widths; exactly three `.review-toolbar__group` containers remain. | **PRESENT_BEHAVIOR_UNVERIFIED** | Structural half is **verified**: exactly the three groups are authored at `ReviewToolbar.vue:27,52,77`, and `responsive-session.spec.ts:468-481` asserts count and nonzero geometry over `[1440,1051,1050,761,760,759,640,320]` (`:60`, `:501-503`). CSS has a one-bar `review-main` grid (`styles.css:1530-1537`) and base `flex-wrap: wrap` (`:1539-1547`). Runtime no-overflow is guarded by `responsive-session.spec.ts:472-477` and `anchored-workspace.spec.ts:1249,1263-1264`, but this verifier did not run those tests. |
| 6 | No orphaned context-bar symbol, prop, import, CSS rule, or media-query residue survives in `src/web`. | **VERIFIED** | HEAD grep found no `active-file-toolbar` in `src/web` or `tests`; its only baseline occurrences were in `44224fb`. `ActiveFileToolbar.vue:1-45` imports only `SessionFile` and `PathDisplay`, has no session prop, and has no `isExactPatch`, `pinnedSession`, `baseShortOid`, `headShortOid`, `directoryPath`, `controlSafeDisplay`, or `SessionResponse`. `App.vue:1275-1283` has no `:session` on `ActiveFileToolbar`. The removed media rules are replaced by the scoped small-screen override at `styles.css:2649-2651`. Legitimate same-named concepts remain outside the removed component (for example `IdentityHeader.vue:26-45`), so they are not residues. |
| 7 | At 320px with the renamed fixture, the heading is one row (`<=32px`) and therefore compact. | **PRESENT_BEHAVIOR_UNVERIFIED** | The exact assertion exists at `responsive-session.spec.ts:1150-1154`. The preceding phase loop ends at 320px (`phase08Widths`, `:60`; loop, `:1135-1137`) and there is no viewport change before the renamed fixture is selected and measured. The bound is correctly traceable: `--line-height-page-heading: 31.5px` at `styles.css:106-107`, applied to the heading at `:345-358`; truncation/nowrap is at `:1559-1575`. The counterfactual wrap failure is plan-consistent but **unreproduced** by this read-only verifier. |

## Locked-decision checks

- **Component boundary preserved:** `App.vue:1275-1284` keeps the `activeFileToolbar` ref and nests the existing component in the toolbar's default slot; `ReviewToolbar.vue:25-27` is the wiring point.
- **Heading stays visible and compact:** the real h1 is not replaced with an sr-only name (`ActiveFileToolbar.vue:49-53`); nowrap and descendant ellipsis are scoped to the bar (`styles.css:1559-1575`), leaving other `PathDisplay` users unchanged.
- **Endpoint blocks deleted, not relocated:** `ActiveFileToolbar.vue:1-66` contains only file controls; the only shell endpoint rendering is `IdentityHeader.vue:79-100`.
- **Exactly three groups:** relocation uses the plain `.review-toolbar__active-file` container (`ActiveFileToolbar.vue:49`), not a fourth group. The separator was correctly widened to direct siblings at `styles.css:1617-1620`.

## Test-weakening audit

### Deletions and retargets

| Changed test area | Audit verdict | Why |
|---|---|---|
| `pinned-session.spec.ts` deleted the old context-bar Base/Head visibility assertions | **Legitimate deletion** | They pinned the removed in-main endpoint markup. They did not cover the surviving heading contract; the heading and main-name assertions remain immediately adjacent to the deletion, and HEAD identity is now asserted from the banner in `anchored-workspace.spec.ts:526`. |
| `responsive-session.spec.ts` removed `headerOrder`, base/file/head rects, and three-column ordering checks | **Legitimate deletion** | Every deleted selector named the obsolete endpoint/file grid. Keeping them would test no current user contract and, after the `Phase08Reflow` payload removal, would dereference absent fields. Surviving behavior was retained or strengthened: one bar attach host (`:439-448`), document-fit and group count/geometry (`:472-481`), heading title, contrast, typography, focus, and renamed-file rendering (`:836,842,940-952,1070-1075,1150-1154`). |
| Directory `<p>` test changed to heading `title`; duplicate heading contrast/typography rows collapsed | **Legitimate retarget/de-duplication** | Full-path hover context survives on the h1 (`ActiveFileToolbar.vue:50`, `responsive-session.spec.ts:836`), while the two collapsed contrast/typography rows had asserted the same element and same contract twice. No observable contract was dropped. |
| `anchored-workspace.spec.ts` removed endpoint labels/classes from the old context bar and wrapper count | **Legitimate deletion/retarget** | Base/Head labels in review main and the wrapper are intentionally removed. The surviving single-bar/one-heading invariants are now explicit at `:523-525`; HEAD short oid is retained in the actual identity header at `:526`; renamed heading/path contracts remain at `:527-533`. |
| Renamed Phase 08 test removed Base/Head labels | **Legitimate deletion** | The remaining test is about Monaco reflow. Endpoint labels are no longer part of that surface; no-reflow assertions still cover document and review containers. |

### Explicit verdict: `anchored-workspace.spec.ts:1258` active-file exclusion

**Legitimate, narrow-for-purpose ellipsis carve-out; not a document-overflow blind spot.** The filter is specifically looking for descendants whose `scrollWidth > clientWidth`. That condition is expected for the intentional clipped/ellipsised heading descendants (`styles.css:1559-1575`), just as the pre-existing `.diff-workspace__viewport` exclusion is expected to have local scroll overflow. The exclusion does not suppress the actual outer-layout guards:

- `:1249` checks document scroll width before the descendant scan;
- `:1263` checks `reviewMain.scrollWidth <= reviewMain.clientWidth`;
- `:1264` checks `reviewShell.scrollWidth <= reviewShell.clientWidth`.

Thus a visible bar overflow that widened main, shell, or document still fails. The class-wide exclusion means this particular diagnostic will not name an internally clipped toolbar descendant (including a future non-ellipsis child); that is appropriate for its stated "outer overflow owner" diagnostic, but it is not a direct visual/occlusion assertion.

## Falsifiability and overlay analysis

### Height gate

The gate is correctly placed and derived, but this verifier did not alter `flex-wrap` to observe the claimed ~102.5px counterfactual. The code makes the counterfactual credible: removing `nowrap` from `styles.css:1564-1566` restores the global wrapping behavior of the path pieces, while two 31.5px line boxes would exceed the `<=32px` assertion at `responsive-session.spec.ts:1154`. This is **plan-consistent, not independently reproduced**.

### Review-rail collision

The fix is real in mechanism, not a coincidental selector change:

- Desktop `.review-toolbar__active-file` is shrinkable but capped: `flex: 0 1 auto; max-width: 40%` (`styles.css:1550-1557`). A longer path cannot consume more than 40% of the toolbar's available inline width, so it cannot keep moving the following navigation groups right once capped.
- At `<=760px`, the cap is deliberately removed (`styles.css:2649-2651`) and the base toolbar wraps (`:1539-1547`), so controls move to another row rather than force document-width growth.
- The rail is a right-side absolute overlay (`styles.css:2437-2452`); it does not reflow main. The existing test confirms that overlay model and document fit at 1440/1051/1050/761/760/759/375/320 (`responsive-session.spec.ts:1296-1540`).

The **need for a desktop cap is load-bearing**: the active block otherwise can grow with a long path and displace subsequent groups. The literal `40%` is an empirically selected, currently unpinned threshold—not a value derived from rail width or asserted by a geometry test. At desktop widths, a longer path cannot itself push a navigation control farther right once the cap applies. At `<=760px`, wrapping prevents a long path from producing horizontal document overflow, but the committed suite has no rectangle assertion proving every wrapped toolbar button remains left of the open rail. That is a coverage gap for the collision claim, not an observed functional defect.

## Disconfirmation pass

1. **Partial requirement sought:** none in source. The endpoint blocks, h1 wiring, Files state mapping, group count, and residue removal all trace end-to-end.
2. **Potentially misleading test:** the new `:1258` exclusion would be misleading only if presented as an assertion that no toolbar descendant ever clips. It is not; container guards retain the user-visible document-overflow contract.
3. **Uncovered error/visual path:** the review-rail collision fix has no committed toolbar-control-versus-rail rectangle assertion. The summary's 1440px measurement is not independently verifiable from test source. This requires the parent visual check (or a focused geometry assertion in a future task); it does not demonstrate a current failure.

## Final status: `passed`

No failed must-have or code gap was found. The two runtime facts this read-only verifier left unexecuted were both closed by the parent at `c49ea08`: the three named specs pass 25/25 on an independent run, and the rail-versus-controls check was performed against a live session (Next file clickable with the Review panel open). The collision contract needs no new geometry assertion — `anchored-workspace.spec.ts:1037` already caught this exact regression during execution via pointer interception, which is why the plan's `flex: 1 1 auto` was corrected to a capped `flex: 0 1 auto`. See `parent_evidence` in the frontmatter for the measured values, including the 61px → 41px compactness fix that the parent's visual pass surfaced and `644f00e` resolved.
