---
phase: 12
verified: 2026-09-14T06:41:03Z
status: passed
score: 4/4 must-haves verified
behavior_unverified: 0
visual_equivalence_closed_by: .planning/phases/12-behavior-continuity/12-UI-REVIEW.md (native-scale sign-off 2026-09-14; verdict YES, no unclassified visual difference)
behavior_unverified_items:
  - truth: "The retained desktop and mobile captures are visually equivalent to the approved mockups except for classified departures."
    test: "Compare desktop.png at 1440×1000 with mockups/01b-desktop.png and mobile.png at 420×900 with mockups/01b-mobile.png at native scale."
    expected: "Composition, hierarchy, density, and every visible departure match the Phase 12 UI dossier classifications."
    why_human: "Exact visual equivalence is a design judgment; automated browser tests and image inspection prove provenance, dimensions, and visible states but cannot replace reviewer approval."
overrides_applied: 0
requirements:
  - CON-01
  - CON-02
  - CON-03
human_verification:
  - test: "Perform the native-scale visual comparison specified above, including full-desktop.png only against the Phase 11 wide treatment."
    expected: "Approve the classified production-data differences and inherited departures; identify any unclassified visual difference."
    why_human: "The roadmap explicitly requires exact-viewport visual evidence, and visual equivalence cannot be conclusively established by source inspection or Playwright assertions."
---

# Phase 12: Behavior Continuity — Verification

**Goal:** Reviewers complete the unchanged review-to-export and attached-session workflow while maintainers have packaged and accessibility evidence for the integrated restyle.

**Verified:** 2026-09-14T06:41:03Z  
**Status:** `human_needed`  
**Re-verification:** No — initial verification

## Goal Achievement

Three of four roadmap success criteria are behaviorally verified. The remaining criterion has complete retained, dimension-checked evidence and no unclassified difference was observed in the inspected captures, but final mockup-equivalence approval is a human design judgment.

| # | Roadmap truth | Status | Independent evidence |
|---|---|---|---|
| 1 | A reviewer completes launch → selection → comment → resolve → summary → export → recovery → attached Finish without changing session, draft, persistence, export, handoff, or support mechanics. | VERIFIED | The explicit packaged-runtime command ran all six `agent-ready-export.spec.ts` cases plus `package-assets.spec.ts`: **7 passed**. The runtime test retains accepted mutation HTTP assertions, exported disk bytes/schema/Markdown equivalence, empty-before-Finish stdout, canonical V2/V3 parsing, and source-control assertions (`tests/e2e/agent-ready-export.spec.ts:280-287,420-515,558-840`). The actual dialog implementation owns Summary, Export, receipt, and Finish controls (`src/web/components/ReviewNotesDialog.vue:100-330`) and is opened from the live shell through `App.vue:926-932,1399-1425`. |
| 2 | Packaged Playwright and Vitest continuity contracts pass; presentation-only assertions are updated, not skipped. | VERIFIED within documented external prerequisites | `test:unit` 186/186, `test:git` 69/69, `test:api` 142/142, semantic CSS, web typecheck, and build all exited 0. Full browser run collected 103, with **99 passed, 2 failed, 0 skipped**; its only failures were `marketplace-review.spec.ts:97-99` (missing `CUMPA_MARKETPLACE_URL_MARKER`) and `public-support-states.spec.ts:327-329` (runtime/public-host prerequisites). The two are executable release checks, not skips. The runtime suite's only `.skip(` is the pre-existing local-archive support guard at `agent-ready-export.spec.ts:799`; no `.fixme(` or `describe.skip` exists. |
| 3 | Structural accessibility is rechecked for changed markup: focus reachability, roles, names, and keyboard operation of tree rows/filter, toolbar, and dialogs. | VERIFIED | The new desktop step makes file-navigation controls meaningful, then checks sequential focus `Previous file → Next file → Previous change → Next change → Review → Keyboard help`, unclipped focus, and no page overflow (`tests/e2e/responsive-session.spec.ts:1147-1178`). The full browser run exercised that spec. The actual toolbar has six native named buttons and correct events (`src/web/components/ReviewToolbar.vue:25-96`). |
| 4 | Exact-viewport visual evidence exists for desktop, wide, narrow, dialogs, and warnings; every visible difference is classified. | PRESENT_BEHAVIOR_UNVERIFIED | Seven retained captures exist under `.planning/ui-reviews/12-live-20260914/`; `sips` measured desktop `1440×1000`, full-desktop `1650×900`, mobile and mobile-files `420×900`, and details/review-notes/warning-stack `1440×900`. The UI dossier records `clientWidth === scrollWidth` at 1440, 1650, and 420 and classifies production data, inherited departures, and the Phase 11 toolbar finding (`12-UI-REVIEW.md`). Native-scale human comparison remains required. |

