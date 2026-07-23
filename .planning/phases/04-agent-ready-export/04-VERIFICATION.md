---
phase: 04-agent-ready-export
verified: 2026-07-23T22:00:00Z
status: passed
score: 36/36 plan must-haves verified
roadmap_score: 5/5 success criteria verified
behavior_unverified: 0
overrides_applied: 0
gaps: []
---

# Phase 4: Agent-Ready Export Verification Report

**Phase Goal:** A developer can explicitly produce a complete, stable, machine-actionable review artifact that an agent can consume safely without Diff Review modifying source control.

**Verified:** 2026-07-23T22:00:00Z
**Status:** **passed**
**Re-verification:** Native packaged-target remediation

## Native Re-export Gap Remediation

The preceding initial-verification findings are retained as historical evidence. The original EXP-07 blocker is remediated by `4023bdf`: `build:runtime` emits `dist/native/directory_exchange.node`, the production capability loader resolves that package-relative artifact, and only its successful same-filesystem probe grants `observedNativeExchange`; load, compile, or probe failure remains `reExportUnsupported`.

Focused generated-package evidence now exercises the actual product boundary:

- `npx playwright test tests/e2e/agent-ready-export.spec.ts --grep "atomically re-exports"` — passed: 1 Chromium test. The harness builds, creates an `npm pack --ignore-scripts` tarball, extracts it, launches its generated `dist/bin/diff-review.mjs` in a disposable Git repository, performs a first export, clicks **Export review again**, receives a second `201` result parsed as `kind: "exported"` (never `reExportUnsupported`), and rereads `review.json`/`review.md` as one canonical JSON-to-Markdown pair.
- `npm run build && npx vitest run tests/package/agent-ready-export-safety.test.ts` — passed: generated-package safety suite 8/8, including first export followed by observed native exchange, 32 stable-pair observations, and recovery of the new complete pair.
- `npx playwright test tests/e2e/agent-ready-export-safety.spec.ts --grep "forced unavailable capability"` — passed: 1 lower-level forced-unavailable seam still proves refusal leaves the old complete pair untouched; it is no longer evidence about declared `darwin-arm64`.

Accordingly, the prior “always `reExportUnsupported`” data-flow block and its three dependent failed truths are resolved for the declared `darwin-arm64` target. Unobserved, unsupported, unavailable, or probe-failed targets remain fail-closed.


## Native Setup, Cleanup, and Build-Gate Remediation

`fd6b700` closes the follow-up review warnings. The observed capability factory now treats probe-root setup and cleanup errors as `reExportUnsupported`; it cannot resolve a supported capability until load, primitive probe, and cleanup all succeed. The project-owned build script now compiles only `darwin-arm64` and removes any stale `dist/native/directory_exchange.node` on every other target before exiting successfully.

- RED `6e2f3a9`: four injected tests demonstrated missing failure containment and stale-addon retention.
- GREEN: `npx vitest run tests/unit/native-exchange-capability.test.ts tests/unit/build-native-addon.test.ts` — 2 files / 4 tests passed.
- Real target: `npm run build` — passed, compiling the declared Darwin arm64 addon.
- Package boundary: `npx playwright test tests/e2e` — 22/22 passed after the build-gate fix.
- `633369b` host-gates the actual Darwin compiler assertion and retains portable stale-addon removal coverage. `b36fe78` serializes the required build in `npm run test:package-export-safety`; it rebuilt then passed 8/8, and `npx vitest run tests/package/agent-ready-export-safety.test.ts tests/package/agent-ready-export.test.ts` passed 2 files / 9 tests without a shared-`dist` race.
## Goal Achievement

