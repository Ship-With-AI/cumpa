# Phase 01 — UI Review

**Audited:** 2026-07-20  
**Baseline:** `.planning/phases/01-pinned-local-comparison/01-UI-SPEC.md` (verified design contract)  
**Audit mode:** Source review plus focused packaged Playwright interaction/computed-style evidence  
**Screenshots:** Not captured. No server responded on `127.0.0.1:3000`, `:5173`, or `:8080`; `.planning/ui-reviews/` did not exist, and this assignment permits creating only this review artifact. No screenshot claim is made.  
**Registry:** Not applicable. `01-UI-SPEC.md` declares no registry, `shadcn_initialized: false`, and no `components.json` exists.

---

## Evidence Status

- **Observed source evidence:** Relevant `src/web/**` Vue components and `src/web/styles.css` were inspected against the UI-SPEC contract.
- **Observed automated evidence:** The following focused packaged Chromium checks were run during this audit and passed:
  - `npm run test:package -- tests/e2e/responsive-session.spec.ts --grep "responsive keyboard and accessibility contract"` — **1 passed**.
  - `npm run test:package -- tests/e2e/pinned-session.spec.ts --grep "identity session and empty states|metadata and availability states"` — **2 passed**.
  - `npm run test:package -- tests/e2e/file-tree.spec.ts` — **1 passed**.
- **Not observed:** No screenshots were captured, so composition quality, perceived density, visual polish, and the actual medium-width identity-panel overlap described below require human visual confirmation.
- **Evidence labels:** `needs_human_review: true` marks judgments that cannot be conclusively resolved from source and non-screenshot automation. `[INFERENCE]` marks a conclusion derived from CSS/layout mechanics rather than a directly observed screenshot.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | **3/4** | Required state copy is largely exact, but identity-copy failure text diverges from the contract and the visible action text is generically `Copy`. |
| 2. Visuals | **2/4** | Hierarchy is structurally strong, but the medium-width identity panel is fixed at `top: 72px` while the header may wrap taller, creating a likely overlap/obscured-heading defect. |
| 3. Color | **3/4** | The exact palette and contrast checks pass, but the focus-only token is reused as resting disclosure and copy-success color instead of the declared accent token. |
| 4. Typography | **3/4** | Declared headline/tree roles match exactly, but several body/control/value roles inherit browser `normal` line-height instead of the required 14px/1.43 role. |
| 5. Spacing | **3/4** | Layout and target dimensions mostly follow the 4px scale, but the status-badge inset uses an undeclared 2px spacing value. |
| 6. Experience Design | **3/4** | Keyboard, responsive, loading/error/empty/retry, and focus behavior are strong; copy feedback creates one live region per button instead of the single shared polite region required by the contract. |

**Overall: 17/24**

Score arithmetic: $3 + 2 + 3 + 3 + 3 + 3 = 17$.

---

## Strengths

1. **The immutable comparison is continuously legible.** `IdentityHeader.vue:15-18, 40-62` constructs the ordered base → head identity, retains short IDs, and keeps the pinned and dirty-byte cues visible. `IdentityPanel.vue:80-141` provides the ordered Base, Head, and Merge base details with full selectable IDs and endpoint-local worktree facts.
2. **State copy and hierarchy are unusually complete.** `App.vue:267-281, 352-385`, `ErrorState.vue:7-10`, and `FileMetadataPane.vue:25-54, 101-111, 164-262` cover loading, session unavailable, empty comparison, file-local failure, supported, unsupported, and unavailable states without introducing editor chrome.
3. **The information architecture follows the contract.** `App.vue:285-396` composes a persistent header, changed-file navigation, and primary file-details region. `FileTree.vue:123-165` provides the changed-file landmark and ARIA tree; `FileMetadataPane.vue:155-264` supplies the selected file `h2` and logically ordered metadata sections.
4. **Responsive and keyboard contracts have direct packaged evidence.** `responsive-session.spec.ts:519-665` verifies independent wide/medium scrolling, narrow tabs, focus movement, state preservation, modal containment, Escape behavior, and focus restoration. `responsive-session.spec.ts:670-760` verifies control states, 40px targets, 320px reflow, 200% zoom, text spacing, and orientation continuity.
5. **The palette is centralized and semantic states do not rely on color alone.** `styles.css:1-24` declares the complete contract palette and spacing tokens. `FileRow.vue:23-36, 57-70`, `StatusBadge.vue:6-25`, and `styles.css:416-504` pair status colors with visible letters, count text, availability words, and warning geometry.
6. **Type roles that are explicitly styled are disciplined.** `styles.css:101-116, 340-346, 416-426, 521-556` uses only 12/14/16/20px and weights 400/600. The packaged computed-style assertions in `responsive-session.spec.ts:420-510` confirm the principal roles, monospace assignment, palette values, and neutral-surface contrast.

