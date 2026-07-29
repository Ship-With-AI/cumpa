---
phase: quick
plan: 260729-gzm
type: execute
wave: 1
depends_on: []
files_modified:
  - src/web/components/FileRow.vue
  - src/web/components/DiffWorkspace.vue
  - src/web/styles.css
  - src/web/monaco/theme.ts
  - tests/e2e/responsive-session.spec.ts
  - tests/unit/monaco-theme.test.ts
  - src/server/security.ts
  - tests/api/security.test.ts
  - src/git/candidates.ts
  - tests/helpers/source-control-snapshot.ts
  - DESIGN.md
  - PRODUCT.md
  - src/web/prototypes/Phase6DiffSemanticsPrototype.vue
  - tests/git/anchored-content.test.ts
  - tests/git/availability.test.ts
  - tests/git/inventory.test.ts
  - tests/helpers/git-fixture.ts
autonomous: true
requirements:
  - QUICK-260729-GZM
must_haves:
  truths:
    - "At 1440px, changed-file rows remain one compact primary line with aligned status, path, counts, and any exceptional availability cue."
    - "At narrow mobile browser widths, the changed-files drawer remains viewport-contained, readable, keyboard accessible, and free of page-wide horizontal overflow."
    - "Reviewable text files do not show a redundant visible Text badge; unsupported and unavailable files retain visible non-color warning cues and labels."
    - "The two Monaco panes visibly name Base as deletion and Head as addition, while minus/plus gutter cues preserve the same meanings without depending on red and green."
    - "Whole-line addition/deletion fills and stronger intraline fills are clearer without obscuring syntax, selection, focus, active-line, or comment-anchor states."
      - "Monaco line positioning styles remain active under CSP so changed lines cannot collapse and overlap."
    - "Loading and unavailable states use a deliberate display scale without enlarging the dense review workspace."
    - "Product facts and the visual system are documented as closed contracts."
    - "Prototype line-number labels and fixture email addresses are explicit test data rather than ambiguous claims."
  artifacts:
    - path: "src/web/components/FileRow.vue"
      provides: "Conditional availability cue markup for compact changed-file rows"
    - path: "src/web/styles.css"
      provides: "Single-line file-row layout, fitted sidebar/drawer widths, and semantic diff tokens/cues"
    - path: "src/web/components/DiffWorkspace.vue"
      provides: "Visible deletion/addition side labels"
    - path: "src/web/monaco/theme.ts"
      provides: "Monaco line and intraline semantic fill values"
    - path: "src/server/security.ts"
      provides: "Narrow CSP allowance for Monaco inline positioning attributes"
    - path: "tests/api/security.test.ts"
      provides: "CSP style-attribute contract coverage"
    - path: "tests/e2e/responsive-session.spec.ts"
      provides: "Wide and narrow observable UI regression coverage"
    - path: "tests/unit/monaco-theme.test.ts"
      provides: "Semantic CSS-token to Monaco-theme parity coverage"
    - path: "DESIGN.md"
      provides: "Visual direction, typography, color, geometry, component, motion, and responsive contract"
    - path: "PRODUCT.md"
      provides: "Closed product fact set and copy boundaries"
  key_links:
    - from: "src/web/components/FileRow.vue"
      to: "src/web/styles.css"
      via: "file-row, path-display, line-counts, and availability-marker classes"
      pattern: "file-row|availability-marker"
    - from: "src/web/styles.css"
      to: "src/web/monaco/theme.ts"
      via: "matching addition/deletion line and intraline semantic colors"
      pattern: "diff-(addition|deletion)-(background|intraline-background)"
    - from: "src/web/components/DiffWorkspace.vue"
      to: "src/web/monaco/diff-semantics.ts"
      via: "deletion/addition labels paired with existing base/head minus/plus decorations"
      pattern: "DELETION|ADDITION"
---

<objective>
Refine the existing Diff Review changed-files sidebar and Monaco diff semantics with the smallest CSS-first change.

Purpose: Improve scanning density and make deletion/addition meaning clearer without changing review behavior, Monaco ownership, architecture, dependencies, or information structure.
Output: Compact aligned file rows, a better-fitting sidebar/drawer, explicit side semantics, clearer semantic fills, and focused regression coverage.
</objective>

