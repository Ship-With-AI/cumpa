---
phase: 04-agent-ready-export
plan: 06
subsystem: web-export-receipt
status: complete
requires:
  - 04-05 accepted-revision export state and SessionClient authority
provides:
  - server-confirmed export receipt presentation and copy/reveal actions
  - append-only fixed ignore-consent interaction
  - focused browser coverage for receipt and ignore-consent failures
commits:
  - 349f3f2
  - cd11764
  - 1202b15
  - 1125ffb
  - ebd8e47
---

# Phase 04 Plan 06 Summary

Implemented the browser receipt and consent surface without creating a second export authority. `App.vue` remains the sole owner of `SessionClient` and `ReviewDraftState`; presentation components receive only server-confirmed state and fixed callbacks.

## Delivered

### Task 1 — explicit ignore consent

- Added no-argument `SessionClient` methods for `POST /api/export/gitignore` and `POST /api/export/reveal`; both omit a body and browser-selected path/query values.
- Loaded the server-reported ignore status into existing `ReviewDraftState.export.ignoreStatus`.
- Added `GitignoreStatus.vue`: ignored, warning, and unavailable states stay visible and export remains available.
- The first **Add to .gitignore** action is local-only. It reveals an inline confirmation, focuses **Keep .gitignore unchanged**, supports Escape, and makes no request until **Append ignore rule** is activated.
- Successful append rechecks server status. Failure retains the warning and offers bounded retry or safe decline. Escape propagation is stopped so the review panel stays open and focus returns to the first action.

### Task 2 — confirmed receipt, copy, and reveal

- Added `ExportReceipt.vue` and `ReceiptFileRow.vue` to show only the exact confirmed `draftRevision`, ISO timestamp, drift flag, two fixed receipt files, full server paths, SHA-256 digests, and byte counts.
- Receipt rows use the fixed tuple order (`review.json`, then `review.md`); the browser neither derives artifact paths nor recomputes receipt evidence.
- Added individual path and full-receipt copy actions with visible manual-recovery text on clipboard failure.
- Added fixed no-argument reveal action. A reveal failure is an adjacent alert and leaves the receipt intact.
- Failed/re-export-unsupported state presents the earlier confirmed pair as **Previous confirmed export**, never as a new publication.
- Added responsive receipt metadata/rows, opaque-value horizontal scrolling only inside the value, and the existing reduced-motion spinner treatment remains intact.

### Reused predecessor interfaces

`SessionClient.exportReview({ expectedRevision, driftAcknowledgementToken? })` and the 04-05 `ReviewDraftState` export snapshot remain the only export authority. This plan consumed the existing `receipt`, `previousConfirmedReceipt`, `ignoreStatus`, and `failure` fields, and added only fixed zero-argument callbacks:

| Callback | Route | Browser authority |
|---|---|---|
| `appendDiffReviewIgnoreRule()` | `POST /api/export/gitignore` | None: no path, query, or body |
| `revealExportDirectory()` | `POST /api/export/reveal` | None: no path, query, or body |

`App.vue` owns these callbacks and passes them through `ReviewPanel` to `ExportSection`; neither presentation component constructs a client or mutates core export state.

### Ignore-consent outcome matrix

| Status/action | Request | UI result |
|---|---|---|
| `ignored` | None | Neutral confirmation; no append action |
| `notIgnored` → first Add | None | Persistent warning and inline confirmation, focus on Keep |
| confirmation Escape/Keep | None | Warning persists; focus returns to Add |
| confirmation Append | One fixed `POST` | Appends or reports failure, then rechecks status on success |
| append failure | No further authority | Warning, retry, and decline remain available; export is never blocked |
| `unavailable` | None | Bounded error explaining export can continue without `.gitignore` changes |

### CR-02 bounded append outcomes

Review remediation `0e7341f` extends the fixed no-argument consent result algebra without granting any new browser authority:

| Failure inspection result | UI copy | Retry safety |
|---|---|---|
| `unchanged` | `.gitignore was not changed. You can retry the append.` | Retry can request the same fixed rule. |
| `appendUnconfirmed` | Exact rule is present, but durability could not be confirmed. | No rollback or duplicate rule is attempted; status can be refreshed. |
| `ambiguous` or `unconfirmed` | `.gitignore may have changed` or state could not be confirmed. | User must inspect before retrying; no unchanged claim is made. |

The focused browser result test covers all three rendered outcomes after the existing second confirmation.

## TDD and verification

1. **RED** `349f3f2`: added fixed-capability client coverage; it failed because `revealExportDirectory` did not exist.
2. **GREEN** `cd11764`: implemented the client and consent flow; `playwright test tests/integration/agent-ready-export-states.spec.ts` passed **3/3**.
3. **RED** `1202b15`: added browser receipt coverage; it failed because no `Review export complete` receipt region existed.
4. **GREEN** `ebd8e47`: receipt and interaction coverage passed with:
   ```text
   node_modules/.bin/playwright test tests/integration/agent-ready-export-states.spec.ts tests/integration/export-receipt-ui.spec.ts
   5 passed
   ```
