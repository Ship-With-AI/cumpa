---
phase: 01-pinned-local-comparison
plan: 10
subsystem: ui
tags: [vue, playwright, file-tree, accessibility, opaque-capabilities, tdd]

requires:
  - phase: 01-pinned-local-comparison
    plan: 09
    provides: Deterministic exact-byte file-tree projection, compacted directories, and immutable keyboard navigation state
  - phase: 01-pinned-local-comparison
    plan: 08
    provides: Validated metadata-only session DTOs and launch-scoped opaque file capabilities
provides:
  - Accessible hierarchical changed-file navigation rendered from the tested Plan 09 model
  - Opaque-file-ID selection and capability requests for pointer and keyboard activation
  - Status, safe path, line-count, availability, rename/copy, collision, selection, and focus presentation
  - Production-package Playwright proof for DIFF-01
  - Browser-safe exact-path byte conversion for the shared tree projection

affects: [01-11, 01-12, 01-13, Phase 2 changed-file navigation]

tech-stack:
  added: []
  patterns:
    - Local Vue tree components consume one immutable model instead of duplicating projection or navigation logic
    - Opaque file IDs remain Vue keys, selection event values, DOM row identity, and API capability authority
    - ARIA tree semantics are paired with the complete pointer and keyboard interaction contract

key-files:
  created:
    - src/web/components/FileTree.vue
    - src/web/components/DirectoryRow.vue
    - src/web/components/FileRow.vue
    - src/web/components/StatusBadge.vue
    - src/web/components/PathDisplay.vue
    - tests/e2e/file-tree.spec.ts
  modified:
    - src/web/App.vue
    - src/web/styles.css
    - src/domain/file-tree.ts
    - src/domain/path-bytes.ts

key-decisions:
  - "Render the hierarchy recursively with explicit tree, treeitem, group, aria-level, aria-expanded, and aria-selected semantics while retaining the Plan 09 model as the only navigation state machine."
  - "Treat safe display strings as presentation only; opaque file IDs drive keys, selection emissions, and the existing file-capability request."
  - "Use platform-neutral Uint8Array and base64url operations in the shared exact-path projection so the same tested model executes in production browser assets without a Node Buffer polyfill."

patterns-established:
  - "Tree row identity: directory rows use deterministic directory IDs; file rows and requests use only launch-scoped opaque file IDs."
  - "Focus versus selection: roving focus may rest on directories while aria-selected remains on the previously selected file leaf."
  - "Color-independent state: status letters, expanded accessible labels, numeric count labels, availability text, warning shapes, selection structure, and focus outlines accompany every semantic color."

requirements-completed: [DIFF-01]

duration: 27min
completed: 2026-07-20
status: complete
---

# Phase 01 Plan 10: Accessible Opaque-ID File Tree Summary

**The production Vue package now renders the deterministic changed-file hierarchy as a complete ARIA tree with opaque-ID selection, roving keyboard focus, exact safe-path presentation, textual status/count/availability facts, and collision-safe capability requests.**

## Performance

- **Duration:** 27 min
- **Started:** 2026-07-20T14:57:02Z
- **Completed:** 2026-07-20T15:24:16Z
- **Tasks:** 2
- **Files created or modified:** 10

## Accomplishments

- Rendered the Plan 09 hierarchy directly through `FileTree`, recursive `DirectoryRow`, and leaf `FileRow` components; no second tree projection or navigation implementation was introduced.
- Implemented the full ARIA tree contract with `tree`, `treeitem`, and `group` roles plus observable `aria-level`, `aria-expanded`, `aria-selected`, and roving `tabindex` state.
- Implemented pointer selection and Arrow Up/Down/Left/Right, Home, End, Enter, and Space transitions through `createFileTreeModel`; file focus follows selection while directory focus preserves the current file.
- Kept file identity opaque end to end: file IDs are Vue keys and emitted selection values, and the only selected-file network operation is `GET /api/files/file_<opaque-id>` with no query, body, or display path.
- Rendered visible status text, screen-reader expansions, safe paths, available `+N −N` counts, explicit unavailable-count dashes, and `Text`, `Unsupported`, or `Unavailable` availability labels.
- Preserved complete rename/copy identity as `old path → new path` with accessible `renamed from … to …` or `copied from … to …` names.
- Kept display-colliding invalid-UTF-8 paths as two independently selectable rows whose distinct opaque capabilities produce distinct requests.
- Applied the locked Phase 1 dark palette, spacing scale, typography roles, 40px row minimum, neutral hover/selection treatment, blue selected inset, and a distinct 2px focus outline with 2px offset.