<execution_context>
@/Users/alessandro/.agents/gsd-core/workflows/execute-plan.md
@/Users/alessandro/.agents/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/web/components/FileRow.vue
@src/web/components/DiffWorkspace.vue
@src/web/styles.css
@src/web/monaco/theme.ts
@src/web/monaco/diff-semantics.ts
@tests/e2e/responsive-session.spec.ts
@tests/unit/monaco-theme.test.ts
@src/server/security.ts
@tests/api/security.test.ts
@src/git/candidates.ts
@tests/helpers/source-control-snapshot.ts
@tests/unit/monaco-diff-semantics.test.ts
@DESIGN.md
@PRODUCT.md
@src/web/prototypes/Phase6DiffSemanticsPrototype.vue
@tests/git/anchored-content.test.ts
@tests/git/availability.test.ts
@tests/git/inventory.test.ts
@tests/helpers/git-fixture.ts

<interfaces>
- `FileRow.vue` owns status, path, signed counts, and availability output. Keep its props, emits, tree semantics, roving tabindex, and accessible count label unchanged.
- `styles.css` owns responsive shell widths and semantic addition/deletion tokens. Reuse those rules and tokens; do not add a component token root or JavaScript layout logic.
- `DiffWorkspace.vue` owns visible BASE/HEAD labels; Monaco remains side-by-side rendering and line-change authority.
- `theme.ts` maps semantic CSS roles to Monaco line/intraline colors, and `monaco-theme.test.ts` enforces that parity.
- `diff-semantics.ts` supplies persistent base/head bars and sparse minus/plus signs. Preserve that implementation and focused test unchanged.
- `security.ts` must allow Monaco's dynamic inline positioning attributes without permitting inline scripts or inline style blocks.
</interfaces>
</context>

