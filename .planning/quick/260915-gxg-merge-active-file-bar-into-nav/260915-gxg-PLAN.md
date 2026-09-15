---
phase: quick
plan: 260915-gxg
type: execute
wave: 1
depends_on: []
files_modified:
  - src/web/components/ActiveFileToolbar.vue
  - src/web/components/ReviewToolbar.vue
  - src/web/App.vue
  - src/web/styles.css
  - tests/e2e/responsive-session.spec.ts
  - tests/e2e/pinned-session.spec.ts
  - tests/integration/anchored-workspace.spec.ts
autonomous: true
requirements:
  - QUICK-260915-GXG
must_haves:
  truths:
    - "The review surface shows one bar between the identity header and the diff: active filename, its status and +/- counts, the Files toggle, then File navigation, Change navigation, Review and Keyboard help."
    - "The active filename is a visible level-1 heading with id cumpa-heading, so 'Skip to diff', main's aria-labelledby, and post-dialog heading focus keep working (per CONTEXT: Active file name — LOCKED)."
    - "The Files toggle keeps its copy (Files / Show files / Hide files), its labels (Open changed files / Show changed files sidebar / Hide changed files sidebar), its conditional aria-controls and aria-expanded, and remains the element focusFilesToggle() focuses."
    - "No Base/Head or Preimage/Postimage endpoint block is rendered inside the review main; the identity header stays the only place showing endpoint labels and short oids (per CONTEXT: Base/Head endpoint blocks)."
    - "Nothing overflows the document at 320, 640, 759, 760, 761, 1050, 1051 and 1440 CSS px, and the review bar still exposes exactly three .review-toolbar__group containers."
    - "No orphaned symbol, prop, import, CSS rule or media-query rule from the removed context bar survives anywhere in src/web."
    - "At 320 px with the renamed-file fixture active, the h1#cumpa-heading box is a single text row (height <= 32px): the merged bar is shorter than the two bars it replaces, not a wrapped multi-line block (per CONTEXT: Active file name - LOCKED, 'compact')."
  artifacts:
    - path: "src/web/components/ActiveFileToolbar.vue"
      provides: "Slotted active-file block (heading, status, counts, Files toggle) that exposes focusFilesToggle and focusHeading"
      contains: "review-toolbar__active-file"
    - path: "src/web/components/ReviewToolbar.vue"
      provides: "Single merged bar: slot for the active-file block plus the three existing navigation/action groups"
      contains: "<slot />"
    - path: "src/web/App.vue"
      provides: "One bar in review-main: ReviewToolbar wrapping ActiveFileToolbar, ref preserved"
      contains: "ref=\"activeFileToolbar\""
    - path: "src/web/styles.css"
      provides: "Merged bar styling on .review-toolbar and .review-toolbar__active-file; two-row .review-main grid"
      contains: "review-toolbar__active-file"
  key_links:
    - from: "src/web/App.vue"
      to: "src/web/components/ActiveFileToolbar.vue"
      via: "ActiveFileToolbar rendered inside ReviewToolbar's default slot, ref=\"activeFileToolbar\" retained for focusFilesToggle()/focusHeading()"
      pattern: "<ActiveFileToolbar[\\s\\S]*ref=\"activeFileToolbar\""
    - from: "src/web/App.vue"
      to: "src/web/components/ActiveFileToolbar.vue"
      via: "main[aria-labelledby=cumpa-heading] resolves to the h1 the component still renders"
      pattern: "id=\"cumpa-heading\""
    - from: "src/web/styles.css"
      to: "src/web/components/ReviewToolbar.vue"
      via: ".review-toolbar owns the bar chrome (border, background, padding) that .active-file-toolbar__review used to provide"
      pattern: "^\\.review-toolbar \\{"
---

<objective>
Delete the `.active-file-toolbar__context` bar and merge its surviving controls — the visible
`h1#cumpa-heading` with its status/counts, and the Files toggle — into the existing
`.review-toolbar` bar that already carries file navigation, change navigation, Review and
Keyboard help. The Base/Head (and Preimage/Postimage) endpoint blocks are deleted outright;
`IdentityHeader` already shows that information.