**Score:** 3/4 truths verified; 1 present and behavior-unverified.

## End-to-End Flow and Data Path

| Reviewer step | Actual production path and observable proof |
|---|---|
| Launch / select | A packaged CLI serves the browser session; selected file and Monaco comparison are exercised by `pinned-session.spec.ts:395` and `file-tree.spec.ts:363`, both executed in the 99 passing browser tests. |
| Comment / resolve | The runtime test creates and resolves a Head-side comment; the persisted review state is used after relaunch and read from the accepted draft (`agent-ready-export.spec.ts:389-515`). |
| Summary / export | `openReviewNotes()` locates the named shell trigger and waits for the real dialog (`:251-256`); `saveSummary()` retains the mutation `200` and closes the modal for subsequent shell work (`:280-287`). Export retains `201`, paired `review.json`/`review.md` reads, schema parsing, and Markdown-byte equivalence (`:420-515`). |
| Recovery | The complete draft flow covers relaunch, accepted-state restoration, corrupt-draft backup, and clean replacement (`tests/e2e/complete-review-draft.spec.ts:390-412,670-706`), executed by the full browser run. |
| Attached Finish | All attached cases open Review notes before the relocated Finish controls and still assert `201`, no stdout before Finish, one canonical result afterward, and successful CLI exit (`agent-ready-export.spec.ts:558-840`). The explicit runtime run passed all six cases. |

The dynamic UI is wired, not test-only: `IdentityHeader.vue:141-144` emits the Review notes action; `App.vue:926-932` owns dialog state; `App.vue:1399-1425` passes live review/draft/attached data and handlers into `ReviewNotesDialog.vue`; that component renders `SummarySection`, `ExportSection`, comment counts, and attached completion (`ReviewNotesDialog.vue:151-330`).

## Phase Delta Integrity

The required delta is `840baba^..HEAD`.

- `git diff --name-only 840baba^..HEAD -- src` produced no output: **zero production source files changed**.
- `git diff --name-status 840baba^..HEAD` contains Phase 12 evidence documents, `package.json`, `tests/e2e/agent-ready-export.spec.ts`, and `tests/e2e/responsive-session.spec.ts` only.
- The executable delta is 46 additions and zero deletions: the named runtime-artifact script, the modal-opening helper/call sites, and one accessibility Tab-order step. Existing HTTP, disk-byte, schema, stdout, and source-control checks remain.
- `git diff --check 840baba^..HEAD` exited 0.
- The repair did not weaken coverage: `agent-ready-export.spec.ts` retains all seven `Finish review` locators, one named `Finish attached review` region, the existing response pairings, and exactly one conditional skip (`:799`) for `acceptance.source !== 'local-archive'`.

## Command Evidence

| Command | Result | Observed result |
|---|---|---|
| `npm run test:unit` | PASS | 29 files, **186 passed**. |
| `npm run test:git` | PASS | 9 files, **69 passed**. An earlier concurrent run timed out in `candidates.test.ts`; the mandated serial rerun passed, and the formerly timed case alone passed in 6.08s. |
| `npm run test:api` | PASS | 19 files, **142 passed**. |
| `npm run verify:semantic-css` | PASS | Fresh web build plus canonical-root, retired-vocabulary, and author-style checks passed. |
| `npm run typecheck:web` | PASS | Exit 0. |
| `npm run build` | PASS | Runtime, native addon, Node, and web build completed. |
| `npm run test:browser` | EXPECTED EXTERNAL FAILURE | **99 passed, 2 failed, 0 skipped** out of 103. Only missing marketplace marker and public-runtime/custody prerequisites failed; all six roadmap-named presentation specs executed. |
| `npm run test:runtime-artifact -- tests/e2e/agent-ready-export.spec.ts tests/e2e/package-assets.spec.ts` | PASS | A fresh development-check package was created with a synthetically configured, unreachable support origin and four custody inputs; **7 passed** (six review/export/Finish scenarios plus package assets). Temporary custody and evidence were removed after the run. |

The public-support failure is a real prerequisite boundary: it rejects a `local-archive` and needs published-package/live-host support evidence (`tests/e2e/public-support-states.spec.ts:327-329`). The marketplace test fails before browser work when its supervised marker is absent (`tests/e2e/marketplace-review.spec.ts:97-99`). Neither failure was converted to a skip, marker, published package, or hosted origin.

