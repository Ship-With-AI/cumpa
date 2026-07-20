---
phase: 01-pinned-local-comparison
plan: 09
subsystem: file-tree-model
status: complete
tags: [file-tree, exact-paths, navigation, accessibility, vitest, tdd]

requires:
  - phase: 01-pinned-local-comparison
    plan: 06
    provides: Byte-exact changed-file records, deterministic path comparison, and opaque file IDs
  - phase: 01-pinned-local-comparison
    plan: 08
    provides: Strict metadata-only SessionFile DTOs with frozen opaque capabilities
provides:
  - Pure deterministic projection from immutable SessionFile records to hierarchical directory and file nodes
  - Exact-byte ordering with old-path and opaque-ID tie breaks
  - Single-directory/no-file chain compaction without loss of exact path identity
  - Pure expanded-directory, visible-row, roving-focus, and selected-file navigation state
  - Focused deterministic coverage for file kinds, path bytes, collisions, empty state, and keyboard transitions
affects: [01-10, 01-12, Phase 2 changed-file navigation]

tech-stack:
  added: []
  patterns:
    - Keep exact path bytes and opaque file IDs authoritative while display values remain presentation-only
    - Derive immutable tree and navigation snapshots through pure transitions without DOM or request authority
    - Keep directory focus independent from selected file identity

key-files:
  created:
    - src/domain/file-tree.ts
    - src/web/model/file-tree.ts
    - tests/unit/file-tree.test.ts
  modified: []

key-decisions:
  - "Effective path is newPath for additions, renames, and copies; oldPath for deletions; and newPath with oldPath fallback for other changed records."
  - "Directory chains compact only while a node has exactly one directory child and no file child; projected directory paths retain the full exact-byte prefix."
  - "Keyboard focus may rest on a directory, but selectedFileId changes only when focus reaches a file leaf."

patterns-established:
  - "Tree identity: file leaves retain the original SessionFile object, opaque fileId, and exact effective path object."
  - "Navigation identity: visible rows use deterministic internal row IDs while file selection remains exclusively opaque-file-ID based."
  - "Immutable transitions: expansion, focus, selection, and visible rows return frozen snapshots and leave prior snapshots unchanged."

requirements-completed: []

duration: 15min
completed: 2026-07-20
---

# Phase 01 Plan 09: Pure File-Tree Projection and Navigation Summary

**Immutable changed-file records now project into an exact-byte-ordered compact tree whose pure visible-row state preserves opaque file selection through expansion and complete keyboard navigation.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-20T14:31:24Z
- **Completed:** 2026-07-20T14:46:54Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments

- Added `buildFileTree`, a pure projection over readonly `SessionFile` records that chooses the status-correct effective path, orders records bytewise, applies exact old-path and opaque-ID tie breaks, builds directory ancestry, and freezes every projected node and array.
- Added chain compaction that joins only exactly-one-directory/no-file paths. Mixed file/directory nodes and multi-directory branches remain structurally expanded.
- Preserved the original immutable file record, opaque `fileId`, old/new `ExactPath` objects, and effective path on every leaf; directory segments and full prefixes are recreated from exact bytes rather than display strings.
- Added `createFileTreeModel`, which starts fully expanded with the first deterministic leaf selected, derives visible rows and depth, and returns pure immutable transitions for focus, expansion, collapse, and keyboard movement.
- Kept roving focus and file selection separate: directory focus, directory collapse, `Home`, and parent traversal never replace selection with a directory.
- Covered additions, deletions, renames, copies, mode-only records, exact duplicate destinations, display collisions, invalid UTF-8 bytes, tabs, newlines, leading dashes, deep compaction, branching, empty comparisons, and keyboard boundaries.

## Task Commits

The plan followed the required atomic RED then GREEN sequence:

1. **Task 1: RED — specify deterministic tree projection and navigation** — `ae96086` (`test(01-09): specify pure file-tree model`)
2. **Task 2: GREEN — implement the identity-preserving tree model** — `49e6a3b` (`feat(01-09): implement pure file-tree model`)

No separate refactor commit was necessary; the GREEN implementation leaves projection and navigation in their owning pure modules with no browser component or request behavior.