5. The prescribed integration command ran after implementation. It passed **25/26**; the sole failure is the pre-existing, repeatedly reproduced `tests/integration/anchored-workspace.spec.ts:458` clipboard-status assertion, unrelated to 04-06. It failed before 04-06 source edits on two runs and after implementation on the final run.
6. Discovery repair verification: `npm run test:package` collected only the 47 browser `*.spec.ts` suites—no Vitest `*.test.ts` files were handed to Playwright. It completed with 44 passes and three non-04-06 E2E failures: `anchored-review.spec.ts:222`, plus `complete-review-draft.spec.ts:315` and `:425`. The 04-06 focused browser command still passed **5/5** after this repair.
7. Direct `ReviewPanel` fixture repair: supplied fixed typed capability callbacks (`alreadyIgnored`, `revealed`, and status refresh) only at the E2E harness boundary. `node_modules/.bin/playwright test tests/e2e/review-panel-resolved.spec.ts` passed **1/1** with no Vue missing-prop warnings.
8. **WR-04 RED/GREEN:** `e6ac613` first proved the old terminal-only reveal failure copy; `abb4bc8` now preserves the full receipt, moves focus to its adjacent alert, and says: “Reveal failed; copy a displayed relative path and open it from the repository root.” Focused receipt browser coverage passed **3/3** and `npm run build` passed.

9. **UI audit remediation RED/GREEN:** `53145bb` first required all seven receipt/export UI audit contracts; it failed on old copy confirmation wording and the missing recovery-required surface. `b760f0c` renders the server-confirmed `receipt.drift` union only (never reconstructed selector data), exposes full pinned/current identities in a neutral disclosure with selectable/copyable values, distinguishes **Export needs recovery**, retains a failed re-export’s receipt as **Previous confirmed export**, uses exact copy confirmations, isolates Escape in conflict/error/recovery surfaces, gives each file row one complete accessible description, applies explicit 12/14/18px typography roles, and proves no document-level horizontal scroll at 768px and 360px responsive widths. `node_modules/.bin/playwright test tests/integration/export-receipt-ui.spec.ts` passed **4/4**; `npm run build` passed.

10. **Final UI-01/UI-03 RED/GREEN:** after Plan 05 added the server-confirmed receipt comparison union, `7436482` proved the missing required receipt body and universal no-drift `Comparison` disclosure (2 focused failures). `292b9b5` renders every receipt’s non-mutating comparison disclosure from `receipt.comparison` with the full Base/Head OIDs and server labels/types; acknowledged drift adds full pinned/current label/type/OID details, including the unavailable representation. It also uses the exact receipt body, drift label, post-row `Copy all receipt details` action, generic adjacent copy recovery, and exact reveal recovery. The focused receipt suite passed **5/5** and `npm run build` passed.

## Reconciliation and deviation

- Pre-edit reconciliation preflight passed:
  ```text
  node .planning/phases/04-agent-ready-export/validate-reconciliation.mjs .planning/phases/04-agent-ready-export/04-01-RECONCILIATION.json
  reconciliation ledger valid: 04-01-RECONCILIATION.json
  ```
- Rule 3 deviation: changed Playwright `testDir` from `tests/e2e` to `tests` so the ledger-prescribed `playwright test tests/integration` command discovers its target files, then added the explicit `testMatch: '**/*.spec.ts'` boundary when the broader root caused Playwright to collect Vitest files. The package command now sees browser suites only. No dependency or product runtime configuration changed.

## Files

- `src/web/api/client.ts`
- `src/web/App.vue`
- `src/web/components/ReviewPanel.vue`
- `src/web/components/ExportSection.vue`
- `src/web/components/GitignoreStatus.vue`
- `src/web/components/ExportReceipt.vue`
- `src/web/components/ReceiptFileRow.vue`
- `src/web/styles.css`
- `playwright.config.ts`
- `tests/integration/agent-ready-export-states.spec.ts`
- `tests/integration/export-receipt-ui.spec.ts`

## Self-check

- Task commits exist and are separated into RED/GREEN feature steps, with the Escape focus repair isolated.
- Receipt values originate from the `exported` server result and are retained only through existing `previousConfirmedReceipt` state.
- Browser tests exercise no-body fixed capability calls, copy success, reveal failure, re-export failure retention, 320px receipt containment, and keyboard-safe ignore consent.
- No untracked user-owned `.bg-shell/`, `.gsd/`, `local:/`, or planning review/forensics artifacts were staged.
