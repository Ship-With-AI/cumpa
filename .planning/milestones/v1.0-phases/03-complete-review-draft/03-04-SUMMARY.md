---
phase: 03-complete-review-draft
plan: 04
subsystem: review-ui
tags: [vue, monaco, markdown-it, review-draft, cas]
requires:
  - phase: 03-03
    provides: revision-checked whole-draft mutation API and draft recovery
provides:
  - Canonical/local review draft buffers and deterministic comment projections
  - Mounted Review panel with summary and comment lifecycle controls
  - Inert Markdown preview backed by the approved parser declarations
affects: [03-05, 03-06, 03-07]
tech-stack:
  added: [markdown-it@14.3.0, "@types/markdown-it@14.1.2"]
  patterns: [accepted-response-only canonical replacement, retained local text after conflict]
key-files:
  created: [src/web/model/review-draft-state.ts, src/web/model/comment-groups.ts, src/web/model/markdown-preview.ts, src/web/components/SummarySection.vue, src/web/components/ReviewPanel.vue]
  modified: [src/web/App.vue, src/web/model/workspace-state.ts, src/web/components/CommentsRail.vue]
key-decisions:
  - "Use one review-state controller for canonical snapshots and attempted buffers; workspace comments are derived Monaco annotations."
  - "Allow only http, https, and mailto Markdown links and force safe new-tab attributes."
requirements-completed: [CMT-03, CMT-04, CMT-05, CMT-06, CMT-07, DRFT-04]
duration: 1h
completed: 2026-07-22
status: complete
---

# Phase 03 Plan 04: Complete Review Draft Summary

**A mounted Vue Review panel now derives deterministic open/resolved groups from accepted CAS snapshots while retaining local summary/comment text through failures and conflicts.**

## Dependency Approval and TDD Evidence

- Task 1 approvals were already recorded before this continuation. `markdown-it@14.3.0` was preserved from the approved predecessor handoff.
- Installed exactly `@types/markdown-it@14.1.2`. Its locked tarball is `https://registry.npmjs.org/@types/markdown-it/-/markdown-it-14.1.2.tgz`; verified SRI is `sha512-promo4eFwuiW+TfGxhi+0x3czqTYJkG8qB17ZUJiVF10Xm7NLVRSLUsfRTU/6h1e24VvRnXCx+hG7li58lkzog==`.
- The reconciled compiler check `npm exec tsc -- --noEmit --project tsconfig.json` passed after the parser importer, proving the declarations resolved.
- RED evidence: `2992b72 test(03-04): add failing review state preview tests`; focused unit execution failed first because `review-draft-state` was absent and hostile links lacked safe attributes.
- GREEN evidence: Task 2 and Task 3 focused checks pass below.

## Buffer Transition Matrix

| Transition | Canonical snapshot | Attempted summary/comment buffers |
|---|---|---|
| Accepted mutation | Replaced from API response only | Only successful summary/comment buffer cleared |
| Non-conflict failure | Unchanged | Retained byte-for-byte |
| Revision conflict | Unchanged | Retained byte-for-byte; mutation initiators disabled |
| Reload latest | Explicitly adopts conflict latest snapshot | Retained and marked after reload; no retry/merge/overwrite |
| File switch, panel close, resize, disclosure collapse | Unchanged | Local controller remains intact |

## Hostile Markdown Contract

`renderMarkdownPreview` uses Markdown-it without HTML, linkification, typographer, plugins, highlighting, or generated IDs. Raw HTML is escaped; only `http:`, `https:`, and `mailto:` links are admitted. Accepted links receive `target="_blank" rel="noopener noreferrer"`; `javascript:`, `file:`, and `data:` inputs are inert. Empty local text renders exactly `No summary yet`; rendered HTML is never persisted.

## Monaco and Review Panel Behavior

- `workspace-state` keeps the single existing show-comment command. Verified anchors still select the opaque file capability, wait for readiness, reveal the recorded side/model line, rebuild annotations, center, focus the existing comment zone, and announce—without modifying anchor fields or relocating nearby lines.
- `draft-reconciliation` now preserves canonical open/resolved lifecycle state and creation time instead of attempting to infer it in the panel.
- `App.vue` is the one mutation/client owner. Its review controller is canonical; Monaco workspace comments are refreshed only from accepted responses while preserving per-file view/composer state.
- The existing rail mounts Summary first, then Open groups and one collapsed Resolved disclosure. It has one internal scroll region and keeps panel/buffer state on responsive drawer transitions. Visual wide/drawer/narrow/200% inspection remains a human phase-end review risk; it was not automated by the approved focused command.

## Focused Verification

Resolved ledger command `03-04-task-2-review-panel`:

```text
node -e "const{spawnSync}=require('node:child_process');for(const a of [['run','test:unit','--','tests/unit/comment-groups.test.ts','tests/unit/markdown-preview.test.ts'],['run','test:browser','--','tests/integration/complete-review-panel.spec.ts']]){const r=spawnSync('npm',a,{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1)}"
```

