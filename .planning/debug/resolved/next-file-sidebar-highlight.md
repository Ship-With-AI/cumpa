---
status: resolved
trigger: "when I click on the button to go to the next file, on the files sidebar it is always highlighted the first file. Instead the highlithed file should be always the one into view"
created: 2026-08-08T14:22:53Z
updated: 2026-08-08T14:59:22Z
---

## Current Focus
<!-- OVERWRITE on each update - always reflects NOW -->

hypothesis: CONFIRMED — FileTree's internal selectedFileId was not synchronized from App's selected-file prop.
test: The focused two-file Chromium flow asserts both the comparison heading and sidebar aria-selected state after Next.
expecting: src/second.ts is both in view and selected in the sidebar after Next.
next_action: none — focused browser regression is GREEN.
reasoning_checkpoint:
 hypothesis: FileTree left the first sidebar row highlighted because its independently created model never consumed the parent's selected-file prop.
 confirming_evidence:
 - Browser trace simultaneously showed src/second.ts in view and src/first.ts highlighted before the fix.
 - FileTree created its model from files alone; createFileTreeModel selected the first leaf and no watcher consumed initialSelectedFileId.
 - The focused RED assertion reached src/second.ts but observed aria-selected="false" on its row.
 - Synchronizing selectedFileId from the prop made the same assertion GREEN without changing navigation or emitting a selection loop.
 falsification_test: If direct, non-emitting model synchronization from the prop had left the focused assertion RED, the dual-source-of-truth mechanism would have been wrong.
 fix_rationale: Updating only model.selectedFileId at the parent-to-child boundary makes the parent authoritative without replaying a child select event or resetting focus and expansion state.
 blind_spots: none for the reported two-file Next flow.
tdd_checkpoint:
 test_file: tests/integration/anchored-workspace.spec.ts
 test_name: diff navigation and session state
 status: green
 failure_output: null

## Symptoms
<!-- Written during gathering, then immutable -->

expected: The highlighted file in the sidebar always matches the file currently in view.
actual: Clicking the Next-file button changes the file in view, but the first sidebar file remains highlighted.
errors: None observed.
reproduction: Open a comparison with multiple files, then click the Next-file button.
started: Unknown.

## Eliminated
<!-- APPEND only - prevents re-investigating after /clear -->

- hypothesis: The workspace next-file reducer chooses the wrong file or fails to issue load-file.
  evidence: The focused end-to-end scenario navigated from src/first.ts to src/second.ts and rendered the second file after the Next-file click.
  timestamp: 2026-08-08T14:41:13Z
- hypothesis: Async content loading races and restores the first sidebar selection.
  evidence: App.loadFile sets selectedFile synchronously before the content request, while FileTree has no async dependency and never consumes the changed selection prop.
  timestamp: 2026-08-08T14:41:13Z
- hypothesis: CSS or row rendering highlights the wrong row despite correct selection state.
  evidence: FileRow derives both aria-selected and tree-row--selected from the same selected boolean; the trace shows the first row selected while the second row and heading render normally.
  timestamp: 2026-08-08T14:41:13Z

## Evidence
<!-- APPEND only - facts discovered during investigation -->


- timestamp: 2026-08-08T14:28:27Z
  checked: Existing Graphify graph availability.
  found: graphify-out/graph.json does not exist.
  implication: Use the indexed GitNexus graph and targeted source search instead of rebuilding a repository graph.

- timestamp: 2026-08-08T14:29:14Z
  checked: GitNexus repository index.
  found: The current diff-review checkout is not indexed; only unrelated trustlayer-cwt repositories are available.
  implication: The execution flow must be located with narrowly scoped source search.

- timestamp: 2026-08-08T14:30:28Z
  checked: Targeted search for Next-file controls and sidebar selected/active state.
  found: App.vue dispatches a workspace next-file action and owns selectedFile; FileTree.vue owns model.selectedFileId and uses it to mark rows selected.
  implication: A parent-to-child synchronization boundary exists and is the highest-probability divergence point; direct source tracing is needed to distinguish it from reducer or async loading faults.

- timestamp: 2026-08-08T14:32:04Z
  checked: App.vue file navigation and rendering flow.
  found: nextFile dispatches next-file; the workspace emits load-file; loadFile synchronously replaces selectedFile before fetching content. The heading and toolbar derive directly from selectedFile. FileTree receives selectedFile.fileId only through a prop named initialSelectedFileId.
  implication: The reducer and asynchronous content request are not required for the observed mismatch: parent selectedFile changes immediately and renders the next heading, while sidebar synchronization depends entirely on how FileTree handles the initial-only prop.

