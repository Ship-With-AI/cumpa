---
phase: 10-diff-reading-surface
status: secured
asvs_level: 1
threats_total: 17
threats_open: 0
verified: 2026-09-13
---

# Phase 10 Security Audit — Diff Reading Surface

## Scope and method

This audit verifies the five declared `<threat_model>` registers against the Phase 10 implementation range `c6cb768^..HEAD`. Source, styles, and the range diff were inspected; no source or test files were changed.

The plans declare ASVS L1 / V5 scope. No `<config>` block supplied a different `block_on` policy.

## Threat verification

| Threat ID | Category | Disposition | Status | Code evidence |
| --- | --- | --- | --- | --- |
| T-10-01 | Tampering | mitigate | CLOSED | The sole Phase 10 construction call receives a literal option object at `src/web/monaco/diff-adapter.ts:123-143`; no option in that object comes from file content, URL, or input. |
| T-10-02 | Information disclosure | mitigate | CLOSED | The Phase 10 theme addition is `editorLink.activeForeground: color('--diff-hunk-foreground')` at `src/web/monaco/theme.ts:70`. The theme’s canonical token conversion is the only producer used for this added color (`theme.ts:7-11`). |
| T-10-03 | Elevation of privilege | mitigate | CLOSED | Immutable review disables the two action-like Monaco affordances in the creation options: `renderGutterMenu: false` and `renderMarginRevertIcon: false` at `src/web/monaco/diff-adapter.ts:141-142`. |
| T-10-04 | Spoofing | mitigate | CLOSED | `visibleSides` produces only the two fixed name pairs at `src/web/components/DiffWorkspace.vue:51-55`; `syncSideNames()` passes those fixed values at `:73-77`; the adapter applies them through Monaco `updateOptions`, not HTML parsing, at `src/web/monaco/diff-adapter.ts:193-196`. |
| T-10-05 | Tampering | mitigate | CLOSED | `setCodeDensity` accepts only the three-name union and indexes the fixed `CODE_DENSITIES` map before calling `updateOptions` (`src/web/monaco/diff-adapter.ts:189-191`). Viewport state selects only `wide`, `compact`, or `default` (`DiffWorkspace.vue:80-83`). |
| T-10-06 | Denial of service | mitigate | CLOSED | The two `MediaQueryList` listeners acquired at `src/web/components/DiffWorkspace.vue:294-298` are removed with the same callback during `onBeforeUnmount` at `:304-308`; repeated component navigation cannot accumulate these handlers. |
| T-10-07 | Tampering | mitigate | CLOSED | Hidden-region Phase 10 paint uses canonical token references only: `var(--surface-gap)`, `var(--border-gap)`, and `var(--diff-hunk-background)` at `src/web/styles.css:2770-2781`. |
| T-10-08 | Tampering | mitigate | CLOSED | `git diff --name-only c6cb768^..HEAD -- scripts/verify-semantic-css.mjs` returned no path: the semantic-CSS control was not altered by the phase. |
| T-10-09 | Repudiation | mitigate | CLOSED | Phase CSS styles Monaco’s existing `.top`/`.bottom` controls only with paint properties at `src/web/styles.css:2770-2787`; it neither hides them nor replaces their native text/count or accessible control name. The removed `.center` override returns center-band ownership to the Monaco theme rather than creating a replacement affordance. |
| T-10-10 | Tampering | mitigate | CLOSED | Boundary decorations are appended only after the existing Monaco-derived ranges are mapped, filtered, clamped, and merged (`src/web/monaco/diff-semantics.ts:62-70`), then use those ranges at `:94-106`; raw line changes are not re-derived for the boundary classes. |
| T-10-11 | Spoofing | mitigate | CLOSED | The forced-colors block explicitly repaints both boundary borders with `CanvasText` at `src/web/styles.css:2928-2931`. |
| T-10-12 | Tampering | mitigate | CLOSED | `git diff --name-only c6cb768^..HEAD -- scripts/verify-semantic-css.mjs` returned no path: the semantic-CSS gate was not weakened for the border implementation. |
| T-10-13 | Denial of service | mitigate | CLOSED | Both boundary selectors use `box-sizing: border-box` with a one-pixel border at `src/web/styles.css:2732-2740`, preventing the added boundary paint from increasing the line box / paired-zone geometry. |
| T-10-14 | Information disclosure | mitigate | CLOSED | The label row is a 37px canvas track (`src/web/styles.css:1684-1692`) and its labels use the contracted `9px 18px` padding at `:1702-1712`; primary side identity is not clipped by the old track. |
| T-10-15 | Spoofing | mitigate | CLOSED | Side identity remains literal `REMOVED` / `ADDED` text in `src/web/components/DiffWorkspace.vue:317-325`; rails retain dashed-versus-solid structure at `src/web/styles.css:2923-2938` and signs/boundaries are forced to `CanvasText` at `:2928-2944`. |
| T-10-16 | Denial of service | mitigate | CLOSED | The canvas has its 640px minimum inside `.diff-workspace__viewport` (`src/web/styles.css:1676-1692`), whose `overflow-x: auto` confines horizontal scrolling to the diff surface. |

