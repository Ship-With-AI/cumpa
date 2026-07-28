---
phase: 07-github-familiar-review-surfaces
verified: 2026-07-28T10:10:09Z
status: gaps_found
score: 2/5 roadmap must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "Accepted inline comment cards remain contained in their one paired Monaco zone as their measured content grows."
    status: failed
    reason: "The accepted-comment branch renders and returns before scheduling a height measurement or calling setAnchorZoneHeight. Long accepted text can exceed the initial 280px paired zone."
    artifacts:
      - path: src/web/components/DiffWorkspace.vue
        issue: "Lines 90-122 return after render(); only the composer branch at lines 123-132 calls setAnchorZoneHeight(Math.max(280, contentHeight + 16))."
      - path: tests/integration/anchored-workspace.spec.ts
        issue: "Phase 07 inline conversation states covers short accepted text only; it never persists or measures a long accepted card."
    missing:
      - "Measure the accepted card after render and retain the existing paired-zone height formula."
      - "Add a real-Monaco browser case with a long accepted comment that proves equal paired-zone heights and no code/card overlap."
  - truth: "Every export status conveys a truthful non-color status label, icon, and structural treatment."
    status: failed
    reason: "A revision conflict receives error styling but its heading badge says Ready; ignore-status loading is also described as unavailable in readiness while GitignoreStatus correctly calls it checking."
    artifacts:
      - path: src/web/components/ExportSection.vue
        issue: "stateLabel has no conflict case and falls through to Ready while stateKind maps conflict to error."
      - path: src/web/components/ExportReadinessSummary.vue
        issue: "ignoreStatus === null falls through to disabled / Ignore status unavailable."
    missing:
      - "Map conflict to an explicit non-ready label such as Review changed and assert it in the browser export-state test."
      - "Map null ignore status to pending / Checking ignore status (or omit the badge) and reserve unavailable for a concrete unavailable result."
  - truth: "New notice and recovery presentation preserves one announcement owner for each outcome."
    status: failed
    reason: "Two nested polite live-region pairs duplicate announcements, contrary to the Phase 04/05 prohibitions."
    artifacts:
      - path: src/web/components/DraftRecovery.vue
        issue: "Recovered receipt has aria-live=polite around InlineNotice role=status."
      - path: src/web/components/SelectorDriftNotice.vue
        issue: "Parent role=status contains mutable copied text in a nested aria-live=polite paragraph."
    missing:
      - "Retain exactly one live-region owner in the recovered receipt."
      - "Retain exactly one live-region owner for selector-drift copy feedback and add an accessibility assertion for the chosen owner."
---

# Phase 07: GitHub-Familiar Review Surfaces Verification Report

**Phase Goal:** Users can operate every existing review surface through a close GitHub dark diff adaptation with clear hierarchy and complete interaction-state feedback.

**Verified:** 2026-07-28T10:10:09Z  
**Status:** gaps_found  
**Re-verification:** No — initial verification

## Goal Achievement

### Roadmap Success Criteria

| # | Truth | Status | Code and behavioral evidence |
|---|---|---|---|
| 1 | Current file and Base/Head context appear in a compact header retaining every file/diff control. | ✓ VERIFIED | `App.vue:815-849` composes one `review-context-header` with Base, `PathDisplay`, Head, Files, and `ReviewToolbar`; `ReviewToolbar.vue:24-92` retains six emits, names, tooltips, and disabled expressions. Focused Chromium `Phase 07 header and control states` asserts one two-band header, renamed identity, 7-char OIDs, all controls, and widths 1440→640. |
| 2 | Existing controls have distinguishable rest, hover, pressed, selected, focus, disabled, destructive, and busy feedback. | ✓ VERIFIED | `styles.css:430-530` supplies primary/destructive/icon/selected/busy/spinner contracts; `ReviewToolbar.vue:65-82`, `SummarySection.vue:203-231`, `ReviewPanel.vue:363-579`, `DraftRecovery.vue:165-208`, and export controls consume them. Header test proves 32px icons, disabled-no-hover, selected Review, stable busy bounds, and reduced-motion spinner. |
| 3 | Inline composer and comment cards are clear and operable with anchors, headings, validation, and lifecycle status. | ✗ FAILED | Composer and short-card behavior are wired and the focused Chromium case passed, but `DiffWorkspace.vue:90-122` does not resize an accepted card's paired zone. The invariant fails for permitted long accepted comment content; see G-01. |
| 4 | Review rail has clear heading, count, group, card, form, and selected-comment hierarchy. | ✓ VERIFIED | `App.vue:95,135-139,504-513,899-955` derives transient selection from `focus-comment`; `ReviewPanel.vue:271-585` keeps Summary→Open→Resolved→Export, labeled counts, groups, divider rows, badges, selected state, and local busy verbs. `Phase 07 rail selection follows focus-comment` asserts persistence, transfer, removal, no `aria-selected`, and non-persistence. |
| 5 | Error, warning, information, success, pending, disabled, open, and resolved have text/icon/structural meaning beyond color. | ✗ FAILED | The shared primitives exist (`InlineNotice.vue`, `ReviewStateBadge.vue`, `UiIcon.vue`) and most branches render them, but conflict falsely says Ready, null ignore status falsely says unavailable, and two nested live regions duplicate status announcements; see G-02 and G-03. |

