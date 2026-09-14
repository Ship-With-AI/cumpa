---
phase: 11-workspace-shell-review-surfaces
plan: 08
subsystem: ui-and-packaging
tags: [vue, vite, playwright, runtime-artifact, accessibility]

requires:
  - phase: 11-workspace-shell-review-surfaces
    provides: workspace shell, review surfaces, packaged browser coverage
provides:
  - shell dialogs keep one interactive owner and restore focus without stale review anchors
  - runtime artifacts always compile in production mode, independent of a caller's Vite environment
  - file-ready status cannot overwrite a later comment-settlement announcement
affects: [runtime-packaging, browser-suite, accessibility]

tech-stack:
  added: []
  patterns: [artifact build environment is owned by pack-runtime, newest live-region message wins]

key-files:
  created:
    - .planning/phases/11-workspace-shell-review-surfaces/11-08-SUMMARY.md
  modified:
    - scripts/pack-runtime.mjs
    - src/web/App.vue

decisions:
  - "Force NODE_ENV=production at the runtime-pack boundary rather than inheriting an ambient Vite development process."
  - "Do not let a delayed diff-ready status overwrite a newer mutation-settlement announcement."

requirements-completed: [SHELL-04, REV-01, REV-05]
completed: 2026-09-14
status: complete
---

# Phase 11: Workspace Shell & Review Surfaces — Remediation Summary

## Outcome

Preserved and committed the pending Phase 11 review remediation, then fixed the deterministic ordered packaged-browser failure. `pack-runtime.mjs` now owns its production build environment instead of inheriting `NODE_ENV=development` from an earlier Vite test server. A validation-discovered live-region race was also corrected so the final comment-settlement status remains audible after a file switch.

## Finding → Action → Evidence

| Finding | Action | Evidence |
| --- | --- | --- |
| BL-01 / BL-02 / WR-01: shell dialogs could overlap interactive content, stale anchor history could be used, and responsive forced-close did not consistently return focus. | Added a single shell-dialog owner, inert workspace wrapper, focus restoration, and anchor lifecycle guards. | `1cc1186 fix: guard shell dialogs anchor history`; focused anchored/modal coverage passed before commit. |
| WR-03: the selector-drift test's `POSTIMAGE` locator was ambiguous. | Scoped the endpoint assertion to the intended request surface. | `e351da8 test: scope selector drift endpoint assertion`; selector-drift coverage passed. |
| WR-02: simultaneous runtime packs could race on shared `dist/`. | Serialized the pack operation with a process lock. | `a08a47b fix: serialize runtime artifact packing`; two concurrent pack commands succeeded. |
| The shell live region is intentionally outside the inert content wrapper; the remediation test selector incorrectly put it inside. | Restored selectors to `.session-shell > .visually-hidden[aria-live="polite"]`. | `8ad1b9f test: retain shell live-region selector`; anchored-workspace plus selector-drift suite: 19 passed. |
| Ordered `agent-ready-export-safety` then `complete-review-draft` stayed on recovery after a successful `201` recovery. The first spec's Vite server left `NODE_ENV=development`; the runtime pack inherited it and built the development Vue runtime. Isolated packing had `NODE_ENV` unset. | Set `NODE_ENV: 'production'` in `buildEnvironment()` for every artifact build. | `5a3e1b1 fix: force production runtime artifact builds`; ordered pair completed 10/10. The ordered recovery response was `{"kind":"recovered", ...}` and development runtime emitted `Cannot read properties of null (reading 'emitsOptions')`; both disappear with the production artifact. |
| Full-suite validation exposed a delayed `Loaded src/second.ts.` status overwriting the later accepted-comment status. | Record the live-message version when content becomes ready; announce file readiness only when no newer semantic message exists. | `76ae862 fix: preserve mutation announcements after file switches`; focused async-settlement browser test passed and final browser-suite runs were clean except configured external markers. |
| Browser suite must remain deterministic after remediation. | Ran the full browser suite twice after the final fixes. | Both `npm run test:browser` runs: 99 passed, 2 failed. The only failures were the documented environment gates: `marketplace-review.spec.ts` needs `CUMPA_MARKETPLACE_URL_MARKER`; `public-support-states.spec.ts` needs `CUMPA_RUNTIME_CUSTODY_DIR`. |

## Verification

- `npm exec -- playwright test tests/e2e/agent-ready-export-safety.spec.ts tests/e2e/complete-review-draft.spec.ts` — 10 passed.
- `npm exec -- playwright test tests/integration/anchored-workspace.spec.ts --grep "keeps B active when accepted A completion returns"` — 1 passed.
- `npm run verify:semantic-css` — passed.
- `npm run typecheck:web` — passed.
- `npm run build` — passed.
- `npm run test:unit` — passed.
- `npm run test:git` — passed.
- `npm run test:api` — passed.
- `npm run test:browser` twice — each produced 99 passed and only the two documented missing-environment failures above.

## Commits

- `1cc1186 fix: guard shell dialogs anchor history`
- `e351da8 test: scope selector drift endpoint assertion`
- `a08a47b fix: serialize runtime artifact packing`
- `8ad1b9f test: retain shell live-region selector`
- `5a3e1b1 fix: force production runtime artifact builds`
- `76ae862 fix: preserve mutation announcements after file switches`

## Scope Notes

- `STATE.md` and `ROADMAP.md` were intentionally unchanged.
- User-owned untracked artifacts were left untouched.
