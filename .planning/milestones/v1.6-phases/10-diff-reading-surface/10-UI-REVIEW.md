---
phase: 10-diff-reading-surface
status: passed
score: 24/24
reviewed: 2026-09-13
live_browser_evidence: true
human_verification: closed
---

# Phase 10 — UI Review

**Audited:** 2026-09-13  
**Baseline:** Approved `10-UI-SPEC.md`, with `mockups/01-quiet-workspace.html` as the normative visual reference.  
**Screenshots:** Captured from a production build and real CLI/Fastify session into `.planning/ui-reviews/10-20260913-live/` (git-safe: its `.gitignore` excludes image binaries).

A fresh two-hunk Git fixture was committed, Cumpa was launched through `dist/bin/cumpa.mjs`, and the ephemeral loopback session was driven in Chromium. The fixture had two changed lines separated by enough unchanged lines to render Monaco’s collapsed-context band. The browser was inspected at 1440×900, 1650×900, and 420×900. At mobile width the Phase-11-owned review rail was closed before the readability capture so the Phase-10 diff surface—not the out-of-scope overlay—was evaluated.

---

## Pillar Scores

| Pillar | Score | Key finding |
|---|---:|---|
| 1. Copywriting | 4/4 | Live range labels read `BASE − REMOVED` and `HEAD + ADDED`; helper copy is exact and Monaco retains its native `10 hidden lines`/reveal control. |
| 2. Visuals | 4/4 | Screenshots show a quiet, legible two-pane Monaco comparison: continuous muted hunk groups, restrained one-pixel boundaries, explicit side identity, and no competing hunk-header UI. |
| 3. Color | 4/4 | Canvas/surface dominate; semantic red/green is confined to changed code while static labels remain muted. Focus/selection channels remain separate from diff-state fills. |
| 4. Typography | 4/4 | Live Monaco measured 13px/26px at desktop, 14px/28px at full desktop, and 12px/24px at mobile; metadata remained 12px/18px. |
| 5. Spacing | 4/4 | The 37px label track, 9px/18px label padding, 640px minimum canvas, local overflow boundary, and zero-height boundary paint all held in the live session. |
| 6. Experience Design | 4/4 | Both panes remain side-by-side and readable; mobile horizontal scrolling is local, unchanged context is natively operable, and redundant structural/text cues survive without hue. |

**Overall: 24/24**

---

## Live Acceptance Evidence

| Live check | Result | Observed evidence |
|---|---|---|
| 1. Quiet-reference equivalence and readability at desktop, full desktop, mobile | **PASS** | `desktop.png`, `full-desktop.png`, and `mobile-diff-readable.png` show the same quiet split-diff anatomy as the approved reference: muted canvas, explicit Base/Head row, paired lines, full-line semantic fills, sparse rails/signs, subtle hunk delimiters, and native collapsed context. At 420px the 640px canvas stays split and horizontally scrollable by design. |
| 2. Responsive code density and re-rendering at 1650/760 breakpoints | **PASS** | Live measurements: 1440px = **13px/26px**; 1650px = **14px/28px**; 420px = **12px/24px**. The changed groups, hidden band, labels, and boundaries remained rendered after each resize. This matches `DiffWorkspace.vue:294-308` and `diff-adapter.ts:74-92`. |
| 3. Source-correct side labels at all widths | **PASS** | Every live viewport contained non-clipped `BASE − REMOVED` and `HEAD + ADDED` labels at 12px/18px. The 420px screenshot starts at Base; local scroll reveals Head, preserving the intentional original-then-modified source order. Range copy agrees with `DiffWorkspace.vue:51-55,314-325`. |
| 4. Visible 1px hunk boundaries with unchanged line height | **PASS** | Live boxes: desktop start/end = **26px**, interior = **26px**; full desktop = **28px/28px/28px**; mobile = **24px/24px/24px**. Each start/end border was **1px solid**. This confirms `styles.css:2732-2740` paints rather than expands the Monaco rows. |
| 5. Theme-owned hidden-region band with no blue hover regression | **PASS** | Each live viewport exposed a native `10 hidden lines` band, themed `rgb(22, 27, 34)` with foreground `rgb(173, 200, 230)`, and a native `Show Unchanged Region` control. The focused Chromium proof `npm run test:browser -- tests/integration/monaco-anchor.spec.ts` passed 15/15, including real pointer hover on the hidden-region reveal codicon and its canonical hunk foreground. `theme.ts:70,91-94` is the sole center-band authority; CSS scopes application paint to native edge controls. |
| 6. No document horizontal overflow; 640px canvas has local overflow | **PASS** | `document.documentElement.scrollWidth <= clientWidth` at 1440, 1650, and 420. At 420 the viewport measured **420px** client width with **640px** scroll width; the canvas measured **640px** and `overflow-x: auto` belonged to `.diff-workspace__viewport` (`styles.css:1676-1692`). |
| 7. Removed/added meaning in grayscale | **PASS** | Both visible and computed cues agree: Base rail = **2px dashed** plus `−`; Head rail = **2px solid** plus `+`; labels repeat `REMOVED`/`ADDED`. This redundant non-colour meaning matches `styles.css:2702-2771` and is preserved by the forced-colors block. |

**Human-verification decision:** **Approved.** The outstanding visual equivalence/readability check in `10-VERIFICATION.md` is closed by the above live review. No Phase-10 visual defect was found.

---

## Top 3 Priority Fixes

No corrective fixes are warranted for the Phase-10 diff reading surface.

