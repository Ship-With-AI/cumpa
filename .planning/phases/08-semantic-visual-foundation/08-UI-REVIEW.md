---
status: warnings
phase: 08-semantic-visual-foundation
audited: 2026-09-13
---

# Phase 08 — UI Review

**Baseline:** `08-UI-SPEC.md` and `mockups/01-quiet-workspace.html` (the approved numeric authority)  
**Audit mode:** Code-only. No server responded on ports 3000, 5173, or 8080, so no screenshots or browser interaction were captured. `.planning/ui-reviews/.gitignore` already excludes raster captures.  
**Scope applied:** This review assesses the Phase 08 shared semantic-token contract and Monaco integration only. It does not treat later Phase 09–12 surface redesign work as missing.

---

## Pillar Scores

| Pillar | Score | Key finding |
|---|---:|---|
| 1. Copywriting | 3/4 | The direct operational copy is generally sound, but the specified delete-confirmation sentence is not verbatim and three named contract examples are absent from shipped source. |
| 2. Visuals | 3/4 | Shell and Monaco colors have a coherent semantic source, but no live reference-viewport inspection was possible. |
| 3. Color | 2/4 | Core palette values and Monaco mappings are exact, but the approved modified-file status role is replaced by warning yellow and several approved palette roles are absent from the root. |
| 4. Typography | 2/4 | CSS owns the four reference type roles, but Monaco receives no font family, font size, or line-height configuration from that shared system. |
| 5. Spacing | 2/4 | The root only exposes five of the approved spacing steps; the mobile `12px` inset remains a literal rather than the specified `--space-3`. |
| 6. Experience Design | 3/4 | Focus, reduced-motion, forced-colors, labels, and grayscale diff cues are well covered in code; runtime keyboard and viewport proof was unavailable. |

**Overall: 15/24 — warnings**

---

## Top 3 Priority Fixes

1. **WARNING — reconcile the approved token inventory with the canonical root.** `08-UI-SPEC.md:56-75,119-208` requires shared palette, spacing, radius, and density roles that `src/web/styles.css:1-133` deliberately omits. This leaves later surface work without the approved single source of truth. Either add and consume the approved tokens in this foundation, or amend the approved contract to explicitly defer each named role; do not leave the two authorities contradictory.
2. **WARNING — restore the modified-state semantic role.** The contract assigns modified state the blue selected treatment, while `src/web/styles.css:368-372` renders `.status-badge--modified` as warning yellow on the raised surface. Define/use the approved modified foreground, background, and boundary roles so modified is not conflated with warning/dirty state.
3. **WARNING — make Monaco consume the shared code typography roles.** `src/web/monaco/diff-adapter.ts:99-111` creates the editor without `fontFamily`, `fontSize`, or `lineHeight`; `src/web/styles.css:76-79` therefore cannot govern Monaco’s required `13px/26px` reference role or its documented viewport variants. Resolve the root tokens through the existing virtual-token parser and set those documented editor options.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

- **WARNING — contract copy is not preserved verbatim.** The approved destructive copy is “This permanently removes **the** comment from **the** local draft. Cumpa **has** no undo history.” (`08-UI-SPEC.md:249-254`). `src/web/components/ReviewPanel.vue:527-541` instead renders “This permanently removes comment local draft. Cumpa no undo history.” The sentence loses required articles and verb, reducing clarity at an irreversible action.
- The other sampled interaction copy is direct and operational: delete has explicit `Keep comment` / `Delete comment` actions (`ReviewPanel.vue:527-541`), and status/connection messages name the state and next action (`ReviewPanel.vue:705-773`).
- **Baseline discrepancy, not attributed to Phase 08:** searches of `src/web/` found no shipped `Review notes`, `No matching files`, `Clear the filter to show all changed files.`, or the exact pinned-session body required by `08-UI-SPEC.md:243-253`. The Phase delta contains no changes to `App.vue`, `ErrorState.vue`, `FileTree.vue`, or `ReviewPanel.vue`; do not treat this as a token-cutover surface-restyle failure.

