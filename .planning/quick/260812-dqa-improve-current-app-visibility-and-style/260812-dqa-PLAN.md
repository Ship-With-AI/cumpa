---
phase: quick
plan: 260812-dqa
type: execute
wave: 1
depends_on: []
files_modified:
  - src/web/components/IdentityHeader.vue
  - src/web/components/ReviewToolbar.vue
  - src/web/styles.css
  - tests/e2e/responsive-session.spec.ts
autonomous: true
requirements:
  - QUICK-260812-DQA
must_haves:
  truths:
    - "The session identity is easier to scan while its normalized accessible heading text, disclosure behavior, status facts, dirty-state facts, and lifecycle copy remain unchanged."
    - "The existing previous/next file and previous/next change controls have visible File and Change group labels on non-phone layouts without changing any interactive name, shortcut, tooltip, emit, disabled rule, or control geometry."
    - "Changed-file rows are more readable, preserve the status/path/count/availability grid, and retain one unambiguous selected-file rail."
    - "The review rail reads as one continuous document with wider sections, one vertical scroll owner, unchanged section order and states, accessible disclosures, and an unstretched Close review control."
    - "The selected path visually anchors the context strip while the established three-column, drawer, diff-canvas, Monaco, overflow, focus, contrast, and responsive contracts remain intact."
  artifacts:
    - path: "src/web/components/IdentityHeader.vue"
      provides: "Separate product and comparison visual roles with byte-equivalent normalized accessible heading text"
      contains: "session-header__comparison"
    - path: "src/web/components/ReviewToolbar.vue"
      provides: "Non-interactive File and Change navigation-group labels"
      contains: "review-toolbar__label"
    - path: "src/web/styles.css"
      provides: "Approved session header, toolbar, file ledger, review document, context strip, and phone styling"
      contains: "review-panel__disclosure"
    - path: "tests/e2e/responsive-session.spec.ts"
      provides: "Existing locked responsive geometry, overflow, focus, contrast, and scroll-owner contract"
  key_links:
    - from: "src/web/components/IdentityHeader.vue"
      to: "src/web/styles.css"
      via: "session-header product/comparison classes receive the approved wide and phone hierarchy"
      pattern: "session-header__(product|comparison)"
    - from: "src/web/components/ReviewToolbar.vue"
      to: "src/web/styles.css"
      via: "aria-hidden navigation-group labels are visible above 767px and hidden at phone widths"
      pattern: "review-toolbar__label"
    - from: "src/web/styles.css"
      to: "tests/e2e/responsive-session.spec.ts"
      via: "existing breakpoint, geometry, focus, contrast, overflow, and scroll-owner assertions remain green"
      pattern: "(1439|1099|767|640)"
---

<objective>
Implement the approved Cumpa workspace visual-clarity plan exactly as written in `local://workspace-visual-clarity-plan.md`.

Purpose: Improve scanability and hierarchy in the existing local Git inspection workspace without changing its behavior, information architecture, palette, dimensions, responsive model, accessibility contract, or capabilities.
Output: Focused edits to `IdentityHeader.vue`, `ReviewToolbar.vue`, and `styles.css`, with the existing responsive spec changed only under the approved assertion contingency, followed by the approved focused commands and browser QA.
</objective>

<execution_context>
@/Users/alessandro/.agents/gsd-core/workflows/execute-plan.md
@/Users/alessandro/.agents/gsd-core/templates/summary.md
</execution_context>

<context>
@local://workspace-visual-clarity-plan.md
@.planning/STATE.md
@src/web/components/IdentityHeader.vue
@src/web/components/ReviewToolbar.vue
@src/web/styles.css
@tests/e2e/responsive-session.spec.ts
@tests/integration/anchored-workspace.spec.ts

