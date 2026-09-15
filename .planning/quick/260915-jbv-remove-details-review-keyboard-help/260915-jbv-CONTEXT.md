# Quick Task 260915-jbv: Remove the Details, Review, and Keyboard help buttons and their surfaces - Context

**Gathered:** 2026-09-15
**Status:** Ready for planning

<domain>
## Task Boundary

Remove three entry points and the surfaces behind them, outright:

1. **Review** — the toolbar toggle in `ReviewToolbar.vue`'s actions group, the `.comments-rail`
   host in `App.vue:1332-1352`, and `ReviewPanel.vue`.
2. **Details** — the header button in `IdentityHeader.vue:134-136`, `DetailsDialog.vue`, and its
   two exclusive children `IdentityPanel.vue` and `FileMetadataPane.vue`.
3. **Keyboard help** — the toolbar button and `KeyboardHelp.vue`. This was never a separate
   modal: `openKeyboardHelp()` (`App.vue:917-919`) opens the Details dialog and focuses the
   `KeyboardHelp` section inside it, and it is also bound to `?` (`App.vue:971-973`).

**Out of scope:** the **Review notes** dialog (`ReviewNotesDialog.vue` — summary, export, Finish
attached review) and the **Changed files** dialog stay. Inline comment *creation* stays
(`CommentComposer` renders inside Monaco via `DiffWorkspace.vue:148`). Support dialog stays.
DEBT-01 is not being fixed here.

</domain>

<decisions>
## Implementation Decisions

### Removal is literal — no relocation (LOCKED, user's words: "remove without relocating information")
- Do NOT move comparison identity, per-file metadata, keyboard help, or the comment lists into
  the Review notes dialog or anywhere else. The information is removed with its surface.
- The user was shown the full capability inventory before choosing this, including that comment
  management and the stale/orphaned anchor records disappear. Do not re-litigate, do not
  "preserve" content by smuggling it into a surviving dialog, and do not leave a hidden or
  commented-out copy.

### Accepted capability losses
- No way to resolve, reopen, edit, discard, or delete a comment after it is created. Comment
  creation, persistence, and export continue to work.
- The stale and orphaned anchor records become unreachable. They are v1.0's audited gap closure
  and are asserted **rail-only** in `tests/e2e/anchored-review.spec.ts` — that coverage is
  removed along with the surface it pins.
- The cross-tab "Review changed in another tab" conflict notice (`ReviewPanel.vue:279-283`)
  disappears. The underlying draft-conflict handling in the model is unaffected; only this
  presentation goes.
- Comparison identity (commits, oids, ordered pathspecs, patch digest), per-file metadata and
  availability, and in-app keyboard help are no longer visible anywhere in the UI.

### Clean cutover — every dangling reference resolves, none is left pointing at a dead surface
- `?` shortcut (`App.vue:971-973`) — remove the branch; do not leave it opening nothing.
- Two empty-comparison error strings name the removed dialog: `App.vue:174`
  ("Details lists the patch digest; …") and `:181-182` ("Details lists the commits…"). Rewrite
  the copy so it does not reference a surface that no longer exists; keep the actionable part of
  each message.
- `@view-attached-scope="openDetails"` (`App.vue:1433`) — resolve the emitter too, do not bind
  it to a no-op.
- `StaleAnchorNotice` (`App.vue:1239`) emits `@open-comments` as its only action; with the rail
  gone that notice has no destination. Decide explicitly: remove the notice, or keep it as a
  non-interactive warning. State which and why.
- `workspace-state` dispatches a `focusComment` command routed to the rail at `App.vue:946-947`;
  `DiffWorkspace.focusComment` at `:744` is a separate in-diff path and must keep working.
- Newly-orphaned module: `projectCommentGroups` in `src/web/model/comment-groups.ts` is imported
  only by `ReviewPanel.vue`. Remove it if nothing else consumes it.
