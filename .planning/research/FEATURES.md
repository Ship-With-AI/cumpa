# Feature Research

**Domain:** Dark-default pull-request diff workspace visual and accessibility conventions
**Researched:** 2026-07-24
**Confidence:** MEDIUM

## Milestone Scope

This research covers **v1.1 GitHub Dark Diff**, a visual and accessibility milestone for the existing Diff Review application. The recommendation is a close adaptation of GitHub's dark-default pull-request diff language, not a GitHub clone.

**In scope:** semantic dark palette, Monaco diff theming, typography, density, borders, file header, gutters, existing controls, inline comments, the existing review rail, interaction states, non-color cues, and narrow-layout behavior.

**Must remain unchanged:** Vue 3, Monaco, Fastify, the current three-part information architecture (changed files, diff, review rail), comment lifecycle, summary workflow, draft persistence, export behavior, keyboard commands, and local-first identity.

**Explicitly out of scope:** replies, suggestions, approvals, requests for changes, pending-review submission, `Viewed` tracking, remote collaboration, light mode, a theme picker, or any other new review mechanic. GitHub's current review documentation is evidence for visual conventions only, not permission to copy its full workflow [S4].

## Feature Landscape

### Table Stakes (Users Expect These)

Missing any P1 item would make the workspace feel partially themed, visually ambiguous, or inaccessible.

| Feature | Why Expected | Complexity | Testable user-visible behavior |
|---------|--------------|------------|--------------------------------|
| Dark-default semantic surface hierarchy | A dark diff must read as one workspace rather than a light shell containing a dark editor. Primer distinguishes default, muted, inset, control, border, foreground, and semantic-role tokens [S1][S2]. | HIGH | On first render, the page, file tree, active-file header, toolbar, Monaco canvas, inline comments, review rail, menus, text areas, notices, and empty/error states all use coordinated dark roles. No light panel or default browser control flashes or remains inside the review workspace. |
| Addition, deletion, intraline, hunk, and unchanged states | GitHub's diff tokens distinguish full added/deleted lines from stronger intraline word changes, while hunk and empty regions use accent/muted roles [S2][S3]. | HIGH | Added and deleted lines use quiet translucent semantic fills; changed words use a visibly stronger fill; hunk/expanded-context rows are blue-accented; unchanged/empty regions are neutral. Code remains readable over every layer. |
| Clear base/head and add/delete non-color cues | Red and green cannot be the only distinction. WCAG requires a visible alternative to color [S6]. | HIGH | `BASE` and `HEAD` remain explicit; column position, line/gutter structure, and `+`/`−` or equivalent visible markers distinguish add/delete meaning in monochrome. The accessible name of the diff continues to state base and head. |
| GitHub-like code typography | Reviewers expect compact monospace code, aligned line numbers, and UI text separate from code. Primer uses system typography, rem sizes, unitless line height, and a 4 px rhythm [S5]. | MEDIUM | Code and line numbers use a platform monospace stack with stable columns; UI uses the platform sans-serif stack; file paths and metadata do not masquerade as code body text. Browser zoom preserves legibility and alignment. |
| Deliberate density and rhythm | Pull-request diffs are information-dense but controls still need usable targets. WCAG 2.5.8 requires 24 × 24 CSS px targets or sufficient spacing [S11]. | MEDIUM | Diff rows remain compact; toolbar, gutter comment affordance, drawer controls, comment actions, and form controls meet the target-size/spacing rule. Density does not create overlapping or easily mis-clicked actions. |
| Restrained borders, radii, and elevation | GitHub dark-default relies on subtle surface steps and separators rather than floating light cards. Primer provides default, muted, and emphasis border roles [S1][S2]. | MEDIUM | Major regions are separated by 1 px semantic borders; the file header and diff body read as one bounded unit; comment cards and notices have modest radii; overlays alone receive shadow. No gratuitous gradients or stacked card shadows obscure hierarchy. |
| File header hierarchy | A reviewer must locate the current file before reading code. GitHub puts file identity and actions in a compact header above its diff [S4]. | MEDIUM | The current path is the strongest header text, remains available when truncated, and is visually grouped with existing file/diff controls. Base/head labels and metadata are secondary. No `Viewed`, collapse, rich-diff, or file-comment mechanic is added. |
| Legible gutters and line numbers | Gutters orient the reviewer, expose anchors, and carry the existing comment action. GitHub reveals a blue plus affordance beside the hovered line number [S4]. | HIGH | Base and head line-number columns are distinct but quiet; the active/selected line number gains emphasis; added/deleted gutters preserve semantic context; the existing `+` comment action appears on pointer hover **and** keyboard line focus without shifting code. |
| Complete control state matrix | Rest, hover, active/pressed, selected/expanded, keyboard focus, disabled, destructive, and busy states must not collapse into the same gray button. Primer exposes separate control roles for these states [S1][S2]. | MEDIUM | Every existing toolbar, drawer, comment, summary, export, copy, and retry control has visibly distinct applicable states. Hover never substitutes for focus; disabled controls look unavailable and remain labeled; destructive controls use danger styling without dominating neutral actions. |
| Inline comment continuity | Inline comments belong to a line but must remain visually separate from code. | MEDIUM | The existing composer and accepted-comment view use the same dark input/card system as the review rail, retain a clear anchor edge and file/side/line heading, keep validation text readable, and do not cover adjacent code or gutters. Saved/pending/confirm states include text or icon cues, not color alone. |
| Review rail hierarchy | The rail is a persistent local review surface, not a secondary page. | MEDIUM | The rail has a distinct muted canvas and border, a clear heading/count hierarchy, readable open/resolved groups, and consistent cards/forms. The selected or revealed comment is apparent through shape/outline/text as well as color. Existing close, edit, resolve, reopen, delete, summary, and export behaviors are unchanged. |
| Selection, hover, and focus separation | A selected code range, selected file, active line, hover target, open comment, and keyboard focus can coexist. They must remain distinguishable. | HIGH | Blue text selection remains visible over green/red diff backgrounds; active file and active line are not confused with selection; pointer hover is subtler than selection; every keyboard-focusable element displays a persistent visible outline [S8][S9]. |
| Error, warning, info, success, pending, and disabled semantics | Dark themes often make low-emphasis states indistinguishable or use red alone. Primer assigns foreground, background, and border roles to semantic messages [S1][S2]. | MEDIUM | Notices and validation pair role color with an icon, heading/status word, border/edge treatment, and explanatory text. Error text meets normal-text contrast; warnings do not look destructive; pending/busy states remain readable; opacity alone never communicates disabled or resolved state. |
| Narrow-layout preservation | The existing workflow must survive narrow windows and zoom. WCAG explicitly recognizes side-by-side code comparison as a valid two-column region when each column fits a 320 CSS px container and horizontal scrolling is localized [S10]. | HIGH | At a 320 CSS px equivalent viewport, header, toolbar, file drawer, review drawer, comments, notices, and forms reflow without clipping or page-wide two-dimensional scrolling. The validated side-by-side diff may retain a local horizontal scroller with two approximately 320 px columns; scrolling the diff does not drag the entire application chrome off-screen. |

