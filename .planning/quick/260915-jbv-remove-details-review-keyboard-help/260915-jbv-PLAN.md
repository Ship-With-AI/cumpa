---
phase: quick-260915-jbv
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: true
requirements: [QUICK-260915-jbv]
files_modified:
  - src/web/App.vue
  - src/web/components/ReviewToolbar.vue
  - src/web/components/IdentityHeader.vue
  - src/web/components/StaleAnchorNotice.vue
  - src/web/components/ReviewNotesDialog.vue
  - src/web/components/ReviewPanel.vue
  - src/web/components/DetailsDialog.vue
  - src/web/components/IdentityPanel.vue
  - src/web/components/FileMetadataPane.vue
  - src/web/components/KeyboardHelp.vue
  - src/web/styles.css
  - tests/e2e/review-panel-resolved.spec.ts
  - tests/e2e/responsive-session.spec.ts
  - tests/e2e/pinned-session.spec.ts
  - tests/e2e/anchored-review.spec.ts
  - tests/e2e/agent-ready-export.spec.ts
  - tests/e2e/agent-ready-export-safety.spec.ts
  - tests/e2e/complete-review-draft.spec.ts
  - tests/e2e/marketplace-review.spec.ts
  - tests/e2e/public-support-states.spec.ts
  - tests/integration/anchored-workspace.spec.ts
  - tests/integration/selector-drift-ui.spec.ts

must_haves:
  truths:
    - "No Details button, Review toggle, or Keyboard help button exists anywhere in the UI."
    - "No `?` keypress opens anything; no keyboard help text ships in the bundle."
    - "The diff navigation toolbar renders exactly two groups (File navigation, Change navigation) and four focusable navigation controls."
    - "A developer can still create an inline comment in the diff, open Review notes, edit and save the summary, export review.json + review.md, and Finish an attached review."
    - "Opening the Changed files dialog and the Support dialog still works."
    - "Empty-comparison error copy no longer names a surface that does not exist."
    - "No Review notes failure notice tells the developer to inspect or review something through a surface that no longer exists."
    - "Booting the app emits no Vue warning, console error, or uncaught page error — the only observable proof that no removed identifier is still referenced from a template."
    - "The `?prototype=phase6` prototype still renders its three heading + status-pill rows, because `.comments-rail__heading` survives."
    - "The export dialog (Review notes) renders with unchanged styling: summary, export section, conflict notice, failure notice, and discard confirmation all keep their CSS."
  artifacts:
    - path: src/web/components/ReviewPanel.vue
      provides: "DELETED — rail panel"
      absent: true
    - path: src/web/components/DetailsDialog.vue
      provides: "DELETED — details modal"
      absent: true
    - path: src/web/components/IdentityPanel.vue
      provides: "DELETED — comparison identity, DetailsDialog-exclusive"
      absent: true
    - path: src/web/components/FileMetadataPane.vue
      provides: "DELETED — per-file metadata, DetailsDialog-exclusive"
      absent: true
    - path: src/web/components/KeyboardHelp.vue
      provides: "DELETED — in-app keyboard help"
      absent: true
    - path: tests/e2e/review-panel-resolved.spec.ts
      provides: "DELETED — 430-line spec existing only for the rail"
      absent: true
    - path: src/web/model/comment-groups.ts
      provides: "STAYS — projectCommentGroups has surviving readers (see Manifest E)"
      contains: "export function projectCommentGroups"
    - path: src/web/components/ReviewNotesDialog.vue
      provides: "STAYS — summary, export, Finish attached review"
      contains: "ExportSection"
    - path: src/web/styles.css
      provides: "STAYS — .comments-rail__heading has three live prototype consumers (D.1)"
      contains: ".comments-rail__heading"
  key_links:
    - from: src/web/App.vue
      to: src/web/components/DiffWorkspace.vue
      via: "case 'focus-comment' still calls diffWorkspace.focusComment — in-diff focus survives"
      pattern: "diffWorkspace\\.value\\?\\.focusComment"
    - from: src/web/components/SummarySection.vue
      to: src/web/styles.css
      via: ".review-panel__confirm rule must survive the .review-panel purge"
      pattern: "\\.review-panel__confirm"
    - from: src/web/components/ReviewNotesDialog.vue
      to: src/web/styles.css
      via: ".review-panel__conflict rules must survive the .review-panel purge"
      pattern: "\\.review-panel__conflict"
    - from: src/web/prototypes/Phase6DiffSemanticsPrototype.vue
      to: src/web/styles.css
      via: ".comments-rail__heading at :361 and :386 must survive the .comments-rail purge — three consumers at :383, :410, :431, validated by npm run verify:semantic-css"
      pattern: "\\.comments-rail__heading"
---

<objective>
Remove the Details button, the Review rail toggle, and the Keyboard help button, together with
every surface behind them, outright. No relocation of any information (CONTEXT.md `<decisions>`,
LOCKED: "remove without relocating information").

Purpose: three entry points and their surfaces are being retired. Comment *management*, comparison
identity, per-file metadata, and in-app keyboard help are knowingly sacrificed. Comment
*creation*, draft persistence, summary, export, and Finish attached review are not.

Output: five deleted components, one deleted spec file plus two deleted whole tests whose entire
subject was comment management, a two-group diff toolbar, resolved dangling references (including
two trimmed Review-notes failure strings), purged CSS that keeps `.comments-rail__heading`, a
retargeted test surface, and one new runtime console gate.
</objective>

<execution_context>
@GSD core/workflows/execute-plan.md
</execution_context>

<context>
@.planning/quick/260915-jbv-remove-details-review-keyboard-help/260915-jbv-CONTEXT.md
@.claude/CLAUDE.md
</context>

---

# Verified Deletion Manifest

All line numbers verified against HEAD `8b2a050`. Re-read each region before editing; line numbers
shift as you delete. Work **bottom-up within each file** so earlier numbers stay valid.

## Manifest A — Files deleted outright

| File | Lines | Why safe |
|---|---|---|
| `src/web/components/ReviewPanel.vue` | 541 | Imported only by `App.vue:28` |
| `src/web/components/DetailsDialog.vue` | 55 | Imported only by `App.vue:33` |
| `src/web/components/IdentityPanel.vue` | 168 | Imported only by `DetailsDialog.vue:6` |
| `src/web/components/FileMetadataPane.vue` | 273 | Imported by `DetailsDialog.vue:5` and by the inline harness in `pinned-session.spec.ts:56` (deleted in Task 3) |
| `src/web/components/KeyboardHelp.vue` | 33 | Imported only by `DetailsDialog.vue:7` |
| `tests/e2e/review-panel-resolved.spec.ts` | 430 | Whole file exists for the rail; imports `ReviewPanel.vue` at `:15`. Delete the file — do **not** hollow it out |

## Manifest B — `src/web/App.vue` (1442 lines at HEAD)

Script block:

| Line(s) | Remove | Note |
|---|---|---|
| `:10` | `FileMetadataResponse,` from the `../contracts/api` type import list | keep the other members |
| `:28` | `import ReviewPanel from './components/ReviewPanel.vue';` | |
| `:33` | `import DetailsDialog from './components/DetailsDialog.vue';` | |
| `:77` | `'details' \|` member of the `ShellDialog` union | union becomes `'changed-files' \| 'review-notes' \| 'support'` |
| `:85-87` | `selectedMetadata`, `metadataLoading`, `metadataError` | read only by `DetailsDialog` |
| `:89` | `const detailsOpen = ...` | |
| `:97` | `const commentsOpen = ref(false);` | |
| `:103` | `const detailsDialog = ref(...)` | |
| `:104` | `const reviewPanel = ref(...)` | |
| `:105` | `const commentsDrawer = ref<HTMLElement>();` | |
| `:115` | `const selectedCommentId = ref<string \| null>(null);` | see Manifest E note 3 |
| `:144` | `let metadataRequestVersion = 0;` | |
| `:152` | `let commentsOpener: HTMLElement \| undefined;` | |
| `:174` | rewrite copy — see **Dangling reference 2** | |
| `:181-182` | rewrite copy — see **Dangling reference 2** | |
| `:221-226` | `openCommentCount` and `resolvedCommentCount` computeds | only readers were `ReviewToolbar` props |
| `:254-258` | `watch(workspaceComments, ...)` that resets `selectedCommentId` | goes with `:115` |
| `:308-322` | `openComments()`, `closeComments()`, `toggleComments()` | |
| `:324-329` | `inspectRecordedFile()` | bound only at `:1356` |
| `:331-339` | `copyRecordedAnchor()` | bound only at `:1354` |
| `:349` | the `loadFileMetadata(file);` call inside `loadFile` | keep the rest of `loadFile` |
| `:376-397` | `loadFileMetadata()` | |
| `:608-613` | `saveComment()` | bound only at `:1357` |
| `:615-620` | `mutateComment()` | bound only at `:1352`, `:1353`, `:1355` |
| `:688` | `commentsOpen.value = false;` inside `reviewInlineComposer` | **keep** `selectFile(fileId)` at `:687` |
| `:743` | `selectedCommentId.value = command.commentId;` | **keep** `:742`, `:744`, `:745` — see key_links |
| `:907-911` | `retryMetadata()` | |
| `:913-915` | `openDetails()` | |
| `:917-920` | `openKeyboardHelp()` | |
| `:922-924` | `closeDetails()` | |
| `:927` | `if (commentsOpen.value) closeComments();` inside `openReviewNotes` | keep `openShellDialog('review-notes')` |
| `:935-949` | `focusStaleFeedback()` | see **Dangling reference 5** |
| `:964-970` | the whole `if (event.key === 'Escape') { ... }` branch in `handleKeydown` | after removal Escape falls through the `?`/Alt/F7 chain and matches nothing — behaviourally identical |
| `:971-973` | the `if (event.key === '?' ...)` branch | see **Dangling reference 1** |
| `:1133` | `commentsOpen.value = false;` inside `onMounted` | keep `viewportMedia` setup either side |

Template block:

| Line(s) | Remove |
|---|---|
| `:1216` | `<a class="skip-link" href="#review-heading">Skip review</a>` — `#review-heading` lives only in the deleted `ReviewPanel.vue:263` |
| `:1220` | `:expanded="detailsOpen"` on `IdentityHeader` |
| `:1226` | `@toggle="openDetails"` on `IdentityHeader` |
| `:1239` | the `@open-comments="openComments"` binding only — **keep the `StaleAnchorNotice` element**, see Dangling reference 4 |
| `:1254` | `detailsOpen \|\|` from the `:inert` expression — leave `reviewNotesOpen \|\| supportDialogOpen \|\| changedFilesOpen` |
| `:1265-1267` | `:open-comment-count`, `:resolved-comment-count`, `:review-expanded` props on `ReviewToolbar` |
| `:1272-1273` | `@comments="toggleComments"`, `@keyboard-help="openKeyboardHelp"` |
| `:1331-1361` | the whole `<aside class="comments-rail"> … </aside>` including the nested `<ReviewPanel>` |
| `:1377-1387` | the whole `<DetailsDialog … />` element |
| `:1433` | `@view-attached-scope="openDetails"` — see Dangling reference 3 |
| `:1434` | `@focus-stale-feedback="focusStaleFeedback"` — see Dangling reference 5 |

