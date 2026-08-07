---
status: resolved
trigger: "I launched the diff-review tool to cumpa two branches but the diff showed no files changed"
created: 2026-07-24T08:02:47Z
updated: 2026-07-24T08:16:11Z
---

## Current Focus
<!-- OVERWRITE on each update - always reflects NOW -->

hypothesis: Confirmed and verified — zero files are the intended result for the selected feature-base/master-head order because merge-base equals head.
test: Direct Git inventory commands, built createPinnedComparison in both orders, and focused ordered-picker/native-Git comparison tests.
expecting: Satisfied — observed order returns 0 files; corrected master-base/feature-head order returns the exact 18-file feature inventory; focused tests pass.
next_action: Relaunch operationally with `master` as base and `fix/260723-h9i-extraction-generation` as head; no source edit or TDD regression test is needed.
reasoning_checkpoint:
  hypothesis: Selecting feature as base and ancestor master as head causes a zero-file inventory because the implementation diffs the sole merge base against the selected head, which are the same master commit in this order.
  confirming_evidence:
    - Git resolved the feature to 4b8cec077240c27d8815bcc6c796f79036c27ec9, master to 5e22c4f82fbd5f624d17ae58ee08d305b08af977, and the sole merge base to master.
    - Direct implementation-equivalent Git commands returned zero records for master..master and 18 records for master..feature.
    - Built createPinnedComparison returned the same OIDs and counts: 0 for feature-base/master-head, 18 for master-base/feature-head.
  falsification_test: If createPinnedComparison returned feature files in the observed order, zero files in the reversed order, or OIDs different from direct Git resolution, the ordered-semantics explanation would be false.
  fix_rationale: No source fix is warranted; the operational correction is to choose master as base and the feature branch as head, matching the picker contract that head is the committed state reviewed.
  blind_spots: The browser was not relaunched interactively, but the exact application-layer comparison feeding the browser was executed against the same repository and refs, and the UI receives its inventory from that pinned comparison.
tdd_checkpoint: null

## Symptoms
<!-- Written during gathering, then immutable -->

expected: Comparing master with fix/260723-h9i-extraction-generation in ~/trustlayer/cwt should show the feature branch's changed files.
actual: The browser loaded normally and showed no changed files. The identity header read "fix/260723-h9i-extraction-generation · 4b8cec0 → master · 5e22c4f".
errors: None in the terminal or browser.
reproduction: Run Diff Review in ~/trustlayer/cwt, choose fix/260723-h9i-extraction-generation as base and master as head, confirm, and inspect the file list.
started: First attempt with this branch pair.

## Eliminated
<!-- APPEND only - prevents re-investigating after /clear -->

- hypothesis: The picker or launch handoff swapped the selected feature base and master head.
  evidence: src/cli/picker.ts returns the first choice as base and second as head, src/cli/run.ts forwards those roles unchanged, and the browser identity header matches the independently resolved short OIDs in that same order.
  timestamp: 2026-07-24T08:12:41Z

- hypothesis: The changed-file parser, `.diff-review` path filter, API serialization, or browser UI discarded valid Git records.
  evidence: The implementation-equivalent raw and numstat Git commands for the observed order already returned zero bytes, before parsing or presentation; the same application layer parsed all 18 records in the reversed order.
  timestamp: 2026-07-24T08:16:11Z

- hypothesis: The cumpad repository lacked the feature branch changes or the displayed identities were stale/wrong.
  evidence: Direct ref resolution matched the displayed short OIDs, and direct Git plus createPinnedComparison both returned the same 18 changed paths when only base/head order was reversed.
  timestamp: 2026-07-24T08:16:11Z

## Evidence
<!-- APPEND only - facts discovered during investigation -->

- timestamp: 2026-07-24T08:08:57Z
  checked: Ordered selection handoff in src/cli/picker.ts:240-320 and src/cli/run.ts:368-384.
  found: The first picker choice is returned as base and the second as head; run.ts passes selected.base to createDescriptor.base and selected.head to createDescriptor.head without swapping them. Prompt text explicitly defines base as the merge-base comparison side and head as the committed state reviewed.
  implication: The identity header's feature -> master order reflects the user's selections; no picker-to-comparison role inversion is present.

- timestamp: 2026-07-24T08:08:57Z
  checked: Ref pinning and merge-base flow in src/git/comparison.ts:150-315.
  found: Each selection is resolved independently with `git rev-parse --verify --end-of-options <revision>^{commit}`; then Git runs `git merge-base --all <baseOid> <headOid>`. The resulting base/head OIDs and labels are preserved in the pinned comparison.
  implication: Runtime Git evidence can directly test whether the displayed short OIDs and merge-base correspond to the observed order.

- timestamp: 2026-07-24T08:08:57Z
  checked: Changed-file inventory in src/git/inventory.ts:137-219.
  found: Inventory executes `git diff --raw -z --no-abbrev --find-renames=50% --find-copies=50% --find-copies-harder --no-ext-diff --no-textconv <mergeBaseOid> <headOid> --` and an equivalent `git diff --numstat -z ... <mergeBaseOid> <headOid> --`; it intentionally does not diff baseOid directly.
  implication: Under PR-style semantics, reversing base/head can change the inventory even though `git merge-base` itself is symmetric.

- timestamp: 2026-07-24T08:12:41Z
  checked: Full endpoint and merge-base OIDs in /Users/alessandro/trustlayer/cwt.
  found: `git rev-parse --verify --end-of-options 'fix/260723-h9i-extraction-generation^{commit}'` returned `4b8cec077240c27d8815bcc6c796f79036c27ec9`; the same command for `master^{commit}` returned `5e22c4f82fbd5f624d17ae58ee08d305b08af977`; `git merge-base --all 4b8cec077240c27d8815bcc6c796f79036c27ec9 5e22c4f82fbd5f624d17ae58ee08d305b08af977` returned `5e22c4f82fbd5f624d17ae58ee08d305b08af977`.
  implication: The identity header OIDs are accurate, and master is the merge base (therefore an ancestor of the feature tip).