<interfaces>
- `local://workspace-visual-clarity-plan.md` is the authoritative implementation and verification contract. Preserve every literal, selector, dimension, breakpoint, responsive behavior, accessibility invariant, contingency, and command from it; resolve no design choices independently.
- `IdentityHeader.vue` already owns the session facts, comparison disclosure, lifecycle and dirty-state facts, and computed heading. Change only the approved visual split and comparison-only computed value.
- `ReviewToolbar.vue` already owns the file/change navigation pairs, Review action, Keyboard help action, interactive names, shortcuts, emits, tooltips, and disabled rules. Add only the approved non-interactive group labels.
- `styles.css` already owns the semantic tokens, continuous workspace composition, responsive drawers, file grid, context-strip order, review-panel scrolling, focus ring, and Monaco geometry. Modify existing selectors rather than creating a second styling convention.
- `responsive-session.spec.ts` locks 1440/1439/1280/1099/768/767/640/320 geometry, overflow, focus, contrast, responsive DOM order, scroll ownership, and the 640px diff canvas. It is read-only unless implementation changes a geometry contract beyond the exact approved values.
- `anchored-workspace.spec.ts` covers toolbar interaction, active-file state, comment selection, reduced motion, and drawer behavior. It remains read-only.
</interfaces>
</context>

<constraints>
- Modify only `src/web/components/IdentityHeader.vue`, `src/web/components/ReviewToolbar.vue`, and `src/web/styles.css`; modify `tests/e2e/responsive-session.spec.ts` only if the approved geometry-assertion contingency is actually triggered. Do not modify `tests/integration/anchored-workspace.spec.ts`.
- Add no route, state, command, API behavior, dependency, motion, review capability, search, filtering, resize handle, sticky behavior, metadata, count badge, visual-regression framework, component abstraction, token system, palette, or alternate art direction.
- Preserve the precision Git inspection bench direction, dark code-host-derived palette, continuous three-column composition, and base → selected file → head signature axis.
- Preserve the locked 288px file rail, 360px review rail, 1439px review-overlay breakpoint, 1099px file-drawer breakpoint, 640px local diff canvas, context-header DOM/grid order, 32×32 toolbar icon buttons, 40px disclosure target, 44px review disclosure rows, and existing focus geometry.
- Preserve literal UI copy unless the approved plan explicitly adds it. In particular, do not change `Pinned to displayed commits`, `Frozen verified patch`, attached lifecycle copy, dirty-state copy, disclosure labels, button names, tooltips, or shortcuts.
- Use only existing semantic CSS variables and system font stacks. If rendered contrast fails, restore the existing foreground/background pairing instead of inventing a color.
- The toolbar-label fallback is conditional: start with labels hidden only at `max-width: 767px`; use `max-width: 1099px` only if the real 768px fixture wraps controls. Do not resize controls or alter breakpoints.
- Do not perform unrelated cleanup. Do not install or update packages or touch the lockfile.
</constraints>

<tasks>

<task type="auto">
  <name>Task 1: Clarify session identity and navigation labels without changing semantics</name>
  <files>src/web/components/IdentityHeader.vue, src/web/components/ReviewToolbar.vue, src/web/styles.css</files>
  <action>Follow steps 1 and 2 of `local://workspace-visual-clarity-plan.md` exactly.

In `IdentityHeader.vue`, make the local `heading` computed value comparison-only: exact-patch sessions produce the literal `exact patch · ` followed by the first 12 digest characters; pinned comparisons produce base label, ` · `, the first 7 base OID characters, ` → `, head label, ` · `, and the first 7 head OID characters. Render the existing `h1` as a `session-header__product` span containing the literal `Cumpa:` followed by a `session-header__comparison` span containing `heading`. Preserve a normalized accessible heading byte-for-byte equivalent to the current visible heading, including the separating space, so existing heading-role assertions and screen-reader output do not change. Do not touch the comparison disclosure or any status, attached lifecycle, dirty-state, or disclosure copy.

In `ReviewToolbar.vue`, add an `aria-hidden="true"` visual label with the exact literal `File` immediately before the existing previous/next file pair and another with the exact literal `Change` immediately before the existing previous/next change pair. These labels are non-interactive and must not alter existing button names, tooltips, shortcuts, emits, disabled rules, ordering, Review action, or Keyboard help action.