---

## Prioritized Findings

| Priority | Severity | Pillar(s) | Finding | Evidence | needs_human_review |
|----------|----------|-----------|---------|----------|--------------------|
| P1 | **WARNING** | Visuals | At medium widths, the identity panel is positioned from the viewport shell with a fixed `top: 72px`, while the header is allowed to wrap into a taller second row. `[INFERENCE]` The panel heading/top edge can sit behind the higher-z-index header instead of opening below the disclosure as contracted. | `styles.css:91-98` gives the header `z-index: 3`; `styles.css:179-191` gives the panel `z-index: 2; top: 72px`; `styles.css:792-811` enables medium header wrapping and a 480px panel. The packaged medium check at `responsive-session.spec.ts:519-540` verifies pane width and visibility but does not open or measure the identity panel. | **true** |
| P2 | **WARNING** | Copywriting, Experience Design | Copy feedback is not one consistent contract. Identity copy failure says `Copy failed. The full value remains available to select.` instead of the required `Could not copy. Select the value and copy it manually.`; every `CopyButton` also owns a separate polite live region instead of using one shared region. | `CopyButton.vue:4-12, 47-58`; identity calls at `IdentityPanel.vue:88-132` do not override the default; metadata correctly overrides it at `FileMetadataPane.vue:203-207`. The packaged test explicitly observes the divergent identity text at `pinned-session.spec.ts:715-731`. | **false** |
| P3 | **WARNING** | Typography | The exact body/control line-height is not globally established. Several controls and metadata values inherit `line-height: normal` rather than the contract's 14px/1.43 role. | `styles.css:21-25` sets root family and size but no 1.43 line-height; controls use `font: inherit` at `styles.css:146-157, 714-726`; `.metadata-list dd` sets family but not line-height at `styles.css:599-603`. The packaged typography sample at `responsive-session.spec.ts:420-510` covers headings, a file row, and a badge, but not these controls/value rows. | **false** |
| P4 | **WARNING** | Color | The focus token is used as ordinary resting emphasis. The disclosure and copy-success text use `--color-focus` (`#58A6FF`) where the UI-SPEC reserves `--color-accent` (`#2F81F7`) for identity disclosure and copy success, leaving the focus token visually less exclusive. | Token declarations: `styles.css:2-13`; resting disclosure: `styles.css:161-162`; copy feedback: `styles.css:280-284`; actual focus ring: `styles.css:40-42, 381-385`. `responsive-session.spec.ts:420-510, 670-705` proves token values and control states, but not semantic token-role exclusivity. | **false** |
| P5 | **WARNING** | Spacing | Status badges use `padding: 2px var(--space-xs)`, introducing a 2px badge inset even though the contract's smallest spacing/badge-inset token is 4px and exceptions are explicitly disallowed. | `styles.css:14-20` declares 4/8/16/24/32/48/64px; `styles.css:416-426` applies the 2px vertical inset. Other observed major paddings, gaps, pane widths, 40px rows, and 40px controls follow the contract scale. | **false** |
| P6 | **WARNING** | Copywriting, Visuals | Every copy control displays only `Copy` while its specific action (`Copy full base commit`, `Copy exact old path`, and so on) exists only in `aria-label`. This remains accessible, but it weakens visual scan clarity and does not visibly reproduce the UI-SPEC's specifically named copy actions. | `CopyButton.vue:41-52` renders `Copy`/`Copied` while applying the specific name only through `aria-label`; callers provide the correct specific labels at `IdentityPanel.vue:88-132` and `FileMetadataPane.vue:117-131, 203-207`. | **true** |

No **BLOCKER** was found: the focused packaged flows completed, and the identified defects do not prevent selection, metadata inspection, copying under normal clipboard conditions, responsive navigation, or recovery.

---

## Top 3 Priority Fixes

