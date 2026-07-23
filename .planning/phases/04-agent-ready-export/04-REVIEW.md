---
phase: 04-agent-ready-export
reviewed: 2026-07-23T18:32:22Z
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
  critical: 3
  warning: 4
  info: 0
  total: 7
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-07-23T18:32:22Z  
**Depth:** standard  
**Files Reviewed:** 49  
**Status:** issues_found

## Summary

Reviewed the complete Phase 04 export surface: shared schemas and deterministic rendering, server publication/recovery and ignore capability, native exchange probe, API/client/state/UI, test discovery, focused tests, Playwright coverage, package acceptance, and generated-process helpers. The export route correctly keeps browser-controlled filesystem authority out of its request payload and the ordinary candidate-before-stable flow is sound. However, three shipping blockers remain: managed export paths can escape through a repository-controlled parent symlink, failed append operations can mutate `.gitignore` while the UI asserts otherwise, and the package “coverage” test records execution that it never performs.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Managed export directories follow repository-controlled parent symlinks

**File:** `src/server/export-store.ts:117-140, 200-203`; `src/server/capabilities.ts:200-206`  
**Issue:** `resolve()` only proves lexical containment. If an existing repository contains `.diff-review` (or `.diff-review/exports`) as a symlink, `mkdir(exportsRoot, { recursive: true })`, candidate writes, `rename`, cleanup, and `recoverReviewExport()` all follow it. `completePair()` rejects symlinked *children*, but never validates the managed parent components. Consequently an export can create its supposedly repository-local stable pair outside the repository, and the fixed reveal capability can reveal that external location. This violates the closed output-root authority boundary and exposes external files to writes/removal by the process.

**Fix:** Create/validate every managed component below the trusted repository root with no-follow semantics before any read, write, rename, cleanup, recovery, or reveal. Reject an existing `.diff-review` or `exports` component unless it is a real directory owned by the managed traversal; preferably retain directory handles and perform child operations relative to them. Add publication, recovery, and reveal tests where `.diff-review` and `exports` separately point outside the repository.

**Remediation evidence (2026-07-23):** Resolved by `65effe4`, `7875e35`, and `b3df9a3`. `ensureManagedExportsRoot()` validates `.diff-review` and `exports` with `lstat` before use or creation, rejects symlinks and non-directories, and revalidates before candidate cleanup. Publication, recovery, and fixed reveal now all pass through that guard. Focused source API tests passed 11/11; the compiled-package child-process safety test passed 8/8 after `npm run build`. Both `.diff-review` and `exports` are separately symlinked to an external directory in the API, recovery, and generated-package regressions; publication fails closed, recovery rejects, reveal does not invoke its adapter, and the external stable pair remains unchanged.

### CR-02: A failed ignore append can change `.gitignore` while the product reports that it did not

**File:** `src/server/gitignore-capability.ts:150-155`; `src/web/components/GitignoreStatus.vue:92-94`  
**Issue:** `FileHandle.writeFile()` and `sync()` are not all-or-nothing. A disk/full-I/O/close failure may occur after some or all of `addition` reaches the file. The catch returns `{ kind: 'unconfirmed' }` without rereading the file, and the UI maps every such result to “`.gitignore` was not changed” and “existing content was not replaced.” That makes a partial or completed append invisible to the user and permits a retry against unknown bytes, violating the append-only exact-byte safety contract.

**Fix:** On every write, sync, and close failure, reopen the same no-follow inode and inspect its bytes. Distinguish untouched, exactly-appended-but-unconfirmed, and changed/partial states in the result algebra; never claim unchanged for either changed state and do not attempt an unsafe rewrite rollback. Exercise injected partial-write, sync, and close failures, including the UI message for each outcome.

### CR-03: Package acceptance fabricates “executed” requirement and threat coverage