## Accepted risks

| Threat ID | Disposition | Status | Evidence |
| --- | --- | --- | --- |
| T-10-SC | accept | CLOSED | This ID is declared identically in plans 01–05. `git diff --name-only c6cb768^..HEAD -- package.json package-lock.json` and `git diff --stat c6cb768^..HEAD -- package.json package-lock.json` both produced no output: Phase 10 added no dependency or lockfile change. The pre-existing Package Legitimacy Audit records the no-install constraint at `.planning/phases/10-diff-reading-surface/10-RESEARCH.md:45-49`. |

## Focused adversarial checks

### Repository-derived labels and titles

- Monaco’s dynamic accessible name is built exclusively from the fixed `visibleSides` constants and passed through Monaco’s `updateOptions()` API (`DiffWorkspace.vue:51-55,73-77`; `diff-adapter.ts:193-196`). It is not passed to `innerHTML`, `outerHTML`, `insertAdjacentHTML`, or `v-html`; those APIs have no match in the audited source set.
- The workspace section does interpolate the repository-derived `path`, but only through Vue’s `:aria-label` attribute binding at `DiffWorkspace.vue:314`, not an HTML sink. The path display itself is Vue mustache text interpolation in `src/web/components/ui/PathText.vue:16-17`.
- The only new button title/aria label is composed from the same fixed side names and numeric line number at `DiffWorkspace.vue:335-336`. Its CSS tooltip reads that already-safe attribute (`src/web/styles.css:1739-1756`); no repository path or ref string reaches that title.

### Monaco decoration class sinks

The new boundary classes are fixed string literals: `monaco-diff-hunk-start` and `monaco-diff-hunk-end` (`src/web/monaco/diff-semantics.ts:94-106`). Existing rail/sign template values use `suffix`, which is determined by `side === 'base' ? 'base' : 'head'` (`:67,75,81,89`), not file content. No decoration class is derived from a path, ref, or reviewed bytes.

### `!important` and accessibility affordances

The Phase 10 stylesheet delta introduced `!important` only for Monaco hidden-region edge-control paint: background/border at `src/web/styles.css:2770-2780`. It added none to focus, forced-colors, or visibility rules. The focus ring remains explicitly present at `:2802-2806` and is repaired for forced colors at `:2950-2953`; no specificity conflict hides either affordance.

## Threat flags

None. None of `10-01-SUMMARY.md` through `10-06-SUMMARY.md` contains a `## Threat Flags` section or an unmapped threat flag.

## Result

**SECURED — 17/17 unique declared threat IDs closed; 0 open threats; 0 unregistered flags.**
