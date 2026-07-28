---
phase: 07-github-familiar-review-surfaces
reviewed: 2026-07-28T09:33:20Z
depth: standard
files_reviewed: 27
files_reviewed_list:
  - src/web/App.vue
  - src/web/components/CommentComposer.vue
  - src/web/components/DiffWorkspace.vue
  - src/web/components/DraftRecovery.vue
  - src/web/components/DriftExportAcknowledgement.vue
  - src/web/components/ExportProgress.vue
  - src/web/components/ExportReadinessSummary.vue
  - src/web/components/ExportReceipt.vue
  - src/web/components/ExportSection.vue
  - src/web/components/FileMetadataPane.vue
  - src/web/components/GitignoreStatus.vue
  - src/web/components/InlineNotice.vue
  - src/web/components/PathDisplay.vue
  - src/web/components/ReceiptFileRow.vue
  - src/web/components/ReviewPanel.vue
  - src/web/components/ReviewToolbar.vue
  - src/web/components/SelectorDriftNotice.vue
  - src/web/components/SummarySection.vue
  - src/web/components/ui/PathText.vue
  - src/web/components/ui/ReviewStateBadge.vue
  - src/web/components/ui/UiIcon.vue
  - src/web/styles.css
  - tests/e2e/pinned-session.spec.ts
  - tests/e2e/review-panel-resolved.spec.ts
  - tests/integration/anchored-workspace.spec.ts
  - tests/integration/draft-recovery-ui.spec.ts
  - tests/integration/export-receipt-ui.spec.ts
findings:
  critical: 0
  warning: 5
  info: 0
  total: 5
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-07-28T09:33:20Z  
**Depth:** standard  
**Files Reviewed:** 27  
**Status:** issues_found

## Summary

All supplied Phase 07 Vue, CSS, and Playwright artifacts were reviewed against the Phase 07 plans, summaries, and UI contract. Five correctness/accessibility defects remain: accepted comments can outgrow their fixed Monaco zone, export status falsely reports readiness during a revision conflict, ignore-status loading is misreported as unavailable, and two state surfaces contain nested polite live regions that duplicate announcements.

Focused verification executed:

```text
npm run test:browser -- tests/integration/export-receipt-ui.spec.ts --grep "Phase 07 explicit export and status states"
# 1 passed
```

That focused test passes but does not assert the conflicting `ReviewStateBadge` label, so it does not detect WR-02.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: Accepted comment cards never resize the paired Monaco zone

**File:** `src/web/components/DiffWorkspace.vue:90-107`  
**Issue:** The accepted-comment branch renders the conversation card and returns immediately. Unlike the composer path at lines 120-132, it never measures the rendered card or calls `adapter.setAnchorZoneHeight(...)`. The adapter creates both paired zones at 280px, while accepted comment bodies can legally contain up to 100,000 characters. A wrapped accepted card taller than that zone will overflow into code or be clipped, breaking the paired-zone and no-overlay invariant. The current browser fixture covers only short accepted text, so it cannot expose this case.  
**Fix:** After rendering an accepted card, schedule the same `nextTick` measurement used for the composer and call `setAnchorZoneHeight(Math.max(280, contentHeight + 16))`. Add a browser case that persists a long accepted comment, asserts no card/code overlap, and asserts both zones remain equal height.

### WR-02: Revision-conflict status badge is labeled “Ready”

**File:** `src/web/components/ExportSection.vue:39-50`  
**Issue:** `stateKind` correctly maps `phase === 'conflict'` to `error`, but `stateLabel` has no `conflict` case and falls through to `Ready`. During the revision-conflict branch, the Export heading therefore combines an error badge with the contradictory visible label “Ready”, falsely suggesting that export is currently allowed.  
**Fix:** Add an explicit conflict label, for example:

```ts
case 'conflict': return 'Review changed';
```

Then extend `Phase 07 explicit export and status states` to assert the heading badge text for conflict as well as the alert body.

### WR-03: Ignore-status loading is presented as unavailable

**File:** `src/web/components/ExportReadinessSummary.vue:19-23`  
**Issue:** `ignoreStatus === null` means the asynchronous ignore-status check is still pending; `GitignoreStatus.vue` renders this same value as “Checking export directory ignore status”. This component instead labels it `Ignore status unavailable` with the disabled badge. The conflicting state descriptions can cause a reviewer to infer a failure before the check completes.  
**Fix:** Handle `null` separately with `kind: 'pending'` and an explicit “Checking ignore status” label (or omit the readiness badge until a result exists); reserve `disabled`/“unavailable” for a concrete unavailable result.

### WR-04: Recovered-draft success is announced by two nested live regions

**File:** `src/web/components/DraftRecovery.vue:85-91`  
**Issue:** The recovered branch wraps its content in `aria-live="polite"` and nests `InlineNotice role="status"`, which is itself an implicit polite live region. Mounting recovery success can therefore announce the same outcome twice. This also contradicts the phase’s explicit no-second-live-region constraint.  
**Fix:** Keep exactly one announcement owner: remove `aria-live` from the outer receipt section and retain the `status` notice, or preserve the outer live region and render the inner notice as non-live content.

### WR-05: Selector-drift copy feedback is announced twice

**File:** `src/web/components/SelectorDriftNotice.vue:38-43,64`  
**Issue:** The drift notice is `role="status"` (implicit polite live region), while its mutable copy-result paragraph also has `aria-live="polite"`. Updating `copied` changes content in both live-region scopes, producing duplicate copy-result announcements for assistive-technology users.  
**Fix:** Use one live region only. Retain the parent `role="status"` and remove `aria-live` from the copy-result paragraph, or change the parent to a non-live semantic container while retaining the dedicated result announcer.

---

_Reviewed: 2026-07-28T09:33:20Z_  
_Reviewer: the agent (gsd-code-reviewer)_  
_Depth: standard_