1. **Anchor the identity panel below the actual disclosure/header rather than to a fixed 72px shell offset.** Put the desktop/medium panel in a positioning context whose `top: 100%` tracks the rendered header, or measure/anchor it to the disclosure. Preserve the required 520px wide and `min(480px, viewport − 32px)` medium widths, then add a 900px packaged assertion that opens the panel and proves its top edge/heading is below the header and fully visible.
2. **Unify copy feedback at the application level.** Use the exact failure text `Could not copy. Select the value and copy it manually.` for identity and path copy actions; expose the context-specific action text visibly where space permits; and replace per-button `role="status"` nodes with one shared polite live region that receives the active copy result while retaining button-local `Copied` visual feedback for two seconds.
3. **Complete the typography role contract.** Establish 14px/1.43/400 as the default body role, then let 600-weight controls inherit that line-height explicitly. Add computed-style assertions for identity disclosure, copy, retry, tab, back, metadata summary values, and mode/count values—not only headings, tree rows, and badges.

Secondary corrections:

- Use `--color-accent` for resting identity disclosure and copy-success emphasis; keep `--color-focus` exclusive to focus outlines.
- Change status-badge vertical inset from `2px` to `var(--space-xs)` or redesign the badge so every spacing inset remains on the declared 4px grid.
- Capture wide, 900px medium, 767px narrow, and 320px screenshots in a gitignored review directory during the next human review to confirm density, popover placement, hierarchy, and the 60/30/10 visual allocation.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**Strengths**

- Required browser-state copy is substantially exact: loading (`App.vue:270-271`), empty comparison (`App.vue:376-384`), pin/dirty cues (`IdentityHeader.vue:42-61`), session/security/stopped failures (`api/client.ts:8-15`), supported availability and unsupported heading (`FileMetadataPane.vue:101-111, 252-260`), and retry (`FileMetadataPane.vue:164-183`).
- Terminology consistently uses base, head, merge base, pinned commits, and committed HEAD; no source/target wording or dirty-byte ambiguity was found in the audited browser implementation.
- Exact reason-specific unsupported/unavailable explanations are implemented centrally in `FileMetadataPane.vue:25-57` and are exercised by the passing packaged metadata case.

**WARNING — identity clipboard failure is not the contract string.**

- Contract: `Could not copy. Select the value and copy it manually.`
- Implemented identity default: `Copy failed. The full value remains available to select.` (`CopyButton.vue:4-12`).
- Metadata copy passes the contract string explicitly (`FileMetadataPane.vue:203-207`), creating two voices for the same failure.
- The divergence is observed, not hypothetical: `pinned-session.spec.ts:715-731` asserts the identity-specific alternate text.
- **Fix:** Remove the alternate default and use the contract string for every copy action.

**WARNING — contextual copy action is not visible.**

- The button's accessible name is correct, but its rendered text is only `Copy` (`CopyButton.vue:41-52`).
- **Fix:** Render the passed label or a compact visible context such as `Copy base ID` / `Copy old path`, keeping the exact full phrase as the accessible name if needed.
- `needs_human_review: true` — a screenshot/usability pass should decide whether the adjacent row labels provide sufficient visual context or whether the repeated generic labels cause scanning errors.

### Pillar 2: Visuals (2/4)

**Strengths**

- The main details pane is structurally dominant: it flexes to remaining width, uses the dominant canvas, and starts with the 20px selected-file heading (`styles.css:513-526`), while the tree remains a fixed secondary rail (`styles.css:330-346`).
- Status presentation uses short text badges, numeric counts, path direction, warning geometry, and availability labels rather than unsupported icons or decorative imagery (`FileRow.vue:45-70`, `PathDisplay.vue:27-33`, `styles.css:416-504`).
- The design remains local Vue/CSS with no third-party visual system, icons, Monaco imitation, or out-of-scope review chrome.

**WARNING — medium identity-panel placement is likely visually broken.**

- `[INFERENCE]` At medium widths the header may wrap to two rows (`styles.css:792-803`), but the panel remains at `top: 72px` (`styles.css:179-190`). Because the header is `z-index: 3` and the panel `z-index: 2`, the wrapped header can cover the panel's top/heading.
- This diverges from the contract's “below the disclosure” placement and can obscure the panel title even if the first identity card remains reachable.
- Existing automation verifies a 900px tree width and no page overflow but does not open/measure the medium panel (`responsive-session.spec.ts:519-540`).
- **Fix:** Anchor to actual header/disclosure geometry and add bounding-box evidence at 900px.
- `needs_human_review: true` — confirm with a real 900px screenshot and interaction after fixing or before release.