Purpose: one bar instead of two above the diff, without losing the level-1 heading contract or
the Files toggle behavior.
Output: a single merged bar, zero residue from the removed bar, and test assertions that are
either deleted (they pinned removed markup) or retargeted (they pin a surviving contract).
</objective>

<execution_context>
@/Users/alessandro/.agents/gsd-core/workflows/execute-plan.md
@/Users/alessandro/.agents/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/quick/260915-gxg-merge-active-file-bar-into-nav/260915-gxg-CONTEXT.md
@src/web/components/ActiveFileToolbar.vue
@src/web/components/ReviewToolbar.vue
</context>

<design>
## Merged bar — exact DOM shape

`ReviewToolbar` owns the row; `ActiveFileToolbar` is slotted in as its first child. This keeps
the `activeFileToolbar` ref, `focusFilesToggle()` and `focusHeading()` wiring in `App.vue`
untouched (CONTEXT: Component boundary — prefer repurposing over deleting).

```
main.review-main[aria-labelledby=cumpa-heading]        <- grid-template-rows: auto minmax(0, 1fr)
└── div.review-toolbar[aria-label="Diff navigation"]    <- ReviewToolbar.vue, the only bar
    ├── div.review-toolbar__active-file                 <- ActiveFileToolbar.vue root (slotted)
    │   ├── h1#cumpa-heading[tabindex=-1][title=effectivePath]   <- PathDisplay basename / selectedPath
    │   ├── span.review-toolbar__status                 <- v-if selectedFile !== undefined
    │   ├── span.review-toolbar__counts                 <- v-if counts !== undefined  ("+12 −4")
    │   └── button.ui-button[ref=filesToggle]           <- Files / Show files / Hide files
    ├── div.review-toolbar__group[aria-label="File navigation"]      <- unchanged
    ├── div.review-toolbar__group[aria-label="Change navigation"]    <- unchanged
    └── div.review-toolbar__group.review-toolbar__group--actions     <- unchanged
└── (empty-state | diff-state | DiffWorkspace)
```

### Decision: the relocated controls are NOT a `.review-toolbar__group`

They form `.review-toolbar__active-file`, a plain layout div with no `aria-label` and no `role`.
Tradeoff: `.review-toolbar__group` stays at exactly 3, so
`tests/e2e/responsive-session.spec.ts:506` (`toHaveLength(3)`) and the group width/height loop
at `:507-510` need no change, and the new container does not repeat DEBT-01's
`aria-label`-without-`role` defect; the cost is that the block needs its own separator rule
instead of inheriting `.review-toolbar__group + .review-toolbar__group`, solved by widening
that rule to `.review-toolbar > * + *`. **The group count stays 3; no assertion update is
required for it.**

### Decision: filename position

Order inside `.review-toolbar__active-file` is heading, status, counts, Files toggle — the
filename and its metadata sit left of the Files button, matching the LOCKED "Compact in the
nav bar" choice, and preserving the existing relative order of those four nodes.
Tradeoff: the heading keeps `--font-size-page-heading` (21px) so the typography contract at
`responsive-session.spec.ts:996-1002` survives; the cost is the bar row is as tall as **one**
21px/31.5px heading line rather than the 30px compact-control height. One line, never more —
see "Decision: the heading truncates on one line" below.

### Decision: the heading truncates on one line, it never wraps

`.path-display` is `flex-wrap: wrap` with `overflow-wrap: anywhere` (`styles.css:1121-1128`),
`.path-display__old`/`__new` repeat `overflow-wrap: anywhere` (`:1130-1135`), and so does
`.path-text` (`:1142-1146`); `PathDisplay.vue:32-41` renders old + `→` + new for renamed files.
Carrying the deleted `.active-file-toolbar__file h1` **wrap** treatment into the bar would
therefore let the heading grow to 2-3 line boxes of 31.5px. The repo's own fixture drives
exactly that case: `responsive-session.spec.ts:1196-1199` asserts the heading shows
`beta-before-a-very-long-rename.ts → beta-after-a-very-long-rename.ts` (~66 characters) and the
`phase08Widths` loop that precedes it ends on 320px (`:60`), so the merged bar would render
~3 rows tall — TALLER than the two bars it replaces, a direct violation of the LOCKED
"compact" decision, and invisible to every existing gate (they measure horizontal fit or
computed font properties, never box height).

