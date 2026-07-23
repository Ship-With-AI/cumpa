---
phase: 04-agent-ready-export
verified: 2026-07-24T00:45:00Z
status: passed
score: 36/36 plan must-haves verified
roadmap_score: 5/5 success criteria verified
requirements_score: 9/9 satisfied
behavior_unverified: 0
overrides_applied: 0
gaps: []
---

# Phase 04: Agent-Ready Export — Final Goal-Backward Verification

**Phase goal:** A developer can explicitly produce a complete, stable, machine-actionable review artifact that an agent can consume safely without Diff Review modifying source control.

**Verdict:** **passed**

This is a re-verification of the former EXP-07 production-native blocker. The blocker is closed: the declared `darwin-arm64` packaged runtime now builds, loads, probes, and supplies its native directory-exchange capability to the production publisher. The latest generated-package run observed an actual second `201`/`exported` response and independently reread the resulting exact two-file stable pair. Other targets fail closed as `reExportUnsupported` before a stable pair is touched.

## Goal-Backward Result

| Outcome needed for the goal | Result | Grounded evidence |
|---|---|---|
| Export is a complete, versioned, schema-valid JSON/Markdown pair in a full-OID repository-local path. | **VERIFIED** | `buildReviewExportV1` creates the strict document; `publishReviewExport` validates the candidate, requires exactly `review.json` and `review.md`, then rereads the final stable pair. The packed Chromium run independently observed the receipt paths under `.diff-review/exports/<full-base>..<full-head>/`. |
| An applying agent receives only actionable verified feedback plus enough identity to avoid unsafe guessing. | **VERIFIED** | `renderReviewMarkdown` first calls `parseCanonicalReviewExport`; it emits verified-open requests, sends stale/orphaned open comments to reviewer attention, retains resolved history only in JSON/counts, and states the commit/blob/path/side/text/context-hash/no-guess contract. |
| Re-export is deterministic apart from the explicit timestamp and never exposes a one-file new generation. | **VERIFIED** | Canonical serializer and hash boundary are deterministic; publication writes/validates a candidate pair before first atomic rename or one native directory exchange. `npm run test:package-contract` passed the target-aware packed re-export on this Darwin/arm64 host. |
| The browser exposes only server-confirmed export/receipt/ignore/reveal authority. | **VERIFIED** | `ExportSection.vue` presents pair-level states and delegates fixed capability callbacks; `ExportReceipt.vue` and `GitignoreStatus.vue` consume server DTOs. Export/reveal/ignore routes retain server-held repository/OID/path authority. |
| Export does not mutate source control, and generated internal files neither enter review nor require an ignore rewrite. | **VERIFIED** | `inventory.ts` filters only exact root `.diff-review` old/new identities. `gitignore-capability.ts` performs a consent-gated fixed-byte append only. Generated-package safety uses independent dirty-repository snapshots and command auditing. |

## Former EXP-07 Native Re-export Gap — Re-evaluation

The earlier gap was real: native source and an isolated probe did not establish a production packaged runtime capability. It is no longer present.

| Level | Current evidence | Result |
|---|---|---|
| Exists/substantive | `scripts/build-native-addon.mjs` produces `dist/native/directory_exchange.node` only for the declared `darwin-arm64` target; `src/native/directory-exchange.cc` uses Darwin `renameatx_np(..., RENAME_SWAP)` with no-follow directory/file checks. | **VERIFIED** |
| Runtime capability | `createNativeExchangeCapabilityObserver` creates a private probe root, loads the addon package-relatively from the compiled server module, performs the native probe, and returns `observedNativeExchange` only after setup/load/probe/cleanup succeed. Setup, load, probe, or cleanup failure returns typed `reExportUnsupported`. | **VERIFIED** |
| Production wiring | `createCapabilityRegistry().exportReview()` awaits `getObservedNativeExchangeCapability()` and passes the result to `publishReviewExport`. With an existing stable pair, `publishReviewExport` refuses before stable mutation unless the capability is observed; observed capability performs the one native exchange. | **VERIFIED** |
| Real packed supported target | The executed `npm run test:package-contract` run built the package, launched the packed CLI in a disposable real Git repository, and ran **22/22 Chromium** tests. Its generated evidence recorded `{ platform: "darwin", arch: "arm64", observedNativeReExport: true }`, a second `exported` result, the same full-OID stable directory, exactly two receipt paths, and independently reread final JSON/Markdown SHA-256 values. | **VERIFIED** |
| Real packed unsupported/refusal boundary | The packed target-aware journey asserts `409` plus `{ kind: "reExportUnsupported" }` on unobserved targets and byte-identical old JSON/Markdown. The forced-unavailable generated scenario separately proves refusal, 24 complete-pair samples, recovery, and unchanged source-control snapshot. This fallback test is not used as evidence of Darwin support. | **VERIFIED** |