### Recommended Semantic Palette Contract

Use **local semantic role tokens** whose dark-default values closely track current Primer primitives 11.9.0. Do not scatter raw hex values through components, and do not add Primer as a runtime dependency solely for colors. Primer itself recommends consuming semantic/component roles rather than base-scale values [S1].

| Local role | GitHub/Primer dark-default reference | Intended use |
|------------|--------------------------------------|--------------|
| `canvas-inset` | `#010409` | Recessed diff surroundings, wells, deep overlays |
| `canvas-default` | `#0d1117` | Main page and Monaco code canvas |
| `canvas-muted` | `#151b23` | File tree, toolbar/header grouping, review rail |
| `control-rest` | `#212830` | Neutral buttons and inputs |
| `control-hover` / `control-active` | `#262c36` / `#2a313c` | Pointer hover and pressed state |
| `border-default` / `border-emphasis` | `#3d444d` / `#656c76` | Region separation and strong/current boundaries |
| `fg-default` / `fg-muted` / `fg-disabled` | `#f0f6fc` / `#9198a1` / `#656c76` | Primary, secondary, and unavailable text/icons |
| `accent-fg` / `accent-emphasis` / `accent-muted` | `#4493f8` / `#1f6feb` / `#388bfd1a` | Links, focus, comment affordance, selected/informational surfaces |
| `success-fg` / `success-muted` | `#3fb950` / `#2ea04326` | Addition and positive state |
| `danger-fg` / `danger-muted` | `#f85149` / `#f851491a` | Deletion, errors, destructive state |
| `attention-fg` / `attention-muted` | `#d29922` / `#bb800926` | Warnings and conflict attention |
| `selection` | `#1f6febb3` | Text selection, with a separate active-line/focus treatment |
| `diff-add-word` / `diff-add-number` | `#2ea04366` / `#3fb9504d` | Strong intraline and gutter-number addition emphasis |
| `diff-delete-word` / `diff-delete-number` | `#f8514966` / `#f851494d` | Strong intraline and gutter-number deletion emphasis |
| `diff-hunk` / `diff-hunk-number` | `#388bfd1a` / `#0c2d6b` | Context-expansion and hunk rows |

