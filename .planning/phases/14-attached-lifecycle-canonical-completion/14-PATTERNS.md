# Phase 14: Attached Lifecycle & Canonical Completion — Pattern Map

**Mapped:** 2026-08-05  
**Source of truth:** final `14-RESEARCH.md`, approved `14-CONTEXT.md`, approved `14-UI-SPEC.md`  
**Scope:** HAND-01 through HAND-05 only  
**Files analyzed:** 26 source/test analog groups  
**Analogs found:** 26 / 26

This phase extends the existing authenticated session and terminal launch seams. It does not create a second workspace, a status dashboard, a terminal monitor, a new draft/export format, or a UI primitive set.

## File Classification

| Target ownership / file area | Role | Data flow | Closest current analog | Match |
|---|---|---|---|---|
| `src/contracts/api.ts` | contract/schema | request-response, state transition | `DraftMutation*`, `DraftLoadResponseSchema`, `ExportReview*` | exact |
| `src/server/app.ts`, `src/server/routes.ts` | app assembly / route | authenticated request-response | `createSessionApp`, `registerSessionRoutes`, strict query/body guards | exact |
| `src/server/capabilities.ts` | capability/service | CRUD + validation + event delivery | `exportReview`, `verifyAnchor`, frozen capability registries | exact |
| `src/server/draft-store.ts` | persistence/service | file I/O, serialized CAS | `runSerialized`, `mutate`, `recover`, atomic `commit` | exact |
| new attached completion coordinator (session-local) | lifecycle coordinator | request-response, one-shot event delivery | `createShutdownController` plus draft-store queue/CAS | role + data-flow match |
| `src/cli/run.ts` | CLI controller | request-response, terminal streaming | `runOrdinaryAction`, `launchExactPatchSession`, `createLaunchRuntime` | exact |
| `src/server/lifecycle.ts` | shutdown utility | signal/event-driven | idempotent `createShutdownController` | exact |
| `src/export/review-export.ts` | canonical serializer/validator | transform, canonical bytes | `buildReviewExportV2/V3`, `canonicalizeReviewExport`, parser | exact |
| `src/web/api/client.ts` | API client | authenticated request-response | `requestJson`, Zod parse before state mutation | exact |
| `src/web/App.vue` | state coordinator/controller | browser state machine | `reviewDraft`, `mutateReview`, session loading/failure ownership | exact |
| `src/web/components/ReviewPanel.vue` | component | stateful request-response | existing Summary/Open/Resolved/Export sections, emits, focus | exact |
| `src/web/components/IdentityHeader.vue` | component | render | existing session identity/header facts | role match |
| `src/web/components/InlineNotice.vue`, `ui/ReviewStateBadge.vue` | shared UI | render/accessibility state | existing notice/badge semantics | exact |
| `src/web/components/ExportSection.vue`, `ExportReceipt.vue` | component | export request-response | existing ordinary export and receipts | exact; preserve |
| `tests/cli/request.test.ts` | CLI contract test | streams, dispatch, errors | injected `output`/unused `stdout` seam and TTY isolation | exact |
| `tests/api/session.test.ts`, `draft-lifecycle.test.ts`, `draft-conflict.test.ts`, `export.test.ts` | API tests | Fastify inject, auth, CAS | current status/body and denial assertions | exact |
| `tests/api/draft-atomicity.test.ts`, `draft-recovery-faults.test.ts` | persistence/race tests | file I/O, fault injection | injected `DraftFileSystem`, atomic byte checks | exact |
| `tests/unit/review-export.test.ts`, `tests/package/agent-ready-export*.test.ts` | serializer/package tests | transform, canonical bytes | schema/provenance/hash/no-newline assertions | exact |
| `tests/unit/workspace-state.test.ts`, `draft-mutations.test.ts` | browser model tests | state transitions | accepted-vs-buffer, conflict, read-only boundaries | exact |
| `tests/integration/complete-review-panel.spec.ts`, `tests/e2e/review-panel-resolved.spec.ts` | UI integration tests | browser request-response/accessibility | harness-driven pending/conflict/focus/disabled behavior | exact |
| `tests/e2e/complete-review-draft.spec.ts`, `agent-ready-export*.spec.ts` | packaged browser/CLI tests | end-to-end process + browser | loopback URL, packaged CLI, export safety, process lifetime | exact |

## Pattern Assignments

### 1. Contracts, capability registry, and authenticated routes (HAND-01, HAND-02, HAND-05)

**Sources:** `src/contracts/api.ts:1-205` (`DraftMutationRequestSchema`, `DraftLoadResponseSchema`, mutation result discriminants); `src/server/app.ts:26-160`; `src/server/routes.ts:1-329`; `src/server/capabilities.ts:87-113,244-319,364-477,487-620`.

