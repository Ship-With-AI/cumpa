---
phase: 15-adversarial-integration-gate
plan: "01"
verified: 2026-08-06T11:10:12Z
status: passed
score: 6/6
re_verification: true
requirements:
  - HAND-06
must_haves:
  truths:
    - "Separate attached submissions over identical Git inputs retain independent request identities, drafts, exports, and returned feedback."
    - "An attached review cannot resume, overwrite, reveal, publish, or recover through the interactive identity for the same revisions."
    - "Completing, delivery-failing, cancelling, or concurrently/doubly finishing one attached review leaves peers unchanged and never emits duplicate or partial success output."
    - "Range and exact-patch attached submissions retain the same deterministic source reviewKey/provenance while mutable storage is invocation-local."
    - "Draft path, temporary names, queue key, export publication, reveal, and recovery use the one validated server-created scope."
    - "Interactive draft/export identities, canonical schemas and source-provenance validation remain compatible."
  prohibitions:
    - "No client-controlled attached storage identity, invalid scope fallback, or weakening of path/provenance/atomicity guards."
---

# Phase 15: Adversarial Integration Gate — Re-verification

**Verdict: PASS.** Current code, focused regression sources, and recorded final gates establish HAND-06. No additional test command was run.

## Goal-backward must-have verification

| # | Must-have truth | Status | Code and behavior evidence |
|---|---|---|---|
| 1 | Equivalent attached submissions have independent identities, drafts, exports, and returned feedback. | VERIFIED | `src/cli/run.ts:435-443` makes one fresh `agent-${randomBytes(16).toString('hex')}` scope per `launchAttachedSession()` alongside separate token/coordinator, then passes it to both range and patch factories (`:484-503`, `:543-568`). `draft-loader.ts:96-108` and `export-store.ts:123-142,224-226,334-348` use that scope only for mutable filenames. Range tests prove distinct scope-backed drafts (`tests/api/draft.test.ts:196-218`); patch tests prove equal keys with distinct draft/export paths (`tests/api/exact-patch.test.ts:174-225`); the packaged scenario proves distinct drafts, isolated outputs, and equal V2 `reviewKey` (`tests/e2e/agent-ready-export.spec.ts:604-668`). |
| 2 | Attached work cannot use the same-revision interactive draft/export identity. | VERIFIED | Without a scope, legacy deterministic keys remain (`src/server/draft-loader.ts:101-105`, `src/server/export-store.ts:133-142`); attached scopes must match `agent-` plus 32 lowercase hex bytes (`draft-loader.ts:17-21`), a grammar disjoint from legacy keys. Both capability registries use the scope for draft/export/reveal/recovery (`src/server/capabilities.ts:268-291,448-452,562-564,617-635,772-804`). Publication coverage proves legacy recovery, scoped publication/recovery, and traversal rejection (`tests/api/export-publication.test.ts:235-292`). |
| 3 | Completion, delivery failure, cancellation, and duplicate/concurrent Finish are invocation-local; no duplicate or partial success output occurs. | VERIFIED | Every launch creates a new coordinator and shutdown controller (`src/cli/run.ts:414-433`). `AttachedCompletionCoordinator` owns private per-instance state and coalesces Finish (`src/server/attached-completion.ts:9-89`). The focused peer test proves a failed coordinator cannot affect a concurrently completing peer and duplicate Finish delivers once (`tests/api/attached-completion-coordinator.test.ts:66-94`). CLI coverage proves cancellation writes no stdout and exits 130, not 0 (`tests/cli/request.test.ts:254-339,342-424`). |
| 4 | Range and exact-patch source provenance remains deterministic while mutable storage differs. | VERIFIED | `sameComparison()` continues deterministic comparison validation (`src/server/draft-loader.ts:41-80`) while the scope changes only draft paths. `matchesPublicationIdentity()` continues V2/V3 review-key validation independently of storage name (`src/server/export-store.ts:146-155,260-264`). Exact-patch tests directly assert equal review keys and scoped receipts; packaged range output asserts equal V2 review keys. |
| 5 | One validated invocation scope owns draft canonical/temp/queue and export/reveal/recovery paths. | VERIFIED | `src/server/app.ts:86-111` forwards the attached scope to the draft store; `src/server/draft-store.ts:149-177,265-390` derives canonical path, temporary names, and queue key from the same `key`; `src/server/capabilities.ts` forwards the same scope to publication, reveal and recovery. |
| 6 | Interactive contracts and safety guards remain compatible; clients cannot choose scope. | VERIFIED | Allocation occurs after strict request parsing and accepts no request-derived scope (`src/cli/run.ts:435-443,513-541`). Capability construction revalidates a supplied scope even when a caller injects a draft store; malformed-scope regression covers that seam (`tests/api/attached-completion.test.ts:141-158`). Invalid export scopes fail rather than falling back (`tests/api/export-publication.test.ts:272-292`). Publication retains canonical reread/provenance/Markdown checks and managed-root/symlink/atomicity guards (`src/server/export-store.ts:146-155,185-355`). |

## Artifact wiring

| Artifact | Status | Wiring evidence |
|---|---|---|
| `src/cli/run.ts` | VERIFIED | Sole server-side scope allocation; both app factories receive one `AttachedCompletionOptions`. |
| `src/server/app.ts` | VERIFIED | Same attached scope reaches range draft store/capabilities; patch receives the same options. |
| `src/server/draft-loader.ts`, `src/server/draft-store.ts` | VERIFIED | Strict validator feeds one scope-derived canonical path, temporary name, and queue key. |
| `src/server/export-store.ts` | VERIFIED | Scope selects storage name only; canonical V2/V3 provenance matcher remains independent. |
| `src/server/capabilities.ts` | VERIFIED | Range/patch registries reuse validated scope for draft/export/reveal/Finish boundaries. |
| `tests/e2e/agent-ready-export.spec.ts` | VERIFIED | Extracted CLI, real loopback/browser/pages, descriptor-backed stdout, and actual `.cumpa` files. |

## Recorded focused evidence

No command below was rerun in this re-verification; all were reported green by the phase execution and reconfirmed in the updated `15-01-SUMMARY.md`:

| Gate | Recorded result | Coverage |
|---|---:|---|
| Final build | passed | Current production/test sources compile into shipped package. |
| Focused Vitest | 74/74 passed | Range/patch provenance and storage isolation, interactive compatibility, malformed injected-store scope, coordinator failure/duplicate isolation, CLI output/cancellation. |
| Packaged Chromium | 4/4 passed | Extracted CLI, loopback server, browser, descriptor-backed output, same-input attached range isolation. |
| Package contract | 12/12 passed | Published package contents remain valid. |

## Re-verification refresh

At **2026-08-06T11:10:12Z**, re-read the updated `15-01-SUMMARY.md`. Its newly recorded post-review fix (`477199c`, `ae0892d`) matches current `src/server/capabilities.ts` boundary validation and `tests/api/attached-completion.test.ts` injected-store malformed-scope coverage already inspected above. The summary adds no code or evidence that changes this PASS verdict.

## Requirement disposition

| Requirement | Status | Basis |
|---|---|---|
| HAND-06 | SATISFIED | Attached mutable namespaces are distinct and server-created, deterministic V2/V3 provenance remains equal for equivalent inputs, and lifecycle/output remain invocation-local. |

## Gaps

None.