**Explicitly kept** (surviving readers): `shellDialog`, `shellModalOpen` (`:1213`, `:1225`),
`changedFilesOpen`, `reviewNotesOpen`, `supportDialogOpen`, `workspaceComments` (ReviewNotesDialog,
DiffWorkspace), `hasUnverifiedAnchors` (`:261` announce watcher, `:1231` warning-stack condition),
`reviewFailure` (still written by the summary path via `mutateReview`, read at `:1410`),
`mutateReview`, `saveSummary`, `reviewUnsavedText` (targets `.review-summary button`, which is
`SummarySection.vue` — survives), `announce`, `openShellDialog`, `closeShellDialog`.

## Manifest C — Sibling component edits

**`src/web/components/ReviewToolbar.vue` (98 lines)**

| Line(s) | Remove |
|---|---|
| `:9-11` | `openCommentCount`, `resolvedCommentCount`, `reviewExpanded` props |
| `:19-20` | `comments: []`, `keyboardHelp: []` emits |
| `:77-96` | the entire third `<div class="review-toolbar__group review-toolbar__group--actions">`, including the sr-only `#review-description` span (`:78-80`), the Review button with `aria-controls="review-panel"` (`:81-92`), and the Keyboard help button (`:93-95`) |

Remaining props: `atFirstFile`, `atLastFile`, `hasActiveFile`. Remaining emits: `previousFile`,
`nextFile`, `previousChange`, `nextChange`. See **Toolbar actions-group resolution** below.

**`src/web/components/IdentityHeader.vue` (148 lines)**

| Line(s) | Remove |
|---|---|
| `:9` | `readonly expanded: boolean;` prop |
| `:18` | `toggle: [];` emit |
| `:25` | `const disclosure = ref<HTMLButtonElement>();` |
| `:65-67` | `focusDisclosure()` — already had no consumer anywhere in `src/` or `tests/` |
| `:69` | `focusDisclosure` from the `defineExpose` list — becomes `defineExpose({ focusSupport })` |
| `:128-137` | the Details `<button>` |

**Keep** `:138-145` (the Review notes button) and `:117-127` (Support Cumpa). The
`.identity-disclosure` and `--accent` classes keep both those consumers, so their CSS stays.

**`src/web/components/StaleAnchorNotice.vue` (18 lines)** — see Dangling reference 4.

**`src/web/components/ReviewNotesDialog.vue` (328 lines)** — see Dangling references 3 and 5.

## Manifest D — `src/web/styles.css` (2924 lines)

Two edit shapes: **DELETE RULE** (remove the whole block and its trailing blank line) and
**DROP SELECTOR** (remove only the named selector line from a grouped selector list, leaving the
rule and its other selectors intact).

### D.1 — Rail (`.comments-rail`)

| Line(s) | Action |
|---|---|
| `:343-344` | DROP SELECTOR `.comments-rail h2,` and `.comments-rail h3,` from the `:338-358` heading group |
| `:361` | **KEEP — do not drop.** `.comments-rail__heading,` in the `:360-372` flex group has three live consumers (see note below) |
| `:386` | **KEEP — do not drop.** `.comments-rail__heading,` in the `:386-393` justify group, same three consumers |
| `:1498` | DROP SELECTOR `.comments-rail` from `:1497-1501`. **The rule must survive for `.changed-files-sidebar`** — result is `.changed-files-sidebar { min-width: 0; overflow: hidden; }` |
| `:1514-1520` | DELETE RULE `.comments-rail { display:grid; grid-template-rows; padding; border-left; background }` — this is the `background` restored in `8b2a050` |
| `:1522-1524` | DELETE RULE `.comments-rail h3 { margin-top }` |
| `:2069-2071` | DELETE RULE `.comments-rail .review-panel__section > h3 { margin: 0 }` |
| `:2443-2453` | DELETE RULE `.comments-rail { position:absolute; … }` overlay |
| `:2455-2458` | DELETE RULE `.comments-rail--open { transform; box-shadow }` |
| `:2855` | DROP SELECTOR `.comments-rail,` from the forced-colors group at `:2852-2865`. Other selectors in that group survive |

**`.comments-rail__heading` is NOT dead — correction to the earlier draft of this plan.** It has
three live consumers in `src/web/prototypes/Phase6DiffSemanticsPrototype.vue` at `:383`, `:410`,
and `:431`, each an `<h2>` + status-pill row. That prototype is a real mounted root: `main.ts:6-9`
loads it for `?prototype=phase6` in DEV, and `scripts/verify-semantic-css.mjs` reads and validates
it explicitly (`:16` declares `phase6PrototypePath`, consumed at `:380` and `:417`) as part of the
`npm run verify:semantic-css` gate. Dropping `:361` and `:386` collapses those three flex rows.
`.comments-rail h2,` / `.comments-rail h3,` at `:343-344` DO still get dropped: the prototype
carries no element with class `comments-rail`, so those descendant selectors never matched it.

### D.2 — Rail panel (`.review-panel*`) — **audited, three selectors survive**

Grep-proven surviving consumers (do **not** delete these):

| Selector | Surviving consumer | CSS lines that STAY |
|---|---|---|
| `.review-panel__confirm` | `SummarySection.vue:263` (summary discard confirmation, inside Review notes) | `:208` |
| `.review-panel__conflict` | `ReviewNotesDialog.vue:118` (draft-conflict alert in the export dialog) | `:1408-1414`, `:1417-1421` |
| `.review-panel__failure` | `ReviewNotesDialog.vue:139` | no CSS rule exists — nothing to do |

Deleting `:208`, `:1408-1414`, or `:1417-1421` silently breaks the export dialog. They stay.

Remove:

| Line(s) | Action |
|---|---|
| `:351-353` | DROP SELECTOR `.review-panel__heading h2,`, `.review-panel h3,`, `.review-panel h4` from `:338-358`. `:353` currently carries the `{` — after dropping it, `:350` (`.export-receipt__heading h4`) becomes the last selector and takes the `{` |
| `:783` | DROP SELECTOR `.review-panel,` from `:782-...`. `.identity-list,` on `:782` is also dropped (D.3) — keep `.review-summary__content`, `.export-section`, `.export-section__content` and the rest |
| `:1870` | DROP SELECTOR `.review-panel textarea` from `:1869-1873`. Result: `.review-summary textarea { display:block; width:100% }` |
| `:2010-2017` | DELETE RULE `.review-panel { display:flex; … }` |
| `:2019-2029` | DELETE RULE the six-selector `.review-panel__heading, __heading-counts, __group-header, __comment-heading, __comment-badges, __actions` flex group |
| `:2031-2039` | DELETE RULE `.review-panel__heading { position:sticky; … }` |
| `:2041-2044` | DELETE RULE `.review-panel__heading > .ui-button` |
| `:2046-2050` | DELETE RULE `.review-panel__heading-counts, __comment-badges, __actions { flex-wrap }` |
| `:2052-2059` | DELETE RULE `.review-panel__section` |
| `:2061-2067` | DELETE RULE `.review-panel__section > .review-summary, .review-panel__section > .export-section` — descendant-scoped to the deleted panel; the standalone `.review-summary` (`:209`) and `.export-section` (`:785`) base rules are untouched |
| `:2073-2083` | DELETE RULE `.review-panel__disclosure` |
| `:2085-2088` | DELETE RULE `.review-panel__disclosure::after` |
| `:2090-2092` | DELETE RULE `.review-panel__disclosure[aria-expanded="true"]::after` |
| `:2094-2097` | DELETE RULE `.review-panel__disclosure:hover:not(:disabled)` |
| `:2181-2183` | DELETE RULE `.review-panel__comments` |
| `:2185-2190` | DELETE RULE `.review-panel__group` |
| `:2192-2196` | DELETE RULE `.review-panel__group-header` |
| `:2198-2200` | DELETE RULE `.review-panel__group-header h4` |
| `:2202-2204` | DELETE RULE `.review-panel__group-rows > .review-panel__comment + .review-panel__comment` |
| `:2206-2215` | DELETE RULE `.review-panel__comment` |
| `:2217-2220` | DELETE RULE `.review-panel__comment-heading` |
| `:2222-2225` | DELETE RULE `.review-panel__comment-heading h5` |
| `:2227-2230` | DELETE RULE `.review-panel__comment--selected` |
| `:2232-2235` | DELETE RULE `.review-panel__comment--selected .review-panel__comment-heading h5` |
| `:2237-2239` | DELETE RULE `.review-panel__comment--busy` |
| `:2242` | DROP SELECTOR `.review-panel textarea` from `:2241-2245`. Result: `.review-summary textarea { min-height:96px; resize:vertical }` |
| `:2868` | DROP SELECTOR `.review-panel__comment--selected,` from the forced-colors rule at `:2867-2872`. **Keep `.ui-button--selected`** on `:2867` |

### D.3 — Details subtree (`.identity-*`, `.metadata-*`, `.file-metadata-pane`, `.keyboard-help`, `.file-facts`, `.object-id`, `.worktree-path`, `.source-label`, `.dirty-explanation`)

Grep-proven exclusive to `IdentityPanel.vue` / `FileMetadataPane.vue` / `KeyboardHelp.vue`:
`identity-panel`, `identity-list`, `identity-row`, `identity-meta-label`, `identity-value`,
`metadata-section`, `metadata-label`, `metadata-list`, `metadata-value`, `metadata-value-row`,
`metadata-value-group`, `file-metadata-pane`, `file-facts`, `keyboard-help`, `object-id`,
`worktree-path`, `source-label`, `dirty-explanation`.

**Not exclusive — leave every rule that mentions them alone:** `.availability-marker` (`ChangedFilesDialog`
tree rows, `:398`, `:426`, `:452`, `:1046`, `:1065`, `:1088`, `:1168-1169`), `.path-display`,
`.line-counts`, `.export-*`, `.dirty-badge`, `.identity-statement`, `.identity-disclosure`,
`.directory-row__path`, `.machine-reason`, `.empty-count`, `.review-toolbar__status`,
`.review-toolbar__counts`.