- timestamp: 2026-08-08T14:33:12Z
  checked: Complete FileTree.vue component and FileTree model selection logic.
  found: FileTree declares initialSelectedFileId but never reads it when creating or updating its model. createFileTreeModel always selects the first visible file. The only model mutations come from file-list replacement or interaction inside the tree.
  implication: Any external selection change, including Next-file, leaves the sidebar model at its first-file default. This directly supports a dual-source-of-truth/state-synchronization root cause and weakens async-loading and reducer hypotheses.

- timestamp: 2026-08-08T14:35:04Z
  checked: FileRow's selected marker and existing file-tree browser coverage.
  found: The visual highlight is directly observable as aria-selected=true and tree-row--selected. The file-tree e2e test verifies tree-internal clicks update this marker, but never exercises an external Next-file selection.
  implication: Tree-local selection works; missing coverage is specifically parent-driven selection, which distinguishes the suspected synchronization defect from row rendering or CSS defects.

- timestamp: 2026-08-08T14:36:05Z
  checked: Existing Next-file integration scenario.
  found: tests/integration/anchored-workspace.spec.ts has a deterministic two-file Vite fixture and a focused test that clicks Next file and asserts the heading becomes src/second.ts.
  implication: The existing scenario can reproduce the navigation half of the bug; trace inspection can observe the sidebar selection without writing the manager-owned regression test.

- timestamp: 2026-08-08T14:38:05Z
  checked: Focused Playwright test tests/integration/anchored-workspace.spec.ts --grep "diff navigation and session state" with trace enabled.
  found: The single deterministic browser scenario passed in 4.1 seconds and recorded a trace; its existing assertion confirms Next file changes the visible h1 to src/second.ts.
  implication: Next-file dispatch, reducer transition, load-file command, content fetch, and parent rendering all work in the reproduction fixture; remaining observation is the sidebar marker in the same trace.

- timestamp: 2026-08-08T14:40:29Z
  checked: Post-click Playwright trace frame from the deterministic two-file browser fixture.
  found: The rendered comparison heading shows src/second.ts while the blue selected highlight remains on sidebar row src/first.ts; src/second.ts is unhighlighted.
  implication: The reported bug is directly reproduced before any source/test change. Because both rows render correctly in the same frame, this is state divergence rather than CSS, visibility, or path-label ambiguity.

- timestamp: 2026-08-08T14:48:03Z
  checked: Focused RED run with `npx playwright test tests/integration/anchored-workspace.spec.ts --grep "diff navigation and session state"`.
  found: The single Chromium scenario failed at the new post-Next assertion in tests/integration/anchored-workspace.spec.ts:468. The src/second.ts treeitem resolved normally but had aria-selected="false"; Playwright expected "true". The preceding heading assertion for src/second.ts passed.
  implication: The regression test is RED for the confirmed stale sidebar-selection mismatch, not fixture, launch, locator, or navigation setup noise.

- timestamp: 2026-08-08T14:59:22Z
  checked: Focused GREEN browser run with `npx playwright test tests/integration/anchored-workspace.spec.ts --grep "diff navigation and session state"`.
  found: The single Chromium scenario passed in 3.2s. It rendered the first file as initially selected, clicked Next, rendered the src/second.ts comparison heading, and observed aria-selected="true" on the src/second.ts sidebar treeitem.
  implication: The actual browser flow now keeps the sidebar highlight synchronized with the file in view, and the focused regression is GREEN.
## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: App owns the viewed file in selectedFile and passes its id to FileTree as initialSelectedFileId, but FileTree never uses or watches that prop. Instead, createFileTreeModel independently initializes model.selectedFileId to the first visible leaf. Next-file updates App.selectedFile and the heading to the next file, but FileTree's internal model remains on the first file, so FileRow keeps aria-selected and tree-row--selected on that row.
fix: Added a non-emitting FileTreeModel.selectFile operation that preserves focus and expanded directories, and watched the existing initialSelectedFileId prop in FileTree so parent-driven navigation synchronizes the internal sidebar selection. Added one assertion to the existing deterministic browser scenario.
verification: RED before the fix observed src/second.ts in view with aria-selected="false". GREEN after the fix ran the same focused Chromium scenario and passed: the initial first-file selection moved to src/second.ts after clicking Next while its heading was visible.
files_changed: [src/web/components/FileTree.vue, src/web/model/file-tree.ts, tests/integration/anchored-workspace.spec.ts]
