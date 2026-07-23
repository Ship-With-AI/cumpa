---
phase: 04-agent-ready-export
plan: "05"
subsystem: web-review-export
status: complete
completed: 2026-07-23
requires:
  - 04-03 native export route and result algebra
provides:
  - explicit accepted-revision export initiation from the Review panel
  - readiness, drift acknowledgement, progress, conflict, read-only, and failure surfaces
  - canonical browser export-operation state with local buffers excluded
  - focused state-contract coverage for export and stale drift acknowledgement
consumers:
  - 04-06 receipt, copy, reveal, and ignore-consent UI
requirements_completed:
  - EXP-01
  - EXP-02
  - EXP-03
  - EXP-04
  - EXP-06
  - EXP-07
  - EXP-08
---

# Phase 04 Plan 05 Summary: Accepted-Revision Export UI

**The existing Review panel now owns a single explicit export path:** it submits only the accepted draft revision and, when required, the latest server-issued opaque acknowledgement token. Local summary/comment buffers remain in browser state, are visibly excluded, and survive failures and reload recovery.

## Completed Tasks

### Task 1 — Accepted-revision readiness and initiation

- Added the typed `/api/export` client call and the canonical export-operation slot to the existing review-draft state owner.
- Added the collapsible Review-panel Export section with accepted revision, actionable/attention/resolved counts, summary presence, effective ignore status, and an exportable zero-actionable empty state.
- Routed the explicit UI action through `App.vue`, which is already the sole browser owner of the session client and review state. It sends `{ expectedRevision }` plus an acknowledgement token only while resolving drift.
- Added visible unsaved-text exclusion and a keyboard-focusable return-to-review action.

**RED commit:** `37e395d` — `test(04-05): add failing accepted export state coverage`  
**GREEN commit:** `bb540a5` — `feat(04-05): wire accepted revision export readiness`

### Task 2 — Drift, progress, conflict, and failure states

- Added bounded pair-level export progress (`preparing`, `validating`, `publishing`) and clears it for every terminal result.
- Added a native-checkbox drift acknowledgement surface that shows the original Base/Head pinned OIDs and current observed identities, resets consent for every new observation, and enables export only after acknowledgement.
- Added focused headings and safe recovery for revision conflicts, read-only drafts, and publication/re-export failures. Retry starts a fresh explicit attempt; no result auto-retries or overwrites a previous confirmed receipt.
- Added responsive export layout, overflow-safe identity values, reduced-motion spinner handling, native controls, status/alert semantics, and review-panel focus transitions.

**RED commit:** `f9c6227` — `test(04-05): add failing drift export progress coverage`  
**GREEN commit:** `11b4c6c` — `feat(04-05): add acknowledged export state handling`

## State Transition and Priority Matrix

| Priority | Browser surface | Transition / safety property |
|---|---|---|
| 1 | Existing inherited recovery/read-only surface | Retains its established ownership; Export never invents a writable draft. |
| 2 | Revision conflict | Shows expected/latest revisions; `Reload latest` restores canonical data without exporting. |
| 3 | Drift acknowledgement | Shows only pinned/current identities; old acknowledgement tokens are rejected; every new observation clears consent. |
| 4 | Publication or re-export failure | Shows no-new-pair wording; retry is explicit and begins a new pair-level attempt. |
| 5 | Pending export | Disables initiators and shows a pair-level status—never per-file success or a premature receipt. |
| 6 | Ready/exported | Shows readiness and permits a new explicit export; receipt/copy/reveal remains owned by 04-06. |

## Buffer-preservation Evidence

The focused contract first failed because `startExport` did not exist, then passed after the canonical state/client path was introduced. The second RED test failed because progress was absent; its GREEN run also caught and fixed an ordering defect where stale-drift completion retained `pending: true`.

The contract asserts that the client request is exactly `{ expectedRevision: 7 }`, canonical accepted content remains unchanged, and unsaved summary/comment buffers survive a `publicationFailed` result. The follow-up contract asserts stale acknowledgement rejection, latest-token acceptance, `preparing` progress, stale-observation replacement, and no re-use of the old token.

## Accessibility and Responsive Observations

[INFERENCE] Source inspection confirms the Export panel uses a labelled `<section>`, native buttons/checkbox, a disclosure control with `aria-expanded`, focused recovery headings, `role="status"` for pair-level progress, and assertive alerting only for changed-again drift/failure/conflict. Existing `.ui-button` target sizing is retained. The export CSS stacks actions and identity rows on narrow screens, allows full OID wrapping, and disables spinner animation under reduced motion.

## Verification

1. Reconciliation preflight, before source edits:

   ```text
   Test Files  15 passed (15)
   Tests       95 passed (95)
   ```