So inside the bar the heading is a single-line, ellipsised box; the full path stays reachable
through the `title` (already this plan's stated fallback). Scoped to the bar so no other
`.path-display` consumer (file tree, comments rail, receipts) changes behavior:
- `.review-toolbar__active-file h1 { min-width: 0; overflow: hidden; }`
- `.review-toolbar__active-file .path-display { flex-wrap: nowrap; }`
- `.review-toolbar__active-file .path-display__old`, `… .path-display__new`, `… .path-text`
  get `overflow: hidden; text-overflow: ellipsis; white-space: nowrap; overflow-wrap: normal;`

`flex: 1 1 auto` on `.path-display__old`/`__new` (`styles.css:1130-1134`) needs NO change: its
`flex-shrink: 1` plus the existing `min-width: 0` (`:1132`, and `:1143` for `.path-text`) is
precisely what lets those boxes shrink below content width so `text-overflow: ellipsis` can
engage. `overflow: hidden` on the `h1` clips descendants only, not the `h1`'s own focus
outline, so `focusHeading()`'s ring is unaffected (and no spec measures it —
`expectFocusIndicatorUnclipped` is only ever applied to links and buttons).
Falsified or confirmed by the single height gate in Task 2.

### Decision: the directory path is dropped as a visible node, preserved as the heading `title`

`p.active-file-toolbar__directory` is deleted; `h1#cumpa-heading` gains
`:title="effectivePath"` (full path, e.g. `00-src/components/alpha.ts`).
Tradeoff for each option considered:
- **Survives as a visible `<p>`** — rejected: a second text line forces the single-row bar into
  two rows at every width, contradicting "compact".
- **Dropped entirely** — rejected: the only remaining full-path affordance would be the file
  tree, and two existing assertions (`responsive-session.spec.ts:876`,
  `anchored-workspace.spec.ts:545`) cover real information, not markup.
- **Chosen: `title` on the heading** — one attribute, full path on hover, no layout cost.
  `title` is last-resort in accessible-name computation, so it cannot displace the heading's
  name-from-content nor `main`'s `aria-labelledby` name; `pinned-session.spec.ts:1418-1421`
  and `anchored-workspace.spec.ts:541-544` already guard that and must keep passing unchanged.
  `:title` on the container was rejected because the tooltip would also cover the Files button.
  Note (advisory, no change): `PathDisplay.vue:34`/`:42` already put `:title` on
  `.path-display`, which covers the whole rendered heading text — so the `h1` `title` is not
  what creates hover-path access when a file is selected. It earns its place as the stable
  anchor for the retargeted `responsive-session.spec.ts:876` / `anchored-workspace.spec.ts:545`
  assertions and as the only full-path affordance when `selectedFile === undefined`
  (`ActiveFileToolbar.vue:57`); do not later delete it as redundant.

## Dead code that MUST be removed (clean cutover, no shims)

`src/web/components/ActiveFileToolbar.vue`:
- `isExactPatch` computed (`:21`) and the Preimage/Postimage template branch (`:77-86`)
- `pinnedSession` computed (`:22`) and the Base/Head template branch (`:87-98`)
- `baseShortOid` (`:31`) and `headShortOid` (`:37`)
- `directoryPath` (`:30`) and the `<p>` that consumed it (`:59`) — `effectivePath` survives as
  the heading `title` source
- the `controlSafeDisplay` import (`:5`) — orphaned once the endpoint blocks go
- the `session` prop (`:13`) — its only readers were `isExactPatch`/`pinnedSession` — and the
  now-unused `SessionResponse` type import (`:4`); `SessionFile` stays
- the `<header class="active-file-toolbar">` wrapper, the `.active-file-toolbar__context`,
  `__file`, `__title` and `__metadata` divs

`src/web/App.vue`:
- the `:session="session"` binding on `<ActiveFileToolbar>` (`:1267`)
- the `<div class="active-file-toolbar__review">` wrapper (`:1270`, `:1285`)

`src/web/styles.css` — delete every rule below; none has a remaining consumer:
- `.active-file-toolbar` (`:1534`), `.active-file-toolbar__context` (`:1540`)
- `.active-file-toolbar__endpoint--base` (`:1550`), `.active-file-toolbar__file` (`:1554`),
  `.active-file-toolbar__title` (`:1562`), `.active-file-toolbar__file h1` (`:1566`)