## Roadmap Success Criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Explicit export writes schema-valid `review.json` and derived `review.md` together beneath `.diff-review/exports/`, then returns relative paths/hashes. | **VERIFIED** | `review-export.ts`, `export-store.ts`, strict receipt schemas, and the packed final reread prove the exact two-file pair and SHA-256/byte receipts. |
| 2 | JSON retains identity/history/anchors; Markdown groups only open actionable feedback and tells an agent how to apply safely. | **VERIFIED** | Strict composed schema plus reparse-only Markdown projection and focused unit contracts. |
| 3 | Unchanged re-export is deterministic except for `exportedAt`; failure never exposes only one new format. | **VERIFIED** | Canonical-byte/explicit-time contract; validated candidate pair; native exchange or refusal-before-touch; successful packed Darwin re-export. |
| 4 | `.diff-review/` is excluded from reviewed changes and can be added without rewriting existing ignore rules. | **VERIFIED** | Exact two-sided raw-path filter; fixed `check-ignore` probe; no-follow, append-only fixed rule with byte-prefix confirmation. |
| 5 | Packaged end-to-end behavior preserves source control across selections, resume, drift, unsupported content, and API access controls. | **VERIFIED** | The named packed `packaged-resume-after-relaunch` scenario terminates/relaunches generated processes, isolates a different ordered pair, exports resumed data, and checks source-control snapshots. |

**Roadmap score: 5/5.**

## Plan Must-Have Coverage

| Plan | Must-haves | Result | Verification basis |
|---|---:|---|---|
| 04-01 Reconciliation | 4/4 | **VERIFIED** | Current validator accepted the ledger; mutation self-test rejected **34** adversarial branches. |
| 04-02 Canonical export | 5/5 | **VERIFIED** | Strict schema, total ordering, canonical bytes, exact hashes, reparse-only projection, and actionability contracts are implemented and covered by unit tests. |
| 04-03 Publication | 5/5 | **VERIFIED** | Server-held snapshot/drift authority, full-OID stable path, candidate validation, final receipt, fixed reveal, observed Darwin exchange, and refusal fallback are wired. |
| 04-04 Ignore safety | 4/4 | **VERIFIED** | Exact old/new internal filtering, fixed effective-ignore probe, explicit fixed append, and nonblocking failure behavior are present and API/Git-tested. |
| 04-05 Export UI state | 5/5 | **VERIFIED** | One state owner controls explicit accepted-revision export, drift acknowledgement, pair progress/failure, buffer exclusion, and accessibility surfaces. |
| 04-06 Receipt/consent UI | 4/4 | **VERIFIED** | Server-confirmed two-file receipt, fixed reveal, two-step ignore consent, accessible copy/failure behavior, and previous-receipt distinction are wired. |
| 04-07 Safety harness | 4/4 | **VERIFIED** | Dirty Git snapshot/audit, candidate/recovery proof, observed-target re-export safety, and forced-unavailable refusal-before-touch are exercised at generated boundaries. |
| 04-08 Packaged acceptance | 5/5 | **VERIFIED** | Packed CLI/server/browser lifecycle, resume/different-pair isolation, exact disk reread, target-aware second export, source-control evidence, and coverage report all executed. |

**Plan score: 36/36.**

## Requirements Coverage

