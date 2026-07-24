# Pitfalls Research

**Domain:** Brownfield GitHub dark-default diff restyle for a Vue 3 and Monaco code-review workspace
**Researched:** 2026-07-24
**Confidence:** HIGH

## Scope and Likely Roadmap Phases

This milestone is a presentation cutover, not a new review product. The risks below assume the validated v1.0 information architecture and review behavior remain authoritative.

1. **Semantic palette foundation** — replace the current light palette and legacy aliases with one dark-only, role-based token contract.
2. **Monaco diff integration** — theme Monaco, its diff layers, gutters, selections, diagnostics, and Vue-owned view zones as one visual system.
3. **Review workspace states** — restyle the file header/tree, controls, comments rail, inline composer, notices, disabled/pending states, recovery, and export surfaces.
4. **Responsive and accessibility hardening** — verify contrast, keyboard focus, non-color cues, forced colors, zoom, and narrow layouts.
5. **Visual and behavioral regression gate** — stabilize a small screenshot matrix and prove that existing review mechanics did not drift.

## Critical Pitfalls

### Pitfall 1: Appending a third palette instead of making a clean semantic cutover

**What goes wrong:**
The page looks dark in the common path, but old light values leak into drawers, recovery screens, inline notices, export receipts, or Monaco-owned UI. Fixes accumulate as selector-specific overrides and `!important`, making state combinations unpredictable.

**Why it happens:**
`src/web/styles.css` already contains two palette eras. The initial `:root` declares GitHub-like dark values, while the Phase 2 `:root` around line 970 replaces them with the current warm light palette and maps legacy `--color-*` aliases onto it. Adding another late override would preserve both vocabularies and rely on cascade order rather than a clear contract.