<constraints>
- Modify only the seventeen files listed in `files_modified`; no persistence, package metadata, lockfile, or dependency changes.
- Keep implementation CSS-first. Do not add resize observers, computed layout state, a new component, or a theme abstraction.
- Preserve Vue/Monaco architecture, semantic tokens, keyboard/focus behavior, tree accessibility, and localized diff overflow.
- This is a density and clarity refinement, not a redesign: no new review mechanics, icons, navigation, light theme, or information hierarchy.
- Run focused tests plus the designer delivery checks and project build required by the approved taste-review follow-up.
</constraints>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Compact and fit the changed-files sidebar</name>
  <files>src/web/components/FileRow.vue, src/web/styles.css, tests/e2e/responsive-session.spec.ts</files>
  <behavior>
    - At 1440px, each changed-file row presents status, one-line path, signed counts, and any exceptional availability marker on one aligned primary line without overlap.
    - Text-reviewable rows have no visible `Text` marker; unsupported and unavailable rows keep their visible label and existing non-color triangular cue.
    - At the existing narrow mobile test width, the drawer is capped by the viewport, row content remains usable, and only the diff canvas may own horizontal overflow.
  </behavior>
  <action>First extend the focused responsive Playwright contract with assertions at 1440px and the existing narrow mobile width for one-line row geometry, aligned row parts, absence of the redundant visible reviewable-text label, preservation of unsupported/unavailable labels and non-color cues, drawer containment, keyboard focus, and no page-wide horizontal overflow. Then update `FileRow.vue` to render the availability marker only for non-text availability kinds while leaving source data and accessible tree/count semantics intact. In `styles.css`, give `.tree-row.file-row` an explicit compact grid with fixed status/count/exception columns and a `minmax(0, 1fr)` path column; keep paths on one primary line with ellipsis rather than wrapping. Reduce only row-local spacing/min-height needed for density. Resolve the existing 288px shell versus 320px file-pane mismatch by widening the desktop sidebar and overlay drawer only to the smallest existing bounded width that lets the row fit; retain `calc(100vw - 16px)` capping on narrow screens. Do not hide exceptional cues, shrink focus targets below the established accessible contract, or introduce JS sizing.</action>
  <verify>
    <automated>npm run test:browser -- tests/e2e/responsive-session.spec.ts --grep "responsive keyboard and accessibility contract"</automated>
    <human-check>At 1440px and narrow mobile width, confirm compact rows scan as status → path → counts → exceptional cue, the drawer remains contained, and path truncation retains the existing full-path accessibility.</human-check>
  </verify>
  <done>Wide and narrow focused browser assertions prove compact one-line rows, hidden redundant Text availability, retained unsupported/unavailable cues, aligned content, bounded drawer width, keyboard continuity, and no page-wide overflow.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Strengthen deletion/addition semantics and fills</name>
  <files>src/web/components/DiffWorkspace.vue, src/web/styles.css, src/web/monaco/theme.ts, src/server/security.ts, tests/api/security.test.ts, tests/e2e/responsive-session.spec.ts, tests/unit/monaco-theme.test.ts</files>
  <behavior>
    - The left pane visibly communicates Base/deletion and the right pane Head/addition in wide and narrow localized-scroll layouts.
    - Existing dashed base bar plus minus signs and solid head bar plus plus signs remain detectable without color.
    - Whole-line fills are clearer than the canvas and intraline fills remain stronger than whole-line fills while syntax and overlapping interaction states stay legible.
    - Monaco's dynamically positioned changed lines retain non-zero height and increasing vertical positions under the production CSP.
  </behavior>
  <action>Extend focused tests before implementation: assert visible side labels communicate deletion/addition, retain existing base/head accessibility wording, and keep current non-color bar/sign geometry; update the theme contract so line and intraline values continue matching root semantic tokens, with intraline emphasis measurably stronger than whole-line emphasis. Change only visible label copy in `DiffWorkspace.vue` to pair Base with deletion and Head with addition; do not change side IDs, comment anchor labels, source order, or Monaco adapter behavior. In `styles.css`, strengthen existing `--diff-addition-background`, `--diff-deletion-background`, and intraline counterparts just enough for clearer composited contrast while preserving stronger intraline hierarchy, then mirror exact resolved hex/alpha values in `theme.ts` for Monaco inserted/removed line, text, and gutter keys. Keep existing dashed deletion bar, solid addition bar, and minus/plus pseudo-elements unchanged. Do not add overlays, decorations, palette roots, or change `diff-semantics.ts`.</action>
  <verify>
    <automated>npm exec vitest -- run tests/unit/monaco-theme.test.ts tests/unit/monaco-diff-semantics.test.ts</automated>
    <automated>npm exec -- playwright test tests/e2e/responsive-session.spec.ts --project=chromium --grep "responsive keyboard and accessibility contract"</automated>
    <human-check>At 1440px and narrow mobile width, inspect deletion/addition line and intraline samples with selection, active-line, focus, and comment cues; all meanings remain simultaneously legible and do not rely on red/green alone.</human-check>
  </verify>
  <done>Focused theme/semantic tests and wide/narrow browser coverage prove explicit deletion/addition labels, stronger hierarchical fills, preserved minus/plus and dashed/solid cues, and unchanged Monaco behavior.</done>
</task>

<task type="auto">
  <name>Task 3: Resolve designer taste-review warnings</name>
  <files>DESIGN.md, PRODUCT.md, src/web/styles.css, src/web/prototypes/Phase6DiffSemanticsPrototype.vue, tests/git/anchored-content.test.ts, tests/git/availability.test.ts, tests/git/inventory.test.ts, tests/helpers/git-fixture.ts</files>
  <behavior>
    - Transient loading and unavailable headings establish a clear display hierarchy at wide and narrow widths without affecting review density.
    - Product claims and the visual system have explicit source-of-truth contracts.
    - Prototype gutter labels cannot be mistaken for statistic claims, and fixture contacts use reserved test domains.
  </behavior>
  <action>Add one scoped display token for transient states, write concise closed PRODUCT and DESIGN contracts from established project facts and tokens, prefix prototype source-line numbers with `L`, and replace fixture contacts with `.test` or `.invalid` addresses.</action>
  <verify>
    <automated>node /Users/alessandro/.omp/plugins/node_modules/omp-designer/scripts/fix-ai-slop.mjs --check .</automated>
    <automated>node /Users/alessandro/.omp/plugins/node_modules/omp-designer/scripts/analyze-layout.mjs .</automated>
    <automated>npm run build</automated>
    <automated>npm exec -- vitest run tests/git/anchored-content.test.ts tests/git/availability.test.ts tests/git/inventory.test.ts tests/git/candidates.test.ts</automated>
    <automated>npm exec -- playwright test tests/e2e/responsive-session.spec.ts --project=chromium --grep "responsive keyboard and accessibility contract"</automated>
    <human-check>Inspect wide and narrow workspace and loading-state screenshots for fit, hierarchy, and clear semantic diff presentation.</human-check>
  </verify>
  <done>Targeted designer warnings are absent, checks pass, and affected wide/narrow screenshots are recaptured and inspected.</done>