- the mono/metadata selector group at `:1571-1578` (`__directory`, `__counts`,
  `__endpoint-label`, `__endpoint-oid`) — its declarations fold into
  `.review-toolbar__counts`
- `.active-file-toolbar__directory` (`:1580`), `__metadata` (`:1588`), `__status` (`:1595`),
  `__counts` (`:1601`)
- `.active-file-toolbar__endpoint--head` (`:1605`), `__endpoint` (`:1610`),
  `__endpoint-label` (`:1616`), the `__endpoint-name, __endpoint-oid` group (`:1623`),
  `__endpoint-name` (`:1631`)
- `.active-file-toolbar__review` (`:1635`), `.active-file-toolbar__review .review-toolbar`
  (`:1641`), `.active-file-toolbar__review .ui-button` (`:1654`) — folded into
  `.review-toolbar` / `.review-toolbar .ui-button`
- `.active-file-toolbar__file h1` inside the heading typography group (`:345`) — replaced by
  `.review-toolbar__active-file h1`
- media rules: `.active-file-toolbar__context` at `:2537-2542` and at `:2707-2717` (both
  blocks), `.active-file-toolbar__endpoint--head` at `:2729-2731`
</design>

<tasks>

<task type="auto">
  <name>Task 1: Merge the active-file controls into the review bar and delete the context bar</name>
  <files>src/web/components/ActiveFileToolbar.vue, src/web/components/ReviewToolbar.vue, src/web/App.vue, src/web/styles.css</files>
  <action>
Build the merged bar exactly as specified in `<design>` "Merged bar — exact DOM shape", and
remove everything listed in `<design>` "Dead code that MUST be removed".

`ReviewToolbar.vue`: add `<slot />` as the first child of `div.review-toolbar`, before the
File navigation group. Nothing else in this component changes — same three groups, same
`aria-label` values, same props, emits, tooltips and shortcut copy. Do not add an
`aria-label` to any new container here (DEBT-01 stays out of scope, and must not be repeated).

`ActiveFileToolbar.vue`: the root element becomes `div.review-toolbar__active-file`
(the `<header>` element goes away — it was never a banner landmark because it lives inside
`<main>`, so `getByRole('banner')` keeps resolving to `IdentityHeader` only). Children, in
order: the existing `h1#cumpa-heading[tabindex="-1"]` (unchanged content: `PathDisplay`
`basename` when a file is selected, `selectedPath` otherwise) now carrying
`:title="effectivePath"`; a `span.review-toolbar__status` rendering
`selectedFile.status.kind` under `v-if="selectedFile !== undefined"`; a
`span.review-toolbar__counts`; and the existing Files toggle button verbatim — same `ref`,
`type`, `class="ui-button"`, `:aria-label="filesToggleLabel"`, conditional
`:aria-controls`/`:aria-expanded` on `filesHostVisible`, and `@click="emit('toggleFiles')"`.
Replace the deleted `__metadata` wrapper with a `counts` computed that returns the formatted
string (`+{additions} −{deletions}`, keeping the existing U+2212 minus sign) when
`selectedFile` is defined and both `additions` and `deletions` are non-null, and `undefined`
otherwise; render the span under `v-if="counts !== undefined"`. Use explicit
`!== null` / `!== undefined` comparisons, matching the file's existing style. `defineExpose`,
`focusFilesToggle`, `focusHeading`, `filesToggleCopy`, `filesToggleLabel`,
`filesHostVisible`, `effectivePath` and the `filesCollapsed`/`filesDrawer`/`selectedFile`/
`selectedPath` props all stay as they are.

`App.vue`: replace the two siblings inside `main.review-main` with one element — render
`<ReviewToolbar>` with its existing props and event bindings unchanged, and put
`<ActiveFileToolbar ref="activeFileToolbar" :files-collapsed :files-drawer :selected-file
:selected-path @toggle-files="toggleFiles" />` inside its default slot. Drop the
`:session="session"` binding and the `.active-file-toolbar__review` wrapper div. Leave the
skip links, `aria-labelledby="cumpa-heading"`, the `activeFileToolbar` ref declaration and
its three call sites (`:295`, `:865`, `:897`) untouched. Do not touch
`#changed-files` — it stays `v-show`, never `v-if`.

