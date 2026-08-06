---
phase: 14-attached-lifecycle-canonical-completion
verified: 2026-08-06T08:58:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: passed
  previous_score: 5/5
  gaps_closed:
    - "CR-01: an unsaved inline composer in another file disabled Finish without identifying the blocking draft or providing a recovery path."
  gaps_remaining: []
  regressions: []
---

# Phase 14: Attached Lifecycle & Canonical Completion Verification Report

**Phase Goal:** Developers can complete either agent-submitted review in the existing browser workspace and the waiting agent receives one exact, validated result.
**Verified:** 2026-08-06T08:58:00Z
**Status:** passed
**Re-verification:** Yes — closure review after `e0f6c45` CR-01 remediation.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Current-source and focused-evidence basis |
|---|---|---|---|
| 1 | Range and patch requests open the existing authenticated browser workspace with navigation, Monaco diffs, comments, summary, persistence, and ordinary export intact. | ✓ VERIFIED | `src/cli/run.ts` funnels both non-TTY range and exact-patch launches through `launchAttachedSession`; its factories pass the optional attachment only to `createSessionApp`/`createExactPatchSessionApp`. `src/server/capabilities.ts` conditionally exposes `session.attached` while preserving the existing frozen session/file capabilities. `ReviewPanel.vue` retains its existing `ExportSection` immediately before the conditional completion section. |
| 2 | Only explicit Finish reports completion; close, reload, disconnect, and ordinary export leave an attached review unfinished. | ✓ VERIFIED | The attached-only authenticated route in `src/server/routes.ts` is `POST /api/review-completion/finish`; `App.vue` has the sole `sessionClient.finishReview()` call in `finishAttachedReview()`. `ReviewPanel.vue` explicitly states that export, closing, reloading, and disconnecting leave the review unfinished and renders recovery, not success, for disconnects. |
| 3 | The invoking CLI remains attached until completion and emits exactly one canonical JSON success document on stdout; URLs, progress, and diagnostics use stderr. | ✓ VERIFIED | `launchAttachedSession()` awaits `coordinator.delivery`; only `completed` continues to `coordinator.responseSettled` and successful shutdown. Its injected `stdout` sink is reached only through `coordinator.runDelivery()`, while launcher messages use `dependencies.output ?? console.error`. The established Phase 14 CLI/package regression evidence remains applicable; current source retains that ordering. |
| 4 | Returned JSON binds accepted feedback and durable anchors to the exact submitted range/pathspec or patch identity. | ✓ VERIFIED | Range completion builds and canonicalizes `ReviewExportV2` only after frozen scope and durable-anchor verification; exact-patch completion equivalently builds `ReviewExportV3`. Both `finalize` paths re-check scope/anchors and parse the prepared canonical bytes, including schema version and accepted revision, before delivery (`src/server/capabilities.ts`). |
| 5 | Finish settles pending draft state and validates current anchors and scope; stale feedback fails explicitly rather than being delivered successfully. | ✓ VERIFIED | Both completion modes call `draftStore.settle(expectedRevision, { prepare, finalize })`. Their finalize paths reject scope/anchor/canonical-byte failures before `deliver`; routes map stale/scope/read-only results to non-success responses. `App.vue` computes Finish readiness from pending/conflict/recovery/unsaved state and does not issue a Finish request unless ready. |

**Truth count:** 5 passed / 0 failed / 5 total.  
**Behavior-unverified truths:** 0.

### CR-01 / UI Finish-guard Reconciliation

**Prior finding:** A non-empty inline composer could be left in a different file. Finish was disabled, but the reviewer was not told which draft blocked it or given a direct recovery action.

**Resolution:** ✓ VERIFIED

- `App.vue` derives `unsavedInlineComposerFile` by scanning every reviewable file's persisted composer text, not merely `activeComposer` (lines 166–179). That same value participates in `hasUnsavedReviewText` and therefore `attachedFinishReady` (lines 189–208).
- `ReviewPanel.vue` receives the exact file, renders the named warning and **Review draft in …** action, and emits its file ID (lines 793–805).
- The event is wired to `reviewInlineComposer()` in `App.vue`, which selects the file and closes the narrow-screen review drawer so the retained composer is visible (lines 592–595; binding line 1221).
- The supplied post-`e0f6c45` focused Chromium regression, `attached review blocks Finish while inline composer has unsaved text` in `tests/e2e/agent-ready-export.spec.ts`, passed **1/1**. Its cross-file path fills `changed.ts`, switches to `added.ts`, proves Finish disabled and stdout empty, invokes the recovery action, verifies the original composer/text return, clears it, and verifies Finish re-enables (lines 526–550).

**CR-01 result:** closed. The Finish guard is now both cross-file correct and explainable/actionable in the rendered browser flow.

## Requirements Coverage

