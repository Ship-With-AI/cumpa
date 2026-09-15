# Quick Task 260915-gxg: Remove the active-file context bar, merge its surviving controls into the navigation bar - Context

**Gathered:** 2026-09-15
**Status:** Ready for planning

<domain>
## Task Boundary

Remove the `.active-file-toolbar__context` section entirely (the second bar: BASE oid block,
active-file `h1` + directory, status/counts, Files toggle, HEAD oid block) and move the Files
toggle down onto the same bar that already carries the file-navigation and change-navigation
buttons (`.active-file-toolbar__review` > `ReviewToolbar`).

User-supplied screenshot captured exactly `.active-file-toolbar__context` as rendered at
desktop width.

</domain>

<decisions>
## Implementation Decisions

### Active file name (LOCKED — user chose "Compact in the nav bar")
- The filename (and its status/counts) MUST remain **visible**, rendered compactly inside the
  navigation bar, positioned left of the Files button.
- `<h1 id="cumpa-heading" tabindex="-1">` MUST survive as a real, visible heading. It is
  load-bearing for `<main class="review-main" aria-labelledby="cumpa-heading">`, the
  "Skip to diff" skip-link (`App.vue:1215`), `focusHeading()`
  (`ActiveFileToolbar.vue:43`), and `anchored-review.spec.ts:394`
  (`getByRole('heading', { level: 1, name: 'src/changed.ts' })`).
- Rejected alternatives: screen-reader-only `h1`; deleting the `h1` and relabelling `main`.

### Base/Head endpoint blocks
- Delete outright. `IdentityHeader` already shows BASE label + short oid, arrow, HEAD label +
  short oid at the top of the shell, so these were duplicated.
- The `isExactPatch` "Preimage"/"Postimage" variant of the same block
  (`ActiveFileToolbar.vue:77-86`) goes with it.

### Component boundary
- Prefer repurposing `ActiveFileToolbar.vue` over deleting it: `App.vue` holds an
  `activeFileToolbar` ref and calls the exposed `focusFilesToggle()` / `focusHeading()`
  (`App.vue:295`, and after dialog dismissal). Keeping the component keeps that wiring and the
  `effectivePath` / `directoryPath` computeds intact and the diff small.
- Newly-unused code MUST go, not linger: `pinnedSession`, `isExactPatch`, `baseShortOid`,
  `headShortOid`, `controlSafeDisplay` import if orphaned, and every
  `.active-file-toolbar__context` / `__endpoint*` / `__title` / `__directory` CSS rule that no
  longer has a consumer.

### Files toggle behavior — unchanged
- Copy stays `Files` (narrow) / `Show files` / `Hide files` (desktop), labels stay
  `Open changed files` / `Show changed files sidebar` / `Hide changed files sidebar`.
- `aria-controls="changed-files"` and `aria-expanded` stay conditional on `filesHostVisible`.
- The toggle must remain the element `focusFilesToggle()` focuses.

</decisions>

<specifics>
## Specific Ideas

Known assertion sites that pin the removed markup — each must be deleted or retargeted, never
re-pinned to relocated copies of the same implementation detail:

- `tests/e2e/pinned-session.spec.ts:1423-1425` — `.active-file-toolbar__context` with visible
  `Base` / `Head` text.
- `tests/e2e/responsive-session.spec.ts:447-506` — no-reflow contract: reads
  `.active-file-toolbar__context`, asserts `headerOrder` equals
  `['active-file-toolbar__file', '…__endpoint--base', '…__endpoint--head']`, measures
  `__endpoint--base` / `__file` / `__endpoint--head` rects, and asserts
  `toolbarGroups` (`.review-toolbar__group`) `toHaveLength(3)` — this count changes if the
  relocation adds a `.review-toolbar__group`.
- `tests/e2e/responsive-session.spec.ts:1177` — `.active-file-toolbar__file` contains
  `alpha.ts` after `Alt+Shift+[`.
- `tests/integration/anchored-workspace.spec.ts:469-473` and `:529-539` — endpoint labels
  `Base`/`Head`, `text-transform: uppercase`, `__endpoint-oid` text `aaaaaaa`, and
  `.active-file-toolbar__context` / `.active-file-toolbar__review` counts.

Related recent work: `80c3b92` fixed the Files toggle's other defect (Teleport host destroyed
by `v-if`). `#changed-files` is now hidden with `v-show`; do not reintroduce `v-if` on it.

Responsive baselines are 760 / 1050 / 1650 (`styles.css:2522-2552`). The merged bar must not
overflow at any of them — `assertNoPageOverflow` already guards this in
`responsive-session.spec.ts`.

</specifics>

<canonical_refs>
## Canonical References

- `.planning/REQUIREMENTS.md` DEBT-01 — four `ReviewToolbar.vue` layout containers carry
  `aria-label` without a queryable `role`, so `getByRole('group', …)` cannot reach them. This
  task touches that file; if a new container is added there, give it `role="group"` rather
  than repeating the defect. Closing DEBT-01 itself is out of scope.
- `mockups/01b-quiet-workspace-tree.html` — the v1.6 visual reference.

</canonical_refs>