`styles.css`: set `.review-main` to `grid-template-rows: auto minmax(0, 1fr)` (one bar row
now, not two). Add a `.review-toolbar` block that absorbs the old wrapper chrome:
`box-sizing: border-box`, `width: 100%`, `min-width: 0`, `max-width: 100%`,
`flex-wrap: wrap` (see the min-content floor note below), `gap: var(--space-1)`,
`padding: var(--space-1) var(--space-2)`,
`border-bottom: 1px solid var(--border-default)`, `background: var(--surface-panel)`; the
`display: flex; align-items: center` it already gets from the shared group at `:364` stays.
Add `.review-toolbar .ui-button { min-height: var(--control-height-compact); }`. Add
`.review-toolbar__active-file` as `display: flex; min-width: 0; flex: 1 1 auto;
align-items: center; gap: var(--space-2);` with its Files toggle allowed to keep its
intrinsic width (`flex: 0 0 auto` on the button if needed). Add
the truncation treatment from `<design>` "Decision: the heading truncates on one line":
`.review-toolbar__active-file h1 { min-width: 0; overflow: hidden; }`,
`.review-toolbar__active-file .path-display { flex-wrap: nowrap; }`, and
`.review-toolbar__active-file .path-display__old, .review-toolbar__active-file
.path-display__new, .review-toolbar__active-file .path-text { overflow: hidden;
text-overflow: ellipsis; white-space: nowrap; overflow-wrap: normal; }`. Do NOT carry the
deleted `.active-file-toolbar__file h1` wrap declaration into the bar — inside this bar the
heading truncates, it does not wrap. Add
`.review-toolbar__active-file h1` to the page-heading typography group at `:345` in place of
the deleted selector (that group also supplies `margin: 0` and
`line-height: var(--line-height-page-heading)`, which the height gate depends on).
line-height) and `.review-toolbar__counts` (muted color plus the mono family, metadata
font-size and line-height inherited from the deleted shared group). Widen the separator rule
at `:1686` from `.review-toolbar__group + .review-toolbar__group` to `.review-toolbar > * + *`
so the File navigation group keeps a left divider now that a non-group sibling precedes it.
Move `flex-wrap: wrap` OUT of the `@media (max-width: 760px)` block and onto the base
`.review-toolbar` block above. Chosen over adding `min-width: 0` to
`.review-toolbar__status`/`__counts`: one declaration, and it lifts the floor for every flex
item at once instead of two. Reason: each `.review-toolbar__group` is `flex: 0 0 auto`
(`styles.css:1672-1675`), `.review-toolbar__label` only hides at ≤760px (`:2597-2599`), and
`__status`/`__counts` are flex items defaulting to `min-width: auto`, so a nowrap row has a
fixed min-content floor ([INFERENCE] ~690-700px, ±15%) uncomfortably close to the 761px
baseline. Base `flex-wrap: wrap` is a no-op at widths where the row fits and removes the floor
entirely. Leave the ≤760px rules intact: `.review-toolbar { flex-wrap: wrap; min-height: 48px }`
(its `flex-wrap` becomes redundant, its `min-height` does not),
`.review-toolbar__group--actions { margin-left: 0 }` and
`.review-toolbar__label { display: none }`.
  </action>
  <verify>
    <automated>npm run typecheck:web</automated>
    <automated>npm run build:web</automated>
  </verify>
  <done>
Both commands exit 0. `src/web` contains no occurrence of the legacy
`active-file-toolbar` class family (including `__context`, `__file`, `__title`,
`__directory`, `__metadata`, `__status`, `__counts`, `__endpoint`, `__endpoint-label`,
`__endpoint-name`, `__endpoint-oid`, `__review`) in any template, style or media-query rule;
no occurrence of `isExactPatch`, `pinnedSession`, `baseShortOid`, `headShortOid`,
`directoryPath`, the `controlSafeDisplay` import or the `SessionResponse` import inside
`ActiveFileToolbar.vue`; and no `:session` binding on `<ActiveFileToolbar>` in `App.vue`.
`main.review-main` has exactly two element rows: the merged bar and the diff surface.
`src/web/styles.css` has no `overflow-wrap: anywhere` declaration inside any
`.review-toolbar__active-file` rule, and `.review-toolbar` carries `flex-wrap: wrap` in its
base block, outside any media query.
  </done>
