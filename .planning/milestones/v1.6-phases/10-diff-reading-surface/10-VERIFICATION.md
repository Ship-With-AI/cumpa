---
phase: 10-diff-reading-surface
verified: 2026-09-13T17:16:40Z
status: passed
score: 29/29 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification_closed_by: .planning/phases/10-diff-reading-surface/10-UI-REVIEW.md (live CLI session, 2026-09-13; 7/7 checks passed, score 24/24)
human_verification:
  - test: "Compare the running diff surface with the approved quiet reference at desktop, full-desktop, and mobile widths."
    expected: "Base/Head (or Preimage/Postimage), quiet changed-line groups, rails/signs, collapsed-context affordances, and localized horizontal scrolling read clearly without page-level horizontal movement."
    why_human: "Computed-style and Playwright geometry checks prove the specified channels and dimensions, but cannot establish overall visual equivalence or subjective readability against the approved reference images."
    result: "PASSED — verified live at 1440x900, 1650x900, and 420x900 against a real two-hunk CLI session; screenshots under .planning/ui-reviews/10-20260913-live/."
---

# Phase 10: Diff Reading Surface — Verification Report

**Phase Goal:** Reviewers read the same Monaco-authoritative comparison through the mockup's quieter, explicit Base/Head diff treatment.

