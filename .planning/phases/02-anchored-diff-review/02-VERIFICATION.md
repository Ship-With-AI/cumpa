---
phase: 02-anchored-diff-review
verified: 2026-07-22
status: gaps_found
score: 36/45 plan must-haves verified
requirement_score: 10/11 requirements verified
re_verification:
  prior_status: gaps_found
  prior_score: 25/33 must-haves verified
  closure_plans: [02-08, 02-09, 02-10]
  regressions_or_remaining_blockers: [CR-001, WR-001, WR-002]
human_verification:
  - none
---

# Phase 02 — Anchored Diff Review Verification

## Goal-backward result

**Status: `gaps_found`.** The phase goal is not achieved end-to-end: a base-side Monaco composer is not tracked as an original-zone lifecycle object, so the required paired-zone positioning, resize/recompute lifecycle, and cleanup cannot work for base anchors. The required real-Monaco stability gate is also red because its prototype never mounts a composer. In addition, an accepted asynchronous add is lost from the live workspace if the reviewer switches files before the response arrives.

The successfully closed earlier gaps are real: persisted-comment reconciliation now keys strictly by side plus `bytesBase64url`; production has one Vue-mounted composer rather than a second declarative copy; non-empty move confirmation transitions correctly; stale/orphan rail entries are drawer/focus safe. Those fixes do not repair the three blockers below.

### Roadmap success criteria

| Criterion | Result | Evidence |
|---|---|---|
| Exact immutable base/head side-by-side workspace with collapsed-context controls and documented navigation | Verified | `src/web/monaco/diff-adapter.ts:96-109`; `src/web/components/DiffWorkspace.vue:246-247`; packaged browser flow passed. |
| Comment any visible base/head line and record side/path/blob/line/text/context/hash | Verified | Packaged flow activated base line 10 and displayed its locked header; `src/server/routes.ts` builds through `buildDurableAnchor`; focused Git/API contracts passed. |
| Anchors and paired layout remain aligned through reveal, resize, switching, and recomputation | **Failed** | CR-001 is present at `src/web/monaco/diff-adapter.ts:432-435`: the base branch never stores `originalZone`, so `positionZones()` and `growPairedZones()` return early and cleanup cannot remove the composer zone. |
| Accepted comments persist atomically and recover only for the same comparison | Verified | `draft-store.ts` atomic rename boundary; API and packaged relaunch evidence passed. |
| Stale/orphan records remain visible and are never relocated | Verified | Exact-byte reconciliation plus rail-only packaged stale/orphan test passed. |

**Roadmap score: 4/5.**

## Evidence executed

| Focused check | Result | What it establishes |
|---|---:|---|
| `npm ls monaco-editor --depth=0` | Passed | Resolved `monaco-editor@0.55.1`. |
| `npm run test:unit -- tests/unit/anchor.test.ts tests/unit/comparison-key.test.ts tests/unit/draft-reconciliation.test.ts tests/unit/workspace-state.test.ts` | Passed — 8 files, 61 tests | Durable-anchor framing, ordered comparison identity, exact-byte reconciliation, and normal workspace transitions. |
| `npm run test:api -- tests/api/anchor.test.ts tests/api/draft.test.ts tests/api/draft-atomicity.test.ts` | Passed — 5 files, 46 tests | Closed capability API, server-derived anchors, atomic store behavior, and conflict boundaries. |
| `npm run test:git -- tests/git/anchored-content.test.ts` | Passed — 6 files, 28 tests | Real-Git frozen base/head path/blob/content behavior. |
| `npm run test:browser -- tests/integration/anchored-workspace.spec.ts` | Passed — 5 tests | Production workspace flow, exact-byte resume, confirmation, rail, and responsive behavior covered by that suite. |
| `npm run test:package -- tests/e2e/anchored-review.spec.ts` | Passed — 2 tests | Generated CLI/server/assets against a real Git fixture, same-pair recovery, and stale/orphan rail-only behavior. |
| `npm run test:browser -- tests/integration/monaco-anchor.spec.ts` | **Failed** | Mandatory Phase 02 stability gate is not executable against the claimed composer contract. It received zero `textarea[aria-label="Comment"]` elements after base activation, empty composer zones after reveal, and expected `listenerCount: 7` versus actual `13`. |

The passing packaged test is useful regression evidence, but it does not inspect paired-zone geometry or count untracked base zones after recomposition. It therefore cannot falsify CR-001.

## Requirement coverage