## Task Commits

The plan followed the required behavioral RED then GREEN sequence:

1. **Task 1: RED — specify packaged tree interaction** — `b960bb7` (`test(01-10): specify packaged file-tree behavior`)
2. **Task 2: GREEN — compose accessible opaque-ID tree navigation** — `7f37388` (`feat(01-10): render accessible opaque-ID file tree`)

No separate refactor commit was necessary. Selection emission was simplified before the GREEN commit so a pointer focus followed by click does not issue duplicate capability requests.

## TDD Evidence

### RED — `b960bb7`

The exact plan command ran against a generated package and a real loopback CLI session:

```text
npm run test:package -- tests/e2e/file-tree.spec.ts
```

It exited `1` after package build, pack extraction, CLI startup, authenticated session loading, and fixture comparison succeeded. The first missing behavior was the absent `Changed files` navigation heading/tree:

```text
Locator: getByRole('navigation', { name: 'Changed files' })
  .getByRole('heading', { name: /^Changed files \(\d+\)$/ })
Error: element(s) not found
```

This was a behavioral RED at the planned tree assertion, not a dependency, fixture, package, session, authentication, or test-discovery failure.

### GREEN — `7f37388`

The same exact command ran after the implementation and exited `0`:

```text
Running 1 test using 1 worker
1 passed (4.2s)
```

The command rebuilt production runtime and Vue assets, packed and extracted the npm artifact, launched its generated executable against the Git fixture, loaded the authenticated loopback session, and exercised the browser tree. No formatter, linter, unit suite, API suite, unrelated Playwright file, or project-wide suite was run.

Git history proves gate order:

```text
7f37388 feat(01-10): render accessible opaque-ID file tree
b960bb7 test(01-10): specify packaged file-tree behavior
```

## Roles, States, and Keyboard Proof

The packaged browser case observes the following semantic contract:

| Contract | Observable proof |
|---|---|
| Tree landmark | `nav` named `Changed files` contains the `Changed files (N)` `h2` and named `role="tree"` |
| Hierarchy | Directory/file rows expose `role="treeitem"`, explicit `aria-level`, and nested expanded children live under `role="group"` |
| Expansion | Directory rows expose `aria-expanded`; Enter toggles, Arrow Right expands/enters, and Arrow Left collapses/returns to the parent |
| Selection | Exactly one initial leaf has `aria-selected="true"`; directories remain `aria-selected="false"` |
| Roving focus | Exactly one visible row has `tabindex="0"`; Arrow Up/Down and Home/End move DOM focus through visible rows |
| Focus independence | Moving focus from a nested selected file to its parent directory leaves the same opaque file selected |
| Pointer and activation | Pointer, Enter, and Space use the model transition and emit only the opaque file identity |
| Visible focus | The focused tree item computes to a solid 2px outline; selection remains separately visible through neutral fill and the accent inset edge |

## Rendering and Path-Fidelity Proof

- Modified text content exposes a visible `M` badge with accessible `Modified`, a safe path, pluralized additions/deletions, and `Text` availability.
- Binary content remains in deterministic tree order with visible `A`, safe path, `—`/`Line counts unavailable`, warning shape, and `Unsupported` text.
- Newline path bytes render explicitly as `\n`, not as a visual line break or a selector authority.
- Rename and copy rows retain both complete safe paths and the arrow; the accessible name states the semantic direction in words.
- Two invalid-UTF-8 paths with the same safe `collision/�.ts` display remain two rows. Selecting each produces a different opaque file request.
- Every captured selected-file request is a bodyless, queryless GET whose path matches only `/api/files/file_[A-Za-z0-9_-]{43}`; neither old nor new display path appears in request authority.