| Requirement | Status | Grounded implementation/evidence |
|---|---|---|
| EXP-01 | **SATISFIED** | Explicit API/UI export publishes only the stable full-OID JSON/Markdown pair and returns its relative receipt. |
| EXP-02 | **SATISFIED** | `ReviewExportV1Schema` and `buildReviewExportV1` preserve accepted revision, comparison/drift identity, complete comment history/state/times, anchors, and validated counts. |
| EXP-03 | **SATISFIED** | Markdown reparses canonical JSON and requests only open/verified comments grouped by exact path; stale/orphaned are attention-only and resolved feedback is excluded from requested work. |
| EXP-04 | **SATISFIED** | Applying-agent instructions require commit/blob/path/side/text/context-hash verification, make line numbers hints only, and prohibit guessing or relocation. |
| EXP-05 | **SATISFIED** | Final stable reread yields exactly two repository-relative paths, lowercase SHA-256 values, and byte counts. |
| EXP-06 | **SATISFIED** | Complete candidate validation precedes first rename; existing stable generation is swapped only through observed native exchange or remains untouched on typed refusal. |
| EXP-07 | **SATISFIED** | Same snapshot/time canonicalization is deterministic; current packed Darwin evidence proves a real second successful re-export rather than the prior permanent refusal. |
| EXP-08 | **SATISFIED** | Fixed capabilities, source-control snapshots, and command audit prohibit apply/stage/commit/push/source execution; only repository-local export files and explicit ignore append are allowed. |
| SAFE-04 | **SATISFIED** | Exact `.diff-review` comparison exclusion is ignore-independent; optional `.gitignore` consent appends only `/.diff-review/` and preserves prior bytes. |

**Requirements score: 9/9. No requirement is orphaned.**

## Executed Evidence

| Focused check | Observed result |
|---|---|
| `node .planning/phases/04-agent-ready-export/validate-reconciliation.mjs --self-test … && node …/validate-reconciliation.mjs …/04-01-RECONCILIATION.json` | **PASS** — **34** mutation rejection branches; current ledger valid. |
| `npm run test:unit` | **PASS** — **18 files / 104 tests**. |
| `npm run test:git` | **PASS** — **8 files / 35 tests**. |
| `npm run test:api` | **PASS** — **14 files / 98 tests**. |
| `npm run test:package-contract` | **PASS** — production build, packed/generated **22/22 Chromium** tests, then **2 files / 12 tests**. This is the direct production-native remediation check. |
| `npx playwright test --list` | **52 tests in 16 files** currently collected. Per supplied final phase evidence, the corresponding full Playwright run passed **52/52**; it was not rerun here because verifier constraints prohibit project-wide browser suites. |

## Audit Gate

| Audit | Result | Disposition |
|---|---|---|
| Code review (`04-REVIEW.md`) | **clean** — 0 critical, 0 warning, 0 info across 18 final native/package files. | Accepted. |
| Security (`04-SECURITY.md`) | **44/44 closed**, 0 open; final native re-audit passed. | Accepted. |
| UI (`04-UI-REVIEW.md`) | **24/24** — six pillars at 4/4; 0 blockers, 0 warnings. | Accepted. |
| Reconciliation | Current strict ledger and 34-branch mutation defense both passed in this verification. | Accepted. |

## Disconfirmation Pass

- **Prior partial requirement:** EXP-07 previously looked implemented because native source and isolated tests existed, while production always supplied `reExportUnsupported`. This pass traced the runtime capability through `getObservedNativeExchangeCapability()` into `exportReview()` and exercised the packed second export; the former partial implementation is now complete.
- **Misleading-test guard:** The forced-unavailable test proves only refusal safety. It is intentionally not treated as native-success evidence. The successful Darwin conclusion rests on the executed packed CLI/browser journey with a second `201` `exported` result.
- **Hard error path:** Addon probe-root setup, addon load, probe, and cleanup errors all downgrade to `reExportUnsupported`; stale addon removal on unsupported targets is separately covered. The remaining crash/power-loss and concurrent same-UID replacement boundary is documented below, rather than hidden by the passing suite.

## Residual Risks

- **AR-04-01 (accepted):** A same-UID process can replace a managed parent between JavaScript path-based identity checks around first publication, recovery, cleanup, or reveal. The code revalidates `dev`/`ino` identities and rejects symlinks/non-directories; the native addon uses descriptor-relative no-follow exchange for the re-export primitive. It does not retain descriptors for every surrounding JavaScript filesystem operation. This is a bounded, explicitly accepted race residual in `04-SECURITY.md`; it is not a Phase 04 must-have gap.
- Power loss outside the process-observable interruption windows remains an operating-system/filesystem durability boundary. Candidate validation, atomic rename/exchange, directory sync, final reread, and recovery reduce it; no claim of stronger crash-consistency than those primitives is made.

## Final Classification

- **Blockers:** 0
- **Warnings:** 0
- **Behavior-dependent truths without executed evidence:** 0
- **Status:** **passed**

_Verified: 2026-07-24_  
_Verifier: gsd-verifier_