| Requirement | Status | Source and behavioral evidence |
|---|---|---|
| DIFF-02 | Verified | Read-only, side-by-side immutable Monaco configuration is explicit in `diff-adapter.ts:96-108`; packaged and workspace flows passed. |
| DIFF-03 | Verified | `DiffWorkspace.vue:46-52` receives frozen side content/path; `routes.ts` and `capabilities.ts` resolve opaque IDs to frozen objects; focused Git/API checks passed. |
| DIFF-04 | Verified | Adapter context state/reveal and per-file restoration are implemented; anchored workspace flow passed. |
| DIFF-05 | Verified | Toolbar/adapter navigation actions and keyboard help are present; packaged interaction flow passed. |
| DIFF-07 | **Failed** | Base-side paired zone is untracked (`diff-adapter.ts:432-435`), which prevents synchronized alignment/growth and leaks a base composer zone on rebuild. The mandated stability gate is red. |
| CMT-01 | Verified with DIFF-07 dependency gap | Packaged flow really activates base non-line-1 line 10 and mounts the locked composer; server accepts only side/model line/body. The ability exists, but its stable paired-layout requirement is blocked under DIFF-07. |
| CMT-02 | Verified | `routes.ts` obtains frozen side content then `buildDurableAnchor`; `anchor.ts` produces path/blob/line/selected text/context/hash/unique key. Focused Git/API contracts passed. |
| CMT-08 | Verified | `capabilities.ts:196-223` verifies exact records only; `draft-reconciliation.ts` uses side + exact bytes; stale/orphan packaged flow passed without relocation. |
| DRFT-01 | Verified | `draft-store.ts` serializes, validates, writes a unique restrictive sibling temporary, syncs/closes/renames, and only then resolves. API atomicity tests passed. |
| DRFT-02 | Verified | Exact-byte, side-specific reconciliation is in `draft-reconciliation.ts`; the focused browser exact-byte recovery and packaged relaunch flow passed. |
| DRFT-03 | Verified | `comparison-key.ts` hashes ordered resolved endpoints; focused unit/API tests cover isolation and stored comparison identity. |

## Code-review finding disposition

| Finding | Disposition | Verification |
|---|---|---|
| CR-001 — base zone tracking | **Confirmed — blocking** | In the base branch, `anchoredZoneId` is created but never assigned to `originalZone`; only the spacer is assigned to `modifiedZone`. `positionZones()`/`growPairedZones()` require both fields, while `removeZones()` can remove only tracked fields. This is a direct failure of stable paired alignment and lifecycle cleanup. |
| WR-001 — Monaco prototype composer contract | **Confirmed — blocking gate** | `MonacoStabilityPrototype.vue` calls `adapter.activateAnchor()` but imports/mounts neither `CommentComposer` nor any renderer. `createComposerZone()` supplies an empty `<section>`. The focused browser gate demonstrably fails on that absent textarea/content. Its listener expectation is also stale: test expects 7 while adapter deliberately registers 13 static disposables. |
| WR-002 — async submit then file switch | **Confirmed — functional gap** | `switchFile()` permits a pending composer (`workspace-state.ts:127-132`). The success path completes only against the *current* active file (`:182-196`); `App.vue:159-183` dispatches that response after the asynchronous request without request/file correlation. Switch A→B while A is pending, then resolve, leaves A pending and drops the canonical comment from live state until reload. The analogous failure path also edits the current file. |

## Plan must-have audit

Each truth is accounted for below. “Verified” means source plus a focused behavioral check where the truth is behavior-facing; “Failed” is a present contradiction, not an inference from a SUMMARY.