In `styles.css`, give `.session-header__product` the existing UI stack at 18px/24px semibold and `.session-header__comparison` the existing monospace stack at 13px/20px in `--text-secondary`. Align them on one baseline on wide screens. Reduce desktop session-header padding from 16px × 24px to 8px × 16px, preserve the disclosure's 40px target, set `.header-facts` gap to 4px, and reduce only `.pin-cue` inline padding to 4px. In the existing phone rules, replace the 96px minimum and 16px padding with content-driven height and 12px padding, stack product over comparison, and retain wrapping for long refs, dirty badges, and attached lifecycle facts without truncation or disappearance.

Style `.review-toolbar__label` at the existing metadata size with semibold weight, uppercase tracking, and `--text-muted`. Preserve each icon button's 32×32 geometry. Hide only these labels at `max-width: 767px`, keeping all unchanged accessible button labels/tooltips and Keyboard help affordances. If and only if the real 768px fixture wraps the toolbar controls, move the label-hiding ceiling to `max-width: 1099px` per the approved contingency; do not change a control size or breakpoint. Strengthen the selected Review control using only `--selection-border` and `--status-information-background`; add no accent or count badge.</action>
  <verify>
    <automated>npm run typecheck:web</automated>
  </verify>
  <done>The Vue templates compile; session identity has distinct product/comparison visual roles with unchanged normalized accessible heading text and unchanged facts/disclosure behavior; File and Change are non-interactive visible group labels above the approved phone threshold; existing toolbar interaction contracts and control dimensions are unchanged.</done>
</task>

<task type="auto">
  <name>Task 2: Create a readable ledger, continuous review document, and connected context strip</name>
  <files>src/web/styles.css</files>
  <action>Follow steps 3, 4, and 5 of `local://workspace-visual-clarity-plan.md` exactly, using the existing selectors and semantic variables.

For the file ledger, retain every established responsive pane width and the status → path → counts → availability grid. Change `.review-files .tree-row` from metadata type to the existing 14px/20px body type and increase its minimum height from 40px to 44px; keep line counts and badges metadata-sized. Keep directory text muted and filenames semibold. Remove only the duplicate inset selection rail from `.tree-row--selected`, retaining its 3px left border and existing selection background. Add no search, filtering, resize handle, sticky behavior, or metadata.

For the review rail, remove `.comments-rail` padding and set `.review-panel` to `padding: 0` and `gap: 0`. Give `.review-panel__heading` one 16px inset and a bottom divider. At the locked 360px rail, top-level sections should span approximately 359px, with existing 16px section padding leaving approximately 327px of content width. Flatten `.review-panel__section` to transparent, square-edged rows separated by one bottom hairline. Preserve Summary, Open comments, Resolved comments, Export, and attached-completion order, conditional states, and expansion behavior; do not merge, remove, reorder, or auto-expand anything.

Make `.review-panel__disclosure` a full-width, left-aligned 44px row with a transparent rest state. Add a CSS-only trailing `▾` for `aria-expanded="true"` and `▸` otherwise. Use `--surface-interactive-hover` on hover and retain the global 2px focus ring, unchanged literal button names, and accessible expanded state. Keep `Close review` a normal secondary 32px control while adding `white-space: nowrap` and `align-self: start` so it does not stretch beside the heading/count block. Preserve the selected-comment rail, status badges, editors, warnings, Export primary action, and `.review-panel` as the only vertical scroll owner.

For the context header, preserve current base/file/head DOM order and responsive grid areas. Remove only its card-like radius and redundant top and inline borders; retain the bottom divider into the diff. Raise `.review-context-header__file h1` from 14px/20px to the existing 16px/24px section-heading token. Keep endpoint labels and OIDs metadata-sized; set side-label text to `--text-secondary`; preserve red `− REMOVED`, green `+ ADDED`, and all Monaco theme colors. Do not change the unchanged 640px local diff canvas, horizontal-scroll ownership, Monaco options, diff semantics, or comment-anchor geometry.</action>
  <verify>
    <automated>node scripts/verify-semantic-css.mjs</automated>
  </verify>
  <done>The semantic CSS contract passes; file rows are 14px/20px and at least 44px with the single retained selection rail; the review rail is one continuous approximately 359px-wide document with approximately 327px internal content width and one scroll owner; disclosures, Close review, ordering, and states retain their contracts; the active path outranks endpoint metadata without changing responsive order, locked canvas geometry, diff semantics, or Monaco styling.</done>