Copy these conventions:

- Extend strict Zod schemas with `.strictObject`, `RevisionSchema`, and discriminated `kind`/`type` unions. Unknown fields, malformed revisions, wrong mode/identity, and non-empty query strings fail closed. Keep public result discriminants bounded (`completed`, `revisionConflict`, `staleAnchors`, `scopeInvalid`, `draftReadOnly`, `persistenceFailure`, `deliveryFailed`, `alreadyCompleted`).
- Add optional attached metadata/status and a finish capability to the existing `SessionResponse`/capability registry. Register it only when the CLI injects an attached coordinator; interactive TTY sessions must retain their current response and route surface.
- Follow `registerSessionRoutes`: authenticated existing route hook, empty-query schema, explicit JSON content type/body limit, `safeParse` before capability calls, generic unavailable errors, and explicit HTTP mapping. The browser receives typed status/failure data, never canonical result bytes.
- Reuse `capabilities.verifyAnchor`, frozen range/patch capabilities, and existing export revalidation inputs. Do not create a finish-specific token, raw exception response, or alternate identity resolver.

### 2. Lifecycle coordinator and settled draft operation (HAND-02, HAND-05)

**Sources:** `src/server/draft-store.ts:36-92,233-319`; `src/server/lifecycle.ts:21-92`; `src/server/capabilities.ts:364-477,487-620`.

The coordinator owns a minimal immutable session-local state machine:

```ts
type AttachedCompletionState =
  | { kind: 'waiting' }
  | { kind: 'finishing'; expectedRevision: number }
  | { kind: 'completed'; revision: number }
  | { kind: 'failed'; failure: FinishReviewFailure };
```

Its `finish(expectedRevision)` suppresses duplicate/concurrent calls, shares one in-flight attempt, and never redelivers after `completed`. Definitive failures return to retryable unfinished state only after the attempt settles. Reload/status reads the same server-authoritative state. Ambiguous disconnect never auto-retries.

**Required handoff order inside the draft store's existing per-key `runSerialized` boundary** (do not load/validate outside the queue):

1. Acquire the same queue used by `mutate`/`recover`.
2. Load canonical draft bytes. Reject `malformed`, `schemaInvalid`, and `newerUnsupported`; never recover/overwrite during finish.
3. Compare `expectedRevision` with current accepted revision; return expected/actual conflict and no result bytes on mismatch.
4. Clone/freeze the accepted draft and retain its raw canonical fingerprint.
5. Revalidate submitted range selector identity or exact-patch digest/validation target/review key and current scope/snapshot status.
6. Verify every recorded durable anchor with `verifyAnchor`; any stale/unavailable/orphaned verification blocks completion and leaves anchors unchanged.
7. Build exactly one mode-specific canonical document: range `buildReviewExportV2(acceptedSnapshot, range, completedAt)`; exact patch `buildReviewExportV3(acceptedSnapshot, patchScope, completedAt)`.
8. `canonicalizeReviewExport(document)` once; optionally parse the bytes with `parseCanonicalReviewExport` at the completion boundary. Do not wrap or serialize a second time.
9. Invoke the injected CLI delivery callback with unchanged bytes and await delivery completion/backpressure. Delivery failure is unfinished and never success.
10. Mark coordinator completed only after delivery succeeds; finish route sends immutable confirmation.
11. Await HTTP response settlement, then invoke idempotent shutdown. This order prevents browser disconnect before confirmation.

Because `runSerialized` is currently file-private, expose the smallest store operation that holds the queue while producing/validating the accepted snapshot (`settle(expectedRevision, operation)` or equivalent); do not add a second mutex in routes/capabilities.

### 3. CLI/stdout and shutdown ownership (HAND-03)

**Sources:** `src/cli/run.ts:150-243,366-499`; `src/server/lifecycle.ts:26-92`; `tests/cli/request.test.ts:250-353`; `tests/e2e/complete-review-draft.spec.ts:1-150`.

Reuse non-TTY launch ownership and exact-patch/range split. Add an injected `stdout` dependency while retaining `output` as stderr. The TTY branch remains unchanged and never receives attached metadata or Finish routes.

Exact channel contract:

- **stdout:** exactly one canonical V2/V3 JSON byte sequence, no added newline, only after validated delivery succeeds.
- **stderr:** loopback URL/fallback, progress, bounded validation/grounding/delivery diagnostics, security denials, signals, and shutdown failures; never canonical success JSON or secret request content.
- **browser response:** typed lifecycle status/revision and recovery data; never canonical JSON, download/copy/reveal affordances, or terminal diagnostics.

