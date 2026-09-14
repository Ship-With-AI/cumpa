---
phase: 11-workspace-shell-review-surfaces
plan: 11-06
subsystem: web
status: complete
requires: []
provides:
  - Independent shell warning stack for patch, selector, and unverified-anchor warnings
  - Non-live selector drift landmark with operation-scoped copy feedback
  - Non-live stale-anchor notice with global transition announcement
commits:
  - fd47f3f
  - 284a317
  - 8dc972c
  - eadab05
  - fe6e7bb
  - 93d6903
---

# Phase 11 Plan 06: Shell warning ownership summary

## Delivered

- Replaced the patch/selector `v-if`/`v-else` pair with an independent shell warning stack directly beneath the identity header. The stack has no overlay or scroll-container behavior.
- Added `StaleAnchorNotice` for stale or orphaned saved anchors, including the `Open comments` action. `App.vue` announces the zero-to-some transition once through its existing global polite region.
- Removed `aria-live` from `.diff-state`; `App.vue` now has exactly one `aria-live` occurrence.
- Converted selector drift to a named, non-live complementary landmark. Copy feedback is absent until invoked and then is the only local `status`/`alert` owner.
- Re-authored legacy Cumpa-heading, retired patch-scope, selector-role, recovery, and empty-file assertions to match the current shell and Details dialog contracts.
- Kept desktop empty comparison output while preventing `ChangedFilesDialog` from teleporting into a nonexistent recovery-surface target.

## Commits

1. `fd47f3f` — `test(11-06): define warning stack shell behavior` (RED)
2. `284a317` — `feat(11-06): stack shell warning notices`
3. `8dc972c` — `feat(11-06): surface unverified comment anchors`
4. `eadab05` — `fix(11-06): scope selector copy announcements`
5. `fe6e7bb` — `test(11-06): cover stale anchor review action`
6. `93d6903` — `fix(11-06): retain empty changed-files target`

## Live-owner inventory

- Global `App.vue` visually-hidden polite region: selector transitions, stale/orphan zero-to-some transitions, comment/draft/export/file-load lifecycle outcomes.
- `App.vue` patch-drift shell notice: `role="alert"` for patch polling drift only.
- `SelectorDriftNotice.vue`: non-live named aside; copy result only is `status` on success or `alert` on failure.
- `StaleAnchorNotice.vue`: non-live named aside.
- `DraftRecovery.vue`: recovery/newer-draft operation feedback per UI-spec table.
- Existing local operation owners in comment composer, review notes/panel, summary, export, gitignore, and receipt components remain scoped to their distinct actions.

## Verification

Passed:

- `npm run typecheck:web`
- `npm run verify:semantic-css`
- `npm run build:web`
- `npx playwright test tests/integration/draft-recovery-ui.spec.ts tests/e2e/responsive-session.spec.ts`
- `npx playwright test tests/integration/anchored-workspace.spec.ts`
- `npx playwright test tests/e2e/review-panel-resolved.spec.ts tests/integration/selector-drift-ui.spec.ts`
- `npx playwright test tests/integration/anchored-workspace.spec.ts --grep "anchored gap closure"`
- targeted packaged recovery and empty-session checks after the teleport correction
- `npx vitest run tests/git/candidates.test.ts` (17 passed)
- `grep -c 'aria-live' src/web/App.vue` → `1`

The initial full Playwright run exercised 96 specs and exposed two existing state-order issues. The empty-session target issue was fixed in `93d6903`; both affected specs then passed individually. The complete-review-draft recovery spec also passed individually after its full-suite timeout.

`npx vitest run tests/unit tests/api tests/git` was blocked by pre-existing user-owned `tests/unit/.omp-profile-path-drift-repro.test.ts` and a transient `candidates.test.ts` timeout; the latter passed on focused rerun. No user-owned repro file was changed.

## Scope notes

- `STATE.md` and `ROADMAP.md` were intentionally unchanged.
- No dependency or lockfile changes were made.