| Plan | Must-have result | Evidence |
|---|---|---|
| 02-01 | 1. Exact approved Monaco artifact: **Verified** for the observable artifact. 2. Production-shaped real-Monaco proof page: **Failed**. 3. Paired zones stable with no lifecycle leaks: **Failed**. 4. Failed stability scenario blocks further rollout / permitted fallback only: **Failed** as a current gate assertion. | `npm ls` confirms 0.55.1. The prototype has no mounted composer, its mandatory browser test is red, and CR-001 disproves paired-zone lifecycle. Historical human approval itself is not goal-scored. |
| 02-02 | 1. Opaque authenticated capability exposes frozen text only: **Verified**. 2. Four-field add; server derives all anchor facts: **Verified**. 3. Old/new side paths and blobs drive side-specific identity: **Verified**. 4. Verification is exact-only, never relocates: **Verified**. | `capabilities.ts`, `routes.ts`, `anchor.ts`, strict draft schemas; focused Git and API checks passed. |
| 02-03 | 1. Ordered selected base/head key isolates endpoints: **Verified**. 2. Strict schema-versioned canonical draft only: **Verified**. 3. Serialized atomic commit boundary: **Verified**. 4. Resume/isolation/conflict preserve canonical draft: **Verified**. | `comparison-key.ts`, `draft-store.ts`, `routes.ts`; focused unit/API and packaged relaunch tests passed. |
| 02-04 | 1. Session-only per-file state: **Verified**. 2. A→B→A restoration after `diff-ready`: **Verified**. 3. Non-empty movement requires explicit confirmation: **Verified**. 4. Verified comment reveal/switch/rebuild/focus ordering: **Verified**. | `workspace-state.ts`; focused unit and anchored workspace browser checks passed. The uncovered pending-save file-switch race is recorded separately as WR-002. |
| 02-05 | 1. Single identity/tree and one active immutable diff: **Verified**. 2. Named, keyboard-accessible shell controls: **Verified**. 3. Persistent D-10 navigation: **Verified**. 4. Per-file state after readiness: **Verified**. 5. D-08 collapsed context/reveal: **Verified**. 6. Narrow side-by-side layout: **Verified**. | `DiffWorkspace.vue`, toolbar/help components, adapter; packaged and anchored workspace flows passed. |
| 02-06 | 1. Pending/failure retains source composer and only canonical response renders it: **Failed** for an A→B async completion (WR-002). 2. Explicit add / Cmd-Ctrl+Enter only: **Verified**. 3. Empty versus non-empty discard: **Verified**. 4. Deterministic verified/stale/orphan rail behavior: **Verified**. 5. Resume/isolation while interaction state remains session-only: **Verified**. 6. Pointer/keyboard use opaque four-field request: **Verified**. | `App.vue:159-183` plus reducer contradiction confirms the first failure. `CommentComposer.vue`, `CommentsRail.vue`, API tests, and anchored workspace flow support the remaining truths. |
| 02-07 | 1. Packaged authenticated frozen-capability path: **Verified**. 2. Base/head revealed-line anchor survives all listed lifecycle operations: **Failed** (CR-001). 3. Write failure/success and draft isolation: **Verified**. 4. Stale/orphan rail-only: **Verified**. 5. Every Phase 2 requirement has sufficient evidence: **Failed** (DIFF-07 gate is red). | Packaged 2-test run passes its covered cases, but its assertions do not measure paired-zone geometry or untracked base-zone cleanup. |
| 02-08 | 1. Exact-byte, side-specific comment-file mapping: **Verified**. 2. Ambiguous duplicates unavailable: **Verified**. 3. Same-pair exact recovery browser proof: **Verified**. | `draft-reconciliation.ts` and focused unit/browser checks; no display-string fallback remains. |
| 02-09 | 1. Any visible base/head model line activates exact side/model line: **Verified**. 2. One textarea composer remains anchored through resize/reveal/switch: **Failed** (CR-001). 3. Move confirmation is effective: **Verified**. 4. Responsive drawers preserve focus and are inert closed: **Verified**. 5. Stale/orphan rail is facts-only and exact-capability gated: **Verified**. | Production package proves base line 10 activation; `diff-adapter.ts` disproves lifecycle truth; anchored workspace/package flows cover the other repaired behaviors. |
| 02-10 | 1. Packaged non-line-1 base/head pointer workflow has exactly one stable inline composer: **Failed** — base zone leaks after recomposition even though the current E2E selector observes a mounted composer. 2. Exact anchor persists and recovers after relaunch: **Verified**. 3. Wide/medium/narrow workspace and rail inspection: **Verified**. 4. Checks jointly close every blocker: **Failed**. | Packaged flow passed 2 tests, but it misses CR-001 geometry/lifecycle and WR-001’s required prototype contract; it cannot establish joint closure. |

**Plan score: 36/45 verified.** Failed truths: 02-01.2–.4, 02-06.1, 02-07.2/.5, 02-09.2, 02-10.1/.4.

## Artifact and key-link verification

- **Anchor/persistence authority:** `routes.ts → capabilities.ts → anchor.ts → draft-store.ts` is closed: opaque `fileId` resolves frozen content before server construction and atomic persistence. Focused Git/API checks exercise it.
- **Exact resume path:** `App.vue → reconcileDraftComments()` uses side plus `bytesBase64url`, then `workspace-state.ts` exposes only exact available file capabilities. Unit and browser recovery checks exercise it.
- **Workspace composition path:** `DiffWorkspace.vue → MonacoDiffAdapter` mounts a single Vue `CommentComposer` into the adapter’s composer zone. This is sound for the tracked head branch, but the adapter’s base branch violates the paired-zone link.
- **Prototype-gate path:** `monaco-anchor.spec.ts → MonacoStabilityPrototype.vue → MonacoDiffAdapter` exists structurally but is non-functional because the prototype supplies only empty zones. The red check is decisive.
- **Packaged acceptance path:** `anchored-review.spec.ts → dist/bin/diff-review.mjs → .diff-review` passed, including relaunch and rail-only stale/orphan scenarios. Its coverage is insufficient to replace the failing geometry/lifecycle gate.

## Exact gaps and next action

1. **Repair base-zone bookkeeping in `rebuildAnchoredLayout()`:** record the base `anchoredZoneId` as `originalZone` and the counterpart spacer as `modifiedZone` before calling `positionZones()`. Add focused behavior coverage proving paired geometry, height updates, and no zones leaked after base→head/base activation, resize, reveal, and file recomposition.
2. **Make the stability prototype test its claimed interaction:** mount the real `CommentComposer` (or provide an equivalent real textarea-backed composition boundary) into the adapter zone, and reconcile the expected listener baseline with the adapter’s actual intentional 13 static listeners. Do not weaken it to source-text or empty-zone checks.
3. **Make async completion ownership explicit:** either prevent file switching while a comment is pending or include the originating file/request identity in success/failure events and update that file’s state. Add a focused transition/browser regression for submit on A → switch to B → resolve/reject.

**Next routing command:** `/gsd:plan-phase 2 --gaps`