These values are reference anchors, not a license to assume contrast. Every foreground/background pair must be measured in its final composited state. Normal text needs at least 4.5:1; large text and meaningful non-text/state indicators need at least 3:1 [S7][S8]. Translucent diff and selection layers are especially important to verify after composition.

### Differentiators (Competitive Advantage)

These features preserve Diff Review's identity while raising visual quality. They add no review mechanics.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| GitHub familiarity without forge chrome | Reviewers recognize the palette, diff semantics, file-header density, and gutter affordance immediately, while the product remains clearly local and agent-oriented. | MEDIUM | Keep Diff Review wording, local-save badges, base/head identity, review rail, and export language. Do not reproduce GitHub branding, navigation, avatars, or submission model. |
| One semantic contract across native UI and Monaco | The shell and editor no longer look like separate products; semantic changes have one named source of truth. | HIGH | Map local CSS tokens into `monaco.editor.defineTheme` colors for editor canvas, line numbers, gutters, selection, inserted/removed line/text backgrounds, diff border, unchanged regions, and context controls [S12][S13]. |
| Accessibility-first GitHub adaptation | Familiar colors are strengthened with non-color and focus cues where a literal visual copy would be ambiguous. | HIGH | Addition/deletion has side labels and structural markers; selected/focused/commented states use outline, edge, icon, text, or weight in addition to fill. This is intentional adaptation, not divergence by accident. |
| Review continuity at narrow widths | A developer can narrow the local window or zoom without losing access to files, comments, or actions. | HIGH | Keep two-dimensional scrolling inside the diff region only. Existing file and review drawers handle auxiliary regions; forms and prose fit the viewport. Do not silently replace the validated side-by-side experience with unified diff. |
| Dark-only precision | A single deliberately tuned mode avoids partial theme parity and reduces state combinations for this milestone. | LOW | Dark-only is a scope advantage for v1.1. It does not imply a hidden or unfinished light mode. |
| Visual restoration with zero workflow churn | Existing users gain a more recognizable review surface without relearning commenting, resolving, summary, or export. | MEDIUM | Preserve DOM semantics, accessible names, keyboard bindings, state transitions, and information architecture while changing presentation. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Pixel-perfect GitHub clone | It appears to guarantee familiarity. | GitHub's production UI changes continuously, includes forge-specific mechanics, and would erase Diff Review's local identity. It also creates brittle screenshot matching. | Adapt Primer semantic roles and the recognizable file/diff/comment hierarchy; retain Diff Review copy and structure. |
| New GitHub review mechanics | `Viewed`, replies, suggestions, approvals, requests for changes, and pending review feel associated with GitHub diffs. | They change product behavior, persistence, contracts, and information architecture; the milestone explicitly forbids them. | Restyle only controls and states that already exist. |
| Light mode or theme picker | Users often expect a theme choice. | It doubles palette/state/responsive verification and dilutes the dark-only goal. A partial light mode is worse than no light mode. | Ship one complete dark-default mode. Reconsider modes only in a separate milestone. |
| Importing Primer as a runtime UI system | It promises exact GitHub fidelity. | The app already has Vue components and local primitives; adding a React-oriented or broad design-system dependency creates a second convention and unnecessary payload. | Define a small local semantic token layer informed by Primer primitives. |
| Replacing Monaco or overlaying a custom diff renderer | It offers total visual control. | It risks line mapping, syntax highlighting, view zones, context expansion, accessibility, and validated comment anchors. | Theme Monaco through documented APIs and use existing decorations/view zones [S12][S13]. |
| Color-only add/delete/selected/resolved states | It is visually minimal. | It fails users who cannot distinguish hues and creates ambiguity when selection overlays diff colors [S6]. | Pair color with labels, side/position, glyph or edge markers, text status, and visible focus/selection outline. |
| Hover-only line-comment affordance | It matches a mouse screenshot. | Keyboard and touch users cannot discover or operate a control that only exists on pointer hover. | Reveal the existing plus action on hover, active line, and keyboard focus; keep its accessible label and shortcut. |
| Opacity-only disabled or resolved state | It is easy to implement. | It can make labels unreadable and does not explain state. Disabled controls are contrast-exempt normatively, but still need usable identification. | Use disabled foreground/background/border roles, preserve the label, disable interaction, and expose state programmatically. Use a text badge for resolved. |
| Page-wide fixed 640 px layout | It preserves side-by-side geometry. | It forces all chrome, comments, and forms into two-dimensional scrolling at narrow widths. WCAG's side-by-side exception applies to the diff region, not the whole page [S10]. | Give only the diff a bounded horizontal scroller; reflow auxiliary UI and use existing drawers. |
| Decorative gradients, glow, or heavy shadows | They make dark UIs look dramatic. | They reduce code contrast, blur boundaries, and compete with semantic highlights. | Use surface steps, 1 px borders, modest radii, and shadows only for overlays. |
| Remote or GitHub-proprietary font loading | It may appear closer to GitHub. | It adds network dependence to a local-first app and risks layout shift/privacy concerns. | Use platform sans-serif and monospace stacks. |
| Global product redesign | A dark palette can invite restyling every route and artifact. | It expands beyond the diff workspace and can destabilize validated recovery/export flows. | Apply shared dark roles where those existing states render inside the review workspace; do not restructure unrelated product flows. |