**How to avoid:**
Inventory every color role before changing values. Define one dark-only semantic layer for canvas, elevated/subtle surfaces, default/muted/on-emphasis text, borders, focus, selection, diff insertion/deletion at line and token level, comments, warning, error, disabled, and overlay/shadow. Migrate all existing aliases and components to those roles in the same phase; delete obsolete palette declarations rather than stacking overrides. Primer explicitly recommends functional or component tokens instead of raw base colors and pairs foreground/background roles across modes ([Primer color usage](https://primer.style/product/getting-started/foundations/color-usage/)).

**Warning signs:**
- More than one `:root` block owns color values.
- The same semantic role has both `--color-*` and short aliases such as `--surface` or `--rule`.
- New raw hex values appear outside the palette/theme definition.
- A component is correct only because its rule occurs later in the file.
- Recovery, conflict, empty, unsupported, or export states still show light surfaces.

**Phase to address:**
Phase 1 — Semantic palette foundation.

---

### Pitfall 2: Semantic collisions make different states visually indistinguishable

**What goes wrong:**
A deletion looks like an application error; an addition looks like a successful save; selected rows, focus, links, active controls, and inline-comment anchors all compete for the same blue. Users cannot tell whether color describes code provenance, review status, system health, or current interaction.

**Why it happens:**
The current stylesheet aliases destructive/error/deletion-adjacent reds and uses the accent color for selection, focus, links, buttons, and comment borders. A literal GitHub palette copy makes the problem worse if colors are copied by appearance rather than assigned by meaning. Primer reserves roles such as accent, success, attention, and danger for distinct semantics ([Primer color roles](https://primer.style/product/getting-started/foundations/color-usage/#color-roles)); diff provenance needs dedicated roles, not reuse of application outcome roles.

**How to avoid:**
Create separate tokens for `diff-added-*`, `diff-deleted-*`, `selection-*`, `comment-*`, `focus-*`, `warning-*`, `error-*`, and `disabled-*`. Permit similar hues only when another cue distinguishes the state. Preserve visible labels already present in the app—Base/Head, Open/Resolved, Verified/Stale/Anchor unavailable, warning/error headings, status badges, and `+`/`−` counts. Build a state matrix that places colliding states side by side: selected deleted file with an error notice, focused added line with a comment anchor, disabled destructive action, and stale comment in the review rail.

**Warning signs:**
- One token is referenced by deletion, error, and destructive-action selectors.
- Focus is indicated only by the same blue background used for selected rows.
- Comment borders disappear on selected or changed lines.
- A screenshot can only be interpreted by knowing where the element is located.

**Phase to address:**
Phase 1 establishes distinct roles; Phase 3 verifies their use across review states.

---

### Pitfall 3: The surrounding app becomes dark while Monaco remains a separate or mismatched theme

**What goes wrong:**
Monaco stays light, uses generic `vs-dark` colors that do not match the workspace, or shows token foregrounds with poor contrast on custom diff backgrounds. Gutters, hidden-region controls, line numbers, scrollbars, widgets, and overview rulers expose a second visual system.

**Why it happens:**
`src/web/monaco/diff-adapter.ts` creates the diff editor without a `theme` option, and `src/web/monaco/configure.ts` configures workers and languages but no theme. Monaco owns tokenization and many internal surfaces; CSS variables on the Vue shell do not theme those internals. Replacing only `.monaco-editor` background CSS bypasses Monaco's color registry.

**How to avoid:**
Define the theme once before editor creation, base it on `vs-dark`, and keep `inherit: true` so Monaco's language token rules remain complete. Apply it at `createDiffEditor`. Explicitly map at least editor foreground/background, line numbers, cursor, line highlight, selection and inactive selection, focus border, widget/input surfaces, diff inserted/removed line and inline-text backgrounds, diff gutters/overview, editor border, unchanged regions, and diagnostic colors. Monaco's official example documents `defineTheme`, inherited token rules, named editor colors, and applying the theme at creation or with `setTheme` ([Monaco theme example](https://github.com/microsoft/monaco-editor/blob/main/website/src/website/data/playground-samples/customizing-the-appearence/tokens-and-colors/sample.js)). Version 0.55.1 registers distinct diff line, inline-text, gutter, overview, border, and unchanged-region keys ([Monaco editor color registrations](https://github.com/microsoft/vscode/blob/main/src/vs/platform/theme/common/colors/editorColors.ts)).

**Warning signs:**
- The app palette changes but no `monaco.editor.defineTheme` exists.
- HTML/CSS is used to force Monaco backgrounds directly.
- TypeScript looks acceptable but JSON, CSS, Markdown, shell, or plaintext fixtures do not.
- Hidden unchanged regions or Monaco popovers retain light defaults.
- Theme setup runs on every file switch.

**Phase to address:**
Phase 2 — Monaco diff integration.

---

### Pitfall 4: Selection, current-line, and anchor overlays erase the diff

**What goes wrong:**
Selecting text or focusing a line makes green/red change provenance disappear. Inactive selection becomes invisible after focus moves into the inline comment textarea. The custom `.monaco-anchor-line` decoration hides either the change background or the selection. Reviewers lose the evidence needed to place a precise comment.

**Why it happens:**
A diff line can simultaneously carry a line background, an inline changed-text background, a current-line highlight, active or inactive selection, a hover/comment affordance, and the whole-line anchor decoration created in `diff-adapter.ts`. Opaque or overly saturated layers win by paint order. Monaco's own color registrations explicitly require inserted/removed text and line backgrounds to be non-opaque so they do not hide underlying decorations ([Monaco diff color source](https://github.com/microsoft/vscode/blob/main/src/vs/platform/theme/common/colors/editorColors.ts)).

**How to avoid:**
Design the layers together, using controlled alpha for area fills and borders/gutter indicators for durable provenance. Measure final composited text contrast, not just token-versus-canvas pairs. Define both active and inactive selection. Give the anchored line a cue that does not replace the diff fill—for example, an edge or gutter marker. Verify the cross-product of unchanged/added/deleted × active selection/inactive selection × base/head × anchored/unanchored, including partial-token changes.

**Warning signs:**
- An added or deleted line becomes a uniform blue rectangle when selected.
- Selection vanishes when the comment composer receives focus.
- `.monaco-anchor-line` sets an opaque background.
- Reviewers must deselect text to tell whether it was added or removed.
- Contrast was measured only against the base canvas, not layered backgrounds.

**Phase to address:**
Phase 2 — Monaco diff integration, with acceptance checks repeated in Phase 4.

---

### Pitfall 5: Comments, diagnostics, and review failures collapse into the same visual language

**What goes wrong:**
A saved inline comment, an unsaved composer, a stale anchor, a Monaco diagnostic, a draft conflict, and a persistence error are all represented by similar borders or red/yellow accents. Diagnostic squiggles disappear on deleted lines, or comment cards become unreadable inside Monaco view zones.

**Why it happens:**
Vue renders the inline composer and accepted comment inside a Monaco view zone, while Monaco paints syntax, diff, and potential diagnostics beneath it. The app also uses inline notices for warning/error states and text labels for verified/stale/orphaned comments. Treating all annotations as one “highlight” ignores ownership, severity, and lifecycle.

**How to avoid:**
Keep separate contracts: comments use a neutral/comment surface plus explicit Saved/Open/Resolved/Unsaved text; stale/orphaned anchors keep their existing textual status; application warnings and errors use icon/text/heading plus semantic border; diagnostics retain Monaco's wavy underline or marker shape with colors that remain visible over both diff backgrounds. Theme the Vue-owned view-zone DOM with app tokens, including textarea, confirmation region, disabled/pending controls, alerts, and spacer transparency. Check content growth and focus after zone height recalculation; do not change the adapter's paired-zone lifecycle to solve a color problem.

**Warning signs:**
- The only difference between a saved comment and an error is hue.
- A diagnostic underline is invisible on removed text.
- The view-zone composer has a light textarea or browser-default control.
- Moving focus into the composer removes all indication of its source line.
- Styling changes `z-index`, view-zone height, or pointer behavior without a demonstrated need.

**Phase to address:**
Phase 2 for Monaco/view-zone integration; Phase 3 for the complete comment, notice, and lifecycle state matrix.

---

### Pitfall 6: Low-contrast “GitHub-like” subtlety fails measurable accessibility

**What goes wrong:**
Muted file paths, line numbers, metadata, disabled text, borders, placeholder text, tooltip text, and text on tinted diff lines become hard to read. A palette may look authentic on one display while falling below thresholds after alpha compositing.

**Why it happens:**
Dark interfaces often create hierarchy by reducing luminance contrast. Copying a screenshot, using alpha without calculating the result, or checking only primary text misses dozens of state/background pairs. WCAG 2.2 requires at least 4.5:1 for normal text and 3:1 for large text; meaningful control/state cues require 3:1 against adjacent colors. Thresholds are not rounded ([WCAG 1.4.3 Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [WCAG 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)).

**How to avoid:**
Maintain a contrast ledger for every semantic foreground/background pair and for composited diff, selection, hover, and notice layers. Use computed CSS colors at runtime for verification. Target 4.5:1 for all ordinary text, including 12px labels and Monaco line numbers; target 3:1 for meaningful borders, focus indicators, selected-state markers, and icons. Disabled controls are exempt from those WCAG contrast criteria, but keep them legible enough to identify and distinguish from enabled controls through more than opacity alone. Exceed minimums for thin monospace text because antialiasing can reduce perceived contrast.

**Warning signs:**
- Muted text is approved by eye only.
- Alpha colors are checked as raw hex rather than composited values.
- Text passes on the canvas but fails on added/deleted/selected/hover surfaces.
- Borders disappear between adjacent dark surfaces.
- Disabled controls look like missing controls.

**Phase to address:**
Phase 1 defines verified pairs; Phase 4 performs the full state/background audit.

---

### Pitfall 7: Focus is technically present but clipped, obscured, or confused with selection

**What goes wrong:**
Keyboard focus disappears inside overflow-hidden panes, Monaco, transformed drawers, or dark controls. The global outline is clipped at pane edges, covered by an overlay, or indistinguishable from the selected-row accent. A focused gutter `+` or drawer control cannot be located.

**Why it happens:**
The stylesheet has a global `:focus-visible` outline, but the review shell, file pane, comments rail, Monaco host, and narrow-layout drawers use overflow, positioning, transforms, and z-index. Monaco also owns its internal focus visuals. One global color and positive outline offset is not sufficient across all these boundaries.

**How to avoid:**
Audit the real tab order and every programmatic focus transfer already used by comments, errors, drawers, and recovery. Keep focus distinct from selected/active state. Use a two-color or locally inset indicator where an outer outline can clip, and theme Monaco focus keys separately. WCAG 2.2 AA requires a visible focus indicator ([WCAG 2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)); use the AAA Focus Appearance dimensions as a robust design target: an area at least equivalent to a 2 CSS-pixel perimeter with a 3:1 focused-versus-unfocused change ([WCAG 2.4.13 Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)). Verify focus remains visible when drawers overlap the workspace and when the inline composer takes focus away from Monaco.

**Warning signs:**
- Focus and selected row use the same single cue.
- `outline: none` appears without a replacement.
- The outline is cut off at the first/last item in a scroll pane.
- Pointer hover looks stronger than keyboard focus.
- Focused controls are underneath fixed narrow-layout notices or drawers.

**Phase to address:**
Phase 3 styles component states; Phase 4 completes keyboard and obscuration verification.

---

### Pitfall 8: Additions, deletions, availability, and comment state rely on color alone

**What goes wrong:**
Users with color-vision deficiency or forced colors cannot distinguish added from deleted content, open from resolved comments, warning from error, selected from unselected files, or unavailable from unsupported files.

**Why it happens:**
Dark diff designs are strongly associated with green and red fills, so existing text, shapes, line indicators, borders, and ARIA state can be accidentally removed as “visual noise.” WCAG 2.2 states that color cannot be the only visual means of conveying information or state ([WCAG 1.4.1 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)).

**How to avoid:**
Retain and strengthen non-color cues already present: Base/Head headings, `+` and `−` counts, letter/status badges, selected-row edge, unsupported/unavailable marker shapes and text, Open/Resolved and Verified/Stale/Anchor unavailable labels, notice headings, disabled semantics, and explicit button labels. Monaco diff indicators/gutters and side position should remain visible even when fills are removed. Review in grayscale and with green/red color-vision simulation; the task and state must remain understandable without naming colors.

**Warning signs:**
- Removing fills makes added and deleted lines identical.
- Selected file is communicated only by background hue.
- Status badges become unlabeled dots.
- Error and warning notices use identical copy and differ only by border color.
- A design review describes states as “the red one” or “the green one.”

**Phase to address:**
Phase 3 preserves state cues; Phase 4 verifies grayscale, simulation, and assistive semantics.

---

### Pitfall 9: Forced-colors and unsupported high-contrast states erase custom semantics

**What goes wrong:**
Windows High Contrast/forced-colors removes diff fills, shadows, or the selected-row inset shadow, leaving no indication of changes or open drawers. Conversely, a blanket `forced-color-adjust: none` preserves the brand palette but defeats the user's required contrast settings. Browsers without the relevant media behavior receive no useful fallback.

**Why it happens:**
In forced-colors mode, user agents replace author foreground, background, border, and outline colors at paint time and can suppress shadows. MDN advises targeted fixes rather than a separate wholesale design ([MDN `forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors)). `forced-color-adjust` defaults to `auto`; opting out should support, not override, the user's contrast needs ([MDN `forced-color-adjust`](https://developer.mozilla.org/en-US/docs/Web/CSS/forced-color-adjust)). The CSS Color Adjustment specification also recommends pairing both foreground and background rather than assuming author colors guarantee contrast ([CSS Color Adjustment Level 1](https://www.w3.org/TR/css-color-adjust-1/)).

**How to avoid:**
Keep `forced-color-adjust: auto` by default. Add a small `@media (forced-colors: active)` layer using system colors and durable borders/outlines/text markers for selected files, diff additions/deletions, focus, comments, and notices. Replace shadow-only boundaries in this mode. Do not depend on forced-colors support for baseline accessibility: the default dark palette and non-color cues must stand on their own. Verify with a real Windows High Contrast configuration where possible and with browser emulation as a supplement.

**Warning signs:**
- `forced-color-adjust: none` is applied to the app or Monaco root.
- Selected state depends on `box-shadow` only.
- All diff fills disappear and no gutter/border/text cue remains.
- The focus ring uses a hard-coded color that the user agent replaces into the background.
- High-contrast support is declared complete after only a CSS media emulation screenshot.

**Phase to address:**
Phase 4 — Responsive and accessibility hardening.

---

### Pitfall 10: Narrow-layout polish accidentally turns the whole page into a 640px canvas

**What goes wrong:**
At mobile widths or high browser zoom, the toolbar, comments rail, file drawer, alerts, and review controls require two-dimensional page scrolling or become obscured. The side-by-side diff may remain usable, but unrelated UI inherits its fixed width.

**Why it happens:**
The current CSS deliberately keeps `.diff-workspace` and `.review-main` at a 640px minimum, sets `.review-main` to 640px below 768px, and displays a “Widen the window” notice. That is defensible for side-by-side code, but the exception must be scoped. WCAG Reflow expects content at 320 CSS px without loss or page-wide two-dimensional scrolling; its guidance explicitly uses a two-column diff as an allowed separately scrollable comparison when each column fits in a 320px container ([WCAG 1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html#two-column-presentation-of-editing-changes)).

**How to avoid:**
Keep horizontal scrolling local to the code comparison, not the whole review shell. Ensure toolbar groups wrap without covering content; file/comments drawers fit the viewport, scroll internally, and can be dismissed; comment cards, alerts, recovery, and export content reflow to 320 CSS px; long paths and object IDs wrap or expose full values without widening the page. Verify desktop breakpoints around 1440/1100/768, a 320px viewport, and 400% zoom from a 1280px starting viewport. Test open and closed drawers, inline composer, keyboard focus, long paths, conflict notices, and export receipts—not just an empty diff.

**Warning signs:**
- The browser page itself scrolls horizontally because `.review-main` is 640px.
- A fixed notice covers a focused control.
- Drawer width is calculated from the viewport but its padding/border still overflows.
- Toolbar actions disappear rather than wrap or scroll locally.
- The diff exception is used to excuse non-diff panels.

**Phase to address:**
Phase 4 — Responsive and accessibility hardening.

---

### Pitfall 11: Screenshot coverage becomes brittle while behavior coverage weakens

**What goes wrong:**
Large full-page golden images fail because of font rasterization, Monaco timing, cursor blinking, scrollbars, host OS, or browser differences. Teams raise pixel thresholds or update baselines blindly, allowing real regressions through. Alternatively, screenshots replace assertions for commenting and navigation behavior.

**Why it happens:**
The existing suite has behavioral Playwright coverage but no `toHaveScreenshot` use. A visual milestone invites broad snapshots. Playwright warns that rendering varies with host OS, version, settings, hardware, power source, headless mode, browser, platform, and fonts, and recommends generating/comparing baselines in the same environment ([Playwright visual comparisons](https://playwright.dev/docs/test-snapshots)). Monaco also updates asynchronously.

**How to avoid:**
Add only a curated visual matrix after the UI is stable: representative desktop and narrow shells; changed lines with selection/focus/comment; review rail states; warning/error/disabled; forced-colors supplement. Pin the CI browser/OS/container, viewport, device scale, font availability, data, scroll position, reduced motion, hover/focus state, and Monaco diff readiness. Mask truly nondeterministic content rather than increasing a global tolerance. Keep semantic and behavior assertions as the primary contract; screenshots supplement them.

**Warning signs:**
- A single full-page snapshot tries to cover every state.
- Baselines are generated on arbitrary developer machines.
- Tests capture before Monaco's diff-ready signal.
- Cursor, spinner, animation, or system scrollbar pixels dominate diffs.
- A high `maxDiffPixels` is used to silence recurring noise.
- Snapshot updates are approved without inspecting changed regions.

**Phase to address:**
Phase 5 — Visual and behavioral regression gate.

---

### Pitfall 12: A “restyle” silently changes validated review mechanics

**What goes wrong:**
File selection, context expansion, keyboard navigation, line anchoring, composer focus, discard/move confirmation, async settlement, drawer dismissal, comment lifecycle, draft conflict recovery, or export readiness changes while the screens are being rearranged.

**Why it happens:**
Presentation and behavior are coupled at several brownfield seams. `DiffWorkspace.vue` queries specific view-zone classes, moves focus after Vue render, calculates zone height, and exposes adapter commands. `diff-adapter.ts` listens for focus/cursor/mouse/scroll events and preserves per-file state. Responsive drawers and comments use existing DOM order, ARIA relationships, focus restoration, transitions, and z-index. “Cleaning up” markup or Monaco options during styling expands the milestone beyond its stated contract.

**How to avoid:**
Set a hard invariant: no new review mechanics and no state-model/API/schema changes. Prefer token and CSS changes; when markup must change for accessibility, preserve emitted events, refs, queried class hooks, ARIA names/relationships, DOM focus targets, adapter options, view-zone ownership, and command ordering. Keep a before/after behavior checklist covering file switching, previous/next change, context reveal, both-side comments, unsaved composer move/discard, edit/delete/resolve/reopen, stale/orphaned comments, conflicts, keyboard help, narrow drawers, summary, and export. Visual snapshots never substitute for these behaviors.

**Warning signs:**
- Changes touch workspace state, API contracts, persistence, or export code.
- A class queried from TypeScript is renamed as “CSS cleanup.”
- `renderSideBySide`, hidden-region, read-only, focus, or view-zone options change to improve appearance.
- Buttons are removed from the DOM instead of being responsively arranged.
- A new interaction is introduced to compensate for inaccessible styling.
- Existing behavior tests need rewritten expectations unrelated to appearance.

**Phase to address:**
Every implementation phase enforces the invariant; Phase 5 provides the final regression gate.

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Add a late `:root` override | Fast dark screenshot | Three palette eras, cascade leaks, hard-to-audit contrast | Never |
| Paste GitHub raw hex values into component rules | Close visual match locally | No semantic ownership; impossible state-wide tuning | Never |
| Reuse success/danger for added/deleted | Fewer tokens | Diff provenance collides with save/error outcomes | Never |
| Force Monaco internals with broad CSS selectors | Quick surface match | Breaks across Monaco updates and misses registered colors | Never; use Monaco theme keys |
| Set opaque diff/selection backgrounds | Stronger color | Hides text, diagnostics, selections, and decorations | Never |
| Apply `forced-color-adjust: none` globally | Preserves screenshots | Defeats user contrast choices | Never |
| Hide controls at narrow widths | Removes overflow | Loss of validated functionality and keyboard access | Never |
| Add visual snapshots with broad tolerances | Fast “coverage” | Noisy CI and blind baseline updates | Only a temporary local experiment, never a release gate |
| Retain the initial dark palette as dead “fallback” code | Avoids deletion | Future maintainers cannot tell which tokens are authoritative | Never after cutover |

## Integration Gotchas

Common mistakes at the boundaries this milestone touches.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Global CSS ↔ legacy Phase 1/2 components | Assuming changing the newest aliases reaches every selector | Inventory raw colors and both token vocabularies; migrate and delete obsolete declarations |
| Vue shell ↔ Monaco | Styling Monaco DOM from app CSS | Register one inherited `vs-dark` theme and use documented color keys |
| Monaco diff ↔ selection/diagnostics | Choosing each color independently | Validate composited layers and preserve non-opaque diff fills |
| Monaco view zones ↔ Vue comments | Treating composer DOM as ordinary page content | Theme it with app tokens while preserving paired-zone sizing, focus, and lifecycle |
| Browser forced colors ↔ custom palette | Opting out to protect brand colors | Respect `auto`; add targeted system-color borders and text cues |
| Responsive shell ↔ fixed-width diff | Letting the 640px code surface widen the whole page | Give the diff a local scroll container; reflow surrounding controls and prose |
| Playwright ↔ Monaco rendering | Capturing immediately after navigation | Wait on the existing diff-ready behavior and stabilize environment/state |
| Dark form controls ↔ browser UI | Styling backgrounds but not native control scheme | Declare dark color scheme and verify inputs, scrollbars, autofill, and focus in supported browsers |

## Performance Traps

Patterns that work in a small fixture but degrade real reviews.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Redefining or switching Monaco themes on each file/state change | Flicker, repeated editor repaint, lost screenshot stability | Define once before editor creation; express interaction states with registered colors/decorations | Rapid file navigation and large diffs |
| Heavy shadows/transparency on every scrolling row or diff line | Scroll jank and muddy compositing | Prefer flat fills and borders; reserve shadows for true overlays | Large files and long file trees on integrated GPUs |
| Runtime contrast/color calculation per rendered line | CPU work during scroll and diff updates | Precompute semantic token pairs; audit them outside render loops | Thousands of visible lines |
| Screenshot matrix explosion | Slow, noisy CI and expensive baseline maintenance | Cover representative state boundaries, not every permutation; keep behavior tests separate | Cross-browser × viewport × state combinations |
| Web-font introduction for visual fidelity | Layout shift, offline failure, divergent glyph rasterization | Keep the existing system/local font strategy and explicitly test fallbacks | Packaged local-first use and heterogeneous hosts |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Copying GitHub CSS with remote fonts, images, or asset URLs | A local-only review can make network requests that expose use/repository timing and fail offline | Ship no remote visual dependencies; use local CSS, system fonts, and bundled assets only |
| Replacing text/status markup with externally sourced SVG/HTML snippets | Introduces unnecessary sanitization and supply-chain surface | Use existing Vue text, CSS shapes, and reviewed bundled icons |
| Altering capability/API behavior to obtain richer UI state | Expands a presentation milestone into a security-sensitive server change | Derive styling from existing validated client state; no new endpoints or authority |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Pixel-copying GitHub rather than adapting semantics | Diff Review loses identity and states do not map cleanly | Match hierarchy and role, not every raw value or control |
| Excessively low-contrast muted chrome | Paths, counts, and context controls become invisible | Keep hierarchy through spacing/weight while meeting contrast |
| Saturated red/green over large code areas | Eye fatigue and syntax-token clashes | Use restrained translucent line fills plus stronger gutter/inline cues |
| Focus equals selection | Keyboard users cannot locate operation target | Separate focus outline from persistent selected state |
| Comments look like diff changes | Review feedback is confused with source provenance | Use neutral/comment surfaces and explicit lifecycle text |
| Narrow view only says “widen window” | Review becomes practically unusable under zoom | Preserve local diff scrolling and make all surrounding functionality fit |
| Restyling only the happy path | Errors and recovery feel broken or revert to light UI | Include conflict, stale/orphaned, unsupported, recovery, and export states in the palette matrix |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Palette cutover:** Only one semantic palette is authoritative; no light surfaces or obsolete root overrides remain.
- [ ] **Contrast:** Normal text meets 4.5:1 and meaningful non-text state cues meet 3:1 on every actual layered background.
- [ ] **Monaco:** Syntax tokens, line numbers, gutters, hidden-region controls, widgets, scrollbars, additions, deletions, and unchanged regions share the dark system.
- [ ] **Layering:** Active/inactive selection, current line, anchor decoration, diagnostics, and added/deleted fills remain simultaneously legible.
- [ ] **Comments:** Saved, unsaved, pending, failed, stale, orphaned, open, and resolved states remain distinguishable without color alone.
- [ ] **Focus:** Every keyboard target has visible, unclipped focus in the shell, drawers, rail, composer, and Monaco.
- [ ] **Forced colors:** The UI remains understandable with author fills/shadows replaced; no blanket opt-out defeats user choices.
- [ ] **Responsive:** The diff scrolls locally while toolbar, drawers, notices, comments, recovery, and export content work at 320 CSS px and 400% zoom.
- [ ] **Long content:** Paths, object IDs, comments, and diagnostic/error copy do not widen or escape panels.
- [ ] **Visual regression:** Baselines use a pinned environment and stable Monaco state; tolerances are narrow and reviewed.
- [ ] **Behavior preservation:** All existing navigation, comment, draft, conflict, drawer, and export flows behave exactly as before.
- [ ] **Local-first packaging:** No remote font, image, stylesheet, or runtime theme dependency was introduced.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Cascade/palette leak | MEDIUM | Stop adding overrides; inventory computed colors, consolidate tokens, migrate remaining selectors, delete obsolete roots |
| Monaco mismatch | MEDIUM | Remove DOM overrides, define one `vs-dark` inherited theme, map all documented diff/editor keys, recheck language fixtures |
| Selection hides changes | MEDIUM | Rebuild the layer matrix, reduce fill opacity, add durable borders/gutter cues, verify active and inactive selection |
| Contrast failure late in milestone | MEDIUM | Fix semantic pairs centrally, then re-audit every component using those roles; avoid one-off selector colors |
| Forced-colors failure | LOW–MEDIUM | Restore `forced-color-adjust:auto`, replace shadow-only cues, add targeted system-color borders/text under the media query |
| Responsive page-wide overflow | HIGH | Isolate the diff in its own scroll container, remove inherited 640px constraints from surrounding shell, re-test drawer/focus behavior |
| Brittle screenshots | LOW | Delete noisy baselines, pin environment and state, shrink to representative component/region captures, keep semantic assertions |
| Behavior drift | HIGH | Revert structural/adapter/state changes, reapply the visual change through tokens/CSS, then re-run the preserved behavior contract |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Multiple palette eras and cascade leaks | Phase 1: Semantic palette foundation | One token source; raw-color inventory; all exceptional states inspected |
| Semantic state collisions | Phase 1, completed in Phase 3 | Side-by-side state matrix understandable in grayscale |
| Monaco/app theme mismatch | Phase 2: Monaco diff integration | Language fixture matrix plus all Monaco-owned surfaces inspected |
| Selection obscures diff | Phase 2 | Added/deleted/unchanged × active/inactive selection × anchor/diagnostic matrix |
| Comment/diagnostic/failure collision | Phases 2–3 | Inline and rail lifecycle states remain distinct over both diff sides |
| Text and non-text contrast | Phase 4: Responsive/accessibility hardening | Computed contrast ledger: 4.5:1 text, 3:1 meaningful UI/state cues |
| Focus clipped or confused | Phase 4 | Full keyboard traversal at desktop/narrow/zoom with visible focus at every stop |
| Color-only meaning | Phase 4 | Grayscale and color-vision simulation preserve all task/state distinctions |
| Forced-colors failure | Phase 4 | Real Windows High Contrast when available, plus browser emulation and no-feature fallback review |
| Responsive regression | Phase 4 | 320px, 400% zoom, breakpoint-boundary, long-content, and open-drawer scenarios |
| Screenshot brittleness | Phase 5: Visual/behavioral regression gate | Pinned environment, stable Monaco readiness, small reviewed visual matrix |
| Accidental behavior drift | All phases; final in Phase 5 | Existing end-to-end review contract unchanged; screenshots remain supplemental |

## Sources

- [Diff Review `.planning/PROJECT.md`](../PROJECT.md) — milestone scope, validated behavior, constraints, and no-new-mechanics boundary.
- [Current `src/web/styles.css`](../../src/web/styles.css) — two palette eras, legacy aliases, review shell, 640px diff constraints, comments, notices, and responsive drawers.
- [Current Monaco adapter](../../src/web/monaco/diff-adapter.ts) — editor options, focus/cursor listeners, whole-line anchor decoration, paired view zones, and per-file state.
- [Current Monaco configuration](../../src/web/monaco/configure.ts) — language workers and path mapping, with no theme registration.
- [Current DiffWorkspace](../../src/web/components/DiffWorkspace.vue) — Vue rendering/focus/height lifecycle inside Monaco view zones.
- [W3C WCAG 2.2: Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) — 4.5:1 normal text and 3:1 large text thresholds.
- [W3C WCAG 2.2: Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) — 3:1 meaningful control and state cues.
- [W3C WCAG 2.2: Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) — color cannot be the only visual means of conveying information or state.
- [W3C WCAG 2.2: Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) and [Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) — visible focus requirement and measurable 2px/3:1 enhanced target.
- [W3C WCAG 2.2: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) — 320 CSS px requirement and explicit two-column diff guidance.
- [CSS Color Adjustment Module Level 1](https://www.w3.org/TR/css-color-adjust-1/) — browser/user color-scheme negotiation and automatic color adjustment.
- [MDN `forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors) and [`forced-color-adjust`](https://developer.mozilla.org/en-US/docs/Web/CSS/forced-color-adjust) — forced property behavior, shadow loss, system colors, and targeted opt-out guidance.
- [Primer color usage](https://primer.style/product/getting-started/foundations/color-usage/) and [Primer functional color tokens](https://github.com/primer/primitives/tree/main/src/tokens/functional/color) — functional/component token hierarchy and semantic role separation.
- [Monaco custom theme example](https://github.com/microsoft/monaco-editor/blob/main/website/src/website/data/playground-samples/customizing-the-appearence/tokens-and-colors/sample.js) — inherited themes and named editor colors.
- [Monaco/VS Code editor color registrations](https://github.com/microsoft/vscode/blob/main/src/vs/platform/theme/common/colors/editorColors.ts) — diff, selection, diagnostic, and opacity requirements used by Monaco 0.55.1.
- [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots) — environment-dependent rendering and consistent-baseline guidance.

---
*Pitfalls research for: Diff Review v1.1 GitHub Dark Diff*
*Researched: 2026-07-24*
