---
phase: 02-anchored-diff-review
reviewed: 2026-07-21T14:17:52Z
depth: standard
files_reviewed: 37
files_reviewed_list:
  - package.json
  - scripts/verify-prerequisites.mjs
  - scripts/verify-production-artifacts.mjs
  - src/contracts/api.ts
  - src/contracts/draft.ts
  - src/domain/anchor.ts
  - src/domain/comparison-key.ts
  - src/server/app.ts
  - src/server/capabilities.ts
  - src/server/draft-store.ts
  - src/server/routes.ts
  - src/web/App.vue
  - src/web/api/client.ts
  - src/web/components/CommentComposer.vue
  - src/web/components/CommentsRail.vue
  - src/web/components/DiffWorkspace.vue
  - src/web/components/KeyboardHelp.vue
  - src/web/components/ReviewToolbar.vue
  - src/web/components/ui/UiPrimitives.vue
  - src/web/model/workspace-state.ts
  - src/web/monaco/configure.ts
  - src/web/monaco/diff-adapter.ts
  - src/web/monaco/line-mapping.ts
  - src/web/prototypes/MonacoStabilityPrototype.vue
  - src/web/styles.css
  - tests/api/anchor.test.ts
  - tests/api/draft-atomicity.test.ts
  - tests/api/draft.test.ts
  - tests/e2e/anchored-review.spec.ts
  - tests/git/anchored-content.test.ts
  - tests/helpers/git-fixture.ts
  - tests/integration/anchored-workspace.spec.ts
  - tests/integration/monaco-anchor.spec.ts
  - tests/unit/anchor.test.ts
  - tests/unit/comparison-key.test.ts
  - tests/unit/line-mapping.test.ts
  - tests/unit/workspace-state.test.ts
findings:
  critical: 4
  warning: 3
  info: 0
  total: 7
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-07-21T14:17:52Z  
**Depth:** standard  
**Files Reviewed:** 37  
**Status:** issues_found

## Summary

The review covered every existing source and test file changed by the Phase 02 implementation commits represented by the seven Phase 02 summaries; planning artifacts and the lockfile were excluded. The server-side capability boundary, strict schemas, length-framed comparison identity, and temp-sync-rename draft protocol are generally coherent. The browser composition, however, does not yet satisfy several core anchored-review interactions: pointer anchoring is limited to line 1, a composer is rendered twice, exact persisted path identity is discarded on resume, and stale/orphan actions are not actionable.

## Critical Issues

### CR-01: Pointer comment controls can anchor only line 1

**Severity:** BLOCKER  
**File:** `src/web/components/DiffWorkspace.vue:118-120, 159-180`  
**Issue:** The two visible buttons call `addComment('base' | 'head')`, which unconditionally invokes `adapter.activateAnchor(side, 1)`. They are fixed at the top of the diff surface rather than being associated with a hovered/focused model line. Mouse users therefore cannot add a comment to any line except line 1. This violates the phase's required pointer/keyboard parity and makes normal line review impossible without knowing and using the Monaco keyboard action.

**Fix:** Create side-specific gutter affordances from the public Monaco editor's current visible model-line interaction, and route their click through the same `activateAnchor(side, modelLine)` path used by the keyboard action. Remove the hard-coded line-1 controls. Add a Chromium test that pointer-anchors at least a non-first base line and a non-first head line, then asserts the persisted anchor line.

### CR-02: One active composer is rendered twice

**Severity:** BLOCKER  
**File:** `src/web/components/DiffWorkspace.vue:59-83, 183-198`  
**Issue:** `renderAnnotation()` mounts `CommentComposer` into the Monaco composer view zone at lines 75-83, while the template independently renders another `CommentComposer` as a direct child of `.diff-workspace` at lines 183-198 whenever `composer` exists. This produces two interactive forms for the same draft: one inline and one after the entire editor, violating the one-composer and exact-line placement contract. It also creates duplicate controls and textarea labels for assistive technology.

The focused browser test does not expose this: `tests/integration/anchored-workspace.spec.ts:154` intentionally selects `.diff-workspace > section.inline-comment-composer textarea`, i.e. the non-Monaco direct-child instance, not the composer in the editor-owned zone.

**Fix:** Keep a single owner for the form. Render `CommentComposer` only into the paired Monaco view zone (with an explicit non-Monaco fallback only when that strategy is unavailable), or remove the view-zone Vue mount and use one correctly anchored component. Update the browser test to assert exactly one `Comment` textarea and that its bounding box is immediately below the selected model line.

### CR-03: Draft resume uses lossy display text as path authority

**Severity:** BLOCKER  
**File:** `src/web/App.vue:88-105`  
**Issue:** `draftComment()` discards the persisted `anchor.path.bytesBase64url` and finds a live file solely by `path.display === anchor.safeDisplayPath`. `display` is explicitly presentation data: `src/domain/path-bytes.ts:45-50` decodes invalid UTF-8 with replacement characters before making it safe for display. Distinct valid Git pathname byte sequences can consequently share the same display string. When that happens, `matchingFiles.length !== 1`, the resumed verified comment receives the fabricated `unavailable:*` ID, and it can neither render inline nor navigate to its exact pinned file.