</task>

<task type="auto">
  <name>Task 2: Retarget or delete every assertion that pinned the removed bar, then prove the merged bar</name>
  <files>tests/e2e/responsive-session.spec.ts, tests/e2e/pinned-session.spec.ts, tests/integration/anchored-workspace.spec.ts</files>
  <action>
Apply the per-site decisions below. Rule: an assertion that pinned markup which no longer
exists and that a user cannot observe is DELETED; an assertion covering a contract that
survives relocation is RETARGETED, preferably to `#cumpa-heading` or a role locator rather
than to a new class name. Never re-pin a deleted implementation detail to a relocated
equivalent. Line numbers are as of commit `80c3b92`; re-read each site before editing.

`tests/e2e/pinned-session.spec.ts`
- `:1423-1425` — DELETE. `.active-file-toolbar__context` and its visible `Base`/`Head` text
  are gone by decision; endpoint display stays covered in the identity header by
  `tests/integration/selector-drift-ui.spec.ts:364` (`getByRole('banner')` containing
  `BASE … <oid>`). Leave `:1418-1421` (main accessible name, heading text, heading accessible
  name) exactly as-is — they are the guard that the new heading `title` changed no name.

`tests/e2e/responsive-session.spec.ts`
- `:448` — RETARGET to `page.locator('.review-toolbar')`. The locator is only an attach-wait
  host for the `expect.poll` at `:449` (the callback ignores the element argument);
  `.review-toolbar` is the merged bar, rendered exactly once (`ReviewToolbar.vue:25`, single
  call site in `App.vue`), and its uniqueness is guaranteed by the new `toHaveCount(1)` at
  `anchored-workspace.spec.ts:529`. Leaving `:448` as-is is NOT an option: the locator would
  never attach, `context.evaluate` would time out, and
  `expectPhase08ReflowAtCurrentWidth` would die at all eight phase08 widths.
- `:459-465` `rect` helper + `:486-490` `layout` + `:481-485` `headerOrder` +
  `:501-505` `expect(reflow.headerOrder).toEqual([...])` + **`:526-538`** — DELETE, together
  with the `headerOrder` and `layout` fields of `interface Phase08Reflow` at `:67-72`. They
  pinned the three-column `base | file | head` grid order and rects of a grid that no longer
  exists. `:526-538` is the five-assertion ordering ladder (`reflow.layout.base.left`,
  `.file.left`, `.head.left`, `.file.top`, `.base.top`, `.head.top`) plus its two `if` guards
  (`width >= 1051`, `width >= 761`) and their `return`s; it pins exactly the deleted
  three-column geometry. Deleting it is MANDATORY, not optional: Playwright transpiles without
  type-checking, so leaving it while `layout` leaves the `page.evaluate` payload throws
  `TypeError` on `reflow.layout.base` at every one of the eight phase08 widths. After removal
  `expectPhase08ReflowAtCurrentWidth` ends with the `width === 320` block closing at `:525`
  and `:539` closing the function. `reflow.layout` has no other reader in the file (verified:
  the only `reflow.` reads are `:496`, `:498-499`, `:501`, `:506-507`, `:511`, `:513` and
  `:528-538`).
  three-column `base | file | head` grid order and rects of a grid that no longer exists.
- `:506-510` — KEEP UNCHANGED. `.review-toolbar__group` is still exactly 3 by design (see
  `<design>`); the width/height loop still holds.
- `:876` — RETARGET. The directory `<p>` is gone; assert instead that `#cumpa-heading` carries
  `title="00-src/components/alpha.ts"` (the surviving carrier of full-path context for the
  fixture defined at `:204`). `:875` (`getByRole('heading', { level: 1 })` has text
  `alpha.ts`) stays unchanged.
- `:880-890` — RETARGET to `page.locator('#cumpa-heading')`, and collapse the two
  `expectRenderedContrast` calls (`:881-885`, `:886-890`) into one: they assert the identical
  contract on the identical element under two labels, so keeping both is padding.
