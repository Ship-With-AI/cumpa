---
phase: 02-anchored-diff-review
reviewed: 2026-07-21
depth: standard
files_reviewed: 38
files_reviewed_list:
  - scripts/verify-prerequisites.mjs
  - scripts/verify-production-artifacts.mjs
  - src/contracts/api.ts
  - src/contracts/draft.ts
  - src/domain/anchor.ts
  - src/domain/comparison-key.ts
  - src/server/app.ts
  - src/server/capabilities.ts
  - src/server/draft-store.ts
  - src/server/routes.ts
  - src/web/App.vue
  - src/web/api/client.ts
  - src/web/components/CommentComposer.vue
  - src/web/components/CommentsRail.vue
  - src/web/components/DiffWorkspace.vue
  - src/web/components/KeyboardHelp.vue
  - src/web/components/ReviewToolbar.vue
  - src/web/components/ui/UiPrimitives.vue
  - src/web/model/draft-reconciliation.ts
  - src/web/model/workspace-state.ts
  - src/web/monaco/configure.ts
  - src/web/monaco/diff-adapter.ts
  - src/web/monaco/line-mapping.ts
  - src/web/prototypes/MonacoStabilityPrototype.vue
  - src/web/styles.css
  - tests/api/anchor.test.ts
  - tests/api/draft-atomicity.test.ts
  - tests/api/draft.test.ts
  - tests/e2e/anchored-review.spec.ts
  - tests/git/anchored-content.test.ts
  - tests/helpers/git-fixture.ts
  - tests/integration/anchored-workspace.spec.ts
  - tests/integration/monaco-anchor.spec.ts
  - tests/unit/anchor.test.ts
  - tests/unit/comparison-key.test.ts
  - tests/unit/draft-reconciliation.test.ts
  - tests/unit/line-mapping.test.ts
  - tests/unit/workspace-state.test.ts
findings:
  critical: 1
  warning: 2
  info: 0
  total: 3
status: issues_found
---

# Phase 02 — Anchored Diff Review: Code Review

## Narrative Findings (AI reviewer)

The review found one base-side view-zone lifecycle defect that prevents paired-zone alignment and leaks an untracked composer zone. Two further defects leave the required Monaco stability gate non-executable and lose an asynchronously accepted comment from the live workspace when the reviewer switches files during persistence.

Focused verification was run only for the affected browser contract:

```text
npm run test:browser -- tests/integration/monaco-anchor.spec.ts --grep "anchors both base"
```

It fails at `tests/integration/monaco-anchor.spec.ts:98`: after **Add base comment**, the expected composer textarea count is `1`, but the prototype renders `0`.

## Critical Issues

### CR-001 — Base-side composer never owns its original view zone

**Evidence:** `src/web/monaco/diff-adapter.ts:432-435` creates the composer zone on the original/base editor but records only the head-side spacer as `modifiedZone`; unlike the head branch at `:436-440`, it never assigns `originalZone`. `positionZones()` and `growPairedZones()` then return immediately whenever either tracked zone is absent (`:472-485`), while `removeZones()` can remove only tracked IDs (`:390-399`).

**Failure mode:** Activating a base-side composer leaves its counterpart spacer at its initial `afterLineNumber: 0`, so the two panes are not aligned. The base composer zone is also untracked and therefore survives subsequent anchor rebuilds, file switches, and disposal paths that call `removeZones()`. Reopening/repositioning a base comment can accumulate stale zones and cause subsequent annotation mounting/focus to target an old zone. This violates the paired-zone and base-side comment contracts.

**Fix:** In the base branch, store both zones symmetrically before calling `positionZones()`:

```ts
this.originalZone = { id: anchoredZoneId, zone: anchoredZone };
this.modifiedZone = { id: spacerZoneId, zone: spacerZone };
```

Add a focused regression that activates a base anchor, asserts the two zone tops are aligned, then rebuilds/changes files and asserts that exactly two zones remain.

## Warnings

### WR-001 — The Monaco stability prototype does not mount a composer, so its required lifecycle test cannot pass

**Evidence:** `src/web/prototypes/MonacoStabilityPrototype.vue:140-144` only calls `adapter.activateAnchor()`; its template contains only the host at `:211` and has no code that mounts `CommentComposer` into the returned `.monaco-anchor-zone--composer`. The adapter deliberately creates an empty section at `src/web/monaco/diff-adapter.ts:451-455`; production composition mounts the Vue component separately. Yet `tests/integration/monaco-anchor.spec.ts:95-104` requires an actual composer textarea and `Base · line 10` content. The focused Playwright invocation above fails at `:98` with zero matching textareas. The same test also hard-codes `listenerCount: 7` at `:151-160`, despite the adapter's current static listener set being larger, making the bounded-lifecycle assertion stale rather than a leak check.

**Failure mode:** The phase's real-Monaco stability gate is red and does not exercise the intended composer lifecycle, focus, or text restoration behavior. It cannot provide acceptance evidence for the lifecycle guarantees it is meant to protect.

**Fix:** Make the prototype mount the real `CommentComposer` into the adapter's active zone and unmount/re-render it whenever the active anchor changes, using the same ownership boundary as `DiffWorkspace`. Update the test to locate the textarea by its associated label (or intentionally add an accessible `aria-label`) and assert that listener count remains equal to the initialized baseline across recomputation instead of using the obsolete literal `7`.

### WR-002 — Switching files while a comment save is pending discards the completion from live state

**Evidence:** `src/web/model/workspace-state.ts:152-156` permits `switch-file` regardless of whether the active file's composer is `pending`. `src/web/App.vue:160-180` dispatches the asynchronous success after the request resolves. `completePendingComment()` then reads only the *currently active* file and rejects the completion if its file ID differs at `src/web/model/workspace-state.ts:218-225`.

**Failure mode:** A reviewer can submit a comment, switch to another file before the server responds, and receive a successful persisted comment that is neither appended to `state.comments` nor clears the original file's pending composer. The draft exists on disk, but the open workspace falsely remains pending and does not show the accepted comment until a reload.

**Fix:** Either make `switchFile()` a no-op while the active composer is pending (consistent with the existing pending guards for move and cancel), or route completion/failure to the originating file state using a request identity. Add a state-machine test covering submit → switch file → successful completion and verifying the comment is displayed and the original composer is cleared.