## User-Visible State Contract

The following matrix is the minimum visual contract for v1.1. It is deliberately phrased as behavior that can be observed without inspecting implementation details.

| State | Required visible cues |
|-------|-----------------------|
| Rest | Default foreground, surface, and border roles; controls remain recognizable as controls. |
| Hover | Subtle surface/border change without movement or content reflow; never the only way to expose an essential action. |
| Active/pressed | Stronger control surface than hover for the duration of activation. |
| Selected file | Accent edge or outline plus stronger label/icon weight; distinct from hover and keyboard focus. |
| Active diff line | Emphasized line number and edge/outline; addition/deletion fill remains legible. |
| Text selection | Blue selection layer remains visible over neutral, added, and deleted lines; selected text remains readable. |
| Keyboard focus | Persistent 2 px-class visible outline/ring with offset where needed; not clipped by sticky/drawer/Monaco containers [S9]. |
| Addition | Head-side position/label plus green-tinted line and stronger intraline/gutter treatment; a visible structural marker exists without color. |
| Deletion | Base-side position/label plus red-tinted line and stronger intraline/gutter treatment; a visible structural marker exists without color. |
| Comment anchor | Existing plus/comment shape, accessible label, active-line association, and accent treatment. |
| Saved/open/resolved comment | Status word or badge plus distinct edge/icon/weight; resolution is not opacity or color alone. |
| Pending/busy | Existing progress text remains visible; controls that cannot run are disabled without removing context. |
| Error | Error heading/message plus danger foreground, border/edge, and optional icon; recovery action remains visually primary for that state. |
| Warning/conflict | Warning heading/message plus attention foreground, border/edge, and icon/text; visually distinct from destructive error. |
| Disabled | Muted foreground with dedicated disabled surface/border and unavailable cursor/behavior; label remains readable. |

## Feature Dependencies

```text
[Local semantic dark tokens]
    ├──requires──> [Role inventory for every existing UI state]
    ├──enables───> [Shell/component dark styling]
    └──enables───> [Monaco dark theme]
                         └──requires──> [Diff/selection/gutter precedence matrix]

[Non-color state language]
    ├──enhances──> [Semantic diff states]
    ├──enhances──> [Control state matrix]
    └──enhances──> [Comments, notices, errors, disabled states]

[Narrow shell reflow]
    ├──requires──> [Diff-owned horizontal overflow]
    ├──requires──> [Existing file/review drawer behavior]
    └──requires──> [Toolbar, header, composer, and notice reflow]

[GitHub visual fidelity] ──conflicts──> [Pixel clone / new GitHub mechanics]
[Dark-only completeness] ──conflicts──> [Theme picker / partial light mode]
```

### Dependency Notes