Terminal sequence is: emit URL/fallback to stderr → keep process/server attached while awaiting coordinator → write one canonical stdout document and await write completion → let finish response settle → call `createShutdownController.shutdown(0)`. Any validation, persistence, delivery, signal, or shutdown failure leaves stdout empty, emits one bounded stderr diagnostic, sets nonzero status, and shuts down. Treat `EPIPE`/partial write as delivery failure; do not retry or mark completed. Reuse `createShutdownController` idempotence and signal abort behavior.

### 4. Canonical V2/V3 serializers and provenance (HAND-04)

**Source:** `src/export/review-export.ts:1-90,92-217,219-250`; contracts in `src/contracts/draft.ts:20-78,180-444`; tests `tests/unit/review-export.test.ts`, `tests/package/agent-ready-export.test.ts`.

Reuse existing builders unchanged unless a narrowly named type alias is necessary:

- V2 includes exact requested base/head labels, pinned OIDs, merge base, pathspec order/value, and `reviewKey`.
- V3 includes exact patch digest, validation target, `reviewKey`, and frozen snapshot status.
- Both include accepted revision, summary, comments, lossless paths, durable anchors, and verification records.
- Builder provenance checks reject mismatches. Canonicalization rejects unsupported values, sorts deterministically, emits no whitespace and no trailing newline. CLI emits these bytes unchanged and exactly once.

Do not add a completion wrapper, parallel feedback schema, browser canonical-result serializer, temp result file, or second IPC protocol.

### 5. Browser client, App state, and completion panel (HAND-01, HAND-02)

**Sources:** `src/web/api/client.ts:1-183`; `src/web/App.vue:92-98,325-439,1059-1103`; `src/web/components/ReviewPanel.vue:1-123,275-607`; approved `14-UI-SPEC.md:19-23,102-244,284-301`.

`SessionClient` follows `requestJson` authentication and Zod parsing. Add typed status/finish methods and parse every response before mutating browser state. Browser requests completion but does not construct or own canonical JSON.

`App.vue` remains the owner of attached lifecycle state, separate from repository draft state: waiting/finishing/completed/failure, readiness from accepted revision plus pending/conflict/read-only/unsaved buffers, reload status, disconnect recovery, and mutation/export locks. Server CAS/queue remains race authority; a disabled button is only presentation. Preserve accepted-vs-buffer behavior from `review-draft-state` and existing failure focus.

Pass a compact typed attached prop/event contract to `ReviewPanel.vue`. Append one `Finish attached review` section after Export only for attached sessions. Reuse `ReviewStateBadge`, `InlineNotice`, `UiIcon`, `.ui-button`, spinner, existing panel border/surfaces, and existing 4-point spacing/CSS tokens. `IdentityHeader.vue` gets only the neutral compact facts:

- `Agent attached · waiting for Finish review`
- `Agent attached · finishing review`
- `Agent review finished`

Use the approved exact copy and focus/accessibility behavior: native button, `aria-busy`, polite live validation update, focus success heading with `tabindex="-1"`, focus failure notice with `role="alert"`, actual `disabled`/`aria-disabled`, visible explanation for disabled states, and no repeated unchanged announcements. During finishing, lock mutations/export but keep file/diff navigation readable. After confirmed completion, content remains readable but comment/summary/export/finish mutations are immutable.

Preserve `ExportSection` and receipts; after ordinary export success in an attached session add only the exact unfinished support copy. Export is never a completion transition.

## Explicit Planner Sequencing and File Ownership

Plans should hand off in this order, with no cross-owner shortcuts:

1. **Contracts/API seam:** owner `src/contracts/api.ts` plus request tests (`tests/cli/request.test.ts`, `tests/api/draft-lifecycle.test.ts`). Define strict attached metadata, status, finish request, and result discriminants first.
2. **Persistence seam:** owner `src/server/draft-store.ts` plus `tests/api/draft-atomicity.test.ts` and recovery fault tests. Expose the smallest queued settle operation; prove mutation/finish races produce latest accepted result or explicit revision conflict.
3. **Coordinator/capability seam:** owner new lifecycle coordinator plus `src/server/capabilities.ts`, `src/server/app.ts`, `src/server/routes.ts`; tests in `tests/api/session.test.ts`, `draft-conflict.test.ts`, `export.test.ts`. Inject delivery, enforce one-shot CAS and full scope/anchor validation.
4. **Canonical delivery seam:** owner `src/export/review-export.ts` integration and `src/cli/run.ts`, `src/server/lifecycle.ts`; tests in `tests/unit/review-export.test.ts`, `tests/package/agent-ready-export*.test.ts`, `tests/cli/request.test.ts`. Write one canonical stdout document, keep diagnostics stderr, settle response before shutdown.
5. **Browser client/state seam:** owner `src/web/api/client.ts`, `src/web/App.vue`; tests `tests/unit/workspace-state.test.ts`, `tests/unit/draft-mutations.test.ts`. Rehydrate server status, model readiness/failures, and lock correctly.
6. **Browser presentation seam:** owner `ReviewPanel.vue`, `IdentityHeader.vue`, `InlineNotice.vue`, `ReviewStateBadge.vue`, with `ExportSection.vue` support copy only; tests `tests/integration/complete-review-panel.spec.ts`, `tests/e2e/review-panel-resolved.spec.ts`.
7. **Packaged end-to-end seam:** owner `tests/e2e/complete-review-draft.spec.ts`, `agent-ready-export*.spec.ts`; prove both range and exact-patch attached sessions use the existing workspace, explicit Finish is one-shot, ordinary export/close/reload/disconnect stay unfinished, stdout/stderr ownership is exact, and shutdown follows response settlement.

