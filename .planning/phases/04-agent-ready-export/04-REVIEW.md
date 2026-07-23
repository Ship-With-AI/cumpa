---
phase: 04-agent-ready-export
reviewed: 2026-07-23T19:29:46Z
depth: standard
files_reviewed: 49
files_reviewed_list:
  - binding.gyp
  - playwright.config.ts
  - src/contracts/api.ts
  - src/contracts/draft.ts
  - src/export/render-review-markdown.ts
  - src/export/review-export.ts
  - src/git/comparison.ts
  - src/git/ignore-status.ts
  - src/git/inventory.ts
  - src/native/directory-exchange.cc
  - src/server/app.ts
  - src/server/capabilities.ts
  - src/server/export-store.ts
  - src/server/gitignore-capability.ts
  - src/server/routes.ts
  - src/web/App.vue
  - src/web/api/client.ts
  - src/web/components/DriftExportAcknowledgement.vue
  - src/web/components/ExportProgress.vue
  - src/web/components/ExportReadinessSummary.vue
  - src/web/components/ExportReceipt.vue
  - src/web/components/ExportSection.vue
  - src/web/components/GitignoreStatus.vue
  - src/web/components/ReceiptFileRow.vue
  - src/web/components/ReviewPanel.vue
  - src/web/model/review-draft-state.ts
  - src/web/styles.css
  - tests/api/export-publication.test.ts
  - tests/api/export.test.ts
  - tests/api/gitignore.test.ts
  - tests/e2e/agent-ready-export-safety.spec.ts
  - tests/e2e/agent-ready-export.spec.ts
  - tests/e2e/anchored-review.spec.ts
  - tests/e2e/complete-review-draft.spec.ts
  - tests/e2e/review-panel-resolved.spec.ts
  - tests/git/ignore-status.test.ts
  - tests/git/inventory.test.ts
  - tests/helpers/export-fault-runner.ts
  - tests/helpers/git-fixture.ts
  - tests/helpers/source-control-snapshot.ts
  - tests/integration/agent-ready-export-states.spec.ts
  - tests/integration/export-receipt-ui.spec.ts
  - tests/package/agent-ready-export-safety.test.ts
  - tests/package/agent-ready-export.test.ts
  - tests/unit/agent-ready-export-state.test.ts
  - tests/unit/directory-exchange.test.ts
  - tests/unit/review-export.test.ts
  - tests/unit/review-markdown.test.ts
  - vitest.config.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-07-23T19:29:46Z  
**Depth:** standard  
**Files Reviewed:** 49  
**Status:** issues_found

## Summary

Re-reviewed the Phase 04 export implementation and the remediation for CR-01–CR-03 and WR-01–WR-04. Six findings are resolved with implementation and regression coverage. One critical filesystem-containment race remains: the new parent-directory checks reject pre-existing symlinks, but use pathname `lstat`/`mkdir` without holding no-follow directory handles, so a repository-controlled process can replace a checked component with a symlink before its next use.

Focused remediation verification passed:

```text
npm exec vitest run tests/api/export.test.ts tests/api/gitignore.test.ts tests/unit/review-markdown.test.ts tests/unit/review-export.test.ts

Test Files  4 passed (4)
Tests      23 passed (23)
```

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Parent-directory symlink containment remains vulnerable to a time-of-check/time-of-use swap

**File:** `src/server/export-store.ts:121-138, 148-164, 208-210`; `src/server/capabilities.ts:245-249`  
**Issue:** `ensureManagedExportsRoot()` now correctly rejects an already-symlinked `.diff-review` or `exports` component, and the added tests cover that initial state. It still performs those checks with path-based `lstat()` calls and returns a string path. Between checking `.diff-review` and checking/creating `exports`, or between either check and candidate `mkdir`/`rename`/reveal, another process can replace the component with a symlink. The next path operation follows that replacement. In particular, replacing `.diff-review` after its `lstat()` makes `lstat(<root>/.diff-review/exports)` traverse the external target; a real external `exports` directory then passes the final-component check. This leaves the promised “never follow repository-controlled links outside the managed root” boundary unenforced under concurrent filesystem mutation.

