---
phase: 03-complete-review-draft
audit: ui-six-pillar
audited: 2026-07-23
baseline: 03-UI-SPEC.md
screenshots: not-captured-no-local-server
mode: code-and-packaged-browser-evidence
overall_score: 9/24
---

# Phase 3 — UI Review

**Audited:** 2026-07-23  
**Baseline:** `03-UI-SPEC.md`  
**Screenshots:** Not captured. The required screenshot-storage gate was checked before discovery; no development server answered on `127.0.0.1:3000`, `:5173`, or `:8080` (all returned connection failure). Findings marked **[HUMAN REVIEW]** need rendered validation rather than being inferred from source.

This is a code audit supplemented by packaged-browser test evidence, not a visual sign-off. `tests/e2e/complete-review-draft.spec.ts` contains passing 1440px lifecycle, safe-preview, two-tab-conflict, recovery, and drift scenarios; `test-results/.last-run.json` records `passed`, and `03-VERIFICATION.md` records the eight packaged Chromium scenarios passing on 2026-07-23. Those tests establish important behavioral paths, but do not exercise the contract's 1100px/768px/375px layout, 200% zoom, visual hierarchy, contrast, tab-arrow behavior, or focus order.

---

## Pillar Scores

| Pillar | Score | Key finding |
|--------|-------|-------------|
| 1. Copywriting | 2/4 | Several exact labels are present, but required empty, failure, conflict-detail, and lifecycle copy is absent or altered. |
| 2. Visuals | 1/4 | The implemented Review surface is a raw, card-like collection rather than the specified hierarchy of local primitives and quiet editorial rail. |
| 3. Color | 1/4 | Phase 3 continues legacy destructive/warning values and does not implement the prescribed semantic warning/error palette. |
| 4. Typography | 2/4 | The global base is aligned, but Phase 3 raw controls and recovery headings bypass the required four-size/two-weight chrome scale. |
| 5. Spacing | 2/4 | Token gaps are common, but panel geometry, nested scrolling, recovery inset, and undeclared 6px radii violate the contract. |
| 6. Experience Design | 1/4 | Core persistence works, but keyboard, focus, confirmation, lifecycle-state, and responsive-control contracts are materially incomplete. |

**Overall: 9/24**

---

## Top 3 Priority Fixes

1. **BLOCKER — Rebuild `ReviewPanel` around the specified Review/Summary/open/resolved state hierarchy.** The panel needs the `UiDisclosure`, `UiModeTabs`, `UiConfirmRow`, `UiButton`, inline-notice, pending, failure, conflict, empty-state, and deterministic focus behavior required by `03-UI-SPEC.md`; current raw controls omit multiple mandatory states. This prevents a safe, keyboard-operable review lifecycle.
2. **BLOCKER — Implement the full keyboard and focus contract.** Add `aria-expanded`/`aria-controls` to the Review and disclosure controls; proper tab IDs/panels and Left/Right Arrow behavior; scoped Escape confirmation flows; focus-safe resolve/delete/recovery transitions; and focus-to-heading drawer opening. Current controls can silently discard edits or leave keyboard users without the stated interaction path.
3. **WARNING — Make the review rail/drawer token-accurate and responsive.** Use 360px at desktop and drawer widths, switch at the specified 1440px/1100px boundaries, remove nested scrolling, use the semantic palette/radii, and give every Phase 3 control the established primitive styling. Validate at 1440, 1100, 768, 375, and 200% zoom.

---

## Detailed Findings

### Pillar 1: Copywriting (2/4)

- **WARNING — Required empty and failure language is missing.** `src/web/components/ReviewPanel.vue:89-166` renders neither `No open comments` / its guidance nor `No resolved comments` / its guidance. It also receives only `pending` and `conflict`, so it cannot render the specified save/operation failure language. `src/web/model/review-draft-state.ts:91-93` clears pending on failure without exposing a failure state. Add the exact copy and a typed failure state per originating mutation.
- **WARNING — Multiple required phrases are altered or incomplete.** The conflict text at `ReviewPanel.vue:90-93` omits the required heading/metadata (`Your revision`, `Latest revision`, and `Nothing from this attempt was written.`). The delete body at `ReviewPanel.vue:127` says `This permanently removes comment local draft`, rather than the required grammatical and explicit `This permanently removes the comment from this local draft.` Keep the contract strings centralized or test exact user-visible copy.
- **WARNING — The local-first retention promise is not surfaced after reload.** `SummarySection.vue:20-25` can label only Saved/Unsaved/Saving/conflict; after `App.vue:341-368` reloads latest, it cannot render `Retained after reload — not saved`, `Latest draft loaded. Your unsaved text is still here.`, or a `Continue editing retained text` gate.

### Pillar 2: Visuals (1/4)

