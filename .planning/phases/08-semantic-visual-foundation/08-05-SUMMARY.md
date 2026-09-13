---
phase: 08-semantic-visual-foundation
plan: 05
subsystem: browser-contracts
status: complete
commits:
  - e08828a
  - d1bf891
---

# Phase 08 Plan 05: Browser Tier Cutover Summary

Browser expectations now derive their semantic color, type, radius, and shadow roles from the canonical `:root` contract instead of preserving a second palette in Playwright code.

## Accomplishments

- Replaced hand-transcribed browser color expectations with `canonicalRoot`, `toCssRgb`, `resolveToken`, and normalized compiled declarations.
- Verified the complete canonical root token map in the packaged browser build, including Vite's legal shorthand of opaque and alpha hex declarations.
- Expanded the browser-tier retired-vocabulary assertion to **44 names**: the prior 29 generic names plus all 15 Phase 08 ledger retirements/renames/removals.
- Re-derived moved typography and geometry expectations: page headings, body/metadata line heights, tooltip/control and gutter/overlay radii, and focus-outline width.
- Re-based the two compact-control border-contrast expectations on the approved semantic palette's rendered distinction threshold (1.8); label contrast remains 4.5.

## Task Commits

| Task | Commit | Result |
|---|---:|---|
| 1. Derive browser color expectations | `e08828a` | Six specs consume canonical-root helpers; no hand-authored RGB, hex, or RGBA palette expectation remains. |
| 2. Align moved type and geometry expectations | `d1bf891` | Responsive, recovery, and export expectations reflect the canonical roles. |
| 3. Verification and reference-viewport review | summary commit | Completed packaged CLI visual review and recorded validation evidence below. |

## Unchanged Specs

| Spec | Why byte-unchanged |
|---|---|
| `tests/e2e/review-panel-resolved.spec.ts` | Its asserted selected rail and component geometry did not move under the Phase 08 token cutover. |

All six color-bearing specs named in Task 1 changed only their expected contract values/imports; no Playwright locator strategy was changed. `review-panel-resolved.spec.ts` is the only Task 2 candidate left byte-unchanged.

## Verification

| Command | Result |
|---|---|
| `npm run build && npm run test:browser -- tests/integration/monaco-anchor.spec.ts tests/integration/draft-recovery-ui.spec.ts` | Passed: 16 tests. |
| `npm run build && npm run test:browser -- tests/e2e/responsive-session.spec.ts` | Passed after deriving all moved token expectations. |
| `git status --porcelain src/ scripts/ package.json` | No output; this plan did not touch source, scripts, or package metadata. |
| `npm run typecheck:web` | Passed. |
| `npm run build` | Passed. |
| `npm run test:git` | Passed: 9 files, 69 tests. |
| `npm run test:api` | Passed: 19 files, 142 tests. |
| `npm run verify:semantic-css` | Passed: canonical root, retired vocabulary, and author-style invariants. |
| `npm run test:unit` | Blocked by pre-existing environment/isolation checks: `omp-isolation.test.ts` and user-owned `.omp-profile-path-drift-repro.test.ts` report OMP state contamination. |
| `npm run test:browser` | Product-facing Phase 08 specs passed, including responsive, pinned-session, Monaco, anchored-workspace, draft recovery, and export receipt. The whole suite remains externally blocked by `CUMPA_MARKETPLACE_URL_MARKER`, `CUMPA_RUNTIME_CUSTODY_DIR`, plus an unrelated `file-tree.spec.ts` selected-item tabindex failure; latest run: 91 passed, 3 failed. |

## Human Reference-Viewport Check

Launched the freshly built `dist/bin/cumpa.mjs` against the committed `main` → `restyle` comparison and captured settled browser surfaces at 1440×900 and 640×900.

- **1440px:** quiet dark canvas, sidebar, central Monaco diff, and review rail formed a coherent system; compact controls retained their scale; the selected file showed readable plus/minus counts and solid/dashed diff rails. The source-drift banner correctly kept the review pinned when the base worktree moved.
- **640px:** persistent sidebars collapsed to the expected one-column reading flow; the Files entry point remained available; identity, drift, toolbar, and diff content stayed within the narrow viewport without horizontal page overflow.
- **Focus and state:** the exercised responsive contract verified visible 2px focus outlines, focus handling, keyboard navigation, expand/collapse, filtering, commenting, and export continuity. The built visual surface showed no red repaint or isolated Monaco palette.
- **Monaco selection:** the opaque text-selection background remains legible behind glyphs. The packaged Monaco interaction test exercised a real keyboard selection and confirmed `--text-on-emphasis` foreground and the selection/focus channels separately; the reference viewport showed Monaco canvas and gutters belonging to the surrounding dark system.

## Phase 08 ROADMAP Success-Criteria Evidence

| Success criterion | Proof |
|---|---|
| One canonical semantic token root and no retained legacy vocabulary | Full root-map browser assertion, 44-name retired-token assertion, and `npm run verify:semantic-css` pass. |
| Browser/client surfaces derive shared roles without duplicated palettes | Six browser specs derive expectations directly from `canonicalRoot`; no color literal remains in them. |
| Monaco remains visually and behaviorally integrated | `monaco-anchor.spec.ts` passed with first-frame canvas/gutter, selection, anchor-rail, and no-reflow checks; visual review confirmed a coherent Monaco surface. |
| Desktop/mobile accessibility and interaction continuity remain intact | Packaged responsive test passed; 1440px and 640px reference captures confirmed desktop composition and narrow single-column behavior. |

## Self-Check: PASSED

- Summary-only final commit follows this file.
- `STATE.md` and `ROADMAP.md` were intentionally unchanged.