## UI-Spec Compliance

- Uses only local Vue components and CSS; no dependency, registry, router, state library, tree package, Monaco surface, or generic component framework was added.
- Consumes the exact locked palette: dominant `#0D1117`, secondary `#161B22`, accent `#2F81F7`, destructive `#F85149`, primary text `#F0F6FC`, secondary text `#8B949E`, border `#30363D`, hover `#21262D`, added `#3FB950`, modified `#D29922`, renamed/copied `#A371F7`, and focus `#58A6FF`.
- Declares the locked 4/8/16/24/32/48/64px spacing tokens and the prescribed system sans/monospace roles.
- Tree rows are at least 40px high. Hover, selection, and focus are structurally distinct.
- Status and availability never rely on color: visible codes/labels, screen-reader expansion, count names, warning shapes, and explicit availability words accompany color.
- This plan does not add the later identity disclosure/state system, selected-file metadata pane/placeholders, narrow Files/Details tabs, modal identity sheet, or Monaco behavior.

## Files Created/Modified

- `src/web/components/FileTree.vue` — owns the immutable model instance, selection emission, roving DOM focus synchronization, full keyboard dispatch, and semantic tree root.
- `src/web/components/DirectoryRow.vue` — recursively renders compacted directories with disclosure state and nested ARIA groups.
- `src/web/components/FileRow.vue` — renders opaque-ID leaves with selected/focused state, safe facts, counts, and availability.
- `src/web/components/StatusBadge.vue` — maps file kinds to visible status codes and accessible expanded labels.
- `src/web/components/PathDisplay.vue` — renders ordinary safe paths and complete accessible rename/copy direction.
- `src/web/App.vue` — composes the file tree into the validated session shell and sends selected opaque capabilities through the existing client.
- `src/web/styles.css` — adds the locked design tokens and dense dark tree, row, state, and focus styling.
- `src/domain/path-bytes.ts` — replaces Node-only byte/base64 and comparison operations with browser-safe equivalents.
- `src/domain/file-tree.ts` — consumes the platform-neutral byte helpers for directory projection and identity.
- `tests/e2e/file-tree.spec.ts` — packages production assets and proves hierarchy, rendering, focus, keyboard, collisions, and request authority through Chromium.

## Decisions Made

- The pure Plan 09 model remains the only owner of expanded directories, visible rows, focused row, and selected file. Vue only renders snapshots and dispatches transitions.
- Directory and file rows are nested semantically rather than presented as a flat visual list, so `group` ancestry and explicit levels are both observable.
- Safe display values are never parsed back into identity. Exact bytes remain in the immutable DTO/model, and opaque IDs alone cross the selection/request boundary.
- Supported rows show a restrained visible `Text` marker so every leaf communicates availability independently of counts or status.
- Selection requests use the existing fixed capability route but do not render metadata, retry, reason-specific placeholders, copy actions, or stale-response state; those remain outside this plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed Node-only Buffer dependency from the browser tree execution path**
- **Found during:** Task 2 (GREEN — compose accessible opaque-ID tree navigation)
- **Issue:** The tested Plan 09 projection decoded and cumpad exact paths with Node `Buffer`. Once the Vue tree executed that model in production browser assets, the packaged tree could not render without a Node global/polyfill.
- **Fix:** Replaced exact-path ownership, base64url conversion, decoding, and bytewise comparison with `Uint8Array`, `btoa`/`atob`, and an explicit lexicographic comparator; the tree projection now consumes those shared helpers.
- **Files modified:** `src/domain/path-bytes.ts`, `src/domain/file-tree.ts`
- **Verification:** The exact packaged Chromium command reaches and passes the complete tree interaction case using production assets and invalid-UTF-8 fixture paths.
- **Committed in:** `7f37388`