- **Role inventory before palette application:** The current stylesheet contains an earlier dark token set followed by active light workbench overrides. Replacing colors ad hoc would leave split-brain states. Establish one role map first, then migrate every active workspace selector.
- **Monaco theme requires the same role map:** Monaco is not automatically styled by page CSS. Its canvas, line numbers, gutters, insert/remove layers, selection, focus, diff border, and unchanged-region controls require a named theme via documented APIs [S12][S13].
- **Diff/selection precedence before final colors:** Addition/deletion, intraline emphasis, current line, selection, comment anchor, and focus can overlap. Their composited result must be designed as a matrix rather than tuned one state at a time.
- **Non-color cues are cross-cutting:** They affect Monaco decorations, side labels, file rows, comment statuses, notices, controls, and validation. They cannot be deferred as a final contrast pass.
- **Narrow reflow depends on overflow ownership:** The diff may remain two columns and horizontally scroll, but the page header, toolbar, rail, comments, and forms must not inherit that minimum width [S10].
- **Visual fidelity conflicts with feature imitation:** GitHub documents `Viewed`, suggestions, review submission, approvals, and requests for changes [S4]; all remain anti-features here because v1.1 changes appearance only.

## MVP Definition

### Launch With (v1.1)

- [ ] One complete local semantic dark palette across the diff workspace and all existing states.
- [ ] A named Monaco dark theme matching the shell and preserving readable syntax highlighting.
- [ ] Distinct full-line, intraline, gutter, hunk, unchanged, active-line, and selection treatments.
- [ ] GitHub-like file header, line-number gutters, and existing plus-comment affordance.
- [ ] Platform UI/monospace typography, compact 4 px-based rhythm, and restrained borders/radii.
- [ ] Complete rest/hover/active/selected/focus/error/warning/pending/disabled/destructive state coverage.
- [ ] Dark inline composer, accepted comments, review rail, summary, and existing comment actions.
- [ ] Visible non-color cues for diff meaning, status, validation, resolution, selection, and focus.
- [ ] Narrow layout where auxiliary UI reflows and horizontal scrolling is owned by the side-by-side diff only.
- [ ] No change to review mechanics, information architecture, persistence, export, or keyboard commands.

### Add After Validation (v1.x)

- [ ] Fine-tune syntax-token hues only if real repository samples reveal collisions with semantic diff fills.
- [ ] Fine-tune density at intermediate widths only if user observation shows target or scanning problems.
- [ ] Refine high-contrast behavior using the existing semantic contract if OS/browser forced-colors evaluation exposes gaps; do not turn this into a second branded theme.

### Future Consideration (v2+)

- [ ] Additional color modes — only as a separately scoped milestone with full state parity.
- [ ] Any new GitHub review mechanic — only after product validation and contract-level design; none belongs to v1.1.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Semantic dark role system | HIGH | HIGH | P1 |
| Monaco dark theme and diff layers | HIGH | HIGH | P1 |
| Accessible add/delete and non-color cues | HIGH | HIGH | P1 |
| Selection/focus/hover precedence | HIGH | HIGH | P1 |
| File header and gutters | HIGH | MEDIUM | P1 |
| Controls and semantic status states | HIGH | MEDIUM | P1 |
| Inline comments and review rail | HIGH | MEDIUM | P1 |
| Typography, density, borders, radii | HIGH | MEDIUM | P1 |
| Narrow layout and overflow ownership | HIGH | HIGH | P1 |
| Syntax hue fine-tuning from broad language samples | MEDIUM | MEDIUM | P2 |
| Intermediate-width density refinements | MEDIUM | MEDIUM | P2 |
| Additional color modes | LOW for this milestone | HIGH | P3 |
| New review mechanics | OUT OF SCOPE | HIGH | P3 |

**Priority key:**
- **P1:** Required for v1.1 acceptance.
- **P2:** Polish after the complete visual contract works end to end.
- **P3:** Separate future scope; do not build in this milestone.

## Complexity and Current-Code Implications