Passed:
- `npm run test:unit -- tests/unit/comment-groups.test.ts tests/unit/markdown-preview.test.ts` (the reconciled runner reported 12 test files / 85 tests passing).
- `npm run test:browser -- tests/integration/complete-review-panel.spec.ts` (1 passed).
- `npm exec tsc -- --noEmit --project tsconfig.json` (passed).

## Task Commits

1. **Task 2 RED: review state/preview tests** — `2992b72` (`test`).
2. **Task 2 GREEN: canonical/local state and safe summary preview** — `ca6a248` (`feat`).
3. **Task 3 GREEN: mounted Review panel lifecycle** — `708c2ee` (`feat`).

## Files Created/Modified

- `package.json`, `package-lock.json` — approved Markdown parser/declaration decision and locked type metadata.
- `src/web/model/review-draft-state.ts` — separate canonical snapshot, pending, conflict, and attempted buffers.
- `src/web/model/comment-groups.ts` — lossless identity grouping and deterministic Base/Head ordering.
- `src/web/model/markdown-preview.ts` — restricted Markdown renderer.
- `src/web/components/SummarySection.vue`, `src/web/components/ReviewPanel.vue`, `src/web/components/CommentsRail.vue` — accessible Review hierarchy and lifecycle controls.
- `src/web/App.vue`, `src/web/model/draft-reconciliation.ts`, `src/web/model/workspace-state.ts` — single-client canonical mutation wiring and derived Monaco annotations.
- `tests/unit/comment-groups.test.ts`, `tests/unit/markdown-preview.test.ts`, `tests/integration/complete-review-panel.spec.ts` — RED/GREEN projection, hostile Markdown, and retained-buffer coverage.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical wiring] Expanded conditional source scope to the actual canonical owners.**
- **Found during:** Task 3.
- **Issue:** The reconciled task list omitted `App.vue` and `draft-reconciliation.ts`; without those owners, an unmounted panel could not access the sole SessionClient/CAS path and lifecycle state would be lost.
- **Fix:** Updated the existing App mutation owner and reconciliation source; no second client, store, canonical index, or Monaco adapter was created.
- **Files modified:** `src/web/App.vue`, `src/web/model/draft-reconciliation.ts`, `src/web/model/workspace-state.ts`.
- **Verification:** focused state/browser command and compiler check passed.
- **Committed in:** `708c2ee`.

**2. [Rule 1 - Regression] Preserved existing optional exact-file behavior in Show comment.**
- **Found during:** Task 3 focused unit verification.
- **Issue:** A stale-anchor guard assumed `exactFile` was always present, breaking an established workspace-state test fixture.
- **Fix:** Kept optional capability handling and no-relocation behavior.
- **Files modified:** `src/web/model/workspace-state.ts`.
- **Verification:** reconciled focused command passed after the repair.
- **Committed in:** `708c2ee`.

**Total deviations:** 2 auto-fixed (1 missing critical wiring, 1 regression).

### Post-wave Regression Repair

**3. [Rule 1 - Regression] Restored anchored-workspace behavior without changing the Review panel contract.**
- **Found during:** Phase 03 post-wave browser feedback loop.
- **Issue:** Accepted mutation responses carry `ReviewDraftV1` canonical records without verification metadata. Passing those records through load-time reconciliation discarded accepted comments; the Review panel also projected full workspace records into reduced group records, losing immutable anchor diagnostics. An asynchronous Monaco file load could clear a just-activated composer anchor.
- **Fix:** Merge accepted canonical lifecycle fields into existing immutable verified records, add the new verified record only after its accepted response, restore full workspace records after deterministic grouping, and reapply the active composer anchor after the current Monaco load completes. The legacy `Comments` locator now uses an exact accessible name because the intentional nested `Open comments` heading is also present.
- **Files modified:** `src/web/App.vue`, `src/web/components/DiffWorkspace.vue`, `src/web/components/CommentsRail.vue`, `src/web/components/ReviewPanel.vue`, `tests/integration/anchored-workspace.spec.ts`.
- **Verification:** `npm run test:browser -- tests/integration/anchored-workspace.spec.ts tests/integration/complete-review-panel.spec.ts` — 6 passed.
- **Committed in:** this commit.

**Total deviations:** 3 auto-fixed (1 missing critical wiring, 2 regressions).

## Exclusion Audit

No soft delete/undo, reply/thread model, optimistic canonical replacement, fuzzy anchor relocation, force overwrite, source mutation, alternate HTTP client, extra Monaco adapter, Phase 4 export control, package version substitution, formatter, linter, build, or project-wide suite was introduced or run.

## Remaining Risks

- The approved browser check validates retained-buffer lifecycle state but does not automate the requested wide/drawer/narrow/200% visual accessibility inspection.
- Stale/unavailable Show remains intentionally non-relocating; the existing workspace command leaves its immutable anchor untouched.

## Self-Check: PASSED