**Verified:** 2026-09-13T17:16:40Z  
**Status:** human_needed  
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Production diffs remain Monaco-rendered and Monaco-mapped, including syntax and comment anchors. | ✓ VERIFIED | `src/web/monaco/diff-adapter.ts:123-143` has the sole `createDiffEditor` construction; `:467-482` passes only `getLineChanges()` into `buildDiffDecorations`. `src/web/monaco/diff-semantics.ts:53-108` only projects those `ILineChange[]` ranges. Browser test 9 verifies separate Monaco languages and immutability at `tests/integration/monaco-anchor.spec.ts:193-202`; tests 10 and 11c exercise repeated diff updates and paired zones. Full browser run passed all Phase 10 tests. |
| 2 | Explicit source-correct labels, removed/added text, rails/signs, Monaco fills, hunk boundaries, and hidden-region affordances communicate the quiet treatment without colour alone. | ✓ VERIFIED | `DiffWorkspace.vue:51-84,314-325` supplies Base/Head or Preimage/Postimage plus `− REMOVED`/`+ ADDED`; `styles.css:2700-2787` supplies dashed/solid rails, signs, flat empty fill, boundaries, and context-edge states. `responsive-session.spec.ts:1190-1260` passes forced-colors checks for text, rail styles, signs, and boundary borders. `monaco-anchor.spec.ts:217-318` verifies real Monaco paint, native hidden count/control, and boundary paint. |
| 3 | Expandable context, side-by-side geometry, paired comment alignment, a 640px canvas, and local horizontal overflow remain intact. | ✓ VERIFIED | The adapter pins `hideUnchangedRegions`, `renderSideBySide: true`, inline fallback off, and word wrap off at `diff-adapter.ts:123-143`. `styles.css:1676-1720` keeps overflow on `.diff-workspace__viewport` and `min-width: 640px` on the shared canvas. `anchored-workspace.spec.ts:1178-1270` passes the 320–1440 width matrix, localized-overflow canary, both-side reachability, 640px minimum, no-reflow anchor check, and paired-zone equality. |
| 4 | Desktop, full-desktop, and mobile keep the diff readable without document-level horizontal overflow. | ✓ VERIFIED | Browser coverage uses 1650px and 720px code-density assertions (`responsive-session.spec.ts:1032-1041`) and 1440, 1280, 1100, 1099, 768, 767, 640, and 320px geometry checks (`anchored-workspace.spec.ts:1182-1249`). Every in-scope browser spec passed in the full run; its 97 passing tests include the responsive and anchored-workspace suites. |
| 5 | No interactive gutter-menu lane is rendered. | ✓ VERIFIED | Construction pins `renderGutterMenu: false` in `diff-adapter.ts:141`; its unit assertion is `monaco-diff-adapter.test.ts:119-134`; real Monaco assertion `monaco-anchor.spec.ts:259-269` observes zero gutter elements. |
| 6 | Monaco never falls back to inline single-pane diff, including a zero-width host. | ✓ VERIFIED | `renderSideBySide: true`, breakpoint `0`, and `useInlineViewWhenSpaceIsLimited: false` are in the sole construction literal (`diff-adapter.ts:134-138`) and unit-pinned at `monaco-diff-adapter.test.ts:119-134`. The real-browser test asserts visible Base and Head panes (`monaco-anchor.spec.ts:262-267`). |
| 7 | Long code lines retain horizontal scrolling rather than soft wrap. | ✓ VERIFIED | `diffWordWrap: 'off'` is construction-time Monaco configuration at `diff-adapter.ts:127` and unit-pinned at `monaco-diff-adapter.test.ts:121-133`; the 320px browser test requires local viewport scroll width to exceed client width while the document remains at scroll position zero (`anchored-workspace.spec.ts:1213-1249`). |
| 8 | Hidden-region hover uses the canonical hunk foreground, not an unthemed blue. | ✓ VERIFIED | `theme.ts:70` maps `editorLink.activeForeground` through canonical tokens; exhaustive parity coverage is in `monaco-theme.test.ts:20-104`. Real Monaco hover checks the codicon against `--diff-hunk-foreground` at `monaco-anchor.spec.ts:271-296`. |
| 9 | Every painted Monaco theme key remains byte-identical to the canonical root. | ✓ VERIFIED | `theme.ts:64-106` uses `color()` for the map; `monaco-theme.test.ts:20-145` enforces exhaustive key-set equality and token-byte equality. `npm run test:unit` passed 29 files / 186 tests. |
| 10 | Exact-patch screen-reader labels say preimage/postimage rather than base/head. | ✓ VERIFIED | `visibleSides` is the sole mapping authority (`DiffWorkspace.vue:51-55`) and is wired through `syncSideNames()` to child Monaco editors (`:73-78,279,293-309`). The actual browser accessible-name assertion is `selector-drift-ui.spec.ts:458-460`. |
| 11 | Monaco code density is 14/28 wide, 13/26 default, and 12/24 mobile, through public options. | ✓ VERIFIED | Token-derived density payloads are in `diff-adapter.ts:74-92,189-191`; component-owned media queries are balanced with teardown at `DiffWorkspace.vue:294-308`. Unit payload assertions are at `monaco-diff-adapter.test.ts:91-117`; rendered Monaco assertions are at `responsive-session.spec.ts:1032-1041`. |
| 12 | The hidden-region band has exactly one paint authority and edge affordances have quiet rest/hover states. | ✓ VERIFIED | Theme owns the band (`theme.ts:91-94`); app CSS targets only `.top`/`.bottom` edge controls and breadcrumb hover (`styles.css:2769-2787`). Real browser checks band foreground/background, edge rest/hover paint, native count, and control name (`monaco-anchor.spec.ts:271-296`). |
| 13 | Every changed Monaco range has start/end boundaries; adjacent ranges are not independently re-diffed or merged beyond the existing merge. | ✓ VERIFIED | `buildDiffDecorations` first merges Monaco-provided ranges, then appends one start/end whole-line decoration inside the existing range loop (`diff-semantics.ts:62-108`). Exhaustive unit fixtures cover side ownership, insertion/deletion, short blocks, touching/overlapping range merging, and clamping (`monaco-diff-semantics.test.ts:34-205`). |
| 14 | Hunk boundaries add zero line height and preserve paired comment zones. | ✓ VERIFIED | Boundary rules use border-box 1px paint at `styles.css:2732-2740`; real Monaco compares boundary and interior computed heights, then creates a head comment and verifies paired zones (`monaco-anchor.spec.ts:298-318`). |
| 15 | Boundary cues remain visible in forced-colors mode. | ✓ VERIFIED | The terminal forced-colors block repairs both boundary borders with `CanvasText` (`styles.css:2928-2931`); the browser checks both resolved border colours under forced colors (`responsive-session.spec.ts:1210-1243`). |
| 16 | Side labels are never clipped and remain in the same locally scrollable canvas as Monaco. | ✓ VERIFIED | Canvas track is `37px`, label padding `9px 18px`, and both are nested inside the viewport at `styles.css:1676-1720`; template nesting is `DiffWorkspace.vue:314-326`. Browser assertions pin 36px child / 37px row geometry (`responsive-session.spec.ts:588-604`) and 320px label reachability (`anchored-workspace.spec.ts:1213-1249`). |
| 17 | No element outside the diff viewport owns horizontal overflow. | ✓ VERIFIED | Overflow is assigned to `.diff-workspace__viewport` (`styles.css:1676-1682`). At each tested viewport, the browser excludes the viewport itself and requires every other `.review-main` descendant to fit (`anchored-workspace.spec.ts:1203-1211`). |
| 18 | The 640px canvas and paired comment-zone alignment remain intact. | ✓ VERIFIED | CSS retains `min-width: 640px` (`styles.css:1684-1692`); browser checks minimum width, zone vertical delta ≤1px, and equal zone heights (`anchored-workspace.spec.ts:1211,1267-1270`). |
| 19 | No new custom diff renderer, line mapper, syntax highlighter, or dependency was introduced. | ✓ VERIFIED | The phase delta contains only the Monaco adapter/theme/semantics, one existing diff component, CSS, prototype fixture, and tests; no package manifest or lockfile changed. `diff-semantics.ts:53-108` consumes only Monaco `ILineChange[]`; no Phase 10 source delta adds an alternate renderer or syntax path. |
| 20 | No Phase 11–12 shell, dialog, comments-rail, or mobile-files-flow restyle was performed. | ✓ VERIFIED | `git diff --name-only c6cb768^..HEAD` limits source changes to `DiffWorkspace.vue`, Monaco modules, the existing prototype, and `styles.css`; the stylesheet delta contains only label/canvas and Monaco diff rules. The changed Phase 10 component/Monaco sources have no dialog, comments-rail, shell, or files-flow references. |
| 21 | No orphan token, stray colour literal, or gradient was introduced. | ✓ VERIFIED | `npm run verify:semantic-css` completed successfully after a fresh Vite build. This gate covers canonical-token consumption, author-style literals, gradients, and forced-colors placement; its success is independently supported by `theme.ts:64-106` using `color()` and Phase 10 CSS using token references in `styles.css:2700-2931`. |

