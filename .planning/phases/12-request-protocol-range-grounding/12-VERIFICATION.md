---
phase: 12-request-protocol-range-grounding
verified: 2026-08-04T21:16:18Z
status: passed
score: 23/23 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 12: Request Protocol & Range Grounding Verification Report

**Phase Goal:** Coding agents can submit one safe, versioned range request whose exact Git scope is pinned, while developers retain the existing interactive launch flow.

**Verified:** 2026-08-04T21:16:18Z  
**Status:** passed  
**Re-verification:** No — initial verification

## Goal Achievement

The five roadmap success criteria and every additional non-duplicative plan-frontmatter truth were evaluated against current source and focused behavior. SUMMARY claims were not used as evidence.

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | A supported piped versioned range request bypasses the interactive picker, while TTY uses the existing ordered flow. | ✓ VERIFIED | `runOrdinaryAction()` branches on `stdin.isTTY` before reading/prompting. Focused CLI tests and the generated-browser path pass. |
| 2 | Invalid request framing/schema/encoding/size/mode inputs fail actionably, nonzero, before browser launch. | ✓ VERIFIED | `readAgentReviewRequest()` byte-bounds then fatal-decodes/parses; CLI catches typed exit errors before `launchPinnedComparison`. Request and process tests pass. |
| 3 | Explicit ancestor endpoints resolve once to full OIDs and invalid contiguous ranges are rejected. | ✓ VERIFIED | `createPinnedRangeComparison()` performs two endpoint `rev-parse` calls then uses only pinned OIDs for graph/inventory. Git tests cover equality, reversed, unavailable, unrelated, and moved-ref cases. |
| 4 | Ordered include/exclude pathspecs retain native Git meaning and only the scoped inventory reaches the developer. | ✓ VERIFIED | `createChangedFileInventory()` sends the same frozen `['--', ...pathspecs]` tail to raw and numstat diffs; the runner clears global pathspec-mode variables. Native and browser tests pass. |
| 5 | Ref movement cannot alter pinned commits, scope, blobs, draft identity, or feedback provenance. | ✓ VERIFIED | Pinned OIDs drive inventory/object access; an ordered-scope range key flows through session, draft, V2 export, Markdown, and publication. Relevant Git, draft, export, and browser tests pass. |
| 6 | Raw request bytes are bounded before concatenation and decoded exactly once with fatal UTF-8 semantics. | ✓ VERIFIED | `src/cli/request.ts` rejects cumulative bytes above `MAX_AGENT_REQUEST_BYTES`, then performs one fatal decode and one JSON parse. |
| 7 | One strict Zod-inferred request authority exposes only revision range input. | ✓ VERIFIED | `AgentReviewRequestSchema` is strict and accepts only the literal protocol/version/mode plus strict revisions; server/browser authority fields are rejected. |
| 8 | Equality is accepted; reversed and unrelated explicit ranges fail before launch. | ✓ VERIFIED | `merge-base --is-ancestor baseOid headOid` deliberately allows equality and maps invalid order to `non-ancestor-range`; focused range tests cover each case. |
| 9 | Inherited Git pathspec-mode variables cannot reinterpret submitted argv. | ✓ VERIFIED | `src/git/runner.ts` deletes `GIT_LITERAL_PATHSPECS`, `GIT_GLOB_PATHSPECS`, `GIT_NOGLOB_PATHSPECS`, and `GIT_ICASE_PATHSPECS`; inventory tests cover inherited mode. |
| 10 | Native attribute magic passes through unchanged and invalid native syntax becomes a safe range failure. | ✓ VERIFIED | There is no application pathspec parser; scoped Git exit errors map to `invalid-pathspec`. Native and generated-process tests pass. |
| 11 | A frozen range comparison preserves labels, full OIDs, ordered scope, and a domain-separated order-sensitive key. | ✓ VERIFIED | `RangeReviewScopeSchema` plus `rangeReviewKey()` preserve those fields; key vectors cover reordering, endpoint swapping, insertion, and framing. |
| 12 | Session responses project frozen OIDs and ordered pathspecs without exposing storage/Git authority. | ✓ VERIFIED | `createCapabilityRegistry()` derives `SessionResponse.range` only from `comparison.range`; session tests assert exact values and absence of storage/key/token/root authority. |
| 13 | Same OIDs with differing ordered scopes have independent draft paths and serialized queues. | ✓ VERIFIED | `draftPaths()` uses `range.reviewKey`; `createDraftStore()` derives queue ownership from its canonical path. Draft tests cover reordered-scope isolation. |
| 14 | An identical range scope resumes its immutable provenance. | ✓ VERIFIED | `sameDraftComparison()` compares every scope field in order; draft-load/API tests prove matching-scope resume. |
| 15 | Production draft wiring carries frozen identity while interactive drafts retain pair-only shape and compatibility. | ✓ VERIFIED | `createSessionApp()` → `createAppDraftStore()` → `createDraftStore()` feeds only server-held comparison provenance. Draft tests retain pair-only bytes and recovery behavior. |
| 16 | Browser input cannot select review key, path, repository facts, OIDs, labels, or scope authority. | ✓ VERIFIED | Draft mutation schemas accept no such authority; draft tests reject client-supplied authority fields before writes. |
| 17 | Canonical range feedback includes requested labels, pinned OIDs, ordered pathspecs, and the server-derived key. | ✓ VERIFIED | `buildReviewExportV2()` verifies frozen provenance before strict V2 serialization; Markdown reparses canonical bytes and renders scope. |
| 18 | Range exports are strict V2 while interactive exports remain byte-compatible V1. | ✓ VERIFIED | The V1 builder remains the interactive path; V2 adds validated range provenance and parser discrimination is exact. Export tests pass. |
| 19 | Range publication/recovery accepts only the server-derived 64-hex key while interactive pair publication is retained. | ✓ VERIFIED | `stableNameFor()` accepts range identity only with exactly a 64-hex key; `matchesPublicationIdentity()` requires V2 range key. Publication tests pass. |
| 20 | Moving refs cannot change range canonical JSON, Markdown scope, receipt comparison, or destination. | ✓ VERIFIED | Capabilities snapshot frozen comparison range; range export destination is `range.reviewKey`; V2 construction cross-checks accepted draft and frozen comparison. |
| 21 | The browser displays full pinned OIDs and ordered, control-safe pathspecs from the server without client filtering or ref refresh. | ✓ VERIFIED | `IdentityPanel.vue` renders only `SessionResponse.range` through `controlSafeDisplay`; generated-browser tests verify scope and scoped inventory. |
| 22 | Range empty/error/retry/modal/focus/Escape/focus-return behavior matches `12-UI-SPEC.md` exactly. | ✓ VERIFIED | `App.vue` implements range copy and retry; `IdentityPanel` reuses the accessible modal behavior. The UI-SPEC explicitly defines the shorter no-pathspec exception, which matches the implementation and E2E assertion. Focused browser tests pass. |
| 23 | Interactive identity UI and ordinary review behavior remain unchanged. | ✓ VERIFIED | Header/panel retain their non-range branch; focused selection, draft, export, and generated-browser matrix pass. |