**Score:** 2/5 roadmap must-haves verified.

### Plan Must-Have Coverage

| Plan | Must-have truth(s) checked against code | Status | Exact evidence |
|---|---|---|---|
| 07-01 | Two-band Base/path/Head header; complete renamed/copied identity; icon navigation with retained names/tooltips/disabled semantics; independent control states; inherited wrapping/no new overflow owner. | ✓ VERIFIED | `App.vue:119-121,815-849`; `PathText.vue:7-13`; `PathDisplay.vue:12-42`; `ReviewToolbar.vue:24-92`; `styles.css:481-530,1096-1178`. `anchored-workspace.spec.ts:446-554` asserts header anatomy, path segments, control semantics, state/bounds, reduced motion, and no document overflow. |
| 07-02 | Composer/accepted card anatomy; filename/side/line and fixed-anchor support; field-associated validation/failure/pending; separate lifecycle/anchor badges; one measured paired zone. | ✗ FAILED | `CommentComposer.vue:38-105` and `DiffWorkspace.vue:90-142` supply the first four truths, but the accepted branch returns before measurement. The only `setAnchorZoneHeight(Math.max(280, contentHeight + 16))` is composer-only. `anchored-workspace.spec.ts:555-755` proves short states but lacks a long accepted-card case. |
| 07-03 | Unchanged rail order, labeled counts, one framed group/divider rows, transient durable selection, and pendingFocus-local busy feedback. | ✓ VERIFIED | `ReviewPanel.vue:271-585` and `App.vue:95,135-139,504-513`; style hooks at `styles.css:1534-1668`; production selection test at `anchored-workspace.spec.ts:696-755`; mounted rail browser evidence supplied for `review-panel-resolved.spec.ts`. |
| 07-04 | Shared non-color full notices, unchanged notice semantics/focus/announcements, Summary state feedback, and pinned selector-drift presentation without mutation. | ✗ FAILED | `InlineNotice.vue:4-37`, `SummarySection.vue:43-252`, and `SelectorDriftNotice.vue:36-70` implement the visual structure and preserve state authorities. However, `SelectorDriftNotice.vue:38-43,64` nests its copy live region under `role=status`, so announcement behavior is not preserved as a single owner. |
| 07-05 | Explicit Read only recovery, fixed recovery authority, independent destructive/focus/busy treatment, local pending, and verified-only success/no-replacement failure. | ✗ FAILED | `DraftRecovery.vue:65-208` retains classified load/closures, fingerprint request, confirmation, local spinner, no-replacement text, and verified receipt. Its recovered branch nests `InlineNotice role=status` inside `aria-live=polite`, violating the explicit no-second-live-region prohibition. |
| 07-06 | Framed Export state matrix; explicit-only export; drift acknowledgement; shared stage progress/no partial success; confirmed receipt metadata; optional two-step ignore mutation. | ✗ FAILED | Explicit paths, drift gating, progress, receipts, and two-step ignore are wired in `ExportSection.vue:60-170`, `DriftExportAcknowledgement.vue:36-65`, `ExportProgress.vue:21-28`, `ExportReceipt.vue`, and `GitignoreStatus.vue:73-140`. `ExportSection.vue:35-58` mislabels conflict Ready and `ExportReadinessSummary.vue:19-23` mislabels null loading unavailable. |

**Plan-truth result:** 26/30 plan-level truths verified; four combined plan truths fail because the five concrete remediation gaps below prevent their claimed behavior.

## Requirement Coverage

