# Project Research Summary

**Project:** Diff Review
**Domain:** Dark-only GitHub Dark-default-inspired visual adaptation of a local Vue/Monaco pull-request diff workspace
**Researched:** 2026-07-24
**Confidence:** MEDIUM overall (HIGH for repository integration boundaries and pitfalls; MEDIUM for external visual parity guidance)

## Executive Summary

Diff Review is an existing local-first review workspace, not a GitHub clone. The v1.1 GitHub Dark Diff milestone should therefore be a presentation-only cutover: preserve Vue 3, Monaco, the three-part changed-files/diff/review-rail information architecture, comment lifecycle, draft persistence, summary/export behavior, keyboard commands, and local identity while making the entire workspace one coherent dark-default experience. The research recommends no new npm dependency. Use one Diff Review-owned semantic token vocabulary in the existing global stylesheet, and map that vocabulary into one typed Monaco standalone theme so shell and editor share the same visual contract.

The work is safest as a dependency-ordered brownfield migration: establish the palette and state vocabulary before styling consumers; register Monaco's theme before creating the editor; then cover file/header, controls, comments, notices, and review-rail states without changing markup contracts or review behavior; finally harden narrow layouts and accessibility. The principal risks are split-brain palettes, composited diff/selection collisions, clipped focus, color-only meaning, and accidentally widening a restyle into mechanics or contract changes. WCAG 2.2 contrast, non-color, focus, reflow, and forced-colors constraints must be acceptance criteria, not a late cosmetic review.

## Key Findings

### Recommended Stack

The current stack is sufficient: Vue 3.5.39, Monaco Editor 0.55.1, Vite 8.1.4, TypeScript 7.0.2, and the Node.js 24 LTS baseline remain in place. Native CSS custom properties and media queries are the right styling mechanism; adding a CSS framework, preprocessor, component library, Monaco wrapper, or alternate diff renderer would create a second convention and threaten validated line mapping and comment anchors.

**Core technologies:**
- **Vue 3.5.39:** retain existing component and ARIA structure; the milestone changes presentation rather than state or composition.
- **Monaco Editor 0.55.1:** retain side-by-side diff, line mapping, decorations, view zones, syntax tokenization, and accessible diff behavior; use `defineTheme` and the construction-time `theme` option.
- **Vite 8.1.4 + native CSS:** keep the existing SFC/global stylesheet pipeline; consolidate semantic roles in `src/web/styles.css` without a preprocessor.
- **TypeScript 7.0.2 + Node 24 LTS:** retain the supported build/runtime baseline and type the Monaco theme data.
- **Primer primitives 11.9.0:** reference only for dark semantic values and provenance; do not install it as a runtime dependency.

### Expected Features

**Must (table stakes):**
- **Complete semantic dark hierarchy:** canvas, inset/muted surfaces, controls, text, borders, states, and diff layers must make the page, drawers, editor, comments, notices, and rail one workspace rather than a dark editor in a light shell.
- **Complete diff and file-header language:** preserve explicit Base/Head identity, side-by-side geometry, file path hierarchy, line/gutter context, and addition/deletion cues that remain understandable without color.
- **State matrix and accessibility:** rest, hover, active, selected, focus-visible, disabled, pending, destructive, warning, error, comment, and resolved states need distinct visual and programmatic cues; normal text targets 4.5:1 and meaningful non-text cues 3:1.
- **Comment and review continuity:** dark inline composer, accepted comments, notices, summary, export, and review-rail lifecycle states must remain readable and behaviorally unchanged.
- **Narrow-layout preservation:** only the side-by-side diff may own localized horizontal overflow; headers, drawers, rail, forms, notices, and prose must reflow.

