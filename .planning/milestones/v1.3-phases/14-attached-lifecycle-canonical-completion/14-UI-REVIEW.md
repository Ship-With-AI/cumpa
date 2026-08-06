# Phase 14 — UI Review

**Verdict:** **PASS** — **0 blockers, 6 warnings.** No unresolved Phase 14 UI-SPEC blocker remains.

**Audited:** 2026-08-06  
**Baseline:** `14-UI-SPEC.md`  
**Method:** Current-source audit after remediation commit `e0f6c45`, restricted to the lifecycle Vue surfaces. No browser, build, linter, formatter, or test was run by this audit, as assigned.  
**Screenshots:** Not captured (source-only reassessment by assignment). The supplied focused Chromium regression after `e0f6c45` passed **1/1** for the cross-file Finish guard.

---

## CR-01 Finish-Guard Reconciliation

**Resolved — PASS.** The prior finding was that an unsaved inline composer in a non-active file could disable `Finish review` without an adjacent explanation or recovery.

- `src/web/App.vue:166-180` now scans every reviewable workspace file for non-blank composer text and retains that file's stable `fileId` and display path.
- `src/web/App.vue:189-209, 1188-1222` includes this condition in the shared readiness predicate and supplies it to `ReviewPanel`; `src/web/App.vue:423-425` rechecks the same readiness predicate at activation.
- `src/web/components/ReviewPanel.vue:136-139, 781-809` renders adjacent visible warning copy and a path-specific recovery button whenever any navigated file contains an unsaved composer.
- `src/web/App.vue:592-595` selects that file and closes the narrow review drawer, exposing the composer rather than attempting completion.

The supplied focused Chromium result exercises this cross-file condition and passed 1/1. This closes the prior CR-01/UI Finish-guard defect. The warning under Copywriting below is limited to the replacement text differing from the approved exact strings; it is not a missing explanation, broken guard, or task-completion blocker.

---

## Pillar Scores

| Pillar | Score | Key finding |
|--------|------:|-------------|
| 1. Copywriting | 3/4 | **WARNING:** the cross-file composer recovery uses replacement copy rather than the specified unsaved-text heading and action label. |
| 2. Visuals | 3/4 | **WARNING:** lifecycle badges visually reuse open/resolved comment treatments instead of pending/success treatments. |
| 3. Color | 2/4 | **WARNING:** waiting/finishing use accent blue and confirmed completion uses resolved purple, contrary to the required neutral-pending/success semantics. |
| 4. Typography | 4/4 | Attached additions reuse the approved existing type tokens and weights. |
| 5. Spacing & Responsive | 2/4 | **WARNING:** narrow recovery actions remain intrinsic 32px controls rather than full-width 44px targets. |
| 6. Experience Design & Accessibility | 2/4 | **WARNING:** several settled/failure controls misrepresent readiness or hide required readable output. |

**Overall: 16/24**

---

## Top 3 Priority Fixes

1. **Map lifecycle badges to the lifecycle variants.** `Waiting` and `Finishing` must use `pending`; confirmed completion must use `success`. This restores the neutral-pending → green-success semantic progression required by the contract.
2. **Lock every rendered mutation control and preserve export receipts.** Add `mutationLocked` to the resolved-comment edit branch and retain `ExportReceipt` rendering while disabling only export-mutating controls.
3. **Make recovery actions actionable at narrow widths.** Give every completion recovery button the existing completion action's full-width, 44px mobile treatment; bind generic retry disabled state to `attachedReady` and show the applicable blocked-state recovery instead of accepting a no-op click.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**WARNING — CR-01's recovery copy diverges from the exact approved contract.**

- **Locations:** `src/web/components/ReviewPanel.vue:786-807`; `14-UI-SPEC.md` Copywriting Contract, Unsaved heading/action.
- **Evidence:** The completed remediation visibly explains the disabled state, but calls it `Inline comment draft must be reviewed` and labels the action `Review draft in {path}`. The contract requires `Unsaved text must be reviewed` and `Review unsaved text` for unsaved Finish blockers.
- **Impact:** The user can recover and Finish remains safely blocked, but this adds a second term/action label for the same accepted-vs-buffer concept.
- **Fix:** Reuse the contract's unsaved heading/action wording while retaining the useful path-specific supporting sentence.

**PASS — all other lifecycle copy inspected matches the contract.** Waiting, empty, finishing, success, disconnect, conflict, stale-anchor, stale-scope, draft-validation, and generic-failure copy in `ReviewPanel.vue:653-815`, plus the header fact in `IdentityHeader.vue:43-49`, use the specified terminology and do not claim completion before confirmation.

### Pillar 2: Visuals (3/4)

**WARNING — lifecycle badge hierarchy is semantically wrong.**

- **Locations:** `src/web/components/ReviewPanel.vue:653-657`; `src/web/components/ui/ReviewStateBadge.vue:5-16`; `src/web/styles.css:1597-1632`.
- **Evidence:** Waiting and finishing resolve to `open`; completed resolves to `resolved`. Those are review-comment states, not lifecycle states.
- **Impact:** Attached lifecycle status looks selected/actionable or resolved-comment-like instead of clearly pending and confirmed.
- **Fix:** Map waiting/finishing to `pending` and completed to `success`.