**Fix:** Traverse from the trusted repository root with directory file descriptors opened using no-follow semantics, retain those descriptors through publication/recovery/reveal, and execute child creation, validation, rename/exchange, and cleanup relative to the verified descriptors. At a minimum, revalidate every parent immediately before each operation, but descriptor-relative operations are required to close the race. Add a controlled race/injected-filesystem test that swaps `.diff-review` or `exports` after validation and proves no external path is touched.

**Disposition (accepted residual, 2026-07-23):** `f02b48f` and `3ddbeeb` capture device/inode identities for both literal managed components and revalidate them immediately before publication, recovery, cleanup, and fixed reveal operations. The deterministic injection swaps either component after candidate validation; pre-fix it published the controlled external candidate, while the hardened path detects the identity change, fails publication, and leaves the external candidate unchanged. This is defensive detection, not descriptor-level race elimination: an actively malicious same-UID process can still replace a parent in the interval after a JavaScript syscall check. The approved contract limits the native boundary to the empty `publicationPolicy.targets` matrix, so no packaged descriptor-handle runtime exists; promoting one would contradict 04-03 PLAN lines 87-91 and the approved no-target policy. The residual is explicitly accepted rather than overstated.

## Resolved Findings

### CR-02: Failed append mutation classification — resolved

**Evidence:** `src/server/gitignore-capability.ts:44-74, 162-208` rereads the same no-follow inode after write/sync/close failure and returns distinct `unchanged`, `appendUnconfirmed`, or `ambiguous` outcomes. `src/web/components/GitignoreStatus.vue:17-31, 49-54` presents state-accurate guidance rather than claiming every failure left `.gitignore` unchanged. `tests/api/gitignore.test.ts:146-183` covers partial-write, sync, and close failures; `tests/integration/export-receipt-ui.spec.ts:178-185` covers the changed/ambiguous UI text. The focused API test passed.

### CR-03: Fabricated package execution evidence — resolved

**Evidence:** `tests/package/agent-ready-export.test.ts:72-113` now invokes the packaged Playwright scenario, creates a per-run report path/UUID, and rejects absent, mismatched, or incomplete evidence. `tests/e2e/agent-ready-export.spec.ts:302-324` writes that report only after the generated package, persisted draft, ordered pair, stable files, canonical Markdown, and hashes have been asserted. `executed` is derived from the returned report rather than a literal.

### WR-01: Unescaped selector-label Markdown — resolved

**Evidence:** `src/export/render-review-markdown.ts:34-39` renders both labels with the dynamic fenced-data helper; `tests/unit/review-markdown.test.ts:123-132` supplies backticks/newlines and verifies that fixed applying-agent instructions remain a later structural section. The focused renderer test passed.

### WR-02: Canonical export grouping/order invariants — resolved

**Evidence:** `src/contracts/draft.ts:190-220, 263-299` now compares exact paths and comments, rejects empty groups, duplicate/unsorted paths, anchor/group mismatches, and unsorted comments. `tests/unit/review-export.test.ts:171-208` rejects incoherent and non-deterministically ordered canonical bytes. The focused canonical-export test passed.

### WR-03: Underconstrained receipt pair schema — resolved

**Evidence:** `src/contracts/api.ts:359-399` requires a JSON entry followed by a Markdown entry and refines that both share one comparison directory. `tests/api/export.test.ts:160-169` rejects reversed, duplicate, and mixed-directory pairs. The focused API test passed.

### WR-04: Reveal failure recovery instruction — resolved

**Evidence:** `src/web/components/ExportReceipt.vue:63-66` retains the receipt and focuses an alert instructing users to copy a displayed relative path and open it from the repository root. `tests/integration/export-receipt-ui.spec.ts:141-143` asserts the exact message and focus behavior.

---

_Reviewed: 2026-07-23T19:29:46Z_  
_Reviewer: the agent (gsd-code-reviewer)_  
_Depth: standard_