- Also remove the now-unused App.vue state: `commentsOpen`, `commentsOpener`, `openComments`,
  `closeComments`, the comments toggle, `reviewPanel` ref, `detailsDialog` ref, `openDetails`,
  `closeDetails`, `openKeyboardHelp`, `detailsOpen`, `openCommentCount`, `resolvedCommentCount`,
  and the `'details'` member of the `ShellDialog` union — each only if it has no surviving reader.

</decisions>

<specifics>
## Specific Ideas

### Toolbar consequences (this bar was rebuilt today in 260915-gxg, commits `8a9fa1c`..`c49ea08`)
- Removing Review and Keyboard help empties `.review-toolbar__group--actions`
  (`ReviewToolbar.vue:76-95`), including the sr-only `#review-description` counts span and
  `aria-controls="review-panel"`. If the group is deleted, `.review-toolbar__group` drops from 3
  to 2 and these break:
  - `tests/e2e/responsive-session.spec.ts:506` — `expect(reflow.toolbarGroups).toHaveLength(3)`
    and the width/height loop at `:507-510`.
  - `responsive-session.spec.ts` "desktop review toolbar exposes six controls in sequential Tab
    order" — six named controls become four.
  - `.review-toolbar > * + *` (`styles.css:1620-1623`) and
    `.review-toolbar__group--actions { margin-left: auto }` — with the actions group gone,
    something must still claim the free space or the bar's right side collapses. The
    active-file block is deliberately capped at `max-width: 40%` and must stay capped.
- `.comments-rail` CSS: `styles.css:1497-1501` (shared group with `.changed-files-sidebar`),
  `:1514-1520` (grid, border-left, and the `background` restored today in `8b2a050`), `:1521`,
  `:2068`, `:2442-2457` (absolute overlay, transform, `--open` shadow), `:2854`. All go.
  `.review-panel*` rules across `:208`, `:343-353`, `:361`, `:386`, `:783`, `:1408-1420`,
  `:1869`, `:2009-2241` — remove those that belong to the rail panel, but note
  `ReviewNotesDialog` may share some `.review-summary` / `.export-section` selectors: verify
  each before deleting and keep anything the surviving dialog still uses.
- `.review-shell` grid and the responsive rail rules (761-1050, 1650 breakpoints) reference the
  rail column/overlay; reconcile them so the shell still lays out at 320/760/1050/1440/1650.

### Test surface (delete or retarget, never re-pin removed markup)
Reference counts for `comments-rail` / `'Review', exact` / `Keyboard help` / `'Details'`:
`responsive-session.spec.ts` 35, `pinned-session.spec.ts` 17, `anchored-workspace.spec.ts` 12,
`complete-review-draft.spec.ts` 9, `anchored-review.spec.ts` 6, `agent-ready-export.spec.ts` 5,
`review-panel-resolved.spec.ts` 2 (but the whole 430-line file exists only for the rail),
`selector-drift-ui.spec.ts` 2, `marketplace-review.spec.ts` 2,
`public-support-states.spec.ts` 2, `review-notes-dialog.spec.ts` (73 lines, stays — different
dialog).

`tests/e2e/review-panel-resolved.spec.ts` is dedicated to the removed rail: delete the file
rather than hollowing it out. Helpers named `openReview` / `ensureReviewOpen` are shared across
specs — remove them and every call site.

</specifics>

<canonical_refs>
## Canonical References

- `.planning/PROJECT.md` Core Value: "review committed changes … and export precise,
  drift-detectable feedback an agent can act on." Export is unaffected by this task; comment
  *management* is knowingly sacrificed. If any step would break export, summary, Finish attached
  review, or draft persistence, that is out of scope — stop and report instead.
- `8b2a050` restored `.comments-rail`'s background; that rule is removed with the rail, and its
  regression assertion in `responsive-session.spec.ts` goes with it.
- `80c3b92`: `#changed-files` must stay `v-show`, never `v-if` (Teleport resolves its target
  once).

</canonical_refs>