**PASS — the completion section remains normal review-rail flow.** `ReviewPanel.vue:640-815` appends it after Export; no overlay, modal, or competing primary surface is introduced.

### Pillar 3: Color (2/4)

**WARNING — lifecycle state colors violate the required neutral-pending → success allocation.**

- **Locations:** `src/web/components/ReviewPanel.vue:653-657`; `src/web/styles.css:1597-1604, 1607-1611, 1629-1632`.
- **Evidence:** `open` consumes the accent border; `resolved` uses the purple resolved-comment palette. Existing `pending` implements the neutral treatment and existing `success` implements the green confirmed treatment required by the UI-SPEC.
- **Impact:** Color and accompanying iconography falsely associate waiting with an enabled review action and completion with a resolved comment.
- **Fix:** Use the existing `pending` and `success` variants; no new token or component is needed.

### Pillar 4: Typography (4/4)

**PASS.** The lifecycle section uses existing review-panel headings/body controls (`ReviewPanel.vue:651-815`) and `styles.css:1717-1748` uses existing tokens rather than introducing a fifth size or third weight. `ReviewStateBadge.vue:24-27` supplies visible text alongside its icon/spinner.

### Pillar 5: Spacing & Responsive (2/4)

**WARNING — completion recovery actions miss the narrow-screen action contract.**

- **Locations:** `src/web/components/ReviewPanel.vue:684, 695, 706, 717, 728, 739, 751, 762`; `src/web/styles.css:326-347, 1746-1748, 2184-2187`.
- **Evidence:** Only `.attached-completion__action` is full width below 768px and has a 44px minimum. The recovery controls (`Reload page`, `Reload latest`, `Review stale feedback`, `View review/patch scope`, `Reload review`, and `Try Finish review again`) are plain `.ui-button` elements, whose default minimum height is 32px and whose width remains intrinsic.
- **Impact:** Recovery is less reachable than Finish on a phone, contrary to the explicit responsive and accessibility contract.
- **Fix:** Apply a shared completion-recovery action class to those controls and extend the existing narrow `.attached-completion__action` rule to it.

**PASS — completion geometry itself uses the established scale.** `styles.css:1717-1748` uses `--space-md`/`--space-sm`, wraps long copy, and gives the primary Finish action a 44px minimum.

### Pillar 6: Experience Design & Accessibility (2/4)

**WARNING 1 — the resolved-comment edit branch is not actually locked while finishing or completed.**

- **Locations:** `src/web/components/ReviewPanel.vue:607-622`; contrast the correctly locked open-comment branch at `ReviewPanel.vue:450-470`; source fence at `src/web/App.vue:454-455, 1188-1222`.
- **Evidence:** Resolved-comment textarea, `Save comment`, and `Cancel edit` omit `mutationLocked` from their disabled conditions. Root guards prevent persistence, but the rendered controls still appear operable and accept attempted text input.
- **Impact:** This violates the requirement that finishing locks mutations with actual disabled controls, rather than parent-side no-ops.
- **Fix:** Mirror the open-comment branch's `mutationLocked === true` bindings in the resolved edit controls.

**WARNING 2 — generic retry can present an enabled no-op.**

- **Locations:** `src/web/components/ReviewPanel.vue:754-764`; `src/web/App.vue:198-209, 423-425`.
- **Evidence:** The generic `Try Finish review again` button has no `:disabled="attachedReady !== true"` binding, but its handler returns without effect whenever a later unsaved buffer, pending mutation, conflict, unavailable patch, or recovery load makes `attachedReady` false.
- **Impact:** A primary-looking retry can fail silently and omits the adjacent explanation required for disabled Finish states.
- **Fix:** Bind its disabled state to `attachedReady` and render the applicable existing readiness/recovery explanation in that failure branch.

**WARNING 3 — settled export state hides a confirmed receipt instead of leaving it readable.**

- **Locations:** `src/web/components/ExportSection.vue:87-92, 144-148`; locked value supplied from `src/web/components/ReviewPanel.vue:640-659`.
- **Evidence:** `v-if="locked"` replaces every export phase, including `exported`, with only `Review lifecycle is settled. Export controls are unavailable.` The normal `ExportReceipt` branch is therefore unreachable after confirmed completion.
- **Impact:** This conflicts with the completion contract's requirement that existing receipts remain readable while only comment, summary, export, and finish mutations become immutable.
- **Fix:** Render the receipt outside the locked control branch, then suppress or disable export-mutating controls and gitignore mutation controls.

**PASS — CR-01's multi-file Finish guard and recovery are complete.** See the reconciliation above. `CommentComposer.vue:55-102` also uses actual disabled controls while a lifecycle lock is passed, and `App.vue:743-755` fences composer workspace mutations.

---

## Registry Safety

Not applicable. `14-UI-SPEC.md` declares no component registry and `shadcn_initialized: false`.

## Files Audited

- `src/web/App.vue`
- `src/web/components/IdentityHeader.vue`
- `src/web/components/ReviewPanel.vue`
- `src/web/components/CommentComposer.vue`
- `src/web/components/ExportSection.vue`
- `src/web/components/ui/ReviewStateBadge.vue`
- `src/web/styles.css`
- `.planning/phases/14-attached-lifecycle-canonical-completion/14-UI-SPEC.md`
- Prior `.planning/phases/14-attached-lifecycle-canonical-completion/14-UI-REVIEW.md`
