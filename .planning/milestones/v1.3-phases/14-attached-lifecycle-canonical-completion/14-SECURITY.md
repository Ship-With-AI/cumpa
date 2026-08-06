---
phase: 14-attached-lifecycle-canonical-completion
audit: security
asvs_level: 1
blocking_threshold: HIGH
status: secured
threats_total: 25
threats_mitigated: 23
threats_accepted: 2
threats_open: 0
unregistered_flags: 0
audited: 2026-08-06
---

# Phase 14 Security Audit

## Executive Summary

**SECURED.** All 25 threats declared in the three Phase 14 threat registers are closed: 23 implemented mitigations were directly verified and two declared LOW supply-chain risks remain documented acceptances. No declared transfer disposition exists.

The audit directly verified the loopback authentication boundary, final scope/anchor/canonical-byte validation, one-shot/immutable Finish behavior, exact bounded lifecycle failure copy, stdout/stderr separation, and the SIGINT delivery fence. No implementation files or tests were modified and no validation command was run.

## Scope and Method

This report covers only the 25 threat IDs in the `<threat_model>` blocks of `14-01-PLAN.md`, `14-02-PLAN.md`, and `14-03-PLAN.md`. Mitigations were checked in their cited implementation paths; relevant tests were inspected only as coverage evidence. The supplied final evidence states that the Phase 14 targeted Vitest suite (12 files/140 tests), Chromium suite (14 tests), prior regression Vitest suite (14 files/179 tests), Chromium suite (17 tests), and `npm run build` passed.

## Threat Verification