**Score:** 29/29 must-haves verified (0 present-but-behavior-unverified)

### Required Artifacts and Wiring

| Artifact | Expected | Status | Wiring evidence |
| --- | --- | --- | --- |
| `src/web/monaco/diff-adapter.ts` | Sole public Monaco diff surface: immutable options, responsive density, source labels, refresh path. | ✓ VERIFIED | Constructed by `DiffWorkspace.vue:293`; `setSideNames`/`setCodeDensity` are invoked there; `onDidUpdateDiff` refreshes decorations and anchor layout. |
| `src/web/monaco/theme.ts` | Canonical-token Monaco paint map. | ✓ VERIFIED | Imported by the adapter and applied immediately before `createDiffEditor` (`diff-adapter.ts:122-123`); exhaustive theme test validates root bytes. |
| `src/web/monaco/diff-semantics.ts` | Monaco-line-change projection to rails, signs, and boundaries. | ✓ VERIFIED | Imported and called only by adapter refresh (`diff-adapter.ts:467-482`); class names match CSS rules. |
| `src/web/components/DiffWorkspace.vue` | Visible source labels, canvas/viewport hierarchy, media-query listener ownership. | ✓ VERIFIED | Receives live props, constructs/disposes adapter, observes `visibleSides`, and renders the labels and Monaco host in the shared canvas. |
| `src/web/styles.css` | Local overflow, label geometry, rails, signs, boundary, context, forced-colors styling. | ✓ VERIFIED | Selectors match template and Monaco decoration class names; computed-style browser tests exercise all Phase 10 rules. |
| `tests/unit/monaco-{diff-adapter,diff-semantics,theme}.test.ts` | Option, decoration, and theme parity contracts. | ✓ VERIFIED | Included in the passing unit suite (29 files / 186 tests). |
| `tests/integration/monaco-anchor.spec.ts` | Real Monaco authority, paint, geometry, anchor and zone regression proof. | ✓ VERIFIED | Included in the full browser run; all tests 74–88 passed, including 11a–11c. |
| `tests/e2e/responsive-session.spec.ts` and `tests/integration/anchored-workspace.spec.ts` | Responsive density, non-colour cues, forced-colors, overflow and paired-zone proof. | ✓ VERIFIED | Both passed in the full browser run (tests 31 and 50–62); source asserts all listed geometry/forced-colors contracts. |
| `tests/integration/selector-drift-ui.spec.ts` | Exact-patch Monaco accessible name. | ✓ VERIFIED | Passed in full browser run (tests 89–94); source asserts the actual Monaco textbox name. |

### Data-Flow Trace

