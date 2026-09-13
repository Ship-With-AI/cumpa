---
phase: 09-changed-file-tree
reviewed: 2026-09-13T13:21:12Z
depth: deep
files_reviewed: 13
files_reviewed_list:
  - scripts/css-token-contract.mjs
  - src/web/components/DirectoryRow.vue
  - src/web/components/FileRow.vue
  - src/web/components/FileTree.vue
  - src/web/components/PathDisplay.vue
  - src/web/components/ui/PathText.vue
  - src/web/model/file-tree.ts
  - src/web/styles.css
  - tests/e2e/file-tree.spec.ts
  - tests/e2e/pinned-session.spec.ts
  - tests/e2e/responsive-session.spec.ts
  - tests/integration/anchored-workspace.spec.ts
  - tests/unit/file-tree.test.ts
findings:
  blocker: 1
  warning: 2
  info: 0
  total: 3
status: findings
---

# Phase 09: Code Review Report

**Reviewed:** 2026-09-13T13:21:12Z  
**Depth:** deep  
**Files reviewed:** 13  
**Status:** findings

## Summary

The filtered projection itself correctly prunes the already-built tree: it preserves directory IDs, compacted segments, leaf identity, and child ordering; query matching is literal (not regex-based), case-insensitive, and safe for special characters. The derived tab stop also produces one visible `tabindex="0"` row (or none for an empty projection) in the reviewed state transitions.

However, replacing `files` discards the model state that the phase contract explicitly requires to be reconciled by opaque ID. The filter glyph also intercepts pointer input, and the new directory rendering recalculates two tree-wide structures per directory on every filtered projection.

The `pinned-session.spec.ts:1418` narrowing is appropriate: it continues to assert that an unavailable diff has no editable controls in `main.review-main`, rather than incorrectly forbidding the persistent changed-files filter outside that review surface.

## Narrative Findings (AI reviewer)

## Blockers

### BL-01: Replacing `files` silently reselects the first tree leaf and loses tree state

**File:** `src/web/components/FileTree.vue:138-144`  
**Issue:** The `props.files` watcher creates a fresh model and only reapplies the text query. `createFileTreeModel()` seeds the first leaf as selected/focused and all directories expanded, then this watcher emits that new first selection. If a session refresh replaces the array while the currently selected opaque `fileId` still exists, the reviewer is switched to the first sorted file; focus and every expansion choice are reset too. This violates the required replacement reconciliation for selection, focus, and expansion by opaque ID, and can load a different file without a reviewer action.

**Fix:** Add a model-level replacement transition (or equivalent reconciliation immediately before assigning the new model) that:

1. retains the prior selected ID only when it exists in the new tree;
2. retains the prior focused row only when that row still exists in the new projection, otherwise falls back through the normal tab-stop rules;
3. preserves expansion for directory IDs surviving the replacement while default-expanding genuinely new directories; and
4. reapplies the query without emitting `select` when the retained selection is unchanged.

Add a component-level regression test that replaces the `files` prop with a new array retaining selected/collapsed opaque IDs and verifies selected row, expansion, query projection, and sole tab stop remain stable.

## Warnings

### WR-01: Decorative search glyph blocks clicks in the field's left hit area

**File:** `src/web/styles.css:1154-1158`  
**Issue:** The glyph is absolutely positioned over the search input but has no `pointer-events: none`. Clicking the visible search icon targets the inert `aria-hidden` span instead of focusing the input. This is a broken pointer affordance in the filter's padded icon area.

**Fix:** Make the decorative overlay transparent to pointer interaction:

```css
.file-tree-pane__filter-glyph {
  pointer-events: none;
}
```

Add a focused browser assertion that clicking the glyph focuses the `Filter files` searchbox.

### WR-02: Filtered directory rendering has worst-case quadratic recomputation

**File:** `src/web/components/DirectoryRow.vue:25-39`  
**Issue:** Each rendered directory linearly scans `expandedDirectoryIds` and recursively folds its entire subtree for the descendant count. Every filter keystroke creates fresh projected directory objects, invalidating these computed values. For a branching nested tree, summing subtree folds across directory rows is $O(n^2)$; the repeated `includes` checks add another $O(d^2)$ directory-membership cost. This is avoidable per-keystroke work over the complete changed-file tree.

**Fix:** Derive the effective expanded IDs as a `ReadonlySet` and directory descendant counts as a `ReadonlyMap<directoryId, number>` once during model projection/flattening, then pass those structures to recursive rows for $O(1)$ membership and count lookup. Keep the existing projected children as the count source so filtered counts remain correct. Add a focused deep-tree model benchmark or regression test to guard the one-pass derivation.

## Verification

- `npm run test:unit -- --grep "createFileTreeModel"` — passed: 15 tests.
- `npm run test:browser -- tests/e2e/file-tree.spec.ts` — passed: 2 tests.

These focused checks cover the current projection, recovery, matching, and keyboard behavior; they do not exercise the `files`-replacement path, glyph hit area, or a pathological deep tree.

---

_Reviewer: gsd-code-reviewer_