**Should have (competitive):**
- **Close GitHub familiarity without forge chrome:** adapt dark-default semantic surfaces, restrained borders, compact typography/density, file-header hierarchy, and gutter affordances while retaining Diff Review copy, local-save language, Base/Head identity, review rail, and export model.
- **One semantic contract across native UI and Monaco:** a single role map prevents shell/editor visual drift and makes future maintenance and accessibility auditing tractable.
- **Dark-only precision and zero workflow churn:** complete one mode rather than a partial theme system, preserving existing DOM semantics, keyboard paths, and state transitions.

**Defer (v2+):**
- **Light mode or a theme picker:** doubles verification scope and is explicitly outside v1.1.
- **GitHub review mechanics:** replies, suggestions, approvals, requests changes, pending-review submission, Viewed tracking, remote collaboration, or any new persistence/API contract.
- **Pixel-perfect GitHub cloning, branding, avatars, forge navigation, and remote font loading:** adapt recognizable conventions, not a brittle or network-dependent clone.

### Architecture Approach

Keep existing review state and server boundaries authoritative. `styles.css` owns the single semantic dark token layer; a small new `src/web/monaco/theme.ts` translates resolved CSS tokens into a registered, idempotent Monaco theme; `DiffWorkspace.vue` registers it before constructing the existing adapter; `diff-adapter.ts` receives only the theme option while retaining models, mappings, zones, read-only/side-by-side settings, hidden regions, and accessibility labels. Existing Vue components consume semantic classes and attributes for file tree/header, toolbar, comments, rail, notices, and responsive drawers. No Vue theme state, server, persistence, contract, anchor, export, or review-model changes are justified by this milestone.

**Major components:**
1. **Semantic presentation contract (`src/web/styles.css`):** one authoritative role vocabulary for surfaces, text, borders, controls, focus, statuses, selection, and diff states; remove competing palette aliases rather than layering another override.
2. **Monaco theme boundary (`src/web/monaco/theme.ts` + `diff-adapter.ts`):** map CSS-computed values to documented editor, selection, gutter, inserted/removed, unchanged-region, focus, widget, and overview colors before first editor render; keep syntax inheritance and diff behavior intact.
3. **Existing Vue shell and review surfaces:** restyle file tree/header, toolbar, drawers, inline view-zone DOM, comment composer/cards, review rail, notices, recovery, summary, and export using existing hooks, ARIA relationships, events, and focus targets.
4. **Responsive/accessibility boundary:** isolate the diff's two-dimensional viewport while keeping surrounding application chrome reflowable; preserve drawer focus/inert/Escape behavior and add forced-colors, contrast, grayscale, zoom, and keyboard verification.

### Critical Pitfalls

1. **Appending a third palette:** perform a clean semantic cutover from the two competing root palettes; raw values belong only in the token definition and no light aliases may remain authoritative.
2. **Semantic and compositing collisions:** keep dedicated diff-added/deleted, selection, comment, focus, warning, error, and disabled roles; design overlap matrices with alpha-composited values so selection, anchors, and intraline fills do not erase provenance or readability.
3. **A mismatched Monaco system:** CSS cannot theme Monaco internals; register an inherited `vs-dark`-based theme before editor creation and explicitly cover editor, line-number/gutter, selection, diff, unchanged-region, widget, scrollbar, diagnostic, and focus colors.
4. **Accessibility and responsive regressions:** retain non-color labels/glyphs/edges, visible focus that is not clipped, native disabled semantics, forced-colors fallbacks, and 4.5:1/3:1 contrast checks; confine horizontal scrolling to the diff rather than the entire page.
5. **Restyle drift into behavior or brittle screenshots:** preserve queried classes, refs, ARIA, adapter options, view-zone ownership, and state transitions; use a small curated visual matrix only as a supplement to behavioral invariants, not as a replacement for them.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Semantic Dark Foundation
**Rationale:** Every consumer and Monaco mapping depends on one unambiguous role vocabulary; doing this first prevents cascade patches and makes accessibility pairs auditable.
**Delivers:** A single dark-only `:root` semantic token contract, migrated selectors, typography/density/border foundations, contrast ledger, and preserved state labels.
**Addresses:** Dark hierarchy, typography, density, restrained surfaces, complete control-state groundwork, and non-color semantics.
**Avoids:** Split-brain palette leakage, semantic color collisions, raw-hex sprawl, and “dark only on the happy path.”

