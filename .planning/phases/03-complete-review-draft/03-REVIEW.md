---
phase: 03-complete-review-draft
reviewed: 2026-07-23T08:37:07Z
depth: standard
files_reviewed: 29
files_reviewed_list:
  - package.json
  - src/cli/run.ts
  - src/contracts/api.ts
  - src/contracts/draft.ts
  - src/draft/mutate-draft.ts
  - src/git/selector-drift.ts
  - src/server/app.ts
  - src/server/capabilities.ts
  - src/server/draft-loader.ts
  - src/server/draft-recovery.ts
  - src/server/draft-store.ts
  - src/server/routes.ts
  - src/web/App.vue
  - src/web/api/client.ts
  - src/web/components/CommentsRail.vue
  - src/web/components/DiffWorkspace.vue
  - src/web/components/DraftRecovery.vue
  - src/web/components/FileTree.vue
  - src/web/components/ReviewPanel.vue
  - src/web/components/ReviewToolbar.vue
  - src/web/components/SelectorDriftNotice.vue
  - src/web/components/SummarySection.vue
  - src/web/model/comment-groups.ts
  - src/web/model/draft-reconciliation.ts
  - src/web/model/markdown-preview.ts
  - src/web/model/review-draft-state.ts
  - src/web/model/selector-drift-state.ts
  - src/web/model/workspace-state.ts
  - src/web/styles.css
findings:
  critical: 4
  warning: 0
  info: 0
  total: 4
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-07-23T08:37:07Z  
**Depth:** standard  
**Files Reviewed:** 29  
**Status:** issues_found

## Summary

Reviewed exactly the Phase 3 scope listed in the frontmatter against CMT-03–CMT-07 and DRFT-04–DRFT-06. The CAS/recovery boundaries and fixed-authority routes are generally structured around the intended contracts, but four confirmed lifecycle defects block the phase: worktree drift becomes permanently stale after the first poll; reloading a conflict hides comments added by another tab; and resolved comments expose non-functional edit and delete controls.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Worktree selector drift is cached forever after the first observation

**File:** `src/git/selector-drift.ts:186-193, 212-213`  
**Issue:** `listWorktrees()` memoizes the first `git worktree list --porcelain -z` Promise in `worktreeRecords` and never clears or refreshes it. Every subsequent `/api/selector-drift` poll therefore evaluates a worktree descriptor against the launch-time snapshot. A selected worktree can advance, detach to a new commit, or become unavailable after the initial poll without a visible drift notice, violating DRFT-06's retained-source re-resolution requirement.

**Fix:** Obtain a fresh worktree listing for each observer `observe()` invocation (it may be shared between base and head during that one invocation), rather than retaining it across polls. For example, remove the outer `worktreeRecords` cache and have `listWorktrees()` run and parse the Git command on every call, returning `[]` only for that failed observation.

### CR-02: Reloading the latest draft discards comments added by another tab from the workspace

**File:** `src/web/App.vue:214-225, 241, 338`  
**Issue:** `acceptedWorkspaceComments()` preserves a canonical comment only when it already exists in the local workspace, or is the one locally-added comment supplied as `addedComment`. On a revision conflict, `reloadLatestReview()` calls it with the server's latest draft and no `addedComment`; every comment another tab added is mapped to `[]`. `reviewDraft` receives the latest canonical aggregate, but the Review panel and Monaco annotations are driven by `workspaceComments`, so those accepted remote comments disappear from the visible review and cannot be shown, edited, resolved, or deleted. This contradicts DRFT-04's authoritative latest-draft recovery and CMT-03–CMT-06 lifecycle behavior.

**Fix:** Reconcile every canonical comment that lacks a local record into a complete `WorkspaceComment` before `workspace.replaceComments()`. The reconciliation must preserve an existing record's local verification/view metadata when available and create a deterministic exact-file/anchor record for comments returned by another tab. Prefer returning a comment view with verification from the route, or explicitly reconstruct the verified pinned-anchor projection through the existing reconciliation path, rather than silently omitting unknown IDs.

### CR-03: Resolved comments' Edit button cannot enter an edit UI

**File:** `src/web/components/ReviewPanel.vue:97-131, 139-145`  
**Issue:** The editable textarea/save/cancel branch (`v-if="editing === comment.id"`) exists only inside the open-comment loop. The resolved-comment loop still renders an enabled Edit button at line 142 which sets `editing`, but it has no branch that reads that state. Clicking Edit on a verified resolved comment produces no editable control and cannot issue the supported `editComment` mutation, violating CMT-03 for an existing comment.

**Fix:** Render the same explicit edit/save/cancel state for resolved comments (or extract a shared comment-card component used by both open and resolved loops). Keep the existing pending/conflict disabling and preserve the draft-state buffer until an accepted mutation response.

### CR-04: Resolved comments' Delete button only sets hidden confirmation state

**File:** `src/web/components/ReviewPanel.vue:124-129, 139-145`  
**Issue:** The contextual delete confirmation and its `emit('delete', comment.id)` action are rendered only in the open-comment loop. The resolved-comment Delete button at line 144 merely sets `confirmingDelete`; no resolved-loop confirmation observes that state, so a resolved comment cannot be deleted at all. This leaves the UI advertising an action it cannot perform and violates CMT-04's hard-delete lifecycle.

**Fix:** Render the same contextual second-confirmation control for resolved comments, or centralize the confirmation outside both loops and bind it to the selected comment. The confirming action must emit the resolved comment's ID and clear `confirmingDelete` only after dispatching the existing delete request.

---

_Reviewed: 2026-07-23T08:37:07Z_  
_Reviewer: the agent (gsd-code-reviewer)_  
_Depth: standard_