### Roadmap Success Criteria

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Explicit export writes versioned schema-valid `review.json` and derived `review.md` below `.diff-review/exports/`, then returns relative paths and hashes. | VERIFIED | `buildReviewExportV1`/canonical parser and `publishReviewExport` generate and validate both files; `tests/api/export.test.ts` asserts the two relative receipt paths; 37 focused export/API/ignore tests passed. |
| 2 | JSON retains full review identity/history and Markdown contains only open actionable feedback grouped by file with applying-agent instructions. | VERIFIED | `src/export/review-export.ts` maps every comment/state/timestamp/anchor; `render-review-markdown.ts` reparses canonical bytes, groups verified open comments, puts stale/orphaned open comments under attention, and emits identity instructions. `review-export`/`review-markdown` tests passed. |
| 3 | Re-export is deterministic apart from `exportedAt` and a write failure never exposes only one newly updated format. | FAILED — BLOCKER | First export is pair-validated and safe, but a real second export cannot occur: `capabilities.ts` always provides `reExportUnsupported`, and `export-store.ts` returns that result when stable already exists. |
| 4 | `.diff-review/` is excluded from comparisons and can be added to `.gitignore` only without rewriting existing rules. | VERIFIED | Exact two-sided reserved-path filtering, fixed Git ignore probe, and byte-preserving fixed-rule capability are exercised by the 37 focused tests and the 9 generated UI checks. |
| 5 | Packaged end-to-end behavior preserves source control while covering package, resume/relaunch, drift/access control, unsupported content, and branch/worktree selection. | VERIFIED, with the re-export limitation above | `npm exec vitest run tests/package/agent-ready-export.test.ts` passed and ran 22 generated-package Chromium tests. Its generated evidence includes resume/relaunch, isolated ordered pairs, receipt hashes, source-control safety, and the explicitly refusal-only re-export test. |

**Roadmap score:** 4/5 success criteria verified.

### Plan Must-Have Coverage

All 36 declared plan truths were checked against current implementation and focused behavior. Thirty-three are verified. The three failed truths share one root cause: no packaged runtime native exchange is wired into production.

| Plan | Verified | Failed | Disposition |
|---|---:|---:|---|
| 04-01 Reconciliation | 4/4 | — | Ledger schema validation passed; mutation self-test rejected all 34 adversarial branches. |
| 04-02 Canonical export | 5/5 | — | Strict schema/snapshot/order/canonical-byte/hash/Markdown projection behavior is covered by focused unit tests. |
| 04-03 Publication | 4/5 | Native supported-target re-export | Candidate validation, first export, receipt, fixed reveal, and refusal-before-touch are wired; runtime native exchange is not. |
| 04-04 Ignore safety | 4/4 | — | Exact comparison exclusion, fixed ignore probing, explicit append, and decline/failure behavior are covered. |
| 04-05 Export UI state | 5/5 | — | One accepted-revision authority, truthful drift/readiness/progress behavior, and UI accessibility checks passed. |
| 04-06 Receipt/consent UI | 4/4 | — | Server receipt values, fixed reveal, two-step ignore consent, and accessible feedback passed in browser checks. |
| 04-07 Safety harness | 3/4 | Supported-target continuous exchange | The harness proves refusal/old-pair recovery, not the required supported-target old-or-new continuous exchange. |
| 04-08 Packaged acceptance | 4/5 | Supported native re-export behavior | Generated package resume/relaunch and first export pass, but the package accepts/refers to re-export refusal rather than successful supported-target replacement. |