**Score:** 23/23 truths verified (0 present but behavior-unverified)

## Required Artifacts

| Artifacts | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/contracts/request.ts`, `src/cli/request.ts`, `tests/cli/request.test.ts` | Strict bounded request schema and reader | ✓ VERIFIED | Substantive, imported by CLI dispatch, and focused-tested. |
| `src/contracts/comparison.ts`, `src/domain/comparison-key.ts`, `src/git/comparison.ts`, `src/git/inventory.ts`, `src/git/runner.ts` | OID-pinned range and native scoped inventory | ✓ VERIFIED | Builder, inventory, and controlled environment are wired; range/key tests pass. |
| `src/cli/run.ts`, `src/contracts/api.ts`, `src/server/capabilities.ts`, `tests/cli/selection.test.ts`, `tests/api/session.test.ts` | TTY/non-TTY dispatch and session projection | ✓ VERIFIED | Commander entry dispatches production paths; server derives the session DTO; tests cover both. |
| `src/contracts/draft.ts`, `src/server/app.ts`, `src/server/draft-loader.ts`, `src/server/draft-store.ts`, `tests/unit/draft-load.test.ts`, `tests/api/draft.test.ts` | Range-keyed atomic draft persistence and V1 compatibility | ✓ VERIFIED | Frozen provenance reaches loader/store from app composition; tests cover collision, resume, recovery, and client authority. |
| `src/export/review-export.ts`, `src/export/render-review-markdown.ts`, `src/server/export-store.ts`, `tests/unit/review-export.test.ts`, `tests/api/export.test.ts`, `tests/api/export-publication.test.ts` | V2 frozen export and safe range-key publication | ✓ VERIFIED | Canonical parse/re-render and publication identity validation are wired and tested. |
| `src/web/App.vue`, `src/web/components/IdentityHeader.vue`, `src/web/components/IdentityPanel.vue`, `src/web/styles.css`, `tests/e2e/pinned-session.spec.ts` | Server-authoritative range UI | ✓ VERIFIED | Components consume the authenticated session; generated binary/browser checks cover scoped content, empty/error/retry, modal/focus, and interactive preservation. |

## Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| stdin byte chunks | `readAgentReviewRequest` | non-TTY ordinary action | WIRED | `runOrdinaryAction()` owns stdin only after the TTY branch. |
| `src/cli/request.ts` | `AgentReviewRequestSchema` | fatal decode → JSON parse → `safeParse` | WIRED | Direct schema import and parse; request tests pass. |
| `src/cli/run.ts` | `createPinnedRangeComparison` | validated revisions/pathspecs before launch | WIRED | One range comparison is built before `launchPinnedComparison`. |
| `PinnedComparison.range` | session/draft/export | capabilities and app composition | WIRED | Server derives the projection, draft key, V2 export, and publication identity. |
| `SessionResponse.range` | range UI | typed Vue props | WIRED | Header/panel condition solely on session range; generated browser test observes real server scope. |

## Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Produces real data | Status |
| --- | --- | --- | --- | --- |
| `App.vue` and identity components | `session.range`, `session.files` | authenticated `/api/session` from `PinnedComparison` | Pinned Git inventory and server-derived scope | ✓ FLOWING |
| draft/export stores | `comparison.range.reviewKey` | `createPinnedRangeComparison()` | SHA-256 domain-separated key over pinned OIDs and ordered pathspecs | ✓ FLOWING |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Protocol, Git, session, draft, export, and interactive contracts | `npm exec -- vitest run tests/cli/request.test.ts tests/cli/selection.test.ts tests/git/comparison.test.ts tests/git/inventory.test.ts tests/unit/comparison-key.test.ts tests/api/session.test.ts tests/unit/draft-load.test.ts tests/api/draft.test.ts tests/unit/review-export.test.ts tests/api/export.test.ts tests/api/export-publication.test.ts` | 11 files, 145 tests passed in 5.18s | ✓ PASS |
| Generated binary stdin → browser range flow, invalid pathspec pre-launch failure, scoped inventory, empty/error/retry/modal interaction | `npm run build && npm exec -- playwright test tests/e2e/pinned-session.spec.ts` | Production build succeeded; 11 Playwright tests passed in 22.7s | ✓ PASS |

## Requirements Coverage

| Requirement | Source plans | Status | Evidence |
| --- | --- | --- | --- |
| AGENT-01 | 12-01, 12-03, 12-06 | ✓ SATISFIED | Strict reader, pre-prompt dispatch, and generated browser flow prove one request opens one scoped session. |
| AGENT-02 | 12-01, 12-03, 12-06 | ✓ SATISFIED | Request error matrix and generated invalid-native-pathspec process test prove safe nonzero pre-launch failure. |
| AGENT-03 | 12-03 | ✓ SATISFIED | Injected TTY discover → pick → pin → confirm → launch ordering remains covered by `tests/cli/selection.test.ts`. |
| RANGE-01 | 12-02 | ✓ SATISFIED | Two endpoint resolutions, OID-only downstream Git commands, equality/ancestry failures, and moved-ref tests pass. |
| RANGE-02 | 12-02 | ✓ SATISFIED | Exact ordered `--` pathspec tails, environment clearing, and native magic/error tests pass. |
| RANGE-03 | 12-02 through 12-06 | ✓ SATISFIED | Frozen scope flows through inventory, session, draft, export, publication, and UI. |

All six Phase 12 requirements in `REQUIREMENTS.md` are claimed by at least one plan; none is orphaned.

## Anti-Patterns Found

No blocker or warning anti-pattern was found in the Phase 12 production artifact set. The source scan found no untracked `TBD`, `FIXME`, `XXX`, `TODO`, `HACK`, placeholder, hardcoded-empty rendering, or orphaned artifact. The no-pathspec E2E assertion matches the explicit UI-SPEC exception and is therefore valid coverage.

## Gaps Summary

No gaps found. No later-phase deferral is needed.

---

_Verified: 2026-08-04T21:16:18Z_  
_Verifier: the agent (gsd-verifier)_
