---
phase: 11-workspace-shell-review-surfaces
verified: 2026-09-14T02:35:09Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification_closed_by: .planning/phases/11-workspace-shell-review-surfaces/11-UI-REVIEW.md (live packaged CLI session, 2026-09-14 r2; 24/24, all live checks passed, zero new visual deviations; captures under .planning/ui-reviews/11-live-20260914-r2/)
re_verification:
  previous_status: gaps_found
  gaps_closed:
    - "The complete packaged browser flow remains reliable when the whole browser suite runs in configured order."
  gaps_remaining: []
  regressions: []
behavior_unverified_items:
  - truth: "The desktop, full-desktop, and mobile surfaces are visually equivalent to the approved reference captures, except for documented production-data differences."
    test: "Open a live pinned session at the reference desktop, full-desktop, and mobile viewports and compare it with mockups/01b-desktop.png, mockups/01b-desktop-full.png, and mockups/01b-mobile.png."
    expected: "Identity header, ordered comparison strip, toolbar, files treatment, full-width diff, Review notes entry, footer, and mobile Changed files sheet match the approved composition."
    why_human: "The focused browser tests exercise semantics, ordering, focus, and state transitions, but this verifier did not capture or pixel-compare the approved reference images."
human_verification:
  - test: "Compare a live pinned session at the three approved reference viewports with mockups/01b-desktop.png, mockups/01b-desktop-full.png, and mockups/01b-mobile.png."
    expected: "The shell is visually equivalent apart from documented production-data differences; mobile presents the Changed files dialog and retains file → Base → Head order."
    why_human: "Visual equivalence and design quality cannot be established from DOM and behavioral assertions alone."
---

# Phase 11: Workspace Shell & Review Surfaces Verification Report

**Phase Goal:** Reviewers use the mockup-equivalent shell, dialogs, inline comment surfaces, comments rail, and mobile files flow while critical warnings remain continuously visible.

**Verified:** 2026-09-14T02:35:09Z  
**Status:** human_needed  
**Re-verification:** Yes — after gap closure

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Desktop/full-desktop/mobile shell has the required mockup-equivalent composition and exact-patch identity. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `IdentityHeader.vue`, `ActiveFileToolbar.vue`, and `ShellFooter.vue` render the required structure; `responsive-session.spec.ts` passed. No reference-image comparison was captured by this verifier. |
| 2 | Desktop files can hide/restore without remaining tabbable; narrow view uses Changed files and retains file → Base → Head order. | ✓ VERIFIED | `ChangedFilesDialog.vue` contains a single teleported `FileTree`; `App.vue` selects the dialog on narrow view and inerts the review shell. `responsive-session.spec.ts` passed in the 30-test focused browser run. |
| 3 | Details and Review notes are modal surfaces that retain full-width diff. | ✓ VERIFIED | `DetailsDialog.vue` composes identities, metadata, and keyboard help; `ReviewNotesDialog.vue` composes summary/export/receipt/attached completion through `ModalDialog.vue`. `review-notes-dialog.spec.ts` and `responsive-session.spec.ts` passed. |
| 4 | Inline comments and comments rail retain lifecycle, navigation, announcement, and paired containment behavior. | ✓ VERIFIED | `anchored-review.spec.ts`, `review-panel-resolved.spec.ts`, and `anchored-workspace.spec.ts` passed in the focused 30-test run; the two-spec order regression also passed all 10 tests. |
| 5 | Selector, stale/orphan, patch-drift, and recovery warnings remain in the shell with one correct live owner. | ✓ VERIFIED | `App.vue` renders the simultaneous `.shell-warning-stack`, derives unverified anchors from workspace comments, and has exactly one `aria-live`; `selector-drift-ui.spec.ts` and `draft-recovery-ui.spec.ts` passed. |

**Score:** 4/5 truths verified (5 present, 1 behavior-unverified)

## Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/web/components/IdentityHeader.vue` | Product/ordered comparison identity and Details/Review notes actions | VERIFIED | Handles Base/Head and PREIMAGE/POSTIMAGE identities and exposes the shell actions. |
| `src/web/components/ActiveFileToolbar.vue` | Active path and desktop/narrow Files control | VERIFIED | Computes selected path and exposes narrow `Open changed files` versus desktop hide/show sidebar labels. |
| `src/web/components/ChangedFilesDialog.vue` | Single-state mobile file picker | VERIFIED | One `FileTree` is teleported between `#changed-files` and `#changed-files-dialog-tree`; `ModalDialog` initially focuses `#file-tree-filter`. |
| `src/web/components/DetailsDialog.vue` | Comparison and file details without permanent toolbar | VERIFIED | Wires `IdentityPanel`, current file metadata, retry, and `KeyboardHelp` into one dialog. |
| `src/web/components/ReviewNotesDialog.vue` | Summary/export/receipt/attached completion in a dialog | VERIFIED | Wires actual review state to `SummarySection`, `ExportSection`, comment counts, and attached completion. |
| `src/web/components/ui/ModalDialog.vue` | Shared modal focus contract | VERIFIED | Captures opener, initially focuses a named target or Close, restores focus after close, handles Escape, and cycles Tab/Shift+Tab. |
| `src/web/components/ReviewPanel.vue` | Verified-anchor-only mutations | VERIFIED | Both open and resolved controls disable unverified anchors; edit, lifecycle, and delete entry points return before mutation for stale/orphan records. |
| `src/web/App.vue` | Single shell coordinator and durable warnings | VERIFIED | `shellDialog` is the only dialog owner; shell content/review shell are inert while dialogs are open; warning stack and global polite owner are outside the inert content wrapper. |
| `scripts/pack-runtime.mjs` | Deterministic production browser runtime when packing | VERIFIED | `buildEnvironment()` overrides inherited `NODE_ENV` with `production`; pack lock brackets build/package and releases in `finally`. A `NODE_ENV=development` development-check artifact pack completed successfully. |

## Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| Shell triggers | Modal overlays | `shellDialog`, `openShellDialog()`, `closeShellDialog()` in `App.vue` | WIRED | Details, Changed files, Support, and Review notes are computed from the single dialog union; no concurrent shell dialogs can be open. |
| Shell dialog state | Background interaction | `:inert="shellModalOpen"` and review-shell inert binding | WIRED | Inert content is a sibling of dialog overlays and the global announcer; the focused dialog primitive restores the actual opener on every close route. |
| Viewport transition | Changed-files close/focus | `handleViewportChange()` → `closeChangedFiles()` | WIRED | A narrow-to-desktop transition closes the sheet and retains focus restoration unless deliberately disabled for file activation. |
| `workspaceComments` | Stale/orphan warning and announcement | `hasUnverifiedAnchors` → `.shell-warning-stack` and watcher | WIRED | The notice remains in the shell; the watcher announces only the zero-to-some transition through the global polite region. |
| Comment control | Review mutation | `ReviewPanel` guards and `App.vue` status guard before `mutateReview()` | WIRED | A UI bypass cannot mutate a stale/orphan comment because `App.vue` requires `comment.status === 'verified'` before dispatch. |
| Changed-file selection | One tree state across breakpoints | `ChangedFilesDialog` Teleport | WIRED | The same `FileTree` instance moves to the desktop host or modal host rather than forking selection/filter state. |
| Runtime producer | Production Vue bundle | `command('npm', ['run', 'build'], { env: buildEnvironment(origin) })` | WIRED | The build child receives a forced production environment regardless of caller `NODE_ENV`; the pack lock prevents overlapping artifact builds from racing. |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Unit contracts | `npm run test:unit` | 29 files, 186 tests passed | PASS |
| Git contracts | `npm run test:git` | 9 files, 69 tests passed on isolated rerun | PASS |
| API contracts | `npm run test:api` | 19 files, 142 tests passed | PASS |
| Semantic CSS contract | `npm run verify:semantic-css` | Vite build and semantic-CSS verifier completed | PASS |
| Web types | `npm run typecheck:web` | Completed with no TypeScript errors | PASS |
| Build | `npm run build` | Runtime, native addon, Node, and Vite build completed | PASS |
| Former order-sensitive pair | `npm exec -- playwright test tests/e2e/agent-ready-export-safety.spec.ts tests/e2e/complete-review-draft.spec.ts` | 10 passed | PASS |
| Phase 11 surface paths | `npm exec -- playwright test tests/e2e/anchored-review.spec.ts tests/e2e/responsive-session.spec.ts tests/e2e/review-notes-dialog.spec.ts tests/e2e/review-panel-resolved.spec.ts tests/integration/anchored-workspace.spec.ts tests/integration/draft-recovery-ui.spec.ts tests/integration/selector-drift-ui.spec.ts` | 30 passed | PASS |
| Production runtime under development caller environment | `NODE_ENV=development node scripts/pack-runtime.mjs --purpose development-check ...` | Created development-check runtime artifact evidence | PASS |

The first Git-suite invocation overlapped the long-running unit suite and had one 10-second timeout in `candidates.test.ts`; the isolated rerun above passed the complete 9-file/69-test Git suite. It is recorded for transparency, not treated as an accepted failure.

## Browser Order-Regression Evidence

Two sequential full configured browser runs completed with the same result:

| Run | Result | Non-passing tests | Assessment |
| --- | --- | --- | --- |
| `npm run test:browser` run 1 | 99 passed, 2 failed | `marketplace-review.spec.ts:97` requires `CUMPA_MARKETPLACE_URL_MARKER`; `public-support-states.spec.ts:348` requires `CUMPA_RUNTIME_CUSTODY_DIR` | Known external environment prerequisites, outside Phase 11 |
| `npm run test:browser` run 2 | 99 passed, 2 failed | Same two prerequisite failures | Identical result; no Phase 11/browser-order regression |

The previously blocked ordered flow now passes in the actual configured suite ordering and in the explicit ordered two-spec replay. The two failures are only the documented environment-marker tests and do not exercise or contradict Phase 11 scope.

## Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
| --- | --- | --- | --- |
| SHELL-01 | 11-02 | SATISFIED | `IdentityHeader.vue` renders Cumpa identity, ordered Base/Head or PREIMAGE/POSTIMAGE strip; responsive browser coverage passed. |
| SHELL-02 | 11-02 | SATISFIED | `ActiveFileToolbar.vue` renders selected file/path and state-correct Files control; responsive browser coverage passed. |
| SHELL-03 | 11-01, 11-02 | SATISFIED | `filesCollapsed` controls the desktop sidebar and the focused responsive contract passed. |
| SHELL-04 | 11-01, 11-05 | SATISFIED | One teleported `FileTree`, Changed files dialog focus, narrow transition, and reading-order assertions passed. |
| SHELL-05 | 11-02 | SATISFIED | `ShellFooter.vue` renders source-correct local review status and explicit local/export copy. |
| REV-01 | 11-02, 11-07 | SATISFIED | Anchored browser and workspace tests passed create/edit/delete/resolve/reopen, containment, and stale/orphan rail-only behavior. |
| REV-02 | 11-02 | SATISFIED | Resolved/open rail lifecycle, scrolling heading, selection, and navigation tests passed. |
| REV-03 | 11-01 | SATISFIED | Details dialog structure, focus, metadata, and keyboard-help coverage passed. |
| REV-04 | 11-01 | SATISFIED | Review notes owns summary/export state and preserves background-diff interaction rules; focused dialog test passed. |
| REV-05 | 11-06 | SATISFIED | Shell warning stack, non-live selector/stale surfaces, recovery, and sole App live owner passed focused tests; `aria-live` occurs once in `App.vue`. |

`CON-01` and packaging/accessibility acceptance ownership remain with Phase 12 and are not scored by this Phase 11 report.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| — | — | No Phase 11 TODO/FIXME/XXX debt marker or disconnected shell artifact found in inspected files | — | — |

## Human Verification Required

1. **Reference capture comparison**
   - Open a live pinned comparison at the approved desktop, full-desktop, and mobile viewport sizes.
   - Compare against `mockups/01b-desktop.png`, `mockups/01b-desktop-full.png`, and `mockups/01b-mobile.png`.
   - Expected: the shell composition is visually equivalent except for documented production-data differences; at mobile width the Changed files dialog preserves file → Base → Head order.

## Gaps Summary

No implementation gap remains from the prior `gaps_found` verdict. Automated behavioral proof closes the suite-order failure: both full runs yielded the same 99-passing result, and the formerly failing ordered pair passed all 10 tests. The only outstanding item is the required human visual comparison of live surfaces to the approved reference captures.

---

_Verified: 2026-09-14T02:35:09Z_  
_Verifier: Verify11r2 (gsd-verifier)_

## Human verification — CLOSED 2026-09-14

The outstanding reference-capture comparison was performed live against a real packaged CLI session (fresh `npm run build`, ephemeral 127.0.0.1 Fastify, three changed fixture files plus a saved Head-side comment) by the Phase 11 UI re-audit. Evidence: `.planning/phases/11-workspace-shell-review-surfaces/11-UI-REVIEW.md`; captures under `.planning/ui-reviews/11-live-20260914-r2/` (gitignored).

| Check | Result |
|---|---|
| Visual equivalence at 1440×900, 1650×900, 420×900 vs the approved references | PASS |
| All five prior UI warnings closed, zero new visual deviations | PASS |
| Document-level horizontal overflow at each width | None (420/420, 1440/1440, 1650/1650) |
| Warning stays visible and announced while a dialog is open | PASS |

UI audit score: 24/24. Security: SECURED, 41/41 declared threats closed.

One non-blocking unregistered flag (UF-11-01, pack-lock PID-reuse/takeover race in `scripts/pack-runtime.mjs`) was raised by the security audit and remediated separately; it is test infrastructure, not product behaviour.