| Artifact | Data / event | Source | Result | Status |
| --- | --- | --- | --- | --- |
| `DiffWorkspace.vue` | `props.sourceKind` → `visibleSides` → `syncSideNames()` | Live workspace props | Source-correct names are pushed to both Monaco editors and rendered in the label row. | ✓ VERIFIED |
| `DiffWorkspace.vue` | `matchMedia` state → `syncCodeDensity()` | Browser viewport | A fixed wide/default/compact payload reaches `IStandaloneDiffEditor.updateOptions()`. | ✓ VERIFIED |
| `diff-adapter.ts` | `IStandaloneDiffEditor.getLineChanges()` | Monaco's actual comparison | Existing model decoration collections receive only mapped Monaco ranges. | ✓ VERIFIED |
| `theme.ts` | `virtual:cumpa-tokens` → `color()` | Canonical first `:root` token source | Theme values are supplied to Monaco and compared byte-for-byte by unit and browser tests. | ✓ VERIFIED |

### Behavioral Spot-Checks

| Command | Result |
| --- | --- |
| `npm run test:unit` | Passed: 29 files, 186 tests. |
| `npm run test:git` | Passed: 9 files, 69 tests. |
| `npm run test:api` | Passed: 19 files, 142 tests. |
| `npm run verify:semantic-css` | Passed after a fresh web build. |
| `npm run typecheck:web` | Passed (exit 0). |
| `npm run build` | Passed (runtime and web build). |
| `npm run test:browser` | 97 passed. Two expected external-environment failures: `marketplace-review.spec.ts` requires `CUMPA_MARKETPLACE_URL_MARKER`; `public-support-states.spec.ts` requires `CUMPA_RUNTIME_CUSTODY_DIR`. No Phase 10 browser test failed. |

### Requirements Coverage

| Requirement | Source plans | Status | Evidence |
| --- | --- | --- | --- |
| DIFF-01 — Monaco remains sole diff authority. | 10-01, 10-02, 10-04 | ✓ VERIFIED | Sole Monaco construction and `getLineChanges()` projection; syntax/immutability and anchor/zone browser tests pass; no added dependency or alternate renderer in phase delta. |
| DIFF-02 — quiet diff treatment is explicit and non-colour-dependent. | 10-01, 10-03, 10-04, 10-05 | ✓ VERIFIED | Labels, signs, rails, fills, native hidden context and hairline boundaries are live; forced-colors tests verify redundant structural/text cues. |
| DIFF-03 — expandable context, split geometry, and local overflow continue. | 10-01, 10-02, 10-03, 10-05 | ✓ VERIFIED | Native collapsed controls remain, responsive Monaco options stay public, shared 640px canvas is locally scrollable, and multi-width paired-zone/no-overflow browser tests pass. |

### Adversarial Checks

| Risk checked | Result |
| --- | --- |
| A read-only revert-arrow test could falsely prove `renderMarginRevertIcon: false`, because `readOnly` already hides it. | Not relied on alone: unit test `monaco-diff-adapter.test.ts:119-134` directly asserts the option; browser test is retained only as a regression canary. |
| Source-correct `ariaLabel` could be present but not reach rendered Monaco. | Browser test reads the actual Monaco textbox accessible name (`selector-drift-ui.spec.ts:458-460`), confirming child-editor public-option wiring. |
| Boundary borders could visibly paint yet alter line metrics and mis-anchor comments. | Real Monaco test compares a boundary line's computed height with an interior line, then inserts a comment and checks paired zones (`monaco-anchor.spec.ts:298-318`). |
| A visual restyle could smuggle a custom renderer, new palette, gradient, or later-phase shell work. | Phase delta scope, semantic CSS gate, theme parity test, and source scans found none. |

### Anti-Patterns Found

None. The phase adds no dependency, second renderer, hand-written line mapping, syntax highlighter, gradient, raw component colour palette, or Phase 11–12 surface restyle.

## Human Verification Required

### 1. Approved-reference visual comparison

**Test:** Open a representative range and exact-patch comparison at desktop, full-desktop, and narrow/mobile widths; compare it with the approved quiet workspace references. Scroll the diff canvas horizontally at narrow width and reveal an unchanged region with Monaco's native control.

**Expected:** Both panes retain explicit source identity and readable changed/unchanged grouping; label movement remains aligned with panes; the page itself never scrolls horizontally; hidden-context affordances and rails/signs remain legible and quiet.

**Why human:** The automated suite proves rendered values, geometry, accessibility names, and non-colour channels, but a human must approve overall visual equivalence and readability against the visual reference.

## Gaps Summary

No implementation gaps found. The two failures from the unfiltered browser command are the explicitly documented external prerequisite failures and are unrelated to Phase 10. Automated evidence supports DIFF-01, DIFF-02, and DIFF-03; only visual-reference sign-off remains.

---

_Verified: 2026-09-13T17:16:40Z_  
_Verifier: Verify10 (gsd-verifier)_