- `:984-1002` — RETARGET the typography probe: replace the two duplicated
  `.active-file-toolbar__file h1` selector entries at `:985` with a single `#cumpa-heading`
  entry, and correspondingly replace the two duplicated expected rows at `:997-998` with one
  `['#cumpa-heading', pageHeading, '600', pageHeadingLineHeight, …]` row. The page-heading
  typography contract survives; the duplication does not.
- `:1093` (`['Skip to diff', 'cumpa-heading']`) — KEEP UNCHANGED; the skip-link target
  survives.
- `:1116` — RETARGET `.active-file-toolbar h1` to `#cumpa-heading`. The
  focus-the-heading-after-dialog-dismissal contract survives.
- `:1119`, `:1121`, `:1150`, `:1177`, `:1203` — RETARGET `.active-file-toolbar__file`
  `toContainText(...)` to `#cumpa-heading`. The "keyboard file navigation changes the active
  file" contract survives.
- `:1196` — RETARGET `.active-file-toolbar .path-display` to `#cumpa-heading .path-display`
  (rename arrow rendering survives).
- `:1199` — ADD the one compact-bar gate, immediately after the three rename assertions and
  before `:1201` restores 1440px. The `phase08Widths` loop at `:1181` ends on `320` (`:60` is
  `[1440, 1051, 1050, 761, 760, 759, 640, 320]`), so at `:1196-1199` the viewport is already
  320px with the renamed fixture (`beta-before-a-very-long-rename.ts →
  beta-after-a-very-long-rename.ts`, ~66 characters) in the heading — the worst case for the
  merged bar. Add exactly one assertion, no suite:
  `expect(await page.locator('#cumpa-heading').evaluate((element) => element.getBoundingClientRect().height)).toBeLessThanOrEqual(32);`
  Bound derivation: the heading box is one line box of `--line-height-page-heading` = **31.5px**
  (`styles.css:107`, applied by the page-heading typography group at `:345-358`, which also
  sets `margin: 0`), rounded up to 32 to absorb subpixel layout. Two lines measure 63px, three
  94.5px — so this assertion FAILS on any wrapping treatment and PASSES only with Task 1's
  truncation treatment. Do not gate `.review-toolbar`'s own height instead: `flex-wrap: wrap`
  makes a multi-row bar legitimate at narrow widths, so the `h1` box is the only clean compact
  signal.
- `:1660-1662` — DELETE the `headerOrder` key from the opt-in `CUMPA_TRUE_ZOOM` diagnostic
  `console.log` payload; it is a log of selectors that no longer resolve, not an assertion.

`tests/integration/anchored-workspace.spec.ts`
- `:469-474` — DELETE (endpoint labels and their `text-transform`).
- `:529-531` — RETARGET into a single-bar identity check: `header` becomes
  `page.locator('.review-toolbar')` with `toHaveCount(1)`, plus
  `expect(page.locator('#cumpa-heading')).toHaveCount(1)` (one bar, one level-1 heading — a
  real duplicate-render guard). DELETE the `.active-file-toolbar__context` count.
- `:532` — DELETE. `.active-file-toolbar__review` was a wrapper div, not observable behavior.
- `:533-538` — DELETE (Base/Head endpoint labels and their `text-transform`).
- `:539` — DELETE (base short oid `aaaaaaa`); still covered in the identity header by
  `tests/integration/selector-drift-ui.spec.ts:364`.