</task>

<task type="auto">
  <name>Task 3: Run the approved focused checks and browser QA</name>
  <files>src/web/components/IdentityHeader.vue, src/web/components/ReviewToolbar.vue, src/web/styles.css, tests/e2e/responsive-session.spec.ts, tests/integration/anchored-workspace.spec.ts</files>
  <action>Use the Verification and Assumptions & contingencies sections of `local://workspace-visual-clarity-plan.md` as the sole acceptance authority. Run the remaining approved commands from the repository root on Node.js 24 with the existing lockfile-installed dependencies; do not install anything or substitute broad suites. Review the two design-script warnings and fix only findings that apply to this existing product workspace. Keep both existing Playwright specs unchanged unless a new assertion in `responsive-session.spec.ts` is strictly required because implementation changed a geometry contract beyond the approved exact values; do not create a visual-regression framework.

Launch the built app against a comparison containing at least four text files and drive these exact browser states:
1. At 1440×900 with Review open, confirm columns remain 288px / fluid / 360px; active path is the strongest context-strip text; File and Change labels are visible; file rows are at least 44px with 14px text; review sections are approximately 359px wide with approximately 327px internal content width; only `.review-panel` scrolls vertically; nested card gutters are gone.
2. At 768×900, confirm Review and Files remain overlay drawers at their established widths; toolbar labels are visible without wrapping controls out of the header; closing either drawer restores focus to its opener; the document has no horizontal overflow. Trigger the approved `max-width: 1099px` label-hiding fallback only if labels actually wrap in this real fixture.
3. At 390×844, confirm product and comparison stack; the ordinary two-fact header has no 96px reserved minimum; File and Change labels are hidden; the Review drawer retains approximately 327px usable width; only `.diff-workspace__viewport` horizontally scrolls the unchanged 640px diff canvas.
4. With long refs and a dirty endpoint, confirm comparison text and status facts wrap without clipping.
5. By keyboard, Tab through comparison details, Files, navigation buttons, Review, rail disclosures, and Close review; confirm every focus ring is visible and each CSS chevron matches its disclosure's `aria-expanded` state.

If a changed selector fails existing rendered contrast checks, restore its existing foreground/background pairing rather than adding a color. Fix only deviations from the approved plan and rerun the affected approved check.</action>
  <verify>
    <automated>npm run build:web
npx playwright test tests/integration/anchored-workspace.spec.ts tests/e2e/responsive-session.spec.ts --project=chromium
node /Users/alessandro/.omp/plugins/node_modules/omp-designer/scripts/fix-ai-slop.mjs --check .
node /Users/alessandro/.omp/plugins/node_modules/omp-designer/scripts/analyze-layout.mjs .</automated>
    <human-check>Using the built app and the at-least-four-text-file comparison, complete the five browser states in this task exactly. Record measured wide/mobile section widths and scroll owners, the 768px toolbar-label outcome, focus-return and keyboard results, long-ref/dirty wrapping, and whether design-script warnings required any in-scope fix.</human-check>
  </verify>
  <done>All five approved commands have passed; applicable design-script findings are resolved without scope expansion; browser QA at 1440×900, 768×900, 390×844, long-ref/dirty, and keyboard states proves the approved hierarchy, locked dimensions, responsive behavior, focus/overflow/scroll ownership, accessible disclosure state, and unchanged diff/Monaco contracts.</done>
</task>

</tasks>