| Line(s) | Action |
|---|---|
| `:180` | DROP SELECTOR `.file-metadata-pane,` from `:179-183`. Keep `.review-main` and `.draft-recovery` |
| `:207` | DROP SELECTOR `.identity-row,` from `:206-...`. Keep `.review-panel__confirm`, `.review-summary`, and the rest |
| `:340-341` | DROP SELECTOR `.identity-panel h3,` and `.file-metadata-pane > h3,` from `:338-358` |
| `:346` | DROP SELECTOR `.metadata-section h3,` from `:338-358` |
| `:362` | DROP SELECTOR `.keyboard-help__heading,` from `:360-372` |
| `:387` | DROP SELECTOR `.keyboard-help__heading,` from `:386-393` |
| `:721-725` | DELETE RULE `.identity-panel, .keyboard-help { display:grid; gap }` — both selectors are removed components, so the whole rule goes |
| `:782` | DROP SELECTOR `.identity-list,` from `:782-...` (same rule as D.2 `:783`) |
| `:801-807` | DELETE RULE `.identity-row { display:grid; … }` |
| `:825-828` | DROP SELECTORS `.identity-row dt,`, `.identity-meta-label,`, `.metadata-label,`, `.metadata-list dt,` from `:825-...`. **Keep `.export-section h5`, `.export-section dt`, `.export-readiness dt` and every other selector in that group** |
| `:839-840` | DROP SELECTORS `.identity-row dd,` and `.metadata-list dd,` from `:839-...`. **Keep `.export-receipt__acknowledged-identities dd`, `.export-readiness dd`, `.export-drift__identities dd`** |
| `:849-853` | DELETE RULE `.source-label` |
| `:855-862` | DELETE RULE `.identity-value, .metadata-value-row { display:grid; … }` — both selectors removed |
| `:864-865`, `:869-871` | DROP SELECTORS `.object-id,`, `.worktree-path,`, `.metadata-value,`, `.metadata-list dd,`, `.metadata-list dd code,` from the `:864-...` group. **Keep `.directory-row__path`, `.path-display`, `.line-counts`, `.machine-reason`, `.diff-workspace__side-labels span`, `.empty-count` and the rest** |
| `:881-884` | DELETE RULE `.object-id, .worktree-path, .metadata-value, .metadata-list dd { … }` — all four selectors removed |
| `:891-894` | DELETE RULE `.worktree-path, .identity-meta-label { margin-top }` — both removed |
| `:896` | DROP SELECTOR `.dirty-explanation,` from `:896-...`. **Keep `.identity-statement`, `.empty-state p`, `.state-card p` and the rest** |
| `:912-914` | DELETE RULE `.dirty-explanation { color }` |
| `:1295-1300` | DELETE RULE `.file-metadata-pane { flex; … }` |
| `:1302-1308` | DELETE RULE `.file-facts` |
| `:1310-1314` | DELETE RULE `.metadata-section` |
| `:1316-1320` | DELETE RULE `.metadata-value-group` |
| `:1322-1326` | DELETE RULE `.metadata-list` |
| `:1328-1331` | DELETE RULE `.metadata-list > div` |
| `:1652-1660` | DELETE RULE `.keyboard-help { position:absolute; z-index:8; top:112px; … }` |
| `:1662-1663` | DROP SELECTORS `.keyboard-help h3,` and `.keyboard-help p,` from `:1662-1667`. **Keep `.export-section h3`, `.export-section h4` — the rule must survive for the export dialog** |
| `:1669-1673` | DELETE RULE `.keyboard-help ul` |
| `:2587-2596` | DELETE RULE `.file-metadata-pane { … }` inside `@media (max-width: 760px)` |
| `:2598` | DROP SELECTOR `.metadata-value-row,` from the `:2598-...` group inside that media block. **Keep `.draft-recovery__details > div`, `.export-receipt__metadata > div`, `.receipt-file-row__metadata > div` and the rest** |
| `:2608-2610` | DELETE RULE `.metadata-value-row .copy-action` |
| `:2612-2614` | DELETE RULE `.file-facts { grid-template-columns }` |
| `:2616-2618` | DELETE RULE `.metadata-list { flex-wrap }` |
| `:2621-2624` | DELETE RULE `.identity-row, .identity-value { grid-template-columns }` — both removed |
| `:2626-2630` | DELETE RULE `.object-id, .worktree-path { max-width; overflow-wrap }` — both removed |
| `:2798` | DROP SELECTOR `.file-metadata-pane,` from the forced-colors rule at `:2795-2802`. **Keep `.session-shell`, `.review-shell`, `.review-main`, `.draft-recovery`** |

### D.4 — Toolbar actions group

| Line(s) | Action |
|---|---|
| `:1629-1631` | DELETE RULE `.review-toolbar__group--actions { margin-left: auto }` |
| `:2663-2665` | DELETE RULE `.review-toolbar__group--actions { margin-left: 0 }` inside `@media (max-width: 760px)` |

### D.5 — `.review-shell` — nothing to reconcile (CONTEXT correction)

CONTEXT `<specifics>` says the `.review-shell` grid and the 761/1050/1650 breakpoints "reference the
rail column/overlay". **Verified false at HEAD:**

- `.review-shell` (`:1482-1491`) is `grid-template-columns: var(--sidebar-width) minmax(0, 1fr)` —
  two columns: changed-files sidebar + `.review-main`. There is no rail column.
- The rail was an **absolute overlay** (`:2443-2453`, `position:absolute; right:8px`), outside grid flow.
- `@media (min-width:761px) and (max-width:1050px)` (`:2460-2475`) sets only `--sidebar-width: 248px`
  plus `.session-header*` rules. `@media (min-width:1650px)` (`:2477-2481`) sets only
  `--sidebar-width: 320px`. `@media (max-width:760px)` (`:2483-2493`) sets only
  `.review-shell { display:block }` and `.review-main { height:100% }`.

**Therefore: no `.review-shell` rule and no breakpoint rule changes.** Layout at 320/760/1050/1440/1650
is unaffected by removing the overlay. Do not touch `:1482-1495`, `:2460-2493`.

**Deliberately left alone (advisory, not an oversight).** `.review-shell`'s `position: relative`
(`:1483`) and `contain: paint` (`:1488`) existed to host and clip the absolutely-positioned rail
overlay. Once the overlay is gone they are inert: no remaining descendant is absolutely positioned
against `.review-shell`, and nothing paints outside it. Removing them is a layout-risk change with
zero user-visible upside and is **out of scope for this task** — the CONTEXT decision is literal
removal of the three surfaces, not opportunistic CSS tidying. An executor or reviewer who notices
these two declarations should leave them: they are recorded here as a known, accepted leftover.

## Manifest E — Symbols with surviving readers: THESE STAY

1. **`src/web/model/comment-groups.ts` STAYS — CONTEXT is wrong about this.**
   CONTEXT `<decisions>` claims `projectCommentGroups` "is imported only by `ReviewPanel.vue`".
   Verified surviving readers at HEAD:
   - `src/web/model/review-draft-state.ts:4` imports it, `:8` imports `ReviewCommentProjection`,
     `:10` re-exports both, `:81` declares `groups(inventory)` on the `ReviewDraftState` interface,
     `:228` calls `projectCommentGroups(canonical.comments, inventory)`.
   - `tests/unit/comment-groups.test.ts` tests it directly.
   Delete only the `ReviewPanel.vue:5` import (with the file). **Do not delete
   `src/web/model/comment-groups.ts`, and do not touch `review-draft-state.ts`.**

2. **`sessionClient.getFileMetadata` STAYS** (`src/web/api/client.ts:80`, `:271`) and so does the
   server route. Removing `loadFileMetadata` from `App.vue` makes the client method a
   newly-unreferenced-by-UI export. This is the already-tracked STATE.md deferred item
   ("Retire or intentionally consume authenticated orphan file-metadata route/client method") and
   DEBT-01, which CONTEXT puts out of scope. Leave both, and leave `tests/api/*` untouched.