| Requirement | Contract | Status | Evidence |
|---|---|---|---|
| VIS-04 | Compact current-file/Base/Head header retaining every existing file and diff control. | ✓ VERIFIED | `App.vue:815-849`, `ReviewToolbar.vue:24-92`, `PathDisplay.vue:29-42`; Chromium header case at `anchored-workspace.spec.ts:446-554`. |
| REVW-01 | Complete control-state matrix. | ✓ VERIFIED | Shared state CSS at `styles.css:430-530`; consumed across toolbar, composer, rail, Summary, recovery, and Export. Header Chromium case checks selected, disabled, busy, reduced-motion, and geometry; supplied semantic-CSS audit passed. |
| REVW-02 | Operable dark inline comment cards with anchors, validation, and lifecycle status. | ✗ FAILED | `CommentComposer.vue:38-105` is complete, but `DiffWorkspace.vue:90-122` leaves accepted long cards without measured paired-zone growth; see G-01. |
| REVW-03 | Scannable rail hierarchy with selected-comment presentation. | ✓ VERIFIED | `App.vue:95,135-139,504-513`; `ReviewPanel.vue:271-585`; production selection test `anchored-workspace.spec.ts:696-755` and supplied mounted rail Chromium evidence. |
| REVW-04 | Shared non-color language for every status state. | ✗ FAILED | `UiIcon.vue`, `ReviewStateBadge.vue`, and `InlineNotice.vue` are substantive and wired, but conflict/loading labels and duplicated announcement owners make the status contract misleading or duplicated; see G-02/G-03. |

## Artifact, Wiring, and Data-Flow Checks

All 27 review-supplied Phase 07 source/test artifacts were read. No `TODO`, `FIXME`, or `XXX` debt marker was found under `src/web`, `tests/e2e`, or `tests/integration`.

| Artifact group | Existence / substantive implementation / wiring | Status | Details |
|---|---|---|---|
| Header and primitive artifacts: `App.vue`, `ReviewToolbar.vue`, `PathDisplay.vue`, `ui/PathText.vue`, `ui/UiIcon.vue` | Present / substantive / wired | ✓ VERIFIED | Session endpoint and selected-file data flow through App → PathDisplay/ReviewToolbar; closed local SVG output is decorative. |
| Inline artifacts: `CommentComposer.vue`, `DiffWorkspace.vue`, `ui/ReviewStateBadge.vue` | Present / substantive / partially wired | ✗ FAILED | Composer → existing zone measurement works; accepted-card render → measurement link is missing. |
| Rail/Summary artifacts: `ReviewPanel.vue`, `SummarySection.vue`, `styles.css`, `review-panel-resolved.spec.ts` | Present / substantive / wired | ✓ VERIFIED | App-local selection and `pendingFocus.commentId` flow into the rail; Summary uses existing save/failure state. |
| Notice/metadata artifacts: `InlineNotice.vue`, `FileMetadataPane.vue`, `SelectorDriftNotice.vue`, `pinned-session.spec.ts` | Present / substantive / partially wired | ✗ FAILED | Metadata headings and notice anatomy are wired, but selector copy feedback has a nested live region. |
| Recovery artifacts: `DraftRecovery.vue`, `draft-recovery-ui.spec.ts` | Present / substantive / partially wired | ✗ FAILED | Classified load and fixed closures are real data sources; recovered success duplicates polite announcement ownership. |
| Export artifacts: `ExportSection.vue`, `ExportProgress.vue`, `DriftExportAcknowledgement.vue`, `ExportReceipt.vue`, `ReceiptFileRow.vue`, `GitignoreStatus.vue`, `ExportReadinessSummary.vue`, `export-receipt-ui.spec.ts` | Present / substantive / partially wired | ✗ FAILED | Existing `ReviewExportState` branches feed real UI, and the legacy export spinner is absent, but conflict/null-ignore presentation mapping is incorrect. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `App.vue` | session / selected `SessionFile` | existing session values → Base/Head / `PathDisplay` | ✓ VERIFIED | `App.vue:119-121,815-849` uses only session labels/OIDs and selected file. |
| `ReviewToolbar.vue` | `UiIcon.vue` | four native buttons with accessible names | ✓ VERIFIED | `ReviewToolbar.vue:24-65`; SVG is `aria-hidden` in `UiIcon.vue`. |
| `DiffWorkspace.vue` | Monaco diff adapter | rendered zone → measured paired-zone height | ✗ NOT WIRED for accepted cards | Composer call exists at `DiffWorkspace.vue:123-132`; accepted return at line 122 bypasses it. |
| `App.vue` | `ReviewPanel.vue` | `focus-comment` command → transient selected ID | ✓ VERIFIED | `App.vue:95,135-139,504-513,899-955`. |
| `ExportSection.vue` | `ReviewExportState` | phase → badge/branch mapping | ✗ PARTIAL | `stateKind` maps conflict error, but `stateLabel` omits it (`ExportSection.vue:35-58`). |
| `ExportReadinessSummary.vue` | ignore state | `null` / typed status → readiness badge | ✗ PARTIAL | `GitignoreStatus.vue:76-83` treats null as checking; readiness maps it unavailable at `ExportReadinessSummary.vue:19-23`. |
| `DraftRecovery.vue` / `SelectorDriftNotice.vue` | assistive announcements | existing `status` role → result feedback | ✗ PARTIAL | Both duplicate polite live-region ownership (`DraftRecovery.vue:85-91`; `SelectorDriftNotice.vue:38-43,64`). |