| Threat ID | Category | Disposition | Status | Direct evidence |
|---|---|---|---|---|
| T-14-01-01 | Spoofing — completion routes | mitigate | CLOSED | `src/server/security.ts:91-115` performs exact Host and Origin checks plus timing-safe Bearer validation before any `/api` handler. Attached routes are registered only when `capabilities.attachedCompletion` exists in `src/server/routes.ts:130-159`. |
| T-14-01-02 | Tampering — Finish input/result | mitigate | CLOSED | `src/contracts/api.ts:331-355` strictly bounds `expectedRevision` and every result discriminant; `src/server/routes.ts:147-159` has a 256-byte body limit and schema parse; browser contracts contain no canonical-byte field. Server finalizes against the supplied accepted revision in `src/server/capabilities.ts:360-421,652-693`. |
| T-14-01-03 | Tampering — two-phase settlement | mitigate | CLOSED | `src/server/draft-store.ts:81-91,263-308` serializes prepare/finalize with every draft mutation, reloads after prepare, and rejects changed kind/raw bytes before finalization. Missing revision-zero drafts stay in-memory through `initialDraft` at `:71-78,275`. |
| T-14-01-04 | Tampering — scope, anchors, canonical bytes | mitigate | CLOSED | Range finalization rechecks selector state and every anchor, reparses the already-prepared V2 bytes, and verifies revision immediately before delivery in `src/server/capabilities.ts:363-413`. Exact-patch does the corresponding scope/anchor/V3/revision validation at `:654-685`; both pass the exact `prepared.bytes` to delivery. |
| T-14-01-05 | Repudiation — outcome classification | mitigate | CLOSED | `src/server/attached-completion.ts:52-90` coalesces concurrent Finish calls, persists completed/terminal results, returns retry-safe refusals to waiting, and does not clear an active terminal attempt. `runDelivery` refuses delivery after completed or terminal state at `:40-43`. |
| T-14-01-06 | Information disclosure — errors/browser response | mitigate | CLOSED | Generic `REQUEST_UNAVAILABLE_ERROR` is used for denials, not-found, and uncaught errors in `src/server/security.ts:7-13,86-89,123-132`; Finish can expose only the fixed result discriminants in `src/contracts/api.ts:335-354`. |
| T-14-01-07 | Denial of service — concurrent Finish | mitigate | CLOSED | Server single-flight is enforced by `#inFlight` in `src/server/attached-completion.ts:59-61,83-89`; the route has `bodyLimit: 256` in `src/server/routes.ts:147-150`. |
| T-14-01-08 | Elevation of privilege — interactive session | mitigate | CLOSED | Attached marker/capability is opt-in only (`src/server/capabilities.ts:357-423,649-695`); attached lifecycle routes are absent without it (`src/server/routes.ts:130-178`). The CLI passes the coordinator only through the non-TTY attached launch path in `src/cli/run.ts:478-501,541-555`. |
| T-14-02-01 | Spoofing — attachment/status | mitigate | CLOSED | `src/web/api/client.ts:271-291` strictly parses both server lifecycle status and Finish results. `src/web/App.vue:174-176,398-405` derives attached state from the authenticated session marker and server status, not URL or storage inference. |
| T-14-02-02 | Tampering — Finish request | mitigate | CLOSED | Client submits only `current.canonical.revision` in `src/web/App.vue:412-433`; readiness is UI-only at `:187-199`. Server repeats final scope, anchor, canonical-document, and revision checks immediately before its single delivery in `src/server/capabilities.ts:395-415,668-687`. |
| T-14-02-03 | Tampering — immutable state | mitigate | CLOSED | `attachedMutationLocked` covers finishing and completed in `src/web/App.vue:174-177`; it is enforced in mutation/export/ignore paths at `:454-455,518-521,560-563`, workspace dispatch at `:727-735`, and buffer updates in `:1180-1200`. `ReviewPanel` receives the lock and disables mutation controls; `DiffWorkspace` receives `mutations-locked` at `App.vue:1142-1148`. |
| T-14-02-04 | Repudiation — outcome transition | mitigate | CLOSED | `src/web/App.vue:418-433` maps only `completed`/`alreadyCompleted` to success, maps `deliveryFailed` and transport failure to terminal failure, and exposes retryable state only for definitive non-delivery results. Server state handling matches in `src/server/attached-completion.ts:63-81`. |
| T-14-02-05 | Information disclosure — failure rendering | mitigate | CLOSED | All rendered lifecycle copy now exactly matches `14-UI-SPEC.md:203-241`: header facts in `src/web/components/IdentityHeader.vue:43-49`; success/pending strings in `ReviewPanel.vue:670-695`; waiting disconnect, ambiguous disconnect, validation, and generic-failure strings/actions in `ReviewPanel.vue:696-790`. The UI sends no caught exception to the view (`src/web/App.vue:431-432`), and the inspected rendered assertions use exact strings in `tests/e2e/agent-ready-export-safety.spec.ts:164-230`. |
| T-14-02-06 | Denial of service — repeated Finish | mitigate | CLOSED | Client readiness denies finishing, completed, and terminal states in `src/web/App.vue:187-199`; the button emits only when ready in `src/web/components/ReviewPanel.vue:141-143`; server `#inFlight` coalesces bypassed duplicate requests in `src/server/attached-completion.ts:59-61`. |
| T-14-02-07 | Elevation of privilege — force/fallback UI | mitigate | CLOSED | The only client completion call is `finishReview({ expectedRevision })` in `src/web/App.vue:412-418`, validated again by `src/web/api/client.ts:280-291`. There is no client path to construct bytes, force delivery, relocate, fall back, or emit browser output; final authority remains server-side in `src/server/capabilities.ts:360-421,652-693`. |
| T-14-02-08 | Tampering — accessible responsive rendering | mitigate | CLOSED | The rendered lifecycle test checks focus/live/alert states, locked composer controls, exact recovery views, 44px controls at 320px and 767px, and forced-colors visibility in `tests/e2e/agent-ready-export-safety.spec.ts:151-249`. Supplied Chromium evidence passed. |
| T-14-02-SC | Tampering — supply chain | accept | CLOSED | Accepted risk is recorded below as `AR-14-02-SC`. No Phase 14 dependency or registry addition is declared in `14-02-SUMMARY.md:14-19`. |
| T-14-03-01 | Spoofing — attachment | mitigate | CLOSED | Only `launchAttachedSession` creates the coordinator and attaches it to the application in `src/cli/run.ts:400-441`; `src/server/capabilities.ts:306,610` exposes the attached marker only when that option was injected. |
| T-14-03-02 | Tampering — canonical stdout | mitigate | CLOSED | `src/server/capabilities.ts:408-411,680-683` supplies `prepared.bytes` directly after final parse/revision validation. `src/cli/run.ts:436-441` passes those bytes unchanged to `stdout`; `writeStdout` writes the supplied `Uint8Array` without parse, serialization, wrapper, or newline at `:371-380`. |
| T-14-03-03 | Repudiation — outcome/order | mitigate | CLOSED | Retry-safe outcomes return coordinator status to waiting without resolving delivery (`src/server/attached-completion.ts:78-80`). The CLI waits for completed delivery, then waits `responseSettled`, then shuts down in `src/cli/run.ts:464-471`; all non-completed results use failure shutdown at `:465-474`. |
| T-14-03-04 | Information disclosure — channels | mitigate | CLOSED | Canonical bytes flow only through `stdout` (`src/cli/run.ts:371-380,436-441`); URL, browser fallback, and failure diagnostics call `output`, defaulting to `console.error`, at `:409-411,459-474`. |
| T-14-03-05 | Denial of service — validated refusal | mitigate | CLOSED | Non-terminal refusal leaves the coordinator waiting (`src/server/attached-completion.ts:78-80`), so `waitForAttachedOutcome` remains attached without polling or output (`src/cli/run.ts:383-397,464-471`). A later explicit Finish is required. |
| T-14-03-06 | Elevation of privilege — ambiguous retry | mitigate | CLOSED | SIGINT/SIGTERM shutdown synchronously calls `coordinator.cancel()` before closing the app in `src/cli/run.ts:419-427`; shutdown invokes this abort action before awaiting the close listener in `src/server/lifecycle.ts:56-77`. `runDelivery` checks terminal/cancelled state before invoking its delivery operation (`src/server/attached-completion.ts:40-43`). The delivery-boundary test pauses before that invocation, emits SIGINT, then releases it and observes `deliveryFailed`, no stdout, and exit 130 in `tests/cli/request.test.ts:341-423`. Client ambiguity is terminal/non-retryable in `src/web/App.vue:425-432`. |
| T-14-03-07 | Tampering — package/browser behavior | mitigate | CLOSED | Range and exact-patch attached modes share `launchAttachedSession` in `src/cli/run.ts:478-501,541-555`, which uses the same direct byte transport and coordinator. Their V2/V3 server finalization is separately constrained in `src/server/capabilities.ts:357-423,649-695`; supplied targeted package/browser evidence passed. |
| T-14-03-SC | Tampering — supply chain | accept | CLOSED | Accepted risk is recorded below as `AR-14-03-SC`. No Phase 14 dependency or registry addition is declared in `14-03-SUMMARY.md:14-21`. |

## Accepted Risks

| Accepted-risk ID | Threat ID | Disposition | Record |
|---|---|---|---|
| AR-14-02-SC | T-14-02-SC | accept | Phase plan deliberately reuses existing Vue, CSS/tokens, Zod, Vitest, and Playwright; no package installation or registry interaction is part of this phase. |
| AR-14-03-SC | T-14-03-SC | accept | Phase plan deliberately reuses existing Node streams, CLI/server/browser infrastructure, Vitest, and Playwright; no package installation or registry interaction is part of this phase. |

## Unregistered Flags

None. `14-01-SUMMARY.md`, `14-02-SUMMARY.md`, and `14-03-SUMMARY.md` contain no `## Threat Flags` section.

## Result

`threats_open: 0`