- `:540` — RETARGET, do NOT drop. `selector-drift-ui.spec.ts:364` covers the BASE label and the
  base short oid only, so deleting this line outright would leave no spec anywhere pinning the
  HEAD short oid. Retarget it to the identity header, mirroring `:364`'s shape:
  `await expect(page.getByRole('banner')).toContainText(new RegExp('HEAD\\s*head · bbbbbbb'));`
  (this spec's fixture head is `{ label: 'head', oid: 'b'.repeat(40) }`, `:57`). Re-read `:364`
  first and match its exact label/separator format.
- `:541-544` — KEEP UNCHANGED (renamed-file level-1 heading accessible name).
- `:545` — RETARGET to `#cumpa-heading` carrying `title="src/new/first.ts"`, mirroring the
  `responsive-session.spec.ts:876` decision.
- `:546-547` — RETARGET scope from the deleted `header` element to
  `page.locator('#cumpa-heading')` for `.path-display__old`/`.path-display__new`
  `.path-text__filename`.
- `:1259-1264` — DELETE, and rename the test at `:1251` so the title no longer advertises the
  removed labels (e.g. "preserves no-reflow Monaco semantic channels at every phase
  viewport"). The Monaco pane, geometry and overflow assertions from `:1265` on stay.

Do not add assertions beyond the retargets above. `tests/e2e/anchored-review.spec.ts:394`
(`getByRole('heading', { level: 1, name: 'src/changed.ts' })`) needs no change — verified
present and satisfied by the surviving visible `h1`.
  </action>
  <verify>
    <automated>npm run build:web && npx playwright test tests/integration/anchored-workspace.spec.ts</automated>
    <automated>npx playwright test tests/e2e/responsive-session.spec.ts</automated>
    <automated>npx playwright test tests/e2e/pinned-session.spec.ts</automated>
  </verify>
  <done>
All three specs pass. `assertNoPageOverflow` and the Phase 08 reflow matrix hold at 320, 640,
759, 760, 761, 1050, 1051 and 1440 px; `.review-toolbar__group` is still 3; the level-1
heading, its accessible names, the `main` accessible name, the skip-link target, the
heading-focus-after-dialog behavior and the six navigation/action controls' Tab order are all
unchanged. No spec references any `active-file-toolbar*` selector any more.
The compact-bar gate passes: at 320px with the renamed fixture `#cumpa-heading` measures
≤ 32px tall, and it fails if the heading wraps. The HEAD short oid is still pinned, now in the
identity header.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| session JSON → browser DOM | File paths, status kinds, branch labels and oids originate in the repository and are rendered as text/attributes |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-gxg-01 | Tampering | `h1#cumpa-heading` `title` attribute | mitigate | The `title` renders `effectivePath`, which flows through `PathDisplay`/session contracts already used for the heading text; Vue attribute binding escapes it, and no `v-html` is introduced |
| T-gxg-02 | Information disclosure | removal of Base/Head oid blocks | accept | Strictly less repository metadata is rendered; `IdentityHeader` remains the single, already-reviewed disclosure point |
| T-gxg-03 | Denial of service | merged-bar layout at 320px | mitigate | `.review-toolbar` keeps `flex-wrap: wrap` and the active-file block keeps `min-width: 0`, verified by `assertNoPageOverflow` at every responsive baseline |
| T-gxg-SC | Tampering | npm/pip/cargo installs | mitigate | No dependency is added or changed by this task; no install step exists to gate |
</threat_model>

<verification>
- `npm run typecheck:web` — no unused/dangling symbols from the removed bar.
- `npm run build:web` — Vite build of the merged bar succeeds.
- `npx playwright test tests/e2e/responsive-session.spec.ts` — responsive, overflow,
  typography, contrast, keyboard and navigation contracts at every baseline.
- `npx playwright test tests/e2e/pinned-session.spec.ts` — heading text and accessible names
  for renamed paths with control bytes.
- `npx playwright test tests/integration/anchored-workspace.spec.ts` — single-bar identity,
  renamed-path heading, navigation control geometry, Monaco no-reflow matrix.
</verification>

<success_criteria>
- One bar renders between the identity header and the diff, containing the active filename
  heading, status, counts, Files toggle, File navigation, Change navigation, Review and
  Keyboard help — in that order.
- `h1#cumpa-heading` is visible, focusable, level 1, and still names `main`.
- At 320px with the renamed-file fixture the `h1#cumpa-heading` box stays a single 31.5px text
  row (gate bound 32px), so the merged bar is shorter than the two bars it replaces.
- The Files toggle keeps its copy, labels, `aria-controls`/`aria-expanded` conditions, and is
  still what `focusFilesToggle()` focuses.
- No Base/Head or Preimage/Postimage block renders inside `main.review-main`.
- No `active-file-toolbar*` selector, computed, prop or import survives in `src/web` or in any
  spec.
- The three named Playwright specs pass, with every cited assertion either deleted or
  retargeted per Task 2 — none re-pinned to a relocated implementation detail.
</success_criteria>

<output>
Create `.planning/quick/260915-gxg-merge-active-file-bar-into-nav/260915-gxg-SUMMARY.md` when done
</output>
