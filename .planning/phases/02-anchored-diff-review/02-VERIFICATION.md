---
phase: 02-anchored-diff-review
verified: 2026-07-21T15:16:43Z
status: gaps_found
score: 25/33 must-haves verified
requirement_score: 8/11 satisfied
behavior_unverified: 0
overrides_applied: 0
reverification_required: true
---

# Phase 02 — Anchored Diff Review Verification

## Goal

> A developer can inspect immutable text changes in a stable Monaco side-by-side workspace, attach a precise durable comment to either side, and recover it after relaunching the same comparison.

**Status: `gaps_found`**

The frozen-content, durable-anchor, atomic-draft, and packaged happy-path layers work. However, the assembled Vue workspace does not meet the goal end to end: its visible pointer controls always create a line-1 composer, it renders a second unanchored composer, and draft-to-file reconciliation discards byte-exact path identity. These are source-confirmed behavioral defects, not missing test runs.

## Verification method and executed evidence

I read the phase plans (`02-01` through `02-07`), UI/Research/Requirements/Review artifacts, Phase 1 verification, summaries, and the implementing server, domain, Monaco, state-machine, and Vue sources. Summary claims were treated only as leads.

| Focused check | Result | What it establishes |
|---|---:|---|
| `npm run verify:prerequisites && npm run build && npm run verify:production-artifacts` | PASS | Node 24/Git/dependency prerequisites, production TypeScript/Vite build, and required packaged artifacts |
| `npm run test:unit -- tests/unit/anchor.test.ts tests/unit/comparison-key.test.ts tests/unit/line-mapping.test.ts tests/unit/workspace-state.test.ts` | PASS — 7 files, 53 tests | durable anchor derivation/verification, comparison keys, line mapping, state transitions |
| `npm run test:git -- tests/git/anchored-content.test.ts` | PASS — 6 files, 28 tests | frozen Git content and side/path/blob behavior |
| `npm run test:api -- tests/api/anchor.test.ts tests/api/draft.test.ts tests/api/draft-atomicity.test.ts` | PASS — 5 files, 46 tests | closed anchor/draft API and atomic replacement behavior |
| `npm run test:browser -- tests/integration/monaco-anchor.spec.ts tests/integration/anchored-workspace.spec.ts` | PASS — 13 tests | Monaco prototype geometry and workspace browser happy paths |
| `npm run test:package -- tests/e2e/anchored-review.spec.ts` | PASS — 1 Chromium test | packed CLI real-Git same-pair happy-path relaunch |
| Supplied Phase 1 packaged-regression evidence | PASS — 10 tests | Phase 1 packaged behavior remains green; not relied on to prove Phase 2 defects absent |

The automated evidence is necessary but insufficient. The browser prototype exercises the standalone Monaco adapter, whereas the production Vue workspace introduces a second composer. The packaged test also only operates the line-1 controls and asserts duplicate visible comment text, so it does not prove arbitrary-line pointer placement or a single anchored composer.

## Blocking findings

### 1. Pointer comment controls hard-code line 1 — `CMT-01` blocked

`src/web/components/DiffWorkspace.vue` implements `addComment(side)` as `adapter?.activateAnchor(side, 1)`. The only visible controls are explicitly labelled “Add comment to base/head line 1.” This is not a gutter action on the chosen visible line and cannot satisfy the required pointer path for any visible base/head line, including unchanged context.

The Monaco adapter's keyboard action correctly calls `activateFocusedAnchor(side)` with the editor cursor line, but that does not repair the visible pointer contract. `tests/integration/anchored-workspace.spec.ts` and `tests/e2e/anchored-review.spec.ts` exercise only the line-1 controls.

### 2. Production renders two composers — `DIFF-07` and placement contract blocked

`DiffWorkspace.vue` renders `CommentComposer` twice for the active draft:

1. imperatively with Vue `render()` inside the Monaco annotation zone; and
2. declaratively after the editor host in its template.

