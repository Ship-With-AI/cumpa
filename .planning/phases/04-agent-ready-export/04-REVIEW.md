---
phase: 04-agent-ready-export
reviewed: 2026-07-23T20:42:40Z
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
  warning: 0
  info: 0
  total: 0
status: passed
---

# Phase 04: Code Review Report

## Scope

Reviewed all Phase 04 source, configuration, and test changes, including the
latest receipt-contract remediation commits `ff3034a`, `fd9dedb`, `9e6f741`,
and `f4f7b1d`. The final receipt pass checked server-authoritative comparison/drift
data, recovery classification, unsafe identity/path disclosure, schema/client
consistency, and receipt UI use.

## Summary

The latest remediation resolves the previous contradictory-provenance finding:
`driftAcknowledged` is removed, and acknowledged receipts now require one base
and one head identity whose pinned label, selector type, and object ID match
their server-authoritative comparison endpoints. The capability producer and
receipt UI remain consistent with that contract. The recovery result remains
distinct from a successful receipt, and reviewed receipt fields do not disclose
worktree or absolute filesystem paths.

One semantic receipt-contract gap remains: an `acknowledged` drift payload can
claim drift even when neither identity has changed or become unavailable.

## Narrative Findings (AI reviewer)

The latest UI contract correctly renders the always-present server comparison
and only renders acknowledged identity details when the server response's
`drift.kind` is `acknowledged`. No browser-derived comparison facts, raw
worktree paths, or stale `driftAcknowledged` field remain.

The schema refinement now blocks duplicate roles, pinned-endpoint mismatches,
and acknowledged payloads without an observed moved or unavailable endpoint.

## Resolved Findings

### WR-01: `acknowledged` receipt can contain no actual drift — Resolved

**Resolved by:** `f4f7b1d` on 2026-07-23

The exported receipt refinement requires at least one acknowledged identity
either to be unavailable or to be available with a `current.oid` different from
its `pinned.oid`. Structurally coherent identities that both still point at
their pinned OIDs are rejected, so the receipt's acknowledgement cannot assert
nonexistent drift.

Focused evidence:

```text
node_modules/.bin/vitest run tests/api/export.test.ts tests/api/export-publication.test.ts tests/unit/agent-ready-export-state.test.ts
3 files passed; 20 tests passed

npm run build
passed
```

The API contract includes an invalid parse case for both current identities
unchanged from their pinned identities. The client continues to use
`drift.kind` as the sole acknowledgement authority.

## Accepted Residual / Threat-Boundary Note

The completed export publication sequence revalidates its path-based identity
at the defined checkpoints. As explicitly accepted for this phase, it does not
attempt descriptor-level protection against a malicious same-UID process
replacing a destination between those checks; the packaged release has no
native target providing that stronger guarantee.

## Verification

Focused check after the latest receipt-contract remediation:

- `npm exec vitest run tests/api/export.test.ts` — passed: 1 file, 10 tests.