**Plan score:** 33/36 must-haves verified.

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `.planning/phases/04-agent-ready-export/04-01-RECONCILIATION.json` | Grounded owner/command/package ledger | VERIFIED | `--schema-only` accepted the current ledger. |
| `validate-reconciliation.mjs` | Fail-closed validator and mutation self-test | VERIFIED | `--self-test` passed 34 rejection branches. |
| `src/export/review-export.ts` | Canonical strict JSON/snapshot/order/hash boundary | VERIFIED | Current substantive implementation; focused canonical tests passed. |
| `src/export/render-review-markdown.ts` | Exact JSON-derived Markdown/actionability projection | VERIFIED | Re-parses canonical bytes and derives all content; focused Markdown tests passed. |
| `src/server/export-store.ts` | Validated complete-pair publication/recovery | PARTIAL — BLOCKER | First publication/recovery and unsupported refusal are implemented; replacement requires a capability production never supplies. |
| `src/native/directory-exchange.cc` and `binding.gyp` | Narrow native exchange primitive | PARTIAL — ORPHANED | Native unit test passed, but no production loader or call site exists. |
| `src/git/ignore-status.ts`, `src/server/gitignore-capability.ts` | Fixed effective-ignore probe and consent-only append | VERIFIED | Focused Git/API/browser tests passed. |
| `src/web/components/ExportSection.vue`, `ExportReceipt.vue`, `GitignoreStatus.vue` | Explicit export, truthful receipt, fixed reveal, explicit consent | VERIFIED | State flows through the existing API/state owner; 9 focused Chromium UI tests passed. |
| `tests/e2e/agent-ready-export.spec.ts`, `tests/package/agent-ready-export.test.ts` | Generated-package relaunch/resume proof | VERIFIED | Focused packaged resume test and package acceptance test passed. |

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| Canonical snapshot | Markdown renderer | Canonical bytes are parsed before projection | WIRED | `renderReviewMarkdown(canonicalBytes)` calls `parseCanonicalReviewExport`. |
| Server capability | Pair publisher | Server-side accepted snapshot, drift/revision revalidation, server-held OIDs | WIRED | `createCapabilityRegistry().exportReview()` builds bytes and invokes `publishReviewExport`. |
| Pair publisher | Native directory exchange | Observed packaged adapter capability | **NOT WIRED — BLOCKER** | Production passes `{ kind: 'reExportUnsupported' }`; search finds `exchangeDirectories` only in native source, `export-store.ts`, and isolated tests. |
| Browser receipt | Secured fixed reveal route | Zero-argument API capability | WIRED | Focused state/UI tests assert no body/query/path authority. |
| Ignore UI | Fixed append capability | Explicit two-step consent | WIRED | Browser test passes consent confirmation and bounded append-failure behavior. |
| Packaged CLI/browser | Persisted accepted draft/export | Close/relaunch then on-disk reread | WIRED | The generated package test passed 22 Chromium scenarios, including the named resume scenario. |

## Data-Flow Trace

| Artifact | Data | Source | Status |
|---|---|---|---|
| `ExportSection.vue` | Accepted revision, counts, drift, receipt, failure | Existing `ReviewDraftState` and `SessionClient` responses | FLOWING |
| `ExportReceipt.vue` | Paths, hashes, byte counts, comparison/drift identity | Server-confirmed `ExportReviewResult` only | FLOWING |
| `GitignoreStatus.vue` | Effective ignore status/append outcome | Fixed server capability, not `.gitignore` text inference | FLOWING |
| `export-store.ts` | Re-export capability | `createCapabilityRegistry().exportReview()` | BLOCKED: always unsupported |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Ledger validity | `node .../validate-reconciliation.mjs --schema-only .../04-01-RECONCILIATION.json` | Ledger valid | PASS |
| Ledger mutation defense | `node .../validate-reconciliation.mjs --self-test .../04-01-RECONCILIATION.json` | 34 rejection branches | PASS |
| Canonical/export/API/ignore contracts | `npm exec vitest run tests/unit/review-export.test.ts tests/unit/review-markdown.test.ts tests/api/export.test.ts tests/api/export-publication.test.ts tests/git/ignore-status.test.ts tests/git/inventory.test.ts` | 37/37 tests | PASS |
| Native primitive plus generated safety boundary | `npm exec vitest run tests/unit/directory-exchange.test.ts tests/package/agent-ready-export-safety.test.ts` | 9/9 tests | PASS — proves primitive/refusal safety, not product native wiring |
| Export state/receipt/consent UI | `npm exec playwright test tests/integration/agent-ready-export-states.spec.ts tests/integration/export-receipt-ui.spec.ts` | 9/9 Chromium tests | PASS |
| Generated resume/relaunch | `npm exec playwright test tests/e2e/agent-ready-export.spec.ts` | 1/1 Chromium test | PASS |
| Generated package acceptance | `npm exec vitest run tests/package/agent-ready-export.test.ts` | 1/1 wrapper test; 22/22 generated-package Chromium scenarios | PASS; scenario 1 explicitly expects re-export refusal |