The first is anchored; the second is not. This violates the UI specification's “only one active composer” and “directly below the selected line on that side” rules. It also invalidates the requirement that a comment remains correctly attached and aligned as context is expanded, files are switched, or layout changes. The standalone `monaco-anchor` prototype passes because it does not exercise this Vue composition.

### 3. Same-pair resume maps persisted comments by display text, not exact path bytes — `DRFT-02` blocked

`src/web/App.vue` `draftComment()` finds the live file by comparing `path.display === comment.anchor.safeDisplayPath`. It ignores `anchor.path.bytesBase64url`, even though the persisted anchor stores it and `ExactPath` defines it as the lossless identity. `src/domain/path-bytes.ts` produces display strings by replacement-decoding non-UTF-8 bytes; distinct invalid byte paths can share a display string. When that happens `matchingFiles.length !== 1`, the UI assigns `unavailable:<comment-id>` and cannot restore the comment to its correct file after relaunch.

The server and persisted contract are byte-exact; the client reconciliation loses that identity. Existing tests use ASCII display paths and therefore do not cover the failure.

### 4. Related workspace interaction defects

These defects independently validate the review findings and prevent the required durable-comment workflow from being reliable:

- **Draft movement cannot be confirmed.** `workspace-state.ts` transitions a non-empty draft to `confirm-move`, but the component emits `confirm-discard`; the state machine accepts that event only for `confirm-discard`, so the attempted move is a no-op.
- **Stale/orphan “Inspect” is inert.** `CommentsRail.vue` emits `inspect`, but `App.vue` maps it to `show-comment`; `showComment()` deliberately returns no commands for anything other than a verified comment. The rail gives no recorded byte/blob/context details or copy action, so this is not an actionable inspection path.
- **Drawer and focus behavior do not meet the UI contract.** CSS turns the comments rail into a drawer at `max-width:1439px`, but `isNarrow` is only `max-width:1099px`; at 1100–1439px its opened drawer has no Close button. The inactive rail/navigation is never inert, and `syncActiveAnchor()` schedules rendering but never focuses the composer textarea.

## Requirement coverage

| Requirement | Verdict | Actual-code and behavior evidence |
|---|---|---|
| `DIFF-02` | SATISFIED | `createMonacoDiffAdapter()` configures a read-only `IStandaloneDiffEditor`; the 13 focused browser tests include the real Monaco immutable side-by-side prototype. |
| `DIFF-03` | SATISFIED | `ImmutableDiffFile` retains separate base/head `{path,text}`; adapter model URIs and `languageForPath` are side/path specific. Git and unit suites passed. |
| `DIFF-04` | SATISFIED | Adapter exposes public collapsed/all-context behavior and `revealAnchor()`; prototype scenarios exercise hidden-context reveal. |
| `DIFF-05` | SATISFIED | Adapter exposes public previous/next diff commands and workspace/toolbar dispatches them; browser navigation test passed. |
| `DIFF-07` | BLOCKED | Monaco prototype geometry passes, but production `DiffWorkspace.vue` renders a second, unanchored `CommentComposer`; the visible workspace therefore cannot guarantee one correctly attached/aligned comment presentation. |
| `CMT-01` | BLOCKED | Pointer `+` controls call `activateAnchor(side, 1)` regardless of selected model line. Keyboard cursor activation works but does not fulfill pointer activation for any visible line. |
| `CMT-02` | SATISFIED | `buildDurableAnchor()` derives exact side/path/line/blob/selected text/bounded context/hash; routes derive it server-side from frozen capability content. Unit, Git, and API checks passed. |
| `CMT-08` | SATISFIED (with rail UX gap) | `verifyDurableAnchor()` performs exact verification without relocation and routes return verified/stale/orphaned state. Rail shows stale/orphan badges without an inline relocation. Its inert Inspect action is a separate UI-spec/plan gap. |
| `DRFT-01` | SATISFIED | `draft-store.ts` serializes writes and performs temp create → write → sync → close → rename → directory sync before success; API atomicity tests passed. |
| `DRFT-02` | BLOCKED | Server comparison key persistence is correct, but client resume matches only `safeDisplayPath`, not stored exact path bytes, so same-comparison comments can be unavailable for distinct non-UTF-8 paths with equal display text. |
| `DRFT-03` | SATISFIED | `comparisonKey` and draft routes are session/comparison-owned; API tests cover same-pair recovery and different-pair isolation. |