- **BLOCKER — The Review hierarchy does not match the contract.** `ReviewPanel.vue:80-166` has a second `Review` heading but no review-header counts, no wide-width close action, no Open disclosure, and no section-local empty guidance. It presents each comment as an independently bordered record (`styles.css:1396-1404`), producing the forbidden nested-card feel instead of crisp rules and quiet grouped records.
- **WARNING — Phase 3 actions bypass the existing primitives.** Most buttons in `ReviewPanel.vue:96-166` and `SummarySection.vue:45-66` have no `ui-button` class or `UiButton` primitive. Their default browser appearance is not guaranteed to meet the specified visual, hover, disabled, minimum-control, or type rules. Replace raw controls with the existing primitive variants.
- **WARNING — Structural icon language is inconsistent.** `src/web/components/CommentComposer.vue:29-30` uses a lock emoji for an immutable-anchor cue, while the contract requires the existing inline SVG icon set. Replace it with the local SVG icon and accessible text/tooltip.
- **[HUMAN REVIEW] — No captured desktop/tablet/mobile rendering exists.** Validate the diff's dominance, drawer shadow restraint, panel grouping, label wrapping, and absence of clipped/overlapping controls in a live browser.

### Pillar 3: Color (1/4)

- **BLOCKER — Semantic colors diverge from the locked palette.** The active Phase 3 token override defines canvas/panel/accent but leaves `--color-destructive` and `--color-modified` at legacy `#F85149` and `#D29922` (`styles.css:1-15`, `970-989`). Recovery destructive controls, badges, and error/conflict surfaces use those legacy values (`styles.css:1406-1409`, `1451-1458`, `1496-1515`) instead of `--destructive: #A33A32`, `--warning-*`, and `--error-*` contract tokens.
- **WARNING — The required semantic warning/error/info surfaces are not implemented.** `SelectorDriftNotice.vue:37-66` relies on the generic warning notice; its state has text, but it has no contracted warning token pair or icon. `ReviewPanel.vue:90-93` marks conflict only with legacy modified text color. Define and use the prescribed semantic background/foreground tokens, paired with text/symbols.
- **WARNING — Literal-color rule is broken in Phase 3 styling.** `styles.css:1490-1494` adds `color: #fff`; `styles.css:970-981` adds `#dfd8cc` for hover. The UI spec permits no literal colors outside its tokens. Move these into named semantic tokens and verify contrast for each foreground/background pair.
- **[HUMAN REVIEW] — Contrast is not demonstrated.** Measure normal-text, badge, focus-ring, border, and disabled-state contrast on the actual rendered light theme; source inspection cannot certify AA/3:1 non-text contrast.

### Pillar 4: Typography (2/4)

- **WARNING — Raw Review controls evade the prescribed type roles.** `ReviewPanel.vue:96-166` and `SummarySection.vue:45-66` use unclassified native buttons/controls rather than the inherited primitive that declares `font: inherit` (`styles.css:1100-1109`). This makes their browser font, 12/14px role, and weight non-deterministic.
- **WARNING — Recovery heading and panel metadata lack the defined four-size/two-weight mapping.** `styles.css:1423-1516` sets no explicit heading sizes or recovery-card typography; default `h1`/`h2` browser weights exceed the required 400/600-only chrome scale. Define explicit 24px/600 recovery heading, 18px/600 subheading, 14px body, and 12px metadata styles.
- **WARNING — Comment text is neither clamped nor exposed through the required full-text route.** `ReviewPanel.vue:111` and `147` always render the full body and provide no two-line clamp / `View full comment` control. This creates uncontrolled density and misses the accessible-preview rule.

### Pillar 5: Spacing (2/4)

- **WARNING — Review geometry misses the contract.** The wide rail is 320px (`styles.css:995-1001`) and the drawer is also 320px (`styles.css:1297-1316`), not the required 360px. The drawer begins below 1440px rather than at 1100–1439px, and the wide three-column target is not met.
- **WARNING — The rail and its child both scroll.** `.comments-rail` has `overflow: auto` (`styles.css:995-1001`) and `.review-panel` has `overflow: auto` (`styles.css:1384-1388`), conflicting with the required one internal vertical Review scroll region. Remove one scroll container and reserve the panel's scroll state across responsive transitions.
- **WARNING — Non-contract geometry is introduced.** `styles.css:1396-1404` and `1501-1507` use `border-radius: 6px`, while only 4px and 8px are permitted. `draft-recovery` uses `--space-xl`/32px at `1423-1426` where the recovery contract requires `lg`/24px inset. Use only declared tokens and radii.
- **[HUMAN REVIEW] — Verify 200% zoom, long OIDs/paths, action wrapping, and no horizontal document scroll.** The existing packaged evidence sets 1440px viewports (`complete-review-draft.spec.ts:311,424,439,620`) but does not cover the required responsive breakpoints or zoom.