## Requirement Coverage

| Requirement set | Verdict | Evidence |
|---|---|---|
| VIS-01–03 | SATISFIED | Phase 08 verification records canonical token-root, Monaco theme, and semantic-CSS proof; this phase reran `verify:semantic-css` successfully. |
| TREE-01–05 | SATISFIED | Phase 09 verification records tree semantics and keyboard behavior; Phase 12's full browser run executed `file-tree.spec.ts` and responsive coverage. |
| DIFF-01–03 | SATISFIED | Phase 10 verification records Monaco authority and local overflow; current captures show Base/Head Monaco surfaces and current browser run executes integration Monaco coverage. |
| SHELL-01–05 and REV-01–05 | SATISFIED | Phase 11 verification records the shell/dialog/review surface contracts; current full browser execution includes pinned session, anchored review, complete draft, review notes, and responsive specs. |
| CON-01 | SATISFIED | Packaged attached review/export runtime flow passed six scenarios and maintains the actual review-to-export state path. |
| CON-02 | SATISFIED within documented external-prerequisite boundary | All locally runnable contract suites and all six named presentation-sensitive specs execute; external registry/live-support acceptance remains separately unavailable. |
| CON-03 | SATISFIED | The changed toolbar coverage verifies all six real controls' sequential keyboard order and focus visibility. |

**Requirement conclusion:** implementation and test evidence supports **24/24 active v1.6 requirement IDs**. `.planning/REQUIREMENTS.md:52-54,105-110` and `.planning/ROADMAP.md:147-183` still label CON-01–03 / Phase 12 as Pending or Not started; that is stale planning metadata, not contrary code or test evidence. It must be reconciled by the phase orchestrator, not silently treated as an implementation failure.

## Findings and Deferred Scope

- **Phase 11-owned accessibility finding, not a Phase 12 regression:** `ReviewToolbar.vue:25`, `:26`, `:51`, and `:76` are bare layout `div`s rather than exposed semantic groups. The component has no Phase 12 history (`git log --oneline f810081..HEAD -- src/web/components/ReviewToolbar.vue` was empty). Phase 12 correctly verifies each control individually; it does not resolve this inherited group-container issue.
- **DEFER-04 remains deferred:** broader composited contrast, 320px, and actual 400% zoom re-certification are not claimed.
- No Phase 12 must-have is missing, stubbed, or unwired. No Phase 12 blocker was found.

## Human Verification

1. At native size, compare `desktop.png` with `mockups/01b-desktop.png` and `mobile.png` with `mockups/01b-mobile.png`; compare `full-desktop.png` only with the Phase 11 wide treatment, not a rescaled mockup.
2. Confirm every visible variance remains in one dossier bucket: authorized production data, authorized inherited departure, or the documented Phase 11 toolbar finding. Any unclassified variance is an acceptance failure.
3. Approve or reject the inherited toolbar grouping finding for milestone acceptance; it is documented but not changed by this phase.

No source, test, `STATE.md`, or `ROADMAP.md` files were modified by this verification.

## Human verification — visual equivalence CLOSED 2026-09-14

The native-scale comparison was performed and signed off in `.planning/phases/12-behavior-continuity/12-UI-REVIEW.md`.

**Verdict: YES** — the shipped integrated restyle is visually equivalent to the approved contract except for documented production-data differences and inherited, already-recorded departures.

| Evidence | Result |
|---|---|
| Native raster dimensions verified | desktop 1440×1000, mobile 420×900, full-desktop 1650×900 |
| Retained captures | packaged CLI / ephemeral loopback Fastify evidence; no recapture required |
| 1650×900 wide case | assessed through retained Phase 11 wide-contract evidence; reference raster neither resized nor relabelled |
| Visual-difference classification table | complete; **no unclassified difference found** |

## Remaining item — owner decision, not a Phase 12 defect

The inherited Phase 11 `ReviewToolbar` semantic-group finding (four containers carry `aria-label` or nothing without a queryable `role`, so `getByRole('group', …)` cannot reach them) is recorded in `12-02-SUMMARY.md` against its owning phase. `git log f810081..HEAD -- src/web/components/ReviewToolbar.vue` is empty, so nothing regressed during v1.6 and success criterion 3's "retain" is satisfied. `12-UI-SPEC.md:182` forbids Phase 12 implementing it. Accepting it as recorded debt or scheduling a follow-up is a milestone-level decision.