No plan may let browser code own canonical bytes, let routes bypass the draft queue, or let CLI alter the TTY path.

## UI Anti-Patterns Explicitly Prohibited

- No second browser workspace, request-status page, dashboard, terminal monitor, agent avatar, chat UI, or modal confirmation.
- No attached UI for interactive TTY sessions; no Finish action outside agent-attached range/exact-patch sessions.
- No automatic completion on export, close, reload, navigation, disconnect, save, comment resolution, zero-feedback state, idle timeout, or ordinary lifecycle events.
- No sticky footer, full-screen confirmation, toast-only success, celebration animation/sound, overlay over Monaco, completion banner, or narrowed/covered diff.
- No `Continue anyway`, force-finish, selector reinterpretation, refresh-to-current, current-worktree fallback, stale-anchor relocation, fuzzy rebind, orphan reactivation, or ambiguous-disconnect retry.
- No browser download/copy/reveal of canonical stdout JSON; no URL/progress/diagnostics mixed into stdout.
- No new design system, shadcn initialization, component registry, icon dependency, alert primitive, or parallel CSS/token set.
- No success language, success color/icon, or “returned” claim before server-confirmed canonical delivery; do not call completion “published.”
- No change to ordinary export mechanics, receipts, file inventory, Monaco rendering, comment/summary semantics, exact-patch frozen-content rules, or draft format.

## Test Layer Handoff

| Contract | Required proof analogs |
|---|---|
| Strict schemas, unknown fields, mode/identity/revision/result mapping | `tests/cli/request.test.ts`, `tests/api/draft-lifecycle.test.ts` |
| Authenticated finish route, denial, status mapping, one-shot/reload | `tests/api/session.test.ts`, `tests/api/draft-conflict.test.ts`, `tests/api/export.test.ts`, existing `security.test.ts` conventions |
| Queue settlement, mutation race, malformed/read-only, atomic bytes | `tests/api/draft-atomicity.test.ts`, `tests/api/draft-recovery-faults.test.ts`, `tests/unit/draft-reconciliation.test.ts` |
| V2/V3 provenance, anchor verification, canonical bytes/no newline/hash | `tests/unit/review-export.test.ts`, `tests/git/anchored-content.test.ts`, `tests/package/agent-ready-export*.test.ts` |
| App readiness, unsaved/conflict locks, completion transitions | `tests/unit/workspace-state.test.ts`, `tests/unit/draft-mutations.test.ts`, `tests/integration/complete-review-panel.spec.ts` |
| Accessibility/focus/disabled controls and stale comment behavior | `tests/e2e/review-panel-resolved.spec.ts`, `tests/integration/complete-review-panel.spec.ts` |
| Both attached input modes, explicit-only lifecycle, process lifetime, exact streams | `tests/e2e/complete-review-draft.spec.ts`, `tests/e2e/agent-ready-export*.spec.ts`, `tests/e2e/agent-ready-export-safety.spec.ts` |

## No Analog Found

None. Every HAND-01..HAND-05 concern has a current source or test analog. The only genuinely new seam is the session-local completion coordinator, which must compose existing `DraftStore.runSerialized`/CAS, capability verification, canonical V2/V3 builders, injected CLI output, and idempotent shutdown rather than introduce parallel mechanisms.

## Metadata

**Analog search scope:** `src/contracts`, `src/server`, `src/cli`, `src/export`, `src/web`, `tests/api`, `tests/unit`, `tests/integration`, `tests/e2e`, `tests/package`, `tests/git`  
**Pattern extraction date:** 2026-08-05  
**Research closure:** final `14-RESEARCH.md` states all HAND-01..HAND-05 are fully mapped with no external dependency or open implementation question.

No unresolved pattern questions, blockers, or warnings.