**2. [Rule 1 - Bug] Reconciled generated planning progress fields**
- **Found during:** Sequential main closeout
- **Issue:** The required GSD handlers counted 10 summaries and marked DIFF-01 correctly, but reset `STATE.md` frontmatter progress to `0%`, left the visible bar at `26%`, corrupted the Phase 1 roadmap overview columns, and left its detailed row at `9/13` plans and `20/23` requirements.
- **Fix:** Restored the state percentage/bar to 10 of 35 plans (`29%`), restored the Phase 1 overview goal and fixed requirement/plan totals, and reconciled the detailed row to `10/13` plans and `21/23` requirements.
- **Files modified:** `.planning/STATE.md`, `.planning/ROADMAP.md`
- **Verification:** Ten Phase 1 summary files exist, DIFF-01 is checked and marked Complete, the milestone has 10 of 35 completed plans, and Phase 1 has 10 of 13 plan summaries plus 21 of 23 completed requirements.
- **Committed in:** Final planning metadata commit

---

**Total deviations:** 2 auto-fixed (1 blocking issue, 1 generated metadata bug).
**Impact on plan:** Both fixes were required for production-browser execution or truthful planning state. Neither adds a dependency, duplicate model, API, metadata UI, responsive behavior, or later-phase scope.

## Issues Encountered

- The first GREEN attempt remained at the missing-tree assertion because the shared exact-path projection was Node-specific. The platform-neutral byte correction resolved the production-browser blocker.
- A subsequent run reached the rename row and showed that Playwright text-content matching does not include CSS flex gaps around the visual arrow. The behavior assertion was corrected to verify the exact path ends and arrow without treating visual gap layout as literal DOM whitespace.
- The GSD progress handlers returned correct counts but persisted stale/corrupted display fields; closeout reconciled those fields to summary and requirement facts.

## Known Stubs

None. The delivered tree uses the real validated session files, real Plan 09 model, real opaque selection event, and real launch-scoped capability endpoint. The scan found no TODO, FIXME, coming-soon, placeholder, or unimplemented production path.

## Threat Model Verification

- **T-01-23 (rendered-path spoofing):** control characters render visibly escaped, rename/copy direction is stated in words for assistive technology, invalid UTF-8 collisions remain separate, and status/availability meaning never relies on color.
- **T-01-24 (selection tampering):** display paths never become keys, events, route parameters, query fields, or request bodies. Opaque file IDs remain the only selection and capability authority.
- **T-01-SC (dependency tampering):** no dependency, package manifest, lockfile, registry, or external component source changed.
- The plan adds no server endpoint, authentication path, filesystem access, Git command, persistence schema, source mutation, Monaco content access, or new network trust boundary. It consumes the already-authenticated fixed file-capability route.

## User Setup Required

None.

## Next Phase Readiness

- Plan 01-11 can replace the provisional identity area with the full identity/session/empty-state seam without changing file-tree identity or keyboard behavior.
- Plan 01-12 can consume the same opaque selection boundary to render metadata and availability responses, including retry and stale-response handling.
- Plan 01-13 can add the locked responsive tabs/sheet and final accessibility matrix over stable semantic rows and application state.
- No blocker remains for the next dependency-ordered plan.

## Self-Check: PASSED

- All six created files and all four modified production/test files exist.
- RED commit `b960bb7` exists and precedes GREEN commit `7f37388` on `main`.
- The exact plan-scoped packaged command exited `0` with the production Chromium behavior passing.
- The GREEN commit contains no tracked-file deletion.
- DIFF-01 behavior is observable through roles, names, states, focus, pointer/keyboard transitions, displayed facts, distinct collision rows, and opaque request URLs.
- Unrelated `.planning/config.json` and `.planning/forensics/` changes remain untouched and outside both task commits.

---
*Phase: 01-pinned-local-comparison*
*Completed: 2026-07-20*