<source_audit>
| Source | Item | Covered by | Status |
|---|---|---|---|
| GOAL | Improve visibility and visual hierarchy without behavior or capability changes | Tasks 1–3 | COVERED |
| APPROACH 1 | Clarify session identity without changing accessible text or facts | Task 1 | COVERED |
| APPROACH 2 | Add self-explanatory File/Change visual labels and strengthen selected Review | Task 1 | COVERED |
| APPROACH 3 | Improve file-ledger readability while preserving density and grid | Task 2 | COVERED |
| APPROACH 4 | Flatten the review rail into one continuous review document | Task 2 | COVERED |
| APPROACH 5 | Connect context header to diff canvas while preserving order and geometry | Task 2 | COVERED |
| VERIFY | Typecheck, semantic CSS, build, two focused Playwright specs, both designer scripts | Tasks 1–3 | COVERED |
| VERIFY | 1440×900, 768×900, 390×844, long refs + dirty, and keyboard browser QA | Task 3 | COVERED |
| CONTINGENCY | Restore existing color pairing on contrast failure; hide toolbar labels through 1099px only if 768px wraps; test assertion only for geometry-contract change | Tasks 1 and 3 | COVERED |
| RESEARCH | None; approved plan is authoritative and no option or dependency selection is permitted | Constraints | COVERED |
</source_audit>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|---|---|
| Visual markup → accessibility tree | New visual spans and toolbar labels must preserve the existing accessible heading and interactive control names. |
| Responsive CSS → workspace interaction | Density changes must not break drawers, focus return, scroll ownership, overflow, or the locked diff canvas. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|---|---|---|---|---|
| T-QUICK-260812-DQA-01 | Spoofing | session identity heading | mitigate | Keep normalized accessible heading text byte-equivalent while separating only visual roles; retain all pinned/frozen/attached/dirty facts. |
| T-QUICK-260812-DQA-02 | Denial of Service | keyboard and responsive workspace access | mitigate | Preserve control targets, visible focus, drawer focus return, breakpoint geometry, horizontal-scroll ownership, and the sole review-panel vertical scroll owner; prove them in focused Playwright and browser QA. |
| T-QUICK-260812-DQA-SC | Tampering | package supply chain | accept | No package install, dependency, or lockfile change is allowed. |
</threat_model>

<verification>
Run exactly these approved commands from the repository root on Node.js 24 with existing lockfile-installed dependencies:
1. `npm run typecheck:web`
2. `node scripts/verify-semantic-css.mjs`
3. `npm run build:web`
4. `npx playwright test tests/integration/anchored-workspace.spec.ts tests/e2e/responsive-session.spec.ts --project=chromium`
5. `node /Users/alessandro/.omp/plugins/node_modules/omp-designer/scripts/fix-ai-slop.mjs --check .`
6. `node /Users/alessandro/.omp/plugins/node_modules/omp-designer/scripts/analyze-layout.mjs .`

Then drive and record every Task 3 browser state. Fix only applicable, in-scope findings. Confirm implementation changed only the three approved product files, plus `tests/e2e/responsive-session.spec.ts` only if its exact contingency triggered, and generated quick-task bookkeeping.
</verification>

<success_criteria>
- Session product and comparison identity are visually distinct, responsive, and fully wrapping while normalized accessible heading text and all existing facts/copy remain unchanged.
- File and Change group labels explain existing navigation on approved non-phone widths without changing any interactive toolbar contract; selected Review uses only approved existing tokens.
- File rows use approved 14px/20px type and 44px minimum height while grid, metadata sizing, path emphasis, and a single selected rail remain intact.
- Review sections form one continuous approximately 359px document with approximately 327px internal content width, accessible 44px disclosures, compact Close review, unchanged state/order, and one vertical scroll owner.
- The selected path is the context-strip anchor while endpoint metadata/colors, DOM/grid order, 288px and 360px rails, 1439px/1099px breakpoints, 640px diff canvas, Monaco, diff semantics, comment anchors, focus, contrast, overflow, and horizontal scrolling remain unchanged.
- Every approved command and exact browser-QA state passes without new features, dependencies, options, art direction, or unrelated cleanup.
</success_criteria>

<output>
Create `.planning/quick/260812-dqa-improve-current-app-visibility-and-style/260812-dqa-SUMMARY.md` when execution completes.
</output>