This breaks the immutable byte-path anchoring contract for repositories with arbitrary Git filename bytes.

**Fix:** Preserve the complete durable anchor path in the client-side draft comment type and resolve the side's `oldPath`/`newPath` by `bytesBase64url` (and, defensively, the side/blob identity), never by `display` or `safeDisplayPath`. Add a Git/browser fixture with two distinct non-UTF-8 paths whose replacement-decoded display strings collide, then verify both comments resume and navigate independently.

### CR-04: Stale and orphaned rail actions are dead and omit the required recovery action

**Severity:** BLOCKER  
**File:** `src/web/components/CommentsRail.vue:39-45`; `src/web/App.vue:394-395`; `src/web/model/workspace-state.ts:213-216`  
**Issue:** Every stale or orphaned record displays `Inspect recorded file`, but both `inspect` and `show` are wired to the same `show-comment` event. `showComment()` immediately returns unchanged state for any comment whose status is not `verified`. The displayed action therefore has no effect. In addition, neither stale nor orphaned record offers the required `Copy anchor details` action, and orphaned records display inspection even when their file capability was deliberately marked unavailable.

**Fix:** Model a distinct inspect command that selects the exact opaque file only when its capability exists, keeps focus on the stale/orphan rail record, and never places an inline annotation. Include immutable recorded details in the rail view model and implement `Copy anchor details`; suppress inspection when no capability exists. Cover verified, stale-with-file, and orphan-without-file actions in the browser flow.

## Warnings

### WR-01: Confirming a move discards the draft but never performs the requested move

**File:** `src/web/model/workspace-state.ts:154-161, 291-295`; `src/web/components/CommentComposer.vue:43-46`  
**Issue:** Activating a new line while a non-empty composer exists changes its status to `confirm-move`, but stores neither the requested side nor line. The only destructive event is `confirm-discard`, and that reducer only accepts `confirm-discard` status—not `confirm-move`—so clicking `Discard draft` during a move confirmation produces no transition. The user cannot complete the requested move without cancelling and manually activating the target again.

**Fix:** Store the requested target in the confirmation state and add a confirm-move event that atomically discards the old text and creates a ready composer at that target. Keep `Keep writing` restoring the original anchor. Extend `workspace-state.test.ts` to dispatch the destructive move confirmation and assert the target side/line.

### WR-02: Responsive drawers remain keyboard-focusable while visually closed, and the medium-width comments drawer lacks its close control

**File:** `src/web/App.vue:323-325, 385-389`; `src/web/styles.css:1297-1315, 1327-1345`  
**Issue:** At widths below 1440px the comments rail is hidden only with `transform: translateX(100%)`; below 1100px the file navigation is hidden similarly. Both remain mounted with all focusable descendants active, so Tab can move focus into offscreen controls. Further, the comments drawer starts at 1439px but its visible `Close comments` button is conditional on `isNarrow` (defined at `max-width: 1099px`), so the 1100–1439px drawer has no required close control.

**Fix:** Bind `inert` (or conditionally render with a focus-safe transition) while each drawer is closed, move focus to its heading after opening, and restore focus to its trigger after closing. Use a comments-drawer breakpoint/state distinct from the files drawer so `Close comments` is available throughout the 1100–1439px range. Add keyboard Tab/Escape browser coverage at 1200px and 768px.

### WR-03: Opening a composer does not move focus to its Comment textarea

**File:** `src/web/components/DiffWorkspace.vue:75-83, 104-115`; `src/web/monaco/diff-adapter.ts:166-179`  
**Issue:** Opening an anchor calls `activateAnchor()`, which focuses the Monaco editor at line 175. After the Vue composer is mounted, neither the adapter nor `renderAnnotation()` focuses its textarea. Keyboard users therefore remain in the editor instead of reaching the newly opened `Comment` field, contrary to the specified composer focus transition.

**Fix:** Expose a post-render focus operation from the active zone/component and invoke it after the composer is mounted; preserve the originating gutter/editor focus only for the empty-discard path. Add a browser assertion that the active element is the `Comment` textarea immediately after pointer and Option/Alt+Enter activation.

## Phase Risk Assessment

**High risk until blockers are fixed.** The persistence backend preserves immutable server-derived anchors and does not optimistically accept writes, but the UI currently loses or misroutes anchors at the exact client boundary where reviewers create, resume, and inspect them. These defects affect normal pointer review, arbitrary-byte repositories, and stale/orphan recovery—not merely presentation polish.

## Verification

- Reviewed the 37 scoped source/test files at standard depth, including API contracts, persistence, Monaco lifecycle, responsive/accessibility behavior, and packaged browser coverage.
- Ran the focused existing browser check: `npm run test:browser -- tests/integration/anchored-workspace.spec.ts --grep "inline comment persistence"` — **passed** (1 Chromium test, 3.0s). Its direct-child selector is specifically why it does not detect CR-02.
- No formatter, linter, project-wide test suite, source edit, or generated-file change was performed.

---

_Reviewed: 2026-07-21T14:17:52Z_  
_Reviewer: the agent (gsd-code-reviewer)_  
_Depth: standard_