**Human-judgment item — overall visual quality.**

- No screenshot was observed. The calm/dense developer-tool feel, actual 60/30/10 balance, perceived hierarchy, and whether long identity/copy rows feel crowded cannot be conclusively scored from source alone.
- `needs_human_review: true`.

### Pillar 3: Color (3/4)

**Strengths**

- The complete specified palette is declared at `styles.css:1-13`, with dominant and secondary surfaces used consistently across the page, header, tree, panel, cards, and controls.
- Status colors are applied only to their textual/structural roles: added, modified/warning, deleted/error, and moved (`styles.css:429-444, 487-504`).
- The focused packaged test confirms all palette token values and confirms primary/secondary text contrast of at least 4.5:1 on both neutral surfaces (`responsive-session.spec.ts:420-468`).
- Selected tabs and rows use accent structurally, while hover remains neutral (`styles.css:371-378, 771-780`).

**WARNING — focus color leaks into resting emphasis.**

- `--color-focus` is correctly used for the 2px focus outline (`styles.css:40-42, 381-385`) but is also used for the resting identity disclosure (`styles.css:161-162`) and copy-success feedback (`styles.css:280-284`).
- The design contract assigns these resting states to accent `#2F81F7` and reserves `#58A6FF` as the focus ring.
- **Fix:** Use `--color-accent` for resting disclosure and copy success; keep `--color-focus` for keyboard focus only.

**Human-judgment item — area allocation.**

- The source strongly suggests dominant/secondary surfaces occupy most area and accent is restrained, but the visual 60/30/10 allocation was not screenshot-observed.
- `needs_human_review: true`.

### Pillar 4: Typography (3/4)

**Strengths**

- No type size outside 12/14/16/20px was found in `styles.css`; no weight outside 400/600 was found.
- Explicit roles match the contract: h1 and selected-file h2 are 20px/600/1.4 (`styles.css:101-107, 521-526`); section headings are 16px/600/1.5 (`styles.css:110-116, 551-556`); tree/body is 14px/400 or selected 600/1.43 (`styles.css:357-378`); badges are 12px/600/1.33 (`styles.css:416-426`).
- Paths, modes, counts, and IDs use the system-monospace chain without introducing another size (`styles.css:237-244, 399-402, 573-603`).
- Packaged computed styles confirm the principal roles (`responsive-session.spec.ts:468-510`).

**WARNING — the default 14px role omits its required line-height.**

- `:root` sets the font family and `font-size: 14px` but not `line-height: 1.43` or the 400 default (`styles.css:21-25`).
- Buttons at `styles.css:146-157, 714-726` use `font: inherit`, so they inherit browser `normal` line-height rather than the explicit body/control role. Metadata `dd` values similarly lack the role line-height (`styles.css:599-603`).
- **Fix:** Set the body/control default to `font-size: 14px; font-weight: 400; line-height: 1.43`, then keep explicit heading/support overrides. Extend computed-style coverage to every control family and representative metadata values.

### Pillar 5: Spacing (3/4)

**Strengths**

- The declared 4/8/16/24/32/48/64px tokens exactly match the contract (`styles.css:14-20`) and are broadly reused for component padding, gaps, and state spacing.
- Core dimensions match: full-height `100dvh` shell (`styles.css:75-85`), 320px wide tree with 240px minimum/440px maximum (`styles.css:330-337`), 280px medium tree (`styles.css:809-811`), at least 40px rows (`styles.css:357-368`), and at least 40×40px semantic controls (`styles.css:146-157, 714-726`).
- The passing responsive test checks target dimensions on visible controls at 320px and verifies no document overflow (`responsive-session.spec.ts:670-760`).

**WARNING — the badge uses an undeclared 2px inset.**

- `styles.css:416-426` applies `padding: 2px var(--space-xs)` to status badges.
- The UI-SPEC says badge inset uses `xs = 4px`, all spacing values are multiples of four, and exceptions are none.
- **Fix:** Use `var(--space-xs)` vertically or adjust badge sizing through line-height/border rather than off-scale padding.

### Pillar 6: Experience Design (3/4)

**Strengths**