## TDD Evidence

### RED — `ae96086`

The exact plan command ran after the behavioral contract and typed temporary seams were present:

```text
npm run test:unit -- tests/unit/file-tree.test.ts
```

It exited `1`. All 9 named file-tree tests reached the production projection or navigation call and failed on the intentional missing-behavior errors in `buildFileTree` or `createFileTreeModel`; there was no fixture, static-import, dependency, or test-discovery failure.

### GREEN — `49e6a3b`

The same exact command exited `0` after implementation:

```text
Test Files  3 passed (3)
Tests       34 passed (34)
```

The repository's focused unit adapter retains its existing `tests/unit` category root, so the command ran the named file plus the two existing unit files. No Git, API, package, Playwright, formatter, linter, build, or project-wide suite was run.

Git history proves gate order:

```text
49e6a3b feat(01-09): implement pure file-tree model
ae96086 test(01-09): specify pure file-tree model
```

## Projection Contract and Symbols

### `buildFileTree(files)`

The exported domain function accepts only readonly `SessionFile` records and returns readonly `FileTreeNode` arrays:

- `FileTreeLeaf` retains `fileId`, the original `file` reference, and the exact `effectivePath` object.
- `FileTreeDirectory` retains a deterministic byte-derived `directoryId`, the exact full directory `path`, the exact compacted `segments`, and readonly `children`.
- No record, exact path, display value, or input array is mutated.
- Missing status-required effective paths fail explicitly instead of selecting a display path or fabricating identity.

Effective-path policy is deterministic:

| Record | Effective path |
|---|---|
| Added | exact `newPath` |
| Renamed | exact `newPath` |
| Copied | exact `newPath` |
| Deleted | exact `oldPath` |
| Modified, type-changed, unsupported | exact `newPath`, falling back to exact `oldPath` |

Ordering compares exact effective bytes first, exact old-path bytes second, and opaque file IDs third. The hierarchy orders each directory at the position of its first exact-byte-sorted leaf, then emits that directory before its descendants. This preserves global leaf order even at delimiter edges such as `src-early.ts` versus `src/a-added.ts`.

### `createFileTreeModel(files)`

The exported browser-model function composes `buildFileTree` without rendering or fetching. Its frozen snapshot exposes:

- `tree`
- `visibleRows`
- `expandedDirectoryIds`
- `focusedRowId`
- `selectedFileId`
- `focusRow(rowId)`
- `toggleDirectory(directoryId)`
- `handleKey(key)`

All directories begin expanded. Initial focus and selection target the first deterministic file leaf, never a directory. Empty comparisons produce an empty, total no-op model with null focus and selection.

## Ordering, Compaction, and Collision Proof

The table-driven fixtures establish the following invariants:

- Added, renamed, mode-only modified, copied, and deleted records sort by effective exact path independent of input order.
- Two copies with the same exact destination sort by exact old-source bytes.
- Two records with identical old and new paths remain distinct and deterministically order by opaque file ID.
- Invalid UTF-8 paths whose safe displays both render as the replacement character remain distinct leaves with their own exact base64url bytes and file IDs.
- Newline and tab bytes survive through directory prefix projection; a leading dash remains an ordinary path byte rather than control authority.
- `deep/one/two/leaf.ts` compacts to one directory row with three exact segments.
- `mixed/root.ts` plus `mixed/only/chain/leaf.ts` keeps `mixed` un-compacted because it has a file child, while `only/chain` compacts below it.
- `branched/left/leaf.ts` and `branched/right/leaf.ts` keep the two child directories distinct because the parent has more than one directory child.
- Directory rows always precede their own visible descendants.

## Navigation Transition Proof

The focused navigation fixtures establish:

| Input | Transition |
|---|---|
| `ArrowUp` / `ArrowDown` | Moves one visible row, stopping at boundaries; selection follows only file destinations |
| `Home` / `End` | Moves to first or last visible row; a directory destination preserves prior file selection |
| `ArrowRight` on collapsed directory | Expands it and retains directory focus and file selection |
| `ArrowRight` on expanded directory | Enters its first visible child; selects it only when it is a file |
| `ArrowLeft` on expanded directory | Collapses it without replacing selected file identity |
| `ArrowLeft` on collapsed directory or file | Moves to its parent directory while preserving selected file identity |
| `Enter` / `Space` on directory | Toggles expansion without selecting the directory |
| Focus of display-colliding file row | Selects solely by that row's opaque file ID |