</task>

</tasks>

<source_audit>
| Source | ID | Requirement | Task | Status |
|---|---|---|---|---|
| GOAL | QUICK-260729-GZM | Focused sidebar and Monaco clarity refinement | 1, 2 | COVERED |
| CONTEXT | CSS-first | Preserve architecture, tokens, accessibility, and dependencies | 1, 2 | COVERED |
| CHANGE | File density | One primary line; aligned status/path/counts; exceptional availability only | 1 | COVERED |
| CHANGE | Width | Widen sidebar/drawer only where fit improves, with viewport cap | 1 | COVERED |
| CHANGE | Diff semantics | Deletion/addition labels plus non-color minus/plus cues | 2 | COVERED |
| CHANGE | Fill clarity | Stronger line and intraline semantic hierarchy | 2 | COVERED |
| ACCEPTANCE | Responsive | Observable 1440px and narrow mobile behavior | 1, 2 | COVERED |
| ACCEPTANCE | Focused tests | Existing Monaco theme/semantic tests plus focused responsive spec | 1, 2 | COVERED |
</source_audit>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|---|---|
| Session file metadata → changed-files tree | Existing path/status/count text must remain safely rendered and bounded. |
| Monaco diff state → visual semantics | Presentation must not redefine side or line-change authority. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|---|---|---|---|---|
| T-QUICK-260729-GZM-01 | Tampering | File selection/tree behavior | mitigate | CSS-first layout and conditional presentation only; preserve props, emits, IDs, and keyboard model. |
| T-QUICK-260729-GZM-02 | Spoofing | Diff-side meaning | mitigate | Pair explicit deletion/addition text with existing Base/Head order and persistent minus/plus plus dashed/solid cues. |
| T-QUICK-260729-GZM-03 | Denial of Service | Narrow layout | mitigate | Keep drawer viewport-capped and diff overflow localized; assert no page-wide horizontal overflow. |
| T-QUICK-260729-GZM-SC | Tampering | Package supply chain | accept | No dependency, package, or lockfile changes. |
</threat_model>

<verification>
1. Run the two designer delivery checks.
2. Run `npm run build`.
3. Run the focused four-file Vitest command and responsive Chromium Playwright contract.
4. Inspect wide and narrow workspace and loading-state screenshots.
</verification>

<success_criteria>
- Changed-file rows are compact, single-line, aligned, and usable at 1440px and narrow mobile width.
- Visible `Text` availability is removed only for reviewable files; unsupported/unavailable cues remain visible and non-color-dependent.
- Sidebar/drawer width changes are bounded and limited to improving row fit.
- Base/deletion and Head/addition semantics are explicit while existing minus/plus and dashed/solid cues remain authoritative.
- Semantic whole-line fills are clearer, intraline fills remain stronger, and overlapping interaction states stay legible.
- Only focused responsive and Monaco semantic/theme coverage is changed or run; no application behavior, dependency, or architecture changes occur.
- The visual and product contracts exist, transient state display hierarchy is deliberate, and test-only labels and contacts are unambiguous.
</success_criteria>

<output>Create `.planning/quick/260729-gzm-refine-diff-sidebar-and-clarity/260729-gzm-SUMMARY.md` after execution. This planning task creates only `.planning/quick/260729-gzm-refine-diff-sidebar-and-clarity/260729-gzm-PLAN.md`.</output>