| Requirement | Status | Current evidence |
|---|---|---|
| **HAND-01** — Either input mode opens the existing authenticated workspace with file navigation, Monaco diffs, comments, summary, persistence, and export. | ✓ SATISFIED | Shared attached launcher composes the established range/exact-patch apps; session attachment is opt-in and the existing workspace/export components remain wired. |
| **HAND-02** — Explicit Finish alone reports completion; close, reload, ordinary export, and disconnect do not. | ✓ SATISFIED | Attached-only Finish route plus the one `App.vue` caller; UI copy and terminal/disconnect states do not synthesize success. |
| **HAND-03** — The CLI remains attached until completion and writes exactly one canonical success JSON document to stdout while non-result output stays on stderr. | ✓ SATISFIED | Coordinator-gated one-delivery stdout seam, `completed`-only response-settlement wait, and stderr `output` path in `src/cli/run.ts`. |
| **HAND-04** — Returned JSON binds comments, summary, and drift-detectable anchors to exact submitted range/pathspec or patch identity. | ✓ SATISFIED | Server-owned V2/V3 build, frozen scope and durable-anchor validation, final byte parse/revision check, then delivery. |
| **HAND-05** — Finish validates pending draft state and anchors; stale feedback fails explicitly. | ✓ SATISFIED | Queue-safe `DraftStore.settle` prepare/finalize transaction, final validation before delivery, typed refusal mapping, and UI readiness fence. |

**Requirement count:** 5 satisfied / 0 blocked / 0 needs-human / 5 total.  
**Orphaned Phase 14 requirements:** 0 (`HAND-01` through `HAND-05` are all declared by Plans 14-01, 14-02, and 14-03 and mapped in `.planning/REQUIREMENTS.md`).

## Required Artifacts and Key Links

| Artifact / link | Status | Evidence |
|---|---|---|
| `src/contracts/api.ts` lifecycle schemas → `src/server/routes.ts` | ✓ VERIFIED | Strict `AttachedCompletionStatus`, Finish request, and Finish result schemas are parsed at the attached routes. |
| `src/server/capabilities.ts` → `src/server/draft-store.ts` | ✓ VERIFIED | Both range and patch `finish()` implementations invoke `draftStore.settle()` with prepare/finalize validation under the draft store's queue. |
| `src/server/capabilities.ts` → canonical exports | ✓ VERIFIED | Range uses `buildReviewExportV2`; patch uses `buildReviewExportV3`; each canonicalizes, final-parses, and validates the accepted revision before delivery. |
| `src/server/routes.ts` → `src/server/attached-completion.ts` | ✓ VERIFIED | A completed Finish response registers `reply.raw.once('finish', markResponseSettled)`; the CLI waits for that settlement after delivery. |
| `src/cli/run.ts` → existing session-app factories | ✓ VERIFIED | Both non-TTY modes use the same `launchAttachedSession` and pass its attachment options to their existing app factory. |
| `src/web/App.vue` → `src/web/components/ReviewPanel.vue` → `src/web/api/client.ts` | ✓ VERIFIED | The component receives lifecycle/readiness/mutation-lock props, emits only Finish/recovery actions, and `App.vue` owns the guarded Finish transport. |
| Cross-file composer guard → recovery action | ✓ VERIFIED | `unsavedInlineComposerFile` is the shared source for the Finish block and named action; event wiring returns to the exact blocked composer. |

## Behavioral Evidence

| Behavior | Evidence | Result |
|---|---|---|
| Cross-file inline-composer Finish guard after `e0f6c45` | Supplied focused Chromium regression: `tests/e2e/agent-ready-export.spec.ts` — `attached review blocks Finish while inline composer has unsaved text` | ✓ PASS (1/1) |
| Earlier Phase 14 lifecycle, canonical byte, API, CLI, package, and browser contracts | Existing Phase 14 verification/regression evidence supplied with this closure assignment; current source still contains the traced lifecycle, settlement, and delivery paths. | ✓ Grounded prior evidence retained |

No builds, linters, formatters, or project-wide suites were run, per the assignment constraints.

## Anti-Patterns and Blockers

The CR-01 remediation files (`src/web/App.vue`, `src/web/components/ReviewPanel.vue`, and `tests/e2e/agent-ready-export.spec.ts`) contain no `TBD`, `FIXME`, `XXX`, `TODO`, `HACK`, or placeholder markers.

**Blockers:** 0.  
**Warnings:** 0.  
**Failed truths:** 0.  
**Failed requirements:** 0.

## Closure Verdict

All five roadmap truths and all five assigned requirements are satisfied. The only closure-review concern, CR-01's cross-file inline-composer Finish guard, is resolved in current source and covered by the supplied post-remediation Chromium regression. Phase 14 is ready for closure.

---

_Verified: 2026-08-06T08:58:00Z_  
_Verifier: the agent (gsd-verifier)_