## Requirements Coverage

| Requirement | Source plans | Status | Evidence |
|---|---|---|---|
| EXP-01 | 01, 03, 05, 06, 08 | SATISFIED | Explicit export creates a stable full-OID comparison directory with exactly the JSON/Markdown pair and receipt. |
| EXP-02 | 01, 02, 05, 08 | SATISFIED | Strict `ReviewExportV1Schema`, complete draft identity/history/anchors, and canonical parser are implemented and tested. |
| EXP-03 | 01, 02, 05, 08 | SATISFIED | Markdown is derived from reparsed canonical JSON; only verified open comments are actionable and grouped by exact path. |
| EXP-04 | 01, 02, 05, 08 | SATISFIED | Applying-agent instructions require commit/blob/path/side/selected-text/context-hash verification and prohibit line-number authority/guessing. |
| EXP-05 | 01, 02, 03, 06, 07, 08 | SATISFIED | Final reread receipts contain only relative pair paths plus exact SHA-256 and byte counts. |
| EXP-06 | 01, 03, 05, 06, 07, 08 | SATISFIED | Candidate pair is fully validated before first publication; unsupported re-export refuses before stable changes. |
| EXP-07 | 01, 02, 05, 08 | **BLOCKED** | Deterministic serialization exists, but a second unchanged accepted review cannot be exported through the current packaged product. |
| EXP-08 | 01, 03, 04, 05, 06, 07, 08 | SATISFIED | Focused source-control snapshots and generated package checks show no apply/stage/commit/push/source mutation; only approved export files and explicit ignore append are allowed. |
| SAFE-04 | 01, 04, 06, 07, 08 | SATISFIED | Exact `.diff-review` inventory exclusion and explicit fixed-rule gitignore consent are implemented and browser-tested. |

No Phase 4 requirement is orphaned: every mapped requirement appears in at least one Phase 4 plan.

## Audit and Risk Cross-Check

- `04-REVIEW.md` records a clean focused review; this verification independently found the native runtime link absent despite the native source and isolated tests existing.
- `04-SECURITY.md` records 44/44 mitigations and `threats_open: 0`; its accepted risk **AR-04-01** is correctly bounded to a malicious concurrent same-UID directory replacement outside the locked path-identity threat boundary. That accepted residual is not this gap.
- `04-UI-REVIEW.md` is **PASS 24/24**. Current focused browser checks also passed 9/9.
- The reconciliation report and ledger are valid, including the 34-branch self-test. The ledger's approved state does not establish a packaged native target was later built, loaded, observed, and supplied at runtime.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---:|---|---|---|
| `src/server/capabilities.ts` | export publication call | Hard-coded `reExportUnsupported` | BLOCKER | Permanently disables successful stable-pair replacement. |
| `tests/e2e/agent-ready-export-safety.spec.ts` | named re-export safety test | Test asserts packaged target refusal | INFO | Accurately tests current refusal path; it is not evidence for required supported-target replacement. |

No untracked `TBD`, `FIXME`, or `XXX` debt marker was found in the Phase 4 product/test files scanned.

## Gaps Summary

One root-cause blocker prevents a `passed` status. The project contains a Darwin N-API exchange implementation and an isolated unit test, but no packaged runtime imports it or promotes the product capability after a real probe. Consequently, first export is safe and recovery is safe, but re-export of an existing comparison is always returned as `reExportUnsupported`.

This is not covered by accepted risk AR-04-01. The necessary closure is production adapter build/load/probe wiring plus a generated-package success test for supported-target re-export that continuously observes only an old or new complete stable pair.

---

_Verified: 2026-07-23T21:02:52Z_  
_Verifier: gsd-verifier_
