---
phase: 11-workspace-shell-review-surfaces
reviewed: 2026-09-14T09:54:00Z
depth: deep
files_reviewed: 32
files_reviewed_list:
  - scripts/css-token-contract.mjs
  - scripts/verify-semantic-css.mjs
  - src/web/App.vue
  - src/web/components/ActiveFileToolbar.vue
  - src/web/components/ChangedFilesDialog.vue
  - src/web/components/CommentsRail.vue
  - src/web/components/DetailsDialog.vue
  - src/web/components/DiffWorkspace.vue
  - src/web/components/EmptyState.vue
  - src/web/components/FileMetadataPane.vue
  - src/web/components/IdentityHeader.vue
  - src/web/components/IdentityPanel.vue
  - src/web/components/KeyboardHelp.vue
  - src/web/components/ReviewNotesDialog.vue
  - src/web/components/ReviewPanel.vue
  - src/web/components/SelectorDriftNotice.vue
  - src/web/components/ShellFooter.vue
  - src/web/components/StaleAnchorNotice.vue
  - src/web/components/SupportDialog.vue
  - src/web/components/ui/ModalDialog.vue
  - src/web/styles.css
  - tests/e2e/agent-ready-export-safety.spec.ts
  - tests/e2e/anchored-review.spec.ts
  - tests/e2e/complete-review-draft.spec.ts
  - tests/e2e/pinned-session.spec.ts
  - tests/e2e/responsive-session.spec.ts
  - tests/e2e/review-notes-dialog.spec.ts
  - tests/e2e/review-panel-resolved.spec.ts
  - tests/integration/anchored-workspace.spec.ts
  - tests/integration/draft-recovery-ui.spec.ts
  - tests/integration/export-receipt-ui.spec.ts
  - tests/integration/selector-drift-ui.spec.ts
findings:
  critical: 2
  warning: 3
  info: 0
  total: 5
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-09-14T09:54:00Z
**Depth:** deep
**Files Reviewed:** 32
**Status:** issues_found

## Summary

The shell composition, breakpoint boundaries, token checks, and review-surface split were reviewed against `11-UI-SPEC.md`, including lifecycle, focus, warning, and stale-anchor paths. Two contract-breaking behavior defects remain: independent modal state permits stacked active dialogs and the purportedly read-only stale/orphan history can still be resolved, reopened, or deleted. The required full browser suite also does not pass reliably: 88 passed and 5 failed; two failures are the explicitly excluded external-environment specs, while the remaining three are documented below.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Header and warning controls remain active beneath a modal, allowing stacked `aria-modal` dialogs

**Classification:** BLOCKER

**Files:** `src/web/App.vue:864-883,1208-1211`; `src/web/components/IdentityHeader.vue:10,73,120-142`; `src/web/components/StaleAnchorNotice.vue:14-15`

**Issue:** The phase contract requires one shell modal at a time and an inert underlying shell. `App.vue` independently sets `detailsOpen`, `reviewNotesOpen`, `supportDialogOpen`, and `changedFilesOpen`; none of the open handlers closes an existing dialog. Although `App.vue` passes `inert` to `IdentityHeader`, that prop is declared but never rendered on the header. The warning stack is also outside `.review-shell` and receives no inert state. Consequently, while Review notes is open, the active `Details`, `Review notes`, and stale-warning `Open comments` controls remain clickable. Opening Details produces two simultaneous `role="dialog" aria-modal="true"` surfaces. Closing the upper dialog restores focus to its header trigger while the lower dialog remains open, breaking containment as well as the one-dialog rule.

**Fix:** Represent the active shell dialog with one discriminated state (or a single `openShellDialog()` coordinator). It must close/replace the prior shell dialog without restoring focus into a still-covered layer, render only the active modal, and make one root containing the header, warnings, workspace, and footer inert while that state is non-null. Bind the existing `IdentityHeader.inert` prop if retaining the component boundary, and include the warning stack in the inert root. Add an end-to-end test that opens Review notes, attempts Details and stale-warning actions, and asserts exactly one active dialog plus trapped focus.