1. **None — visual hierarchy and quiet-reference treatment pass.** Do not add a custom hunk header, toolbar, or second renderer.
2. **None — responsive split-diff continuity passes.** Keep the deliberate 640px local-scroll canvas; do not convert mobile to unified diff.
3. **None — non-colour and hidden-context channels pass.** Keep Monaco as the hidden-band paint authority and retain the dashed/solid rails and signs.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)

**PASS — exact, source-specific language is present in the real range session.** The screenshots and live DOM show `BASE − REMOVED` and `HEAD + ADDED`; `DiffWorkspace.vue:51-55,314-325` derives that pair from `sourceKind` and contains the required exact context helper. The actual collapsed band retained Monaco’s native hidden-line count and `Show Unchanged Region` control rather than inventing competing CTA copy. This matches the UI-SPEC copy contract.

No generic or misleading “old/new/current” source terminology was observed in the Phase-10 surface. Exact-patch nomenclature is code-wired as `PREIMAGE`/`POSTIMAGE` by the same `visibleSides` authority; focused existing browser coverage independently verifies the rendered Monaco accessible name.

### Pillar 2: Visuals (4/4)

**PASS — the live images match the approved quiet reading treatment.** At 1440px and 1650px, the changed rows read as calm, paired groups: Monaco’s semantic fills identify local change, thin start/end borders bound each group, and the side identity row establishes pane meaning without dominating the reading surface. `full-desktop.png` especially confirms that the wide density increases code only rather than inflating labels or surrounding chrome.

At 420px, `mobile-diff-readable.png` confirms the deliberate split canvas rather than a unified fallback. The first pane is legible at the local-scroll origin; the second remains present in the same canvas and is reachable by the local scroll range. The mobile review rail is owned outside this phase and was not scored.

### Pillar 3: Color (4/4)

**PASS — visual color allocation follows the contract.** The screenshots show the canvas and unchanged code as the dominant field, panels/gutters/boundaries as structural secondary surfaces, and blue reserved for actual active/focus controls rather than static diff chrome. Static side labels are muted, while addition/deletion colors appear only on semantic changed rows and intraline spans.

`theme.ts:64-106` maps Monaco paint from the canonical token root, and `styles.css:2702-2810` uses semantic variables for rails, signs, edges, focus, and selection. The focused real-Monaco run passed all 15 assertions, including the hidden-region foreground hover and distinct selection/anchor/focus channels. No component-level palette or gradient was introduced.

### Pillar 4: Typography (4/4)

**PASS — live measured values exactly match the approved responsive type contract.** The real CLI session measured 13px/26px at 1440px, 14px/28px at 1650px, and 12px/24px at 420px; label metadata was 12px/18px and readable in every capture. This is the expected `updateOptions()` route in `diff-adapter.ts:74-92,189-191`, selected by the two component-owned media queries in `DiffWorkspace.vue:294-308`.

The screenshots show stable hierarchy: metadata remains compact and quiet, while code remains the focal reading unit. No unsupported type size, weight, or CSS override of Monaco line metrics was found in the Phase-10 sources.

### Pillar 5: Spacing (4/4)

**PASS — the design-system geometry is exact in both source and browser.** `styles.css:1676-1720` supplies the shared 640px canvas, one local overflow owner, 37px label row, two equal label columns, and the approved 9px/18px exception. Live label cells were non-clipped at all three widths. The full-desktop capture remains intentionally dense rather than loosening all surface spacing.

Hunk geometry is also sound: boundary boxes matched an interior changed line at each density (26px, 28px, and 24px respectively), with a 1px solid boundary. `diff-semantics.ts:62-108` adds these only as Monaco whole-line decorations after the authoritative range projection, while `styles.css:2732-2740` uses border-box paint.

### Pillar 6: Experience Design (4/4)

**PASS — the reading task remains legible and operable across the required widths.** The real session stayed side-by-side at all widths; at 420px, document overflow remained false while the local viewport was 420px wide with a 640px scrollable canvas. Base appears at the start of the local range and Head at the end, so a reviewer can reach both sources without shifting the page itself.

The hidden-context band reported its count and supplied the Monaco-native reveal control. Meaning also remains usable without hue: live computed evidence found a dashed 2px Base rail + minus sign, a solid 2px Head rail + plus sign, and repeated signed label text. The focused real-Monaco browser test additionally passed its hunk-boundary, hidden-control hover, and paired-zone geometry cases (15/15).

---

## Registry Safety

Not applicable: `components.json` is absent, and `10-UI-SPEC.md` prohibits third-party registry use for this phase.

## Files Audited

- `.planning/phases/10-diff-reading-surface/10-UI-SPEC.md`
- `.planning/phases/10-diff-reading-surface/10-VERIFICATION.md`
- `.planning/phases/10-diff-reading-surface/10-01-SUMMARY.md` through `10-06-SUMMARY.md`
- `src/web/monaco/theme.ts`
- `src/web/monaco/diff-adapter.ts`
- `src/web/monaco/diff-semantics.ts`
- `src/web/styles.css`
- `src/web/components/DiffWorkspace.vue`
- `mockups/01-quiet-workspace.html`, `mockups/02-review-stream.html`, `mockups/03-focus-mode.html`
- `tests/integration/monaco-anchor.spec.ts`
- `tests/helpers/open-runtime-session.ts`, `tests/helpers/git-fixture.ts`, `tests/helpers/public-runtime.ts`, `tests/helpers/runtime-artifact.ts`
- Focused live validation: `npm run build`; `npm run test:browser -- tests/integration/monaco-anchor.spec.ts` (**15 passed**)

---

_Reviewed by UiAudit10 on 2026-09-13._