- Loading, empty, terminal/session failure, file-local retry, supported, all unsupported reasons, and unavailable-object states are present and semantically differentiated (`App.vue:267-396`, `FileMetadataPane.vue:155-264`, `ErrorState.vue:7-10`).
- Narrow tabs implement the declared names, roles, selection/tabindex pairs, Arrow/Home/End activation, file-to-details focus movement, and Back-to-files restoration (`App.vue:140-215, 294-373`).
- The identity sheet supplies dialog semantics, a first close control, focus containment, Escape/disclosure/close dismissal, and restoration (`IdentityPanel.vue:29-62, 67-80`; `App.vue:199-258`).
- The tree provides full ARIA tree semantics and the corresponding keyboard model, rather than partial roles (`FileTree.vue:56-90, 123-165`; `FileRow.vue:40-57`).
- Focused packaged evidence passed for tree navigation, responsive state preservation, disabled behavior, focus rings, modal trapping, copy success/reset/failure, stale metadata responses, 320px reflow, 200% zoom, and text spacing.

**WARNING — copy announcements are not shared.**

- Each `CopyButton` renders its own `role="status" aria-live="polite"` (`CopyButton.vue:47-55`). A loaded identity panel alone renders three instances (`IdentityPanel.vue:88-132`), and metadata adds one per path row (`FileMetadataPane.vue:189-208`).
- The contract requires one shared polite live region. Multiple empty live regions are unlikely to block copying, but they create fragmented announcement ownership and can become noisy as copy surfaces grow.
- **Fix:** Move the polite status to `App.vue` or another single session-level owner. Have buttons emit copy-result events with their contextual message while retaining local visual state.

**Coverage limitation.**

- The passing test suite is strong but does not visually verify the medium identity-panel anchor defect or perceived quality. This is why Experience Design remains 3 rather than 4 despite broad behavioral coverage.

---

## Human Review Queue

| Item | Why automation/source is insufficient | Required check | needs_human_review |
|------|---------------------------------------|----------------|--------------------|
| Medium identity panel | Fixed positioning indicates a likely overlap, but no screenshot was captured and the test does not measure the open panel at 900px. | Open identities at 900×560 and confirm the panel border, heading, and first row are entirely below the header and unobscured. | **true** |
| Visible copy labels | Accessibility names are exact, but whether repeated visible `Copy` labels remain unambiguous is a visual/scanning judgment. | Review identity and rename/copy metadata rows at wide and 320px widths; test rapid task identification without a screen reader. | **true** |
| Visual hierarchy and density | DOM/CSS show intended hierarchy but cannot establish perceived calmness, density, or crowding. | Cumpa wide, medium, narrow, empty, unavailable, and long-path screenshots against the dense/calm developer-tool contract. | **true** |
| Color allocation | Token roles can be inspected, but visible-area 60/30/10 balance is compositional. | Review screenshots for neutral-surface dominance and ensure blue does not become a general decoration color. | **true** |

---

## Files Audited

### Authoritative planning inputs

- `.planning/phases/01-pinned-local-comparison/01-CONTEXT.md`
- `.planning/phases/01-pinned-local-comparison/01-UI-SPEC.md`
- `.planning/phases/01-pinned-local-comparison/01-01-PLAN.md` through `01-13-PLAN.md`
- `.planning/phases/01-pinned-local-comparison/01-01-SUMMARY.md` through `01-13-SUMMARY.md`

### Browser implementation and styles

- `src/web/App.vue`
- `src/web/styles.css`
- `src/web/main.ts`
- `src/web/index.html`
- `src/web/api/client.ts`
- `src/web/model/file-tree.ts`
- `src/web/components/CopyButton.vue`
- `src/web/components/DirectoryRow.vue`
- `src/web/components/EmptyState.vue`
- `src/web/components/ErrorState.vue`
- `src/web/components/FileMetadataPane.vue`
- `src/web/components/FileRow.vue`
- `src/web/components/FileTree.vue`
- `src/web/components/IdentityHeader.vue`
- `src/web/components/IdentityPanel.vue`
- `src/web/components/InlineNotice.vue`
- `src/web/components/PathDisplay.vue`
- `src/web/components/StatusBadge.vue`

### Focused packaged UI evidence

- `tests/e2e/file-tree.spec.ts`
- `tests/e2e/pinned-session.spec.ts`
- `tests/e2e/responsive-session.spec.ts`

---

## Recommendation Count

- **Priority fixes:** 3
- **Additional actionable warnings:** 3
- **Human-review items:** 4
- **Blockers:** 0