### Phase 2: Monaco Diff Integration
**Rationale:** Monaco is a separate rendering system and must receive the same role map before shell polish can be judged as coherent.
**Delivers:** Idempotent `monaco/theme.ts`, pre-construction registration, typed theme colors for editor/syntax/selection/diff/gutters/unchanged regions/widgets/focus, and a bounded diff viewport that preserves side labels and gutter geometry.
**Uses:** Monaco 0.55.1 `defineTheme`, `IStandaloneThemeData`, `createDiffEditor` theme option, existing adapter/decorations/view zones.
**Implements:** The Monaco presentation component while leaving diff computation, line mapping, anchors, models, and keyboard commands unchanged.

### Phase 3: Workspace State and Review Surfaces
**Rationale:** Once base and editor layers are stable, migrate every existing interactive and lifecycle state without introducing new review mechanics.
**Delivers:** GitHub-familiar file header/tree, toolbar, controls, inline composer, accepted comments, review rail, notices, errors, conflict/recovery, summary, export, disabled/pending/destructive/resolved states, and focus/hover/selection precedence.
**Addresses:** All remaining P1 table stakes and the familiarity/zero-workflow-churn differentiators.
**Avoids:** Comment/diagnostic/error collapse, view-zone sizing regressions, hover-only actions, and accidental changes to persistence/export/lifecycle contracts.

### Phase 4: Responsive Accessibility Hardening
**Rationale:** Contrast and reflow outcomes depend on the complete composited state matrix, drawer overlays, and real narrow layouts; this is validation of all prior layers, not an optional polish pass.
**Delivers:** Keyboard focus audit, grayscale/color-vision checks, forced-colors layer, 320 CSS px/400% zoom behavior, localized diff scrolling, touch-target checks, and fixes for clipped focus or overflow.
**Addresses:** WCAG use-of-color, contrast, non-text contrast, focus-visible, reflow, and forced-colors constraints.
**Avoids:** Whole-page 640px canvases, invisible focus, color-only states, and dark “subtlety” that fails measured contrast.

### Phase 5: Curated Visual/Behavioral Regression Gate
**Rationale:** A presentation cutover needs evidence that visuals improve without silently changing validated review behavior; broad brittle snapshots are less useful than a small deterministic matrix plus behavior checks.
**Delivers:** Representative desktop/narrow/state coverage for diff selection/focus/comments, rail states, notices, disabled/pending states, and forced-colors supplements, alongside the existing behavior contract.
**Addresses:** Visual restoration confidence and regression prevention.
**Avoids:** Screenshot-baseline churn, Monaco timing noise, and treating pixels as a substitute for comment/navigation/export behavior.

### Phase Ordering Rationale