### CR-02: Stale and orphaned history exposes destructive lifecycle mutations

**Classification:** BLOCKER

**Files:** `src/web/components/ReviewPanel.vue:148-168,362-373,497-528`; `src/web/App.vue:567-570`

**Issue:** `11-UI-SPEC.md:291-296` explicitly makes stale and orphaned records non-actionable: they must never be resolved, reopened, or deleted. The phase only disables `Edit` for `comment.status !== 'verified'`. Both open-card `Resolve`/`Delete` controls and resolved-card `Reopen`/`Delete` controls omit that condition; `runLifecycle()` and `openDeleteConfirmation()` likewise accept an unverified record. `App.vue` then forwards the mutation without checking the workspace comment status. A stale record can therefore be resolved or permanently deleted despite the UI claiming it is read-only history.

**Fix:** Gate every lifecycle and destructive entry point on `comment.status === 'verified'` (including the controls, `runLifecycle`, delete-confirmation path, and the `App.vue` mutation handler as a boundary guard). Keep the existing copy/inspect actions available for unverified records. Extend the stale/orphan integration fixture to assert that Resolve, Reopen, Delete, and their confirmation paths are disabled or absent and emit no draft mutation request.

## Warnings

### WR-01: Responsive forced-close bypasses the dialog's focus-return path

**Classification:** WARNING

**Files:** `src/web/App.vue:938-943`; `src/web/components/ui/ModalDialog.vue:42-48,73-76`

**Issue:** When a Changed files dialog is open and the viewport crosses from narrow to desktop, `handleViewportChange()` directly sets `changedFilesOpen` to false. `ModalDialog` records the opener only on an open transition and restores it only from `dismiss()`, so this path has no restoration. The teleported file tree can retain focus in its newly desktop-mounted filter, rather than returning focus to the exact Files invoker. This violates the focus contract that layout changes do not reset focus and Changed files close/cancellation returns to its opener.

**Fix:** Route all changed-files close paths through one close routine that restores the recorded opener after the Teleport/layout settles, or make `ModalDialog` handle external `open: true -> false` transitions with a reason-aware restore policy. Preserve the selected-file path's documented active-file-heading handoff. Add a narrow-to-desktop viewport-change assertion for focus restoration.

### WR-02: Parallel packaged browser tests race over the shared `dist/` inventory

**Classification:** WARNING

**Files:** `scripts/pack-runtime.mjs:419-420,447-461`; `tests/e2e/anchored-review.spec.ts:216`; `tests/e2e/complete-review-draft.spec.ts:314`

**Issue:** The required full `npm run test:browser` run failed both packaged tests with `runtime producer failed: npm pack inventory does not match source`. The runner invokes `pack-runtime.mjs` concurrently; each invocation rebuilds the shared repository `dist/`, snapshots its inventory, then packs it. Another invocation can overwrite `dist/` between those operations. This matches the reported behavior where the affected packaged paths pass individually but fail in the complete suite, so individual success is not valid evidence.

**Fix:** Make the build/inventory/pack critical section mutually exclusive for test invocations, or build and pack from a per-invocation isolated output tree. Do not rely on individual Playwright retries. Add a focused concurrent-pack regression check or make the packaged test jobs deliberately share a serialization fixture.

### WR-03: Phase-modified selector-drift test uses an ambiguous page-wide label locator

**Classification:** WARNING

**File:** `tests/integration/selector-drift-ui.spec.ts:464-465`

**Issue:** The full browser suite fails this Phase 11-modified test because `page.getByText('POSTIMAGE', { exact: true })` now matches both the new header endpoint label and the Monaco side label. The browser contract is otherwise reached, but Playwright strict mode rejects the ambiguous locator, leaving the suite red.

**Fix:** Scope the assertion to the diff surface, for example `page.getByLabel('src/exact.ts: preimage and postimage side-by-side diff').getByText('POSTIMAGE', { exact: true })`, or assert the intended side-label element directly. Keep the separate banner assertion for the header endpoint label.

---

_Reviewed: 2026-09-14T09:54:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
