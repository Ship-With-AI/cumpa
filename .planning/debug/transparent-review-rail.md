---
status: resolved
trigger: "the review sidebar is showing transparent and not visible"
created: 2026-09-15
updated: 2026-09-15
---

# Debug: transparent review rail

## Symptoms

- **Expected:** opening the Review panel shows an opaque rail; its contents are legible and the diff behind it is covered.
- **Actual:** the rail body is transparent. Monaco diff text renders through the panel, colliding with "Open comments (0)", "No open comments", and "Resolved comments (0)". Only the top "Review / Open 0 / Resolved 0 / Close review" strip is opaque.
- **Errors:** none — pure CSS/visual.
- **Timeline:** regressed during v1.6, not by the 260915-gxg toolbar task. `.comments-rail` carried `background: var(--surface-panel)` at `6279e15` (v1.6 start) and zero background declarations by `de1362e` (v1.6 close).
- **Reproduction:** launch a session, wait for `.monaco-diff-editor`, click the `Review` button at 1600x1000, look at the rail over loaded diff content.

## Evidence

- timestamp: 2026-09-15 — Reproduced against a live session at 1600x1000 (297-file comparison). Computed styles:
  - `.comments-rail` → `background-color: rgba(0, 0, 0, 0)`, `position: absolute`, `z-index: 7`, `box-shadow: rgba(0,0,0,0.4) 0 8px 24px`, rect x=1232 w=360
  - `.review-panel` → `background-color: rgba(0, 0, 0, 0)`, `position: static`
  - `.review-panel__heading` → `background-color: rgb(22, 27, 34)`, `position: sticky` (the one opaque band)
  - `.review-main` / `.review-shell` / `body` → `rgb(13, 17, 23)`
  Screenshot: `/tmp/rail-now.png` — diff text visibly overlapping panel copy.
- timestamp: 2026-09-15 — Culprit commit isolated by walking `6279e15..de1362e` over `src/web/styles.css`: the first commit where the `.comments-rail` block has no `background` declaration is `5599805` *feat(11-05): retire changed files drawer styles*.
- timestamp: 2026-09-15 — The rule that existed at `6279e15` and disappeared:
  ```css
  .comments-rail {
    min-width: 0;
    overflow: hidden;
    border-color: var(--border-default);
    background: var(--surface-panel);
    box-shadow: none;
  }
  ```
  Today only the second, narrower `.comments-rail` block survives (`styles.css:1514-1519`: `display: grid; grid-template-rows: minmax(0,1fr); padding: 0; border-left: …`) plus the overlay block at `styles.css:2442-2452` (`position: absolute; z-index: 7; right: 8px; width: min(360px, …); transform: translateX(calc(100% + 8px)); box-shadow: none`) and `.comments-rail--open` at `:2454`. None sets a background.
- timestamp: 2026-09-15 — `.changed-files-sidebar` kept its background via `styles.css:963-967` (`.file-tree-pane, .changed-files-sidebar { min-width: 0; background: var(--surface-panel); }`). The rail had no equivalent surviving group, which is why only this panel went transparent.
- timestamp: 2026-09-15 — Not a 260915-gxg regression: the `.comments-rail` background count is already 0 at `80c3b92`, before that task's first commit.
- timestamp: 2026-09-15 — TDD falsifiability gate: with the production CSS still unchanged, the new canonical-token assertion in `tests/e2e/responsive-session.spec.ts` failed as required: expected `rgb(22, 27, 34)` from `--surface-panel`, received `rgba(0, 0, 0, 0)`.
- timestamp: 2026-09-15 — Root-cause fix added `background: var(--surface-panel)` directly to the existing `.comments-rail` block. The same scoped responsive spec then passed 1/1.
- timestamp: 2026-09-15 — Overlay sibling audit: the changed-files dialog uses `.modal-dialog` (`--surface-raised`) over `.modal-dialog-backdrop` (`--surface-scrim`); tooltips use `--surface-raised`; inline notices have a base status background plus opaque variant backgrounds; the keyboard-help content is hosted inside the opaque Details modal; the retired changed-files drawer has no surviving overlay. No other absolutely positioned surface composites transparently over Monaco, so no sibling fix was needed.
- timestamp: 2026-09-15 — Final verification passed: `npm run typecheck:web` (exit 0), `npm run build:web` (exit 0), and the combined Playwright run for `tests/e2e/responsive-session.spec.ts` plus `tests/integration/anchored-workspace.spec.ts` (14/14 passed).

## Eliminated

- hypothesis: caused by the 260915-gxg merged-toolbar task (`8a9fa1c..c49ea08`) — ELIMINATED: background declaration count for `.comments-rail` is 0 at `de1362e` and `80c3b92`, both predating it.
- hypothesis: caused by the `v-if` → `v-show` teleport-host fix (`80c3b92`) — ELIMINATED: same evidence; that commit touched `App.vue` and specs only, no `.comments-rail` rule.

## Resolution

root_cause: Commit `5599805` incidentally removed `.comments-rail`'s only `background: var(--surface-panel)` declaration while retiring the old changed-files drawer styles; no later rule intentionally made the rail transparent, leaving the absolute overlay to composite over Monaco.
fix: Restored `background: var(--surface-panel)` on the existing `.comments-rail` layout block and added one computed-background assertion using the canonical `toRootRgb('--surface-panel')` token helper.
verification: RED observed `rgba(0, 0, 0, 0)` against expected `rgb(22, 27, 34)`; GREEN passed 1/1; final web typecheck and build exited 0; both named Playwright specs passed 14/14 with existing transform, responsive geometry, closed `box-shadow: none`, and open `--shadow-overlay` assertions intact.
files_changed:
  - `src/web/styles.css`
  - `tests/e2e/responsive-session.spec.ts`
  - `.planning/debug/transparent-review-rail.md`
cycles: 1 investigation + 1 fix
