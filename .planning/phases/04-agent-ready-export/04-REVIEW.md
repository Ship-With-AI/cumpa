---
phase: 04-agent-ready-export
reviewed: 2026-07-23T20:33:39Z
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
  critical: 0
  warning: 1
  info: 0
  total: 1
status: issues_found
---

# Phase 04: Code Review Report

## Scope

Reviewed all Phase 04 source, configuration, and test changes, including the
receipt-contract/UI commits `2f8c4e4..e0b7b05` and the preceding repair and
reconciliation work. The final receipt pass specifically checked
server-authoritative comparison/drift data, recovery classification, unsafe
identity/path disclosure, schema/client consistency, and receipt UI use.

## Summary

The receipt is assembled from the pinned server comparison and the server's
drift observation. Its public comparison endpoint intentionally includes only
label, selector type, and object ID; the receipt UI consumes that server result
rather than deriving comparison or drift facts in the browser. The recovery
path remains classified distinctly from a successful receipt, and the reviewed
receipt fields do not disclose worktree or absolute filesystem paths.

One warning remains: the public receipt schema permits contradictory drift
provenance even though the current server producer emits a coherent result.

## Narrative Findings (AI reviewer)

The latest UI contract correctly distinguishes the always-present comparison
from optional acknowledged-drift details. The no-drift and acknowledged-drift
states render from the response's `comparison` and `drift` fields, respectively.
The focused API and receipt-UI checks passed.

## Resolved Findings

### WR-01: Receipt schema accepts internally contradictory drift provenance — Resolved

**Resolved by:** `fd9dedb` on 2026-07-23

The exported receipt no longer carries the duplicate `driftAcknowledged` boolean; `drift.kind` is its sole acknowledgement authority. The exported-result schema now rejects acknowledged drift unless it has exactly one `base` and one `head` identity, with each pinned label, selector type, and OID equal to the matching server-confirmed `comparison` endpoint.

Focused evidence:

```text
node_modules/.bin/vitest run tests/api/export.test.ts tests/api/export-publication.test.ts tests/unit/agent-ready-export-state.test.ts
3 files passed; 20 tests passed

npm run build
passed
```

The API contract includes invalid parse coverage for duplicate roles and mismatched pinned comparison identity, plus a real confirmed export-response assertion. The client continues to select disclosure solely by `drift.kind`.

## Accepted Residual / Threat-Boundary Note

The completed export publication sequence revalidates its path-based identity
at the defined checkpoints. As explicitly accepted for this phase, it does not
attempt descriptor-level protection against a malicious same-UID process
replacing a destination between those checks; the packaged release has no
native target providing that stronger guarantee.

## Verification

Focused checks run after the receipt-contract/UI changes:

- `npm exec vitest run tests/api/export.test.ts` — passed: 1 file, 9 tests.
- `npm exec playwright test tests/integration/export-receipt-ui.spec.ts` —
  passed: 5 tests.