**Requirement total: 8/11 satisfied.**

## Plan must-have evidence

The score counts the 33 explicit must-haves across plans `02-01`–`02-07`. A passing automated test is not marked verified when direct production source contradicts the must-have.

| Plan | Must-have verdicts | Evidence |
|---|---|---|
| `02-01` | 4/4 verified | Real read-only Monaco, side/model-line anchor prototype, public zone alignment/reveal lifecycle, and ten prototype scenarios exist and passed through the focused browser command. This validates the adapter only, not the later Vue composition. |
| `02-02` | 4/4 verified | Canonical anchor schema/derivation, frozen side capability lookup, strict route input, and exact stale/orphan classification are implemented; unit/Git/API checks passed. |
| `02-03` | 4/4 verified | Comparison-keyed versioned draft, serialized atomic replacement, same/different comparison server behavior, and failure preservation are implemented and API-tested. |
| `02-04` | 3/4 verified | Per-file session state, post-ready restore ordering, and public command coordination are implemented/tested. The non-empty-draft move/discard must-have fails because `confirm-move` has no confirmation transition. |
| `02-05` | 4/6 verified | File tree/toolbar/strip/async shell/public controls work. Focus management and responsive drawer accessibility fail: textarea focus is not requested; drawer close/inert behavior is inconsistent from 1100–1439px. |
| `02-06` | 3/6 verified | Opaque add request and local accepted-state wiring work. Single exact-line composer placement, verified/stale/orphan navigation behavior, same-pair visual reconciliation, and arbitrary-line pointer coverage fail for the blockers above. |
| `02-07` | 3/5 verified | Prerequisites/build/artifacts and packed real-Git happy path pass; stale/orphan remains visible without relocation. The all-requirements evidence claim and same-pair recovery claim fail because the packaged test omits the identified production paths. |

## Roadmap success criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| Read-only selected supported file with language IDs, collapsed context, visible navigation | VERIFIED | Adapter and focused browser evidence. |
| Add a comment to either side on any visible line, including revealed context | FAILED | Pointer controls are fixed to line 1. |
| Comment presentation stays attached/aligned across context, resize, file switching, and recomputation | FAILED | Prototype behavior passes, but production renders a second non-zone composer. |
| Accepted comment persists atomically, resumes for same pair, and isolates other pair | FAILED | Atomic store and server pair isolation pass; client’s display-only path matching can fail to resume exact-path records. |
| Exact stale/orphan records remain clearly distinguished with no relocation | VERIFIED | Domain/server exact verification and rail badges show stale/orphan without relocation. |

## Human verification

None is required to classify the current status. The gaps are deterministic source-to-behavior failures. After repair, manually confirm a comment can be opened by clicking a non-line-1 unchanged base line and a non-line-1 head line at wide, 1100–1439px, and narrow widths; this supplements, rather than replaces, focused browser assertions.

## Reverification scope

1. Replace line-1 controls with per-selected-line pointer activation and add a browser scenario for base/head unchanged lines other than line 1.
2. Retain exactly one composer in the Monaco zone; remove the unanchored duplicate and assert a single textarea/anchor zone across resize, context reveal, and file switching.
3. Reconcile resumed draft anchors using `bytesBase64url` (and side-specific exact-path identity), then test two non-UTF-8 paths with equal replacement-display text.
4. Implement a deliberate confirm-move transition, actionable stale/orphan inspection details, required drawer close/inert/focus handling, and focused tests.
5. Rerun the focused checks in this report plus the packaged acceptance scenario.

## Next command

`/gsd:plan-phase 2 --gaps`