**File:** `tests/package/agent-ready-export.test.ts:27-40, 53-83`  
**Issue:** `evidence()` constructs records with `executed: true` and a hard-coded Playwright command, while `assertUniqueExecutedCoverage()` only reasserts those literals. It never starts the named command or verifies a report from it. The focused command `npm exec vitest run tests/package/agent-ready-export.test.ts` passed in 89 ms while emitting all of the alleged coverage records, demonstrating that the green test can claim every requirement, decision, UI state, and threat was executed without executing those scenarios. This turns the package gate into false acceptance evidence.

**Fix:** Replace the fabricated manifest with assertions over artifacts produced by the actual packaged Playwright run, or remove it and make the real package scenarios directly cover the listed contracts. Do not encode an execution fact as a literal; bind it to the child-process result/report for that exact command and fail when any required scenario is absent.

## Warnings

### WR-01: Selector labels can break the Markdown framing around pinned identities

**File:** `src/export/render-review-markdown.ts:42-43`; `src/contracts/comparison.ts:26-34`  
**Issue:** Base and head labels are interpolated directly inside backticks, but the shared selection schemas allow any non-empty string. A local ref/worktree label containing a backtick and Markdown structure can terminate the inline code span and inject headings or instructions into the exported Markdown. Other untrusted review fields use `appendFencedData()`, so this gap is inconsistent with the explicit rule that untrusted content must not alter the fixed applying-agent instructions.

**Fix:** Render labels through the same dynamically fenced-data helper, or escape backticks and line breaks before inline-code interpolation. Add a renderer regression containing backticks, newlines, and heading-like text in both pinned labels.

### WR-02: Valid “canonical” JSON can contain semantically incoherent or non-deterministically ordered groups

**File:** `src/contracts/draft.ts:184-189, 223-286`; `src/export/review-export.ts:156-162`  
**Issue:** `ReviewExportV1Schema` validates counts and unique comment IDs but accepts empty file groups, duplicate file paths, comments whose `anchor.path` differs from their containing file path, and arbitrary `files`/`comments` array order. `parseCanonicalReviewExport()` then accepts the byte form because JSON canonicalization sorts object keys but deliberately preserves arrays. The builder creates valid order and grouping, but the parser/publication boundary is still advertised as canonical and accepts an externally constructed, valid-but-incoherent document that renders a comment under the wrong path.

**Fix:** Add schema refinements requiring non-empty groups, unique exact file identities, each comment’s exact anchor path to match its group, and the specified total order for file groups and comments. Regression-test rejected duplicate, mismatched, empty, and unsorted candidates through `parseCanonicalReviewExport()`.

### WR-03: Receipt schema does not enforce the exact JSON/Markdown pair that its renderer assumes

**File:** `src/contracts/api.ts:359-375`; `src/web/components/ExportReceipt.vue:27-32, 77-79`  
**Issue:** The API accepts any two independently valid receipt paths, including duplicate names, reversed order, or files from different OID directories. The renderer then labels index zero as `review.json` and index one as `review.md` without inspecting their paths. A malformed but schema-valid response can therefore display a Markdown receipt as JSON or combine hashes from unrelated comparisons, contrary to the exact confirmed-pair receipt contract.

**Fix:** Use distinct receipt schemas for the first JSON and second Markdown entry, capture their common `<base>..<head>` directory segment, and refine that both entries share it. Keep the renderer positional only after this invariant is enforced; add client-schema tests for reversed, duplicate, and mixed-pair receipts.

### WR-04: Reveal failure omits the required usable recovery path

**File:** `src/web/components/ExportReceipt.vue:54-57`  
**Issue:** On reveal failure the receipt tells users only to “Check the terminal details.” The server intentionally does not expose a local path or terminal diagnostic, and the UI specification requires directing the user to copy the already-selectable relative path and open it from the repository root. The current message leaves a successful export harder to recover when the OS file-browser invocation fails.

**Fix:** Replace the failure copy with: “Could not reveal the export directory. Copy the relative path and open it from the repository root.” Preserve the receipt values and focus the adjacent alert after invocation; assert that wording in the receipt UI test.

---

_Reviewed: 2026-07-23T18:32:22Z_  
_Reviewer: the agent (gsd-code-reviewer)_  
_Depth: standard_
