---
phase: 07-github-familiar-review-surfaces
reviewed: 2026-07-28T12:15:40Z
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
  warning: 1
  info: 0
  total: 1
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-07-28T12:15:40Z  
**Depth:** standard  
**Files Reviewed:** 27  
**Status:** issues_found

## Summary

Reviewed the supplied Phase 07 Vue, CSS, and Playwright scope against the Phase 07 plans, summaries, context, and UI contract. The prior rendering, state-label, and live-region defects are closed. One actionable test-execution defect remains: the documented browser-test script invokes this suite with an unnamed project, while the pinned-session suite rejects that invocation before exercising any behavior.

Focused verification:

```text
npx playwright test --config=playwright.config.ts --project=chromium \
  tests/integration/anchored-workspace.spec.ts \
  tests/integration/draft-recovery-ui.spec.ts \
  tests/integration/export-receipt-ui.spec.ts \
  tests/e2e/review-panel-resolved.spec.ts
# 24 passed

npx playwright test --config=playwright.config.ts --project=chromium \
  tests/e2e/pinned-session.spec.ts
# 6 passed
```

The repository script invocation was also exercised with the same five scoped files:

```text
npm run test:browser -- <the five scoped test files>
# 24 passed, 6 failed
# Every failure: exact Chromium project required, received /chromium
```

## Previously Open Gaps Rechecked

All five prior gaps are closed with current implementation and observable-contract coverage:

1. **Accepted-card paired-zone resizing — closed.** `DiffWorkspace.vue:77-79` centralizes the measured `Math.max(280, contentHeight + 16)` resize; both accepted and composer paths invoke it at `110-112` and `130-132`. `anchored-workspace.spec.ts:655-687` proves a card taller than 280px remains inside equal paired zones and does not overlap subsequent code.
2. **Conflict badge label — closed.** `ExportSection.vue:44-45` explicitly maps `conflict` to `Review changed`; `export-receipt-ui.spec.ts:398-403` proves the error alert and badge are visible and `Ready` is absent.
3. **Null ignore-status label — closed.** `ExportReadinessSummary.vue:19-20` maps `null` to the pending `Checking ignore status` state; `export-receipt-ui.spec.ts:360-363` holds the request and observes that pending state before the concrete result.
4. **Recovery live-region owner — closed.** The recovered receipt's only announcement owner is its `InlineNotice role="status"` at `DraftRecovery.vue:111-115`; the containing card has no live attribute. `draft-recovery-ui.spec.ts:231-235` asserts exactly one owner.
5. **Selector-copy live-region owner — closed.** `SelectorDriftNotice.vue:42-45` retains the parent status owner and its mutable copy text is plain content. `review-panel-resolved.spec.ts:331-333` asserts exactly one rendered polite owner.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: The documented browser-test invocation prevents every pinned-session assertion from running

**File:** `tests/e2e/pinned-session.spec.ts:200-207`  
**Issue:** The suite requires `testInfo.project.name === 'chromium'` in addition to a Chromium browser. The repository's documented `npm run test:browser` invocation supplies `--config=tests`; when run for the supplied scope, Playwright creates an unnamed project and this guard throws `exact Chromium project required, received /chromium` at line 207. Consequently, all six tests in this file fail at their prerequisite guard rather than testing the loopback session, package, metadata, and security contracts. Directly selecting the repository Chromium project makes all six tests pass, proving this is invocation/configuration incompatibility rather than an unsupported browser.

**Fix:** Make the standard browser-test script load the repository configuration that names the Chromium project (for example, `playwright test --config=playwright.config.ts`), or align the guard and configured project naming while retaining the browser-type check. Add a lightweight CI invocation of the documented script so a configuration/name mismatch fails before test behavior is relied upon.

---

_Reviewed: 2026-07-28T12:15:40Z_  
_Reviewer: the agent (gsd-code-reviewer)_  
_Depth: standard_
