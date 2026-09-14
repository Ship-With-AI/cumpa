---
phase: 11-workspace-shell-review-surfaces
plan: 09
subsystem: workspace-shell-security-and-ui
tags: [vue, playwright, accessibility, semantic-css, runtime-packaging]
requires:
  - phase: 11-workspace-shell-review-surfaces
    provides: workspace shell, modal focus boundary, exact-patch polling
provides:
  - patch-drift transitions remain announced while a shell modal makes the workspace inert
  - approved toolbar, footer, disclosure, empty-state, and narrow-scroll UI contracts
  - runtime pack lock self-recovers after a dead owner
affects: [REV-05, browser-suite, runtime-packaging]
tech-stack:
  added: []
  patterns: [single external live-region owner for shell transitions, dead-owner lock takeover]
key-files:
  created:
    - .planning/phases/11-workspace-shell-review-surfaces/11-09-SUMMARY.md
  modified:
    - src/web/App.vue
    - src/web/styles.css
    - scripts/pack-runtime.mjs
    - tests/integration/selector-drift-ui.spec.ts
key-decisions:
  - "Patch drift uses the existing App.vue external polite announcer once per false-to-true transition; its visible shell notice is non-live."
  - "The zero-file dialog reuses the source-correct shell empty-state copy only where the dialog can open, avoiding duplicate desktop empty states."
requirements-completed: [SHELL-02, SHELL-04, SHELL-05, REV-03, REV-04, REV-05]
duration: 33min
completed: 2026-09-14
status: complete
---

# Phase 11 Plan 09: Workspace Shell Security and UI Contract Closure Summary

**Exact-patch drift now remains audible through the single external live owner while shell modals are open, and every Phase 11 UI-audit deviation follows the approved shell contract.**

## Finding → Action → Evidence

| Finding | Action | Evidence |
|---|---|---|
| T-11-06-01: patch drift was only a `role="alert"` inside the inert, modal-covered shell content. | Added a false-to-true `patchDrifted` transition watcher that calls the existing global `announce()` once; made the visible `Implemented content changed` notice non-live. | New modal-open browser test failed before the fix with `Expected: "Implemented content changed." Received: "New local draft frozen exact patch."`; then passed. `aria-live` occurs exactly once in `src/web/App.vue`. |
| UF-11-01: a hard-killed runtime packer could leave its lock indefinitely. | Read the owner PID and remove only a dead/missing-owner lock before retrying acquisition; the lock remains in place for a live owner. | `npm run build` passed with the runtime packer path compiled. |
| Toolbar and footer geometry did not match the approved mockup. | Set desktop active-file toolbar padding to `18px 24px 14px`, narrow padding to `14px 12px 10px`, and footer padding to `9px 18px`. | `mockups/01-quiet-workspace.html:9` supplies desktop toolbar/footer numerics; `:12` supplies narrow toolbar numerics. `npm run verify:semantic-css` passed. |
| Details used reserved accent treatment. | Kept accent on the `Review notes` header CTA only; Details and Support use neutral disclosure styling. | `npm run typecheck:web` passed. |
| Active toolbar controls forced 12px metadata typography. | Removed the local metadata override so controls inherit the canonical 14px/21px body-control role; retained the authorized 30px compact height. | `npm run typecheck:web` passed; full browser suite completed 99 product tests. |
| `0 changed files` was a weak zero-file fallback. | Reused the source-correct session-specific empty heading/body in the changed-files dialog and removed the duplicate desktop fallback. | Focused pinned-session empty/range browser paths: 2 passed. |
| Narrow side-by-side diff had no local-scroll cue. | Added a narrow-only, non-live cue naming the currently off-screen second pane; the cue is within the local diff owner. | Full browser suite completed 99 product tests; no document-overflow contract changed. |

## Contract Reconciliation

- No audited UI warning conflicted with the approved numerical or semantic contract.
- UI-SPEC requires the narrow diff viewport to be the only horizontal-scroll owner but does not prescribe cue wording; the direct cue `Scroll horizontally to view {HEAD|POSTIMAGE}.` is intentionally narrow-only and non-live.
- UI-SPEC's earlier patch-drift local-alert row conflicts with the security remediation's required single external owner while the shell is inert. The security requirement governs: the visible notice remains shell-owned and non-live; the external global announcer owns the transition.

## Verification

- `npm run verify:semantic-css` — passed.
- `npm run typecheck:web` — passed.
- `npm run build` — passed.
- `npm run test:unit` — passed: 29 files, 186 tests. (The concurrent first run timed out in an unrelated Vite token-reload test; serial rerun passed.)
- `npm run test:git` — passed: 9 files, 69 tests.
- `npm run test:api` — passed: 19 files, 142 tests.
- `npx playwright test tests/integration/selector-drift-ui.spec.ts --grep 'exact patch drift is announced while Review notes makes the shell inert'` — RED failure before implementation, GREEN pass after.
- `npm run test:browser` — 99 passed; only documented external environment gates failed: `tests/e2e/marketplace-review.spec.ts` needs `CUMPA_MARKETPLACE_URL_MARKER`, and `tests/e2e/public-support-states.spec.ts` needs `CUMPA_RUNTIME_CUSTODY_DIR`.

## Files Modified

- `src/web/App.vue` — owns patch-drift announcements and shared zero-file copy.
- `src/web/components/ChangedFilesDialog.vue` — renders useful, source-correct empty dialog content without a desktop duplicate.
- `src/web/components/DiffWorkspace.vue` — provides the narrow local-scroll cue.
- `src/web/components/IdentityHeader.vue` and `src/web/styles.css` — restore accent hierarchy, control typography, and normative shell geometry.
- `scripts/pack-runtime.mjs` — takes over a lock only after its recorded owner is dead or absent.
- `tests/integration/selector-drift-ui.spec.ts` and `tests/e2e/pinned-session.spec.ts` — prove modal announcement ownership and removal of the weak fallback.

## Scope Notes

- `STATE.md` and `ROADMAP.md` intentionally remain unchanged.
- User-owned untracked planning artifacts, evidence, and profile repro tests remain untouched.

## Self-Check: PASSED

- Required summary exists at `.planning/phases/11-workspace-shell-review-surfaces/11-09-SUMMARY.md`.
- The atomic implementation commit includes the source, tests, and this summary.