### Pillar 6: Experience Design (1/4)

- **BLOCKER — Summary and comment discard handling can silently discard changed text.** `SummarySection.vue:59-66` emits `cancel` immediately; `App.vue:743` immediately replaces the summary buffer with canonical text. `ReviewPanel.vue:103-105` and `139-141` set `editing = null` immediately. Neither path checks for changes, opens the required inline confirmation, or implements Escape behavior. Add `UiConfirmRow`, safe-first focus, and preserve attempted buffers until confirmed discard.
- **BLOCKER — Required keyboard/ARIA semantics are missing.** The Review trigger has no `aria-expanded` or `aria-controls` (`ReviewToolbar.vue:44-52`). `SummarySection.vue:42-45` uses tab roles without tab IDs, `aria-controls`, associated tabpanels, or Left/Right Arrow handling. The Resolved disclosure has `aria-expanded` but no `aria-controls` (`ReviewPanel.vue:132-134`). `App.vue:128-139` focuses the drawer container instead of the Review heading, and `App.vue:530-556` handles Escape globally without the specified editor/confirmation precedence.
- **BLOCKER — Whole-draft pending and lifecycle feedback are incomplete.** `ReviewPanel.vue:119-120` emits Resolve with no inline `Resolving comment…`; it does not implement successor focus/count announcements. `CommentComposer.vue:44-55` is not given review-draft pending state, so its add action can remain enabled while another summary/comment mutation is pending. Ensure one pending mutation disables every specified initiator while retaining non-writing controls.
- **WARNING — Stale-anchor and resolved-record interaction contracts are incomplete.** For stale/unavailable comments, `ReviewPanel.vue:108-118` removes `Show comment`, although the contract requires it to focus the warning/announce no relocation; it also omits the disabled visible `Edit` reason. The resolved record at `142-149` lacks its anchor state badge and stale/unavailable read-only details.
- **WARNING — Conflict and drift recovery are only partial.** `ReviewPanel.vue:90-93` exposes a generic Reload button but not the revision values, retained-buffer reference, or post-reload explicit continuation. `SelectorDriftNotice.vue:25-35,56-62` copies only the pinned OID; moved current OIDs have no copy action, and the notice lacks the specified per-identity copy controls. The packaged test proves pinning/OIDs (`complete-review-draft.spec.ts:845-850,895-900`) but not those controls.
- **WARNING — Responsive behavior is contract-inaccurate.** `App.vue:540-557` sets the Review drawer at `max-width:1279px`, not the 1100px boundary; `styles.css:1297-1345` does not implement `min(360px, calc(100vw - 32px))` at tablet/small widths. The implementation preserves component instances, but the required responsive geometry and focus behavior are unproven.

---

## Registry Safety

`components.json` is absent and `03-UI-SPEC.md` explicitly authorizes no component registry. Registry audit: **not applicable; no third-party registry blocks to inspect.**

---

## Evidence and Human-Review Flags

- **Code evidence:** current Phase 3 frontend sources named below, compared with every `03-01`–`03-07` plan and summary, `03-CONTEXT.md`, `03-UI-SPEC.md`, and `03-VERIFICATION.md`.
- **Packaged browser evidence:** `tests/e2e/complete-review-draft.spec.ts` verifies real packaged lifecycle, safe Markdown preview, retained conflict buffers, byte-preserving recovery, and pinned drift. It is positive behavioral evidence only; it does not negate the source-level contract deviations above.
- **No live inspection:** no local server was available, and no visual screenshot was captured. Human review is required for all items marked **[HUMAN REVIEW]**, especially visual hierarchy, contrast, responsive breakpoints, 200% zoom, and keyboard/focus traversal.

## Files Audited

### Phase artifacts

- `.planning/phases/03-complete-review-draft/03-01-PLAN.md` through `03-07-PLAN.md`
- `.planning/phases/03-complete-review-draft/03-01-SUMMARY.md` through `03-07-SUMMARY.md`
- `.planning/phases/03-complete-review-draft/03-UI-SPEC.md`
- `.planning/phases/03-complete-review-draft/03-CONTEXT.md`
- `.planning/phases/03-complete-review-draft/03-VERIFICATION.md`

### Frontend and browser evidence

- `src/web/App.vue`, `src/web/styles.css`, `src/web/api/client.ts`
- `src/web/components/CommentsRail.vue`, `ReviewPanel.vue`, `SummarySection.vue`, `CommentComposer.vue`, `DraftRecovery.vue`, `SelectorDriftNotice.vue`, `DiffWorkspace.vue`, `ReviewToolbar.vue`
- `src/web/model/review-draft-state.ts`, `comment-groups.ts`, `markdown-preview.ts`, `selector-drift-state.ts`
- `tests/e2e/complete-review-draft.spec.ts`, `test-results/.last-run.json`