| Area | Complexity driver | Existing dependency |
|------|-------------------|--------------------|
| Palette | Active light workbench overrides coexist with older root dark variables; every component state must migrate together. | `src/web/styles.css` |
| Monaco | Page CSS cannot theme editor internals; overlapping diff, intraline, selection, line, gutter, and focus layers need explicit color IDs. | `src/web/monaco/diff-adapter.ts`, `monaco-editor` 0.55.1 |
| File header and toolbar | Existing markup can be retained, but path truncation, grouping, focus, and narrow wrapping must be coordinated. | `src/web/App.vue`, `ReviewToolbar.vue` |
| Gutter affordance | The existing absolutely positioned plus follows Monaco line geometry; larger targets and focus-visible discovery must not drift from the anchor. | `DiffWorkspace.vue`, `diff-adapter.ts` |
| Inline comments | Vue content is rendered into Monaco view zones, so dark card/input sizing affects zone height and scroll stability. | `DiffWorkspace.vue`, `CommentComposer.vue` |
| Review rail | Many existing lifecycle/export states share one rail; styling must cover all without changing transitions. | `ReviewPanel.vue` and child components |
| Narrow layout | Current diff/main minimum width is 640 px. The difficult part is localizing that width to the diff while letting surrounding UI reflow. | `styles.css`, existing file/review drawers |
| Accessibility | Contrast must be checked after alpha compositing; focus and non-color cues cross native Vue and Monaco-rendered DOM. | Shared CSS plus Monaco theme/decorations |

## Competitor Feature Analysis

The relevant comparison is not a broad market survey: GitHub's current Files changed experience is the visual reference, the shipped Diff Review app is the behavioral authority, and v1.1 is the adaptation.

| Feature | GitHub dark-default convention | Current Diff Review baseline | v1.1 approach |
|---------|--------------------------------|------------------------------|---------------|
| Surface hierarchy | Dark page, muted grouped regions, subtle borders, inset code surfaces via Primer roles [S1][S2]. | Active review-workbench overrides are light editorial colors. | Replace active workspace roles with one coordinated dark semantic system. |
| Diff semantics | Dedicated added/deleted line, word, number, hunk, and empty-region component tokens [S2][S3]. | Monaco defaults provide diff semantics but are not integrated with the shell palette. | Map local roles to Monaco's documented diff color IDs and preserve syntax/readability. |
| File navigation/header | Files changed, file filtering/tree, compact file identity/action header [S4]. | Existing file tree, active-file strip, and toolbar already supply the required workflow. | Restyle existing regions only; do not add filters/actions/mechanics not already present. |
| Line comment affordance | Blue plus appears beside a hovered line number [S4]. | Existing plus button is positioned against the active Monaco line and has an accessible label/shortcut. | Match the familiar shape/accent while adding keyboard-focus discovery and target sizing. |
| Inline comments | Comment field appears in the diff context [S4]. | Existing Monaco view-zone composer and saved-comment view. | Apply the shared dark form/card language without adding replies, suggestions, or pending reviews. |
| Review side surface | GitHub review UI groups comment and submission actions around the diff. | Diff Review has a dedicated local review rail with summary, lifecycle, and export. | Preserve the rail as a product differentiator; visually integrate it with the diff. |
| Accessibility | Primer semantic modes plus WCAG-constrained contrast/state roles [S1][S6-S11]. | Accessible labels, keyboard paths, live messages, and focus rules already exist, but visual states need dark-specific validation. | Retain semantics and strengthen visible focus, non-color cues, state separation, and narrow reflow. |
| Narrow comparison | Side-by-side code may remain a localized two-dimensional region [S10]. | The main review surface currently keeps a 640 px width and can force broad horizontal scrolling. | Keep side-by-side semantics while confining horizontal overflow to the diff; reflow everything else. |

## Sources

### Primary and current external sources