- Token ownership precedes Monaco and component styling because both need the same semantic meanings and because the current stylesheet has competing palette eras.
- Monaco integration precedes shell-state polish because its alpha layers, line geometry, view zones, and selection precedence determine whether surrounding controls can be evaluated coherently.
- Workspace state coverage precedes responsive hardening because narrow and forced-color behavior must include real comments, drawers, notices, and lifecycle states, not only an empty diff.
- Accessibility and behavior gates remain cross-cutting acceptance criteria; no phase may trade away existing review mechanics for visual fidelity.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Monaco 0.55.1 color-ID coverage, CSS-token resolution timing, composited selection/diff precedence, and view-zone/anchor geometry need implementation-time verification across representative languages.
- **Phase 4:** Forced-colors behavior, browser/OS contrast composition, 320px and 400% zoom, and drawer/focus interactions need real browser inspection; live GitHub spacing is not a stable public specification.
- **Phase 5:** Visual baseline strategy needs environment pinning and a deliberately small matrix to avoid brittle snapshots.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Native CSS custom properties, semantic roles, and WCAG contrast/focus patterns are established and directly supported by the existing stylesheet.
- **Phase 3:** Existing Vue components, ARIA attributes, lifecycle state, and class hooks already provide the required surfaces; this is coordinated restyling, not new interaction design.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Installed versions and official Monaco/Vite/Vue documentation support the no-dependency approach; exact visual parity still needs browser inspection. |
| Features | MEDIUM | Primer, GitHub documentation, and WCAG agree on semantic diff and accessibility conventions, but production GitHub spacing/details are not a versioned spec. |
| Architecture | HIGH | Repository integration points, existing adapter lifecycle, CSS ownership, and unchanged boundaries are directly mapped; external design guidance is MEDIUM. |
| Pitfalls | HIGH | Risks are grounded in the current brownfield stylesheet/Monaco seams plus official WCAG, Monaco, forced-colors, and visual-testing guidance. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Exact final colors and alpha composition:** validate all foreground/background pairs on actual Monaco layers, selection, anchors, and status surfaces; reference values are starting points, not an assumption of passing contrast.
- **Real responsive geometry:** inspect desktop breakpoints, 320px, 400% zoom, drawer overlays, long paths, comments, notices, and export/recovery states in a browser; do not infer from CSS alone.
- **Forced-colors coverage:** validate on Windows High Contrast where available; emulation is supplementary and must leave durable text, borders, and markers.
- **Visual regression environment:** pin browser/OS/fonts/viewport/device scale before approving curated snapshots, and retain behavior checks for navigation, anchors, comments, drafts, and export.
- **Scope discipline:** planning and execution must reject changes to review mechanics, API/schema, persistence, export, or information architecture unless a separately approved milestone changes the contract.

## Sources

### Primary (HIGH confidence)
- `.planning/research/ARCHITECTURE.md` — repository-mapped component boundaries, Monaco initialization/data flow, styling ownership, responsive scroll boundary, and unchanged contracts.
- `.planning/research/PITFALLS.md` — brownfield failure modes and prevention strategies grounded in existing CSS/Monaco seams.
- [Monaco 0.55.1 published type definitions](https://unpkg.com/monaco-editor@0.55.1/monaco.d.ts) — theme registration, diff color IDs, construction options, and accessibility-related APIs.
- [Monaco editor color registry](https://github.com/microsoft/vscode/blob/main/src/vs/platform/theme/common/colors/editorColors.ts) — opacity and supported diff/editor color semantics.
- [W3C WCAG 2.2](https://www.w3.org/WAI/WCAG22/) — contrast, non-text contrast, use of color, focus-visible, reflow, and accessibility constraints.

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` — installed stack decisions, Primer reference palette, and dependency exclusions.
- `.planning/research/FEATURES.md` — table stakes, differentiators, anti-features, state contract, and prioritization.
- [Primer color usage](https://primer.style/product/getting-started/foundations/color-usage/) — semantic role model and dark-default design guidance.
- [Primer dark functional CSS 11.9.0](https://unpkg.com/@primer/primitives@11.9.0/dist/css/functional/themes/dark.css) — reference dark values; not a runtime dependency.
- [Primer diffBlob tokens](https://github.com/primer/primitives/blob/main/src/tokens/component/diffBlob.json5) — addition/deletion/hunk relationships.
- [GitHub pull request review documentation](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/reviewing-proposed-changes-in-a-pull-request) — visual/interaction conventions only; forge mechanics remain excluded.
- [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots) — environment and baseline cautions for curated visual regression coverage.

### Tertiary (LOW confidence)
- None. Remaining uncertainty is implementation validation, not reliance on an unverified single source.

---
*Research completed: 2026-07-24*
*Ready roadmap: yes*