### Pillar 2: Visuals (3/4)

- **Verified in code:** the shell uses the canonical canvas/panel/raised hierarchy (`src/web/styles.css:3-15,138-145,227-237`), and overlays reserve shadows for overlay states (`styles.css:640-681`; enforced by `scripts/verify-semantic-css.mjs:246-302`). No gradients, glass treatment, or component-local palette was found; the focused audit passed after a fresh Vite build.
- **WARNING — no rendered evidence.** No local target was available for the required 1440px/900px and mobile visual comparison. Visual continuity, hierarchy, clipping, and density at the reference viewports therefore remain code-derived rather than observed. This is an audit-evidence gap, not a request for Phase 09–12 restyling.

### Pillar 3: Color (2/4)

- **WARNING — modified state diverges from the approved semantic role.** The approved palette assigns modified state `#79b8ff`, `#1a2b43`, and `#345477` (`08-UI-SPEC.md:139-190`). `src/web/styles.css:368-372` instead assigns `.status-badge--modified` the warning foreground/background (`#d29922` / `#21262d`, root lines 41-42). Modified and warning/dirty are distinct meanings in the contract; this is a semantic-color collision, not merely a token rename.
- **WARNING — canonical-root inventory is smaller than the approved contract.** The root at `styles.css:1-133` has no approved `--surface-gap: #111821`, `--border-overlay: #596678`, `--interactive-accent-emphasis-hover: #2b7afa`, modified/add/delete state triplets, or their neutral borders. The omissions are documented as intentional retirements in `08-06-SUMMARY.md`, but that summary does not supersede the approved UI-SPEC. This is the same contract conflict identified in priority fix 1.
- **Verified:** all mapped Monaco paint values derive from the root via `color('--token')`, including canvas, gutter, selection, widgets, diff fills, syntax, focus, and scrollbars (`src/web/monaco/theme.ts:7-105`). No independent Monaco palette is present. `node scripts/verify-semantic-css.mjs` passed against the fresh build.
- **Contrast check — no sampled real foreground/background pair fails.** Using WCAG relative luminance, the lowest sampled normal-text pair is white on primary emphasis: `#ffffff` / `#1f6feb` = **4.63:1**. Other actual pairs pass comfortably: primary/canvas **15.94:1** (`#e6edf3`/`#0d1117`), muted/panel **7.98:1**, line-number/sidebar **6.29:1**, success/success-fill **9.80:1**, error/error-fill **8.14:1**, warning/raised **6.03:1**, information/selection-fill **5.65:1**, and focus/canvas **7.46:1**. No sampled pair fails the 4.5:1 text or 3:1 non-text focus threshold.

### Pillar 4: Typography (2/4)

- **WARNING — Monaco is not a typography consumer of the shared root.** The root correctly declares the approved UI roles: `12px/18px`, `13px/26px`, `14px/21px`, and `21px/31.5px` (`src/web/styles.css:76-85`; `08-UI-SPEC.md:100-111`). But `createDiffEditor` has no font options (`src/web/monaco/diff-adapter.ts:99-111`), and `src/web/monaco/theme.ts:16-105` is color-only. Monaco will therefore use its library default rather than the contract’s reference code typography.
- **WARNING — the root introduces a fifth display-size role outside the stated four-role scale.** `--font-size-display: clamp(2rem, 8vw, 3.5rem)` and `--line-height-display: 1.05` appear at `styles.css:87-90`, while the UI-SPEC says exactly four authored sizes (`08-UI-SPEC.md:96-111`). The inline “approved continuity” comment documents origin, but not a contract exemption. Resolve this in the same root-inventory decision rather than silently treating comments as approval.
- **Verified:** authored CSS consumers use the type tokens rather than scattered numeric type declarations; weights are limited to the specified 400/600 pair (`styles.css:91-95`).