- **[S1]** [Primer — Color usage](https://primer.style/product/getting-started/foundations/color-usage/) — GitHub's current design-system guidance for base, functional, component, neutral, semantic, emphasis, and color-mode tokens.
- **[S2]** [@primer/primitives 11.9.0 — generated dark theme CSS](https://unpkg.com/@primer/primitives@11.9.0/dist/css/functional/themes/dark.css) — current published values for dark-default canvas, foreground, border, control, focus, selection, semantic, and `diffBlob` roles on the research date.
- **[S3]** [Primer primitives — `diffBlob.json5`](https://github.com/primer/primitives/blob/main/src/tokens/component/diffBlob.json5) — canonical component-token relationships and dark/high-contrast overrides for addition, deletion, hunk, empty, and expander states.
- **[S4]** [GitHub Docs — Reviewing proposed changes in a pull request](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/reviewing-proposed-changes-in-a-pull-request) — current Files changed structure, split/unified setting, file tree/filter, hover plus comment affordance, inline comment field, and forge-specific mechanics that remain out of scope.
- **[S5]** [Primer — Typography](https://primer.style/product/getting-started/foundations/typography/) — current system typography, rem sizing, unitless line height, and 4 px alignment guidance.
- **[S6]** [W3C WCAG 2.2 Understanding 1.4.1 — Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) — color must not be the only visible means of conveying meaning or state.
- **[S7]** [W3C WCAG 2.2 Understanding 1.4.3 — Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) — 4.5:1 normal text and 3:1 large text thresholds.
- **[S8]** [W3C WCAG 2.2 Understanding 1.4.11 — Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) — 3:1 for meaningful control and state indicators.
- **[S9]** [W3C WCAG 2.2 Understanding 2.4.7 — Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) — keyboard-operated UI requires a visible focus indicator.
- **[S10]** [W3C WCAG 2.2 Understanding 1.4.10 — Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) — includes an explicit passing two-column code/document comparison example and limits the two-dimensional exception to the relevant content region.
- **[S11]** [W3C WCAG 2.2 Understanding 2.5.8 — Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) — 24 × 24 CSS px target or spacing requirement.
- **[S12]** [Monaco Editor 0.55.1 type definitions](https://unpkg.com/monaco-editor@0.55.1/monaco.d.ts) — version used by this project; documents `defineTheme`, accessibility options, `renderSideBySide`, and narrow inline-breakpoint options.
- **[S13]** [Visual Studio Code — Theme Color reference](https://code.visualstudio.com/api/references/theme-color#diff-editor-colors) — current official editor/diff color IDs for inserted/removed text and lines, gutters, line numbers, selection, borders, and unchanged regions; page metadata dated 2026-07-15.

### Authoritative local sources

- `.planning/PROJECT.md` — v1.1 goal, active requirements, preserved stack/behavior, and explicit out-of-scope mechanics.
- `src/web/App.vue` — current changed-files/diff/review-rail information architecture and drawer behavior.
- `src/web/styles.css` — current light workbench overrides, state styles, 640 px diff minimum, and responsive rules.
- `src/web/components/DiffWorkspace.vue` — existing base/head labels, plus comment affordance, Monaco host, context help, and view-zone comments.
- `src/web/monaco/diff-adapter.ts` — current side-by-side editor, accessibility label, line/gutter integration, view zones, and `renderSideBySideInlineBreakpoint: 0`.
- `package.json` — Vue 3.5.39 and Monaco 0.55.1 are retained; no stack change is recommended.

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| GitHub/Primer palette and diff semantics | MEDIUM | Current official Primer guidance, canonical token source, and published 11.9.0 CSS agree; provider classification remains MEDIUM. |
| GitHub Files changed structure | MEDIUM | Current GitHub documentation confirms the interaction and structural conventions, but live production spacing and responsive details can change without a versioned visual specification. |
| Accessibility requirements | MEDIUM | Current W3C WCAG 2.2 recommendation and updated Understanding documents are explicit, including a side-by-side code comparison example; provider classification remains MEDIUM. |
| Monaco feasibility | MEDIUM | The project-pinned 0.55.1 type definitions and current official color reference expose the required theme and layout controls; provider classification remains MEDIUM. |
| Overall feature recommendation | MEDIUM | The sources strongly support the semantic contract; exact visual tuning still requires implementation-time observation across composited Monaco states and real narrow layouts. |

[S1]: https://primer.style/product/getting-started/foundations/color-usage/
[S2]: https://unpkg.com/@primer/primitives@11.9.0/dist/css/functional/themes/dark.css
[S3]: https://github.com/primer/primitives/blob/main/src/tokens/component/diffBlob.json5
[S4]: https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/reviewing-proposed-changes-in-a-pull-request
[S5]: https://primer.style/product/getting-started/foundations/typography/
[S6]: https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
[S7]: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
[S8]: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
[S9]: https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html
[S10]: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
[S11]: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
[S12]: https://unpkg.com/monaco-editor@0.55.1/monaco.d.ts
[S13]: https://code.visualstudio.com/api/references/theme-color#diff-editor-colors
[S6-S11]: https://www.w3.org/TR/WCAG22/

---
*Feature research for: Diff Review v1.1 GitHub Dark Diff*
*Researched: 2026-07-24*