Collapsing a subtree may hide the selected file row, but it does not reinterpret selection as a directory or another visible path. Re-expansion restores the same projected identities.

## Files Created

- `src/domain/file-tree.ts` — exact-byte hierarchy construction, deterministic ordering, strict effective-path selection, and chain compaction.
- `src/web/model/file-tree.ts` — frozen visible-row projection and pure focus, expansion, selection, and keyboard transitions.
- `tests/unit/file-tree.test.ts` — deterministic projection, path-edge, collision, compaction, empty-state, and navigation contract.

## Decisions Made

- Display strings never participate in hierarchy grouping, ordering, row identity, or selection. Exact bytes and opaque IDs remain authoritative.
- Directory compaction is structural and conservative: one directory child plus zero file children only.
- Selection and focus are deliberately separate state fields so accessibility-oriented directory focus cannot corrupt selected file metadata authority.
- The model starts fully expanded because Phase 1 requires the first changed entry selected and a deterministic immediately navigable tree; later components can collapse through the same pure transition API.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected generated planning progress fields**
- **Found during:** Sequential main closeout
- **Issue:** The required GSD progress handlers counted 9 summaries correctly but left `STATE.md` frontmatter at `0%`, its visible bar at `20%`, corrupted the Phase 1 overview row columns, and left the detailed roadmap row at `7/13` plans and `18/23` requirements.
- **Fix:** Reconciled the state bar to 9/35 (`26%`), restored the Phase 1 overview goal and fixed totals, and updated the detailed progress row to `9/13` plans and the current `20/23` completed requirement facts.
- **Files modified:** `.planning/STATE.md`, `.planning/ROADMAP.md`
- **Verification:** Summary count is 9, total plan count is 35, and current checked requirement facts are 20 of the 23 Phase 1 requirements.
- **Committed in:** Plan metadata commit

---

**Total deviations:** 1 auto-fixed (1 generated metadata consistency bug).
**Impact on plan:** Planning metadata only; production and test scope remained exactly the three planned pure-model files.

## Issues Encountered

The GSD progress handler returned correct counts but persisted stale/corrupted display fields; closeout reconciled those fields without changing requirement ownership. The RED suite otherwise failed for the intended missing behavior, and GREEN passed without fixture, dependency, or import correction.

## Known Stubs

None. The RED-only missing-behavior seams were removed. A case-insensitive scan of all three delivered files found no `TODO`, `FIXME`, placeholder, coming-soon, not-implemented, or not-available marker.

## Threat Model Verification

- **T-01-22:** File leaves retain their exact `oldPath`/`newPath` data and opaque `fileId`; effective paths are selected from those exact values. Display strings never drive grouping, sorting, focus, or selection.
- **T-01-SC:** No dependency, lockfile, registry, network, or package-install change was made.
- The pure modules add no endpoint, filesystem access, Git invocation, DOM authority, browser rendering, authentication path, schema boundary, persistence, or source-write surface.

## User Setup Required

None.

## Next Phase Readiness

- Plan 01-10 can render the tested immutable tree and metadata selection contract without inventing path identity, expansion, or keyboard behavior inside Vue components.
- Plan 01-12 can reuse the same opaque selected-file identity for supported and unsupported metadata states.
- No Monaco editor, code diff, router, component rendering, request authority, persistence, comment, or export behavior was introduced prematurely.
- No blocker remains for the next dependency-ordered plan.

## Self-Check: PASSED

- All three planned source and test files exist.
- RED commit `ae96086` exists and precedes GREEN commit `49e6a3b` on `main`.
- Final exact focused unit command exited `0` with all 34 tests in the existing unit category passing.
- No tracked file deletion was present in the GREEN commit.
- Unrelated `.planning/config.json` and `.planning/forensics/` changes remain untouched and outside both task commits.

---
*Phase: 01-pinned-local-comparison*
*Completed: 2026-07-20*
