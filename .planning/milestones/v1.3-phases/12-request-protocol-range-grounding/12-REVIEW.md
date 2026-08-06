---
phase: 12-request-protocol-range-grounding
reviewed: 2026-08-04T21:32:43Z
depth: standard
files_reviewed: 33
files_reviewed_list:
  - src/contracts/request.ts
  - src/cli/request.ts
  - tests/cli/request.test.ts
  - src/contracts/comparison.ts
  - src/domain/comparison-key.ts
  - src/domain/errors.ts
  - src/git/comparison.ts
  - src/git/inventory.ts
  - src/git/runner.ts
  - tests/git/comparison.test.ts
  - tests/git/inventory.test.ts
  - tests/unit/comparison-key.test.ts
  - src/cli/run.ts
  - src/contracts/api.ts
  - src/server/capabilities.ts
  - tests/api/session.test.ts
  - src/contracts/draft.ts
  - src/server/app.ts
  - src/server/draft-loader.ts
  - src/server/draft-store.ts
  - tests/unit/draft-load.test.ts
  - tests/api/draft.test.ts
  - src/export/review-export.ts
  - src/export/render-review-markdown.ts
  - src/server/export-store.ts
  - tests/unit/review-export.test.ts
  - tests/api/export.test.ts
  - tests/api/export-publication.test.ts
  - src/web/App.vue
  - src/web/components/IdentityHeader.vue
  - src/web/components/IdentityPanel.vue
  - src/web/styles.css
  - tests/e2e/pinned-session.spec.ts
findings:
  critical: 0
  warning: 2
  info: 0
  total: 2
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-08-04T21:32:43Z  
**Depth:** standard  
**Files Reviewed:** 33  
**Status:** issues_found

## Summary

The request-to-Git-to-session-to-draft/export/UI path is implemented with bounded request decoding, argv-based Git execution, frozen range provenance, strict persisted/export schemas, and server-authoritative UI scope rendering. No blocking finding was identified.

**Classification:** 0 blocking/critical findings; 2 advisory warnings; 0 informational findings. Both warnings concern range requests that are valid but whose provenance/error behavior is inconsistent with the declared pinned-scope contract.

Focused verification passed independently:

```text
npm exec -- vitest run tests/cli/request.test.ts tests/git/comparison.test.ts tests/git/inventory.test.ts tests/unit/comparison-key.test.ts tests/api/session.test.ts tests/unit/draft-load.test.ts tests/api/draft.test.ts tests/unit/review-export.test.ts tests/api/export.test.ts tests/api/export-publication.test.ts

10 files passed, 134 tests passed
```

## Narrative Findings (AI reviewer)

## Critical Issues

None.

## Warnings

### WR-01: Equivalent pinned ranges with different revision labels cannot reopen their draft

**Classification:** WARNING (advisory)  
**File:** `src/server/draft-loader.ts:44-64, 76-80`  
**Issue:** `draftPaths()` namespaces every range draft solely by `range.reviewKey`, and that key is deliberately computed from pinned base/head OIDs plus ordered pathspecs (`src/domain/comparison-key.ts:22-35`). However, `sameComparison()` additionally requires `requestedBase` and `requestedHead` to be byte-identical. Two valid requests such as `main` → `feature` and their resolved full OIDs therefore select the same draft file/queue but reject one another as `schemaInvalid`.

This is not theoretical: the reviewed built module reproduces it. A valid stored draft for labels `main`/`feature` classified against the identical OIDs, identical ordered scope, and OID labels returns `schemaInvalid`. The user then receives a read-only draft rather than being able to resume or create the same pinned review. The current test fixtures use fixed labels (`main~1`/`main`), so they do not cover this collision.

**Fix:** Make the persisted-comparison equivalence and draft namespace use the same identity definition. Since `rangeReviewKey` intentionally excludes inert requested labels, do not treat labels as scope identity; retain the original draft's immutable labels as its export provenance and use that accepted provenance during range export. Alternatively, if labels must distinguish drafts, include them in a new versioned review-key definition and update all path/queue/export contracts together. Do not retain the current mixed rule (same path but unequal comparison).

### WR-02: Any scoped `git diff` exit is reported as invalid pathspec syntax

**Classification:** WARNING (advisory)  
**File:** `src/git/comparison.ts:441-454`  
**Issue:** After passing ancestry and object verification, the range builder catches every `GitRunnerError` with `kind === 'exit'` whenever the pathspec list is non-empty and translates it to `invalid-pathspec`. The predicate does not establish that Git rejected the pathspec. A later diff exit caused by a repository/object failure or another Git failure is therefore mislabeled as invalid syntax, contrary to the Phase 12 contract to preserve unrelated repository/object failures.

`tests/git/inventory.test.ts:418-449` proves the intended invalid-native-magic case only; it does not exercise an unrelated scoped-diff exit, so the broad translation remains unguarded.

**Fix:** Preserve a typed distinction at the inventory/range boundary: translate only an error established as native pathspec rejection to `invalid-pathspec`, while routing other Git exit failures through the existing safe repository/object failure path. Keep raw stderr and submitted pathspec text internal; public diagnostics must remain bounded and non-reflective.

---

_Reviewed: 2026-08-04T21:32:43Z_  
_Reviewer: the agent (gsd-code-reviewer)_  
_Depth: standard_