### Data-Flow Trace

| Artifact | Rendered data | Source of truth | Produces real data | Status |
|---|---|---|---|---|
| `App.vue` header | `session.base/head`, `selectedFile` | existing API session state | Yes; no new request/ref resolution | ✓ VERIFIED |
| `DiffWorkspace.vue` card | `currentComment()` / composer | existing workspace comment and active adapter anchor | Yes; accepted card lacks downstream sizing update | ✗ FAILED |
| `ReviewPanel.vue` rail | `workspaceComments`, `selectedCommentId`, pending state | existing workspace command/state projection | Yes | ✓ VERIFIED |
| `ExportSection.vue` | `exportState` | existing `ReviewExportState` | Yes; label mapping is wrong for conflict | ✗ FAILED |
| `DraftRecovery.vue` | `ReadOnlyDraftLoad` / recovered result | existing classified load and fingerprint-bound closure | Yes; announcement wrapper is duplicated | ✗ FAILED |

## Behavioral Spot-Checks and Regression Evidence

| Behavior | Evidence | Result | Status |
|---|---|---|---|
| Short inline composer/accepted lifecycle flow and Monaco geometry | Ran `npm run test:browser -- tests/integration/anchored-workspace.spec.ts --grep "Phase 07 inline conversation states"` | 1 Chromium test passed (3.2s). The test proves short accepted cards only, which exposes its coverage gap for G-01. | ✓ command / ✗ insufficient for long accepted content |
| Explicit export/drift/conflict/progress/failure flow | Ran `npm run test:browser -- tests/integration/export-receipt-ui.spec.ts --grep "Phase 07 explicit export and status states"` | 1 Chromium test passed (3.0s). It asserts the conflict alert but not the contradictory heading badge, so it does not cover G-02. | ✓ command / ✗ insufficient for status label |
| Supplied regression evidence | Reused provided evidence: web typecheck; 3 Monaco unit files / 9 tests; semantic CSS build+audit; 34 integration Chromium tests; 7 packaged Chromium tests. | Reported passed by the assignment; not treated as proof for the five code-level gaps because their assertions do not exercise them. | ✓ regression evidence |

## Advisory Review Validation and Gaps Summary

All five advisory warnings in `07-REVIEW.md` are confirmed against source, not adopted on trust.

| Gap | Severity | Confirmed evidence | Precise remediation |
|---|---|---|---|
| G-01 / WR-01: accepted card zone height | BLOCKER | `DiffWorkspace.vue:90-122` renders an accepted card then returns. `setAnchorZoneHeight(Math.max(280, contentHeight + 16))` appears only in the composer path at lines 123-132. | Schedule the same measured height update after accepted-card render; add long accepted-card real-Monaco no-overlap/equal-height coverage. |
| G-02a / WR-02: conflict badge says Ready | BLOCKER | `ExportSection.vue:35-58` maps conflict to `error` in `stateKind`, but `stateLabel` falls through to `Ready`; `export-receipt-ui.spec.ts:332-377` checks only the alert. | Add explicit conflict label and browser assertion for the heading badge. |
| G-02b / WR-03: null ignore loading says unavailable | BLOCKER | `ExportReadinessSummary.vue:19-23` maps null to disabled/unavailable, whereas `GitignoreStatus.vue:76-83` correctly identifies null as checking. | Map null to pending/Checking ignore status (or omit it); test consistency with the Gitignore surface. |
| G-03a / WR-04: recovered success has two polite live regions | BLOCKER | `DraftRecovery.vue:85-91` nests `InlineNotice role=status` under `aria-live=polite`. | Remove one announcement owner and add an accessibility assertion for exactly one live region. |
| G-03b / WR-05: selector-drift copy feedback has two polite live regions | BLOCKER | `SelectorDriftNotice.vue:38-43` has parent `role=status`; line 64 adds nested `aria-live=polite` for copied text. | Keep one owner (parent status or dedicated result paragraph) and test the chosen announcement contract. |

No override applies: these are unintentional contradictions/missing wiring, not alternate implementations.

## Human Verification Required

None at this point. The unresolved items are deterministic code/test gaps with prescribed remediation; human visual acceptance cannot make them complete. Phase 08's deferred forced-colors, grayscale, 400% zoom, and full continuity checks remain outside this phase by the explicit roadmap boundary.

---

_Verified: 2026-07-28T10:10:09Z_  
_Verifier: the agent (gsd-verifier)_