### Pillar 5: Spacing (2/4)

- **WARNING — the approved scale is incompletely represented.** `08-UI-SPEC.md:56-75` defines `--space-1`, `2`, `3`, `4`, `5`, `6`, `8`, `12`, and `16`; `styles.css:120-128` declares only `1`, `2`, `4`, `6`, and `8`. The root likewise lacks the approved geometry/density inventory (file-row radius, scrollbar radius, compact control height, file/diff row sizes, gutters, sidebar, and dialog dimensions) required by `08-UI-SPEC.md:195-207`.
- **WARNING — a mapped shared spacing value remains literal.** Mobile header padding is `12px` at `src/web/styles.css:2318-2326`; the contract names that exact shared value `--space-3` (`08-UI-SPEC.md:60`). This is a direct token-cutover gap, not a request to change mobile composition.
- Existing literal dimensions that belong to retained surface composition (for example review-shell columns, dialog widths, drawer geometry, and tree row heights) are **not scored as missing Phase 09–12 work**. The issue is that their approved shared tokens are absent from the Phase 08 source of truth.

### Pillar 6: Experience Design (3/4)

- **Verified — focus is visible and geometry-compliant in authored CSS.** The global ring is the required `2px` outline with `3px` offset (`src/web/styles.css:110-113,148-151`); tree rows and Monaco panes move that ring inward where clipping would otherwise occur (`styles.css:931-933,2602-2606`), and the skip link reserves its external ring inside the viewport (`styles.css:1229-1243`).
- **Verified — grayscale and forced-colors semantics survive.** File rows expose `aria-selected` and plus/minus count text (`src/web/components/FileRow.vue:47-61`); Monaco uses explicit `−`/`+` markers and dashed base vs solid head rails (`styles.css:2534-2562`), retained with system colors in forced-colors mode (`styles.css:2713-2743`). Selected tabs/rows retain `aria-selected` plus a 3px rail (`styles.css:630-632,939-942`).
- **Verified — nonessential motion and authored palette are suppressed appropriately.** The reduced-motion rule eliminates transition/animation duration (`styles.css:2608-2616`); the terminal forced-colors block replaces shell, control, focus, selection, status, and diff colors with system colors (`styles.css:2619-2748`).
- **WARNING — no interaction runtime proof.** These safeguards were source-audited only because no fresh runnable browser target was available. Keyboard traversal, mobile drawer tab exclusion, Monaco focus painting, and forced-color rendering require a later live capture/run to elevate this pillar.

---

## Registry Safety

Skipped: `components.json` is absent and `08-UI-SPEC.md` declares no third-party registry blocks.

## Files Audited

- `.planning/phases/08-semantic-visual-foundation/08-UI-SPEC.md`
- `.planning/phases/08-semantic-visual-foundation/08-VERIFICATION.md`
- `.planning/phases/08-semantic-visual-foundation/08-02-SUMMARY.md`
- `.planning/phases/08-semantic-visual-foundation/08-03-SUMMARY.md`
- `.planning/phases/08-semantic-visual-foundation/08-05-SUMMARY.md`
- `.planning/phases/08-semantic-visual-foundation/08-06-SUMMARY.md`
- `mockups/01-quiet-workspace.html`
- `src/web/styles.css`
- `src/web/monaco/theme.ts`
- `src/web/monaco/diff-adapter.ts`
- `src/web/theme/token-contract.ts`
- `scripts/css-token-contract.mjs`
- `scripts/verify-semantic-css.mjs`
- sampled UI components: `ReviewPanel.vue`, `ErrorState.vue`, `FileRow.vue`, `FileTree.vue`, and `App.vue`

## Focused Verification

- `npm run verify:semantic-css` — passed; performed a fresh `npm run build:web` then source/generated semantic checks.
- `node scripts/verify-semantic-css.mjs` — passed against that fresh build.
- Dev-server probe — ports 3000, 5173, and 8080 each returned no target; no screenshots captured.