2. Task 1 RED: `review.startExport is not a function` (1 failed file, 1 failed test).
3. Task 2 RED: expected `export.progress` to equal `preparing`; received `undefined` (1 failed file, 1 failed test).
4. Final required ledger command:

   ```text
   Test Files  16 passed (16)
   Tests       97 passed (97)
   ```

   Command:

   ```sh
   node -e "const{readFileSync}=require('node:fs'),{spawnSync}=require('node:child_process'),x=JSON.parse(readFileSync('.planning/phases/04-agent-ready-export/04-01-RECONCILIATION.json','utf8')),c=x.commands['04-05-export-ui-states'];if(!c)throw Error('missing 04-05-export-ui-states');const r=spawnSync(c.executable,c.argv,{cwd:c.cwd,stdio:'inherit'});process.exit(r.status??1)"
   ```

5. Wave-gate direct ReviewPanel mount:

   ```text
   npm run test:package -- tests/e2e/review-panel-resolved.spec.ts
   1 passed (1.5s)
   ```

   The harness now supplies the required accepted revision, canonical ready export state, pinned Base/Head identities, and no-op export event handlers. Production props remain required.

6. Wave-gate anchored workspace integration:

   ```text
   npm run test:package -- tests/integration/anchored-workspace.spec.ts
   5 passed (7.3s)
   ```

   Restored the existing `copyRecordedAnchor` event at the sole App-to-ReviewPanel authority boundary; clipboard behavior and assertions were unchanged.

7. Wave-gate complete review lifecycle:

   ```text
   playwright test tests/e2e/complete-review-draft.spec.ts
   8 cases completed successfully
   ```

   Restored the established `deleteComment` and `reopenComment` mutation bindings at the App-to-ReviewPanel authority boundary; no lifecycle behavior, assertions, or timing changed.

8. UI-audit receipt/recovery contract remediation:

   ```text
   node_modules/.bin/vitest run tests/api/export.test.ts tests/api/export-publication.test.ts tests/unit/agent-ready-export-state.test.ts
   3 files passed; 18 tests passed

   npm run build
   passed
   ```

   The server now emits receipt drift identities from the exact accepted observation and retained pinned comparison. `recoveryRequired` is distinct from ordinary publication failure only when post-publication recovery cannot determine a safe complete pair; it propagates through the route, client result union, App announcement, and canonical review state without adding receipt rendering.

## Deviations

- **[Rule 3 — blocking verification wiring]** The plan names `tests/integration/agent-ready-export-states.spec.ts`, but the immutable reconciliation command only discovers `tests/unit/**`; direct Vitest/Playwright attempts do not discover that integration path under the configured roots. The required integration artifact is present, and its behavior is mirrored in `tests/unit/agent-ready-export-state.test.ts` so the prescribed ledger proves the contract. No runner, config, dependency, or reconciliation ledger was changed.
- **[Rule 3 — existing authority boundary]** `App.vue` was added to the implementation commit although not listed in plan frontmatter. It is the established sole owner of `SessionClient` and `ReviewDraftState`; wiring the explicit request there prevents a second browser authority in a presentation component.

## Files Created or Changed

- `src/web/api/client.ts`
- `src/contracts/api.ts`
- `src/server/capabilities.ts`
- `src/server/export-store.ts`
- `src/server/routes.ts`
- `src/web/model/review-draft-state.ts`
- `src/web/App.vue`
- `src/web/components/ReviewPanel.vue`
- `src/web/components/ExportSection.vue`
- `src/web/components/ExportReadinessSummary.vue`
- `src/web/components/DriftExportAcknowledgement.vue`
- `src/web/components/ExportProgress.vue`
- `src/web/styles.css`
- `tests/integration/agent-ready-export-states.spec.ts`
- `tests/unit/agent-ready-export-state.test.ts`
- `tests/e2e/review-panel-resolved.spec.ts`

- `tests/api/export.test.ts`
- `tests/api/export-publication.test.ts`
- `tests/integration/export-receipt-ui.spec.ts`
## Next Plan Readiness

Plan 04-06 can add only receipt, copy, reveal, and ignore-consent UI to the now-stable core export surface. It must not replace the Review-panel client/state owner or change the accepted-revision and latest-token boundaries.

## Self-Check: PASSED

- All requested core export states are implemented without receipt/copy/reveal/ignore-consent UI.
- RED and GREEN commits exist for both tasks.
- Reconciliation preflight and the final required focused command passed.
- The focused direct ReviewPanel Playwright mount passes with the required export fixture.
- The anchored workspace Playwright spec passes after restoring the existing copy-recorded-anchor binding.
- The complete review lifecycle Playwright spec completes after restoring delete/reopen bindings.
- No dependencies were installed and no formatter, linter, broad browser matrix, or project-wide suite was run; `npm run build` was explicitly required by the UI-audit remediation and passed.