- timestamp: 2026-07-24T08:12:41Z
  checked: Implementation-equivalent inventory commands for the observed feature-base/master-head order.
  found: Both `git diff --raw -z --no-abbrev --find-renames=50% --find-copies=50% --find-copies-harder --no-ext-diff --no-textconv 5e22c4f82fbd5f624d17ae58ee08d305b08af977 5e22c4f82fbd5f624d17ae58ee08d305b08af977 --` and `git diff --numstat -z --find-renames=50% --find-copies=50% --find-copies-harder --no-ext-diff --no-textconv 5e22c4f82fbd5f624d17ae58ee08d305b08af977 5e22c4f82fbd5f624d17ae58ee08d305b08af977 --` returned no output.
  implication: The empty inventory exists in Git before application parsing, filtering, API serialization, or UI rendering.

- timestamp: 2026-07-24T08:12:41Z
  checked: Implementation-equivalent inventory commands for the reversed master-base/feature-head order.
  found: The raw and numstat commands with `5e22c4f82fbd5f624d17ae58ee08d305b08af977 4b8cec077240c27d8815bcc6c796f79036c27ec9` returned 18 records. A matching human-readable `git diff --name-status --find-renames=50% --find-copies=50% --find-copies-harder --no-ext-diff --no-textconv 5e22c4f82fbd5f624d17ae58ee08d305b08af977 4b8cec077240c27d8815bcc6c796f79036c27ec9 --` listed 16 modified and 2 added files: `apps/api/src/modules/distiller/lib/finalize-extraction.test.ts`, `apps/api/src/modules/distiller/lib/finalize-extraction.ts`, `apps/api/src/modules/document/document.controller/update-document-with-extracted-data.ts`, `apps/api/src/modules/document/lib/start-extraction.test.ts`, `apps/api/src/modules/document/lib/start-extraction.ts`, `apps/api/src/modules/document/resolvers/mutations/reprocess-document.test.ts`, `apps/api/src/modules/document/resolvers/mutations/reprocess-document.ts`, `apps/api/src/temporal/activities/document-extraction/finalize-extraction.ts`, `apps/api/src/temporal/activities/document-extraction/match-ai-requirements.test.ts`, `apps/api/src/temporal/activities/document-extraction/match-ai-requirements.ts`, `apps/api/src/temporal/activities/document-extraction/process-extraction-result.test.ts` (added), `apps/api/src/temporal/activities/document-extraction/process-extraction-result.ts`, `apps/api/src/temporal/activities/document-extraction/stop-document-processing.test.ts` (added), `apps/api/src/temporal/activities/document-extraction/stop-document-processing.ts`, `apps/api/src/temporal/workflows/extract-document.ts`, `packages/core/src/index.ts`, `packages/core/src/lib/distiller/start-extraction.ts`, and `packages/core/src/lib/documents/update-documents.ts`.
  implication: Reversing only the ordered roles produces the expected feature inventory; the repository data is present and Git's ordered PR-style comparison explains the difference.

- timestamp: 2026-07-24T08:14:31Z
  checked: Built application-layer `createPinnedComparison` against /Users/alessandro/trustlayer/cwt with both ordered selections.
  found: Feature-base/master-head pinned base `4b8cec077240c27d8815bcc6c796f79036c27ec9`, head and merge base `5e22c4f82fbd5f624d17ae58ee08d305b08af977`, `hasCommittedChanges: false`, and 0 files. Master-base/feature-head pinned the same endpoint OIDs in reverse, retained merge base `5e22c4f82fbd5f624d17ae58ee08d305b08af977`, set `hasCommittedChanges: true`, and returned the same 18-file inventory as direct Git.
  implication: The behavior is correct end to end through the application comparison layer; this is an operational selection-order issue, not a source defect, so TDD mode does not require or justify a failing regression test.

- timestamp: 2026-07-24T08:16:11Z
  checked: Focused verification command `node node_modules/vitest/vitest.mjs run tests/cli/selection.test.ts tests/git/pinned-comparison.test.ts`.
  found: 2 test files passed; 8 tests passed.
  implication: Existing ordered selection and pinned native-Git contracts agree with the real-repository counterfactual; no regression was introduced and no source defect exists to drive a TDD red phase.

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: The ordered comparison was launched backwards for the user's intent. Diff Review defines base as the merge-base side and head as the committed state under review. With feature `4b8cec077240c27d8815bcc6c796f79036c27ec9` selected as base and its ancestor master `5e22c4f82fbd5f624d17ae58ee08d305b08af977` selected as head, the sole merge base equals head, so the inventory is the valid empty diff `master..master`.
fix: Operational only — relaunch and select `master` as base, then `fix/260723-h9i-extraction-generation` as head. No production or test source change is appropriate.
verification: Direct Git raw/numstat inventories returned 0 records for merge-base/head `5e22c4f82fbd5f624d17ae58ee08d305b08af977..5e22c4f82fbd5f624d17ae58ee08d305b08af977` and 18 records for corrected `5e22c4f82fbd5f624d17ae58ee08d305b08af977..4b8cec077240c27d8815bcc6c796f79036c27ec9`; built createPinnedComparison returned the same 0/18 results; focused Vitest verification passed 2 files and 8 tests.
files_changed: [.planning/debug/empty-branch-comparison.md]