3. **`selectedCommentId` IS removed** (`App.vue:115`, `:254-258`, `:743`) — after the rail goes it
   has no reader (its only reader was `ReviewPanel`'s `:selected-comment-id` prop at `:1345`).
   **Keep `case 'focus-comment':` and `diffWorkspace.value?.focusComment(command.commentId)` at
   `:742`, `:744-745`.** `DiffWorkspace.focusComment` (`DiffWorkspace.vue:233`, exposed at `:245`)
   is the in-diff path and must keep working — this is what the `workspace-state` `focus-comment`
   command (emitted from `workspace-state.ts:156`, `:232`, `:250`, `:300`, `:378`) drives.

4. **Export-dialog CSS STAYS:** `.review-summary*` (SummarySection), `.export-section*`
   (ExportSection), `.review-panel__confirm`, `.review-panel__conflict`. See D.2.

5. **`hasUnverifiedAnchors` STAYS** — read at `App.vue:261` (announce watcher) and `:1231`
   (warning-stack render condition).

---

# Toolbar actions-group resolution (explicit decision)

**Decision: DELETE the `.review-toolbar__group--actions` element.** Do not retain it empty.

An empty `<div class="review-toolbar__group">` would keep the group count at 3, keep an
`aria-label`-less empty flex box in the a11y tree, and — because of
`.review-toolbar > * + *` (`:1624-1627`) — render a dangling vertical separator with `padding-left`
and no content after it. Nothing is gained.

**New group count: 2** — `aria-label="File navigation"` (`ReviewToolbar.vue:27`) and
`aria-label="Change navigation"` (`:52`).

**New focusable control count in the toolbar: 4** — Previous file, Next file, Previous change,
Next change. (The Tab-order step's sixth/fifth entries, Review and Keyboard help, are gone. The
`ActiveFileToolbar` files-toggle button sits in the `.review-toolbar__active-file` slot, not in a
`.review-toolbar__group`, and was never in that step's control list.)

**Assertions this changes (all in `tests/e2e/responsive-session.spec.ts`):**

| Line(s) | Change |
|---|---|
| `:478` | `expect(reflow.toolbarGroups).toHaveLength(3)` → `toHaveLength(2)`. The collector at `:468-469` (`querySelectorAll('.review-toolbar__group')`) and the width/height loop at `:479-482` are unchanged and keep asserting both surviving groups render with non-zero geometry |
| `:1101` | step title `'desktop review toolbar exposes six controls in sequential Tab order'` → `'…exposes four controls in sequential Tab order'` |
| `:1110-1111` | delete the `review` and `keyboardHelp` locators |
| `:1112` | `const controls = [previousFile, nextFile, previousChange, nextChange] as const;` |
| `:1117-1118` | delete `await expect(review).toBeVisible();` and `await expect(keyboardHelp).toBeVisible();` |

`:1114-1116` (enabled loop over the four nav buttons), `:1120-1128` (focus + Tab walk +
`expectFocusIndicatorUnclipped`), and `:1130-1131` are unchanged and now cover exactly four controls.

**CSS consequence — who claims the free space: nobody, and nothing collapses.**

`.review-toolbar__group--actions { margin-left: auto }` was what pushed the actions cluster to the
right edge; the active-file slot and both nav groups were already packed left. Removing the group
removes the only consumer of that rule, so both rules go (D.4).

No replacement rule is needed, and adding one would be relocation:

- The bar's width and chrome come from `.review-toolbar` itself — `width: 100%; max-width: 100%`
  (`:1537-1539`), `background: var(--surface-panel)` (`:1544`), `border-bottom` (`:1543`), plus
  `min-height: 48px` at narrow (`:2659-2661`). The bar spans the full row regardless of content
  width; only the *content* now ends earlier. The right side does not collapse.
- `.review-toolbar__active-file { max-width: 40% }` (`:1554`) is **untouched** and stays capped, as
  required. Its `flex: 0 1 auto` means it cannot grow into the freed space either.
- `.review-toolbar > * + *` (`:1624-1627`) is **kept unchanged**. Children go from 4 to 3
  (active-file slot, File group, Change group), so separators go from 3 to 2, each still before a
  populated child.
- `.review-toolbar__label` (`:1615-1622`, hidden at ≤760px by `:2529-2531`) is untouched.

Result: three left-packed children with two separators, trailing inert whitespace to their right.

---

# Dangling reference resolutions

**1. `?` shortcut (`App.vue:971-973`)** — delete the branch. The chain at `:971-983` becomes
`if (event.altKey && event.shiftKey && event.key === '[') { … } else if (… ']') { … } else if
(event.key === 'F7') { … }` — promote the Alt+Shift+`[` branch to the leading `if`. Also delete the
Escape branch (`:964-970`) per Manifest B. `?` then does nothing — it does not open an empty
surface. Alt+Shift+`[`/`]` and F7/Shift+F7 keep working.

**2. Empty-comparison error copy (`App.vue:174`, `:181-182`)** — exact replacements. Keep the
actionable clause, drop the dead-surface clause:

- `:174` (exact patch) — from
  `'This accepted patch contains no changed file entries. Details lists the patch digest; relaunch with a non-empty already-applied patch.'`
  to exactly:
  `'This accepted patch contains no changed file entries. Relaunch with a non-empty already-applied patch.'`
- `:181` (range with pathspecs) — from
  `'The pinned commits contain no changed files selected by this scope. Details lists the commits and ordered Git pathspecs.'`
  to exactly:
  `'The pinned commits contain no changed files selected by this scope.'`
- `:182` (range without pathspecs) — from
  `'The pinned commits contain no changed files. Details lists the commits.'`
  to exactly:
  `'The pinned commits contain no changed files.'`

`:187` (`'The selected head has no changes from the displayed merge base.'`) is unchanged — it never
named Details. `unavailableMessage` (`:196-200`) is unchanged.

Rationale: the dropped clauses were pure wayfinding to a surface that no longer exists. `:174`'s
relaunch instruction is the actionable half and survives verbatim. `:181`/`:182` had no actionable
half beyond the statement itself, so the statement is the whole message — nothing is invented to
replace the pointer.

Test impact: `tests/e2e/pinned-session.spec.ts:555` asserts the old `:182` string verbatim —
retarget to the new string (Task 3).

**3. `@view-attached-scope` and its emitter** — resolve the whole chain, do not bind to a no-op:

- `App.vue:1433` — delete the `@view-attached-scope="openDetails"` binding.
- `ReviewNotesDialog.vue:66` — delete the `viewAttachedScope: [];` emit declaration.
- `ReviewNotesDialog.vue:265` — delete the
  `<button … @click="emit('viewAttachedScope')">{{ isExactPatch ? 'View patch scope' : 'View review scope' }}</button>`.

**Keep** the surrounding `scopeInvalid` notice (`:259-267`): the `<div class="inline-notice
inline-notice--warning" role="alert">`, the `UiIcon`, and the `<h4 ref="completionFailure"
tabindex="-1">Reviewed content changed</h4>`. The failure is still real and still needs reporting;
only the button that opened Details goes. The `completionFailure` ref stays reachable, so focus
handling is unaffected.

**But the paragraph at `:264` must be trimmed, not kept verbatim.** Both of its branches instruct
the developer to "Inspect the recorded" scope — that inspection surface *was* Details, which this
task deletes. Leaving the sentence ships an instruction to use a control that no longer exists;
that is the same defect already fixed for `App.vue:174`/`:181`/`:182` in Dangling reference 2, and
the same standard applies here. Exact replacements for the ternary at `:264`:

- exact-patch branch — from
  `'The submitted patch content no longer passes completion validation. No feedback was returned. Inspect the recorded patch scope, then relaunch the agent request against valid content.'`
  to exactly:
  `'The submitted patch content no longer passes completion validation. No feedback was returned. Relaunch the agent request against valid content.'`
- range branch — from
  `'The submitted review scope no longer passes completion validation. No feedback was returned. Inspect the recorded review scope, then relaunch the agent request against valid content.'`
  to exactly:
  `'The submitted review scope no longer passes completion validation. No feedback was returned. Relaunch the agent request against valid content.'`

The relaunch instruction is the actionable half and survives; only the pointer to the deleted
surface goes. Test impact: `tests/e2e/agent-ready-export-safety.spec.ts:202` and `:206` assert the
old strings verbatim — **retarget both to the trimmed strings** (Task 3), do not keep them.

**4. `StaleAnchorNotice` — DECISION: keep it, non-interactive, with corrected copy.**

Why keep rather than delete: the underlying condition is still true and still consequential.
`hasUnverifiedAnchors` means some saved comment anchors are `stale` or `orphaned`, which is a real
`FinishReviewResult` failure kind (`staleAnchors`) that blocks Finish attached review and makes the
exported feedback non-actionable. PROJECT.md's Core Value is "export precise, drift-detectable
feedback an agent can act on" — silently dropping the only visual drift signal would degrade export
trustworthiness, which CONTEXT `<canonical_refs>` puts out of scope for this task. The condition is
independently announced at `App.vue:261-266`, but announcements are transient; the notice is the
persistent form.

Why non-interactive: its only action targeted the rail.

Edits to `src/web/components/StaleAnchorNotice.vue` (18 lines):

| Line(s) | Action |
|---|---|
| `:4-6` | delete the whole `defineEmits<{ openComments: []; }>()` call. The `<script setup>` block then contains only the `UiIcon` import |
| `:14` | replace the paragraph body — it currently claims `Stale and unavailable comments remain visible as read-only history.`, which becomes false. New text exactly: `Their recorded anchors are unchanged and may not be actionable in exported feedback.` |
| `:15` | delete the `<button type="button" class="ui-button" @click="$emit('openComments')">Open comments</button>` |

**Keep** the `<aside class="inline-notice inline-notice--warning" aria-labelledby="stale-anchor-heading">`
wrapper, the `UiIcon`, and `<h2 id="stale-anchor-heading">Some saved comment anchors cannot be verified</h2>`.
In `App.vue:1239`, keep `<StaleAnchorNotice v-if="hasUnverifiedAnchors" />` and drop only the
`@open-comments="openComments"` binding.

**5. `focusComment` routing, and the already-dead `focus-stale-feedback` binding**

Verified at HEAD: `App.vue:1434` binds `@focus-stale-feedback`, but `ReviewNotesDialog` declares
`reviewStaleFeedback` (`:67`) and emits `'reviewStaleFeedback'` (`:254`). Vue maps that to
`@review-stale-feedback`, which **nothing binds**. So `focusStaleFeedback` (`App.vue:935-949`) —
and with it the only `reviewPanel.value?.focusComment(...)` call site (`:947`) — is already
unreachable dead code at HEAD. A fresh grep of `src/` and `tests/` for `stale-feedback|staleFeedback`
returns only `App.vue:1434`; no test exercises it.

Resolution (clean cutover, both ends):

- `App.vue:1434` — delete the `@focus-stale-feedback="focusStaleFeedback"` binding.
- `App.vue:935-949` — delete `focusStaleFeedback()`.
- `ReviewNotesDialog.vue:67` — delete the `reviewStaleFeedback: [];` emit declaration.
- `ReviewNotesDialog.vue:254` — delete the
  `<button … @click="emit('reviewStaleFeedback')">Review stale feedback</button>`.
  **Keep** the enclosing `staleAnchors` notice (`:248-257`) — wrapper, `UiIcon`, and the `<h4
  ref="completionFailure" tabindex="-1">Review can't be finished</h4>`.
- `ReviewNotesDialog.vue:253` — **trim the paragraph**, same reason as the `:264` trim in Dangling
  reference 3: the sentence `Review the affected comments.` tells the developer to go use the rail
  this task deletes. Remove exactly that one sentence; everything else in the paragraph is factual
  and stays. New paragraph body exactly:
  `Cumpa found stale or unavailable feedback anchors in the accepted review. Affected comments: {{ attachedFailure.affectedCount }}. No feedback was returned. Their recorded anchors remain unchanged and non-actionable.`
  Test impact: `tests/e2e/agent-ready-export-safety.spec.ts:190` asserts the old string verbatim
  (with `Affected comments: 1.`) — **retarget it to the trimmed string** (Task 3).

**`DiffWorkspace.focusComment` must keep working** and does: `App.vue:742-745`
(`case 'focus-comment'` → `diffWorkspace.value?.focusComment(command.commentId)`) is untouched apart
from deleting the `selectedCommentId` assignment on `:743`. That is the path
`workspace-state.ts` drives on add-comment, show-comment, and activate-line; inline comment
creation and in-diff comment focus are unaffected.

---

# Test surface: per-spec DELETE / RETARGET

Reconciled against a fresh grep of `tests/` for `comments-rail`, `review-panel`, `'Review', exact`,
`Keyboard help`, `'Details'`, `IdentityPanel`, `FileMetadataPane`, `view-attached-scope`,
`Close review`, `review-heading`, `Open comments`, `Keyboard actions`, `openReview`,
`ensureReviewOpen`. **Never re-pin removed markup** — delete assertions, do not convert them to
`toHaveCount(0)` except where noted.

`IdentityPanel` and `view-attached-scope` have **zero** hits anywhere in `tests/`.

## Helper correction (CONTEXT is wrong here too)

CONTEXT `<specifics>` says `openReview` / `ensureReviewOpen` are "shared across specs". Verified:
they are **12 file-local definitions**, and the two names mean different things.

**`ensureReviewOpen` — rail toggle, DELETE the definition and every call site:**

| Definition | |
|---|---|
| `tests/integration/anchored-workspace.spec.ts:437-446` | clicks the Review toggle, asserts `aria-expanded` |
| `tests/e2e/anchored-review.spec.ts:131-140` | same |
| `tests/e2e/agent-ready-export.spec.ts:245-249` | same |
| `tests/e2e/public-support-states.spec.ts:195-199` | same |
| `tests/e2e/complete-review-draft.spec.ts:141-150` | same |
| `tests/e2e/marketplace-review.spec.ts:28-32` | same |

**`openReview` — NOT the rail. KEEP all four, do not touch:**

| Definition | What it actually does |
|---|---|
| `tests/integration/anchored-workspace.spec.ts:289-294` | `page.goto` + assert h1 + assert Monaco visible |
| `tests/integration/support-dialog.spec.ts:58-62` | `page.goto` + assert Support dialog |
| `tests/integration/selector-drift-ui.spec.ts:222-225` | `page.goto` + assert `main` visible |
| `tests/integration/export-receipt-ui.spec.ts:182-186` | `page.goto` + click **Review notes** + assert export button |

**`openReviewNotes` — the surviving dialog. KEEP:** `agent-ready-export.spec.ts:251-256`,
`complete-review-draft.spec.ts:152-157`.

**Rail-collapse prologues — a trap.** `addHeadComment`-style helpers begin by *collapsing* the rail
if expanded, then create a comment. Those prologue lines reference the removed Review button and
must be deleted while the comment-creation body is preserved:
`complete-review-draft.spec.ts:148-149`, `marketplace-review.spec.ts:35-36`,
`agent-ready-export.spec.ts:259`, `public-support-states.spec.ts:202`. Every
`name: 'Review', exact: true` locator in `tests/` is listed below; all 27 must be resolved.

## Per-spec decisions

| Spec | Lines | Decision |
|---|---|---|
| `tests/e2e/review-panel-resolved.spec.ts` | 430 | **DELETE FILE.** Imports `ReviewPanel.vue:15`; whole file is rail resolve/reopen/edit/discard coverage. Rail-specific locators at `:227`, `:231`. Do not hollow out |
| `tests/e2e/responsive-session.spec.ts` | 1627 | **RETARGET.** Toolbar-group count `:478` → 2; Tab-order step `:1101`, `:1110-1112`, `:1117-1118` (see Toolbar resolution). DELETE: the `Keyboard help · ?` tooltip assertion `:631`; the Keyboard-help contrast/boundary block `:846-861`; the Review/Keyboard-help tooltip block `:1009-1027`; the Keyboard-help→Details→`Keyboard actions` step `:1077-1083`; the `['Skip review', 'review-heading']` entry `:1048`; the `Close review` prologue `:1139-1143`; the rail-drawer block `:1179-1188`; the rail-open prologue `:1229`; the whole `details dialog traps focus and restores disclosure` step `:1561-1583`; the helper-local `Review` locator `:547`. The mixed geometry step `:1232-1560` and the zoom step `:1593-1621` are **line-by-line** — see **Responsive geometry step: verified line-by-line disposition** below. KEEP `:1154`, `:1158` (heading/toolbar geometry) and `:1162` (`.changed-files-sidebar` narrow). After edits, `assertNoPageOverflow` coverage at every width must still run |
| `tests/e2e/pinned-session.spec.ts` | 1646 | **RETARGET.** DELETE the Details-dialog steps and assertions at `:444-445`, `:500-502`, `:556-557`, `:605-607`, `:904-906`, `:983-989`, `:1162-1164`, `:1201`, `:1424-1427`. DELETE the whole `FileMetadataPane` harness: the import `:56`, the `metadataHarnessModule` template literal `:54-109`, `startMetadataHarness()` `:111-129`, and its usage block `:1472-1500`; drop the now-unused `createServer`/`ViteDevServer` imports `:23-24` if nothing else needs them. DELETE the metadata-request collector `:1358-1360`/`:1395` and its assertion `:1468-1470` — no metadata fetch happens once `loadFileMetadata` is gone. KEEP the direct API assertions at `:854`, `:860`, `:1557` (server-route level, unaffected) and the content-route assertion `:1467`. RETARGET `:555` to the new `:182` copy: `'The pinned commits contain no changed files.'` |
| `tests/integration/anchored-workspace.spec.ts` | 1336 | **RETARGET + two whole-test deletions.** DELETE `ensureReviewOpen` `:437-446` and all call sites; the Keyboard-help→Details→`Keyboard actions` block `:483-485`; the rail `Review` heading assertion `:499`; the Review/Keyboard-help toolbar block `:539-540`; the review toggle `:997`; every `comments-rail` / `review-panel` / `Close review` / `Open comments` locator. KEEP `openReview` `:289-294` (and extend it with the console gate — see **Runtime console gate**). Three sites need explicit handling and are spelled out in **anchored-workspace: whole-test and single-assertion dispositions** below: the stale-notice block `:965-968`, the rail-selection test `:757-816`, and the one-assertion persistence test `:595-607`. What must survive in this spec: anchored comment *creation* and anchor-verification behaviour observed in the diff or at the draft API, not in the rail |
| `tests/e2e/complete-review-draft.spec.ts` | 967 | **RETARGET + one whole-test deletion.** DELETE `ensureReviewOpen` `:141-150` and call sites; the rail-collapse prologue `:148-149`; the rail `complementary`/`heading` assertions `:334-335`; every `comments-rail` / `Open comments` locator. KEEP `openReviewNotes` `:152-157` and all summary-save, export, and Finish-review coverage — this is a named regression guard. The two comment-buffer tests are **not** blanket-strippable; see **complete-review-draft: verified per-test disposition** below |
| `tests/e2e/agent-ready-export.spec.ts` | 855 | **RETARGET.** DELETE `ensureReviewOpen` `:245-249` and call sites; the rail prologue `:259`; the rail assertions at `:542`; every `comments-rail` / `review-panel` / `Close review` locator. KEEP `openReviewNotes` `:251-256` and all export coverage — named regression guard |
| `tests/e2e/anchored-review.spec.ts` | 400 | **RETARGET.** DELETE `ensureReviewOpen` `:131-140` and call sites and the comments toggle `:373`. The stale/orphaned-anchor records asserted **rail-only** in this spec lose their surface — delete those assertions rather than re-pinning them (CONTEXT `<decisions>`, accepted capability loss). KEEP whatever this spec asserts about anchor verification observable in the diff or via the API |
| `tests/e2e/agent-ready-export-safety.spec.ts` | 250 | **RETARGET.** DELETE the three button-visibility assertions at `:191` (`Review stale feedback`), `:203` (`View review scope`), `:207` (`View patch scope`). **RETARGET — do not keep — the three paragraph assertions above them:** `:190` to the trimmed `staleAnchors` string (Dangling reference 5), `:202` to the trimmed review-scope string and `:206` to the trimmed patch-scope string (Dangling reference 3). Keeping them verbatim would re-pin copy that names the deleted Details surface. The notices themselves still render; the `role="alert"` heading assertions at `:189`, `:201` and the `revisionConflict` / `draftReadOnly` blocks are untouched |
| `tests/e2e/marketplace-review.spec.ts` | 203 | **RETARGET.** DELETE `ensureReviewOpen` `:28-32`, its call sites, and the rail-collapse prologue `:35-36`. KEEP the comment-creation body and the marketplace flow |
| `tests/e2e/public-support-states.spec.ts` | 555 | **RETARGET.** DELETE `ensureReviewOpen` `:195-199`, call sites, and the prologue at `:202`. KEEP all Support-dialog coverage |
| `tests/integration/selector-drift-ui.spec.ts` | 531 | **RETARGET.** DELETE the Details block `:523-527` (button → dialog → `Comparison` heading). KEEP `openReview` `:222-225` and all drift-notice coverage |
| `tests/e2e/review-notes-dialog.spec.ts` | 73 | **KEEP UNCHANGED.** Its single `Close review` hit is the Review-notes dialog's own close control, not the rail's. Named regression guard |
| `tests/integration/support-dialog.spec.ts` | 157 | **KEEP UNCHANGED.** Its `openReview` is a `page.goto` helper |
| `tests/integration/export-receipt-ui.spec.ts` | 436 | **KEEP UNCHANGED.** Its `openReview` opens **Review notes**; its `Comparison` hits (`:238`, `:291`) are the export receipt's own disclosure |
| `tests/unit/comment-groups.test.ts` | — | **KEEP UNCHANGED.** `comment-groups.ts` survives (Manifest E note 1) |
| `tests/api/**`, `tests/unit/**`, `tests/cli/**`, `tests/git/**` | — | **KEEP UNCHANGED.** No removed-markup references; `Comparison`/`PinnedComparison` hits are domain types |

## anchored-workspace: whole-test and single-assertion dispositions

The blanket "delete every rail locator" instruction is not sufficient for three sites in
`tests/integration/anchored-workspace.spec.ts`. Each is resolved explicitly:

**1. Stale-notice block `:960-968`.** `:965` pins
`'Stale and unavailable comments remain visible as read-only history.'` — the verbatim
`StaleAnchorNotice.vue:14` copy that Dangling reference 4 rewrites. It is not a rail locator, so
neither the per-spec row nor the reconciliation grep catches it.
- `:965` — **RETARGET** to the new copy, exactly:
  `await expect(staleNotice).toContainText('Their recorded anchors are unchanged and may not be actionable in exported feedback.');`
- `:966-968` — **DELETE** all three lines: the `Open comments` click and the `Close review`
  visibility + click round-trip. The button is gone and the rail it opened is gone.
- `:961` (the `complementary` accessible name `'Some saved comment anchors cannot be verified'`) and
  `:964` (`not.toHaveAttribute('role')`) **survive untouched** — that heading and wrapper are
  explicitly kept by Dangling reference 4.

**2. `test` `:757-816` — `'Phase 07 rail selection follows focus-comment'` — DELETE the whole
test.** Every line of it is rail selection: `article[data-comment-id=…]` rows at `:785` and `:804`,
`Show comment` clicks, and `review-panel__comment--selected` class assertions at `:787`, `:806-807`.
It is also the **only** coverage of `selectedCommentId`, which Manifest B removes (`App.vue:115`,
`:254-258`, `:743`). Deleting the test is the consistent outcome, not a shortcut: the state it
asserts stops existing. Keep `:743`'s siblings `:742`, `:744-745` so `focusComment` still runs —
that surviving behaviour is covered by the in-diff focus assertions in `'Phase 07 inline
conversation states'` (`:609-755`), which stays.

**3. `test` `:595-607` — `'inline comment persistence'` — RETARGET `:605-606`, do not delete the
test.** It has exactly one assertion (`:606`, a `.comments-rail__comment` locator) plus the
`ensureReviewOpen(page)` call at `:605`; stripping both would leave a test named "persistence" that
asserts no persistence. The subject — a created comment is durably accepted — survives at the draft
API and in the diff, so re-anchor it to this spec's own existing conventions:
- **DELETE** `:605` (`await ensureReviewOpen(page);`).
- **RETARGET** `:606` using the response-capture convention already used in this file at `:693-697`
  and `:1170-1172`: declare
  `const accepted = page.waitForResponse((candidate) => candidate.url().includes('/api/draft/mutations'));`
  immediately before the `Add comment` click on `:604`, then assert
  `expect((await accepted).status()).toBe(201);` followed by the in-diff surviving surface
  `await expect(page.locator('.monaco-anchor-zone--composer .inline-accepted-comment')).toHaveCount(1);`
  — the same locator the retained test uses at `:698-700`. Both the mutation round-trip and the
  persisted card are then proven without the rail.

## complete-review-draft: verified per-test disposition

The row's blanket strip is self-contradictory for two tests in
`tests/e2e/complete-review-draft.spec.ts`. Explicit dispositions:

**1. `test` `:314-388` — `'complete draft lifecycle edits, resolves, reopens, deletes, and groups
comments through the packaged Review'` — DELETE the whole test.** Its entire subject is comment
*management* through the rail: edit, resolve, reopen, delete, and group headings such as
`'Open comments (0)'` at `:383`. Stripping the listed locators leaves nothing executable, and
comment management is an accepted capability loss (CONTEXT `<decisions>`). Delete `:314-388`
outright, including its `try`/`finally` CLI lifecycle. `test.afterAll` (`:310-312`) and the
summary-lifecycle test that follows (`:390-427`) are untouched.

**2. `test` `:429-647` — RETARGET and retitle, do not delete.** It rests on **two** retained
buffers, and only one of them is a comment buffer. The summary buffer is a surviving surface
(`SummarySection` inside Review notes), so the CAS/conflict core stays. Also note the deleted-target
409 path at `:527-538` becomes unreachable the moment `mutateComment` / `saveComment` go
(Manifest B `:608-620`) — there is no `Save comment` control left to press.
- **RETITLE** `:429` to exactly:
  `'two-tab conflict retains the summary buffer and requires fresh explicit CAS after reload'`.
- **DELETE** the comment-buffer half: `:455-460` (`ensureReviewOpen`, `seedRecord`, `seedId`,
  `Close review`), `:465-468` (`otherSeedRecord`, `Edit` click, `otherEdit` buffer fill), `:516`
  and `:521` (`otherEdit` value assertions), and `:523-545` (`ensureReviewOpen`, the
  `remoteRecord` / `Resolve` assertions, the whole `Delete comment` + deleted-target-409 block, and
  the post-reload rail absence check). Drop the now-unused `attemptedEdit` const at `:437`.
- **RETAIN** the summary-buffer CAS path `:479-507` verbatim, plus the draft-byte invariants
  `:511-514`, the retained-summary assertion `:515`, the `Reload latest` behaviour `:518-520`, the
  `Close review notes` at `:522`, and the occupied-revision API block from `:547` onward.
- **RETAIN** `:448-453` and `:474-478`: both seed comments through the surviving inline composer,
  which is what advances the draft revision that the CAS assertions depend on.

## Responsive geometry step: verified line-by-line disposition

`test.step` `:1232-1560` (`'review rail and drawers honor locked responsive geometry'`) is **mixed**:
it interleaves rail geometry with sidebar-collapse, header-wrap, state-card, box-shadow, and
overflow contracts that all survive. It cannot be deleted wholesale, and the five-reference summary
in an earlier draft of this plan was not sufficient. Verified disposition, bottom-up when editing:

**RETITLE** `:1232` to drop the rail: `'drawers and columns honor locked responsive geometry'`.

**DELETE** (each range verified at HEAD `8b2a050`):

| Lines | What |
|---|---|
| `:1229` | rail-open prologue click, immediately before the step |
| `:1233-1234` | `rail` and `panel` locator consts |
| `:1237` | `reviewButton` const |
| `:1300-1317` | rail close-if-visible, `canvasWidthBeforeRail`, rail open + `--surface-panel` background + 360px width + `overflow-y` assertions, and the `reviewScrollOwners` evaluate **through its `:1317` expectation** — `:1317` reads the const declared at `:1312`, so the unit is `:1300-1317`, never `:1300-1316` |
| `:1329-1330` | `Close review` click + rail-not-visible |
| `:1345-1348` | rail open/`--open` class/overlay shadow/360px at 1051px |
| `:1350-1352` | `Close review` + rail class/shadow at 1051px |
| `:1358` | rail `box-shadow: none` at 1050px |
| `:1376-1378` | rail open + class + overlay shadow at 1050px |
| `:1379-1398` | the `reviewShell` evaluate whose payload reads `.comments-rail` (`:1382`, `:1386`) **through its `:1391-1398` `toEqual`** — delete as one unit |
| `:1400-1402` | `Close review` + rail class/shadow at 1050px |
| `:1447` | rail `box-shadow: none` at 761px |
| `:1465-1467` | rail open + class + overlay shadow at 761px |
| `:1468-1487` | the second `.comments-rail` `reviewShell` evaluate **through its `:1480-1487` `toEqual`** — one unit |
| `:1489-1491` | `Close review` + rail class/shadow at 761px |
| `:1500-1503` | `Details` disclosure const, click, dialog assertion, and the `Escape` that only closed that dialog |
| `:1504` | rail `box-shadow: none` |
| `:1505-1509` | rail open + `mediumBox` 360px/753px geometry + overlay shadow |
| `:1511-1512` | `Close review` + rail shadow |
| `:1532-1535` | rail shadow/open/360px at 759px |
| `:1537-1538` | `Close review` + rail shadow at 759px |
| `:1541-1546` | rail shadow/open/`compactBox` 359px/367px/overlay shadow at 375px |
| `:1550-1551` | `Close review` + rail shadow at 375px |
| `:1554-1558` | `reviewButton` focus round-trip and `expectFocusIndicatorUnclipped` at 320px |

**KEEP — do not touch:**

- `assertFilesCollapse` (`:1243-1296`) and both call sites `:1331`, `:1499`.
- `:1242` `overlayShadow`. It looks rail-only but is **not**: `:1524` asserts the Changed files
  dialog's `box-shadow` against it, and that dialog survives. Deleting `:1242` breaks a surviving
  assertion.
- The `stateCard` block `:1318-1324` and `:1547`, `:1549` (padding at 1440 and 375, plus cleanup).
- The static-surface `box-shadow: none` loop `:1325-1327` — note `:1327` is the loop's closing
  brace, so the deletions above stop at `:1317` and resume at `:1329`.
- **Every** `assertNoPageOverflow(page)`: `:1295`, `:1328`, `:1349`, `:1399`, `:1488`, `:1510`,
  `:1525`, `:1536`, `:1548`, `:1559`. Each stays at its current width; the viewport-setting lines
  (`:1298`, `:1344`, `:1354`, `:1404`, `:1493`, `:1495`, `:1498`, `:1514`, `:1531`, `:1540`,
  `:1553`) all survive so those widths are still exercised.
- The sidebar-width breakpoint checks `:1493-1497` (1651px vs 1051px `treePane` width).
- Header-wrap geometry `:1355-1357`, `:1405-1446`, and both column-layout evaluates `:1359-1375`
  and `:1448-1464`.
- The Changed files dialog block `:1514-1529`.

**RETARGET** the focus-ring block `:1333-1342`: it asserts `--focus-ring` colour, style, width,
offset and an unclipped indicator — a surviving contract — but through `reviewButton`. Re-anchor all
five references (`:1333`, `:1336`, `:1337`, `:1342`) to
`page.getByRole('button', { name: 'Hide changed files sidebar', exact: true })`, which is proven
present and enabled at this width by `:1245-1247` in the same step. Do not re-anchor it to a
`Next change` toolbar button here: at `:1333` the step has just run `assertFilesCollapse(1440)` and
makes no guarantee about active-file state, so the change-navigation buttons may be disabled.

**Zoom step `:1593-1621` (finding: `:1597` is mischaracterised).** `:1597` is not a rail-visibility
assertion — it is `const review = page.getByRole('button', { name: 'Review', exact: true })`, and
`:1598-1599` focus it and assert focus, while `:1617` reads back `document.activeElement`'s label.
Deleting `:1597` alone leaves two references to an undeclared identifier that **nothing** catches:
the step runs only under `CUMPA_TRUE_ZOOM=1` (`:1593`) so it never executes in CI, and `tests/` is
in no tsconfig, so no typecheck sees it either.
- **DELETE `:1597-1599` as one unit** and re-anchor the step's focus subject to a surviving control:
  `const nextChange = page.getByRole('button', { name: 'Next change', exact: true });` then
  `await nextChange.focus();` and `await expect(nextChange).toBeFocused();`. `Next change` is the
  right subject here (unlike `:1333`): the zoom step's purpose is to observe which control holds
  focus through a true 4× zoom reflow, and `:1607-1620` logs that focus label. A file is active at
  this point in the test, so the change-navigation controls are enabled.

## Runtime console gate (the only gate that catches leftover template identifiers)

A leftover template reference — `:expanded="detailsOpen"`, `@toggle="openDetails"`,
`:review-expanded="commentsOpen"` — compiles cleanly through `build:web` and surfaces **only** as a
Vue warning at runtime. Nothing in the existing gate set observes that (see **Gate coverage
reality** below). Add exactly one runtime gate:

**Host: `tests/integration/anchored-workspace.spec.ts`, inside `openReview` (`:289-294`).**

Why that placement and not an e2e spec: this spec boots the real `App.vue` root through a Vite
**dev** server created in-process (`createServer` at `:165-167`, `startAppServer`), and Vue emits
resolution/prop warnings only in dev builds. The packaged e2e specs run the production `build:web`
bundle, where those warnings are compiled out — they physically cannot observe this class of defect.
`openReview` is also the single full-boot entry point shared by nearly every test in the file, so one
edit covers every boot.

Implementation: before the `page.goto` on `:291`, attach
`page.on('console', …)` collecting entries whose `type()` is `'warning'` or `'error'`, and
`page.on('pageerror', …)` collecting thrown errors; after the existing `:292` h1 assertion and
`:293` Monaco-visible assertion, assert the collected list is empty (`expect(entries).toEqual([])`
so a failure prints the warning text). Register the listeners inside `openReview` itself, not in a
`beforeEach`, so tests that do not boot the app are unaffected.


---

# Regression guards for the surviving flows

The executor MUST run these and report pass/fail per spec. They cover every flow CONTEXT
`<canonical_refs>` declares out of scope for breakage:

| Flow that must still work | Proving spec |
|---|---|
| Summary edit/save, Review-notes dialog open/close | `tests/e2e/review-notes-dialog.spec.ts` (unmodified) |
| Export `review.json` + `review.md`, drift acknowledgement | `tests/e2e/agent-ready-export.spec.ts` |
| Attached-review failure notices (`staleAnchors`, `scopeInvalid`, `revisionConflict`) | `tests/e2e/agent-ready-export-safety.spec.ts` |
| Draft persistence, Finish attached review, inline comment creation | `tests/e2e/complete-review-draft.spec.ts` |
| Export receipt + `Comparison` disclosure | `tests/integration/export-receipt-ui.spec.ts` (unmodified) |
| Support dialog | `tests/integration/support-dialog.spec.ts` (unmodified) |
| Changed files dialog, toolbar geometry, responsive layout at 320/760/1050/1440/1650 | `tests/e2e/responsive-session.spec.ts` |
| Inline comment creation with anchors, anchor verification | `tests/integration/anchored-workspace.spec.ts` |
| Selector-drift notices | `tests/integration/selector-drift-ui.spec.ts` |
| `projectCommentGroups` contract | `tests/unit/comment-groups.test.ts` (unmodified) |

If any of these fails for a reason other than a removed locator you still need to clean up, **stop
and report** — CONTEXT `<canonical_refs>` makes breaking export, summary, Finish attached review, or
draft persistence out of scope.

---

# Gate coverage reality — read before trusting any gate

**`npm run typecheck:web` does not typecheck a single `.vue` file.** `tsconfig.web.json` uses a
`files` array listing exactly seven `.ts` entries (`src/web/monaco/diff-adapter.ts`,
`diff-semantics.ts`, `line-mapping.ts`, `theme.ts`, `src/web/theme/token-contract.ts`,
`virtual-tokens.d.ts`, `src/web/model/workspace-command.ts`). `App.vue`, `ReviewToolbar.vue`,
`IdentityHeader.vue`, `StaleAnchorNotice.vue`, and `ReviewNotesDialog.vue` — every file Task 1
edits — are typechecked by **nothing**. The command exits 0 in well under a second and proves
nothing about this change. It stays in the gate set only to prove the seven `.ts` files were not
collaterally broken; it is **not** evidence that the removal is complete.

**Do not "fix" this by switching the tsconfig to `include` and adding a `vue-tsc` gate.** That was
tried and is not executable in this repo: installed `typescript` is `7.0.2` (the native port), which
no longer exposes the `./lib/tsc` subpath export that `vue-tsc@3.3.7` resolves at startup, so
`vue-tsc` dies with `ERR_PACKAGE_PATH_NOT_EXPORTED` before it reads any tsconfig. Pinning or
upgrading TypeScript is far outside a quick task's scope.

**Consequence — what actually catches a missed identifier.** A leftover template reference such as
`:expanded="detailsOpen"` (`App.vue:1220`), `@toggle="openDetails"` (`:1226`), or
`:review-expanded="commentsOpen"` (`:1267`) compiles cleanly through `build:web` and surfaces only
as a Vue warning at runtime. So the real gates for this task are deterministic and runtime, not
type-based:

1. **Deterministic identifier grep** over `src/web/` — Task 1 `<done>`. Zero hits, identifiers
   enumerated explicitly so the gate cannot drift.
2. **Runtime console gate** — Task 3, in `anchored-workspace.spec.ts`'s `openReview`, the one
   harness that boots the app through a Vite **dev** server where Vue warnings still exist.
3. **`npm run verify:semantic-css`** — Task 2. Runs `build:web` then
   `scripts/verify-semantic-css.mjs`, which validates the token contract against the built CSS
   **and** reads `src/web/prototypes/Phase6DiffSemanticsPrototype.vue` (`:16`, consumed at `:380`,
   `:417`) — the file that keeps `.comments-rail__heading` alive (D.1). It subsumes `build:web`.

---

## Final plan-check corrections — AUTHORITATIVE over the per-spec table rows above

Second-iteration plan-check (`agent://RemovalChecker2`) cleared all seven earlier blockers, ran
both gates at HEAD (Task 1 grep fails today with hits in exactly 5 files, all deleted or edited
by Task 1; `verify:semantic-css` exits 0), and proved the runtime console gate works where it is
placed (Vue 3.5.39 emits `Property "…" was accessed during render but is not defined on
instance.` from `runtime-core.esm-bundler.js:3444-3455` under a DEV server; the production bundle
contains zero occurrences, so only the in-process Vite spec can observe it; a trace run recorded
2 console events, both `debug`, so the collector is not self-tripping).

It then found five remaining defects. **Where these conflict with a per-spec row above, these
win.** Four are the same failure mode as earlier finding 6 — a range named by its entry point
rather than its consuming block — so the executor MUST, for every deletion range in this plan,
read forward to the last consumer of every identifier declared inside it before deleting.

1. **`complete-review-draft.spec.ts` — `afterDeleteRevision` escapes the delete range.**
   `:535` declares it inside the `:523-545` deletion, and the RETAINED `:547+` block reads it
   seven times (`:566`, `:569`, `:595`, `:600`, `:601`, `:628`, `:635`). Its siblings
   `afterDeleteBytes`/`afterDeleteHash` (`:533-534`) are genuinely dead. Delete `:523-545` as
   written, then re-establish the revision from disk immediately after the retained `:522`
   (`Close review notes` click) with one line:
   `const afterDeleteRevision = JSON.parse(readFileSync(draftPath).toString('utf8')).revision;`
   Without this the spec does not resolve and the retained two-tab CAS test — this plan's named
   draft-persistence guard — cannot run.
2. **`responsive-session.spec.ts` tooltip block — do NOT delete `:1009-1027`.** `:1023`
   (`keyboardHelp`) and `:1027` (`tooltip`) have surviving consumers at `:1028`, `:1030`,
   `:1032`, `:1033`, `:1035`, `:1037`, `:1038`, `:1040`, and `:1010-1021` is gutter coverage
   (`expectGutterLabelSurface` at `:1014`, `:1019`) for the SURVIVING "Add comment to head
   line 10" control. DELETE `:1023-1040`; KEEP `:1041` and `:1010-1021`; retarget `:1009`'s
   `const` and its only use at `:1020` to a surviving focusable
   (`page.getByRole('button', { name: 'Next change', exact: true })`).
3. **`responsive-session.spec.ts` Keyboard-help→Details step — `:1077-1083` splits a
   statement.** `:1082-1085` is one `const keyboardHeading = details.getByRole('heading', {…});`
   call; ending at `:1083` strands `exact: true,` and `});`, and orphans `keyboardHeading`
   (`:1086-1087`), `details` (`:1088-1090`, `:1092`) and `keyboardHelp` (`:1093`).
   DELETE `:1077-1093` as one unit, retaining `:1095-1098` (F7 / Shift+F7 / Monaco /
   `assertNoPageOverflow`).
4. **`responsive-session.spec.ts` contrast/boundary block — `:846-861` ends four lines short.**
   The block runs `:846` (`const review`) to `:864`, and its final call spans `:859-864`;
   stopping at `:861` strands `1.8,`, `'borderColor',`, `);`. DELETE `:846-864`; `:865` closes
   the step and nothing after `:864` uses `review`.
5. **`pinned-session.spec.ts` Details ranges name entry points only.** Extend each to its last
   consumer: `:444-445` → **`:444-457`** (`:446-457` is an unbroken run of `.identity-row`
   assertions against deleted `IdentityPanel` markup, ending before `} finally {` at `:458`);
   `:500-502` → through the last read of `scope` (`:503-506+`); `:556-557` → **`:556-558`**
   (`:558` reads `scope`). Then re-read every other listed range in that row (`:605-607`,
   `:904-906`, `:983-989`, `:1162-1164`, `:1201`, `:1424-1427`) to its last consumer before
   deleting — the row's convention is demonstrably entry-point-only.

Also fold in, from the same report:

- **`agent-ready-export.spec.ts` is in `playwright.config.ts:6-9` `testIgnore`.** Under the
  default config it silently contributes zero tests (`--list` → "No tests found"), so Task 3's
  "every regression-guard spec passes" is unfalsifiable for it. Drop it from the default-config
  command and run it under its own config instead:
  `npm run pack:runtime-artifact && npx playwright test --config playwright.runtime-artifact.config.ts tests/e2e/agent-ready-export.spec.ts`.
  Export coverage otherwise survives via `agent-ready-export-safety.spec.ts` and
  `complete-review-draft.spec.ts`.
- **Two helpers lose every call site and must be deleted with them:** `expectTooltipSurface`
  (`responsive-session.spec.ts:630-641`; users `:1028`, `:1033`, `:1038`) and
  `expectMinimumTarget` (`:253-…`; only user `:1567`, inside the deleted `:1561-1583`).
  `expectGutterLabelSurface` MUST SURVIVE — correction 2 above is what saves it.
- Wording only: the focus-ring retarget note says "all five references" but lists four
  (`:1333`, `:1336`, `:1337`, `:1342`); four is correct, the fifth (`:1345`) is deleted with
  `:1345-1348`.


<tasks>

<task type="auto">
  <name>Task 1: Delete the three surfaces and resolve every dangling reference (D-source-removal)</name>
  <files>src/web/App.vue, src/web/components/ReviewToolbar.vue, src/web/components/IdentityHeader.vue, src/web/components/StaleAnchorNotice.vue, src/web/components/ReviewNotesDialog.vue, src/web/components/ReviewPanel.vue, src/web/components/DetailsDialog.vue, src/web/components/IdentityPanel.vue, src/web/components/FileMetadataPane.vue, src/web/components/KeyboardHelp.vue</files>
  <action>
Delete the five components in Manifest A (leave `tests/e2e/review-panel-resolved.spec.ts` for Task 3).

Apply Manifest B to `src/web/App.vue` and Manifest C to `ReviewToolbar.vue` and
`IdentityHeader.vue`. Work bottom-up within each file; re-read each region before editing because
line numbers shift as you delete.

Apply the five dangling-reference resolutions exactly as written above, including the three
verbatim replacement strings for `App.vue:174`, `:181`, `:182`, the verbatim replacement
paragraph in `StaleAnchorNotice.vue:14`, and the two verbatim paragraph trims in
`ReviewNotesDialog.vue` — `:253` (drop `Review the affected comments.`) and `:264` (drop
`Inspect the recorded patch scope,` / `Inspect the recorded review scope,` from both ternary
branches). Delete the `viewAttachedScope` and `reviewStaleFeedback` emit declarations and their two
buttons in `ReviewNotesDialog.vue`, keeping both enclosing notices, both `<h4>` headings, and their
`completionFailure` refs. Every one of those five strings is asserted verbatim by a spec Task 3
retargets; type them exactly as written or Task 3's retargets will not match.

Honour Manifest E: do NOT delete `src/web/model/comment-groups.ts`, do NOT modify
`src/web/model/review-draft-state.ts`, and do NOT touch `src/web/api/client.ts` or the
file-metadata server route. Keep `App.vue:742`, `:744-745` so
`diffWorkspace.focusComment` still runs.

Delete the toolbar actions group element outright per the Toolbar actions-group resolution. Add no
replacement CSS and no replacement markup: no relocation (CONTEXT LOCKED decision). Leave no
commented-out copies and no hidden duplicates of any removed content.
  </action>
  <verify>
    <automated>npm run typecheck:web && ! git grep -nE 'ReviewPanel|DetailsDialog|IdentityPanel|FileMetadataPane|[Kk]eyboardHelp|commentsOpen|commentsOpener|openComments|closeComments|reviewPanel|detailsDialog|openDetails|closeDetails|detailsOpen|openCommentCount|resolvedCommentCount|selectedCommentId|view-attached-scope|focus-stale-feedback|open-comments' -- src/web</automated>
  </verify>
  <done>
**The gate is the grep, not the typecheck.** Read **Gate coverage reality** first: `typecheck:web`
covers seven `.ts` files and zero `.vue` files, so it cannot see anything Task 1 edits. It must
still exit 0 (proving the seven `.ts` files are intact), but the binding acceptance criterion is
the identifier scan.

`git grep -nE '<pattern>' -- src/web` returns **zero hits** for every one of these identifiers,
enumerated so the gate cannot drift: `ReviewPanel`, `DetailsDialog`, `IdentityPanel`,
`FileMetadataPane`, `KeyboardHelp` / `keyboardHelp` (which also covers `openKeyboardHelp` and
`focusKeyboardHelp`), `commentsOpen`, `commentsOpener`, `openComments`, `closeComments`,
`reviewPanel`, `detailsDialog`, `openDetails`, `closeDetails`, `detailsOpen`, `openCommentCount`,
`resolvedCommentCount`, `selectedCommentId`, `view-attached-scope`, `focus-stale-feedback`, and
`open-comments`. Verified at HEAD: every current hit lives in a file this task deletes or edits
(`DetailsDialog.vue`, `ReviewPanel.vue`, `ReviewToolbar.vue`, `StaleAnchorNotice.vue`, `App.vue`),
and none appears in `src/web/main.ts`, `src/web/model/`, `src/web/monaco/`,
`src/web/prototypes/`, or `src/web/styles.css` — so zero is reachable and the scan is not
self-tripping. `toggleComments`, `loadFileMetadata`, `selectedMetadata`, `metadataLoading`,
`metadataError`, `retryMetadata`, `inspectRecordedFile`, `copyRecordedAnchor`, `mutateComment`,
`saveComment`, `focusStaleFeedback`, `metadataRequestVersion`, `FileMetadataResponse`, and the
`'details'` `ShellDialog` member are gone from `src/web/App.vue` too — check these by reading the
file, since some are legitimately still present elsewhere in the repo (`FileMetadataResponse` in
`src/contracts/api`, the file-metadata server route) and must NOT be removed there.

The five components in Manifest A are gone from `src/web/components/`. `ReviewToolbar.vue`
declares exactly three props and four emits and renders exactly two `.review-toolbar__group`
elements. `src/web/model/comment-groups.ts` still exists and still exports
`projectCommentGroups`. The five verbatim replacement strings (`App.vue:174`, `:181`, `:182`,
`StaleAnchorNotice.vue:14`, and both `ReviewNotesDialog.vue` trims at `:253`/`:264`) are byte-exact
as written in the dangling-reference resolutions.
  </done>
</task>

<task type="auto">
  <name>Task 2: Purge the dead CSS without touching the export dialog's rules (D-css-audit)</name>
  <files>src/web/styles.css</files>
  <action>
Apply Manifest D top-down by section but bottom-up by line number within each section
(highest line first), re-reading each region before editing.

Respect the DELETE RULE / DROP SELECTOR distinction precisely. A DROP SELECTOR edit removes one
selector line from a grouped list and leaves the rule and its remaining selectors intact; deleting
the whole rule instead is the failure mode that silently breaks surviving surfaces. When you drop
the selector that carries the opening brace, move the brace to the new last selector.

Do not delete `:208` (`.review-panel__confirm`), `:1408-1414` or `:1417-1421`
(`.review-panel__conflict`), the `.comments-rail__heading` selector on `:361` or on `:386` (D.1 —
three live prototype consumers), any `.review-summary*` rule, any `.export-*` rule, any
`.availability-marker` rule, or `:1662-1667` (the rule must survive for its two `.export-section`
selectors). Per Manifest D.5, make no change to `.review-shell` or to any of the three breakpoint
blocks, and leave `.review-shell`'s now-inert `position: relative` / `contain: paint` alone.

After editing, prove the audit with a grep pass over `src/web/styles.css`: the only surviving
`review-panel` selectors are `__confirm` (1 occurrence) and `__conflict` (2 occurrences); the only
surviving `comments-rail` occurrences are the two `.comments-rail__heading` selector lines at
`:361` and `:386` (**exactly 2, no more, no fewer** — a blanket "zero occurrences of
`comments-rail`" gate would force the wrong deletion and collapse three prototype flex rows); and
zero occurrences remain of `keyboard-help`, `file-metadata-pane`, `metadata-section`,
`metadata-list`, `metadata-value`, `metadata-label`, `file-facts`, `identity-panel`,
`identity-list`, `identity-row`, `identity-value`, `identity-meta-label`, `object-id`,
`worktree-path`, `source-label`, `dirty-explanation`, and `review-toolbar__group--actions`.
Cross-check the inverse direction too: every class still referenced from a surviving `.vue`
template — **including `src/web/prototypes/Phase6DiffSemanticsPrototype.vue`** — still has its rule.
  </action>
  <verify>
    <automated>npm run verify:semantic-css</automated>
  </verify>
  <done>
`npm run verify:semantic-css` succeeds. It runs `build:web` first, so it subsumes the build gate,
and it then runs `scripts/verify-semantic-css.mjs`, which validates the token contract against the
built CSS **and** reads `Phase6DiffSemanticsPrototype.vue` (`:16`, consumed at `:380` and `:417`) —
the consumer that keeps `.comments-rail__heading` alive. Expected to pass: every Manifest D
deletion was simulated against the script's `assertDeclaredTokensConsumed` check and leaves zero
orphaned tokens. If it fails on an orphaned token, a DELETE RULE went too far — fix the deletion,
do not relax the script.

The grep pass above holds in both directions, including exactly two surviving `comments-rail`
occurrences (`:361`, `:386`). `.review-summary`, `.export-section`, `.review-panel__confirm`,
`.review-panel__conflict`, `.availability-marker`, `.identity-disclosure`,
`.review-toolbar__status`, and `.review-toolbar__counts` rules are intact.
`.review-toolbar__active-file` still carries `max-width: 40%` at `:1554`-equivalent and
`max-width: none` inside the ≤760px block. No `.review-shell` rule and no breakpoint block changed.
  </done>
</task>

<task type="auto">
  <name>Task 3: Retarget the test surface and prove the surviving flows (D-test-surface)</name>
  <files>tests/e2e/review-panel-resolved.spec.ts, tests/e2e/responsive-session.spec.ts, tests/e2e/pinned-session.spec.ts, tests/e2e/anchored-review.spec.ts, tests/e2e/agent-ready-export.spec.ts, tests/e2e/agent-ready-export-safety.spec.ts, tests/e2e/complete-review-draft.spec.ts, tests/e2e/marketplace-review.spec.ts, tests/e2e/public-support-states.spec.ts, tests/integration/anchored-workspace.spec.ts, tests/integration/selector-drift-ui.spec.ts</files>
  <action>
Delete `tests/e2e/review-panel-resolved.spec.ts` outright.

Apply the per-spec DELETE / RETARGET table. Honour the helper correction: delete the six
`ensureReviewOpen` definitions and every call site; keep all four `openReview` definitions and both
`openReviewNotes` definitions untouched. Delete the four rail-collapse prologues while preserving
the comment-creation bodies around them.

Apply the five `responsive-session.spec.ts` toolbar edits from the Toolbar actions-group
resolution, including the group count of 2 and the step retitle to four controls. Then apply
**Responsive geometry step: verified line-by-line disposition** for `test.step` `:1232-1560` and the
`CUMPA_TRUE_ZOOM` step `:1593-1621`. That step is mixed; deleting it wholesale destroys surviving
sidebar-collapse, header-wrap, state-card, box-shadow, and overflow coverage. Note three traps
called out there: `:1317` reads a const declared at `:1312` (delete `:1300-1317` as one unit);
`:1327` is the closing brace of the surviving `box-shadow` loop; and `:1242` `overlayShadow` must
survive because `:1524` asserts the Changed files dialog against it.

Apply **anchored-workspace: whole-test and single-assertion dispositions** and
**complete-review-draft: verified per-test disposition**. Three tests are deleted in full —
`anchored-workspace.spec.ts:757-816`, `complete-review-draft.spec.ts:314-388`, and the file
`review-panel-resolved.spec.ts` — because each one's entire subject is a capability the user
accepted losing. Two tests are retargeted rather than gutted: `anchored-workspace.spec.ts:595-607`
(its only assertion moves to the draft-mutation response plus the surviving
`.inline-accepted-comment` card) and `complete-review-draft.spec.ts:429-647` (comment-buffer half
deleted, summary-buffer CAS path retained, retitled).

Add the **Runtime console gate** to `anchored-workspace.spec.ts`'s `openReview` (`:289-294`) exactly
as specified. This is the only gate in the whole task that catches a leftover template identifier;
`build:web` compiles them silently and `typecheck:web` never reads a `.vue` file.

Retarget `pinned-session.spec.ts:555` to the exact new copy
`'The pinned commits contain no changed files.'`. Delete the `FileMetadataPane` harness and the
metadata-request evidence there per the table.

Retarget the three `agent-ready-export-safety.spec.ts` paragraph assertions (`:190`, `:202`,
`:206`) to the trimmed `ReviewNotesDialog` strings from Dangling references 3 and 5 — do not keep
them verbatim, and do not delete them either.

Never re-pin removed markup: delete assertions on removed controls rather than asserting their
absence, except where the table explicitly says otherwise. Do not add new test files.

Before running anything, reconcile your edits against a fresh grep of `tests/` for
`comments-rail`, `review-panel`, `name: 'Review', exact: true`, `Keyboard help`,
`Keyboard actions`, `name: 'Details'`, `Close review` (excluding `review-notes-dialog.spec.ts`),
`review-heading`, `Open comments`, `ensureReviewOpen`, `FileMetadataPane`, `Review stale feedback`,
`View review scope`, `View patch scope`, and — because these are prose, not locators, and nothing
else catches them — the three replaced copy strings:
`Stale and unavailable comments remain visible as read-only history.`,
`Inspect the recorded review scope,`, and `Inspect the recorded patch scope,`. Also grep
`Details lists` to confirm no spec still pins the old empty-comparison copy. Every remaining hit
must be a documented KEEP from the table; if any is not, resolve it before proceeding.

Then run the named regression guards. Run each spec individually with
`npx playwright test <spec>` — do not run the project-wide suite and do not run formatters.
  </action>
  <verify>
    <automated>npx playwright test tests/e2e/review-notes-dialog.spec.ts tests/e2e/agent-ready-export.spec.ts tests/e2e/agent-ready-export-safety.spec.ts tests/e2e/complete-review-draft.spec.ts tests/e2e/responsive-session.spec.ts tests/e2e/pinned-session.spec.ts tests/e2e/anchored-review.spec.ts tests/e2e/marketplace-review.spec.ts tests/e2e/public-support-states.spec.ts tests/integration/anchored-workspace.spec.ts tests/integration/selector-drift-ui.spec.ts tests/integration/support-dialog.spec.ts tests/integration/export-receipt-ui.spec.ts</automated>
  </verify>
  <done>
`tests/e2e/review-panel-resolved.spec.ts` no longer exists. The reconciliation grep — including the
three replaced copy strings — leaves only documented KEEP hits.

**The runtime console gate is in place and green.** `tests/integration/anchored-workspace.spec.ts`
asserts an empty console-warning/error + `pageerror` collection on every `openReview` boot, and the
whole spec passes. This is the acceptance criterion for "no leftover template identifier": a
surviving `:expanded="detailsOpen"`-class reference fails here and nowhere else.

The three whole-test deletions are done (`anchored-workspace.spec.ts:757-816`,
`complete-review-draft.spec.ts:314-388`, and the deleted file) and the two retargeted tests still
assert their original subject: `'inline comment persistence'` proves a 201 draft mutation plus a
rendered `.inline-accepted-comment`, and the retitled two-tab test still proves summary-buffer
retention and fresh-CAS-after-reload. The responsive geometry step still runs
`assertNoPageOverflow` at every width it did before, still checks the 1651/1051 sidebar-width
breakpoint, still checks state-card padding at 1440 and 375, and still asserts the focus-ring
token set — now through `Hide changed files sidebar`.

Every spec in the regression-guard table passes, with `review-notes-dialog.spec.ts`,
`support-dialog.spec.ts`, and `export-receipt-ui.spec.ts` passing unmodified. Export, summary,
Finish attached review, draft persistence, inline comment creation, the Changed files dialog, and
the Support dialog are all proven working. Any failure in those flows for a reason other than
leftover removed-locator cleanup is reported, not worked around.
  </done>
</task>

</tasks>

<verification>
1. **Deterministic identifier grep** — `git grep -nE '<the 20 identifiers>' -- src/web` returns zero
   hits (Task 1 `<verify>`). This is the primary gate for source removal.
2. **Runtime console gate** — `tests/integration/anchored-workspace.spec.ts` asserts no Vue
   warning, console error, or `pageerror` on app boot inside `openReview` (Task 3). This is the only
   gate that catches a leftover template identifier.
3. `npm run verify:semantic-css` — succeeds (Task 2). Runs `build:web` first, so it subsumes the
   build gate, and validates the Phase 6 prototype that keeps `.comments-rail__heading` alive.
4. `npm run build:web` — succeeds. Covered by item 3; run standalone only if 3 is skipped.
5. `npm run typecheck:web` — zero errors. **Weak by construction:** it typechecks seven `.ts` files
   and zero `.vue` files (see **Gate coverage reality**). It proves only that the seven `.ts` files
   were not collaterally broken. Do not treat it as evidence of complete removal, and do not try to
   strengthen it with `vue-tsc` — `vue-tsc@3.3.7` cannot start against the installed
   `typescript@7.0.2`.
6. The named specs in the regression-guard table — all pass:
   `tests/e2e/review-notes-dialog.spec.ts`, `agent-ready-export.spec.ts`,
   `agent-ready-export-safety.spec.ts`, `complete-review-draft.spec.ts`,
   `responsive-session.spec.ts`, `pinned-session.spec.ts`, `anchored-review.spec.ts`,
   `marketplace-review.spec.ts`, `public-support-states.spec.ts`,
   `tests/integration/anchored-workspace.spec.ts`, `selector-drift-ui.spec.ts`,
   `support-dialog.spec.ts`, `export-receipt-ui.spec.ts`, and `tests/unit/comment-groups.test.ts`.
7. Bidirectional CSS grep audit over `src/web/styles.css` (Task 2 action), with exactly two
   surviving `comments-rail` occurrences (`:361`, `:386`) — not zero.
8. Test-surface reconciliation grep over `tests/`, including the three replaced copy strings
   (Task 3 action).
</verification>

<success_criteria>
- Details, Review, and Keyboard help entry points and their five components no longer exist; no
  commented-out or hidden copy of any of them remains.
- The diff toolbar renders two groups and four navigation controls; `.review-toolbar__active-file`
  is still capped at `max-width: 40%`; no replacement rule was added to claim the freed space.
- Every dangling reference is resolved at both ends: `?`, the three error strings, the two
  `ReviewNotesDialog` failure-notice strings, `@view-attached-scope` plus its emitter and button,
  `@focus-stale-feedback` plus the `reviewStaleFeedback` emitter and button, and
  `StaleAnchorNotice`'s emit and button.
- No shipped copy instructs the developer to use a removed surface: `StaleAnchorNotice.vue:14`,
  `ReviewNotesDialog.vue:253` and `:264`, and `App.vue:174`/`:181`/`:182` all carry their trimmed
  text, and the specs that pinned the old text are retargeted, not deleted.
- No Vue warning, console error, or `pageerror` is emitted on app boot (runtime console gate) — the
  only proof available that no template identifier was left behind.
- `.comments-rail__heading` still exists at `styles.css:361` and `:386`; `npm run
  verify:semantic-css` passes and the `?prototype=phase6` prototype still renders its three
  `<h2>` + pill rows.
- `StaleAnchorNotice` survives as a non-interactive warning with corrected copy.
- `diffWorkspace.focusComment` still runs from the `focus-comment` workspace command.
- `src/web/model/comment-groups.ts` survives with its surviving readers intact.
- The export dialog's CSS (`.review-summary*`, `.export-section*`, `.review-panel__confirm`,
  `.review-panel__conflict`) is intact.
- Export, summary, Finish attached review, draft persistence, inline comment creation, the Changed
  files dialog, and the Support dialog all still work, proven by the named specs.
</success_criteria>

<output>
Create `.planning/quick/260915-jbv-remove-details-review-keyboard-help/260915-jbv-SUMMARY.md` when done.
</output>
